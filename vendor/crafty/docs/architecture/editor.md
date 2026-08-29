# The Editor Package

Status: **Current.** `packages/editor` exists — the kernel (pure logic, the
`@crafty/editor/kernel` subpath) plus the chrome (primitives and editor glue,
the `@crafty/editor/ui` subpath) — and is covered by 335 tests. The kernel owns
real editing semantics; it is also incomplete, and part of what it should own
currently lives in the harness (`packages/editor/src/ui/editor/harness.ts`).

## Package layout

```
packages/editor/
  src/kernel/     ← the kernel: zero React, zero DOM (lint-enforced)
  src/rendering/  ← renderer-packet projection shared by web and native hosts
  src/ui/         ← the chrome: primitives kit, editor primitives, harness glue
```

Three subpath exports, one hard boundary: `@crafty/editor/kernel` is the only
editing surface `scene-renderer`, `scene-store`, `pen-import` and `apps/cli`
import. `@crafty/editor/rendering` is the framework-free adapter from a resolved
document to renderer path/text/compound/glass packet data and is shared by the
web and native hosts;
`@crafty/editor/ui` ships composable primitives (one per file, `cva` variants,
`Slot`/`asChild`), never assembled chrome — the app's layouts compose them.

## What the kernel is

A renderer-independent, React-independent, DOM-independent TypeScript module that
owns the authored document and every rule for changing it. It is the answer to
"where does editing behaviour live?"

It is an **external store**: `subscribe(listener) => unsubscribe` plus
`getProjection()` returning a memoised snapshot (`kernel.ts:120`). React consumes
it through `useSyncExternalStore`; the renderer consumes a projection of it.
Neither owns it.

Ratified by [ADR 0002](adrs/0002-editor-kernel.md).

## What the kernel owns

`EditorState` (`kernel.ts:8`):

| Field | Kind | Notes |
|---|---|---|
| `activeTool` | ephemeral | `select \| rectangle \| ellipse \| line \| frame \| hand \| pen` |
| `currentPageId` | ephemeral | per-page selection and camera are remembered across switches |
| `selectedIds` | ephemeral | ordered set, filtered against live nodes on every mutation |
| `hoveredId`, `focusedId` | ephemeral | declared; not yet driven by the surface |
| `isolationRootId` | ephemeral | declared for deep-select/isolation; not yet used |
| `viewport` | ephemeral | **mirrored** from the harness — see "Known misplacements" |
| `interaction` | ephemeral | the interaction state machine's current state |
| `documentRevision` | derived | increments on every *changed* command |
| `pasteDiagnostics` | ephemeral | surfaced to the UI after a paste |
| `creationStyle` | ephemeral | session-only `{fill, stroke}` preset for rectangle, ellipse, frame, line, and pen creation; defaults to `#818cf8` / `#c4b5fd` |

Plus, not on `EditorState` but owned by the kernel closure: the undo stack, the
redo stack, the open transaction, the clipboard, per-page selection memory
(`pageSelections`) and per-page camera memory (`pageCameras`).

Creation-style setters are explicit external-store operations, not document
commands. A shape gesture snapshots the pair at pointer-down and a pen session
snapshots it at its first point; changing the live preset cannot restyle an
in-progress creation. The preset is absent from serialization, save payloads,
document revision, and history.

Basic rectangle, ellipse, line, and frame creation is one kernel operation:
`createShape` consumes world-space geometry, plans validated commands, records
one history entry, and selects the new node. Ellipses and lines receive
node-qualified point/subpath ids. Frame creation includes containment absorption
and local-coordinate rebasing in the same entry. Browser and native adapters use
this operation rather than independently constructing document nodes.

Deep selection and isolation transitions are also kernel operations.
`deepSelectAt` resolves the deepest canonical hit and enters a selected frame or
group; `exitIsolationAt` tests the current container through the authoritative
composed world transform before laddering out. Browser double-click and native
tap-count adapters call the same operations, so platform hosts no longer own a
second isolation rule.

## What the kernel must never own

- **DOM or React.** No imports from either — enforced structurally: the kernel
  lives in `src/kernel/`, and `scripts/lint.mjs` rejects react imports there.
  The kernel builds and tests headless.
- **GPU resources.** Buffers, pipelines, textures and device lifetime belong to
  the renderer host.
- **Network.** Persistence is the app's boundary; the kernel exposes
  `serialize()` and accepts a document at construction.
- **Rendered pixels or layout of chrome.** Panels decide how to display a
  projection; the kernel decides what the projection is.

## Commands

`DocumentCommand` (`commands.ts:4`) is a closed discriminated union — currently
26 variants across four families:

- **Node structure** — `create-node`, `delete-node`, `delete-subtree`,
  `restore-subtree`, `reorder-node`, `mint-and-insert`, `delete-pasted-nodes`
- **Node values** — `set-bounds`, `set-property` (name/fill/stroke/opacity/
  visible/locked/text/cornerRadius)
- **Page structure** — `create-page`, `delete-page`, `restore-page`,
  `reorder-page`, `set-page`
- **Page canvas** — `set-page-grid`, `set-ruler-settings` (inert; rulers are
  not rendered — see [`document-model.md`](document-model.md)), `set-snap-settings`,
  `set-page-viewport`, `add-guide`, `move-guide`, `remove-guide`
- **Document metadata** — `set-metadata`, `delete-metadata`

Every command is a plain serializable value. That matters: it is what makes
agent-originated edits, operation logs and future collaboration possible without
a second mutation model.

### The command contract

`applyDocumentCommand(document, command) => { document, inverse, changed }`

1. **Pure.** Takes a document, returns a new one. Never mutates its input.
2. **Validated.** Every mutating branch ends in `assertValid`, which runs full
   structural validation and *throws* on failure (`commands.ts:34`). An invalid
   document cannot be returned.
3. **Invertible.** The returned `inverse`, applied to the result, restores the
   input. `delete-subtree` returns `restore-subtree` carrying the whole removed
   node list and the original index. `set-property` returns the prior value.
4. **Honest about no-ops.** `changed: false` keeps a no-op out of history.
5. **Loud on precondition failure.** `DOCUMENT_NODE_MISSING`,
   `DOCUMENT_PARENT_MISSING`, `DOCUMENT_DELETE_NON_LEAF`,
   `DOCUMENT_PASTE_ID_COLLISION`, `DOCUMENT_LAST_PAGE` and friends throw with a
   machine-readable prefix.

Adding a command means honouring all five. If you cannot write the inverse, the
command is at the wrong granularity.

## Transactions

The transaction API is what stops a drag becoming three hundred history entries.

```
beginTransaction(label)        // snapshots the document; refuses if one is open
preview(command | command[])   // applies, does NOT record history; recomputes
                               //   inverses against the pre-transaction snapshot
commit(command?)               // pushes ONE history entry for the whole gesture
rollback()                     // restores the snapshot wholesale
```

Semantics worth knowing (`kernel.ts:151-167`):

- `preview` accumulates commands against the transaction's advancing working
  document. Continuous adapters therefore emit absolute `set-bounds` previews
  from their captured gesture start; alt-drag and frame creation may add
  prerequisite create/reparent commands during the same entry. Inverses are
  computed incrementally and stored in reverse application order.
- `rollback` restores by replacing the whole document with the snapshot. This is
  the strongest possible guarantee and the reason a cancelled interaction can
  never leave residue (I18).
- `commit` with no changes pushes nothing.

The harness arms a transaction lazily on the first continuous edit effect and
finishes it on pointer-up/cancel. Basic creation has no durable preview: its
release effect calls the kernel's atomic `createShape` operation.

**Current limitation:** `preview` snapshots the *whole* document on
`beginTransaction` (`structuredClone`). For large documents this is a per-gesture
allocation proportional to document size. It is correct and simple; it is a
measured-optimisation candidate, not a bug. See [`performance.md`](performance.md).

## History

`HistoryEntry` carries more than commands:

```ts
{ label, commands[], inverses[], pageId, selectionBefore[], selectionAfter[] }
```

Undo replays inverses **and** restores the page and selection that were active
when the entry was made (`kernel.ts:189`). This is the difference between undo
that works and undo that leaves you on the wrong page staring at nothing.

`dispatchBatch` accumulates inverses in reverse order (`unshift`) so that undoing
a batch unwinds it correctly.

**Known gaps:**

- History is unbounded. There is no cap and no coalescing window. A long session
  grows monotonically. **Target:** a bounded stack with an explicit policy, or
  command-log-plus-periodic-snapshot. Do not add unbounded document snapshots.
- History is global, not per-page — correct for now, and the entry carries the
  page so undo remains coherent.
- `redoStack` is cleared on any new recorded command, which is the standard
  linear model. Branching history is not planned.

## Clipboard

`packages/editor-kernel/src/clipboard.ts` (16 tests). Ephemeral kernel state with
a serializable payload (`CLIPBOARD_MIME = "application/x-crafty-nodes"`).

The interesting part is override remapping. A copied subtree may contain
component instances whose `overrides` are keyed by node id. On paste, ids are
re-minted, so override keys are re-keyed through the paste id map. Keys that miss
the map fall back to a recorded `overridePath` — a child-index path from the
nearest instance root. Keys that resolve to neither are **dropped with a
diagnostic** (`PASTE_OVERRIDE_DROPPED`), never silently reattached to the wrong
node.

Paste diagnostics are a small, good pattern worth repeating: the operation
succeeds, and what could not be preserved is reported rather than guessed.

## Known misplacements — fixed

The five harness-held editor semantics listed here were moved into the kernel
(the editor-package-consolidation follow-up, H1–H5):

| Concern | Resolution |
|---|---|
| Live viewport | Kernel-owned (`EditorState.viewport`); the harness reads through a getter and writes only via `kernel.setViewport`. Two representations remain (live camera + authored per-page `PageCanvas.rest`). |
| Resize arming | The 16px corner test lives in the interaction reducer (`RESIZE_HANDLE_SCREEN_PX`, `cornerHit`); the `move` effect carries `resize?: boolean`; `armResize`/`resizeStart` and the `previewMove` branch are gone. The I24 handle-model gap is closed at the vocabulary level. |
| Marquee geometry | `kernel.marqueeSelect(world, additive)` computes the selection over the AUTHORED document (`marqueeSelectableIds`: visibility-/lock-inheriting, pre-order, page-root excluded) — the projected-Scene walk and its helpers are deleted. |
| Paste target resolution | The kernel resolves the paste parent over the authored document (`pasteTargetParent` closure, powered by `documentHitTest`). |
| Context-menu selection | `handleContextMenu` resolves the target through `documentHitTest` over the resolved authored document, then maps the resolved id back to the authored selection id. |
| Duplicate | `kernel.duplicateSelection()`: fresh ids, one history entry, selection lands on the copy. |
| Basic shape creation | `kernel.createShape()`: rectangle/ellipse/line/frame node and path construction, unique path identities, frame absorption/rebasing, selection, and one history entry. Web and native hosts only convert screen geometry to world geometry. |

The harness is thinner and closer to its target shape: DOM events in, kernel
calls out, projection to the renderer. It still owns the spatial index for
hover/scoping queries and the pen session's world-anchored transaction
bookkeeping — those are the remaining (smaller) candidates.

## Extending the kernel

1. Model the concept as a **command** first. If it cannot be expressed as an
   invertible command, reconsider the concept.
2. Add validation for the new state in `document.ts`, and a test that a bad value
   is rejected.
3. Add the inverse and a round-trip test.
4. If the operation is continuous (drag-like), route it through
   `beginTransaction`/`preview`/`commit`, not through repeated `dispatch`.
5. If it introduces a new tool behaviour, extend `InteractionEffect` and the
   relevant tool's entry in `TOOL_EFFECT_VOCABULARIES` — never add an ad-hoc
   branch in a pointer handler. See [`input-and-tools.md`](input-and-tools.md).
6. If it changes what is authored versus resolved, write an ADR.
