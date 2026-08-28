# Vector editing

## Purpose

Defines the vector-editing substrate: the point-type conversion command and
the `auto` handle mode (authored intent, resolved handles), the pen/node tool
effect vocabulary, and the boolean/compound layer (kernel commands with
precondition diagnostics; the compound node kind whose merged outline is a
disposable resolved value). This is the contract between the kernel (authored
geometry + commands + resolution projections), the interaction reducer (the
tool effects), and the app (the editing overlays and keyboard surface).

## ADDED Requirements

### Requirement: Point types convert through a validated, invertible command

A `set-point-type` command SHALL convert a point between the modes
`corner`, `free`, `asymmetric`, `mirrored` and `auto`. The conversion SHALL
be deterministic and invertible, and SHALL carry the documented per-pair
semantics: `corner`→`asymmetric` derives both handles (direction averaged,
lengths recomputed from the adjacent segments); `asymmetric`/`mirrored`→
`corner` keeps the stored handles (lossless); `mirrored`→`asymmetric` keeps
both handles; `asymmetric`→`mirrored` equalizes the lengths and
collinearizes; `auto` stores no handles (see the auto requirement). A point
with no neighbour (single-point subpath) SHALL refuse non-corner modes with
`VECTOR_POINT_MODE_UNSUPPORTED`.

#### Scenario: Converting corner to asymmetric derives handles

- **WHEN** a corner point between two curved segments converts to
  `asymmetric`
- **THEN** the point gains two handles: each collinear with the chord of
  its adjacent segment, length one third of that segment
- **AND** undo restores the corner point exactly (no handles)

#### Scenario: Converting to corner is lossless

- **WHEN** an `asymmetric` point converts to `corner`
- **THEN** the point's stored handles remain authored
- **AND** converting back to `asymmetric` restores the same handle values

### Requirement: An auto point is authored intent, never resolved values

An `auto` point SHALL store no handles (validation SHALL reject stored
handles with `VECTOR_POINT_AUTO_HANDLES`). Its handles SHALL be derived
deterministically at projection time: each handle lies on the chord through
the point's neighbours (with a single neighbour, on that chord), direction
outward from the point, length one third of the adjacent segment; a point
with no neighbours derives zero-length handles. A manual handle edit on an
auto point SHALL convert the point to `asymmetric` in the same transaction,
with the edited handle as authored — the demote-on-edit rule.

#### Scenario: Auto handles resolve deterministically

- **WHEN** a document with an auto point is resolved twice, after a
  neighbour moves
- **THEN** both resolutions produce identical derived handles
- **AND** the auto point's authored record is unchanged (no handles stored)

#### Scenario: Editing an auto handle demotes the point

- **WHEN** the tool drags one handle of an auto point
- **THEN** the transaction converts the point to `asymmetric` with the
  dragged handle authored and the other handle derived once from the
  pre-edit state
- **AND** undo restores the auto point exactly

### Requirement: The pen tool draws through the reducer

The pen tool SHALL add points to the active path on click, pull the outgoing
handle on drag, preview the pending segment as ephemeral renderer state,
close the path when the pointer targets the first point, join an open
endpoint when the pointer targets another path's endpoint, and end the path
on Escape. Every mutation SHALL be one transaction and one history entry;
pointer-down SHALL NOT mutate. Hit targets SHALL use screen-constant
tolerances (divided by zoom at the point of use).

#### Scenario: Click-drag places a point with a handle

- **WHEN** the pen tool clicks and drags on the canvas
- **THEN** a point is added with an outgoing handle matching the drag
  direction and length
- **AND** the gesture is a single history entry

#### Scenario: The close affordance is signalled

- **WHEN** the pen tool hovers the first point of an open path
- **THEN** an ephemeral close indicator is shown
- **AND** clicking closes the path with one history entry

### Requirement: The node tool edits points through the reducer

The node tool SHALL select points (click, shift-toggle, marquee),
drag points and handles, insert a point on a segment on double-click,
cycle a point's type on control-click, and delete selected points with
Backspace. Handle drags SHALL honour the modifier grammar: shift = link
both handles (mirror for collinear modes), alt = preserve the dragged
handle's length, control = constrain to 45° multiples. A drag SHALL be one
transaction; release SHALL commit, cancel SHALL roll back leaving no
change.

#### Scenario: A handle drag with shift mirrors

- **WHEN** the node tool drags one handle of an `asymmetric` point with
  shift held
- **THEN** the other handle rotates to the collinear position keeping its
  length
- **AND** releasing commits one history entry

#### Scenario: Double-click inserts at the hovered position

- **WHEN** the node tool double-clicks a segment
- **THEN** a point is inserted at the segment position under the pointer
  via the exact split
- **AND** the inserted point is selected

### Requirement: Boolean commands are preconditioned and diagnosed

`union`, `intersect`, `subtract` and `exclude` SHALL operate on closed
subpaths of selected path nodes and SHALL require: at least two operands
(`VECTOR_BOOLEAN_MIN_OPERANDS`), closed subpaths (`VECTOR_BOOLEAN_OPEN_SUBPATH`),
and area-enclosing geometry (`VECTOR_BOOLEAN_NO_AREA`). A failed precondition
SHALL be reported with its code and SHALL leave the document unchanged. The
result SHALL re-emit the original curve fragments between intersections
(never a pure polyline), and SHALL respect each operand's fill rule.

#### Scenario: An open subpath is refused loudly

- **WHEN** union is applied to a selection containing an open subpath
- **THEN** the command fails with `VECTOR_BOOLEAN_OPEN_SUBPATH`
- **AND** no part of the document changes

#### Scenario: The result keeps curve fragments

- **WHEN** two curved closed subpaths intersect
- **THEN** the result's segments are the original cubic fragments between
  the intersection points
- **AND** the fragment boundaries carry no new control points beyond the
  split points

### Requirement: Compounds are authored; the merged outline is resolved

A `compound` node SHALL be a first-class node kind carrying an ordered
member list and one operation (`union` | `intersect` | `subtract` |
`exclude`), validated to reference existing shape-producing nodes with no
cycles. The compound's merged outline SHALL be a resolved projection
(disposable, never written into the document) used by the scene projection
and hit testing. Members SHALL remain individually editable; changing a
member or the operation SHALL re-resolve. A `flatten` command SHALL convert
the compound into a path node — the destructive bake — and SHALL diagnose
outcomes the path model cannot represent (holes requiring two subpaths,
disjoint contours) with `VECTOR_FLATTEN_UNREPRESENTABLE`, never silently
merge them.

#### Scenario: The outline re-resolves on member edit

- **WHEN** a member of a union compound moves
- **THEN** the compound's resolved outline changes accordingly
- **AND** the authored member records are the only state that changed

#### Scenario: Flatten warns on unrepresentable results

- **WHEN** a subtract compound's result needs a hole
- **THEN** flatten reports `VECTOR_FLATTEN_UNREPRESENTABLE`
- **AND** the compound remains authored until the user accepts the
  two-subpath representation
