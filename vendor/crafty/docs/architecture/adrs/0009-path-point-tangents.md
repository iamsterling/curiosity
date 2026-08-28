# ADR 0009: Per-Point Tangents over Per-Segment Tangents

Status: Accepted — implemented
Date: 2026-08-07

## Context

The `vector-path-data-model` change introduces editable path geometry at schema
v3. Path geometry is a flat id-keyed point map over an ordered subpath list
(`packages/editor-kernel/src/document.ts:46-71`) — a recursive instance of the
document's own identity rules (I1: array position is never identity). Within
that model the question this ADR answers is *where tangents live*:

- **Per-point** (the classic anchor model): handles are fields of the point,
  addressed as `(pointId, "in" | "out")`, stored as anchor-relative deltas, with
  authored handle intent (`corner | free | asymmetric | mirrored`) where
  `mirrored` stores only `handleOut` and derives `handleIn` as its negation
  (`document.ts:41-55`, `path-geometry.ts:94-106`).
- **Per-segment**: tangent data is a property of the segment between two
  points, so a vertex with three incident edges carries a distinct tangent per
  edge — the model Figma ships (`VectorVertex` / `VectorSegment` /
  `VectorRegion`, `handleMirroring`, from the published plugin API; whether the
  wire format keys segments by index or id is not confirmed, per
  `openspec/changes/vector-path-data-model/design.md`).

A subpath model gives every point exactly two incident segments, so one in/out
pair is complete there. A network (points and segments as independent id'd
entities, a point admitting 3+ incident segments) is strictly more expressive
but needs per-edge tangents. The research escalated this as **the one flip-able
decision** of the change (`design.md`, Decision 7), and it is recorded here
because the cost of reversing it grows with every consumer: commands today,
tessellation tomorrow.

## Constraints

- Every command must have an exact inverse computed against `beforeDocument`
  on every preview (`packages/editor-kernel/src/kernel.ts:187`). `reverse-subpath`
  is payload-free in the per-point model because deltas are anchor-relative and
  the order key encoding is an involution under reversal (`path-geometry.ts:77`);
  a tangent representation that cannot make reversal exact is excluded.
- I1 and `document-model.md`: array position is never identity. Index-based
  tangent addressing is excluded for the same reason point arrays were.
- The decision must remain **flip-able without an identity-model redesign**:
  the migration path must be a mechanical command rewrite, not a re-architecting
  of what a point is.
- Tangents are authored intent on the point; the renderer receives flattened
  geometry, never the identity model.

## Options Considered

- **Per-point tangents** (chosen). Handles live on the point
  (`document.ts:41-55`); `corner` stores no handles, `mirrored` stores only
  `handleOut`, `asymmetric` collinearity is a hint, not a validated invariant
  (`document.ts:249-253`). Wins: exactly complete for the subpath model;
  `reverse-subpath` is its own inverse (payload-free); moving an anchor moves
  its handles for free; command payloads stay small; handle-mode drift is
  unrepresentable (a `mirrored` point with a stored `handleIn` fails validation
  rather than silently diverging). Loses: a 3+-edge vertex cannot be expressed.
- **Per-segment tangents** (Figma's model, network-compatible). Tangent data
  travels with the segment; a vertex with *k* incident edges has *k* distinct
  tangents. Plausible because it is the model of the closest professional
  prior art and it does not need revisiting if a network lands. Loses now:
  every segment becomes an entity that needs an id, subpaths become lists of
  segment ids, command payloads grow, `reverse-subpath` stops being trivially
  self-inverse (tangents move with segments, not points), and nothing in the
  current requirements has a 3+-edge vertex to justify any of that cost.
- **Penpot's implied smoothness** (no stored intent; a 0.1° float threshold in
  `helpers.cljs` decides whether the next drag mirrors, `design.md` Decision 4).
  Drift-free but cannot express intent; rejected by the change's Decision 4, and
  orthogonal to the point-vs-segment question. Its other lesson — coordinate
  identity for point selection breaks on count changes and welds coincident
  points — is recorded in the research ledger and drove minted point ids.

## Decision

**Tangents are stored per point, addressed as `(pointId, "in" | "out")`** —
the classic anchor model — with authored `handleMode`
(`corner | free | asymmetric | mirrored`), anchor-relative deltas, and the
drift-free storage rules: `corner` stores no handles; `mirrored` stores only
`handleOut` with `handleIn` derived as its negation (`document.ts:41-55`,
`path-geometry.ts:94-106`).

This decision does **not** cover: vector networks, shape-builder, 3+-edge
vertices, or strokes with caps/joins — all remain out of scope
(`proposal.md`, "Explicitly out of scope").

**Flip trigger:** shape-builder / region painting, or 3+ edges meeting at a
point, becoming committed product requirements — the same trigger that flips
the subpath-list model to a network (`design.md`, Decision 1). If the trigger
fires, the migration path is: introduce
`PathSegment { id, startPointId, endPointId, tangentStart, tangentEnd }` and
make subpaths a list of segment ids. That is a **mechanical command rewrite**
(payloads re-keyed from points to segments; points remain the id'd entities
selection addresses, order keys unchanged), not a redesign of the identity
model.

## Consequences

Easier: self-inverse `reverse-subpath` (`path-commands.test.ts:182`); small
absolute command payloads; point-anchored selection; validation of
handle-mode consistency with no state the validator must repair
(`document.ts:249-253`).

Harder: any future network topology requires the migration above; per-segment
stroke caps/joins will need per-segment data then (they are out of scope
regardless). The migration is cheapest before renderer tessellation consumes a
packet shape — which is why the flip trigger is attached to committed
requirements rather than to time.

## Risks

- **The trigger fires late.** If shape-builder or 3+-edge vertices are committed
  after tessellation lands, the command rewrite proceeds against a stable
  identity model; the renderer consumes flattened geometry, not points or
  segments, so the packet boundary is unaffected.
- **The prior-art read is wrong at the wire level.** Figma's plugin API exposes
  `VectorSegment` but the wire format's indexing is unconfirmed; the decision
  does not rest on Figma fidelity but on Crafty's own constraint (a payload-free
  self-inverse reversal), so a corrected read would not reopen it.

## Validation

- `reverse-subpath` self-inverse property test, including handle assignments:
  `packages/editor-kernel/src/path-commands.test.ts:182`.
- `mirrored` derivation and rejection of a stored `handleIn`:
  `path-geometry.ts:99-106`, `document.test.ts:120-135`.
- Every path command's inverse is itself a validated command:
  `path-commands.test.ts:236`.

## Revisit When

Shape-builder / region painting, or 3+ edges meeting at a point, become
committed product requirements. The migration path above is then the record of
how to move, mechanically, to per-segment tangents.
