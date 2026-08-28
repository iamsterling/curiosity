## 1. Verification before building (suspected items)

- [x] 1.1 Verify whether ⌘D currently repeats a moved duplicate's offset (`keyboard-bindings.tsx`, `harness.ts` duplicate path); record the finding in the proposal if it shrinks scope
- [ ] 1.2 Verify whether the Rust encoder consumes the protocol's corner-radius field (`scene-renderer/rust/src/vello_encoder.rs`, `lib.rs` layer deserializer); record whether `renderer.md:411-441` is stale or the value is dropped
- [ ] 1.3 Verify Shift/Alt behavior during creation drags today (`interaction.ts:421-443`, commit paths `harness.ts:3108-3298`); note which creation-gesture requirements are already met

## 2. Isolation scope (spec: `editor-kernel/selection-scope`)

- [ ] 2.1 Reducer: write `isolationRootId` on qualifying double-click (already-selected container), descend on repeat, unwind on Escape before deselect, clear on page/tool switch and root deletion (`interaction.ts`)
- [x] 2.2 Scope candidate enumeration to the isolation root: `documentHitTest`, `marqueeSelectableIds` (reuse the existing `scopeId` parameter), select-all, and Tab traversal helpers (`harness.ts:1779-1805`)
- [ ] 2.3 Exit isolation on click outside the root's bounds; the click then behaves as a top-level click
- [x] 2.4 Assert isolation state is never serialized (kernel snapshot test) and never restored by undo/redo
- [ ] 2.5 Kernel tests: enter/descend/unwind ladder, scoped marquee, scoped select-all, root-deletion exit, locked/hidden nodes stay disqualified inside isolation

## 3. Creation-gesture modifiers (spec: `editor-kernel/creation-gestures`)

- [ ] 3.1 Extend the creation preview effect with `constrain` (square/circle/45°) and `fromCenter` parameters computed in the reducer from live modifier flags; releasing a modifier mid-drag restores free geometry
- [ ] 3.2 Space latch arbitration: while a creation gesture owns the pointer, Space translates the in-progress shape (`repositionBy`) instead of arming pan; add the arbitration test (pinch/wheel still cancel first)
- [ ] 3.3 Apply constrained geometry in all four commit paths (rect/ellipse/line/frame — `harness.ts:3108/3138/3183/3228`); frame absorption uses the final constrained bounds
- [ ] 3.4 Harness tests: shift-square, shift-45° line, alt-center, shift+alt compose, space-reposition mid-drag, Escape cancels with no document change, one history entry per creation

## 4. Duplicate-with-offset repeat (spec: `editor-kernel/duplicate-repeat`)

- [ ] 4.1 Record the ephemeral `{sourceIds, delta}` repeat record on Alt-drag-duplicate commit and on a move transaction whose node set equals the last duplicate's output (`harness.ts:2438`, move commit path)
- [ ] 4.2 ⌘D consults the record: offset placement + select new copies when it matches the current selection; clear on selection change to unrelated nodes, page switch, unrelated document edit
- [ ] 4.3 Tests: three-step array build, whole-selection offset, unrelated-edit reset, undo removes one step, record never serialized

## 5. Measurement facts (spec: `editor-kernel/measure-distances`)

- [x] 5.1 Pure kernel `measureDistances(a, b)` → per-axis gap/overlap facts, plus `measureToParentEdges(child, container)`; unit tests for disjoint, overlapping, contained, and touching rects
- [ ] 5.2 Wire Alt + idle hover (`harness.ts:1325`) to produce facts for selection→hover (skip when hover target is in the selection) and selection→parent on empty container space
- [ ] 5.3 Clear facts on Alt release, hover loss, tool switch, any drag start; assert no history entries and no serialization
- [ ] 5.4 Harness tests: gap fact matches world units under zoom, parent-edge facts, clearing matrix

## 6. Measurement overlay (spec: `renderer/measurement-overlay`)

- [ ] 6.1 Add the additive measurement block (lines + pills) to the overlay packet beside snap guides (`draw-protocol.ts`, schema tests in `draw-protocol.test.ts`; no version bump — confirm against v5 additivity rules)
- [ ] 6.2 Compose the block in `editing-overlays.ts` from kernel facts; fixed screen thickness/size derived at compose time from zoom
- [ ] 6.3 Host draws lines and pills; pill number formatting (≤2 decimals, no trailing zeros); pill-text-unavailable path emits the stable diagnostic and still draws lines; host tests for both paths
- [ ] 6.4 Export-path test: exported frame contains no measurement content

## 7. Corner radius (spec: `renderer/corner-radius`)

- [ ] 7.1 Per 1.2's finding: either encode rounded-rect geometry at tessellation with the half-min-dimension clamp, or (if already rendering) add the missing clamp/incremental coverage only
- [ ] 7.2 Kernel hit-testing honors the rounded silhouette with the same clamp (`interaction.ts` narrow phase); notch-miss test
- [ ] 7.3 Render tests: radius renders and scales with zoom, zero radius square, oversized radius clamps, incremental update identical to full render

## 8. Docs rebaseline and reconciliation

- [ ] 8.1 Re-score `docs/architecture/interaction-conformance.md` rows closed since 2026-08-07 with `path:line` evidence (handles, rotate, snap wiring, keyboard layer, hover, marquee scope, tool registry, layers panel, protocol v5 text/path); fold the cross-product inventory's taxonomy and unresolved-forks list in as the target surface with explicit Crafty decisions where already made (⌥ never pans, ⌘ = snap-bypass, Esc ladder)
- [ ] 8.2 Correct `selection-and-hit-testing.md:140-146` (handle model exists) and add the isolation lifecycle; correct `renderer.md` stale gaps per ADR 0020 and per 1.2's corner-radius finding
- [ ] 8.3 Reconcile `canvas-actions-parity-tranche-1/tasks.md`: check implemented items with evidence; leave `distribute-nodes` open and note it as the sole remaining item
- [ ] 8.4 Record the six-cluster research in `docs/architecture/research-ledger.md` (sources, lesson, Crafty conclusion: adopted/adapted/deferred), citing this change
- [ ] 8.5 Update `input-and-tools.md` for space-reposition, creation modifiers, isolation, duplicate-repeat, and Alt-measure

## 9. Mechanical verification

- [ ] 9.1 `npm run typecheck && npm run test && npm run lint && npm run format:check`
- [ ] 9.2 `npm run build` (overlay packet and any encoder change cross the wasm/webgpu boundary)
- [ ] 9.3 Confirm no existing test or fixture was weakened; re-run the interaction arbitration suite specifically
