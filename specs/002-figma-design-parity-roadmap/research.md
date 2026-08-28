# Research: Figma-Level Design Parity Roadmap

## Baseline

crafty already has a DOM-backed component canvas with selection, multi-selection, keyboard movement, edit mode, and corner resize handles. The next risk is maintainability: if every design feature adds bespoke geometry logic inside React components, future Figma-parity work will become difficult to test and reason about.

## Prioritized Feature Groups

1. **Canvas interaction foundation**: selection, box select, keyboard transforms, resize/rotate handles, snap guides, align/distribute.
2. **Layout system**: auto-layout direction/gap/padding/alignment, hug/fill/fixed sizing, min/max constraints, grids/guides.
3. **Components**: instances, variants, overrides, prop binding, nested component properties, reset/detach.
4. **Styles/tokens**: color/text/effect/grid styles, variables, modes, token binding.
5. **Text/vector tools**: rich text, shapes, bezier paths, anchor editing, boolean operations.
6. **Prototype/handoff/collaboration**: interactions, inspect mode, export, comments, versioning, multiplayer.

## Decision

Start with reusable canvas helpers for frame deltas, keyboard movement, and corner-handle resize math. This keeps the first slice small while creating reusable foundations for align/distribute, snapping, constraints, and future tests.

## Open Questions

- Which features graduate from webview-local steering to shared MCP/CLI contracts?
- How should DOM component frames coexist with future vector layers?
- Which component mutations are safe to automate, and which require explicit source-code edit tools?
