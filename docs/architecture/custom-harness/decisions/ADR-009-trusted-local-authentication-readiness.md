# ADR-009: Trusted-local authentication, transport boundaries, and readiness

**Status:** Accepted — 2026-08-24  
**Decision history:** Proposed 2026-08-24; accepted by the user 2026-08-24.  
**Accepted inputs:** AC-02, AC-04  
**Authority:** Accepted architecture only; no deployment or authentication
implementation authority. Implementation remains gated by the separately
reviewed [Phase 1 implementation plan](../PHASE-1-IMPLEMENTATION-PLAN.md).

## Context

“Local” is a deployment boundary, not an authenticated actor identity. Multiple
transport adapters and optimistic health checks can create alternate command
paths or report ready while persistence, supervision, Git, or a required
sandbox is unavailable.

## Decision

Phase 1 supports one configured human operator on one trusted local host. Every
command carries an authenticated actor identity, including CLI, loopback HTTP,
private MCP, scheduler, and gate actions. Authentication details and credential
storage require implementation design, but transport location or OS username
alone is not accepted as a gate vote.

All transports are thin adapters to the same versioned Effect Command Port. Any
HTTP listener is loopback-only. Effect-to-Rust communication is private
parent-child IPC, not a public daemon socket. Remote binding, anonymous mutation,
multi-user identity, tenant selection, and remote workers are rejected in Phase 1.

Readiness is capability-based and based on active probes, not configuration
presence. It includes:

- authenticated command and gate path;
- exact SQLite/VFS/filesystem identity, required per-connection synchronization
  settings, integrity, and transactional read/write probe under ADR-002;
- compatible Rust protocol and descendant-supervision probe;
- reviewed-tool launch-hygiene, root-anchored use-time path-containment, and
  required Git-operation probes; and
- exact sandbox backend probe whenever an admitted operation requires it.

An unavailable capability denies every dependent admission and appears in
readiness diagnostics with a stable machine-readable reason. It cannot select a
less-safe adapter. Overall service readiness is false when a capability required
for the configured Phase 1 surface is unavailable; unrelated disabled surfaces
do not create a false support claim.

Only platforms selected and qualified under ADR-006 may report the corresponding
capabilities ready. Windows cannot report Phase 1 ready.

## Invariants

- **ADR-009-I01:** Transport adapters cannot write state or execute tools
  directly.
- **ADR-009-I02:** One authenticated actor model does not imply anonymous
  localhost trust.
- **ADR-009-I03:** Liveness is not readiness and cannot authorize work.
- **ADR-009-I04:** Missing storage, process, race-resistant path, or sandbox capability fails
  closed.

## Binary acceptance checks

- [ ] **ADR-009-AC01:** Every enabled transport resolves to one authenticated actor and one Command
      Port behavior.
- [ ] **ADR-009-AC02:** Non-loopback and anonymous mutation attempts are rejected.
- [ ] **ADR-009-AC03:** Failed SQLite, Rust, Git, path, authentication, or required sandbox probes
      deny dependent admissions with stable diagnostics.
- [ ] **ADR-009-AC04:** A changed SQLite synchronization setting, VFS/filesystem profile,
      reviewed-tool launch primitive, or root-anchored path primitive makes the
      affected readiness capability false rather than degraded.
- [ ] **ADR-009-AC05:** Windows and unselected platforms cannot report supported
      readiness.

## Non-goals

Remote access, multi-user/tenant authentication, public API deployment, high
availability, and implementation choice of an authentication library.
