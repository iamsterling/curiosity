# Research: Canvas Platform Foundation

Status: research, August 2026. Five independent deep-research reports were produced in isolated worktrees from primary sources (all URLs verified 2026-08-06) and copied into `docs/research/`. This file digests them; the reports are the evidence for the spec's decisions.

## Reports

| Report | Source | Key result |
|---|---|---|
| `docs/research/webgpu-typegpu.md` | TypeGPU 0.11.9 docs/source, WebGPU spec, toji.dev guidance, Figma WebGPU post (2025-09-18), Next.js 16.3 Turbopack docs | Retained display lists, capacity buffers, bind-group/pipeline caches, bundles, atlases, upload strategy, device-loss, workers, latency, instrumentation analysis. `unplugin-typegpu` bundler list confirmed: no Turbopack — shader transforms stay out. |
| `docs/research/rust-wasm-boundary.md` | wasm-bindgen guide, Rust+WASM book, rustc platform support, Cargo profiles, V8 SIMD, MDN, serialization benchmarks (djkoloski, 2026-08-02), postcard, rkyv, Skia CanvasKit, Flutter web, Figma | Current JSON-both-ways boundary is the documented anti-pattern (serde_json 5–26× slower, 2.5–4× larger on reference datasets). Recommended: versioned SoA binary packet into linear memory with `(ptr,len)` zero-copy read, f32 geometry, viewport-as-uniform, changed-node batches, revision/sequence plumbing, build-profile tuning, and 7 stop/go experiments E1–E7. |
| `docs/research/document-grid-pages.md` | Figma help (zoom/snap/layout guides), Penpot docs, tldraw SDK, pen.dev research | Schema v2 with per-page `PageCanvas` + durable rest-camera (gesture camera never serialized); adaptive grid with LOD hysteresis; guides as authored records vs magnet guides as overlays; snap priority pixel > guide > object > grid; 8 vertical slices S1–S8; 30-row test matrix; 11 risks. |
| `docs/research/architecture-alternatives-and-plan.md` | All `docs/editor/*`, ADRs 0001–0006, specs 006–008, current code | Three architectures (walking skeleton A / pragmatic production B / maximal C) compared on 12 dimensions; phased work units W1–W9; quality gates table; 12 explicit decisions D1–D12 that must not be guessed. |
| `docs/research/competitor-capability-matrix.md` | Figma help/blog, Penpot 2.17.0 source/docs, Excalidraw 0.18.1, tldraw 5.3.0, Rive runtime 2.39.2 | Primary-source capability matrix: Figma WebGPU renderer shipped 2025-09-18 (C++/WASM, Dawn, naga); Penpot Rust/Skia WASM renderer; tldraw DOM-canvas shapes with signals; Rive C++ renderer with per-shape culling. Native/configurable/inferred classification with confidence per claim. |

## Decisions adopted from research

- **D1 World precision:** f64 world/page/node coordinates in the kernel; f32 conversion only at the render-packet boundary; authored values never quantized.
- **D2 Clamps:** single documented zoom range (kernel default `[0.05, 16]` target, unified across kernel/renderer; exact bounds ratified in plan) and world pan limit (`±1e6` default); current inconsistent kernel (0.05–8) vs renderer (0.15–4) clamps are unified.
- **D3 Overlay ownership:** grid, guides, rulers, marquee, selection outlines are editor overlays rendered by the host; never authored node geometry; grid settings page-authored but never required for rendering.
- **D4 Packet versioning:** protocol v1 (coarse JSON) → v2 (retained + changed batches) → v3 (resource ops) additive; unknown versions rejected, never coerced.
- **D5 TypeGPU rule:** parity + build + opacity conditions gate adoption; rejected gate keeps current host with retained buffers; both paths ship zero dead code.
- **D6 No fallback backend:** WebGL and unimplemented backends are never presented as available.
- **D7 Mutation exclusivity:** pointer-down never mutates durable state; previews transaction-only; one gesture = one history entry.
- **D8 Worker rules (later):** workers never mutate documents; `(documentRevision, requestSequence)` staleness rejection; cooperative cancellation.
- **D9 Persistence cadence (later):** autosave at command boundaries; atomic writes; stale revisions cannot overwrite.
- **D10 Migration:** `Scene` v1 is a temporary projection; adapter removed after server API speaks document v1.
- **D11 Measurement rule:** binary packets, workers, Rust hot paths enter only after benchmarks show the current path is the bottleneck.
- **D12 Diagnostics contract:** structured code + stage + severity + recovery + preservation; messages never leak document contents, packet bytes, shader source, adapter internals, or arbitrary throws.

## Open questions routed to plan phase

- Rulers/guides overlay surface: WebGPU overlay packet vs DOM overlay (kernel-neutral UI decision).
- Grid default: lines 8/5 (8-point system) vs dots; per-user preference vs document record.
- `set-page-viewport` autosave cadence (camera writes are the exception to command-boundary autosave).
- `WORLD_LIMIT` and `ZOOM_MAX` product sign-off (`1e6/32` tight, `1e7/64` default, `1e9/256` Figma-like).
- Focus mode (Penpot F) vs deep-select (double-click) as primary isolation gesture.
