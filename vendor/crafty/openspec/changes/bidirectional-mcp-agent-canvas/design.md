## Context

See `proposal.md` and the two capability specs for motivation and observable
behavior. The current repository has a validated `DocumentCommand` union and
transaction-capable `EditorKernel`, plus an in-memory `packages/scene-sync`
room that demonstrates revision checks but has no query, persistence, receipt,
or MCP boundary. The current web editor is `apps/web/editor`; the CLI is
`apps/cli`. There is no existing MCP dependency or MCP server.

The design must preserve the authored-document boundary, keep the renderer out
of mutation, and avoid treating the lossy legacy `Scene` projection as an agent
write surface.

## Goals / Non-Goals

**Goals:**

- Provide one transport-neutral service for scoped reads and revisioned agent
  operations.
- Reuse `EditorKernel` validation, transactions, inverses, history, and
  document revisions rather than duplicating command semantics.
- Make local stdio and web Streamable HTTP adapters behaviorally equivalent.
- Return bounded structured data and stable diagnostics suitable for model use.
- Keep commit idempotency, capability checks, and room lifecycle outside the
  document schema.

**Non-Goals:**

- No arbitrary code execution, plugin API, filesystem path API, CRDT, or OT.
- No hosted multi-tenant authentication in the first implementation.
- No screenshot/headless render service or persistent agent overlay in this
  change; receipts expose an explicit not-available render status.
- No component/library resolution beyond the current projection behavior.

## Decisions

### 1. Add a transport-neutral agent service before MCP

The core service will own file scope, query shaping, operation envelopes,
transaction lifecycle, revision checks, idempotency records, receipts, and
bounded events. MCP handlers and the CLI adapter will be thin serializers over
it. This follows the historical ADR 0004 principle and the bidirectional MCP
research recommendation to keep MCP out of product semantics.

**Alternatives considered:** putting MCP handlers directly in the Next route
would be faster initially but would make stdio, HTTP, and future browser
clients diverge. Extending `scene-sync` in place would inherit its optimistic
client protocol and lack of persistence/receipt semantics; instead, its room
validation patterns will be reused or factored into the new service.

### 2. Use one kernel instance per authoritative file room

The room will load the canonical `EditorDocument` through `scene-store`, create
one `EditorKernel`, and serialize operation commits per file. A successful
operation uses `beginTransaction`/`preview`/`commit`, producing one history
entry. Stale base revisions fail before command application; no silent rebase
is introduced.

**Alternative considered:** applying commands directly to a freshly loaded
document on every request would lose live editor state, history, and concurrent
operation ordering, so it is rejected.

### 3. Keep wire commands typed and JSON-shaped

The operation envelope carries file/page, operation/transaction IDs, label,
base revision, idempotency key, and a bounded `DocumentCommand[]`. MCP input
schemas validate envelope shape and limits, while the kernel remains the final
authority for command validity. No stringified JavaScript or JSON patch format
will be accepted.

**Alternative considered:** JSON Patch is broadly available but cannot express
Crafty's inverse/history granularity safely and would create a second command
compiler.

### 4. Use the official TypeScript MCP SDK with two adapters

The MCP package will use the official TypeScript SDK and expose the same tool
registry through stdio and Streamable HTTP. The HTTP route will be local-first
and capability-gated; it will not accept arbitrary file paths. The CLI face
will resolve a configured data directory/file slug and run the stdio transport.

**Prior art relationship:** this follows MCP's standard transport model and
the research findings for Pen.dev, Paper, and Figma local/hosted parity, while
rejecting their arbitrary code/plugin execution patterns.

### 5. Use explicit capability and bounded-resource policies

The first local policy will issue a process-scoped principal with configured
file capabilities. Every handler checks operation capability and file scope
before calling the room. Limits cover command count, request bytes, query
result size, receipt retention, event queue length, and open transaction age.
These are correctness/security limits, not invented performance budgets.

### 6. Persist after commit and report persistence separately

The room commits the kernel transaction, then writes the canonical document via
the document-native store boundary. A receipt distinguishes `committed` from
`persisted`; a failed persistence write returns a recovery diagnostic and does
not claim durable success. Render verification is initially `unavailable`,
because the documented headless render host does not exist yet.

### 7. Keep event delivery typed and bounded

Room events are operation-level events only: started, preview updated/cleared,
committed, rolled back, rejected, conflict, and revision changed. Subscribers
receive a file-scoped bounded stream with sequence numbers. Pointer moves and
individual renderer frames are excluded. The existing kernel `subscribe` is
not replaced; the room derives events at operation boundaries.

## Risks / Trade-offs

- [Risk] A process-local room can diverge when multiple server processes own the
  same file. -> The first deployment runs one authoritative local process per
  data directory; multi-process ownership is explicitly rejected with a room
  identity/lock diagnostic until a durable room service is designed.
- [Risk] A kernel commit followed by persistence failure leaves an in-memory
  committed revision that is not durable. -> Receipts report separate states,
  the room marks recovery required, and the process must reload/reconcile before
  accepting further durable operations.
- [Risk] MCP client support for Streamable HTTP session behavior varies. -> Keep
  the service transport-neutral, test the official SDK client/server pair, and
  retain stdio as the deterministic local fallback.
- [Risk] Whole-document query responses can exhaust model context. -> Require
  bounded summaries, scoped node/tree queries, and explicit limits; never expose
  an implicit unbounded snapshot tool.
- [Risk] The current kernel does not expose enough history detail for perfect
  receipts. -> Add a typed operation receipt at the service boundary and expose
  only command/inverse/affected-ID data that can be proven from the operation;
  do not fabricate renderer or semantic resolution results.

## Migration Plan

1. Add the transport-neutral service and tests without changing existing editor
   or sync behavior.
2. Add canonical store loading/writing and local room lifecycle tests.
3. Add MCP package/tool schemas and stdio integration tests.
4. Add the local Streamable HTTP route in `apps/web/editor` and route-level tests.
5. Add the CLI MCP face and operator documentation/configuration.
6. Enable the surface only when explicitly configured; existing editor, API,
   and CLI faces remain unchanged when it is disabled.

Rollback is disabling the MCP route/CLI face and removing room instances; no
document schema migration is required. Committed document files remain valid
because all writes use existing kernel commands and canonical persistence.

## Open Questions

- The exact local capability token configuration can be finalized during
  implementation without changing the operation or MCP contracts, provided
  unauthenticated default access remains disabled outside an explicitly local
  process.
