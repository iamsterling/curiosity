# ADR-006: Extension trust classes, sandbox readiness, and supported platforms

**Status:** Accepted — 2026-08-24  
**Decision history:** Proposed 2026-08-24; accepted by the user 2026-08-24.  
**Accepted inputs:** AC-02, AC-04  
**Authority:** Accepted architecture only; no sandbox, platform, or extension
security acceptance. Implementation remains gated by the separately reviewed
[Phase 1 implementation plan](../PHASE-1-IMPLEMENTATION-PLAN.md).

## Context

Trusted-local operation does not make arbitrary extensions trustworthy. A child
process is a lifecycle boundary, not a malicious-code isolation guarantee.
Process, path, and sandbox behavior also varies by operating system and backend,
so unsupported capability must not silently degrade.

## Decision

Define three extension classes:

1. **Trusted core adapters:** compiled or statically configured at exact reviewed
   revisions; part of the authority-process trusted computing base.
2. **Reviewed external tools:** separate Rust-supervised processes with reviewed
   executable identity, manifest, versioned schemas, capability declaration, and
   no application API for database or authority-process memory access. They are
   cooperative TCB components, not adversarially confined programs.
3. **Untrusted extensions:** never loaded into the authority process and never
   executed unless an exact sandbox backend/platform revision is separately
   qualified and reports ready.

Phase 1 permits the first two classes only. If a request requires untrusted
execution and no qualified sandbox is ready, admission is denied. There is no
general dynamic in-process plugin loader.

Reviewed-tool launches use the minimal environment, credentials,
descriptors/handles, and working directory defined in ADR-001. Rust grant checks
validate the exact declared invocation but cannot remove all ambient authority
available to a same-user process. In particular, absolute-path filesystem and
network access, credential files, and further process creation remain residual
authority unless separately confined. A review or negative qualification test
that finds undeclared behavior makes that tool/invocation ineligible; an
operation whose policy requires technical denial of a residual channel requires
qualified OS confinement and is otherwise denied.

Maintain an explicit selected-platform manifest keyed by OS, architecture,
supervisor build, and required capability. Qualification is capability-specific
and includes root-anchored path primitives, reviewed-tool launch hygiene,
process-tree termination, Git operations, and any sandbox backend. **Windows is
unsupported in Phase 1.** An unlisted platform or failed/missing process, path,
Git, launch-hygiene, or sandbox probe makes that capability unavailable; the
caller cannot opt into a weaker fallback.

A sandbox becomes eligible only under a later acceptance record for the exact
backend and revision, with network/filesystem/process/credential denial,
descendant cancellation, escape-oriented negative controls, and fail-closed
readiness. No generic “sandboxed” claim is inferred from product documentation.

## Invariants

- **ADR-006-I01:** Untrusted bytes never execute merely because they are out of
  process.
- **ADR-006-I02:** Reviewed external tools receive only explicit application-supplied resources
  through Rust, while their documented same-user ambient authority remains a
  cooperative-TCB limitation.
- **ADR-006-I03:** Platform support is an allowlist of qualified capabilities, not a best-effort
  operating-system check.
- **ADR-006-I04:** Unsupported and unavailable are denials, not degraded
  execution modes.

## Binary acceptance checks

- [ ] **ADR-006-AC01:** Dynamic in-process extension loading is absent.
- [ ] **ADR-006-AC02:** Untrusted execution without an exact qualified sandbox is
      rejected.
- [ ] **ADR-006-AC03:** Adversarial reviewed-tool fixtures probe undeclared environment,
      credentials, inherited descriptors/handles, caller working directory,
      same-user filesystem, network, and child-process channels; leaks in a
      channel promised absent fail qualification, and residual authority is
      never reported as sandboxed.
- [ ] **ADR-006-AC04:** An invocation requiring stronger isolation is rejected unless its exact
      qualified OS confinement profile is ready.
- [ ] **ADR-006-AC05:** Windows and every unlisted platform fail closed.
- [ ] **ADR-006-AC06:** Removing any required capability probe prevents the dependent action and
      cannot activate an unsupervised fallback.

## Non-goals

Sandbox implementation, malicious-code safety claims, extension marketplace,
Windows support, and broad cross-platform qualification.
