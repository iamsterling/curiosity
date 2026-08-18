# ADR 0001: Brand-new identity and state namespace

Status: Accepted

## Decision

Use package `@iamsterling/opencode2-config`, runtime plugin ID `iamsterling.opencode2-config`, native project state directory `.opencode/opencode2-config/`, daemon binaries `opencode2-config` and `opencode2-configd`, and daemon task namespace `opencode2-config/tasks` with override `OPENCODE2_CONFIGD_TASK_DIR`.

Retain `[opencode-loop:<command>]` and the local command-agent name temporarily as an internal command compatibility protocol, not runtime identity. Old `.opencode/opencode-loop/` data is future explicit migration input only and is never silently treated as native state.

## Consequence

The new plugin cannot accidentally adopt or mutate an installed old plugin's state. Migration and cutover require a separate reviewed change.
