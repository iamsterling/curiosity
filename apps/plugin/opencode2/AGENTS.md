# Repository Constitution

This private repository contains `@iamsterling/opencode2-config`, a new OpenCode 2 plugin imported from OpenCode Loop under MIT.

ADR 0027 permits only a removable Node-API shim beneath plugin tests on pinned
Darwin arm64, Bun 1.3.14, and lock-resolved OpenCode beta-17595. It grants no
normal plugin composition, package surface, persistence, authority transfer,
M2/M6 change, release, or production use. Its sole composition exception is one
verifier-temp, empty-registration test plugin that loads and executes once; any
later composition authority is plugin-first and requires a new decision.

- Preserve source attribution and reproducible manifests in `provenance/`.
- Runtime identity is `iamsterling.opencode2-config`; state belongs under `.opencode/opencode2-config/`.
- Keep `/loop-*` command compatibility until an explicit redesign.
- Never commit credentials, runtime state, logs, generated caches, dependencies, or global user configuration.
- Do not publish to npm or cut over an installation from this repository without a separately reviewed change.
- Use concise ADRs in `docs/decisions/` for consequential choices. OpenSpec is not adopted.
- Before committing behavior changes, add a failing focused test; run `bun run verify` before handoff.
