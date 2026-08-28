# Intent: Canvas Platform and Renderer Research

## Prompt

Crafty must evolve from a bounded local scene proof into a credible structured visual-authoring platform. Research and design the smallest coherent path to a production-quality infinite canvas with the interaction and document capabilities users expect from Figma, Penpot, and comparable editors, while preserving a renderer-independent authored model.

The initiative must cover both sides of the product boundary:

- A low-latency TypeScript/WebGPU/Rust/WASM rendering system that remains responsive during pan, zoom, selection, editing, large-document updates, and viewport resize.
- A durable workspace/project/file/page document model that supports multiple canvases/pages in one project, page-local viewports, true infinite-canvas navigation, grids and guides, snapping, frames, hierarchy, reusable components, variables/tokens, constraints/auto-layout, text, vectors, images, and future prototyping/animation without coupling authored data to GPU state.

Do not copy competitor implementation details or assume a feature exists because marketing says it exists. Build a cited capability matrix from primary documentation, public engineering material, source code where available, and reproducible local evidence. Separate:

1. Required walking-skeleton capabilities.
2. Capabilities needed for a credible first production editor.
3. Advanced parity capabilities that should not block the foundation.
4. Hypotheses requiring a browser/GPU benchmark rather than architectural opinion.

## Current Constraints

- The current authored-to-render path is `EditorDocument/Scene -> Rust/WASM RenderFrame -> TypeScript WebGPU host`.
- React must remain UI composition, not the canonical document or GPU resource owner.
- Rust/WASM should keep a coarse-grained packet boundary; do not introduce per-shape JS/WASM calls in the render loop.
- TypeGPU is pinned at `0.11.9` and is currently integrated for the bounded rectangle host.
- The current browser path uses Next.js 16 with Turbopack and must keep building without webpack-only assumptions.
- Existing HTML/iframe/Shadow-DOM fallback and timeline-placeholder contracts remain regression boundaries.
- Security, deterministic snapshots, explicit degradation diagnostics, and reproducible build/typecheck/test paths are mandatory.
- Do not claim production readiness from CPU-only parity. Browser/GPU, device-loss, memory, and input-latency evidence must be explicit.

## Research Questions

### Renderer and runtime

- What retained display-list, scene-graph, dirty-region, tile, batching, and resource-cache architecture gives stable frame time during continuous pan/zoom and edits?
- Which TypeGPU/WebGPU patterns matter in practice: typed vertex layouts, persistent buffers, capacity growth, bind-group/pipeline caches, indirect draws, instancing, texture atlases, MSAA, clip masks, readback avoidance, command encoding, and device-loss recovery?
- What should remain in Rust/WASM versus TypeScript versus a worker or `OffscreenCanvas`? Compare JSON, binary packet, shared memory, transferable buffers, and incremental changed-node batches with measured thresholds.
- Which Rust/WASM compilation and runtime features are justified: `wasm-bindgen`, `wasm-pack`, LTO, `wee_alloc` or alternatives, SIMD, atomics, `SharedArrayBuffer`, worker initialization, panic behavior, memory growth, serialization, and cancellation?
- How should resource ownership, stale revisions, async work, cancellation, context loss, WebGPU limits, and degraded rendering be represented and tested?

### Infinite canvas and interaction

- Define a true infinite canvas coordinate system with stable world/page transforms, zoom limits, cursor anchoring, pan inertia policy if any, precision strategy at extreme zoom, and device-pixel mapping.
- Define adaptive grids: square/line/dot modes, major/minor spacing, zoom-dependent density, origin/axes, page-local and world-local grids, snapping rules, guides, rulers, smart guides, alignment/distribution, and accessibility behavior.
- Define interaction ownership for select, hand, zoom, frame, pen/vector, text, marquee, resize, rotate, and multi-selection without React state races.
- Define virtualization and hit-testing for large pages: broad phase, precise geometry, spatial index choices, hierarchy/isolation, hidden/locked nodes, and selection overlays.

### Document and product model

- Define workspace -> project -> file -> page/canvas identity and persistence, including ordering, page-local viewport state, active page, cross-page copy/paste, undo/redo scope, migrations, and revision semantics.
- Define frames, groups, components, variants, instances, overrides, variables/tokens, libraries, assets, fonts, text, vectors, images, constraints, auto-layout, prototypes, comments, and collaboration placeholders as durable records.
- Identify what should be resolved snapshots versus authored records, how missing references degrade, and how render packets remain independent from the durable model.
- Compare full-document persistence, append-only command logs, snapshots plus journals, and server-backed optimistic revisions for the current local toolchain.

### Competitor and ecosystem evidence

- Produce a primary-source capability matrix for Figma, Penpot, and at least two additional relevant systems or open-source renderers.
- For every claimed capability, record source URL, publication/version date where available, exact evidence, confidence, and whether the behavior is native, configurable, or inferred.
- Include relevant browser graphics and editor engineering references, not only product documentation.

## Required Deliverables

1. A cited capability and prior-art matrix.
2. A current-state gap map tied to Crafty files and existing contracts.
3. Two or more architecture alternatives with trade-offs and rejected alternatives.
4. A target architecture covering document, coordinate, interaction, resolution, packet, WebGPU, Rust/WASM, worker, persistence, and observability boundaries.
5. A measurable performance and quality matrix: input-to-present latency, frame-time budgets, command counts, memory, allocation rate, worker transfer cost, snapshot determinism, device-loss recovery, and degraded states.
6. A phased delivery plan beginning with one walking-skeleton page, true grid, cursor-anchored zoom, retained rectangle rendering, and page switching before advanced parity features.
7. A list of implementation-ready work units with dependencies, owned files, test strategy, and explicit stop/go gates.
8. Open questions and experiments that must be answered by browser/GPU benchmarks.

## Exit Criteria

The research is complete only when a senior engineer can implement the first page/grid/multi-page slice without re-deciding ownership boundaries, when every major recommendation has cited evidence or a named benchmark, and when the plan makes clear which Figma/Penpot-like features are deliberately deferred. No full renderer rewrite, broad schema migration, or competitor feature checklist should be approved merely by analogy.
