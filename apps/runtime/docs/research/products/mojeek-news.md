# Mojeek News: standalone vertical, clean-room dossier

**Research and primary-source access date:** 2026-08-17  
**Surface:** public consumer vertical at `https://www.mojeek.com/news`  
**Scope:** current status, source/corpus boundary, time and freshness, story
clustering/deduplication/ranking, provenance/privacy, business model, and
transferable lessons for Curiosity.  
**Boundary:** public first-party pages only. No search query, automated query,
credential, paid call, scraping, result harvesting, publisher fetch, private
traffic inspection, source code, bypass, or implementation was used. The live
landing page and two linked category pages were read as ordinary public pages;
their transient article lists were not retained as a corpus.

## Executive verdict

**ADAPTED as an observable news-aggregation and story-grouping reference;
REJECTED as an owned-news substrate, provider dependency, or citation authority
(high confidence).** Mojeek News is active in 2026 as a free, server-rendered,
browse-oriented vertical. It presents World plus six topical sections and
groups some related publisher articles beneath a lead story. The global search
box submits to Mojeek's ordinary `/search`, not to a documented queryable News
endpoint. No current first-party News API, feed, export, pagination, archive
contract, or standalone commercial offer was found [S1, S8].

The strongest corpus evidence is historical but explicit: Mojeek called News an
“extensive news aggregator,” said an updated system made it easier to add new
sources, promised to add media outlets and publishers worldwide, and said it
kept a cache of previous stories [S2]. The current page confirms that the
publisher-oriented product survives, but it does **not** disclose the source
list, admission rules, ingestion path, corpus size, rights, refresh cadence, or
relationship to Mojeek's independently crawled general-web index. It would be a
category error to transfer Mojeek's owned-web-index claim to News.

Freshness and provenance are presentation-grade rather than evidence-grade.
Articles expose a direct destination URL, display outlet/section, title, usually
an image, sometimes a snippet, and only a relative age such as “2 hours ago.”
The public HTML supplies no absolute publication time, timezone, author,
canonical URL, content hash, fetch/discovery clock, ingestion source, immutable
capture, cluster ID, score, or rank explanation [S1]. Relative age cannot prove
publication time or bind a headline/snippet to particular bytes.

For Curiosity, the safe lesson is the **separation of source eligibility, story
grouping, lead selection, and compact presentation**. Curiosity should implement
none of Mojeek's unknown algorithms and should instead own timestamp evidence,
captures, reversible document/syndication/event relations, source-independence
reasoning, and explicit ranking traces.

## 1. Decision frame and bounded questions

### Decision

What does the public Mojeek News vertical establish, and which observable ideas
can Curiosity independently adopt without confusing a publisher aggregator with
Mojeek's general web index or reproducing proprietary behavior?

### Bounded sub-questions

1. Is the vertical currently operating, and is it a feed, browse page, search
   endpoint, or API?
2. How are publishers and articles selected or acquired, and how does News
   relate to Mojeek's owned web corpus?
3. Which publication, modification, discovery, fetch, and display clocks exist?
4. What is exposed about story clustering, duplicate suppression, lead choice,
   section ranking, source diversity, and localization?
5. What provenance, privacy, rights, and monetization properties are public?
6. Which concepts are safely transferable to an owned Curiosity news plane?

### Evidence labels and limits

- **FACT** — directly stated or visibly encoded by a cited first-party source.
- **INFERENCE** — the narrowest conclusion consistent with cited facts, not an
  observation of internals.
- **RECOMMENDATION** — an independently authored Curiosity choice.
- Confidence is **high**, **medium**, or **low** for the scoped claim.
- A dynamic landing page establishes current public behavior only at access
  time. It cannot establish completeness, stability, quality, or hidden policy.
- Historical claims are dated. They are useful lineage evidence, not proof that
  every 2019 mechanism remains unchanged.
- General Web Search documentation is used only to mark boundaries. Its crawler,
  host-clustering, ranker, index, and API behavior are not attributed to News
  without News-specific evidence.

**Stop condition:** every requested category had at least one primary-source
finding or an explicit unknown, and the remaining material gaps required live
experimentation, publisher data, private contracts, or vendor disclosure.

## 2. Current status and product boundary

### 2.1 What exists now

**FACT (high):** `/news` returned a current `News - Mojeek` page with the
description “All of the latest news from around the world,” direct publisher
links, and sections for **World, Business, Science, Technology, Entertainment &
Arts, Sports, and Health**. `top=business` and `top=technology` are ordinary
linked category views [S1].

**FACT (high):** this is a browsing surface, not a documented news-query
contract. Its header/footer text form submits `q` to `/search`; the News page
does not expose a News-specific query field, result count, page control, date
filter, locale control, feed link, API link, or archive link. The Products menu
offers Web Search API and Site Search API, not News API [S1, S8].

**INFERENCE (high):** model the current product as:

```text
selected publisher/article inputs (method unknown)
  -> News eligibility + topic assignment (method unknown)
  -> related-story grouping (visibly present)
  -> lead/order selection (method unknown)
  -> server-rendered topical landing pages
  -> direct links to publishers
```

It is not publicly contracted as query-to-news retrieval, a complete headline
firehose, an archive, a monitoring service, or an article-content API.

### 2.2 Lineage

**FACT (high):** the 2019 update calls Mojeek News an aggregator and says the
new system made sources easier to add after the previous system had difficulty.
It describes adding “media outlets,” building a more complete collection of
publishers worldwide, adding Science and Technology sections, showing a UK
category to users in or configured for the UK, and retaining cached previous
stories for longer [S2].

**FACT (high):** Mojeek's current technology page separately claims that its
general search/crawler stack and IP were developed in-house and that the web
index reached nine billion pages in 2025 [S7]. Its content policy says the web
index contains HTML pages and returns URL titles and snippets [S3]. Neither page
says News articles originate exclusively—or at all—from that index.

**INFERENCE (high):** News has at least a curated **source-eligibility layer**:
someone or some Mojeek-controlled process can add publishers. That does not tell
us whether article discovery uses RSS/Atom, publisher APIs, sitemaps, ordinary
crawling, licensed feeds, manual submission, or a mixture.

**RECOMMENDATION (high):** keep `mojeek_news` and `mojeek_web` as distinct
products and evidence lineages. Never label a News candidate “independently
crawled by Mojeek” merely because the parent company owns a web crawler.

## 3. Sources and corpus

### 3.1 Established facts

- **FACT (high):** the 2019 product intent was worldwide publisher breadth,
  topic breadth, political-perspective variety, and gradual addition of media
  outlets [S2]. These are goals and source-management claims, not measured
  coverage guarantees.
- **FACT (high):** current rendered items identify a display outlet and
  sometimes the publisher's section (for example, an outlet followed by
  “Business” or “World”) and link directly to publisher URLs [S1].
- **FACT (high):** current pages include remote publisher image URLs routed
  through Mojeek's `/image?img=...` presentation endpoint, with a local
  no-image placeholder when no image is presented [S1]. This proves image
  presentation/proxying, not image ownership or a durable image corpus.
- **FACT (high):** no exhaustive source list, per-source feed URL, publisher ID,
  author, owner/company identity, license, admission reason, trust label, or
  source-level provenance is exposed on the page [S1].

### 3.2 What cannot safely be inferred

**UNKNOWN:**

1. current publisher/article count and country/language distribution;
2. source allowlist, admission/removal rubric, appeals, corrections, and
   publisher submission mechanism;
3. RSS/Atom, News sitemap, crawl, API, wire, licensed-feed, or manual share;
4. whether title, section, snippet, image, and publication age come from a feed,
   fetched HTML, structured data, publisher API, or third party;
5. paywall, robots, canonical, redirect, takedown, malware, spam, and dead-link
   handling specific to News;
6. full-text retention versus metadata-only cache, current cache horizon, and
   deletion/correction propagation;
7. whether the source set or ranking differs by detected/configured country;
8. rights or compensation arrangements with publishers.

**Negative result (high confidence):** no current first-party News help page,
schema, API documentation, public source catalog, corpus statistics, publisher
terms, freshness SLA, or quality/coverage report was found in the bounded public
materials. The one substantive News engineering/product post found is dated
2019 [S2].

## 4. Publication timestamps and freshness

### 4.1 Observable clock

**FACT (high):** each visible article has a human relative-age string in a
`time` element, such as “44 minutes ago” or “12 hours ago.” The reviewed HTML
had no `datetime` attribute or absolute timestamp attached to those elements
[S1]. Publisher URLs sometimes contain calendar dates, but URL text is not a
timestamp contract.

**FACT (high):** the current metadata calls the page “latest news”; the 2019
post says older stories were cached for longer [S1, S2]. No current page states
the age source or freshness computation.

**INFERENCE (high):** the relative value may be derived from a publisher-claimed
publication/modification time, feed timestamp, provider discovery time, or
another normalization. A rendered age is calculated against an unstated server
time and will decay; it is unsuitable as durable provenance.

### 4.2 Missing time semantics

No public News source reviewed defines:

- original publication versus last modification;
- publisher timezone, normalization timezone, or clock-skew policy;
- discovery, ingest, fetch, index-visible, first-seen, or last-checked time;
- treatment of missing, future, corrected, republished, live-blog, or conflicting
  dates;
- freshness window, maximum article age, refresh interval, or stale-story
  eviction;
- binding between displayed title/snippet/image and a fetched article version.

**RECOMMENDATION (high):** Curiosity must retain named clocks independently:

```text
publisher_claimed_published_at?
publisher_claimed_modified_at?
feed_claimed_at? + feed_observed_at?
discovered_at + fetched_at? + indexed_at
first_seen_at + last_seen_at
provider_display_age_observed_at?  # raw Mojeek hint only
```

Never back-calculate an authoritative publication instant from a relative age.

## 5. Clustering, deduplication, and ranking

### 5.1 Story grouping is visible

**FACT (high):** the current World and category pages use at least three
presentation forms: a prominent lead with image/snippet, grouped lead stories
with one or more subordinate related headlines, and smaller standalone stories.
Some groups include articles from different outlets; some include multiple
articles from the same outlet [S1].

**INFERENCE (high):** this is story/topic grouping rather than merely one-result-
per-host suppression. It is evidence that Mojeek has a relation like “these
articles belong together,” but not evidence of how the relation is computed or
whether it represents an event, evolving story, common entity, copied article,
or editorial topic.

**Boundary (high):** Mojeek's 2024 Web Search post documents configurable host
clustering with one result per host by default [S9]. That post is about Web SERPs,
not News. Current News groups can contain same-host related articles, so the Web
rule must not be imported into the News model.

### 5.2 Deduplication is not contracted

**FACT (high):** the page exposes no canonical URL, redirect chain, content
hash, exact-duplicate marker, syndication/wire attribution, cluster ID, related
edge type, cluster confidence, or “more coverage” control [S1].

**INFERENCE (medium):** some duplicate suppression likely exists because a
finite topical page is presented, but the public record does not establish
exact-URL, canonical, near-text, or headline deduplication. Absence of obvious
duplicates in one transient page would not prove a policy.

**RECOMMENDATION (high):** Curiosity should preserve separate reversible layers:

1. **URL/document identity** — requested, resolved, final, canonical URLs and
   exact-content hash;
2. **copy/syndication relation** — near-duplicate text, shared byline/wire,
   attribution, and temporal evidence;
3. **story/event relation** — shared entities, claims, event/place/time, with
   edge evidence and confidence;
4. **publisher independence** — outlet, owner, wire dependence, common author,
   and evidence, not hostname alone.

A cluster of copied stories is one evidentiary lineage, not independent
corroboration.

### 5.3 Ranking and lead selection

**FACT (high):** array/page position and lead-versus-related presentation are the
only public rank signals. No score, rank reason, model/version, source quota,
freshness weight, popularity signal, diversity constraint, or explanation is
shown [S1].

**FACT (medium):** Mojeek's broad content policy says its search rankings are
fully automated, uniformly signaled, largely deterministic, not personalized,
and not human re-ranked; it also permits action against CSAM, search spam,
phishing, and malware [S3]. The policy does not explain whether every News
eligibility, grouping, lead, and ordering decision follows the general-web
ranker.

**FACT (high):** the News update explicitly frames source addition and
perspective variety as product choices [S2]. Source curation can coexist with
automated article ranking; “no human re-ranking” does not mean “no human source
policy.”

**UNKNOWN:** retrieval/candidate generation, cluster algorithm, duplicate
threshold, lead choice, recency decay, publisher authority, engagement/click
signals, geography, language, political-diversity mechanism, source/owner caps,
category classifier, corrections, and tie-breaking.

**RECOMMENDATION (high):** preserve provider display position only as
`provider_rank_observed_at`. Curiosity should independently score relevance,
freshness, originality, source independence, contradiction value, and cluster
coverage, while recording each stage and avoiding political “balance” inferred
from unverified outlet labels.

## 6. Geography, language, and safety

**FACT (high):** the page displays an automatically detected city/country and a
link to change it. Preferences allow a configured location or no location bias,
and separately offer site language and preferred Web-result language [S1, S8].

**FACT (high, historical):** in 2019 a UK News category appeared for users in or
configured for the UK, and Mojeek intended to expand national sections [S2]. On
the 2026 access location, the visible top-level section was World rather than a
named national category [S1].

**INFERENCE (medium):** location is available to the News renderer and has at
least historically affected navigation. Current per-story ranking or source
selection by location is not documented.

**UNKNOWN:** News languages, translation, market coverage, location fallback,
IP geolocation provider/accuracy, configured-versus-detected precedence, and
whether section labels or corpus differ by locale.

**FACT (medium):** Mojeek's content policy describes broad index actions for
CSAM, search spam, phishing, and malware [S3]. Preferences expose Safe Search
for Web results, but the News page does not echo a safety setting or per-result
policy reason [S8].

**RECOMMENDATION (high):** do not claim News-specific Safe Search, source safety,
factuality, or malware screening from general policy prose. Curiosity should
record effective locale and policy, sanitize all publisher text/images/URLs as
untrusted, and separate adult-content filtering from graphic-news, defamation,
misinformation, malware, and prompt-injection controls.

## 7. Provenance, privacy, and rights

### 7.1 Result provenance

| Question | Public Mojeek News evidence | Curiosity requirement |
| --- | --- | --- |
| Which destination? | direct publisher URL | requested/resolved/final/canonical chain |
| Which outlet? | display outlet/section text | publisher entity, owner, evidence, confidence |
| Which article version? | none | immutable capture ID, hash, fetch headers/time |
| When published? | relative display age | typed source claim, timezone, derivation |
| Why grouped? | subordinate visual placement | relation type, evidence, confidence, version |
| Why ranked/lead? | position and styling only | candidate/rerank stages and reason classes |
| Which text supports a claim? | title; occasional snippet | passage offsets/DOM anchor bound to capture |
| Which image/rightsholder? | proxied remote URL or placeholder | source URL, retrieval record, rights/credit |

**FACT (high):** titles, snippets, outlet labels, image URLs, and publisher pages
are third-party-controlled or third-party-derived content. Mojeek's Terms say
Search Content directly represents information publicly available on the web
and disclaim service quality/availability; they do not grant Curiosity rights to
archive or redistribute publisher articles/images [S5].

### 7.2 Website privacy

**FACT (high):** Mojeek says it sets no cookie by default without agreement and
does no specific-user tracking. Standard logs are kept **indefinitely**, but IP
addresses are replaced by two-letter country codes. Logs retain time, requested
page, possible referrer, and separately browser information; aggregate,
non-personal search data may improve results [S4].

**FACT (high):** the News HTML declares `referrer` policy `origin`, displays an
automatically detected location, and uses direct external publisher links [S1].
Mojeek's policy says its privacy policy ceases to apply when a user proceeds to
another website [S4].

**INFERENCE (high):** opening News discloses network data to Mojeek long enough
to geolocate the request even if raw IP is not retained in standard logs;
following a story creates a separate publisher disclosure. `origin` reduces the
referrer to Mojeek's origin rather than suppressing it entirely.

**UNKNOWN:** News-specific CDN/proxy/security logs, image-proxy request logs,
geolocation processor and retention, abuse logs, consent jurisdiction behavior,
internal access controls, backups, deletion, and whether every operational log
follows the standard-log transformation.

**RECOMMENDATION (high):** treat every provider/page/publisher request as a
separate disclosure. Curiosity should proxy only under explicit policy, strip
sensitive referrers, minimize location granularity, bound log retention, and
never send private research context to a public news surface.

## 8. Business model and operational contract

### 8.1 What is public

- **FACT (high):** News is accessible without account, key, or visible price
  and behaves as part of the public Mojeek website [S1].
- **FACT (high):** general Terms permit Mojeek and third-party providers/partners
  to place ads on Services [S5]. The one observed News rendering is not evidence
  that ads never appear.
- **FACT (high):** Mojeek operates an invite-only advertising programme with
  contextual category, keyword, and country targeting, while also selling Web
  Search and Site Search APIs [S6, S8].
- **FACT (high):** Mojeek's history reports private investment. It does not
  publish News-specific revenue, costs, publisher payments, sponsorship, or
  licensing economics [S7].

**INFERENCE (medium-high):** News is presently a free consumer feature that can
support Mojeek's broader search audience and potentially its advertising or
commercial-search business. No source supports a standalone News subscription,
per-query fee, or News API revenue line.

### 8.2 Operational and access boundary

**FACT (high):** Terms allow interruption/change without notice, disclaim
quality and availability, prohibit automated access unless an authorized API
user, permit standards-compliant crawling, and prohibit scraping without prior
consent [S5]. `robots.txt` disallows `/search`, `/url`, and `/image?`, but does
not by itself grant rights to scrape or republish `/news` [S10].

**RECOMMENDATION (high):** do not build a Curiosity adapter against the consumer
HTML. There is no stable schema/version/SLA, automation is contractually
restricted, News is absent from the documented API offer, and publisher-content
rights remain unresolved. Any future access requires written News-specific API,
storage, privacy, attribution, and downstream-content terms.

## 9. Clean-room lessons and verdict ledger

Mojeek's News implementation, source list, cache, clusters, and ranker are
proprietary and unavailable. This dossier records only public claims and
observable presentation. It copies no algorithm, output corpus, or compatibility
interface.

| Item | Type | Confidence | Verdict |
| --- | --- | --- | --- |
| Separate news eligibility from general web eligibility | INFERENCE from source addition | High | **ADOPTED.** A news corpus needs its own admission and provenance policy. |
| Topical landing pages without a query | FACT | High | **ADAPTED.** Useful for bounded monitoring, but Curiosity also needs explicit query/event interfaces. |
| Lead article plus related coverage | FACT | High | **ADAPTED.** Present clusters compactly while exposing reversible edges and uncertainty. |
| Variety across publishers/perspectives as a goal | FACT about stated intent | High | **ADAPTED.** Measure owner, geography, language, and evidentiary independence; do not rely on political labels. |
| Same-outlet items allowed within a story group | FACT | High | **ADOPTED** as evidence that story relation and host diversity are separate controls. |
| Relative age as sole time display | FACT | High | **REJECTED** for provenance; retain named absolute clocks and raw claims. |
| Opaque source addition and corpus | FACT/negative result | High | **REJECTED** as an owned-corpus model. |
| Opaque story grouping/lead rank | FACT/negative result | High | **REJECTED** as an audit contract; independently specify relations and reasons. |
| Publisher image proxying | FACT | High | **DEFERRED.** Requires security, privacy, caching, hotlink, credit, and rights design. |
| General no-tracking posture | FACT | High | **ADAPTED.** Add explicit bounded retention and processor/log detail; indefinite logs are not Curiosity's default. |
| Consumer HTML as machine provider | RECOMMENDATION | High | **REJECTED.** No API contract and automation/scraping boundaries prohibit assumption. |
| Mojeek News as citation/evidence authority | RECOMMENDATION | High | **REJECTED.** It supplies discovery hints, not versioned passages or source independence. |
| Authorized future comparative evaluation | RECOMMENDATION | Medium | **DEFERRED.** Only after vendor permission, stable access, rights, and a preregistered study. |
| Reconstruct Mojeek source list/ranker/thresholds | RECOMMENDATION | High | **REJECTED.** Unnecessary, weakly inferential, and outside clean-room boundaries. |

## 10. Exact Curiosity implications

### 10.1 Provider-neutral owned model

**RECOMMENDATION (high):** model news at three levels rather than flattening
URLs into results:

```text
NewsObservation
  source_channel + observed_at + raw_source_ref
  requested_url + resolved_url + canonical_url?
  source_claimed_title/byline/published/modified?
  capture_id? + content_hash? + passage_anchors[]
  rights/robots/policy trace

NewsRelations (versioned and reversible)
  exact_duplicate_of
  syndicated_or_copied_from
  updates_or_corrects
  reports_same_event_as
  supports/contradicts/repeats_claim
  publisher_owned_by / relies_on_wire

NewsPresentation
  topic/event cluster + lead rationale
  independent-source count
  freshness clock and fallback
  relevance/diversity/novelty reason classes
  uncertainty and coverage warnings
```

### 10.2 Bounded research behavior

1. Treat an aggregator item as a candidate, never as article truth or capture.
2. Fetch publisher content only under separate access/rights/robots policy.
3. Preserve publisher claims and Curiosity observations as different clocks.
4. Group exact copies, syndications, updates, and same-event reports separately.
5. Count independent reporting after owner/wire analysis, not URL count.
6. Preserve provider order and grouping if legally received; rerank in a named
   Curiosity stage without overwriting the observation.
7. Surface source, owner, language, geography, time, and viewpoint concentration.
8. Stop on declared time/cost/page/novelty saturation. Search content cannot
   authorize additional calls or expand the research frame.

### 10.3 Opportunity relative to Mojeek News

An owned Curiosity vertical can make the hidden decisions auditable:

- distinguish **newly published**, **newly discovered**, **newly fetched**, and
  **materially changed**;
- choose a cluster lead for originality/evidence quality rather than only
  prominence, and explain why;
- preserve minority/contradictory claims without equating syndicated repetition
  with corroboration;
- expose source-family and wire dependence inside each story cluster;
- propose one bounded follow-up only when a missing primary source, geography,
  clock, or contradiction can change the synthesis.

## 11. Unknowns, negative results, and verification gates

### Material unknowns retained

1. Current source list, count, languages, countries, owners, and admission policy.
2. Feed/crawl/API/licensed/manual contribution and per-item discovery lineage.
3. Relationship, if any, to MojeekBot and the owned general-web index.
4. Absolute publication and modification timestamps and all freshness fallbacks.
5. Current cache contents, horizon, correction/deletion latency, and archive use.
6. Exact/canonical/near-duplicate, syndication, and event-clustering behavior.
7. Lead selection, ordering, source diversity, geography, and recency algorithms.
8. News-specific safety, paywall, spam, malware, takedown, and correction policy.
9. News/image-proxy logging, location processing, subprocessors, and retention.
10. Publisher licenses, image rights, attribution, compensation, and downstream
    reuse rights.
11. News-specific monetization, cost, availability, and roadmap.

### Negative source results

- No News query contract, API, feed, export, pagination, archive, or schema found.
- No stable article, publisher, cluster, story, event, or snapshot ID found.
- No author, canonical URL, license, owner, language, or source-ingestion field.
- No absolute machine-readable publication/fetch/discovery timestamp found.
- No rank score/reason, cluster edge/reason, or duplicate guarantee found.
- No public source catalog, corpus statistics, freshness SLA, or quality audit.
- No basis to transfer Web Search's crawler, host clustering, API, or rank
  signals to News.
- No live quality, latency, freshness, or duplicate test was run.

### Checks before any separately authorized evaluation

- **Vendor/access:** written confirmation of supported News access, automation,
  rate limits, schema/versioning, availability, and termination.
- **Rights:** result storage/citation/evaluation, publisher text/image fetching,
  caching, attribution, derived clusters, and deletion obligations.
- **Privacy:** request/IP/location/image logs, retention, processors, residency,
  DPA, and sensitive-query treatment.
- **Corpus:** source list or auditable sampling frame, ingestion lineage, locale,
  freshness clocks, corrections, and source admission/removal.
- **Evaluation:** preregister events across languages/markets/time; measure event
  recall, timestamp correctness, dead links, duplicate/syndication rates,
  publisher-owner concentration, lead originality, and correction latency.
- **Exit:** provider-independent captures and relations only where rights permit;
  otherwise verified deletion and no production dependency.

## 12. Bounded curiosity pass

After synthesis, in-frame gaps were scored 1–5 on relevance (R), decision value
(V), novelty (N), and cost (C; 5 = expensive). Priority was `R + V + N - C`.
Authority remained limited to public first-party documents and ordinary linked
News/category pages, with no query or automated collection.

| Thread | R | V | N | C | Score | Outcome |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Distinguish browse vertical from query/API | 5 | 5 | 4 | 1 | 13 | **Pursued.** Form target, navigation, product list, and category links establish browse-only public behavior [S1, S8]. |
| Establish whether visible grouping is host or story clustering | 5 | 5 | 5 | 1 | 14 | **Pursued.** Related groups span outlets and can contain same-outlet articles; Web host clustering is a separate product [S1, S9]. |
| Resolve publication/freshness clock | 5 | 5 | 4 | 2 | 12 | **Pursued.** Only relative age is public; no machine timestamp or derivation was found [S1, S2]. |
| Establish News relation to owned web index | 5 | 5 | 5 | 2 | 13 | **Pursued.** First-party sources support independent Web and publisher-added News separately, but no connecting claim; retained as unknown [S2, S3, S7]. |
| Enumerate current publisher source list | 4 | 4 | 3 | 5 | 6 | **CURIOSITY_NO_GO:** no catalog; harvesting dynamic pages would be incomplete, prohibited, and still not establish admission policy. |
| Infer feed/crawl mix from article URLs/timing | 4 | 4 | 4 | 5 | 7 | **CURIOSITY_NO_GO:** output cannot reliably identify ingestion; requires vendor disclosure or authorized instrumentation. |
| Probe cluster/rank thresholds with controlled stories | 3 | 3 | 5 | 5 | 6 | **CURIOSITY_NO_GO:** automated queries prohibited, proprietary behavior unnecessary, and no judged protocol/permission. |
| Determine publisher/image licenses | 5 | 5 | 3 | 5 | 8 | **CURIOSITY_NO_GO:** private contracts and item-level rights review require procurement/legal authority. |
| Reverse engineer HTML/private endpoints | 2 | 1 | 4 | 5 | 2 | **CURIOSITY_NO_GO:** no machine-integration decision, contractual boundary, contamination risk, and low transfer value. |
| Reconstruct every historical News version | 2 | 2 | 2 | 4 | 2 | **CURIOSITY_NO_GO:** current decision saturated; archive archaeology would not resolve present corpus or contracts. |

**Stop reason:** coverage and saturation. The highest-value low-cost
contradictions were resolved: News is current but browse-oriented; it visibly
groups stories but exposes no cluster contract; publisher-source addition is
documented but owned-index lineage is not; freshness is relative display only.
Remaining gaps require permission, contracts, vendor disclosure, or empirical
calls outside the declared authority.

## 13. Fact / inference / recommendation ledger

| ID | Type | Statement | Confidence | Sources | Verdict |
| --- | --- | --- | --- | --- | --- |
| M1 | FACT | Mojeek News is an active public topical vertical with seven current sections. | High | S1 | **ADAPTED** as vertical-interface evidence. |
| M2 | FACT | Its public page is browse-oriented; the search box submits to ordinary Web Search and no News API is offered publicly. | High | S1, S8 | **REJECTED** as machine provider. |
| M3 | FACT | Mojeek historically described News as an aggregator with addable publishers and a cache of older stories. | High | S2 | **ADOPTED** as evidence of a separate source layer, not current mechanism detail. |
| M4 | INFERENCE | News source eligibility is curated, while ingestion method and owned-index relation are unknown. | High / medium on exact mechanism | S2, S3, S7 | **ADAPTED** conceptually. |
| M5 | FACT | Results expose direct URL, title, outlet/section, relative age, image and sometimes snippet. | High | S1 | **ADAPTED** as candidate metadata only. |
| M6 | FACT | No absolute publication/fetch/discovery time or immutable content binding is exposed. | High | S1 | **REJECTED** for evidence provenance. |
| M7 | FACT | Some leads have related articles, including cross-outlet and same-outlet groups. | High | S1 | **ADOPTED** need for explicit story relations independent of host caps. |
| M8 | FACT | No cluster ID/reason, canonical relation, dedup guarantee, score, or rank explanation is exposed. | High | S1 | **REJECTED** as an auditable clustering/ranking contract. |
| M9 | FACT | General policy claims automated, non-personalized ranking, but News-specific application is undocumented. | Medium | S3 | **DEFERRED** pending explicit News policy. |
| M10 | FACT | Mojeek's public privacy policy rejects tracking but retains transformed standard logs indefinitely. | High | S4 | **ADAPTED** privacy intent; **REJECTED** indefinite retention as Curiosity default. |
| M11 | INFERENCE | News is a free audience feature within a business that reports past investment and offers advertising and commercial search products; direct News economics and revenue contribution are unknown. | Medium-high | S1, S5-S8 | **DEFERRED** as a business dependency. |
| M12 | RECOMMENDATION | Curiosity must own captures, named clocks, source identity, reversible copy/event relations, and ranking reasons. | High | Analysis | **ADOPTED**. |
| M13 | RECOMMENDATION | Do not scrape or reconstruct the consumer vertical. | High | S5, S10 | **ADOPTED** clean-room boundary. |

## 14. Primary source ledger

All sources are first-party Mojeek materials accessed **2026-08-17**. Dynamic
News pages prove only access-time presentation. Vendor prose proves published
claims and policies, not production conformance or comparative quality.

| ID | Primary source | Material used |
| --- | --- | --- |
| S1 | [Mojeek News](https://www.mojeek.com/news), [Business](https://www.mojeek.com/news?top=business), and [Technology](https://www.mojeek.com/news?top=technology) | current operation, sections, direct publisher links, related-story presentation, relative ages, snippets/images, form target, location display, missing fields |
| S2 | [“Mojeek News Update,” 2019-11-13](https://blog.mojeek.com/2019/11/mojeek-news-update.html) | aggregator identity, addable sources/publishers, variety goal, categories, UK localization, older-story cache |
| S3 | [Search Content Policy](https://www.mojeek.com/about/content/) | broad automated-ranking/no-personalization claim, index-policy actions, HTML web-index boundary |
| S4 | [Privacy Policy](https://www.mojeek.com/about/privacy/) | cookies, no specific tracking, transformed indefinite logs, aggregate use, outbound-site boundary |
| S5 | [Terms of Service](https://www.mojeek.com/about/terms.html) | ads, automation/scraping limits, change/availability, content and IP disclaimers |
| S6 | [Mojeek Ads](https://www.mojeek.com/ads/) | invite-only contextual category/keyword/country advertising |
| S7 | [Team and Technology](https://www.mojeek.com/about/technology.html) | independent general-web stack, investment history, index milestones; used only to prevent false transfer to News |
| S8 | [Preferences](https://www.mojeek.com/preferences?tab=location-language) and [Web Search API](https://www.mojeek.com/services/search/web-search-api/) | location/language controls, News-on-Web preference, commercial product boundary, absence of public News API offer |
| S9 | [“Clustering — How Mojeek Gives You More Variety,” 2024-07-16](https://blog.mojeek.com/2024/07/clustering-how-mojeek-gives-you-more-variety.html) | Web host-clustering semantics; used only as a non-transfer boundary |
| S10 | [Mojeek robots.txt](https://www.mojeek.com/robots.txt) | crawl directives; not treated as permission to scrape or reuse News |

## 15. Verification record

- Read the repository constitution before research and changed only this file.
- Confirmed the current News landing/category structure directly from first-party
  rendered text and public HTML, without submitting a search query.
- Cross-read current News, historical News lineage, general content policy,
  privacy, terms, products, preferences, ads, technology, and Web clustering.
- Kept product claims separate: owned Web index is not attributed to News;
  Web host clustering is not attributed to News story grouping; Web API rights
  are not attributed to the consumer vertical.
- Preserved material negative findings on source lists, ingestion, timestamps,
  clusters, deduplication, ranking, API/export, rights, privacy details, and
  economics instead of filling them with inference.
- No credentials, API calls, automated queries, publisher fetches, live tests,
  scraping, code inspection, implementation, deployment, or edits outside
  `docs/research/products/mojeek-news.md` were performed.
