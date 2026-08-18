# Brave Video Search API: clean-room product dossier

**Research and primary-source access date:** 2026-08-17  
**Product boundary:** dedicated Brave Search API Video Search,
`GET|POST /res/v1/videos/search`, treated as a standalone ranked-video
discovery product. Consumer Brave Search video presentation, Web Search video
clusters, Image Search, News Search, LLM Context, Answers, and media playback or
download are out of scope except where first-party material prevents a false
lineage, safety, or rights conclusion.  
**Status:** public-documentation research and architecture recommendations; not
an implementation, purchase, benchmark, legal opinion, or authorization to use
the service.  
**Clean-room boundary:** public first-party Brave documentation, policy pages,
product pages, and Brave's public Search skill only. No credentials, free or
paid API call, retained result, consumer-UI scraping, video/thumbnail fetch,
traffic inspection, bypass, decompilation, or private algorithm reconstruction.

## Executive verdict

**ADAPTED as a metadata-rich discovery contract; REJECTED as Curiosity's owned
video index, playable-media source, or evidence archive (high confidence).**
Brave exposes a useful specialized surface: query a claimed curated video index,
receive up to 50 ordered video-page results per request, and page through at most
10 overlapping pages. Results can include title, description, source/watch-page
URL, human and machine date forms, fetch metadata, thumbnail delivery and origin
URLs, duration, views, creator, publisher/platform, subscription requirement,
tags, and an author profile [S1-S5].

The contract's strongest lesson is that **video identity, source page, platform,
creator claim, thumbnail, and playback bytes are different things**. In
particular, the response has no documented media-file, stream, manifest, caption,
transcript, chapter, audio-track, codec, dimensions, content hash, or immutable
capture field. `results[].url` is the source/watch page. A thumbnail is a
separate image resource, not the video. Creator/author/publisher are optional
provider metadata, not verified legal identities or rights holders [S3-S5].

Freshness is materially ambiguous. The service guide says filtering is by
**discovery date**, calls `pd` the latest “uploaded videos,” and markets tracking
new uploads. The GET/POST references instead define age using the most relevant
date reported by the page content, such as publication or modification. The
official skill describes `page_age` as page age from the source and uses
“published” in guidance [S1-S4]. No public source resolves which clock production
uses. Curiosity must not translate this filter into a precise upload-time
constraint.

Ranking, platform/creator diversity, duplicate suppression, and metadata quality
remain opaque. There is no rank score or explanation, stable result/video ID,
canonical relation, duplicate/reupload/clip relation, source cap, total count,
cursor, snapshot, or continuation signal. Pages may overlap [S2-S4]. A list of
videos is therefore not proof of distinct underlying works, creators, owners,
viewpoints, or recordings.

Video Search is included in the current Search plan at **$5 per 1,000 successful
requests**, with $5 monthly credit and 50 requests/second advertised capacity
[S11, S12]. Standard terms restrict durable result storage, derivatives,
redistribution, API replacement, reverse engineering, and AI training/evaluation;
third-party video and image rights remain external [S13]. No result-level license
or attribution grant is documented. Any pilot requires legal/procurement review
of an actual Order Form and separate authority for source pages, thumbnails,
video playback/fetch, transcripts, and derived analysis.

## 1. Decision frame and bounded questions

### 1.1 Decision

What should Curiosity learn from Brave Video Search API's public product contract
without depending on its hosted index, inventing media provenance, mistaking
metadata for verified identity, or reconstructing proprietary retrieval behavior?

### 1.2 Bounded sub-questions

1. What are the public request and result schemas, defaults, and hard bounds?
2. What do source URL, video metadata, publisher, author, and thumbnail URLs each
   identify—and what do they not identify?
3. How useful and reliable are duration, creator, view, subscription, and date
   metadata as provider observations?
4. What is known about the dedicated index, ranking, freshness, platform/source
   diversity, duplicates, and paging stability?
5. What safety, licensing, privacy, error, version, rate, and price constraints
   govern use?
6. Which high-level patterns transfer clean-room into a provider-neutral,
   owned-provenance Curiosity video model?

**Depth budget:** first-party public sources sufficient to cover every requested
category and triangulate material contract, index, freshness, rights, privacy,
and commercial claims. No live quality/latency/safety test, paid subscription,
private schema discovery, source-media download, jurisdiction-specific legal
analysis, or proprietary ranker inference. Stop on coverage, source saturation,
or when further work requires prohibited access.

Labels used below:

- **FACT** — directly stated or shown by cited first-party material.
- **INFERENCE** — the narrowest conclusion supported by those facts; not an
  observation of Brave internals.
- **RECOMMENDATION** — an independently authored Curiosity choice.
- Confidence is **high**, **medium**, or **low** for the claim as scoped.

## 2. Product identity and index relationship

### 2.1 Standalone product

**FACT (high):** Video Search is a dedicated ranked-retrieval endpoint launched
as an API resource in June 2023 and publicly announced with direct Image, News,
and Video querying in September 2023 [S1, S6]. It is not a video host, player,
transcoder, downloader, recommendation feed, transcript service, or generative
video product.

**FACT (high):** Brave's current guide calls the corpus a dedicated, continuously
indexed, curated video index spanning multiple Web platforms and sources. The
endpoint reference more generally says it searches video content from a “large
independent index of web pages” [S1-S3]. Brave's launch post called its Image,
News, and Video indexes independent [S6].

**FACT (medium, vendor claim):** the broader Search product advertises an index
of more than 30 billion pages and more than 100 million page updates daily. Those
figures are not a Video corpus count or video refresh rate [S5]. No audited Video
coverage figure was found.

**FACT (high, broader lineage):** Brave documents a crawler that discovers pages
and indexes their content, partially aided by its opt-in Web Discovery Project.
Its security page describes a selected general index fed by real-person visits,
links from multiple indexed pages, and curated RSS, with malware, phishing, and
CSAM controls [S7, S8]. These are general stack clues, not per-video lineage.

```text
publicly evidenced discovery/index context
  crawler + links/visits + WDP + curated RSS (general lanes)
                         |
                         v
          page eligibility / safety / indexing
                         |
                         v
       video eligibility + metadata extraction (inferred)
                         |
                         v
  video query / locale / date / safety / operators / ranking
                         |
                         v
             ordered video-result serialization
```

**INFERENCE (medium):** the minimum architecture consistent with the public
record is a video-eligible vertical view over Brave-controlled page discovery
and indexing, plus video-specific metadata extraction and ranking. “Dedicated”
or “curated index” could mean separate physical storage, a logical eligibility
set, platform/source policies, classifiers, or several layers. Public sources do
not establish which.

**UNKNOWN:** Video corpus size; platform/source list; admission/removal policy;
feed, sitemap, structured-data, oEmbed, API, or crawl contribution; recrawl
cadence; geographic/language coverage; canonicalization; deleted/private video
latency; Shorts/live-stream/podcast/playlist eligibility; and whether consumer
Brave Video and API candidates/order are identical. No result carries its
discovery lane or index segment.

## 3. Request contract

### 3.1 Transport and controls

**FACT (high):** GET query parameters and a POST JSON body both target
`https://api.search.brave.com/res/v1/videos/search`. Authentication uses required
`X-Subscription-Token`; `q` must be non-empty and is limited to 400 characters
and 50 words [S2-S4].

| Input | Type/default | Documented behavior |
| --- | --- | --- |
| `q` | required string | query; non-empty, ≤400 characters and ≤50 words |
| `country` | enum; `US` | supported 2-character market or `ALL`; described as where results come from |
| `search_lang` | enum; `en` | preferred result/content language |
| `ui_lang` | enum; `en-US` | preferred response/UI language |
| `safesearch` | `off\|moderate\|strict`; `moderate` | adult-content filtering |
| `count` | integer; `20` | 1–50 results; actual number can be lower |
| `offset` | integer; `0` | page number 0–9, despite “offset” naming; pages may overlap |
| `spellcheck` | boolean; `true` | corrected query is always searched; altered form can be returned |
| `freshness` | string; empty | `pd`, `pw`, `pm`, `py`, or `YYYY-MM-DDtoYYYY-MM-DD`; clock is contradictory |
| `include_fetch_metadata` | boolean; `false` | requests `fetched_content_timestamp` |
| `operators` | boolean; `true` | enables query-operator parsing |
| `Api-Version` | date header; latest | pins dated incompatible behavior |
| `Cache-Control` | `no-cache` | best-effort request not to return cached content |
| `User-Agent` | string | may vary experience by device |
| `Accept` | JSON/default | documented response media type |

Sources: [S1-S4, S9, S10]. POST is useful for transport/body handling but does not
offer a richer documented semantic contract than GET.

### 3.2 Filters that are absent

**FACT (high):** the endpoint documents no direct filter for duration, minimum
views, creator/channel, publisher/platform, free versus subscription, tags,
orientation, aspect ratio, resolution, codec, live/upcoming/archive state,
captions, transcript language, audio language, embeddability, license/usage
rights, upload date specifically, or source-owner diversity [S1-S4].

**FACT (high):** no `goggles`, `extra_snippets`, `text_decorations`, precise
location headers, or result-type selector is listed for Video Search [S2-S4].
Capabilities of Web or News must not be projected onto this endpoint.

**FACT (high):** operators can express exact phrase, exclusion, and `site:` in
the service guide; Brave's broader operator reference also documents page
extension/type, title/body/page, language/location, and Boolean operators, while
warning that operator behavior is experimental and restrictive queries can be
empty [S1, S9]. The generic operator page demonstrates the Web endpoint, so only
the video guide's explicitly named forms should be treated as Video-tested
examples without a pinned contract.

**INFERENCE (high):** `site:youtube.com` constrains a page domain, not verified
publisher ownership, channel identity, hosting of actual bytes, or rights.
Likewise `country` and `search_lang` are retrieval preferences/constraints with
no documented per-result enforcement trace.

**RECOMMENDATION (high):** a neutral request must separate textual matching,
market, content language, date-clock constraint, safety policy, media-property
constraints, source policy, and candidate/page/time/cost budgets. An adapter
must report unsupported or ambiguous controls rather than silently claiming
Brave enforced them.

## 4. Response schema

### 4.1 Envelope and query trace

**FACT (high):** a successful response has `type: "videos"`, required `query`,
`results[]` (default empty), and required `extra`; each result has
`type: "video_result"` [S2-S4]. The official skill expands the query/set fields:

```text
query:
  original
  altered?                 # spell-corrected query
  cleaned?
  spellcheck_off?
  show_strict_warning?
  search_operators?:
    applied?
    cleaned_query?
    sites[]?

extra:
  might_be_offensive
```

**RECOMMENDATION (high):** preserve original, altered, cleaned, operator-cleaned,
and executed query separately. Automatic spelling or operator parsing can change
a person, title, channel, or event and otherwise make retrieval irreproducible.

### 4.2 Result fields

The endpoint's rendered child schemas are collapsed. Brave's official skill and
product-page sample provide the current public field-level description [S4, S5].

| Area | Field | Public meaning / essential caveat |
| --- | --- | --- |
| Result | `type` | `video_result` |
| Source page | `url` | source/watch-page URL; not a media-file or stream URL |
| Display text | `title`, optional `description` | provider/source-derived untrusted strings; no immutable passage anchor |
| Human time | optional `age` | relative phrase or absolute display date; not a typed clock |
| Content/page time | optional `page_age` | source/page age as ISO-like datetime; derivation and exact clock unresolved |
| Page fetch | optional `page_fetched` | ISO datetime when page was last fetched |
| Extra fetch | optional `fetched_content_timestamp` | integer when requested; units and event are undocumented |
| Thumbnail | `thumbnail.src`, optional `thumbnail.original` | served image URL and original thumbnail URL |
| Video metadata | optional `video.duration` | variable-format time string, not documented as seconds |
| Video metadata | optional `video.views` | integer view count; observation time/source absent |
| Identity labels | optional `video.creator`, `video.publisher` | creator/channel-like label and platform/publisher label |
| Access | optional `video.requires_subscription` | Boolean provider observation; entitlement/paywall semantics unspecified |
| Classification | optional `video.tags[]` | video tags; source/derivation unspecified |
| Author profile | optional `video.author.{name,url,long_name,img}` | profile-like identity and image; not a verified legal person/owner |
| URL display | optional `meta_url.{scheme,netloc,hostname,favicon,path}` | parsed presentation metadata, not canonical/ownership evidence |

**FACT (high):** the official sample shows `duration: "12:22"`, an integer
`views`, `creator: "gameranx"`, `publisher: "YouTube"`, a channel/profile URL,
and `page_age` without a timezone. The skill separately calls duration a
variable-format time string and shows a longer `03:45:00` form [S4, S5].

**Important negative result (high):** no stable result/video/content ID,
platform-native ID field, canonical URL, direct video file, HLS/DASH manifest,
embed URL, captions, transcript, chapters, live status, upload-event field,
dimensions, frame rate, codec, audio metadata, content hash, byte length,
thumbnail dimensions/hash, rank score, license, attribution, or rights-holder
field is documented [S2-S5]. A platform ID may be embedded in a URL, but the
contract does not parse, validate, or stabilize it.

## 5. Source, video, creator, and thumbnail provenance

### 5.1 Resource separation

```text
results[].url                         indexed source/watch page
  host ~= meta_url host               page/platform presentation provenance
          |
          +-- video.publisher         platform-like label (optional)
          +-- video.creator           creator/channel-like label (optional)
          +-- video.author.url        profile page (optional)
          +-- thumbnail.original      source thumbnail image URL (optional)
          +-- thumbnail.src           thumbnail delivery URL
          +-- [NO media/manifest URL]  video bytes/playback are not exposed
```

**FACT (high):** the official skill defines the result URL as the source URL of
the video, `thumbnail.src` as the served thumbnail URL, and
`thumbnail.original` as the original thumbnail URL [S4]. Brave's product sample
uses a YouTube watch page as `url` but omits thumbnail fields, demonstrating that
examples do not guarantee every optional enrichment [S5].

**INFERENCE (high):** a result identifies a page that presents a video—not an
immutable audiovisual work or exact media rendition. The page can redirect,
become private, change its title/thumbnail/description, replace a stream, gate by
region/account/age/subscription, or disappear. Curiosity cannot prove which
bytes Brave indexed from the result alone.

**FACT (medium):** the skill's illustrative `thumbnail.src` uses Brave's
`imgs.search.brave.com` domain, while `thumbnail.original` uses a source image
host [S4]. This supports a served-versus-origin distinction, but the Video guide
does not publish the Image Search proxy's resize, privacy, cache, or lifetime
guarantees for video thumbnails.

**INFERENCE (high):** do not import Image Search's approximately 500-pixel proxy
behavior into Video Search. A Brave-hosted `thumbnail.src` is a delivery artifact,
not source ownership, permanence, a content license, or proof that it derives
from the currently playable video. Its transform recipe and source-byte binding
are undocumented.

### 5.2 Creator, author, and publisher

**FACT (high):** `video.creator` is a string, `video.publisher` is a platform-like
string, and `video.author` is a profile object with name and URL plus optional
long name/image [S4]. The public contract does not define precedence or equality
between creator and author.

**INFERENCE (high):** these fields represent at least three distinct roles:

- **platform/service** (`publisher`, e.g. YouTube);
- **account/channel/profile** (`author` and often `creator`); and
- **work creator/rightsholder**, which is not verified or necessarily exposed.

An uploader may be a distributor, fan, archive, news outlet, syndicator, or
infringer rather than the filmmaker, speaker, performer, producer, or rights
holder. A channel label can change and profile URLs can redirect. `publisher`
does not prove who published or owns the underlying work in the legal sense.

**RECOMMENDATION (high):** preserve each provider label with its source and
observation time, then resolve platform account, claimed creator/contributors,
publisher/distributor, and rights holder as separate entities and evidence-backed
relations. Never collapse all three into a generic `author`.

### 5.3 Provenance sufficiency

| Provenance question | Brave response | Curiosity still needs |
| --- | --- | --- |
| Which indexed page? | URL and display host/path | requested/resolved/final/canonical URL and capture |
| Which platform? | optional publisher + host | normalized platform entity and evidence |
| Which account/channel? | creator string and optional author profile | stable platform account ID, observed profile capture, confidence |
| Which audiovisual work? | title/page/video metadata only | work/entity ID, editions/cuts/reuploads/clips relation |
| Which playable rendition? | not exposed | manifest/file URL under authority, rendition IDs, codecs, hashes |
| Which thumbnail? | served and optional original URL | final URL, authorized capture/hash, dimensions, derivative lineage |
| Who created/owns it? | unverified labels only | contributor and rights-holder claims with evidence |
| May it be used? | not exposed | license, territorial/use scope, attribution, expiry, review |
| What exact content supports a claim? | no transcript/capture | authorized media/text capture, timecode, hash, extraction version |

## 6. Duration, views, access, tags, and dates

### 6.1 Duration

**FACT (high):** duration is optional and serialized as a variable-format string;
official examples show `12:22` and `03:45:00` [S4, S5]. No grammar states whether
two components always mean minutes/seconds, whether days/fractions/unknown/live
values occur, or whether the value is source-declared or measured.

**INFERENCE (high):** duration is a provider observation, not a safe parsing or
media-integrity guarantee. It may describe a current player item, a prior page
version, a clip, or a live/archive state. It cannot verify downloaded bytes.

**RECOMMENDATION (high):** retain raw duration plus a parse status. Normalize to
milliseconds only under an explicit reviewed grammar, keep parse uncertainty,
and separately store duration measured from an authorized manifest/media capture.

### 6.2 Views, subscription, and tags

**FACT (high):** `views` is an optional integer, but the response has no count
timestamp, source, precision, or “estimated” flag [S4].

**INFERENCE (high):** view count is mutable, platform-defined, potentially
rounded/delayed, and incomparable across platforms. It is not popularity at
query time unless the observation time and extraction path are known, and it is
not quality, authority, originality, or truth.

**FACT (high):** `requires_subscription` is optional Boolean. No public
definition covers login-only, rental/purchase, free trial, region restriction,
age gate, removed/private content, advertisements, or institutional entitlement
[S4]. Missing is not false.

**FACT (high):** `tags[]` is optional; the contract does not say whether tags are
publisher-supplied, platform metadata, or Brave-generated [S4].

**RECOMMENDATION (high):** model every mutable enrichment as
`provider_claim {raw_value, provider, observed_at, derivation=unknown}`. Access
must be a richer, separately checked state such as public, login, subscription,
transactional, geo-blocked, age-gated, private, removed, or unknown. Never use
missing fields as negative evidence.

### 6.3 Date and fetch clocks

**FACT (high):** Video results may carry:

- `age`: relative or absolute human display string;
- `page_age`: ISO-like source/page age;
- `page_fetched`: ISO datetime of last page fetch; and
- `fetched_content_timestamp`: optional integer when fetch metadata is requested
  [S2-S5].

**FACT (high, contradiction):** the service guide says `freshness` filters by
**discovery date** and describes latest uploaded videos. The API references say
the relevant date is reported by content, such as publication or last
modification. The skill's labels and use-case prose point to source page age and
publication [S1-S4].

**UNKNOWN:** whether `page_age` means video upload, initial publication, page
publication, last modification, platform metadata, feed date, or a selected
combination; timezone and range inclusivity; handling of future/missing/changed
dates; `fetched_content_timestamp` units/event; and whether `page_fetched`
identifies the source page, metadata fetch, thumbnail fetch, or exact snippet
version.

**INFERENCE (high):** a recently discovered old upload, a newly edited old video
page, and a newly uploaded video are different cases that this contract cannot
reliably distinguish. `page_fetched` does not prove video-byte or thumbnail-byte
freshness.

**RECOMMENDATION (high):** preserve clocks independently:

```text
provider_selected_page_age?       # raw Brave page_age; derivation ambiguous
source_claimed_uploaded_at?
source_claimed_published_at?
source_claimed_modified_at?
provider_discovered_at?           # absent from response
provider_page_fetched_at?
provider_fetch_timestamp_raw?
curiosity_first_seen_at
curiosity_page_fetched_at?
curiosity_media_fetched_at?
metadata_observed_at
```

Represent Brave filtering as `provider_freshness(clock=ambiguous_page_age)` until
Brave contractually clarifies and an authorized test validates it. Never parse
`age` as authoritative time or silently add a timezone to timezone-free
`page_age` examples.

## 7. Ranking, diversity, duplicates, and freshness

### 7.1 Public ranking evidence

**FACT (high):** results are an ordered list described as relevant video results
from a curated/dedicated index. Query, locale, SafeSearch, freshness, spellcheck,
and operators are the documented controls [S1-S4]. Array position is the only
public per-result rank evidence.

**UNKNOWN / negative result:** no Video-specific first-party source reviewed
specifies candidate generation, lexical/semantic/visual/audio matching,
transcript/caption use, title/description/tag weighting, platform authority,
creator reputation, view-count weight, freshness weight, click/watch signals,
video quality, spam/reupload handling, rank score, calibration, or explanation.
Broader Brave discovery/ranking statements do not establish Video weights.

**RECOMMENDATION (high):** preserve provider page and within-page rank exactly,
but do not convert rank, views, creator, or platform into truth/quality/authority.
Curiosity ranking should expose separate relevance, source quality, freshness,
novelty, independence, safety, rights, and accessibility stages.

### 7.2 Diversity and duplicate relations

**FACT (high):** no request control or response field represents platform,
domain, creator, owner, geographic, language, viewpoint, or source diversity.
No canonical, duplicate, reupload, clip, compilation, mirror, reaction,
translation, soundtrack, or same-event relation is documented [S2-S5].

**INFERENCE (high):** 50 result URLs do not imply 50 distinct audiovisual works,
recordings, creators, platforms, owners, events, or viewpoints. The same upload
can have aliases/embeds; the same work can be reuploaded or clipped; reactions
can incorporate source footage; a platform/channel can dominate; thumbnails can
be reused. URL deduplication alone cannot solve work or media identity.

**RECOMMENDATION (high):** create reversible relation layers:

1. **page identity** — normalized, resolved, final, canonical page URLs;
2. **platform item identity** — platform + native item/account IDs when lawfully
   derived and verified;
3. **rendition identity** — manifest/media hashes and technical metadata under
   authorized capture;
4. **work/version relation** — same work, edition, translation, reupload, clip,
   compilation, embed, reaction, or derivative;
5. **event/claim relation** — same recorded event or proposition; and
6. **ownership/source relation** — platform, uploader, creator, distributor, and
   rights holder kept separate.

Choose representatives without deleting membership or rank observations. Count
independent recordings/sources, not URLs, for corroboration or diversity.

### 7.3 Freshness consequence

**INFERENCE (high):** the product offers a useful date-shaped candidate filter
but not a reliable “newly uploaded video” guarantee. Freshness can refer to
discovery, reported publication, modification, or another selected page date,
and no effective clock is echoed per request/result.

**RECOMMENDATION (high):** Curiosity-owned time constraints must name their clock
(`uploaded_at`, `published_at`, `modified_at`, `first_seen_at`, or `fetched_at`),
return the effective clock/fallback, and reject ambiguous mapping when precision
matters.

## 8. Safety and hostile-content boundary

### 8.1 Published controls

**FACT (high):** `safesearch` defaults to `moderate`; `off` performs no adult
filtering, `moderate` filters explicit images/video while allowing adult domains,
and `strict` drops all adult content. The service guide paraphrases strict as
filtering explicit and suggestive content [S1-S3].

**FACT (high):** `query.show_strict_warning` can report that strict filtering
blocked relevant adult results, while `extra.might_be_offensive` warns at result-
set level [S4]. No per-result safety category, confidence, reason, or policy
version is documented.

**FACT (high, broader index):** Brave reports real-time phishing/malware lists
and active CSAM scans/blocking, including a third-party service [S7]. This is
index governance, not a guarantee about every page, thumbnail, later redirect,
or playable stream.

**INFERENCE (high):** SafeSearch is an adult-content retrieval policy, not a
certification of lawfulness, age suitability, factuality, violence level, hate,
self-harm, harassment, scams, manipulated media, prompt-injection safety,
malware safety, or rights. `might_be_offensive=false` cannot establish that every
result or linked resource is safe.

### 8.2 Curiosity safety requirements

**RECOMMENDATION (high):** separate:

1. requested adult/sensitive-content policy;
2. provider-applied mode and aggregate warnings;
3. page/thumbnail/media URL network and redirect policy;
4. bounded decoding/transcoding and active-content isolation;
5. per-thumbnail, frame, audio, text, and transcript safety evidence;
6. age/region/entitlement checks; and
7. final use/display decision with policy version and reviewer.

Treat URLs, titles, descriptions, tags, profile images, thumbnails, captions,
transcripts, and media as hostile external input. A later authorized fetcher
needs scheme/DNS/IP checks, redirect/time/byte/duration/frame/pixel/decompression
budgets, MIME sniffing, sandboxed maintained parsers/codecs, no automatic script
execution, and explicit handling of playlists/manifests and nested URLs. These
are Curiosity requirements, not claims about Brave internals.

## 9. Licensing, attribution, and access rights

**FACT (high):** the response has no license, rights holder, copyright status,
permitted-use, territorial scope, attribution text, content-owner verification,
or takedown-status field [S2-S5]. `requires_subscription=false` is not a license.

**FACT (high, not legal advice):** Brave's terms define third-party content to
include video, audio, images, and other materials. Such content may be linked or
included in Search Results; Brave does not grant the third party's rights, and
customer use can remain subject to owner/licensor rights. Results are supplied
without non-infringement, accuracy, completeness, security, or harmful-code
warranties [S13].

**FACT (high):** Brave maintains a DMCA removal process for indexed material.
Its special proxy-address instruction is for Image vertical results; the page
does not document a Video-specific rights grant or takedown metadata field [S16].

**INFERENCE (high):** indexing, rank, public watch-page availability, a named
creator, a platform label, a view count, a served thumbnail, or absence of a
subscription requirement does not imply permission to copy, download, embed,
transcribe, summarize, create frames/derivatives, train/evaluate, redistribute,
or commercially reuse the video or thumbnail.

**RECOMMENDATION (high):** default every page, thumbnail, audiovisual work,
caption, and transcript to `rights=unknown/discovery_only`. Preserve exact
license/terms evidence, rights-holder and creator claims, permitted purposes,
territory, attribution, expiration, access basis, and reviewer. Resolve platform
API/embed terms separately from content copyright and privacy/publicity rights.

## 10. Pagination, errors, versioning, and operations

### 10.1 Bounded live paging

**FACT (high):** `count` is 1–50 and `offset` is page number 0–9. The theoretical
window is therefore **500 ranked positions** (10 requests × 50), but actual pages
can be shorter and overlap [S1-S4].

**FACT (high):** no total count, cursor, snapshot ID, continuation token, or
`more_results_available` field is documented [S2-S4].

**INFERENCE (high):** this is bounded live page-number retrieval, not stable
snapshot export. Concurrent index/rank/metadata/safety changes can create repeats,
omissions, mutation, or reorder. “500” is an addressable ceiling, not a coverage
or uniqueness promise.

**RECOMMENDATION (high):** budget each page as a separate paid call. Stop on
empty/short page, configured page/time/cost ceiling, or repeated-candidate
saturation. Deduplicate across pages while retaining all observed page/rank/time
positions and `stop_reason`; never promise exhaustive video export.

### 10.2 Errors and rate limits

**FACT (high):** GET and POST references document 200 plus structured
`ErrorResponse` envelopes for 404, 422, and 429, with top-level `type`, required
`error`, and `time`. The rendered public references do not fully expand child
error semantics or enumerate auth, permission, timeout, 5xx, response-size, or
partial-result behavior [S2, S3].

**FACT (high):** rate limits use a one-second sliding window per subscription and
may include monthly limits. Every response exposes `X-RateLimit-Limit`,
`-Policy`, `-Remaining`, and `-Reset`; 429 indicates excess. Brave says only
successful, non-error requests count against quota and billing [S11].

**RECOMMENDATION (high):** classify invalid, auth, forbidden, rate-limited,
timeout, upstream, parse, empty, and partial failures; cap body/time/string/URL
sizes; parse unknown fields additively; honor rate headers with bounded jittered
retry; and redact key and sensitive query data. A client timeout can hide a
server-side success, so retries must not be assumed unbilled.

### 10.3 Version and cache drift

**FACT (high):** URL `v1` is the rare major boundary. `Api-Version: YYYY-MM-DD`
pins incompatible behavior; omission selects latest. Brave treats added optional
inputs/fields/resources and changed string length/format as backward compatible
[S10].

**FACT (high):** cached content is returned by default; `Cache-Control: no-cache`
is best effort [S2, S3]. Documentation does not identify whether this governs a
result cache, indexed page metadata, thumbnail delivery, or another layer.

**FACT (medium):** Brave publishes incident history and live status, but no
Video-specific standard-plan availability or latency SLA was found [S15].

**RECOMMENDATION (high):** pin and record a reviewed date version, endpoint,
method, requested controls, query rewrites, page/rank, response observation time,
and raw provider clocks. Treat titles, thumbnails, metadata, and order as
versioned observations rather than timeless facts.

## 11. Pricing, privacy, and contractual boundary

### 11.1 Pricing and economics

**FACT (high, as accessed 2026-08-17):** Video Search is included in the Search
plan at **$5 per 1,000 successful requests** ($0.005 each), with **$5 monthly
credit** and advertised capacity of **50 requests/second** [S11, S12]. Failed
requests are documented as unbilled [S11].

| Retrieval pattern | Successful requests | Search fee at list price |
| --- | ---: | ---: |
| One query, first page | 1 | $0.005 |
| One query, all 10 pages | 10 | $0.05 |
| 1M one-page video searches | 1,000,000 | $5,000 |
| 1M searches averaging 3 pages | 3,000,000 | $15,000 |

**INFERENCE (high):** asking for 50 candidates improves API fee per candidate
but increases untrusted metadata/image handling and does not improve provenance,
rights, safety, or uniqueness. Thumbnail delivery, source-page fetch, platform
API access, media transfer, transcription, storage, moderation, identity
resolution, and rights review are separate costs.

**UNKNOWN:** Video-specific latency distribution, uptime SLA, enterprise price,
tax, overage/credit mechanics, and any separate thumbnail-delivery lifetime or
traffic policy.

### 11.2 Query privacy

**FACT (high):** Brave's API privacy notice permits search-query records to be
retained for up to 90 days for billing and troubleshooting/legal obligations.
Brave says it does not collect identifiers linking a query to an end user/device,
but the customer account is known and the customer remains responsible for
notice/consent and applicable law. Enterprise ZDR is optional and legally
qualified [S14].

**RECOMMENDATION (high):** treat each video query as disclosure to a third party.
Do not submit private corpus text, secrets, identities, allegations, health or
political interests, or unnecessary location/user-agent data. Require explicit
retention authority and keep the key server-side.

### 11.3 Standard terms

**FACT (high, not legal advice):** terms last updated 2026-02-11 grant a limited,
revocable API/result license for customer applications. Unless changed by an
Order Form, restrictions include [S13]:

- storage/cache/database creation beyond transient operation;
- derivative works of API, documentation, or Search Results;
- redistribution, resale, or sublicensing of results;
- reverse engineering and rate/service-limit bypass;
- using the API to replicate or replace its functionality;
- using results to create, evaluate, train, retrain, fine-tune, benchmark, or
  improve AI models/services; and
- retention of results after termination.

The terms also require key protection and customer/end-user compliance, preserve
third-party rights, permit provider termination for convenience on ten days'
notice, and make attribution optional under standard wording but prescribed if
used [S13].

**RECOMMENDATION (high):** reject durable ingestion of Brave Video results,
thumbnail bytes, or derived video metadata into Curiosity's owned corpus under
the standard terms. Legal/procurement must approve the exact Order Form,
transient cache, display/embed, metadata normalization, evaluation, AI-assisted
use, deletion, and exit rights—and separately clear third-party media rights.
The public skill repository's MIT license covers that repository material, not
hosted API outputs, indexed videos/thumbnails, platform terms, or trademarks
[S4, S17].

## 12. Clean-room architecture lessons

| Public clue | Safe Curiosity lesson | Boundary |
| --- | --- | --- |
| dedicated video vertical [S1, S6] | separate eligibility/corpus policy from query ranking | do not copy source lists/classifiers |
| page URL plus video metadata [S4, S5] | page, platform item, work, and rendition are separate nodes | metadata is not media identity |
| creator/publisher/author fields [S4] | preserve account, creator, platform, and rights-holder roles separately | labels are not verified entities |
| served/original thumbnail URLs [S4] | thumbnails are independent resources with delivery lineage | do not import Image proxy guarantees |
| variable duration and mutable views [S4, S5] | retain raw provider observations and measured values separately | do not infer precision or quality |
| page age plus fetch metadata [S2-S4] | use named clocks and observation time | upload date remains unresolved |
| conflicting freshness prose [S1-S4] | effective clock and fallback belong in the contract | do not paper over discovery/content conflict |
| strict/moderate/off plus set warnings [S1-S4] | separate requested policy, provider decision, and local moderation | adult filtering is not general safety |
| page overlap and bounded window [S2-S4] | dedupe, saturation stops, and budgets are explicit | no stable/export semantics |
| additive date versioning [S10] | pin schema and parse unknown fields | latest is not reproducible history |
| no license/direct media/transcript [S2-S5, S13] | rights and evidence capture are separate governed stages | discovery is not permission or citation |

**REJECTED (high confidence):** scraping consumer Brave Video; decoding provider
URLs to imitate private behavior; downloading or replaying media without source
authority; copying undocumented rank/safety/dedup rules; using results to seed or
benchmark Curiosity; equating uploader with creator/rightsholder; interpreting
`requires_subscription=false` as reuse permission; treating thumbnails as video
evidence; or treating view count as authority.

## 13. Curiosity implications and verdict ledger

### 13.1 Adopted/adapted/rejected/deferred

| Verdict | Decision |
| --- | --- |
| **ADOPTED** | explicit candidate/page/cost bounds; page/platform-account/work/rendition separation; raw provider-rank preservation; named metadata observation time; separate content/fetch clocks; rights unknown by default |
| **ADAPTED** | Brave creator/publisher/author fields into typed entity claims; thumbnail served/origin split into derivative lineage; duration/views/access/tags into untrusted provider observations; SafeSearch/set warnings into one safety layer |
| **REJECTED** | Brave as owned video index/evidence archive; source page as video-byte identity; uploader as legal creator; view count as quality; freshness as upload-time guarantee; 500 positions as completeness; standard terms for durable corpus/benchmark use |
| **DEFERRED** | any API pilot; actual Order Form rights; authorized relevance/diversity/freshness study; metadata accuracy; thumbnail behavior; media/platform access; commercial SLA; transcript and rights workflows |

### 13.2 Minimum provider-neutral video model

**RECOMMENDATION (high):** author a Curiosity-native contract from owned needs,
not Brave's optional object shape:

```text
VideoSearchRequest
  query
  market? + content_languages[] + ui_locale?
  time_constraint? { clock, start?, end? }
  adult_content_policy
  media_constraints? { duration, live_state, captions, access }
  source_policy_id?
  page_size + page_budget + time_budget + cost_budget

RetrievalTrace
  provider + endpoint + api_version + observed_at
  original/altered/cleaned/executed_query + applied_operators
  requested_controls + unsupported_or_ambiguous_controls[]
  provider_page + provider_rank + stop_reason + warnings[]

VideoPageObservation
  observed_url + normalized_url + resolved/final/canonical_url?
  untrusted_title + description + host
  raw_page_age? + provider_page_fetched_at?
  capture_id? + content_hash?

PlatformItemClaim
  platform? + native_item_id? + account/profile claim?
  raw_duration? + parsed_duration? + measured_duration?
  raw_views? + metadata_observed_at
  access_claim? + tags[] + upload/publication claims[]

VideoWorkAndRendition       # owned enrichment only when authorized
  work_id? + contributor/creator claims[]
  rendition_id? + manifest/file provenance + technical metadata
  capture/hash? + transcript/caption/timecode evidence?
  page/embed/reupload/clip/translation/derivative relations[]

ThumbnailArtifact
  served_url? + origin_url? + resolved_url?
  capture/hash? + dimensions? + transform/derivative lineage?

Governance
  discovery_basis + fetch/playback basis
  rights/license/attribution evidence and state
  safety evidence/decision + access/region state + deletion state
```

### 13.3 Required bounded sequence if separately authorized

1. Accept provider output only as untrusted discovery metadata within declared
   page/time/cost limits.
2. Preserve request rewrite, controls, provider page/rank, warnings, version, and
   observation time.
3. Normalize page/profile/thumbnail URLs without assuming platform identity or
   decoding undocumented URL internals.
4. Resolve source terms, rights, access, and fetch/playback authority before any
   page, thumbnail, caption, manifest, or media retrieval.
5. Fetch each resource independently under network, redirect, byte, duration,
   frame, pixel, parser, and time budgets; capture authorized evidence immutably.
6. Separate provider-claimed from source-claimed and byte/media-measured metadata.
7. Resolve platform account, contributors, publisher/distributor, and rights
   holder as distinct claims/entities.
8. Build reversible page, item, rendition, work, clip/reupload, and event clusters;
   diversify and corroborate over independent sources/recordings, not URL count.
9. Apply per-resource safety, rights, access, and final-use policy before display,
   quotation, transcription, or analysis.

## 14. Fact / inference / recommendation ledger

| ID | Type | Claim / decision | Evidence | Confidence | Verdict |
| --- | --- | --- | --- | --- | --- |
| V1 | FACT | Video is a dedicated GET/POST ranked-video endpoint in Search. | S1-S4, S11-S12 | High | **ADAPTED** as bounded capability. |
| V2 | FACT | Brave calls the corpus dedicated/curated and the vertical independent. | S1-S3, S6 | High for vendor claim | **DEFERRED** physical architecture and quality. |
| V3 | INFERENCE | It is likely a video-eligible metadata/ranking view over Brave-controlled page-index infrastructure. | S1-S3, S6-S8 | Medium | **ADAPTED** only as conceptual layering. |
| V4 | FACT | Result URL identifies a source/watch page; no direct media/manifest is documented. | S4-S5 | High | **ADOPTED** page/rendition separation. |
| V5 | FACT | Duration, views, creator, publisher, access, tags, and author profile are optional metadata. | S4-S5 | High | **ADAPTED** as untrusted timed observations. |
| V6 | FACT | Freshness conflicts between discovery date and content-reported publication/modification age. | S1-S4 | High | **REJECTED** as precise upload-time filter. |
| V7 | FACT | Served and origin thumbnail URLs are distinct, but Video proxy guarantees are not published. | S4 | High / Medium on proxy inference | **ADAPTED** to explicit derivative lineage. |
| V8 | FACT | No rank score, duplicate/work relation, diversity control, total, cursor, snapshot, or continuation is documented. | S2-S5 | High | **REJECTED** for exhaustive/stable retrieval. |
| V9 | FACT | Moderate SafeSearch is default and warnings are aggregate/query-level. | S1-S4 | High | **ADAPTED** as one safety layer. |
| V10 | FACT | No result-level license or verified rights-holder field is documented. | S2-S5, S13 | High | **REJECTED** as reuse authority. |
| V11 | FACT | Search costs $5/1,000 successful calls, with $5 credit and 50 RPS. | S11-S12 | High | **ADAPTED** into explicit budgets. |
| V12 | FACT | API queries may be retained up to 90 days; enterprise ZDR is optional. | S14 | High | **REJECTED** for sensitive queries absent approved terms. |
| V13 | FACT | Standard terms constrain storage, derivatives, replacement, and AI evaluation/training. | S13 | High | **REJECTED** for owned corpus/benchmark use absent written rights. |
| V14 | RECOMMENDATION | Curiosity must own captures, typed entity/work relations, metadata observations, rights, and safety decisions. | Analysis | High | **ADOPTED**. |

## 15. Unknowns, negative results, and verification gates

### 15.1 Material unknowns retained

1. Physical/logical relation between Video and Brave's general Web index.
2. Video corpus size, platform/source list, admission/removal, regional/language
   distribution, and live/Shorts/podcast/playlist coverage.
3. Discovery path and metadata extraction sources: crawl, feeds, sitemaps,
   structured data, platform APIs, oEmbed, captions, or other lanes.
4. Ranker features, platform/creator diversity, host caps, spam/reupload policy,
   duplicate/work clustering, and score calibration.
5. Freshness clock, date derivation, timezone, inclusivity, and fallback.
6. Duration grammar/accuracy; view-count observation time/precision; semantics of
   creator versus author; publisher normalization; access-state accuracy; tag
   provenance.
7. `page_fetched` and `fetched_content_timestamp` event, units, cache relation,
   and binding to exact metadata/snippet/page bytes.
8. Thumbnail `src` proxy/transform/cache/lifetime/privacy behavior, dimensions,
   formats, and binding to `original` and video version.
9. Complete error catalogue, auth/5xx/timeout/partial behavior, response-size
   limits, retry idempotence, and Video-specific latency/availability SLA.
10. Exact Order Form rights for transient caching, thumbnail display, embedding,
    metadata normalization, monitoring, citation, evaluation, and AI-assisted
    research.

### 15.2 Negative source results

- No stable result, platform-item, work, rendition, creator, or snapshot ID found.
- No media file, streaming manifest, embed, caption, transcript, chapter, codec,
  dimensions, content hash, or immutable capture field found.
- No canonical, duplicate, reupload, clip, compilation, derivative, or same-event
  relation found.
- No verified creator, contributor, publisher owner, rights holder, license, or
  attribution field found.
- No duration filter, platform/creator filter, view filter, caption/live/access/
  license filter, or diversity control found.
- No rank score/explanation, total, cursor, continuation flag, or non-overlap
  guarantee found.
- No public Video corpus count, platform list, coverage audit, quality benchmark,
  or metadata-accuracy statement found in scope.
- No public reconciliation found for discovery-date versus content-date freshness.
- No basis found to transfer Image Search's documented thumbnail-resize/privacy
  semantics to Video Search.
- No live behavior was tested; all production conformance and quality remain
  empirically unverified.

### 15.3 Gates before any authorized pilot

- **Legal/procurement:** actual Order Form; result/metadata/cache/evaluation rights;
  platform and source-content terms; thumbnail/embed/transcript/media rights;
  ZDR/DPA; attribution; takedown/deletion; SLA and termination exit.
- **Contract:** archive a dated schema and pin `Api-Version`; obtain exact enum
  lists, duration grammar, creator/author/publisher semantics, freshness/fetch
  clocks, thumbnail behavior, complete errors, and rate policy from Brave.
- **Offline fixtures:** customer-created or expressly licensed synthetic fixtures
  only; test unknown/missing/null fields, variable duration, large/mutable views,
  timezone-free dates, malformed URLs, cross-host thumbnails, duplicate pages,
  oversize strings/tags, markup, and query alteration.
- **Authorized live study:** only if terms expressly permit; predeclare query,
  page, time, storage, and cost budgets; measure recall, date/metadata accuracy,
  stale/private/deleted links, paging overlap, platform/account/work diversity,
  reupload/clip rate, thumbnail stability, safety errors, latency/errors, and
  effective fee. Do not use results to evaluate AI without written permission.
- **Exit:** provider outage/ten-day termination scenario and verified deletion of
  results, thumbnails, and derived provider metadata as contractually required.

## 16. Bounded curiosity pass

After synthesis, in-frame gaps were scored 1 (low) to 5 (high). Cost includes
access, rights, clean-room, and interpretation risk. Follow-up authority was
limited to public first-party documents; no autonomous live investigation was
authorized.

| Thread | Relevance | Value | Novelty | Cost | Outcome |
| --- | ---: | ---: | ---: | ---: | --- |
| Reconcile freshness clock | 5 | 5 | 5 | 1 | **Pursued:** service says discovery/latest upload; references say content-reported publication/modification; contradiction retained [S1-S4]. |
| Resolve page/video/thumbnail resource roles | 5 | 5 | 4 | 1 | **Pursued:** skill identifies source page and served/origin thumbnails; no playback-media URL exists [S4-S5]. |
| Clarify creator/author/publisher semantics | 5 | 5 | 4 | 1 | **Pursued:** fields and examples found, but no precedence/verification contract; role ambiguity retained [S4-S5]. |
| Find duration/views observation semantics | 5 | 4 | 4 | 1 | **Pursued:** duration is explicitly variable-format; no view timestamp/precision or measurement basis found [S4]. |
| Find license/rights/access evidence | 5 | 5 | 3 | 1 | **Pursued:** no result license; subscription Boolean is narrow; terms preserve third-party video/image rights [S4, S13]. |
| Establish index lineage | 5 | 4 | 4 | 2 | **Pursued:** dedicated/independent vertical and Brave-controlled general crawl context supported; physical relation remains unknown [S1-S3, S6-S8]. |
| Infer ranking or duplicate thresholds from examples | 3 | 2 | 4 | 5 | **CURIOSITY_NO_GO:** proprietary, statistically invalid, contract-sensitive, and unnecessary for contract lessons. |
| Call API to measure platform diversity/freshness/safety | 5 | 4 | 4 | 5 | **CURIOSITY_NO_GO:** no credentials, paid-test, benchmark, or retention authority; defer to reviewed pilot. |
| Fetch thumbnails to reverse engineer proxy transforms | 2 | 2 | 4 | 5 | **CURIOSITY_NO_GO:** no interoperability need; Video-specific guarantees are absent and source rights/authority are unresolved. |
| Fetch or download videos/transcripts for metadata validation | 4 | 4 | 4 | 5 | **CURIOSITY_NO_GO:** source/platform rights, safe media pipeline, storage authority, and live-test authorization are absent. |
| Enumerate all indexed platforms/creators through probing | 4 | 3 | 4 | 5 | **CURIOSITY_NO_GO:** bounded outputs cannot prove corpus policy and probing is unauthorized. |
| Jurisdiction-by-jurisdiction audiovisual rights analysis | 4 | 4 | 3 | 5 | **CURIOSITY_NO_GO:** legal advice and asset-specific facts are outside authority; counsel workflow is the proper gate. |

**Stop condition:** requested coverage and public-source saturation. Remaining
high-value questions require Brave clarification, an actual Order Form, an
authorized bounded live study, source/platform access, or legal review. Private
ranking/proxy reconstruction would neither be clean-room nor change the
architecture verdict.

## 17. Primary source ledger

All sources below are first-party Brave materials accessed **2026-08-17**.
Vendor documentation establishes published contract or vendor claims, not
production conformance, comparative quality, safety accuracy, corpus coverage,
metadata truth, or third-party rights.

| ID | Primary source | Material used |
| --- | --- | --- |
| S1 | [Video Search service guide](https://api-dashboard.search.brave.com/documentation/services/video-search) | dedicated/curated index, features, discovery/upload freshness prose, locale, operators, paging, safety, spellcheck, changelog |
| S2 | [GET Video Search reference](https://api-dashboard.search.brave.com/api-reference/videos/video_search/get) | endpoint, request defaults/bounds, content-reported freshness, cache/user-agent/version headers, response envelope, overlap, errors |
| S3 | [POST Video Search reference](https://api-dashboard.search.brave.com/api-reference/videos/video_search/post) | JSON-body parity, defaults/bounds, freshness, response/errors |
| S4 | [Official Brave Videos Search skill](https://github.com/brave/brave-search-skills/blob/main/skills/videos-search/SKILL.md) | expanded response/query schema; source, thumbnail, duration, views, creator/publisher/access/tags/author, dates, warnings |
| S5 | [Brave Search API product page](https://brave.com/search/api/) | official Video result sample, current product/index positioning, current price/capacity/index claims |
| S6 | [2023 Image/News/Video API announcement](https://brave.com/blog/brave-search-api-update/) | direct vertical launch and independent-index claim |
| S7 | [Search API security](https://api-dashboard.search.brave.com/documentation/resources/security) | selected general-index clues, discovery lanes, malware/phishing/CSAM controls, governance |
| S8 | [Brave Search crawler](https://search.brave.com/help/brave-search-crawler) | crawler/index behavior and WDP relation |
| S9 | [Search operators](https://api-dashboard.search.brave.com/documentation/resources/search-operators) | broad syntax and experimental/empty-result caveats; used cautiously because examples target Web |
| S10 | [API versioning](https://api-dashboard.search.brave.com/documentation/guides/versioning) | URL/date versions and compatible-change policy |
| S11 | [Rate limiting](https://api-dashboard.search.brave.com/documentation/guides/rate-limiting) | sliding window, headers, successful-request quota/billing semantics |
| S12 | [Current pricing](https://api-dashboard.search.brave.com/documentation/pricing) | Search price, credit, Video inclusion, 50-RPS capacity, enterprise options |
| S13 | [Search API Terms of Use](https://api-dashboard.search.brave.com/documentation/resources/terms-of-service) | 2026-02-11 license/restrictions, video/image third-party rights, disclaimers, attribution, termination |
| S14 | [Search API privacy notice](https://api-dashboard.search.brave.com/documentation/resources/privacy-notice) | 90-day query logs, customer duties, account data, enterprise ZDR |
| S15 | [Status updates](https://api-dashboard.search.brave.com/documentation/resources/status-updates) | public incident history and live status link |
| S16 | [Brave Search DMCA process](https://search.brave.com/help/copyright-dmca) | copyright takedown governance; Image-specific proxy instruction contrasted with absent Video rights metadata |
| S17 | [Official skill repository license](https://github.com/brave/brave-search-skills/blob/main/LICENSE) | MIT scope for repository material, not hosted outputs or third-party content |

## 18. Verification record

- Read the repository constitution before research and changed only this dossier.
- Triangulated GET/POST request defaults, paging, freshness, response envelope,
  and errors across service guide, endpoint references, official skill, and
  official product sample.
- Triangulated field-level metadata and its optional/ambiguous nature across the
  official skill and product sample; did not promote examples into presence or
  accuracy guarantees.
- Triangulated vertical/index lineage through launch announcement, current Video
  guide/reference, crawler help, and API security; retained physical architecture
  and per-result discovery path as unknown.
- Triangulated commercial, privacy, rights, version, and operational boundaries
  across pricing, rate limit, terms, privacy, status, security, DMCA, and license
  pages.
- Preserved material contradictions and negative results: discovery versus
  content-date freshness; dedicated index versus unknown physical relationship;
  served thumbnail versus absent Video proxy guarantees; rich metadata versus no
  immutable media identity; bounded pages versus no snapshot/continuation.
- No credentials, API calls, paid tests, Search Result retention, consumer UI
  scraping, source-page/thumbnail/video fetch, benchmark, bypass, private behavior
  reconstruction, copied implementation, or edit outside
  `docs/research/products/brave-video-search-api.md` was performed.
