# Mojeek Image Search: provider-backed image discovery

**Research / source access date:** 2026-08-17  
**Product boundary:** the public Mojeek Images tab and its documented provider
relationships. Mojeek Web Search, its owned HTML index, Openverse, and Pixabay
are considered only where they establish corpus, provenance, safety, rights,
privacy, ranking, or commercial boundaries.  
**Method:** clean-room desk research from official public pages. No Mojeek
result query, credential, paid call, traffic inspection, image download,
automated evaluation, source-code reconstruction, implementation, or deployment.

## Executive verdict

**Current and operating, but not a Mojeek-owned image index (high confidence).**
The current `/images` page is live and submits a GET search to Mojeek with
`q` and `fmt=images`; current Preferences offers **Openverse (Default)** and
**Pixabay** as image providers [S1][S2]. Mojeek's own timeline also still records
the 2023 Openverse addition [S3]. Conversely, Mojeek's content policy explicitly
says its index contains only HTML pages and that it does not index images or
video [S4]. The image vertical is therefore a provider-selection and presentation
surface over external image corpora, not an image counterpart of Mojeek's
independently crawled Web index.

This distinction is material. Mojeek removed Bing from Image Search in 2023 and
documented Openverse and Pixabay as the remaining providers, plus outbound “Try
elsewhere” links [S5][S6]. Openverse now says it searches more than 800 million
images and audio tracks aggregated from public APIs and Common Crawl; Pixabay's
API describes its own royalty-free media corpus [S12][S15]. Mojeek does not
publish a standalone Image Search API, response schema, image-corpus count,
ranking specification, freshness promise, safety contract, or current result-
card specification [S1][S7].

**Curiosity verdict:**

- **ADOPT** explicit provider identity and separate landing-page, media-asset,
  and derivative identities.
- **ADAPT** source-native rights and safety metadata into typed, evidence-backed
  fields while preserving which provider asserted each value.
- **REJECT** Mojeek Image Search as an owned image corpus, durable evidence
  archive, licensing authority, final safety classifier, or machine contract.
- **DEFER** any live behavioral study or provider integration until separately
  authorized terms, privacy, rights, safety, and evaluation review.

Confidence is **high** on current availability, provider choices, and the fact
that Mojeek's own index excludes images; **medium** on the inferred server-side
adapter architecture; and **low** on current result rendering, paging, provider
parameter mapping, safety enforcement, caching, and rank preservation because
Mojeek publishes no current image-specific contract and no query was run.

## 1. Decision frame and bounded questions

**Decision:** what can Curiosity safely learn from Mojeek's standalone image
surface without mistaking an external-provider UI for an owned index, a provider
license claim for verified rights, or a displayed thumbnail for source evidence?

Bounded sub-questions:

1. Is the product current, and which corpora does it depend on?
2. What request and user-interface behavior is officially documented?
3. What does each provider distinguish among source page, media URL, thumbnail,
   and larger/original rendition?
4. Which license and safety hints exist, and which assurances do not?
5. What is known about filters, ranking, freshness, privacy, and economics?
6. Which architecture conclusions are supportable without proprietary inspection?
7. Which ideas should Curiosity adopt, adapt, reject, or defer?

Labels used below:

- **FACT** — directly stated or exposed by a cited official source.
- **INFERENCE** — the narrowest conclusion supported by facts; not a measurement
  of Mojeek's private implementation.
- **RECOMMENDATION** — a Curiosity design or governance choice.
- Confidence is **high**, **medium**, or **low**.

**Stop condition:** every requested category has official evidence or an explicit
unknown; remaining material questions require a live query, private agreement,
provider credentials, image retrieval, or implementation inspection.

## 2. Current status and corpus/index dependencies

### 2.1 Status timeline

| Date | Officially documented state | Assessment |
| --- | --- | --- |
| 2018-09-04 | Mojeek launched Image Search using multiple providers including Pixabay and Bing. Users selected a provider below the form [S8]. | **FACT / high**, historical. |
| 2023-07-18 | Mojeek added Openverse, retained Pixabay, and had already removed Bing because of API pricing and user feedback. Pixabay was then the default [S5]. | **FACT / high**, historical transition. |
| 2023-08-31 | Mojeek again said Bing had been removed; Openverse and Pixabay remained, with “Try elsewhere” links [S6]. | **FACT / high**, corroboration. |
| 2026-08-17 | `/images` is live; Preferences lists `Openverse (Default)` and `Pixabay`; the About timeline still records the Openverse addition [S1-S3]. | **FACT / high**, current public status. |

The default changed from Pixabay in July 2023 to Openverse by the current
Preferences page. The official sources found do not date or explain that switch.

### 2.2 Whose index is being searched?

**FACT (high):** Mojeek says its own general index contains only HTML webpages,
not images or video [S4]. Its current API documentation offers Search API access
to general Web results and Organisation Search, but lists no image endpoint or
Image Search product [S7].

**FACT (high):** Openverse describes itself as an aggregator of openly licensed
and public-domain media from public APIs and Common Crawl. Its current source
directory lists dozens of image sources, including Flickr, iNaturalist,
Wikimedia Commons, Europeana, museums, and specialist collections [S12][S13].
Openverse says its combined image/audio search exceeds 800 million records; this
is not an image-only count and is not a Mojeek corpus count [S12].

**FACT (high):** Pixabay exposes a separate REST API for searching and retrieving
its royalty-free images and videos. The image endpoint supports a source-page
URL, several rendition URLs, contributor identity, dimensions, engagement
counts, and optional full-resolution access [S15].

**INFERENCE (high):** choosing Openverse or Pixabay changes the candidate corpus,
metadata, ranking, safety options, freshness semantics, rights vocabulary, and
availability boundary. “Mojeek image result” identifies the presentation service,
not a single homogeneous index lineage.

**INFERENCE (medium):** the likely architecture is:

```text
browser GET to Mojeek (`q`, `fmt=images`, provider preference)
  -> Mojeek image route / selected provider adapter
  -> external Openverse or Pixabay search service
  -> provider-ranked metadata and image renditions
  -> Mojeek normalization and HTML presentation
  -> source/asset navigation or outbound “Try elsewhere” redirect
```

The 2018 post explicitly said Microsoft interaction happened through Mojeek,
not directly [S5]. That supports a server-side-provider pattern historically.
No current network trace or implementation source was inspected, so the exact
Openverse/Pixabay request path, caching, credential ownership, normalization,
and browser exposure remain **unknown**.

## 3. Request and user-interface behavior

### 3.1 Current observable, non-query contract

**FACT (high):** the current empty-state Image Search page contains a GET form
whose action is `/search`, with a text field named `q`, `maxlength=256`, and a
hidden `fmt=images` value [S1]. The page identifies itself as “Image Search |
Mojeek” and links Images as a top-level search tab.

**FACT (high):** provider choice is a preference, currently Openverse by default
or Pixabay. Preferences can be stored in a local cookie or encoded in a
cookieless preferences URL [S2]. The same page says Search Choice buttons redirect
the user outside Mojeek; this establishes the privacy boundary for those outbound
buttons, not the internal provider call path.

### 3.2 Historical behavior, not a current promise

Mojeek's launch documentation said:

- a dropdown below the form selected the provider;
- clicking a result with JavaScript showed a larger image, photographer account,
  and photo location;
- without JavaScript, clicking went directly to the source page [S8].

The 2023 Openverse announcement said the provider could be switched and made
default in Preferences, and showed “Try elsewhere” buttons for private versions
of Bing/Google and direct search engines [S5][S6].

**Boundary (high):** these posts establish product intent at publication time.
They do not prove the current result-card fields, modal behavior, provider
selector placement, pagination/infinite-scroll model, result count, keyboard
behavior, attribution display, or outbound URL targets.

### 3.3 Material negative results

No current official Mojeek image-specific documentation was found for:

- a public API or response schema;
- page/cursor/count limits or result totals;
- HTTP/errors/retries/availability;
- image size, orientation, color, type, source, license, or date filters;
- source/result deduplication or diversity;
- thumbnail proxying, cache lifetime, rendition transformations, or hotlinking;
- exact provider request parameters or safety flags;
- per-result fields, license display, safety labels, or rank explanations.

These absences are **FACTS about the public evidence (high confidence)**, not
proof that the private implementation lacks the behavior.

## 4. Result provenance and image relationships

### 4.1 Provider-native resource roles

The upstream providers expose materially different objects:

| Role | Openverse | Pixabay | Mojeek evidence |
| --- | --- | --- | --- |
| Provider record | stable-looking Openverse media `id`, provider and source fields [S14] | Pixabay image `id` [S15] | No current result ID contract. |
| Landing/source page | `foreign_landing_url` [S14] | `pageURL`, described as the Pixabay source page [S15] | Historical no-JS click went to “source page” [S8]. |
| Media asset | `url`, plus dimensions/file metadata where available [S14] | `webformatURL`, `largeImageURL`, and full-access `imageURL`/`vectorURL` [S15] | Current mapping not documented. |
| Thumbnail/preview | Openverse `thumbnail` endpoint [S14] | `previewURL` (max 150 px) and medium web rendition [S15] | Historical grid and larger view shown; exact rendition unknown. |
| Creator/source lineage | creator, creator URL, provider, source, attribution [S14] | user ID/name/profile convention [S15] | Historical larger view showed photographer account and location [S8]. |

**FACT (high):** Pixabay states its medium `webformatURL` is valid for 24 hours,
full-resolution fields require approved full API access, returned image URLs are
for temporary result display, permanent hotlinking is not allowed, and API
responses must be cached for 24 hours [S15]. Thus a displayed Pixabay rendition
need not be the original byte object or a permanent identifier.

**FACT (high):** Openverse exposes separate landing-page, media, thumbnail,
creator, source/provider, license, attribution, dimension, file, indexed-time,
and sensitivity fields in its public image contract [S14]. Its own About page
nevertheless warns that licensing and generated attribution are not verified
[S12].

**INFERENCE (high):** at least three identities must remain separate:

```text
provider record
  -> landing/source page (context and rights evidence)
  -> media URL (possibly mutable or redirected bytes)
  -> preview/thumbnail/larger rendition (derived delivery object)
```

Provider ID, source-page URL, asset URL, and thumbnail URL are not interchangeable.
None alone proves immutable content, original authorship, current availability,
maximum resolution, rights, or byte equality.

**UNKNOWN:** which upstream fields Mojeek retains or discards; whether Mojeek
rewrites/proxies any images; whether the larger view uses source bytes or a
provider derivative; whether clicks first contact Mojeek, Openverse/Pixabay, or
the original host; and whether license/creator/source data are displayed today.

## 5. Licensing hints and rights boundary

### 5.1 What the providers claim

**FACT (high):** Mojeek's 2023 post described Openverse as a search engine for
Creative Commons and public-domain media, then broadly suggested non-commercial
reuse with attribution and substantial commercial availability [S5]. This is a
historical product explanation, not asset-specific legal verification.

**FACT (high):** Openverse says it aggregates metadata and does not own or
control the underlying content, verify licensing status, or warrant its data.
Users must independently verify rights and comply with the content and hosting
platform terms [S12][S17]. Its response can provide license identifier/version,
license URL, creator, and generated attribution [S14]. Those are valuable claims
and evidence pointers, not adjudicated rights.

**FACT (high):** Pixabay calls API media royalty-free under its Content License,
requests source attribution when API results are displayed, restricts permanent
hotlinking, and distinguishes temporary result URLs from downloadable use
[S15]. “Royalty-free” does not mean copyright-free, unrestricted, or owned by
Mojeek.

### 5.2 Curiosity rights treatment

**RECOMMENDATION (high):** preserve separately:

- provider and source collection;
- creator/rightsholder claim and profile URL;
- license identifier, version, URL, and exact attribution text;
- landing-page and terms captures with observation time;
- verified/claimed/unknown/restricted/removed status;
- permitted purposes, attribution, share-alike, non-commercial, no-derivatives,
  and other conditions as reviewed facts—not filename inference;
- asset and derivative hashes when fetching is separately authorized.

Default a discovered image to **rights unknown / discovery only** until source-
specific evidence is reviewed. Neither Mojeek display, Openverse inclusion,
Pixabay branding, nor a provider license field alone grants Curiosity authority
to download, transform, train on, redistribute, or publish the asset.

## 6. Safety metadata and policy

**FACT (high):** Mojeek added a general Safe Search UI/preference in November
2023 to remove adult sites, explicitly calling it beta and warning that it was
not a sure-fire way to remove all adult content [S9]. Current Preferences still
offers “Hide results which are for a mature audience” [S2]. Neither source says
how this setting applies to Openverse or Pixabay image results.

**FACT (high):** Openverse's search contract excludes records marked `mature` by
default unless included and can expose `mature` plus sensitivity metadata [S14]
[S16]. Openverse's broader documentation treats these as moderation/search
signals, not a universal safety certification.

**FACT (high):** Pixabay's API offers a `safesearch` boolean meaning “only images
suitable for all ages”; its documented default is `false` [S15]. Pixabay's
privacy page says it uses content detection for moderation, including prohibited
pornographic or copyright-protected material [S18].

**INFERENCE (high):** both providers possess safety controls, but public evidence
does not show whether Mojeek passes its Safe Search preference through, applies
an additional filter, drops flagged rows, blurs thumbnails, or surfaces any
reason. A global checkbox cannot be treated as per-asset safety evidence.

**RECOMMENDATION (high):** Curiosity should require explicit requested policy,
provider-applied mode, provider flag/reason, Curiosity classifier evidence,
policy version, and final use/display decision. Images and their URLs remain
untrusted: authorized retrieval needs SSRF controls, redirect and byte/pixel/
frame limits, MIME validation, sandboxed decoding, and no automatic rendering
of unvalidated SVG/HTML/polyglot content.

## 7. Filters, ranking, diversity, and freshness

### 7.1 Mojeek surface

**FACT (high):** current official Mojeek pages document only query text and
provider preference for Image Search [S1][S2]. No current image-specific rank,
filter, freshness, deduplication, or diversity contract was found.

**INFERENCE (medium):** because the user chooses one provider rather than a
blend, provider candidate generation and ranking likely dominate. Mojeek may
normalize, truncate, suppress, or reorder results, but there is no public basis
to assert that it does—or that it preserves upstream order exactly.

### 7.2 Provider capabilities are not Mojeek capabilities

**FACT (high):** Openverse documents a lexical Elasticsearch search over title,
description, and tags, with title weighted 10,000 times more heavily; it also
uses provider-supplied popularity where available. Current documentation says
its custom text analysis is English-only. Filters include source, license,
license type, extension, category, aspect ratio, size, and mature inclusion
[S16]. These details explain possible upstream behavior, not Mojeek's mapping.

**FACT (high):** Pixabay's upstream API supports language, type, orientation,
category, minimum dimensions, colors, editors' choice, Safe Search, `popular`
or `latest` order, page, and 3–200 results/page. Default order is `popular`; the
default API query window is capped at 500 accessible images per query [S15].

**Freshness boundary (high):**

- Mojeek publishes no image freshness field or filter.
- Openverse `indexed_on` is catalog indexing time, not image creation,
  publication, capture, or last-byte-change time [S14].
- Pixabay offers `latest` ordering but no result publication/capture timestamp
  in its documented image response; required 24-hour response caching further
  bounds immediacy [S15].

**RECOMMENDATION (high):** preserve upstream rank as an observation, then perform
owned deduplication/diversification in a separate auditable stage. Track landing
host, asset host, provider/source collection, creator/owner claims, exact hash,
perceptual cluster, license class, safety state, and temporal evidence. Do not
equate provider count with distinct assets, creators, owners, viewpoints, or
events.

## 8. Privacy and business model

### 8.1 Privacy boundary

**FACT (high):** Mojeek says it performs no specific user tracking and sets no
cookies by default unless agreed. Standard logs are kept indefinitely but replace
IP addresses with a two-letter country code; remaining data includes time,
requested page, possible referrer, and separate browser information. Aggregate,
non-personal search data may improve results [S10]. Preferences may be cookie-
stored or cookieless [S2].

**FACT (high):** Mojeek's privacy policy says its protections end when a user
follows links to other websites [S10]. Search Choice buttons explicitly redirect
outside Mojeek [S2].

**INFERENCE (medium-high):** if current provider calls remain server-side as
historically documented for Bing, Openverse/Pixabay receive Mojeek's network
identity rather than the end user's IP, but receive the query and provider-
account context. This is privacy mediation, not local search or zero disclosure.

**Boundary (high):** Mojeek's public privacy policy does not explain Image Search
provider query logs, retention, API-account linkage, subprocessors, cache keys,
or whether providers receive country/language/referrer metadata. Openverse says
its website uses anonymous analytics and follows WordPress.org privacy; the
WordPress policy says it collects IP addresses and ordinary request metadata
[S19][S20]. Pixabay says it may collect search queries and interaction data for
analytics, machine learning, relevance, personalization, and advertising [S18].
Those public visitor policies do not reveal the terms or retention applying to
Mojeek's service-to-service accounts.

### 8.2 Economics and continuity

**FACT (high):** Mojeek removed Bing partly because Microsoft's API pricing
changed [S5][S6]. This demonstrates that an apparently stable vertical can change
corpus and quality because an upstream provider changes economics.

**FACT (high):** Mojeek currently sells Web Search API access and operates an
invite-only contextual advertising programme based on category, keyword, and
country rather than tracked profiles [S11][S21]. Its Terms allow Mojeek and
partners to place ads on services [S22]. No image-specific fee, subscription,
SLA, or monetization model is published.

**FACT (high):** Openverse reserves the right to charge for commercial/heavy use
and may modify or terminate access; Pixabay enforces key-based rate limits,
mandatory response caching, anti-mass-download rules, and temporary-display/
hotlinking constraints [S15][S17].

**INFERENCE (high):** Mojeek Image Search inherits upstream price, quota, policy,
schema, corpus, moderation, and continuity risk. It is a useful diversity surface
but not an autonomous image-search substrate.

## 9. Clean-room lessons and Curiosity implications

No Mojeek proprietary code, provider credential, private API agreement, ranker,
or result corpus was inspected. Public behaviors are architecture clues, not a
compatibility specification.

| Public clue | Curiosity treatment | Verdict |
| --- | --- | --- |
| Provider is user-selectable [S2] | Make provider/corpus lineage explicit in every observation and permit caller-authorized source selection. | **ADOPTED** |
| External image vertical beside owned Web index [S4-S6] | Keep vertical ownership claims separate; never infer image custody from Web-index ownership. | **ADOPTED** |
| Source page, media URL, and preview/rendition differ [S14][S15] | Model distinct nodes and preserve redirect/capture/hash/transform lineage. | **ADOPTED** |
| Openverse license/creator/attribution fields [S14] | Retain as provider claims with evidence URLs and verification state. | **ADAPTED** |
| Provider-native safety fields [S14][S15] | Normalize without erasing source semantics; add owned per-asset policy evaluation. | **ADAPTED** |
| Provider ranking and filters differ [S15][S16] | Declare unsupported controls, preserve upstream rank, and rerank only in a separate traceable stage. | **ADAPTED** |
| Historical larger-view/source-page fallback [S8] | Offer progressive enhancement while preserving a direct, clearly attributed source path. | **ADAPTED** |
| Mojeek Image Search as image index/evidence archive | Corpus, bytes, ranking, and provider contracts remain external. | **REJECTED** |
| Provider inclusion as proof of rights or safety | Metadata is fallible and context-specific. | **REJECTED** |
| Thumbnail/larger URL as immutable original | Renditions can be temporary, scaled, mutable, or provider-hosted. | **REJECTED** |
| Live integration or benchmark | Requires explicit query budget, terms, privacy, rights, safety, and result-retention approval. | **DEFERRED** |

### 9.1 Minimum provider-neutral image evidence model

**RECOMMENDATION (high):** Curiosity should independently specify:

```text
query_observation:
  provider + provider_version? + query + controls + observed_at
  + provider_rank + provider_record_id? + unsupported_controls[]

landing_page:
  observed_url + resolved_url? + canonical_url? + page_capture_id?

media_asset:
  observed_url + resolved_url? + provider_claimed_dimensions/type/size?
  + capture_id? + byte_hash? + perceptual_hash? + measured_metadata?

derivative:
  provider_or_owned + source_capture_id? + transform/version?
  + dimensions/type/hash + cache/lifetime evidence?

governance:
  creator/rightsholder claims + license claim/evidence/verification
  + attribution + safety signals/decision/policy version
  + discovery/fetch/use authority + deletion/takedown state
```

### 9.2 Curiosity-specific retrieval implications

1. **Provider gap is a valid bounded branch.** If one corpus lacks a relevant
   source class, a caller-authorized second provider may reduce the gap. The
   result itself cannot authorize that extra query.
2. **Rights contradictions are first-class.** A provider license claim that
   conflicts with the landing page should trigger verification, not automatic
   selection or silent overwrite.
3. **Novelty is not diversity.** Cluster exact/near-duplicate assets, syndicated
   pages, creator and likely owner before spending curiosity budget on another
   visually similar result.
4. **Separate clocks.** Track provider indexed time, landing-page observation,
   asset fetch/change, claimed creation/publication, and query observation. A
   provider's `latest` order is not a universal freshness fact.
5. **Do not auto-fetch result assets.** Search metadata is an untrusted discovery
   lead. Fetch authority, rights, network safety, decode budget, and use purpose
   are separate gates.

## 10. Unknowns and checks before any authorized evaluation

### 10.1 Material unknowns

1. Current result-card/modal fields and exact source/asset/thumbnail navigation.
2. Server-side versus browser-side provider request path and query metadata sent.
3. Provider API versions, plans, credentials, quotas, caching, and private terms.
4. Query/result retention and account linkage at Mojeek and each provider.
5. Pagination/count/deep-result behavior, failure states, partial results, and SLA.
6. Whether provider order is preserved, truncated, filtered, deduplicated, or reranked.
7. Which Openverse/Pixabay filters and Safe Search settings Mojeek forwards.
8. Per-result license, creator, attribution, source, and sensitivity display.
9. Thumbnail proxy/cache/transform behavior and original-rendition relationship.
10. Image freshness, stale-link, duplicate, safety false-negative, and rights-
    metadata accuracy.

### 10.2 Required checks

- **Vendor:** obtain a current image-product contract or written answers covering
  provider path, schema, bounds, safety, privacy, retention, caching, and failures.
- **Provider terms:** review Mojeek's exact Openverse/Pixabay arrangements,
  attribution obligations, display/hotlinking, cache, storage, derived metadata,
  and termination behavior.
- **Legal/rights:** use only caller-owned or expressly licensed fixtures; verify
  license and attribution against source pages.
- **Authorized behavior study:** preregister a small query set and budgets; record
  provider, rank, URL roles, metadata presence, redirects, stale links, duplicate
  clusters, safety and rights contradictions. Do not download source bytes unless
  separately approved.
- **Privacy:** inspect actual browser requests and vendor DPA/retention terms under
  explicit authority; do not infer service-to-service handling from consumer
  slogans.
- **Exit:** define provider outage/removal behavior and deletion of retained
  provider metadata/derivatives.

## 11. Bounded curiosity pass

After synthesis, in-frame gaps were scored 1–5 for relevance (R), decision value
(V), novelty (N), and cost (C, where 5 is expensive). Priority was
`R + V + N - C`.

| Thread | R | V | N | C | Score | Outcome |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Establish current providers/default after 2023 | 5 | 5 | 4 | 1 | 13 | **Pursued.** Current Preferences resolves Openverse as default and Pixabay as alternative [S2]. |
| Reconcile “independent Mojeek” with image corpus ownership | 5 | 5 | 4 | 1 | 13 | **Pursued.** Content policy explicitly excludes images; provider posts explain the vertical [S4-S6]. |
| Resolve source/asset/thumbnail/original roles | 5 | 5 | 4 | 2 | 12 | **Pursued.** Provider contracts establish distinct resources; Mojeek's current mapping remains unknown [S14][S15]. |
| Determine whether license claims are verified | 5 | 5 | 3 | 1 | 12 | **Pursued.** Openverse expressly disclaims verification; Pixabay imposes separate Content License/API conditions [S15][S17]. |
| Determine current Safe Search forwarding | 5 | 4 | 4 | 4 | 9 | **CURIOSITY_NO_GO.** Public pages do not answer it; requires live inspection or vendor confirmation. |
| Measure result ordering, freshness, dedupe, and safety | 5 | 4 | 3 | 5 | 7 | **CURIOSITY_NO_GO.** No live-query or download authority; defer to preregistered evaluation. |
| Infer private adapter or thumbnail implementation | 2 | 2 | 4 | 5 | 3 | **CURIOSITY_NO_GO.** No interoperability need; high clean-room and terms risk. |
| Audit individual image licenses | 3 | 3 | 2 | 5 | 3 | **CURIOSITY_NO_GO.** Asset-specific legal/fetch work is outside this product frame. |
| Reconstruct deprecated Bing behavior | 1 | 1 | 1 | 3 | 0 | **CURIOSITY_NO_GO.** Removed dependency; no effect on current architecture verdict. |

**Stop reason:** coverage and saturation. All requested categories are supported
or explicitly unknown. Remaining high-value gaps require caller-authorized live
behavior observation, private contracts, credentials, source-image retrieval, or
legal review.

## 12. Fact / inference / recommendation ledger

| ID | Statement | Label | Confidence | Sources |
| --- | --- | --- | --- | --- |
| L1 | Mojeek Image Search is live and currently offers Openverse by default and Pixabay as alternative. | FACT | High | [S1-S3] |
| L2 | Mojeek's own Web index excludes images and video. | FACT | High | [S4] |
| L3 | The image vertical depends on external provider corpora rather than Mojeek's owned Web index. | FACT + INFERENCE | High | [S4-S6], [S12], [S15] |
| L4 | Current request surface exposes `q`, `fmt=images`, and a 256-character browser field; no image API is published. | FACT | High | [S1], [S7] |
| L5 | Landing page, media URL, and thumbnail/rendition are distinct provenance objects. | FACT + INFERENCE | High | [S14], [S15] |
| L6 | Provider rights metadata is useful but does not itself verify reuse rights. | FACT | High | [S12], [S15], [S17] |
| L7 | Mojeek's general Safe Search and upstream safety controls exist, but current image enforcement is unknown. | FACT / UNKNOWN | High | [S2], [S9], [S14], [S15] |
| L8 | Image ranking, filtering, freshness, diversity, and dedupe are not publicly contracted by Mojeek. | Negative result | High | Mojeek source set |
| L9 | The likely server-side adapter pattern protects the user's IP from providers but still discloses queries upstream. | INFERENCE | Medium | [S5], privacy analysis |
| L10 | Provider economics already caused a corpus change when Bing was removed. | FACT | High | [S5], [S6] |
| L11 | Curiosity should preserve provider, source page, asset, derivative, rights, safety, and clock lineage separately. | RECOMMENDATION | High | Contract analysis |
| L12 | Mojeek Image Search should not be used as an owned corpus, evidence archive, licensing authority, or final safety system. | RECOMMENDATION | High | Source set as a whole |

## 13. Primary source ledger

All sources were accessed **2026-08-17**. Mojeek sources are primary for its
product and self-description; Openverse and Pixabay sources are primary for
their own contracts. Provider material does not independently validate Mojeek's
private integration, and none verifies third-party image rights or quality.

- **[S1]** Mojeek, current “Image Search” empty-state page.
  https://www.mojeek.com/images
- **[S2]** Mojeek, current “Preferences,” especially Image Provider, Safe Search,
  Search Choices, and cookie/cookieless settings.
  https://www.mojeek.com/preferences
- **[S3]** Mojeek, “About,” current timeline.
  https://www.mojeek.com/about/
- **[S4]** Mojeek, “Search Content Policy,” especially the HTML-only index
  statement. https://www.mojeek.com/about/content/
- **[S5]** Mojeek Blog, “Expanding Mojeek’s Image Search with Openverse,”
  2023-07-18.
  https://blog.mojeek.com/2023/07/expanding-mojeeks-image-search-with-openverse.html
- **[S6]** Mojeek Blog, “Mojeek Updates, August 2023,” 2023-08-31.
  https://blog.mojeek.com/2023/08/mojeek-updates.html
- **[S7]** Mojeek, “API Documentation.”
  https://www.mojeek.com/support/api/
- **[S8]** Mojeek Blog, “Image Search Launch and Infobox Update,” 2018-09-04.
  https://blog.mojeek.com/2018/09/image-search-launch-and-infobox-update.html
- **[S9]** Mojeek Blog, “Mojeek Updates, November 2023,” 2023-11-07.
  https://blog.mojeek.com/2023/11/mojeek-updates.html
- **[S10]** Mojeek, “Privacy Policy,” updated 2022-02-02.
  https://www.mojeek.com/about/privacy/
- **[S11]** Mojeek, “Mojeek Web Search API.”
  https://www.mojeek.com/services/search/web-search-api/
- **[S12]** Openverse, “About Openverse.” https://openverse.org/about
- **[S13]** Openverse, current “Sources.” https://openverse.org/sources
- **[S14]** Openverse, v1 API reference, Image Search response and fields.
  https://api.openverse.org/v1/#operation/image_search
- **[S15]** Pixabay, “Pixabay API,” image search parameters, response fields,
  rate limits, caching, attribution, and hotlinking.
  https://pixabay.com/api/docs/
- **[S16]** Openverse, “Search Algorithm.”
  https://docs.openverse.org/api/reference/search_algorithm.html
- **[S17]** Openverse, “Terms of Service,” effective 2022-05-05.
  https://docs.openverse.org/terms_of_service.html
- **[S18]** Pixabay, “Privacy Policy,” updated 2024-05-09.
  https://pixabay.com/service/privacy/
- **[S19]** Openverse, “Privacy.” https://openverse.org/privacy
- **[S20]** WordPress.org, “Privacy policy,” modified 2026-06-29.
  https://wordpress.org/about/privacy/
- **[S21]** Mojeek, “Mojeek Ads.” https://www.mojeek.com/ads/
- **[S22]** Mojeek, “Terms of Service.”
  https://www.mojeek.com/about/terms.html

## 14. Verification record

- Read the repository constitution before research.
- Cross-checked current product status across the live empty-state page,
  Preferences, About timeline, content policy, and API directory.
- Triangulated provider provenance and rendition roles against Openverse and
  Pixabay's own current contracts.
- Preserved historical/current distinctions: Pixabay was the 2023 default;
  Openverse is the current default.
- Preserved material negative results rather than inferring a schema, ranking,
  freshness, safety-forwarding, or thumbnail implementation.
- Submitted no search query to Mojeek or a provider and used no credential,
  payment, result benchmark, image download, bypass, or private implementation.
- Changed no file other than
  `docs/research/products/mojeek-image-search.md`.
