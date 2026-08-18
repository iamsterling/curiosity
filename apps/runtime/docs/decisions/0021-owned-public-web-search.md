# ADR 0021: stage an owned public-web search plane

**Status:** Proposed 2026-08-17; independent architecture, security, privacy,
legal, funding, and operations approval required before implementation

## Context

Accepted ADR 0020 established a bounded provider-neutral `web_search` tool, a
deprecated compatibility alias, researcher-only bundled permission, untrusted
result handling, and an isolated SearXNG adapter. It is a reversible transition
ABI, not an owned search system: discovery, corpus, ranking, freshness,
provenance, and upstream availability remain externally controlled.

Curiosity needs capture-anchored evidence, document versions, independent source
diversity, temporal change, contradiction candidates, uncertainty, branch
lineage, and explicit coverage. The initial deployment direction is local
single-node and native OpenCode integration; distribution details are separately
proposed in [ADR 0022](0022-installable-search-runtime.md).

## Proposed decision

If later authorized, build the search semantic core in gated, reversible stages
and apply these normative proposed invariants:

1. **Own search semantics.** Project-authored semantics cover crawler/frontier
   policy, extraction acceptance, document/capture/version identity, lexical
   index, ranking/diversification, evidence/provenance, deletion, bounds, and
   authority. Separately reviewed commodity OS, runtime, TLS, database,
   object-storage, compression, and observability components may sit behind
   replaceable boundaries and a dependency/license ledger. Third-party search
   engines, crawlers, indexes, hosted providers, and copied implementations do
   not enter the owned semantic core without a new decision.
2. **No action authority.** Search returns bounded untrusted evidence. Retrieved
   text cannot grant tools, credentials, policy changes, more search budget,
   arbitrary fetches, or autonomous continuation.
3. **Effective permission fails closed.** After host, user, and plugin
   configuration are fully composed, only the effective `researcher` role may
   invoke `web_search` or `formerhuman_search`. Registration or startup fails
   closed if either name becomes available elsewhere. The current bundled
   default is not claimed to provide this invariant.
4. **Citations are capture-anchored.** A normal citation identifies immutable
   capture/version and passage evidence, including relevant hashes and pipeline
   versions. Results from the metasearch transition may be returned only when
   explicitly labeled as weaker, non-capture-anchored transition evidence.
5. **Authority and projection are distinct.** Capture, document/version, and
   policy-decision records are authoritative. Lexical/vector indexes, snippets,
   caches, and query-serving projections are versioned and rebuildable from
   authorized records; rebuild and deletion propagation are tested.
6. **Limitations are disclosed.** Every response can represent partial work,
   stale evidence, policy filtering, failed branches, and known coverage limits.
   Unknown state remains `unknown`; no empty result implies exhaustive absence.
7. **Scores are version-relative.** Ranking scores and order are meaningful only
   for the identified corpus/index/analyzer/feature/model snapshot. They are not
   durable facts or comparable across versions absent explicit calibration.
8. **Static fetch precedes rendering.** Rendering is an independently gated,
   disposable, uncredentialed, public-egress-only isolation lane used only after
   static extraction fails a measured quality test.
9. **Clean-room and rights ledgers are mandatory.** Public standards and
   published algorithms may be independently implemented with attribution and
   legal review. Every dependency, corpus, benchmark, and underlying document
   source records exact version, license, content rights, notices, restrictions,
   provenance, approval, and expiry. Software license never substitutes for
   content rights.
10. **Reversibility is a release property.** Each stage defines rollback,
    tombstone/deletion behavior, snapshot compatibility, backup/restore, and a
    stop condition. The provider-neutral ABI and deprecated alias remain until a
    separately reviewed removal.
11. **Expand cell by cell.** Each language/region/vertical cell needs explicit
    corpus policy, legal/privacy/security review, judgments, quality and
    freshness gates, abuse controls, deletion capability, and capacity envelope.
    “Global web” is an expansion direction, never an initial acceptance claim.
12. **Funding and operations are gates.** Crawling cannot begin or expand
    without named owners and recurring capacity for publisher complaints,
    takedown/privacy requests, illegal-content escalation, security response,
    relevance judgments, backups/restores, patching, and on-call operations.

Before any durable capture, fetched bytes remain only in an encrypted,
access-denied, bounded provisional buffer and pass an approved illegal-content
policy check. Positive, indeterminate, unavailable, timed-out, or unversioned
checks stop ordinary capture/indexing. Restricted minimum-evidence quarantine,
specialist/security/privacy/legal escalation, reporting decisions, deletion, and
audit must be operational; otherwise the crawl lane stops. This ADR does not
define jurisdiction-specific duties.

Curiosity branching remains caller-framed and aggregate-budgeted. The system
records parent/branch lineage, novelty, independent-source diversity,
contradiction candidates, uncertainty, temporal change, exploration versus
exploitation, and marginal gain. Branches use `GO`, `CURIOSITY_NO_GO`, or `STOP`;
coverage/saturation, budget, policy block, unavailable safeguards, repeated
duplicates, or nonpositive marginal gain require stopping.

## Consequences

If accepted and implemented, Curiosity would control evidence lineage,
coverage, freshness, ranking, diversity, and search-specific signals while
assuming crawler etiquette, content custody, takedown, privacy, abuse, relevance,
security, infrastructure, and on-call obligations. Lexical retrieval precedes
vectors and learned ranking. Local single-node precedes server, cluster, and
multi-tenant profiles.

No implementation, packaging, production mutation, provider cutover, corpus
acquisition, crawling, dependency exception, or deployment is authorized. The
initial corpus cell, jurisdictions, concrete commodity dependencies, SLOs,
retention, capacity, staffing, and funding remain approval inputs.

See the source-backed [research dossier](../research/owned-public-web-search-architecture-2026-08-17.md)
and [cross-product synthesis](../research/cross-product-web-search-synthesis-2026-08-17.md).
