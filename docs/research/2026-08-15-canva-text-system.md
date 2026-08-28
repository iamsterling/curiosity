# Canva dynamic-text system: public-evidence study

**Date:** 2026-08-15
**Decision served:** establish what Canva is and is not evidence for when later evaluating a dynamic-text subsystem. This is not a design proposal and does not prescribe a Crafty implementation.
**Method:** clean-room public-document study. No Canva client was instrumented, authenticated, or probed; no proprietary source, assets, or font files were acquired.

## Executive summary

Canva publicly exposes a capable *authoring-facing* text abstraction, but not its editor's implementation. The strongest disclosed evidence is its Apps SDK: a positioned text container holds either whole-element plaintext or a `RichtextRange`; rich text is mutable at zero-based string ranges, has inline and paragraph formatting, and can be read back as coalesced formatted regions. Font choice is an opaque Canva backend `fontRef`, with available styles and weights reported per family. [**Confirmed fact** — Creating text](https://www.canva.dev/docs/apps/creating-text/), [**Confirmed fact** — Richtext API](https://www.canva.dev/docs/apps/api/latest/design-create-richtext-range/), [**Confirmed fact** — Fonts API](https://www.canva.dev/docs/apps/api/latest/asset-find-fonts/)

The public surface also demonstrates that Canva separates content from its containing element and has an optimistic/snapshot-like third-party editing interface: querying produces rich-text content on the current page, explicit `sync()` commits it, unsynced work is discarded, and Canva says it may resolve conflicts without promising how. That is evidence about the extension boundary, **not** proof of Canva's canonical document representation or its internal collaboration algorithm. [**Confirmed fact** — Content querying](https://www.canva.dev/docs/apps/querying/)

For dynamic templates, Canva discloses tagged fields and typed tabular data, including text fields, and an Autofill operation that fills the current design. The API is Preview, records only a success/no-match outcome, and makes no public guarantee about overflow, truncation, reflow, or data-to-text formatting behaviour. [**Confirmed fact** — Autofill API](https://www.canva.dev/docs/apps/api/preview/design-autofill-design/), [**Confirmed fact** — Brand-template metadata](https://www.canva.dev/docs/apps/api/preview/design-get-brand-template-metadata/)

There is **no checked public primary source** here that identifies Canva's shaping engine, bidi algorithm, line-break engine, glyph cache/atlas strategy, IME architecture, font fallback order, text-effects representation, export conversion rules, or document serialization. Inferring any of those from a web UI, an SDK, patents, or generic browser practice would be overclaiming. Canva's font-security article does establish that it processes font files at large scale and discusses WOFF/WOFF2, CJK-size pressure, subsetting, sandboxing, and OpenType Sanitizer; it does *not* disclose the production text-rendering stack. [**Confirmed fact / scope limit** — Canva font-security article](https://www.canva.dev/blog/engineering/fonts-are-still-a-helvetica-of-a-problem/)

**Overall verdict — adapted as a problem inventory, rejected as implementation evidence.** Canva is useful evidence that professional template text has range formatting, opaque font identity, authored box geometry, editable content, dynamic fields, and collaboration constraints. Its proprietary mechanics remain unknown and must not be copied or assumed.

## Frame, sub-question tree, and revisable plan

**Effort tier:** deep, bounded primary-source study (three passes; 14 checked sources). The question crosses the document, typography, template, collaboration, export, and security boundaries, while implementation disclosure is expected to be sparse.

| Branch | Initial depth budget | Evidence sought | Result |
|---|---:|---|---|
| A. Public text object/model and editing | 3 | Apps SDK contracts, content/session semantics | Answered at extension boundary |
| B. Fonts, layout, shaping, international text, IME | 3 | Canva engineering/docs; standards only for terminology | Fonts partly answered; mechanics unknown |
| C. Effects, rendering, export, interchange | 2 | Export/API/product docs | Export formats answered; fidelity mechanics unknown |
| D. Templates/dynamic data/brand | 3 | Autofill, data-field, brand-template APIs | Answered, Preview limitations explicit |
| E. Collaboration and performance | 2 | Canva engineering disclosures | Presence transport disclosed; text merge semantics unknown |
| F. Legal/clean-room and patents | 1 | Terms/content licence, direct patents if found | Terms checked; no patent made load-bearing |

**Initial plan:** (1) collect the SDK index and text/font/export/template contracts; (2) read Canva engineering disclosures for font and collaboration evidence; (3) compare disclosures with required questions, then deepen only gaps with first-party sources; (4) stop when remaining claims are undisclosed rather than infer them.

**Revision after pass 1:** rich-text, font references, and export formats were documented; line-height documentation contradicted itself. Deepened the authoritative API reference and content-querying contract rather than broadening searches.

**Revision after pass 2:** Autofill and presence transport were disclosed, but no source named shaping/bidi/IME/render internals. A curiosity pass scored “find a proprietary engine name” low (high cost, low expected verifiability); it was not pursued. The report records this as unknown.

## Findings and evidence

### 1. Public text model and web editing boundary

| Observation | Evidence and confidence | What it establishes | Evidence verdict |
|---|---|---|---|
| Text is exposed as content in containers, rather than as one undifferentiated object. | Canva says text content can occur in text elements and table cells, and that content is not synonymous with an element; users can position, size, and rotate text-element containers. [**Confirmed fact**](https://www.canva.dev/docs/apps/creating-text/) | The public API distinguishes content operations from element geometry operations. It does **not** reveal canonical storage. | **Adapted:** retain as a comparison dimension; do not infer internals. |
| Two text representations are exposed. | Plaintext is whole-text formatted and loses existing formatting on read/update; rich text supports formatting in different parts and preserves it. [**Confirmed fact**](https://www.canva.dev/docs/apps/creating-text/) | The SDK presents an explicit fidelity trade-off to apps. | **Adopted as evidence:** range-rich text is a product requirement signal. |
| A rich-text range is string-indexed, mutable, and serializes outward as formatted regions. | `appendText`, `replaceText`, `formatText`, and `formatParagraph` take zero-based `{ index, length }`; `readTextRegions()` returns text plus partial formatting. Paragraphs are delimited by `\n`; formatting an overlapping range formats entire paragraphs. [**Confirmed fact**](https://www.canva.dev/docs/apps/api/latest/design-create-richtext-range/) | The public edit granularity is numeric string positions; the docs do not specify whether those positions are UTF-16 code units, Unicode scalars, or grapheme clusters. | **Adapted:** useful compatibility risk marker, not a model to duplicate. |
| Inline and paragraph style domains are distinct. | Inline fields: colour, weight, italic, underline, strikethrough, link. Paragraph formatting additionally exposes font reference/size, start/center/end/justify, list level/marker, line height and letter spacing. [**Confirmed fact**](https://www.canva.dev/docs/apps/api/latest/design-create-richtext-range/) | The public typography vocabulary is more than a text string plus CSS-like font tuple. | **Adopted as evidence:** style ownership/granularity needs separate evaluation. |
| Text boxes are width-constrained but not externally height-authored via the Apps SDK. | The creating-text guide says text elements cannot have a predefined height; the deprecated native-element documentation exposes width and position/rotation for text. [**Confirmed fact; API-boundary caveat**](https://www.canva.dev/docs/apps/creating-text/), [**Confirmed fact; deprecated API**](https://www.canva.dev/docs/apps/api/latest/design-add-native-element/) | Publicly, height is not an app-authored text-element property. This does not prove how Canva’s first-party editor stores or handles text height. | **Adapted:** a dynamic-content overflow question, not an implementation conclusion. |

#### Line-height contradiction

The high-level Creating text guide says “Apps can't set the line-height of text.” The current `createRichtextRange` reference, however, documents `lineHeightEm` for paragraph formatting (0.5–2.5, default 1.4) and `letterSpacingEm`. [**Confirmed contradictory primary documentation** — guide](https://www.canva.dev/docs/apps/creating-text/), [**Confirmed contradictory primary documentation** — API reference](https://www.canva.dev/docs/apps/api/latest/design-create-richtext-range/)

**Verdict: deferred pending Canva clarification.** Treat line-height as publicly exposed by the current generated API reference, but do not use the older guide's prohibition to claim it is absent, nor claim availability in every host/context. This contradiction is itself a maintenance/compatibility risk for SDK consumers.

### 2. Fonts, brand fonts, substitution, and safe ingestion

1. **Opaque font identity and per-family capability.** `findFonts()` returns only a subset of Canva fonts; every result contains an opaque backend `ref`, family name, available weights, styles per weight, and an optional rendered preview URL. The picker guidance says not to offer unsupported weights/styles. [**Confirmed fact**](https://www.canva.dev/docs/apps/api/latest/asset-find-fonts/), [**Confirmed fact**](https://www.canva.dev/docs/apps/design-guidelines/fonts/)
   - **Verdict: adopted as evidence of capability-based font selection.** It is not evidence of font-file ownership, fallback, or the full library.

2. **No third-party access to font files.** Canva's Fonts API launch announcement explicitly says apps cannot obtain direct access to Canva font files. [**Confirmed fact; vendor developer announcement**](https://community.canva.dev/t/fonts-api-launched/2654)
   - **Verdict: rejected as a font-data interchange route.** It reinforces that a `fontRef` is a service handle, not portable font provenance.

3. **Brand Kit evidence is incomplete for fonts.** The checked Preview API can read current Brand Kit *colours* only; it does not expose brand fonts. It may return no palettes. [**Confirmed fact**](https://www.canva.dev/docs/apps/api/preview/design-get-brand-kit-colors/)
   - **Unknown:** whether brand fonts are stored separately, how they are applied, and their licensing/availability policy. **Verdict: deferred; do not generalize colour exposure to a brand-font model.**

4. **Canva processes untrusted fonts and discusses web-size tactics.** Its security team says Canva processes millions of files across graphics formats, characterises CJK/large-script fonts as large, describes WOFF/WOFF2 compression and subsetting, and recommends sandboxing and OpenType Sanitizer for font processing. [**Confirmed fact**](https://www.canva.dev/blog/engineering/fonts-are-still-a-helvetica-of-a-problem/)
   - **Highly credible inference:** a product offering font upload/import must have a security boundary around font parsing; this article is strong evidence of Canva’s awareness and handling of that risk, but does not name its live pipeline. **Verdict: adapted as a risk finding, never as renderer-stack evidence.**

5. **Font licence limits materially constrain interchange.** Canva’s Content License Agreement forbids using its Font Software outside Canva or an exported Canva Design and prohibits conversion/modification; its Fontsmith licence separately restricts live public websites, commercial UIs/apps/games, with an ePublication exception. [**Confirmed fact**](https://www.canva.com/policies/content-license-agreement/), [**Confirmed fact; collection-specific licence**](https://www.canva.com/policies/fontsmith-EULA/)
   - **Verdict: rejected for any assumption that a Canva design can export/reuse its editable font resources.** A visual export and a transferable editable font package are legally and technically distinct.

**Not disclosed:** fallback-chain policy; missing-glyph handling; variable-font axes; font upload acceptance formats; font fingerprinting/subsetting policy in the editor; deterministic font revision pinning; substitution diagnostics.

### 3. Shaping, measurement, internationalisation, bidi, and IME

| Required concern | Checked evidence | Finding / verdict |
|---|---|---|
| Shaping, OpenType feature selection, line breaking, measurement | The SDK exposes font size, letter spacing, width-constrained elements, alignment, lists and line-height reference fields, but names no shaping/layout library or algorithm. [**Confirmed fact**](https://www.canva.dev/docs/apps/api/latest/design-create-richtext-range/) | **Unknown.** Visible formatting controls demonstrate an output requirement, not the algorithm. **Deferred.** |
| Complex scripts / bidi / vertical writing | Canva’s text guide says Apps SDK apps cannot create vertical-writing text. It exposes logical `start`/`end` alignment but documents no direction property, bidi behaviour, script coverage, or fallback. [**Confirmed fact**](https://www.canva.dev/docs/apps/creating-text/), [**Confirmed fact**](https://www.canva.dev/docs/apps/api/latest/design-create-richtext-range/) | **Unknown.** `start`/`end` is compatible with direction-aware design but is insufficient evidence that a particular bidi implementation exists. **Rejected:** claims of full bidi/complex-script parity. |
| IME and composition | No checked Canva source documents composition events, composition ranges, cancellation, candidate positioning, or remote-edit interaction. | **Unknown. Deferred.** Do not infer browser-native editing, Canvas overlay, or a DOM contenteditable strategy. |
| Product/app localisation | Canva’s SDK ships a text-translation example that edits current-page rich text and says production Apps must localise their own UI with `@canva/app-i18n-kit`. [**Confirmed fact**](https://www.canva.dev/docs/apps/examples/text-translation/) | This concerns app UI and transformation workflows, not the editor text engine. **Adapted only as a distinction:** UI localisation is not document-language support. |

### 4. Typography effects, rendering and export fidelity

**Officially exposed basic typography:** colour, font, size, weight/style, underline/strikethrough, hyperlink, alignment, lists, line height (subject to the contradiction above), and letter spacing. [**Confirmed fact**](https://www.canva.dev/docs/apps/api/latest/design-create-richtext-range/)

**Not disclosed:** the representation or rendering of text effects (shadow, outline, curve, warp, background, gradient/text-fill, animation), glyph rasterisation, GPU/Canvas/SVG route, selection/caret geometry, zoom precision, clipping/overflow, hinting, or the equivalence of first-party editor preview to export. Public product screenshots or feature marketing would establish behaviour at most, not these mechanisms, and were deliberately not made load-bearing.

Canva’s export API lets an app request static PNG, JPG, PDF Standard, video, GIF, PPTX, or SVG and defines multi-page packaging behaviour. [**Confirmed fact**](https://www.canva.dev/docs/apps/api/latest/design-request-export/)

**What that does not establish:** whether text remains selectable/editable in any particular output; whether fonts are embedded, subset, outlined, substituted, or rasterised; whether unsupported effects flatten; or a pixel-fidelity guarantee. No benchmark or parity claim is available, so none is made.

**Verdict: adapted as a format-capability observation; rejected as evidence of editable-text interchange or rendering fidelity.** The export list is a product contract, not a rendering architecture disclosure.

### 5. Dynamic data, templates, and replacement semantics

| Finding | Evidence/confidence | Verdict |
|---|---|---|
| Brand templates can declare a `dataset` whose field metadata has `image`, `text`, or `chart` types. | [**Confirmed fact**](https://www.canva.dev/docs/apps/api/preview/design-get-brand-template-metadata/) | **Adopted as evidence:** template text is an addressable dynamic-content class. The mapping from field to a particular rich-text span is not exposed. |
| Apps can request a matching flow with typed sample data (string, number, date, boolean, media) and can autofill tagged elements in the current design from a `DataTable`. | [**Confirmed fact**](https://www.canva.dev/docs/apps/api/preview/design-request-data-field-matching/), [**Confirmed fact**](https://www.canva.dev/docs/apps/api/preview/design-autofill-design/) | **Adapted:** typed data and tagged targets are a useful competitive capability signal. |
| String cell values permit up to 10,000 characters; number values may carry Office Open XML display formatting. | [**Confirmed fact**](https://www.canva.dev/docs/apps/api/preview/design-autofill-design/) | **Adapted as a test-risk signal:** content length and formatting transforms require explicit handling. Canva does not document result geometry. |
| The API returns only `success` or `no_matched_fields`; access failures reject. | [**Confirmed fact**](https://www.canva.dev/docs/apps/api/preview/design-autofill-design/) | **Rejected:** an assertion that Canva promises overflow prevention, layout adaptation, or field-level diagnostics. |

All these template/data APIs are Preview: Canva explicitly says they are unstable and cannot power public Marketplace apps until stable. [**Confirmed fact**](https://www.canva.dev/docs/apps/api/preview/design-autofill-design/)

### 6. Collaboration, conflict, and performance evidence

**Content editing session.** The Apps SDK exposes a snapshot-like page-level `editContent` session whose `sync()` commits changes. Unsynced edits are discarded; content created after session open is not included; a one-minute timeout reduces staleness; Canva says it will try to resolve concurrent changes but gives no guarantee how. Content item order is not stable; deleted items remain marked `deleted`. [**Confirmed fact**](https://www.canva.dev/docs/apps/querying/)

**Inference boundary.** It is a **highly credible inference** that a third-party session API must reconcile a session snapshot with current state, because the docs describe changes after session creation and conflict resolution. It is **unknown** whether first-party editing uses the same object model, operations, locking, OT, CRDTs, or server protocol. **Verdict: adapted as a conflict-risk signal; rejected as a collaboration-architecture template.**

**Presence transport.** Canva’s collaboration team explicitly says the Editor uses WebSockets and Redis to store and propagate real-time design changes. Its mouse-pointer system started with WebSockets/Redis and later chose WebRTC; the article reports a 3 updates/s goal for up to 50 users per design, approximately 100,000 pointer updates/s at peak with 27% CPU on a Redis instance, and a 30% CPU reduction from protobuf versus JSON for that pointer service. [**Confirmed fact; engineering report with a narrow workload**](https://www.canva.dev/blog/engineering/realtime-mouse-pointers/)

**Benchmark caveat:** those values cover *presence pointers*, an article-specific production environment and transport revisions—not text editing, shaping, document sync, render latency, or another product. They are not comparable performance targets. **Verdict: adapted only as evidence that Canva separates/optimises high-rate ephemeral presence; rejected for text performance sizing.**

### 7. Interchange and reverse-engineering boundaries

Canva exposes import/export product surfaces and output formats but the checked primary sources do not provide a Canva document-file specification, an editable rich-text interchange schema, font-reference export semantics, or a conformance suite. [**Confirmed fact for export list; unknown for all absent mechanisms**](https://www.canva.dev/docs/apps/api/latest/design-request-export/)

Canva’s Content License Agreement explicitly restricts extracting, modifying, converting, and using Font Software outside Canva/an exported design. [**Confirmed fact**](https://www.canva.com/policies/content-license-agreement/)

**Clean-room verdict: rejected.** Do not acquire Canva font files or reverse engineer its font assets to answer implementation questions. If format interoperability becomes a separate approved question, begin with published terms, documented import/export contracts, user-owned samples, and black-box differential tests—not client bundle/static analysis. No patents were used: the targeted searches did not yield a directly checked, clearly relevant Canva patent that added more than the official SDK evidence.

## Disclosure map

| Area | Public disclosure strength | Safe conclusion | Unsafe conclusion |
|---|---|---|---|
| Rich text/content boundary | High | Range formatting and explicit content-session APIs exist | Canonical node/schema layout is known |
| Text layout controls | Medium | Width, alignment, lists, spacing and (per ref) line height are exposed | Exact line-breaking/measurement implementation is known |
| Fonts | Medium | Opaque font refs; family capabilities; no file access for Apps SDK | Full library, fallback/substitution or embedding rules are known |
| Brand fonts | Low | Brand-template text fields and Brand Kit colours exist | Brand-font binding model is known |
| Unicode/bidi/IME | Very low | Vertical writing is unavailable to Apps SDK | Any specific complex-text/IME support or engine is known |
| Effects/rendering | Very low | Basic style fields and export formats exist | Preview/export pixel parity or GPU strategy is known |
| Dynamic data | Medium | Tagged targets and typed table autofill exist (Preview) | Overflow and formatting policy are known |
| Collaboration | Medium for presence, low for text | Real-time editor changes use WebSockets/Redis; Apps SDK conflict behaviour is non-guaranteed | Text merge algorithm/schema is known |
| Interchange | Low | Static export formats are public | Editable text/fontrun interchange is specified |

## Gaps, unknowns, and contradictions

1. **Line-height source conflict:** guide prohibition versus generated reference property; document both rather than selecting the convenient one.
2. **Character indexing semantics:** numeric string bounds are documented; UTF-16 code-unit, scalar, grapheme, and bidi-selection behaviour are not.
3. **No disclosed text-engine composition:** shaper, Unicode segmentation, hyphenation, writing direction, fallback, variable fonts, colour fonts, kerning/features, raster path, cache invalidation, and measurement ownership are unknown.
4. **No disclosed IME contract:** composition lifecycle, caret/selection geometry, and concurrent composition edits are unknown.
5. **No public effect model:** enumerating Canva product effects would not establish whether they are text semantics, filters, vector outlines, or flattened layers.
6. **No export fidelity contract:** available output types do not state text preservation, font embedding, substitution, or parity.
7. **No text-collaboration algorithm:** the extension API’s “will attempt” conflict language is explicitly weaker than a semantic merge guarantee.
8. **Preview API volatility:** Autofill, brand template metadata, field matching and Brand Kit colours must not be treated as stable public product contracts.

## Competitor-specific lessons and risks (non-prescriptive)

| Observation | Lesson extracted | Risk if over-transferred | Verdict |
|---|---|---|---|
| Rich formatting is exposed as ranges and paragraphs while geometry belongs to element operations. | Text content and box manipulation can be separately addressable to extensions. | Treating this public facade as Canva’s storage schema would copy an unknown constraint. | **Adapted** |
| Font selection is an opaque reference with enumerated supported faces. | Availability/identity/licensing may be service-owned rather than a font-family string. | Assuming refs are portable or that every named face exists on every client produces substitution/fidelity bugs. | **Adapted** |
| Autofill knows fields but documents no geometry result. | Dynamic-data semantics and text-fit policy are separate concerns. | Equating successful replacement with legible or overflow-free output. | **Adapted** |
| Content sessions have explicit commit, timeout and weak conflict guarantees. | Third-party bulk transforms need a staleness/conflict contract. | Assuming the same behaviour as Canva’s live editor or assuming deterministic merge. | **Adapted** |
| Canva optimised pointer presence separately from document edits. | Ephemeral high-rate state is a distinct performance workload. | Reusing pointer throughput figures for text layout/render or durable sync. | **Adapted** |

## Recommendations for the named decision

1. **[Highly credible inference] Use Canva only to populate questions and test categories, not to select a text-engine architecture.** The available sources disclose authoring/API behaviour, not shaping/rendering mechanics. **Verdict: adopted.**
2. **[Confirmed fact] Keep source-level uncertainty visible when comparing competitors.** In particular, tag the Canva line-height conflict and all Preview API claims; do not normalise them into “supported” checkmarks. **Verdict: adopted.**
3. **[Highly credible inference] Treat font identity, availability, fallback, licence and output fidelity as separable evaluation dimensions.** Canva’s opaque refs and licence restrictions demonstrate why an editable text model alone is insufficient. **Verdict: adapted.**
4. **[Confirmed fact] Do not derive numeric performance targets from Canva’s pointer article.** Its measurements are workload-specific and not text benchmarks. **Verdict: rejected.**
5. **[Confirmed fact] Do not reverse engineer Canva Font Software or acquire Canva font data for this study.** Both lack relevance to the necessary design decision and face explicit licence limits. **Verdict: rejected.**

## Source-quality table and audit trail

All sources below were opened and read. Canva docs/blogs are primary but vendor-authored: they are authoritative for public API/product claims, not independent measurements or undisclosed internals. No secondary source is load-bearing.

| # | Source | Type / SIFT-CRAAP assessment | Used for |
|---:|---|---|---|
| 1 | [Creating text](https://www.canva.dev/docs/apps/creating-text/) | Official SDK guide; current/relevant; API-authoritative, may lag reference | content vs element, plaintext/richtext, limits |
| 2 | [Richtext API](https://www.canva.dev/docs/apps/api/latest/design-create-richtext-range/) | Official generated API reference; strongest for field vocabulary | range operations, formatting fields, spacing |
| 3 | [Content querying](https://www.canva.dev/docs/apps/querying/) | Official SDK guide; direct extension contract | sessions, sync, conflict caveat |
| 4 | [Fonts API](https://www.canva.dev/docs/apps/api/latest/asset-find-fonts/) | Official generated API reference | refs, returned family capabilities |
| 5 | [Font picker guidelines](https://www.canva.dev/docs/apps/design-guidelines/fonts/) | Official SDK guidance; UX guidance, not engine evidence | supported weight/style constraints |
| 6 | [Fonts API announcement](https://community.canva.dev/t/fonts-api-launched/2654) | Canva developer forum announcement; lower than ref docs but direct | no direct font-file access |
| 7 | [Font-security engineering article](https://www.canva.dev/blog/engineering/fonts-are-still-a-helvetica-of-a-problem/) | Canva engineering primary account; strong for described work, not full stack | font security, size/subsetting context |
| 8 | [Autofill API](https://www.canva.dev/docs/apps/api/preview/design-autofill-design/) | Official Preview API reference; unstable by declaration | tagged dynamic data, status, cell limits |
| 9 | [Data-field matching API](https://www.canva.dev/docs/apps/api/preview/design-request-data-field-matching/) | Official Preview API reference | typed field-matching flow |
| 10 | [Brand-template metadata API](https://www.canva.dev/docs/apps/api/preview/design-get-brand-template-metadata/) | Official Preview API reference | text/image/chart dataset types |
| 11 | [Brand Kit colours API](https://www.canva.dev/docs/apps/api/preview/design-get-brand-kit-colors/) | Official Preview API reference | intentionally narrow brand-kit disclosure |
| 12 | [Export API](https://www.canva.dev/docs/apps/api/latest/design-request-export/) | Official API reference | output types and page packaging |
| 13 | [Real-time mouse pointers](https://www.canva.dev/blog/engineering/realtime-mouse-pointers/) | Canva engineering primary account; metrics narrowly scoped | presence transport and methodology caveat |
| 14 | [Content License Agreement](https://www.canva.com/policies/content-license-agreement/) and [Fontsmith EULA](https://www.canva.com/policies/fontsmith-EULA/) | Official legal terms; authoritative for their stated licence scope | clean-room and font-asset constraints |

### Research loop and stop check

* **Pass 1 — search/read:** Canva developer docs exposed the rich-text model, fonts and Apps SDK boundary. Gap: templates/export/collaboration.
* **Pass 2 — targeted deepening:** read current Preview Autofill/brand APIs, export contract and Canva’s pointer engineering report. Gap: shaping, bidi, IME, effect/rendering mechanisms.
* **Curiosity pass:** candidates were (a) identify a named text engine, (b) product UI probing for RTL/effects, (c) patent search, (d) generated type declarations. Scores favoured (d) only insofar as the Richtext API already provided the exact fields; (a)/(b)/(c) had low verified value under proprietary/terms constraints and could not establish internal architecture. They were not pursued.
* **Pass 3 — verification:** reconciled the high-level text guide against the generated API reference and recorded the line-height contradiction; checked licence terms and the SDK index for omitted public text routes.

**Sufficiency decision: stop.** Coverage exists for every requested category either with direct evidence or an explicit unknown; all material positive claims have URL-level primary citations; the only quantitative source carries a workload caveat; independent sources do not resolve proprietary mechanics. Further browsing is unlikely to add a distinct verified implementation claim without a newly published Canva engineering disclosure.

## Promising leads not pursued

| Thread | Why off-frame / value-cost | One-line authorised follow-up |
|---|---|---|
| Authenticated black-box tests of RTL, complex-script, font-missing, effects, overflow and export | Could establish observable behaviour, but requires a licensed account/test plan and still cannot prove implementation; not authorised here. | Define a legal test matrix using user-authored samples and compare editor/export deltas. |
| Canva desktop/mobile app behaviour | Platform differences may matter, but this task is web implementation evidence and lacks an authorised device matrix. | Run the same observable-text matrix on declared supported platforms. |
| Patent landscape | Search surfaced no checked patent that exceeded SDK evidence; patent claims are not proof of shipping behaviour. | Commission a legal/landscape search only if a specific claimed technique affects freedom-to-operate. |
| Browser-bundle/static analysis | Conflicts with clean-room value and is weak evidence under minification/licensing; no need for the named decision. | Do not pursue without separate legal approval and a narrowly stated interoperability question. |
