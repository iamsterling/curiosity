# Penpot dynamic text system — source study

**Decision served:** establish what Penpot's *current* text architecture actually
does before any future Crafty typography decision. This is an evidence study, not
a design proposal or an implementation recipe.  It describes behaviour and
boundaries in original terms only; no Penpot source has been copied.

**Study date:** 2026-08-15. **Primary specimen:** Penpot `develop` commit
[`59ef07633aae46450c7e8738ee8b1fd1bbd2ea86`](https://github.com/penpot/penpot/tree/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86)
(2026-08-14). It is newer than the latest checked release,
[`2.17.0` / `bdce5817ea86d028db29113d9ecdadcf07097b36`](https://github.com/penpot/penpot/tree/bdce5817ea86d028db29113d9ecdadcf07097b36)
(2026-07-22). Therefore “current” below means upstream development; “shipped”
means 2.17.0 unless marked otherwise.

## Frame, sub-questions, and revisable plan

**Effort tier:** deep source study (three passes; source and release archaeology,
not black-box automation). The public source is MPL-2.0. This is lawful study of
mechanisms, but **any proposed import, modification, or file-derived reuse must
first receive Crafty's recorded MPL licensing review/ADR**; MPL obligations are
file-scoped, not a permission to copy modules. [MPL-2.0](https://www.mozilla.org/en-US/MPL/2.0/)

| Branch (depth budget) | Questions | Initial evidence plan | Completion rule |
|---|---|---|---|
| A — model (3) | What persists? What is a run versus paragraph versus derived geometry? | schema, text types, format docs, migrations | schema + serialisation evidence |
| B — editing (3) | Which layer owns selection, IME, styles and commit? | DOM editor, CLJS binding, Rust state | trace one edit end-to-end |
| C — layout/render (3) | Who shapes/measures/renders and when is it invalidated? | Rust text, renderer, font store, features | cache and renderer traces |
| D — interoperability (2) | Fonts, Unicode/bidi, export/import, collaboration/components | docs, issues/release notes, targeted source | facts separated from unknowns |
| E — history/risk (2) | Is WASM the replacement or a side-by-side transition? | feature gates, release/tag comparison, log | current/transitional distinction |

**Revised plan after pass 1:** source showed three concurrent paths (legacy
Draft/SVG, V2 DOM, V3 WASM/Skia), so pass 2 focused on feature activation rather
than assuming V3 was universally deployed. Pass 3 tested that conclusion against
the release API and a shipped export/font defect.

## Executive summary

1. **[Confirmed fact]** Penpot persists text as a rich, nested content tree:
   `root → paragraph-set → paragraph → text leaf`. Paragraphs own alignment and
   direction; leaves own text and most inline typography/fill attributes. Shape
   dimensions and `grow-type` are persistent; the old `position-data` is a
   separately stored, derived geometry cache for the DOM/SVG route—not the
   authoritative text. [schema](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/common/src/app/common/types/shape/text.cljc),
   [attribute partition](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/common/src/app/common/types/text.cljc),
   [format documentation](https://help.penpot.app/technical-guide/developer/data-model/penpot-file-format/)
2. **[Confirmed fact]** Upstream has a V3 editor which uses a browser
   `contenteditable` surface for keyboard/clipboard/IME capture but keeps the
   editable selection, content mutation, layout, caret and selection overlay in
   Rust/WASM backed by Skia Paragraph. It synchronizes exported content back to
   the document pipeline after mutations. [DOM bridge](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/frontend/src/app/main/ui/workspace/shapes/text/v3_editor.cljs),
   [Rust editor state](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/render-wasm/src/state/text_editor.rs),
   [renderer documentation](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/render-wasm/docs/text_editor.md)
3. **[Confirmed fact]** This is not a completed replacement. `render-wasm/v1`,
   `text-editor/v2`, and `text-editor-wasm/v1` remain frontend-only feature
   gates; enabling the WASM renderer forces V2 but does *not* force the V3/WASM
   editor. The renderer selector can also choose SVG. Thus legacy DOM/SVG
   measurement and V2 DOM editing coexist with upstream V3/Skia. [feature
   catalogue](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/common/src/app/common/features.cljc),
   [activation policy](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/frontend/src/app/main/features.cljs)
4. **[Highly credible inference]** Penpot has deliberately moved geometry-critical
   layout into Skia/WASM to reduce browser-metric dependence, but it presently
   pays dual-pipeline complexity: duplicated editors, different measurement
   paths, and font provisioning timing. The release history includes fixes for
   remote-font bounds and the export path previously substituted a fallback font
   and clipped auto-width text. [2.17.0 release](https://github.com/penpot/penpot/releases/tag/2.17.0),
   [export issue #10208](https://github.com/penpot/penpot/issues/10208)

## Findings and reproducible architecture trace

### A. Persistent model and styles

| Concern | Observed mechanism | Evidence / confidence | Verdict |
|---|---|---|---|
| Shape text | A `:text` shape carries `:content`, `:grow-type`, normal shape geometry and an optional `:position-data`. The documented portable format serializes each shape independently in ZIP+JSON v3. | [shape schema](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/common/src/app/common/types/shape.cljc), [file format](https://help.penpot.app/technical-guide/developer/data-model/penpot-file-format/) — **confirmed fact** | **Adapted lesson:** durable rich text is data, while layout output must be distinguishable from it. |
| Content tree | Schema requires non-empty vectors at every tree level. Leaf identity is an optional `key` string; type helpers explicitly treat it as a Draft-editor artifact and ignore it in content comparison. | [content schema](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/common/src/app/common/types/shape/text.cljc), [comparison treatment](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/common/src/app/common/types/text.cljc) — **confirmed fact** | **Rejected lesson:** do not use editor artifact keys as durable semantic run identities. |
| Style scope | Root owns vertical alignment; paragraphs own horizontal alignment and direction; leaves own font identifiers/family/variant/size/weight/style, spacing, transform, decoration, typography references and fills. Line height is paragraph-level for the DOM editor even though stored redundantly on spans. | [style classification](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/common/src/app/common/types/text.cljc) — **confirmed fact** | **Adapted lesson:** explicitly distinguish block and inline style ownership. |
| Reusable typography | Leaves can retain `typography-ref-id` and `typography-ref-file`; typography assets are separate records. A typography token/style applies to the full text layer, not individual rich-text elements. | [schema](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/common/src/app/common/types/shape/text.cljc), [token guide](https://help.penpot.app/user-guide/design-systems/design-tokens/) — **confirmed fact** | **Deferred:** reference semantics and partial-run styling are separate product questions. |
| Derived legacy geometry | DOM measurement computes `position-data` and sizes auto-height/auto-width text; migrations repeatedly delete, repair, decode, or copy this field, and container logic labels it derived. | [DOM measurement](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/frontend/src/app/main/ui/workspace/shapes/text/viewport_texts_html.cljs), [migrations](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/common/src/app/common/files/migrations.cljc), [derived-attribute handling](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/common/src/app/common/types/container.cljc) — **confirmed fact** | **Adopted lesson:** never make cached glyph positions canonical. |

### B. Editing model and IME

**Current upstream V3 trace (when `text-editor-wasm/v1` is active):**

1. A transparent/positioned `contenteditable` receives DOM keyboard, pointer,
   plain-text clipboard and composition events. It is deliberately reset after
   ordinary input while retaining it for macOS marked-text/accent replacement.
   [input bridge](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/frontend/src/app/main/ui/workspace/shapes/text/v3_editor.cljs)
2. CLJS forwards insertion/deletion, paragraph splits, pointer selection,
   composition start/update/end and style actions through a WASM FFI layer.
   Browser input is therefore an adapter, not the authoritative rich-text DOM.
   [CLJS bindings](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/frontend/src/app/render_wasm/text_editor.cljs),
   [WASM exports](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/render-wasm/src/wasm/text_editor.rs)
3. Rust `TextEditorState` holds an active shape, anchor/focus selection,
   cursor state, pending styles and change events. Text operations edit the
   `TextContent` held in the WASM shape pool, clear its paragraph caches, and
   emit `ContentChanged`/`NeedsLayout`. [state](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/render-wasm/src/state/text_editor.rs),
   [editing helpers](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/render-wasm/src/wasm/text/helpers.rs)
4. The frontend exports/merges current content and commits it through the
   normal text-shape update path; the editor layer also derives the layer name
   from content. [sync/commit call site](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/frontend/src/app/main/ui/workspace/shapes/text/v3_editor.cljs),
   [content validation/commit support](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/frontend/src/app/main/data/workspace/texts.cljs)
5. Rust uses Skia range rectangles to render selection and caret overlays after
   layout; the DOM capture surface is not the selection renderer. [overlay
   renderer](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/render-wasm/src/render/text_editor.rs)

**Unicode, bidi and IME.** The user guide promises LTR/RTL direction and
automatic RTL detection. Source confirms explicit paragraph text direction,
RTL-swapped horizontal caret movement, UTF-16↔character-offset conversions at
the Skia boundary, and browser composition forwarding (including an empty
composition update on IME cancellation). [guide](https://help.penpot.app/user-guide/designing/text-typo/),
[cursor movement](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/render-wasm/src/state/text_editor.rs),
[offset conversion/layout](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/render-wasm/src/shapes/text.rs),
[composition adapter](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/frontend/src/app/main/ui/workspace/shapes/text/v3_editor.cljs)
— **confirmed fact** for these mechanisms. A concrete current limitation is
also source-visible: V3's up/down and line-start/end helpers are marked TODO for
line-metric-aware navigation, and its word predicate is only alphanumeric or
underscore; offsets count Rust `char`s, which is not equivalent to extended
grapheme clusters. [editor helpers](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/render-wasm/src/wasm/text/helpers.rs)
— **confirmed fact**. **Unknown:** this study did not verify conformance to UAX
#9, UAX #14, dictionary word boundaries, or all IMEs. Recent commits labelled
Japanese-layout and IME fixes are evidence that this boundary is still under
active correction, not proof of complete international-text support. [history for editor
file](https://github.com/penpot/penpot/commits/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/render-wasm/src/wasm/text_editor.rs)

### C. Layout, renderer, fonts, and caches

| Layer | Current upstream responsibility | Evidence / confidence |
|---|---|---|
| Browser | Captures IME/edit events; legacy path measures rendered HTML/SVG and computes position data. Browser layout is still real when the SVG renderer path is selected. | [V3 adapter](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/frontend/src/app/main/ui/workspace/shapes/text/v3_editor.cljs), [legacy measurement](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/frontend/src/app/main/ui/workspace/shapes/text/viewport_texts_html.cljs) — **confirmed fact** |
| Rust/WASM + Skia | Builds a Skia `ParagraphBuilder` per paragraph with span styles, lays out fixed/auto-height at the container width and auto-width at effectively unbounded width, then reads longest line/paragraph height. It renders text, stroke/shadow variants, selection and caret. | [layout implementation](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/render-wasm/src/shapes/text.rs), [text rendering](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/render-wasm/src/render/text.rs), [maintainer docs](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/render-wasm/docs/texts.md) — **confirmed fact** |
| Fonts | The browser fetches/provisions referenced fonts. WASM adds byte data to a Skia `TypefaceFontProvider`/`FontCollection`, clears font-collection caches after each new typeface, tracks chosen fallback families, and supplies default Source Sans Pro plus Noto Color Emoji handling. | [frontend font bridge](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/frontend/src/app/render_wasm/api/fonts.cljs), [Rust font store](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/render-wasm/src/render/fonts.rs), [text docs](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/render-wasm/docs/texts.md) — **confirmed fact** |
| Fallback | Penpot's own docs say Skia needs explicit font data and that language-appropriate Noto Sans plus Noto Color Emoji are loaded as fallback. The exact coverage/language algorithm is not claimed here without a separate source trace. | [text docs](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/render-wasm/docs/texts.md) — **single-source confirmed fact** |
| Invalidations | Text content has a monotonic content version, cached paragraph builders/paragraphs, layout version/width, and a cached tight extent keyed by width, height and vertical alignment. Editing clears paragraph caches; the frontend debounces WASM text resize for 40 ms and waits for required fonts before measurement. | [Rust cache/invalidation](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/render-wasm/src/shapes/text.rs), [frontend reflow](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/frontend/src/app/main/data/workspace/wasm_text.cljs) — **confirmed fact** |

**Rendering status matrix.** This is deliberately a path matrix rather than a
claim that a single renderer has won.

| Path | Edit surface | Measurement / paint | Status at specimen | Evidence note |
|---|---|---|---|---|
| V1 legacy | Draft.js-derived state, SVG editor | DOM/SVG and `position-data` | **Historical / still retained fallback** | [`app.common.text` self-labels as legacy](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/common/src/app/common/text.cljc); [viewport switch](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/frontend/src/app/main/ui/workspace/viewport.cljs) |
| V2 | DOM rich-text editor (`@penpot/text-editor`) | DOM path or synchronised WASM layout | **Transitional / broadly gateable** | [workspace text data](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/frontend/src/app/main/data/workspace/texts.cljs) |
| V3 | `contenteditable` input capture | Rust/WASM Skia paragraphs and Skia overlay | **Current upstream, opt-in gate** | [V3 component](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/frontend/src/app/main/ui/workspace/shapes/text/v3_editor.cljs); [feature policy](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/frontend/src/app/main/features.cljs) |

### D. Collaboration, components, import/export, and migration

- **Collaboration — unknown at operation granularity.** A remote shape change is
  marked with a session id and intentionally skips legacy local text
  remeasurement; the study did not find text-specific CRDT/OT or a run-level
  merge protocol in the examined primary paths. Thus it is safe to say rich text
  ultimately travels as document shape changes, but **not** safe to infer
  character-wise concurrent-edit semantics. [remote-measurement guard](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/frontend/src/app/main/ui/workspace/shapes/text/viewport_texts_html.cljs)
- **Components — confirmed fact / bounded inference.** A text is an ordinary
  shape and the file model has generic component reference, shape reference and
  `touched` fields. Text-specific code tracks typography/fill reference
  attributes, but this study found no text-only component resolver. **Highly
  credible inference:** a text inside a component uses the generic component
  update/override system, rather than a separate text-instance representation.
  [file model](https://help.penpot.app/technical-guide/developer/data-model/penpot-file-format/),
  [text attributes](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/common/src/app/common/types/text.cljc)
- **Import/export — confirmed fact and limitation.** Native `.penpot` v3 is ZIP
  plus JSON and serializes text content/formatting in the text shape; exported
  text depends on font availability as much as the editor. Issue #10208
  reproduced fallback-font substitution clipping auto-width exports in 2.16;
  it is listed fixed in 2.17.0, but no independent pixel-parity retest was run.
  [file format](https://help.penpot.app/technical-guide/developer/data-model/penpot-file-format/),
  [issue](https://github.com/penpot/penpot/issues/10208),
  [release](https://github.com/penpot/penpot/releases/tag/2.17.0)
- **Migrations — confirmed fact.** Penpot runs ordered data migrations recorded
  in file metadata. Text migrations include legacy positional-data repairs,
  fill migration, blank-style cleanup and empty-tree repair. That history is
  direct evidence that persisted text needs validation and repair paths; it is
  not evidence that all old content is losslessly normalised.
  [migration implementation](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/common/src/app/common/files/migrations.cljc),
  [format migration semantics](https://help.penpot.app/technical-guide/developer/data-model/penpot-file-format/)

## Limitations, contradictions, and negative results

| Finding | Evidence | Consequence / verdict |
|---|---|---|
| “WASM text” is not synonymous with all Penpot users. | Renderer preference can be SVG; V3 editor remains separately gated. [activation policy](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/frontend/src/app/main/features.cljs) | **Rejected:** describe it as a completed migration. |
| Official guide says automatic RTL detection, while schema/source chiefly expose explicit direction and Skia calls. | [guide](https://help.penpot.app/user-guide/designing/text-typo/), [text types](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/common/src/app/common/types/text.cljc) | **Deferred:** claim automatic detection algorithm or full bidi correctness without black-box tests/source trace. |
| Custom-font upload accepts TTF/OTF/WOFF/WOFF2, but renderer metric parity was a real export bug. | [font guide](https://help.penpot.app/user-guide/designing/text-typo/), [#10208](https://github.com/penpot/penpot/issues/10208) | **Adapted lesson:** a font identifier is insufficient evidence of equal metrics across editor and export. |
| Native format docs name `positionData`, whereas upstream's Skia path obtains dimensions from live layout and makes no use of browser glyph positions for V3 sizing. | [format docs](https://help.penpot.app/technical-guide/developer/data-model/penpot-file-format/), [WASM measurement](https://github.com/penpot/penpot/blob/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86/frontend/src/app/main/data/workspace/wasm_text.cljs) | **Adapted lesson:** an export format can preserve legacy derived fields during renderer migration; do not mistake them for a canonical contract. |

## Competitor-specific lessons and risks (not a Crafty design)

| Observation | Transferable problem/constraint | Study verdict |
|---|---|---|
| Input capture is browser-native while selection/layout/paint are engine-native. | IME/accessibility and deterministic geometric layout pull in different directions. | **Adapted:** retain this as a boundary pattern worth evaluating; no implementation decision. |
| Persistent tree is independent of paragraph cache and selection state. | Rich-text document durability needs a model that survives renderer/editor replacement. | **Adopted as evidence:** authored content, derived layout and ephemeral edit state must remain separable. |
| V1/V2/V3 coexist. | A renderer/editor migration can have a long compatibility tail and duplicate bug surface. | **Rejected:** treating a second text pipeline as free. |
| Font bytes are provisioned before measurement, yet shipped bugs show timing/parity remains fragile. | Layout correctness depends on font data, fallback policy and environment, not just a font-family string. | **Adapted:** font-load state and remeasurement are first-class risks. |
| UTF-16 conversion appears at the Skia boundary. | Internal cursor offsets must declare units and conversion boundaries. | **Adapted:** never leave offset unit implicit. |

## Gaps and unknowns

1. No black-box fixtures were created (out of scope), so emoji ZWJ, combining
   marks, bidi isolates, line breaking, vertical text and screen-reader output
   are **unknown**, not validated.
2. No source-backed conclusion about collaborative text conflict resolution,
   history granularity, or remote concurrent typing is available from this
   bounded trace.
3. Exact fallback-language selection and font subsetting/cache eviction were not
   followed through every frontend/backend font service; only the renderer's
   explicit fallback set was verified.
4. SVG/PDF/PNG import conversion semantics and external-format text preservation
   were not fully traced. Native `.penpot` round-trip and the documented export
   issue were in scope; broad format support is **unknown**.
5. Upstream `develop` contains post-2.17 edits in all three core V3 files (schema,
   V3 component, WASM API); release behaviour must be pinned to a tag before
   using it as a compatibility target. [tag](https://github.com/penpot/penpot/tree/bdce5817ea86d028db29113d9ecdadcf07097b36), [develop](https://github.com/penpot/penpot/tree/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86)

## Source audit trail

| ID | Source | Class / SIFT-CRAAP assessment | Used for |
|---|---|---|---|
| P1 | [Penpot source, pinned develop](https://github.com/penpot/penpot/tree/59ef07633aae46450c7e8738ee8b1fd1bbd2ea86) | Primary, maintainer source; current but development branch | all code-path findings |
| P2 | [Penpot 2.17.0 release](https://github.com/penpot/penpot/releases/tag/2.17.0) | Primary release record; authoritative for shipped scope, vendor-authored | version and regression/fix status |
| P3 | [Penpot technical file-format guide](https://help.penpot.app/technical-guide/developer/data-model/penpot-file-format/) | Official documentation; current and corroborated against schema | container, portable schema, migration semantics |
| P4 | [Penpot text/typography guide](https://help.penpot.app/user-guide/designing/text-typo/) | Official user documentation; product-intent claim, cross-checked against source where possible | exposed UI and font/RTL claims |
| P5 | [Issue #10208](https://github.com/penpot/penpot/issues/10208) | Primary project issue; a bug report, not an independent benchmark | known export/fallback failure and its scope |
| P6 | [MPL-2.0](https://www.mozilla.org/en-US/MPL/2.0/) | Primary license text | clean-room/reuse gate |

**Source quality note.** No secondary source carries a load-bearing claim
(primary: 6; secondary: 0). Repository documentation was treated as intent and
checked against the pinned code when it asserted architecture. The issue is
treated as a reproduced project defect, not a general performance measurement.

## Sufficiency and stop check

All requested branches have source support or an explicit unknown. Two
independent primary forms (source plus release/docs) support the central
conclusion that the system is transitional; single-source claims are marked.
The final curiosity pass scored (a) exact bidi algorithm, (b) collaborative
operation wire format, and (c) every external importer higher cost than value
for this named decision, because each needs a new bounded study/fixtures. Recent
pass additions refined history and font/export risk rather than changing the
architecture conclusion. **Stop: coverage and saturation reached.**

## Promising leads not pursued

| Thread | Why off-frame | Estimated value / cost | One-line authorization plan |
|---|---|---|---|
| Bidi, grapheme and IME fixture matrix | Requires real browser/OS/IME probes, not source reading | high / high | Build a clean-room matrix of Arabic/Hebrew/Indic/CJK/emoji edits across Chrome, Firefox and Safari. |
| Collaboration wire protocol and conflict behaviour | Needs backend/realtime source and two-client experiment | high / high | Trace file-change protocol, then independently reproduce concurrent text edits. |
| SVG/PDF/PNG and foreign importer fidelity | Wider export/import subsystem than dynamic editor | medium / high | Pin samples, mutate one text property per fixture, compare native and export artefacts. |
| Font fallback language mapping | Needs every font service plus coverage fixtures | medium / medium | Trace font request→WASM provisioning and test absent-glyph cases per script. |
