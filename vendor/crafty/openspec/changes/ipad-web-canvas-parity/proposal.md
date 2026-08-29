## Why

The iPad host now presents canonical Crafty packets and supports one rectangle,
but the mounted web canvas exposes a much broader editing grammar. Porting those
features as React Native or Swift-owned behavior would create a second editor.
The parity program therefore advances in vertical slices that share reducer,
kernel operation, resolved-document packet projection, persistence format, and
acceptance fixtures with the web canvas.

## What Changes

- Inventory every behavior reachable on the mounted web canvas and track one
  binary iPad acceptance row for it.
- Move any duplicated editing or packet-projection rule to a framework-free
  shared boundary before exposing it on iPad.
- Add iPad input/chrome/accessibility/persistence adapters only after the shared
  operation exists.
- Require canonical bytes, packet evidence, undo/cancel behavior, and physical
  iPad interaction/pixels where a slice claims presentation parity.

This change does not make Swift or React state canonical, add product semantics
to renderer packets, change the document schema, or waive the existing native
renderer S2–S6 evidence gates.

## Capabilities

### New Capabilities

- `editor/ipad-web-canvas-parity`: evidence-tracked behavioral parity between
  the mounted web canvas and the native iPad host over one editor kernel.

## Impact

- `packages/editor/src/kernel/` — shared operations where behavior still lives
  in a web-only adapter.
- `packages/editor/src/rendering/` — framework-free packet projection shared by
  web and native hosts.
- `apps/mobile/src/crafty/` and `apps/mobile/src/components/` — native input and
  chrome adapters.
- `apps/mobile/tests/` — cross-host canonical and packet acceptance evidence.
- `native-ios-renderer-host` remains the renderer viability/evidence change;
  this change owns product behavior parity, not backend selection.
