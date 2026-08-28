# Frozen Spec Kit archive

Status: **Historical.** Do not add to this directory and do not edit what is in
it.

Spec Kit was retired. Planning now lives in [`openspec/`](../openspec/) — see
[`AGENTS.md`](../AGENTS.md) § How to Work in This Repository. The retirement is
recorded in
[`docs/architecture/legacy-and-cleanup.md`](../docs/architecture/legacy-and-cleanup.md).

## Why it is still here

These twelve features are intent archaeology: they record what was being
attempted and why, which is often the only surviving explanation for a decision
in the code. `docs/research/` and
[`ADR 0007`](../docs/architecture/adrs/0007-typegpu-host.md) cite them by path.

They are **not** a description of current architecture. For that, read
[`docs/architecture/current-state.md`](../docs/architecture/current-state.md),
which labels every claim Current / Transitional / Target / Proposed / Deferred /
Unknown. Where an archived spec and the code disagree, the code is right.

## Lineages

| Specs | Lineage |
|---|---|
| `001`–`005` | Block-compiler product — dormant |
| `006`–`011` | Canvas lineage — superseded by `docs/architecture/` |

Note that two directories share the `001` prefix (`component-workbench-mvp` and
`project-structure-discovery`); the numbering was never authoritative.
