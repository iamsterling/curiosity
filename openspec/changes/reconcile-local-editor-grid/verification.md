# Verification — Reconcile Local Editor Grid and Chrome

Status: **Implementation verified with one inherited lint baseline failure**, final reconciliation refreshed 2026-08-14.

## 1. Isolation and origin

- Fresh fetch resolved `origin/main` to `9b90ad7dc9d20e873e889557115eee855c721681`.
- Branch: `integration/reconcile-local-editor-grid-03`.
- Worktree: `/private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/crafty-reconcile-local-editor-grid-03`.
- The reference checkout began at `95dce16d132c7ff9e8e7b2a4233c711795b11270`; its status and 227,187-entry content manifest were recorded outside both trees. The before/after manifest comparison is recorded below.

## 2. Red → green evidence

The first editor invocation was invalid because clean-worktree dependency outputs had not yet been built (`@crafty/scene-model` entry resolution), so it is not counted as red evidence. After dependency build, the unchanged implementation failed 15 of 57 focused grid tests for the approved thresholds/opacity/packet distinction. The independent shell test failed for the intended missing grouping:

```text
FAIL ... groups history and panel toggles in separate glass pills ...
expected [ 'data-chrome-glass' ] to have a length of 2 but got 1
Tests 1 failed | 10 passed
```

With implementation changed and tests untouched:

```text
✓ grid-host-render-loop.test.ts (16 tests)
✓ overlay.test.ts (15 tests)
✓ grid.test.ts (26 tests)
Test Files 3 passed (3)
Tests 57 passed (57)

✓ editor-layout-rsc-boundary.test.ts (11 tests)
Test Files 1 passed (1)
Tests 11 passed (11)
```

The broader interaction-preservation run was fresh:

```text
✓ interaction.test.ts (65)  ✓ canvas-render-context-lifecycle.test.ts (8)
✓ editing-overlays.test.ts (9)  ✓ overlay.test.ts (15)
✓ grid-host-render-loop.test.ts (16)  ✓ snap.test.ts (25)
✓ harness.test.ts (203)  ✓ grid.test.ts (26)
Test Files 8 passed (8)
Tests 367 passed (367)
```

This includes page/camera/size/DPR/descriptor invalidation, failure/recreation, quarter-step/free-interval, constrained-resize evidence, cancellation/emission hardening, and creation/move/resize preview-commit equality. No implementation file for interaction, snap orchestration, resize evidence, editing overlays, creation style, or stage positioning changed.

## 3. Exact packet/runtime diagnosis

Focused production-used functions record this settled packet table:

| Zoom | Integrated target | Integrated grid packet | Previous `origin/main` target | Previous packet |
|---:|---:|---|---:|---|
| 4 | 0 | absent | 0 | absent |
| 5.1 | 0 | absent | 0.17875 | present |
| 5.55 | 0.30 | present | 0.251875 | present |
| 6 | 0.60 | present | 0.325 | present |
| 7 | 0.60 | present | 0.4875 | present |
| 8 | 0.60 | present | 0.65 | present |

`overlay.test.ts` separately proves that above threshold an animated opacity of exactly zero omits grid geometry while `0.01` emits it with `0.01` line alpha. `grid-host-render-loop.test.ts` proves successful synchronous submission precedes accepted-context publication and failure/non-ready results never become eligible.

Safe browser evidence used a copied `.ui` package under the approved temp root and a branch server on `127.0.0.1:4275`; production was read only. Chrome loaded the integrated WebGPU scene successfully and displayed the reconciled two-pill top grouping. The read-only production tab at `485%` visibly rendered dense grid geometry, proving the production symptom is **not packet absence**. It is the old curve/policy mismatch: premature/stronger presence below roughly `5.45×`, dimmer output from that crossing through `7×`, and brighter output at `8×`. No additional absence mode was observed.

The browser accessibility surface cannot expose packet JSON/result values or set arbitrary exact zoom values, and window focus became unavailable during the attempted exact browser sweep. Therefore the exact six-point evidence is packet/runtime-unit evidence, not six GPU screenshots. This limitation is classified separately rather than presented as visual proof.

## 4. Repository gates

```text
$ openspec validate reconcile-local-editor-grid --strict
Change 'reconcile-local-editor-grid' is valid

$ bun run format:check
$ bun scripts/format-check.mjs
exit 0

$ bun run build
Tasks: 13 successful, 13 total
exit 0

$ bun run typecheck
Tasks: 13 successful, 13 total
exit 0

$ bun run test
editor: Test Files 42 passed (42); Tests 708 passed (708)
editor-web: Test Files 8 passed (8); Tests 33 passed | 1 skipped (34)
renderer: 57 Rust unit + 3 passed/1 ignored prototype + 102 Vitest passed
Tasks: 26 successful, 26 total
exit 0
```

`bun run lint` is not green on exact `origin/main` or this branch:

```text
scripts/seal.mjs: console.log is not permitted
scripts/randomize.mjs: console.log is not permitted
scripts/freeze.mjs: console.log is not permitted
exit 1
```

An isolated `git archive origin/main` produced exactly the same three findings and `baseline_exit=1`. This change touches no `scripts/` file and introduces no lint finding. The inherited baseline prevents claiming all named gates pass; it is not repaired here because that would be unrelated scope.

## 5. Independent review rejection and correction (2026-08-14)

Independent review rejected the prior task 4.5 evidence for three defects:

- `current-state.md` and `renderer.md` said the grid was beneath authored
  content, but `vello_encoder.rs:375-386` calls `encode_scene_into`, then
  `encode_grid_bottom`, then `encode_guides_top`; the encoder test at
  `vello_encoder.rs:1384-1440` pins authored, grid, guide order.
- The revised layout comment had one extra indentation level.
- The evidence asserted reference preservation without accounting for the
  actual before/after manifest drift, and described the grid red run without a
  raw excerpt.

Remediation changes only documentation/evidence and that comment indentation:
both architecture documents now say authored commands, then grid, then guides;
the layout comment is aligned; renderer behaviour is unchanged. The authentic
pre-change reference run is preserved at
`/private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/CRAFTY-RECONCILE-FINALIZE-07-red.txt`.
Its raw output includes:

```text
❯ src/ui/editor/grid-host-render-loop.test.ts (16 tests | 7 failed) 6ms
× ... projects the 5.1x-to-6x grid opacity curve at 5.1
  → expected 0.17874999999999994 to be close to +0, received difference is 0.17874999999999994, but expected 5e-13
❯ src/kernel/grid.test.ts (26 tests | 4 failed) 521ms
× fixed pixel grid > uses the authoritative 5.1x to 6x visibility ramp
  → expected 0.2749999999999999 to be +0 // Object.is equality
Failed Tests 15
```

The actual NUL-delimited SHA-256 manifests at
`.../CRAFTY-RECONCILE-IMPLEMENT-03-reference-before.sha256` and
`...-after.sha256` contain 227,187 and 227,253 entries respectively. Comparing
path and digest records found 84 affected `.turbo/` paths — 66 added, 0
removed, 18 changed — classified as 22 `.tar.zst` plus 62 JSON records (the 66
added are 22 `.tar.zst` + 44 JSON; all 18 changed are JSON). Excluding
`.turbo/`, the path-to-digest maps are exactly equal. This proves source-tree
preservation for that bounded manifest comparison; it does not claim the full
manifests are unchanged, because generated Turbo cache metadata drifted.

### Final correction pass (RECON-MECHFIX-06, 2026-08-14)

A second independent review rejected three narrow documentation inaccuracies;
this pass corrected exactly those, then re-ran the static evidence. No source,
test or behavior file was touched.

1. `qol-program.md` no longer says the grid is "permanently present"; the item
   now states the threshold-aware curve — opacity 0 through 5.1×, rising to
   0.60 at 6×, then holding there — while keeping the done status and the
   no-visibility-toggle claim.
2. The manifest classification now reads 84 affected `.turbo/` paths = 22
   `.tar.zst` + 62 JSON records, split as 66 added (22 `.tar.zst` + 44 JSON)
   and 18 changed (all JSON), verified by re-comparing the recorded manifests.
3. `renderer.md` witness references now point at the real symbols in
   `vello_encoder.rs` — `encode_frame` → `encode_scene_into` →
   `encode_grid_bottom` → `encode_guides_top` (verified at the source, e.g.
   `vello_encoder.rs:384-386`) and the COLOR-tag order test
   `grid_draws_over_the_authored_packet_and_guides_on_top`
   (`vello_encoder.rs:1384-1441`, helper `draw_order` at 998) — instead of the
   nonexistent `lib.rs encode_overlays`.

Task 4.5's record therefore stands on the corrected evidence; the changed-file
list remains the scoped policy/shell/tests/docs plus this OpenSpec change, and
the five excluded files (three `scripts/*.mjs`, `rust/src/vello_encoder.rs`,
`wasm/grid-overlay.ts`) remain absent from the diff.


## 6. Final reconciliation refresh (2026-08-14)

- `git fetch origin main --prune` left `origin/main` at
  `9b90ad7dc9d20e873e889557115eee855c721681`; branch HEAD and merge-base are
  the same commit and `git rev-list --left-right --count HEAD...origin/main`
  reported `0 0`. No merge or semantic conflict was required.
- The reference checkout commit remains
  `95dce16d132c7ff9e8e7b2a4233c711795b11270`; its Git tree digest is
  `fc4a2582f51cf2b6e0e07ee6d8ca9d27b918be4c`. The final non-OpenSpec
  implementation/test/architecture diff against `origin/main` hashes to
  `c7fb5185e60ec02d412719c3e2211202dc783d2ca34aa3c449f98ac3d9b8f8f8`
  (SHA-256 of `git diff origin/main | shasum -a 256`; 14 tracked files — the
  scoped policy, shell, focused tests, and Current documentation). This frame
  deliberately excludes the entire `openspec/changes/reconcile-local-editor-grid/`
  directory (7 untracked files, including this verification artifact), so the
  digest is not self-referential and stays stable when this file is edited; it
  is not the entire tracked diff. Corrected 2026-08-14 (RECON-DIGESTFIX-08): the
  previously recorded `7c3873e175faac603778fbc238b544b039a5625056161a04bd88f882dd165b59`
  predated the remediation edits and no longer matched the final state. The
  reconciliation branch retains all post-reference upstream commits through
  `9b90ad7`; its working diff is only the scoped policy, shell, focused tests,
  Current documentation, and this OpenSpec change.
- Removed as unrelated late edits: `scripts/freeze.mjs`,
  `scripts/randomize.mjs`, `scripts/seal.mjs`,
  `packages/scene-renderer/rust/src/vello_encoder.rs`, and
  `packages/scene-renderer/src/wasm/grid-overlay.ts`. They are absent from the
  final diff. The scripts were lint-only substitutions and the renderer edits
  were comment-only, while this change explicitly excludes Rust/protocol work.
- Fresh focused checks passed:

  ```text
  $ bun x vitest run grid.test.ts overlay.test.ts grid-host-render-loop.test.ts canvas-render-context-lifecycle.test.ts harness.test.ts
  Test Files 5 passed (5)
  Tests 268 passed (268)

  $ bun x vitest run benchmarks/editor-layout-rsc-boundary.test.ts
  Test Files 1 passed (1)
  Tests 11 passed (11)

  $ openspec validate reconcile-local-editor-grid --strict
  Change 'reconcile-local-editor-grid' is valid
  ```

- Fresh repository gates:

  ```text
  $ bun run typecheck
  Tasks: 13 successful, 13 total
  exit 0

  $ bun run test
  editor: Test Files 42 passed (42); Tests 708 passed (708)
  editor-web: Test Files 8 passed (8); Tests 33 passed | 1 skipped (34)
  renderer: 57 Rust passed; prototype 3 passed/1 ignored; Vitest 102 passed
  Tasks: 26 successful, 26 total
  exit 0

  $ bun run lint
  scripts/seal.mjs: console.log is not permitted
  scripts/randomize.mjs: console.log is not permitted
  scripts/freeze.mjs: console.log is not permitted
  exit 1

  $ git archive origin/main | tar ... && bun scripts/lint.mjs
  scripts/seal.mjs: console.log is not permitted
  scripts/randomize.mjs: console.log is not permitted
  scripts/freeze.mjs: console.log is not permitted
  baseline_lint_exit=1

  $ bun run format:check
  exit 0

  $ bun run build
  Tasks: 13 successful, 13 total
  exit 0
  ```

  The lint failure is inherited from freshly fetched `origin/main`; repairing
  it would reintroduce the explicitly excluded script edits. It is a known
  repository baseline failure, not a passing gate or a change-local failure.

## 7. Preserved capabilities and exclusions

- Preserved exact quarter-step grid capture/free interval and all later snap evidence arbitration.
- Preserved accepted-successful-packet-only eligibility and all matching/invalidation fields.
- Preserved constrained resize, cancellation, mutation-set, and emission guards.
- Preserved kernel-owned creation style and bottom creation controls.
- Preserved one stage-relative, offscreen-aware, accessible floating selection action surface.
- Added no schema/protocol/Rust/dependency/legacy-Scene change, no generic toolbar/container, no ADR, no push, and no deployment.
