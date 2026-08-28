# Crafty UI file format (`.ui`): document-native persistence for alpha

Status: **Proposed**

## The Problem

Persistence round-trips through the legacy `Scene` (`packages/scene-store`,
`scene-adapter.ts`), and `Scene` cannot represent most of `EditorDocument`
(`docs/architecture/persistence.md`, gap 1 in `current-state.md`): page
canvases (grid, rulers, guides, snap, rest camera), components, instances,
libraries, variables, `locked`, node metadata and file identity are silently
dropped on every save/reload. A `path` node fails the save loudly rather than
corrupting (`SCENE_ADAPTER_UNSUPPORTED_KIND:path`). The kernel can already
round-trip the real document (`canonicalEditorDocumentString`, `kernel.serialize()`),
but nothing in the product uses it. Persistence is the most consequential gap
in the repository.

## The Decision

Crafty becomes file-based for alpha with its own format, **`.ui`**: a
**directory package** — one `.ui` folder per document — carrying the full
authored document. The legacy `Scene` round-trip retires from the persistence
path.

```
project.ui/
  manifest.ui      ← package identity, format gate, revision (the commit point)
  document.ui      ← the authored document (canonical EditorDocument)
```

- `manifest.ui` declares the package: `{ "format": "crafty.ui-package",
  "formatVersion": 1, "revision": N, "entries": { "document": "document.ui" } }`.
  The `formatVersion` is the gate — unknown versions are rejected
  (`UI_FORMAT_UNSUPPORTED:<version>`), never coerced (I10 discipline).
- `document.ui` is the kernel's canonical `EditorDocument` serialization
  (schema-versioned, migration chain applied on load, validated on read).
- The package is **modular by design**: the manifest's entry vocabulary is
  the format's extension mechanism. Today the package holds `manifest.ui` +
  `document.ui`. The vocabulary declares the roles the shape is built for —
  `tokens` (design tokens), `components` (reusable symbols), `code`
  (production code, the Framer model) — and each lands as an additive entry
  when the feature it serves exists. Node-level features (Figma-like flex/stack
  layout, Framer-style animation) land as additive optional node fields via
  document `schemaVersion` bumps with migrations — never as new package
  semantics.
- Every `.ui` file is a self-describing canonical JSON document with the
  `crafty.ui-*` marker family; files diff cleanly and are safe input for the
  future code-IDE surface. The folder shape maps to a directory naturally
  when repo sync arrives.

One package per slug: `~/.crafty/untitled.ui/`,
`~/.crafty/files/<slug>.ui/` — replacing `scene.json`. The store keeps its
crash-safe discipline (atomic per-entry writes; the manifest written last as
the commit point), the monotonic revision counter and optimistic concurrency.

**Deliberately out of scope for alpha:** reading the repository for true sync
(that comes with deployment maturity); embedded assets (references, never
blobs — an existing invariant); a binary container (`.fig`'s Kiwi is opaque,
unspec'd and not diffable); `tokens.ui` / `components/` / `code/` entries
(their roles are declared in the format, the directories ship when the
features do — the kernel's `variables` and `components` document fields are
their current homes).

## What Changes

- **`packages/editor-kernel`** — exports the document (de)serialization API:
  canonical serialize (existing `canonicalEditorDocumentString`) + a
  parse/validate/migrate entry. `CanvasEditor.serializeDocument()` /
  `replaceDocumentJson()` delegate to it.
- **`packages/scene-store`** — owns the package: `manifest.ui` +
  `document.ui` read/write (`readDocument`/`writeDocument`), the format gate
  and entry vocabulary, manifest-last commit ordering, legacy `scene.json`
  one-shot read, listing/snapshots over the new packages. The `Scene` API
  retires.
- **Routes + shell** — `PUT/GET /api/files/<slug>/document`; Server Components
  read documents; `persistence.ts` saves documents with a debounced autosave.
- **`packages/pen-import`** — emits `EditorDocument` instead of `Scene`
  (import → document → `.ui` package).
- **CLI** — `import` and a `save`/`load` face for `.ui` packages.
- **Tests** — the loss list becomes a round-trip test matrix (grid, rulers,
  guides, snap, rest camera, components, instances, libraries, variables,
  locked, metadata, paths): save → reload → identical document.
- **Docs + ADR** — ADR 0011 records the persistence format decision (the
  directory package, the single-file alternative rejected); `persistence.md`
  and `current-state.md` are rewritten to match.

## Files

- `packages/editor-kernel/src/document-serialization.ts` — serialize/parse API
  (thin over `canonicalEditorDocumentString`, `migrateDocument`, validation).
- `packages/scene-store/src/ui-format.ts` — package types: manifest, entry
  markers, parse/serialize, format gate, entry vocabulary.
- `packages/scene-store/src/index.ts` — `readDocument`/`writeDocument`,
  package-directory naming, manifest-last commit, legacy `scene.json` read,
  listing/snapshot updates.
- `apps/crafty-web/src/app/api/files/[slug]/document/route.ts` — GET/PUT.
- `apps/crafty-web/src/editor/persistence.ts` — document save + debounced
  autosave.
- `packages/pen-import/src/index.ts` — document output.
- `apps/cli/src/` — save/load/import faces.
- `docs/architecture/persistence.md`, `current-state.md`, `research-ledger.md`
  — reality updates.
- `docs/architecture/adrs/0011-crafty-ui-format.md` — the decision record.

## Risks

- **The migration path is untested in the product** — `migrateDocument` runs
  today only in kernel tests; the load path must exercise the full chain and
  record which migrations ran.
- **Directory semantics are new for the store** — entry writes must stay
  atomic and the manifest must be the commit point; entry paths must never
  escape the package directory (`UI_ENTRY_PATH_INVALID`).
- **Vocabulary discipline** — `tokens`/`components`/`code` roles are declared
  in the format but not created; creating empty structure would be
  speculative abstraction.
- **Legacy scene.json continuity** — the one-shot read uses the existing
  `sceneToEditorDocument` adapter, so a document containing a path still
  fails loudly on migration (the adapter's stop-gap) until the user converts.
  That is a deliberate, diagnosed limitation of the legacy path, not of `.ui`.
