## ADDED Requirements

### Requirement: Component definitions are linked authored templates

The document SHALL represent a local component definition as a stable definition
record referencing one authored template subtree and, when present, a semantic
surface whose role is `component`. A component instance SHALL reference the
definition by id and SHALL store only instance properties and sparse overrides.
An instance SHALL NOT contain a copied definition subtree.

#### Scenario: Shared definition remains linked

- **WHEN** two instances reference the same local component definition
- **THEN** both instances retain the same `definitionId`
- **AND** changing the definition changes both resolved instances unless an
  instance-specific override applies

#### Scenario: Component surface and definition remain distinct

- **WHEN** a component definition references a component-role semantic surface
- **THEN** the surface id and definition id remain separate stable identities
- **AND** deleting or changing a visual frame does not infer a replacement
  definition or silently retarget an instance

### Requirement: Component graph integrity is validated

Document validation and component mutation commands SHALL reject missing
definitions, missing template roots, invalid component surfaces, malformed
property declarations, invalid instance property values, and direct or transitive
component dependency cycles. Rejection SHALL preserve the prior document and
history.

#### Scenario: Dependency cycle is rejected

- **WHEN** a definition directly or transitively instantiates itself
- **THEN** validation fails with a stable component-cycle diagnostic
- **AND** no command may commit the cyclic document

#### Scenario: Missing definition is diagnosed

- **WHEN** an instance references a definition that does not exist
- **THEN** resolution returns a stable missing-definition diagnostic
- **AND** it does not silently materialize a detached copy

### Requirement: Resolution is pure and provenance-bearing

The resolver SHALL produce a disposable resolved projection from an authored
document and explicit resolution context. It SHALL never mutate authored nodes,
definitions, instances, overrides, bounds, or semantic registries. Every expanded
node SHALL carry source definition, source node, owning instance, and nested
instance ancestry provenance where applicable.

#### Scenario: Resolution preserves authored bytes

- **WHEN** the same document is resolved repeatedly with the same context
- **THEN** the authored canonical bytes remain unchanged
- **AND** the resolved output is deterministic and byte-equivalent across runs

#### Scenario: Nested provenance is retained

- **WHEN** a component contains an instance of another component
- **THEN** the nested resolved nodes identify both instance levels and their
  corresponding definition nodes
- **AND** provenance is not serialized into the authored document or render packet

### Requirement: Sparse overrides resolve without guessing

The resolver SHALL apply supported instance overrides after definition defaults and
property selections. Unsupported, missing, ambiguous, and orphaned overrides SHALL
remain recoverable authored data and produce stable diagnostics; they SHALL NOT be
silently deleted, reattached, or converted into a new definition.

#### Scenario: Override changes only its target

- **WHEN** an instance overrides one supported property on one definition node
- **THEN** that property resolves to the instance value
- **AND** unrelated properties inherit the definition value

#### Scenario: Orphan override remains visible as a diagnostic

- **WHEN** a definition node targeted by an override is removed
- **THEN** the override remains in authored data
- **AND** resolution reports an orphan diagnostic without guessing a new target

### Requirement: Component commands are validated and invertible

The kernel SHALL provide commands for creating/updating/removing local definitions,
creating instances, setting instance properties, setting/resetting sparse overrides,
and detaching an instance. Each mutating command SHALL validate the resulting
document, report honest no-ops, and return an explicit inverse.

#### Scenario: Detach is one undoable conversion

- **WHEN** a user detaches an instance
- **THEN** the effective resolved subtree becomes ordinary authored nodes
- **AND** the instance reference is removed without changing the definition or
  other instances
- **AND** one inverse restores the linked instance exactly

### Requirement: Component identity survives persistence and clipboard

Canonical `.ui` serialization SHALL preserve definitions, instances, properties,
overrides, and component surface references. Clipboard copy/paste SHALL remint
internal identities and references, preserve external references according to an
explicit policy, and emit diagnostics for dropped overrides or unavailable
definitions.

#### Scenario: Save and reload preserves linked components

- **WHEN** a document containing definitions, instances, and overrides is saved
  and reloaded through the document-native store
- **THEN** canonical authored bytes preserve the complete component graph
- **AND** no data is routed through the legacy `Scene` representation

#### Scenario: Paste remaps internal component identity

- **WHEN** a subtree containing a local definition and its instances is pasted
- **THEN** pasted ids are fresh and all internal references target pasted records
- **AND** unresolvable overrides produce a stable paste diagnostic

### Requirement: Renderer semantics remain product-neutral

The renderer packet SHALL contain only resolved geometry, paint, transforms,
ordering, and overlays. Component definitions, instances, variants, overrides,
states, and provenance SHALL remain above the renderer boundary.

#### Scenario: Resolved instance renders plainly

- **WHEN** a resolved node originating inside a component instance is encoded
- **THEN** it renders using ordinary packet geometry and paint
- **AND** no component product record appears in the packet
