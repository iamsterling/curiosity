## Context

See `proposal.md` and `specs/universal-point-editing/spec.md`. The current
repository already has the intended point model for `path` nodes:
`PathGeometry` is an id-keyed point map over ordered subpaths, handles are
anchor-relative deltas, and `commands.ts` provides invertible point operations.
The kernel also already carries ephemeral `selectedPointIds`, point hit targets,
point grippies, and pen point effects. Rect-like nodes still use `bounds` as
their authored geometry and the renderer's current draw protocol is primarily
rect-based.

The design must preserve the authored/resolved boundary, keep point editing out
of React state, and avoid making point ids depend on array position or rendered
GPU resources.

## Goals / Non-Goals

**Goals:**

- Make one canonical geometry representation usable by all placeable nodes.
- Preserve stable node identity and introduce stable point identity for migrated
  and newly created objects.
- Reuse the existing path math, commands, transactions, point selection, and
  overlay machinery wherever possible.
- Make object mode versus point-edit mode explicit in ephemeral kernel state.
- Render the same resolved geometry used for point hit testing.
- Migrate old documents deterministically with no visual placement drift.

**Non-Goals:**

- A vector network or shared vertices between unrelated segments.
- Text glyph outline editing or image pixel warping. Text and images receive
  editable placement boundaries, while their content remains a property.
- Boolean editing UX, shape builder, clipping, gradients, or a new paint model.
- Collaboration merge semantics for point operations.
- Performance budgets before a representative geometry fixture is measured.

## Decisions

### 1. Generalize the existing path geometry instead of adding a second point model

`DocumentNode` will gain canonical point geometry for all placeable nodes. The
existing `PathGeometry` shape remains the wire-level geometry: points have stable
ids and order keys, subpaths own membership and closure, and handle modes carry
authored tangent intent. The property may be renamed or widened as part of the
schema migration, but there will be one validation and command surface rather
than `RectPoints`, `EllipsePoints`, and `PathPoints` variants.

**Why:** the current path implementation already solves identity, ordering,
mirrored-handle invariants, tight bezier bounds, clipboard remapping, and exact
undo. A parallel shape-specific model would recreate the bugs this change is
intended to remove.

**Alternative rejected:** store `points: Point[]` directly on each node. Array
position is not identity in Crafty's document model, and insertion/deletion
would destabilize selection and future collaboration.

### 2. Use deterministic canonical templates for primitive creation

Primitive creation writes canonical geometry in node-local coordinates:

- rectangle and frame: four corner anchors, one closed linear subpath, all
  `corner` points;
- line: two anchors, one open subpath, both `corner` points;
- ellipse: four cardinal anchors in a closed subpath with deterministic cubic
  handles using the standard kappa approximation, with smooth/mirrored intent;
- text and image: four corner anchors for the placement boundary, while text
  content and image source remain separate node properties.

The geometry is pinned to a local bounding-box origin. `bounds.x/y` remain the
parent-local placement, while width/height are derived from geometry as they are
for current paths. Primitive templates are pure and deterministic so imports,
undo, fixtures, and agents produce the same document.

**Alternative rejected:** keep primitive bounds authored and synthesize points
only while editing. That would make serialized documents depend on object kind,
make point identity disappear between sessions, and violate the canonical
document invariant.

### 3. Add an explicit ephemeral point-edit target

The kernel will carry a `pointEditNodeId` (or equivalent discriminated editing
state) separately from `selectedIds`, `selectedPointIds`, and
`isolationRootId`. Object selection remains the target for transforms and
properties. Enter and double-click enter point edit for the selected node;
Escape exits point edit before it exits any outer isolation scope.

This state is never serialized. Selection and history continue to record point
selection before/after, but edit mode itself is transient. Point hit testing is
enabled only for the active edit target and its canonical geometry.

**Alternative rejected:** overload `isolationRootId` to mean point editing. An
isolation scope changes hierarchy selection; point editing changes the editable
geometry domain. Combining them would make Escape, nested containers, and
component boundaries ambiguous.

### 4. Keep point manipulation absolute and transaction-based

Existing absolute point commands remain the mutation boundary. Anchor and handle
drags use `beginTransaction`/preview/commit, with point selection captured at
gesture start. Bounds are recomputed from true curve extrema before validation.
Primitive point edits use the same commands as pen-created paths; no UI path
branches write documents directly.

Insertion splits a segment using the existing de Casteljau math. Deletion,
reordering, closure, and point-mode changes preserve exact inverse payloads.

**Prior art:** this follows tldraw's stable ordered point identity and Figma's
authored handle-mirroring intent, while retaining Crafty's absolute command
inverse discipline. It diverges from Penpot's coordinate-pair selection because
coincident points and count-changing edits require stable ids.

### 5. Resolve canonical geometry before the renderer boundary

The editor projection will resolve each node's canonical geometry into a
renderer-neutral geometry command. Rectangles may retain a measured fast path
only as an optimization when their canonical geometry is still an axis-aligned
four-corner shape; the document remains point-canonical. Paths and primitive
geometry will use the same versioned geometry representation at the packet
boundary. The packet carries geometry, paint, transforms, and ordering only.

Point markers, tangent handles, selection outlines, and edit breadcrumbs remain
overlay state composed after authored geometry.

**Alternative rejected:** teach Rust about node kinds and point-edit semantics.
That would violate the renderer boundary and make the GPU responsible for
product concepts such as edit mode and point selection.

### 6. Migrate in a versioned, deterministic step

The schema version will advance non-additively because legacy nodes do not carry
canonical point identity. The migration creates ids deterministically from the
stable node id plus a fixed role (`corner-0`, `corner-1`, etc.) within the
node-local scope, validates collisions, and preserves all existing node ids,
parent links, bounds placement, transforms, content, and appearance.

The loader will accept the previous version only through the explicit migration;
unknown versions remain rejected. Clipboard import/export will mint fresh point
ids just as it already does for path geometry.

**Alternative rejected:** derive point ids from coordinates. Moving a point would
change identity, breaking selection, undo presentation, and references.

## Risks / Trade-offs

- [Risk] Schema migration touches every fixture, importer, clipboard path, and
  renderer packet. -> Mitigation: land pure geometry templates and migration
  tests first; require byte-stable round trips and visual placement assertions
  before changing creation tools.
- [Risk] Converting ellipses to cubic paths introduces approximation error. ->
  Mitigation: use one documented deterministic kappa template, keep the
  primitive kind/property for inspector intent, and add tolerance-based bounds
  and pixel-parity fixtures.
- [Risk] Point editing text/image boundaries can be mistaken for editing their
  content. -> Mitigation: show boundary anchors only, keep content editing a
  separate future mode, and make the active edit target explicit in overlays.
- [Risk] Full geometry packets may increase encode size. -> Mitigation: measure
  representative mixed-node fixtures before choosing a retained or delta
  optimization; keep the rect fast path as a measured optimization, never as a
  second authored model.
- [Risk] Nested isolation and point editing can produce confusing Escape and
  double-click behavior. -> Mitigation: define the precedence in reducer tests:
  exit point edit, then exit isolation, then cancel/return to selection.

## Migration Plan

1. Add pure canonical geometry types, primitive templates, validation, and
   legacy migration with no UI behavior change.
2. Add command, clipboard, serialization, and undo/redo coverage for universal
   geometry.
3. Change creation tools and scene resolution to author and render canonical
   geometry while retaining the measured rectangle fast path.
4. Add explicit point-edit state, reducer transitions, hit testing, and overlays.
5. Enable object-by-object point editing behind the migrated schema and verify
   real-browser rendering and interaction fixtures.
6. If rollout must be reverted, reject newly migrated writes at the deployment
   boundary and retain the previous reader only for pre-migration documents;
   never silently coerce a newer document back to bounds-only geometry.

## Open Questions

- The exact packet encoding for mixed cubic and linear geometry can be finalized
  after the first measured mixed-scene fixture; this does not change the authored
  point model or user-facing behavior.
