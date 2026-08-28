## Purpose

Defines isolation mode: a temporary editing scope rooted at a container node
that bounds what pointer and keyboard selection can reach, matching the
drill-in model professional design canvases share.

## ADDED Requirements

### Requirement: Entering isolation

The editor SHALL enter isolation mode rooted at a container node when the user
double-clicks a container that is already the deepest selected node under the
pointer. Entering isolation SHALL select the child under the pointer when one
exists, and SHALL NOT modify the document or create a history entry.

#### Scenario: Double-click drills into a selected frame

- **WHEN** a frame is selected and the user double-clicks a child inside it
- **THEN** the editor enters isolation rooted at the frame
- **AND** the child under the pointer becomes the selection
- **AND** undo history is unchanged

#### Scenario: Repeated double-click descends further

- **WHEN** the editor is isolated at frame A and the user double-clicks a
  group B inside A that is already selected
- **THEN** the isolation root becomes B

### Requirement: Isolation scopes selection surfaces

While isolation is active, click hit-testing, marquee selection, select-all,
and sibling traversal SHALL consider only descendants of the isolation root.
Nodes outside the root SHALL NOT be selectable by pointer.

#### Scenario: Marquee inside isolation

- **WHEN** isolation is rooted at frame A and the user drags a marquee that
  geometrically overlaps nodes inside and outside A
- **THEN** only the nodes inside A are selected

#### Scenario: Select-all inside isolation

- **WHEN** isolation is rooted at frame A and the user invokes select-all
- **THEN** the selection is exactly A's children

### Requirement: Exiting isolation

Escape SHALL exit one isolation level before it clears the selection.
Switching pages or tools, and deleting the isolation root, SHALL exit
isolation entirely. Isolation state SHALL be ephemeral: never serialized and
never restored by undo or redo.

#### Scenario: Escape unwinds isolation before deselecting

- **WHEN** isolation is rooted at group B inside frame A and the user presses
  Escape twice
- **THEN** the first press moves the isolation root to A
- **AND** the second press exits isolation with the selection retained

#### Scenario: Isolation does not survive persistence

- **WHEN** the document is saved and reloaded while isolation is active
- **THEN** the reloaded editor is not in isolation mode

#### Scenario: Click outside the root exits

- **WHEN** isolation is active and the user clicks empty canvas outside the
  isolation root's bounds
- **THEN** isolation exits and the click behaves as a normal top-level click
