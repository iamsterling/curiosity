# xAI Web Search: clean-room contract and architecture study

**Access date:** 2026-08-17  
**Subject:** xAI's server-side `web_search` tool only. X Search is deliberately
excluded except where a shared or legacy field creates a boundary risk.  
**Decision frame:** Which observable xAI Web Search contract and architecture
ideas should Curiosity adopt, adapt, reject, or defer while preserving an owned,
provider-neutral, bounded retrieval system?  
**Status:** Competitor research; not an implementation, benchmark, endorsement,
or legal opinion.  
**Overall confidence:** **High** for the published tool, citation, usage,
retention, rate-limit, and price contracts; **medium** for cross-surface contract
consistency; **low/unknown** for index ownership, ranking, freshness, page
acquisition, safety filtering, and untested runtime behavior.

## Executive verdict

xAI Web Search is an **agentic grounded-answer tool**, not a conventional search
API. A caller enables and constrains a server-side tool; Grok chooses queries,
may search and browse repeatedly, consumes results behind an opaque model/tool
boundary, and returns a synthesized answer plus URL citations, attempted-call
metadata, successful-call usage, token usage, and exact billed cost. The API does
not return the underlying search/browse outputs, ranked hits, snippets, passages,
scores, publication/fetch timestamps, or query-to-source edges [S1][S2][S4].

Its best precedents are explicit domain policy, separate attempted-versus-
successful call telemetry, a discover/browse/open/find action vocabulary, all-
encountered sources separate from inline citations, and exact cost reporting.
Curiosity should **adapt** these into a stronger evidence and budget ledger. It
should **reject** answer-first opacity, URL-only provenance, model-owned stopping,
and `max_turns` as a sufficient call cap. A production xAI adapter is **deferred**
until authorized paid conformance tests resolve schema drift, tool forcing,
date/filter precedence, call accounting, source metadata, and error behavior.

## 1. Bounded questions, method, and labels

### 1.1 Questions

1. What is the current dedicated Web Search contract across Responses and the
   official xAI Python SDK?
2. Which controls are caller-enforced, model-decided, or undocumented?
3. Which query, action, source, citation, usage, and cost metadata cross the
   service boundary?
4. Where is the boundary between model planning, web retrieval, hidden evidence,
   and synthesis?
5. What freshness, limits, failures, privacy, and safety claims are actually
   supported?
6. What minimum architecture is consistent with the public evidence, without
   claiming proprietary internals?
7. Which lessons should Curiosity adopt, adapt, reject, or defer?

### 1.2 Clean-room boundary

- Evidence is limited to public xAI/SpaceXAI documentation and xAI's public,
  Apache-2.0-licensed official Python SDK source. Public SDK code is used only to
  corroborate interoperability fields and error behavior [S12][S13].
- No account, API key, paid request, consumer UI automation, hidden endpoint,
  traffic interception, decompilation, access-control bypass, or production
  mutation was used. No xAI result content was collected or copied into an index.
- X Search behavior, X corpus access, and X-specific controls are out of scope.
  Shared controls are mentioned only when they can accidentally widen a web-only
  request.
- Documentation is mutable. Facts are a 2026-08-17 snapshot, not a stability
  guarantee.

### 1.3 Labels

- **FACT** — directly supported by cited official evidence.
- **INFERENCE** — bounded explanation consistent with the facts, not a disclosed
  implementation detail.
- **RECOMMENDATION** — proposed Curiosity choice.
- Confidence is **high**, **medium**, or **low**.

## 2. Product status and execution model

### Facts

- **[FACT, high]** xAI announced API “Live Search” in May 2025, then made the
  dedicated `web_search` agent tool generally available in October 2025. In
  November 2025 it adapted agent tools to Grok 4.1 Fast and reduced successful
  tool-call prices to no more than $5/1,000. Image Search was added to Web Search
  in May 2026 [S10].
- **[FACT, high]** Current examples use `POST /v1/responses`, model `grok-4.6`,
  and `tools: [{"type":"web_search"}]`. xAI's current model page lists Web
  Search as supported by Grok 4.6 [S1][S11].
- **[FACT, high]** Web Search is a built-in tool managed and executed on xAI's
  servers. The published loop is: model analyzes input, decides whether to call a
  tool or answer, xAI executes a built-in call, model processes results, and the
  loop continues until a final response [S2].
- **[FACT, high]** Grok 4.6's knowledge cutoff is 2026-02-01. xAI says realtime
  events require enabling a search tool; model knowledge alone is not live [S11].

### Assessment

- **[INFERENCE, high]** The dedicated tool is the current developer abstraction;
  the older global `search_parameters` family remains in the REST reference as a
  compatibility/legacy path. The two families are not proven equivalent [S1][S9].
- **[INFERENCE, high]** The returned product is a model response informed by web
  retrieval, not a reusable ranked retrieval set. The model owns query formation,
  evidence selection, iteration, and prose synthesis inside one hosted loop.
- **[RECOMMENDATION, high]** Keep any xAI integration behind a grounded-answer
  provider adapter. Do not map the final answer or citation array directly to
  Curiosity's canonical `SearchResult[]`.

## 3. Dedicated tool contract and caller controls

### 3.1 Minimal Responses request

The current dedicated path is conceptually [S1]:

```json
{
  "model": "grok-4.6",
  "input": "What changed today?",
  "tools": [{ "type": "web_search" }]
}
```

This grants capability. It does not prescribe a query, result count, page list,
or deterministic execution plan.

### 3.2 Documented controls

| Control | Published behavior | Boundary / uncertainty |
| --- | --- | --- |
| `tools[].type` | `web_search` enables the xAI-managed tool [S1][S2]. | Enabling does not guarantee invocation under the default autonomous loop. |
| `filters.allowed_domains` | Restricts search **and browsing** to at most five domains [S1]. | Domain normalization, ports, paths, redirects, public-suffix handling, and subdomain semantics are not fully documented in the guide. |
| `filters.excluded_domains` | Excludes at most five domains; mutually exclusive with the allow list [S1]. | “Prevent the model from including” is not a documented redirect-chain or network-egress guarantee. |
| `enable_image_understanding` | Gives the agent `view_image` for images encountered while browsing [S1]. | Adds untrusted visual input and image-token cost. |
| `enable_image_search` | Permits image search; images enter model context and may appear as Markdown image embeds [S1]. | Structured image result records are not promised; image URLs/alt text are untrusted output. |
| `max_turns` | Caps assistant/server-tool loop turns in a request [S4][S9]. | A turn may make multiple parallel calls; this is not a call cap. The global default is undisclosed. |
| `parallel_tool_calls` | Allows parallel tool calls [S4][S9]. | Increases the possible calls and cost within one turn. |
| `tool_choice` | Generic Responses schema exposes a tool-choice control [S9]. | The reviewed dedicated guide does not specify reliable force/disable semantics for this built-in tool. |
| `include` citation flags | Responses inline citations default on; `no_inline_citations` disables Markdown links [S3]. | All-citation URLs still have different semantics from inline links. |
| `store`, `previous_response_id` | Can retain and hydrate full agentic state across turns [S5][S9]. | Persistence changes privacy and budget scope. |
| encrypted continuation | Can return opaque encrypted reasoning/tool outputs for client-carried continuation, including under ZDR [S5][S8]. | Continuity without inspectable evidence is not provenance. |

### 3.3 Location control: official-surface drift

- **[FACT, high]** The current official Python SDK's `web_search()` accepts
  `user_location_country`, `user_location_city`, `user_location_region`, and
  `user_location_timezone`; it constructs a `WebSearchUserLocation`. Country is
  described as ISO 3166-1 alpha-2 and timezone as an IANA identifier [S12].
- **[FACT, high]** The current Web Search guide's parameter table and Responses
  examples omit location. The REST reference documents `user_location` only
  under compatibility `web_search_options`, without claiming dedicated-tool
  semantics [S1][S9].
- **[UNKNOWN, material]** Whether location is supported identically in Responses,
  only in the gRPC SDK, or is documentation drift; whether it is a ranking hint or
  hard locale boundary; and what is disclosed downstream.

**Verdict:** location mapping is **DEFERRED**. Do not silently translate a
provider-neutral locale or jurisdiction constraint into this field.

### 3.4 Controls not found in the dedicated contract

No current dedicated-tool parameter was found for:

- text result count/top-k, pagination, or cursor;
- publication date range, recency window, or “as of” timestamp;
- language, market, safe-search level, content category, or source type;
- live-versus-cache-only selection;
- raw snippet/body return, maximum page bytes, browse depth, or render mode;
- ranking mode, score threshold, deduplication, or diversity;
- hard total successful-call cap, request spend ceiling, or per-tool deadline.

Natural-language instructions may steer some behavior, but are not enforceable
retrieval controls.

## 4. Legacy/global search controls are a web-only hazard

The REST reference still exposes `search_parameters` on Chat Completions and
Responses [S9]:

- `mode`: `off`, `on` (documented default), or `auto`;
- `sources`;
- `from_date` / `to_date` in `YYYY-MM-DD`;
- `max_search_results`;
- `return_citations`.

It explicitly says that when `sources` is omitted, the model searches **both web
and X by default**. That violates a web-only boundary unless the source list is
explicit and its schema/behavior is validated [S9]. The same reference says
`web_search_preview` is overridden by `search_parameters`, while the dedicated
2026 guide uses neither field [S1][S9].

**[UNKNOWN, material]** The official pages do not resolve:

1. precedence when dedicated `web_search` and global `search_parameters` coexist;
2. whether global dates apply to dedicated web retrieval;
3. the exact `sources` object schema on the rendered reference;
4. whether `max_search_results` limits candidates, hidden results, sources used,
   or final citations;
5. whether `mode:on` forces a search in the same sense as a built-in tool choice.

**REJECTED:** combining both control families in one adapter path.  
**RECOMMENDATION:** a web-only adapter must use the dedicated tool and prohibit
global `search_parameters` until authorized conformance tests prove isolation and
precedence.

## 5. Query, action, source, and citation metadata

### 5.1 Attempted query/action trace

- **[FACT, high]** In the xAI SDK, streamed `chunk.tool_calls` and final
  `response.tool_calls` expose every attempted server-side invocation, including
  an ID, precise function name, and arguments. Failures remain in this set [S4].
- **[FACT, high]** Web activity can use `web_search`,
  `web_search_with_snippets`, `browse_page`, `open_page`, and
  `open_page_with_find`; image search uses `search_images` [S4].
- **[FACT, high]** An official mixed-tool example shows a call shaped as
  `web_search` with `{"query":"...","num_results":5}`. This proves that query
  and a model-selected result-count argument can be observable on at least the
  SDK trace; it does **not** make `num_results` a caller request control or prove
  that every call exposes the same arguments [S5].
- **[FACT, high]** Responses API output uses typed `web_search_call` items with
  type-specific action metadata rather than client-function-style name and
  arguments [S4][S5]. The public pages reviewed do not promise a stable,
  exhaustive action schema for every internal web operation.

**[INFERENCE, high]** The trace is a planner/executor audit: it can reveal what
the model tried to ask the retrieval plane to do. It is not a result ledger.

### 5.2 Successful usage and source counts

- **[FACT, high]** `server_side_tool_usage` (SDK) and
  `usage.server_side_tool_usage_details.web_search_calls` (Responses) count
  successful, billable Web Search executions. `num_sources_used` and total
  server-side-tool counts are also returned [S4][S9].
- **[FACT, high]** Attempted and successful counts may differ because of invalid
  arguments, missing pages, network/service errors, or other failed executions.
  Only successful executions are billed [S4].
- **[FACT, high]** All low-level web function names above map to the high-level
  `SERVER_SIDE_TOOL_WEB_SEARCH` usage category [S4].

**[UNKNOWN, material]** Whether a successful search followed by a successful page
open always bills as two Web Search calls; how redirects/retries/cache hits are
counted; and whether `num_sources_used` counts unique canonical URLs, encountered
records, or model-consumed sources.

### 5.3 All citations versus inline citations

- **[FACT, high]** `response.citations` is returned by default and contains URLs
  from all successful tool executions encountered during the search. It may
  include sources not referenced in the final answer [S3].
- **[FACT, high]** Responses inline citations default on and use
  `[[N]](url)`. The xAI SDK requires opt-in. The model decides whether and where
  to cite; enabling citations does not guarantee them on every answer [S3].
- **[FACT, high]** Structured Responses annotations contain URL, title/visible
  citation number, and `start_index`/`end_index`. Those offsets identify the
  Markdown citation token in the **answer text**, from `[` through the exclusive
  end after `)`. They do not identify a claim span or a passage within the source
  [S3].
- **[FACT, high]** Repeated citations to the same URL reuse the original display
  number. Image search may instead emit !\[alt\]\(url\) Markdown embeds [S3].
- **[FACT, high]** Citation links stream with output text; accumulated structured
  citations and the all-citations URL list are available at completion [S3].

### 5.4 Provenance deficit

The public contract does **not** promise:

- raw hit/result objects, snippets, passages, page bodies, or rendered captures;
- rank positions, retrieval scores, ranking reasons, or candidate counts;
- a mapping from query/call ID to source URL;
- provider/index/crawler lineage;
- fetch, first-seen, last-seen, cache, or publication timestamps;
- canonical URL, redirect chain, duplicate cluster, or content hash;
- source passage offsets, extraction version, or entailment relation;
- why an encountered source was selected, rejected, or cited.

**[INFERENCE, high]** xAI provides useful execution and source-discovery
provenance, partial presentation provenance, and weak evidence custody. A URL
encountered during a successful call is not proof that it supports a claim.

**[RECOMMENDATION, high]** Curiosity should retain separate sets for attempted
actions, successful actions, encountered records, opened captures, selected
passages, and claim-linked citations. Canonical citations should target immutable
`capture_id + passage_id/hash`; URL/answer offsets are presentation metadata.

## 6. Web retrieval and model boundary

### Confirmed facts

1. The caller supplies model input, tool permission/configuration, and loop/output
   controls [S1][S2].
2. Grok decides whether to search, formulates operations, may make multiple calls,
   analyzes results, and decides when it has enough information [S2][S4].
3. xAI executes Web Search server-side [S2].
4. Search and browsing expose distinct low-level operation names [S4].
5. **Server-side tool outputs are explicitly not returned**. The agent receives
   and uses them internally to produce the final response [S4].
6. For continuation, the complete state may be stored by xAI or carried as
   encrypted reasoning and encrypted tool output that remains opaque to the
   caller [S5][S8].

### Minimum architecture consistent with those facts

```text
caller input + web policy + loop controls
                  |
                  v
          Grok planner/reasoner
       (query/action/stop selection)
                  |
                  v
       xAI Web executor family
  search/snippets -> browse/open/find -> optional images
                  |
                  v
       hidden result/evidence context
                  |
                  v
        Grok analysis and synthesis
                  |
                  v
 answer + URL annotations + all URLs + attempt/success/usage/cost trace
```

- **[INFERENCE, high]** Planning/synthesis and retrieval execution are
  operationally separable—the contract has distinct calls, usage, and billing—
  but product control remains model-coupled. The retrieval plane is not separately
  callable as a stable ranked-results API.
- **[INFERENCE, medium-high]** The web executor has at least discovery and
  selective page-acquisition/navigation stages. Function names support this
  functional decomposition; they do not reveal the search index, browser stack,
  extractor, or storage implementation.
- **[INFERENCE, high]** An evidence accumulator collects URLs across successful
  operations before/alongside final synthesis, because the final all-citations
  list includes encountered but uncited sources.
- **[INFERENCE, medium]** Successful executor completion is an accounting
  boundary: attempted calls are retained separately, while meaningful successful
  responses populate usage and billing.
- **[UNKNOWN]** Search provider(s), index ownership, crawl coverage, live-fetch
  policy, cache, ranking, deduplication, extraction, JavaScript rendering,
  robots/paywall handling, malware defenses, and model/tool independent version
  pinning.

## 7. Temporal behavior and freshness

- **[FACT, high]** xAI describes Web Search as searching the web “in real-time,”
  accessing pages, and extracting current information [S1].
- **[FACT, high]** The dedicated Web Search guide exposes no publication-date,
  recency, cache-only/live, or as-of control [S1].
- **[FACT, high]** Global legacy `search_parameters` exposes day-granularity date
  fields, but its relationship to the dedicated tool and source-specific behavior
  is unresolved [S9].
- **[FACT, high]** Response creation/completion timestamps describe the API
  response, not source publication, crawl, index, or page-fetch time [S9].

**[INFERENCE, high]** “Real-time” is a capability/marketing description, not a
freshness SLA or proof that each cited URL was live-fetched. Current retrieval may
combine search results, snippets, cached material, and page access; the public
contract does not say which path produced a source.

**Unknowns retained:** crawl/index lag, cache TTL, page refetch policy, time-zone
semantics, date extraction, historical completeness, future-dated content,
mutable-page handling, and freshness/ranking tradeoffs.

**[RECOMMENDATION, high]** Curiosity should distinguish query/event time,
publisher-claimed publication/update time, observed/fetched time, and index time.
Never infer any of those from the response timestamp or the word “real-time.”

## 8. Limits, pricing, lifecycle, and errors

### 8.1 Cost model

- **[FACT, high]** Web Search costs **$5 per 1,000 successful calls** ($0.005 per
  successful call), in addition to model token charges. Image Search is part of
  Web Search at the standard rate; image inspection has no invocation fee but
  incurs image-token cost [S6].
- **[FACT, high]** All standard token classes are billed. In agentic runs,
  `prompt_tokens` is cumulative across internal inference steps as history grows;
  reasoning, output, image, and cached prompt tokens are separately visible [S4].
- **[FACT, high]** `usage.cost_in_usd_ticks` gives the exact per-request charge
  after discounts, including model tokens and server-side tools; 10^10 ticks =
  USD 1. Multi-request conversations must be summed by the client [S7].
- **[FACT, high]** Grok 4.6 below 200k prompt tokens is listed at $2/M input,
  $0.50/M cached input, and $6/M output; at or above 200k prompt tokens, all rates
  for that request double to $4/$1/$12 [S6].

### 8.2 Bounds and lifecycle

- **[FACT, high]** Domain allow/exclude lists each cap at five entries and are
  mutually exclusive [S1].
- **[FACT, high]** `max_turns` bounds loop turns, not calls. Parallel calls can
  occur in one turn. If unset, an undisclosed server-global cap applies [S4].
- **[FACT, high]** When server and client tools are mixed, yielding for a client
  tool ends the request; the follow-up request starts a fresh `max_turns` count
  [S5]. Thus a task-level loop can exceed one request's cap.
- **[FACT, high]** The official Python SDK default timeout is 1,620 seconds (27
  minutes), configurable only when constructing the client, not per RPC. xAI's
  SDK automatically retries `UNAVAILABLE` with up to five attempts by default
  [S13]. These are SDK transport defaults, not Web Search service SLAs.
- **[FACT, high]** Rate limits are per-model RPS and TPM, vary by spend tier, and
  return HTTP 429 when exceeded. The public page gives no separate Web Search call
  quota [S8b].

### 8.3 Failure surface

- **[FACT, high]** Invalid tool arguments, missing/nonexistent pages, temporary
  network/service problems, and other execution failures can appear among
  attempted calls but not successful usage. The agent may continue with an
  alternative trajectory [S4].
- **[FACT, high]** The official SDK documents `INVALID_ARGUMENT`,
  `DEADLINE_EXCEEDED`, `NOT_FOUND`, `PERMISSION_DENIED`, `UNAUTHENTICATED`,
  `RESOURCE_EXHAUSTED`, `INTERNAL`, `UNAVAILABLE`, and `DATA_LOSS` gRPC classes;
  these are general SDK/API errors, not a web-search-specific taxonomy [S13].
- **[FACT, high]** Responses can contain top-level `error`, `incomplete_details`,
  and `completed`/`in_progress`/`incomplete` status fields [S9]. The reviewed
  reference does not define search-specific reason codes.

### 8.4 Material unknowns and contradictions

- maximum accepted `max_turns`, successful calls per request, results per call,
  page bytes, browse depth, wall time, and latency SLA;
- whether the response-only `max_tool_calls` field in the REST schema corresponds
  to any accepted request control—the request-body list documents `max_turns`, not
  `max_tool_calls` [S9];
- cancellation semantics for an in-flight Responses request (the reference marks
  `background` unsupported) [S9];
- search-specific `no_match`, policy filtering, robots denial, fetch failure,
  partial result, stale fallback, and provider outage distinctions;
- retry idempotency and duplicate-charge behavior after ambiguous transport
  failure.

**Boundedness verdict — ADAPT, not adopt as-is.** Curiosity needs a task-wide
monotonic ledger for total/per-action calls, branches, retries, continuations,
bytes, sources, elapsed time, model tokens, and spend. A provider turn cap and
retrospective exact cost are secondary controls, not prospective authority.

## 9. Privacy, safety, and content trust

### 9.1 Published API data handling

- **[FACT, high]** xAI says it never trains on API inputs or outputs without
  explicit permission. By default, requests and responses are encrypted at rest,
  retained for 30 days for abuse/misuse auditing, and automatically deleted after
  30 days [S8].
- **[FACT, high]** Team-wide ZDR, where available, prevents prompt/output disk
  persistence but disables stored Responses state, Files/Collections, Batch,
  deferred completions, and other storage-dependent features. Every response
  exposes `x-zero-data-retention: true|false` [S8].
- **[FACT, high]** Encrypted client-carried agentic state is the documented
  continuation path under ZDR [S5][S8]. It can include encrypted tool outputs,
  which remain unreadable to the client.
- **[FACT, high]** A caller may supply a stable `user` identifier for abuse
  monitoring; Responses may return a `safety_identifier` [S9]. Pre-generation
  Responses requests blocked for usage-guideline violations can incur a $0.05
  fee [S6].
- **[FACT, high]** The official SDK can emit OpenTelemetry attributes containing
  prompts and responses when telemetry is explicitly enabled; it provides
  `XAI_SDK_DISABLE_SENSITIVE_TELEMETRY_ATTRIBUTES` to omit sensitive content
  attributes [S13].

### 9.2 Search-specific unknowns

No reviewed primary page specifies:

- whether queries, location, URLs, or fetched content are disclosed to a
  third-party search provider, and under what retention terms;
- search provider/subprocessor identity or source-level data residency;
- whether pages are fetched directly by xAI, by a provider, or from cache;
- search-specific safe-search controls, malware scanning, prompt-injection
  isolation, harmful-source ranking, takedown handling, or filtering explanations;
- whether domain filters constrain every redirect/fetch hop and image host;
- whether all internal query rewrites are present in the returned attempted trace.

**[INFERENCE, high]** ZDR governs xAI persistence of request/output content; it is
not evidence of no transient processing, no external web requests, no downstream
provider disclosure, or inspectable evidence custody.

### 9.3 Curiosity safety implications

- **[RECOMMENDATION, high]** Treat search snippets, pages, metadata, images,
  alt text, URLs, and citation Markdown as adversarial external data. Never place
  retrieved instructions in the privileged instruction channel.
- **[RECOMMENDATION, high]** Validate/normalize IDNA domains and schemes; enforce
  source and network policy below the model; block unsafe redirect chains and
  private/link-local address resolution; sanitize Markdown and image embeds.
- **[RECOMMENDATION, high]** Keep private context out of provider query
  generation. If private-data synthesis is later added, disable public egress
  before private evidence enters context.
- **[RECOMMENDATION, high]** Record provider disclosure and retention policy as
  part of every adapter's effective policy. Do not infer it from API ZDR.

## 10. Clean-room architecture lessons for Curiosity

| xAI observable | Curiosity verdict | Clean-room implication |
| --- | --- | --- |
| Web Search is a typed server tool. | **ADOPTED** | Keep a provider-neutral search capability separate from model memory and adapters. |
| Search, browse, open, and find appear as distinct operations. | **ADOPTED** | Use typed `discover`, `fetch/open`, and `find/passage` stages with separate budgets. |
| Attempted and successful executions are separate. | **ADOPTED** | Preserve both ledgers; reconcile success, failure, retry, and cost explicitly. |
| Encountered URLs differ from inline-cited URLs. | **ADOPTED** | Keep encountered, opened, selected, and claim-linked source sets separate. |
| Domain allow/exclude policy is a tool parameter. | **ADAPTED** | Enforce richer canonical host/network policy below the model; expose lossy provider mapping. |
| Model formulates and iterates queries. | **ADAPTED** | Permit planning only inside caller-declared frame, authority, branch budget, and deterministic stop rules. |
| Query/action trace is observable. | **ADAPTED** | Retain redacted query lineage with call/branch IDs; never assume trace completeness. |
| Exact retrospective cost is returned. | **ADAPTED** | Preserve provider cost, but enforce prospective local spend and resource ceilings. |
| Answer citations have URL and Markdown offsets. | **ADAPTED** | Keep visible citation UX, but bind claims to immutable owned passages and evidence relations. |
| Images can enter context and output. | **ADAPTED** | Make multimodal retrieval a separate permission/budget with safe media proxying. |
| Tool outputs remain hidden. | **REJECTED** | Owned core must expose bounded readable evidence, capture identity, extraction metadata, and lineage. |
| Synthesized answer is the principal product. | **REJECTED as core** | Retrieval returns evidence; synthesis is downstream and separately attributable. |
| Global default loop cap. | **REJECTED** | Require explicit task-level call/time/byte/token/spend limits. |
| URL citation as sufficient provenance. | **REJECTED** | Mutable URLs and citation placement do not prove support or preserve content. |
| Legacy `search_parameters` for a web-only adapter. | **REJECTED pending proof** | Omitted sources can widen into X; precedence and date semantics are unclear. |
| Production xAI adapter. | **DEFERRED** | Needs paid conformance tests, legal/privacy review, operational policy, and an ADR. |

### Recommended provider-neutral evidence envelope

This is a design lesson, not an implementation proposal:

- request frame, source/network policy, declared temporal intent, and hard budget;
- branch/call ID, parent, intent/facet, exact dispatched query, action type, and
  provider attempt/success/failure timestamps;
- provider/source lineage and effective-policy mapping with lossy warnings;
- immutable capture ID, canonical/redirect metadata, fetch time/status, content
  hash, extractor/version, bounded passage, and source offsets;
- rank stage/position and reason classes without pretending cross-provider score
  comparability;
- encountered/opened/selected/cited transitions and claim support/contradiction/
  unresolved relation;
- provider usage/cost plus owned CPU, network bytes, render work, and model tokens;
- explicit stop reason: coverage, saturation, exhaustion, deadline, budget, policy,
  cancellation, or upstream failure.

## 11. Checks required before reconsidering the deferred adapter

These checks require separate caller authority and paid credentials; none were
run in this study.

1. Pin an API/SDK/model version and capture exact request/response JSON for a
   dedicated web-only request, with proof that no shared source is enabled.
2. Test omitted, empty, allow, and exclude domain filters: case, Unicode/IDNA,
   subdomains, ports, paths, redirects, public suffixes, and conflicting lists.
3. Compare Responses and gRPC location fields; determine validation, ranking
   effect, disclosure, and whether location is merely advisory.
4. Test `tool_choice` auto/required/none/specific semantics for the built-in tool.
5. Compare `max_turns=1` with parallel calls on/off; reconcile attempted calls,
   successful web calls, sources, and exact ticks.
6. Determine whether search, browse, open, find, and automatic retries each incur
   separate successful-call charges.
7. Verify global `search_parameters` precedence or reject the combination at the
   adapter boundary; prove a web-only source list and date semantics if retained.
8. Test no-result, malformed query, blocked/redirected page, robots denial,
   timeout, service failure, partial success, cancellation, and retry behavior.
9. Verify citation numbering, duplicates, redirects, Unicode offsets, disabled
   inline mode, missing citations, image embeds, and all-citation/source counts.
10. Measure latency, maximum calls/results/pages/bytes, deadline behavior, and
    cancellation under an external task-level budget.
11. Run authorized adversarial pages/images containing prompt injection,
    malicious Markdown, tracking URLs, and cross-origin redirects; validate
    Curiosity-side isolation rather than relying on provider behavior.
12. Confirm enterprise terms, DPA/subprocessors, query/location disclosure,
    region behavior, ZDR response header, and retention with counsel.

## 12. Unknowns and negative results retained

| Item | Result | Confidence / next check |
| --- | --- | --- |
| Raw web results/tool outputs | Explicitly not returned [S4]. | **Known negative, high.** Cannot reconstruct a faithful ranked-results contract. |
| Dedicated web date filter | Not found in Web Search guide [S1]. | **Known negative in reviewed contract, high.** Legacy global field is unresolved. |
| Language/market/safe-search | No dedicated controls found. | **Known negative in reviewed sources, high.** Ask xAI/support; do not promise. |
| Location | Present in official SDK source, omitted from dedicated Responses guide [S1][S12]. | **Contradiction/drift, medium.** Conformance test both surfaces. |
| Dedicated tool vs `search_parameters` | Two overlapping contract families [S1][S9]. | **Material unknown, high risk.** Prohibit combination. |
| Web-only isolation under legacy defaults | Omitted source list searches web and X [S9]. | **Known hazard, high.** Dedicated tool only. |
| Hard call ceiling | `max_turns` is not calls; request `max_tool_calls` not documented though response field exists [S4][S9]. | **Material unknown, high.** Enforce externally. |
| Query trace completeness | SDK exposes attempts; Responses exposes typed action items [S4][S5]. | **Unknown, medium.** Do not assume every rewrite/provider query appears. |
| Index/provider/ranking | Not disclosed. | **Known unknown, high.** No vendor or algorithm claim. |
| Freshness SLA/cache age | Not disclosed. | **Known unknown, high.** “Real-time” is not measurable provenance. |
| Search-specific errors | No typed public taxonomy found. | **Known negative in reviewed sources, medium-high.** Runtime matrix required. |
| Prompt-injection/malware defenses | No search-specific public guarantee found. | **Known unknown, high risk.** Apply Curiosity defenses. |
| Status snapshot | `status.x.ai` returned HTTP 403 to this unauthenticated fetch. | **Unknown.** No 2026-08-17 uptime claim. |
| Legal pages | Direct fetch of current x.ai AUP/enterprise terms returned HTTP 403. | **Limitation.** Counsel must retrieve canonical terms before adoption. |

## 13. Bounded curiosity pass

Score: 1–5 each for **relevance (R)**, **decision value (V)**, **novelty (N)**,
and **cost (C)**. Pursue only high `R + V + N - C` threads inside the declared
public/no-credential frame.

| Thread | R | V | N | C | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Hidden output and trace semantics | 5 | 5 | 4 | 1 | **Pursued:** tool-usage and citation docs resolved attempt/success/output boundaries. |
| Dedicated/legacy contract collision | 5 | 5 | 4 | 2 | **Pursued:** REST reference confirmed web+X default hazard; contradiction retained. |
| SDK-only location fields | 5 | 4 | 4 | 2 | **Pursued:** official SDK source confirmed fields absent from the dedicated guide. |
| Error/retry/timeout behavior | 4 | 4 | 3 | 2 | **Pursued:** official SDK README provided generic classes and defaults; search-specific gap remains. |
| Underlying index/search vendor | 3 | 2 | 5 | 5 | **CURIOSITY_NO_GO:** undisclosed, speculative, and not required for the contract decision. |
| Ranking algorithm and candidate fusion | 4 | 3 | 4 | 5 | **CURIOSITY_NO_GO:** no primary evidence; avoid reverse-engineering claims. |
| Consumer Grok Search behavior | 2 | 2 | 3 | 4 | **CURIOSITY_NO_GO:** different surface and outside the API Web Search frame. |
| X Search comparison | 1 | 1 | 2 | 2 | **CURIOSITY_NO_GO:** explicitly excluded by caller; only shared-default hazard retained. |
| Paid runtime probes | 5 | 5 | 5 | 5 | **CURIOSITY_NO_GO:** paid calls and credentials explicitly prohibited; checks deferred. |
| Third-party wrappers | 2 | 2 | 2 | 2 | **CURIOSITY_NO_GO:** official primary sources were sufficient; wrapper quirks add little decision value. |

**Stop condition:** Every requested dimension has primary-source coverage or an
explicit unknown/negative result. Further public-source review was saturating;
remaining material questions require paid conformance tests, provider support, or
legal access outside this frame.

## Primary official sources

All sources accessed **2026-08-17**.

- **[S1]** xAI Docs, [Web Search](https://docs.x.ai/developers/tools/web-search).
- **[S2]** xAI Docs, [Tools Overview](https://docs.x.ai/developers/tools/overview).
- **[S3]** xAI Docs, [Citations](https://docs.x.ai/developers/tools/citations).
- **[S4]** xAI Docs, [Tool Usage Details](https://docs.x.ai/developers/tools/tool-usage-details).
- **[S5]** xAI Docs, [Advanced Tool Usage](https://docs.x.ai/developers/tools/advanced-usage).
- **[S6]** xAI Docs, [Pricing](https://docs.x.ai/developers/pricing).
- **[S7]** xAI Docs, [Cost Tracking](https://docs.x.ai/developers/cost-tracking).
- **[S8]** xAI Docs, [FAQ — Security](https://docs.x.ai/developers/faq/security).
- **[S8b]** xAI Docs, [Rate Limits](https://docs.x.ai/developers/rate-limits).
- **[S9]** xAI Docs, [Inference API: Chat and Responses reference](https://docs.x.ai/developers/rest-api-reference/inference/chat).
- **[S10]** xAI Docs, [Release Notes](https://docs.x.ai/developers/release-notes).
- **[S11]** xAI Docs, [Models](https://docs.x.ai/developers/models) and [Grok 4.6](https://docs.x.ai/developers/grok-4-6).
- **[S12]** xAI, official Apache-2.0 Python SDK,
  [`src/xai_sdk/tools.py`](https://github.com/xai-org/xai-sdk-python/blob/2c24a8af4f76b4392593981a0ffaca283b59408d/src/xai_sdk/tools.py),
  pinned at commit `2c24a8af4f76b4392593981a0ffaca283b59408d`.
- **[S13]** xAI, official Apache-2.0 Python SDK,
  [README — telemetry, timeouts, retries, and errors](https://github.com/xai-org/xai-sdk-python/blob/2c24a8af4f76b4392593981a0ffaca283b59408d/README.md),
  pinned at the same commit.
