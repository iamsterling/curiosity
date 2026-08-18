# Google Custom Search JSON API / Programmable Search Engine

**Research date:** 2026-08-17  
**Decision frame:** what can an owned global agent-search system learn from
Google Custom Search JSON API and its surrounding Programmable Search Engine
(PSE) control plane, without adopting the service, copying implementation, or
expanding agent authority?  
**Status:** clean-room product research; not an implementation, migration, paid
test, procurement recommendation, or legal opinion.  
**Primary-source access date:** all web sources were accessed 2026-08-17.

## Executive verdict

**REJECTED as a foundation (high confidence).** Custom Search JSON API is closed
to new customers and Google says existing customers must transition by
**2027-01-01**, which its current pricing section calls the service
discontinuation date [S1, S2]. It also depends on Google's index and opaque base
ranking, is capped at 10,000 requests/day, exposes at most the first 100 results,
and lacks the capture-, passage-, version-, and rank-provenance required by an
owned global evidence system [S1, S3, S4]. Google API terms also prohibit using
returned content to build databases or permanent copies, absent owner consent
or legal permission, making it unsuitable as a seed for an owned index [S15].

**ADAPTED as interface and control-plane precedent (high confidence).** Retain
the useful separation between (1) a versionable engine/corpus configuration and
(2) a bounded query endpoint; explicit include/exclude/boost controls; typed
query filters; separate promotions; query metadata for pagination/replay;
publisher-supplied structured metadata; locale, language, duplicate, and adult
content controls; and partial responses [S3-S13]. Do not copy Google branding,
documentation prose, XML, or proprietary behavior.

**Core lesson:** a compact search API can conceal the decisive system. PSE's
wire call is one `GET`, but corpus availability, crawling, indexing, base
relevance, safety, freshness, and lifecycle remain provider-controlled. An
owned Curiosity system should make those dependencies explicit, versioned, and
observable rather than merely reproduce Google's JSON fields.

## 1. Frame, bounded sub-questions, and method

### 1.1 Questions

1. What are the documented request and result contracts, limits, and failure
   boundaries?
2. How does PSE scope a corpus and let an engine owner influence retrieval and
   ranking?
3. Which localization, safety, deduplication, and licensing controls exist, and
   what do they not establish?
4. What provenance survives in a JSON result?
5. What did the product lifecycle and announced closure reveal about dependency
   risk?
6. Which ideas can Curiosity adopt or adapt clean-room, and which must be
   rejected or deferred?

### 1.2 Scope and labels

This report covers public official documentation, official product posts, and
official terms. It does not cover private contracts, partner-only full-web
search, live quality or latency, billing enrollment, credentials, paid calls,
UI scraping, endpoint bypass, or proprietary ranking internals.

- **FACT** — stated in a cited primary source or the official public discovery
  document.
- **INFERENCE** — architectural conclusion from cited facts, not measured here.
- **RECOMMENDATION** — a proposed Curiosity choice.
- Confidence is **high**, **medium**, or **low**.

Vendor documentation establishes offered behavior, not comparative quality.
No Google result content or third-party corpus was retained.

## 2. Product boundary and lifecycle

### 2.1 What the product was

**FACT (high):** PSE lets an owner define a search engine over a website or a
collection of websites, tune ranking, add refinements/promotions, and search web
pages or images. The JSON API programmatically returns that engine's results
[S24].
It is not an independent customer-owned crawler or index: the annotations guide
explicitly says PSE is built on the Google index, so pages absent from that index
cannot appear [S5].

**FACT (high):** the JSON API was announced on 2010-11-01 with Atom and JSON
syndication formats [S18]. “Custom Search Engine” was renamed “Programmable
Search Engine” on 2020-04-30; the announcement described the roadmap as making
public-web content programmatically accessible [S19]. The API name remained
“Custom Search JSON API.”

**INFERENCE (high):** the product has two coupled surfaces:

```text
engine owner control plane
  -> engine ID (`cx`), site patterns, labels, weights, scores,
     refinements, synonyms, promotions, structured-data conventions
  -> Google's crawl/index/base ranking and policy systems
  -> query-time JSON API (`key`, `cx`, `q`, filters)
  -> OpenSearch-shaped metadata + promotions + ranked result snippets
```

The control plane expresses owner intent; it does not transfer control of the
underlying corpus, index, ranking implementation, or serving lifecycle.

### 2.2 Retirement sequence and exact scope

| Date | Official event | What it establishes |
| --- | --- | --- |
| 2010-11-01 | New Custom Search API announced [S18] | The public programmatic API has a roughly 16-year lifecycle by its announced 2027 discontinuation. |
| 2020-04-30 | Product renamed PSE [S19] | Branding changed without replacing the underlying hosted dependency. |
| 2022-08-08 | Popular Queries JavaScript API removal announced for 2022-11-11 [S20] | A peripheral API received about three months' public notice. |
| 2023-12-18 | Site Restricted JSON API retirement announced for 2025-01-08, with Vertex AI Search migration [S16] | A high-volume, up-to-ten-site sibling endpoint was retired first, with about 13 months' notice. |
| 2026-01-20 | Web-search product transition announced [S2] | New engines had to use “Sites to search”; Search Element engines were directed to at most 50 domains, while existing full-web engines and JSON API users had to transition by 2027-01-01. |
| 2026-02-18 docs update | JSON API overview says closed to new customers and calls 2027-01-01 “service discontinuation” [S1] | Confirms this is not merely a recommendation to migrate. |

**FACT (high):** the 2026 announcement distinguishes three paths [S2]:

- Search Element site search remains, constrained to at most 50 domains;
- Vertex AI Search (renamed Agent Search in current Cloud documentation) is the
  suggested alternative for up to 50 domains; and
- use cases needing more than 50 domains or the full web are directed to a
  contact form for a separate full-web solution whose capabilities and pricing
  are not public in the cited material.

**FACT (high):** the closure is specifically the **Custom Search JSON API**, not
a claim that every PSE surface disappears. Existing Search Element engines that
used “Search the entire web” could continue only until 2027-01-01; new engines
were immediately constrained to “Sites to search” [S2].

**INFERENCE (high):** migration targets are not wire-compatible replacements.
Google's site-restricted migration guide requires a new Agent Search app/data
store, enterprise features for website search, new serving methods, and choices
between API-key `searchLite` and OAuth `search`; advanced indexing requires
domain verification and adds indexing cost [S17]. Full-web users are routed to
a non-public sales/intake path instead of a documented replacement [S1, S2].

### 2.3 Lifecycle lessons

1. **RECOMMENDATION (high):** treat a provider's index and endpoint as separate
   substitutable dependencies. A stable endpoint did not protect customers from
   retirement of the serving product.
2. **RECOMMENDATION (high):** record replacement equivalence by corpus,
   authentication, schema, quota, ranking controls, terms, and economics—not by
   vendor word “alternative.”
3. **RECOMMENDATION (high):** own an exportable corpus policy, rank policy,
   evaluation set, and evidence model. PSE configuration was downloadable, but
   the index and ranking state were not.
4. **RECOMMENDATION (high):** maintain shadow serving, deterministic fallback,
   versioned adapters, and a tested provider-removal path before a dependency is
   critical.
5. **INFERENCE (medium):** the earlier Site Restricted and Popular Queries
   removals were observable portfolio signals. Product-risk review should track
   sibling retirements, not only notices for the exact endpoint.

## 3. Request contract

### 3.1 Transport and authentication

**FACT (high):** the documented operation is a single service-style method:

```text
GET https://customsearch.googleapis.com/customsearch/v1
```

The older equivalent host `www.googleapis.com/customsearch/v1` is also shown in
the REST guide. The request body is empty. The guide says `key`, `cx`, and `q`
are required, values are URL-encoded, and the complete request should remain
within 2,048 characters [S3, S6].

**FACT (medium):** authentication documentation is not perfectly aligned. The
intro and overview say an API key is required; the method reference lists the
`https://www.googleapis.com/auth/cse` OAuth scope; and the public discovery
document says a key is required unless an OAuth token is supplied [S1, S3, S6,
S21]. No credentialed test was authorized, so accepted authentication modes for
every existing-customer configuration remain unverified.

### 3.2 Query parameter families

The following is a semantic inventory, not a copied wire specification. The
method reference is authoritative for exact values [S3].

| Family | Fields / behavior | Clean-room lesson |
| --- | --- | --- |
| Engine and query | `cx`, `q`; `hq` appends AND terms; `exactTerms`, `excludeTerms`, `orTerms`; `lowRange`/`highRange`; `linkSite` | Preserve the original query separately from explicit derived constraints. Hidden additions must be visible in a trace. |
| Page bounds | `num` 1–10; one-based `start`; `start + num` cannot exceed 100 | Hard bounds belong in the contract. A global research system needs cursor/snapshot semantics, not a shallow offset window. |
| Corpus at request time | `siteSearch` plus include/exclude `siteSearchFilter`; `fileType`; web versus `searchType=image` | Request filters should narrow an authorized corpus, not silently redefine it. |
| Time and ordering | `dateRestrict` by recent days/weeks/months/years; `sort` expression including structured fields/date | Distinguish claimed publication time, observed time, and index/capture time; Google's API does not return those distinctions. |
| Geography and language | `gl` country boost; `cr` country restriction; `hl` interface/quality hint; `lr` document-language restriction; `c2coff` Chinese variant expansion; deprecated `googlehost` | Boosts, filters, and presentation locale are different concepts and should remain different fields. |
| Quality and safety | `filter` controls duplicate filtering (with host crowding for multi-site search); `safe` enables/disables SafeSearch; `rights` filters asserted licensing categories | Return policy reason classes and uncertainty; a filter is not evidence of rights or perfect classification. |
| Image-only | size, type, color type, and dominant color filters | Keep modality-specific fields in an extension, not the provider-neutral web-hit core. |
| Performance/system | standard `fields` partial-response selector; gzip support; API key/quota system parameters | Bound bytes independently of item count and allow explicitly requested evidence detail. |

**FACT (high):** `gl` boosts documents whose inferred country matches a
two-letter code, while `cr` restricts them. Google says country is determined
from URL top-level domain and web-server IP location [S3]. `hl` is an interface
language that may affect result ranking, whereas `lr` filters document language
[S3, S13].

**INFERENCE (high):** country inference is a retrieval heuristic, not reliable
publisher nationality, legal jurisdiction, hosting intent, or user location.
An owned system should store each of those signals independently with origin and
confidence.

**FACT (high):** `filter=1` enables duplicate filtering by default, and automatic
filtering also includes host crowding for multi-site searches; setting `0`
disables the documented filter [S3, S13]. This is a useful recall/quality knob,
but no duplicate cluster identity or removed-count explanation is returned.

**FACT (medium):** the public discovery document carried revision `20260813` on
access and exposed a `snippetLength` option limited to “specific engines” plus
an `enableAlternateSearchHandler` flag not explained in the ordinary method
page [S21]. These are retained as negative/unknown evidence, not generalized as
portable API features.

## 4. Result contract

### 4.1 Top-level response

**FACT (high):** successful calls return JSON modeled on OpenSearch 1.1 [S1,
S6]. The top-level `Search` object contains [S4]:

- `kind` and an OpenSearch `url` template;
- `queries.request` and, where applicable, `previousPage`/`nextPage`, echoing
  search terms, counts, offsets, engine ID, safety and applied filters;
- `context`, including engine name and optional refinement facets;
- `searchInformation` with server search time and total-result strings;
- optional spelling correction;
- optional `promotions`, separate from ordinary `items`; and
- optional ranked result `items`.

**FACT (high):** query-role arrays contain at most one object per role; next or
previous roles are absent at the boundaries. Google warns that total results in
query metadata are estimated and may be inaccurate, and only the first 100
results are reachable [S4, S6].

**INFERENCE (high):** echoing the normalized query and pagination state is good
replay ergonomics. It is not reproducibility: the response has no index snapshot
ID, ranker version, safety-policy version, or stable cursor, so repeating the
same request can address changed state.

### 4.2 Organic result

**FACT (high):** an ordinary result can contain [S4]:

| Field group | Fields |
| --- | --- |
| Identity/presentation | `kind`, plain/HTML title, full `link`, abbreviated `displayLink`, formatted/HTML-formatted URL |
| Extract | plain/HTML snippet |
| Google state | opaque `cacheId` |
| Type | MIME type and file format |
| Structured metadata | open-shaped `pagemap` object extracted from publisher markup and Google's parsers |
| Refinement | label name, display name, and label operation |
| Images | context page, dimensions, byte size, thumbnail URL and dimensions |

**FACT (high):** no relevance score or rank-explanation field is documented.
No result field identifies the crawl/fetch time, indexed document version,
canonical URL decision, publisher identity, owner cluster, content hash,
passage offsets, snippet source offsets, extraction version, policy decision,
or why this item outranked another [S4].

**INFERENCE (high):** `cacheId` is neither content provenance nor permission to
retrieve/retain a cached copy. It is an opaque identifier, and Google API terms
independently constrain caching and permanent copies [S4, S15].

**RECOMMENDATION (high):** treat `htmlTitle`, `htmlSnippet`, PageMap values,
promotion text, and destination URLs as untrusted external data. Prefer plain
text; sanitize any HTML; validate schemes/hosts; never let returned text invoke
tools, alter policy, or authorize another curiosity branch.

### 4.3 Promotions are not organic hits

**FACT (high):** configured promotions appear in a separate response array and
contain title, link, display link, body lines, and optional image. Engine owners
can trigger them with exact query sets or regular expressions; documentation
allows up to 2,000 promotions per engine [S4, S12].

**RECOMMENDATION (high):** preserve a typed distinction among organic retrieval,
operator promotion, sponsorship/advertising, and downstream answer content.
Never merge promotions into ordinary rank positions or evidence metrics without
an explicit source class and reason.

### 4.4 Partial responses

**FACT (high):** the standard `fields` selector can request selected nested
response fields, while gzip reduces transfer size [S14].

**RECOMMENDATION (medium):** Curiosity should expose named evidence-detail
profiles rather than a provider-shaped arbitrary projection at the agent tool
boundary. Internal/service clients may use projections, but mandatory trust,
provenance, policy, and warning fields must not be projectable away.

## 5. Corpus scoping and availability

### 5.1 Engine-defined scope

**FACT (high):** a PSE can cover one site or a collection. Configuration is split
between a context file (engine behavior) and annotations (URL patterns and
labels). Labels associate sites with include, exclude, promote, demote, and
refinement behavior [S5, S7].

**FACT (high):** annotations can target URL patterns, apply multiple labels, and
carry a score. Uploaded context or annotation files are limited to 30 KB, and an
engine to 5,000 annotations; patterns are recommended to consolidate URLs [S5].

**FACT (high):** availability is the intersection of owner configuration and
Google's index. PSE documentation recommends Search Console sitemaps for absent
pages, but warns improvement is not immediate and accessible/indexed pages can
also appear in Google Search [S5].

**INFERENCE (high):** PSE “corpus” is a policy view over a provider-owned global
index, not a manifest of immutable documents. Inclusion intent does not prove
coverage; exclusion can be enforced at serving, but absence gives no diagnostic
distinction among not crawled, not indexed, policy removed, stale, malformed,
or irrelevant.

### 5.2 New-versus-existing engine transition

**FACT (high):** from 2026-01-20, all new engines had to use “Sites to search.”
The continuing free Search Element path supports at most 50 domains. Existing
engines could retain “Search the entire web” only until 2027-01-01 [S2]. The
general JSON API itself is closed to new customers [S1].

**RECOMMENDATION (high):** Curiosity corpus policy should be an owned,
version-controlled manifest with explicit source/pattern rules, legal/policy
decision IDs, expected coverage, discovery method, crawl state, and measurable
exclusion reasons. Serving responses should report coverage warnings by corpus
cell, not imply that an accepted domain pattern is fully indexed.

## 6. Ranking and query controls

### 6.1 Owner influence, not absolute control

**FACT (high):** PSE documents three rank-tuning layers [S8]:

1. engine keywords (up to 100 characters) boost pages containing domain terms;
2. labels with `BOOST`, `FILTER`, or `ELIMINATE` modes and weights from -1.0 to
   +1.0; and
3. per-annotation scores from -1.0 to +1.0 that modulate or reverse a label's
   influence for a URL pattern.

Google explicitly says owners have strong but not absolute control: base page
relevance and other undisclosed parameters remain influential [S8]. A positive
boost does not guarantee first place, a negative boost does not guarantee
removal, and hard filter/eliminate modes can yield no results.

**INFERENCE (high):** this is a useful architecture: separate hard eligibility
policy from soft rank preferences, and separate global rule strength from
source-specific modulation. Curiosity should adopt that separation while using
owned, inspectable features and deterministic policy precedence.

### 6.2 Facets, rewrites, and synonyms

**FACT (high):** refinement labels can boost, filter, or eliminate labeled
sources and may append a bounded query rewrite. Synonym files automatically
expand matching terms; Google recommends domain-specific rather than common
synonyms [S9, S10].

**RECOMMENDATION (high):** model every derived query as a child branch with the
original query, rule/model version, intent/facet, parent branch, and cost. Do not
hide synonym or rewrite effects. For Curiosity, only a caller-framed,
budget-authorized follow-up may execute; facets do not create authority.

### 6.3 Structured filtering, range, bias, and sort

**FACT (high):** PSE can extract PageMaps, selected meta tags, estimated page
dates, and subsets of JSON-LD, Microformats, RDFa, and Microdata. Structured
operators can filter, strictly sort, softly bias, or range-restrict numeric/date
fields [S11, S13]. Hard sorting omits pages lacking a parsable value; soft bias
does not. Google warns its estimated page date can be wrong and does not return
that estimate in JSON results [S11].

**INFERENCE (high):** a filterable signal that is absent from the result is hard
to audit. Curiosity should return the value, origin, parse confidence, and
decision contribution for every caller-visible filter or sort class, while
bounding feature disclosure to avoid exposing security-sensitive internals.

**RECOMMENDATION (high):** retain typed time semantics:

- `fetched_at` and `first_seen_at` from owned observations;
- publisher-claimed `published_at`/`modified_at` with extraction origin;
- derived date plus confidence and parser version; and
- index snapshot/ingest time.

Do not collapse these into a single “date.”

### 6.4 Ranking policy for an owned system

Adapt the concepts, not the proprietary behavior:

```text
authorized corpus + tombstones
  -> lexical (later hybrid) candidate generation
  -> hard policy/language/time/type filters
  -> transparent feature scoring and bounded owner/source preferences
  -> duplicate and syndication clustering
  -> host/owner/source/time/viewpoint diversification
  -> anchored passage selection
  -> result reasons + coverage and policy warnings
```

**RECOMMENDATION (high):** configuration changes must be immutable versions;
responses name the corpus policy, index snapshot, rank profile, and safety
policy. A boost should have a bounded reason class such as `source_preference`
or `freshness_bias`, not a false claim that the score explains all relevance.

## 7. Safety, localization, and rights

### 7.1 SafeSearch and content safety

**FACT (high):** the current REST method exposes `safe=active|off`, with `off`
shown as default; the discovery document retains deprecated `high` and `medium`
aliases and says an unspecified value falls back to engine configuration [S3,
S21]. The older JSON reference describes `high`, `medium`, and `off`, another
instance of documentation drift [S13]. Google says no adult-content filter is
100% accurate [S13].

**INFERENCE (high):** “safe” is not a complete trust boundary. The API returns no
malware, prompt-injection, hate/violence, self-harm, privacy, secret, or policy
reason object; nor does it expose classifier version/confidence. SafeSearch is a
specific adult-content control, not general agent safety.

**RECOMMENDATION (high):** Curiosity needs layered, versioned signals and final
serving policy: adult content, malware/type risk, prompt injection, spam/rank
abuse, PII/secrets, legal/takedown, and tenant rules. Return safe summaries and
reason classes, not raw sensitive labels. Classifier uncertainty and appeal or
override authority belong in policy operations, never in fetched content.

### 7.2 Localization

**FACT (high):** PSE distinguishes interface language (`hl`), document-language
restriction (`lr`), country boost (`gl`), country restriction (`cr`), and
Simplified/Traditional Chinese expansion (`c2coff`) [S3, S13]. The engine
context's language boosts results in that language but does not exclude others
[S7].

**RECOMMENDATION (high):** preserve that conceptual separation and add explicit
user locale, query language/detection confidence, desired document languages,
geographic intent, and jurisdiction/policy region. Evaluate each
language-region-corpus cell independently; never call English-heavy aggregate
quality “global.”

### 7.3 Duplicate control and diversity

**FACT (high):** duplicate filtering and host crowding are documented, but the
response does not identify duplicate clusters or suppressed results [S3, S13].

**RECOMMENDATION (high):** owned serving should expose bounded aggregate
warnings—near-duplicates removed, host/owner concentration, syndication
clusters, language and temporal distribution—without returning suppressed
unsafe content. URL deduplication alone is not diversity.

### 7.4 Rights filter is not a license

**FACT (high):** `rights` can filter by Creative Commons-related categories
[S3]. Google API terms state that third-party API content may carry intellectual
property rights and may not be used without owner license or legal permission;
they prohibit scraping/building databases/permanent copies and caching beyond
cache headers unless expressly permitted [S15].

**INFERENCE (high):** the `rights` field is a discovery filter, not chain-of-title
evidence or permission for crawling, indexing, display, training, or commercial
reuse. It does not appear as a verified per-result license object.

**RECOMMENDATION (high):** Curiosity's rights ledger must retain asserted
license URL/text, discoverer, capture evidence, applicable content, validity
time, verification state, and review decision. Unknown remains unknown.

## 8. Provenance and evidence quality

### 8.1 What is present

**FACT (high):** useful source-facing fields are a destination URL, displayed
host, title, snippet, MIME/file format, optional structured metadata, and image
context URL. Query metadata records applied request controls, and context names
the engine [S4].

**FACT (high):** PageMap can carry publisher-supplied arbitrary metadata or data
derived by Google from selected page markup. Google normalizes and retains only
a subset; PageMap values are returned as an open object [S11].

### 8.2 What is absent

The documented response lacks:

- stable owned `document_id`, `capture_id`, and `passage_id`;
- fetched URL versus redirect-terminal versus declared canonical URL;
- fetch time, first/last seen, document version, and index snapshot;
- raw/content/passage hash and snippet offsets;
- extraction/parser version and metadata field-level origin;
- publisher/owner identity and mirror/syndication cluster;
- source class (primary, secondary, promotion, official, community, etc.);
- policy, robots, takedown, or rights decision IDs;
- retrieval channels, rank-profile version, bounded rank reasons, or score;
- uncertainty, contradiction, coverage, stale-index, or partial-shard warnings.

**INFERENCE (high):** the JSON API is a discovery/result-display contract, not a
durable evidence contract. It can point a researcher to a page but cannot by
itself support reproducible citation, document-version comparison, or audit of
why evidence was selected.

### 8.3 Curiosity evidence contract

**RECOMMENDATION (high):** a Curiosity hit should minimally return:

```text
request_id, response_schema_version, corpus_policy_version, index_snapshot_id
document_id, capture_id, passage_id
fetched_url, terminal_url, declared_canonical_url, cluster_id
title, plain_text_snippet, snippet_offsets, passage_hash
fetched_at, first_seen_at, claimed_published_at + origin/confidence
source_type, publisher_id/owner_cluster + confidence
retrieval_channels, bounded_reason_classes
rights/policy decision references
trust = untrusted_external_evidence
coverage/freshness/policy/partial-failure warnings
```

Scores, if exposed, must be scoped to a ranker/index version and declared
non-comparable across versions. Search snippets are discovery aids; final claims
should cite a fetched, immutable passage.

## 9. Quotas, pricing, and global-agent fit

### 9.1 Documented economics

**FACT (high):** only existing JSON API customers can use the closing service.
They receive 100 queries/day free. Additional requests cost **US$5 per 1,000**,
with a maximum of **10,000 queries/day**, until 2027-01-01 [S1]. Usage is
visible in the Cloud API Dashboard and can be monitored/alerted through Cloud
Operations under service `customsearch.googleapis.com` [S1].

**FACT (high):** `num` is at most 10 and only the first 100 results are
accessible, so exhausting the documented result window requires up to ten
billable/quota-counted requests [S3, S6]. At list price that is up to US$0.05 for
one query's first 100 results after the free allowance; this is arithmetic, not
a Google quote.

**FACT (high):** the retired Site Restricted sibling cost the same US$5/1,000
but had no daily request limit, provided the engine searched no more than ten
specific sites and “Search the entire web” was off [S16]. It ceased serving on
2025-01-08.

### 9.2 Capacity implication

**INFERENCE (high):** 10,000/day averages only about 0.116 requests/second over
24 hours and is not a credible ceiling for a global multi-tenant agent-search
plane. Bursts, retries, evaluation traffic, pagination, and bounded curiosity
branches consume the same request budget. The API documents no purchasable path
above the daily ceiling [S1].

**RECOMMENDATION (high):** an owned system should budget and rate-limit by
tenant, research frame, branch, query stage, returned bytes, candidate work,
reranker work, and deadline—not only calls. Return explicit partial results and
budget exhaustion. Keep a global kill switch and prevent retry storms.

### 9.3 Unknown quota mechanics

The reviewed public sources do not establish per-second defaults, burst limits,
per-user quota behavior, exact quota reset timezone, retry headers, or the error
payload for each exhaustion class. The discovery document exposes a standard
`quotaUser` identifier, but no evidence here proves its operational allocation
semantics for this API [S21]. These are intentionally **UNKNOWN** because no
credentialed test or Console inspection was authorized.

## 10. Terms, clean-room boundary, and non-adoption

### 10.1 Contractual constraints relevant to owned search

**FACT (high):** using the API incorporates Google APIs terms, PSE terms, and
JSON API additional terms [S22]. The API terms prohibit building databases or
permanent copies from returned content, caching beyond permitted cache headers,
misrepresenting source, removing attribution/notices, sublicensing equivalent
APIs, bypassing limits, and reverse engineering [S15]. They require credential
confidentiality and allow Google to discontinue APIs [S15].

**FACT (high):** PSE terms separately reserve Google's ownership of the service,
allow modification/termination, disclaim completeness and uninterrupted/error-
free service, and say Google does not warrant that PSE includes every configured
domain [S23]. They also grant Google broad rights in customer-supplied metadata
such as labels and URL associations [S23].

**FACT (high):** JSON API additional terms say Google will announce an intended
discontinuation or backward-incompatible change and may change fees with 90
days' notice [S22]. The current closure was publicly announced [S1, S2].

**UNKNOWN / legal review required:** PSE terms contain broad language against
automated or “Internet agent” query generation in the context of invalid means
[S23]. The JSON API is itself programmatic, so this report does not interpret
that clause as a categorical ruling on every agent use. Any actual legacy use
would require counsel and the customer's complete governing agreement. This
does not affect the product rejection: new access is unavailable and the
service is closing.

### 10.2 Permissible clean-room learning

Subject to legal review and independent authorship:

- learn capability categories and public field semantics;
- implement neutral concepts such as hard filters versus boosts, pagination
  metadata, source classes, partial responses, and policy versions;
- use OpenSearch 1.1 and other public standards from their normative sources;
- create independent fixtures and tests from project-owned or permitted pages;
- compare only aggregate behavior obtained through authorized access and terms.

### 10.3 Prohibited or rejected transfer

- **REJECTED:** copying Google code, documentation prose/examples, branding,
  private responses, or proprietary ranking behavior.
- **REJECTED:** scraping Google UI/API results to seed, train, evaluate, or
  backfill the owned index.
- **REJECTED:** bypassing closure, account eligibility, quotas, authentication,
  caching, or result-window limits.
- **REJECTED:** treating a result, cache ID, PageMap, or `rights` filter as a
  license grant.
- **REJECTED:** using Google output as a hidden oracle in production ranking.
- **DEFERRED:** any compatibility migration for an actual existing customer;
  that requires contract, workload, and legal authority absent from this frame.

## 11. Architectural implications for Curiosity

| Google/PSE observation | Fact or inference | Curiosity verdict |
| --- | --- | --- |
| Engine configuration is separate from query serving [S5, S7] | FACT | **ADOPTED:** separate versioned corpus/rank/policy control plane from provider-neutral serving. |
| `cx` selects a configured view over Google's index [S3-S5] | FACT | **ADAPTED:** select an owned corpus-policy version, not a provider engine ID in the public ABI. |
| Include/exclude are distinct from weighted boosts [S8] | FACT | **ADOPTED:** hard eligibility before soft scoring, with reason codes. |
| Owner preferences cannot fully control relevance [S8] | FACT | **ADOPTED:** never imply manual boosts equal deterministic placement; evaluate interactions. |
| Promotions are separate from organic items [S4, S12] | FACT | **ADOPTED:** typed source/result classes; promotions excluded from organic metrics. |
| Query metadata echoes filters and page navigation [S4, S6] | FACT | **ADAPTED:** request trace plus stable cursor and snapshot, not offset alone. |
| PageMap returns open publisher metadata [S11] | FACT | **ADAPTED:** flexible metadata extensions with field-level origin, schema version, and trust. |
| Estimated dates can rank but are absent from JSON [S11] | FACT | **REJECTED behavior:** every material sort/filter signal must be auditable. |
| SafeSearch is narrow and imperfect [S13] | FACT | **ADAPTED:** one signal in layered policy, never a universal “safe” bit. |
| Only first 100 results, 10/page [S3, S6] | FACT | **REJECTED as global retrieval:** use bounded cursor/snapshot depth appropriate to evaluated agent tasks. |
| No rank score/reason or capture provenance [S4] | FACT | **REJECTED schema:** return bounded retrieval reasons and evidence lineage. |
| Google-index dependence controls actual coverage [S5] | FACT | **REJECTED foundation:** owned crawl/index with measurable corpus cells. |
| API closes despite a mature, documented contract [S1, S2] | FACT | **ADOPTED risk control:** provider-removal drills, shadow path, exportability, lifecycle register. |
| API content cannot seed permanent databases under standard terms [S15] | FACT | **REJECTED data source:** independently acquire authorized content. |

### 11.1 Provider-neutral boundary

**RECOMMENDATION (high):** do not expose Google names such as `cx`, `gl`,
`pagemap`, or `cacheId` in Curiosity's domain contract. A provider adapter could
map historical responses for migration, but the neutral request should use
`corpus_policy`, `locale`, `document_languages`, `geographic_intent`,
`safe_search_policy`, `time_range`, and explicit source filters. Provider wire
objects remain adapter-private.

### 11.2 Bounded agent authority

**RECOMMENDATION (high):** search only returns untrusted evidence. It cannot:

- create a new research frame;
- spend beyond the caller's total/branch budget;
- follow promotions or returned instructions automatically;
- grant write/action tools;
- convert a refinement or suggested spelling into autonomous continuation; or
- approve its own safety/policy exception.

After synthesis, one in-frame curiosity pass may score gaps by relevance,
value, novelty, and cost. Only caller-declared authority permits execution;
rejected branches are recorded as `CURIOSITY_NO_GO`.

### 11.3 Evaluation implications

**RECOMMENDATION (high):** evaluate owned replacements on frozen authorized
captures and immutable index manifests. Track Recall@k/nDCG@k, primary-source
recall, citation entailment/resolvability, freshness lag, language/geography,
host/owner/source diversity, duplicate/syndication rate, unsafe leakage,
coverage warnings, latency/cost, and marginal evidence per curiosity branch.
Estimated total hits and vendor search time are not quality metrics.

## 12. Unknowns, contradictions, and negative results

### 12.1 Material unknowns

1. **Full-web successor:** public sources provide only an interest form, not
   eligibility, schema, index scope, pricing, quotas, SLA, terms, or launch
   commitment [S1, S2].
2. **Closure mechanics:** “service discontinuation” is explicit, but reviewed
   sources do not state exact post-deadline HTTP status, data/config export
   window, or whether any private contracts extend access [S1].
3. **Authentication:** public key-required language, OAuth scope, and discovery
   language are not perfectly aligned; not tested [S3, S6, S21].
4. **Safe default:** ordinary method docs say `off`; discovery allows engine
   fallback when unspecified; older docs retain now-deprecated levels [S3, S13,
   S21]. A security-sensitive client must set policy explicitly.
5. **Ranking internals:** feature set, score calibration, freshness, crawling,
   spam handling, and personalization beyond documented controls remain opaque.
6. **Coverage:** no per-engine crawl/index completeness or freshness guarantee
   was found; PSE terms disclaim inclusion of all configured domains [S23].
7. **Operational quota details:** burst/QPS/reset/retry/error specifics were not
   established without credentials.
8. **Result retention:** actual cache headers were not observed. Standard terms
   remain the controlling conservative boundary [S15].

### 12.2 Documentation contradictions/drift

- The general PSE overview last updated 2024 still labels JSON API availability
  “Everyone,” while the current JSON API overview says it is closed to new
  customers [S1, S24]. Use the product-specific, later closure notice.
- SafeSearch's older reference lists `high/medium/off`; current REST lists
  `active/off`; discovery marks high/medium deprecated and introduces
  engine-fallback semantics [S3, S13, S21].
- The method reference lists an OAuth scope while introductory pages emphasize
  mandatory API keys [S1, S3, S6].
- `searchInformation.totalResults` is described as total results, while query
  role `totalResults` is explicitly estimated and may be inaccurate [S4]. Treat
  both as non-authoritative estimates.

### 12.3 Negative results retained

- No official public source reviewed establishes that the contact-only full-web
  successor is generally available or a drop-in JSON API replacement.
- No independent or official benchmark establishes PSE relevance, freshness,
  coverage, safety, or latency superiority for Curiosity workloads.
- No documented result-level relevance score, rank reason, capture timestamp,
  immutable document version, or passage anchor was found.
- No public documentation found here provides a quota purchase path beyond
  10,000 JSON API queries/day.
- No rights filter or cache identifier was found that grants reuse rights.
- No live call was made; therefore undocumented runtime behavior, headers, and
  errors were not inferred from examples or third-party reports.

## 13. Verification checks performed

| Check | Evidence | Outcome |
| --- | --- | --- |
| Closure date and new-customer status | Product overview, pricing text, 2026 official announcement [S1, S2] | Confirmed 2027-01-01 transition/discontinuation and closure to new API customers. |
| Scope of closure | Announcement distinguishes Search Element, Vertex/Agent Search, full-web intake, and JSON API [S2, S17] | Avoided false claim that all PSE closes. |
| Earlier sibling retirement | Site Restricted docs and announcement [S16] | Confirmed endpoint stopped 2025-01-08; kept distinct from general API. |
| Wire schema | REST method, Search type, REST guide, live public discovery document [S3, S4, S6, S21] | Parameter/result families triangulated; drift recorded. |
| Corpus behavior | Overview, annotations, configuration docs [S4, S5, S7] | Confirmed Google-index dependency and configuration limits. |
| Ranking controls | Ranking, refinements, rewrites, structured search [S8-S13] | Confirmed hard/soft controls and absence of absolute owner control. |
| Price and limits | Current product overview plus method/REST guides [S1, S3, S6] | Confirmed 100 free/day, $5/1,000, 10,000/day, 10/page, first 100. |
| Retention/attribution boundary | Google API terms and incorporated additional terms [S15, S22, S23] | Confirmed no database/permanent-copy foundation under standard terms. |
| Access boundary | Research log | Public docs only; no key, billing, form submission, paid test, bypass, or private material. |

## 14. Bounded curiosity pass and stop decision

Scores are 1 (low) to 5 (high); cost is 1 (cheap) to 5 (expensive).

| Thread | Rel. | Value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Distinguish API closure from all-PSE closure | 5 | 5 | 4 | 1 | **Pursued:** official 2026 announcement showed continuing <=50-domain Search Element and separate full-web intake [S2]. |
| Verify whether terms permit using results as owned-index seed | 5 | 5 | 4 | 1 | **Pursued:** standard API terms prohibit databases/permanent copies and overlong caching [S15]. |
| Check current schema beyond stale method page | 4 | 4 | 4 | 1 | **Pursued:** public discovery revision 20260813 exposed doc drift and two limited/undocumented parameters [S21]. |
| Submit full-web interest form | 3 | 3 | 4 | 4 | `CURIOSITY_NO_GO`: would create external contact/procurement activity and still not yield a public, reproducible contract. |
| Run free/paid black-box result comparisons | 4 | 3 | 3 | 5 | `CURIOSITY_NO_GO`: credentials, account eligibility, billing, retained vendor content, and benchmark frame are absent. |
| Probe post-closure behavior early or bypass eligibility | 1 | 1 | 2 | 5 | `CURIOSITY_NO_GO`: impossible before date, unauthorized, and contrary to clean-room/access boundaries. |
| Interpret agent-use clause conclusively | 4 | 4 | 3 | 5 | `CURIOSITY_NO_GO`: legal conclusion outside authority; counsel only if legacy use becomes real. |
| Reconstruct proprietary ranking from outputs | 1 | 2 | 4 | 5 | `CURIOSITY_NO_GO`: unnecessary, unreliable, terms-sensitive, and not needed for the owned architecture. |

**Coverage:** request/results, corpus, ranking, quotas, safety/localization,
provenance, pricing, lifecycle, clean-room boundaries, architecture, and
Curiosity implications are covered.  
**Saturation:** additional official pages repeated the same hosted-index,
engine-configuration, and transition boundaries without changing the verdict.  
**Stop:** coverage and saturation reached. Follow-up execution requires a new
caller-declared frame and authority.

## 15. Source and confidence ledger

All sources are Google primary sources accessed 2026-08-17. Documentation page
update dates are noted where they materially qualify currency.

| ID | Primary source | Used for | Confidence / qualification |
| --- | --- | --- | --- |
| **S1** | Google, **Custom Search JSON API overview**, updated 2026-02-18. https://developers.google.com/custom-search/v1/overview | Closure, 2027 date, new-customer status, pricing, monitoring, replacement directions | **High.** Product-specific current notice. |
| **S2** | Google PSE Blog, **Updates to our Web Search Products & Programmable Search Engine Capabilities**, 2026-01-20. https://programmablesearchengine.googleblog.com/2026/01/updates-to-our-web-search-products.html | Announced transition, <=50 domains, new engine restriction, full-web intake | **High.** Original product announcement. |
| **S3** | Google, **Method: cse.list**, updated 2024-08-21. https://developers.google.com/custom-search/v1/reference/rest/v1/cse/list | Endpoint, request fields, bounds, OAuth scope | **High** for documented contract; later discovery drift noted. |
| **S4** | Google, **Search response type**, updated 2024-08-21. https://developers.google.com/custom-search/v1/reference/rest/v1/Search | Top-level, promotion, result, query metadata schemas | **High** for documented schema; no live response validation. |
| **S5** | Google, **Annotations: Defining Sites to Search**, updated 2024-08-21. https://developers.google.com/custom-search/docs/annotations | Google-index dependency, URL patterns, 30 KB/5,000 limits, sitemap coverage | **High.** Direct design documentation. |
| **S6** | Google, **Use REST to Invoke the API**, updated 2025-08-28. https://developers.google.com/custom-search/v1/using_rest | Required key/cx/q, 2,048-character request, response roles, 100-result ceiling | **High.** Direct usage guide. |
| **S7** | Google, **Configuration files** and **Context**, updated 2024-08-21. https://developers.google.com/custom-search/docs/basics and https://developers.google.com/custom-search/docs/context | Context/annotation split, labels, language boost, engine behavior | **High.** Direct control-plane docs. |
| **S8** | Google, **Custom Ranking**, updated 2024-08-21. https://developers.google.com/custom-search/docs/ranking | Keywords, modes, weights, scores, non-absolute influence | **High.** Direct ranking-control docs; base algorithm remains opaque. |
| **S9** | Google, **Refining Searches**, updated 2024-08-21. https://developers.google.com/custom-search/docs/refinements | Facets, boost/filter/eliminate, rewrite | **High.** |
| **S10** | Google, **Rewriting Queries**, updated 2024-08-21. https://developers.google.com/custom-search/docs/queries | Rewrite, synonyms, autocomplete concepts/limits | **High.** |
| **S11** | Google, **Providing Structured Data**, updated 2024-08-21. https://developers.google.com/custom-search/docs/structured_data | PageMap and markup extraction, date estimate, JSON result limitations | **High** for documented extraction; retained subsets can evolve. |
| **S12** | Google, **Promotions**, updated 2024-08-21. https://developers.google.com/custom-search/docs/promotions | Promotion triggers, schema, limits | **High.** |
| **S13** | Google, **JSON API reference** and **Filtering and sorting**, updated 2024-08-21. https://developers.google.com/custom-search/docs/json_api_reference and https://developers.google.com/custom-search/docs/structured_search | Localization, duplicate/host filters, legacy SafeSearch, structured filters/sort/bias/range | **Medium-high.** Some SafeSearch vocabulary is stale versus current REST/discovery. |
| **S14** | Google, **Performance Tips**, updated 2025-12-23. https://developers.google.com/custom-search/v1/performance | gzip and `fields` partial responses | **High.** |
| **S15** | Google, **Google APIs Terms of Service**, modified 2021-11-09. https://developers.google.com/terms | content retention, attribution, limits, credentials, discontinuation | **High** as public standard terms; legal application requires counsel. |
| **S16** | Google, **Custom Search Site Restricted JSON API** and original retirement post. https://developers.google.com/custom-search/v1/site_restricted_api and https://programmablesearchengine.googleblog.com/2023/12/custom-search-site-restricted-json-api.html | Sibling scope, price, no daily limit, 2025 retirement | **High.** Historical sibling, not the general endpoint. |
| **S17** | Google Cloud, **Migrate from Custom Search Site Restricted JSON API**, updated 2026-08-11. https://cloud.google.com/generative-ai-app-builder/docs/migrate-from-cse | Replacement topology and non-wire-equivalence | **High.** Current docs call Vertex AI Search “Agent Search.” |
| **S18** | Google Custom Search Blog, **New Google APIs Console features a new Custom Search API**, 2010-11-01. https://programmablesearchengine.googleblog.com/2010/11/new-google-apis-console-features-new.html | API launch chronology | **High.** Original announcement. |
| **S19** | Google Custom Search Blog, **Custom Search Engine is now Programmable Search Engine**, 2020-04-30. https://programmablesearchengine.googleblog.com/2020/04/custom-search-engine-is-now_30.html | Rename and product positioning | **High.** Original announcement. |
| **S20** | Google PSE Blog, **Removing the Popular Queries API**, 2022-08-08. https://programmablesearchengine.googleblog.com/2022/08/removing-popular-queries-api.html | Prior lifecycle signal and notice period | **High.** Peripheral API only. |
| **S21** | Google, **Custom Search v1 public discovery document**, revision `20260813`. https://customsearch.googleapis.com/$discovery/rest?version=v1 | Machine-readable request/schema cross-check and drift | **High** for published discovery metadata; unexplained fields remain unknown. |
| **S22** | Google, **Custom Search JSON API Additional Terms**, modified 2020-01-11. https://developers.google.com/custom-search/terms | Incorporated terms, fees, deprecation announcement commitment | **High** as public terms; not legal advice. |
| **S23** | Google, **Programmable Search Engine Terms of Service**. https://support.google.com/programmable-search/answer/1714300 | Service modification, automation language, metadata rights, completeness disclaimer | **High** as public terms; applicability/interpretation requires counsel. |
| **S24** | Google, **Programmable Search Engine overview**, updated 2024-08-21. https://developers.google.com/custom-search/docs/overview | Product use cases, offering comparison, stale availability row | **Medium-high.** Capability overview is primary; its JSON API availability row is superseded by S1/S2. |

### Overall confidence

- **High:** announced closure scope/date, current list price/daily cap, documented
  request/result shape, Google-index dependency, and absence of documented
  evidence provenance.
- **Medium-high:** exact behavior of older configuration/ranking features through
  the closing API, because public docs are dated and no live calls were made.
- **Low/unknown:** successor full-web availability/economics, undocumented
  ranking, burst quotas, post-closure runtime behavior, and private-contract
  exceptions.
