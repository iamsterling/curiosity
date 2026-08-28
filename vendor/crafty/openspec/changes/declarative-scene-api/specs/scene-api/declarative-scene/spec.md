## Purpose

Defines the observable contract of the declarative scene API: what a scene
description is, how it resolves into the renderer packet, and the guarantees
around determinism and non-mutation. The description is an ergonomic
projection into the renderer — never the canonical document — and editing
semantics are out of scope by construction.

## ADDED Requirements

### Requirement: A scene description is serializable visual primitives

The scene API SHALL accept a serializable description of visual primitives: a
canvas root (size, device-pixel ratio, background), groups (affine transform,
opacity), rects (bounds, corner radius, fill, stroke), paths (the document's
`PathGeometry` representation plus fill rule and stroke descriptor), and text
runs (plain text and fill; metrics deferred to the text decision). A
description SHALL contain no functions, no React nodes and no document
references, and SHALL round-trip through JSON.

#### Scenario: A description round-trips through JSON

- **WHEN** a scene description is serialized and parsed
- **THEN** the parsed description equals the original
- **AND** no information is lost

### Requirement: Resolution is pure and deterministic

The resolver SHALL accept a scene description and a viewport and SHALL return
a protocol-v3 render packet. The same description and viewport SHALL
deterministically produce a byte-identical packet. The resolver SHALL NOT
mutate the description or any document: resolution is a pure read.

The resolver SHALL compute the transform stack and opacity multiplier per
group, and SHALL emit draw commands in `(zIndex, order)` sequence with rects
on the rect path and paths carrying their geometry verbatim.

#### Scenario: Identical input, identical packet

- **WHEN** the same description is resolved twice
- **THEN** the two packets are byte-identical

#### Scenario: Resolution never mutates its input

- **WHEN** a description is resolved
- **THEN** the description is deep-equal to its state before resolution

#### Scenario: Group transforms compose

- **WHEN** a rect sits inside two nested groups with different transforms
- **THEN** the rect's emitted transform is the composition of both, applied
  in nesting order

#### Scenario: Opacity multiplies down the tree

- **WHEN** a group with opacity 0.5 contains a rect with opacity 0.5
- **THEN** the rect's emitted opacity is 0.25

### Requirement: The packet is the boundary

The scene API SHALL emit the renderer packet and SHALL NOT import or depend
on Vello, wgpu, or renderer internals beyond the packet types. The
description SHALL carry no product semantics: no components, tokens,
variants, or history.

#### Scenario: No renderer imports

- **WHEN** the scene API package is inspected for its dependencies
- **THEN** it imports only the packet types from the renderer package

### Requirement: The React binding composes descriptions

The React binding SHALL provide host elements that build a scene description
from props on render, and a canvas host that resolves and submits once per
commit, coalesced to one resolve per animation frame. The binding SHALL NOT
add editing semantics: nothing in it dispatches document commands.

#### Scenario: Commits within one frame collapse

- **WHEN** multiple React commits happen within one animation frame
- **THEN** the host performs exactly one resolution and submission for that
  frame
