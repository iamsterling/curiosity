# Multiplayer foundation — design

## Prior art

Published material only (no source copied): Figma's multiplayer engineering
posts (the "document is a tree of changes", server-authoritative ordering,
selection/presence as ephemeral state), Penpot's architecture notes (per-file
rooms, presence channels separate from content), and the WebSocket protocol
spec. **Adopted:** server-authoritative command ordering, per-document rooms,
ephemeral presence divorced from authored state. **Rejected:** CRDT/OT
transform layers, position-indexed identity (the repo's array-position ban
extends to sync), client-authoritative document merging.

## Transport

The sync face is a small Node WebSocket server sharing `scene-store`:

- **CLI face.** `apps/cli` gains a `sync` face: `crafty serve` spawns it
  alongside the zone servers. The editor zone's process hosts the listener
  (a custom Node server wrapping the Next request handler — the CLI already
  launches the zone servers, so the socket is same-origin with `wss://` on
  the same port and needs no upgrade proxy). Next 16.3 route handlers cannot
  host upgrades (verified against the installed docs).
- **Compose face.** A `crafty-sync` service in `compose.yaml` runs the same
  server (the editor zone's public port), sharing the data volume; the base
  app's rewrite table gains `/sync` with an upgrade-aware proxy. The CLI and
  compose faces are the same code, different launch modes.

Room address: `/sync/files/<slug>`. The server reads the file from
`scene-store` on first join and applies commands to its in-memory kernel;
persistence stays on the existing save boundary (the kernel's document
revision + the current save pipeline), so a file with no live room is exactly
today's file.

## The wire protocol

One JSON frame type family, versioned with a protocol marker:

```ts
// Client → server
{ type: "join", room: "/sync/files/<slug>", clientId, baseRevision }
{ type: "command", command: DocumentCommand, baseRevision }   // sent on every local dispatch
{ type: "presence", point?: Point, tool?: EditorTool }         // throttled to the render loop

// Server → client
{ type: "snapshot", document: EditorDocument, documentRevision }  // on join or divergence
{ type: "applied", command, documentRevision }                     // acked, then broadcast to peers
{ type: "rejected", command, code, documentRevision }              // validation failure, loud
{ type: "presence", clientId, point, tool }                        // relayed, ephemeral
```

The `baseRevision` field is the client's local document revision **before**
applying the command — the same value the kernel's undo stack records.

## Server authority

The server runs `createEditorKernel` per room. Every inbound `command` goes
through `kernel.dispatch` (or `dispatchBatch` for transaction commits — the
client sends batched commands as one frame with one revision):

- Success → `{ type: "applied" }` back to the sender, `{ type: "applied" }`
  to every peer, with the new `documentRevision`.
- Validation failure → `{ type: "rejected" }` with the stable machine code
  (`DOCUMENT_NODE_MISSING:<id>`, etc.). **Never a substituted document.** The
  sender applies the rejection and requests a snapshot.

The client kernel applies remote `applied` commands **only when its local
base revision matches** the command's (no local unsynced edits in flight).
On mismatch — or on `rejected` — the client requests and applies a snapshot:
`replaceDocument` exists and is the honest merge: local unsynced work is
discarded with a diagnostic (slice 2 replaces this with rebasing). This is
last-writer-wins with validation, documented as such.

**Undo/redo under sync (slice 1):** the kernel's commands carry explicit
inverses, so undo sends the inverse command to the server like any other
edit — the inverse is validated there before it applies. Undo of a remote
edit is therefore possible, and the local undo stack stays intact. History
entries themselves are never synced (ephemeral editor state).

## Presence

`presence` frames carry only the pointer world point and tool. Server relays
to the room without storing; the client holds a bounded map (max 8 remote
cursors — the overlay budget doctrine; extra cursors drop in join order).
Rendering: host-composed overlay draw commands through the existing
`overlayCommands` channel (like the pen session and selection overlays) —
no new packet types, no Rust changes. Each cursor is a small white dot with
the peer's accent ring, screen-constant size (÷zoom at the point of use).
Presence is never authored, never serialized, never in history.

## The authored/resolved and ephemeral lines

- Remote commands are **authored** mutations via the validated command path.
- Presence, remote cursors, the connection state and the room roster are
  **ephemeral editor state** — the projection may expose them (a
  `remotePresence` slice), but `snapshotForSave` never serializes them.
- The renderer receives presence only as overlay commands — the packet
  carries no product semantics and no new protocol version.

## Interaction with existing invariants

- The kernel remains the single owner of document truth on each side; the
  server's kernel is the cross-client authority.
- `set-page-viewport` (rest camera bookkeeping) is broadcast like any
  command — peers' rest cameras converge, which is the desired behavior for
  shared files.
- Selection and hover are NEVER broadcast (per-client ephemeral), except the
  presence pointer.
- Schema versioning: a client with an unsupported document schema receives
  the snapshot rejection code and refuses to join — unknown versions are
  never coerced.
