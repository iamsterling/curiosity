## Why

Crafty already has semantic surface records for target-neutral artboard meaning and
validated records that resemble components, but a component definition cannot yet
be created, resolved, edited through instances, or rendered as a linked reusable
asset. The next foundation must establish the authored definition/instance versus
disposable resolved projection before variants, tokens, runtime states, or motion
are built on top of copied frames.

## What Changes

- Add a pure, renderer-independent component graph validator and resolver.
- Establish local component definitions as linked references to authored template
  subtrees, with deterministic provenance-bearing resolved nodes.
- Add validated, invertible commands for creating definitions and instances,
  changing instance properties, setting/resetting sparse overrides, and detaching.
- Make component-role semantic surfaces an explicit boundary for reusable
  definitions while retaining the current frame/node containment model.
- Resolve local instances, nested instances, and sparse node-property overrides;
  report missing definitions, cycles, invalid properties, and orphan overrides.
- Route the editor projection through the resolved component view without writing
  resolved values into the authored document or renderer packet semantics.
- Preserve component definitions, instances, overrides, and semantic surface
  references through canonical `.ui` persistence and clipboard operations.
- Add deterministic fixtures and invariant tests for resolution purity, provenance,
  propagation, inverse commands, serialization, and clipboard identity remapping.

Explicitly out of scope:

- Cross-file library publishing or remote library fetching.
- Token/theme resolution, data bindings, conditional logic, or responsive rules.
- Structural variant branches beyond the currently declared property patches.
- Runtime component states, prototype connections, navigation, overlay playback,
  or animation evaluation. Those are a follow-on that consumes this foundation.
- React-specific component implementations, code components, or renderer product
  semantics.

## Capabilities

### New Capabilities

- `components/local-resolution`: Linked local definitions and instances with
  validated resolution, provenance, sparse overrides, diagnostics, and detach.

### Modified Capabilities

- `application/semantic-surfaces`: Component-role surfaces may be referenced by
  local component definitions, with validation preserving the distinction between
  semantic surface identity and component definition identity.

## Impact

- `packages/editor/src/kernel/document.ts`, validation, commands, kernel projection,
  clipboard, and a new component-resolution module.
- `packages/editor/src/kernel/scene-adapter.ts` and editor harness projection.
- `.ui` document/store integration and component loss-list fixtures.
- Semantic-surface and component architecture documentation plus an ADR for the
  definition-to-surface ownership decision.
- No new renderer protocol fields, Rust/WASM product semantics, or external runtime
  dependency.
