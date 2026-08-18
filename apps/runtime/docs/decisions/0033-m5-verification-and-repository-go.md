# ADR 0033: M5 verification and repository GO

**Status:** Accepted 2026-08-18 for repository GO; production NO-GO

## Decision

The project owner accepts M5 at the exact source snapshot below under ADRs 0031
and 0032. This is a **repository GO** for the named `searxng-gateway` adapter
only. Production is **NO-GO** pending the live gateway, terms/rights, production
token custody/revocation, retention/privacy, cost/budget, rate-limit, monitoring,
and incident-ownership reviews listed in ADR 0031. No M4, M6, M7, crawl, generic
fetch, packaging, publication, deployment, or production cutover is authorized.

The sorted source-manifest SHA-256 is:

`0b81a8da27a14677a0196e6cd3f38303ed75e6b8be43606d6e77bb4a4f6a01ba`

Reproduce it from the workspace root (ADR 0033 is excluded to avoid a
self-referential digest):

```sh
manifest="$(mktemp)"; trap 'rm -f "$manifest"' EXIT
while IFS= read -r file; do shasum -a 256 "$file"; done >"$manifest" <<'PATHS'
apps/opencode2-config/src/features/search/runtime-adapter.ts
apps/opencode2-config/src/features/search/searxng-adapter.ts
apps/opencode2-config/tests/unit/web-search.test.mjs
apps/runtime/docs/decisions/0031-m5-searxng-gateway-d6.md
apps/runtime/docs/decisions/0032-m5-no-new-dependency-d8.md
apps/runtime/package.json
apps/runtime/src/index.ts
apps/runtime/src/query.d.ts
apps/runtime/src/query.ts
apps/runtime/src/repository-search.ts
apps/runtime/tests/boundaries.test.ts
apps/runtime/tests/characterization/bun-https-lookup.test.ts
apps/runtime/tests/corpus.test.ts
apps/runtime/tests/query-boundary.test.ts
apps/runtime/tests/repository-search.test.ts
apps/runtime/tests/runtime.test.ts
apps/runtime/tools/repository-live-smoke.ts
bun.lock
PATHS
cat "$manifest"
shasum -a 256 "$manifest" | awk '{print $1}'
```

## Verification evidence

- Runtime `bun run verify`: exit 0; 10 Rust tests, 50 Bun runtime tests with
  350 expectations, TypeScript, formatting, Clippy, locked build, and the Bun
  1.3.14 local TLS characterization (1 test/4 expectations).
- Runtime network-denied suite: exit 0; the same 50 deterministic tests and 350
  expectations under Darwin `sandbox-exec ... (deny network*)`.
- Plugin `bun run verify`: exit 0; ABI/types/lint/format/build; 121 unit, 22
  integration, 14 characterization, 19 security, and 9 release tests; artifact,
  provenance, resource, secret, and isolated pinned-real-host checks.
- Focused plugin network-denied suite: exit 0; 20 search/security tests. The
  separate real-host suite exited 0 with one setup/cleanup, both stable search
  names, zero successful external egress, no inherited provider credentials,
  and no surviving process.
- Root lint, type, and build checks and `git diff --check` are required before
  handoff. No credentialed live smoke is part of verification.

## Coverage and residuals

Deterministic tests cover global/special/mixed DNS answers, address pinning,
fixed POST shape, response/status/media/encoding/size/malformed bounds,
normalization/deduplication/provenance/bounded partial failures, raw and
normalized credential non-reflection, no retry/fallback,
validation before transport, process-wide concurrency, absolute deadline,
close suppression, default offline behavior, and async M3 consumption. The local
TLS characterization proves Bun 1.3.14 honors the custom lookup pin for a local
TLS server while standard hostname verification accepts the configured hostname
and rejects another hostname.

No live credential was available or required for repository GO. Consequently no
claim is made about current production gateway availability, terms, retention,
cost, token operations, provider SLA, multi-platform behavior, proxy topology,
or production monitoring.

## Rollback

Remove explicit repository configuration/source selection and restart the
consumer. Omitted source returns to local/no-network behavior. For OpenCode,
remove the explicit runtime backend to return to its unchanged default SearXNG
adapter. Rollback removes no tool name, mutates no corpus, and performs no
network request.
