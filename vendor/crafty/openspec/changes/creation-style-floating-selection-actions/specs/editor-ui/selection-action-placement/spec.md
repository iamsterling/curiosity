## Purpose

Defines how selection actions remain accessible while floating near selected geometry without becoming authored canvas content or intercepting canvas gestures incorrectly.

## ADDED Requirements

### Requirement: Selection actions follow the authoritative selection projection

When a selection exists, the selection action surface SHALL be positioned from the editor's authoritative selection box and world-to-screen viewport transform, the stage size, and the measured action-surface size. The surface SHALL NOT derive a second selection bound or coordinate transform.

#### Scenario: Viewport changes

- **WHEN** a visible selection remains unchanged while the viewport pans or zooms
- **THEN** the action surface moves to the position derived from the updated projected selection

#### Scenario: Surface measurement changes

- **WHEN** the action surface's measured width or height changes
- **THEN** placement is recomputed with the new measured size

### Requirement: Placement prefers above and remains horizontally available

The action surface MUST be placed 10 CSS pixels above the selected geometry when the complete surface fits above the stage. If it does not fit above, it SHALL be placed 10 CSS pixels below the selected geometry. Its horizontal position MUST be clamped so the complete surface remains within the stage whenever the surface is not wider than the stage.

#### Scenario: Selection has room above

- **WHEN** a visible selection has at least the measured surface height plus 10 pixels of stage space above it
- **THEN** the surface's bottom edge is 10 pixels above the projected selection's top edge

#### Scenario: Selection is near the top edge

- **WHEN** the complete surface cannot fit 10 pixels above a visible selection
- **THEN** the surface's top edge is 10 pixels below the projected selection's bottom edge

#### Scenario: Selection is near a horizontal edge

- **WHEN** centered placement would put part of the surface beyond the left or right stage edge
- **THEN** the horizontal placement is clamped to keep the complete surface within the stage

### Requirement: Visibility follows selection visibility

The action surface MUST be hidden when there is no selection or when the projected selection box is fully outside the stage. A selection intersecting any part of the stage SHALL remain eligible for placement.

#### Scenario: No selection

- **WHEN** selection becomes empty
- **THEN** no selection action surface is visible

#### Scenario: Selection is fully offscreen

- **WHEN** the projected selection lies wholly beyond the stage on any side
- **THEN** the selection action surface is hidden

#### Scenario: Selection is partially visible

- **WHEN** the projected selection intersects the stage by any positive area
- **THEN** the selection action surface is visible and follows the placement rules

### Requirement: Selection actions remain a self-wiring accessible leaf

The floating selection actions SHALL obtain selection state and invoke duplicate and delete behavior without callbacks or selection state passed through the shell. The surface MUST expose toolbar semantics with an accessible name; each action MUST retain its accessible name and keyboard operability.

#### Scenario: Keyboard user reaches actions

- **WHEN** a keyboard user navigates to the visible selection action toolbar
- **THEN** duplicate and delete are focusable and named
- **AND** invoking either action performs the same editor operation as its existing command path

### Requirement: Action interaction does not become a canvas gesture

Pointer interaction within the selection action surface MUST NOT propagate to the stage's pointer-down gesture handling. Activating duplicate or delete SHALL produce only that action's document/history effects.

#### Scenario: Duplicate is clicked

- **WHEN** the user presses and activates Duplicate within the floating surface
- **THEN** the stage does not begin selection, move, creation, pan, or other pointer interaction
- **AND** duplicate executes once through the editor command path

### Requirement: Floating placement preserves render and SSR boundaries

The selection action surface MUST NOT require a React panel render on canvas pointer movement. Server rendering MUST NOT read browser-only globals or the live document, and the surface SHALL attach to its stage positioning host only after client mount.

#### Scenario: Pointer moves during a canvas gesture

- **WHEN** pointer movement updates selection projection or viewport placement
- **THEN** the floating position may update
- **AND** unrelated panels and shell composition do not render because of that pointer movement

#### Scenario: Server render

- **WHEN** the editor client island is server-rendered before hydration
- **THEN** rendering completes without reading `document`, `window`, or a live stage element
- **AND** no portal is attached until after mount
