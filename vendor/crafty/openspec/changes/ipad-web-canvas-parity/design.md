## Context

The web and iPad hosts already consume the same `EditorDocument`,
`EditorKernel`, interaction reducer, render packet, Rust encoder, and `.ui`
codec. Remaining gaps are mostly web-harness semantics, missing native adapters,
or capabilities whose shared product contract is not yet ratified.

## Decisions

### One vertical-slice path

Every parity slice follows:

```
platform input
  → transitionInteraction
  → shared kernel operation / validated commands
  → resolved document
  → @crafty/editor/rendering packet projection
  → RenderFrame
  → Rust/Vello/wgpu
  → WebGPU (web) or Metal (iPad)
```

Platform code may translate events, lifecycle, accessibility actions, and
presentation state. It may not construct an alternate authored shape model or
reinterpret hierarchy, selection, geometry, history, or path semantics.

### Parity means behavior plus evidence

A unit-test-only port is not complete. Each row needs the applicable evidence:

1. reducer/tool-vocabulary behavior;
2. canonical document bytes and one-entry undo/redo;
3. byte-identical cancellation;
4. shared packet structure/fingerprint;
5. physical-iPad interaction and pixels for visible behavior;
6. save/relaunch when the behavior authors durable state;
7. named accessibility operation when a gesture is not the only route.

### Web defects are gates, not native inventions

Confirmed shared defects (for example open-path stroke realization) block a
visual parity claim. They are repaired once at the shared schema/projection/
packet boundary under their own design decision when required; native-only
fallback geometry is prohibited.

## First slice: basic creation

Rectangle, ellipse, line, and frame release effects call
`EditorKernel.createShape` with world-space geometry and a gesture-start style
snapshot. The operation owns node/path construction, node-qualified point IDs,
frame absorption/rebasing, selection, and one history entry. The web harness and
iPad adapter both call it.

Resolved path/text/compound/glass packet projection lives in the framework-free
`@crafty/editor/rendering` subpath. This removes the previous web-harness-only
path channel and lets native frames carry ellipse/line path commands without
duplicating renderer semantics.

## Deferred decisions

- Line/Pen visible stroke parity remains behind the fill/stroke packet gate.
- Native snapping needs the existing kernel snap service wired with accepted
  native grid/guide/object context; no reduced snap algorithm is allowed.
- Text editing, assets, collaboration, large-page accessibility, and 3D retain
  the gates in `apps/mobile/design/CRAFT-IPAD-FEATURE-TRANSLATION.md`.
