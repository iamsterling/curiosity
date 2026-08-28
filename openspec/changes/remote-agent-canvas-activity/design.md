## Context

See `proposal.md` and the capability scenarios. Crafty's kernel already exposes
validated commands, transactions, projections, layout diagnostics and revisions.
The renderer already accepts host-composed ephemeral overlays. The current gap is
the service and event contract that connects a remote operation to those seams.

## Goals / Non-Goals

**Goals:**

- Make remote agent work visible in the active browser canvas.
- Keep the admin/CMS Next.js server as the remote MCP entry point.
- Keep document mutation in the shared kernel/command-room boundary.
- Make activity overlays generic enough for the Rust renderer to remain
  product-semantic-free.
- Make operation lifecycle, receipts, conflicts and failure states testable.

**Non-Goals:**

- Building a second document model in the CMS server.
- Arbitrary script execution or direct GPU control.
- Solving concurrent rebasing or collaborative merge semantics in this slice.
- Inventing a performance budget for shader or event throughput before fixtures
  exist.

## Decisions

### Gateway placement

The admin/CMS Next.js server hosts the remote MCP gateway because it already owns
authenticated server-side access. The gateway delegates to a shared application
service; it does not read or write files behind a running editor kernel.

**Alternative rejected:** route-handler-only mutation. It would bypass the live
file room and leave the browser canvas unaware of remote activity.

### Live event path

MCP request/response remains separate from the live browser event path. The
gateway publishes operation events to the per-file room; browser editors
subscribe to activity and committed document events. Streamable HTTP is the
remote transport; the room transport may use the dedicated sync face described
by ADR 0017.

**Alternative deferred:** using MCP notifications as the canvas synchronization
protocol. The browser must remain usable without an MCP client.

### Activity representation

Activity is a bounded ephemeral projection keyed by stable node IDs. The browser
resolves identity and phase into generic overlay geometry and visual parameters.
The renderer receives no agent identity, labels, permissions or operation
semantics.

**Alternative rejected:** serializing activity into `EditorDocument` or history.
It would violate the authored/ephemeral boundary and make agent presence undoable.

### Animated effect

Start with one generic activity-ring overlay descriptor. The Rust renderer may
animate it from a frame time, phase and seed, while TypeScript owns which nodes
and geometry are active. The shader is an implementation detail of the generic
overlay, not an agent protocol.

**Alternative deferred:** multiple shader families, measured particle budgets and
device-specific tuning. Those require committed fixtures and browser measurements.

### First implementation slice

Implement the shared contracts, local activity projection, overlay packet seam
and renderer effect before wiring the production remote gateway. This creates a
testable vertical slice and avoids claiming remote mutation support before the
file-room and canonical persistence boundaries are ready.

## Risks / Trade-offs

- [Risk] The gateway can acknowledge a mutation before the browser receives it. -> Use operation IDs, authoritative revisions and explicit room acknowledgements.
- [Risk] Current legacy Scene persistence loses authored data. -> Keep gateway commits behind the canonical document service and track persistence migration as a blocking milestone.
- [Risk] Shader work can obscure activity or consume unmeasured GPU budget. -> Bound overlay count, use a generic fallback visual treatment within the same renderer path, and measure before tuning.
- [Risk] Remote sessions can leave previews stranded. -> Lease transactions, roll back on disconnect/expiry, and publish terminal activity events.
- [Risk] A server-side MCP endpoint can become a second mutation path. -> Make the gateway depend on the same command-room/kernel service and add rejection tests for bypass attempts.

## Migration Plan

1. Add contracts and tests without changing authored document schema.
2. Add local browser activity projection and generic renderer overlay support.
3. Add gateway authentication, capability checks and operation receipts.
4. Connect gateway events to the per-file room and browser editor.
5. Enable remote commits only after canonical document persistence is available.
6. Roll back by disabling gateway write capability; existing human editing and
   renderer behavior remain available.

## Open Questions

- Which existing admin/CMS app path is the production gateway host after the
  current multi-zone layout settles?
- Should the first remote gateway transport be Streamable HTTP only, or also
  expose a local stdio bridge in the same milestone?
- What browser-compatible time source and frame synchronization should the
  first animated effect use? This can be answered during renderer implementation
  without changing the capability contract.
