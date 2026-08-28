## 1. Ratify the boundary and dependency

- [x] 1.1 Write ADR 0013 covering the Crafty-owned IR, Taffy adoption, license and measured size evidence, coarse WASM boundary, behavior versioning, failure policy, and rejected alternatives
- [x] 1.2 Update the research ledger with the competitive synthesis and mark each adopted, adapted, rejected, or deferred lesson
- [x] 1.3 Reconcile `layout.md`, `scene-resolution.md`, and `roadmap.md` with the ratified decision while preserving Current/Target labels

## 2. Add authored records and commands

- [x] 2.1 Add optional flow-container intent, per-axis sizing/min/max, flow/absolute participation, and layout behavior model/version under `packages/editor/src/kernel/`
- [x] 2.2 Validate every authored field, reject unknown behavior versions, and return stable invalid/unsupported diagnostic codes
- [x] 2.3 Add validated set/clear commands with exact inverses, honest changed-node reporting, and one history entry each
- [x] 2.4 Add command, inverse, validation, canonical serialization, unknown-version, and legacy-document compatibility tests

## 3. Establish the layout IR and core

- [x] 3.1 Define and test a versioned Crafty layout input/result contract independent of both the document schema and render packet
- [x] 3.2 Add the renderer-independent Rust/WASM layout core and pin Taffy according to ADR 0013
- [x] 3.3 Implement whole-subtree adaptation into one coarse call and batch resolved boxes, diagnostics, and measurement dependencies back to TypeScript
- [x] 3.4 Validate core output and preserve the last valid resolved result on evaluator failure
- [x] 3.5 Add deterministic Rust and TypeScript boundary tests, including nested flow, wrap, min/max, absolute participation, and repeated byte-identical evaluation

## 4. Add intrinsic measurement and conformance

- [x] 4.1 Define deterministic intrinsic measurement requests, responses, cache keys, and the authored-bounds diagnostic fallback
- [x] 4.2 Add table-driven fixtures covering the complete authored subset and multiple containing sizes
- [x] 4.3 Add a browser-reference fixture generator for supported CSS-equivalent behavior and commit its environment metadata and generated expectations
- [x] 4.4 Compare Crafty geometry with browser-reference geometry using evidence-based fixture rules; add regression cases for every discovered deviation

## 5. Wire resolved layout into the editor

- [x] 5.1 Integrate resolved boxes into scene resolution without writing them back to authored bounds
- [x] 5.2 Make scene projection, hit testing, selection, and inspector projections consume the same resolved boxes
- [x] 5.3 Add leaf inspector controls for the supported authored vocabulary, dispatching kernel commands without introducing container chrome components
- [x] 5.4 Extend kernel/harness tests to prove resolved geometry reaches rendering and hit testing while authored geometry remains unchanged

## 6. Document reality and verify

- [x] 6.1 Update `current-state.md` and `layout.md` only after the implementation changes reality; record deferred interaction, translation, grid, inference, and foreign-layout changes
- [ ] 6.2 Run `bun run typecheck`, `bun run test`, `bun run lint`, and `bun run format:check`
- [ ] 6.3 Run `bun run build` because the change adds Rust/WASM and build integration
