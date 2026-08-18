# Mojeek Substack Search: standalone vertical study

**Research and primary-source access date:** 2026-08-17  
**Surface:** the public Mojeek **Substack** vertical at
`https://www.mojeek.com/blogs` and the search mode to which its form submits.  
**Status:** clean-room product research, not an implementation, endorsement,
benchmark, legal opinion, or authorization to query or automate the service.

## Executive verdict

**ADAPTED as a narrow-corpus discovery pattern; REJECTED as a Curiosity corpus,
evidence, or provider dependency (high confidence).** Mojeek launched this
consumer search vertical on 2023-06-29 and still exposes it in the current site
navigation. Its live landing page calls itself “Substack Search,” accepts a
maximum 256-character query, and submits a GET to the ordinary `/search` route
with hidden mode values `fmt=sst` and `sst=1` [S1, S2]. That proves a current,
server-selected Substack result mode. It does **not** prove a physically separate
index, complete Substack coverage, a public source registry, an API contract, or
an affiliation with Substack.

The strongest corpus statement remains the launch post's imprecise promise to
search content from a “very wide range” of Substack writers [S1]. A first-party
launch screenshot showed ordinary page-like results from `*.substack.com`, a
result date, host clustering, and 2,425 matches for one historical query. Mojeek
said those results were ranked by relevance and authority [S1]. Current general
Mojeek material establishes an independently crawled, HTML-only web index and a
ranker that combines keyword, semantic, and hyperlink-authority signals
[S3-S7]. The narrowest supportable architecture inference is therefore a
**Substack-eligible projection over Mojeek's web corpus and retrieval stack**,
not a separate newsletter index. Eligibility discovery, source-list maintenance,
custom-domain recognition, and vertical-specific ranking remain unknown.

The surface is useful as product evidence: a low-friction vertical can make a
platform-distributed body of independent writing easier to discover, while host
clustering broadens publication diversity. It is not sufficient research
infrastructure. Public output evidence does not expose publication identity,
author, platform/custom-domain lineage, feed or crawl origin, canonical or
syndication edges, paid/public availability, stable document ID, immutable
capture, content hash, passage anchor, rank reason, or timestamp derivation.

No live query was made. That boundary is material: Mojeek's Terms prohibit
automated service access except for authorized API users and prohibit scraping,
while no public Substack-search API was found [S8-S10]. Substack's current Terms
also prohibit crawling/scraping and storing a significant portion of its
content, even though its current `robots.txt` leaves ordinary public post paths
generally crawlable [S15, S16]. Robots permission is not a content license or a
contractual grant. Any Curiosity newsletter corpus must have its own documented
discovery authority and publisher-level rights, not imitate an opaque vendor
list or ingest Mojeek results.

## 1. Decision frame, bounded questions, and method

### Decision

What does Mojeek's Substack-only consumer search demonstrate about a standalone
publication vertical, and which observable ideas can Curiosity safely adopt
while owning corpus policy, captures, ranking, provenance, and bounded research
behavior?

### Bounded sub-questions

1. Is the vertical still offered, and what public request surface exists?
2. What evidence establishes its corpus, discovery path, and relation to
   Mojeek's general index?
3. What is known about eligibility, completeness, ranking, diversity, and
   freshness?
4. What does a result prove about a writer, publication, post, time, and source?
5. Which Mojeek and Substack privacy, access, copyright, and automation terms
   bound use?
6. Is there a product-specific price or monetization model?
7. Which lessons transfer clean-room, and what should Curiosity do differently?

### Evidence discipline and access boundary

- **FACT** means directly stated or visibly encoded in a cited first-party
  source. Vendor architecture and quality claims are self-attested unless noted.
- **INFERENCE** is the narrowest conclusion consistent with cited facts; it is
  not observed internals.
- **RECOMMENDATION** is an independently authored Curiosity decision.
- Confidence is **high**, **medium**, or **low** for the statement as scoped.
- Current public product pages, policies, documentation, `robots.txt`, an
  official launch image, and Mojeek's public Focus repository were read. No
  credential, subscription, private endpoint, source code, search request,
  result scraping, rank probing, bulk crawl, access-control bypass, or retained
  service output was used.
- The launch screenshot is historical product evidence, not a current
  measurement. General-web documentation is used only to bound plausible
  lineage; vertical behavior is not silently equated with the general API.

**Research budget and stop condition:** cover each requested category with
current primary evidence, triangulate material architecture claims, preserve
negative findings, and stop when remaining gaps require live queries,
contractual access, publisher crawling, or proprietary internals.

## 2. Product boundary and current status

### 2.1 What is currently observable

**FACT (high):** the vertical launched on 2023-06-29. Mojeek described it as
“Substack content search” across a “very wide range” of writers and said results
were ranked by relevance and authority [S1].

**FACT (high):** on 2026-08-17, `/blogs` returned a dedicated landing page with:

- title `Substack Search | Mojeek`;
- description `Search for Substack articles on Mojeek`;
- placeholder `Search for Substack articles...`;
- tagline `Independent results for independent writers`;
- a 256-character input;
- an unauthenticated GET form targeting `/search` with `q`, `fmt=sst`, and
  `sst=1`;
- canonical URL `https://www.mojeek.com/blogs`; and
- `<meta name="referrer" content="origin">` [S2].

**FACT (high):** Substack remains a top-level search choice in Mojeek's current
site menu alongside Web, Images, and News [S2-S10]. The main Products catalog,
however, lists Ads, Focus, Web Search API, Site Search API, and search boxes—not
Substack Search [S2].

**INFERENCE (high):** this is a currently exposed, free-to-enter **consumer
vertical**, not a separately sold product. The `sst` values are a server-side
mode selector; they reveal no corpus implementation.

### 2.2 Important product separations

Do not conflate:

- the public Substack vertical (`/blogs` -> `/search?...&fmt=sst&sst=1`);
- general Mojeek Web Search and its paid API;
- user-authored Mojeek Focus site sets;
- Mojeek News;
- Substack's own app, discovery, feeds, search, or publisher subscriptions.

No public source reviewed calls the Substack vertical a Focus, exposes its
eligibility list as a Focus template, or promises it through the Web Search API.
The current official Focus repository tree contains no Substack template
[S12]. Conversely, absence from that repository does not prove a different
backend; Mojeek could maintain a private list or classifier.

## 3. Corpus, discovery, and index evidence

### 3.1 Evidence chain

| Claim | Primary evidence | Assessment |
| --- | --- | --- |
| Search targets Substack articles | Current title, description, placeholder, hidden `sst` mode, and menu label [S2]. | **FACT (high).** Product intent, not a coverage guarantee. |
| A broad writer set was intended | Launch says a “very wide range of Substack writers” [S1]. | **FACT, self-attested (high for wording; low for measurable breadth).** No count or list. |
| Post pages, not merely publication homepages, were returned | Launch screenshot shows `/p/` post URLs, titles, snippets, dates, and `*.substack.com` hosts [S1]. | **FACT (high) for the 2023 example only.** |
| Candidates plausibly originate in Mojeek's owned crawl/index | Mojeek says it owns its crawler/index/search stack, indexes HTML, and exposes the vertical through ordinary `/search` [S2-S5]. | **INFERENCE (medium-high).** Coherent lineage, but no vertical-specific architecture statement. |
| The vertical has a separate physical index | No first-party statement found. | **UNKNOWN / negative result.** `fmt=sst` does not prove storage topology. |
| Every eligible publication is included | No source list, count, coverage report, admission rule, or guarantee found. | **UNKNOWN (high-confidence gap).** |
| Substack authorized Mojeek or supplies a feed/API | No partnership, license, feed, API, or affiliation statement found. | **UNKNOWN / negative result.** Do not infer authorization from availability. |

### 3.2 General-index lineage

**FACT (high, self-attested):** Mojeek says its crawler and search technology
were built in-house, its IP is owned by Mojeek Limited, and its servers are
owned/managed infrastructure. Its current history claims more than nine billion
pages in 2025 [S3].

**FACT (high):** Mojeek's content policy says its index contains only HTML
webpages, not images or video. Common reasons for missing pages include recency,
robots/meta blocking, and text predominantly rendered with JavaScript [S4].
MojeekBot says it obeys robots exclusions and `noindex`, `nocache`, and
`nofollow`, with a nominal ceiling of one request per site per second [S5].

**FACT (high):** Substack's current `robots.txt` disallows private feeds,
subscribe and interaction routes, but does not generally disallow ordinary
public `/p/` pages; it declares general and news sitemaps [S15]. This is
discovery evidence only. It does not establish that Mojeek uses those sitemaps,
that a specific publisher permits indexing, or that custom domains share these
rules.

**INFERENCE (medium-high):** the minimum plausible pipeline is:

```text
public-web discovery (links and possibly sitemaps; exact inputs unknown)
  -> MojeekBot fetches indexable HTML under per-host robots/meta policy
  -> ordinary Mojeek web document/index representation
  -> undocumented Substack eligibility selection
     (host/path rule, publication registry, page classifier, or mixture)
  -> ordinary or adapted relevance/authority ranker
  -> host-clustered Substack results
```

This reconstruction explains the public evidence with the fewest assumptions.
Every box after HTML indexing remains implementation-unknown for this vertical.

### 3.3 Corpus boundary and discovery unknowns

No public answer was found for:

1. current indexed post, publication, host, writer, language, or country count;
2. whether only `*.substack.com` is eligible or recognized custom domains are
   included;
3. how a custom-domain publication is identified as Substack-backed;
4. whether newsletters that migrated away from Substack remain, disappear, or
   are relabeled;
5. sitemap, RSS/Atom, link-crawl, platform API, submitted-list, or curated-list
   contribution;
6. public versus paywalled-preview treatment and whether subscriber-only text is
   ever indexed (no evidence says it is);
7. handling of podcasts, videos, Notes, comments, author/profile pages,
   publication homepages, archives, translations, and deleted posts;
8. canonicalization across `substack.com`, publication subdomains, custom
   domains, email/web variants, redirects, AMP-like copies, or syndication;
9. robots change propagation, deindex latency, recrawl schedules, and tombstones;
10. spam, impersonation, abandoned publication, and platform-membership checks.

**RECOMMENDATION (high):** never describe the corpus as “all Substack,” “the
Substack index,” or even “current Substack posts.” The defensible label is
“Mojeek-selected Substack article results,” with an explicit unknown-coverage
warning.

## 4. Request and result surface

### 4.1 Public request

The landing page publicly documents only the HTML form behavior:

```text
GET https://www.mojeek.com/search
  ?q=<up to 256 characters>
  &fmt=sst
  &sst=1
```

**FACT (high):** the query is placed in a URL via GET [S2]. **UNKNOWN:** word
limit, operators, pagination, Safe Search, locale, clustering preferences,
spelling, date restrictions, response byte limits, errors, throttling, or
whether changing/omitting either hidden value has stable semantics. General
Mojeek controls exist, but no vertical contract was found.

**RECOMMENDATION (high):** treat `fmt=sst` and `sst=1` as undocumented consumer
UI details, not an integration contract. Mojeek expressly bars automated access
except authorized API users [S8], and the public API offer does not document an
`sst` vertical [S10].

### 4.2 Historical result evidence

The launch screenshot for query `generative ai` showed:

- “Results 1 to 10 from 2,425 in 0.09s”;
- post URLs on two distinct `*.substack.com` hosts;
- URL/breadcrumb, date-time, blue title, query-emphasized snippet;
- “See more results from [host]” links [S1].

These are **FACTS (high) about the launch screenshot**, not a reproduced query
or a guarantee that current output, counts, timing, date semantics, or host
clustering are unchanged.

The screenshot is still architecturally informative:

- the object ranked was a webpage/post URL;
- result count was query-relative, not corpus size;
- host-level grouping was visible;
- date and snippet were display metadata, not evidence anchors.

### 4.3 No public machine contract

**Negative result (high confidence):** no dedicated Substack API endpoint,
schema, version, documented pagination, stable result ID, error taxonomy, rate
limit, service-level objective, export, feed, corpus dump, or paid plan was
found. The general Search API returns URL/title/query-dependent snippet and
optional metadata, but it does not advertise this vertical [S6, S7, S10].

## 5. Ranking, clustering, and freshness

### 5.1 What is directly established

**FACT (high):** the 2023 launch says Substack results are “ranked by relevance
and authority” [S1]. That is the only vertical-specific ranking description
found.

**FACT (high):** current general Mojeek ranking material says its ranking uses
keyword matching, semantic matching, hyperlink authority (“Gravity”), and
chosen language/location settings; it says it does not use personalisation or
click data and does not manually rerank particular result sets outside stated
legal/malware/spam actions [S4, S13]. The scoring docs currently define separate
overall, keyword, English-only semantic, authority, and phrase signals [S6].

**FACT (high):** Mojeek's default general-web clustering is one result per host,
with a “See more results” path and user-selectable caps [S14]. This matches the
launch screenshot's host links [S1].

### 5.2 Safe inference and non-transfer

**INFERENCE (medium):** vertical ranking likely reuses substantial Mojeek
retrieval/ranking machinery. The shared `/search` route, familiar result layout,
host clustering, and launch phrase “relevance and authority” all support reuse.

**UNKNOWN:** whether the current Substack mode uses semantic embeddings, the
same feature weights, a vertical prior, recency boost, publication-authority
score, platform-specific spam rules, language/location boosts, or a distinct
candidate generator. General-web scoring documentation cannot establish any of
those vertical details.

**RECOMMENDATION (high):** separate these concepts in Curiosity:

1. platform/publication/post **eligibility**;
2. lexical/semantic **retrieval relevance**;
3. page/publication **authority evidence**;
4. host, owner, author, and viewpoint **diversity**;
5. temporal **freshness**;
6. source independence and claim **corroboration**.

A hyperlink-authority score must not silently become writer credibility or
factual truth. Substack publications commonly interlink, quote, syndicate, and
share authors; URL diversity does not establish independent evidence.

### 5.3 Freshness

**FACT (high):** the launch screenshot displayed date-times beside results [S1].
General Mojeek operators define `since:` and `before:` against last-modified
time, and the general API can expose modified, publication-like, and crawl dates
[S7, S11].

**UNKNOWN / negative result:** no vertical source defines the screenshot's date,
derivation, timezone, confidence, update behavior, or whether a date filter is
supported. No crawl-to-index latency, recrawl distribution, deletion latency,
freshness sorting, breaking-content promise, or freshness SLA was found.

**INFERENCE (high):** displayed dates can help discovery but cannot support a
claim that a post was published or materially updated then. Curiosity needs
separate clocks:

```text
publisher_claimed_published_at?
publisher_claimed_modified_at?
feed_observed_at?
first_discovered_at
last_fetched_at
indexed_at
deleted_or_unavailable_observed_at?
```

Each value needs origin, raw representation, derivation, confidence, and the
capture/document version to which it applies.

## 6. Provenance and evidence quality

### 6.1 What the surface can establish

A Mojeek result can at most establish that, at an observation time, Mojeek
ranked a URL as matching a query in its Substack mode. Title, snippet, date, and
host are provider assertions and untrusted external data.

### 6.2 What is missing

No reviewed source documents a result-level:

- publication ID/name, verified author/byline, or publisher entity;
- proof that a custom domain is/was hosted by Substack;
- feed, crawler, sitemap, or submitted-list discovery lineage;
- requested, resolved, final, canonical, and platform URL chain;
- stable post/document/version ID or content hash;
- full capture, exact supporting passage, offsets, or DOM anchor;
- public/free/preview/paid visibility state at indexing time;
- publication/modification/fetch/index clock with derivation;
- language, category, license, or rights statement;
- duplicate, repost, syndication, quotation, translation, or same-claim edge;
- rank score/reason, eligibility reason, exclusion reason, or coverage warning.

**INFERENCE (high):** the vertical is a discovery aid, not a citation or archive
system. A query-dependent snippet can be truncated, assembled, stale, or
context-poor. A URL can later redirect, become paywalled, change ownership, or
disappear.

**RECOMMENDATION (high):** Curiosity should model newsletter evidence as:

```text
PublicationIdentity
  platform_claim? + custom_domain_claim? + observed_host
  owner/author claims[] + supporting observations + confidence

PostCandidate
  provider observation + provider rank
  requested/resolved/canonical/platform URLs
  title/snippet/date claims as raw untrusted fields

OwnedEvidence (only when fetch and storage are authorized)
  capture_id + content_hash + fetched_at
  publication/modified claims + derivation
  passage offsets/DOM anchor
  access_state + rights_basis
  exact-copy/syndication/translation/claim edges
```

Platform identity and authorship must remain evidence-backed claims, not be
derived solely from a hostname or display title.

## 7. Privacy, access terms, and content rights

### 7.1 Mojeek query privacy

**FACT (high, policy claim):** Mojeek says it performs no specific user tracking,
sets no cookies by default without agreement, and replaces IP addresses in
indefinitely kept standard logs with a two-letter country code. Logs retain
time, requested page, possible referral data, and separately browser data;
aggregate non-personal search data may improve results [S9].

**FACT (high):** the Substack search form uses GET, so the query is part of the
Mojeek URL. The landing page sets a referrer policy of `origin`, which is designed
to prevent the full query URL from being sent as an ordinary referrer to a
clicked destination [S2].

**Boundary (high):** policy claims do not prevent the URL from appearing in
local browser history, copied links, screenshots, intermediary/device logs, or
other user-controlled surfaces. The privacy policy was last updated 2022-02-02
and gives no Substack-vertical-specific query schema, retention period, access
controls, independent audit, deletion process, or sensitive-query treatment.
Mojeek itself acknowledged that users cannot independently verify its privacy
implementation and ultimately must trust the company [S17].

**FACT (high):** following a result leaves Mojeek. Mojeek's policy says its
privacy policy no longer applies on linked third-party sites [S9]. Substack's
current policy describes collection of IP/device information, first- and
third-party analytics cookies, personalization, optional creator cookies, and
no support for browser Do Not Track; creators may also apply their own privacy
practices [S19]. A custom-domain destination may add a distinct publisher policy.

**RECOMMENDATION (high):** distinguish private-ish *query submission* from
private *source reading*. An outbound click is a new disclosure event. Curiosity
should show the destination host/platform, avoid tracking redirectors, preserve
the origin-only referrer posture, and never promise that Mojeek's no-tracking
policy follows the user to a result page.

### 7.2 Mojeek access and service terms

**FACT (high):** Mojeek's general Terms apply to its websites and other owned
URLs. They allow service changes/interruption, permit ads and partners, prohibit
automated access unless the user is an authorized Mojeek API user, and prohibit
scraping without prior consent [S8]. Search content is described as a direct
representation of public-web information and is provided as-is without quality
or availability guarantees.

**INFERENCE (high):** there is no public contractual route to automate the
Substack consumer vertical. General API authorization is not evidence that the
undocumented `sst` UI mode is authorized through that API.

### 7.3 Substack and publisher rights

**FACT (high):** Substack's current Terms say creators retain ownership of their
posts. Public-post licenses described there run to Substack and to users only as
permitted by Substack functionality. The Terms prohibit crawling/scraping any
page or data, copying/storing a significant portion of content, and reverse
engineering underlying ideas/source [S16].

**FACT (high):** current Substack `robots.txt` permits ordinary public post paths
for the wildcard crawler while blocking private/action paths and advertising
sitemaps [S15].

**INFERENCE (high):** robots accessibility and public availability do not grant
copyright, database, contract, redistribution, training, or archival rights.
The relationship between Mojeek and Substack/publishers is not public in the
reviewed sources; no conclusion about authorization or breach is supportable.

**RECOMMENDATION (high):** before any Curiosity newsletter crawling:

1. define whether discovery comes from publisher-submitted feeds, direct
   publisher permission, a platform agreement, or independently lawful public
   crawl;
2. evaluate platform and per-publication terms separately;
3. obey robots/meta and access controls but never treat them as the whole rights
   analysis;
4. exclude private, paid-only, email-only, and authenticated content unless an
   explicit agreement covers it;
5. retain rights basis, attribution, takedown, recrawl, and deletion state per
   document; and
6. do not seed a corpus from Mojeek result pages or infer a hidden source list.

## 8. Business model and incentives

### 8.1 Vertical-specific evidence

**FACT (high):** `/blogs` is publicly accessible without sign-up and displays no
price, subscription tier, API offer, or publisher placement program on its
landing page [S2]. No Substack-search-specific paid plan, sponsorship, affiliate
relationship, revenue share, inclusion fee, or data license was found.

**FACT (medium):** the current landing markup contains a Web Monetization
payment pointer meta tag [S2]. This shows markup, not that a compatible payment
stream is active, used, material, or specific to the vertical.

### 8.2 Company-level context, not vertical attribution

**FACT (high):** Mojeek currently sells a Web Search API on usage-based plans
and runs an invite-only contextual ads program using category, keyword, and
country targeting without user tracking [S10, S18]. Its Terms permit ads on
Services [S8].

**INFERENCE (high):** the Substack vertical is best treated as a free consumer
feature within Mojeek's broader traffic, API, partnership, and contextual-ad
business—not as a proven standalone revenue line. Search referral traffic may
benefit writers, but no payment, ranking preference, or attribution arrangement
is documented.

**RECOMMENDATION (high):** Curiosity should disclose commercial influence at
the result and rank-policy level. Inclusion, rank, sponsorship, and advertising
must be separate fields and stages. A writer-focused corpus should not rank by
subscription conversion, affiliate revenue, or paid placement unless the caller
explicitly chooses a labeled commercial mode.

## 9. Clean-room architecture lessons

No Mojeek or Substack code, hidden source registry, output corpus, ranking
formula, or private interface is transferred. Public product behavior supports
requirements and tests; implementation must be independently designed.

| Observable clue | Safe independent lesson | Boundary |
| --- | --- | --- |
| Dedicated `sst` mode over ordinary `/search` [S2] | a vertical can be an explicit eligibility/policy layer over shared retrieval | do not copy parameter names or assume backend topology |
| “Very wide range” without a registry [S1] | corpus claims need measurable coverage and versioned membership | do not infer or reconstruct Mojeek's list |
| Post URLs and snippets [S1] | rank documents/posts, not only publication homepages | snippets are not evidence captures |
| Relevance plus authority [S1] | keep query relevance and query-independent reputation separable | authority is not truth or author credibility |
| Host clustering [S1, S14] | prevent one publication host from monopolizing a page | custom domains and publisher families defeat host-only diversity |
| Independent crawl/index lineage [S3-S5] | vertical ownership starts with discovery and capture authority | hosted results do not transfer ownership |
| HTML-only corpus [S4] | begin with a bounded public-text lane | podcast/video/email/paywalled blindness must be explicit |
| GET query and origin referrer [S2] | minimize downstream referrer leakage and query retention | URL queries still leak locally/intermediately |
| No public vertical API | consumer UI and provider contracts must remain separate | never automate undocumented UI parameters |
| Platform terms/robots tension [S15, S16] | model technical permission, contract, and copyright independently | robots allow is not a license |

## 10. Exact implications for Curiosity

### 10.1 Adopted and adapted design

1. **ADOPT a first-class vertical policy object.** Newsletter search should not
   be `site:substack.com` text hidden in a query. Record eligible platform,
   publication registry version, content types, public-access rule, language,
   time basis, and rights policy.
2. **ADAPT host clustering into publication and owner diversity.** Group both
   `name.substack.com` and verified custom domains under one publication, then
   optionally group publications under shared ownership. Preserve all raw
   candidates and make suppression reversible.
3. **ADOPT post-level retrieval with publication-level navigation.** Search
   individual posts, but expose publication identity and “more from this
   publication” as an explicit secondary retrieval action within the caller's
   budget.
4. **ADAPT relevance/authority separation.** Lexical and optional semantic match
   remain query evidence. Link authority, publication tenure, authorship, source
   independence, and factual support are distinct signals with explanations.
5. **ADOPT multiple clocks.** Never collapse publication, modification, feed
   observation, fetch, and index times into one displayed date.
6. **ADOPT independent, immutable provenance.** Search candidates are not
   citable until an authorized capture binds bytes, hash, timestamp, and passage.
7. **ADOPT explicit coverage accounting.** Report registered publications,
   successfully fetched public feeds/hosts, indexed posts, stale sources,
   removals, language distribution, and unknown/missing segments.
8. **ADAPT the privacy posture.** Avoid behavioral/click ranking by default;
   minimize and purpose-limit query logs; use POST or equivalent non-URL query
   transport for APIs; prevent full-query referrer leakage; document retention.

### 10.2 Rejected patterns

- **REJECT** Mojeek Substack Search as an owned-corpus foundation: the corpus,
  membership, captures, rank, and provenance remain vendor-controlled.
- **REJECT** `*.substack.com` as a complete eligibility rule: custom domains,
  migrations, impersonation, and non-post platform surfaces make it incorrect.
- **REJECT** platform membership as quality or independence evidence.
- **REJECT** host count as source diversity: one writer may use several domains,
  and one owner or syndication source may span many publications.
- **REJECT** displayed date as verified publication time.
- **REJECT** consumer-result automation, hidden-parameter dependence, and
  result-page scraping.
- **REJECT** copying/storing public posts merely because robots permits crawling.
- **REJECT** a flat “duplicate” flag: exact copies, revisions, quoted excerpts,
  syndications, translations, and same-topic independent writing differ.

### 10.3 Provider-neutral conceptual contract

This is a requirements sketch, not implementation authorization:

```text
NewsletterSearchRequest
  query
  vertical_policy_id + registry_version
  publications?/authors?/platforms?
  content_languages[]
  time_constraint { clock, start?, end? }
  access_policy = public_only
  page_size + result_budget + time_budget + cost_budget
  diversity_policy_id

RetrievalTrace
  original/normalized/executed query
  eligibility policy + registry snapshot
  requested/effective/unsupported controls
  candidate stage + raw rank + rerank reasons
  coverage/staleness warnings + stop reason

NewsletterCandidate
  publication_claim + author_claims[]
  requested/resolved/canonical/platform URLs
  title/snippet/date claims (raw, untrusted)
  discovery lineage + provider observation time
  access-state claim + rights status
```

Search output never authorizes fetching, subscribing, emailing, purchasing, or
opening authenticated content. Those remain separately reviewed actions.

## 11. Bounded curiosity behavior for newsletter research

1. Use the caller-declared subject, platforms/publications, languages, time
   window, and result budget.
2. Preserve original candidates and selection/rank provenance.
3. Normalize publication identity without erasing platform/custom-domain
   observations.
4. Fetch only under explicit authority; build passage evidence before citation.
5. Distinguish copies, quotations, shared wire/source material, and independent
   reporting before counting corroboration.
6. Surface publication/author/owner concentration, stale sources, inaccessible
   posts, and conflicting dates.
7. Synthesize first. Score only in-frame gaps and contradictions by relevance,
   decision value, novelty, and cost.
8. Execute follow-up only with caller authority and remaining budget; otherwise
   record `CURIOSITY_NO_GO`.

Useful curiosity branches include:

- a **registry-gap branch** when a known publication or custom domain has no
  fresh observations;
- a **copy-independence branch** when many URLs repeat one source;
- an **author-identity branch** when byline/platform/profile claims conflict;
- a **temporal branch** when feed, page, and observed dates disagree; and
- a **platform-diversity branch** when the question would benefit from comparing
  Substack writing with independent blogs or primary institutional sources.

Novelty alone is not enough. A new newsletter post must be capable of changing
the synthesis and pass source/rights/relevance gates.

## 12. Verdict ledger

| ID | Type | Claim / decision | Confidence | Sources | Verdict |
| --- | --- | --- | --- | --- | --- |
| M1 | FACT | Mojeek launched Substack content search on 2023-06-29. | High | [S1] | **ADOPTED** as historical product boundary. |
| M2 | FACT | The vertical remains linked and its landing page submits `q`, `fmt=sst`, `sst=1` to `/search`. | High | [S2] | **ADAPTED** as explicit vertical-mode evidence only. |
| M3 | FACT | Launch copy claims a “very wide range,” but no measurable corpus definition is published. | High | [S1] | **REJECTED** as a coverage claim. |
| M4 | INFERENCE | It is most plausibly an eligibility projection over Mojeek's owned web index/ranker. | Medium-high | [S1-S5] | **ADAPTED** as conceptual layering, not topology. |
| M5 | FACT | No dedicated index, source registry, API, schema, or SLA was found. | High | Source set | **REJECTED** as an integration contract. |
| M6 | FACT | Vertical ranking was described as relevance plus authority. | High | [S1] | **ADAPTED** into separately explained feature classes. |
| M7 | FACT | Historical output used host clustering and displayed dates. | High historically | [S1] | **ADAPTED** to publication/owner diversity and typed clocks. |
| M8 | INFERENCE | Result metadata is discovery evidence, not publication/authorship/time proof. | High | [S1, S7] | **ADOPTED** as trust boundary. |
| M9 | FACT | Mojeek says it does not track users or record IPs, but keeps reduced logs indefinitely. | High for policy claim | [S9, S17] | **ADAPTED**; require explicit current retention controls and audit. |
| M10 | FACT | Mojeek forbids unauthorized automated access and scraping. | High | [S8] | **REJECTED** consumer automation. |
| M11 | FACT | Substack public-post paths are generally robots-accessible, while its Terms prohibit crawl/scrape and significant storage. | High | [S15, S16] | **ADOPTED** need to separate technical and legal authority. |
| M12 | FACT | Creators retain ownership of Substack posts. | High | [S16] | **REJECTED** any inferred corpus/content license. |
| M13 | FACT | No vertical-specific price or revenue arrangement was found. | High | [S2, S8-S10, S18] | **DEFERRED** business attribution. |
| M14 | RECOMMENDATION | Curiosity should own a versioned publication registry, authorized captures, identity edges, clocks, and rights provenance. | High | Analysis | **ADOPTED**. |
| M15 | RECOMMENDATION | Mojeek Substack results should not seed, benchmark, or serve an owned corpus without explicit rights and a reviewed evaluation. | High | Terms/evidence analysis | **REJECTED/DEFERRED**. |

## 13. Unknowns, negative results, and checks

### Material unknowns

1. Current corpus size and publication/post/host coverage.
2. Eligibility rule and source-list ownership/versioning.
3. Custom-domain detection and migration handling.
4. Discovery contribution from crawl, sitemap, feed, submission, curation, or
   agreement.
5. Physical/logical relation to the general index.
6. Vertical-specific retrieval and ranking features, weights, and evaluation.
7. Freshness clock, recrawl/index latency, date extraction, and deletion delay.
8. Canonicalization, revision, duplicate, syndication, translation, and author
   identity handling.
9. Paywall/preview, podcast/video/Notes/comments, language, and safety policy.
10. Mojeek-Substack or publisher contractual/licensing relationship.
11. Current result shape, pagination, operators, errors, limits, and availability.
12. Vertical query-log access, retention, audit, and deletion beyond the general
    2022 privacy policy.
13. Ads or other monetization actually shown on vertical result pages and any
    resulting ranking separation.

### Negative results retained

- No dedicated Substack product page beyond the landing page and launch post.
- No public Substack-search API or documented API vertical parameter.
- No source registry, corpus statistics, coverage audit, or update log.
- No public Focus template corresponding to the vertical in the current official
  repository tree [S12].
- No stable post/result/publication/author/version identifier documented.
- No result-level platform lineage, authorship evidence, canonical edge, content
  hash, passage anchor, rights field, or rank explanation documented.
- No vertical-specific freshness, availability, latency, quality, or deletion
  SLA found.
- No public affiliation, feed supply, license, revenue-share, or publisher opt-in
  process found.
- No live result quality, freshness, count, clustering, safety, or error behavior
  was tested.

### Gates before any separately authorized evaluation

- **Mojeek permission/contract:** written authorization for the exact vertical,
  query method, output retention, benchmarking, publication, and automated use.
- **Publisher/platform rights:** documented basis for any follow-on page/feed
  fetch, storage, quotation, archive, extraction, and deletion.
- **Pre-registered study:** fixed publication/language/time strata, custom-domain
  cases, public/paywall cases, migrated/deleted posts, and relevance judgments.
- **Metrics:** registry coverage, post recall, date correctness, staleness,
  canonical duplication, author/publication/owner diversity, syndication rate,
  ranking quality, paging stability, latency/errors, and policy exclusions.
- **Data minimization:** non-sensitive test queries, no credentials/private text,
  minimal retained output, and a deletion plan.
- **Stop:** fixed query/request/time/cost caps; no result-page fetching unless
  separately authorized.

## 14. Bounded curiosity pass

Remaining in-frame threads were scored 1-5 for relevance (R), decision value
(V), novelty (N), and cost/risk (C; 5 is expensive). Priority heuristic:
`R + V + N - C`. Caller authority covered public documentation only; no live
search or publisher crawling.

| Thread | R | V | N | C | Score | Outcome |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Establish whether the vertical is still live and how it selects mode | 5 | 5 | 4 | 1 | 13 | **Pursued.** Current navigation, landing metadata, form action, bounds, and hidden `sst` values confirm an active consumer mode [S2]. |
| Determine separate-index versus filtered-view evidence | 5 | 5 | 5 | 2 | 13 | **Pursued.** Launch, owned-index, HTML policy, route, Focus, and repository evidence support only a filtered/projection inference; topology remains unknown [S1-S5, S12]. |
| Recover corpus size/source registry | 5 | 5 | 5 | 5 | 10 | **CURIOSITY_NO_GO.** No public registry/count; live enumeration would violate scope, remain incomplete, and risk terms. |
| Clarify ranking and clustering lineage | 5 | 4 | 4 | 1 | 12 | **Pursued.** Vertical-specific “relevance and authority” and historical host clustering were triangulated with current general ranking/clustering docs; exact transfer remains unknown [S1, S6, S13, S14]. |
| Resolve date/freshness semantics | 5 | 5 | 4 | 3 | 11 | **Pursued to public saturation.** Screenshot date and general date docs exist, but no vertical clock definition or SLA was found [S1, S7, S11]. |
| Determine crawler authorization from robots and terms | 5 | 5 | 5 | 2 | 13 | **Pursued.** Robots permits many public paths while current Terms prohibit crawling; relationship remains unknown, so no license inference is allowed [S15, S16]. |
| Run current sample queries and perturb hidden parameters | 4 | 4 | 4 | 5 | 7 | **CURIOSITY_NO_GO.** Explicitly prohibited by caller; consumer automation and rank probing are unnecessary for architecture lessons. |
| Identify Mojeek's hidden publication list from outputs | 4 | 3 | 5 | 5 | 7 | **CURIOSITY_NO_GO.** Would reconstruct proprietary corpus policy from service output, produce weak completeness evidence, and cross access boundaries. |
| Crawl Substack sitemap/posts to compare recall | 5 | 5 | 4 | 5 | 9 | **CURIOSITY_NO_GO.** No authority; Substack Terms and content rights require separate review. |
| Prove active Web Monetization revenue | 2 | 2 | 4 | 4 | 4 | **CURIOSITY_NO_GO.** A meta pointer is insufficient; payment/account testing is outside scope and immaterial to architecture. |
| Inspect proprietary scripts/ranking code | 2 | 1 | 4 | 5 | 2 | **CURIOSITY_NO_GO.** Clean-room boundary, terms risk, and no decision value. |

**Stop reason:** coverage and source saturation. The highest-value public threads
established current status, bounded architecture lineage, ranking claims,
rights tension, and product limitations. Remaining material uncertainties need
Mojeek/Substack/publisher authority, live evaluation, contracts, or proprietary
information.

## 15. Sources

All sources were accessed **2026-08-17**. Mojeek and Substack sources are primary
for their own products, policies, code-adjacent public artifacts, and claims;
they are not independent quality or compliance audits.

- **[S1]** Mojeek Blog, “Search Content from Substack’s Independent Writers,”
  2023-06-29, including first-party launch screenshot.
  https://blog.mojeek.com/2023/06/search-content-from-substacks-independent-writers.html
- **[S2]** Mojeek, “Substack Search” landing page and public HTML.
  https://www.mojeek.com/blogs
- **[S3]** Mojeek, “Team and Technology.”
  https://www.mojeek.com/about/technology.html
- **[S4]** Mojeek, “Search Content Policy.”
  https://www.mojeek.com/about/content/
- **[S5]** Mojeek, “MojeekBot.” https://www.mojeek.com/bot.html
- **[S6]** Mojeek, “Scorings in the Mojeek API.”
  https://www.mojeek.com/support/api/search/results_scoring.html
- **[S7]** Mojeek, “Search API JSON Response Format.”
  https://www.mojeek.com/support/api/search/json_response.html
- **[S8]** Mojeek, “Terms of Service.”
  https://www.mojeek.com/about/terms.html
- **[S9]** Mojeek, “Privacy Policy,” updated 2022-02-02.
  https://www.mojeek.com/about/privacy/
- **[S10]** Mojeek, “Mojeek Web Search API.”
  https://www.mojeek.com/services/search/web-search-api/
- **[S11]** Mojeek, “Search Operators.”
  https://www.mojeek.com/support/search-operators.html
- **[S12]** Mojeek, official `focus-templates` repository, README and current
  `main` tree at commit/tree `4603b6e0b535c2659a3541b5f9e17abe7f5a928c`.
  https://github.com/Mojeek/focus-templates
- **[S13]** Mojeek Blog, “About Ranking on Mojeek,” 2024-08-14.
  https://blog.mojeek.com/2024/08/about-ranking-on-mojeek.html
- **[S14]** Mojeek Blog, “Clustering - How Mojeek Gives You More Variety,”
  2024-07-16.
  https://blog.mojeek.com/2024/07/clustering-how-mojeek-gives-you-more-variety.html
- **[S15]** Substack, `robots.txt`. https://substack.com/robots.txt
- **[S16]** Substack, “Terms of Use,” effective 2025-04-21.
  https://substack.com/tos
- **[S17]** Mojeek Blog, “About Mojeek; Business Model, Surveillance, and
  Privacy,” 2020-12-08.
  https://blog.mojeek.com/2020/12/frequently-asked-questions-about-mojeek-business-model-surveillance-privacy.html
- **[S18]** Mojeek, “Mojeek Ads.” https://www.mojeek.com/ads/
- **[S19]** Substack, “Privacy Policy,” last updated 2026-05-14.
  https://substack.com/privacy
