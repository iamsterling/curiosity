# ADR 0013: Taffy Behind a Versioned Layout Resolution Boundary

Status: Accepted — implemented (foundation)
Date: 2026-08-09

## Context

Crafty had no layout stage: `DocumentNode.bounds` was the only geometric input
and parent resizing never reflowed children (`layout.md`). ADR 0005 already
requires authored layout intent to resolve before rendering without writing
computed boxes back into the document. The competitive study in
`docs/research/layout-competitive-landscape.md` found that design tools converged
on declared flex-family flow and that Rust consumers converged on Taffy.

The easy answers are both wrong: product layout inside the renderer violates the
renderer boundary, while a new hand-written TypeScript flex algorithm would
duplicate browser-grade intrinsic, wrapping, and min/max behavior. Per-node
JS/WASM calls would also make the boundary dominate small interactive layouts.

## Constraints

- The TypeScript kernel remains canonical and owns validation, commands, and
  history.
- Layout results are disposable and never overwrite authored bounds.
- The evaluator receives a Crafty-owned, versioned IR—not an editor document or
  renderer packet—and is called once per subtree.
- Unknown document or IR behavior versions are rejected.
- Failure preserves authored state and the last valid resolved result.
- Headless Rust and TypeScript tests must exercise the same contract.

## Options Considered

- **Owned TypeScript flex engine.** Local and easy to iterate, but rejected: it
  creates a second standards implementation precisely where intrinsic sizing,
  wrap, and grid make implementations expensive to reconcile.
- **Yoga WASM.** Proven flex evaluator, but rejected as the primary engine:
  flex-only scope creates a likely migration when grid becomes authored.
- **Taffy inside the renderer.** Reuses the existing binary, but rejected as an
  ownership model: renderers must consume resolved geometry, not product intent.
- **Taffy behind a layout IR.** Chosen. The evaluator is currently co-packaged in
  the existing Rust/WASM artifact to reuse the locked toolchain, but lives in an
  isolated module and free function; package extraction is mechanical if a
  second host needs independent loading.

## Decision

Pin Taffy `=0.13.0` with only `std`, `taffy_tree`, `flexbox`, and
`content_size`. crates.io reports MIT licensing and Rust 1.71 minimum. Registry
evidence measured on 2026-08-09: the compressed crate is 200 KiB and expanded
source is 1.2 MiB. Shipped WASM delta is recorded by the build close-out rather
than inferred from source size.

The version-1 JSON IR carries normalized tree geometry, flow/absolute
participation, Fixed/Hug/Fill adaptation, constraints, and container style. One
call returns an id-keyed box batch plus diagnostic codes. TypeScript validates
both sides. `LastValidLayoutResolver` retains the prior valid batch on evaluator
failure. Native Crafty layout behavior is versioned independently from the
document schema.

This decision does not add grid authoring, translation, inference, foreign
custom layouts, interaction semantics, animation, or partial invalidation.

## Consequences

Flex correctness and a future grid path build on a maintained engine. The WASM
contract and authored schema remain Crafty-owned. The existing module gains a
non-render export, so naming is temporarily broader than package ownership; no
kernel import points at the renderer package, because the evaluator is injected.

## Risks

Taffy upgrades could change geometry; behavior versions and frozen conformance
fixtures expose that. Boundary serialization may become measurable interaction
cost; no worker/shared-memory change is justified without a recorded fixture.

## Validation

Rust tests prove deterministic evaluation and placement. Kernel tests prove
validation, inverse commands, disposable output, contract checking, and
last-valid preservation. Browser-reference fixtures compare geometry at several
container sizes; tolerances require measured evidence.

## Revisit When

Extract a standalone layout WASM package when another consumer needs to load it
without rendering, or when a measured artifact/load cost shows co-packaging is
material. Revisit the engine only if an authored semantic cannot be represented
without persistent Taffy-specific leakage or frozen conformance fixtures cannot
be preserved across supported behavior versions.
