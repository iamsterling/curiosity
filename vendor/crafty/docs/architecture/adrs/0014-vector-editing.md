# ADR 0014: Vector editing — point types, pen/node tools, booleans and compounds

Status: Accepted — implemented
Date: 2026-08-08
Implementation status: The `set-point-type` conversion matrix, the `auto` handle
mode, the pen/node tool effects, the boolean engine, the compound kind and the
host-composed path render channel are implemented and verified headless —
241 editor-kernel tests (incl. 16 point-type, 34 boolean, 21 compound), 82
crafty-web tests (harness-level, no DOM), 51 scene-renderer-wasm vitest + 36
cargo. On-screen pixels — the editing overlays and path geometry on hardware —
are pending the renderer's standing gap 8 (the real-browser spike); nothing in
this record claims otherwise.

## Context

The kernel authored paths completely — schema v3's `path` kind, id-keyed point
maps over ordered subpaths, fractional order keys, the corner/free/asymmetric/
mirrored handle modes, seven validated invertible commands — but nothing
edited them. The `pen`/`node` tools were declared with armed/preview phases
and an explicit comment that their effects "land" later (`interaction.ts`).
There was no point-type conversion, no auto-handle semantics, no boolean
operation, and the authored `cornerRadius` was ignored. Worse, the legacy
Scene projection threw `SCENE_ADAPTER_UNSUPPORTED_KIND:path`, so a document
containing a path could not project, render or save at all — the declared
pen/node seam plus a hard render wall.

The eight-product survey (`docs/research/vector-editing.md`, 2026-08-08;
ledger row in `docs/architecture/research-ledger.md`) validated the kernel's
model — the industry point-type vocabulary converges on corner/smooth/
symmetric, which Crafty's four modes already cover — and identified the
deltas: the per-side **auto-handle intent** (FontForge's `cpdef`, Affinity's
Smart, Inkscape's NODE_AUTO — the "missing primitive"), the boolean pipeline
(Inkscape's reference: exact intersections → flatten with backdata →
combine → re-emit original curve fragments, with a quantized topology grid),
the **compound** as the universal non-destructive authored form, and the
constraint-at-the-mutation-boundary rule (already the kernel's shape).

## Decision

1. **`set-point-type` with the conversion matrix, and `auto` as authored
   intent.** Every surveyed product converges on the same per-pair semantics;
   the kernel ships the full matrix (`commands.ts` `set-point-type`,
   `path-geometry.ts` `convertPointType`), with two deliberate interpretations
   recorded: Crafty's **corner IS the no-handle state**, so corner conversion
   is invertible at the command level but never lossless (a documented
   deviation from FontForge's corner-keeps-handles "lossless corner"); and
   `auto` stores **no handles** (validated: `VECTOR_POINT_AUTO_HANDLES`).
   The `auto` derivation is a closed chord-tangent formula — each handle on
   the chord to its neighbour(s), length ⅓ of the segment, zero when no
   neighbour exists — resolved deterministically at projection
   (`resolveAutoHandles`, the glass/layout-records pattern: a disposable
   resolved value, never written back). The **demote-on-edit** rule (adopted
   deliberately, published by Affinity and Inkscape independently): dragging
   an auto point's handle materializes the derived handles as authored
   `asymmetric` in the same transaction — one history entry, inverse restores
   the auto record.
2. **The pen/node tool effects in the interaction reducer.** The declared
   seam gains a closed effect vocabulary (`pen-begin/add-point/preview/close/
   join/end`; `node-select-points/marquee/move-points/move-handle/insert-point/
   cycle-type`) in `TOOL_EFFECT_VOCABULARIES` — pointer-down never mutates, a
   drag is `beginTransaction → preview → commit/rollback`, one history entry.
   Hit geometry is screen-constant tolerance ÷zoom (`hitTestPathPoint/Handle/
   Segment/Endpoint` over the RESOLVED geometry). The modifier grammar lives
   in `constrainHandleDrag` at the mutation boundary, never in DOM handlers:
   base mode is the constraint, shift = link/symmetric, alt = preserve-length,
   ctrl = 45° snap. The editing overlays (grippies, rubber band, close
   indicator, in-progress pen segment) are host-composed renderer state.
3. **The boolean engine: own kernel-side implementation of the
   Inkscape-style pipeline.** Cubic-cubic intersections (recursive de
   Casteljau clipping with a work budget), flatten-with-backdata, a
   **split-then-classify** combine (every segment split at every pairwise
   intersection; each fragment classified by the selected region's status on
   both sides, samples quantized to a 1/512-of-extent topology grid — the
   published robustness constant; surviving boundaries traced with the region
   on the left; per-operand fill rule via `windingNumberAt`), and **fragment
   re-emission**: maximal runs of surviving fragments from one original
   segment merge back into ONE cubic between the extreme cut parameters —
   results keep bezier pieces, never pure polylines. A full Bentley–Ottmann
   sweepline is recorded as the **measured** optimisation for large inputs,
   not v1. Preconditions gate entry ("if it doesn't fill it won't work"):
   `VECTOR_BOOLEAN_MIN_OPERANDS`, `VECTOR_BOOLEAN_OPEN_SUBPATH`,
   `VECTOR_BOOLEAN_NO_AREA`, plus `VECTOR_BOOLEAN_PARENTS_DIFFER` for
   mixed-parent operands. Two honest notes on record: the **T-junction defect
   found post-landing** — the near-linear closed-form solver returned CHORD
   fractions while the split evaluated the CUBIC parameter (for a degenerate
   linear segment the parametrization is 3t² − 2t³, so only fractions in
   {0, ½, 1} coincide), so non-midpoint crossings resolved empty; fixed with
   `cubicTAtFraction` (interval-relative Newton inversion of the parameter,
   exact at the fixed points, so the existing midpoint fixtures round-trip
   byte-identically) — and the **engine envelope**: features within one
   topology-grid cell of a parallel edge are unstable by design, the
   quantized-grid robustness tradeoff, recorded rather than hidden.
4. **The `compound` node kind.** Authored members (`childIds`, ordered —
   subtract/exclude read the order) plus the operation; the record carries
   only the operation (`compound?: { operation }`), joined `NODE_KINDS_V3`
   additively (no schema bump, no migration; a v2 reader rejects compound
   documents at its own kind set, exactly like `path`). The **merged outline
   is a disposable resolved projection** (`resolveCompoundOutline`,
   `compound.ts`) — computed over the members' RESOLVED geometry in member
   order, re-resolved on every call so member edits land for free, never
   written back; the projection-facing forms never throw (unresolvable →
   `undefined`), the commands resolve strictly so codes surface loudly.
   Flatten is the destructive bake (`flatten-compound`, inverse restores the
   full removed subtree byte-exactly). `VECTOR_FLATTEN_UNREPRESENTABLE` is
   interpreted for Crafty's model: multi-subpath results ARE representable
   (holes and disjoint contours are ordinary subpaths), so the Sketch-derived
   warning fires only when the outline cannot be produced at all — engine
   precondition codes surface as-is, and a produced-but-EMPTY aggregate
   (disjoint intersect, full-cover subtract, identical exclude) is the
   unrepresentable case.
5. **The path render channel: host-composed path commands riding the
   packet.** The legacy Scene has no path geometry, so path and compound
   layers project as opacity-0 rectangles (the glass-records pattern —
   `scene-adapter.ts`; the legacy Scene is **not extended**), and the real
   geometry rides the packet: `SceneRenderer.render` options gain
   `pathCommands`/`overlayCommands`, `webgpu-renderer.ts` `withPathCommands`
   appends resolved path commands (resolved geometry + composed world
   transform) to the frame's authored command list — the module re-sorts by
   `(zIndex, order)`, so the merge is order-safe — and `withOverlays` folds
   the editing overlays above the preview. The protocol version stays 4:
   both channels reuse the existing `DrawCommand` shape. This also fixed the
   pre-existing `SCENE_ADAPTER_UNSUPPORTED_KIND:path` crash — no document
   with a path could previously project at all.

## Consequences

- The kernel gained the editing surface the model promised: point types
  (`set-point-type`, `vector-point-types.test.ts` 16 tests), the auto-mode
  projection, the pen/node effect vocabulary, booleans (`path-boolean.test.ts`
  34 tests, incl. the T-junction widening matrix), and compounds
  (`path-compound.test.ts` 21 tests, incl. the harness-level flow).
- The renderer now draws authored paths in production for the first time; the
  encoding itself was already proven headless (protocol v3, ADR 0010's
  encoder), the composition channel is the new part.
- The persistence stop-gap changed character: previously a document with a
  path failed the save loudly; now it saves and silently degrades path and
  compound geometry to invisible rectangles on reload, until the Scene
  persistence round-trip is retired (`current-state.md` finding 5). The
  loud-failure discipline moved into the projection's remaining
  `SCENE_ADAPTER_UNSUPPORTED_KIND` cases.
- Honest caveats: the boolean engine's parallel-edge envelope (above); the
  editing-overlay channel is rect commands, so the pen's close indicator is a
  **square ring**, not a circle (the 4-rect outline pattern); compound
  members are restricted to shape kinds (rectangle/frame/path — no nested
  compounds, no groups/text/images, because the outline projection consumes
  member geometry directly); compound members and their subtrees project with
  opacity 0 (the layers stay for hierarchy, selection and the spatial index —
  the outline is the only visual); a rectangle/frame member's authored
  `cornerRadius` is not yet carried into the outline (v1 limitation).
- The overlay channel precedent now covers editing overlays: bounded,
  screen-constant, composed per frame, never authored geometry.

## Alternatives considered

- **Index/positional identity for points** — rejected: array position is never
  identity; the kernel already ships id-keyed point maps and fractional order
  keys (the research's tldraw `IndexKey` line). Nothing in the tool work
  needed to disturb that.
- **XML-diff undo** — rejected: the research (Krita/FontForge) and the
  kernel's existing contract both favor exact per-command inverses; every new
  command carries one (the collateral-snapshot pattern from Krita's type
  command), so undo/redo restore records byte-exactly.
- **Geometry-only inference as the stored model** — rejected: `auto` is
  authored intent, not inference; it stores no handles and derives
  deterministically at projection, exactly like layout resolution.
- **QPainterPath / paper.js boolean wraps** — rejected: polygon-only results
  (no curve-fragment re-emission) and a foreign geometry model in the core.
- **Licensed sweep libraries (Martinez–Rueda–Feit class)** — rejected: a
  dependency in the core plus polygon-only output; the kernel already ships
  the flattening and containment primitives, and the pipeline is
  table-testable. Flip trigger on record: a measured boolean cost the TS pass
  cannot meet on the target fixture, or a polygon-sweep library whose license
  survives review.
- **WASM/Rust placement of the engine** — rejected: the module's crossing is
  one-way (ADR 0003/0010), and the boolean results are needed kernel-side —
  hit testing, selection, the scene projection — the same boundary argument
  as the layout engine.
- **The Figma vector network** (explicit edge layer + region records) —
  deferred, not rejected: its published costs are on record (delete-and-heal
  complexity, Figma's own "significantly more complicated and less robust"
  warning, the research §7); trigger: branch-vertex authoring as a real need.
- **Bentley–Ottmann sweepline as v1** — deferred: the measured optimisation
  for large operand sets; split-then-classify ships with the same topology
  grid the sweep would use.

## Prior art

`docs/research/vector-editing.md` (2026-08-08, eight products) and the
research-ledger row added the same day: the conversion matrix, the auto-handle
intent, the mutation-boundary constraint rule, the boolean pipeline, the
precondition doctrine and the compound form are **adopted as concepts,
implemented independently** — no source was ported; the T-junction fix and the
engine-envelope boundary are Crafty's own findings, on record above.
