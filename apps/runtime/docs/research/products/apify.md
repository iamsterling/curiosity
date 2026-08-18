# Apify crawling platform: clean-room research dossier

**Research date / source access date:** 2026-08-17  
**Decision frame:** whether Curiosity should use Apify as a hosted execution
provider, reuse its open-source crawling components, or only adapt its public
contracts and operating patterns.  
**Status:** research only. No account was created, no Actor was run, no paid
test or credential was used, no private interface was accessed, and no source
code or documentation prose was copied into an implementation.

## Executive verdict

**DEFERRED as a hosted Curiosity execution provider (medium confidence).**
Apify is a capable serverless job platform with durable run handles, Docker
build identity, reusable task configurations, three purpose-specific storage
types, schedules, webhooks, per-run cost caps, proxy products, and a large
third-party Actor marketplace. Those capabilities could accelerate a bounded
rendering or specialist-extraction lane. They do not by themselves provide a
Curiosity-grade crawl policy, evidence model, source-rights decision, tenant
sandbox, deterministic extractor, or immutable provenance chain. Public
contract and security materials leave material retention, regionality,
Community Actor data access, webhook authenticity, and isolation details for
procurement validation [S1-S5, S19-S24].

**REJECTED as Curiosity's provider-neutral core or evidence system of record
(high confidence).** Actor/task/run and storage URLs are Apify-specific hosted
control-plane concepts. An Actor may execute arbitrary code and may return
mutable files or append-only rows without source hashes, retrieval policy,
capture timestamps, or claim-to-passage lineage. Store Actors are heterogeneous
third-party products, and Apify expressly does not vet, endorse, or guarantee
Community Actors' security, accuracy, quality, or legal compliance [S3, S4,
S19].

**ADAPTED as architecture evidence (high confidence).** Curiosity should learn
from: immutable run IDs; initial/transitional/terminal states; explicit build
identity; reusable configuration separate from execution; per-run default
storage handles; append-only result streams; frontier de-duplication and
leases; partial batch acknowledgements; migration-aware checkpoints; resource-
sensed local concurrency; origin/schedule metadata; cost ceilings; and schema-
driven output discovery. Curiosity must strengthen these with submission
idempotency, policy decisions, evidence hashes, explicit retention/deletion,
signed callbacks, hard content budgets, and provider-neutral semantics [S2,
S5-S18].

**ADOPTED only as separately reviewed dependencies, not copied behavior:** the
reviewed Crawlee, Apify JavaScript/Python SDK, and JavaScript API-client
repositories are published under Apache-2.0, while the hosted Platform and
Apify-maintained Actors remain proprietary services under contract. Any
dependency adoption requires ordinary Apache-2.0 attribution,
NOTICE/dependency review, version pinning, and transitive browser/driver license
inventory [S24-S28].

## 1. Bounded questions and method

This dossier answers ten bounded questions:

1. What are the Actor, task, build, and run contracts?
2. What durability and delivery semantics do datasets, key-value stores, and
   request queues provide?
3. How do browser pools, sessions, proxies, and autoscaling divide
   responsibility?
4. What do schedules, webhooks, migration, retries, and resurrection imply for
   duplicate work and state recovery?
5. Which provenance fields exist, and which evidence-lineage fields do not?
6. What retention, privacy, permissions, and security boundaries are public?
7. What resource, API, concurrency, and pricing limits bound the platform?
8. Which architectural conclusions can be drawn without reverse engineering?
9. Where is the hosted-versus-open-source boundary, and what licenses apply?
10. Which lessons should Curiosity adopt, adapt, reject, or defer?

**Depth budget:** current official Apify product, API, legal, storage, account,
and integration documentation; the official Actor whitepaper; current official
Crawlee documentation; and official Apify GitHub repository/license metadata.
The API OpenAPI document was inspected only to verify publicly documented
parameters. No account-only test, Store Actor evaluation, endpoint probing,
proxy experiment, anti-blocking reproduction, source audit, legal opinion, or
performance benchmark was performed.

**Evidence labels:**

- **FACT** — directly supported by a cited primary source.
- **INFERENCE** — reasoned interpretation of public behavior, not a claim about
  undisclosed internals.
- **UNKNOWN** — material point not established by reviewed primary sources.
- **RECOMMENDATION** — Curiosity design or governance advice.
- Confidence is **high**, **medium**, or **low**.

Vendor documentation establishes documented behavior, not empirical
correctness, contractual SLA, security effectiveness, or legal permission to
crawl a target. Negative searches and documentation contradictions are retained.

## 2. Product boundary and architecture

### 2.1 What Apify is

**FACT (high):** an Actor is a Docker-packaged serverless program with JSON
input, optional structured output, documentation, schemas, storage access, and
metadata. It can be run through Console, API, clients, schedules, other Actors,
MCP, or integrations. Public Actors are distributed through Apify Store;
private Actors remain account resources [S1, S2].

**FACT (high):** an Actor must be built into a Docker image before running.
Builds have numbers and movable tags such as `latest`; exact build numbers avoid
unplanned version changes, while tags trade reproducibility for updates. A run
is a dedicated container with CPU, memory, disk, logs, and three default storage
IDs [S2].

**FACT (high):** Apify's current general terms say Apify develops, owns, and
operates the Platform as a remotely accessed subscription service. Actors are
separately owned by their creators, and, unless explicitly stated otherwise,
Actors are not part of the Services supplied by Apify. Open-source components
remain governed by their own licenses [S22, S24].

**INFERENCE (high):** the publicly observable architecture is:

```text
caller / schedule / webhook / Actor
  -> Apify API, auth, permissions, billing and run admission
  -> Actor build/tag resolution
  -> READY run record + default storage identities
  -> worker placement -> Docker container
       -> arbitrary Actor code
       -> HTTP or browser crawling via chosen libraries
       -> optional Apify Proxy
       -> request queue frontier / checkpoints
       -> dataset rows + key-value artifacts
  -> terminal run state + usage/statistics
  -> polling / output links / webhook delivery
```

The API/control plane, scheduler, hosted storage, worker placement, billing,
Store, and proxy network are hosted services. Crawlee and the reviewed
SDK/client/`proxy-chain` repositories are separable open-source components.
Running Crawlee locally is not self-hosting Apify Platform [S1, S5, S24-S28,
S44].

### 2.2 What Apify is not

**FACT (high):** the Actor whitepaper says Actors are best for isolated jobs,
not dependable database workloads; long runs can migrate between servers, and
container startup makes an Actor inefficient for every tiny transaction unless
Standby is used. The whitepaper aims at an open Actor standard but explicitly
says it is not an official specification and that an independent backend-system
specification remains work in progress [S24].

**INFERENCE (high):** Apify is a general execution marketplace, not a single
crawler with uniform crawl policy or output semantics. “Runs on Apify” says
nothing by itself about robots handling, source authorization, retries,
canonicalization, rendering, extraction quality, freshness, or evidence
retention. Those are Actor- and caller-defined unless a specific contract says
otherwise.

**RECOMMENDATION (high):** model Apify as an optional *execution provider*.
Never let `actor_id`, Store categories, Apify storage IDs, proxy groups, or
platform run states define Curiosity's core ABI.

## 3. Actors, tasks, builds, and runs

### 3.1 Actor and task contracts

**FACT (high):** Actor input is normally a JSON object. A task is not a separate
program: it is a named, reusable Actor configuration with saved input and run
options such as memory and timeout. At task invocation, a JSON payload overrides
provided properties; omitted properties fall back to task values or the Actor
input schema defaults [S3, S5].

**FACT (high):** Actor input/output schemas primarily support generated UI,
documentation, validation, and integration. The output object is an immutable,
schema-generated JSON map of links to results. It is available on the run object
immediately at start and is separate from the data it points to; it does not
prove that linked results exist, are complete, or are valid [S4, S18].

**FACT (high):** an Actor can define a draft-07 schema for each item in its
default dataset. A write containing any invalid item is rejected as a whole
with HTTP 400 and item-level validation errors. Named datasets and views do not
support this schema mechanism [S17].

**INFERENCE (high):** `Actor -> Task -> Run` cleanly separates executable
identity, reusable configuration, and execution occurrence. However, neither
task save nor run creation is an evidence capture. A moving build tag, mutable
task input, or mutable KVS record can change later behavior.

**RECOMMENDATION (high):** Curiosity should preserve this separation as
`executor_definition`, `job_template`, and immutable `job_attempt`, but snapshot
the fully resolved input, policy, exact image/build digest, adapter version, and
schema versions for every attempt.

### 3.2 Run creation and state

**FACT (high):** `POST /v2/actors/:actorId/runs` and the task equivalent return
HTTP 201 immediately with a run object. `waitForFinish` can hold the request for
at most 60 seconds. Fully synchronous endpoints can wait up to 300 seconds but
may lose the response if an idle connection breaks; the legacy KVS-returning
endpoint expects an `OUTPUT` record that Actors are not required to create
[S5-S7].

**FACT (high):** run states are `READY`, `RUNNING`, `SUCCEEDED`, `FAILED`,
`TIMING-OUT`, `TIMED-OUT`, `ABORTING`, and `ABORTED`. Immediate abort kills the
process; graceful abort emits an event and allows 30 seconds. A terminal run can
be resurrected, reusing the same storage and optionally a different build,
memory, or timeout [S2].

**FACT (high):** the run object includes run, Actor, task, user, build, and
default-storage IDs; timestamps; status and status message; invocation origin;
schedule ID/time when applicable; build number; resource options; exit code;
restart/reboot/migration/resurrection counters; CPU, memory, network, duration,
compute, proxy, transfer, and storage usage; charged event counts; and cost when
authorized [S5, S6].

**FACT (high):** the public run-create contract exposes timeout, memory, exact
build/tag, restart-on-error, `maxItems`, `maxTotalChargeUsd`, webhooks, and a
permission override. `maxItems` caps billable dataset items only for the
applicable pricing model and explicitly does **not** guarantee output cardinality.
`maxTotalChargeUsd` is the general run-cost cap [S5].

**UNKNOWN (high confidence in negative result):** no run-creation idempotency
key is documented in the current endpoint/OpenAPI parameters. Network retry of
a create call must therefore be assumed capable of creating duplicate billable
runs. The API does document idempotency elsewhere (for example webhook
creation/charging), making the absence on run creation notable rather than an
API-wide omission [S5, S29].

**RECOMMENDATION (high):** Curiosity must generate a provider-neutral
submission ID, persist it before calling Apify, reconcile ambiguous responses
against run metadata where possible, and never blindly retry a run-creation
POST. Keep attempt ID distinct from logical job ID. Do not treat resurrection
with a different build as the same reproducible attempt.

### 3.3 Migration and recovery semantics

**FACT (high):** Apify may migrate long-running containers for workload
optimization, server failures, or releases. Memory and local disk state are
lost; default platform storages survive. Actors receive only a short interval
to checkpoint, and the platform restarts the run on another server. SDK state
helpers persist state to KVS; periodic persistence is conventionally 60 seconds
[S15, S24].

**INFERENCE (high):** hosted execution is restartable, not exactly once. Work
completed since the last durable checkpoint may repeat after migration, crash,
restart, queue-lock expiry, or resurrection. A successful append before a lost
checkpoint can yield duplicate output.

**RECOMMENDATION (high):** every Curiosity fetch/extract operation requires an
idempotent operation key and commit protocol. Persist capture identity before
side effects, make result publication conditional on that identity, and treat
all worker execution as at-least-once.

## 4. Storage and crawl-frontier contracts

### 4.1 Dataset

**FACT (high):** a dataset is sequential, append-only object storage. A default
dataset is created on first item write; rows cannot be changed or deleted
individually after storage. Exports include JSON, JSONL, CSV, HTML, XLSX, XML,
and RSS. Multiple runs can write concurrently, but write order is not
guaranteed [S8, S11].

**FACT (high):** hidden `#` fields may be omitted by “clean” export. This is a
projection feature, not deletion. Objects are limited to under 9 MB each;
tabular exports support at most 2,000 columns; dataset pushes are limited to
400 API requests/second per dataset, while other endpoints default to 60
[S8].

**INFERENCE (high):** append-only helps auditability but is not immutability in
the evidence sense: a dataset can be deleted as a whole, expire, be shared,
receive concurrent rows from unrelated runs, and omit hidden diagnostics at
export. Rows receive no documented automatic source URL, fetch time, response
hash, parser version, or run ID.

**RECOMMENDATION (high):** never use an Apify dataset directly as Curiosity's
evidence ledger. Validate and ingest rows into a Curiosity-owned manifest with
run/build identity, operation key, source/canonical URL, redirect chain,
request/response times, policy decision, content hash, extractor version,
partial/error state, and original artifact reference.

### 4.2 Key-value store

**FACT (high):** each run gets a mutable KVS containing Actor input. Records are
addressed by key, retain MIME type, can contain JSON, text, HTML, images, zip
files, or arbitrary binary data, and can be overwritten or deleted. Apify says
KVS uses AWS S3 and therefore provides strong read-after-write consistency
[S9].

**FACT (high):** records are now stored as uploaded; compression is caller or
client behavior. Keys are at most 256 characters and have a restricted character
set. Secure environment variables are encrypted at rest and redacted from run
logs, while build-time environment variables are explicitly unsuitable for
secrets because they are frozen into the Docker image [S9, S16].

**INFERENCE (high):** KVS is appropriate for bounded raw captures and
checkpoints but not an immutable archive. A stable key such as `INPUT` or
`OUTPUT` can be overwritten, and input presence in KVS increases the
confidentiality impact of run/storage sharing.

**RECOMMENDATION (high):** if a later Apify adapter is approved, write
content-addressed, immutable-by-policy artifact keys and immediately verify
hashes after retrieval. Never rely on the mutable `OUTPUT` convention. Keep
secrets out of Actor input, datasets, status messages, logs, webhook URLs, and
artifact metadata.

### 4.3 Request queue

**FACT (high):** request queues store URL, method, payload, headers, custom
data, retry count, loaded URL, errors, handled time, and a caller-controlled
`uniqueKey`. Duplicate keys return the existing request ID. Requests can be
inserted at the end or forefront for breadth-/depth-oriented crawling [S10,
S12].

**FACT (high):** batch add accepts at most 25 requests and returns separate
`processedRequests` and retryable `unprocessedRequests`. Queue locking gives a
request to one client for a lease duration; expiry makes failed work available
again. Only the same client key or Actor run may prolong or remove its lock
[S10, S12].

**FACT (high):** queue request CRUD and lock operations permit up to 400
requests/second per queue; batch and list-and-lock-head operations permit 40;
other queue endpoints permit 60. API clients are expected to back off on 429
[S10, S29].

**INFERENCE (high):** `uniqueKey` provides frontier de-duplication only under
the chosen key function. It does not prove canonical URL equivalence, response
identity, or exactly-once processing. Expiring leases deliberately permit
redelivery. Caller-supplied headers/payloads/errors also make queue data
sensitive and untrusted.

**DOCUMENTATION CONTRADICTION:** the storage overview says a request queue may
be appended by multiple runs but processed by only one run at a time [S11]. The
request-queue page documents locks expressly to distribute one queue across
multiple Actor runs [S10]. The latter appears newer/more specific, but Curiosity
must not assume multi-run processing semantics without a contract test.

**RECOMMENDATION (high):** adapt the frontier pattern—dedupe key, priority,
lease owner/expiry, attempts, terminal handling, and partial batch ack—but use a
Curiosity-defined canonical request fingerprint that includes method, normalized
URL, relevant body/header identity, crawl policy version, and context. Keep
frontier lease separate from evidence commit.

## 5. Browser pools, sessions, proxies, and autoscaling

### 5.1 Browser and session pools

**FACT (high):** Crawlee's open-source `BrowserPool` manages browser and page
lifecycle, can mix browser plugins, limits open pages per browser, retires
browsers after page counts or inactivity, and exposes launch/page hooks. It can
open a page in an existing browser or force a new browser [S13].

**FACT (high):** Crawlee `SessionPool` binds proxy identity with cookies,
headers, tokens, and custom state, tracks bad/blocked sessions, and rotates or
retires them. Apify Proxy supports datacenter, residential, and Google SERP
groups, random or sticky sessions, and country targeting. Documented session
persistence is 26 hours for datacenter and roughly 30 minutes for residential;
SERP proxy does not support sessions [S14, S30].

**INFERENCE (high):** a browser, page, browser context, proxy session, Actor
run, and Curiosity tenant are different scopes. BrowserPool reuse improves
throughput but is not a hard security boundary. Cookies/custom tokens retained
in sessions create cross-request confidentiality risk, and the public docs do
not promise process/kernel/network isolation between pages or concurrent runs.

**RECOMMENDATION (high):** Curiosity should default to plain HTTP. Render only
after policy allows it and static retrieval is insufficient. Use one fresh
ephemeral browser context—and for sensitive/untrusted work, one browser
process/container—per trust domain. Disable arbitrary launch hooks, browser
arguments, extensions, downloads, file access, and credential-bearing sessions
at the adapter boundary.

### 5.2 Proxy implications

**FACT (high):** Apify Proxy rotates IPs per browser for browser jobs and per
request for HTTP jobs unless sticky sessions are used. External proxy access
requires a paid plan. The proxy password is sent using the HTTP proxy protocol;
Apify warns not to use it on insecure networks. Actor runs receive the user's
proxy password in an environment variable, including limited-permission Actors
[S16, S30].

**INFERENCE (high):** proxy access is a powerful, billable credential and a
policy-sensitive capability. Geographic egress is an access signal, not proof
of what a typical local user saw. Rotating identities can increase legal,
source-policy, and abuse risk even when technically effective.

**RECOMMENDATION (high):** do not expose Apify proxy groups, passwords, sticky
session IDs, or arbitrary geolocation to Curiosity callers. A reviewed adapter
must authorize proxy class and region per job, redact proxy material, preserve
requested versus effective egress metadata, and forbid use to evade access
controls. Owned crawling should identify itself, obey applicable robots/source
policy, limit per-origin concurrency, and back off.

### 5.3 Two different scaling layers

**FACT (high):** Actor memory allocation controls CPU and disk: one CPU core per
4,096 MB, proportional fractional CPU below that, and disk equal to twice
memory. Browser Actors need at least 1,024 MB according to Apify guidance.
Crawlee Actors autoscale *tasks inside one run* against CPU, memory, and event-
loop pressure [S31, S32].

**FACT (high):** Crawlee crawlers default to scaling from one request up to a
documented maximum concurrency of 200; `maxConcurrency` and
`maxRequestsPerMinute` provide explicit caps. `AutoscaledPool` checks resource
snapshots and task readiness/completion, but its `abort()` does not guarantee
cancellation of already-running asynchronous tasks [S31, S32].

**INFERENCE (high):** internal autoscaling is adaptive concurrency, not
horizontal autoscaling of one logical crawl across Actor containers. Apify's
account-level concurrent-run and combined-memory limits are a separate admission
layer. Request queue locks can support multi-run distribution, but application
coordination is still required.

**RECOMMENDATION (high):** preserve separate budgets for: number of Actor runs,
memory/CPU per run, in-run task concurrency, per-origin requests/minute,
browser pages/processes, total URLs, bytes, retries, deadline, and cost. Resource
headroom must never override politeness or source policy.

## 6. Scheduling, callbacks, and operations

### 6.1 Schedules

**FACT (high):** schedules use cron expressions, an explicit timezone, and DST
handling. They can invoke up to 10 Actors and 10 tasks, merge input overrides,
and set build, memory, and timeout. Scheduled events usually fire within one
second but may be delayed by overload or server shutdown. The minimum interval
is 10 seconds; an occurrence sooner than 10 seconds after the prior one is
skipped [S33].

**INFERENCE (high):** schedule time is desired dispatch time, not start or
capture time. A multi-action schedule is not documented as a transaction, and
delivery timing is not an SLO.

**RECOMMENDATION (high):** retain `scheduled_for`, `submitted_at`, `started_at`,
and `captured_at` separately. Curiosity owns overlap, catch-up, jitter,
dependency, missed-run, and timezone policy. Do not infer freshness from cron
time.

### 6.2 Webhooks

**FACT (high):** webhooks emit run-created, succeeded, failed, aborted,
timed-out, and resurrected events and send an HTTP POST. Non-2xx responses retry
with exponential delays from roughly one minute through an eleventh retry at
about 32 hours; the request timeout is two minutes. Apify warns that duplicate
delivery can occur and receivers must be idempotent [S34-S36].

**FACT (high):** documented security advice is to put a secret token in the URL
or headers and optionally allowlist static source IPs. System headers include a
dispatch ID. The reviewed webhook documentation does not document an Apify
cryptographic signature or timestamp-verification scheme [S36].

**RECOMMENDATION (high):** use webhooks only as hints to fetch authoritative run
state. Terminate them at a Curiosity gateway with TLS, a rotated secret header,
source filtering, replay/deduplication by dispatch/event/run ID, strict body and
time limits, and no direct job authority. Never put secrets in callback URLs.

### 6.3 Monitoring

**FACT (high):** built-in monitoring shows run states for 30 days, metrics for
the last 200 runs, and alerts on run state, usage, duration, result count, and
dataset-field statistics. Higher-than checks run approximately every five
minutes; failure alerts aggregate after the first notification [S37].

**INFERENCE (high):** this is useful provider telemetry, not Curiosity's audit
record. It does not validate source content or detect all silent extractor
degradation.

**RECOMMENDATION (high):** independently monitor expected source coverage,
schema validity, duplicate rate, evidence hashes, partial results, freshness,
per-origin load, and cost. Provider success is one signal, not the quality gate.

## 7. Provenance, retention, and evidence quality

### 7.1 Provenance that exists

**FACT (high):** the run contract exposes stable run ID, Actor/task ID, exact
build ID and number, origin, schedule ID/time, start/finish times, options,
resource statistics, lifecycle counters, exit code, default storage IDs, and
usage/cost. Build tags captured in Actor environment are frozen at run start
even if tags later move [S2, S5, S16].

**FACT (high):** queue requests can carry a URL, method, payload, headers,
loaded URL, retry count, handled time, and error messages. Dataset schemas can
validate output shape; KVS can preserve raw HTML, screenshots, PDFs, or other
bytes [S8-S10, S17].

**INFERENCE (high):** these fields can establish *which hosted computation ran*
and where its artifacts were written. They are valuable operational lineage.

### 7.2 Provenance that is absent or Actor-defined

**UNKNOWN / negative result (high confidence):** the generic platform does not
document automatic capture of:

- source robots/terms/policy decision and decision version;
- DNS/IP/redirect/TLS/request/response trace;
- destination response status, headers, content type, and observed time;
- raw-byte, normalized-document, screenshot, or passage hashes;
- browser/driver/OS image digest, viewport, locale, timezone, or proxy exit;
- extractor/parser/model version and field-to-passage lineage;
- canonicalization rationale, publication-time source, or freshness status;
- per-row run/build ID and operation idempotency key; or
- cryptographic binding between dataset values and KVS source artifacts.

Individual Actors may add some fields, but the Actor abstraction does not
guarantee them [S4-S10, S18].

**RECOMMENDATION (high):** Curiosity's evidence lane—not an Actor's output
schema—must create the authoritative capture manifest and citation objects.
Treat all Apify output, logs, schemas, URLs, HTML, filenames, screenshots, and
status text as `untrusted_external_data`.

### 7.3 Retention contradictions

**FACT (high):** current storage overview says named stores are retained
indefinitely; unnamed storage and runs beyond recent-run exceptions follow plan
retention. It says the Free plan's 10 most recent runs persist four months,
while paid-plan data follows a configurable billing retention period [S11].

**CONTRADICTION:** individual dataset, KVS, and queue pages say named stores are
indefinite and unnamed stores expire after seven days “unless otherwise
specified” [S8-S10]. The run page says the ten most recent runs are retained
indefinitely, while the storage overview says four months on Free and the paid
plan retention period on paid plans [S2, S11]. These claims cannot all be used
as one precise retention guarantee.

**FACT (high):** the general privacy policy gives purpose-based, non-numeric
retention for controller data and notes backup isolation before eventual
deletion. The DPA says processor data follows standard retention policies and
can be returned or destroyed on written request/termination, subject to law;
it does not resolve product backup expiry or the documentation conflict [S20,
S21].

**RECOMMENDATION (high):** before any sensitive or production use, obtain a
written retention matrix for run metadata, input, logs, each storage type,
deleted records, named stores, backups, webhook payloads, support copies, and
Usage Data. Curiosity must export authorized evidence promptly and apply its own
retention/deletion; naming an Apify store is not an archival policy.

## 8. Safety, privacy, and security

### 8.1 Actor trust and permissions

**FACT (high):** Actors run under the caller's account with an injected API
token. Limited permission is the default; it can access its own/default and
created storages, explicitly granted storage, prior-run storages, basic user
information and proxy password, and can run other limited Actors. Full
permission provides all account data. First use of a third-party full-
permission Actor requires Console approval unless the user disables that safety
check; an approved full-permission Actor can invoke other full-permission Actors
without separate approval [S16, S19].

**FACT (high):** Actor Terms say Community Actors are not vetted, endorsed, or
monitored for quality, security, accuracy, or legal compliance; creators may
have access to Actor input/output; and creators are not Apify subprocessors.
Apify-maintained Actors have different terms and a limited conformance warranty
[S23].

**MATERIAL DOCUMENTATION/TERMS TENSION:** Actor Terms broadly say Community
Actor creators have access to and control over Actor Inputs and may access
outputs [S23 §§4, 9]. The resource-access guide separately describes automatic
sharing of full run input/logs/storages with public Actor creators as opt-in,
except when a user attaches a run to an issue [S38]. Public sources do not make
clear whether “creator access” means code-level processing, personnel access,
separate creator infrastructure, explicit run sharing, or all of these.

**RECOMMENDATION (high):** reject Community Actors for sensitive Curiosity
work until each Actor's owner, source availability, permissions, external
endpoints, data practices, code/version, pricing, and target rights are reviewed.
Prefer Curiosity-owned limited-permission Actors in a dedicated organization
with restricted resource access, no unrelated data, no long-lived credentials,
and no full-permission approval.

### 8.2 Resource sharing and secrets

**FACT (high):** current general resource access defaults to `Restricted`, but
runs, builds, and stores can be changed to “anyone with ID can read.” ID-based
sharing has no revocation, audit trail, or fine-grained control. Restricted
dataset/KVS links can use signed URLs; automatically generated links last 14
days, while some manually generated and single-record KVS URLs can be permanent
[S38].

**DOCUMENTATION CONTRADICTION:** storage/API pages still say GET by a hard-to-
guess ID needs no token and treats the ID as an authentication key [S11], while
the newer access-control page says `Restricted` is default and requires a token
[S38]. Curiosity should assume restricted access is available but verify every
resource and generated link.

**RECOMMENDATION (high):** hard-to-guess IDs and permanent signed URLs are
bearer secrets, not authorization. Enforce restricted access, short-lived
signed URLs only when unavoidable, secret scanning/redaction, least-privilege
scoped tokens, separate dev/prod organizations, and access tests after every
Actor/build change.

### 8.3 Privacy and contractual controls

**FACT (high):** Apify acts as processor for customer-directed personal data
under its DPA and as controller for account, abuse, analytics, and Usage Data.
Usage Data is contractually broad and may derive from Actor inputs, outputs,
Customer Data, and usage patterns. Apify claims encryption in transit/at rest,
access controls, assessments, incident procedures, and notification of known
processor-data incidents within 72 hours [S20-S22].

**FACT (high):** the DPA authorizes international processing including the US,
lists subprocessors through the Trust Center with 10 days' change notice, and
excludes many high-regulation/sensitive categories unless separately agreed.
The general privacy policy says processing occurs primarily in the EU and US
and may occur elsewhere [S20, S21].

**UNKNOWN:** public materials reviewed here do not establish Curiosity-specific
data residency, backup deletion latency, tenant/container/kernel isolation,
customer-managed encryption keys, private networking, egress allowlists,
Community Actor subprocessors, or whether all relevant plan tiers include the
same assurance reports. The DPA allows requesting security reports but those
were not publicly inspected [S21].

**RECOMMENDATION (high):** no sensitive, personal, embargoed, credentialed, or
regulated workload before approved DPA/order, subprocessor and region review,
data classification, deletion test, assurance-report review, and threat model.

### 8.4 Retrieval safety and source rights

**FACT (high):** the Acceptable Use Policy prohibits illegal activity, undue
server burden, fraud, artificial interaction, and third-party-rights violations.
General terms make the customer responsible for authorization, legality, and
rights in Customer Data and require indemnification for unauthorized extraction
[S22, S39].

**UNKNOWN / negative result:** no generic platform promise was found that every
Actor honors robots.txt, target terms, copyright/database rights, per-origin
politeness, do-not-crawl requests, or deletion requests. Proxy and Crawlee
materials emphasize avoiding blocking; technical access is not legal authority
[S14, S30-S32].

**RECOMMENDATION (high):** Curiosity must perform policy/rights decisions before
submission and recheck redirects/subresources during retrieval. An Apify Actor
or proxy must never decide its own authority, expand scope, or turn a denial
into a retry/identity-rotation strategy.

## 9. Limits, pricing, and cost model

### 9.1 Current published plans and limits

**FACT (high):** public monthly plans accessed were Free $0 with $5 included
usage, Starter $29 with $29, Scale $199 with $199, and Business $999 with $999.
Annual-billing equivalents were $0/$26/$179/$899. CU price was $0.20 on
Free/Starter, $0.16 on Scale, and $0.13 on Business; one CU is 1 GB RAM for one
hour [S40].

**FACT (high):** documented plan limits include 25/32/128/256 concurrent Actor
runs and 16/64/256/512 GB combined running memory for Free/Starter/Scale/
Business. Per-run memory is at least 128 MB; current tables show 16 GB maximum
on Free and up to 32 GB on paid plans, while the pricing summary uses plan
“Max RAM” values that appear to describe combined capacity. Maximums also
include 500 Actors, 5,000 tasks, 100 schedules, 100 webhooks, 10 metamorphs per
run, 10,485,760 log characters, 30-minute build timeout, and disk at twice run
memory [S40, S41].

**FACT (high):** global API rate limit is 250,000 requests/minute per user or
unauthenticated IP. Default per-resource limit is 60/second; run Actor/task,
dataset push, queue request CRUD, and several related operations permit
400/second; KVS record CRUD permits 200/second. Limits are returned in response
headers and may change [S29].

### 9.2 Cost composition and controls

**FACT (high):** platform usage combines compute units, internal/external data
transfer, storage bytes/operations, residential-proxy GB, SERP requests, and
possibly Store Actor charges. Proxy list prices were $7-$8/GB residential,
plan-dependent datacenter IP bundles/overages, and $1.70-$2.50 per 1,000 SERPs
[S31, S40].

**FACT (high):** Store Actors may charge pay per event, pay per platform usage,
or legacy monthly rental; rental is scheduled to end 2026-10-01. Pay-per-event
may or may not include platform usage. `maxTotalChargeUsd` caps the run charge;
usage limits can suspend service, and paid accounts can opt into overage.
Unused prepaid usage expires monthly [S5, S42, S43].

**INFERENCE (high):** useful-work cost is not “one Actor call.” It is roughly:

```text
container memory × duration
+ storage bytes × retention
+ storage reads/writes/lists
+ internal and external transfer
+ residential traffic / SERP requests / datacenter IPs
+ Actor-defined event or legacy rental charges
+ retries, restarts, migrations, resurrection and duplicate submissions
```

Browser reuse, high memory, raw artifacts, long retention, and post-run dataset
reads all affect spend. A cost cap does not cap URLs, bytes, runtime side
effects, or output cardinality.

**RECOMMENDATION (high):** enforce Curiosity-side hard admission budgets for
cost, URLs, bytes, browsers, duration, retries, and result count; set
`maxTotalChargeUsd`; pin Store pricing/build; disable overage by default; and
reconcile final cost after the documented ~10-second stabilization window for
run statistics [S5, S6]. No production budget should use marketing estimates
without a separately authorized representative trial.

## 10. Architectural clues and clean-room lessons

### 10.1 Bounded inferences

The following are **INFERENCES**, not reverse-engineered implementation claims:

1. **Durable control plane and ephemeral data plane (high).** Stable run/build
   records and remote stores survive worker migration, while process memory and
   disk do not [S2, S15].
2. **Independent storage backends (medium-high).** KVS is explicitly S3-backed;
   dataset append/export and queue dedupe/lease semantics imply purpose-built
   services rather than container-local files [S8-S11]. Exact dataset/queue
   databases remain unknown.
3. **Lease-based distributed frontier (high).** client/run-owned expiring locks
   and partial batch acknowledgements support at-least-once distributed work
   [S10, S12].
4. **Metering in the control/storage/proxy planes (high).** run objects report
   compute, storage, transfer, proxy, event, and USD dimensions separately [S5].
5. **Two trust planes (high).** hosted execution injects caller-scoped tokens
   and proxy access into creator code; marketplace governance and runtime token
   scope are therefore as important as container isolation [S16, S19, S23].
6. **Schema-as-link-manifest (high).** output schema advertises result locations,
   while dataset/KVS schemas describe stored data. It is not a transactional
   output commit [S4, S17, S18].

### 10.2 Hosted versus open source

| Component | Public boundary | License/terms conclusion |
| --- | --- | --- |
| Apify Platform control plane, scheduler, hosted stores, workers, billing, Store, Proxy | Remote hosted service | Proprietary under General Terms; no right to clone/reverse engineer [S22]. |
| Apify-maintained Actors | Hosted Actor products | Proprietary/revocable service license unless an Actor separately exposes OSS [S23]. |
| Community Actors | Creator-specific | License and terms vary; source may be hidden; no blanket OSS assumption [S23]. |
| Crawlee JS | Runs locally or on any cloud | Apache-2.0 official repository [S25]. |
| Apify SDK JS/Python | Actor lifecycle/platform integration | Apache-2.0 official repositories/package metadata [S26, S28]. |
| Apify API clients | Hosted API adapters | Apache-2.0 official repositories [S27, S28]. |
| `proxy-chain` | Local proxy utility used by Apify Proxy | Apache-2.0 repository license; not the hosted proxy network [S30, S44]. |
| Actor whitepaper/model | Public design document | Aspirational open standard; explicitly not yet an official backend specification [S24]. |

**RECOMMENDATION (high):** independently implement only Curiosity's own neutral
contracts. If using Apache-2.0 packages, preserve license/NOTICE and modification
notices, inventory transitive dependencies, and keep provider translation in an
adapter. Do not copy Apify docs, schemas, Store Actor source, proprietary
orchestration, anti-blocking tactics, branding, or hidden behavior. This report
is not legal advice.

## 11. Exact Curiosity implications

### ADOPT

1. **ADOPT — Definition/template/attempt separation.** Executable identity,
   reusable configuration, and immutable execution attempt are different
   resources.
2. **ADOPT — Durable async lifecycle.** Stable job and attempt IDs, explicit
   initial/transitional/terminal states, polling, abort, and callback hints.
3. **ADOPT — Exact executable identity.** Record image digest/build ID and
   schema/adapter versions, never only `latest`.
4. **ADOPT — Purpose-specific stores.** Frontier, append-only structured
   results, and binary/checkpoint artifacts have distinct semantics.
5. **ADOPT — Lease + partial-ack frontier.** Deduplicate admissions, lease work,
   acknowledge processed/unprocessed batches, and expect redelivery.
6. **ADOPT — Migration-aware checkpoints.** Ephemeral workers persist state and
   commit outputs idempotently.
7. **ADOPT — Resource and cost telemetry.** Attribute CPU, memory, time, bytes,
   storage operations, proxy use, retries, and actual spend per attempt.

### ADAPT

1. **ADAPT — Output schema.** Use a typed immutable artifact manifest, not a map
   of potentially mutable URLs generated before results exist.
2. **ADAPT — Run states.** Add `admission_rejected`, `policy_blocked`,
   `capacity_timeout`, `partial`, `evidence_invalid`, and `cost_exhausted`.
3. **ADAPT — Tasks.** Resolve and hash the entire effective configuration at
   submission; do not rely on mutable template defaults.
4. **ADAPT — Autoscaling.** Resource sensing may reduce concurrency, but
   per-origin policy and fixed global budgets remain hard upper bounds.
5. **ADAPT — BrowserPool/SessionPool.** Pool only within a trust domain; make
   fresh context/process and credential isolation explicit capabilities.
6. **ADAPT — Schedules.** Separate desired time from dispatch/start/capture and
   define overlap, missed-run, catch-up, jitter, and DST policy.
7. **ADAPT — Webhooks.** Treat as duplicate/out-of-order hints; require signed
   or strongly authenticated, replay-protected ingestion.
8. **ADAPT — Provider output validation.** Schema validation is necessary but
   must be supplemented by byte/type limits, provenance, content sanitization,
   and evidence verification.

### REJECT

1. **REJECT — Apify resources as Curiosity's core ABI.** No provider IDs, Store
   pricing names, storage URLs, proxy groups, or run states in neutral contracts.
2. **REJECT — `SUCCEEDED` as evidence validity.** It means the Actor process
   completed successfully, not that crawling was authorized, complete, fresh,
   accurate, or reproducible.
3. **REJECT — `maxItems` as output bound.** It is a billing control with an
   explicit non-guarantee on returned count.
4. **REJECT — hard-to-guess IDs/permanent URLs as authorization.** Use explicit
   restricted access and expiring grants.
5. **REJECT — Community Actor trust by Store presence/badge.** Require specific
   due diligence or do not run it.
6. **REJECT — proxy rotation as retry policy.** Access denial cannot silently
   become identity rotation.
7. **REJECT — Apify retention as evidence archive.** Curiosity owns authorized
   immutable captures, retention, legal hold, and deletion.
8. **REJECT — platform/runtime auto-scaling as crawl politeness.** Resource
   availability and target permission are unrelated.

### DEFER

1. **DEFER — hosted adapter pilot** until contract, DPA, security, residency,
   retention, deletion, and source-rights gates pass.
2. **DEFER — Community Actors** until each Actor and creator is separately
   reviewed; default disposition is no sensitive inputs.
3. **DEFER — residential/SERP proxies** until legal need, target permission,
   geography provenance, and abuse controls are approved.
4. **DEFER — multi-run shared-queue crawl** until contradictory concurrency
   documentation is resolved and at-least-once behavior is tested.
5. **DEFER — full distributed browser fleet on Apify** until representative
   cost, isolation, failure, and evidence benchmarks are separately authorized.

### Proposed neutral execution boundary

If a later Apify pilot is authorized, Curiosity should submit only:

- logical job ID, unique attempt/submission ID, executor capability and pinned
  executable digest;
- authorized URL scope and explicit redirect/subresource policy;
- hard deadline, URL/result/byte/retry/browser/concurrency/cost ceilings;
- requested acquisition mode and locale/egress intent;
- output/evidence schema version and callback correlation ID; and
- opaque provider configuration in the adapter, never exposed to callers.

The adapter should return:

- Curiosity job/attempt ID plus namespaced provider run/build/storage IDs;
- requested, effective, started, finished, and capture times;
- normalized state and sanitized provider state;
- exact executable/runtime manifest and policy-decision references;
- item/artifact manifests with hashes, sizes, MIME types, source identity,
  capture method, partial/error state, and retention deadline;
- actual usage/cost and cap-exhaustion reasons; and
- trust marker `untrusted_external_execution_output`.

No API/proxy token, raw signed URL, container URL, arbitrary active HTML,
webhook secret, or provider permission handle may cross the adapter boundary.

## 12. Validation gates before any adoption

| Gate | Pass condition |
| --- | --- |
| Contract | Written rights for intended Actor/API use, output retention, internal redistribution, cancellation, pricing changes, SLA/remedies, and termination export. |
| Actor trust | Curiosity-owned or specifically approved Actor; exact build pinned; limited permissions; source/dependencies scanned; no undisclosed external endpoint or creator access. |
| Privacy | Executed DPA/order; approved subprocessors and regions; Usage Data scope understood; retention/backups/deletion documented and tested. |
| Isolation | No cross-run/tenant cookies, files, logs, storage, tokens, processes, or network reach; worker cleanup verified after crash/migration/timeout. |
| Egress/SSRF | Direct, redirect, DNS-rebinding, alternate-IP, browser subresource, popup, service-worker, and proxy paths cannot reach denied destinations. |
| Idempotency | Ambiguous create, webhook duplicate, migration, lock expiry, restart, and resurrection cannot duplicate committed evidence or uncontrolled charges. |
| Bounds | URLs, bytes, redirects, requests/origin, browsers, contexts, CPU, memory, disk, logs, output rows, retries, wall time, and USD all fail closed. |
| Provenance | Exact build/image/browser/extractor, policy, request/response/capture times, redirects, content hashes, artifact relationships, and partial state are preserved. |
| Webhook | Authenticated without URL secret; replay/duplicate resistant; body bounded; callback grants no execution authority. |
| Retention | Run/input/log/dataset/KVS/queue/webhook/backup deletion matrix matches Curiosity policy and deletion is evidenced. |
| Quality | Representative authorized corpus meets completeness, extraction, variance, freshness, and silent-failure thresholds. |
| License | Every Apify/Crawlee/client/browser/driver/base-image dependency and Store Actor term is recorded separately. |

## 13. Unknowns and negative results

1. No public generic guarantee of robots.txt, target-terms, copyright/database-
   rights, per-origin politeness, or deletion-policy enforcement was found.
2. No run-create idempotency key was found in the current public run endpoint or
   OpenAPI parameters.
3. No generic platform capture hash, request/response trace, parser version, or
   claim/passage provenance contract was found.
4. No exact product-wide retention answer reconciles seven-day unnamed stores,
   plan-configured retention, four-month Free recent runs, and “ten latest runs
   indefinitely.”
5. No public material reviewed established hard container/kernel/tenant/browser
   isolation or a Curiosity-suitable egress sandbox.
6. No public answer reconciled broad Creator access language in Actor Terms with
   opt-in creator run-sharing documentation.
7. No public webhook signature scheme was found; documented controls are secret
   URL/header, dispatch ID, and source IP allowlisting.
8. No exact backend topology for datasets, queues, scheduler, worker placement,
   or regional replication was disclosed; only KVS's S3 basis is explicit.
9. No proof was found that an Actor's schema-generated output links are
   transactionally committed with the artifacts they reference.
10. No independent quality, availability, isolation, or price-performance test
    was performed; documentation and terms disclaim broad guarantees.
11. No basis was found to treat Community Actor source, creator infrastructure,
    dependencies, permissions, terms, or data handling as uniform.
12. No account was used, so restricted-resource behavior, signed-link expiry,
    cost-cap termination, schedule overlap, migration, and queue redelivery were
    not empirically verified.

## 14. Bounded curiosity pass

Scoring is 1 (low) to 5 (high); cost is investigation cost, where 1 is cheap.
The pass remained inside the declared frame and caller authority.

| Thread | R | V | N | C | Decision and result |
| --- | ---: | ---: | ---: | ---: | --- |
| Run idempotency and duplicate-work semantics | 5 | 5 | 4 | 1 | **Pursued:** current run parameters/OpenAPI have no create idempotency key; migration, lock expiry, restart, resurrection, and webhook duplication support at-least-once treatment [S2, S5, S10, S15, S36]. |
| Retention claims across run/storage/legal docs | 5 | 5 | 4 | 1 | **Pursued:** material seven-day/plan/four-month/indefinite contradictions retained; procurement gate added [S2, S8-S11, S20, S21]. |
| Community Actor creator access versus restricted sharing | 5 | 5 | 5 | 1 | **Pursued:** legal terms and resource-sharing docs do not cleanly reconcile; Community Actors deferred [S23, S38]. |
| Shared request queue across multiple runs | 4 | 4 | 4 | 1 | **Pursued:** overview says single processor while queue locking guide documents multi-run distribution; contradiction retained [S10, S11]. |
| Hosted versus OSS boundary | 5 | 5 | 3 | 1 | **Pursued:** Platform/maintained Actors are contractual services; Crawlee/SDKs/clients are Apache-2.0 and separately usable [S22-S28]. |
| Empirically test migration, duplicate submission, locks, or cost caps | 5 | 5 | 4 | 5 | **CURIOSITY_NO_GO:** requires account/credentials, billable execution, and an approved test plan. |
| Inspect hidden platform implementation or Community Actor private source | 1 | 1 | 4 | 5 | **CURIOSITY_NO_GO:** outside clean-room and license/access boundaries; public contracts reached the decision. |
| Reproduce fingerprinting, CAPTCHA, or proxy evasion behavior | 2 | 1 | 4 | 5 | **CURIOSITY_NO_GO:** bypass-oriented, unnecessary, and contrary to Curiosity's policy boundary. |
| Give jurisdiction-specific scraping legality opinion | 5 | 5 | 4 | 5 | **CURIOSITY_NO_GO:** requires counsel and target/use-case facts not in frame. |
| Benchmark Store Actor quality and cost | 4 | 4 | 3 | 5 | **CURIOSITY_NO_GO:** paid/credentialed tests prohibited; each Actor is a separate product. |
| Obtain nonpublic SOC reports or penetration tests | 4 | 4 | 2 | 4 | **CURIOSITY_NO_GO:** procurement diligence, not public research; DPA provides a request path [S21]. |

**Coverage stop:** every requested category has primary-source facts,
inferences, Curiosity implications, confidence, and explicit unknowns.  
**Saturation stop:** additional high-level pages repeated the same Actor,
storage, proxy, and billing model without changing the verdict.  
**Exhaustion stop:** remaining decision-critical facts require a negotiated
contract, assurance documents, account-level configuration, counsel, or an
authorized runtime trial.

## 15. Primary-source ledger

All sources are official primary sources and were accessed 2026-08-17.

1. **[S1] Apify, Actors overview.** https://docs.apify.com/actors.md
2. **[S2] Apify, Runs and builds.**
   https://docs.apify.com/actors/running/runs-and-builds.md
3. **[S3] Apify, Actor tasks.**
   https://docs.apify.com/actors/running/tasks.md
4. **[S4] Apify, Actor input and output.**
   https://docs.apify.com/actors/running/input-and-output.md
5. **[S5] Apify API, Run Actor / Run task.**
   https://docs.apify.com/api/v2/actors-runs-post.md  
   https://docs.apify.com/api/v2/actor-task-runs-post.md
6. **[S6] Apify API, Get run.**
   https://docs.apify.com/api/v2/actor-run-get.md
7. **[S7] Apify API, synchronous Actor run.**
   https://docs.apify.com/api/v2/actor-run-sync-post.md
8. **[S8] Apify, Dataset.** https://docs.apify.com/storage/dataset.md
9. **[S9] Apify, Key-value store.**
   https://docs.apify.com/storage/key-value-store.md
10. **[S10] Apify, Request queue.**
    https://docs.apify.com/storage/request-queue.md
11. **[S11] Apify, Storage overview and retention.**
    https://docs.apify.com/storage.md
12. **[S12] Apify API, batch-add queue requests / queue head.**
    https://docs.apify.com/api/v2/request-queue-requests-batch-post.md  
    https://docs.apify.com/api/v2/request-queue-head-get.md
13. **[S13] Crawlee, BrowserPool API.**
    https://crawlee.dev/js/api/browser-pool/class/BrowserPool
14. **[S14] Crawlee, Session management.**
    https://crawlee.dev/js/docs/guides/session-management
15. **[S15] Apify, Actor state persistence and migration.**
    https://docs.apify.com/actors/development/builds-and-runs/state-persistence.md
16. **[S16] Apify, Actor environment variables.**
    https://docs.apify.com/actors/development/programming-interface/environment-variables.md
17. **[S17] Apify, Dataset schema validation.**
    https://docs.apify.com/storage/dataset-schema/validation.md
18. **[S18] Apify, Actor output schema.**
    https://docs.apify.com/actors/development/actor-definition/output-schema.md
19. **[S19] Apify, Actor permissions (user and developer views).**
    https://docs.apify.com/actors/running/permissions.md  
    https://docs.apify.com/actors/development/permissions.md
20. **[S20] Apify Privacy Policy, updated 2026-07-09.**
    https://docs.apify.com/legal/privacy-policy.md
21. **[S21] Apify Data Processing Addendum, updated 2026-07-08.**
    https://docs.apify.com/legal/data-processing-addendum.md
22. **[S22] Apify General Terms and Conditions, effective 2026-07-09.**
    https://docs.apify.com/legal/general-terms-and-conditions.md
23. **[S23] Apify Actor Terms and Conditions, effective 2026-07-09.**
    https://docs.apify.com/legal/actor-terms-and-conditions.md
24. **[S24] Apify, Web Actor Programming Model Whitepaper v0.999,
    February 2025.** https://whitepaper.actor/
25. **[S25] Apify Crawlee official repository, README, package metadata, and
    Apache-2.0 license.**  
    https://github.com/apify/crawlee  
    https://raw.githubusercontent.com/apify/crawlee/master/package.json  
    https://raw.githubusercontent.com/apify/crawlee/master/LICENSE.md
26. **[S26] Apify SDK for JavaScript official repository and package metadata.**
    https://github.com/apify/apify-sdk-js  
    https://raw.githubusercontent.com/apify/apify-sdk-js/master/package.json
27. **[S27] Apify API client for JavaScript official repository and license.**
    https://github.com/apify/apify-client-js  
    https://raw.githubusercontent.com/apify/apify-client-js/master/LICENSE
28. **[S28] Apify SDK for Python repository license.**
    https://raw.githubusercontent.com/apify/apify-sdk-python/master/LICENSE
29. **[S29] Apify API v2 and versioned OpenAPI, version displayed
    `v2-2026-08-14T072928Z`.**  
    https://docs.apify.com/api/v2.md  
    https://docs.apify.com/api/openapi.json
30. **[S30] Apify Proxy overview.** https://docs.apify.com/proxy.md
31. **[S31] Apify, Actor usage and resources.**
    https://docs.apify.com/actors/running/usage-and-resources.md
32. **[S32] Crawlee, AutoscaledPool and scaling crawlers.**  
    https://crawlee.dev/js/api/core/class/AutoscaledPool  
    https://crawlee.dev/js/docs/guides/scaling-crawlers
33. **[S33] Apify, Schedules.**
    https://docs.apify.com/actors/running/schedules.md
34. **[S34] Apify, Webhook integration.**
    https://docs.apify.com/integrations/webhooks.md
35. **[S35] Apify, Webhook events.**
    https://docs.apify.com/integrations/webhooks/events.md
36. **[S36] Apify, Webhook actions, retry, and security guidance.**
    https://docs.apify.com/integrations/webhooks/actions.md
37. **[S37] Apify, Actor monitoring.**
    https://docs.apify.com/actors/running/monitoring.md
38. **[S38] Apify, General resource access and signed URLs.**
    https://docs.apify.com/account/collaboration/general-resource-access.md
39. **[S39] Apify Acceptable Use Policy, updated 2026-02-20.**
    https://docs.apify.com/legal/acceptable-use-policy.md
40. **[S40] Apify Pricing.** https://apify.com/pricing
41. **[S41] Apify, Account limits.**
    https://docs.apify.com/account/limits.md
42. **[S42] Apify, Actors in Store and pricing models.**
    https://docs.apify.com/actors/running/actors-in-store.md
43. **[S43] Apify, Billing and usage limits.**
    https://docs.apify.com/account/billing.md
44. **[S44] Apify `proxy-chain` official repository license.**
    https://raw.githubusercontent.com/apify/proxy-chain/master/LICENSE

## 16. Confidence summary

| Area | Confidence | Basis |
| --- | --- | --- |
| Actor/task/build/run contracts | High | Current versioned API plus platform docs agree on core lifecycle and identifiers. |
| Storage primitives | High | Product and endpoint docs are explicit; retention and shared-processing details conflict. |
| Browser/proxy/autoscaling behavior | High for public Crawlee/Proxy contracts; medium for hosted topology | Official APIs are explicit, but worker/browser isolation and provider internals are undisclosed. |
| Provenance gaps | High | Generic schemas enumerate rich operational metadata but omit evidence fields. |
| Privacy/security posture | Medium | Current legal controls are explicit; assurance effectiveness, residency, isolation, and deletion require diligence. |
| Pricing and plan limits | High as of access date | Current pricing and limits pages; Store Actor charges remain Actor-specific. |
| Hosted-versus-OSS boundary | High | Terms and official repository licenses are explicit. |
| Production fitness for Curiosity | Medium-low | No authorized runtime, legal, security, retention, or quality validation was performed. |
