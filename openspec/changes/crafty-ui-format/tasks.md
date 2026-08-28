# Crafty UI file format (`.ui`) — tasks

## 1. Kernel: document (de)serialization API

- [x] 1.1 Add `packages/editor-kernel/src/document-serialization.ts`: `serializeDocument(document): string` (canonical, via `canonicalEditorDocumentString`), `parseDocument(json: string): ParseResult` (validate + `migrateDocument` chain + recorded migrations + machine-readable diagnostics with JSON paths)
- [x] 1.2 Re-point `CanvasEditor.serializeDocument()` / `replaceDocumentJson()` (`apps/crafty-web/src/editor/harness.ts:191,344`) at the new API; the harness stops owning serialization
- [x] 1.3 Tests: parse accepts current version; parse migrates v1→v3 with the chain recorded; unknown document schema rejected (`DOCUMENT_UNSUPPORTED_SCHEMA`); canonical serialize is byte-stable and sorted (assert against a committed fixture)

## 2. Store: `.ui` package and file lifecycle

- [x] 2.1 Add `packages/scene-store/src/ui-format.ts`: package types (`manifest.ui`: `format`/`formatVersion`/`revision`/`entries`; `document.ui` marker), `serializeUiPackage(document)`, `parseUiPackage(json)` (marker → `UI_FORMAT_MISSING`, version → `UI_FORMAT_UNSUPPORTED:<version>`, unknown role → `UI_ENTRY_UNSUPPORTED:<role>`, escaping path → `UI_ENTRY_PATH_INVALID`), the entry vocabulary
- [x] 2.2 Package-directory naming: `untitled.ui/` default, `files/<slug>.ui/` for the rest (`packageDirectory(slug)`); legacy `scene.json` paths stay readable (`~/.crafty/scene.json`, `~/.crafty/files/<slug>/scene.json`)
- [x] 2.3 Add `readDocument(slug)` / `writeDocument(slug, expectedRevision, document)`: per-entry atomic writes (temp file + fsync + rename), manifest written last as the commit point, revision in the manifest, optimistic concurrency (`DOCUMENT_REVISION_STALE`); missing manifest → `UI_MANIFEST_MISSING`; missing referenced entry → `UI_ENTRY_MISSING:<role>`; remove the `Scene` save path
- [x] 2.4 Update listing and snapshots: `listFiles` reads the packages (manifest + revision + document name); snapshots keep canonical-bytes + sha256 of the document
- [x] 2.5 Tests: package round-trip; gates (missing manifest, marker mismatch, version 2 refused, unknown role refused, escaping path refused, missing entry); crash-between-writes leaves a readable package at the old revision; canonical determinism; revision concurrency; legacy `scene.json` read + convert-on-save

## 3. Routes, shell and autosave

- [x] 3.1 Add `apps/crafty-web/src/app/api/files/[slug]/document/route.ts` — GET `{ document, revision }`, PUT `{ expectedRevision, document }` (409 `DOCUMENT_REVISION_STALE`); retire the `scene` route
- [x] 3.2 Server Components: the file browser and the editor shell read documents through `readDocument` (and the legacy path for existing scene.json slugs)
- [x] 3.3 `apps/crafty-web/src/editor/persistence.ts`: save documents; add a debounced autosave (≈800 ms) fed by `renderRevision`/document changes, with the manual save retained; stale-write retry after reload
- [x] 3.4 Tests: route round-trip; autosave debounce collapses bursts (fake timers); stale write surfaces the code and retries

## 4. Import pipeline

- [x] 4.1 `packages/pen-import`: emit `EditorDocument` instead of `Scene` (the kernel's `migrateDocument`-compatible shape; page canvas defaults attached)
- [x] 4.2 The import route and CLI save the imported document as a `.ui` package via the store
- [x] 4.3 Tests: `.pen` → document → `.ui` package round-trip (the existing pen fixtures)

## 5. CLI

- [x] 5.1 `apps/cli`: `save <slug> <dir.ui>` and `load <slug> [dir.ui]` faces (save copies the store package to disk; load writes a package directory into the store); `import` updated for the new pipeline
- [x] 5.2 Tests: save/load round-trip through the store on a temp `CRAFTY_DATA_DIR`

## 6. Round-trip and migration tests (the loss list becomes a test matrix)

- [x] 6.1 A fixture document exercising the full loss list (grid, rulers, guides, snap, rest camera, component, instance, library reference, variable, locked, metadata, path) — committed generated fixture
- [x] 6.2 Save → reload → identical document assertion (the kernel's existing `harness.test.ts:350` round-trip moves to the product path)
- [x] 6.3 Determinism: two saves byte-identical; the fixture's canonical bytes committed as the reference
- [x] 6.4 The legacy `scene.json` → `.ui` package conversion test (a legacy fixture with the loss list converted; the `path` stop-gap diagnosed)

## 7. Docs, ADR and close-out

- [x] 7.1 ADR 0011: persistence format — `.ui` directory package (manifest as commit point, entry vocabulary, revision in the manifest); the decision, the rejected alternatives (single-file JSON, binary Kiwi-style, ZIP container, YAML/custom DSL, multi-file without manifest, flat node array) with reasons, and the extension policy
- [x] 7.2 Rewrite `docs/architecture/persistence.md` (Current: `.ui` packages; the legacy `Scene` read; the deferred journal), update `current-state.md` (gap 1 resolved; scene-store API reality), and the ADR index
- [x] 7.3 `docs/architecture/research-ledger.md`: the format research row (`.pen`/`.sketch`/`.fig` — sources, lessons, adopted/rejected) — row drafted, verify the conclusion cell matches the package decision
- [ ] 7.4 Run the repository verification suite (`bun run typecheck`, `bun run test`, `bun run lint`, `bun run format:check`, `bun run build`) and confirm all pass
  - Rebaselined: typecheck, lint, and format-check pass; targeted scene-store (41), route (2), persistence (5), and CLI (21) tests pass.
  - Blocked by the existing editor-web build failure: `@crafty/files/ui` cannot be resolved from `apps/web/editor/src/app/files/[slug]/layout.tsx` (also causes the aggregate test command's dependency build to fail). This is outside the `.ui` persistence task and is intentionally not changed.
