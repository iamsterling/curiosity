## Purpose

Defines how the authored packet becomes pixels on the wgpu line: scene
building in the Rust encoder, full Rust ownership of the canvas (device,
surface, render, present), overlays drawn in the same scene, the packet as
the only per-frame crossing, the failure vocabulary, and the parity
guarantee — headless at the encode level, real-device for pixels.

## ADDED Requirements

### Requirement: The encoder builds a `vello_encoding` scene from the packet

The Rust encoder SHALL build a `vello::encoding::Encoding` from the version-3
packet in `(zIndex, order)` sequence, using the established rect fast path for
`"rect"` commands and fill/stroke scene calls for `"path"` commands. The
encoding SHALL carry only what the packet carries — no document semantics, no
components. Encoding SHALL be deterministic across runs for identical input.

#### Scenario: Rects and paths encode in order

- **WHEN** a mixed packet is encoded
- **THEN** the resulting encoding draws every command in `(zIndex, order)`
  sequence
- **AND** a later-drawn command can occlude an earlier one exactly as the
  existing rect pipeline would

#### Scenario: Encoding is deterministic

- **WHEN** the same packet is encoded twice
- **THEN** the two encodings are identical (parity discipline)

#### Scenario: A non-finite value is rejected at the boundary

- **WHEN** a packet contains a non-finite transform value or coordinate
- **THEN** encoding fails with `VELLO_ENCODE_FAILED`
- **AND** the document and the last valid packet are preserved

### Requirement: Overlays draw in the same scene, after the authored packet

The host SHALL compose the overlay packet (grid, guides, selection chrome,
snap lines) exactly as today — overlays remain renderer state, never authored
geometry (I31). The Rust encoder SHALL decode the overlay packet into the
same scene, after the authored content.

#### Scenario: Overlays draw after the authored content

- **WHEN** a frame renders and the selection overlay is active
- **THEN** the authored content encodes first
- **AND** the overlay content encodes after it, drawn on top

#### Scenario: Overlay composition stays in the host

- **WHEN** the overlay packet is composed
- **THEN** it is composed by the TypeScript host from renderer state
- **AND** nothing in the overlay packet is authored document geometry

### Requirement: Rust owns the canvas end to end

The WASM module SHALL create the WebGPU device (and queue) and the canvas
surface, SHALL create Vello's renderer with that device, and SHALL render and
present the frame itself. The TypeScript host SHALL hand the module the
canvas element, submit the packet, and compose the overlay packet — nothing
else. Device loss SHALL be surfaced as a structured diagnostic with a defined
recovery path.

#### Scenario: One device, one surface, one present

- **WHEN** the module renders a frame
- **THEN** the device, surface, render and present are all module-owned
- **AND** no pixel data crosses back to the host

#### Scenario: Device loss is a diagnostic

- **WHEN** the module-owned device is lost
- **THEN** a structured diagnostic with a severity class is reported
- **AND** the recovery path defined by the failure policy is available

### Requirement: The packet is the only per-frame crossing

A render call SHALL take the packet (JS → WASM) and present the frame. There
SHALL be no per-shape crossings and no pixel readback to the host.

#### Scenario: A frame crosses the boundary once, one-way

- **WHEN** a frame is rendered
- **THEN** exactly one JS/WASM call carries the frame's packet into the
  module
- **AND** no image bytes are returned to the host

### Requirement: Render failures are diagnosed, not silent

A failure to encode or render SHALL produce `VELLO_ENCODE_FAILED` or
`VELLO_RENDER_FAILED` from the single failure-policy producer, with a
severity class. A render failure SHALL preserve the last valid image and the
document.

#### Scenario: A render failure preserves the last frame

- **WHEN** rendering fails after a successful earlier frame
- **THEN** the earlier frame remains on screen
- **AND** a diagnostic with severity is reported
- **AND** the document is unchanged

### Requirement: Parity is verifiable at the encode level headless, and by pixels on a real device

The pipeline SHALL render the existing comparison fixtures
(representative, translucent, ten-thousand-rectangles) at the encode level
headlessly in vitest via the compiled module, compared against recorded
references with the environment noted. Pixel references SHALL be recorded
from the real-device path on the spike's recorded environment, and the
rect-only path SHALL render pixel-identically to the pre-change host on that
environment. Re-recording a reference SHALL be an explicit, isolated act that
changes nothing else.

#### Scenario: The 10k fixture matches its reference

- **WHEN** the ten-thousand-rectangles fixture is rendered
- **THEN** the result matches the recorded reference within the declared
  pixel tolerance
- **AND** the recording environment is noted beside the reference

#### Scenario: A rendering regression fails the harness

- **WHEN** a change alters how a fixture renders
- **THEN** the parity harness fails
- **AND** the change cannot land without re-recording the reference with
  justification

### Requirement: Module size growth and the first-frame cost are measured, not guessed

The wasm32 module size before and after adding the Vello/wgpu dependencies
SHALL be recorded in the benchmarks directory with the build environment,
toolchain and pinned versions. The first-frame cost SHALL be recorded as an
environment-noted distribution.

#### Scenario: The size record exists

- **WHEN** the module is built
- **THEN** its size and the pinned dependency versions are recorded in the
  benchmarks directory
- **AND** a later build can compare against the record

#### Scenario: The first-frame distribution exists

- **WHEN** the present spike runs a fixture
- **THEN** the first-frame cost is recorded as a distribution (median,
  min/max, samples) with the platform noted
