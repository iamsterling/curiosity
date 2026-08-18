# Linkup Tasks: clean-room batch/job contract study

**Research and source-access date:** 2026-08-17  
**Scope:** Linkup **Tasks** (`/v1/tasks`) only. Search, Fetch, Research, and
Extract are considered solely as child-call payloads. In particular, this note
does not treat the separate Research agent as Tasks behavior.  
**Status:** research and recommendations only—not implementation, a benchmark,
legal advice, or a production/provider decision.

## Decision frame and method

**Decision.** Which externally visible Linkup Tasks patterns should Curiosity
adopt, adapt, reject, or defer for bounded asynchronous work?

Bounded sub-questions:

1. What is the submission, item, state, listing, and result-retention contract?
2. Does Tasks plan, sequence, or invoke tools, or only transport independent
   endpoint calls?
3. Which concurrency, polling, work, time, output, and spend bounds are visible?
4. What evidence, errors, retries, webhooks, privacy, and safety properties does
   the wrapper add or lose?
5. What is the least-assumptive architecture consistent with that contract, and
   what should Curiosity learn from it?

Only public first-party Linkup documentation, the rendered OpenAPI contract,
changelog, pricing/error/security pages, and documentation index were read. No
account, credential, free or paid API call, SDK/package inspection, traffic
capture, hidden endpoint, access-control bypass, or proprietary implementation
inspection was used. Sources are mutable vendor contracts, not independently
tested behavior. All sources in the ledger were accessed 2026-08-17.

Labels used below:

- **FACT** — directly documented by a cited primary source.
- **INFERENCE** — bounded interpretation consistent with the public contract,
  not a claim about private implementation.
- **RECOMMENDATION** — a Curiosity design consequence.
- **UNKNOWN** — not established by the reviewed official sources.

## Executive verdict

**ADAPT the item envelope and independent-failure model; REJECT Tasks as a
Curiosity planner or durable job system (high confidence).** Tasks is a thin,
organization-scoped asynchronous fan-out and result-store projection:

```text
1..100 endpoint-native {type,input} items
  -> one independent task ID/state/output/error per item
  -> parallel, unordered execution
  -> poll one item or page/filter/sort the organization's items
```

It is not a research method, plan, dependency graph, transaction, workflow ID,
tool protocol, event stream, webhook service, or durable archive. Submission
order does not constrain execution; dependent Search -> Fetch work requires a
second caller-created batch. It adds transport state and timestamps but no
evidence lineage beyond the selected child endpoint's native output. [S1-S6]

The strongest transferable features are a discriminated child-call union,
one durable-looking envelope per item, independent terminal outcomes,
organization concurrency telemetry, paginated bulk polling, and predictable
per-item billing for fixed-price child calls. The largest gaps are no client
idempotency key, batch ID, cancellation, deadline, webhook, event cursor,
partial-progress model, typed terminal error, exact retention period, or
caller-supplied aggregate spend/work bound. [S3-S5]

## 1. Product boundary: Tasks is not Research

| Property | Tasks | Separate Research endpoint |
|---|---|---|
| Primary role | Batch/async transport for child calls | Autonomous multi-source investigation |
| Planning | None documented at wrapper level | Native Research agent plans internally |
| Input | Array of typed endpoint requests | One research question and research controls |
| Output | One endpoint-native result per task | One report/structured result |
| Coordination | Independent parallel items | Provider-owned investigation loop |
| Pricing | Sum of successful child calls | Price selected by reasoning depth |

**FACT (high):** Linkup repeatedly calls Tasks an “asynchronous batch wrapper.”
It says Tasks does not make individual calls cheaper or faster and recommends
direct endpoints for interactive single calls. End-to-end latency is identical
or slightly higher because polling adds overhead. [S1][S2]

**FACT (high):** a batch may mix Search, Fetch, and Research. Current OpenAPI
also discriminates an `extract` child type, while overview, best-practices,
agent guide, introduction, and launch changelog describe only the first three.
The pricing page says Tasks may bill an Extract call. Therefore Extract-in-Tasks
is a **material first-party contract contradiction**, not a stable capability.
[S1-S4][S6-S8]

**VERDICT:** treat Search/Fetch/Research as documented Tasks types and **DEFER**
Extract-in-Tasks until Linkup confirms availability, beta access behavior,
price admission, and response stability.

## 2. Submission and item contract

### 2.1 Create

**FACT (high):** `POST /v1/tasks` accepts a bare JSON array with `minItems: 1`
and `maxItems: 100`. Every element is a discriminated `{type,input}` object.
The input schema and eventual output schema are those of the selected child
endpoint. On success, HTTP 200 immediately returns an array of task envelopes,
normally `pending` with `output: null`, one per submitted item. [S1][S3]

The common envelope is:

```text
id, type, status, createdAt, updatedAt, input, output|null, error|null
```

The response does **not** expose a batch/run ID, caller metadata, idempotency
key, ordinal, parent ID, dependency, priority, deadline, callback, or aggregate
cost estimate. [S3]

**INFERENCE (high):** “batch” is submission convenience, not a first-class
resource. Because only child IDs return, the caller must persist its own cohort
ID and item ordinal to reconstruct a batch later.

**UNKNOWN:** whether create validation is all-or-nothing, whether a server error
can create only some items, whether response order always matches request order,
and how credit/concurrency admission behaves when only part of a 100-item request
can fit. No atomicity or rollback guarantee was found.

### 2.2 Child inputs are passed through, not composed

**FACT (high):** each task accepts the corresponding endpoint's native fields.
Examples include Search depth/output/source filters, Fetch URL/rendering mode,
and Research mode/reasoning depth. The wrapper offers no shared source policy,
budget, schema, or safety field across the array. [S1][S3]

**RECOMMENDATION (high):** Curiosity should use a provider-neutral child-command
union but attach common policy and budget fields itself. Provider-native payloads
belong only in an adapter extension, not the core contract.

## 3. Lifecycle, listing, and retention

### 3.1 State machine

The documented state vocabulary is:

```text
pending -> processing -> completed
                      \-> failed
```

**FACT (high):** `completed` exposes the child endpoint's output; `failed`
exposes a string `error`. `createdAt` and `updatedAt` are ISO timestamps. There
are no `cancelled`, `expired`, `timed_out`, `partial`, `retrying`, or
`action_required` states. [S1][S3-S5]

**UNKNOWN:** transitions are not formally constrained. The docs do not promise
that `processing` is always observed, that `updatedAt` is monotonic, that
terminal states are immutable, or that an abandoned/expired record gains a
distinct state.

### 3.2 Read one or list many

**FACT (high):** `GET /v1/tasks/{id}` returns one item. `GET /v1/tasks` returns
an organization-wide paginated list plus metadata and a `quota` object. Listing
supports multiple `type` and `status` filters, page number, page size 1–100,
sorting by `createdAt` or `updatedAt`, and ascending/descending direction. The
default page is 1, page size 10, and direction ascending. [S4][S5]

`quota` contains:

- `inFlight`: tasks currently pending or processing for the organization;
- `limit`: maximum concurrent pending or processing tasks.

**FACT/negative result (high):** this is valuable runtime telemetry, but the
public docs publish no universal numeric `limit`; it is account/organization
data returned at runtime. [S4]

**RECOMMENDATION (high):** preserve provider quota snapshots as observations,
not Curiosity authority. Local admission should use the stricter of caller
budget, configured provider allowance, and last safely observed capacity.

### 3.3 Polling and retention

**FACT (high):** Linkup recommends:

- 1–2 seconds for mostly fast/standard Search or Fetch;
- 5 seconds, backing off to 30, for mostly Research;
- 2 seconds, backing off to 10, for mixed work;
- at most one polling request per second; faster polling is rate-limited;
- bulk list polling for large cohorts and per-item polling for earliest-result
  processing. [S2]

**FACT (high):** completed results are retrievable only for a “bounded period,”
and Linkup advises prompt durable persistence. No duration is published. Tasks
is explicitly not durable result storage. [S2]

**UNKNOWN:** exact pending/completed/failed retention, deletion schedule,
record-deletion API, pagination snapshot consistency during concurrent writes,
and behavior after expiry. A default ascending list may also surface oldest
records first unless the caller requests descending order or tracks pages.

## 4. Planning, tools, ordering, and stopping

### 4.1 No wrapper-level planner or tool loop

**FACT (high):** tasks run in parallel and submission order does not constrain
execution. A dependent Search -> Fetch chain requires waiting for Search and
submitting a second batch. The wrapper exposes no branch plan, tool call,
dependency edge, intermediate result, or merge step. [S2]

**INFERENCE (high):** any planning/retrieval loop belongs to a selected child
service (for example deep Search or Research), not to Tasks. It would be an
epistemic error to attribute Research's source exploration or stopping behavior
to the batch scheduler.

**RECOMMENDATION (high):** retain this separation. A transport queue should
execute an already-authorized plan; it must not invent follow-ups or widen scope.
Curiosity's coordinator should resolve a dependency DAG into ready items and
record why each item was authorized before dispatch.

### 4.2 Exposed bounds

| Dimension | Public Tasks bound |
|---|---|
| Items per create | 1–100 |
| Concurrent in-flight | Runtime organization `limit`, value not publicly fixed |
| List page size | 1–100 |
| Poll rate | maximum 1 request/second |
| Item price | child-call price; failed tasks not charged |
| Execution time | inherited endpoint latency; no task deadline |
| Result retention | bounded, duration unspecified |

**UNKNOWN / negative result:** no wrapper field bounds aggregate queries,
fetches, pages, bytes, tokens, tool calls, child retries, elapsed time, output
size, or dollars. There is no stop reason beyond `completed`/`failed`, and no
caller cancellation or server-side batch stop. Child fields such as Search
`maxResults` bound returned child results, not the batch or all internal work.

**RECOMMENDATION (high):** Curiosity needs admission-time `max_items`,
`max_in_flight`, `deadline`, `max_attempts`, `max_output_bytes`, and `max_cost`,
plus terminal `stop_reason` and consumed/remaining budget. A provider quota is a
capacity ceiling, not a safety budget.

## 5. Pricing and spend control

**FACT (high):** Tasks adds neither surcharge nor discount. Each successful
item is priced as the direct endpoint call; failed items are not charged. API-key
billing deducts prepaid USD credit. Credit exhaustion is represented by HTTP
429, the same status used for excess concurrency/rate. [S1][S2][S7][S9]

Current point-in-time per-item prices are:

| Child call | Price |
|---|---:|
| fast/standard Search, raw results | $0.005 |
| fast/standard Search, sourced/structured | $0.006 |
| deep Search, raw results | $0.05 |
| deep Search, sourced/structured | $0.055 |
| Fetch | $0.001–$0.01 by mode/JS |
| Research S/M/L/XL | $0.25 / $0.50 / $1.50 / $2.50 |
| Extract beta | typically $2–10, variable—not a published maximum |

For fixed-price documented types, a caller can calculate an admission estimate:
100 XL Research items imply up to $250 if all succeed; 100 deep synthesized
Search items imply $5.50. This is caller arithmetic, not a Tasks `maxCost`
guarantee. Extract makes an aggregate ceiling impossible from public pricing
because “most” $2–10 is not a cap. [S7]

**FACT/contradiction (high):** the pricing overview broadly says x402 follows
listed per-request prices, but the dedicated x402 contract enables only
`/v1/search` and `/v1/fetch`; Tasks OpenAPI requires bearer authentication.
Therefore x402 must not be assumed for Tasks. [S3][S7][S10]

**RECOMMENDATION (high):** compute worst-case fixed child spend before create,
reserve it locally, reject variable-price types without a contractual cap, and
reconcile actual charges afterward. Prepaid balance is not a per-batch guardrail.

## 6. Evidence and provenance

**FACT (high):** the wrapper returns each child endpoint's native output shape:
Search result excerpts or answer/schema output, Fetch markdown/raw/image fields,
Research answer/schema output, and—according to current OpenAPI—Extract's
expiring artifact metadata. Tasks itself adds only ID, type, state, input, and
task timestamps. [S3-S5]

Task timestamps identify queue-record creation/update, **not** page publication,
source observation, fetch, index, extraction, or citation time. The wrapper adds
no:

- batch/cohort ID or caller item key;
- source content hash/version or canonical URL;
- claim/field-to-passage edge;
- acquisition mode/freshness marker;
- planner/branch/tool lineage;
- output checksum, byte count, usage, or bill;
- provider/model/extractor version;
- evidence completeness or contradiction status.

**INFERENCE (high):** Tasks preserves endpoint-native evidence but does not
improve it. An answer source list remains generated-answer attribution, and an
echoed Fetch URL plus markdown remains mutable unversioned content. `completed`
means execution ended, not that output is correct, complete, current, or safe.

**RECOMMENDATION (high):** persist a local submission record before dispatch;
bind caller cohort/item/attempt IDs to provider IDs; hash exact input and lawful
retained output; and build claim-to-captured-passage provenance outside Tasks.
Keep provider task timestamps namespaced from evidence timestamps.

## 7. Errors, retries, and absent delivery mechanisms

### 7.1 Two error layers

**FACT (high):** create may return 400 invalid parameters, 401 authentication,
or 429 rate/credit; the general API error object is
`{statusCode,error:{code,message,details[]}}`. The list reference documents 401;
get-one documents 400/401. A terminal failed task, by contrast, carries only a
nullable **string** `error`. [S3-S5][S9]

**INFERENCE (high):** the asynchronous boundary can collapse a typed child
failure into prose. Retryability cannot safely be inferred from the terminal
string alone.

### 7.2 Retry ambiguity

**FACT (high):** Linkup advises retrying only failed items and says one failure
does not fail the others. It does not document a delay, maximum attempt count,
or retry classification for terminal task errors. [S2]

**UNKNOWN (high relevance):** there is no create idempotency key or duplicate
semantics. If the create response is lost, the caller cannot reliably know
whether work was accepted. Listing by time/input may help reconciliation but is
not a unique match when identical items exist. Automatic resubmission can create
duplicate billable work.

**RECOMMENDATION (high):** do not blindly replay an ambiguous create. Persist a
local intent before sending, reconcile returned IDs where possible, require
manual/policy resolution for ambiguous acceptance, and retry a terminal item
only when its normalized class is known retryable and aggregate attempt/time/
cost budgets remain. Every retry needs attempt lineage.

### 7.3 Webhooks, events, and cancellation

**FACT/negative result (high):** reviewed current Tasks docs and OpenAPI expose
only create, list, and get-one. They expose no webhook/callback, SSE/event stream,
event sequence/cursor, cancellation, deletion, pause, priority update, or result
acknowledgement endpoint. [S3-S5][S11]

**RECOMMENDATION (high):** polling must be bounded and jittered. A local timeout
means “caller stopped waiting; provider disposition unknown,” not cancellation.
Curiosity should define cancellation and webhook delivery in its own neutral
contract but capability-negotiate them; a Linkup adapter would report them as
unsupported rather than simulate provider cancellation.

## 8. Privacy, safety, and access boundaries

### 8.1 Async persistence versus ZDR

**FACT (high, vendor statement):** ordinary Tasks records echo inputs and retain
completed outputs for an unspecified bounded period. Separately, Linkup says ZDR
is not enabled by default and, when enabled, queries/results are never written
to persistent storage and are destroyed after delivery. [S2-S5][S12][S14]

**UNKNOWN / material compatibility gap:** public sources do not explain whether
Tasks supports ZDR, how asynchronous polling/listing can work without persistent
query/result records, whether metadata alone remains, or what happens to
in-flight tasks across temporary environments. Do not infer Tasks-ZDR
compatibility from a general security claim.

**FACT (high, vendor statement):** default processing may occur across US, EU,
Canada, and APAC based on load; guaranteed local processing is enterprise-only.
TLS 1.2+ and AES-256 at rest are stated. SSO, IP allowlisting, local processing,
and BYOC are configured/enterprise capabilities. [S12-S14]

**UNKNOWN:** Tasks-specific retention duration, backups, deletion SLA, API-key
scope granularity, organization-list visibility, audit log, subprocessors, and
whether child input/output is used for service improvement are not established
by the reviewed Tasks contract.

### 8.2 Safety amplification

**FACT (high, vendor statement):** Linkup says it filters high-risk content,
quality-scores candidates, respects `robots.txt`, does not bypass access controls,
and indexes only public content. Domain exclusion and enterprise category/domain
controls exist. Tasks exposes no wrapper-level safety policy or safety verdict;
it merely carries child parameters and outputs. [S13]

**INFERENCE (high):** parallel fan-out amplifies resource, untrusted-content,
privacy, and target-selection risk even when each child is individually valid.
A batch of Fetch URLs is also not made safe by queueing. Provider-generated
markdown, snippets, answers, schemas, errors, and URLs remain untrusted data and
may contain prompt injection or unsafe links.

**RECOMMENDATION (high):** impose aggregate host/concurrency/byte controls,
network and redirect policy, content quarantine, prompt/data separation,
credential minimization, and per-item authorization before submission. Never
allow returned text to create new tasks or gain tool authority without the
declared Curiosity follow-up gate.

## 9. Bounded architecture inference

The least-assumptive architecture consistent with the public contract is:

```text
POST array
  -> validate discriminated child inputs
  -> create independent organization-scoped task records
  -> enforce organization in-flight allowance
  -> dispatch ready records in parallel to endpoint workers
       search | fetch | research | [extract beta/uncertain]
  -> store endpoint-native output or string error
  -> update status/timestamp

GET one  -> record projection
GET list -> filtered/sorted paginated projection + in-flight quota snapshot
```

**Confidence:** high for record/worker separation and independent dispatch as a
behavioral model; medium for a shared queue/result store; low for physical
topology. The contract does not disclose broker technology, worker isolation,
delivery semantics, internal retries, scheduling fairness, deduplication,
transaction boundaries, storage engine, encryption key scope, or endpoint
co-location.

**Important non-inference:** the public surface does not justify claims of
exactly-once execution. With no idempotency key and unknown internal delivery,
Curiosity should design for at-least-once effects at its own boundary and
deduplicate outcomes using local lineage where possible.

## 10. Clean-room Curiosity decision ledger

### Adopted

1. **ADOPT — discriminated item envelopes (high).** Each item has a capability
   type, typed input/output, stable provider ID, timestamps, state, and error.
2. **ADOPT — independent outcomes (high).** One failed item must not erase
   completed siblings; surface partial cohort completion explicitly.
3. **ADOPT — bulk status projection (high).** Filtered, paginated cohort polling
   is more efficient than one loop per item.
4. **ADOPT — visible in-flight telemetry (high).** Preserve observed usage and
   limit separately from local policy.
5. **ADOPT — transport/planner separation (high).** The queue executes approved
   child work; orchestration owns dependencies and authority.

### Adapted

1. **ADAPT — submission array into a first-class cohort (high).** Add local
   `cohort_id`, item ordinal/key, dependency IDs, policy digest, and aggregate
   budget; never rely on response position alone.
2. **ADAPT — four states into a richer lifecycle (high).** Neutral states should
   cover queued/running/succeeded/failed/cancelling/cancelled/expired/partial,
   while preserving raw provider state.
3. **ADAPT — polling into bounded reconciliation (high).** Add deadline, jitter,
   poll count, last-observed time, expiry, and unknown-provider-disposition.
4. **ADAPT — endpoint output into evidence-bearing artifacts (high).** Add
   hashes, byte limits, acquisition/version metadata, passage edges, and
   completeness/verification status.
5. **ADAPT — fixed pricing into hard admission (high).** Estimate and reserve
   worst-case cohort cost locally; reconcile observed billing; reject unknown
   variable cost unless contractually bounded.
6. **ADAPT — terminal prose error (high).** Preserve raw text but normalize to
   auth/policy/validation/rate/credit/upstream/timeout/unknown with explicit
   retryability and confidence.

### Rejected

1. **REJECT — Tasks as a planner or curiosity engine (high).** It exposes no
   plan, branch authority, dependency, marginal value, or stopping reason.
2. **REJECT — opaque create retries (high).** No idempotency contract means an
   ambiguous replay may duplicate cost and work.
3. **REJECT — polling as cancellation (high).** Stopping local polling does not
   stop server execution.
4. **REJECT — provider quota/balance as a budget (high).** Both are shared
   capacity/account state, not per-cohort safety bounds.
5. **REJECT — task timestamps as source provenance (high).** They describe the
   record, not the evidence.
6. **REJECT — Tasks as durable storage (high).** Retention is explicitly bounded
   but unspecified.

### Deferred

1. **DEFER — Linkup Tasks adapter (medium).** Require contract tests, retention/
   privacy review, and written idempotency/cancellation/atomicity answers.
2. **DEFER — Extract child type (high).** Official sources conflict and cost is
   variable without a maximum.
3. **DEFER — ZDR Tasks use (high).** Async record persistence and claimed ZDR
   behavior are unreconciled publicly.
4. **DEFER — webhook emulation (high).** A Curiosity-owned notifier may project
   local completion, but must not be represented as provider delivery.

## 11. Unknowns and checks before any revisit

1. Create idempotency, duplicate detection, partial acceptance, atomicity, and
   response-order guarantee.
2. Numeric in-flight limits by plan; scheduler fairness; queue admission when a
   request exceeds remaining capacity.
3. Server deadlines, internal retry policy, exactly/at-least-once behavior, and
   terminal transition guarantees.
4. Cancellation/deletion support, if any exists outside the published OpenAPI.
5. Exact result/task retention and deletion timing for every state and child
   type, including backups.
6. Tasks compatibility and metadata behavior under ZDR, locality, BYOC, and DPA.
7. Stable machine error codes for asynchronous failures and whether native child
   error details can be preserved.
8. Task-specific poll quota scope and `Retry-After` behavior; interaction with
   Search/Fetch organization QPS.
9. Extract-in-Tasks availability, beta permissions, variable-cost admission,
   maximum charge, and artifact expiry handling.
10. Batch-level cost reservation and behavior if prepaid balance covers only
    some accepted items.
11. Output/request byte and schema limits, including 100 large Fetch outputs.
12. Pagination consistency, task expiry visibility, authorization scopes, and
    organization-wide list access.

Any contract test must be separately authorized, use public/synthetic inputs,
cap spend, avoid hostile targets, and record exact documentation/API versions.
No such test was performed here.

## 12. Fact / inference / recommendation summary

| ID | Type | Claim | Confidence | Sources | Verdict |
|---|---|---|---|---|---|
| L1 | FACT | Tasks is a 1–100 item async wrapper returning one envelope per child. | High | [S1][S3] | **ADOPT/ADAPT** |
| L2 | FACT | Items execute independently and unordered; dependencies require another submission. | High | [S2] | Separation **ADOPTED** |
| L3 | FACT | States are pending/processing/completed/failed; output is native and failure error is a string. | High | [S1][S3-S5] | Error/state **ADAPTED** |
| L4 | FACT | Listing is paginated/filterable/sortable and exposes organization in-flight/limit. | High | [S4] | Telemetry **ADOPTED** |
| L5 | FACT | Results have bounded but unspecified lifetime; no durable-storage promise. | High | [S2] | Hosted archive **REJECTED** |
| L6 | FACT | No published Tasks webhook, cancellation, SSE, idempotency, or batch resource exists. | High | [S3-S5][S11] | Hosted lifecycle **REJECTED** |
| L7 | FACT | Overview/changelog say three types; current OpenAPI/pricing/list include Extract. | High | [S1][S3-S8] | Extract **DEFERRED** |
| L8 | INFERENCE | Tasks is an organization-scoped record/dispatcher projection over endpoint workers. | Medium-high | [S1-S5] | Architecture lesson **ADAPTED** |
| L9 | INFERENCE | No idempotency plus ambiguous create requires duplicate-aware local lineage. | High | [S3-S5] | Blind retry **REJECTED** |
| L10 | FACT | Fixed child prices allow estimates, but Tasks accepts no aggregate cost cap. | High | [S3][S7] | Local admission **ADOPTED** |
| L11 | INFERENCE | Native output plus job timestamps is not evidence chain-of-custody. | High | [S3-S5] | Provenance **ADAPTED** |
| L12 | FACT/UNKNOWN | Tasks persists/retrieves inputs and outputs; public ZDR compatibility is unexplained. | High | [S2-S5][S12] | ZDR use **DEFERRED** |

## 13. Bounded curiosity pass

After synthesis, in-frame gaps were scored 1 (low) to 5 (high). Cost is
investigation cost, where lower is cheaper.

| Thread | Rel. | Value | Novelty | Cost | Decision |
|---|---:|---:|---:|---:|---|
| OpenAPI versus overview on Extract child support | 5 | 5 | 4 | 1 | **Pursued:** current schema/list/pricing include it; overview/guide/changelog do not. Contradiction retained. |
| Hidden aggregate concurrency contract | 5 | 5 | 4 | 1 | **Pursued:** list schema exposes `quota.inFlight/limit`; no universal value found. |
| Tasks persistence versus ZDR | 5 | 5 | 5 | 2 | **Pursued to saturation:** Tasks requires retrievable records; privacy docs describe no persistence under ZDR but never reconcile Tasks. |
| x402 availability for Tasks | 4 | 4 | 3 | 1 | **Pursued:** dedicated x402 list excludes Tasks and Tasks requires bearer. |
| Exact retention duration | 5 | 5 | 3 | 2 | **Pursued to negative result:** official guidance says only “bounded period.” |
| Inspect SDK retry/list internals | 2 | 2 | 2 | 4 | **CURIOSITY_NO_GO:** public wire contract suffices; client behavior cannot establish server guarantees. |
| Submit duplicate/partial batches | 5 | 4 | 4 | 5 | **CURIOSITY_NO_GO:** credentials/calls forbidden and duplicate billing risk; requires a separately approved test plan. |
| Infer broker/database technology | 1 | 1 | 4 | 5 | **CURIOSITY_NO_GO:** proprietary, unnecessary, and unsupported by behavior-level evidence. |
| Benchmark batch throughput | 3 | 3 | 2 | 5 | **CURIOSITY_NO_GO:** outside product-contract frame and requires paid/live execution. |
| Obtain gated DPA/Trust Center reports | 4 | 4 | 3 | 4 | **DEFERRED:** requires organizational/legal authority; public claims remain vendor statements. |

**Stop condition:** coverage and saturation. Every requested category is answered
or explicitly bounded. Remaining high-value questions require provider
confirmation, contractual artifacts, or separately authorized API calls; no
live autonomous follow-up is authorized.

## 14. Primary source ledger

All sources are official/primary and were accessed 2026-08-17.

- **[S1]** Linkup, “Tasks overview” — wrapper identity, supported types,
  submission, lifecycle, native outputs, and price table.
  <https://docs.linkup.so/pages/documentation/endpoints/tasks/overview>
- **[S2]** Linkup, “Tasks best practices” — use cases, parallel/unordered
  execution, polling, independent failure, retry guidance, and bounded result
  lifetime. <https://docs.linkup.so/pages/documentation/endpoints/tasks/best-practices>
- **[S3]** Linkup, `POST /v1/tasks` OpenAPI rendering — 1–100 input union,
  bearer auth, response envelopes, Extract variant, and create errors.
  <https://docs.linkup.so/pages/documentation/endpoints/tasks/post>
- **[S4]** Linkup, `GET /v1/tasks` OpenAPI rendering — filters, pagination,
  sorting, output union, and organization `TasksQuota`.
  <https://docs.linkup.so/pages/documentation/endpoints/tasks/list>
- **[S5]** Linkup, `GET /v1/tasks/:id` OpenAPI rendering — get-one contract and
  child-specific outputs. <https://docs.linkup.so/pages/documentation/endpoints/tasks/get>
- **[S6]** Linkup changelog, “Tasks Endpoint,” released April 2026 — original
  three-type launch contract and intended workloads.
  <https://docs.linkup.so/pages/changelog/tasks-endpoint>
- **[S7]** Linkup, “Pricing” — child prices, successful/error billing, prepaid
  credit, Extract variability, and broad Tasks statement.
  <https://docs.linkup.so/pages/documentation/platform/pricing>
- **[S8]** Linkup, “Introduction” — current public five-product distinction and
  three-type Tasks summary.
  <https://docs.linkup.so/pages/documentation/get-started/introduction>
- **[S9]** Linkup, “Errors” — API error envelope, status classes, and 429
  credit/rate ambiguity. <https://docs.linkup.so/pages/documentation/platform/errors>
- **[S10]** Linkup, “x402 Payment Protocol” — only Search and Fetch are listed
  as x402-enabled. <https://docs.linkup.so/pages/documentation/platform/x402>
- **[S11]** Linkup, public OpenAPI 3.1 specification — complete published path
  inventory used for negative lifecycle results.
  <https://api.linkup.so/v1/openapi.json>
- **[S12]** Linkup, “Data processing and privacy” — regions, default non-ZDR,
  and claimed in-memory/no-persistence ZDR behavior.
  <https://docs.linkup.so/pages/security-and-privacy/data-processing-privacy>
- **[S13]** Linkup, “Content safety and index controls” — vendor safety,
  crawling, domain, and enterprise controls.
  <https://docs.linkup.so/pages/security-and-privacy/content-safety-index-controls>
- **[S14]** Linkup, “Security and compliance” and security FAQ — encryption,
  certifications, enterprise controls, incident claims, and BYOC.
  <https://docs.linkup.so/pages/security-and-privacy/security-compliance>,
  <https://docs.linkup.so/pages/security-and-privacy/faq>
- **[S15]** Linkup, “Tasks for AI agents” — corroborating bare-array SDK shape,
  agent guidance, polling, and no-durable-storage warning.
  <https://docs.linkup.so/pages/documentation/endpoints/tasks/for-agents>

## 15. Confidence summary

- **High:** current request/item schemas, lifecycle vocabulary, list/query/quota
  shape, per-item independence, parallel unordered execution, poll guidance,
  listed prices, and absence of lifecycle endpoints from public OpenAPI.
- **High:** Tasks does not itself expose planning/tools/dependencies and must not
  be conflated with Research.
- **Medium-high:** dispatcher plus endpoint-worker architecture as a minimal
  behavioral model; physical queue/storage implementation remains unknown.
- **Low/unknown:** create atomicity/idempotency, internal retries/delivery
  semantics, exact retention, Tasks-ZDR compatibility, fixed concurrency values,
  asynchronous error taxonomy, and Extract-in-Tasks production behavior.
