## Context

The current `LayersPanel` consumes `projection.frame.layers` from the transitional
`Scene` model and re-derives parent/index information recursively inside React.
The document model now has semantic surfaces and component registries, while the
component-resolution change will add derived nodes with provenance. The panel must
become a projection consumer, not a second editor kernel.

## Structure projection

Add a cached projection contract near the kernel/editor boundary:

```ts
interface StructureProjection {
  pageId: DocumentId;
  roots: StructureRow[];
  definitions: ComponentDefinitionRow[];
  isolation: { rootId?: DocumentId; ancestry: DocumentId[]; canExit: boolean };
  diagnostics: StructureDiagnostic[];
  revision: number;
}

interface StructureRow {
  rowId: string;
  authoredId?: DocumentId;
  parentAuthoredId: DocumentId | null;
  name: string;
  kind: NodeKind | "component-definition" | "diagnostic";
  children: StructureRow[];
  visible: boolean;
  locked: boolean;
  selectable: boolean;
  draggable: boolean;
  canContain: boolean;
  surface?: { id: DocumentId; role: SurfaceRole; route?: string };
  component?: { definitionId: DocumentId; name: string; overrideCount: number; status: string };
  provenance?: ResolvedProvenance;
}
```

Authored rows use authored ids as row ids. Resolved rows use deterministic
projection ids and are read-only unless provenance maps to an explicit supported
authored operation. Component definitions are shown in a separate registry view;
they are not duplicated into every page tree.

## Information architecture

The existing panel becomes **Structure**, with three lightweight views:

- **Containment:** authored active-page hierarchy; default.
- **Meaning:** semantic surfaces and relations grouped by role, each pointing back
  to its frame/node.
- **Components:** local definitions and linked instances, with source/override/
  diagnostic metadata.

Pages remain the document navigation surface. Assets can initially be a Components
view rather than another top-level panel. The legacy Story-based States panel is
removed from this composition or relabeled as legacy snapshots until component
states exist.

## Row and interaction model

Rows contain drag grip, disclosure, type glyph, name, semantic/component badges,
and visibility/lock actions. Reorder arrows are removed. Drag destinations are
computed from the authored hierarchy and isolation scope; empty frames are legal
containers. The same destination command is exposed through a keyboard/context
menu action.

Selection, isolation, rename, visibility, lock, reparent, detach, and reset
overrides all call the editor façade/kernel. React owns only collapsed ids, rename
draft, active view, search query, and drop indicator.

## Accessibility and responsive behavior

Use `role="tree"` and `role="treeitem"` with `aria-level`, `aria-setsize`,
`aria-posinset`, `aria-expanded`, and `aria-selected`. Use roving tabindex or
`aria-activedescendant`. Every icon action has a stateful accessible name. Drag
operations have keyboard alternatives. Selected/focused rows retain actions even
when hover is unavailable.

On desktop, retain the floating panel language but allow enough width for
component metadata and keep the tree independently scrollable. On mobile, use the
existing Sheet boundary, a shallow default tree, and an overflow action surface
with touch-sized controls.

## Integration sequence

1. Build a pure structure projection over authored document, semantic registries,
   component records, resolved projection, and isolation state.
2. Add stable selectors and expose the projection on `EditorProjection`.
3. Add kernel/editor isolation and legal drop helpers, including empty containers.
4. Replace the `Layer[]` panel implementation with the Structure projection.
5. Add semantic/component views and source/instance actions as the resolver lands.
6. Remove legacy Story state composition and add accessible keyboard interactions.
7. Add browser smoke coverage only for DOM, focus, responsive sheet, and hydration;
   keep mutation semantics in kernel tests.

## Non-goals

The panel will not resolve components itself, write resolved values, infer surfaces
from geometry, or create framework-specific artboard types. It will not introduce a
second tree identity or a renderer protocol change.
