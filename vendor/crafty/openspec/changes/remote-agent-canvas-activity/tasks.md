## 1. Milestone A: Contracts and Issue #1

- [x] 1.1 Define serializable agent operation phase, scope, activity and receipt types in the editor-facing shared contract.
- [x] 1.2 Define stable diagnostic codes for stale revisions, missing capabilities, expired previews, duplicate commits and activity limits.
- [x] 1.3 Add contract tests covering terminal states, idempotency keys and no durable serialization of activity.
- [ ] 1.4 Open Issue #1: "Agent operation/activity contract and receipt schema" with the capability scenarios as acceptance criteria.

## 2. Milestone B: Canvas Activity Projection and PR #1

- [x] 2.1 Add an ephemeral activity store/selector that tracks operation ID, phase, node IDs, preview bounds and terminal state without changing `EditorDocument`.
- [x] 2.2 Add browser-side resolution from activity state to bounded generic overlay descriptors using current node bounds and viewport transforms.
- [x] 2.3 Add canvas tests proving activity appears, clears on terminal events and is excluded from document serialization/history.
- [ ] 2.4 Open PR #1: "Render remote agent activity projection in the canvas" with contract and UI projection tests.

## 3. Milestone C: Renderer Effect and PR #2

- [ ] 3.1 Extend the host-composed overlay contract with a generic activity-ring descriptor containing geometry, color, phase, seed and intensity only.
- [ ] 3.2 Implement the animated activity effect in the Rust renderer using frame time or an equivalent renderer-owned animation input.
- [ ] 3.3 Bound activity overlays and preserve the last valid authored packet when the effect fails.
- [ ] 3.4 Add Rust/TypeScript packet and failure-policy tests for the activity overlay.
- [ ] 3.5 Open PR #2: "Add renderer-safe animated agent activity overlay" and record measurements before tuning shader budgets.

## 4. Milestone D: Command-Room Integration and Issue #2

- [ ] 4.1 Add operation lifecycle events to the per-file command room: started, preview-updated, committed, rolled-back, failed and expired.
- [ ] 4.2 Enforce base revision checks, transaction ownership, commit idempotency and bounded preview leases.
- [ ] 4.3 Fan out activity and committed document events to connected browser editors without serializing activity.
- [ ] 4.4 Add room tests for stale revisions, disconnect rollback, duplicate commits and renderer-independent document commits.
- [ ] 4.5 Open Issue #2: "Live agent operation events over the per-file room" with ADR 0017 as the dependency.

## 5. Milestone E: Remote MCP Gateway and PR #3

- [ ] 5.1 Identify and document the production admin/CMS Next.js gateway app and its authenticated file access boundary.
- [ ] 5.2 Implement read tools for document summary, selection, node scope, resolved layout and diagnostics.
- [ ] 5.3 Implement preview/commit/rollback tools as thin adapters over the command-room service.
- [ ] 5.4 Add structured receipts and MCP resources for receipts, diagnostics and activity status.
- [ ] 5.5 Add capability authorization, request correlation, cancellation and resource limits.
- [ ] 5.6 Add remote gateway integration tests proving the gateway cannot mutate serialized files or bypass kernel validation.
- [ ] 5.7 Open PR #3: "Expose authenticated remote MCP gateway from admin/CMS server".

## 6. Milestone F: Persistence and Verification Gate

- [ ] 6.1 Replace or bypass the lossy legacy Scene persistence path for agent commits with canonical document persistence.
- [ ] 6.2 Add headless render verification artifact and content hash to committed receipts.
- [ ] 6.3 Add end-to-end test: remote operation -> activity overlay -> kernel commit -> browser render -> receipt.
- [ ] 6.4 Open Issue #3: "Canonical document persistence required for remote agent writes" and block production write enablement until closed.
- [ ] 6.5 Open PR #4: "Enable production remote agent writes after persistence verification".

## 7. Milestone G: Hardening and Release

- [ ] 7.1 Add authorization, rate-limit, event-queue and overlay-count tests under realistic fixtures.
- [ ] 7.2 Add multi-agent contention tests and document the initial stale-revision policy.
- [ ] 7.3 Run typecheck, package tests, Rust tests, lint, format check and build where renderer/gateway files are touched.
- [ ] 7.4 Record the measured shader/render distribution and revise the activity budget from evidence.
- [ ] 7.5 Release behind a capability flag with remote writes disabled by default until operational validation is complete.

## Safe implementation boundary

This implementation adds the editor-local lifecycle adapter, bounded ephemeral
activity/receipt stores, stable diagnostics, revision checks, preview leases and
commit idempotency. It does not enable production remote writes. The remaining
command-room, authenticated gateway, persistence, renderer, multiplayer and
issue/PR tasks require boundaries that are intentionally absent or explicitly
out of scope for this slice; they remain unchecked until those dependencies are
available.
