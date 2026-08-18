# ADR 0042: beta-17595 future release source profile

**Status:** Accepted 2026-08-18 for repository source; new artifact remains NO-GO pending a clean reviewed build

Future private Darwin arm64 M7 builds use exact OpenCode
`0.0.0-beta-17595` and Effect `4.0.0-beta.107`, matching plugin ADR 0025 and
the active service ABI. The root lockfile remains the dependency authority.

ADR 0040 and its beta-17519 artifact identity remain immutable historical
evidence; this repin does not relabel or replace that artifact. A new release
requires its own clean committed source, full release verification, review,
and separately approved installation action.
