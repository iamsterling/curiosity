# OpenCode2 Config

OpenCode 2 Effect plugin (with a Promise compatibility setup seam) pinned
to `@opencode-ai/plugin@0.0.0-beta-17595`.

## Exact OpenCode V2 setup

The `@iamsterling/opencode2-config@0.1.0` artifact is independently
registry-ready, but this change does **not** publish it. Publication requires a
separate approval. Once that exact version is available from the operator's
configured package registry, use this complete setup contract. Do not replace
the version with a tag or range.

<!-- registry-setup:start -->
Create `~/.config/opencode/opencode.json` with the exact package entry first:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugins": ["@iamsterling/opencode2-config@0.1.0"]
}
```

Run the exact packaged installer to install the commands, skills, and bundle
assets without creating a duplicate local plugin wrapper:

```sh
bunx --bun @iamsterling/opencode2-config@0.1.0
```

Verify that OpenCode resolves and activates `iamsterling.opencode2-config`.
After a cold first start, repeat this exact command for up to 15 seconds only
while it exits successfully with exactly `No plugins loaded` or a subset of the
pinned built-in inventory with no custom plugin ID. Success is exactly the
pinned host inventory containing one `iamsterling.opencode2-config` entry; any
malformed or unexpected ID, any error, or continued absence after the bound,
is failure:

```sh
opencode2 plugin list
```
<!-- registry-setup:end -->

OpenCode V2 installs the configured package and its production dependencies in
its isolated package cache. The installer leaves the exact package spec pinned
in configuration and installs 41 commands, eight skills, and the reviewed
bundle assets under the OpenCode config directory.

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

## Configuration behavior

The V2 agent transform installs the bundled agent suite
and selects `orchestrator` as the default primary agent; no separate
`default_agent` or `agents` configuration is required. Agent models inherit the
active session model.

## Product architecture

- **Accepted durability architecture:** [ADR 0024](docs/decisions/0024-durable-ledger-v2-and-capture-authority.md)
  is the canonical Ledger v2/capture-authority design. Its acceptance is design
  approval only: implementation and production authority/persistence remain
  blocked on its gates, and it introduces no OpenSpec assets.
- **Accepted private parity companion:** [ADR 0026](docs/decisions/0026-rust-native-legacy-memory-parity-companion.md)
  permits only an independent JavaScript oracle and private Rust differential
  test seam. Ledger v1 remains sole lifecycle authority, EventCapture remains
  observation-only, Ledger alone makes evidence metadata authoritative, and the
  development evidence slice remains uncomposed/non-authoritative. Disabled
  persistence is unchanged; there is no integration, migration, Node-API/export,
  or cutover.
- **Accepted test-only Node-API qualification:** [ADR 0027](docs/decisions/0027-private-node-api-sdk-qualification-companion.md)
  permits only a removable shim under plugin tests on pinned Darwin arm64, Bun
  1.3.14, and lock-resolved OpenCode beta-17595. One verifier-temp,
  empty-registration test plugin may load and execute once. It does not permit
  normal plugin composition, add package files/exports/assets/dist, transfer
  authority, or alter M2/M6; any later composition proposal requires a plugin
  authority decision first.
- **Accepted fifth-artifact documentation authority:** [ADR 0028](docs/decisions/0028-fifth-node-api-control-flow-observation-companion.md)
  permits one request-scoped observation artifact only in isolated Bun
  qualification children. It is never an OpenCode, package, release, or normal
  composition input and requires a new v2 candidate and approval-only commit.
  separates actual-addon request-isolation evidence from standalone controlled
  shared-core interleaving evidence. The fixture is Phase-C-executed only, is not
  an addon or sixth artifact, and is absent from plugin/package/release surfaces.
- **Ledger Authority v1:** immutable event authority for intent, capability/delta framing, criteria, work, claims, typed evidence, approvals, reconciliation, archive lineage, facts, audit and capture gaps.
- **Native Loop Engine:** same-root-session execution journal using native prompt/interrupt/event primitives only.
- **Hook foundation:** durable event envelopes, bounded provenance-labelled context, tool observations and compaction/event capture.
- **Structured tools:** bounded web discovery plus closed schemas for Ledger proposals, claims, evidence, reviews, approvals and loop control.

State belongs under `.opencode/opencode2-config/`. Unknown schema versions and corruption are rejected. Raw prompts and tool output are not persisted by default. Worker/model/synthetic/plugin/tool input cannot approve or directly complete work.

The imported loop runtime, daemon, timers, polling, shell/process/git/watch scheduler, mutable state authority and marker agent are removed. `/loop-*` files are thin compatibility aliases or stable unsupported diagnostics.

## Source-checkout development only

These commands are for contributors working from this repository. They are not
the registry installation contract above.

```sh
bun install --frozen-lockfile --ignore-scripts
# Portable repository checks; this never invokes the Darwin real-host suite.
bun run verify
# opt-in after production deployment; reads the token from the environment
bun run search:smoke
```

`verify:linux` fails closed off Linux. `verify:darwin` is the separate real-host
profile; it requires Darwin arm64 and `CURIOSITY_TRUSTED_DARWIN_MANUAL=1` and is
only for the reviewed foreground manual lane.

Registry readiness does not authorize publication, deployment, or global
installation cutover; each requires separate approval.
Host-prepared, network-disabled Linux functional setup validation is documented in [docs/ephemeral-container-validation.md](docs/ephemeral-container-validation.md). It checks the pinned host's plugin/agent/command/skill/config catalogs and model-free event capture. The 20-tool result is explicitly installed-plugin setup instrumentation because beta-17595 has no HTTP tool-catalog route; context and tool runtime callbacks are not claimed.
