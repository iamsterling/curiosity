# ADR 0043: Curiosity Retrieval bounded contexts and contracts

**Status:** Proposed recommendation — 2026-08-18; design only, not
implementation, production-persistence, or irreversible-migration authority

## Context

[ADR 0041](0041-unified-retrieval-memory-evidence-substrate.md) establishes one
evidence substrate without making retrieval projections authoritative. The
[reverse-engineering record](../research/reverse-engineering-retrieval-memory-systems-2026-08-18.md)
shows separate M2, M6, web-search, EventCapture, Ledger, and development-evidence
models. Flattening them into one generic result or “memory” record would erase
identity, custody, authorization, and lifecycle distinctions.

This ADR is the context map for the Curiosity Retrieval recommendation set:
[source surfaces](0044-source-surfaces-connectors-and-retrieval-modes.md),
[epistemic memory](0045-epistemic-records-and-bitemporal-memory.md),
[authority and security](0046-retrieval-authority-security-and-mcp-boundary.md),
[investigation and ranking](0047-investigation-ranking-and-stopping-semantics.md),
and [migration and delivery](0048-retrieval-migration-topology-and-qualification.md).
Canonical Ledger design remains owned by plugin
[ADR 0024](../../../plugin/opencode2/docs/decisions/0024-durable-ledger-v2-and-capture-authority.md).

## Decision

Use these Clean Architecture/DDD bounded contexts:

1. **Source Access** owns source-surface identity, connector capabilities,
   acquisitions, and source-native metadata. It emits untrusted candidates and
   receipts, never truth.
2. **Evidence Custody** owns immutable acquired and derived bytes and receipts.
   It does not decide query eligibility.
3. **Epistemic Memory** owns assertions, immutable evidence sets, relationships,
   uncertainty, valid-time meaning, and validation policy outcomes.
4. **Investigation** owns staged plans, retrieval mode selection, fusion within
   comparable strata, contradiction/time adjudication, next actions, and stop
   decisions. It cannot promote evidence or authorize access.
5. **Authority and Policy** owns principal/tenant/purpose authorization,
   lifecycle transitions, tombstones, and final delivery decisions through the
   exclusive Ledger authority.
6. **Delivery** owns bounded response serialization and disclosure of snapshots,
   coverage, freshness, exclusions, failures, and warnings.

Dependencies point inward to versioned domain ports. Source connectors, MCP,
indexes, databases, and network transports are outer adapters. Contexts exchange
explicit anti-corruption contracts rather than importing another context's
persistence model.

The shared contract is a versioned core envelope plus versioned namespaced
extensions. Its minimum serving/evidence core carries only cross-source
semantics:

- envelope/schema version, request ID, Ledger cursor, projection snapshot, and
  `as_of` time;
- source-object, revision, content, occurrence, capture, representation, chunk,
  and span identity refs plus provenance/receipt refs;
- bounded inert content, span offsets/digest, media type, capture time, and a
  display-safe source locator;
- assertion identity and lifecycle state plus validation policy and decision
  refs;
- relevant typed relationship record refs;
- authorization snapshot, query-eligibility reason, and explicit
  tombstone/deletion state; and
- freshness, coverage, bounded partial-failure types, and untrusted-content
  warnings.

Unknown optional core identities remain explicitly unknown. A connector
preserves every permitted source-specific field under an extension key such as
`org.example.connector/v1`; unknown extensions survive round trips but remain
opaque and confer no core meaning, assertion state, eligibility, or authority.
Internal object paths, credentials, raw policy labels, hidden prompts,
unrestricted content, and portable absolute ranking scores are excluded.
Adapters may enrich but may not flatten, reinterpret, or silently discard
identity and metadata.

## Invariants

- Candidate, evidence, assertion, decision, and delivery envelopes are distinct.
- Source object, revision, content, occurrence, capture, representation, and span
  identities retain the meanings fixed by ADR 0041; hash equality merges none of
  them except an explicitly defined content identity.
- Domain policy has no dependency on MCP, connector SDKs, indexes, or storage.
- Unknown core versions fail closed; unknown extension namespaces remain opaque.
- Projection scores, provider labels, URLs, and model output never become
  lifecycle authority.

## Implementation boundaries

This recommendation permits only contract and fixture design after acceptance.
It does not compose the development evidence harness, change package ABIs, select
storage or dependencies, authorize production persistence, or authorize the
one-way Ledger migration. Existing provider-neutral runtime and plugin boundaries
remain unchanged.

## Consequences

Ownership and dependency direction become reviewable, and adding source types
does not force a lowest-common-denominator schema. The cost is more explicit
mappers, version negotiation, and compatibility fixtures. Cross-context queries
must tolerate unknown extensions and absent optional core fields.

## Rejected alternatives

- **One universal document/result schema:** destroys source and lifecycle
  semantics.
- **Connector SDK types as domain contracts:** reverses dependency direction.
- **Shared database tables as integration:** creates hidden authority and
  deployment coupling.
- **Drop unknown metadata:** prevents faithful replay and future interpretation.

## Unresolved owner decisions

- Architecture owner: exact package/module placement and core envelope versioning
  policy.
- Data governance owner: extension allowlists, size bounds, sensitive-field
  redaction, retention, and export rules.
- Product owner: which optional core fields are mandatory for the first fixture.

## Evidence and references

- Runtime query ABI is narrow and provider-specific configuration remains outside
  the principal envelope (`apps/runtime/src/query.d.ts:1-29`).
- Search tools call their outputs bounded untrusted candidates
  (`apps/plugin/opencode2/src/features/search/index.ts:36-66`).
- ADR 0041 defines layered identities and replaceable projections
  (`apps/runtime/docs/decisions/0041-unified-retrieval-memory-evidence-substrate.md:55-94`).
- Eric Evans, _Domain-Driven Design Reference_, context mapping
  ([primary author publication](https://www.domainlanguage.com/ddd/reference/)).
