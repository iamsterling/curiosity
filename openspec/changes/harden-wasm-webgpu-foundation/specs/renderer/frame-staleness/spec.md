## Purpose

Defines which render packets the host accepts and which it discards, so that a
frame produced from an out-of-date document is never shown, and so that
discarding a frame can never leave the renderer permanently unable to draw.

## ADDED Requirements

### Requirement: A single revision identifies document state for rendering

The system SHALL identify document state for rendering with exactly one
monotonic revision value. The value carried in a render request and the value
echoed back in the render packet SHALL be drawn from the same counter, so that
equality between them is a meaningful staleness test.

Persistence revisions, which change only when a document is saved or loaded,
SHALL NOT be used as the render staleness value.

#### Scenario: Editing advances the render revision

- **WHEN** any command mutates the document
- **THEN** the render revision advances
- **AND** the revision carried in the next render request equals the revision echoed in the packet produced from that document state

#### Scenario: Editing a loaded document with a non-zero persistence revision

- **WHEN** a document whose persisted revision is greater than zero is loaded and then edited
- **THEN** every resulting frame is accepted and drawn
- **AND** no frame is rejected on the grounds of revision mismatch

### Requirement: Packets older than the requested document state are discarded

The system SHALL discard a render packet whose document revision does not match
the revision the caller requested, and SHALL report the discard as a
diagnostic rather than drawing the packet.

A discarded packet SHALL NOT replace the last valid packet, and SHALL NOT be
written back to the document.

#### Scenario: A packet from an older document state arrives

- **WHEN** the packet's document revision is older than the requested revision
- **THEN** the frame is not drawn
- **AND** a staleness diagnostic is reported
- **AND** the previously drawn frame remains on screen

### Requirement: Discarding a frame never wedges the renderer

The host SHALL remain able to draw subsequent frames after any frame is
discarded, for any discard reason. Sequencing state used to detect
out-of-order packets SHALL advance for every packet the encoder actually
produces, including packets that are then discarded.

#### Scenario: Recovery after a discarded frame

- **WHEN** a frame is discarded for any reason
- **AND** a subsequent render request is made whose revision matches
- **THEN** the subsequent frame is accepted and drawn

#### Scenario: Repeated discards do not accumulate

- **WHEN** several consecutive frames are discarded
- **AND** a subsequent render request is made whose revision matches
- **THEN** the subsequent frame is accepted and drawn

### Requirement: Superseded requests are dropped before work is done

The system SHALL drop a render request that has been superseded by a newer
request without producing a packet for it, so that superseding a request does
not consume sequencing state.

#### Scenario: A newer request arrives first

- **WHEN** a render request with a lower request sequence arrives after a higher one has been served
- **THEN** no packet is produced for the superseded request
- **AND** the next in-order request is accepted and drawn
