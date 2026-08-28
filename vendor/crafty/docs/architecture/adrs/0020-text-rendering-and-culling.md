# ADR 0020: Text rendering in Vello, and viewport culling of authored content

Status: Accepted — implemented
Date: 2026-08-09
Implementation status: protocol v5 (`text` geometry), glyph tessellation
(ttf-parser 0.24 over an embedded Inter, SIL OFL 1.1), text-layer rect
suppression, and viewport culling of authored rects are implemented and
verified — 44 cargo tests (incl. glyph tessellation, empty/missing-glyph
tolerance, culling and selection-never-culled), 414 editor-kernel tests and
91 scene-renderer vitest. On-screen pixels for the new geometry are pending
the renderer's standing gap 8 (the real-browser spike), like every previous
renderer feature; nothing in this record claims otherwise.

## Context

The gap analysis (2026-08-09) found the renderer cannot draw a single glyph:
the crate's roadmap comment ("the glyph/text path is a separate roadmap
decision", Cargo.toml) made text the keystone that blocks measurement
readouts, dimension pills, rulers, frame labels and the text tool all at
once. Separately, every authored node was encoded into the frame packet
every frame — only overlays were culled — which caps document size before
"feel" even enters the picture.

The Linebender stack (Parley + Skrifa) is the ecosystem answer for full text
(shape, layout, bidi, line breaking). It is also a large dependency surface
for the first step: the encoder only needs GLYPH OUTLINES — a string's
shapes at a size. Vello renders paths; glyph outlines are paths.

## Decision

1. **Text draws as tessellated glyph paths, protocol v5.** A `text` draw
   command carries the string and a size; the encoder tessellates the glyphs
   from an embedded font (ttf-parser over Inter-Regular, SIL OFL 1.1 —
   `packages/scene-renderer/rust/fonts/`, license vendored) into the
   ordinary path pipeline. The packet never carries outlines. Layout is the
   single-line advance ladder (hmtx advances; the ascent places the
   baseline). Unsupported characters and missing glyphs are skipped — a
   text draw is never a hard failure. Text layers' scene rects become
   invisible scaffolding (the encoder skips the rect for `type: "text"`).
   Glass fills and strokes on text are deferred (a hex fill is required for
   the text command; glass text keeps the rect pass).
2. **Parley/Skrifa remain the strategic path**, explicitly NOT taken today:
   shaping, metrics, font selection, editing, line breaking and the text
   tool build on this tessellation seam, and adopting the Linebender layout
   stack replaces `text.rs`'s advance ladder without touching the packet.
3. **Viewport culling of authored rects at encode time.** The encoder skips
   any layer whose world box cannot intersect the viewport. The SELECTED
   layer is never culled (its outline must draw). A culled parent still
   recurses — a child outside its parent's bounds but inside the viewport
   draws (each layer is culled by its own box). Because the scene re-encodes
   every frame, a pan simply re-includes newly visible layers; there is no
   retained state to invalidate. The host-composed path/text channel is not
   yet culled (the harness could filter it with the same test); that is a
   follow-up refinement, not part of this decision.
4. **The font is embedded in the module**, not fetched and not a host
   packet: the module stays self-contained, the encode stays deterministic,
   and a future font-selection feature extends the packet rather than
   re-plumbing the tessellator. The size cost (~300 KB Inter, ~100 KB
   gzip) is accepted; module-size records in the crate's benchmark docs
   move with it.

## Consequences

- Text renders today: text nodes draw their authored string via the
  inspector's existing "Text content" field, and the measured-feature
  backlog (readouts, rulers, labels) is unblocked.
- The `fontSize` proxy is the box height until the model carries a
  font-size property (schema change, separate decision).
- Encoder cost now scales with what is on screen for rects; the selection
  guarantee means a selected off-screen node still renders its chrome.
- Batch/delta encode semantics for text layers: text layers have no cached
  rect, and the batch path treats that absence as a non-miss — the batch
  path is effectively retired anyway (the host re-requests the full packet).
- Rendering a string is deterministic across runs and platforms (embedded
  font, no OS font lookup) — the fingerprint parity harness keeps witnessing
  this.
