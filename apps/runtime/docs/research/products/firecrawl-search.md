# Firecrawl Search: clean-room reverse-engineering dossier

**Research and source-access date:** 2026-08-17  
**Scope:** Firecrawl `POST /v2/search` as a standalone discovery/ranked-results
product. Map, Crawl, Scrape, Extract, Research Index, Developer Index, Interact,
and Agent are out of scope except where Search composes Scrape, routes a category
to Developer Index, or a source is needed to distinguish product boundaries.  
**Pinned OSS release:** `v2.11.162`, commit
`7666c1f9ae8720a6bba271e0f60b6a217f8a5210`.  
**Status:** research only. No API key, keyless/paid call, third-party query,
benchmark execution, service probing, deployment, or code transfer was
performed. This is not legal advice or an independent security/quality audit.

## Executive verdict

**ADAPT the Search contract, but REJECT Firecrawl Search as Curiosity's owned
search foundation (high confidence).** The endpoint offers a useful synchronous
boundary: query; per-source result cap; Web/News/Image lanes; domain, category,
time, locale, and safety controls; optional per-result content acquisition; a
job ID; and actual credit usage. It correctly keeps query-relative Search
Highlights separate from separately requested full-page formats [S1][S2][S3].

The core ranked Web/News/Image corpus is nevertheless upstream-controlled.
Firecrawl explicitly describes an “upstream search provider” for Search ZDR,
and the pinned Cloud path delegates the query to a separately configured
Fire-engine `/v2/search`; it neither crawls nor queries Firecrawl's scrape cache
to generate the base SERP [S1][S13][S14]. The OSS fallback can query a separately
operated SearXNG instance or scrape DuckDuckGo HTML, but that is a deployment
alternative, not evidence that Firecrawl Cloud owns a general-Web index
[S14][S15][S16]. Exact Cloud provider(s), corpus, licenses, crawl lineage,
ranking, canonicalization, deduplication, and freshness remain undisclosed.

**Do not confuse the July 2026 “custom relevance model” with base-result
ranking (high confidence).** Official documentation says Highlights preserve
the search result's ranking and replace only `description`/`snippet`. Pinned
source first obtains upstream results, then optionally looks up Firecrawl-indexed
page text up to 30 days old and calls an external highlight service. Thus the
model is a query-relative passage selector over available indexed content, not
public evidence of owned candidate generation or SERP ranking [S3][S4][S17]
[S18].

**REJECT snippets/highlights as citation evidence and Search's “fresh/live”
marketing as a provenance guarantee (high confidence).** Web results expose a
mutable URL, title, description, optional position/category, and optional
Scrape-derived fields, but no provider, crawl/index/fetch timestamp, content
digest, immutable version, passage offsets, model/version, score, rank
explanation, or snapshot/cursor. Highlights may silently fall back to provider
snippets. Search-triggered scraping forcibly uses a three-day cache window in
the pinned release, and the official freshness guide says caller-supplied
`scrapeOptions.maxAge` does not take effect for Search [S2][S3][S11][S19].

**DEFER a hosted adapter** until an authorized contract/pilot resolves provider
identity and rights, query/result retention, result stability, field/default
drift, actual failure and timeout behavior, provenance, and relevance/freshness
quality. **REJECT copying the server:** the repository root/server is
AGPL-3.0; identified SDK/UI subtrees have separate MIT licenses. Independently
restate behavioral requirements, not server schemas, adapters, tests, ranking,
or orchestration [S12][S20][S21].

## 1. Decision frame, bounded questions, and method

### 1.1 Decision and sub-questions

The decision is which observable Search concepts Curiosity should adopt,
adapt, reject, or defer without importing AGPL implementation or depending on
opaque provider behavior.

1. What query, source, category, domain, time, locale, safety, limit, timeout,
   Highlight, and optional-content controls are exposed?
2. What do Web, News, Image, and content-enriched results contain, and what do
   they prove?
3. Who appears to own candidate generation, indexes, freshness, caching,
   ranking, and passage selection?
4. How are ordering, filtering, partial results, no-results, failures, billing,
   feedback, and limits represented?
5. What privacy, security, third-party-content, hosted-terms, and OSS-license
   boundaries constrain use?
6. What minimum architecture is safely inferable, and which lessons transfer
   to Curiosity without copying code or reconstructing proprietary algorithms?

### 1.2 Evidence and clean-room boundary

Official documentation, OpenAPI, product/blog, billing/rate-limit/freshness,
privacy/terms, and self-hosting pages were inspected. Public source was read at
the pinned commit in a temporary read-only checkout. Public docs establish an
advertised/current contract, not measured behavior. Pinned source establishes
visible OSS behavior at that release, not exact Cloud topology or deployment
parity.

- **FACT** — directly supported by cited primary material or pinned source.
- **INFERENCE** — bounded interpretation, not measured hidden behavior.
- **RECOMMENDATION** — Curiosity design or governance consequence.
- Confidence is **high**, **medium**, or **low**.

**Coverage bound:** contract/query controls/results/content; provider/index
ownership; freshness/caching; ranking/provenance; limits/errors/pricing;
privacy/security/license; architecture inference; clean-room lessons and
Curiosity implications. **Stop rule:** stop when each category has primary
evidence or an explicit unknown and further work requires calls, private
contracts, provider internals, or repeats saturated evidence.

## 2. Product boundary and observable contract

### 2.1 Core operation

**FACT (high):** `POST https://api.firecrawl.dev/v2/search` is synchronous and
returns `{success:true,data,id,creditsUsed}`. `data` is grouped by requested
source (`web`, `news`, `images`; `developer` can also appear for that category),
not a single universal array. The default source is Web, default limit is 10,
and authentication is normally bearer-token based; current clients also
advertise bounded keyless Search [S1][S2][S8].

**FACT (high):** Search without requested scrape formats returns result
metadata/snippets. Supplying nonempty `scrapeOptions.formats` makes Search
acquire and transform each eligible result, merging Scrape fields into its
Search result. Documentation calls this “one operation,” but source shows two
logical stages: ranked-result acquisition followed by concurrent per-result
Scrape work [S1][S13][S19].

**RECOMMENDATION (high):** Curiosity must keep `discover` and `fetch` as
separate provider-neutral authorities even if one adapter offers a fused call.
Discovery output cannot grant automatic fetch authority; a local policy/budget
gate selects URLs before acquisition.

### 2.2 Query and result-set controls

| Concern | Public/current contract | Material qualification |
| --- | --- | --- |
| Query | required string; OpenAPI maximum 500 characters; quoted phrase, exclusion, `site:`, `filetype:`, URL/title, related, and image-size operators | Pinned schema accepts an empty/unbounded string; backend operator equivalence is not guaranteed [S2][S13]. |
| Limit | 1–100, default 10 | Applies **per requested source**. It is not an internal-candidate, page-fetch, byte, or cost bound [S1][S2]. |
| Sources | Web default; Web, News, Images, multiple allowed | One mixed call can return up to `limit × source types`; no cross-type scalar rank is exposed. |
| Categories | GitHub, research websites, PDF; docs now mention Developer Index | GitHub/research/PDF are query filters in pinned source; Developer is a distinct owned/specialized endpoint merged as another group. Research category is not Research Index paper search [S1][S13][S22]. |
| Domains | `includeDomains` or `excludeDomains`, mutually exclusive; hostnames only | No public/schema maximum. Pinned code rewrites them to `site:`/`-site:` query operators rather than applying an independently verified post-filter [S1][S13][S22]. |
| Time | `tbs`: hour/day/week/month/year, custom range, date sort; Web only per guide | Provider-derived date filtering/sorting; no result fetch/index time or date-confidence field [S1][S2]. |
| Locale | `location`, `country` (default US), plus source-level options in OpenAPI | Pinned executor forwards global values to the managed search path; exact localization and IP/proxy semantics are undocumented. |
| Safety | `safe:true` filters explicit results; omission means no filter | Classification policy/version, coverage, false-positive/negative rate, and per-result verdict are absent. |
| Invalid URL | `ignoreInvalidURLs=false` default in OpenAPI | Pinned schema contains the field, but the controller does not pass it to the executor and no Search use was found; behavior is unestablished [S2][S13]. |
| Timeout | OpenAPI default 60,000 ms; no documented maximum | Pinned schema requires only a positive integer. It is passed to per-result Scrape, but the executor does not forward it to base Search; managed-call deadline semantics are therefore unknown [S13][S14]. |

**Contract discrepancy (high):** the OpenAPI caps `query` at 500 characters;
the pinned `searchRequestSchema` has `z.string()` with no nonempty or length
constraint. The endpoint reference should be treated as the intended public
contract, but Curiosity must enforce its own smaller nonempty bound [S2][S13].

**Contract discrepancy (medium-high):** OpenAPI models per-source Web `tbs` and
`location` options, but pinned execution reduces `sources` to a set of type
names and forwards only global controls. Per-source option effectiveness is not
established without an authorized contract test [S2][S13][S14].

### 2.3 Category semantics

**FACT (high for pinned source):** GitHub adds `site:github.com`; research adds
an OR-list of named academic/repository sites; PDF adds `filetype:pdf`. Returned
Web/News items are labeled by matching their URL against the constructed
category map. This is query rewriting plus result annotation, not a separately
proven corpus/index for those three categories [S22].

**FACT (high):** official docs warn that `research` means ordinary Web pages on
selected academic sites—not paper records. The separate Research Index exposes
paper abstracts, passages, and citation expansion and is outside this dossier
[S1][S2].

**INFERENCE (high):** category labels are useful routing/provenance hints, not
proof that an item is a repository, scholarly work, primary source, or PDF.
Curiosity must classify the fetched artifact itself.

## 3. Response, content, and partial-result semantics

### 3.1 Result groups

| Group | Principal Search-only fields | Important omissions |
| --- | --- | --- |
| Web | `url`, `title`, `description`, optional `position`, `category` | provider, date, language, score, canonical ID, crawl/index/fetch time, hash, rank reason |
| News | `title`, `url`, `snippet`, `date`, `imageUrl`, `position`, optional `category` | normalized publication time/provenance, publisher ID, article version, date confidence |
| Images | `title`, `imageUrl`, width/height, referring `url`, `position` | media hash/type/license/creator, actual bytes, safety verdict, dimensions provenance |
| Developer | Web-like result group for Developer category | separate product/index contract; not a general-Web result lane |

Sources: [S1][S2][S23]. All fields are untrusted external data. `position`
should be preserved as provider presentation position when present, never
converted into a calibrated relevance score.

**FACT (high):** optional Scrape enrichment can add Markdown, HTML, `rawHtml`,
links, screenshots, generated formats, and metadata. Search Highlights modify
the Search description/snippet; requested `scrapeOptions` content remains a
separate sibling representation [S2][S3]. The detailed risks and lineage of
those formats are covered by the separate Scrape dossier [S24].

**RECOMMENDATION (high):** normalize each item into three layers:

```text
SearchHit        = query-relative discovery metadata and observed rank
FetchedArtifact  = optional URL acquisition with independent status/time/hash
DerivedPassage   = optional excerpt/transform with model/extractor lineage
```

Never overwrite the upstream snippet in storage when a Highlight is applied;
retain each representation with its origin and availability state.

### 3.2 Partial and empty behavior

**FACT (high for pinned source):** managed Fire-engine validation accepts a
non-null response; the executor can return whichever requested groups are
present. Threat policy then removes blocked URLs, each Web/Image/News group is
sliced independently to `limit`, and optional scrape failures are merged as
per-item documents with `metadata.statusCode=500` and an error string rather
than necessarily failing the Search request [S13][S14][S19].

**FACT (high for pinned source):** the search-provider wrapper catches upstream
errors and returns `{}`. The controller can consequently return HTTP 200,
`success:true`, empty `data`, and zero search credits for a provider failure or
true no-results condition. No response field distinguishes those states
[S14].

**INFERENCE (high):** top-level success means the API completed its envelope,
not that every source ran, a candidate set existed, a Highlight was generated,
or an enriched page was fetched successfully.

**RECOMMENDATION (high):** Curiosity needs `complete | partial | empty |
failed`, plus per-lane and per-item stage outcomes. Empty results without a
provider reason must remain `empty_unknown`, not “no such information exists.”

## 4. Upstream and index ownership

### 4.1 What is established

**FACT (high):** Firecrawl's own ZDR documentation distinguishes Firecrawl from
“our upstream search provider.” End-to-end ZDR says both parties enforce no
retention; anonymized ZDR says Firecrawl retains nothing but the provider may
cache the anonymized query [S1]. This is direct evidence that ordinary Cloud
base Search is provider-backed.

**FACT (high for pinned source):** with `FIRE_ENGINE_BETA_URL` configured, the
Cloud-oriented path sends query, locale, time, count, requested types, and
enterprise mode to `${FIRE_ENGINE_BETA_URL}/v2/search`. The visible server does
not reveal what that managed service queries or owns [S14].

**FACT (high for pinned OSS):** without Fire-engine, Search tries a configured
SearXNG endpoint and otherwise DuckDuckGo HTML. The SearXNG adapter supplies
configured engines/categories; the DuckDuckGo adapter parses title, URL, and
snippet, deduplicates exact returned URLs, and follows result pages until its
count is reached or no next form exists [S15][S16].

**FACT (high):** Firecrawl maintains a scrape/index cache used for page reuse
and Highlights. That proves ownership/control of some acquired page artifacts,
not ownership of the upstream general-Web candidate corpus or ranking [S17]
[S24].

### 4.2 Ownership verdict

| Layer | Best-supported owner/control | Confidence |
| --- | --- | --- |
| Base Web/News/Image candidate corpus | undisclosed upstream provider(s) behind managed Fire-engine | High that it is upstream; low on identity |
| Base candidate ranking/snippets | upstream/managed service, exact division unknown | Medium-high |
| GitHub/research/PDF filtering | Firecrawl query construction over upstream search | High for pinned release |
| Developer category | separate Firecrawl Developer Index path | High, but outside core Web |
| Scraped result artifacts/cache | Firecrawl acquisition/index path and optional third-party services | High for stage; Cloud details unknown |
| Search Highlights page corpus | Firecrawl index objects up to 30 days old when available | High for pinned release |
| Highlight selection model | external/configured Firecrawl model service; implementation/model absent | High for stage, low for internals |

**VERDICT (high):** Firecrawl Search is a hosted search broker plus optional
content/passage enrichment, not an evidenced independently crawled and ranked
general-Web index. Self-hostability means the orchestration can be operated and
connected to a search backend; it does not manufacture an owned corpus.

### 4.3 Negative results retained

No reviewed first-party source establishes:

- Cloud upstream provider identity, exclusivity, geographic routing, or
  provider-switch/fallback policy;
- corpus size, language/region coverage, crawl user agent, discovery inputs,
  crawl cadence, sitemap/feed policy, or index update/deletion SLA;
- whether Fire-engine has an additional owned candidate index or merely
  normalizes/fuses providers;
- source licenses or redistribution/storage rights for snippets, images, news,
  or indexed page content; or
- Cloud equivalence to SearXNG/DuckDuckGo self-host fallbacks.

## 5. Freshness and caching

### 5.1 Three distinct freshness planes

**FACT (high):** `tbs` filters/sorts the base search result set using provider
date semantics. Web results expose no date; News exposes an unnormalized string
date. No search-index observation or crawl timestamp is returned [S1][S2].

**FACT (high):** official freshness guidance says Search applies its own
freshness window to pages it scrapes and ignores `maxAge` supplied inside
`scrapeOptions`. If a fresh page acquisition is required, the documented path
is a separate `/scrape` with `maxAge:0` [S11].

**FACT (high for pinned source):** Search-triggered Scrape overwrites
`scrapeOptions.maxAge` with three days. Separately, Search Highlights may use a
matching default-variant Firecrawl index object up to 30 days old and prefer a
recent 2xx entry unless at least three newer error entries intervene [S17][S19].

**INFERENCE (high):** these planes can disagree:

1. upstream result/date freshness;
2. Firecrawl page-acquisition freshness (up to three days in pinned Search);
3. Highlight source freshness (up to 30 days in pinned source).

A recently published result can carry an older or fallback snippet; a current
URL can have stale fetched Markdown; `tbs` cannot prove current page state.

### 5.2 Unsupported marketing precision

**FACT (high):** the product page calls every result “fresh” and Search “live
web,” while the official freshness guide explicitly says freshness and liveness
are different and Search has its own page-cache window [S5][S11].

**RECOMMENDATION (high):** treat “live” and “fresh” as positioning, not an SLO.
Curiosity needs independently named times and evidence:

```text
query_observed_at
provider_result_date_claim?
provider_indexed_at?          # unknown unless returned
provider_page_fetched_at?     # unknown for Search
curiosity_fetched_at?
artifact_derived_at?
```

Do not substitute API receive time for any provider crawl/fetch/index time.

### 5.3 Cache/result stability unknowns

No Search-result cache-control request, response cache marker, snapshot ID,
cursor, pagination token, ETag, or stable-query version is documented. The
contract does not say whether repeated searches reuse an upstream SERP cache,
how long results persist, or whether positions are stable during updates.
Search exposes only one bounded page per source, so there is no reproducible
deep-page export contract.

## 6. Ranking, Highlights, and provenance

### 6.1 Base ranking

**FACT (high):** results may carry `position`; Search Highlights explicitly
preserve URL, title, position, and ranking. Pinned orchestration requests twice
the caller limit, applies threat filtering, then takes the first `limit` items
per standard source without a visible general-Web reranker [S3][S13].

**INFERENCE (medium-high):** relative order is principally upstream order after
Firecrawl policy removal. Over-requesting creates replacement headroom when
policy removes URLs, but no response explains removals or whether original
positions remain contiguous. The precise managed-service ranking division is
unknown.

**UNKNOWN:** candidate generation, lexical/vector retrieval, query rewrite,
rank features/weights, authority/link/spam signals, freshness boost, source
diversity, host caps, personalization, deduplication, canonical clustering,
model/training data, score calibration, and rank explanations.

### 6.2 Search Highlights

**FACT (high):** Highlights are on by default in current public docs, replace
Web `description` or News `snippet`, can contain Markdown, leave Images
unchanged, and preserve the original provider text when Highlight generation
is unavailable. `highlights:false` requests plain provider snippets. ZDR Search
does not return Highlights [S1][S3].

**FACT (high for pinned source):** the Highlight path resolves page artifacts
from Firecrawl's index, batches `{query,pages}` into a separately configured
service, and uses only its returned reassembled Markdown. Internal response
types allow block index, kind, route, and score, but the public Search result
does not expose those fields or model/version. The rollout code can apply or
shadow the result depending on explicit request, CLI/MCP origin, or cohort
[S17][S18].

**Contract drift retained (high):** public docs say Highlights are enabled by
default for every Search user. Pinned source shows an explicit apply/shadow
rollout when the parameter is omitted. This may reflect rollout-era source,
Cloud configuration, or later docs; pinning the OSS tag does not resolve live
Cloud behavior [S3][S13][S17].

**FACT (medium, vendor evaluation):** Firecrawl reports a 94.7% SimpleQA score
for an agent using Search, with GPT-5.4 high reasoning, up to 20 search/fetch
calls, an LLM judge, two sessions per provider, and the better score selected.
This is an attributed end-to-end vendor evaluation, not a standalone retrieval
metric. It includes provider-specific fetch APIs, stochastic agent/judge
behavior, and best-of-two selection; no complete run artifacts or independent
reproduction were found in the bounded pass [S4].

**RECOMMENDATION (high):** adapt query-relative passage selection, but require
`capture_hash + transform_version + passage offsets + selector version + score
semantics`. Preserve fallback state. A Highlight is an untrusted derived
passage—not proof that the passage exists in the current page or supports a
claim.

### 6.3 Provenance assessment

| Required question | Search response | Assessment |
| --- | --- | --- |
| Which provider/corpus produced this hit? | absent | cannot establish upstream lineage |
| Which query reached that provider? | no echoed rewritten query | domain/category transformations and provider rewrites are not returned |
| Why this rank? | optional position | no score/features/explanation |
| Which immutable page version supports text? | mutable URL only | no capture/version/hash |
| Was description provider text or Highlight? | no per-result origin flag | silent fallback makes field lineage ambiguous |
| When was it crawled/indexed/fetched? | absent for Web/Search | News date is content-date-like, not fetch lineage |
| Where in the page is the passage? | absent | no block/span/DOM/byte anchor |
| Was it filtered/safe? | no per-result verdict/removal trace | requested policy is not outcome provenance |
| Was it canonical/deduplicated? | absent | exact/canonical/near-duplicate relation unknown |

**VERDICT (high):** a Firecrawl Search hit is `provider_ranked_untrusted`; a
Highlight is `provider_derived_unanchored`; optional content is
`provider_transformed_untrusted`. None is an immutable Curiosity citation.

## 7. Limits, failures, rate limits, and pricing

### 7.1 Bounded behavior and missing bounds

**FACT (high):** documented direct bounds include `limit` 1–100 per source,
query maximum 500 characters, and a default 60-second timeout. Search rate
limits are 10/100/500/5,000/10,000 requests per minute for Free through Scale;
team keys share limits, and excess returns 429 [S2][S8].

**NEGATIVE RESULT (high):** no useful public maximum was found for number of
domain filters, category/source entries, result title/snippet/Highlight length,
total response bytes, internal candidates, provider pages/calls, Highlight
blocks, fetched bytes/subrequests, or aggregate fused-call work. Scrape formats
can multiply one Search into up to 300 result acquisitions when three standard
sources and `limit=100` are requested, before considering page/PDF/model costs.

**FACT (high for pinned source):** per-result Scrapes run concurrently via
`Promise.all`; Search uses each page's normal scrape machinery and credit
tracking. Browser concurrency/queue limits therefore become relevant to fused
Search even though base SERP search itself is not a browser [S8][S19].

### 7.2 Error semantics

**FACT (high):** endpoint OpenAPI explicitly lists 200, 408, and 500. General
Firecrawl errors additionally document 400, 401, 402, 403, 404, 413, 422, 429,
502, 503, and 504 with `success:false,error` and optional `details/code`; 408,
429, and 5xx classes are generally retryable under bounded backoff [S2][S9].

**FACT (high for pinned source):** Search-specific paths include 400 schema
failure, 403 key/ZDR/threat-policy restrictions, 408 caught scrape timeout, 429
keyless-cap failure, and 500 unhandled failure. Upstream base-search exceptions
can be swallowed into empty 200 success as described above [S13][S14].

**RECOMMENDATION (high):** preserve HTTP/provider details, but normalize stages:
`input`, `auth`, `policy`, `credit`, `rate`, `provider_search`, `filter`,
`page_fetch`, `transform`, `highlight`, `timeout`, `partial`, `empty_unknown`,
and `internal`. Retry only typed idempotent failures within request, time, and
credit budgets. Never retry empty 200 automatically.

### 7.3 Pricing as of access date

**FACT (high, time-sensitive):** ordinary and anonymized-ZDR Search cost two
credits per ten returned results, rounded up; end-to-end ZDR costs ten credits
per ten. Multiple requested sources count their returned results. Optional
Scrape work adds normal per-page costs: base one credit, PDF page costs, and
model/ZDR modifiers can stack [S1][S6].

| Example | Search-only credits, before threat/Scrape extras |
| --- | ---: |
| 1–10 total returned results | 2 |
| 11–20 total returned results | 4 |
| 10 Web + 10 News | 4 |
| 10 end-to-end-ZDR results | 10 |

**FACT (high):** response `creditsUsed` includes Search plus calculated Scrape
usage in pinned execution. Enterprise Threat Protection can add two credits per
unique result URL scanned. Search feedback can refund one credit on the first
substantive submission, subject to team/daily limits [S7][S10][S13].

**Pricing contradiction retained (high):** billing says infrastructure-processed
target 403/404 responses can be charged, while the pricing FAQ says failed
requests are not charged. For fused Search, base result charging, page-level
target failures, and transport failures are different events; only an invoice
or reviewed order form resolves edge cases [S6][S7].

**FACT (high, time-sensitive):** displayed annual-billing self-serve prices were
Free (1,000 credits), Hobby $16/month (5,000), Standard $83 (100,000), Growth
$333 (500,000), and Scale $599 (1,000,000); Enterprise is custom. Smart Upgrade
can automatically increase the tier when enabled [S6][S7].

**RECOMMENDATION (high):** disable Smart Upgrade during evaluation; locally
project `sources × limit × search unit + selected fetches × worst-case page
cost`; reject requests above a hard spend ceiling; reconcile projected and
returned credits; and select URLs before fetching instead of defaulting to
all-result enrichment.

## 8. Privacy, security, legal, and license boundaries

### 8.1 Query/result retention and ZDR

**FACT (high):** end-to-end Search ZDR says neither Firecrawl nor its upstream
provider stores query/result data; anonymized ZDR says Firecrawl stores neither,
while the provider may cache the anonymized query. The Search `enterprise`
option covers only the search stage. Full fused-call ZDR separately requires
`scrapeOptions.zeroDataRetention=true` [S1].

**FACT (high for pinned source):** ordinary non-ZDR execution logs the query and
request options/results and inserts Search request metadata plus result URLs
into analytics storage. The tracking helpers skip query and URL insertion when
their ZDR flag is true [S13][S25]. This is useful source evidence, but not a
complete Cloud retention, backup, access, or subprocessor contract.

**FACT (high):** the general privacy policy permits PII use for service
provision, caching/indexing, tailoring, improvement, analytics, and advertising;
locates servers in the United States; and says PII is retained until written
deletion request because no recurring deletion policy exists [S10]. It does not
publish a Search-specific ordinary-retention duration or complete upstream
provider/subprocessor matrix.

**RECOMMENDATION (high):** assume ordinary Search queries and result URLs are
retained and disclosed to Firecrawl/upstream processors. Never send secrets,
credentials, private hypotheses, customer identifiers, sensitive personal
data, or unpublished competitive information without a reviewed agreement,
purpose, data map, and verified ZDR configuration.

### 8.2 Feedback and improvement loop

**FACT (high):** feedback accepts a rating, valuable source URLs/reasons,
missing topics/descriptions, and query suggestions; docs say it helps improve
Search quality and may refund one credit. Terms grant Firecrawl a worldwide,
irrevocable, royalty-free, sublicensable license to submitted feedback/content
[S10][S12].

**RECOMMENDATION (high):** disable automatic feedback. Submitting a useful URL,
missing fact, or query rewrite can disclose research intent and evaluation
labels and grants broad rights. Require explicit human/data-governance authority
and redact confidential material.

### 8.3 Result safety and untrusted data

**FACT (high):** `safe:true` is an explicit-content filter. Enterprise Threat
Protection can remove blocked result URLs before return and optionally use
Google Web Risk at additional cost; it is a URL-threat classifier, not a
truthfulness, copyright, prompt-injection, or passage-integrity guarantee [S2]
[S13][S24].

**NEGATIVE RESULT (high):** no Search contract guarantee was found for prompt-
injection neutralization, malicious-Markdown sanitization, misinformation,
poisoned snippets/metadata, media-license verification, unsafe returned URLs,
Unicode/confusable handling, or downloaded-artifact scanning.

**RECOMMENDATION (high):** query suggestions, titles, snippets, Highlights,
Markdown, HTML, links, images, metadata, and provider errors are untrusted. They
cannot change policy, request secrets, expand scope, trigger privileged fetches,
or authorize tool use. Curiosity must apply independent egress, robots,
publisher, malware, content, byte, and transform controls to selected fetches.

### 8.4 Hosted terms and third-party rights

**FACT (high, not legal advice):** Firecrawl's terms prohibit unauthorized
commercial use, reproduction/derivative exploitation, unlawful use, reverse
engineering, unauthorized PII dissemination, and several regulated/high-risk
uses. They disclaim third-party timeliness, accuracy, propriety,
non-infringement, and availability and place lawful use risk on the customer
[S12]. Public searchability does not grant rights to store/reuse publisher text,
images, news, or personal data.

**UNKNOWN:** standard terms do not provide a Search-specific result license,
durable-storage/citation right, upstream-provider pass-through terms, content
deletion process, or image/news redistribution license. Procurement/counsel
must review the exact order form, DPA, providers, and intended use.

### 8.5 OSS and third-party license boundary

**FACT (high):** Firecrawl root/server is AGPL-3.0. The README identifies SDKs
and some UI components as separately MIT-licensed; directory-specific license
files govern those subtrees. AGPL section 13 applies source-offer obligations to
modified covered software used through a network [S20][S21].

**FACT (high):** the OSS server has an adapter to an independently configured
SearXNG service. SearXNG is AGPL-3.0-licensed; configuring or operating it is a
separate dependency/compliance decision. The source adapter does not make
SearXNG MIT code or Firecrawl-owned index infrastructure [S15][S26].

**RECOMMENDATION (high):** do not copy Firecrawl Search schemas, query-builder,
provider adapters, HTML parser, highlight/index selection, tracking, billing,
tests, or orchestration into permissive Curiosity code. Independently author a
neutral contract and fixtures from this behavioral dossier. Any Firecrawl or
SearXNG deployment/modification/combination requires separate counsel and
license compliance. Returned third-party content retains its own rights.

## 9. Bounded architecture inference

The following is **INFERENCE (medium-high)** from the public contract and pinned
source, not a claim of exact Cloud topology:

```text
query + source/category/domain/time/locale/safety + budgets
  -> schema/account/key/ZDR/threat-policy admission
  -> category/domain query construction
  -> base search broker
       Cloud: managed Fire-engine -> undisclosed upstream provider(s)/indexes
       OSS: configured SearXNG -> configured engines
            else DuckDuckGo HTML fallback
       optional separate Developer Index query
  -> over-requested typed result groups
  -> URL threat filtering / category annotation / per-source slicing
  -> optional per-result Scrape acquisition (pinned maxAge = 3 days)
  -> optional Search Highlight
       Firecrawl default-variant index lookup (<=30 days)
       -> external highlight model -> description/snippet replacement or fallback
  -> billing + non-ZDR query/result telemetry
  -> synchronous grouped response + job ID + credits used
```

Supporting facts are the controller, executor, managed-service adapter,
SearXNG/DDG fallbacks, query builder, Scrape merger, Highlights path, and
tracking [S13-S19][S22][S25].

This **does not prove** the Cloud provider, whether Fire-engine fuses sources,
the number of provider calls, index ownership inside Fire-engine, provider
contracts, cache topology, model architecture/training, ranking logic, tenant
isolation, Cloud version parity, geographic routing, or production SLOs.

## 10. Clean-room lessons and Curiosity implications

### 10.1 Adopt

1. **ADOPT — separate typed result lanes.** Web, News, Image, and specialized
   indexes need distinct schemas and policies; do not force heterogeneous items
   into one fake scalar ranking.
2. **ADOPT — explicit per-lane result ceilings.** A result count is an output
   bound, but pair it with provider calls, bytes, time, fetches, and spend.
3. **ADOPT — preserve observed position.** Keep original lane/rank and every
   later policy mutation; never invent scores.
4. **ADOPT — query-relative passages as optional derivatives.** They can reduce
   downstream tokens when anchored to immutable captures and fallback is
   explicit.
5. **ADOPT — actual usage and request identity.** Return a stable retrieval ID,
   projected/actual cost, and stage timing without leaking sensitive queries.

### 10.2 Adapt

1. **ADAPT — source/category/domain controls.** Express source policy as typed
   constraints with requested/effective forms and post-validate returned hosts;
   do not rely solely on query-string operators.
2. **ADAPT — time filtering.** Separate claimed publication/event time from
   crawl, fetch, index, query, and derivation times. State which field the
   predicate used.
3. **ADAPT — fused Search+content into a two-gate plan.** Search first, locally
   filter/dedupe/admit, then fetch selected hits under independent budgets.
4. **ADAPT — policy filtering.** Return per-result policy decisions and removed
   counts; do not silently compress ranks.
5. **ADAPT — feedback.** Use permissioned, privacy-reviewed offline judgments;
   do not automatically export user research labels to a provider.

### 10.3 Reject

- Firecrawl/upstream base rank as Curiosity relevance or authority truth.
- “Live,” `tbs`, Search success, or current URL as proof of freshness/liveness.
- Silent Highlight/snippet fallback or overwriting lineage.
- Snippets, Highlights, generated fields, or URLs as durable citation evidence.
- Fetching every result merely because the provider offers a fused call.
- Treating `safe`, Threat Protection, clean Markdown, or provider filtering as
  complete content/security policy.
- Unbounded domain lists, bytes, model work, retries, per-result Scrapes, PDFs,
  or automatic tier upgrades.
- Copying AGPL server behavior or conflating an OSS broker with an owned index.

### 10.4 Defer

- Hosted adapter selection until provider/rights/privacy/provenance and contract
  drift are resolved.
- Search Highlights until they carry capture-bound anchors, selector version,
  score semantics, and an explicit fallback flag.
- News/Image ingestion until publication/media identity, rights, hashes, safety,
  and deletion handling are defined.
- Developer category to its separate product/index review.

## 11. Provider-neutral target contract

Conceptual requirements only; this is not an implementation:

```text
SearchRequest
  original_query
  lanes[]: {web|news|image|specialized, max_results}
  constraints:
    include_hosts[], exclude_hosts[], content_types[], languages[], market?
    valid_time?: {field, from, to, sort}
    safety_policy_ref
  passage_mode: none | anchored_query_passages
  fetch_plan: none | select_after_search
  budgets:
    deadline, max_provider_calls, max_results_total, max_response_bytes,
    max_fetches, max_fetch_bytes, max_model_calls, max_cost

SearchOutcome
  retrieval_id
  status: complete | partial | empty_unknown | failed
  provider_trace:
    provider, contract_version, original_query, effective_query?, controls
  lanes[]:
    lane_status
    hits[]:
      result_id, observed_rank, provider_position?, url, title?
      provider_snippet?: {text, origin, untrusted=true}
      claimed_time?: {value, kind, origin, confidence?}
      policy?: {decision, version, reason_class}
      duplicate_cluster_id?
      passage?: {
        text, capture_id, capture_hash, selector_version, offsets,
        score?, fallback=false, derived_at
      }
  mutations[]: {stage, removed_ids, order_before, order_after, policy_ref}
  usage: {provider_calls, returned_items, bytes, elapsed_ms, cost}
  warnings[]
```

**RECOMMENDATION (high):** adapter fields that Firecrawl cannot establish remain
unknown. It may map job ID, controls, groups, title/URL/snippet/position/category,
optional transformed content, and `creditsUsed`. It must not invent provider,
effective upstream query, fetch/index time, base score, canonical identity,
Highlight origin, immutable capture, or passage offsets.

## 12. Fact / inference / recommendation ledger

| ID | Type | Claim | Confidence | Evidence / verdict |
| --- | --- | --- | --- | --- |
| F1 | FACT | Search is synchronous and returns grouped typed results, job ID, and actual credits. | High | [S1][S2]; **ADOPT interface concepts**. |
| F2 | FACT | Limit is 1–100 per requested source, not a total-work bound. | High | [S1][S2]; add aggregate budgets. |
| F3 | FACT | Domain/category controls are rewritten into upstream query operators in pinned source. | High for pin | [S22]; **ADAPT with post-validation**. |
| F4 | FACT | Public ZDR docs explicitly name an upstream search provider. | High | [S1]; base ownership is external/undisclosed. |
| F5 | FACT | Pinned Cloud path calls managed Fire-engine; OSS alternatives are configured SearXNG or DDG HTML. | High for pin | [S14-S16]. |
| F6 | FACT | Highlights preserve base ranking and replace snippet fields with query-relative page passages when available. | High | [S3][S4]. |
| F7 | FACT | Pinned Highlights use Firecrawl index objects up to 30 days old and an external model service. | High for pin | [S17][S18]. |
| F8 | FACT | Search-triggered Scrape pins three-day `maxAge`; public guide says caller `maxAge` is ignored. | High | [S11][S19]. |
| F9 | FACT | Provider failure and true no-results can collapse to empty successful response in pinned source. | High for pin | [S14]; require `empty_unknown`. |
| F10 | FACT | Non-ZDR pinned tracking stores query metadata and result URLs; ZDR skips those insertions. | High for pin | [S25]. |
| F11 | FACT | Root/server is AGPL-3.0; SDK/UI exceptions are directory-specific. | High | [S20][S21]; no code transfer. |
| I1 | INFERENCE | Firecrawl Search is a broker/enrichment layer, not an evidenced owned general-Web index. | High | F4–F8. |
| I2 | INFERENCE | Base ordering is principally upstream order after policy removals; exact managed division is unknown. | Medium-high | F5–F6 and [S13]. |
| I3 | INFERENCE | “Fresh/live” cannot be audited from Search responses. | High | F7–F8 and provenance gaps. |
| R1 | RECOMMENDATION | Separate discovery, selected fetch, capture, passage, and synthesis. | High | **ADOPTED target principle**. |
| R2 | RECOMMENDATION | Preserve requested/effective query, lane rank, mutations, fallback, and temporal lineage. | High | **ADAPTED**. |
| R3 | RECOMMENDATION | Reject snippets/Highlights/rank as factual authority or citation. | High | **REJECTED as evidence**. |
| R4 | RECOMMENDATION | Defer hosted adapter and evaluation pending contracts and authorized tests. | High | **DEFERRED**. |
| R5 | RECOMMENDATION | Do not copy/deploy modified AGPL server code without separate compliance review. | High | **REJECTED transfer**. |

## 13. Material unknowns and verification gates

### 13.1 Unknowns

1. Exact Cloud upstream provider(s), failover/fusion, index ownership, licensing,
   query routing, and Fire-engine implementation.
2. Query/result cache, ordinary retention, backup/deletion, tenant isolation,
   complete subprocessors, and whether upstream provider terms permit intended
   storage/citation/evaluation.
3. Crawl/index cadence, corpus/language/region coverage, canonicalization,
   duplicate suppression, provider personalization, and deletion/takedown lag.
4. Base ranking features/models/scores, source diversity/host caps, query rewrite,
   position stability, and result completeness.
5. Exact `tbs`, `safe`, country/location, operator, domain, and category behavior
   across source types and upstream changes.
6. Whether current Cloud exactly enforces query length, timeout, per-source
   options, `ignoreInvalidURLs`, and Highlight defaults shown in current docs.
7. Highlight model/version/training, passage scoring/calibration, cache-time
   field, selection bounds, source offsets, and fallback observability.
8. Maximum response/item/Highlight sizes, aggregate provider work, internal
   retries, fused-call concurrency, cancellation, and timeout enforcement.
9. Billing of empty success, partial sources, blocked results, provider retries,
   failed per-result Scrapes, PDFs, Highlight work, and client disconnects.
10. Comparative relevance, freshness, latency, language quality, safety, and
    provider-outage behavior; no live benchmark was authorized.

### 13.2 Checks before any pilot

- **Legal/procurement:** order form, DPA, upstream providers, ZDR scope,
  subprocessors/regions, storage/citation/evaluation rights, deletion, feedback
  license, and publisher/media rights.
- **Contract fixture:** archived OpenAPI/version, strict local query/domain/item/
  byte/time/cost bounds, unknown-field handling, grouped partials, and no-results
  normalization using provider-supplied or organization-owned fixtures.
- **Authorized live contract test:** only owned/public-domain/permissioned pages;
  verify defaults, source/category/domain controls, time/locale/safety, empty and
  partial states, timeout, ZDR, `ignoreInvalidURLs`, credits, and feedback policy.
- **Freshness/provenance:** controlled page revisions to separate upstream
  discovery, Search Scrape cache, Highlight cache, and independent `maxAge:0`
  fetch. Never infer internals from a single result.
- **Quality:** fixed multilingual/fresh/long-tail corpus; independent judgments;
  URL and source recall, duplicates, date validity, primary-source preference,
  passage support/offsets, rank stability, and matched cost/latency. Confirm
  evaluation is contractually permitted.
- **Security:** local policy before provider use; hostile result strings and
  oversized/malformed fixture responses; never probe shared provider SSRF or
  ranking infrastructure without written authorization.

## 14. Bounded curiosity pass

After synthesis, in-frame gaps were scored 1–5 for relevance (R), decision
value (V), novelty (N), and cost (C, lower is better). Priority is
`R + V + N - C`; only public primary-source/static-source work was authorized.

| Thread | R/V/N/C | Score | Action / result |
| --- | --- | ---: | --- |
| Base-index ownership vs “live web” | 5/5/5/1 | 14 | **Pursued.** ZDR docs explicitly identify upstream provider; pinned Cloud path confirms managed delegation. Owned general-Web index claim rejected. |
| Highlight model vs ranking model | 5/5/5/1 | 14 | **Pursued.** Docs say ranking preserved; source shows post-search index lookup and passage service. Kept stages separate. |
| Search page freshness vs Highlight freshness | 5/5/4/1 | 13 | **Pursued.** Triangulated official `maxAge` exception with pinned 3-day Scrape and 30-day Highlight windows. |
| Empty success vs provider failure | 5/5/4/1 | 13 | **Pursued.** Static control flow collapses upstream errors to empty data; retained as a material normalization risk. |
| Public/source contract drift | 5/4/4/1 | 12 | **Pursued.** Found query-length, per-source-option, `ignoreInvalidURLs`, timeout, and Highlight-default gaps; Cloud behavior remains untested. |
| Identify proprietary Cloud upstream from traffic/output | 3/3/5/5 | 6 | **CURIOSITY_NO_GO.** No calls/traffic interception authority; identity is not needed to conclude ownership opacity. |
| Infer ranking weights/models with query probes | 2/2/4/5 | 3 | **CURIOSITY_NO_GO.** Unreliable, contractually/ethically unnecessary, and outside clean-room interoperability. |
| Execute keyless/paid Search benchmark | 4/4/3/5 | 6 | **CURIOSITY_NO_GO.** Caller prohibited calls; requires corpus, judgments, budget, rights, and separate authority. |
| Probe provider retention/ZDR | 5/5/3/5 | 8 | **CURIOSITY_NO_GO.** Unsafe and impossible to prove externally; require contractual assurance/audit. |
| Audit every SearXNG configured engine/license | 2/2/2/5 | 1 | **CURIOSITY_NO_GO.** Deployment-specific and outside standalone hosted Search; retain separate dependency review gate. |
| Definitive copyright/AGPL advice | 4/5/2/5 | 6 | **CURIOSITY_NO_GO.** Counsel task requiring exact deployment/use facts. |

**Stop condition reached:** requested coverage and primary-source saturation.
Remaining high-value questions require provider contracts or separately
authorized controlled tests. This dossier grants no autonomous follow-up.

## 15. Checks performed

- Read repository `AGENTS.md`; kept provider-neutral contracts separate from
  adapters/operations and treated every result as untrusted.
- Used official primary sources accessed 2026-08-17 and verified the pinned
  checkout at commit `7666c1f9ae8720a6bba271e0f60b6a217f8a5210` / tag
  `v2.11.162`.
- Triangulated upstream ownership, Highlight staging, Search page freshness,
  billing, ZDR, and license claims across independent official pages/source
  paths.
- Retained contradictions and negative results rather than filling gaps with
  marketing or community claims.
- Made no hosted/keyless/paid call, credential use, third-party search, package
  install, deployment, benchmark, traffic capture, bypass, or exploit test.
- Copied no upstream implementation; only independently phrased behavioral
  findings and source citations were added.
- Kept Search distinct from Map/Crawl/Scrape/Extract/Research/Developer/Agent;
  adjacent products appear only where they define a Search boundary.
- File-scope check: only `docs/research/products/firecrawl-search.md` was added.

## 16. Primary sources

All web sources were accessed **2026-08-17**. Repository links are pinned to
commit `7666c1f9ae8720a6bba271e0f60b6a217f8a5210`.

- **[S1]** Firecrawl, “Search” feature documentation — product boundary,
  grouped sources, categories/domains, `tbs`, safety, Highlights, fused Scrape,
  Search ZDR/upstream provider, and costs:
  <https://docs.firecrawl.dev/features/search>
- **[S2]** Firecrawl, v2 Search OpenAPI/reference — request/response schema,
  intended bounds, operators, statuses:
  <https://docs.firecrawl.dev/api-reference/endpoint/search>
- **[S3]** Firecrawl, “Search Highlights” — default replacement, ranking
  preservation, Markdown, fallback, result-type and ZDR behavior:
  <https://docs.firecrawl.dev/features/search-highlights>
- **[S4]** Firecrawl, “Introducing our most accurate search yet,” 2026-07-22 —
  relevance-model description and vendor SimpleQA methodology:
  <https://www.firecrawl.dev/blog/introducing-our-most-accurate-search-yet>
- **[S5]** Firecrawl, Search product page — current “live/fresh,” latency,
  source/category, fused-content, and self-host marketing claims:
  <https://www.firecrawl.dev/search>
- **[S6]** Firecrawl, Billing — endpoint costs, stacking, processed target
  errors, plans, Smart Upgrade:
  <https://docs.firecrawl.dev/billing>
- **[S7]** Firecrawl, pricing page — current list prices, credits, and failed-
  request FAQ: <https://www.firecrawl.dev/pricing>
- **[S8]** Firecrawl, rate limits — Search RPM, keyless limits, shared team
  counters, browser queue/concurrency:
  <https://docs.firecrawl.dev/rate-limits>
- **[S9]** Firecrawl, API errors — general response shape, retry classes, and
  non-exhaustive catalog: <https://docs.firecrawl.dev/api-reference/errors>
- **[S10]** SideGuide Technologies / Firecrawl, Privacy Policy, revision
  2024-12-26 — caching/indexing/analytics uses, U.S. storage, retention:
  <https://www.firecrawl.dev/privacy-policy>
- **[S11]** Firecrawl, “Verifying Freshness and Liveness” — temporal boundary
  and explicit Search `maxAge` exception:
  <https://docs.firecrawl.dev/developer-guides/usage-guides/verifying-freshness-and-liveness>
- **[S12]** SideGuide Technologies / Firecrawl, Terms of Use, revision
  2024-11-05 — use restrictions, feedback license, third-party disclaimers:
  <https://www.firecrawl.dev/terms-of-service>
- **[S13]** Firecrawl pinned Search controller and executor — validation,
  filtering, slicing, Scrape/Highlight order, billing, logging:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/controllers/v2/search.ts> and
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/search/execute.ts>
- **[S14]** Firecrawl pinned search routing and managed Fire-engine adapter —
  Cloud delegation and empty-error behavior:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/search/v2/index.ts> and
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/search/v2/fireEngine-v2.ts>
- **[S15]** Firecrawl pinned SearXNG adapter:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/search/v2/searxng.ts>
- **[S16]** Firecrawl pinned DuckDuckGo HTML fallback:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/search/v2/ddgsearch.ts>
- **[S17]** Firecrawl pinned Search Highlights orchestration — 30-day index
  lookup, variant matching, rollout, and fallback:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/search/highlights.ts>
- **[S18]** Firecrawl pinned Highlight service client — external batch service
  boundary and non-public per-passage fields:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/search/highlight-model.ts>
- **[S19]** Firecrawl pinned Search-result Scrape composition — concurrent
  acquisition, forced three-day `maxAge`, partial-error merge, cost tracking:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/search/scrape.ts>
- **[S20]** Firecrawl pinned root AGPL-3.0 license:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/LICENSE>
- **[S21]** Firecrawl pinned README — project/license scope and directory-
  specific exceptions:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/README.md>
- **[S22]** Firecrawl pinned query builder and Search schema — category/domain
  rewriting, defaults, schema/source-option discrepancies:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/lib/search-query-builder.ts> and
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/controllers/v2/types.ts>
- **[S23]** Firecrawl pinned Search result entities — observable lane fields:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/lib/entities.ts>
- **[S24]** Curiosity, separate Firecrawl Scrape dossier — adjacent acquisition
  contract only: [firecrawl-scrape.md](./firecrawl-scrape.md)
- **[S25]** Firecrawl pinned tracking — ordinary query/result URL analytics and
  ZDR early returns:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/lib/tracking.ts>
- **[S26]** SearXNG, official repository/license — separate AGPL dependency:
  <https://github.com/searxng/searxng> and
  <https://github.com/searxng/searxng/blob/master/LICENSE>
- **[S27]** Firecrawl, “Open source or Firecrawl Cloud” and self-hosting guide —
  managed/OSS boundary and pinned release:
  <https://docs.firecrawl.dev/contributing/open-source-or-cloud> and
  <https://docs.firecrawl.dev/contributing/self-host>

## 17. Confidence summary and final disposition

- **High confidence:** public request/result/pricing/ZDR surfaces; explicit
  upstream-provider role; pinned orchestration, cache windows, telemetry, and
  root license.
- **Medium confidence:** exact division of base ranking/snippets between
  Fire-engine and its upstream; current Cloud parity with pinned rollout code;
  billing and timeout edge behavior.
- **Low/unknown:** provider identity and rights, Cloud index composition,
  comparative quality/freshness, rank internals, complete retention/subprocessor
  behavior, and production SLOs.

**ADOPTED:** typed result lanes, explicit per-lane caps, observed rank, optional
query-relative passage stage, stable retrieval identity, and actual usage.  
**ADAPTED:** domain/category/time/safety controls; Search+fetch into two policy
gates; policy mutation traces; capture-anchored passage requirements.  
**REJECTED:** Firecrawl as owned index foundation, hidden provider rank as truth,
“fresh/live” as evidence, silent Highlight fallback, snippets/URLs as citations,
automatic all-result fetch, and AGPL server code transfer.  
**DEFERRED:** hosted adapter, Highlights, News/Image ingestion, and comparative
evaluation until contracts and separately authorized tests close the material
gaps.
