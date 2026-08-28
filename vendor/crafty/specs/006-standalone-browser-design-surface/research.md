# Research: Penpot Substrate

## Sources

- https://github.com/penpot/penpot/blob/main/frontend/src/app/main/ui/workspace.cljs
- https://github.com/penpot/penpot/blob/main/frontend/src/app/main/render.cljs
- https://github.com/penpot/penpot/blob/main/common/src/app/common/geom/shapes.cljc

## Findings

- Penpot separates the workspace viewport from the sidebars and palettes. The viewport owns the visible work area while surrounding UI remains an overlay/sibling surface.
- Penpot keeps page objects in design coordinates and derives bounds, selection rectangles, and transformed geometry through shared geometry helpers. Zoom is a viewport concern, not a mutation of object dimensions.
- Rendering is driven from a shape tree and a viewbox. Object geometry and viewport presentation remain separate so selection, export, and rendering can use the same source geometry.
- Transforms are explicit geometry operations. A rectangle renderer must not approximate a rotated rectangle by transforming only its top-left and bottom-right points.
- Penpot supports multiple shape types and a shape tree, but the first Crafty slice should stay bounded to visual rectangle/text/image placeholders and direct manipulation.

## Crafty Decisions

- Remove camera rotation/tilt from the first 2D substrate. Pan and zoom are the only viewport transforms until oriented geometry is implemented properly.
- Treat scene layer bounds as world-space authority. Zoom and pan must never modify stored bounds.
- Add drag-to-draw as the first authoring gesture. Drawing an empty area creates a visual rectangle representation; it does not create or execute a real component.
- Keep a draft rectangle separate from persisted scene state until pointer release and minimum-size validation succeed.
