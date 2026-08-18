# OpenAI Web Search: clean-room product and architecture study

**Access date:** 2026-08-17  
**Subject:** OpenAI's public-web search surfaces, especially the Responses API
hosted `web_search` tool, ChatGPT Search, and long-running research.  
**Decision:** what a from-scratch, wholly owned agent-search system can learn
from OpenAI without depending on, reproducing, or reverse engineering OpenAI's
service.  
**Status:** competitor research; not an implementation, benchmark, legal
opinion, or claim about non-public internals.

## Executive verdict

**REJECTED as a foundation; ADAPTED as a contract and UX reference (high
confidence).** OpenAI offers a polished, answer-first search product: a model
can decide whether to search, issue one or more rewritten queries, open pages,
find text in pages, synthesize an answer, and return span-addressed URL
citations. The current Responses API also exposes the complete consulted URL
set on request, domain allow/block controls, approximate location, qualitative
context size, live-versus-cache-only access, image search, and a returned-token
budget control. Long-running reasoning models turn the same primitives into an
agentic research trajectory [S1][S3].

That interface is valuable evidence for agent ergonomics, but it is the wrong
base for an owned system. OpenAI explicitly says ChatGPT Search uses third-party
search providers and directly supplied partner content; OpenAI also operates
`OAI-SearchBot`, and the API can select cached/indexed-only or live access
[S4][S6][S7]. The evidence supports a multi-source hosted retrieval fabric, not
an independently owned and auditable corpus. The API does not expose capture
IDs, crawl/fetch timestamps, immutable document versions, passage offsets or
hashes, rank scores/reasons, coverage estimates, duplicate clusters, or an
index snapshot. Citations identify output spans and current URLs, not preserved
evidence.

For `opencode2-curiosity`, adopt the **separation of search, open, and find
actions**, **optional full source inventory**, **hard domain and live-access
controls**, **explicit long-run budgets**, and **user-visible citations**.
Improve on OpenAI by returning typed, immutable evidence and by keeping the
caller—not the model—in control of the research frame, authority, total budget,
and one bounded curiosity pass.

## 1. Frame, bounded questions, and method

### 1.1 Questions

1. What OpenAI search products and API paths are current on 2026-08-17?
2. What request, response, action, source, citation, limit, error, and pricing
   contracts are publicly documented?
3. What does OpenAI itself disclose about query planning, retrieval sources,
   crawling, freshness, ranking, privacy, and safety?
4. Which architecture conclusions follow from those facts, and which remain
   unknowable without prohibited reverse engineering?
5. Which product ideas should Curiosity adopt, adapt, reject, or defer?

### 1.2 Evidence boundary

- Primary evidence is limited to OpenAI documentation, API reference, help
  center, product announcements, policies, status page, and published bot IP
  manifest. Public UI descriptions and screenshots count as observable public
  behavior; vendor quality claims do not count as comparative proof.
- No credentials, API calls, paid tests, browser automation, hidden endpoints,
  traffic interception, decompilation, rate-limit bypass, or service probing
  were used. No OpenAI output was used to train, seed, or evaluate a competing
  model.
- OpenAI's business agreement prohibits reverse engineering the service,
  extracting data except as permitted, circumventing restrictions, and—subject
  to stated exceptions—using output to develop competing AI models [S16]. This
  report therefore analyzes only published contracts and ordinary public
  behavior.
- Documentation was read live on 2026-08-17. It is mutable. A material
  contradiction between the current deep-research guide and the deprecation
  ledger is retained rather than silently resolved (Section 2.3).

### 1.3 Labels

- **FACT**: directly supported by cited official/public evidence.
- **INFERENCE**: an architectural conclusion from facts, not a disclosed
  implementation detail.
- **RECOMMENDATION**: a choice proposed for Curiosity.
- Confidence is **high**, **medium**, or **low**.

## 2. Product surfaces and status

### 2.1 Current surface map

| Surface | Public behavior/status on access date | Fit for an agent-search study |
| --- | --- | --- |
| ChatGPT Search | Available to Free, Plus, Team, Edu, and Enterprise users, and to logged-out Free users. ChatGPT may search automatically or the user can select Search; web, desktop, mobile, voice rollout, and a default-search browser extension are documented [S2]. | Consumer reference for automatic/manual invocation, conversational follow-up, inline citations, source sidebar, images, maps, local results, and vertical cards. |
| Responses API `web_search` | Current recommended API path. It is a hosted tool that a model may call; OpenAI recommends `web_search` rather than legacy `web_search_preview` [S1]. | Primary developer contract and the closest competitor to Curiosity's `web_search` ABI. |
| Chat Completions search | `gpt-5-search-api` remains the documented compatibility path. Unlike Responses tool use, the specialized search model always searches and lacks Responses-only controls such as domain filtering, complete sources, live-access control, and returned-token budget [S1]. | Evidence that “always search” model coupling is a legacy/compatibility branch, not the preferred architecture. |
| Agentic reasoning search | GPT-5-class reasoning models can decide to search repeatedly, analyze results, open/find pages, and stop. Reasoning effort trades depth and latency [S1]. | Reference for model-managed query trajectories, but its stop policy is opaque to the caller unless bounded externally. |
| Long-running/deep research | The current web-search guide recommends GPT-5.5 with `high` or `xhigh` reasoning and background mode for reports that can inspect hundreds of sources [S1]. ChatGPT's February 2026 update adds trusted-site restriction, MCP/app connections, real-time progress, and interruption/refinement [S5]. | Product reference for clarification, prompt expansion, asynchronous execution, progress, source review, and mixed public/private research. |
| Publisher/search crawler | `OAI-SearchBot` controls eligibility to surface content in ChatGPT search; GPTBot training controls are independent; `ChatGPT-User` performs user-triggered visits and is not the search inclusion crawler [S6]. | Strong evidence of an OpenAI-operated crawl/index contribution and separate crawl-purpose policy. |
| Partner/vertical data | OpenAI documents publisher feeds/partners and real-time sports, weather, and finance source labels; ChatGPT also has shopping and restaurant/reservation integrations [S1][S2][S4]. | Evidence that “web search” is a routed retrieval fabric with structured vertical sources, not just ten blue links. |

### 2.2 Product evolution

**FACT (high):** SearchGPT began as a temporary prototype in July 2024 with
answer-first results, conversational follow-ups, inline named attribution, a
source sidebar, and publisher controls separated from model-training controls
[S17]. Those interaction patterns moved into ChatGPT Search, made broadly
available by February 2025 [S4].

**FACT (high):** The API has moved from specialized preview search models and
`web_search_preview` toward the generally documented Responses `web_search`
tool. The `gpt-4o-search-preview` variants shut down on 2026-07-23, and the
current guide directs new integrations to Responses [S1][S15].

**INFERENCE (high):** OpenAI treats search as a reusable hosted capability
inside a general response/agent substrate, while retaining vertically optimized
consumer experiences and a compatibility model. Curiosity should likewise keep
its public tool ABI separate from its retrieval engine and presentation layers.

### 2.3 Documentation contradiction retained

The live deep-research guide still says to call `o3-deep-research` or
`o4-mini-deep-research` with `web_search_preview` and provides executable-looking
examples [S3]. The live deprecation ledger says those model aliases and snapshots
were shut down on 2026-07-23 and recommends `gpt-5.6-sol` [S15]. Meanwhile, the
current web-search guide recommends GPT-5.5 with high/xhigh reasoning for deep
research [S1].

**Verdict:** treat the old deep-research model examples as stale design evidence,
not a callable current contract. The current Responses `web_search` guide and
deprecation ledger control for status. **Confidence: high** that a contradiction
exists; **medium** on the exact intended replacement because two current official
pages name different GPT-5-family paths.

## 3. Observable public product behavior

Official help and launch material characterize the user experience as follows
[S2][S4]:

1. ChatGPT decides that a prompt may benefit from the web, or the user selects
   Search explicitly.
2. It may rewrite the prompt into one or more targeted provider queries and may
   issue narrower follow-ups after seeing initial results.
3. The answer uses the context of the conversation, including relevant Memory
   when enabled, to improve query rewriting.
4. Search answers may contain inline citations; desktop hover reveals a source,
   clicking opens it, and a Sources control opens cited and other relevant links.
5. Images can appear above answers and link to their source. Mobile can show
   maps. Structured local, weather, stock, sport, news, shopping, and restaurant
   experiences can replace a uniform document list.
6. Follow-up questions reuse conversation context. Users can also regenerate a
   prior answer with “Search the web.”

**What was not observed:** no authenticated or paid live search was run for this
study. Therefore, citation accuracy, result ordering, latency, cache age,
geographic variance, personalization strength, and failure UX were not measured.
Official screenshots establish offered interaction patterns, not consistent
runtime quality.

## 4. Request and tool contract

### 4.1 Responses request

At minimum, a caller sends a model, input, and a hosted tool declaration [S1]:

```json
{
  "model": "<supported-model>",
  "tools": [{ "type": "web_search" }],
  "tool_choice": "auto",
  "input": "What changed today?"
}
```

The documented web-search controls are:

| Control | Semantics and boundary |
| --- | --- |
| `tool_choice` | `auto` makes search optional. `required` or a specific search tool choice forces tool use [S1]. |
| `search_context_size` | `low`, `medium` (default), or `high`; controls approximate search context supplied to the model, not an exact token or source count [S1]. |
| `filters.allowed_domains` | Up to 100 domains, scheme omitted; subdomains included [S1]. |
| `filters.blocked_domains` | The guide says up to 100 blocked domains [S1]. The captured API-reference schema shown on the same date only listed `allowed_domains`, so blocked-domain schema stability is uncertain [S18]. |
| `user_location` | Approximate country, city, region, and/or IANA timezone; unavailable for deep-research models in the guide's stated limitation [S1]. |
| `external_web_access` | Defaults to `true`; `false` restricts Responses `web_search` to cached/indexed content and prevents new external fetches. Legacy preview ignores it [S1]. |
| `return_token_budget` | `default` or `unlimited`; only hosted Responses `web_search` with GPT-5+ reasoning search. “Unlimited” removes the standard returned-content cap but does not enlarge model/search context [S1]. |
| `search_content_types` | Request text and/or image results [S1]. |
| `image_settings` | Positive image `max_results` and optional caption generation [S1]. |
| `include` | `web_search_call.action.sources` returns consulted URLs; `web_search_call.results` returns raw result objects where supported, explicitly including image results [S1][S18]. |
| `background` | Runs long work asynchronously; poll/retrieve, stream, or cancel via Responses lifecycle [S8]. |
| `max_tool_calls` | Documented as the primary cost/latency bound for the older deep-research API workflow [S3]. It is not presented as a per-search result limit [S3]. |

**Notably absent:** a stable top-k text result count, pagination/cursor, date range,
language, market, safe-search level, source class, freshness SLA, exact deadline,
cost ceiling, ranker/version selector, diversity policy, raw text passage request,
or maximum page bytes. Some can be requested in natural-language instructions,
but a prompt is not an enforceable retrieval contract.

### 4.2 Response/action shape

A search-using response contains a `web_search_call` output item and a final
`message` [S1][S18]:

```json
[
  {
    "type": "web_search_call",
    "id": "ws_...",
    "status": "completed",
    "action": {
      "type": "search",
      "queries": ["query one", "query two"],
      "sources": [{ "type": "url", "url": "https://example.org" }]
    }
  },
  {
    "type": "message",
    "status": "completed",
    "role": "assistant",
    "content": [{
      "type": "output_text",
      "text": "Synthesized answer ...",
      "annotations": [{
        "type": "url_citation",
        "start_index": 0,
        "end_index": 18,
        "url": "https://example.org",
        "title": "Example"
      }]
    }]
  }
]
```

The action union is:

- `search`: optional singular `query`, optional plural `queries`, and optionally
  included URL sources;
- `open_page`: optional URL, supported for reasoning models;
- `find_in_page`: URL plus text pattern, supported for reasoning models.

Call status can be `in_progress`, `searching`, `completed`, or `failed` [S18].
The guide cautions that search queries are “usually (but not always)” present
[S1]. A URL citation contains output character indices, title, and URL. It does
not identify the supporting passage in the source.

### 4.3 Sources, results, and answer are distinct

**FACT (high):** inline citations are the most relevant references shown in the
answer; the optional `sources` field is the complete list of URLs consulted and
is often larger. Real-time feeds can appear as `oai-sports`, `oai-weather`, or
`oai-finance` [S1].

**FACT (high):** image results can be explicitly returned as structured records
with canonical image URL, source-page URL, optional thumbnail, and optional
caption [S1]. The public guide does not document an equivalent stable raw text
result record containing title, snippet, score, published time, and body text.

**INFERENCE (high):** the contract is optimized for **grounded answer
generation**, not raw search-as-infrastructure. A consumer wanting a ranked,
replayable retrieval set must infer too much from actions, sources, and the
final answer.

## 5. Query planning and caller controls

### 5.1 Three execution modes

OpenAI explicitly distinguishes [S1]:

1. **Non-reasoning search:** pass the user's query to search and answer from top
   results, with no internal planning; fast lookup path.
2. **Reasoning/agentic search:** the model manages search, analyzes results, and
   decides whether to continue; higher depth and latency.
3. **Deep research:** extended, agent-driven investigation across potentially
   hundreds of sources; several minutes; background execution recommended.

ChatGPT's deep-research workflow adds a pre-research clarification model and a
prompt-rewriting model; the historical API guide says the API did not perform
those two stages automatically and expected a complete prompt [S3]. ChatGPT's
2026 product update adds live progress, interrupt, refinement, trusted-site
restriction, and MCP/app sources [S5].

### 5.2 What is observable about planning

- ChatGPT may transform one natural-language prompt into multiple targeted
  provider queries and refine after initial results [S2].
- API `search` actions can expose singular or plural queries, while
  `open_page`/`find_in_page` expose navigation actions [S1][S18].
- Reasoning effort and returned-content budget alter depth/cost, and
  `max_tool_calls` can bound the older deep-research trajectory [S1][S3].
- The model decides whether to search under `auto`; the caller can force search
  but cannot specify a declarative plan graph, per-branch budget, or stopping
  criterion in the web-search tool schema [S1].

**Unknown:** query rewrite model, provider routing policy, branch generation,
duplicate-query suppression, source-quality classifier, stop function,
backtracking limits, and whether all query variants are always disclosed.

**Implication:** Curiosity should expose `branch_id`, `parent_branch_id`, intent,
facet, and hard per-branch/aggregate budgets. Planning may remain agentic, but
authority and boundedness should be machine-enforced rather than prompted.

## 6. Retrieval and index ownership evidence

### 6.1 Facts

1. OpenAI says ChatGPT Search “leverages third-party search providers, as well
   as content provided directly by our partners” [S4].
2. The Search help article names Bing and Shopify as third-party providers that
   may receive rewritten queries; it says additional providers can be queried
   as the search narrows [S2].
3. OpenAI operates `OAI-SearchBot` to crawl sites for ChatGPT search inclusion,
   separately from GPTBot training and user-triggered `ChatGPT-User` fetches
   [S6]. A public JSON file lists SearchBot IP prefixes [S7].
4. Responses search can be restricted to cached/indexed content or allowed to
   fetch live external content [S1]. Pricing calls retrieved context “search
   content tokens” from the search index, fed to the model [S9].
5. Real-time feeds and direct publisher/merchant/vertical integrations are
   surfaced separately [S1][S2][S4].

### 6.2 Architectural inferences

| Inference | Basis | Confidence |
| --- | --- | --- |
| OpenAI search is a federated retrieval fabric, not one homogeneous OpenAI-owned index. | Third-party search, partner content, first-party crawler, vertical feeds, and live/cache modes coexist. | High |
| An OpenAI-managed cache/index contributes results even when live access is disabled. | `external_web_access:false` is explicitly cache/index-only; SearchBot populates search eligibility; pricing names a search index. | High |
| Live page acquisition is a distinct lane from indexed retrieval. | Search, open, and find are separate action types; live access is independently switchable. | Medium-high |
| Provider-normalization and source-selection layers must exist before answer synthesis. | Multiple providers/feeds have to become URL sources and citations in one response contract. | High at functional level; unknown implementation. |
| Query routing likely considers vertical and location signals. | Named finance/weather/sports feeds, local query rewriting, location fields, and rich vertical cards. | Medium-high |

No evidence establishes that OpenAI owns a comprehensive general-web index,
the size of any OpenAI cache, which result came from which provider, or how
provider ranks are merged. The phrase “complete list of URLs consulted” is not
proof of complete candidate recall or provider lineage.

## 7. Freshness, ranking, snippets, and content

### 7.1 Freshness

**FACT:** live external access defaults on in current Responses search;
cache/index-only mode is explicit [S1]. ChatGPT Search markets timely answers
and uses real-time partner feeds for some verticals [S1][S4]. SearchBot says a
robots change may take approximately 24 hours to affect OpenAI systems [S6].

**UNKNOWN:** crawl schedules, cache TTL, per-result fetch time, first/last seen,
publication-time extraction, stale-result policy, index lag, partner-feed lag,
or a freshness SLA. The 24-hour robots statement is a policy-propagation bound,
not an indexing freshness guarantee.

**RECOMMENDATION:** Curiosity must return observed/fetched time, claimed
publication time with evidence, index snapshot, and a freshness warning. “Live”
is a retrieval mode, not sufficient provenance.

### 7.2 Ranking

OpenAI says ChatGPT Search ranking uses “a number of factors” intended to find
reliable, relevant information and offers no guaranteed top placement [S2]. It
also describes partnerships with publishers and direct data feeds [S4]. No
public source inspected names ranking features, model, objective, score scale,
diversity policy, freshness weight, personalization weight, ads interaction, or
provider-fusion algorithm.

**INFERENCE (medium):** there are at least two ranking decisions: retrieval
candidate ordering/selection and model-side evidence selection/citation. The
fact that `sources` is often larger than citations proves selection between
consulted sources and displayed citations, but not how either stage scores.

Do not describe OpenAI's ranking as lexical, vector, PageRank, learned-to-rank,
or “trust-ranked”; public evidence is insufficient.

### 7.3 Snippets and content

The API price makes search context consumption explicit: retrieved search
content tokens are billed at model rates [S9]. `search_context_size` controls
how much is passed to the model, while `return_token_budget` governs how much
search-result content the tool may return over a run [S1]. Reasoning models can
open a page and find a pattern [S1].

**UNKNOWN:** whether text comes from provider snippets, OpenAI cache, live HTML,
rendered DOM, extracted main text, partner feed fields, or some combination per
source. No extractor version, passage boundary, content hash, canonical cluster,
or source byte record is exposed.

**Implication:** do not copy the answer-first opacity. Curiosity should return a
bounded result list and passage objects tied to preserved captures; synthesis
is a downstream, separately attributable operation.

## 8. Citations and provenance

### 8.1 Strengths to learn from

- Citations are first-class output annotations, not prose footnotes guessed by
  a client [S1][S18].
- `start_index`/`end_index` bind a URL citation to an answer span [S18].
- The UI requirement is explicit: citations shown to end users must be visible
  and clickable [S1].
- The optional full URL inventory separates all consulted sources from the
  smaller set cited inline [S1].
- Search/open/find call items provide a coarse trajectory suitable for progress
  and audit UX [S1][S3].

### 8.2 Provenance deficits

A URL citation does **not** prove which source passage supports the answer span,
that the content still exists, that the displayed title came from the cited
capture, or that multiple claims inside the span are each entailed. It has no:

- provider or crawler lineage;
- document, capture, version, or index-snapshot ID;
- fetched, observed, changed, or publication timestamp;
- passage offset in source, quotation, or passage hash;
- extraction/ranker/model version;
- canonical/redirect chain or duplicate cluster;
- source type, publisher/owner cluster, or primary-source classification;
- support/contradict/unresolved relation;
- policy filtering or coverage warning.

**RECOMMENDATION (high):** preserve answer-span annotations as a presentation
adapter, but make the canonical citation target an immutable
`document_id + capture_id + passage_id/hash`. Resolve current URLs only as a
convenience.

## 9. Safety, privacy, and abuse

### 9.1 Search content as adversarial input

OpenAI's deep-research safety guide explicitly models indirect prompt injection
from web pages, files, and MCP results and warns that no automated filter catches
every attack [S3]. It recommends:

- trusted MCP servers and files;
- tool-call and model-message logging/review;
- separating public-web research from later private-data work with web access
  disabled;
- schema/regex validation of tool arguments;
- screening links before opening or presenting them;
- monitoring for exfiltration embedded in search query parameters.

This is unusually concrete competitor evidence and should be **ADOPTED as a
threat class**, not copied as assurance. The same guide observes that a
read-only connector can still return malicious instructions and that combining
private MCP data with open-web access creates an exfiltration path [S3].

### 9.2 Query and location privacy

For ChatGPT Search, OpenAI says it may [S2]:

- rewrite a prompt into one or more targeted queries sent to third-party
  providers;
- use general IP-derived location and share that general location;
- use relevant Memory in the rewrite when enabled;
- not share the IP address itself or ChatGPT account information with those
  providers for search;
- share precise/approximate device location with trusted local-information
  providers when the optional location feature is enabled; precise location is
  used for the response and then deleted, though location-revealing answer text
  remains in chat history.

For API use, OpenAI states data is not used for model training unless the
customer opts in; default abuse-monitoring logs can retain prompts, responses,
and derived metadata for up to 30 days [S10]. Responses application state is
stored for at least 30 days by default/with `store:true`; ZDR forces
`store:false`. Background operation temporarily writes response data for roughly
10 minutes [S8][S10]. Live web search is not HIPAA/BAA eligible; cache-only
Responses search can be BAA eligible only under the documented ZDR conditions
[S10]. Regional storage/processing does not automatically constrain third-party
services [S10].

**Implication:** in an owned system, query disclosure is part of the threat
model. Log the provider/crawl decision without retaining raw sensitive query
text by default; never let private retrieved data enter a public search query;
make live network access and location explicit policy, not model preference.

### 9.3 Product abuse controls

OpenAI's universal usage policies prohibit, among other classes, malicious
cyber activity, privacy compromise, safeguards circumvention, certain high-risk
advice without qualified involvement, and automated high-stakes decisions
without human review [S14]. API rate limits are organization/project scoped and
are justified partly as abuse and infrastructure controls [S12].

**UNKNOWN:** web-search-specific content filtering, malware scanning, adult
content policy, safe-search setting, source takedown SLA, spam classifier, query
abuse model, and how a refusal differs from “no results.” No public search-tool
safe-search control was found.

## 10. Limits, lifecycle, and errors

### 10.1 Documented bounds

- Up to 100 allowed or 100 blocked domains in the guide [S1].
- Search context is capped at 128k even when the model context is larger [S1].
- `search_context_size` is qualitative and does not guarantee source count or
  exact tokens [S1].
- `return_token_budget:unlimited` removes the standard returned-search-content
  cap only for supported GPT-5+ reasoning search; it does not remove model
  context limits [S1].
- Deep research can be bounded by total `max_tool_calls` in its documented
  workflow [S3].
- Responses background jobs expose queued/in-progress terminal lifecycle,
  polling, resumable streaming when created with streaming, and idempotent
  cancellation [S8].
- Web search inherits the underlying model's tiered rate limits [S1]. Limits can
  apply by requests and tokens at organization and project levels [S12].

### 10.2 Error surface

At the item level, a `web_search_call` can end `failed` [S18]. At the HTTP/API
level, generic Responses errors include malformed requests, authentication and
permission failures, unsupported region, temporary rate limit, exhausted
credits/spend/usage limits, server error, overload, and “Slow Down” [S11].
Temporary 429s may include `Retry-After`; billing/quota 429s are not retryable
until the account condition changes [S11][S12].

**Gap:** no official source inspected documents search-specific error reason
codes such as provider timeout, robots/policy exclusion, live-fetch blocked,
partial provider failure, unsafe result removal, stale-cache fallback, or
per-query no-result state. Nor does the response contract expose partial
coverage by provider or corpus.

**RECOMMENDATION:** Curiosity should use stable, redacted reason classes and
distinguish `no_match`, `policy_filtered`, `partial`, `deadline`, `budget`,
`upstream`, `stale_fallback`, and `internal`, while never returning secrets or
raw provider errors.

## 11. Economics and pricing

On 2026-08-17 OpenAI lists [S9]:

- current Web Search: **$10 per 1,000 calls**, plus search-content tokens billed
  at the selected model's token rates;
- image Web Search: the same call price and token treatment;
- preview search with reasoning models: $10/1,000 plus content tokens;
- preview search with non-reasoning models: $25/1,000, search-content tokens
  free;
- for non-preview web search on `gpt-4o-mini` and `gpt-4.1-mini`, search content
  is billed as a fixed block of 8,000 input tokens per call.

A complete task also incurs normal model input/output (and reasoning) charges.
Agentic runs can issue multiple billed search actions, so the economically
meaningful unit is not “one response”; it is:

```text
task cost = model input/output/reasoning
          + billed search actions
          + retrieved search-content tokens
          + optional other tools / background operational overhead
```

**INFERENCE (high):** `search_context_size`, `return_token_budget`, reasoning
effort, and `max_tool_calls` are economic controls as much as quality controls.
OpenAI's pricing creates a direct incentive to reduce retrieved context and
search iterations.

**Unknown:** provider costs, per-query margins, cache-hit economics, live-fetch
cost, vertical feed licensing, and cost allocation among search/open/find. The
pricing page says a search action incurs a call charge but does not make clear
whether open/find actions each create an additional billed search call in every
model path [S1][S9].

**Curiosity implication:** record marginal branch cost as owned resources—query
CPU, bytes fetched, pages rendered, index work, and model tokens—rather than a
single opaque vendor call count. Curiosity should stop when expected evidence
gain does not justify marginal cost.

## 12. Agent integration

### 12.1 OpenAI integration model

The Responses API makes hosted web search one tool among file search, remote
MCP, code interpreter, shell, computer use, and application functions [S13]. A
model may choose the tool under `auto`, a caller may require it, and output items
form a trajectory. The Agents SDK preserves those semantics while moving tool
wiring into agent definitions [S13].

For long research, OpenAI's design combines:

- optional clarification and prompt expansion;
- model-managed search/open/find;
- public web, private file search, and constrained search/fetch MCP sources;
- code execution for analysis;
- background polling/webhooks/streaming;
- citations in the final answer;
- caller-imposed total tool-call limits;
- progress and interruption in the ChatGPT product [S3][S5][S8].

### 12.2 Lessons and boundaries for Curiosity

| OpenAI lesson | Curiosity verdict | Concrete adaptation |
| --- | --- | --- |
| Search is a tool, not implicit model knowledge. | **ADOPTED** | Keep provider-neutral `web_search`; always preserve a tool trace. |
| Search/open/find are distinct actions. | **ADOPTED** | Use typed `discover`, `fetch/open`, and `find/passage` actions with separate budgets and policy. |
| Model can decide whether more search helps. | **ADAPTED** | Permit planning only inside the caller-declared frame and aggregate budget; one post-synthesis curiosity pass. |
| Full sources differ from cited sources. | **ADOPTED** | Return consulted/retrieved/selected/cited sets explicitly, with reasons for transitions. |
| Domain and live-access controls are tool parameters. | **ADOPTED** | Add allow/deny source policy and `network_mode`; enforce below the model. |
| Qualitative context and “unlimited” result budgets. | **REJECTED** | Use exact hard limits on results, bytes, passages, tokens, time, and branches. No unbounded mode. |
| URL/span citations. | **ADAPTED** | Keep answer-span UX, but cite immutable capture passage hashes. |
| Public and private retrieval in one trajectory. | **REJECTED by default** | Stage public research and private synthesis; no public egress after private context is loaded. |
| Model-owned stop decision. | **ADAPTED** | Search estimates coverage/overlap; deterministic policy enforces coverage, saturation, exhaustion, and authority stops. |
| Hosted answer-first API. | **REJECTED as core** | Owned search returns evidence; answer synthesis is a separate agent adapter. |

## 13. Inferred architecture (not disclosed internals)

The smallest architecture consistent with official facts is:

```text
ChatGPT / Responses / Agents SDK
        |
        v
model policy + query planner
  (optional / required; iterative queries)
        |
        v
hosted web-search orchestrator
  |-- third-party search provider(s)
  |-- OpenAI SearchBot-backed cache/index
  |-- live page open/find lane
  |-- publisher/merchant partner content
  `-- sports/weather/finance/local vertical feeds
        |
        v
normalization + policy + candidate/source selection
        |
        v
bounded search context supplied to model
        |
        v
answer synthesis + URL/span citation mapping
        |
        v
message + action trace + optional full URL inventory
```

Functional components such as orchestration and normalization are unavoidable
given the public contract; their technologies and deployment are unknown.

### 13.1 What cannot be inferred responsibly

- index size, sharding, storage engine, postings/vector representation;
- ranking models/features or provider fusion;
- crawler scheduling, rendering, extraction, canonicalization, or deduplication;
- exact page cache and document retention;
- citation entailment model or quality thresholds;
- per-provider identity for a returned URL;
- internal safety classifiers and manual operations;
- whether consumer and API search share every backend component.

Claims in these areas would be speculation or prohibited reverse engineering
and are intentionally excluded.

## 14. Concrete implications for `opencode2-curiosity`

### 14.1 Provider-neutral contract improvements

Retain current compatibility (`query`, bounded `maxResults`, stable
`web_search` name), then version toward:

**Request**

- `query`, locale/language, time range, exact `max_results`;
- source/domain allow/deny policy and safe-search policy;
- `network_mode = index_only | live_allowed`;
- `research_frame_id`, `branch_id`, `parent_branch_id`, intent/facet;
- hard totals for actions, results, bytes, passages/tokens, deadline, and cost;
- evidence-detail level; no credential or private content in provider query.

**Response**

- request, schema, and immutable index-snapshot IDs;
- separate action trace for `search`, `open`, and `find`;
- separate candidate/retrieved/consulted/selected/cited sets;
- document, capture, passage IDs and hash; fetched and claimed-published times;
- fetched, redirect-terminal, and publisher-canonical URLs;
- source/publisher cluster, source type, retrieval channel, and bounded rank
  reason classes;
- coverage, freshness, policy-filter, duplication, and partial-failure warnings;
- fixed `trust = untrusted_external_evidence`.

### 14.2 Curiosity loop

1. Caller supplies frame, authority, and total budget.
2. Researcher declares a bounded branch set and primary-source preference.
3. Search executes typed actions and returns evidence, not instructions.
4. Researcher synthesizes facts, inferences, unknowns, and contradictions.
5. One bounded curiosity pass scores remaining in-frame gaps by relevance,
   value, novelty, and cost.
6. Pursue only the highest-value gap within remaining authority/budget.
7. Stop on coverage, saturation, exhaustion, policy block, or duplicate evidence;
   record rejected branches as `CURIOSITY_NO_GO`.

OpenAI demonstrates that multi-query planning and progress UX are useful. It
does not demonstrate that an agent should receive autonomous authority. Keep
planning intelligence and execution authority separate.

### 14.3 Evaluation hypotheses

Test on independently authored/authorized fixtures:

- typed search/open/find versus one opaque search call;
- full source inventory versus citations only;
- immutable passage citations versus current-URL citations;
- exact versus qualitative context budgets;
- index-only versus live mode on known change events;
- explicit branch/stop policy versus free-running agentic search;
- public/private phase separation against indirect prompt injection;
- citation entailment, primary-source recall, duplicate rate, source diversity,
  freshness lag, branch marginal gain, latency, and owned resource cost.

Do not use OpenAI output as labels or training data. OpenAI may be a manually
reviewed product reference only if terms and counsel permit.

## 15. Clean-room and legal-risk boundary

| Risk | Required boundary |
| --- | --- |
| Service reverse engineering | Do not probe hidden APIs, intercept traffic, decompile clients, infer secrets through adversarial queries, bypass controls, or attempt model extraction. The business agreement explicitly restricts reverse engineering [S16]. |
| Competitive-model restriction | Do not use OpenAI Output to develop a competing AI model except where a reviewed agreement clearly permits it; do not assume the agreement's narrow exceptions cover search/ranking development [S16]. |
| Search-result/index extraction | Do not crawl or bulk extract OpenAI results, source lists, snippets, or partner feeds to seed an index; the agreement restricts extraction outside permitted service behavior [S16]. |
| Contract cloning | Public field/action concepts may inform a neutral specification, but do not copy documentation prose, branding, undocumented quirks, IDs, or UI assets. Independently author schemas and fixtures. |
| Publisher content | A citation or crawler inclusion is not a content license. Acquire and preserve rights, robots/policy decisions, takedown status, and attribution independently. |
| Bot behavior | Learn the separation of search and training crawl purposes; implement robots/publisher controls from standards and project policy, not by imitating private OpenAI behavior. |
| Patents/trade secrets | Public API behavior is not freedom-to-operate. Obtain targeted counsel before commercializing novel ranking, citation, crawl, or agent-planning methods. |
| Privacy | Never replay sensitive prompts into a hosted competitor. Use project-authored test queries and pages; minimize logs and disclose any external query transmission. |

## 16. Fact / inference / recommendation ledger

| ID | Type | Claim or decision | Evidence | Confidence / verdict |
| --- | --- | --- | --- | --- |
| L1 | FACT | Responses `web_search` is the recommended new API path; preview remains legacy. | [S1] | High |
| L2 | FACT | Search actions expose search/open/find; messages expose URL/span annotations. | [S1][S18] | High |
| L3 | FACT | Optional sources list is broader than inline citations. | [S1] | High |
| L4 | FACT | ChatGPT rewrites prompts into targeted provider queries and may iterate. | [S2] | High |
| L5 | FACT | OpenAI uses third-party providers, partner content, and its own SearchBot. | [S2][S4][S6] | High |
| L6 | FACT | Live access can be disabled in favor of cache/index-only search. | [S1] | High |
| L7 | FACT | Web search is $10/1,000 current calls plus retrieved-context token cost. | [S9] | High; price is date-sensitive |
| L8 | FACT | API content is not used for training by default; default abuse logs may persist up to 30 days. | [S10] | High |
| L9 | FACT | OpenAI documents prompt-injection/exfiltration risk across web and private connectors. | [S3] | High |
| L10 | FACT | Deep-research guide and deprecation ledger conflict on retired o3/o4 model examples. | [S3][S15] | High |
| L11 | INFERENCE | Retrieval is federated across provider, OpenAI index/cache, live fetch, and vertical/partner lanes. | L5-L6, [S1] | High |
| L12 | INFERENCE | Candidate/source selection and citation selection are separate decisions. | L3 | High |
| L13 | INFERENCE | Search is answer-generation infrastructure, not a raw ranked-results API. | [S1][S18] | High |
| L14 | INFERENCE | Live retrieval and indexed retrieval are separate functional lanes. | [S1] | Medium-high |
| L15 | UNKNOWN | Ranking algorithm, rank features, provider fusion, index scale, cache age, and crawl freshness. | Negative result | Explicitly unknown |
| L16 | RECOMMENDATION | Preserve search/open/find and complete-source concepts. | L2-L3 | **ADOPTED** |
| L17 | RECOMMENDATION | Replace URL-only citations with immutable capture/passage provenance. | Section 8 | **ADAPTED** |
| L18 | RECOMMENDATION | Keep exact hard budgets and caller authority; no unlimited/free-running mode. | Sections 5, 10, 14 | **ADOPTED** |
| L19 | RECOMMENDATION | Do not use OpenAI search, providers, outputs, or index as Curiosity's foundation. | Sections 6, 15 | **REJECTED** foundation |
| L20 | RECOMMENDATION | Stage public and private retrieval to prevent exfiltration. | [S3] | **ADOPTED** |
| L21 | RECOMMENDATION | Rich vertical feeds and UI cards should wait for an owned general evidence contract. | Sections 2, 6 | **DEFERRED** |

## 17. Gaps, unknowns, and negative results

- No official evidence was found for corpus size, coverage by country/language,
  cache TTL, crawl frequency, rendering rate, or index freshness SLA.
- No official ranking formula, score, feature list, fusion method, diversity
  objective, or independent quality benchmark was found.
- No stable text-result top-k/pagination/raw-passage contract was found in the
  current web-search guide; image results are materially more explicit.
- No result-level provider lineage, crawl timestamp, document version, content
  hash, passage anchor, or index snapshot was found.
- No search-specific partial-failure taxonomy, safe-search parameter, malware
  signal, or source-policy warning was found.
- No evidence supports treating `OAI-SearchBot` as the sole or comprehensive
  index. Official text directly establishes third-party and partner retrieval.
- No paid or authenticated behavior was measured, so comparative relevance,
  latency, citation correctness, and freshness claims are intentionally absent.
- Web search discovery calls in the research environment returned HTTP 429 for
  several attempted official-site queries. Direct official URLs and their
  documentation indexes were used instead; the negative discovery result did
  not become evidence about OpenAI product behavior.
- The deep-research guide's retired model examples remain live despite the
  deprecation ledger. This is a documentation lifecycle risk, not proof that
  the retired aliases still work.

## 18. Bounded curiosity pass

Scores are 1 (low) to 5 (high); cost is 1 (cheap) to 5 (expensive).

| Thread | Rel. | Value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Resolve current deep-research status against deprecations | 5 | 5 | 4 | 1 | **Pursued:** found and retained the official contradiction [S1][S3][S15]. |
| Determine whether OpenAI owns retrieval/index | 5 | 5 | 4 | 1 | **Pursued:** triangulated provider, partner, SearchBot, live/cache, and pricing evidence [S1][S2][S4][S6][S9]. |
| Verify query-sharing/privacy boundary | 5 | 5 | 3 | 1 | **Pursued:** official help distinguishes rewritten query/general location from IP/account disclosure [S2]. |
| Reverse engineer ranking through adversarial queries | 1 | 2 | 4 | 5 | `CURIOSITY_NO_GO`: prohibited, unnecessary, and outside clean-room authority. |
| Run paid comparative query suite | 3 | 4 | 3 | 5 | `CURIOSITY_NO_GO`: no credentials/paid-test authority or approved fixture set. |
| Scrape source inventories at scale | 1 | 2 | 3 | 5 | `CURIOSITY_NO_GO`: extraction/ToS and contamination risk; not needed for architecture. |
| Identify every partner/provider by traffic inspection | 2 | 2 | 3 | 5 | `CURIOSITY_NO_GO`: hidden-system probing is out of bounds; named official evidence is sufficient. |
| Patent/FTO search for every inferred component | 3 | 4 | 3 | 5 | `CURIOSITY_NO_GO`: requires counsel and a narrowed implementation design. |
| Measure current citation drift and cache age | 4 | 4 | 4 | 4 | **DEFERRED:** valuable later with authorized, independently authored pages and a predeclared protocol. |

**Stop:** requested categories are covered; material conclusions triangulate to
official sources; further work would require paid access, live probing, legal
review, or an approved benchmark. Coverage and authority limits reached.

## 19. Reproducible evidence procedure

These read-only commands retrieve the principal official pages without
credentials. They do not reproduce historical page state; re-run dates and
content hashes should be recorded because OpenAI documentation changes.

```bash
set -eu
urls=(
  'https://developers.openai.com/api/docs/guides/tools-web-search.md'
  'https://developers.openai.com/api/reference/resources/responses/methods/create.md'
  'https://help.openai.com/en/articles/9237897-chatgpt-search'
  'https://openai.com/index/introducing-chatgpt-search/'
  'https://platform.openai.com/docs/bots'
  'https://openai.com/searchbot.json'
  'https://developers.openai.com/api/docs/pricing.md'
  'https://developers.openai.com/api/docs/guides/your-data.md'
  'https://developers.openai.com/api/docs/deprecations.md'
  'https://openai.com/policies/services-agreement/'
)
for url in "${urls[@]}"; do
  printf '\n===== %s =====\n' "$url"
  curl --fail --location --silent --show-error "$url" | shasum -a 256
done
```

Reproduction checks:

1. On the web-search guide, locate `web_search`, `search`, `open_page`,
   `find_in_page`, `sources`, `external_web_access`, `return_token_budget`,
   `allowed_domains`, `blocked_domains`, and the 128k limitation.
2. On ChatGPT Search help, locate query rewriting, Bing/Shopify, location
   sharing, Memory, citations/Sources, plans, and ranking/SearchBot text.
3. On crawler docs, verify independent controls for OAI-SearchBot, GPTBot, and
   ChatGPT-User and the approximately 24-hour robots update statement.
4. Compare the deep-research guide's o3/o4 examples with the deprecation page's
   2026-07-23 shutdown rows.
5. On pricing, locate the Tools table and search-content-token explanation.
6. On data controls, locate abuse retention, Responses state, Web Search
   HIPAA/BAA note, ZDR, background storage, and third-party residency limits.

## 20. Source table

All sources accessed 2026-08-17. OpenAI sources are primary for offered
features and policies, but cannot prove comparative quality.

| ID | Official source | Material supported |
| --- | --- | --- |
| [S1] | OpenAI, **Web search guide**, https://developers.openai.com/api/docs/guides/tools-web-search | Current integration paths; three search modes; request controls; actions; sources; citations; image results; live/cache; limits; pricing link. |
| [S2] | OpenAI Help, **ChatGPT Search**, https://help.openai.com/en/articles/9237897-chatgpt-search | Availability/UI; automatic/manual search; rewritten queries; Bing/Shopify; location/Memory privacy; citations; ranking statement; rich local/restaurant behavior. |
| [S3] | OpenAI, **Deep research API guide**, https://developers.openai.com/api/docs/guides/deep-research | Historical deep-research contract; trajectory; max tool calls; clarification/rewrite architecture; MCP search/fetch; prompt-injection and exfiltration mitigations. Status examples conflict with S15. |
| [S4] | OpenAI, **Introducing ChatGPT search**, https://openai.com/index/introducing-chatgpt-search/ | Product evolution; conversational search; publisher/partner data; third-party providers; citations/source sidebar. |
| [S5] | OpenAI, **Introducing deep research**, https://openai.com/index/introducing-deep-research/ | Agentic research behavior and limits; February 2026 trusted sites, MCP/apps, progress, interruption/refinement update. |
| [S6] | OpenAI, **Overview of OpenAI Crawlers**, https://platform.openai.com/docs/bots | Search/training/user-agent separation; SearchBot inclusion/opt-out; user agents; robots propagation; published IPs. |
| [S7] | OpenAI, **SearchBot IP manifest**, https://openai.com/searchbot.json | Observable first-party crawler network manifest and creation timestamp. |
| [S8] | OpenAI, **Background mode**, https://developers.openai.com/api/docs/guides/background | Async lifecycle, polling, cancellation, streaming, and temporary storage behavior. |
| [S9] | OpenAI, **API pricing**, https://developers.openai.com/api/docs/pricing | Search call price, search-content-token billing, fixed token block exceptions, model token economics. |
| [S10] | OpenAI, **Data controls in the OpenAI platform**, https://developers.openai.com/api/docs/guides/your-data | Training default, abuse/application retention, ZDR/MAM, background storage, Web Search HIPAA/BAA boundary, residency limitations. |
| [S11] | OpenAI, **Error codes**, https://developers.openai.com/api/docs/guides/error-codes | Generic API error classes and retry/non-retry distinctions. |
| [S12] | OpenAI, **Rate limits**, https://developers.openai.com/api/docs/guides/rate-limits | Organization/project limits, RPM/TPM families, headers, Retry-After, backoff, abuse rationale. |
| [S13] | OpenAI, **Using tools**, https://developers.openai.com/api/docs/guides/tools | Hosted-tool/Responses/Agents SDK integration and tool-choice model. |
| [S14] | OpenAI, **Usage policies**, https://openai.com/policies/usage-policies/ | Product-wide prohibited-use and human-review boundaries. |
| [S15] | OpenAI, **Deprecations**, https://developers.openai.com/api/docs/deprecations | Preview search and o3/o4 deep-research shutdown dates; model lifecycle policy. |
| [S16] | OpenAI, **Services Agreement**, https://openai.com/policies/services-agreement/ | Reverse-engineering, extraction, circumvention, competing-model, third-party-service, output, and customer-responsibility terms. |
| [S17] | OpenAI, **SearchGPT Prototype**, https://openai.com/index/searchgpt-prototype/ | Prototype UX, inline attribution, source sidebar, and separation of search inclusion from training. |
| [S18] | OpenAI, **Responses API create reference**, https://developers.openai.com/api/reference/resources/responses/methods/create | Authoritative output unions; search/open/find fields and statuses; citation object; include fields; captured schema mismatch with blocked domains. |
| [S19] | OpenAI Status, https://status.openai.com/ | Aggregate API/ChatGPT status only; explicitly not feature/customer-specific availability. |

### Overall confidence

- **High:** public product/API contract, query-sharing statements, multi-source
  retrieval evidence, pricing, crawler-purpose separation, and provenance gaps.
- **Medium:** functional architecture inferences and precise current
  deep-research model path because official current pages conflict.
- **Low/unknown:** retrieval/ranking internals, corpus coverage, freshness,
  extraction implementation, provider fusion, and comparative quality.
