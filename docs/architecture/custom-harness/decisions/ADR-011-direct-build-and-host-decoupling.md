# ADR-011: Direct harness build and replaceable host adapters

**Status:** Accepted — 2026-08-25  
**Decision history:** Directed by the user after the 21-harness research and the
Q1 OpenCode baseline failure.  
**Supersedes:** the tranche-entry sequencing and implementation prohibition in
the Phase 1 implementation plan; it does not weaken ADR-001 through ADR-010 or
authorize release, deployment, production, or a security claim.

## Context

Q1 canonical-root verification coupled custom-harness implementation to stale
OpenCode plugin catalogs and a changing OpenCode beta ABI. That work qualified a
host adapter rather than reducing uncertainty in Curiosity's own authority
kernel. The completed synthesis also found no whole harness that can sit beneath
Effect without retaining competing loop, retry, persistence, tool, approval,
provider, or completion authority.

The development installation at
`~/.config/opencode/plugins/opencode2-config` was a symlink into the source tree.
That made host loading depend on mutable workspace files and blurred the product
boundary.

## Decision

Build Curiosity directly in `apps/custom-harness/` from the accepted ADRs and the
bounded pattern dispositions in `research/harnesses/SYNTHESIS.md`.

OpenCode is a replaceable host adapter. Its beta ABI is relevant only when that
adapter is built or used; it is not an entry gate for the Curiosity kernel. A
development installation uses copied, built bytes with locally resolved exact
runtime dependencies. The source workspace and installed plugin directory must
not be connected by a symlink.

Implementation may proceed continuously toward the product objective. Capability
claims remain fail closed: a feature is enabled only when its own focused checks
pass, and unresolved provider, sandbox, process, filesystem, Git, device, or
durability behavior remains `UNKNOWN` or unavailable. Existing qualification
records remain historical evidence; they are not silently rewritten as passes.

The first integrated milestone is one authenticated command entering one Effect
authority, resolving through one statically registered stock plugin, committing
durable canonical events, and producing a read-only projection. OpenCode cannot
be that command authority.

## Invariants

- **ADR-011-I01:** Curiosity has no runtime dependency on the OpenCode host or
  plugin ABI.
- **ADR-011-I02:** host adapters consume copied build output; no development
  installation symlinks to Curiosity source.
- **ADR-011-I03:** all variable behavior is statically registered or runs behind
  a versioned external process boundary; plugins never receive the domain writer.
- **ADR-011-I04:** removing a host adapter cannot remove or corrupt canonical
  Curiosity state.
- **ADR-011-I05:** implementation progress does not imply qualification,
  production readiness, or security acceptance.

## Consequences

The kernel can evolve without waiting on an unrelated beta host. Root inventory
and status catalogs must describe the host adapter and custom harness separately.
The copied host build must be refreshed explicitly after adapter changes.

## Binary acceptance checks

- [x] **ADR-011-AC01:** the 21-harness synthesis selects direct build and records
      the strongest substrate challenge.
- [x] **ADR-011-AC02:** the OpenCode development target is a real directory and
      its entry digest matches the workspace build.
- [x] **ADR-011-AC03:** the first integrated milestone passes focused tests.
- [x] **ADR-011-AC04:** repository inventory and status describe the independent
      custom-harness workspace without making a release claim.

## Non-goals

Publishing the OpenCode plugin, weakening its own repository constitution,
claiming hard-reset durability from ordinary tests, or enabling provider, tool,
Git, sandbox, web mutation, companion, or production surfaces by implication.
