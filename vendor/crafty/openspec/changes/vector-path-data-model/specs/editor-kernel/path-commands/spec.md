## Purpose

Defines the closed command vocabulary for editing path geometry. Every command
is absolute-valued with an exact inverse, runs through full document
validation, and is the only way path geometry mutates.

## ADDED Requirements

### Requirement: Path commands are absolute-valued with exact inverses

Every path command SHALL carry absolute values complete for the operation —
full point records for touched ids and the recomputed node `bounds` — never
deltas. Every path command SHALL produce an inverse that exactly restores the
prior document, and the inverse SHALL itself be a valid path command that runs
through the same validation. No path command may exist without an exact
inverse.

#### Scenario: Moving a point is undoable

- **WHEN** a point is moved by a drag that emits `set-path-points` with
  absolute records on every preview
- **THEN** undoing restores the point's original coordinates and the original
  `bounds`
- **AND** redoing re-applies the moved coordinates

#### Scenario: A relative move is rejected

- **WHEN** a command carries a point delta rather than an absolute record
- **THEN** it is not part of the accepted command vocabulary

### Requirement: Point manipulation commands

The following operations SHALL be expressed as commands with the named shape:

- `set-path-points` — move points, adjust handles, break a mirrored handle,
  convert corner↔curve: carries full records for the touched point ids and
  recomputed `bounds`. Inverse: the previous records for exactly those ids and
  the previous `bounds`.
- `insert-path-point` — add a point to a segment: carries the point's record,
  its subpath, its order key, the post-split records of the two neighbouring
  anchors (splitting a bezier changes both neighbours' tangents), and
  recomputed `bounds`. Inverse: `remove-path-point` with the pre-split
  neighbour records.
- `remove-path-point` — delete a point: carries the removed point's record,
  its position, the pre-delete neighbour records, and recomputed `bounds`.
  Inverse: `insert-path-point` with the removed record.
- `set-subpath-closed` — close or open a subpath: carries the new closure
  state, the adjusted end-anchor records, and recomputed `bounds`. Inverse: the
  same command with the previous state and records.
- `reverse-subpath` — reverse a subpath's direction: swaps point order and
  swaps each point's `handleIn`/`handleOut`. It is its own inverse and SHALL
  NOT carry `bounds` (the geometry's extent is unchanged).

Every point-count-changing operation SHALL ensure the subpath still satisfies
the minimum-length rule, and SHALL fail loudly rather than producing a
degenerate subpath.

#### Scenario: Inserting a point splits a curved segment without deforming it

- **WHEN** a point is inserted at parameter `t` into a curved segment
- **THEN** the two neighbouring anchors' tangents reflect the split at `t`
- **AND** the inverse restores the pre-split tangents exactly

#### Scenario: Reversing a subpath twice restores it

- **WHEN** `reverse-subpath` is applied twice
- **THEN** the geometry is identical to its original state, including handle
  assignments

#### Scenario: Closing a subpath is undoable

- **WHEN** an open subpath is closed
- **THEN** undoing reopens it and restores the end-anchor records

### Requirement: Structural operations use whole-geometry replacement

The operations join endpoints, split a node, cut a path, merge subpaths,
boolean results and pasted-geometry replacement SHALL be expressed as
`replace-path-geometry`, carrying the complete new geometry and recomputed
`bounds`. Its inverse SHALL be the previous complete geometry and `bounds`.

The semantic label for history UI SHALL be carried on the history entry, not
in the command.

#### Scenario: Joining two endpoints is one undo step

- **WHEN** two endpoints of a path are joined
- **THEN** one history entry exists for the join
- **AND** undoing restores the exact previous geometry, including subpath and
  point ids

### Requirement: Fill rule is authored

The fill rule (`nonzero` or `evenodd`) SHALL be authored on the path node and
changed only via `set-path-fill-rule`, whose inverse is the previous value.
Changing the fill rule SHALL NOT change geometry or `bounds`.

#### Scenario: Fill rule round-trips

- **WHEN** a path's fill rule is changed from `nonzero` to `evenodd`
- **THEN** undoing restores `nonzero`
- **AND** the geometry is unchanged

### Requirement: Tool effect vocabulary stays closed

The `"pen"` and `"node"` tools SHALL be added to the tool union, each with a
disjoint effect vocabulary. A pen tool SHALL NOT emit effects outside its
vocabulary — in particular it SHALL NOT emit rectangle-creation effects.

#### Scenario: A pen drag produces only pen effects

- **WHEN** a drag begins with the `"pen"` tool active
- **THEN** every effect the interaction reducer emits is in the pen tool's
  declared vocabulary
