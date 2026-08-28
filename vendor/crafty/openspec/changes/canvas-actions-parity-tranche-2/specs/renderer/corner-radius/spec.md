## Purpose

Guarantees that a rectangle's authored corner radius is visible: what the
document stores and validates, the canvas draws.

## ADDED Requirements

### Requirement: Authored corner radius renders

A rectangle node with a positive corner radius SHALL render with rounded
corners of that radius in world units, scaled with zoom, in both the full
scene render and incremental updates. A radius of zero SHALL render square
corners. The effective radius SHALL be clamped so it never exceeds half the
rectangle's smaller dimension.

#### Scenario: Rounded rectangle draws rounded

- **WHEN** a 100×100 rectangle with corner radius 12 is rendered
- **THEN** its corners are visibly rounded with a 12-unit radius
- **AND** the same shape re-rendered after an incremental update is identical

#### Scenario: Oversized radius clamps

- **WHEN** a 100×40 rectangle with corner radius 400 is rendered
- **THEN** the corners render with an effective radius of 20

### Requirement: Corner radius participates in hit-testing consistently

Pointer hit-testing on a rounded rectangle SHALL agree with what is drawn:
points inside the rounded silhouette hit; points in the square corner region
outside the rounded silhouette do not.

#### Scenario: Corner notch is not a hit

- **WHEN** a rectangle has a large corner radius and the user clicks in the
  cut-away corner region outside the rounded silhouette
- **THEN** the rectangle is not selected by that click
