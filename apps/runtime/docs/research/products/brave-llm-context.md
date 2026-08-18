# Brave LLM Context: clean-room product anatomy

**Research date / source access date:** 2026-08-17  
**Product boundary:** Brave Search API `GET|POST /res/v1/llm/context` only. Brave
Web Search is discussed only as an upstream dependency disclosed by Brave;
Brave Answers is discussed only to establish that this endpoint does not
generate an answer.  
**Status:** primary-source desk research and architecture inference; no API
account, credential, paid request, endpoint probing, benchmark, source-code
inspection, bypass, or implementation.  
**Decision frame:** what contract and retrieval ideas Curiosity should learn
from LLM Context without making a hosted provider, its proprietary index, or
its terms-restricted results part of Curiosity's owned foundation.

## Executive verdict

**ADAPTED, not adopted as a foundation (high confidence).** LLM Context is a
hosted, query-to-passages retrieval product. A single request searches Brave's
proprietary Web index, selects up to a caller-sized candidate set, extracts
query-relevant material from selected pages into heterogeneous “smart chunks,”
reranks those chunks, and packs them under approximate global and per-URL token
budgets. It returns raw source material grouped by URL, not a generated answer.
The strongest ideas for Curiosity are the explicit distinction between
candidate count and returned-source count, global and per-source budgets,
precision/recall threshold modes, source-policy reranking, typed local lanes,
and source metadata kept outside passage text [S1][S3].

The endpoint is **not** a sufficient provenance contract. Its response gives a
URL, title, snippets and modest URL-level metadata, but no passage identifiers,
character/DOM offsets, content or capture hashes, retrieval scores, fetch time,
index version, extraction version, canonical-document relation, ranking trace,
date provenance, or explicit mapping from a claim to a passage. “Grounding” is
therefore the vendor's name for retrieved context, not proof that downstream
claims are true or faithfully cited. The returned snippets remain untrusted
third-party content [S1][S9].

The public commercial terms are also a hard boundary. At the accessed date the
Search plan is $5 per 1,000 successful requests, includes $5 monthly credit and
lists 50 requests/second. Token volume does not change Brave's request price,
but does change downstream model latency and inference cost [S5][S6]. Standard
terms prohibit non-transient storage/cache/database creation, derivative works,
redistribution, and using Search Results to create, evaluate, train, fine-tune,
benchmark, or improve AI models or services [S9]. Any production use or quality
evaluation therefore needs legal/procurement review and, where necessary,
negotiated terms; this report does not authorize either.

## 1. Frame, bounded questions, and method

### 1.1 Questions

1. What is the exact public request/response contract and where are its bounds?
2. How are candidate pages, passages, and token budgets apparently selected?
3. What source, date, and provenance information survives the hosted pipeline?
4. How does the endpoint relate to Brave's index, extraction, cache, and
   freshness claims?
5. What are the documented errors, versioning, rate, pricing, safety, privacy,
   and use restrictions?
6. Which architecture conclusions are facts, which are inferences, and which
   remain unknown without prohibited or paid testing?
7. Which concepts should Curiosity adopt, adapt, reject, or defer under its
   provider-neutral, bounded, untrusted-result architecture?

### 1.2 Evidence discipline and limits

- **FACT** means directly stated in an accessed Brave documentation, API
  reference, policy, public repository, or product page.
- **INFERENCE** means the smallest architecture conclusion consistent with
  multiple facts; it is not a claim about Brave's private implementation.
- **RECOMMENDATION** is a Curiosity design choice, not a Brave capability claim.
- Confidence is **high**, **medium**, or **low**.
- Primary Brave sources were preferred. Marketing performance and scale claims
  establish what Brave says, not independently verified quality.
- Public documentation was read as published. No Search Results were obtained
  from the authenticated API, preserving the clean-room and terms boundary.
- “Current pipeline” below means the default API behavior documented after the
  2026-07-31 change. Callers can pin `Api-Version: 2026-02-06` to retain the
  prior extraction pipeline, but its internal behavior is not described [S1].

**Stop condition:** coverage of every requested category, contract fields and
limits, material policy constraints, explicit unknowns, and one bounded
curiosity pass. Comparative provider research, live quality measurement, and
private implementation details are out of frame.

## 2. Product boundary and contract

### 2.1 What it is—and is not

**FACT (high):** LLM Context accepts a search query and returns pre-extracted,
relevance-ranked Web content for a caller's own agent, RAG pipeline, or model.
It supports GET and POST at
`https://api.search.brave.com/res/v1/llm/context`; POST takes the same
parameters in a JSON body. Authentication is an `X-Subscription-Token` header.
Gzip is supported [S1][S2][S3].

**FACT (high):** Brave describes each request as one search. The output is raw
extracted material, not an AI-written answer. This distinction matters:
downstream synthesis, citation, uncertainty, and safety remain the customer's
responsibility [S1][S3].

**INFERENCE (high):** the endpoint is best modeled as a hosted
`query -> bounded evidence candidates` service, not as a search-results UI and
not as an answer engine. Its public contract is passage-oriented even though
its output groups passages under URL objects.

### 2.2 Request contract

The following is the union of the service guide and GET API reference. POST
uses the same fields in JSON [S1][S2].

| Field/header | Type; default | Documented bound or semantics |
| --- | --- | --- |
| `q` | string; required | 1–400 characters and at most 50 words. |
| `country` | enum/string; `US` | Supported two-character result country; the official skill also lists `ALL`. |
| `search_lang` | enum/string; `en` | Supported language preference, code length 2+. |
| `count` | integer; `20` | 1–50 **search results considered** for context selection; not a response-URL promise. |
| `spellcheck` | boolean; `true` | Whether to spellcheck before searching. |
| `freshness` | string; empty | `pd`, `pw`, `pm`, `py`, or `YYYY-MM-DDtoYYYY-MM-DD`. |
| `maximum_number_of_urls` | integer; `20` | 1–50 distinct response URLs. |
| `maximum_number_of_tokens` | integer; `8192` | Approximate total context limit, 1,024–32,768. |
| `maximum_number_of_snippets` | integer; `50` | Accepted range 1–256, but not constraining in the current pipeline when the token budget permits more snippets. |
| `maximum_number_of_tokens_per_url` | integer; `4096` | 512–8,192 per URL. |
| `maximum_number_of_snippets_per_url` | integer; `50` | Accepted range 1–100, but not constraining in the current pipeline when the token budget permits more snippets. |
| `context_threshold_mode` | enum; unset | `strict`, `balanced`, `lenient`, `disabled`; unset invokes a calibrated default. The official skill says the current unset default resolves to `lenient`, while the service guide intentionally abstracts it. |
| `safesearch` | enum; unset | `off`, `moderate`, `strict`; unset means **no adult filtering**, except local recall remains strict. |
| `enable_local` | boolean/null; unset | Auto-detect local recall from any location header; `true` forces it, `false` forces standard ranking. |
| `goggles` | string or list; unset | Hosted URL or inline custom ranking/filter rules; API reference caps at three Goggles. |
| `enable_source_metadata` | boolean; `false` | Adds site name, favicon, thumbnail, and description. |
| `X-Loc-Lat`, `X-Loc-Long` | numbers | Latitude -90…90, longitude -180…180. |
| `X-Loc-City`, `X-Loc-State`, `X-Loc-State-Name`, `X-Loc-Country`, `X-Loc-Postal-Code` | strings | Optional location context. Coordinates take priority according to the official skill. |
| `Api-Version` | date string; latest | Pins dated API behavior; omitted means latest. |
| `Cache-Control` | `no-cache` | Asks Brave not to use cached content; documented as best effort only. |
| `User-Agent` | string | May alter experience by originating device. |

**FACT (high):** the guide's task examples suggest `count/max_tokens` of
`5/2048` for simple factual queries, `20/8192` for standard queries, and
`50/16384` for complex research. These are vendor heuristics, not capacity or
quality guarantees [S1][S3].

**Important contract anomaly — FACT (high):** after the 2026-07-31 pipeline
change, the two snippet-count parameters “no longer constrain the response when
the token budget allows more snippets.” Their accepted numeric bounds therefore
do not currently behave as hard output ceilings in all cases. Token limits are
the binding controls [S1]. A provider-neutral integration must not falsely map
these fields to a hard `max_passages` guarantee.

### 2.3 Response contract

The standard shape is [S1][S3]:

```json
{
  "grounding": {
    "generic": [
      {
        "url": "https://example.com/page",
        "title": "Page Title",
        "snippets": ["text or JSON-serialized structured content"]
      }
    ],
    "map": []
  },
  "sources": {
    "https://example.com/page": {
      "title": "Page Title",
      "hostname": "example.com",
      "age": [
        "Monday, January 15, 2024",
        "2024-01-15",
        "relative age",
        "2024-01-15T13:45:02Z"
      ]
    }
  }
}
```

With local recall, `grounding.poi` may be an object and `grounding.map` may
contain place objects. Each may carry `name`, `url`, `title`, and `snippets`.
`sources` remains keyed by URL [S1][S3].

With source enrichment enabled, documentation names `site_name`, `favicon`,
`thumbnail`, and the page's query-independent `description`; the official
skill additionally documents a possible best `snippet` field. Consumers must
allow additive fields because Brave treats new response properties as
backwards-compatible changes [S3][S4].

**FACT (high):** snippets are heterogeneous strings. They may contain ordinary
text or JSON-serialized tables, schemas, or code blocks. The response does not
type each snippet's content format [S1][S3].

**FACT (high):** an HTTP 200 with an empty `grounding.generic` array means no
relevant content was found and is an expected outcome, not necessarily an
error [S1].

**INFERENCE (high):** URL-keyed `sources` is a useful normalization table, but
using a mutable URL as both lookup key and evidence identity conflates locator,
document, capture, and version. It also cannot distinguish two captures of the
same URL.

## 3. Passage and context selection

### 3.1 Publicly disclosed pipeline

Brave discloses this sequence [S6]:

1. Perform standard search over Brave's independent index to identify relevant,
   “qualitative” pages.
2. “Dig deep” into each page's content in real time and convert raw HTML to
   smart chunks.
3. Produce query-optimized clean-text/markdown passages and specialized
   extractions for structured data (JSON-LD, item properties, tables down to
   rows), code, forum discussions, and YouTube captions.
4. Rank chunks with an in-house system trained to identify material relevant to
   the query.
5. Compile the final response under caller configuration such as total tokens,
   per-URL contribution, source count, and threshold.

**FACT (high):** `count` controls the maximum initial result set considered;
`maximum_number_of_urls` separately caps output diversity; strict/balanced/
lenient/disabled controls inclusion threshold; Goggles rerank, downrank, boost,
or discard URLs before final context selection [S1][S2][S7].

### 3.2 Architecture reconstruction

The minimum architecture consistent with the contract is:

```text
validated query + locale + optional location + optional source policy
  -> optional spell correction
  -> Brave index retrieval/ranking (candidate URLs <= count)
  -> Goggles URL-level filtering/reranking
  -> page-content access / extraction pipeline
  -> heterogeneous smart chunks per URL
  -> query-dependent chunk scoring
  -> relevance threshold
  -> constrained packing:
       output URLs <= maximum_number_of_urls
       approximate total tokens <= maximum_number_of_tokens
       approximate URL tokens <= maximum_number_of_tokens_per_url
       local/map/global allocation when relevant
  -> group selected chunks by URL
  -> grounding + URL-keyed source metadata
```

**INFERENCE (high):** there are at least two ranking domains: document/URL
ranking for candidate generation and chunk ranking for context assembly. Goggles
acts on the former (“on top of Brave's search index”), while threshold and token
packing act on extracted chunks [S2][S6][S7].

**INFERENCE (medium):** context packing is likely a constrained relevance/
diversity optimization rather than simple top-N truncation. Evidence: separate
global and per-URL budgets, a URL cap, relevance thresholds, and Brave's claim
that local/map/global lanes share the token budget [S1][S6]. The objective,
tie-breaking, deduplication, and diversity penalty are not public.

**INFERENCE (medium):** grouping snippets under URLs discards or obscures the
global chunk order mentioned in marketing. A caller can observe response URL
and per-URL snippet order but receives no score or rank trace proving how one
chunk compared with another.

### 3.3 Token semantics

**FACT (high):** the global token limit is explicitly *approximate*. The public
docs do not name a tokenizer, model vocabulary, encoding, treatment of JSON,
whether titles/URLs/source metadata count, or how estimate error is bounded
[S1][S2].

**FACT (high):** selection considers the token budget and prioritizes relevant
data to fit it. The public request price is per request, not per context token;
Brave advises smaller budgets to reduce response latency and the customer's own
model inference cost [S1][S5][S6].

**INFERENCE (high):** `maximum_number_of_tokens` must not be used as a hard
downstream model-context guarantee. Curiosity would still need exact local
serialization/token counting and safety reserve after normalization.

**INFERENCE (medium):** large serialized tables can dominate an approximate
budget while counting as one snippet. This explains why token ceilings are more
meaningful than passage counts, but also makes schema-aware truncation and
prompt-size checks necessary downstream.

## 4. Index, content access, cache, and freshness

### 4.1 Index relationship

**FACT (high):** LLM Context is not independent of search retrieval. Brave says
every request first searches its proprietary, independent Web index, then
extracts and reranks content from top pages [S6]. As of the accessed product
page, Brave advertises an index over 30 billion pages and more than 100 million
page updates daily; a January 2026 post instead said more than 35 billion pages
and tens of millions of daily new/updated pages [S10][S11]. These changing
marketing figures are not an audited coverage or per-document freshness SLA.

**FACT (high):** Brave's security page says it knows over 100 billion URLs but
indexes 20 billion-plus, selecting pages using privacy-preserving real-user
visitation, links/reputation transfer, and curated RSS feeds. The differing
20B+/30B+/35B figures likely reflect different dates or definitions, but the
sources do not reconcile them [S8][S10][S11].

**FACT (high):** the Web Discovery Project is an opt-in, unlinkable signal path
for page discovery and relevance. It can contribute visited URLs, engagement,
query/click aggregates and page metadata; some clients can perform isolated
crawler fetch jobs for preselected public domains [S12]. This supports index
discovery/ranking, but the LLM Context contract does not expose whether a
particular result came through that path.

### 4.2 “Real time” is layered, not a timestamp

**FACT (high):** Brave says page content is processed “in real time,” but the
API reference also says Brave returns cached content by default and honors
`Cache-Control: no-cache` only on a best-effort basis [S2][S6].

**INFERENCE (high):** “real time” should be read as query-time pipeline
execution, not proof of an origin fetch at request time. The source could be
index-held, extraction-cached, response-cached, freshly fetched, or some
combination; public documentation does not distinguish these states.

**FACT (high):** `freshness` filters candidate search results using the “most
relevant date reported by the content,” such as publication or last-modified
date. The `sources[url].age` array renders that selected page date in four
formats; an empty array means unknown [S1][S2].

**INFERENCE (high):** source `age` is a content date, not a crawl timestamp,
fetch timestamp, first-seen date, last-seen date, index-update time, or proof
that the returned passage existed on that date. It can be absent or wrong when
publishers omit/misstate metadata. The relative-age rendering also changes with
request time while no explicit response timestamp is documented.

**RECOMMENDATION (high):** Curiosity should separate at least
`claimed_published_at`, `claimed_modified_at`, `first_seen_at`, `fetched_at`,
`indexed_at`, and `retrieved_at`, each with origin and confidence. A date filter
must state which temporal field it applies to.

## 5. Grounding, provenance, and citation fitness

### 5.1 What survives

At the accessed version, a generic evidence unit carries:

- source URL and page title;
- one or more query-selected snippet strings;
- URL-level title and hostname in a separate source map;
- an optional, content-derived page age/date tuple;
- optionally, site name, favicon, thumbnail, and page description;
- optional local POI/map typing [S1][S3].

This is enough to display a source list and retain URL association for each
snippet. It is substantially richer than a title plus one display snippet.

### 5.2 What does not survive publicly

No public response field documents:

- stable document, capture, passage, or publisher identifiers;
- canonical URL, redirect chain, mirror/near-duplicate cluster, or ownership
  cluster;
- source byte/DOM/text offsets, section path, line range, or quote hash;
- raw-capture hash, extracted-content hash, extractor name/version, or index
  manifest/version;
- crawl/fetch/observe time or whether content came from cache;
- URL score, chunk score, global chunk rank, threshold value, or selection
  reason;
- requested versus spell-corrected query in the response;
- content MIME/language/license, paywall/subscription state, or robots basis;
- explicit primary/secondary source class, authority/confidence, or
  independence/syndication relation;
- per-passage safety, malware, adult, prompt-injection, or truncation marker;
- total actual/estimated token usage, omitted-context count, or
  budget-exhaustion reason;
- a claim-to-passage citation object.

**INFERENCE (high):** citations built from this response can be URL-grounded but
not capture-grounded. If a page changes, the API response gives no public field
with which to prove the cited text was present in a particular version.

**INFERENCE (high):** duplicate passages, syndicated claims, and ten URLs owned
by one publisher can look like independent corroboration unless the consumer
adds its own clustering and source analysis.

**RECOMMENDATION (high):** treat provider URLs and snippets as discovery
evidence only. Curiosity's owned evidence model should anchor normalized
passages to immutable captures and extractor versions, preserve provider rank
as a non-authoritative signal, and require downstream claim-to-passage links.

## 6. Bounds, errors, evolution, and operations

### 6.1 Documented bounds

**FACT (high):** request-level bounds include a 400-character/50-word query,
50 candidate results, 50 output URLs, 32,768 approximate total tokens, 8,192
tokens per URL, and up to three Goggles [S1][S2][S7]. Location coordinates also
have numeric ranges. The snippet-count controls are not reliable hard ceilings
under the current pipeline [S1].

**UNKNOWN:** no public LLM Context limit was found for compressed or
uncompressed response bytes, title/snippet string length, total metadata size,
redirect count, server processing timeout, number of local/map objects, or
maximum inline Goggle length at this endpoint. Goggles files separately allow
up to 2 MB, 100,000 instructions, and bounded instruction/wildcard lengths [S7].

**FACT (high):** Brave recommends a client timeout of 30 seconds, exponential
backoff for transient failures, graceful handling of empty results, and
watching rate-limit headers. That is client guidance, not a 30-second server
SLA [S1].

### 6.2 Errors and quota

**FACT (high):** the API reference explicitly lists 200, 400, 403, 404, 422,
and 429 response schemas. Error responses have top-level `type`, required
`error`, and `time`; the accessed rendered reference did not expose a stable
complete child schema or error-code catalogue [S2].

**FACT (high):** rate limits use a per-subscription one-second sliding window.
Responses expose `X-RateLimit-Limit`, `-Policy`, `-Remaining`, and `-Reset` for
burst and monthly windows. Exceeding the limit yields 429. Only successful,
non-error requests count against quota and billing [S5].

**INFERENCE (high):** a robust adapter needs a bounded retry policy keyed to
status and reset headers; it must not blindly retry malformed 400/422 requests
or turn an empty 200 into a retry storm. Logs and caller-visible diagnostics
must redact the subscription token and sensitive query/location data.

### 6.3 Version drift

**FACT (high):** omitting `Api-Version` opts into the latest behavior. Brave
considers adding optional inputs, adding response properties, property
reordering, and changing string length/format backwards compatible. Removing,
renaming, or changing field types is incompatible [S4].

**FACT (high):** the 2026-07-31 default extraction-pipeline replacement changed
selection semantics and source metadata without changing the major `/v1` path;
pinning `2026-02-06` retains the older pipeline [S1].

**RECOMMENDATION (high):** any evaluation must pin `Api-Version`, record it with
every result, allow unknown additive fields, and separately version local
normalization. A major URL version alone is not reproducibility.

## 7. Pricing, contractual use, and ownership boundaries

### 7.1 Public pricing

**FACT (high, as of 2026-08-17):** LLM Context is included in the Search plan at
$5 per 1,000 successful requests, with $5 monthly credit and listed capacity of
50 requests/second. The endpoint has no separate per-token Brave charge. Larger
responses can still increase transfer, latency, and the customer's own LLM
input cost [S1][S5][S6][S10]. The privacy notice says all subscription plans
require payment information as an anti-abuse measure [S13].

**UNKNOWN:** the launch post says receiving free monthly credit requires Brave
attribution, while the accessed pricing page presents the credit without that
condition and the public terms say a customer “may” attribute [S5][S6][S9].
The current dashboard/order form must be checked before relying on the credit or
choosing attribution language.

**INFERENCE (high):** at list price, `count=5` and `count=50` cost the same Brave
request fee, but should not be treated as equal total cost or latency. The
relevant unit is `request fee + downstream tokens + latency + verification`,
not request fee alone.

**UNKNOWN:** no public uptime/latency SLA, overage mechanics, tax treatment,
committed-use discount, regional pricing, or enterprise LLM Context price was
found. Brave's sub-600 ms p90 and under-130 ms p90 extraction overhead are
vendor observations, not contractual guarantees [S6].

### 7.2 Terms that materially constrain architecture and research

**FACT (high):** the public terms grant a limited, revocable license to use the
API and Search Results with customer applications. They prohibit, among other
things [S9]:

- storing, caching, or creating a database of Search Results except transient
  storage required to operate the application;
- derivative works of the API, documentation, or Search Results;
- redistributing, reselling, or sublicensing Search Results;
- reverse engineering or bypassing service/rate limits;
- using Search Results to create, evaluate, train, retrain, fine-tune,
  benchmark, or otherwise improve AI models or services;
- retaining Search Results after termination; and
- uses that violate law, third-party rights, or listed abuse restrictions.

**FACT (high):** Search Results may include third-party content; Brave does not
grant rights in that content and disclaims accuracy, completeness, security,
harmful-code freedom, and error-free operation [S9].

**RECOMMENDATION (high):** reject durable ingestion of LLM Context output into
Curiosity's owned corpus under public terms. Do not run comparative model or
retrieval benchmarks using API results without negotiated permission. Legal
review must precede even a transient production adapter because Curiosity's
normal evidence-retention goals may conflict with the default license.

## 8. Safety, privacy, and trust

### 8.1 Content safety

**FACT (high):** Safe Search is opt-in for standard retrieval: unset means no
adult filtering. Local recall remains strict. Moderate drops adult content from
context; strict drops all adult content as classified by Brave [S1][S2].

**FACT (high):** at index level Brave reports real-time phishing/malware
blacklists, CSAM scanning/blocking, RTBF processing, and selective indexing
based on visit/link/feed signals [S8]. These are useful risk reductions, not an
endpoint guarantee that every returned string is benign or true.

**FACT (high):** extracted material can include code, JSON, forum posts, and
other page text. No LLM Context field or guide promises prompt-injection
detection, instruction stripping, HTML/content sanitization labels, or a safe
execution boundary [S1][S3][S6].

**INFERENCE (high):** the product intentionally optimizes Web text for direct
LLM consumption, which amplifies indirect prompt-injection risk if a caller
mistakes snippets for trusted instructions. JSON-looking strings must be parsed
as untrusted data, never executed; URLs and thumbnails can also trigger
secondary network access if rendered or fetched.

**RECOMMENDATION (high):** keep retrieved content in an explicitly untrusted
data channel; never allow it to change system policy, invoke tools, approve
actions, reveal secrets, or recursively expand retrieval. Enforce local byte,
token, URL, MIME, and field-length ceilings despite provider controls.

### 8.2 Query and location privacy

**FACT (high):** the API privacy notice says ordinary account search-query logs
are retained up to 90 days for billing, troubleshooting, and abuse prevention,
subject to legal obligations. Brave says it does not collect identifiers that
link a query to an end user/device, but it can associate calls with the
customer's account and processes IP address/authentication token. Enterprise
customers can negotiate Zero Data Retention [S8][S13].

**FACT (high):** public pricing and the ZDR announcement position full-funnel
ZDR as an Enterprise feature. The announcement says ZDR means no query is
retained for any length of time and is enabled on a custom enterprise plan
[S10][S11].

**Contradiction resolved — FACT/INTERPRETATION (high):** the LLM Context launch
post also says “No queries are stored, logged, or linked to identities” in a
general product-benefit bullet [S6]. That statement conflicts with the formal
API privacy notice's up-to-90-day ordinary-plan query logs and the pricing
page's Enterprise-only ZDR. For procurement and threat modeling, use the formal
privacy notice and plan-specific terms: ordinary public-plan ZDR is **not
established**.

**INFERENCE (high):** precise location headers plus sensitive natural-language
queries can be personal or regulated data in the customer's context even if
Brave cannot identify the end user. The customer remains responsible for
privacy notice, consent, minimization, and applicable law [S9][S13].

**RECOMMENDATION (high):** do not send secrets, credentials, private document
text, unnecessary personal data, or precise coordinates. Prefer coarse locale
unless a user-authorized local task requires more. Make provider disclosure and
retention class visible in policy, and require negotiated ZDR for sensitive
workloads.

### 8.3 Security posture

**FACT (medium-high):** Brave states the Search API is SOC 2 Type II attested,
uses security/privacy review and threat modeling, runs a bug bounty, and had an
external API penetration test in April 2025 [S8]. The trust report itself was
not independently obtained in this research.

**RECOMMENDATION (high):** these controls support vendor diligence but do not
replace application threat modeling, token isolation, egress controls, result
sanitization, audit redaction, or contractual review.

## 9. Clean-room lessons for Curiosity

### 9.1 Adopted concepts

| Concept | Verdict | Curiosity lesson |
| --- | --- | --- |
| Separate candidate and output-source limits | **ADOPT** | `candidate_limit` and `source_limit` mean different things and should remain explicit. |
| Global plus per-source budgets | **ADOPT** | Prevent one long page from consuming the whole evidence budget. Use exact local byte/token ceilings, not only approximate provider counts. |
| Precision/recall threshold modes | **ADOPT** | Expose bounded retrieval policy such as strict/balanced/exploratory, with stable measured semantics. |
| Typed content lanes | **ADOPT** | Preserve text, table, code, discussion, caption, POI, and map types instead of flattening all content invisibly. |
| Source policy reranking | **ADOPT** | A transparent allow/deny/boost policy is useful, but record each applied rule and never equate domain allowlisting with factual truth. |
| Source metadata separate from passage data | **ADOPT** | Normalize source once, reference it from passages, and preserve additive metadata safely. |
| Pin behavior versions | **ADOPT** | Record retrieval, ranker, extractor, tokenizer, and contract versions with each trace. |

### 9.2 Adapted concepts

| Brave behavior | Verdict | Required adaptation |
| --- | --- | --- |
| “Smart chunks” | **ADAPT** | Define typed passage boundaries, stable IDs, offsets, hashes, extraction rationale, and truncation state. |
| Approximate token budget | **ADAPT** | Keep a provider estimate only as a hint; enforce exact serialized bytes and model-specific tokens downstream. |
| URL-keyed source map | **ADAPT** | Use immutable `source_id`, `document_id`, `capture_id`, and `passage_id`; URL is a locator, not identity. |
| `age` array | **ADAPT** | Replace positional display strings with named temporal fields, origin, precision, and confidence. |
| Empty 200 result | **ADAPT** | Return a typed `no_relevant_evidence` outcome with coverage warnings, not a generic success blob. |
| Additive schema evolution | **ADAPT** | Permit unknown fields at adapter edge, then normalize to a versioned provider-neutral contract. |
| Local/map/global token allocation | **ADAPT** | Make lane quotas, selection reasons, and omissions observable and caller-bounded. |

### 9.3 Rejected or deferred

| Item | Verdict | Reason |
| --- | --- | --- |
| Hosted LLM Context as owned retrieval foundation | **REJECT** | Proprietary index/ranking/extraction, opaque evidence lineage, external availability and policy dependency. |
| Durable storage of public-plan Search Results | **REJECT** | Conflicts with the public non-transient-storage restriction [S9]. |
| Provider text as trusted prompt | **REJECT** | Third-party content is untrusted and may contain injection or harmful data. |
| URL/date-only provenance | **REJECT** | Cannot reproduce or verify a changing passage. |
| Snippet-count fields as hard safety bounds | **REJECT** | Current pipeline explicitly allows token budgets to override them [S1]. |
| Live provider benchmark | **DEFER** | Requires credentials, spend, approved protocol, and terms permitting evaluation/benchmarking. |
| Enterprise procurement/ZDR | **DEFER** | Needs an actual workload, privacy assessment, negotiated terms, and owner authority. |

## 10. Provider-neutral target contract implied by the study

This is a research recommendation, not an implementation schema.

```text
RetrievalRequest
  query
  locale {country?, language?, coarse_location?}
  candidate_limit
  source_limit
  passage_limit                         # hard
  byte_limit                            # hard over serialized output
  token_budget {tokenizer, hard_limit}
  per_source {passages, bytes, tokens}
  relevance_policy {strict|balanced|exploratory, threshold_version}
  source_policy {rule_set_id, allow/deny/boost rules}
  temporal_filter {field, start?, end?}
  safety_policy
  provider_version_pin?

EvidenceResponse
  request_id, retrieved_at
  normalized_query, correction?
  index_manifest?, retriever_version, ranker_version, extractor_version
  sources[] {
    source_id, fetched_url, terminal_url, declared_canonical_url?,
    publisher?, owner_cluster?, language?, content_type?,
    claimed_published_at?, claimed_modified_at?, fetched_at?, indexed_at?,
    content_hash?, capture_id?, rights_notice?, safety_signals[]
  }
  passages[] {
    passage_id, source_id, capture_id?, kind,
    text_or_typed_data, offsets?, passage_hash?,
    rank, score_class?, selection_reasons[], truncation?, untrusted=true
  }
  omissions {candidate_count, selected_count, budget_exhausted, reasons[]}
  warnings[]
  partial_failures[]
```

**RECOMMENDATION (high):** keep provider response parsing in an adapter. Do not
leak Brave names such as `grounding`, `Goggles`, or positional `age` into the
Curiosity ABI. Preserve provider-specific raw fields only transiently where
terms allow and normalize to a provider-neutral, bounded evidence contract.

## 11. Unknowns and falsifiable checks

The following remain unknown after primary-source saturation:

1. The exact tokenizer and what fields count toward either token limit.
2. Maximum overrun of the “approximate” token budget.
3. Whether global/per-URL budgets apply before or after JSON serialization.
4. Whether current extraction uses live origin fetches, index snapshots,
   extraction cache, response cache, or a query-dependent mixture.
5. Cache keys, TTLs, geography, and the practical effect of best-effort
   `no-cache`.
6. Chunk boundary algorithm, overlap, deduplication, table truncation, and
   ordering semantics.
7. Ranker family, training data, relevance scores, diversity objective, and
   threshold values.
8. Whether Goggles applies strictly before extraction and how multiple Goggles
   affect candidate exhaustion and source count.
9. Passage fidelity to the cited page version, especially captions, forums,
   dynamically rendered pages, paywalls, and structured data.
10. Meaning/source precedence for `age` when published and modified dates
    disagree.
11. Exact error child codes, correlation/request IDs, 5xx schema, timeout, and
    partial-result behavior.
12. Hard response-byte and field-length limits.
13. Coverage by language/country/content type and exclusions from the index.
14. Whether source metadata image URLs are proxied, stable, and safety-filtered.
15. Standard-plan subprocessors and data locations applicable specifically to
    LLM Context; the DPA annex requires gated trust-center access.
16. Contract terms available for durable evidence retention and approved
    evaluation.

### Checks requiring separately approved authority

No check below was executed. If legal/procurement and the caller authorize a
future test, it should pin an API version and retain only permitted aggregate
measurements:

- **Bound check:** compare requested versus locally tokenized/serialized output
  for plain text, Unicode, code, and large tables.
- **Selection check:** vary one of `count`, URL cap, per-URL budget, threshold,
  and Goggles at a time; measure source/chunk monotonicity and duplicates.
- **Freshness check:** use publisher-controlled pages with known publish,
  modify, and fetch events to distinguish source age from retrieval freshness.
- **Cache check:** compare ordinary and `no-cache` calls on controlled content,
  within rate and terms limits.
- **Provenance check:** verify every returned quote against a contemporaneous,
  authorized capture and characterize transformations.
- **Safety check:** use benign controlled prompt-injection fixtures and adult/
  malware-safe test corpora; never target third parties or execute output.
- **Error check:** send only documented boundary cases; record redacted status,
  headers, and schema, never credentials or sensitive queries.
- **Quality check:** proceed only under terms explicitly permitting evaluation
  and storage of the minimum necessary judgments.

## 12. Bounded curiosity pass

After synthesis, gaps were scored 1–5 for relevance (R), decision value (V),
novelty (N), and cost (C, lower is better). Priority is `(R + V + N) - C`.

| Thread | R | V | N | C | Priority | Outcome |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Reconcile ordinary retention versus launch-post ZDR wording | 5 | 5 | 4 | 1 | 13 | **Pursued.** Formal privacy notice, pricing page, and dedicated ZDR post establish up-to-90-day ordinary logs and enterprise ZDR [S10][S11][S13]. |
| Determine whether `age` is fetch time or content date | 5 | 5 | 3 | 1 | 12 | **Pursued.** API docs define it as a content-reported date, not fetch/index time [S1][S2]. |
| Explain changed snippet-count semantics | 5 | 4 | 4 | 1 | 12 | **Pursued.** 2026-07-31 changelog confirms token budgets can override count controls [S1]. |
| Establish live-fetch versus cache behavior | 5 | 5 | 4 | 3 | 11 | **Partially pursued.** “Real-time” extraction and default caching coexist; exact path remains unknown [S2][S6]. Stop: private implementation or live testing required. |
| Obtain exact tokenizer/ranker implementation | 4 | 4 | 5 | 5 | 8 | **CURIOSITY_NO_GO.** Not public; would require probing or prohibited reverse engineering and would not change the foundation verdict. |
| Reproduce vendor comparative performance claims | 3 | 3 | 3 | 5 | 4 | **CURIOSITY_NO_GO.** Out of frame, paid/credentialed, and public terms restrict evaluation/benchmark use of results. |
| Inspect private trust-center DPA/SOC report | 4 | 4 | 2 | 5 | 5 | **CURIOSITY_NO_GO.** Gated access and procurement authority required; public privacy terms are sufficient for this architecture decision. |
| Compare LLM Context with other vendors | 2 | 2 | 2 | 4 | 2 | **CURIOSITY_NO_GO.** Caller explicitly requested independent product anatomy, not a market comparison. |

**Stop reason:** requested-category coverage achieved; remaining high-value gaps
require credentials, spend, private access, legal permission, or knowledge of
proprietary internals. Further public searching had reached saturation.

## 13. Decision ledger

| Decision | Verdict | Confidence |
| --- | --- | --- |
| Learn passage-first retrieval and two-level budgeting | **ADOPTED concept** | High |
| Use typed evidence/source metadata and explicit selection policy | **ADOPTED concept** | High |
| Translate approximate/provider bounds into hard local bounds | **ADAPTED** | High |
| Treat returned content as immutable provenance | **REJECTED** | High |
| Treat Brave source/date fields as sufficient citations | **REJECTED** | High |
| Make LLM Context the owned Curiosity foundation | **REJECTED** | High |
| Create a provider adapter now | **DEFERRED** | High |
| Conduct live quality, latency, safety, or freshness tests | **DEFERRED** pending caller, legal, credential, and budget authority | High |
| Negotiate enterprise retention/storage/evaluation terms | **DEFERRED** pending a concrete procurement need | High |

## Sources

All web sources accessed **2026-08-17**. Brave sources are primary for product
and policy facts; vendor quality/scale statements are explicitly not treated as
independent validation.

1. **[S1] Brave Search API, “LLM Context: Web search for agents and
   chatbots.”** Contract guide, parameter tables, response examples, behavior,
   best practices, and changelog.
   <https://api-dashboard.search.brave.com/documentation/services/llm-context>
2. **[S2] Brave Search API, “LLM Context — GET API Reference.”** Authorization,
   exact ranges, headers, cache behavior, response and status catalogue.
   <https://api-dashboard.search.brave.com/api-reference/summarizer/llm_context/get>
3. **[S3] Brave, `brave-search-skills`, “LLM Context” skill.** Public official
   usage contract and expanded field notes; repository file read from `main`.
   <https://github.com/brave/brave-search-skills/blob/main/skills/llm-context/SKILL.md>
4. **[S4] Brave Search API, “Versioning.”** Major URL and dated header versions,
   latest-by-default, compatible/incompatible change classes.
   <https://api-dashboard.search.brave.com/documentation/guides/versioning>
5. **[S5] Brave Search API, “Rate Limiting” and “Pricing.”** Sliding-window
   semantics, headers, billing of successful requests, current list price,
   credit, and capacity.
   <https://api-dashboard.search.brave.com/documentation/guides/rate-limiting>
   and <https://api-dashboard.search.brave.com/documentation/pricing>
6. **[S6] Brave, “Brave launches most powerful search API for AI to date,”
   2026-02-12, updated 2026-06-25.** Disclosed extraction/ranking sequence,
   latency observations, token packing, local allocation, plan boundary, and
   vendor evaluation claims.
   <https://brave.com/blog/most-powerful-search-api-for-ai/>
7. **[S7] Brave Search API, “Goggles.”** Ranking actions, composition,
   precedence, registration, and limits.
   <https://api-dashboard.search.brave.com/documentation/resources/goggles>
8. **[S8] Brave Search API, “Security.”** Security process, SOC 2 statement,
   index selection and malicious-content controls.
   <https://api-dashboard.search.brave.com/documentation/resources/security>
9. **[S9] Brave Search API, “Search API Terms of Use,” last updated
   2026-02-11.** License, storage, redistribution, evaluation/training,
   third-party-content, warranty, security, and termination terms.
   <https://api-dashboard.search.brave.com/documentation/resources/terms-of-service>
10. **[S10] Brave, “Brave Search API.”** Current plans, features, claimed index
    size/update rate, enterprise ZDR, and current endpoint example.
    <https://brave.com/search/api/>
11. **[S11] Brave, “Brave is the only search API offering true Zero Data
    Retention,” 2026-01-26.** Enterprise eligibility, no-retention definition,
    vertically integrated query path, and index claims.
    <https://brave.com/blog/search-api-zero-data-retention/>
12. **[S12] Brave Help Center, “What is the Web Discovery Project?,” updated
    2025-11-24.** Opt-in discovery/relevance signals, unlinkability, and
    distributed fetch-job description.
    <https://support.brave.app/hc/en-us/articles/4409406835469-What-is-the-Web-Discovery-Project->
13. **[S13] Brave Search API, “Privacy Notice,” updated 2025-12-04.** Account,
    query-log retention, identifiers, customer responsibilities, and Enterprise
    ZDR option.
    <https://api-dashboard.search.brave.com/documentation/resources/privacy-notice>
