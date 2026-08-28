# Crafty

Engineering constitution. Read this first, then the architecture document for the
subsystem you are changing. Keep it short enough to stay in context.

Deeper documentation: [`docs/architecture/`](docs/architecture/README.md).
Ground truth for what actually exists:
[`docs/architecture/current-state.md`](docs/architecture/current-state.md).

## What Crafty Is

Crafty is a professional interface-design environment: an infinite canvas with
files, pages, frames, reusable components, design systems and a custom
Rust/WASM/WebGPU renderer. It is designed to be operated by agents as well as by
humans.

The organising idea, which the repository supports rather than merely asserts:

> **Crafty is a structured visual-authoring system with a renderer — not a canvas
> with features attached.**

The authored document is durable and renderer-independent. The renderer displays
a resolved projection of it. The editor kernel owns all editing semantics. React
composes chrome — **one chrome, not the only one**: the renderer and kernel are
framework-agnostic, and the long-term surface is a live, bidirectional
visualization of the code in this repository (the web UI grows into an IDE where
the same document is edited visually or as code; see
[`roadmap.md`](docs/architecture/roadmap.md)). This layering is enforced by code,
not convention — see [Architectural Invariants](#architectural-invariants).

Crafty ships a **Next.js server**: Server Components for browsing surfaces, route
handlers for the API, and a client island for the editor. `bun run bundle`
produces a self-contained `dist/` (Next standalone build + CLI + a bundled Bun)
behind a `./dist/crafty` launcher, with a `serve` face for other devices on the
tailnet. See [`README.md`](README.md) and
[`docs/operator-workflows.md`](docs/operator-workflows.md).

## Product Direction

Crafty is in the category of Figma, Sketch, Penpot and Framer, and borrows the
component-state ideas of Storybook. It is a clone of none of them. The intended
combination: professional infinite-canvas design; files and pages; frames and
structured hierarchy; reusable components with variants and states; cross-file
design systems with tokens, variables and themes; Framer-influenced interaction
and motion; agent-native creation and editing; production-code awareness.

Today the canvas is immature relative to that ambition. **The response is to
strengthen the substrate, not to add toolbar features on top of an immature one.**
[`docs/architecture/roadmap.md`](docs/architecture/roadmap.md) sequences this and
lists the decisions that are deliberately still open.

## How to Work in This Repository

Planning artifacts live in [`openspec/`](openspec/), and OpenSpec is the only
sanctioned process here. It stores proposals, capability specs, design notes and
task lists; it does not stage, gate or sequence your work. AI-DLC and Spec Kit
were both removed
([`docs/architecture/legacy-and-cleanup.md`](docs/architecture/legacy-and-cleanup.md)).
**Do not introduce a third.**

Use it when a change is large enough to be worth agreeing on before it is built —
a new capability, a renderer-protocol change, anything touching the document
schema. A bug fix does not need a proposal. The same blast-radius rule below
governs both.

For any non-trivial change:

1. Read this file and the architecture doc for the subsystem.
2. Read the actual implementation and its tests. **Source is stronger evidence
   than documentation.**
3. Identify the invariant or user behaviour you are changing.
4. Research unfamiliar technical ground before designing — see
   [Research and Prior Art](#research-and-prior-art).
5. Make the smallest coherent architectural change. Fix root causes, not
   symptoms.
6. Add or update tests.
7. Run mechanical verification.
8. Update architecture docs **only when reality changed** — and when you find a
   doc the code contradicts, fix it in the same change.
9. Record consequential decisions in an ADR.

Reasoning depth scales with blast radius. A bug fix does not need a plan
document. Changing the document schema does.

### Delegating to Sub-agents

For delegated work, always set the model explicitly; never rely on the session
model being inherited accidentally.

Model names must retain their provider distinction:

- `generalist`: `openai/gpt-5.6-sol` for high-quality
  end-to-end work across analysis and implementation.
- `analyst`: `openai/gpt-5.6-luna` for routine analysis, summarization and
  cheap-tier reasoning, falling back to `opencode-go/deepseek-v4-flash` when
  OpenAI quota is tight or high-volume fan-out needs the decoupled lane.
- `worker`: `opencode-go/deepseek-v4-flash` for narrow, well-specified work.
- `implementer`: `openai/gpt-5.6-terra` through OpenAI OAuth for normal
  implementation and verification.
- `strategist`: `openai/gpt-5.6-sol` through OpenAI OAuth for consequential
  reasoning, architecture and high-blast-radius decisions.
- `researcher`: `openai/gpt-5.6-terra` through OpenAI OAuth for deep research,
  competitive landscape analysis, and reverse-engineering studies.
- `reviewer`: `openai/gpt-5.6-sol` through OpenAI OAuth for rare independent,
  adversarial review of plans and large diffs.

Never write an unqualified GPT model name; provider-qualified IDs are
mandatory, and the three GPT-5.6 tiers are distinct models and routes, not
flavors of one another. The provider prefixes are real: `openai/` hosts the GPT
line across the GPT-5.6 family — `gpt-5.6-sol` (pricey, quality ceiling),
`gpt-5.6-terra` (balanced workhorse), `gpt-5.6-luna` (cheap reasoning; the
analyst's model) — while
`opencode-go/` hosts only cheap models, `deepseek-v4-flash` being the one in
use. `codex` is not an OpenCode agent here; if you need that route, pass
the raw model explicitly as `openai/gpt-5.6-sol` or `openai/gpt-5.6-terra`.

`orchestrator` is the default primary agent in `opencode.json`, on
`openai/gpt-5.6-sol` — the quality ceiling, because its planning, delegation
prompts and synthesis are the leverage point of every session; errors there
amplify into every subagent. Its contract is delegate-only: it may read and
launch subagents, but it must not edit files, run shell, or do the work itself.
The built-in `build` and `plan` agents are disabled in this repository.

Use the configured subagents by name when an agent identity is more useful than
passing a raw model ID. Escalate cheaply and honestly: `worker` → `analyst` →
`implementer` → `strategist` or `reviewer` as needed. Research and landscape work
routes to `researcher`, with consequential analysis handed to `strategist` or
`reviewer`. Consequential reasoning does not start on a cheap tier.

Dynamic workflows are opt-in: ask before launching parallel workflow work
unless the session explicitly enables ultracode/orchestration.

### Goal-Driven Loops

- Multi-turn or unattended goals run as loop goals: write the goal with
  acceptance criteria and the evidence that proves completion, then start it
  with `/loop-goal` (`/loop-now` starts immediately).
- Loops delegate to the configured subagents; the delegate-only orchestrator
  contract applies inside loops. Never do the work inline.
- Compact between phases (`/loop-compact` or `/compact`) to keep long goals
  from bloating context; resume interrupted goals with `loop-goal-resume` plus
  a status summary.
- Completion requires evidence, not claims: quoted command output, passing
  checks, cited sources. A goal is not done because the loop stopped; it is
  done when the acceptance criteria are met and evidence is attached.
- Respect the no-progress ceiling: if a goal stalls, stop, summarize what was
  tried, and report back — do not spin.

## Architectural Invariants

The load-bearing ones. Full list with enforcement sites and tests:
[`docs/architecture/invariants.md`](docs/architecture/invariants.md).

- **The authored document is canonical.** Not React state, not renderer state,
  not the GPU.
- **Every node has one stable id, one parent, and a back-linked child list.**
  Cycles are rejected. Array position is never identity.
- **All document mutation goes through validated, invertible commands.** Every
  mutating command validates the resulting document before returning it and
  produces an explicit inverse.
- **Pointer-down never mutates durable state.** A drag is one transaction and one
  history entry. A cancelled interaction leaves nothing behind.
- **Each tool has a closed effect vocabulary.** A zoom cannot create a rectangle,
  because that effect is not in its vocabulary.
- **Rendering never mutates authored state.** Renderer failure preserves the
  document and the last valid packet.
- **The renderer receives no product semantics** — no components, tokens,
  variants, history or triggers. Those resolve before the packet is built.
- **GPU structures are cache keys, not identity.** Buffers, atlas slots and bind
  groups are addressed by keys derived from document ids; they are not the ids.
- **Ephemeral editor state is never serialized.** Selection, hover, active tool
  and the live camera are not authored. The per-page *rest* camera, grid, guides
  and snap settings are — that distinction is deliberate.
- **Coordinate transforms and hit testing have one authoritative implementation
  each.** *(Currently violated in both cases — see `current-state.md`.)*
- **Agents obey the same document invariants as humans**, through the same
  commands.
- **Unknown schema versions are rejected, never coerced.**

## Repository Map

Bun workspaces + Turbo. One product lineage lives here — the canvas.

| Path | Role |
|---|---|
| `packages/editor` | The editor package: `kernel/` subpath (authored document, commands, transactions, history, tools, clipboard, grid — zero React) and `ui/` subpath (chrome: primitives kit, editor primitives, harness, canvas stage). **The centre of gravity.** |
| `packages/scene-model` | Legacy `Scene` v1 + spatial index + shared viewport constants. **Transitional** — being retired. |
| `packages/scene-renderer` | Draw protocol + WASM bridge + failure policy (`.` subpath) and the Rust encoder + WebGPU host (`./wasm` subpath, crate in `rust/`) |
| `packages/pen-import` | pen.dev `.pen` import |
| `packages/scene-store` | Node-side file store: slugs, atomic writes, revisions, listing, snapshots. Shared by Server Components, route handlers and the CLI |
| `apps/crafty-web` | Next.js server app: Server Components, route handlers, client editor island |
| `apps/cli` | Launcher: desktop / serve / import / save / load faces |

The block-compiler lineage (19 packages, a VS Code extension, its test
workspaces) was retired in one deliberate change — see
[ADR 0016](docs/architecture/adrs/0016-block-compiler-lineage-retirement.md).
The frozen specs (`specs/`) and the historical ADRs (`docs/adr/`) survive for
intent archaeology only.

`crates/crafty-renderer-wasm/` is an empty leftover; the Rust crate is in
`packages/scene-renderer/rust/`.

## Editor Architecture

The real path from input to pixels, traced in full in
[`current-state.md`](docs/architecture/current-state.md):

```
DOM pointer event
  → CanvasEditor.handlePointer*        (harness: pointer bookkeeping, pinch)
  → transitionInteraction(...)         (PURE reducer → effects)
  → CanvasEditor.applyEffect           (effects → kernel calls)
  → EditorKernel dispatch/preview/commit
  → applyDocumentCommand               (validate + inverse)
  → kernel emit → renderRevision += 1
  → rAF loop reads getSnapshot() DIRECTLY  (React is NOT on this path)
  → renderer.render(...) → packet → Rust/WASM encoder + WebGPU → canvas surface
```

Read: [`editor.md`](docs/architecture/editor.md),
[`input-and-tools.md`](docs/architecture/input-and-tools.md),
[`document-model.md`](docs/architecture/document-model.md),
[`coordinate-systems.md`](docs/architecture/coordinate-systems.md),
[`selection-and-hit-testing.md`](docs/architecture/selection-and-hit-testing.md).

**Coordinate conversion belongs in the kernel.** Event handlers must never
reimplement pan or zoom arithmetic. Screen-px tolerances (handles, hit slop,
outline thickness) convert to world units at the point of use by dividing by
zoom — never bake zoom into document geometry.

## Renderer Boundary

Rust owns *what to draw*; TypeScript owns *the GPU*. One coarse versioned packet
per frame — **never a per-shape JS/WASM call.**

The packet (`RenderFrame`, protocol v2) carries geometry, transforms, fill,
opacity, explicit `(zIndex, order)` ordering, an optional changed-node batch, and
an optional overlay packet. It carries no product semantics.

Overlays (selection, grid, rulers, guides) are renderer state composed *after* the
authored packet, with bounded budgets and explicit drop order — never authored
geometry. There is no fallback backend; WebGPU unavailability is a diagnostic, not
a WebGL fallback.

Read: [`renderer.md`](docs/architecture/renderer.md),
[`wasm-boundary.md`](docs/architecture/wasm-boundary.md),
[`scene-resolution.md`](docs/architecture/scene-resolution.md).

## React Boundary

Server Components for everything around the editor; a client island for the
editor itself. The kernel is an **external store**; React subscribes via
`useSyncExternalStore` and renders chrome.

```
SERVER   app/page.tsx (file browser) · app/files/[slug]/layout.tsx (shell: composes
         editor primitives, reads @crafty/scene-store)
         app/api/files/[slug]/…/route.ts        — all read @crafty/scene-store
   │ serializable props
CLIENT   app/files/[slug]/page.tsx — composes CanvasStageWithRuntime + KeyboardBindings
         packages/editor/src/ui/* — primitives, editor primitives, canvas stage,
         keyboard bindings, panels (consumed via @crafty/editor/ui)
```

- Kernel lives in a ref or a context carrying only `{ subscribe, getSnapshot }` —
  **never a state object**, which would re-render every consumer.
- `getSnapshot` must be referentially stable between changes, or
  `useSyncExternalStore` loops. Both `CanvasEditor` and `EditorKernel` memoise.
- **A pointer move must not re-render a panel.** `canvas-stage.tsx` owns a rAF
  loop keyed on `EditorProjection.renderRevision`; a drag renders no components.
- Panels subscribe to slices via `useEditorSelector`, not the whole projection.
- Server components are the default; `"use client"` is opt-in for hooks, event
  handlers or browser APIs — never on a page or layout. New non-canvas surfaces
  (libraries, history, assets) should be Server Components reading the store.
- **Keep the client tree SSR-safe** — the island is server-rendered, so `window`,
  `matchMedia`, `localStorage` and `devicePixelRatio` are read in effects, not
  during render.
- Mutations go through the kernel, not the server. The API is a save boundary,
  which is why route handlers are used rather than Server Actions.
- Cross-boundary props are serializable; editor state crossing a server/client
  boundary is plain JSON-shaped data.
- Data is fetched where it is used, not drilled from a page-level fetch.
- UI primitives follow the shadcn/ui composition model: one primitive per file
  under `components/ui/`, `data-slot` attributes, `cva` variants, `Slot`/`asChild`
  composition. Compose from primitives; no mega-components.
- **The shell is composed in the layout, not wrapped in a component.** The
  Server Component layout defines the shell by composing primitives directly —
  there is no generic `<EditorShell>` (or `<AppShell>`, `<Toolbar>`, `<Panel>`)
  client component that owns the tree. Client-ness degrades only where state
  demands it: context providers and leaf panels. If the layout can place it,
  the layout places it.
- **Decompose into primitives; never wrap a group of controls in a container
  component.** A toolbar is not a `<Toolbar />` that internally arranges tools,
  history, zoom and gestures. It is `EditorToolButton` + `EditorSelectionActions`
  + `EditorHistoryActions` + `EditorZoomControl` + separators, composed in place
  at the use site — the layout decides arrangement, grouping and placement, and
  can drop or relocate any piece. The same applies to panels: content primitives
  are individually composable and carry no container styling, separators or
  ordering of their own.
- **Panels consume their own state; nothing is drilled through a shell.** A
  panel that needs chrome state (status, preferences, inspector open) reads it
  from context (`useEditorChrome`) or the kernel store (`useEditorSelector`) —
  it does not receive callbacks from a parent shell component. The layout
  places the panel; the panel wires itself.

Read: [`react-boundary.md`](docs/architecture/react-boundary.md).

## Document Mutation Rules

- Mutate only through `DocumentCommand` and the kernel. Never edit a document
  object in place, and never edit serialized state behind a running kernel.
- Every command: pure, validated, invertible, honest about `changed`, loud on
  precondition failure. **If you cannot write the inverse, the command is at the
  wrong granularity.**
- Continuous gestures use `beginTransaction` → `preview` → `commit`/`rollback`,
  never repeated `dispatch`.
- **Undo and redo restore the document, never the camera.** The live viewport
  is ephemeral editor state: undo/redo on the current page keeps the camera
  where it is, and the rest-camera write on page switch is bookkeeping, not a
  history entry. A fresh camera centres the world origin until the user moves
  it.
- Authored data stores **references and intent**; resolution produces **values**,
  and values are disposable. Never write a resolved value (a component expansion,
  a token colour, a layout result, an animation frame) back into the document.
- Diagnostics over guesses: an unresolvable reference is reported, never
  silently substituted.

## Components and Design Systems

Records exist (`ComponentDefinition`, `ComponentInstance`, `LibraryReference`,
`variables`) and are carried correctly through the clipboard. **No resolution
step consumes them.** Do not write code that assumes components work.

Target semantics: an instance is a *reference plus a sparse delta*, never a copy.
Resolved nodes carry provenance. Variants are chosen by the instance; states and
themes are chosen by the resolution context. A component state is **a named point
in a declared property space**, never a duplicated frame. Libraries are versioned,
integrity-checked snapshots; missing and stale are first-class states.

Read: [`components-and-design-systems.md`](docs/architecture/components-and-design-systems.md).

## Research and Prior Art

Studying mature systems is encouraged — Penpot's source, Figma's and Framer's
published engineering material, Sketch's documented file format, Storybook's
story model, the WebGPU spec, the Rust text stack.

**Extract the problem, the constraints and the architectural lesson. Implement
independently.**

Do not: copy substantial source; translate a module line by line and call it
original; rename an external implementation; import GPL/AGPL/MPL/custom-licensed
implementation code without a licensing review recorded in an ADR; or assume a
design is right because a successful product uses it.

When external research materially shapes a subsystem, record it in
[`research-ledger.md`](docs/architecture/research-ledger.md) — source, subsystem,
lesson, Crafty conclusion, and whether it was adopted, adapted, rejected or
deferred. Long-form reports live in [`docs/research/`](docs/research/).

Research, landscape and reverse-engineering work routes through the `researcher`
subagent and the generic kit — the `deep-research`, `competitive-analysis` and
`reverse-engineering` skills, and the `research`, `landscape` and `teardown`
commands. Findings are recorded in the research ledger with verdicts.

## Testing and Verification

Before considering a change complete:

```sh
bun run typecheck  # strict: noUncheckedIndexedAccess, exactOptionalPropertyTypes
bun run test       # vitest per package + cargo tests
bun run lint       # bans console.log and unresolved implementation TODOs
bun run format:check
bun run build      # when touching build config, Rust, or the web export
```

Implementation follows a blended methodology: intent and binary acceptance
criteria first (OpenSpec artifacts where the process calls for it), a failing
acceptance/behaviour test before code, unit tests red-green-verified (tests are
never edited to push green), verification gates with raw command output pasted
as evidence, and adversarial review against the acceptance criteria.

- **Test the kernel, not the component.** If an assertion needs a mounted React
  tree, the logic is in the wrong place. `harness.test.ts` drives the whole
  editor with no React and no DOM — preserve that.
- A bug fix ships with a test that fails without it. Interaction bugs get a test
  on the reducer, not on a DOM handler.
- Assert on diagnostic **codes**, never on prose.
- Fixtures are committed, generated code — not stored blobs.
- Benchmarks record their environment and report a distribution, not one number.
- **Never invent a numeric performance budget you have not measured.**

Read: [`testing.md`](docs/architecture/testing.md),
[`performance.md`](docs/architecture/performance.md).

## Engineering Conventions

- TypeScript strict throughout, ES modules, NodeNext resolution.
- Package boundaries are real. Dependencies flow one way: `scene-model` is the
  leaf; `editor`, `scene-renderer`, `pen-import` and `scene-store` build on it;
  apps consume. The editor package's `ui` subpath may depend on
  `scene-renderer`; its `kernel` subpath never does — do not introduce a cycle,
  and do not import editor semantics into the renderer. The renderer's Rust
  crate is a build unit inside `scene-renderer` (`rust/`), not a package; the
  JS/WASM line is the packet protocol, not a package boundary.
- Errors carry stable machine-readable codes (`DOCUMENT_NODE_MISSING:<id>`,
  `WEBGPU_DEVICE_LOST`, `PASTE_OVERRIDE_DROPPED`), not formatted prose.
- Serialization is canonical: sorted keys, no timestamps, no random ids, no
  iteration-order dependence.
- No `console.log` (enforced by `bun run lint`). Diagnostics are returned, not
  printed.
- Comments explain *why* a boundary or invariant exists, not what the line does.
  The existing block comments in `interaction.ts`, `grid.ts` and `clipboard.ts`
  are the model.
- Filesystem writes that matter are atomic: temp file, fsync, rename.

## Documentation Map

- [`docs/architecture/`](docs/architecture/README.md) — subsystem docs, invariants,
  research ledger, ADRs. **Start at its README.**
- [`docs/architecture/current-state.md`](docs/architecture/current-state.md) —
  what exists today, by path, with the honest gap list.
- [`docs/architecture/adrs/`](docs/architecture/adrs/README.md) — decision records
  and the template.
- [`docs/research/`](docs/research/) — long-form primary-source research reports.
  Dated investigations, not doctrine.
- [`docs/adr/`](docs/adr/) — historical ADRs for the retired block-compiler lineage.
- [`docs/operator-workflows.md`](docs/operator-workflows.md) — running the binary.
- [`openspec/`](openspec/) — live planning artifacts: proposals, capability
  specs, designs, task lists. **The only sanctioned process.**
- [`specs/`](specs/) — retired Spec Kit archive, frozen. Intent archaeology,
  **not** a description of current architecture and **not** a place to add to.

Every architecture document labels its claims **Current / Transitional / Target /
Proposed / Deferred / Unknown**. Do not describe a planned subsystem as though it
exists.

## Architectural Changes / ADRs

Write an ADR when the change moves the authored/resolved line, changes the
document schema non-additively, changes the command/transaction/history model,
changes the renderer protocol or JS/WASM ownership, picks a text or layout engine,
defines component-instance or cross-file-library semantics, picks a persistence
format, introduces collaboration, adds a dependency whose license or size affects
the core, or reverses an existing ADR.

Do not write one for ordinary implementation choices. Ceremony trains people to
ignore ADRs. Template and full criteria:
[`docs/architecture/adrs/README.md`](docs/architecture/adrs/README.md).

## Prohibited Patterns

Each of these is either a mistake already made here or one the architecture is
built to prevent.

- **Canonical editor state in React state.** The kernel is the document.
- **Driving the render loop from React re-renders.** *(Currently the case; being
  fixed.)*
- **A giant canvas component owning unrelated subsystems.** This was `App.tsx`,
  474 lines owning tools, keyboard, gestures, renderer lifecycle, HTTP and every
  panel. It is now split; do not recombine it.
- **Direct document mutation from a UI panel.** Panels dispatch commands.
- **Tool behaviour inferred inside pointer handlers.** If you write
  `if (event.altKey && tool === …)` in a DOM handler, the arbitration guarantee is
  gone. Extend the reducer and the tool's effect vocabulary instead.
- **A one-off event guard to fix an interaction bug.** It is a symptom; the
  interaction model is the cause.
- **Mixing viewport state into document geometry.** Never bake zoom into `bounds`.
- **Product semantics in GPU or Rust code.** Components, tokens and triggers stop
  above the packet.
- **Chatty JS/WASM calls.** Batch, do not call per node.
- **Components implemented as detached copies**, or **states implemented as
  duplicated frames.** Architecturally dead — they never update and cannot be
  enumerated.
- **Duplicated coordinate or hit-test math.** Two of each exist today; do not add
  a third.
- **Unbounded snapshot history.** History is already unbounded; do not make it
  worse.
- **Recomputing whole scenes when the command already names what changed.**
- **Extending the legacy `Scene`** to carry a new document concept. It is being
  retired.
- **Agent-only mutation paths** that bypass validation.
- **Speculative abstractions with no current use.**
- **Copying external source instead of extracting the concept.**
- **Inventing a performance budget without a fixture, an environment and a
  measured distribution.**
