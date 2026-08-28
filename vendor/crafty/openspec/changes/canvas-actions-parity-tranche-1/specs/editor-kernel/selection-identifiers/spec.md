## Purpose

Defines the selection identifiers: the kernel-side semantics that say *what is
selected* (the ordered set, its union bounds, and hover), and the keyboard
surface that changes the selection and the camera (nudge, sibling traversal,
zoom-to-fit). All state touched here is ephemeral editor state; nothing in
this spec is serialized or history-bound except the nudge's document move.

## ADDED Requirements

### Requirement: The selection's union bounds are a kernel query

The kernel SHALL expose a pure query returning the axis-aligned union of a
list of node ids' bounds on the current page. The query SHALL skip ids that no
longer exist and SHALL return `undefined` for an empty or all-missing list.
The union SHALL be recomputed from live document bounds on every call; it is a
derived value, never stored.

#### Scenario: Union bounds of a multi-selection

- **WHEN** the query runs over nodes at `(0,0,10,10)` and `(20,5,10,10)`
- **THEN** the union is `(0,0,30,15)`

#### Scenario: Deleted nodes are skipped

- **WHEN** the query receives an id that is not in the document
- **THEN** that id is ignored and the union covers the remaining ids

#### Scenario: An empty selection has no union

- **WHEN** the query receives no ids, or only missing ids
- **THEN** it returns `undefined`

### Requirement: Hover is written by the canvas and never serialized

The kernel SHALL accept a `setHovered` write that replaces the hovered id, and
SHALL reject ids that do not exist in the document. The hovered id SHALL be
ephemeral editor state: it SHALL NOT appear in serialized documents, SHALL NOT
participate in history, and SHALL be cleared on page switch, on any selection
change, on pointer-down, on tool switch and when the pointer leaves the
canvas. The canvas SHALL hit-test idle pointer movement (no buttons pressed)
against the document and write the deepest hit; movement that hits nothing
SHALL clear hover.

#### Scenario: Idle pointer movement hover

- **WHEN** the pointer moves over a node with no buttons pressed
- **THEN** the hovered id becomes that node

#### Scenario: Pointer-down clears hover

- **WHEN** a pointer-down occurs over any node
- **THEN** the hovered id clears and the selection change takes over

#### Scenario: Missing nodes cannot be hovered

- **WHEN** the canvas writes an id that was just deleted
- **THEN** the hovered id is cleared, not set

### Requirement: Arrow keys nudge the selection

A nudge SHALL move every selected node by exactly the same delta in
parent-local coordinates: 1 world unit per plain keypress, 10 world units with
Shift held. Each keypress SHALL be exactly one `move-nodes` document command
and one undo entry; holding the key SHALL rely on the platform key repeat,
with each repeat a separate undo entry. Nudge SHALL NOT move the camera.
Nudge SHALL be ignored while a text field, textarea or content-editable
element has focus, and SHALL be ignored when nothing is selected.

#### Scenario: Nudge moves the selection by one unit

- **WHEN** ArrowRight is pressed with two nodes selected
- **THEN** both nodes' bounds shift by `(1, 0)` and the camera is unchanged

#### Scenario: Shift-nudge moves by ten units

- **WHEN** Shift+ArrowDown is pressed
- **THEN** every selected node's bounds shift by `(0, 10)`

#### Scenario: Each nudge is its own undo step

- **WHEN** ArrowLeft is pressed twice
- **THEN** the first undo restores the second move and the second undo
  restores the first move

#### Scenario: Nudge with no selection does nothing

- **WHEN** an arrow key is pressed with an empty selection
- **THEN** no command is issued and the document is unchanged

### Requirement: Tab traverses siblings

Tab SHALL move the selection to the next sibling of the first selected node in
ascending `childIds` order (top-most first), wrapping from the last sibling to
the first; Shift+Tab SHALL move in the opposite direction, wrapping. The
result SHALL be a single-node selection. With no selection, Tab SHALL select
the first sibling (top-most) and Shift+Tab the last (bottom-most). When the
first selected node has no parent (it is a page root), Tab SHALL select the
first page in the page order.

#### Scenario: Tab selects the next sibling

- **WHEN** the selection is the middle of three siblings and Tab is pressed
- **THEN** the selection becomes the next sibling, wrapping to the first
  sibling when already at the last

#### Scenario: Shift+Tab selects the previous sibling

- **WHEN** Shift+Tab is pressed
- **THEN** the selection becomes the previous sibling, wrapping to the last
  when already at the first

#### Scenario: Tab with no selection starts at the top

- **WHEN** Tab is pressed with an empty selection
- **THEN** the top-most sibling of the page root is selected

### Requirement: Zoom-to commands move only the camera

Cmd/Ctrl+1 SHALL fit the current page's content to the viewport, Cmd/Ctrl+2
SHALL fit the current selection's union bounds to the viewport, and Cmd/Ctrl+0
SHALL restore 100% zoom. Each SHALL be a camera operation on ephemeral
viewport state: no history entry, no document change, and SHALL be a no-op
that still consumes the key when nothing is selected (Cmd/Ctrl+2).

#### Scenario: Zoom to fit selection

- **WHEN** Cmd/Ctrl+2 is pressed with a selection
- **THEN** the viewport centres and scales so the selection's union bounds
  are visible within a defined margin, and no history entry is created

#### Scenario: Zoom keys are handled, not swallowed

- **WHEN** Cmd/Ctrl+1, Cmd/Ctrl+2, Cmd/Ctrl+0 or Cmd/Ctrl+/− is pressed
- **THEN** the event is handled by the editor and the browser default is
  prevented, with a defined result for each key
