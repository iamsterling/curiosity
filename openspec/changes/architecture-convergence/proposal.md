## Why

Crafty's product surface has converged faster than its implementation and
architecture documentation. The current kernel, React, Next.js, persistence,
and Rust/WASM renderer boundaries contain strong foundations, but also
transitional Scene paths, duplicated hit-testing/coordinate ownership, route
drift, stale documentation, and unfinished automation seams. Research is now
needed before any broad refactor so the current product behavior is preserved
while future workspaces, modes, MCP, animation, and code surfaces gain obvious
ownership boundaries.

Some delegated implementation has since landed safe internal foundations in the
repo. This change now needs to distinguish those completed foundations from the
still-unratified product contracts and approval gates they were meant to
support.

## What Changes

- Preserve and record the current baseline before architecture changes.
- Produce an evidence-backed current-state architecture map and research corpus.
- Reconcile the planning artifacts with the delegated foundations that now
  exist in code: the first-party file workspace descriptor, the local
  command-room/receipt seam, projection source-map anchors, deterministic
  animation evaluation, and extracted scene-packet composition.
- Keep explicit product contracts and gates open for anything not yet ratified:
  second-workspace generalization, public MCP transport, authored code
  projection semantics, authored prototyping/animation semantics, and legacy
  Scene retirement.
- Treat route/documentation drift, remaining duplicated hit-testing/coordinate
  ownership, renderer migration checkpoints, and command-room persistence
  integration as investigated follow-up work rather than silently declaring
  them complete in this change.

## Capabilities

### New Capabilities

None. This change produces research and architecture planning artifacts; it
does not introduce a user-facing capability or ratify an implementation
contract. Internal utilities that landed while this change was open remain
foundations until a scoped follow-up change turns them into product behavior.

### Modified Capabilities

None. No existing behavioral requirement is being changed in this planning
change.

## Impact

- Planning artifacts under `openspec/changes/architecture-convergence/`.
- Research artifacts under `docs/research/architecture-convergence/`.
- Reconciliation evidence taken from current implementation in
  `packages/editor/src/kernel/agent-activity.ts`,
  `packages/editor/src/kernel/projection-source-map.ts`,
  `packages/editor/src/kernel/animation-resolution.ts`,
  `packages/editor/src/ui/editor/workspace.ts`, and
  `packages/scene-renderer/src/scene-packet.ts`.
- Future implementation may affect `packages/editor`, `packages/scene-renderer`,
  `packages/scene-store`, and the editor app surfaces, but no product code is
  changed by this proposal.
- `skip_specs: true` is intentional because this change has no spec-level
  behavior delta; implementation changes must receive their own scoped specs
  or change proposals when the target is approved.
