# Kagi Search: hosted aggregation and owned-index product study

**Research date:** 2026-08-17  
**Scope:** Kagi Search as a search, retrieval, and answer product. Orion and
unrelated browser features are excluded.  
**Decision frame:** what Kagi demonstrates about combining owned discovery with
licensed and intermediary upstream search, and which product/contract ideas
Curiosity should adopt without making Kagi or another hosted provider its
foundation.  
**Status:** clean-room product research, not an implementation, subscription
test, benchmark, or endorsement.

## Executive finding

Kagi is best described as a **hosted multi-source search product with a small,
distinctive owned discovery layer**, not as either a pure metasearch engine or a
fully owned general-web index. Kagi says a typical query fans out to about a
dozen sources. It directly licenses Mojeek, Brave, Yandex, Wikipedia,
TripAdvisor, Yelp, Apple, and Wolfram Alpha; operates its proprietary Small Web
index and the Teclis/TinyGem indexes; and, for Google/Bing-style SERPs it cannot
license directly on acceptable terms, currently uses third-party SERP API
providers [S1][S2]. This is unusually candid evidence that the product's value
is in source orchestration, re-ranking, controls, and presentation, while broad
general-web discovery remains materially upstream-dependent.

**Overall verdict:**

- **ADOPT** explicit user agency: domain raise/lower/block/pin, temporary
  personalization disablement, constrained reusable lenses, verbatim mode, and
  AI as a reversible layer over ordinary results.
- **ADAPT** Kagi's typed API facets, but make bounds, source lineage, partial
  failures, timestamps, captures, and rank reasons first-class rather than
  implicit.
- **REJECT** Kagi's hosted result blend or API as Curiosity's owned-search
  foundation. It would replace one opaque upstream dependency with another and
  cannot provide chain-of-custody over crawling, source contribution, or rank.
- **DEFER** any Kagi API evaluation to a separately authorized, paid comparative
  test. No account, token, subscription, API call, or authenticated UI was used
  here.

Confidence is **high** on the public product shape and contract, **medium** on
the relative role of each source, and **low** on undocumented ranking weights,
coverage, recrawl behavior, and result-level lineage.

## 1. Frame, bounded questions, and method

The investigation asked:

1. Which discovery is owned, directly licensed, or obtained through an
   intermediary?
2. What is publicly established about retrieval, ranking, personalization,
   lenses, and source controls?
3. How do Quick Answer, page summarization, and answer APIs preserve or lose
   evidence?
4. What query and response contracts are publicly available?
5. What freshness, provenance, privacy, and business-model guarantees exist?
6. Which ideas transfer clean-room to Curiosity, and which dependencies or
   unknowns prevent adoption?

### Method and limits

Official Kagi documentation, API reference/OpenAPI-rendered reference, policy,
company blog, official GitHub material, and the Teclis project page were read as
primary sources. All web sources were accessed 2026-08-17. Product claims prove
what Kagi represents, not comparative quality. Claims were triangulated where
material. Search snippets were discovery leads only. No subscription path,
credentials, private endpoints, anti-bot measures, paid API, or source code was
tested or bypassed.

Labels:

- **FACT** — directly stated or exposed by a cited primary source.
- **INFERENCE** — the narrow conclusion best supported by those facts.
- **RECOMMENDATION** — a Curiosity design choice.
- Confidence is **high**, **medium**, or **low**.

## 2. Product and source architecture

### 2.1 Owned versus upstream discovery

| Layer | Public evidence | Classification | Confidence |
| --- | --- | --- | --- |
| Teclis | Kagi calls Teclis its own web/non-commercial index. The Teclis page says it includes its own crawl, Kagi Small Web, and Marginalia results used with permission [S1][S3]. | **Mixed owned + permissioned enrichment**, not a general-web index in isolation. | High |
| TinyGem | Kagi calls TinyGem its own news index and uses it for non-mainstream news/Small Web freshness [S1][S4]. | **Owned niche/news index**, detailed coverage unknown. | High |
| Small Web | An official, publicly maintained feed list supplies personal blogs, YouTube channels, and comics; Kagi says relevant content enters search and its feed refreshes every five hours [S5][S6]. | **Owned curation and indexing over public third-party content.** The list is transparent; page rights are not transferred by list licensing. | High |
| General licensed sources | Kagi says it has direct licenses with Mojeek, Brave, Yandex, Wikipedia, TripAdvisor, Yelp, Apple, and Wolfram Alpha [S2]. | **Upstream, contract-dependent discovery/data.** | High |
| Specialist/vertical sources | Kagi additionally names Marginalia, Open Meteo, Apple, Wikipedia, Wolfram Alpha, Yelp, TripAdvisor and other APIs [S1]. | **Upstream vertical or specialist data.** Exact per-query routing is unknown. | High |
| Google/Bing-style coverage | Kagi says direct Google access is unavailable on compatible terms and Bing's terms prohibited reordering/merging before its API retirement. Kagi therefore uses third-party SERP API providers as an interim route [S2]. | **Intermediated upstream SERP acquisition**, expressly not Kagi's preferred end state. | High |
| Fusion/ranking/product | Kagi describes calling about a dozen sources per typical query, then applying its own ranking and controls [S1][S7]. | **Kagi-owned orchestration and user experience** over mixed discovery. | High |

**FACT (high):** Kagi's January 2026 account is more precise than the general
help page: it distinguishes direct licenses, Kagi's proprietary index, failed
Google/Bing licensing, and an interim third-party SERP-provider route [S2].

**INFERENCE (high):** “anonymized API calls to all major search result
providers” [S1] must not be read as direct contracts with every major engine.
At least some broad SERP access is indirect. The safer architecture label is
**hosted aggregation plus proprietary enrichment and re-ranking**.

**INFERENCE (medium):** Teclis/TinyGem supply differentiation and long-tail
diversity rather than full general-web recall. Kagi's own Enrichment API says
these indexes are not general indexes and work best combined with one [S4].
Kagi's continued effort to secure broad index access independently confirms
that the owned corpus does not replace general discovery [S2].

### 2.2 Teclis discovery and ranking evidence

The Teclis project page publicly describes a hybrid crawler using asynchronous
HTTP and browser rendering, filtering pages according to uBlock Origin-blocked
request counts, following some dead links into the Internet Archive, extracting
with Trafilatura/Readability, detecting language with fastText, and combining
three ranking channels: full-text search, semantic embeddings, and vector
search [S3]. Kagi's quality documentation separately says it crawls the Wayback
Machine to recover useful unavailable content [S7].

These details are **FACTS about a disclosed implementation description**, not
evidence that the current production Kagi blend uses every named component or
threshold unchanged. The Teclis page is copyright-marked 2019–2024 and does not
publish corpus size, crawl policy, recrawl scheduler, evaluation results, or
production deployment mapping. Confidence that the page describes historical
Teclis design is high; confidence that it is a complete 2026 production design
is low.

**Clean-room boundary:** the named components and one disclosed tracker-count
threshold are observations, not a design mandate. Curiosity should derive its
own quality policy and evaluate ads/trackers as explainable signals, not silently
exclude a page based on a copied heuristic. Some named dependencies have their
own licenses; none should enter project code without separate review.

## 3. Ranking, personalization, lenses, and controls

### 3.1 Default ranking

**FACT (high):** Kagi says its ranking primarily considers relevance and user
intent; prioritizes non-commercial sources when appropriate; down-ranks pages
with many ads/trackers; considers a site's “natural” rank; and then applies the
user's domain preferences [S1][S7]. Website Info can expose detected ad/tracker
counts, popularity rank, HTTPS, and response speed [S8].

**UNKNOWN:** no public source defines the candidate pool, fusion method across
providers, deduplication, query classification, feature weights, learning
method, source quotas, source failure behavior, or whether upstream rank is a
feature. There is no public proof that ad/tracker count causally predicts
quality; Kagi presents it as an observed correlation [S1]. There is likewise no
public comparative benchmark supporting “superior” or “unparalleled” claims.

**INFERENCE (medium):** Kagi's main rank innovation is not a novel disclosed
retrieval algorithm. It is a different objective function—relevance plus
non-commercial/low-tracker preferences—applied to a broad result union, with
user-controlled overrides. This is meaningful product differentiation even
though its implementation is opaque.

### 3.2 Domain personalization

The web UI supports **block, lower, normal, higher, and pin** at whole-domain
granularity. Personalization can be disabled for a single search. UI controls
do not support path wildcards or regular expressions [S8]. The current Search
API is more expressive: a request may supply up to 1,000 domain rules with
`block|lower|raise|pin` and up to 1,000 regex replacement rules, each regex at
most 1,000 bytes [S9]. Account settings can also be inherited by API calls
[S10].

**FACT (high):** Kagi anonymously aggregates user domain tags into a public
leaderboard [S8]. It does not say this aggregate automatically changes another
user's ranking.

**RECOMMENDATION (high):** Curiosity should separate:

1. global quality/policy signals;
2. a caller-owned source policy (`allow`, `exclude`, `prefer`, `deprioritize`);
3. one-query overrides; and
4. community aggregates that are advisory only.

Every applied rule should have scope, owner, reason, version, and expiry. “Pin”
must never imply evidentiary authority.

### 3.3 Lenses and result filters

Kagi Lenses are saved, shareable restrictions over region, included/excluded
sites and keywords, file type, and before/after dates. The UI documents caps of
10 included sites, 10 excluded sites, five included keywords, and five excluded
keywords. Built-ins target forums, programming, News 360, Fediverse, archives,
academic sites, PDFs, Kagi documentation, cyber security, Small Web, and recipes
[S11]. Lenses do not support image or video search in the documented UI.

The API accepts either a shared/built-in `lens_id` or an inline `lens`, adds a
relative date (`day|week|month`), and states that lens options override operators
in the query while explicit `filters` override the lens [S9]. This precedence is
a valuable contract detail: restrictions are not merely appended text.

Separate controls include region; sort by default, recency, website, or
ad/tracker count; most/least relevant ordering; relative or custom time; verbatim
matching; grouped same-domain results; safe search; and conventional operators
such as `site:`, `filetype:`, `inurl:`, `intitle:`, exact phrase, Boolean terms,
and include/exclude [S12][S13][S14].

**INFERENCE (high):** lenses are a reusable **retrieval-policy object**, while
personalization is a reusable **ranking-policy object**. Keeping these distinct
is better than encoding both into a query string. Curiosity should adopt that
separation but reject unbounded or opaque shared policy: imported lenses need a
snapshot/version and an explicit caller approval.

## 4. Answers, summaries, and evidence

### 4.1 Quick Answer / result summarization

**FACT (high):** Quick Answer synthesizes across returned pages and displays
references to pages used. It is normally on demand but can auto-trigger when a
query ends in `?`; that behavior can be disabled [S15]. Kagi's stated AI
philosophy is that AI should operate in a closed search context, enhance rather
than replace search, remain opt-in/on-demand, and yield control when it fails
[S16].

Kagi's earlier launch explanation says result summarization is query-contextual
and citation-bearing, and explicitly warns users to double-check critical facts.
It also reports that 2023 answer-engine quality was limited and that iterative
multi-query research was not yet implemented in the tested engines [S17]. This
historical self-evaluation is not current benchmark evidence.

**UNKNOWN:** current Quick Answer model(s), source-selection depth, retrieval
queries, extraction method, passage anchors, citation-entailment checks,
contradiction handling, cache key/version, confidence calibration, and whether
references identify every material claim are undocumented.

### 4.2 Per-page summarization and answer API

Kagi Summarize can summarize a page or supported document/media type and can be
invoked from an individual result. Kagi says its current Summarize product uses
in-house models named Cecil, Agnes, and Muriel; modes include prose lengths,
bullets, and ELI5 [S18]. The legacy v0 Summarizer API accepts either URL or text,
supports output language and cache control, limits total request size to 1 MB,
and returns output plus token count—but no evidence offsets, source hash, fetch
time, or model/version identifier [S19].

The legacy FastGPT API returns answer text, referenced result title/snippet/URL,
and token count. Its documented switch to disable web search is out of service,
so the endpoint currently requires web grounding [S20]. This is an answer
contract, not a retrieval trace.

**INFERENCE (high):** Kagi demonstrates the right presentation hierarchy:
links remain primary; cross-result answer and per-document summary are optional;
references permit return to sources. Its public output contracts still fall
short of reproducible evidence because citations identify mutable URLs, not
captured versions/passages.

**RECOMMENDATION (high):** Curiosity should return answer claims separately
from evidence, with capture ID, passage offsets/hash, fetch time, claimed
publication time, extraction version, and explicit unsupported/contradicted
states. A summary cache must be keyed to document content hash plus model and
prompt version—not URL alone.

## 5. Public query and response contract

### 5.1 Current v1 Search API

Kagi publishes a bearer-authenticated `POST https://kagi.com/api/v1/search`
contract and generated clients from an OpenAPI specification. API access is paid
and meant to expose premium re-ranked results; no unauthenticated general Search
API is documented [S9][S10][S21]. At research time standard Search API pricing
was $12 per 1,000 requests and Extract was $4 per 1,000 pages [S22]. Prices are
operationally volatile and not architectural facts.

Material request fields [S9]:

| Concern | Contract |
| --- | --- |
| Query | Required `query` string; no maximum is shown in the rendered endpoint reference. |
| Vertical | `workflow`: `search|images|videos|news|podcasts`. |
| Serialization | `json|markdown`; markdown is marked experimental. |
| Scope | Saved/built-in `lens_id` or inline lens; region/date filters; `safe_search`. |
| Timing | Caller-supplied collection `timeout`; lower values may lower quality or consistency. |
| Pagination | `page` 1–10. |
| Count | `limit` 1–1024, explicitly a response cap rather than a retrieval-depth request. |
| Extraction | Fetch/extract top 1–10 results with a separate per-page timeout and additional charge. Extracted markdown replaces each result's `snippet`. |
| Personalization | Domain and regex rules, bounded as described above. |

The response partitions heterogeneous results into typed arrays: ordinary web,
image, video, podcast, news, adjacent questions, direct answers, interesting
news/finds, infoboxes, code, public records, weather, related searches,
listicles, and web archives. A common web result exposes URL, title, optional
snippet, optional `time`, optional image, and arbitrary `props`. Metadata
provides trace ID, serving node, and elapsed milliseconds; Kagi warns that
`meta` is unstable and only for debugging. Errors are structured, but the
reference says their documentation URLs are still a work in progress [S9].

### 5.2 Contract strengths and hazards

**ADAPT:** typed result classes, explicit scope objects and precedence, separate
search/extraction timeouts, stable trace IDs, direct URLs, safe-search input,
and structured errors.

**REJECT or tighten:**

- `limit=1024` is inappropriate for a bounded agent boundary; Curiosity's
  external tool cap should remain small.
- user-controlled timeout without documented minimum/maximum is an operational
  footgun.
- replacing a snippet with extracted full markdown conflates result preview
  with retrieved evidence and can create unexpectedly large untrusted output.
- arbitrary `props` and experimental markdown are not stable provider-neutral
  contracts.
- account-inherited personalization makes identical request bodies potentially
  non-reproducible.
- no result exposes contributing engine/index, upstream rank, rank reason,
  canonical/capture ID, content hash, or partial-source failures.

**INFERENCE (high):** Kagi's public Search API is optimized for application
utility, not chain-of-custody. Even its `time` field means “created or last
updated,” collapsing two distinct temporal claims [S9].

## 6. Freshness and provenance

### What is exposed

- Date lenses/filters cover before, after, and relative intervals, described as
  pages “updated or published” in the interval [S9][S11].
- Result `time` is an optional timestamp for when a resource was created **or**
  last updated [S9].
- Small Web's public feed was described as refreshed every five hours; website
  surfacing historically required posts no older than seven days [S5]. The
  current repository requires a recent post for feed-list inclusion and retains
  a `<7 days` website-display criterion [S6].
- The product surfaces recent Small Web content and also keeps a separate
  evergreen index, weighted according to context [S23].
- Web Archive is a response/result class, and Kagi documents Wayback discovery
  of some otherwise dead pages [S3][S7][S9].

### What is absent

No public result contract distinguishes claimed publication time, claimed
modified time, first seen, fetch time, index time, or archive capture time. It
does not identify which source supplied a result or timestamp, whether multiple
sources agreed, whether content was fetched by Kagi, or which archived version
was ranked. There is no freshness SLA, corpus recrawl policy, staleness warning,
source coverage report, or immutable citation handle.

**INFERENCE (high):** Kagi offers strong *freshness controls* but weak
*freshness provenance*. A date filter can be useful for discovery without being
sufficient evidence that a page was actually published in the requested period.

**RECOMMENDATION (high):** Curiosity should retain separate temporal fields and
the origin of each value. Filters should say whether they operate on publisher
claims, observed fetch/index time, or a fallback mixture. Archived results need
archive provider, capture timestamp, original URL, and replay URL.

## 7. Privacy, incentives, and business model

### 7.1 Documented practices

**FACT (high, policy claim):** Kagi is subscription-funded and ad-free. Current
consumer plans include a limited trial, $5/month Starter with 300 searches,
$10/month Professional with unlimited search, and $25/month Ultimate with
premium AI access [S24]. The paid model is explicitly intended to align product
incentives with the user rather than advertisers [S1][S25].

**FACT (high, policy claim):** Kagi says it loads no analytics/telemetry, does
not track result clicks, uses only functional cookies, and does not associate
temporarily logged search requests with accounts. Its current policy lists
seven-day sampled load-balancer and VM debug logs and 90-day sampled Sentry
error retention. Search queries are temporarily logged for debugging and
purged; usage volume is retained for billing [S25].

The policy says public-page summaries may be cached for no more than a day and
that no customer data is cached. AI requests may go to third-party providers;
Kagi documents provider-specific retention separately and says API data is not
used for training [S25][S26]. These are vendor representations, not independently
audited guarantees in this study.

### 7.2 Tensions and lessons

- An account and usage metering are needed for a paid service, so privacy is
  **data minimization and separation**, not literal absence of server data.
- Personalization requires persistent account state, but Kagi documents no
  click-derived profile. Explicit source preferences are easier to inspect and
  revoke than inferred behavioral personalization.
- “Anonymized” upstream calls do not reveal the exact intermediary fields,
  retention, jurisdictions, or per-provider privacy terms. Kagi protects the
  user from direct provider interaction, but the upstream supply chain remains
  a privacy and contractual dependency.
- Kagi's policy permits temporary diagnostics and provider retention for AI.
  “100% privacy-respecting” is therefore a value claim, not a zero-processing
  technical specification.

**RECOMMENDATION (high):** Curiosity should copy the incentive lesson, not the
marketing phrase: no ads, no clickstream ranking by default, explicit user
preferences, purpose-limited logs, short documented retention, separated usage
metering, and a source/provider privacy manifest. Hosted upstream query sharing
must be represented as a data egress event even if proxied.

## 8. Clean-room transfer boundaries

1. **Behavior can be learned; product internals cannot be assumed.** Kagi's
   public controls and API schemas are useful interface evidence. Ranking code,
   weights, provider contracts, indexes, and evaluation data are not public.
2. **The service is proprietary.** Kagi's terms grant no unstated intellectual
   property rights and say only API products are licensed for commercial use;
   frontend products are non-commercial absent another license [S25]. Do not
   scrape or automate the frontend as an API substitute.
3. **Open lists are not open page content.** The official Small Web repository
   is MIT-licensed [S27]. That covers repository software/list material under
   its terms, not copyright or indexing rights in linked sites. Curiosity should
   produce its own corpus policy and preserve attribution if it ever consumes a
   permitted list through separate review.
4. **Disclosed stacks do not transfer licenses.** Teclis names Puppeteer,
   uBlock Origin, Trafilatura, Readability, fastText, Elasticsearch, Typesense,
   sentence-transformers, ScaNN, and FastAPI [S3]. Their behavior may guide
   tests; importing code or models requires independent license/data/security
   review.
5. **Hosted results are untrusted external data.** Kagi titles, snippets,
   extracted markdown, answers, and arbitrary `props` must be bounded and
   sanitized exactly like any other provider output.

No reverse engineering used proprietary binaries, authenticated traffic,
frontend internals, or protected access. This study stays at documented
behavior and public artifacts.

## 9. Curiosity implications and verdict ledger

| Capability/lesson | Verdict | Curiosity disposition | Confidence |
| --- | --- | --- | --- |
| Multi-source hosted aggregation | **REJECTED** as foundation | It widens coverage but inherits opaque upstream contracts, outages, rank, and privacy. | High |
| Owned niche indexes alongside broad discovery | **ADAPTED** | Build a bounded owned corpus first and represent external discovery, if temporarily used, as a distinct lineage-bearing lane. | High |
| Explicit domain preferences | **ADOPTED** | Caller-owned allow/exclude/prefer/deprioritize rules with reason, version, and one-query disablement. Do not equate pin with truth. | High |
| Lenses as reusable retrieval policy | **ADAPTED** | Typed, bounded source/time/file/region policy separate from query text and ranking preferences; immutable snapshot on use. | High |
| Ads/trackers as quality signals | **ADAPTED** | Explainable features, never an unexplained hard proxy for authority; evaluate correlation on Curiosity's corpus. | Medium |
| Small Web human curation | **ADAPTED** | A transparent source registry can improve discovery diversity, but criteria, removals, language limits, conflicts, and appeals must be versioned. | High |
| Optional cited answers and summaries | **ADAPTED** | Preserve ordinary results and user override; add claim-level, version-anchored evidence and uncertainty. | High |
| Kagi API result taxonomy | **ADAPTED** | Typed evidence classes are useful, but provider-neutral contracts need stable schemas and bounded extension points. | High |
| Result-level provenance in current API | **REJECTED** as sufficient | URL/title/snippet/time do not establish origin, capture, version, or rank reason. | High |
| Search API as provider adapter | **DEFERRED** | Only for an authorized paid bake-off; never silently replace the owned target architecture. | High |
| Kagi frontend automation | **REJECTED** | Terms/access boundary and absence of a stable public contract make it inappropriate. | High |
| Kagi ranking implementation | **DEFERRED/UNKNOWN** | No transferable public specification or reproducible evaluation. Design and test independently. | High |

### Recommended provider-neutral deltas

Kagi exposes useful controls that Curiosity's current `query,maxResults` shape
lacks. A future owned contract should add, without granting new agent authority:

- typed `scope` (sites/source classes, language/region, file types, temporal
  basis and interval);
- typed `sourcePolicy` and `rankingPreferences`, each bounded and versioned;
- lexical/verbatim mode and safe-search policy chosen by caller configuration;
- per-stage budgets and fixed service-side ceilings rather than arbitrary
  timeout/limit values;
- result class plus URL identities, capture/document/version IDs, passage
  anchors, source/index lineage, temporal provenance, and bounded rank reasons;
- source contribution and partial-failure summaries;
- answer claims linked to evidence objects rather than a flat reference list;
- coverage and staleness warnings.

These fields improve evidence. They do not authorize the researcher to expand
the declared frame or conduct autonomous follow-up.

## 10. Unknowns and checks

### Material unknowns

1. Per-query source routing, contribution, timeout, quotas, and graceful
   degradation.
2. Current third-party SERP API providers and exact data-handling/license terms.
3. Teclis/TinyGem corpus sizes, language/geography distribution, recrawl policy,
   deletions, archive policy, and production stack.
4. Fusion, deduplication, canonicalization, spam/safety, and ranking weights.
5. Whether upstream rank, clicks, aggregate domain preferences, or answer usage
   train ranking models.
6. Source and timestamp lineage for each returned result.
7. Current Quick Answer model, evidence-selection and citation-validation path,
   cache/version behavior, and contradiction handling.
8. API maximum query size, rate limits, retry semantics, response byte bounds,
   retention specific to API search/extract, and version-stability policy.
9. Independent privacy/security audits relevant to search query processing.
10. Comparative relevance, recall, freshness, diversity, and answer faithfulness.

### Checks actually performed

- Cross-checked source composition across Search Sources, Enrichment API, the
  2026 licensing/intermediary disclosure, Teclis, and Small Web materials.
- Cross-checked user controls between UI documentation and the v1 API reference.
- Cross-checked answer behavior against Quick Answer, Summarize, FastGPT, AI
  philosophy, and privacy documentation.
- Read the current public endpoint reference rather than relying on legacy v0
  examples for the Search API.
- Confirmed negative results: no public result-level source lineage, crawl/index
  timestamp, immutable capture identifier, ranking specification, source
  failure list, or current answer-quality benchmark was found.

## 11. Bounded curiosity pass

After synthesis, unresolved in-frame threads were scored 1–5 for relevance (R),
decision value (V), novelty (N), and cost (C), using `R+V+N-C`.

| Thread | R | V | N | C | Score | Action |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| 2026 direct-license vs intermediary disclosure | 5 | 5 | 5 | 1 | 14 | **Pursued**; materially changed “anonymized API” into a three-way owned/licensed/intermediated model [S2]. |
| Current v1 endpoint schema vs legacy API docs | 5 | 5 | 4 | 1 | 13 | **Pursued**; established lenses, extraction, personalization bounds, taxonomy, and provenance gaps [S9]. |
| Teclis implementation disclosure | 4 | 4 | 4 | 1 | 11 | **Pursued**; bounded historical architecture evidence, with production caveat [S3]. |
| Small Web current inclusion/licensing | 4 | 4 | 3 | 1 | 10 | **Pursued**; clarified transparent curation and content-rights boundary [S6][S27]. |
| Authenticated UI/network inspection | 3 | 2 | 3 | 5 | 3 | **CURIOSITY_NO_GO** — prohibited credentials/subscription testing and unnecessary for the decision. |
| Paid Search API benchmark | 5 | 5 | 4 | 5 | 9 | **CURIOSITY_NO_GO** — requires separate caller authority, budget, judged queries, and data-handling review. |
| Identify undisclosed SERP intermediary by traffic or fingerprinting | 3 | 3 | 4 | 5 | 5 | **CURIOSITY_NO_GO** — unsupported speculation and outside clean-room/access boundary. |
| Reconstruct ranking weights from synthetic queries | 4 | 3 | 4 | 5 | 6 | **CURIOSITY_NO_GO** — paid/live experimentation and low reproducibility; would not prove internal causality. |
| Audit every third-party component named by Teclis | 2 | 2 | 2 | 4 | 2 | **CURIOSITY_NO_GO** — dependency selection is not in this product-study frame. |

**Stop condition:** coverage reached for every requested category; the best
additional public sources repeated the same architecture rather than changing
the verdict. Remaining high-value questions require paid testing, contractual
disclosure, or internal evidence, so the pass stopped on coverage and access
exhaustion.

## Sources

All sources accessed 2026-08-17. Kagi-authored sources establish Kagi's public
representations; they are not independent validation of quality or privacy.

- **[S1]** Kagi, “Search Sources.”
  <https://help.kagi.com/kagi/search-details/search-sources.html>
- **[S2]** Vladimir Prelovac and Raghu Murthi, “Waiting for dawn in search:
  Search index, Google rulings and impact on Kagi,” 2026-01-21.
  <https://blog.kagi.com/waiting-dawn-search>
- **[S3]** Teclis, “About / Technical Implementation.”
  <http://teclis.com/>
- **[S4]** Kagi, “Enrichment APIs.”
  <https://help.kagi.com/kagi/api/enrich.html>
- **[S5]** Kagi, “Kagi Small Web,” 2023-09-07.
  <https://blog.kagi.com/small-web>
- **[S6]** Kagi Search, `kagisearch/smallweb` README.
  <https://github.com/kagisearch/smallweb/blob/main/README.md>
- **[S7]** Kagi, “Search Quality.”
  <https://help.kagi.com/kagi/search-details/search-quality.html>
- **[S8]** Kagi, “Website Info & Personalized Results.”
  <https://help.kagi.com/kagi/features/website-info-personalized-results.html>
- **[S9]** Kagi API, “Perform a web search,” `POST /search`, v1.
  <https://redocly-api-docs.kagi.com/api/docs/openapi/search/search.md>
- **[S10]** Kagi, “Search API.”
  <https://help.kagi.com/kagi/api/search.html>
- **[S11]** Kagi, “Lenses.”
  <https://help.kagi.com/kagi/features/lenses.html>
- **[S12]** Kagi, “Filtering Results.”
  <https://help.kagi.com/kagi/features/filtering-results.html>
- **[S13]** Kagi, “Kagi Keyboard Shortcuts and Search Operators.”
  <https://help.kagi.com/kagi/features/search-operators.html>
- **[S14]** Kagi, “Search Settings.”
  <https://help.kagi.com/kagi/settings/search.html>
- **[S15]** Kagi, “Quick Answer.”
  <https://help.kagi.com/kagi/ai/quick-answer.html>
- **[S16]** Kagi, “Kagi's AI Integration Philosophy.”
  <https://help.kagi.com/kagi/why-kagi/ai-philosophy.html>
- **[S17]** Kagi, “Kagi's approach to AI in search,” 2023-03-16.
  <https://blog.kagi.com/kagi-ai-search>
- **[S18]** Kagi, “Kagi Summarize.”
  <https://help.kagi.com/kagi/summarizer/>
- **[S19]** Kagi, “Universal Summarizer” API (legacy v0).
  <https://help.kagi.com/kagi/api/summarizer.html>
- **[S20]** Kagi, “FastGPT” API (legacy v0).
  <https://help.kagi.com/kagi/api/fastgpt.html>
- **[S21]** Kagi API reference and OpenAPI overview.
  <https://kagi.com/api/docs>
- **[S22]** Kagi, “API pricing.”
  <https://kagi.com/api/pricing>
- **[S23]** Kagi, “Small Web in search results.”
  <https://help.kagi.com/kagi/search-details/small-web-in-search-results.html>
- **[S24]** Kagi, “Plan Types.”
  <https://help.kagi.com/kagi/plans/plan-types.html>
- **[S25]** Kagi, “Your Privacy and Kagi” and Terms of Service.
  <https://kagi.com/privacy>
- **[S26]** Kagi, “LLMs & Privacy.”
  <https://help.kagi.com/kagi/ai/llms-privacy.html>
- **[S27]** Kagi Search, `kagisearch/smallweb` MIT license.
  <https://github.com/kagisearch/smallweb/blob/main/LICENSE>
