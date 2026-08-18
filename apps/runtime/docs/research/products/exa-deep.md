# Exa Deep / deep-search reverse-engineering dossier

**Decision frame:** Which externally observable Exa Deep design patterns should
Curiosity adopt, adapt, reject, or defer for a bounded, provider-neutral research
retrieval pipeline?

**Snapshot:** Official and first-party public sources accessed 2026-08-17. No
credentials, paid calls, traffic interception, private interfaces, or access-control
bypass were used. This is clean-room behavioral and contract analysis, not a claim
about Exa's private implementation.

**Scope boundary:** “Exa Deep” here means the synchronous deep-search variants on
`POST /search`: `deep-lite`, `deep`, and `deep-reasoning`. Standard Exa Search
(`instant`, `fast`, `auto`) and Contents are analyzed only as dependencies. Exa
Agent (`POST /agent/runs`), the retired asynchronous `/research` endpoint, Answer,
Websets, and announced-but-not-generally-documented Deep Max are different products
and are not treated as Deep behavior [S1][S2][S4].

## Executive verdict

Exa Deep is best understood as a **server-owned, synchronous orchestration mode
behind the normal Search endpoint**, not as a separate task API. A caller supplies
one natural-language query, may add up to several explicit query variants, can steer
planning and synthesis with a system prompt, and can request a shallow structured
output schema. Exa then performs query expansion, parallel search branches, LLM
reasoning, ranking, synthesis, and field-level grounding while returning ordinary
search results as inspectable evidence [S1][S2][S3].

For Curiosity, the strongest transferable ideas are: (1) separate the objective from
branch queries, (2) parallelize independent angles, (3) preserve result evidence
beside synthesis, (4) ground individual output fields rather than only whole answers,
and (5) make latency/cost/quality an explicit mode. The most important design gap is
equally instructive: Deep exposes no internal work budget, plan, branch trace,
stopping reason, coverage measure, or citation-entailment proof. Curiosity should
adapt the useful patterns while owning these controls and observability itself.

**Overall confidence: high** for the public request/response, price, latency, and
freshness contracts; **medium** for branch and content-flow architecture; **low** for
internal stopping, model choice, evidence weighting, and failure recovery.

## Bounded questions and answers

| Question | Finding | Status / confidence |
| --- | --- | --- |
| What is the task contract? | One synchronous `/search` request with `query` required and a deep `type`; optional branch hints, filters, content options, system steering, output schema, and SSE. | Fact / high [S2][S3] |
| How does it plan and branch? | Exa says it expands queries, creates multiple search agents in parallel, reasons, ranks, synthesizes, and iterates until it has what it needs. Caller-supplied `additionalQueries` can replace automatic expansion. | Fact at product level; mechanism opaque / medium-high [S1][S3][S9] |
| What does it depend on? | Exa says Deep uses Exa Instant, its own index, LLM reasoning, and retrieved page context. Public contract can return text, highlights, summaries, and subpages with each result. | Fact plus inference / medium-high [S1][S2][S7] |
| What are its budgets and stop rules? | Only output/result/content/latency bounds are public. No branch count, tool-call cap, token budget, cost cap, deadline, coverage target, or stop reason is accepted or returned. | Negative result / high [S2][S3][S4] |
| How is evidence represented? | Ranked results remain visible; synthesized output has field paths, URL/title citations, and `low`/`medium`/`high` confidence. | Fact / high [S1][S2] |
| How fresh and attributable is it? | Publication-date filtering and cache-age controls exist; Exa says its index updates hourly. `/search` does not expose per-result cache/live source or retrieval time in its current documented response. | Fact and negative result / high [S2][S7][S12] |
| What is the safety posture? | Result moderation is opt-in and defaults false. Deep is ineligible for HIPAA mode; standard query data may be used to improve/train Exa systems, while ZDR is enterprise-only. | Fact / high [S2][S10][S11] |
| Is it a replacement for Search or Contents? | No. It is a high-compute Search mode that orchestrates retrieval and synthesis; Contents remains the URL-to-content primitive. | Inference strongly supported / high [S1][S2][S4] |

## 1. Product identity and evolution

### Current surface

- **Fact:** `deep-lite`, `deep`, and `deep-reasoning` are values of `type` on the
  same `POST https://api.exa.ai/search` endpoint as ordinary search. `deep-lite` is
  described as lightweight synthesis, `deep` as comprehensive multi-step research,
  and `deep-reasoning` as stronger reasoning for difficult analysis [S2][S3].
- **Fact:** Exa introduced the first Deep search type in November 2025 as parallel
  query expansion, smart ranking, and detailed per-result summaries. The March 2026
  revamp added `deep-reasoning`, structured outputs, field-level grounding, and lower
  pricing [S4].
- **Fact:** In April 2026, Exa retired `/research` and directed users to `/search`
  with `type: "deep-reasoning"` [S4]. This makes Deep the synchronous successor to a
  former research-task surface, but not equivalent to the newer asynchronous Agent
  API launched in June 2026.
- **Unknown:** Exa's current documentation does not define a version identifier for
  the Deep planner or synthesis model, nor a reproducibility guarantee across calls.

### Explicit exclusions

- **Deep Max:** Exa announced it on 2026-04-20 as a forthcoming, highest-compute
  system using frontier LLMs and dozens of parallel Search calls. It was “releasing
  soon,” with contact-only usage/pricing. It is absent from the current public Search
  enum and pricing table, so its behavior is not attributed to current Deep [S5].
- **Exa Agent:** Agent is asynchronous, has run IDs, cancellation, events, effort and
  dollar budgets, usage counters, and optional external data providers. Deep has none
  of those public lifecycle controls [S3][S4][S6].
- **Search and Contents:** Standard Search retrieves/ranks pages; Contents extracts
  content for known URLs. Deep composes retrieval and reasoning but still exposes
  both result and content options [S2][S7].

## 2. Task and query contract

### Inputs

The documented wire contract is:

| Input | Deep meaning | Bounds / caveats |
| --- | --- | --- |
| `query` | Required objective in natural language. | Non-empty string [S3]. |
| `type` | Chooses `deep-lite`, `deep`, or `deep-reasoning`. | `auto` remains the global default, so Deep must be selected explicitly [S2]. |
| `additionalQueries` | Explicit search variations used alongside the main query; official Python SDK says they skip automatic LLM expansion. | OpenAPI says 1–10; Python SDK and first-party MCP say max 5. Treat 5 as portable until Exa reconciles the contracts [S3][S8][S9]. |
| `systemPrompt` | Guides synthesis for all types and search planning for Deep variants. | Public MCP wrapper caps it at 32,000 characters; core OpenAPI publishes no max [S3][S9]. |
| `outputSchema` | Requests text synthesis or structured object output. | Root `text` or `object`; object maximum depth 2 and 10 total properties [S2][S3]. |
| `numResults` | Number of returned evidence results. | 1–100 publicly; default 10. This is not documented as the number of pages inspected internally [S3]. |
| filters | Domain/path allow/deny lists, publication dates, location, category. | Company/people categories reject date and exclusion combinations; crawl-date filters are deprecated and ignored [S2][S4]. |
| `contents` | Returned text, highlights, summaries, subpages, links, and freshness policy. | Text/highlights max 10,000 characters per result; subpages max 100 but may be system-limited [S3]. |
| `moderation` | Filters unsafe result content. | Defaults false [S2][S3]. |
| `stream` | Streams synthesis and terminal metadata over SSE. | Used only when `outputSchema` is present according to OpenAPI [S3]. |

The contract intentionally separates **objective**, **behavior**, and **shape**:
`query` states the task, `systemPrompt` steers source/novelty/duplication behavior,
and `outputSchema` specifies output form [S2]. That separation is directly useful to
Curiosity.

### Outputs

- `results[]` preserves title, URL/ID, estimated publication date, author, and any
  requested content views [S2][S3].
- `output.content` is synthesized text or an object matching `outputSchema`;
  `output.grounding[]` maps a field path (for example,
  `companies[0].funding`) to citations and model-reported confidence [S1][S2].
- `requestId` supports provider troubleshooting; `costDollars.total` reports billed
  cost [S2][S13].
- SSE frames can carry text deltas, grounding, results, resets, a terminal `done`
  record with `searchTime` and cost, or an error, then `[DONE]` [S3].

**Contract ambiguity:** Marketing and the first-party MCP wrapper describe a
synthesized answer as normal Deep output, even without a schema, while the coding
reference repeatedly says `output` is returned when `outputSchema` is provided.
Curiosity must not assume unschematized `output` is stable; adapter tests should
classify it as optional [S1][S2][S9].

## 3. Planning, branching, and curiosity amplification

### Observable facts

1. Exa describes Deep as using optimized query expansion and LLM reasoning [S1].
2. It says the query is interpreted, then “multiple search agents” are generated in
   parallel and their results synthesized with citations [S1].
3. Exa's launch history says searches run in parallel across the main query and its
   variations, followed by smart ranking [S4].
4. The official Python SDK says caller-provided `additionalQueries` skip automatic
   LLM query expansion [S8].
5. The first-party MCP wrapper logs either explicit query variants or “automatic
   query expansion,” sends one `/search` call, and labels the tool non-idempotent
   [S9]. This reveals wrapper behavior, not server internals.
6. Exa's product thesis says complex search should decompose, search in parallel,
   and iterate “until it has what it needs” [S1]. No externally inspectable iteration
   record accompanies that claim.

### Clean-room architecture inference

**Inference (medium confidence):** A likely pipeline is:

```text
objective + constraints
  -> intent interpretation / query expansion
  -> parallel retrieval branches over Exa's search stack
  -> candidate union, deduplication, ranking
  -> selective content acquisition / context compression
  -> reasoning and schema-constrained synthesis
  -> field-level grounding + ranked evidence results
```

The exact number of branches, whether branches recurse, when full content is fetched,
how candidates are deduplicated, and whether `deep-reasoning` changes the planner,
the reasoning model, or both are unknown. Deep Max's published “highlights first,
full crawls for final answer” pattern is plausible context but cannot establish Deep's
implementation [S5].

### Curiosity-amplification patterns

| Pattern | Value | Risk | Curiosity disposition |
| --- | --- | --- | --- |
| Automatic query expansion | Recovers vocabulary and viewpoint gaps. | Semantic drift and silent scope expansion. | **ADAPT:** generate typed branches with rationale and parent objective. |
| Caller-supplied variants | Lets domain knowledge seed coverage. | Current Exa limits conflict; duplicates can waste work. | **ADOPT:** allow explicit branch seeds, dedupe before dispatch. |
| Parallel angle search | Cuts wall-clock latency and broadens recall. | Burst load, correlated sources, nondeterministic completion. | **ADOPT:** bounded concurrency and deterministic merge. |
| Planner steering for primary sources, novelty, and deduplication | Makes evidence policy task-specific [S2]. | Prompt-only policy is soft and can be overridden by bad evidence. | **ADAPT:** typed policy plus prompt guidance; enforce after retrieval. |
| Iteration until “enough” | Supports multi-hop discovery. | “Enough” is opaque and potentially unbounded. | **REJECT as opaque:** use explicit marginal-value and budget stops. |
| Result + synthesis dual return | Supports audit and downstream re-reasoning. | Returned results may not be the complete internal evidence set. | **ADOPT with provenance completeness flag.** |

## 4. Retrieval and content dependencies

- **Fact:** Exa says the revamped Deep uses Exa Instant search underneath [S1].
  Consequently Deep quality and coverage inherit Exa's proprietary index and ranking
  behavior; it is not a provider-neutral orchestration layer.
- **Fact:** Deep accepts the same category and domain/date filters as Search, subject
  to category restrictions [S2][S3]. Specialized Exa indexes therefore affect Deep's
  retrieval envelope.
- **Fact:** The caller can request full text, highlights, summaries, links, and
  subpages in returned results. Highlights are selected for query relevance and Exa
  recommends them for repeated agent calls because they use about 10x fewer tokens
  than full text [S2].
- **Inference (medium):** Contents functionality is operationally coupled to Deep
  even when the public caller does not separately invoke `/contents`, because
  citation synthesis requires page evidence and Exa explicitly describes Deep as
  combining retrieval with LLM reasoning. Whether the internal path calls the public
  Contents service is unknown.
- **Negative result:** No public Deep parameter chooses an external retrieval
  provider, uploads a corpus, requires a minimum source count, enforces domain
  diversity, or exposes the full candidate pool.

## 5. Budgets, latency, and stopping

### Public bounds

| Mode | Published latency | Price / 1,000 requests, up to 10 results |
| --- | ---: | ---: |
| `deep-lite` | ~4 s | $12 |
| `deep` | 4–15 s (launch post: 4–12 s) | $12 |
| `deep-reasoning` | 12–40 s (launch post: 12–50 s) | $15 |

Current docs supersede launch ranges for planning [S1][S2][S6]. `outputSchema` adds
about two seconds, and forced live crawls add latency [S2][S3]. Search defaults to 10
QPS; the docs do not publish a Deep-specific concurrency limit [S13].

### Billing bounds

- Base price includes up to 10 results. Each additional result costs $1 per 1,000
  results; generated page summaries cost $1 per 1,000 pages [S6].
- Deep is therefore predictable per request but not entirely flat when result count
  or summaries vary. The response's `costDollars.total` is the authoritative observed
  charge [S2][S6].
- Unlike Agent, Deep has no request-level dollar cap or effort budget [S6].

### Missing stop contract

No public field or response reports:

- maximum searches, branches, pages inspected, LLM tokens, or reasoning steps;
- deadline, branch timeout, or caller cancellation;
- coverage, contradiction, confidence, novelty, or saturation threshold;
- terminal reason such as `sufficient_evidence`, `budget_exhausted`, or `timeout`;
- partial-completion status or resumable task state.

**Inference (high confidence):** Fixed mode pricing and narrow latency bands imply
server-owned internal compute envelopes. Their values and stopping policy remain
opaque. `numResults` bounds returned items, not documented internal work. Closing an
SSE connection may stop delivery but is not documented as cancellation.

**Curiosity implication:** expose a first-class budget object (`max_branches`,
`max_fetches`, `max_tokens`, `max_cost`, `deadline_ms`) and a machine-readable stop
reason. Do not use “iterate until enough” as an operational contract.

## 6. Evidence aggregation and citations

### Strengths

- Field-level grounding is materially stronger than a single answer-level source
  list: each synthesized field receives source URLs/titles and a confidence label
  [S1][S2].
- Search results remain adjacent to synthesis, permitting inspection and alternative
  downstream reasoning [S2].
- Built-in grounding is separate from caller schema; Exa warns that asking the model
  to generate citation fields inside content is redundant and less reliable [S2].

### Limits and unknowns

- Confidence is explicitly “model-reported reliability,” not a calibrated
  probability [S3]. No calibration method or benchmark by confidence bucket is
  published.
- Citation records contain URL and title, not quoted spans, offsets, retrieval time,
  content hash, cache/live status, or entailment score [S2][S3].
- Multiple citations per field are possible, but the contract does not say whether
  they independently corroborate, merely mention, or conflict with the claim.
- The response does not identify which branch found a citation, what text supported
  it, or whether all internal sources are returned.
- `publishedDate` is estimated from parsed HTML and can be null; it is metadata, not
  evidence that the cited claim was true at retrieval time [S2][S8].

**Curiosity implication:** preserve a claim-evidence graph with claim IDs, exact
quoted spans, canonical URL, retrieval timestamp, content digest, branch lineage,
source role (primary/secondary), and explicit support/contradict relation. Confidence
must be derived from inspectable factors and calibrated separately from model belief.

## 7. Freshness and provenance

- Exa says its index updates hourly and continuously adds links [S12]. This is a
  provider statement, not an SLA or per-document freshness guarantee.
- `startPublishedDate` and `endPublishedDate` filter estimated publication dates.
  Deprecated crawl-date filters are accepted but ignored [S3][S4].
- `contents.maxAgeHours` controls cached content: `0` always live-crawls, `-1` is
  cache-only, positive values accept cache within that age, and omission uses cached
  content with live crawl as fallback [S7]. Live-crawl failure can fall back to cache.
- `/contents` exposes per-URL `statuses[].source` such as cached, but the documented
  `/search` result does not expose equivalent cache/live provenance [S2][S7].

**Inference (medium):** A fresh page body does not necessarily imply fresh discovery
or ranking; `maxAgeHours` governs content retrieval, while index discovery freshness
is a separate process. Curiosity should model discovery time, fetch time, publication
time, and validity time independently.

## 8. Errors, reliability, and streaming

- Standard failures include 400 validation/conflict, 401 authentication, 402 depleted
  credits/budget, 403 feature or safety policy, 429 rate limit, 500 internal error,
  and upstream 502/503 conditions [S13]. Conflicting `additionalQueries` with a
  non-Deep type is a documented 400 [S13].
- 429 responses may omit request ID and tag; other documented errors include both.
  Exa recommends exponential backoff [S13].
- The stream can issue a `stream-reset`, terminal error event, and final cost/time
  record [S3]. The semantics of reset, replay, ordering across branch results, and
  billing after client disconnect are not documented.
- The status page reported Search API operational and 100% uptime at access time, but
  displayed only a 90-day view and no Deep-specific component or historical SLO [S14].

**Curiosity implication:** normalize provider errors into retryable/non-retryable,
preserve request IDs, make retries idempotency-aware, and return partial evidence with
a completeness/error ledger. Deep's first-party MCP annotation says it is not
idempotent [S9], so automatic retries can produce different evidence and should have
attempt lineage.

## 9. Safety, privacy, and trust boundaries

- Search-result moderation is opt-in (`false` by default). Exa documents
  `CONTENT_FILTER_ERROR` when Search content is blocked by safety policy [S2][S13].
- Deep cannot use HIPAA compliance mode. HIPAA Search is restricted to `instant` or
  `fast`, cache-only text/highlights, with no summaries or live fetch [S10].
- Exa's privacy policy says open query fields are not intended for personal data,
  tells users not to submit it, and states Query Data is used to improve products,
  including model training and fine-tuning [S11]. Enterprise offers Zero Data
  Retention; it is not the default public contract [S6][S10][S11].
- Exa says it respects `noindex`; Contents may return robots/content-policy failures
  [S12][S13].
- **Negative result:** Public Deep docs do not specify prompt-injection defenses,
  source trust tiers, malicious-content isolation, citation URL safety, secret
  redaction, or planner instruction hierarchy.

**Curiosity implication:** all retrieved pages are untrusted data. Keep planner
instructions out of page-content channels; strip active content; apply URL/network
policy before fetch; moderate both query and evidence according to deployment policy;
never send secrets or unnecessary personal data; and make retention/provider
training posture explicit at the adapter boundary.

## 10. Fact / inference / recommendation ledger

| ID | Type | Claim | Confidence | Evidence | Verdict |
| --- | --- | --- | --- | --- | --- |
| L1 | Fact | Deep is a mode of synchronous `/search`, not a separate current endpoint. | High | [S2][S3][S4] | **ADOPT** the simple external call shape only. |
| L2 | Fact | Deep expands queries, parallelizes searches, reasons, ranks, and synthesizes. | Medium-high | [S1][S4] | **ADAPT** with visible branch plans. |
| L3 | Fact | Explicit additional queries can replace automatic expansion. | High | [S8][S9] | **ADOPT.** |
| L4 | Fact | `systemPrompt` affects Deep planning; schema controls output shape. | High | [S2][S3] | **ADAPT** into typed policy + schema. |
| L5 | Fact | Structured objects are limited to depth 2 and 10 properties. | High | [S2][S3][S8] | **REJECT** as Curiosity's internal limit; support richer internal claims and flatten only per adapter. |
| L6 | Fact | Grounding maps output fields to URL/title citations and coarse confidence. | High | [S1][S2] | **ADAPT** with quote-level provenance and calibrated confidence. |
| L7 | Fact | No public internal budget or stop reason exists. | High | exhaustive current contracts [S2][S3][S6] | **REJECT** opaque stopping. |
| L8 | Inference | Deep's fixed tiers hide provider-owned compute envelopes. | High | price/latency tiers and absent controls [S2][S6] | **ADAPT** into explicit Curiosity budgets. |
| L9 | Inference | Deep is tightly coupled to Exa Search/index and content extraction. | High | [S1][S2][S7] | **REJECT** as core architecture; isolate in adapter. |
| L10 | Fact | Freshness control applies to fetched contents and can fall back to cache. | High | [S7] | **ADAPT** with separate discovery/fetch timestamps. |
| L11 | Fact | Moderation defaults off; Deep is not HIPAA-compatible; ordinary Query Data may train Exa systems. | High | [S2][S10][S11] | **REJECT** as a safe default for sensitive workloads. |
| L12 | Inference | Returned `results` may be an evidence projection, not the complete internal candidate/evidence set. | Medium | result bound versus opaque internal search [S1][S2] | **ADAPT** with completeness metadata. |
| L13 | Recommendation | Keep synthesis and citations separate from caller-requested domain fields. | High | Exa guidance and grounding design [S2] | **ADOPT.** |
| L14 | Recommendation | Do not reproduce Exa's private orchestration; implement provider-neutral patterns from public behavior. | High | clean-room boundary | **ADOPT.** |
| L15 | Fact | `additionalQueries` limits conflict across first-party contracts (10 vs 5). | High | [S3][S8][S9] | **DEFER** provider maximum; adapter should cap at 5 and feature-detect. |
| L16 | Fact | Deep Max is announced but absent from current public enum/pricing. | High | [S3][S5][S6] | **DEFER** until generally documented. |

## 11. Exact Curiosity implications

1. **Provider-neutral request:** define `objective`, `constraints`, `branch_seeds`,
   `evidence_policy`, `output_contract`, `freshness_policy`, and `budget` separately.
   Map only supported subsets into Exa's query/system-prompt/schema fields.
2. **Visible planning:** emit a bounded branch plan with branch ID, rationale, parent,
   expected evidence type, and estimated cost before execution. Exa's hidden expansion
   is insufficient for audit-sensitive work.
3. **Bounded curiosity:** allow follow-up branches only when a scored gap or
   contradiction clears a threshold; charge every branch/fetch/token to one shared
   budget; stop on coverage, saturation, deadline, or exhaustion.
4. **Explicit terminal record:** return `stop_reason`, budget consumed/remaining,
   coverage summary, unresolved contradictions, failed branches, and whether evidence
   is complete or provider-projected.
5. **Evidence-first merge:** deduplicate by canonical URL and content digest, preserve
   branch lineage, and rank source diversity/authority independently from provider
   rank.
6. **Claim-level grounding:** bind each synthesized claim or field to exact source
   spans and immutable retrieval metadata. Keep model confidence distinct from
   evidence strength and source quality.
7. **Two-stage content policy:** start with bounded highlights/snippets; escalate to
   full content only for selected claims, ambiguity, or contradiction. This adapts
   Exa's token-efficiency principle without assuming its private flow.
8. **Freshness dimensions:** record publication, index-observation, fetch, and
   validity times separately. Never label a result “fresh” solely because a live
   crawl occurred.
9. **Untrusted-input boundary:** parse web evidence as data, never instructions;
   enforce network, moderation, privacy, and retention controls outside provider
   prompts.
10. **Adapter isolation:** an Exa Deep adapter may be useful as a high-quality fallback
    or benchmark oracle, but Curiosity's core planner, budgets, provenance, stopping,
    and safety contracts must not depend on Exa-specific modes.
11. **Error normalization:** preserve provider `requestId`, terminal stream record,
    cost, attempt number, partial results, and retry decision. Do not silently replay
    a non-idempotent Deep call.
12. **Evaluation:** separately measure retrieval recall, source diversity, claim
    support, citation correctness, contradiction handling, freshness, p50/p95 latency,
    and all-in cost. Vendor benchmark headline accuracy is not sufficient evidence for
    adoption.

## 12. Clean-room and license boundary

This dossier uses only published contracts, documentation, product posts, and
publicly readable first-party SDK/MCP source. The Exa MCP wrapper and JavaScript SDK
are MIT-licensed [S9][S15], but that license does not disclose or license Exa's
server-side planner, index, models, ranking, or crawling implementation. Curiosity may
adopt general architectural ideas and independently designed contracts; it should not
copy Exa branding, undisclosed behavior, service content, or imply compatibility
without conformance tests. Any reused MIT code would require preservation of its
copyright and license notice; no such code is included here.

## 13. Unknowns and required validation

| Unknown | Why it matters | Proposed non-production validation |
| --- | --- | --- |
| Exact auto-expansion and branch-count policy | Determines recall, cost, and drift. | Contract tests across atomic, comparative, and multi-hop prompts using free credits only if separately authorized. |
| Internal stop criteria and mode-specific compute | Determines boundedness and tail latency. | Observe distributions and output changes; do not infer hidden implementation from one run. |
| Whether all synthesis evidence appears in returned results | Determines audit completeness. | Compare grounding URLs with `results[]`; flag unmatched and ungrounded fields. |
| Citation entailment and confidence calibration | Determines whether grounding is trustworthy. | Human-labeled claim/span entailment and confidence reliability curves. |
| Cache/live provenance on `/search` | Determines temporal auditability. | Check actual responses and ask vendor; current docs do not promise it. |
| Behavior when live crawl fails inside Search | Determines stale fallback semantics. | Controlled public URLs with known cache age; no hostile targets. |
| SSE disconnect billing/cancellation and reset semantics | Determines safe client behavior. | Ask Exa support before load tests. |
| Deep-specific limits, timeout, and SLA | Determines production capacity. | Obtain written plan/SLA terms; public docs only state `/search` 10 QPS. |
| Prompt-injection and malicious-page mitigations | Determines safety posture. | Vendor questionnaire plus benign synthetic pages in an owned test domain, separately authorized. |
| Reproducibility and model/version drift | Determines benchmark validity. | Repeat canary suite with timestamps and response fingerprints. |

## 14. Bounded curiosity pass

Scoring scale: 1 (low) to 5 (high). Priority favors relevance, decision value, and
novelty while penalizing cost.

| Thread | Relevance | Value | Novelty | Cost | Action |
| --- | ---: | ---: | ---: | ---: | --- |
| Resolve current Deep versus retired Research versus Agent | 5 | 5 | 4 | 1 | **Pursued:** changelog and current OpenAPI resolved boundaries. |
| Verify hidden branch hints in official integration source | 5 | 4 | 4 | 2 | **Pursued:** first-party MCP source corroborated auto versus explicit expansion. |
| Reconcile `additionalQueries` maximum | 4 | 4 | 4 | 1 | **Pursued:** found 10 in OpenAPI, 5 in Python/MCP; retained contradiction. |
| Inspect Deep Max for Deep internals | 3 | 3 | 4 | 1 | **Bounded:** used only as separate contextual clue; no behavior transferred. |
| Reconstruct server code/model prompts | 2 | 2 | 5 | 5 | **CURIOSITY_NO_GO:** unavailable, proprietary, unnecessary, and outside clean-room boundary. |
| Make paid calls to measure branches | 4 | 4 | 3 | 4 | **CURIOSITY_NO_GO:** caller prohibited paid calls and credentials. |
| Probe rate limits, cancellation, or geoblocks | 2 | 3 | 2 | 5 | **CURIOSITY_NO_GO:** operational testing/bypass prohibited and not needed for contract analysis. |
| Analyze vendor benchmark raw sets and reproduce scores | 3 | 4 | 3 | 5 | **DEFERRED:** valuable for procurement, but beyond this product-contract frame and no-call budget. |
| Parse service Terms PDF for every legal clause | 2 | 3 | 2 | 3 | **CURIOSITY_NO_GO:** fetch tooling could not parse the PDF; no product claim here depends on it. |

**Stop condition:** Coverage reached across every caller-requested dimension; new
official sources saturated around the same Search/OpenAPI/changelog contract.
Remaining high-value gaps require vendor answers or authorized empirical calls, so the
pass stopped on coverage and access-budget exhaustion.

## Sources

All sources were accessed 2026-08-17. Exa documentation is mutable; the date is part
of every claim's provenance.

- **[S1]** Exa, “Introducing Exa Deep: An Agent for Every Search” (2026-03-04),
  <https://exa.ai/blog/exa-deep>.
- **[S2]** Exa, “Search API Reference” and best practices,
  <https://exa.ai/docs/reference/search-api-guide-for-coding-agents> and
  <https://exa.ai/docs/reference/search-best-practices>.
- **[S3]** Exa, public OpenAPI 3.1 Search contract v2.0.0,
  <https://exa.ai/docs/reference/search> and
  <https://exa.ai/docs/exa-spec.json>.
- **[S4]** Exa, product changelog (November 2025–July 2026),
  <https://exa.ai/docs/changelog>.
- **[S5]** Exa, “Introducing Deep Max: State-of-the-Art Agentic Search”
  (2026-04-20), <https://exa.ai/blog/deep-max>.
- **[S6]** Exa, pricing, <https://exa.ai/docs/reference/pricing>.
- **[S7]** Exa, “Content Freshness,”
  <https://exa.ai/docs/reference/livecrawling-contents>.
- **[S8]** Exa Labs, official Python SDK specification,
  <https://github.com/exa-labs/exa-py/blob/master/docs/python-sdk-specification.mdx>.
- **[S9]** Exa Labs, official MCP `deepSearch.ts`, repository snapshot commit
  `cc81fda07dea47c636a511cf632a46b564470615`,
  <https://github.com/exa-labs/exa-mcp-server/blob/cc81fda07dea47c636a511cf632a46b564470615/src/tools/deepSearch.ts>;
  MIT license, <https://github.com/exa-labs/exa-mcp-server/blob/master/LICENSE>.
- **[S10]** Exa, HIPAA and enterprise security,
  <https://exa.ai/docs/reference/security/hipaa> and
  <https://exa.ai/docs/reference/security>.
- **[S11]** Exa Labs, Privacy Policy, updated 2026-06-29,
  <https://exa.ai/privacy-policy>.
- **[S12]** Exa, FAQ and index coverage,
  <https://exa.ai/docs/reference/faqs> and
  <https://exa.ai/docs/reference/the-exa-index>.
- **[S13]** Exa, error codes and rate limits,
  <https://exa.ai/docs/reference/error-codes> and
  <https://exa.ai/docs/reference/rate-limits>.
- **[S14]** Exa public status page, <https://status.exa.ai>.
- **[S15]** Exa Labs, official JavaScript SDK README and MIT license, repository
  snapshot commit `9235e0271253cc1ec38f71f9fe55bf49894e47c1`,
  <https://github.com/exa-labs/exa-js/tree/9235e0271253cc1ec38f71f9fe55bf49894e47c1>.
