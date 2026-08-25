# Q1-R3 boundary and acceptance checks

1. Pinned Effect and build/test identities, source trees, artifacts, and public
   runtime probes pass with zero skips.
2. License, no-update/no-install, and every-leaf invalidation checks pass.
3. Canonical-root `inventory:check`, `status:check`, `check-types`, `lint`,
   `test`, `build`, and `verify` pass in that order from clean generated-output
   surfaces.
4. Pre-existing generated outputs and the tracked diff are restored exactly;
   persistent writes outside this R3 directory are absent.
5. Any prerequisite, process, receipt, or restoration failure stops fail
   closed. Completion is evidence only and cannot self-accept Q1 or authorize
   I1.
