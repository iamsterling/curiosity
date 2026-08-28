## Why

Crafty's current `frame` node is a useful visual container, but it cannot say whether the surface is a screen, persistent layout, reusable component, or overlay. That confirmed model gap limits agent editing and makes any future code projection infer application structure from pixels. Competitor research shows that frames/boards remain visual containers, while page trees, routes, flows, components, and bindings are separate concepts; Crafty should make that separation explicit now.

## What Changes

- Add an authored, target-neutral semantic surface record associated with eligible frame nodes.
- Support the initial surface roles `freeform`, `screen`, `layout`, `component`, and `overlay`.
- Add semantic primitives for `outlet`, `slot`, and `link` relationships without introducing platform-specific node kinds.
- Add optional route intent to screen surfaces and persistent composition intent to layout surfaces.
- Add explicit target bindings that identify an external projection target without making Next.js, SwiftUI, or another platform the Crafty ontology.
- Add validated, invertible commands for setting, clearing, and updating semantic surface records.
- Preserve authored semantics through canonical document serialization and clipboard/subtree operations.
- Add diagnostics for invalid role relationships, duplicate semantic identifiers, missing references, and unknown semantic versions.
- Add research and architecture documentation recording the competitor synthesis and the rejected framework-first model.

Explicitly out of scope: code generation or repository writes, route execution, prototype playback, component resolution, slot filling, data/state/conditional semantics, responsive overrides, surface-specific layout algorithms, automatic inference from geometry, and changing the renderer packet. These require separate capabilities after the semantic contract is proven.

## Capabilities

### New Capabilities

- `application/semantic-surfaces`: Target-neutral application surfaces, semantic primitives, route/layout intent, bindings, validation, commands, and persistence.

### Modified Capabilities

- None.

## Impact

- `packages/editor/src/kernel/document.ts`: additive authored records and validation. Existing schema compatibility and unknown-version rejection remain required.
- `packages/editor/src/kernel/commands.ts`: validated/invertible surface commands.
- `packages/editor/src/kernel/clipboard.ts`: preserve and validate surface references during subtree copy/paste.
- `packages/editor/src/kernel/*test.ts`: document, command, inverse, canonical serialization, and reference-integrity coverage.
- `docs/research/` and `docs/architecture/research-ledger.md`: competitor evidence and adopted/rejected lessons.
- No renderer, Rust/WASM, Next.js, or external runtime dependency changes in this first slice.
