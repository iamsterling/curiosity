## Purpose

Defines the observable native iOS renderer boundary and the evidence required
before the existing Rust/Vello/wgpu renderer can replace the provisional Swift
scene.

## ADDED Requirements

### Requirement: The native artifact preserves the coarse renderer boundary

The native renderer artifact SHALL accept one complete versioned frame packet
per encode or render request. It SHALL NOT expose per-object mutation or carry
document, component, history, collaboration, or other product semantics.

#### Scenario: One frame crosses once

- **WHEN** a native host submits a frame
- **THEN** one call carries the complete frame packet
- **AND** no per-shape call is required

### Requirement: Native and web encoding use the same encoder

For the same accepted frame packet, native and web builds SHALL report the same
deterministic encode fingerprint and counts.

#### Scenario: A canonical rectangle matches

- **WHEN** the canonical rectangle packet is encoded by both builds
- **THEN** their fingerprint, path count, and segment count are equal

### Requirement: The foreign boundary fails closed

Malformed UTF-8, malformed packets, null input, and encoder failures SHALL return
a stable non-success status. A panic SHALL NOT unwind across the foreign
boundary. Every successful or failed owned result SHALL have one explicit
destruction operation.

#### Scenario: Malformed input is rejected

- **WHEN** the host submits malformed input
- **THEN** the call returns a stable failure status and diagnostic bytes
- **AND** no frame is presented

### Requirement: Link success is not presentation success

The native host SHALL expose a versioned ABI that the application can call after
linking. Compile/link evidence SHALL NOT be reported as pixel, lifecycle,
recovery, latency, or memory evidence.

#### Scenario: S0 passes without overstating S1

- **WHEN** the application links and calls the expected ABI version
- **THEN** S0 may pass
- **AND** S1 remains incomplete until a packet-driven frame is presented on the
  physical target

### Requirement: The provisional scene is not extended

Until packet-driven presentation passes, the provisional renderer MAY remain as
a comparison fixture, but it SHALL receive no new authored feature or product
semantic.

#### Scenario: Native work precedes product features

- **WHEN** an iPad renderer slice is implemented before S1 passes
- **THEN** it is limited to build, ABI, packet, presentation, lifecycle, or
  measurement work
