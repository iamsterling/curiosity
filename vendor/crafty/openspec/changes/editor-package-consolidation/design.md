# Editor package consolidation — design

## Prior art

- **shadcn/ui composition model** — the repo's own stated UI convention
  (AGENTS.md: "one primitive per file under `components/ui/`, `data-slot`
  attributes, `cva` variants, `Slot`/`asChild` composition. Compose from
  primitives; no mega-components"). **Adopted** — the whole point of the move
  is that the editor package ships primitives exactly this way, so every
  consumer composes, none inherits.
- **The repo's own `react-boundary.md`** — kernel as external store,
  `useSyncExternalStore`, sliced subscriptions, "a pointer move must not
  re-render a panel", SSR-safe client tree. **Adopted unchanged** — the move
  relocates these files; their rules govern the relocated code exactly as they
  do today.
- **"One chrome, not the only one"** (AGENTS.md) — the intended long-term
  surface is a live bidirectional visualization; the web UI is one chrome.
  **Adopted as the motive** — the package must be the chrome kit, not the
  web app's private internals.

## Options considered

1. **One package, two subpaths — kernel pure, ui chrome (chosen).**
   `@crafty/editor/kernel` (React-free) and `@crafty/editor/ui` (React).
   Won because: the kernel keeps its zero-React property while the chrome
   gains a home next to the logic it drives; the dependency graph stays
   honest (`scene-renderer` etc. can only reach the kernel subpath); one
   package means the rename is the only package-count change. The retired
   lineage's lesson is about product sprawl (a second product's packages),
   not about refusing a principled chrome kit.
2. **A separate `@crafty/ui` package for the generic primitives.**
   Lost because: it re-creates the "many packages" pattern the repo just
   shed, and the generic kit is editor chrome — the file browser and the
   editor are faces of the same product, and a second chrome needs the whole
   kit, not a split. If the kit ever outgrows the editor (a real
   non-editor surface appears), splitting it out then is a mechanical move.
3. **Keep the chrome in the app; the package ships kernel only.**
   Lost because: it is the status quo with a new name — it does not make a
   second chrome possible, which is the stated product direction.
4. **Rename without splitting multi-export files.**
   Lost because: `editor-panels.tsx` (five panels) and `editor-toolbar.tsx`
   (ten primitives) violate the one-primitive-per-file rule the package is
   supposed to model. The split is mechanical (move exports to sibling
   files, re-export from the barrel the app imports).

## Decisions

- **Subpath exports** (`exports` map, NodeNext): `@crafty/editor/kernel` and
  `@crafty/editor/ui`. The kernel subpath must not import `react`,
  `react-dom`, or any DOM type. The `ui` subpath may import both.
- **Kernel structure is unchanged** — `src/kernel/` is today's
  `src/` moved verbatim (imports resolved). No logic changes in this change.
- **Harness glue goes to `src/ui/editor/`**, not `kernel/`. It is editor
  semantics that someday belong in the kernel (debt 3), but moving them
  across the authored-semantics line is a separate, larger change. Keeping
  them in `ui/` makes the future move visible.
- **Generic kit to `src/ui/primitives/`**, including `cn` (today's
  `src/lib/utils.ts`) and the kit's third-party deps move from
  `apps/crafty-web/package.json` to `packages/editor/package.json`
  (`cva`, `clsx`, `tailwind-merge`, `lucide-react`, the `@radix-ui/*` set,
  `cmdk`, `recharts`, `react-day-picker`, `embla-carousel-react`,
  `react-hook-form`, `vaul`). Next.js and the app's own deps stay.
- **Editor primitives to `src/ui/editor-primitives/`**, one file per
  exported primitive; a barrel re-export keeps the app's existing import
  sites stable where possible.
- **No behavior changes** — tests move with their code and must pass
  unchanged; the harness tests remain DOM-free.
- **Enforcement**: a lint check (extend `scripts/lint.mjs`) rejects `react`
  /`react-dom` imports inside `packages/editor/src/kernel/**`. Cheap,
  structural, and it makes the boundary a fact rather than a convention.

## Deferred

- Moving harness semantics (viewport ownership, resize arming, marquee
  geometry, paste-target resolution) into the kernel — debt item 3. The
  trigger is this change landing cleanly; it is a follow-up.
- Splitting `@crafty/ui` out of the editor package — trigger: a real
  non-editor consumer surface that needs the generic kit but not the editor.
