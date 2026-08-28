# Design — Reconcile Local Editor Grid and Chrome

## Context

This is an origin-first semantic reconciliation. The localhost reference supplies two accepted user-visible intents: the `5.1× → 6×`/`0.60` grid curve and separate centered top-chrome pills. Current `origin/main` supplies stronger interaction and lifecycle semantics that remain authoritative. The implementation therefore changes only the shared policy constants, focused assertions/documentation, and compatible Server Component composition.

## Goals / Non-Goals

**Goals:** exact approved curve; one rendering/snapping policy; successful-packet-only snapping; preservation of all later interaction protections; separate history/panel pills; retained creation controls and floating selection actions; evidence that distinguishes a dim packet from an absent packet.

**Non-goals:** schema/protocol/Rust changes, interaction redesign, generic toolbar/container components, state drilling, production mutation, or screenshot-driven behavior removal.

## Decisions

### 1. Restore the curve in the kernel policy source

`GRID_VISIBILITY_START_ZOOM`, `GRID_VISIBILITY_END_ZOOM`, and `GRID_MAX_OPACITY` remain exported by the kernel grid service. They become `5.1`, `6`, and `0.60`. `gridVisibilityProgressAt` remains clamped linear interpolation, and `gridOpacityAt` continues multiplying that progress by the shared maximum. Thus rendering and snapping cannot drift into separate definitions.

Alternatives rejected: host-only styling would leave snapping on a different threshold; a second compatibility curve would create two authorities; changing animation duration is unrelated to the approved curve.

### 2. Preserve packet acceptance as a separate eligibility gate

Visibility styling determines target/animated opacity. Snap eligibility still requires a synchronous successful renderer result and an accepted context exactly matching page, camera, canvas size, DPR, and every descriptor field. Failure, non-ready submission, recreation/recovery, or mismatch clears eligibility. The accepted opacity is clamped to the shared `0.60` maximum.

Alternatives rejected: zoom-only snapping can magnetize an absent grid; packet-presence-only snapping can magnetize a zero-opacity activation packet.

### 3. Do not replay the localhost interaction diff

Current upstream quarter-step capture, free interval, snap evidence, constrained-resize final-geometry checks, preview/commit parity, cancellation, and emission guards remain unchanged. Focused tests are updated only for new threshold/maximum inputs; existing safety suites are the preservation witness.

### 4. Adopt only compatible shell grouping

The Server Component layout directly composes two centered pills: history and panel toggles. Each pill keeps the existing declarative chrome-glass markers and CSS fallback. `EditorSelectionActions` remains after the bottom tool nav so its stage host can portal and position it; creation fill/stroke controls remain left of that nav. No wrapper, callbacks, or editor state are added.

Alternative rejected: reproducing localhost literally would move selection actions back into fixed chrome and remove creation controls, reverting approved upstream behavior.

## Verification Strategy

- Red/green table tests pin `4`, `5.1`, `5.55`, `6`, `7`, and `8` target opacity and explicit absent-versus-positive-opacity packet projection.
- Existing lifecycle and harness tests witness successful-only acceptance, invalidation, renderer reset/failure, quarter-step/free interval, constrained resize, cancellation, and preview/commit equality.
- The RSC structural test pins two direct top-chrome pills while retaining creation controls and the single post-nav floating action leaf.
- Safe browser/runtime evidence is attempted only if a supported local WebGPU runtime can be started; otherwise the missing visual oracle is reported separately and packet-level evidence supplies the diagnosis.

## Risks / Trade-offs

- The faster curve makes the grid materially brighter between `5.1×` and `8×`; this is the approved localhost behavior, not an optimization.
- At exactly `5.1×`, progress and opacity are zero, so the packet omits grid geometry and snapping is ineligible. Strictly above it, animation may first submit opacity zero before later positive packets; snapping follows accepted animated opacity rather than target style.
- Separate pills consume slightly more horizontal space. Existing centered flex composition and no behavior relocation bound the impact.

## Migration and ADR Assessment

No data migration. Rollback changes constants and presentation classes only. No ADR trigger is crossed: authored/resolved ownership, document schema, command/history model, renderer protocol/ownership, dependencies, and persistence are unchanged.
