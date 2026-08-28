# Sync engine

## Purpose

Defines the per-document command relay: a WebSocket transport, server-side
kernel authority, revision-matched client application, and the loud rejection
surface. This is slice 1 of the multiplayer foundation — last-writer-wins
with validation, no rebasing.

## ADDED Requirements

### Requirement: The server is the cross-client authority for a room

Every file slug SHALL have one room. The server SHALL run the editor kernel
per room and SHALL apply every inbound command through `kernel.dispatch` /
`dispatchBatch` — the same validated, invertible command path the browser
uses. The server's document SHALL be persisted only through the existing save
boundary (`scene-store`); a room with no connected clients SHALL hold no
state beyond the file.

#### Scenario: Two clients edit one file concurrently

- **GIVEN** two clients connected to `/sync/files/card`
- **WHEN** client A dispatches a validated command
- **THEN** the server applies it, acknowledges A, and relays the applied
  command with the new `documentRevision` to B

#### Scenario: A command fails validation on the server

- **GIVEN** a client dispatches a command whose target node no longer exists
- **WHEN** the server applies it
- **THEN** the sender receives `{ type: "rejected", code }` with the stable
  machine code (e.g. `DOCUMENT_NODE_MISSING:<id>`), the document is never
  substituted, and the sender requests a snapshot

### Requirement: Clients apply remote commands only on a matching base revision

A client SHALL apply a relayed command only when its local document revision
equals the command's `baseRevision`. On any mismatch — or after a rejection —
the client SHALL request and apply a snapshot via `replaceDocument` and SHALL
surface a diagnostic. Local unsynced work is discarded loudly, never merged
silently.

#### Scenario: A client has local unsynced edits when a peer command arrives

- **GIVEN** client A has dispatched two commands the server has not yet acked
- **WHEN** a peer command with a non-matching `baseRevision` arrives
- **THEN** A discards its unsynced previews, applies the snapshot, and
  reports the divergence diagnostic

### Requirement: Undo and redo travel as inverse commands

`undo`/`redo` SHALL dispatch the kernel's explicit inverse command to the
server like any other edit, so it is validated server-side before applying.
History entries SHALL never be broadcast.

#### Scenario: Undoing an edit while a peer is connected

- **GIVEN** a client performs an edit, then undoes it
- **WHEN** the inverse command reaches the server
- **THEN** the server validates and applies it, and peers converge on the
  pre-edit document state

### Requirement: Unknown schema versions are rejected, never coerced

A client whose document schema the server does not support SHALL receive the
rejection code and SHALL refuse to join the room.

#### Scenario: A client with a future schema version joins

- **GIVEN** a client serializes a document with an unsupported
  `schemaVersion`
- **WHEN** it attempts to join
- **THEN** the server rejects the join with the stable code and the client
  refuses to open the room
