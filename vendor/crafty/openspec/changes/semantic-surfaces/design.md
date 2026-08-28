## Context

Crafty currently stores a normalized `EditorDocument` with flat `DocumentNode` records and back-linked child lists (`packages/editor/src/kernel/document.ts:124-146`). `frame` is currently only one visual node kind. Layout records already demonstrate the desired direction: authored intent is optional, versioned, validated, and resolved separately from rendering. This change adds application intent using the same boundary, without adding product semantics to Rust or the draw protocol.

## Research Synthesis

Research was conducted against official product documentation on 2026-08-10.

| System | Observed model | Lesson for Crafty |
|---|---|---|
| Figma | Frames are nested visual/layout containers; pages organize work; components and variants provide reuse; prototypes connect destinations. | Keep visual containment, reusable boundaries, and navigation intent as distinct concepts. |
| Sketch | Current documentation replaces legacy Artboards with Frames and Graphics. Frames are nestable interface/layout containers with sizing, pinning, stacks, and scrolling. | “Artboard” is not a sufficient semantic type. Container purpose and layout behavior need separate axes. |
| Penpot | Boards are high-level layers that can act as screens; first-level boards appear in View mode; flows and board connections define prototype entry/navigation. | Screen/presentation behavior belongs in explicit graph metadata, not inferred from top-level geometry. |
| Framer | Web pages define published site structure; CMS pages are generated from collections; design pages remain private canvases; breakpoints and preview are page-aware. | Page, route, generated content, and design workspace are separate concerns. |
| Adobe XD | Artboards are targets for responsive resize, constraints, padding, stacks, symbols, states, and prototype destinations. | Responsive/layout and interaction semantics should be durable but independently versioned. |
| Next.js App Router | Nested layouts persist across navigation and render descendant content through `children`; route segments and filesystem projection are framework concepts. | Crafty should model persistent composition and content outlets, then let adapters project to `layout.tsx` or another target. |

Sources:

- Sketch, “Frames” and “Frames and Graphics: A not-so-short guide”: `https://www.sketch.com/docs/designing/frames/`, `https://www.sketch.com/blog/frames/`
- Penpot, “Layers”, “Prototyping”, and “Testing: View mode”: `https://help.penpot.app/user-guide/designing/layers/`, `https://help.penpot.app/user-guide/prototyping-testing/prototyping/`, `https://help.penpot.app/user-guide/prototyping-testing/testing-view-mode/`
- Framer, “Using pages” and “Adding a layout grid”: `https://www.framer.com/help/articles/how-to-use-pages/`, `https://www.framer.com/help/articles/layout-grids/`
- Adobe, “Best Practices for Designing with Responsive Resize in XD”: `https://blog.adobe.com/en/publish/2018/09/28/how-to-design-with-responsive-resize-xd`
- Next.js, “Layouts and Pages”: `https://nextjs.org/docs/app/building-your-application/routing/layouts-and-pages`

## Goals / Non-Goals

Goals:

- Make application structure authored and target-neutral.
- Preserve the existing visual node model and renderer boundary.
- Provide a minimal semantic vocabulary that agents can address by stable ids.
- Make invalid references, duplicate routes, and unsupported versions loud.
- Prove persistence and inverse-command behavior before adding adapters.

Non-goals:

- Next.js/SwiftUI/Compose code generation or repository synchronization.
- Runtime route matching, navigation execution, or preview playback.
- Component, variant, state, data, conditional, collection, or animation resolution.
- Layout inference, responsive overrides, breakpoint resolution, or new layout algorithms.
- A new node kind for outlets, slots, or links.

## Decisions

### 1. Attach semantics to frames; do not replace `frame`

The visual frame remains the geometry and hierarchy record. An optional `surface` record is attached to the node, similar to `autoLayout`. This preserves existing renderer and hit-test behavior and allows one surface to be projected to several targets.

Rejected: `kind: "screen"` and `kind: "layout"`. Node kinds are schema-versioned geometry vocabulary; using them for product meaning would force renderer, selection, clipboard, and schema changes for every new semantic role.

### 2. Use a document-level semantic registry

Surface records live in `document.surfaces: Record<DocumentId, SemanticSurface>`, keyed by stable surface id, while the surface carries `nodeId`. Relationships live in `document.semanticRelations`, keyed by stable relation id. This avoids unbounded optional fields on every node and makes cross-node references and validation explicit.

Proposed types:

```ts
type SurfaceRole = "freeform" | "screen" | "layout" | "component" | "overlay";
interface SemanticSurface {
  id: DocumentId;
  nodeId: DocumentId;
  role: SurfaceRole;
  behaviorVersion: 1;
  route?: { id: DocumentId; path: string };
  binding?: { target: "nextjs" | "swiftui" | "compose" | "custom"; reference: string };
}
type SemanticRelationKind = "outlet" | "slot" | "link";
interface SemanticRelation {
  id: DocumentId;
  kind: SemanticRelationKind;
  sourceNodeId: DocumentId;
  targetSurfaceId?: DocumentId;
  targetNodeId?: DocumentId;
  name?: string;
}
```

The implementation may refine names while preserving these observable properties. Exactly one target field is required by relation kind: outlet/slot target a node, link targets a surface.

Rejected: arbitrary `metadata` JSON. Existing metadata is intentionally untyped and cannot provide reliable agent operations, reference validation, or stable diagnostics.

### 3. Make bindings references, not ownership

Bindings identify a target family and opaque target reference. They do not contain generated source, file contents, or framework-specific semantics. A future adapter owns translation and reports lossiness.

Rejected: `nextLayoutFile`, `nextRoute`, or `framework` fields on surfaces. Those fields would make the Next.js filesystem the ontology and make native projections second-class.

### 4. Additive schema evolution with a migration

Because `EditorDocument` is schema v3 and the new registry changes the document shape, the implementation will add schema v4 and a v3-to-v4 migration that initializes empty semantic registries. v1-v3 readers continue to reject newer documents; unknown versions remain rejected. Existing commands must populate empty registries when operating on migrated documents.

### 5. Keep first implementation kernel-only

The first vertical slice is document types, validation, commands, canonical serialization, and clipboard consistency. No React inspector is required for acceptance. This follows Crafty’s testing rule that semantic behavior belongs in the kernel.

## Validation Rules

- A surface id is unique and maps to an existing `frame` node; a node has at most one surface.
- Surface role and behavior version are known.
- Route ids and paths are unique within a document; paths are normalized absolute patterns and reject query/hash fragments.
- Bindings have known target families, non-empty references, and no unknown keys.
- Relations have unique ids, known kinds, existing source nodes, and valid target shape.
- `outlet` and `slot` target nodes; `link` targets a `screen` surface.
- Relations may not create a semantic self-cycle through outlet/slot containment in this first version.
- Deleting a node or surface cannot leave dangling semantic records; commands either remove owned records as part of an explicit subtree operation or reject the operation.

## Failure Policy

Validation returns stable diagnostic codes. Commands throw the established machine-readable error code at the kernel boundary and return exact inverse commands on success. Semantic records never enter renderer packets. If a future adapter cannot resolve a binding, it reports the binding diagnostic and leaves authored semantics untouched.

## Migration / Rollback

V3 documents migrate by adding empty `surfaces` and `semanticRelations` registries. Existing authored geometry is unchanged. Disabling the feature means ignoring empty/known registries at UI and adapter boundaries; no resolved geometry is persisted. A schema migration is required because these are document-level durable fields, and rollback must preserve files rather than silently strip them.

## Verification

- Validation tests cover role/version/reference/route/relation constraints and v3 migration.
- Command tests cover create/update/clear, no-op `changed`, exact inverse, and history behavior.
- Canonical serialization tests prove deterministic round trips.
- Clipboard tests prove internal id reminting and external-reference diagnostics.
- A fixture documents a dashboard layout with root layout, outlet, home/settings screens, route links, and a Next.js binding, while asserting no framework name enters the surface role.
