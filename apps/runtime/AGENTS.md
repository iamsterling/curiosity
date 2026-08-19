# Repository Constitution

This private repository contains Curiosity search/retrieval architecture, the
bounded M1–M4 implementation, repository-only M5 and M6 profiles, and the exact
private M7 Darwin arm64 release profile. Production/public crawling, deployment,
package/public publication, signing, notarization, and other-platform release
remain NO-GO. ADR 0055 is the narrow authority for internal lexical
qualification-generation publication only.

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
- Keep unified retrieval/Ledger substrate decisions design-only until their
  explicit implementation and production gates pass. Canonical Ledger design
  remains owned in `apps/plugin/opencode2`.
- Use concise ADRs in `docs/decisions/` for consequential choices.
