# ADR 0014: release-candidate authority and fencing

**Status:** Accepted — 2026-08-12

## Context

The native replacement removed the imported loop daemon and established Ledger events, hooks, tools, and an execution-only journal. That foundation did not yet prove a complete domain authority, cross-process exclusion, descendant/tool terminality, strict recovery, or staged rollback.

## Decision

- Ledger is the only lifecycle authority. Its closed, versioned domain owns intent, capability/delta application, criteria and scenario lineage, work/dependencies, claims, evidence/facts, resolution proposals, approvals, capture gaps, audit, reconciliation, and immutable archives.
- Material writes require repository-scoped filesystem fencing with an epoch/token checked at commit. Corrupt or unprovable state blocks mutation; it is never replaced with empty state.
- The native loop journal is execution-only. Continuation requires a current Ledger claim/fence and positive terminal observations for the root, every tracked descendant, and every tool half. Unknown capability becomes a stable ambiguous/unsupported state rather than inferred success.
- Direct root-session `user` input is the only bounded approval signal exposed by the pinned host. It is operational attribution, not cryptographic identity; the audit records `bounded-root-input`, and strict authority mode disables consequential approval.
- Agent and command resources contain semantic judgment and optional compatibility guidance only. Deterministic safety and completion rules live in codecs, reducers, hooks, doctor checks, and structured tools.
- Release installation is manifest-only and transactional. Receipts bind hashes and load paths; failed update and rollback preserve Ledger state.

No daemon, timer, polling, plugin-owned process/shell/git/watch runtime, alternate session/model/tool system, or legacy-state migration is introduced.

## Consequences

Unsupported child lineage, token binding, autonomous compaction, cadence, shell, watch, checkpoint, daemon, and scheduled behavior remain disabled with stable diagnostics. Global cutover remains a separate operator decision.
