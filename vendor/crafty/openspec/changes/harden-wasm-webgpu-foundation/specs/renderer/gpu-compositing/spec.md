## Purpose

Defines how the colour and opacity carried in a render packet reach the
framebuffer, so that a value the encoder computes is a value the user sees
rather than one the GPU silently drops.

## ADDED Requirements

### Requirement: Opacity carried in a packet is composited

Every opacity value the packet carries SHALL affect the rendered result. A
node with opacity below 1 SHALL blend with what is already drawn beneath it,
in the order the ordering key defines.

#### Scenario: Translucent node over an opaque node

- **WHEN** a node with opacity 0.5 is drawn over an opaque node of a different colour
- **THEN** the resulting pixels are a blend of the two colours
- **AND** the result is not the translucent node's colour alone

#### Scenario: Stacked translucency

- **WHEN** two translucent nodes overlap
- **THEN** the result reflects both, composited in ordering-key order

#### Scenario: Fully transparent node

- **WHEN** a node has opacity 0
- **THEN** it does not alter any pixel

### Requirement: Colour reaches the framebuffer in the alpha mode the surface declares

The colour values submitted to the GPU SHALL match the alpha convention the
presentation surface is configured with. A packet colour SHALL NOT be
submitted under one convention and presented under another.

#### Scenario: Translucent content over the page background

- **WHEN** a translucent node is drawn and the canvas composites with the page beneath it
- **THEN** the composited result matches the same content rendered against an equivalent opaque backdrop

### Requirement: The encoded colour space is declared and honoured

The system SHALL declare the colour space in which authored colour values are
interpreted and SHALL convert, or explicitly decline to convert, according to
the presentation format actually in use. The choice SHALL be recorded, not
left implicit.

#### Scenario: Authored colour round-trips

- **WHEN** a node is authored with a given colour and drawn with opacity 1 over an opaque backdrop of the same colour
- **THEN** the rendered pixels match the authored colour within the declared tolerance

### Requirement: Compositing behaviour is verified against rendered pixels

Compositing SHALL be verified by comparing rendered output, not by comparing
encoder inputs. A verification that compares two encoders producing identical
vertices SHALL NOT be treated as evidence that compositing is correct.

#### Scenario: Translucency regression is caught

- **WHEN** blending is removed or misconfigured
- **THEN** at least one automated check that compares rendered pixels fails
