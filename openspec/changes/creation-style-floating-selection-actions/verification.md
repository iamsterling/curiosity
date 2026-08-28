# Verification — Creation Style and Floating Selection Actions

Status: **Current** (evidence recorded 2026-08-13 after reviewer
CRAFTY-CREATION-COLOR-UX-REVIEW-053 rejected the prior handback because raw
mutation-red and focused green evidence existed only in the handback, not in the
change artifacts).

Environment: isolated worktree at commit `b9530fa` (`openspec/creation-style-selection-actions`
branch), bun `1.3.14`, vitest `v3.2.7` (via `bunx vitest run`), turbo `2.5.3` /
`^2.5.3`. This file records the exact commands, quoted outputs, and restoration
checksums. No production file was modified by this verification; every mutation
below was applied to the isolated worktree, run red, and restored byte-identically
from backups under the pre-approved temp directory before the next step.

## 1. Focused green suites (rerun after all mutations restored)

Focused editor suite — kernel creation style, harness creation paths, tool
visibility, and pure placement:

```text
$ cd packages/editor && bunx vitest run src/kernel/creation-style.test.ts src/ui/editor/harness.test.ts src/ui/editor/creation-style-tools.test.ts src/ui/editor/selection-action-placement.test.ts
 ✓ src/ui/editor/creation-style-tools.test.ts (7 tests) 2ms
 ✓ src/kernel/creation-style.test.ts (2 tests) 9ms
 ✓ src/ui/editor/selection-action-placement.test.ts (12 tests) 4ms
 ✓ src/ui/editor/harness.test.ts (113 tests) 160ms
 Test Files  4 passed (4)
      Tests  134 passed (134)
```

Focused mounted/web suite — portal lifecycle, pointer isolation, SSR safety, and
RSC layout boundary:

```text
$ cd apps/web/editor && bunx vitest run benchmarks/selection-actions-mounted.test.tsx benchmarks/editor-layout-rsc-boundary.test.ts
 ✓ benchmarks/editor-layout-rsc-boundary.test.ts (10 tests) 28ms
 ✓ benchmarks/selection-actions-mounted.test.tsx (5 tests) 48ms
 Test Files  2 passed (2)
      Tests  15 passed (15)
```

## 2. Mutation red evidence (one per named behavior class)

Procedure per mutation: back up the production file under
`$TMPDIR/opencode/crafty-creation-mutation-backups/`, apply the single-point
change, run the focused command, capture the failing output, restore the backup,
and verify the SHA-256 matches the pre-mutation baseline. The worktree was `git
status` clean after every restoration.

Baseline checksums (before any mutation, identical after restoration):

```text
5d942bbc057868cb73e1a1f80d2909bbf996b7c48e7b9a7b4dfeb7479e7f0ed1  packages/editor/src/ui/editor/harness.ts
8a7849f101e73c5e07b5e1f60a4c856c16ef09d36a3456ae015671fac0764b9c  packages/editor/src/ui/editor-primitives/selection-actions.tsx
e7b5eb844bcd0155b090f13136a6d676ef8c9bd9f5b5f90a2f48a9e410f8dd6e  packages/editor/src/ui/editor/selection-action-placement.ts
```

### 2.1 Creation-style application (`harness.ts`)

Behavior changed: the four region/line commit-site style reads
(`packages/editor/src/ui/editor/harness.ts:3282`, `:3313`, `:3359`, `:3407`,
each `const style = this.creationStyleCapture ?? this.kernel.getState().creationStyle;`)
and the pen session snapshot (`:2614`,
`style: { ...this.kernel.getState().creationStyle }`) were temporarily replaced
with the hard-coded pair `{ fill: "#000000", stroke: "#000000" }`.

Command:

```text
$ cd packages/editor && bunx vitest run src/ui/editor/harness.test.ts -t "authors the configured creation style"
 Test Files  1 failed (1)
      Tests  5 failed | 108 skipped (113)
```

Quoted failing assertion (all five tools; representative output):

```text
AssertionError: expected { …(15) } to match object { fill: '#123456', stroke: '#abcdef' }
  - Expected
  + Received
  -   "fill": "#123456",
  -   "stroke": "#abcdef",
  +   "fill": "#000000",
  +   "stroke": "#000000",
  ❯ src/ui/editor/harness.test.ts:973:21
```

Restoration: `cp` from backup; `shasum -a 256` returned
`5d942bbc…f0ed1` (matches baseline); `git status --porcelain` empty.

### 2.2 Portal-after-mount (`selection-actions.tsx`)

Behavior changed: `EditorSelectionActions`
(`packages/editor/src/ui/editor-primitives/selection-actions.tsx:34-41`) had its
mount gate (`useState`/`useEffect` + `if (!mounted || !positioning?.host) return null`)
and `createPortal(…, positioning.host)` removed so the surface rendered inline
before any host existed.

Command:

```text
$ cd apps/web/editor && bunx vitest run benchmarks/selection-actions-mounted.test.tsx
 Test Files  1 failed (1)
      Tests  3 failed | 2 passed (5)
```

Quoted failing assertions:

```text
FAIL  mounted selection actions > renders safely on the server and without a positioning host
AssertionError: expected TestElement {} to be null
  - Expected: null
  + Received: TestElement { …

FAIL  mounted selection actions > portals after the host appears and cleans up with either host or leaf
    220|     await flush();
    221|     expect(documentStub.querySelector('[role="toolbar"]')).toBeNull();
       |                                                            ^
     (toolbar was present before the positioning host existed)

FAIL  mounted selection actions > supports keyboard-equivalent clicks, isolates pointerdown, deletes immediately, and restores focus
AssertionError: expected 'button' to be 'canvas' // Object.is equality
```

Restoration: `cp` from backup; `shasum -a 256` returned
`8a7849f1…764b9c` (matches baseline); worktree clean.

### 2.3 Pointer isolation (`selection-actions.tsx`)

Behavior changed: the surface's stop-propagation handler
(`onPointerDown={stopSelectionActionPointerDown}`, `selection-actions.tsx:79`)
was removed.

Command:

```text
$ cd apps/web/editor && bunx vitest run benchmarks/selection-actions-mounted.test.tsx -t "isolates pointerdown"
 Test Files  1 failed (1)
      Tests  1 failed | 4 skipped (5)
```

Quoted failing output:

```text
FAIL  mounted selection actions > supports keyboard-equivalent clicks, isolates pointerdown, deletes immediately, and restores focus
TypeError: (intermediate value) is not a function
 ❯ benchmarks/selection-actions-mounted.test.tsx:246:13
   246|     (props?.onPointerDown as ((event: { stopPropagation: () => void }) => void))({ stopPropagation: stopped });
   247|     expect(stopped).toHaveBeenCalledOnce();
   248|     expect(stagePointerDown).not.toHaveBeenCalled();
```

Restoration: `cp` from backup; `shasum -a 256` returned
`8a7849f1…764b9c` (matches baseline); worktree clean.

### 2.4 Placement-cache no-op (`selection-action-placement.ts`)

Behavior changed: the idle-frame early return
(`packages/editor/src/ui/editor/selection-action-placement.ts:140`,
`if (this.previous && sameInputs(this.previous, inputs)) return false;`) was
removed from `SelectionActionPlacementCoordinator.update`, so unchanged inputs
were recomputed every frame.

Command:

```text
$ cd packages/editor && bunx vitest run src/ui/editor/selection-action-placement.test.ts
 Test Files  1 failed (1)
      Tests  2 failed | 10 passed (12)
```

Quoted failing assertions:

```text
FAIL  selection action placement > does no placement work on unchanged idle frames and invalidates each changed input once
AssertionError: expected true to be false // Object.is equality
  - Expected: false
  + Received: true
  ❯ src/ui/editor/selection-action-placement.test.ts:120:38
   120|     expect(coordinator.update(base)).toBe(false);

FAIL  selection action placement > invalidates element identity and hides deletion exactly once
AssertionError: expected true to be false // Object.is equality
  - Expected: false
  + Received: true
  ❯ src/ui/editor/selection-action-placement.test.ts:153:104
```

Restoration: `cp` from backup; `shasum -a 256` returned
`e7b5eb84…f8dd6e` (matches baseline); worktree clean.

## 3. Repository gates

### typecheck

```text
$ bun run typecheck
 Tasks:    13 successful, 13 total   (turbo cache replay of the identical tree)

$ bun run typecheck --force --filter @crafty/editor --filter @crafty/editor-web
 Tasks:    6 successful, 6 total
Cached:    0 cached, 6 total
  Time:    9.52s
```

### test

```text
$ bun run test --force
 Tasks:    26 successful, 26 total
Cached:    0 cached, 26 total
  Time:    50.389s
```

Fresh per-package totals: editor 568 passed (42 files), editor-web 32 passed |
1 skipped (8 files), scene-renderer 102 vitest passed (9 files) plus 57 Rust
crate tests passing in the same task (`test result: ok. 57 passed`), scene-model
7, scene-store 41, pen-import 13, crafty 21, cms 25, scene-api 5, scene-sync 5.
(A cached `bun run test` also exits 0: 26/26.)

### build (build-sensitive web composition)

The change touches `apps/web/editor/src/app/editor/[slug]/layout.tsx` and the
web app's test config, so `bun run build` for the web export was run:

```text
$ bun run build --force --filter @crafty/editor-web
 Tasks:    6 successful, 6 total
Cached:    0 cached, 6 total
  Time:    12.297s
```

`bun run bundle` was not rerun: the change touches no CLI/bundle, build-config,
or Rust path, and the turbo `build` gate above covers the web export the change
composes. The bundle command (`bun scripts/build-crafty-binary.mjs`) is the
reproducible reference for that path.

### format:check

```text
$ bun run format:check
 (exit 0, no findings)
```

### lint — baseline only

```text
$ bun run lint
scripts/seal.mjs: console.log is not permitted
scripts/randomize.mjs: console.log is not permitted
scripts/freeze.mjs: console.log is not permitted
error: script "lint" exited with code 1
```

These are exactly the three repository-baseline findings named in task 7.2.
Isolated-baseline proof: none of this change's commits touch `scripts/`
(`git log 95dce16..HEAD --name-only` matches no `scripts/` path), and lint
reports no finding in any file this change touched. Task 7.2's wording
("all pass except repository-baseline lint findings in `scripts/seal.mjs`,
`scripts/randomize.mjs`, and `scripts/freeze.mjs`") names these as the expected
exception, so the gate is complete with this recorded baseline.

### openspec strict validation

```text
$ openspec validate creation-style-floating-selection-actions --strict
Change 'creation-style-floating-selection-actions' is valid
(exit 0)
```

## 4. Acceptance scenario → test mapping (task 7.3)

Every acceptance scenario in `specs/editor-kernel/creation-style/spec.md` and
`specs/editor-ui/selection-action-placement/spec.md` is exercised by a named
test in the focused green suites above:

| Spec scenario | Test |
|---|---|
| Fill changed before drawing / stroke independent | kernel `creation-style.test.ts` "starts with the grounded defaults and emits only for independent real changes" |
| Fresh session defaults `#818cf8`/`#c4b5fd` | same kernel test (initial projection assertion) |
| Rectangle/ellipse/frame/line/pen use the preset | harness `harness.test.ts` "authors the configured creation style for %s" (5-tool table) |
| Style changes during a shape gesture | harness "snapshots %s style at gesture start" (4-tool table) |
| Style changes during a pen session | harness "snapshots pen style at session begin" |
| Preset change has no durable effect; undo does not restore a preset | kernel `creation-style.test.ts` "does not affect authored bytes, revision, history, selection, undo, or redo" |
| Tool visibility (five creation tools vs select/hand) | `creation-style-tools.test.ts` "returns %s => %s" |
| Viewport / surface-measurement changes invalidate placement | placement `selection-action-placement.test.ts` "does no placement work on unchanged idle frames and invalidates each changed input once" |
| 10 px above, below flip, horizontal clamp, no selection, fully offscreen, partial visibility | placement "handles %s" table + "hides invalid zoom and preserves partial positive-area visibility" |
| Four-corner transformed projection | placement "projects all four transformed corners into one screen AABB" / "preserves an authoritative multi-selection world AABB and viewport scale" |
| Keyboard-operable named actions; duplicate executes once; no canvas gesture | mounted `selection-actions-mounted.test.tsx` "supports keyboard-equivalent clicks, isolates pointerdown, deletes immediately, and restores focus" |
| Server render without browser globals; no portal before mount | mounted "renders safely on the server and without a positioning host" |
| Portal follows host lifecycle | mounted "portals after the host appears and cleans up with either host or leaf" |
| Pointer move does not render unrelated panels | mounted "external-store render isolation > keeps an unrelated selector consumer stable across pointer projection changes" |
| Layout composition constraints | `benchmarks/editor-layout-rsc-boundary.test.ts` (5 structural tests) |

## 5. Diff against base (task 7.4)

`git diff 95dce16..HEAD`: 25 files, +1531/−32 — capability implementation
(editor kernel/harness/stage/UI primitives), focused tests, `docs/architecture/`
updates (editor.md, react-boundary.md), and OpenSpec artifacts only. No
`grid*`/`snap*`, schema, renderer-protocol, Rust, or ADR path appears in the
diff, and no existing test was weakened (all previously present harness tests
still pass in the 134-test suite).
