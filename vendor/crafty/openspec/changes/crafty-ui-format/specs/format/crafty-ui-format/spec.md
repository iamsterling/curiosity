# Crafty UI file format (`.ui`)

## Purpose

Defines the `.ui` persistence format for alpha: the directory package (the
manifest, the entries, the version gates, the canonical rules, the entry
vocabulary, the transaction model), the legacy read path, and the guarantee
that the authored document survives save/reload without loss. This is the
transport contract between the kernel (document truth), the store (package +
file lifecycle), and the routes/shell/CLI that move packages.

## ADDED Requirements

### Requirement: A `.ui` package declares its format and version

A `.ui` package SHALL be a directory containing `manifest.ui` and
`document.ui`. `manifest.ui` SHALL be a UTF-8 JSON object carrying a `format`
marker of `"crafty.ui-package"`, a `formatVersion` integer, a `revision`
integer and an `entries` map of roles to relative paths. A package root
without `manifest.ui` SHALL be rejected with `UI_MANIFEST_MISSING`; a
manifest whose `formatVersion` is not the current version SHALL be rejected
with `UI_FORMAT_UNSUPPORTED:<version>` before any entry parsing.

#### Scenario: A foreign file is refused

- **WHEN** a store read receives a directory whose manifest lacks the
  `"crafty.ui-package"` marker
- **THEN** it fails with `UI_FORMAT_MISSING`
- **AND** nothing is parsed as a document

#### Scenario: A newer format is refused, never coerced

- **WHEN** a store read receives a package whose manifest declares
  `formatVersion` 2
- **THEN** it fails with `UI_FORMAT_UNSUPPORTED:2`
- **AND** no entry is partially loaded or repaired (I10 discipline)

### Requirement: The package layout is fixed and contained

`manifest.ui` and `document.ui` SHALL live at the package root. Every entry
path SHALL be relative to the package directory and SHALL resolve inside it;
escaping paths SHALL be rejected with `UI_ENTRY_PATH_INVALID`. Every entry
file SHALL carry the `crafty.ui-*` marker matching its role.

#### Scenario: The layout is canonical

- **WHEN** a store creates a package for slug `project`
- **THEN** the package is `files/project.ui/` containing exactly `manifest.ui`
  and `document.ui`
- **AND** the manifest's `entries` is `{ "document": "document.ui" }`

#### Scenario: An entry path escapes the package

- **WHEN** a manifest declares an entry path containing `../`
- **THEN** the read fails with `UI_ENTRY_PATH_INVALID`
- **AND** no file outside the package is read

### Requirement: The document entry is the canonical authored document

`document.ui` SHALL carry the kernel's canonical `EditorDocument`
serialization, including its own `schemaVersion` (3 at the time of writing).
A round trip — save a document, reload the package — SHALL reproduce the
document exactly: page canvases (grid, rulers, guides, snap, rest camera),
components, instances, libraries, variables, `locked`, node `metadata` and
path geometry SHALL all survive.

#### Scenario: The loss list round-trips

- **WHEN** a document exercising the full loss list (grid settings, guides,
  snap settings, per-page rest camera, a component definition, an instance, a
  library reference, a variable, a locked node, node metadata, a path node) is
  saved and reloaded
- **THEN** the reloaded document is identical to the saved one
- **AND** no field from the loss list is dropped, defaulted or repaired

#### Scenario: A path node round-trips

- **WHEN** a document containing a path node is saved and reloaded
- **THEN** the path geometry, fill rule and stroke descriptor are byte-identical

### Requirement: Serialization is deterministic

The manifest and every entry SHALL be canonical: JSON keys sorted
recursively, no timestamps, no random ids, no iteration-order dependence.
Saving the same package state twice SHALL produce byte-identical files.

#### Scenario: Two saves hash identically

- **WHEN** the same document is saved twice
- **THEN** the two packages are byte-identical file for file
- **AND** every file is a stable diff and hash input

### Requirement: Reads validate, migrate and report; they never silently repair

A read SHALL validate the manifest, reject unknown entry roles with
`UI_ENTRY_UNSUPPORTED:<role>`, reject missing referenced entries with
`UI_ENTRY_MISSING:<role>`, then validate the document and apply the document
migration chain (`migrateDocument`). The read SHALL report which migrations
ran and SHALL surface failures as machine-readable diagnostics with JSON
paths. A package that fails validation SHALL be reported and SHALL NOT be
silently repaired.

#### Scenario: An unknown entry role is refused

- **WHEN** a package at the current `formatVersion` declares an entry role the
  current implementation does not know
- **THEN** the read fails with `UI_ENTRY_UNSUPPORTED:<role>`

#### Scenario: A referenced entry is missing

- **WHEN** a manifest references `document.ui` but the file is absent
- **THEN** the read fails with `UI_ENTRY_MISSING:document`

#### Scenario: A document migrates with a record

- **WHEN** a package contains a document at schema version 1
- **THEN** the read applies the v1→v2→v3 migration chain
- **AND** the read reports that migrations ran
- **AND** an unknown document schema version is rejected (I10)

### Requirement: The package is modular and extensible

Future cross-cutting features SHALL land as additive entry roles at the
current `formatVersion`, declared in the manifest's `entries` map. The
vocabulary SHALL reserve `tokens` (design tokens — variables and themes),
`components` (reusable symbols) and `code` (production code); each SHALL be
created only when the feature it serves exists. A role that changes how
existing entries are interpreted SHALL require a `formatVersion` bump.
Node-level features (layout, animation) SHALL land as additive optional node
fields gated by the document `schemaVersion` with a migration — never as new
package semantics.

#### Scenario: A new role is additive

- **WHEN** design tokens become cross-file and the package gains `tokens.ui`
  with an `entries` entry `"tokens": "tokens.ui"`
- **THEN** any implementation of the same `formatVersion` reads it
- **AND** the `document` entry is unaffected

#### Scenario: Layout extends nodes, not the package

- **WHEN** flex/stack layout lands
- **THEN** it is an optional `layout` field on nodes at a new document
  `schemaVersion`
- **AND** the manifest rules and entry vocabulary are unchanged

### Requirement: The package carries authored intent, never resolved values

The `document` entry SHALL carry references and intent: a variable reference
stays a reference, an instance stays reference-plus-delta, and no resolved
value (a resolved colour, an expanded component, a layout result) SHALL be
written into the package.

#### Scenario: Variables stay references

- **WHEN** a document with a variable reference is saved
- **THEN** the package contains the reference, not the resolved value

### Requirement: Assets are references, not blobs

The package SHALL NOT embed asset bytes in the document. Asset references
(ids, hashes) are the only asset representation until a container decision is
made when images land.

#### Scenario: Saving preserves an asset reference without inlining bytes

- **WHEN** a document containing an image node is saved with its asset recorded
  by reference metadata such as an asset id or hash
- **THEN** the package stores only that reference in `document.ui`
- **AND** no binary asset payload or base64 blob is embedded in the package

### Requirement: Legacy `scene.json` files load once

The store SHALL read a legacy `scene.json` (through the existing
`sceneToEditorDocument` adapter) and SHALL convert it to a `.ui` package on
the next save, reporting the conversion. The legacy `Scene` save path SHALL
be removed; the adapter's `SCENE_ADAPTER_UNSUPPORTED_KIND:path` stop-gap
remains a documented limitation of the legacy read only.

#### Scenario: A legacy scene converts

- **WHEN** a store read finds `scene.json` for a slug
- **THEN** the document loads through the legacy adapter
- **AND** the next save writes a `<slug>.ui` package and the conversion is
  reported
- **AND** the legacy file is left in place (the user's data is never deleted)

### Requirement: The package lifecycle stays crash-safe and concurrent

Every entry write SHALL be atomic (temp file → fsync → rename). The manifest
SHALL be written last — it is the commit point. The monotonic `revision` in
the manifest SHALL back optimistic concurrency
(`DOCUMENT_REVISION_STALE`). Reads SHALL go to disk on every request (no
in-memory cache).

#### Scenario: A stale writer is refused

- **WHEN** a write arrives with an `expectedRevision` older than the stored
  revision
- **THEN** it fails with `DOCUMENT_REVISION_STALE`
- **AND** the stored package is unchanged

#### Scenario: A crash between writes leaves no torn package

- **WHEN** a crash happens after `document.ui` is written but before the
  manifest is
- **THEN** the package reads as the previous revision with a valid document
- **AND** the next write settles the revision

### Requirement: Saving is document-native end to end

`persistence.ts` SHALL save documents (not scenes), with a debounced
autosave. `pen-import` SHALL emit `EditorDocument`. The CLI SHALL save and
load `.ui` packages.

#### Scenario: Autosave collapses bursts

- **WHEN** an edit burst happens
- **THEN** one save runs after the debounce window
- **AND** a manual save remains available
