## Purpose

Defines how users choose ephemeral fill and stroke intent for future geometry without changing the current selection or persisted document settings.

## ADDED Requirements

### Requirement: Creation style is independently editable

The editor SHALL expose one creation style containing a fill and a stroke, and SHALL provide controls that change either value explicitly. Changing creation style SHALL NOT modify any existing node or any selection color control.

#### Scenario: Fill is changed before drawing

- **WHEN** the user changes the creation fill while an existing node is selected
- **THEN** the creation fill reflects the new value
- **AND** the selected node's fill and the selection color controls remain unchanged

#### Scenario: Stroke is changed independently

- **WHEN** the user changes only the creation stroke
- **THEN** the creation fill remains unchanged
- **AND** the creation stroke reflects the new value

### Requirement: Initial creation style is coherent

A new editor session MUST initialize creation fill to `#818cf8` and creation stroke to `#c4b5fd`.

#### Scenario: Fresh editor session

- **WHEN** an editor session starts without prior in-memory creation-style changes
- **THEN** its creation fill is `#818cf8`
- **AND** its creation stroke is `#c4b5fd`

### Requirement: Creation tools consume the preset

Rectangle, ellipse, frame, line, and pen creation SHALL author the fill and stroke captured for that creation. Open line and pen geometry SHALL retain the captured fill as authored intent even when open geometry does not render a filled interior.

#### Scenario: Rectangle uses the preset

- **WHEN** the user creates a rectangle after selecting fill A and stroke B
- **THEN** the created rectangle has fill A and stroke B

#### Scenario: Ellipse uses the preset

- **WHEN** the user creates an ellipse after selecting fill A and stroke B
- **THEN** the created ellipse has fill A and stroke B

#### Scenario: Frame uses the preset

- **WHEN** the user creates a frame after selecting fill A and stroke B
- **THEN** the created frame has fill A and stroke B

#### Scenario: Line uses the preset

- **WHEN** the user creates a line after selecting fill A and stroke B
- **THEN** the created open path has authored fill A and stroke B

#### Scenario: Pen path uses the preset

- **WHEN** the user begins and completes a pen path after selecting fill A and stroke B
- **THEN** the created path has fill A and stroke B

### Requirement: A creation snapshots style at its start

Rectangle, ellipse, frame, and line gestures MUST snapshot creation style when the creation gesture starts. A pen session MUST snapshot creation style when its first point begins the session. Style changes after either boundary SHALL affect only later creations, not the in-progress creation.

#### Scenario: Style changes during a shape gesture

- **WHEN** a rectangle gesture starts with fill A and stroke B
- **AND** creation style changes to fill C and stroke D before the gesture commits
- **THEN** the committed rectangle has fill A and stroke B
- **AND** the next creation uses fill C and stroke D

#### Scenario: Style changes during a pen session

- **WHEN** a pen session begins with fill A and stroke B
- **AND** creation style changes to fill C and stroke D before the path closes or ends
- **THEN** the committed pen path has fill A and stroke B
- **AND** the next pen session uses fill C and stroke D

### Requirement: Creation style is session-only editor state

Creation style MUST NOT be serialized, saved, added to document history, restored by undo or redo, or change the document revision merely because a preset value changed.

#### Scenario: Preset change has no durable effect

- **WHEN** the user changes creation fill and stroke without creating geometry
- **THEN** serialized and saved document content is byte-equivalent to content before the change
- **AND** document revision and undo/redo availability are unchanged

#### Scenario: Undo does not restore a prior preset

- **WHEN** the user changes creation style, creates a node, changes creation style again, and undoes the creation
- **THEN** the node creation is undone
- **AND** the latest creation style remains active
