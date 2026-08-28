## Purpose

Defines the kernel snap service's first caller: a pure function that resolves
a requested move of a selection into a snapped move, using the page's
snap settings, grid and guides, and the sibling shapes in the document. It
also defines the snap facts it returns so the canvas can draw snap lines and
distance pills. Nothing here defines pointer handling or UI.

## ADDED Requirements

### Requirement: `snapMoveSelection` resolves a move against the document

The kernel SHALL expose a pure function that accepts a document, a page id, a
non-empty list of moving node ids, a requested world-space delta, the visible
viewport bounds and the current zoom, and returns a snapped delta plus the
snap facts that produced it. The function SHALL be a pure read of the
document and page canvas: it SHALL NOT mutate the document, SHALL NOT depend
on renderer or React state, and SHALL be deterministic for identical inputs.

The snapped delta SHALL be computed per axis with family priority pixel >
guide > object > grid, using the page's `SnapSettings`, within the snap
tolerance expressed as the fixed 6 screen-px constant divided by zoom.

#### Scenario: A move within tolerance of a sibling edge snaps

- **WHEN** the moving selection's left edge, after applying the requested
  delta, lands within the snap tolerance of a sibling's right edge
- **AND** object snapping is enabled
- **THEN** the returned delta places the selection's left edge exactly on the
  sibling's right edge
- **AND** the returned snap facts name the `object` family, the axis, the
  target position, and the distance moved by the snap

#### Scenario: Moving shapes never snap to themselves

- **WHEN** a node is among the moving ids
- **THEN** none of its edges or centres are object-snap candidates, and
  neither are its descendants' edges or centres

#### Scenario: Off-viewport candidates never snap

- **WHEN** a sibling shape's candidate position lies outside the visible
  viewport bounds
- **THEN** that candidate SHALL NOT be considered, regardless of distance
- **AND** guides and the grid are unaffected by this rule

#### Scenario: Hidden shapes never snap

- **WHEN** a sibling is invisible
- **THEN** its positions are not object-snap candidates

#### Scenario: Grid, guide and pixel candidates follow their settings

- **WHEN** grid snapping is enabled, the nearest grid line within tolerance
  SHALL win over any object candidate (family priority)
- **WHEN** guide snapping is enabled, ruler guides and any frame magnet
  positions SHALL participate
- **WHEN** pixel snapping is enabled, the value SHALL round to the device
  pixel grid, and SHALL take priority over all other families
- **WHEN** a family is disabled in `SnapSettings`, its candidates SHALL NOT be
  considered

#### Scenario: Family priority is stable per axis

- **WHEN** candidates from different families are all within tolerance
- **THEN** the higher-priority family wins, exactly one family contributes,
  and within a family the nearest candidate wins

#### Scenario: The returned delta preserves the perpendicular axis

- **WHEN** a snap applies to one axis only
- **THEN** the other axis keeps the requested delta unchanged, and the snap
  facts list only the snapped axis

#### Scenario: No candidate within tolerance snaps nothing

- **WHEN** no family offers a candidate within tolerance
- **THEN** the returned delta equals the requested delta and the snap facts
  are empty

### Requirement: The canvas move path applies the snapped delta

When a selection drag produces a move, the canvas SHALL pass the requested
delta through the kernel snap function before writing any preview, so the
previewed document positions reflect the snap. The snapped delta SHALL be
applied in world coordinates and converted to parent-local coordinates only at
the point of use. The snap facts SHALL be reported to the overlay so snap
lines can be drawn during the drag; a cancelled drag SHALL leave no snap
artefacts and no document change.

#### Scenario: A drag previews snapped positions

- **WHEN** a drag moves a selection and the snap function returns a snapped
  delta
- **THEN** every previewed bound uses the snapped delta
- **AND** the transaction commits the snapped positions on release

#### Scenario: Cancelling a drag removes the snap lines

- **WHEN** a drag that produced snap lines is cancelled
- **THEN** the document is unchanged and the overlay renders no snap lines
