## 1. Projection contract

- [x] 1.1 Add `StructureProjection`, row metadata, provenance references, isolation
  metadata, and stable diagnostic types at the editor boundary.
- [x] 1.2 Build and cache authored containment projection from document `parentId` /
  `childIds`, not legacy `Scene` layers.
- [ ] 1.3 Add semantic surface badges, relation summaries, component-instance
  metadata, and definition registry rows without duplicating visual children.
- [ ] 1.4 Add resolved-row read-only/provenance policy and stable selectors.

## 2. Kernel/editor interaction seams

- [x] 2.1 Make isolation entry/exit and scoped selection available through the
  kernel/editor façade; keep isolation ephemeral and out of serialization/history.
- [x] 2.2 Compute legal authored drop destinations in the kernel/editor boundary,
  including empty containers, cycle rejection, and isolation scope.
- [ ] 2.3 Ensure same-parent reorder and cross-parent reparent remain one validated
  transaction with exact inverse and selection preservation.
- [x] 2.4 Add component source, reset-overrides, and detach façade actions that call
  component-resolution commands rather than mutating panel state.
- [ ] 2.5 Add kernel tests for isolation, empty-container drops, invalid moves,
  selection mapping, and one-entry undo.

## 3. Structure panel UI

- [x] 3.1 Replace `projection.frame.layers` and `@crafty/scene-model` imports in
  `LayersPanel` with the structure projection selectors.
- [x] 3.2 Rename the panel to Structure and add Containment, Meaning, and
  Components views without creating duplicate hierarchy ownership.
- [ ] 3.3 Implement row anatomy for type glyphs, role/component badges, provenance,
  override counts, diagnostics, visibility, lock, rename, and selection.
- [ ] 3.4 Replace reorder arrows and horizontal drop heuristics with explicit drag
  grips, kernel destinations, insertion indicators, and keyboard/context actions.
- [ ] 3.5 Add isolation breadcrumb, component source/instance actions, and a
  read-only resolved-descendant presentation.
- [x] 3.6 Remove or relabel the legacy Story-based States panel from the editor shell.

## 4. Accessibility and responsive language

- [x] 4.1 Implement tree/treeitem semantics, roving focus, keyboard navigation,
  expanded/selected announcements, and stateful action labels.
- [x] 4.2 Ensure actions are usable without hover and drag has keyboard alternatives.
- [x] 4.3 Update desktop panel sizing, independent scrolling, focus treatment, and
  semantic badges to match the current editor chrome language.
- [x] 4.4 Add mobile Sheet behavior, shallow-tree defaults, overflow actions, and
  touch-sized controls without horizontal overflow.

## 5. Verification

- [x] 5.1 Add kernel/selector tests for authored ordering, semantic metadata,
  component links, provenance, diagnostics, and projection stability.
- [x] 5.2 Add interaction tests for selection, rename, visibility/lock, isolation,
  drag/reparent, invalid drops, and undo/redo.
- [ ] 5.3 Add browser/accessibility smoke tests for tree semantics, focus, hydration,
  panel open/close, and narrow viewport behavior when browser infrastructure is
  available.
- [x] 5.4 Run editor tests, typecheck, lint, format, editor-web build, and strict
  OpenSpec validation.
