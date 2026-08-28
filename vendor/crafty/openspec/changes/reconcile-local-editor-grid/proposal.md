# Reconcile Local Editor Grid and Chrome

Status: **Proposed**, 2026-08-13.

## Why

**Current — confirmed semantic regression.** The accepted localhost policy reveals the fixed grid strictly above `510%`, reaches `0.60` at `600%`, and remains at `0.60` thereafter. Current `origin/main` instead defines `400%` to `800%` and `0.65` in the shared kernel policy (`packages/editor/src/kernel/grid.ts:19-21`) and host projection (`packages/editor/src/ui/editor/overlay.ts:1-16`). This changes both onset and brightness: the old curve appears prematurely and is brighter until roughly `5.45×`, then is dimmer than the approved curve through `7×` before ending brighter at `8×`. It also changes when rendered-grid snapping becomes eligible.

**Current — stronger upstream behavior to preserve.** Current `origin/main` also has accepted-successful-packet-only snap eligibility, exact page/camera/size/DPR/descriptor invalidation, quarter-step grid capture with a free interval, renderer lifecycle reconciliation, constrained-resize evidence validation, cancellation guards, creation-style controls, and stage-relative offscreen-aware floating selection actions. Those protections postdate the localhost reference and must not be reverted.

**Current — compatible presentation opportunity.** The localhost layout groups history separately from panel toggles in centered pills. Current `origin/main` has one pill with redundant separators (`apps/web/editor/src/app/editor/[slug]/layout.tsx:141-159`). The grouping can be adopted while keeping creation controls and `EditorSelectionActions` in their newer behavior-owning locations.

## What Changes

- Restore the exact shared grid reveal policy: opacity `0` through `5.1×`, linear interpolation to `0.60` at `6×`, and `0.60` at and above `6×`.
- Keep packet emission/acceptance and animated opacity distinct: only a successfully accepted matching packet with positive animated opacity enables grid snapping.
- Retain the upstream quarter-step capture radius, free interval, invalidation matrix, renderer lifecycle, interaction hardening, creation style, and floating selection actions.
- Split centered top chrome into a history pill and a panel-toggle pill, composed directly by the Server Component layout and marked for the existing chrome-glass fallback path.
- Update Current architecture claims and record focused/full verification evidence.

## Capabilities

### New Capabilities

- `editor-grid/reconciled-reveal`: exact visibility curve plus rendered-packet eligibility semantics.
- `editor-ui/reconciled-top-chrome`: compatible pill grouping that preserves newer behavior placement.

### Modified Capabilities

None. This reconciles active implementation lineages without changing document or renderer contracts.

## Impact

- `packages/editor/src/kernel/grid.ts` remains the single policy source consumed by rendering and snapping.
- Focused editor kernel/host/overlay tests change only where the approved curve changes or missing packet-versus-style evidence is added.
- `apps/web/editor/src/app/editor/[slug]/layout.tsx` changes presentation grouping only; leaf behavior and the React boundary remain unchanged.
- No document schema, renderer packet/version, Rust, persistence, dependency, or authored/resolved boundary change. No ADR is required.

## Explicitly Out of Scope

- Deployment, push, or production mutation.
- Reverting any upstream snapping, constrained-resize, cancellation, emission, creation-style, or floating-placement hardening.
- Moving selection actions back into fixed top chrome or removing creation controls.
- Importing untracked designs, extending legacy `Scene`, changing renderer ownership/protocol, or adding a fallback backend.
- Pixel-perfect reproduction of unrelated localhost chrome.
