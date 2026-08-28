## Purpose

Defines the shared observable contract and sequencing requirements for completing
Crafty's product-level layout capabilities after the authored-layout foundation.

## ADDED Requirements

### Requirement: Layout capabilities remain independently scoped

Each follow-on capability SHALL have an explicit supported vocabulary, observable
scenarios, implementation tasks, and verification evidence. This umbrella records
the minimum child contracts below; each child OpenSpec SHALL refine its contract
before implementation. A capability SHALL NOT be considered complete because an
evaluator helper, schema field, documentation artifact, or isolated unit test
exists without a wired runtime path.

#### Scenario: A child capability is only scaffolded

- **WHEN** a proposed change has records or helpers but no production path consumes them
- **THEN** its status remains incomplete or blocked
- **AND** the blocker and residual risk are recorded

### Requirement: Durable state and resolved geometry remain separate

Every follow-on layout capability SHALL preserve authored document intent as the
canonical state and SHALL return disposable resolved geometry. Computed layout SHALL
not overwrite authored bounds or become an undo entry merely because resolution ran.

#### Scenario: A layout result changes at another containing size

- **WHEN** the same authored document resolves at two containing sizes
- **THEN** the resolved boxes may differ
- **AND** authored layout intent and authored bounds remain unchanged

### Requirement: Runtime hardening is gated by document-native persistence

The layout runtime hardening child SHALL depend on accepted `.ui` persistence and
shall verify layout records through the product save/load path, not only kernel
serialization.

#### Scenario: A layout document is saved through the product path

- **WHEN** a document containing layout intent is saved and reloaded through the `.ui` store
- **THEN** layout intent and behavior versions round-trip canonically
- **AND** the legacy `Scene` persistence path is not used as the acceptance path

### Requirement: Intrinsic measurement is constraint-aware

Text and image measurement SHALL distinguish known dimensions from available-space
constraints and SHALL include relevant content, style, font and asset revisions in
its dependency identity.

#### Scenario: A text width constraint changes

- **WHEN** the available width changes while text content and style remain constant
- **THEN** the measurement query is reevaluated under the new constraint
- **AND** a cache entry for the old constraint is not reused as the new result

### Requirement: Flow, grid and absolute responsive behavior are distinct

Grid SHALL be a separate layout behavior from flex flow. Constraints/pins SHALL
apply only according to an explicit absolute-child coexistence rule. Guides SHALL
remain non-layout overlays.

#### Scenario: A grid child is explicitly placed

- **WHEN** a child has manual cell or area placement
- **THEN** its placement is preserved independently from semantic child order
- **AND** it is not silently converted into flex order

### Requirement: Responsive overrides are sparse and resettable

Breakpoint or container-context layout SHALL store sparse overrides with a distinct
unset/reset state and deterministic precedence. It SHALL NOT duplicate complete
document trees per responsive context.

#### Scenario: A responsive override is reset

- **WHEN** a local context override is cleared
- **THEN** resolution returns to the inherited/base value
- **AND** the clear is one validated, invertible command

### Requirement: Layout interaction operations are explicit

The interaction child SHALL distinguish flow insertion, reparenting, grid placement,
swap and absolute conversion. Its resize scope SHALL be limited to container resize
and changing authored sizing modes; direct child geometry resizing inside flow is
out of scope until separately specified.

#### Scenario: A flow child is reordered

- **WHEN** a user drops a child between two flow siblings
- **THEN** one command changes the ordered child list
- **AND** the resolved boxes are recomputed without authoring pointer-preview geometry

### Requirement: Translation dialect scope is declared

The first translation child SHALL declare supported, lossy and rejected properties
for CSS Flexbox/Grid, Figma Auto Layout/Grid/constraints, Penpot Flex/Grid and
Crafty-annotated SVG/HTML. It SHALL emit stable translation diagnostics and an export
manifest with source mappings and provenance.

#### Scenario: A Figma property has no Crafty equivalent

- **WHEN** a Figma adapter encounters an unsupported property
- **THEN** it returns `LAYOUT_UNSUPPORTED:<property>` or `LAYOUT_LOSSY:<feature>`
- **AND** the manifest records that the property was not preserved

### Requirement: Preview interactions do not mutate durable state

Layout-aware pointer movement SHALL produce only ephemeral proposals and indicators.
A committed insertion, reorder, reparent, grid placement or sizing change SHALL be
one validated, invertible transaction; cancellation SHALL leave the authored
document unchanged.

#### Scenario: A drag is cancelled after crossing a layout container

- **WHEN** a pointer crosses accepted and rejected drop targets and the gesture is cancelled
- **THEN** no durable parent, child order, placement or geometry mutation remains

### Requirement: Unsupported and lossy translation is explicit

Import and export adapters SHALL distinguish supported, lossy, unsupported and
unresolved source behavior. They SHALL preserve source mappings and observed
fallback geometry where possible, and SHALL return stable diagnostics rather than
silently approximating intent.

#### Scenario: An external layout uses an unsupported property

- **WHEN** an adapter encounters a source property Crafty cannot represent
- **THEN** it reports a stable unsupported or lossy diagnostic
- **AND** it does not claim that the property round-tripped successfully

### Requirement: Inference is opt-in and reversible

Automatic layout inference SHALL be a pure proposal operation with confidence,
residual and explanation data. Acceptance SHALL use the same validated command
boundary as human authoring; low-confidence or ambiguous proposals SHALL NOT
commit automatically.

#### Scenario: Geometry supports multiple layout candidates

- **WHEN** an inference pass finds multiple candidates with comparable fit
- **THEN** it returns the alternatives and ambiguity diagnostic
- **AND** it leaves the document unchanged until an explicit acceptance

### Requirement: Component and variant resolution precede layout

When component resolution is available, layout SHALL consume the resolved,
provenance-bearing instance projection after variant selection and sparse override
application. A component definition or selected variant change SHALL invalidate
all affected measurements and layout results, or return an explicit stale diagnostic.

#### Scenario: A variant changes text or child structure

- **WHEN** an instance selects a variant whose resolved content changes
- **THEN** the variant is resolved before intrinsic measurement and layout
- **AND** the resulting boxes retain instance and definition provenance

### Requirement: Stale results have a defined failure policy

When a dependency changes during or before resolution, a stale result SHALL NOT be
presented as current. The resolver SHALL either apply a result carrying the current
document/context revision or retain the last valid current projection and return a
stable stale diagnostic; it SHALL never silently substitute stale geometry.

#### Scenario: An asynchronous result belongs to an older revision

- **WHEN** a layout result arrives for a document revision older than the current revision
- **THEN** it is discarded
- **AND** the last valid current projection remains visible with a stale-result diagnostic

### Requirement: Incremental resolution is equivalent to full resolution

Any incremental or cached layout path SHALL retain a full-resolution fallback and
SHALL be tested against it. Cache reuse SHALL include all relevant constraint,
content, style, font, asset, component, variant, token/theme and
responsive/container-context inputs for the query being reused.

#### Scenario: A dependency changes an intrinsic contribution

- **WHEN** text, font, image metadata, component definition, variant selection,
  token/theme revision or responsive/container context changes
- **THEN** all affected measurement/layout dependents are recomputed or explicitly diagnosed
- **AND** incremental output agrees with full-resolution output

### Requirement: Opaque foreign layouts are diagnosed, not executed

Custom or foreign runtime layout code outside the declared Crafty, CSS-subset,
Figma-subset or Penpot-subset contracts SHALL be preserved only as source metadata
or observed geometry with `LAYOUT_FOREIGN_OPAQUE:<source>`. Execution requires a
future dedicated capability and SHALL not be smuggled into translation or inference.

#### Scenario: An import contains custom layout code

- **WHEN** an adapter encounters a custom measure/place implementation it cannot represent
- **THEN** it retains the available observed fallback and emits `LAYOUT_FOREIGN_OPAQUE:<source>`
- **AND** it does not execute or claim to preserve the custom behavior

### Requirement: Animation remains a separate follow-on

Layout animation SHALL not mutate authored layout on every frame or enter history.
Its separate change SHALL require explicit time, stable resolved geometry and
interruption/retargeting semantics before implementation is accepted.

#### Scenario: Layout changes during an animation

- **WHEN** a second authored destination is committed before the first animation finishes
- **THEN** the future animation capability retargets from the current visual projection
- **AND** no transient animation frame is serialized or added to undo history

### Requirement: Conformance evidence covers behavior, not property names

Supported layout behavior SHALL be validated with deterministic fixtures at multiple
containing sizes, browser references where semantics are web-equivalent, differential
full-versus-incremental tests, and interaction transaction tests. Performance claims
SHALL use committed fixtures, environments and distributions.

#### Scenario: A browser-equivalent fixture is evaluated

- **WHEN** Crafty and the browser reference evaluate the same declared fixture
- **THEN** geometry agrees under the fixture's recorded comparison rule
- **AND** any deviation is committed as a diagnostic or regression fixture
