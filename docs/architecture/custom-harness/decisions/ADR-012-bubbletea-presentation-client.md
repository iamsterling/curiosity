# ADR-012: Bubble Tea v2 presentation client

**Status:** Accepted experimental client; default TTY ownership superseded by
[ADR-013](ADR-013-typescript-default-presentation.md) — 2026-08-26  
**Decision history:** Directed by the user after rejecting OpenTUI layout shifts
and accepting Bubble Tea v2 as the terminal presentation substrate.  
**Does not supersede:** ADR-001 through ADR-011. It does not authorize release,
production, signing, notarization, or non-Darwin qualification.

## Context

The TypeScript terminal renderer proved the visual vocabulary in `tui.pen`, but
continued growth would make terminal mechanics compete with the Effect
authority work. Its synchronous input loop also awaited provider completion, so
keyboard input and read-only inspection stopped while a turn streamed.

Bubble Tea v2 provides a message-driven terminal owner and declarative cell
view. It is selected over OpenTUI because fixed Curiosity regions must not shift
when stream text, overlays, or inspector data changes.

## Decision

Use a separately compiled Go Bubble Tea v2 process as Curiosity's terminal
presentation client:

```text
TTY → Go Bubble Tea v2 → nonce-bound local protocol → Bun presentation host
    → signed Curiosity command port → Effect authority → Rust supervisor
```

The Go process owns terminal mode, key decoding, cursor placement, and drawing.
It receives closed read-only snapshots and can request a turn, but it cannot
sign a command, append an event, dispatch a tool, interpret a provider stream,
or decide that work completed. The Bun host converts user intent into the same
signed command envelopes used before this ADR. Effect remains the sole domain
authority.

The region tree is derived only from terminal width and height. Stream deltas,
status changes, palette selection, and overlay content may replace cells inside
allocated regions but may not resize or reorder those regions.

The protocol and packaging contract are defined in
[`BUBBLETEA-PRESENTATION-PROTOCOL.md`](../BUBBLETEA-PRESENTATION-PROTOCOL.md).

## Invariants

- **ADR-012-I01:** the Go client has no event journal, authentication secret,
  provider SDK, tool dispatcher, or Rust-supervisor channel.
- **ADR-012-I02:** only the Bun host signs and submits Curiosity commands; all
  resulting state shown by Go is a projection or explicitly pending input.
- **ADR-012-I03:** terminal resize is the only input that changes region
  geometry.
- **ADR-012-I04:** the local protocol is versioned, closed, frame-bounded, and
  bound to a fresh 256-bit nonce on a private Unix-socket path.
- **ADR-012-I05:** a packaged Go payload is digest-verified before execution;
  corruption fails closed and is never silently replaced.
- **ADR-012-I06:** closing presentation does not assert cancellation. Until the
  kernel exposes a signed cancellation command and durable outcome, the host
  waits for an in-flight turn before disposing authority resources.
- **ADR-012-I07:** approval, recovery, and plugin-operation screens are not
  enabled from client-local state; each requires an authoritative kernel record
  and read-only projection.

## Consequences

Provider streaming and terminal input are now independent message sources, so
palette/inspector interaction no longer depends on provider completion. The Go
module is presentation-only and can be tested with deterministic dimensions.
The original default-ownership consequence was superseded by ADR-013 after the
Bubble Tea client failed interaction and visual-parity review. The client and
all authority-isolation invariants remain valid for explicit experimental use.

Adding a second process introduces protocol, lifecycle, and packaging work.
Actual turn cancellation remains unavailable rather than being simulated in the
client. Production distribution remains unqualified.

## Binary acceptance checks

- [x] **ADR-012-AC01:** Bubble Tea v2 is pinned and the Go module builds/tests
      independently of the Effect kernel and Rust supervisor.
- [x] **ADR-012-AC02:** 120×40 and 80×24 tests prove exact frame dimensions and
      stable composer/footer rows before and during streaming.
- [x] **ADR-012-AC03:** a test proves the host continues reading client messages
      while one authoritative provider turn is unresolved.
- [x] **ADR-012-AC04:** concurrent turn submission is denied rather than
      creating a competing authority path.
- [x] **ADR-012-AC05:** the palette inserts catalog text without submission and
      the inspector renders read-only capability/catalog projections.
- [x] **ADR-012-AC06:** the experimental package embeds and digest-materializes
      the Go client separately from the Rust supervisor.
- [ ] **ADR-012-AC07:** every `tui.pen` screen has approved 120×40 and 80×24
      golden output.
- [ ] **ADR-012-AC08:** approval, recovery, and plugin-operation screens consume
      authoritative kernel records with no client-authored transition.
- [ ] **ADR-012-AC09:** signed cancellation and its durable terminal outcome are
      implemented and qualified end to end.

## Non-goals

Making Go an application authority, adding a second provider loop, granting the
client direct SQLite or supervisor access, claiming that process exit cancels a
provider call, or qualifying release/distribution beyond the existing
experimental Darwin target.
