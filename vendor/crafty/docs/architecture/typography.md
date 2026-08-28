# Typography

Status: **Current bounded rendering foothold; target text system remains open.**

What exists: schema-v5 text nodes carry a validated string and protocol-v5 text
commands render a single line through `ttf-parser`, embedded Inter, and the
ordinary Vello nonzero path pipeline. ADR 0024 corrects the contour adapter and
records an independent 36-row exact-RGBA Metal oracle. This remains a bounded
compatibility foothold: there is no authored font model, shaping, text metrics,
line breaking, editing, caret, fallback, or full text-fidelity guarantee.

This document exists because text is the most commonly underestimated subsystem
in a design tool, and because the shape of the text stack constrains the renderer,
the layout engine and the document model simultaneously.

## Text is not a rectangle containing a string

A production text stack is at least seven separable concerns. Conflating them is
how text subsystems become unfixable.

| Concern | What it does | Whose job |
|---|---|---|
| **Font loading / discovery** | parse font files, expose tables, resolve family+weight+style to a face, manage embedded and system fonts | font service |
| **Itemisation** | split a string into runs by script, direction, font and style | shaping stage |
| **Bidi** | reorder runs for mixed LTR/RTL per UAX#9 | shaping stage |
| **Shaping** | map codepoints → glyph ids + positions, applying OpenType features, ligatures, kerning, marks | shaping engine |
| **Line breaking** | choose break opportunities per UAX#14, apply the width constraint, justify | layout stage |
| **Rasterisation** | glyph outlines → coverage bitmaps or SDF, at a device scale | glyph cache |
| **Composition** | place rasterised glyphs on the GPU with the right colour, transform and clip | renderer |

HarfBuzz — the reference implementation and the engine everyone ends up using —
does exactly one of these. It takes a font and a run of text and returns
positioned glyphs. It does **not** load fonts, do bidi, break lines, or
rasterise. Any design that treats "text" as one component will discover these
boundaries the hard way.

## The Rust option is unusually strong here

Crafty already has a Rust/WASM stage. The Rust text ecosystem is mature and maps
cleanly onto the concerns above:

- **rustybuzz** — a complete port of HarfBuzz's shaping algorithm to Rust,
  compiles to WASM.
- **cosmic-text** — shaping (via HarfBuzz-lineage), custom safe-Rust layout with
  bidi support, font discovery via `fontdb`, and optional rasterisation via
  `swash`.
- **swash** — rasterisation with ligature and colour-emoji support.

This is a real advantage over doing text in TypeScript, and it argues for text
shaping living in the WASM stage rather than the browser. It is not a decision
yet — see the open questions — but it is the strongest argument the Rust boundary
has for expanding beyond packet encoding.

**What Crafty must not do:** measure text with a hidden DOM element or a 2D
canvas `measureText` call. It is not deterministic across machines, it cannot be
run headless, and it produces different results from whatever eventually renders
the glyphs.

## Authored versus resolved, for text

- **Authored:** the string, and typographic *intent* — family, weight, style,
  size, line height, letter/word spacing, OpenType feature settings, alignment,
  wrapping mode, decoration, and rich-text spans over character ranges.
- **Resolved:** shaped glyph runs — glyph ids, advances, offsets, cluster
  mapping, line boxes, baselines.

Shaped runs are **derived and disposable** and must never be authored. The
cluster map (glyph index ↔ character index) is not optional: it is what makes
caret placement, selection, hit testing and accessibility possible.

## Rich text

A text node needs character-range styling. Two models:

- **Span tree** — nested styled ranges. Natural for editing, awkward to diff.
- **Flat runs** — an array of `{ start, end, style }`, normalised and
  non-overlapping. Easier to validate, diff and command-ify.

**Proposed: flat runs**, because every mutation becomes an invertible command
over a normalised array, which is what the command model
([`editor.md`](editor.md)) requires. Overlapping or unsorted runs
become a validation error like any other document invariant.

## GPU strategy

**Current.** The compatibility foothold converts embedded-Inter outlines to
ordinary path geometry inside Rust. This does not select the eventual glyph
realization strategy.

**Target.** Vector/Vello and atlas realization remain separate candidates. Atlas
variants include the following; selection requires shared fixtures and measured
evidence, not preference.

- **Glyph atlas.** Rasterise glyphs at the needed device scale into a texture
  atlas; draw textured quads. Simple, fast, universally used. Needs
  re-rasterisation across zoom levels, an eviction policy, and atlas paging for
  CJK and emoji.
- **SDF / MSDF atlas.** One rasterisation scales across zoom. Cheaper on
  memory and re-raster churn; worse at small sizes and with fine hinting.

An atlas path would require glyph-run references, texture resources, a sampler,
and a text pipeline. Its atlas would be a **cache keyed by (face, glyph id, size
bucket, device scale)** — a cache key, not document identity (I30). Those are
candidate consequences, not implemented architecture.

Colour emoji and variable fonts each add a rasterisation path. Scope them
explicitly; do not discover them mid-implementation.

## Editing

Text editing is a second interaction mode, not a tool variant. It needs, at
minimum:

- a `focusedId` editing context (the field already exists on `EditorState` and is
  unused),
- caret placement from a screen point via the cluster map,
- caret movement by grapheme cluster, word and line — not by code unit,
- range selection with the same cluster granularity,
- IME composition support,
- an input model (invisible input element or `beforeinput`) that does not fight
  the canvas's pointer capture,
- commands for insert/delete/replace over ranges, each invertible, coalesced into
  sensible undo units (typing a word should not be twenty undo steps),
- Escape and blur that commit or cancel deterministically, with no partial state.

The interaction reducer will need an editing phase that suppresses tool
dispatch — pressing `R` while editing text must type "r", and the current
keyboard map already has to special-case `INPUT`/`TEXTAREA`/`contentEditable`
(`isTextEntry`, `keyboard-bindings.tsx:17`) which is a warning sign of the same
problem.

## Sequencing

The smallest path that produces real text rather than a demo:

1. Font model in the document (family, size, weight, style, line height,
   alignment) plus validation. No rendering change.
2. Shaping stage producing glyph runs and a cluster map, with deterministic
   snapshot tests against recorded reference output.
3. Glyph atlas and a text pipeline in the renderer host — display only.
4. Line breaking with a width constraint, wired into the layout measure pass.
5. Caret, selection and editing commands.
6. Rich-text runs.
7. Variable fonts, colour emoji, vertical writing modes, OpenType feature UI.

Do not attempt 5 before 2. Editing without a cluster map is a caret that lands in
the wrong place in every non-Latin script and in any font with ligatures.

## Open decisions (each ADR-worthy)

| Question | Notes |
|---|---|
| Shaping in Rust/WASM or TypeScript? | Rust has the better libraries and the boundary already exists. Cost: crate size, font data crossing the boundary, and a second place where fonts live. |
| Atlas or SDF? | Benchmark at the sizes and zoom range Crafty actually uses. |
| Where do fonts live? | Embedded in the document, referenced from a library, or system-resolved. This is also a licensing question for export. |
| Font fallback chain | Deterministic and documented, or the same document renders differently on two machines. |
| Do we ship a text engine or depend on one? | A dependency imports a license into the resolution core. |
