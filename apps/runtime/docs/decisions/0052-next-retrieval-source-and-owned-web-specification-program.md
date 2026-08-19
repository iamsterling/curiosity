# ADR 0052: next retrieval source and owned-web specification program

**Status:** Accepted 2026-08-19 for architecture and specification only; not
implementation, dependency, live-fetch, persistence, deployment, cutover, or
production authority

**Partial supersession:** [ADR 0054](0054-clean-room-owned-lexical-reader-qualification.md)
supersedes only the Tantivy implementation choice in Decision 4. Its
replaceable-projection boundary and every custody, authority, generation,
provenance, tombstone, rollback/rebuild, governance, SearXNG, and production
invariant remain accepted and unchanged.

## Context

ADRs 0041 and 0043–0051 establish source-neutral retrieval, capture-before-
evidence, pre-read and last-mile authority, replaceable projections, explicit
partiality, and a removable v3 development tranche. They do not select the next
source-access or owned-web implementation. Six completed research tracks are
summarized in the [phase compendium](../research/next-retrieval-phase-compendium-2026-08-19.md).
This repository uses its native ADR/specification workflow; **OpenSpec is not
used**.

## Decision

Adopt the following target architecture for specification and later, separately
authorized qualification:

1. Curiosity owns a direct MCP client plane configured independently from
   OpenCode. MCP is transport only. Curiosity configuration, authorization,
   budgets, result validation, audit, cancellation, and domain mapping remain
   authoritative. Remote HTTP and local-process profiles are explicit and
   closed. Information tools/resources are separate from action tools.
2. Strategic indexed or ACL-sensitive systems use Curiosity-native connectors
   when native identity, revision, ACL, deletion, incremental synchronization,
   coverage, or audit semantics cannot be represented faithfully through MCP.
   Direct MCP and native connectors are complementary, not fallback paths.
3. MCP invoked by a harness is accepted only as a bounded authenticated receipt
   meeting the v3 binding rules. Harness configuration, tokens, unrestricted
   result bodies, and tool execution are not Curiosity inputs. Direct MCP does
   not depend on this compatibility boundary or on OpenCode configuration.
   Contracts v3 is harness-receipt-only; direct MCP requires a distinct
   source-observation surface and a later contract version before implementation.
4. The owned-web local profile uses SQLite for acquisition control and event
   state, immutable content-addressed capture objects plus WARC records for
   custody, networkless extraction, and a replaceable Tantivy lexical
   projection. SQLite is not Ledger lifecycle truth; Tantivy is not custody,
   authorization, or evidence authority. A PostgreSQL control-plane migration
   seam is specified before scale requires it. Canonical capture publication is
   exclusively controlled by plugin ADR 0024: `LOCAL_PREPARED`, then
   `EXTERNAL_APPENDED`, then `LOCAL_COMMITTED`. Acquisition SQLite may observe
   only `LOCAL_COMMITTED`; it cannot publish or grant evidence eligibility.
5. The first qualification corpus cell is **Curiosity technical ecosystem v1**:
   approved official Curiosity, OpenCode, MCP, and explicitly admitted
   dependency documentation/repositories. Admission is per source and revision;
   public availability is not rights evidence.
6. SearXNG remains the operational transition path until a later accepted
   cutover ADR records all qualification evidence. Shadow and canary evaluation
   may not seed the owned corpus from SearXNG. Following cutover there is no
   runtime SearXNG fallback. A deployment rollback is permitted only during a
   predeclared qualification window, to a pinned known-good whole deployment,
   when rollback criteria and retained SearXNG obligations were approved before
   the window. Uncertainty otherwise fails closed.

The governing specifications are:

- [source access v1](../specifications/retrieval-source-access-v1.md);
- [owned-web control, capture, and extraction v1](../specifications/owned-web-control-capture-extraction-v1.md);
- [lexical index and query v1](../specifications/owned-web-lexical-query-v1.md);
- [corpus governance v1](../specifications/retrieval-corpus-governance-v1.md); and
- [evaluation and cutover v1](../specifications/retrieval-evaluation-searxng-cutover-v1.md).

Normative language in those documents governs a future implementation proposal,
not the current runtime. Research defaults are provisional until named owners
approve production thresholds. This ADR adopts only the choices stated here; it
does not generally accept proposed ADRs 0043–0048 or widen ADR 0051.

## Invariants

- Source access never bypasses ADR 0046 pre-read and final delivery authority.
- Connector/MCP observations remain untrusted and cannot self-promote to evidence.
- Capture bytes and Ledger records remain authoritative over every projection.
- Only canonical `LOCAL_COMMITTED` under plugin ADR 0024 may be acknowledged or
  become evidence; acquisition `CAPTURE_COMMITTED` is an ineligible observation.
- Discovery, fetch, capture, extraction, indexing, and serving retain separate
  identities and failure states.
- No hidden mode fallback, source substitution, dual lifecycle authority, or
  SearXNG corpus seeding is permitted.
- Current public `web_search` behavior and SearXNG configuration remain unchanged.

## Consequences

Curiosity can integrate broad MCP sources without making OpenCode its source
host, while reserving native connectors for semantics that require them. The
owned-web path has explicit custody and replaceable serving layers. This adds
configuration, security, corpus-governance, and operational qualification work;
the design deliberately prefers visible failure over implicit fallback.

Tantivy is third-party MIT software and SearXNG is third-party AGPL software.
This ADR copies neither and grants no dependency or license-compliance approval.
ADR 0054 exercised the contemplated dependency rejection without changing the
projection boundary specified here.

## Rejected alternatives

- **Reuse OpenCode MCP configuration directly:** confuses host lifecycle and
  credentials with Curiosity authority.
- **MCP for every source:** loses source-native ACL, revision, and deletion truth.
- **Native connector for every source:** creates unnecessary integration breadth.
- **Database or index as evidence authority:** contradicts ADR 0041.
- **SearXNG fallback after cutover:** creates an unqualified hidden retrieval path.
- **Common Crawl seed:** rights, deletion, provenance, and freshness are unresolved.

## Acceptance and unresolved decisions

This design set is accepted only if documentation links resolve, records and
states are closed, failure semantics and binary acceptance scenarios are stated,
and no file outside runtime documentation changes for this program.
Implementation remains blocked on named security/IAM, data/legal/privacy,
runtime, retrieval-quality, and operations owners approving credentials, rights,
retention, budgets, SLOs, dependency/license posture, benchmark judgments,
production thresholds, and cutover/rollback authority.

## References

- [ADR 0041](0041-unified-retrieval-memory-evidence-substrate.md),
  [ADRs 0043–0048](0043-curiosity-retrieval-bounded-contexts-and-contracts.md),
  [ADR 0051](0051-reversible-retrieval-v3-development-tranche.md), and
  [Retrieval contracts v3](../specifications/curiosity-retrieval-contracts-v3.md).
- [Canonical plugin ADR 0024: durable Ledger v2 and capture authority](../../../plugin/opencode2/docs/decisions/0024-durable-ledger-v2-and-capture-authority.md).
- [Research compendium](../research/next-retrieval-phase-compendium-2026-08-19.md).
- [ADR 0054: clean-room owned lexical reader qualification](0054-clean-room-owned-lexical-reader-qualification.md).
