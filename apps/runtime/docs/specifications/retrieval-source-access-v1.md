# Retrieval source access specification v1

**Status:** design contract under ADR 0052. Normative for a future proposal only;
no MCP connection, connector, credential use, persistence, or action is authorized.

`MUST`, `SHOULD`, and `MAY` have their RFC 2119 meanings. Unknown fields, enum
values, profiles, or schema versions MUST fail closed.

## Closed configuration

Curiosity MUST read only an operator-selected, Curiosity-owned configuration
root. It MUST NOT import OpenCode/harness config, environment inventories, MCP
server lists, tokens, or process state. A `SourceProfileV1` is exactly:

```text
{version:"1", profileId, kind:"MCP_REMOTE"|"MCP_LOCAL"|"CONNECTOR",
 enabled, information:[CapabilityRef], actions:[CapabilityRef],
 authRef|null, cachePolicy, auditPolicy, limits, classification,
 remote|null, local|null, connector|null}
CapabilityRef={name, class:"RESOURCE"|"READ_TOOL"|"ACTION_TOOL", schemaDigest}
```

Exactly one of `remote`, `local`, or `connector` MUST match `kind`.
`MCP_REMOTE` contains `{httpsUrl, oauthResource, tlsPolicyRef}`; HTTPS and an
exact OAuth resource/audience are mandatory. `MCP_LOCAL` contains
`{executableRef,args,workingDirectoryRef|null,environmentRefs}`; all values MUST
be allowlisted references, never shell text or secret values. `CONNECTOR`
contains `{connectorType,surfaceRef,manifestDigest}`. `authRef` and environment
entries MUST be opaque broker references. Literal secrets, caller tokens, URL
userinfo, inherited ambient credentials, and arbitrary environment maps MUST be
rejected before any process or network access.

`limits` MUST close maximum calls, bytes, items, pages, redirects, wall time,
idle time, and concurrency. `classification` MUST declare source data class,
tenant/purpose scope, allowed media, residency, retention class, and whether
capture is prohibited, optional, or separately admissible. Values absent from
the selected schema are unsupported, not defaults.

## Planning and execution

Curiosity MUST authorize before discovery, cache lookup, process start, DNS,
connector/index access, or existence-revealing error. Discovery output and tool
descriptions are untrusted. Curiosity MUST validate declared and returned
schemas, impose its own bounds, and map results only through an applicable
versioned source-neutral contract. MCP server/resource/tool IDs MUST NOT become
source, principal, evidence, or Ledger identity.

Resources and `READ_TOOL`s belong to the information plane. `ACTION_TOOL`s MUST
be excluded from retrieval profiles and caches and MUST require a distinct
future command contract, action capability, fresh decision, idempotency key,
confirmation policy, and audit record. A server annotation cannot reclassify an
action as a read. Prompts and sampling are unsupported in v1.

Cancellation MUST propagate to every started operation. Deadline, cancellation,
or uncertain settlement MUST stop later pages/calls and return a bounded typed
failure; it MUST NOT retry through another profile. Retry is allowed only when
the profile declares the operation idempotent and the same request/authority
binding and total budget remain valid.

Cache keys MUST bind profile/manifest/schema, canonical request, principal,
tenant, purpose, authorization decision and expiry, and source cursor. Private
discovery/results MUST never enter a public cache. Cache hits still require
pre-read and final delivery authorization. Audit MUST record IDs/digests,
classification, timing, counts, decision refs, settlement, and redacted codes;
it MUST NOT record credentials or unrestricted bodies.

## Direct MCP, harness receipts, and native connectors

Direct MCP is a Curiosity client plane independent of OpenCode. Harness-connected
MCP MAY enter only as an opaque, single-use, expiring authenticated receipt bound
to the complete v3 context/input/settlement identity in Contracts v3. Receipt
absence is `MCP_UNSUPPORTED`; scraping host results/config/tokens is prohibited.

Current Contracts v3 registers only `surface:authorized-mcp:v1`, whose provenance
is a harness receipt. It MUST NOT carry, relabel, or simulate a direct client
result. Direct MCP is therefore unimplementable under v3. Before any direct call,
a later retrieval-contract version MUST register a distinct
`surface:direct-mcp-source-observation:v1`, its closed decoder, budgets, failures,
and this exact provenance record:

```text
DirectMcpObservationProvenanceV1={kind:"DIRECT_MCP",profileId,
 serverIdentityDigest,protocolVersion,capabilityName,capabilityClass,
 capabilitySchemaDigest,canonicalRequestDigest,resultDigest,observedAt,
 sourceCursor|null,authorizationDecisionRef,auditReceiptRef}
```

The direct surface emits only untrusted `source-observation`; it cannot emit
custodied evidence, belief, or assertion. It has no host receipt ID, session,
agent, message, parent-call, bridge nonce, or `MODEL_MEDIATED` marker. Conversely,
the harness surface MUST retain those receipt bindings and MUST NOT claim a
direct profile/server settlement. Cross-decoding either provenance shape fails
`SOURCE_RESULT_INVALID`. A new contract ADR/version and focused acceptance tests
are mandatory before direct-MCP implementation authority can be proposed.

A source MUST use a native connector when any required admission property cannot
be represented and verified through MCP: stable object/revision identity,
source-native ACL evaluation, deletion/tombstone feed, incremental cursor,
transactional snapshot, measured coverage, legal-hold behavior, or required
audit evidence. MCP SHOULD be selected when bounded read-only access faithfully
preserves all required properties. Cost alone MUST NOT weaken ACL/provenance.
One source surface has one selected path per plan; connector/MCP fallback is
forbidden.

## Failure codes and invariants

Closed public codes are `SOURCE_PROFILE_INVALID`, `SOURCE_DISABLED`,
`SOURCE_DENIED`, `AUTH_REFERENCE_UNAVAILABLE`, `DISCOVERY_INVALID`,
`CAPABILITY_UNSUPPORTED`, `ACTION_FORBIDDEN`, `SOURCE_TIMEOUT`,
`SOURCE_CANCELLED`, `SOURCE_RESULT_INVALID`, `SOURCE_PARTIAL`,
`SOURCE_BUDGET_EXCEEDED`, and `MCP_UNSUPPORTED`. Exception text, endpoint detail,
secret-ref names, and existence-sensitive distinctions MUST remain internal.

- Denied access performs zero source/cache/process reads.
- Information authority cannot become action authority.
- Profile/manifest change invalidates discovery and result caches.
- Partial, unknown coverage, and stale authority are never reported complete.
- Final delivery rechecks authority, tombstones, cursor, and policy after hydration.

## Binary acceptance scenarios

1. A profile containing a token, unknown key, mismatched kind block, or action in
   `information` is rejected before I/O.
2. A denial records zero DNS, process, cache, connector, and index operations.
3. Remote audience mismatch, local executable substitution, schema drift, and
   cancellation each produce the exact redacted code and no fallback call.
4. An expired/private cache entry cannot cross authority or tenant boundaries.
5. A forged/replayed/context-mismatched harness receipt yields no content.
6. Direct provenance presented to v3, harness provenance presented to the future
   direct surface, or either shape with cross-surface fields is rejected.
7. A source lacking native ACL/deletion semantics is rejected from MCP selection
   when those properties are required.
8. Revocation after retrieval but before serialization yields no evidence.

## Deferrals and owner decisions

OAuth grants/clients, secret broker, local sandbox, trusted roots, connector SDK,
action plane, profile storage, rotation, production limits/SLOs, and first live
source are deferred. Security/IAM owns auth and sandbox policy; source owners own
connector choice/manifests; data/legal owns classification; operations owns
limits and diagnostics. All numeric research defaults are provisional.

## Traceability

[ADRs 0044](../decisions/0044-source-surfaces-connectors-and-retrieval-modes.md),
[0046](../decisions/0046-retrieval-authority-security-and-mcp-boundary.md),
[0051](../decisions/0051-reversible-retrieval-v3-development-tranche.md),
[0052](../decisions/0052-next-retrieval-source-and-owned-web-specification-program.md),
[Contracts v3](curiosity-retrieval-contracts-v3.md), and the
[research compendium](../research/next-retrieval-phase-compendium-2026-08-19.md).
Primary protocol/security sources: [MCP specification](https://modelcontextprotocol.io/specification/2026-07-28),
[RFC 9700](https://www.rfc-editor.org/rfc/rfc9700.html), and
[RFC 8707](https://www.rfc-editor.org/rfc/rfc8707.html).
