# Glass fills

## Purpose

Defines the glass fill: an authored surface on document nodes that renders the
scene content behind it — blurred, tinted, saturation-adjusted, optionally
refraction-offset — through the shared WebGPU renderer, and the frosted-glass
styling of Crafty's own chrome via CSS. This is the contract between the kernel
(authored fill + projection records), the renderer protocol (structural
descriptors, no product semantics), the WASM module (pyramid + composite
passes), and the chrome stylesheet.

## ADDED Requirements

### Requirement: A glass fill is authored document state

A node's `fill` SHALL accept either a hex color string (the existing vocabulary,
unchanged) or a glass descriptor object. A glass descriptor SHALL carry a
`kind` of `"glass"`, a `blurRadius` (world units), a `tint` (hex color), a
`tintOpacity` (0–1), a `saturation` (≥ 0, 1 = neutral) and an optional
`refraction` (0–1 displacement amount). The descriptor SHALL be validated: a
non-finite or negative `blurRadius`, a malformed `tint`, a `tintOpacity`
outside 0–1, a `saturation` below 0, or a `refraction` outside 0–1 SHALL be
rejected with `FILL_GLASS_INVALID:<field>` before any mutation is applied.

#### Scenario: A glass fill round-trips byte-identically

- **WHEN** a document whose rectangle carries a glass descriptor (blurRadius
  24, tint, tintOpacity 0.6, saturation 1.4, refraction 0.15) is serialized,
  saved as a `.ui` package, reloaded and parsed
- **THEN** the reloaded document is identical to the saved one
- **AND** the glass descriptor survives byte-for-byte in the canonical
  serialization (sorted keys, no timestamps, no iteration-order dependence)

#### Scenario: An invalid glass field is refused loudly

- **WHEN** a mutation sets `blurRadius` to `-4`
- **THEN** the command fails with `FILL_GLASS_INVALID:blurRadius`
- **AND** no part of the document changes

### Requirement: Glass fills are restricted to rect-geometry nodes

Rectangle and frame nodes SHALL accept glass fills. Path, text and group nodes
SHALL reject them with `FILL_GLASS_GEOMETRY_UNSUPPORTED`, because the v1
composite pass draws glass regions from rect geometry only.

#### Scenario: A path refuses glass

- **WHEN** a mutation sets a glass fill on a path node
- **THEN** it fails with `FILL_GLASS_GEOMETRY_UNSUPPORTED`
- **AND** the path's existing fill is unchanged

### Requirement: Glass fills render the scene content behind them

A glass surface SHALL display the frame's content drawn before it — everything
with lower `(zIndex, order)` plus the content of its ancestors — blurred to the
authored `blurRadius` converted to device pixels (`world × zoom × DPR`),
tinted by `tint` at `tintOpacity`, adjusted by `saturation`, and offset by
`refraction` when non-zero. Glass surfaces SHALL composite after the scene
render and before overlays, so selection chrome, grid and guides always draw
above glass. Changing the zoom SHALL change the effective blur without mutating
the authored `blurRadius`.

#### Scenario: Zoom changes the blur, never the document

- **WHEN** a frame with a `blurRadius` of 12 is viewed at zoom 1 on a dpr-1
  display, then at zoom 2
- **THEN** the second frame renders the surface with twice the device-space
  blur of the first
- **AND** the authored `blurRadius` is unchanged in the document

#### Scenario: Overlays composite above glass

- **WHEN** a frame contains a glass surface and the selection outline, grid or
  guides
- **THEN** the overlays draw over the glass surface, never blurred by it

### Requirement: The renderer protocol carries glass without product semantics

`RenderFrame` SHALL carry a `glassSurfaces` list of structural descriptors —
world bounds, transform, glass parameters and explicit `(zIndex, order)` — that
never import the editor kernel. `DRAW_PROTOCOL_VERSION` SHALL be 4; version 3
SHALL remain accepted. A malformed glass descriptor (non-finite value,
out-of-range field, invalid geometry) SHALL fail the frame with
`RENDER_PACKET_INVALID` and nothing shall be presented.

#### Scenario: A v3 packet still renders

- **WHEN** a renderer built for protocol 4 receives a v3 frame
- **THEN** it renders it exactly as before, with no glass surfaces

#### Scenario: Glass draw order is explicit

- **WHEN** a frame carries glass surfaces interleaved with scene commands by
  `(zIndex, order)`
- **THEN** the composite draws them in exactly that sequence, independent of
  the packet's array order

### Requirement: Glass rendering is bounded and degrades explicitly

Glass surfaces per frame SHALL be bounded by a structural cap. When the cap is
exceeded, surfaces beyond it SHALL draw as flat tint (the descriptor's `tint`
at `tintOpacity`) — never vanish silently — and the frame SHALL report the
degradation with a diagnostic code.

#### Scenario: The cap degrades, it does not hide

- **WHEN** a frame declares more glass surfaces than the cap allows
- **THEN** the earliest-drawn surfaces beyond the cap render as flat tint
- **AND** a `GLASS_SURFACES_CAPPED` diagnostic reports how many were degraded

### Requirement: The chrome uses the frosted-glass style

The editor's own chrome surfaces (sidebar panels, canvas strip, inspector)
SHALL use the frosted style: backdrop blur with saturation and brightness
adjustment, a translucent tint, and an inset highlight. The style SHALL be pure
CSS — no client effects, no JavaScript, no renderer involvement — and SHALL
apply in the server-rendered page without hydration.

#### Scenario: The frosted chrome renders without JS

- **WHEN** the file shell's HTML is served with JavaScript disabled
- **THEN** the chrome surfaces still carry the frosted styling

#### Scenario: The style degrades gracefully

- **WHEN** a browser does not support `backdrop-filter`
- **THEN** the chrome surfaces remain legible with the translucent tint and
  border alone
