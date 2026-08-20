# Repository Constitution

This private repository contains Curiosity search/retrieval architecture, the
bounded M1–M4 implementation, repository-only M5 and M6 profiles, and the exact
private M7 Darwin arm64 release profile. Production/public crawling, deployment,
package/public publication, signing, notarization, and other-platform release
remain NO-GO. ADR 0055 is the narrow authority for internal lexical
qualification-generation publication only. ADR 0056 separately permits only a
removable, private, side-effect-free Rust legacy-parity implementation; plugin
Ledger v1 remains sole lifecycle authority, EventCapture remains observation-only,
and evidence metadata is authoritative only through Ledger. ADR 0057 permits
only a separate test-only Node-API qualification on pinned Darwin arm64, Bun
1.3.14, and lock-resolved OpenCode beta-17595. Its sole composition exception is
one verifier-temp, empty-registration test plugin that loads and executes once;
it grants no normal plugin composition, package surface, authority transfer,
M2/M6 change, release, or production use.
ADR 0058 narrowly supersedes ADR 0057's four-artifact/schema-sameness rule for a
fifth request-scoped control-flow observation artifact. It is isolated-Bun-only,
never an OpenCode/package/release input, and requires a new v2 candidate and
approval; the v1 approval remains immutable and insufficient.

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
