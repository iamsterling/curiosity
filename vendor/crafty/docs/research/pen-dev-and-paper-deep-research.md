# Deep Research: pen.dev (Pencil) and Paper (paper.design)

Status: research, August 2026 · Feeds: `specs/002-figma-design-parity-roadmap`

This document covers what Pencil and Paper actually are (products, formats, MCP surfaces,
roadmaps), where they fall short of Figma/Sketch quality-of-life (multi-page documents, live
imports that never break components), and what crafty should borrow, adopt, or do better.

---

## 1. Pencil (pen.dev ≡ pencil.dev)

### 1.1 What it is

AI-native design tool that lives in the developer environment: desktop app, IDE extension,
headless CLI (`@pen.dev/cli`), and a local MCP server. Documents are `.pen` files kept in the
Git repo next to the code. Auth is email-based; AI features require an authenticated Claude Code
installation. OpenCode is an explicitly supported MCP client.

### 1.2 The `.pen` format (schema v2.14)

JSON object tree, Git-friendly, one document = one infinite canvas. Full TypeScript schema is
published at `docs.pencil.dev/for-developers/the-pen-format`.

- **Entities**: `id` (unique per document, MUST NOT contain `/`), `name`, `x/y` (top-level),
  `width/height`, `rotation`, `opacity`, `enabled`, `theme`, `reusable`, `layoutPosition`,
  `metadata` (arbitrary typed payload).
- **Node types**: `frame` (flex layout, clip, slots), `group`, `rectangle`, `ellipse` (rings,
  arcs), `polygon`, `path` (SVG `geometry` + `viewBox`), `text` (`textGrowth`:
  auto / fixed-width / fixed-width-height), `note`, `prompt` (AI memo), `context` (context
  memo), `icon` (lucide, feather, Material Symbols, phosphor), `script` (JS file that generates
  children, `inputs`), `ref` (instance).
- **Layout**: flexbox-style, 2-pass. `layout: none|vertical|horizontal`, `gap`, `padding`,
  `justifyContent`, `alignItems`, `layoutPosition: absolute` escape. Sizing via
  `fit_content(...)` / `fill_container(...)` behaviors.
- **Graphics**: multiple `fill`s (color, linear/radial/angular gradient, image URL, mesh
  gradient, WebGL shader with uniform directives), per-side `strokeWidth`, effects (blur,
  background_blur, inner/outer shadow), 16 blend modes.
- **Components**: any node with `reusable: true` becomes a component; `ref` creates an
  instance. Overrides at the instance root, `descendants: { "id-path": {...} }` for nested
  property overrides, full node replacement (presence of `type`), or children replacement.
  Nested paths (`ok-button/label`). `slot: ["component-id", ...]` marks container slots.
- **Variables & themes**: document-level variables (boolean/color/number/string), theme axes
  (`themes: { mode: ["light","dark"] }`), subtree `theme` overrides, `$name` binding. Closest
  thing to Figma variables/modes in this ecosystem.
- **Imports**: `imports: { alias: "relative-uri.pen" }`. Design libraries use the `.lib.pen`
  suffix (one-way flag); changes to a library file propagate to consumers.

### 1.3 Known limitations (the QoL gaps)

- **No auto-save** ("Save frequently — no auto-save yet" is in the docs).
- **No pages**: one canvas per `.pen` file. No Figma-style page tabs, no per-page viewport,
  no per-page export.
- **Imports are brittle**:
  - Refs resolve by raw string `id` within a file, and by `alias` + relative URI across files.
    Rename or move a library file → every import dangles.
  - Component identity is the file-local `id`. Renaming a component doesn't break refs, but
    deleting it does, with no remap or recovery flow.
  - `descendants` overrides are keyed by ID paths (`"ok-button/label"`); any restructure of the
    component silently orphans overrides.
  - No versioning: consumers always track the library's HEAD. No pinning, no "updates
    available" diff, no update gating, no library registry.
  - The format itself is unstable: docs state *"we reserve the right to introduce breaking
    changes in the .pen format."*
- **Code import is one-shot AI translation**, not a live link: "import component" recreates it
  visually; nothing stays bound to the source file.

### 1.4 Ecosystem around the format

- **OpenPencil** (`github.com/open-pencil/open-pencil`, MIT, ~7.6k stars) — open-source editor
  that reads AND writes `.fig` and `.pen`. Skia (CanvasKit) rendering, Yoga WASM layout (flex +
  grid fork), Vue 3 UI, Kiwi binary container (Zstd + ZIP), Tauri 2 desktop, Yjs + Trystero P2P
  collaboration, headless CLI (tree/find/XPath query/export/lint/analyze/`eval` with the Figma
  Plugin API), MCP server (stdio + HTTP), and a **headless Vue SDK** for building custom
  editors. Multi-page documents with per-page viewports are supported at the `.fig` level.
  `@open-pencil/dom-css` converts HTML/CSS/Tailwind into editable design documents.
- **pencil_viewer** (Pregum, open source) — browser-only SVG renderer for `.pen`: zod parse →
  variable substitution → flex layout pass → SVG render. Proof that the format is fully
  reimplementable.
- **pencil_analyzer** (NaruseNia) — Rust CLI for structure/ref/variable analysis.
- **pencil-skill** (de-novo) — schema reference + CLI scripts for agentic `.pen` editing.
- **coqui-toolkit-pencil-dev** (PHP) — CRUD, components, tokens, CSS sync, code export.

---

## 2. Paper (paper.design)

### 2.1 What it is

Code-native design tool founded 2024 by Stephen Haney (Modulz/Radix), founding designer Vlad
Moroz. $4.2M seed (Accel) → **$34M Series A (Accel + ICONIQ, 2026)**. Web app + Paper Desktop;
desktop app auto-starts an MCP server at `http://127.0.0.1:29979/mcp`. Production users: Ramp,
Vercel, Perplexity, Lovable, PostHog, Tailwind, Dub, Replicate, Zed, Attio.

**Thesis**: the design–code gap is a file-format problem. The canvas is real HTML/CSS — actual
flexbox, native browser fonts, real CSS properties. "Copy as React" yields 1:1 JSX because the
design already IS the code. There is no translation step.

### 2.2 Current capabilities

- Real HTML/CSS canvas; design tokens based on real CSS (`calc`, `color-mix`, blend modes) —
  June 2026; pen tool + vector editing — June 2026; nested folders — June 2026.
- **Paper Shaders**: GPU shaders that export as production code; `@paper-design/shaders` is now
  fully open source (Apache-2.0, ~500k weekly downloads, `shaders.paper.design`).
- Paper Snapshot browser extension (copy sections of a live site into Paper).
- Live data via MCP (Notion, Google Sheets, APIs); AI image gen; background removal; palette
  extraction; P3 wide gamut + OkLCh/OkLab color science; real-time multiplayer; asset CDN links.
- Free tier: 100 MCP calls/week; Pro $16/mo annual.

### 2.3 MCP server (~24 bidirectional tools)

Read: `get_basic_info` (file name, **page name**, node count, artboards), `get_selection`,
`get_node_info`, `get_children`, `get_tree_summary`, `get_screenshot`, `get_jsx` (Tailwind or
inline styles), `get_computed_styles`, `get_fill_image`, `get_font_family_info`, `get_guide`,
`export` (PNG/JPG/SVG/MP4, per-node scale).
Write: `create_artboard`, `write_html` (parse HTML, insert/replace nodes), `set_text_content`,
`rename_nodes`, `duplicate_nodes` (returns new-ID map), `move_nodes` (preserves IDs,
before/after/parentId+index), `update_styles`, `delete_nodes`, `finish_working_on_nodes`.
Clients: Cursor, Claude Code/Desktop, Codex, Copilot, Antigravity, OpenCode.

### 2.4 Roadmap (relevance to crafty)

- **Use your code components** (in progress) — compose flows with the same code users see.
- **Components with slots** (coming soon) — props/slots aligned with React concepts.
- Native Tailwind integration (in progress, with the Tailwind team); CSS Grid (planned).
- Script and prompt engine (planned); Remix (planned); shadcn + Base UI kits (coming soon).

### 2.5 Gaps vs Figma/Sketch

- Closed, proprietary, cloud-hosted SaaS (files live in their cloud; no self-host, no open
  format). Only ideas + the Apache-2.0 shader library are reusable.
- **Components don't exist yet** (props/slots "coming soon") — no Figma-style instance/override
  semantics today.
- Not truly multi-page: artboards + a file-level page name; no page tabs/own canvases.
- No plugin ecosystem, thin prototyping, no enterprise org tooling.
- Figma import is agent-mediated one-shot conversion with documented fidelity losses (SVG fills
  become images, spacers mis-translate, inset borders lost).

---

## 3. The QoL gap: what Figma/Sketch have that neither tool provides

### 3.1 Multiple pages

| Tool | Model |
|---|---|
| Figma | File = tree of pages; each page has its own canvas + viewport; components live in pages; per-page export |
| Sketch | Pages + artboards |
| Pencil | One canvas per `.pen` file; pages must be faked with separate files + imports |
| Paper | Artboards + a file-level page name only |
| OpenPencil | Multi-page documents at the `.fig` level (per-page viewport) |

### 3.2 Imports that don't break components

Figma/Sketch set the bar:

- **Stable component identity**: Figma `component.key` survives copies, renames, and file
  moves; instances keep their overrides.
- **Library publish/update lifecycle**: library changes are published; consumers get
  "Updates available", a diff preview, and per-instance or bulk update. Libraries can be
  swapped or unlinked with a visible "missing" state — never silent breakage.
- **Resilient overrides**: overrides re-attach across restructure where possible, degrade
  visibly otherwise.
- **Styles/variables as first-class remotes**: style and variable bindings survive.

Pencil's imports fail on every axis: identity is a file-local `id`, links are relative URIs with
no versioning, no publish/update flow, no remap, no visible degradation, and the format itself
is unstable. Paper doesn't have a component system at all yet.

---

## 4. Recommendations for crafty

Crafty's position is strong: real TSX/Storybook components are already the source of truth,
the canvas is DOM-backed (Paper's thesis, independently), and the two-layer model
(`DesignCoreDocument` portable core + `HtmlOverlayDocument` target overrides) is deeper than
Pencil's single tree or Paper's raw HTML. Both tools are *less* committed than crafty to
"components stay real code."

### 4.1 Adopt (low cost, high leverage)

1. **`.pen` as interchange format** — the schema is documented, has real tooling (viewers,
   analyzers, skills), and AI agents are trained on it. Map `DesignCoreNode` → `frame/stack/text`
   and emit/ingest `.pen` v2.14 for canvas handoff. Treat it as interchange, NOT storage
   (breaking-change clause).
2. **Pencil's ref/descendants/slot shape** — it is the right instance/override model; crafty's
   `HtmlOverlayNodeOverride` already resembles `descendants`. Formalize the mapping.
3. **Pencil's theme-axis variables** — `$var` + theme axes + subtree theme overrides maps 1:1 to
   CSS variables; `compiler-html` can emit them directly.
4. **Paper's MCP tool vocabulary** — `get_jsx`, `get_computed_styles`, `write_html`,
   `duplicate_nodes` (with ID map), `move_nodes` (ID-preserving) are a checklist for
   `packages/mcp`. `write_html` (parse HTML into canvas) is exactly a "code import that doesn't
   break."
5. **`@paper-design/shaders`** (Apache-2.0) for shader fills — free of Paper's closed stack.
6. **OpenPencil's `.fig` reader** (MIT) as the Figma migration bridge — read `.fig` once,
   convert to crafty documents. Also `@open-pencil/dom-css` (HTML/CSS/Tailwind → document) is
   reusable, framework-agnostic.

### 4.2 Build (the QoL restorations — crafty's differentiators)

**A. Multiple pages as a composition layer.** Blocks stay the units of source; add a
`PageManifest` / `PageDocument` to `packages/contracts`: a page is a named composition of block
instances (screens/flows) with its own canvas bounds and viewport. MCP gets `page_*` tools
(create/rename/reorder/duplicate, per-page export); the webview gets a page tab strip. This is
Sketch-like (pages of screens) while preserving component-native sourcing — and it is strictly
more useful than Pencil's file-per-canvas.

**B. Library-grade import contract.** Design imports so they never silently break:
- **Stable component keys**: every block gets a `componentKey` (ULID) independent of path and
  rename. Instances reference `(componentKey, versionRange)`, not `(id, relativePath)`.
- **Dependency manifest + lockfile**: workspace imports in a `crafty` manifest with aliases,
  plus a lockfile recording the resolved hash per library — `package.json`/lockfile semantics.
  Deterministic rendering: what you see is what was pinned.
- **Publish/update flow**: library bumps a version; consumers see "Update available (n)" with a
  diff preview and per-instance/bulk update. Renames/moves inside the library produce a remap
  table (old key → new key); deleted components degrade to a visible "missing instance"
  placeholder, never silent breakage.
- **Override resilience**: match `HtmlOverlayDocument` overrides by stable semantic keys
  (`DesignCoreNode.role`, path + key) instead of raw node ids, with auto-remap on restructure.

**C. Live code imports.** The killer feature neither Pencil nor Paper has: importing a real
component keeps it bound to its source file. Source changes re-compile to the canvas (crafty's
core thesis); the canvas can also push edits back through explicit source-mutation tools. No
one-shot AI translation, no drift.

### 4.3 Phasing

| Phase | Scope |
|---|---|
| A | Stable `componentKey`; imports manifest + lockfile; pages model in contracts/schemas; `page_*` + import/update MCP tools; `compiler-html` emits CSS variables from tokens |
| B | Publish/update diff UI in webview; remap/restore flow; role-based override matching |
| C | `.pen` import/export (Pencil interop); `.fig` import (OpenPencil Kiwi); `write_html`-style code import bound to source |

### 4.4 Risks

- `.pen` is a moving target (breaking changes reserved) — interchange only, never canonical
  storage.
- Paper is closed/cloud — borrow ideas and the Apache-2.0 shaders only.
- Pencil CLI/MCP requires their auth + Claude Code — crafty must stay local/BYOK.
- OpenPencil's UI is Vue; do not adopt the UI — reuse its format parsers/engine pieces
  (`@open-pencil/pen`, Kiwi, `dom-css`) which are framework-agnostic.

---

## 4.5 Addendum: ZSeven-W/openpencil (a different "OpenPencil")

There are TWO unrelated MIT projects named OpenPencil. The one asked about here is
`github.com/ZSeven-W/openpencil` (4.6k stars, pure Rust) — **not** `open-pencil/open-pencil`
(Vue, .fig-focused, covered in §1.4). ZSeven-W's own README calls out the collision.

What it is: "world's first open-source AI-native vector design tool" — prompt→canvas with
concurrent agent teams, built-in MCP server, multi-model AI (incl. Chinese providers), a `.op`
JSON file format (conceptually a sibling of `.pen`; it even imports/exports UIKits from `.pen`
files), multi-page documents with tab navigation, components with instances/overrides, design
variables/themes, Figma `.fig` import, Git integration with folder-mode three-way merge, code
export to React+Tailwind/HTML+Vue/Svelte/Flutter/SwiftUI/Compose/RN, 55 MB native desktop binary
(GPU Skia, no browser engine), and a **read-only** wasm viewer SDK. The TypeScript/Electron
codebase was retired at v0.7.5 in a full Rust rewrite.

Does it nullify crafty's plan? No — on three counts:

1. **It does not touch crafty's core thesis.** It is a design→code *export* tool. Codegen is
   one-way; nothing stays bound to real TSX/Storybook source components, so "source changes
   update the canvas" and "canvas edits round-trip through explicit source mutation" (the
   features neither Pencil nor Paper has) remain absent. Live code components are exactly what
   crafty exists for.
2. **The import QoL gap is still open.** It has multi-page, components, and git merge, but no
   Figma-grade library lifecycle: no stable cross-file component keys, no version pinning or
   lockfile, no publish/update-notification/diff flow, no remap on rename. Its `.op` format is
   young and (unlike `.pen`'s published schema) undocumented. Same brittleness risk, plus a
   single-org bus factor and one full rewrite already behind it.
3. **Architecture mismatch.** crafty is a TS/Node monorepo with a VS Code extension and React
   webview. ZSeven-W is a Rust engine with a native Rust UI framework (jian); its web SDK is
   read-only, so it cannot serve as an *editable* embedded canvas without deep surgery.

What it DOES change: the build-vs-buy calculus for a full vector canvas. Between
ZSeven-W/openpencil (Rust, read-only viewer) and open-pencil/open-pencil (Vue, **headless
editable SDK**, Kiwi/.fig parsing), there is now an MIT path to skip building Phase 5–6 canvas
features (vector editing, boolean ops) from scratch — at the cost of a non-React dependency or
a Rust engine. Neither replaces crafty's differentiator: live code-component binding and
imports that never silently break. Treat `.op` like `.pen`: interchange, not storage.

## 5. Sources

- Pencil: docs.pencil.dev / docs.pen.dev (format schema, design libraries, components, slots,
  variables, import/export, CLI, AI/MCP), pen.dev homepage
- OpenPencil: github.com/open-pencil/open-pencil, openpencil.dev (docs, roadmap, layers/pages)
- Paper: paper.design (home, roadmap, MCP docs, pricing), paper.design/compare/pencil,
  github.com/paper-design/shaders, uristocrat.com and designtools.fyi product writeups,
  everydayux.net interview with Stephen Haney
- Ecosystem: github.com/Pregum/pencil_viewer, github.com/NaruseNia/pencil_analyzer,
  github.com/de-novo/pencil-skill, npm @paper-design/shaders
