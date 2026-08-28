## 1. Foundation and contract

- [x] 1.1 Re-read current document, semantic-surface, persistence, layout, and
  component architecture docs; reconcile any stale claims in the same change.
- [x] 1.2 Write ADR for component definition identity versus component-role surface
  identity, template ownership, local definition scope, and deferred structural
  variants.
- [x] 1.3 Add component resolution types, provenance, explicit resolution context,
  diagnostics, and deterministic derived projection identity in a kernel-only module.
- [x] 1.4 Add generated component fixtures covering local, nested, overridden,
  missing, cyclic, and orphaned graphs.

## 2. Validation and commands

- [x] 2.1 Validate definition ids, roots, component surface linkage, property
  declarations, instance references, supported override keys, and dependency cycles.
- [x] 2.2 Add create/update/delete definition commands with exact inverses.
- [x] 2.3 Add create-instance, set-properties, set/reset-override commands with
  exact inverses and honest no-op behavior.
- [x] 2.4 Add detach-instance as one validated transaction with undo/redo coverage.
- [x] 2.5 Assert rejected component mutations preserve canonical bytes and history.

## 3. Pure resolution

- [x] 3.1 Implement pass-through resolution for ordinary page nodes with no
  authored-document mutation.
- [x] 3.2 Implement local instance expansion with deterministic projection ids,
  child order, transforms, visibility, opacity, and provenance.
- [x] 3.3 Apply property patches and sparse overrides using a closed supported
  vocabulary; retain unsupported/orphaned overrides and emit stable diagnostics.
- [x] 3.4 Implement nested instance resolution and reject direct/transitive cycles.
- [x] 3.5 Add deterministic resolution, purity, provenance, propagation, and
  diagnostic tests.

## 4. Projection integration

- [x] 4.1 Add component resolution to the kernel projection without changing the
  authored `getDocument()` result.
- [x] 4.2 Adapt layout and temporary Scene projection to consume resolved nodes while
  mapping selection/editing identity through provenance.
- [x] 4.3 Ensure path, glass, selection, hit testing, and overlays see resolved
  component content without adding product semantics to renderer packets.
- [x] 4.4 Add regression tests proving renderer packets contain no component,
  variant, override, state, or provenance fields.

## 5. Persistence and clipboard

- [x] 5.1 Complete document-native `.ui` persistence prerequisites from
  `crafty-ui-format` before claiming component durability.
- [x] 5.2 Add a loss-list fixture with definitions, instances, nested overrides,
  component surface, locked nodes, path content, and metadata.
- [x] 5.3 Verify save/reload canonical bytes preserve the complete component graph
  without routing through legacy Scene.
- [x] 5.4 Extend clipboard tests for internal definition/surface/instance remapping,
  external-reference policy, and override diagnostics.

## 6. Verification and handoff

- [x] 6.1 Run editor kernel tests, package typecheck, lint, format, and targeted
  scene-renderer projection tests.
- [x] 6.2 Update component, resolution, semantic-surface, persistence, and roadmap
  docs to distinguish current implementation from deferred motion/runtime work.
- [x] 6.3 Run OpenSpec validation and record unresolved risks before implementation
  handoff.
