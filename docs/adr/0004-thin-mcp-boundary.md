# ADR 0004: MCP is a thin wrapper over core services

## Status

**Historical.** Accepted for the block-compiler product lineage, which is
dormant. See `docs/architecture/legacy-and-cleanup.md`. The principle may still
hold; the product context does not.

## Decision

MCP tools must call the same core services used by the CLI and later clients.

## Consequences

- No duplicated business logic between MCP and CLI.
- Validation and compilation remain deterministic across surfaces.
- AI automation stays constrained to the same contract surface as humans.
