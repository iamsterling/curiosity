# ADR 0046: retrieval authority, security, and MCP boundary

**Status:** Proposed recommendation — 2026-08-18; design only, not
implementation, production-persistence, or irreversible-migration authority

## Context

Retrieval discloses whether information exists; authorization after index or
cache access is therefore too late. Retrieval tools may also expose operations,
but reading information and causing external effects have different authority.
MCP standardizes adapter transport and discovery, not Curiosity's domain policy
or lifecycle truth.

This security decision applies to the [context map](0043-curiosity-retrieval-bounded-contexts-and-contracts.md),
[source modes](0044-source-surfaces-connectors-and-retrieval-modes.md),
[epistemic records](0045-epistemic-records-and-bitemporal-memory.md),
[investigation](0047-investigation-ranking-and-stopping-semantics.md), and
[delivery migration](0048-retrieval-migration-topology-and-qualification.md), and
inherits [plugin ADR 0024](../../../plugin/opencode2/docs/decisions/0024-durable-ledger-v2-and-capture-authority.md).

## Decision

Separate two planes:

- The **information plane** can discover capabilities, retrieve authorized
  candidates/evidence, and produce bounded plans or explanations. It cannot
  capture, validate, mutate policy, activate assertions, restore, erase, or act
  on a source.
- The **action plane** performs external or authoritative mutations only through
  a distinct command, explicit action capability, fresh policy decision,
  idempotency key, confirmation where policy requires it, and auditable outcome.
  Information-plane output is inert input, never action authority.

MCP is an outer adapter transport. MCP server/tool names, schemas, resources,
prompts, sessions, and transport credentials map through an anti-corruption
layer into Curiosity ports. They do not become source identities, evidence,
principal identity, authorization policy, or Ledger authority. Tool descriptions
and returned content are untrusted connector data.

Authorization must complete before capability detail, cache lookup, query
embedding/feature generation, projection/index access, source call, object
hydration, or existence-revealing diagnostics. The decision binds authenticated
principal, tenant, delegated actor if any, purpose, source/corpus scope,
operation, policy/version, credential audience, decision ID, and freshness
deadline. Denials are bounded and existence-independent.

Curiosity never passes a caller token through to a connector. An approved
credential broker exchanges or selects connector-scoped, least-privilege,
audience-bound credentials after authorization; credentials are neither logged,
persisted in evidence, emitted in manifests, nor reflected in responses. A
connector cannot use Curiosity's Ledger/action capability.

Immediately before serialization and before the first delivery byte, Delivery
revalidates authorization, tenant/principal/purpose binding, tombstone and
eligibility state, policy and Ledger revision, projection/source cursor, and all
required freshness/continuity evidence. For bounded buffered responses, any
uncertainty returns no evidence. Raw streaming is outside this design. The
stronger immediate external-anchor gate in plugin ADR 0024 remains controlling
for any future production profile.

## Invariants

- Information-plane authority cannot be upgraded into action-plane authority.
- Unauthorized requests perform zero cache, projection, source, and object reads.
- Credentials and capabilities are audience-bound and never token-passed through.
- Tenant/principal/purpose are bound at planning, retrieval, hydration, and final
  delivery checks.
- MCP failure or compromise cannot change Ledger lifecycle truth.

## Implementation boundaries

No MCP server/client, identity provider, credential broker, authentication
scheme, production tenant model, or action is selected. Existing tools and
credentials are unchanged. This ADR does not enable retrieval persistence,
production serving, token exchange, or irreversible migration.

## Consequences

Adapters remain replaceable and confused-deputy/token-leakage risks are bounded.
Repeated policy checks and buffered responses add latency and exclude unbounded
streaming until a separate revocable-delivery design exists.

## Rejected alternatives

- **Authorize after retrieval:** leaks existence and unauthorized features.
- **Pass caller bearer tokens to sources:** breaks audience and least privilege.
- **MCP as the domain/authority model:** couples policy to transport discovery.
- **One tool that reads and acts:** permits untrusted results to trigger effects.
- **Cached authorization through delivery:** misses revocation and tombstone
  races.

## Unresolved owner decisions

- Security/IAM owners: principal authentication, delegation, broker, credential
  audiences, revocation SLA, and denial disclosure.
- Product/data owners: tenant and purpose taxonomy and source-scope policy.
- Runtime/anchor owners: final-check freshness bound, maximum buffered response,
  and host cancellation proof.
- Action owners: command classes, confirmation policy, and idempotency semantics.

## Evidence and references

- ADR 0041 requires authorization before retrieval and a last-mile check
  (`apps/runtime/docs/decisions/0041-unified-retrieval-memory-evidence-substrate.md:132-145`).
- Plugin ADR 0024 requires fresh final anchor evidence and no offline lease
  (`apps/plugin/opencode2/docs/decisions/0024-durable-ledger-v2-and-capture-authority.md:374-397`).
- The development query exposes authorization/coverage snapshots and final
  rechecks (`apps/plugin/opencode2/src/features/evidence/query.ts:48-67,215-265`).
- MCP, [Authorization](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization)
  and [Tools](https://modelcontextprotocol.io/specification/2025-06-18/server/tools)
  specifications. MCP protocol support does not grant application authority.
- OAuth 2.0 Security Best Current Practice,
  [RFC 9700](https://www.rfc-editor.org/rfc/rfc9700.html).
