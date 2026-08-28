# Editor package consolidation: kernel + chrome primitives in one package

Status: **Proposed**

## The Problem

The editor is split across two homes with inconsistent boundaries. The
*logic* lives in `packages/editor-kernel` (`@crafty/editor-kernel`): document,
commands, transactions, history, tools, clipboard, grid — deliberately pure,
React-free, and testable without a DOM. The *chrome* lives in
`apps/crafty-web`: the harness (`src/editor/harness.ts`, the CanvasEditor),
the context and canvas stage (`editor-context.tsx`, `canvas-stage.tsx`), the
keyboard surface, overlay/persistence/autosave glue, and the editor controls
(`src/components/editor/editor-panels.tsx`, `editor-toolbar.tsx`,
`panels/inspector.tsx`) built on the generic shadcn kit
(`src/components/ui/*`).

This split contradicts the repo's own stated direction. AGENTS.md: "one
chrome, not the only one — the renderer and kernel are framework-agnostic,
and the long-term surface is a live, bidirectional visualization of the code
in this repository" — the web UI is one chrome among future ones (an agent
surface, a code/IDE face). Today the chrome cannot exist outside the app:
every editor control, the canvas stage, and the state subscription layer are
embedded in `apps/crafty-web`, so a second chrome re-implements them. The
package that should be the centre of gravity (`editor-kernel`,
"**The centre of gravity.**" per AGENTS.md) does not carry the chrome that
defines what an editor *looks* like, only what it *is*.

There is also a naming and organization problem: `editor-kernel` is the only
package named after its internals, and its consumers cross the logic/chrome
line ad hoc — `src/components/editor/editor-toolbar.tsx` imports the kernel
directly for zoom state, while `scene-renderer` imports kernel constants
(`ZOOM_MIN`/`ZOOM_MAX`/`WORLD_LIMIT`, `scene-renderer/src/index.ts`). Nothing
enforces "kernel logic stays React-free" or "chrome consumes state through the
subscription layer, not the kernel's internals".

## The Decision

Rename `packages/editor-kernel` → `packages/editor` (`@crafty/editor`) and
make it the single home for both halves of the editor, organized so the line
between them is structural rather than conventional:

```
packages/editor/
  src/kernel/     ← today's editor-kernel: pure logic, zero React, zero DOM
  src/ui/         ← the chrome: primitives + editor glue, all React-side
    primitives/         ← generic shadcn kit (today's components/ui/* + cn)
    editor-primitives/  ← editor controls (tool buttons, zoom, panels' content)
    editor/             ← harness, context, canvas-stage, keyboard-bindings,
                          overlay/persistence/autosave glue
```

Two subpath exports, one hard boundary:

- `@crafty/editor/kernel` — **no React, no DOM**; the only import surface for
  `scene-renderer`, `scene-store`, `pen-import` and `apps/cli`.
- `@crafty/editor/ui` — React chrome: the generic primitives kit, the
  editor primitives, and the harness/context/canvas-stage.

The package ships **primitives, never assembled chrome**: one primitive per
file, `cva` variants, `Slot`/`asChild` composition, panels that consume their
own state (`useEditorSelector`) — the existing shadcn model, relocated.
Composition stays at the consumer: `apps/crafty-web`'s layouts and pages
remain the site that arranges the primitives, and any future chrome composes
the same primitives. The multi-export editor files (`editor-panels.tsx`,
`editor-toolbar.tsx`) split into one-primitive-per-file as part of the move.

Behavior is unchanged: this is a relocation. All editor tests move with their
code and pass where they were; the kernel keeps its React-free test surface
(`harness.test.ts` drives the whole editor with no React and no DOM).

## Out of scope

- **The harness-dissolves-into-kernel migration** (debt item 3 in
  `current-state.md`: "The harness is doing kernel work"). Moving the harness
  into the package is not the same as moving its semantics into the kernel;
  the latter stays a separate change. The `src/ui/editor/` boundary keeps the
  harness out of `kernel/` for now.
- New UI, new primitives, behavior changes, keyboard or canvas redesign.
- Renaming other packages, or moving the renderer/store boundaries.
- Frozen records: `specs/007`–`011`, the ADRs, and `docs/research/*` are
  historical and are not rewritten (only live docs are updated).
