# Dynamic collections

## Purpose

Defines tenant-defined collections: content types created and evolved at
runtime by tenant principals, stored as versioned definitions in a registry,
and behaving identically to code-defined collections everywhere downstream.
No structural change to the underlying storage occurs at runtime.

## ADDED Requirements

### Requirement: Tenants define collections at runtime

An authorized tenant principal SHALL be able to create a collection —
name, fields, constraints — through the API at runtime, with no deploy and
no storage-structure change. The new collection SHALL be immediately
writable and queryable, and SHALL appear on every derived surface (API
contract, admin descriptors, agent tools) exactly as a code-defined
collection does.

#### Scenario: A runtime-defined collection behaves like a built-in one

- **WHEN** a tenant principal creates a collection with a required title
  field
- **THEN** an entry missing the title is rejected with the same validation
  behavior a code-defined collection produces
- **AND** the admin surface can immediately render an editor for it from its
  descriptors

### Requirement: Collection definitions are versioned with optimistic concurrency

Every tenant-defined collection definition SHALL carry an integer version.
Updates SHALL require the caller's expected version and SHALL fail with a
stable diagnostic code when it does not match the stored version. Each
accepted update SHALL increment the version and preserve prior versions for
reading stored entries written under them.

#### Scenario: A stale update is rejected

- **GIVEN** a collection definition at version 5
- **WHEN** two principals submit updates both expecting version 5
- **THEN** the first succeeds producing version 6, and the second fails with
  a stable version-conflict code without altering the definition

### Requirement: Entries written under old definition versions remain readable

An entry written under an earlier definition version SHALL remain readable
after the definition evolves, interpreted under the definition version it
was written with and surfaced with its version. Definition changes SHALL be
additive-compatible or SHALL declare an explicit upgrade for existing
entries; an entry whose recorded version is unknown SHALL be rejected on
read with a stable diagnostic code, never coerced.

#### Scenario: Definition evolution does not orphan entries

- **GIVEN** entries written under definition version 2
- **WHEN** the definition advances to version 3 with an added optional field
- **THEN** the version-2 entries still read successfully and validate under
  the rules they were written with

### Requirement: System collections are not runtime-editable

Code-defined system collections SHALL NOT be modifiable through the runtime
registry. An attempt to redefine one SHALL fail with a stable diagnostic
code.

#### Scenario: A tenant cannot redefine a system collection

- **WHEN** a tenant principal attempts to create or modify a collection with
  a system collection's identity
- **THEN** the operation fails with a stable diagnostic code and the system
  collection is unchanged
