# ADR-005: Capabilities, delegation ceilings, provenance, and sink gates

**Status:** Accepted — 2026-08-24  
**Decision history:** Proposed 2026-08-24; accepted by the user 2026-08-24.  
**Authority:** Accepted architecture only; no security-acceptance authority.
Implementation remains gated by the separately reviewed
[Phase 1 implementation plan](../PHASE-1-IMPLEMENTATION-PLAN.md).

## Context

Tool names and model assertions do not describe the actual nested files,
processes, destinations, secrets, or Git operations an action may reach.
Delegation and transformed untrusted content must not widen authority or erase
origin before an external side effect.

## Decision

Represent authority as typed resource/action grants. Effective authority is the
intersection of system policy, authenticated actor grant, session grant, parent
execution ceiling, target resource policy, tool manifest, immutable attempt
ceiling, current revocations, and provenance/sink restrictions. Absence is
denial. Child-execution grants inherit ceilings and cannot authorize wider path,
network, secret, provider, budget, process, Git, or gate authority. For a
reviewed external tool this is a cooperative TCB obligation, not technical
confinement of all ambient runtime effects.

Trusted ingress adapters assign provenance. Caller, model, tool, and remote
content cannot self-declare trusted origin. Derived content conservatively
carries transitive taints. Declassification is a dedicated authenticated command
with a durable event; transformation or model restatement is not
declassification. Provenance describes origin and custody, not truth.

Immediately before every consequential dispatch, Effect revalidates the exact
recursive targets and current revocations. Sinks include filesystem mutation,
process execution, network egress, secret use, provider invocation, worktree/Git
mutation, external publication, gate resolution, and binding completion.

For external execution, Effect binds the authorized `ActionId`, payload digest,
targets, deadline, attempt/fence, and least capability grant. Rust verifies that
the declared invocation conforms to that exact grant and rejects substitutions
or widened targets. For a reviewed external tool, this validates dispatch; it
does not remove undeclared same-user filesystem, network, credential, process,
environment, or inherited-descriptor authority. Rust never invents policy.

## Invariants

- **ADR-005-I01:** Labels, aliases, nested arguments, child delegation, and model text cannot
  bypass target-level authorization.
- **ADR-005-I02:** Revocation can narrow in-flight authority before dispatch; relaxation cannot
  widen an immutable attempt snapshot.
- **ADR-005-I03:** Tool, model, and remote output remains untrusted data.
- **ADR-005-I04:** A gate approval does not authorize a different digest, target,
  or revision.
- **ADR-005-I05:** A grant is application authority, not evidence of complete
  runtime confinement.

## Consequences

Reviewable authority and taint flow require canonical resource identities,
schema recursion, and action-time checks. This architecture does not claim that
taint tracking proves semantic safety or that process separation is a sandbox.

## Binary acceptance checks

- [ ] **ADR-005-AC01:** Nested-target and alias attempts are denied at the same
      sink gate.
- [ ] **ADR-005-AC02:** A child cannot exceed any parent authority ceiling.
- [ ] **ADR-005-AC03:** Relabeling or model restatement cannot clear taint.
- [ ] **ADR-005-AC04:** Rust rejects any payload/target/fence mismatch with the
      Effect grant.
- [ ] **ADR-005-AC05:** Tests attempting undeclared ambient channels either prove launch-time
      removal, record residual cooperative-TCB authority, or require qualified
      OS confinement; they never pass by treating the grant as a sandbox.

## Non-goals

Semantic truth detection, automatic trust elevation, data-loss-prevention
guarantees, and sandbox qualification.
