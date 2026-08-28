## Purpose

Defines the exact fixed-grid reveal and the renderer-acceptance evidence required before that visible grid may influence editing.

## ADDED Requirements

### Requirement: Grid reveal follows the approved localhost curve

The fixed grid SHALL have settled opacity `0` at and below `5.1×` zoom, SHALL interpolate linearly from `0` to `0.60` between `5.1×` and `6×`, and SHALL remain at `0.60` at and above `6×`.

#### Scenario: Reveal boundaries and midpoint

- **WHEN** target opacity is evaluated at `5.1×`, `5.55×`, and `6×`
- **THEN** the values are respectively `0`, `0.30`, and `0.60`

#### Scenario: Outside the reveal interval

- **WHEN** target opacity is evaluated below `5.1×` or above `6×`
- **THEN** it is clamped respectively to `0` or `0.60`

### Requirement: Packet presence is distinct from visibility styling

The grid overlay SHALL be absent when the animated opacity is zero and present with its line/dot alpha multiplied by the animated opacity when that opacity is positive. A zoom-derived positive target alone SHALL NOT prove that a visible packet was accepted.

#### Scenario: Activation packet remains invisible

- **WHEN** the host builds a grid overlay above the reveal threshold with animated opacity `0`
- **THEN** the packet contains no grid overlay

#### Scenario: Positive animated packet

- **WHEN** the host builds the same overlay with a positive animated opacity
- **THEN** the packet contains grid geometry with the corresponding alpha

### Requirement: Only an accepted matching visible packet enables grid snapping

Grid snapping MUST require positive opacity from the last successful packet whose page, camera, canvas size, device pixel ratio, and complete grid descriptor exactly match the live interaction context. Failure, non-ready submission, renderer replacement/recovery, cleanup, or any mismatch SHALL make the grid ineligible.

#### Scenario: Renderer rejects a packet

- **WHEN** packet submission reports non-ready or failure
- **THEN** that packet does not enable grid snapping

#### Scenario: Render context changes

- **WHEN** any matching field changes before a new successful packet is accepted
- **THEN** the prior grid is ineligible for snapping

### Requirement: Visible fine-grid capture retains a free interval

An eligible grid SHALL capture within the lesser of the ordinary screen-space tolerance and one quarter of the rendered grid step, including the quarter-step boundary and excluding values beyond it. This SHALL leave a free interval between neighboring grid lines.

#### Scenario: Quarter-step edge

- **WHEN** a point lies exactly one quarter-step from the nearest eligible grid line
- **THEN** it snaps to that line
- **AND WHEN** it lies beyond one quarter-step
- **THEN** it remains free unless another higher-priority family applies
