# ADR 0050: development-only RetrieveInformation composition

**Status:** Accepted 2026-08-18 for this removable development composition only;
production authority and readiness remain blocked

## Context

ADR 0049 authorized internal retrieval v1 contracts and characterization, but not
composition. The root user has separately authorized one bounded vertical slice
that composes the existing SearXNG-shaped runtime semantics with a faithful
development-evidence fixture boundary. ADR 0041 remains the substrate constraint;
proposed ADRs 0043–0048 remain proposed and do not gain general implementation or
production authority from this decision.

## Decision

Authorize only internal TypeScript Retrieval Contracts v2, closed decoders, a
transport-neutral `RetrieveInformation` use case, two information adapters, an
injected development authority-policy port, a thin internal projection, authored
fixtures, documentation, and tests under `apps/runtime`. The two explicit legs are
the SearXNG-shaped `LIVE` public-web adapter and development-memory `INDEXED`
adapter. Tests inject deterministic transports; the composition has no default
network transport.

Authorization runs before source, projection, candidate, custody, or hydration
reads. Delivery revalidates the authenticated-context reference, purpose, and
decision reference after candidate selection and hydration. Memory delivery then
re-reads every current custody, assertion, query-eligibility, authorization,
validation, and deletion dimension before constructing any deliverable item. Web
observations and memory evidence/assertion records remain separate strata. Source-native labels stay opaque within web
observations; no universal rank, confidence, quality, or trust scalar exists.
Memory fixtures reproduce committed capture/representation/span/receipt,
validation, eligibility, assertion, authorization-freshness, and deletion
semantics through an anti-corruption contract rather than importing plugin
infrastructure against package direction. Final state checks suppress raced
revocations and tombstones.

The request's aggregate count and whole-report UTF-8-byte/node budgets, including
all envelope and disclosure fields, are enforced in addition to global decoder
bounds. The largest fitting deterministic whole-item prefix is delivered; an
ordinary empty report that cannot fit becomes a minimal typed
`OUTPUT_BUDGET_EXHAUSTED` report. Deadline checks surround every awaited port
or hook using an injectable elapsed-time source. Required-leg failure blocks all
item delivery with `REQUIRED_LEG_UNAVAILABLE`; optional-leg failure can retain
authorized successful strata with explicit partiality. Adapter and composition-
level port exceptions become closed redacted failure codes. Fixed SearXNG coverage
remains unknown/non-complete, while development memory uses only its declared
coherent fixture coverage states.

## Explicit exclusions and remaining gates

This ADR does **not** authorize production persistence, production memory, Ledger
migration or mutation, real MCP/API connectors, default network access, global
crawling, automatic capture, validation or assertion activation, action authority,
public/package ABI change, deployment, or any production-readiness claim. Existing
`web_search`, `formerhuman_search`, runtime `webSearch`, exports, and production
behavior remain unchanged. ADRs 0043–0048 stay proposed.

Production remains blocked on authenticated identity and policy ownership,
credential brokerage, authoritative custody/continuity, Ledger v2 and fencing,
canonical source and belief identities, revocation freshness bounds, durable
tombstone propagation, rights/governance approval, performance limits, real
connector qualification, and migration/rollback evidence.

## Reversibility and evidence

The slice is unexported removable source, specification, ADR, and network-free
tests. [Retrieval Contracts v2](../specifications/curiosity-retrieval-contracts-v2.md)
records its exact semantic boundary. Any expansion requires a separate decision.
