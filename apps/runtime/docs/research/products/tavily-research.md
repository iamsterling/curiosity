# Tavily Research: clean-room product study

**Access date:** 2026-08-17  
**Scope:** Tavily's hosted `/research` product, independently of the public
Search, Extract, Map, and Crawl APIs except where official material explicitly
describes Research's internals or creates a useful contrast.  
**Status:** research evidence and recommendations, not an implementation,
benchmark, legal opinion, purchase, or endorsement.

## Decision frame and result

**Question.** Which Tavily Research contract and orchestration ideas should
`opencode2-curiosity` adopt or adapt without delegating authority, evidence
custody, or an unbounded curiosity loop to a proprietary hosted agent?

Bounded sub-questions were: (1) task and job contracts; (2) planning and query
branching; (3) retrieval/extraction/crawl behavior; (4) evidence and citation
fidelity; (5) budgets, stopping, errors, and price; (6) safety, privacy,
freshness, and provenance; and (7) clean-room architectural lessons. Primary
vendor documentation, the published OpenAPI description, current legal terms,
and this repository's accepted contracts were used. No API key, paid request,
live benchmark, hidden endpoint, proprietary code, or access-control bypass was
used. Public behavior was not probed because Tavily's terms prohibit reverse
engineering, discovering underlying algorithms, competitive access, and third-
party disclosure of performance analysis [S14].

**Overall verdict — ADAPT patterns, REJECT as Curiosity's control plane (high
confidence).** Research has a notably small asynchronous task envelope, visible
query fan-out in streaming mode, explicit narrow/deep model routing, nested Pro
subtopics, terminal source inventory, structured output, and provider-side cost
bounds. Those are useful interface precedents. It does not expose the controls
Curiosity requires for branch authority, aggregate/per-branch budgets,
disconfirmation, evidence anchoring, reproducible provenance, freshness,
stopping reasons, cancellation, or safe partial results. It should not replace
the provider-neutral `web_search` ABI or become the mechanism that decides when
Curiosity continues.

Labels below mean **FACT** (directly documented), **INFERENCE** (reasoned but not
verified internally), **RECOMMENDATION** (project choice), and **UNKNOWN**
(materially undocumented). Confidence is high/medium/low.

## 1. Public research-task contract

### 1.1 Create request

**FACT (high).** `POST https://api.tavily.com/research` uses bearer-key
authentication and requires only `input`. Optional controls are:

| Field | Public behavior |
| --- | --- |
| `model` | `mini`, `pro`, or `auto` (default). Mini is targeted/efficient; Pro is comprehensive, multi-angle/multi-agent; Auto routes by complexity. |
| `stream` | `false` by default; `true` returns SSE. |
| `output_schema` | Restricted JSON Schema-shaped object with `properties` and optional `required`; content may then be an object rather than a Markdown string. |
| `citation_format` | `numbered` (default), `mla`, `apa`, or `chicago`. |
| `include_domains` | At most 20 host names; a **soft preference**, including subdomains. It is not an allowlist. |
| `exclude_domains` | At most 20 host names; a hard downward subdomain blocklist for URLs appearing in the response. |
| `output_length` | `short`, `standard` (default), or `long`; a target, explicitly not a hard cap. |
| `files` | Up to five base64 `.txt`, `.md`, or `.json` files, at most 80,000 words each and combined; files may be used and cited alongside the web. |

The OpenAPI schema states no length bound for `input`, no byte bound for an
encoded request, and no maximum nesting/size for `output_schema` [S1]. These are
documentation absences, not evidence that the service has no operational
limits.

**FACT (high).** A non-streaming accepted request returns HTTP 201 with
`request_id`, `created_at`, `status: pending`, echoed `input`, the selected
`model`, and `response_time`. The response is a queue acknowledgement, not the
report [S1].

### 1.2 Polling state machine

```text
POST /research
  -> 201 pending + request_id
  -> GET /research/{request_id}
       -> 202 pending | in_progress
       -> 200 completed {content, sources}
       -> 200 failed {request_id, status, response_time}
```

**FACT (high).** The terminal completed payload contains `request_id`,
`created_at`, `status`, `content` (string or object), `sources`, and
`response_time`. A source has only `title`, `url`, and `favicon`. A failed task
has no documented cause or partial report. Poll errors are 401, 404, and 500
[S2]. The official tutorial polls every five seconds; the CLI defaults to a
10-second poll interval and a 600-second local wait timeout [S4, S12].

**UNKNOWN (high relevance).** The public Research contract documents no
idempotency key, duplicate-submission semantics, cancellation endpoint,
deadline/server timeout, webhook, priority, queue position, concurrency limit,
job/result expiry, retry policy, resumable stream cursor, or partial-result
recovery. The CLI timeout bounds how long that client waits; documentation does
not say it cancels the server task.

### 1.3 Streaming contract

**FACT (high).** `stream: true` returns `text/event-stream` events shaped like
OpenAI chat-completion chunks. Deltas can carry a tool call, tool response,
content, or final sources. A normal sequence is Planning call/response,
WebSearch call/response, optional Pro `ResearchSubtopic` cycles, Generating
call/response, content chunks, one complete sources event, and `event: done`.
WebSearch calls expose a `queries` array; tool responses expose discovered
`{url,title,favicon}` sources. Pro nested work carries a
`parent_tool_call_id` [S3].

**FACT (high).** A stream can terminate with a generic object-level error such
as `{"object":"error","error":"An error occurred while streaming the research
task"}` [S3]. No typed error code, retryability, last durable offset, billed
usage, or recovery instruction is documented.

**Contract quality concerns (fact/inference, medium).** The create and poll
schemas declare `response_time` as integer while their examples use `1.23`.
The completed poll payload omits the original input, selected model,
`completed_at`, and credit usage. Stream event examples use both request-like
and event-like IDs without a separately documented durable event sequence.
Consumers should therefore normalize defensively rather than treat examples as
a perfectly consistent wire specification [S1-S3].

## 2. Planning, branching, retrieval, and stopping

### 2.1 What is observable

**FACT (high).** Both models run Planning, WebSearch, and Generating. A
WebSearch step may execute several query strings in one call. Pro alone adds
nested `ResearchSubtopic` work. Official best practices describe Pro as
multi-agent and suited to multi-domain questions, Mini as narrow/targeted, and
Auto as a complexity router [S3, S5]. This is explicit plan -> query fan-out ->
optional subtopic fan-out -> synthesis.

**INFERENCE (medium).** Mini resembles one orchestrator with a batched search
branch set; Pro resembles a coordinator spawning bounded subtopic workers, each
able to perform nested retrieval. `parent_tool_call_id` is enough to reconstruct
a partial execution tree while streaming, but branch intent, branch budget,
selection rationale, and merge policy remain opaque.

### 2.2 Search, extraction, and crawl distinction

**FACT (high).** The Research streaming vocabulary exposes only `WebSearch` as
its retrieval tool—never public-tool names `Extract`, `Crawl`, or `Map` [S3].
The official tutorial nevertheless says research agents autonomously “search,
extract, and synthesize” multiple sources [S4]. Separately, Tavily documents
Search, Extract, Crawl, Map, and Research as distinct public endpoints and gives
each independent request/price contracts [S7, S13].

**INFERENCE (medium).** Research's internal WebSearch likely includes content
retrieval/extraction sufficient for synthesis, or invokes shared private
retrieval components. There is no source-backed basis to claim that Research
calls the public `/extract`, `/crawl`, or `/map` endpoints. There is likewise no
evidence of site-graph traversal during a Research task.

**UNKNOWN.** Search depth, result count, extraction depth, fetched bytes,
rendering, robots behavior, per-domain concurrency, index versus live fetch,
cache use, crawl breadth/depth, duplicate handling, and third-party index use
for an individual task are not exposed.

### 2.3 Budget and stop semantics

**FACT (high).** Callers can choose model, targeted output length, domain
preferences/blocks, citation style, and output shape. Research creation is
limited to 20 requests/minute for both development and production keys; status
polling uses default limits (100 development, 1,000 production RPM). A 429 has
a `retry-after` header [S6].

**FACT (high).** Price creates a hard provider-side envelope: Mini consumes
4–110 credits and Pro 15–250 credits per request. At published monthly-plan
rates ($0.005–$0.0075/credit), that is approximately $0.02–$0.825 for Mini and
$0.075–$1.875 for Pro; at $0.008 PAYGO it is $0.032–$0.88 and $0.12–$2.00,
respectively. The free plan supplies 1,000 monthly credits. Actual consumption
is dynamic [S7, S8]. `model=auto` has no separately published preflight price
range; it presumably inherits the chosen tier, but that is not stated.

**FACT (high).** Research responses have no `include_usage` control. Aggregate
Research credit use appears in `/usage`; paid-plan `/logs` can report each
Research request's model tier, response time, credits, masked key, and request
ID, but never request input or output [S9, S10]. Thus cost can be reconciled
afterward, not constrained by an explicit caller-provided max-credit value.

**INFERENCE (high).** The provider must have internal stopping/resource rules to
keep work inside the published maximum, but those rules are not contractual.
No caller control bounds searches, branches, subtopics, sources, wall-clock
execution, or marginal-gain threshold. `output_length` controls the answer
target, not documented retrieval effort. A broad prompt can therefore spend
any amount inside a wide dynamic band.

**UNKNOWN.** No stopping reason—coverage, saturation, contradiction resolved,
budget, timeout, policy block, or retrieval failure—is returned. No documented
partial-failure model distinguishes “report complete” from “report generated
despite inaccessible branches.”

## 3. Evidence, citations, provenance, and freshness

**FACT (high).** A completed result provides a report and a terminal source
inventory; streaming reveals sources discovered per WebSearch call and later
the complete list “used.” Citation formatting can be selected, and uploaded
files are said to be cited when used [S1-S4].

**Evidence strengths.** Source URLs are first-class rather than buried only in
prose; streamed query arrays and tool-call IDs provide a useful, if transient,
retrieval trace; terminal source emission after content offers a deterministic
UI handoff; attachment citation allows mixed local/web research.

**Evidence weaknesses (fact, high).** The machine-readable source object has no
claim or citation ID, cited passage, quote, offsets, content, score, publication
date, fetch/access time, canonical URL, source type, author/publisher, document
version, content hash, extractor/model version, branch ID, or support/
contradiction relation [S2, S3]. Citation style changes presentation, not this
evidence schema. Structured output does not document claim-level citation
binding; sources remain a separate array.

**INFERENCE (high).** A human may follow numbered/author-date citations in the
report, but an application cannot reliably prove from the response alone which
captured passage entailed a structured field. URLs can drift after job
completion. The final source list is provenance of selection, not a chain of
custody.

**FACT (high).** Research has no date range, topic/news mode, country, locale,
or freshness field. These exist on the separate Search API but not in the
Research request [S1, S13]. A caller can write “latest” or dates in `input`, but
that is model guidance rather than a typed filter. Completed sources expose no
publication date or observed-at time [S2].

**UNKNOWN.** Whether a cited page was live-fetched, served from a Tavily cache
or index, supplied by a third-party index, and which version the model read
cannot be determined. Tavily markets real-time/fresh web access, but vendor
positioning is not evidence of per-citation freshness.

## 4. Errors and operational observability

| Phase | Documented outcomes | Material gap |
| --- | --- | --- |
| Create | 201; 400 invalid request; 401; 429; custom 432 plan/key limit; custom 433 PAYGO limit; 500 | No idempotency or admission-cost estimate. |
| Poll | 202 pending/in-progress; 200 completed/failed; 401; 404; 500 | Failed object has no reason, retryability, partial sources, or timestamps. |
| Stream | progress/content/sources/done; generic error object | No HTTP/SSE error taxonomy, resume cursor, checksum, or documented reconnect behavior. |
| Account | aggregate `/usage`; paid per-request `/logs` | Actual Research credits are outside the task result; logs omit input/output. |

**RECOMMENDATION (high).** If ever used experimentally, wrap provider statuses
in stable redacted internal diagnostics; honor `retry-after`; cap poll count and
elapsed time; treat timeout as “client gave up, server disposition unknown”;
record request ID and post-job credits; do not automatically resubmit an
ambiguous create or failed stream because duplicate billing is undocumented.
These are evaluation controls, not authority to integrate the service.

## 5. Safety, privacy, and legal boundary

### 5.1 Safety

**FACT (high).** Tavily's AUP prohibits unlawful/harmful uses, unauthorized
scraping of the service, reverse engineering, abusive load, vulnerability
testing without permission, and many categories of dangerous input. Sensitive
credentials, financial/health/government identifiers, children's data, and
GDPR special-category data may not be uploaded without prior written consent.
Customers must independently verify Outputs; Tavily does not guarantee their
accuracy, legality, non-infringement, or suitability [S15]. Platform Terms also
forbid significant high-risk automated decisions without human oversight and
state that AI output may be inaccurate, incomplete, biased, stale, or
misleading [S14].

**FACT (high).** The public Research request has no `safe_search` parameter and
its response contains no safety verdict. `safe_search` is an Enterprise-only
control on the separate Search API [S1, S13]. Product-page assertions that
security layers block PII leakage, prompt injection, and malicious sources are
vendor claims, not a documented Research failure contract [S19].

**INFERENCE (high).** Web pages and attached files are untrusted prompt-bearing
inputs. A cited report is not evidence that indirect prompt injection,
poisoning, unsafe content, or source-rights issues were eliminated. The caller
must preserve Curiosity's existing untrusted-result label and independent
verification.

### 5.2 Privacy and retention contradiction

**FACT (high).** Tavily's privacy policy says it collects query data and uploaded
documents to provide results; unless contractually specified otherwise, it may
use portions of query data to improve future responses. It may share queries
with third-party search-index providers when its own index is insufficient and
uses purpose/need-based—not a fixed numeric—retention period [S16]. An account
setting says OFF means query data is not stored or used for improvement [S17].

**FACT (high).** The May 2026 Platform Terms are broader: sections 6.5 and 6.7
allow Tavily and third-party AI providers to process and retain Customer Input
and Output for training/improvement, and section 9.2 grants a perpetual,
irrevocable, sublicensable processing license for providing, monitoring,
researching, and improving services. A separately executed written agreement
can supersede online terms [S14]. By contrast, the FAQ markets “zero data
retention” without stating in that claim whether it is plan-, setting-, or
contract-specific [S18].

**ASSESSMENT (high).** “Zero retention” must not be assumed. The public
statements are materially difficult to reconcile without the customer's exact
order form, DPA, query-data setting, subprocessor terms, and an explanation of
how Research attachments/outputs are treated. The legal terms control over a
marketing FAQ for risk analysis.

**FACT (high).** Tavily's Trust Center reports SOC 2 Type II and names US-hosted
subprocessors including AWS, MongoDB, Snowflake, and Elastic Cloud [S20]. This
supports the existence of audited controls, not zero retention, data residency,
or fitness for a specific dataset.

**RECOMMENDATION (high).** Never submit repository secrets, credentials,
personal/sensitive data, private source, or proprietary attachments. Before any
organizational trial, require legal/security review of current Terms, DPA,
subprocessors, data regions, model providers, retention/deletion SLA, query-data
setting enforcement, incident terms, and training exclusion. Use synthetic or
public test prompts only.

## 6. Architectural inference and curiosity patterns

The following is a behavior-level inference, not a claim about proprietary
implementation:

```text
typed task + optional files
  -> complexity router (Auto -> Mini or Pro)
  -> planner
  -> batched WebSearch query branches
  -> [Pro: nested ResearchSubtopic branches]
  -> source/content selection and extraction (mechanism opaque)
  -> report/structured-output generator
  -> citation rendering + terminal source inventory
  -> async result store / polling, or SSE projection
  -> account usage/log accounting
```

### Patterns worth adapting

1. **ADAPTED — explicit narrow/deep profiles.** A cheap narrow profile and a
   deeper multi-branch profile make scope/cost legible. Curiosity should select
   a provider-neutral `research_depth` only inside caller-declared authority;
   never let provider Auto routing widen authority.
2. **ADAPTED — observable query fan-out.** Emit planned query strings before
   execution and tie results to branch/parent IDs. Tavily's stream demonstrates
   the UI value; Curiosity must retain richer intent, budget, and stop fields.
3. **ADAPTED — nested parent IDs.** A shallow branch DAG is more inspectable
   than hidden recursion. Enforce maximum depth, fan-out, and aggregate budget.
4. **ADAPTED — terminal source manifest.** Separate incremental discoveries
   from final sources actually used. Extend each used source with immutable
   capture/passage provenance and claim edges.
5. **ADAPTED — async job projection.** Pending/in-progress/completed/failed is a
   useful transport state machine for long work, but add cancellation,
   deadlines, partial failure, idempotency, expiry, and durable event sequence.
6. **ADAPTED — structured output descriptions.** Typed output is useful for
   pipelines, but validate locally and bind evidence to every material field.
7. **ADAPTED — bounded dynamic spend.** Provider min/max prices demonstrate a
   hard outer envelope. Curiosity needs a much tighter caller-set max and
   pre-execution estimate, plus branch marginal cost and an explicit stop code.

### Patterns not demonstrated

**FACT/negative result (high).** No public Tavily Research field or event
demonstrates a post-synthesis gap inventory; relevance/value/novelty/cost gap
scoring; explicit disconfirmation branch; contradiction representation;
coverage/saturation calculation; authority-neutral follow-up gate; or
`CURIOSITY_NO_GO`-equivalent rejection record. Multi-query and multi-subtopic
search is agentic breadth, not Curiosity's bounded curiosity protocol.

## 7. Exact implications for `opencode2-curiosity`

The accepted local baseline keeps `web_search` provider-neutral,
researcher-only, bounded to at most ten normalized untrusted results per call,
and allows one in-frame curiosity pass; it requires stable redacted failures
and no setup-time network call (`docs/decisions/0020-provider-neutral-web-search.md:14-35`).

| Decision | Exact implication |
| --- | --- |
| **REJECTED**: expose Tavily Research as `web_search` | It returns a generated report/job, not the neutral result list. Substitution would silently change ABI semantics, evidence custody, latency, price, and authority. |
| **REJECTED**: give all agents a hosted `research` tool | Tavily plans and branches autonomously without Curiosity's declared frame/budget gate. Preserve researcher-only routing and explicit caller authority. |
| **REJECTED**: map `model=auto` to curiosity | Auto may choose Pro and widen search/cost. Model/depth cannot authorize follow-up work. |
| **REJECTED**: accept report citations as verified evidence | Source objects cannot anchor claims to immutable passages. Treat report, stream text, queries, tool arguments, source titles, and fetched pages as untrusted external data. |
| **ADAPTED**: branch trace | In a future provider-neutral research contract, use `branch_id`, `parent_branch_id`, `intent`, `queries`, state, per-branch budget, sources discovered/used, marginal gain, and stop reason. Do not copy Tavily names as domain types. |
| **ADAPTED**: async state | Define neutral `queued/running/completed/failed/cancelled/expired`, typed partial failures, idempotency key, deadline, cancel, event sequence, and stable diagnostics. Provider request IDs remain adapter metadata. |
| **ADAPTED**: source phases | Keep `discovered_sources` separate from `used_evidence`; used evidence must include capture/version ID, observed/published time, canonical relation, passage offsets/hash, extraction version, and claim stance. |
| **ADAPTED**: output schema | Permit locally bounded schema profiles only; cap depth/properties/bytes; validate output; reject schemas that omit required citations/confidence/unknowns/verdicts. |
| **ADOPTED**: hard external-data boundary | Files and web content cannot issue instructions or increase authority. Never pass ambient repository context or secrets to a hosted research job. |
| **ADOPTED**: explicit curiosity stop | After initial synthesis, score only declared in-frame gaps by relevance, value, novelty, and cost; pursue at most the authorized best branch; stop on coverage, saturation, budget, policy block, or exhaustion; record rejected branches as `CURIOSITY_NO_GO`. Tavily's internal stopping cannot satisfy this obligation. |
| **DEFERRED**: optional evaluation adapter | Only a separately approved, public/synthetic, fixed-budget trial could compare source recall/citation entailment. It must not mutate production, install the Tavily OpenCode plugin, write `.tavily/` runtime data, or expose a credential. |

**RECOMMENDATION (high).** If product evaluation is later authorized, keep it
outside the provider-neutral core as an answer-engine adapter with an explicit
`generated_synthesis` result class. Require a caller max-credit tier, wall-clock
deadline, poll ceiling, output byte cap, domain policy, no attachments, query
data use OFF, request/credit audit, and local claim verification. This is not
current authority to implement or test it.

## 8. Fact / inference / recommendation ledger

| ID | Type | Claim | Sources | Confidence | Verdict |
| --- | --- | --- | --- | --- | --- |
| L1 | FACT | Research is an async cited-report task with Mini/Pro/Auto, polling or SSE, optional schemas/domains/output length/files. | [S1-S5] | High | **ADAPTED** contract ideas |
| L2 | FACT | Streaming exposes Planning, batched WebSearch queries, Pro-only nested subtopics, Generating, sources, and done. | [S3] | High | **ADAPTED** observability |
| L3 | INFERENCE | Mini is shallow batched fan-out; Pro is a nested coordinator/worker shape. | [S3-S5] | Medium | **ADAPTED**, not copied |
| L4 | FACT | Research docs do not expose Extract/Crawl/Map tool events; one tutorial says agents extract. | [S3-S4] | High | Public API reuse **UNKNOWN** |
| L5 | FACT | Caller-visible retrieval budgets and stopping reasons are absent; provider price bounds are Mini 4–110 and Pro 15–250 credits. | [S1-S3], [S7] | High | Hosted control plane **REJECTED** |
| L6 | FACT | Source records contain only title, URL, and favicon. | [S2-S3] | High | Evidence shape **REJECTED**, manifest idea **ADAPTED** |
| L7 | INFERENCE | URLs plus formatted prose citations are insufficient for reproducible claim-level provenance. | [S2-S3] | High | Add passage/version edges |
| L8 | FACT | Research lacks typed freshness controls and source timestamps. | [S1-S2], [S13] | High | Must not claim enforced freshness |
| L9 | FACT | Failed jobs and streams provide very little diagnostic/recovery detail. | [S2-S3] | High | Error shape **REJECTED** |
| L10 | FACT | Public privacy/help/FAQ/terms statements differ materially on retention and improvement/training use. | [S14], [S16-S18] | High | Sensitive use **REJECTED** pending contract review |
| L11 | FACT | Tavily legal terms prohibit the invasive reverse engineering and competitive testing intentionally not performed here. | [S14-S15] | High | Boundary **ADOPTED** |
| L12 | RECOMMENDATION | Preserve neutral `web_search`, researcher-only authority, untrusted data, and one explicit bounded curiosity pass. | Local ADR 0020; [S1-S3] | High | **ADOPTED** |
| L13 | RECOMMENDATION | Any future Tavily experiment must be isolated, synthetic/public, fixed-budget, contract-reviewed, and evidence-verified. | [S7], [S14-S17] | High | **DEFERRED** |

## 9. Unknowns and checks required before any revisit

1. Exact `input`/request/schema/response byte limits and server execution
   deadline; queue and result-retention/expiry semantics.
2. Idempotency, duplicate billing, cancellation, stream reconnect, and whether a
   client timeout leaves a billable task running.
3. Actual Auto routing and credit envelope; whether admission can reject a task
   before it exceeds a caller-defined remaining budget.
4. Internal search/extraction/render/cache/index/crawl behavior and partial
   retrieval failures. This must be answered by Tavily documentation/support,
   not invasive reverse engineering.
5. Citation-to-claim mapping, captured passage/version retention, URL freshness,
   deduplication, source diversity, and citation correction behavior.
6. Whether hard excluded domains are excluded from retrieval/model context or
   only guaranteed absent from the response; the docs promise the latter.
7. Research-specific prompt-injection, unsafe-content, malware, and attachment
   isolation controls; no Research `safe_search` contract is published.
8. Current DPA/order-form precedence, query-data OFF guarantees for Research,
   third-party model/index providers, regions, deletion SLA, backups, and
   training exclusion for prompts, attachments, and outputs.
9. Completed-task schema inconsistencies (`response_time` numeric type;
   model/input/completion time/usage omission) and versioning guarantees.
10. Independent quality and cost measurements on a predeclared public corpus;
    vendor feature claims are not comparative evidence.

## 10. Bounded curiosity pass

Scoring is 1 (low) to 5 (high); cost is 1 (cheap) to 5 (expensive). This pass
stayed inside the declared product-contract and clean-room frame.

| Thread | Rel. | Value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Reconcile Research price bounds with request-level accounting | 5 | 5 | 3 | 1 | **Pursued:** pricing plus Usage/Logs showed hard provider maxima but only post-hoc per-request spend [S7, S9-S10]. |
| Determine whether Research uses Crawl/Extract | 5 | 4 | 4 | 2 | **Pursued to saturation:** streaming lists only WebSearch; tutorial says extract; public API reuse remains unknown [S3-S4]. |
| Check privacy “zero retention” against operative terms | 5 | 5 | 5 | 2 | **Pursued:** terms, privacy policy, setting help, and FAQ materially conflict [S14, S16-S18]. |
| Infer proprietary ranking/planner prompts or model identities | 1 | 2 | 3 | 5 | `CURIOSITY_NO_GO`: prohibited/unnecessary and cannot change the interface verdict. |
| Run free/paid black-box tasks to count branches and credits | 4 | 4 | 3 | 4 | `CURIOSITY_NO_GO`: caller forbade credentials/paid tests; no predeclared corpus or contractual clearance. |
| Inspect plugin/SDK source to reconstruct hidden endpoints | 2 | 2 | 3 | 4 | `CURIOSITY_NO_GO`: public contract is sufficient; hidden implementation work violates the clean-room frame. |
| Seek non-public Trust Center/DPA artifacts | 4 | 5 | 3 | 4 | **DEFERRED:** requires organizational identity, legal purpose, and caller authority. |
| Benchmark Tavily against other research APIs | 2 | 3 | 2 | 5 | `CURIOSITY_NO_GO`: outside the independent Tavily Research frame. |

**Stop decision.** Coverage reached every requested category; additional public
pages repeated the same task/stream model. The highest-value contradiction
(retention) and architecture ambiguity (Extract/Crawl) were pursued to the
limit of public primary evidence. Stop on coverage and saturation; unknowns
above require vendor, legal, or separately authorized evaluation work.

## 11. Primary sources

All sources accessed 2026-08-17. Vendor documentation establishes published
behavior, not implementation internals or comparative quality.

- **[S1]** Tavily, [Create Research Task](https://docs.tavily.com/documentation/api-reference/endpoint/research.md) — canonical POST schema and create errors.
- **[S2]** Tavily, [Get Research Task Status](https://docs.tavily.com/documentation/api-reference/endpoint/research-get.md) — polling states and terminal payloads.
- **[S3]** Tavily, [Research Streaming](https://docs.tavily.com/documentation/api-reference/endpoint/research-streaming.md) — event/tool vocabulary and execution sequence.
- **[S4]** Tavily, [Deep Research with Streaming](https://docs.tavily.com/examples/quick-tutorials/research-streaming.md) — official polling/stream examples and “search, extract, synthesize” description.
- **[S5]** Tavily, [Best Practices for Research](https://docs.tavily.com/documentation/best-practices/best-practices-research.md) — model selection, prompting, output, session guidance.
- **[S6]** Tavily, [Rate Limits](https://docs.tavily.com/documentation/rate-limits.md) — Research create and polling limits; retry header.
- **[S7]** Tavily, [Credits & Pricing](https://docs.tavily.com/documentation/api-credits.md) — plans, rates, and Research min/max credits.
- **[S8]** Tavily, [Pricing](https://www.tavily.com/pricing) — corroborating current plan and PAYGO prices.
- **[S9]** Tavily, [Usage API](https://docs.tavily.com/documentation/api-reference/endpoint/usage.md) — aggregate Research usage.
- **[S10]** Tavily, [Logs API](https://docs.tavily.com/documentation/api-reference/endpoint/logs.md) — paid per-request credit logs and no input/output logging in that API.
- **[S11]** Tavily, [Changelog](https://docs.tavily.com/changelog.md) — May/August 2026 Research fields and logs lifecycle evidence.
- **[S12]** Tavily, [CLI](https://docs.tavily.com/documentation/tavily-cli.md) — client polling interval/timeout and OpenCode-adjacent operational behavior.
- **[S13]** Tavily, [OpenAPI specification](https://docs.tavily.com/documentation/api-reference/openapi.json) — cross-endpoint contrast for Search/Extract/Crawl controls.
- **[S14]** Tavily, [Platform Terms of Service](https://www.tavily.com/terms) (updated 2026-05-04) — reverse-engineering, AI input/output, verification, retention/training, and license terms.
- **[S15]** Tavily, [Acceptable Use Policy](https://www.tavily.com/acceptable-use-policy) (updated 2026-05-05) — prohibited input/use and output-verification duties.
- **[S16]** Tavily, [Privacy Policy](https://www.tavily.com/privacy) (updated 2025-11-24) — query/document processing, third-party indexes, improvement, retention.
- **[S17]** Tavily Help, [Allow Use of Query Data](https://help.tavily.com/articles/4205958832-understanding-the-allow-use-of-query-data-setting) — account setting's ON/OFF representation.
- **[S18]** Tavily, [FAQ](https://docs.tavily.com/faq/faq.md) — “zero data retention” vendor claim and output caveats.
- **[S19]** Tavily, [Product](https://www.tavily.com/product) — vendor security/freshness positioning, used only as a claim.
- **[S20]** Tavily, [Trust Center](https://trust.tavily.com/privacy) — SOC 2 Type II assertion and disclosed subprocessors.
