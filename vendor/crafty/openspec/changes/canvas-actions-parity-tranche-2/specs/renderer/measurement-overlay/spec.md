## Purpose

Defines how measurement facts render on the canvas: distance lines and numeric
pills composed as overlay content, never authored geometry.

## ADDED Requirements

### Requirement: Measurement facts render as lines and pills

When measurement facts are present, the renderer SHALL draw, for each
measured axis, a line spanning the measured gap between the two rects and a
numeric pill stating the distance. Pills SHALL render at fixed screen size
regardless of zoom, and lines SHALL render at fixed screen thickness. The
displayed number SHALL be the world-unit distance, shown without trailing
zeros beyond two decimal places.

#### Scenario: Gap renders with a labeled pill

- **WHEN** measurement facts report a 24-unit horizontal gap
- **THEN** a line spans the gap between the facing edges
- **AND** a pill reading "24" renders at the line's midpoint at the same
  screen size at 50% and 400% zoom

#### Scenario: Parent-edge measurement renders four lines

- **WHEN** measurement facts report distances to a container's four inner
  edges
- **THEN** four labeled lines render, one per edge

### Requirement: Measurement overlay is composed, not authored

Measurement lines and pills SHALL be overlay content composed after the
authored packet. They SHALL never appear in the authored document, exports,
or the persisted scene, and a renderer failure while drawing them SHALL NOT
affect the authored content on screen.

#### Scenario: Export excludes measurements

- **WHEN** a frame is exported while measurements are visible
- **THEN** the exported image contains no measurement lines or pills

### Requirement: Pill text degrades without blocking

If numeric pill text cannot be rendered, the renderer SHALL still draw the
measurement lines and SHALL report a diagnostic with a stable code rather
than failing the frame.

#### Scenario: Text failure keeps lines

- **WHEN** pill text rendering is unavailable
- **THEN** measurement lines render and a diagnostic identifies the
  unsupported pill text
