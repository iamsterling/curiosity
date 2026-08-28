# Multiplayer foundation — tasks

## Slice 1 (this change)

### Transport and server

- [ ] `packages/scene-sync` (new): the WebSocket server — rooms keyed by slug,
      `createEditorKernel` per room, `join`/`command`/`applied`/`rejected`/
      `snapshot` frames, presence relay (no storage).
- [x] `packages/scene-sync` client: a framework-agnostic `SyncClient` —
      connect, join, send commands, apply relayed commands on base-revision
      match, snapshot fallback on divergence/rejection, presence publisher
      throttled to the render loop.
- [ ] CLI: the sync face — `crafty serve` hosts the sync listener on the
      editor zone's port (custom server wrapping the Next handler) so the
      socket is same-origin.
- [ ] Compose: a `crafty-sync` service sharing the data volume, with the
      base app's rewrite table gaining the `/sync` upgrade path.
- [x] Wire protocol tests: join, applied ack, rejected code, snapshot
      fallback, revision mismatch, undo-as-inverse across two clients
      (kernel-driven, no browser, no network — the harness pattern).

### Client integration

- [ ] Editor zone: `CanvasEditor` gains an optional sync adapter — every
      `dispatch`/`dispatchBatch` mirrors to the sync client with the local
      base revision; remote commands enter through the same kernel path.
- [ ] Canvas stage: presence overlay composition (white dot + accent ring,
      ≤ 8 cursors, ÷zoom sizes) through `overlayCommands`.
- [ ] Diagnostics: divergence and rejection surface through the existing
      diagnostic channel with stable codes.
- [ ] Save boundary: sync never writes files directly; the existing autosave
      pipeline persists the server-authoritative document.

## Slice 2 (next change, not this one)

- [ ] Rebase semantics for local unsynced work instead of snapshot discard.
- [ ] Cross-peer undo/redo policy (undoing a remote edit's inverse).
- [ ] Room roster and peer lifecycle UI.
- [ ] Design review of the diagnostic surface for concurrent-edit conflicts.
