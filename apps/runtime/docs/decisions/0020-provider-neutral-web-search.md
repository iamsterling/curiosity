# ADR 0020: provider-neutral bounded web search

**Status:** Accepted for repository implementation 2026-08-17; production deployment pending

## Context

The first search implementation exposed a provider/hostname-branded tool and an
unauthenticated SearXNG JSON route. Search text is external, untrusted data, and
the upstream deployment and credentials are operational concerns rather than a
stable OpenCode ABI. The active host already reserves `websearch`; no active
tool named `web_search` was observed. The shipped `formerhuman_search` name is a
compatibility obligation.

## Decision

Expose `web_search` as the neutral contract and keep `formerhuman_search` as a
deprecated alias with identical execution. The public inventory is 20 tools:
the prior 18 Ledger/Loop tools plus these two names. Only `researcher` is
expected and explicitly allowed to search; every other bundled agent is denied.
Curiosity remains one bounded, in-frame, authority-neutral pass.

Keep validation and result normalization in the search core and isolate SearXNG
wire behavior in its adapter. The adapter accepts a token from
`OPENCODE2_SEARCH_TOKEN` and an optional endpoint only when it equals
`https://search.formerhuman.com/agent-search`. It performs no setup-time network
call. The gateway contract is authenticated JSON POST `{ query, maxResults }`;
responses are bounded JSON with `results` and optional
`unresponsive_engines`. Redirects, malformed media, invalid URLs, oversized
bodies, timeouts, and status classes fail with stable redacted diagnostics.

Production should preserve the human UI separately, place SearXNG's limiter on
private Valkey, trust only the Dokploy/Traefik proxy path, keep Valkey
unpublished, avoid broad CORS and query/token logs, and pin reviewed container
digests with rollback metadata. No upstream SearXNG source modification is
required; deployments must retain SearXNG's AGPL source-offer obligations.

## Consequences

The branded alias remains visible until a separately reviewed ABI removal.
Operators must provision the token out of band. Deterministic tests never call
production; `bun run search:smoke` is an opt-in post-deployment check. Dokploy
mutation is forbidden until project identity, immutable before-state, image
digests, and rollback target are captured through authenticated access.
