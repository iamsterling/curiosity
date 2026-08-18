# Corrective daemon identity evidence

This focused correction removes active legacy daemon and installer identity while
retaining the `/loop-*` command names, `[opencode-loop:<command>]` marker, and
`opencode-loop-local` acknowledgement agent as explicitly compatible command
protocol surfaces.

## Red-first record

`corrective-identity-red.txt` is the exact raw output from running
`node --test scripts/identity-test.mjs` immediately after adding the focused
test and before the identity correction. All four checks failed: package bins,
daemon environment/help/defaults/diagnostics, installer path/help, and mutable
CI action tags.

The original normalization did not have a red phase. It cannot be claimed
retroactively; this correction supplies its own prospective red-first record.

## Green record

`corrective-identity-green.txt` is the exact raw output of the same focused test
after the correction. It records all four checks passing.

## Identity mapping

| Legacy active identity | Corrected identity |
| --- | --- |
| `opencode-loop` installer bin | `opencode2-config` |
| `opencode-loopd` daemon bin and diagnostic prefix | `opencode2-configd` |
| `OpenCodeLoop` task default | `OpenCode2Config` |
| `OPENCODE_LOOPD_FAILED_RUN_RETRY_MS` | `OPENCODE2_CONFIGD_FAILED_RUN_RETRY_MS` |
| `OPENCODE2_CONFIG_TASK_DIR` | `OPENCODE2_CONFIGD_TASK_DIR` |
| `plugins/opencode-loop.ts` | `plugins/opencode2-config.ts` |

`OPENCODE_BIN` and `SCHTASKS_BIN` remain generic executable overrides; the
documented daemon-specific environment variables are the two
`OPENCODE2_CONFIGD_*` variables above. There is no legacy environment fallback.

## Legacy-identity allowlist

`corrective-old-identity-allowlist.txt` is the exact current-tree search output
with `provenance/` excluded. Its remaining matches are limited to command-marker
and acknowledgement-agent compatibility templates/tests, explicit future old
state migration documentation, upstream provenance attribution, and the focused
negative identity assertions that prevent regression. No active package bin,
daemon API/environment/help/default/logging path, installer plugin path, or
current example retains the legacy daemon identity.

## CI action resolution

`corrective-action-sha-resolution.txt` records the authoritative upstream
`git ls-remote` output used for the pins. The resulting mapping is:

| Release tag | Immutable commit SHA |
| --- | --- |
| `actions/checkout@v6` | `d23441a48e516b6c34aea4fa41551a30e30af803` |
| `oven-sh/setup-bun@v2` | `0c5077e51419868618aeaa5fe8019c62421857d6` |
