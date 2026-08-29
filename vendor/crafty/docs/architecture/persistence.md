# Persistence

Status: **Current**. Crafty persists the authored `EditorDocument` as a
canonical `.ui` directory package. The renderer's projected `Scene` is not a
storage format.

## Package

The data directory is `~/.crafty` (or `CRAFTY_DATA_DIR`):

```text
untitled.ui/
  manifest.ui
  document-<revision>.ui
files/<slug>.ui/
  manifest.ui
  document-<revision>.ui
```

`manifest.ui` is `crafty.ui-package` format version 1 and contains the
monotonic `revision` and an `entries` role map. The selected immutable document
entry is the
`crafty.ui-document` envelope around the kernel's recursively key-sorted
canonical authored document JSON, including component definitions, instances,
overrides and semantic-surface links. The manifest is the commit point. No
resolved projection or legacy `Scene` is written.

`packages/scene-store/src/ui-format.ts` validates markers, versions, roles and
contained entry paths. Unknown versions and roles are rejected; no malformed
package is guessed or silently repaired. The kernel validates and migrates the
document on read, returning the migration ids that ran.

## Atomicity and concurrency

`writeDocument` validates the candidate, writes and syncs an immutable
revision-specific entry, then atomically replaces and syncs `manifest.ui` as
the commit point. Post-publication verification confirms the intended entry is
readable before success is acknowledged. A stale `expectedRevision` returns
`DOCUMENT_REVISION_STALE` and leaves the package unchanged. Reads go to disk on
each request. Snapshots hash the canonical document bytes with SHA-256.

Existing legacy `scene.json` files are read once through the scene adapter and
marked `converted`; the next document save creates a `.ui` package and leaves
the legacy file untouched. The legacy save direction is retired. A legacy
`path` layer remains a diagnosed adapter limitation.

## Product wiring

- `GET`/`PUT /api/files/<slug>/document` are thin route adapters over the store.
- Server Components use `readDocument`/`listFiles` directly.
- The editor's manual save and ~800 ms debounced autosave send the canonical
  document once. A stale response is surfaced as a conflict rather than
  replaying local bytes at the disclosed revision.
- `.pen` import produces an `EditorDocument` and commits it through the same
  package writer.
- CLI `import`, `save` and `load` operate on `.ui` packages.

### Native iOS adapter

The Curiosity iPad slice consumes the same portable format codec through
`@crafty/scene-store/ui-format`; manifest gates, document-entry validation and
canonical serializers are no longer reimplemented in the app. It reloads an
app-private `crafty-portability.ui` package at launch and exposes a manual save
that writes and verifies a temporary immutable revision entry before moving it
into place, then moves `manifest.ui` last as the commit point. A stale published
revision fails with `DOCUMENT_REVISION_STALE`; an interrupted entry write never
advances the manifest.

This is app-sandbox persistence through Expo FileSystem, not yet a document
provider contract. Expo's API does not expose `fsync`, and the adapter has not
yet added `UIDocument`, security-scoped provider access, or provider/crash
testing. Those remain required before claiming Files-app/provider durability.

## Deliberately deferred

Recovery journals, embedded asset blobs, repository sync, collaboration and
cross-file token/component resolution are not part of the alpha package.
Authored references remain references; resolved values never enter the file.
