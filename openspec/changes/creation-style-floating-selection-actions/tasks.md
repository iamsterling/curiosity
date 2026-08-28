## 1. Red acceptance tests — creation style

- [x] 1.1 Add kernel/external-store tests for initial `{fill: "#818cf8", stroke: "#c4b5fd"}`, explicit independent setters, stable no-op setter behavior, and sliced subscription updates
- [x] 1.2 Add byte-equivalence and state tests proving preset-only changes do not alter serialization/save payload, document revision, history, undo, or redo
- [x] 1.3 Add a table-driven harness acceptance test proving rectangle, ellipse, frame, line, and pen author the selected fill/stroke pair
- [x] 1.4 Add red timing tests proving rectangle/ellipse/frame/line snapshot style at gesture start and pen snapshots at session begin, including a mid-gesture/session style change

## 2. Red acceptance tests — floating selection actions

- [x] 2.1 Add table-driven pure placement tests for no selection, transformed four-corner projection, 10 px above, below flip, horizontal clamp, partially visible selection, and fully offscreen hiding
- [x] 2.2 Add UI boundary tests for portal-after-mount, absent-host/SSR safety, toolbar accessible name, named keyboard-operable actions, and pointer-down propagation isolation
- [x] 2.3 Add render-isolation coverage proving pointer-move placement does not use React state or notify/re-render unrelated panel slices

## 3. Kernel-owned creation style

- [x] 3.1 Add ephemeral creation style to the kernel external-store state/projection with explicit fill and stroke setters that emit only on real changes and never dispatch commands
- [x] 3.2 Capture one immutable style pair at each shape-gesture start and at pen-session begin; ensure cancel/commit clears only the capture, not the current preset
- [x] 3.3 Replace rectangle, ellipse, frame, line, and pen hard-coded creation colors with the captured pair while preserving each tool's geometry, transaction, and history behavior
- [x] 3.4 Confirm agents and non-React harness callers observe and use the same kernel-owned preset path rather than a UI-only state path

## 4. Creation controls and shell composition

- [x] 4.1 Add the focused self-wiring creation fill/stroke controls with slice subscriptions and explicit setter calls; keep them behaviorally and visually distinguishable from selection color controls
- [x] 4.2 Compose the two creation controls directly in the Server Component layout immediately left of the bottom tool toolbar without introducing a toolbar/container wrapper
- [x] 4.3 Remove `EditorSelectionActions` from the top bar without changing the top bar's remaining self-wiring primitives

## 5. Stage-owned floating placement

- [x] 5.1 Add the pure placement function using projection `selectionBox`, authoritative kernel `worldToScreen`, stage size, measured surface size, and the specified visibility/flip/clamp policy
- [x] 5.2 Add the narrow stage positioning host/registration context and mount-only portal target without passing editor state through context or reading browser globals during render
- [x] 5.3 Register `EditorSelectionActions` with the stage host, retain self-wiring duplicate/delete calls, add named toolbar semantics, and stop pointer-down propagation before stage gesture handling
- [x] 5.4 Integrate placement with the stage-owned direct-snapshot/rAF path and surface/stage resize invalidation, applying visibility/transform imperatively without pointer-move React state updates

## 6. Overlap guard and documentation

- [x] 6.1 Before implementation, compare the worktree diff against base and reject any change to snapping-owned files/hunks (`grid*`, `snap*`, or unrelated snapping edits in interaction/harness); do not copy the primary workspace's rejected snapping diff
- [x] 6.2 Confirm the implementation adds no generic floating-surface framework, persisted preset, schema/protocol/Rust change, ADR, gradients/glass/tokens, or selection multi-color redesign
- [x] 6.3 Update architecture documentation only where implemented reality changes, preserving Current/Target labels and documenting external-store ownership, stage positioning, and SSR/render boundaries

## 7. Verification

- [x] 7.1 Run focused kernel/harness and UI placement/accessibility/SSR tests and record raw passing output — recorded in `verification.md` §1: editor suite 134 passed (4 files), mounted/web suite 15 passed (2 files)
- [x] 7.2 Run `bun run typecheck`, `bun run test`, `bun run lint`, and `bun run format:check`; run `bun run build` if implementation touches build-sensitive web composition — recorded in `verification.md` §3: typecheck 13/13 (fresh forced 6/6 on changed packages), test 26/26 fresh forced, editor-web build 6/6 fresh forced, format:check clean, and lint reporting exactly the repository-baseline findings in `scripts/seal.mjs`, `scripts/randomize.mjs`, and `scripts/freeze.mjs` (isolated-baseline proof: this change touches no `scripts/` path and lint flags no file this change touched)
- [x] 7.3 Run `openspec validate creation-style-floating-selection-actions --strict` and confirm every acceptance scenario is represented by a test or explicit review check — valid (exit 0); scenario→test mapping in `verification.md` §4
- [x] 7.4 Inspect the final diff against base: only capability implementation/tests/necessary docs are present, no existing test was weakened, and forbidden snapping/source overlap is absent — diff stat and forbidden-path check in `verification.md` §5
