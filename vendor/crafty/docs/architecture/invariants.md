# Invariants

These are the rules Crafty actually enforces, plus the rules it *should* enforce
and does not. An invariant is not a style preference — it is a property that some
code refuses to violate, ideally with a test that proves it.

Each entry is labelled:

- **Enforced** — code rejects the violation, and a test covers it.
- **Held by convention** — true today, but nothing stops you breaking it.
- **Target** — we want this; it is not enforced yet.

---

## Document identity and structure

**I1. Every node has one stable, non-empty id.** *Enforced* —
`validateNode` (`packages/editor/src/kernel/document.ts:284`). Ids are minted
once and never derived from array position.

**I2. The node map key equals the node id.** *Enforced* — `document.ts:351`.

**I3. Every node has at most one parent, and every child link points back.**
*Enforced* — `document.ts:367` rejects `DOCUMENT_PARENT_MISMATCH` when a child's
`parentId` does not name the node listing it.

**I4. Every referenced node exists.** *Enforced* — `document.ts:354-355`
(`DOCUMENT_REFERENCE_MISSING` for both `parentId` and `childIds`).

**I5. Hierarchy is acyclic.** *Enforced* — depth-first walk with a visiting set,
`document.ts:369-386`, `DOCUMENT_CYCLE`.

**I6. A page root is an existing `page-root` node with `parentId === null`.**
*Enforced* — `document.ts:361`.

**I7. `pageOrder` references only existing pages.** *Enforced* — `document.ts:364`.

**I8. Node geometry is finite and positively sized; zero extent is legal for
`path` nodes only.** *Enforced* — `document.ts:288-289` rejects non-finite
bounds/transform components and `width <= 0 || height <= 0` for every kind
except `path`, which accepts `>= 0` on both axes (a straight horizontal line
has zero height and must be representable; relaxed in schema v3, with a test
that a two-point horizontal line validates — `document.test.ts:26-40`). The
relaxation was audited against every `bounds` consumer: no consumer divides by
`width` or `height` — hit testing uses inclusive range checks
(`interaction.ts:131`), marquee uses intersection, transforms never divide by
bounds — so a zero-area path cannot corrupt downstream math.

**I9. Opacity is in `[0,1]`; `zIndex` is a safe integer.** *Enforced* —
`document.ts:290`, `:292`.

**I10. Unknown schema versions are rejected, never coerced.** *Enforced* —
`migrateDocument` (`document.ts:469`) fails with an explicit message rather than
guessing. Migration is a declared chain (`DOCUMENT_MIGRATIONS`), and the result
is re-validated.

**I11. Serialization is canonical.** *Enforced* — `canonicalEditorDocumentString`
(`document.ts:415`) sorts object keys recursively after validating, so two
equal documents produce byte-identical output.

Tests: `packages/editor/src/kernel/document.test.ts`.

---

## Mutation

**I12. All document mutation goes through `applyDocumentCommand`.** *Enforced by
construction* — `EditorDocument` is only reachable through the kernel, and every
kernel write path (`dispatch`, `dispatchBatch`, `preview`, `commit`, `undo`,
`redo`) funnels into it (`packages/editor/src/kernel/commands.ts:328`).

**I13. Every mutating command validates the resulting document before returning
it.** *Enforced* — every branch calls `assertValid` (`commands.ts:46`), which
throws rather than returning an invalid document. There is no "apply now,
validate later".

**I14. Every command produces an explicit inverse.** *Enforced* — `CommandResult`
requires `inverse` (`commands.ts:29`). Undo replays inverses; redo replays the
originals (`kernel.ts:242`, `:252`).

**I15. Commands report whether they changed anything.** *Enforced* — `changed:
boolean` on `CommandResult`. Only changed commands enter history
(`kernel.ts:194`), so a no-op edit does not create an undo step.

**I16. Pointer-down never mutates durable document state.** *Enforced* —
`transitionInteraction` on `pointer-down` emits at most a `select` or `begin-pan`
effect and never a `commit-*` effect (`interaction.ts:63-79`).

**I17. A drag produces one history entry, not one per pointer-move.** *Enforced* —
`preview` requires an open transaction and does not record history; only `commit`
pushes a `HistoryEntry` (`kernel.ts:181-194`).

**I18. A cancelled interaction leaves no persistent change.** *Enforced* —
`rollback` restores `transaction.beforeDocument` wholesale (`kernel.ts:197`);
`pointer-cancel` and Escape route to `cancelGesture` → `rollback`
(`harness.ts:438`).

**I19. Deleted nodes cannot remain selected.** *Enforced* — every `apply` filters
the selection against the surviving node map (`kernel.ts:117`).

**I20. Viewport commands are refused mid-gesture.** *Enforced* — `dispatch` and
`dispatchBatch` throw `EDITOR_VIEWPORT_GESTURE_ACTIVE` for `set-page-viewport` /
`set-page` when `interaction.phase !== "idle"` (`kernel.ts:200`, `:211`).

**I21. Nested transactions are refused.** *Enforced* — `beginTransaction` throws
`EDITOR_TRANSACTION_ACTIVE` (`kernel.ts:181`); so do `dispatch`/`dispatchBatch`
while a transaction is open.

**I22. Paste mints fresh ids and never collides.** *Enforced* — `mint-and-insert`
rejects id collisions, orphaned parents, and missing children before applying
(`commands.ts:379-395`).

**I23. The last page cannot be deleted.** *Enforced* — `DOCUMENT_LAST_PAGE`
(`commands.ts:129`).

Tests: `packages/editor/src/kernel/{index,interaction,pages,clipboard}.test.ts`,
`apps/crafty-web/src/editor/harness.test.ts`.

---

## Tools and interaction

**I24. Each tool has a closed effect vocabulary.** *Enforced* —
`TOOL_EFFECT_VOCABULARIES` (`interaction.ts:40`) declares exactly which effects
each tool may emit. Only `rectangle` may emit `preview-rectangle` /
`commit-rectangle`; only `select` may emit selection and marquee effects. This is
the accidental-rectangle regression contract. `pen` and `node` are declared with
navigation-only vocabularies; the disjointness from `rectangle` and `select` is
asserted (`path-selection.test.ts:84-110`).

**I25. Navigation outranks creation.** *Enforced* — `pointer-down` classifies
hand tool, middle button, Alt and Space as navigation *before* consulting the
tool (`interaction.ts:64`). Wheel and pinch reset any in-flight gesture to idle
and emit only `zoom` (`interaction.ts:55-62`, `harness.ts:377`).

**I26. Creation requires exceeding the drag threshold.** *Enforced* — a rectangle
commits only when both draft dimensions reach `dragThreshold`
(`interaction.ts:84-86`); below that the gesture commits nothing.

**I27. Hidden and locked nodes are not hit-test targets.** *Enforced in the
kernel* (`documentHitTest`, `interaction.ts:118`) and now used by pointer,
paste-target, and context-menu selection. **Partially enforced in production**
because the remaining spatial-index browser paths (hover highlight and marquee
scope discovery) respect `visible` but depend on the legacy `Layer` shape for
locking (`packages/scene-model/src/spatial-index.ts`). This is a real gap, not
a convention.

---

## Rendering

**I28. Rendering never mutates authored state.** *Enforced by construction* — the
renderer receives a projected `Scene` and returns a `RendererResult`; there is no
write path back. Every renderer diagnostic carries
`preservation: "authored-state-and-last-valid-packet"`
(`packages/scene-renderer/src/failure-policy.ts`).

**I29. An invalid or unsupported packet cannot replace the last valid packet.**
*Enforced* — `retainValidPacket` (`failure-policy.ts:60`) refuses to store a
packet whose protocol version is unsupported and returns a diagnostic instead.

**I30. The renderer never receives product semantics.** *Held by construction* —
`RenderFrame` (`draw-protocol.ts:84`) contains geometry, transforms, fill,
opacity, ordering and an optional overlay packet. It contains no component
references, no tokens, no history, no triggers.

**I31. Overlays are renderer state, never authored geometry.** *Enforced* — grid,
guide and selection chrome ride the packet's optional `overlay` / `selectionBounds`
fields, composed by the host after the authored packet is produced
(`webgpu-renderer.ts` `withOverlays` composes only the transient preview; the
projected packet comes from `apps/crafty-web/src/editor/overlay.ts`) and drawn
by the Rust encoder after the authored content (`lib.rs` `encode_overlays`). The
overlay packet has its own structural types that do not import the kernel
(`draw-protocol.ts`). Drawing order is witnessed headlessly by the COLOR-tag
order tests in `lib.rs`.

**I32. There is no fallback renderer.** *Enforced* — `createSceneRenderer` returns
an `unavailableRenderer` when no WASM runtime is present; it renders nothing and
reports `WASM_MODULE_UNAVAILABLE` (`scene-renderer/src/index.ts:68`). A WebGL
context is never requested.

**I33. Command ordering is explicit.** *Enforced* — commands carry `zIndex` and
`order`; the Rust encoder re-sorts every packet by `(zIndex, order)` before
drawing (`lib.rs` `vello_encoder::encode_frame`; witnessed by the COLOR-tag
order tests). Ordering never derives from map iteration or object identity. The
host-side retained merge that used to sort is retired with the TypeGPU
submission path.

**I34. Zoom is clamped to one range shared by kernel and renderer.** *Enforced* —
`ZOOM_MIN = 0.01`, `ZOOM_MAX = 256`, `WORLD_LIMIT = 1e6` are declared once in
`packages/editor/src/kernel/coordinates.ts:13` and re-exported by
`scene-renderer`. The *constants* are shared; the *functions* are not (see I40).

---

## Ephemeral vs durable state

**I35. Ephemeral editor state is not part of the document.** *Held by
construction* — selection, hover, focus, active tool, interaction phase, draft
bounds, paste preview and the live camera live in `EditorState`
(`kernel.ts:8`) and on `CanvasEditor`, never in `EditorDocument`.

**I36. Per-page *rest* camera, grid, rulers, guides and snap settings ARE
authored.** *Enforced* — they live in `PageCanvas` on `PageRecord`
(`document.ts:80`) and are validated like any other document data. The
distinction is deliberate: the live camera is ephemeral, the camera you return to
when you open a page is authored. Note that this data is currently **lost on
save** (see [`persistence.md`](persistence.md)).

**I37. The clipboard is ephemeral kernel state with a serializable payload.**
*Enforced* — `ClipboardContent` is held on the kernel, never in the document
(`clipboard.ts:38`).

---

## Agents

**I38. Agents use the same command substrate as humans.** *Target, ratified by
[ADR 0006](adrs/0006-agent-command-boundary.md)* — nothing today gives an agent a
separate mutation path, because nothing today gives an agent *any* programmatic
mutation path. The invariant is stated now so the first agent surface built
cannot invent one. See [`agent-editing.md`](agent-editing.md).

---

## Known unenforced invariants

These are stated so they are not rediscovered as bugs.

**I39. Component reference cycles must be rejected before resolution.** *Target.*
`ComponentDefinition` / `ComponentInstance` records exist; no resolver exists, so
no cycle check exists.

**I40. Coordinate conversion has exactly one authoritative implementation.**
*Violated.* Two implementations exist and the browser uses the non-kernel one.
See [`coordinate-systems.md`](coordinate-systems.md).

**I41. Hit testing has exactly one authoritative implementation.** *Violated.*
Two exist; the kernel's is unused. See
[`selection-and-hit-testing.md`](selection-and-hit-testing.md).

**I42. Saving preserves everything the document model can express.** *Violated.*
See [`persistence.md`](persistence.md) and `current-state.md` finding 5.

**I43. Cross-file references carry a library id, version and integrity value.**
*Type-level only.* `LibraryReference` requires all three
(`document.ts:101`), but nothing produces or resolves one.

---

## How to use this file

Before changing the editor, find the invariants your change touches. If your
change would violate an **Enforced** invariant, you are almost certainly solving
the wrong problem — the enforcement is the design. If it would violate a **Held
by convention** one, either preserve it or promote it to enforced. If your change
*fixes* a **Violated** entry, move it up and cite the test.

Adding a new enforced invariant means adding the check *and* the test, then
adding the entry here.
