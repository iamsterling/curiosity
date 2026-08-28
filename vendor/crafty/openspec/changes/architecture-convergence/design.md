## Context

See `proposal.md` for motivation. The research package in
`docs/research/architecture-convergence/` is the evidence base. Current code
already has a strong authored-document/kernel boundary and a coarse Rust/WASM
renderer packet, but transitional Scene side channels, duplicated hit-testing,
route/documentation drift, and incomplete automation seams make broad changes
risky.

This change is planning-only. It must not alter product code or document
behavior.

Delegated implementation has landed several small foundations while this change
was open. The design must describe them honestly without promoting them to
approved product contracts.

## Goals / Non-Goals

**Goals:**

- Preserve a verified baseline before any migration.
- Convert research into explicit ownership boundaries and staged checkpoints.
- Make future workspace/mode, MCP, renderer, animation, and code-mode decisions
  reversible until concrete consumers and measurements exist.
- Keep source/code contradictions visible and assign them to an explicit stage.

**Non-Goals:**

- Rewriting the editor, renderer, kernel, or persistence layer.
- Adding a generic plugin system or third-party extension API.
- Introducing a new document schema, public MCP API, Code mode, or animation
  runtime.

## Implemented Foundations Observed

- `packages/editor/src/ui/editor/workspace.ts` now describes the current
  first-party file workspace as `{ mode: "design", file: ... }`. This is a
  concrete descriptor for today's single workspace, not approval for a generic
  multi-workspace model.
- `packages/editor/src/kernel/agent-activity.ts` now exports a local
  transport-neutral command room over `EditorKernel` with bounded queries,
  capability checks, idempotent commit receipts, leases, preview/commit/
  rollback semantics, and separate persistence status tracking. It is still a
  local seam; no public MCP transport, server room, or save-boundary contract is
  ratified here.
- `packages/editor/src/kernel/projection-source-map.ts` now builds disposable
  text artifacts anchored to existing stable document ids. This proves the
  anchor vocabulary can stay document-derived, but it does not yet define a code
  surface, authoring UX, or command round-trip protocol.
- `packages/editor/src/kernel/animation-resolution.ts` now evaluates tween and
  spring playbacks deterministically over resolved scene values. It remains a
  kernel-only evaluation seam; no authored prototype records, preview mode, or
  render-loop integration consumes it yet.
- `packages/scene-renderer/src/scene-packet.ts` now isolates
  `sceneToRenderFrame` and `composeRenderFrame`. This is useful renderer
  boundary cleanup, but it is not evidence that packet transport is settled or
  that legacy `Scene` retirement is complete.

## Remaining Contracts and Gates

- A second real workspace/mode consumer must exist before broadening the
  current file-workspace descriptor into a general workspace registry.
- The command room still needs a scoped follow-up to define transport, actor
  identity, persistence/save wiring, operator review surfaces, and failure
  semantics outside the local process.
- Code mode still needs a ratified authored contract: what projection artifacts
  exist, how anchors map back to commands, and how refusal/diagnostics surface
  to users.
- Prototyping/animation still needs authored records, preview/runtime routing,
  and render-loop ownership before the evaluation seam can count as a delivered
  feature.
- Renderer migration still needs explicit parity tests, measurements, and a
  reversible Scene-retirement checkpoint.
- Architecture review remains a real gate; implementation-safe foundations do
  not waive it.

## Decisions

### Preserve the current runtime split

Keep Next.js responsible for route entry, server reads, metadata, and recovery
boundaries; keep the editor kernel authoritative for durable state and
mutation; keep React as chrome composition; keep the render loop outside React;
keep Rust/WASM/WebGPU behind a coarse versioned packet.

Alternative rejected: a unified React/workspace state model. It conflicts with
the existing external-store and direct render-loop invariants and would make
pointer/render performance harder to reason about.

### Model routes, workspaces, and modes separately

Keep the file route coarse. Treat workspace restoration and modes as typed
session concepts first. Introduce an internal first-party descriptor only when
a second real workspace requires it.

Reconciliation status: the first descriptor now exists for the current file
workspace only. The "second real workspace" condition has not been met.

Alternative rejected: route-per-mode. Prior art from Blender, Godot, Unreal,
VS Code, and Figma supports persistent shells with replaceable surfaces; route
remounting would risk expensive kernel/renderer lifecycle churn.

### Keep UI composition at the consumer

Export leaf primitives that own only their focused state/interaction contract.
The route/layout owns grouping, order, spacing, popover placement, and visual
variants. Radix/shadcn primitives provide accessible behavior but do not own
editor semantics or shell placement.

Alternative rejected: a selection toolbar/container component. It obscures
composition and recreates the mega-component failure this change is intended
to prevent.

### Build MCP above a transport-neutral command room

Before public MCP, define bounded queries, revisioned command envelopes,
receipts, idempotency, capability checks, persistence status, and explicit
preview/commit/rollback semantics. Reuse kernel commands rather than inventing
agent-only mutations. Initially serialize one operation per file if the
single-transaction kernel remains the constraint.

Alternative rejected: expose the React editor or raw document object directly.
MCP, multiplayer, scripts, and humans need the same validated semantic path.

Reconciliation status: the local command-room seam now exists in code, but the
transport, persistence boundary, and user-facing contract remain follow-up work.

### Migrate renderer boundaries incrementally

Measure serialization, packet cost, browser presentation, and device recovery
before considering binary transport or retiring legacy Scene. First confirm the
suspected split-path behavior in `rust/src/lib.rs`, then migrate one shape
family at a time with protocol and draw-order checkpoints.

Alternative rejected: immediate packet/Scene rewrite. The current side-channel
coupling is real debt, but a rewrite without measured parity risks draw-order,
glass, text, and recovery regressions.

Reconciliation status: extracting `sceneToRenderFrame`/`composeRenderFrame` is a
foundation step only; it does not satisfy the parity and measurement gates for
Scene retirement.

### Defer code and animation implementation behind projections

Future code surfaces use a projection/text model with stable node IDs or
anchors; validated commands remain the only durable write path. Future motion
uses trigger/action/transition/evaluated-value separation and resolved-time
values. These follow Monaco/CodeMirror/Zed and Rive/Motion lessons without
copying their runtimes.

Reconciliation status: both foundations now exist as pure utilities, but neither
has an approved authored contract or active product surface.

## Risks / Trade-offs

- [Research can become architecture astronautics] -> Require a concrete second
  consumer or measurement before adding a registry or new boundary.
- [Foundations can be mistaken for product approval] -> Keep the tasks split
  between landed utilities and unchecked product contracts/review gates.
- [Truth cleanup may expose compatibility breakage] -> Keep route/API smoke
  tests and make each cleanup checkpoint independently reversible.
- [One active kernel transaction limits coexistence] -> Start with serialized
  command-room operations; do not invent concurrency without a product case.
- [Scene retirement can regress rendering] -> Preserve protocol fixtures and
  compare draw order/pixels per migrated family.
- [Workspace state may later need shareable URLs] -> Keep a stable projection
  seam; do not serialize ephemeral state into the document prematurely.
