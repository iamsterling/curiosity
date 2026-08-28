## Purpose

Defines the measurement facts the editor computes when the user asks for
distances — the Alt-hover measurement convention — as pure, testable data
independent of how an overlay draws it.

## ADDED Requirements

### Requirement: Alt-hover produces selection-to-target measurements

While at least one node is selected and Alt is held, hovering another node
SHALL produce measurement facts between the selection's union bounds and the
hovered node's bounds: for each axis, the gap distance in world units between
the nearest opposing edges, or the overlap extent when the rects intersect.
Measurements SHALL be expressed in world units and SHALL update as the hover
target changes.

#### Scenario: Gap between two disjoint nodes

- **WHEN** a node is selected, Alt is held, and a node 24 world units to its
  right is hovered
- **THEN** the horizontal measurement reports a 24-unit gap between the
  facing edges

#### Scenario: Hovering the selection itself yields nothing

- **WHEN** Alt is held and the pointer hovers a node that is part of the
  selection
- **THEN** no measurement facts are produced

### Requirement: Alt-hover over empty container space measures to the parent

While a selection exists and Alt is held, hovering empty space inside the
selection's parent container SHALL produce measurements from the selection's
union bounds to the container's four inner edges.

#### Scenario: Distances to frame edges

- **WHEN** a child of a frame is selected, Alt is held, and the pointer is
  over empty frame space
- **THEN** four measurements report the distances from the child's bounds to
  the frame's left, right, top, and bottom inner edges

### Requirement: Measurement is ephemeral and read-only

Measurement SHALL NOT mutate the document, create history entries, or be
serialized. Releasing Alt, moving the pointer off a target, switching tools,
or starting any drag SHALL clear the measurement facts.

#### Scenario: Measurement leaves no trace

- **WHEN** the user measures between two nodes and then releases Alt
- **THEN** the measurement facts are cleared
- **AND** the document and history are unchanged
