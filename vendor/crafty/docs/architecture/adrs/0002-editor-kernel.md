# ADR 0002: Renderer-Independent Editor Kernel

Status: Accepted — implemented
Date: 2026-08-05
Implementation status: Implemented in `packages/editor-kernel`; part of its scope still lives in `apps/crafty-web/src/editor/harness.ts`

## Context

The browser component currently owns input, selection, mutations, viewport, and rendering. This causes gesture overlap and makes behavior untestable without mounting React.

## Options Considered

- Keep behavior in the canvas component.
- Put all behavior in Rust/WASM.
- Add a renderer-independent TypeScript kernel with adapters.

## Decision

Use a TypeScript editor kernel for tools, selection, transactions, history, coordinate state, and command validation. React and renderers subscribe or adapt to it.

## Consequences

Interaction tests run without a browser. React rerenders can be narrowed. A compatibility adapter is required while the server still speaks `Scene`.

## Validation

Kernel tests must prove cancelled gestures, semantic history, selection filtering, and tool ownership.
