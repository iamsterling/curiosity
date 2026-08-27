# ADR-013: TypeScript default presentation

**Status:** Accepted — 2026-08-26  
**Decision history:** Directed by the user after the Bubble Tea migration failed
visual and interaction-parity review.  
**Supersedes:** ADR-012 only for default terminal ownership. ADR-012's protocol,
packaging, and authority-isolation invariants remain controlling whenever the
experimental Go client is selected.

## Context

The existing TypeScript renderer has the clearer Curiosity interaction model and
the stronger implementation of the `tui.pen` vocabulary. The Bubble Tea client
regressed input discoverability, focus behavior, and visual hierarchy while its
approval, recovery, and plugin-operation projections remained incomplete.

A concrete focus defect reinforced the review: Bubble Tea's value-receiver
`Init` focused a copied textarea, leaving the live model blurred. That defect is
fixed for experimental use, but fixing it does not establish product parity.

## Decision

The TypeScript renderer again owns the TTY by default:

```text
TTY → TypeScript renderer → signed Curiosity command port
    → Effect authority → Rust supervisor
```

The Go Bubble Tea client remains packaged, tested, and presentation-only. It may
be selected explicitly with `CURIOSITY_TUI_CLIENT=bubbletea` for comparison and
continued migration work. Unknown client names fail closed. Default launch does
not execute the Go client.

Both clients remain non-authoritative. They may collect input and render
projections, but only the Bun host signs commands, Effect admits transitions,
and the Rust supervisor handles its narrow execution boundary.

## Invariants

- **ADR-013-I01:** absent configuration selects `typescript`.
- **ADR-013-I02:** only the exact values `typescript` and `bubbletea` are
  accepted; unknown values fail closed.
- **ADR-013-I03:** selecting either client does not change command, event,
  provider, approval, or supervisor authority.
- **ADR-013-I04:** Bubble Tea remains opt-in until a separate visual and
  interaction-parity review accepts it.
- **ADR-013-I05:** production, signing, notarization, release, and non-Darwin
  qualification remain unauthorized.

## Binary acceptance checks

- [x] **ADR-013-AC01:** configuration tests prove TypeScript is the default,
      Bubble Tea requires explicit selection, and unknown values fail closed.
- [x] **ADR-013-AC02:** the TypeScript session accepts immediate input and sends
      turns through the existing signed command path.
- [x] **ADR-013-AC03:** the Bubble Tea composer starts focused, exposes a real
      cursor, accepts text, and retains focus after companion-surface dismissal.
- [x] **ADR-013-AC04:** architecture checks keep Go presentation-only and keep
      SQLite admission, provider streams, and supervisor access behind their
      existing boundaries.
- [ ] **ADR-013-AC05:** Bubble Tea receives explicit user acceptance for visual
      and interaction parity before any future default-ownership decision.

## Consequences

The preferred terminal UX is restored immediately without deleting migration
evidence or weakening the authority boundary. Experimental packages still carry
the digest-verified Go payload, so comparison remains available at explicit user
request. Packaging is larger than strictly necessary until Bubble Tea is either
accepted or removed.
