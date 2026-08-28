# Vector editing: point types, pen/node tools, booleans and compounds

Status: **Proposed**

## The Problem

The kernel authors paths completely — id-keyed point maps, fractional order
keys, handle modes corner/free/asymmetric/mirrored, seven validated
invertible commands, point selection in history (`docs/architecture/current-state.md`:
"Vector paths — Modeled and rendered") — but nothing edits them. The
`pen`/`node` tools are declared with armed/preview phases and an explicit
comment that their effects "land" later (`interaction.ts:71,86-90`); there is
no point-type conversion, no auto-handle semantics, no boolean operations,
and the authored `cornerRadius` is still ignored. The vector-editing research
(`docs/research/vector-editing.md`, 2026-08-08, eight products) validated the
core and identified the deltas: a `set-point-type` command with the published
conversion matrix, the per-side auto-handle intent, the pen/node interaction
vocabulary, and a boolean engine with the non-destructive compound as the
authored form.

## The Decision

Two slices, one change.

**Slice 1 — point types and tools.** A `set-point-type` command carrying the
conversion matrix every surveyed product converges on: corner↔free↔asymmetric
↔mirrored, plus a new **`auto` handle mode** (the research's "missing
primitive" — FontForge's `cpdef`, Affinity's Smart, Inkscape's NODE_AUTO):
authored intent that stores **no handles**; resolved handles are derived
deterministically at projection (the authored/resolved line, exactly like
layout resolution) and never written back. A manual handle edit converts an
auto point to smooth in the same transaction (the demote-on-edit rule,
published by Affinity and Inkscape independently, adopted deliberately).
The pen and node tools get their effect vocabulary in the interaction
reducer — the declared seam — with screen-constant (÷zoom) hit geometry,
the published modifier grammar (Ctrl=sharp, Shift=smooth, Ctrl+Shift=
symmetric, Alt=preserve-length, 45° constraints), double-click insert/cycle,
rubber-band preview and close/join affordances as ephemeral renderer-state
overlays. Pointer-down never mutates; a drag is one transaction and one
history entry.

**Slice 2 — booleans and compounds.** Union/intersect/subtract/exclude as
kernel commands over closed, area-enclosing subpaths (the published
precondition doctrine: "if it doesn't fill it won't work" — diagnosed, never
silent), with the engine reference from the research (Inkscape's pipeline:
exact curve intersections → flatten with backdata → sweepline combine →
**re-emit original curve fragments between cuts**; quantization for the
topology phase). A **compound** node kind (the universal non-destructive
form: Figma boolean groups, Affinity compounds, Illustrator compound shapes,
Sketch combined shapes): authored members + per-member operation; the merged
outline is a resolved value, disposable, never written back. Flatten is the
destructive bake with the published warnings (holes and disjoint contours
diagnosed, not silently merged). The engine choice (own kernel-side
implementation vs a licensed sweep library) is an ADR in this change.

The Figma network generalization (explicit edge layer + region records) is
**deferred** with its published costs on record (the research's §7).

## What Changes

- **`packages/editor-kernel`** — `handleMode` gains `"auto"` (stores no
  handles; validation enforces it); `set-point-type` with the conversion
  matrix, deterministic auto derivation and collateral rules; the resolved
  auto-handle projection (the glass/layout-records pattern); boolean commands
  with precondition diagnostics; the `compound` node kind (members, op,
  order) with commands; the resolved compound outline projection.
- **`packages/editor-kernel/src/interaction.ts`** — the pen/node effect
  vocabulary (click-add, drag-handle, insert-on-segment, marquee point
  selection, type cycling, close/join, Escape).
- **`apps/crafty-web`** — harness wiring (the tool effects' document work,
  the resolved projections into the snapshot); canvas-stage overlays for
  grippies, rubber band and in-progress geometry (host-composed renderer
  state, the overlay precedent); the toolbar gains the pen and node tools.
- **Docs** — ADR 0014 (boolean engine + compound semantics + auto-mode
  adoption; rejected alternatives with the research citations),
  `current-state.md` reality updates.
- **Tests** — the conversion matrix (every mode pair, determinism, inverse);
  auto derivation fixtures; tool-reducer tests (the harness pattern: no DOM);
  boolean fixtures with known results (curve-fragment re-emission asserted);
  compound round-trips and outline projection; precondition codes.

## Files

- `packages/editor-kernel/src/document.ts` — `"auto"` mode, `Compound` record.
- `packages/editor-kernel/src/path-geometry.ts` — auto derivation,
  intersections, flatten-with-backdata, the boolean engine.
- `packages/editor-kernel/src/commands.ts` — `set-point-type`, boolean
  commands, compound commands.
- `packages/editor-kernel/src/interaction.ts` — pen/node effects.
- `packages/editor-kernel/src/{path-commands,path-boolean,vector-tools}.test.ts`
  — the test surfaces.
- `apps/crafty-web/src/editor/harness.ts` — effect wiring + projections.
- `apps/crafty-web/src/editor/canvas-stage.tsx` — editing overlays.
- `apps/crafty-web/src/components/editor/editor-toolbar.tsx` — pen/node tools.
- `docs/architecture/adrs/0014-vector-editing.md`, `current-state.md`.

## Risks

- **The boolean engine is the hard part.** Curve intersections,
  flatten-with-backdata, the sweepline combine and fragment re-emission is
  the largest single algorithm this change adds; the mitigation is the
  research's architecture (quantized topology grid, backdata re-emission),
  table-driven fixtures with known results, and the precondition gate that
  keeps degenerate inputs diagnosed rather than computed.
- **Auto-handle determinism.** The derivation must be a closed formula
  (chord-tangent direction, ⅓ lengths — the Inkscape rule) so the same
  document resolves identically every time; the spec pins the formula.
- **The tool surface is wide.** The reducer vocabulary + overlays + keyboard
  is the biggest UX surface since the editor chrome; it is staged (pen
  essentials first, then node editing, then the modifier grammar) and every
  interaction has a reducer test per the harness rule.
- **Compounds touch the schema.** A new node kind is additive but ripples
  through validation, clipboard, serialization and the renderer projection;
  the resolved outline keeps the packet kernel-neutral.

## Deliberately Out of Scope

The Figma network generalization (edge layer + region records — deferred,
trigger: branch-vertex authoring as a real need, with the published
delete-and-heal costs in the research); pencil capture/simplify and
stroke-to-path (utility commands, a later change); parametric shapes with
per-corner radius (a shape-model change, separate); snapping to guides/grid
for points (the canvas-level snap system, separate).
