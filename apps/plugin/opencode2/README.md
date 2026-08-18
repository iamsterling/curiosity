# OpenCode2 Config

Private OpenCode 2 Effect plugin (with a Promise compatibility setup seam) pinned
to `@opencode-ai/plugin@0.0.0-beta-17595`.

## Web search

The plugin registers provider-neutral `web_search`; `formerhuman_search` remains
only as a deprecated compatibility alias for the already-shipped name. The
researcher agent alone receives an allow rule; other bundled agents receive an
explicit deny. Operators may override this policy in agent-specific V2
permissions.

Requests use a token-protected `POST https://search.formerhuman.com/agent-search`
gateway. Set `OPENCODE2_SEARCH_TOKEN` outside the repository. The optional
`OPENCODE2_SEARCH_ENDPOINT` is accepted only when it is exactly that approved
HTTPS route. Setup is offline. Query input, redirects, media type, response
bytes, URLs, duplicates, result count, timeout, and upstream failures are
bounded; returned text is explicitly marked as untrusted evidence candidates.
The human SearXNG UI and `/healthz` are separate from the agent ABI.

SearXNG remains the default. An operator-controlled typed deployment wrapper may
explicitly select `search.backend: "runtime"` only when it also supplies the
query capability, external state root, canonical workspace scope, and exact
controlled plugin inventory. That local path has no fallback or network egress,
checks trusted researcher identity again at execution, and imports only
`@curiosity/runtime/query`. Its synchronous FFI call is internally
deadline-bounded, not natively preemptible. Name uniqueness is deployment
attestation against the pinned host, not a host-global guarantee.

## OpenCode configuration

Add only the plugin. Its V2 agent transform installs the bundled agent suite
and selects `orchestrator` as the default primary agent; no separate
`default_agent` or `agents` configuration is required. Agent models inherit the
active session model.

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["@iamsterling/opencode2-config"],
}
```

## Product architecture

- **Accepted durability architecture:** [ADR 0024](docs/decisions/0024-durable-ledger-v2-and-capture-authority.md)
  is the canonical Ledger v2/capture-authority design. Its acceptance is design
  approval only: implementation and production authority/persistence remain
  blocked on its gates, and it introduces no OpenSpec assets.
- **Ledger Authority v1:** immutable event authority for intent, capability/delta framing, criteria, work, claims, typed evidence, approvals, reconciliation, archive lineage, facts, audit and capture gaps.
- **Native Loop Engine:** same-root-session execution journal using native prompt/interrupt/event primitives only.
- **Hook foundation:** durable event envelopes, bounded provenance-labelled context, tool observations and compaction/event capture.
- **Structured tools:** bounded web discovery plus closed schemas for Ledger proposals, claims, evidence, reviews, approvals and loop control.

State belongs under `.opencode/opencode2-config/`. Unknown schema versions and corruption are rejected. Raw prompts and tool output are not persisted by default. Worker/model/synthetic/plugin/tool input cannot approve or directly complete work.

The imported loop runtime, daemon, timers, polling, shell/process/git/watch scheduler, mutable state authority and marker agent are removed. `/loop-*` files are thin compatibility aliases or stable unsupported diagnostics.

```sh
bun install --frozen-lockfile
bun run verify
# opt-in after production deployment; reads the token from the environment
bun run search:smoke
```

Installation creates a reviewed candidate; global cutover requires separate authorization.
