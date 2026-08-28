# ADR 0002: Editor runtime is not an output runtime

## Status

**Historical.** Accepted for the block-compiler product lineage, which is
dormant. See `docs/architecture/legacy-and-cleanup.md`. The principle may still
hold; the product context does not.

## Decision

The Linux authoring tool renders an editor projection of the canonical IR. It is not a privileged output backend.

## Consequences

- Web preview may be the fastest MVP target without becoming the source of truth.
- Native targets remain peer backends.
- Editor-only concepts such as selection, guides, and camera state stay outside persisted design documents.
