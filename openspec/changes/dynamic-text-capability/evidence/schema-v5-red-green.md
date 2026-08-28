# Schema v5 red/green evidence

Date: 2026-08-16

## Focused acceptance source

The exact durable source is
[`packages/editor/src/kernel/schema-v5-acceptance.test.ts`](../../../../packages/editor/src/kernel/schema-v5-acceptance.test.ts).
It independently covers: schema-version/current-type expectation and valid-kind
JSON classes; value-before-kind precedence; absent-text migration; inverse;
canonical persistence; and malformed-input packet-boundary exclusion. The
companion `dynamic-text-schema.test.ts` supplies the per-class runtime command,
historical-validator typing, populated history, and static `TextCommand` matrix.

## Red — isolated pre-implementation baseline

Baseline commit: `238968a` (`Fix renderer WASM CI build`). The isolated detached
worktree was `/private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode/crafty-dynamic-text-v4`.
The exact source above was copied into that worktree only for the run.

```sh
git worktree add --detach "$TMP/crafty-dynamic-text-v4" 238968a
cp packages/editor/src/kernel/schema-v5-acceptance.test.ts "$TMP/crafty-dynamic-text-v4/packages/editor/src/kernel/"
cd "$TMP/crafty-dynamic-text-v4"
bun install --frozen-lockfile
bun --filter @crafty/scene-model build
bun --filter @crafty/scene-renderer build
bun --filter @crafty/editor test schema-v5-acceptance.test.ts
```

Raw focused-test failure output:

```text
@crafty/editor test:  ❯ src/kernel/schema-v5-acceptance.test.ts (7 tests | 7 failed) 10ms
@crafty/editor test:    × schema v5 acceptance > uses schema v5
@crafty/editor test:      → expected 4 to be 5 // Object.is equality
@crafty/editor test:    × schema v5 acceptance > rejects malformed JSON text on a valid text kind
@crafty/editor test:      → expected true to be false // Object.is equality
@crafty/editor test:    × schema v5 acceptance > gives malformed value precedence over invalid kind
@crafty/editor test:      → expected true to be false // Object.is equality
@crafty/editor test:    × schema v5 acceptance > migrates absent v4 text to canonical empty content
@crafty/editor test:      → expected [] to include 'v4-to-v5-require-text-content'
@crafty/editor test:    × schema v5 acceptance > preserves canonical empty content through the first replacement inverse
@crafty/editor test:      → expected undefined to be '' // Object.is equality
@crafty/editor test:    × schema v5 acceptance > persists canonical v5 bytes
@crafty/editor test:      → expected 4 to be 5 // Object.is equality
@crafty/editor test:    × schema v5 acceptance > excludes malformed input from the packet boundary
@crafty/editor test:      → expected 1 to be +0 // Object.is equality
@crafty/editor test:
@crafty/editor test:  FAIL  src/kernel/schema-v5-acceptance.test.ts > schema v5 acceptance > uses schema v5
@crafty/editor test: AssertionError: expected 4 to be 5 // Object.is equality
@crafty/editor test:  ❯ src/kernel/schema-v5-acceptance.test.ts:18:54
@crafty/editor test:
@crafty/editor test:  FAIL  src/kernel/schema-v5-acceptance.test.ts > schema v5 acceptance > rejects malformed JSON text on a valid text kind
@crafty/editor test: AssertionError: expected true to be false // Object.is equality
@crafty/editor test:  ❯ src/kernel/schema-v5-acceptance.test.ts:27:25
@crafty/editor test:
@crafty/editor test:  FAIL  src/kernel/schema-v5-acceptance.test.ts > schema v5 acceptance > gives malformed value precedence over invalid kind
@crafty/editor test: AssertionError: expected true to be false // Object.is equality
@crafty/editor test:  ❯ src/kernel/schema-v5-acceptance.test.ts:37:23
@crafty/editor test:
@crafty/editor test:  FAIL  src/kernel/schema-v5-acceptance.test.ts > schema v5 acceptance > migrates absent v4 text to canonical empty content
@crafty/editor test: AssertionError: expected [] to include 'v4-to-v5-require-text-content'
@crafty/editor test:  ❯ src/kernel/schema-v5-acceptance.test.ts:47:30
@crafty/editor test:
@crafty/editor test:  FAIL  src/kernel/schema-v5-acceptance.test.ts > schema v5 acceptance > preserves canonical empty content through the first replacement inverse
@crafty/editor test: AssertionError: expected undefined to be '' // Object.is equality
@crafty/editor test:  ❯ src/kernel/schema-v5-acceptance.test.ts:58:113
@crafty/editor test:
@crafty/editor test:  FAIL  src/kernel/schema-v5-acceptance.test.ts > schema v5 acceptance > persists canonical v5 bytes
@crafty/editor test: AssertionError: expected 4 to be 5 // Object.is equality
@crafty/editor test:  ❯ src/kernel/schema-v5-acceptance.test.ts:68:45
@crafty/editor test:
@crafty/editor test:  FAIL  src/kernel/schema-v5-acceptance.test.ts > schema v5 acceptance > excludes malformed input from the packet boundary
@crafty/editor test: AssertionError: expected 1 to be +0 // Object.is equality
@crafty/editor test:  ❯ src/kernel/schema-v5-acceptance.test.ts:81:26
@crafty/editor test:
@crafty/editor test:  Test Files  1 failed (1)
@crafty/editor test:       Tests  7 failed (7)
@crafty/editor test: Exited with code 1
```

Every failure is an intended assertion failure, not a harness/import failure.

## Green — current implementation

```sh
bun --filter @crafty/editor typecheck
bun --filter @crafty/editor test schema-v5-acceptance.test.ts dynamic-text-schema.test.ts
```

Raw focused-test output:

```text
@crafty/editor typecheck: Exited with code 0
@crafty/editor test:
 RUN  v3.2.7 /Volumes/dev/crafty/packages/editor
 ✓ src/kernel/schema-v5-acceptance.test.ts (7 tests) 5ms
 ✓ src/kernel/dynamic-text-schema.test.ts (13 tests) 25ms
 Test Files  2 passed (2)
      Tests  20 passed (20)
 Exited with code 0
```

## Task decision

- **1.3 checked:** this file retains an attributable baseline command, commit,
  source path, and intended red assertions, followed by the same focused source
  green on current code.
- **2.1 checked:** `dynamic-text-schema.test.ts` has the separate current-v5
  valid-text-kind JSON table and distinct combined/wrong-kind tables with exact
  code sequences.
- **2.2 checked:** its `TextCommand` static matrix names every JSON class, and
  runtime bypass cases assert unchanged bytes, revision, projection, and the
  populated `{ undo: 2, redo: 1 }` history state.
- **2.7 checked by the completed evidence set:** the exact applied sequence for
  the v4 fixture is `["v4-to-v5-require-text-content"]`. Actual canonical before/
  after bytes are retained under `canonical-bytes/`; SHA-256 values and the exact
  zero-based byte edit script are in `2.7-canonical-byte-deltas.txt`. The migration
  fixture changes schema byte `34` (`4`) to `35` (`5`) and inserts the canonical
  empty-text member; the named foundation and loss-list fixture deltas each change
  only their schema-version byte. The focused editor, scene-store, renderer,
  reconstructed-source real-browser, and repository-wide raw logs are adjacent
  to this file. `schema-v5-acceptance.test.ts` proves malformed input produces no
  packet command.
