# Collection model

## Purpose

Defines the single-source collection definition: one definition per content
type that drives validation, stored-document encoding, API contracts,
generated types, admin descriptors and agent tool schemas. Nothing else may
define what a collection is.

## ADDED Requirements

### Requirement: One collection definition drives every surface

A collection definition SHALL be the single source of truth for its content
type. From one definition the system SHALL derive: input validation, the
stored document codec, the HTTP contract for that collection, generated
compile-time types, admin field descriptors, and the collection's agent tool
schemas. No surface SHALL carry field knowledge that is not derived from the
definition.

#### Scenario: A field added to a definition appears on every surface

- **GIVEN** a collection definition gains a new required field
- **WHEN** the definition is loaded
- **THEN** validation rejects documents missing the field, the HTTP contract
  and generated types include it, and the admin descriptor set includes a
  descriptor for it
- **AND** no surface required a second, separate declaration of the field

### Requirement: Definitions are immutable once loaded

Loading a collection definition SHALL produce a frozen value. No component
SHALL mutate a loaded definition; extensions and plugins SHALL compose new
definitions rather than modify existing ones in place.

#### Scenario: Attempted mutation of a loaded definition fails

- **WHEN** code attempts to modify a loaded collection definition
- **THEN** the modification fails loudly rather than silently altering
  behavior for other consumers

### Requirement: Stored documents are version-tagged and never coerced

Every stored document SHALL carry the schema version of its collection
definition at write time. On read, a document with an older version SHALL be
upgraded through an explicit version-by-version chain and re-encoded only at
the latest version. A document with an unknown or future version SHALL be
rejected with a stable diagnostic code — never coerced, never partially
loaded.

#### Scenario: An old document upgrades through the chain

- **GIVEN** a document stored at schema version 1 and a definition now at
  version 3
- **WHEN** the document is read
- **THEN** it is upgraded 1→2→3 and returned as a valid version-3 document

#### Scenario: A future version is rejected

- **GIVEN** a document stored at schema version 4 and a definition at
  version 3
- **WHEN** the document is read
- **THEN** the read fails with a stable machine-readable diagnostic code
  identifying the unknown version, and no coerced value is returned

### Requirement: Rich text is stored as structured, renderer-independent blocks

Rich text field values SHALL be stored as structured block data — typed
blocks containing spans with marks and annotations — queryable without
parsing markup and independent of any editing component or renderer. Raw
HTML or editor-internal state SHALL NOT be the stored form.

#### Scenario: Rich text is queryable as data

- **GIVEN** a document with a rich text field containing an annotated link
- **WHEN** the stored value is inspected
- **THEN** the link target is addressable as a structured annotation, without
  parsing markup
