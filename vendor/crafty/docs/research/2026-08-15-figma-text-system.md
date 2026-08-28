# Figma dynamic text system — public-evidence study

**Decision served:** establish what a competitor-specific text study can safely contribute to later Crafty text-substrate synthesis, without treating Figma's undisclosed implementation as fact.
**Scope:** Figma Design text only; current as inspected **2026-08-15**.
**Effort tier:** deep, bounded primary-source study. No source code was copied, no binary/file-format probing was performed, and Figma's proprietary internals were not inferred from UI appearance.

## Executive summary

1. **Figma publicly exposes a rich, mutable text-node model, not its internal text engine.** A text node stores raw `characters`, permits character-range mutations, and exposes segments composed of a contiguous character range plus effective style properties. This is firm interface evidence, not a claim about private storage. **Confirmed fact.** [S1][S2]
2. **Cross-platform deterministic layout is an explicit Figma goal.** Figma says it interprets font files and makes formerly platform-owned typography decisions because platform-dependent rendering would harm collaborators; it documents a Figma-specific line-height distribution, fixed-pixel treatment, emoji line-box policy, and legacy-compatible rollout. **Published claim / confirmed product-policy fact.** [S3]
3. **Font availability is part of edit validity.** The API reports missing fonts and requires the relevant font to be loaded before character/style and layout mutations. Figma ships Google and specified Apple fonts, bridges local fonts through its desktop app/localhost FigmaAgent, limits extra local fonts on ChromeOS/Linux, and supports account-uploaded fonts for MCP and agent products. **Confirmed fact.** [S1][S4]
4. **The public surface establishes substantial authored intent:** per-range family/style, size, spacing, case, fill, decorations, OpenType flags, paragraph/list/wrap options, text-style links, and variable bindings; it does *not* reveal shaping engine, Unicode-version pin, fallback algorithm beyond a 2020 statement, glyph cache, atlas/SDF choice, caret coordinate model, IME protocol, or collaboration operation granularity. **Confirmed fact (surface) / unknown (mechanism).** [S1][S2][S5]
5. **Do not read a renderer article as a text-engine disclosure.** Figma has disclosed C++→Wasm/native renderer builds, a WebGPU backend, shader translation, batched uniform uploads, bind-group reuse, render-pass batching, benchmarking, and dynamic WebGPU→WebGL fallback. It never says how glyphs are shaped, cached, rasterized, or submitted. **Confirmed fact / explicit non-conclusion.** [S6]

**Competitor-specific verdict:** **adapted lesson, not adopted design** — the evidence supports treating text as durable raw content plus range-level intent, with resolved layout/raster output disposable; it does *not* license copying Figma's undisclosed engine or assuming its platform/fallback policy transfers. The major risk is mistaking Figma's deterministic-output goal for evidence of a specific shaping or cache architecture. **Highly credible inference.** [S1][S3][S6]

## Frame, sub-question tree, and revisable plan

| Branch (depth budget) | Question | Evidence target / stop condition |
|---|---|---|
| 1 (3) | What authored text, run, style, layout, and variable information is public? | Plugin API node, segment, style, resize docs |
| 2 (3) | What does Figma disclose about fonts, fallback, measurements, Unicode and deterministic output? | Figma typography engineering/editorial + font help |
| 3 (2) | What is disclosed about rendering/performance/platform constraints? | Figma rendering engineering article + help docs |
| 4 (2) | What can be asserted about editing, bidi/IME, collaboration and interchange? | Public API coverage; standards only as requirements context; unknowns named |

**Plan (revised once):** (1) read public API contracts before product/editorial material; (2) triangulate font/layout claims with Figma's 2019–2025 posts and current help; (3) use Unicode only to distinguish a standard requirement from a Figma disclosure; (4) stop rather than reverse-engineer private artifacts or invent mechanisms. The curiosity pass prioritized current font-discovery policy and renderer/platform constraints; it rejected patents, third-party teardowns, and black-box editor probing as off-frame/low-evidence for this contract.

## Evidence boundary and terminology

* **Confirmed fact** means the cited public source directly specifies the API, behavior, or stated implementation.
* **Published claim** means Figma's own post/help documentation says it; it is authoritative for intended behavior and disclosed architecture, but not an independently measured benchmark.
* **Highly credible inference** is a narrow conclusion from those facts.
* **Unknown** means no checked source supports a conclusion. Absence from a plugin API is evidence only that it is not exposed there, never proof that Figma lacks it internally.

All material factual claims below cite a source identifier that resolves to a URL, title, publication date where supplied, and access date in the source table. Figma sources are primary but vendor-authored; the Unicode source is a normative standard, not evidence of Figma conformance.

## Findings

### 1. Authored text, runs, styles, and layout modes

| Concern | Public evidence | Verdict |
|---|---|---|
| Text content and mutation | `TextNode.characters` is raw text; insertion/deletion operate on start-inclusive/end-exclusive character indices. The node may report `hasMissingFont`. **Confirmed fact.** [S1] | **Adapted:** durable logical text should not be conflated with glyph output; no claim about Figma's internal rope/piece-table/CRDT. |
| Styled ranges | Figma describes text as whole-node *or individual character-range* properties. `getStyledTextSegments` returns contiguous `characters`, `start`, `end`, and requested effective fields; `StyledTextSegment` enumerates font, paint, paragraph/list, link, OpenType, style-ID, override and bound-variable data. **Confirmed fact.** [S1][S2] | **Adapted:** the public contract validates range-level intent as a first-class concern. It does not prove ranges are Figma's persistence primitive. |
| Mixed values and styles | A whole-node property can return `figma.mixed`; a `TextStyle` has a stable style id, linkable fields, remote/read-only status, and variable bindings. **Confirmed fact.** [S1][S5] | **Adapted:** “mixed” is an inspection result, not an authored value. Do not infer Figma’s style-resolution order beyond exposed fields. |
| Layout modes | `textAutoResize` distinguishes fixed box (`NONE`), fixed width/auto height with wrapping (`HEIGHT`), and auto width/height with no wrapping (`WIDTH_AND_HEIGHT`); `TRUNCATE` is deprecated. Alignment, paragraph indent/spacing, wrapping, lists, hanging punctuation/list controls, vertical alignment, ellipsis and maximum lines are exposed. **Confirmed fact.** [S1][S7] | **Adapted:** layout mode is authored policy, distinct from measured bounds. The line-break algorithm itself is **unknown**. |
| Decorations and features | Range fields include underline/strike style, offset, thickness, colour, skip-ink, case, letter spacing, line height, fills, hyperlinks and OpenType feature flags. Figma announced OpenType support in local, Google and organization-shared fonts. **Confirmed fact / published claim.** [S1][S2][S8] | **Adapted:** preserve user intent separately from whether a font makes a feature relevant; do not assume a fixed Figma feature-tag set. |
| Variables | Text styles and text ranges expose bindings for variable-bindable text fields, and the node exposes resolved/explicit variable modes. **Confirmed fact.** [S1][S5] | **Adapted:** variable references are exposed authored linkage; evaluated values are not evidence Figma serializes resolved values. |

### 2. Fonts, fallback, OpenType and measurement

**Font identity/loading.** Public plugin identity is only `{ family, style }`; the API requires a target font to be loaded before relevant edits, including setting text, most style/layout properties and many range mutations. **Confirmed fact.** [S1][S9] This makes font resolution an observable precondition, rather than an invisible render-only concern. **Highly credible inference.** [S1]

**Discovery and availability.** Current Figma help says files include Google and Apple fonts by default; local `.TTF`/`.OTF` are surfaced via its desktop app or FigmaAgent. The browser agent runs localhost HTTP/HTTPS, permits only `figma.com` connections, and is not publicly exposed. The help article states additional local fonts are unsupported on ChromeOS/Linux; collaborators missing a font style receive a missing-font error. Account-uploaded fonts are available to files plus Figma MCP/agent after rights confirmation. **Confirmed fact.** [S4] This is a platform/product availability policy, not a disclosure that font bytes are embedded in every document. **Unknown.**

**Fallback/substitution.** In 2020 Figma stated it uses only Noto fonts for fallback, regardless of client platform, and chooses no glyph when its fallback chain is exhausted; the article contrasts this with OS fallback. **Published claim, single historical source.** [S10] It should not be promoted to a present-tense exhaustive fallback specification: no checked current API/help page specifies chain order, script/language selection, emoji policy, font version pinning, or missing-font substitution geometry. **Unknown.**

**OpenType and variable fonts.** Figma's 2019 announcement says it supports OpenType features in local, Google and organization-shared fonts and preserves feature intent through font/mixed selections. **Published claim.** [S8] The current API exposes explicit `openTypeFeatures` flags but no general variable-font axis object on `TextNode` or `StyledTextSegment`. **Confirmed fact about the checked API.** [S1][S2] Therefore selectable variation axes in Figma *Design text*, their storage, clamping/defaults, and whether the 2024 Figma Sans brand variable-font story reflects editor controls are **unknown**. [S11]

**Measurements and line boxes.** Figma's 2019 type post says it changed new text so 100% line height means font size; automatic line height follows a font's default; explicit pixel line height is respected; subsequent-line leading is placed above; emoji do not expand the line box; trailing letter spacing does not affect the line for centering; and existing text was not automatically upgraded. **Published claim.** [S3] Its stated motive was one cross-platform interpretation of fonts for multiplayer/design-on-any-platform use. **Published claim.** [S3] Formulae, rounding, font-table precedence, axes, and exact baseline/bounds APIs are **unknown**.

### 3. Unicode, shaping, line breaking, bidi, caret and IME

Figma publicly says it must interpret font files and take ownership of typographic decisions for cross-platform collaboration. **Published claim.** [S3] That supports only the conclusion that it does not delegate *all* typography policy to a platform. It does **not** identify HarfBuzz, CoreText, DirectWrite, ICU, a Unicode version, GSUB/GPOS coverage, normalization policy, script/language assignment, grapheme-versus-UTF-16 indexing, line-break standard/tailoring, justification algorithm, or hyphenation. **Unknown.**

Unicode UAX #9 specifies logical-order text with display reordering by resolved embedding levels and says characters remain in logical order; it also notes shaping follows reordering and higher-level protocols can select paragraph direction. **Confirmed standard fact; not Figma conformance evidence.** [S12] Figma's public range functions saying “character” and using numeric indices are insufficient to decide their Unicode segmentation unit. **Unknown.** [S1]

No checked official source specifies Figma's caret stops, visual/logical arrow movement, selection affinity at bidi boundaries, word/line selection rules, copy normalization, composition-underlining, IME transaction boundaries, accessibility text exposure, or remote-caret transform during concurrent typing. These are **unknown**, not absent features. The 2019 article's mention of “text cursors” and selections describes research problems, not a protocol. **Published anecdote; no implementation conclusion.** [S3]

**Competitor-specific risk verdict: deferred.** Standards-compliant bidi and complex-script behavior cannot be reconstructed from Figma's exposed range API; future evidence would need documented behavior tests and a separate accessibility/IME scope, not guesswork. **Highly credible inference.** [S1][S12]

### 4. Rendering, quality, caches and invalidation

Figma's 2025 renderer article discloses: a C++ renderer compiled to Wasm for the app and native x64/arm64 for server rendering/testing; WebGPU via Emscripten bindings (moving toward Dawn bindings); shader processing from legacy GLSL to WGSL; one batched uniform buffer per encoded submission; bind-group reuse and render-pass batching; performance testing across Mac/Windows/ChromeOS; and mid-session WebGPU-to-WebGL fallback when tests/device failures occur. **Confirmed fact / published engineering claim.** [S6]

Those facts establish an engine-like renderer with shared web/native code and measured rollout discipline. **Highly credible inference.** [S6] They do not disclose whether text is sent as glyph instances, vector outlines, texture atlas quads, SDF/MSDF, platform bitmaps, or a hybrid; nor font/glyph cache keys, eviction, subpixel/hinting policy, antialiasing quality, incremental text reflow, damage tracking, or exact invalidation dependencies. **Unknown.** [S6]

The article’s performance statements are not text benchmarks and publish no text-specific numbers; do not compare them with a text renderer's timings. **Confirmed limitation.** [S6]

### 5. Collaboration and interchange

The strongest public collaboration relevance is Figma's explicit statement that platform-dependent typography would trouble people collaborating on one file, which motivated owning font interpretation/decisions. **Published claim.** [S3] The plugin API additionally makes text mutations range-addressed and font-gated. **Confirmed fact.** [S1] Neither source states Figma's server text operation format, transform/merge method, revision model, run-conflict policy, or whether font availability is synchronized as data versus diagnosed per client. **Unknown.**

The public API exposes raw characters, styled segments and style/link/variable metadata to plugins, an observable programmatic interchange surface. **Confirmed fact.** [S1][S2][S5] It does not establish lossless export/import semantics to CSS/SVG/PDF/HTML, text-outline conversion conditions, embedded-font licensing behavior, or the private `.fig` schema. **Unknown.** The line-height article merely says its Code panel outputs more transition information; it is not a general interchange specification. **Published claim / limited scope.** [S3]

## Comparison matrix: disclosed contract vs. undisclosed mechanism

This is a single-competitor matrix, not a scorecard. “Shipped” means exposed in the checked public contract; “unknown” means no inspected source supports it.

| Decision-relevant dimension | Figma public evidence | Maturity | Confidence | Competitor-specific lesson / verdict |
|---|---|---:|---|---|
| Durable text and style intent | Text node, raw characters, range methods, styled segments, styles and variables. [S1][S2][S5] | Shipped | Confirmed fact | **Adapted:** APIs can describe intent without shaped glyphs. |
| Font-gated edit validity | Missing-font signal and load preconditions; local/cloud policy. [S1][S4][S9] | Shipped | Confirmed fact | **Adapted:** missing fonts are explicit product state, not silent geometry substitution. |
| Cross-platform typography policy | Figma says it owns font interpretation; documented line-height and Noto-fallback policy. [S3][S10] | Shipped / historical policy | Published claim | **Adapted:** determinism is a product constraint; specific fallback/metrics policies are Figma-specific. |
| Advanced typography | OpenType flags, documented UI; variable-axis editor contract not exposed. [S1][S2][S8][S11] | Shipped / partial | Fact + unknown | **Deferred:** do not infer axis semantics from brand-font usage. |
| Unicode/bidi/IME editing | No public engine, Unicode pin, caret/IME or bidi editing contract found. [S1][S3][S12] | Unknown | Unknown | **Deferred:** interface parity is not complex-text parity. |
| Render/performance mechanism | Shared C++ Wasm/native renderer, WebGPU transition and generic GPU caching/batching; no glyph mechanism. [S6] | Shipped / partial | Confirmed fact | **Rejected:** “WebGPU renderer” is not evidence for a glyph raster strategy. |
| Collaboration/interchange | Determinism rationale + plugin read/write surface; merge/export details undisclosed. [S1][S3] | Partial | Fact + unknown | **Deferred:** no protocol transfer is justified. |

## Gaps, contradictions, and negative results

1. **Historical-policy freshness:** the only checked source for Noto-only fallback is 2020. It is strong evidence of the then-intended policy, but a single historical source; current chain/version selection remains unknown. [S10]
2. **Public contract versus product UI:** current docs expose OpenType flags but no generic variation-axis field. That does not contradict Figma Sans being a variable brand font; it is a different surface and does not prove editor-axis absence. [S1][S2][S11]
3. **Line-height versus web:** Figma says its subsequent-line distribution and fixed-pixel behavior intentionally differ in details from CSS. “CSS-like” is therefore inaccurate. [S3]
4. **No proprietary implementation disclosure found:** no checked primary source identifies shaper, line breaker, font parser, Unicode data version, glyph atlas/raster method, cache/invalidation graph, document run storage, IME/bidi caret algorithm, text collaboration protocol, or `.fig` text serialization. This negative result is deliberate; none is filled with inference. [S1][S3][S6]

## Recommendations for later synthesis (competitor-specific only)

| Recommendation | Confidence | Verdict | Rationale |
|---|---|---|---|
| Treat Figma as evidence for a *separation problem*: raw/range intent, font resolution, layout, editing, and raster output have different lifetimes. | Highly credible inference | **Adapted** | Public API separates raw/range properties from Figma's stated need to interpret fonts for consistent layout. [S1][S2][S3] |
| Treat Figma's Noto fallback and line-box choices as constraints it selected, not universal typography rules. | Fact / published claim | **Rejected as direct transfer** | Figma calls out product-specific choices and intentional CSS differences. [S3][S10] |
| Require independent standards and behavioral evidence before asserting parity for bidi, complex scripts, IME, variable axes, or glyph performance. | Highly credible inference | **Deferred** | Public material does not provide those mechanisms or tests. [S1][S6][S12] |
| Do not use Figma’s generic WebGPU post to select a glyph representation or cache design. | Confirmed limitation | **Rejected** | It names GPU batching/cache practices but says nothing text-specific. [S6] |

## Audit trail and source quality

**SIFT/CRAAP review:** S1/S2/S5/S7/S9 are authoritative current public API contracts, highly relevant, but describe the plugin surface rather than private storage. S3/S6/S8/S10 are first-party editorial/engineering claims: useful for stated policy and disclosed architecture, not independent measurement. S4 is current first-party operational documentation and therefore strongest for availability constraints. S12 is the normative Unicode authority, used only for the standard’s requirements. No secondary source bears a material conclusion.

| ID | Source, publisher, date | URL | Class / use | Accessed |
|---|---|---|---|---|
| S1 | “TextNode,” Figma Developer Docs, undated | https://www.figma.com/plugin-docs/api/TextNode/ | Primary API contract: node, ranges, font gating, layout, variables | 2026-08-15 |
| S2 | “StyledTextSegment,” Figma Developer Docs, undated | https://www.figma.com/plugin-docs/api/StyledTextSegment/ | Primary API contract: segment fields | 2026-08-15 |
| S3 | “Getting to the bottom of line height in Figma,” Marcin Wichary/Figma, 2019-04-25 | https://www.figma.com/blog/line-height-changes/ | Primary product-policy disclosure: metrics/determinism/legacy migration | 2026-08-15 |
| S4 | “Add a font to Figma,” Figma Help, undated | https://help.figma.com/hc/en-us/articles/360039956894-Add-and-manage-fonts | Primary operational documentation: discovery, FigmaAgent, platform constraints, uploads | 2026-08-15 |
| S5 | “TextStyle,” Figma Developer Docs, undated | https://www.figma.com/plugin-docs/api/TextStyle/ | Primary API contract: linked styles/variables/remote status | 2026-08-15 |
| S6 | “Figma rendering: Powered by WebGPU,” Alex Ringlein and Luke Anderson/Figma, 2025-09-18 | https://www.figma.com/blog/figma-rendering-powered-by-webgpu/ | Primary engineering disclosure: renderer/performance/platform | 2026-08-15 |
| S7 | “textAutoResize,” Figma Developer Docs, undated | https://www.figma.com/plugin-docs/api/properties/TextNode-textautoresize/ | Primary API contract: resize semantics | 2026-08-15 |
| S8 | “An ode to OpenType,” Marcin Wichary/Figma, 2019-09-05 | https://www.figma.com/blog/opentype-font-features/ | Primary feature/policy disclosure | 2026-08-15 |
| S9 | “TextSublayer,” Figma Developer Docs, undated | https://www.figma.com/plugin-docs/api/TextSublayer/ | Primary API contract: explicit link to font-loading requirement | 2026-08-15 |
| S10 | “When fonts fall,” Marcin Wichary/Figma, 2020-09-29 | https://www.figma.com/blog/when-fonts-fall/ | Primary historical fallback-policy disclosure; single-source/currentness caveat | 2026-08-15 |
| S11 | “Just Our Type: The Story of Creating Figma Sans,” Figma, 2024-09-05 | https://www.figma.com/blog/the-story-of-creating-figma-sans/ | Primary brand-font context only; not editor API evidence | 2026-08-15 |
| S12 | Unicode Standard Annex #9, “Unicode Bidirectional Algorithm,” Unicode Consortium, Unicode 17.0 / 2025-08-13 | https://www.unicode.org/reports/tr9/ | Normative standard; not evidence of Figma conformance | 2026-08-15 |

**Source count:** 12 primary/standards sources; 0 secondary sources used for material findings. **Refresh trigger:** re-check S1/S2/S4/S6 whenever Figma changes its plugin API, font policy, or renderer disclosure; re-check S10 before using fallback policy as current fact.

## Sufficiency / stop check

Every requested branch has either direct support or an explicit unknown: document/runs/styles (S1/S2/S5); layout/font/fallback/OpenType/measurement (S3/S4/S7/S8/S10); renderer/performance/platform (S4/S6); and Unicode/editing, collaboration/interchange limits (S1/S3/S12). Further verification is needed only for intentionally unknown proprietary mechanisms or a separately approved black-box behavioral study. The final curiosity pass produced no higher-value thread within scope than those unknowns. Stop condition met: coverage complete, recent pass added clarification rather than a new mechanism, and no unsupported claim remains unlabelled.

## Promising leads not pursued

| Thread | Why off-frame / value-to-cost | One-line authorized follow-up |
|---|---|---|
| Controlled editor probes of grapheme indices, bidi caret movement, IME and fallback samples | Needs product account/browser harness and behavioral test protocol; high value but outside source-only contract | Obtain authorization and test matrix; record reproducible observations separately from internals. |
| Figma patents and job talks | Low expected direct disclosure; patents may describe broad possibilities rather than shipped behavior | Search only for direct text-engine claims, then classify as patent claim, not implementation. |
| Private `.fig` format and exports | No official schema checked; reverse engineering requires terms/license gate and sample corpus | Run a clean-room format study with ToS review, sample hypotheses and differential tests. |
| Accessibility tree and platform IME behavior | Important but requires cross-platform live-product observation | Create a separate accessibility/IME competitive study with platform-specific evidence. |
