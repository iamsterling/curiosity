## Purpose

Provides a safe, revisioned agent operation surface over Crafty's canonical
document so AI clients can inspect, preview, commit, and verify changes without
creating a mutation path that differs from human editing.

## ADDED Requirements

### Requirement: Scoped document queries
The system SHALL provide bounded, serializable queries for document summaries,
page and hierarchy structure, individual nodes, current selection, resolved
layout, and diagnostics. A query MUST identify the file and page scope it read
and MUST NOT mutate the document or history.

#### Scenario: Query a bounded tree
- **WHEN** an agent requests a page tree with a valid file and page scope
- **THEN** the response contains stable node IDs, parent/child relationships,
  requested node metadata, the authoritative document revision, and no
  unrelated file data

#### Scenario: Reject an invalid scope
- **WHEN** an agent requests a missing file, page, or node
- **THEN** the operation fails with a stable machine-readable diagnostic and
  does not change document revision or history

### Requirement: Transaction preview
The system SHALL support a labelled preview operation containing a bounded list
of serializable document commands. Preview MUST validate commands against the
current document through the same command validation used for durable edits,
return diagnostics and affected IDs, and MUST NOT create history or persistence
changes.

#### Scenario: Preview valid commands
- **WHEN** an agent previews valid commands against the current base revision
- **THEN** the response includes the projected document revision, affected IDs,
  validation diagnostics, and a transaction ID that can be committed or rolled
  back

#### Scenario: Preview an invalid command
- **WHEN** a command violates a document precondition or validation rule
- **THEN** preview returns the stable diagnostic and leaves the authored
  document, history, and persistence unchanged

### Requirement: Revisioned transactional commit
The system SHALL commit an agent transaction as one labelled history entry only
when its base revision matches the authoritative file revision. Every command
MUST pass the existing validated, invertible command path, and a successful
commit MUST return forward commands, inverse commands, changed node IDs, and
the committed revision.

#### Scenario: Commit an approved transaction
- **WHEN** an agent commits a valid transaction with the current base revision
- **THEN** all commands commit atomically as one undoable operation, the file
  revision increments once, and the receipt reports the affected IDs and
  inverses

#### Scenario: Reject a stale commit
- **WHEN** an agent commits with a base revision older than the authoritative
  file revision
- **THEN** the commit is rejected with a stable revision-conflict diagnostic,
  no commands are applied, and the current revision is returned for recovery

### Requirement: Idempotent operation receipts
The system SHALL require an idempotency key for durable commits and SHALL return
the original receipt for a repeated key without applying commands twice. A
receipt MUST include operation and transaction IDs, label, base and committed
revisions, commands, inverses, changed IDs, diagnostics, persistence status,
and render-verification status.

#### Scenario: Replay a committed operation
- **WHEN** an agent retries a commit with the same file and idempotency key
- **THEN** the system returns the original receipt and leaves the document
  revision unchanged

#### Scenario: Inspect a receipt
- **WHEN** an agent requests a known receipt within the bounded receipt store
- **THEN** the complete structured receipt is returned without exposing another
  file's operations

### Requirement: Rollback and bounded operation events
The system SHALL allow an uncommitted preview transaction to be rolled back,
and SHALL publish ordered, file-scoped operation events for start, preview,
commit, rollback, rejection, conflict, and document revision changes. Event
delivery MUST be bounded and MUST NOT include pointer-move or renderer-frame
noise.

#### Scenario: Roll back a preview
- **WHEN** an agent rolls back an open transaction
- **THEN** preview state is cleared, no authored change or history entry exists,
  and a rollback event is published

#### Scenario: Subscribe to a file
- **WHEN** a client subscribes to a valid file operation stream
- **THEN** it receives ordered events for that file only and a bounded initial
  revision snapshot
