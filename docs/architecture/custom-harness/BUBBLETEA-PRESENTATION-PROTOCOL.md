# Bubble Tea presentation protocol v1

**Status:** Implemented opt-in experimental substrate — 2026-08-26  
**Authority:** [ADR-012](decisions/ADR-012-bubbletea-presentation-client.md)

ADR-013 restores the TypeScript renderer as the default terminal owner. This
protocol is active only when `CURIOSITY_TUI_CLIENT=bubbletea` is selected.

## Boundary

Protocol v1 carries presentation intent and read-only snapshots. It carries no
authentication secret, signed envelope, event append, approval signature, tool
grant, provider request, or supervisor request. Receiving a frame never makes a
domain transition by itself; the Bun host must use the existing signed command
port.

## Transport and handshake

1. Bun creates a fresh mode-0700 temporary directory, listens on a Unix socket,
   and generates a 32-byte random nonce.
2. Bun starts the exact validated Go executable without a shell. Only terminal
   metadata, the socket path, and the nonce are placed in its environment.
3. Go connects and sends `client.hello` containing the 64-character lowercase
   hexadecimal nonce.
4. Bun compares the nonce in constant protocol flow before sending any
   snapshot. A mismatch closes the session.
5. Bun accepts one client and closes the listening socket.

The wire format is newline-delimited UTF-8 JSON. Every envelope has exactly
`version`, `type`, and `payload`. Version is `1`; unknown envelope or payload
keys fail closed. The maximum encoded frame is 1 MiB and submitted text is at
most 64 KiB.

## Messages

| Direction | Type                 | Payload                                        | Meaning |
| --------- | -------------------- | ---------------------------------------------- | ------- |
| Go → Bun  | `client.hello`       | `{ nonce }`                                    | Bind this connection to the spawned client. |
| Bun → Go  | `host.snapshot`      | `TuiHostSnapshot`                              | Replace the read-only presentation projection. |
| Go → Bun  | `client.turn.submit` | `{ text }`                                     | Request host validation/signing/submission of one turn. |
| Bun → Go  | `host.error`         | `{ code }`                                     | Stable presentation/protocol rejection; not a domain event. |
| Go → Bun  | `client.quit`        | `{}`                                           | Close presentation after host lifecycle handling. |

`TuiHostSnapshot` contains actor/model/effort labels, working directory,
capability states, catalog names/digest, projected user/assistant text and event
sequences, pending submitted text, streamed presentation text, status, thread
ID/title, and a stable error tag. Host construction copies these fields
explicitly; structural extras from runtime options are not serialized. Thread
IDs and message sequences are presentation labels copied from projections, not
authority minted by Go.

## Ordering and concurrency

- The first host frame is a snapshot.
- Host writes are serialized in frame order.
- At most one turn may be active. A second submission receives
  `TUI_TURN_ALREADY_ACTIVE` and creates no signed command.
- Provider deltas update `streamingText` and enqueue snapshots; only the Bun
  provider gateway consumes the physical stream.
- Client reads continue while the turn promise is unresolved.
- On completion, the host refreshes durable message projections; the fallback
  view is derived from the already signed turn and its authoritative result.
- `client.quit` closes presentation but is not cancellation. The host waits for
  an active turn before authority disposal.
- The client labels `Esc`/`Ctrl-C` as detach or close, never interrupt, until an
  authoritative cancellation command exists.

Protocol v1 intentionally has no cancel frame. Adding one requires a signed
kernel cancellation command, durable attempt semantics, and a protocol version
change or backward-compatible capability negotiation.

## Fixed geometry

The frame always has exactly terminal width × terminal height cells. Header and
footer each use one content row plus one rail row. A non-idle main region keeps
five rows for activity, the three-row composer, and hints. At widths of at least
100 cells, an open inspector receives the `.pen` 35% split (bounded to 36–46
columns) plus a one-column divider; at smaller widths it replaces the main body
without changing the outer frame. The idle composer uses the `.pen` 760/1120
width ratio and the transcript uses its `.pen` horizontal inset. Streaming and
overlays never alter those allocations.

## Transcript viewport

- `Up`/`Down` and the mouse wheel move three rendered lines.
- `PgUp`/`PgDn` move one viewport page; `Home` moves to the beginning and `End`
  restores tail following.
- The viewport is bottom-pinned only while its offset is zero. New streaming
  lines preserve the visible anchor while the user is scrolled away from the
  tail.
- Scrolling changes only Go presentation state. It emits no protocol frame and
  cannot mutate canonical conversation state.

Required deterministic dimensions are 120×40 and 80×24. Golden coverage for
idle, session, palette, and inspector exists at both dimensions. Approval,
recovery, and plugin-operation goldens remain an explicit incomplete gate until
their authoritative kernel projections exist.

## Process and payload lifecycle

The Go module pins Bubble Tea v2, Bubbles v2, and Lip Gloss v2 in `go.mod` and
builds `native/tui/dist/curiosity-tui`. Experimental packaging embeds those
bytes in the Bun executable. At runtime, Bun computes SHA-256, publishes the
payload under `curiosity/experimental-runtime/<digest>/curiosity-tui`, verifies
readback, rejects symlinks/non-files, and fails on digest mismatch rather than
replacing corrupt bytes.

The outer experimental version binds the Git revision, source-snapshot digest,
combined embedded-payload digest, Bun compiler version, and a dirty marker when
applicable. A changed dirty build therefore receives a new immutable
installation directory instead of colliding with another `<revision>.dirty`
binary.

Socket, process, or frame failure may end presentation, but cannot grant a
capability, manufacture completion, or mutate canonical state outside the
signed command path.
