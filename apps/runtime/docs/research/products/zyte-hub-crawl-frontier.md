# Zyte Hub Crawl Frontier: clean-room product-surface dossier

**Research and primary-source access date:** 2026-08-17  
**Decision frame:** whether Zyte Hub Crawl Frontier (HCF), considered separately
from crawl execution, is a suitable hosted frontier for Curiosity, and which of
its externally visible queue, seen-set, partition, priority, acknowledgement,
and recovery patterns should inform a provider-neutral frontier.  
**Scope boundary:** the public HCF HTTP API and its official
`python-scrapinghub` client surface. Scrapy Cloud is considered only where HCF
depends on its project, storage, identity, security, pricing, or operational
boundary. Zyte API, Scrapy's local scheduler, DeltaFetch, Collections, and the
open-source Frontera framework are not treated as HCF implementations.  
**Clean-room boundary:** public documentation, public repository metadata,
official client source, client tests, and public service status only. No
account, credential, API request, crawl, private dashboard, paid unit, packet
trace, binary, or server implementation was used. No source or distinctive
implementation expression is copied into Curiosity.

## Executive verdict

**DEFER HCF as a Curiosity frontier provider (high confidence).** HCF remains a
documented, reachable-by-contract Scrapy Cloud storage surface: one project can
name multiple frontiers; each frontier has independently prioritized slots; each
slot combines a fingerprint set with a numeric-priority request queue; queue
reads return stable batch IDs; and clients explicitly delete completed batches.
This is a compact and useful hosted crawl-scheduler substrate [S01-S04].

It is not, however, a complete distributed scheduler contract. The public API
does not establish exclusive claims, lease ownership or expiry, fencing,
visibility timeouts, redelivery timing, per-item acknowledgement, atomic
result-and-ack, delayed availability, priority mutation, retry state, global
slot fairness, queue depth, capacity, retention, consistency, regionality, SLA,
or a dedicated HCF status component. Zyte explicitly makes one-process-per-host
politeness the crawler's responsibility [S01, S04, S08]. A crash-safe,
multi-worker Curiosity design cannot fill these gaps by assumption.

**REJECT HCF as Curiosity's provider-neutral frontier ABI or system of record
(high confidence).** Its identity and authorization are Scrapy Cloud project
scoped; its endpoint is Hubstorage; its official credential is a Scrapy Cloud
API key; and its lifecycle is slot deletion rather than a portable crawl/run
ledger. It can be called from an external process, but it is not documented as
an independently purchased, independently administered, or self-hosted frontier
product [S01-S04, S08].

**ADAPT the design pattern, not the hidden service (high confidence):** separate
canonical request identity from payload; maintain a durable seen set alongside
outstanding work; partition work by a politeness key; prioritize within each
partition; return batches with stable acknowledgement identity; keep admission
idempotent; and acknowledge only after durable downstream commit. Strengthen the
pattern with explicit state, leases, fencing, `not_before`, attempt budgets,
reason-coded outcomes, per-item completion, policy-versioned politeness, and an
append-only transition ledger.

**Overall confidence:** high for the visible HTTP/client contract; medium for
the maintenance and hosted-coupling assessment; low/unknown for server-side
storage, concurrency, recovery, retention, and service-level guarantees.

## 1. Bounded questions and evidence rules

This report answers eight bounded questions:

1. Is HCF a current standalone product, a maintained API, or a legacy surface?
2. What exactly are frontier, slot, fingerprint, queued request, priority, and
   batch identities?
3. What deduplication and state transitions are guaranteed or merely implied?
4. How do multiple producers/consumers, retries, crashes, and restarts behave?
5. Where does politeness live, and what does HCF itself enforce?
6. How tightly is HCF coupled to Scrapy Cloud identity, storage, and operations?
7. What security, privacy, licensing, and clean-room constraints apply?
8. Which lessons should Curiosity adopt, adapt, reject, or defer?

Labels used throughout:

- **FACT** — directly stated or mechanically observable in a cited first-party
  source.
- **INFERENCE** — bounded clean-room reasoning from the public contract, not a
  claim about Zyte's undisclosed implementation.
- **UNKNOWN / NEGATIVE RESULT** — reviewed sources did not establish the point;
  absence in documentation is not proof that the service lacks it.
- **RECOMMENDATION** — a Curiosity architecture or governance choice.

Confidence is **high**, **medium**, or **low**. Official client code establishes
client behavior, not server guarantees. Vendor documentation establishes the
published contract, not empirical availability or correctness.

## 2. Product identity, status, and maintenance

### 2.1 What HCF is—and is not

**FACT (high):** Zyte describes HCF as persistent shared storage for a crawl
scheduler, holding pages visited and outstanding requests. It is exposed under
the Scrapy Cloud HTTP API at `storage.zyte.com`, not as a spider, fetcher,
renderer, parser, robots engine, or search index [S01, S02].

**FACT (high):** the public hierarchy is:

```text
Scrapy Cloud account / organization
  -> project_id
      -> named frontier
          -> named slot
              -> fingerprint set
              -> numeric-priority request queue
                  -> returned batches with batch IDs
```

The server creates names implicitly through writes; the API lists frontiers and
slots and can delete a whole slot. It does not expose a create-frontier object,
frontier metadata document, or delete-frontier operation [S01].

**INFERENCE (high):** HCF is a stateful storage primitive on which application
scheduler logic is built, not a full scheduler. The client chooses which slots
to poll, when to poll them, how many workers exist, how requests are fetched,
when work succeeded, and whether a whole batch may be acknowledged.

**FACT (high):** the open-source **Frontera** repository is a separate crawling
framework. HCF's server implementation is not present in the reviewed
`python-scrapinghub` client. Similar naming must not be used to infer common
code, license, behavior, or deployment [S03, S12].

### 2.2 Current status

**FACT (high):** on 2026-08-17 HCF's Frontier API remained in the ordinary
Scrapy Cloud reference navigation—not Zyte's “Legacy” section—and the official
Python client's current documentation still included the complete project
frontier workflow [S01-S04].

**FACT (high):** `python-scrapinghub` 2.9.0 was released to PyPI on 2026-08-12,
requires Python 3.10+, and retains its frontier client modules and tests. Its
repository was not archived. The release itself changed JobQ endpoint handling,
not HCF semantics [S03-S07].

**FACT (high):** Zyte's status API reported “Scrapy Cloud - Job Execution and
Storage” operational on the access date. It did not expose HCF as a separately
named component [S08].

**FACT (medium-high):** public file history shows little HCF-specific evolution:
the low-level client received broader idempotent-call retry behavior in 2019;
the high-level frontier surface has seen mainly compatibility/formatting changes
since its 2017 shape. An unmerged 2021 pull request to add slot counting remained
open, and an older count proposal was closed in its favor in 2024 [S05, S09,
S10].

**INFERENCE (medium):** HCF is best classified as a **current but mature,
low-evolution Scrapy Cloud sub-surface**, not as announced-deprecated and not as
a strategically marketed standalone product. Current docs and a maintained
client are positive support signals; lack of HCF-specific releases, pricing,
status, limits, and richer operations is a material maturity/visibility gap.

**UNKNOWN / negative result:** no public HCF roadmap, version number, changelog,
deprecation policy, support tier, standalone SKU, usage price, SLA, or end-of-life
statement was found. Scrapy Cloud's job-data pricing/retention statements do not
explicitly say that they govern HCF [S01-S10].

## 3. Data and state model

### 3.1 Fingerprint identity and payload

**FACT (high):** a web page/request is identified by caller-supplied string
`fp`. It need not be a URL; Zyte explicitly gives a hash incorporating POST
parameters as an example. A request may also contain arbitrary queue data
`qdata`, arbitrary fingerprint-set data `fdata`, and integer-like priority `p`,
which defaults to 0 [S01].

**INFERENCE (high):** HCF deliberately separates:

- **identity** (`fp`) — the deduplication key;
- **dispatch payload** (`qdata`) — returned with queued work;
- **seen-state payload** (`fdata`) — attached to the fingerprint set; and
- **ordering hint** (`p`) — lower numbers dispatch first within a slot.

That separation is valuable. It also makes fingerprint construction a
correctness boundary owned entirely by the caller. URL-only identity can
incorrectly collapse POST bodies, headers, representations, locales, sessions,
or policy variants; over-specific identity can defeat deduplication.

**FACT (high):** fingerprints can be inserted without queueing through the
fingerprint client surface. Fingerprints can be listed in lexicographic order.
The documented public HTTP response example exposes `fp`; although the overview
says arbitrary `fdata` can be stored, its readback shape and update semantics
are not fully specified [S01, S04, S05].

**UNKNOWN:** maximum fingerprint length/encoding, priority range/type limits,
payload schema/size at the server, whether `fdata` is returned by all clients,
and conflict behavior when a duplicate `fp` is submitted with different
`qdata`, `fdata`, slot, or priority. The official client rejects serialized
records above 1 MiB before upload, but that is a client-side generic writer
limit, not a published HCF server limit [S01, S05].

### 3.2 Queue and priority

**FACT (high):** each slot has its own priority queue. Lower `p` values are
returned first. Zyte's breadth-first example maps crawl depth directly to
priority. Priorities are independent across slots [S01].

**INFERENCE (high):** `p` is an ordering key, not a complete score model. The
public API has no score decomposition, timestamp tie-break contract, aging,
deadline, `not_before`, revisit due time, priority update, or cross-slot global
ordering. `qdata` can carry richer model features, but HCF does not document
using them.

**UNKNOWN / negative result:** FIFO order for equal priority, stability under
concurrent writers, numeric bounds, starvation prevention, fairness, queue
compaction, and whether batches can contain mixed priorities are undocumented.
The examples return different priorities as different batches, but examples are
not a general batching guarantee [S01].

### 3.3 Batch identity and acknowledgement

**FACT (high):** a slot queue read returns one or more objects containing a
batch `id` and an array of request pairs. The request pairs contain fingerprint
and queue data. `mincount` may be supplied when reading. After processing, the
client posts one or more batch IDs to `q/deleted`; completed batches are then
removed and no longer returned by later queue reads [S01, S04].

**FACT (high):** acknowledgement granularity is the **batch ID**, not an
individual fingerprint. The official client marks batch deletion idempotent and
retries transient idempotent operations according to client policy [S05, S06].

**INFERENCE (high):** before acknowledgement a batch is durable outstanding
work; after acknowledgement it is absent from the queue but its fingerprint may
remain in the seen set. This is a useful separation between “ever admitted” and
“still pending,” but it is not a complete fetched/succeeded/failed state model.

**UNKNOWN:** the meaning of `mincount` when fewer requests exist, maximum/default
batch size, whether a batch is immutable, batch ID lifetime, response pagination,
and whether acknowledging unknown/already-deleted IDs is guaranteed harmless by
the server. Client-side `batch_size = 5000` controls upload grouping, not the
documented queue-read batch size [S01, S05].

## 4. Deduplication and lifecycle semantics

### 4.1 Admission deduplication

**FACT (high):** an enqueue response reports `newcount`, “the number of new
requests that have been added.” HCF separately calls its persistent identity
store a set of fingerprints and describes it as storing visited pages [S01].

**INFERENCE (medium-high):** the intended admission path is set-backed:

```text
submit (slot, fp, qdata, fdata, p)
  -> if fp is new for the relevant dedup scope:
       record fingerprint + enqueue request + increment newcount
  -> otherwise:
       do not add another outstanding request
```

This interpretation is consistent with `newcount`, the fingerprint set, and the
incremental-crawl usage language, but the public page does not give a formal
conditional-write or duplicate-conflict specification.

**UNKNOWN (material):** whether deduplication scope is exactly `(project,
frontier, slot, fp)` or broader; whether queue insertion and fingerprint-set
insertion are atomic; whether a duplicate can update `qdata`, `fdata`, or `p`;
and what concurrent duplicate writers observe. These require an authorized
contract test or written provider confirmation.

### 4.2 “Visited” is overloaded

**INFERENCE (high):** the phrase “pages visited” is semantically dangerous. The
same POST that admits outstanding work accepts both queue and fingerprint data,
and a fingerprint can be inserted without fetching. Therefore the public
surface most safely supports **seen/admitted identity**, not proof of successful
HTTP fetch, accepted content, or indexed evidence.

**RECOMMENDATION (high):** Curiosity must keep distinct identities and states:

```text
discovered -> policy_admitted -> queued -> leased -> fetch_attempted
           -> captured -> parsed -> evidence_committed -> indexed
                         \-> deferred | retryable | terminal
```

Maintain separate `request_fingerprint`, representation/content hash, and
canonical document ID. Never use a single HCF fingerprint bit as evidence that
a source was fetched successfully or remains fresh.

### 4.3 Deletion and revisit

**FACT (high):** public deletion removes an entire slot or acknowledged queue
batches. No endpoint is documented for deleting one fingerprint, clearing only
the seen set, moving work between slots, or resetting one request for revisit
[S01].

**INFERENCE (high):** HCF is naturally suited to one-time/incremental “first
seen” crawling. Recrawl and retry policy are awkward unless the caller changes
the fingerprint/version, uses another frontier, or performs a destructive slot
reset. None provides a first-class scheduled revisit history.

**RECOMMENDATION:** use explicit revisit generations and due times in Curiosity;
never smuggle attempt number into canonical identity merely to bypass dedup.

## 5. Distributed concurrency, failure, and restart

### 5.1 Shared access is not exclusive ownership

**FACT (high):** HCF is remote shared storage, and many crawl processes can
address the same project/frontier/slot through HTTP or the official client.
Zyte nevertheless says the crawler should ensure that each host is crawled from
only one process at a time [S01-S04].

**INFERENCE (high):** a queue GET is a read, not a documented claim. There is no
consumer/owner parameter or claim token. Two consumers polling one slot can
therefore not rely on HCF to prevent both from observing or processing the same
batch. Stable outstanding batches favor recovery but provide no mutual
exclusion.

**UNKNOWN / negative result:** no public guarantee was found for linearizable
enqueue, read-after-write, exclusive dequeue, consumer groups, partition
assignment, leader election, transaction isolation, replica lag, or global
ordering across clients.

### 5.2 Crash windows

The visible protocol creates at least these failure windows:

| Window | Contract-grounded outcome | Curiosity risk |
|---|---|---|
| Producer buffers locally, then crashes before flush | Official writer warns unclosed writers may lose queued local items [S05] | Discovered request never reaches HCF. |
| Upload reaches server, response is lost | Client retries uploads for transport/server failures; formal server idempotency by upload offset is undocumented [S05] | Duplicate transport attempt; fingerprint dedup may help but must not be assumed atomic. |
| Consumer reads, then crashes before work | Batch remains outstanding until explicitly deleted [S01] | Recoverable by later read, but possibly concurrently duplicated. |
| Fetch succeeds, crash before durable result | Batch remains [S01] | Refetch/duplicate side effect on restart. |
| Result durable, crash before acknowledgement | Batch remains [S01] | At-least-once replay; safe only with idempotent evidence commit. |
| Acknowledge succeeds, crash before result durable | Batch is removed [S01] | Permanent work loss; seen fingerprint can block resubmission. |
| Some requests in a batch succeed, others fail | Ack is batch-grained [S01] | Reprocess successes or lose failures unless application commits all-or-none/requeues externally. |

**INFERENCE (high):** the only safe ordering is **durably and idempotently commit
each result, then acknowledge the batch**. Even then, batch replay is possible
and must be harmless. HCF does not make capture and queue acknowledgement one
transaction.

### 5.3 Retry layers

**FACT (high):** the official Python client has separate retry behavior:

- idempotent GET/DELETE and explicitly idempotent batch-delete calls retry
  selected transient failures (408, 429, 502, 503, 504, connection errors, and
  timeouts), by default up to three retries within roughly 60 seconds;
- the asynchronous batch uploader retries request writes much more aggressively
  (up to 200 attempts with bounded randomized backoff, approximately 30 hours
  total by its own documentation);
- local upload writers batch records (HCF defaults: 5,000 records, a 6,000-item
  local queue, and 60-second flush interval) and require explicit flush/close
  for deterministic draining [S05, S06].

These are **client implementation defaults**, not HCF service guarantees.

**FACT (high):** HCF itself exposes no retry count, failure reason, attempt ID,
backoff, `not_before`, dead-letter state, per-request ack/nack, or terminal
outcome [S01].

**INFERENCE (high):** leaving a batch undeleted is HCF's only visible retry-like
mechanism. It does not distinguish a slow active consumer from a crashed one,
does not bound attempts, and cannot independently retry one failed member of a
partially successful batch.

### 5.4 Restart and resume

**FACT (high):** outstanding batches and fingerprints are persisted by the
hosted service rather than tied to one job process. A restarted job or external
client can reopen the same project/frontier/slot and read remaining work [S01,
S04].

**INFERENCE (medium-high):** this supports **storage continuity**, not an
execution checkpoint. HCF retains no documented crawler version, run ID,
consumer owner, lease, in-flight timestamp, retry budget, robots policy version,
output commit, or causal parent edge unless the application places such fields
inside unvalidated payloads.

**RECOMMENDATION:** Curiosity needs a run/attempt ledger outside any provider:
stable operation ID, policy/config digest, discovery edge, producer commit,
lease owner/epoch/expiry, attempt count, capture commit, acknowledgement status,
and reconciliation result.

## 6. Politeness and scheduling integration

**FACT (high):** Zyte's canonical example uses hostname as slot. Separate slot
queues let a crawler prioritize, rate, and schedule hosts independently. Zyte
explicitly delegates the one-process-per-host invariant to the crawler [S01].

**INFERENCE (high):** HCF supplies a useful **politeness partition key**, but no
politeness enforcement. It does not document robots retrieval/cache, crawl
delay, concurrency, rate or burst limits, adaptive backoff, Retry-After handling,
DNS/IP grouping, eTLD+1 policy, or cross-frontier/cross-project coordination.

**INFERENCE (high):** hostname slots are insufficient for global politeness when:

- two frontiers or projects contain the same host;
- multiple organizations/jobs/regions crawl the same host;
- aliases resolve to the same service/IP;
- `www` and bare domains require shared policy;
- HTTP and HTTPS are placed into different caller-defined slots; or
- multiple consumers poll one slot without external ownership.

**RECOMMENDATION (high):** Curiosity should use globally coordinated,
policy-versioned politeness keys with fenced leases. Store `next_allowed_at`,
concurrency, token-bucket state, robots decision/expiry, Retry-After, host error
backoff, and owner epoch separately from relevance priority. Worker capacity and
origin permission are independent limits.

## 7. Hosted coupling and portability

### 7.1 What can run outside Scrapy Cloud

**FACT (high):** HCF is an HTTP API and can be called with a Scrapy Cloud API key
from any authorized HTTP client; the official Python library is optional [S01,
S02]. It is therefore not technically restricted to a Scrapy process or a
Scrapy Cloud job container.

**FACT (medium-high):** Scrapy Cloud jobs can instead use a runtime-injected
`SHUB_JOBAUTH` credential. Public official-client issue history describes it as
an ephemeral JWT accepted by Hubstorage/JobQ surfaces, including Collections and
the frontier, rather than a general dashboard API key [S11]. This is useful
least-duration coupling, but it is historical public implementation evidence,
not a current formal HCF authorization specification.

### 7.2 What remains hosted-specific

**FACT (high):** the path and authority require a Scrapy Cloud `project_id`, use
the Hubstorage host, and authenticate with Scrapy Cloud—not Zyte API—identity.
Frontiers are available only at project level in the official client [S01-S04].

**INFERENCE (high):** data-plane access is externally callable, while control,
tenancy, durability, retention, capacity, deletion, service status, and billing
remain inseparable from Scrapy Cloud. There is no documented export/import of a
frontier, snapshot, change stream, self-hosted edition, provider-neutral wire
format, or server license.

**UNKNOWN:** whether HCF is available on free accounts, whether it consumes a
separate quota or price, whether account cancellation/project deletion deletes
it immediately, and whether it can be procured without Scrapy Cloud job
execution. Current pricing describes units and **job data** retention but does
not enumerate HCF [S16].

## 8. Security, privacy, and operational boundary

### 8.1 Authentication and authorization

**FACT (high):** the API supports HTTPS with HTTP Basic authentication and also
documents an `apikey` URL query parameter. HCF uses the Scrapy Cloud key, which
is distinct from a Zyte API key [S02].

**RECOMMENDATION (high):** never place credentials in query strings; they can
leak through histories, proxies, referrers, telemetry, and logs. Use a secret
manager, TLS, short-lived project-scoped workload credentials where formally
supported, rotation, and egress restrictions.

**FACT (medium-high):** Scrapy Cloud membership flows top-down: organization
members can access its projects, while project-only members are restricted to
assigned projects. Project admins can edit settings and delete projects [S13].
The public HCF reference does not define frontier-specific roles.

**INFERENCE (high):** a principal able to write or delete HCF state can control
what a crawler fetches, suppress work through fingerprint poisoning, reorder
work through priority, inject untrusted payload, or destroy a slot. Frontier
write/delete is therefore high-impact scheduler authority, not harmless storage
access.

### 8.2 Untrusted data and secrets

**FACT (high):** `fp`, `qdata`, `fdata`, frontier names, and slot names are
caller-controlled; arbitrary data can be stored with queued and fingerprint
records [S01].

**RECOMMENDATION (high):** treat every returned value as untrusted. Validate
scheme/URL, length, encoding, schema, tenant, scope, redirect policy, private-IP
denial, and budget again at dispatch. Never allow queue payload to carry raw API
keys, session cookies, authorization headers, executable callbacks, or trusted
policy decisions. Encrypt sensitive references at the application layer and
resolve only opaque secret handles at the worker.

### 8.3 Public assurance and gaps

**FACT (medium):** Zyte's public DPA describes general service-data security,
confidentiality, subprocessor, incident, and transfer obligations. Those are
contractual controls, not an HCF-specific independent assurance report [S14].

**UNKNOWN / negative result (high importance):** reviewed public sources do not
establish HCF-specific encryption at rest, tenant-isolation design, regions/data
residency, subprocessor path, backup schedule, point-in-time recovery, audit
events, key scopes, per-frontier RBAC, retention/deletion latency, legal hold,
rate limit, abuse monitoring, integrity hashes, availability target, or disaster
recovery objective [S01-S14].

**RECOMMENDATION:** do not store authoritative evidence or sensitive crawl state
in HCF without contractual answers and tested export/deletion/recovery. Keep a
Curiosity-owned append-only transition ledger and reconcile provider state.

## 9. License and clean-room boundary

### 9.1 What is licensed

**FACT (high):** `python-scrapinghub`, including its HCF client adapter, is
published under BSD-3-Clause. Redistribution requires preserving the copyright,
conditions, and disclaimer; binary redistribution carries them in accompanying
materials; project/contributor names may not endorse derived products without
permission [S03, S15].

**FACT (high):** the hosted HCF service, its server code, storage engine, and
operations are not published in that repository. A BSD client license does not
license or reveal the hosted implementation. Zyte's documentation is
copyrighted and is evidence of the public contract, not source code under the
client's BSD license [S01-S03, S15].

### 9.2 Research boundary

This report re-expresses behavioral requirements only. It does not copy client
code, wire examples, internal names beyond necessary public API identifiers,
tests, serialization logic, or inferred server algorithms. Source inspection
was limited to distinguishing client behavior from service guarantees.

**RECOMMENDATION:** if Curiosity later uses `python-scrapinghub`, isolate it in a
provider adapter, pin and inventory it, preserve BSD notices, review transitive
dependencies, and do not represent the hosted service as open source. If
Curiosity instead implements its own HTTP adapter from public docs, perform a
separate API-terms and interoperability review. This is engineering guidance,
not legal advice.

## 10. Curiosity implications and decision ledger

### 10.1 Provider-neutral frontier contract HCF helps expose

HCF makes several requirements visible by what it offers and what it omits:

```text
FrontierOperation
  tenant / crawl / generation / policy identities
  canonical request fingerprint + representation dimensions
  politeness partition key
  immutable dispatch payload reference + discovery lineage
  relevance priority + not_before + deadline
  seen/admitted state distinct from fetch/evidence state
  lease owner + lease epoch + expiry + renewal
  attempt count + retry class + budget
  per-item completion + idempotent evidence commit key
  ack/nack/defer/dead-letter reason
  transition timestamps + immutable audit record
```

This is a requirement sketch, not an HCF-compatible implementation or copied
design.

### 10.2 Adopt/adapt/reject/defer

| HCF lesson/surface | Verdict | Curiosity disposition |
|---|---|---|
| Caller-defined request fingerprint independent of URL | **ADOPTED** | Define a versioned canonical request identity including method/body and representation-affecting dimensions. |
| Separate queue payload and fingerprint metadata | **ADOPTED** | Keep identity small; reference immutable validated payload/evidence envelopes. |
| Persistent seen set plus outstanding queue | **ADAPTED** | Separate discovered, admitted, attempted, captured, accepted, and indexed states rather than “visited.” |
| Named frontiers within projects | **ADAPTED** | Use provider-neutral crawl/generation namespaces, not provider project IDs. |
| Per-slot priority queues | **ADOPTED** | Partition by politeness key and prioritize within it; add explicit cross-slot fairness. |
| Lower-number scalar priority | **ADAPTED** | Expose stable rank plus policy version, tie-break, aging, and due time; avoid opaque provider ordering. |
| Stable batch IDs and explicit completion | **ADOPTED** | Acknowledge only after durable idempotent commit. |
| Batch-only acknowledgement | **REJECTED** | Require per-item state or an atomic batch contract with partial-failure reconciliation. |
| Fingerprint admission dedup | **ADAPTED** | Require documented atomic put-if-absent scope and conflict outcome. |
| Caller-enforced one-worker-per-host | **REJECTED as sufficient** | Use globally fenced politeness leases and shared robots/rate state. |
| No visible lease/visibility timeout | **REJECTED** | Ownership, expiry, renewal, fencing, and redelivery are core contracts. |
| Leaving work unacked as retry | **REJECTED as retry model** | Use typed retry state, backoff, attempts, deadline, and dead-letter outcome. |
| Project-scoped hosted storage | **DEFERRED provider adapter** | Pilot only after contract tests and procurement/security gates. |
| HCF as authoritative evidence/state ledger | **REJECTED** | Preserve Curiosity-owned state transitions and immutable evidence. |
| Official Python client | **DEFERRED** | BSD-compatible but optional; review operational retry/buffering behavior before use. |

## 11. Unknowns and bounded checks before adoption

| Unknown / risk | Confidence now | Required bounded check |
|---|---:|---|
| Exact duplicate scope and conflicting payload/priority behavior | Low | In an approved disposable project, concurrently submit the same `fp` within/across slots/frontiers with differing metadata; record `newcount` and readback. |
| Atomicity of seen-set plus queue insertion | Low | Fault-inject/disconnect around writes and compare fingerprint/queue presence; request written provider guarantee. |
| Queue-read exclusivity | High that it is undocumented | Have two authorized consumers read one slot simultaneously; compare batch IDs; do not deploy until lease behavior is explicit. |
| Batch immutability and equal-priority ordering | Low | Enqueue timestamped fixtures at equal/mixed priorities and repeat reads before/after concurrent writes. |
| Meaning and blocking behavior of `mincount` | Low | Read below/at/above available count with finite client timeouts. |
| Per-batch and per-record limits | Unknown | Obtain written limits, then test just below/above them without production data. |
| Restart/redelivery timing | Low | Read without ack, stop all consumers, restart after bounded intervals, and verify visibility. |
| Partial batch retry | High that no per-item API is documented | Confirm with Zyte whether subset ack/nack exists; otherwise require application-level transaction/reconciliation. |
| Revisit/reset of one fingerprint | High that no endpoint is documented | Ask for supported recrawl pattern; do not use destructive slot reset in production. |
| Cross-client consistency and SLA | Unknown | Obtain consistency, durability, availability, RPO/RTO, maintenance, and deprecation commitments. |
| Capacity, rate limit, and price | Unknown | Obtain per-project/frontier/slot/request/byte/API limits and metering before benchmark. |
| HCF retention and project deletion | Unknown | Obtain complete primary/replica/backup deletion matrix and test deletion in a disposable project. |
| Credential scope and auditability | Unknown | Verify current workload-token scope, expiry, rotation, access logs, per-frontier permissions, and destructive-operation audit. |
| Portability/export | Unknown | Require a bounded snapshot/export and reconciliation plan before storing durable crawl state. |

## 12. Bounded curiosity pass

Scoring is 1 (low) to 5 (high). Priority favored relevance × decision value ×
novelty over cost. One post-synthesis pass was authorized by the caller's deep
reverse-engineering frame.

| Thread | R | V | N | Cost | Decision/result |
|---|---:|---:|---:|---:|---|
| Is queue GET a lease/claim? | 5 | 5 | 5 | 2 | **PURSUE to saturation.** HTTP docs, current client, and tests expose only repeatable read plus explicit batch deletion; no owner/expiry/fence found. Retained as unknown rather than inventing exclusivity [S01, S04-S06]. |
| Does HCF remain current? | 5 | 5 | 4 | 2 | **PURSUE.** Current non-legacy docs, 2026 client release, status surface, and file history support “current mature sub-surface,” not “deprecated” or “actively evolving standalone product” [S01-S10]. |
| Is retry/restart durable? | 5 | 5 | 4 | 2 | **PURSUE.** Stable unacked batches support storage continuity; local producer buffering, batch ack, and no execution lease expose precise crash windows [S01, S05, S06]. |
| Is `newcount` a formal atomic dedup guarantee? | 5 | 5 | 4 | 2 | **PURSUE to boundary.** Intended set-backed admission is well supported, but scope/atomicity/conflict rules remain undocumented; converted to tests rather than overstated. |
| Infer HCF's private database/queue technology | 2 | 2 | 4 | 5 | **CURIOSITY_NO_GO:** no public evidence, no architectural need, and clean-room boundary forbids probing private internals. |
| Run duplicate/crash/destructive slot experiments | 5 | 5 | 4 | 5 | **CURIOSITY_NO_GO:** requires credentials, service mutation, and an approved benign test plan not granted here. |
| Treat public VCR cassettes as current server specification | 3 | 2 | 3 | 2 | **CURIOSITY_NO_GO:** recordings are historical test fixtures, may contain stale behavior, and do not establish concurrency guarantees. |
| Reverse engineer unrelated Frontera framework | 2 | 2 | 3 | 5 | **CURIOSITY_NO_GO:** separate project/product and outside the caller's HCF surface. |
| Deep-review every Hubstorage API | 2 | 2 | 2 | 5 | **CURIOSITY_NO_GO:** Collections/jobs are relevant only to the hosted boundary; full reviews already belong in separate product dossiers. |

**Stop condition:** coverage reached for every caller-requested topic; the
highest-value contradictions—current versus legacy, shared versus exclusive,
and persistent versus restart-safe—were resolved or converted into explicit
unknowns and checks. Remaining threads require provider authority, credentials,
or out-of-frame private implementation knowledge.

## Sources

All sources accessed 2026-08-17. Source links are pinned where practical.

- **[S01] Zyte, “Frontier API / Hub Crawl Frontier.”** Product definition,
  hierarchy, fingerprint/request fields, priority, slots, batches,
  acknowledgement, listing, and slot deletion.
  <https://docs.zyte.com/scrapy-cloud/usage/reference/http/frontier.html>
- **[S02] Zyte, “Scrapy Cloud API.”** Authentication, endpoint separation, and
  official-client reference.
  <https://docs.zyte.com/scrapy-cloud/usage/reference/http/index.html>
- **[S03] Scrapinghub/Zyte, `python-scrapinghub` repository at commit
  `d0d7b29153e40bbb0f9c56ab23caab86393f853e` (2026-08-12).** Current client,
  project/frontier surface, release identity, and BSD-3-Clause license.
  <https://github.com/scrapinghub/python-scrapinghub/tree/d0d7b29153e40bbb0f9c56ab23caab86393f853e>
- **[S04] Scrapinghub/Zyte, `python-scrapinghub` current usage overview.**
  Project-only frontiers, slots, queue/fingerprint operations, flush/close,
  `newcount`, and batch deletion.
  <https://python-scrapinghub.readthedocs.io/en/latest/use/overview.html#frontiers>
- **[S05] Scrapinghub/Zyte, pinned official client frontier and batch-uploader
  sources.** Client-side upload batching, buffering, size checks, retries,
  flush/close, read, and idempotent batch deletion. Behavioral inspection only.
  <https://github.com/scrapinghub/python-scrapinghub/blob/d0d7b29153e40bbb0f9c56ab23caab86393f853e/scrapinghub/client/frontiers.py>
  <https://github.com/scrapinghub/python-scrapinghub/blob/d0d7b29153e40bbb0f9c56ab23caab86393f853e/scrapinghub/hubstorage/frontier.py>
  <https://github.com/scrapinghub/python-scrapinghub/blob/d0d7b29153e40bbb0f9c56ab23caab86393f853e/scrapinghub/hubstorage/batchuploader.py>
- **[S06] Scrapinghub/Zyte, pinned `HubstorageClient` and `ResourceType`.**
  Idempotent request retry classes/defaults and GET/DELETE handling.
  <https://github.com/scrapinghub/python-scrapinghub/blob/d0d7b29153e40bbb0f9c56ab23caab86393f853e/scrapinghub/hubstorage/client.py>
  <https://github.com/scrapinghub/python-scrapinghub/blob/d0d7b29153e40bbb0f9c56ab23caab86393f853e/scrapinghub/hubstorage/resourcetype.py>
- **[S07] PyPI, `scrapinghub` 2.9.0 project metadata and release files.** Current
  version, upload date, Python support, and license classifier.
  <https://pypi.org/project/scrapinghub/2.9.0/>
- **[S08] Zyte Statuspage API, components.** Scrapy Cloud job execution/storage
  component and absence of a separately reported HCF component.
  <https://status.zyte.com/api/v2/components.json>
- **[S09] GitHub commit history for official frontier client files.** Bounded
  maintenance-history evidence.
  <https://github.com/scrapinghub/python-scrapinghub/commits/master/scrapinghub/client/frontiers.py>
  <https://github.com/scrapinghub/python-scrapinghub/commits/master/scrapinghub/hubstorage/frontier.py>
- **[S10] Scrapinghub/Zyte official-client pull request #155 and superseded
  pull request #69.** Open slot-count proposal and maintainer disposition; used
  only as maintenance/gap evidence, not server specification.
  <https://github.com/scrapinghub/python-scrapinghub/pull/155>
  <https://github.com/scrapinghub/python-scrapinghub/pull/69>
- **[S11] Scrapinghub/Zyte official-client issue #103.** Historical maintainer
  discussion of runtime `SHUB_JOBAUTH` JWT scope for Hubstorage/frontier access.
  <https://github.com/scrapinghub/python-scrapinghub/issues/103>
- **[S12] Scrapinghub/Zyte, Frontera repository.** Separate open-source crawling
  framework, used only to prevent product/license conflation.
  <https://github.com/scrapinghub/frontera>
- **[S13] Zyte Support, “Managing Organization and Project members,” modified
  2022-02-18.** Organization/project membership and admin scope.
  <https://support.zyte.com/support/solutions/articles/22000271734-managing-organization-and-project-members>
- **[S14] Zyte, Data Processing Agreement.** General contractual security,
  privacy, incident, subprocessor, and transfer boundary.
  <https://www.zyte.com/terms-policies/dpa/>
- **[S15] Scrapinghub/Zyte, pinned BSD-3-Clause license for
  `python-scrapinghub`.**
  <https://github.com/scrapinghub/python-scrapinghub/blob/d0d7b29153e40bbb0f9c56ab23caab86393f853e/LICENSE>
- **[S16] Zyte, “Scrapy Cloud pricing.”** Current unit price/benefits and
  job-data retention language; HCF is not separately enumerated.
  <https://docs.zyte.com/scrapy-cloud/pricing.html>

## Source quality and retained negative results

The current first-party HTTP reference is the primary service contract. The
current pinned official client and its tests triangulate client behavior only.
GitHub issues/PRs are used narrowly for maintenance history or authentication
context and are not promoted to service guarantees. The status API demonstrates
the broader storage component's public condition, not HCF uptime.

No formal HCF consistency, lease, redelivery, atomicity, retention, capacity,
rate-limit, SLA, pricing, regionality, export, backup, audit, or deprecation
specification was found. No standalone HCF product page or server-source license
was found. These are retained as decision-relevant unknowns rather than inferred
from generic Scrapy Cloud behavior.
