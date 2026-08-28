# Feature Spec: Canvas Platform Foundation

## Problem

Crafty is a bounded local scene proof, not yet an editor substrate. `App.tsx` still owns the scene, viewport, selection, drag state, and pointer callbacks; every render re-encodes the whole document through JSON and rebuilds GPU geometry; the page root is a sized box instead of an unbounded canvas; there is no grid, no guides, no per-page viewport, and no retained render path. Deep research (August 2026) confirms the exact anti-patterns: per-frame full-document JSON sync, per-shape JS transform loops, unbounded per-frame GPU allocations, and no revision/sequence plumbing at the renderer boundary.

## Product Direction

Evolve Crafty from a scene proof into a credible infinite-canvas editor with the interaction and document capabilities users expect from Figma/Penpot-class tools, while preserving the renderer-independent authored model, the Rust/WASM coarse packet boundary, and the existing deterministic-snapshot and failure-policy contracts.

The first foundation slice delivers: kernel-backed browser ownership, unbounded canvas semantics with a true adaptive grid, retained rendering with changed-node batches (protocol v2), and a ratified TypeGPU adoption gate. Multi-page documents, guides/rulers, frames, copy/paste, and advanced parity features follow the same contracts in later slices — never by guessing ownership boundaries in code.

## Scope

- Replace `App.tsx` scene/drag state ownership with kernel-backed document projection and the kernel input router (commands, transactions, history, selection).
- Make pan/zoom/create/move/resize/undo/redo/delete/save/reload flow through kernel commands; add marquee selection and multi-selection overlays.
- Introduce unbounded page-root semantics: unified world precision policy (f64 in kernel, f32 at packet boundary), one documented zoom clamp range, world pan limits, page content bounds.
- Add a true adaptive grid (dot/line modes, major/minor spacing, zoom-dependent density with hysteresis, pixel grid at high zoom) as a renderer overlay — never authored node geometry.
- Add page-authored grid/ruler/guide settings with snap service priority pixel > guide > object > grid.
- Implement retained rendering: per-material capacity-cached vertex buffers, ordered submission batches, packet revision tracking, changed-node batch encoding in Rust, full-rebuild fallback.
- Add multi-page document support: page CRUD/reorder, per-page viewport persistence (rest camera rule), per-page selection, page-switch camera/selection restore, undo entries carrying pageId.
- Ratify the TypeGPU adoption gate: opacity/fill parity, build compatibility evidence, budget benches with recorded environment, ADR.
- Add browser interaction test harness coverage for the first slices.

## Non-Goals

- Binary packet transport, worker resolution pipeline, OffscreenCanvas/SharedArrayBuffer, SIMD, and Rust core consolidation — gated behind measured thresholds (measurement rule D11).
- Text shaping, components/variants/state-matrix resolution, vectors/images, constraints/auto-layout, prototypes, comments, multiplayer, and collaboration — later slices on the same contracts.
- WebGL fallback or any unimplemented backend presented as available.
- Expanding the legacy `Scene` model; the adapter is temporary and will be retired.
- Rulers/guides as authored geometry; snap settings remain non-blocking for rendering.
- Rewriting all WGSL into TypeGPU shader functions before the build-compatibility gate passes.

## Acceptance Criteria

- No `setScene` outside the kernel adapter; pointer-down never mutates durable state; one committed gesture = one history entry.
- Accidental-rectangle regression fixed: wheel/pinch can never arm a create gesture; tool effect vocabularies are disjoint.
- Pan/zoom/clamp invariants hold: zoom clamp unified to one documented range; world pan limit enforced; zoom-anchor invariance property tests green.
- Grid renders as an overlay with density bounds [6, 32] screen px at every zoom level and non-oscillating LOD hysteresis; grid visibility never changes snap behavior.
- Retained host reuses capacity-cached buffers per material key; repeated renders perform zero unbounded allocations (allocation counter test); protocol v2 changed-node batches encode in Rust with full-rebuild fallback; parity tests green.
- Multi-page: page switch restores camera + selection; undo from another page switches and restores touched selection; v1→v2 migration round-trips with stable canonical bytes.
- TypeGPU gate: adoption decision recorded in an ADR backed by parity + build + budget evidence; no dead host code ships.
- Browser interaction tests cover page tabs/restore, grid/guides, and paste across pages for implemented slices.
- `npm run build`, `npm run typecheck`, `npm run test`, `npm run lint`, `npm run format:check`, and Rust tests pass.
