# Native release-candidate acceptance

**Accepted criteria (2026-08-12).** Each check is binary and requires quoted command or review evidence.

1. Replay of strict v1 Ledger events deterministically rebuilds every canonical entity and the same digest; unknown/malformed nested fields return stable code and path.
2. Dependency cycles, blockers, mutation-footprint conflicts, scenario loss/weakening, stale claims/evidence/approval, capture gaps, and fabricated authority prevent the corresponding transition.
3. Exactly one of two real processes can claim or archive a revision; stale fence epochs cannot commit or release another writer's fence.
4. Archive fault injection at every write/validate/commit boundary recovers to either the prior canonical truth or one valid archived truth, never a partial commit.
5. Loop continuation occurs at most once and only after a terminal root event, positive descendant/tool terminality, valid claim/fence, no capture gap/interruption, compaction continuity, and accepted Ledger cursor advance or an explicit retry policy.
6. Unproved child, tool, compaction, prompt outcome, or restart state becomes `ambiguous`/unsupported with a stable diagnostic and does not dispatch.
7. Only correlated, unreplayed, current-revision direct `user` input in the root session can provide bounded approval; copied, synthetic, child, tool/file, stale, or wrong-session text cannot.
8. Hook capture handles durable sequence duplicate/reorder/collision/gap and missing tool halves; context is bounded, root/session scoped, taint-labelled, and excludes raw tool/source output and worker rationale from reviewer projections.
9. Every `/loop-*` compatibility name has one manifest disposition: native tool mapping, Ledger proposal mapping, stable unsupported diagnostic, or manual compaction guidance.
10. Product/source/release assets contain no imported runtime, daemon, timer, polling, process/shell/git/watch lifecycle implementation or old-state migration.
11. Source prompt/resource bytes are lower than the preserved `74fe8c5` baseline, and parity tests prove moved safety rules remain mechanically enforced.
12. Isolated real-host probes, fault/race tests, staged install/update/rollback, clean full-history clone build, artifact/provenance/secret scans, and remote CI pass; final architecture/security review reports no Critical/Major finding.

**Non-goals:** global installation/cutover, emulating missing host history/list/identity capabilities, or restoring any imported lifecycle authority.
