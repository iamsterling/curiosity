## Why

Crafty currently has a strong point-and-handle model for `path` nodes, but
rectangles, ellipses, lines, frames, text, and images still enter the document
as specialized bounds-first records. That split prevents a consistent design
workflow: selecting an object edits its object-level properties, while entering
edit mode should expose the same stable points and tangent handles for precise
geometry work regardless of how the object was created.

The point model and commands already exist for paths, including stable point
identity, corner/free/asymmetric/mirrored handle intent, point selection, and
invertible point mutations. This change extends that foundation instead of
creating a second geometry system.

## What Changes

- Define canonical point geometry for every canvas node that can be placed,
  including rectangles, ellipses, lines, frames, text, and images.
- Make creation tools author point-backed geometry at creation time; rectangle
  creation, for example, produces four stable corner points.
- Preserve object selection as object-level editing, while double-click or
  Enter on a selected object enters point-edit mode for that object.
- Add point-edit mode state, transitions, hit testing, selection, and overlays
  for anchors and tangent handles.
- Make corner points sharp by default and support explicit handle modes for
  smooth or independently controlled points.
- Route point movement, handle movement, point insertion/deletion, and point
  type changes through validated, invertible kernel commands and transactions.
- Resolve point-backed geometry to renderer-neutral geometry without leaking
  editor semantics into Rust/WASM.
- Migrate existing bounds-first nodes into canonical point geometry without
  changing their visual placement or stable node identity.
- Keep text content, image sources, fills, strokes, and other appearance data as
  node properties; point geometry controls placement and editable outline, not
  text glyph semantics or image pixel content.

## Capabilities

### New Capabilities

- `universal-point-editing`: Canonical point geometry and object-to-point edit
  mode for every placeable canvas node.

### Modified Capabilities

None.

## Impact

- `packages/editor/src/kernel/document.ts`: schema, validation, migration, and
  geometry types.
- `packages/editor/src/kernel/path-geometry.ts`: shared point and handle math,
  including shape conversion and derived geometry.
- `packages/editor/src/kernel/commands.ts` and `kernel.ts`: point commands,
  transactions, selection, and history.
- `packages/editor/src/kernel/interaction.ts` and `ui/editor/harness.ts`:
  object selection versus point-edit interaction routing.
- `packages/editor/src/ui/editor/editing-overlays.ts`: anchor and handle
  visualization.
- `packages/scene-renderer/src/draw-protocol.ts` and Rust encoding: resolved
  point geometry rendering, with no product semantics in the packet.
- Clipboard, persistence, imports, fixtures, and tests require migration and
  round-trip coverage.

Explicitly out of scope: vector-network topology with vertices shared by more
than two segments, boolean shape editing UX, text glyph outline editing,
image-content warping, collaboration merge policy, and a full Figma-compatible
property panel.
