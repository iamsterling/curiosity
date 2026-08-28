# ADR 0017: Multiplayer as a Command-Broadcast Sync Engine

Status: Proposed
Date: 2026-08-09

## Context

The canvas is single-user. The document model was built sync-shaped without a
transport: every mutation is a validated, invertible `DocumentCommand` with an
explicit inverse; the kernel is zero-React and node-safe; `scene-store` owns
the files; the save boundary is the only cross-process path. Live
collaboration per document was requested ("true websocket/multiplayer per
document") and the product direction calls for agent-native creation — an
agent and a human editing the same file is the same problem as two humans.

The transport is constrained by evidence: Next.js 16.3 route handlers cannot
host a WebSocket (no upgrade support in the installed docs), so the socket
must be a dedicated server sharing `scene-store` — a new face in the CLI's
zone launcher and a service in the compose stack.

## Decision

Collaboration is a **server-authoritative command-broadcast relay**: one room
per file slug; the server runs the same editor kernel per room and applies
every inbound command through the validated dispatch path; clients apply
relayed commands only when their local base revision matches, else they
refetch a snapshot. Presence is a separate ephemeral channel — pointer
cursors relayed and dropped, drawn as host-composed overlay commands under a
bounded budget, never authored or serialized.

Deliberately rejected:

- **CRDT / OT layers.** They would duplicate command semantics in a second
  model — the duplicated-math failure mode this repo bans. The kernel already
  gives validation and explicit inverses; undo under sync is the inverse
  command traveling the same wire.
- **Client-authoritative merging.** The document is a file owned by the
  server; the server is the natural authority and the existing save boundary
  stays intact.
- **Syncing selection, hover, or history.** Those are ephemeral editor state
  by invariant; only the pointer cursor is presence.

Conflict policy for slice 1 is last-writer-wins with validation: an invalid
command is rejected loudly with its stable code, never substituted. Local
unsynced work on divergence is discarded with a diagnostic, not silently
merged — a documented limitation that slice 2 (rebasing) replaces.

## Consequences

- The kernel becomes a shared authority across processes — its validation and
  inversion guarantees are now load-bearing on both sides of the wire. Tests
  must cover server-side rejection of every documented failure mode.
- The editor zone's process hosts the sync listener (custom server wrapping
  the Next handler), so the socket is same-origin and needs no upgrade proxy
  in the CLI face; the compose face needs the `/sync` upgrade path in the
  base rewrite table.
- The rest camera (`set-page-viewport`) is broadcast like any command —
  peers' rest cameras converge, which is desired for shared files.
- Performance: presence is bounded (8 cursors) and throttled to the render
  loop; commands are small and per-edit, never per-frame.
- The save pipeline is unchanged; a file with no live room is exactly today's
  file.
