# Perplexity Search API: clean-room product and contract study

**Date/accessed:** 2026-08-17  
**Scope:** Perplexity's standalone `POST /search` product, not Sonar and not the
Agent API.  
**Decision:** what its public behavior reveals—and does not reveal—for a wholly
owned `opencode2-curiosity` agent-search design.  
**Status:** research only; no credentials, paid calls, scraping, implementation,
or production access were used.

## Executive verdict

**REJECTED as a foundation; ADAPTED as a contract/evaluation reference (high
confidence).** The Search API is a hosted, bounded raw-retrieval service over
Perplexity's private crawl, index, extraction, and ranking stack. It is usefully
separate from answer generation: one authenticated request yields a ranked flat
array of page titles, URLs, query-relevant snippets, and two nullable dates. It
also exposes practical controls for country, language, domain/path, publication
time, update time, recency, result count, and extraction depth [S1][S2].

It does **not** provide an owned or auditable retrieval plane. The public result
contract omits score, rank rationale, query-to-result association for batches,
document/capture identity, fetch time, content hash, canonical lineage, source
owner, extraction version, safety decision, coverage warning, and pagination
[S1]. Perplexity markets a hundreds-of-billions-page index, passage-level
retrieval, semantic methods, LLM ranking, human feedback, and very high update
throughput, but these are vendor claims rather than independently inspectable
properties [S9][S10].

The decisive privacy boundary is easy to miss: the Search-specific legal
addendum says zero-retention obligations for other API products do **not** apply;
Perplexity may retain, copy, distribute, and otherwise use Search input and
output for lawful business purposes, Search Data is not customer confidential
information, and customers must not submit personal data without explicit
written authorization [S15]. This controls over broader API documentation that
says API query data is not retained [S12]. Do not send secrets, personal data,
private URLs, or proprietary query plans to this endpoint.

The most valuable clean-room lesson is therefore the boundary, not the backend:
keep raw retrieval independent from synthesis, make query/extraction budgets
explicit, and return source URLs plus temporal metadata. The owned design should
go materially further with immutable captures, typed provenance, passage
anchors, per-query grouping, transparent score components, policy traces,
partial-failure semantics, deterministic page/cursor bounds, and untrusted-data
labels.

## 1. Frame, bounded questions, and method

### 1.1 Questions

1. What standalone product is currently offered and how stable is it?
2. What is the narrowest defensible wire contract for request, response,
   filters, bounds, errors, and economics?
3. What do first-party materials establish about crawl/index ownership,
   retrieval, ranking, freshness, provenance, safety, and privacy?
4. Which architectural properties are facts, which are vendor claims or
   inferences, and which remain unknown without paid black-box testing?
5. Which lessons can be adapted clean-room without importing code, data, index
   content, brand assumptions, or license obligations?

**Coverage stop:** all requested categories have a primary-source finding or an
explicit negative result; additional sources were stopped when they repeated
the same public contract. One bounded curiosity pass pursued the Search-specific
legal addendum because it materially reversed the apparent privacy conclusion.

### 1.2 Evidence rules and limitations

- **FACT** means directly stated in a cited first-party source or visible in a
  first-party public schema/repository. A vendor's architecture or performance
  statement remains a *vendor claim*, not an independently verified fact.
- **INFERENCE** means a bounded architectural conclusion from those facts.
- **RECOMMENDATION** is advice for the owned design.
- Confidence is high, medium, or low.
- All web sources were accessed 2026-08-17. The API reference, official guides,
  generated SDK types, product page, launch post, crawler policy, legal terms,
  status page, and evaluation repository were inspected. No live API call was
  made, so runtime compliance, latency, recall, ranking quality, date accuracy,
  and error bodies were not experimentally verified.
- Documentation examples are evidence about the documented shape, not fresh
  observations. Some examples visibly contradict their surrounding filter
  claims; those negative results are retained below.

## 2. Current product and status

**FACT (high):** Perplexity introduced the standalone “Search-only API” in
September 2025 as direct access to raw ranked results without LLM answer
processing [S11]. Current documentation explicitly distinguishes it from Sonar
and Agent API: Search returns structured `results[]`; Sonar/Agent products can
generate prose answers or run tools [S1][S2]. The canonical call is directly to
`https://api.perplexity.ai/search`, with no model selector and no router [S1].

**FACT (high):** The public status page reported the aggregate “API” component
operational when inspected, but it does not break out `/search`; the API FAQ
states that Perplexity does not currently guarantee service uptime, failure
frequency, or recovery targets [S13][S12]. Search-specific terms likewise deny
enhanced security obligations, service levels, uptime guarantees, or other
performance commitments inherited from other products [S15].

**INFERENCE (high):** This is a generally available commercial endpoint, not an
experimental model API, but “operational” is a point-in-time aggregate signal,
not an SLA or Search-specific health proof.

## 3. Raw retrieval contract

### 3.1 Stable documented core

```http
POST /search HTTP/1.1
Host: api.perplexity.ai
Authorization: Bearer <API key>
Content-Type: application/json

{
  "query": "short focused query",
  "max_results": 10
}
```

**FACT (high):** Bearer authentication and JSON request bodies are required.
`query` is the only required field and accepts a string or array of strings.
`max_results` is 1–20 and defaults to 10 [S1][S2].

The documented request intersection is:

| Field | Public behavior and bound |
| --- | --- |
| `query` | Required string or string array; guide caps an array at five [S1][S2]. No public string-length bound. |
| `max_results` | Integer 1–20; default 10 [S1]. |
| `country` | Two-character ISO 3166-1 alpha-2 region control [S1][S2]. The docs say “more geographically relevant,” so treat it as a ranking locale, not a source-country guarantee. |
| `search_context_size` | `low`, `medium`, or `high`; high is documented as default. It controls extracted content depth and should be omitted when explicit token caps are used [S1]. |
| `max_tokens` | Maximum total webpage-content tokens across returned results; public OpenAPI permits 1–1,000,000 [S1]. |
| `max_tokens_per_page` | Maximum extraction tokens per result; public OpenAPI permits 1–1,000,000 [S1]. |
| `search_domain_filter` | Up to 20 domain/path patterns in either allow or deny mode [S1][S5]. |
| `search_language_filter` | Array of two-letter ISO 639-1 codes. The guide says up to 10; the API reference schema says up to 20—a live contract ambiguity [S1][S7]. |
| date/recency fields | Publication before/after, last-updated before/after, or relative recency; details in section 5 [S1][S6]. |

### 3.2 Public-contract drift

**FACT (high):** The current official TypeScript SDK's generated Search type
also includes `display_server_time`, `search_mode` (`web | academic | sec`), and
`search_type` (`web | people`) [S8]. Those fields are absent from the rendered
Search OpenAPI excerpt [S1]. The SDK is Apache-2.0 licensed; Perplexity's separate
`search_evals` repository is MIT licensed [S8][S17]. Those software licenses do
not license Perplexity's service, index, or third-party page content.

**RECOMMENDATION (high):** Treat the small OpenAPI intersection as the provider
adapter's portable contract. Capability-detect any SDK-only mode and never let
academic, SEC, or people-specific concepts leak into the provider-neutral web
search ABI without a separate decision.

### 3.3 Extraction, not just SERP metadata

**FACT (high):** `snippet` can contain long, multiline, query-relevant page text,
not merely a conventional one-sentence SERP description. Extraction depth can
be selected qualitatively or capped in tokens [S1][S2].

**INFERENCE (medium):** Search and content extraction are one retrieval
operation from the caller's perspective. This saves a second fetch but prevents
the caller from proving which page version was extracted, whether the text came
from a cached index or request-time fetch, and how token counts were measured.

## 4. Query and multi-query behavior

**FACT (high):** A request may carry up to five related queries. Perplexity says
each query is processed independently. A successful multi-query HTTP request is
one billable Search request, while each array member consumes one rate-limit
query unit [S2][S4]. Perplexity's own agent integration guide recommends short,
keyword-focused, single-entity queries and defensively caps agent-generated
arrays at three for efficiency, even though the service maximum is five [S16].

**FACT (high):** The response schema still contains only one flat `results[]`
array; it has no query group, query ID, normalized query, or per-result query
field [S1][S8].

**Unknowns (high confidence that undocumented):**

- whether `max_results` applies to each query or the merged response;
- merge/interleaving order, cross-query deduplication, and whether one query can
  monopolize the flat list;
- partial success behavior if one query fails or yields no results;
- whether an empty array, duplicate queries, or more than five queries produce
  400 or 422;
- maximum query length, supported operators, spelling correction, query
  rewriting, and stable normalization.

**RECOMMENDATION (high):** An owned API should accept explicit `{id, text,
intent, parent_id}` branches and return results grouped by query plus a separate
deduplicated/diversified merge. Never infer branch provenance from flat rank.

## 5. Filters: domain, time, language, and region

### 5.1 Domain and path

**FACT (high):** Up to 20 entries form either an allowlist (plain values) or a
denylist (`-` prefix); the modes cannot be mixed. Inputs omit URL schemes.
Documented matching includes root domains and subdomains, TLD patterns such as
`.gov`, domain parts, and path-prefix matching on path-segment boundaries.
Path-qualified patterns work in both modes [S5].

**Risk (medium):** “Any part of a domain” matching is broader than strict host
suffix matching and the precise treatment of ports, IDNs, public suffixes,
trailing dots, credentials, and percent encoding is undocumented. Domain
filters constrain retrieval; they are not authorization or SSRF defenses.

### 5.2 Publication, update, and relative recency

**FACT (high):** Exact inputs use `MM/DD/YYYY`. Publication bounds are
`search_after_date_filter` and `search_before_date_filter`; modification bounds
are `last_updated_after_filter` and `last_updated_before_filter`; relative
`search_recency_filter` values are `hour`, `day`, `week`, `month`, and `year`,
described as 1/24/7/30/365-day publication windows [S1][S6]. The CLI guide says
recency cannot be combined with publication-date bounds and reports that such a
request fails as `BAD_REQUEST` [S18].

**Unknown:** Inclusivity at date boundaries, timezone for “hour/day,” behavior
when dates are absent, source and reliability of detected dates, and whether a
page's `last_updated` represents publisher metadata, HTTP metadata, index
observation, or inferred change time.

### 5.3 Language and country

**FACT (high):** Language filtering takes arrays of ISO 639-1 two-letter codes
and composes with other filters [S7]. `country` takes a two-character ISO
3166-1 alpha-2 code and is described as making results geographically relevant
[S1][S2].

**Unknown:** Language-detection model/confidence, multilingual-page treatment,
country default, whether country changes ranking or eligibility, and whether
case/invalid but two-character codes are semantically validated.

### 5.4 Retained documentation contradictions

**FACT (high):** First-party examples do not consistently demonstrate the rule
stated above them. The domain guide's “nature.com/science.org/cell.com only”
example response contains WRI and IPCC URLs. The date guide's “published between
March 1 and March 5, 2025” response contains dates from 2019, 2023, and 2024
[S5][S6]. These may be documentation assembly errors rather than service
failures, but they invalidate those examples as verification evidence.

**RECOMMENDATION (high):** Treat all filters as assertions to validate after
retrieval. The owned service should return machine-readable applied-filter
echoes and exclusion/coverage warnings, with conformance fixtures for boundary
dates, IDNs, subdomains, paths, and mixed-language pages.

## 6. Result schema, scores, content, and dates

The normative public response is:

```json
{
  "id": "request-id",
  "results": [
    {
      "title": "Page title",
      "url": "https://example.test/page",
      "snippet": "Query-relevant extracted text",
      "date": "2026-08-17",
      "last_updated": null
    }
  ],
  "server_time": null
}
```

**FACT (high):** `id` and `results` are required. Each result requires `title`,
`url`, and `snippet`; `date` and `last_updated` are nullable strings. Optional
`server_time` is a nullable string. Output dates are documented as `YYYY-MM-DD`
[S1]. Empty snippets and null dates appear in first-party examples [S2][S5].

**FACT (high):** Results are ordered and described as ranked, but neither the
API schema nor official generated SDK Search type includes score, rank number,
score calibration, feature contribution, source type, or confidence [S1][S8].
There is no response `usage` or per-request cost field in the Search schema.

**FACT (high):** The Search-specific terms say output is snippets, URLs, titles,
and metadata from an index of public content; the endpoint does not generate
output through AI/LLMs. Customers do not own Search output and receive no
Search-output IP indemnification [S15]. This does not contradict AI-assisted
indexing or LLM ranking; it narrows the claim to output generation.

**INFERENCE (high):** The URL is the only durable public evidence locator, but
it is not a durable citation. Snippet text can be truncated, cached, stale,
derived from an unknown version, empty, or changed at the origin. `date` and
`last_updated` are useful ranking/filter hints, not trusted temporal facts.

## 7. Pagination, bounds, rate limits, and errors

### 7.1 Pagination and result bounds

**FACT (high):** No cursor, offset, page, continuation token, `has_more`, or
total-hit count appears in the request/response contract [S1][S8]. One call is
therefore bounded to at most the documented `max_results` value of 20, subject
to the unresolved multi-query interpretation.

**RECOMMENDATION (high):** Preserve hard top-k behavior for ordinary agent
search. If the owned system later needs recall-oriented enumeration, add an
opaque, query-manifest-bound cursor with maximum pages and snapshot identity;
do not silently convert an agent lookup into unbounded crawling.

### 7.2 Throughput

**FACT (high):** `/search` has a tier-independent leaky bucket of 50 query units
per second and burst capacity 50. One string costs one unit; a five-query array
costs five units. Units refill continuously [S4].

**INFERENCE (high):** Batching saves money and network overhead but not backend
query capacity. At the maximum batch size the documented sustained ceiling is
about ten HTTP requests/second, while single-query traffic can reach fifty.

### 7.3 Errors

**FACT (high):** The Search OpenAPI explicitly documents 200 and 422. The 422
body is FastAPI/Pydantic-like `detail[]`, each item carrying `loc`, `msg`, and
`type` [S1]. General SDK documentation lists 400, 401, 403, 404, 429, and 500+
classes and exposes connection, authentication, validation, rate-limit, and
generic status exceptions. Perplexity recommends timeouts, exponential backoff
with jitter for transient/429 failures, and logging `X-Request-ID` [S3][S12]. A
depleted credit balance can surface as 401 [S12].

**Unknown:** Search-specific error envelope outside 422; `Retry-After` behavior;
idempotency semantics; which failures are billable; timeout ceiling; partial
results; deterministic error codes; and whether `id` equals `X-Request-ID`.

**RECOMMENDATION (high):** Normalize provider failures to a small typed taxonomy
without leaking credentials or vendor bodies. Keep bounded retries only for
explicitly transient classes, honor `Retry-After`, and surface partial coverage
separately from whole-request failure.

## 8. Crawl/index ownership, ranking, freshness, and provenance

### 8.1 What Perplexity claims

The following are **first-party vendor claims**, confidence high that they were
published but low-to-medium that their scale/performance was independently
established here:

- The Search API exposes the same global-scale search infrastructure used by
  Perplexity's public answer engine and an index covering “hundreds of billions”
  of pages [S9].
- Documents are divided into fine-grained sub-document units; those units are
  individually scored against the query so relevant snippets and documents can
  be returned already ranked [S9].
- The product page describes “low-latency hybrid search” combining semantic
  methods, LLM ranking, and human feedback [S10].
- Index workflows process tens of thousands of update requests each second.
  An AI-powered content-understanding module dynamically generates parsing
  logic and is improved using evaluations and real-time signals from user query
  volume [S9].

### 8.2 Crawl policy and ownership boundary

**FACT (high):** Perplexity documents two user agents. `PerplexityBot` gathers
and indexes public information for search and is said not to crawl for
foundation-model training. `Perplexity-User` performs user-triggered page visits,
is said not to be a crawler or foundation-training collector, and “generally
ignores robots.txt” because the fetch is user requested. Published IP lists are
provided, and robots changes may take up to 24 hours to propagate [S14].

**FACT (high):** Search terms describe `/search` as retrieval from “an index of
public content”; output is sourced from the public internet [S15]. They do not
transfer ownership of the index or output to the customer.

**INFERENCE (medium):** Perplexity appears to own and operate material crawler,
index, passage-extraction, and ranking infrastructure rather than merely proxy a
single upstream SERP. Public materials do **not** prove that every result is
first-party crawled, reveal third-party feeds/partnerships, or define the split
between index-time and request-time retrieval.

### 8.3 Provenance and freshness gaps

**Unknown (high confidence that public sources do not answer):**

- crawl coverage by language, geography, MIME type, depth, and host;
- crawl scheduling, recrawl policy, deletion/takedown latency, and tombstones;
- robots decision retained for the particular returned capture;
- canonicalization, redirects, duplicates, syndication, spam, source ownership,
  and diversity controls;
- exact lexical/semantic candidate generation, LLM reranker identity, feature
  weights, score calibration, click/human-feedback debiasing, and model versions;
- query and index snapshot reproducibility;
- fetch time, first/last seen, page version, raw hash, passage offsets, and the
  evidentiary origin of publication/update dates.

**RECOMMENDATION (high):** The owned design must make these explicit enough to
audit: immutable capture and document-version IDs; original/final/canonical
URLs; fetch and observation time; publisher-date evidence; content and passage
hashes; extractor/index/ranker versions; rank feature classes; policy and robots
decision; duplicate/owner cluster; and coverage warnings.

## 9. Safety, privacy, and legal/economic boundaries

### 9.1 Search content safety

**FACT (high):** The API FAQ says SafeSearch is on by default and filters
potentially offensive/inappropriate content, including pornography [S12]. The
raw Search request schema exposes no documented `safe_search` control and no
result-level safety label [S1][S8]. Search-specific terms warn that public-web
output can be incorrect, biased, or otherwise problematic and put verification
responsibility on the customer [S15].

**INFERENCE (high):** SafeSearch is an opaque eligibility filter, not a complete
agent-safety control. It does not establish malware scanning, prompt-injection
resistance, source authenticity, PII removal, legal suitability, or factuality.

**RECOMMENDATION (high):** Treat every field as untrusted external data. Return
plain bounded text—not active HTML—through a retrieval-only capability with no
write authority. Validate URLs, strip control/markup hazards, label indirect
prompt-injection signals, and require independent source verification for
consequential claims.

### 9.2 Privacy: Search-specific terms govern

**FACT (high):** General API FAQ/privacy pages say API query data is not retained,
is not used for training, and only billable metadata is collected [S12]. But the
Search addendum expressly says other-product zero-data-retention obligations do
not apply to Search. It permits Perplexity to retain, copy, distribute, and use
Search Data (input and output) for lawful business purposes, including product
development; removes its customer-confidential status; and prohibits personal
data absent written authorization [S15].

**Verdict — REJECT broad “API ZDR” assumptions (high confidence).** The specific
Search addendum overrides the general agreement for this endpoint [S15]. Query
minimization and local redaction are mandatory if the product is evaluated.

### 9.3 Output and clean-room rights

**FACT (high):** The Search addendum says customers do not own Search output and
receive no output-related IP indemnity [S15]. The base API terms permit service
integration but retain Perplexity IP, including algorithms, methods, processes,
and know-how [S19].

**RECOMMENDATION (high):** Use public behavior and documentation to learn
interface ideas only. Do not copy result corpora into a production index, train
on returned snippets, imply ownership, clone proprietary ranking internals, or
import SDK/eval code without a separate dependency/license review. A clean-room
spec must be independently authored from observed public facts and open
standards.

## 10. Pricing and economics

**FACT (high):** The public Search rate is USD $5 per 1,000 requests—$0.005
each—with no documented token charge. Up to five queries in one successful
request remain one billing unit, although they consume five rate units
[S2][S4][S20]. Billing is prepaid credits; exhausted credits block keys until
replenished [S21].

Illustrative arithmetic, excluding taxes, retries, storage, downstream models,
and any future price change:

| Successful requests | Search fee | Maximum query members if all use five |
| ---: | ---: | ---: |
| 1,000 | $5 | 5,000 |
| 100,000 | $500 | 500,000 |
| 1,000,000 | $5,000 | 5,000,000 |

**INFERENCE (high):** Multi-query creates a strong price incentive to batch,
but the flat result array reduces auditability and may reduce usable recall.
Large snippets shift cost from Perplexity's Search line item into transport,
memory, model context, sanitization, and storage. A wholly owned system cannot
compare itself to $0.005/query on API fees alone: crawl bandwidth, recrawl,
storage, indexing, ranking compute, abuse operations, and engineering dominate.

**Unknown:** volume discounts, enterprise minimums, failed-request billing,
credit expiry/refunds, exact tax treatment, and price-change notice for this
product. No Search-specific SLA is bundled with the public rate [S15].

## 11. Observed architectural clues (inference, not reproduction)

1. **Passage-aware indexing/extraction.** Long query-focused snippets plus the
   launch description imply document segmentation and passage scoring before
   final document ranking [S2][S9]. **Confidence: high.**
2. **Multi-stage hybrid retrieval.** “Hybrid,” semantic methods, LLM ranking,
   and human feedback imply candidate retrieval followed by costlier reranking,
   not one monolithic score [S10]. **Confidence: medium.** The exact stages are
   undisclosed.
3. **Continuous or near-continuous indexing.** Update-request throughput and
   first-class recency/update filters imply a temporal metadata path integrated
   with indexing [S6][S9]. **Confidence: medium.** Freshness SLA is unknown.
4. **Shared retrieval plane, product-specific orchestration.** Search and the
   answer products are documented as separate APIs while Search claims the same
   underlying internet access/infrastructure [S1][S9][S12]. **Confidence: high.**
5. **Post-retrieval policy gate.** Default SafeSearch with no raw control or
   labels implies a service-side policy stage hidden behind the endpoint
   [S12]. **Confidence: medium.** Its position in the pipeline is unknown.
6. **Batch fan-out plus merge.** Independent processing of array members and
   per-member rate units imply fan-out; the single result list implies an
   undocumented merge/dedupe stage [S2][S4]. **Confidence: medium.**

These are clean-room hypotheses for evaluation, not claims about proprietary
source code or permission to recreate it.

## 12. Lessons, risks, and `opencode2-curiosity` implications

### 12.1 Verdict ledger

| Finding | Verdict | Owned-design implication |
| --- | --- | --- |
| Separate raw retrieval from answer generation | **ADOPTED** | Keep `web_search` as evidence retrieval; synthesis stays in the bounded researcher loop. |
| Small authenticated JSON endpoint | **ADAPTED** | Provider-neutral contract, fixed egress policy, strict schema, redacted failures. |
| Hard top-k and extraction budgets | **ADOPTED** | Bound results, bytes, passages, and total tokens independently. |
| Multi-query batching | **ADAPTED** | Explicit branch IDs and grouped results; cap curiosity expansion separately from initial retrieval. |
| Domain/language/country/date controls | **ADAPTED** | Use typed filter semantics and post-validate every result; return applied-filter traces. |
| Ranked URLs plus snippets and dates | **ADAPTED** | Preserve the ergonomic minimum but add capture/version/passage provenance and confidence. |
| Flat multi-query response | **REJECTED** | It erases branch provenance and partial coverage. |
| Opaque score/ranking/freshness | **REJECTED** | Expose bounded feature classes, rank stage, snapshot, and temporal evidence. |
| Hosted private crawl/index | **REJECTED** as foundation | Cannot satisfy wholly owned crawl, corpus, rank, or reproducibility. |
| Search-data retention/use terms | **REJECTED** for sensitive workloads | No personal, secret, proprietary, or internal-query data leaves the owned boundary. |
| SafeSearch as sole safety layer | **REJECTED** | Add URL/content sanitization, policy reasons, malware/spam/injection signals, and review paths. |
| Perplexity SDK/eval code | **DEFERRED** | Public licenses are known, but no implementation dependency is needed for clean-room learning. |
| Vendor benchmark/leadership claims | **REJECTED as proof** | Reproduce provider-neutral, judged evals on our corpus/query classes. |

### 12.2 Provider-neutral result contract delta

Perplexity validates the usefulness of the ergonomic minimum
`title/url/snippet/date/last_updated`, but Curiosity needs a richer internal
evidence object:

```text
query_branch_id, original_query, normalized_query
rank, score_components, retrieval_stage
fetched_url, final_url, declared_canonical_url
document_id, capture_id, passage_id, passage_hash
fetched_at, first_seen_at, last_seen_at
claimed_published_at + evidence, claimed_modified_at + evidence
content_type, language + confidence, source/owner/duplicate cluster
robots/policy decision, safety signals, extractor/index/ranker versions
coverage warnings, partial failures, untrusted=true
```

**RECOMMENDATION (high):** Keep this richer contract internal and map providers
into it with explicit `unknown` values. Do not manufacture missing Perplexity
scores, fetch times, or date provenance.

### 12.3 Curiosity control

Perplexity's own agent-tool guide says complex multi-step reasoning is not a
Search API capability and recommends short, bounded query arrays [S16]. That
supports the existing authority split:

```text
caller-declared frame and budget
  -> researcher selects <= bounded branches
  -> retrieval returns untrusted typed evidence
  -> local verification and synthesis
  -> one scored in-frame curiosity pass
  -> stop on coverage, saturation, exhaustion, or budget
```

The retrieval backend must not autonomously create follow-up work, acquire
credentials, fetch private resources, or convert snippets into instructions.

## 13. Unknowns and confidence summary

### High-confidence established

- Product separation, endpoint/authentication, core fields, result cap, five
  query maximum, filter families, flat response shape, rate units, list price,
  no pagination/score in the public schema, default SafeSearch claim, and the
  Search-specific data-use/legal boundary [S1][S2][S4][S12][S15][S20].

### Medium-confidence inference

- A materially first-party crawl/index, passage-aware indexing, hybrid staged
  retrieval, batch fan-out/merge, and continuous freshness pipeline [S9][S10].
  These fit first-party claims but were not independently audited.

### Material unknowns before any adapter evaluation

1. Actual filter conformance and date quality.
2. Multi-query merge, dedupe, result-count, and partial-failure semantics.
3. Search-specific non-422 error envelopes, retry headers, timeout, and billing.
4. Latency distributions, stability, reproducibility, and Search-only incidents.
5. Index coverage, third-party feeds, crawl/request-time fetch split, deletion,
   and robots provenance.
6. Ranking features, score calibration, diversity, spam defenses, and safety
   false-positive/negative behavior.
7. Tokenizer and enforcement for extraction caps; why OpenAPI permits 1,000,000
   while the official CLI documents much smaller CLI bounds [S1][S18].
8. Whether the documented language maximum is 10 or 20 [S1][S7].

No production decision should silently resolve these unknowns in the vendor's
favor.

## 14. Bounded curiosity pass

Scoring: relevance, decision value, novelty, and cost each 1–5; pursue the
highest useful item only.

| Thread | R | V | N | Cost | Action |
| --- | ---: | ---: | ---: | ---: | --- |
| Search-specific retention/ownership terms | 5 | 5 | 5 | 1 | **Pursued.** It overturned the general-API ZDR reading; incorporated from [S15]. |
| Resolve schema drift through official generated SDK | 5 | 4 | 4 | 1 | **Pursued.** Extra modes and `display_server_time` identified, but kept outside the portable core [S8]. |
| Paid black-box filter/error/latency test | 5 | 5 | 3 | 5 | **CURIOSITY_NO_GO:** explicitly outside authority; requires credentials and cost. |
| Reverse-engineer ranking/index internals | 3 | 2 | 3 | 5 | **CURIOSITY_NO_GO:** proprietary, unnecessary, and not clean-room safe. |
| Investigate crawler controversy through press reports | 2 | 2 | 3 | 3 | **CURIOSITY_NO_GO:** does not alter the public contract; publisher-policy/legal review belongs in owned-crawl research. |
| Reproduce vendor benchmark claims | 4 | 4 | 3 | 5 | **CURIOSITY_NO_GO:** paid calls and a separate evaluation plan required. |

**Stop reason:** requested coverage complete; remaining high-value questions
require authorized live testing or a separate legal/evaluation frame.

## Sources

All sources accessed 2026-08-17.

- **[S1]** Perplexity, [Search the Web — API reference](https://docs.perplexity.ai/api-reference/search-post) (OpenAPI 3.1 request, response, and 422 schemas).
- **[S2]** Perplexity, [Search API quickstart](https://docs.perplexity.ai/docs/search/quickstart) (product separation, examples, country, multi-query, extraction, and billing behavior).
- **[S3]** Perplexity, [SDK error handling](https://docs.perplexity.ai/docs/sdk/error-handling) (exception/status classes, timeout and retry guidance).
- **[S4]** Perplexity, [Rate Limits & Usage Tiers](https://docs.perplexity.ai/docs/admin/rate-limits-usage-tiers) (Search query-unit leaky bucket).
- **[S5]** Perplexity, [Search Domain Filter](https://docs.perplexity.ai/docs/search/filters/domain-filter) (allow/deny, domain/TLD/path semantics and contradictory example).
- **[S6]** Perplexity, [Search Date and Time Filters](https://docs.perplexity.ai/docs/search/filters/date-time-filters) (publication/update/recency semantics and contradictory example).
- **[S7]** Perplexity, [Search Language Filter](https://docs.perplexity.ai/docs/search/filters/language-filter) (ISO codes and guide limit).
- **[S8]** Perplexity, [`perplexity-node` generated API types](https://github.com/perplexityai/perplexity-node/blob/main/src/generated/api.ts) and [Apache-2.0 license](https://github.com/perplexityai/perplexity-node/blob/main/LICENSE) (current SDK Search fields and schema drift).
- **[S9]** Perplexity, [Introducing the Perplexity Search API](https://www.perplexity.ai/hub/blog/introducing-the-perplexity-search-api), 2025-09-25 (index scale, passage units, indexing and freshness claims).
- **[S10]** Perplexity, [API Platform](https://www.perplexity.ai/api-platform) (hybrid/semantic/LLM-ranking/human-feedback product claim).
- **[S11]** Perplexity, [API changelog](https://docs.perplexity.ai/docs/resources/changelog), September–December 2025 entries (Search-only launch and later enhancements).
- **[S12]** Perplexity, [API FAQ](https://docs.perplexity.ai/docs/resources/faq) (SafeSearch, general privacy statements, internet-access claim, errors, and absence of service guarantees).
- **[S13]** Perplexity, [Status page](https://status.perplexity.com/) (aggregate API operational status and history surface).
- **[S14]** Perplexity, [Perplexity Crawlers](https://docs.perplexity.ai/docs/resources/perplexity-crawlers) (`PerplexityBot`, `Perplexity-User`, robots behavior, and published IP sources).
- **[S15]** Perplexity, [API Terms of Service — Search Service](https://www.perplexity.ai/hub/legal/perplexity-api-terms-of-service-search), updated 2025-09-22 (controlling retention, confidentiality, personal-data, output-rights, and SLA terms).
- **[S16]** Perplexity, [Use Search API with the OpenAI SDK](https://docs.perplexity.ai/docs/search/agent-sdks/openai) (agent query-shaping and defensive bounds).
- **[S17]** Perplexity Research, [`search_evals`](https://github.com/perplexityai/search_evals) [README](https://github.com/perplexityai/search_evals/blob/main/README.md) and [MIT license](https://github.com/perplexityai/search_evals/blob/main/LICENSE) (vendor evaluation framework; its published scores concern agent systems, not proof of standalone `/search` quality).
- **[S18]** Perplexity, [CLI overview](https://docs.perplexity.ai/docs/cli/overview) (CLI token bounds and contradictory-filter `BAD_REQUEST` behavior).
- **[S19]** Perplexity, [general API Terms of Service](https://www.perplexity.ai/hub/legal/perplexity-api-terms-of-service), updated 2026-01-23 (base integration and Perplexity-IP terms, subordinate to [S15] for Search conflicts).
- **[S20]** Perplexity, [Pricing](https://docs.perplexity.ai/docs/getting-started/pricing) (Search `$5/1,000` source of truth).
- **[S21]** Perplexity, [API Groups & Billing](https://docs.perplexity.ai/docs/getting-started/api-groups) (prepaid credits, key management, usage and depletion behavior).
