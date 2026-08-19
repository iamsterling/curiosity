# ADR 0044: source surfaces, connectors, and retrieval modes

**Status:** Proposed recommendation — 2026-08-18; design only, not
implementation, production-persistence, or irreversible-migration authority

## Context

The current runtime has a live SearXNG gateway and separate indexed local M2/M6
surfaces. Their result, failure, freshness, and coverage shapes differ. A URL or
provider name is insufficient source identity, while pretending all connectors
support the same operations causes silent partial retrieval.

This ADR specializes the [context map](0043-curiosity-retrieval-bounded-contexts-and-contracts.md)
and is constrained by [ADR 0041](0041-unified-retrieval-memory-evidence-substrate.md),
[epistemic semantics](0045-epistemic-records-and-bitemporal-memory.md),
[security](0046-retrieval-authority-security-and-mcp-boundary.md),
[ranking](0047-investigation-ranking-and-stopping-semantics.md), and
[migration](0048-retrieval-migration-topology-and-qualification.md). Canonical
Ledger authority remains governed by plugin
[ADR 0024](../../../plugin/opencode2/docs/decisions/0024-durable-ledger-v2-and-capture-authority.md).

## Decision

A **source surface** is a stable, tenant-scoped logical collection exposed under
one source policy, not a URL, connector instance, credential, or index. Its
versioned identity records source kind, owning namespace, canonical external
collection identifier, tenant boundary, and identity-policy version. Locator,
account, repository, branch, channel, mailbox, database, and provider details are
source-native metadata retained in namespaced extensions.

Every connector publishes a signed-or-config-bound, versioned **capability
manifest** before planning. It declares:

- connector/manifest version and source-surface kinds;
- supported modes: `INDEXED`, `LIVE`, and/or `HYBRID`;
- query operators, filters, ordering guarantees, pagination/cursor semantics,
  result and byte limits, and cancellation/deadline behavior;
- authorization mechanism class without credentials, tenancy behavior, and
  policy/freshness dependencies;
- available revision, capture, valid-time, transaction-time, deletion, and
  provenance fields;
- coverage measurement method, freshness watermark semantics, and stable typed
  failure/exclusion codes; and
- content/media types and source-specific extension namespaces.

`INDEXED` reads an identified projection snapshot only. `LIVE` queries the
identified source surface for this request and records observation time and
source response cursor. `HYBRID` is an explicit staged plan over both, never an
implicit fallback: it discloses each leg and deduplicates only through typed
relationships. A mode not declared in the manifest is unsupported, not empty.

Each leg returns requested scope, attempted scope, known eligible scope,
observed items, excluded counts by reason, per-surface freshness watermark,
coverage as `MEASURED | ESTIMATED | UNKNOWN`, and bounded stage/source failures.
`partial=true` whenever any declared leg, partition, page, authorization check,
or freshness obligation is incomplete. Empty means no eligible observation in
the disclosed view, never proof of global absence. Missing freshness is
`UNKNOWN`, never current; missing coverage is `UNKNOWN`, never zero or complete.

## Invariants

- Connector output is an untrusted candidate until separately captured and
  validated.
- The manifest describes capability; it neither grants authorization nor proves
  runtime availability.
- Indexed and live observations retain distinct capture and time identities.
- Hybrid execution never silently substitutes one mode after another fails.
- Source-native metadata uses the versioned-core/namespaced-extension contract
  from ADR 0043 and survives round trips.

## Implementation boundaries

No connector framework, crawler, vendor, credential flow, schema registry, or
server is selected. The existing SearXNG endpoint remains one bounded adapter,
not the reference authority. This ADR does not authorize indexing, acquisition,
production credentials, or persistence.

## Consequences

Planning can reject impossible requests before source access and explain partial
results accurately. Manifests add validation/versioning work, and comparable
results may remain separate when source semantics differ.

## Rejected alternatives

- **Infer capabilities by trial calls:** leaks existence and makes failures
  ambiguous.
- **Live-first/index fallback:** hides mode and freshness changes.
- **Treat connector instance as source identity:** makes rotations and replicas
  appear to be new sources.
- **Common fields only:** loses source-native provenance and control metadata.

## Unresolved owner decisions

- Source owners: canonical source-surface identity rules per source kind.
- Security owner: manifest authenticity/configuration binding and allowed auth
  mechanism classes.
- Product/SRE owners: coverage vocabulary, freshness SLOs, pagination bounds, and
  which partial states may be delivered.
- Connector owners: first rights-cleared indexed/live/hybrid fixture surface.

## Evidence and references

- Current SearXNG results preserve provider labels, bounded content, and explicit
  partial failures (`apps/runtime/src/repository-search.ts:28-49,208-255`).
- M2 and M6 have distinct authority/projection flows
  (`apps/runtime/docs/research/reverse-engineering-retrieval-memory-systems-2026-08-18.md:41-69,190-213`).
- ADR 0041 requires explicit response snapshots, coverage, freshness, and typed
  partial failures (`apps/runtime/docs/decisions/0041-unified-retrieval-memory-evidence-substrate.md:132-154`).
