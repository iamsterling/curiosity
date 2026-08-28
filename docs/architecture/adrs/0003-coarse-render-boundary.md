# ADR 0003: Coarse WASM Render Protocol

Status: Accepted — implemented
Date: 2026-08-05
Implementation status: Protocol v2 with changed-node batches shipped; the JSON transport remains transitional

## Context

Calling WASM once per shape or property would make synchronization overhead proportional to scene complexity and would bind editor semantics to GPU code.

## Options Considered

- Per-node calls.
- Full JSON scene on every frame.
- Coarse versioned packet with a measured incremental extension.

## Decision

Use a coarse versioned resolved-scene packet. Rust/WASM encodes deterministic render packets; TypeScript owns WebGPU resources. Add changed-node batches only after benchmarks show full snapshots are the bottleneck.

## Consequences

The first proof stays simple and headless-friendly. Large documents require retained packets, revision checks, and cache keys in the next renderer bolt.

## Validation

Protocol version tests, stale revision tests, render-packet determinism, device-loss tests, and stress fixtures.
