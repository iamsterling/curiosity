# Design — Canvas Actions Parity, Tranche 2

## Context

See `proposal.md` — Why. Constraints that shape the approach: the pure
interaction reducer with closed per-tool effect vocabularies
(`interaction.ts:153` `TOOL_EFFECT_VOCABULARIES`), the one-drag-one-transaction
invariant, ephemeral-state-never-serialized, and the modifier grammar ratified
2026-08-09 (`interaction.ts:195-198`: ⌥ = duplicate/measure/from-center and
never pan; ⌘ = deep-select/snap-bypass; ⇧ = additive/constrain; Space/middle =
pan). Overlay content composes after the authored packet and the protocol is
at v5 (`draw-protocol.ts`: geometry `rect | path | text`).

## Goals / Non-Goals

**Goals:** close the tranche's six capabilities entirely inside the existing
architecture — reducer states + effects, harness effect handlers, kernel pure
helpers, additive overlay blocks. No schema change, no new dependency.

**Non-Goals:** any text-measurement service (pills draw digits; they do not
measure layout); tidy-up; generalizing isolation into a component-editing
scope (that decision belongs to the components fork named in
`interaction-conformance.md`).

## Decisions

1. **Isolation lives in `EditorState` as the already-declared
   `isolationRootId`, written only by the reducer.**
   Double-click routing follows the existing descend logic
   (`interaction.ts:267-271`); scoping is applied where candidates are
   enumerated (`documentHitTest`, `marqueeSelectableIds`, select-all,
   traversal helpers) by passing the root as the search origin.
   *Alternative considered:* a harness-level filter over unscoped kernel
   results — rejected because marquee scoping already takes a `scopeId`
   (`interaction.ts:515`) and two scoping mechanisms would drift.
   *Prior art:* Illustrator isolation (dimming deferred), Figma drill.
   We follow the enter/exit ladder, defer the dimmed-context rendering —
   trigger to un-defer: user feedback that scope state is illegible without
   it.

2. **Creation modifiers are reducer inputs, not harness special cases.**
   The pointer-move input already carries modifier flags; the creation
   preview effect gains `constrain`/`fromCenter` parameters and a
   `repositionBy` delta while Space is latched. The existing Space latch in
   `keyboard-bindings.tsx` must be suppressed while a creation gesture owns
   the pointer (navigation-cancels-first stays true for pinch/wheel; Space
   during creation is the one documented exception, matching
   `input-and-tools.md`'s planned behavior).
   *Alternative:* commit-time constraint application — rejected; the preview
   must show the constrained shape or the gesture lies.

3. **Duplicate-repeat is a harness-held ephemeral `{sourceIds, delta}`
   record, not history inspection.**
   Recorded when a duplicate's copies are moved (Alt-drag commit or a move
   transaction whose node set equals the last duplicate's output); cleared on
   the events the spec names. ⌘D consults it before dispatching.
   *Alternative considered:* deriving the offset by scanning history —
   rejected: history entries are inverse commands, not provenance, and
   reading them for semantics violates their contract.
   *Prior art:* Figma/Sketch "smart duplicate", Illustrator Transform Again —
   followed for offset repetition; Illustrator's generalized
   transform-again (rotation/scale repeat) is deferred until rotation is
   commonly duplicated (trigger: rotate-then-duplicate usage appearing in
   telemetry or user request).

4. **Measurement facts are a pure kernel function
   (`rect × rect → per-axis gap/overlap`), Alt-hover wiring reuses the hover
   path.**
   The existing idle-pointer hover (`harness.ts:1325`) plus an Alt flag
   produces facts; no new pointer plumbing. Facts flow into the overlay
   composer beside snap guides (`editing-overlays.ts`).
   *Alternative:* computing in the overlay layer — rejected; kernel-first
   keeps it testable without a browser, matching the snap-move precedent.

5. **Pills render through the protocol's existing text channel; lines
   through the overlay line channel.**
   No protocol version bump: the overlay packet gains an additive
   measurement block, mirroring how snap guides landed. If pill glyph
   rendering on the overlay path proves unavailable or heavy, lines ship
   without pills and the pill requirement carries a diagnostic
   (`renderer/measurement-overlay` spec, degradation requirement) — the
   recorded trigger to revisit is that diagnostic appearing in verification.

6. **Corner radius: verify before building.**
   First task confirms whether the Rust encoder consumes the protocol's
   radius field. If it renders already, the change reduces to hit-test
   agreement + doc correction; if dropped, encode a rounded-rect path at
   tessellation, clamped per spec. Hit-testing gains the same clamp in the
   kernel so draw and hit can't disagree.
   *Alternative:* spec-ing only the renderer and leaving hit-testing square —
   rejected; a visible notch that still hits is the audit's "gap wearing a
   feature's clothes" pattern.

## Risks / Trade-offs

- [Space-during-creation conflicts with the pan latch] → the reducer owns the
  pointer during creation (one-owner-per-session invariant); the keyboard
  latch checks gesture ownership before arming pan. Covered by a dedicated
  arbitration test.
- [Repeat-delta heuristics misfire (recording a move that wasn't "the
  duplicate's move")] → the record keys on exact node-set equality with the
  last duplicate's output; anything else clears it. Conservative by design —
  a missed repeat is a no-op placement, never a wrong placement.
- [Isolation + locked/hidden interplay surprises] → scoped enumeration reuses
  the existing disqualification filters (`interaction.ts:460`, `:521`), so
  locked/hidden semantics are inherited, not re-implemented.
- [Overlay text is the first non-authored glyph path] → degradation
  requirement in the spec; lines-without-pills is an acceptable shipped
  state.

## Migration Plan

No schema or protocol version change; all additions are additive and
ephemeral. Rollback is reverting the change; no document written under this
change differs from one written before it.

## Open Questions

- Whether isolation should dim non-scope content visually (deferred with
  trigger above) — safe to answer later; specs constrain behavior, not
  presentation.
- Whether the measurement pill number should localize decimal separators —
  deferable until localization exists anywhere in the product.
