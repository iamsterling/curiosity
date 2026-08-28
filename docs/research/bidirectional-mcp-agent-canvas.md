# Bidirectional MCP and Agent-Visible Canvas Research

Status: **Proposed research**, 2026-08-10. This report studies public product
behavior and Crafty's current implementation. It does not describe an existing
MCP surface.

## Executive Summary

The useful part of "bidirectional MCP" is not MCP transport by itself. The
products studied converge on a live editor bridge:

```text
agent context
  -> scoped semantic operation
  -> visible activity / preview
  -> validated document mutation
  -> live canvas projection
  -> diagnostics and visual verification
```

Pen.dev, Paper and tldraw demonstrate the product experience: an agent works on
the same visible canvas, selects or highlights the region it is using, and
returns structural plus visual context to the model. Framer and Figma add
branching, scoped context, diagnostics and staged visual verification. Penpot
provides the strongest prior art for separating document commits, presence,
plugins and rendering.

Crafty should combine those UX patterns with its stricter existing rule:

> Agents and humans converge on the same validated, invertible kernel commands.

The MCP layer should be a thin adapter over the kernel and file-room services.
Rust/WASM should remain a renderer. It may draw bounded agent previews and
presence overlays, but it must receive no agent or product semantics.

## Evidence Boundary

The following are product observations, not claims about private internals:

| Product | Primary evidence | What is established |
|---|---|---|
| Pen.dev/Pencil | [AI integration](https://docs.pen.dev/getting-started/ai-integration), [CLI](https://docs.pen.dev/for-developers/pen-cli), [format](https://docs.pen.dev/for-developers/the-pen-format) | Local MCP, live app/headless modes, compact execute/query/screenshot vocabulary, immediate canvas updates |
| Paper | [MCP docs](https://paper.design/docs/mcp), [MCP reference](https://paper.design/docs/mcp), [agent plugins](https://github.com/paper-design/agent-plugins) | Local Streamable HTTP endpoint, selection-aware reads, semantic writes, HTML insertion, visible agent activity |
| Framer | [external agents](https://www.framer.com/agents/external/), [agent engineering](https://www.framer.com/blog/building-framer-agents/) | Agent bridge distinct from conventional MCP, patch-oriented edits, rectangles/diagnostics/pixels, branches and review |
| Figma | [tools/prompts](https://developers.figma.com/docs/figma-mcp-server/tools-and-prompts/), [write to canvas](https://developers.figma.com/docs/figma-mcp-server/write-to-canvas/) | Metadata-first context, screenshots, native canvas writes, local and hosted MCP, skills for sequencing and recovery |
| Penpot | [MCP repository](https://github.com/penpot/penpot/tree/main/mcp), [plugin API](https://help.penpot.app/plugins/getting-started/), [architecture](https://help.penpot.app/technical-guide/developer/architecture/frontend/) | Plugin/WebSocket bridge, permissioned plugins, structured changes with undo data, separate presence and document channels |
| tldraw | [agent kit](https://tldraw.dev/starter-kits/agent), [MCP App](https://tldraw.dev/blog/tldraw-mcp-app), [source](https://github.com/tldraw/tldraw/tree/main/apps/mcp-app) | Dual visual/structured context, focused representations, interactive MCP canvas, streaming feedback, editor API execution |

Private transport schemas, transaction guarantees and error semantics are not
inferred where public sources do not establish them. In particular, product
marketing language such as "two-way" or "approval" is not treated as a formal
conflict, rollback or ownership protocol.

## Current Crafty Baseline

Crafty already has the correct durable mutation substrate:

- `packages/editor/src/kernel/commands.ts` defines a closed serializable command
  vocabulary.
- `packages/editor/src/kernel/kernel.ts:23-34` exposes authored/resolved
  projections, boxes, layout diagnostics and document revisions.
- `packages/editor/src/kernel/kernel.ts:60-67` exposes transaction preview,
  commit, rollback, dispatch and batch dispatch.
- `packages/editor/src/kernel/kernel.ts:129-148` validates command results and
  returns explicit inverses and `changed` state.
- `packages/editor/src/kernel/kernel.ts:174-185` memoizes projections and offers
  a stable subscription boundary.
- `packages/editor/src/ui/editor/canvas-stage.tsx` drives rendering from a
  revision-aware `requestAnimationFrame` loop rather than React rerenders.
- `packages/editor/src/ui/editor/editing-overlays.ts:5-13` demonstrates the
  correct pattern for ephemeral renderer overlays.
- `packages/scene-renderer` accepts a coarse packet and host-composed overlays;
  the Rust/WASM path is not a document mutation API.
- `docs/architecture/adrs/0006-agent-command-boundary.md` is accepted and
  requires preview, diagnostics, commit/rollback and a diff receipt.
- Proposed ADR 0017 defines a per-file server-authoritative command room and a
  separate ephemeral presence channel.

The blockers are equally concrete:

1. No agent query or mutation surface exists.
2. Kernel subscriptions notify without a typed operation/change event payload.
3. Receipts are not exposed, although `HistoryEntry` contains much of the data.
4. There is no agent-working or agent-preview overlay state.
5. Headless visual verification is documented as missing.
6. The current save route projects through legacy `Scene` and loses document
   fields. An agent surface must not make that lossy path more authoritative;
   see `docs/architecture/current-state.md:204-240`.

## Product Findings

### Pen.dev/Pencil

Pen.dev is the clearest precedent for a shared editor engine exposed through a
desktop app, IDE extension, local MCP server and headless CLI. Its documented
surface is compact: `get_app_state`, `get_guidelines`, `execute`, screenshots
and exports. `execute` can insert, update, move, delete, inspect and screenshot
nodes. Live app changes appear immediately; headless mode loads, edits, saves
and exports.

Transferable lessons:

- Keep the agent vocabulary compact and useful: scoped structure, computed
  bounds/problems, screenshot, export and design guidance.
- Make the running editor and headless engine share the same document service.
- Provide selection as convenient context, but return the actual resolved scope.
- Use screenshots as verification artifacts, not as the source of truth.

Do not adopt:

- JavaScript-like operation strings as Crafty's kernel contract.
- Prompt-mediated design/code translation as "synchronization" without source
  ownership and conflict semantics.
- A proprietary or unstable interchange format as canonical persistence.

### Paper

Paper exposes a local Streamable HTTP MCP server from the desktop app at
`http://127.0.0.1:29979/mcp`. Its read surface progressively expands from basic
file/selection data to tree summaries, node details, screenshots, computed
styles and JSX. Its write surface includes semantic operations such as text,
rename, duplicate, move, styles and delete, plus `write_html` for bulk authoring.
Paper also makes agent activity visible through working indicators and presence.

Transferable lessons:

- Progressive-disclosure reads are essential for model context budgets.
- Batch semantic operations should return created/affected ID maps.
- Agent work should be visible on the canvas as ephemeral activity.
- A code-facing projection can be valuable without replacing the canonical
  document.

Do not adopt `write_html` as a bypass. A Crafty equivalent would be a parser and
normalizer that compiles into validated commands, previews the complete result,
and produces one inverse transaction.

### Framer

Framer's official external integration is `@framer/agent`, which it says works
differently from MCP under the hood while providing equivalent capabilities. The
important behavior is structured project edits, small patch streams for the
built-in agent, layout rectangles, linter diagnostics, optional browser pixels,
and branch isolation for external-agent changes.

Transferable lessons:

- Separate fast structural feedback from slower pixel verification.
- Isolate broad agent work before it reaches the main document.
- Treat project authorization and publishing as separate capabilities.
- Return dense diagnostics with location and next action rather than full state
  after every operation.

Crafty's transaction is stronger than the publicly documented Framer patch
contract at command level. Branching should therefore be an outer session or
file-room concern, not a replacement for kernel transactions.

### Figma

Figma's MCP uses metadata-first context, rich design context, variables,
libraries, Code Connect, screenshots, assets and a broad `use_figma` write tool.
The hosted endpoint is `https://mcp.figma.com/mcp`; a desktop-local endpoint is
`http://127.0.0.1:3845/mcp`. Skills prescribe inspect-first, incremental writes,
visual validation and stop/inspect/fix/retry behavior.

Transferable lessons:

- Provide separate projections for metadata, design detail, variables,
  components/libraries, screenshots and motion.
- Support both local and authenticated remote transports over one internal API.
- Return changed IDs, revisions and diagnostics with every write.
- Treat skills as workflow guidance, never as the safety boundary.

Do not expose arbitrary Plugin API JavaScript as Crafty's canonical write path.
The same product pattern can be safer because Crafty already has a typed command
union and explicit inverses.

### Penpot

Penpot separates Potok workspace events, structured document changes, plugin
permissions, collaboration presence and rendering. Its MCP bridge talks to a
dedicated plugin over WebSocket; the plugin runs tasks through a permissioned
Plugin API. Document commits carry redo/undo changes, revisions and source
metadata. Presence and pointer updates are transient file-room messages.

Transferable lessons:

- Separate durable document events from UI, network and presence events.
- Carry forward/reverse changes and revision metadata across the commit boundary.
- Use capability permissions rather than a single trusted-agent flag.
- Keep plugin/agent lifecycle, timeout and correlation state outside the kernel.

Do not require a UI plugin merely to reach Crafty's kernel. A browser bridge may
be an adapter, but the native service should call the kernel directly.

### tldraw

tldraw combines screenshots with focused structured shapes, peripheral spatial
clusters, selection, lints and recent actions. Its MCP App embeds an interactive
canvas in the MCP host and exposes `search` plus `exec` against a live editor.
Its Agent Starter Kit adds typed actions, sanitization, modes and streaming; its
MCP execution path remains arbitrary editor JavaScript and relies on editor/store
validation, checkpoints, timeouts and a constrained runtime.

Transferable lessons:

- Always give the agent both visual and structured context.
- Use focused and peripheral representations instead of whole-document dumps.
- Stream intent/progress, but commit only complete validated actions.
- Show agent actions in a human-readable history and on-canvas activity layer.
- Treat presence as a separate synchronized-but-not-authored scope.

Do not adopt arbitrary `exec` or checkpoint-only receipts. Crafty should expose
commands, transaction IDs, affected nodes, revisions, diagnostics and inverses.

## Proposed Crafty Architecture

```text
MCP client / local agent
        | Streamable HTTP or stdio adapter
        v
Agent Gateway
  session, auth, capabilities, correlation, progress, cancellation
        v
Per-file command room
  base revisions, ordering, subscriptions, persistence acknowledgement
        v
EditorKernel
  query, preview, validated command batch, commit/rollback, inverse
        |                         |
        v                         v
canonical persistence       projection/render observer
                                  v
                            Rust/WASM/WebGPU
                                  v
                        visible canvas + overlays
```

### Protocol layers

MCP is the external adapter. The internal room protocol should be independent
of MCP so the browser editor, CLI and future agents share one command path.

Recommended MCP tools/resources:

- `get_document_summary`
- `get_current_selection`
- `get_node`
- `get_children`
- `get_tree_summary`
- `get_resolved_layout`
- `get_diagnostics`
- `preview_transaction`
- `commit_transaction`
- `rollback_transaction`
- `render_snapshot`
- `get_receipt`
- `subscribe_changes`

Resources should expose bounded document snapshots, operation receipts,
diagnostic bundles and render artifacts. Avoid an always-on whole-document dump.

### Operation envelope

The wire envelope adds transport metadata without changing `DocumentCommand`:

```ts
{
  operationId,
  transactionId,
  fileId,
  pageId,
  baseRevision,
  label,
  idempotencyKey,
  commands: DocumentCommand[]
}
```

Preview calls `beginTransaction` and `preview` only. Commit must verify the base
revision, run the existing kernel commit path, create one labelled history
entry, persist through the canonical store, and publish one receipt. Stale
revisions must return a stable conflict diagnostic, never silently rebase.

### Receipt

```ts
{
  receiptId,
  operationId,
  transactionId,
  label,
  baseRevision,
  committedRevision,
  commands,
  inverses,
  changedNodeIds,
  createdNodeIds,
  deletedNodeIds,
  diagnostics,
  persisted,
  render: { status, artifactUri?, contentHash? }
}
```

The receipt should be inspectable in UI and over MCP. Inverses are powerful
mutation capabilities and need the same authorization as rollback.

### Event stream

Add a typed operation stream derived from kernel transitions rather than
replacing the existing `subscribe(() => void)` contract:

```text
operation.started
preview.updated
preview.cleared
transaction.committed
transaction.rolled_back
command.rejected
document.revision
render.started / render.completed / render.failed
room.conflict
```

Events must identify whether state is durable or ephemeral and must be scoped,
bounded and ordered per file. Do not stream every pointer move or renderer frame.

## Making Agent Creation Visible

The desired visual loop is:

```text
agent starts operation
  -> browser shows agent identity, label and affected scope
  -> preview commands update temporary bounds/paths/selection overlays
  -> kernel preview updates the projection without history/persistence
  -> commit replaces preview with authored geometry
  -> existing renderRevision/rAF path draws Rust/WASM output
  -> receipt attaches diagnostics and optional screenshot/hash
```

The overlay must remain ephemeral. It can use the existing host-composed overlay
channel and the patterns in `editing-overlays.ts`, but the Rust packet should
receive only ordinary draw commands plus bounded status geometry. Agent names,
operation labels, component semantics and permissions belong in the browser
chrome or an overlay composition layer above the renderer protocol.

Three verification tiers are recommended:

1. Fast: document validation, changed IDs, bounds and layout diagnostics.
2. Medium: component/reference, accessibility and style diagnostics.
3. Slow/optional: headless screenshot/export and content hash.

Rendering failure must not invalidate a valid document commit. The receipt should
report committed state and render verification state independently.

## Security and Concurrency

Capabilities should be scoped to principal, workspace, file and operation:

- `document:read`
- `document:query-resolved`
- `document:preview`
- `document:commit`
- `document:rollback`
- `render:read`
- `receipt:read`
- `presence:read`

Enforce file access through `scene-store` or its document-native successor. Do
not accept arbitrary filesystem paths. Bound command count, node count, preview
duration, render work and event queue size. Require idempotency keys for commit.

Use the proposed server-authoritative per-file room from ADR 0017:

- one room per file;
- one monotonically increasing authoritative revision;
- every inbound command validated by the same kernel;
- stale base revisions rejected loudly;
- presence separate and never persisted;
- no CRDT/OT layer in the first slice.

An open preview transaction rolls back on session expiry. A committed operation
that cannot persist is not reported as durable; it receives a recovery diagnostic.

## Sequencing

1. Replace lossy `Scene` persistence with canonical `EditorDocument` persistence.
2. Build a scoped kernel query API and stable diagnostic shapes.
3. Add typed operation events, operation IDs and receipts.
4. Add transaction preview/commit/rollback over a local in-process service.
5. Add file-room revision and subscription behavior.
6. Add Streamable HTTP MCP and a stdio CLI adapter.
7. Add browser agent activity, preview overlays and receipt chrome.
8. Add headless render verification and deterministic artifacts.
9. Add remote auth, quotas, audit and multi-agent contention tests.

Do not start with MCP tool schemas or arbitrary script execution. The kernel,
receipt, persistence and verification surfaces are the product capability;
transport is the final adapter.

## Decisions and Open Questions

### Proposed decisions

- Adopt compact progressive-disclosure reads from Paper/Figma/tldraw.
- Adopt visible agent activity and preview overlays from Paper/tldraw.
- Adopt fast diagnostics plus optional pixel verification from Framer/Figma.
- Adopt per-file command rooms and separate presence from Penpot/ADR 0017.
- Reject arbitrary JavaScript as the canonical write boundary.
- Reject direct Rust/WASM or React access from agents.
- Reject screenshots or checkpoints as the only receipt.

### ADRs required before implementation

1. Agent gateway transport and relationship to the multiplayer room.
2. Typed operation event, transaction and receipt contract.
3. Capability authorization and local/remote trust model.
4. Headless render verification and artifact determinism.

### Research still needed

- Measure JSON versus binary/shared-memory transport for projected context and
  receipts; do not invent a performance budget.
- Determine how canonical document persistence replaces the current Scene route.
- Define whether agent branches are document snapshots, room branches or both.
- Define headless WebGPU availability and fallback policy without violating the
  no-fallback renderer invariant.
- Define code/document source mappings separately from the initial MCP surface.

## Conclusion

Crafty's differentiator should be a visible agent operating the real editor
substrate, not an agent drawing a simulated result over the canvas. The correct
architecture is:

```text
scoped context -> validated kernel transaction -> ephemeral visual activity
-> authored commit -> Rust canvas projection -> diagnostic/visual receipt
```

That gives the product experience demonstrated by Pen.dev, Paper and tldraw,
the review and verification discipline demonstrated by Framer and Figma, and
the separation of document, presence and plugin boundaries demonstrated by
Penpot, while preserving Crafty's own architectural invariants.
