# Input and Tools

Status: **Current** for the reducer and `select`, `rectangle`, `ellipse`, `line`,
`frame`, `hand`, and `pen`. **Target** for the missing tools and remaining pen
polish listed below.

Source of truth: `packages/editor/src/kernel/interaction.ts`.

## The problem this solves

The defect that motivated this design: pointer-down on empty canvas immediately
began drawing a rectangle, so zooming, panning and mis-clicking all produced
stray shapes. That is not a bug in a handler — it is what happens when tool
behaviour is inferred from event properties scattered across pointer callbacks.

The fix is not more guards. It is making the invalid transition unrepresentable.

## The reducer

```ts
transitionInteraction(state, input, context) => { state, effects[] }
```

Pure. No DOM, no kernel, no side effects. `context` supplies the viewport, the
drag threshold, and a `hitTest(point) => DocumentId | undefined` callback so the
reducer never needs to know how hit testing works.

### States

`idle → armed → captured | preview → committed | cancelled`

- **idle** — no gesture.
- **armed** — pointer is down, but below the drag threshold. Nothing durable has
  happened.
- **captured** — a navigation gesture (pan) owns the pointer.
- **preview** — the gesture has passed the threshold and is producing preview
  effects.
- **committed** / **cancelled** — terminal for this gesture; the next input
  starts from `idle` for the same tool.

### Effects

The reducer emits intents, not mutations:

```
select | begin-marquee | update-marquee | commit-marquee
begin-pan | pan | zoom
preview-rectangle | commit-rectangle | commit-ellipse | commit-line | commit-frame
move | rotate | corner-radius
pen-begin | pen-add-point | pen-preview | pen-close | pen-join | pen-end
pen-select-points | pen-move-points | pen-move-handle | pen-cycle-type | pen-delete-point
cancel
```

`CanvasEditor.applyEffect` (`harness.ts:519`) is the only place effects become
kernel calls. That indirection is what lets the whole interaction model be tested
without a browser (`interaction.test.ts`, 11 tests).

## Tool effect vocabularies

The core safety mechanism (`interaction.ts:33`):

```ts
TOOL_EFFECT_VOCABULARIES = {
  select:    { select, begin-marquee, update-marquee, commit-marquee, move,
               rotate, corner-radius, begin-pan, pan, cancel, zoom },
  rectangle: { begin-pan, pan, preview-rectangle, commit-rectangle, cancel, zoom },
  ellipse:   { begin-pan, pan, preview-rectangle, commit-ellipse, cancel, zoom },
  line:      { begin-pan, pan, preview-rectangle, commit-line, cancel, zoom },
  frame:     { begin-pan, pan, preview-rectangle, commit-frame, cancel, zoom },
  hand:      { begin-pan, pan, cancel, zoom },
  pen:       { begin-pan, pan, cancel, zoom, pen-* },
}
```

Each tool declares the closed set of effects it may emit. Only each matching
creation tool can emit its commit effect. A zoom, a pan, a pinch or a select
**cannot** produce a shape, because those effects are not in its vocabulary.

When you add a tool, add its vocabulary entry. When you add an effect, decide
which tools may emit it. This table is the contract; the reducer body is the
implementation of the contract.

## Routing order

Arbitration happens in one place, in this order (`interaction.ts:45`):

1. **Wheel / pinch — navigation.** Classified before anything else. If a gesture
   is in flight it is reset to `idle` and only a `zoom` effect is emitted. A
   navigation input can never arm or continue creation.
2. **Navigation modifiers on pointer-down.** Hand tool, middle button, or
   Space → `captured` + `begin-pan`, regardless of the active tool. Alt is
   deliberately NOT navigation: the ratified modifier grammar spends Alt on
   duplicate / from-center / measure (the industry grammar — see the QOL
   program, `docs/architecture/qol-program.md`).
3. **Tool dispatch.** Rectangle, ellipse, line, and frame arm box/endpoint
   creation; pen routes anchor/path editing; select hit-tests.
4. **Threshold.** In `armed`, a move shorter than `context.dragThreshold` (4px in
   the browser, `harness.ts:28`) produces no effect at all.
5. **Commit.** On pointer-up, box tools commit only if both draft dimensions
   reach the threshold; line commits its endpoints (including its click default);
   a marquee likewise requires threshold geometry.

Exactly one owner per pointer session. There is no fallthrough.

## Multi-pointer and platform gestures

Handled in the harness because they are platform concerns, but they defer to the
same rule — navigation cancels first:

- **Two-finger pinch** (`harness.ts:377`): the second pointer-down calls
  `cancelGesture()` *before* establishing the pinch, so a pinch can never
  continue an in-flight creation. Pinch then drives `zoomAt` plus a midpoint
  translation directly.
- **Safari `gesturestart/change/end`** (`canvas-stage.tsx:199`): guarded by
  `editor.isPinching()` so trackpad gestures and touch pinch do not compound.
- **Wheel** (`canvas-stage.tsx:184`): coalesced into a single `requestAnimationFrame`
  callback per frame; `ctrl`/`cmd` means zoom, `shift` means horizontal pan,
  otherwise two-axis pan. Browser page zoom is suppressed at the document level.
- **Escape** (`keyboard-bindings.tsx:57`): `cancelGesture()` → rollback, clear paste preview,
  return to the select tool.
- **`pointercancel`** routes to the same cancel path as Escape.

## Cancellation guarantees

| Trigger | Result |
|---|---|
| Escape | rollback open transaction, clear draft, reset to `idle`, tool → select |
| `pointercancel` | `cancel` effect, rollback, reset to `idle` |
| Wheel/pinch mid-gesture | rollback, clear draft, only `zoom` applied |
| Tool switch mid-gesture | rollback, clear draft (`harness.ts:134`) |
| Scroll-pan mid-gesture | rollback, clear draft (`harness.ts:416`) |

All of these converge on `kernel.rollback()`, which restores the whole
pre-transaction document. There is no partial-cancellation path.

## What is missing

The substrate is right; the tool set is small.

**Not implemented:** polygon, pen/path tool polish, text tool and text
editing, eyedropper, comment, slice, prototype connection, measure.

**Not modelled at all:**

- **Transform handles.** Implemented (QOL program, 2026-08-09): all eight
  handles arm against the TARGET's drawn handle positions (`handlePositionsOf`
  — exact under rotation, since the positions come from the world transform,
  never the AABB); the `move` effect carries the armed handle; the
  local-space resize math (`projectConstrainedResize`, `harness.ts`) pins the opposite
  edge with a size floor; shift preserves aspect, alt resizes from centre.
  **Rotate** is the ring just outside the corner handles (`armedRotate`),
  composing A = T(C−b)·R(θ)·T(b−C) around the box's world centre with a 15°
  shift snap — one invertible `set-transform` command.
- **Deep select.** Implemented: ⌘-click selects the DEEPEST node under the
  cursor (`documentDeepHitTest` — the max-depth hit, not the painter's
  topmost), double-click descends one level, Esc ladders out, Enter steps
  into a container, Tab cycles siblings. `isolationRootId` itself is still
  unset (isolation mode remains future work).
- **Snapping.** Live and wired to every tool: `kernel/snap.ts` is the single
  snap service (`snapPenPoint` for pen anchors with exact path-geometry
  priority and the segment midpoint indicator, `snapCorner` for rectangle and
  resize corners, `snapMove` for edge/corner-aligned move deltas with the
  alignment-guide payload). The harness supplies candidates — object world
  edges, visible guides, a host-confirmed nonzero-opacity grid, and the pen
  session's anchors as
  magnets — from `objectSnapPositions` (`snap.ts`). Tolerance is
  `SNAP_TOLERANCE_SCREEN_PX = 12` (`coordinates.ts:13`), the 10–15 px
  proximity band, world at use (÷zoom), except the visible grid family whose
  local capture radius is `min(12px / zoom, rendered grid step / 4)`. This
  leaves a smooth free interval between adjacent fine-grid lines without
  changing guide/object/rhythm/path tolerances. Chosen snap evidence is
  ephemeral and identifies family, axis, target value, and source feature;
  the same decision corrects geometry and lights the overlay. Only VISIBLE targets snap (a hidden
  grid never magnetizes); the pixel family is last in priority and excluded
  from moves, so a silent sub-pixel correction never shadows an alignment or
  flashes a guide line. The pen tool's landing dot is the snap indicator
  (accent when snapped); moves/resizes draw the accent alignment guides.
  The **rhythm family** (`grid.ts`) continues an inferred equal gap between
  objects (one outer edge per object — never one object's own dimensions),
  ranked below real object alignment: an alignment always beats an
  inference. After a successful packet submission, the host supplies the
  harness with an ephemeral accepted-grid context containing the packet's page
  id, exact `(panX, panY, zoom, width, height, pixelRatio)`, complete
  `GridDescriptor` snapshot, and
  animated opacity. Grid candidates are eligible only while the page, camera,
  and every descriptor field exactly match the live interaction context and
  opacity is positive; the shared visibility curve starts strictly above `510%`, reaches
  its capped `0.60` opacity at `600%`, and is never redefined by snapping.
  Failure, non-ready submission, renderer
  recreation/recovery, and cleanup clear the context. It is neither authored
  nor projected. The current
  pointer-move's ⌘/Ctrl modifier is passed
  through the pure reducer to `snapMoveDelta` on that same event, bypassing
  snapping without retained modifier state.
- **Modifier semantics during drag.** Shift-constrain-to-axis and
  alt-duplicate-drag exist (the duplicate decision is made at ARM time —
  releasing Alt mid-drag cannot cancel a gesture, the deferred-commitment
  property); space-to-reposition-while-creating does not.
- **Keyboard nudge.** Arrow keys move the selection (1 px; 10 px with
  Shift), one history entry per press, deliberately never snapped.

## Adding a tool

1. Add the tool to `EditorTool`.
2. Add its entry to `TOOL_EFFECT_VOCABULARIES` — the closed set of effects it may
   emit. Do this *first*; it is the design.
3. Add any new effect variants to `InteractionEffect`.
4. Implement the transitions in `transitionInteraction`, respecting the routing
   order: navigation is checked before tool dispatch, and nothing durable
   happens before the drag threshold.
5. Handle the new effects in `CanvasEditor.applyEffect`, mapping them to kernel
   commands. Continuous effects use `beginTransaction`/`preview`; terminal
   effects use `dispatch`.
6. Test the reducer directly in `interaction.test.ts` — no browser, no React.
   Include a cancellation case and a below-threshold case.

**Never** add tool behaviour by branching inside a DOM pointer handler. If you
find yourself writing `if (event.altKey && tool === ...)` in `canvas-stage.tsx`
or a panel, the routing order is being bypassed and the arbitration guarantee is
gone. Key bindings live in exactly one place (`keyboard-bindings.tsx`).

## Prior art

Studied, not copied: Penpot's workspace event and selection subsystems (selection
as an interruptible subsystem with focus and parent-expansion), and tldraw's
public tool/state-node API (tools as first-class extensible state machines with
one owner per gesture). See [`research-ledger.md`](research-ledger.md).
