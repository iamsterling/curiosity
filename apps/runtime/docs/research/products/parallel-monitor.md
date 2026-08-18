# Parallel Monitor API: standalone temporal-monitoring investigation

**Research date:** 2026-08-17  
**Source access date:** 2026-08-17 for every source  
**Scope:** Parallel Monitor API V1 (`/v1/monitors`) as a standalone product.
Task, Search, Memory, and Interactions are considered only where Monitor depends on
their contracts.  
**Method:** clean-room analysis of public first-party documentation, generated
OpenAPI reference, product/pricing pages, and legal terms. No account, API key,
paid/free service call, SDK/package inspection, traffic interception, benchmark,
access-control bypass, or proprietary implementation inspection was used.

## Decision frame

**Question:** Which externally observable Monitor patterns should Curiosity adopt,
adapt, reject, or defer when designing a bounded, auditable temporal retrieval
capability?

Bounded sub-questions:

1. What constitutes a monitor, execution, event, snapshot, and lifecycle state?
2. What does the frequency promise, and what schedule/run state is absent?
3. How are novelty, materiality, semantic deduplication, and freshness represented?
4. Can a downstream consumer reconstruct the source and temporal provenance of a
   detection?
5. What delivery, retry, idempotency, pricing, limit, privacy, and safety properties
   are contractual?
6. What architecture can be inferred without claiming knowledge of Parallel's
   private implementation?
7. Which lessons transfer to Curiosity's temporal and bounded-curiosity model?

Epistemic labels:

- **FACT** — directly stated by a cited official source.
- **INFERENCE** — an interpretation of public behavior, not a claim about internals.
- **RECOMMENDATION** — a Curiosity design conclusion.
- **UNKNOWN / NEGATIVE RESULT** — not established in the reviewed official sources.

## Executive verdict

Parallel Monitor is a durable scheduled-research abstraction, not merely a webhook
wrapper. An `event_stream` monitor repeatedly searches for net-new material events;
a `snapshot` monitor repeatedly recomputes a Task-derived state and emits a semantic
diff. Both run immediately on creation and then at a fixed interval, suppress
no-change runs by default, and expose detected changes as an append-only event log
with stable IDs and field-scoped Basis. [S1][S2][S3][S4]

The strongest transferable ideas are:

1. separate **event discovery** from **state observation**;
2. make no-change executions auditable rather than treating silence as proof;
3. give each detection a stable event ID and each detected execution an event-group ID;
4. attach claim/field evidence to the changed value;
5. support push and pull delivery while requiring consumer deduplication; and
6. preserve a prior state alongside a semantic diff.

The largest gaps are equally important. The V1 contract exposes no next-run time,
timezone/anchor, schedule jitter or overlap rule, run ID/state machine, source fetch
time, content version/hash, discovery cutoff, dedup key/window, materiality rule,
freshness SLA, event-log retention guarantee, or immutable monitor-definition
version. A trigger returns no execution ID. Updating a query can compare a new
definition against old seen-state. These omissions prevent Monitor itself from being
a complete temporal provenance or bounded-execution contract. [S4][S5][S6][S7]

**Overall confidence:** **high** for public V1 shapes, lifecycle, prices, and webhook
mechanics; **medium** for temporal and dedup semantics because they are described
qualitatively; **low** for hidden retrieval, scheduling, materiality, and retention
implementation. Production fitness remains **medium-low** without authorized
contract tests and written data-governance answers.

## 1. Product definition and boundaries

**FACT:** V1 is the current development target. The Alpha endpoints remain reachable
but receive no new features; snapshot, Basis output, location, and processor selection
are V1-only. This report therefore does not transfer Alpha behavior into the GA
contract. [S22]

### Two distinct monitor semantics

| Type | Monitored definition | Comparison unit | Emitted detection |
|---|---|---|---|
| `event_stream` | Natural-language query, optional JSON output schema, optional first-run backfill, source policy, location | Candidate event against previously seen events | One append-only `event_stream` record per distinct material change |
| `snapshot` | Completed Task Run ID, from which input and output schema are derived | Newly recomputed output against prior snapshot | One `snapshot` record containing changed fields and the full previous output |

**FACT:** `event_stream` is for discrete developments such as a hire or funding
announcement. `snapshot` is for current state such as present executives, prices, or
active trials. The latter accepts a completed Task Run baseline; structured JSON is
recommended because it can be compared field by field, while text is diffed as a
whole. [S1][S2][S8]

**FACT:** An event-stream definition requires `type`, `frequency`, and
`settings.query`. It may add `processor` (`lite` default or `base`), a JSON Schema
subset, `include_backfill`, domain source policy, country location, webhook,
string-valued metadata, and `memory_scope_key`. A snapshot definition instead
requires `settings.task_run_id`. [S4]

**FACT:** If `include_backfill=true`, only the first event-stream execution returns a
**sample** of recent historical matches; it is explicitly a preview, not exhaustive.
If false/omitted, detections begin at monitor creation. Every later execution is
incremental. Monitor is not the retrospective-research product. [S1][S4]

**UNKNOWN:** Public documentation gives no query-length bound, output-schema
complexity bound specific to Monitor, maximum events per execution, maximum sources
examined, or guarantee that every matching event is returned.

### Processor meaning

**FACT:** `lite` is positioned for a narrow entity/domain/signal and `base` for wider
entity classes/topics/regions. Parallel says both reason over and deduplicate results;
Base searches more broadly for recall at higher cost. [S9][S10]

**INFERENCE (medium):** processor is a compound retrieval/reasoning budget controlling
search breadth and semantic adjudication, not a portable scalar quality level. The
actual query count, source count, token budget, model, and stopping rule are hidden.

**CONTRACT AMBIGUITY:** Snapshot guidance says the baseline Task's input,
**processor**, and output schema become the re-execution template, while snapshot
creation separately requires/accepts a Monitor `processor` (`lite`/`base`) and the
response exposes that processor. [S2][S4] It is unclear whether the original Task
processor is replayed, the Monitor processor replaces it, or the two govern different
stages. This matters for reproducibility and cost.

**RECOMMENDATION:** Curiosity should expose explicit retrieval, comparison, and
delivery budgets rather than map a provider tier into core semantics.

## 2. Schedule, resource state, and execution state

### What is promised

**FACT:** Frequency is an interval string `<number><unit>` using hours, days, or weeks,
bounded from `1h` through `30d` inclusive. A monitor executes immediately at creation
and then on its schedule. Guidance recommends `1h`, `1d`, or `1w` according to topic
velocity. [S1][S4]

**FACT:** `POST /{monitor_id}/trigger` enqueues an immediate one-off execution without
changing the regular schedule and returns HTTP 204. A cancelled monitor cannot be
triggered. [S7]

**FACT:** The resource has only `active` and `cancelled` states. Cancellation is
irreversible and idempotent for an already-cancelled monitor; resumption requires a
new monitor. Cancelled monitors cannot be updated. [S5][S6]

**FACT:** Retrieve/list responses expose `created_at` and nullable `last_run_at`.
Snapshot responses additionally expose the latest completed snapshot; it is null
until a run completes. List defaults to active monitors, is newest-created first, and
uses cursor pagination. [S4][S5]

### What is not promised

**UNKNOWN / NEGATIVE RESULT:** The V1 resource and trigger contracts expose none of:

- schedule anchor, timezone, next scheduled time, jitter, grace period, or misfire rule;
- whether intervals are fixed-rate or measured from the prior start/completion;
- maximum start delay, execution latency, deadline, or freshness SLO;
- behavior when execution duration exceeds the interval (overlap, queue, coalesce,
  skip, or concurrent compare);
- execution states such as queued/running/retrying, attempt count, lease, or heartbeat;
- a trigger request/run ID, idempotency key, or linkage from HTTP 204 to a later
  completion/error;
- automatic retry policy for failed executions or catch-up behavior after outage;
- pause/resume, temporary disable, or a reversible terminal state.

**INFERENCE (high):** The product has an internal scheduler and persistent per-monitor
cursor/snapshot because it executes asynchronously and compares against prior runs.
The public API deliberately projects only a coarse resource state and eventual
outcomes; it is not a workflow-engine control plane.

**RECOMMENDATION:** Curiosity needs separate `MonitorDefinition`, versioned
`Schedule`, and `ObservationRun` records. A run should have an ID before enqueue,
queued/started/completed timestamps, attempt lineage, deadline, schedule/definition
version, cutoff watermark, and terminal reason.

## 3. Change detection, materiality, and freshness

### Event-stream semantics

**FACT:** Event-stream events are documented as distinct material changes detected
since the previous execution, “net-new relative to the cursor,” and an append-only
log. Parallel says semantic deduplication suppresses repeated descriptions of the same
event. [S3][S8]

**UNKNOWN:** Neither OpenAPI nor guides define:

- the semantic identity key, similarity threshold, dedup window, or canonical entity;
- whether a changed URL, corrected article, syndication, or multiple sources produce
  one event or several;
- how retractions, corrections, late publication, or an event moving in/out of query
  scope are represented;
- whether previously suppressed candidates can later be emitted as evidence improves;
- cursor value, event-set completeness, or maximum lookback per run.

`event_date` is described as when the event was “produced,” may be only `YYYY`,
`YYYY-MM`, or `YYYY-MM-DD`, and may be null. It is therefore not a reliable source
publication, provider observation, fetch, execution, or validity timestamp. [S3]

### Snapshot semantics

**FACT:** Each execution reruns the baseline task and compares the new output with the
previous snapshot. A detected event contains partial `changed_output` plus full
`previous_output`; the current full value is separately available as
`output.latest_snapshot` on the monitor resource. New data, removed fields, and
significant value shifts are described as changes. [S2][S3][S4]

**INFERENCE (medium):** Snapshot comparison is semantic/model-assisted rather than a
raw JSON patch. “Material” and whole-text diffing imply normalization and judgment,
while field-level Basis requires synthesis of why a value changed. Exact logic is
undisclosed.

**UNKNOWN:** There is no documented equality/canonicalization rule for ordering,
whitespace, null versus absent, arrays, numeric tolerance, renamed fields, citation-only
changes, or confidence changes. No patch operation (`add/remove/replace`), changed
field old value, version number, or tombstone contract is exposed. `previous_output`
can identify the old value only by client-side comparison, and the event does not
embed the full new snapshot.

### Definition changes and temporal continuity

**FACT:** An active event-stream monitor can update frequency, query, advanced
settings, webhook, or metadata. The API explicitly warns that query updates should be
minor because major changes can produce unexpected change detection when new results
are compared with what was previously seen. Output schema and `include_backfill` are
not in the update-settings schema; snapshot settings are not updatable. [S6]

**INFERENCE (high):** Event identity state survives minor query updates, but there is
no externally visible definition epoch. Consequently a single event log may cross
different query/source/location definitions without records identifying the exact
definition used by each run.

**RECOMMENDATION:** Never mutate a meaningfully different temporal question in place.
Curiosity should create a new definition version and either reset the comparison
baseline explicitly or fork the monitor, preserving `supersedes` lineage.

### Freshness is not cadence

**FACT:** Frequency controls how often Monitor evaluates; it does not itself promise
when a source was crawled or fetched. Monitor advanced settings publicly expose source
policy and location, but no Search-style `fetch_policy`, maximum cache age, live-fetch
requirement, or stale-cache fallback control. [S1][S4][S11]

**DOCUMENTATION CONTRADICTION:** Monitor's OpenAPI reuses `SourcePolicy`, whose schema
contains `after_date`; however the central Source Policy guide says domain controls
are supported by Task and Search and says `after_date` is Search-only. Monitor guides
advertise domain and location controls but not a freshness date. [S1][S4][S11] Treat
Monitor `after_date` as unsupported until Parallel confirms it.

**UNKNOWN:** No Monitor-specific statement establishes index cadence, live fetching,
source discovery delay, event-time watermark, late-arrival handling, or end-to-end
“source changed → event available” SLA. Hourly execution can still observe stale
indexed material; conversely backfill can intentionally emit pre-creation events.

**RECOMMENDATION:** Curiosity should store at least `source_published_at`,
`source_observed_at`, `content_fetched_at`, `run_cutoff_at`, `detected_at`, and
`delivered_at` independently, each with precision and origin. “Fresh” should be an
auditable constraint, never inferred from schedule frequency.

## 4. Evidence and temporal provenance

### What Basis provides

**FACT:** Detected event-stream output and snapshot `changed_output` use text/JSON Task
output shapes. Their `basis[]` maps an output field to citations (URL, optional title,
optional excerpts), generated reasoning, and nullable confidence. Text uses the field
`output`; JSON defaults to top-level fields. [S3][S4][S12]

**FACT:** Stable `event_id` is safe for client deduplication. `event_group_id` groups
all events from one execution. A Monitor event ID can be passed as
`previous_interaction_id` to a follow-up Task so the downstream run inherits context.
[S3][S13]

### Limits of the evidence contract

**FACT/CONTRADICTION:** The Research Basis guide says all processors include confidence
and excerpts, while OpenAPI makes confidence and excerpts nullable and says only some
processors provide them. The marketing pricing table describes Monitor Basis only as
citations. Consumers must feature-detect both fields. [S4][S10][S12]

**CONTRADICTION:** The GA product article says every Monitor event carries an
`interaction_id`; current event OpenAPI exposes no such field, and the follow-up guide
uses `event_id` itself as `previous_interaction_id`. Use the current V1 event contract,
not the article's field name. [S3][S8][S13]

**UNKNOWN / NEGATIVE RESULT:** A detection lacks:

- retrieved content digest, immutable source-version ID, canonical URL, or redirect
  chain;
- source publication/update/fetch/index/observation timestamps;
- exact quoted offsets or an entailment relation from source span to changed claim;
- retrieval query/branch, rank, acquisition mode, or cache/live indicator;
- complete candidate/source set or a flag saying citations are exhaustive;
- old and new evidence attribution as distinct sets;
- monitor-definition version, processor/model version, or replay recipe.

**INFERENCE (high):** Basis is claim-adjacent evidence, not immutable lineage.
`reasoning` is a generated explanation, not proof of the hidden execution. Confidence
is provider-reported judgment, not a calibrated probability established by these
sources.

**RECOMMENDATION:** Curiosity should adapt field-scoped Basis into a versioned
claim-evidence graph with exact retained spans, lawful content digest, acquisition and
temporal metadata, support/contradict relation, source role, run/definition lineage,
and explicit provenance-completeness status. Keep provider confidence namespaced and
separate from verification.

## 5. Event log, deduplication, and versioning

**FACT:** The list-events endpoint returns newest first, defaults to 20 and permits
1–100 records per page. It supports cursor pagination, exact execution filtering by
`event_group_id`, and optional no-change `completion` events. Errors are always
included. The guide says the endpoint returns up to the roughly 300 most recent
executions, while the OpenAPI does not state that retention/window bound. [S3]

**FACT:** One execution maps to one outcome class: detected event(s), no-change
completion, or error; a run with detections does not additionally emit completion.
[S3]

**CONTRADICTION / RETENTION RISK:** “Use `next_cursor` to paginate” can suggest a
complete history, but the guide separately limits availability to approximately 300
recent executions. No duration, deletion rule, export guarantee, or cancelled-monitor
retention promise is published. At hourly frequency, 300 executions are only about
12.5 days.

**FACT:** Provider event identity and delivery identity differ: `event_id` deduplicates
content events returned by Monitor; `webhook-id` deduplicates duplicate HTTP delivery
attempts. `event_group_id` correlates one execution, not one semantic event across
monitor versions. [S3][S14]

**UNKNOWN:** IDs have no documented derivation or stability across cancel/recreate,
query changes, output-schema changes, backfill, or provider reprocessing. There is no
ETag/revision, monotonically increasing sequence, cursor watermark, event amendment,
retraction, or supersession record.

**RECOMMENDATION:** Curiosity should keep separate immutable IDs for definition,
definition version, observation run, candidate observation, semantic event, event
revision, and delivery attempt. Dedup decisions should be recorded with rule/version,
matched prior ID, score/reason, and reversible merge/split lineage.

## 6. Alerts, webhooks, and polling

**FACT:** Consumers may poll events or subscribe to:

- `monitor.event.detected` — one or more material detections;
- `monitor.execution.completed` — successful run with no detections;
- `monitor.execution.failed` — failed run. [S14][S15]

Detected-event webhooks carry the monitor ID, event-group ID, timestamp, and echoed
metadata, but not the event content; the receiver fetches the group from the events
endpoint. This keeps webhook bodies small and makes the event log authoritative for
content. [S1][S15]

**FACT:** Webhooks use Standard Webhooks-compatible HMAC-SHA256 signatures over exact
body plus `webhook-id` and `webhook-timestamp`. Delivery is at least once: duplicates
may occur, failed deliveries use exponential backoff after 5 seconds for multiple
attempts over 48 hours, and consumers should acknowledge quickly and deduplicate on
`webhook-id`. [S14]

**PAYLOAD DISCREPANCY:** Monitor webhook examples represent no-change completion with
`monitor_ts` and failure with `id`/`date`, while the events OpenAPI represents these as
`timestamp` and, for errors, `error_message`. [S3][S15] These are delivery versus pull
shapes, but the mapping and stable cross-channel identity are not documented.

**UNKNOWN:** No timeout, maximum body size, ordering guarantee, concurrent-delivery
rule, timestamp replay tolerance, endpoint validation/SSRF policy, dead-letter access,
manual redelivery, or webhook delivery log is published. Changing/clearing a webhook
during retries has unspecified behavior.

**RECOMMENDATION:** Curiosity should verify signature and timestamp, allowlist egress,
persist the raw authenticated envelope before processing, acknowledge quickly, and
make handlers idempotent on both delivery ID and domain event ID. A notification is a
pointer, not the source of truth. Silence must be disambiguated among no change, failed
execution, delayed execution, and failed delivery.

## 7. Limits, pricing, and errors

### Price and volume

| Processor | Published price | Intended scope | Cost at minimum hourly cadence for 30 days |
|---|---:|---|---:|
| `lite` | $3 / 1,000 executions | narrow | about $2.16 per monitor |
| `base` | $10 / 1,000 executions | broad | about $7.20 per monitor |

The monthly examples are arithmetic inferences from 720 executions, exclude manual
triggers, retries if billable, taxes, and failed-run treatment, and are not vendor
quotes. [S9]

**FACT:** Monitor is billed per execution, not per emitted event, and creation
immediately causes an execution. [S4][S9]

**INFERENCE (medium):** Because a manual trigger enqueues a one-off execution, it is
likely billable as another execution. The pricing page does not explicitly discuss
manual triggers. [S7][S9]

**UNKNOWN:** Unlike Task pricing, the Monitor page does not say failed executions are
free. It does not define billing for provider retries, overlapping runs, cancelled
in-flight runs, duplicate trigger submissions, or first-run backfill. Response/events
contain no Monitor usage/cost object.

**FACT:** Monthly spend limits are notify-only and do not block requests. [S16]

**RECOMMENDATION:** Do not use them as the hard control for runaway always-on cost.

### Rate and shape limits

**FACT:** Official FAQ/marketing state Monitor's default rate limit is 300 requests per
minute. The dedicated rate-limit table still counts only creation POSTs to the legacy
`/v1alpha/monitors`, despite V1 being GA; it says resource-creation POSTs count and GETs
do not. V1 create/trigger/update/cancel treatment is therefore not fully documented.
[S16][S17]

Other published limits include frequency `1h`–`30d`, source-policy combined domain
limit 200, metadata key maximum 16 characters/value maximum 512, memory-scope key
1–128 restricted characters, monitor-list page 1–10,000, and event-list page 1–100.
[S3][S4][S5][S11]

### Failure model

**FACT:** Request endpoints document 401, 404, and 422 as applicable. The general
error reference adds 402 payment, 403 processor/permission, 429 rate limit, and
retryable 500/502/503. A failed asynchronous execution is retained as an `error` event
with human-readable text; payment or quota failure is an example. [S3][S4][S18]

**UNKNOWN:** No machine-readable monitor execution error code, retryability flag,
partial-results contract, warning-to-run linkage, or automatic retry count exists in
the event schema. A page-level `warnings` array may report compute caveats but warnings
are not tied to a specific listed event in the schema. [S3]

**RECOMMENDATION:** Apply local admission budgets per tenant/monitor and cap active
monitor count, executions/day, manual triggers, webhook retries, and downstream work.
Normalize execution failures into stable categories while retaining provider text and
request/event IDs. Never retry non-idempotent create/trigger blindly.

## 8. Privacy, safety, and legal boundaries

### Retention and memory

**FACT:** Monitor accepts a `memory_scope_key`. When supplied, supported inputs and
outputs may be saved to isolated application memory. If omitted, personal memory may
apply; personal memory can be enabled by default for some newly created organizations.
Turning memory off stops new entries but retains old entries until permanent deletion.
[S4][S19]

**UNKNOWN:** Public Monitor docs do not state the ordinary retention period for monitor
definitions, seen-state/dedup history, event content, citations/excerpts, webhook
payloads, cancelled monitors, or hidden execution traces. Event API's approximate
300-execution availability is not a deletion promise.

**FACT:** FAQ says encryption is TLS 1.2+ in transit and at rest in US data centers and
claims SOC 2 Type I/II. Enterprise pricing advertises ZDR and DPAs. The privacy policy's
EU residency statement is specifically for Search request/response content, not
Monitor. Interactions are unavailable to ZDR customers. [S10][S13][S16][S20]

**MATERIAL CONTRADICTION:** FAQ says customer data is never used to train models;
Customer Terms grant a perpetual service-improvement license and explicitly say
Parallel may use Customer IP to train/improve ML and AI models. [S16][S21 §4(b)] The
contractual language should govern procurement analysis unless a signed order/DPA/ZDR
term changes it.

**RECOMMENDATION:** Do not send sensitive monitoring definitions or private watchlists
under self-serve assumptions. Obtain written retention/deletion, memory-default, ZDR,
region, subprocessors, webhook-log, and model-training terms specifically covering
Monitor and its hidden comparison state.

### Untrusted web and alert automation

**FACT:** Parallel focuses on unauthenticated public-web information. Source policies
can constrain domains, but the central guide warns they can lower quality. [S11][S16]

**INFERENCE (high):** Monitor repeatedly turns untrusted pages into proactive triggers,
amplifying prompt-injection, misinformation, stale-page, malicious-link, and false
positive risk. Semantic deduplication and provider confidence reduce noise but do not
establish truth or safety.

**UNKNOWN / NEGATIVE RESULT:** Reviewed Monitor materials disclose no prompt-injection
defense, URL/network safety checks, malware scanning, content moderation, source trust
taxonomy, PII minimization, deletion-on-source-removal behavior, or adversarial-page
handling.

**FACT:** Customer Terms say outputs are AI-generated and not guaranteed accurate,
complete, or current, require independent verification, and prohibit automated
high-impact decisions without human oversight in areas such as employment, healthcare,
finance, legal, housing, insurance, and benefits. [S21 §§5(b), 8(e)]

**RECOMMENDATION:** Treat every event, excerpt, URL, reasoning string, webhook field,
and metadata echo as untrusted data. Require evidence verification and human approval
before a detection causes outreach, trading, compliance action, account mutation, or
other consequential side effect. Domain allowlists are scope controls, not trust
proofs.

### Clean-room and license boundary

This investigation used only public first-party behavior and contracts. Parallel's
Customer Terms prohibit deriving underlying structure/algorithms, model extraction,
probing, scraping outside APIs, competitive use, and publishing benchmarks without
consent. [S21 §2(c)] No server implementation, prompts, models, dedup algorithm, or
dataset is licensed or reproduced here. General temporal-system patterns may be
independently designed; Parallel names, wire compatibility, generated content, and
private implementation must not be copied or implied.

## 9. Clean-room architecture inference

The following is a bounded inference from the public contract:

```text
Monitor definition + schedule + definition state
                    │
                    v
             durable scheduler  <── manual trigger
                    │
              observation execution
              ┌─────┴──────────────┐
              │                    │
       event_stream           snapshot
       query/retrieve         reconstruct baseline Task
       candidate events       recompute typed output
              │                    │
       semantic novelty       semantic field/state diff
       + materiality          against previous snapshot
              └─────┬──────────────┘
                    v
          evidence/Basis generation
                    │
          persistent event + seen state
              ┌─────┴─────────┐
              v               v
        cursor-paged API    signed webhook pointer
                                │
                                v
                         optional follow-up Task
```

Supporting facts are immediate/scheduled executions, stable per-event and per-execution
IDs, append-only net-new events, persisted latest snapshot, previous-output diffs,
semantic dedup claims, and event-to-Task context chaining. [S1][S2][S3][S4][S8][S13]

**UNKNOWN:** physical stores, scheduler technology, use of Parallel's index versus live
fetch, candidate generation, watermarking, model/provider, dedup embeddings or rules,
snapshot canonicalization, transactional boundaries, concurrency control, and model
versioning.

## 10. Temporal Curiosity implications

1. **Two primitives, one envelope.** Model `event_watch` and `state_watch` separately,
   but normalize both into versioned observation runs and temporal claims.
2. **Definition immutability.** Every meaning-changing update creates a new version.
   Events record the exact query, schema, source/freshness policy, comparator, and
   budget version used.
3. **Explicit schedule semantics.** Store anchor/timezone, interval, jitter, overlap
   policy, misfire/catch-up policy, deadline, and next due time.
4. **Run-first observability.** Allocate a run ID before enqueue and expose attempts,
   starts, cutoff watermarks, source/fetch counts, terminal outcome, and stop reason.
5. **Silence is typed.** Distinguish `no_change`, `no_evidence`, `failed`, `late`,
   `skipped`, `budget_exhausted`, and `delivery_failed`.
6. **Multi-clock provenance.** Preserve event/source time, publication/update time,
   first/last observation, fetch time, run cutoff, detection, and delivery separately.
7. **Versioned evidence.** Link exact claim revision and old/new state to immutable
   evidence versions; support correction, retraction, supersession, and conflict.
8. **Auditable dedup.** Store candidate identity, canonicalization, comparator version,
   merge reason/score, prior match, and reviewability; do not silently destroy variants.
9. **Materiality as policy.** Define typed field tolerances and event significance rules
   rather than hiding them entirely in prompts/models.
10. **Bounded curiosity.** A detection may propose follow-up research, but may not launch
    it autonomously without declared authority. Score gaps/contradictions, charge every
    branch to a shared budget, and stop on coverage, saturation, deadline, or exhaustion.
11. **At-least-once delivery.** Separate domain-event and delivery IDs, sign envelopes,
    preserve attempts, and make all downstream handling idempotent.
12. **Provider isolation.** A Parallel adapter should preserve provider IDs, warnings,
    nullable Basis, and coarse states without weakening Curiosity's richer core contract.

## 11. Decision ledger

### Adopt

1. **ADOPT — Event/state split.** Net-new event feeds and recomputed state snapshots are
   different temporal products.
2. **ADOPT — Stable event and execution grouping IDs.** They support replay-safe ingest
   and execution-scoped retrieval.
3. **ADOPT — Auditable no-change outcome.** Silence alone is operationally ambiguous.
4. **ADOPT — Prior state plus changed fields.** It is more useful than a notification
   without comparison context.
5. **ADOPT — Push/pull dual delivery.** Signed webhook pointers plus authoritative pull
   retrieval reduce payload duplication.

### Adapt

1. **ADAPT — Basis.** Add source versions, exact spans, multi-clock timestamps,
   acquisition method, and support/contradiction semantics.
2. **ADAPT — Semantic dedup.** Make policy, version, decision, and merge lineage visible
   and reversible.
3. **ADAPT — Processor tiers.** Keep as provider hints; enforce local work, latency,
   cost, and follow-up budgets.
4. **ADAPT — Snapshot diff.** Use explicit typed patches and comparator versions while
   retaining old/new full-state references.
5. **ADAPT — Webhooks.** Require replay-window checks, two-level idempotency, durable
   receipt, and dead-letter observability.

### Reject

1. **REJECT — Cadence equals freshness.** An hourly loop does not prove fresh discovery
   or live content.
2. **REJECT — Mutable query with invisible history epoch.** It contaminates temporal
   comparisons and reproducibility.
3. **REJECT — Notify-only spend limits as safety.** They cannot bound always-on cost.
4. **REJECT — Citation/confidence equals verification.** Basis is useful but incomplete
   provenance and generated judgment.
5. **REJECT — Alert directly causes consequential action.** Proactive retrieval
   magnifies false-positive and hostile-content risk.

### Defer

1. **DEFER — Production Parallel adapter.** Contract tests, retention/ZDR terms, and
   schedule/dedup answers are prerequisites.
2. **DEFER — Memory and Interaction chaining.** Valuable context, but retention and ZDR
   implications require explicit policy.
3. **DEFER — Quality/recall/cost claims.** No authorized empirical evaluation occurred,
   and public terms restrict benchmark publication.
4. **DEFER — High-risk monitoring.** Employment, finance, healthcare, legal, and similar
   uses require domain governance and human oversight.

## 12. Unknowns and checks before integration

### Provider questions

1. Define schedule anchor, jitter, overlap, missed-run/catch-up, retry, and cancellation
   behavior, including in-flight cancellation.
2. Provide an execution ID/state API for scheduled and manual runs, or confirm none.
3. Define materiality and semantic dedup scope/window, correction/retraction behavior,
   and stability across query updates and monitor recreation.
4. Clarify snapshot baseline Task processor versus Monitor processor semantics.
5. Confirm whether Monitor supports `source_policy.after_date`; document fetch/cache/live
   behavior and temporal freshness SLA.
6. State event-log and hidden seen-state retention/deletion after cancellation, account
   deletion, memory deletion, and ZDR.
7. Confirm failed/manual/backfill/provider-retry billing and V1 endpoint rate-limit
   accounting.
8. Reconcile confidence/excerpt availability and `interaction_id` versus `event_id`.
9. Define webhook timeout, replay tolerance, endpoint validation, ordering, retry
   identity, logs, and dead-letter/redelivery controls.
10. Resolve FAQ “never train” against Customer Terms §4(b) in the applicable signed
    agreement.

### Separately authorized non-production checks

- schedule timing, overlap, trigger correlation, cancellation race, and missed runs;
- duplicate create/trigger behavior and webhook/API cross-channel reconciliation;
- query-update baseline contamination and recreate/reset semantics;
- late-arriving, syndicated, corrected, and retracted event handling;
- JSON array reorder/null/removal/numeric-tolerance snapshot diffs;
- citation entailment, confidence calibration, and missing/changed-source behavior;
- freshness lag from controlled changes on a rights-owned test site;
- benign prompt-injection pages and unsafe URL handling;
- observed event retention beyond 300 hourly runs.

None were executed: credentials, paid calls, live probing, benchmarking, and
implementation were outside the caller-authorized frame.

## 13. Bounded curiosity pass

Scoring: 1 (low) to 5 (high). Cost is investigation cost, where lower is better.

| Thread | Relevance | Value | Novelty | Cost | Action |
|---|---:|---:|---:|---:|---|
| V1 monitor type/state/event contract | 5 | 5 | 4 | 1 | **Pursued:** all seven V1 endpoint references and Monitor guides compared |
| Freshness versus cadence | 5 | 5 | 5 | 1 | **Pursued:** found no fetch policy and retained `after_date` contradiction |
| Dedup/version semantics after update | 5 | 5 | 5 | 1 | **Pursued:** update warning proves old seen-state comparison; exact method unknown |
| Event retention completeness | 5 | 5 | 4 | 1 | **Pursued:** guide's ~300-execution bound conflicts with unbounded-looking pagination |
| Interaction and Basis consistency | 4 | 4 | 4 | 1 | **Pursued:** current OpenAPI/guides contradict article and confidence claims |
| Empirically measure materiality/recall | 5 | 5 | 4 | 5 | **CURIOSITY_NO_GO:** needs credentials, calls, corpus, judgments, and benchmark/legal authority |
| Reconstruct semantic dedup algorithm | 2 | 2 | 5 | 5 | **CURIOSITY_NO_GO:** proprietary, unnecessary, and outside clean-room boundary |
| Probe webhook endpoint validation/SSRF | 4 | 4 | 3 | 5 | **CURIOSITY_NO_GO:** active security testing was not authorized |
| Infer scheduler/store vendor | 1 | 1 | 3 | 5 | **CURIOSITY_NO_GO:** no contract value and no primary evidence |
| Give definitive privacy/copyright legality | 5 | 5 | 3 | 5 | **CURIOSITY_NO_GO:** requires counsel, deployment facts, and signed terms |

**Stop reason:** coverage and saturation. Every requested dimension has a current
first-party contract finding or an explicit negative result. Remaining high-value
questions require vendor confirmation, signed terms, or prohibited/out-of-scope live
evaluation.

## Primary sources

All sources accessed 2026-08-17. Parallel documentation is mutable; access date is part
of the provenance.

- **[S1]** Parallel, “Monitor API Quickstart” —
  <https://docs.parallel.ai/monitor-api/monitor-quickstart>
- **[S2]** Parallel, “Create a Snapshot Monitor” —
  <https://docs.parallel.ai/monitor-api/quickstart-snapshot>
- **[S3]** Parallel, “Events” and “List Monitor Events” OpenAPI —
  <https://docs.parallel.ai/monitor-api/monitor-events> and
  <https://docs.parallel.ai/api-reference/monitor/list-monitor-events>
- **[S4]** Parallel, “Create Monitor” OpenAPI —
  <https://docs.parallel.ai/api-reference/monitor/create-monitor>
- **[S5]** Parallel, “List Monitors,” “Retrieve Monitor,” and “Cancel Monitor” OpenAPI —
  <https://docs.parallel.ai/api-reference/monitor/list-monitors>,
  <https://docs.parallel.ai/api-reference/monitor/retrieve-monitor>, and
  <https://docs.parallel.ai/api-reference/monitor/cancel-monitor>
- **[S6]** Parallel, “Update Monitor” OpenAPI —
  <https://docs.parallel.ai/api-reference/monitor/update-monitor>
- **[S7]** Parallel, “Trigger Monitor Run” OpenAPI —
  <https://docs.parallel.ai/api-reference/monitor/trigger-monitor-run>
- **[S8]** Parallel, “Parallel Monitor API: New processor tiers, snapshots and event
  streams, and Basis on every event” — <https://parallel.ai/blog/monitor-api>
- **[S9]** Parallel, “Parallel API Pricing” —
  <https://docs.parallel.ai/getting-started/pricing>
- **[S10]** Parallel, “Pricing” — <https://parallel.ai/pricing>
- **[S11]** Parallel, “Source Policy” —
  <https://docs.parallel.ai/resources/source-policy>
- **[S12]** Parallel, “Research Basis” —
  <https://docs.parallel.ai/task-api/guides/access-research-basis>
- **[S13]** Parallel, “Follow-up Tasks” and “Interactions” —
  <https://docs.parallel.ai/monitor-api/monitor-task> and
  <https://docs.parallel.ai/task-api/guides/interactions>
- **[S14]** Parallel, “Webhook Setup” —
  <https://docs.parallel.ai/resources/webhook-setup>
- **[S15]** Parallel, “Monitor API Webhooks” —
  <https://docs.parallel.ai/monitor-api/monitor-webhooks>
- **[S16]** Parallel, “Parallel API FAQs” —
  <https://docs.parallel.ai/resources/faqs>
- **[S17]** Parallel, “API Rate Limits” —
  <https://docs.parallel.ai/getting-started/rate-limits>
- **[S18]** Parallel, “API Error Codes and Warnings” —
  <https://docs.parallel.ai/resources/warnings-and-errors>
- **[S19]** Parallel, “Use Parallel Memory to Build on Past Research” —
  <https://docs.parallel.ai/resources/memory>
- **[S20]** Parallel Web Systems, “Privacy Policy” —
  <https://parallel.ai/privacy-policy>
- **[S21]** Parallel Web Systems Inc., “Customer Terms and Conditions” —
  <https://parallel.ai/customer-terms>
- **[S22]** Parallel, “Monitor Migration Guide: Alpha to GA” —
  <https://docs.parallel.ai/monitor-api/monitor-migration-guide>

## Confidence summary

| Area | Confidence | Basis |
|---|---|---|
| V1 definition and endpoint shapes | High | Current generated OpenAPI plus GA guides |
| Resource lifecycle and interval bounds | High | Explicit create/update/cancel/trigger contracts |
| Execution schedule semantics | Low | Anchor, jitter, overlap, retries, and run state absent |
| Event/snapshot output semantics | High | Typed event schemas and examples agree on core shapes |
| Materiality and semantic dedup mechanism | Low | Qualitative product claims only |
| Freshness guarantees | Low | No Monitor fetch policy or temporal SLA; source-policy contradiction |
| Evidence field shape | High | OpenAPI explicit; actual completeness/calibration untested |
| Temporal provenance completeness | High confidence that it is incomplete | Required timestamps/content versions are absent from schema |
| Webhook signing/retry | High | Detailed first-party Standard Webhooks guide |
| Pricing | High for list price; low for edge-case billing | Per-execution CPM explicit; failures/retries/backfill unspecified |
| Privacy/retention | Medium-low | Memory/legal facts explicit, ordinary Monitor retention and training terms unresolved |
| Architecture inference | Medium | Strong behavioral evidence, no internal implementation access |
