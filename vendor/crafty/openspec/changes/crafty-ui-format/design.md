# Crafty UI file format — design

Status: **Proposed**. Grounded in the format research (Sketch, Figma, pen.dev —
`docs/architecture/research-ledger.md` row, 2026-08-08) and
`docs/architecture/persistence.md`'s target properties. The container shape
(directory package) is a product decision: the `.ui` folder is the file, and
it is built to house design tokens, reusable components and production code
alongside the UI document itself.

## The container: a `.ui` directory package

A `.ui` file is a **directory** whose name ends in `.ui`. Every unit inside is
a canonical UTF-8 JSON text file carrying a `crafty.ui-*` marker.

```
project.ui/
  manifest.ui
  document.ui
```

**`manifest.ui`** — the package identity and commit point:

```json
{
  "format": "crafty.ui-package",
  "formatVersion": 1,
  "revision": 7,
  "entries": {
    "document": "document.ui"
  }
}
```

- `format` — the package marker; a file without it is not a package
  (`UI_MANIFEST_MISSING` at the package root, `UI_FORMAT_MISSING` elsewhere).
- `formatVersion` — the **single version gate** for the whole package: the
  entry contract, the entry vocabulary and the transaction rules are all
  defined by it. Anything else is rejected with
  `UI_FORMAT_UNSUPPORTED:<version>` before any entry parsing. Bumps only when
  package-level semantics change.
- `revision` — the monotonic optimistic-concurrency token (the 
  `scene.json` revision model, moved into the manifest).
- `entries` — a map of **roles** to relative file paths inside the package.
  `document` is required at formatVersion 1.

**`document.ui`** — the authored document:

```json
{
  "format": "crafty.ui-document",
  "document": {
    "schemaVersion": 3,
    "id": "doc-...",
    "pages": { },
    "nodes": { },
    "pageOrder": [ ],
    "components": { },
    "instances": { },
    "libraries": { },
    "variables": { }
  }
}
```

The `document` payload is the kernel's canonical `EditorDocument`
serialization (`canonicalEditorDocumentString`), including its own
`schemaVersion` (3 today). On read: validate → run the migration chain
(`migrateDocument`) → record which migrations ran. Unknown document schema
versions are rejected (I10). Entries carry no wrapper version of their own —
entry contracts are defined by the package `formatVersion`; document
evolution happens inside `schemaVersion`.

On disk: `~/.crafty/untitled.ui/`, `~/.crafty/files/<slug>.ui/` — the folder
IS the file, and the folder maps to a repository directory naturally when
repo sync arrives.

## Why this shape (research lessons)

| Format | Container | Versioning | Lesson for Crafty |
|---|---|---|---|
| **pen.dev `.pen`** (in-repo reader) | single JSON | strict `version: "2.14"` gate; anything else → `PEN_DOCUMENT_INVALID` | strict, explicit version gate with a machine-readable diagnostic |
| **Sketch `.sketch`** | ZIP of JSON (`document.json`, `pages/*`, `meta.json`, `images/`) | `version` (format) + `compatibilityVersion`; JSON Schema spec published | JSON text keeps the format open, diffable and toolable; separate homes for shared styles (document.json) and assets (images/) |
| **Figma `.fig`** | ZIP with a binary Kiwi payload (self-describing embedded schema, zstd) | version field preserved across edits; no official spec; community parsers | binary buys size/sync at the cost of opacity, unspec'd evolution and zero diffability — rejected |

Crafty's product direction (agent-native editing, the web UI becoming an IDE
where the same document is edited visually or as code) demands **readable,
diffable, canonical text entries**. The container is a plain directory —
transparent, inspectable, version-controllable — instead of a ZIP, because
Crafty has no assets yet and a directory needs no unpack step.

Rejected alternatives, with reasons:

- **Single-file JSON with sections** — the envelope of the first proposal.
  Rejected by product decision: it leaves no natural home for tokens,
  components and code; every future concern makes the one file bigger; and
  the directory shape maps to the future repo-sync model. The single-file
  version remains a valid *document serialization* — it is exactly what
  `document.ui` contains.
- **ZIP container (`sketch`/`fig`-style)** — the ZIP exists for assets and
  previews; a directory is a ZIP without the pack step, and Crafty's assets
  are references, not blobs (invariant).
- **Binary container (Kiwi-style)** — opaque, not diffable, no spec; none of
  Crafty's current scale problems (size, sync) exist.
- **YAML / TOML / custom text DSL** — new parsing surface, no tooling, worse
  than JSON for nested trees.
- **Multi-file without a manifest** — no commit point, no revision, torn
  packages undetectable. The manifest makes the package transactional.
- **Flat node array with parent indices (`.fig`'s `nodeChanges`)** — an
  optimization for their sync protocol; Crafty's back-linked child lists are
  the authored truth (invariant) and serialise as-is.

## Modularity: the entry vocabulary

The manifest's `entries` map is the modularity mechanism. formatVersion 1
defines one role:

| Role | Shape | FormatVersion 1 | Notes |
|---|---|---|---|
| `document` | one `.ui` file | **required** | the authored document (pages, nodes, page canvases, components, instances, libraries, variables) |
| `tokens` | one `.ui` file | declared, not created | design tokens — variables and themes, when tokens become cross-file (libraries). The kernel's `document.variables` is the current home |
| `components` | a directory of `.ui` files | declared, not created | one entry per reusable component/symbol; arrives with the resolution step |
| `code` | a directory | declared, not created | production code referenced by component entries (the Framer model); the IDE/export surface |

Rules:

1. New roles are **additive** at a given `formatVersion`: an older app that
   knows formatVersion 1 reads a package with new roles correctly as long as
   the new roles do not change how existing entries are interpreted. A role
   that changes package semantics (e.g. makes `document` depend on another
   entry) requires a `formatVersion` bump.
2. Unknown roles in a package at a known `formatVersion` are **rejected**
   (`UI_ENTRY_UNSUPPORTED:<role>`) — never silently dropped (I10 discipline).
3. A manifest that references a missing entry is **rejected**
   (`UI_ENTRY_MISSING:<role>`) — reported, never guessed.
4. Entry paths are relative and must resolve **inside** the package
   directory; escaping paths are rejected (`UI_ENTRY_PATH_INVALID`).
5. **Node-level features never touch the package.** Figma-like layout
   (flex/stack), animation triggers, new fills — all land as additive optional
   fields on `DocumentNode` (e.g. `layout: { mode: "flex", direction, gap }`),
   gated by the document `schemaVersion` with a migration in the chain. The
   format spec states this policy so future feature work follows it.
6. Declared roles ship only when the feature exists — the vocabulary is the
   format's contract, not empty directories in every package.

## Expressive: what the format carries

The `document` entry is the complete authored model — everything the legacy
`Scene` dropped is preserved:

- page canvases: grid (mode, spacing, origin, visibility), rulers, guides,
  snap settings, per-page rest camera (`PageRecord.canvas`);
- components, instances, libraries, variables;
- `locked`, node `metadata`;
- path geometry (schema v3), fills, strokes, transforms, ordering.

**Authored intent only.** References stay references: a node referencing a
variable carries the reference, never the resolved value; an instance carries
reference-plus-delta, never a copy. No resolved value is ever written into
the package (the authored/resolved invariant).

## Canonical serialization

Every entry is **byte-stable**:

- JSON with keys recursively sorted (the existing
  `canonicalEditorDocumentString` rule), applied to entries and manifest
  alike;
- no timestamps, no random ids, no iteration-order dependence;
- two saves of the same package state produce byte-identical files — clean
  diffs, stable hashes, safe input for the future code-IDE surface.

## Transaction model

- Every entry write is atomic: temp file → `fsync` → `rename`.
- **The manifest is the commit point**: entries write first, the manifest
  (with the bumped revision) writes last.
- Crash between an entry write and the manifest write: readers see a valid
  entry at the previous revision — the revision lags, nothing is torn; the
  next write settles it. Crash mid-entry-write: old entry, old manifest —
  consistent. A package can never be observed torn.
- Reads go to disk on every request (no in-memory cache), with the
  optimistic-concurrency check on the manifest revision
  (`DOCUMENT_REVISION_STALE`).

## Read path

1. Read `manifest.ui`; `UI_MANIFEST_MISSING` / `UI_PARSE_FAILED` on failure.
2. Check `format` and `formatVersion`; `UI_FORMAT_UNSUPPORTED` on mismatch.
3. Validate the entries table: known roles, paths inside the package
   (`UI_ENTRY_UNSUPPORTED` / `UI_ENTRY_PATH_INVALID`).
4. Read each entry, check its marker; `UI_ENTRY_MISSING` for a referenced
   file that is not there.
5. Validate + migrate the document; record migrations; diagnostics carry
   JSON paths and machine-readable codes, never prose.
6. A package that fails validation is reported, never silently repaired.

## Legacy `scene.json`

For alpha continuity, the store keeps a **one-shot legacy read**: an existing
`~/.crafty/scene.json` or `~/.crafty/files/<slug>/scene.json` loads through
the current `sceneToEditorDocument` adapter, is saved as a `.ui` package on
the next save (the user is told the file was converted), and the legacy file
is left in place — the user's data is never deleted. The adapter's
`SCENE_ADAPTER_UNSUPPORTED_KIND:path` stop-gap remains a diagnosed limitation
of the legacy path only. The `Scene` round-trip (save direction) is deleted;
`Scene` survives solely as the transitional scene-model type and as
`pen-import`'s intermediate (until that emits documents).

## Autosave and recovery

- The save path becomes document-native with a **debounced autosave**
  (persistence.md target property 5): edits schedule a save; the debounce
  (≈800 ms) collapses bursts; the optimistic-concurrency revision check stays
  (stale → 409 → the client reloads and retries).
- Recovery (target property 6, journal/shadow) is **deferred**: the atomic
  per-entry writes plus manifest-last ordering prevent torn packages, and the
  debounced autosave keeps the package recent; a journal is a separate
  mechanism recorded as a follow-up.

## Package layout (ownership)

- `editor-kernel` owns document (de)serialization (it owns the document).
- `scene-store` owns the package: manifest, entries, file lifecycle,
  atomicity and revision (it already owns slugs, atomic writes, listing,
  snapshots). Its `Scene` API retires; the package name stays (a rename is
  mechanical churn with no behavioural value; noted for cleanup).
- Routes, shell, `persistence.ts`, CLI wire the two.
- `pen-import` emits `EditorDocument`.

Dependency flow is unchanged: kernel ← store ← routes/shell/CLI.

## Open questions (recorded, not blocking)

- `tokens` / `components` / `code` roles are **declared in the vocabulary**
  but implemented when the features land — no empty directories ship
  (speculative abstraction is prohibited).
- The `.ui` MIME type and file-browser affordances are alpha-nice, not
  required.
