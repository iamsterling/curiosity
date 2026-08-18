# Scrapy Cloud: clean-room hosted crawl-plane dossier

**Research date / primary-source access date:** 2026-08-17  
**Decision frame:** whether Curiosity should use Scrapy Cloud as a hosted crawl
execution provider, and which externally visible deployment, scheduling,
frontier, storage, and operating contracts should inform an owned crawl plane.  
**Scope boundary:** Scrapy Cloud only. Zyte API is excluded except for the
first-party statement that it is a separate, independently usable product.  
**Status:** research only. No account, API key, paid unit, deployment, crawl,
target request, private console, or non-public interface was used. No service
implementation was inspected or reproduced.

## Executive verdict

**DEFER Scrapy Cloud as a Curiosity execution provider (medium confidence).**
It is a mature hosted batch platform for deploying Scrapy projects or custom
containers, admitting prioritized jobs against purchased units, scheduling
recurrence, recording job/request/item/log streams, and optionally using a
persistent host-slotted frontier. It could shorten a bounded pilot for
non-sensitive, focused spiders. Public contracts do not establish submission
idempotency, platform-level retry/recovery, strong secret or API-key scoping,
regionality, complete deletion behavior, frontier lease guarantees, hard
network isolation, item-level evidence integrity, or an SLA [S1-S16, S27-S31].

**REJECT Scrapy Cloud as Curiosity's provider-neutral crawl ABI or evidence
system of record (high confidence).** Project/spider/job identifiers,
Hubstorage paths, cloud-only virtual spiders, mutable dashboard settings,
DotScrapy state, add-ons, collections, and FIFO messages are hosted-provider
concepts. A `finished` job may still contain errors, and job items do not
automatically carry source captures, policy decisions, content hashes, or
field-level lineage [S4-S16, S20-S24].

**ADAPT its strongest architecture lessons (high confidence):** separate code
deployment from execution; make admission capacity explicit; preserve pending,
running, finished, and deleted states; keep job arguments/settings/tags/units;
partition a durable frontier into independently throttled slots; use request
fingerprints independently of URLs; record parent request edges; stream typed
items, requests, logs, and stats; and keep exported data portable. Strengthen
all of these with immutable resolved manifests, idempotent submission and
commit, typed terminal outcomes, evidence hashes, explicit retention classes,
fenced leases, and provider-neutral contracts.

**ADOPT open-source components only after separate review (high confidence).**
The official `shub` command-line client and `python-scrapinghub` API client are
BSD-3-Clause; Scrapy itself is BSD-licensed. Those licenses do not make the
hosted scheduler, Hubstorage, dashboard, add-ons, stacks, or Scrapy Cloud
service open source. Curiosity must preserve attribution and treat every
hosted-specific dependency as an adapter [S32-S34].

## 1. Bounded questions and method

This dossier answers nine bounded questions:

1. What is deployed, versioned, scheduled, and run?
2. How do admission queues, priorities, units, cancellation, and retry divide?
3. What are the item, request, log, metadata, collection, and frontier contracts?
4. Which Scrapy-specific and custom-container integration points exist?
5. What operational and evidence provenance is present or absent?
6. What retention, access, privacy, and security boundaries are public?
7. Which published limits and prices bound use?
8. What architecture may be inferred without inspecting proprietary internals?
9. Which lessons should Curiosity adopt, adapt, reject, or defer?

**Depth budget:** current first-party Scrapy Cloud product and API documentation,
first-party support articles where product docs delegate details, Zyte's public
legal/privacy pages, and official client repositories. Older support pages are
used only with their modification dates and are not silently treated as current
service guarantees. No live contract test, benchmark, source reconstruction,
security assessment, or legal opinion was attempted.

Labels:

- **FACT** — directly stated by a cited primary source.
- **INFERENCE** — a bounded conclusion from public behavior, not a claim about
  undisclosed internals.
- **UNKNOWN** — reviewed sources did not establish the point, or conflict.
- **RECOMMENDATION** — a Curiosity design or governance choice.
- Confidence is **high**, **medium**, or **low**.

Vendor documentation proves documented intent, not availability, isolation,
performance, legal permission to crawl a target, or empirical correctness.

## 2. Product boundary and logical architecture

**FACT (high):** a Scrapy Cloud project represents a scraping codebase (or a
specific version of one). A job executes a deployed Scrapy spider or standalone
Python script. Multiple projects commonly separate development and production
[S1-S4]. Scrapy Cloud and Zyte API are separate products and can be used
independently [S24].

**FACT (high):** ordinary projects deploy through the `shub` CLI or GitHub
integration into a managed Scrapy stack. Paying customers may instead deploy a
custom Docker image; the support page labels custom images beta. Jobs themselves
run in Docker containers [S2, S3, S16].

**INFERENCE (medium-high):** the externally visible system is logically:

```text
source / GitHub / shub / custom image
  -> deployment/build + version + project configuration
  -> spider/script registry (plus cloud-only virtual spiders)
  -> API / dashboard / periodic scheduler
  -> prioritized pending job, admitted when requested units are free
  -> Docker job container
       -> Scrapy or arbitrary crawler/script
       -> optional persistent .scrapy state / collections / HCF
       -> FIFO: item, request, log, stats, finish messages
  -> Hubstorage streams + job metadata + activity
  -> dashboard / HTTP API / client / export
```

The control plane (`app.zyte.com`), execution placement, scheduler, and storage
plane (`storage.zyte.com`) are distinct public surfaces. Exact databases,
orchestrator, queue technology, replication, and worker topology are unknown
[S5-S16].

**RECOMMENDATION (high):** model Scrapy Cloud only as an optional hosted
`crawl_executor` adapter. Curiosity owns authorization, recurrence, crawl scope,
frontier semantics, evidence commitment, retries, provenance, and deletion.

## 3. Deployment and executable identity

### 3.1 Managed stacks and versions

**FACT (high):** `shub deploy <project>` uploads a Scrapy project. With Git or
Mercurial, historical first-party guidance says `shub` derives a version from
commit/revision plus branch; without VCS it uses package/timestamp behavior.
Users may override the version from configuration or CLI [S2, S47]. Managed
stacks install declared Python dependencies and enable Scrapy Cloud add-ons
[S2, S25].

**INFERENCE (high):** a displayed deployment version is useful operational
lineage but is not necessarily immutable content identity: branch names and
manual versions may be reused, dashboard settings may override code settings,
and public job metadata exposes a version/deploy ID rather than a documented
image or source digest [S7, S23].

**RECOMMENDATION (high):** every Curiosity attempt must snapshot a source commit,
dependency lock hash, image digest, stack/runtime/browser identity, adapter
version, fully resolved settings, spider arguments, and schema versions. Never
use a human version label alone as reproducibility proof.

### 3.2 Custom Docker and portability boundary

**FACT (high):** custom Docker is currently for paying customers and described
as beta. It can run non-Scrapy crawlers or browser tools. A low-level write-only
entrypoint exposes a named pipe at `SHUB_FIFO_PATH`; newline-delimited commands
`ITM`, `LOG`, `REQ`, `STA`, and `FIN` send output to Scrapy Cloud storage. A
message must not exceed 1 MiB, Unicode must be escaped in the protocol, and
mixed named-pipe/stdout/stderr sources do not preserve global ordering [S3,
S16, S24].

**FACT (high):** Scrapy Cloud add-ons work only with managed stacks, not custom
images, even if the image derives from a stack [S25].

**INFERENCE (high):** custom images reduce language/runtime lock-in but not
control/storage lock-in. The FIFO protocol is a narrow telemetry/output adapter,
not a portable scheduler or evidence protocol. Container image portability also
does not prove worker network, kernel, tenant, or secret isolation.

**RECOMMENDATION (high):** if piloted, use an ordinary OCI image that runs
outside Scrapy Cloud unchanged, and isolate FIFO/API translation in a small
provider adapter. Export data continuously into Curiosity-owned storage.

### 3.3 Spider integration and mutable cloud configuration

**FACT (high):** a standalone Python script is declared through `setup.py` and
appears as a `py:` job target. Project settings are available to scripts through
the Scrapy Cloud entrypoint helper [S4]. Cloud dashboard settings override the
same settings in `settings.py`; a run call can further provide `job_settings`
[S5, S23].

**FACT (high):** spider templates expose typed metadata and parameters for
creating virtual spiders. Virtual spiders exist only in Scrapy Cloud and run a
template with saved parameters; changes to template code affect them [S22].

**INFERENCE (high):** effective behavior is layered and mutable:

```text
deployed code defaults
  <- project/spider dashboard settings
  <- job settings override
  + spider/script arguments
  + add-on configuration
```

Without a resolved snapshot, later review cannot reconstruct which value won.
Virtual spiders and dashboard-only settings are a direct hosted lock-in vector.

## 4. Job, queue, schedule, cancellation, and retry contracts

### 4.1 Submission and lifecycle

**FACT (high):** `POST /api/run.json` schedules a spider and returns a job ID
such as `project/spider/job`. Inputs include project, spider or `jobq_id`, tags,
priority 0–4, settings overrides, units 1–6, and arbitrary spider arguments.
Job list states are `pending`, `running`, `finished`, and `deleted` [S5].

**FACT (high):** job metadata may expose pending/running/finished timestamps,
project, spider, spider arguments, type, priority, units, tags, deploy ID,
version, scheduler/runner identities, close reason, state, and arbitrary Scrapy
stats. The metadata page explicitly warns that fields are conditional and that
additional internal fields may change without notice [S7].

**UNKNOWN / negative result (high confidence):** the run endpoint documents no
client idempotency key, logical job ID, exact deployment selector, deadline,
max-items/max-requests/max-bytes cap, callback, or platform retry policy [S5].
An ambiguous network retry must therefore be assumed capable of creating a
second job.

**RECOMMENDATION (high):** persist a Curiosity submission ID before calling the
provider, never blindly retry create, and distinguish logical crawl, provider
job, execution attempt, and fetch attempt. Resolve deployment identity before
submission and enforce all bounds inside Curiosity and spider code.

### 4.2 Admission queue and priority

**FACT (high):** each job requests 1–6 units and remains pending until that many
units are available. Units are held for the job's duration and then released.
One unit supplies one compute unit, 1 GB RAM, and 2.5 GB disk. Purchased unit
count bounds parallel jobs; assigning more units to one job increases resources
but consumes corresponding admission capacity [S17].

**FACT (high):** the similarly named JobQ API is not the admission-queue control
surface. It lists/counts jobs—commonly finished jobs—by time, state, spider, and
tags, newest first. Its documented incremental-consumption pattern stores the
last downloaded job key and later lists until that key [S6].

**INFERENCE (high):** Scrapy Cloud has at least two queues with different
semantics: a capacity/priority job admission queue and HCF's crawl-request
queues. JobQ is an observation/export index. Curiosity must not collapse these
into one queue abstraction.

**UNKNOWN:** public docs do not specify fairness, starvation prevention,
priority ordering across organizations, pending expiration, admission SLO, or
whether equal-priority jobs are FIFO.

### 4.3 Outcomes, cancellation, and retries

**FACT (high):** `finished` means the process reached Scrapy's normal close
reason but may still have logged errors. Other documented outcomes include
failed start, user/system cancellation, stalled cancellation, cancel timeout,
shutdown, memory limit, OOM kill, and `closespider_*` outcomes [S20]. A job with
no logs, requests, or items for one hour is automatically cancelled as stalled
[S24]. Stop is graceful and may take about five minutes; exceeding that can
produce `cancel_timeout` [S5, S21].

**FACT (high):** Scrapy controls request-level retries and close conditions in
spider configuration; run-time `job_settings` can override Scrapy settings [S5,
S23]. The job API exposes stop/delete but no restart, retry, resume, or clone
operation [S5]. Sequential jobs are documented as application orchestration:
catch `spider_closed`, then call the run API [S19].

**INFERENCE (high):** platform execution is not documented as automatically
retried or exactly once. Request retries, whole-job retries, periodic recurrences,
and replays are separate decisions. A process crash after an item write or
before HCF batch acknowledgement can produce partial output or duplicate work.

**RECOMMENDATION (high):** use bounded request retry in the crawler and
scheduler-owned job retry outside it. Retry only typed transient failures, with
attempt/time/cost limits; use idempotent capture/item keys; never infer retry
safety from a provider outcome.

### 4.4 Periodic schedules

**FACT (high):** paid accounts can create periodic spider or script jobs. A
schedule has an ID, pause flag, project, one or more tasks, tags, type,
description, and a five-field cron. Each task has name/ID, priority, and
spider/script arguments. Cron fields accept only one concrete value or `*`;
ranges, lists, and steps are unsupported. The API returns a suggested UTC hour
to distribute load [S18]. Support documentation states limits of 1,000 periodic
jobs per project and 10,000 per organization [S26].

**UNKNOWN / negative result:** public schedule docs do not define timezone as a
field, overlap suppression, missed-run catch-up, jitter, at-most-once dispatch,
clock/DST handling beyond the UTC UI example, dependency sequencing, or per-
occurrence deployment pinning [S18, S19, S26].

**RECOMMENDATION (high):** Curiosity should own recurrence. Preserve
`scheduled_for`, `submitted_at`, `admitted_at`, `started_at`, and capture times;
define overlap/catch-up/jitter/timezone/version policy; and treat provider cron
as a convenience, not authoritative freshness.

## 5. Storage, logging, and frontier semantics

### 5.1 Job-scoped streams

**FACT (high):** Hubstorage exposes separate job-keyed streams for items,
requests, and logs plus job metadata. Records can be read by job, spider, or
project and paginated. JSON Lines, JSON, XML, CSV, and text variants are exposed;
job items can also be downloaded from the dashboard [S8-S12].

**FACT (high):** an item is an arbitrary JSON object. The API supports appending
items and addressing them by numeric index; one serialized item over 1 MiB is
rejected. Item stats count values and bytes per field [S8, S16, S27]. The public
contract does not define item update/delete-by-index, transaction, schema
validation, or uniqueness semantics.

**FACT (high):** a request record includes start time, method, URL, origin status,
duration, response size, optional parent request index, and optional request
fingerprint. A log record includes message, numeric level, and optional time.
Both APIs permit uploads, and FIFO/stdout/stderr can produce them [S9, S10,
S16].

**INFERENCE (high):** these are append-oriented operational streams, not an
immutable evidence ledger. Numeric indexes and parent edges aid crawl-graph
reconstruction, but caller-writable records, mutable/deletable jobs, optional
timestamps/fingerprints, and absent hashes prevent integrity claims.

**RECOMMENDATION (high):** ingest provider output as untrusted. Curiosity's
commit must validate schema and byte limits, deduplicate by operation key, hash
raw and normalized artifacts, preserve redirect/discovery edges, and attach
exact policy/extractor/deployment identities.

### 5.2 Logs and observability

**FACT (high):** all Python logging from Scrapy and user code appears in the job
log. Stdout becomes INFO and stderr becomes ERROR. FIFO `STA` messages carry
arbitrary stats and drive dashboard graphs; job metadata can expose Scrapy
stats such as request/response counts, status counts, memory, item counts,
robots activity, and scheduler enqueue/dequeue counts [S7, S10, S11, S16].

**FACT (high):** provider notifications may watch project/spider/job events and
send UI/email notices. The historical built-in Monitoring add-on has been
unsupported since 2017; Zyte recommends a separate Scrapy extension [S28, S29].

**INFERENCE (high):** logs and stats are observability, not outcome validation.
The one-hour stall detector can be kept alive by noisy logs while useful work
has stopped. `finished`, item count, and HTTP 200 count do not prove authorized,
complete, fresh, accurate, or reproducible retrieval.

**RECOMMENDATION (high):** independently measure authorized URL coverage,
source-level yield, duplicate/partial/error rates, freshness, evidence hashes,
robots/policy decisions, per-origin load, and cost. Redact credentials and
personal data before provider logging.

### 5.3 Collections and persistent state

**FACT (high):** collections are project-scoped key-value stores for arbitrary
numbers of JSON records, often shared across jobs. Records are keyed by `_key`,
can be created/overwritten/deleted, and are limited to 1 MB. Store classes are:
regular, one-month cached, versioned with up to three copies, and versioned
one-month cached. Homonymous collections of different types can be renamed or
deleted together [S13].

**FACT (high):** DotScrapy Persistence loads `.scrapy` state at spider start and
saves it when the spider finishes. It is used for cross-run state, HTTP cache,
and DeltaFetch. DeltaFetch only suppresses later requests whose prior responses
produced items; starts and non-item pages are revisited [S30, S35, S36]. Page
Storage uses cached/versioned-cached collections, expires copies after a month,
and stores fields including body, encoding, cookies, URL, and job ID [S37].

**INFERENCE (high):** DotScrapy is shutdown-synchronized state, not a crash-safe
checkpoint transaction. Collections are mutable application state, not
append-only evidence. Persisted cookies and page bodies are sensitive, and the
regular store's retention is not numerically documented on the collection page.

**RECOMMENDATION (high):** do not place Curiosity credentials, durable frontier,
or authoritative evidence in DotScrapy. Use versioned non-executable records,
atomic/fenced transitions, content-addressed artifacts, explicit retention, and
an independent secret manager.

### 5.4 Hub Crawl Frontier

**FACT (high):** HCF persists visited fingerprints and outstanding requests.
Fingerprints are arbitrary strings, not necessarily URLs. A project may have
multiple frontiers; each frontier has slots, each slot a separate priority
queue. Queue and fingerprint records can carry arbitrary data; lower numeric
priority is returned first [S14].

**FACT (high):** Zyte's typical model uses hostname as slot and says a crawler
should ensure one process crawls a host at a time for politeness. Clients receive
batches with IDs and explicitly post completed batch IDs to remove them. A
fingerprint set can be listed lexicographically [S14].

**INFERENCE (high):** HCF provides the right conceptual split—seen set, queued
work, slot fairness, priority, batch claim, explicit ack—but the public contract
does not establish a lease duration, owner, renewal, fencing token, visibility
timeout, redelivery deadline, atomic result+ack, or multi-consumer exclusion.
The instruction that clients enforce one process per host is application policy,
not a storage guarantee.

**UNKNOWN / negative result:** no public HCF capacity, retention, batch-size,
consistency, availability, duplicate-enqueue, crash-redelivery, or rate-limit
guarantee was found [S14].

**RECOMMENDATION (high):** adopt host/eTLD+1 policy slots and canonical request
fingerprints, but require Curiosity-owned leases with owner, expiry, renewal,
fencing, attempt count, not-before time, and idempotent acknowledgement only
after durable capture. Separate `seen request`, `fetched representation`, and
`accepted evidence` identities.

## 6. Scaling and failure model

**FACT (high):** scaling is unit-based. A job can use 1–6 units; each adds one
compute unit, 1 GB RAM, and 2.5 GB disk. Parallel jobs are bounded by purchased
units. OOM may be detected gracefully by Scrapy's memory extension or abruptly
by the OS [S17, S20, S24]. The same spider may run in parallel when more than one
unit exists and its arguments differ [S38].

**INFERENCE (high):** assigning six units vertically scales one container's
resources; it is not documented as distributing one spider across six workers.
Horizontal crawl distribution requires multiple jobs and an external/shared
frontier. More compute does not enforce per-origin politeness.

**FACT (high):** paid pricing describes job duration as unlimited, while the
one-hour no-output stall cancellation still applies. Free pricing currently
states a one-hour maximum job duration [S15, S24].

**DOCUMENTATION DRIFT:** a support article last modified in 2021 describes a
24-hour free-organization limit, conflicting with the current pricing page's
one-hour free limit. The current product page should govern planning, but only a
current contract/account display can resolve enforcement [S15, S20].

**RECOMMENDATION (high):** enforce finite Curiosity budgets regardless of paid
"unlimited" runtime: total URLs, requests, bytes, redirects, retries, wall time,
idle time, CPU/memory/disk, item/log volume, per-origin concurrency/rate, and
provider spend. Scale origin slots independently from worker capacity.

## 7. Provenance, retention, and evidence quality

### 7.1 Provenance available

**FACT (high):** the platform can preserve job ID; project/spider; deploy ID and
version; pending/running/finished times; scheduler/runner identity; arguments;
priority; units; tags; state/close reason; Scrapy stats; request URL/method/time/
status/duration/bytes/fingerprint/parent; item insertion key/time metadata; and
timestamped logs [S5-S12]. Activity records can show events such as job
completion/cancellation and deployment [S31].

**INFERENCE (high):** these fields establish useful operational lineage—what
hosted job ran, with which visible parameters, and which stream records it
emitted. Parent request indexes are especially useful for reconstructing
discovery edges.

### 7.2 Provenance absent or crawler-defined

**UNKNOWN / negative result (high confidence):** the generic platform contract
does not automatically guarantee:

- exact source/image/dependency/runtime digest;
- resolved dashboard/project/spider/job settings snapshot;
- policy/robots/terms decision and version;
- DNS, resolved address, TLS, redirect, and complete response-header trace;
- raw response, rendered DOM, screenshot, normalized text, or item hashes;
- cache disposition and freshness/revisit decision;
- browser/driver/viewport/locale/proxy identity;
- extractor/schema/model version or field-to-source spans;
- atomic binding among request, page capture, item, and frontier ack;
- immutable item/log/request authenticity or deletion audit; or
- complete per-attempt cost [S5-S16].

Individual spiders/add-ons may emit some fields, but the platform does not make
them universal.

### 7.3 Retention

**FACT (high):** current pricing says free job data may be retained for **up to
7 days**, and paid job data for **up to 120 days**, before deletion [S15]. The
wording is a maximum, not a minimum retention guarantee. Page Storage and cached
collection records expire after one month; versioned stores retain at most three
record copies [S13, S37].

**UNKNOWN (material):** reviewed public sources do not define one complete
retention/deletion matrix for deployment bundles/images, job metadata, items,
requests, logs, comments, activity, regular collections, HCF, DotScrapy, deleted
jobs/projects, backups, support copies, or derived usage data. They do not state
whether deleting a job/project immediately erases all copies or provide backup
deletion latency [S5-S15, S39].

**FACT (high):** Zyte's DPA treats customer-directed service personal data under
processor terms, requires security/confidentiality and subprocessor controls,
and provides incident-notification and transfer mechanisms. The Privacy Policy
uses purpose-based retention for several controller records rather than a
Scrapy-Cloud-specific fetched-data schedule [S40, S41]. Exact account terms and
annexes govern.

**RECOMMENDATION (high):** promptly export authorized evidence. Before any
production use, obtain a written retention/deletion matrix, test deletion, and
keep Curiosity's immutable archive and legal-hold policy independent of provider
job retention.

## 8. Security, privacy, and source-rights boundary

This section reports public controls and gaps, not a security certification or
legal opinion.

### 8.1 Authentication and authorization

**FACT (high):** Scrapy Cloud uses an API key distinct from Zyte API. The docs
permit HTTP Basic authentication or an `apikey` query parameter [S11]. Download
examples place the key in a URL [S12].

**FACT (high):** organization membership grants access top-down to all projects;
project-only members see assigned projects. Project members can deploy and run
spiders. Project admins can change settings and delete the project; organization
owners also access billing and are admins across projects [S42-S44].

**INFERENCE (high):** deploy/run permission is code-execution authority and can
read/exfiltrate project-visible settings/data through logs, items, or arbitrary
outbound requests. Query-string API keys are likely to leak through history,
logs, referrers, screenshots, and monitoring. The public docs reviewed do not
show separate read/write/deploy/run/storage scopes, service accounts, per-job
credentials, or expiring storage URLs.

**RECOMMENDATION (high):** never use URL API keys. Require dedicated
least-privilege service identity, rotation, vault injection, environment
separation, egress controls, deployment review, and audit of every member. If
the provider cannot scope a key to only the required project/actions, do not use
it for sensitive workloads.

### 8.2 Container, network, and secret safety

**FACT (high):** custom code and third-party services are allowed; custom images
can include browser tools [S3, S24]. This flexibility makes a job a general
networked code execution unit, not a constrained URL-fetch primitive.

**UNKNOWN / negative result:** public sources reviewed do not establish hard
tenant/kernel/container isolation, ephemeral-disk wipe guarantees, private
networking, destination allowlists, DNS-rebinding/SSRF protection, fixed egress,
customer-managed encryption keys, secret-redaction guarantees, regional worker/
storage selection, or sandbox restrictions for browser subprocesses.

**RECOMMENDATION (high):** no credentials, private-network reach, authenticated
pages, confidential corpora, personal data, or regulated content before a
threat model and procurement review. A pilot must prove deny-by-default egress,
redirect/DNS revalidation, secret non-observability, cross-job isolation, and
cleanup after OOM/cancel/crash.

### 8.3 Contract, privacy, and crawl authority

**FACT (high):** Zyte's Terms define Scrapy Cloud among its software services,
place responsibility for lawful/authorized extraction and use on the customer,
and do not grant rights in extracted data. Public terms permit specified use of
service data/code for service and product purposes subject to the applicable
agreement [S40, S45]. The AUP prohibits unlawful collection, privacy/right
violations, unauthorized security access, and other abusive uses [S46].

**UNKNOWN:** exact processing regions, subprocessors, assurance-report scope,
training/product-improvement exclusions, body/log inspection, and deletion terms
for a proposed Curiosity account require the order, DPA annexes, Trust Center,
and written answers.

**RECOMMENDATION (high):** Curiosity must authorize targets and data uses before
submission. Scrapy Cloud, Scrapy defaults, add-ons, and HCF do not decide robots,
copyright/database rights, source terms, privacy, takedown, or display rights.

## 9. Limits and pricing snapshot

All prices and limits below are public snapshots accessed 2026-08-17, not a
quote or SLA.

| Dimension | Published contract | Implication |
| --- | --- | --- |
| Free capacity | One low-resource unit with half a regular unit's resources [S15] | Suitable only for evaluation; exact low-unit CPU/disk details are not separately tabulated. |
| Paid units | **$9/month per unit**; purchasing replaces the free unit [S15] | Capacity subscription, not per-success pricing. |
| Per regular unit | 1 compute unit, 1 GB RAM, 2.5 GB disk [S17] | Memory/disk scale linearly with allocated units. |
| Units/job | 1–6 [S5, S17] | Maximum documented job resources: 6 GB RAM and 15 GB disk; exact CPU meaning remains provider-defined. |
| Parallel jobs | Bounded by owned units [S17] | One six-unit job can consume six jobs' one-unit capacity. |
| Runtime | Free up to 1 hour; paid unlimited, but one-hour no-output stall cancellation applies [S15, S24] | Still impose hard owned deadlines. |
| Job-data retention | Free up to 7 days; paid up to 120 days [S15] | Maximum retention, not evidence durability. |
| Item/request/log/FIFO message | 1 MiB serialized [S8, S16, S27] | Large pages/binaries need a separate artifact store. |
| Collection record | 1 MB JSON [S13] | Collections are metadata/state, not bulk capture storage. |
| Periodic jobs | 1,000/project; 10,000/organization (support article) [S26] | High count does not define dispatch guarantees. |
| Cron | Five single-value-or-`*` fields; no ranges/lists/steps [S18] | Complex recurrence must be external. |

**UNKNOWN / negative result:** no current public Scrapy Cloud page reviewed gives
API rate limits, maximum project count, maximum deployed image/code size, total
Hubstorage/HCF/collection quota, item count, log count, network transfer price,
storage overage price, unit CPU benchmark, pending queue limit, support SLA, or
availability SLA.

**INFERENCE (high):** all-in cost is not only `$9 × units`:

```text
purchased monthly units
+ any separately contracted storage/support/network features
+ external services and destinations called by spider code
+ idle/failed/retried/duplicate jobs consuming capacity
+ Curiosity export and evidence storage
```

**RECOMMENDATION (high):** obtain a written quote and limits sheet, then run a
separately authorized benign benchmark. Enforce Curiosity-side job, tenant,
origin, byte, retry, and cost ceilings; provider capacity is not a spend or
politeness budget.

## 10. Clean-room architecture inferences

These are **INFERENCES**, not claims about proprietary implementation:

1. **Durable control plane plus ephemeral workers (high).** Project/deployment,
   pending job, job ID, and remote streams survive beyond the container; unit
   RAM/disk and process state do not constitute durable storage [S5-S17].
2. **Capacity-token admission (high).** A job atomically waits for and holds its
   requested number of units until finish, implying an account/organization
   capacity allocator distinct from in-spider Scrapy concurrency [S17].
3. **Separate control and storage services (high).** Submission/schedules use
   `app.zyte.com`; job streams, metadata, collections, and HCF use
   `storage.zyte.com` [S5-S14].
4. **Append-oriented typed ingestion (high).** Container output is converted
   into item/request/log/stat/finish messages and materialized into separate
   indexed streams [S8-S16]. No cross-stream transaction is exposed.
5. **Provider-managed execution adapter (high).** Managed Scrapy entrypoints and
   the generic FIFO both map crawler events into the same hosted data model
   [S4, S16].
6. **Persistent partitioned frontier (high).** HCF separates fingerprint set
   from per-slot priority queues and explicit batch deletion, supporting
   distributed crawl applications but leaving coordination policy to clients
   [S14].
7. **At-least-once must be the safety assumption (medium-high).** Missing run
   idempotency, non-transactional stream writes, graceful cancellation, crash/
   OOM outcomes, and explicit post-processing acknowledgements permit duplicate
   submission or work unless caller code prevents it [S5, S14, S20].
8. **Eventual operational analytics (medium).** stats/activity/job indexes are
   separate from primary execution output; precise consistency and lag are not
   documented [S6, S7, S11, S31].

## 11. Hosted lock-in assessment

| Surface | Portability | Verdict |
| --- | --- | --- |
| Scrapy spider/source | High in principle; Scrapy runs locally or elsewhere | **ADOPTABLE**, but cloud settings/add-ons must be externalized. |
| Custom OCI image | Medium-high compute portability | **ADAPT**; FIFO and provider environment remain hosted adapters. |
| `shub` deployment/client | Client is BSD-3-Clause, target is provider-specific | **DEFER dependency**; do not expose in neutral contracts [S32]. |
| `python-scrapinghub` | BSD-3-Clause hosted API client | **DEFER dependency**; export/migration utility only [S33]. |
| Virtual spiders | Cloud-only saved configuration | **REJECT** as system of record [S22]. |
| Dashboard settings/add-ons | Provider-managed mutable configuration | **REJECT** as authoritative configuration [S23, S25]. |
| Job/Hubstorage IDs and APIs | Readable/exportable, but proprietary namespace and semantics | **ADAPTER ONLY**. |
| Items JSONL/CSV/XML | High data portability | **ADOPT export**, add Curiosity provenance before acceptance. |
| Collections/DotScrapy/Page Storage | Mutable hosted state with special retention | **REJECT** for authoritative state/evidence. |
| HCF | Valuable contract shape; hosted persistence and undocumented lease guarantees | **ADAPT concept**, do not make Curiosity core depend on it. |

**Exit strategy:** keep source, dependency locks, deployment manifests,
schedules, frontier, policy records, and evidence outside Scrapy Cloud; export
items/requests/logs incrementally; map provider IDs into namespaced fields; and
prove a representative job can run locally and on a second executor before
production adoption.

## 12. Curiosity decision ledger

### ADOPT

1. **Deployment/execution separation** with immutable attempt identity.
2. **Explicit pending capacity state** rather than hiding admission delay.
3. **Separate job, crawl-request, and export-index queues.**
4. **Host-slotted persistent frontier** and request fingerprints independent of
   URL strings.
5. **Batch claim plus explicit acknowledgement**, strengthened with leases and
   fencing.
6. **Typed item/request/log/stat streams** and parent discovery edges.
7. **Portable JSON Lines export** with cursor/checkpoint consumption.
8. **Resource telemetry** for CPU class, memory, disk, duration, and output.

### ADAPT

1. **Job states:** add `admission_rejected`, `policy_blocked`, `retry_wait`,
   `partial`, `evidence_invalid`, `budget_exhausted`, and `capacity_timeout`.
2. **Versions:** replace human/version labels with resolved content digests.
3. **Settings:** snapshot and hash the complete effective configuration.
4. **Schedules:** own timezone, overlap, catch-up, jitter, dependencies, and
   per-occurrence executable identity.
5. **HCF:** add canonical fingerprint rules, owner/expiry/fencing, attempts,
   not-before, crash redelivery, and atomic idempotent capture commit.
6. **Operational streams:** bind every item to request, capture, policy,
   extractor, schema, and hashes.
7. **Cancellation:** expose requested, draining, killed, and partial-output
   states separately.
8. **Scaling:** keep provider units, in-process concurrency, and per-origin
   politeness as independent bounds.

### REJECT

1. **Provider job/storage IDs as Curiosity's ABI.**
2. **`finished` as evidence validity or crawl completeness.**
3. **Dashboard settings or virtual spiders as source of truth.**
4. **DotScrapy/collections as authoritative frontier or evidence store.**
5. **Provider retention as archive policy.**
6. **Query-string API keys.**
7. **More units as politeness or horizontal distribution.**
8. **Automatic blind whole-job retry after ambiguous submission/failure.**
9. **Logs/stats as item-level provenance.**

### DEFER

1. **Hosted adapter pilot** until contract, limits, SLA, DPA, security,
   residency, isolation, retention, deletion, and source-rights gates pass.
2. **Custom Docker** until beta status, image integrity, runtime isolation, and
   egress controls are contractually and empirically resolved.
3. **HCF dependency** until lease/redelivery/consistency/capacity/retention
   semantics are answered and benign failure tests are authorized.
4. **Sensitive/personal/authenticated workloads** until account-specific data
   handling and training/product-use terms are approved.
5. **Provider periodic scheduling** until duplicate/missed/overlap behavior is
   defined; owned scheduling remains preferred.

## 13. Required checks before any pilot

| Gate | Pass condition |
| --- | --- |
| Contract | Written allowed use, availability/support, pricing/limits, termination export, and change notice. |
| Identity | Exact source/dependency/image/runtime/settings manifest is immutable per attempt. |
| Submission | Ambiguous `run.json` response cannot create uncontrolled duplicate work or spend. |
| Bounds | URLs, requests, redirects, bytes, retries, depth, origins, units, RAM, disk, logs, items, wall time, idle time, and cost fail closed. |
| Isolation | No cross-project/job files, cookies, processes, storage, tokens, logs, or network access; cleanup verified after OOM/cancel/crash. |
| Egress | Direct, redirect, DNS-rebinding, browser subresource, local-file, metadata-service, and private-address paths are denied unless explicitly authorized. |
| Secrets | Project-scoped least privilege, non-URL auth, rotation, redaction, no deployer readback, and no secret in item/log/request output. |
| Frontier | Dedupe, lease expiry/renewal/fencing, crash redelivery, partial batch handling, and result+ack recovery are proven. |
| Provenance | Policy, request/response/capture times, redirects, hashes, exact executable/extractor, parent edge, and partial state survive export. |
| Retention | Written and tested deletion for every data class including backups and HCF/collections. |
| Quality | Authorized corpus meets coverage, duplicate, extraction, freshness, variance, and silent-failure thresholds. |
| Exit | Representative spider runs elsewhere and all required state/data export without dashboard-only configuration. |
| License | Scrapy, `shub`, client, stack, add-on, browser/driver, image, and transitive obligations recorded separately. |

## 14. Unknowns and retained negative results

1. No job-create idempotency key or provider logical-job correlation field was
   found in the public run contract.
2. No exact deployment/image digest selector was found in the run contract.
3. No platform-level automatic retry/restart/resume guarantee was found.
4. No job admission fairness, FIFO, pending timeout, or SLO was found.
5. No schedule delivery, overlap, catch-up, timezone, DST, or duplicate-dispatch
   guarantee was found.
6. No HCF lease owner, timeout, renewal, fencing, crash-redelivery, consistency,
   capacity, retention, or rate-limit contract was found.
7. No atomic transaction binds frontier acknowledgement to request/page/item
   storage.
8. No universal capture hash, redirect trace, exact runtime, policy record, or
   field-level evidence provenance was found.
9. No full retention/deletion matrix reconciles job data, regular collections,
   DotScrapy, HCF, activity, deployments, deleted projects, and backups.
10. No public Scrapy Cloud-specific region/residency, private networking,
    customer-managed key, fixed egress, or hard tenant-isolation contract was
    found.
11. No documented scoped/expiring Scrapy Cloud API key model was found; public
    examples include a high-risk URL query parameter.
12. No current public API-rate, total-storage, HCF-size, item-count, project,
    image-size, network-price, or availability-SLA table was found.
13. Current free runtime (one hour) conflicts with an older support article's
    24-hour outcome; documentation drift is retained rather than reconciled by
    assumption.
14. No account was used, so actual settings precedence, cancellation timing,
    duplicate submission, schedule overlap, storage expiry, HCF redelivery, and
    deletion were not empirically verified.

## 15. Bounded curiosity pass

Scoring is 1 (low) to 5 (high); cost is investigation cost, where 1 is cheap.
The pass stayed inside the declared frame and caller authority.

| Thread | R | V | N | C | Decision/result |
| --- | ---: | ---: | ---: | ---: | --- |
| Job-create idempotency and retry | 5 | 5 | 4 | 1 | **Pursued:** run parameters lack an idempotency key; no platform restart/retry endpoint found. At-least-once caller safety adopted [S5]. |
| JobQ vs admission queue vs HCF | 5 | 5 | 4 | 1 | **Pursued:** three different semantics identified; prevented a misleading unified-queue interpretation [S6, S14, S17]. |
| HCF lease/redelivery guarantees | 5 | 5 | 5 | 2 | **Pursued to saturation:** explicit batch completion exists, but owner/expiry/fencing/redelivery guarantees remain undocumented [S14]. |
| Job-data versus collection/HCF retention | 5 | 5 | 4 | 2 | **Pursued:** 7/120-day job maxima and one-month cache rules found; complete matrix remains unknown [S13, S15, S37]. |
| Custom-image portability | 4 | 4 | 4 | 1 | **Pursued:** Docker and generic FIFO reduce runtime lock-in, while add-ons and storage remain hosted; feature is beta [S3, S16, S25]. |
| Settings/version reproducibility | 5 | 5 | 3 | 1 | **Pursued:** VCS-derived version exists, but overrides and cloud settings prevent digest-level reproducibility [S3, S7, S23]. |
| Live duplicate, HCF crash, OOM, or deletion tests | 5 | 5 | 4 | 5 | **CURIOSITY_NO_GO:** needs credentials/account execution and an approved benign test plan. |
| Inspect proprietary scheduler/Hubstorage internals | 1 | 2 | 4 | 5 | **CURIOSITY_NO_GO:** outside clean-room/access boundaries; public contract is sufficient for this decision. |
| Test targets, anti-blocking, CAPTCHA, or proxy behavior | 1 | 1 | 2 | 5 | **CURIOSITY_NO_GO:** Zyte API is excluded and bypass testing is unnecessary. |
| Make jurisdiction-specific crawling legality conclusions | 5 | 5 | 3 | 5 | **CURIOSITY_NO_GO:** requires counsel plus target, purpose, and data facts. |
| Obtain non-public Trust Center/SOC/pentest reports | 4 | 4 | 2 | 4 | **CURIOSITY_NO_GO:** procurement diligence; public research cannot substitute for it. |
| Benchmark price/performance | 4 | 4 | 3 | 5 | **CURIOSITY_NO_GO:** paid/credentialed testing was prohibited. |

**Coverage stop:** every requested category has facts, inferences,
recommendations, confidence, unknowns, checks, and an adopted/adapted/rejected/
deferred verdict. Further public searches were saturating around undisclosed
runtime and account-contract details.

## Sources

All sources are first-party Zyte or official Zyte/Scrapinghub repositories,
accessed 2026-08-17. Older support articles retain their displayed modification
dates and are not treated as stronger than current product/API documentation.

- **[S1]** Zyte, [Scrapy Cloud projects](https://docs.zyte.com/scrapy-cloud/usage/projects.html).
- **[S2]** Zyte, [Deploying code to Scrapy Cloud projects](https://docs.zyte.com/scrapy-cloud/usage/deployment.html).
- **[S3]** Zyte Support, [Deploying custom Docker images on Scrapy Cloud](https://support.zyte.com/support/solutions/articles/22000200425-deploying-custom-docker-images-on-scrapy-cloud).
- **[S4]** Zyte, [Scrapy Cloud scripts](https://docs.zyte.com/scrapy-cloud/usage/scripts.html).
- **[S5]** Zyte, [Scrapy Cloud Jobs API](https://docs.zyte.com/scrapy-cloud/usage/reference/http/jobs.html).
- **[S6]** Zyte, [Scrapy Cloud JobQ API](https://docs.zyte.com/scrapy-cloud/usage/reference/http/jobq.html).
- **[S7]** Zyte, [Scrapy Cloud job metadata API](https://docs.zyte.com/scrapy-cloud/usage/reference/http/jobmeta.html).
- **[S8]** Zyte, [Scrapy Cloud Items API](https://docs.zyte.com/scrapy-cloud/usage/reference/http/items.html).
- **[S9]** Zyte, [Scrapy Cloud Requests API](https://docs.zyte.com/scrapy-cloud/usage/reference/http/requests.html).
- **[S10]** Zyte, [Scrapy Cloud Logs API](https://docs.zyte.com/scrapy-cloud/usage/reference/http/logs.html).
- **[S11]** Zyte, [Scrapy Cloud HTTP API overview](https://docs.zyte.com/scrapy-cloud/usage/reference/http/index.html).
- **[S12]** Zyte, [Downloading from Scrapy Cloud](https://docs.zyte.com/scrapy-cloud/usage/items/download.html).
- **[S13]** Zyte, [Scrapy Cloud Collections API](https://docs.zyte.com/scrapy-cloud/usage/reference/http/collections.html).
- **[S14]** Zyte, [Hub Crawl Frontier API](https://docs.zyte.com/scrapy-cloud/usage/reference/http/frontier.html).
- **[S15]** Zyte, [Scrapy Cloud pricing](https://docs.zyte.com/scrapy-cloud/pricing.html).
- **[S16]** Zyte, [Scrapy Cloud Write Entrypoint](https://docs.zyte.com/scrapy-cloud/usage/reference/entry.html).
- **[S17]** Zyte, [Scrapy Cloud units](https://docs.zyte.com/scrapy-cloud/usage/units.html).
- **[S18]** Zyte, [Periodic Jobs API](https://docs.zyte.com/scrapy-cloud/usage/reference/http/periodicjobs.html).
- **[S19]** Zyte Support, [Scheduling jobs sequentially](https://support.zyte.com/support/solutions/articles/22000244891-is-it-possible-to-schedule-jobs-to-run-sequentially-).
- **[S20]** Zyte Support, [Understanding job outcomes](https://support.zyte.com/support/solutions/articles/22000200413-understanding-job-outcomes).
- **[S21]** Zyte Support, [Stopping a running spider](https://support.zyte.com/support/solutions/articles/22000222482-i-clicked-on-stop-button-but-spider-not-stopped-).
- **[S22]** Zyte, [Scrapy Cloud spiders, templates, and virtual spiders](https://docs.zyte.com/scrapy-cloud/usage/spiders.html).
- **[S23]** Zyte Support, [Customizing Scrapy settings in Scrapy Cloud](https://support.zyte.com/support/solutions/articles/22000200670-customizing-scrapy-settings-in-scrapy-cloud).
- **[S24]** Zyte, [Scrapy Cloud FAQ](https://docs.zyte.com/scrapy-cloud/usage/faq.html).
- **[S25]** Zyte Support, [Scrapy Cloud add-ons](https://support.zyte.com/support/solutions/articles/22000200395-scrapy-cloud-addons).
- **[S26]** Zyte Support, [Scheduling periodic jobs](https://support.zyte.com/support/solutions/articles/22000200419-scheduling-periodic-jobs).
- **[S27]** Zyte Support, [1 MB serialized message limit](https://support.zyte.com/support/solutions/articles/22000218173-why-do-i-get-rejected-message-because-it-was-too-big-error-).
- **[S28]** Zyte Support, [Getting notifications on events](https://support.zyte.com/support/solutions/articles/22000200451-getting-notifications-on-certain-events).
- **[S29]** Zyte Support, [Monitoring add-on](https://support.zyte.com/support/solutions/articles/22000200393-monitoring-addon).
- **[S30]** Zyte Support, [DotScrapy Persistence add-on](https://support.zyte.com/support/solutions/articles/22000200401-dotscrapy-persistence-addon).
- **[S31]** Zyte, [Scrapy Cloud Activity API](https://docs.zyte.com/scrapy-cloud/usage/reference/http/activity.html).
- **[S32]** Zyte/Scrapinghub, [`shub` official repository and BSD-3-Clause license](https://github.com/scrapinghub/shub).
- **[S33]** Zyte/Scrapinghub, [`python-scrapinghub` official repository and BSD-3-Clause license](https://github.com/scrapinghub/python-scrapinghub).
- **[S34]** Scrapy, [official repository and BSD license](https://github.com/scrapy/scrapy).
- **[S35]** Zyte Support, [DeltaFetch add-on](https://support.zyte.com/support/solutions/articles/22000200411-delta-fetch-addon).
- **[S36]** Zyte Support, [HTTP cache on Scrapy Cloud](https://support.zyte.com/support/solutions/articles/22000201056-can-i-use-an-http-cache-on-scrapy-cloud-).
- **[S37]** Zyte Support, [Page Storage add-on](https://support.zyte.com/support/solutions/articles/22000200403-page-storage-addon).
- **[S38]** Zyte Support, [Running the same spider in parallel](https://support.zyte.com/support/solutions/articles/22000232777-can-i-run-the-same-spider-in-parallel-).
- **[S39]** Zyte Support, [Deleting projects](https://support.zyte.com/support/solutions/articles/22000200397-deleting-projects).
- **[S40]** Zyte, [Data Processing Agreement](https://www.zyte.com/terms-policies/dpa/).
- **[S41]** Zyte, [Privacy Policy](https://www.zyte.com/terms-policies/privacy-policy/).
- **[S42]** Zyte Support, [Managing organization and project members](https://support.zyte.com/support/solutions/articles/22000271734-managing-organization-and-project-members).
- **[S43]** Zyte Support, [Inviting users to projects](https://support.zyte.com/support/solutions/articles/22000200430-inviting-users-to-projects).
- **[S44]** Zyte Support, [Organizations and projects](https://support.zyte.com/support/solutions/articles/22000200432-organizations-and-projects).
- **[S45]** Zyte, [Terms of Service](https://www.zyte.com/terms-policies/terms-of-service/).
- **[S46]** Zyte, [Acceptable Use Policy](https://www.zyte.com/terms-policies/acceptable-use-policy/).
- **[S47]** Zyte Support, [Versioning Scrapy Cloud deployments](https://support.zyte.com/support/solutions/articles/22000204254-versioning-your-deploys-to-zyte-developer-tool-scrapy-cloud).

## Overall confidence

- **High:** documented API shapes, job states/inputs, unit allocation, current
  headline pricing, item/request/log schemas, FIFO protocol, collection classes,
  and HCF's visible slot/fingerprint/batch model.
- **Medium:** logical architecture, at-least-once safety conclusion, effective
  settings layering, and lock-in assessment.
- **Low/unknown:** hidden worker/storage implementation, queue fairness,
  idempotency under failure, HCF lease/redelivery behavior, regionality,
  isolation, backup deletion, account-specific legal terms, SLA, and real-world
  price/performance.
