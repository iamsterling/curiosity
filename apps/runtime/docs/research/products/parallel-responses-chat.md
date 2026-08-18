# Parallel Responses and Chat APIs: clean-room surface analysis

**Research date:** 2026-08-17  
**Source access date:** 2026-08-17 for every source  
**Status:** research and recommendations only; not an integration, benchmark, or
implementation record  
**Method boundary:** public first-party documentation, public OpenAPI descriptions,
product announcements, pricing, privacy policy, and customer terms. No account,
credential, paid request, UI automation, access-control bypass, SDK/package inspection,
traffic capture, or proprietary implementation inspection was used.

## Decision frame

This note asks one bounded question: **what should Curiosity learn from Parallel's
synchronous, answer-producing Responses and Chat surfaces without conflating them with
Parallel Search (ranked retrieval) or Task (asynchronous research jobs)?**

Sub-questions:

1. What request, non-streaming response, and streaming contracts are publicly observable?
2. What retrieval and tool behavior is managed internally, and what can the caller bound?
3. How do citations, richer evidence, conversation state, usage, failures, and cost differ?
4. What safety, privacy, retention, and legal constraints matter to Curiosity?
5. What architecture can reasonably be inferred, what remains unknown, and which patterns
   should Curiosity adopt, adapt, reject, or defer?

**Stop condition:** each requested category has a sourced fact, labeled inference or
unknown, confidence, and Curiosity implication; stop when remaining questions require a
credentialed call, provider confirmation, or prohibited implementation reconstruction.

### Evidence labels

- **FACT** — directly stated by a cited first-party source or present in the public schema.
- **INFERENCE** — a bounded architecture interpretation consistent with public behavior,
  not a claim about undisclosed internals.
- **RECOMMENDATION** — a Curiosity design conclusion.
- **UNKNOWN** — not established in the reviewed public sources.
- Confidence is **high**, **medium**, or **low**. “High” means confidence that Parallel
  publicly documents the contract, not that quality or implementation was independently
  verified.

## Executive verdict

Parallel exposes two overlapping but materially different synchronous answer products:

1. **Responses API** is the newer OpenAI-Responses-compatible research-agent surface.
   One model name, `parallel`, plus `reasoning.effort=low|medium|high` selects a fixed-price,
   approximately 5–60 second research tier. It automatically performs multi-step live-web
   search, page fetching, source cross-checking, and answer synthesis. It returns one
   assistant message with span-scoped URL/title citations, supports JSON Schema output,
   server-held multi-turn context, and an OpenAI-style SSE lifecycle. It does **not** expose
   raw searches, fetched excerpts, tool calls, source policy, hard output/tool limits,
   background execution, or cancellation. [S1][S2][S3][S4][S5][S6][S7]
2. **Chat API** is an older beta ChatCompletions-compatible surface. `speed` targets about
   three-second time to first token using Parallel's index and has no Research Basis;
   `lite`, `base`, and `core` are explicitly wrappers over matching Task processors and can
   return citations, excerpts, reasoning, and confidence in a Parallel-specific `basis`
   extension. It supports ChatCompletion-chunk text streaming and JSON Schema output, but
   silently ignores nearly every familiar generation/tool control. [S8][S9][S10][S11][S12]

The strongest clean-room lessons are to separate **wire-format compatibility** from
**semantic compatibility**, distinguish **answer citations** from **audit evidence**, make
conversation retention explicit, and put real caller-enforced ceilings around an otherwise
opaque managed research loop. Curiosity should adopt typed lifecycle events and claim/field
evidence attachment, adapt tiered research into explicit local budgets, reject silent
no-op controls and citation-as-verification, and defer production use until retention,
deletion, cancellation, idempotency, safety, and contract discrepancies are resolved.

Overall confidence: **high** on documented request/response shapes and product separation;
**medium** on current operational behavior because docs and OpenAPI conflict in several
places; **low** on internal retrieval, stopping, safety, and citation-quality mechanisms.

## 1. Keep Responses, Chat, Search, and Task separate

| Surface | Caller receives | Retrieval/reasoning | Execution | State/evidence |
|---|---|---|---|---|
| Search API | ranked URLs and excerpts | retrieval, no synthesized answer | synchronous | session correlation; no answer citations |
| Task API | synthesized text/JSON | managed deep research | asynchronous run | durable run lifecycle; per-field Basis |
| **Responses API** | synthesized text/JSON | automatic live-web research | synchronous, ~5–60s | response-id chain; span URL citations |
| **Chat `speed`** | chat text/JSON | low-latency index-grounded completion | synchronous, ~3s TTFT | interaction chain documented; no Basis |
| **Chat research models** | chat text/JSON | matching Task processor behind chat facade | synchronous, 10s–5min TTFT ranges | interaction chain; Parallel `basis` extension |

**FACT (high):** Parallel's own pricing table separately classifies Search, Task,
Responses, and Chat. Responses is “grounded answers with live web research” at 5–60
seconds; Chat is “grounded chat completions” at 1–3 seconds in the summary, though its
research models have much longer published ranges. [S13]

**FACT (high):** Responses docs direct long-running or batch work to Task because Responses
is synchronous only. Chat research models are expressly wrappers over Task processors, but
the Chat call itself blocks/streams as a synchronous chat completion rather than creating a
caller-visible Task run. [S1][S8]

**INFERENCE (high):** Responses is not “Search with prose added.” It transfers query
planning, repeated retrieval, source reading, cross-checking, stopping, and synthesis to a
hosted agent while exposing only its final answer and selected citations. That is a larger
trust and authority boundary than raw Search.

**RECOMMENDATION (high):** Curiosity should expose `search`, `research_response`, and
`research_task` as distinct capabilities. ChatCompletions/Responses compatibility belongs
in adapters; it must not erase execution, evidence, state, or budget semantics.

## 2. Responses API contract

### 2.1 Request

`POST https://api.parallel.ai/v1/responses` accepts OpenAI-style credentials and JSON. The
quickstart uses `Authorization: Bearer`; the published OpenAPI security scheme names an
`x-api-key` header. This is a documentation discrepancy to test rather than normalize away.
[S1][S7]

Honored fields are: [S6][S7]

| Field | Documented behavior |
|---|---|
| `model` | required; only `parallel`, case-insensitive per OpenAPI |
| `input` | required non-empty string or text-only role/content messages; at least one `user` message |
| `instructions` | optional system instructions prepended to request |
| `reasoning.effort` | `low`, `medium` (default), or `high` research tier |
| `text` | output configuration, including JSON Schema format |
| `stream` | return OpenAI-style SSE rather than one JSON object |
| `previous_response_id` | inherit prior server-held conversation context |
| `metadata` | up to 16 echoed string tags; key ≤64 and value ≤512 characters |

The OpenAPI states that `input` plus `instructions` may total at most 20,000 characters.
Message roles are `user`, `assistant`, `system`, or `developer`; content can be a string or
canonical text parts. Image, audio, and file parts are rejected. [S7]

Accepted but ignored fields include `tools`, `tool_choice`, `parallel_tool_calls`,
`temperature`, `top_p`, `max_output_tokens`, `truncation`, `store`, `user`, and `include`.
Unknown top-level fields are silently dropped. Ignored fields are returned with defaults,
not caller-supplied values. `background:true` is rejected and callers are sent to Task.
[S6]

**RECOMMENDATION (high):** An adapter must capability-check every field and fail locally
when a requested hard bound is unsupported. Forwarding `max_output_tokens`, `store:false`,
or tool policy and reporting success would create false safety guarantees.

### 2.2 Research and tool behavior

**FACT (high):** Grounding is automatic; callers are told to remove OpenAI's
`web_search` tool. Parallel says the service runs multi-step web searches, fetches live
pages, cross-checks sources, and synthesizes an answer. Higher effort performs more web
research. Caller-supplied tools and tool choice are ignored. [S1][S6]

**FACT (high):** The public request has no source allow/deny list, publication-date bound,
cache-age/freshness bound, search-query list, maximum sources/pages, maximum retrieval
rounds, maximum tool calls, or caller-provided URL corpus. [S6][S7]

**INFERENCE (high):** Parallel owns the inner research loop. A plausible observable
pipeline is:

`question + conversation -> plan/queries -> retrieve/fetch -> select/cross-check -> stop -> synthesize -> attach citations`

Only the input, tier, answer, citations, approximate token counts, and timestamps cross the
wire. Search queries, discarded sources, fetched text, conflicts, loop count, and stopping
rationale do not.

**UNKNOWN:** whether all fetched pages are live, which are index/cache hits, whether robots
or publisher directives differ by acquisition path, what “cross-checking” requires, which
retrieval stack/model runs each tier, and whether citations cover every materially used
source.

### 2.3 Non-streaming response

The response is an OpenAI-style `Response`: `id`, epoch `created_at`, `object=response`,
`model=parallel`, `status`, one assistant `output[]` message, optional error/incomplete
details, echoed metadata and previous ID, approximate token `usage`, and compatibility
fields. The SDK convenience accessor `output_text` flattens the final text. [S6][S7]

The public schema allows statuses `queued`, `in_progress`, `completed`, `failed`,
`cancelled`, and `incomplete`, but the API is synchronous and publishes no get/cancel
endpoint. `incomplete_details.reason` can be `max_output_tokens` or `content_filter`, even
though `max_output_tokens` is documented as ignored. `reasoning` and `text` are echoed as
`null` even when honored, so the caller must retain the submitted tier/schema separately.
[S6][S7]

**INFERENCE (medium):** Much of the broad response schema is compatibility scaffolding,
not proof that every lifecycle state or control is operationally reachable. Curiosity must
record `requested`, `provider_accepted`, and `provider_observed` separately.

### 2.4 Structured output

`text.format={type:"json_schema",name,schema,...}` asks for a schema-conforming JSON object
encoded as the output text. Guidance recommends an object root, every property in
`required`, `additionalProperties:false`, flat fields, and explicit formats/units. The
caller still parses network text and handles parse failure. Citation offsets point into the
JSON-encoded string and may anchor individual field values. [S3]

The OpenAPI also accepts `json_object`, but says it produces plain text unless the prompt
requests JSON; `strict` exists in the schema but its exact enforcement semantics are not
documented. [S7]

**RECOMMENDATION (high):** Validate every returned object with Curiosity's own schema
validator and preserve the original bytes. Schema conformance does not establish factual
correctness, evidence sufficiency, or semantic unit validity.

### 2.5 Streaming

With `stream:true`, the documented successful sequence is: [S4]

```text
response.created
response.in_progress
response.output_item.added
response.content_part.added
response.output_text.delta
response.output_text.annotation.added   # once per citation
response.output_text.done
response.content_part.done
response.output_item.done
response.completed
```

The OpenAPI additionally defines terminal `response.failed` and `response.incomplete`
events. Events carry monotonic-looking `sequence_number` fields, but no replay cursor or
reconnect protocol is documented. The completed event contains the full final response and
usage. [S4][S7]

**FACT (high):** As of the access date, the complete answer arrives in one text delta only
after research finishes; it is not token-by-token streaming. Early events acknowledge the
connection. Citations arrive after the text delta. Parallel warns consumers not to assume
one chunk because granularity may change. [S4]

**RECOMMENDATION (high):** Treat the stream as lifecycle/progress transport, not latency to
partial answer. Deduplicate by response/item/content/annotation indexes and sequence,
buffer until a terminal event, validate citation spans against final text, and represent a
transport break without terminal event as `outcome_unknown`, not failed or safe-to-retry.

## 3. Responses citations and evidence

Each output-text part has `url_citation` annotations containing URL, title, and
`start_index`/`end_index` over the answer. Multiple citations may support one span.
Streaming emits each annotation separately and repeats the complete array at completion.
[S5]

**FACT (high):** Responses citations do not include source excerpts, retrieval/fetch time,
publication date, content hash/version, acquisition method, search query, source rank,
confidence, reasoning, contradiction representation, or explicit entailment status. The
docs direct users needing per-field excerpts, reasoning, and confidence to Task Basis.
[S5]

**INFERENCE (high):** A span-to-URL annotation is useful claim localization but incomplete
provenance. It says the provider associates a web resource with a span; it does not prove
that the cited page contained the claim at retrieval time, that the source is authoritative,
that all claims are covered, or that the answer follows from the evidence.

**RECOMMENDATION (high):** Curiosity should preserve provider annotations verbatim under a
namespaced evidence type and independently enrich them with retrieval timestamp, content
identity, captured excerpt, access method, verification result, and conflict status. Never
convert “cited” into “verified.”

## 4. Responses state, budget, and stopping

### 4.1 Statefulness

Every Responses result is stored server-side regardless of the ignored `store` value. A
follow-up supplies `previous_response_id`; Parallel inherits context and performs fresh web
research on each turn. Effort may change between turns. ZDR organizations cannot use this
feature because prior response data is not retained. [S2][S6]

**UNKNOWN:** retention duration, chain length/size limits, tenant/app authorization rules
for a referenced ID, deletion/export API, deletion propagation, whether a chain includes
full hidden retrieval artifacts or only inputs/outputs, and behavior for missing/expired/
foreign IDs. The public API index exposes create but no retrieve/delete Responses endpoint.

**RECOMMENDATION (high):** Default Curiosity to caller-held explicit history, not opaque
provider state. If stateful mode is ever enabled, mark it as retained remote data, scope IDs
to tenant and policy epoch, prohibit cross-tenant reuse, and require a verified retention
and deletion contract.

### 4.2 Budget and stopping

The only server-side research budget selector is the opaque effort tier:

| Effort | Published latency | Price/request | Stated use |
|---|---:|---:|---|
| `low` | ~5–10s | $0.01 | simple fact retrieval |
| `medium` (default) | ~15–20s | $0.05 | multi-hop fact retrieval |
| `high` | ~30–60s | $0.25 | extensive search/deep research |

Only successful responses are charged. Pricing is fixed per request rather than per token
or page. Token usage is estimated compatibility metadata, not the bill basis. [S13]

**FACT (high):** `max_output_tokens`, truncation, tools, and tool-call limits are ignored;
there is no hard cost field, deadline, source/page/round cap, or cancellation endpoint.
Client timeout headroom is recommended for high effort, but no documentation says a client
disconnect cancels provider work. [S1][S6]

**INFERENCE (high):** Price is bounded for one accepted call, but total workflow cost and
duplicate work are not bounded without caller admission control, idempotency, and retry
accounting. The tier is a preset over undisclosed compute/retrieval/stopping policy, not a
portable budget.

**RECOMMENDATION (high):** Curiosity must enforce local maximum calls, aggregate spend,
deadline, concurrency, retries, and response bytes. Store the exact requested effort.
Require explicit idempotency support or treat ambiguous retries as possibly duplicate and
billable.

## 5. Chat API contract

### 5.1 Product maturity and endpoints

Chat launched in beta in May 2025. Its current guide still carries a beta notice. The guide
and OpenAI SDK examples call `https://api.parallel.ai/chat/completions` with base URL
`https://api.parallel.ai`; the current OpenAPI publishes
`POST /v1beta/chat/completions`. The canonical endpoint/alias relationship is not explained.
[S8][S10][S12]

**RECOMMENDATION (high):** Do not hard-code either route as stable without an authorized
contract check. Preserve endpoint/version as adapter configuration.

### 5.2 Models and retrieval character

| Model | Published behavior | Basis | Published TTFT/range | Price/request |
|---|---|---:|---:|---:|
| `speed` | low-latency web/index-grounded chat | no | ~3s p50 TTFT | $0.005 |
| `lite` | Task `lite` wrapper | yes | 10–60s | $0.005 |
| `base` | Task `base` wrapper | yes | 15–100s | $0.01 |
| `core` | Task `core` wrapper | yes | 60s–5min | $0.025 |

[S8][S13]

The 2025 launch says `speed` answers using Parallel's index, while Task combines index and
real-time crawling. The FAQ says lower-end Search and Chat prioritize latency over freshness.
Research models were added in January 2026 and run the same processors as Task.
[S8][S11][S22]

**INFERENCE (medium):** Chat is two implementations behind one facade: a fast indexed
completion path and synchronous wrappers around the Task research engine. Similar wire
format does not imply equal freshness, evidence, latency, or stopping.

**UNKNOWN:** whether `speed` ever live-fetches, its cache/index age, retrieval breadth,
whether research wrappers create hidden Task runs, and whether wrapper failures/billing are
identical to direct Task.

### 5.3 Request and compatibility

Chat accepts `model`, `messages[]`, `stream`, and `response_format`. Messages support only
string content with roles `system`, `user`, or `assistant`, plus optional name. A custom
system prompt is supported. JSON Schema structured output uses the OpenAI
`response_format` shape. [S8][S9]

The guide documents the following as ignored: token limits, sampling controls, stop, `n`,
logprobs, penalties, seed, metadata, `store`, user, service tier, modalities, audio,
reasoning effort, prompt caching, and tools/functions. Message tool-call/function/audio
fields and multimodal content are also ignored. Choices always have length one. [S8]

**MATERIAL DOCUMENTATION CONTRADICTION:** The Interactions guide, glossary, and current
OpenAPI say Chat accepts `previous_interaction_id` and returns `interaction_id` for
multi-turn context. The OpenAPI request description simultaneously says every parameter
except `model`, `stream`, and `response_format` is ignored, while the Chat compatibility
table does not list interaction IDs. [S8][S9][S16]

**UNKNOWN:** whether interactions currently work on all Chat models/routes, whether message
history plus interaction state is merged or duplicated, and what is retained.

### 5.4 Response and streaming

Non-streaming examples use OpenAI's `choices[0].message.content`; streaming examples consume
`choices[0].delta.content`. The OpenAPI describes `chat.completion` and
`chat.completion.chunk`, usage, moderation, Basis, and interaction ID. [S8][S9]

The compatibility page says many ordinary response fields are intentionally empty: `id`,
`object`, `model`, `finish_reason`, token usage/details, refusal, service tier, fingerprint,
and logprobs. That conflicts with the current OpenAPI, which requires non-empty-typed IDs,
model, object, created time, and usage shapes, and models a `Choice` around `delta` even for
the non-streaming response. [S8][S9]

**FACT (medium):** Chat streaming is documented through incremental content chunks for an
interactive UI, unlike Responses' explicitly documented one-delta-after-research behavior;
the exact chunk granularity is not specified. Research
models may have long time to first token. No event IDs, replay cursor, resumability, or
deduplication contract is documented. [S8]

**RECOMMENDATION (high):** Parse Chat defensively as an OpenAI-like subset plus namespaced
extensions. Never depend on empty compatibility fields for identity, metering, terminal
reason, or retry safety. Buffer and validate structured JSON after terminal completion.

## 6. Chat citations and Basis

`speed` has no Research Basis. The Chat launch claims comprehensive citations, but its
example asks the model to place a `citations: string[]` field inside caller-defined JSON;
the current guide does not define a first-class speed citation object or inline annotation
contract. [S8][S10]

Research models return a Parallel-only top-level `basis: FieldBasis[]`. A FieldBasis has:

- `field` — output field name;
- `citations[]` — URL, optional title, optional relevant excerpts;
- `reasoning` — explanation of processing/synthesis;
- `confidence` — nullable provider rating, described as low/medium/high.

[S9][S11][S21]

Parallel says its confidence categories are calibrated and that high-confidence outputs
have lower error rates in its datasets. This is a vendor claim; no authorized independent
calibration test was performed. [S11]

**INFERENCE (high):** Research-model Basis is richer than Responses annotations because it
retains excerpts and a field mapping. It is still provider-generated evidence metadata,
not immutable provenance or independent verification. “Reasoning” should not be treated as
a faithful hidden chain-of-thought trace.

**UNKNOWN:** the Basis `field` value for free-text chat, per-element mapping behavior through
the Chat wrapper, how Basis is delivered in stream chunks, whether all citations include
excerpts, and what built-in citation mechanism—if any—`speed` uses outside prompted JSON.

**RECOMMENDATION (high):** Prefer typed transport evidence over asking a model to generate
its own `citations` field. Namespace provider confidence, permit null, and keep it separate
from Curiosity's evidence validation result.

## 7. Errors, quotas, pricing, and retry safety

### Responses

- Invalid model, empty/no-user input, and multimodal input are described as `400` with a
  standard OpenAI error envelope on the compatibility page. The OpenAPI instead documents
  validation and `background:true` as `422`. [S6][S7]
- Quota returns `429`; docs advise backoff. [S6]
- Mid-stream terminal events can be `failed` or `incomplete`; provider error code in the
  Response schema is currently `server_error`. [S7]
- Price is $0.01/$0.05/$0.25 for low/medium/high and only successful responses are charged.
  The marketing pricing page says 300 requests/minute, while the central rate-limit page
  omits Responses entirely. [S13][S14][S15]

### Chat

- Default rate limit is 300 POSTs/minute. [S8][S14]
- Price is $0.005 for `speed`/`lite`, $0.01 for `base`, and $0.025 for `core`; research
  wrappers share corresponding Task processor pricing. [S13]
- The guide says errors are approximately OpenAI-shaped. The general error page lists 401,
  402, 403, 404, 408, 422, 429, 500, 502, and 503, but is substantially Task-oriented and
  does not identify Chat-specific terminal or partial-stream behavior. [S8][S15]

### Shared operational conclusion

**UNKNOWN:** idempotency keys, duplicate-request detection, whether disconnect/client
timeout cancels work, charge behavior after an interrupted stream, retry headers, exact
rate-limit headers, per-model concurrency caps, response-size limits, and partial-success
billing.

**RECOMMENDATION (high):** Retry only clearly pre-execution failures automatically. For
timeouts, dropped streams, 5xx after acknowledgment, or missing terminal events, record an
ambiguous outcome and require idempotency/provider reconciliation before resubmission.
Local monthly and per-workflow spend ceilings are mandatory because Parallel's configured
spend limits are notify-only. [S17]

## 8. Privacy, retention, legal, and safety

### 8.1 Data and retention

**FACT (high):** Responses are always stored server-side to enable response-ID follow-ups;
`store:false` has no effect. Chat/Task interactions also require retained context and are
unavailable under ZDR. Enterprise pricing advertises ZDR and DPAs. [S2][S6][S16][S18]

**FACT (high):** Parallel says traffic is encrypted with TLS 1.2+ and data at rest is in US
data centers; SOC 2 Type I and II are claimed. The privacy policy says business API content
is processed as a processor under a DPA. Its EU-residency statement is explicitly limited
to Search API requests sent to an EU endpoint, not Responses or Chat. [S17][S19]

**MATERIAL CONTRADICTION:** The FAQ says Parallel never trains on customer data. Current
Customer Terms grant a perpetual license for service improvement and expressly say Parallel
may use Customer IP, including inputs and outputs, to train and improve ML/AI models.
[S17][S20 §4(b)] Procurement should treat the contract as controlling unless a signed
order, DPA, or ZDR amendment overrides it.

**UNKNOWN:** default Responses/Chat retention period, deletion API/SLA, backup/log retention,
subprocessors, regional routing, whether ZDR is available on self-serve plans, what hidden
retrieval traces are stored, and whether citations cause downstream URL disclosures.

**RECOMMENDATION (high):** Do not send secrets, personal data, or sensitive internal context
under self-serve assumptions. Require written product-specific answers on ZDR, retention,
deletion, training, region, logs, and incident handling.

### 8.2 Safety and untrusted retrieval

The public response schemas contain optional moderation results and can represent an
`incomplete` response due to `content_filter`. Chat and Responses requests, however, expose
no documented moderation selector, safety policy, policy version, refusal contract, or
source-trust configuration. Responses' `safety_identifier` compatibility field is not an
honored request control. [S7][S9]

Neither surface exposes a domain allowlist, source freshness policy, or caller tool
permissions. Tools are ignored, which limits direct side effects but does not remove risks
from malicious web content influencing synthesis. Citations do not sanitize sources.

**INFERENCE (high):** The hosted agent reads untrusted external text inside an opaque loop;
prompt injection, poisoned pages, citation laundering, stale pages, and conflicting sources
are therefore in scope even though the public docs do not describe mitigations.

**UNKNOWN:** input/output moderation defaults, policy categories, refusal stability,
prompt-injection defenses, instruction/data separation, URL/network egress controls,
malware handling, source reputation logic, and safety-event auditability.

**RECOMMENDATION (high):** Treat every answer and citation as untrusted. Apply Curiosity's
own URL policy, evidence fetch isolation, content sanitization, claim verification,
high-impact-use review, and output encoding. Do not infer safety from ignored tools or an
optional moderation-shaped response field.

### 8.3 Legal boundaries

Customer Terms say outputs are AI-generated and not guaranteed accurate, complete, or
current; customers must verify them. Automated high-impact decisions in employment,
healthcare, finance, legal, housing, insurance, or benefits require human oversight. Terms
also restrict reverse engineering/model extraction, competitive use, output/data resale,
cross-end-customer caching, synthetic training data, and publishing benchmarks without
consent. [S20 §§2, 5, 8]

This note stayed within those boundaries: public contracts only, no black-box quality
evaluation or attempt to derive proprietary models, algorithms, prompts, or datasets.

## 9. Bounded architecture inference

### 9.1 What the public evidence supports

1. **Responses has an internal agent loop (high).** Parallel directly says it performs
   multi-step searches, reads/fetches pages, cross-checks, and synthesizes. Effort changes
   research amount. [S1][S12]
2. **The loop is intentionally compressed at the boundary (high).** No search/fetch items
   or reasoning trace are returned; only final message, citations, state ID, and usage.
3. **Chat has at least two execution paths (high).** `speed` is index-oriented and has no
   Basis; research models are Task processor wrappers with Basis. [S8][S10][S11]
4. **Conversation state is provider-side (high).** Response and interaction IDs resolve
   retained context; ZDR disables the feature. [S2][S16]
5. **Compatibility DTOs exceed implemented semantics (high).** Numerous fields are ignored
   or returned as defaults, and broad lifecycle/moderation schemas exist without matching
   caller controls. [S6][S7][S8][S9]
6. **Fixed-price tiers likely package internal compute/retrieval budgets (medium).** Parallel
   says higher tiers do more research and Chat research models allocate more compute and
   retrieval budget, but exact bounds are undisclosed. [S1][S11][S13]

### 9.2 What must not be inferred

- The exact planner, language model, ranker, number of searches, pages, or verification
  algorithm.
- That “live web” means every cited page was freshly fetched.
- That Responses is literally a Task wrapper; Parallel claims comparable quality but does
  not document that implementation relationship.
- That a citation was entailed, immutable, safe, or complete.
- That token usage measures hidden web context or billable compute.
- That `speed`, Responses low, and Task lite are equivalent because prices/latencies overlap.
- That OpenAI wire compatibility implies endpoint, storage, tools, limits, safety, or error
  compatibility.

## 10. Curiosity decision ledger

### Adopt

1. **ADOPT — explicit product boundary (high).** Retrieval results, synchronous researched
   answers, and asynchronous deep-research runs are different contracts.
2. **ADOPT — typed stream lifecycle (high).** Created/in-progress/item/content/annotation/
   terminal events are clearer than undifferentiated text chunks.
3. **ADOPT — claim-span and field evidence attachment (high).** Keep evidence linked to the
   exact answer span or structured field it purports to support.
4. **ADOPT — output schema as research instruction (medium).** Descriptions, units, and
   required/null semantics should guide acquisition while independent validation remains.
5. **ADOPT — explicit remote-state mode (high).** Stateful context must be a visible
   retained-data capability disabled by ZDR/local-only policy.

### Adapt

1. **ADAPT — effort tiers into real budgets (high).** Provider presets may be adapter hints;
   Curiosity's contract needs hard call, source, byte, elapsed-time, concurrency, and spend
   ceilings.
2. **ADAPT — citations into provenance records (high).** Add acquisition time/method,
   content identity, excerpt, source-policy result, entailment, and contradiction status.
3. **ADAPT — OpenAI compatibility (high).** Capability-negotiate fields and fail closed on
   unsupported safety/budget semantics rather than silently forwarding them.
4. **ADAPT — provider state (high).** Prefer local transcript state; if remote chaining is
   used, bind IDs to tenant, retention class, and policy epoch.
5. **ADAPT — fixed price (high).** Use it only as one component of local admission control;
   ambiguous retries and orchestration fan-out remain aggregate cost risks.
6. **ADAPT — streaming (high).** Require idempotent event handling, terminal-state checks,
   span validation, and explicit unknown outcome on disconnect.

### Reject

1. **REJECT — silent no-op controls (high).** Ignoring caller token, storage, tool, or
   truncation policy is incompatible with bounded execution.
2. **REJECT — opaque tier as sufficient stopping contract (high).** It does not bound
   searches, sources, bytes, output, elapsed work, or retries.
3. **REJECT — citation equals verification (high).** URL association is not provenance,
   freshness, authority, or entailment.
4. **REJECT — provider-held conversation state by default (high).** Always-on retention and
   ignored `store:false` violate least-retention expectations.
5. **REJECT — generated citation fields where typed evidence exists (high).** Prompted
   `citations: string[]` is weaker and easier to hallucinate than transport metadata.
6. **REJECT — using compatibility DTO fields as proof of capability (high).** Schema
   presence for moderation, cancellation, limits, or status does not establish behavior.

### Defer

1. **DEFER — production Responses adapter (medium-high).** Resolve retention/deletion,
   idempotency, cancellation, source policy, safety, exact quotas, and 400/422 behavior.
2. **DEFER — Chat API dependency (high).** It remains beta and has endpoint, interaction,
   response-shape, and empty-field contradictions.
3. **DEFER — remote state (high).** Require signed ZDR/retention terms and authorization/
   deletion tests.
4. **DEFER — quality, freshness, calibration, and price-performance claims (high).** No
   paid tests were authorized and the terms restrict benchmark publication.

## 11. Unknowns and pre-integration checks

### Safe contract checks requiring caller authorization and credentials

1. Confirm accepted auth headers and canonical Chat route (`/chat/completions` versus
   `/v1beta/chat/completions`).
2. Confirm exact Responses quota and rate-limit/retry headers.
3. Confirm 400 versus 422 envelopes for every rejected Responses case.
4. Confirm ignored-field behavior, especially `store:false`, `max_output_tokens`, tools,
   unknown fields, and response echoes.
5. Confirm streaming sequence numbers, terminal failures, disconnect behavior, and whether
   resumed/repeated calls duplicate charges.
6. Confirm Chat interaction support on every model and route despite schema contradictions.
7. Confirm Chat non-streaming `message` versus OpenAPI `delta` and which identity/usage/
   finish fields are populated.
8. Confirm structured-output schema subset, nesting/size limits, null behavior, and `strict`.
9. Confirm Responses/Chat retention, deletion, authorization scope, chain limits, logs,
   backups, region, and ZDR behavior in writing.
10. Confirm moderation defaults, content-filter behavior, safety policy/version, and
    prompt-injection controls.
11. Confirm idempotency, server cancellation after client timeout/disconnect, and billing of
    failed/incomplete/interrupted responses.
12. Resolve FAQ “Never” training claim versus Customer Terms in a signed commercial term.

### Quality checks requiring separate legal and evaluation approval

- citation coverage, span accuracy, source accessibility, and answer entailment;
- live-fetch versus indexed/cache freshness by model/tier;
- conflict handling and primary-source preference;
- structured-output factual accuracy and null/unknown behavior;
- confidence calibration for Chat research models;
- adversarial source prompt injection and citation laundering;
- multilingual and paywall/login behavior;
- disconnect, duplicate submission, and partial-stream billing.

None was executed in this research.

## 12. Bounded curiosity pass

Remaining gaps were scored 1–5 for relevance (R), decision value (V), novelty (N), and
investigation cost (C; lower is better). Only public, in-frame follow-ups were eligible.

| Thread | R | V | N | C | Result |
|---|---:|---:|---:|---:|---|
| Responses ignored controls and stopping | 5 | 5 | 5 | 1 | Pursued across compatibility, OpenAPI, quickstart, pricing |
| Chat versus Responses evidence difference | 5 | 5 | 4 | 1 | Pursued across Basis, citations, Chat guide, and schemas |
| Remote state/retention and ZDR | 5 | 5 | 4 | 1 | Pursued across state, interactions, FAQ, privacy, terms |
| Chat contract contradictions | 5 | 4 | 5 | 1 | Pursued; endpoint, interactions, and response shape remain checks |
| Responses quota discrepancy | 4 | 4 | 3 | 1 | Pursued; marketing says 300/min, central quota page omits it |
| Exact planner/search/fetch implementation | 2 | 2 | 3 | 5 | **CURIOSITY_NO_GO:** proprietary, restricted, unnecessary for contract decision |
| Paid black-box quality benchmark | 4 | 4 | 3 | 5 | **CURIOSITY_NO_GO:** credentials/cost/legal approval outside authority |
| Inspect SDK/package to resolve wire behavior | 2 | 3 | 2 | 4 | **CURIOSITY_NO_GO:** public schema is sufficient for bounded unknowns; license/access boundary |
| Probe state-ID authorization/deletion | 5 | 5 | 4 | 5 | **CURIOSITY_NO_GO:** requires credentials and live state mutation |
| Infer hidden model/provider from outputs | 1 | 1 | 3 | 5 | **CURIOSITY_NO_GO:** model extraction/probing prohibited and irrelevant |

Stop reason: **coverage and saturation**. Public sources answer the surface contract and
product-boundary questions; the remaining high-value gaps require written provider answers
or separately authorized live contract tests.

## 13. Primary sources

All accessed 2026-08-17.

- **[S1]** Parallel, “Responses API Quickstart” —
  https://docs.parallel.ai/responses-api/responses-quickstart
- **[S2]** Parallel, “Statefulness” —
  https://docs.parallel.ai/responses-api/features/statefulness
- **[S3]** Parallel, “Responses API Structured Outputs” —
  https://docs.parallel.ai/responses-api/features/structured-outputs
- **[S4]** Parallel, “Responses API Streaming Events” —
  https://docs.parallel.ai/responses-api/features/streaming-events
- **[S5]** Parallel, “Citations” —
  https://docs.parallel.ai/responses-api/features/citations
- **[S6]** Parallel, “OpenAI Responses Compatibility” —
  https://docs.parallel.ai/responses-api/openai-compatibility
- **[S7]** Parallel, “Create Response” public OpenAPI reference —
  https://docs.parallel.ai/api-reference/responses-api/create-response
- **[S8]** Parallel, “OpenAI ChatCompletions Compatibility” —
  https://docs.parallel.ai/chat-api/chat-quickstart
- **[S9]** Parallel, “Chat Completions” public OpenAPI reference —
  https://docs.parallel.ai/api-reference/chat-api-beta/chat-completions
- **[S10]** Parallel, “Introducing the Parallel Chat API,” 2025-05-30 —
  https://parallel.ai/blog/chat-api
- **[S11]** Parallel, “Introducing research models with Basis for the Parallel Chat API,”
  2026-01-15 — https://parallel.ai/blog/research-models-chat
- **[S12]** Parallel, “Introducing the Parallel Responses API,” 2026-07-21 —
  https://parallel.ai/blog/responses-api
- **[S13]** Parallel, “Parallel API Pricing” —
  https://docs.parallel.ai/getting-started/pricing
- **[S14]** Parallel, “API Rate Limits” —
  https://docs.parallel.ai/getting-started/rate-limits
- **[S15]** Parallel, “API Error Codes and Warnings” —
  https://docs.parallel.ai/resources/warnings-and-errors
- **[S16]** Parallel, “Interactions” —
  https://docs.parallel.ai/task-api/guides/interactions
- **[S17]** Parallel, “Parallel API FAQs” —
  https://docs.parallel.ai/resources/faqs
- **[S18]** Parallel, “Pricing” — https://parallel.ai/pricing
- **[S19]** Parallel, “Privacy Policy” — https://parallel.ai/privacy-policy
- **[S20]** Parallel Web Systems Inc., “Customer Terms and Conditions” —
  https://parallel.ai/customer-terms
- **[S21]** Parallel, “Research Basis” —
  https://docs.parallel.ai/task-api/guides/access-research-basis
- **[S22]** Parallel, “Parallel API Changelog” —
  https://docs.parallel.ai/resources/changelog

## 14. Confidence summary

| Area | Confidence | Reason |
|---|---|---|
| Responses request and output fields | High | dedicated compatibility page and OpenAPI mostly agree |
| Responses streaming/citations | High | dedicated feature pages and schemas agree |
| Responses internal research loop | Medium | behavior is stated, but steps/bounds are hidden and untested |
| Chat models and pricing | High | guide, pricing, launch posts, and changelog agree |
| Chat wire details | Medium-low | endpoint, interactions, and response shapes conflict |
| Citation/Basis structure | High | explicit typed schemas; empirical quality untested |
| Budget/stopping behavior | Medium | opaque tiers are explicit; exact internal limits/cancellation unknown |
| Errors and retry safety | Medium-low | explicit fragments conflict and no live checks were authorized |
| Privacy/retention | Medium | state/ZDR facts are explicit; duration/deletion unknown; training claims conflict |
| Safety controls | Low | schemas hint at moderation/content filtering but operational policy is undocumented |
| Production fitness for Curiosity | Medium-low | material contract, state, safety, and boundedness checks remain |
