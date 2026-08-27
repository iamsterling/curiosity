# ADR-014: Benchmark-only owned retrieval

**Status:** Accepted and implementation authorized — 2026-08-26  
**Authority:** The user explicitly selected isolated benchmark-only acquisition;
no production, deployment, publication, or general crawling authority was
granted.

## Context

The native harness had bounded fetch and optional runtime search, but the exact
Pokémon benchmark could not discover useful URLs without an external SearXNG
gateway. Curiosity's independently designed Retrieval v3 orchestration existed
only internally. The objective is to test that owned retrieval path without
making SearXNG permanent or silently widening the repository's production
authority.

MediaWiki's official REST API documents a credential-free page-search endpoint,
`GET /w/rest.php/v1/search/page`, with an explicit `limit` parameter. It is a
narrow discovery source for this benchmark, not a representation of the whole
public Web.

## Decision

Add an opt-in `benchmark-owned` harness adapter with all of these controls:

1. Selection requires both
   `CURIOSITY_RESEARCH_ADAPTER=benchmark-owned` and the exact acknowledgement
   `CURIOSITY_BENCHMARK_ACQUISITION_ACK=development-benchmark-only`.
2. Discovery is fixed to English Wikipedia's documented MediaWiki REST page
   search. It uses the existing bounded HTTPS adapter, follows no page links,
   accepts no credentials, and returns at most ten results and 40,960 response
   bytes within the existing ten-second action deadline.
3. Parsed observations are admitted into a harness-owned lexical snapshot. Raw
   discovery responses and snapshot generations are immutable, canonical-JSON,
   SHA-256-addressed files under the fresh research artifact directory. An
   atomically replaced `ACTIVE.json` selector records current and previous
   snapshot identity. Counts cap captures and snapshots at 32 and documents at
   128; there is no garbage collection.
4. Every admitted document remains bound to its discovery capture. Restart
   validates the active selector, snapshot digest, projection identity,
   referenced capture, and re-derived MediaWiki observation before serving.
5. Serving calls the `owned-retrieval-v3` mode of
   `@curiosity/runtime/query` with a process-local random capability and exact
   researcher/workspace principal. The runtime owns pre-read and final-delivery
   authorization and Retrieval v3 bounds; the harness owns acquisition,
   persistence, and adapter lifecycle.
6. Runtime `custodied-evidence` is downgraded at the harness anti-corruption
   boundary to provenance-labelled untrusted search evidence. Only the existing
   successful tool-action and `source.captured` event path can make it available
   to the model and final research receipt. Neither source text nor a connector
   response grants truth, action authority, or final-answer eligibility.
7. Acquisition failure is explicit; it does not silently fall back to an older
   snapshot. A `snapshot-only` mode exists only as a direct construction seam for
   deterministic restart tests and is not selected by environment configuration.
8. If bounded fetch is separately selected, the researcher may fetch returned
   source URLs through the existing independent `network.fetch` grant.

The state directory and every managed file are included in the research-run
SHA-256 evidence manifest. Benchmark artifacts remain local runtime evidence;
they must not be committed or published, and this decision makes no third-party
content-license determination.

## Acceptance checks

- Unauthorized owned retrieval performs zero snapshot reads.
- One qualified discovery creates immutable capture and snapshot files plus a
  digest-bound active selector.
- Snapshot-only restart returns the same ranked result and leaves every managed
  artifact and active identity unchanged.
- Malformed discovery and corrupt state fail with stable diagnostics.
- Search and fetch remain separate final-sink capabilities and all returned
  content remains untrusted evidence.
- Focused runtime/harness suites, architecture checks, and type checks pass.
- The exact Pokémon rerun either produces citation-supported coverage or an
  evidence-specific `CURIOSITY_NO_GO`; the adapter cannot manufacture success.

## Non-goals

No robots-aware crawler, link frontier, arbitrary host connector, production
index, M6/`COLR/1` activation, canonical Ledger implementation, SearXNG cutover,
credential flow, deployment, release, signing, notarization, publication,
multi-user service, or production-readiness claim is authorized.

## References

- [Runtime ADR 0061](../../../../apps/runtime/docs/decisions/0061-development-owned-retrieval-query-mode.md)
- [MediaWiki REST API reference](https://www.mediawiki.org/wiki/API:REST_API/Reference)
- [OpenCode2 behavioral parity specification](../OPENCODE2-BEHAVIORAL-PARITY-SPEC.md)
