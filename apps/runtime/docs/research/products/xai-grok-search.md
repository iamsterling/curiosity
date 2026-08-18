# xAI/Grok web and X search tooling (2026)

**Research date:** 2026-08-17  
**Decision frame:** What can Curiosity safely learn from, and eventually map to, xAI's current web and X search interfaces without confusing a model-driven answer API with a raw search-results API?  
**Scope:** Official public xAI/SpaceXAI and X documentation only; no account, credential, paid request, traffic interception, UI automation, or access-control bypass. This is a clean-room contract study, not an implementation specification.  
**Overall confidence:** **High** for the documented API contract and prices; **medium** for internal architecture inferences; **low/unknown** for ranking, index composition, consumer-app mode parity, and runtime behavior not testable without a paid request.

> Terminology note: current official pages use both **xAI** and **SpaceXAI**. This report says “xAI” for the API/product family and preserves “SpaceXAI” where it appears in current legal material. “Web Search” and “X Search” mean the dedicated server-side API tools, not X's ordinary site search.

## Executive verdict

xAI exposes two distinct, model-orchestrated, server-side retrieval tools on its Responses-compatible API: `web_search` searches and browses the public web, while `x_search` searches X posts/users and fetches threads. The model chooses queries and iterates; xAI executes tools and returns a synthesized answer, source URLs, tool-call metadata, and usage—but **not the retrieved tool outputs**. This is therefore an **agentic grounded-answer contract**, not a conventional search contract returning ranked hits and snippets. [S1][S2][S3][S5]

The strongest lessons for Curiosity are to **adopt** explicit web/social source separation and attempted-versus-successful telemetry; **adapt** xAI's two-layer citation model into a stronger source/claim ledger; and **reject** hidden retrieval outputs, provider-controlled unbounded work, and citations-as-proof. An xAI adapter should remain **deferred** until authorized paid conformance checks resolve date-filter precedence, actual response shapes, source coverage, and budget behavior.

## Bounded sub-questions

1. What product is currently supported, and what is merely historical or consumer UI?
2. Where are the web and X source boundaries?
3. Which controls are caller-specified versus model-decided?
4. What temporal, trace, citation, cost, privacy, and safety evidence is exposed?
5. What architecture can be inferred without claiming undisclosed internals?
6. Which ideas should Curiosity adopt, adapt, reject, or defer?

## 1. Product and status

### Facts

- **[FACT, high]** xAI released “Live Search” on the API in May 2025, then marked the dedicated `web_search`, `x_search`, and `code_execution` agent tools generally available in October 2025. The November 2025 notes say agent tools were adapted to Grok 4.1 Fast and successful-call prices dropped to no more than $5/1,000. [S8]
- **[FACT, high]** As of the research date, official examples use `grok-4.6` through `POST /v1/responses`; its model page lists Web Search and X Search as supported tools. Grok 4.6 has a 500,000-token context and a 2026-02-01 knowledge cutoff. xAI explicitly says realtime events require search tools. [S9][S10]
- **[FACT, high]** The tools are xAI-managed “built-in tools.” The documented loop is: model analyzes the request, chooses a tool or final answer, xAI executes built-ins, the model processes results, and the API returns a final response with citations where applicable. [S3]
- **[FACT, high]** Consumer Grok on X is a different surface. X says Grok can decide whether to search public X posts and conduct realtime web search. It also warns that Grok may confidently be wrong, missummarize, or miss context. [S13]
- **[FACT, medium]** The current official developer documentation does not define “DeepSearch” or “DeeperSearch” as a stable API tool or contract. Searches of official product/help/developer sources in this bounded pass produced no current primary contract for such a mode.

### Interpretation

- **[INFERENCE, high]** The October 2025 agent tools supersede “Live Search” as the recommended developer abstraction: current guides consistently use explicit tool objects, while the REST schema still retains `search_parameters` fields associated with live search. This looks like compatibility/migration residue, not proof that the old and new controls are identical. [S1][S2][S8][S17]
- **[INFERENCE, high]** API capability must not be inferred from grok.com or X UI labels. Consumer modes can select search automatically, apply personalization, or change without preserving API-level controls.

### Product verdict

**ADOPTED:** Treat the dedicated tools and Responses API as the current product contract.  
**REJECTED:** Treating a consumer “research” mode, old “Live Search” branding, or UI behavior as an API guarantee.  
**UNKNOWN/CHECK:** Whether xAI plans to deprecate `search_parameters`, and whether every currently listed model behaves identically with both control families.

## 2. Web and social source boundaries

| Surface | Documented reach | Caller filters | Not documented / boundary |
|---|---|---|---|
| Web Search | Realtime internet search, page access/browsing, extraction from web pages; optional image search and image inspection. | Allow **or** exclude up to five domains; options for image search and image understanding. | Index provider, crawl coverage, freshness SLA, robots/paywall behavior, locale/location control, raw rank/score/snippet output, and a web date filter in the dedicated tool guide. [S1] |
| X Search | Keyword search, semantic search, user search, and thread fetch over X; optional image/video understanding. | Allow **or** exclude up to 20 handles; inclusive `from_date`/`to_date`; image/video understanding. | Visibility rules beyond public-content statements, sampling/ranking, completeness, deleted-post behavior, engagement filters, language/geo filters, result count, or access to private/protected content. [S2][S13] |

### Facts and boundary findings

- **[FACT, high]** `allowed_domains` and `excluded_domains` are mutually exclusive and each has a maximum of five domains. [S1]
- **[FACT, high]** `allowed_x_handles` and `excluded_x_handles` are mutually exclusive and each has a maximum of 20 handles. [S2]
- **[FACT, high]** X says Grok's realtime X access is to **public** posts. It says protected posts are not surfaced in response to user queries. Public X data can include posts, post metadata such as engagement/reposts, public Spaces, and public profile data, but that privacy page does not guarantee all of these are queryable through the developer `x_search` tool. [S13]
- **[FACT, high]** Tool telemetry reveals finer internal operations: web search/browse function names include `web_search`, `web_search_with_snippets`, `browse_page`, `open_page`, and `open_page_with_find`; X operations include `x_user_search`, `x_keyword_search`, `x_semantic_search`, and `x_thread_fetch`. [S5]
- **[FACT, high]** Enabling Web Search image understanding also enables image understanding for X Search when both tools are included. Video understanding is X-only. Image search is part of Web Search and returned images can enter model context and appear as Markdown embeds. [S1][S2][S4]

### Inferences

- **[INFERENCE, high]** Web retrieval is at least a two-stage family—discovery plus page open/find—rather than one opaque query call. X exposes a purpose-built social retrieval plane with entity/user, lexical, semantic, and conversation/thread primitives. [S5]
- **[INFERENCE, medium]** xAI can exploit first-party X structure that a generic web crawler cannot, but the docs do not establish exhaustive firehose access or unbiased sampling. “Vast data” and “realtime” are marketing-level scope claims, not recall guarantees. [S2]
- **[INFERENCE, high]** Social evidence should remain a distinct evidence class. A post can be timely and attributable without being authoritative or representative.

## 3. Contract and tool controls

### Current dedicated-tool contract

The caller supplies model, input, enabled tools, per-tool filters, and optional loop/output controls. The model chooses whether, how, and how often to invoke enabled tools. xAI executes those tools server-side. [S3][S5]

| Control | Contract behavior | Curiosity concern |
|---|---|---|
| `tools` | Enables `web_search`, `x_search`, or both. | Capability permission is not an execution plan. |
| `tool_choice` | Responses schema exposes a tool-choice control, but dedicated guides show the default autonomous pattern. [S17] | Exact forcing semantics for these built-ins were not documented in the reviewed guide. |
| `parallel_tool_calls` | Allows parallel calls; one model turn may issue multiple calls. [S5][S17] | Parallelism can defeat a naïve “turns = calls = cost” budget. |
| `max_turns` | Caps assistant/tool-call loop turns, **not individual calls**. A turn can run tools in parallel. Unset uses an undisclosed global cap. [S5] | Useful but insufficient as a hard provider-call budget. |
| domain/handle filters | Restrict or exclude narrow source sets, with mutual exclusion and small list caps. [S1][S2] | Must validate before dispatch and record effective policy. |
| media flags | Permit search/inspection of images and X videos. [S1][S2] | Expands cost and untrusted multimodal input surface. |
| `store`, `previous_response_id` | Can persist and continue the complete agentic state. [S6][S17] | Persistence policy must be explicit, not inherited silently. |
| encrypted state | Can return encrypted reasoning/tool outputs for client-carried continuation, including under ZDR. [S6][S12] | Opaque continuity is not inspectable evidence. |

### Legacy/compatibility control tension

- **[FACT, high]** The current REST reference still documents global `search_parameters` on Chat Completions and Responses: `mode` (`off`, `on`, `auto`), `sources`, `from_date`, `to_date`, `max_search_results`, and `return_citations`. It says unspecified sources default to web and X. It also documents `web_search_options` as compatibility fields. [S17]
- **[FACT, high]** The dedicated 2026 Web/X guides do **not** describe `search_parameters`; they use explicit tools and different filter shapes. [S1][S2]
- **[UNKNOWN, material]** Precedence and validation when `search_parameters` and dedicated tools coexist; whether date bounds under `search_parameters` still constrain both source types; source object schemas; and whether `max_search_results` limits candidates, consumed sources, or final citations.

**Recommendation:** Use one contract family per adapter path. Do not merge old global live-search settings with dedicated tool settings until an authorized conformance test and current schema inspection prove precedence.

## 4. Temporal search

- **[FACT, high]** X Search accepts `from_date` and `to_date` in ISO-8601 `YYYY-MM-DD`; both endpoints are inclusive. The Python SDK also accepts `datetime.datetime`. [S2]
- **[FACT, high]** The dedicated Web Search guide has no publication-date parameter. “Realtime” means it can search/browse current web content, not that a caller can enforce a publication interval. [S1]
- **[FACT, high]** The generic REST `search_parameters` schema does expose date bounds, but its relationship to current dedicated tools is unresolved. [S17]
- **[INFERENCE, high]** X has a first-class temporal predicate; modern Web Search mainly has freshness through live retrieval and natural-language query formulation. Neither contract promises valid publication-date extraction, event-time semantics, timezone interpretation, or historical completeness.

**Curiosity implication:** Represent temporal intent as structured event/publication/retrieval time in the provider-neutral layer. Map only the supported subset: exact inclusive day bounds for X; query-level hints for current Web Search unless the legacy path is separately validated. Always retain retrieval time independently of source publication time.

## 5. Citations and provenance

### What is exposed

- **[FACT, high]** The response-level `citations` list is returned by default and contains URLs from all successful tool executions encountered during search, including sources not referenced in the final answer. [S4]
- **[FACT, high]** Inline citations are Markdown links in the form `[[N]](url)`. They are enabled by default in the Responses API and opt-in in the xAI Python SDK. Enabling them does not guarantee a citation on every answer. [S4]
- **[FACT, high]** Structured annotations provide URL, start/end character offsets, and display label. The xAI SDK distinguishes `web_citation` and `x_citation`. [S4]
- **[FACT, high]** Image-search results may appear as Markdown image embeds rather than numbered text citations. [S4]
- **[FACT, high]** Citations stream with text, but the complete list and accumulated structured data are available at completion. [S4]

### What is not exposed

- No raw retrieved document/post payloads, snippets, ranks, retrieval scores, query-to-result edges, content hashes, fetch timestamps, publication timestamps, or provider index identifiers are promised. Server-side tool outputs are explicitly withheld. [S5]
- A response-level citation means “encountered in a successful tool execution,” not “supports this claim.” Even inline placement is model-generated and optional. [S4]
- URLs alone do not preserve mutable content, deleted posts, redirects, or the exact excerpt seen by the model.

### Assessment

- **[INFERENCE, high]** xAI offers useful **source discovery provenance**, but only partial **claim provenance** and almost no **retrieval reproducibility**.
- **[RECOMMENDATION, high]** Curiosity should preserve separate ledgers for (a) attempted calls, (b) successful calls, (c) encountered sources, and (d) claim-linked citations. Never collapse response citations into “sources supporting the answer.”
- **[RECOMMENDATION, high]** Treat citation URLs and Markdown as untrusted external data; normalize schemes/hosts, escape rendering, and apply link/media policy before display.

## 6. Query traces, observability, and model/retrieval separation

### Trace facts

- **[FACT, high]** The xAI SDK can stream every attempted server-side tool invocation, including function name and arguments. Final `response.tool_calls` includes attempted calls, including failures. [S5]
- **[FACT, high]** `server_side_tool_usage` records successful, billable executions by category. Failures due to invalid arguments, missing/deleted content, or service/network errors may appear only among attempted calls. [S5]
- **[FACT, high]** Responses API output contains typed items such as `web_search_call` and `x_search_call`; these expose type-specific action metadata rather than client-function-style name/arguments. [S5][S6]
- **[FACT, high]** Server-side tool outputs are not returned. The model sees them internally. Encrypted tool outputs can be carried to later turns but remain opaque to the client. [S5][S6]
- **[FACT, high]** Usage includes source count, successful tool counts/details, reasoning, input/output/cache tokens, and exact billed cost. [S7][S17]

### Separation assessment

```text
caller policy/configuration
        |
        v
Grok planner/reasoner  -- chooses queries and tool sequence
        |
        +--> xAI Web retrieval: search -> snippets/pages/find/images
        |
        +--> xAI X retrieval: user/keyword/semantic/thread/media
        |
        v
hidden tool results enter model context
        |
        v
Grok synthesis -> answer + inline annotations + URL set + usage/trace metadata
```

- **[INFERENCE, high]** Retrieval execution is operationally separate from the model (distinct tool types, calls, usage, and prices), but planning, stopping, source selection, and synthesis remain model-coupled. This is not a separately callable ranked retrieval API. [S3][S5][S11]
- **[INFERENCE, high]** The trace is an execution audit, not a full research transcript: one can inspect what was attempted and billed, but not the evidence payloads that drove synthesis.
- **[UNKNOWN]** Search backend vendors, index ownership outside X, ranking features, deduplication, cache policy, prompt-injection defenses, and whether model/tool versions can be independently pinned.

## 7. Limits, pricing, and bounded behavior

- **[FACT, high]** Web Search and X Search each cost **$5 per 1,000 successful calls** ($0.005 per successful call), in addition to model token charges. Failed attempts are not billed as successful tool executions. [S5][S11]
- **[FACT, high]** Grok 4.6 standard pricing below 200k prompt tokens is $2/M input, $0.50/M cached input, and $6/M output; at or above 200k prompt tokens the listed rates double to $4/$1/$12 for all tokens in the request. [S9][S11]
- **[FACT, high]** Agentic prompt-token accounting is cumulative across internal inference steps; reasoning and growing history add cost, while prompt caching can reduce billed input cost. [S5]
- **[FACT, high]** `cost_in_usd_ticks` reports the exact request charge inclusive of token and server-side tool costs (10^10 ticks = USD 1). `server_side_tool_usage`/details expose call counts. [S7]
- **[FACT, high]** Model rate limits are per-model RPS and TPM, tiered by cumulative API spend; 429 is the documented over-limit response. The public rate-limit page does not specify a separate search-call quota. [S10]
- **[FACT, high]** Availability can vary by geography and account limitations. [S11]
- **[FACT, high]** Filter caps are five web domains and 20 X handles. The default global `max_turns` cap is undisclosed; `max_turns` does not cap parallel calls. [S1][S2][S5]
- **[UNKNOWN, material]** Maximum results per dedicated call, maximum browse depth/page bytes, latency SLA, timeouts, maximum successful calls per request, and the hard global turn cap.

**Boundedness verdict:** **ADAPTED, not adopted as-is.** Curiosity needs its own deadline, total-call cap, per-tool cap, maximum source/byte budget, cancellation, and spend ceiling. Provider `max_turns` is only a secondary guard.

## 8. Safety and privacy

### API/business surface

- **[FACT, high]** xAI says it does not train on API inputs/outputs without explicit permission. Default API requests and responses are encrypted at rest, retained for 30 days for abuse/misuse auditing, and then deleted. [S12]
- **[FACT, high]** Team-wide Zero Data Retention (ZDR), where available, prevents prompt/output persistence but disables stored-state features including stateful Responses, Files/Collections, Batch, deferred completions, and stored media. Each API response reports ZDR state through `x-zero-data-retention`. [S12]
- **[FACT, high]** Encrypted client-carried agent state is the documented path for continuing server-side tool conversations without persistent server history. [S6][S12]
- **[FACT, high]** Current enterprise terms state that business users are governed by enterprise terms and a DPA for personal data; current terms also describe default deletion no later than 30 days subject to stated exceptions and special ZDR handling. Legal terms can change and require counsel review. [S16]
- **[FACT, high]** The request schema accepts a caller-supplied `user` identifier to assist abuse detection, while Responses can expose a `safety_identifier`; pricing states that pre-generation Responses requests blocked for usage-guideline violations may incur a $0.05 fee. [S11][S17]
- **[FACT, high]** The current AUP applies to consumers, developers, and businesses; violations can lead to suspension or termination. [S15]

### Consumer Grok/X surface

- **[FACT, high]** X may share public X data and Grok interactions, inputs, and results with xAI for training/fine-tuning and personalization. Users can opt out of those uses, make posts private, and request deletion of Grok conversation history; X says deletion occurs within 30 days subject to security/legal retention. Feedback-submitted conversations may still be used. [S13]
- **[FACT, high]** X advises users not to submit personal, sensitive, or confidential information to Grok. [S13]

### Safety implications

- **[INFERENCE, high]** API and consumer privacy promises differ materially. A Curiosity adapter must bind to API/enterprise terms and must not inherit consumer-Grok assumptions.
- **[RECOMMENDATION, high]** Treat browsed pages, X posts, image alt text, images, videos, and citations as adversarial input. Keep retrieved text out of privileged instructions; label source origin; constrain rendering and downstream tool use.
- **[UNKNOWN]** The public docs reviewed do not specify search-specific malware scanning, prompt-injection isolation, harmful-source ranking, or source-level moderation semantics.

## 9. Clean-room architecture inferences

These are bounded deductions from public interfaces, not claims about proprietary code.

1. **[INFERENCE, high] Planner/executor loop.** Distinct attempted calls, successful usage, hidden results, and repeated reasoning turns imply a server-side agent loop with model planning and managed executors. [S3][S5]
2. **[INFERENCE, high] Separate retrieval adapters.** Different parameters and primitive names imply separate web and X adapters under a common orchestration envelope. [S1][S2][S5]
3. **[INFERENCE, medium] Web discovery/browse pipeline.** Search/snippet calls followed by open/browse/find calls imply candidate discovery followed by selective content acquisition. This does not reveal the underlying search index. [S5]
4. **[INFERENCE, medium] X structured retrieval.** User, lexical, semantic, and thread operations likely route to specialized X indexes/services rather than generic web search. No completeness claim follows. [S5]
5. **[INFERENCE, high] Evidence accumulator.** “All citations” from successful executions, including unused URLs, implies URL collection occurs across the trajectory before/alongside synthesis. [S4]
6. **[INFERENCE, high] Opaque context boundary.** Withholding tool outputs while allowing encrypted continuation creates an intentional boundary: customers can continue a trajectory without receiving the evidence payload verbatim. [S5][S6]
7. **[INFERENCE, medium] Billing boundary follows successful executor work.** Attempt/success separation and per-tool counts suggest billing is attached after meaningful executor completion, not model intent. [S5][S7]

**License/access boundary:** No xAI implementation artifacts were copied or inspected. Public API examples are used only to describe interoperability. The service contract and outputs remain subject to xAI terms; X content remains third-party/untrusted data with its own rights and privacy constraints.

## 10. Curiosity lessons and decision ledger

| Verdict | Lesson | Rationale / required adaptation |
|---|---|---|
| **ADOPTED** | Separate `web` and `social` source classes. | Their filters, temporal semantics, media, and evidence quality differ materially. |
| **ADOPTED** | Record attempted and successful tool activity separately. | Necessary for failure diagnosis, cost reconciliation, and honest audit. |
| **ADOPTED** | Keep all encountered sources distinct from claim-linked sources. | xAI's own citation contract demonstrates why these sets differ. |
| **ADAPTED** | Support provider-native domain/handle filters behind provider-neutral policy. | Validate mutual exclusion/caps; report lossy mapping and effective policy. |
| **ADAPTED** | Use inline offset annotations as hints for claim linkage. | Verify offsets and URL policy; do not infer entailment from placement. |
| **ADAPTED** | Preserve tool action/query trace where available. | Redact secrets/PII, bound retention, and mark missing outputs explicitly. |
| **ADAPTED** | Expose exact provider cost and usage alongside local budgets. | Provider cost is retrospective; Curiosity still needs prospective hard limits. |
| **REJECTED** | A synthesized answer as the provider-neutral “search result.” | It hides ranked items and couples retrieval to one model's synthesis. |
| **REJECTED** | URLs/citations as sufficient provenance or correctness proof. | No excerpt/hash/rank/fetch time; encountered sources may be unused. |
| **REJECTED** | Provider-global default loop caps as safe bounded behavior. | Cap is undisclosed and a turn can issue parallel calls. |
| **REJECTED** | Blending web facts and X sentiment into one undifferentiated corpus. | Authority, representativeness, and temporal behavior differ. |
| **DEFERRED** | Production xAI adapter. | Requires authorized paid conformance tests, legal review, operational limits, and an ADR. |
| **DEFERRED** | Mapping legacy `search_parameters`. | Precedence and future support are unresolved. |

### Minimum adapter checks before reconsidering “deferred”

1. Confirm exact request/response JSON for web-only, X-only, and combined calls through the chosen SDK/API version.
2. Test `max_turns=1` with parallel calls disabled/enabled; reconcile attempted calls, successful calls, source count, and exact cost.
3. Verify allow/exclude filter rejection, normalization, subdomain behavior, redirects, and empty-result behavior.
4. Verify inclusive X date boundaries around UTC/day edges; determine behavior when only one date is supplied.
5. Establish whether global `search_parameters` is accepted with dedicated tools and document precedence—or prohibit the combination.
6. Verify citation annotations against Unicode text offsets, duplicate URLs, redirects, X post URLs, image embeds, and uncited claims.
7. Measure latency and cancellation; enforce Curiosity deadlines independently.
8. Confirm ZDR response header and tool availability under the intended enterprise agreement.
9. Run adversarial pages/posts containing prompt injection and malicious Markdown/URLs; confirm Curiosity-side isolation.
10. Pin model/API version where reproducibility matters; record `system_fingerprint` if returned, while recognizing it is not a retrieval-index version. [S17]

## 11. Unknowns and contradictions retained

| Item | Status | Confidence / next check |
|---|---|---|
| Dedicated tools vs `search_parameters` | Current guides and REST schema expose two overlapping control families. | **Material unknown.** Paid schema/conformance check; ask xAI support. |
| Web date filtering | Absent in dedicated guide; present globally in REST schema. | **Unknown.** Do not promise until tested. |
| `max_search_results` meaning | Named in REST schema, absent in dedicated tool guide. | **Unknown.** Candidate/result/source semantics need testing. |
| Tool forcing | `tool_choice` exists, but reviewed built-in guides show autonomous use. | **Unknown.** Verify built-in force/none behavior. |
| Hard call ceiling | `max_turns` is not a call cap; response schema names `max_tool_calls`, request docs do not clearly offer it. | **Unknown/high risk.** Enforce caller deadline/budget externally. |
| Search result payload | Explicitly withheld. | **Known negative.** Cannot reconstruct a faithful ranked-result contract. |
| Ranking/index/freshness | Not disclosed. | **Known unknown.** No architectural claim. |
| DeepSearch API parity | No current official API contract found. | **Known negative in bounded search.** Treat UI mode as out of scope. |
| Status snapshot | `status.x.ai` is linked by docs but returned access-denied to this unauthenticated fetch. | **Unknown for 2026-08-17 uptime.** No outage/availability claim made. |
| Legal/privacy page fetches | x.ai legal pages returned 403 to direct fetch; official search-index excerpts and API security docs were available. | **Limitation.** Counsel should retrieve canonical terms interactively before adoption. |

## 12. Bounded curiosity pass

Scoring: 1–5 each for **relevance**, **decision value**, **novelty**; **cost** 1 (cheap)–5 (expensive). Pursue only high `(relevance + value + novelty - cost)` within the declared no-credential budget.

| Thread | R | V | N | Cost | Decision |
|---|---:|---:|---:|---:|---|
| Current trace semantics and hidden outputs | 5 | 5 | 4 | 1 | **Pursued** via Tool Usage Details and Advanced Usage; resolved enough for decision. |
| Legacy/current control contradiction | 5 | 5 | 4 | 2 | **Pursued** via live REST reference; contradiction retained, not guessed away. |
| Privacy/ZDR differences | 5 | 5 | 3 | 1 | **Pursued** via API Security, X Help, and current terms excerpts. |
| Underlying web index/vendor | 3 | 2 | 4 | 5 | **CURIOSITY_NO_GO:** undisclosed, speculative, and unnecessary for the contract decision. |
| Consumer DeepSearch UI internals | 2 | 2 | 3 | 4 | **CURIOSITY_NO_GO:** no stable primary API contract; UI reverse engineering prohibited/out of frame. |
| Paid runtime probes | 5 | 5 | 5 | 5 | **CURIOSITY_NO_GO:** caller explicitly prohibited paid tests/credentials. Deferred checks listed instead. |
| X private/deleted-content edge cases | 4 | 4 | 3 | 5 | **CURIOSITY_NO_GO:** would require authenticated/live tests and could cross privacy/access boundaries. |
| Third-party SDK behavior | 2 | 2 | 2 | 2 | **CURIOSITY_NO_GO:** primary official contract was sufficient; integration quirks belong to a later adapter study. |

**Stop condition:** Coverage achieved for every requested dimension; further official searches were saturating around the same guides, while remaining material questions require credentials, support confirmation, or legal access outside this frame.

## Primary official sources

All sources accessed **2026-08-17**.

- **[S1]** xAI Docs, [Web Search](https://docs.x.ai/developers/tools/web-search).
- **[S2]** xAI Docs, [X Search](https://docs.x.ai/developers/tools/x-search).
- **[S3]** xAI Docs, [Tools Overview](https://docs.x.ai/developers/tools/overview).
- **[S4]** xAI Docs, [Citations](https://docs.x.ai/developers/tools/citations).
- **[S5]** xAI Docs, [Tool Usage Details](https://docs.x.ai/developers/tools/tool-usage-details).
- **[S6]** xAI Docs, [Advanced Tool Usage](https://docs.x.ai/developers/tools/advanced-usage).
- **[S7]** xAI Docs, [Cost Tracking](https://docs.x.ai/developers/cost-tracking).
- **[S8]** xAI Docs, [Release Notes](https://docs.x.ai/developers/release-notes).
- **[S9]** xAI Docs, [Models](https://docs.x.ai/developers/models) and [Grok 4.6](https://docs.x.ai/developers/grok-4-6).
- **[S10]** xAI Docs, [Rate Limits](https://docs.x.ai/developers/rate-limits).
- **[S11]** xAI Docs, [Pricing](https://docs.x.ai/developers/pricing).
- **[S12]** xAI Docs, [FAQ — Security](https://docs.x.ai/developers/faq/security).
- **[S13]** X Help Center, [About Grok](https://help.x.com/en/using-x/about-grok).
- **[S14]** xAI Docs, [WebSocket Mode](https://docs.x.ai/developers/advanced-api-usage/websocket-mode).
- **[S15]** SpaceXAI, [Acceptable Use Policy](https://x.ai/legal/acceptable-use-policy) (official indexed page; effective 2026-08-14).
- **[S16]** SpaceXAI, [Terms of Service — Enterprise](https://x.ai/legal/terms-of-service-enterprise) (official indexed page; last updated 2026-08-14).
- **[S17]** xAI Docs, [Inference API: Chat and Responses reference](https://docs.x.ai/developers/rest-api-reference/inference/chat).
