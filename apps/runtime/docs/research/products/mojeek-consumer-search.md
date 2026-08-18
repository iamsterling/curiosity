# Mojeek consumer web search: independent index, interface, and trust boundaries

**Research and source-access date:** 2026-08-17
**Scope:** Mojeek's unauthenticated, human-facing general web search. The paid
Search API is covered separately in `mojeek-api.md`; Image, News, Substack,
Site Search, and the internals of Focus are adjacent surfaces, discussed only
where they appear in or bound the ordinary web-search experience.
**Status:** clean-room product and architecture research; not an implementation,
legal opinion, live quality benchmark, or endorsement.

## Executive verdict

Mojeek consumer web search is credible **first-party evidence that a small
company can own the public-web crawl-to-rank chain**, but not evidence that the
chain is complete, competitive, or auditable. Mojeek consistently says its
ordinary web results come from MojeekBot, its own HTML index, proprietary
mostly-C retrieval stack, link graph, and ranking algorithms on infrastructure
it builds and manages. Current first-party history reports nine billion indexed
pages in 2025. A published crawler identity, robots rules, hardware history,
index-growth history, and disclosed ranking feature classes triangulate the
claim, but all coverage and quality figures remain vendor self-attestation
[S1–S5, S34]. **Confidence: medium-high on ownership; low on corpus quality and
completeness.**

The consumer product is unusually inspectable and caller-controlled. It has a
lexical-first query model, field/site/date/exclusion operators, an advanced
form, host clustering, up to 40 organic results per page and as many as 1,000
accessible results, visible crawl/modified dates, explicit language/location
boosts, optional strict region filtering, optional Safe Search, controllable
snippets, cookieless preference URLs, and optional source-selection tools.
Mojeek does not silently autocorrect and says it does not use personal or
aggregate clickstream signals in ranking [S5–S7, S12]. These are strong interface
lessons, not a stable machine contract.

The privacy story requires qualification. The 2022 policy says no IP addresses
are logged, country codes replace them, browser data are separate, and cookies
are absent by default. It also says standard logs containing time, requested
page and possible referrer are retained indefinitely and aggregate search data
may improve results. Current search ads send the query and country code to
Prorata or adMarketplace, while the optional summary feature was documented as
sending the query and top-result data to Mixtral through Lepton. Neither
disclosed egress path is described in the 2022 privacy policy [S14–S18]. “No tracking” is
therefore a meaningful claim about user profiling and IP retention, not a claim
that queries stay inside Mojeek or are never retained.

**Curiosity verdict:**

- **ADOPTED:** owned stage boundaries; lexical exactness; caller-explicit
  locale; visible crawl dates; host diversity; user-inspectable preferences;
  optional rather than compulsory summaries; and hyperlinks as the primary
  result.
- **ADAPTED:** query operators, Focus-like source policy, cookieless settings,
  Safe Search, clustering, and contextual monetization ideas into typed,
  bounded, versioned, provenance-bearing contracts.
- **REJECTED:** the consumer frontend as an automated dependency; page count as
  a quality objective; binary/opaque safety as sufficient; dates without
  provenance; and “no tracking” as a substitute for a complete data-flow and
  retention specification.
- **DEFERRED:** any judged comparison, consumer integration, or provider call.
  Mojeek's Terms prohibit automated access except for authorized API users, and
  this study made no search request [S19].

## 1. Decision frame, questions, and method

### 1.1 Bounded questions

1. What does the consumer interface let a person query, filter, inspect, and
   control?
2. Which parts of ordinary web discovery, indexing, ranking, and presentation
   are demonstrably Mojeek-owned, versus adjacent or third-party additions?
3. How are lexical, semantic, authority, locale, freshness, and clustering
   signals represented?
4. What privacy, safety, legal, and business-model boundaries apply to a web
   search?
5. What architecture can be inferred without probing, scraping, source access,
   or copying proprietary internals?
6. Which observable ideas should Curiosity adopt, adapt, reject, or defer?

### 1.2 Evidence and clean-room limits

- **FACT** means directly stated or exposed by a cited first-party source.
  Claims about Mojeek's private system are marked **self-attested**.
- **INFERENCE** is the narrow conclusion supported by cited facts, not a direct
  observation of internals.
- **RECOMMENDATION** is a Curiosity design disposition.
- Confidence is **high**, **medium**, or **low**.
- Only public Mojeek pages, policy, help, and company blog material were read.
  No `/search` request, automated query, account, cookie-setting interaction,
  app, paid API, browser/network inspection, scraping, active probe, protected
  endpoint, source code, or ranking perturbation was used. Mojeek's own
  `robots.txt` disallows `/search`, and its Terms prohibit automated access
  except for authorized API users [S19, S20].
- Product pages establish Mojeek's representations, not independent performance
  or compliance. No claims are transferred from the Search API dossier to the
  consumer product unless a consumer source independently supports them.

**Stop condition:** each requested category had current primary evidence or an
explicit unknown, material contradictions were pursued through public sources,
and the remaining high-value gaps required live queries, vendor disclosure, or
internal evidence.

## 2. Product boundary: web results versus adjacent surfaces

The current navigation exposes **Web, Images, News, Focus, and Substack**. The
preferences page can additionally place News results, a Wikipedia/Wikidata
infobox, related queries, and a generated summary beside ordinary web results
[S6, S7]. These do not all share the same corpus or provenance.

| Surface | Consumer role | Ownership/provenance boundary | Assessment |
| --- | --- | --- | --- |
| Ordinary Web | Ranked title, URL, and snippet results from the general index. | Mojeek says these are 100% from its crawler/index/ranker [S2]. | **In scope; FACT self-attested, medium-high.** |
| Search Choices | Buttons/bar repeat the query at another engine. | Clicking redirects outside Mojeek; listed templates point to third-party engines [S6, S21]. | **Not blended discovery. FACT, high.** |
| Focus | Applies caller-created include/exclude site sets to Mojeek search. | Uses locally stored or portable policy; up to 10 Foci and 25 include/25 exclude domains are documented [S22]. | **Adjacent web-scope feature; not a separate broad index. FACT, high.** |
| Infobox | Optional entity panel/link. | Current tips call it a relevant Wikipedia page; an older post describes a Wikidata widget [S7, S13]. | **Third-party knowledge augmentation; exact current data pipeline unknown.** |
| News panel/tab | Optional News results beside Web. | Explicitly described as results from Mojeek News, with separate controls [S7, S13]. | **Adjacent vertical; do not treat as owned-web-index evidence.** |
| Summary | Optional cited synthesis beside results or in a tab. | 2024 design extracted top results and sent query/result data to Mixtral via Lepton [S18]. | **Generated presentation layer; current model/provider unknown.** |
| Images/Substack | Separate tabs. | The content policy says Mojeek's web index contains only HTML pages, not images or video [S3]. | **Out of scope; tab presence does not establish a shared corpus or provenance.** |
| Search ads/shopping ads | Monetized entries on search pages. | Current support names Prorata and adMarketplace and says query + country are sent [S17]. | **Third-party data egress and separate trust class.** |

**INFERENCE (high):** the core consumer product is an owned organic-web lane
with optional sidecars. A screenshot or DOM that mixes organic links, ads,
Wikipedia, News, and a summary would not make those artifacts one corpus or one
ranking pipeline. Curiosity should preserve result-class and source lineage
rather than flattening a result page.

## 3. Consumer interface and query contract

### 3.1 Entry points and result controls

**FACT (high):** the public web entry is a search box that leads to the GET-style
path `/search?q=...`; Mojeek publishes that template for browser integration and
cookieless preferences [S8]. The interface provides:

- 10 results per page by default, selectable to 20, 30, or 40;
- host/domain clustering, normally one result per host, configurable to 1, 2,
  3, 4, 5, 10, or unlimited;
- optional last-modified time, last-crawled time, document size, tidy URL,
  longer/shorter titles, and snippets from 0 to 511 characters;
- optional spelling suggestions, related queries, Safe Search, News, infobox,
  summaries, Search Choices, new-tab links, and Focus widgets;
- language and country preference, a “None” location option, and strict regional
  restriction for EU, Germany, France, or the UK in the current UI [S6–S8, S13].

Mojeek says a person can paginate as far as result 1,000 when enough relevant
results exist, and that the displayed total is exact rather than estimated
[S2]. This is a product claim, not a measured guarantee. The advanced-search
form exposes all/none words, site-only scope, the four strict regions, result
count, per-domain cap, crawl-date display, and document-size display [S9].

**FACT (high):** spellings are suggestions, not silent corrections. Mojeek
explicitly advises short keyword queries because lexical matching remains the
primary retrieval mechanism [S7, S12].

### 3.2 Documented query syntax

| Syntax | Documented consumer meaning | Boundary / conflict |
| --- | --- | --- |
| `site:host term` | Restrict to one site/host. | A query term is required; `site:` alone is not documented as an enumeration command [S10]. |
| `-word` | Exclude pages containing a word. | Present in the official operator guide and 2025 query guide, but absent from the shorter formal operator list [S10, S12]. |
| `inanchor:`, `intext:`, `intitle:`, `inurl:` | Require the attached term in anchor text, body, title, or URL; may be combined and repeated. | Exact tokenization, stemming, punctuation, and phrase semantics are undocumented [S10, S11]. |
| `allinanchor:`, `allintext:`, `allintitle:`, `allinurl:` | Apply the chosen field to all following words. | Must begin the query; the guide says only one `allin*` per search [S10, S11]. |
| `since:YYYYMMDD` / `before:YYYYMMDD` | Restrict by Mojeek-recognized modified date, inclusive for `since` in the guide. | Date timezone, malformed input, and upper/lower boundary behavior are undocumented [S10, S11]. |
| `since:day|month|year`, `before:day|month|year` | Relative date restriction in the current formal page. | The 2023 guide additionally says `week`; the current formal support page omits it. Treat `week` as **contract-uncertain** [S10, S11]. |

**Negative results:** no current consumer source inspected documents Boolean
precedence, quoted-phrase behavior, wildcarding, parentheses, proximity,
`filetype:`, query-length limits, Unicode normalization, locale-sensitive
tokenization, error behavior, or a versioned syntax contract. The advanced form
is an ergonomic layer, not evidence of a stable API.

### 3.3 Preferences and caller agency

**FACT (high):** settings can be stored in a consented first-party cookie or
encoded into a bookmarkable URL. The documented cookieless template places
preferences such as theme and autocomplete directly in the query string; a 2022
example encodes snippet length, Search Choices, and host cap [S6, S8, S23].
Focus similarly avoids an account by storing definitions locally in a cookie
and supporting explicit backup/restore strings [S22].

**INFERENCE (high):** Mojeek distinguishes *explicit preference* from inferred
personalization. This improves inspectability and reproducibility, but URL-based
preferences can leak through browser history, copied links, referrers, logs, and
screenshots. “Cookieless” means no preference cookie, not no server-visible
preference data.

**RECOMMENDATION (high):** Curiosity should use a typed, caller-owned retrieval
policy rather than cookies or URL parameters. It should record the immutable
policy snapshot with each result set while keeping sensitive preferences out of
URLs and logs.

## 4. Crawl and index ownership

### 4.1 Evidence chain

| Evidence | What it supports | What remains unproven |
| --- | --- | --- |
| Mojeek says ordinary web results are “100% independent” and come from MojeekBot, its index, and its ranking [S2]. | Explicit source-ownership representation. | Result-level proof, exclusivity audit, or coverage. |
| Technology page says the stack was developed from scratch, mostly in C, uses no pre-existing crawler/search technology, and all IP is Mojeek-owned [S1]. | Proprietary crawler/index/ranker claim. | Current component map, code provenance, security, or reproducibility. |
| MojeekBot has published rate, robots/meta rules, DNS verification, IP list, and contact [S4]. | Operational crawler identity and publisher control surface. | Crawl completeness, frontier policy, or whether every serving document came through it. |
| Content policy says only HTML pages are indexed and JS-heavy pages may be missed [S3]. | Corpus format and static-text bias. | PDFs, rendered DOM, feeds, canonicalization, duplicates, and extraction detail. |
| History reports 1B pages in 2015 through 9B in 2025; owned/managed servers reside in a dedicated UK datacentre room [S1]. | Long-running scale and infrastructure investment. | Definition of “page,” current searchable count, versions, unique hosts, or redundancy. |
| Ranking disclosure names a link-derived “Gravity” authority score and combines it with keyword, semantic, language, and location signals [S5]. | An internally computed link graph and ranker. | Formula, graph freshness, anti-spam quality, or causal contribution. |

**FACT, self-attested (medium-high):** this is a coherent independent-index
claim. MojeekBot obeys the Robots Exclusion Standard, `noindex`, `nocache`, and
`nofollow`; it does not support non-standard `crawl-delay`; and its stated
ceiling is one request to a site per second [S4].

**INFERENCE (high):** Mojeek's searchable corpus is HTML-first and biased toward
server-visible text. The content policy's admission that predominantly
JavaScript text may be absent means “nine billion pages” cannot be equated with
nine billion complete modern-web documents [S3].

**INFERENCE (medium-high):** crawler identity, robots behavior, physical server
history, incremental index milestones, exact-result-count claims, link
authority, and distinct result behavior are mutually reinforcing operational
signals. They raise confidence beyond a bare marketing claim, but they are not
an independent corpus audit.

### 4.2 Material corpus unknowns

- definition of an indexed/searchable page, live page count, unique hosts and
  registrable domains;
- language, country, topic, source-type, and age distributions;
- crawl frontier, discovery seeds, sitemap/feed use, host budgets, trap and spam
  defenses, canonical/redirect policy, duplicate and near-duplicate handling;
- JavaScript rendering, PDF/document support, structured data, frames, and
  dynamic content extraction;
- recrawl scheduler, change detection, deletion latency, tombstones, historical
  captures, and index-to-serving latency;
- index replication, shard topology, failure domains, disaster recovery, and
  current fleet/capacity;
- independent measurements of relevance, recall, freshness, geographic bias,
  or safety precision/recall.

## 5. Retrieval, ranking, results, and snippets

### 5.1 Public ranking model

**FACT, self-attested (high that Mojeek says it):** the consumer ranker combines:

1. lexical/keyword matching as the primary retrieval mechanism;
2. supplementary semantic matching, introduced for English-language results in
   2024;
3. backlink-derived, query-independent authority called Gravity;
4. explicit language and country preferences; and
5. other undisclosed signals [S5, S12, S24].

Mojeek says it does not use personal browsing history, personal clickstream, or
aggregate click data as rank signals; two users with the same query, time,
country, and settings should receive the same results. It also says all URLs are
ranked by automated, largely deterministic algorithms rather than query-specific
human re-ranking. User feedback is used to find broad quality trends, not to
manually curate a particular result set [S2, S3, S5].

**Qualification (high):** “no human ranking” does not mean no human policy or
model design. People define features, thresholds, training/evaluation data,
spam classifiers, takedown rules, and releases. Mojeek also removes or avoids
indexing defined content classes. “Information neutrality” is an objective and
policy claim, not a mathematical absence of bias.

**Unknown:** the candidate-generation plan, index fields, stemmers/tokenizers,
semantic model and current language coverage, feature weights, rank-learning
method, query classification, freshness contribution, spam features, score
calibration, release cadence, and controlled evaluation metrics are private.
The 2024 feedback chart is voluntary vendor evaluation, not a reproducible
benchmark [S24].

### 5.2 Result composition and diversity

**FACT (high):** an organic result comprises a title/hyperlink, URL, and snippet
derived from page content. Optional fields expose last modified, last crawled,
and document size. Titles can be capped up to 128 characters in the older
detailed guide, snippets from 0 to 511, and the current preference UI controls
their presentation [S3, S6, S13].

**Boundary:** no consumer source inspected specifies how titles are selected or
rewritten, how snippet passages are selected, whether snippets are always
query-dependent, sanitization rules, truncation units, language fallback,
markup handling, or whether stale indexed text can appear after page changes.
The API documentation describes a query-dependent description, but this report
does not silently transfer that contract to the consumer frontend.

**FACT (high):** default clustering folds all matching pages from one host into
one SERP position; “See more results” launches a `site:` search. Subdomains may
appear separately, and the user can raise or disable the cap [S7, S25].

**INFERENCE (high):** host clustering increases visible destination variety but
is not publisher, owner, content, or viewpoint diversity. A corporation's many
domains can occupy multiple positions, while unrelated publishers on one host
can be collapsed. Curiosity needs canonical, content, registrable-domain, and
publisher-owner clusters with explicit diversity reasons.

### 5.3 Summaries and evidence

**FACT (high, historical implementation description):** the 2024 summary path
sent the query to Mojeek's index, ranked candidate pages, extracted top results,
sent query plus result data to Mixtral through Lepton, and returned a generated
summary with citations that highlight/link to the corresponding ordinary
results [S18]. Current preferences still expose summary placement, a summary
button, and a Summary tab, with “don't show” as the default placement [S6].

**FACT (high):** in 2025 Mojeek said it would not replace search results with
AI-generated answers and framed AI as support for search rather than a
substitute [S26]. This is compatible with an optional cited sidecar, but the
current operational relationship is not documented clearly.

**Unknown:** current model/provider, exact source depth, page-fetch/extraction
method, data retention, model-training use, prompt, cache, language support,
failure behavior, citation entailment, passage anchors, and whether every claim
is supported. Citations point to mutable URLs/results, not immutable captures.

**RECOMMENDATION (high):** preserve Mojeek's result-first, optional-summary
hierarchy, but require claim-level evidence with capture/version ID, passage
offsets and hash, fetch time, model/prompt version, contradiction state, and an
easy path back to source text.

## 6. Privacy and data flow

### 6.1 Documented core practices

The privacy policy, last updated 2022-02-02, says [S14]:

- no specific-user tracking is performed;
- no cookie is set by default; consent is requested for a preference cookie;
- standard logs are retained indefinitely but replace IP address with a
  two-letter country code;
- logs contain visit time, requested page, possible referral data, and browser
  information in a separate log;
- remaining data are not sold/distributed and are used for traffic history and
  country demographics;
- aggregate, non-personal search data may improve results.

Current UI says local autocomplete can show previous searches while the browser
retains that history and Mojeek does not record a user's search history [S6].
Mojeek's 2020 FAQ is more explicit that it may hold “uncoupled search queries”
and that browser data are uncoupled from queries [S15].

**INFERENCE (high):** “does not record your search history” means no
Mojeek-maintained user-linked history, not no query processing or query log. The
search endpoint carries the query in the requested URL, and the policy says the
requested page is logged indefinitely. The exact production redaction and
schema are not public, so whether every raw query is retained indefinitely is
not proven; the older FAQ nevertheless confirms some uncoupled query logging.

**INFERENCE (medium-high):** replacing IP with country materially reduces
linkability, but Mojeek's statement that it removes “any possibility” of
identifying a user is stronger than the disclosed evidence. Rare queries,
timestamps, referrers, campaign parameters, precise preferences, or external
events may still be identifying in combination. No audit, k-anonymity threshold,
rare-query suppression, or re-identification analysis was found.

### 6.2 Current third-party egress

**FACT (high):** the current Ads support page says Mojeek uses Prorata for search
ads and adMarketplace for shopping ads, sending only the **search query and a
country code**. Clicking an ad leaves Mojeek's policy boundary [S17]. The direct
ads product separately advertises query/category/country targeting and a Mojeek
campaign dashboard [S16, S27]. Exact coexistence and routing among Mojeek,
Prorata, and adMarketplace ads is not documented.

**FACT (high, 2024):** optional summaries sent the query and top-result data to
an LLM via Lepton [S18]. Current provider status is unknown.

**Material documentation gap (high):** the 2022 privacy policy predates and does
not name either egress path. It does not state ad/summary activation rules,
provider retention, legal roles, processing locations, subprocessors,
model-training use, security controls, or deletion. The Terms merely permit
Mojeek and third-party partners to place ads [S19].

**RECOMMENDATION (high):** Curiosity should publish a feature-level data-flow
manifest: fields, recipient, purpose, activation/default, legal basis,
retention, training use, region, and deletion. “No tracking” must never hide a
query egress event. Optional third-party features should be off by default and
separately authorized.

### 6.3 Cookie and location nuance

Explicit preference cookies are inspectable and deletable through Mojeek's
cookie page; cookieless URLs can encode the same settings [S8, S23]. Automatic
location uses country-level detection for ranking and ads. A historical guide
also offered browser-supplied coordinates to determine a location, then stored
the resulting choice in a cookie [S28]. Current preference extraction does not
show the precise-location control, so its 2026 availability and whether raw
coordinates ever reach or persist at Mojeek are **unknown**.

## 7. Localization and freshness

### 7.1 Locale

**FACT (high):** Mojeek separates:

- **site language** (English, German, French in current settings);
- **preferred result language**, a boost chosen from an explicit but incomplete
  list rather than a universal coverage promise;
- **preferred location**, automatically detected country, manually chosen
  country/territory, or `None` for no location bias; and
- **regional restriction**, currently exposed for EU, Germany, France, and UK
  [S6, S7].

The historical location guide says arbitrary `reg=<ISO 3166-1 alpha-2>` URL
values were accepted even though the UI exposed only four regions [S28]. The
current UI still exposes only those four strict regions. Treat arbitrary
country restriction as **historically documented, current contract unknown**.

The 2024 semantic release applied to English-language results and intended later
expansion [S24]. No current consumer source specifies whether expansion happened.

**INFERENCE (high):** locale codes are ranking/filter controls, not corpus
coverage guarantees. Automatic country boosts are a narrow form of contextual
ranking even though Mojeek rejects behavioral personalization. Reproducibility
requires recording the effective language, country, strict-region filter, and
their source (auto, manual, or none).

### 7.2 Freshness and temporal semantics

**FACT (high):** `before:` and `since:` operate on the date Mojeek recognized as
last modified; if no modification was found, the operator guide says the first
crawl date is used. The date is not a publication date [S10]. A user may display
the detected modified date and the last MojeekBot crawl time separately [S6,
S13].

**INFERENCE (high):** the date filter mixes two different temporal meanings:
observed modification and first discovery. A page can therefore pass a date
restriction without having been published in that interval. HTTP/HTML date
sources, conflict resolution, timezone, confidence, and manipulation defenses
are undocumented.

**Negative result (high):** no current public-web freshness SLA, recrawl-age
distribution, breaking-news latency, index-to-query delay, deletion latency,
date-accuracy benchmark, or stale-result warning was found. Historical crawl
growth and a last-crawled display are not freshness guarantees.

**RECOMMENDATION (high):** Curiosity must separate publisher-claimed published
and modified times from first-seen, last-fetched, content-changed, indexed, and
served times, each with source and confidence. Filters must name the temporal
basis rather than silently mixing fallbacks.

## 8. Safety, removals, and result authority

### 8.1 Organic content policy

**FACT (high):** Mojeek starts from freedom to seek but says it acts on CSAM,
search spam, phishing, malware, and viruses; it is an Internet Watch Foundation
associate member. Legal removal requests are assessed under English law and,
for foreign requests, requesting-country law and stated international norms.
Removed URLs leave the index for all users/customers. A contact route supports
legal reports and appeals [S3].

The policy says no government removal or data requests had been received at the
time represented and commits to annual transparency reports covering CSAM and
what it calls “TVE” search-query/content actions [S3]. No dated transparency
report was located in the current policy, support navigation, blog archive, or
plausible public paths checked in this bounded pass. This is a **negative
result**, not proof that none exists.

### 8.2 Safe Search

**FACT (high):** Safe Search is an optional setting intended to hide results
identified as mature [S6, S7]. Its 2023 launch was explicitly beta and warned it
was not a reliable way to remove all adult content [S29]. The current settings
and tips no longer display the beta warning, but no current policy, taxonomy, or
quality report was found.

**Unknown:** model/rules, languages, classes, false-positive/negative rates,
query versus document classification, image/panel handling, reason codes,
appeals, policy version, and treatment of ambiguous health/sexuality/education
content.

### 8.3 Ads safety

Mojeek's ad policy prohibits deceptive, hateful, violent, counterfeit, illegal,
or fraudulent ads and restricts adult, alcohol, children, finance/crypto,
gambling, drugs, ticket resale, political, health, and other sensitive sectors.
It says ads were manually reviewed while policies were being developed [S27].
Current review coverage, partner-ad policy reconciliation, labeling, complaint
metrics, and enforcement data are unknown.

**RECOMMENDATION (high):** Curiosity should treat organic results, panels,
generated summaries, and ads as separate policy/trust classes. Safety decisions
need policy/version, signal, reason, uncertainty, source, and appeal/takedown
provenance. Search output is untrusted external data and cannot authorize tools,
grant content rights, or establish factual truth.

## 9. Business model and incentives

**Current facts:**

- Consumer web search has no documented subscription or per-query user fee.
- Text/search and shopping ads are present; current support identifies Prorata
  and adMarketplace as providers and query + country as targeting data [S17].
- Mojeek's own Ads page advertises category, keyword, and country targeting and
  describes an invite-only/early advertising programme with a campaign
  dashboard [S16].
- Commercial products include Web Search API, Site Search API, and search boxes
  [S30].
- Historical company disclosures say private individual/angel investment funded
  growth and that advertising, APIs, partnerships, site/enterprise search,
  subscriptions, and micropayments were considered; the company rejected
  surveillance-based monetization [S15, S31].

**INFERENCE (medium):** the observable 2026 model is a mix of investor-funded
infrastructure plus developing contextual advertising and paid search products.
The consumer service is free at point of use, while query intent and country can
be monetized without a behavioral profile. This reduces, but does not eliminate,
incentives to maximize query/advertising volume or introduce provider
dependencies.

**Unknown:** current revenue split, profitability, runway, advertiser scale,
ad load, provider economics, auction/ranking mechanics, ad labeling and click
measurement, API contribution, operating cost, and whether investor/control
claims from 2020 remain current. No audited current business-model disclosure
was found.

**RECOMMENDATION (high):** separate organic rank from monetization, record ad
provider and targeting inputs, label ads structurally, never infer evidentiary
authority from payment, and maintain a cost/incentive ledger for every external
provider. Curiosity's owned-search objective should not depend on ad demand.

## 10. Clean-room architecture inference

### 10.1 Disclosed pipeline

Mojeek's public explanations support this generic chain [S1, S4, S18, S32]:

```text
links/frontier -> MojeekBot fetch under robots/meta policy
  -> extract page text, title, links, dates, metadata
  -> parse / sort / compress into index structures + link graph
  -> receive query + explicit preference/locale context
  -> lexical retrieval, with semantic and authority features
  -> automated ranking
  -> host clustering and presentation controls
  -> organic title + URL + content-derived snippet
  -> optional panels, ads, or cited summary sidecars
```

Mojeek says indexing uses roughly 100 times the compute of crawling, the index
must be repeatedly refreshed, the proprietary stack is mostly C, and serving is
on company-built/managed infrastructure in a UK data centre [S1, S32]. These are
architecture claims, not a current topology.

### 10.2 Consumer-serving inference

**INFERENCE (medium-high):** effective request processing likely has separate
stages for query-operator parsing, preference decoding, locale resolution,
candidate retrieval, feature scoring, clustering, result formatting, and
sidecar routing. This follows from independently controllable settings and
disclosed feature classes; it does not reveal process boundaries or code.

**INFERENCE (medium):** ordinary organic retrieval can remain wholly in one
facility, which plausibly contributes to low reported latency, while ads and
summaries introduce network calls or delegated processing. Mojeek reported a
roughly 100 ms median and <=300 ms for 75% of queries in 2024, but this was an
aggregated vendor graph, not an SLA or current measurement [S33].

**Unknown:** whether ad calls block rendering, how failures degrade, where
summary extraction runs, caching, request tracing, timeout/byte bounds, query
logs, index shards, replicas, consistency, semantic-serving hardware, model
hosting, and sidecar isolation.

### 10.3 Clean-room boundary

Mojeek's code, rank weights, index, graph, and operational data are proprietary.
No implementation was inspected or copied. Transferable material is limited to
public behavior, general architectural patterns, independently written
requirements, and evaluation questions. Names such as Gravity, MojeekBot,
Mojeek, Focus, and associated branding remain Mojeek's; underlying page content
and result links do not become licensed project assets.

## 11. Curiosity implications and verdict ledger

| Observable lesson | Verdict | Curiosity disposition | Confidence |
| --- | --- | --- | --- |
| Own crawler, corpus, graph, ranker, and serving chain | **ADOPTED** | Preserve stage ownership and lineage; consuming the consumer site would not make Curiosity owned. | High |
| HTML/static-first crawl | **ADAPTED** | Start bounded and static-first for safety/cost, but add independently gated document and rendering lanes with provenance. | High |
| Lexical-first retrieval plus bounded semantics | **ADOPTED/ADAPTED** | Preserve exact terms and operators; semantic candidates/features must carry model, language, and version. | High |
| Explicit query operators | **ADAPTED** | Typed scopes and filters with parser/version/error semantics; do not depend on undocumented string syntax. | High |
| No silent spelling correction | **ADOPTED** | Offer alternatives while retaining the submitted query and recording any caller-approved rewrite. | High |
| Caller-explicit language/location | **ADOPTED** | No inferred behavioral profile; record effective locale and source. | High |
| Cookieless preference URLs | **ADAPTED** | Preserve inspectable, portable policy but keep sensitive settings out of URLs/logs. | High |
| Focus include/exclude lists | **ADAPTED** | Bounded, typed source policy with owner, snapshot, reason, expiry, and domain/host semantics. | High |
| Host clustering | **ADAPTED** | Add canonical/content/owner clusters and state why diversity changed rank. | High |
| Modified/crawl date display | **ADAPTED** | Split all temporal meanings and expose source/confidence. | High |
| Optional cited summary beside links | **ADAPTED** | Keep results primary and synthesis reversible; add immutable claim-level evidence. | High |
| Binary Safe Search | **REJECTED as sufficient** | Require taxonomy, policy version, reason, uncertainty, appeals, and evaluation. | High |
| Contextual ads using query/country | **ADAPTED only as incentive lesson** | If monetization ever exists, structurally isolate it and disclose data egress; no behavioral profile. | Medium |
| Indefinite de-identified logs | **REJECTED as default** | Purpose-limited fields, short retention, rare-query controls, access audit, and deletion evidence. | High |
| Consumer frontend as provider | **REJECTED** | Terms prohibit automation; HTML is mutable/unversioned and lacks machine/evidence contract. | High |
| Page-count competition | **REJECTED** | Optimize judged usefulness, coverage, freshness, diversity, safety, and citation stability. | High |
| Mojeek as authorized comparison source | **DEFERRED** | Only under separate caller authority, terms/privacy review, and preregistered query budget. | High |

### Curiosity-specific opportunities

1. **Operator disagreement:** compare exact lexical, fielded, and semantic lanes;
   spend curiosity budget only where disagreement can alter the synthesis.
2. **Temporal gap detection:** distinguish newly published, newly discovered,
   newly changed, and stale; propose one branch targeting the missing state.
3. **Source-policy transparency:** let the caller inspect and snapshot included,
   excluded, preferred, and de-prioritized hosts without treating preference as
   truth.
4. **Cluster-aware exploration:** seek a novel publisher/owner only after
   relevance and safety gates, not merely a different hostname.
5. **Summary-to-evidence reversal:** every generated claim should reopen the
   exact captured passage and reveal unsupported or contradictory evidence.
6. **Coverage warnings:** report weak locale, source-type, host, date, or
   document-format coverage instead of hiding it behind a large page count.

These opportunities remain read-only, caller-framed, and budget-bounded. Search
content cannot expand scope or authorize follow-up.

## 12. Unknowns and required checks

### Material unknowns

1. Current corpus definition/count, unique-host distribution, file types,
   language/geography coverage, rendering, duplicates, and recrawl age.
2. Current lexical tokenizer/stemmer, semantic model/languages, rank features,
   weights, anti-spam controls, and evaluation results.
3. Consumer query parser limits and exact semantics for phrases, Boolean logic,
   `week`, Unicode, malformed operators, and pagination.
4. Title/snippet derivation, rewriting, sanitization, staleness, and provenance.
5. Effective date extraction/fallback, timezone, confidence, and freshness SLA.
6. Safe Search taxonomy, quality, policy version, reason codes, and appeals.
7. Current summary provider/model, query/result egress, retention, training,
   cache, citations, and whether the feature remains operational as documented.
8. Ad selection/routing among Mojeek, Prorata, and adMarketplace; retention,
   jurisdiction, auction, labeling, click measurement, and partner policy.
9. Exact query/referrer/campaign logs, retention enforcement, rare-query risk,
   access controls, deletion, security review, and independent privacy audit.
10. Current business revenue mix, investor/control position, profitability,
    capacity, availability, incident history, and disaster recovery.
11. Published annual transparency reports and current government/legal request
    counts.

### Checks actually performed

- Cross-read current homepage/navigation, preferences, support index, tips,
  advanced search, formal operator page, operator guide, and 2025 query guide.
- Cross-read ownership claims against crawler rules, content scope, technology,
  ranking, historical pipeline, and current 2026 company positioning.
- Separated organic Web from Search Choices, Focus, Wikipedia, News, summary,
  Image/Substack, and ads.
- Reconciled “not an answer engine” with a currently exposed optional summary:
  Mojeek rejects replacement, while current preferences retain optional
  placement; current provider/operation remains unknown.
- Reconciled “no tracking” with disclosed logging and third-party egress: no
  user profile/IP log is not no query processing, retention, or disclosure.
- Checked current policy/navigation/blog archive and plausible transparency URLs;
  no dated transparency report was found.
- Confirmed negative results for a public freshness SLA, relevance benchmark,
  Safe Search evaluation, snippet algorithm, current summary contract, and
  complete ad/privacy data-flow statement.

## 13. Bounded curiosity pass

After synthesis, in-frame gaps were scored 1–5 for relevance (R), decision value
(V), novelty (N), and cost (C; 5 = expensive), using `R + V + N - C`.

| Thread | R | V | N | C | Score | Outcome |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Current ad-provider/query-egress path versus 2022 privacy policy | 5 | 5 | 5 | 1 | 14 | **Pursued.** Current support names Prorata/adMarketplace and query + country egress; policy does not [S14, S17]. |
| 2025 “not an answer engine” versus current summary controls | 5 | 5 | 4 | 1 | 13 | **Pursued.** Optional result-support is compatible with non-replacement, but provider/status remain unknown [S6, S18, S26]. |
| Relative-date `week` discrepancy | 3 | 4 | 4 | 1 | 10 | **Pursued.** 2023 guide supports it; current formal operator page omits it, so the contract remains uncertain [S10, S11]. |
| Locale boost versus strict region semantics | 4 | 4 | 3 | 1 | 10 | **Pursued.** Current UI separates auto/manual boost from four strict regions; arbitrary ISO restriction is only historical [S6, S28]. |
| Locate promised transparency reports | 4 | 4 | 4 | 2 | 10 | **Pursued to bounded exhaustion.** Policy, navigation, archive, and plausible public paths produced no dated report. |
| Run human searches to measure result/snippet/ranking behavior | 5 | 5 | 4 | 5 | 9 | **CURIOSITY_NO_GO.** Caller prohibited querying; Terms/robots also bar automated use. Separate benchmark authority required. |
| Inspect frontend/network calls to identify current summary/ad routing | 4 | 4 | 4 | 5 | 7 | **CURIOSITY_NO_GO.** Active inspection exceeds the public-document clean-room frame. |
| Infer ranking weights through query perturbation | 3 | 2 | 4 | 5 | 4 | **CURIOSITY_NO_GO.** Prohibited live experimentation, weak causal validity, and no implementation value. |
| Map physical topology from crawler IP/DNS/status data | 2 | 2 | 3 | 5 | 2 | **CURIOSITY_NO_GO.** Active probing and topology inference are unnecessary and outside the access boundary. |
| Audit third-party ad/LLM provider internals | 2 | 3 | 3 | 5 | 3 | **CURIOSITY_NO_GO.** Separate provider/privacy review; current decision needs only disclosure of egress and unknowns. |

**Stop reason:** coverage, saturation, and access exhaustion. Remaining material
questions require live consumer use, authenticated/paid access, vendor answers,
provider contracts, deployed telemetry, or independent audit.

## 14. Fact / inference / recommendation ledger

| ID | Statement | Type | Confidence | Sources / falsifier |
| --- | --- | --- | --- | --- |
| L1 | Mojeek represents ordinary web results as coming from its own crawler, HTML index, link graph, ranker, and infrastructure. | FACT, self-attested | Medium-high | [S1–S5]; falsified by audited upstream-result dependence. |
| L2 | Current history reports nine billion pages in 2025, but “page” and coverage quality are undefined. | FACT + evidence boundary | High / medium | [S1]; requires corpus audit. |
| L3 | Consumer retrieval is lexical-first with supplementary semantic, link-authority, language, and country signals. | FACT, self-attested | High | [S5, S12, S24]. |
| L4 | Mojeek rejects behavioral/click personalization but still applies explicit or auto country context. | FACT | High | [S2, S5–S7]. |
| L5 | Operators support site, exclusion, field, all-field, and date restrictions; parts of the syntax are undocumented or conflicting. | FACT | High | [S9–S12]. |
| L6 | Default host clustering improves visible host variety, not necessarily owner/viewpoint diversity. | FACT + INFERENCE | High | [S7, S25]. |
| L7 | Result dates can mix modified date with first-crawl fallback and are not publication dates. | FACT | High | [S10]. |
| L8 | No public-web freshness SLA or current coverage distribution was found. | Negative result | High | Source set; vendor disclosure could resolve. |
| L9 | Policy says no IP logs/user tracking, but indefinitely retained requested-page logs and some uncoupled search-query use exist. | FACT + INFERENCE | High | [S14, S15]. |
| L10 | Current ads disclose query + country egress to Prorata/adMarketplace, absent from the 2022 privacy policy. | FACT + documentation gap | High | [S14, S17]. |
| L11 | Current UI exposes optional summaries; 2024 implementation used Mixtral via Lepton, but current provider/privacy contract is unknown. | FACT + UNKNOWN | High / low | [S6, S18, S26]. |
| L12 | Safe Search is optional and mature-content-oriented; its current effectiveness and taxonomy are unpublished. | FACT + UNKNOWN | High | [S6, S7, S29]. |
| L13 | Organic content policy includes legal, CSAM, spam, phishing, and malware action despite no manual re-ranking. | FACT | High | [S3, S5]. |
| L14 | Consumer monetization visibly combines ads and commercial search products; current revenue mix and sustainability are unknown. | FACT + INFERENCE | Medium | [S16, S17, S30, S31]. |
| L15 | Curiosity should adopt owned stages and explicit controls, but independently specify evidence, safety, privacy, and temporal semantics. | RECOMMENDATION | High | Analysis above. |
| L16 | The consumer frontend must not be automated or used as a machine provider. | RECOMMENDATION / contract fact | High | [S19, S20]. |

## Sources

All sources were accessed **2026-08-17**. Mojeek-authored sources are primary
for its public representations and policies; they are not independent validation
of implementation, quality, compliance, or current deployment.

- **[S1]** Mojeek, “Team and Technology.”
  <https://www.mojeek.com/about/technology.html>
- **[S2]** Mojeek, “Why is Mojeek Different?”
  <https://www.mojeek.com/about/why-mojeek>
- **[S3]** Mojeek, “Search Content Policy.”
  <https://www.mojeek.com/about/content/>
- **[S4]** Mojeek, “MojeekBot.” <https://www.mojeek.com/bot.html>
- **[S5]** Mojeek Blog, “About Ranking on Mojeek,” 2024-08-14.
  <https://blog.mojeek.com/2024/08/about-ranking-on-mojeek.html>
- **[S6]** Mojeek, “Preferences.” <https://www.mojeek.com/preferences>
- **[S7]** Mojeek, “Mojeek Tips Support Page.”
  <https://www.mojeek.com/support/search/tips.html>
- **[S8]** Mojeek, “Adding Mojeek Cookieless to Your Browser.”
  <https://www.mojeek.com/support/search/cookieless.html>
- **[S9]** Mojeek, “Advanced Search.”
  <https://www.mojeek.com/advanced.html>
- **[S10]** Mojeek Blog, “A Guide to Mojeek Operators,” 2023-08-03.
  <https://blog.mojeek.com/2023/08/mojeek-operators-a-guide.html>
- **[S11]** Mojeek, “Search Operators.”
  <https://www.mojeek.com/support/search-operators.html>
- **[S12]** Mojeek Blog, “Getting the Best out of Keyword Web Search,”
  2025-01-08.
  <https://blog.mojeek.com/2025/01/getting-the-best-out-of-web-keyword-search.html>
- **[S13]** Mojeek Blog, “Mojeek Preference Settings; Your Results Page, Your
  Way,” 2021-12-09.
  <https://blog.mojeek.com/2021/12/mojeek-preference-settings-your-results-page-your-way.html>
- **[S14]** Mojeek, “Privacy Policy,” updated 2022-02-02.
  <https://www.mojeek.com/about/privacy/>
- **[S15]** Mojeek Blog, “About Mojeek; Business Model, Surveillance, and
  Privacy,” 2020-12-08.
  <https://blog.mojeek.com/2020/12/frequently-asked-questions-about-mojeek-business-model-surveillance-privacy.html>
- **[S16]** Mojeek, “Mojeek Ads.” <https://www.mojeek.com/ads/>
- **[S17]** Mojeek, “Ads on Mojeek.”
  <https://www.mojeek.com/support/ads/>
- **[S18]** Mojeek Blog, “Mojeek Search Summaries,” 2024-04-03.
  <https://blog.mojeek.com/2024/04/mojeek-search-summary.html>
- **[S19]** Mojeek, “Terms of Service.”
  <https://www.mojeek.com/about/terms.html>
- **[S20]** Mojeek, `robots.txt`. <https://www.mojeek.com/robots.txt>
- **[S21]** Mojeek Blog, “Search Choices Enable Freedom to Seek,” 2022-02-09.
  <https://blog.mojeek.com/2022/02/search-choices-enable-freedom-to-seek.html>
- **[S22]** Mojeek, “Focus” support.
  <https://www.mojeek.com/support/search/focus.html>
- **[S23]** Mojeek Blog, “Who Needs Cookies?,” 2022-09-08.
  <https://blog.mojeek.com/2022/09/who-needs-cookies.html>
- **[S24]** Mojeek Blog, “Major Algorithm Update; Adding A Semantic Element,”
  2024-02-07.
  <https://blog.mojeek.com/2024/02/major-algorithm-update.html>
- **[S25]** Mojeek Blog, “Clustering — How Mojeek Gives You More Variety,”
  2024-07-16.
  <https://blog.mojeek.com/2024/07/clustering-how-mojeek-gives-you-more-variety.html>
- **[S26]** Mojeek Blog, “Mojeek is Not an Answer Engine,” 2025-09-09.
  <https://blog.mojeek.com/2025/09/mojeek-is-not-an-answer-engine.html>
- **[S27]** Mojeek, “Mojeek Advertising Policies.”
  <https://www.mojeek.com/ads/policy/>
- **[S28]** Mojeek Blog, “Mojeek Preference Settings; Language and Location,”
  2021-10-06.
  <https://blog.mojeek.com/2021/10/mojeek-preference-settings-language-and-location.html>
- **[S29]** Mojeek Blog, “Mojeek Updates, November 2023,” 2023-11-07.
  <https://blog.mojeek.com/2023/11/mojeek-updates.html>
- **[S30]** Mojeek, “Products and Services.”
  <https://www.mojeek.com/services/>
- **[S31]** Mojeek Blog, “Who Funds Mojeek?,” 2020-10-29.
  <https://blog.mojeek.com/2020/10/who-funds-mojeek.html>
- **[S32]** Mojeek Blog, “No-Tracking Search, How Does it Work?,” 2021-05-04.
  <https://blog.mojeek.com/2021/05/no-tracking-search-how-does-it-work.html>
- **[S33]** Mojeek Blog, “The Fastest Engine in the West?,” 2024-08-01.
  <https://blog.mojeek.com/2024/08/the-fastest-engine-in-the-west.html>
- **[S34]** Mojeek Blog, “The Switch to Alternative Search Engines,”
  2026-05-18.
  <https://blog.mojeek.com/2026/05/the-switch-to-alternative-search-engine.html>
