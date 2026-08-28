# Kernel And MCP Boundary

## Current facts

- `DocumentCommand` is closed, JSON-shaped, validated, invertible, and routed
  through `EditorKernel`.
- Transactions, undo/redo, revisions, page selection restoration, and camera
  history rules already live in the kernel.
- `scene-sync` provides revision rejection, snapshot fallback, and ephemeral
  presence, but not an MCP command room.
- `agent-activity.ts` provides local lifecycle/preview semantics, but no public
  transport, capability model, bounded query API, idempotency, or persistence
  receipt.

## Evidence

- ProseMirror demonstrates immutable documents and transaction-based changes:
  [Transactions](https://prosemirror.net/docs/guide/#transactions).
- React requires stable external-store snapshots:
  [useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore).
- MCP defines stateful tools but leaves authorization and human approval to the
  implementation:
  [MCP tools](https://modelcontextprotocol.io/specification/2025-06-18/server/tools).
- Yjs separates persisted document state from awareness/presence and treats
  remote work distinctly in undo:
  [Awareness](https://docs.yjs.dev/getting-started/adding-awareness).

## Provisional direction

Do not build MCP directly against React or raw document objects. First define a
transport-neutral room boundary with:

- bounded read/query surfaces;
- revisioned command envelopes;
- authoritative receipts and affected IDs;
- idempotency keys;
- persistence status;
- capability checks;
- explicit preview/commit/rollback ownership.

The first implementation may serialize one operation per file while the kernel
has one active transaction. Do not invent concurrent transactions until the
product requires them.
