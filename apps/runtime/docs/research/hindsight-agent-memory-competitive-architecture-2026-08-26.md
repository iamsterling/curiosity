# Hindsight and agent memory systems: competitive architecture record

**Date:** 2026-08-26  
**Status:** research only; no implementation, dependency, corpus, service, or
production authority  
**Decision target:** Curiosity custom harness long-term memory  
**Method:** primary documentation and clean-room static inspection of public
source at pinned revisions; no cloud account, credentials, private endpoint,
access-control bypass, or proprietary implementation was inspected

## Executive decision

Curiosity should **not adopt any surveyed product as canonical memory
authority**. The harness's immutable events, evidence candidates, and eventual
Ledger validation lifecycle solve a different and more consequential problem
than the products' principal objective: recalling useful context.

The recommended disposition is:

| System                     | Market/architecture bet                                                                       | Curiosity disposition                                                                                                                        |
| -------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Hindsight**              | Structured retained facts, observations, mental models, hybrid recall, and reflection         | **BENCHMARK** as the first replaceable recall projection; **ADAPT** retrieval traces, token budgets, observation lineage, and UI drill-downs |
| **Mem0**                   | Low-friction extracted memories over vector, keyword, and entity retrieval                    | **DEFER** as an optional extraction/retrieval baseline; **REJECT** as authority                                                              |
| **Graphiti**               | Temporal context graph with source episodes and valid-time relationships                      | **ADAPT** valid-time and episode-lineage concepts; **DEFER** a graph projection and **REJECT** graph state as truth                          |
| **Letta Code**             | A stateful harness whose agents rewrite git-backed memory and skills                          | **ADAPT** isolated, diffable reflection worktrees; **REJECT** replacing Curiosity's harness or letting a merge imply validation              |
| **Cognee**                 | Corpus/session ingestion into authorized graph and vector stores with pipelines               | **DEFER** integration; **ADAPT** cross-store integrity and provenance checks where independently useful                                      |
| **Supermemory**            | Managed/local context platform combining memory, RAG, profiles, connectors, and hybrid search | **DEFER** until the core engine and claims can be independently evaluated; **REJECT** as authority                                           |
| **Owned lexical baseline** | Transparent exact/BM25 retrieval over eligible canonical records                              | **OWN** for evaluation and fallback; this report does not authorize implementation                                                           |

Hindsight is the best first challenger because it combines the strongest
retrieval pipeline, source-visible observations, explicit token budgets, and
diagnostic UI of the surveyed provider-shaped systems. Graphiti contributes the
strongest temporal relationship model. Letta contributes the strongest
reflection-change isolation pattern. These strengths should remain separable.

The minimum lifecycle remains:

```text
observe → propose → adjudicate → recall → synthesize
```

`retain`, graph extraction, consolidation, profile generation, reflection, and
all other model-authored transformations map to **propose** or **synthesize**.
They never map directly to **adjudicate**.

## Decision frame and sufficient coverage

The decision is whether Curiosity should adopt a memory product, adapt selected
mechanisms, or benchmark products only. Comparison dimensions follow from that
decision rather than from vendor feature lists:

1. authority and validation semantics;
2. source custody and provenance;
3. temporal, contradiction, and supersession semantics;
4. retrieval quality architecture and explainability;
5. authorization, isolation, and deletion propagation;
6. projection disposability and reconstructibility;
7. harness/runtime coupling;
8. operational and licensing constraints; and
9. evidence that memory improves decisions under bounded cost.

Coverage is sufficient when each dimension has primary-source evidence or an
explicit unknown, the closest architecture families are represented, and
additional discovery no longer changes the recommendation. The six systems
cover structured hybrid memory, extracted vector memory, temporal graphs,
agent-owned filesystem memory, corpus-to-graph memory, and a managed context
platform. A transparent owned lexical reader is the control.

Claim labels used below:

- **Documented:** directly supported by inspected public source or primary docs.
- **Vendor/author claim:** reported by a product or paper author and not treated
  as independent measurement.
- **Inference:** Curiosity's architectural interpretation of documented facts.
- **Unknown:** not established by the permitted evidence.

## Curiosity baseline and non-negotiable boundary

### Documented current state

- The custom harness records immutable hash-linked events under one Effect
  authority and rebuilds read-only projections from them
  ([harness README](../../../custom-harness/README.md)).
- `observations.ts` classifies events by category and taint, writes a generic
  event summary, and retains only the latest 256 projected observations
  ([source](../../../custom-harness/src/plugins/observations.ts)). This is useful
  telemetry scaffolding, not long-term semantic memory.
- `evidence.ts` requires source-event and Ledger bindings and projects every
  candidate as `PENDING`, `PROVISIONAL`, and `authority: "none"`
  ([source](../../../custom-harness/src/plugins/evidence.ts)). Its current
  context block remains explicitly `untrusted-evidence`.
- ADR 0041 requires immutable capture, explicit validation, orthogonal lifecycle
  dimensions, typed contradictions/supersession, authorization before retrieval
  and before serialization, tombstones, rebuildable projections, and a minimum
  evidence envelope
  ([ADR 0041](../decisions/0041-unified-retrieval-memory-evidence-substrate.md)).
- Unified retrieval and validated memory are disabled and NO-GO for the current
  scope ([status](../../../../docs/status/current.md#runtime-unified-evidence)).

### Architectural consequence

A URL, model statement, extracted fact, embedding neighbor, graph edge,
observation, profile, or summary is not validated memory. A provider may rank or
synthesize eligible evidence but may not:

- create canonical truth;
- promote its own output;
- erase contradictory history;
- bypass principal, purpose, policy, freshness, or tombstone checks; or
- make its private database necessary to reconstruct custody or validation.

This boundary is stricter than every surveyed product's default content model.

## Market map

The products are competitors only at different layers:

```text
Full stateful harness       Letta Code
                            ───────────────────────────────
Memory/context service      Hindsight  Mem0  Supermemory
                            ───────────────────────────────
Temporal graph framework    Graphiti
                            ───────────────────────────────
Knowledge pipeline          Cognee
                            ───────────────────────────────
Transparent retrieval       Curiosity-owned lexical control
```

Treating them as one interchangeable category obscures the main decision.
Letta competes with the harness. Graphiti and Cognee compete with possible
projection and knowledge-processing layers. Hindsight, Mem0, and Supermemory
offer provider-shaped memory APIs.

## Comparative evidence matrix

`Strong` means the inspected source has an explicit, reusable mechanism. It does
not mean the mechanism satisfies Curiosity's authority standard.

| Dimension                    | Hindsight                                                                                  | Mem0                                                                                           | Graphiti                                                                      | Letta Code                                                                           | Cognee                                                                          | Supermemory                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Source lineage               | **Strong:** documents, units, source facts, observation proof counts/history               | **Mixed:** message-derived memory plus metadata/history; no exact evidence span contract found | **Strong:** episodes referenced by relationship edges                         | **Mixed:** git commits/diffs preserve edits, but memory prose need not cite evidence | **Strong:** document/chunk/entity provenance pipeline                           | **Unknown/mixed:** source document and relation IDs appear in APIs; core derivation not source-inspected |
| Valid-time model             | **Strong:** extracted temporal data and temporal retrieval                                 | **Mixed:** timestamps/expiry; additive facts can accumulate                                    | **Strongest:** `valid_at`, `invalid_at`, `expired_at`, episode reference time | **Weak:** chronology is primarily git/conversation history                           | **Strong:** optional temporal extraction and contradiction tasks                | **Documented claim:** updates, expiry, forgetting; implementation unknown                                |
| Contradiction handling       | Model consolidation refines observations                                                   | Additive extraction avoids automatic destructive mutation; caller CRUD remains                 | LLM selects contradicted edges, then code invalidates by time                 | Reflection agent edits files; git conflict is operational, not semantic dispute      | Opt-in contradiction detection and temporal resolution                          | Vendor describes automatic resolution and forgetting                                                     |
| Retrieval                    | **Strongest provider:** semantic + BM25 + graph + temporal, RRF, reranker, boosts, budgets | Vector + keyword + entity boosts; optional rerank                                              | BM25 + cosine + BFS with configurable rerank                                  | Agent/file search and always-in-context files; tightly coupled to harness            | Multiple graph/vector/chunk retrieval modes                                     | Hybrid RAG + memory via API; core ranking unknown                                                        |
| Retrieval explanation        | **Strong:** arm results, graph visits, RRF, rerank factors, traces                         | `explain` surface exists; less complete than Hindsight                                         | Search methods/config explicit; result rationale is lower-level               | Git diffs explain changes, not why a memory was retrieved                            | Pipeline/provenance and validation reports; ranking explanation varies          | Timing and memory relation fields exposed; ranking internals unknown                                     |
| Authorization/isolation      | Operation-validator extension, request context, allowed banks/tags                         | Required user/agent/run filters are scope, not proof of caller authority                       | `group_id` partitions graph; bundled routes did not show equivalent auth      | Filesystem confinement prevents one memory subagent reading another agent's memory   | Dataset permissions, tenants/roles, and per-dataset DB context                  | OAuth/API keys and container-tag RBAC visible in MCP/client source                                       |
| Deletion proof               | Delete APIs exist; no Curiosity-style cross-layer erasure proof                            | Vector delete plus history record; no backup/projection erasure proof                          | Group/node deletion; no tombstone lifecycle found                             | Git deletion preserves history unless rewritten, which conflicts with erasure needs  | `forget` plus graph/vector validation; full backup expiry proof not established | Delete/forget fields exposed; physical and backup erasure unknown                                        |
| Disposable projection fit    | **Good if adapter-owned:** API can be downstream of Ledger                                 | **Good technically**, but extraction/history semantics need containment                        | **Good** as a graph projection                                                | **Poor:** memory is part of the agent runtime                                        | **Mixed:** broad pipeline owns substantial derived state                        | **Mixed/unknown:** API-shaped, but hosted/local core would own derived state                             |
| Harness coupling             | Low to medium                                                                              | Low                                                                                            | Low to medium                                                                 | **Very high**                                                                        | Medium to high                                                                  | Low at API boundary                                                                                      |
| Inspected repository license | MIT                                                                                        | Apache-2.0                                                                                     | Apache-2.0                                                                    | Apache-2.0                                                                           | Apache-2.0                                                                      | MIT for the inspected monorepo; local/core distribution terms not established here                       |

No `Strong` cell transfers lifecycle authority. In particular, provenance to a
model-extracted fact is not necessarily provenance to exact captured bytes, and
an invalidation timestamp is not a validated contradiction decision.

## Product dossiers

### 1. Hindsight

**Positioning.** A self-hostable/cloud agent-memory system organized around
`retain`, `recall`, and `reflect`, with world facts, experiences, observations,
mental models, and isolated banks.

**Documented architecture.** At inspected revision
[`dc1664d0c741`](https://github.com/vectorize-io/hindsight/tree/dc1664d0c7416598c5a68a9cd70467ac38ed8bda):

- `retain` uses an LLM to extract facts, temporal data, entities, and
  relationships
  ([README](https://github.com/vectorize-io/hindsight/blob/dc1664d0c7416598c5a68a9cd70467ac38ed8bda/README.md#the-three-operations)).
- Recall runs semantic, BM25, graph, and temporal arms, then RRF, cross-encoder
  reranking, recency/temporal/proof boosts, and token trimming
  ([retrieval](https://github.com/vectorize-io/hindsight/blob/dc1664d0c7416598c5a68a9cd70467ac38ed8bda/hindsight-api-slim/hindsight_api/engine/search/retrieval.py),
  [fusion](https://github.com/vectorize-io/hindsight/blob/dc1664d0c7416598c5a68a9cd70467ac38ed8bda/hindsight-api-slim/hindsight_api/engine/search/fusion.py),
  [reranking](https://github.com/vectorize-io/hindsight/blob/dc1664d0c7416598c5a68a9cd70467ac38ed8bda/hindsight-api-slim/hindsight_api/engine/search/reranking.py)).
- Consolidation asks an LLM to create or update observations while preserving
  source-fact IDs and proof counts
  ([prompt](https://github.com/vectorize-io/hindsight/blob/dc1664d0c7416598c5a68a9cd70467ac38ed8bda/hindsight-api-slim/hindsight_api/engine/consolidation/prompts.py)).
- An operation-validator extension can reject or enrich requests before retain
  body processing and for recall/reflect/consolidation
  ([validator](https://github.com/vectorize-io/hindsight/blob/dc1664d0c7416598c5a68a9cd70467ac38ed8bda/hindsight-api-slim/hindsight_api/extensions/operation_validator.py)).
- The control plane exposes search traces, source facts, observation history,
  proof counts, LLM traces, token totals, and graph views
  ([search debug view](https://github.com/vectorize-io/hindsight/blob/dc1664d0c7416598c5a68a9cd70467ac38ed8bda/hindsight-control-plane/src/components/search-debug-view.tsx),
  [observation history](https://github.com/vectorize-io/hindsight/blob/dc1664d0c7416598c5a68a9cd70467ac38ed8bda/hindsight-control-plane/src/components/observation-history-view.tsx)).

**What transfers.** The API split, independent retrieval arms, bounded token
output, detailed rank trace, observation-to-source drill-down, and mental-model
concept are useful. A Curiosity mental model must be a disposable, versioned
synthesis with source refs and an explicit untrusted status.

**What does not transfer.** Extracted facts and consolidated observations enter
recallable memory without Curiosity's `PENDING → ACTIVE | DISPUTED | ...`
adjudication. Source-fact IDs and text are valuable lineage but are not by
themselves exact capture-span custody. A bank ID and validator extension also do
not replace Curiosity's two-stage authorization and freshness contract.

**Quality evidence.** The Hindsight paper reports 91.4% on LongMemEval and up to
89.61% on LoCoMo, while the current vendor benchmark page reports 94.6% on its
LongMemEval S run. These are author/vendor results, not Curiosity reproduction
([paper](https://arxiv.org/abs/2512.12818),
[benchmark](https://benchmarks.hindsight.vectorize.io/)).

**Verdict:** first provider to **BENCHMARK**; selectively **ADAPT**; never make it
canonical.

### 2. Mem0

**Positioning.** A simple memory layer centered on `add`, `search`, and scoped
user/agent/run memories.

**Documented architecture.** At inspected revision
[`39bc02330563`](https://github.com/mem0ai/mem0/tree/39bc02330563764e7d4465f1ecff5f002d94da1a):

- Current OSS inferred ingestion runs a phased **additive** pipeline: retrieve
  existing memories, ask an LLM for new memory text, hash-deduplicate exact text,
  batch persist, record `ADD` history, and link entities
  ([source](https://github.com/mem0ai/mem0/blob/39bc02330563764e7d4465f1ecff5f002d94da1a/mem0/memory/main.py#L879-L1103)).
- Search requires at least one `user_id`, `agent_id`, or `run_id` filter and can
  combine semantic and provider keyword results with entity boosts
  ([source](https://github.com/mem0ai/mem0/blob/39bc02330563764e7d4465f1ecff5f002d94da1a/mem0/memory/main.py#L1379-L1518)).
- Explicit update/delete and per-memory history remain available
  ([source](https://github.com/mem0ai/mem0/blob/39bc02330563764e7d4465f1ecff5f002d94da1a/mem0/memory/main.py#L1817-L2128)).

**Contradiction found.** The `add()` docstring still says inference can decide
add/update/delete, while the inspected V3 path uses the additive extraction
prompt and emits `ADD` records. Platform/OSS/version documentation must not be
collapsed into one behavior claim.

**Fit.** Additive ingestion is safer than model-directed destructive mutation,
but exact-text dedup is not semantic contradiction adjudication. Entity filters
are useful scoping fields but do not authenticate the caller. Explicit deletion
from a vector store while retaining history also cannot establish complete
erasure.

**Verdict:** **DEFER** as a secondary baseline; **REJECT** as authority.

### 3. Graphiti

**Positioning.** An incremental temporal context graph for evolving agent data.

**Documented architecture.** At inspected revision
[`683a8539c892`](https://github.com/getzep/graphiti/tree/683a8539c8925de69071a1305dc8bf0e52e17c65):

- Episodes preserve source content and graph relationships reference episode
  IDs; entity edges carry `valid_at`, `invalid_at`, `expired_at`, and reference
  time
  ([README](https://github.com/getzep/graphiti/blob/683a8539c8925de69071a1305dc8bf0e52e17c65/README.md),
  [edge model](https://github.com/getzep/graphiti/blob/683a8539c8925de69071a1305dc8bf0e52e17c65/graphiti_core/edges.py#L263-L284)).
- Search supports BM25, cosine similarity, breadth-first traversal, and
  configurable reranking
  ([search config](https://github.com/getzep/graphiti/blob/683a8539c8925de69071a1305dc8bf0e52e17c65/graphiti_core/search/search_config.py)).
- Edge extraction, deduplication, timestamp extraction, and contradiction
  selection invoke an LLM. Deterministic code then applies invalidation semantics
  to selected candidates
  ([edge operations](https://github.com/getzep/graphiti/blob/683a8539c8925de69071a1305dc8bf0e52e17c65/graphiti_core/utils/maintenance/edge_operations.py#L630-L847)).

**Fit.** Episodes and valid-time intervals are the strongest reusable concepts
in the survey. The graph nevertheless contains model-derived assertions. Its
`group_id` is explicitly a graph partition, not proof that a principal may read
it. Curiosity should record typed relationships canonically first and defer a
graph engine, as ADR 0041 already requires.

**Verdict:** **ADAPT** temporal and provenance semantics; **DEFER** provider use.

### 4. Letta Code

**Positioning.** A stateful agent harness, not a standalone retrieval provider.

**Documented architecture.** At inspected revision
[`ad7e6cf5ff78`](https://github.com/letta-ai/letta-code/tree/ad7e6cf5ff78c0e757770d66fcf04462a0e65c92):

- Agents rewrite their own memory, skills, prompts, and harness extensions;
  MemFS tracks context in git
  ([README](https://github.com/letta-ai/letta-code/blob/ad7e6cf5ff78c0e757770d66fcf04462a0e65c92/README.md#feature-overview)).
- A background reflection agent edits memory and reusable skills, is limited to
  Bash/Edit, and must commit changes
  ([reflection prompt](https://github.com/letta-ai/letta-code/blob/ad7e6cf5ff78c0e757770d66fcf04462a0e65c92/src/agent/subagents/builtin/reflection.md)).
- Reflection occurs in a separate git worktree; committed changes are merged,
  no-ops are cleaned up, and merge conflicts leave the transcript eligible for
  retry
  ([worktree source](https://github.com/letta-ai/letta-code/blob/ad7e6cf5ff78c0e757770d66fcf04462a0e65c92/src/agent/memory-worktree.ts)).
- Memory subagents use a fail-closed filesystem confinement launcher that may
  write their own memory but cannot read or write another agent's memory
  ([confinement](https://github.com/letta-ai/letta-code/blob/ad7e6cf5ff78c0e757770d66fcf04462a0e65c92/src/memory-confinement.ts)).

**Fit.** The worktree pattern makes reflection inspectable, attributable,
retryable, and conflict-aware. A successful merge is still only operational
publication of model-authored prose; it does not prove the prose true. Letta's
harness ownership, cloud agent state, prompts, and tools would duplicate or
displace Curiosity's accepted authority boundary.

**Verdict:** **ADAPT** proposal isolation and diffs; **REJECT** harness adoption.

### 5. Cognee

**Positioning.** A broad knowledge/memory pipeline spanning documents, sessions,
graphs, vectors, permissions, and multiple retrieval modes.

**Documented architecture.** At inspected revision
[`690c0ec02371`](https://github.com/topoteretes/cognee/tree/690c0ec023719a2a277dc893cdecfec1ca8012cc):

- `cognify` chunks documents, uses an LLM to extract/summarize a graph, persists
  nodes/edges/embeddings, records provenance, and can run contradiction and
  temporal-resolution tasks
  ([pipeline](https://github.com/topoteretes/cognee/blob/690c0ec023719a2a277dc893cdecfec1ca8012cc/cognee/api/v1/cognify/cognify.py)).
- Backend access control supports users, tenants, roles, dataset permissions,
  and per-dataset database context
  ([context](https://github.com/topoteretes/cognee/blob/690c0ec023719a2a277dc893cdecfec1ca8012cc/cognee/context_global_variables.py)).
- Its `validate` API checks graph/vector integrity, duplicate identities,
  dangling edges, and missing vector entries
  ([validation](https://github.com/topoteretes/cognee/blob/690c0ec023719a2a277dc893cdecfec1ca8012cc/cognee/api/v1/validate/validate.py)).

**Hypothesis update.** Cognee is no longer accurately described as merely a
corpus-to-graph tool. It has meaningful provenance, authorization, temporal,
session-memory, and integrity mechanisms. However, its validation report checks
whether derived stores agree, not whether an LLM-extracted assertion is
epistemically validated. Its breadth also introduces more authority and
operational overlap than a narrow Curiosity provider seam should permit.

**Verdict:** **DEFER** integration; selectively **ADAPT** integrity checks.

### 6. Supermemory

**Positioning.** A hosted and local context platform combining memory, RAG, user
profiles, connectors, file processing, and hybrid search.

**Documented architecture.** At inspected revision
[`f11d8c4620b2`](https://github.com/supermemoryai/supermemory/tree/f11d8c4620b222e2bf701380545c6c5dcee70f9d):

- Documentation describes extracted facts, update relationships,
  contradiction resolution, automatic forgetting, static/dynamic profiles, and
  hybrid RAG+memory
  ([README](https://github.com/supermemoryai/supermemory/blob/f11d8c4620b222e2bf701380545c6c5dcee70f9d/README.md#how-memory-works-under-the-hood)).
- Public MCP/client source exposes memory version/source fields, relation and
  forgetting metadata, hybrid search, profiles, OAuth/API-key authentication,
  and container-tag RBAC
  ([client](https://github.com/supermemoryai/supermemory/blob/f11d8c4620b222e2bf701380545c6c5dcee70f9d/apps/mcp/src/server/client/index.ts),
  [RBAC](https://github.com/supermemoryai/supermemory/blob/f11d8c4620b222e2bf701380545c6c5dcee70f9d/apps/mcp/src/server/auth/rbac.ts)).
- The repository advertises a local server with an embedded graph engine and a
  cloud-compatible API
  ([local section](https://github.com/supermemoryai/supermemory/blob/f11d8c4620b222e2bf701380545c6c5dcee70f9d/README.md#supermemory-local--run-it-yourself)).

**Inspection limit.** The inspected monorepo contained web, MCP, documentation,
extension, and visualization applications, but not the memory engine source
needed to verify the documented contradiction, ranking, and forgetting
algorithms. The repository's MIT license must not be generalized to an
uninspected local/core distribution without checking that artifact's terms.

**Quality evidence.** Supermemory reports leading benchmark results and 95%
Recall@15 with about 720 tokens on LongMemEval. Its MemoryBench framework fixes a
common ingest/search/answer/evaluate pipeline, but both are vendor-produced
evidence until Curiosity reproduces them
([MemoryBench overview](https://supermemory.ai/docs/memorybench/overview)).

**Verdict:** **DEFER** pending source/artifact and Curiosity-workload evidence.

## Cross-product contradictions and negative results

1. **Two products claim to be #1.** Hindsight and Supermemory both publish
   leading-memory claims. Their datasets, dates, model stacks, adapters, judges,
   and metrics differ. Neither claim decides the Curiosity choice.
2. **Mem0 descriptions diverge.** The current OSS V3 path is additive, while an
   adjacent docstring still describes inferred add/update/delete. Exact revision
   and surface qualification are mandatory.
3. **“Contradiction-aware” is not one semantic.** It can mean rewriting an
   observation, adding another fact, invalidating a graph edge, editing a file,
   creating a contradiction edge, or automatically forgetting. None inherently
   means preserving two claims in a reviewable `DISPUTED` state.
4. **“Provenance” is not one guarantee.** Episode IDs, source-fact IDs, git
   commits, document IDs, and chunk links are useful, but only exact captured
   representations plus stable spans satisfy Curiosity's minimum evidence
   envelope.
5. **“Delete” is not erasure proof.** No inspected product demonstrated
   Curiosity's required tombstone, projection/cache removal, replica/export/
   snapshot tracking, backup expiry, and verified completion lifecycle.
6. **Graph visualization can mislead.** Link count, centrality, recency, proof
   count, and visual brightness are retrieval/exploration signals, not truth or
   confidence.
7. **No product proved decision improvement on Curiosity work.** Public memory
   benchmarks measure retrieval or answer correctness. They do not show whether
   a retrieved memory was used, changed a decision, improved the outcome, or
   would have been better omitted.

## Recommended Curiosity-native architecture

### Planes

```text
Canonical plane (Curiosity-owned)
  immutable events / captures / exact representations / spans
  candidate assertions and relationships
  adjudication state, policy, authorization, tombstones, audit
                         |
                         | authorized projection deltas only
                         v
Recall projection plane (replaceable)
  owned lexical | Hindsight adapter | future graph adapter
  indexes, embeddings, graph links, observations, rank traces
                         |
                         | hit IDs + reasons, never authority
                         v
Hydration and last-mile gate (Curiosity-owned)
  re-read canonical state, authorization, freshness, tombstone
                         |
                         v
Synthesis plane (untrusted)
  bounded context assembly / answer or recommendation proposal
                         |
                         v
Decision-use and outcome telemetry (Curiosity-owned events)
```

### Narrow provider seam

The seam should be provider-neutral and projection-only. Illustrative shapes,
not an implementation authorization:

```ts
type ProjectionRecord = {
  evidenceId: string;
  assertionRevision: number;
  representationId: string;
  spanId: string;
  inertText: string;
  validTime?: { from?: string; to?: string };
  relationshipRefs: readonly string[];
  authorizationScopeDigest: string;
  policySnapshot: string;
  tombstoneEpoch: number;
};

type RecallRequest = {
  requestId: string;
  principalScopeDigest: string;
  purpose: string;
  policySnapshot: string;
  projectionSnapshot: string;
  asOf: string;
  query: string;
  maxResults: number;
  maxTokens: number;
};

interface RecallProjection {
  rebuild(
    snapshot: string,
    records: AsyncIterable<ProjectionRecord>,
  ): Promise<RebuildReceipt>;
  apply(delta: ProjectionDelta): Promise<ProjectionReceipt>;
  recall(request: RecallRequest): Promise<RecallCandidates>;
  explain(requestId: string): Promise<RecallTrace>;
  purge(tombstones: readonly TombstoneRef[]): Promise<PurgeReceipt>;
  health(snapshot: string): Promise<ProjectionHealth>;
}
```

Required invariants:

1. There is no provider `retain()` route from a chat turn into canonical memory.
   Observation creates immutable input; extraction creates proposals;
   adjudication alone changes eligibility.
2. Only committed and currently eligible records enter ordinary recall
   projections. Pending or disputed data requires a separately authorized
   diagnostic projection and cannot share ordinary cache keys.
3. Provider candidates contain canonical IDs and ranking rationale. Curiosity
   hydrates the text and runs last-mile authorization/tombstone checks before
   serialization.
4. Deleting and rebuilding a provider from one canonical snapshot reproduces
   the same eligible ID set and stable diagnostics. Rank order may vary only with
   an identified algorithm/model snapshot.
5. Provider-generated observations, graph edges, profiles, and mental models are
   derived projection records or new proposals. They cannot recursively validate
   themselves.
6. `reflect` belongs in synthesis. A reflection output must identify its source
   recall, model/prompt/version, token use, and resulting proposal IDs.
7. Provider failure yields typed partial or unavailable recall. It cannot fall
   back to stale, unauthorized, or tombstoned content.

### Event vocabulary for proving use

Retrieval quality is insufficient without use and outcome evidence. A future
design should distinguish at least:

```text
memory.recall.requested
memory.recall.completed
memory.candidate.selected
memory.context.injected
memory.reference.cited
memory.decision.based-on
memory.outcome.observed
memory.counterfactual.compared
memory.projection.rebuilt
memory.tombstone.propagated
```

Each event should bind request, evidence IDs/revisions, projection and policy
snapshots, rank/strategy, token cost, decision/work ID, and actor. `selected`,
`injected`, `cited`, and `decision-based-on` are different facts. A model citing
a memory is not proof it helped.

## Evaluation plan

### Question

Does a Hindsight-backed **projection** improve Curiosity decisions over a
transparent owned lexical baseline, under equal evidence, answerer, token,
authorization, and time constraints?

### Systems

1. **No-memory control:** current-turn input only.
2. **Budget-matched full-context control:** eligible evidence in deterministic
   order, when it fits.
3. **Owned lexical baseline:** exact/BM25 retrieval with transparent scoring.
4. **Hindsight projection:** hybrid recall, with automatic extraction and
   consolidation disabled or excluded from the primary retrieval comparison.
5. **Optional later Graphiti projection:** only if temporal/relationship strata
   remain unresolved after Hindsight; not part of the first gate.

The primary test projects the **same adjudicated records** into every retriever.
A separate secondary test may evaluate each product's extraction/consolidation,
but model-generated outputs remain proposals and are scored separately. This
prevents extraction quality from being misreported as retrieval quality.

### Fixtures

Use versioned, project-authored, rights-cleared fixtures covering:

- exact and paraphrased recall;
- multiple sources with equal bytes;
- contradiction and unresolved dispute;
- supersession without erasing history;
- event time versus ingestion time;
- multi-hop typed relationships;
- duplicate content versus same entity;
- procedures and prior failure lessons;
- stale authorization and policy snapshots;
- cross-principal and cross-project isolation;
- tombstone propagation and erase-pending states;
- missing projection partitions and partial results; and
- tempting but irrelevant memories that should not be injected.

Every decision question needs a gold evidence set, prohibited evidence set,
expected abstention behavior, and a deterministic or blinded outcome rubric.

### Measures

| Layer          | Measures                                                                                  |
| -------------- | ----------------------------------------------------------------------------------------- |
| Retrieval      | Recall@k, MRR/nDCG where judgments support them, prohibited-hit rate, duplicate burden    |
| Evidence       | Exact span reproduction, source/revision correctness, relationship precision/recall       |
| Safety         | Unauthorized-hit and serialized-leak count, tombstone leak count, stale-policy leak count |
| Context        | Tokens retrieved, tokens injected, useful-token ratio, truncation and partial disclosures |
| Operation      | Ingest/rebuild/query latency, provider/model calls, cost, failure and recovery behavior   |
| Decision       | Success score, severe-error rate, abstention correctness, memory-use attribution          |
| Counterfactual | Paired with/without-memory outcome delta and cases where memory made the result worse     |

### Binary gates

Before any quality comparison, a candidate must achieve:

- zero unauthorized or tombstoned serialized returns;
- 100% returned-ID hydration to the intended canonical revision and span;
- 100% disclosure of seeded partial/stale states;
- 100% detection of seeded projection divergence in full reconciliation; and
- successful deletion and rebuild of the projection without loss of canonical
  custody or adjudication state.

For quality, pre-register token/latency/cost budgets and paired analysis. A
provider advances only if the lower bound of the chosen confidence interval for
memory-dependent decision success is above the lexical baseline, overall severe
errors are non-inferior, and no safety gate regresses. Exact thresholds and
sample size require separate approval before execution; selecting them after a
run would invite benchmark gaming.

### Retained artifacts

Keep fixture version/digests, adapter revision, provider configuration, model
and prompt revisions, all raw candidate IDs/scores/traces, hydration decisions,
injected context, outputs, judgments, token/cost records, and paired
counterfactual results. Do not retain credentials or unrestricted provider
logs.

## Visualization recommendation

Adapt Hindsight's progressive drill-down, not its truth semantics.

### Primary: decision-impact view

```text
query → retrieved → eligible after hydration → injected → cited/used
      → decision → observed outcome
      ↘ no-memory counterfactual and delta
```

Show where candidates were removed and why, tokens spent at each stage, and the
exact memory contribution to the decision. This answers the core question:
**why did memory improve or degrade the outcome?**

### Secondary: evidence and contradiction view

- Canonical captures/representations/spans use a distinct shape from model-
  derived facts, observations, and mental models.
- Assertion state, validator/policy, valid-time interval, authorization
  freshness, and deletion state are first-class filters.
- Contradictions remain two visible claims plus a typed relation and
  adjudication history; supersession never visually deletes the old basis.
- Clicking a synthesis opens its exact source spans and generation trace.

### Tertiary: projection/debug view

Display retrieval arms, ranks, raw scores with local meaning only, RRF,
reranking factors, graph traversal, projection snapshot, rebuild receipt,
partial failures, and token/latency cost. Label these as ranking diagnostics,
not evidence confidence.

The constellation may be retained as an exploratory overview. Node size,
brightness, centrality, proof count, or recency must never be labeled as truth,
validation, or importance to a decision without an explicit policy.

## Risks and unresolved decisions

Implementation remains blocked by ADR 0041 and current status. In particular:

1. Ledger version/migration, validator authority, and exact transition policy;
2. identity canonicalization and exact span/representation contracts;
3. principal, project, purpose, authorization snapshot, and freshness policy;
4. retention, legal hold, physical erasure, and backup-expiry proof;
5. first rights-cleared fixture cell and benchmark thresholds;
6. whether local Hindsight can run with all required extraction/consolidation
   paths disabled for the primary projection-only test;
7. exact Hindsight export/delete/rebuild behavior and third-party model artifact
   licenses at the chosen revision;
8. Supermemory local/core artifact source and license terms; and
9. operating budgets for Postgres, embeddings, reranking, LLM calls, and trace
   retention.

## Curiosity loop and stop decision

The bounded curiosity pass scored these remaining threads:

| Thread                                                            | Decision value                                                                           | Disposition                                                                        |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Inspect whether Hindsight's UI exposes provenance and rank traces | High; directly changes what to adapt                                                     | **Pursued**; it does, but lacks Curiosity authority/deletion/decision-impact views |
| Add LangMem or another seventh vendor                             | Low novelty; already represented by extracted/tool-managed memory families               | `CURIOSITY_NO_GO`                                                                  |
| Run vendor cloud benchmarks now                                   | High theoretical value, prohibitive configuration/rights/cost and no approved fixtures   | `CURIOSITY_NO_GO`                                                                  |
| Reverse-engineer Supermemory's distributed local binary           | Would exceed public-source clean-room and current need; core remains an explicit unknown | `CURIOSITY_NO_GO`                                                                  |
| Choose a graph engine now                                         | ADR 0041 explicitly defers it; no effect on the provider-seam decision                   | `CURIOSITY_NO_GO`                                                                  |
| Investigate pricing and star counts                               | Volatile and not decision-determinative for the authority architecture                   | `CURIOSITY_NO_GO`                                                                  |

**Coverage check:** all decision dimensions have source evidence or an explicit
unknown; every close architecture family is represented.  
**Saturation check:** later evidence changed product nuance—Mem0 became additive,
Cognee gained stronger controls, and Letta moved to MemFS—but did not change the
core disposition.  
**Stop:** `COVERAGE_AND_SATURATION_REACHED`. The next evidence-producing action
is a Curiosity-owned lexical-versus-Hindsight experiment, not more market search.

## Adaptive bibliography and rationale

1. **Curiosity ADR 0041 and current harness source.** Selected because they are
   the binding local constraints and prevent vendor features from defining the
   comparison dimensions.
2. **Hindsight repository at `dc1664d0c741`.** Selected as executable primary
   source for retain/recall/reflect, authorization extension, consolidation,
   traces, and visualization; preferable to marketing summaries.
3. **Hindsight paper, arXiv:2512.12818.** Selected for the authors' architecture
   and benchmark claims. It is author evidence, not independent validation.
4. **Hindsight benchmark site.** Selected for current reported scores and raw-run
   links; retained to show claim/date drift rather than to establish superiority.
5. **Mem0 repository at `39bc02330563`.** Selected because current code falsified
   the older model-directed mutation hypothesis and exposed documentation drift.
6. **Graphiti repository at `683a8539c892`.** Selected for the strongest public
   temporal edge and episode-lineage implementation and its LLM contradiction
   boundary.
7. **Letta Code repository at `ad7e6cf5ff78`.** Selected instead of retired
   MemGPT-only descriptions because it is the current harness and MemFS design.
8. **Cognee repository at `690c0ec02371`.** Selected because current source
   materially expanded the product classification with ACL, provenance,
   temporal, and integrity mechanisms.
9. **Supermemory repository at `f11d8c4620b2`.** Selected for public API/MCP/RBAC
   and visualization contracts; its missing core implementation is itself a
   decision-relevant limit.
10. **LongMemEval paper, arXiv:2410.10813.** Selected as the primary definition of
    the most cited conversational-memory benchmark and to identify what it does
    not test.
11. **MemoryBench documentation.** Selected as the primary description of a
    common provider benchmark pipeline. It is vendor-authored, so it informs the
    experiment shape rather than proving a winner.

## License boundary

The inspected root licenses were MIT for Hindsight and the Supermemory monorepo,
and Apache-2.0 for Mem0, Graphiti, Letta Code, and Cognee. This is a static record
of those repository revisions, not legal advice and not permission to copy
implementations. Any adapter must be independently authored against public
contracts, pin exact dependencies and model artifacts, preserve notices, and
re-check transitive and distributed-artifact terms before use.
