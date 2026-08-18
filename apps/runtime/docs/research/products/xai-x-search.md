# xAI X Search: clean-room product and architecture study

**Access date:** 2026-08-17  
**Subject:** xAI's server-side `x_search` tool for searching X posts, users, and
threads. General Web Search is excluded.  
**Decision:** Which observable X Search contract, control, provenance, and
architecture ideas should Curiosity adopt, adapt, reject, or defer?  
**Status:** Competitor research, not implementation, endorsement, benchmark, or
legal advice.

## Executive verdict

xAI X Search is not a raw X search API. It is a **model-orchestrated,
server-executed social retrieval capability** inside an xAI inference request.
The caller enables `x_search` and may constrain handles, inclusive calendar
dates, and image/video understanding. Grok chooses the concrete lexical,
semantic, user, or thread operations, can issue several operations over several
turns, consumes their undisclosed outputs, and returns a synthesized answer plus
URLs, optional inline citation annotations, attempted-call traces, successful
call counts, token usage, and exact billed cost [S1][S2][S3][S4].

This answer-centric contract gives useful operational telemetry but no ranked
post result set. It does not promise post text, author metadata, post timestamp,
engagement, rank, score, query-result edges, capture time, content hash, corpus
completeness, or stable historical replay. A citation can mean merely that a URL
was encountered by a successful tool execution, not that it supports a claim
[S2][S3].

**Overall verdict — REJECTED as Curiosity's retrieval foundation; ADAPTED as a
social-search adapter and contract reference (high confidence).** Adopt explicit
social evidence typing, calendar bounds, and attempted-versus-successful usage
ledgers. Adapt handle filters and citation offsets behind stricter neutral
contracts. Reject citations-as-proof, opaque results, provider-controlled cost,
and any inference that “realtime” means complete or unbiased. Defer an xAI
adapter until authorized paid conformance tests and legal review resolve the
material unknowns.

## 1. Frame, bounded questions, and method

### 1.1 Bounded questions

1. What is the current X Search tool contract, and who controls each decision?
2. What X corpus and access boundary is actually documented?
3. What temporal predicates, source metadata, citations, ranking evidence, and
   failure telemetry cross the provider boundary?
4. Where does the model end and retrieval begin?
5. What privacy, safety, content-rights, pricing, and operational constraints
   matter to Curiosity?
6. Which architecture lessons are supportable without inspecting proprietary
   implementation?

### 1.2 Clean-room method and limits

This study used public xAI, X Help, X privacy, X terms, and X developer-policy
pages only. No credentials, paid calls, account access, UI automation, traffic
interception, binaries, private prompts, private APIs, service source code, or
access-control bypass were used. No X content was collected or copied into an
index. General xAI Web Search was excluded except where a shared API envelope
must be distinguished from X Search.

Documentation establishes a public contract, not quality, completeness,
latency, legal permission for a downstream use, or hidden implementation.
Marketing phrases such as “real-time” and “vast data” are not benchmarks.

Labels used below:

- **FACT** — directly supported by a cited official source.
- **INFERENCE** — bounded deduction consistent with public facts, not a claim
  about undisclosed implementation.
- **RECOMMENDATION** — proposed Curiosity response.
- Confidence is **high**, **medium**, or **low**.

## 2. Product identity and lifecycle

- **FACT (high):** xAI launched an API feature called Live Search in May 2025,
  made dedicated server-side `web_search`, `x_search`, and `code_execution`
  tools generally available in October 2025, and reduced successful agent-tool
  call prices to no more than $5/1,000 in November 2025 [S5].
- **FACT (high):** Current examples use `POST /v1/responses`, model
  `grok-4.6`, and a tool object containing `{"type":"x_search"}`. The xAI
  Python SDK calls it `x_search`; Vercel exposes `xai.tools.xSearch()` [S1].
- **FACT (high):** Grok 4.6 explicitly supports X Search. Its context is 500,000
  tokens and its training-knowledge cutoff is 2026-02-01; xAI says realtime
  events require a search tool [S6].
- **FACT (high):** X's consumer Grok surface can also decide whether to search
  public X posts, but it has different personalization and data-use behavior
  and is not the developer `x_search` contract [S10].

**INFERENCE (high):** The dedicated tool is the current developer abstraction;
the older global `search_parameters` fields still present in the inference REST
reference are compatibility residue or a parallel legacy path. Their continued
presence does not prove identical behavior [S5][S7].

**RECOMMENDATION (high):** Key compatibility by endpoint, model identifier,
SDK/wire surface, and dedicated-tool schema. Do not infer API behavior from the
consumer Grok UI or old “Live Search” branding.

## 3. Tool contract and locus of control

### 3.1 Dedicated request surface

| Field/control | Documented behavior | Owner of decision | Boundary or concern |
| --- | --- | --- | --- |
| `model` | Current examples use `grok-4.6` [S1][S6]. | Caller | Model upgrades can alter planning and synthesis independently of tool schema. |
| `input` | Natural-language task and conversation context [S1]. | Caller | The caller does not supply a structured X query AST. |
| `tools: [{type: "x_search"}]` | Makes X Search available [S1][S2]. | Caller permits; model invokes | Permission is not proof of execution. |
| `allowed_x_handles` | Consider posts only from listed handles; maximum 20 [S1]. | Caller policy | Exact handle normalization, renamed users, invalid handles, and whether user-search itself is restricted are undocumented. |
| `excluded_x_handles` | Prevent inclusion of posts from listed handles; maximum 20 [S1]. | Caller policy | Cannot coexist with allowlist. |
| `from_date`, `to_date` | Inclusive ISO-8601 `YYYY-MM-DD` range [S1]. | Caller policy | Calendar-day timezone and historical completeness are unspecified. |
| `enable_image_understanding` | Lets the agent analyze images in encountered X posts [S1]. | Caller permits; model selects | Adds untrusted multimodal input and image-token cost. |
| `enable_video_understanding` | Lets the agent analyze videos in X posts; X-only capability [S1]. | Caller permits; model selects | Video-view work is token-priced; media retention and exact sampled frames/transcript are not exposed. |
| `parallel_tool_calls` | Allows multiple tool calls in one model turn [S3][S7]. | Caller permits; model fans out | One turn is not one call or one billable unit. |
| `max_turns` | Bounds assistant/server-tool turns in one request; unset uses an undisclosed global cap [S3][S7]. | Caller bound | It is not an individual-call cap. |
| `tool_choice` | Generic Responses schema exposes tool choice [S7]. | Caller/model | The reviewed dedicated X guide does not specify exact force/none behavior for `x_search`. |
| inline-citation include flags | Responses defaults inline citations on; xAI Python SDK defaults them off [S2]. | Caller/surface default | Output differs by client surface. |
| `store`, `previous_response_id` | Can retain and resume complete agentic state [S4][S7]. | Caller | Persistence is broader than answer text. |
| encrypted state | Can return encrypted reasoning and server tool outputs for client-carried continuation [S4][S13]. | Caller | Continuity does not make evidence inspectable. |

`allowed_x_handles` and `excluded_x_handles` are mutually exclusive. The guide
says the allowlist makes X Search “consider X posts only” from those handles and
the denylist prevents the model “including X posts” from excluded handles [S1].
It does not define treatment of quoted/reposted content, replies by another
author, mentions, collaboration posts, or thread ancestors outside the list.

### 3.2 Decisions retained by xAI and Grok

- **FACT (high):** Built-in tools execute automatically on xAI servers. The
  model analyzes the task, decides whether and what to call, processes results,
  and continues until it judges information sufficient or reaches a limit [S4].
- **FACT (high):** Visible precise X operations include `x_user_search`,
  `x_keyword_search`, `x_semantic_search`, and `x_thread_fetch`; media can add
  `view_image` and `view_x_video` [S3].
- **FACT (high):** The server-side results consumed by the model are not
  returned to the API client [S3].
- **INFERENCE (high):** Query formulation, operation choice, candidate
  selection, follow-up searches, stopping, evidence consumption, and prose
  synthesis are model-coupled. The caller controls permissions and coarse
  filters, not a deterministic retrieval plan.

### 3.3 Legacy contract contradiction

The REST reference still exposes global `search_parameters` on Chat Completions
and Responses: `mode` (`off`, `on`, `auto`), `sources`, `from_date`, `to_date`,
`max_search_results`, and `return_citations`. It says an omitted `sources` list
defaults to Web and X [S7]. The dedicated X Search guide instead uses an
explicit tool and X-specific filters [S1].

**UNKNOWN (material):** Source-object schema; whether `max_search_results`
limits candidates, evidence admitted to model context, or citations; precedence
if dedicated tools and `search_parameters` coexist; and whether legacy date
bounds have the same inclusive semantics.

**RECOMMENDATION (high):** Use exactly one control family in any future adapter.
Do not silently merge legacy and dedicated controls.

## 4. X corpus and access boundaries

### 4.1 Positively documented reach

- **FACT (high):** xAI describes X Search as keyword search, semantic search,
  user search, and thread fetch over X, including optional analysis of images
  and videos in posts [S1][S3].
- **FACT (high):** X says consumer Grok has realtime access to **public X
  posts**, and protected posts are not surfaced in response to user queries
  [S10].
- **FACT (high):** X describes “public X data” more broadly as public posts,
  post metadata such as engagement and reposts, public Spaces, and public
  profiles [S10]. X's privacy policy likewise says profile information and much
  X content are public and may be exposed through APIs and embeds [S11].

The last point describes X's public-data universe, **not** a promise that
developer `x_search` can retrieve every field or content class. The X Search
guide names posts, users, threads, images, and videos; it does not promise
Spaces, Lists, Communities, bookmarks, Direct Messages, full engagement
metadata, or every public profile field.

### 4.2 Negative and unknown boundary findings

The reviewed primary contract does **not** promise:

- private/protected posts, Direct Messages, bookmarks, or account-private data;
- exhaustive firehose access or a defined percentage of public X;
- historical depth, archive start date, deleted-post access, edit history, or a
  tombstone for removed/protected content;
- language, country, geolocation, engagement, verification, content-type,
  reply/repost/quote, or sensitivity filters;
- an exact result count, pagination, cursor, stable snapshot, or repeatable
  candidate set;
- visibility-policy explanations, moderation labels, author block relationship,
  or jurisdictional withholding metadata;
- a freshness SLA or maximum indexing delay.

**INFERENCE (medium):** The first-party X relationship plausibly permits richer
social structure than generic public-web crawling, but it does not establish
complete recall, neutral sampling, or any specific physical index.

**RECOMMENDATION (high):** Model X as a mutable, policy-filtered social corpus,
not “the public conversation.” Report “X sources encountered,” never “all X
posts” or representative sentiment without a separately validated sampling
design.

## 5. Temporal search

- **FACT (high):** `from_date` and `to_date` accept ISO-8601 calendar dates in
  `YYYY-MM-DD`; both endpoints are included. The xAI Python SDK also accepts
  `datetime.datetime` values [S1].
- **FACT (high):** No time-of-day, timezone, sort order, recency weighting, or
  snapshot/as-of parameter appears in the dedicated contract [S1].
- **UNKNOWN:** Whether the predicate applies to original-post creation time,
  repost/quote time, edit time, thread activity time, or another indexed time;
  which timezone defines a day; one-sided-bound behavior; treatment of malformed
  or reversed ranges; and historical recall.
- **INFERENCE (high):** The contract exposes a day-granularity inclusion filter,
  not event-time semantics or reproducible historical search.

**RECOMMENDATION (high):** Curiosity should retain separately: user temporal
intent, provider predicate, source-authored timestamp, provider retrieval time,
and local observation time. A mapping to X Search must declare day granularity,
inclusive bounds, and unknown timezone; it must not claim exact instant-level
filtering.

## 6. Results, post metadata, and citations

### 6.1 What crosses the API boundary

| Artifact | Exposed? | Meaning |
| --- | --- | --- |
| Final synthesized text | Yes | Grok's answer, not a raw result set [S1][S4]. |
| All-citations URL list | Yes, by default | URLs encountered across successful tool executions; may include sources unused in the final answer [S2]. |
| Inline Markdown citation | Surface-dependent | `[[N]](url)` generated where the model chooses to cite; not guaranteed on every answer [S2]. |
| Structured citation annotation | Yes | `url`, `start_index`, exclusive `end_index`, and label/title on output text [S2]. |
| Source class | Partial | xAI Python SDK distinguishes `x_citation` from `web_citation`; generic Responses annotations use `url_citation` [S2]. |
| Attempted operation trace | Yes | Function/action and arguments, including failed attempts [S3][S4]. |
| Successful X-call count | Yes | `SERVER_SIDE_TOOL_X_SEARCH` or `x_search_calls`; billable successful executions [S3][S7]. |
| Source count | Aggregate only | `num_sources_used`, without source-to-call edges [S7]. |

Official citation examples include X status and user URLs such as
`https://x.com/i/status/<id>` and `https://x.com/i/user/<id>` [S2]. This shows
that source identity may be conveyed through URLs and stable-looking numeric
identifiers. It does **not** document canonicalization guarantees or prove that
all citations use `/i/` forms.

### 6.2 What is withheld or not promised

No documented field provides:

- raw post text, author display name/handle/user ID, post ID as a distinct
  typed field, original post timestamp, edit timestamp, language, media keys,
  engagement counts, conversation ID, reply/quote/repost relationships, or
  moderation labels;
- query-to-post, call-to-post, post-to-thread, or claim-to-excerpt edges;
- rank position, relevance score, ranking reason, candidate count, deduplication
  reason, or excluded-result reason;
- an exact excerpt shown to Grok, content hash, capture timestamp, index version,
  or immutable snapshot;
- a guarantee that every inline citation entails the adjacent claim.

The generic all-citations description calls the URLs a “complete list of all
sources encountered,” but scopes collection to **successful** tool executions
[S2]. A failed fetch can therefore appear in attempted calls without yielding a
citation. “Complete” is trajectory-local, not corpus-complete.

### 6.3 Provenance assessment

- **INFERENCE (high):** All citations are **encounter provenance**; inline
  annotations are model-produced **claim-link hints**. Neither is evidence
  payload provenance.
- **INFERENCE (high):** URL-only provenance cannot replay mutable, edited,
  deleted, protected, withheld, or redirected posts.
- **RECOMMENDATION (high):** Keep separate ledgers for attempted operations,
  successful operations, encountered URLs, locally revalidated post identities,
  and claim-linked citations. Never label all-citations URLs “supporting
  evidence.”
- **RECOMMENDATION (high):** Treat Markdown, URLs, handles, post text, media, and
  alt text as untrusted. Normalize and policy-check URLs before rendering.

## 7. Ranking, selection, and reproducibility

- **FACT (high):** The exposed operation family distinguishes user, keyword,
  semantic, and thread retrieval [S3].
- **FACT (high):** The model decides its operation arguments and can revise its
  trajectory after results or failures [S3][S4].
- **FACT (high):** The REST response can include a `system_fingerprint`, but
  xAI defines it as a signal of system-configuration change, not an X corpus or
  ranking version [S7].
- **UNKNOWN:** Candidate generation, ranking objectives, engagement or freshness
  features, personalization, moderation/filtering stage, deduplication,
  diversity logic, cache policy, semantic embedding model, index topology, and
  model-specific reranking.

**INFERENCE (medium):** There may be at least operation-specific candidate
retrievers feeding an agent evidence context. Nothing public proves whether
they share one index, call production X search services, use caches, or rerank
with Grok.

**INFERENCE (high):** Repeating the same prompt is not a reproducibility method:
the live corpus changes, planner sampling can change, model aliases can move,
the backend can change, and no result snapshot or ranking version is returned.

**RECOMMENDATION (high):** If Curiosity needs auditable search, it must own the
result envelope, captured evidence, retrieval timestamp, ranking trace, and
snapshot/version identifiers. xAI's final answer may be retained as derived
analysis, not as the source-of-truth result list.

## 8. Model/retrieval boundary and architecture inference

```text
caller task + X policy constraints + local budget
                    |
                    v
              Grok planner/model
          chooses operations and arguments
                    |
        +-----------+------------+
        |           |            |
        v           v            v
  user/keyword   semantic      thread fetch
     search       search       (+ media view)
        \           |            /
         +------ hidden X results ------+
                    |
            model consumes evidence
                    |
                    v
 final prose + optional inline links + all URLs
 + attempted trace + successful usage + exact cost
```

The following are clean-room deductions, not claims about proprietary code:

1. **Planner/executor loop — INFERENCE (high).** Repeated model decisions,
   managed execution, hidden outputs, and turn limits imply a server-side agent
   loop [S3][S4].
2. **Typed social retrieval plane — INFERENCE (high).** X-specific operations,
   handle filters, date bounds, threads, and video inspection imply a dedicated
   adapter rather than X URLs incidentally discovered by Web Search [S1][S3].
3. **Multiple retrieval intents — INFERENCE (high).** Lexical, semantic, user,
   and thread function names expose distinct logical primitives, though not
   distinct physical services [S3].
4. **Evidence accumulator — INFERENCE (high).** A final URL set spanning all
   successful operations, including unused sources, implies trajectory-level
   source collection before or alongside synthesis [S2].
5. **Opaque evidence boundary — INFERENCE (high).** Results are available to
   Grok and can be returned as encrypted continuation state but not inspected by
   the client [S3][S4].
6. **Billing after executor success — INFERENCE (medium).** Attempt/success
   separation and successful-call pricing imply the billable event occurs only
   after an executor returns a meaningful response [S3][S9].
7. **Model and retrieval are operationally distinct but product-coupled —
   INFERENCE (high).** Separate tool types, action traces, and prices establish
   an execution boundary; model-controlled query planning, context admission,
   stopping, and synthesis prevent independent retrieval use [S3][S4][S9].

## 9. Limits, pricing, errors, and bounded behavior

### 9.1 Price and usage facts

- **FACT (high):** X Search costs **$5 per 1,000 successful calls** ($0.005
  each), in addition to model-token charges [S9].
- **FACT (high):** Image and X-video inspection has no separate invocation fee,
  but processed media incurs image-token charges [S9].
- **FACT (high):** Agent prompt usage is cumulative across internal inference
  steps; reasoning, growing history, and media can add token cost [S3].
- **FACT (high):** `cost_in_usd_ticks` reports exact billed request cost,
  inclusive of tokens and server-side tool invocations; 10^10 ticks equal USD
  1. The field is per request, including the whole agent loop [S8].
- **FACT (high):** `server_side_tool_usage` and
  `server_side_tool_usage_details.x_search_calls` report successful X Search
  calls; attempted calls are available separately [S3][S7].
- **FACT (high):** xAI's public rate limits are per model in requests/second and
  tokens/minute, tiered by cumulative spend. Exceeding them returns HTTP 429;
  no separate public X Search quota is documented [S12].
- **FACT (high):** Model and tool availability can vary by geography and account
  limitations [S9].

For the current example model, Grok 4.6 is $2/M input, $0.50/M cached input, and
$6/M output below 200,000 prompt tokens; at or above that threshold the rates
double for all tokens in the request [S6][S9]. These model prices are a dated
snapshot, not a stable adapter assumption.

### 9.2 Error visibility

- **FACT (high):** Attempted calls can fail because of malformed arguments,
  deleted X posts, network/service failures, or other unsuccessful execution;
  failed attempts are absent from successful/billable usage [S3].
- **FACT (high):** The agent may update its trajectory and try alternatives
  after a failure [S3].
- **FACT (high):** The Responses envelope has response status, `error`, and
  `incomplete_details` fields, but the reviewed reference does not provide an
  X-Search-specific error-code taxonomy [S7].
- **UNKNOWN:** Empty-result representation, filter-validation status/code,
  partial-success semantics, deadline/timeout codes, retryability signals,
  date-range errors, media failures, and whether a final answer explicitly
  discloses retrieval failure.

### 9.3 Boundedness gaps

The contract does not disclose maximum X results per dedicated operation,
maximum threads/posts/media inspected, hard successful-call ceiling, latency
SLA, operation timeout, global default turn cap, or maximum evidence bytes.
`max_turns` is not a hard call cap because one turn may issue parallel calls;
mixed client-side tool continuations can reset `max_turns` in each new request
[S3][S4].

**RECOMMENDATION (high):** Curiosity must own wall-clock deadline, cancellation,
total and per-tool call caps, no-parallel option where needed, maximum sources
and bytes, media policy, token/spend ceiling, retry budget, and a terminal
partial-result state. Provider usage is retrospective accounting, not a
prospective safety boundary.

## 10. Privacy, safety, and legal boundaries

### 10.1 xAI API data handling

- **FACT (high):** xAI says it does not train on API inputs or outputs without
  explicit permission. By default, requests and responses are encrypted at rest,
  retained for 30 days for abuse/misuse auditing, and then deleted [S13].
- **FACT (high):** Team-level Zero Data Retention (where available) prevents
  prompt/output persistence but disables stateful Responses and other stored
  features. Every response exposes `x-zero-data-retention: true|false` [S13].
- **FACT (high):** Encrypted client-carried state is the documented way to
  continue an agentic tool conversation under ZDR without persisting server-side
  history [S4][S13].
- **FACT (high):** The request may provide a stable end-user `user` identifier
  for abuse detection and the Responses object can expose `safety_identifier`
  [S7].

**UNKNOWN:** Whether search queries, post URLs, hidden post payloads, and media
viewed by server tools are all classified identically as request/response data
under every contractual configuration; search-specific subprocessors and data
residency; and retention of aggregate abuse, billing, or operational metadata.

### 10.2 X users and public-content privacy

- **FACT (high):** X says public data can include posts, post metadata,
  engagement/reposts, public Spaces, and public profiles. Users can make posts
  private; protected posts are not surfaced in response to Grok user queries
  [S10].
- **FACT (high):** X warns that public content may remain in search engines or
  third-party copies after removal [S11].
- **FACT (high):** X's public developer rules, for direct X API/X Content use,
  emphasize privacy expectations, removal/update obligations, limits on
  redistribution, off-X matching, sensitive-trait inference, surveillance, and
  display integrity [S14][S15][S16].

The direct-X Developer Agreement governs X API licensed material, while this
study concerns xAI's separate API. The public sources reviewed do **not** establish
that every direct-X API clause is incorporated into the xAI API agreement.
Conversely, paying xAI for search does not by itself prove a downstream license
to archive, redistribute, train on, or publicly display user posts. X's display
requirements explicitly note that X does not grant permission for third-party
user content in all contexts [S15].

**RECOMMENDATION (high):** Before production, counsel must review the then-current
xAI enterprise terms/DPA and determine how X content rights, deletion, display,
attribution, redistribution, sensitive inference, surveillance, and model-
training restrictions apply to xAI Search outputs. Store identifiers/URLs rather
than hydrated content unless the approved use and retention policy require more;
support revalidation and erasure.

### 10.3 Safety and evidence quality

- **FACT (high):** X's terms disclaim completeness, truthfulness, accuracy, and
  reliability of user content and warn of offensive, harmful, inaccurate,
  mislabeled, or deceptive material [S16].
- **FACT (high):** X warns consumer Grok can confidently be wrong, missummarize,
  or miss context [S10].
- **UNKNOWN:** xAI's public X Search guide does not specify prompt-injection
  isolation, malicious-link/media scanning, source-quality ranking, coordinated
  manipulation detection, sensitive-content filtering, or claim-verification
  policy.

**RECOMMENDATION (high):** Treat posts, profiles, threads, media, alt text,
links, and citation Markdown as adversarial external data. Preserve authorship
and source type, isolate them from privileged instructions, do not allow them to
authorize tools, and require corroboration for consequential claims. “What
people are saying” is neither a representative sample nor ground truth.

## 11. Curiosity implications and decision ledger

| Verdict | Lesson | Rationale / required adaptation |
| --- | --- | --- |
| **ADOPTED** | Separate `social` from `web` evidence. | X has distinct identity, temporal, mutability, privacy, and authority semantics. |
| **ADOPTED** | Separate attempted, successful, and billable operations. | xAI's contract proves these sets differ; needed for audit and cost reconciliation. |
| **ADOPTED** | Preserve structured inclusive day bounds and effective provider mapping. | Better than burying temporal intent in prose, while retaining timezone uncertainty. |
| **ADOPTED** | Distinguish encountered sources from claim-linked citations. | All-citations intentionally includes unused sources. |
| **ADAPTED** | Handle allow/deny filters behind neutral actor policy. | Validate mutual exclusion/cap; report unsupported actor semantics and lossy mapping. |
| **ADAPTED** | Typed lexical, semantic, actor, and thread retrieval intents. | Useful planner vocabulary; Curiosity should expose inspectable result envelopes. |
| **ADAPTED** | Inline URL offsets as claim-link hints. | Verify offsets and rendering; placement does not establish entailment. |
| **ADAPTED** | Provider exact-cost telemetry. | Retain exact billed usage, but enforce local prospective limits first. |
| **ADAPTED** | Media understanding as an explicit capability. | Off by default; add content, privacy, token, and safety budgets. |
| **REJECTED** | Synthesized answer as the neutral search-result type. | It hides posts, ranking, excerpts, and query-result provenance. |
| **REJECTED** | Citations as proof or reproducible evidence. | URLs are mutable and encountered sources may be unused. |
| **REJECTED** | “Realtime” as a recall, freshness, or representativeness guarantee. | No SLA, corpus denominator, sampling design, or stable snapshot. |
| **REJECTED** | Provider `max_turns` as Curiosity's hard budget. | Parallel operations and continuation resets can exceed intuitive bounds. |
| **REJECTED** | Retaining hydrated X content by default. | Mutable user content and unresolved downstream rights require minimization. |
| **DEFERRED** | Production xAI X Search adapter. | Needs paid conformance tests, legal review, safety tests, operational limits, and an ADR. |
| **DEFERRED** | Mapping global `search_parameters`. | Relationship to the current dedicated tool is unresolved. |

## 12. Unknowns and required checks

| Unknown / contradiction | Confidence | Required authorized check |
| --- | --- | --- |
| Dedicated `x_search` vs legacy `search_parameters` precedence | Material unknown | Inspect current generated schema; ask xAI; run conflict cases or prohibit combination. |
| Exact X tool request/output JSON by SDK | Medium contract confidence | Capture sanctioned X-only Responses and xAI-SDK fixtures, including streaming. |
| Tool forcing | Unknown | Test `auto`, `none`, required/forced X tool, and unsupported forms. |
| Hard call ceiling | High-risk unknown | Test `max_turns=1` with parallel on/off; ask whether request-side `max_tool_calls` exists despite appearing in response schema. |
| Date timezone and predicate field | Unknown | Boundary posts around UTC/local midnight, one-sided and reversed ranges, repost/quote/thread cases. |
| Handle semantics | Unknown | Case/`@` normalization, renamed/deleted handles, quoted/reposted authors, thread expansion outside allowlist. |
| Corpus coverage and deleted/protected behavior | Unknown | Contract clarification; privacy-safe tests only on controlled public test accounts. |
| Citation identity and offsets | Medium | Duplicate URLs, `/i/status` vs canonical handle URL, redirects, Unicode, disabled inline mode, uncited claims. |
| Empty/partial/error shapes | Unknown | Invalid dates/handles, no results, deleted posts, media unavailable, transient failure, cancellation. |
| Cost bound | Unknown prospectively | Reconcile attempts, successful X calls, media token use, source count, and ticks under bounded cases. |
| ZDR scope for hidden X payloads | Unknown | Obtain contractual confirmation and verify response header in intended enterprise environment. |
| Downstream X content rights | Legal unknown | Counsel review of signed xAI terms/DPA and applicable X/content-owner obligations. |
| Ranking/freshness/version | Known undisclosed | Ask support; do not infer from `system_fingerprint`; retain as non-reproducible if unavailable. |

No paid or authenticated check was executed in this study.

## 13. Bounded curiosity pass

Scoring is 1–5 for **relevance (R)**, **decision value (V)**, **novelty (N)**,
and **cost (C)**, where higher cost is worse. Threads were pursued only when
`R + V + N - C` was high and work stayed inside the declared public-source,
no-credential frame.

| Thread | R | V | N | C | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Exact attempted/successful operation semantics | 5 | 5 | 4 | 1 | **Pursued:** tool-usage and REST references resolved the core telemetry distinction. |
| Public/protected X boundary | 5 | 5 | 3 | 1 | **Pursued:** triangulated X Search guide, X Grok Help, privacy policy, and direct-X policies; API-specific completeness remains unknown. |
| Citation/post metadata envelope | 5 | 5 | 4 | 1 | **Pursued:** citations guide proved URL/offset exposure and raw-post metadata absence. |
| Legacy/dedicated control contradiction | 5 | 5 | 4 | 2 | **Pursued:** contradiction retained rather than guessed away. |
| Downstream content rights | 5 | 5 | 4 | 2 | **Pursued:** adjacent X primary terms establish risk, but signed xAI terms still require counsel. |
| Hidden ranking/index topology | 4 | 3 | 5 | 5 | **CURIOSITY_NO_GO:** undisclosed and speculative; interface evidence supports only logical primitives. |
| Paid behavior and quality benchmark | 5 | 5 | 5 | 5 | **CURIOSITY_NO_GO:** caller prohibited paid calls and credentials; checks are deferred. |
| Scraping or consumer-UI comparison | 2 | 2 | 3 | 5 | **CURIOSITY_NO_GO:** excluded product surface and incompatible with clean-room/access boundaries. |
| Protected/deleted post live probes | 4 | 4 | 3 | 5 | **CURIOSITY_NO_GO:** requires authenticated testing and controlled consent; privacy/access risk. |
| Reverse engineer SDK/service code | 2 | 2 | 3 | 5 | **CURIOSITY_NO_GO:** unnecessary and outside the public-contract method. |

**Stop condition:** Coverage was achieved for every requested dimension. Further
official pages repeated the same contract, while remaining material questions
require a paid sanctioned request, provider clarification, or legal review.

## Primary and official sources

All sources accessed **2026-08-17**.

1. **[S1]** xAI Docs, [X Search](https://docs.x.ai/developers/tools/x-search).
   Dedicated contract, handles, dates, media, examples.
2. **[S2]** xAI Docs,
   [Citations](https://docs.x.ai/developers/tools/citations). All-source list,
   inline Markdown, annotations, X citation type and sample URLs.
3. **[S3]** xAI Docs, [Tool Usage
   Details](https://docs.x.ai/developers/tools/tool-usage-details). Attempted
   versus successful calls, X function names, hidden outputs, token accounting,
   and `max_turns`.
4. **[S4]** xAI Docs, [Tools Overview](https://docs.x.ai/developers/tools/overview)
   and [Advanced Tool
   Usage](https://docs.x.ai/developers/tools/advanced-usage). Server-side loop,
   state, encrypted continuation, tool combinations, and continuation bounds.
5. **[S5]** xAI Docs,
   [Release Notes](https://docs.x.ai/developers/release-notes). Live Search and
   dedicated-tool release history and 2025 price change.
6. **[S6]** xAI Docs, [Models](https://docs.x.ai/developers/models) and
   [Grok 4.6](https://docs.x.ai/developers/grok-4-6). Current model capability,
   context, cutoff, and token rates.
7. **[S7]** xAI Docs, [Inference API: Chat and
   Responses](https://docs.x.ai/developers/rest-api-reference/inference/chat).
   Shared envelope, legacy controls, response/usage fields, error/status,
   persistence, fingerprint, and generic limits.
8. **[S8]** xAI Docs, [Cost
   Tracking](https://docs.x.ai/developers/cost-tracking). Exact per-request
   ticks and agent-loop accounting.
9. **[S9]** xAI Docs, [Pricing](https://docs.x.ai/developers/pricing). X Search,
   media, model, availability, and policy-violation pricing.
10. **[S10]** X Help Center, [About
    Grok](https://help.x.com/en/using-x/about-grok). Public-post boundary,
    public-data classes, consumer privacy controls, and accuracy warning.
11. **[S11]** X, [Privacy Policy](https://x.com/privacy), effective 2026-01-15.
    Public/searchable data, APIs, retention, deletion, and third-party copies.
12. **[S12]** xAI Docs, [Rate
    Limits](https://docs.x.ai/developers/rate-limits). RPS/TPM tiers and HTTP
    429 behavior.
13. **[S13]** xAI Docs, [Security
    FAQ](https://docs.x.ai/developers/faq/security). Training default, 30-day
    retention, ZDR, response header, and disabled stateful features.
14. **[S14]** X Developer Docs, [Developer
    Policy](https://docs.x.com/developer-terms/policy) and [Restricted
    Uses](https://docs.x.com/developer-terms/restricted-use-cases). Direct-X API
    privacy, redistribution, content compliance, surveillance, and sensitive
    inference rules; treated as adjacent, not proven incorporated xAI terms.
15. **[S15]** X Developer Docs, [Display Requirements:
    Posts](https://docs.x.com/developer-terms/display-requirements). Attribution,
    current-content display, modification, and third-party permission warning.
16. **[S16]** X, [Terms of Service](https://x.com/tos), effective 2026-04-10,
    and X Developer Docs, [Developer
    Agreement](https://docs.x.com/developer-terms/agreement), updated
    2026-04-27. Public-interface/access, user-content, risk, and direct-X
    licensed-material boundaries; applicability to xAI outputs is not assumed.

## Source confidence and negative-result ledger

- **High confidence:** Dedicated request fields, mutual exclusion and caps,
  inclusive dates, operation names, hidden outputs, citation semantics, pricing,
  usage telemetry, default API retention, and ZDR are explicit in first-party
  documentation.
- **Medium confidence:** Logical planner/executor, evidence accumulator, and
  operation-specific retrieval architecture are interface-grounded inferences.
- **Low/unknown:** Corpus coverage, ranking, result payload shape behind the
  model boundary, temporal timezone, deleted/edited behavior, error taxonomy,
  signed-contract rights, and runtime quality.
- **Negative result:** No X-Search-specific ranking, recall, freshness, result
  count, pagination, raw-post, or error-code contract was found in the bounded
  primary-source review.
- **Negative result:** Direct fetches of xAI's current public enterprise terms
  and acceptable-use page returned HTTP 403 in this environment. No legal claim
  is based on an inaccessible snippet; production review must retrieve the
  canonical signed terms.
- **Negative result:** Public web-search queries were rate-limited during the
  curiosity pass. Direct known primary URLs were sufficient for contract
  coverage; no claim depends on search-result snippets.
