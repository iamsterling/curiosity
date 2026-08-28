## Purpose

Defines what must be proven before the renderer is handed to the editor at
runtime, and what must be proven automatically before a change to the renderer
is allowed to land, so that "it renders" is evidence rather than assumption.

## ADDED Requirements

### Requirement: The runtime proves itself before it is used

The system SHALL NOT hand a renderer to the editor until it has verified, in
the current session, that the encoder module loaded and exports its entry
point, that a graphics adapter and device were obtained, and that a rendered
target reads back the expected pixel values.

If any check fails, the system SHALL report an unavailability diagnostic and
SHALL NOT return a renderer.

#### Scenario: Verification succeeds

- **WHEN** all runtime checks pass
- **THEN** a renderer is returned
- **AND** the verification result is observable in the product

#### Scenario: Readback verification fails

- **WHEN** the rendered target does not read back the expected pixel values
- **THEN** no renderer is returned
- **AND** an unavailability diagnostic is reported

### Requirement: Shader and pipeline creation are exercised automatically

Automated verification SHALL compile the renderer's shader source and create
its render pipeline on a real graphics implementation. A suite in which the
shader source is never compiled SHALL NOT be treated as covering the renderer.

#### Scenario: The shader stops compiling

- **WHEN** the shader source is changed so that it no longer compiles
- **THEN** at least one automated check fails

#### Scenario: The vertex layout stops matching the shader

- **WHEN** the declared vertex layout no longer matches the shader's inputs
- **THEN** at least one automated check fails

### Requirement: Rendered output is compared against a recorded reference

Automated verification SHALL submit at least one frame of a committed fixture
and compare the rendered pixels against a recorded reference image, within a
declared tolerance. References SHALL be committed alongside the fixture that
produced them and SHALL record the environment they were captured in.

#### Scenario: A rendering regression is introduced

- **WHEN** a change alters the rendered output of a covered fixture beyond the declared tolerance
- **THEN** the comparison fails and identifies the fixture

#### Scenario: A reference is missing

- **WHEN** a fixture has no recorded reference
- **THEN** the check fails rather than passing vacuously

### Requirement: Every change to the renderer is verified before it lands

Formatting, linting, encoder tests, the module build, type checking and the
host test suite SHALL run automatically on every proposed change that touches
the renderer, and SHALL block the change on failure.

#### Scenario: A change that breaks the encoder

- **WHEN** a change makes the encoder's tests fail
- **THEN** automated verification reports failure and the change is blocked

#### Scenario: A change that breaks the module build

- **WHEN** a change makes the compiled module fail to build
- **THEN** automated verification reports failure and the change is blocked

### Requirement: The build is reproducible from a clean checkout

The toolchain required to build the compiled renderer module SHALL be declared
in the repository, including the compiler version, the compilation target, and
the exact version of any binding generator whose version must match the
module's own. A clean checkout SHALL build using only the declared toolchain,
without relying on tools discovered at fixed absolute paths.

#### Scenario: Clean checkout build

- **WHEN** the repository is checked out fresh and the declared toolchain is installed
- **THEN** the compiled module builds successfully
- **AND** the build does not depend on a tool located at a hard-coded home-directory path

#### Scenario: Binding generator version skew

- **WHEN** the binding generator's version does not match the version the module was compiled against
- **THEN** the build fails with a message identifying the mismatch

### Requirement: Performance claims are backed by a recorded measurement

A numeric performance budget SHALL NOT be asserted unless it is derived from a
measured distribution over a named, committed fixture, in a recorded
environment. A budget SHALL be enforced by an automated check.

#### Scenario: Budget regression

- **WHEN** a change pushes a measured operation beyond its recorded budget
- **THEN** the automated check fails and names the fixture and the budget

#### Scenario: Invalidated reference measurements

- **WHEN** a change alters the output that a recorded measurement or parity reference was taken from
- **THEN** the reference is re-recorded with its environment noted, rather than the check being relaxed
