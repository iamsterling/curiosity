## Why

Crafty's current LayersPanel is a legacy `Scene`-layer consumer. It can display
visual containment, but it cannot communicate the semantic surfaces and linked
component definitions/instances that are becoming the product's foundation. Its
interaction model also hides actions on hover, prevents drops into empty
containers, duplicates drag behavior with reorder buttons, and leaves isolation
as unused kernel state.

## What Changes

- Replace the legacy `Layer[]` panel input with a kernel-owned,
  renderer-independent structure projection.
- Keep authored containment as the primary tree while displaying semantic surface
  roles, component-instance links, override status, provenance, and diagnostics
  as metadata rather than fake visual children.
- Add Structure views for containment, semantic meaning, and local component
  definitions/assets without duplicating the authored hierarchy.
- Add component-aware selection boundaries, source/instance actions, and explicit
  isolation breadcrumbs.
- Replace implicit whole-row drag heuristics and reorder-arrow noise with legal
  kernel-computed destinations, visible drop indicators, and keyboard/context-menu
  move alternatives.
- Make the panel accessible as a real tree with keyboard navigation, named actions,
  focus-visible controls, and mobile-safe touch targets.
- Retire the legacy Story-based States panel from the component-facing information
  architecture; state inspection belongs to the future component/state model.

Explicitly out of scope:

- Implementing component resolution itself; this change consumes its projection
  contract from `component-resolution-foundation`.
- Cross-file libraries, publishing, token browsers, or runtime prototype playback.
- A second artboard/frame hierarchy or new visual node kinds.
- React-owned selection, isolation, hierarchy, or document mutation state.

## Capabilities

### New Capabilities

- `editor/structure-panel`: Kernel-projected authored hierarchy with semantic,
  component, provenance, isolation, accessibility, and responsive panel behavior.

### Modified Capabilities

- `components/local-resolution`: The structure panel consumes linked-definition,
  instance, override, provenance, and diagnostic projections without mutating the
  resolved view.

## Impact

- `packages/editor/src/ui/editor-primitives/layers-panel.tsx` and its selectors.
- `EditorProjection`/kernel-facing structure projection and isolation helpers.
- Authored hierarchy move/selection façade and component action entry points.
- Removal or relabeling of the legacy `StatesPanel` composition.
- Editor shell CSS and mobile/focus behavior.
- Kernel-first tests plus a small browser/accessibility smoke suite when browser
  infrastructure is available.
