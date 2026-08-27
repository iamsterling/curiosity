# ADR 0061: Development owned-retrieval query mode

**Status:** Accepted 2026-08-26 for the isolated benchmark tranche only;
production, release, deployment, general public crawling, and cutover remain
NO-GO

## Context

ADR 0051 implemented Retrieval v3 but prohibited package exposure, persistence,
and live acquisition. The custom harness subsequently needed a provider-neutral,
read-only way to exercise that independently designed orchestration in one
authorized Pokémon benchmark. The owner explicitly selected benchmark-only
acquisition on 2026-08-26 and rejected production or deployment authority.

The existing `@curiosity/runtime/query` module has two compatibility-checked
named exports. Adding another export would break its observed package contract,
while routing benchmark data through the fixture-only M6 and `COLR/1`
qualification paths would exceed ADRs 0053–0055.

## Decision

Add one closed `owned-retrieval-v3` mode to the existing
`createQueryRuntime` factory in `@curiosity/runtime/query`. The mode accepts a
provider-neutral `OwnedSnapshotPort`, an opaque query capability, a canonical
workspace scope, and an optional clock. It exposes only read-only
`retrieveInformation` and `close` methods.

The mode translates a narrow query request into the existing Retrieval v3
`OWNED_WEB` profile. It checks researcher role, operation, workspace scope, and
constant-time capability equality before the snapshot port can be read, then
rechecks the same authority at final delivery. Request, result, byte, node, and
deadline limits remain those of Retrieval v3. Required-leg, deadline, authority,
and malformed-report states fail closed.

The named query-module export inventory remains exactly
`createQueryRuntime` and `queryRuntimeCapabilities`; only erased TypeScript types
are added. The normal native query mode and public `web_search` behavior remain
unchanged. Runtime code performs no acquisition, network access, persistence,
activation, or mutation. The benchmark harness owns the removable adapter and
state implementation.

This decision narrowly supersedes ADR 0051's package-exposure exclusion only for
this private development mode. It does not expose or consume the fixture-only
owned-web database or owned lexical builder, and does not supersede ADRs
0053–0055 for those tranches.

## Invariants and checks

1. Unauthorized, closed, malformed, or expired calls perform zero snapshot
   searches.
2. Final delivery authorization occurs after retrieval and before projection.
3. The source-neutral port supplies snapshot, projection, corpus, capture,
   representation, span, and receipt references; runtime does not mint source
   authority.
4. The query module retains exactly two named runtime exports and no admin API.
5. Runtime boundaries remain networkless and filesystem-free for this mode.
6. Retrieval v3, query-boundary, source-boundary, and type checks pass together.

## Non-goals

No general crawler, production persistence, Ledger integration, M6 activation,
`COLR/1` serving, SearXNG cutover, stable public ABI, package publication,
release artifact approval, deployment, or production-readiness claim is
authorized.

## References

- [ADR 0051](0051-reversible-retrieval-v3-development-tranche.md)
- [ADR 0055](0055-owned-lexical-builder-and-atomic-publication.md)
- [Retrieval contracts v3](../specifications/curiosity-retrieval-contracts-v3.md)
- [Custom harness ADR-014](../../../../docs/architecture/custom-harness/decisions/ADR-014-benchmark-owned-retrieval.md)
