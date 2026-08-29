# ADR-020: iPadOS governed on-device memory curation

**Status:** Accepted — 2026-08-29  
**Decision history:** The user accepted Apple Intelligence as Curiosity's local
memory manager, with Curiosity retaining durable and policy authority, and
requested a software architecture on 2026-08-29. The detailed event and policy
contracts were accepted as implementation authority with ADR-017 through ADR-021
on 2026-08-29.  
**Authority:** Authorizes implementation of this architecture. It does not
authorize a memory retention default, automatic capture of sensitive
information, physical erasure claim, or release use.

## Context

The on-device model's small total context makes it unsuitable as Curiosity's
unbounded application orchestrator but well suited to private, bounded memory
tasks: extracting durable facts and preferences, identifying decisions and
commitments, compacting old dialogue, formulating retrieval queries, and
reranking a small candidate set.

Model output remains nondeterministic and can misclassify sensitivity, invent
facts, emit stale updates, or over-retain transient content. The append-only
journal and single-authority rules therefore cannot be delegated to the model.

## Decision

1. Foundation Models acts as a semantic memory curator. `PortableAuthority`
   alone validates and admits memory commands and events.
2. Curation uses a dedicated structured native host and schema, not free-form
   chat text and not a model-owned tool loop.
3. Each curation job is durably identified by source turn/message identities,
   source digest, policy version, and exact `memory.curate` route selection.
   Re-execution is idempotent.
4. Proposals are bounded to create, retain, supersede, or suggest retirement.
   They include exact source messages, observed memory version when applicable,
   kind, content, confidence, proposed sensitivity, and proposed retention.
5. Deterministic authority policy validates bounds and provenance, rejects stale
   versions, deduplicates canonical content, applies a sensitivity floor, scans
   for credential-like content, and decides automatic admission versus review.
   Model confidence and classification can never lower policy restrictions.
6. Retrieval first uses a bounded deterministic local query. The local model may
   rerank at most 12 returned active-memory candidates and may return only known
   memory identities and relevance labels.
7. Memory curation, query formulation, compaction, and reranking select the
   on-device route by default. Model unavailability leaves the operation
   explicitly pending/unavailable and never sends memory to a frontier route.
8. Frontier disclosure requires a separate authority plan based on user policy,
   purpose, sensitivity, connection, and exact active memory versions. The
   disclosure receipt records identities/digests and policy version.
9. Curiosity treats 4,096 tokens as the complete Foundation Models
   input-plus-output envelope and allocates no more than 3,480 estimated tokens.
   Every local call is one bounded operation; larger compaction is an
   authority-owned chunk workflow with provenance at each step.
10. Retirement and forgetting are logical projection/retrieval operations.
    Because prior content remains in the append-only journal, this decision makes
    no physical or cryptographic erasure claim.

## Invariants

- **ADR-020-I01:** No model or native host directly writes memory or journal
  state.
- **ADR-020-I02:** Every active memory has admitted provenance to exact source
  messages and a versioned policy decision.
- **ADR-020-I03:** A stale, malformed, unknown-source, or secret-like proposal
  cannot mutate active memory.
- **ADR-020-I04:** The model never receives an unbounded conversation or memory
  archive.
- **ADR-020-I05:** Memory does not cross to a frontier route without a separate
  disclosure authorization.
- **ADR-020-I06:** On-device model failure cannot silently become frontier
  curation.
- **ADR-020-I07:** Logical forgetting is not represented as physical erasure.

## Consequences

Apple Intelligence receives a continuous, high-value local role while the small
context window remains manageable. Curiosity can build compact, provenance-rich
context without replaying full conversations. Memory quality becomes measurable
separately from chat quality.

This adds memory-domain commands, projections, policy, structured native output,
retrieval, review UI, and lifecycle reconciliation. Sensitive retention defaults
must be selected before activation. The current free-text Foundation Models host
cannot satisfy this decision without a separate structured curation boundary and
total-context assembler.

## Rejected alternatives

- **Model writes SQLite directly:** creates a second semantic authority and
  bypasses admission, provenance, and policy.
- **Full archive in every prompt:** exceeds the local context envelope and leaks
  irrelevant sensitive material.
- **Model-only sensitivity classification:** treats nondeterministic output as a
  security decision.
- **Frontier fallback for curation:** silently changes the privacy boundary.
- **Hard deletion event in an append-only log:** hides retrieval while falsely
  claiming historical bytes were erased.

## Binary acceptance checks

- [ ] **ADR-020-AC01:** Decoder/property tests reject unknown enums, oversize
      content, too many proposals, unknown sources, invalid confidence, stale
      versions, and malformed structured output.
- [ ] **ADR-020-AC02:** Replaying the same curation job cannot create a second
      admitted memory version.
- [ ] **ADR-020-AC03:** Credential-like and policy-restricted candidates perform
      zero active-memory writes; elevated allowed candidates require the named
      review gate.
- [ ] **ADR-020-AC04:** Retrieval returns only active authorized versions, and a
      reranker result containing any unknown ID is rejected as a whole.
- [ ] **ADR-020-AC05:** Context assembly stays inside the qualified total
      envelope or fails before model dispatch with
      `FOUNDATION_MODEL_CONTEXT_EXCEEDED`.
- [ ] **ADR-020-AC06:** Physical-device tests cover extraction, supersession,
      compaction, reranking, cancellation, guardrails, model unavailability,
      backgrounding, relaunch, and stale-result isolation.
- [ ] **ADR-020-AC07:** Frontier network fixtures prove zero memory disclosure
      without a prior matching authorization and exact memory-version set.
- [ ] **ADR-020-AC08:** UI and documentation distinguish retirement/logical
      forgetting from physical erasure.

## Non-goals

No autonomous deletion, exact-tokenizer claim, embeddings-provider selection,
cross-device memory sync, collaboration conflict model, physical erasure,
automatic frontier memory processing, or memory-quality/release claim.
