## Purpose

Defines the modifier grammar during shape-creation drags — constrain,
draw-from-center, and reposition-in-flight — matching the convention shared by
every professional design canvas.

## ADDED Requirements

### Requirement: Shift constrains creation proportions

While a shape-creation drag is in progress, holding Shift SHALL constrain the
in-progress rectangle, ellipse, or frame to equal width and height, and a line
to 45-degree angle increments. Releasing Shift mid-drag SHALL restore the
unconstrained geometry derived from the live pointer position.

#### Scenario: Shift makes a square

- **WHEN** the user drags out a rectangle and holds Shift
- **THEN** the preview has equal width and height
- **AND** releasing Shift before pointer-up restores the free rectangle

#### Scenario: Shift constrains a line to 45 degrees

- **WHEN** the user drags out a line and holds Shift
- **THEN** the preview snaps to the nearest 45-degree increment

### Requirement: Alt creates from center

While a shape-creation drag is in progress, holding Alt SHALL grow the shape
symmetrically around the drag origin instead of anchoring its corner there.
Alt and Shift SHALL compose.

#### Scenario: Alt-drag grows from the origin

- **WHEN** the user drags out an ellipse holding Alt
- **THEN** the drag origin is the center of the preview

#### Scenario: Shift and Alt compose

- **WHEN** the user drags out a rectangle holding Shift and Alt
- **THEN** the preview is a square centered on the drag origin

### Requirement: Space repositions the in-progress shape

While a shape-creation drag is in progress, holding Space SHALL translate the
whole in-progress shape with the pointer without ending the drag or changing
its size; releasing Space SHALL resume resizing from the new position. Space
during creation SHALL NOT pan the canvas.

#### Scenario: Space slides the preview

- **WHEN** the user is mid-drag creating a rectangle and holds Space while
  moving the pointer
- **THEN** the preview keeps its size and follows the pointer
- **AND** releasing Space resumes resizing from the moved origin

### Requirement: Creation commits remain single history entries

Modifier use during creation SHALL NOT change the transaction shape: one
completed creation drag SHALL produce exactly one history entry, and Escape
mid-drag SHALL cancel with no document change, regardless of modifiers used.

#### Scenario: Modifiers leave history unchanged

- **WHEN** a rectangle is created using Shift, Alt, and Space during the drag
- **THEN** exactly one undo entry exists for the creation
- **AND** a single undo removes the rectangle
