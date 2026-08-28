# Canvas QOL Program — Execution Plan

Source: "Crafty Canvas QOL — Gap Analysis" (2026-08-09, Claude artifact
c95711ac). All claims verified against the code 2026-08-09. This document
tracks execution, tier by tier. Status: `[]` = todo, `[~]` = in progress,
`[x]` = done, `[!]` = blocked/deferred with reason.

## Phase A — Fix-first (broken promises)

- [x] Inspector X field reads/writes `bounds.y` → reads/writes `bounds.x`.
      (Verified: `panels/inspector.tsx:297,299`.)
- [x] Bind the advertised context-menu shortcuts: ⌘G group, ⇧⌘G ungroup,
      ⌘] / ⌘[ reorder. (Verified: `canvas-context-menu.tsx:150-204` vs
      `keyboard-bindings.tsx` — nothing bound.)
- [x] ⌘0: currently intercepted and does nothing
      (`keyboard-bindings.tsx:108-111`) → zoom to 100% at canvas center.
- [x] Keep the canvas grid present as a subtle overlay above the 5.1× zoom
      threshold (opacity 0 through 5.1×, rising to 0.60 at 6×, then holding
      there); there is no grid visibility toggle.
- [x] W/H inputs: commented out (`panels/inspector.tsx:334-337`) → re-enable
      numeric size entry.
- [x] ⇧⌘V paste-in-place (new `pasteInPlace` kernel command + binding).

## Phase B — Tier 1: table stakes

- [x] Nudge: arrows = 1px, ⇧-arrows = 10px (world units), never snaps.
      (`nudgeSelection`, one history entry per press.)
- [x] All 8 resize handles + ⇧-constrain + ⌥-from-center.
      (`interaction.ts` `handleAt`/`armedResizeHandle`; `harness.ts` `resizeRect`.)
- [x] Rotate: cursor ring just outside corner handles, ⇧ snaps to 15°.
      (New `set-transform` command; composes A = T(C−b)·R·T(b−C) on the
      authored transform, rotates around the box's world center.)
- [x] Duplicate: ⌥-drag copies (one history entry, undo removes the copy);
      ⌘D smart duplicate repeats the last alt-drag offset.
      (Kernel `planDuplicate` — multi-selection, ride-along aware.)
- [x] Deep select & hierarchy traversal: ⌘-click deepest leaf, double-click
      descends, Esc ladders out, Enter steps in, Tab cycles siblings.
      (`documentDeepHitTest` + harness traversal methods.)
- [x] Hover highlight on canvas (selection-box outline, no handles).
- [x] ⌘A select-all scoped to the current page.
- [x] Camera jumps: ⇧1 zoom-to-fit, ⇧2 zoom-to-selection, ⌘0 = 100%.
- [x] Ellipse + line tools (path geometry — the Figma/Sketch model, zero
      schema change); frame tool (frame node + absorbs contained objects).
- [x] Bind advertised shortcuts + ⇧⌘V paste-in-place + ⌘0 + ⌘A + ⌘D.
- [x] Kernel fix uncovered by alt-drag: transaction `preview` now computes
      inverses incrementally and accumulates commands across preview calls
      (dependent sequences: create → reorder → resize in one history entry).

## Phase C — Tier 2: unlock the kernel

- [x] Boolean ops UI — context-menu submenu over `boolean-operate`; the
      harness selects the minted result node.
- [x] Guides UI — edge strips (top/left) create guides by dragging in;
      transparent handles drag the rendered guide lines; one history entry
      per gesture (begin → preview → commit/rollback).
- [x] Snap settings surface — the per-page family toggles (grid/guides/
      objects/pixel) in a Snap popover; ⌘-held-while-dragging bypasses
      snapping through the current pointer-move's event-local modifier input.
- [x] Command palette — ⌘K opens the cmdk palette over the editor surface
      (tools, canvas jumps, edit, arrange).
- [x] Layers panel drag-reorder with before/after/inside drop indicators
      (index-based `reorder-node` / `reparent-node`).
- [x] Grid permanence confirmed; grid visibility is not user-configurable.

## Phase D — Tier 3: the feel layer

- [x] Modifier grammar ratified by implementation (Phase B): ⌘ = deep /
      snap-bypass · ⌥ = duplicate / from-center · ⇧ = constrain / big-step ·
      space + middle-drag + hand tool = pan (Alt freed).
- [x] Modifier grace — ARCHITECTURALLY ABSENT, which is the win: duplicate
      and from-center are decided at ARM time and commits use the last
      preview, so a keyup racing the mouseup can never cancel a gesture.
      (A tldraw-style 150ms timer would be speculative here.)
- [x] Equal-spacing gap snapping — the RHYTHM family in the kernel snap
      engine: one outer edge per object, consecutive gaps extended, ranked
      BELOW object alignment (a real alignment always beats an inference).
- [x] Camera animation with user preemption (easeInOutCubic, 220ms, cancelled
      by every input) + Back-to-Content button (viewport-emptiness selector).
- [x] Marquee scope-aware: a drag started inside a frame/group selects only
      that container's children (deepest-container walk from the start hit).
- [x] Number-key opacity (1–9), ⇧H/⇧V flip (center-anchored reflection).
- [x] Fix found while wiring frame absorption + panel reparent: cross-parent
      moves REBASE the placement into the new parent's local space (the
      kernel's reparent-node moves as-is by contract).
- [ ] Spacing readouts, alt-measure, frame name labels — BLOCKED on text
      rendering (Tier E).

## Phase D — Tier 3: the feel layer

- [ ] Ratify the modifier grammar; free ⌥ from pan (space/middle-drag cover
      panning) — ⌥ = duplicate / measure / from-center.
- [ ] 150ms modifier grace period (tldraw's deferred commitment).
- [ ] Equal-spacing gap snapping + spacing readouts (partial: spacing
      readouts are blocked on text rendering).
- [ ] Camera animation with user preemption + Back-to-Content affordance.
- [ ] Marquee scope-aware inside frames.
- [ ] Number-key opacity, ⇧H/⇧V flip, frame name labels.
- [ ] Alt-measure distances — BLOCKED on text rendering (Tier E).

## Phase E — Tier 4: strategic bets

- [x] Text rendering in Vello — **the keystone, done** (ADR 0020): protocol
      v5 `text` geometry; glyph tessellation via ttf-parser over an embedded
      Inter (OFL 1.1, license vendored); single-line advance ladder; text
      layers' scene rects suppressed; empty/missing glyphs draw nothing,
      never fail. Unblocks measurement readouts, rulers, frame labels and
      the text tool. No layout/text engine is selected (ADR 0024);
      Parley/Skrifa are historical research candidates only, and the
      embedded-Inter contour correction is a bounded compatibility foothold,
      not a foundation. Still absent: shaping, metrics, editing, font
      selection, line breaking (typography.md scope).
- [x] Viewport culling of authored content (ADR 0020): the Rust encoder
      skips layers whose world box cannot intersect the viewport; the
      selection is never culled; culled parents still recurse. The
      host-composed path/text channel is not yet culled (follow-up).
- [ ] Components/variables/styles UI — DEFERRED with reason: no
      create/instantiate commands exist and no resolution step consumes the
      schema (AGENTS.md: "Do not write code that assumes components work").
      Needs a design pass over resolution semantics (ADR territory) before
      UI; listed in the roadmap.
- [ ] GPU-native paint types (noise/mesh gradients) — DEFERRED: schema
      change to the fill vocabulary + new WGSL pipelines; the glass pipeline
      (ADR 0012) is the pattern to extend. Listed in the roadmap.
- [x] Multiplayer — left as the OpenSpec proposal (ADR 0017); not
      implemented here.

## The three decisions

1. Text: no engine committed — ttf-parser tessellation over embedded Inter
   is the bounded compatibility foothold (ADR 0020, corrected per ADR 0024);
   Parley/Skrifa are historical research candidates, not a selected stack.
2. Modifier grammar ratified by implementation (Phase B/D).
3. Quality weeks — this program is the first one.
