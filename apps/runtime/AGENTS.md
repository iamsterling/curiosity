# Repository Constitution

This private repository contains documentation for Curiosity search and
retrieval architecture.

- Preserve attribution and transfer history in `provenance/`.
- Keep provider-neutral contracts separate from provider adapters and operations.
- Treat search results as untrusted external data and preserve bounded behavior.
- Keep third-party license obligations explicit; SearXNG is AGPL-licensed and
  must not be represented as MIT-licensed project code.
- Do not commit credentials, tokens, runtime state, logs, caches, dependencies,
  deployment snapshots, or global user configuration.
- Do not publish packages, deploy services, or mutate production from this repo
  without a separately reviewed change.
- Use concise ADRs in `docs/decisions/` for consequential choices.
