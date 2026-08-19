# ADR 0047: investigation, ranking, and stopping semantics

**Status:** Proposed recommendation — 2026-08-18; design only, not
implementation, production-persistence, or irreversible-migration authority

## Context

Lexical, semantic, live-source, indexed, freshness, provenance, and policy scores
do not share a universal scale. A single quality number would hide source and
time differences, while an unconstrained agentic loop would make retrieval cost,
coverage, and stopping non-reproducible.

This ADR governs Investigation within the [context map](0043-curiosity-retrieval-bounded-contexts-and-contracts.md)
and uses [source modes](0044-source-surfaces-connectors-and-retrieval-modes.md),
[epistemic records](0045-epistemic-records-and-bitemporal-memory.md),
[security](0046-retrieval-authority-security-and-mcp-boundary.md), and
[migration gates](0048-retrieval-migration-topology-and-qualification.md). The
substrate and canonical authority remain governed by
[ADR 0041](0041-unified-retrieval-memory-evidence-substrate.md) and plugin
[ADR 0024](../../../plugin/opencode2/docs/decisions/0024-durable-ledger-v2-and-capture-authority.md).

## Decision

Investigation is a bounded staged state machine:

1. **Frame:** normalize the question, tenant/purpose, valid/known-as-of times,
   required source surfaces, uncertainty tolerance, and budgets.
2. **Authorize and plan:** authorize before manifest/source/index access; select
   explicit indexed/live/hybrid legs and record unsupported capabilities.
3. **Retrieve:** execute bounded legs and retain per-leg candidates, scores,
   snapshots, freshness, coverage, exclusions, and failures.
4. **Normalize and stratify:** normalize only typed fields; partition candidates
   into comparable strata by retrieval objective, source surface/class, mode,
   time window, policy/eligibility class, and score algorithm/version.
5. **Fuse within strata:** use a declared deterministic method such as rank-based
   fusion only within a comparable stratum. Preserve original ranks/scores and
   algorithm versions. Cross-stratum selection uses explicit plan quotas or
   policy priorities, never arithmetic normalization into one scalar.
6. **Adjudicate:** group typed duplicates without identity merge; evaluate
   `supports`, `contradicts`, `supersedes`, valid time, known time, freshness,
   source authority for the claim type, and uncertainty. Contradictions remain
   visible; newer is not automatically truer.
7. **Decide next action or stop:** emit one bounded policy-approved next action
   or a typed stop decision and bounded explanation.

There is no universal “quality,” “truth,” or portable relevance scalar. Ranking
features remain a vector with declared semantics. An active assertion can affect
eligibility but does not receive an artificial rank boost unless an identified
ranking policy says so.

Next actions come from a closed versioned vocabulary such as refine query,
retrieve another authorized stratum/page, request a fresher live observation,
seek contradiction or primary evidence, request human adjudication, or stop.
Each includes expected information gain class, remaining budget, required
authority, and reason codes; it contains no raw chain-of-thought and cannot
execute itself.

Stop on the first applicable typed condition: objective satisfied under declared
evidence/uncertainty threshold; budget/deadline/page/iteration exhausted; no
authorized action can reduce material uncertainty; required capability or source
unavailable; policy/freshness/coverage makes delivery unsafe; contradiction
requires owner adjudication; or explicit cancellation. “No results” is not
automatically objective satisfied. Every stop discloses residual uncertainty,
coverage, failures, and the rule that stopped the plan.

## Invariants

- Fusion occurs only inside an explicitly comparable stratum.
- Original per-retriever ranks/scores and snapshots remain inspectable.
- Relevance score is not epistemic confidence, freshness, source authority, or
  authorization.
- Contradiction and temporal supersession are adjudicated, never silently
  deduplicated.
- Plans, next actions, and explanations are bounded, versioned, non-executable
  records without raw chain-of-thought.

## Implementation boundaries

No vector store, reranker, LLM planner, fusion constants, autonomous action,
graph traversal, or generated answer is selected. The current lexical behavior
is not changed. Production thresholds and persistence remain unauthorized.

## Consequences

Results remain explainable across heterogeneous retrievers, and investigation
terminates deterministically under budgets. Some candidates cannot be globally
ordered; clients must present strata and uncertainty rather than one leaderboard.

## Rejected alternatives

- **Min-max/calibrate everything into one score:** invents comparability.
- **Global reciprocal-rank fusion:** rank position across different objectives
  and policy/time strata has no shared meaning.
- **Newest or most frequent wins:** confuses recency/repetition with truth.
- **Loop until the model is satisfied:** has no stable acceptance or cost bound.
- **Hide contradictions to improve answer clarity:** destroys epistemic fidelity.

## Unresolved owner decisions

- Retrieval/evaluation owners: first stratum definitions, fusion method, quotas,
  and fixture judgments.
- Product/epistemic owners: objective-satisfied and uncertainty thresholds.
- Operations owner: page, byte, latency, iteration, and source-call budgets.
- Domain owners: source-authority and temporal-adjudication policies by claim
  type.

## Evidence and references

- Current M2 lexical and SearXNG scores have different response semantics
  (`apps/runtime/docs/research/reverse-engineering-retrieval-memory-systems-2026-08-18.md:34-55`).
- ADR 0041 explicitly excludes portable absolute ranking scores and requires
  contradiction/supersession relationships
  (`apps/runtime/docs/decisions/0041-unified-retrieval-memory-evidence-substrate.md:96-111,196-215`).
- Cormack, Clarke, and Buettcher, “Reciprocal Rank Fusion Outperforms Condorcet
  and Individual Rank Learning Methods,”
  [SIGIR 2009 DOI](https://doi.org/10.1145/1571941.1572114). This informs an
  optional within-stratum technique, not universal score comparability.
