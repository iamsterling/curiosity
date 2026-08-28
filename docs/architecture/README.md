# Crafty Architecture Documentation

This directory is Crafty's engineering memory. It exists so that a change to the
editor, the document model, or the renderer starts from what is actually true in
the repository rather than from rediscovery.

Start at the root [`AGENTS.md`](../../AGENTS.md) for the short version. Come here
for the subsystem you are about to change.

## Status vocabulary

Every claim in this directory carries one of these labels. Documents that
describe a planned subsystem say so in the first paragraph.

| Label | Meaning |
|---|---|
| **Current** | Implemented and covered by tests in this repository. Cited by path. |
| **Transitional** | Implemented, but deliberately temporary. There is a named successor. |
| **Target** | Agreed direction. Not implemented. Do not describe it as existing. |
| **Proposed** | A recommendation from this documentation pass. Not yet ratified by an ADR. |
| **Deferred** | Deliberately not being worked on. The reason is recorded. |
| **Unknown** | We do not know. Measuring or deciding is itself the work. |

## Map

### Ground truth

- [`current-state.md`](current-state.md) — what exists today, by path, with the
  real data flow in both directions and the honest gap list. **Read this first.**
- [`invariants.md`](invariants.md) — the rules the system actually enforces,
  each tied to the code that enforces it and the test that proves it.
- [`legacy-and-cleanup.md`](legacy-and-cleanup.md) — the AI-DLC removal inventory
  and the record of the retired block-compiler lineage.
- [`interaction-conformance.md`](interaction-conformance.md) — the canonical
  canvas-action surface scored against this codebase, and the dozen substrate
  gaps that gate it, ranked by rows unlocked.

### The editing substrate

- [`document-model.md`](document-model.md) — `EditorDocument` v3: nodes, pages,
  identity, hierarchy, path geometry, validation, migration.
- [`editor.md`](editor.md) — kernel state, commands, transactions,
  history, clipboard. What belongs in the kernel and what does not.
- [`input-and-tools.md`](input-and-tools.md) — the interaction state machine,
  tool effect vocabularies, gesture arbitration.
- [`coordinate-systems.md`](coordinate-systems.md) — the coordinate spaces, the
  authoritative transforms, and the current duplication.
- [`selection-and-hit-testing.md`](selection-and-hit-testing.md) — the spatial
  index, hit resolution, selection semantics.

### Rendering

- [`scene-resolution.md`](scene-resolution.md) — the authored → resolved → packet
  pipeline. Mostly target; the current shortcut is documented honestly.
- [`renderer.md`](renderer.md) — the draw protocol, the module-owned Vello wgpu
  path (device, surface, render, present), overlays in the scene, and failure
  policy.
- [`wasm-boundary.md`](wasm-boundary.md) — what Rust owns, what TypeScript owns,
  and why the boundary is coarse.
- [`renderer-build.md`](renderer-build.md) — how the Rust/WASM module is built,
  profiled, packaged and served; the measured release profile, artifact
  baseline, reproducibility pins, upgrade procedure, and the supported alpha
  runtime.
- [`react-boundary.md`](react-boundary.md) — the server/client split, the
  external store, sliced subscriptions, and the rAF render loop.

### Not yet built

- [`layout.md`](layout.md) — constraints and auto layout. **Target only.**
- [`typography.md`](typography.md) — text as a real subsystem. **Target only.**
- [`components-and-design-systems.md`](components-and-design-systems.md) —
  components, instances, variants, states, tokens, cross-file libraries.
  Records exist; resolution does not.
- [`animation.md`](animation.md) — interaction and motion semantics. **Target.**

### Cross-cutting

- [`persistence.md`](persistence.md) — files, slugs, storage, and the revision model.
- [`agent-editing.md`](agent-editing.md) — how agents mutate documents safely.
- [`performance.md`](performance.md) — what is measured, what is not, and how to
  measure before inventing a budget.
- [`testing.md`](testing.md) — which behaviours deserve which kind of test.
- [`roadmap.md`](roadmap.md) — sequenced direction and the open decisions.
- [`research-ledger.md`](research-ledger.md) — external systems studied, what was
  adopted, adapted, rejected, or deferred, and the licensing position.
- [`adrs/`](adrs/) — architectural decision records and the template.

## Related directories

- [`../research/`](../research/) — long-form primary-source research reports
  (competitor capability matrix, WebGPU/TypeGPU, Rust/WASM boundary, document
  and grid models, pen.dev format). These are dated investigations, not doctrine.
  The research ledger summarises what Crafty took from them.
- [`../adr/`](../adr/) — four ADRs belonging to the retired block-compiler
  product lineage. Historical; see [`legacy-and-cleanup.md`](legacy-and-cleanup.md)
  and [ADR 0016](adrs/0016-block-compiler-lineage-retirement.md).
- [`../operator-workflows.md`](../operator-workflows.md) — how to run and package Crafty.
- [`../../specs/`](../../specs/) — per-feature specs. Useful for intent
  archaeology; not a description of current architecture.

## Keeping this honest

Update a document here when the code changes, not when a plan changes. If you
find a claim in this directory that the code contradicts, the document is wrong —
fix it in the same change that taught you. A document that describes an intention
as a fact is worse than no document.
