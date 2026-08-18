# ADR 0031: M5 SearXNG gateway D6

**Status:** Accepted 2026-08-18 for repository implementation; production NO-GO

## Decision

M5 may add one runtime-owned, provider-neutral asynchronous repository-search
port and one adapter named `searxng-gateway`. The adapter may make exactly one
token-protected `POST` to the fixed
`https://search.formerhuman.com/agent-search` endpoint. The trusted bootstrap
supplies its audience-bound bearer token; requests, sessions, models, retrieved
content, environment endpoint overrides, and arbitrary URLs supply neither
credentials nor fetch authority.

The canonical request adds optional `source`. Omission means `local` and causes
no network. Only explicit `searxng-gateway` selection can use the configured
adapter. There is no fallback, retry, redirect, cache, logging, generic fetch,
or setup traffic. Provider output is normalized into bounded untrusted results,
deduplicated by canonical URL, labeled with bounded provenance, and accompanied
by bounded partial failures. Public diagnostics are stable, provider-neutral,
and redacted.

The dependency-free Bun/Node HTTPS transport resolves every address before the
request, rejects an empty, mixed-family, or partly non-global answer set, and
pins one validated address through custom `lookup` while retaining the fixed
hostname for Host, SNI, and certificate verification. It rejects redirects,
non-JSON or encoded responses, invalid UTF-8/JSON/result envelopes, and bodies
over 256,000 bytes. Calls have a 15-second absolute request deadline, one
attempt, no redirect, and a process-wide maximum of eight active provider calls.
Close aborts active calls and suppresses late publication.

## Repository GO / production NO-GO

The project owner, acting as architecture/security/legal/operations approval
roles, accepts this exact repository capability and deterministic verification.
This is **repository GO only**. Production remains **NO-GO** until a separate
review records a successful live gateway check, current provider and SearXNG
terms/rights, production token issuance/revocation/custody, retention/privacy,
cost/budget/rate-limit ownership, and operational monitoring/incident ownership.
The optional smoke test cannot satisfy those gates by itself.

No M4 jobs/events, M6 crawl or generic fetch, M7 packaging/deployment,
publication, or production cutover is authorized.

## Rollback

Remove explicit `repository` configuration (or explicit source selection) and
restart the consumer. Omitted source immediately returns to local/no-network
behavior without ABI removal or data mutation. The OpenCode plugin's existing
default SearXNG path is unchanged.
