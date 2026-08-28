# Presence

## Purpose

Defines live remote presence: per-client pointer cursors relayed through the
room, ephemeral by construction, drawn as host-composed overlay commands
under a bounded budget. Presence is editor state, never authored geometry,
never serialized, never in history.

## ADDED Requirements

### Requirement: Presence is a separate ephemeral channel

Pointer presence SHALL be relayed per room without being stored, recorded in
history, or included in `snapshotForSave`. Each client SHALL publish its
pointer world point and active tool at most once per rendered frame (the
render loop's cadence), and SHALL stop publishing while no pointer is over
the canvas.

#### Scenario: A pointer moves across the canvas

- **GIVEN** two clients in one room
- **WHEN** client A moves its pointer
- **THEN** the server relays A's position to B within one frame's latency,
  and B's projection exposes it as a remote cursor

#### Scenario: The pointer leaves the canvas

- **GIVEN** client A's pointer leaves the canvas
- **WHEN** A stops publishing
- **THEN** B's remote cursor for A disappears

### Requirement: Remote cursors are renderer overlay commands with a bounded budget

Remote cursors SHALL be composed as host-side overlay draw commands through
the existing `overlayCommands` channel — no new packet types, no Rust
changes. The budget SHALL be at most 8 concurrent cursors; when full, new
cursors SHALL drop in join order. Cursor geometry SHALL be screen-constant
(white dot with the peer's accent ring, sizes divided by zoom at the point
of use).

#### Scenario: A ninth peer joins

- **GIVEN** 8 peers already present in a room
- **WHEN** a ninth peer connects and moves its pointer
- **THEN** its cursor is dropped (join order) and the projection still
  renders at most 8 cursors

### Requirement: Remote selection and hover are never broadcast

Selection and hover state SHALL NOT be broadcast; the only remote ephemeral
state is the pointer cursor. A peer's selection SHALL NOT be visible to other
peers in slice 1.

#### Scenario: A client selects a layer

- **GIVEN** client A selects a layer
- **WHEN** the selection changes
- **THEN** no presence frame carries it, and B's projection is unchanged
