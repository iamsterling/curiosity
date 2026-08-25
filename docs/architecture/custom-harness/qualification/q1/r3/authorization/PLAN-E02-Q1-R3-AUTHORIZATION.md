# Q1-R3 execution authorization

- **Authorization observed:** 2026-08-24, before Q1-R3 execution.
- **Authority:** the user selected `Authorize Q1-R3 (Recommended)` in session
  `ses_fc920d172ffebSgN1POjmxKfbX`.
- **Governing plan SHA-256:**
  `ab0b90385c7d1e4247191313488428ceb941f5734ed35d12254dfef901980ff7`.
- **Authorized input:** preserve and evaluate the pre-existing
  `apps/plugin/opencode2/turbo.json` change that makes the package's `test`
  task depend on its own `build` task.
- **Persistent-write boundary:** new files only below
  `docs/architecture/custom-harness/qualification/q1/r3/`. Canonical root
  checks may create generated outputs only while the controller retains and
  restores the complete pre-run generated-output inventory.
- **Checks:** exact Effect/build identity, public Effect composition/runtime,
  source/artifact/license provenance, invalidation, no-update/no-install
  controls, clean-output task behavior, and mandatory canonical-root checks.
- **Exclusions:** no provider or AI calls, no product implementation, no
  dependency adoption, no I1, and no qualification of SQLite, Git behavior,
  supervision, sandboxing, or deployment.
- **Acceptance:** report `Q1_R3_EVIDENCE_COMPLETE` only when every named check
  and boundary check passes; otherwise report `STOPPED_FAIL_CLOSED`.

The existing OpenCode plugin uses a different Effect release. Q1-R3 therefore
qualifies the isolated `effect@4.0.0-beta.107` candidate from exact pinned
metadata and artifacts and records, but does not alter or mischaracterize, the
workspace lock resolution. Adoption remains a separate I1 decision.
