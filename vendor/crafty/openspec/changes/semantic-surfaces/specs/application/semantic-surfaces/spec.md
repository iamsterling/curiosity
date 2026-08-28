## Purpose

Define the durable, target-neutral application semantics that may be attached to a visual frame without changing the frame into a framework-specific construct.

## ADDED Requirements

### Requirement: A frame may declare one semantic surface

The document SHALL allow an eligible frame to carry at most one semantic surface record. A surface SHALL have a stable id, a supported role, and an explicit behavior version. The supported initial roles SHALL be `freeform`, `screen`, `layout`, `component`, and `overlay`.

#### Scenario: An ordinary frame remains visual

- **WHEN** a frame has no semantic surface record
- **THEN** it remains a valid visual frame with no application meaning implied

#### Scenario: A frame is promoted to a screen

- **WHEN** a valid surface record with role `screen` is assigned to a frame
- **THEN** the document retains the frame's existing visual hierarchy and records the screen role as authored intent

#### Scenario: An unknown surface version is loaded

- **WHEN** a surface record declares an unsupported behavior version
- **THEN** document validation rejects it with a stable unsupported-version diagnostic

### Requirement: Surface roles have distinct meaning

The system SHALL treat roles as semantic intent, not visual styling. A `layout` SHALL represent persistent composition around descendant content; a `screen` SHALL represent a navigable application surface; a `component` SHALL represent a reusable boundary; an `overlay` SHALL represent transient layered presentation; and `freeform` SHALL carry no additional application contract.

#### Scenario: A layout is projected to multiple targets

- **WHEN** an adapter later consumes a layout surface
- **THEN** it may map the persistent composition relationship to that target's composition mechanism without changing the authored role to the target's vocabulary

### Requirement: Semantic primitives are explicit relationships

The system SHALL represent an outlet, slot, or link as an explicit semantic relationship identified by stable ids and source/target node references. These relationships SHALL not require a new renderer geometry kind and SHALL be inspectable independently of visual bounds.

#### Scenario: A layout declares an outlet

- **WHEN** a layout surface contains an outlet relationship targeting a descendant node
- **THEN** the relationship identifies the insertion point without requiring a rectangle named `children` or `outlet`

#### Scenario: A link targets a screen

- **WHEN** a link relationship targets a screen surface
- **THEN** the target is represented by a stable surface id, not by a canvas array position or a generated filesystem path

### Requirement: Routes are target-neutral intent

A screen MAY declare a route intent containing a normalized path pattern and optional stable route id. Route intent SHALL be independent of Next.js filenames, router APIs, or filesystem layout. A screen route path SHALL be unique within its document.

#### Scenario: A screen declares `/settings/billing`

- **WHEN** the route intent is valid
- **THEN** it is stored as authored route intent and remains available to future web, native, or other adapters

#### Scenario: Two screens claim the same route

- **WHEN** a command would create duplicate route intent in one document
- **THEN** the command is rejected and the document remains unchanged

### Requirement: Bindings are explicit and non-canonical

The document MAY carry a target binding for a surface. A binding SHALL identify a target family and opaque target reference, while preserving the semantic surface as canonical. A missing, stale, or unsupported binding SHALL be diagnosable and SHALL NOT change the surface role.

#### Scenario: A Next.js binding exists

- **WHEN** a screen is bound to a Next.js target reference
- **THEN** the binding records that projection relationship while the screen remains a Crafty screen

#### Scenario: A binding is absent

- **WHEN** a surface has no binding
- **THEN** it remains fully valid and target-neutral

### Requirement: Surface mutations are validated and invertible

All surface creation, update, and removal SHALL go through document commands that validate the resulting document and return an exact inverse. A no-op update SHALL report `changed: false`; a rejected update SHALL not mutate the document or history.

#### Scenario: A surface is cleared

- **WHEN** a valid clear command removes a surface record
- **THEN** the frame remains, the semantic record is absent, and the inverse restores the exact prior record

#### Scenario: A surface relationship references a missing node

- **WHEN** a command adds a relationship whose source or target does not exist
- **THEN** it is rejected with a stable missing-reference diagnostic

### Requirement: Semantic records survive canonical document operations

Valid surface records and relationships SHALL round-trip through canonical document serialization and supported subtree clipboard operations. Ephemeral selection, hover, active tool, camera, and preview state SHALL not be included in the surface records.

#### Scenario: A document is serialized and loaded

- **WHEN** a valid document contains semantic surfaces, routes, relationships, and bindings
- **THEN** canonical serialization and loading preserve them byte-equivalently in authored content

#### Scenario: A surface subtree is pasted

- **WHEN** a copied subtree contains semantic records
- **THEN** node and semantic ids are reminted consistently, internal references point to the reminted records, and external references are retained only when their target remains valid
