# ADR 0051: reversible Curiosity Retrieval v3 development tranche

**Status:** Accepted 2026-08-19 for this narrow, removable development tranche
only; production, public crawling, persistence, and cutover remain NO-GO

## Context

The owner authorized a third internal retrieval contract tranche after ADRs 0049
and 0050. ADR 0041 remains a substrate constraint rather than general
implementation authority. Proposed ADRs 0043–0048 retain their historical status;
this decision does not silently accept them.

## Decision

Authorize internal TypeScript v3 contracts, closed decoders, a development
`RetrieveInformation` use case, and exactly three replaceable information-plane
adapters: an `INDEXED` owned M6 snapshot anti-corruption port, an `INDEXED`
development-memory fixture, and a `LIVE` authorized-MCP receipt fixture. Closed
profiles select one, two, or three legs in that order. Registered surface
references and capability manifests are source-neutral. Authority precedes every
read; delivery authority and memory lifecycle are checked again before output.
Whole-report bounds, deadline, required/optional failure, explicit coverage,
separate epistemic strata, stopping disclosure, and non-promotion rules continue.

The initial qualification corpus cell is **Curiosity technical ecosystem v1**:
official Curiosity, OpenCode, and MCP documentation/repositories plus dependency
documentation/repositories explicitly approved for the cell. No live acquisition
is authorized here. The pure acquisition kernel may model seed, sitemap, feed,
link, frontier, robots, politeness, fetch-attempt, capture, tombstone, and
projection-manifest events, but owns no network implementation or persistence.

After the owned path passes separate corpus, legal, relevance, operations, and
rollback qualification, the long-term decision is to replace SearXNG rather than
retain it as a runtime fallback. Cutover requires a later accepted ADR. There will
be no runtime fallback to SearXNG after that cutover; uncertainty fails closed.
Current SearXNG behavior and configuration remain untouched now.

MCP proceeds on two explicit tracks:

1. pursue an upstream OpenCode API for call-scoped child-tool invocation and a
   bounded authenticated result receipt;
2. temporarily permit a feature-flagged, expiring, single-use,
   context-and-input-digest-bound **model-mediated compatibility** receipt bridge.

Current public hooks do not prove a safe bounded child-result handoff without
reading unrestricted result bodies. Therefore this tranche implements only the
receipt contract and pure state machine with deterministic fixtures. It does not
wire hooks, fake execution, or scrape results, configuration, authentication, or
tokens. Absence of a safe host receipt is explicitly `MCP_UNSUPPORTED`.

## Review remediation

The development composition completes every bounded preparation, hydration, and
finalization before its last delivery-authority await; report composition and
decoding are synchronous after that decision. Every awaited port is raced against
the request's remaining monotonic deadline and receives cancellation where its
port can honor it. MCP delivery accepts only an opaque bridge-consumer capability,
never a caller-supplied receipt object. The consumer atomically binds request,
authenticated context, session, agent, message, parent call, intent, nonce, and
canonical input digest; receipt IDs hash that context and the full settlement.

Closed decoders now inspect property descriptors before sizing, reject accessors,
symbols, `toJSON`, unsafe prototypes, duplicate identities, aggregate overflow,
and cross-surface/anchor conflicts. Owned results bind the requested snapshot and
validated projection snapshot. The acquisition reducer accepts only events from
its exact constructor/decoder and rejects stable identity collisions. These are
hardening changes inside the same removable tranche, not broader authority.

Deadline horizons are capped at an inclusive 60,000 milliseconds after actual
orchestration start; semantic `knownAsOf` does not define the operational
deadline, and max+1 is rejected before any timer is created.
Closed traversal inspects array length and density before serialization, rejects
sparse or non-enumerable structures, and applies per-array/node bounds. Owned
`no_answer` is valid only with zero results; contradictions become the redacted
`OWNED_SNAPSHOT_MALFORMED` failure. Coverage and delivery counts are bounded
nonnegative integers, including valid zero-document complete snapshots.

## Exclusions and reversibility

No live fetch, public crawl, SearXNG removal/cutover, SQLite/Tantivy, production
persistence, Ledger migration, direct MCP connection, arbitrary tool invocation,
recursive prompting, automatic capture, validation/activation, action authority,
token/config/result scraping, package-export change, or production-readiness claim
is authorized. Existing v1/v2 and public `web_search` ABI remain unchanged. The
tranche is removable internal source, tests, and documentation.
