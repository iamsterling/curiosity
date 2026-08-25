# ADR-001: Effect authority with a narrow Rust supervisor

**Status:** Accepted — 2026-08-24  
**Decision history:** Proposed 2026-08-24; accepted by the user 2026-08-24.  
**Accepted input:** AC-01  
**Authority:** Accepted architecture only; no implementation or production
authority. Implementation remains gated by the separately reviewed
[Phase 1 implementation plan](../PHASE-1-IMPLEMENTATION-PLAN.md).

## Context

Phase 1 needs one owner for commands, attempts, policy, provider turns, gates,
accounting, and completion while also needing process-tree cancellation and
host-operation enforcement that cannot be represented by JavaScript promise
cancellation alone. Splitting workflow authority across Effect and Rust would
introduce two plausible state owners and a distributed reconciliation problem.

## Decision

Use one Effect.ts application-authority process. It solely owns:

- command admission and domain identity allocation;
- event, attempt, lease, fencing, policy, gate, usage, and completion state;
- provider/model-loop orchestration and retry decisions; and
- all writes to the Phase 1 database.

Require a Rust child supervisor from Phase 1 day one. Executable tools remain
disabled until its relevant capabilities qualify. Its only responsibilities are
capability probes, race-resistant root-anchored path enforcement, Git worktree
operations, supervised process spawn, bounded output streaming, descendant
termination verification, and invocation of a separately qualified sandbox
adapter.

Communication uses private parent-child, versioned framed IPC. Every execution
request includes `AttemptId`, `ActionId`, fencing generation, deadline, exact
resource handles, and an Effect-issued capability grant. Rust returns receipts;
it does not decide policy or domain completion.

Rust is assigned no domain database or provider API, user command port,
autonomous retry, or authority to allocate domain identities. These are TCB role
constraints, not a claim of OS isolation. If the supervisor or protocol handshake
is unavailable, Effect denies dependent actions. There is no fallback to
unsupervised Node execution.

For reviewed external tools, grant validation proves only that Rust launched the
declared executable, arguments, targets, deadline, and application-supplied
resources. Such tools are cooperative TCB components. A same-user child may
still possess ambient filesystem, network, or credential-file authority that a
Rust grant cannot remove, so Phase 1 does not describe this boundary as runtime
confinement or sandbox equivalence.

Every reviewed-tool launch uses an absolute qualified executable identity, a
neutral or exact root-anchored working directory, and an empty-by-default,
explicitly allowlisted environment. Rust removes proxy and home/config hints,
agent sockets, tokens, and other credentials unless the action explicitly
requires one; it closes inherited descriptors/handles except the exact standard
streams and supervisor channels required by the manifest. `PATH`, caller
working directory, parent environment, and inherited handles are never implicit
inputs. This is launch hygiene, not proof that a cooperative tool cannot reopen
same-user resources by absolute path.

An invocation is denied when its executable, inputs, ambient-channel profile, or
required launch primitive is undeclared, unsupported, or not qualified. If
policy requires actual denial of ambient filesystem, network, process, or
credential access, the invocation additionally requires separately qualified OS
confinement under ADR-006; it cannot rely on the Rust grant alone.

## Invariants

- **ADR-001-I01:** One Effect process is the only application and SQLite writer
  authority.
- **ADR-001-I02:** Every transport and internal reaction submits through the
  same Command Port.
- **ADR-001-I03:** Rust results are fenced evidence; stale or unmatched results cannot advance
  application state.
- **ADR-001-I04:** Reviewed external tools remain cooperative TCB components unless a separate,
  exact OS-confinement profile is qualified.
- **ADR-001-I05:** Authority/RPC loss triggers fail-stop descendant termination or explicit
  reconciliation before recovery; successful cancellation is not inferred.
- **ADR-001-I06:** Vercel AI SDK remains inside the Effect Provider Gateway
  defined by ADR-004.

## Consequences

The private protocol remains small and avoids a second workflow engine. The
Effect dependency graph is part of the trusted computing base. Rust process
separation improves lifecycle enforcement but is not, by itself, a malicious
code sandbox.

## Rejected alternatives

- **Rust authoritative daemon:** splits model-loop semantics and application
  state across two owners.
- **Broad Rust execution plane:** creates premature scheduling, lease, and
  reconciliation authority outside Effect.
- **Pure TypeScript initially:** cannot satisfy the mandatory supervised-process
  boundary and creates an unsafe migration gap.

## Binary acceptance checks

- [ ] **ADR-001-AC01:** A boundary test proves that only Effect can write domain
      state.
- [ ] **ADR-001-AC02:** Rust rejects missing, malformed, stale-fence, expired, or
      overbroad grants.
- [ ] **ADR-001-AC03:** Adversarial launch fixtures cannot inherit undeclared environment values,
      credentials, working directory, or descriptors/handles; filesystem and
      network probes confirm any residual same-user authority is reported as
      unconfined rather than blocked by the grant.
- [ ] **ADR-001-AC04:** An action requiring ambient-channel denial is rejected when its exact OS
      confinement profile is unavailable or unqualified.
- [ ] **ADR-001-AC05:** Supervisor loss cannot fall back to direct process or Git
      execution.
- [ ] **ADR-001-AC06:** Authority loss terminates or quarantines all supervised descendants before
      any attempt can be recovered.

## Non-goals

Remote workers, a network-listening Rust daemon, Rust-owned scheduling, and
claims that IPC or Rust alone constitutes a security sandbox.
