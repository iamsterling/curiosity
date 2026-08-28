## Purpose

Defines durable authored layout intent and deterministic resolution into
disposable geometry without making computed values canonical document state.

## ADDED Requirements

### Requirement: Layout intent is optional and additive

A frame SHALL accept flow-container intent containing direction, wrapping,
four-sided padding, row and column gaps, and main- and cross-axis alignment. A
node SHALL accept per-axis Fixed, Hug, or Fill sizing with optional finite
non-negative minimum and maximum sizes, plus participation as either a flowed or
absolute child. A document without layout intent SHALL preserve its existing
authored bounds and behavior.

#### Scenario: Existing documents remain fixed

- **WHEN** a document without layout fields is loaded and resolved
- **THEN** every node retains its authored bounds and no child reflows

#### Scenario: Absolute child leaves flow

- **WHEN** a child of a flow container participates as absolute
- **THEN** it is excluded from flow sizing and placement
- **AND** its fallback geometry remains its authored bounds

### Requirement: Invalid or unsupported intent fails loudly

Malformed layout values SHALL be rejected without document mutation using a
stable `LAYOUT_INVALID:<field>` diagnostic. Properties outside the supported
authored vocabulary SHALL not be silently approximated and SHALL produce a
stable `LAYOUT_UNSUPPORTED:<property>` diagnostic when supplied through an
import or mutation boundary.

#### Scenario: Malformed direction is rejected

- **WHEN** a mutation supplies an unknown flow direction
- **THEN** it fails with `LAYOUT_INVALID:direction`
- **AND** the document remains unchanged

#### Scenario: Unsupported intent is not discarded

- **WHEN** an input supplies a layout property Crafty cannot represent
- **THEN** the result includes `LAYOUT_UNSUPPORTED:<property>`
- **AND** the property is not presented as successfully preserved

### Requirement: Layout semantics are versioned

Every authored layout subtree SHALL identify a supported behavior model and
version. Unknown behavior models or versions SHALL be rejected rather than
coerced to current defaults. Updating Crafty's defaults SHALL NOT change the
resolved behavior of an existing subtree with an older supported version.

#### Scenario: Unknown behavior version is rejected

- **WHEN** a document declares an unsupported layout behavior version
- **THEN** loading fails with a stable unknown-layout-version diagnostic
- **AND** no fallback version is silently selected

#### Scenario: Existing behavior remains stable

- **WHEN** Crafty introduces a newer layout behavior version
- **THEN** a subtree authored with the previous supported version resolves with
  its previous semantics

### Requirement: Resolution produces disposable geometry

Resolution SHALL compute concrete boxes from authored intent without modifying
authored bounds. Fixed sizing SHALL retain the declared size, Hug SHALL use
measured content under the applicable constraints, Fill SHALL participate in
available-space distribution, and minimum and maximum sizes SHALL constrain the
result. Nested layout SHALL terminate for every valid acyclic document.

#### Scenario: Mixed sizing resolves in flow order

- **WHEN** a flow container contains Fixed, Hug, and Fill children
- **THEN** the children receive deterministic sizes and positions in flow order
  according to the container's padding, gaps, alignment, and constraints

#### Scenario: Authored geometry remains unchanged

- **WHEN** the same document is resolved at two container sizes
- **THEN** each resolution may return different disposable boxes
- **AND** the authored bounds are unchanged by both resolutions

#### Scenario: Intrinsic content is measured under constraints

- **WHEN** a Hug-sized leaf requires intrinsic measurement
- **THEN** resolution requests or consumes a measurement for the applicable
  content and size constraint
- **AND** a missing or unsupported measurement produces a stable diagnostic
  with a documented fallback

### Requirement: Resolution is deterministic and behaviorally conformant

The same document, behavior version, intrinsic measurements, and containing
sizes SHALL produce byte-identical resolved output. Supported web-equivalent
semantics SHALL be checked against browser-reference fixtures at multiple
containing sizes; conformance SHALL compare resulting geometry rather than
requiring property-name identity.

#### Scenario: Repeated resolution is identical

- **WHEN** identical layout inputs are resolved twice
- **THEN** the resolved boxes and diagnostic codes are byte-identical

#### Scenario: Reference fixture remains equivalent

- **WHEN** a supported fixture is evaluated by Crafty and by the browser
  reference at each declared containing size
- **THEN** the resulting geometry agrees under the fixture's recorded,
  evidence-based comparison rule

### Requirement: Layout records and commands round-trip

Layout intent SHALL survive canonical save and reload byte-identically. Setting
or clearing container intent, child sizing, participation, or behavior version
SHALL occur through validated commands with exact inverses and one history entry
per command.

#### Scenario: Canonical serialization preserves intent

- **WHEN** a document containing layout records is saved and reloaded
- **THEN** its authored layout records are byte-identical after canonical
  serialization

#### Scenario: Undo restores prior intent

- **WHEN** a layout record is changed and then undone
- **THEN** the prior record or its absence is restored exactly
