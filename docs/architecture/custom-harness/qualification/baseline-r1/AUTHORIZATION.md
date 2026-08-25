# OpenCode baseline R1 authorization

- **Decision:** requalify the committed OpenCode `0.0.0-beta-18138` / Effect
  `4.0.0-rc.111` ABI rather than demote or revert it.
- **Authority:** explicit user selection of `Requalify new ABI (Recommended)` in
  session `ses_fc920d172ffebSgN1POjmxKfbX` on 2026-08-25.
- **Purpose:** repair the repository verification and lifecycle baseline that
  commit `348e53ef7c29d384852bf58abf0bd3ef0218ff46` changed without updating the
  verification inventory, status catalog, or ABI decision.
- **Permitted product changes:** none beyond documentation, catalog, tests, and
  the already-present `apps/plugin/opencode2/turbo.json` task-graph fix.
- **Dependency materialization:** the existing lockfile may be materialized
  with lifecycle scripts disabled and must remain byte-identical.
- **Exclusions:** no active service probe, provider call, publication,
  deployment, custom-harness implementation, I1 work, or elevation of the
  beta-17595-only Node-API qualification receipts.

Acceptance requires exact identity agreement, focused ABI/build/test evidence,
an explicit superseding ADR, honest catalog/status reconciliation, and passing
canonical repository checks. Failure stops without claiming qualification.
