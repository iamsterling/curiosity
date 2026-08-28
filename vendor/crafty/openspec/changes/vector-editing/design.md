# Vector editing — design

## Prior art

`docs/research/vector-editing.md` (2026-08-08, eight products) validated the
kernel's model and supplies the semantics this change adopts. **Adopted:**
the conversion matrix (FontForge `SPChangePointType` — corner→curve
averages directions then recomputes lengths, curve→corner lossless, tangent
destructive), the auto-handle intent with demote-on-edit (FontForge's
`cpdef`, Affinity Smart, Inkscape NODE_AUTO — independently discovered,
adopted deliberately), the modifier grammar (Boxy's Ctrl/Shift/Ctrl+Shift
with live re-evaluation; Inkscape's Alt=preserve-length, Ctrl=angle-snap),
the screen-constant ÷zoom hit geometry, the boolean pipeline (Inkscape's
Livarot reference: exact intersections → flatten-with-backdata →
sweepline combine → re-emit original curve fragments; quantized 1/512
topology grid), the precondition doctrine ("if it doesn't fill it won't
work" — Affinity/Illustrator published), and the non-destructive compound
(Figma/Affinity/Illustrator/Sketch). **Rejected:** index/positional
identity, XML-diff undo, geometry-only inference as the stored model,
QPainterPath/paper.js boolean wraps, soft constraints.

## The conversion matrix

`set-point-type(nodeId, pointId, mode)` — deterministic per-pair semantics:

| From → To | Handles after conversion |
|---|---|
| corner → asymmetric | derived: each handle collinear with the chord of its adjacent segment, length ⅓ of that segment |
| corner → free | derived as asymmetric, then lengths decoupled |
| corner → mirrored | derived outgoing; the incoming derives as its negation (equal by construction) |
| corner → auto | none stored (auto derivation owns them) |
| asymmetric/mirrored/free → corner | handles discarded — Crafty's corner IS the no-handle state (Sketch's "straight"); the conversion is **invertible at the command level, never lossless** (the research's FontForge "lossless corner" assumed corner-keeps-handles, which this kernel deliberately does not) |
| asymmetric → mirrored | keeps the outgoing; the incoming derives as its negation |
| mirrored → asymmetric | keeps the outgoing; the incoming materializes as the negation (the mirrored invariant) so the curve survives |
| free ↔ asymmetric | no data change (the constraint applies at edit time, never at conversion) |
| any → auto | handles discarded (validation: auto stores none) |
| auto → any | the demote rule: the derived handles materialize once, then the target rule applies |

Every conversion is a single command with an exact inverse (the inverse
carries the pre-conversion point record — the collateral-snapshot pattern
from Krita's type command).

## Auto derivation

A pure function `deriveAutoHandles(geometry)` in the resolution layer
(never a stored value): for each auto point, each handle lies on the chord
`neighbour − point` (both neighbours when present, the single neighbour at
subpath ends), direction outward, length `⅓ × |segment|`. Zero-length
handles when no neighbour exists. Determinism is pinned by the formula
itself; the resolved geometry is a projection consumed by the renderer
packet, hit testing and the editing overlays — the glass/layout-records
pattern. The demote-on-edit rule lives in the tool's transaction: the
transaction is `set-point-type(auto→asymmetric)` + `set-path-points` with
the dragged handle, one history entry, inverse restores the auto point.

## The tool effects (reducer vocabulary)

The `interaction.ts` seam (`pen`/`node` armed phases) gains a closed effect
vocabulary — the tools' effects are the only mutations they may emit:

- `pen`: `pen-add-point` (click / click-drag with outgoing handle),
  `pen-update-preview` (ephemeral pending segment — overlay state, never a
  document write), `pen-close`, `pen-join` (targets another path's open
  endpoint), `pen-end`.
- `node`: `node-select-points` (click/shift/marquee), `node-move-points`
  (one transaction per drag, shift = axis lock), `node-move-handle` (with
  the modifier grammar applied in the reducer, not the DOM handler),
  `node-insert-point` (double-click, exact split), `node-cycle-type`
  (control-click), `node-delete-points` (Backspace).

Every effect lands in the harness's `applyEffect`, which dispatches exactly
the kernel commands; pointer-down never mutates; a drag is
`beginTransaction → preview → commit/rollback` — the existing gesture
contract. Keyboard shortcuts ride the existing `keyboard-bindings.tsx`
gate, guarded by the text-entry check. The editing overlays (grippies at
screen-constant radii, the rubber band, the close indicator) are
host-composed renderer state — the overlay packet precedent — never authored
geometry.

## The boolean engine

Kernel-side, TypeScript, following the Inkscape reference:

1. **Intersections**: cubic-cubic intersections (recursive bezier clipping
   with an epsilon), deduplicated and sorted per segment.
2. **Flatten with backdata**: polyline flattening where every edge carries
   `{subpathId, segmentIndex, tStart, tEnd}` — the existing
   `flattenCubicChain` extended with provenance.
3. **Combine**: a sweepline pass (Bentley–Ottmann) over the flattened
   edges, winding numbers computed per region against each operand's fill
   rule, edge selection by the operation (union/intersect/subtract/exclude).
   Coordinates are quantized to a fixed grid for the topology phase
   (the published robustness strategy — 1/512 in Inkscape; the kernel
   derives the grid from the document's precision needs).
4. **Re-emission**: the surviving edges' backdata re-emits the original
   curve fragments between the cut parameters — results keep bezier
   pieces, never pure polylines.

Preconditions gate entry (closed, ≥2 operands, area-enclosing — the
`pointInSubpath` containment test the kernel already ships); failures are
diagnostic codes, never silent no-ops or geometry repair.

## The compound

An additive node kind:

```ts
type CompoundOperation = "union" | "intersect" | "subtract" | "exclude";

interface Compound {
  operation: CompoundOperation;
  memberIds: DocumentId[];   // ordered; subtract/exclude semantics read the order
}
```

`kind: "compound"` on a node with `childIds` = members (validated:
shape-producing kinds, ≥2, no cycles — the existing hierarchy validation).
The **resolved outline** is a kernel-side projection (the glass/layout
pattern): `resolveCompoundOutline(document, nodeId)` computes the boolean
result of the members' geometry in member order, disposable, consumed by
the scene projection and hit testing; members stay individually editable
and the outline re-resolves. Commands: `create-compound`, `set-compound-op`,
`reorder-compound-member`, `flatten-compound` (destructive bake → a path
node; `VECTOR_FLATTEN_UNREPRESENTABLE` when the result needs holes or
disjoint contours — Sketch's published warning, adopted as a diagnostic).

## The engine decision (ADR 0014)

**Own kernel-side implementation of the Inkscape-style pipeline.** The
alternatives are on the research record: licensed sweep libraries
(Martinez–Rueda–Feit class) buy robustness at the cost of a dependency in
the core and polygon-only results (no curve-fragment re-emission);
WASM/Rust placement fails the same boundary test as the layout engine —
the boolean results are needed kernel-side (hit testing, selection, the
scene projection), and the module's crossing is one-way. The kernel
already ships the flattening and containment primitives; the pipeline is
bounded and table-testable. Flip triggers: a measured boolean cost the TS
pass cannot meet on the target fixture, or a polygon-sweep library whose
license survives review — both recorded in the ADR.

## Tests

- **Conversion matrix**: every mode pair — determinism, exact inverse,
  lossless corner transitions, the auto demote transaction.
- **Auto derivation**: fixtures pinning the formula (both/single/no
  neighbours), determinism across resolutions, validation of stored
  handles on auto points.
- **Tool effects** (harness, no DOM): click-add, drag-handle with the
  modifier grammar, insert-on-segment, type cycling, close/join,
  Backspace delete — one transaction per gesture, cancel leaves nothing.
- **Booleans**: fixtures with known results for all four ops, the
  precondition codes, curve-fragment re-emission asserted (segment counts
  and cut parameters), quantized-topology robustness cases.
- **Compounds**: round-trip, validation codes, outline projection
  re-resolution on member edit, flatten with the unrepresentable
  diagnostic.
