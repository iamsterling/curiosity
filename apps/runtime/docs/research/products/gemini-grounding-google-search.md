# Gemini Grounding with Google Search: clean-room product dossier

**Access date:** 2026-08-17  
**Subject:** Grounding with Google Search through the Gemini Developer API and
Google Cloud's Gemini Enterprise Agent Platform / Vertex AI surface.  
**Decision:** which observable contracts and controls should inform Curiosity's
owned, provider-neutral public-web search plane.  
**Status:** research record only; no credential, paid call, probing, service
deployment, or implementation was used.

## Executive verdict

**REJECTED as Curiosity's search foundation; ADAPTED as a citation and contract
reference (high confidence).** Gemini offers an unusually useful claim-to-source
response model: generated search queries, source chunks, byte-addressed answer
segments, and explicit links from those segments to supporting chunks. The
Interactions API also presents search as typed `google_search_call` and
`google_search_result` steps with answer-span URL citations [S1][S2][S4].

That is still a hosted, answer-first grounding service rather than a raw,
replayable retrieval API. Google and the model control whether and how many
queries run, Google Search controls corpus and ranking, and the public web chunk
contains only URI, title, and domain. The contract does not expose snippets or
source passages, provider rank, result count, rank score/reason, crawl or fetch
time, publication time, immutable capture, source offsets/hash, index snapshot,
or coverage warning [S2][S4]. A URL plus an answer-span association is useful
for verification, but insufficient for evidence custody after a page changes.

The legal and operational boundary is decisive. Google requires Grounded
Results, Search Suggestions, and Links to remain tied to the initiating end-user
prompt; restricts caching, analysis, training, automated collection, link-based
indexing/crawling, tracking, and modification; and imposes exact Search
Suggestion/display rules [S6][S7]. These outputs must not seed Curiosity's
corpus, benchmark, labels, crawler frontier, or ranking evaluation.

**Overall verdict:**

- **ADOPTED:** typed query/call trace, claim-level citation linkage, byte-offset
  semantics, empty/error separation as a design requirement, and usage metering.
- **ADAPTED:** model-led multi-query search, source-domain metadata, location,
  citation display, and optional search decisions—only inside caller-declared
  authority and with owned immutable evidence.
- **REJECTED:** Google grounding as production corpus/ranker, vendor output as
  evidence storage or crawl seeds, opaque HTML as the canonical UI contract,
  model discretion without a hard search budget, and marketing “real-time” as
  temporal provenance.
- **DEFERRED:** tool-composed search, learned query planning, and confidence-like
  support scoring pending owned evaluation and explicit security gates.

## 1. Frame, bounded questions, and method

### 1.1 Questions

1. Which Gemini grounding surfaces and schemas are current?
2. What request controls, query traces, sources, citations, scores, limits,
   pricing, and failures are publicly observable?
3. What does the evidence establish about the Search/retrieval boundary, and
   what remains hidden?
4. How do publisher controls, safety, privacy, retention, and output-use terms
   constrain use?
5. What should Curiosity adopt, adapt, reject, or defer?

### 1.2 Method and clean-room boundary

Primary evidence is Google's public API documentation, generated REST schema,
Google Cloud documentation, service terms, security documentation, and pricing.
All web sources were accessed on 2026-08-17. Documentation establishes an
offered contract, not quality, completeness, latency, or hidden implementation.

No credentials, free or paid service calls, browser automation, private traffic,
hidden endpoints, output harvesting, rate-limit tests, or ranking inference were
used. No Google output, Search Suggestion, or link set was copied into a corpus,
fixture, benchmark, or implementation. Clean-room conclusions are limited to
published behavior and the smallest functional architecture consistent with it.

Labels:

- **FACT** — directly supported by cited official evidence.
- **INFERENCE** — bounded conclusion consistent with facts, not a disclosed
  internal implementation.
- **RECOMMENDATION** — proposed Curiosity response.
- Confidence is **high**, **medium**, or **low**.

## 2. Product surfaces, status, and lifecycle

### 2.1 Two principal developer surfaces

**FACT (high):** Google's current Gemini API search guide says the **Interactions
API is generally available and recommended** for access to the latest features
and models [S1]. Its tool declaration is:

```json
{
  "model": "<supported-model>",
  "input": "Who won Euro 2024?",
  "tools": [{"type": "google_search"}]
}
```

The response is trajectory-oriented: a `google_search_call` contains executed
queries, a `google_search_result` carries Search Suggestions, and `model_output`
text carries `url_citation` annotations with answer offsets [S1].

**FACT (high):** the established `generateContent` surface declares the built-in
tool as `tools: [{"googleSearch": {}}]`. Google Cloud adds documented
`exclude_domains` and end-user `latLng` configuration. Its answer candidate can
carry `groundingMetadata`, including queries, chunks, claim supports, Search
Suggestion rendering, and retrieval metadata [S2][S3][S4].

These are related product surfaces, not interchangeable wire contracts:

| Surface | Search declaration | Principal response form |
| --- | --- | --- |
| Gemini Interactions API | `{"type":"google_search"}` | typed call/result/model-output steps and URL/span annotations |
| Gemini/Vertex `generateContent` | `{"googleSearch":{...}}` | candidate text plus `groundingMetadata` |

### 2.2 Legacy dynamic retrieval

**FACT (high):** the REST schema still contains `googleSearchRetrieval` with
`dynamicRetrievalConfig.mode` and `dynamicThreshold`, and can return
`retrievalMetadata.googleSearchDynamicRetrievalScore` [S2][S4]. The current
product guide identifies the older `google_search_retrieval` path as legacy and
directs current models to `google_search`; the older dynamic configuration is
documented for the Gemini 1.5 generation [S1][S2].

**INFERENCE (high):** schema presence is not proof that a legacy control is
supported by current models. Compatibility keys must include API surface,
model/version, and tool type. Curiosity should never infer capability merely
because a field survives in a generated union.

### 2.3 Tool-combination scope and documentation tension

The current Gemini Developer API guide says Search can combine with URL Context,
Code Execution, Maps on qualifying newer models, and custom tools on Gemini 3
models [S1]. In contrast, the Google Cloud `generateContent` grounding guide
states that search and non-search tools are not supported in one request and
that multiple tools must all be search tools [S3]. Older model-specific guidance
also narrows combinations to particular Gemini 3 variants.

**FACT (high):** combination support varies by surface and model generation;
the official pages do not support one universal rule [S1][S3].

**RECOMMENDATION (high):** treat `(surface, model, tool set)` as an explicit
compatibility tuple and fail closed. Do not let a model silently expand Search
into URL access, code execution, Maps, or customer functions.

## 3. Request contract and caller controls

### 3.1 Search authority and query generation

When Search is enabled, Google describes this sequence [S1]:

1. application submits the user prompt with Search available;
2. model decides whether Search could improve the answer;
3. if needed, model generates one or multiple queries and executes them;
4. model processes results and synthesizes a grounded response;
5. API returns answer citations and search metadata.

**FACT (high):** executed queries are observable after the decision through
`google_search_call.arguments.queries` or `webSearchQueries` [S1][S4].

**Negative result:** no documented pre-search approval hook, declarative query
plan, exact branch ceiling, per-request query budget, or complete-trajectory
guarantee was found. A prompt can request behavior, but prompt text is not an
enforceable retrieval bound.

**INFERENCE (high):** query disclosure after execution improves auditability but
does not give the caller prospective control over egress, cost, or scope. The
same end-user prompt can generate multiple separately billed Gemini 3 queries.

### 3.2 Structured request controls

The narrow documented controls are:

| Control | Surface | Semantics / boundary |
| --- | --- | --- |
| Enable Search | both | Gives the model access; it does not by itself force a query. |
| `exclude_domains` | Google Cloud `googleSearch` | Optional domains not to use for grounding [S3]. |
| `latLng.latitude/longitude` | Google Cloud retrieval config | End-user geographic relevance hint [S3]. |
| legacy `dynamicThreshold` | older `googleSearchRetrieval` | Threshold for the legacy predictor deciding whether search helps [S2]. |
| model/tool selection | both | Determines compatibility and billing semantics [S1][S3]. |

**Negative findings:** no current documented field was found for:

- include/allow domains or path-level policy;
- exact result count, pagination, cursor, or candidate ceiling;
- date range, freshness window, sort order, or as-of snapshot;
- content language, market, UI language, or jurisdiction policy;
- SafeSearch/adult-content level, malware policy, source type, or trust class;
- force-search / forbid-search after exposing the tool;
- maximum queries, fetched pages, bytes, context, time, or monetary cost;
- rank algorithm/version, diversity policy, or score threshold on current models.

Google documents supported answer languages, but that is not equivalent to a
hard search-result language filter [S3]. Coordinates are a relevance input, not
a residency, legal, language, or geofence guarantee.

### 3.3 Domain filtering limitations

**FACT (high):** Google Cloud exposes only an exclusion list in the reviewed
Search contract [S3]. No inclusion list or exact matching semantics for parent
domains, subdomains, internationalized domains, redirects, or URL paths were
found.

**RECOMMENDATION (high):** Curiosity needs neutral, deterministic source policy:
canonical ASCII/punycode host handling; explicit registrable-domain, subdomain,
and path semantics; both allow and deny modes; redirect revalidation; and reason
codes for every policy removal. Provider domain hints cannot substitute for the
owned crawler/retriever boundary.

## 4. Response, sources, and citations

### 4.1 Interactions response

A grounded Interactions response can include [S1]:

```text
google_search_call.arguments.queries[]
google_search_result.call_id
google_search_result.result[].search_suggestions   # provider HTML/CSS
model_output.content[].text
model_output.content[].annotations[]:
  type=url_citation, url, title, start_index, end_index
```

The answer offsets associate source URLs with portions of generated output.
Search Suggestions are not raw search results; they are a provider-controlled
display element subject to specific terms.

### 4.2 `groundingMetadata` response

The `generateContent` schema is richer [S4]:

```text
GroundingMetadata
  webSearchQueries[]
  searchEntryPoint.renderedContent / sdkBlob
  groundingChunks[]
  groundingSupports[]
  retrievalMetadata.googleSearchDynamicRetrievalScore?
```

For web grounding, a `groundingChunk.web` contains only:

```json
{"uri":"https://...", "title":"...", "domain":"example.org"}
```

`groundingSupports[].groundingChunkIndices` indexes into `groundingChunks` and
thereby maps an answer claim to one or more source links. Its `segment` contains
`partIndex`, inclusive `startIndex`, exclusive `endIndex`, and text. The REST
reference specifies that these offsets are measured in **bytes**, not characters
or UTF-16 code units [S4].

**RECOMMENDATION (high):** adopt explicit offset units and half-open ranges in
Curiosity schemas. Answer adapters must not assume JavaScript string indices are
wire-compatible with UTF-8 byte offsets.

### 4.3 Score semantics

Two similarly named score concepts must not be conflated:

- `googleSearchDynamicRetrievalScore` estimates how likely a Search query would
  help answer the prompt; it participates in legacy search-triggering [S4].
- `confidenceScores[]` is parallel to `groundingChunkIndices[]` and, where
  populated, estimates confidence that a reference supports the answer segment.
  It is **not** relevance rank, source quality, factual truth, or citation
  entailment probability [S4].

The current REST reference says `confidenceScores` is populated for Gemini 2.0
and earlier but is empty and should be ignored for Gemini 2.5 and later [S4].
Examples that contain scores therefore do not establish a current-model signal.

**RECOMMENDATION (high):** reject an uncalibrated scalar “confidence” in the
canonical evidence contract. Preserve typed relations—supports, contradicts,
uncertain—and only expose measured scores with a model/version, calibration set,
and precise semantic definition.

### 4.4 Evidence strengths and deficits

| Property | Google contract | Curiosity verdict |
| --- | --- | --- |
| Executed query list | visible after execution | **ADOPT**, with branch IDs and pre-execution policy |
| Claim-to-source map | answer segment → chunk indices | **ADOPT** structure |
| Answer offsets | explicit, byte-based in `groundingMetadata` | **ADOPT**, declare encoding/unit |
| URL/title/domain | exposed per web chunk | **ADAPT** as untrusted metadata |
| Search Suggestions | rendered HTML or encoded UI data | **REJECT** as canonical evidence/UI |
| Source passage | not exposed for web chunks | **ADD** owned passage text and hash |
| Rank/result set | not exposed | **ADD** candidate/selected/cited sets and rank reason |
| Version/time | no capture, fetch, crawl, publish, or index time | **ADD** immutable temporal provenance |
| Coverage/filter trace | absent | **ADD** corpus and policy warnings |

**INFERENCE (high):** Google's citations are presentation-grade, not
reproducibility-grade. They can tell a user which live URL Google associated with
an answer segment, but not what exact source bytes were used, where they appeared,
which version was retrieved, or why competing evidence was omitted.

## 5. Retrieval boundary and bounded architecture inference

### 5.1 Confirmed functional boundaries

1. Gemini analyzes the prompt and formulates one or more queries [S1].
2. Those queries are sent to Google Search; pricing counts them as the search
   unit for Gemini 3 [S1][S5].
3. The model processes Search results and synthesizes the answer [S1].
4. The client receives source links and claim mappings, but not the raw ranked
   Search result set or web passages [S1][S4].
5. Google describes the corpus as publicly available, real-time/up-to-date web
   information and states that eligible Google Cloud grounding honors publisher
   `Google-Extended` exclusions [S3].

The smallest architecture consistent with those facts is:

```text
prompt + Search availability + narrow request hints
  -> Gemini search-need decision and query generation
  -> Google Search execution / ranking / policy
  -> undisclosed result and passage processing
  -> bounded grounding context supplied to Gemini
  -> answer synthesis
  -> claim segmentation and source association
  -> answer + query trace + links + provider display metadata
```

### 5.2 What cannot be inferred responsibly

No official evidence reviewed establishes:

- candidate count, actual top-k, pagination, or whether all candidates are shown;
- use or relative weight of lexical, vector, graph, freshness, personalization,
  authority, spam, or learned-ranking signals;
- query rewriting beyond the disclosed executed strings;
- snippet/passages supplied to Gemini, extraction method, or page rendering;
- cache behavior, live-fetch behavior, crawl schedule, index snapshot, or lag;
- deduplication, canonicalization, clustering, diversification, or source balance;
- citation generation/checking model or omission thresholds;
- safety/malware/prompt-injection filters applied to individual results.

**INFERENCE (medium):** an internal passage/context selection stage must exist
because Gemini synthesizes claims from Search while the public web chunk exposes
only a link. Its data shape, ranking, and whether it uses snippets, cached pages,
live pages, or structured Search features remain unknown.

## 6. Freshness, publisher control, and temporal semantics

**FACT (high):** Google markets grounding as access to “real-time” and
“up-to-date” public-web information [S1][S3]. Google Cloud says pages that
disallow `Google-Extended` are not used by this grounding product [S3].

**Negative result:** no per-result publication, modification, crawl, fetch,
retrieval, or index timestamp; freshness filter; cache bypass; archive/as-of
mode; update-latency SLO; or immutable Search snapshot was found.

**INFERENCE (high):** “real-time” means request-time access to Google's changing
Search service, not guaranteed live page retrieval, bounded index recency, or
temporal reproducibility. `Google-Extended` is a publisher inclusion control,
not evidence of freshness, licensing, or citation correctness.

**RECOMMENDATION (high):** owned results should distinguish `fetched_at`,
`first_seen_at`, `last_seen_at`, `indexed_at`, claimed `published_at`, claimed
`modified_at`, and substantive change time, all tied to a capture and index
snapshot. A date filter must name which clock it constrains.

## 7. Safety, privacy, retention, and terms

### 7.1 External content remains untrusted

Google's model safety controls and policies do not create a client-visible trust
signal for each Search source. The reviewed grounding response has no malware,
prompt-injection, reputation, adult-content, or policy-removal field [S4][S10].

**INFERENCE (high):** web text can influence a model that may also have other
tools, even though the application cannot inspect the exact retrieved passage.
Opaque evidence reduces the application's ability to independently detect
indirect prompt injection.

**RECOMMENDATION (high):** all public-web text remains
`untrusted_external_evidence`. It cannot alter system policy, authorize tools,
expand budget/scope, request secrets, or approve mutation. Public search and
private-data synthesis should be separate phases, with no public query egress
after sensitive context is loaded.

### 7.2 Gemini Developer API data treatment

**FACT (high):** for unpaid Gemini services, Google may use submitted content and
responses to improve products, and human reviewers may read and annotate them;
Google warns not to submit sensitive, confidential, or personal information
[S6]. Paid Gemini API prompts/responses are not used to improve products, but
limited safety/legal logging and technical usage collection remain [S6].

Grounding adds a separate rule: the Gemini terms state that Google stores
prompts, contextual information, and output for 30 days to create Grounded
Results/Search Suggestions and debug/test supporting systems; paid-quota
processing is under the referenced DPA [S6].

**RECOMMENDATION (high):** never put credentials, unreleased names, internal
URLs, personal data, or private retrieved content into a public Search query.
Apply query minimization/DLP before egress and retain only redacted audit data.

### 7.3 Google Cloud retention and abuse monitoring

Google Cloud's grounding terms describe derived-query/context logs stored for up
to three days for debugging, as an explicit exception to the normal security
controls cited by the terms [S7][S8]. Separately, abuse monitoring can store
suspicious prompts for up to 90 days; authorized employees may review them, and
eligible customers can request an opt-out. The abuse logs are not CMEK-encrypted
[S9].

These are different purposes and retention paths. A general “Vertex does not
train on customer data” statement does not imply zero retention or no human
review. Contract/account eligibility must be verified before any real use.

### 7.4 Grounded Result and Search Suggestion restrictions

Google's Gemini and Cloud terms materially constrain product use [S6][S7]:

- use only in the customer's owned/operated application and display to the end
  user who submitted the prompt;
- display associated Search Suggestions when required, subject to the exact
  documented exception and pricing conditions;
- do not cache, frame, syndicate, resell, analyze, train on, or otherwise learn
  from Grounded Results or Search Suggestions;
- do not programmatically collect Links, build an index from them, or use them
  to identify pages for crawling/scraping;
- do not track individual Grounded Results, Suggestions, or Links;
- storage is limited to enumerated purposes and periods, including user chat
  history, display optimization, legal compliance, and narrow refinement flows;
- absent written/documented permission, do not modify/intermix the Grounded
  Result or Search Suggestions or interfere with destination display.

The Gemini terms and Cloud terms differ in details—for example, Gemini allows a
narrow temporary refinement flow while the cited Cloud section specifies its
own enumerated storage permissions. Surface-specific legal review is required.

**RECOMMENDATION (high):** do not call the service for Curiosity corpus seeding,
ranking/model evaluation, citation benchmarking, crawl discovery, or durable
evidence capture. Public documentation may inform an independently authored
neutral design; service outputs may not.

## 8. Limits, pricing, and operational bounds

### 8.1 Query and billing units

**FACT (high):** Google Cloud documents a limit of **one million Search queries
per day**, with support contact for higher needs [S3]. This is an aggregate
service limit, not a safe per-task budget.

**FACT (high):** for Gemini 3, each non-empty query generated and sent to Search
is the billing unit; one prompt can create multiple billed queries. Gemini 2.5
and older grounding is billed per grounded prompt [S1][S3][S5]. On the access
date, Gemini API pricing listed a shared allowance of 5,000 Gemini 3.x Search
requests/month and then **$14/1,000 requests** for the shown paid models [S5].
Model token charges and surface-specific pricing also apply.

**INFERENCE (high):** price and authority can escape a prompt-level mental model.
A caller cannot infer task cost from the number of user prompts when Gemini
chooses multiple queries.

### 8.2 Missing task-level bounds and failures

No documented current Search-tool control was found for maximum queries per
prompt, result count, bytes, elapsed time, context tokens, retries, or dollars.
Nor did the reviewed public grounding pages expose a stable Search-specific
error taxonomy for no match, policy filtering, upstream timeout, partial Search
failure, citation omission, or budget exhaustion.

Generic Gemini/Google Cloud transport, quota, safety, and model errors still
apply, but a final answer is not proof that every desired search branch ran or
that coverage was complete.

**RECOMMENDATION (high):** Curiosity needs one monotonic task ledger across
query branches, index reads, fetches, retries, bytes, passages, model tokens,
elapsed time, and curiosity. Distinguish `no_match`, `policy_filtered`,
`partial`, `deadline`, `budget`, `upstream`, `unsafe`, and `internal`. A retry or
continuation must not mint new authority.

## 9. Exact implications for Curiosity

Repository decisions already fix `web_search` as the provider-neutral ABI,
restrict it to the researcher, mark external content untrusted, and permit only
one bounded, in-frame curiosity pass. ADR 0021 proposes owned captures,
extraction, lexical retrieval, deterministic ranking, diversity, and provenance
before learned/rich expansion.

### 9.1 Adopt

1. **Typed query trace.** Record original query, every derived query, call ID,
   branch/parent ID, purpose, policy decision, and execution outcome.
2. **Claim-source graph.** Map answer segments to one or more evidence passages
   by stable IDs rather than prose footnotes.
3. **Explicit offsets.** Declare encoding, unit, inclusive/exclusive semantics,
   content-part identity, and the exact content version offsets address.
4. **Source domain as metadata.** Preserve safely normalized URL/title/domain,
   but keep them untrusted and separate from owner/canonical identities.
5. **Usage ledger.** Count attempted/succeeded/failed queries and all owned
   resource dimensions even when the final answer omits evidence.

### 9.2 Adapt

1. **Optional model-led search:** planning may propose branches, but policy must
   authorize them before execution and enforce aggregate hard bounds.
2. **Citations:** retain answer-span UX, but target immutable
   `document + capture + passage + hash`, with current URL as convenience only.
3. **Location:** treat it as an explicit relevance hint; separate it from locale,
   language, jurisdiction, residency, and egress controls.
4. **Domain exclusion:** expand to deterministic allow/deny corpus policy with
   redirect checks and reason codes.
5. **Publisher control:** preserve purpose-specific user agents, robots decisions,
   takedown/deindex, recrawl/delete propagation, and no authentication/CAPTCHA
   bypass; derive behavior from standards and legal review, not Google output.

### 9.3 Reject

1. Google Search/Gemini as the production corpus, ranker, or answer oracle.
2. Grounded Results, Search Suggestions, links, or queries as corpus seeds,
   benchmark labels, evaluation data, or crawler frontier.
3. URL-only web chunks as sufficient evidence provenance.
4. Provider HTML/CSS as the canonical result or presentation contract.
5. Model discretion as the only search trigger, stop rule, or cost bound.
6. Legacy dynamic score as a current-model compatibility promise.
7. Support “confidence” as rank, factuality, or source trust.
8. “Real-time” as a freshness guarantee or reproducible timestamp.
9. Combining public Search with private data or mutation-capable tools by default.

### 9.4 Defer behind evidence gates

1. Learned multi-query planning and stopping.
2. Model-assisted support/contradiction scoring.
3. Search-plus-live-fetch, rendering, code execution, Maps, or custom-tool graphs.
4. Rich Search-Suggestion-like result widgets and vertical cards.

Each needs independent fixtures, held-out relevance/citation/freshness measures,
security/privacy/legal review, exact budget semantics, and demonstrated value
over deterministic lexical retrieval.

### 9.5 Target neutral envelope

This is a conceptual requirement, not an implementation:

```text
SearchTask
  frame_id, original_query, locale/language/location hints
  corpus/domain/temporal/safety/network policy
  query/result/fetch/byte/passage/token/deadline/cost caps

SearchCall
  call_id, branch_id, parent_id, query, facet, expected_gain
  policy_decision, started/ended, outcome, partial_failures
  corpus/index/extractor/ranker versions, coverage warnings

EvidencePassage
  result_id, rank, stage/reason, document/capture/passage IDs
  fetched/terminal/canonical URLs, title/domain/owner cluster
  passage bytes/text/hash/offsets, untrusted=true
  first_seen/fetched/indexed/claimed_published/claimed_modified times

ClaimSupport
  answer_part/version, byte or code-point half-open range
  evidence_passage_ids, relation=supports|contradicts|uncertain
  method/version, calibrated_score?, reviewer_state

SearchUsage
  attempted/succeeded/failed queries and fetches, candidates/results
  bytes/tokens/elapsed/cost, remaining budget, stop reason
```

## 10. Fact / inference / recommendation ledger

| ID | Type | Claim or decision | Confidence | Evidence / verdict |
| --- | --- | --- | --- | --- |
| L1 | FACT | Interactions API is GA/recommended and declares `type: google_search`. | High | [S1] |
| L2 | FACT | `generateContent` uses `googleSearch`; Cloud adds excluded domains and lat/long. | High | [S2][S3] |
| L3 | FACT | Model may generate multiple executed queries after deciding search helps. | High | [S1] |
| L4 | FACT | Queries, source chunks, answer segments, and chunk mappings are exposed. | High | [S1][S4]; **ADOPTED** pattern |
| L5 | FACT | Web chunk fields are URI, title, and domain; no web passage text is exposed. | High | [S4] |
| L6 | FACT | Segment offsets are byte-based half-open ranges. | High | [S4]; **ADOPTED** explicit units |
| L7 | FACT | Support scores are legacy/empty on 2.5+, and are not rank/factuality scores. | High | [S4]; **REJECTED** as neutral confidence |
| L8 | FACT | Legacy dynamic retrieval fields remain in schema but are not the current-model path. | High | [S1][S2] |
| L9 | FACT | Gemini 3 bills per executed query; older models bill per prompt. | High | [S1][S3][S5] |
| L10 | FACT | Cloud documents one million queries/day. | High | [S3] |
| L11 | FACT | Unpaid Gemini content may improve products and undergo human review; paid content is not used for improvement. | High | [S6] |
| L12 | FACT | Grounding has additional debugging storage; Cloud abuse monitoring can retain flagged prompts up to 90 days. | High | [S6][S7][S9] |
| L13 | FACT | Terms restrict analysis, training, collection, indexing/crawling, tracking, storage, and display. | High | [S6][S7]; **REJECTED** corpus/evaluation use |
| L14 | INFERENCE | Product is answer-first grounding, not replayable raw retrieval. | High | L3-L7 |
| L15 | INFERENCE | “Real-time” does not establish live fetch or temporal reproducibility. | High | Missing timestamps/filters; [S1][S3][S4] |
| L16 | INFERENCE | An undisclosed result/passage selection stage exists before synthesis. | Medium | Search-derived answer with link-only client chunks |
| L17 | RECOMMENDATION | Adopt claim-source graph but anchor to owned immutable passages. | High | **ADAPTED** |
| L18 | RECOMMENDATION | Enforce caller-framed query/task budgets before egress. | High | **ADOPTED** |
| L19 | RECOMMENDATION | Do not use Google outputs, links, or suggestions for Curiosity development. | High | **REJECTED** transfer |

## 11. Unknowns and negative findings

Material unknowns retained:

- exact current model-by-surface tool-combination matrix and lifecycle stability;
- whether every executed/retried/internal query is always disclosed;
- query count defaults/maximums and any hidden stopping rule;
- result/candidate count and evidence omitted before `groundingChunks`;
- Search ranking, reranking, personalization, deduplication, and diversity;
- whether Gemini receives snippets, cached passages, live page text, structured
  Search features, or a mixture;
- crawl/index/cache lag and geographic/language coverage;
- citation entailment method and accuracy;
- per-result safety filtering, spam, malware, and prompt-injection handling;
- precise domain exclusion matching/redirect behavior;
- Search-specific timeout, retry, partial-failure, cancellation, and SLO;
- exact retention/processing interaction among surface, account agreement,
  region, abuse opt-out, and Grounding-specific debugging exceptions.

Negative findings are first-class: no documented current request/result field
was found for include domains, top-k, freshness/date filter, language, SafeSearch,
forced use, hard search budget, provider rank, score/reason, source passage,
capture/version, source offsets/hash, crawl/fetch/publication time, canonical
cluster, index snapshot, or coverage warning.

No authenticated behavior was measured. Consequently this report makes no claim
about relevance, latency, citation correctness, geographic consistency, factual
accuracy, or comparative freshness.

## 12. Reproducible checks and authorized future matrix

### 12.1 No-credential documentation checks performed

1. On [S1], verify the Interactions GA banner, `google_search` declaration,
   model-led multi-query flow, call/result steps, answer annotations, billing
   distinction, supported models, and tool-combination text.
2. On [S2], verify `googleSearchRetrieval`, `dynamicRetrievalConfig`, and current
   `googleSearch` coexist in the generated union.
3. On [S3], verify `exclude_domains`, `latLng`, one-million/day limit,
   Google-Extended statement, Search Suggestion requirement, and combination
   limitation.
4. On [S4], verify query/chunk/support linkage, web chunk fields, byte offsets,
   score semantics, and 2.5+ empty-score warning.
5. On [S5], verify the shown shared monthly allowance, per-query charge, and
   “used to improve products” distinction between free and paid columns.
6. On [S6] and [S7], verify storage, display, collection, indexing/crawling,
   analysis/training, tracking, and surface-specific exceptions.
7. On [S9], verify suspicious-prompt retention, human access, CMEK exception,
   account scope, and opt-out route.

### 12.2 Future tests only with separate authority

If a caller later supplies credentials, budget, legal approval, synthetic public
fixtures, and approved retention, run a small predeclared matrix:

| Check | Variation | Verify |
| --- | --- | --- |
| Search trigger | stable/current fact; explicit search/no-search | actual call trace, not answer alone |
| Query accounting | one-facet vs multi-facet prompt | disclosed queries and billed unit |
| Domain exclusion | parent/subdomain/redirect/IDN controlled pages | exact matching and terminal-domain enforcement |
| Citation offsets | ASCII and multibyte controlled answer/source text | byte semantics and annotation integrity |
| Citation drift | versioned controlled pages | link drift and absence/presence of capture identity |
| Empty/partial/error | synthetic no-match and controlled timeout where supported | distinct states and answer disclosure |
| Surface parity | same benign prompt on Interactions and `generateContent` | schema/metadata differences only, not quality from one run |
| Freshness | controlled page updated at known times | lag distribution; no “real-time” assumption |

Do not use sensitive data, harmful content, adversarial service probing, broad
sampling, hidden-endpoint inspection, or returned links as crawl/evaluation
inputs. Stop if terms do not clearly permit the proposed measurement.

## 13. Bounded curiosity pass

Scores are 1 (low) to 5 (high); lower cost is cheaper. The declared frame
authorized documentation research only.

| Thread | Rel. | Value | Novelty | Cost | Outcome |
| --- | ---: | ---: | ---: | ---: | --- |
| Current vs legacy search tool and dynamic score | 5 | 5 | 4 | 1 | **Pursued:** current guide and schema triangulated; legacy field presence is not current support [S1][S2][S4]. |
| Exact claim-offset and score semantics | 5 | 5 | 4 | 1 | **Pursued:** offsets are bytes/half-open; support scores are ignored on 2.5+ [S4]. |
| Developer vs Cloud output-use/retention differences | 5 | 5 | 5 | 1 | **Pursued:** terms materially reinforce rejection and preserve surface-specific exceptions [S6][S7][S9]. |
| Resolve every tool-combination/model cell | 4 | 3 | 2 | 3 | **CURIOSITY_NO_GO:** volatile matrix and official surface tension; deployment-time compatibility check is safer. |
| Determine exact query/result ranking path | 3 | 2 | 4 | 5 | **CURIOSITY_NO_GO:** hidden-system inference, low identifiability, no clean-room need. |
| Paid citation/freshness benchmark | 4 | 4 | 3 | 5 | **CURIOSITY_NO_GO:** no credentials, paid-test authority, permitted output-evaluation protocol, or fixture set. |
| Harvest Search Suggestions to infer raw results | 1 | 1 | 3 | 5 | **CURIOSITY_NO_GO:** terms and clean-room boundary prohibit extraction; provider HTML is not canonical evidence. |
| Infer SafeSearch through adversarial prompts | 2 | 2 | 3 | 5 | **CURIOSITY_NO_GO:** unsafe probing and poor inference; retain undocumented control as unknown. |

**Stop:** contract, controls, metadata, architecture boundary, freshness, safety,
privacy, terms, limits, pricing, Curiosity implications, and unknowns are covered.
Further work requires paid/live access, legal approval, or speculative/prohibited
reverse engineering. Coverage and authority exhaustion reached.

## 14. Primary sources

All accessed 2026-08-17.

1. **[S1] Google, Gemini API — Grounding with Google Search.**  
   https://ai.google.dev/gemini-api/docs/google-search  
   — Interactions GA/recommendation, request and response trajectory, executed
   queries, citations, pricing semantics, model list, and tool combinations.
2. **[S2] Google, Gemini API — `generateContent` REST reference.**  
   https://ai.google.dev/api/generate-content  
   — tool union, `googleSearch`, legacy `googleSearchRetrieval`, dynamic
   retrieval, and generated response types.
3. **[S3] Google Cloud, Grounding with Google Search.**  
   https://cloud.google.com/vertex-ai/generative-ai/docs/grounding/grounding-with-google-search  
   — Cloud request controls, location, excluded domains, one-million/day limit,
   Search Suggestions, Google-Extended, billing, and combination constraints.
4. **[S4] Google Cloud REST reference, `GroundingMetadata`.**  
   https://docs.cloud.google.com/vertex-ai/generative-ai/docs/reference/rest/v1/GroundingMetadata  
   — queries, Search entry point, web chunks, supports, byte offsets, score
   semantics, and current-model score warning.
5. **[S5] Google, Gemini API pricing.**  
   https://ai.google.dev/gemini-api/docs/pricing  
   — date-sensitive free allowance, paid Search request price, per-query note,
   and free/paid product-improvement columns.
6. **[S6] Google, Gemini API Additional Terms of Service.**  
   https://ai.google.dev/gemini-api/terms  
   — unpaid/paid data use, human review, Grounding definitions, output-use and
   display restrictions, storage exceptions, and 30-day grounding processing.
7. **[S7] Google Cloud, Service Specific Terms, Grounding with Google Search.**  
   https://cloud.google.com/terms/service-terms  
   — Cloud Grounded Result/Search Suggestion restrictions, permitted storage,
   derived-query debugging logs, and security-control exception.
8. **[S8] Google Cloud, Generative AI security controls.**  
   https://cloud.google.com/vertex-ai/generative-ai/docs/security-controls  
   — control matrix and grounding-specific exception context.
9. **[S9] Google Cloud, abuse monitoring.**  
   https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/abuse-monitoring  
   — classifiers, flagged-prompt logging up to 90 days, human assessment,
   location/control handling, CMEK exception, account scope, and opt-out.
10. **[S10] Google Cloud, responsible AI and safety controls.**  
    https://cloud.google.com/vertex-ai/generative-ai/docs/learn/safety-overview  
    and https://cloud.google.com/vertex-ai/generative-ai/docs/multimodal/configure-safety-filters  
    — general model limitations, safety filtering, abuse context, and the
    boundary between model-output controls and Search evidence metadata.

## Final decision record

- **ADOPTED:** post-execution query trace, typed calls, claim-to-evidence graph,
  explicit byte-offset semantics, usage accounting, and hard owned task budgets.
- **ADAPTED:** model-led queries, citations, domain/location hints, and publisher
  controls—only with pre-execution policy and immutable owned evidence.
- **REJECTED:** Google as search foundation or evaluation oracle; output/link
  ingestion; opaque Search Suggestion UI; URL-only provenance; implicit query
  authority; support scores as truth; and “real-time” as temporal evidence.
- **DEFERRED:** learned planning/scoring and combined Search/fetch/code/Maps/tool
  graphs pending independent evidence and explicit gates.

**Overall confidence:** high for public contracts, terms, limits, pricing model,
and provenance gaps; medium for the functional retrieval-boundary inference;
low for any hidden ranking, extraction, safety, or citation-generation detail.
The Curiosity decision does not depend on resolving those hidden internals.
