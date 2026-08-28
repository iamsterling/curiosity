# Canvas Actions Parity — Tranche 2

Status: Proposed, 2026-08-10.

## Why

Two things happened since the 2026-08-07 conformance audit:

1. **The code moved past the plan.** Nearly all of tranche 1 is implemented —
   eight resize handles with a rotate ring (`interaction.ts:20`, `:42`,
   `harness.ts:223`), the snap service wired through every tool
   (`kernel/snap.ts`, called at `harness.ts:2144/2155/2164`), the keyboard
   layer (`keyboard-bindings.tsx`, 282 lines), hover (`harness.ts:1325`), and
   marquee/deep-select/Esc-ladder traversal — while
   `docs/architecture/interaction-conformance.md` still reports gaps #9–#12,
   #16, #17 as open and `canvas-actions-parity-tranche-1/tasks.md` is entirely
   unchecked. The measurement no longer measures.
2. **A six-cluster cross-product research pass** (UI design tools, whiteboards,
   illustration editors, layout-engine builders, specialized canvases, and
   cross-cutting interaction physics; ~40 products) produced a fuller
   inventory of the canonical action surface than the original four-way audit,
   including a set of *universal conventions* — behaviors every professional
   canvas ships — that Crafty is close to but does not fully meet, and a list
   of industry-unresolved forks Crafty should decide deliberately rather than
   inherit.

This tranche does three things: rebaselines the conformance measurement against
the code as it exists, adopts the research inventory as the conformance target,
and closes the next set of universal-convention gaps that need no new substrate
(no text stack, no layout stage, no multiplayer).

## What Changes

Each item labelled per config rules.

**Docs — rebaseline (confirmed staleness, cited):**

- `interaction-conformance.md` re-scored against current code: gaps #9
  (transform handles), #10 (snap caller), #11 partially (traversal exists;
  isolation does not), #12 (keyboard layer), #16 (tool registry), #17 (layers
  panel) are closed in code; its `DrawGeometry = "rect"` and "vector rows not
  canvas-enabled" claims are false since protocol v5 (`draw-protocol.ts`
  geometry `rect | path | text`). The research inventory's action taxonomy and
  "unresolved forks" list are folded in as the target surface.
- `selection-and-hit-testing.md:140-146` ("resize is a 16px proximity test")
  corrected; `renderer.md` gaps 2/6 (text, culling) corrected per ADR 0020.
- Research sources recorded in `docs/architecture/research-ledger.md`.
- Tranche-1 tasks reconciled: implemented items checked with `path:line`
  evidence; `distribute-nodes` remains open and stays tranche-1's.

**Kernel + harness — new behavior:**

- **Isolation scope** (improvement; `isolationRootId` is declared and unwritten
  — `kernel.ts:16`, confirmed by grep): double-click on an already-selected
  container enters isolation; hit-testing, marquee, select-all, and Tab
  traversal scope to the isolation root; Esc exits one level before it clears
  selection; page/tool switch exits. Industry-standard (Illustrator isolation,
  Figma/Sketch drill model).
- **Creation-gesture modifiers** (confirmed gap for Space —
  `docs/architecture/input-and-tools.md:134` lists space-to-reposition as not
  implemented; Shift/Alt during creation are suspected gaps to be verified
  first): while dragging out a new rect/ellipse/line/frame, Shift constrains
  to square/circle/45°, Alt draws from center, and holding Space translates
  the in-progress shape without ending the drag. Universal across Figma,
  Sketch, XD, Illustrator, Photoshop, Affinity.
- **Duplicate-with-offset repeat** (verified partial implementation:
  `harness.ts:1684-1687` consults the last Alt-drag offset and the duplicate
  path records it at `harness.ts:3073-3075`; reset semantics still need work):
  after a
  duplicate-and-move (⌥-drag or ⌘D then move), the next ⌘D repeats the same
  offset — the universal array-building idiom (Figma/Sketch/XD/Illustrator
  "transform again"). Ephemeral repeat delta, never serialized.
- **Alt-hover measurement** (improvement; named as blocked at
  `docs/architecture/qol-program.md:83`, but protocol v5 already renders text,
  so the block needs re-examination): with a selection and Alt held, hovering
  another node shows distance lines and numeric pills between the selection
  bounds and the hovered bounds (and to the parent frame when hovering empty
  frame space). Kernel computes the measurement facts; the overlay draws them.

**Renderer:**

- **Corner-radius rendering** (suspected defect: `renderer.md:411-441` says
  authored `cornerRadius` is ignored at draw time; the v5 protocol carries a
  radius field, so either the doc is stale or the encoder drops it — verify
  first, then make the authored value render, or record the verified truth).

## Capabilities

### New Capabilities

- `editor-kernel/selection-scope`: isolation-mode lifecycle and how it scopes
  hit-testing, marquee, select-all, and traversal.
- `editor-kernel/creation-gestures`: modifier behavior (Shift/Alt/Space)
  during shape-creation drags.
- `editor-kernel/duplicate-repeat`: offset-repeating duplicate semantics and
  its history behavior.
- `editor-kernel/measure-distances`: measurement facts computed for Alt-hover
  (pair of rects → axis distances), selection→hover and selection→parent.
- `renderer/measurement-overlay`: how measurement facts render (lines, pills,
  screen-fixed sizing, never authored geometry).
- `renderer/corner-radius`: authored corner radius is honored at draw time.

### Modified Capabilities

None — `openspec/specs/` is empty (verified); no deployed spec exists to
modify. Tranche-1's delta specs remain tranche-1's.

## Impact

- `packages/editor/src/kernel/` — interaction reducer (isolation state,
  creation-gesture effects), new pure helpers (`measureDistances`,
  repeat-delta bookkeeping), no schema change.
- `packages/editor/src/ui/editor/harness.ts`, `keyboard-bindings.tsx`,
  `editing-overlays.ts` — effect handlers, Alt-hover wiring, overlay
  composition.
- `packages/scene-renderer/` (+ Rust encoder if corner radius is truly
  dropped) — measurement overlay block; corner-radius verification.
- `docs/architecture/` — interaction-conformance, selection-and-hit-testing,
  renderer, research-ledger, input-and-tools updates.
- No document schema change; no protocol version bump expected (overlay
  additions are additive; verify against v5 rules).

## Explicitly Out of Scope

- `distribute-nodes` — open item of tranche 1; not duplicated here.
- Text tool, on-canvas text editing, caret model (needs the text stack —
  substrate gap #2; separate change).
- Frame clipping, images/assets, gradients/shadows (renderer substrate;
  `glass-fills` / future changes).
- Tidy-up / equal-spacing handles (builds on measurement + rhythm snapping;
  next tranche once measurement lands).
- Lasso and containment-marquee modifier (deliberate-fork decisions recorded
  in the conformance doc, not implemented here).
- Components, prototyping, comments, multiplayer (own changes/ADRs).

## Risks

- The two "suspected" items (⌘D repeat, corner radius) may already be partly
  implemented; tasks order verification before implementation so the change
  shrinks rather than double-ships.
- Alt-hover pills put text on the overlay path for the first time; if glyph
  layout in overlays proves heavier than expected, the pill falls back to
  line-only rendering and the pill requirement moves to the next tranche
  (recorded trigger, per config design rules).
