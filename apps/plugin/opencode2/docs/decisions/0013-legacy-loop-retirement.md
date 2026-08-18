# ADR 0013 — Imported loop runtime retirement

**Accepted, 2026-08-12; supersedes ADR 0010.** The imported runtime, mutable state codec/import path, daemon, scheduler, timer/heartbeat, shell/process/git/watch/checkpoint paths, local marker agent, and lifecycle tools were deleted from the product tree. Git history and provenance manifests retain attribution and characterization lineage.

The `/loop-*` names remain as markdown-only migration aliases. Status/pause/resume/stop/start names call native tools; progress/blocked/done names create Ledger proposals; compaction gives manual host guidance. Shell/watch/cadence/daemon/checkpoint/export/log/init/remove behaviors return `OPENCODE2_COMPAT_CAPABILITY_UNSUPPORTED`. They carry no state or scheduling semantics.
