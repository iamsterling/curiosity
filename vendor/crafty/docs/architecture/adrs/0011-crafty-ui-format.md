# ADR 0011: Crafty `.ui` document packages

Status: **Accepted — implemented**  
Date: 2026-08-11

## Context

The authored `EditorDocument` contains page canvases, stable node metadata,
components, instances, libraries, variables and path geometry. The former
`Scene` persistence path could not represent those fields. The store therefore
needs a canonical, inspectable format with a crash-safe commit point and an
optimistic revision token.

## Options considered

- **Single JSON file:** simple, but gives future tokens, components and code no
  natural package entry and makes the file grow without boundaries.
- **ZIP or binary container:** useful for assets or size, but opaque and poor
  for diffs and agent/code-IDE workflows.
- **Directory package with manifest:** readable JSON entries, explicit
  extension vocabulary, and a manifest that can be written last as the commit
  point. Chosen.
- **Multi-file package without a manifest:** cannot identify torn writes or
  define the package version. Rejected.
- **YAML/custom DSL or flat node arrays:** adds a parser or changes the
  authored identity model without a current product need. Rejected.

## Decision

Persist one `<slug>.ui/` directory containing:

```text
manifest.ui  # crafty.ui-package, formatVersion, revision, entries
document-<revision>.ui  # immutable crafty.ui-document entry selected by the manifest
```

The store writes and syncs an immutable revision entry, writes `manifest.ui`
last, then verifies the manifest-selected publication before acknowledging it.
The current and immediately previous entries are retained for bounded recovery;
older unreachable entries are removed after verification. Unknown
package versions, roles, paths and document schema versions are rejected with
machine-readable diagnostics. `scene.json` remains a read-only, one-shot
legacy conversion path; it is never written by the product again. The manifest
vocabulary may grow additively for tokens, components and code when those
features exist; empty speculative entries are not created now.

Autosave is debounced and uses the same document route as manual save. A stale
revision is surfaced as a conflict; local bytes are never replayed at the
store-provided current revision because that would overwrite the intervening
publication.

## Consequences

Documents round-trip without the legacy loss list and remain diffable. The
filesystem store owns package lifecycle and revisions; the kernel owns document
serialization and migration; routes, the editor chrome and CLI are adapters.
Recovery journals, embedded assets, collaboration and cross-file resolution
remain separate follow-up decisions.
