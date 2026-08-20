# ADR 0030: Closed SDK v2 tool-policy companion

**Status:** Accepted 2026-08-20 as plugin-boundary documentation authority for
a replacement SDK-v2 candidate only

## Decision

The plugin qualification boundary adopts runtime ADR 0060. Phase A binds the
lock-resolved local OpenCode beta-17595 package and executable without executing
them. Phase C invokes only that absolute executable under the closed child
environment. The inherited `PATH` is used solely by a non-executing ambient
negative probe and never contributes bytes to the build-environment digest.

Approval commit `76677a35f56a7e65c5828bdde9b8436fd848eb67` remains immutable
historical evidence but is insufficient because its candidate coupled receipt
reproduction to ambient `PATH` selection. This decision does not edit or reuse
that approval and grants no load, approval, commit, release, or authority
transfer.

Current authority can exist only at
`apps/runtime/docs/approvals/legacy-memory-node-api-sdk-v2-r2.json` under the
approval-only topology in runtime ADR 0060. The r2 record binds the unchanged
historical approval's path and SHA-256 as superseded evidence. Presence of the
old approval alone, an uncommitted r2 file, a wrong parent, later r2 edits, or a
squashed add does not authorize Phase C.

The companion verifier imports the same canonical ordered 19-file review set as
candidate generation. The approval proposal binds one digest per path, and
Phase C verifies parent, approved, working-tree, and `HEAD` bytes before any
addon or OpenCode execution. Per-file omission and mutation self-tests are
mandatory for all 19 members.
