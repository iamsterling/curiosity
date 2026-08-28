# Data Model: Figma-Level Design Parity Roadmap

## CanvasNodeFrame

Existing webview-local frame model for DOM-backed story surfaces.

- `id`: stable canvas node id
- `storyId`: backing Storybook/story target
- `x`, `y`, `width`, `height`: world-coordinate frame geometry
- `layout`: local layout intent
- `style`: local visual shell styling

## CanvasCornerHandle

Webview-local edit handle id used for frame resizing.

- `top-left`
- `top-right`
- `bottom-left`
- `bottom-right`

## CanvasDelta

Reusable `{ x, y }` world-coordinate delta used by keyboard movement and pointer interactions.

## CanvasFramePatch

Geometry patch produced by frame helpers.

- `x`, `y`: updated world position
- `width`, `height`: updated dimensions, clamped to minimum size

## Future Models

- `SelectionBounds`: aggregate bounds for multi-select transforms.
- `LayoutGuide`: ruler/grid/snap guide primitives.
- `DesignTokenBinding`: typed link between design variables and component/source properties.
- `VectorNode`: separate path/anchor model for future vector editing.
