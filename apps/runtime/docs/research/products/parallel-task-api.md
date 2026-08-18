# Parallel Task API: clean-room reverse-engineering dossier

**Research date:** 2026-08-17  
**Source access date:** 2026-08-17 for every web source  
**Scope:** Parallel Web Systems' **Task API only**. Search and Responses are
mentioned only to prevent contract conflation or where Parallel explicitly says
Task uses underlying retrieval components.  
**Status:** research and architecture guidance, not an implementation,
integration, benchmark, purchase, deployment, or legal opinion.

## Executive decision

Parallel Task is a durable, asynchronous, fixed-price web-research operation,
not a search-results endpoint and not the synchronous Responses interface. A
caller declares an input, processor, and optional output contract; Parallel
plans and executes retrieval, extraction, reasoning, validation, and synthesis;
the caller later receives typed text or JSON plus field-scoped evidence. Public
2026 architecture material further describes a budget-aware, code-orchestrated
research harness with a networkless sandbox, injected search/extract functions,
persistent interpreter state, context compaction, and synthesis as budget runs
low. [S1-S6]

The strongest patterns for Curiosity are:

1. a durable asynchronous run separate from its result;
2. declarative output shape rather than imperative retrieval instructions;
3. field- and element-scoped evidence alongside, not embedded inside, content;
4. observable planning/search progress without making progress prose the
   authoritative execution record;
5. price/quality presets translated at the provider boundary; and
6. a research harness that keeps raw intermediate material outside the
   orchestrating model's conversation while retaining caller-owned bounds.

The Task contract is nevertheless not bounded enough to control Curiosity's own
autonomous loop. It exposes no caller-selected step, query, source, token, tool,
wall-clock, or hard spend ceiling; no stopping reason; no documented create
idempotency; and no Task cancellation operation despite cancellation states in
the schema. Citations omit retrieval timestamps and immutable content identity.
Monthly spend limits only notify. Stateful interactions, Memory, indefinite
Task Group storage, externally callable MCP tools, and contradictory
customer-data training statements require explicit governance. [S2][S7-S18]

**Overall verdict — ADAPT, do not adopt as Curiosity's control plane (high
confidence).** Task is a useful provider adapter for bounded, explicitly
authorized research jobs. Its opaque processor budget and provider-held state
must not become Curiosity's curiosity authority, evidence ledger, or aggregate
budget.

## 1. Decision frame, boundaries, and method

### 1.1 Bounded question

What can Curiosity learn from the publicly observable Parallel Task API while
keeping provider-neutral planning, authority, budgets, evidence custody, and
stopping under Curiosity's control?

Sub-questions:

1. What exactly constitutes a Task request, run, result, and batch?
2. Which lifecycle, delivery, error, retry, and billing semantics are
   contractual, contradictory, or absent?
3. Where do planning, web search, extraction, computation, synthesis, and
   schema validation appear to occur?
4. What bounds work and what only describes a quality/price preset?
5. How traceable are outputs to evidence, source versions, and execution
   events?
6. What freshness, privacy, retention, safety, and legal constraints affect a
   production adapter?
7. Which patterns should Curiosity adopt, adapt, reject, or defer?

### 1.2 Product boundary

| Surface | Relevant contrast only |
|---|---|
| **Task API** | Stateful asynchronous run; declarative text/JSON research output; field Basis; processor prices from $0.005 to $2.40 per successful run; documented latency 10 seconds to 2 hours. |
| Search API | Separate synchronous ranked-page/excerpt product. It is not the Task result contract. |
| Responses API | Separate synchronous, OpenAI-compatible researched-answer product with a 5–60 second published latency band. It is not a Task alias. |

Parallel's own current pricing matrix makes these separate products with
different inputs, outputs, latency, reasoning, and prices. Task's 2026 harness
article says Task is built over proprietary Search and Extract infrastructure;
that is an internal dependency claim, not API equivalence. [S5][S7]

**RECOMMENDATION (high):** model `research_task` independently from
`web_search`, `extract`, and conversational `response`. A convenience workflow
may compose them, but a provider adapter must not normalize all four to a
generic “search” call.

### 1.3 Method and evidence labels

This is clean-room analysis of public first-party documentation, OpenAPI
renderings, product/changelog articles, crawler disclosures, pricing, privacy
policy, and customer terms. No account, API key, paid call, browser automation,
access-control bypass, SDK/package inspection, benchmark execution, hidden
endpoint discovery, or proprietary-code inspection was used.

- **FACT** — directly documented by a cited first-party source. This means
  confidence that Parallel publishes the claim, not independent verification.
- **INFERENCE** — architecture interpretation supported by public contracts or
  disclosures, not a claim about undisclosed internals.
- **RECOMMENDATION** — Curiosity design conclusion.
- **UNKNOWN** — materially unestablished in reviewed public sources.
- Confidence is **high**, **medium**, or **low**.

**Stop condition:** every requested category has a sourced fact, bounded
inference, unknown, and Curiosity implication; stop when remaining questions
require provider confirmation, credentials, paid testing, or prohibited
implementation discovery.

## 2. Task contract

### 2.1 Create request

**FACT (high).** `POST /v1/tasks/runs` requires API-key authentication and two
body fields: `processor` and `input`. `input` is a string or arbitrary JSON
object. The endpoint returns HTTP 202 immediately with a `TaskRun` in `queued`
state. [S1]

Optional request controls are:

| Field | Contract and implication |
|---|---|
| `task_spec` | Optional input schema and required-within-spec output schema. If omitted, the OpenAPI says output defaults to auto schema. |
| `metadata` | Caller tracking data; OpenAPI describes key/value maxima of 16/512 characters, although its value schema also permits primitive non-strings. |
| `source_policy` | Domain inclusion/exclusion and an OpenAPI `after_date`; see the freshness contradiction below. |
| `advanced_settings.location` | ISO 3166-1 alpha-2 search geography. No other Task advanced setting is currently exposed. |
| `memory_scope_key` | A 1–128 character application-memory scope identifier. Omission uses personal memory “if available” according to the OpenAPI description. |
| `previous_interaction_id` | Carries prior interaction context into a new, separately billed run. |
| `mcp_servers` | Remote Streamable-HTTP MCP servers, credentials/headers, and optional tool allowlists. |
| `enable_events` | Enables recorded progress; cannot be enabled after creation; defaults on for `pro` and above. |
| `webhook` | Completion callback URL and currently only `task_run.status`. |

The accepted run contains `run_id`, `interaction_id`, `status`, `is_active`,
`processor`, timestamps, and optional warnings/error/metadata/group ID. [S1]

**UNKNOWN / negative result (high relevance):** the create contract contains no
idempotency key, caller request ID with documented deduplication semantics,
deadline, priority, maximum cost, or cancellation-on-disconnect flag. Metadata
is not documented as an idempotency mechanism. A retry after an ambiguous
transport failure can therefore create duplicate billable work.

### 2.2 Task Spec and result shape

**FACT (high).** `TaskSpec.output_schema` accepts:

- a bare descriptive string (equivalent to a text schema);
- `{type: "text", description?}` for prose/Markdown;
- `{type: "json", json_schema: ...}` for a restricted JSON Schema object; or
- `{type: "auto"}`; omission of the entire Task Spec is also auto. [S1][S8]

An optional input schema describes expected input. Documentation presents it as
validation guidance, but warnings—not necessarily hard rejection—can result
when input fails validation. Field descriptions are explicitly treated as the
primary per-field prompt and can specify sources, formats, and unknown/null
behavior. [S8][S19][S20]

JSON output restrictions include an object root with `properties`, no root
`anyOf`, maximum nesting depth 5, maximum 100 total properties, 500 enum values,
15,000 characters for the Task Spec, and 25,000 characters for Task Spec plus
input. All fields required and `additionalProperties: false` are warnings or
recommendations in the guide, not both hard schema rules. Numerous ordinary
validation keywords—including `format`, length, item-count, numeric-bound,
pattern, uniqueness, and unevaluated-property constraints—are unsupported.
[S8]

**CONTRADICTION:** the generic error page tells callers to reduce nesting to
three levels or fewer, while the Task Spec guide states a hard maximum of five.
Use the specific Task Spec guide as the working contract, but integration checks
must verify actual validation. [S8][S19]

**FACT (high).** `GET /v1/tasks/runs/{run_id}/result` returns a discriminated
output:

- `type: "text"`, string `content`, and `basis`; or
- `type: "json"`, object `content`, `basis`, and an `output_schema` only when
  auto generated it.

Both may also include `mcp_tool_calls`. [S2]

**CONTRADICTION:** Task Spec says Deep-Research-style auto output requires
`pro` or above, while the create OpenAPI says omission universally defaults to
auto and the quickstart presents auto as a general output type. Best Practices,
in turn, says omitting Task Spec can produce plain text. The Deep Research guide
says auto is the default for `pro` and `ultra` families. Behavior below `pro`
and omission semantics are not reliable from documentation alone.
[S1][S8][S20][S21][S31]

**RECOMMENDATION (high):** accept the vendor's schema only as a requested output
contract. Validate the actual result again, preserve warnings, and distinguish
schema conformance from factual verification. Keep a provider-neutral schema
subset narrower than any one vendor's mutable subset.

## 3. Asynchronous lifecycle and delivery

### 3.1 Observable state machine

The current OpenAPI enum is:

```text
queued -> running -> completed
   |         |          (terminal result available)
   |         +-------> failed
   +---------------> failed

additional enumerated states:
action_required, cancelling, cancelled
```

**FACT (high).** The schema enumerates `queued`, `action_required`, `running`,
`completed`, `failed`, `cancelling`, and `cancelled`. It defines `is_active` as
true only for `queued`, `running`, and `cancelling`. [S1][S3]

**CONTRADICTION:** the lifecycle guide documents only
queued/running/completed/failed and no transitions involving the other three
states. No reviewed Task page explains what action is required, how a caller
supplies it, or how cancellation starts. `action_required` is also excluded
from the schema's `is_active` set without being described as terminal. [S1][S4]

The Deep Research guide additionally says an initial create response has
`status: running`, whereas the create OpenAPI promises an immediate `queued`
run. Clients should accept either nonterminal state and use the OpenAPI enum,
not code against the example prose. [S1][S21]

**UNKNOWN / negative result:** the public documentation index and current Task
OpenAPI references expose no Task cancel endpoint. This is especially notable
because FindAll and Monitor have explicit cancel operations in the same index.
Cancellation states may be internal, legacy, future-facing, or reachable only
out of band; public evidence does not establish which. [S22]

### 3.2 Status, input, and result retrieval

- `GET /v1/tasks/runs/{run_id}` returns status only; output is deliberately on
  `/result`. [S3]
- `GET /v1/tasks/runs/{run_id}/input` returns the original input and run
  configuration. This proves that input is durably retrievable for at least
  some period, but no ungrouped-run retention duration is published. [S23]
- `GET /v1/tasks/runs/{run_id}/result` blocks until completion. Its query
  `timeout` defaults to 600 seconds; HTTP 408 says the request timed out while
  the run remains active. [S2]
- A successful result is HTTP 200. The result endpoint's HTTP 404 description
  conflates “run failed” with “run id not found,” so clients should retain the
  run-status object's structured error where possible. [S2]

**RECOMMENDATION (high):** use an explicit local state machine with a deadline.
Treat result-wait timeout as a client observation, not job cancellation. Record
the accepted run before waiting, and reconcile final state separately.

### 3.3 Run-level SSE

**FACT (high).** `GET /v1/tasks/runs/{run_id}/events` can emit:

- `task_run.state`, including final output on successful completion;
- `task_run.progress_stats`, with aggregate source counts and a sample;
- `task_run.progress_msg.plan|tool|result|exec_status|search`;
- `error` events.

Search messages surface objectives and generated query strings. `base` and
above emit search events; reasoning-style messages may be limited on `lite`.
Streams remain open for 570 seconds. A late or reconnected client receives the
complete recorded progress-message sequence, the latest aggregate statistics,
and eventually the final state. [S9]

Run streams have no cursor or sequence number and are explicitly not resumable
from an offset. Reconnection replays earlier messages. Only the latest aggregate
progress statistics are delivered, not their history, and traces may cease to
be streamable after completion. [S9]

**INFERENCE (high):** SSE is an observability trace, not a deterministic event
log. Human-readable plan/tool/result messages, samples, replay, and missing
sequence IDs cannot prove the exact action graph or all sources processed.

**RECOMMENDATION (high):** deduplicate replayed events using a local composite
identity, but never invent a provider sequence. Persist raw timestamps and mark
progress text as advisory. The durable run/result endpoints remain the source
of lifecycle truth.

### 3.4 Webhooks

**FACT (high).** A Task webhook currently emits `task_run.status` when a run
finishes successfully or fails. The payload is the TaskRun status and metadata,
not the research result; consumers fetch `/result` after notification. [S10]

Parallel follows Standard Webhooks conventions: `webhook-id`, Unix
`webhook-timestamp`, and HMAC-SHA256 over ID, timestamp, and exact body. Failed
delivery starts retrying after 5 seconds with exponential backoff over multiple
attempts for up to 48 hours. Duplicate events can occur and should be
deduplicated by `webhook-id`. [S11]

**UNKNOWN:** exact retry count, maximum delay, HTTP timeout, timestamp tolerance,
payload retention, destination egress restrictions, and whether terminal
`cancelled` would generate the status webhook are not stated.

### 3.5 Task Groups

**FACT (high).** Task Groups are batch containers, not one multi-branch research
run. A caller creates a group and can add up to 1,000 independent runs per POST,
keep adding runs indefinitely, inspect aggregated status counts, obtain a
snapshot SSE stream of runs, or consume live group completion events. [S12]

Group run-snapshot and group-event streams have `event_id` cursors; unlike
run-level SSE, they are resumable. Group streams expose run state/final output
but not the individual run reasoning trace. Runs in a Task Group are documented
as stored indefinitely, although Parallel still recommends persisting final
results. [S12]

**CONTRADICTION / negative result:** the top-level OpenAPI product description
advertises “group-level retry and error aggregation,” but the public Task Group
endpoint list and guide expose no group retry operation. Error aggregation is
observable; server-side retry control is not established. [S1][S12][S22]

**RECOMMENDATION (high):** do not mistake batching for an execution DAG. Retain
per-run admission, budget, evidence, and retry state; use group cursors only for
delivery efficiency.

## 4. Planning, search, extraction, computation, and synthesis

### 4.1 What the public contract reveals

**FACT (high).** Parallel describes Task as orchestrating “querying, ranking,
retrieval, reasoning, validation, and synthesis” from a declarative objective
and processor budget. The quickstart says Task combines inference, web search,
and live crawling. Deep Research documentation describes intent
interpretation, multi-step web exploration, synthesis, and citation/confidence
generation. [S5][S6][S21]

Run SSE surfaces a plan narrative, search objectives/queries, tool messages,
intermediate findings, numbers of sources considered/read, and a final output.
This is direct evidence of iterative activity at the interface, but it does not
expose a stable plan object, branch IDs, hypotheses, or evidence-sufficiency
test. [S9]

### 4.2 2026 Task API Harness disclosure

Parallel's April 2026 architecture article provides unusually concrete
first-party detail: [S6]

1. Task uses proprietary Search and Extract infrastructure.
2. An orchestrating model generates Python that calls injected research tools
   as ordinary functions rather than ordinary model tool-call turns.
3. Code runs in a Rust-built, sandboxed Python interpreter with no direct
   network, filesystem, or operating-system access.
4. Search, extract, and state-management functions are the sandbox's explicit
   outside-world boundary.
5. Raw intermediate data can remain in persistent interpreter variables while
   only selected block output returns to model context.
6. Multiple searches, extractions, parsing operations, branches, and analyses
   can occur inside one code-execution step.
7. Conversation history is compacted as it grows while interpreter variable
   state remains available.
8. The harness monitors cumulative token spend across orchestrator and
   sub-model calls; when remaining budget is low it warns the model, and near
   exhaustion the model synthesizes what it has.

This replaces a naïve “one model step = one tool call” mental model. One visible
iteration may contain many retrieval operations, and output-token counts cannot
reconstruct internal cost or activity.

**Scope caveat (medium):** this is Parallel's description of its new Task API
Harness and benchmark architecture, not an independently audited guarantee that
every tier and every production run follows exactly the same topology. The
wire contract does not name the orchestrating model, sub-models, interpreter
version, tool limits, or compaction algorithm.

### 4.3 Clean-room architecture model

The most defensible model is:

```text
Task input + Task Spec + processor + policies
                     |
                     v
          durable run / queue / scheduler
                     |
                     v
          budget-aware planner/orchestrator
             |                    |
             | generated code     | progress messages/stats
             v                    v
     isolated persistent sandbox -----> run SSE
        | injected calls only
        +--> search/rank candidates
        +--> fetch/extract selected sources
        +--> local parse/filter/aggregate/branch
        +--> external MCP tools, if authorized
                     |
          compact / compare / reconcile
                     |
         synthesize as budget approaches stop
                     |
       schema generation/conformance/validation
                     |
       text|JSON content + Basis + tool-call record
                     |
             durable terminal result
```

**INFERENCE (high):** planning, retrieval, extraction, computation, and final
synthesis are separable internal concerns even though Task intentionally hides
them behind one declarative operation. This separation enables resource
allocation and context control, but the public API exposes observations rather
than caller authority over those stages.

**UNKNOWN:** exact ranker, model vendors/topology, number of concurrent
branches, source deduplication, canonicalization, query-rewrite policy,
authority scoring, parser/rendering behavior per media type, sub-model roles,
confidence model, and schema-repair loop.

## 5. Budgets, stopping, price, and quotas

### 5.1 Processor presets

Current API-specific documentation lists the following standard processors:

| Processor | Published latency | Approx. maximum fields | Price/run |
|---|---:|---:|---:|
| `lite` | 10–60 s | ~2 | $0.005 |
| `base` | 15–100 s | ~5 | $0.01 |
| `core` | 1–5 min | ~10 | $0.025 |
| `core2x` | 1–10 min | ~10 | $0.05 |
| `pro` | 2–10 min | ~20 | $0.10 |
| `ultra` | 5–25 min | ~20 | $0.30 |
| `ultra2x` | 5–50 min | ~25 | $0.60 |
| `ultra4x` | 5–90 min | ~25 | $1.20 |
| `ultra8x` | 5 min–2 h | ~25 | $2.40 |

Each has a `-fast` variant at the same price, published as roughly 2–5 times
faster while giving speed priority over the standard variant's highest
freshness. `ultra8x-fast`, for example, is listed at 1 minute–1 hour. “Max
fields” is explicitly approximate and varies with field complexity. [S7][S13]

Pricing is per successfully completed run, not per field; failed runs are not
billed. The price is therefore a predictable successful-run charge, not a
description of sources, tokens, or actions consumed. [S7]

**CONTRADICTION:** the marketing pricing page still says Task latency is
5 seconds–30 minutes and caps Ultra-family rows around 30 minutes, while the
API-specific current docs extend to 2 hours. Use API-specific processor/pricing
documentation and a written commercial order. The Deep Research guide itself
also says “up to 45 minutes,” “up to 15 minutes,” and uses a one-hour client
wait in different passages; these are integration examples, not server-side
limits. [S7][S21][S24]

### 5.2 Actual stopping semantics

**FACT (high as vendor disclosure).** Parallel says each processor carries a
budget across compute and retrieval. The 2026 harness monitors cumulative token
cost over iterations and all model calls rather than enforcing a uniform step
cap; low remaining budget triggers warnings and near exhaustion triggers final
synthesis from gathered findings. Higher Ultra multipliers provide larger
budgets and permit more research paths. [S5][S6]

**UNKNOWN (high relevance):** no public Task request exposes or promises:

- maximum searches, extracts, sources considered/read, or citations;
- maximum iterations, concurrent branches, generated-code executions, or MCP
  calls;
- token/model/compute units assigned to a processor;
- hard server wall-clock deadline or caller deadline;
- sufficiency, saturation, contradiction, or novelty stopping criterion;
- stopping reason, budget consumed/remaining, or partial result on exhaustion;
- caller-set per-run spend ceiling.

SSE source/query counts are after-the-fact observations, not admission bounds.
Latency ranges are service expectations, not documented hard timeouts. [S7][S9]

For configured MCP, docs say `lite` and `core` invoke at most one tool, while
“all other processors” may make multiple calls. That wording oddly omits a
specific bound for `base` and every higher tier; multiple is not a ceiling.
[S25]

**RECOMMENDATION (high):** map processor to a provider-specific quality/cost
hint. Curiosity must still enforce local submission count, deadline, maximum
provider charge, allowed capability set, and duplicate suppression. A run can
continue after Curiosity stops waiting unless cancellation becomes available.

### 5.3 Rate and spend controls

The dedicated rate-limit page sets Tasks/Task Groups at 2,000 **run-creating
POSTs** per minute and says GET status/result calls do not count. The older Task
lifecycle page says the 2,000 limit applies across all Task POST and GET calls.
The more specific central page is the working interpretation, but this remains
a documentation contradiction. [S4][S14]

Parallel reserves estimated cost as in-flight balance before execution. Large
Task Groups reserve all runs up front; insufficient available balance returns
402 even when total account balance is positive. [S19]

Organization/app monthly spend limits are whole-dollar, reset monthly, and
**notify only**: requests continue after the limit. [S16]

**RECOMMENDATION (high):** use a local hard cost ledger and admission semaphore.
Include duplicate create attempts, external MCP/browser charges, webhook
processing, storage, and any downstream verification work; provider list price
alone is not total execution cost.

## 6. Evidence, citations, confidence, and auditability

### 6.1 Research Basis contract

Every successful Task output has a `basis` array. A `FieldBasis` contains:

- `field`: output field/path;
- `citations`: source URL, optional title, and optional supporting excerpts;
- `reasoning`: generated explanation of selection, reconciliation, calculation,
  or judgment; and
- nullable `confidence`, described with low/medium/high semantics. [S2][S15]

Text output's basis uses a single `output` field. JSON basis defaults to
top-level fields. The `parallel-beta: field-basis-2025-11-25` header adds
per-array-element entries using paths such as `key_executives.0`. [S2][S15]

**CONTRADICTION:** the current Research Basis guide says all processors provide
confidence and excerpts; the OpenAPI still says only certain processors do and
keeps confidence/excerpts nullable; the marketing pricing breakdown lists full
Basis only from `core` upward. The October 2025 changelog says all processors
were upgraded. Consumers should trust the nullable wire schema and feature
detect, regardless of current product intent. [S2][S15][S22][S24]

**CONTRADICTION:** the Deep Research guide shows nested dot-path Basis without
mentioning the beta restriction and a sample with 124 content fields/610
citations, while the general Task Spec limits schemas to 100 properties and the
processor guide suggests ~25 fields at the highest tier. Auto-generated schema
and deep-research output may follow different limits, or the sample may reflect
older behavior; current public docs do not resolve this. [S8][S13][S21]

### 6.2 What Basis proves—and does not prove

**FACT (high).** Basis is explicitly claim/field-adjacent evidence. It is more
auditable than only inline answer links because a consumer can inspect the
sources and excerpts selected for each output field. The provider warns against
asking the model to create duplicate citation/reasoning fields because built-in
Basis is more structured and described as more reliable. [S15][S19]

**INFERENCE (high).** Basis is not complete provenance or proof:

- `reasoning` is generated rationale, not an execution replay;
- confidence is provider-reported and cannot establish correctness;
- a URL/excerpt can support only part of a compound field;
- source inclusion does not prove authority, independence, or entailment;
- the contract has no retrieval timestamp, content hash, capture/snapshot ID,
  passage offsets, extraction version, acquisition mode, or robots decision;
- it does not list every considered/read source or show why alternatives were
  rejected.

Parallel's 2025 calibration article reports differentiated error rates by
confidence on its own composite datasets, but datasets/evaluator are not fully
published and tests predate current processors/harness. This is a vendor
calibration claim, not evidence that a given output is correct or that current
labels remain calibrated. [S26]

**RECOMMENDATION (high):** adapt Basis into Curiosity's evidence model while
adding:

1. provider/run/interaction IDs and exact field path;
2. retrieval time, acquisition mode, and requested freshness policy;
3. lawful retained artifact or content hash where policy permits;
4. explicit support/contradiction/insufficient-evidence relation;
5. provider confidence namespaced separately from Curiosity verification;
6. source authority/independence assessment outside the provider;
7. preservation of null, missing, and conflicting evidence; and
8. re-fetch/revalidation when decisions require current evidence.

## 7. Freshness and source acquisition

**FACT (high as documentation):**

- Task combines web search with live crawling, and Parallel says Task research
  can be current to the day and access live links at query time. [S16][S31]
- Standard processors prioritize the highest freshness; fast variants prioritize
  speed while described as “very fresh.” Standard is recommended for breaking
  news, live prices, scores, and rapidly changing events. [S13]
- Domain `include_domains` is a hard allowlist and `exclude_domains` is a hard
  blocklist; together they are capped at 200. Apex matching includes
  subdomains, and bare suffixes such as `.gov` are accepted. [S1][S17]
- Source policy constrains retrieval eligibility; Parallel warns that it can
  reduce result quality. It is not a source-trust guarantee. [S17]

**MATERIAL CONTRADICTION:** Task's current OpenAPI `SourcePolicy` includes
`after_date`, but the dedicated Source Policy guide's support matrix marks
`after_date` as Search-only. The January 2026 changelog also announces it for
Search specifically. Do not rely on Task publication-date filtering until
Parallel confirms and a contract check succeeds. [S1][S17][S22]

Unlike the separate Search/Extract contracts, Task exposes no `max_age_seconds`,
cache/live selection, live-fetch timeout, or disable-stale-fallback control.
Standard-vs-fast is a coarse provider policy, not an auditable freshness bound.

**UNKNOWN:** per-source acquisition mode, actual crawl/fetch timestamp, cache
age, domain crawl cadence, publication-date accuracy, live-fetch failure
behavior, stale fallback, and whether every relevant source was live fetched.

**RECOMMENDATION (high):** phrase freshness as an output requirement but do not
pretend that does enforcement. For freshness-critical work, Curiosity should
own retrieval-time evidence or re-fetch cited sources under a separately
bounded Extract/retrieval operation.

## 8. Errors, retries, and recovery

### 8.1 Request and run errors

The common error guide labels:

| HTTP | Meaning | Published retry guidance |
|---:|---|---|
| 401 | missing/invalid key | no |
| 402 | insufficient available credit | no; resolve balance/reservations |
| 403 | unavailable/invalid processor | no |
| 404 | run/resource absent; result endpoint also says failed | no |
| 408 | blocking result wait timed out; run remains active | yes/poll |
| 422 | validation failure | no |
| 429 | rate/quota exceeded | exponential backoff |
| 500, 502, 503 | server/upstream/unavailable | backoff |

Error bodies contain a human-readable `message`, optional `detail`, and in the
OpenAPI a `ref_id`. Run objects also carry an error only when status is
`failed`. Warnings are nonfatal and may be `spec_validation_warning`,
`input_validation_warning`, or future-compatible generic types. [S1-S3][S19]

**CONTRACT DRIFT:** the lifecycle guide's old examples use plural `errors`,
embedded `result`, and `result_url`, while current OpenAPI uses singular
`error`, separates status from result, and has no such fields. Current OpenAPI
should govern. [S1-S4]

### 8.2 Safe retry boundary

**FACT/INFERENCE (high):** retrying GET status/result after 408/5xx is naturally
referential because it uses an existing `run_id`. Retrying a webhook handler is
safe only when deduplicated. Retrying create is not known to be idempotent and
can create another charged run. [S1-S3][S11]

Failed runs are not billed, but public pricing does not state billing for
cancelled runs, partially completed work, or two runs created by a duplicate
submission. No partial research result or checkpoint-restart contract is
documented.

**RECOMMENDATION (high):** classify operations:

- **safe to retry:** GET by stable ID, signature-verified webhook processing
  after local deduplication;
- **conditionally retry:** 429/5xx create only after checking whether the first
  request yielded a persisted run through caller-held correlation, which the
  current API does not guarantee;
- **do not blind retry:** validation, auth, processor, credit errors, or any
  ambiguous create timeout.

## 9. Privacy, retention, state, and safety

### 9.1 Provider-held state

**FACT (high):** every Task creates provider-held run state, and a dedicated
endpoint can retrieve its original input. Task Group runs are stored
indefinitely. The public docs do not publish ordinary ungrouped-run expiration
or deletion endpoints. [S12][S23]

Interactions pass prior context into later runs and work across processors.
They are unavailable to Zero Data Retention customers, demonstrating that this
feature depends on retained state. [S18]

Memory is distinct from Interactions:

- personal memory saves supported run inputs/outputs after an organization
  rollout and may be enabled by default for newly created organizations;
- turning it off stops new entries but retains old ones until permanent
  deletion;
- application memory is opt-in per request via `memory_scope_key` and isolated
  by that key;
- personal Memory does not automatically change API results; an agent must
  explicitly retrieve it. [S27]

The create OpenAPI's wording that omitting `memory_scope_key` uses personal
memory “if available” is ambiguous against the Memory guide's statement that
personal memory never changes Task results. The defensible interpretation is
that eligible runs may be recorded into personal Memory, not automatically
retrieved as research context, but this remains a provider-confirmation item.
[S1][S27]

### 9.2 Data location and training contradiction

Parallel says API data is encrypted in transit (TLS 1.2+) and at rest in
US-based data centers and claims SOC 2 Type I/II. Enterprise marketing advertises
ZDR and DPAs. The privacy policy's EU data-residency statement is expressly for
the **Search API endpoint**, not Task. [S16][S24][S28]

**MATERIAL CONTRADICTION:** FAQ says Parallel will “Never” train on customer
data. Current Customer Terms grant a perpetual, sublicensable improvement
license and expressly say Parallel may use Customer IP—including inputs and
outputs—to train and improve machine-learning/AI models, with training data not
linked to an individual. The legal terms also permit aggregated/de-identified
usage. The contract, negotiated order, DPA, and ZDR addendum—not FAQ prose—must
govern procurement. [S16][S29 §4(b)-(c)]

The terms require a separately executed DPA before processing personal data and
put rights/consent obligations on the customer. They disclaim output accuracy,
completeness, and currency and require independent review. [S29 §§4(d),5(b)]

### 9.3 Input leakage and output reuse

Task outputs can reflect or repeat private input. Parallel explicitly advises
against caching/reusing agent-product outputs across customers when sensitive
input was supplied. Customer Terms additionally constrain one query's output
primarily to one end customer and restrict cross-customer caching and database/
data-resale uses. [S20][S29 §§2(b)-(c),4(b)]

**RECOMMENDATION (high):** prohibit cross-tenant Task-output caching. Namespace
run, interaction, memory, webhook, and evidence storage by tenant and purpose.
Do not send sensitive input under self-serve assumptions; obtain written terms
for Task retention, deletion, ZDR scope, model training, subprocessors, and
region.

### 9.4 MCP and browser authority

**FACT (high).** A Task can be given up to ten remote Streamable-HTTP MCP
servers, request headers/credentials, and optional `allowed_tools`; `null`
allows all listed tools. Parallel first enumerates tools and lets the processor
invoke those it judges useful. Result output records tool ID, server, name,
arguments, returned content, or error. Authentication/listing failures may be
warnings while the overall Task still completes. [S1][S2][S25]

Parallel's Browser Use integration extends Task beyond public-web research to
authenticated sites, saved profiles, paywalls, internal dashboards, form
filling, clicking, and multi-step browser workflows. [S30]

Customer Terms put all risk for third-party rights, credentials, data exchange,
and **actions taken through third-party tools even when they do not align with
customer intentions** on the customer. [S29 §5(c)]

**UNKNOWN / negative result:** reviewed Task docs provide no first-class tool
approval request, dry-run mode, read-only/action capability classification,
per-tool call/spend ceiling, human checkpoint, prompt-injection defense,
credential-lifetime statement, or explanation tying `action_required` to MCP.

**RECOMMENDATION (high):** treat MCP/browser Task as a separate high-risk
capability. Default deny; use minimal tool allowlists, read-only credentials,
network egress controls, no ambient browser profile, tool-specific budgets,
and human authorization for side effects. Web pages and tool outputs remain
untrusted external data regardless of polished synthesis.

### 9.5 Legal clean-room boundary

Customer Terms prohibit deriving underlying systems/algorithms, probing,
scraping outside the API, model extraction, competitive uses, and publishing
benchmarks without consent. They also restrict high-impact automated decisions
in employment, healthcare, finance, legal, housing, insurance, and benefits
without human oversight. [S29 §§2(c),8(e)]

This study stayed on the permissible side of that boundary: it compares public
contracts and vendor disclosures, does not reconstruct proprietary code, does
not call the service, and makes no independent performance claim.

## 10. Curiosity architecture implications

### 10.1 Provider-neutral contract

Curiosity should represent a hosted research task with at least:

- caller intent and immutable local request ID;
- provider adapter and provider run/interaction IDs;
- declared output schema and independent validation result;
- local hard deadline, maximum successful-run charge, and submission count;
- allowed retrieval/tool capabilities and tenant scope;
- explicit freshness and source constraints;
- lifecycle state with normalized but provider-preserved raw status;
- event trace distinguished from durable state;
- final content, evidence records, warnings, errors, and stopping observation;
- retention/deletion policy and provider-state features enabled.

Parallel's processor name, Basis confidence, and Memory keys belong in the
Parallel adapter namespace, not the provider-neutral core.

### 10.2 Research-loop lesson

**ADAPT (high):** the 2026 harness architecture is a strong precedent for
keeping large retrieval artifacts and deterministic calculations outside model
conversation history. Curiosity can adapt the principle without copying
implementation:

```text
bounded frame
  -> explicit plan/branches
  -> retrieval tools with aggregate budget
  -> evidence store / deterministic workspace
  -> model receives selected observations
  -> compaction preserves references, not unsupported summaries
  -> stop on sufficiency, saturation, budget, deadline, or exhaustion
  -> synthesize with evidence graph and explicit stop reason
```

Unlike Parallel's public contract, Curiosity should make branch budgets,
aggregate consumption, stop reason, contradiction state, and partial-result
semantics caller-visible.

### 10.3 Hosted Task adapter posture

A Parallel Task adapter can be useful for explicitly authorized background
research when:

- fixed successful-run price is preferable to token-variable billing;
- output fields are known or a human-readable report is acceptable;
- provider retention/terms are approved;
- latency can span the selected processor range;
- local controls can tolerate lack of cancellation/idempotency; and
- Curiosity independently verifies high-consequence claims.

It should not be the mechanism that autonomously decides to create more Tasks,
escalate processors, attach MCP tools, reuse Memory, or continue after the
caller's bounded curiosity frame ends.

## 11. Decision ledger

### Adopt

1. **ADOPT — durable async separation (high).** Create acknowledgement, stable
   run ID, status resource, terminal result, and push/poll alternatives.
2. **ADOPT — product separation (high).** Research Task is not raw search,
   extraction, or synchronous response generation.
3. **ADOPT — declarative output contract (high).** Describe desired evidence
   product; validate returned output independently.
4. **ADOPT — field-scoped evidence (high).** Evidence belongs beside each
   output field/claim, including list elements.
5. **ADOPT — warnings as first-class data (high).** Nonfatal schema, input, or
   tool degradation must survive normalization.

### Adapt

1. **ADAPT — processor tiers (high).** Map them to adapter hints and known
   successful-run price; retain portable hard deadline/cost/capability bounds.
2. **ADAPT — code/workspace research harness (medium-high).** Keep raw state
   outside model context, but expose deterministic operations, budgets, and
   stop reasons rather than opaque them.
3. **ADAPT — Basis (high).** Add artifact identity, retrieval time, acquisition
   policy, conflict relations, and independent verification status.
4. **ADAPT — progress streaming (high).** Useful for observability; do not treat
   prose/replayed SSE as authoritative execution lineage.
5. **ADAPT — batch groups (high).** Use resumable cursors and aggregate status,
   but preserve per-run authority and avoid indefinite provider storage by
   default.
6. **ADAPT — interactions (medium).** Explicitly pass a bounded evidence/context
   package rather than depending on opaque retained conversation state.

### Reject

1. **REJECT — opaque processor as sufficient budget (high).** It does not bound
   time, sources, searches, branches, tools, or duplicate creates.
2. **REJECT — citation/confidence equals verification (high).** Basis is useful
   evidence metadata, not truth or immutable provenance.
3. **REJECT — notify-only spend limits as safety (high).** Admission must block
   locally before unauthorized spend.
4. **REJECT — automatic curiosity escalation (high).** No live loop may choose
   more Tasks or higher tiers without the declared frame and caller authority.
5. **REJECT — cross-tenant output caching (high).** It risks private-input
   leakage and conflicts with documented guidance/terms.

### Defer

1. **DEFER — MCP/browser mode (high).** Requires a separately approved action,
   credential, egress, prompt-injection, and third-party-terms design.
2. **DEFER — Memory (high).** Default enablement, retention, deletion, and
   OpenAPI/guide ambiguity require explicit policy and provider confirmation.
3. **DEFER — interactions under sensitive workloads (high).** Unavailable with
   ZDR and dependent on provider-held context.
4. **DEFER — quality/price-performance conclusions (high).** No authorized
   paid evaluation was run, and terms restrict benchmark publication.
5. **DEFER — Task `after_date` (high).** OpenAPI and support matrix conflict.

## 12. Unknowns and pre-integration checks

### 12.1 Provider questions

1. Is Task create idempotent under any header or organization setting?
2. Is there a supported Task cancellation endpoint, and what do
   `action_required`, `cancelling`, and `cancelled` mean?
3. Are cancelled/partially completed runs billed?
4. What are ungrouped Task input/result/event retention and deletion controls?
5. Does ZDR cover Task inputs, outputs, events, interactions, webhooks, logs,
   and MCP headers, and in which regions?
6. Does Task support `after_date` now, and what date detector/fallback applies?
7. Are confidence and excerpts contractually available on every processor?
8. What is auto-schema behavior below `pro`, and what limits govern generated
   auto schemas?
9. Are GETs quota-free despite the lifecycle-guide statement?
10. What webhook timeout, timestamp tolerance, retry count, and egress policy
    apply?
11. What server-side MCP call/action, cost, timeout, and credential-retention
    limits apply by processor?
12. How are personal Memory capture, `memory_scope_key`, and automatic context
    use separated?
13. Resolve FAQ “Never train” versus Customer Terms §4(b) in the controlling
    order/DPA/ZDR terms.

### 12.2 Authorized contract checks, not quality benchmarks

If a separately authorized credentialed integration occurs, verify with the
lowest-cost non-sensitive fixtures:

- create retry/timeout deduplication;
- exact state transitions and status/result error shapes;
- 408 behavior and GET quota headers;
- Task `after_date` acceptance and enforcement;
- lower-tier auto schema and Basis nullability;
- SSE replay/deduplication and post-completion availability;
- webhook duplication/signature/timestamp handling;
- schema limits at 3 versus 5 nesting levels;
- retention/deletion controls and Task Group persistence.

No such checks were executed here.

## 13. Bounded curiosity pass

After synthesis, unresolved threads were scored 1–5 for relevance (R), decision
value (V), novelty (N), and investigation cost (C; lower is better). Only
in-frame public-source work was authorized.

| Thread | R | V | N | C | Result |
|---|---:|---:|---:|---:|---|
| Current internal planning/search/extract/synthesis boundary | 5 | 5 | 5 | 1 | **Pursued:** 2026 Task Harness disclosure materially sharpened the architecture model. |
| Cancellation/idempotency/action-required semantics | 5 | 5 | 4 | 2 | **Pursued:** OpenAPI and docs index searched; remains negative/unknown. |
| Basis availability and nested granularity contradictions | 5 | 4 | 4 | 1 | **Pursued:** OpenAPI, guide, changelog, pricing, and Deep Research guide triangulated. |
| Task freshness enforcement / `after_date` | 5 | 5 | 4 | 1 | **Pursued:** direct OpenAPI-guide-changelog contradiction retained. |
| Customer-data training and retention | 5 | 5 | 5 | 1 | **Pursued:** FAQ, Memory, privacy policy, and controlling self-serve terms compared. |
| Exact model vendors, ranker, parser, compactor | 2 | 2 | 3 | 5 | **CURIOSITY_NO_GO:** proprietary internals, unnecessary for contract decision, and outside clean-room boundary. |
| Independent accuracy/confidence calibration | 4 | 4 | 3 | 5 | **CURIOSITY_NO_GO:** requires paid calls, benchmark authorization, and legal review. |
| SDK retry behavior/package inspection | 2 | 2 | 2 | 4 | **CURIOSITY_NO_GO:** wire contract is the decision target; package inspection adds little and was not authorized. |
| MCP/browser adversarial testing | 4 | 5 | 4 | 5 | **CURIOSITY_NO_GO:** requires credentials, external actions, and a separately approved safety frame. |
| Sales/enterprise contract discovery | 4 | 5 | 3 | 4 | **CURIOSITY_NO_GO:** not publicly resolvable; defer to procurement. |

**Stop reason:** coverage and saturation. Public primary sources now cover each
requested category and identify the material contradictions. Remaining gaps
require provider confirmation, commercial terms, or prohibited/out-of-scope
execution.

## 14. Primary sources

All sources accessed 2026-08-17.

- **[S1]** Parallel, “Create Task Run” OpenAPI reference —
  https://docs.parallel.ai/api-reference/tasks/create-task-run
- **[S2]** Parallel, “Retrieve Task Run Result” OpenAPI reference —
  https://docs.parallel.ai/api-reference/tasks/retrieve-task-run-result
- **[S3]** Parallel, “Retrieve Task Run” OpenAPI reference —
  https://docs.parallel.ai/api-reference/tasks/retrieve-task-run
- **[S4]** Parallel, “Task Runs Lifecycle” —
  https://docs.parallel.ai/task-api/guides/execute-task-run
- **[S5]** Parallel, “Introducing the Parallel Task API” —
  https://parallel.ai/blog/parallel-task-api
- **[S6]** Parallel, “A new deep research frontier on DeepSearchQA with the Task
  API Harness,” 2026 — https://parallel.ai/blog/deep-research
- **[S7]** Parallel, “Parallel API Pricing” —
  https://docs.parallel.ai/getting-started/pricing
- **[S8]** Parallel, “Task Spec” —
  https://docs.parallel.ai/task-api/guides/specify-a-task
- **[S9]** Parallel, “Task API Streaming Events” —
  https://docs.parallel.ai/task-api/task-sse
- **[S10]** Parallel, “Task API Webhooks” —
  https://docs.parallel.ai/task-api/webhooks
- **[S11]** Parallel, “Webhook Setup” —
  https://docs.parallel.ai/resources/webhook-setup
- **[S12]** Parallel, “Task Group” —
  https://docs.parallel.ai/task-api/group-api
- **[S13]** Parallel, “Processors” —
  https://docs.parallel.ai/task-api/guides/choose-a-processor
- **[S14]** Parallel, “API Rate Limits” —
  https://docs.parallel.ai/getting-started/rate-limits
- **[S15]** Parallel, “Research Basis” —
  https://docs.parallel.ai/task-api/guides/access-research-basis
- **[S16]** Parallel, “Parallel API FAQs” —
  https://docs.parallel.ai/resources/faqs
- **[S17]** Parallel, “Source Policy” —
  https://docs.parallel.ai/task-api/source-policy
- **[S18]** Parallel, “Interactions” —
  https://docs.parallel.ai/task-api/guides/interactions
- **[S19]** Parallel, “API Error Codes and Warnings” —
  https://docs.parallel.ai/resources/warnings-and-errors
- **[S20]** Parallel, “Task API Best Practices” —
  https://docs.parallel.ai/task-api/best-practices
- **[S21]** Parallel, “Task API Deep Research Quickstart” —
  https://docs.parallel.ai/task-api/examples/task-deep-research
- **[S22]** Parallel, documentation index and changelog —
  https://docs.parallel.ai/llms.txt and
  https://docs.parallel.ai/resources/changelog
- **[S23]** Parallel, “Retrieve Task Run Input” OpenAPI reference —
  https://docs.parallel.ai/api-reference/tasks/retrieve-task-run-input
- **[S24]** Parallel, marketing pricing page — https://parallel.ai/pricing
- **[S25]** Parallel, “MCP Tool Calling” —
  https://docs.parallel.ai/task-api/mcp-tool-call
- **[S26]** Parallel, “Introducing Basis with Calibrated Confidences” —
  https://parallel.ai/blog/introducing-basis-with-calibrated-confidences
- **[S27]** Parallel, “Use Parallel Memory to Build on Past Research” —
  https://docs.parallel.ai/resources/memory
- **[S28]** Parallel, “Privacy Policy” — https://parallel.ai/privacy-policy
- **[S29]** Parallel Web Systems Inc., “Customer Terms and Conditions” —
  https://parallel.ai/customer-terms
- **[S30]** Parallel, “Browser Use” —
  https://docs.parallel.ai/integrations/browseruse
- **[S31]** Parallel, “Task API Quickstart” —
  https://docs.parallel.ai/task-api/task-quickstart

## 15. Confidence summary

| Area | Confidence | Basis |
|---|---|---|
| Current create/status/result wire contract | High | First-party OpenAPI references; drift explicitly retained |
| Asynchronous delivery semantics | High | Dedicated SSE, webhook, and Task Group guides |
| Processor price and published latency | High for current docs; medium operationally | API pricing and processor pages agree; marketing conflicts |
| Internal harness architecture | Medium-high | Detailed first-party 2026 disclosure; not independently audited or guaranteed per tier |
| Exact budget/stopping limits | Low | Internal cumulative-budget approach disclosed, actual units and bounds absent |
| Basis schema | High | Explicit OpenAPI; feature availability remains contradictory |
| Citation correctness/calibration | Low | No authorized empirical validation; vendor benchmark only |
| Freshness controls | Medium-low | Broad current-day/live claims; Task-specific enforcement and acquisition metadata absent |
| Privacy/retention | Medium | Several explicit facts, but ordinary retention and training terms conflict materially |
| MCP/browser safety | Medium | Authority surface is explicit; protective controls and failure limits are largely undocumented |
| Production fitness for Curiosity | Medium-low | No credentialed contract checks, commercial order, or legal approval |
