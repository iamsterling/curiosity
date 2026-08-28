## ADDED Requirements

### Requirement: The panel consumes a kernel-owned structure projection

The editor SHALL expose a stable, renderer-independent structure projection for
the active page. The projection SHALL distinguish authored node identity from
derived resolved row identity and SHALL expose authored ids, parent relationships,
display metadata, selectable/draggable capability, semantic surface metadata,
component metadata, provenance, isolation scope, and diagnostics.

#### Scenario: Unchanged projection is referentially stable

- **WHEN** an unrelated viewport or renderer status change occurs
- **THEN** the structure projection reference remains stable
- **AND** the panel does not rerender its tree for that unrelated change

#### Scenario: Derived rows cannot become authored identity

- **WHEN** a resolved component descendant appears in the structure projection
- **THEN** it has deterministic projection identity and source provenance
- **AND** rename, reorder, and property actions target an authored id or are
  disabled rather than mutating the derived row

### Requirement: Authored containment remains the primary hierarchy

The default Structure view SHALL render the document's authored parent/child
relationships and z-order. Semantic surfaces, relations, component definitions,
and provenance SHALL appear as badges, metadata, or separate registry views; they
SHALL NOT be inserted as fake visual children.

#### Scenario: Surface metadata does not duplicate a frame

- **WHEN** a frame has a `screen`, `layout`, `component`, or `overlay` surface
- **THEN** the frame appears once in the authored tree with a role indicator
- **AND** selecting the indicator selects the frame while retaining distinct
  surface identity in metadata

### Requirement: Component instances expose linked semantics

An instance row SHALL identify its linked definition, override status, and missing
or stale diagnostics where present. The panel SHALL provide explicit actions for
selecting the instance boundary, entering/editing its source when supported,
resetting overrides, and detaching through validated kernel commands.

#### Scenario: Definition edits are not represented as copied rows

- **WHEN** multiple instances reference one definition
- **THEN** each instance remains a linked row with the same definition identity
- **AND** the panel does not create independent definition copies beneath them

#### Scenario: Legacy state records are not component states

- **WHEN** the panel displays component information
- **THEN** legacy `Story` records are not labeled as the component state model
- **AND** state inspection is reserved for the derived component-state capability

### Requirement: Selection and isolation use kernel semantics

Selection, deep selection, isolation entry/exit, and component boundaries SHALL be
owned by the kernel/editor façade. The panel SHALL invoke those operations and
shall not maintain canonical selection or isolation in React state.

#### Scenario: Isolation scopes the tree

- **WHEN** the user enters an authored frame or component editing boundary
- **THEN** the projection exposes the scoped roots and ancestry breadcrumb
- **AND** selection, move destinations, and panel select-all remain within scope
- **AND** Escape exits one isolation level without serializing the state

### Requirement: Reordering is legal, accessible, and transactional

The panel SHALL request kernel-computed legal destinations. Empty containers SHALL
be valid destinations. Invalid self/descendant/cross-scope moves SHALL be rejected
without mutation. A committed move SHALL produce one validated command/transaction
and one history entry with an exact inverse.

#### Scenario: Keyboard move matches drag move

- **WHEN** a user chooses Move before, Move after, or Move inside from a keyboard-
  accessible action menu
- **THEN** the same destination validation and command path is used as pointer drag
- **AND** cancellation or invalid destination creates no history entry

### Requirement: The tree is accessible and responsive

The panel SHALL expose a named tree with treeitem semantics, levels, expanded state,
selection state, roving keyboard focus, and explicit labels for visibility, lock,
rename, source, override, and movement actions. Actions SHALL remain reachable
without hover. Narrow layouts SHALL preserve usable touch targets and independent
tree scrolling.

#### Scenario: Keyboard users navigate the structure

- **WHEN** focus enters the Structure tree
- **THEN** one row is keyboard-active and Arrow keys navigate visible rows,
  Left/Right collapse or expand/ascend, and Enter selects
- **AND** screen readers receive the row name, level, selected state, role badges,
  and lock/visibility state

#### Scenario: Mobile panel remains operable

- **WHEN** the Structure panel opens in a narrow viewport
- **THEN** it uses the existing sheet/mobile boundary without horizontal overflow
- **AND** row actions meet the project's touch target policy and remain reachable
  without hover
