## Why

Crafty has a validated, invertible document kernel but no agent query or mutation
surface, so an AI client cannot inspect the live document, preview a change, commit
it through the same command path as a human, or receive a verifiable receipt. The
existing research defines the safe bidirectional shape; implementing the first
usable local bridge now turns that substrate into a real integration without
creating an agent-only document model.

## What Changes

- Add a scoped, serializable agent query API for document summaries, tree/node
  inspection, selection, resolved layout, diagnostics, and bounded change history.
- Add an in-process per-file command room that owns operation IDs, transaction
  lifecycle, base-revision checks, idempotency, bounded event delivery, and receipts.
- Expose preview, commit, rollback, receipt, and change-subscription operations over
  the command room; all writes use existing validated kernel commands and history.
- Add a local MCP server with a compact read/query and transactional write tool
  surface, using Streamable HTTP for the running web server and stdio for CLI/local
  agents over the same service interfaces.
- Add structured capabilities, stable diagnostics, affected-node/revision receipts,
  and explicit conflict behavior for stale or repeated operations.
- Add integration tests that exercise an agent operation from MCP request through
  kernel validation, persistence boundary, live subscription, and receipt.

Explicitly out of scope for this slice:

- Arbitrary JavaScript/plugin execution or direct JSON/filesystem mutation.
- CRDT/OT collaboration, multi-user conflict rebasing, or hosted authentication.
- Headless screenshot rendering, agent activity overlays, and browser-side approval
  chrome; the interfaces will leave room for those follow-on capabilities.
- Component/library resolution semantics that the current kernel does not implement.

## Capabilities

### New Capabilities

- `agent-command-room`: Scoped queries and transactional, revisioned agent operations
  with receipts, diagnostics, idempotency, and bounded change events.
- `canvas-mcp-bridge`: MCP tools/resources over stdio and Streamable HTTP backed by
  the command room, with capability-scoped access and actionable structured errors.

### Modified Capabilities

- None. No existing OpenSpec capability specs are present; this change introduces
  the first agent-facing contracts.

## Impact

- `packages/editor/src/kernel`: query projection, operation receipts/events, and a
  service adapter around `EditorKernel`; no renderer dependency is introduced.
- New agent/service package or subpath: transport-neutral command-room contracts and
  MCP adapters, depending only on the kernel and store boundaries allowed by the
  architecture.
- `apps/crafty-web`: authenticated-by-local-boundary Streamable HTTP MCP route and
  live-file room wiring; ordinary file APIs remain unchanged.
- `apps/cli`: stdio MCP face and local connection configuration.
- `packages/scene-store`: canonical document/revision persistence integration where
  required by the room; no arbitrary path access.
- Tests, package manifests, operator documentation, and an ADR for the new durable
  operation/transport boundary.
