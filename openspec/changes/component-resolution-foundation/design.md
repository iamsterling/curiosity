## Context

Semantic surfaces are already document-level records anchored to frames. Component
records and clipboard remapping exist, but there is no resolver, component command
family, component validation, provenance type, or product persistence path that
uses the records. The implementation must add the authored/resolved seam without
creating a second visual tree or changing the renderer protocol.

## Design

### Authored ownership

Keep `DocumentNode` as the visual tree and keep component definitions and instances
as registries. A definition retains `rootNodeId` as the current structural anchor
and gains an explicit optional `surfaceId` when it is associated with a
`SemanticSurface(role: "component")`. The definition id is the reusable identity;
the surface id is semantic application intent. They are never interchangeable.

For this tranche, a local definition template must be an authored subtree with a
stable root and must not be a page root. The validator rejects missing roots,
invalid surface roles, and component dependency cycles. Cross-file libraries remain
diagnosed/deferred.

### Resolved projection

Add a renderer-neutral `ResolvedScene` representation in the kernel. Ordinary page
nodes pass through with authored ids. When traversal reaches an instance boundary,
the resolver expands the referenced definition subtree into deterministic derived
projection ids and attaches provenance:

```ts
interface ResolvedProvenance {
  definitionId?: DocumentId;
  definitionNodeId?: DocumentId;
  instanceId?: DocumentId;
  instancePath: DocumentId[];
}
```

Derived ids are cache/projection keys only. They are never written into the
authored document and never become GPU identity. A missing or invalid definition
produces a diagnostic and a deterministic placeholder/pass-through policy defined
by tests; it never silently copies the source subtree.

The initial resolver supports the existing property-patch shape for variants and
states only as authored patches. It does not claim structural variant branches.
Variant selection is instance data; runtime state selection is an explicit context
field reserved for the next change.

### Override application

Define a closed supported override vocabulary over existing node properties. Apply
defaults, selected property patches, then sparse instance overrides. Keep unknown or
orphaned authored overrides intact and return diagnostics. Clipboard path fallback
remains a paste concern, not a resolution-time identity heuristic.

### Commands and history

Add small commands rather than an arbitrary component patch command:

- `create-component-definition`
- `update-component-definition`
- `delete-component-definition`
- `create-component-instance`
- `set-instance-properties`
- `set-instance-override`
- `clear-instance-override`
- `detach-component-instance`

Each command clones the relevant registry/tree, validates the complete resulting
document, and returns an exact inverse. Detach materializes one effective subtree
and is one transaction/history entry.

### Projection integration

The kernel projection computes:

```text
EditorDocument
  -> resolve local components (pure)
  -> resolve authored layout against the resolved view
  -> project resolved view to legacy Scene temporarily
  -> renderer packet
```

The legacy `Scene` remains a transitional render projection only. Path, glass,
selection, and layout projection must consume resolved nodes, while editing maps
provenance back to authored node ids. Full resolution is the correctness oracle;
incremental invalidation is deferred until the dependency graph is measured.

### Artboard and motion boundary

No new artboard node kind is introduced. Pages remain authoring partitions, frames
remain visual containers, and semantic surfaces remain target-neutral records. A
component-role surface may anchor a definition but does not become the definition.

Motion/prototype records are explicitly deferred. The follow-on will use component
states and screen/overlay surface targets, with explicit time and a separate
ephemeral runtime state. Remote-agent activity remains operational overlay state,
never authored component motion.

## Diagnostics

Use stable codes such as:

- `COMPONENT_DEFINITION_MISSING:<id>`
- `COMPONENT_ROOT_MISSING:<id>`
- `COMPONENT_SURFACE_INVALID:<id>`
- `COMPONENT_DEPENDENCY_CYCLE:<id>`
- `COMPONENT_INSTANCE_INVALID:<id>`
- `COMPONENT_PROPERTY_INVALID:<id>`
- `COMPONENT_OVERRIDE_UNSUPPORTED:<property>`
- `COMPONENT_OVERRIDE_ORPHANED:<id>`
- `COMPONENT_OVERRIDE_AMBIGUOUS:<id>`

Diagnostics are returned in validation/resolution results and are asserted by
codes in tests, never printed or silently repaired.

## Risks and mitigations

- **Template ownership ambiguity:** retain `rootNodeId`, reject page-root templates,
  and record the surface linkage decision in an ADR.
- **Resolved identity leaking into authored state:** use deterministic projection
  ids plus provenance and add serialization purity tests.
- **Variant/state schema overreach:** support property patches only; defer structural
  branches and runtime state records.
- **Legacy adapter loss:** complete document-native persistence before claiming the
  component feature is product-complete; never extend `Scene` with component fields.
- **Selection editing inside instances:** expose provenance now and defer deep-select
  UX until the mapping is tested.
