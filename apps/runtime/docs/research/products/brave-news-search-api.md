# Brave News Search API: clean-room product dossier

**Research and source-access date:** 2026-08-17  
**Product:** dedicated Brave Search API News endpoint,
`GET|POST /res/v1/news/search`  
**Scope:** the standalone query-to-ranked-article surface. Consumer **Brave
News**, Web Search's optional news cluster, Answers, LLM Context, and page
extraction are out of scope except where first-party material is needed to
establish lineage or prevent product confusion.  
**Status:** research evidence and recommendations, not an implementation,
benchmark, purchase, legal opinion, or authorization to call the service.  
**Clean-room boundary:** public first-party pages and Brave's public skill file
only. No key, subscription, endpoint call, UI scraping, private traffic,
decompilation, bypass, copied implementation, or retained API output was used.

## Executive verdict

**ADAPTED as a contract and operational reference; REJECTED as Curiosity's
owned-news substrate or evidence authority (high confidence).** The product is
a useful, compact article-search API over a Brave-described specialized,
curated news index. It has independent controls for country, result language,
UI language, strict-by-default SafeSearch, content-date freshness, spelling,
operators, custom source reranking, extra passages, bounded paging, and
optional fetch metadata. Its current Search-plan economics are simple: **$5 per
1,000 successful requests**, $5 monthly credit, and 50 requests/second [S1-S5,
S14].

The surface is nevertheless insufficient for durable news research. It returns
an ordered list of article URLs and snippets, not story clusters or an evidence
graph. It exposes no stable result/article ID, canonical URL, syndication
relation, duplicate cluster, event/story ID, source ownership, author, rank
score/reason, snapshot, cursor, total, immutable capture, content hash, or
passage anchor. Publication and fetch clocks exist but are optional and
semantically incomplete. Pagination may overlap, and no continuation flag is
documented [S2-S5].

One material first-party contradiction must be preserved: the News service page
says freshness filters by **discovery date**, while the endpoint reference says
page age is the most relevant date **reported by content**, such as publication
or modification. The official skill calls `page_age` the source publication
date [S1-S4]. Curiosity must therefore never map Brave `freshness` to a precise
clock without contractual clarification and measurement.

Brave says the vertical is independent and that its overall API uses Brave's
own index and rankers, but public material does not establish whether News is a
physically separate index, a curated projection over the general Web index, a
feed-assisted lane, or some combination [S1, S6-S9]. The safest reconstruction
is a **news-eligible vertical view over Brave-controlled crawl/index
infrastructure**, with source curation and a news-specific ranker; this is an
inference, not an implementation fact.

## 1. Decision frame and bounded questions

### Decision

What should Curiosity learn from Brave's standalone News Search API while
retaining provider-neutral contracts, owned provenance, bounded behavior, and
independent source/event reasoning?

### Bounded sub-questions

1. What exactly can callers request, and what does a response prove?
2. Which source, publication, modification, crawl, and fetch clocks are exposed?
3. Does the product cluster stories, canonicalize syndication, or deduplicate?
4. What is known about source selection, ranking, freshness, locale, and safety?
5. How does the specialized news surface relate to Brave's first-party index?
6. What do paging, errors, limits, pricing, privacy, and terms imply?
7. Which patterns transfer clean-room, and what must Curiosity do differently?

**Research budget:** first-party public sources sufficient to cover every
requested category and triangulate material claims. No live quality/latency
test, paid plan, contract negotiation, exhaustive enum transcription, private
schema discovery, or reconstruction of proprietary ranking. Stop on coverage,
source saturation, or when the remaining question requires prohibited access.

Labels used below:

- **FACT** — directly stated or shown by cited first-party material.
- **INFERENCE** — the narrowest architecture/behavior conclusion consistent
  with the facts; not observed internals.
- **RECOMMENDATION** — an independently authored Curiosity choice.
- Confidence is **high**, **medium**, or **low** for the claim as scoped.

## 2. Product boundary, launch, and naming

**FACT (high):** Brave added the API news resource in August 2023; its September
2023 announcement described direct Image, News, and Video vertical querying and
called the underlying vertical indexes independent [S1, S6]. The endpoint is a
ranked retrieval API. It does not generate a narrative answer, fetch full
article bodies for the caller, or expose a feed of all current headlines.

**FACT (high):** the current service page describes a “specialized index of
articles sourced from trusted outlets worldwide,” continuous crawling and
indexing, breaking and historical articles, and a “curated index” of reputable
outlets [S1]. “Trusted” and “reputable” are vendor policy labels: no public
outlet list, admission rubric, audit, appeal process, or per-result trust reason
is supplied.

**FACT (high):** consumer **Brave News** is a different browser-integrated RSS
reader. Its original system selected roughly 300 feeds, ranked recency and local
browsing affinity, and later added user feeds, channels, and on-device source
suggestions [S18, S19]. Those historical algorithms and source counts are **not
evidence about the API ranker or corpus**.

**INFERENCE (high):** model News Search as `query -> ranked article candidates`,
not as a topical news feed, publisher catalog, event detector, or story-cluster
service.

## 3. First-party index relation and provenance of candidates

### 3.1 What Brave actually claims

- **FACT (high):** the endpoint reference says News searches “a large
  independent index of web pages”; the service page says specialized/curated
  news index [S1, S2].
- **FACT (high):** the 2023 vertical launch calls Image, News, and Video indexes
  independent. The API launch describes News among results exposed from the
  Brave Search backbone [S6, S7].
- **FACT (high):** current Brave material says the Search API does not scrape
  another search provider; Brave controls the crawl-to-endpoint stack and its
  own index/ranking algorithms. A February 2026 page describes a 40-billion-page
  Web index and more than 100 million added/refreshed pages daily; these are
  vendor scale claims, not audited News-corpus counts [S8].
- **FACT (high):** Brave's crawler discovers and indexes page content. Its
  security page names real-person visits, links from multiple indexed pages,
  and curated RSS feeds as general inclusion lanes [S9].

### 3.2 Narrow architecture conclusion

```text
Brave-controlled discovery lanes
  crawler + links/visits + curated RSS
                |
                v
general eligibility / safety / canonical processing (details unknown)
                |
                v
news-source + article eligibility (curated policy claimed)
                |
                v
news retrieval / locale / SafeSearch / freshness
                |
                v
base ranking -> optional Goggles mutation -> result serialization
```

**INFERENCE (medium):** this is the minimum architecture consistent with the
public record. “Specialized index” may mean physical storage, a logical posting
set, a source allowlist, a classifier, or multiple layers. Curated RSS is a
plausible freshness/discovery input, but no source proves that every News API
article came from RSS.

**UNKNOWN:** exact News corpus size, outlet coverage, source admission/removal,
feed versus crawl contribution, crawl/recrawl cadence, canonicalization,
paywall treatment, geography balance, language coverage quality, and whether a
News result can depend on a third-party real-time data provider. No provider or
discovery lineage is returned per result.

## 4. Public request contract

**FACT (high):** both GET query parameters and a POST JSON body target
`https://api.search.brave.com/res/v1/news/search`. Authentication is the
required `X-Subscription-Token` header. `q` is non-empty, at most 400
characters, and at most 50 words [S2-S4].

| Input | Documented News behavior |
| --- | --- |
| `q` | Required query; 400-character / 50-word maximum. |
| `country` | Supported two-character market or `ALL`; default `US`. Described as where results “come from.” |
| `search_lang` | Preferred result language from a finite enum; default `en`. |
| `ui_lang` | Response/UI language from a finite locale enum; default `en-US`. |
| `count` | 1–50 articles; default 20; actual count may be lower. |
| `offset` | **Page number**, 0–9; default 0. Despite loose “offset” wording, examples increment it by one page. |
| `safesearch` | `off`, `moderate`, `strict`; **strict default** for News. |
| `spellcheck` | Default true; modified query is always executed and may be returned as `query.altered`. |
| `freshness` | `pd` (24h), `pw` (7d), `pm` (31d), `py` (365d), or `YYYY-MM-DDtoYYYY-MM-DD`. Clock semantics conflict; see §6. |
| `extra_snippets` | Requests up to five additional alternative page excerpts. |
| `goggles` | One or up to three hosted/inline reranking definitions. |
| `operators` | Enables query-operator parsing; default true. |
| `include_fetch_metadata` | Adds fetch metadata; default false. |
| `Api-Version` | Date header; omission selects latest. |
| `Cache-Control: no-cache` | Best-effort request not to return cached content. |
| `User-Agent` | May alter experience according to device. |

Sources: [S1-S5, S10-S13]. Unlike Web Search, the News reference does not
document precise geographic headers, `text_decorations`, a result-type filter,
or a summarization switch.

### 4.1 Query interpretation

**FACT (high):** the official skill documents `query.original`, optional
`altered`, `cleaned`, `spellcheck_off`, `show_strict_warning`, and
`search_operators` with `applied`, `cleaned_query`, and extracted `sites` [S4].

**RECOMMENDATION (high):** preserve original, corrected, normalized,
operator-cleaned, and actually executed query as distinct trace values. A
silent corrected-query execution is otherwise irreproducible and can change the
named person, organization, or event being researched.

### 4.2 Operators and source policy

**FACT (high):** News supports exact phrases, exclusion, `site:` and the broader
Brave operator family. Brave calls operators experimental; restrictive
combinations may yield nothing and behavior may change [S1, S11].

**FACT (high):** Goggles can boost, downrank, or discard matching URLs/domains
after Brave's base index ranking. At most three values can be mixed; hosted
Goggles require registration, while inline rules do not [S1-S4, S10].

**INFERENCE (high):** matching constraints (`site:`, language, freshness) and
post-retrieval source preference (Goggles) are different stages. Neither proves
completeness or source trust. The News response schema does not document a
`mutated_by_goggles` flag, so a consumer cannot prove from the result object
alone that a requested policy was applied.

## 5. Response contract and result schema

### 5.1 Envelope

**FACT (high):** success has top-level `type: "news"`, a required `query`
object, and `results[]` (default empty). Each item has
`type: "news_result"` [S2-S5]. The ordered array position is the only exposed
base rank evidence.

### 5.2 Article fields

The API reference's public rendering collapses child schemas; Brave's official
skill and product-page response sample supply the field-level view [S4, S5].

| Area | Documented field | Meaning / caveat |
| --- | --- | --- |
| Destination | `url` | Article/source URL; no canonical or resolved URL. |
| Display | `title`, optional `description` | Untrusted title and one query-related excerpt/summary; no entailment or exact-source anchor. |
| Human time | optional `age` | Display string such as “2 hours ago”; not a machine clock. |
| Content time | optional `page_age` | Skill: source publication date, ISO datetime; endpoint: most relevant content-reported publication/modified date. |
| Fetch time | optional `page_fetched` | ISO datetime in official skill; relationship to cache/index version is unspecified. |
| Fetch metadata | optional `fetched_content_timestamp` | Integer, documented only when requested; units and exact event are unspecified. |
| URL presentation | optional `meta_url.{scheme,netloc,hostname,favicon,path}` | Parsed/display metadata, not ownership or canonical proof. |
| Outlet-like identity | optional `profile.{name,url,long_name,img}` | Site profile/display identity; not a verified publisher/owner entity. |
| Image | optional `thumbnail.{src,original}` | Served image and possibly original image URL; third-party content and untrusted metadata. |
| Passages | optional `extra_snippets[]` | Up to five additional alternative excerpts. |

**Important negative result:** no dedicated `source`, `publisher`, `author`,
`article_id`, `language`, `category`, `story_id`, `cluster`, `related_articles`,
`canonical_url`, `score`, `rank_reason`, `license`, or content-capture field is
documented for a News result [S2-S5]. A profile name and hostname must not be
silently upgraded into publisher ownership.

### 5.3 Timestamp semantics and missing clocks

**FACT (high):** `age` and `page_age` concern content age; `page_fetched` and
`fetched_content_timestamp` concern Brave fetch metadata. At least two clocks
therefore exist [S2-S4].

**INFERENCE (high):** all are provider assertions. `page_age` may originate in
HTML metadata, structured data, feed data, URL heuristics, or another signal;
the derivation and confidence are not returned. A modified timestamp may be
chosen instead of original publication. The fetch values do not identify the
exact bytes from which the snippet was extracted.

**RECOMMENDATION (high):** Curiosity must store separate typed observations:

```text
source_claimed_published_at?
source_claimed_modified_at?
provider_selected_content_date?  # Brave page_age; ambiguous derivation
provider_fetched_at?
curiosity_first_seen_at
curiosity_fetched_at?
capture_id? + content_hash? + passage_anchor?
```

Never parse `age` as authoritative time. Preserve raw timezone/offset; the
official News examples show `page_age` without a timezone while `page_fetched`
uses `Z` [S4, S5].

### 5.4 Provenance sufficiency

| Provenance question | News response | Curiosity requirement |
| --- | --- | --- |
| Which page? | URL and display host | normalized, requested, resolved, final, and canonical URLs |
| Which publisher? | optional profile/site label | publisher entity plus ownership/evidence and confidence |
| Which author? | not exposed | source-claimed byline with derivation |
| When published? | optional ambiguous `page_age`/`age` | named clock, source claim, timezone, derivation, confidence |
| When fetched? | optional provider clocks | provider event plus Curiosity observation/capture event |
| Which bytes support snippet? | not exposed | immutable capture/hash and passage offsets/DOM anchor |
| Why this rank? | array position only | retrieval/rerank stage and reason classes |
| Same story or syndicated copy? | not exposed | document/content/event cluster edges |

## 6. Freshness: documented capability, unresolved clock

**FACT (high):** the endpoint GET/POST references define freshness by page age,
where age is the most relevant date reported by content, such as publication or
last modification [S2, S3]. The official skill similarly calls `page_age` the
publication date from the source [S4].

**FACT (high, contradictory):** the News service overview says “filter results
by discovery date” while listing the same `pd`, `pw`, `pm`, `py`, and custom
range values [S1].

**UNKNOWN:** which statement governs production; whether windows are inclusive;
timezone/day boundaries; treatment of missing, future, edited, or conflicting
dates; whether date ranges target publication versus modification; and whether
cached result selection changes the clock.

**RECOMMENDATION (high):** expose a provider constraint as
`provider_freshness(page_age_unspecified)` rather than translating it to
`published_after`. For Curiosity-owned retrieval, require the clock explicitly
(`published_at`, `modified_at`, `first_seen_at`, or `last_fetched_at`) and return
the effective clock and fallback. Validate dates against independently fetched
article/feed metadata before temporal claims.

## 7. Ranking, clustering, deduplication, and source diversity

### 7.1 What is public

**FACT (high):** the output is called relevant News results from a curated
specialized index. Goggles are explicitly a custom rerank over Brave's base
index and can encode domain preference/exclusion [S1, S2, S10].

**FACT (medium):** broader Brave material says its own ranking algorithms query
its independent index and that Web Discovery Project/crawl data help freshness
and index quality [S7-S9]. This supports infrastructure lineage, not a specific
News ranking feature or weight.

### 7.2 What is not public

**UNKNOWN / negative result:** no first-party News API source reviewed specifies
candidate generation, lexical versus semantic matching, freshness weight,
publisher authority, source diversity, host caps, geography balance, click
signals, paywall handling, spam classifiers, rank score, score calibration, or
an explanation endpoint.

**FACT (high):** the documented response is a flat `results[]` array. It has no
story/event cluster, cluster lead, related coverage, duplicate/canonical edge,
or publisher-family grouping [S2-S5]. The pagination reference explicitly warns
that result pages can overlap [S2, S3].

**INFERENCE (high):** Brave may perform undisclosed exact/near-duplicate
suppression internally, but the contract provides no guarantee or audit
artifact. A list containing ten URLs is not evidence of ten independent events,
ten independent reports, or even ten independent publishers. Wire-service
syndication, copied headlines, live-blog updates, URL aliases, and corporate
publisher families remain consumer problems.

**RECOMMENDATION (high):** Curiosity should preserve all candidates, then build
three explicit, reversible relation layers:

1. **document identity** — normalized/final/canonical URL and exact-content hash;
2. **copy/syndication similarity** — near-duplicate text, byline, timestamps,
   named wire source, and attribution evidence;
3. **event/story clustering** — entities, claims, place, event time, and topic,
   without treating agreement among copies as independent corroboration.

Retain provider rank separately from Curiosity source-quality, independence,
freshness, novelty, and event-coverage scores.

## 8. Localization and safety

### 8.1 Locale

**FACT (high):** `country`, `search_lang`, and `ui_lang` are separate. `country`
accepts supported two-letter markets or `ALL`; `search_lang` selects preferred
content language; `ui_lang` controls response/UI language [S1-S4].

**UNKNOWN:** whether country filters publisher headquarters, article dateline,
top-level domain, audience market, server location, or a learned relevance
market; fallback behavior; effective locale; multilingual article behavior; and
coverage per market/language. The response has no documented effective-market
echo or per-result language.

**RECOMMENDATION (high):** preserve requested market, language, and UI locale
independently and require an `effective_*` trace in Curiosity-owned systems. Do
not label an article “from country X” solely because it appeared under Brave's
country setting.

### 8.2 Safety

**FACT (high):** News SafeSearch defaults to `strict`; `off` performs no adult
filtering, `moderate` filters explicit content, and `strict` filters explicit
and suggestive content. `query.show_strict_warning` may signal blocked output
[S1-S4]. Brave separately reports index-level phishing/malware blacklists and
CSAM scanning [S9].

**INFERENCE (high):** SafeSearch is an adult-content policy, not a guarantee of
factuality, civility, suitability, source integrity, malware freedom, balanced
coverage, or safe downstream model use. A query warning is not per-result
classifier evidence.

**RECOMMENDATION (high):** record requested and applied safety policy, sanitize
all text/URLs/images as untrusted, and independently check fetched pages. News
content can contain graphic violence, defamation, manipulated media, prompt
injection, and time-sensitive falsehoods outside an adult-content enum.

## 9. Pagination, limits, errors, versioning, and availability

### 9.1 Pagination and retrieval window

**FACT (high):** `count` is 1–50 and `offset` is a page number 0–9. Thus the
documented theoretical maximum window is **500 ranked positions** (10 pages ×
50), though actual pages can be shorter and overlap [S1-S3].

**FACT (high):** no total count, cursor, snapshot ID, continuation token, or
`more_results_available` field is documented for News [S2-S4].

**INFERENCE (high):** this is live, bounded offset paging, not snapshot export.
Concurrent indexing and rank changes can cause omissions as well as repeats.

**RECOMMENDATION (high):** count each page as a paid request; stop on empty/
short page, project page budget, time/cost limit, or repeated-candidate
saturation. Deduplicate across pages while retaining every observed page/rank.
Never promise exhaustive historical-news export.

### 9.2 Rate limits and errors

**FACT (high):** current Search capacity is 50 requests/second. Rate limiting is
a one-second sliding window per subscription and may also have a monthly
window. Responses expose `X-RateLimit-Limit`, `-Policy`, `-Remaining`, and
`-Reset`; 429 indicates excess. Brave says only successful, non-error responses
consume quota and are billed [S12, S14].

**FACT (high):** the News reference documents 200 plus structured
`ErrorResponse` envelopes for 404, 422, and 429, with top-level `type`, required
`error`, and `time`. The public page does not fully expand child error semantics
and does not enumerate authentication failures, 5xx behavior, timeouts, maximum
response size, or retry guarantees [S2, S3].

**RECOMMENDATION (high):** use typed failures (`invalid`, `auth`, `forbidden`,
`rate_limited`, `timeout`, `upstream`, `parse`, `partial`) and bounded,
jittered retries. A timeout may hide a billable success. Parse additively, cap
body/time/string/image handling, reject unsafe URLs, and redact token/query PII.

### 9.3 Version and availability

**FACT (high):** URL `v1` is the rare major-version boundary. `Api-Version:
YYYY-MM-DD` pins incompatible changes; omission selects latest. Brave considers
new optional fields/resources—and changes to string length or format—backward
compatible [S13].

**FACT (medium):** Brave publishes incident history and a live status link. A
February 2026 marketing page claims 99.99% API uptime, while the public standard
plan/docs reviewed do not state an enforceable News-specific SLA [S8, S17].

**RECOMMENDATION (high):** pin and record a reviewed date version, tolerate
unknown fields, and maintain outage/fallback behavior. Marketing uptime is not
a contractual SLO.

## 10. Pricing and request economics

**FACT (high):** News is included in the current **Search** plan at **$5 per
1,000 requests**, with $5 monthly credit and 50 requests/second capacity [S4,
S5, S14]. At list price, one successful call is $0.005.

| Retrieval pattern | Requests | Search fee |
| --- | ---: | ---: |
| One query, first page | 1 | $0.005 |
| One query, all 10 pages | 10 | $0.05 |
| 1M first-page news searches | 1M | $5,000 |
| 1M searches averaging 3 pages | 3M | $15,000 |

**FACT (high):** pricing is per successful request, not per article returned.
The $5 credit nominally covers 1,000 successful Search calls. Enterprise offers
custom terms, capacity/support, invoicing, and ZDR [S12, S14, S15].

**INFERENCE (high):** requesting 50 results and extra snippets can lower cost
per candidate, but increases response/untrusted-text processing and does not
improve provenance. Deep pages multiply cost and duplicate exposure. Article
fetching, extraction, storage, rights review, clustering, evaluation, and
operations are additional.

## 11. Privacy, provenance rights, and clean-room boundary

### 11.1 Query privacy

**FACT (high):** Brave's API privacy notice permits search-query records to be
retained up to 90 days for billing, troubleshooting, abuse prevention, and legal
obligations. Brave says it does not collect identifiers linking a query to an
end user/device, but it knows the customer account. The customer remains
responsible for notice, consent, and data-protection compliance. Enterprise ZDR
is optional and subject to legal obligations [S15].

**RECOMMENDATION (high):** treat every news query as third-party disclosure.
Names, allegations, health/political interests, confidential incidents, and
embargoed topics may be sensitive. Minimize query context; never send secrets or
private corpus text; keep keys server-side; and do not borrow consumer Brave
Search privacy claims for an API deployment.

### 11.2 Standard terms (not legal advice)

**FACT (high):** standard terms last updated 2026-02-11 grant a limited,
revocable API/result license. Unless an Order Form changes it, restrictions
include non-transient result storage/database creation, derivatives,
redistribution/resale, reverse engineering, rate-limit bypass, API replacement,
and use of results to create, evaluate, train, retrain, fine-tune, benchmark, or
improve AI models/services. Search Results must be erased at termination;
third-party article/content rights remain with their owners [S16].

**FACT (high):** results are as-is; Brave disclaims accuracy, completeness,
security, non-infringement, and error-free operation. Provider termination for
convenience requires only 10 days' notice. Attribution is optional under the
standard wording, but prescribed if used [S16].

**RECOMMENDATION (high):** require legal/procurement review of the actual Order
Form before a pilot. A durable news archive, result benchmark, training/eval
set, or corpus appears incompatible with standard terms. Separately determine
rights to fetch, quote, thumbnail, store, and analyze every publisher article.

### 11.3 Clean-room transfer rules

1. Learn abstract interface ideas only; do not reproduce Brave code, prose,
   branded DSL, sample payloads, ranking behavior, or private output fixtures.
2. Author Curiosity-native contracts from requirements and conventional search
   primitives; preserve this dossier as transfer provenance.
3. Do not call or scrape consumer/API surfaces to infer proprietary rankers,
   source lists, dedup thresholds, or hidden fields.
4. Do not use Brave output to seed an owned news index, event benchmark, model,
   or ranker without explicit rights.
5. The public skill repository is evidence here. Any later code use requires a
   separate commit-level license and contamination review; it does not license
   the hosted API, outputs, third-party articles, thumbnails, or trademarks.

## 12. Clean-room architecture lessons

| Public clue | Safe independent lesson | Boundary |
| --- | --- | --- |
| Dedicated curated vertical [S1, S6] | eligibility/corpus policy is separate from query rank | do not copy source list/classifier |
| separate market/content/UI language [S2-S4] | keep localization dimensions explicit | do not infer country semantics |
| strict-by-default News safety [S1-S3] | verticals may need different policy defaults | adult filter is not general safety |
| content age plus fetch metadata [S2-S4] | use named clocks and provenance | Brave clock derivation is unknown |
| contradictory freshness prose [S1-S4] | contracts need effective-clock echo/tests | do not paper over contradictions |
| extra snippets [S1-S5] | retrieve several query-relative passages | snippets are not immutable evidence |
| query trace [S4] | preserve corrections/operators/executed form | correction can alter entity identity |
| Goggles after base ranking [S10] | source policy is a separate rerank/filter stage | do not import DSL/rules/code |
| flat results and overlap [S2-S5] | dedup and event clustering need explicit stages | no provider guarantee may be invented |
| date versioning [S13] | pin schema and parse additively | “latest” is not reproducibility |

## 13. Exact Curiosity implications

### 13.1 Provider-neutral request and trace

**RECOMMENDATION (high):** if a later, separately authorized adapter exists, it
must map into a provider-neutral news retrieval request rather than export Brave
objects:

```text
NewsRequest
  query
  market? + content_languages[] + ui_locale?
  time_constraint { clock, start?, end? }
  adult_content_policy
  spelling_policy + operator_policy
  source_policy_id?            # independent Curiosity policy
  page_size + page_budget + time_budget + cost_budget

RetrievalTrace
  provider=brave_news + api_version
  original/altered/cleaned/executed_query
  requested controls + unsupported/ambiguous controls
  request page + provider rank + observed_at
  stop_reason + rate/cost accounting + warnings[]
```

For Brave specifically, an ambiguous freshness request must emit a warning such
as `provider_time_clock=content_date_unspecified`, not claim publication-time
precision.

### 13.2 Candidate, provenance, and relation model

```text
NewsCandidate
  provider_result_ref          # local trace ref, not provider-stable ID
  requested_url + normalized_url
  title + untrusted_snippets[]
  provider_site_profile?
  provider_content_date?       # raw value + ambiguous semantics
  provider_fetch_time?
  provider_rank

Owned enrichment (separate stage, only when permitted)
  resolved_url + canonical_url?
  publisher_entity? + author_claims[]
  claimed_published_at? + claimed_modified_at?
  capture_id + content_hash + passages[]
  exact_duplicate_cluster?
  syndication_cluster? + event_cluster?
  supports/contradicts/reports edges
  source_independence and rights evidence
```

**RECOMMENDATION (high):** never collapse exact copies, syndicated copies, and
same-event independent reporting into one generic “duplicate” bit. Those
relations have different implications for recall, novelty, corroboration, and
publisher credit.

### 13.3 Bounded news research behavior

1. Search within caller-declared query/page/time/cost bounds.
2. Preserve raw provider order and query mutation.
3. Normalize and deduplicate across pages without deleting observations.
4. Independently fetch only under policy/rights; create immutable passage
   provenance before citation.
5. Cluster documents and events reversibly; count independent reporting, not
   URLs, when assessing corroboration.
6. Surface geographic/language/source concentration and unresolved conflicting
   timestamps.
7. After synthesis, score only declared in-frame gaps by relevance, value,
   novelty, and cost. Follow-up execution requires caller authority; otherwise
   record `CURIOSITY_NO_GO`.

## 14. Fact / inference / recommendation verdict ledger

| ID | Type | Claim / decision | Evidence | Confidence | Verdict |
| --- | --- | --- | --- | --- | --- |
| N1 | FACT | News is a dedicated ranked-article endpoint in the Search plan. | S1-S6, S14 | High | **ADAPTED** as a bounded provider capability. |
| N2 | FACT | Brave describes a curated specialized index and independent vertical. | S1, S2, S6 | High for claim | **DEFERRED** corpus quality until independently measured. |
| N3 | INFERENCE | News is likely a vertical eligibility/ranking view over Brave-controlled index infrastructure. | S1, S6-S9 | Medium | **ADAPTED** only as conceptual layering. |
| N4 | FACT | Freshness documentation conflicts on discovery versus content-reported date. | S1-S4 | High | **REJECTED** as a precise Curiosity time contract. |
| N5 | FACT | Publication-like and fetch-like clocks are separate but optional/incomplete. | S2-S4 | High | **ADOPTED** separation; **ADAPTED** to typed provenance. |
| N6 | FACT | Result schema provides URL/title/snippets/site display metadata but no immutable evidence. | S2-S5 | High | **REJECTED** for citation authority. |
| N7 | FACT | No story/duplicate/syndication cluster is documented; pages may overlap. | S2-S5 | High | **ADOPTED** need for independent reversible clustering. |
| N8 | FACT | Country, result language, and UI language are separate controls. | S1-S4 | High | **ADOPTED** as neutral dimensions. |
| N9 | FACT | SafeSearch is strict by default for News. | S1-S4 | High | **ADAPTED** as one layer, not a safety guarantee. |
| N10 | FACT | Goggles mutate rank/filter by source/URL rules. | S1-S4, S10 | High | **ADAPTED** to a named Curiosity source-policy stage. |
| N11 | FACT | Paging is bounded to 10 pages × 50 and may overlap, with no cursor/snapshot documented. | S1-S4 | High | **REJECTED** for exhaustive/stable export. |
| N12 | FACT | Search is $5/1,000 successful calls, $5 monthly credit, 50 RPS. | S12, S14 | High | **ADAPTED** into per-stage budget accounting. |
| N13 | FACT | Ordinary API query retention can reach 90 days; enterprise ZDR is optional. | S15 | High | **REJECTED** for sensitive queries absent approved terms. |
| N14 | FACT | Standard terms constrain storage, derivatives, replacement, and AI evaluation/training. | S16 | High | **REJECTED** for corpus/benchmark use absent written rights. |
| N15 | RECOMMENDATION | Curiosity must own captures, article/event relations, source independence, and contradiction traces. | Analysis | High | **ADOPTED**. |

## 15. Unknowns, negative results, and verification gates

### Material unknowns retained

1. Physical/logical relationship between News and the general Web index.
2. News outlet list, admission/removal policy, corpus size, and language/market
   coverage.
3. Feed/crawl/discovery lineage and recrawl latency per result.
4. Freshness clock, date derivation, timezone, range inclusivity, and fallback.
5. Canonicalization, duplicate suppression, syndication and story clustering.
6. Ranker features/weights, source diversity, host caps, and spam/paywall policy.
7. Exact units/semantics of `fetched_content_timestamp`; relation to
   `page_fetched`, cache, snippet version, and `no-cache`.
8. Full error child schema, auth/5xx/timeout behavior, response bounds, retry
   idempotence, and News-specific SLA.
9. Whether requested Goggles application is observable in a News response.
10. Rights under an actual Order Form for transient cache, citation, monitoring,
    archive, evaluation, and AI-assisted research.

### Negative source results

- No documented stable result, document, story, cluster, or snapshot ID found.
- No documented canonical URL, duplicate relation, or syndication relation found.
- No documented author, verified publisher owner, article language, or license
  field found.
- No documented rank score, rank explanation, total, cursor, or continuation
  flag found.
- No immutable capture, content hash, source-passage offset, or snippet-version
  binding found.
- No public News source list, corpus count, coverage audit, or quality benchmark
  found in scope.
- No basis found to transfer consumer Brave News's RSS ranker/personalization to
  the API.
- No live behavior was tested; date accuracy, duplicates, latency, errors,
  SafeSearch, Goggles, and cache behavior remain empirically unverified.

### Gates before any authorized pilot

- **Legal/procurement:** Order Form, storage/citation/evaluation rights,
  publisher-content/thumbnail duties, ZDR/DPA, termination deletion, SLA.
- **Contract:** archived dated schema, pinned `Api-Version`, exact enum lists,
  clarified freshness and fetch clocks, complete errors and rate policy.
- **Offline fixtures:** only customer-created/license-safe synthetic fixtures;
  test unknown fields, absent/null dates/profile/thumbnail, malformed URLs,
  duplicate pages, timezone-free dates, markup, oversize strings, and query
  alteration.
- **Authorized live study:** fixed multilingual/event/date corpus; measure
  source and event recall, timestamp correctness, duplicate/syndication rate,
  publisher concentration, paging overlap/omission, safety, latency/errors, and
  cost. Do not use results to evaluate an AI service unless expressly allowed.
- **Exit:** provider outage and 10-day termination scenario; verified result and
  trace deletion according to the negotiated agreement.

## 16. Bounded curiosity pass

In-frame gaps were scored 1 (low) to 5 (high). Cost includes access, legal, and
clean-room risk. Follow-up authority was limited to public documentation with no
service calls.

| Thread | Relevance | Value | Novelty | Cost | Outcome |
| --- | ---: | ---: | ---: | ---: | --- |
| Reconcile freshness clock | 5 | 5 | 5 | 1 | **Pursued:** first-party contradiction remains; endpoint says content-reported date, service page says discovery date [S1-S4]. |
| Find source/publication/fetch schema | 5 | 5 | 4 | 1 | **Pursued:** official skill and product sample expose optional profile, `page_age`, `page_fetched`, and fetch timestamp; derivations remain unknown [S4, S5]. |
| Find clustering/dedup contract | 5 | 5 | 5 | 2 | **Pursued:** no cluster/canonical fields or guarantee found; only explicit cross-page overlap warning [S2-S5]. |
| Establish first-party index relation | 5 | 5 | 4 | 2 | **Pursued:** independent Brave-controlled stack is well supported; physical relationship of specialized News index remains unknown [S1, S6-S9]. |
| Transfer consumer Brave News ranking | 2 | 1 | 3 | 2 | **CURIOSITY_NO_GO:** separate RSS/browser product; evidence would misattribute behavior [S18, S19]. |
| Enumerate/score all trusted outlets | 4 | 3 | 4 | 5 | **CURIOSITY_NO_GO:** no public list/rubric; probing would require live output and still not prove policy. |
| Infer ranking/dedup thresholds from samples | 3 | 2 | 4 | 5 | **CURIOSITY_NO_GO:** proprietary, contract-sensitive, statistically weak, and unnecessary for interface lessons. |
| Call API for malformed errors/date edges | 4 | 4 | 3 | 5 | **CURIOSITY_NO_GO:** credentials/live calls prohibited; defer to reviewed pilot. |
| Negotiate ZDR/storage rights | 4 | 4 | 2 | 5 | **CURIOSITY_NO_GO:** no procurement authority or concrete deployment. |

**Stop condition:** coverage and saturation. Requested categories are covered by
the endpoint/service contract, official skill/sample, launch/index lineage,
operations, pricing, privacy, and terms. Remaining high-value gaps require
vendor clarification, an actual Order Form, or caller-authorized live tests.

## 17. Primary source ledger

All sources are first-party Brave materials accessed **2026-08-17**. Vendor
documentation proves published contract/claims, not comparative quality or
production conformance.

| ID | Primary source | Material used |
| --- | --- | --- |
| S1 | [News Search service guide](https://api-dashboard.search.brave.com/documentation/services/news-search) | specialized/curated index, features, discovery-date wording, pagination, safety, changelog |
| S2 | [GET News Search reference](https://api-dashboard.search.brave.com/api-reference/news/news_search/get) | endpoint, fields/defaults/bounds, content-date freshness, headers, errors, overlap |
| S3 | [POST News Search reference](https://api-dashboard.search.brave.com/api-reference/news/news_search/post) | JSON parity, nullable fields, content-date freshness, errors |
| S4 | [Official Brave News Search skill](https://github.com/brave/brave-search-skills/blob/main/skills/news-search/SKILL.md) | expanded response/query schema, profile and timestamp fields, GET/POST, Search-plan boundary |
| S5 | [Brave Search API product page](https://brave.com/search/api/) | official News response sample, current product/index positioning, price/capacity/features |
| S6 | [2023 Image/News/Video API launch](https://brave.com/blog/brave-search-api-update/) | direct vertical launch and independent index claim |
| S7 | [Search API launch](https://brave.com/blog/search-api-launch/) | Search backbone, first-party index/WDP lineage, News result availability, Goggles |
| S8 | [2026 Search API growth](https://brave.com/blog/search-api-growth/) and [ZDR architecture](https://brave.com/blog/search-api-zero-data-retention/) | Brave-controlled crawl/index/ranking path, scale/update and uptime marketing claims, no-scraper architecture |
| S9 | [Crawler help](https://search.brave.com/help/brave-search-crawler) and [API security](https://api-dashboard.search.brave.com/documentation/resources/security) | crawler/index relation, WDP, inclusion lanes, curated RSS, malicious-content controls |
| S10 | [Goggles documentation](https://api-dashboard.search.brave.com/documentation/resources/goggles) | News support, post-index actions, limits, hosted/inline behavior |
| S11 | [Search operators](https://api-dashboard.search.brave.com/documentation/resources/search-operators) | syntax, News example, experimental warning |
| S12 | [Rate limiting](https://api-dashboard.search.brave.com/documentation/guides/rate-limiting) | sliding window, headers, successful-request billing |
| S13 | [Versioning](https://api-dashboard.search.brave.com/documentation/guides/versioning) | URL/date versions and compatibility policy |
| S14 | [Current pricing](https://api-dashboard.search.brave.com/documentation/pricing) | Search price, credit, News inclusion, capacity, enterprise options |
| S15 | [API privacy notice](https://api-dashboard.search.brave.com/documentation/resources/privacy-notice) | 90-day query records, customer obligations, account data, enterprise ZDR |
| S16 | [Search API Terms of Use](https://api-dashboard.search.brave.com/documentation/resources/terms-of-service) | 2026-02-11 license, restrictions, third-party rights, disclaimers, termination |
| S17 | [Status updates](https://api-dashboard.search.brave.com/documentation/resources/status-updates) | public incident history and live status link |
| S18 | [How Brave News chose/ranked content](https://brave.com/blog/brave-today-content/) | historical consumer RSS product; used only to prevent false transfer |
| S19 | [2022 Brave News update](https://brave.com/blog/brave-news-updates/) | consumer on-device personalization and Brave-Search-assisted source discovery boundary |

## 18. Verification record

- Read the repository constitution before research; created only this dossier.
- Confirmed GET/POST parity, limits/defaults, response envelope, price/capacity,
  rate semantics, privacy retention, terms date, and versioning across separate
  first-party sources.
- Triangulated field-level News schema through endpoint references, official
  skill, and product-page sample; did not treat examples as guarantees of field
  presence.
- Triangulated first-party lineage through vertical launch, API launch, current
  architecture pages, crawler help, and security documentation.
- Preserved contradictions instead of manufacturing certainty: discovery-date
  versus content-date freshness; specialized/curated index versus unspecified
  relation to the general Web index; marketing uptime versus no standard
  News-specific SLA found.
- Retained negative findings for IDs, authors/publishers, canonicalization,
  clustering/dedup, ranking, source lists, continuation/snapshot, immutable
  provenance, and complete errors.
- No credentials, API calls, paid tests, source/result scraping, bypass, copied
  code, or edits outside
  `docs/research/products/brave-news-search-api.md`.
