# ADR-010: Exact-revision qualification, updates, provenance, and licenses

**Status:** Accepted — 2026-08-24  
**Decision history:** Proposed 2026-08-24; accepted by the user 2026-08-24.  
**Authority:** Accepted architecture only; no dependency, release, publication,
or update authority. Implementation remains gated by the separately reviewed
[Phase 1 implementation plan](../PHASE-1-IMPLEMENTATION-PLAN.md).

## Context

Phase 1 places Effect dependencies, Vercel AI SDK adapters, Rust crates, Git,
external tools, and any sandbox backend inside consequential boundaries. Package
names, mutable versions, documentation, research popularity, or a passing local
test do not prove which source and artifact were executed or whether reuse is
licensed.

## Decision

Qualify exact source and artifact identities for every trusted core adapter,
provider adapter, Rust supervisor, reviewed external tool, and sandbox backend.
The qualification record includes source revision, lockfile resolution and
integrity where available, build environment, artifact digest, enabled features,
platform/capability scope, tests run, and known exclusions. A reviewed external
tool record also identifies its cooperative-TCB status, declared ambient-channel
profile, launch-hygiene tests, and any separate exact OS-confinement
qualification; exact revision alone does not imply confinement.

Maintain source-to-artifact provenance sufficient to answer which reviewed
source produced the running bytes. Generated, vendored, copied, fixture, and
third-party material remains identified with its applicable license and notice.
Research dossiers and source systems grant no license or design authority.
Unclear-license code, schemas, tests, protocols, or formats are not copied;
similar concepts require a clean-room project-owned expression and review.

Phase 1 has no auto-update. An update is an explicit authenticated command and a
separately reviewed change that re-runs exact-revision capability qualification,
preserves migration/rollback evidence, and does not widen platform or authority
scope by implication. Failed update or migration leaves the prior qualified
version available or stops fail closed; success is never inferred from download
or process exit alone.

Artifact signing, publication, deployment, notarization, and production release
remain separate decisions. A provenance record is evidence, not release or
security acceptance.

## Invariants

- **ADR-010-I01:** Mutable selectors never define the qualified runtime identity.
- **ADR-010-I02:** Dependency or tool updates cannot inherit an earlier
  qualification result.
- **ADR-010-I03:** License and provenance gaps block adoption of the affected
  bytes.
- **ADR-010-I04:** Generated reports and receipts cannot promote lifecycle status
  by presence.

## Binary acceptance checks

- [ ] **ADR-010-AC01:** Every enabled trusted adapter/tool maps to exact source and artifact
      identities plus a license record.
- [ ] **ADR-010-AC02:** A changed dependency, feature set, artifact digest, platform, or backend
      invalidates the relevant qualification until rerun.
- [ ] **ADR-010-AC03:** No auto-update path exists and update failure cannot silently continue on
      unqualified bytes.
- [ ] **ADR-010-AC04:** Unclear-license source material is absent from
      project-owned artifacts.

## Non-goals

Choosing dependencies, signing/notarization, public distribution, deployment,
production release, or asserting reproducible builds before they are proven.
