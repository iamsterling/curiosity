# Parallel Web Systems: Search, Extract, and Task APIs

**Research date:** 2026-08-17  
**Source access date:** 2026-08-17 for every source unless noted otherwise  
**Method:** clean-room analysis of public documentation, public OpenAPI descriptions,
product pages, legal terms, and crawler disclosures. No account, credential, paid API
call, access-control bypass, package inspection, or implementation inspection was used.

## Decision frame

This note asks a bounded question: **what should Curiosity learn from Parallel's public
retrieval and asynchronous research contracts without conflating distinct products or
copying proprietary implementation?**

Sub-questions:

1. What are the externally observable contracts of Search, Extract, and Task?
2. How are evidence, freshness, compute budget, completion, and failure represented?
3. What public evidence supports an owned index and crawler, and what remains unknown?
4. Which safety, privacy, retention, legal, and operational constraints matter to a
   provider-neutral Curiosity adapter?
5. Which ideas should Curiosity adopt, adapt, reject, or defer?

**Epistemic labels used below:**

- **FACT** — directly stated by a cited primary source.
- **INFERENCE** — an architecture interpretation consistent with public behavior, not a
  claim about undisclosed internals.
- **RECOMMENDATION** — a Curiosity design conclusion.
- **UNKNOWN** — not established by the reviewed public sources.

## Executive verdict

Parallel exposes a useful three-layer separation:

1. **Search** is synchronous ranked retrieval: queries and an optional semantic
   objective in; ordered pages and compressed excerpts out. It does not synthesize an
   answer and exposes no per-result relevance score. [S1][S2]
2. **Extract** is synchronous URL retrieval and compression: known URLs in; focused
   markdown excerpts and optionally full markdown content out. It is not discovery or
   research synthesis. [S3][S4]
3. **Task** is a stateful asynchronous research job: input, processor, optional output
   contract and policy in; later, typed content plus field-level research basis out.
   Parallel says it plans retrieval, fetches sources, reasons, validates, and synthesizes
   within a processor-specific compute/retrieval budget. [S5][S6][S7]

The strongest lessons are the product boundary, declarative output schemas, durable
asynchronous run IDs, explicit source/freshness policy, and field-scoped evidence.
Curiosity should not copy Parallel's opaque tier names as its provider-neutral budget
contract, treat generated confidence as ground truth, or assume a citation is complete
provenance. Parallel exposes neither source content hashes nor retrieval timestamps, and
its public Task contract provides no caller-selected maximum source count, wall-clock
deadline, or hard per-run spend ceiling. Confidence: **high** on contracts; **medium** on
architecture inferences.

## Keep the products separate

| Product | Discovery | Fetch/extract | Synthesis/reasoning | Execution | Canonical output |
|---|---:|---:|---:|---|---|
| Search API | Yes | Excerpts for discovered pages | No answer | Synchronous, ~200 ms–3 s | Ordered URL/title/publish-date/excerpts |
| Extract API | No; caller supplies URLs | Yes, excerpts and optional full content | No answer | Synchronous | Per-URL markdown content/errors |
| Task API | Internally | Internally, including live crawling | Yes | Asynchronous, ~10 s–2 h by current processor schedule | Text or JSON content plus field basis |
| Responses/Chat | Internally | Internally | Yes, conversational answer | Synchronous | Answer with citations |
| FindAll/Entity Search/Monitor | Entity discovery or monitoring | Product-specific | Product-specific | Mixed | Matches or events |

**FACT:** Parallel's own pricing matrix distinguishes Search, Extract, Task, Responses,
Monitor, FindAll, Entity Search, and Chat by inputs, outputs, latency, and reasoning.
[S8] Search retrieves pages across the web; Entity Search is specifically a people and
company product. [S2]

**RECOMMENDATION:** Curiosity's provider-neutral interfaces should preserve at least
`search`, `extract`, and `research_task` as separate capabilities. A convenience
orchestrator may compose them, but adapters should not pretend that excerpts, full page
content, and researched answers are the same artifact.

## Search API contract

### Request

`POST /v1/search` requires API-key authentication and `search_queries`; `objective` is
optional. The current request shape includes: [S1]

- `search_queries: string[]`: concise keyword queries. Guidance says 1 is required,
  2–3 is best, maximum 5, and extras after 5 are dropped with a warning. Each query is
  documented as at most 200 characters. [S9]
- `objective?: string`: self-contained semantic goal; guidance documents a 5,000
  character maximum. [S9]
- `mode?: turbo | fast | basic | advanced`; default is `advanced`. [S1][S10]
- `max_chars_total?`: upper bound across returned excerpts.
- `session_id?`: correlates related Search/Extract calls and may improve subsequent
  contextual results; the response always returns one. Maximum 1,000 characters. [S1]
- `client_model?`: lets Parallel tailor defaults to the consuming model.
- `advanced_settings`: source policy, fetch policy, excerpt sizing, location, and
  result count.

Advanced controls include: [S1][S11]

- hard `include_domains` or `exclude_domains`, with a combined 200-domain limit;
- `after_date` as a publication-date lower bound;
- `fetch_policy.max_age_seconds`, minimum 600 seconds;
- live-fetch timeout and `disable_cache_fallback`;
- `max_chars_per_result`, ISO country `location`, and `max_results` (default 10).

**FACT:** Cached indexed content is the Search default. A fetch policy can trigger live
retrieval when indexed content is too old; unless cache fallback is disabled, an older
cached version may be returned after live-fetch failure or timeout. [S1][S11]

### Response

The response contains `search_id`, `session_id`, ordered `results`, optional `warnings`,
and optional SKU `usage`. A result contains `url`, optional `title`, optional
`publish_date`, and markdown `excerpts`. Results are ordered by decreasing relevance,
but there is no numeric score. [S1]

What is deliberately absent:

- no synthesized answer;
- no full page body (use Extract);
- no relevance score;
- no source content hash, fetch timestamp, index timestamp, cache age, or robots-policy
  decision;
- no image result contract. [S12]

**RECOMMENDATION:** Preserve returned order and do not manufacture scores. Normalize
`publish_date` as publisher metadata, not retrieval time. Store warning and usage arrays,
the provider search ID, session ID, mode, requested freshness policy, and whether stale
fallback was permitted.

### Search modes as retrieval budgets

| Mode | Vendor positioning | Published latency | Price / 1,000 default requests |
|---|---|---:|---:|
| `turbo` | highest-volume grounding/simple lookup | ~200 ms | $1 |
| `fast` | high quality inside a 1-second budget | <1 s | $1 |
| `basic` | general agent retrieval | ~1 s | $5 |
| `advanced` | deeper retrieval/compression, multi-hop agent use | ~3 s | $5 |

Default requests include 10 results; each additional page result/excerpt is published at
$1 per 1,000. [S8][S10]

**INFERENCE:** `mode` is a compound quality-of-service preset over candidate generation,
reranking, and compression rather than a portable scalar budget. Parallel explicitly says
Advanced spends more time querying, reranking, and compressing across general and
specialized indexes. [S13] Confidence: **high** that the preset is compound; **unknown**
which algorithms or exact resource limits each preset uses.

**RECOMMENDATION:** Map these modes in a Parallel adapter, but keep Curiosity's core
budget explicit: deadline, maximum results, maximum returned characters/tokens, freshness
requirement, and cost ceiling. Provider modes should remain adapter hints.

## Extract API contract

**FACT:** Extract is a distinct `POST /v1/extract` service. It accepts public URLs and an
optional objective/search queries, supports JavaScript-heavy pages and PDFs, and returns
focused markdown excerpts or optional full markdown content. [S3]

Freshness and size behavior: [S4]

- default: focused excerpts from cached indexed content;
- live fetch: selected with `max_age_seconds` and may take up to a minute;
- dynamic live timeout is typically 15–60 seconds;
- stale-cache fallback defaults to enabled;
- `full_content` defaults false and can carry its own per-result character cap;
- excerpts are relevance-focused; full content begins at the start of the document;
- response includes per-request `errors`, `warnings`, `usage`, and `session_id`.

Current list price is $1 per 1,000 URLs and the default quota is 600 POSTs/minute.
[S8][S14]

**INFERENCE:** Search and Extract share indexed/cached representations and session-aware
context. The product article describes Search as breadth/precision and Extract as
objective-conditioned compression of selected long sources. [S13] This supports a
two-stage agent architecture but does not prove a single physical store or compressor.

**RECOMMENDATION:** Treat extracted markdown as untrusted external data, retain the exact
source URL and provider error/warning, and distinguish `indexed`, `live`, and
`stale-fallback-possible` acquisition policies. Do not interpret clean markdown as safe
or authoritative content.

## Task API contract

### Creation and state

`POST /v1/tasks/runs` requires `processor` and `input` (string or object), returns HTTP
202 immediately, and starts in `queued`. Optional fields include `task_spec`, metadata,
memory scope, source policy, geo settings, previous interaction, MCP servers, event
capture, and webhook. [S5]

The public schema enumerates states `queued`, `action_required`, `running`, `completed`,
`failed`, `cancelling`, and `cancelled`; `is_active` is true for queued/running/cancelling.
[S5] A simpler lifecycle guide only documents queued/running/completed/failed. [S15]

Retrieval is split:

- `GET /v1/tasks/runs/{run_id}` returns status, not output. [S16]
- `GET /v1/tasks/runs/{run_id}/result` blocks until completion, default timeout 600
  seconds; 408 means the run remains active. [S17]
- run-level SSE and completion webhooks provide push alternatives. [S18][S19]

**UNKNOWN:** The reviewed public V1 index exposes no Task cancellation endpoint despite
the cancellation states. No idempotency key appears in the create contract. Clients must
therefore assume create retries can duplicate billable work unless Parallel confirms an
out-of-band guarantee.

### Declarative task and output contract

`task_spec.output_schema` may be:

- a bare descriptive string;
- JSON Schema subset for typed object output;
- text schema for a report;
- auto schema, which is also the default when no Task Spec is supplied. [S5][S20]

The JSON subset requires an object root with properties, recommends all fields required
and `additionalProperties: false`, caps nesting at 5, total properties at 100, task spec
at 15,000 characters, and combined spec plus input at 25,000 characters. Many validation
keywords such as `format`, lengths, numeric bounds, item bounds, patterns, and uniqueness
are unsupported. [S20]

**FACT:** Documentation says auto-schema “Deep Research style” output requires `pro` or
higher, even though the create schema itself describes omission as auto. [S20] Treat
lower-tier auto behavior as needing an integration check.

Task result output is discriminated as:

- `{type: "text", content: string, basis: FieldBasis[]}`; or
- `{type: "json", content: object, basis: FieldBasis[], output_schema?}` where
  `output_schema` is populated for auto mode. [S17]

**RECOMMENDATION:** Adopt schema-constrained outputs, but validate provider output again
at the Curiosity boundary. A vendor's successful run and nominal JSON conformance do not
make facts trustworthy.

### Processors: compute and stopping presets

| Tier | Standard latency | Approx. max fields | Price / run |
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

Fast variants have the same price and are published as roughly 2–5x faster while
trading some freshness priority; for example `ultra8x-fast` is listed at 1 min–1 h.
[S6][S8] Billing is per successfully completed run, independent of requested field count;
failed runs are not billed. [S8]

**FACT:** Parallel describes each processor as carrying a budget across compute and
retrieval, automatically optimized for quality. [S7]

**UNKNOWN:** Public contracts do not expose the actual budget units, hard source count,
query count, model/token budget, stopping rule, or caller-set wall-clock/cost ceiling.
SSE can report sources considered/read and search objectives/queries, but these are
observations, not pre-run bounds. [S18]

**RECOMMENDATION:** Curiosity must enforce its own deadline and submission budget around
Task. Processor price gives a predictable successful-run charge, but not a complete
bounded-execution contract: webhook retries, polling, duplicate submission, external MCP
tool charges/actions, and data retention are separate concerns.

### Asynchronous delivery and batching

Run-level SSE: [S18]

- `enable_events=true` requests progress capture; `pro` and above default it on;
- emits status, progress statistics, plan/tool/result/execution/search messages, errors,
  and final output;
- stream stays open 570 seconds;
- reconnect replays the full message trace and latest aggregate stats;
- run streams have no sequence number/cursor and are not resumable from an offset.

Webhooks: [S19][S21]

- currently `task_run.status` on success or failure;
- Standard Webhooks-compatible HMAC-SHA256 signatures;
- delivery may duplicate and should be deduplicated by `webhook-id`;
- exponential retries begin after 5 seconds and continue across multiple attempts for
  up to 48 hours.

Task Groups: [S22]

- create a container, then append runs indefinitely;
- up to 1,000 runs per add-runs POST;
- status aggregates queued/running/completed/failed counts;
- group SSE is resumable with `event_id`, unlike run SSE;
- run snapshots can include input/output and are streamed as SSE;
- documentation says grouped runs are stored indefinitely and recommends clients still
  persist final results.

Default quotas are Search 600 POST/minute, Extract 600 POST/minute, and Tasks/Task Groups
2,000 run-creation POSTs/minute; status/result GETs do not count according to the central
rate-limit page. [S14]

**CONTRADICTION:** the older Task lifecycle guide says the 2,000/minute limit applies
across POST and GET. [S15] The dedicated rate-limit page is more specific and is used as
the working interpretation, but this should be contract-tested.

## Evidence, provenance, and auditability

### Search evidence

Search returns source-local excerpts attached to URLs. This is useful retrieval evidence,
not an evidence graph: it does not say which excerpt supports which downstream claim,
and it provides neither source hash nor retrieval time. [S1]

### Task Research Basis

Each `FieldBasis` contains: [S17][S23]

- output `field` name;
- source citations with URL, optional title, and optional supporting excerpts;
- generated `reasoning` explaining selection/reconciliation/calculation;
- nullable confidence, described as low/medium/high.

Basis defaults to top-level output fields. A beta header adds per-array-element basis in
dot notation. Documentation characterizes high confidence as consistent evidence from
multiple authoritative sources and low confidence as limited/conflicting/weak evidence.
[S23]

**FACT/CONTRADICTION:** the Research Basis guide says all processors include confidence,
while the OpenAPI `FieldBasis` says only certain processors provide it, and the public
pricing page lists confidence/excerpts only from `core` upward. [S17][S23][S31] Consumers
must treat both as nullable and feature-detect actual responses.

**INFERENCE:** Basis is claim-adjacent evidence produced by the research system, not full
data lineage. `reasoning` should be understood as an explanatory rationale, not proof of
the hidden execution or a substitute for independently checking cited text. Confidence:
**high**, because the contract omits immutable source/version identifiers and calibration
metadata.

**RECOMMENDATION:** Curiosity should adapt the field-scoped model but strengthen it:

- preserve the original URL, title, excerpt, field path, provider run ID, and retrieval
  event time;
- attach acquisition mode and freshness/fallback policy;
- optionally hash retrieved content under Curiosity's own lawful retention policy;
- distinguish provider-reported confidence from Curiosity verification status;
- represent missing, conflicting, and unsupported evidence explicitly;
- never cite an excerpt that was not retained or reproducibly linked to its claim.

## Freshness

**FACT:**

- Search defaults to index/cache; live retrieval is opt-in through fetch policy. [S11]
- `after_date` filters by detected publication date, not cache age. [S1]
- live fetch can fall back silently to older cache unless disabled. [S1]
- Extract has the same cache/live/fallback control and a minimum freshness age of 10
  minutes. [S4]
- Task documentation says standard processors prioritize highest freshness and fast
  variants prioritize speed while remaining “very fresh”; standard is recommended for
  breaking news, prices, and live events. [S6]
- FAQ marketing says Task can access current-day live links while lower-end Search/Chat
  configurations trade freshness for latency. [S24]

**UNKNOWN:** crawl cadence by domain, indexed-document timestamps, freshness SLA,
publication-date extraction accuracy, and whether every Task processor performs live
fetching on every relevant source.

**RECOMMENDATION:** Make freshness an outcome constraint with an auditable acquisition
record. For strict use cases set live fetch plus no stale fallback where supported, and
surface failure rather than presenting stale evidence as current.

## Evidence for index ownership

Multiple first-party disclosures triangulate meaningful index ownership:

1. Parallel says its infrastructure spans crawl, index, query processing, and ranking,
   and calls Search's index proprietary. [S25]
2. The Search/Extract GA article describes a “rapidly growing proprietary index,” broad
   and specialized indexes, and coverage across 30+ countries. [S13]
3. Search's beta changelog called it a custom crawler and index. [S26]
4. Crawler documentation names `ShapBot`, publishes a user-agent/IP list, and says it
   discovers and indexes sites. [S27]
5. The bot policy distinguishes index-building `ShapBot` from on-demand `Shap-User`, and
   provides a content-owner contact for the search index. [S28]

**VERDICT — FACT:** Parallel owns and operates at least a proprietary crawler/index and
uses it in these products. Confidence: **high**.

**UNKNOWN / negative result:** public materials do not prove that every candidate or
every Task source originates exclusively from Parallel's crawl. They do not disclose
index size, exact coverage, crawl scheduler, deduplication, canonicalization, ranking
models, third-party feeds, content-removal SLA, or index licensing. “Own index” must not
be inflated into “only owned data.”

## Architecture inference (clean-room)

The following is an inference from contracts, not reverse-engineered implementation:

```text
Public web
  ├─ ShapBot scheduled crawl ──> proprietary indexed/cache representations
  └─ Shap-User live fetch  ────> fresh page representations
                                  │
Search request ─> query/objective interpretation ─> retrieval ─> ranking
                                  └───────────────> excerpt compression ─> ordered results

Known URLs ─> Extract fetch/cache selection ─> parse/render/PDF handling
                                      └───────> objective-conditioned excerpts/full markdown

Task spec + input + processor ─> planner/orchestrator
   ├─ repeated search/retrieval/fetch/tool actions
   ├─ source comparison and synthesis
   ├─ schema-constrained generation/validation
   └─ field basis + confidence ─> durable asynchronous result
```

Supporting observations:

- Advanced Search publicly claims more querying, reranking, and compression. [S13]
- Task's official description names querying, ranking, retrieval, reasoning, validation,
  and synthesis. [S7]
- SSE exposes planning, search queries, tool use, source counts, and final state. [S18]
- MCP tools can augment Task with remote data/actions; output records tool name,
  arguments, content/error, and server. [S29]

**UNKNOWN:** model vendors, model topology, whether confidence is separately calibrated
or jointly generated, retrieval branching strategy, cache topology, and exact stopping
logic.

## Safety, privacy, retention, and legal boundaries

### Retrieval and tool safety

**FACT:** Core Search/Task focus on public unauthenticated web data. Private inputs can be
passed to Task, but Parallel does not natively pull private sources. [S24] Separately, Task
can invoke caller-configured remote MCP servers (up to 10), forwarding supplied headers,
and a documented Browser Use integration can access logins, paywalls, internal dashboards,
and persistent browser profiles. [S29][S30]

**RECOMMENDATION:** Treat MCP/browser-enabled Task as a higher-risk product mode, not
ordinary public-web research. Require explicit allowed tools, scoped credentials,
egress policy, action classification, and human approval for side effects. Tool output
and webpages are untrusted and may contain prompt injection.

Source policy provides a useful retrieval guardrail but is not a trust mechanism. An
allowlist constrains domains; it does not validate claims or neutralize malicious content.
[S11]

### Customer data and retention

**FACT:**

- API-key transport is TLS; FAQ says data at rest is encrypted and stored in US data
  centers. SOC 2 Type I and II are claimed. [S24]
- Enterprise pricing advertises Zero Data Retention, DPAs, SSO, and custom limits. [S31]
- Interactions are unavailable to ZDR customers, confirming that multi-turn context
  requires retained state. [S32]
- EU-region business customers can select an EU Search endpoint where Search request and
  response content is processed in the EU and not retained. The statement is specific to
  Search, not Task. [S33]
- Task Group documentation says runs are stored indefinitely. [S22]
- Personal Memory saves Task/Monitor/FindAll inputs and outputs, may be enabled by default
  for newly created organizations during rollout, remains retained when switched off,
  and requires permanent deletion to remove. Application memory is opt-in per request via
  `memory_scope_key`. [S34]
- Task outputs may echo private input; Parallel advises against cross-customer output
  caching for agent products. [S35]

**MATERIAL CONTRADICTION:** FAQ says “Never” to training on customer data. [S24] Current
Customer Terms grant a perpetual license for service improvement and explicitly state
that Parallel **may use Customer IP to train and improve** machine-learning/AI models.
[S36 §4(b)] The legal agreement also permits aggregated/de-identified usage. The
contractual text should govern procurement analysis unless a negotiated order/DPA/ZDR
term supersedes it.

**RECOMMENDATION:** Do not send sensitive data under self-serve assumptions. Before any
production Task integration, obtain the applicable signed terms/DPA, retention/deletion
schedule, subprocessors, region behavior, ZDR scope, memory defaults, and a written answer
to the training contradiction.

### Legal and output safety

Customer Terms: [S36]

- customer retains input/output rights but grants Parallel broad processing/improvement
  rights;
- outputs are AI-generated and explicitly not guaranteed accurate, complete, or current;
- customers must independently verify outputs;
- automated high-impact decisions in employment, healthcare, finance, legal, housing,
  insurance, or benefits require human oversight;
- customer must have rights for inputs and third-party tools/data;
- model extraction, probing, reverse engineering, competitive use, database/data-resale
  uses, and publishing benchmark results without prior consent are restricted;
- output reuse/caching across end customers is contractually constrained.

This study stayed within those boundaries: only public descriptions were analyzed, no
service evaluation was run, and no benchmark claim is independently endorsed here.

## Limits, pricing, and operational discrepancies

Current primary documentation supports: [S8][S14]

- Search: 600 creates/minute; $0.001 (`turbo`/`fast`) or $0.005
  (`basic`/`advanced`) for a default 10-result request.
- Extract: 600 creates/minute; $0.001 per URL.
- Task/Task Groups: 2,000 run creations/minute; $0.005–$2.40 per successful run by
  processor; GET polling does not consume the documented creation quota.
- Task Group add-runs: 1,000 runs per POST. [S22]
- Monthly spend limits are notify-only and do not block requests. [S24]
- In-flight Task balance is reserved before work; large groups reserve all runs upfront.
  [S37]

**Discrepancies to verify before budgeting:**

- the marketing pricing page says Task latency tops out around 30 minutes, while the
  detailed current docs list up to 2 hours for `ultra8x`; [S8][S31]
- the marketing page omits `fast` Search in its breakdown while current docs include it;
- pricing advertises up to 5,000 free requests/month and separate credit promotions, but
  eligibility and API/mode mix are not fully specified; [S31]
- Task lifecycle and central quota pages disagree on whether GETs count. [S14][S15]

Use the API-specific documentation and written commercial order, not marketing summary,
as the operational source of truth.

## Curiosity decision ledger

### Adopt

1. **ADOPT — Product separation.** Search returns evidence candidates, Extract returns
   source content, Task returns synthesized research.
2. **ADOPT — Durable async lifecycle.** Stable run IDs, explicit terminal states, status
   retrieval, webhook completion, and event stream.
3. **ADOPT — Field-scoped evidence.** Map claims/fields to source URLs and excerpts.
4. **ADOPT — Source and freshness policy.** Domain include/exclude, publication window,
   maximum cache age, explicit stale fallback.
5. **ADOPT — Structured warnings/usage.** Preserve nonfatal adjustments and billable
   usage as first-class metadata.

### Adapt

1. **ADAPT — Provider modes.** Translate Parallel presets only in its adapter; expose
   portable deadline/result/context/cost limits in the Curiosity contract.
2. **ADAPT — Basis.** Add retrieval time, acquisition method, content identity, evidence
   status, and conflict representation.
3. **ADAPT — Confidence.** Keep provider confidence namespaced and nullable; never merge
   it with verification outcome.
4. **ADAPT — SSE.** Build idempotent replay handling; run-level streams replay messages
   and lack cursors.
5. **ADAPT — schemas.** Support a portable subset and provider capability negotiation,
   then validate returned content independently.

### Reject

1. **REJECT — A single generic `search` abstraction for all products.** It destroys
   semantics and boundedness.
2. **REJECT — Opaque tier as sufficient budget.** It does not bound sources, tool calls,
   elapsed time, or duplicate submissions.
3. **REJECT — Citation equals truth/provenance.** URLs and excerpts are evidence pointers,
   not immutable lineage or verification.
4. **REJECT — Notify-only spend limit as safety control.** Curiosity needs local hard
   admission and spend controls.
5. **REJECT — Cross-tenant caching of Task outputs.** It risks input disclosure and may
   violate customer terms.

### Defer

1. **DEFER — MCP/browser extension.** Valuable but materially increases secret, action,
   prompt-injection, privacy, and third-party-term risk.
2. **DEFER — Parallel Memory.** Retention and default-enable behavior require explicit
   product policy.
3. **DEFER — ZDR/EU deployment.** Requires commercial confirmation of endpoint, product,
   interaction, webhook, and log scope.
4. **DEFER — quality or price-performance claims.** No paid calls or independent evals
   were authorized, and Parallel's terms restrict benchmark publication.

## Unknowns and checks before integration

### Contract checks (safe, no research benchmark)

1. Confirm maximum/minimum `max_results`, excerpt bounds, and Search warning behavior.
2. Confirm whether Search response identifies live fetch versus stale fallback.
3. Confirm Task create idempotency and whether a supported cancellation endpoint exists.
4. Confirm exact task result retention and deletion APIs outside Memory/Task Groups.
5. Confirm all-processor availability of citation excerpts and confidence.
6. Confirm auto-schema behavior below `pro`.
7. Confirm whether GET status/result calls are quota-free.
8. Confirm webhook timestamp tolerance, retry schedule, payload retention, and endpoint
   egress restrictions.
9. Confirm MCP header storage/redaction, tool-call limits per processor, and side-effect
   controls.
10. Resolve Customer Terms training language versus FAQ “Never,” in writing.

### Quality checks requiring separate authorization

- source coverage/freshness by language and domain;
- date filter precision and stale-fallback behavior;
- excerpt entailment and truncation;
- citation-to-field support, conflicts, and calibration;
- schema conformance and null/unknown handling;
- duplicate Task submission and webhook delivery behavior;
- adversarial page/tool prompt injection.

These were **not executed** in this research because paid calls, credentials, and service
benchmarking were out of scope.

## Bounded curiosity pass

After synthesis, remaining gaps were scored 1–5 on relevance (R), decision value (V),
novelty (N), and investigation cost (C; lower is better).

| Thread | R | V | N | C | Action |
|---|---:|---:|---:|---:|---|
| Index ownership vs merely using an external SERP | 5 | 5 | 4 | 1 | Pursued: crawler, bot, product, and changelog evidence triangulated |
| Customer-data training contradiction | 5 | 5 | 5 | 1 | Pursued: FAQ, privacy policy, pricing/ZDR, and Customer Terms compared |
| Task stopping/cancellation/idempotency | 5 | 5 | 4 | 2 | Pursued through OpenAPI index and lifecycle; remains unknown |
| Exact ranking/model internals | 2 | 2 | 3 | 5 | **CURIOSITY_NO_GO:** proprietary and unnecessary for contract decision |
| Independent quality benchmark | 4 | 4 | 3 | 5 | **CURIOSITY_NO_GO:** requires credentials/paid calls and legal approval |
| Crawl size and third-party feed inventory | 3 | 3 | 4 | 5 | **CURIOSITY_NO_GO:** no primary public disclosure found; asking sales deferred |
| Reverse engineer SDK wire behavior | 2 | 2 | 2 | 4 | **CURIOSITY_NO_GO:** public OpenAPI is sufficient; license/access boundary |

Stop reason: **coverage and saturation**. The highest-value contract, ownership,
freshness, provenance, and data-governance questions were answered or explicitly bounded;
remaining threads require provider confirmation or prohibited/out-of-scope execution.

## Primary sources

All accessed 2026-08-17.

- **[S1]** Parallel, “Search” OpenAPI reference —
  https://docs.parallel.ai/api-reference/search/search
- **[S2]** Parallel, “Search API Quickstart” —
  https://docs.parallel.ai/search/search-quickstart
- **[S3]** Parallel, “Extract API Quickstart” —
  https://docs.parallel.ai/extract/extract-quickstart
- **[S4]** Parallel, “Advanced Extract Settings” —
  https://docs.parallel.ai/extract/advanced-extract-settings
- **[S5]** Parallel, “Create Task Run” OpenAPI reference —
  https://docs.parallel.ai/api-reference/tasks/create-task-run
- **[S6]** Parallel, “Processors” —
  https://docs.parallel.ai/task-api/guides/choose-a-processor
- **[S7]** Parallel, “Introducing the Parallel Task API” —
  https://parallel.ai/blog/parallel-task-api
- **[S8]** Parallel, “Parallel API Pricing” —
  https://docs.parallel.ai/getting-started/pricing
- **[S9]** Parallel, “Search API Best Practices” —
  https://docs.parallel.ai/search/best-practices
- **[S10]** Parallel, “Search Modes” — https://docs.parallel.ai/search/modes
- **[S11]** Parallel, “Advanced Search Settings” —
  https://docs.parallel.ai/search/advanced-search-settings
- **[S12]** Parallel, “Migrate to Parallel Search” —
  https://docs.parallel.ai/search/migrate-to-parallel
- **[S13]** Parallel, “Upgrades to the Parallel Search & Extract APIs,” 2026-04-21 —
  https://parallel.ai/blog/parallel-search-api
- **[S14]** Parallel, “API Rate Limits” —
  https://docs.parallel.ai/getting-started/rate-limits
- **[S15]** Parallel, “Task Runs Lifecycle” —
  https://docs.parallel.ai/task-api/guides/execute-task-run
- **[S16]** Parallel, “Retrieve Task Run” OpenAPI reference —
  https://docs.parallel.ai/api-reference/tasks/retrieve-task-run
- **[S17]** Parallel, “Retrieve Task Run Result” OpenAPI reference —
  https://docs.parallel.ai/api-reference/tasks/retrieve-task-run-result
- **[S18]** Parallel, “Task API Streaming Events” —
  https://docs.parallel.ai/task-api/task-sse
- **[S19]** Parallel, “Task API Webhooks” —
  https://docs.parallel.ai/task-api/webhooks
- **[S20]** Parallel, “Task Spec” —
  https://docs.parallel.ai/task-api/guides/specify-a-task
- **[S21]** Parallel, “Webhook Setup” —
  https://docs.parallel.ai/resources/webhook-setup
- **[S22]** Parallel, “Task Group” — https://docs.parallel.ai/task-api/group-api
- **[S23]** Parallel, “Research Basis” —
  https://docs.parallel.ai/task-api/guides/access-research-basis
- **[S24]** Parallel, “Parallel API FAQs” —
  https://docs.parallel.ai/resources/faqs
- **[S25]** Parallel, “Introducing Parallel: Web Search Infrastructure for AIs,”
  2025-08-14 — https://parallel.ai/blog/introducing-parallel
- **[S26]** Parallel, “Parallel API Changelog” —
  https://docs.parallel.ai/resources/changelog
- **[S27]** Parallel, “Crawler” — https://docs.parallel.ai/resources/crawler
- **[S28]** Parallel, “Overview of Parallel Web Systems’ Bots” —
  https://parallel.ai/parallel-web-systems-bots
- **[S29]** Parallel, “MCP Tool Calling” —
  https://docs.parallel.ai/task-api/mcp-tool-call
- **[S30]** Parallel, “Browser Use” —
  https://docs.parallel.ai/integrations/browseruse
- **[S31]** Parallel, “Pricing” — https://parallel.ai/pricing
- **[S32]** Parallel, “Interactions” —
  https://docs.parallel.ai/task-api/guides/interactions
- **[S33]** Parallel, “Privacy Policy” — https://parallel.ai/privacy-policy
- **[S34]** Parallel, “Use Parallel Memory to Build on Past Research” —
  https://docs.parallel.ai/resources/memory
- **[S35]** Parallel, “Task API Best Practices” —
  https://docs.parallel.ai/task-api/best-practices
- **[S36]** Parallel Web Systems Inc., “Customer Terms and Conditions” —
  https://parallel.ai/customer-terms
- **[S37]** Parallel, “API Error Codes and Warnings” —
  https://docs.parallel.ai/resources/warnings-and-errors

## Confidence summary

| Area | Confidence | Reason |
|---|---|---|
| Public request/response contracts | High | Current first-party OpenAPI and guides agree on core shapes |
| Product separation | High | Explicit across quickstarts and pricing matrix |
| Owned crawler/index | High | Multiple direct first-party disclosures and named bot |
| Freshness controls | High | Explicit policy fields; actual per-domain freshness remains unknown |
| Task compute/stopping internals | Low | Only opaque processor presets and observed progress are public |
| Basis semantics | High | Schema is explicit; empirical support/calibration quality untested |
| Privacy/retention defaults | Medium | Several facts are explicit, but FAQ and legal training language conflict |
| Production fitness for Curiosity | Medium-low | No authorized contract or empirical API checks were performed |
