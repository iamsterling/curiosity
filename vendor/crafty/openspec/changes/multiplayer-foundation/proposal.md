# Multiplayer foundation: per-document command sync and presence

Status: **Proposed**

## The Problem

The canvas is single-user. Every document invariant is already sync-shaped —
mutation flows through validated, invertible `DocumentCommand`s with an
explicit inverse, the kernel is zero-React and node-safe, and `scene-store`
owns the files — but there is no transport, no remote model, and no presence.
Two people cannot edit one file, and the marketing promise ("Give your agents
a real document") is incomplete without live collaboration on the same
document.

The transport question is settled by evidence: Next.js 16.3 route handlers
cannot host a WebSocket (no upgrade support in the installed docs; the
backend-for-frontend guide states connections close on timeout), so the
socket must live in a dedicated server sharing `scene-store`.

## The Decision

A **command-broadcast sync engine**, per document, in two slices.

**Slice 1 — the transport and relay (this change).** A WebSocket server
("sync face") runs alongside the editor zone (a CLI face and a compose
service), hosting one room per file slug. The server owns the authoritative
document and applies every inbound command through the **same kernel**
(`createEditorKernel`) used in the browser, so validation, inversion and the
schema-version rules hold on both sides of the wire. Broadcasts are
`{documentRevision, command}` packets; a client whose local base revision
diverges (its own unsynced edits) stops applying remote commands and requests
a snapshot. Presence is a separate ephemeral channel: pointer positions are
broadcast, throttled to the render loop, never persisted, and drawn as
renderer overlay commands under a bounded cursor budget.

**Slice 2 — conflict policy (next change, not this one).** Rebase semantics,
inverse-command undo across peers, and the diagnostic surface for
`DOCUMENT_*` rejection. Slice 1 ships last-writer-wins with kernel
validation: an invalid command is rejected on the server, the sender receives
the diagnostic code, and all peers refetch the snapshot. This is an honest
MVP — never silent substitution, matching the kernel's diagnostics doctrine.

The authored/resolved line is untouched: remote commands mutate the document
through the same validated path; presence is ephemeral editor state, never
serialized.

## Why not

- **CRDTs / OT.** The kernel's validated-invertible commands already give us
  a server-authoritative relay with client-side validation for free. A CRDT
  or OT layer would duplicate the command semantics in a second model —
  exactly the duplicated-coordinate-math failure mode this repo bans.
- **Server Actions / SSE.** The API is a save boundary by design; live sync
  needs a push channel, and the WebSocket is the only documented
  same-origin push transport the stack supports.
- **Peer-to-peer.** The document is a file owned by the server; the server
  is the natural relay and the existing save boundary stays intact.
