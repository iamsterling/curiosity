# Layout Follow-On Competitive Research

Date: 2026-08-10
Status: research synthesis for `openspec/changes/layout-product-completion/`
Scope: the deferred product-level layout capabilities left after the authored-layout/Taffy foundation.

This report studies public documentation, specifications, engineering material and
source-level APIs. It extracts constraints and architectural lessons; no vendor
implementation or UI asset is copied into Crafty. Existing foundation evidence is
in `openspec/changes/authored-layout/`, `docs/research/layout-competitive-landscape.md`
and `docs/research/layout-systems.md`.

## Executive Summary

The field does not expose one universal "responsive layout" feature. Mature tools
compose separate systems:

- parent-driven flow (flex or grid)
- child-to-parent behavior for absolute children (pins/constraints)
- visual guides that do not affect layout
- sparse responsive overrides or container-size contexts
- a disposable resolved geometry projection

The most important interaction lesson is equally consistent: pointer movement
produces an ephemeral proposal, while a drop is one validated structural command.
Figma's insertion line, Webflow's separate parent/position indicators, Penpot's
automatic versus manual grid placement, Sketch's explicit stack exceptions, and
tldraw's history marks all support this separation.

The most important interoperability lesson is negative: arbitrary Figma, HTML/CSS,
SVG or published-site output is not losslessly bidirectional. Native metadata and
stable mappings can preserve intent for a controlled subset; otherwise imports
must retain observed geometry, report confidence/loss, and require explicit
conversion.

The most important runtime lesson is that intrinsic measurement and invalidation
are the hard part, not flex arithmetic. Text and images require constraint-aware
measurement keys; component and variant resolution must precede layout; incremental
resolution must remain equivalent to a full rebuild.

## Capability Findings

### 1. Layout editing interactions

Figma, Penpot, Sketch, Framer and Webflow all distinguish flow participation from
absolute positioning. Figma and Webflow make prospective placement visible; Webflow
additionally separates prospective parent from sibling position. Sketch exposes
stack exceptions and preserves-space behavior for hidden children. tldraw provides
the clearest public transaction model: history marks, rollback, squashing and
world-position-preserving reparenting.

Crafty conclusion: introduce a `DropProposal` as ephemeral state containing source
ids, target parent, operation, insertion index or grid cell, acceptance diagnostic
and the resulting command plan. Pointer move never mutates the document. Commit
must be one command/transaction with an exact inverse; cancel restores parent,
order, local geometry, participation and placement. Flow insertion, grid placement,
swap and absolute reparenting are different operations, not one generic move.

Sources:

- Figma, Guide to Auto Layout: https://help.figma.com/hc/en-us/articles/360040451373-Guide-to-auto-layout
- Penpot, Flexible Layouts: https://help.penpot.app/user-guide/designing/flexible-layouts/
- Sketch, Stack Layout: https://www.sketch.com/docs/designing/stack-layout/
- Framer, Stacks and Relative Positioning: https://www.framer.com/academy/lessons/framer-fundamentals-stacks-and-relative-positioning
- Webflow, Navigator: https://help.webflow.com/hc/en-us/articles/33961320786451-Navigator
- tldraw, Drag and Drop: https://tldraw.dev/sdk-features/drag-and-drop
- tldraw, History: https://tldraw.dev/sdk-features/history

### 2. Grid

CSS Grid and Penpot provide the most complete public model: tracks, cells, areas,
automatic placement, explicit placement, spans and absolute children. Figma's
grid is intentionally CSS-inspired rather than full CSS Grid, with product-specific
track and auto-placement semantics. Grid is not flex with another direction: it
solves two-dimensional tracks and spanning, while flex solves one-dimensional free
space.

Crafty conclusion: grid is a separate authored behavior and Crafty-owned IR. The
minimum durable vocabulary should distinguish fixed, fractional and content-sized
tracks; auto versus manual versus named-area placement; spans; row/column gaps;
and absolute escape. Preserve semantic child order separately from visual cell
placement. Reject full CSS parity, subgrid and every implicit-track corner case in
the first change until fixtures justify them.

Sources:

- W3C CSS Grid Level 1: https://www.w3.org/TR/css-grid-1/
- W3C CSS Grid Level 2: https://www.w3.org/TR/css-grid-2/
- Penpot, Flexible Layouts: https://help.penpot.app/user-guide/designing/flexible-layouts/
- Figma, Grid Auto Layout: https://help.figma.com/hc/en-us/articles/31289469907863-Use-the-grid-auto-layout-flow
- MDN, Grid auto-placement: https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout/Auto-placement

### 3. Constraints, pinning and responsive contexts

Figma constraints and Sketch pins are child-to-parent behavior for ordinary frame
children. They are not substitutes for auto layout. Framer and Webflow use sparse
breakpoint overrides; Framer emphasizes inherited primary-breakpoint values, while
Webflow exposes local override and reset states. CSS container queries demonstrate
that reusable components often need container-size context rather than viewport
breakpoints.

Crafty conclusion: keep constraints separate from flow. Define an explicit
coexistence policy, per-axis pin/center/stretch/scale semantics, and sparse
breakpoint or container-context overrides with a first-class unset/reset state.
Do not duplicate complete document trees per breakpoint. Do not allow a constraint
system to become a hidden solver with conflict-dependent behavior.

Sources:

- Figma, Constraints: https://help.figma.com/hc/en-us/articles/360039957734-Apply-constraints-to-define-how-layers-resize
- Sketch, Frames and sizing: https://www.sketch.com/docs/designing/frames/
- Framer, Breakpoints: https://www.framer.com/academy/lessons/framer-fundamentals-breakpoints
- Webflow, Breakpoints: https://help.webflow.com/hc/en-us/articles/33961300305811-Breakpoints-overview
- MDN, Container queries: https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_queries

### 4. Translation and import/export

Figma REST/plugin data, Penpot native archives, Sketch's versioned JSON schema,
Webflow's HTML/CSS/JS bundle and Framer's staged import workflow all show that
native representations preserve more intent than visual exports. HTML/CSS adds
cascade, pseudo-elements, generated content and runtime behavior that cannot be
recovered from computed boxes. SVG preserves geometry but not layout intent or
component identity.

Crafty conclusion: adapters must preserve source identity and observed geometry,
normalize only a declared subset, and emit structured loss diagnostics. A native
Crafty export may round-trip exactly; an annotated target projection can support
partial re-import; arbitrary external input is best-effort and never silently
canonicalized. Export manifests should list mappings, assets, unsupported features,
licenses and diagnostics.

Sources:

- Figma REST file endpoints: https://developers.figma.com/docs/rest-api/file-endpoints/
- Figma REST node types: https://developers.figma.com/docs/rest-api/file-node-types/
- Penpot file format: https://help.penpot.app/technical-guide/developer/data-model/penpot-file-format/
- Sketch file format: https://developer.sketch.com/file-format/
- Webflow code export: https://help.webflow.com/hc/en-us/articles/33961386739347-Code-export
- W3C CSS Flexbox: https://www.w3.org/TR/css-flexbox-1/
- W3C CSS Typed OM: https://www.w3.org/TR/css-typed-om-1/

### 5. Automatic layout inference

Figma's Suggest Auto Layout and Sketch's stack conversion are explicit authoring
operations. Framer guesses simple stack direction. The research literature treats
geometry-to-layout as an inverse problem: multiple programs explain one screenshot,
and multiple viewport samples materially improve disambiguation. No mature tool
claims inference is universally reliable.

Crafty conclusion: inference is a pure proposal generator, never part of resolution
or ordinary drag behavior. It should produce candidates, confidence, residuals,
explanations and rejected alternatives. Acceptance is one compound validated
command; low-confidence candidates cannot commit automatically. Preserve original
geometry until acceptance and make the operation reversible.

Sources:

- Figma, Suggest Auto Layout: https://help.figma.com/hc/en-us/articles/5731482952599-Toggle-on-auto-layout-in-designs
- Sketch, Rethinking layout with Stacks: https://www.sketch.com/blog/stacks/
- InferUI, ETH Zurich: https://sri.inf.ethz.ch/publications/bielik2018inferui

### 6. Intrinsic measurement and invalidation

CSS defines min-content, max-content and fit-content sizes. Chrome LayoutNG uses
explicit immutable inputs/outputs and fragment reuse; Yoga provides measure callbacks
and incremental layout; Taffy distinguishes known dimensions from available-space
constraints and has evolved its cache keys as correctness cases exposed missing
inputs. Images can change intrinsic size when metadata or decoding becomes available.

Crafty conclusion: measurement keys must include content/style/font/asset revisions
and the relevant known dimensions and available-space constraints. Invalidation
needs classes rather than one dirty bit: measurement, intrinsic contribution,
layout and paint. Full resolution remains the differential oracle. No performance
budget is adopted from competitor claims; Crafty must record its own fixture
distribution first.

Sources:

- CSS Sizing Level 3: https://www.w3.org/TR/css-sizing-3/
- CSS Images Level 3: https://www.w3.org/TR/css-images-3/
- Chrome LayoutNG: https://developer.chrome.com/docs/chromium/layoutng
- Chrome RenderingNG data structures: https://developer.chrome.com/docs/chromium/renderingng-data-structures
- Yoga incremental layout: https://www.yogalayout.dev/docs/advanced/incremental-layout
- Taffy measure example: https://github.com/DioxusLabs/taffy/blob/main/examples/measure.rs

### 7. Components and variants

Figma and Penpot both preserve a definition/reference relationship with instance
overrides and variant properties. Component changes propagate to instances; variant
changes can alter content, structure and sizing. The result is a dependency edge
from definition and selected variant to measurement and layout, not a detached copy.

Crafty conclusion: component expansion, variant selection and override application
must precede layout. Resolved nodes need provenance and reverse dependency indexes.
Missing/stale definitions and unavailable variant combinations produce diagnostics,
not silent fallback. This work changes the authored/resolved boundary and therefore
deserves its own change and ADR.

Sources:

- Figma, Auto Layout sizing API: https://developers.figma.com/docs/plugins/api/properties/nodes-layoutsizinghorizontal/
- Penpot, Components: https://help.penpot.app/user-guide/design-systems/components/
- Penpot, Variants: https://help.penpot.app/user-guide/design-systems/variants/
- React identity reference: https://react.dev/learn/preserving-and-resetting-state

### 8. Layout animation

Motion measures old and new resolved boxes and animates the visual projection;
Flutter implicit animations similarly keep authored destination state separate from
ephemeral frames. Transform-only animation avoids repeated layout but can distort
borders, radii and children. Interruption must retarget from the current visual
value, not stale start/end values.

Crafty conclusion: animation is a separate change after stable resolution and state
semantics. Time is explicit, frames are not serialized or historized, and undo acts
on the destination command. Layout animation should interpolate resolved boxes or
use a documented FLIP projection, never dispatch a document mutation per frame.

Sources:

- Motion layout animations: https://motion.dev/docs/react-layout-animations
- W3C Web Animations: https://www.w3.org/TR/web-animations-1/#animating-values
- Flutter AnimatedContainer: https://api.flutter.dev/flutter/widgets/AnimatedContainer-class.html
- SwiftUI Layout: https://developer.apple.com/documentation/swiftui/layout

### 9. Incremental recomputation and conformance

Chrome, Yoga and Taffy all demonstrate that incrementality is dependency-sensitive:
child output can affect intrinsic ancestors, sibling placement and track sizing.
The correct strategy is to compare immutable inputs, reuse only when the relevant
constraint context is equivalent, and compare incremental output to a full rebuild.
Web Platform Tests, Chromium layout/reftests, Yoga fixtures, Taffy tests and Flutter
goldens show that production confidence requires more than isolated snapshots.

Crafty conclusion: implement incrementality only after semantic producers are stable.
Maintain a full-resolution path as the oracle; add randomized/differential tests,
browser references, golden render tests and interaction/transaction tests. Record
node visits, measure calls, cache hits, invalidation propagation and p50/p95/p99 in
committed benchmark artifacts before setting budgets.

Sources:

- Web Platform Tests test types: https://web-platform-tests.org/writing-tests/test-types.html
- Chromium layout tests: https://chromium.googlesource.com/chromium/src/+/main/docs/layout_tests.md
- Yoga tests: https://github.com/facebook/yoga/tree/main/tests
- Taffy tests: https://github.com/DioxusLabs/taffy/tree/main/tests
- Flutter testing: https://docs.flutter.dev/testing/overview

## Cross-cutting Adopt / Adapt / Reject

Adopt: authored intent versus resolved geometry; explicit flow/absolute systems;
stable IDs and source mappings; sparse responsive overrides; constraint-aware
measurement; reference-plus-delta instances; full-resolution differential oracle;
proposal-before-commit interactions; structured diagnostics.

Adapt: Figma insertion lines and Suggest Auto Layout; Penpot CSS-aligned flex/grid;
Sketch pins and stack exceptions; Framer breakpoint inheritance; Webflow parent/
position indicators; tldraw history marks and world-preserving reparenting;
Chrome/Yoga/Taffy cache and invalidation concepts; Motion FLIP/interruption.

Reject: silent inference; arbitrary full CSS parity as an authored contract; complete
per-breakpoint document copies; layout results written into bounds; per-frame durable
mutation; detached component instances; single-size intrinsic caches; unmeasured
performance budgets; proprietary/source-available implementation reuse.

## Licensing and provenance

Research uses public product documentation, web standards and API/source references.
Figma, Sketch, Framer and Webflow are proprietary; tldraw is source-available with
commercial restrictions; Penpot is MPL-2.0. Crafty should independently implement
the behavioral lessons and record any dependency or adapter license decision in an
ADR before adoption.
