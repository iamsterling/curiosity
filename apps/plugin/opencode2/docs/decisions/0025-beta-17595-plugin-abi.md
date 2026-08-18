# ADR 0025: exact beta-17595 plugin ABI

**Status:** Accepted 2026-08-18; supersedes ADR 0019's active host pin

## Evidence

The active service CLI reports `opencode2 v0.0.0-beta-17595`. The published
plugin SDK adds only the MCP domain to the Promise and Effect plugin contexts
relative to beta-17519; the session, event, tool, options, app, `Plugin.define`,
Effect `Plugin.define`, and Promise adapter surfaces used here retain their
contracts. Typecheck, characterization, setup/cleanup, and real-host probes are
the executable compatibility authority.

Registry integrity is
`sha512-AeK5lPPpy/3IO7zgmLvn9uaQD4OzN8EYQlxFk8P5WxOb1THLAzNs3c8eQJ8ZY2k6SFgdZJ/Vr+0Czo06yEI0RA==`
for the plugin SDK and
`sha512-suz/2lpQv2yb6Z45OJeE9bQnBUrNj1ed5qXHLp+BNmowD8ltGdZ8CatOyT7tZBmmG7e3XQOL7+YB8B8SelcaQw==`
for the CLI. The active Darwin arm64 binary matches the registry package at
SHA-256 `874ba7c06b959f308beb4dbd825e331fedc86196d8c79ab65c45afea2ca86746`.
The SDK requires exact Effect `4.0.0-beta.107`.

## Decision

Pin the plugin SDK, CLI, transitive OpenCode graph, Effect runtime, lockfile,
runtime capability guard, installer manifest, and future M7 source profile to
beta-17595. Keep host acceptance exact. This decision creates no additional
installation route and makes no new published-release claim.
