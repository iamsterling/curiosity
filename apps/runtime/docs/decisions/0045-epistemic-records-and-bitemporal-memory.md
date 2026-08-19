# ADR 0045: epistemic records and bitemporal memory

**Status:** Proposed recommendation — 2026-08-18; design only, not
implementation, production-persistence, or irreversible-migration authority

## Context

Search candidates, captured bytes, Ledger task evidence, remembered facts, and
active assertions currently have different meanings. Collapsing them into
“memory” would turn retrieval rank into truth and erase what was known when.
ADR 0041 already separates capture, validation, assertion state, and typed
relationships; this ADR fixes the epistemic vocabulary used by the
[context map](0043-curiosity-retrieval-bounded-contexts-and-contracts.md),
[source access](0044-source-surfaces-connectors-and-retrieval-modes.md),
[investigation](0047-investigation-ranking-and-stopping-semantics.md), and
[migration](0048-retrieval-migration-topology-and-qualification.md). Canonical
Ledger authority remains governed by plugin
[ADR 0024](../../../plugin/opencode2/docs/decisions/0024-durable-ledger-v2-and-capture-authority.md).

## Decision

Use four non-interchangeable records:

1. A **candidate** is a bounded, untrusted source observation proposed for
   inspection. It may be transient and has no truth or memory authority.
2. **Evidence** is immutable attributable material: committed capture/derived
   receipts plus exact span refs and provenance. Evidence establishes what was
   observed, not that its content is true.
3. A **remembered belief** is an immutable revision recording a proposition,
   an immutable ordered evidence-set identity, validator/policy, uncertainty,
   relationships, and the bitemporal interval under which Curiosity held it.
4. An **active assertion** is a remembered-belief revision whose
   Ledger-authoritative assertion lifecycle state is `ACTIVE`. `ACTIVE` is only
   an assertion lifecycle state: it does not establish query eligibility,
   authorization freshness, validation currency, or deletion state. Serving
   projections may reflect the state but cannot establish it, and activation
   never overwrites history.

An evidence set is content-addressed over canonical typed evidence/relationship
refs and policy context. It is append-never: adding, removing, or reinterpreting
evidence creates a new evidence-set ID and belief revision linked by
`supersedes` or `invalidated_by`. Supersession is not an assertion or belief
state; it is an append-only typed relationship between revisions and may be
accompanied by a separately recorded lifecycle transition. Equal spans may
participate in multiple sets; sets do not own evidence.

Assertion state, query eligibility, authorization freshness, validation
currency, and deletion state are recorded as orthogonal dimensions with their
own reasons, policy/snapshot refs, and clocks. Current serving eligibility is a
separately derived policy result over those dimensions plus the requested scope
and required custody, integrity, and continuity checks. Unknown, stale, revoked,
tombstoned, or otherwise disqualifying inputs fail closed; no projection or
single dimension can establish the result. For example:

| Assertion state | Query eligibility | Authorization | Validation | Deletion | Current serving result          |
| --------------- | ----------------- | ------------- | ---------- | -------- | ------------------------------- |
| `ACTIVE`        | `suppressed`      | `current`     | `current`  | `live`   | Not served: query suppressed    |
| `ACTIVE`        | `eligible`        | `stale`       | `current`  | `live`   | Not served: authorization stale |

Thus an assertion can remain `ACTIVE` while policy suppresses it or while its
authorization snapshot is stale. A later eligibility, authorization,
validation, deletion, or supersession event does not rewrite assertion history.

All beliefs and relationships are bitemporal. **Valid time** says when the claim
is asserted to hold in the source/domain and may be open or unknown.
**Transaction time** says when the exclusive Ledger authority recorded each
revision; it is closed by a later event, never rewritten. `observed_at`,
`captured_at`, and source publication time remain distinct event attributes and
must not substitute for either axis. Queries state `valid_as_of` and
`known_as_of` or explicitly use current defaults disclosed in the response.

Uncertainty is typed, not one scalar: `epistemic_state` (`SUPPORTED | DISPUTED |
INSUFFICIENT | UNKNOWN`), policy-qualified confidence or calibrated interval when
available, provenance completeness, temporal applicability, and explicit
unknown reasons. Retrieval/rank scores remain separate and cannot populate
confidence. Contradictions preserve both evidence sets and invoke versioned
adjudication; they are not averaged away.

Decision explanations are bounded records containing the decision/plan version,
selected and rejected action codes, evidence-set and policy refs, contradiction
and uncertainty summaries, decisive rule codes, timestamps, and size/truncation
metadata. They contain no raw chain-of-thought, hidden prompts, unrestricted tool
payloads, or model-private reasoning. Human-authored rationale, when permitted,
is bounded, classified, and separately attributable.

## Invariants

- Candidate is not evidence; evidence is not belief; belief identity is not
  assertion state; `ACTIVE` is neither query eligibility nor authorization.
- Assertion state, query eligibility, authorization freshness, validation
  currency, and deletion state remain orthogonal.
- Evidence and evidence sets are immutable; correction creates revisions.
- Valid time and transaction time are independent and explicit.
- Unknown is not false, zero confidence, or absent.
- Raw chain-of-thought is neither requested nor persisted.

## Implementation boundaries

This ADR does not select a confidence calculus, autonomous validator, generated
answer system, graph database, retention policy, or production schema. It does
not authorize persistence of reasoning, evidence, or beliefs. Existing
EventCapture digest-only and bounded Ledger rationale behavior remains intact.

## Consequences

Curiosity can answer “what did we believe, on what evidence, for what period, and
when did we know it?” without rewriting history. Storage and query complexity
increase, and consumers must handle explicit uncertainty and two time axes.

## Rejected alternatives

- **One mutable memory row:** destroys historical and decision reproducibility.
- **Rank score as confidence:** conflates relevance with epistemic support.
- **Latest source wins:** ignores valid-time scope and source authority.
- **Store raw chain-of-thought for explainability:** creates privacy/security
  exposure without a stable decision contract.

## Unresolved owner decisions

- Epistemic-policy owner: proposition canonicalization, validator classes,
  confidence vocabularies, and dispute resolution.
- Data/privacy/legal owners: bounded rationale fields, classifications,
  retention, export, and erasure treatment.
- Product owner: default `valid_as_of`/`known_as_of` behavior and explanation
  limits.

## Evidence and references

- ADR 0041 defines assertion states, typed relationships, and orthogonal
  lifecycle dimensions (`apps/runtime/docs/decisions/0041-unified-retrieval-memory-evidence-substrate.md:96-130`).
- The development codec already separates assertion state, valid time, evidence
  spans, producer, validator, and policy (`apps/plugin/opencode2/src/features/evidence/domain.ts:3-62,152-235`).
- EventCapture omits payloads and Loop/Ledger retain lineage plus bounded
  rationale, not full reasoning
  (`apps/runtime/docs/research/reverse-engineering-retrieval-memory-systems-2026-08-18.md:117-139`).
- ISO/IEC 9075 temporal semantics are summarized by the DB2 documentation for
  [application-period and system-period temporal tables](https://www.ibm.com/docs/en/db2/11.5.x?topic=tables-temporal).
