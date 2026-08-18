# Graph engineering research and native architecture proposal

**Status:** research record and implementation proposal, not an accepted architecture decision
**Date:** 2026-08-13
**Scope:** clean-room concepts for adding graph engineering alongside native specification, work-ledger, evidence, and Loop capabilities

## Question

How should `iamsterling.opencode2-config` implement graph engineering as its own OpenCode 2-native capability, while learning from graph-oriented agent systems, OpenSpec, Beads, and Loop without copying one source, importing their state models, or creating competing lifecycle authorities?

The practical subquestions are:

1. What does graph engineering mean for this product?
2. Which graphs are actually needed?
3. Which component owns truth, readiness, execution, verification, and completion?
4. How should graph plans be validated, scheduled, retried, invalidated, cached, and resumed?
5. What can be built on the pinned OpenCode 2 plugin API now, and what must remain disabled?
6. What is the smallest safe implementation sequence?

## Executive conclusion

Graph engineering should not be implemented as another autonomous framework beside Ledger and Loop. It should be the deterministic coordination layer that connects four typed projections:

```text
SpecGraph       what behavior is true or proposed
    |
    | derives and traces
    v
WorkGraph       what bounded work exists and what is ready
    |
    | dispatches accepted claims
    v
RunGraph        who performs each bounded node, in what order, under which budgets
    |
    | emits observations and evidence
    v
EvidenceGraph   what proves criteria and gates, with provenance and freshness
    |
    | supports, but never self-authorizes
    v
Ledger resolution and archive
```

These should be separate typed projections over one Ledger event history, not four independent stores and not one unconstrained property graph. Stable IDs and typed references connect them. A small pure `graph-kernel` should provide structural validation, strongly connected components, ready-frontier calculation, transitive impact, critical path, and deterministic explanation. Domain policy remains outside the kernel.

The authority split should be:

- **Native specification model:** current behavioral truth and proposed deltas.
- **Ledger:** sole lifecycle authority, event order, revisions, work state, claims, evidence acceptance, approvals, resolution, and archive.
- **Graph kernel:** pure computation over an immutable snapshot. It does not persist or authorize.
- **Graph planner/compiler:** proposes a versioned execution plan. It does not execute or complete work.
- **Graph coordinator:** claims ready work and requests bounded dispatch when host capabilities prove that safe.
- **Loop:** continues one accepted, claim-bound node until a gate, budget, interruption, or ambiguity stops it.
- **Workers:** produce artifacts and handbacks. They do not mark requirements satisfied or close intents.
- **Verifiers:** produce evidence and findings. They do not mutate implementation surfaces.
- **Root user or explicit policy authority:** approves consequential changes and optional parallelism where required.

The first product increment should be read-only and deterministic: normalize existing dependency semantics, project dependencies into the Ledger view, validate graphs, and explain readiness. Parallel dispatch, result caching, automatic retries, and graph mutation during execution should come later because the current release cannot prove authoritative publication fencing or native child lineage.

## Scope and non-goals

### In scope

- Typed specification, work, run, and evidence relationships.
- Versioned graph proposals and immutable accepted graph revisions.
- Deterministic DAG validation and cycle diagnostics.
- Explainable readiness and blocked-state derivation.
- Bounded role-aware execution plans.
- Selective retry and invalidation semantics.
- Evidence-bound quality gates.
- Durable resume and restart reconciliation.
- Context projection for one claimed node.
- Clean-room provenance and source bibliography.

### Not in scope

- Vendoring or translating `gwaghmar/graph`, OpenSpec, Beads, Turma, MindSpec, CoderMind, or loop-engineering source.
- Adopting OpenSpec file layouts or Beads/Dolt storage as runtime dependencies.
- A generic graph database, Cypher layer, embeddings store, or repository-wide AST index in the first implementation.
- A daemon, polling scheduler, cron process, filesystem watcher, or hidden background worker.
- Treating Markdown prompts as enforcement.
- Inferring success from a worker message, task checkbox, open pull request, or absent error.
- Parallel writes without proven ownership separation and host lineage.
- Caching opaque model output without a complete input and effect contract.
- Replacing ordinary single-session work when graph overhead has no clear value.

## Terminology

The design needs precise names because several sources use “graph” for different things.

### Graph engineering

The design of explicit nodes, edges, roles, handoffs, joins, gates, failure routes, and execution authority for work involving more than one bounded agent activity.

### Loop engineering

The design of continuation for one accepted unit of work: observe, act, verify progress, repeat under budgets, and stop on success, interruption, exhaustion, or ambiguity.

### Specification engineering

The design of current behavioral truth, proposed deltas, reviewable scenarios, revision lineage, and consolidation after verified implementation.

### Work-ledger engineering

The design of durable work packets, dependency readiness, claims, progress, evidence references, and operational history outside model context.

### Repository graph

A semantic map of capabilities, modules, files, symbols, interfaces, and code dependencies. This can improve impact analysis and context selection, but it is not the same as an execution graph.

### Execution graph

A versioned plan of bounded units and dependencies used to calculate readiness, dispatch, joins, retries, and completion gates.

### Projection

A deterministic, read-only graph view derived from accepted Ledger events. A projection may be rebuilt; it is not an independent authority.

## Evidence labels

Claims below use these labels:

- **[REPO]** directly observed in this repository.
- **[PRIMARY]** directly stated in a primary source or paper.
- **[DERIVED]** design conclusion derived from observed evidence.
- **[PROPOSAL]** recommended native design, not current behavior.
- **[UNKNOWN]** unresolved fact requiring a spike or host proof.

## Current repository findings

### Existing graph substrate

**[REPO] Ledger already declares graph-relevant entities.** `src/features/ledger/domain.ts` defines capability, scenario, work, dependency, claim, evidence, resolution, and archive entities. `applyCapabilityDelta` enforces scenario revision lineage and approval for removals, weakening, and destructive replacement.

**[REPO] Dependency explanation already exists as a pure function.** `explainDependencies` calculates direct blockers, writable-scope conflicts, and one reachable cycle. `explainReadiness` combines those results with capture gaps, expired claims, and evidence conflicts.

**[REPO] Dependency truth is not part of the active Ledger view.** `src/features/ledger/index.ts` has no dependency map and no dependency event reducer. `claimReady` checks work state, intent lifecycle, and an existing claim, but not graph blockers or scope conflicts.

**[REPO] The handoff compiler already validates a bounded DAG.** `src/features/handoff/compiler.mjs` rejects unknown endpoints, self-edges, duplicate pairs, cycles, overlapping mutation ownership, stale un-revalidated context, unverifiable criteria, and unauthorized parallel groups. It canonicalizes contracts and produces a content digest.

**[REPO] The handoff and Ledger edge orientations are inconsistent.** Handoff uses `producer -> consumer`, the conventional prerequisite-to-dependent direction. Ledger's current helper asks for edges whose `fromWorkID` is the queried work and considers `toWorkID` its blocker, effectively dependent-to-prerequisite.

**[REPO] Loop is already correctly narrow.** `src/features/loop-engine/index.ts` owns deterministic iteration identity, prompt causation, budgets, breaker counters, interruption, compaction continuity, and ambiguity. It requires accepted Ledger and capture progress before continuation. It does not own criteria, dependency truth, evidence bodies, or completion.

**[REPO] Production execution is intentionally disabled.** `docs/architecture/current-state.md` records that authoritative publication and native child lineage are not proven. Claims, activation, archive, and Loop continuation fail closed. Observation capture can publish, but material lifecycle writes cannot safely bind lease validity through publication.

**[REPO] Public tools are a frozen surface.** The current Promise plugin exposes 18 Ledger/Loop tools. Adding graph tools is an ABI decision, not a private refactor.

### Architectural implications

**[DERIVED] The product does not need a second task tracker.** The Ledger model is already intended to own work, dependency, claim, evidence, and archive state. A native Beads-like capability should complete that model rather than introduce a sibling authority.

**[DERIVED] The product does not need a second graph compiler.** The handoff compiler contains valuable contract and validation policy. Its useful concepts should converge with the WorkGraph and RunGraph schema rather than remain a disconnected planning dialect.

**[DERIVED] Graph scheduling cannot safely precede graph authority.** Until dependencies replay into the Ledger view and claim admission uses readiness, a scheduler would be acting on a graph that lifecycle authority does not enforce.

**[DERIVED] Parallelism is not the first milestone.** Deterministic graph understanding, readiness, and evidence traceability are useful in serial execution and can be verified under current constraints. Parallel dispatch depends on stronger host and persistence proofs.

## External research findings

### Graph Skill

**[PRIMARY]** `gwaghmar/graph` presents coding work as a dependency DAG of bounded nodes, validates unknown/self/cyclic dependencies, runs independent work in parallel through host adapters, applies deterministic quality checks before model review, records local run reports, computes critical path, and supports selective retry and content caching.

**[PRIMARY]** Its local runtime is intentionally lightweight and local. The public contract emphasizes no separate service, local state, explicit commit permission, and no invented token counts.

**[DERIVED]** The reusable ideas are bounded nodes, deterministic plan validation, quality-before-review, selective invalidation, critical-path observability, and task sizing. The exact runtime, files, prompts, CLI, symbols, and report shape should not be copied.

**[DERIVED]** “Relevant file” caching is unsafe as a general correctness claim unless the read set is complete. A native implementation should begin with no model-result cache and add cacheability only for nodes whose inputs and side effects are explicitly closed.

### LLMCompiler

**[PRIMARY]** LLMCompiler separates planning, ready-task fetching, and asynchronous execution. Dependencies can carry predecessor outputs into later tool calls. Planning can stream while independent tasks execute, and dynamic replanning can handle topology that depends on observations.

**[DERIVED]** The reusable architectural lesson is the planner/fetcher/executor separation. Repository engineering needs stronger durability, evidence, authority, and side-effect controls than short-lived tool-call compilation.

### Repository Planning Graph and CoderMind

**[PRIMARY]** Repository Planning Graph research links semantic intent to repository structure and uses dependency-aware generation. RPG-Encoder adds the reverse path from repository changes back into a persistent semantic graph and describes incremental graph evolution from commit-level differences.

**[DERIVED]** The reusable idea is bidirectional traceability between behavior and artifacts. Its complete repository ontology, parsers, generation pipeline, and research machinery are not required for the first native execution graph.

**[DERIVED]** A future RepositoryGraph should be a separate derived index with freshness metadata. It must not be allowed to silently mutate accepted specification or work truth.

### OpenSpec

**[PRIMARY]** OpenSpec separates current specs from active changes. Specs are organized by capability and contain requirements and concrete scenarios. Changes carry proposal, delta specs, design, and tasks. Archive folds verified deltas into current truth and preserves the change as history.

**[PRIMARY]** Delta operations distinguish addition, whole-requirement replacement, removal, and rename. Artifacts enable later work but are intentionally revisable rather than irreversible waterfall gates.

**[DERIVED]** The native design should preserve the current/proposed distinction, whole-record replacement semantics, scenario identity, revision bases, and recoverable consolidation. It should not adopt OpenSpec commands, paths, Markdown grammar, or generated assets.

### Beads

**[PRIMARY]** Beads models durable issues with typed dependencies, graph-derived readiness, atomic claims, history, structured context, persistent memories, and compaction. Current Beads uses Dolt as authoritative storage and treats JSONL as interchange rather than truth.

**[PRIMARY]** Hierarchy and blocking are distinct. Readiness excludes blocked, deferred, and already claimed work. Atomic claim behavior prevents a query-then-update race.

**[DERIVED]** The native design should adopt explicit edge semantics, deterministic readiness explanations, atomic compare-and-set claims, append-only progress, and separate retention policies. It should not depend on Beads, Dolt, its issue schema, commands, labels, or ID format.

### Role-graph framing

**[PRIMARY]** Alexey Grigorev describes graph engineering as defining specialized agent nodes and how work moves among them. His example separates product grooming, engineering, QA, and orchestration, with QA failure returning work to engineering and only the orchestrator closing accepted work.

**[DERIVED]** Roles are authority boundaries, not merely prompt personas. A verifier must not become an implementation writer, and a worker handback must not become completion authority.

### Integration examples

**[PRIMARY]** Turma translates approved specification tasks into a work DAG, executes claimed work, and reconciles worktree and pull-request state. It keeps dependent work blocked until prerequisite pull requests are merged.

**[PRIMARY]** MindSpec emphasizes self-contained work packets, fresh context, evidence-bound acceptance, maker/verifier separation, deterministic gates, and discovered work becoming new tracked work instead of unbounded scope expansion.

**[DERIVED]** These are useful policy examples, not source authorities. Their exact workflows, thresholds, branch models, review panels, and adapters should not define this product by default.

## Conceptual synthesis

### The four graph projections

#### 1. SpecGraph

Purpose: represent accepted behavior and proposed behavioral change.

Suggested node types:

- `intent`: one bounded change objective and invariant.
- `capability`: stable behavioral namespace.
- `requirement`: normative observable behavior.
- `scenario`: concrete example or acceptance case.
- `delta`: proposed revision from an exact base to an exact target.
- `decision`: architecture or product decision referenced by an intent.

Suggested edge types:

- `intent-proposes-capability-delta`
- `capability-contains-requirement`
- `requirement-demonstrated-by-scenario`
- `scenario-revises-scenario`
- `intent-constrained-by-decision`
- `requirement-supersedes-requirement`

Rules:

- Current accepted behavior and proposed behavior are separate projections.
- Every proposal is based on exact revisions.
- Modification is complete replacement, not an untyped object merge.
- Removing or weakening behavior requires explicit approval policy.
- Generated or inferred brownfield behavior begins as a proposal, never accepted truth.
- Archiving or consolidation occurs only after reconciliation accepts evidence.

#### 2. WorkGraph

Purpose: represent durable, claimable work and readiness.

Suggested node types:

- `work`: bounded unit with objective, scope, criteria, and state.
- `gate`: external or deterministic condition that can block work.
- `milestone`: non-executable grouping and progress rollup.
- `approval`: consequential authority request.

Suggested edge types:

- `requires`: prerequisite work or gate must be satisfied.
- `contains`: grouping only; no readiness effect by default.
- `discovered-from`: provenance only.
- `relates-to`: informational only.
- `supersedes`: lifecycle relation, not execution order.
- `conflicts-with`: explicit mutual exclusion.

Canonical direction:

```text
prerequisite --requires-for--> dependent
```

In data terms, use unambiguous names such as `prerequisiteID` and `dependentID`. Do not retain `fromWorkID`/`toWorkID` once a new schema version can make the direction explicit.

Rules:

- Only explicitly readiness-affecting edges block execution.
- Parent/child hierarchy does not imply sequence.
- A ready node is pending, has all required predecessors satisfied, has all gates accepted, has no active conflicting claim, and has no unresolved policy ambiguity.
- Readiness always returns stable reason codes and subject IDs.
- Claiming is one fenced compare-and-set transition against graph revision, work revision, and readiness digest.

#### 3. RunGraph

Purpose: represent one immutable accepted execution plan for selected WorkGraph nodes.

Suggested node kinds:

- `analysis`: read-only discovery or decomposition.
- `implementation`: scoped mutation.
- `validation`: deterministic check.
- `review`: independent model or human evaluation.
- `integration`: combines accepted outputs.
- `decision`: explicit root-user or policy gate.
- `synthesis`: report-only aggregation.

Each node should include:

```text
id
revision
workID
role
objective
inputBindings
readSet
writeSet
forbiddenSet
criterionIDs
requiredEvidence
predecessorIDs
joinPolicy
budgets
retryPolicy
cachePolicy
dispatchPolicy
```

Each accepted run should include:

```text
runID
planRevision
intentID + intentRevision
workGraphRevision + digest
node set + edge set
planner identity
approval references
canonical digest
createdAt
```

Rules:

- The accepted plan revision is immutable while attempts execute.
- Runtime rewiring creates a new plan revision; it does not edit history.
- A node may be dispatched only from the deterministic ready frontier.
- Mutation nodes with overlapping write scopes cannot run concurrently.
- Read-only nodes can run concurrently when host capacity and policy allow.
- Parallel authorization is a policy result, not a planner assertion.
- Completion of all run nodes does not itself resolve the intent.

#### 4. EvidenceGraph

Purpose: represent provenance-bound observations and their relationship to criteria and gates.

Suggested node types:

- `attempt`: one execution of one run node.
- `observation`: bounded captured fact about an event or artifact.
- `artifact`: output with locator, digest, media kind, and trust.
- `evidence`: accepted proof candidate.
- `finding`: verifier result, including rejection.
- `resolution`: proposed or accepted criterion/intent verdict.

Suggested edge types:

- `attempt-produced-artifact`
- `attempt-observed-event`
- `evidence-derived-from-observation`
- `evidence-supports-criterion`
- `evidence-refutes-criterion`
- `finding-reviews-artifact`
- `resolution-cites-evidence`

Rules:

- Raw prompts and unbounded tool output remain outside Ledger state.
- Evidence references exact criterion revisions, work revisions, attempts, environment/input/output digests, and event IDs.
- Freshness is explicit. Stale evidence cannot silently satisfy a revised criterion.
- Worker self-report is an observation, not accepted proof.
- Conflicting evidence blocks reconciliation until policy resolves it.

## One event history, typed projections

### Why not one universal graph schema

A universal `{ node, edge, properties }` schema looks flexible but weakens the properties this repository currently values:

- closed codecs;
- exact keys;
- typed diagnostics;
- authority-specific validation;
- bounded context projection;
- understandable migrations;
- deterministic canonicalization.

It also invites domain policy into arbitrary edge labels and properties. That makes readiness and authorization dependent on conventions rather than code.

### Why not four stores

Independent stores create cross-store transaction and recovery problems:

- a spec revision can advance without work invalidation;
- a work claim can exist against an obsolete plan;
- an execution can finish without accepted evidence publication;
- an archive can consolidate the wrong graph revision.

The current hash-linked Ledger is the right authority boundary. New event types can project into separate maps and adjacency indexes while preserving one ordered history.

### Proposed internal boundaries

```text
src/core/graph/
  contracts.ts       generic bounded graph input/output types
  validate.ts        endpoint, duplicate, self-edge, SCC/cycle checks
  frontier.ts        topological readiness from supplied node states
  traverse.ts        ancestors, descendants, impact, paths
  critical-path.ts   deterministic duration/cost analysis

src/features/specification/
  domain.ts          capabilities, requirements, scenarios, deltas
  projection.ts      SpecGraph from Ledger events

src/features/ledger/
  projection.ts      lifecycle and entity replay
  work-graph.ts      edge policy, readiness, claim admission
  evidence-graph.ts  evidence bindings and conflict policy

src/features/graph-engineering/
  plan.ts            immutable RunGraph contracts
  compiler.ts        WorkGraph selection to RunGraph proposal
  coordinator.ts     ready-frontier dispatch, initially disabled
  reconciliation.ts  restart observations and ambiguity

src/features/loop-engine/
  unchanged owner of per-node continuation
```

This is a target boundary, not a request to create empty files immediately. The first change should add only the graph kernel pieces needed by integrated dependency readiness.

## Canonical graph kernel

### Required properties

The kernel should be:

- pure and deterministic;
- independent of OpenCode and persistence;
- generic only over stable IDs and edge endpoints;
- bounded by caller-supplied size limits;
- explicit about ordering;
- incapable of authorizing transitions;
- well tested with generated graph fixtures.

### Minimum algorithms

1. **Structural validation**
   - unique node IDs;
   - unique edge IDs;
   - known endpoints;
   - no self-edge where prohibited;
   - duplicate semantic pair policy;
   - closed edge-kind validation in the domain layer.

2. **Strongly connected components**
   - use Tarjan or Kosaraju with deterministic traversal order;
   - report every cyclic component, not only the first route found;
   - separately report self-cycles when a domain permits them structurally but not operationally.

3. **Ready frontier**
   - compute nodes whose readiness-affecting predecessors are satisfied;
   - preserve stable lexical ordering unless accepted policy supplies priority;
   - return reasons for every excluded candidate.

4. **Traversal and impact**
   - direct and transitive ancestors;
   - direct and transitive descendants;
   - shortest explanatory path from blocker to dependent;
   - invalidation closure from changed inputs.

5. **Topological order and levels**
   - reject cyclic execution graphs;
   - return deterministic levels for potential concurrency;
   - treat levels as possibility, not authorization.

6. **Critical path**
   - calculate from recorded durations or declared cost estimates;
   - report unknown rather than inventing missing duration or token data.

### Complexity and bounds

Core validation and traversal should be `O(V + E)` after deterministic sorting. Initial accepted plans should retain the handoff compiler's conservative bounds of at most 32 execution units and 64 edges unless evidence justifies larger limits. WorkGraph projections can be larger, but every public query must be bounded by intent, root node, depth, and result count.

## State machines

### Specification change

```text
captured -> framed -> proposed -> approved -> implementing
    -> verifying -> reconciled -> consolidated -> archived
```

Allowed side paths:

```text
framed/proposed/implementing/verifying -> revised (new revision)
any nonterminal state -> blocked
proposed/approved -> rejected
```

The existing intent lifecycle should not be expanded casually. A schema decision should determine whether these become intent states, related entities, or derived phases.

### Work

```text
proposed -> pending -> claimed -> executing -> produced
    -> verifying -> accepted -> integrated -> resolved
```

Failure and control states:

```text
pending/claimed/executing/verifying -> blocked
claimed/executing -> abandoned
produced/verifying -> rejected -> pending or superseded
any nonterminal state -> cancelled
```

The current `pending | blocked | resolved` state is too coarse for graph scheduling and restart reconciliation. Expanding it requires a Ledger schema revision and migration plan, not ad hoc strings.

### Run node attempt

```text
prepared -> dispatched -> executing -> terminal
```

Terminal outcomes:

```text
succeeded | failed | denied | interrupted | ambiguous | invalidated
```

Loop already has the core dispatch transition. RunGraph should reference Loop attempts rather than duplicate their journal state.

### Gate

```text
pending -> evaluating -> passed | failed | ambiguous | waived
```

`waived` requires an authority reference and cannot be represented as `passed`.

## Readiness semantics

Readiness must be a deterministic decision record, not a boolean convenience.

Suggested result:

```json
{
  "schemaVersion": 1,
  "workID": "work-auth-api",
  "workRevision": 3,
  "graphRevision": 12,
  "graphDigest": "sha256:...",
  "status": "blocked",
  "reasons": [
    { "code": "WORK_PREREQUISITE_UNSATISFIED", "subjectID": "work-schema" },
    { "code": "WORK_SCOPE_CONFLICT_ACTIVE", "subjectID": "work-auth-model" }
  ],
  "digest": "sha256:..."
}
```

Claim admission should bind:

- intent ID and revision;
- work ID and revision;
- graph revision and digest;
- readiness digest;
- writable-scope digest;
- actor/session identity;
- fence epoch and expiry.

If any binding changes between readiness calculation and publication, the claim fails with a conflict and must be recomputed.

### Scope conflict policy

The current helper conflicts a candidate with every unresolved overlapping work item. That is safe but unnecessarily serializes work that merely exists.

Recommended rule:

- overlap with a currently claimed or executing mutation node blocks;
- overlap with a pending node does not block by itself;
- explicit `conflicts-with` can block earlier when policy requires exclusivity;
- read-only work never claims write ownership;
- path overlap is necessary but not always sufficient for semantic independence.

Symbol-level or API-level conflict inference can be explored later. It should not be guessed in v1.

## Planning and admission

### Planner output is a proposal

A model planner may suggest nodes, edges, roles, scopes, and checks. Deterministic code must then validate:

- schema and bounds;
- exact source work revisions;
- endpoint and cycle correctness;
- each node's criteria coverage;
- read/write/forbidden scope validity;
- ownership overlap;
- required joins;
- verifier independence;
- available host capabilities;
- budgets and retry bounds;
- approval requirements;
- canonical graph digest.

Only an accepted plan event creates a RunGraph revision. A model-generated plan is never executable merely because it parses.

### Task sizing

Graph overhead should be conditional. A deterministic or reviewable sizing record can classify work:

- `direct`: one bounded session, no meaningful parallelism or retry isolation;
- `loop`: one work item needs continued iterations;
- `graph-serial`: multiple roles/gates or isolated retry domains, no safe parallel mutation;
- `graph-parallel`: independent ready nodes with disjoint ownership and proven host support.

Signals can include number of affected domains, criteria, writable roots, independent research questions, risk class, and required verifier roles. File count alone is not sufficient.

## Dispatch and scheduling

### Coordinator algorithm

When production capability exists, one coordinator tick should:

1. Load one immutable Ledger snapshot.
2. Verify schema, continuity, and no blocking capture gaps.
3. Select one accepted RunGraph revision.
4. Reconcile nonterminal attempts with host observations.
5. Mark unknown outcomes ambiguous; never guess.
6. Compute the ready frontier from accepted predecessor outcomes and gate states.
7. Filter by active claims, scope conflicts, policy, capacity, and host capabilities.
8. Atomically claim selected work against the same graph/readiness revision.
9. Prepare an attempt journal before dispatch.
10. Dispatch through a proven OpenCode session primitive.
11. Record observations and return; do not wait in plugin setup or poll.

The next host event, explicit command, or resumed session supplies the next tick. This preserves the repository's no-daemon/no-polling constraint.

### Fairness and priority

Initial scheduling should be simple and deterministic:

1. explicit accepted priority;
2. nodes on the estimated critical path;
3. lexical node ID as tie-breaker.

Priority must not bypass dependencies, approvals, conflicts, or evidence gates. Avoid opaque model-selected priority after plan acceptance.

### Joins

Join policy must be explicit:

- `all-success`: every required predecessor succeeded;
- `all-terminal`: every predecessor ended, useful for synthesis of mixed results;
- `quorum`: deferred until authority and evidence semantics are designed;
- `any-success`: deferred because it complicates invalidation and cancellation.

The first version should support only `all-success` and `all-terminal` for read-only synthesis.

## Roles and authority

Suggested roles are contracts, not hard-coded model names:

| Role | May read | May mutate | May assert | Cannot authorize |
| --- | --- | --- | --- | --- |
| planner | repository, intent, constraints | plan proposal only | decomposition rationale | plan acceptance, completion |
| researcher | bounded sources | findings artifact only | sourced findings | product truth, code completion |
| implementer | claimed context and allowed repository scope | owned paths | handback and observations | criterion satisfaction, merge, archive |
| validator | artifacts and executable checks | evidence records through tools | mechanical outcomes | implementation changes by default |
| reviewer | diff, criteria, evidence refs | review finding only | accept/reject recommendation | Ledger resolution |
| integrator | accepted outputs | explicit integration scope | integration result | requirement satisfaction |
| coordinator | graph and host state | claims/attempt transitions through authority | readiness/dispatch decisions | spec truth, evidence fabrication |
| root user | bounded presented context | approvals and decisions | policy choice | cryptographic guarantees not supplied by host |

Maker/verifier separation should be enforced by attempt/session identity where the host can attest it. Where independent identity cannot be proven, report bounded assurance rather than claiming independent verification.

## Retry, failure, and invalidation

### Failure classes

Reuse the handoff compiler's useful distinction and make it authoritative in code:

- `transport-provider`: no semantic attempt result; identical replay may be allowed.
- `missing-evidence`: output may exist, but proof contract is incomplete.
- `misunderstood-intent`: plan or node context is invalid; replan required.
- `failed-verification`: implementation output failed a deterministic oracle.
- `reviewer-rejection`: a finding requires bounded revision.
- `policy-denial`: no retry without changed authority or plan.
- `host-ambiguity`: dispatch or terminal state cannot be proven; automatic retry prohibited.
- `input-invalidated`: an accepted predecessor or source changed.

### Retry rules

- Every retry is a new attempt ID.
- Retry limits are per node and per run, not hidden prompt instructions.
- Unchanged replay is allowed only for classified transient failures and idempotent effects.
- Semantic retries require a diagnosis, preserved facts, invalidated assumptions, and changed instructions.
- Consequential external effects require idempotency keys or manual reconciliation before retry.
- Repeated failure/action signatures feed Loop breakers.
- Exhaustion produces blocked or escalated state, never false completion.

### Invalidation closure

When node output changes:

1. Invalidate that node's prior success for the new plan revision.
2. Traverse readiness-affecting outgoing edges.
3. Invalidate transitive dependents whose input bindings include changed output.
4. Preserve unrelated branches.
5. Re-evaluate deterministic gates.
6. Mark old evidence stale rather than deleting it.
7. Record why each node was preserved or invalidated.

This is more precise than “failed node plus every descendant” when edges are informational or a dependent does not consume the changed output. The first version may conservatively invalidate all execution descendants, then refine after typed input bindings are proven.

### Dynamic replanning

Runtime discovery must not edit an active graph in place. The coordinator should:

1. record the finding;
2. propose new or changed work;
3. compile plan revision `n + 1` against exact current revisions;
4. calculate retained, invalidated, and new nodes;
5. require approval if scope, risk, or behavior changes consequentially;
6. activate the new revision only after admission.

## Caching

### Default policy

Model-executed mutation nodes are `uncacheable` initially. Deterministic validation nodes may be cacheable if all inputs are content-addressed and execution is side-effect free.

### Safe cache key

A future cache key should include at least:

```text
node contract digest
plan revision
all input artifact digests
complete declared read-set digests
repository base/tree digest
tool and plugin versions
model/provider identity when model output is cached
policy version
environment digest
relevant configuration and dependency-lock digests
```

The cache record also needs:

- result and evidence digests;
- creation time and freshness policy;
- side-effect classification;
- producer identity;
- invalidation reason/history;
- schema version.

### Cache prohibitions

Never cache/replay as success when:

- the read set is incomplete or inferred only from files written;
- a node performs non-idempotent external effects;
- evidence is time-sensitive or environment-sensitive and stale;
- authority or policy changed;
- a dependency result is ambiguous;
- the host cannot prove which attempt produced the artifact.

## Context engineering for graph nodes

Each dispatched node should receive a deterministic, bounded context pack, not the entire graph or chat history.

Minimum pack:

- intent objective, invariant, scope, and non-goals;
- exact intent and criterion revisions;
- claimed work objective and writable scope;
- accepted predecessor artifact/evidence references;
- node role, allowed capabilities, and forbidden surfaces;
- required handback and evidence contract;
- plan/run/node/attempt IDs and digests;
- unresolved risks or assumptions relevant to this node;
- explicit statement that Ledger owns completion.

Context should distinguish:

- trusted Ledger metadata;
- direct repository references;
- derived summaries with source digests;
- untrusted external content;
- stale or unknown freshness.

The existing 12 KB context projection budget is a useful safety boundary. Graph context should use ranked references and worker fetch rather than expanding every ancestor and descendant inline.

## Specification-to-work translation

Translation is a compiler, not a copy operation.

Inputs:

- exact intent revision;
- proposed capability/requirement/scenario deltas;
- accepted design decisions where present;
- repository impact observations;
- risk and rigor policy.

Outputs:

- bounded work proposals;
- criteria-to-work coverage map;
- prerequisite and informational edges;
- write-scope proposals;
- verification and integration gates;
- transcription/compilation digest.

Admission checks:

- every required criterion has at least one responsible work node and one verification path;
- no work node silently changes behavioral scope;
- every work node references exact source revisions;
- every edge kind has defined readiness semantics;
- no cycles among blocking edges;
- no orphan implementation output bypasses integration or verification;
- re-running translation against identical inputs is idempotent;
- changed inputs yield a new revision and an explicit diff.

Tasks are operational decomposition, not behavioral truth. One scenario may require several work nodes; one work node may satisfy several scenarios. The traceability map is many-to-many.

## Evidence and completion

The completion chain should be explicit:

```text
worker produced output
  != node verified
  != work accepted
  != output integrated
  != criterion satisfied
  != intent reconciled
  != specification consolidated
  != archive committed
```

Recommended gates:

1. **Node output gate:** required handback and artifacts exist with valid digests.
2. **Mechanical gate:** deterministic checks pass in a bound environment.
3. **Review gate:** independent finding accepts the scoped output where policy requires.
4. **Integration gate:** accepted output is present in the required base or target state.
5. **Criterion gate:** current evidence kinds satisfy the exact criterion revision.
6. **Intent resolution:** all criteria pass, conflicts/gaps are closed, and required approvals exist.
7. **Specification consolidation:** accepted deltas become current truth transactionally.
8. **Archive:** complete lineage and bundle digests are committed.

## Persistence and recovery

### Event model

Potential event families, subject to an ADR and schema revision:

```text
spec.capability-created
spec.delta-proposed
spec.delta-approved
spec.delta-consolidated
work.proposed
work.dependency-added
work.dependency-removed
work.claimed
work.output-produced
work.accepted
work.integrated
run.plan-proposed
run.plan-accepted
run.attempt-prepared
run.attempt-dispatched
run.attempt-terminal
run.node-invalidated
gate.evaluated
evidence.submitted
evidence.accepted
resolution.proposed
intent.reconciled
intent.archived
```

Events should remain immutable. Corrective action appends a superseding or invalidating event.

### Snapshot and indexes

Replay can build:

- entity maps by typed ID;
- outgoing and incoming adjacency by edge kind;
- active claim indexes;
- criteria-to-work and criteria-to-evidence indexes;
- run/node/attempt indexes;
- current graph revision and digest per intent.

Derived snapshots may be checkpointed for speed only if replay can verify them against event lineage. Checkpoints are disposable accelerators, not authority.

### Restart reconciliation

For every nonterminal attempt:

- prove whether dispatch occurred;
- prove session and child lineage;
- prove tool terminality;
- prove capture continuity;
- compare observed artifacts/evidence with the attempt contract;
- classify the outcome as a valid forward transition or ambiguity.

No proof means `ambiguous`. Do not automatically dispatch a replacement because the original attempt may still have performed effects.

## OpenCode 2 integration

### Available conceptual surfaces

Current OpenCode 2 documentation exposes plugin transforms for tools, commands, agents, references, and skills; session methods for create, prompt, interrupt, wait, and hooks; tool before/after hooks; and a public event stream.

### Repository-specific constraint

The repository is pinned to `@opencode-ai/plugin@0.0.0-beta-17595`, not an abstract current release. `src/platform/real-host/index.ts` and real-host probes remain authoritative for what this exact build proves. Current repository policy reports native child lineage, interrupt automation, concurrent setup, and authoritative persistence as unsupported.

### Integration sequence

- Use pure internal graph services before adding public tools.
- Keep setup finite; never wait on an execution graph in plugin setup.
- Use event-driven ticks rather than timers or polling.
- Keep host effects behind narrow ports.
- Bind every host event to stable run/node/attempt/session/message/tool IDs where available.
- Treat absent lineage or terminality as unknown.
- Do not expose parallel execution until a real-host test proves creation, lineage, terminality, interruption, and cleanup.
- Preserve the exact 18-tool surface until a separately reviewed protocol change.

### Eventual public surface

If public graph tools are approved later, prefer a small capability-oriented surface rather than one tool per query:

```text
graph_plan_propose
graph_plan_explain
graph_run_status
graph_run_advance
```

However, existing Ledger tools may be sufficient if graph computation is integrated behind work proposal, claim, evidence, and status operations. Avoid adding tools solely to mirror another product's CLI.

## Security and trust

### Threats

- A planner grants itself broader write scope.
- A worker forges predecessor completion or evidence.
- Prompt injection in external context changes graph policy.
- Two workers claim overlapping mutation nodes.
- A stale plan runs against revised intent or repository state.
- Retry duplicates a push, issue update, deployment, or other external effect.
- Cache poisoning reuses output from incomplete inputs.
- A malicious workspace writer tampers with state under the same UID.
- A verifier and maker are nominally separate but share the same unproven context/session.
- Compaction removes evidence needed for audit or recovery.

### Controls

- Closed schemas and exact revisions.
- Deterministic admission separate from model planning.
- Fenced compare-and-set claims.
- Canonical digests for plans, readiness, context, inputs, and outputs.
- Explicit read/write/forbidden scopes.
- Taint and freshness labels on all context.
- Attempt-specific evidence binding.
- Idempotency keys for external effects.
- Fail-closed ambiguity and capture-gap handling.
- Retention classes and restore references before compaction.
- Root approvals for destructive, security, schema, irreversible, and scope-expanding transitions.
- Honest bounded-authority diagnostics where host identity or filesystem privilege cannot be proven.

## Observability

Useful read-only views:

- graph revision and digest;
- node totals by kind and state;
- ready frontier with excluded-node reasons;
- active claims and writable scopes;
- run timeline and attempt count;
- critical path from recorded duration;
- invalidation and retry history;
- evidence coverage by criterion;
- unresolved ambiguity, capture gaps, and policy gates;
- cache hit/miss only when cache is enabled and proven;
- real token/usage data only when supplied by the host.

An ASCII graph or HTML report is presentation, not authority. It should consume the same read-only projection and reason codes as tools and tests.

## Testing strategy

### Pure graph kernel

- table tests for empty, singleton, chain, diamond, fan-out/fan-in, disconnected, self-edge, duplicate edge, missing endpoint, and multiple-cycle graphs;
- property tests that topological output respects every edge;
- property tests that SCC partitions are complete and deterministic;
- property tests that invalidation contains exactly the reachable execution dependents under the selected conservative policy;
- permutation tests proving canonical digest independence from set ordering;
- bound and adversarial depth tests preventing recursive blowups.

### Ledger projection

- replay dependency add/remove/supersede events;
- reject sequence, digest, revision, and endpoint errors;
- readiness reasons remain stable across replay;
- pending overlapping work does not conflict under the proposed active-claim policy;
- active overlapping claims block;
- atomic claim loses cleanly when graph/readiness revision changes;
- capture gaps and evidence conflicts block as specified.

### Specification model

- whole-record replacement preserves explicitly retained scenarios only;
- removal/weakening requires approval;
- stale base revision rejects;
- current and proposed projections never blur;
- consolidation is transactional and recoverable;
- inferred brownfield specs cannot become accepted without admission.

### RunGraph compiler

- criterion coverage and orphan checks;
- write ownership and forbidden surfaces;
- verifier role cannot own mutation paths;
- unsupported host capabilities reject plan admission;
- graph revision and digest bind every attempt;
- plan revision diff correctly retains, invalidates, and adds nodes.

### Loop integration

- one accepted claim maps to one active node attempt;
- terminal worker output without Ledger/evidence advance does not continue;
- duplicate terminal events are idempotent;
- user input pauses only the intended run/node;
- ambiguous dispatch never auto-retries;
- retry budgets and repeated-signature breakers stop deterministically.

### Real-host tests

Before enabling child/parallel execution, prove in an isolated disposable project:

- child session creation and stable parent/root lineage;
- terminal events for every child and tool half;
- interruption semantics and outcome;
- plugin unload/reload cleanup;
- context hook boundaries;
- event loss/gap behavior;
- concurrent setup behavior;
- same-root and child-root causation identities;
- no writes outside the allowed project root;
- no network access except explicitly allowed loopback probes.

### Failure injection

- crash before and after attempt preparation;
- dispatch succeeds but publication fails;
- publication succeeds but acknowledgement is lost;
- gate process exits but evidence capture is missing;
- graph revision changes during claim;
- worker writes outside declared scope;
- external side effect succeeds but response is lost;
- checkpoint corruption and event truncation;
- cache record references missing artifacts.

## Implementation roadmap

### Phase 0: decision and semantics

Deliverables:

- review this research record;
- choose native vocabulary and user-facing product shape;
- write an ADR accepting or revising the four-projection model;
- decide whether specification entities remain in Ledger v1 or require Ledger v2;
- normalize edge direction to prerequisite-to-dependent in the new schema;
- define stable reason codes and graph size bounds.

Exit criteria:

- no ambiguous ownership between specification, Ledger, graph coordinator, and Loop;
- no public ABI or state migration begins without approval.

### Phase 1: pure graph kernel

Deliverables:

- focused failing tests first;
- deterministic validation, SCC, topological levels, frontier, ancestors/descendants, and invalidation closure;
- canonical graph digest fixtures;
- no plugin composition, persistence, tools, or host effects.

Exit criteria:

- algorithms are bounded, deterministic, and independently testable;
- handoff and Ledger tests can consume the kernel without behavior expansion.

### Phase 2: Ledger WorkGraph projection

Deliverables:

- dependency entity events replay into the active view;
- explicit edge-kind enum and semantics;
- read-only readiness explanation from one snapshot;
- claim admission consults dependency/gate/conflict reasons;
- claim binds graph and readiness revisions;
- schema/migration ADR if existing event shape changes.

Exit criteria:

- no work can be claimed while a blocking predecessor, active scope conflict, capture gap, stale revision, or required gate remains unresolved;
- persistence remains fail-closed until publication fencing is solved.

### Phase 3: native SpecGraph

Deliverables:

- capability, requirement, scenario, and delta codecs;
- current versus proposed projections;
- exact-base revision and complete replacement semantics;
- approval-bound weakening/removal;
- criteria and work traceability compiler;
- transactional consolidation/archive design.

Exit criteria:

- specifications are not Markdown-only authority;
- work remains operational and cannot overwrite behavioral truth.

### Phase 4: converge handoff into RunGraph proposals

Deliverables:

- map handoff units, contexts, criteria, ownership, retries, and handback into one RunGraph contract;
- retain compatibility for existing `compile-handoff` assets or explicitly redesign them;
- plan proposal/admission with canonical digest;
- read-only explain and status views.

Exit criteria:

- there is one execution DAG dialect;
- planning remains non-executing and non-completing.

### Phase 5: serial coordinator

Prerequisites:

- authoritative publication fencing solved and tested;
- claim/release/reconciliation durable;
- event capture continuity sufficient for one attempt;
- exact host dispatch reconciliation proven.

Deliverables:

- one coordinator tick;
- one ready node claimed and dispatched at a time;
- Loop bound to one node attempt;
- deterministic quality gate and independent review node where host identity permits;
- restart reconciliation and explicit ambiguous state.

Exit criteria:

- serial graph execution resumes without duplicate dispatch or inferred success.

### Phase 6: selective retry and invalidation

Deliverables:

- typed failure classes;
- attempt history and budgets;
- conservative descendant invalidation;
- plan revision transition records;
- no cache yet except deterministic side-effect-free gates.

Exit criteria:

- failed branches can rerun without replaying independent successful branches;
- all preserved results remain revision-valid.

### Phase 7: parallel read-only, then disjoint mutation

Prerequisites:

- real-host child creation, lineage, terminality, interruption, and cleanup proven;
- concurrent claim/fence publication proven;
- capacity and policy controls accepted.

Deliverables:

- parallel read-only analysis first;
- fan-in synthesis;
- later, disjoint mutation ownership with integration nodes;
- concurrency limits and fairness;
- conflict and cancellation semantics.

Exit criteria:

- no overlapping write claims;
- every child attempt is independently attributable and terminal;
- parallel failure cannot corrupt accepted sibling results.

### Phase 8: cache and RepositoryGraph exploration

Deliverables:

- cache only for closed-input nodes;
- freshness and invalidation records;
- optional read-only repository impact index spike;
- measured comparison against glob/grep/read baselines.

Exit criteria:

- cache correctness is demonstrated under input, config, environment, and policy changes;
- repository indexing has measurable value and honest freshness.

## Recommended first implementation slice

The first code change should be deliberately narrow:

1. Add failing tests for deterministic multi-cycle reporting, conventional edge orientation, topological levels, and ready-frontier explanations.
2. Introduce a pure graph kernel with no persistence or host imports.
3. Adapt the handoff compiler's cycle validation to the kernel without changing its public contract.
4. Replace or wrap Ledger dependency traversal with the same kernel.
5. Add dependency projection to the Ledger view behind tests.
6. Add a read-only internal readiness query.
7. Do not enable claim publication, graph tools, coordinator execution, parallelism, or caching.

This slice reduces duplicate graph logic and fixes the most important authority gap without pretending the host can execute a durable graph safely today.

## Decisions required from the owner

1. **Product vocabulary:** expose “Graph” as a product feature, or present it as orchestration while keeping graph terminology internal?
2. **Specification scope:** build a native specification layer now, or first complete WorkGraph and treat current intent/criteria as the minimal spec?
3. **Compatibility:** should future native commands emulate `/opsx-*` and `bd` concepts, or should only `/loop-*` compatibility remain while new commands use original names?
4. **Graph mutability:** require immutable plan revisions only, as recommended, or permit constrained in-place edge updates?
5. **Human gates:** which transitions always require root confirmation beyond existing security/schema/destructive/irreversible policy?
6. **Parallel policy:** should read-only parallelism be automatically permitted once host support is proven, or always require explicit authorization?
7. **Repository graph:** is semantic code indexing a product goal, or should graph engineering remain execution-only for the foreseeable roadmap?
8. **Checked-in artifacts:** should accepted specs and plans have human-readable checked-in projections, while Ledger remains authority, or remain runtime state only?

## Contradictions and tradeoffs

### Flexible artifact flow versus enforceable gates

OpenSpec treats artifact dependencies as enablers, not rigid gates. A governed execution graph needs enforceable readiness. The synthesis is to allow proposals/design/spec deltas to revise freely through new revisions, but freeze the exact accepted revisions used by an executing plan.

### One Ledger versus specialized stores

One event history simplifies authority and replay but can become a broad domain module. Typed projections and feature-specific codecs preserve boundaries without introducing cross-store atomicity problems.

### Parallel speed versus mutation safety

Graph systems advertise concurrency, but disjoint file paths do not prove semantic independence. Begin with read-only parallelism, retain integration nodes, and require explicit write ownership plus host proof.

### Selective retry versus stale dependents

Retrying only one failed node saves work, but any changed output can stale downstream results. Preserve upstream and unrelated nodes; invalidate downstream consumers conservatively until input bindings are precise.

### Cache savings versus hidden inputs

Content caching can reduce repeated work, but model nodes inspect more context than their written files reveal. Default to uncacheable and earn cacheability per node kind.

### Independent verification versus host identity limits

Separate roles improve review, but the pinned host does not currently prove native child lineage. Do not claim independent verification until separate attempt identity and context are observable.

### Human-readable files versus canonical runtime state

Checked-in specs and plans improve collaboration and review, but duplicate mutable truth can drift. If introduced, human-readable artifacts should compile into proposed Ledger events and include source/digest metadata; accepted Ledger state remains canonical unless an ADR deliberately reverses that choice.

## Unknowns

- **[UNKNOWN]** Whether a newer exact OpenCode 2 build can provide all child lineage and terminality needed without weakening current guarantees.
- **[UNKNOWN]** The correct filesystem or host transaction primitive for binding lease epoch through authoritative rename/publication on supported platforms.
- **[UNKNOWN]** Whether users need checked-in native spec documents, runtime-only state, or both.
- **[UNKNOWN]** Whether a semantic RepositoryGraph yields enough context/impact benefit in this relatively small plugin to justify parser and freshness complexity.
- **[UNKNOWN]** Whether graph plans should span repositories; current state and path ownership are project-root scoped.
- **[UNKNOWN]** How model/provider usage accounting is surfaced by the exact pinned host and whether it can be bound to attempts.
- **[UNKNOWN]** Which external gates, such as pull requests, CI, deployments, or issue systems, belong in the initial product.
- **[UNKNOWN]** Whether intent lifecycle should absorb specification phases or those phases should be derived from separate entities.
- **[UNKNOWN]** The migration policy for existing v1 dependency entities if endpoint names and orientation change.

## Curiosity log

### Explored

- Execution DAGs for bounded agent work.
- Role graphs and independent verification.
- Repository semantic graphs and incremental evolution.
- Specification delta graphs.
- Durable work/readiness graphs.
- Selective retry, invalidation, caching, and critical-path reporting.
- OpenCode plugin dispatch and hook constraints.

### Deferred

- CRDT graph state: no demonstrated need beyond ordered Ledger events and fenced claims.
- Graph database adoption: graph sizes and query needs do not justify an external engine.
- Learned scheduling: deterministic priority and critical-path policy should come first.
- Symbol-level write ownership: path ownership is conservative and explainable; symbol ownership needs a trustworthy index.
- Cross-repository execution: authority, path, claim, and integration semantics are not yet defined.
- Quorum or debate graphs: no accepted evidence policy for combining probabilistic votes.

### `CURIOSITY_NO_GO`

- **No-go:** vendoring Graph Skill as `.graph/` runtime. It would create a second state/scheduler model and bypass Ledger authority.
- **No-go:** adopting Dolt/Beads as an internal dependency. The project already has a Ledger authority and stricter event/evidence requirements.
- **No-go:** adopting OpenSpec-generated assets as the native specification implementation. Repository policy says OpenSpec is not adopted, and generated Markdown cannot enforce native authority.
- **No-go:** enabling parallel workers as the first graph milestone. Current host lineage and persistence fencing are explicitly unsupported.
- **No-go:** caching model mutation nodes in v1. Complete read sets, environment binding, and side-effect replay safety are unproven.
- **No-go:** building an AST/code knowledge graph before execution/readiness semantics are coherent. It solves context retrieval, not lifecycle authority.

## Stop decision

Research is sufficient to choose an architectural direction and begin a focused design decision. Further broad survey is unlikely to change the primary conclusion: use one Ledger authority, four typed projections, one pure graph kernel, immutable plan revisions, Loop inside graph nodes, and evidence-bound completion.

Stop broad research now. Resume targeted investigation only for a concrete decision or spike:

- exact OpenCode child/session capability proof;
- publication fencing;
- Ledger v1-to-v2 migration;
- checked-in spec artifact format;
- repository semantic indexing benchmark.

## Bibliography and selection rationale

### Primary concept and implementation sources

- `gwaghmar/graph`, *Graph Skill*, https://github.com/gwaghmar/graph — selected as the repository most directly using the “graph engineering” label for coding-agent dependency DAGs, caching, retries, quality gates, and reports. Consulted for public behavior and concepts only; no source or templates copied.
- Kim et al., *An LLM Compiler for Parallel Function Calling*, ICML 2024, https://arxiv.org/abs/2312.04511 — selected as peer-reviewed grounding for planner/fetcher/executor separation and dependency-aware parallel dispatch.
- Luo et al., *RPG: A Repository Planning Graph for Unified and Scalable Codebase Generation*, ICLR 2026, https://arxiv.org/abs/2509.16198 — selected for semantic intent-to-artifact graph structure and dependency-aware repository generation.
- *RPG-Encoder*, ICML 2026, https://arxiv.org/abs/2602.02084 — selected for repository-to-graph extraction and incremental graph evolution.
- Microsoft, `RPG-ZeroRepo` and CoderMind, https://github.com/microsoft/RPG-ZeroRepo — selected as the primary implementation/documentation companion for RPG research.
- Alexey Grigorev, *AI-Native Development: Specifications, Loop and Graph Engineering*, 2026, https://alexeyondata.substack.com/p/ai-native-development-specifications — selected for the explicit distinction between context, loop, and graph engineering and the PM/engineer/QA role graph.

### Specification and work-ledger sources

- Fission AI, OpenSpec documentation and repository, https://github.com/Fission-AI/OpenSpec and https://openspec.dev/docs/core-concepts — selected as the primary source for current/proposed specification separation, capability requirements/scenarios, delta semantics, and archive.
- Gastown Hall, Beads documentation and repository, https://github.com/gastownhall/beads and https://beads.gascity.com/ — selected as the primary source for durable issue graphs, readiness, atomic claims, memory, and compaction.

### Integration examples

- Turma, https://github.com/turma-dev/turma — selected as an example of specification approval, work-graph transcription, agent execution, and external-state reconciliation. Its workflow is not treated as normative.
- MindSpec, https://github.com/mrmaxsteel/mindspec — selected as an example of evidence gates, maker/verifier separation, deterministic context packs, and Beads-backed execution. Its policy is not treated as normative.

### Local architectural sources

- `docs/decisions/0012-ledger-native-product.md` — current authority and clean-room boundary.
- `docs/decisions/0014-release-candidate-authority-and-fencing.md` — current publication, lineage, and ambiguity constraints.
- `docs/architecture/current-state.md` — canonical current/reachable behavior.
- `src/features/ledger/domain.ts` and `src/features/ledger/index.ts` — current entities, capability deltas, dependency helpers, replay, claims, evidence, and archive.
- `src/features/handoff/compiler.mjs` — current bounded DAG, ownership, context, criteria, retry, and canonicalization rules.
- `src/features/loop-engine/index.ts` and `journal.ts` — current per-claim continuation state machine and causation model.
- OpenCode 2 plugin documentation, https://opencode.ai/v2/docs/build/plugins — selected as the source of truth for current V2 plugin concepts; exact pinned-host probes remain authoritative for this repository.

## Provenance statement

This document is a clean-room conceptual synthesis based on public behavior, documentation, papers, and direct inspection of this repository. No external source code, schemas, command assets, prompt templates, or state files were copied. If a later change imports or adapts external implementation material, it requires a separate license/provenance review and reproducible manifest.
