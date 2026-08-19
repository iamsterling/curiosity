# Retrieval corpus governance and admission specification v1

**Status:** design contract under ADR 0052; not legal advice or authority to
acquire, retain, index, expose, or erase any source.

## Admission records and roles

No URL, MCP source, repository, feed, sitemap, public license label, or robots
allowance enters a corpus cell without an approved `AdmissionV1`:

```text
{version:"1",admissionId,cellId,sourceSurfaceId,sourceClass,locatorPattern,
 revisionScope,revisionFreshnessPolicyRef,reapprovalTriggers,
 rightsEvidence:[EvidenceRef],termsSnapshotRef,robotsPolicyRef,operatorInputs,
 allowedPurposes,allowedRepresentations,retentionPolicyRef,takedownPolicyRef,
 sensitiveDataPolicyRef,originPolicyRef,reviewers,decision,validFrom,expiresAt|null}
EvidenceRef={kind,uri,digest,observedAt,scope,reviewer}
revisionScope={kind:"IMMUTABLE",revisionId,contentDigest} |
 {kind:"OBSERVED_POLICY",policyVersion,policyDigest}
reapprovalTriggers=["REVISION_POLICY_CHANGED"|"OBSERVED_REVISION_STALE"|
 "TERMS_CHANGED"|"RIGHTS_CHANGED"|"LOCATOR_SCOPE_CHANGED"|
 "ACL_SEMANTICS_CHANGED"|"SOURCE_OWNERSHIP_CHANGED"]
decision="ADMIT"|"DENY"|"PENDING"|"SUSPEND"
```

Unknown fields/enums fail closed. At least one accountable data/rightsholder or
legal reviewer and one security/privacy reviewer MUST approve `ADMIT`; the same
person MUST NOT fill both roles for production. Operator inputs MUST include
intended purpose/audience, source owner, acquisition method, jurisdictions,
authentication/ACL expectations, expected sensitive data, excerpt policy,
recrawl need, and contact/takedown route. Digests bind reviewed terms/licenses;
terms drift or expiry changes admission to `PENDING` before further acquisition.
`reapprovalTriggers` MUST be nonempty, unique, and canonically ordered; an
unrecognized trigger is not ignorable.
An immutable scope admits only the exact revision/content pair. An observed scope
MUST resolve revisions under the named versioned policy digest and bind each
observed revision plus observation time to the acquisition request.
`revisionFreshnessPolicyRef` defines the approved maximum observation age and
recheck method; missing, stale, unverifiable, or policy-mismatched revision state
changes admission to `PENDING`. Every listed trigger requires reapproval before
new acquisition or projection publication.

Frontier eligibility MUST bind `admissionId`, revision-scope digest, observed or
immutable revision identity, and freshness-policy decision. Capture preparation
MUST repeat them. Projection manifests MUST include the admission and revision-
policy digests and MUST exclude captures outside the admitted scope or after a
trigger. Query eligibility MUST fail closed when the bound admission/revision
decision is stale; a later revision never inherits an earlier revision's rights.

## Source-class matrix

| Class                                                         | Required evidence                                                 | Default posture                              |
| ------------------------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------- |
| Project-owned                                                 | ownership and publication scope                                   | admit only named paths/revisions             |
| Permissively licensed official                                | exact content/license provenance and obligations                  | admit compatible files; preserve attribution |
| Permissioned third party                                      | written grant bound to purpose, retention, excerpts               | admit within grant only                      |
| Authenticated/ACL-sensitive                                   | contract plus principal/purpose/ACL and deletion semantics        | native connector; no public cache            |
| Public web, no clear grant                                    | legal/rights review and source policy                             | deny/pending                                 |
| Personal, regulated, illegal, paywalled, or access-controlled | specialist approval and controls                                  | deny by default                              |
| Dataset/archive                                               | dataset terms plus item-level rights/provenance/deletion analysis | separate admission; no inherited permission  |

Accessibility, robots permission, search-engine presence, or “open data” MUST NOT
substitute for rights evidence. Admission permits only the recorded purpose and
representations; it does not validate truth or grant action authority.

## Initial corpus cell

`curiosity-technical-ecosystem-v1` MAY contain only individually admitted,
official Curiosity, OpenCode, and MCP documentation/repositories and explicitly
approved direct dependency documentation/repositories. Seeds MUST name exact
organizations/projects, host/path patterns, branch/tag or observed revision
policy, allowed file/media types, and excerpt/retention rules. Forks, issues,
discussions, user content, package mirrors, transitive dependencies, arbitrary
outlinks, and similarly named domains are excluded unless separately admitted.

Links, feeds, and sitemaps may propose candidates but cannot widen the cell.
Repository software licenses MUST NOT be presumed to cover hosted documentation,
issues, trademarks, or third-party embedded content. Initial qualification uses
approved synthetic/project-authored fixtures before any live acquisition.

Common Crawl is deferred. Its inclusion or URL index presence grants no page
rights and its immutable archives complicate erasure. No WARC/WAT/WET payload,
index-derived seed, mirror, benchmark payload, or customer-visible excerpt may be
used without a later dataset-specific review and ADR.

## Retention, takedown, erasure, and holds

Every admitted class binds finite raw-capture, derived, projection, audit, export,
snapshot, and backup retention rules. Expiry immediately suppresses acquisition
and query eligibility, then starts separately tracked erasure. Takedown intake
MUST authenticate the request as policy requires, preserve case/audit evidence,
support emergency suppression before adjudication, and record scope/outcome.

A tombstone MUST propagate to frontier, captures, representations, passages,
indexes, caches, exports, replicas, and future rebuild inputs. States are exactly
`LIVE`, `SUPPRESSED`, `ERASURE_PENDING`, `PRIMARY_ERASED`,
`RETAINED_UNDER_HOLD`, `BACKUP_EXPIRY_PENDING`, `ERASURE_VERIFIED`; no soft-delete
claim equals erasure. Legal holds are scoped, approved, immutable records with
owner, reason reference, start/review/expiry, and access restrictions. Holds
prevent physical deletion only where specified; ordinary serving remains
suppressed. Completion requires per-layer evidence or an unexpired hold.

## Go/no-go and acceptance

A source is GO only when admission is `ADMIT` and current; identity/rights/terms/
robots/origin/ACL/retention/takedown/sensitive-data owners are named; fixtures pass;
and acquisition/query bounds are separately approved. Any missing, expired,
conflicting, or unknown item is NO-GO. Corpus-wide approval MUST NOT hide a
source-specific NO-GO.

Binary tests MUST prove:

1. unknown/expired terms, missing rights scope, split-role violation, or locator
   outside an admitted pattern prevents discovery claim and fetch;
2. immutable revision mismatch, stale observed revision, policy-digest change,
   or any reapproval trigger blocks acquisition and projection publication;
3. links/sitemaps/feeds and package dependencies cannot widen the cell;
4. ACL-sensitive content cannot enter public cache or a connector lacking native
   deletion/ACL semantics;
5. suspension/takedown races suppress new fetch, projection, cache, and delivery;
6. erasure reporting remains pending while any layer/backup lacks evidence and a
   hold never restores ordinary serving;
7. Common Crawl input is rejected by the v1 cell policy.

## Deferrals and owner decisions

Named legal/privacy/security/data operators, jurisdictional analysis, approved
licenses/terms, retention periods, excerpt limits, sensitive/illegal-content
handling, takedown SLA, backup expiry, hold process, and every live seed are open
owner decisions. Production corpus and thresholds remain unauthorized.

## Traceability

[ADRs 0041](../decisions/0041-unified-retrieval-memory-evidence-substrate.md),
[0044](../decisions/0044-source-surfaces-connectors-and-retrieval-modes.md),
[0051](../decisions/0051-reversible-retrieval-v3-development-tranche.md), and
[0052](../decisions/0052-next-retrieval-source-and-owned-web-specification-program.md);
[Common Crawl research](../research/products/common-crawl.md). Primary terms:
[Common Crawl Terms](https://commoncrawl.org/terms-of-use) and
[GitHub Terms](https://docs.github.com/en/site-policy/github-terms/github-terms-of-service).
