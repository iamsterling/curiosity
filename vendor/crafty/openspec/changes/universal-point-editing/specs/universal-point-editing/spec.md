## Purpose

Provides one predictable point-and-handle editing model for every object users
place on the canvas, while preserving object-level selection and properties.

## ADDED Requirements

### Requirement: Every placed object has canonical point geometry

Every newly created canvas object MUST have a canonical, stable point geometry
that describes its editable placement or outline. A rectangle MUST contain four
corner anchors; an ellipse MUST expose a deterministic anchor representation;
and lines, frames, text, and images MUST expose their placement boundary as
stable anchors. Point identity MUST remain stable when coordinates change.

#### Scenario: Create a rectangle
- **WHEN** a user creates a rectangle
- **THEN** the authored object contains four addressable corner anchors in
  canonical object-local geometry

#### Scenario: Create a text or image object
- **WHEN** a user places text or an image
- **THEN** its content or source remains an object property and its placement
  boundary is represented by addressable canonical anchors

#### Scenario: Move an object without entering edit mode
- **WHEN** a selected object is moved or resized in object mode
- **THEN** the object-level operation preserves point identity and updates the
  resulting canonical geometry consistently with the object transform

### Requirement: Object mode and point-edit mode are distinct

The editor MUST distinguish object mode from point-edit mode. Selecting an
object MUST target the object and expose object-level transforms and properties.
Double-clicking a selected object or pressing Enter while it is selected MUST
enter point-edit mode for that object. Point-edit mode MUST make the object's
anchors addressable without serializing the mode itself.

#### Scenario: Enter point editing with double-click
- **WHEN** a user double-clicks a selected object
- **THEN** the editor enters point-edit mode for that object and displays its
  anchors and available handles

#### Scenario: Enter point editing with Enter
- **WHEN** a user presses Enter with one object selected
- **THEN** the editor enters point-edit mode for that object instead of
  descending only through its child hierarchy

#### Scenario: Exit point editing
- **WHEN** a user presses Escape or clicks outside the edited geometry
- **THEN** the editor exits point-edit mode without changing authored geometry
  unless a point command was committed

### Requirement: Points support sharp and handled forms

Each anchor MUST support a sharp/corner form with no tangent handles and MUST
support handled forms for smooth or independently controlled curves. Moving an
anchor MUST preserve the authored relationship of its handles. Handle modes
MUST express corner, free, asymmetric, and mirrored behavior without storing
derived handle state that can drift.

#### Scenario: Edit a sharp corner
- **WHEN** a user drags a corner anchor
- **THEN** only the anchor position changes and the adjacent segments remain
  sharp unless the user changes the anchor mode

#### Scenario: Edit a smooth anchor
- **WHEN** a user drags a visible tangent handle on a smooth anchor
- **THEN** the curve updates according to that anchor's handle mode and the
  corresponding handle relationship is preserved

#### Scenario: Change anchor type
- **WHEN** a user changes an anchor between corner, free, asymmetric, or
  mirrored modes
- **THEN** the resulting handle data is valid for the selected mode and the
  operation can be undone exactly

### Requirement: Point editing is transactional and invertible

Point selection, anchor movement, handle movement, insertion, deletion, and
anchor-mode changes MUST use validated document commands. A continuous point or
handle drag MUST be one transaction and one history entry. Cancelled gestures
MUST leave both geometry and point selection unchanged.

#### Scenario: Drag one point
- **WHEN** a user drags an anchor and releases it
- **THEN** the geometry changes through one committed history entry and undo
  restores the exact prior geometry

#### Scenario: Cancel a point drag
- **WHEN** a user presses Escape or the pointer is cancelled during a point drag
- **THEN** the document and point selection return exactly to their pre-drag
  state

#### Scenario: Reject invalid point geometry
- **WHEN** a point command would create non-finite coordinates, invalid handle
  data, broken point membership, or invalid bounds
- **THEN** the command is rejected with a stable diagnostic and the document is
  unchanged

### Requirement: Point overlays are renderer state

Anchor markers, tangent handles, selection highlights, and edit-mode guides MUST
be ephemeral renderer overlays derived from the authored document and editor
state. They MUST NOT become document nodes, affect document serialization, or
be interpreted as product semantics by the renderer.

#### Scenario: Serialize while editing points
- **WHEN** the document is serialized while point-edit mode is active
- **THEN** selection, active handles, edit mode, and overlay markers are absent
  from the serialized authored document

#### Scenario: Render an edited object
- **WHEN** point geometry changes
- **THEN** the renderer receives the resolved geometry plus optional overlays,
  and a renderer failure does not mutate or discard the authored document

### Requirement: Existing documents migrate without visual drift

Existing bounds-first objects MUST load through a deterministic migration that
creates canonical point geometry while preserving stable node IDs, object
placement, dimensions, content, appearance, and page hierarchy. Unknown schema
versions MUST remain rejected.

#### Scenario: Load a legacy rectangle
- **WHEN** a document containing a bounds-first rectangle is loaded
- **THEN** it receives four canonical corner anchors and renders at the same
  visual placement and size

#### Scenario: Round-trip migrated geometry
- **WHEN** a migrated document is serialized and loaded again
- **THEN** point IDs, coordinates, handle modes, object properties, and visual
  placement are preserved deterministically
