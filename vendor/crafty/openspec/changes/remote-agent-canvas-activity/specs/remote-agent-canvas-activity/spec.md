## Purpose

This capability makes remote agent work observable on the live Crafty canvas
while preserving the authored document, kernel validation and renderer boundary.

## ADDED Requirements

### Requirement: Remote operations are scoped and revision-aware

The remote agent surface MUST identify the file, operation, requested scope and
base document revision before it can preview or commit a mutation.

#### Scenario: Operation starts on the current revision

- **WHEN** an authorized agent starts an operation against the current file revision
- **THEN** the system creates an operation identity and publishes its scoped activity state

#### Scenario: Operation targets a stale revision

- **WHEN** an agent submits a mutation against a revision older than the authoritative file revision
- **THEN** the system rejects the mutation with a stable revision-conflict diagnostic and does not alter the authored document

### Requirement: Agent mutations use the shared document mutation boundary

Every committed remote mutation MUST use the same validated, invertible command
and transaction semantics as a human edit. A remote operation MUST produce one
labelled, inspectable result for one logical commit.

#### Scenario: Valid operation commits

- **WHEN** an authorized operation previews valid commands and commits without a revision conflict
- **THEN** the authored document changes once, history contains one labelled entry, and the result reports changed node IDs and the new revision

#### Scenario: Invalid operation is rejected atomically

- **WHEN** any command in a remote batch violates a document invariant or precondition
- **THEN** the entire batch is rejected, the authored document is unchanged, and stable diagnostics identify the failure

### Requirement: Activity and preview state is ephemeral

The system MUST publish agent activity, affected node IDs, operation phase and
preview geometry as ephemeral state. This state MUST NOT be serialized into the
authored document or included in document history.

#### Scenario: Active work is visible

- **WHEN** an agent is inspecting, previewing or committing a scoped operation
- **THEN** the connected canvas displays bounded activity treatment around the resolved affected elements

#### Scenario: Operation ends

- **WHEN** an operation commits, rolls back, fails or expires
- **THEN** its activity treatment is cleared or transitions to a bounded terminal effect and no activity state is persisted

### Requirement: Renderer activity data is product-semantic-free

The canvas renderer MUST receive only generic bounded overlay geometry and visual
parameters. Agent identity, authorization, operation labels and product
semantics MUST remain above the renderer boundary.

#### Scenario: Activity overlay is rendered

- **WHEN** the browser resolves an active operation to overlay geometry
- **THEN** the renderer can animate the generic effect without reading agent identity or mutating authored geometry

#### Scenario: Renderer fails during activity

- **WHEN** the activity effect or renderer fails
- **THEN** the authored document and last valid authored render remain intact and a renderer diagnostic is returned

### Requirement: Remote results are structured and observable

Every committed, rejected, rolled-back or failed operation MUST expose a
machine-readable result containing operation identity, revision information,
affected IDs and diagnostics. A successful commit MUST expose an inspectable
receipt.

#### Scenario: Commit receipt is returned

- **WHEN** a remote operation commits successfully
- **THEN** the result includes the operation ID, transaction ID, base and committed revisions, changed IDs, diagnostics and persistence status

#### Scenario: Client disconnects during preview

- **WHEN** the remote session disconnects while an operation has not committed
- **THEN** the preview is rolled back or expires, activity is cleared, and no authored history entry is created

### Requirement: Remote access is capability- and resource-bounded

The remote gateway MUST authorize file access and operation capabilities before
executing queries or mutations, MUST require idempotency for commits, and MUST
bound operation size, preview lifetime, activity overlays and event fan-out.

#### Scenario: Missing capability

- **WHEN** a session lacks the capability required for a requested operation
- **THEN** the gateway rejects it with a stable authorization diagnostic and does not invoke the document mutation boundary

#### Scenario: Repeated commit request

- **WHEN** a commit with an already-seen idempotency key is retried
- **THEN** the gateway returns the original operation result without applying the commands again
