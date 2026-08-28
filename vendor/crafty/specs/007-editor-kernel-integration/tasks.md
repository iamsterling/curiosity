# Tasks: Editor Kernel Integration

## T001 - OpenSpec change record

- **Files:** `specs/007-editor-kernel-integration/*`
- **Output:** approved integration boundary, migration plan, acceptance criteria
- **Verification:** spec, plan, tasks, research, and contracts exist

## T002 - Compatibility adapter

- **Files:** `packages/editor-kernel/src/scene-adapter.ts`, package manifest, tests
- **Output:** deterministic Scene <-> EditorDocument conversion preserving IDs, hierarchy, paint, geometry, stories, and revisions
- **Verification:** valid scene round trip and canonical base bytes remain stable

## T003 - Kernel command coverage

- **Files:** `packages/editor-kernel/src/commands.ts`, `kernel.ts`, tests
- **Output:** reorder, subtree deletion, duplicate, property edits, and transaction lifecycle
- **Verification:** command inversion, invariant preservation, one history entry per gesture

## T004 - Browser kernel ownership

- **Files:** `apps/crafty-web/src/App.tsx`
- **Output:** browser load, mutation, save, reload, undo, redo, and panel edits route through one kernel instance
- **Verification:** no direct scene mutation remains in editor actions

## T005 - Browser interaction contracts

- **Files:** browser tests and kernel integration tests
- **Output:** create, move, resize, cancellation, delete, history, and state projection coverage
- **Verification:** automated tests plus browser smoke flow

## T006 - Verification and handoff

- **Files:** `docs/editor/final-gap-analysis.md`, `docs/editor/implementation-roadmap.md`
- **Output:** updated migration status and remaining gaps
- **Verification:** full repository checks and OpenSpec artifact review
