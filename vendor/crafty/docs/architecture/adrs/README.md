# Architectural Decision Records

An ADR records a decision with a **large blast radius** — one that is expensive
to reverse, that several subsystems will depend on, or that future readers will
otherwise have to reconstruct from the code.

## When an ADR is required

Write one when the decision:

- moves the line between **authored** and **resolved** data,
- changes the **canonical document representation** or its schema in a
  non-additive way,
- changes the **command, transaction or history model**,
- changes the **renderer synchronisation protocol** or the JS/WASM ownership
  boundary,
- picks a **text rendering strategy** or a **layout engine**,
- defines **component-instance semantics** or **cross-file library references**,
- picks a **persistence format** or storage substrate,
- introduces a **collaboration model**,
- adds a **dependency whose license or size affects the core**,
- **reverses or narrows** an existing ADR.

## When one is not

Ordinary implementation choices. A new tool, a new panel, a refactor, a bug fix,
a test, a performance tweak backed by a benchmark. If the change is reversible in
an afternoon and nothing else depends on the choice, just make it.

Reasoning depth should scale with blast radius. An ADR for a trivial choice is
ceremony, and ceremony trains people to ignore ADRs.

## Retrospective ADRs are legitimate

Several decisions here were made in code first and written up afterwards. That is
fine and better than leaving them undocumented. Mark the status honestly.

## Status vocabulary

`Proposed` · `Accepted` · `Accepted — implemented` · `Accepted — not yet
implemented` · `Superseded by NNNN` · `Rejected` · `Historical`

## Current records

| # | Title | Status | Subject |
|---|---|---|---|
| [0001](0001-canonical-document.md) | Stable-ID Document Maps | Accepted — implemented | Normalised node maps with parent links and ordered children |
| [0002](0002-editor-kernel.md) | Renderer-Independent Editor Kernel | Accepted — implemented | Editing semantics in a TypeScript kernel, outside React and the renderer |
| [0003](0003-coarse-render-boundary.md) | Coarse WASM Render Protocol | Accepted — implemented | One versioned packet per frame, not per-shape calls |
| [0004](0004-explicit-tool-state.md) | Explicit Tool and Gesture State Machines | Accepted — implemented | Closed per-tool effect vocabularies; the accidental-rectangle fix |
| [0005](0005-layout-and-resolution.md) | Deterministic Resolution Before Rendering | Accepted — not yet implemented | Components, tokens, layout, state and animation resolve before packet generation |
| [0006](0006-agent-command-boundary.md) | Agents Use the Same Command Substrate | Accepted — not yet implemented | No agent-only mutation path |
| [0007](0007-typegpu-host.md) | TypeGPU Host Adoption (bounded) | Accepted — implemented (bounded) | TypeGPU runtime API; raw WGSL shaders; no bundler plugin |
| [0008](0008-next-server-runtime.md) | Crafty Ships a Next.js Server Runtime | Accepted — implemented (bundled runtime superseded by 0015) | Server Components + route handlers; the editor is a client island; distribution is a directory with a bundled Bun |
| [0009](0009-path-point-tangents.md) | Per-Point Tangents over Per-Segment Tangents | Accepted — implemented | Path handles live on the point (`(pointId, "in"\|"out")`); per-segment tangents deferred, with the flip trigger and mechanical migration path |
| [0010](0010-vello-wgpu-adoption.md) | Vello wgpu Adoption with Full Canvas Ownership | Accepted — implemented | Vello 0.9.0 wgpu line; the module owns device, surface, render and present; overlays draw in the scene after the authored packet; packet-only one-way crossing; **reverses ADR 0007's canvas role** (host keeps overlay composition and frame encoding) |
| [0011](0011-crafty-ui-format.md) | Crafty `.ui` Document Packages | Accepted — implemented | Directory package with canonical `EditorDocument`, manifest-last commits, optimistic revisions and legacy `scene.json` read conversion |
| [0012](0012-glass-fills.md) | Glass Fills: Backdrop Sampling with a Module-Owned Blur Pyramid | Accepted — implemented (headless) | Authored `GlassFill` union; module-owned blur pyramid + composite between scene and overlay renders; protocol v4 glass surfaces (v3 accepted); merged composition in v1; chrome glass is CSS `backdrop-filter` |
| [0013](0013-taffy-layout-core.md) | Taffy Behind a Versioned Layout Resolution Boundary | Accepted — implemented (foundation) | Crafty-owned layout IR, Taffy 0.13 evaluator, coarse subtree calls, behavior versions, and last-valid failure policy |
| [0014](0014-vector-editing.md) | Vector Editing: Point Types, Tools, Booleans, Compounds | Accepted — implemented | `set-point-type` conversion matrix + `auto` handle mode as authored intent (stores no handles, deterministic projection, demote-on-edit); pen/node tool effects in the interaction reducer; kernel-side boolean engine (split-then-classify, quantized topology grid, curve-fragment re-emission); the `compound` kind (authored members + operation, outline as resolved projection); host-composed path-command render channel (fixes the `SCENE_ADAPTER_UNSUPPORTED_KIND:path` crash) |
| [0015](0015-bun-runtime.md) | Bun as Package Manager and Bundled Runtime | Accepted — implemented | bun replaces npm for install, scripts, CI and the bundled runtime; the Next standalone server runs under a bundled bun binary |
| [0016](0016-block-compiler-lineage-retirement.md) | Block-Compiler Lineage Retirement | Accepted — implemented | The dormant lineage (19 packages, the VS Code extension, `apps/web`, its test workspaces) is deleted in one deliberate change; the launcher's old CLI faces are cut; the retained lessons were already absorbed into the canvas product |
| [0017](0017-multiplayer-command-sync.md) | Multiplayer as a Command-Broadcast Sync Engine | Proposed | One room per file slug; the server runs the same editor kernel and applies validated commands; clients apply relayed commands on base-revision match, else refetch a snapshot; presence is an ephemeral bounded overlay channel; no CRDT/OT — the kernel's validated invertible commands ARE the sync semantics |
| [0018](0018-semantic-surfaces.md) | Target-Neutral Semantic Surfaces | Accepted — implemented | Frames remain visual containers; schema-v4 semantic and relationship registries carry screen/layout/component/overlay intent, route intent, and non-canonical target bindings |
| [0020](0020-text-rendering-and-culling.md) | Text Rendering in Vello, and Viewport Culling of Authored Content | Accepted — implemented | Protocol-v5 embedded-Inter foothold and authored-rect culling; narrowed by ADR 0024 because malformed contour conversion is not fidelity evidence |
| [0021](0021-chrome-glass-returns.md) | Chrome Glass Returns: the Floating Chrome Wears the Module's Glass | Accepted — implemented | Floating chrome glass re-enters the module composite while content stays DOM; reverses ADR 0012 #6 |
| [0022](0022-component-definition-and-surface-identity.md) | Component Definition and Surface Identity | Accepted | Local definitions own reusable identity and link, but are not, component-role semantic surfaces |
| [0023](0023-canonical-dynamic-text-content.md) | Canonical Dynamic-Text Content in Document Schema v5 | Accepted — implemented | Required string content for text nodes; exact diagnostics; explicit v4→v5 migration and one-way compatibility boundary |
| [0024](0024-correct-embedded-inter-contours.md) | Correct the Embedded-Inter Contour Adapter as a Bounded Foothold | Accepted — implemented | Narrows ADR 0020: source contour topology is preserved and the 36-row controlled Metal oracle is exact, without selecting shaping or final realization |

Historical ADRs for the retired block-compiler lineage live in
[`../../adr/`](../../adr/).

## Template

```markdown
# ADR NNNN: <title>

Status: <Proposed | Accepted | Accepted — implemented | Superseded by NNNN | Rejected>
Date: YYYY-MM-DD

## Context

What is true today that forces this decision. Cite repository paths. Include the
constraint that makes the easy answer wrong.

## Constraints

The non-negotiables: invariants that must survive, performance limits, licensing,
platform support, what must remain testable headless.

## Options Considered

At least two, each with why it was plausible and why it lost. An ADR with one
option is a decision that was not made.

## Decision

The chosen option, stated plainly and narrowly. State explicitly what the
decision does NOT cover.

## Consequences

What becomes easier, what becomes harder, what new work this creates, and which
documents in `docs/architecture/` must change.

## Risks

What could make this wrong, and how it would show up.

## Validation

How we will know it worked. A test, a benchmark with a fixture and a recorded
environment, or a specific observable behaviour. "It felt better" is not
validation.

## Revisit When

The concrete trigger that should reopen this — a measurement crossing a
threshold, a platform capability landing, a scale being reached.
```

Number sequentially. Never renumber or delete a record: supersede it and link
both directions.
