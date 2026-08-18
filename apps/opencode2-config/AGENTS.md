# Repository Constitution

This private repository contains `@iamsterling/opencode2-config`, a new OpenCode 2 plugin imported from OpenCode Loop under MIT.

- Preserve source attribution and reproducible manifests in `provenance/`.
- Runtime identity is `iamsterling.opencode2-config`; state belongs under `.opencode/opencode2-config/`.
- Keep `/loop-*` command compatibility until an explicit redesign.
- Never commit credentials, runtime state, logs, generated caches, dependencies, or global user configuration.
- Do not publish to npm or cut over an installation from this repository without a separately reviewed change.
- Use concise ADRs in `docs/decisions/` for consequential choices. OpenSpec is not adopted.
- Before committing behavior changes, add a failing focused test; run `bun run verify` before handoff.
