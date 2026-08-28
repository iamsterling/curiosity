## Purpose

Defines the v3 document schema for editable vector paths: what a `path` node
is, how point identity, ordering and handle intent are represented, and the
rule that makes `bounds` derived-and-verified for path nodes. This capability
only makes the model true and validated — nothing here draws.

## ADDED Requirements

### Requirement: A `path` node kind with geometry

The document SHALL support a node kind `"path"`. A path node SHALL carry
`path` geometry exactly when its kind is `"path"`, and SHALL NOT otherwise. A
path node SHALL be a leaf: it has no children.

The accepted node-kind set SHALL be parameterised by schema version. A
document validated as schema version 1 SHALL NOT accept `"path"` nodes, and a
document of schema version 2 SHALL NOT accept them either. Schema version 3
SHALL accept them.

#### Scenario: Creating a path node

- **WHEN** a `"path"` node with valid geometry is created in a v3 document
- **THEN** the document validates
- **AND** the node's kind is `"path"` and its `path` geometry is present

#### Scenario: A rect carrying geometry is rejected

- **WHEN** a document contains a node whose kind is `"rectangle"` and whose
  `path` geometry is present
- **THEN** validation fails with `DOCUMENT_INVALID`

#### Scenario: A path without geometry is rejected

- **WHEN** a document contains a node whose kind is `"path"` and whose `path`
  geometry is absent
- **THEN** validation fails with `DOCUMENT_INVALID`

#### Scenario: A v1 document cannot smuggle a path in

- **WHEN** a document declares schema version 1 and contains a `"path"` node
- **THEN** validation fails

### Requirement: Path geometry is an id-keyed point map over ordered subpaths

Path geometry SHALL be composed of a flat map of points keyed by stable point
ids, a map of subpaths keyed by stable subpath ids, and a fill rule. Each point
SHALL declare which subpath it belongs to, and SHALL declare its position
within that subpath via a fractional order key that is never renumbered.

Each point SHALL carry node-local coordinates and an authored handle mode of
`corner`, `free`, `asymmetric` or `mirrored`. Handles SHALL be stored as
deltas relative to the point's coordinates, never as absolute positions. When
the handle mode is `mirrored`, the incoming handle SHALL NOT be stored; it is
derived as the exact negation of the outgoing handle. When the mode is
`corner`, no handle SHALL be stored.

#### Scenario: Inserting a point does not renumber its neighbours

- **WHEN** a point is inserted into a subpath between two existing points
- **THEN** the two existing points' order keys are unchanged
- **AND** the inserted point's order key sorts between theirs

#### Scenario: A mirrored point has one stored handle

- **WHEN** a point's handle mode is `mirrored`
- **THEN** its outgoing handle is stored
- **AND** its incoming handle is derived as the negation and never stored

### Requirement: Points and subpaths have stable identity with referential integrity

Point ids SHALL be minted once and never derived from geometry, coordinates or
position. Paste SHALL mint fresh ids — two pasted copies of the same path
SHALL NOT share point ids. Point ids SHALL be unique within a path node;
subpath ids SHALL be unique within a path node.

Every point SHALL be referenced by exactly one subpath, exactly once. Every
referenced point SHALL exist. Every subpath SHALL contain at least two points.
An open subpath's points, in order-key order, define segments from each point
to the next; a closed subpath additionally defines the final segment from the
last point back to the first.

#### Scenario: Undo after a point deletion restores the same point

- **WHEN** a point is deleted and the deletion is undone
- **THEN** the restored point has the same id and coordinates as before
  deletion

#### Scenario: Pasting a path twice yields distinct point ids

- **WHEN** a path node is pasted twice
- **THEN** no point id in the first copy equals any point id in the second

#### Scenario: An orphan point is rejected

- **WHEN** a point is present in the point map but referenced by no subpath
- **THEN** validation fails

#### Scenario: A point shared between two subpaths is rejected

- **WHEN** two subpaths both reference the same point id
- **THEN** validation fails

#### Scenario: A one-point subpath is rejected

- **WHEN** a subpath references fewer than two points
- **THEN** validation fails

### Requirement: `bounds` is derived and verified for path nodes

For a `path` node, `bounds.x` and `bounds.y` SHALL remain authored placement,
and `bounds.width` and `bounds.height` SHALL be the tight bounding box of the
path geometry in node-local space, computed using true bezier extrema rather
than the control-point hull. The bounding box SHALL be recomputed by the same
command that changes the geometry and SHALL be verified by document validation
within a tolerance. The geometry's bounding-box minimum corner SHALL be
`(0,0)` in node-local space at all times.

#### Scenario: Moving a point past the left edge rebases the whole path

- **WHEN** a point is moved so that its new position has a negative x
  coordinate
- **THEN** every point shifts right by the same delta
- **AND** `bounds.x` decreases by that delta
- **AND** the on-screen position of the geometry is unchanged

#### Scenario: A horizontal line validates

- **WHEN** a path node's geometry is a two-point horizontal line
- **THEN** the document validates
- **AND** the node's `bounds.height` is zero

#### Scenario: Validation catches stale bounds

- **WHEN** a document's path node has geometry whose bounding box differs from
  its `bounds.width`/`bounds.height` beyond tolerance
- **THEN** validation fails

### Requirement: Path selection is ephemeral and survives undo

Point selection SHALL be ephemeral editor state, never serialized into the
document. Point selection SHALL be recorded in history entries and restored on
undo, and SHALL be filtered against the live geometry after every document
change so that deleted points cannot remain selected.

#### Scenario: Undoing a point deletion restores point selection

- **WHEN** a selected point is deleted and the deletion is undone
- **THEN** the point is selected again after the undo

#### Scenario: A deleted point is never selected

- **WHEN** a selected point is deleted
- **THEN** the selection no longer contains that point id
