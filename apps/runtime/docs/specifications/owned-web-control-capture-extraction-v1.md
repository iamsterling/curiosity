# Owned-web control, capture, and extraction specification v1

**Status:** design contract under ADR 0052; no network, crawler, database,
capture storage, rendering, dependency, persistence, or production authority.

Unknown fields/states/events MUST fail closed. Research values are provisional.

## Identity and local control records

The local profile targets one SQLite database with WAL mode and one serialized
logical writer. It is acquisition operational state, not Ledger lifecycle truth.
It is separate from plugin ADR 0024's canonical local-authority SQLite profile;
its WAL setting MUST NOT leak into, weaken, share a transaction with, or imply a
setting for that controlling profile.
Every mutation MUST append an immutable event in the same transaction as its
materialized control view. The portable logical records are:

```text
Url={urlId,canonicalUrl,scheme,hostAscii,port,pathQuery,policyVersion}
Origin={originId,scheme,hostAscii,port,policyRef,nextEligibleAt,killState}
Frontier={urlId,cellId,admissionRevisionBindingDigest,state,priority,
 notBefore,attempts,lease|null,recrawlAt|null}
Lease={leaseId,owner,fence,issuedAt,expiresAt}
Attempt={attemptId,urlId,leaseId,fence,startedAt,settlement,code,httpStatus|null}
Event={eventId,eventType,aggregateId,sequence,occurredAt,payload,schemaVersion}
```

URL canonicalization MUST be versioned; fragments and userinfo are forbidden,
scheme is `http|https`, IDNA host and effective port define origin, and redirect
targets retain distinct URL identities. Canonical hints and duplicates are typed
relationships, never identity merges.

Frontier states are exactly `DISCOVERED`, `BLOCKED_POLICY`, `READY`, `LEASED`,
`FETCHING`, `FETCHED`, `RETRY_WAIT`, `RECRAWL_WAIT`, `TOMBSTONED`, `QUARANTINED`,
`EXHAUSTED`.
Events are exactly `CELL_REGISTERED`, `URL_DISCOVERED`, `ROBOTS_OBSERVED`,
`SITEMAP_OBSERVED`, `FEED_OBSERVED`, `POLICY_EVALUATED`, `FRONTIER_ELIGIBLE`,
`LEASE_GRANTED`, `LEASE_EXPIRED`, `FETCH_STARTED`, `FETCH_SETTLED`,
`CAPTURE_COMMITTED`, `EXTRACTION_STARTED`, `EXTRACTION_SETTLED`,
`RETRY_SCHEDULED`, `RECRAWL_SCHEDULED`, `KILL_CHANGED`, `TOMBSTONE_PUBLISHED`,
`PROJECTION_STAGED`, `PROJECTION_PUBLISHED`, `PROJECTION_RETIRED`,
`RECOVERY_BLOCKED`, `RECOVERY_CLEARED`.
Per-aggregate sequence is gap-free; duplicate event ID with unequal canonical
payload is corruption. A settlement with a stale fence MUST NOT mutate state.

Run/control states are exactly `NEW`, `RUN`, `PAUSE_CLAIMS`,
`ABORT_IN_FLIGHT`, `DISABLED`, `RECOVERY_BLOCKED`; robots/policy states are
`UNKNOWN`, `CURRENT`, `BLOCKED`, `STALE`; capture-observation states are
`FETCH_SUCCEEDED`, `REJECTED`, `QUARANTINED`, `LOCAL_COMMITTED_OBSERVED` plus
absence; discovery-observation states are `OBSERVED` plus absence; extraction
states are `NOT_STARTED`, `RUNNING`, `SUCCEEDED`, `FAILED`, `QUARANTINED`;
projection-publication states are `STAGED`, `PUBLISHED`, `RETIRED` plus absence;
tombstone states are `LIVE`, `PUBLISHED`. Terminal states have no outgoing
transition unless a row explicitly says otherwise.

## Closed aggregate transitions

The matrices below are exhaustive for v1; every prior and next state is a literal
closed enum member. Every event additionally requires the exact aggregate ID,
next gap-free sequence, unique event ID, schema version, and canonical payload
digest. A retry with the same idempotency key and equal payload is a no-op;
unequal reuse is corruption. Rows not listed MUST fail without state mutation.

| Aggregate                      | Prior                                                                                                                                                | Event                  | Next                                                       | Mandatory payload                                                                                                                                                                                               | Fence/idempotency precondition                                                                                 | Aggregate owner                                   | Canonical Ledger observation                                        |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------- |
| run/control                    | `NEW`                                                                                                                                                | `CELL_REGISTERED`      | `RUN`                                                      | cell, run, policy/admission digests, budgets                                                                                                                                                                    | unique run key                                                                                                 | acquisition control                               | none; no lifecycle authority                                        |
| run/control                    | `RUN`                                                                                                                                                | `KILL_CHANGED`         | `PAUSE_CLAIMS` \| `ABORT_IN_FLIGHT` \| `DISABLED`          | scope, prior/new kill state, reason, actor decision                                                                                                                                                             | current control generation                                                                                     | acquisition control                               | policy/authority decision ref when externally governed              |
| run/control                    | `PAUSE_CLAIMS`                                                                                                                                       | `KILL_CHANGED`         | `RUN` \| `ABORT_IN_FLIGHT` \| `DISABLED`                   | scope, prior/new state, reason, actor decision                                                                                                                                                                  | current control generation                                                                                     | acquisition control                               | policy/authority decision ref when externally governed              |
| run/control                    | `ABORT_IN_FLIGHT`                                                                                                                                    | `KILL_CHANGED`         | `PAUSE_CLAIMS` \| `DISABLED`                               | settled in-flight inventory, reason, actor decision                                                                                                                                                             | all prior fences invalidated                                                                                   | acquisition control                               | policy/authority decision ref when externally governed              |
| run/control                    | `NEW` \| `RUN` \| `PAUSE_CLAIMS` \| `ABORT_IN_FLIGHT`                                                                                                | `RECOVERY_BLOCKED`     | `RECOVERY_BLOCKED`                                         | check, finding code, inventory digest                                                                                                                                                                           | startup/reconcile run key                                                                                      | acquisition control                               | referenced, never inferred                                          |
| run/control                    | `RECOVERY_BLOCKED`                                                                                                                                   | `RECOVERY_CLEARED`     | `RUN` \| `PAUSE_CLAIMS` \| `ABORT_IN_FLIGHT` \| `DISABLED` | target state, reconciliation receipt, inventory digest, actor decision                                                                                                                                          | new generation/fences; exact blocked finding                                                                   | acquisition control                               | exact canonical heads/cursors inspected                             |
| frontier                       | absent                                                                                                                                               | `URL_DISCOVERED`       | `DISCOVERED`                                               | URL/origin/cell, discovery edge, admission/revision binding                                                                                                                                                     | unique canonical URL+cell+binding                                                                              | acquisition control                               | none; discovery is ineligible                                       |
| sitemap discovery observation  | absent                                                                                                                                               | `SITEMAP_OBSERVED`     | `OBSERVED`                                                 | observation ID, source URL, source revision/digest, observed time, capture/representation ref, parser/policy digests, discovered-edge digest, `replacesObservationId=null`                                      | first observation; unique kind+source+revision key                                                             | acquisition discovery observer                    | exact eligible canonical capture/representation ref only            |
| sitemap discovery observation  | `OBSERVED`                                                                                                                                           | `SITEMAP_OBSERVED`     | `OBSERVED`                                                 | byte-equal observation ID, source URL, source revision/digest, observed time, capture/representation ref, parser/policy digests, discovered-edge digest, and `replacesObservationId`                            | same event/idempotency key; exact replay is a no-op with no append or sequence advance                         | acquisition discovery observer                    | unchanged                                                           |
| sitemap discovery observation  | absent                                                                                                                                               | `SITEMAP_OBSERVED`     | `OBSERVED`                                                 | observation ID, source URL, changed source revision and mandatory digest, observed time, capture/representation ref, parser/policy digests, discovered-edge digest, exact prior head as `replacesObservationId` | new kind+source+revision key; observed time strictly after current head                                        | acquisition discovery observer                    | exact eligible canonical capture/representation ref only            |
| sitemap discovery observation  | `OBSERVED`                                                                                                                                           | `SITEMAP_OBSERVED`     | `OBSERVED`                                                 | attempted and existing observation IDs, source URLs, source revisions/digests, observed times, capture/representation refs, parser/policy digests, discovered-edge digests, and replacement IDs                 | same observation ID, source revision, or idempotency key with unequal canonical payload; corruption, no append | acquisition discovery observer                    | unchanged                                                           |
| sitemap discovery observation  | absent                                                                                                                                               | `SITEMAP_OBSERVED`     | absent                                                     | attempted observation ID, source URL/revision/digest, observed time, capture/representation ref, parser/policy digests, discovered-edge digest, replacement ID; current head ID/digest/time                     | different source revision at or before current head time; stale rejection, no creation or head change          | acquisition discovery observer                    | unchanged                                                           |
| feed discovery observation     | absent                                                                                                                                               | `FEED_OBSERVED`        | `OBSERVED`                                                 | observation ID, source URL, source revision/digest, observed time, capture/representation ref, parser/policy digests, discovered-edge digest, `replacesObservationId=null`                                      | first observation; unique kind+source+revision key                                                             | acquisition discovery observer                    | exact eligible canonical capture/representation ref only            |
| feed discovery observation     | `OBSERVED`                                                                                                                                           | `FEED_OBSERVED`        | `OBSERVED`                                                 | byte-equal observation ID, source URL, source revision/digest, observed time, capture/representation ref, parser/policy digests, discovered-edge digest, and `replacesObservationId`                            | same event/idempotency key; exact replay is a no-op with no append or sequence advance                         | acquisition discovery observer                    | unchanged                                                           |
| feed discovery observation     | absent                                                                                                                                               | `FEED_OBSERVED`        | `OBSERVED`                                                 | observation ID, source URL, changed source revision and mandatory digest, observed time, capture/representation ref, parser/policy digests, discovered-edge digest, exact prior head as `replacesObservationId` | new kind+source+revision key; observed time strictly after current head                                        | acquisition discovery observer                    | exact eligible canonical capture/representation ref only            |
| feed discovery observation     | `OBSERVED`                                                                                                                                           | `FEED_OBSERVED`        | `OBSERVED`                                                 | attempted and existing observation IDs, source URLs, source revisions/digests, observed times, capture/representation refs, parser/policy digests, discovered-edge digests, and replacement IDs                 | same observation ID, source revision, or idempotency key with unequal canonical payload; corruption, no append | acquisition discovery observer                    | unchanged                                                           |
| feed discovery observation     | absent                                                                                                                                               | `FEED_OBSERVED`        | absent                                                     | attempted observation ID, source URL/revision/digest, observed time, capture/representation ref, parser/policy digests, discovered-edge digest, replacement ID; current head ID/digest/time                     | different source revision at or before current head time; stale rejection, no creation or head change          | acquisition discovery observer                    | unchanged                                                           |
| robots/policy                  | `UNKNOWN` \| `STALE`                                                                                                                                 | `ROBOTS_OBSERVED`      | `CURRENT` \| `BLOCKED`                                     | origin, robots capture/representation refs, fetched/expiry times, parser/policy digests                                                                                                                         | observation key; eligible canonical capture required                                                           | acquisition control                               | exact `LOCAL_COMMITTED` capture receipt                             |
| robots/policy                  | `CURRENT` \| `BLOCKED`                                                                                                                               | `POLICY_EVALUATED`     | `CURRENT` \| `BLOCKED` \| `STALE`                          | admission/revision, robots, origin, authority decisions and expiries                                                                                                                                            | all decision digests current                                                                                   | acquisition control                               | exact policy/capture refs; no promotion                             |
| frontier                       | `DISCOVERED` \| `BLOCKED_POLICY` \| `RETRY_WAIT` \| `RECRAWL_WAIT`                                                                                   | `FRONTIER_ELIGIBLE`    | `READY` \| `BLOCKED_POLICY`                                | URL, policy/robots/admission-revision decisions, priority, not-before                                                                                                                                           | current run generation; no tombstone                                                                           | acquisition control                               | current decision refs only                                          |
| frontier/lease                 | `READY`                                                                                                                                              | `LEASE_GRANTED`        | `LEASED`                                                   | lease ID/owner/fence/issued/expiry, origin slot                                                                                                                                                                 | monotonic fence; unique claim key                                                                              | acquisition control                               | none                                                                |
| frontier/lease                 | `LEASED`                                                                                                                                             | `FETCH_STARTED`        | `FETCHING`                                                 | attempt, lease, fence, URL and network-policy digests                                                                                                                                                           | unexpired exact lease/fence; unique attempt                                                                    | acquisition control                               | none; no capture exists                                             |
| frontier/lease                 | `LEASED` \| `FETCHING`                                                                                                                               | `LEASE_EXPIRED`        | `READY`                                                    | expired lease/fence, recovery time, not-before                                                                                                                                                                  | clock/policy proves expiry; invalidate fence                                                                   | acquisition control                               | none                                                                |
| frontier/fetch                 | `FETCHING`                                                                                                                                           | `FETCH_SETTLED`        | `FETCHED` \| `RETRY_WAIT` \| `QUARANTINED` \| `EXHAUSTED`  | attempt, exact lease/fence, settlement/code, HTTP/media/byte digests                                                                                                                                            | live exact fence; one settlement per attempt                                                                   | acquisition control                               | none; success is still ineligible                                   |
| frontier                       | `FETCHED` \| `RETRY_WAIT`                                                                                                                            | `RETRY_SCHEDULED`      | `RETRY_WAIT`                                               | class, attempt count, delay inputs, not-before                                                                                                                                                                  | bounded retry policy digest                                                                                    | acquisition control                               | none                                                                |
| frontier                       | `FETCHED`                                                                                                                                            | `RECRAWL_SCHEDULED`    | `RECRAWL_WAIT`                                             | source class, validators, policy, recrawl time                                                                                                                                                                  | current admission/revision policy                                                                              | acquisition control                               | prior capture ref is observational only                             |
| capture settlement observation | absent                                                                                                                                               | `FETCH_SETTLED`        | `FETCH_SUCCEEDED` \| `REJECTED` \| `QUARANTINED`           | attempt settlement, staged-object/capture-intent refs or rejection                                                                                                                                              | exact settled attempt/fence; unique intent key                                                                 | acquisition observer                              | none; staged bytes/intents are ineligible                           |
| capture settlement observation | `FETCH_SUCCEEDED`                                                                                                                                    | `CAPTURE_COMMITTED`    | `LOCAL_COMMITTED_OBSERVED`                                 | ingest ID, capture/object/receipt IDs, canonical record/anchor heads and proof digest                                                                                                                           | authenticated exact proof; same intent/input digest                                                            | acquisition observer                              | **required:** canonical `LOCAL_COMMITTED` under plugin ADR 0024     |
| extraction                     | `NOT_STARTED`                                                                                                                                        | `EXTRACTION_STARTED`   | `RUNNING`                                                  | committed capture receipt, extractor/policy, limits, representation ID                                                                                                                                          | unique representation ingest key                                                                               | acquisition/extraction control                    | required raw-capture `LOCAL_COMMITTED`                              |
| extraction                     | `RUNNING`                                                                                                                                            | `EXTRACTION_SETTLED`   | `SUCCEEDED` \| `FAILED` \| `QUARANTINED`                   | representation/passages digests or code, lineage, resource receipt                                                                                                                                              | exact extraction run; one settlement                                                                           | acquisition/extraction control                    | success remains ineligible until its own ADR 0024 `LOCAL_COMMITTED` |
| projection publication         | absent                                                                                                                                               | `PROJECTION_STAGED`    | `STAGED`                                                   | generation manifest, input inventory, Ledger cursor, tombstone watermark, artifact digests                                                                                                                      | unique generation; verified closed inputs                                                                      | projection control                                | every eligible input is `LOCAL_COMMITTED`; exact cursor/watermark   |
| projection publication         | `STAGED`                                                                                                                                             | `PROJECTION_PUBLISHED` | `PUBLISHED`                                                | verified manifest/artifacts, activation decision                                                                                                                                                                | same staged digest; current cursor/watermark                                                                   | projection control                                | current canonical policy/tombstone observations required            |
| projection publication         | `PUBLISHED`                                                                                                                                          | `PROJECTION_RETIRED`   | `RETIRED`                                                  | generation ID/digest, replacement or retirement reason, retention decision                                                                                                                                      | active generation match; no request may repin after event                                                      | projection control                                | current canonical policy/tombstone observations retained            |
| tombstone                      | `LIVE`                                                                                                                                               | `TOMBSTONE_PUBLISHED`  | `PUBLISHED`                                                | identity scope, canonical tombstone ID/head, reason code, effective time                                                                                                                                        | unique tombstone key; current authority                                                                        | canonical Ledger; acquisition mirrors suppression | **required:** exact canonical Ledger tombstone                      |
| frontier                       | `DISCOVERED` \| `BLOCKED_POLICY` \| `READY` \| `LEASED` \| `FETCHING` \| `FETCHED` \| `RETRY_WAIT` \| `RECRAWL_WAIT` \| `QUARANTINED` \| `EXHAUSTED` | `TOMBSTONE_PUBLISHED`  | `TOMBSTONED`                                               | canonical tombstone ID/head and affected URL/cell                                                                                                                                                               | exact canonical tombstone; invalidate all fences                                                               | acquisition observer                              | **required:** exact canonical Ledger tombstone                      |

For both discovery-observation kinds, the aggregate key is
`{kind,sourceUrlId,sourceRevision}` and its `OBSERVED` record is immutable. A
changed source revision creates a successor aggregate, retains every prior
version, and advances the per-kind/source head only under the changed-version
row. Source-revision reuse with a different source digest or any other unequal
canonical payload is collision corruption. Exact replay takes precedence over
collision evaluation, which takes precedence over the stale rule. Every
discovered URL still enters through `URL_DISCOVERED`; observations grant neither
admission nor frontier eligibility.

`CAPTURE_COMMITTED` is retained as the acquisition event name solely for
compatibility with the pure v3 vocabulary. It means “canonical
`LOCAL_COMMITTED` observed,” not “acquisition committed capture.” It MUST NOT be
emitted for `LOCAL_PREPARED`, `EXTERNAL_APPENDED`, staged bytes, object discovery,
or an acquisition fetch settlement. Acquisition SQLite cannot acknowledge a
capture, grant evidence/query eligibility, or repair canonical Ledger state.

## Scheduling, discovery, and recovery

Eligibility MUST combine cell/source admission, origin policy, robots snapshot,
kill state, per-origin concurrency and next-eligible time, global budgets,
retry/recrawl time, and tombstones. Priority MUST be deterministic within a
policy version; fairness and production rates require qualification. Transactions
MUST end before DNS, HTTP, rendering, or extraction. Leases are short, are not
renewable in v1, and are fenced by a monotonically increasing origin or frontier
fence. At-least-once attempts are expected; canonical capture publication is
idempotent by ingest ID and canonical input, not “exactly once.”

Robots MUST follow RFC 9309 parsing/matching and configured user agent, but MUST
NOT be treated as authorization. Sitemap and Atom/RSS entries are discovery hints
only. Each observation binds capture/time/policy. Retry classification MUST be
closed by stable code and apply bounded exponential delay plus deterministic
jitter; `Retry-After` MAY increase but never bypass the policy maximum. Permanent
policy/TLS/MIME/size denials do not retry automatically. Recrawl uses source-class
policy and observed validators; freshness is never inferred from unchanged URL.

Kill state is exactly `RUN`, `PAUSE_CLAIMS`, `ABORT_IN_FLIGHT`, `DISABLED` at
global, cell, and origin scope; the most restrictive wins. `ABORT_IN_FLIGHT`
propagates cancellation and prevents capture publication after the fence changes.
Tombstones immediately suppress claim, projection, and serving eligibility;
physical erasure follows the governance specification.

Startup MUST run integrity check, schema/version check, expired-lease recovery,
event/view reconciliation, orphan capture detection, tombstone-watermark check,
and disk/budget check before claims. Ambiguity enters `RECOVERY_BLOCKED`; recovery
MUST NOT invent events, bytes, or successful settlement. Backups and restore
drills are required before production authority.

The PostgreSQL seam is the logical record/event contract, canonical encodings,
uniqueness constraints, claim/fence semantics, and migration fixtures. SQLite
row IDs, PRAGMAs, and transaction syntax MUST NOT leak into domain identity.
Migration requires deterministic inventory digests and a separate ADR; no dual
writer is allowed.

## Fetch and capture safety

Each request and every redirect MUST pass, in order: canonical parse; scheme/
port allowlist; hostname policy; fresh A/AAAA resolution; rejection of loopback,
unspecified, link-local, private, multicast, reserved, metadata, and policy-
blocked ranges; origin budget; and connection binding to a validated address.
DNS rebinding or address-family change fails closed. Redirects are bounded,
method-policy aware, cycle checked, and fully revalidated. Credentials/cookies/
authorization MUST NOT cross origin.

TLS MUST validate hostname, chain, time, algorithm policy, and minimum version;
no insecure override exists. Response headers, transfer bytes, decoded bytes,
compression ratio, time, and redirects have independent inclusive caps. Layered
or unsupported content encoding, cap overflow, and decompression bomb indicators
abort and quarantine partial bytes. Declared MIME, sniffed MIME, charset, and
allowed parser MUST agree under a versioned gate; executable/active content is
never executed.

Successful acquisition writes immutable CAS bytes and a WARC-compatible capture
record with request/response metadata, target URI, times, network/TLS policy
receipts, payload/block digests, lengths, media decisions, redirects, attempt,
cell, and policy refs. Canonical publication is exclusively plugin ADR 0024's
`LOCAL_PREPARED -> EXTERNAL_APPENDED -> LOCAL_COMMITTED` protocol: local prepare
publishes/acknowledges nothing; only authenticated external-append proof may
advance to `EXTERNAL_APPENDED`; a newly fenced local transaction must revalidate
the exact intent, authority, policy, identity barrier, anchor record, staged
integrity, and qualified filesystem publication before `LOCAL_COMMITTED`. Only
canonical `LOCAL_COMMITTED` may be acknowledged or become evidence. Crash or
uncertainty is resolved by read-only local/anchor inspection and a newly fenced
attempt, never object discovery or acquisition-state promotion. Partial,
quarantine, staged, `LOCAL_PREPARED`, and `EXTERNAL_APPENDED` objects are not
query eligible. WARC/CAS equality does not merge source/capture identities.

Extraction MUST run with networking unavailable, no ambient credentials, bounded
CPU/memory/time/output/nesting, read-only input, isolated temporary output, and a
pinned extractor/policy digest. Output is inert Unicode plus metadata. A passage
is `{passageId,representationId,ordinal,startByte,endByte,textDigest,selector}`;
selectors are versioned byte/DOM-structural addresses reproducible against the
identified representation. Prompt-like instructions, hidden text, encoded
payloads, data exfiltration requests, and parser anomalies are labeled untrusted;
policy may quarantine but MUST NOT silently remove lineage.

Rendering is optional and deferred. If later authorized, it MUST use a disposable
network-isolated renderer after capture; any separately permitted subresources
become independent fetches/captures. Renderer output is a derived representation,
never a replacement for raw capture.

## Failures, acceptance, and deferrals

Stable families are `CONTROL_*`, `POLICY_*`, `DNS_*`, `SSRF_*`, `REDIRECT_*`,
`TLS_*`, `TRANSFER_*`, `DECOMPRESSION_*`, `MIME_*`, `CAPTURE_*`, `EXTRACT_*`,
and `RECOVERY_*`; public diagnostics expose family/code and stage only. Required
binary tests include:

1. replay yields identical views; event collision, sequence gap, and illegal
   transition block;
2. two workers cannot settle one lease after fence expiry/reissue;
3. robots/sitemap/feed never independently authorize a fetch;
4. every redirect repeats DNS/SSRF/TLS policy; rebinding, private targets,
   credential forwarding, cycles, and cap+1 fail;
5. compressed/decoded/MIME/parser cap+1 and malformed inputs commit no eligible
   capture;
6. crashes at each `LOCAL_PREPARED -> EXTERNAL_APPENDED -> LOCAL_COMMITTED`
   boundary converge under plugin ADR 0024; acquisition observes only the final
   state and never invents or grants evidence;
7. extraction proves no network, bounded resources, reproducible selectors, and
   complete lineage; and
8. kill/tombstone races prevent new claim, publication, projection, and delivery.

Exact URL normalization, ports, network ranges, user agent, rates, lease/retry/
recrawl values, byte/time caps, MIME/parser matrix, WARC profile, CAS encryption,
SQLite durability settings, rendering, PostgreSQL trigger, and production
recovery objectives remain owner decisions. Security, data/legal, operations,
and runtime owners MUST approve them; no provisional number is authority.

## Traceability and primary sources

[Canonical plugin ADR 0024](../../../plugin/opencode2/docs/decisions/0024-durable-ledger-v2-and-capture-authority.md),
[runtime ADR 0041](../decisions/0041-unified-retrieval-memory-evidence-substrate.md),
[0048](../decisions/0048-retrieval-migration-topology-and-qualification.md),
[0052](../decisions/0052-next-retrieval-source-and-owned-web-specification-program.md),
[governance v1](retrieval-corpus-governance-v1.md), and
[compendium](../research/next-retrieval-phase-compendium-2026-08-19.md).
Primary sources: [RFC 9309](https://www.rfc-editor.org/rfc/rfc9309.html),
[RFC 3986](https://www.rfc-editor.org/rfc/rfc3986.html),
[RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html),
[RFC 9264](https://www.rfc-editor.org/rfc/rfc9264.html),
[WARC ISO 28500 overview](https://www.loc.gov/preservation/digital/formats/fdd/fdd000236.shtml),
[SQLite WAL](https://www.sqlite.org/wal.html), and
[PostgreSQL locking](https://www.postgresql.org/docs/18/explicit-locking.html).
