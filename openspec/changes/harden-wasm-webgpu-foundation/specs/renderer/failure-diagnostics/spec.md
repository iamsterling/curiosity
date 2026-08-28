## Purpose

Defines the single vocabulary in which the renderer reports failure, the
severity classes that tell a caller how to react, and the guarantee that no
renderer failure is silent or destroys authored state.

## ADDED Requirements

### Requirement: One diagnostic vocabulary

The renderer SHALL report every failure using one declared set of diagnostic
codes. Every code the renderer can emit SHALL be a member of that set, and
every member SHALL be reachable from some failure path.

A declared vocabulary with no producer SHALL NOT be retained.

#### Scenario: Emitted codes are declared

- **WHEN** the renderer emits a diagnostic
- **THEN** its code is a member of the declared vocabulary

#### Scenario: Declared codes are reachable

- **WHEN** the declared vocabulary is enumerated
- **THEN** each code has at least one automated check that produces it

### Requirement: Diagnostics carry a severity that determines recovery

Each diagnostic SHALL declare whether the condition is recoverable — the
current frame is dropped and rendering continues — or critical — the renderer
or its device must be torn down and rebuilt. The caller SHALL be able to choose
its recovery action from the severity without matching on individual codes.

#### Scenario: Recoverable failure

- **WHEN** a recoverable diagnostic is reported
- **THEN** the previously drawn frame remains on screen
- **AND** the next valid render request is drawn without any teardown

#### Scenario: Critical failure

- **WHEN** a critical diagnostic is reported
- **THEN** the renderer and its device-owned resources are torn down and re-acquired
- **AND** rendering resumes once re-acquisition succeeds

### Requirement: Renderer failure never damages the document

A renderer failure SHALL NOT write to the document, and SHALL NOT replace the
last valid packet with an invalid one. Authored state SHALL survive any
renderer failure.

#### Scenario: Failure during a gesture

- **WHEN** the renderer fails while an edit gesture is in progress
- **THEN** the document is unchanged by the failure
- **AND** the gesture can be completed or cancelled normally

### Requirement: No failure is silent

Asynchronous failures reported by the graphics device — including validation
errors, resource-creation failures and submission failures — SHALL be captured
and surfaced as diagnostics. A failure SHALL NOT be observable only as a blank
or stale canvas.

#### Scenario: Pipeline or shader validation fails

- **WHEN** the graphics device reports a validation error asynchronously
- **THEN** a diagnostic is reported with a code from the declared vocabulary

#### Scenario: A fault inside the encoder

- **WHEN** the encoder faults on malformed input
- **THEN** a diagnostic carrying a message identifying the fault is reported
- **AND** the failure is not reported only as an opaque unrecoverable trap

### Requirement: Diagnostic messages leak nothing

Diagnostic messages SHALL NOT include adapter internals, shader source, packet
contents, document contents, or arbitrary thrown values.

#### Scenario: Message content

- **WHEN** any diagnostic is emitted
- **THEN** its message contains none of the prohibited content

### Requirement: There is no fallback backend

When the renderer cannot initialize, the system SHALL report that it is
unavailable and draw nothing. It SHALL NOT substitute a different rendering
backend.

#### Scenario: The graphics API is unavailable

- **WHEN** the required graphics API is not available in the host environment
- **THEN** an unavailability diagnostic is reported
- **AND** no alternative backend is requested or used
