# Roadmap and Open Decisions

Status: **Proposed sequence**, derived from the audit in
[`current-state.md`](current-state.md). This is a dependency ordering, not a
schedule and not a commitment.

## The long pole: Crafty visualizes the codebase

**Direction, not yet a plan:** Crafty's eventual surface is a live, bidirectional
visualization of the code in this repository — the web UI grows into an IDE where
the same document is edited visually or as code. Two consequences shape
everything below, even though neither is built yet:

1. **The renderer is framework-agnostic by design.** React is *one* chrome
   implementation, not the only one. The kernel and the packet are the contract;
   nothing in the Rust/WASM/WebGPU path may assume a React host. The composition
   doctrine in AGENTS.md (shell in the layout, primitives at use sites, panels
   wire themselves) exists so the UI tree is a faithful projection of the code
   tree — what you see is what the repo says.
2. **The projection animates per sub-component.** States are already "named
   points in a declared property space" (3.5); a loading state is just another
   named point, resolved per sub-component by the same machinery (4.2). The
   resolution pipeline must therefore produce per-node values with provenance,
   never whole-scene snapshots — the groundwork is laid in 2.2.

The code↔document mapping (which side is canonical, sync granularity, how a
source file becomes a node tree) is an open decision, not yet designed.

## The principle behind the ordering

Crafty's canvas is currently a *proof surface with a good kernel underneath*. The
temptation is to add toolbar features — ellipse, pen, more panels. That is the
wrong move: each one lands on a substrate that cannot save what it produces,
re-renders React on every pointer move, and has no resolution stage.

So the ordering below fixes the substrate first. Every item in phase 1 unblocks
several items later; nothing in phase 1 is visible in a screenshot.

---

## Phase 1 — Make the foundation trustworthy

### 1.1 Persist the real document — ✅ DONE
**Unblocks: components, tokens, guides, per-page cameras, everything.**

The document-native package persists `PageCanvas`, `components`, `instances`,
`libraries`, `variables`, locked nodes and node metadata. Legacy `scene.json` is
read through a one-way conversion only.

The document-native API route and browser wiring are shipped. See
[`persistence.md`](persistence.md).

### 1.2 Get React out of the render path — ✅ DONE

Shipped in [ADR 0008](adrs/0008-next-server-runtime.md). `canvas-stage.tsx` owns
a rAF loop reading `editor.getSnapshot()` directly, keyed on
`EditorProjection.renderRevision`; panels are independent sliced subscribers via
`useEditorSelector`. A drag renders no React components. See
[`react-boundary.md`](react-boundary.md).

### 1.3 Collapse the duplicated implementations
**Low risk, removes a whole class of future divergence.**

- One coordinate implementation (kernel; `scene-renderer` re-exports).
- One hit-test implementation (kernel's `documentHitTest`, which respects
  `locked`; retire the scene spatial index with `Scene`).
- One viewport owner (kernel, with `PageCanvas.rest` as the authored rest camera).

### 1.4 Move misplaced editor semantics into the kernel

Resize arming, marquee geometry, paste-target resolution and duplicate currently
live in `CanvasEditor`. Move them, with kernel tests. See
[`editor.md`](editor.md).

### 1.5 Model handles and resize explicitly

Add a `resize` effect with an explicit handle identifier and modifier semantics,
replacing the 16px corner-proximity inference. Prerequisite for rotation and path
editing. See [`input-and-tools.md`](input-and-tools.md).

---

## Phase 2 — Make it a structured editor

### 2.1 Isolation and deep select

Wire `isolationRootId`. Default selection targets the outermost selectable
ancestor; double-click descends; component boundaries are hard walls. This is the
single change that most makes the canvas feel like a design tool rather than a
drawing surface. See [`selection-and-hit-testing.md`](selection-and-hit-testing.md).

### 2.2 Resolution pipeline skeleton

Introduce `ResolvedScene` and a `ResolutionContext` with an explicit stage order,
even when most stages are pass-through. Retire `editorDocumentToScene` from the
render path by having the encoder consume documents (or resolved scenes)
directly. See [`scene-resolution.md`](scene-resolution.md).

### 2.3 Local components and instances

Create definitions from a selection, place instances, resolve them with
provenance, render them. Then overrides with orphan diagnostics. **This is the
first ADR-worthy milestone** — it fixes the authored/resolved line for components
permanently. See [`components-and-design-systems.md`](components-and-design-systems.md).

### 2.4 Snapping

`SnapSettings`, `SNAP_TOLERANCE_SCREEN_PX` and the grid service's snap candidates
all exist and no tool consumes them. Small, high-perceived-quality.

### 2.5 Multi-selection overlays

The kernel has an ordered selection set; the renderer outlines one node.

---

## Phase 3 — Make it a design tool

### 3.1 Text
The largest visible gap. Font model → shaping with a cluster map → glyph atlas
and text pipeline → line breaking → caret and editing → rich text. Do not attempt
editing before the cluster map exists. See [`typography.md`](typography.md).

### 3.2 Layout
Authored flex-family layout is underway in the resolution pipeline: Fixed/Hug/
Fill, flow/absolute participation, versioned semantics, and Taffy behind a
Crafty-owned IR (ADR 0013). Constraints and interaction semantics follow. See
[`layout.md`](layout.md).

### 3.3 Vectors and real paint
Path node kind, tessellation in the encoder, strokes, gradients, and a `Paint[]`
model replacing the scalar `fill`/`stroke` strings.

### 3.4 Images and clipping
Asset references by content hash, decode and upload, texture atlas; frames that
clip their children.

### 3.5 Tokens, variants and states
Token bindings and theme selection in the resolution context; variant selection
from `propertyDefinitions`; states as named points in the property space with a
derived state-matrix view.

---

## Phase 4 — Make it a system

### 4.1 Cross-file libraries
Publishing, version pinning, integrity verification, update diffs, and
first-class missing/stale states.

### 4.2 Motion
State transitions first (reusing the component state model), then
trigger/action prototyping. Requires 1.2. See [`animation.md`](animation.md).

### 4.3 Agent surface
Query API → transactional batch execution with diagnostics → receipts → headless
render for visual verification → a thin transport. See
[`agent-editing.md`](agent-editing.md).

### 4.4 Headless render and export
Also unlocks real visual regression testing, which is currently absent.

---

## Cross-cutting, start now

- **Property/invariant tests** — the cheapest large quality improvement
  available. See [`testing.md`](testing.md).
- **Input latency measurement** on the 10k fixture with a recorded environment.
  Currently unmeasured, and the number that decides whether Crafty feels
  professional.
- **Close the browser/GPU gate** — real submission, visual parity on hardware,
  device-loss recovery.
- **Viewport culling** in the encoder — the cheapest large win for big documents.
- **Stress fixtures** beyond the 10k-rect grid. See
  [`performance.md`](performance.md).

---

## Open decisions

Deliberately open. Each needs an ADR before implementation, not after.

| # | Decision | Why it is open |
|---|---|---|
| 1 | ~~**Layout engine**~~ | **Decided (ADR 0013):** Taffy 0.13 behind a versioned Crafty-owned coarse layout IR |
| 2 | **Text shaping placement** — Rust/WASM or TypeScript | Rust has the better libraries and the boundary exists; cost is crate size and font data crossing the boundary |
| 3 | **Glyph strategy** — raster atlas or SDF/MSDF | Needs a benchmark at Crafty's actual sizes and zoom range |
| 4 | **Packet transport** — keep JSON or go binary/shared-memory | Needs a measurement showing serialization dominates frame time |
| 5 | **Collaboration model** | Deliberately deferred until the document format is durable. Stable ids and invertible commands are the groundwork. |
| 6 | ~~**Fate of the block-compiler lineage**~~ | **Decided (ADR 0016):** retired in one deliberate change. The canvas product has no second lineage. |
| 7 | ~~**Fate of `packages/animation`**~~ | **Decided (ADR 0016):** retired with the lineage; the motion model is designed separately in [`animation.md`](animation.md). |
| 8 | **Storage substrate** — files or a database | `todo.md` mentions SQLite/Drizzle. Files + canonical JSON are adequate now; change requires a concrete need |
| 9 | **Native desktop backend** — native `wgpu` peer host | Deferred; the encoder is deliberately backend-independent so this stays possible |
| 10 | **Whether constraints and auto layout coexist** on one frame | Figma allows one; allowing both multiplies the semantic surface |
| 11 | **Code↔document mapping** — which side is canonical, sync granularity, how a source file becomes a node tree | The long pole ("Crafty visualizes the codebase") depends on it; deliberately not designed until components resolve (2.3) and the resolution pipeline exists (2.2) |

## Things deliberately not on this roadmap

- A collaboration/CRDT layer.
- A cloud backend or multi-user sync.
- A WebGL fallback backend.
- Timeline animation authoring (deferred behind state transitions).
- Any new heavyweight development-process framework.
