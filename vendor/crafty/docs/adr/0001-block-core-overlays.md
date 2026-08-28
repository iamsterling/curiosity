# ADR 0001: Canonical block design uses core plus overlays

## Status

**Historical.** Accepted for the block-compiler product lineage, which is
dormant. See `docs/architecture/legacy-and-cleanup.md`. The principle may still
hold; the product context does not.

## Decision

Each component block has one canonical structural design file, `design.core.json`, plus optional target overlays stored under `targets/`.

## Consequences

- The core file is the only source of structural truth.
- Overlays may refine lowering for a target but may not replace the block structure.
- Multi-target support stays within one product instead of drifting into separate per-target design sources.
