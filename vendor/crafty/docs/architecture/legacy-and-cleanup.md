# Legacy Inventory and Cleanup

Status: inventory verified against the working tree, 2026-08-08.

Two separate cleanups are described here: **AI-DLC harness removal** (a
development-methodology framework that is no longer used) and **the dormant
block-compiler lineage** (a real earlier product still in the repo).

Nothing in this document is a licence to delete files you have not understood.
Each entry states what the thing is before saying what to do with it.

---

## Part 1 — AI-DLC removal

Crafty no longer uses AI-DLC. The root `AGENTS.md` has been replaced. This is the
inventory of what remains.

**The important fact:** almost all AI-DLC state is **untracked**. `.gitignore`
already excludes `.aidlc/`, `.opencode/` and `aidlc/`. So the removal is mostly a
local-working-tree cleanup, not a repository change.

| Artifact | What it is | Tracked? | Classification |
|---|---|---|---|
| `AGENTS.md` | Was the AI-DLC orchestrator briefing | **yes** | **Removed now** — replaced by Crafty's engineering constitution |
| `.aidlc/` | Framework shell: skills, agents, hooks, tools, sensors, scopes, knowledge | no (gitignored) | **Remove now.** Safe to delete the directory. |
| `aidlc/` | Workflow records: `spaces/default/{memory,codekb,knowledge,intents}`, session cursors, clone id | no (gitignored) | **Intentionally retained for historical reference**, or delete. It holds the workflow record of past intents. Nothing reads it. Keeping it costs nothing; deleting it loses only history. |
| `.opencode/` | opencode harness config: `plugin/aidlc-opencode-adapter.ts`, 14 `agents/aidlc-*-agent.md`, `command/aidlc.md` | no (gitignored) | **Remove now** if you do not use opencode. All 14 agent files are AI-DLC personas. |
| `opencode.json` | opencode project config: pins `skills.paths: [".aidlc/skills"]`, `instructions: ["aidlc/spaces/default/memory/**/*.md"]`, and bash permissions for `.aidlc/tools/*` | **yes** | **Requires migration.** Every field references AI-DLC. Either delete the file, or strip it to a model pin plus permissions with no `.aidlc` references. Deleting is cleanest; keep it only if opencode is still in use. |
| `.gitignore` entries for `.aidlc/`, `.opencode/`, `aidlc/` | | **yes** | **Already unused** once the directories are gone. Harmless to keep; tidy to remove with the directories. |
| `scripts/lint.mjs` ignore list (`".aidlc"`, `".opencode"`, `"aidlc"`) | walker skip list | **yes** | **Already unused** once the directories are gone. Harmless. |
| `.claude/` | Empty directory (contained a `skills/typegpu` link) | no | **Already unused.** Not AI-DLC. |
| `.agents/skills/typegpu/` | Vendored TypeGPU agent skill from `software-mansion-labs/skills`, pinned in `skills-lock.json` | **yes** | **Intentionally retained.** Not AI-DLC — genuine reference material for the renderer work. Keep. |
| `skills/component-workbench/SKILL.md` | Skill for the retired block-compiler product | yes | **Removed** with the lineage (ADR 0016). |

### Concepts that no longer apply

Nothing in Crafty's documentation should reference: `/aidlc`, AI-DLC phases,
stages, intents, scopes, sensors, hooks, agents, memory layers, swarms, stage
runners, the state machine, audit shards, session resumption, or the
opencode-specific AI-DLC behaviour. All of it has been removed from `AGENTS.md`.

### Recommended commands

Review before running. These delete untracked local state.

```sh
rm -rf .aidlc .opencode .claude    # framework shell + harness config
rm -f opencode.json                # only if opencode is no longer used
# rm -rf aidlc                     # optional: deletes the historical workflow record
```

`AGENTS.md` has already been replaced in the repository.

---

## Part 2 — The block-compiler lineage: retired

This was **not** AI-DLC. It was a real, earlier Crafty product: "load component
blocks from a workspace, validate them against contracts, compile them to
HTML/CSS, preview them, and inspect components in a VS Code webview."

**Retired in one deliberate change, 2026-08-08** — the product decision this
document previously said was required. See
[ADR 0016](adrs/0016-block-compiler-lineage-retirement.md) for the reasoning,
the options weighed, and the validation.

### What was removed

| Package | Role |
|---|---|
| `contracts` | Ajv schemas for block manifests, `design.core.json`, HTML overlays |
| `core` | Block directory loading and validation |
| `compiler-html` | Design core → HTML/CSS |
| `api` | Product engine: compile, generate, preview, inspect, discover, config |
| `cli` | CLI over `@crafty/api` |
| `facade` | Generic request/response envelope shared by API/CLI/MCP surfaces |
| `authoring` | Authoring command service |
| `generation` | Generation orchestration with ports |
| `resolver` | Thin re-export of `@crafty/animation` |
| `animation` | Semantic motion intents, keyframe tracks, deterministic frame resolution |
| `target-registry` | Target capability profiles and policies |
| `webgl-target` | Reference WebGL preview target |
| `html-fallback` | HTML fallback compiler |
| `ink` | Deterministic terminal frame emission |
| `baseline` | Baseline/regression gate records |
| `quality-gates` | Quality matrix and gate decisions |
| `source-repository` | Atomic source document store |
| `schemas` | Zod schemas for the extension bridge |
| `extension-bridge` | VS Code ↔ webview bridge |

Plus `apps/vscode-extension` (the extension, its MCP server and webview),
`apps/web` (empty), the `component-workbench` skill, and the
`test-workspaces/{block-contracts,source-discovery}` fixtures. `apps/cli` no
longer routes the old CLI commands (`list/doctor/validate/compile/preview/
inspect/discover/config/facade`); the launcher keeps `desktop`, `serve`,
`import`, `save` and `load`.

### What the canvas kept from it

The reasons the lineage was worth keeping at all were already absorbed into the
canvas product before the retirement:

- **Atomic file writes** — `source-repository`'s temp-file/fsync/rename pattern
  is implemented in `packages/scene-store` (see [`persistence.md`](persistence.md)).
- **Intent vs resolved frame, determinism** — the canvas motion design in
  [`animation.md`](animation.md) makes the same separation; it is written as
  target design, not tied to the old package.
- **Thin-facade principle** — restated for the agent surface in
  [`agent-editing.md`](agent-editing.md).

### Historical records

The four ADRs in `docs/adr/0001`–`0004` and the frozen specs in `specs/` stay
for intent archaeology. They describe the retired product; they are **not** a
description of current architecture and **not** a place to add to.

---

## Part 3 — Stale artifacts in the canvas lineage

| Artifact | Finding | Action |
|---|---|---|
| `crates/crafty-renderer-wasm/src/` | **Empty directory.** The Rust crate is at `packages/scene-renderer/`. | **Remove now** (untracked; contains no files). |
| `packages/mcp/`, `apps/crafty-server/` | Deleted in the working tree — MCP folded away, scene server merged into `apps/cli`. | **Already removed.** Commit the deletion. |
| `docs/editor/` | Superseded by `docs/architecture/`. Contained several claims the code contradicts (see [`current-state.md`](current-state.md)). | **Replaced now** by `docs/architecture/`. |
| `.specify/constitution.md`, `.specify/feature.json` | Spec-Kit constitution and feature pointer for the block-compiler product. The constitution claimed `specs/` as source of truth for feature scope — a claim [`AGENTS.md`](../../AGENTS.md) already contradicted. `feature.json` pointed at `004-api-owned-product-engine` (in-progress), which predates specs 006–011. | **Removed.** Spec Kit is retired; OpenSpec (`openspec/`) replaces it. The durable principles were folded into [`AGENTS.md`](../../AGENTS.md) and `openspec/config.yaml`; the workbench-specific ones died with the product they described. |
| `specs/001`–`005` | Block-compiler product specs | Historical. **Frozen.** Keep for intent archaeology; do not add to. |
| `specs/006`–`011` | Canvas lineage specs (browser surface, kernel integration, TypeGPU spike, canvas platform, single-binary merge, pen import) | **Frozen.** Useful context, **not** current architecture. Still referenced by `docs/research/` and ADR 0007, which is why the directory stays. New planning goes in `openspec/`. |
| `todo.md` | Untracked scratch list (SQLite, Drizzle, Effect.ts, pages, components, smart stacks, vector editing, prototyping) | Personal notes. Not architecture. The durable version is [`roadmap.md`](roadmap.md). |
| `README.md` | Accurate for running the binary and the dev server. | Keep. |

## Documentation that contradicted the code

Fixed by this pass, recorded so the pattern is recognisable:

| Stale claim | Where it was | Reality |
|---|---|---|
| "The canvas never re-renders from React" | old `AGENTS.md` | `useLayoutEffect` on `projection` drives every frame |
| "All conversion belongs in `editor-kernel/coordinates.ts`" | `docs/editor/coordinate-spaces.md` | Duplicated in `scene-renderer`; the browser uses that copy |
| "`EditorDocument` v1" | `docs/editor/document-model.md` | Schema version is 2 |
| "Full detail: `docs/engineering-conventions.md`" | old `AGENTS.md` | **That file does not exist** |
| "Panels are independent components subscribing to exactly the projection slice they render" | old `AGENTS.md` | One subscriber; all panels are JSX inside `App` |

The lesson: a document that describes an intention as a fact is worse than no
document. When you find one, fix it in the change that taught you.
