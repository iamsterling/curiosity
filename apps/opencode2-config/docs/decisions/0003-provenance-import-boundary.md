# ADR 0003: Provenance import boundary

Status: Accepted

## Decision

Separate repository establishment, committed baseline import, dirty OpenCode 2 conversion import, and identity normalization into four commits. Preserve the original MIT license, source SHA, per-file hashes, exact dirty patch digest, and installed-copy hash comparisons.

Installed global copies are verification inputs only. Runtime state, dependencies, caches, logs, credentials, Crafty policy/application material, OpenSpec, AI-DLC artifacts, and the rejected benchmark harness are excluded.

## Consequence

Imported implementation can be reproduced and audited without confusing source attribution with current ownership or importing machine state.
