# You.com Research API: clean-room reverse-engineering dossier

**Research and source-access date:** 2026-08-17
**Scope:** You.com's public Research API only. Search, Contents, Live News,
billing, SDK, privacy, and legal material are used only where they directly
explain Research's dependencies or operating boundary. Finance Research,
Answer, consumer chat, and provider comparisons are out of scope.
**Status:** documentation-based behavioral and contract analysis; not an
implementation, live test, benchmark, purchase recommendation, or legal
opinion.

## Executive verdict

**ADAPT the visible effort profiles, source policy, warning channel,
schema-constrained output, and replayable asynchronous task projection; REJECT
You.com Research as Curiosity's search ABI or control plane; DEFER any provider
adapter or evaluation to separately authorized legal, privacy, and empirical
review (high confidence).**

Research is a hosted generated-answer system, not raw retrieval. A caller gives
it a task, an opaque compute tier, optional source controls, and optionally a
restricted JSON Schema. You.com says its agent plans an iterative strategy,
chooses Search, Contents, Live News, and undisclosed internal tools, evaluates
sources, compacts very large contexts, and stops when it has enough information
within the selected tier's budget. The response is Markdown with inline source
numbers or a schema-conforming object, plus URLs/titles/snippets and warnings
[S1-S3].

The product has strong interface precedents: five explicit effort/price tiers,
strict domain controls, a bounded schema subset, synchronous and durable
background modes, task timestamps, terminal states, warnings, and SSE replay by
event ID. Its decisive gaps for Curiosity are equally clear. It exposes neither
the plan nor generated queries; no branch IDs, per-branch or aggregate search/
page/token budgets, deadline, hard cost cap, coverage score, marginal-gain
measure, stopping reason, contradiction ledger, or cancellation operation is
documented. Citations point to mutable URLs and snippets, not immutable page
captures or claim-support edges. Research is excluded from You.com's current
Zero Data Retention program [S6].

No credential, free credit, paid call, API request, consumer traffic capture,
private interface, package installation, access-control bypass, or proprietary
implementation inspection was used. Public docs and official open-source SDK
artifacts were read. This boundary is material because You.com's Terms prohibit
attempts to discover underlying components, broad programmatic extraction, and
competing-service development [S9].

## 1. Decision frame, bounded questions, and evidence rules

### Questions

1. What task, output, and lifecycle contracts are publicly promised?
2. What can be established about planning, query branching, retrieval, source
   reading, context management, and synthesis?
3. Which budgets and stop conditions are caller-visible, provider-owned, or
   absent?
4. How strong are citations, source manifests, warnings, provenance, and
   freshness semantics?
5. What do errors, rate limits, pricing, privacy, safety, and legal boundaries
   require from a bounded integration?
6. Which behavior-level ideas should Curiosity adopt, adapt, reject, or defer?

### Evidence rules

- **FACT** means directly documented by You.com or present in an official,
  publicly published artifact. Vendor documentation proves a represented
  contract, not quality or faithful execution in every case.
- **INFERENCE** is the simplest architecture interpretation consistent with
  public behavior; it is not a claim about proprietary internals.
- **RECOMMENDATION** is a Curiosity design conclusion.
- **UNKNOWN** records a material absence or unresolved contradiction.
- Confidence is **high**, **medium**, or **low**.
- Official endpoint references and guides are primary. Generated examples are
  contract illustrations, not live observations. Marketing accuracy and
  benchmark claims are not independent validation.
- Coverage target: planning/search/synthesis, branching, budgets/stopping,
  lifecycle, evidence, freshness, errors/pricing, privacy/safety, architecture,
  clean-room transfer, implications, unknowns, checks, and negative results.
- Stop on coverage and public-source saturation. No hidden-internal inference or
  black-box probing is necessary to answer the decision.

## 2. Product identity and public contract

### 2.1 Epistemic class

**FACT (high):** `POST https://api.you.com/v1/research` returns generated
research. You.com contrasts it with Search, which returns records “as-is”:
Research runs multiple searches, reads and reasons over sources, then returns a
ready-to-use answer or object [S1-S2]. It must therefore remain a
`generated_research` artifact, never a `retrieval_hit` or transparent evidence
store.

The synchronous response is:

```text
ResearchOutput
  output
    content: Markdown string | schema-conforming object
    content_type: text | object
    sources[]
      url: required
      title?: string
      snippets?: string[]
  warnings: string[]
```

Inline `[[n]]` markers in Markdown index `sources[]`. Structured output keeps
the same source array but does not automatically add citation fields to the
caller's object [S1-S2].

### 2.2 Request

| Field | Public behavior and bound |
| --- | --- |
| `input` | Required research task, maximum 40,000 characters. No separate system/policy channel is exposed. |
| `research_effort` | `lite`, `standard` (default), `deep`, `exhaustive`, or `frontier`. Compound server-owned compute/retrieval preset. |
| `source_control` | Beta domain, freshness, and country controls. |
| `output_schema` | Beta restricted JSON Schema subset; unavailable with `lite` (`422`). |
| `background` | Default `false`; `true` returns a task handle. Mandatory for `frontier` (`422` otherwise). |

Sources: [S1-S3].

No public Research request field directly sets language, SafeSearch,
publication-source class, result count, source minimum/maximum, primary-source
requirement, branch/query count, page-read count, token count, output byte/word
limit, wall-clock deadline, cost ceiling, citation style, model, temperature,
seed, tool allowlist, or tool-call budget.

### 2.3 Structured-output contract

**FACT (high):** schema validation happens before model execution and fails with
`422`. Rules include object root, no root `anyOf`, `properties` and
`additionalProperties: false` on every object, every property in `required`, no
recursion, and no bare null-only property. Nullable unions represent optional
information. Supported constructs include nested objects/arrays/enums, nested
`anyOf`, and non-recursive `$defs`/`$ref` [S1-S2].

| Limit | Maximum |
| --- | ---: |
| nesting depth | 5 |
| total properties | 100 |
| total enum values | 500 |
| strings across a large enum (>250 values) | 7,500 characters |
| counted schema strings | 25,000 characters |

Many validation keywords are unsupported, including string/array/numeric
bounds, uniqueness, patterns, `format`, conditional keywords, `allOf`, and
`not`. There is no separate raw schema byte limit; the 25,000-character budget
counts names and enum/constant strings, not JSON punctuation [S1].

**RECOMMENDATION (high):** adapt preflight schema rejection and explicit
nullability, but validate output locally and keep factual support separate from
shape conformance. The guide warns that a required, non-nullable field without
available information may become an empty string; a successful schema response
does not establish completeness or truth [S1].

## 3. Planning, query branching, retrieval, and synthesis

### 3.1 Supported facts

You.com publicly describes the following behavior [S1, S3]:

1. The agent reads the question and decides what to search.
2. It runs multiple searches and reviews results.
3. It visits promising pages and extracts relevant content.
4. It decides whether to search again, read more pages, or write.
5. It repeats until it has “enough information,” constrained by effort level.
6. It synthesizes and cites the answer.

The deeper guide adds that Research chooses among You.com Search for discovery,
Contents for deep reads, Live News for time-sensitive information, and “several
other internal tools.” It evaluates source freshness, diversity, and relevance.
Context masking and compaction support work beyond one model context window;
higher tiers can exceed 1,000 reasoning turns and process up to 10 million
tokens [S1].

**FACT (high):** the Research API itself does not return the plan, search
queries, query count, pages considered, pages rejected, tool calls, tool
arguments, branch graph, or per-step source evaluation. The public task SSE
reference promises connection/terminal events, not a typed planning trace
[S2, S4-S5].

**FACT/contract-drift signal (medium-high):** the official Python helper uses a
tolerant stream decoder because servers may emit event names outside the
documented enum, with examples such as `research.searching`,
`response.created`, and `response.output_item.added` [S12]. This establishes
that intermediate event vocabulary can evolve; it does not establish stable
payload schemas, query visibility, or a complete execution trace.

### 3.2 Query branching assessment

**INFERENCE (medium):** “multiple searches,” tool choice by sub-question, and
iterative search/read decisions imply query decomposition or expansion and at
least a logical branch set. Parallelism is not promised by the core Research
contract. The official biomedical example fans out four *caller-created*
Research requests concurrently, but that is sample orchestration outside one
Research task and does not prove server-internal parallelism [S13].

**UNKNOWN:** whether one task uses a tree, DAG, sequential loop, batched queries,
specialist agents, or a mixture; how query variants are generated; whether
branches recurse; how duplicates are merged; and how source diversity affects
selection. No public evidence supports a specific planner model, prompt,
ranking algorithm, context store, or orchestration framework.

**RECOMMENDATION (high):** Curiosity should expose branch intent, query,
`branch_id`, `parent_branch_id`, expected evidence, authority, budget, outcome,
and merge rationale. A provider's unobservable decomposition cannot fulfill
Curiosity's bounded curiosity ledger.

## 4. Budgets and stopping

### 4.1 What effort controls

**FACT (high):** `research_effort` selects a provider compute budget. Higher
tiers are represented as more searches, deeper page reading, more source
cross-referencing, and longer latency. The planner allocates more work to
ambiguous or high-stakes claims and less to well-sourced facts [S1-S2].

| Tier | Public list price / 1,000 calls | Guide latency on 2026-08-17 | Per-call list price |
| --- | ---: | --- | ---: |
| `lite` | $12 | `<10s` in Research guide; `<2s` in Billing | $0.012 |
| `standard` | $50 | ~10–30s | $0.050 |
| `deep` | $100 | <120s | $0.100 |
| `exhaustive` | $450 | <300s | $0.450 |
| `frontier` | $1,200 | background only; 30–12,000s, p50 300s | $1.200 |

Sources: [S1, S7]. Prices agree; `lite` latency does not. Another official
tutorial says roughly five seconds [S3]. These are planning ranges, not a
published SLA. Use the slowest stated bound until contract-tested.

### 4.2 What effort does not expose

No caller-set or returned field documents:

- maximum generated queries, branches, tool calls, page visits, sources, bytes,
  tokens, turns, or model invocations;
- per-branch or aggregate deadline and cancellation condition;
- preflight cost estimate, request-level maximum dollars, or billed usage;
- minimum coverage, required diversity, contradiction search, verification
  threshold, or marginal-gain threshold;
- stop reason such as `sufficient_evidence`, `saturation`, `budget_exhausted`,
  `timeout`, `policy_block`, or `partial_failure`;
- consumed and remaining budget.

**INFERENCE (high):** fixed per-tier pricing and latency ranges require internal
resource and stop policies, but the tier name is the only public proxy. “Until
enough” is provider discretion, not a reproducible or authority-neutral stop
contract.

**RECOMMENDATION (high):** Curiosity needs an independent aggregate budget
(`max_branches`, `max_searches`, `max_fetches`, `max_context_tokens`,
`max_output_bytes`, `max_cost`, `deadline`) and a terminal budget/stop record.
Provider tier is an adapter hint inside—not a substitute for—that envelope.

## 5. Synchronous and asynchronous lifecycle

### 5.1 Synchronous

Default `POST /v1/research` blocks and returns HTTP 200 with the final
`ResearchOutput`. Deep and exhaustive can exceed client timeouts. The official
Python SDK inherits a five-second HTTP-client default unless callers configure
one, and therefore recommends background mode for long runs [S2, S11-S12].

**Operational implication:** an HTTP timeout does not prove that server work
stopped or that a charge did not occur. No idempotency key or duplicate-request
contract is documented, so an automatic POST replay after an ambiguous timeout
can create duplicate work and cost.

### 5.2 Background task state

With `background: true`, POST returns:

```text
task_id, type=research, status=queued, stream_url, created_at
```

`GET /v1/research/{task_id}` exposes `queued`, `running`, `completed`, `failed`,
or `cancelled`, plus `created_at`, nullable `updated_at` and `completed_at`, the
original input object, nullable diagnostic `error`, and nullable final result
[S2, S4].

```text
queued -> running -> completed | failed | cancelled
```

**UNKNOWN (high relevance):** no cancellation endpoint appears in the current
public API index even though `cancelled` is a state. Also undocumented are
idempotency, task priority, queue position, admission estimate, maximum queue/
run time, concurrency, webhook delivery, task/result expiry, deletion, ownership
after key rotation, retry semantics, and partial result recovery.

### 5.3 SSE stream

`GET /v1/research/{task_id}/stream` returns SSE. The reference promises:

- a `connected` event;
- ping comments;
- terminal `completed`, `failed`, or `cancelled` event and stream close;
- integer `from_id` for replay after reconnect;
- a final status GET to retrieve the full result [S5].

Replay is a valuable contract precedent, but details are underspecified. The
example gives the connected event `id: 0`, while its completed event has a JSON
`sequence: 0` but no SSE `id:` line. Text alternates between replay “from” and
replay events “after” the supplied ID. No ordering, retention window,
deduplication, gap, invalid/expired cursor, or `Last-Event-ID` behavior is
defined [S1, S5].

**FACT (high):** SSE progress is not the authoritative final payload. Clients
must GET task status after closure. The SDK handles a possible race where SSE
signals completion before the persisted GET reports completion, polling up to
three additional times [S12]. This is useful evidence that terminal delivery
and durable result commit are separate lifecycle moments.

### 5.4 Contract discrepancies

1. The task status schema describes `warnings` inside `result`, but its official
   example places `warnings` at task top level and omits it inside `result`
   [S4]. Consumers must treat placement as a drift check, not guess.
2. The endpoint stream reference documents only connected/terminal names, while
   the official tolerant SDK helper anticipates additional workflow events
   [S5, S12]. Intermediate events are observability hints, not a stable ABI.
3. The task state enum contains `cancelled`, but no public cancellation operation
   is indexed [S4-S5, S10].

**RECOMMENDATION (high):** adapt the durable job projection, but define neutral
`queued/running/completed/failed/cancelled/expired`, explicit cancel and delete,
idempotency, deadline, partial results, terminal commit ID, monotonic event
sequence, resume semantics, and stable redacted error codes.

## 6. Evidence, citations, warnings, and provenance

### Strengths

- Markdown citations are first-class source-array references rather than only
  prose footnotes [S1-S2].
- Each source has a required URL and optional title/relevant snippets [S2].
- `warnings[]` is a separate channel for source-access issues or partial
  results, rather than silently folding all degradation into prose [S2, S4].
- Structured output and the evidence inventory remain separate, avoiding model-
  invented citation objects unless the caller explicitly requests them [S1].

### Limits

**FACT (high):** the documented source object contains no:

- citation or claim ID and no machine-readable claim-to-source edge;
- complete captured page body, exact quote offset, passage hash, or document
  version/capture ID;
- fetch/access/index timestamp, cache age, HTTP status, redirect chain,
  canonical URL, content digest, or extraction version;
- author, publisher identity, source class, primary/secondary role, language,
  publication/modified time, or license;
- branch/query/tool lineage, rank, source-selection reason, or rejected sources;
- support/contradict/unclear stance, entailment score, source-quality score, or
  calibrated confidence.

The guide claims every response claim links to a source and says sources can be
verified by following URLs [S1]. That is a vendor product assertion, not a
machine-checkable guarantee: snippets may not uniquely support a claim, URLs
can change, and structured output receives no automatic citation fields. Unlike
the separate Answer API, no Research contract promises a citation existence and
support verifier.

**FACT/negative result (high):** no response enumerates all search results,
pages read, sources considered but rejected, inaccessible pages, or uncited
internal evidence. `sources[]` is a selected source manifest, not proof of
evidence completeness or chain of custody.

Warnings help, but they are free-form strings. No code, affected branch/source,
severity, retryability, completeness percentage, or billing consequence is
documented. A completed task with warnings is therefore a degraded success whose
extent must be treated as unknown.

**RECOMMENDATION (high):** retain the distinction among discovered, read,
considered, cited, rejected, and failed sources. Bind every material claim or
structured field to an immutable lawful capture and passage offsets/hash, with
branch lineage, acquisition time/method, source role, support stance, and
verification result. Provider citations remain untrusted generated assertions.

## 7. Source controls and freshness

### 7.1 Domain policy

`source_control` supports [S1-S2]:

- `include_domains`: strict results allowlist, up to 500; incompatible with
  exclude and boost;
- `exclude_domains`: results blocklist, up to 500; docs additionally say it
  blocks agent page visits;
- `boost_domains`: fixed relative ranking boost, up to 500; no inclusion
  guarantee; may combine with exclude, not include;
- `country`: one of 36 enumerated country codes, described as geographic focus;
- `freshness`: day/week/month/year or `YYYY-MM-DDtoYYYY-MM-DD`.

**UNKNOWN:** subdomain matching, URL-path handling, redirects into/out of blocked
domains, canonical aliases, embedded resources, internal-tool compliance, and
whether include domains constrain only search results or every possible tool.
The include description says results only, whereas exclude explicitly addresses
browsing; do not infer symmetric visit behavior without confirmation.

### 7.2 Freshness semantics

**FACT (high):** if task/query language contains a temporal keyword and
`freshness` is supplied, the broader—less restrictive—timeframe wins [S2]. Thus
an explicit Research freshness field is not always a hard upper bound.

No public field distinguishes publisher date, modified date, first-seen time,
index time, cache time, fetch time, or answer validity time. Sources return no
date. Although Research can choose Live News and advertises current-web
research, a response does not prove whether a particular source was newly
fetched, read from cached extraction, or selected from indexed content [S1-S2].

**UNKNOWN:** date-range inclusivity, timezone, missing/ambiguous date handling,
future dates, stale fallback, recrawl cadence, source-specific freshness, and
whether every retrieved artifact obeyed the resolved timeframe.

**RECOMMENDATION (high):** reject temporal broadening of explicit constraints.
Curiosity should keep hard caller ranges separate from query-derived intent and
record claimed publication, modification, first-seen, index-observed, fetched,
and validity times with provenance. “Live” fetch and fresh discovery are
different facts.

## 8. Errors, rate limits, pricing, and cost safety

### 8.1 Errors

The shared documentation lists 400, 401, 402, 403, 404, 422, 429, and 500,
with bodies varying among `detail` and `error` forms [S8]. Research-specific
typed SDK errors cover 401, 403, 422, and 500; task get/stream add 404. The SDK
also distinguishes response-schema failures and transport failures [S11-S12].

Material cases include invalid schema/parameter combinations (`422`), missing
or expired key (`401`), insufficient path scope (`403`), absent task (`404`),
quota (`429`), and server/auth middleware (`500`). The general page describes
`402` for insufficient credits but the official SDK table marks no typed 402 for
Research [S8, S11]. Research's exact insufficient-credit envelope should be
contract-tested before normalization.

The SDK does not retry by default. Optional retries target 429, 500, 502, 503,
and 504 [S11]. **RECOMMENDATION:** do not automatically retry Research POST
unless admission/idempotency is known. Retry GET/stream open only within a
caller deadline and preserve attempt/event lineage.

### 8.2 Rate limits

Every response is documented to include `X-RateLimit-Limit`, `Remaining`, and
`Reset`; 429 may carry `Retry-After` [S8]. Public numeric Research quotas and
concurrency/in-flight limits are not published. Enterprise custom QPS is a
commercial option [S7].

### 8.3 Pricing and billing risk

The five fixed tier prices are shown in Section 4. No per-request Research
response field reports dollars, credits, searches, pages, or tokens consumed.
The separate balance API returns a shared organization or individual balance
in cents, allowing post-/inter-request reconciliation but not a transactional
per-task charge record [S7, S14].

**FACT (high):** You.com's current auto top-up has no monthly spending cap,
frequency limit, or per-charge maximum. It can immediately charge when enabled
below threshold, and organizational members share a credit pool [S7, S14].

**UNKNOWN:** when Research charges are reserved or posted, whether failed or
cancelled tasks are billed, whether ambiguous duplicate submissions are billed,
and whether warnings/partial results change price.

**RECOMMENDATION (high):** local admission must compute worst-case tier cost,
reserve it atomically against a Curiosity budget, cap concurrent submissions,
and reconcile balance afterward. Disable or independently cap automatic funding
for experimental agents. Provider balance and auto top-up are not spending
safety controls.

## 9. Privacy, safety, and legal boundary

### 9.1 Privacy and retention

**FACT (high):** Research is explicitly excluded from current ZDR support.
Enterprise ZDR covers only Web Search and Answer; Contents and Research are on
the roadmap [S6]. Therefore a Search call's ZDR status cannot be inherited by a
later Research call.

The general Terms allow You.com to use prompts and outputs to provide, maintain,
train, improve, and develop services/products. They prohibit submitting
specified restricted sensitive data [S9]. The general Privacy Policy says it
collects account, device, usage, and telemetry information, uses service
providers including AWS and multiple LLM providers, and retains information as
reasonably necessary; enterprise agreements can supersede it [S10]. These are
broad service statements, not a Research-specific data-flow map.

**UNKNOWN:** standard Research prompt/output/source retention period, background
task/result/event retention, deletion API/SLA, backup deletion, training opt-out,
regional processing, exact model/tool subprocessors, support access, log fields,
and treatment of URLs/source content. Task persistence needed for polling and
replay makes an undocumented retention interval operationally material.

**RECOMMENDATION (high):** do not send repository secrets, credentials, private
URLs, proprietary source, tenant identifiers, restricted/sensitive personal
data, or unneeded thread context. Any trial needs the applicable MSA/DPA,
Research-specific retention/training/subprocessor answers, region terms, and
deletion behavior in writing.

### 9.2 Retrieved-content and generated-output safety

Research exposes no SafeSearch or moderation field, tool allowlist, malicious-
URL verdict, prompt-injection signal, source trust tier, PII/secret redaction,
or safety reason code. Domain allowlisting constrains origin but does not make a
page trustworthy. Search, page content, snippets, internal-tool output, and the
generated report are all untrusted data.

You.com's Terms warn that outputs may be false, misleading, incomplete,
incorrect, stale, or offensive; users must independently verify and apply human
review as appropriate, especially for consequential decisions [S9]. This
directly limits the guide's “trust and verify” wording: citation syntax is not
truth or safety assurance.

**RECOMMENDATION (high):** retrieved text must never change tool authority,
budgets, system policy, or allowed follow-up scope. Strip active content; bound
all strings, arrays, objects, and output bytes; verify URLs before following;
separate evidence from instructions; independently verify consequential claims;
and preserve source-access warnings and unknowns.

### 9.3 Clean-room and license boundary

This dossier uses public behavior and contracts only. The official Python SDK
3.1.1 and its research helpers are MIT-licensed [S11-S12], but that license does
not disclose or license the hosted planner, models, index, ranking, source
evaluation, context compaction, or stopping implementation. No SDK code is
copied here. Any future code reuse would require its license notice; no server
compatibility should be implied without authorized tests.

The Terms' reverse-engineering and competing-service restrictions make invasive
probing inappropriate [S9]. Curiosity may independently design general patterns
from public contracts, but must not reconstruct prompts, models, algorithms, or
private interfaces.

## 10. Architecture inference (bounded and non-proprietary)

```text
input + effort + source controls + optional schema
  -> auth / validation / credit and quota admission
  -> effort-derived server compute envelope
  -> task interpretation / planning
  -> iterative logical branch loop
       -> choose Search | Contents | Live News | other internal tool
       -> retrieve candidates / read selected pages
       -> evaluate relevance + freshness + diversity
       -> compact/mask accumulated context
       -> assess whether enough information remains
  -> synthesize Markdown or schema-constrained object
  -> render inline source references + selected source snippets
  -> warnings / partial-result projection
  -> synchronous response
       OR durable task state + event log/SSE + final result store
```

Evidence: named tools, iteration, evaluation, compaction, and budget planning
[S1, S3]; request/output schemas [S2]; task/SSE contracts [S4-S5].

**INFERENCE (medium-high):** a generation/orchestration plane sits over
You.com's retrieval/extraction services, with a separate task/event/result
store for background work. Synthesis and source-manifest construction occur
after iterative evidence selection. Exact deployment, databases, queues,
models, context technology, rankers, branch scheduler, and stop algorithm are
unknown and intentionally not inferred.

## 11. Curiosity decisions and exact implications

The accepted local baseline keeps `web_search` provider-neutral,
researcher-only, result-bounded, and explicitly treats returned text as
untrusted; Curiosity is one bounded, in-frame, authority-neutral pass
(`docs/decisions/0020-provider-neutral-web-search.md`) [LOCAL1].

### Adopted

1. **ADOPT — separate generated research from retrieval.** A Research result is
   `generated_research`, never the neutral `web_search` response.
2. **ADOPT — explicit warnings.** Successful output can still be partial or
   degraded. Use typed warning records tied to affected branches/sources.
3. **ADOPT — nullable unknowns in structured output.** Schemas should permit
   `null` rather than force fabricated or empty values.
4. **ADOPT — durable task identity and timestamps.** Long-running work needs a
   stable handle, status, created/updated/completed times, and final retrieval.
5. **ADOPT — replayable event delivery concept.** Resume from a durable,
   monotonic event cursor rather than restarting work after disconnect.
6. **ADOPT — hard source-policy types.** Allow, deny, and prefer are distinct;
   deny must constrain both returned results and visits.
7. **ADOPT — local tool scoping.** Research cannot itself increase authority;
   caller/harness policy decides whether managed research is available.

### Adapted, not copied

1. **ADAPT effort tiers into explicit budgets.** Keep `quick/balanced/deep` UX
   profiles, but compile them to hard searches/fetches/tokens/cost/deadline.
2. **ADAPT schemas.** Preflight complexity, validate output locally, and require
   evidence/unknown/confidence fields for material conclusions.
3. **ADAPT async lifecycle.** Add idempotency, cancel/delete, expiry, partial
   results, stable diagnostics, commit identity, and precise SSE resume rules.
4. **ADAPT source manifests.** Track discovered/read/considered/cited/rejected/
   failed phases and immutable capture/passage identifiers.
5. **ADAPT source evaluation.** Freshness, diversity, and relevance become
   inspectable factors with provenance, not hidden planner claims.
6. **ADAPT context compaction.** Every summary must retain source/capture IDs,
   loss warnings, contradiction state, and compactor version.
7. **ADAPT iterative search.** Follow-up requires a declared in-frame gap,
   scored value, remaining shared budget, and caller authority.
8. **ADAPT fixed tier costs.** Provider price may be an admission estimate, but
   Curiosity reserves and enforces its own maximum.

### Rejected

1. **REJECT — expose Research as `web_search`.** It changes retrieval into
   generated synthesis and destroys ABI, latency, evidence, and cost semantics.
2. **REJECT — hosted Research as Curiosity's control plane.** Hidden planning
   and stopping cannot satisfy bounded curiosity or authority neutrality.
3. **REJECT — “until enough” as a stop contract.** Return explicit coverage,
   marginal gain, budget, unresolved contradictions, and stop reason.
4. **REJECT — citation equals verification.** URL/snippet references lack
   capture identity and machine-readable support edges.
5. **REJECT — effort tier as sufficient budget.** It does not contractually
   bound searches, pages, tokens, elapsed time, or total concurrent spend.
6. **REJECT — freshness broadening.** An explicit caller time constraint must
   remain hard.
7. **REJECT — provider task timeout as cancellation.** Client wait expiry and
   server task disposition are distinct.
8. **REJECT — provider auto top-up as cost safety.** It has no current spending
   cap and can amplify autonomous spend.

### Deferred

1. **DEFER — optional generated-research adapter.** Requires separate authority,
   Terms/MSA/DPA review, Research privacy answers, and synthetic/public eval.
2. **DEFER — quality, citation, freshness, latency, and cost benchmark.** No
   calls or credentials were authorized and vendor examples are insufficient.
3. **DEFER — MCP or SDK choice.** Transport convenience must follow—not define—
   provider-neutral contracts and authority.
4. **DEFER — frontier use.** Four-hour-scale server work and $1.20/call require
   explicit organizational budget, cancellation, retention, and observability.

### Proposed neutral research envelope

```text
ResearchRequest
  frame_id, objective, constraints, evidence_policy, output_contract
  authority { allowed_tools, allowed_sources, max_followups }
  budget { branches, searches, fetches, context_tokens, output_bytes,
           cost, deadline, concurrency }

ResearchBranch
  branch_id, parent_branch_id, intent, queries[], expected_evidence
  budget_reserved/used, state, discovered/read/used/failed evidence IDs
  marginal_gain, contradictions[], stop_reason

EvidenceCapture
  capture_id, document_id, passage_id, fetched/terminal/canonical URL
  fetched_at, claimed_published_at, content_hash, extractor_version
  offsets/hash, source_role, trust=untrusted_external_evidence

ResearchResult
  generated content/object, generator/policy versions
  claim/evidence edges, warnings[], failed branches[], unknowns[]
  coverage, contradictions, budget used/remaining, stop_reason
  trust=untrusted_generated_inference

ResearchTask
  id, idempotency_key, state, timestamps, expiry, terminal_commit_id
  cancellable, deletable, partial_result, next_event_cursor
```

## 12. Fact / inference / recommendation ledger

| ID | Type | Claim | Confidence | Origin / check | Verdict |
| --- | --- | --- | --- | --- | --- |
| L1 | FACT | Research is generated multi-search/read/synthesis, not raw search. | High | [S1-S3] | **ADOPT boundary** |
| L2 | FACT | Five effort tiers select opaque provider compute budgets and fixed prices. | High | [S1-S2, S7] | **ADAPT profiles** |
| L3 | FACT | Research names Search, Contents, Live News, and internal tools as retrieval primitives. | High | [S1] | Architecture dependency only |
| L4 | INFERENCE | One task logically decomposes/expands the objective, but branch topology and parallelism are unknown. | Medium | Multiple searches/sub-questions; no trace [S1-S3] | **Require visible branches** |
| L5 | FACT | No caller-visible internal work budget or stop reason exists. | High | Exhaustive request/response/task comparison [S2, S4-S5] | Hidden control plane **REJECTED** |
| L6 | FACT | Structured output uses a bounded schema subset and does not receive automatic citation fields. | High | [S1-S2] | **ADAPT** |
| L7 | FACT | Sources are URL/title/snippets only and lack immutable capture/claim edges. | High | [S2, S4] | Evidence shape **REJECTED**; manifest **ADAPTED** |
| L8 | FACT | Warnings can signal access issues/partial results but are untyped strings. | High | [S2, S4] | **ADAPT typed warnings** |
| L9 | FACT | Background tasks have durable status and replayable SSE, but no cancel endpoint is indexed. | High | [S4-S5, S10] | Lifecycle **ADAPTED** |
| L10 | FACT | Task warning placement and stream event vocabulary have documentation/SDK discrepancies. | Medium-high | [S4-S5, S12] | Defensive drift checks |
| L11 | FACT | Explicit freshness may be broadened by temporal language. | High | [S2] | Behavior **REJECTED** |
| L12 | FACT | Research has no current ZDR coverage. | High | [S6] | Sensitive use **REJECTED** |
| L13 | FACT | Auto top-up has no current spending cap; Research output has no per-call usage. | High | [S2, S7, S14] | Local admission required |
| L14 | INFERENCE | Separate orchestration and durable task planes sit over retrieval/extraction services. | Medium-high | Hosts/contracts/tools/lifecycle [S1-S5, S11] | **ADAPT plane separation** |
| L15 | RECOMMENDATION | Keep one explicit bounded curiosity pass with local authority and stopping. | High | L1-L14; local ADR [LOCAL1] | **ADOPTED** |
| L16 | RECOMMENDATION | Any provider trial must be public/synthetic, fixed-budget, contract-reviewed, and independently verified. | High | Privacy/legal/contract gaps | **DEFERRED** |

## 13. Unknowns, checks, and negative results

### Blocking unknowns

1. Internal query/branch/tool/page counts, topology, parallelism, recursion,
   deduplication, merge policy, and effort-specific stopping criteria.
2. Whether all answer evidence appears in `sources[]`, and which pages were
   considered, rejected, inaccessible, or compressed away.
3. Citation-to-claim entailment, exact passages/captures, verifier behavior, and
   structured-field grounding.
4. Per-source fetch/cache/index provenance, dates, stale fallback, and actual
   compliance with resolved freshness.
5. Background task cancellation mechanism, idempotency, duplicate billing,
   queue/concurrency limits, expiry, retention, deletion, and webhook support.
6. SSE ID/sequence semantics, replay inclusivity, retention/gap behavior,
   undocumented event payload stability, and commit ordering.
7. Exact Research insufficient-credit and 429 envelopes; charging rules for
   failed/cancelled/warned/duplicate/timed-out tasks.
8. Response/source/snippet/output byte limits and truncation behavior.
9. Research-specific standard retention, training, subprocessors, regions,
   backups, logs, support access, and deletion SLA.
10. Prompt-injection, malware, unsafe-content, PII/secret, redirect, and source-
    rights controls applied to pages and internal tools.
11. Actual latency/error/citation/freshness/quality distributions; no empirical
    request was authorized.

### Reproducibility and contract checks before any revisit

- Diff the current endpoint references and OpenAPI-derived index; pin access
  date and adapter fixture version [S2, S4-S5, S10].
- Ask You.com to resolve task `warnings` placement and publish stable warning
  codes.
- Obtain written cancellation, idempotency, retention/expiry, charging, and SSE
  replay semantics before background production use.
- Require a Research-specific privacy/data-flow questionnaire and executed
  agreement; do not infer Research ZDR from Search/Answer.
- If separately authorized, use public synthetic tasks with fixed tier/call/
  dollar/deadline bounds; never use auto top-up as the bound.
- Compare every inline marker or structured field with retained source text;
  record unsupported, contradicted, drifting, and inaccessible citations.
- Test freshness using owned public pages with controlled publication/fetch
  times, not hostile targets or private infrastructure.
- Test ambiguous POST timeout and reconnect behavior only after written
  idempotency/billing clarification.

### Checks performed

- Cross-checked Research guide against generated POST, task-status, and task-
  stream references [S1-S5].
- Cross-checked prices and latency against Billing; retained the `lite` latency
  discrepancy [S1, S3, S7].
- Cross-checked task/SSE guide behavior against official Python SDK 3.1.1 and
  commit-pinned helper source [S11-S12].
- Cross-checked errors and rate-limit behavior separately from endpoint guides
  [S8, S11].
- Cross-checked privacy marketing against the endpoint-specific ZDR page,
  general Privacy Policy, and Terms [S6, S9-S10].
- Checked the API-reference index for a cancellation operation; none was listed
  [S10].
- Did not represent documentation examples as live observations.

### Negative results retained

- No public stable plan, generated-query list, branch DAG, or tool-call trace was
  found in the Research result contract.
- No hard caller-set search/page/token/deadline/cost budget or stop reason was
  found.
- No cancellation, idempotency, webhook, task deletion, or expiry endpoint was
  found in the public Research index.
- No capture-level provenance, source fetch timestamp, content hash, passage
  offset, claim edge, or complete considered-source ledger was found.
- No Research-specific citation verifier guarantee was found.
- No Research ZDR, standard retention duration, or training exclusion was found.
- No Research SafeSearch, prompt-injection, malware, or per-source safety verdict
  was found.
- No independent quality, benchmark, latency, freshness, citation, or cost result
  was produced; vendor claims were not adopted as comparative evidence.
- Fetching the incorporated AUP directly returned a PDF that the available text
  fetcher could not parse; no conclusion in this dossier depends on unreviewed
  AUP text.

## 14. Bounded curiosity pass and stop decision

Scores are 1 (low/cheap) to 5 (high/expensive). Only threads inside the declared
You.com Research API frame were considered.

| Thread | Relevance | Value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Reconcile async task/SSE contract with official helper | 5 | 5 | 4 | 2 | **Pursued:** found replay support, commit race handling, evolving event vocabulary, warning-placement discrepancy, and no cancel endpoint [S4-S5, S10-S12]. |
| Reconcile price, latency, and spend controls | 5 | 5 | 4 | 1 | **Pursued:** prices agree; `lite` latency conflicts; output lacks usage; auto top-up lacks spending caps [S1, S3, S7, S14]. |
| Determine Research-specific ZDR and retention | 5 | 5 | 4 | 1 | **Pursued:** ZDR explicitly excludes Research; standard retention remains unknown [S6, S9-S10]. |
| Determine whether query fan-out is inspectable | 5 | 5 | 3 | 1 | **Pursued to saturation:** multiple iterative searches are documented, but no stable plan/query/branch trace is returned [S1-S5]. |
| Infer private planner prompts, model IDs, rankers, or context store | 1 | 2 | 4 | 5 | `CURIOSITY_NO_GO`: prohibited/unnecessary and no decision value beyond the public contract. |
| Run paid/free calls to count branches or test citation quality | 4 | 5 | 3 | 5 | `CURIOSITY_NO_GO`: caller prohibited calls/credentials; requires approved corpus, budget, and legal review. |
| Inspect consumer traffic or undocumented endpoints | 1 | 1 | 3 | 5 | `CURIOSITY_NO_GO`: outside API-only clean-room and access boundaries. |
| Benchmark against Tavily/Exa/Parallel | 2 | 3 | 2 | 5 | `CURIOSITY_NO_GO`: outside the You.com-only frame. |
| Obtain non-public MSA/DPA/Trust Center evidence | 4 | 5 | 3 | 4 | **DEFERRED:** requires organizational identity, legal purpose, and caller authority. |
| Parse every AUP/legal clause | 3 | 3 | 2 | 4 | `CURIOSITY_NO_GO`: AUP PDF unavailable to text fetcher; Terms and endpoint privacy facts suffice for this architecture decision. |

**Coverage:** every requested category has facts, uncertainty boundaries, and
Curiosity implications.

**Saturation:** additional official examples repeated the same contract or
showed caller-side composition rather than new server guarantees.

**Stop:** coverage and public-source saturation reached. Remaining high-value
gaps require vendor answers, executed legal terms, or separately authorized
empirical requests. No live autonomous follow-up is authorized.

## 15. Sources

All sources accessed 2026-08-17. Sources are You.com first-party documentation,
legal pages, or official published artifacts. They establish represented public
behavior, not private implementation or comparative quality.

1. **[S1] You.com, Research API Overview.**
   https://you.com/docs/guides/research.md — planning/tool/compaction claims,
   effort tiers, source controls, structured output, lifecycle, and guidance.
2. **[S2] You.com, `POST /v1/research` API reference.**
   https://you.com/docs/api-reference/research/v1-research.md — request,
   validation, response, background handle, and examples.
3. **[S3] You.com, Research Agent example.**
   https://you.com/docs/examples/research.md — iterative “enough information”
   loop, effort examples, and Search/Research boundary.
4. **[S4] You.com, Research Task Status API reference.**
   https://you.com/docs/api-reference/research/v1-research-task.md — states,
   timestamps, original input, result/error schema, and warning discrepancy.
5. **[S5] You.com, Research Task Stream API reference.**
   https://you.com/docs/api-reference/research/v1-research-task-stream.md — SSE,
   ping, terminal events, `from_id`, and example event shape.
6. **[S6] You.com, Zero Data Retention.**
   https://you.com/docs/administration/zero-data-retention.md — enterprise,
   account-level ZDR scope and explicit Research exclusion.
7. **[S7] You.com, Billing.**
   https://you.com/docs/administration/billing.md — Research prices/latencies,
   account credits, auto top-up, shared balance, and absent spending caps.
8. **[S8] You.com, Errors and Rate Limits.**
   https://you.com/docs/using-the-api/error-code-reference.md and
   https://you.com/docs/using-the-api/rate-limits.md — status classes, body
   examples, headers, 429, and retry guidance.
9. **[S9] You.com, Terms & Conditions.**
   https://you.com/legal/terms — reverse-engineering/access restrictions,
   prompt/output use, restricted data, output verification, and service drift.
10. **[S10] You.com, Privacy Policy (page dated 2024-12-10) and API index.**
    https://you.com/privacy and https://you.com/docs/api-reference/llms.txt —
    general collection/vendors/retention and current public endpoint inventory.
11. **[S11] You.com, official Python SDK 3.1.1 documentation/metadata.**
    https://pypi.org/project/youdotcom/ and
    https://you.com/docs/sdks/python-sdk.md — errors, retries, timeouts, host,
    helper behavior, package version, and MIT SDK boundary.
12. **[S12] You.com official Python SDK research helpers, commit
    `8e4ced63802db764aca515a56016f0de80dbe2c3`.**
    https://github.com/youdotcom-oss/youdotcom-python-sdk/blob/8e4ced63802db764aca515a56016f0de80dbe2c3/src/youdotcom/research_helpers.py
    — polling defaults, terminal/race handling, tolerant events, and reconnect
    mechanics; public MIT-licensed client code, not hosted internals.
13. **[S13] You.com, Biomedical Research Brief example.**
    https://you.com/docs/examples/biomedical-research.md — caller-side parallel
    Research composition, used only to distinguish it from server branching.
14. **[S14] You.com, Account Balance API reference.**
    https://you.com/docs/api-reference/billing/get-account-balance.md — shared
    billing-entity balance and cents semantics.
15. **[LOCAL1] Curiosity ADR 0020, provider-neutral bounded web search.**
    `docs/decisions/0020-provider-neutral-web-search.md` — local accepted
    authority, trust, boundedness, and ABI baseline; repository source, not a
    You.com claim.
