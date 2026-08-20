# ADR 0029: Controlled phase-core concurrency companion

**Status:** Accepted 2026-08-20 as documentation authority for replacement
schema-v3 SDK-v2 candidate evidence only; no fixture, candidate, approval, or
qualification is created by this decision

## Context

Numbering was checked against `docs/decisions/`: ADR 0028 is the highest
numbered plugin decision, so 0029 is the next available number. Actual Bun
observation-addon concurrency does not establish prescribed callback scheduling.
Runtime ADR 0059 closes that claim narrowly without adding an addon or plugin
surface.

## Decision

Accept [runtime ADR 0059](../../../../runtime/docs/decisions/0059-controlled-phase-core-concurrency-evidence.md)
and the amended [Node-API SDK v2 specification](../../../../runtime/docs/specifications/legacy-memory-node-api-sdk-v2.md)
as the only plugin-side authority for this evidence correction.

Actual observation-addon runs at widths 1, 2, 8, and 32 support only
`concurrencyIsolated`: request-local counter and parity-result isolation under
host-visible concurrency. They do not prove barriers, callback order, or Bun's
natural schedule. The separate `controlledPhaseCoreInterleaving` verdict comes
only from the standalone native Phase-C fixture's closed transcripts and is
never inferred from profile or lifecycle counts.

The fixture is not a Node-API addon, not JavaScript, not a sixth SDK profile, and
not one of the five artifacts. It compiles the exact controller-parameterized
phase functions called by real entry, worker, and completion callbacks with a
zero-state no-op controller. The fixture calls those same functions directly;
fixture-only facades fail. Its explicitly passed, harness-owned synchronization
controller is the sole fixture-process shared-state exception, owns or receives
no counters or results, and may coordinate only the prescribed phases and
collect transcript events. Static, thread-local, per-env,
filesystem, network, environment-variable, and JavaScript coordination remain
forbidden.

Phase A is compile/static only. Replacement schema-v3 candidate and approval
material binds phase-core and real-call-site AST evidence plus fixture source,
build, artifact, and transcript-schema digests. Phase C alone executes the
fixture at widths 1, 2, 8, and 32 and may record the new verdict only from its
single post-completion closed transcript per process.

Scanner evidence is corrected: the actual ten mutation AST nodes plus immediate
parents form the mutation receipt; the nine recorder call sites are separately
bound and cardinality checked. Prefixes used to route scanner output are omitted
from canonical digest-row grammar, while raw scanner output remains bound.

Plugin tests must enforce both independent verdicts and prove fixture and
controller material absent from plugin source, exports, `files`, assets, `dist`,
bundles, provenance, generated OpenCode plugins, install/release candidates, and
normal composition. The OpenCode probe continues to receive only the normal
artifact.

## Preserved prohibitions

ADRs 0027 and 0028 retain their platform, host, dependency, two-export,
confinement, packaging, approval, Ledger/EventCapture authority, M2/M6, release,
and production boundaries. This decision does not implement, execute, approve,
qualify, commit, package, compose, install, release, or deploy anything and makes
no production or Bun-scheduler claim.

## References

[Runtime ADR 0059](../../../../runtime/docs/decisions/0059-controlled-phase-core-concurrency-evidence.md),
[plugin ADR 0028](0028-fifth-node-api-control-flow-observation-companion.md),
[runtime ADR 0058](../../../../runtime/docs/decisions/0058-fifth-node-api-control-flow-observation-artifact.md), and
[Node-API SDK v2](../../../../runtime/docs/specifications/legacy-memory-node-api-sdk-v2.md).
