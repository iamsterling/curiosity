# Curiosity Retrieval internal contracts v1

**Status:** reversible development specification; not production readiness,
persistence authority, ADR acceptance, or migration authority.

Narrow implementation authority is [ADR 0049](../decisions/0049-reversible-retrieval-contract-tranche.md).
Proposed ADRs 0043–0048 remain proposed and are constraints, not broader grants.

## Placement and dependency rationale

The contracts live in `src/retrieval/`, adjacent to the provider-neutral runtime
query boundary. Domain types depend on no transport, storage, plugin, MCP, or
connector SDK. The SearXNG anti-corruption mapper imports only the existing
`RepositoryOutcome`; existing package exports and query responses are unchanged.
This is the smallest location that can characterize both local and public-web
runtime candidates without coupling runtime policy to plugin persistence.

## Version and closed-decoding policy

All records use `schemaVersion: 1` and a `curiosity.retrieval/.../v1` contract
name. Unknown core versions and fields fail closed with stable
`RETRIEVAL_CONTRACT_*` diagnostics. IDs are at most 128 UTF-8 bytes; candidate
titles 300 bytes; snippets and display locators 2,000 and 2,048 bytes; frames
contain at most 10 candidates, 16 attempts, and 16 failures. All candidate
extensions in one frame share a 2,048 UTF-8-byte and 64-node traversal budget,
counting namespaces, declared keys, containers, and scalar values. Extension
namespaces are deny-by-default and each namespace has a closed field schema; no
generic nested object is accepted. The current SearXNG mapper emits no extension;
its provider metadata exists only as opaque native-ranking identifiers. Legacy
namespaces accept only their explicitly characterized fields. Schema lookup uses
an own-key-safe registry, and symbol keys, dangerous prototype names, unknown
fields, and non-schema nesting fail closed. Allowed values confer no core meaning
or authority.

V1 timestamps use the canonical UTC RFC 3339 subset ending in `Z`, with either
whole seconds or exactly three fractional digits. URLs are bounded credential-free
HTTP(S) locators. Text truncation walks Unicode code points and never splits a
UTF-8 sequence.

Runtime decoders are provided for externally supplied source surfaces,
capability manifests, plans, and frames. `EvidenceEnvelope` exists only to make
the candidate/evidence type boundary explicit. Remembered-belief/epistemic-memory
contracts are deliberately absent because this tranche cannot completely specify
or construct them. There is no capture, validation, activation, persistence, or
serving composition that could construct evidence from a candidate.

## Semantic distinctions

- `DiscoveryCandidate` is `recordKind: discovery-candidate`, untrusted, and has
  `authority: none`. `EvidenceEnvelope` requires committed capture,
  representation, span, and receipt references and is immutable. Neither is a
  remembered belief.
- `AuthorityDecisionReference` and snapshots are metadata with
  `authority: reference-only`; possession cannot authorize access.
- Source-native labels are retained only under a source namespace. They are not
  confidence, truth, authorization, or a portable score. Current provider labels
  are 1–8 lowercase identifier strings, each at most 32 UTF-8 bytes, with no
  whitespace, bearer/JWT shape, known credential prefixes, sensitive identifier
  segments, or long high-diversity opaque shape. These grammar and prefix rules
  reject representative credential formats; they do not detect every possible
  secret. Callers must never supply credentials as provider metadata.
- Coverage is `MEASURED | ESTIMATED | UNKNOWN` independently of
  `COMPLETE | PARTIAL | UNKNOWN`. `COMPLETE` requires measured, non-null,
  arithmetically consistent scopes; successful current attempts; consistent
  observed counts; current observations no later than the frame `asOf`; and zero
  failures. Every other condition is partial. Complete
  empty results are valid only for the disclosed measured view. Unknown and
  failed attempts cannot become claims of exhaustive absence.
- Every candidate `observedAt` must be no later than its frame `asOf`, regardless
  of completeness or partial status.
- `INDEXED`, `LIVE`, and `HYBRID` are manifest capabilities. `HYBRID` is an
  explicit plan mode, never fallback authority. Manifests also close tenancy,
  policy dependencies, field availability, source cursor, deadline, cancellation,
  ordering, pagination, limits, failures, freshness, coverage, and binding.

Plans and frames contain bounded reason/failure codes, not raw chain-of-thought,
hidden prompts, credentials, unrestricted payloads, or action capabilities.

## Characterization mappings

The read-only fixture mapper deliberately does not import or mutate legacy
authorities:

| Input | Preserved characterization | Blocking/non-promotion rule |
| --- | --- | --- |
| M2 | document/version/source/snapshot/analyzer/native score | projection candidate, never validated evidence |
| M6 | document/snapshot and legacy capture citation | `captureId` is an acquisition locator only |
| EventCapture | event identity, digest, watermark, taint | digest-only; absent payload bytes are never invented |
| Ledger v1 | entity identity and task-output digest | task evidence/facts are not retrieved truth |
| development evidence | layered fixture refs and assertion label | no production custody, continuity, or authority claim |

Mappings use an allowlisted versioned namespaced extension and emit `authority: none`,
`uncertainty: UNVALIDATED`, and a stable finding. Unknown or unbounded fields
block characterization. Source authority/assertion labels are validated when
needed for characterization but omitted from extensions so they cannot be
reinterpreted as core lifecycle meaning.

## Traceability and remaining gates

- ADR 0041: candidate/evidence identity, explicit coverage/freshness, replaceable
  projections, orthogonal lifecycle dimensions.
- Proposed ADRs 0043–0047: bounded contexts, source manifests/modes, epistemic
  distinctions, reference-only authorization metadata, bounded plans/ranking.
- Proposed ADR 0048 and plugin ADR 0024: fixture-only legacy mappings, no
  dual-write/fallback, no promotion, no one-way migration.
- ADR 0049: sole narrow implementation authorization for this reversible tranche.

Still unresolved: canonical source identities, signed/config-bound manifests,
production authorization and freshness policy, evidence construction and
custody, Ledger v2 schema/fencing, full legacy inventories, and migration
qualification. This tranche supplies no evidence for those gates.
