## Purpose

Defines the selection-wide geometry commands that let a user align and
distribute a selection on the canvas: `align-nodes` and `distribute-nodes`,
plus the `move-nodes` command that gives the keyboard nudge a multi-node,
single-undo entry. All three are validated, invertible document commands in
the kernel; nothing here defines how they are reached (panel, keyboard,
shortcut).

## ADDED Requirements

### Requirement: `align-nodes` aligns a selection to its union bounds

The command `align-nodes` SHALL accept `nodeIds` (2 or more distinct, existing
nodes) and an `axis` of `"left" | "centerX" | "right" | "top" | "centerY" |
"bottom"`. Every node SHALL share the same `parentId`; a selection crossing
parents SHALL be rejected with `DOCUMENT_ALIGN_PARENTS_DIFFER`, and a
selection with fewer than two nodes SHALL be rejected with
`DOCUMENT_ALIGN_REQUIRES_TWO`. A nodeId that does not exist SHALL be rejected
with `DOCUMENT_NODE_MISSING:<id>`.

The union bounds SHALL be the axis-aligned bounding box of the nodes' own
bounds. For each node, only the axis named by the command SHALL change: the
node's edge or centre SHALL be placed exactly on the corresponding edge or
centre of the union bounds. Nodes already on their target position SHALL NOT
be rewritten. The command SHALL return a validated document and an exact
inverse, and SHALL be a single undo entry.

The command SHALL NOT move locked, hidden, or invisible nodes any differently
from visible ones: a locked node SHALL still align (lock governs selection and
direct manipulation, not geometry commands), and the command SHALL NOT mutate
a node outside `nodeIds`.

#### Scenario: Aligning two siblings left

- **WHEN** a document contains two rectangle nodes with the same parent whose
  bounds are `(0,0,10,10)` and `(20,5,10,10)`
- **AND** `align-nodes` is applied with axis `"left"`
- **THEN** the first node keeps `x = 0` and the second node's `x` becomes `0`
- **AND** neither node's `y`, `width` or `height` changes
- **AND** the inverse restores the second node's original `x = 20`

#### Scenario: Aligning across parents is rejected loudly

- **WHEN** `align-nodes` is applied to two nodes with different parents
- **THEN** the command throws `DOCUMENT_ALIGN_PARENTS_DIFFER`
- **AND** the document is unchanged

#### Scenario: Centring aligns centres, not edges

- **WHEN** `align-nodes` is applied with axis `"centerX"`
- **THEN** every node's horizontal centre equals the union's horizontal centre

#### Scenario: A no-op alignment produces no change

- **WHEN** every node in the selection already satisfies the requested axis
- **THEN** the command reports `changed: false` and the document is unchanged

#### Scenario: Aligning is one undo entry

- **WHEN** `align-nodes` is applied
- **THEN** a single undo restores every node's prior bounds exactly, including
  nodes that did not move

### Requirement: `distribute-nodes` distributes equal gaps across an axis

The command `distribute-nodes` SHALL accept `nodeIds` (3 or more distinct,
existing nodes) and an `axis` of `"horizontal" | "vertical"`. Fewer than three
nodes SHALL be rejected with `DOCUMENT_DISTRIBUTE_REQUIRES_THREE`; the same
same-parent and existence rules as `align-nodes` SHALL apply with
`DOCUMENT_ALIGN_PARENTS_DIFFER` and `DOCUMENT_NODE_MISSING:<id>`.

The command SHALL sort the nodes by their centre on the axis, compute the
union bounds, and place them so that the gap between each consecutive pair is
equal, with the first and last nodes pinned to the union's edges on that axis.
The perpendicular axis SHALL NOT change. The command SHALL return a validated
document and an exact inverse, and SHALL be a single undo entry.

#### Scenario: Distributing three siblings horizontally

- **WHEN** three same-parent nodes at `x = 0`, `x = 40` and `x = 100` (all
  width 10) are distributed on `"horizontal"`
- **THEN** the union is `(0, 110)` and the equal gap is `(110 - 30) / 2 = 40`
- **AND** the nodes' x positions become `0`, `50`, `100`

#### Scenario: Distribution sorts by centre, not by selection order

- **WHEN** `nodeIds` are passed in an order that is not left-to-right
- **THEN** the result is identical to passing them left-to-right

#### Scenario: A two-node selection is rejected

- **WHEN** `distribute-nodes` is applied to exactly two nodes
- **THEN** the command throws `DOCUMENT_DISTRIBUTE_REQUIRES_THREE`
- **AND** the document is unchanged

#### Scenario: Distribution is one undo entry

- **WHEN** `distribute-nodes` is applied
- **THEN** a single undo restores every node's prior bounds exactly

### Requirement: `move-nodes` moves a set of nodes by a delta

The command `move-nodes` SHALL accept `nodeIds` (one or more distinct, existing
nodes) and a `delta` with finite `dx` and `dy`. Every listed node's bounds
SHALL translate by the delta; unlisted nodes, including children of listed
nodes, SHALL NOT be rewritten. The command SHALL reject an unknown nodeId with
`DOCUMENT_NODE_MISSING:<id>` and SHALL return a validated document whose
inverse is the negated delta applied to the same nodes.

The command SHALL NOT move nodes through locked state differently from any
other command: lock does not exempt a node from an explicit geometry command.

#### Scenario: Moving two nodes is one command

- **WHEN** `move-nodes` is applied to two nodes with `delta = (5, -3)`
- **THEN** both nodes' bounds shift by `(5, -3)` and no other node changes

#### Scenario: The inverse is the negated delta

- **WHEN** the inverse of a `move-nodes` command is applied
- **THEN** every moved node returns to its exact prior bounds

#### Scenario: A non-finite delta is rejected

- **WHEN** `move-nodes` is applied with a non-finite `dx` or `dy`
- **THEN** validation fails and the document is unchanged
