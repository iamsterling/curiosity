## Why

Crafty has a validated editor kernel and a Rust canvas, but no way for a remote
agent operation to become visible while it is happening. A remote MCP gateway
from the admin/CMS server can make agent work observable and interactive if it
uses the same per-file command boundary as the browser editor.

## What Changes

- Add a remote agent operation contract for scoped activity, preview, commit,
  failure and completion states.
- Add an ephemeral canvas activity projection keyed by stable node IDs.
- Render agent activity with generic renderer overlay data and an animated Rust
  shader/effect, without putting agent semantics into authored documents or the
  renderer protocol.
- Define the admin/CMS-hosted MCP gateway boundary and its connection to the
  per-file command room.
- Require revision checks, capability authorization, idempotent commits and
  structured receipts for remote mutations.
- Add implementation milestones and issue/PR slices so the gateway, room,
  visual activity and verification work can be reviewed independently.

Out of scope for this change:

- Arbitrary JavaScript execution by agents.
- Direct agent access to React, Rust/WASM or GPU resources.
- Canonical document persistence migration in the first visual slice.
- Full multi-agent rebasing, CRDT or OT behavior.
- Headless screenshot infrastructure beyond the contract and integration seam.

## Capabilities

### New Capabilities

- `remote-agent-canvas-activity`: Remote agent operations are authorized,
  revision-aware and visibly represented around affected canvas elements.

### Modified Capabilities

- None.

## Impact

- `packages/editor`: ephemeral agent activity state and operation contracts.
- `packages/scene-renderer`: generic bounded activity overlay data and animated
  rendering support.
- `apps/crafty-web` or the current admin/CMS Next.js server: remote MCP gateway
  adapter and authentication boundary.
- Future per-file command-room/sync service: operation event fan-out to browser
  editors.
- Tests across editor and renderer packages; no new external dependency is
  required for the first slice.
