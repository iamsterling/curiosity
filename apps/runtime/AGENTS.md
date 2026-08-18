# Repository Constitution

This private repository contains Curiosity search/retrieval architecture and
the bounded M1–M4, repository-only M5, and exact repository-only M6 synthetic
cell implementations. Production/public crawling remains NO-GO.

- Preserve attribution and transfer history in `provenance/`.
- Keep provider-neutral contracts separate from provider adapters and operations.
- Treat search results as untrusted external data and preserve bounded behavior.
- Keep third-party license obligations explicit; SearXNG is AGPL-licensed and
  must not be represented as MIT-licensed project code.
- Do not commit credentials, tokens, runtime state, logs, caches, dependencies,
  deployment snapshots, or global user configuration.
- Do not publish packages, deploy services, or mutate production from this repo
  without a separately reviewed change.
- Keep runtime implementation in `apps/runtime`; harness adapters and harness
  lifecycle remain owned elsewhere.
- Use concise ADRs in `docs/decisions/` for consequential choices.
