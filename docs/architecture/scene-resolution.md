# Scene Resolution

Status: **Target** as a pipeline. **Current** only as a single lossy projection
step. This document exists because the shape of this stage determines whether
components, tokens, layout, states and animation can ever work.

Ratified in principle by [ADR 0005](adrs/0005-layout-and-resolution.md).

## The three representations

```
  AUTHORED                RESOLVED                    RENDER PACKET
  EditorDocument   ──▶    ResolvedScene         ──▶   RenderFrame
  durable                 derived, disposable         GPU-shaped, versioned
  references + intent     concrete values             geometry + paint + order
```

- **Authored** is what the user made. It stores *references*: a component id, a
  token name, a layout intent, a prototype connection.
- **Resolved** is what those references *mean right now*: which definition, which
  variant, which state, what colour, what box, what animation value at time *t*.
  It is a pure function of (document, resolution context) and is always
  rebuildable.
- **Render packet** is what the GPU needs: world transforms, geometry, paint,
  clip, opacity, explicit order. It carries no product semantics (I30).

Keeping these three apart is the difference between a design tool and a drawing
program. Collapse authored into resolved and edits stop propagating. Collapse
resolved into the packet and every renderer backend has to reimplement product
logic.

## What exists today

There is no `ResolvedScene`. There is one projection:

```
EditorDocument
  → editorDocumentToScene(document, revision)     scene-adapter.ts:69
  → applyStoryOverrides(scene, frameId, storyId)  scene-model
  → Scene (legacy nested Layer tree)
  → canonicalSceneBytes(scene) → Rust RendererCore.set_scene(...)
  → RenderFrame (draw protocol v5)
```

`applyStoryOverrides` is the only resolution-like step in the system: it applies
a `Story`'s per-layer `LayerOverride` map (bounds, transform, fill, stroke,
opacity, cornerRadius, visible, text) over the base scene. It is a shallow,
single-level, legacy mechanism — the ancestor of what variant/state resolution
should be, and not a substitute for it.

Everything else is a straight structural translation. No component is expanded,
no token is looked up, no layout is computed, no animation is evaluated.

## The resolution context

**Target.** Resolution is a pure function of the document plus an explicit
context. Making the context explicit is what keeps resolution deterministic and
cacheable:

```ts
interface ResolutionContext {
  pageId: DocumentId;
  theme?: string;              // token set selection
  stateSelections?: Record<DocumentId, Record<string, string | boolean>>;
  timeMs?: number;             // animation evaluation point
  libraryVersions: Record<DocumentId, string>;   // pinned, from LibraryReference
  documentRevision: number;
}
```

Two resolutions with the same `(documentRevision, context)` must produce
byte-identical output. That is what makes visual regression testing, headless
export and caching possible at all.

## Ordered stages

**Target.** Each stage is separately testable and consumes the previous stage's
output.

1. **Reference resolution** — resolve `LibraryReference`s, load definitions,
   verify integrity, produce diagnostics for missing or stale libraries. Reject
   component dependency cycles here (I39), before anything expands.
2. **Component expansion** — for each `ComponentInstance`, select the variant
   from its properties, select the state, expand the definition subtree, apply
   overrides. Produces resolved nodes with *provenance*: which instance and which
   definition node each resolved node came from. Provenance is what lets the
   inspector say "this is overridden" and lets selection stop at instance
   boundaries.
3. **Token / variable substitution** — replace token references with values from
   the active theme. Unresolved tokens become diagnostics with a documented
   fallback, never a silent black.
4. **Layout** — compute concrete boxes from constraints and auto-layout intent.
   Results are written into the *resolved* tree, never back into `bounds`. See
   [`layout.md`](layout.md).
5. **Text shaping** — content plus typographic intent becomes positioned glyph
   runs. Cached by (content, font, size, features, width). See
   [`typography.md`](typography.md).
6. **Animation evaluation** — evaluate the active transition at `timeMs` to
   concrete property values. See [`animation.md`](animation.md).
7. **Transform and visibility flattening** — compose world transforms, propagate
   inherited visibility and opacity, resolve clip chains.
8. **Packet encoding** — emit the versioned `RenderFrame`. This is where Rust
   already sits.

Stages 1–3 and 6 are pure data work and belong in TypeScript first. Stage 7 is
already in Rust. Stage 4 now has a ratified split: TypeScript owns authored
semantics and adapts a versioned Crafty IR; Taffy evaluates an entire subtree in
one coarse Rust/WASM call (ADR 0013). Stage 5's full shaping placement remains
separate. Worker or transport changes still require measurement
([`wasm-boundary.md`](wasm-boundary.md)).

## Incrementality

**Current:** the change detection that exists lives at the wrong level.
`computeSceneDelta` (`wasm-bridge.ts:92`) diffs the *previous projected scene*
against the new one to derive `changedNodeIds`, which the Rust encoder uses to
re-encode only those subtrees and the host uses to merge into its retained
command map. That works and is tested, but it is a diff of the output rather than
knowledge of the input.

**Target:** the kernel already knows exactly which nodes a command touched — the
command *is* the change description. Propagating a dirty-node set from the
command through resolution to the packet removes the diff entirely.

Invalidation is transitive and must be modelled explicitly:

- editing a node dirties itself and its layout-affecting ancestors
- editing a component definition dirties every instance of it, transitively
- editing a token dirties every node bound to it
- changing the theme or state selection dirties the affected subtrees

Until that dependency graph exists, full re-resolution is the correct fallback.
**Full rebuild must always remain available and benchmarked** as the correctness
reference against which incremental resolution is validated.

## Staleness and cancellation

Resolution will become asynchronous (workers) before it becomes fast. The
sequencing rules are already in the protocol and must be preserved:

- Every request carries `documentRevision` and a monotonic sequence number
  (`wasm-bridge.ts:129`).
- A result whose revision is older than the current document is **discarded**,
  never applied.
- Cancellation is cooperative at stage boundaries.
- The renderer reports `packetRevision` and command counts so staleness is
  observable rather than inferred.

## Rules

- **Resolution never writes to the authored document.** No exceptions. A resolver
  that mutates its input is a data-loss bug.
- **Resolution is deterministic.** No wall-clock, no randomness, no iteration
  order dependence. Time enters only as an explicit `timeMs` in the context.
- **Diagnostics, not guesses.** A missing component, unresolved token, broken
  library reference or unsupported property produces a structured diagnostic and
  a documented visual fallback. Never silently substitute a default that looks
  intentional.
- **Provenance survives.** A resolved node knows where it came from. Without it,
  selection, the inspector and override editing cannot work.
- **The renderer is the last stage, not a participant.** If the renderer needs to
  know what a component is, a stage above it failed to do its job.
