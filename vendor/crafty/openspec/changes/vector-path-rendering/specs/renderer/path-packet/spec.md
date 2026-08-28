## Purpose

Defines protocol v3: how a path draw command is carried in the render packet,
how rects coexist with paths, and what the packet never carries. This is the
transport contract between the Rust encoder and the TypeScript host.

## ADDED Requirements

### Requirement: The protocol version is 3, and version 2 remains accepted

The render packet SHALL declare protocol version 3. A host SHALL continue to
accept and render version 2 packets without conversion.

#### Scenario: A v2 packet still renders

- **WHEN** a host receives a packet declaring protocol version 2
- **THEN** it renders it with the established v2 behaviour
- **AND** no geometry is reinterpreted

### Requirement: A path geometry is carried in the packet

`DrawGeometry` SHALL include `"path"`. A path draw command SHALL carry the
path's point records (coordinates, handles, closure), its fill rule
(`nonzero` or `evenodd`), and its node-local geometry. The command SHALL also
carry the node's bounds, transform, fill colour, opacity and ordering fields,
exactly as every other geometry does.

A path command MAY carry a stroke descriptor (width, caps, joins, dash).
Without one, the path SHALL render filled only.

#### Scenario: A filled bezier path renders

- **WHEN** a packet contains a path command with cubic bezier points and fill
  rule `nonzero`
- **THEN** the rendered image shows the path filled per the nonzero rule
- **AND** its placement, transform, fill colour and opacity match the command

#### Scenario: An evenodd hole renders

- **WHEN** a packet contains a closed path whose fill rule is `evenodd` and
  whose geometry describes a self-intersecting or multi-loop shape
- **THEN** the rendered image shows the region outside the loops filled and
  the loops excluded

#### Scenario: A stroked path renders its stroke

- **WHEN** a packet contains a path command with a stroke descriptor
- **THEN** the rendered image shows the stroke with the declared width, caps,
  joins and dash

### Requirement: Rects remain a first-class geometry

`"rect"` SHALL remain a valid geometry in protocol v3 and SHALL keep its
established fast path. Overlays (selection, grid, guides) SHALL continue to be
rect-based renderer state composed after the authored packet, never authored
geometry.

#### Scenario: Rect and path commands coexist in one packet

- **WHEN** a packet contains both rect and path commands
- **THEN** all commands render in `(zIndex, order)` sequence regardless of
  geometry kind

### Requirement: The packet carries no product semantics

The packet SHALL NOT carry components, tokens, variants, history, triggers or
any document concept beyond geometry, paint, transform, opacity and ordering.

#### Scenario: A path from a component instance renders plainly

- **WHEN** a resolved path node from inside a component instance is encoded
- **THEN** the packet carries only its resolved geometry and paint
- **AND** no component reference appears in the packet
