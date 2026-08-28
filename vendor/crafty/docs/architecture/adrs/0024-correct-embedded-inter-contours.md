# ADR 0024: Correct the embedded-Inter contour adapter as a bounded foothold

Status: Accepted — implemented
Date: 2026-08-16

## Context

**Historical at decision time.** ADR 0020 established protocol-v5 text commands
and an embedded-Inter, single-line rendering foothold. It did not approve
shaping, fallback, font choice, editing, or full text fidelity. Its implementation
claim was nevertheless too strong: the then-current adapter dropped every
`move_to` anchor, ignored `close`, placed all contours of one glyph in one open
subpath, and stored curve handles on
`Corner` points whose handles the Vello encoder deliberately ignores
(`packages/scene-renderer/rust/src/text.rs:44-101,146-176`;
`packages/scene-renderer/rust/src/vello_encoder.rs:147-159,207-258`). The existing
`"Hi"` test proves only that some points and one fill were encoded; it cannot
witness contours, holes, winding, curves, or pixels
(`packages/scene-renderer/rust/src/vello_encoder.rs:1164-1203`).

**Current.** The available internal path boundary is sufficient for a bounded
correction. `DrawPathGeometry` represents multiple subpaths, explicit closure,
ordered on-curve points, and independent incoming/outgoing cubic handles.
`encode_path_geometry` emits a `move_to` for each subpath, emits its ordered
segments, closes authored closed subpaths, and Vello fills the combined path with
the nonzero rule. Command and viewport affines are applied after geometry
construction. Thus the source disproves the need to retire this foothold merely
to preserve ordinary TrueType contour topology.

**Current.** The pinned `ttf-parser` version is 0.24.1. Its `glyf` builder's
`finish_contour` emits a final `line_to` or `quad_to` whose endpoint is the
contour's first on-curve anchor and only then emits `close` (upstream
`ttf-parser` 0.24.1, `src/tables/glyf.rs:117-137`). Consequently, that terminal
callback is already the source closing segment. Retaining its endpoint as a
second copy of the first anchor *and* setting `DrawPathSubpath.closed = true`
would make the current encoder emit another wrap segment. That would violate the
topology invariant even if the duplicate happened to be zero-length.

The invariant at stake is narrower than text fidelity: a disposable renderer
projection must not silently change the topology of the source outline it claims
to draw. This decision must not promote scalar advance or embedded Inter into a
layout, font, or production-realization strategy.

## Constraints

- Canonical documents, commands, history, resolution ownership, and protocol-v5
  packet fields remain unchanged. Glyph contours remain disposable Rust data.
- One source-font contour becomes one closed Vello subpath. Source contour order,
  first anchors, segment order, and winding must survive the declared transforms.
- The existing nonzero fill behavior remains explicit; holes must result from
  preserved contour winding, not an even-odd substitution.
- The correction must use the existing embedded Inter bytes and current scalar
  advance ladder. It may not imply shaping, kerning, bidi, fallback, line layout,
  font selection, editing, or full text fidelity.
- Browser evidence is environment-qualified. Fixture coordinates are test inputs,
  not performance or quality budgets; no unexplained pixel tolerance may be
  invented.

## Options Considered

### 1. Correct the current outline-to-`DrawPathGeometry` adapter

This is plausible because the existing representation and Vello encoder already
carry the required topology: an initial on-curve anchor, ordered cubic-equivalent
segments, one closed subpath per contour, and affine/nonzero-fill behavior. It is
the smallest correction and preserves the current encode/failure boundary.

It loses relative to a dedicated glyph API because it normalizes TrueType
quadratics into the authored-path cubic convention and retains the current
per-frame geometry allocation. Those costs are acceptable only for this bounded
compatibility foothold; they are not a production realization endorsement.

### 2. Encode font callbacks through a second, direct Vello glyph-path adapter

This is plausible because direct `move_to`/segment/`close` emission can mirror the
font callback stream. It loses because it creates a second path encoder beside
`encode_path_geometry`, duplicates transform/fill/failure reasoning, and is not
needed to preserve the pinned font's contour topology.

### 3. Retire protocol-v5 text realization now

This is plausible because the later vector-versus-atlas decision remains open and
the current pixels are malformed. It loses because current source demonstrates a
bounded correction without a packet or ownership change, while immediate
retirement would remove the existing labels/readouts foothold before its eventual
replacement is selected.

### 4. Leave the malformed path until the full text investigation selects a stack

This is plausible because replacement may make the adapter short-lived. It loses
because known malformed output would remain the baseline and could be mistaken
for evidence in the later realization comparison.

## Decision

**Target.** Choose option 1. Correct the embedded-Inter adapter, and retain it only
as a bounded protocol-v5 compatibility foothold.

For each drawable glyph occurrence, the corrected projection must:

1. begin a new production subpath at every source `move_to`, retaining that point
   as the subpath's first on-curve anchor;
2. retain every source segment in callback order, using exact line geometry and
   exact quadratic-to-cubic degree elevation where the shared path convention
   requires cubics; cubic source segments retain both controls;
3. end that subpath at the matching source `close` and mark it closed—never merge
   two contours and never use glyph identity as contour identity;
4. order subpaths by glyph occurrence and then source contour callback order;
5. apply the existing font-unit scale, baseline/y-axis conversion, geometry
   rebase, command affine, and viewport affine without changing contour
   membership or segment order; and
6. draw the combined contours with Vello `Fill::NonZero`. The font-y-up to
   canvas-y-down conversion reverses winding once; any later affine reverses it
   again exactly when that affine has a negative determinant. Translation does
   not affect winding.

### Exact terminal normalization

**Target.** Let one valid raw callback contour be `move_to(A0)`, followed in
order by source segments `S1 ... Sn`, followed by one `close`, where `Sn` ends
at `A0`. For the pinned `glyf` callback stream, `Sn` is the source terminal
segment described above; `close` does not denote an additional geometric
segment.

The production subpath stores exactly the anchors `P0 ... P(n-1)`, where
`P0 = A0` and, for `1 <= i < n`, `Pi` is the endpoint of `Si`. It does **not**
store the endpoint of `Sn` as another anchor. It sets the subpath closed. The
only valid reconstruction is therefore:

```
P0 -> P1       = S1
...
P(n-2) -> P(n-1) = S(n-1)
P(n-1) -> P0   = Sn       // the closed-subpath wrap
```

The encoder's final `close` runs after that wrap has reached `P0`; it must not
add a segment. Thus `n` source segments produce `n` reconstructed segments, not
`n + 1`, and closure alone never creates a zero-length synthetic segment.

Controls attach to segment sides, not to callback records treated as standalone
points. For a segment from `P` to `Q`:

- a source line has no outgoing handle on `P` and no incoming handle on `Q` for
  that segment (the encoder's coincident endpoint controls preserve the exact
  line);
- a source quadratic with control `R` has cubic controls
  `C1 = P + 2(R - P)/3` and `C2 = Q + 2(R - Q)/3`, so `P.handle_out = C1 - P`
  and `Q.handle_in = C2 - Q`; and
- a source cubic with controls `C1, C2` has
  `P.handle_out = C1 - P` and `Q.handle_in = C2 - Q`.

Incoming and outgoing sides are assigned independently. In particular,
`P0.handle_out` comes from `S1`, while `P0.handle_in` receives the second cubic
control of terminal segment `Sn`; the outgoing side of `P(n-1)` receives `Sn`'s
first control. Folding `Sn` into the wrap must not overwrite `P0`'s outgoing
control. Every anchor with either source curve side uses `Free` handle mode so
the encoder consumes both independent handles; an anchor with two line sides
uses `Corner`. A curve-side handle remains present even when its delta is zero,
so callback kind and control retention remain observable.

Repeated coordinates are not deduplicated: a nonterminal callback endpoint is
stored even when it equals another anchor, and a source zero-length segment is
retained when the representation can encode it. Only `Sn`'s terminal copy of
`A0` is omitted, because `Sn` becomes the wrap. A contour with no matching
`close`, more than one `close`, a terminal segment not ending exactly at `A0`,
or fewer than two source segments cannot be represented exactly by the current
encoder (which does not emit a one-anchor wrap); normalization must fail that
glyph occurrence without emitting a partial contour or inventing geometry.

This ADR narrows ADR 0020 rather than superseding it wholesale. ADR 0020's coarse
protocol-v5 text command, embedded font, scalar advance ladder, rect suppression,
culling decision, and stated feature deferrals remain accepted. Its implication
that the implemented outline conversion was already a faithful path, and its
non-evidenced “Parley/Skrifa strategic path” guidance, are not foundations for
later work. This correction does not choose a layout engine or a final glyph
realization.

## Oracle Contract

### Source-font contour oracle

**Target.** The oracle source is exactly the bytes compiled as `text::INTER_FONT` from
`packages/scene-renderer/rust/fonts/Inter-Regular.ttf`, face index 0. Evidence
records the byte hash and resolved glyph ids. `O`, `B`, and `8` are mandatory
multi-contour/hole fixtures; a fixture that resolves to glyph 0 or lacks the
expected multiple source contours fails rather than being skipped.

An independent test collector—not the production `GlyphOutline` type—records the
raw `ttf_parser::OutlineBuilder` callback stream as ordered contours:
`move_to(first anchor)`, ordered `line_to`/`quad_to`/`curve_to` segments, and one
terminal `close`. It retains each segment's callback ordinal and kind as well as
its endpoint and controls. The expected side handles are derived independently
from those raw records using the terminal normalization above; the oracle must
not call or share the production collector/normalizer.

The oracle then reconstructs production segments from sorted stored anchors:
each consecutive anchor pair once, followed by exactly one closed wrap from the
last anchor to the first. It compares reconstructed segment `i` directly to raw
callback segment `Si` after the declared font scale, y conversion, pen placement,
and rebase. Both sides use canonical cubic tuples `(start, C1, C2, end)` for the
coordinate comparison: a line uses `(P, P, Q, Q)`, a quadratic uses the exact
degree elevation above, and a cubic retains its controls. In addition, the
source kind determines expected handle presence—line sides absent and both
curve controls present, including zero deltas—so geometrically coincident
controls cannot be silently dropped.

The comparison is binary:

- source contour count equals production closed-subpath count;
- each contour has exactly `n` stored anchors and exactly `n` reconstructed
  segments for its `n >= 2` raw segments; its first anchor and each
  ordinal-matched endpoint, canonical control tuple, source-kind handle presence,
  and terminal-wrap assignment agree after the declared transform;
- every production subpath is closed exactly once; and
- winding orientation is computed from the ordered Bézier contour (not point
  count or a raster sample) and equals source orientation multiplied by the sign
  of the y-conversion and subsequent affine determinants. Hole/outer contour
  relationships must therefore remain valid under nonzero fill.

### Controlled browser-pixel oracle

**Target.** The real-browser gate renders, in the same run and through the module-owned
Vello/WebGPU path, (a) the production text projection and (b) an independent
reference path built from the source collector above. Both use the same glyph,
paint, canvas, Vello settings, and transform. The mandatory matrix is `O`, `B`,
and `8` at local sizes 16, 32, and 64 under:

- identity: `[1, 0, 0, 1, 0, 0]`;
- fractional translation: `[1, 0, 0, 1, 0.375, 0.625]`;
- positive-determinant affine: `[1.25, 0.20, -0.15, 0.75, 17.25, 9.5]`; and
- reflection: `[-1, 0, 0, 1, 128, 0]`.

The two captured RGBA regions must be byte-identical. No percentage, channel, or
edge tolerance is approved by this ADR. If the controlled path cannot produce
exact equality, the gate fails and records the mismatch; it may not manufacture a
threshold. A reference re-record is an isolated reviewed change and cannot occur
in the contour implementation diff.

Every pixel record includes repository commit, font-byte hash, WASM artifact
hash, Rust target/profile, Vello/wgpu versions, browser name and exact version,
OS/architecture, WebGPU adapter/backend/driver fields available to the browser,
canvas CSS/device dimensions, DPR, color-space setting, and the full fixture
matrix. Results qualify only that recorded environment. The existing
`scripts/vello-browser-spike.mjs` readiness barrier must report a real WebGPU
frame first; a screenshot without that signal is a blocker, not evidence.

## Protocol and Compatibility Consequences

**Current retained boundary.** No protocol version change is required. Protocol
v5 continues to carry only the text string, local-unit size, paint, bounds,
transform, and ordering. Corrected contour commands are derived inside Rust and
do not cross the packet. Saying that v5 “carries corrected path commands” would
be inaccurate; it carries enough unchanged text input for Rust to derive them.

- Existing documents, canonical bytes, commands, migrations, and frame JSON are
  compatible and unchanged.
- Corrected glyph pixels intentionally differ from the malformed implementation;
  that visual change is the purpose of the decision, not a packet incompatibility.
- Missing/control-character tolerance, scalar advances, and embedded-font
  identity remain as in ADR 0020 and remain non-fidelity limitations.
- No implementation task is complete merely because this ADR is accepted.

## Implementation Evidence

**Current (2026-08-16).** The bounded correction and its independent oracle are
implemented. Production now retains one closed subpath per callback contour,
maps the terminal source segment to the last-to-first wrap, preserves independent
curve-side handles and callback-sortable contour order, and rejects malformed or
unrepresentable contours without partial geometry. Protocol v5, nonzero fill,
the embedded font, and the production UI remain unchanged.

The oracle is compiled only with the non-default Rust `pixel-oracle` feature.
Ordinary WASM builds contain neither `render_text_pixel_oracle` nor
`pixel_oracle_adapter_info`; the standalone harness builds its artifact in a
temporary directory. Its reference side independently implements
`ttf_parser::OutlineBuilder` collection and conversion and does not call the
production collector or normalizer.

The recorded Metal run covers all 36 `O/B/8 × 16/32/64 ×
identity/fractional/affine/reflection` rows. Separate production and reference
captures at identical compositor coordinates were byte-identical: zero differing
RGBA bytes, maximum delta zero, and visible pixels in every row. The retained
paired capture is presentation evidence only; using identical coordinates for
the binary comparison avoids position-dependent compositor quantization.

- Browser: Google Chrome 151.0.7922.138, headless, DPR 1, sRGB.
- GPU: ANGLE Metal Renderer on Apple M5; driver vendor Apple; module backend
  `BrowserWebGpu`; software fallback rejected.
- Font SHA-256:
  `40d692fce188e4471e2b3cba937be967878f631ad3ebbbdcd587687c7ebe0c82`.
- Oracle WASM SHA-256:
  `e805c6a2b158195a844644398aeea83b54b4f251abecc9c19f9bbd2f9e5106e8`.
- Production/reference compositor PNG SHA-256:
  `4ae1b2eaaace2b1691f3d92999106c42e901389586cf8c491fa9d799190fe4d5`;
paired PNG SHA-256:
  `7c7ccf0755abb192f8ed5a424570075cc2330f313e6d23b56890e8e04951255e`.
- Durable evidence:
  `openspec/changes/dynamic-text-capability/evidence/adr-0024-vello-pixel-oracle-2026-08-16.json`.
  The harness mutation record proves a one-pixel reference-capture shift fails
  all exact comparisons with exit code 2.

The unchanged retained contour acceptance source has SHA-256
`b57024bf2dd1556738574b2dcf02b5446a19b5478104332f704a51dad2da5d97`.
Applied to isolated baseline
`238968a8ca9459dc24496d3cf0e364aca6e9ae62`, it fails five independent
topology, closure, first-anchor, curve-control, and exact ordinal/segment/wrap
checks; the identical source passes all five on the corrected adapter. Raw output is retained in
`adr-0024-contour-red.txt` and `adr-0024-contour-green.txt` beside the source.

The browser artifact was rebuilt and rerun from deterministic source archive
SHA-256 `45a390398105668919ce3416837d0402918157ebbe4ed219d8522dd5e5376e16`.
Its complete 793-entry content/hash/mode manifest and exact reconstruction
procedure are retained as `adr-0024-source-snapshot-manifest.json`; the rerun
report embeds both archive and manifest identities. Canonical v4/v5 migration,
foundation-fixture, and loss-list-fixture bytes plus their exact byte edit script
are retained under `evidence/canonical-bytes/` and in
`2.7-canonical-byte-deltas.txt`.

## Risks and Pre-mortem

- A collector can preserve anchors but attach controls to the wrong on-curve
  endpoint. The ordered endpoint/control oracle fails before browser evidence.
- A collector can retain the terminal `A0` endpoint and also mark the subpath
  closed, duplicating `Sn` or adding a zero-length segment. The raw-segment-count
  and terminal-wrap assertions fail.
- Lexicographic map ordering can reorder contour 10 before contour 2. The source
  callback-order comparison fails; contour ids must encode sortable order.
- A correction can switch to even-odd fill and hide winding loss. The explicit
  nonzero-fill and winding checks fail.
- Headless geometry can pass while command/viewport transforms break pixels. The
  affine and reflection browser fixtures diverge.
- A screenshot can be accepted from software fallback, a different font, or a
  stale WASM artifact. The readiness signal and environment/artifact record make
  that run invalid.
- Later work can cite this correction as “text fidelity.” Review must reject any
  claim beyond the pinned embedded font's contour projection under this corpus.

## Validation and Acceptance Criteria

Implementation is accepted only when tasks 2.5 and 2.6 of the dynamic-text change
remain separately reviewable and all of these conditions are true:

- the independent source oracle fails against the current malformed adapter and
  passes against the correction for every mandatory glyph/size/transform;
- the production output has one closed subpath per source contour, preserves first
  anchors, reconstructs each raw callback segment exactly once in callback order,
  maps the terminal segment to the wrap without a duplicate first anchor or
  synthetic closure segment, preserves all incoming/outgoing controls,
  transformed winding, and nonzero holes;
- the controlled real-browser A/B RGBA comparison passes on at least one fully
  recorded real-WebGPU environment, with no invented tolerance;
- existing protocol-v5 decode, empty/missing-glyph behavior, last-valid failure,
  focused Rust/renderer checks, strict OpenSpec validation, and docs/static checks
  pass; and
- no test or document claims shaping, kerning, fallback, font choice, editing,
  layout, or full text fidelity.

## Rollback and Revisit Triggers

Before release, the correction can be reverted without document or protocol
migration. After release, rollback changes pixels but not durable or packet bytes;
it also knowingly restores malformed contours and therefore cannot be described
as a fidelity-preserving rollback. If the source or browser oracle cannot pass,
implementation stops and a follow-up ADR must retire this compatibility
realization rather than silently accepting the old adapter.

Revisit this bounded decision when the selected resolved-text realization replaces
the embedded-Inter/scalar path, when protocol text inputs change, when a supported
font class cannot be represented by the shared path boundary, or when a Vello/
wgpu upgrade changes controlled pixels. The later realization ADR must state
which parts of ADRs 0020 and 0024 it retains, supersedes, or removes.

## Non-goals

No shaping, kerning, fallback, font choice, editing, caret/range semantics, line
layout, packet redesign, engine selection, final vector-versus-atlas selection,
color/bitmap glyph support, cache policy, or claim of full text fidelity.
