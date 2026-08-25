# OpenCode baseline R1 acceptance checks

1. Package manifests, both lockfiles, installed SDK/CLI/Effect packages, and
   the fail-closed real-host pin agree exactly.
2. ABI guard, build, type contracts, setup/cleanup, capability-report,
   unit/integration/characterization/security, and package-contract tests pass.
3. A superseding ADR bounds beta-18138 qualification and keeps earlier
   beta-17595 Node-API evidence historical only.
4. Verification and status catalogs contain no stale current beta-17595 claim
   and pass their focused checks.
5. Canonical root checks pass with generated outputs restored after evidence
   capture. No publication, deployment, provider, or active-service operation
   occurs.
