# ADR 0029: M3 query authority and source contract

**Status:** Accepted 2026-08-18

## Decision

The M3 query entrypoint accepts a harness-neutral principal envelope and
independently requires the exact `researcher` role, canonical operator-configured
workspace scope, `web_search` operation, and operator query capability. Request,
session, message, call, trace, and correlation IDs are never authority.

Results from the M2 fixture carry the exact canonical `sourceUrl` recorded in its
accepted manifest. The fixture uses reserved synthetic HTTPS URLs under
`m2-synthetic.invalid`; filesystem paths are never provenance and no live origin
is implied. Result passages remain untrusted evidence candidates with bounded
coverage.

`@curiosity/runtime` is a private Bun workspace package and is not published.
Harness code consumes only `@curiosity/runtime/query`, whose public value surface
contains query creation and capability discovery, not `AdminCapability`, corpus
administration, or mutations. Administrative ownership remains outside the
plugin.

The in-process native query is synchronous and enforces its own maximum 15 second
deadline. Host Effect interruption can prevent work before evaluation and can
discard publication after interruption around interruptible work, but cannot
preempt a synchronous FFI call already executing. No native preemptive
cancellation claim is made. There is no network, provider, admin, or setup-time
egress in this path.

## Consequences

Wrong role, workspace, operation, or capability fails closed with a stable
redacted authority outcome. Rollback disables the explicit runtime backend and
returns tool registration to the unchanged SearXNG default; it does not mutate
corpus state or remove the public tool names.
