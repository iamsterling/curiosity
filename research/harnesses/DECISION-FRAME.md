# Custom-harness decision frame

> Synthesis method only. This file does not score a harness, change an accepted
> ADR, authorize implementation, or elevate a dossier into design authority.

**Decision:** Should Curiosity build its accepted custom harness directly, use
another harness as a substrate, fork one, or interoperate with one behind a
bounded adapter—and which observed patterns should it adapt or reject?  
**Evidence cutoff:** 2026-08-24 UTC.  
**Inputs:** the independent dossiers governed by
[`RESEARCH-CONTRACT.md`](RESEARCH-CONTRACT.md), plus the accepted custom-harness
ADRs and implementation plan under `docs/architecture/custom-harness/`.

## 1. Decision options

Each serious candidate is evaluated under every applicable option. A strong
product is not automatically a suitable substrate.

1. **Build directly:** implement the accepted architecture in the isolated
   `apps/custom-harness/` workspace and clean-room adapt only evidence-backed
   patterns.
2. **Use as substrate:** depend on a public library/runtime boundary while
   keeping Curiosity's Effect authority, durable facts, policy, and Rust
   supervisor authoritative.
3. **Fork:** own and modify a complete open harness at an exact revision.
4. **Interoperate:** run the harness as a reviewed external tool or protocol
   peer with explicit non-authority and accounting boundaries.
5. **Reject/defer:** use neither code nor protocol; retain only research lessons
   or await a discriminating result.

## 2. Hard compatibility gates

Failure of one gate rejects **substrate** and **fork** for Phase 1 unless a
small, reviewable adapter can remove the conflict without preserving a second
authority. Unknown consequential behavior fails closed.

| Gate | Required Phase 1 property | Accepted source |
| --- | --- | --- |
| G-01 Sole application authority | One Effect process owns commands, attempts, policy, gates, model-loop retry, accounting, completion, and domain writes. | ADR-001 |
| G-02 Narrow execution authority | Rust is mandatory but owns only qualified host mechanics and receipts; no fallback direct execution exists. | ADR-001 |
| G-03 Durable canonical facts | Append-only events and operational ledgers commit under one qualified SQLite writer; projections and UI are non-authoritative. | ADR-002 |
| G-04 Attempt and cancellation semantics | New identity per attempt/call, fencing, finite delivery-aware retry, durable recursive cancellation, and verified descendant termination. | ADR-003 |
| G-05 Complete provider-call visibility | Every physical provider request is durably allocated before dispatch; hidden retries/loops are disabled; missing usage is UNKNOWN. | ADR-004 |
| G-06 Typed action-time authority | Recursive capability intersections, immutable attempt ceilings, provenance/taint preservation, and exact sink checks. | ADR-005 |
| G-07 Extension trust boundary | No dynamic untrusted in-process plugin; reviewed tools are cooperative TCB processes; untrusted execution requires an exact qualified sandbox. | ADR-006 |
| G-08 Root-anchored Git mechanics | Worktree lifecycle uses verified Git facts and race-resistant use-time containment; interruption reconciles rather than blindly replays. | ADR-007 |
| G-09 Human gate integrity | Default-deny/propose-first; one authenticated human owns binding approval; model/tool/UI output cannot authorize. | ADR-008 |
| G-10 Thin local transports | One authenticated local actor and one Command Port; no anonymous-localhost, remote, multi-user, Windows, or degraded-readiness implication. | ADR-009 |
| G-11 Exact identity and license | Exact source/artifact/feature/platform qualification, no auto-update, no unclear-license copying, and no inherited qualification. | ADR-010 |

## 3. Comparison dimensions

Weights compare candidates that survive the relevant gates. Scores never hide
UNKNOWN: each cell must carry claim IDs, confidence, consequence, and an
explicit unknown penalty or stop. Vendor assertions are not independent
measurement.

| Dimension | Weight | Decision question |
| --- | ---: | --- |
| Authority-boundary fit | 16 | Can the candidate remain subordinate to one Effect authority without a second loop, writer, retry owner, gate owner, or completion path? |
| Enforcement and sandbox honesty | 12 | Where are permissions actually enforced, what ambient authority remains, and does unavailable confinement deny rather than degrade? |
| Durability, replay, and restart | 12 | Are accepted commands, sessions, attempts, events, and external ambiguity reconstructable without making projections/logs authoritative? |
| Failure, cancellation, and concurrency | 10 | Are cancellation, descendant termination, fencing, collision isolation, partial failure, and finite retry explicit and testable? |
| Provider/tool visibility and accounting | 10 | Can every physical provider/tool dispatch be observed, identified, cancelled, and attributed without hidden loops or zero-valued unknowns? |
| Context and long-horizon quality | 10 | How are instructions, provenance, compaction, memory, tool outputs, steering, and context contamination controlled? |
| Extension and protocol architecture | 8 | Are interfaces versioned, narrow, unloadable/testable where appropriate, and separable from domain authority? |
| Evidence, observability, and qualification | 8 | Are model-visible inputs, actions, decisions, costs, and failures correlated, exportable, adversarially testable, and resistant to spoofing? |
| Provenance, license, and update risk | 7 | Can exact running bytes map to reviewed source/license, with explicit compatibility and rollback behavior? |
| Implementation leverage and reversibility | 7 | How much verified engineering is reused, how much conflicting machinery must be removed, and how cheaply can Curiosity exit before durable/external effects? |
| **Total** | **100** | Scores support—not replace—the hard gates and narrative decision. |

### Evidence scale

- `5`: direct primary source plus independent or runtime evidence at the pinned
  snapshot; behavior fits the dimension with no material unresolved conflict.
- `4`: strong primary evidence and good fit; one bounded non-critical gap.
- `3`: mixed fit or adaptation required; consequence and removal plan are clear.
- `2`: material conflict, weak enforcement, or substantial rewrite.
- `1`: severe conflict or evidence only for intent/marketing.
- `0`: directly incompatible for the evaluated option.
- `UNKNOWN`: insufficient or contradictory evidence. Never coerce to zero or an
  average; state whether it blocks the option.

Scores must include confidence (`HIGH`, `MEDIUM`, `LOW`, or `N/A`) and exact
dossier claims. Weighted totals are reported only when every consequential
dimension is observed or its unknown has an explicitly accepted non-blocking
scope. Otherwise the result is `NO_TOTAL_CONSEQUENTIAL_UNKNOWN`.

## 4. Required synthesis records

For every harness, produce:

```yaml
target: <name>
snapshot: <commit/version>
option: BUILD_DIRECTLY|SUBSTRATE|FORK|INTEROPERATE|REJECT_DEFER
hard_gates:
  - gate: G-01
    result: PASS|FAIL|UNKNOWN|NOT_APPLICABLE
    claim_ids: []
    consequence: <bounded sentence>
dimensions:
  - dimension: authority-boundary-fit
    score: 0|1|2|3|4|5|UNKNOWN
    confidence: HIGH|MEDIUM|LOW|N/A
    claim_ids: []
    consequence: <bounded sentence>
verdict: ADOPT|ADAPT|REJECT|DEFER
verdict_scope: <code, protocol, pattern, or whole option>
```

`ADOPT` means an exact bounded mechanism is recommended under a later
authorization; it never grants that authorization. `ADAPT` means preserve the
minimal pattern in project-owned expression. `REJECT` is snapshot/option scoped.
`DEFER` states the next discriminating probe.

## 5. Cross-harness architecture questions

The final synthesis must answer these before naming a path:

1. Is any public runtime narrow enough to sit below Effect without retaining its
   own competing loop, retry, persistence, approval, or tool authority?
2. Which event/session model best supports complete model-visible provenance,
   fork/replay, and crash recovery without letting the transcript become domain
   authority?
3. Which permission designs enforce typed recursive resources at the final sink,
   rather than classify tool names or model prose?
4. Which cancellation designs verify process-tree termination and fence late
   results rather than merely abort a promise or stream?
5. Which provider abstractions expose one physical send, usage, caching, retry,
   and delivery ambiguity well enough for ADR-004?
6. Which context strategies preserve critical instructions and provenance across
   compaction while keeping retrieved/tool content untrusted?
7. Which plugin/protocol boundaries provide leverage without dynamic untrusted
   code in the authority process?
8. Is a clean-room build smaller and safer than removing conflicting authority
   from the best existing substrate?

## 6. Curiosity and stop rule

After the first complete synthesis, rank unresolved threads by decision
relevance, expected value, novelty, and cost. Promote at most one deferred
harness or one discriminating probe. Reject the rest explicitly as
`CURIOSITY_NO_GO` when they are derivative, do not change the hard-gate verdict,
depend on inaccessible proprietary internals, or cost more than the decision
value they can add.

Stop when all five decision options have a supported verdict, the recommended
path has no unaddressed consequential UNKNOWN, and a second evidence pass would
not change a hard gate or top recommendation.
