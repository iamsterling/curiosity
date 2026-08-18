# ADR 0021: M3 Effect runtime search adapter

**Status:** Accepted 2026-08-18

## Decision

Use the pinned OpenCode V2 Effect custom-tool seam for an in-process, query-only
adapter. The public tools remain exactly `web_search` and deprecated
`formerhuman_search`; both definitions reference one execute function. The
existing Promise SearXNG implementation remains the default without output or
wire-contract changes. The runtime path is selected only by explicit
`search.backend: "runtime"` configuration with operator-supplied state root,
canonical workspace scope, query capability, and the controlled plugin inventory.
There is no per-request fallback or network egress.

The executor checks trusted `context.agent === "researcher"` at execution even
when composed permissions would allow another agent. Runtime ADR 0029 performs a
second harness-neutral principal/capability check. Adapter diagnostics are stable
and redacted; results preserve bounds, source URLs, and the untrusted-evidence
notice. No admin type, entrypoint, or mutation is imported.

All backend/runtime configuration is treated as untrusted unknown input. Property
reads, inherited getters, proxy traps, injected runtime method reads, and runtime
factory opening remain inside a fail-closed redaction boundary. Any exception in
that boundary is exactly `WEB_SEARCH_RUNTIME_CONFIG_INVALID`, without source
text, path, or value. Runtime `authority_rejected` (principal/envelope rejection)
maps to `WEB_SEARCH_PRINCIPAL_REJECTED`; native `authority_denied` (query
capability denial) maps separately to `WEB_SEARCH_AUTH_DENIED`. Both messages are
the code only and disclose no runtime detail.

The Effect wrapper is interruptible before asynchronous evaluation and does not
publish a result to an interrupted caller where Effect semantics permit. The
synchronous FFI call remains internally deadline-bounded and is not preempted by
host interruption. Finalizers are installed before registration so tool disposal
precedes idempotent runtime close; no timer, fiber, or background task is owned by
the adapter.

Tool-name defense consists of an exact controlled plugin inventory, local
duplicate detection, exact schema/description/function attestation, and
characterization against OpenCode/plugin `0.0.0-beta-17519`. The host accepted a
same-name registration without a duplicate diagnostic, so this is explicitly
deployment-controlled and **not** a claim that the host enforces global
uniqueness or deterministic winner provenance.

## Rollback and limits

Remove the explicit runtime backend configuration (or set the backend to
`searxng`) and restart/unload the plugin. Registration is disposed before runtime
close; corpus state is untouched. This decision grants no M4 jobs/events, M5
provider, M6 crawl, M7 packaging/deployment, publication, or host-version change.
