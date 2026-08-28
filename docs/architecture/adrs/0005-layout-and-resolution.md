# ADR 0005: Deterministic Resolution Before Rendering

Status: Accepted — not yet implemented
Date: 2026-08-05
Implementation status: No resolution pipeline exists; see `../scene-resolution.md`

## Context

Components, tokens, constraints, layout, states, and animation are authored semantics. Making the renderer understand all of them would duplicate product logic across backends.

## Options Considered

- Resolve everything in the WebGPU renderer.
- Resolve everything in React.
- Use a renderer-independent resolution pipeline with backend packets.

## Decision

Resolve references, components, tokens, layout, state, animation, world transforms, and visibility before packet generation. Start in TypeScript with deterministic tests; move measured hot paths to Rust or workers.

## Consequences

Headless export and multiple renderers share semantics. Resolution snapshots require revision and stale-result handling.

## Validation

Deterministic resolution fixtures, component/state matrix tests, layout invariants, and viewport/export parity.
