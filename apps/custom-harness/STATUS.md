# Custom harness status

**Status date:** 2026-08-25  
**Delivery:** repository and development only  
**Production, publication, and deployment:** disabled

## Current validated slice

- **FACT:** `createCuriosityHarness` owns one Effect `ManagedRuntime` and admits
  HMAC-authenticated, actor-bound, expiring command envelopes.
- **FACT:** static thread and chat plugins propose events; plugins cannot access
  SQLite, providers, or the domain writer.
- **FACT:** one SQLite transaction records actor-scoped command idempotency and
  immutable hash-linked events; the thread view rebuilds read-only from events.
- **FACT:** a nonce-bound Rust protocol-v1 supervisor handshake is mandatory.
  Filesystem mutation, Git, process, and sandbox capabilities are all disabled.
- **FACT:** the required `custom-harness` verification profile passes on the
  local Darwin development host and is wired into the Linux CI workspace lane.
- **FACT:** the prompt-first TUI submits signed chat turns without a title step.
  The Effect authority durably records the user turn, consumes the configured AI
  SDK stream, and records either assistant completion or a bounded failure.
- **FACT:** AI SDK 6 provider-registry adapters are wired for OpenAI, Anthropic,
  Google, OpenAI-compatible endpoints, and local community OpenAI OAuth.
- **FACT:** the dependency-light terminal client uses a small alternate-screen,
  line-diff renderer to reproduce OpenCode's splash, fixed composer/footer,
  user panels, unboxed streamed Markdown, completion metadata, and compact
  layout. Its bounded 12-fps braille work indicator changes one cell only and
  has a static reduced-motion form. Stable state glyphs and bounded output
  treatment follow Crush; OpenTUI is not imported.

## Boundaries

- **INFERENCE:** this slice establishes the independent authority direction; it
  does not yet establish crash-consistent hard-reset durability.
- **UNKNOWN:** real-host provider delivery, accounting, cross-process generation
  fencing, root-anchored filesystem enforcement, Git lifecycle, sandbox
  behavior, remote access, reconnect behavior, and iOS/iPad device behavior
  remain unqualified.
- OpenCode is a replaceable copied adapter and is not a Curiosity authority.
