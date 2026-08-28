## Purpose

Defines the selection chrome the renderer draws: per-node outlines, the union
bounding box with eight resize handles, the hover outline, the size badge,
and the snap lines and distance pills produced during a snapped drag. All of
it is renderer state composed after the authored packet — never authored
geometry, never serialized, kernel-neutral over the packet boundary.

## ADDED Requirements

### Requirement: The overlay packet carries a selection block

The overlay packet SHALL carry an optional `selection` block with: one outline
per selected node (world-space bounds), the union bounding box, up to eight
resize handles each named by position (`top-left`, `top`, `top-right`, `right`,
`bottom-right`, `bottom`, `bottom-left`, `left`) with world-space anchor
points, an optional hover outline, and an optional badge with display text and
a world-space anchor. The block SHALL be absent when nothing is selected, and
SHALL contain no node identities — it is geometry plus handles, not document
references.

The packet SHALL carry an optional `snapLines` block: axis lines at world
positions, each spanning a visible segment `from`/`to` on the perpendicular
axis, with an optional distance label.

#### Scenario: Multi-selection carries one outline per node

- **WHEN** two nodes are selected
- **THEN** the selection block lists both outlines and the union bounding box

#### Scenario: No selection, no block

- **WHEN** nothing is selected
- **THEN** the overlay packet contains no selection block

### Requirement: The host draws the selection chrome from the packet

The renderer host SHALL draw, from the packet alone (no kernel import): each
node's outline as a hairline rectangle at a fixed screen thickness (1 px
divided by zoom, Penpot's `selection-rect-width`); the union bounding box the
same way; the eight handles as corner markers at a fixed screen size with a
fixed screen hit presentation; the hover outline in a distinct colour; and
the badge as a fixed screen-size pill containing the text, centred below the
union box. The badge SHALL NOT scale with zoom: its pixels on screen are
constant at any zoom.

Handles SHALL be hidden while a move or resize transaction is in progress,
and the badge SHALL be hidden while any transform of the selection is in
progress.

#### Scenario: Outline thickness is zoom-independent

- **WHEN** the canvas zoom changes
- **THEN** outlines and handle markers keep the same screen-pixel thickness
  and size

#### Scenario: Handles and badge hide during a transform

- **WHEN** a move or resize drag on the selection begins
- **THEN** handles and the badge are absent from the overlay for the duration
  of the drag

#### Scenario: The badge shows the union dimensions

- **WHEN** a single node of size `235.47 x 113.72` is selected
- **THEN** the badge text is `235.47 x 113.72`
- **AND** when several nodes are selected, the badge shows the union box
  dimensions

### Requirement: Snap lines and distance pills render during a snapped drag

When a drag produces snap facts, the overlay SHALL draw, for each snapped
axis: a line across the viewport at the snapped position in the family's
distinct colour, and a distance pill showing the snapped distance at the
midpoint of the segment between the moving edge and the candidate, with
constant screen size. Snap overlays SHALL disappear when the drag ends or is
cancelled, and SHALL never appear outside an active drag.

#### Scenario: A snapped drag shows a line and a pill

- **WHEN** a drag snaps to a sibling edge on the x axis
- **THEN** a vertical line appears at the snapped position with a pill
  showing the distance moved by the snap

#### Scenario: No snap, no lines

- **WHEN** a drag produces no snap facts
- **THEN** no snap lines or pills are drawn

### Requirement: Handle hit-testing is screen-space, not zoom-baked

The canvas SHALL hit-test resize handles before canvas hit-testing when the
select tool is active and exactly one node (or the selection union) is
selected: a pointer within `10 / zoom` world units of a handle anchor SHALL
resolve to that handle. A corner handle drag SHALL resize the node's bounds
keeping the opposite corner fixed; an edge handle SHALL resize on that axis
keeping the opposite edge fixed; both SHALL enforce a minimum size. The
16-pixel bottom-right hot zone SHALL cease to exist.

#### Scenario: Corner drag anchors the opposite corner

- **WHEN** the top-right handle of a node is dragged by `(dx, dy)`
- **THEN** the node's bounds change to `x` unchanged, `width + dx`, `y + dy`,
  `height − dy` (the bottom-left corner stays fixed) with a minimum-size
  floor

#### Scenario: Edge drag moves one edge only

- **WHEN** the top edge handle is dragged
- **THEN** only the node's `y` and `height` change, with `x`, `width` and the
  bottom edge unchanged

#### Scenario: Handle hit region is screen-constant

- **WHEN** the same pointer offset from a handle anchor is measured at two
  zooms
- **THEN** the hit decision is identical, because the tolerance converts by
  zoom at the point of use
