# Retired Bing Web Search API: clean-room design lessons

**Research date / source access date:** 2026-08-17  
**Product studied:** Bing Web Search API v7 (retired 2025-08-11)  
**Scope:** Published Microsoft contracts and notices only. No endpoint probing, credentials, bypass, copied implementation, or non-public material was used.

## Decision frame

**Decision:** Which ideas from the retired Bing Web Search API should Curiosity adopt, adapt, reject, or defer while designing an owned public-web retrieval system?

Bounded sub-questions:

1. What request, response, ranking, paging, safety, freshness, error, quota, and pricing conventions were publicly documented?
2. Where did the API stop at retrieval, and where did Microsoft's successor move into answer generation?
3. Which conventions are durable provider-neutral lessons, and which were Bing-specific policy or presentation coupling?
4. What does the retirement reveal about dependency and migration risk?

Labels used below: **FACT** = directly supported by a cited primary source; **INFERENCE** = reasoned consequence; **RECOMMENDATION** = proposed Curiosity action. Confidence applies to the claim as written.

## Executive verdict

The strongest reusable idea was not Bing's endpoint shape; it was its separation of **typed answers**, **query interpretation**, and a distinct **presentation-ranking graph**. Curiosity should adapt that separation into provider-neutral retrieval candidates, execution metadata, and optional rank/group hints. It should not copy Bing's UI-specific `pole`/`mainline`/`sidebar` contract, opaque IDs, offset paging, user-history client identifier, or mixed retrieval-and-instant-answer envelope.

The retirement is the larger lesson. Microsoft announced complete decommissioning in May 2025 for 2025-08-11 and directed customers to an agent-grounding product that does not expose the old raw result feed. A provider replacement can preserve the brand and underlying index while changing the product boundary from retrieval to generated answers. Curiosity should therefore own its canonical contract, crawl/index state, provenance, evaluation set, and answer-generation boundary rather than treating any hosted result API as an interchangeable substrate.

**Overall confidence: high** for the documented v7 contract and retirement; **medium** for historical commercial interpretation; **low/unknown** for undocumented ranking algorithms, effective corpus coverage, and final retired tier prices.

## Lifecycle and deprecation risk

- **FACT (high):** Microsoft stated that Bing Search APIs would be retired on 2025-08-11, all existing instances would be “decommissioned completely,” and the product would no longer be available for use or new signup. The notice encouraged migration to Grounding with Bing Search in Azure AI Agents.[1]
- **FACT (high):** Microsoft's Azure Updates feed dates the retirement announcement to 2025-05-12; the Lifecycle page is dated 2025-05-15. That provided roughly three months of public notice before shutdown.[1][2]
- **FACT (high):** The final Bing Search legal page applied to F0/F1 and S1–S9 tiers, showing that retirement affected a multi-tier API product rather than only a free preview.[12]
- **FACT (high):** Current Microsoft guidance describes Grounding with Bing as an add-on to selected Microsoft products and says outputs are not directly accessible for other applications or programs. Grounding produces model output with citations; it is not a standalone raw-search compatibility endpoint.[13][14]
- **INFERENCE (high):** “Same search provider” did not mean “same architectural capability.” Existing consumers of `webPages.value`, query corrections, and `rankingResponse` could not preserve their retrieval contract by swapping to the recommended grounding product.
- **RECOMMENDATION (high):** Treat hosted providers as replaceable adapters with explicit capability matrices and shutdown playbooks. Do not permit provider-specific fields, billing assumptions, retention rights, or answer-generation behavior to define Curiosity's core contract.

## Historical request contract

### Transport and authentication

- **FACT (high):** v7 used `GET https://api.bing.microsoft.com/v7.0/search`; HTTPS was mandatory. The documented maximum URL length was 2,048 characters, with query parameters recommended below 1,500 characters.[3]
- **FACT (high):** `q` was the sole required query parameter and could contain Bing advanced operators. The subscription key was supplied in `Ocp-Apim-Subscription-Key`.[4][5]
- **FACT (high):** Default response media type was JSON; JSON-LD could be requested. `Pragma: no-cache` requested uncached content, while `User-Agent` could affect mobile presentation.[5]
- **INFERENCE (high):** A GET-only, URL-bounded query API is convenient for observability and caching but poorly suited to large structured queries, privacy-sensitive parameters, or extensible planning payloads.

### Locale, location, and continuity

- **FACT (high):** `mkt` selected a language-country market; unsupported values could be mapped internally to a best fit. `cc` plus `Accept-Language` was the alternative for multiple language preferences, and `cc` and `mkt` were mutually exclusive. `setLang` controlled UI strings, not necessarily result-market selection.[4][5]
- **FACT (high):** The response header `BingAPIs-Market` reported the market actually used, which could differ from the requested value.[5]
- **FACT (high):** `X-MSEdge-ClientIP` and `X-Search-Location` supplied client position; Bing used location both for local relevance and safe-search behavior. The location header supported latitude, longitude, accuracy radius, timestamp, heading, speed, altitude, and display location.[5]
- **FACT (high):** `X-MSEdge-ClientID` was a Bing-generated per-user/per-device pseudonymous identifier. Microsoft recommended persisting it for stable feature flights and history-tailored ranking, while requiring that it not be linkable to authenticated account information and forbidding request cookies when the header was sent.[5]
- **INFERENCE (high):** Locale, physical location, UI language, and personalization are independent dimensions and should not be collapsed into one `market` string. The “effective market” response is a good precedent for echoing normalized/applied controls.
- **RECOMMENDATION (high):** Curiosity should use an explicit request context (`locale`, `region`, optional coarse location, safety jurisdiction) and return the effective context. Personalization should be opt-in, purpose-limited, and isolated from authentication identity; anonymous retrieval should remain deterministic enough to evaluate.

## Controls: safety, freshness, selection, and paging

### Safety

- **FACT (high):** `safeSearch` accepted `Off`, `Moderate` (default), and `Strict`. Off allowed adult text and images but not adult video; Moderate allowed adult text but not adult images/video; Strict excluded adult text, images, and video. Bing could override the requested setting to Strict for markets whose adult policy required it, and video ignored Off in favor of Moderate.[4]
- **FACT (high):** Microsoft warned that `site:` could still surface adult content regardless of `safeSearch` and should be used only where the caller understood the site.[4]
- **FACT (high):** Results could carry `isFamilyFriendly`, and webpages could carry a structured malware/phishing/pharmacy warning that clients were told to display prominently.[6]
- **INFERENCE (high):** Safety was not a simple query filter: it combined query intent, content-class policy, vertical-specific floors, geography, and result warnings. The documented `site:` exception demonstrates that safety controls need defense in depth.
- **RECOMMENDATION (high):** Record requested safety policy, enforced policy, jurisdictional override, classifier/warning evidence, and final disposition separately. Recheck fetched documents; never infer safety solely from query controls or source allow-listing.

### Freshness

- **FACT (high):** `freshness` accepted Day, Week, Month, an inclusive-looking documented date range form `YYYY-MM-DD..YYYY-MM-DD`, or a single date. The docs defined Day/Week/Month by when **Bing discovered** the page, not necessarily publication time.[4]
- **FACT (high):** Webpage results separately exposed `dateLastCrawled`, `datePublished`, and display text for publication date, where available.[6]
- **INFERENCE (high):** “Fresh” conflated at least discovery, crawl, and publication clocks unless the consumer retained field semantics. A page newly discovered by an engine can be old content.
- **RECOMMENDATION (high):** Curiosity should type timestamps (`published_at`, `first_seen_at`, `last_fetched_at`, `source_modified_at`) with provenance and confidence. Freshness constraints must name the clock they filter and report fallback behavior.

### Answer selection and result-type controls

- **FACT (high):** By default the response could contain all relevant answer categories. `responseFilter` included or excluded categories; `answerCount` capped ranked answer categories; `promote` attempted to include named categories without consuming the cap. Promotion did not imply that nonexistent or irrelevant data would appear.[4][6]
- **FACT (high):** Possible top-level categories included webpages, images, video, news, entities, places, related searches, spelling suggestions, computation, time zone, and translation.[6]
- **INFERENCE (high):** Bing separated “which verticals are eligible,” “how many answer blocks are returned,” and “which blocks are promoted.” This is more expressive than a single result-type filter, but the term “answer” mixes retrieval collections with computed responses.
- **RECOMMENDATION (high):** Preserve separate concepts for source/candidate eligibility, result budget, and ranking preference. Do not call every retrieved collection an answer; reserve “answer” for a downstream synthesis or deterministic computation stage.

### Paging

- **FACT (high):** Web search used `count` (default 10, maximum 50) and zero-based `offset`. Paging applied only to webpage results; other answer categories could vary independently across pages. Microsoft warned that pages could overlap and that `totalEstimatedMatches` was only an estimate that might change request to request.[4][7]
- **FACT (high):** If `responseFilter` excluded Webpages, clients were told not to use `count` and `offset`.[7]
- **INFERENCE (high):** The API exposed a live ranked window, not snapshot-consistent pagination. `totalEstimatedMatches` was suitable for UX hints, not completeness claims, loop bounds, or analytics truth.
- **RECOMMENDATION (high):** Prefer opaque bounded cursors tied to query-plan/index snapshot when Curiosity controls the index. Deduplicate across pages, cap depth, and expose estimates explicitly as estimates with generation time/snapshot metadata.

## Result and ranking conventions

### Typed but sparse response

- **FACT (high):** Successful calls returned a `SearchResponse`; failed calls returned `ErrorResponse`. A successful response was sparse: categories could be missing because no relevant result existed, a filter excluded them, or the subscription lacked access.[6]
- **FACT (high):** `webPages` contained `value`, `webSearchUrl`, `totalEstimatedMatches`, optional `someResultsRemoved`, and sometimes an answer-level ranking ID. A `Webpage` could include title (`name`), destination URL, display URL, snippet, language, publication/crawl dates, deep links, family-friendly and navigational flags, malware notice, indexed search tags, and contractual rules.[6]
- **FACT (high):** `queryContext` distinguished `originalQuery` from an `alteredQuery`, supplied an `alterationOverrideQuery` to force the original spelling, flagged adult intent, and could ask the caller for location.[6]
- **FACT (high):** Related searches and spell suggestions were first-class query objects rather than silently replacing all visible query state.[6]
- **INFERENCE (high):** Absence was intentionally ambiguous. Consumers needed capability/configuration context to distinguish “no matches” from “not requested/not entitled.”
- **RECOMMENDATION (high):** Curiosity responses should make per-channel status explicit (`returned`, `empty`, `filtered`, `unsupported`, `failed`, `budget_exhausted`) and preserve original, normalized, corrected, and executed queries independently.

### Ranking as a second structure

- **FACT (high):** `rankingResponse` did not duplicate result content. It referenced answers or individual results by `answerType` plus zero-based `resultIndex`, or by opaque matching IDs. A reference without an index meant display the entire answer block.[6][8]
- **FACT (high):** It grouped placements into `pole` (highest prominence), `mainline`, and `sidebar`. Microsoft required mainline to receive more visibility than sidebar if the consumer used a different layout.[6][8]
- **FACT (high):** The contemporaneous use/display requirements prohibited reordering, including omission, when an order or ranking was supplied, except where agreed or legally required.[12]
- **INFERENCE (high):** Ranking metadata was both relevance output and licensed presentation policy. It allowed heterogeneous vertical blending without flattening each vertical's schema, but tightly coupled the result to a traditional search-results UI.
- **RECOMMENDATION (high):** Adopt the separation, not the UI vocabulary. Return stable candidate IDs plus an ordered list of rank entries carrying score/rank-stage/group/reason metadata. Keep provider order immutable as observed evidence, then record any Curiosity rerank as a separate derived layer. Never make opaque URL-shaped IDs semantically meaningful.

### Attribution and trust

- **FACT (high):** Response schemas included contractual rules for license, link, text, and media attribution, including target fields and “must be close to content” placement. Images had provider attribution; malware notices had specific warning types.[6]
- **FACT (high):** The final Search API terms restricted copying/caching, ML use, result modification, omitted attribution, reordering, mixed display with LLM/general-search content, and non-Microsoft advertising. Limited continuity retention and URL-discovery exceptions existed under detailed conditions.[12]
- **INFERENCE (high):** Content rights and display obligations were field/result-level data, not merely account-level legal prose. A normalized result that drops these obligations is unsafe.
- **RECOMMENDATION (high):** Curiosity should attach source provenance, fetch basis, license/usage evidence, attribution obligations, and retention policy to each artifact. Treat titles, snippets, metadata, HTML decoration, URLs, and markup as untrusted external input; sanitize at rendering and fetching boundaries.

## Errors, throttling, quotas, and pricing

### Errors and quota signals

- **FACT (high):** Documented statuses were 200 success; 400 invalid/missing parameter; 401 missing/invalid key; 403 permission failure or daily/monthly quota exhaustion; 410 use of HTTP rather than HTTPS; 429 per-second quota exhaustion; and 500 server error. Error bodies carried category `code`, `subCode`, message, parameter, invalid value, and optional detail.[9]
- **FACT (high):** The service distinguished `RateLimitExceeded` from invalid and insufficient authorization. QPS exhaustion produced 429; QPM exhaustion produced 403. `Retry-After` was returned after QPS or monthly-limit excess, and `BingAPIs-TraceId` supported incident correlation.[5][9]
- **FACT (high):** A suspected denial-of-service event could return HTTP 200 with an empty body, while ordinary QPS throttling returned 429.[6][10]
- **INFERENCE (high):** HTTP status alone was not a complete success signal. A 403 was overloaded, and an empty 200 represented a defensive failure mode that naive JSON clients could mistake for “no results.”
- **RECOMMENDATION (high):** Curiosity should use stable machine-readable error classes (`invalid_request`, `unauthenticated`, `forbidden`, `budget_exhausted`, `rate_limited`, `upstream_failure`, `defensive_drop`) with retryability and retry time. Success envelopes should explicitly distinguish valid-empty from missing/truncated/defensively dropped payloads.

### Historical quotas and pricing: bounded evidence

- **FACT (high):** The number of QPS depended on subscription type; the archived throttling page did not enumerate values. The legal terms identified F0/F1 and S1–S9 tiers and pointed to a separate offer-details page for pricing.[10][12]
- **UNKNOWN:** A complete final official table of retired tier prices, QPS, daily/monthly quotas, regional prices, and effective dates was not recoverable from the primary pages examined. The surviving Azure pricing route now redacts retired prices or redirects to unrelated legacy pages. Exact historical dollar amounts are therefore intentionally not asserted here.
- **FACT (high, current not historical):** On 2026-08-17 Microsoft's current Grounding with Bing page listed both Search and Custom Search at **$14 per 1,000 transactions**, maximum **150 transactions/second** and **1 million/day**. It defines a charged transaction as a grounding tool invocation whose data is used to craft summarized model output; Microsoft separately notes that web grounding costs are additional to model usage. This is not a total agent-cost figure or a valid historical price comparison.[13][15]
- **FACT (high, current):** Classic-agent documentation says transactions are counted by tool calls per run and the model may invoke the tool repeatedly in one run.[14]
- **INFERENCE (high):** Cost changed from an explicit retrieval-call model to a model-mediated tool-call model where one user turn can trigger zero, one, or multiple searches. User-request count is therefore not a safe cost estimator.
- **RECOMMENDATION (high):** Meter Curiosity at query-plan, fetch, extraction, rerank, and answer stages. Enforce per-request and tenant budgets, record retries separately, and never map “one user question” to “one search transaction.”

## Retrieval versus answer boundary

### Retired API

- **FACT (high):** The v7 API returned structured result collections, query interpretation, ranking references, and direct utility modules such as computation, time zone, and translation. It did not document free-form LLM synthesis as the response contract.[3][6]
- **INFERENCE (high):** It was primarily retrieval plus SERP composition, with a few deterministic/vertical “instant answers.” Applications retained direct access to candidates, snippets, URLs, warnings, and rank metadata.

### Current Microsoft migration direction

- **FACT (high):** Grounding performs query formulation, Bing retrieval, model synthesis, and source attribution. Current docs say developers/end users do not receive raw grounding content/tool output; they receive an AI-generated model response with citation annotations and, in classic guidance, the Bing query link.[13][14][15]
- **FACT (high):** Current general Bing grounding exposes only a smaller set of search controls (`count`, `freshness`, `market`, `set_lang`) within an agent tool. The model can decide whether to search, what output to use, and whether to invoke the tool again.[14][15]
- **FACT (high):** Current guidance warns that grounding data flows outside the Azure compliance/Geo boundary and that the Microsoft Data Protection Addendum does not apply to those data flows.[15]
- **INFERENCE (high):** Grounding is an answer product with retrieval hidden behind a model boundary. It cannot substitute for owned candidate inspection, deterministic reranking, independent extraction, corpus analytics, or search-quality evaluation.
- **RECOMMENDATION (high):** Curiosity should keep `retrieve()` and `answer()` as separate contracts. Answer generation may consume immutable retrieval artifacts and emit claim-to-source citations, but must not erase candidate evidence, execution controls, or failure state.

## Clean-room patterns for Curiosity

This study extracts interface lessons only. Microsoft documentation and legal terms remain Microsoft material; the retired service's implementation, index, ranking weights, internal mappings, and flight logic were neither accessed nor inferred as code.

1. **Published-behavior ledger.** Record each adopted concept against a public source and restate it in Curiosity-native terminology. Do not copy Bing schemas, sample code, trademarks, opaque IDs, or UI layout.
2. **Independent contract.** Define provider-neutral request, candidate, provenance, ranking-event, safety-decision, and error types from Curiosity requirements. Provider adapters map into them; no provider object crosses the boundary.
3. **Independent evaluation.** Build relevance/safety/freshness tests from authorized Curiosity fixtures and public pages, not cached Bing responses. Bing's final terms prohibited using results to train/evaluate services and heavily constrained storage.[12]
4. **No emulation claim.** Similar high-level concepts—locale, freshness, ranked candidates, pagination—are conventional search primitives. Do not claim compatibility or reproduce undocumented ranking behavior.
5. **Rights-aware ingestion.** An owned index does not eliminate publisher rights, robots, privacy, attribution, or deletion obligations. Capture acquisition and use basis per document and honor source controls.
6. **Bounded operation.** Cap query expansion, pagination, fetch count, bytes, time, and retries. Preserve partial results and explicit stop reasons; never treat search output as trusted instructions.
7. **Transfer history.** Keep this report and future design decisions as provenance for why a concept was adopted, adapted, rejected, or deferred.

## Curiosity verdicts

| Bing concept | Verdict | Curiosity treatment | Confidence |
| --- | --- | --- | --- |
| Typed heterogeneous result collections | **ADAPTED** | Normalize to provider-neutral candidate kinds while retaining kind-specific payloads. | High |
| Separate query context | **ADOPTED** | Preserve original, normalized, corrected, override, and executed query plus effective locale/safety controls. | High |
| Separate ranking references | **ADAPTED** | Stable candidate IDs and rank events; preserve source order and separate Curiosity rerank. | High |
| `pole` / `mainline` / `sidebar` | **REJECTED** | Presentation-specific and legally coupled; use optional neutral groups/intents. | High |
| `responseFilter` / budget / promotion separation | **ADAPTED** | Separate eligibility, budget, and preference; all bounded. | High |
| Offset plus estimated total | **REJECTED** as canonical paging | Use snapshot-bound cursors; expose estimates only as estimates. | High |
| Discovery-based freshness | **ADAPTED** | Multiple named clocks with provenance; no ambiguous `freshness` field. | High |
| Market and effective-market echo | **ADAPTED** | Structured locale/region/language plus applied-policy echo. | High |
| Persistent per-user client ID for history ranking | **REJECTED** by default | Optional explicit personalization service only, decoupled from identity and core retrieval. | High |
| Safe-search enum alone | **REJECTED** | Layer query intent, jurisdiction, source/document classifiers, warnings, and policy decisions. | High |
| Structured malware/attribution/license rules | **ADOPTED** in neutral form | First-class warnings, provenance, rights, display, and retention obligations. | High |
| HTML/Unicode decoration in result strings | **REJECTED** as canonical data | Store plain text plus spans; render safely at the edge. | High |
| Computation/translation/time zone in search envelope | **DEFERRED** | Separate deterministic tools from public-web retrieval; combine only in orchestration/answer layers. | Medium |
| Generated grounding as retrieval replacement | **REJECTED** | Keep retrieval inspectable; generated answers are a downstream optional product. | High |
| Per-tool-call metering and hard quotas | **ADAPTED** | Multi-stage budgets, cost attribution, retry accounting, and explicit exhaustion errors. | High |

## Unknowns and negative results

- **UNKNOWN:** Bing's ranking features, weights, index size/coverage by market, spam controls, canonicalization, deduplication, recrawl scheduler, and exact meaning/quality of `isNavigational` were not publicly specified.
- **UNKNOWN:** Date-range inclusivity, timezone boundaries, and behavior when publication/discovery timestamps were missing were not made precise in the examined freshness reference.
- **UNKNOWN:** Snapshot consistency did not exist in the documented contract; no stable cursor or maximum practical offset was documented for web results.
- **UNKNOWN:** The specific reasons behind `someResultsRemoved` were not enumerated.
- **UNKNOWN:** Final retired prices and the complete tier-by-tier quota table could not be verified from a surviving official primary table. Secondary price claims were excluded.
- **NEGATIVE RESULT:** No official raw-result successor or v8 compatibility API was found. Current official products are model-grounding tools with constrained output access.[13][15]
- **NEGATIVE RESULT:** The retired endpoint was not called. Its post-retirement HTTP behavior is therefore not asserted; the old documentation's HTTP 410 meant “HTTP protocol used instead of HTTPS,” not product retirement.[9]
- **NEGATIVE RESULT:** No basis was found to treat `totalEstimatedMatches`, rank IDs, Bing result URLs, or display URLs as durable identifiers.

## Bounded curiosity pass

After synthesis, remaining in-frame gaps were scored 1–5 (higher is more) for relevance, value, novelty, and research cost.

| Thread | R | V | N | Cost | Outcome |
| --- | ---: | ---: | ---: | ---: | --- |
| Distinguish current grounding from raw retrieval | 5 | 5 | 4 | 1 | Pursued via current Microsoft product/docs/legal pages; material boundary confirmed. |
| Recover final retired tier prices from official sources | 3 | 3 | 2 | 4 | **CURIOSITY_NO_GO:** surviving official pricing route did not expose a reliable historical table; exact figures omitted. |
| Probe retired endpoint/status codes | 2 | 1 | 2 | 3 | **CURIOSITY_NO_GO:** unnecessary, potentially misleading, and outside clean-room/document-only frame. |
| Reconstruct ranking algorithm from samples | 4 | 2 | 3 | 5 | **CURIOSITY_NO_GO:** samples reveal presentation references, not ranking internals; would invite unsupported inference. |
| Explore undocumented corpus/index internals | 3 | 2 | 3 | 5 | **CURIOSITY_NO_GO:** no public primary evidence and outside access/license boundary. |

**Stop reason:** coverage and saturation. The official references triangulate the historical contract, legal usage boundary, shutdown, and current migration product. Remaining gaps are undocumented internals or unavailable historical commerce data and would not change the owned-search design verdict.

## Primary sources

All sources accessed 2026-08-17.

1. Microsoft Lifecycle, [“Bing Search APIs Retiring on August 11, 2025”](https://learn.microsoft.com/en-us/lifecycle/announcements/bing-search-api-retirement) (dated 2025-05-15).
2. Microsoft Azure Updates RSS, [“Retirement: Bing Search APIs on August 11, 2025”](https://www.microsoft.com/releasecommunications/api/v2/azure/rss/492574) (published 2025-05-12).
3. Microsoft Learn archive, [Bing Web Search API v7 reference / endpoint](https://learn.microsoft.com/en-us/previous-versions/bing/search-apis/bing-web-search/reference/endpoints).
4. Microsoft Learn archive, [Query parameters used by Web Search API](https://learn.microsoft.com/en-us/previous-versions/bing/search-apis/bing-web-search/reference/query-parameters) (source page dated 2024-06-10).
5. Microsoft Learn archive, [Headers used by Web Search API](https://learn.microsoft.com/en-us/previous-versions/bing/search-apis/bing-web-search/reference/headers) (source page dated 2024-06-13).
6. Microsoft Learn archive, [Bing Web Search API v7 response objects](https://learn.microsoft.com/en-us/previous-versions/bing/search-apis/bing-web-search/reference/response-objects) (source page dated 2024-04-24).
7. Microsoft Learn archive, [How to page through search results](https://learn.microsoft.com/en-us/previous-versions/bing/search-apis/bing-web-search/page-results).
8. Microsoft Learn archive, [How to use rankings to display search results](https://learn.microsoft.com/en-us/previous-versions/bing/search-apis/bing-web-search/rank-results).
9. Microsoft Learn archive, [Error codes used by Bing Web Search API](https://learn.microsoft.com/en-us/previous-versions/bing/search-apis/bing-web-search/reference/error-codes) (source page dated 2023-06-07).
10. Microsoft Learn archive, [Throttling requests](https://learn.microsoft.com/en-us/previous-versions/bing/search-apis/bing-web-search/throttling-requests).
11. Microsoft Learn archive, [Bing family of search APIs](https://learn.microsoft.com/en-us/previous-versions/bing/search-apis/bing-web-search/bing-api-comparison).
12. Microsoft, [Bing Search API Legal Information](https://www.microsoft.com/en-us/bing/apis/legal) (last updated February 2025; applies to retired F0/F1 and S1–S9 tiers).
13. Microsoft, [Grounding with Bing product and pricing](https://www.microsoft.com/en-us/bing/apis).
14. Microsoft Learn, [Grounding with Bing Search in Foundry Agent Service (classic)](https://learn.microsoft.com/en-us/azure/foundry-classic/agents/how-to/tools-classic/bing-grounding) (current page notes classic retirement and raw-output restriction).
15. Microsoft Learn, [Overview of web grounding capabilities in Foundry](https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/tools/web-overview) and [Grounding with Bing tools](https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/tools/bing-tools) (current guidance, updated 2026).
