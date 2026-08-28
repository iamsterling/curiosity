## Context

See `proposal.md` — Why. This document records how, and which decisions follow
prior art vs diverge from it. The primary sources studied this session:

- **Penpot** (`develop` branch, source fetched): coordinate-identity point
  selection, whole-content path change ops, derived selrect with exact curve
  extrema, absolute page coordinates with transforms baked destructively,
  smoothness inferred from geometry rather than stored.
- **tldraw** (`main`, source fetched): `{id, IndexKey}` fractional point
  ordering, never renumbered.
- **Graphite / bezier-rs**: `VectorData` point/segment/region domains; several
  choices exist to serve the node graph and must not transfer.
- **Figma**: `VectorVertex`/`VectorSegment`/`VectorRegion`, `handleMirroring`,
  per-segment tangents (from published plugin API; index-vs-id in the wire
  format not confirmed).
- **Inkscape / SVG spec**: `sodipodi:nodetypes` sidecar, arcs uneditable by
  anchor+handle, `fillRule` as the one fill semantic that must survive.
- **Crafty, first-hand**: the inverse-recomputation rule (`kernel.ts:157`), the
  closed kind list (`document.ts:186`), `bounds` consumers, the untested
  migration chain.

Constraints that shape everything below:

- Every command must have an exact inverse, computed against `beforeDocument`
  on every preview (`kernel.ts:157`).
- `assertValid` runs the full O(n) validation on every command
  (`commands.ts:35`), so bounds drift is a thrown error, not a warning.
- `document-model.md` — "Array position is never identity", and a layout result
  is never written back as `bounds`. A path's bbox is the first thing that
  must be.
- The renderer has no path geometry (`DrawGeometry = "rect"`,
  `draw-protocol.ts:6`). Nothing in this change draws; it makes the model true.

## Goals / Non-Goals

**Goals:**

- A v3 document can carry a validated `path` node whose geometry survives
  serialization, clipboard, undo/redo and validation, with nothing rendering
  it yet.
- Every vector action that can be expressed as a command has an exact inverse,
  and point selection survives undo.
- The `bounds` bifurcation (authored for rect-like kinds, derived for path) is
  explicit, enforced, and documented.
- `"pen"`/`"node"` tools with disjoint effect vocabularies, so tool behaviour
  never leaks into pointer handlers.

**Non-Goals:**

- Renderer tessellation, strokes with caps/joins/dashes, gradients, `Paint[]`.
- Retiring the `Scene` persistence round-trip (prerequisite for saving paths;
  `layerTypeFor` already throws on unknown kinds so a path can never be
  silently destroyed in the meantime).
- Vector networks, shape-builder, boolean ops, region fills.
- Collaboration / CRDT merge semantics (the fractional order key keeps the door
  open without committing to anything).
- A full pen-tool UX: the tools and vocabulary land; marquee-point-selection
  and drag ergonomics are follow-up work against the same commands.

## Decisions

### 1. Ordered subpath list over a flat id-keyed point map — not a vector network

The document is already a flat `Record<DocumentId, DocumentNode>` with ordered
child lists; a path is that exact problem recursed. A network (points and
segments as independent id'd entities, a point admitting 3+ incident segments)
is strictly more expressive but costs: planar face finding for region fills,
lossy network→subpath conversion on every export, and multi-entity inverse
payloads for the most common operations.

*Alternatives considered.* (a) Vector network — rejected now; it is the right
end state if shape-builder or 3+-edge vertices become committed requirements,
and retrofitting is a schema break plus a rewrite of every path command. (b)
Raw SVG `d` string — rejected: no identity to hang selection or references on,
lossy for editor intent (Inkscape needs `sodipodi:nodetypes` because SVG cannot
say it), arcs uneditable, diff/undo collapses to the whole string. (c) Penpot's
command-list (`:move-to`/`:line-to`/`:curve-to`/`:close-path`) — functionally
equivalent to a subpath list but leaves point identity implicit.

**Flip conditions, recorded:** shape-builder/region painting or 3+ edges
meeting at a point. Either, as a committed product requirement, flips this to a
network and should trigger the ADR in Decision 7.

### 2. Stable minted point ids — the Penpot negative result, first-hand

Penpot tracks selected points as a **set of coordinate pairs**
(`selection.cljs`: `(conj selected-points position)`, where `position` is a
point record with value equality). Its own source shows the consequences:
selection must be rebased by zipping old and new point lists after every edit
(`edition.cljs`), which breaks when the count changes and forces
count-changing tools through a separate code path; coincident points are welded
inseparably by construction; React keys are `"x-y"` strings; handles use a
third, index-based scheme.

Crafty has already decided this question one level up — `document-model.md:36`,
"Array position is never identity", and invariant I1. A path point is a child
of a path exactly as a node is a child of a node. Ids are minted (never
content-derived), paste mints fresh ids (I22), and selection filters against
live geometry exactly as deleted-node selection already does (`kernel.ts:101`).

**Handles do not need ids** — they are addressed as `(pointId, "in" | "out")`.
Node-local id uniqueness is sufficient and keeps the document-wide duplicate
check O(n); global uniqueness is deferred until collaboration exists.

### 3. Fractional order keys, not arrays — tldraw's `IndexKey`, adapted

tldraw's `line` shape orders points with `{id, index: IndexKey}` and the vertex
handle's id is the point's stable id, not its index; insertion mints a key via
`getIndexBetween`, never renumbering (`TLLineShape.ts`,
`LineShapeUtil.getHandles`, `main`). This replaced the research team's own
initial `pointIds: PointId[]` proposal after tldraw's source was read: the
array form is the merge hazard in the model, and `reorder-node`
(`commands.ts:266`) already demonstrates the renumber-everything cost of array
order at the node level. Membership is the point's own `subpathId`, so an
insert writes one record and its inverse is exactly that record.

*Alternative considered.* `pointIds: PointId[]` — rejected; insertion at index 3
shifts every later point and its CRDT merge semantics are worse for no gain.

### 4. Authored handle intent, stored drift-free — following Figma, diverging from Penpot

`handleMode` (`corner | free | asymmetric | mirrored`) is authored intent,
following Figma's `handleMirroring` and Inkscape's `sodipodi:nodetypes`.
Penpot infers smoothness from geometry at edit time
(`helpers.cljs` — a 0.1° float threshold decides whether the next drag mirrors)
which is drift-free but cannot express intent. Our version gets both: `mirrored`
stores only `handleOut`, deriving `handleIn` as its negation, so the mode is
unrepresentable-when-broken and `assertValid` can never throw on drift it
cannot repair. `asymmetric` collinearity is **not** validated — a hint the edit
tool honours, nothing more.

**Tangents live on the point, stored as anchor-relative deltas**, so moving an
anchor moves its handles for free, and `reverse-subpath` is a self-inverse
(payload-free command) because the deltas are already relative.

### 5. Every path command absolute-valued, with the Penpot whole-content inverse for structural ops

The kernel recomputes inverses against `beforeDocument` on every preview
(`kernel.ts:157`), so a relative command is incorrect by construction in a
drag. The drag discipline already exists (`harness.ts` captures `moveStart`
bounds at gesture start and emits absolute `set-bounds` every move); path
commands follow it. Granular commands carry full point records for the touched
ids plus recomputed bounds; structural operations use
`replace-path-geometry` whose inverse is the previous geometry.

*Prior art.* Penpot emits `{:type :set :attr :content :val new-val}` carrying
the entire content blob for *every* path op — there are no granular path ops in
their change stream. Our split (granular for frequent ops, coarse for
structural) is strictly more conservative. The semantic label lives on the
history entry (`kernel.ts:168`), so undo UI still reads correctly.

### 6. `bounds` is derived-and-verified for paths; geometry is pinned to (0,0) node-local

`bounds.x/y` remain authored placement for every kind; `width/height` become
the tight bbox of the geometry for `path`, computed by the command layer,
written by the same command, verified by `assertValid` with a 1e-6 tolerance
and true bezier extrema (solving the derivative, not the control-point hull).

The geometry is pinned so its bbox min is `(0,0)` — the convention hit testing
already uses (`interaction.ts:106-109`) — keeping `documentHitTest`'s broad
phase, the spatial index, marquee and the scene adapter unchanged. Dragging a
point past the left/top edge rebases every point and shifts `bounds.x` by `-d`
in the same command: net zero on screen, O(points) per command, same class as
the O(n) validation that already runs.

*Alternatives considered.* (a) Floating geometry with derived parent-space AABB
— rejected: every bounds consumer needs a second convention, and the codebase
already has two coordinate implementations it regrets (I40). (b) Penpot's
absolute page coordinates with transforms baked destructively — rejected: it
bakes the matrix into the coordinate buffer on every drag, and a path kind that
silently ignores its own `transform` field would be a trap in a codebase where
`transform` is a uniform field on every node (`interaction.ts:107`).

### 7. The one flip-able decision is an ADR, not a comment

Per-point tangents (this change, classic anchor model) vs per-segment tangents
(the Figma model, network-compatible: a vertex with three incident edges has a
distinct tangent per edge). The ADR records the decision, the options, and the
trigger (shape-builder or 3+-edge vertices as committed requirements) that
reopens it. If the trigger fires within a year the migration is: introduce
`PathSegment { id, startPointId, endPointId, tangentStart, tangentEnd }` and
make `subpaths` a list of segment ids — a mechanical rewrite of the commands,
not a schema-redesign of the identity model.

### 8. I8 relaxes to `>= 0` for `path` only

A straight horizontal line has zero height and is the second thing anyone
draws with a pen tool; `validateNode` (`document.ts:184`) rejects
`width <= 0 || height <= 0` today. Relaxed only for `path`, with a test that a
two-point horizontal line validates. The research flagged one unchecked
consumer risk (zero-area bounds dividing downstream); the audit of every
`bounds` consumer in this change either confirms safety or names the fix.

*Alternative considered.* Enforce a minimum epsilon extent and carry a sliver
bbox — rejected as hiding the problem rather than modelling it.

### 9. Schema v3, kind sets parameterised by version

`validateDocumentStructure` (`document.ts:224`) is shared by the v1 and v2
validators, and `validateNode` hardcodes the kind list (`document.ts:186`).
Adding `"path"` widens the accepted set for v1 as well — false, since v1
predates paths. Bump to v3 and pass the accepted kind set in, exactly as
`validatePage` is already parameterised. The migration chain
(`DOCUMENT_MIGRATIONS`, one entry, never actually chained) is exercised for
real for the first time: v1→v2→v3 chaining gets a test, and old readers reject
v3 outright (I10) rather than silently dropping geometry.

### 10. Graphite's node-graph choices do not transfer

Called out explicitly so the tempting wrong conclusions are on record:
edits-as-delta-layers (they exist to survive node-graph re-evaluation; Crafty's
equivalent is `DocumentCommand` + inverse), content-derived ids (minted ids
persist; deriving from content breaks paste), region/face materialisation
(closed subpaths *are* the fill regions here), and bezier-rs's full algorithm
surface (Crafty needs bbox-with-extrema, de Casteljau split, point projection,
and flattening — a much smaller surface, evaluated when the renderer work
starts).
