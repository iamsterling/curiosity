# Affinity Designer text system: evidence-grounded study

**Date:** 2026-08-15
**Decision served:** establish what Affinity Designer’s publicly observable text
surface demonstrates, and where its public record is insufficient, before a
separate Crafty text decision. This report deliberately does **not** propose a
Crafty design or implementation.
**Scope:** Affinity Designer 2 documentation and publicly described file/import
behaviour; artistic, frame, shape and path text; type features; interoperability.
**Confidence vocabulary:** **confirmed fact** = directly documented or inspected;
**highly credible inference** = a constrained conclusion from evidence; **hypothesis
to verify** = plausible but unsupported by a suitable source.

## Frame, plan, and stop rule

### Sub-question tree and depth budget

| Branch | Question | Depth budget | Evidence target |
|---|---|---:|---|
| 1 | Which text object kinds and editing/reflow behaviours ship? | 3 | Affinity help |
| 2 | Which character, paragraph, style and font-variation state is exposed? | 3 | Affinity help + OpenType spec |
| 3 | What can be said about shaping, bidi, complex scripts and vertical text? | 3 | Affinity help; Unicode standards; explicitly identify gaps |
| 4 | How are missing fonts, interchange and export fidelity handled? | 3 | Affinity help; file-import evidence |
| 5 | What is known about persistence, platform/version and performance? | 2 | public product material; importer evidence; negative findings |

**Effort tier:** targeted deep research. **Revisable plan:** (1) read the legacy
Designer 2 first-party help for the visible model; (2) trace font and Unicode
claims to their standards rather than infer an engine; (3) use the Inkscape
importer’s documented limitations only as file-format/interoperability evidence;
(4) check the product-version boundary introduced by Canva; (5) stop when each
branch has primary evidence or a named unknown.

### Research-loop synthesis and curiosity pass

* **Pass 1 — official help:** confirms distinct art/frame/path/shape objects,
  editable text, flowing/reflowing text, text styles, OpenType and variable-font
  controls. It does **not** name a shaping engine, layout algorithm, file schema,
  performance method, or bidi/vertical conformance.
* **Curiosity candidates:** (a) recover undocumented schema fields; (b) establish
  Arabic/RTL support from forum anecdotes; (c) test an installed application;
  (d) distinguish the post-Canva product. Scoring favoured (d) and publicly
  inspectable importer evidence: they materially affect freshness and fidelity at
  low cost. (a) needs sample files and staged clean-room probing; (b) would remain
  anecdotal without staff or reproducible testing; (c) is unavailable in this
  research-only environment.
* **Pass 2 — standards and importer evidence:** OpenType and Unicode explain what
  the exposed controls *could* require, while the Inkscape importer documents
  partial recovery of text kinds and the specific non-fidelities it did not yet
  support. Neither identifies Affinity’s internal engine.
* **Stop check:** all requested branches are answered or explicitly unknown.
  Additional browsing added no independent disclosure of a shaping engine, text
  schema, renderer/export architecture, or benchmark. Stop on saturation and
  coverage; an execution-based follow-up is the only high-value next step.

## Executive summary

1. **Confirmed fact:** legacy Affinity Designer 2 exposes four visibly distinct
   text-container modes: artistic, frame, path and shape text. Art text is
   object-like scalable text; frame/shape text is constrained flow; path text
   attaches to a curve/shape and reflows as that geometry changes.
   [Affinity: Working with text](https://affinity.help/designer2/English.lproj/pages/Text/text_general.html),
   [artistic text](https://affinity.help/designer2/English.lproj/pages/Text/artText.html),
   [frame text](https://affinity.help/designer2/English.lproj/pages/Text/frameText.html),
   [path text](https://affinity.help/designer2/English.lproj/pages/Text/pathText.html).
2. **Confirmed fact:** text is not merely outlined display geometry while editable:
   it carries character and paragraph attributes, local range formatting, and
   named style hierarchies. Converting art text to curves deliberately removes
   standard text attributes. [Affinity: character formatting](https://affinity.help/designer2/English.lproj/pages/Text/characters.html),
   [text style types](https://affinity.help/designer2/English.lproj/pages/Text/textStyles_types.html),
   [artistic text](https://affinity.help/designer2/English.lproj/pages/Text/artText.html).
3. **Confirmed fact:** the public UI exposes font family/style/size, kerning,
   tracking, baseline, leading override, transforms, decorations, language-script
   selection for OpenType rules, OpenType feature controls and variable-font axes.
   Affinity says PDF export makes a fixed static instance for each used variable
   font setting. [Affinity: Character panel](https://affinity.help/designer2/English.lproj/pages/Panels/characterPanel.html),
   [variable fonts](https://affinity.help/designer2/English.lproj/pages/Text/variableFonts.html),
   [OpenType features](https://affinity.help/designer2/English.lproj/pages/Text/opentype_fonts.html).
4. **Highly credible inference:** the observable system has a shared text/story
   representation plus container-specific layout constraints, rather than storing
   each art/frame/path form as only paths. This follows from conversion between
   art and frame text with retained range formatting, reuse of character/paragraph
   controls across kinds, and live path reflow. It is **not** evidence of a
   particular internal class hierarchy or layout engine.
5. **Unknown:** no first-party source inspected identifies the shaping library,
   Unicode/Bidi conformance level, fallback chain/selection policy, line-breaking
   algorithm, precise measurement API, GPU glyph strategy, text cache policy,
   native `.afdesign` text schema, or text-export preservation policy.
6. **Version qualification:** the V2 help is evidence for the legacy Designer 2
   product, not a warranty for the current post-Canva application. Canva’s current
   announcement describes an “all-new Affinity” for Mac/Windows and says iPad is
   coming soon; it does not disclose a text-system migration or compatibility
   contract. [Canva announcement](https://www.canva.com/newsroom/news/all-new-affinity/).

## Findings with evidence

### 1. Object model, constraints, editing and measurement

| Area | Evidence-grounded finding | Confidence / observation verdict |
|---|---|---|
| Artistic text | A click or drag creates text at a default or custom initial size. It can be resized as an object; the documented result stretches/contracts text and updates relative font size. It can convert to frame text or to curves (irreversibly for normal text attributes). [Source](https://affinity.help/designer2/English.lproj/pages/Text/artText.html) | **Confirmed fact. Deferred:** a comparison signal, not a transferable internal model. |
| Frame and shape text | A dragged rectangular frame, or a converted closed curve/shape, holds flow text. The UI distinguishes reflow resize, scale resize, fit-to-content, vertical alignment and invisible overflow; Publisher-modified documents may retain multi-column content until removed in Designer. [Source](https://affinity.help/designer2/English.lproj/pages/Text/frameText.html); [shape text](https://affinity.help/designer2/English.lproj/pages/Text/shapeText.html) | **Confirmed fact. Adapted lesson:** container geometry and text scaling are separate user-visible operations; the actual representation is undisclosed. |
| Path text | A selected line/curve/shape is converted to a path text object; the original object is discarded. It has section start/end handles, a per-section baseline distance, reversal, a second path/handle pair for overflow, and live reflow when the path is reshaped. It can separately hide secondary-path overflow. [Source](https://affinity.help/designer2/English.lproj/pages/Text/pathText.html) | **Confirmed fact. Adapted lesson:** a path-binding has its own placement/overflow controls, not only a transform. Do not infer the numerical path-placement algorithm. |
| Text editing | Affinity documents caret/range selection, word/line/paragraph selection, drag-and-drop selected text, insertion/overwrite, paste and placement of RTF/TXT. [Sources](https://affinity.help/designer2/English.lproj/pages/Text/text_general.html), [import text](https://affinity.help/designer2/English.lproj/pages/Text/importText.html) | **Confirmed fact. Deferred:** no public IME, composition, grapheme-navigation, undo-unit or accessibility disclosure was found. |
| Measurement/layout | Paragraph UI exposes alignment, four justification last-line modes, leading modes, indents, paragraph spacing and tab stops. [Source](https://affinity.help/designer2/English.lproj/pages/Panels/paragraphPanel.html) | **Confirmed fact** for exposed controls; **unknown** for line breaking, hyphenation, overflow measurement, bounds semantics, precision and incremental invalidation. |

### 2. Text schema and typography surface

**Confirmed fact:** character attributes include face/size/style, font variation,
fill/background, underline/strikethrough and independently coloured decoration,
outline stroke, kerning/tracking in thousandths of an em, baseline, leading
override, shear, horizontal/vertical scale, super/subscript and no-break. The
same panel exposes standard ligatures, contextual alternates, ordinals, fractions,
case, character variants, stylistic sets and swash. [Affinity: Character panel](https://affinity.help/designer2/English.lproj/pages/Panels/characterPanel.html).

**Confirmed fact:** paragraph/character/group styles are named, hierarchical
(`Based on`), mutable and may preserve “no change” values inherited from their
base. Group styles are structural and cannot be applied directly. The type is
predominant rather than an absolute constraint: paragraph and character styles can
be made usable in both contexts. [Affinity: create/manage styles](https://affinity.help/designer2/English.lproj/pages/Text/textStyles_create.html),
[style types](https://affinity.help/designer2/English.lproj/pages/Text/textStyles_types.html).

**Confirmed fact:** Affinity exposes font-specific OpenType features and lets the
user select a language script used when applying OpenType rules. The OpenType
standard defines font layout tables and variation axes, but it does not establish
that a host implements every feature or a particular shaping pipeline. [Affinity: Character panel](https://affinity.help/designer2/English.lproj/pages/Panels/characterPanel.html),
[Microsoft OpenType 1.9.1](https://learn.microsoft.com/en-us/typography/opentype/spec/).

**Confirmed fact:** variable-font named instances appear as font styles; adjustable
axes are exposed; hidden axes stay hidden unless explicitly shown; and PDF export
staticises each used variation setting. [Affinity: variable fonts](https://affinity.help/designer2/English.lproj/pages/Text/variableFonts.html).

**Highly credible inference:** a durable text record must preserve at least text
content, ranges, character/paragraph values, style references/overrides and
container/path state to reproduce the documented editing surface. This is a
functional requirement inferred from the UI, **not** a recovered `.afdesign`
schema.

### 3. Complex scripts, bidi and vertical writing

Affinity’s public help says the Character panel can select a language script for
OpenType rules and that relevant features depend on available glyphs. That is the
only directly inspected first-party statement connecting its text UI to script
selection. [Affinity: Character panel](https://affinity.help/designer2/English.lproj/pages/Panels/characterPanel.html).

* **Unknown:** no inspected Affinity source claims Arabic joining, Indic shaping,
  Thai/Lao segmentation, emoji/colour-font handling, normalization, grapheme-safe
  editing, UAX #9 bidi conformance, explicit paragraph base direction, Bidi
  control handling, vertical writing modes, OpenType `vert`/`vrt2`, or vertical
  path-text semantics.
* **Confirmed external constraint, not an Affinity claim:** Unicode Bidi reorders
  logical text for display per paragraph and explicitly separates shaping from
  ordering; it applies even to mixed RTL/LTR text. [Unicode UAX #9](https://www.unicode.org/reports/tr9/).
* **Confirmed external constraint, not an Affinity claim:** vertical layout is
  grapheme-cluster-sensitive and may require alternate glyphs; UAX #50 expressly
  does not specify handling of RTL scripts in its vertical-orientation property.
  [Unicode UAX #50](https://www.unicode.org/reports/tr50/).

**Verdict — deferred:** the script selector and OpenType UI are evidence of a
professional typography surface, but they are not evidence sufficient to claim
Unicode-complete layout or vertical support. Treat those as separate verification
dimensions, not feature aliases.

### 4. Fonts, substitution, rendering and export

**Confirmed fact:** on opening a document with unavailable fonts, Designer raises
“Document Contains Missing Fonts,” substitutes a replacement system font, and
prefixes the missing font name with `?` when selected. For a downloadable macOS
font that is not installed locally, it prompts the user to download and install
it. [Affinity: Working with text](https://affinity.help/designer2/English.lproj/pages/Text/text_general.html).

**Unknown:** the documented alert does not specify font identity matching (PostScript
name, family/style, fingerprint), fallback ordering, whether substitution is saved,
whether text is re-shaped immediately, determinism across macOS/Windows/iPad, or
whether fonts can be embedded in native documents.

**Confirmed fact:** RTF and plain text can be placed; clipboard text can be pasted
from Word, InDesign and other sources, and “Paste without Format” is recommended
for unformatted external text. [Affinity: Importing text](https://affinity.help/designer2/English.lproj/pages/Text/importText.html),
[Frame text](https://affinity.help/designer2/English.lproj/pages/Text/frameText.html).

**Confirmed fact:** for variable fonts, PDF export turns each used variation into a
fixed static instance. **Unknown:** preservation/subsetting of ordinary OpenType
features, editable text versus outlines in SVG/PDF/EPS, PDF conformance choices,
and round-trip fidelity were not disclosed in sources inspected.

### 5. File-format and interoperability evidence (clean-room boundary)

The native `.afdesign` format has no official public schema located in this study.
No Affinity source code was consulted or copied. The following is evidence about a
third-party importer’s *observed/recovered support*, not a claim about Serif/Canva
internals:

| Evidence | What it supports | What it cannot establish |
|---|---|---|
| The Inkscape `extension-afdesign` text-import merge request states support for multi-line/frame text, artistic text, text in shapes/curves and text following a curve, and maps face, size, colour, stroke, underline/strikethrough and line height. [Source](https://gitlab.com/inkscape/extras/extension-afdesign/-/merge_requests/9) | **Confirmed file-format/interoperability evidence:** those constructs were distinguishable enough in the file/import pipeline for an importer to target them. | Native field names/types; faithful recovery; Affinity engine architecture. |
| The same author lists TODOs: vertical/horizontal alignment, typography styles, indents, list/tab/optical alignment work, inaccurate multi-line height, and inability to apply underline and strikethrough together. [Source](https://gitlab.com/inkscape/extras/extension-afdesign/-/merge_requests/9) | **Confirmed interoperability limitation of that importer at that 2024 point.** | An Affinity limitation. These are explicitly importer gaps. |

**Verdict — rejected:** do not use third-party importer coverage as a compatibility
promise or as a substitute for an official schema. **Adapted lesson:** a rich text
object’s distinction from a consumer’s partial projection is observable and
material; import/export fidelity needs per-feature evidence.

### 6. Platform, release boundary and performance

| Topic | Finding | Confidence |
|---|---|---|
| V2 platforms | The V2 help corpus contains desktop and iPad variants, but the cited desktop pages do not expose rendering-engine differences. | **Confirmed fact / unknown difference.** |
| Current product | Canva’s current release announcement calls the product “all-new Affinity,” available for Mac and Windows, with iPad “coming soon.” It also claims real-time updates and large-file smoothness, but supplies no text-specific methodology or numbers. [Source](https://www.canva.com/newsroom/news/all-new-affinity/) | **Confirmed fact** for announcement/version boundary; performance claim is **vendor claim**, not a benchmark. |
| Canva relevance | The announcement describes ownership integration, new unified vector/photo/layout product positioning and Canva AI, but no specific alteration to text shaping, schema, fallback, measurement or export. | **Confirmed fact / no attributable text-system conclusion.** |
| Performance | No credible public benchmark, text-layout complexity bound, cache architecture, memory budget, glyph-atlas detail or latency measurement was found. | **Unknown.** |

## Comparison matrix: capability versus disclosed mechanism

This is a single-product teardown rather than a feature score. “Shipped” means the
legacy V2 help documents it; “partial” here means the public record is incomplete,
not that the capability necessarily fails.

| Decision-relevant dimension | User-visible Affinity result | Evidence/maturity | Mechanism disclosed? | Risk / verdict |
|---|---|---|---|---|
| Container semantics | Art, frame, shape and path text; conversion and reflow | Help docs; **shipped** | No | **Adapted:** separate visible semantics are a real market requirement; avoid assuming one geometry rule. |
| Rich formatting/style indirection | Range attributes plus character/paragraph/group style hierarchy | Help docs; **shipped** | No | **Adapted:** styles are independent state, not a display preset. |
| Advanced typography | Feature-aware OpenType UI and variable axes; PDF staticises variations | Help docs + OpenType spec; **shipped** | No | **Deferred:** the UI does not reveal shaping correctness or reproducibility. |
| Missing-font recovery | Alert and replacement system font | Help docs; **shipped** | Fallback choice/rules absent | **Adapted:** substitution is a first-class user-visible failure state, not silent fidelity. |
| Cross-tool fidelity | RTF/TXT and clipboard import; third-party `.afdesign` importer has partial mapping | Help docs + importer; **partial** | Native schema absent | **Rejected:** do not equate importability with fidelity. |
| International/vertical text | Script selector exists; no explicit bidi/vertical guarantee located | Help docs + Unicode constraints; **partial/unknown** | No | **Deferred:** require direct test cases before any claim. |

## Risks, lessons and non-recommendations

| Observation | Competitor lesson / risk | Verdict |
|---|---|---|
| Text continues to reflow when its path changes, but scaling the containing object has distinct semantics. | Geometry attachment and type metrics are coupled at the UX level; conflating them risks incorrect editing and bounds. | **Adapted** as a problem statement only. |
| Missing fonts trigger an explicit alert and substitution. | Cross-platform documents can change visibly without original font bytes; hiding it makes fidelity regressions unauditable. | **Adapted** as a risk finding only. |
| Variable-font settings can be made static in PDF. | A variable-font document is not automatically a variable-font interchange artifact; feature preservation needs output-specific evidence. | **Adapted** as a fidelity risk only. |
| Public docs advertise language-aware OpenType options but omit bidi/vertical claims. | “OpenType support” is not a proxy for complex-script or vertical-layout conformance. | **Rejected** as a shorthand claim. |
| Third-party import loses/omits advanced typography and layout details. | Interoperability has a semantic-fidelity ladder; successful import is not sufficient proof of editable parity. | **Adapted** as an evaluation criterion only. |

No implementation choice is recommended here. These verdicts classify evidence for
the later decision; they do not transfer Affinity code, schema, or architecture.

## Gaps and unknowns

1. No official `.afdesign` text schema, versioning contract or conformance fixture.
2. No direct black-box test across macOS, Windows, iPad or the post-Canva Mac/Windows
   release. The current product’s relationship to the V2 help corpus therefore
   remains unknown.
3. No attributable Affinity disclosure of shaper, bidi engine, line breaker,
   hyphenation dictionary, font discovery API, font matching/substitution score,
   glyph rasteriser/atlas, cache, export backend or performance metrics.
4. No verified support statement for IME composition, emoji/colour fonts, variable
   font named-instance persistence, OpenType feature persistence, Arabic/Indic
   editing, Unicode normalization, vertical writing or RTL path text.
5. Importer evidence is single-source and date-bound (2024); it is corroboration
   of its importer’s scope, not a general statement about V2/current Affinity.

## Recommended verification, labelled by confidence

* **High confidence:** keep V2 and current Affinity evidence in separate version
  columns; do not represent legacy help as current-product proof.
* **High confidence:** assess text interchange by semantic feature fixtures—not a
  “text imported” binary—because the documented third-party importer loses
  specific layout and typography details.
* **High confidence:** treat shaping, bidi, vertical text, measurement and font
  substitution as independently verifiable properties; neither the presence of an
  OpenType panel nor variable-font controls proves them.
* **Hypothesis to verify:** obtain a legally acquired current build and run a
  black-box fixture matrix (mixed Arabic/Hebrew/Latin/digits, Indic clusters,
  emoji, variation axes, missing fonts, frame/path resize, and PDF/SVG round
  trips) on macOS and Windows. Record only outputs and behaviour; do not extract
  or copy proprietary code.

## Audit trail and source assessment

| ID | Source / source type | Used for | SIFT/CRAAP assessment |
|---|---|---|---|
| A1 | [Affinity working with text](https://affinity.help/designer2/English.lproj/pages/Text/text_general.html) — official help | editing, missing fonts, overflow | Primary product documentation; highly relevant, but legacy-V2 scope. |
| A2 | [Artistic text](https://affinity.help/designer2/English.lproj/pages/Text/artText.html) — official help | art text/curve conversion | Primary, task-specific. |
| A3 | [Frame text](https://affinity.help/designer2/English.lproj/pages/Text/frameText.html) — official help | frame reflow/scale/overflow | Primary, task-specific. |
| A4 | [Text on a path](https://affinity.help/designer2/English.lproj/pages/Text/pathText.html) — official help | curve attachment and reflow | Primary, task-specific. |
| A5 | [Character panel](https://affinity.help/designer2/English.lproj/pages/Panels/characterPanel.html) and [Paragraph panel](https://affinity.help/designer2/English.lproj/pages/Panels/paragraphPanel.html) — official help | formatting controls | Primary, task-specific. |
| A6 | [Text styles](https://affinity.help/designer2/English.lproj/pages/Text/textStyles_create.html) and [types](https://affinity.help/designer2/English.lproj/pages/Text/textStyles_types.html) — official help | style hierarchy | Primary, task-specific. |
| A7 | [Variable fonts](https://affinity.help/designer2/English.lproj/pages/Text/variableFonts.html) and [OpenType features](https://affinity.help/designer2/English.lproj/pages/Text/opentype_fonts.html) — official help | variations/features/PDF statement | Primary; PDF statement is vendor documentation, not independently export-tested. |
| A8 | [Importing text](https://affinity.help/designer2/English.lproj/pages/Text/importText.html) — official help | RTF/TXT and paste | Primary, task-specific. |
| A9 | [Canva/Affinity launch announcement](https://www.canva.com/newsroom/news/all-new-affinity/) — first-party announcement | current release boundary | Primary for product positioning/availability; promotional purpose, no performance measurement. |
| S1 | [OpenType 1.9.1](https://learn.microsoft.com/en-us/typography/opentype/spec/) — standard | distinguish standard from host support | Authoritative specification, not Affinity evidence. |
| S2 | [Unicode UAX #9](https://www.unicode.org/reports/tr9/) and [UAX #50](https://www.unicode.org/reports/tr50/) — standards | bidi/vertical constraints | Authoritative standards, not Affinity evidence. |
| C1 | [Inkscape `extension-afdesign` MR !9](https://gitlab.com/inkscape/extras/extension-afdesign/-/merge_requests/9) — third-party implementation report | partial importer observations | Secondary/file-format corroboration; author’s scope and 2024 date limit reliability. Not used to infer internals. |

**Counts:** 9 primary-source groups (Affinity/Canva), 2 standards-source groups,
1 third-party corroborating source group. **Refresh cadence:** reassess when a
current Affinity release note or official text/file-format documentation appears;
otherwise before any interoperability commitment.

## Promising leads not pursued

| Thread | Why off-frame / value-cost | One-line authorized plan |
|---|---|---|
| Controlled current-build probe | High value but requires licensed app, fixture corpus and platform access; unavailable here. | Run the black-box matrix listed above and retain screenshots/PDF hashes. |
| `.afdesign` staged format reconnaissance | High value for interoperability, but requires user-provided samples and an explicit clean-room format-study scope. | Compare minimally differing legal samples; hypothesize one field at a time and confirm across samples. |
| Staff-attributed forum history for RTL/vertical bugs | Medium relevance but often anecdotal/version-bound; lower gain than direct probe. | Search only staff replies, record build/platform and reproduce before relying on them. |
| PDF/SVG output inspection | High fidelity value, but needs controlled documents and output artifacts. | Export a fixture suite, inspect fonts/outlines/tables, then open outputs in independent consumers. |
