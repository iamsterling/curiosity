## Purpose

Defines the incremental render packet — the changed-node batch that lets the
encoder re-encode only what moved — and the guarantee that applying a batch to
retained state always reproduces what a full re-encode would have produced.

## ADDED Requirements

### Requirement: A batch merged onto retained state equals a full re-encode

For any sequence of document states, applying the emitted batches in order to
the retained command list SHALL produce the same command list, in the same
order, as re-encoding the final document state in full.

The full re-encode SHALL remain available at all times and SHALL be the
correctness reference.

#### Scenario: Value change on a leaf node

- **WHEN** a node's geometry, transform, colour or opacity changes and the change is emitted as a batch
- **THEN** the merged command list equals the full re-encode of the resulting document

#### Scenario: Change inside a nested subtree

- **WHEN** a node nested beneath one or more parents changes and the change is emitted as a batch
- **THEN** the merged command list equals the full re-encode of the resulting document

### Requirement: Nodes that stop being drawn are reported as removals

The encoder SHALL report every node that was previously drawn and is no longer
drawn, whatever the reason — deletion, a visibility transition, or an ancestor
becoming invisible. Reporting a node as changed while emitting no command for
it SHALL be the signal to drop it from retained state.

A node that becomes invisible SHALL NOT be silently omitted, because the host
cannot distinguish silent omission from "unchanged".

#### Scenario: A visible node becomes invisible

- **WHEN** a node's visibility changes from visible to invisible and the change is emitted as a batch
- **THEN** the node is named in the batch's changed-node list
- **AND** the batch carries no draw command for it
- **AND** the merged command list no longer contains a command for that node
- **AND** the merged command list equals the full re-encode of the resulting document

#### Scenario: An ancestor becomes invisible

- **WHEN** a node with visible descendants becomes invisible and the change is emitted as a batch
- **THEN** the node and each of its previously drawn descendants are named in the batch's changed-node list
- **AND** the merged command list equals the full re-encode of the resulting document

#### Scenario: A node is deleted

- **WHEN** a node is removed from the document
- **THEN** the merged command list no longer contains a command for that node
- **AND** the merged command list equals the full re-encode of the resulting document

### Requirement: Full and incremental packets are distinguishable

A packet SHALL declare whether it is a full packet or an incremental batch by
an explicit field. The host SHALL NOT infer the packet kind from the size of
the changed-node list, because a batch whose only change is a removal carries
an empty command list.

#### Scenario: A batch that only removes nodes

- **WHEN** a batch's sole effect is to remove one or more nodes
- **THEN** the packet is identified as an incremental batch
- **AND** the host merges it onto retained state rather than replacing retained state with it

#### Scenario: A full packet

- **WHEN** the encoder produces a full packet
- **THEN** the packet is identified as full
- **AND** the host replaces its retained state with the packet's commands

### Requirement: The host falls back to a full packet rather than drawing something wrong

When the host cannot reproduce a complete command list — because retained state
is absent, or a batch references state the host does not hold — it SHALL report
a diagnostic and request a full packet. It SHALL NOT draw a partial list and it
SHALL NOT discard retained state it can still use.

#### Scenario: A batch arrives with no retained state

- **WHEN** an incremental batch arrives before any full packet has been drawn
- **THEN** the host reports a diagnostic
- **AND** the previously drawn frame remains on screen
- **AND** the next full packet is drawn normally

### Requirement: Ordering is explicit

Command order SHALL be determined solely by the declared ordering key, applied
identically by the encoder and by the host's merge. Order SHALL NOT depend on
map iteration order, insertion order, or object identity.

#### Scenario: Merge preserves encoder order

- **WHEN** a batch is merged onto retained state
- **THEN** the resulting command order equals the order the encoder would produce for the same document state
