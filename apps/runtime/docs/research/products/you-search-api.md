# You.com Search API and retrieval surfaces: clean-room product dossier

**Research date / source access:** 2026-08-17  
**Status:** documentation-based reverse engineering; not an implementation,
benchmark, endorsement, or legal opinion.  
**Decision frame:** what You.com's public Search, Contents, Answer, and Research
surfaces reveal about separating retrieval, evidence, and synthesis, and which
contract and architecture lessons Curiosity should adopt without depending on
or copying the service.

## Executive verdict

**ADAPT the product-layer separation and evidence ergonomics; REJECT You.com as
Curiosity's owned-search foundation; DEFER any evaluated provider-adapter role
to a separately authorized benchmark and legal review (high confidence).**

The strongest lesson is the explicit product split:

1. **Search** returns ranked web/news records, snippets, optional query-relevant
   highlights, or optional full-page extraction; it does not write an answer.
2. **Contents** starts from caller-supplied URLs and returns cached-or-fetched
   HTML/Markdown.
3. **Answer** performs one managed retrieval/synthesis pass and returns an
   answer, verified citation excerpts, and the web results considered.
4. **Research** autonomously plans multiple searches and page reads, then
   returns a cited answer or constrained JSON.

That is a useful separation of discovery, reading, and generation. It also
shows why these must remain separate Curiosity contracts: raw Search results
are untrusted external evidence, while Answer and Research are vendor-generated
claims. You.com's raw response does not expose capture/version IDs, fetch time,
index snapshot, passage offsets or hashes, canonical/duplicate clusters,
ranking reasons, safety reasons, or coverage warnings. Its hosted index,
ranking, extraction, and synthesis are therefore not an ownership or
provenance substitute.

You.com currently says Search provides direct access to its search index, the
same index used by its own search engine and Research API, and its enterprise
ZDR documentation says API queries do not go to Google or Bing [S3, S12]. That
is meaningful current evidence against direct Google/Bing query forwarding,
but it does **not** disclose crawl sources, index size, refresh distribution,
licensed feeds, other upstream suppliers, or whether every result is discovered
and stored independently. Historical evidence must not be projected forward:
CNET reported that the 2021 consumer engine relied on Bing for many results
[S20]. The transition details remain unknown.

No API calls, credentials, free credits, paid tests, UI scraping, bypasses,
package installation, or private interfaces were used. This matters because
the public Terms prohibit reverse engineering underlying components and place
broad restrictions on automated extraction and competing-service development
[S17]. The report derives behavior only from public documentation, official
examples, an official open-source SDK's published metadata, vendor legal pages,
and one clearly marked historical secondary source.

## 1. Frame, bounded questions, and method

### 1.1 Questions

1. What are the stable request/response contracts and operational bounds of
   Search and Contents?
2. Where is the boundary between retrieval and generated answers?
3. What is supported about the index and upstreams, rather than merely claimed
   by marketing?
4. What do snippets, highlights, full content, citations, freshness, filters,
   and ranking reveal about the likely architecture?
5. Which limits, failures, prices, privacy, and safety controls matter to a
   bounded agent integration?
6. Which ideas may Curiosity adopt clean-room, adapt, reject, or defer?

### 1.2 Evidence rules and limits

- **FACT** means directly documented by You.com or observed in an official
  published artifact. Vendor documentation proves an offered contract, not
  comparative quality or faithful implementation under every condition.
- **INFERENCE** means the simplest architecture explanation consistent with
  documented behavior; it is not a claim about proprietary internals.
- **RECOMMENDATION** is a Curiosity design judgment.
- Confidence labels are **high**, **medium**, or **low**.
- Official API references and guides are primary. Vendor benchmark and product
  claims are labeled as such. CNET [S20] is used only for historical
  triangulation.
- The generated examples in the API reference were not treated as live
  observations. Some example URLs and dates appear illustrative.
- Coverage target: every caller-requested category receives a documented fact,
  an uncertainty boundary, and a Curiosity implication. Stop on coverage and
  source saturation rather than attempting prohibited black-box inference.

## 2. Surface map: retrieval versus generation

| Surface | Endpoint / host | Input starting point | Output | Generation boundary | Verdict |
| --- | --- | --- | --- | --- | --- |
| Web Search | `POST https://ydc-index.io/v1/search`; legacy `GET /v1/search` remains | query | ranked `web` and intent-selected `news`; snippets or extracted highlights/full pages | **Raw retrieval.** No synthesized answer field | **ADAPT** contract ideas |
| Contents | `POST https://ydc-index.io/v1/contents` | up to 10 known URLs | title, URL, requested HTML/Markdown/metadata; null content on per-URL crawl failure | **Raw reading/extraction.** No search or synthesis | **ADAPT** separate read primitive |
| Answer | `POST https://api.you.com/v1/answer` | one question plus retrieval controls | Markdown answer, citation URL + verbatim excerpts, all considered web results | **Generated.** Managed single-search retrieval, reranking/chunking, synthesis and citation verification | **ADAPT** evidence shape; **REJECT** as raw search |
| Research | `POST https://api.you.com/v1/research` plus task/status/SSE endpoints | complex task, effort, source controls, optional schema | cited Markdown or JSON plus sources/snippets | **Generated and agentic.** Multi-search planning, page reads, reasoning, context compaction | **REJECT** as retrieval ABI; study orchestration only |
| Finance Research | `POST https://api.you.com/v1/finance_research` | finance question | generated cited answer from a finance-optimized index | Generated vertical research, not public-web raw retrieval | **OUT OF CORE SCOPE** |
| MCP / SDKs | hosted adapters around the above | tool calls / typed methods | corresponding API outputs | Transport and integration layers; do not change epistemic class | **DEFER** adapter choice |

Sources: [S1–S8]. The host split is also documented by the official Python SDK:
Search and Contents route to `ydc-index.io`; Answer and Research route to
`api.you.com` [S16].

**FACT (high):** You.com itself describes Search as returning results “as-is”
for caller processing, while Research reads, reasons over, and synthesizes them
[S7]. Answer returns both a synthesized answer and the retrieval records it
considered [S6].

**RECOMMENDATION (high):** Curiosity must never normalize these four epistemic
classes into one `content` string. At minimum preserve `retrieval_hit`,
`extracted_document`, `generated_answer`, and `generated_research` as distinct
types with different trust and verification policies.

## 3. Web Search API contract

### 3.1 Request

`POST /v1/search` uses JSON and `X-API-Key`; `GET` still works but will not
receive new features. Extraction is POST-only [S1, S2].

| Field | Documented behavior / bound |
| --- | --- |
| `query` | Required string; supports operators. No current Search query-length bound was found in the public reference. |
| `count` | Default 10, maximum 100 **per section** (`web`, `news`). Thus one classified query can return up to 100 in each section, not necessarily 100 total. |
| `offset` | Page multiplier, `0..9`; e.g. count 5, offset 1 selects the second five-result page. This is not an opaque stable cursor. |
| `freshness` | `day`, `week`, `month`, `year`, or inclusive-looking but not explicitly defined `YYYY-MM-DDtoYYYY-MM-DD`. If the query contains a temporal phrase and a parameter is supplied, the broader timeframe wins. |
| `country` | Enumerated set of 38 ISO-style country codes; geographical focus, not a documented hard origin filter. |
| `language` | Enumerated set of 48 BCP-47-style values; default `EN`. |
| `safesearch` | `off`, `moderate` (default), `strict`; documented as NSFW/content moderation. |
| `include_domains` | Strict allowlist, maximum 500. Mutually exclusive with `exclude_domains` and `boost_domains`; invalid combinations return 422. |
| `exclude_domains` | Filter, maximum 500. May combine with `boost_domains`. |
| `boost_domains` | Maximum 500; gives a fixed relative, unquantified rank boost and does not guarantee inclusion. Cannot combine with `include_domains`. |
| `extraction` | POST-only; `highlights` or `full_page`. Supersedes deprecated `livecrawl`. |
| full-page formats | `markdown`, `html`, or both; default Markdown. |
| `crawl_timeout` | 1–60 seconds, default 10; applies to full-page crawling, not plain retrieval. |
| deprecated `livecrawl` | `web`, `news`, or `all`; still works but no longer developed. |

Sources: [S1, S2, S4, S5].

Supported query syntax is `site:`, `filetype:`, unary `+` and `-`, and Boolean
`AND`, `OR`, `NOT` [S5]. No proximity, field-weight, exact-phrase, result-type,
license, author, publisher-owner, source-class, or content-hash filter is
documented.

### 3.2 Response schema

```text
SearchResponse
  results?
    web?[]
      url?, title?, description?, snippets?[]
      thumbnail_url?, page_age?, favicon_url?
      contents? { html?, markdown?, highlights?[], metadata? }
    news?[]
      title?, description?, page_age?, thumbnail_url?, url?
      contents? { html?, markdown?, metadata? }
  metadata?
    search_uuid?, query?, latency?
```

All principal response fields are optional in the published reference [S2].
Plain search returns short keyword-centered `snippets`; highlight mode omits
snippets and returns query-relevant `contents.highlights`; full-page mode keeps
snippets and adds `contents.markdown` and/or `contents.html` [S1, S2]. News is
not independently requested: a classifier decides whether query intent merits
the `news` section [S1, S4].

`page_age` is semantically weak. The reference calls the web field “age of the
search result,” while news calls it the UTC publication timestamp; examples use
an ISO datetime for both [S2]. It does not identify whether the value came from
publisher metadata, structured data, index observation, or a live fetch.

### 3.3 What is not in the response

**FACT (high):** no documented field provides:

- stable document, capture, passage, publisher, or cluster ID;
- crawl/fetch/first-seen/last-seen timestamp or cache age;
- HTTP status, redirect chain, canonical URL, robots/policy decision, content
  hash, extractor version, or source license;
- rank score, score calibration, rank features/reasons, candidate channel, or
  index/model snapshot;
- duplicate/syndication relation, owner diversity, policy-filter count, corpus
  coverage, omitted-result reason, or partial-shard failure;
- passage offsets/hash or direct linkage from a snippet/highlight to a frozen
  page version;
- an explicit `untrusted_external_data` marker or prompt-injection signal.

**INFERENCE (high):** `search_uuid` is useful request correlation, but is not a
reproducibility token. Reissuing the same query cannot be assumed to address the
same index snapshot or page versions.

## 4. Snippets, highlights, full content, and citations

### 4.1 Three text levels

| Level | Selection | Field | Likely cost/latency class | Evidence quality |
| --- | --- | --- | --- | --- |
| Snippet | keyword-centered fragment | `snippets[]` | included in base search | Discovery context only; no version/offset anchor |
| Highlight | query-relevant passage | `contents.highlights[]` | extraction mode; pricing is not separately stated in the guide | Better prompt context, but still unanchored and method opaque |
| Full page | whole extracted page | `contents.markdown` / `html` | crawl latency; $1/1k pages add-on | More inspectable, but no fetch metadata/version/hash |

Sources: [S1, S2].

**INFERENCE (medium):** default snippets can be served from indexed/previously
processed material because plain search does not enable live crawling.
Full-page mode explicitly crawls each result. The docs do not say whether
highlights always trigger a current page fetch, operate over cached extraction,
or use index-held passages; therefore their freshness and identity are unknown.

### 4.2 Citation boundary

Search has source URLs and excerpts but no citation object. Calling those
“citation-ready” is an ergonomics claim, not immutable provenance.

Answer adds:

```text
answer: Markdown with [[n]] markers
citations[n]: { source: URL, excerpts: [verbatim passage] }
results.web: every web result considered, cited or not
```

You.com says it verifies before returning that each citation exists in source
text and supports the answer [S6, S19]. This is a vendor-reported pipeline
property; no confidence, entailment score, source capture, verifier identity,
or failure report is exposed. The Terms independently warn that outputs may be
incorrect and require verification [S17].

Research instead returns generated `output.content`, a `content_type`, and
`sources[]` containing URL/title/snippets. Inline markers address that source
array [S7]. When structured output is requested, citations are **not** inserted
into the caller's object schema automatically; sources remain separate.

**RECOMMENDATION (high):** Curiosity should adapt the `all considered results`
versus `cited subset` distinction and verbatim citation excerpts, but strengthen
each citation to include capture ID, passage offsets/hash, extractor version,
fetch and publication times, and support/contradict/unclear stance. Generated
answers remain untrusted vendor inference even when citation syntax is valid.

## 5. Contents and known-URL retrieval

`POST /v1/contents` accepts up to 10 URLs, requested formats (`markdown`,
`html`, `metadata`), per-URL `crawl_timeout` 1–60 seconds (default 10), and
optional `max_age >= 0` [S8, S9]. Default `max_age=null` accepts cached content
regardless of age; `max_age=0` forces a fresh fetch. The response is an array
with URL, title, nullable HTML/Markdown, and optional OpenGraph/JSON-LD-derived
metadata. A failed member can have null body fields rather than failing the
whole batch [S8].

Material omissions are per-result fetch status/reason, cache age, actual fetch
time, redirect-terminal URL, canonical URL, content type/size/hash, renderer
use, and policy decision. “Any URL” and JavaScript-heavy-page guidance imply a
fetch/render service, but no SSRF, private-address, redirect, byte,
decompression, malware, robots, or login-wall policy is documented publicly.

**RECOMMENDATION (high):** keep Curiosity's discovery and known-URL read
primitives separate. A read response must include explicit outcome and bounded
diagnostics per URL; never model a null body as enough operational explanation.
Caller-supplied URLs require an egress/SSRF trust boundary independent of search.

## 6. News, filters, freshness, and ranking

### 6.1 News routing

**FACT (high):** the current API exposes no separate news endpoint. The unified
Search classifier includes `results.news` when it recognizes news intent [S4].
News shares count, freshness, geography, language, SafeSearch, domain controls,
and full-page extraction with web search.

**INFERENCE (medium):** this is likely query classification followed by one or
more vertical candidate paths and a sectioned response. It is not evidence that
web and news share identical indexes, rankers, or refresh schedules.

**Curiosity implication:** implicit classification is convenient but can hide a
coverage miss. A provider-neutral response should report which verticals were
queried, which were skipped and why, and whether a caller may explicitly
require news rather than merely hinting through query text.

### 6.2 Freshness semantics

The four presets and date range are simple and useful. The “broader of query
phrase and parameter” rule is surprising: an explicit filter does not always
act as a hard upper bound [S2]. There is no documented time-zone, endpoint
inclusivity, future-date behavior, missing-date policy, or distinction among
published, modified, indexed, fetched, and observed times.

**RECOMMENDATION (high):** Curiosity should not copy this broadening behavior.
Keep caller constraints hard and represent query-derived temporal intent
separately. Return `claimed_published_at`, `claimed_modified_at`, `first_seen`,
`last_fetched`, and confidence/provenance rather than one `page_age`.

### 6.3 Ranking evidence

Documented ranking controls are limited to query/operators, locale/language,
freshness, domain allow/deny, and an unquantified fixed relative domain boost.
The product says results are relevant and that Research evaluates source
freshness, diversity, and relevance [S1, S7]. Answer's launch post names
chunking and reranking as underlying functions [S19].

No public source found here specifies candidate generation, lexical/semantic
mix, link or authority signals, learned ranker, personalization, deduplication,
news blending, spam scoring, boost magnitude, or deterministic tie-breaking.
Vendor accuracy/latency claims and evaluation advice [S10, S19] do not disclose
the raw Search ranking algorithm and were not treated as independent proof.

**INFERENCE (medium):** at least two ranking stages likely exist in generated
surfaces: retrieval ranking, then passage/chunk reranking for synthesis. This
does not establish algorithms or model families.

## 7. Index and upstream evidence

### Supported facts

1. You.com's official Simple Search example says the API gives “direct access”
   to You.com's search index and that the same index powers Research and its own
   search engine [S3].
2. The API is served from an index-branded host, `ydc-index.io`; Contents shares
   that host, while generation endpoints use `api.you.com` [S1, S16].
3. Enterprise ZDR documentation says covered queries do not go to Google or
   Bing [S12]. This is the strongest current upstream statement, although it is
   written in the ZDR context.
4. You.com's 2025 Bing-retirement post positions its APIs as a replacement and
   refers to access to “the web index” [S21]. This is first-party positioning,
   not an independent architecture audit.
5. Historically, CNET reported in November 2021 that the consumer search engine
   relied on Bing for many results and also pulled data from named sources
   [S20]. That statement is secondary and about an earlier product era.

### What cannot be concluded

- “Our index” does not prove an entirely self-crawled corpus, ownership of page
  content, independence from every licensed feed, or absence of non-Google/Bing
  upstreams.
- No primary source found here quantifies indexed documents, hosts, languages,
  crawl throughput, recrawl latency distribution, archive history, or result
  coverage.
- No current source explains when or how the historical Bing dependency ended.
- No source exposes publisher inclusion, robots/noindex/nosnippet, deletion,
  copyright, data-license, or syndication policies for the API corpus.
- No independent benchmark run was authorized; index quality, breadth,
  freshness, latency, and comparative relevance remain unverified.

**Verdict:** treat You.com as a hosted opaque index, not a metasearch API on the
current evidence and not an owned-search component. Confidence is **medium-high**
for “no direct Google/Bing query forwarding in the covered current API path,”
and **low** for any stronger claim about total upstream independence.

## 8. Architecture inference (bounded, non-proprietary)

```text
query + controls
  -> validation / auth / quota
  -> intent classifier (web-only vs web+news)
  -> index-backed candidate retrieval
  -> filtering + ranking + optional domain boost
  -> default indexed snippets
  -> optional extraction branch
       highlights: query-selected passages over unspecified cached/fetched text
       full_page: crawl/extract HTML/Markdown with deadline
  -> sectioned Search response + request UUID + latency

known URLs -> cache-age gate -> fetch/render/extract -> Contents response

question -> Search/retrieval -> page/passage selection + reranking
         -> LLM synthesis -> citation existence/support verification
         -> Answer response

complex task -> budgeted planner -> repeated Search/Contents/Live News/tools
             -> source evaluation + context compaction -> synthesis/schema
             -> Research response or background task/SSE
```

Evidence: classification, extraction and surface behavior [S1, S2, S4, S8];
Answer pipeline [S6, S19]; Research tool selection and budget planning [S7].

This diagram intentionally says nothing about databases, vector stores,
specific models, cloud layout, crawl frontier implementation, or ranking
algorithms. Those are unknown and the Terms prohibit attempts to discover
underlying components [S17].

## 9. Limits, errors, pricing, and lifecycle

### 9.1 Bounds and quota behavior

- Search: maximum 100 results per section per call (the pricing page separately
  describes “1–100 results per call”); offset pages 0–9; 500 domains per list;
  crawl timeout 1–60 s [S1, S2, S18].
- Contents: 10 URLs/request, 1–60 s per-URL timeout [S8].
- Answer: query up to 400 characters; unknown request fields rejected [S6].
- Research: input up to 40,000 characters; effort tiers can exceed 1,000 turns
  and process up to 10 million tokens according to the vendor; `frontier`
  requires background mode [S7].
- Rate-limit quantities depend on subscription and are not publicly enumerated
  by tier. Responses provide `X-RateLimit-Limit`, `Remaining`, and `Reset`; 429
  may include `Retry-After` [S13]. Enterprise custom QPS is sales-negotiated
  [S18].

### 9.2 Errors

The shared documentation lists 400, 401, 402, 403, 404, 422, 429, and 500
[S14]. Material meanings include missing/expired key, insufficient credits or
machine-payment challenge, missing product scope, invalid parameter
combination, quota exhaustion, and auth-middleware failure. Error bodies are not
one stable documented envelope: examples alternate among `detail`, `error`, and
headers. The official SDK also distinguishes transport failures and response
schema-validation failures and does not retry by default [S16].

**Curiosity implication:** map provider failures into stable internal classes
while retaining redacted provider status and retry hints. Never expose keys,
payment headers, bodies containing query content, or provider-specific error
classes to the agent. A 200 with null extracted content is also a partial
failure and needs explicit normalization.

### 9.3 Public pricing on 2026-08-17

| Surface | Public list price |
| --- | ---: |
| Search | $5 / 1,000 calls, up to 100 results per call |
| Full-page extraction with Search | +$1 / 1,000 pages |
| Contents | $1 / 1,000 pages |
| Answer | $5 / 1,000 calls |
| Research lite / standard / deep / exhaustive / frontier | $12 / $50 / $100 / $450 / $1,200 per 1,000 calls |

Sources: [S1, S7, S8, S18]. New-account credit and free-tier statements vary by
page context (`$100` credits; Search free profile or plan 100 queries/day), so
they are onboarding offers, not a durable contract. Volume, annual, enterprise
and QPS terms are negotiated.

The full-page multiplier matters: `count=10` can produce 10 web + 10 news pages,
so the documented example costs $0.005 base + $0.020 extraction = $0.025 [S1].
At maximum section counts, a classified call could in principle request up to
200 page extractions; actual returned and billed behavior was not tested.

### 9.4 Lifecycle signals

GET remains compatible but frozen; POST is the feature path. `livecrawl` is
deprecated in favor of `extraction`. The existence of evolving SDKs, POST-only
features, and terms allowing feature/capacity changes means an adapter must pin
contract versions, run schema drift checks, and tolerate optional fields [S1,
S16, S17].

## 10. Privacy, safety, security, and trust boundaries

### 10.1 Privacy

**FACT (high):** ZDR is optional, enterprise-only, account-wide, and currently
covers Search and Answer—not Contents or Research. Under ZDR, request/response
content is processed only for the short window needed to serve the request, is
not retained or logged beyond that window, is not used to train models, and is
not sold downstream; You.com says queries do not go to Google or Bing [S12].
There is no self-serve toggle; enablement is contractual.

**UNKNOWN:** the standard API retention period, standard API model-training
policy, backup deletion, telemetry fields, regional processing, subprocessors
for each product, and whether `search_uuid` can retrieve retained content. The
general Privacy Policy allows collection of identifiers, IP/device and usage
information, describes service providers including cloud, analytics, account
and LLM vendors, and advises users not to submit sensitive regulated data
[S15]. It is broader than the API-specific ZDR promise.

**RECOMMENDATION (high):** assume non-ZDR queries and retrieved pages may be
retained until a reviewed DPA/MSA says otherwise. Do not send secrets,
restricted personal data, private URLs, tenant identifiers, or internal corpus
content. ZDR coverage must be verified per endpoint in writing; Search ZDR does
not make a later Research call ZDR-compliant.

### 10.2 Safety and content trust

Search exposes only a coarse NSFW `safesearch` control. Public API docs do not
describe malware screening, prompt-injection detection, PII/secret filtering,
publisher takedown, spam labels, policy reason codes, or per-hit trust. Contents
can fetch caller-selected URLs, expanding SSRF and malicious-parser/render risk,
but public docs do not state the egress controls.

Answer's citation verifier addresses citation existence/support, not source
truth, malicious instructions, poisoned pages, omission bias, or answer safety.
The vendor Terms explicitly say outputs may be inaccurate, incomplete,
incorrect, or offensive and should not be a sole source of truth [S17].

**RECOMMENDATION (high):** every Search/Contents field and generated answer must
be marked untrusted. Strip active content; bound bytes, item counts and strings;
separate instructions from evidence; prevent retrieved text from changing tool
authority; and require primary-source verification for consequential claims.

## 11. Clean-room lessons and Curiosity implications

### Adopted

1. **Separate search, read, and synthesize contracts.** Search-by-query and
   read-known-URL are different capabilities and threat models.
2. **Return all considered evidence as well as cited evidence.** This supports
   auditing selection and omissions.
3. **Use tiered text detail.** Metadata/snippet, bounded relevant passage, and
   full document are useful explicit cost/latency choices.
4. **Expose hard budgets.** Item count, content detail, deadline, branch budget,
   and aggregate tool budget should be caller-controlled.
5. **Keep source controls typed.** Include, exclude, and boost have different
   semantics and should not be overloaded into query syntax.
6. **Use per-result partial outcomes.** Adapt Contents' batch resilience, but
   add typed failure reasons and provenance.

### Adapted, not copied

1. Replace `page_age` with explicit temporal fields and provenance.
2. Replace offset paging with a snapshot-bound cursor where reproducibility is
   required.
3. Anchor snippets/highlights to immutable capture + passage identifiers.
4. Report vertical routing, filters, policy drops, coverage and partial failures.
5. Keep provider request UUID as an operational trace only; add Curiosity's own
   request/frame/branch/index-snapshot IDs.
6. Expose bounded rank reason classes (lexical match, freshness, source boost,
   diversity) without pretending vendor scores are portable.
7. Model generated citations as claims over evidence, not as proof.

### Rejected

1. **Hosted opaque index as owned foundation.** It cannot satisfy owned corpus,
   rank control, deletion lineage, or capture-level provenance.
2. **One generic `content` field.** It erases retrieval/generation boundaries.
3. **Implicit news-only routing with no trace.** Caller intent and coverage
   become unverifiable.
4. **Broadening explicit freshness from query language.** Hard caller
   constraints must remain hard.
5. **Search snippets as citations.** URLs and strings without capture anchors
   are discovery evidence only.
6. **Provider-generated Answer/Research inside the retrieval core.** These are
   optional downstream inference providers, never the neutral search ABI.

### Deferred

1. A provider adapter for transitional evaluation, only after contract/ToS,
   privacy, data-use, and endpoint-specific ZDR review.
2. Reproducible comparative quality/latency/freshness testing on an authorized
   query set; vendor benchmarks are insufficient.
3. MCP or SDK adoption; direct HTTP is simpler evidence of the contract and an
   adapter decision should follow—not drive—the domain model.

### Proposed provider-neutral mapping

```text
SearchRequest
  query, max_results_total, verticals_required[], locale, hard_time_range
  source allow/deny/prefer, evidence_detail, deadline, cost_budget
  frame_id, branch_id, parent_branch_id

SearchHit
  document_id, capture_id, passage_id
  fetched_url, terminal_url, declared_canonical_url, cluster_id
  title, snippet/highlight, passage_offsets, passage_hash
  claimed_published_at, first_seen_at, fetched_at
  source_type, publisher_owner_cluster
  retrieval_channels[], bounded_rank_reasons[]
  trust = untrusted_external_evidence

SearchResponse
  request_id, index_snapshot_id, hits[]
  queried/skipped verticals, coverage/freshness warnings
  policy_filter counts, partial failures, next snapshot-bound cursor

GeneratedAnswer
  answer text/object, generator/model/prompt-policy version
  considered_evidence_ids[], citation edges[]
  unsupported/contradictory/unresolved claims[]
  trust = untrusted_generated_inference
```

## 12. Fact / inference / recommendation ledger

| ID | Type | Claim | Confidence | Origin / check | Verdict |
| --- | --- | --- | --- | --- | --- |
| L1 | FACT | Search returns sectioned web and classifier-selected news records; no answer field. | High | API reference + guide [S1, S2, S4] | **ADOPT boundary** |
| L2 | FACT | POST is the evolving Search path; GET and `livecrawl` remain but are frozen/deprecated. | High | [S1, S2] | **ADAPT lifecycle handling** |
| L3 | FACT | Snippets, highlights and full pages occupy three explicit content levels. | High | [S1, S2] | **ADOPT concept** |
| L4 | FACT | Answer returns generated text, citations with verbatim excerpts, and considered web results. | High | [S6, S19] | **ADAPT evidence shape** |
| L5 | FACT | Research is autonomous multi-search/read/synthesis, not raw retrieval. | High | [S7] | **REJECT as search ABI** |
| L6 | FACT | You.com says Search directly accesses its index and ZDR queries do not go to Google/Bing. | Medium-high | First-party [S3, S12], historical contrast [S20] | **Treat as opaque hosted index** |
| L7 | INFERENCE | Search/Contents form an index/extraction data plane distinct from Answer/Research orchestration. | Medium-high | Hosts + behavior [S1, S6–S8, S16] | **ADAPT plane separation** |
| L8 | INFERENCE | Default snippets likely use indexed/previously processed text; highlight fetch/cache behavior is unknown. | Medium | No crawl flag for snippets; docs silent for highlights | **Require freshness metadata** |
| L9 | FACT | Raw records lack immutable capture/passage provenance and rank/coverage trace. | High | Exhaustive field comparison [S2, S8] | **REJECT direct domain model** |
| L10 | FACT | ZDR excludes Contents and Research today. | High | [S12] | **Endpoint-specific privacy gate** |
| L11 | FACT | SafeSearch is coarse NSFW moderation; no public prompt-injection or trust marker is documented. | High | [S1, S2] plus negative documentation check | **Add Curiosity controls** |
| L12 | RECOMMENDATION | Keep Search, Contents, Answer, and Research as distinct epistemic types. | High | L1–L5 | **ADOPTED** |
| L13 | RECOMMENDATION | Do not use You.com as the owned search foundation. | High | Hosted opaque corpus/ranking and provenance gaps | **REJECTED foundation** |
| L14 | RECOMMENDATION | Consider only an evaluated adapter after legal/privacy authority. | High | Terms [S17], no current benchmark | **DEFERRED** |

## 13. Unknowns and reproducibility checks

### Blocking unknowns

1. Exact current index composition, size, language/region coverage, crawl and
   licensed-feed inputs, recrawl distribution, and deletion/takedown behavior.
2. Whether highlights use current fetches, cached extraction, or index passages;
   their separate billing and failure semantics.
3. Standard (non-ZDR) request/response retention and training policy by API.
4. Search query length, exact date-range boundaries/time zone, and count minimum
   in the currently served schema.
5. Ranker stages/signals, personalization, deduplication, spam policy, news
   blending, and domain-boost magnitude.
6. Whether `count=100` plus news intent can bill 200 full-page extractions and
   how failed/duplicate pages are charged.
7. SLA/SLO, regional endpoints, response/body limits, max snippet/highlight/full
   page sizes, and timeout behavior for the overall request.
8. Robots, publisher controls, copyright/license treatment, SSRF/redirect and
   renderer isolation for Contents/full-page extraction.

### Checks performed

- Cross-checked the Search guide against the generated endpoint reference for
  parameters, optional fields, deprecations, and examples [S1, S2].
- Cross-checked Search/Contents host routing and SDK behavior against the
  official Python SDK metadata/repository [S16].
- Cross-checked price statements between product guides and pricing page [S1,
  S7, S8, S18].
- Cross-checked the raw/generated boundary across Search, Answer, and Research
  primary guides [S1, S6, S7].
- Triangulated current no-Google/Bing language with historical Bing reporting,
  retaining the contradiction rather than inferring an undocumented migration
  date [S12, S20].
- Checked errors, rate-limit headers, ZDR, general privacy, and terms separately
  rather than deriving operational policy from marketing [S12–S17].
- Did **not** send any request to API hosts; documentation examples are not
  represented as observations.

### Negative results retained

- No current primary source found here states that every result comes from an
  independently crawled You.com corpus or names all upstream/feed suppliers.
- No public index-scale or crawl-freshness distribution was found.
- No ranking algorithm, score semantics, candidate-generation method, or boost
  magnitude was found.
- No capture-level provenance, snippet/highlight offsets, content hash, or
  reproducibility contract was found.
- No standard API retention duration was found; only optional ZDR behavior is
  explicit.
- No independent evidence was found validating You.com's comparative accuracy,
  freshness, or latency claims; no vendor superiority claim was adopted.
- No public Search-specific prompt-injection, malware, SSRF, robots, or
  publisher-rights contract was found.

## 14. Bounded curiosity pass and stop decision

Scores: 1 low/cheap, 5 high/expensive. Only in-frame threads authorized by the
caller were considered.

| Thread | Relevance | Value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Reconcile “own/direct index” with historic Bing dependency | 5 | 5 | 4 | 2 | **Pursued:** current primary ZDR/direct-index statements plus 2021 secondary evidence; transition remains unknown. |
| Verify highlights versus full-page semantics | 5 | 5 | 4 | 1 | **Pursued:** current POST reference establishes response differences but leaves fetch/cache and pricing unknown. |
| Check endpoint-specific ZDR scope | 5 | 5 | 3 | 1 | **Pursued:** only Search and Answer are covered; Contents/Research excluded today. |
| Infer proprietary ranker/model/crawler internals | 2 | 2 | 4 | 5 | `CURIOSITY_NO_GO`: terms boundary, no decision value, and no authorized black-box tests. |
| Run free/paid API comparisons | 4 | 5 | 3 | 5 | `CURIOSITY_NO_GO`: caller prohibited tests/credentials; requires benchmark plan, legal authority and reproducible corpus. |
| Inspect private endpoints or consumer network traffic | 1 | 1 | 3 | 5 | `CURIOSITY_NO_GO`: outside public API scope and clean-room/access boundaries. |
| Resolve all contract terms through legal interpretation | 5 | 5 | 2 | 5 | `CURIOSITY_NO_GO`: counsel task; this report only flags Terms/DPA/MSA review. |
| Benchmark vendor accuracy claims | 4 | 4 | 2 | 5 | `CURIOSITY_NO_GO`: independent run absent and vendor examples are not evidence. |

**Coverage:** API schema, index/upstream evidence, snippets/content/citations,
filters/freshness, ranking, limits/errors/pricing, privacy/safety, architecture
inferences, clean-room lessons, Curiosity implications, ledger, unknowns and
checks are covered.

**Saturation:** additional official pages repeated the same contract and
marketing claims without disclosing index, ranking, or provenance internals.

**Stop:** coverage and source saturation reached. Pursuing the remaining gaps
would require live tests, credentials, contract/counsel access, or prohibited
internal discovery, none authorized by the caller.

## 15. Sources

All sources accessed 2026-08-17. Primary sources are You.com documentation or
official artifacts unless marked otherwise.

1. **[S1] You.com, Web Search API Overview.**
   https://you.com/docs/guides/search.md — product behavior, content levels,
   filters, POST lifecycle, pricing and ZDR pointer.
2. **[S2] You.com, `POST /v1/search` API reference.**
   https://you.com/docs/api-reference/search/v1-search.md — authoritative
   request/response fields, deprecations, validation combinations and examples.
3. **[S3] You.com, Simple Search example.**
   https://you.com/docs/examples/simple-search.md — direct/same-index claim and
   raw-results usage boundary.
4. **[S4] You.com, Get live news.**
   https://you.com/docs/guides/live-news.md — intent-classified unified news,
   fields and controls.
5. **[S5] You.com, Search operators.**
   https://you.com/docs/guides/search-operators.md — supported operator syntax.
6. **[S6] You.com, Answer API Overview.**
   https://you.com/docs/guides/answer.md — single-pass synthesis, citation
   excerpts, considered results, controls and limits.
7. **[S7] You.com, Research API Overview.**
   https://you.com/docs/guides/research.md — agentic retrieval, effort tiers,
   source controls, structured output, task mode and pricing.
8. **[S8] You.com, Contents API Overview.**
   https://you.com/docs/guides/contents.md — known-URL workflow, 10-URL batch,
   cache freshness, partial failures and pricing.
9. **[S9] You.com, `POST /v1/contents` API reference.**
   https://you.com/docs/api-reference/contents.md — request/response schema and
   cache/timeout parameters.
10. **[S10] You.com, How to Evaluate Web Search API.**
    https://you.com/docs/guides/evaluate-us.md — vendor evaluation methodology;
    used as methodology evidence, not proof of quality.
11. **[S11] You.com documentation index.**
    https://you.com/docs/llms.txt — current surface inventory and official raw
    reference links.
12. **[S12] You.com, Zero Data Retention.**
    https://you.com/docs/administration/zero-data-retention.md — covered APIs,
    retention/training/downstream assertions and enterprise boundary.
13. **[S13] You.com, Rate Limits.**
    https://you.com/docs/using-the-api/rate-limits.md — headers, 429 and retry
    guidance.
14. **[S14] You.com, Errors.**
    https://you.com/docs/using-the-api/error-code-reference.md — status classes,
    sample bodies and machine-payment distinction.
15. **[S15] You.com, Privacy Policy (dated 2024-12-10 on page).**
    https://you.com/privacy — general collection, uses, vendors, sensitive-data
    warning and user rights; not a substitute for API-specific agreements.
16. **[S16] You.com official Python SDK 3.1.1, published metadata/repository.**
    https://pypi.org/project/youdotcom/ and
    https://github.com/youdotcom-oss/youdotcom-python-sdk — host routing,
    retries/errors, debug-body warning and MIT SDK boundary.
17. **[S17] You.com, Terms & Conditions.**
    https://you.com/legal/terms — access, reverse engineering, automation,
    competing-use, output verification, modification and third-party boundaries.
18. **[S18] You.com, API Pricing.**
    https://you.com/pricing — public prices, free plan, enterprise/ZDR/SOC 2 and
    custom-QPS marketing statements.
19. **[S19] You.com, “Introducing the You.com Answer API,” 2026-08-05.**
    https://you.com/resources/introducing-the-ydc-answer-api — first-party
    launch architecture and benchmark claims; not independent validation.
20. **[S20] CNET, “You.com search challenges Google…,” 2021-11-09
    (secondary).**
    https://www.cnet.com/tech/services-and-software/you-com-search-challenges-google-with-a-new-look-and-private-mode/
    — historical Bing/source reliance only.
21. **[S21] You.com, “The End of Microsoft's Bing Search APIs…,” dated
    2025-08-12.**
    https://you.com/resources/the-end-of-microsofts-bing-search-apis-seamlessly-migrate-to-you-coms-trusted-search-api-solutions-1
    — first-party replacement positioning and web-index language.
