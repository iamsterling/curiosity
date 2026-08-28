# Agent-Native Editing

Status: **Target.** No agent mutation surface exists for the canvas today. The
principles are recorded now, before the first one is built, so it cannot invent a
second mutation model.

Ratified by [ADR 0006](adrs/0006-agent-command-boundary.md).

## The one rule

**Agents and humans converge on the same mutation substrate.**

A human drag and an agent instruction both end in
`applyDocumentCommand`. There is no agent-only write path, no "just edit the
JSON" escape hatch, and no privileged API that skips validation.

This is not a safety nicety. A second mutation path means a second place where
invariants can be violated, a second undo model, a second thing to test, and
divergent behaviour between what a user does and what an agent does to the same
document.

## Why the substrate is already suitable

The kernel was designed for this without agents existing yet:

- `DocumentCommand` is a **closed union of plain serializable values**
  (`packages/editor/src/kernel/commands.ts:4`). A command is a JSON object; an
  agent can produce one.
- Every command is **validated** before it lands (I13) and **invertible** (I14).
- **Transactions** give batch semantics with all-or-nothing rollback (I17, I18).
- The document has **stable ids** (I1), so an agent can name a node without a
  path that changes under it.
- Commands report **`changed`**, so an agent can tell a real edit from a no-op.

What is missing is not the substrate. It is the query side, the batching
envelope, and the receipt.

## What an agent surface needs

### 1. Query before mutate

An agent cannot edit what it cannot describe. Needed, and absent:

- read the document structure (pages, hierarchy, node properties) in a stable,
  serializable shape,
- resolve names to ids,
- query by spatial region, by kind, by property,
- read the *resolved* view, not just the authored one, once resolution exists —
  an agent asking "what colour is this button" wants the resolved value.

`EditorKernel.getProjection()` is the seed of this. It returns the whole
document; a real query API needs to scope and page.

### 2. Batch, transactional operations

```
beginTransaction(label)
  preview(commands[])   → diagnostics, no history
commit() | rollback()
```

Already implemented (`kernel.ts:151-167`). An agent operation is a transaction
with a label, so an agent edit is **one undo step** with a human-readable name —
not forty.

### 3. Preview and diagnostics before commit

An agent should be able to ask "what would this do?" and get structured
diagnostics: what would be created, moved, deleted; which commands are no-ops;
which would fail preconditions and why. The paste path already demonstrates the
shape — `PasteOutcome` carries `mintedRootIds` and typed `PasteDiagnostic[]`
(`clipboard.ts:59`).

Errors already carry machine-readable prefixes (`DOCUMENT_NODE_MISSING:<id>`,
`DOCUMENT_PASTE_ID_COLLISION`, `EDITOR_TRANSACTION_ACTIVE`). Keep that; do not
degrade to prose.

### 4. Receipts

Every agent-originated transaction should produce an inspectable record:

```
{ label, commands[], inverses[], changedNodeIds[], diagnostics[], documentRevision }
```

`HistoryEntry` (`kernel.ts:27`) is already most of this. A receipt makes agent
edits reviewable and, because inverses are included, trivially revertible.

### 5. Visual verification

An agent should be able to see what it made. The pieces exist:

- `POST /api/files/<slug>/snapshot` returns canonical bytes plus a sha256 of a
  projected frame — deterministic and content-addressed.
- The Rust encoder is deliberately backend-independent, so a headless render path
  is a real possibility ([`wasm-boundary.md`](wasm-boundary.md)).

What is missing is an offscreen render host that produces an image without a
browser. That is the single highest-value addition for agent workflows.

## Rules

- **Agents obey every document invariant humans do.** No relaxed validation, no
  "trusted" flag. See [`invariants.md`](invariants.md).
- **No direct mutation of serialized state.** An agent must not write
  `scene.json` or `document.json` behind the running kernel. Concurrency and
  validation both break.
- **Every agent operation is transactional and labelled.** One logical operation,
  one history entry, one name.
- **Diagnostics over guesses.** If a reference cannot be resolved, report it.
  Never silently pick a plausible node.
- **Idempotence where possible.** Prefer commands that are safe to reapply, and
  make `changed: false` meaningful.
- **The agent surface is a product capability, not a shadow architecture.** If a
  capability is useful to an agent (query, preview, diff, receipt, headless
  render), it is almost certainly useful in the UI too. Build it once.

## Prior art

The retired block-compiler lineage (ADR 0016) implemented an MCP server over its
product, and `docs/adr/0004-thin-mcp-boundary.md` records the principle from that
era: *MCP tools must call the same core services used by the CLI*. That ADR's
product context is obsolete; its principle is not, and it is restated here for
the canvas.

`packages/mcp` was deleted in the working tree. Whatever replaces it must be a
thin wrapper over kernel commands, not a parallel implementation.

## Sequencing

1. **Query API** over the kernel projection — scoped, serializable, stable.
2. **Transactional batch execution** with diagnostics — mostly wiring what
   exists.
3. **Receipts** derived from `HistoryEntry`.
4. **Headless render** for visual verification.
5. A transport (MCP or otherwise) that is a thin adapter over 1–4 and adds no
   semantics of its own.

Do not start at step 5.
