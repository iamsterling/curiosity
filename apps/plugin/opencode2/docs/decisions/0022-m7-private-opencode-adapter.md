# ADR 0022: M7 private OpenCode adapter

**Status:** Superseded for future builds by ADR 0025 and runtime ADR 0042; the recorded beta-17519 artifact remains historical

## Decision

Bundle and launch the standalone foreground OpenCode host exactly at
`0.0.0-beta-17519`; the separately installed beta-17595 or any other `opencode`
binary is not release input. The isolated configuration loads exactly one
`iamsterling.opencode2-config` path and selects the in-process query-only
runtime. Setup and cleanup are exercised without model credentials. The
adapter imports no runtime admin or owned-query entrypoint and enables neither
the M5 live gateway nor M6 crawl.

Deployment supplies `queryCapabilityFile`, never credential bytes in JSON. It
must be an absolute canonical external regular file with no symlink component,
owned by the current user, mode 0600, safe root/current-user-owned non-writable
parents, and a size of 1–256 bytes. Setup opens it with `O_NOFOLLOW`, verifies
identity again, reads once, and copies the bytes. All failures collapse to
`WEB_SEARCH_RUNTIME_CONFIG_INVALID`; credential bytes and paths are absent from
JSON output, receipts, logs, provenance, and diagnostics. In-memory
`queryCapability` remains an explicit development/test embedding seam and may
not be combined with the deployment file.

The release loader uses only the canonical `CURIOSITY_RUNTIME_RELEASE_ROOT` and
the release's `runtime/query.js`. Duplicate/uncontrolled plugin inventories
fail closed. Global/shared OpenCode configuration and services are untouched.

## Limits

One user, machine, workspace, foreground process, exact Darwin arm64 profile,
and private unpublished artifact only. No publisher identity, signature,
notarization, production/public, M5-live, M6-crawl, or other-platform claim.
