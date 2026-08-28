# Crafty Infinite Canvas / Editor — Architecture Alternatives and Plan

Status: architecture research, 2026-08-06 · Feeds: editor foundation roadmap, renderer bolts, and future product slices
Scope: architecture research only. No production source, package manifest, or docs outside this file are modified.
Inputs read: `docs/editor/*` (target architecture, current-state audit, document model, renderer contract, coordinate spaces, wasm boundary, invariants, input and tools, renderer-failure policy, implementation roadmap, final gap analysis, research ledger, ADRs 0001–0006), `docs/adr/*`, `specs/006`, `specs/007`, `specs/008` (spec/research/contracts/plan/tasks), `apps/crafty-web/src/App.tsx`, `apps/crafty-server/src/index.ts`, `packages/editor-kernel/src/*`, `packages/scene-model/src/*`, `packages/scene-renderer/src/*`, `packages/scene-renderer-wasm/src/*` (including Rust `lib.rs`, TypeGPU candidate, benchmarks), `packages/quality-gates/src/index.ts`.

---

## 1. Purpose

Select and plan a target architecture for a Crafty-grade infinite canvas/editor: an unbounded world canvas owned by a renderer-independent kernel, rendered through the coarse Rust/WASM packet boundary onto WebGPU (TypeGPU candidate), with worker boundaries, crash-safe persistence, structured diagnostics, and measurable quality gates — migrating from the legacy `Scene` v1 projection without breaking the local server contract.

This document develops three architectures — a **minimal walking skeleton (A)**, a **pragmatic production path (B)**, and a **maximal architecture (C)** — compares them against the same twelve dimensions, records rejected options ADR-style, and commits to a phased plan with owned files and gates. Everything here is research: no code changed.

## 2. Verified Current State (baseline, 2026-08-05/06)

| Area | Reality | Evidence |
|---|---|---|
| Document | `EditorDocument` v1 exists: stable-ID node map, pages/pageOrder, explicit parent links + ordered `childIds`, components/instances/libraries/variables records, strict validation (duplicate ID, parent mismatch, cycles, missing refs), canonical serialization (sorted keys). Legacy `Scene` still the persisted/rendered projection. | `packages/editor-kernel/src/document.ts` |
| Kernel | Commands, transactions, rollback, undo/redo, selection filtering, explicit tool machine (select/rectangle/hand, phases idle→armed→captured→preview→committed/cancelled), authoritative coordinates, `(documentRevision, requestSequence)` staleness *designed*. `getDocument()`/`getState()` deep-clone on every call (O(n) per call — acceptable now, measured later). | `kernel.ts`, `commands.ts`, `interaction.ts`, `coordinates.ts` |
| Browser | `App.tsx` still owns legacy `scene` React state, viewport, selection, drag state, pinch, and pointer callbacks; kernel installed as an adapter projection (`sceneToEditorDocument`/`editorDocumentToScene`). Pointer-down directly arms legacy `drag.mode = "draw"` on a spatial-index miss — the accidental-rectangle defect persists at the browser layer. | `apps/crafty-web/src/App.tsx:234-267` |
| Renderer | Rust/WASM encoder (JSON scene in → `RenderFrame` JSON out, protocol v1), TypeScript WebGPU host: handwritten WGSL, one growing vertex buffer destroyed/recreated on growth, one render pass per frame, full rebuild every render. TypeGPU 0.11.9 candidate exists with typed vertex layout (stride 32) and a **known double-opacity mismatch** (max color delta 0.25) and known layout/fill-padding divergence from the current host. Deterministic pixel-hash parity test exists (tolerance 0 delta on the representative fixture). | `lib.rs`, `webgpu-renderer.ts`, `typegpu-rectangle-host.ts`, `benchmarks/renderer-host-comparison.test.ts` |
| Budgets | Benchmarks declared: 10,000 rectangles ≤ 50 ms; 1,000-node changed batch ≤ 16 ms; page switch ≤ 250 ms (renderer contract). Measured only at vertex-encode level today, environment-tagged via `CRAFTY_BENCH_*`. | `renderer-comparison-fixtures.ts`, `renderer-contract.md` |
| Failure policy | Structured diagnostic codes per stage (init/pipeline/upload/submit/device-loss/packet-version), preservation guarantee `authored-state-and-last-valid-packet`, capability matrix (TypeGPU / approved current host / degraded / blocked), **no WebGL fallback**, degraded is user-visible. | `renderer-failure-policy.md` |
| Persistence | In-memory local server, optimistic revision check (`expectedRevision`), 1 MB body cap, strict scene validation, canonical snapshot endpoint with sha256. Not crash-safe. | `apps/crafty-server/src/index.ts` |
| Quality gates | `packages/quality-gates` already requires matrix rows: animation-contracts, fallback-regression, timeline-placeholder, browser-webview-integration, security-boundaries, deterministic-snapshots, bounded-performance (needs referenceEnvironment + representativeFixture + sampleCount + p95Ms). | `quality-gates/src/index.ts` |
| Devices | WebGPU requires secure origin; iPadOS 26+ for iPad; HTTPS/Tailscale dev setup exists. | `README.md` |

### 2.1 Gaps that define the research question

1. No retained render state: every render re-encodes the whole scene and re-uploads geometry (`wasm-bridge.ts:54-55` sends canonical bytes every render; host rebuilds per frame).
2. No worker boundary: resolution, layout, hit-index, packet encode all main-thread.
3. No infinite canvas semantics: world = bounded frame; page root is a sized box; no grid, no unbounded pan/zoom policy beyond clamps (kernel 0.05–8, renderer 0.15–4 — inconsistent clamps).
4. Persistence is a `Scene` JSON round trip through the adapter; no crash-safe store; no document-v1 server API.
5. No observability: no frame-time/input-latency counters beyond one-off bench runs.
6. No browser-level interaction automation (kernel tests exist; browser pointer tests do not).
7. TypeGPU adoption decision is open, gated on the parity test and Turbopack build compatibility.

## 3. Decision Drivers

- **D1-Driver: renderer independence.** Authored document is durable and renderer-independent (target-architecture principle). Every architecture must keep the kernel as the only mutation owner; renderers are projections.
- **D2-Driver: bounded determinism.** Canonical bytes, packet parity, and snapshot hashes are existing contracts; architectures must preserve or strengthen them.
- **D3-Driver: latency budget.** Input→preview ≤ 50 ms (10k fixture), packet sync ≤ 16 ms (1k batch) are the declared budgets; an infinite canvas makes *main-thread blocking* the primary risk, not raw throughput.
- **D4-Driver: graceful failure.** Device loss, init failure, packet rejection are structured, non-mutating events; no silent fallback, no WebGL.
- **D5-Driver: migration safety.** `Scene` v1 is a compatibility projection; the adapter is temporary; nothing new may expand the legacy model.
- **D6-Driver: measurement before optimization.** Binary packets, workers, retained caches, Rust hot paths all enter only after a benchmark shows they are the bottleneck (wasm-boundary doc, ADR 0003).

## 4. Architecture A — Minimal Walking Skeleton

Goal: a *complete, correct, boring* infinite-canvas editor on the existing substrate, proving the end-to-end loop (input → kernel → resolved packet → retained WebGPU host) with the smallest diff to owned files. No new runtime processes.

| Dimension | A design |
|---|---|
| Document/kernel ownership | Unchanged: TS main-thread kernel owns document, commands, transactions, history, selection. `App.tsx` shrinks to subscriptions + command dispatch (the integration bolt). Kernel adds a revision stream and a `getProjection` (no full-clone per render; clone once per committed revision). |
| Page model | `EditorDocument` pages stay; page root becomes an *unbounded content root*: its `bounds` is retained for legacy export only, interaction no longer clips to it. Multi-page switching already exists (`pageOrder`, `currentPageId`). |
| Grid/coordinates | World = f64 in JS (already). Add editor-chrome grid overlay (dot grid) drawn by the renderer host as a separate overlay layer, keyed to zoom level (dots at powers of two, hide < 0.05 zoom), **never authored**. Unify zoom clamps to one documented range (see D5). No snap engine yet (later). |
| Resolution | Synchronous TS resolution on commit (already true): references → layout (identity for now) → visibility → world transforms → resolved snapshot. Deterministic fixtures assert byte-equality. Page switch ≤ 250 ms gate. |
| Retained render packets | Protocol v2 (additive): `documentRevision`, `packetRevision`, and either `full` or `changedNodeIds` batch. Host retains a vertex buffer per material key via the existing `capacity-resource-cache` (min 256, ×2 growth) and `ordered-submission-batches` (resourceKey+layer compatibility). Full rebuild remains the correctness fallback. Binary encoding stays JSON for A (measured, not replaced). |
| TypeGPU/WebGPU | Gate: if the parity test (pixel hash, position delta = 0, color delta = 0 except documented translucent case) passes on the pinned 0.11.9 and Turbopack builds the shader transform, adopt TypeGPU host for rectangles; otherwise keep the current host with retained buffers. Either way the packet boundary and diagnostics contract do not change. Double-opacity mismatch must be fixed or documented as a tolerance in the parity fixture — it cannot silently ship. |
| Rust/WASM | Unchanged contract; Rust gains changed-batch packet encoding (v2). Nothing moves to Rust that is not already there. |
| Worker boundaries | None in A. Rationale: serialization cost must be measured first (D6). A single synchronous resolve of a 10k document is the benchmark that decides whether B's worker is justified. |
| Persistence | Server API unchanged for A (still Scene). Add autosave at command boundaries (debounced 500 ms), revision check retained. Document v1 canonical string becomes the client-side source for the snapshot hash. Crash-safe store deferred to B. |
| Diagnostics | Existing matrix extended with `RENDER_PACKET_REVISION_STALE`; kernel exposes `lastDiagnostics` ring (last 20, structured codes only, no document contents in messages). |
| Observability | Minimal counters: input→preview ms (kernel timestamps pointer-down→first preview effect), render ms, packet bytes, per-frame buffer allocations, retained-buffer hits/misses. Exposed via `kernel.telemetry` and a debug overlay; no export pipeline yet. |
| Migration | Adapters stay; new commands target `EditorDocument` (already true). No server migration in A. |
| Acceptance boundary | Browser integration tests (create/select/move/resize/cancel/delete/undo/redo/save/reload/pan/zoom) pass on the kernel-backed surface; 10k fixture meets the 50 ms gate end-to-end on a reference machine; deterministic snapshot gate green. |

**A risks:** main-thread resolve cost for 10k+ documents may fail the input-latency gate on low-end hardware (that is the measured signal to move to B); JSON packets bound scaling; no crash safety; iPad frame time unverified.

## 5. Architecture B — Pragmatic Production Path (recommended target)

Goal: production-grade infinite canvas with measured off-main-thread work, crash-safe persistence, retained GPU resources, and observability — the architecture this plan phases into.

| Dimension | B design |
|---|---|
| Document/kernel ownership | Kernel remains main-thread owner of document + commands + history (ADR 0002 unchanged). Added: kernel-owned **ephemeral session state** (viewport, hover, gesture, preview) that is never serialized (target-architecture table). A committed revision produces one immutable **document projection** object; panels subscribe to projections, never to the document. |
| Page model | Document v1 extended for infinite canvas: page root gains `contentBounds` (grows as content is placed) while interaction bounds are world-infinite; page record gains optional `grid` settings (editor-preferred, authored-optional). Grid is chrome; page is content. Components/libraries stay document records (already designed). |
| Grid/coordinates | f64 world space end-to-end in the kernel; f32 at the WASM/GPU boundary (quantization at rasterization only — never in authored values). Grid overlay: dot + optional major/minor line grid rendered by the host as an overlay packet; snapping (documented increments, shift-toggles) in kernel snap service. Single zoom clamp [0.05, 16], pan bounds unlimited but pan clamp at ±1e6 world units to protect f32→f64 transitions — documented, tested. |
| Resolution | Resolution pipeline (references, layout, visibility, world transforms, packet encoding) moves behind a **worker service** with `(documentRevision, requestSequence)` staleness rejection (designed in target-architecture). Hot path order: (1) keep TS resolution, run in worker; (2) if measured serialization cost dominates, move encode to Rust/WASM in the worker or main thread (ADR 0003 extension). Layout stays TS with deterministic fixtures. Spatial index rebuild off-thread. |
| Retained render packets | Protocol v3: `documentRevision`, `packetRevision`, changed-node batches, resource ops (create/update/destroy by stable keys), explicit `fullRebuild` fallback. Host: capacity-cached vertex buffers per material key, ordered submission batches, glyph/texture atlases keyed by stable keys, LRU eviction with explicit destroy (wgpu/Figma lesson). Packet generation deterministic and headless-exportable (Rust side). |
| TypeGPU/WebGPU | TypeGPU adopted only after the A-gate passes; then used for: typed vertex schemas per geometry kind, bind-group reuse, batched uniform uploads, retained buffers. Device-loss recovery: recreate device/root → rebuild pipeline + buffers → resubmit retained packet → visible degraded state until verified (existing policy). No WebGL ever (policy). |
| Rust/WASM | Rust owns deterministic packet encoding, geometry traversal, color parsing (current); adds changed-batch encode, binary packet format **only if JSON is measured as a bottleneck**, vector tessellation later, headless snapshot renderer later. Rust never owns document semantics. |
| Worker boundaries | One **resolution worker** (layout + resolve + packet encode) and one **maintenance worker** (index rebuild, thumbnail/export prep, font prep later) — both gated by revision/sequence, cooperative cancellation. WebGPU resource ownership stays main-thread host (per target-architecture; worker-owned canvas only when measured). |
| Persistence | **Crash-safe local store** replacing in-memory-only: atomic write (temp file + rename) or OPFS with journal; schema-versioned document v1 records; autosave at command boundaries (debounced); optimistic revision retained on the server; snapshot integrity (sha256) retained; unknown extension fields preserved (invariant). Server API migrates to document v1 (`/api/document`); Scene endpoint remains as legacy bridge until the adapter is removed (see Migration). |
| Diagnostics | Full renderer-failure matrix (existing) + persistence diagnostics (WRITE_FAILED, STALE_OVERWRITE_BLOCKED, RECOVERY_RESTORED_LAST_VALID) + worker diagnostics (STALE_RESULT_DISCARDED, WORKER_CRASHED_RESTARTED). All structured codes, stages, severity, recovery, preservation guarantees. |
| Observability | Kernel + host emit into a bounded ring (frame time, input→preview, resolve ms, packet bytes, allocs, cache hit/miss, device-loss events) + `session.idle` flush into a local JSONL trace (opt-in, never contains document contents, no telemetry server). Bench harness runs the existing fixtures across recorded browsers/hardware (`CRAFTY_BENCH_*`) and writes evidence files consumed by `packages/quality-gates` (p95, sampleCount, referenceEnvironment). |
| Migration | Steps: (1) server adds document-v1 API; (2) browser saves document v1; (3) Scene adapter removed from render/save path — Scene exists only as an import/export adapter; (4) snapshot v1 contract updated to document hashes; (5) delete `scene-adapter.ts` after no producer remains. Every step keeps round-trip fixture tests green. |
| Acceptance boundary | All quality gates in §8 green on reference hardware + one low-end class; TypeGPU parity gate green or documented decision; crash-recovery test (kill mid-write) restores last valid; 10k + 100k fixtures meet frame-time gates; iPad verified. |

**B risks:** worker serialization may not pay for itself on small docs (keep A's synchronous path as fallback when document is small); f32 at the boundary could introduce subpixel drift at extreme zoom (mitigated by documented clamp + raster-only quantization); OPFS availability differences across browsers; two-worker lifecycle adds failure modes (mitigated by restart policy + never-mutate rule).

## 6. Architecture C — Maximal Architecture

Goal: the full Figma/Penpot-class substrate: worker-owned document store, consolidated native Rust core shared across browser/headless/native targets, binary protocol, text subsystem, operation receipts, multi-backend rendering, full trace observability.

| Dimension | C design |
|---|---|
| Document/kernel ownership | Document store moves into a dedicated **kernel worker** (or into the Rust core compiled to WASM) with a command/query protocol to the main thread; main thread owns chrome, input adapter, and viewport. History and transactions live next to the store, not in React. This is a deliberate departure from ADR 0002's TS-main-thread kernel and is the point of highest risk. |
| Page model | Document v1 as in B, plus per-page infinite canvas, cross-file library pins with integrity (already in schema), state matrices, prototype/annotation records. |
| Grid/coordinates | As B, plus per-page grid presets, snap guides, ruler measurement, world-space limits documented as invariants. |
| Resolution | Layout engine (absolute + auto-layout), text shaping (harfbuzz WASM in a font worker), animation/state evaluation worker, all behind revision/sequence gating; resolution results cacheable and resumable (interruptible passes). |
| Retained render packets | Protocol v3+ with binary encoding (bincode-style or FlatBuffers), delta patches, texture atlases, render bundles; headless rasterizer shares the encoder for export parity. |
| TypeGPU/WebGPU | TypeGPU host as in B; plus MSAA, blend modes, shadows/blur, compute passes (measured); native `wgpu` backend as a peer for desktop packaging (research ledger item). |
| Rust/WASM | Consolidation: document store, command apply, layout, geometry, packet encode all in Rust core, shared by browser WASM, headless CLI export, and native `wgpu` host. Single source of truth for deterministic geometry. |
| Worker boundaries | Kernel worker, resolution worker, maintenance worker, font/shaping worker, export worker; message protocol versioned and validated at every boundary. |
| Persistence | OPFS + journal + migration chain (v1 Scene → document v1 → future versions), operation receipts for agent edits, collaboration-ready delta log designed (CRDT/OT deferred until local semantics proven — Figma lesson). |
| Diagnostics | Central diagnostic bus with typed events across all boundaries; per-boundary fail-closed validation. |
| Observability | OpenTelemetry-style spans across worker hops (local-only export), fixture-lab matrix across device classes, perf regression CI with baseline evidence files. |
| Migration | Full path from B; native target replaces nothing in the browser contract. |

**C risks:** the ADR 0002 departure (worker-owned store) is a multi-quarter re-architecture; Rust consolidation duplicates TS kernel semantics unless carefully staged; text and collaboration are open-ended scope; highest integration cost; highest value only after B's gates prove demand for it. **C is the destination envelope, not the next plan.** B already preserves every seam C needs (versioned packets, worker service protocol, resource keys, diagnostic bus).

## 7. Comparison Matrix

| Dimension | A walking skeleton | B pragmatic production | C maximal |
|---|---|---|---|
| Kernel ownership | TS main thread (today) | TS main thread + projections | Worker or Rust core |
| Off-main-thread work | none | resolution + maintenance workers | full pipeline, multi-worker |
| Retained packets | v2, JSON, per-material cache | v3, batches + resource ops | v3+ binary, bundles, atlases |
| Infinite canvas | viewport + overlay grid | full (content bounds, snap, clamps) | full + rulers/presets/guides |
| TypeGPU | gated adoption | adopted (after gate) | adopted + advanced materials |
| Persistence | autosave, unchanged API | crash-safe, document-v1 API | + migrations, receipts, collab log |
| Observability | counters | ring + JSONL traces + bench CI | OTel-style spans, device-class lab |
| Migration | adapters stay | adapter removal plan | full native/headless peers |
| Effort | small (weeks) | medium (quarters) | large (multi-quarter) |
| Risk | latency gate at scale | worker/persistence maturity | re-architecture, scope |
| When | now | next | when B gates demand it |

## 8. ADR-Style Decisions and Rejected Options

### Accepted directions (to be ratified as ADRs in the plan phase, not guessed in code)

- **ADR-E1 (envelope):** B is the target; A is the first shipped slice of B, not a separate architecture. C is the envelope for future work and must not be implemented piecemeal before B's gates.
- **ADR-E2 (coordinate authority):** all conversions live in `packages/editor-kernel/src/coordinates.ts` (existing rule). World space is f64; quantization to f32 happens only at the render-packet boundary; authored values never quantized.
- **ADR-E3 (grid is chrome):** grid, snap guides, rulers, and selection overlays are editor overlays rendered by the host, never authored nodes (extends invariant "Selection and guides are editor overlays").
- **ADR-E4 (retention before batching):** retained resources and per-material capacity caches come before changed-node batching; batching only if full-snapshot sync is measured as the bottleneck (ADR 0003 discipline).
- **ADR-E5 (TypeGPU gate):** adoption requires (a) pixel-hash parity on representative + translucent fixtures with documented tolerance, (b) Turbopack build compatibility for the pinned version, (c) a resolved double-opacity mismatch (fix the encoder, not the tolerance). Rejection keeps the current host with retained buffers — the boundary is what's durable (Figma lesson).
- **ADR-E6 (diagnostics policy):** all cross-boundary payloads validate fail-closed (non-finite, protocol version, node counts, malformed colors, size caps); diagnostic messages never contain document contents, shader source, packet bytes, or thrown values (extends renderer-failure-policy).

### Rejected options

- **R1 — Renderer-owned retained scene as the document.** Rejected (ADR 0001 already). GPU handles and resolved values are disposable; document survives renderer failure.
- **R2 — Per-shape JS/WASM calls in the render loop.** Rejected (ADR 0003). Serialization and FFI overhead scale with shape count.
- **R3 — Rust-only kernel (document + commands in Rust immediately).** Rejected for the next plan: editor semantics must stay testable in TypeScript while command vocabulary is small (Penpot/Potok lesson: don't import ClojureScript module structure into a TS product). Revisit only as a C-stage consolidation with shared dual-impl fixtures.
- **R4 — Worker-owned WebGPU canvas/device.** Rejected until measured: main-thread host with owned resources is simpler, debugger-friendly, and the transfer cost is unproven (target-architecture table already assigns resource ownership to the host).
- **R5 — WebGL fallback, silent degraded rendering, or unapproved backends.** Rejected by policy; the capability matrix is the only fallback authority.
- **R6 — DOM/canvas/React as source of truth (any layer).** Rejected (audit finding; invariant). All mutations go through the command validator.
- **R7 — Binary wire protocol now.** Rejected until JSON sync is measured as the bottleneck (wasm-boundary doc). Keep versioned JSON; binary is a B/C optimization.
- **R8 — Premature CRDT/multiplayer.** Rejected (Figma article lesson): local command inversion and hierarchy invariants first; collab only after operation receipts exist (roadmap item 8).
- **R9 — Adopting `.pen`/external formats as the persistence format.** Rejected (research-ledger): Crafty keeps its own schema-versioned document; external formats are import/export adapters.
- **R10 — Moving App.tsx drag/gesture logic into more event guards.** Rejected (ADR 0004): explicit tool state machine in the kernel is the only acceptable router.

## 9. Phased Work Units

Dependencies flow left to right; each unit ends at a measurable gate. Owned files are the *primary* ownership — the plan must ratify each as a code-owner boundary.

### W1 — Browser integration bolt (A)
- **Work:** replace `App.tsx` `scene`/`drag` state ownership with kernel-backed document adapter + kernel input router; pan/zoom/create/move/resize/undo/redo/delete/save/reload through commands; marquee + multi-selection overlay; browser interaction tests.
- **Owned files:** `apps/crafty-web/src/App.tsx` (+ new `apps/crafty-web/src/editor/` harness), `packages/editor-kernel/src/interaction.ts` (add marquee effects), `packages/editor-kernel/src/kernel.ts` (revision stream, `getProjection`).
- **Depends on:** nothing new (kernel foundation exists).
- **Gate:** browser pointer tests green; accidental-rectangle regression test green; no `setScene` outside the adapter.

### W2 — Infinite canvas core (A→B)
- **Work:** unbounded page root semantics, unified zoom clamp, grid overlay packet (dot/major/minor), world-limit pan clamp, page content bounds.
- **Owned files:** `packages/editor-kernel/src/coordinates.ts`, `packages/editor-kernel/src/document.ts` (content bounds), `packages/scene-renderer/src/draw-protocol.ts` (overlay packet), `packages/scene-renderer-wasm/src/webgpu-renderer.ts`/`typegpu-rectangle-host.ts` (grid layer).
- **Depends on:** W1.
- **Gate:** coordinate invariants + round-trip tests (existing required tests list); grid is an overlay assertion test; 10k fixture within budget.

### W3 — Retained host + protocol v2 (A)
- **Work:** per-material capacity-cached vertex buffers, ordered submission batches, packet revision tracking, changed-node batch encode in Rust, full-rebuild fallback; renderer evidence exposes revision + cache stats.
- **Owned files:** `packages/scene-renderer/src/draw-protocol.ts`, `packages/scene-renderer-wasm/src/lib.rs`, `packages/scene-renderer-wasm/src/webgpu-renderer.ts` (use `capacity-resource-cache.ts` + `ordered-submission-batches.ts` in the real path), `packages/scene-renderer/src/wasm-bridge.ts`.
- **Depends on:** W2.
- **Gate:** parity tests (existing `renderer-host-comparison.test.ts`) green for current vs retained host; no unbounded allocation per frame (allocation counter test).

### W4 — TypeGPU decision gate (A/B branch)
- **Work:** fix candidate opacity/fill divergence, verify Turbopack shader-transform build, run parity + budget benches with recorded environment; write adoption decision to a new ADR.
- **Owned files:** `packages/scene-renderer-wasm/src/typegpu-rectangle-host.ts`, `packages/scene-renderer-wasm/benchmarks/*`, `docs/editor/adrs/0007-typegpu-host.md`.
- **Depends on:** W3 (same fixtures).
- **Gate:** ADR-E5 conditions met or documented rejection; no dead host code shipped (either path compiles and tests).

### W5 — Worker resolution pipeline (B)
- **Work:** resolution/layout/index-rebuild worker service with `(documentRevision, requestSequence)` rejection and cooperative cancellation; synchronous fast path for small documents; layout determinism fixtures.
- **Owned files:** new `packages/editor-kernel/src/workers/` (or `packages/editor-resolution/`), `packages/editor-kernel/src/kernel.ts` (subscription API), `apps/crafty-web` (worker wiring).
- **Depends on:** W2, W3.
- **Gate:** stale-result rejection tests; 100k-node fixture resolve in worker with input-latency gate; small-doc fallback keeps ≤ 50 ms.

### W6 — Crash-safe persistence + document-v1 API (B)
- **Work:** atomic write/journal or OPFS store, autosave at command boundaries, recovery-on-load, server `/api/document` with revision check; snapshot hashes on document v1 canonical bytes.
- **Owned files:** new `packages/editor-persistence/`, `apps/crafty-server/src/index.ts`, `packages/editor-kernel/src/document.ts` (serialization versioning).
- **Depends on:** W2.
- **Gate:** kill-mid-write recovery test restores last valid; stale overwrite blocked; round-trip fixtures green.

### W7 — Observability + quality-gates integration (B)
- **Work:** bounded counters ring, JSONL trace flush, fixture-lab bench runner writing `QualityMatrixEntry` evidence (referenceEnvironment, representativeFixture, sampleCount, p95Ms), CI regression gate.
- **Owned files:** new `packages/editor-observability/`, `packages/quality-gates/src/index.ts` (extend matrix rows), `packages/scene-renderer-wasm/benchmarks/`.
- **Depends on:** W3, W5.
- **Gate:** every §8 gate has an executable check in CI; evidence files present for reference hardware.

### W8 — Adapter retirement (B)
- **Work:** server and browser speak document v1; Scene adapter removed after no producer remains; Scene kept only as import/export.
- **Owned files:** `packages/editor-kernel/src/scene-adapter.ts` (delete), `apps/crafty-server`, `apps/crafty-web`.
- **Depends on:** W6.
- **Gate:** no `Scene` in the render/save path; legacy import fixture still round-trips.

### W9+ — Envelope work (C, gated, not scheduled)
- Rust core consolidation, text shaping, components/state matrix resolution, binary protocol, native `wgpu` peer, operation receipts. Each opens only after the preceding B gate proves the bottleneck (D6).

## 10. Quality Gates (measurable)

All gates record `(fixture, hardware, browser, build)` per existing convention; a gate is a scripted check, not a claim.

| Gate | Definition | Threshold | Where enforced |
|---|---|---|---|
| Input latency | Synthetic pointer stream: pointer-down → first preview effect/visual response, p95 over ≥ 200 samples | ≤ 50 ms on 10k-rect fixture (contract), ≤ 16 ms p95 target on reference hardware; long main-thread tasks < 50 ms | W1 harness + W7 CI; `bounded-performance` matrix row |
| Frame time | Render-loop frame time p95 for 10k and 100k fixtures | 10k ≤ 16 ms p95; 100k ≤ 33 ms p95 on reference hardware; recorded per device class | W3 bench + W7 CI |
| Memory | Per-frame GPU/JS allocation counts; steady-state heap across 5-min interaction soak; capacity-cache growth | 0 unbounded allocs/frame (counter assertion); heap growth ≤ 5% of baseline over soak; cache growth ×2 bounded | W3 alloc test; W7 soak bench |
| Deterministic snapshots | Canonical document bytes identical across sessions, hardware, browsers; render-packet determinism (same input → same packet bytes); snapshot sha256 (existing `/api/snapshot`) | Byte-identical; hash stable; fixture-pinned | `deterministic-snapshots` row; kernel tests |
| Browser/GPU parity | Command count, geometry bounds, draw ordering, pixel reference hash across Chrome/Safari/Firefox + ≥ 2 GPU classes (incl. iPad) | Identical within documented tolerance (position delta 0; color delta 0 except pinned translucent case); parity fixture green on every class | W4 parity suite + `renderer-host-comparison.test.ts` extension |
| Device loss | Forced `device.lose()` during render: diagnostics emitted, device+resources rebuilt, retained packet resubmitted, authored doc untouched, degraded visible until verified | Recovery completes < 5 s; `authored-state-and-last-valid-packet` guaranteed | W4 device-loss integration test |
| Security | Boundary validation tests (protocol version, non-finite, node counts, malformed colors, body caps, path containment, bind-host policy); no WebGL claim; no secrets in diagnostics; dependency provenance | All fail-closed paths return structured codes; no unsupported backend presented | `security-boundaries` row; existing server tests + new boundary tests |
| Migration | Scene→document round trips stable; adapter removal leaves import path green; reload after crash restores last valid; document-v1 API revision checks | Round-trip byte parity for fixtures; no data-loss on any kill/retry path | W6/W8 fixtures; `deterministic-snapshots` row |

## 11. Risk Register

| Risk | Impact | Mitigation | Owner unit |
|---|---|---|---|
| Main-thread resolve blocks input at scale | Input-latency gate fails | W5 worker pipeline; small-doc fast path; measure first (D6) | W5 |
| TypeGPU build path breaks under Turbopack/Next | Adoption decision stalls | W4 gate pins version and tests the build before any commit; current host remains viable | W4 |
| f32 boundary quantization drifts at extreme zoom | Visual/parity drift | Unified clamp [0.05, 16]; raster-only quantization; parity tolerance documented | W2, W4 |
| Device loss on Safari/iPad mid-edit | Visible corruption | Existing policy (recreate → resubmit → degraded) + integration test | W4 |
| Worker lifecycle failures (crash, stale, cancel) | Stale previews, double-apply | Never-mutate rule; revision/sequence rejection; restart policy; no document writes from workers | W5 |
| Crash-safe store diverges from server revision | Data loss or overwrite | Journal + atomic write; stale-overwrite blocked; recovery tests | W6 |
| Adapter drift while both formats live | Semantic mismatch | Adapter removed in W8; round-trip fixtures; no legacy expansion | W8 |
| Bench flakiness in CI | Gates unreliable | p95 + sampleCount + environment tags; evidence files; tolerance per fixture | W7 |
| Local server exposed (0.0.0.0/HTTPS dev certs) | Security | Bind-host policy retained; auth before public exposure (README already warns); boundary tests | W6 |
| Scope creep into C before B gates | Re-architecture | Envelope discipline: C work only opens on measured demand | plan owners |
| Grid/overlay rendering cost on iPad | Frame-time gate | Overlay as separate cheap pass; dots culled by zoom; benchmarked in W2 | W2 |

## 12. Explicit Decisions That Must Not Be Guessed

These are contract-level decisions the plan phase must ratify (and turn into ADRs + tests) before implementation touches the owning files. Each is currently *documented intent*; guessing a different answer in code silently changes the contract.

- **D1 — World precision:** world/page/node coordinates are f64 in the kernel; f32 conversion happens only at the render-packet boundary; authored values are never quantized. (ADR-E2)
- **D2 — Zoom/pan clamps:** one documented clamp range for zoom (`[0.05, 16]`) and a documented world pan limit (`±1e6`); the current inconsistent kernel (0.05–8) vs renderer (0.15–4) clamps are unified. (W2)
- **D3 — Grid/overlay ownership:** grid, guides, rulers, marquee, and selection outlines are editor overlays rendered by the host; never authored node geometry; grid settings may be page-authored but must not be required for rendering. (ADR-E3)
- **D4 — Packet versioning:** protocol v1 (coarse JSON) → v2 (retained + changed batches) → v3 (resource ops) are additive; every consumer validates the version and fails closed; unknown versions are rejected, never coerced. (ADR 0003 + failure policy)
- **D5 — TypeGPU adoption rule:** parity + build + opacity-fix conditions (ADR-E5) gate adoption; a rejected gate keeps the current host with retained buffers; both paths ship zero dead code. (W4)
- **D6 — No fallback backend:** WebGL and any unimplemented backend are never presented as available; only the capability matrix backends exist. (policy, W4)
- **D7 — Mutation exclusivity:** pointer-down never mutates durable state; previews are transaction-only; one committed gesture = one history entry; human/plugin/agent share one validator. (invariants, ADR 0004/0006)
- **D8 — Worker rules:** workers never mutate the document; every async result carries `(documentRevision, requestSequence)` and stale results are discarded; cancellation is cooperative. (wasm-boundary)
- **D9 — Persistence cadence:** autosave happens at command boundaries (debounced), never on pointer samples; writes are atomic (journal/rename); stale revisions cannot overwrite. (invariants, W6)
- **D10 — Migration boundary:** `Scene` v1 is a temporary projection; the adapter is removed (W8) once the server API speaks document v1; nothing new may expand the legacy model. (ADR 0001, target-architecture)
- **D11 — Measurement rule:** binary packets, Rust hot paths, worker ownership of canvas, and C-stage consolidation enter only after a benchmark shows the current path is the bottleneck; fixtures, budgets, and environment tags are the evidence. (D6-Driver, ADR 0003)
- **D12 — Diagnostics contract:** structured code + stage + severity + recovery + preservation guarantee; messages never include document contents, packet bytes, shader source, adapter internals, or arbitrary thrown values. (ADR-E6, failure policy)

## 13. Research Validation

- Every claim in §2 is traceable to a file read for this research (paths listed in the header).
- The three architectures share the twelve-dimension frame; the comparison matrix is the ratification artifact for the plan phase.
- This document intentionally proposes no code change; the next step is ratifying §8/§9/§12 into ADRs and phase-scoped work units, then implementing W1 as the first slice of B.
