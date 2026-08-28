# Data Model: Canvas Platform Foundation (Schema v2)

Extends `EditorDocument` v1 (`packages/editor-kernel/src/document.ts`). Schema v2 is additive and migration-validated; the legacy `Scene` v1 model is never extended (D10). Authored records stay durable and renderer-independent; resolved values are disposable render inputs.

## Page Model (v2)

- `PageCanvas` replaces the sized page root as the interaction boundary: unbounded world coordinates, page-local `rest` viewport (durable camera), and ordered `GuideRecord[]`.
- Pages remain ordered (`pageOrder`); `currentPageId` is session state, not authored data.
- Page CRUD/reorder commands: `create-page`, `delete-page`, `reorder-page`, `set-page`, `set-page-viewport`.
- Undo/redo entries carry `pageId` and restore page context (switch + touched selection).
- Migration registry: `v1 → v2` per-step validation with diagnostics; corrupt input aborts load and preserves the previous valid document.

```ts
interface PageCanvasV2 {
  id: string;
  name: string;
  rest: ViewportRest;            // durable camera: pan, zoom (gesture camera never serialized)
  grid: GridDescriptor;          // page-authored, never required for rendering
  rulers: RulerSettings;
  guides: GuideRecord[];         // authored records; magnet guides stay ephemeral overlays
  rootId: string;                // unbounded content root for interaction
  selection?: string[];          // per-page selection (session projection, not authored)
}

interface ViewportRest { panX: number; panY: number; zoom: number }

interface GridDescriptor {
  mode: "lines" | "dots";        // default ratified in plan (lines 8/5 reference)
  majorSpacing: number;          // world units
  minorStep: number;             // subdivisions of major
  originX: number; originY: number;  // anchor-stable grid origin
}

interface RulerSettings { showRulers: boolean; unit: "px" | "pt" | "cm" | "in" }

interface GuideRecord { id: string; axis: "x" | "y"; position: number; visible: boolean }

interface SnapSettings { grid: boolean; guides: boolean; objects: boolean; pixel: boolean }
```

## Node Model Additions (v2)

- Frames: `clipContent: boolean` on frame nodes; frame-aware hit testing; resolution clips children to frame bounds.
- Layout/constraints records (reserved for S6): `LayoutRecord` / `ConstraintRecord` are authored records; auto-layout children reject direct `set-bounds` (derived-bounds invariant).
- Vector/image payloads and a content-addressed asset registry are placeholder records (S7) — never renderer-owned handles in the authored doc.
- Components/variants/tokens remain v1 records; token paint bindings are authored as bindings, never resolved values (S7).
- Clipboard is an ephemeral kernel record with a serializable payload: `ClipboardContent` mints IDs on paste with `overridePath` remap and post-paste validation diagnostics (S5).

## Command Vocabulary Additions (v2)

`create-page`, `delete-page`, `reorder-page`, `set-page`, `set-page-viewport`, `set-page-grid`, `set-ruler-settings`, `add-guide`, `move-guide`, `remove-guide`, `set-snap-settings`, `move-subtree` (cross-page), `clipboard-copy`, `clipboard-paste`, `set-selection` (multi), `mark`/`bail` (history marks, S8).

All commands are validated by the single shared validator; pointer-down never mutates durable state (D7).

## Migration

- Legacy `Scene` → adapter → document v1 → migrate → v2: canonical string stable; per-step validation; round-trip fixtures in the test matrix (#5).
- Nothing new expands the legacy model; adapter removal is a later slice (W8) after the server API speaks document v1.
