# Mandatory native-loop real-host probes

**Proposed pending policy acceptance; Darwin-only.** `bun run test:real-host` runs the exact pinned copied
artifact under an inherited `sandbox-exec` profile in one canonical disposable
root. The profile denies non-loopback egress, outside-root writes, and
`process-fork`; the child receives only the documented credential-free
environment and controller-owned stdio.

The authenticated activation stimulus is
`GET /api/plugin?location[directory]=<disposable-project>`. The loopback proxy
records environment-respecting requests without retaining headers or bodies and
rejects every request. A passing report states the observed count (which may be
zero), requires every observed attempt to be a rejected catalog-metadata
`CONNECT` to exactly `models.opencode.ai:443`, and requires zero
provider/inference, unknown-authority, other-method, or successful-external-egress
events. This classification is not permission to reach the catalog. The report
does not claim zero network attempts or visibility into denied direct attempts.
After process exit, a race-fail-closed byte scan covers captured output and every
retained regular file. Symlinks,
unreadable files, and scan races fail acceptance. Fixture qualification proves
the network, proxy, outside-write (direct and symlink), secret, and fork clauses
discriminate. `OPENCODE_DISABLE_MODELS_FETCH=1` remains set, but zero attempts in
the exact-host run and two in prior isolated probes show that count is not a
safety invariant. There is no invented numeric ceiling: the suite deadline and
fail-closed recorder-capacity handling reject nontermination or truncated
evidence. Authority/method drift, a pin/source-map change, or resolved upstream
behavior triggers review rather than broadening the classification.
The canonical report in `src/platform/real-host/index.ts` continues to disable
reload, interrupt, compaction, child lineage, concurrent setup, and authoritative
persistence until separately proven.
