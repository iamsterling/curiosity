# Retrieval evaluation and SearXNG cutover specification v1

**Status:** design contract under ADR 0052. SearXNG remains operational. This
document authorizes no shadow traffic, corpus acquisition, credential access,
deployment change, cutover, rollback, executable removal, or production claim.

## Evaluation records and suites

Every run MUST produce an immutable `EvaluationRunV1`:

```text
{version:"1",runId,suiteId,suiteDigest,systemId,buildDigest,configDigest,
 corpusGeneration,querySetDigest,candidatePoolDigest,judgmentSetDigest,
 authorityPolicyDigest,
 startedAt,endedAt,environment,metrics,failures,seedProvenance,reviewers}
```

Unknown/missing fields invalidate comparison. Query and judgment changes create
new digests; results across incompatible suites MUST NOT be presented as one
trend. `seedProvenance` MUST prove that no SearXNG result, snippet, URL, ranking,
provider list, query suggestion, cache, or log changed owned-corpus membership,
acquisition/frontier inputs, or query selection. This is **acquisition/query-set
seeding**, and it is prohibited.

The minimum suites are:

1. **rights-cleared relevance:** navigational, known-item, topical, multi-source,
   temporal, contradiction, and no-answer queries for the admitted technical cell;
2. **freshness/change:** new revision, supersession, deletion, stale capture,
   recrawl, and unknown-time cases;
3. **safety/authority:** tenant/purpose/ACL denial, revocation race, tombstone,
   prompt injection, malformed media, SSRF/redirect/DNS, secret and existence leak;
4. **resilience/operations:** timeout, cancellation, crash points, corrupt capture/
   index, stale watermark, disk pressure, kill switch, rebuild and restore; and
5. **compatibility:** bounded current public ABI, stable redacted diagnostics,
   citations/provenance, coverage, partiality, and no-fallback behavior.

Public BEIR/MTEB/MIRACL/LoTTE/FreshQA/TREC methods MAY inform suite design, but
payloads require separate rights/admission and cannot replace cell judgments.

## Judgments and metrics

Judgments MUST be pooled from blinded, randomized outputs of every compared
system plus known relevant fixtures; pooling depth and unjudged policy are
versioned. At least two trained assessors SHOULD judge each nontrivial query;
conflicts use an independent adjudicator. Assessors MUST see inert excerpts and
provenance, not system identity or scores. Inter-rater agreement, disagreement,
unjudged rate, and adjudication changes MUST be reported.

Candidate pooling is not acquisition seeding. For an independently selected,
frozen query set, SearXNG candidates MAY enter the qrels assessment pool if each
candidate is tagged `candidateOrigin="SEARXNG"` with run/build/config digest and
rank, then blinded before assessment. Candidate text/URLs remain evaluation data:
they MUST NOT change corpus admission, frontier/acquisition, query selection,
known-relevant fixtures, or serving indexes. The candidate pool and qrels MUST
retain origin tags after unblinding so leakage is auditable. A relevance judgment
about a SearXNG candidate does not admit or capture it. Pool retention and
assessor display require a separately approved evaluation-data rights/privacy
policy. Metrics MUST state whether each system was included in pooling and report
unjudged sensitivity.

Report Recall@k, Precision@k, MRR, nDCG@k when graded judgments support it,
success/no-answer calibration, source/origin diversity, duplicate rate, freshness
lag, citation-selector exactness, provenance completeness, coverage/partiality
accuracy, p50/p95/p99 latency, timeout/cancellation, build/recrawl cost, and
failure-code distribution. Safety gates are zero unauthorized/tombstoned returns,
zero unreproducible citations, zero secret/credential output, zero forbidden
network from extraction, complete seeded-fault detection, and zero hidden
fallback. Production relevance/latency/cost thresholds are owner decisions;
research results MUST be labeled provisional, not release authority.

## Shadow, canary, and decision gates

Shadow evaluation MUST duplicate only an already-authorized canonical query,
must not expose owned output to users, influence current ranking, write memory,
seed acquisition, or call SearXNG beyond the request it would already receive.
Queries and outputs follow approved privacy retention. A predeclared window binds
dates, traffic scope, budgets, stop conditions, builds/configs, and reviewers.

Canary follows successful offline and shadow gates. It serves only an explicitly
approved cohort and corpus cell with immediate kill switch, current SearXNG path
unchanged for non-canary traffic, and no per-query fallback inside the canary.
Failure returns the canary's typed failure; routing may change only between
requests under the deployment plan. Window duration and sample size are
provisional until operations and quality owners approve them.

Cutover is GO only when rights/corpus, security, relevance, freshness,
resilience, capacity, observability, support, license, backup/restore, takedown,
and independent-review gates all pass against immutable run IDs; all blockers
are closed; and a later ADR names owners, exact deployment, date, rollback
window, and thresholds. Otherwise it is NO-GO and SearXNG remains operational.

## Runtime fallback versus deployment rollback

Runtime fallback is automatic or request-time substitution of SearXNG after the
owned path is selected. It is prohibited during canary and after cutover because
it hides mode, authority, freshness, and failure.

Deployment rollback is an operator action replacing the whole deployment with a
prequalified pinned deployment during the later ADR's bounded rollback window.
It requires a recorded trigger, approval/capability, compatibility proof for
queries and current policy/tombstones, retained SearXNG configuration/credentials
under their existing controls, and an audit record. No result-level mixing occurs.
After the window closes and removal gates pass, SearXNG rollback is unavailable;
uncertainty fails closed. Emergency behavior after that point requires a new ADR,
not dormant fallback code or credentials.

## Removal sequence

Only a later accepted cutover ADR may execute this ordered sequence:

1. freeze and digest SearXNG executable/image, gateway, config, credential refs,
   licenses/source-offer evidence, observability, and rollback artifact;
2. cut traffic by explicit deployment routing; verify no runtime fallback path;
3. observe the approved rollback window and settle all safety/quality/operations
   gates; deployment rollback remains possible only as specified above;
4. close the window by owner decision, revoke SearXNG/upstream credentials and
   network routes, and prove no calls from application or jobs;
5. remove executable/image/service and gateway configuration, then deployment
   manifests, runtime switches, dead adapter code, tests/fixtures that imply
   fallback, dashboards/alerts, and secret references in separately reviewed
   changes while preserving required attribution/audit evidence; and
6. independently scan source, built artifacts, deployment state, secret manager,
   network telemetry, and runbooks; any residue blocks completion.

Removal MUST NOT erase historical provenance, AGPL compliance/source-offer
records, evaluation evidence, incident records, or the neutral public ABI.

## Binary acceptance scenarios

1. Mutated suite/judgment/config/corpus digests cannot compare as the same run.
2. Seed-provenance fixtures reject SearXNG influence on corpus, acquisition, or
   query selection while allowing only tagged candidates for a frozen-query pool.
3. Tagged SearXNG candidates survive blind/unblind provenance, cannot enter the
   corpus/frontier/index, and pooled judgments reproduce disclosed metrics.
4. Every safety fault is detected; one unauthorized/tombstoned result is NO-GO.
5. Shadow output cannot affect serving, acquisition, memory, or SearXNG call count.
6. Canary failure returns typed failure without per-query SearXNG substitution.
7. Rollback requires the prequalified whole deployment and cannot mix results.
8. Removal completion fails while any executable, config, credential, route,
   switch, fallback test/code, or undocumented compliance record is missing.

## Deferrals and owner decisions

Queries, assessors, pooling depth, metrics/k values, relevance/latency/cost
thresholds, windows/cohorts, stop conditions, rollback triggers/duration,
production deployment, and removal dates are unresolved. Product/quality,
security/privacy/legal, runtime, and operations owners must approve them. No
threshold in research or this specification has production authority.

## Traceability

[ADRs 0047](../decisions/0047-investigation-ranking-and-stopping-semantics.md),
[0048](../decisions/0048-retrieval-migration-topology-and-qualification.md),
[0051](../decisions/0051-reversible-retrieval-v3-development-tranche.md), and
[0052](../decisions/0052-next-retrieval-source-and-owned-web-specification-program.md);
[SearXNG research](../research/products/searxng.md),
[benchmark inventory](../research/README.md), and
[compendium](../research/next-retrieval-phase-compendium-2026-08-19.md).
