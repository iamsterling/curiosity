---
# Editor package

## Purpose

Defines the `@crafty/editor` package surface: one package that is the single
home for both halves of the editor — the pure logic (`kernel` subpath) and
the React chrome (`ui` subpath: generic primitives kit, editor primitives,
harness glue). The contract this spec holds: the kernel subpath stays free of
React and DOM, the ui subpath ships composable primitives (never assembled
chrome), and relocation changes no observable editor behavior.

## ADDED Requirements

### Requirement: The editor package exposes kernel and ui subpaths

The package `@crafty/editor` SHALL replace `@crafty/editor-kernel` and SHALL
expose two subpaths via its `exports` map: `@crafty/editor/kernel` (the pure
logic: document, commands, transactions, history, tools, clipboard, grid,
coordinates, interaction reducer, path geometry) and `@crafty/editor/ui` (the
React chrome: primitives kit, editor primitives, harness, context, canvas
stage, keyboard bindings, overlay/persistence/autosave glue). The root of the
package SHALL NOT be a third implicit surface.

#### Scenario: Kernel consumers import the kernel subpath

- **WHEN** `packages/scene-renderer`, `packages/scene-store`,
  `packages/pen-import` or `apps/cli` import editor logic
- **THEN** their imports resolve to `@crafty/editor/kernel`
- **AND** no code outside `packages/editor` imports React from
  `@crafty/editor/ui` for logic purposes

#### Scenario: The kernel subpath stays React-free

- **WHEN** the lint check scans `packages/editor/src/kernel/**`
- **THEN** no `react` or `react-dom` import appears in any kernel file
- **AND** the lint check fails loudly on any future violation

### Requirement: The ui subpath ships composable primitives

The ui subpath SHALL expose the generic primitives kit (today's
`components/ui/*` plus `cn`), editor primitives (tool buttons, zoom control,
history/selection actions, panel content pieces, canvas context menu,
inspector content), and the editor glue (harness, context, canvas stage,
keyboard bindings, overlay/persistence/autosave). Every primitive SHALL
follow the shadcn composition model: one exported primitive per file, `cva`
variants, `Slot`/`asChild` composition, `data-slot` attributes. The package
SHALL NOT export assembled chrome containers (no `EditorShell`, `Toolbar`,
`Panel`, `ToolbarGroup` that owns arrangement); arrangement SHALL remain the
consumer's job.

#### Scenario: A consumer composes primitives into its own chrome

- **WHEN** `apps/crafty-web` (or a future second chrome) builds a toolbar or
  panel from the ui subpath
- **THEN** it arranges the primitives itself at the use site
- **AND** dropping or relocating any primitive leaves the others unaffected

#### Scenario: Editor controls consume their own state

- **WHEN** an editor primitive needs editor state (selection, zoom, pages,
  layers)
- **THEN** it reads it from the kernel store subscription layer
  (`useEditorSelector` or equivalent), never from props drilled through a
  parent shell

### Requirement: Relocation changes no editor behavior

Moving the harness, context, canvas stage, keyboard bindings, overlays,
persistence, autosave, editor primitives and generic kit from
`apps/crafty-web` into `packages/editor` SHALL NOT change observable editor
behavior. All existing tests SHALL move with their code and pass unchanged;
the editor tests that drive the whole editor with no React and no DOM
(`harness.test.ts` and peers) SHALL remain DOM-free.

#### Scenario: The editor still behaves identically after the move

- **WHEN** the full test suite runs after the relocation
- **THEN** every test that passed before the move passes after it
- **AND** the kernel test surface still runs without React or a DOM

#### Scenario: The launcher and non-web consumers still build

- **WHEN** `apps/cli` builds
- **THEN** it resolves its editor imports through `@crafty/editor/kernel`
- **AND** the bundle script (`scripts/build-crafty-binary.mjs`) ships the
  editor package under its new name
