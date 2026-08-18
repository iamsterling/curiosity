# Tavily Search: clean-room product and architecture dossier

**Access date:** 2026-08-17  
**Scope:** Tavily `POST /search` only. Extract, Crawl/Map, and Research are
mentioned only to define boundaries; their contracts and economics are out of
scope.  
**Status:** research evidence and recommendations, not implementation,
procurement approval, legal advice, or a live service test.

## Executive verdict

Tavily Search is a hosted, search-first web retrieval API that combines source
discovery, relevance ranking, query-aligned snippets, optional page extraction,
and optional answer generation in one call. Its most transferable ideas are a
small bounded result set, explicit latency/relevance modes, query-aligned chunks,
first-class recency/domain controls, per-result relevance scores, request IDs,
and opt-in usage reporting. Tavily says Search uses semantic search, its own
"agent-native index," dynamic caching, proprietary AI ranking, and limited
fallback to third-party indexes. Those statements establish a hybrid hosted
retrieval product, but not index coverage, crawler ownership, freshness service
levels, ranking features, score calibration, or result-level provenance [S8]
[S10] [S11].

**Decision for Curiosity — ADAPT, do not copy or depend on as the owned-search
foundation (high confidence).** Adapt the observable contract patterns while
preserving provider-neutral names and stronger provenance. Reject opaque
auto-tuning as a default, unqualified trust in relevance scores or generated
answers, the misleading `raw_content` name, and any assumption that "real-time"
means uncached or independently indexed. Defer Tavily as an optional hosted
adapter until privacy, source-supply, data-retention, safety, and quality claims
pass contractual and empirical review. Tavily's current terms also prohibit
reverse engineering, competitive use, and disclosure of performance analysis;
this dossier therefore uses only public first-party descriptions and schemas,
does not call the service, inspect private behavior, copy SDK code, or publish a
benchmark [S13] [S14].

## 1. Frame, questions, and method

### 1.1 Bounded questions

1. What is the Search request/response contract and where are its hard bounds?
2. What do depth, topic, time, domain, location, and exact-match controls mean?
3. What are `content`, `raw_content`, `score`, and optional answer/image fields?
4. What is actually disclosed about ranking, index ownership, and freshness?
5. What failure, safety, privacy, rate, and cost boundaries matter operationally?
6. What architecture can be inferred without claiming undisclosed internals?
7. Which patterns should Curiosity adopt, adapt, reject, or defer?

**Evidence policy.** Official API/OpenAPI pages, product documentation,
changelog, legal terms, privacy policy, Help Center, Trust Center, and Tavily's
own technical blog are primary sources for what Tavily represents. They do not
independently prove quality, latency, safety efficacy, compliance scope, or
freshness. Search-result snippets were used only to locate first-party pages.
All cited web sources were accessed 2026-08-17. No API key, paid test, trial,
credential, bypass, source reuse, or endpoint probing was used.

Labels:

- **FACT** — directly stated in a cited first-party source.
- **INFERENCE** — a bounded explanation consistent with facts, not a measured
  or vendor-confirmed internal design.
- **RECOMMENDATION** — a proposed Curiosity decision.
- Confidence is **high**, **medium**, or **low**.

### 1.2 Product boundary

**FACT (high):** Search is synchronous `POST https://api.tavily.com/search`,
JSON over bearer-key authentication. Tavily positions it as source discovery and
ranking, whereas Extract retrieves content for already selected URLs, Crawl/Map
navigates sites, and Research performs iterative agentic synthesis [S1] [S7]
[S10]. `include_raw_content` makes Search overlap with extraction, and
`include_answer` makes it overlap with answer engines, but neither turns one
Search request into the separately priced Research endpoint.

## 2. Observable API contract

### 2.1 Request schema

The following is the 2026-08-17 API-reference contract, not a claim that every
server-side validation detail was observed [S1].

| Field | Type / default | Documented meaning and bound |
| --- | --- | --- |
| `query` | string, required | Natural-language query. Best practices say keep it under 1,500 characters, but OpenAPI declares no `maxLength` [S2]. |
| `search_depth` | enum, `basic` | `advanced`, `basic`, `fast`, `ultra-fast`; controls latency/relevance and content construction. |
| `chunks_per_source` | integer, `3` | 1–3; applies to advanced/basic/fast; each chunk is at most 500 characters. |
| `max_results` | integer, `5` | OpenAPI minimum 0, maximum 20. Tutorial instead says range 1–20: an unresolved documentation conflict [S1] [S9]. |
| `topic` | enum, `general` | `general`, `news`, or `finance`. Docs explain general/news but do not define finance's source universe or freshness. |
| `time_range` | enum, null | `day/week/month/year` or `d/w/m/y`; filters on publish **or last-updated** date. |
| `start_date`, `end_date` | `YYYY-MM-DD`, null | Results after start and before end based on publish or update date. Changelog calls the range strict [S3]. |
| `include_domains` | string[], `[]` | Include-only list; maximum 300 domains. Best-practice examples include host paths and `*.com`. |
| `exclude_domains` | string[], `[]` | Exclusion list; maximum 150 domains. Conflict precedence is undocumented. |
| `country` | country-name enum, null | Ranking **boost**, not a geographic filter; available only for `topic=general`. |
| `exact_match` | boolean, `false` | Requires quoted phrase(s) to occur verbatim; punctuation is typically ignored. May yield fewer/empty results. |
| `auto_parameters` | boolean, `false` | Infers parameters from query intent; explicit values override inferred ones. It never auto-sets answer, raw content, or result count. |
| `include_answer` | boolean or `basic/advanced`, `false` | `true`/`basic` asks for a quick LLM answer; `advanced` asks for a more detailed answer. |
| `include_raw_content` | boolean or `markdown/text`, `false` | `true`/`markdown` returns cleaned, parsed page content as Markdown; `text` returns plain text and may add latency. |
| `include_images` | boolean, `false` | Adds query-related top-level images and per-result page images. |
| `include_image_descriptions` | boolean, `false` | Adds descriptions when images are enabled. Behavior when images are false is unspecified. |
| `include_favicon` | boolean, `false` | Adds a favicon URL when available. |
| `include_usage` | boolean, `false` | Adds request credit usage. |
| `safe_search` | boolean, `false` | Enterprise-only adult/unsafe-content filtering; unsupported for fast and ultra-fast. |

**FACT (high):** The API reference documents no request-level timeout, token
budget, language, interface locale, geocoordinate, pagination/cursor, offset,
sort order, duplicate policy, source-type filter, license filter, or desired
publisher count for Search [S1]. Client-side transport timeouts can still be
imposed by the caller; Tavily best practices recommend doing so [S2].

### 2.2 Response schema and semantics

| Field | Condition / meaning |
| --- | --- |
| `query` | Executed query string. The docs do not say whether this is rewritten or normalized. |
| `results[]` | Sorted by relevance. Each declared result has `title`, `url`, `content`, numeric `score`, optional `raw_content`, `favicon`, `images`, and a unique `id`. |
| `content` | Ultra-fast: one NLP page summary. Other depths: up to `chunks_per_source` short, semantically relevant source snippets joined by `[...]`. |
| `score` | Relevance between the query and content; higher is better. No range, calibration, feature definition, or cross-query comparability is promised. |
| `raw_content` | Cleaned and parsed page content, not raw HTML or a byte-faithful capture; only requested by `include_raw_content`. |
| `answer` | LLM-generated answer only when requested, although OpenAPI's `required` list also names `answer`, creating a schema/description inconsistency. |
| `images` | Top-level query images plus optional per-result extracted images; items may include URL and description. |
| `auto_parameters` | Chosen inferred parameters, only with auto mode. Useful for cost/behavior audit, but no reasoning trace. |
| `response_time` | Server-reported seconds to complete request. Its measurement boundaries are unspecified. |
| `usage.credits` | Credit charge when requested. |
| `request_id` | Support/debug identifier for a specific request. |

**FACT (high):** `content` is query-shaped evidence, not necessarily an abstract
of the whole page. Tavily changed basic depth in July 2026 from one page summary
to reranked chunks; advanced still searches more broadly and reaches more
sources, while both now expose the same chunk-count control [S2] [S3]. Systems
that assumed basic content was one stable page summary therefore face a semantic
contract change without a versioned response media type.

**FACT (high):** Tavily advises that very high `max_results` can lower result
quality, that broad questions should become separate focused searches, and that
the separate Extract endpoint is preferable for comprehensive content after URL
selection [S2]. Search's full-page option is convenience, not evidence of a
complete or immutable page capture.

### 2.3 Controls: hard filter, soft preference, and unknown

| Control | Observable class | Important qualification |
| --- | --- | --- |
| `topic` | Described as filter/category | News targets mainstream current-event coverage and adds `published_date` according to best practices; response OpenAPI does not declare `published_date`. Finance semantics are unknown. |
| `time_range` | Date filter | Uses provider-detected publish **or update** date, so “newly updated old page” and “new publication” are conflated. |
| absolute dates | Strict date filter per changelog | Exact timezone, missing-date behavior, and end-date inclusivity remain unknown; “before” suggests exclusive. |
| `include_domains` | Described as limit/restrict | Matching grammar is only demonstrated, not normatively specified: exact host, path prefix, and wildcard examples exist. |
| `exclude_domains` | Hard-sounding filter | Subdomain matching, redirects, canonical hosts, conflict precedence, and URL parsing are unspecified for Search. |
| `country` | Explicitly a boost | It cannot guarantee country-local sources and is invalid/unavailable outside general topic. No language control accompanies it. |
| `exact_match` | Verbatim content constraint | Only quoted phrases are targeted; phrase location, Unicode normalization, case, and extraction-failure behavior are unspecified. |

**RECOMMENDATION (high):** Curiosity must type controls as `filter`, `boost`, or
`hint`, and preserve which timestamp/field was used. Do not normalize country
boost into a geographic constraint or time filtering into publication-only
freshness.

## 3. Depth, quality, and economics

### 3.1 Depth modes

| Depth | Tavily's relative claim | Output form | Listed credits |
| --- | --- | --- | --- |
| `ultra-fast` | lowest latency, lower relevance | one NLP page summary | 1 in API reference; one tutorial line says 0.5, contradicted elsewhere |
| `fast` | low latency, good relevance | reranked chunks | 1 |
| `basic` | medium latency, high relevance / balanced default | reranked chunks | 1 |
| `advanced` | higher latency, highest relevance; broader search and more sources | reranked chunks | 2 |

**FACT (high):** The API reference and credits page price basic/fast/ultra-fast
at one credit and advanced at two [S1] [S4]. The Web Search Essentials page has
an internal contradiction: its "Critical Knobs" accordion says ultra-fast costs
0.5 credit, but the same page's Production Notes says one [S9]. Budgeting should
use the API reference and verify billing before adoption.

**INFERENCE (medium):** "Advanced searches more broadly and reaches more
sources" implies additional candidate-generation fanout and/or a larger
retrieval pool before source and chunk reranking. Nothing public establishes the
number of sources considered, ranking models, retrieval providers, or whether
the charged mode always executes materially different stages.

### 3.2 Prices and unit economics

**FACT (high):** Listed plans are: Researcher 1,000 credits/month free; Project
4,000/$30; Bootstrap 15,000/$100; Startup 38,000/$220; Growth 100,000/$500;
PAYG $0.008/credit; Enterprise custom [S4] [S5]. Monthly credits reset on the
first day of each month, and exhausted credits stop requests until reset or
upgrade unless paid arrangements apply [S5] [S12].

| Plan/rate | Effective $ / 1k basic calls | Effective $ / 1k advanced calls | Included basic / advanced calls |
| --- | ---: | ---: | ---: |
| Free | $0 marginal | $0 marginal | 1,000 / 500 monthly |
| Project | $7.50 | $15.00 | 4,000 / 2,000 |
| Bootstrap | about $6.67 | about $13.33 | 15,000 / 7,500 |
| Startup | about $5.79 | about $11.58 | 38,000 / 19,000 |
| Growth | $5.00 | $10.00 | 100,000 / 50,000 |
| PAYG | $8.00 | $16.00 | usage-based |

These are arithmetic on listed credits, excluding taxes, unused capacity,
retries, surrounding model tokens, and engineering/egress costs. Tavily lists no
separate Search surcharge for answer, images, raw content, exact match, or result
count; that is an absence in the price table, not a guarantee that commercial
terms cannot differ [S4] [S13]. `auto_parameters` can silently select advanced
and double search credits unless depth is explicitly pinned [S1] [S3].

**RECOMMENDATION (high):** Every automated branch needs a hard query count,
explicit depth, result cap, deadline, and credit ceiling. Record returned usage,
chosen auto-parameters, retries, and partial failures. Never let an intent
classifier independently raise cost in a curiosity loop.

## 4. Ranking, index ownership, freshness, and provenance

### 4.1 What Tavily actually claims

- **FACT (high):** Results are sorted/ranked by relevance; `score` expresses
  query-content relevance, with higher values better [S1] [S2].
- **FACT (medium):** Tavily says Search performs semantic search and uses
  proprietary AI to score, filter, and rank relevant sources/content [S10] [S11].
- **FACT (medium):** Tavily says low-latency search is powered by dynamic caching
  and an "agent-native index" [S10]. This is an architecture claim from a vendor
  blog, not an audited technical specification.
- **FACT (high):** Its privacy policy says Tavily mostly uses its own services,
  but may send query data to third-party search-index providers, explicitly
  giving Google as an example, when its own index cannot retrieve requested
  content. It also obtains web data from third-party indexes directly or through
  third parties [S8].
- **FACT (medium):** Tavily markets results as real-time, live, fresh, grounded,
  and up to date [S10] [S12]. No public Search SLA specifies crawl lag, cache
  age, recrawl interval, index size, language/region coverage, or publication
  timestamp accuracy.

**INFERENCE (high):** Tavily is neither established as a wholly owned web index
nor merely a wrapper around one external engine. The supportable model is a
hybrid retrieval service: proprietary index/services and processing, dynamic
caching, plus conditional third-party index supply. Result-level supplier and
cache lineage are not exposed, so a caller cannot know which path produced a
hit.

**INFERENCE (high):** `score` should be treated as an opaque, provider-local
ranking signal. Documentation examples use values around 0–1 but the schema only
says number/float. Tavily itself says thresholds depend on use case; examples of
0.5 or 0.7 are heuristics, not calibrated precision probabilities [S2] [S9].

### 4.2 Material unknowns

1. Candidate sources, upstream index mix, and the trigger/frequency for fallback.
2. Tavily-owned corpus size, languages, geography, recrawl cadence, and deletion
   handling.
3. Whether pages are fetched live per query, served from cache/index, or mixed;
   no cache timestamp or age is returned.
4. Ranking features beyond semantic relevance; treatment of authority,
   popularity, freshness, domain diversity, safety, commercial influence, and
   personalization.
5. Score range, calibration, stability, comparability across depths/topics, and
   whether the score attaches to page, best chunk, or aggregate content.
6. Canonicalization, near-duplicate/syndication handling, host/owner diversity,
   and how redirects affect filters.
7. Snippet anchoring: no offsets, content hash, extraction time, page version,
   or quoted-passage provenance appears in the public response schema.
8. Why a result was omitted, which filters applied, or what corpus was searched.

**RECOMMENDATION (high):** An owned Curiosity evidence contract should add
`retrieved_at`, `fetched_at`, `published_claimed_at`, `updated_claimed_at`,
timestamp provenance/confidence, immutable capture/version ID, canonical URL,
content hash, passage offsets/hash, index/corpus ID, supplier class, cache age,
rank-stage trace, duplicate cluster, and explicit coverage warnings. These are
clean-room requirements derived from the gaps, not Tavily internals.

## 5. Bounds, errors, operations, safety, and privacy

### 5.1 Bounds and errors

**FACT (high):** Public bounds include at most 20 results, 1–3 chunks/source,
500 characters/chunk, 300 included domains, 150 excluded domains, and a
best-practice query length under 1,500 characters [S1] [S2]. There is no Search
pagination; at most one bounded page is observable.

| HTTP | Documented meaning |
| --- | --- |
| `400` | Invalid request/parameter. |
| `401` | Missing or invalid API key. |
| `429` | Rate limit exceeded. Rate-limit docs promise `retry-after`. |
| `432` | API-key or plan usage limit exceeded. |
| `433` | PAYG limit exceeded. |
| `500` | Internal server error. |

**FACT (high):** Default rate limits are 100 requests/minute for development
keys and 1,000/minute for production keys; production keys require a paid plan
or PAYG. Tavily recommends bounded concurrency and respecting `retry-after`
[S6]. The API documents no Search-specific idempotency key, retry safety
guarantee, partial-result status, or per-source extraction error. A 200 response
can still contain fewer than requested results, but the reasons are not typed.

**RECOMMENDATION (high):** Normalize errors without leaking credentials; use
deadline-aware retries only for transient failures; honor `retry-after`; cap
attempts and aggregate credits; preserve request ID; treat empty/fewer results as
valid but coverage-limited; and never let one query failure sink a batch.

### 5.2 Search results remain untrusted

**FACT (high):** Tavily's AUP/terms explicitly say outputs derive from public
content and AI processing and may be inaccurate, incomplete, unreliable,
inappropriate, biased, outdated, illegal, or infringing; customers must verify
them and must not use high-impact automated decisions without human oversight
[S13] [S14]. Optional answers therefore cannot be promoted to evidence.

**FACT (medium):** Tavily says an agent-native firewall scans retrieved content
and blocks malicious prompt-injection attempts and data leakage [S10]. It also
offers Enterprise-only `safe_search` for adult/unsafe content, unsupported at
fast/ultra-fast depth [S1]. Public materials do not provide detection classes,
false-positive/negative rates, model/version identifiers, an assurance report,
or a response flag proving which content was scanned/blocked.

**RECOMMENDATION (high):** Preserve an explicit `untrusted_external_data`
boundary even when a vendor claims prompt-injection filtering. Do not execute
instructions in snippets/raw content, treat retrieved markup and URLs as
hostile, separately validate outbound URLs/content types/size, and retain local
policy filtering. `safe_search=false` is the default, not a general safety
guarantee; `safe_search=true` is not documented as injection protection.

### 5.3 Privacy and security posture

**FACT (high):** The privacy policy says Tavily collects queries and usage/online
identifiers; unless a contract says otherwise, it may use portions of query data
to improve future responses. It may share queries with third-party index
providers when its own index is insufficient. It warns users not to put personal
information in queries if they do not want it shared [S8].

**FACT (high):** Account settings expose "Allow Use of Query Data." Tavily's
Help Center says OFF means query data is not stored or used for improvements;
ON permits improvement use [S15]. The general privacy policy still gives
purpose-based retention criteria rather than a universal fixed deletion period.

**FACT (medium):** The FAQ says "zero data retention," while the privacy policy
describes query collection, optional improvement use, and nonzero retention, and
the Help Center describes zero storage only when a setting is OFF [S8] [S12]
[S15]. The most defensible reading is that zero retention is conditional by
setting and/or enterprise contract, not a universal default. Contractual
clarification is required.

**FACT (medium):** Tavily's public Trust Center says it has SOC 2 Type II and
ISO 27001:2022, names AWS, MongoDB, Snowflake, and Elastic Cloud among
subprocessors, and lists controls including encryption, access restriction,
penetration tests, retention procedures, and customer deletion [S16]. The
reports require access; their scope and exceptions were not reviewed here.

**FACT (high):** Optional `X-Session-Id`, `X-Human-Id`, and `X-Project-ID`
headers support attribution/analytics. Tavily hashes human IDs before processing
or storage, but a stable hash can still enable linkage; opaque, non-personal
identifiers and minimum retention remain prudent [S7].

**RECOMMENDATION (high):** Do not send secrets, credentials, sensitive personal
data, private document text, or raw user identity in queries/headers. Require a
DPA and explicit terms for query retention, improvement/training, third-party
index sharing, region, deletion, incident notice, subprocessors, logs, safety
telemetry, and enterprise zero-retention before sensitive use.

## 6. Clean-room architecture inference

The following explains the smallest architecture consistent with public
behavior; it does **not** identify Tavily's undisclosed implementation.

```text
authenticated bounded request
  -> validation + optional intent/parameter selection
  -> topic/time/domain/country/exact constraint planning
  -> proprietary index/services + cache candidate retrieval
       -> conditional third-party index fallback when coverage is insufficient
  -> page/content acquisition or stored-content access
  -> cleaning + segmentation or NLP summary
  -> query-to-chunk reranking
  -> source scoring/filtering/ranking and top-k truncation
  -> optional raw-content, images, favicon, and LLM-answer branches
  -> safety/policy controls (scope and plan dependent)
  -> response + request timing/ID + optional credit usage
```

- **INFERENCE (high):** Auto-parameters require an intent classifier/planner
  ahead of retrieval; returned selected parameters provide only a shallow audit.
- **INFERENCE (high):** Distinct page summaries versus query-reranked chunks
  require separate content-representation paths.
- **INFERENCE (medium):** Advanced likely expands retrieval effort before the
  common reranking/output path; its 2x price aligns with added work but does not
  reveal the work.
- **INFERENCE (high):** Query images, per-page images, raw extraction, and answer
  synthesis are optional branches because each is independently requested.
- **INFERENCE (high):** Dynamic caching and third-party fallback create hidden
  freshness and lineage states that the response cannot distinguish.
- **UNKNOWN:** exact providers, models, vector/lexical blend, crawl system,
  caches, thresholds, feature weights, safety stages, and online learning loops.

## 7. Curiosity implications and verdict ledger

| Pattern / claim | Verdict | Rationale |
| --- | --- | --- |
| Bounded one-call result set | **ADOPT** | Hard top-k limits constrain latency and context. Curiosity should retain its stricter caller cap. |
| Explicit speed/relevance modes | **ADAPT** | Use provider-neutral effort classes with measured budgets, not vendor names or unverifiable quality adjectives. |
| Query-aligned 500-character chunks | **ADAPT** | Valuable for context efficiency, but add passage anchors, hashes, document versions, and extractor identity. |
| Separate page summary vs evidence chunks | **ADOPT** | Preserve their semantic distinction in types; never overload one `content` field. |
| Topic/time/domain/country controls | **ADAPT** | Type hard filters separately from boosts; preserve timestamp basis and matching semantics. |
| Exact quoted-phrase mode | **ADOPT** | Useful for due diligence, but expose normalization and empty-coverage behavior. |
| Opaque score with caller threshold | **REJECT as authority** | Keep as provider-local feature only; calibrate offline and never interpret as probability/truth. |
| Optional LLM answer in search response | **REJECT by default** | Duplicates synthesis, increases trust ambiguity, and can conceal evidence gaps. |
| `raw_content` naming | **REJECT** | It is cleaned parsed content, not raw capture. Use `cleaned_content` plus immutable capture lineage. |
| Auto-parameters that can double cost | **REJECT by default** | Planner autonomy and cost mutation are hidden; allow only with explicit ceiling and audit. |
| Request ID, response time, usage | **ADOPT** | Useful operations metadata; add client deadline, attempts, cache/freshness, and stage timings. |
| Search + optional extraction convenience | **DEFER** | Good for prototypes; owned architecture should separate discovery from evidence acquisition and charge stages explicitly. |
| Tavily hosted adapter | **DEFER** | Requires contract tests, privacy/supply clarification, legal review, and benchmark authority. Not an owned index. |
| Vendor firewall / safe-search claims | **ADAPT as defense-in-depth only** | Keep local untrusted-data handling and independent controls. |
| Dynamic cache + hybrid index supply | **REJECT as owned-search model** | Hidden cache age and supplier lineage conflict with owned provenance goals. |

### Curiosity-specific retrieval contract

**RECOMMENDATION (high):** A Curiosity pass may borrow Tavily's focused
sub-query, top-k, domain/date, and chunk-reranking ideas, but authority remains
with the caller-declared frame. Each branch should carry `parent_query`,
`facet_or_contradiction`, expected information gain, maximum calls/results/
credits/time, and stop reason. Results remain candidate evidence until the
researcher opens authoritative sources, verifies passages, triangulates material
claims, and records negative results. Search depth may not self-escalate.

## 8. Reproducible validation plan (not executed)

Any future run requires separate caller authority, approved non-sensitive test
queries, an authorized free/development key, acceptance of then-current terms,
and a written budget. Do not induce rate limits, test security controls, or use
personal data. Save only redacted structured observations, not credentials or
large third-party page bodies.

1. **Pin evidence:** archive date, docs/OpenAPI hash, plan, SDK version if used,
   region, exact request minus key, response headers/status, request ID, usage,
   and wall-clock latency.
2. **Defaults/bounds:** test omitted optionals; 0/1/5/20/21 results; chunk counts
   0/1/3/4; query lengths 1/1499/1500/1501; domain counts at and over limits.
3. **Depth matrix:** repeat a stable navigational, niche, multi-facet, and newly
   published query across all four depths; verify output form, chunks, latency,
   result overlap, score ordering, and credits. Resolve ultra-fast billing.
4. **Auto mode:** compare auto off/on and explicit overrides; verify returned
   selected parameters and that explicit basic prevents advanced billing.
5. **Topics/location:** compare general/news/finance; verify `published_date`;
   try documented and invalid country/topic combinations; measure boost, never
   assume filter behavior.
6. **Dates:** use pages with known publication/update timestamps to determine
   timezone, inclusivity, missing-date behavior, `time_range` plus absolute-date
   precedence, and publication-versus-update selection.
7. **Domains:** test exact host, subdomain, path prefix, wildcard TLD, redirect,
   include/exclude conflict, Unicode/punycode, and canonical-host behavior.
8. **Exact match:** test case, punctuation, Unicode normalization, multiple
   phrases, phrase absent, and phrase present only in non-main-content markup.
9. **Content lineage:** compare each chunk and cleaned content to a timestamped
   authorized source capture; record unsupported text, truncation, ordering,
   separator ambiguity, and whether page changes alter result IDs/scores.
10. **Score study:** repeats and controlled paraphrases across modes/topics;
    inspect range, stability, cross-query comparability, and relevance judgments.
    Do not publish results if current terms prohibit performance disclosure.
11. **Failures:** malformed enum/date/body and expired test key only; verify
    typed 400/401 and redaction. Test transient 500/429 handling only if naturally
    encountered; never deliberately overload the service.
12. **Privacy/safety gate:** obtain written answers on retention, query-data OFF,
    third-party fallback, logs, regions, and enterprise controls. Safety efficacy
    needs an approved evaluation protocol, not adversarial probing under this
    research authority.

**Pass criteria:** contract behavior is stable and versionable; costs are
deterministic under explicit depth; every control's hard/soft semantics are
known; source content is attributable; legal/privacy terms fit the data class;
and quality exceeds an approved baseline on Curiosity's own representative,
non-sensitive set. Otherwise the adapter remains deferred.

## 9. Bounded curiosity pass

After initial synthesis, gaps were scored 1–5 for relevance (R), decision value
(V), novelty (N), and investigation cost (C); priority = R + V + N − C. Caller
authority covered in-frame public-source follow-up only.

| Thread | R/V/N/C | Priority | Outcome |
| --- | --- | ---: | --- |
| "Own index" versus third-party supply | 5/5/5/1 | 14 | **Pursued.** Privacy policy established own-service use plus conditional external indexes and named Google; hybrid conclusion adopted [S8]. |
| "Zero retention" versus privacy policy | 5/5/4/1 | 13 | **Pursued.** Query-data setting established no storage/improvement use when OFF; universal-zero claim remains unproven [S15]. |
| Ultra-fast 0.5 versus 1 credit | 4/4/4/1 | 11 | **Pursued.** Contradiction retained; authoritative billing needs a future observed invoice/usage check [S1] [S4] [S9]. |
| Safety-filter efficacy | 4/5/4/5 | 8 | **CURIOSITY_NO_GO.** Enterprise access and adversarial tests exceed authority; public claims lack metrics. |
| Ranking model/provider internals | 5/4/3/5 | 7 | **CURIOSITY_NO_GO.** Undisclosed and terms forbid reverse engineering; no lawful public primary evidence found. |
| Live freshness/cache-age benchmark | 5/4/3/5 | 7 | **CURIOSITY_NO_GO.** Requires credentials/live tests and may constitute prohibited performance analysis. |
| Full SOC 2/ISO report review | 3/4/2/4 | 5 | **CURIOSITY_NO_GO.** Reports are access-controlled; certification existence retained, scope not inferred. |
| Extract/Crawl/Research internals | 1/1/2/4 | 0 | **CURIOSITY_NO_GO.** Explicitly out of frame. |

**Stop reason:** coverage and saturation. Every requested Search category has a
primary-source account, consequential contradictions were pursued, and remaining
high-value gaps require credentials, enterprise artifacts, prohibited reverse
engineering, live benchmark authority, or a broader product frame.

## 10. Confidence and unresolved decision risks

**High confidence:** public API fields/defaults/bounds; basic/advanced semantics;
rate limits; listed prices; documented errors; privacy-policy language; legal
restrictions; July 2026 basic-content change.

**Medium confidence:** hybrid own/external index characterization; architecture
stage inference; conditional nature of zero retention; firewall and compliance
existence claims (vendor primary sources, no control/effectiveness audit).

**Low/unknown:** comparative search quality; current-web coverage; true cache
age; source-supplier percentages; ranking features and score calibration;
finance-topic behavior; detailed domain matching; date edge semantics; safety
efficacy; SLA and enterprise contractual guarantees.

Procurement or adapter adoption remains blocked on those unknowns plus empirical
contract tests and legal review. None blocks clean-room learning from the public
contract patterns.

## Sources

All sources are first-party Tavily pages accessed 2026-08-17.

- **[S1]** Tavily, [Search API reference / embedded OpenAPI](https://docs.tavily.com/documentation/api-reference/endpoint/search).
- **[S2]** Tavily, [Best Practices for Search](https://docs.tavily.com/documentation/best-practices/best-practices-search).
- **[S3]** Tavily, [Changelog](https://docs.tavily.com/changelog) (April 2025–August 2026 Search entries).
- **[S4]** Tavily, [Credits & Pricing](https://docs.tavily.com/documentation/api-credits).
- **[S5]** Tavily, [Pricing](https://www.tavily.com/pricing).
- **[S6]** Tavily, [Rate Limits](https://docs.tavily.com/documentation/rate-limits).
- **[S7]** Tavily, [API Introduction](https://docs.tavily.com/documentation/api-reference/introduction).
- **[S8]** Tavily, [Privacy Policy](https://www.tavily.com/privacy), last updated 2025-11-24.
- **[S9]** Tavily, [Web Search Essentials](https://docs.tavily.com/examples/quick-tutorials/search-api).
- **[S10]** Tavily, [Tavily 101: AI-powered Search for Developers](https://www.tavily.com/blog/tavily-101-ai-powered-search-for-developers), 2026-01-28.
- **[S11]** Tavily Help Center, [What is the Tavily Search API?](https://help.tavily.com/articles/4840311948-tavily-search-api).
- **[S12]** Tavily, [Frequently Asked Questions](https://docs.tavily.com/faq/faq).
- **[S13]** Tavily, [Platform Terms of Service](https://www.tavily.com/terms), last updated 2026-05-04.
- **[S14]** Tavily, [Acceptable Use Policy](https://www.tavily.com/acceptable-use-policy), last updated 2026-05-05.
- **[S15]** Tavily Help Center, [Understanding the “Allow Use of Query Data” Setting](https://help.tavily.com/articles/4205958832-understanding-the-allow-use-of-query-data-setting).
- **[S16]** Tavily, [Trust Center](https://trust.tavily.com/) (public overview, controls, certifications, and subprocessors).
