## Context

The current authored-layout foundation is real but intentionally bounded. The
competitive research is recorded in `docs/research/layout-follow-on-competitive-research.md`.
The existing architecture requires layout after authored/reference resolution and
before packet construction; it also requires explicit diagnostics, stable identity,
invertible commands and no mutation of authored geometry.

## Decisions

### 1. Use an umbrella with separate child changes

The deferred items have different owners, schemas, failure modes and acceptance
oracles. Runtime hardening, measurement, constraints, grid, interactions,
translation, inference, component resolution and incrementality are separately
reviewable. Animation is a separate umbrella.

Rejected: one "complete layout engine" change. It would combine semantic expansion,
heuristics, UI transactions, compatibility adapters and optimization before any of
them had stable contracts.

### 2. Stabilize before expanding

The first child must finish persistence/conformance reality, reproducible fixtures and
a measured baseline for the existing foundation. Grid, translation and inference
must not define the core model indirectly.

Rejected: starting with grid or import adapters because they are visible product
features. Both would encode unresolved measurement and coexistence semantics.

### 3. Keep flow, grid and absolute behavior distinct

Flex is one-dimensional flow. Grid is two-dimensional track placement. Constraints
and pins describe absolute children responding to a containing frame. Guides are
ephemeral overlays only and receive no durable authored record. Flow, grid and
absolute behavior each receive their own authored record and resolver semantics.

Rejected: a single CSS-shaped property bag or a general constraint solver as the
document language. The former leaks unsupported semantics; the latter is opaque and
conflict-sensitive for authoring.

### 4. Make interactions proposal-driven

Drop computation returns an ephemeral proposal containing the target parent,
operation, index/cell, acceptance diagnostic and command plan. Commit is one
validated transaction; cancellation rolls back. Indicators are renderer/editor
overlay state, never nodes.

Adopted from competitor behavior: Figma's sibling insertion line, Webflow's parent
versus position feedback, Penpot's auto/manual placement distinction, Sketch's
explicit stack exceptions and tldraw's history marks/world-preserving reparenting.

### 5. Make translation exact only for controlled subsets

Adapters preserve source identity, source version, observed geometry, mappings and
loss diagnostics. Native Crafty archives can be exact; annotated target projections
can be partially re-importable; arbitrary external input is best-effort and never
silently canonicalized.

Rejected: treating SVG, computed HTML, Figma REST JSON or published site output as
Crafty's canonical document.

The first translation child is intentionally limited to four dialect adapters:

- CSS Flexbox/Grid declarations and computed browser geometry
- Figma Auto Layout, Grid Auto Layout and frame constraints from documented REST/plugin-shaped data
- Penpot Flex/Grid native semantics
- Crafty-annotated SVG/HTML projections for partial re-import

The initial supported subset is the authored flex vocabulary already implemented,
the first ratified grid/constraint subsets once those changes land, and stable node
identity mappings. Unsupported properties use `LAYOUT_UNSUPPORTED:<property>`;
lossy conversion uses `LAYOUT_LOSSY:<feature>`; ambiguous source mapping uses
`TRANSLATION_AMBIGUOUS:<source>`; unresolved references use
`TRANSLATION_REFERENCE_UNRESOLVED:<id>`. The adapter owns an export manifest with
source mappings, observed fallback geometry, generated assets, diagnostics and
license/provenance notices. No arbitrary HTML/CSS round trip is promised.

### 6. Make inference an explicit reversible authoring operation

Inference generates candidates, confidence, residuals and explanations. Acceptance
is one compound command. Low-confidence or ambiguous candidates are shown but cannot
commit automatically. Original geometry remains available until acceptance.

Rejected: inference in the resolver, on pointer move, or as an import side effect.

### 7. Resolve components and variants before layout

An instance is a reference plus sparse overrides. Variant/state selection and
component expansion produce a provenance-bearing resolved tree; layout consumes that
tree. Definition, variant, token, font and asset dependencies become explicit
invalidation edges.

Rejected: layout on detached instance copies or writing resolved values back into the
document.

### 8. Reject opaque foreign layout execution for now

Custom layout code from SwiftUI, Compose, Flutter, arbitrary CSS/JavaScript or
vendor-specific runtime nodes is not executable through Crafty's initial layout
contract. An adapter may preserve it as source metadata/observed geometry and emit
`LAYOUT_FOREIGN_OPAQUE:<source>`, but must not pretend it was translated. Supporting
behavioral sampling or a foreign-layout node is a future dedicated change, not a
hidden part of translation or inference.

### 9. Optimize only against a full-resolution oracle

Incremental resolution is deferred until semantic dependency producers are stable.
It must compare its result with full resolution, retain a full rebuild fallback and
publish distributions of visits, measure calls, cache behavior and propagation.

Rejected: adopting a numeric budget from Chrome, Yoga or Taffy. Their measurements
are evidence about their systems, not Crafty's environment.

## Dependency Graph

```text
authored-layout foundation
  -> runtime hardening / conformance baseline
  -> intrinsic measurement and invalidation
  -> component-resolution foundation (separate prerequisite)
                                      |
                                      v
                              component-aware layout
  -> constraints + breakpoint contexts  ─┐
  -> grid layout                         ├─> layout interaction semantics
                                        ┘
  -> translation adapters
  -> inference

all stable semantic producers
  -> incremental recomputation

component/state resolution + stable geometry + fixed render loop
  -> separate layout animation change
```

Constraints and grid proceed in parallel after runtime hardening and the measurement
contract. Their coexistence policy must be explicit before either ships as a combined
authoring experience; neither is a prerequisite of the other.

## Child Change Boundaries

1. `layout-runtime-hardening`: persistence, fixtures, baseline, failure and version policy. **Depends on `.ui` persistence acceptance.**
2. `layout-intrinsic-measurement`: text/image measurement, cache keys and invalidation.
3. `layout-component-resolution`: expansion, variants, provenance and dependent layout. **Depends on the component-resolution foundation and intrinsic measurement.**
4. `layout-constraints-breakpoints`: pins, responsive contexts and precedence.
5. `layout-grid`: tracks, cells, areas, spans and auto/manual placement.
6. `layout-interaction-semantics`: reorder, drop proposals, indicators and sizing-mode/container-resize commands. It does **not** include direct child-resize semantics inside flow containers until those semantics are separately specified.
7. `layout-translation`: the four initial dialect adapters, manifests, loss policy and round trips.
8. `layout-inference`: explicit candidates, confidence, residuals and reversible commit.
9. `layout-incremental-resolution`: dirty propagation, caches, differential oracle.
10. `layout-animation` (separate follow-on, not part of this umbrella): resolved-box interpolation, interruption and time.

## Un-deferral Triggers

- Runtime: `.ui` persistence is accepted, all existing authored-layout fixtures persist and reproduce in the supported production environment, and a baseline artifact is committed.
- Measurement: supported text/image Hug fixtures have deterministic constraint-aware measurements with no unexplained fallback diagnostics.
- Constraints: axis semantics, coexistence and breakpoint precedence pass multi-size fixtures.
- Grid: tracks, spans, placement and intrinsic-content fixtures pass browser-reference comparison; unsupported cases diagnose.
- Interaction: reducer/kernel tests prove deterministic proposals, one transaction per commit and no durable state on cancellation.
- Translation: each adapter publishes supported/lossy/rejected property tables and round-trip fixtures.
- Inference: known and adversarial fixtures produce reproducible confidence/residual results; low-confidence proposals cannot auto-commit.
- Components: the component-resolution foundation exists; variants/overrides resolve with provenance and definition edits invalidate affected instances.
- Incrementality: measured full-resolution cost justifies optimization; incremental output equals the full oracle with fallback retained.

`layout-animation` is un-deferred separately when the fixed render loop, explicit
time, component/state resolution and interruption semantics are complete. It is not
required to close this layout-semantics umbrella.

## ADR Candidates

Constraint coexistence; breakpoint/context semantics; grid model; intrinsic
measurement ownership; translation/loss policy; inference safety; component-aware
resolution; incremental resolution; production conformance; animation/interruption.
