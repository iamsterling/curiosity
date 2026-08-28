# Custom harness Phase 1 architecture decisions

**Package status:** Accepted; implementation authorized — 2026-08-25  
**Decision history:** Proposed 2026-08-24; ADR-001 through ADR-010 accepted by
the user 2026-08-24; the Phase 1 implementation plan accepted separately by the
user 2026-08-24.  
**Authority:** Accepted Phase 1 architecture. [ADR-011](decisions/ADR-011-direct-build-and-host-decoupling.md)
authorizes direct implementation and supersedes the earlier tranche-entry
sequencing. It does not authorize release, deployment, production use, or a
security-acceptance claim.

## Decision provenance and boundary

This package is the durable next step from the architecture checkpoint in
sessions `ses_fcfc5979bffeAxdXPFs6AQBoL0` and
`ses_fcdc09322ffe10Rl2LObMqwGt3`. It converts the accepted blocking choices into
reviewable ADRs. The harness dossiers and their source systems remain research
inputs, not design authorities. This package makes architectural decisions; it
does not elevate any research assertion into an implementation guarantee.

The user accepted these four constraints on 2026-08-24:

| ID    | Accepted constraint                                                                                                                                                              | Owning ADRs                                                                                                                          |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| AC-01 | Effect.ts is the sole application authority; a narrow Rust execution supervisor is mandatory from day one.                                                                       | [ADR-001](decisions/ADR-001-effect-authority-rust-supervisor.md)                                                                     |
| AC-02 | Phase 1 is trusted-local and single-user, with reviewed external tools only; untrusted execution is rejected without a qualified sandbox.                                        | [ADR-006](decisions/ADR-006-extensions-sandbox-platforms.md), [ADR-009](decisions/ADR-009-trusted-local-authentication-readiness.md) |
| AC-03 | Autonomy is default-deny and propose-first; one authenticated human owns binding approval; every physical provider call is accounted for; Phase 1 claims no hard currency limit. | [ADR-004](decisions/ADR-004-provider-gateway-usage-accounting.md), [ADR-008](decisions/ADR-008-autonomy-and-human-gates.md)          |
| AC-04 | Windows is unsupported; only selected local platforms may be qualified; unavailable process or sandbox capabilities fail closed.                                                 | [ADR-006](decisions/ADR-006-extensions-sandbox-platforms.md), [ADR-009](decisions/ADR-009-trusted-local-authentication-readiness.md) |

Acceptance of AC-01 through AC-04 did not silently accept the added detail in
the ADRs. The user separately accepted ADR-001 through ADR-010 and the Phase 1
implementation plan on 2026-08-24; their original proposal dates and contexts
remain recorded. On 2026-08-25, ADR-011 authorized direct implementation and
retained qualification as a capability-specific acceptance boundary rather than
an OpenCode-coupled entry gate.

The first integrated implementation slice now exists in `apps/custom-harness/`:
authenticated `thread.open` admission, one Effect authority, a static stock
plugin, immutable SQLite events, a mandatory capability-disabled Rust supervisor
handshake, and Bun/Node read-only thread projections. This does not qualify the
remaining Phase 1 capabilities described below.

## Phase 1 system boundary

```text
CLI / loopback HTTP / private MCP
                |
      Effect.ts Command Port
                |
  Effect.ts Application Authority
  commands, events, attempts, policy,
  gates, model loop, usage accounting
       |          |          |
  SQLite WAL      |    Provider Gateway
                  |          |
  private versioned IPC   Vercel AI SDK
                  |
         Rust Execution Supervisor
         invocation validation, process trees,
         root-anchored paths, sandbox adapters
```

Phase 1 treats reviewed external tools as cooperative trusted-computing-base
(TCB) components, not as confined programs. Rust validates an authorized
invocation and minimizes inherited ambient authority, but the grant is not a
runtime sandbox. Denial of same-user filesystem, network, or credential access
requires separately qualified OS confinement.

Durability claims apply only to an exact qualified SQLite VFS, operating-system,
and local-filesystem profile. Under that profile, acknowledgment follows a
synchronized commit; worktree effects require root-anchored, use-time path
containment; and an event may reference an artifact only after durable write,
readback verification, and immutable publication. Unqualified profiles fail
closed rather than inheriting these claims.

## Implementation specifications

- [Plugin-native kernel specification](PLUGIN-NATIVE-SPEC.md) — proposed ABI,
  authority boundary, capability translation, migration sequence, and binary
  acceptance checks for the native Curiosity intelligence layer. It does not
  amend or supersede the accepted ADRs.
- [OpenCode2 behavioral parity specification](OPENCODE2-BEHAVIORAL-PARITY-SPEC.md)
  — complete dependency disposition, native contracts, real-subagent execution,
  migration requirements, and evidence gates. It records that catalog parity
  and workflow-child scaffolding are not full behavioral parity.
- [Bubble Tea presentation protocol](BUBBLETEA-PRESENTATION-PROTOCOL.md) — the
  opt-in nonce-bound Go↔Bun wire contract, fixed geometry, lifecycle, and
  digest-verified payload boundary selected by ADR-012 and made experimental by
  ADR-013.

## ADR inventory

| ADR                                                                    | Status   | Decision                                                    |
| ---------------------------------------------------------------------- | -------- | ----------------------------------------------------------- |
| [ADR-001](decisions/ADR-001-effect-authority-rust-supervisor.md)       | Accepted | Effect authority and narrow Rust supervisor                 |
| [ADR-002](decisions/ADR-002-event-log-sqlite-projections.md)           | Accepted | Event-log truth, SQLite transaction boundary, projections   |
| [ADR-003](decisions/ADR-003-command-attempt-cancellation.md)           | Accepted | Idempotency, attempts, leases, fencing, retry, cancellation |
| [ADR-004](decisions/ADR-004-provider-gateway-usage-accounting.md)      | Accepted | Vercel AI SDK boundary and provider-call accounting         |
| [ADR-005](decisions/ADR-005-capabilities-provenance-sinks.md)          | Accepted | Capabilities, delegation ceilings, provenance, sink gates   |
| [ADR-006](decisions/ADR-006-extensions-sandbox-platforms.md)           | Accepted | Extension trust classes, sandbox readiness, platforms       |
| [ADR-007](decisions/ADR-007-worktree-lifecycle.md)                     | Accepted | Real Git worktree lifecycle and reconciliation              |
| [ADR-008](decisions/ADR-008-autonomy-and-human-gates.md)               | Accepted | Propose-first autonomy and one-human gates                  |
| [ADR-009](decisions/ADR-009-trusted-local-authentication-readiness.md) | Accepted | Trusted-local authentication, transports, readiness         |
| [ADR-010](decisions/ADR-010-provenance-updates-licenses.md)            | Accepted | Exact-revision qualification, updates, and license policy   |
| [ADR-011](decisions/ADR-011-direct-build-and-host-decoupling.md)       | Accepted | Direct build and replaceable copied host adapters           |
| [ADR-012](decisions/ADR-012-bubbletea-presentation-client.md)          | Accepted | Bubble Tea v2 non-authoritative presentation client         |
| [ADR-013](decisions/ADR-013-typescript-default-presentation.md)        | Accepted | TypeScript default TTY; Bubble Tea explicit experimental    |
| [ADR-014](decisions/ADR-014-benchmark-owned-retrieval.md)             | Accepted | Isolated benchmark acquisition and owned Retrieval v3       |
| [ADR-015](decisions/ADR-015-default-oauth-hosted-search.md)           | Accepted | Existing OAuth enables governed hosted search by default    |

## Package-wide invariants

1. **PKG-I01:** Effect owns every application command and durable domain
   transition.
2. **PKG-I02:** Rust validates each reviewed-tool invocation against an exact action grant
   but does not confine that cooperative TCB tool's complete runtime authority;
   Rust never creates policy or domain state.
3. **PKG-I03:** Model, tool, UI, projection, telemetry, and supervisor output is evidence or
   proposal data; none can grant authority or complete work by assertion.
4. **PKG-I04:** On a qualified storage profile, every acknowledged command and binding gate
   decision survives the specified process-crash and hard-reset failure model.
5. **PKG-I05:** Within the qualified cooperative Phase 1 TCB, every physical provider request
   has a unique ledger record; unknown usage is explicit and is never converted
   into a zero-cost claim. Enforcement against a noncooperative tool requires
   separately qualified egress and credential confinement.
6. **PKG-I06:** Missing authentication, supervision, Git, process, race-resistant path,
   storage-synchronization, or required sandbox capability denies the dependent
   operation; no less-safe fallback is allowed.
7. **PKG-I07:** Atomic exactly-once behavior across SQLite and an external provider or tool
   is not claimed.
8. **PKG-I08:** Digest-bound events are published only after the referenced artifact is
   durable and readback-verified; missing or corrupt referenced artifacts fail
   closed and orphans cannot manufacture events.

## Binary package acceptance checks

- [x] **PKG-AC01:** ADR-001 through ADR-010 are reviewed and accepted or explicitly
      superseded.
- [x] **PKG-AC02:** AC-01 through AC-04 remain explicit and are not weakened by
      another ADR.
- [ ] **PKG-AC03:** Every state-changing path has one Effect command authority and one
      action-time authorization point.
- [ ] **PKG-AC04:** No Phase 1 text claims safe untrusted execution, Windows support, remote or
      multi-user operation, or a hard currency-spend limit.
- [ ] **PKG-AC05:** Reviewed-tool qualification tests undeclared environment, credential,
      inherited descriptor/handle, working-directory, filesystem, and network
      channels without describing grant validation as sandbox equivalence.
- [ ] **PKG-AC06:** Selected-platform tests prove root-anchored use-time containment under
      ancestor and symlink swaps for worktree creation, mutation, and cleanup.
- [ ] **PKG-AC07:** Exact SQLite/VFS/filesystem profiles pass process-crash and power-cut or
      equivalent hard-reset tests with required settings verified on every
      connection and provider-call ambiguity preserved.
- [ ] **PKG-AC08:** Crash injection at every artifact publication boundary proves events never
      expose missing artifacts and that unpublished artifacts reconcile as
      orphans.
- [x] **PKG-AC09:** Implementation proceeds under the accepted Phase 1 plan as
      superseded by ADR-011, with focused tests mapped to each implemented
      capability.

## Phase 1 non-goals

- Capability claims beyond the implemented and independently qualified vertical
  slice.
- Remote workers, high availability, multi-user or multi-tenant service.
- Dynamic in-process plugins or unqualified untrusted execution.
- PostgreSQL cutover, zero-downtime migration, or hard-money enforcement.
- Windows support, auto-update, publication, deployment, or production claims.
