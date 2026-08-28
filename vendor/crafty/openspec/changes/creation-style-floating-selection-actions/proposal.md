# Creation Style and Floating Selection Actions

Status: **Proposed**, 2026-08-13.

## Why

**Current — confirmed UX gap.** New rectangle and ellipse nodes use hard-coded fill/stroke values, while line, frame, and pen each use different hard-coded values (`packages/editor/src/ui/editor/harness.ts:2740-2741`, `:3276-3277`, `:3317-3318`, `:3363-3364`, `:3398-3399`). The bottom shell currently exposes selection color controls, not defaults for future creations (`apps/web/editor/src/app/editor/[slug]/layout.tsx:233-240`), so users cannot choose a creation style before drawing.

**Current — confirmed placement defect.** `EditorSelectionActions` is a self-wiring leaf, but it is composed in the top bar and merely disabled without a selection (`packages/editor/src/ui/editor-primitives/selection-actions.tsx:11-44`; `apps/web/editor/src/app/editor/[slug]/layout.tsx:138-157`). Duplicate/delete therefore do not travel with selected geometry even though the editor projection already exposes an authoritative `selectionBox`, viewport, and canvas size (`packages/editor/src/ui/editor/harness.ts:173-204`).

**Proposed improvement.** Give creation tools an explicit ephemeral fill/stroke preset and place selection actions near the selected geometry, while preserving the authored-document, coordinate-authority, external-store, SSR, and no-pointer-move-panel-render invariants.

## What Changes

- Add a kernel/editor-owned ephemeral creation-style preset with explicit fill and stroke setters. It affects future rectangle, ellipse, frame, line, and pen creation, never selection colors.
- Start with current coherent defaults: fill `#818cf8` and stroke `#c4b5fd`, matching current rectangle/ellipse creation. Apply the selected pair consistently across the five creation tools; open line/pen paths retain their open-path geometry, so fill remains authored intent even when it is not visually applied until closure.
- Snapshot the preset when a rectangle/ellipse/frame/line creation gesture starts and when a pen session begins. Later preset changes do not restyle an in-progress creation.
- Compose creation controls directly to the left of the bottom toolbar in the Server Component layout, distinct from selection color controls.
- Move `EditorSelectionActions` out of the top bar and portal it after mount into the stage positioning context. Compute its position purely from the authoritative selection box, viewport, stage size, and measured action-surface size: prefer 10 px above, flip below, clamp horizontally, and hide for no selection or a fully offscreen selection.
- Make the floating actions an accessible toolbar and prevent its pointer interaction from propagating to the canvas gesture owner.
- Add kernel/harness, pure placement, leaf-surface, SSR, and render-isolation tests before implementation.

## Capabilities

### New Capabilities

- `editor-kernel/creation-style`: Observable creation-preset semantics, tool coverage, gesture/session snapshot timing, and ephemerality.
- `editor-ui/selection-action-placement`: Observable floating selection-action placement, visibility, interaction, and accessibility behavior.

### Modified Capabilities

None. `openspec/specs/` has no deployed capability specs at this base revision; active change deltas are not modified.

## Impact

- **Target:** `packages/editor/src/kernel/` and `packages/editor/src/ui/editor/harness.ts` external-store projection and creation paths; no document schema, serialization, or history change.
- **Target:** editor UI primitives/context/stage positioning integration and `apps/web/editor/src/app/editor/[slug]/layout.tsx` composition.
- **Target:** tests in the kernel/harness and UI primitive/placement seams; architecture docs only if implementation changes documented reality.
- No dependency, renderer packet, Rust, persistence, or save API change. This is not ADR-worthy because it preserves every existing ownership boundary.

## Explicitly Out of Scope

- Implementation in this proposal change.
- A generic toolbar, container, portal, positioning, or floating-surface framework.
- Persisted or per-file presets; document/schema/save/history mutation.
- Gradients, glass, tokens, themes, or component semantics.
- Selection multi-color redesign or coupling creation controls to selected-node colors.
- Renderer protocol, Rust, WebGPU, or authored geometry changes.
- Snapping behavior or the rejected snapping work currently dirty in the primary workspace.
- An ADR.
