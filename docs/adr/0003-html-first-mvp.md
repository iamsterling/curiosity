# ADR 0003: HTML is the only real compiler target in the MVP

## Status

**Historical.** Accepted for the block-compiler product lineage, which is
dormant. See `docs/architecture/legacy-and-cleanup.md`. The principle may still
hold; the product context does not.

## Decision

The MVP ships a single real compiler target, HTML/CSS, to prove the contracts, loader, validator, and backend pipeline.

## Consequences

- The architecture remains multi-target.
- MVP complexity stays bounded.
- iOS, Android, and Expo compilers are deferred until the contracts and pipeline are stable.
