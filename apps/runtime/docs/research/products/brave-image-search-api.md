# Brave Image Search API: clean-room product dossier

**Research date / source access date:** 2026-08-17  
**Product boundary:** Brave Search API `GET /res/v1/images/search` as a
standalone image-retrieval surface. Consumer Brave Images, Web Search image
clusters, and Brave's broader Web index are considered only where first-party
material clarifies provenance, safety, indexing, or rights.  
**Status:** primary-source desk research and architecture recommendations; no
account, credential, paid/free authenticated call, endpoint probing, traffic
inspection, downloaded Search Result, benchmark, or implementation.  
**Clean-room boundary:** public Brave documentation, policy pages, and Brave's
public official skill repository only. No attempt was made to reconstruct
private ranking, crawling, proxying, or safety code.

## Executive verdict

**ADAPTED as a contract and privacy pattern; REJECTED as Curiosity's owned image
index or evidence foundation (high confidence).** Brave exposes a compact,
image-specific contract: one query can return up to 200 results, each relating a
landing page to an original-image URL, a Brave-proxied approximately 500-pixel
thumbnail, a low-resolution proxied placeholder, optional dimensions, page
crawl time, host display metadata, and a coarse relevance confidence. Strict
adult filtering is the default, and there is no pagination [S1-S3].

The most valuable design clue is the **three-way separation of landing page,
original asset, and privacy-preserving derivative**. These are different
resources with different hosts, trust, durability, and rights. Curiosity should
adopt that separation, but strengthen it with immutable capture/hash identity,
redirect history, measured media metadata, derivative lineage, rights evidence,
per-asset safety decisions, and duplicate/near-duplicate clusters.

The API is discovery, not a license or evidence archive. No result field states
copyright owner, creator, license, permitted use, attribution terms, canonical
asset, content hash, MIME type, byte size, or immutable version. Brave itself
warns customers to consider copyright and licensing; its terms say images may be
third-party content and do not grant the third party's rights [S1, S9]. A
proxied thumbnail improves fetch privacy and reduces origin load, but does not
make an image reusable or prove who owns it.

Ranking, image freshness, diversity, duplicate suppression, and effective
coverage remain opaque. The public surface provides no freshness filter,
cursor, offset, total estimate, rank score, rank explanation, source-diversity
control, visual-similarity relation, or snapshot identifier. `page_fetched` is
the landing page's last crawl time, not proof of when image bytes were fetched
or that the returned asset still matches that page [S2, S3].

Commercially, Image Search is included in the Search plan at **$5 per 1,000
successful requests**, with $5 monthly credit and advertised capacity of 50
requests/second. Standard terms prohibit durable result storage beyond
transient operation, derivative works, redistribution, API replacement, reverse
engineering, and AI training/evaluation/benchmark use [S7-S9]. Any pilot or
image display therefore requires separately reviewed commercial and source-
content rights; this report grants neither.

## 1. Decision frame and bounded questions

### 1.1 Decision

What should Curiosity learn from Brave Image Search API's public product
contract without depending on Brave's hosted index, copying private behavior,
or mistaking image discovery for provenance, permission, or safe content?

### 1.2 Bounded sub-questions

1. What request and response fields are public, and which bounds are hard?
2. How do the landing page, original asset URL, thumbnail, placeholder, and
   hosts relate?
3. What provenance, dimensions, crawl metadata, rights, and safety evidence do
   results provide—and omit?
4. What is publicly known about indexing, ranking, diversity, freshness,
   duplicates, and the one-request result window?
5. What errors, version drift, limits, pricing, privacy, and terms affect use?
6. Which high-level ideas transfer clean-room into Curiosity's owned,
   provider-neutral image contract?

**Depth budget:** first-party public sources for every requested category,
triangulating material commercial, safety, index, and rights claims. No live
quality test, source-image download, paid access, private schema discovery,
jurisdiction-specific copyright opinion, or proprietary algorithm inference.

Labels below:

- **FACT** — directly supported by cited first-party material.
- **INFERENCE** — the narrowest architecture consequence of cited facts; not an
  observation of Brave internals.
- **RECOMMENDATION** — proposed Curiosity treatment.
- Confidence is **high**, **medium**, or **low**.

## 2. Product identity and index relationship

**FACT (high):** the endpoint is
`GET https://api.search.brave.com/res/v1/images/search`, authenticated with an
`X-Subscription-Token`. Brave calls it access to a “large independent index of
images” and separately says the service continuously crawls and indexes images
from sources across the Web [S1-S3]. It is a raw result-list product, not an
image generator, visual-question-answering service, reverse-image search API,
or page-content extractor.

**FACT (medium, vendor claim):** Brave says the image index contains “billions”
of images, but publishes no exact current count or counting method [S1]. Its
broader product page says the Web index contains more than 30 billion pages and
receives more than 100 million page updates per day [S7]. Those page figures do
not establish the image corpus size or image refresh rate.

**FACT (high, broader index context):** Brave says its general crawler discovers
pages and indexes content; opt-in Web Discovery Project data partially assists
discovery. Its API security page says it knows more than 100 billion URLs but
indexes a selected 20-billion-plus subset based on real-person visits,
multi-page links/reputation transfer, and curated RSS, while using malware,
phishing, and CSAM controls [S10, S11].

**INFERENCE (medium):** Image Search likely depends on landing-page discovery
and crawl/index data, then extracts and separately serves image candidates. The
public contract is consistent with this because every result binds an image
asset to a page URL and `page_fetched`, but it does not prove whether Brave has
one physical index, separate Web/image indexes, shared ranking stages, or an
origin-image cache.

**UNKNOWN:** exact image eligibility rules; crawl user agent/request behavior
for image assets; feed/sitemap/structured-data inputs; canonicalization;
animated/vector support; index language/region distribution; deletion latency;
whether every API image comes solely from Brave's own crawler/index path; and
whether consumer Brave Images and the API have identical candidates/order.
Consumer Brave Search says its results are served solely from its independent
index [S12], but consumer Google fallback behavior must not be imputed to this
API.

## 3. Request contract

### 3.1 Transport, controls, and bounds

**FACT (high):** Image Search exposes GET only in the public reference; unlike
Brave Web, News, Video, and LLM Context, no POST twin is listed [S2]. The
documented request is:

| Input | Type/default | Documented semantics |
| --- | --- | --- |
| `q` | required string | non-empty; maximum 400 characters and 50 words |
| `search_lang` | enum; `en` | preferred result language; code length 2+ |
| `country` | enum; `US` | preferred result country; supported two-letter code or `ALL` |
| `safesearch` | enum; `strict` | `strict` drops adult content; `off` applies no content filtering except illegal content |
| `count` | integer; `50` | 1–200 results; actual count may be lower |
| `spellcheck` | boolean; `true` | corrected query is always searched; correction appears in `query.altered` |
| `Api-Version` | date header; latest | pins dated contract behavior |
| `Cache-Control` | `no-cache` | asks Brave not to return cached content, on a best-effort basis |
| `User-Agent` | string | may change experience based on device |
| `Accept` | `application/json` | JSON is the documented media type |

Sources: [S1-S4]. Authentication is server-side credential material; Brave says
never to expose the key in client code or public locations [S4].

### 3.2 Important absences

**FACT (high):** the image reference provides no `offset` and explicitly says
Image Search is not paginated: raise `count` to obtain more results, up to 200
[S1, S2]. It also documents no freshness/date, image size, dimensions, aspect
ratio, color, image type/file format, usage-rights/license, source-site,
orientation, transparency, animation, face, or visual-similarity filter.

**FACT (high):** no Image Search request parameter for Goggles, search
operators, UI language, exact location, result decoration, or extra metadata is
listed [S2, S3]. Brave documents some of those capabilities for other products,
but they must not be projected onto Image Search.

**INFERENCE (high):** country and language are relevance preferences, not
provenance constraints. The response does not echo an effective country or
language and has no per-result language. A caller cannot prove that every
result originated in the requested jurisdiction or language.

**RECOMMENDATION (high):** a provider-neutral query should separate textual
query, preferred locale, hard content policy, result budget, and desired media
properties. An adapter must report unsupported filters rather than silently
pretending Brave enforced them.

## 4. Response contract and image relationships

### 4.1 Top-level envelope

**FACT (high):** a 200 response has `type: "images"`, a required `query`
object, required `results[]`, and required `extra` object [S2, S3]. The official
Brave skill expands the public shape as follows:

```text
query:
  original
  altered?                 # spell-corrected query
  spellcheck_off?
  show_strict_warning?

results[]:
  type                     # "image_result"
  title?
  url?                     # landing/page URL
  source?                  # source/page domain
  page_fetched?            # last landing-page crawl time
  thumbnail: src?, width?, height?
  properties: url?, placeholder?, width?, height?
  meta_url: scheme?, netloc?, hostname?, favicon?, path?
  confidence?              # low | medium | high

extra:
  might_be_offensive
```

Source: [S3]. Most result children are optional in the official field table.
Parsers therefore cannot assume title, page URL, original URL, dimensions, or
thumbnail dimensions exist for every item.

### 4.2 Landing page, asset, and derivatives

The central relation is:

```text
results[].url                    landing page where Brave found/presents image
  host ~= source/meta_url host   page/display provenance
        |
        +-- properties.url       original/full-size image asset URL
        |     host may differ    CDN/media host; unproxied source URL
        |
        +-- thumbnail.src        Brave image-proxy derivative (~500px width)
        |
        +-- properties.placeholder
                                  smaller Brave-proxy derivative
```

**FACT (high):** Brave documents `results[].url` as the source page URL and
`properties.url` as the original image URL. `thumbnail.src` is cached and served
through Brave's `imgs.search.brave.com` proxy, resized to 500 pixels wide while
maintaining aspect ratio. `properties.placeholder` is also a Brave-proxied,
low-resolution URL [S1, S3].

**FACT (high):** Brave states two proxy purposes: reducing requests/load on
origin image servers and preventing those servers from tracking end users,
because the origin sees Brave infrastructure rather than the user's device
[S1]. The proxy URL is therefore a delivery/privacy artifact, not the original
publisher URL.

**INFERENCE (high):** page host and asset host are independent provenance
dimensions. A stock-photo page may reference an image on a CDN, and Brave's
example does exactly that. `source`/`meta_url` identify the landing-page host;
they do not establish that host as copyright owner, image creator, or asset-host
operator [S2, S3].

**INFERENCE (high):** “original” or “full-size” describes the source URL role,
not an immutable or maximum-resolution byte object. The URL may redirect,
expire, deny hotlinking, vary by headers, return different bytes later, or cease
to resolve. The response provides no ETag, content hash, media type, response
length, redirect chain, capture ID, or origin-fetch timestamp.

**INFERENCE (medium):** the thumbnail and placeholder are independently
addressable derivatives, but the public contract does not expose derivative
generation time, source-byte hash, crop/fit details beyond the 500-pixel width
and aspect-ratio statement, encoding, quality, cache expiry, or guaranteed
stability. Their URLs must not be treated as permanent identifiers.

### 4.3 Dimensions and metadata

**FACT (high):** `thumbnail.width/height` and
`properties.width/height` are optional integers. Brave says original-image
dimensions are “often” present but not always available [S1, S3].

**INFERENCE (high):** dimensions are provider observations, not validated media
facts. Width without height, stale values, metadata from a prior image version,
or mismatch after redirects are all representable. Curiosity must inspect
authorized bytes and record measured dimensions separately from provider-
claimed dimensions.

**FACT (high):** `page_fetched` is described by the official skill as the ISO
datetime of the last **page crawl** [S3]. It is not named `image_fetched`.

**INFERENCE (high):** `page_fetched` gives useful landing-page observation
context but does not prove when the image was first seen, last fetched, changed,
indexed, proxied, or returned. Nor does it prove the page still embeds the image
at request time. `Cache-Control: no-cache` is best effort and cannot turn this
field into an origin-image freshness guarantee [S2].

**FACT (medium):** the service overview says results “typically” include title
and description, but neither the rendered API response schema nor the official
skill lists a result `description` field [S1-S3].

**UNKNOWN / negative result:** no reliable public contract for image
description was found. Consumers should not depend on it unless a pinned schema
or authorized fixture establishes it.

### 4.4 Provenance sufficiency

| Provenance question | Public response | What Curiosity still needs |
| --- | --- | --- |
| Where was it discovered? | landing URL, source domain, display URL parts | redirect/final URL, canonical relation, discovery path, page capture |
| Where are image bytes hosted? | `properties.url` | redirect chain, final host, fetch basis, headers, capture/hash |
| What did Brave display? | proxied thumbnail and placeholder URLs | derivative bytes/hash, transform recipe/version, source-capture link |
| When was it seen? | optional landing `page_fetched` | asset first/last seen, fetched, indexed, and response-observed times |
| Who created/owns it? | not exposed | creator, publisher, rights holder, evidence |
| May it be reused? | not exposed | license/terms URL, scope, attribution, expiry, legal review |
| Is it the same image as another result? | not exposed | exact/perceptual hashes and duplicate/syndication cluster |
| Why this rank? | array position and optional confidence | score, stage, feature/reason classes, rerank trace |

**RECOMMENDATION (high):** treat every URL, title, host string, favicon, image,
and dimension as untrusted external data. A Brave result is a discovery lead,
not a source-of-record artifact. Independently validate authorized landing and
asset resources under bounded fetch policy before citation, display, analysis,
or reuse.

## 5. Rights, licensing hints, and attribution

**FACT (high):** the Image Search guide explicitly tells users to be aware of
copyright and licensing when using discovered images [S1]. The result schema has
no license or rights field [S2, S3].

**FACT (high, not legal advice):** Brave's terms define third-party content to
include images and say it may be referenced, linked, or included in Search
Results. Brave does not grant the third party's rights. Customer use may be
subject to the owner's or licensor's intellectual-property rights, and results
are provided without a non-infringement warranty [S9].

**FACT (high):** Brave operates a DMCA removal process. For an image result in
the consumer Images vertical, it asks claimants for both Brave
`imgs.search.brave.com` addresses—the thumbnail and original-size displayed
image—as well as identifying work/location information [S13]. This is evidence
of takedown governance, not a license signal.

**INFERENCE (high):** neither presence in Brave's index nor delivery through
Brave's proxy implies public-domain status, permission to copy, or permission to
create derivatives. Even a stock-library domain in `source` does not reveal the
specific asset's purchasable license or whether the indexed rendition was
authorized.

**RECOMMENDATION (high):** Curiosity should preserve a rights state per asset:
`unknown`, `claimed`, `verified`, `restricted`, or `removed`, with the exact
license/terms evidence, holder/creator claims, permitted purposes, attribution,
jurisdiction, capture date, and reviewer. Default unknown rights to discovery-
only; do not infer permissions from host categories or metadata.

## 6. Safety and hostile-content boundary

### 6.1 Published SafeSearch behavior

**FACT (high):** Image Search has only `strict` and `off`; there is no API
`moderate` mode. `strict` is the default and drops adult content. `off` disables
content filtering except illegal content. Brave warns that disabling SafeSearch
may return adult or inappropriate content and recommends additional moderation
for application-specific needs [S1-S3].

**FACT (high):** the response can expose two aggregate signals:
`query.show_strict_warning` indicates strict filtering hid relevant results, and
`extra.might_be_offensive` indicates that the result set may contain offensive
content [S3]. No per-result adult/offensive category or classifier reason is
documented.

**FACT (high, broader system):** consumer Brave explains that adult
classification uses multiple mechanisms, including third-party lists and
machine-learning models, and invites reports of inappropriate classifications.
The API security page separately reports real-time phishing/malware lists and
CSAM scanning/blocking, including a third-party service [S10, S14].

**INFERENCE (high):** strict filtering is a fallible retrieval policy, not a
safety certification. `might_be_offensive=false` cannot establish that every
asset is appropriate, lawful, nonviolent, nonhateful, nondeceptive, or safe for
a specific age/jurisdiction. Likewise, index-level URL controls do not validate
the bytes later returned by an origin URL.

### 6.2 Curiosity safety implications

**RECOMMENDATION (high):** separate:

1. requested safety policy;
2. provider-applied mode and query/set warnings;
3. URL/host/network fetch policy;
4. measured media type, dimensions, and bounded decoding;
5. per-asset content classifiers and human-review state; and
6. final use/display decision with policy version.

Original and proxied image URLs remain hostile inputs. Curiosity should apply
scheme and DNS/IP checks, redirect limits, byte/pixel/frame/decompression
budgets, timeout limits, MIME sniffing, sandboxed maintained decoders, metadata
stripping where authorized, and no automatic browser rendering of unvalidated
SVG/HTML/polyglot payloads. These are Curiosity requirements, not claims about
Brave's private proxy implementation.

## 7. Ranking, relevance, diversity, duplicates, and freshness

### 7.1 What the contract reveals

**FACT (high):** results are returned as a list, and each may carry
`confidence` of `low`, `medium`, or `high`; the official skill glosses this as
relevance [S3]. No numeric score, score scale, rank explanation, or tie behavior
is exposed.

**INFERENCE (high):** array order is usable as observed provider rank, but the
coarse confidence must not be converted into calibrated probability, image
quality, authority, truth, safety, or rights confidence. Its derivation and
relationship to ordering are undocumented.

**FACT (high):** `country`, `search_lang`, spell correction, and query text are
the only documented relevance controls. There is no freshness filter and no
source-policy reranker/Goggles parameter on this endpoint [S2, S3].

**UNKNOWN / negative result:** no first-party public specification was found for
candidate generation, text/vision embeddings, OCR/alt-text/caption use,
link/popularity inputs, image quality, resolution preference, click signals,
freshness weighting, host caps, source-owner diversity, exact duplicates,
resized/cropped/near-duplicate grouping, syndicated images, spam/watermark
handling, or adult classifier thresholds.

### 7.2 Diversity and duplicate implications

**INFERENCE (high):** 200 results do not imply 200 distinct images, landing
pages, hosts, publishers, owners, viewpoints, or events. One asset can appear at
multiple page URLs, one page can use a CDN host, and visually equivalent crops
or encodings can have different URLs. Conversely, the same asset URL can mutate.

**RECOMMENDATION (high):** retain provider rank and provider confidence exactly
as observed, then perform Curiosity-native deduplication and diversification in
separate auditable stages using normalized landing/asset URLs, exact byte hashes,
perceptual hashes/embeddings, page/publisher/owner clusters, and rights/safety
state. Keep every membership edge; do not erase provenance when choosing a
representative.

### 7.3 Freshness semantics

**FACT (high):** the endpoint has no date/freshness input and no image
publication, creation, modification, or asset-fetch date. Its only result time
is optional `page_fetched`, the landing page's last crawl time [S2, S3].

**INFERENCE (high):** a newly crawled page may contain an old image, and an old
page crawl may point to a recently changed asset. Therefore `page_fetched`
cannot support “recent images” without additional evidence.

**RECOMMENDATION (high):** Curiosity should type and source at least
`claimed_created_at`, `claimed_published_at`, `page_fetched_at`,
`asset_first_seen_at`, `asset_fetched_at`, `asset_changed_at`, `indexed_at`, and
`retrieved_at`. Missing clocks remain missing; never collapse them into one
ambiguous `freshness` value.

## 8. Result window, errors, versioning, and operations

### 8.1 One bounded result window

**FACT (high):** Image Search is explicitly not paginated. `count=200` is the
largest documented window, and Brave may return fewer than requested [S1, S2].
There is no continuation flag, cursor, offset, total-match estimate, or snapshot
identifier.

**INFERENCE (high):** 200 is a response ceiling, not a completeness claim. A
caller cannot enumerate the corpus or recover “the next 200.” Reissuing the same
query is not documented as stable and may produce changed/reordered results as
the index, spellchecker, classifiers, or API version changes.

**RECOMMENDATION (high):** model `count` as a candidate budget and record
`stop_reason=provider_window_exhausted|fewer_available|policy_filtered`, where
the distinction is actually known. Do not synthesize pagination by query
variants unless a separately declared research frame authorizes bounded query
expansion.

### 8.2 Errors and quota

**FACT (high):** the rendered Image Search reference explicitly documents 200,
404, 422, and 429. Error envelopes contain top-level `type`, required `error`,
and `time`; the child error catalogue is not fully expanded in the rendered
public page [S2].

**UNKNOWN / negative result:** the image reference does not enumerate all
authentication, permission, timeout, 5xx, malformed-body, proxy-asset, or
partial-result failures. It does not publish a response-byte ceiling or server
latency/uptime SLA.

**FACT (high):** rate limiting uses a one-second sliding window per
subscription, potentially alongside monthly limits. Responses expose
`X-RateLimit-Limit`, `-Policy`, `-Remaining`, and `-Reset`; 429 indicates excess.
Only successful, non-error requests count against quota and billing [S6].

**RECOMMENDATION (high):** pin budgets for calls, response bytes, strings, URLs,
and results; parse unknown fields additively; classify invalid, auth,
permission, rate, timeout, upstream, parse, empty, and partial failures; honor
rate headers with bounded jittered retry; and redact keys and sensitive query
text. Do not automatically fetch 200 original assets merely because one search
returned them.

### 8.3 Version and cache drift

**FACT (high):** URL `v1` is the rarely changed major version. `Api-Version:
YYYY-MM-DD` can pin backward-incompatible behavior; omission selects latest.
Brave considers new optional request parameters, new response properties,
property reordering, and changes to string length/format backward compatible
[S5].

**FACT (high):** Brave says cached content is returned by default and
`Cache-Control: no-cache` is best effort [S2]. The public page does not identify
which layer—result response, landing-page metadata, image bytes, thumbnail, or
another cache—the request header governs.

**RECOMMENDATION (high):** record endpoint, date version, request controls,
response observation time, result position, and all raw provider timestamps.
Treat proxy URLs, dimensions, titles, confidence, and ordering as versioned
observations, not timeless facts.

## 9. Pricing, privacy, and contractual boundary

### 9.1 Pricing and economics

**FACT (high, as accessed 2026-08-17):** Image Search is included in the Search
plan at **$5 per 1,000 successful requests** ($0.005/request), with $5 monthly
credit and advertised capacity of 50 requests/second [S7, S8]. Failed requests
are documented as unbilled [S6].

| Search pattern | Successful requests | Brave fee at list price |
| --- | ---: | ---: |
| One image query, `count=1` | 1 | $0.005 |
| One image query, `count=200` | 1 | $0.005 |
| 1 million image queries | 1,000,000 | $5,000 |

**INFERENCE (high):** requested/returned result count does not change the API
request fee, but it changes response transfer, validation, rights review,
moderation, deduplication, and any downstream origin fetch/storage cost. One
timed-out client call may have succeeded server-side, so retries should not be
assumed free.

**UNKNOWN:** image-specific latency distribution, availability SLA, overage and
credit mechanics, enterprise price, regional tax, and whether proxy image
delivery has separate undocumented traffic/lifetime constraints.

### 9.2 Query privacy

**FACT (high):** Brave's API privacy notice says search-query records are kept
for up to 90 days for billing and troubleshooting/legal obligations. Brave says
it does not collect identifiers linking a query to an end user/device, but the
customer may be able to make that link and is responsible for notice and
consent. Enterprise Zero Data Retention is optional and subject to legal
obligations [S15]. Consumer Brave Search privacy promises are not the API
contract [S12, S15].

**RECOMMENDATION (high):** do not submit private images, hidden corpus text,
identifiers, secrets, or unnecessary personal data as queries. Treat every
query as disclosure to a third-party provider and require explicit retention
authority.

### 9.3 Standard terms

**FACT (high, not legal advice):** public terms last updated 2026-02-11 grant a
limited, revocable license for API/result use with customer applications. Unless
an Order Form changes them, they prohibit [S9]:

- result storage/cache/database creation beyond transient operation;
- derivative works of API, documentation, or Search Results;
- redistribution, resale, or sublicensing of Search Results;
- reverse engineering or bypassing limits;
- using the API to replicate/replace its functionality;
- using results to create, evaluate, train, retrain, fine-tune, benchmark, or
  improve AI models/services; and
- retaining Search Results after termination.

The terms also preserve third-party rights, require key protection and customer
compliance, disclaim accuracy/completeness/security/non-infringement, and allow
Brave termination for convenience on ten days' notice [S9].

**RECOMMENDATION (high):** reject durable ingestion of API image results,
thumbnails, or asset bytes into Curiosity's owned corpus under the standard
terms. Legal/procurement must approve the exact Order Form, proxy-display rights,
retention/deletion behavior, evaluation rights, and each source image's rights
before a pilot. The official skill repository's MIT license covers that public
skill material, not Brave Search Results or third-party images [S3, S16].

## 10. Clean-room architecture lessons

| Public clue | Safe Curiosity lesson | Boundary |
| --- | --- | --- |
| page URL vs original asset URL [S1-S3] | model page/document and media asset as separate nodes | do not assume common owner or host |
| thumbnail and placeholder proxy [S1] | make derivatives explicit, privacy-preserving delivery artifacts | proxying does not create reuse rights |
| optional original/thumbnail dimensions [S3] | separate provider-claimed from byte-measured metadata | do not trust dimensions before validation |
| `page_fetched` [S3] | preserve page crawl and asset clocks separately | page time is not image freshness |
| `confidence` classes [S3] | retain provider relevance hints as opaque observations | not probability, truth, safety, or authority |
| query/set safety warnings [S3] | distinguish applied policy from aggregate warning | add per-asset moderation and use decision |
| 200-result unpaged window [S1, S2] | explicit candidate ceilings and stop reasons | no exhaustive/deep-page promise |
| absent license field + third-party rights [S1, S9] | rights evidence is first-class and unknown by default | host reputation is not a license |
| additive versioning [S5] | pin contract version and tolerate unknown fields | latest behavior is not reproducible history |

**REJECTED (high confidence):** scraping consumer Brave Images; decoding proxy
URL internals as a compatibility contract; bulk origin downloads without source
authority; copying undocumented ranking/safety behavior; using Brave Search
Results to bootstrap or benchmark Curiosity; inferring license from domain; or
treating proxied thumbnails as durable evidence.

## 11. Curiosity implications and verdict ledger

| Verdict | Decision |
| --- | --- |
| **ADOPTED** | separate landing page, asset, and derivative identities; explicit result/window budget; strict-by-default image retrieval policy; provider rank preservation; page-vs-asset clocks; rights unknown by default |
| **ADAPTED** | Brave's thumbnail proxy into an owned derivative service with capture/hash/transform lineage; `confidence` into an opaque provider signal; query/set safety warnings into typed policy evidence; dimensions into claimed vs measured fields |
| **REJECTED** | Brave as owned image index/evidence corpus; original URL as immutable identity; proxy as license; page host as creator/owner; result count as diversity/completeness; SafeSearch as final moderation; automatic bulk image fetch |
| **DEFERRED** | any API pilot; exact Order Form rights; authorized relevance/diversity/freshness evaluation; proxy URL lifetime; image-format coverage; commercial SLA; source-specific licensing workflows |

### 11.1 Minimum provider-neutral image artifact

**RECOMMENDATION (high):** Curiosity's core should be designed from owned needs,
not copied from Brave's schema:

```text
request:
  query + locale_preferences + media_constraints + safety_policy
  + rights_policy + candidate_budget + execution_budget

provider_observation:
  provider/version + observed_at + original/altered_query
  + provider_rank + opaque_relevance_signal? + aggregate_warnings[]

landing_page:
  observed_url + resolved_url? + canonical_url? + host
  + page_capture_id? + provider_page_fetched_at?

media_asset:
  observed_asset_url + resolved_asset_url? + asset_host
  + capture_id? + byte_hash? + perceptual_hash?
  + claimed_dimensions? + measured_media_metadata?

derivative:
  derivative_id + source_capture_id + transform/version
  + dimensions + media_type + byte_hash + delivery_policy

governance:
  discovery_basis + fetch_basis + rights_evidence/state
  + attribution + safety_evidence/decision + deletion state
  + duplicate/syndication/owner cluster edges
```

This permits a Brave adapter later without allowing Brave-specific optional
fields or commercial assumptions to define the provider-neutral contract.

### 11.2 Required ingestion sequence if separately authorized

1. Accept a bounded provider result as untrusted discovery metadata.
2. Validate and normalize landing/asset/proxy URLs without decoding hidden proxy
   structure.
3. Resolve rights and fetch authority before obtaining bytes.
4. Fetch landing page and asset independently under SSRF, redirect, byte, pixel,
   frame, and time budgets.
5. Capture bytes immutably; measure type/dimensions; compute exact and perceptual
   hashes; retain extraction/decoder versions.
6. Create Curiosity-owned derivatives linked to the authorized source capture.
7. Apply per-asset safety and rights policy; preserve provider signals only as
   observations.
8. Cluster duplicates, syndication, hosts, publishers, and owners before
   diversity-aware ranking or corroboration.

## 12. Unknowns and verification gates

### 12.1 Material unknowns

1. Exact indexed-image count, definition, format coverage, and regional/language
   distribution.
2. Image discovery, crawl, recrawl, canonicalization, and deletion mechanics.
3. Whether asset bytes are fetched/indexed separately from landing pages and
   what `Cache-Control: no-cache` affects.
4. Ranking features, confidence calibration, source/owner diversity, quality,
   spam, watermark, and duplicate/near-duplicate policy.
5. Meaning of fewer-than-requested results: scarcity, safety, deduplication,
   policy, capacity, or another cause.
6. Proxy thumbnail/placeholder media type, transform exactness, cache lifetime,
   stability, access policy, and response limits.
7. Complete error catalogue, authentication/5xx behavior, partial response
   semantics, latency, timeout, and availability SLA.
8. Image-specific freshness: asset first/last fetch, mutation detection,
   publication/creation date, and stale-link rate.
9. Whether a `description` can actually appear despite its absence from the
   public field schema.
10. Exact rights to transiently display proxy images and retain normalized
    metadata under a purchasable Order Form.

### 12.2 Checks before any pilot

- **Legal/procurement:** exact Order Form, source-content rights, proxy display,
  transient caching, evaluation, AI use, attribution, takedown, deletion, DPA,
  and ZDR.
- **Contract:** archive a pinned dated schema; confirm all optional/null fields,
  country/language enums, error bodies, compression, and additive parsing.
- **License-safe fixtures:** customer-created or expressly licensed only; test
  absent URLs/dimensions, malformed/oversize strings, cross-host assets,
  redirects, SVG/polyglots, huge pixel counts, animation, and unknown fields.
- **Authorized live quality study:** only if terms permit; predeclare queries and
  budgets, then measure duplicate/near-duplicate rate, host/owner diversity,
  stale assets, dimension accuracy, safety errors, and rights-field absence.
- **Operational exit:** provider outage/termination and verified deletion of
  provider results/proxy artifacts.

## 13. Bounded curiosity pass

After synthesis, remaining in-frame threads were scored 1 (low) to 5 (high).
Cost includes access, rights, clean-room, and interpretation risk.

| Thread | Relevance | Value | Novelty | Cost | Outcome |
| --- | ---: | ---: | ---: | ---: | --- |
| Resolve landing/original/thumbnail/placeholder roles | 5 | 5 | 4 | 1 | **Pursued:** service guide and official skill establish three resource roles and proxy purpose [S1, S3]. |
| Determine whether dimensions and `page_fetched` concern asset bytes | 5 | 5 | 3 | 1 | **Pursued:** dimensions are optional image properties; time is explicitly last page crawl. Asset fetch time remains unknown [S3]. |
| Find per-result license/creator/attribution fields | 5 | 5 | 3 | 1 | **Pursued:** none in reference/skill; copyright warning, terms, and DMCA process confirm rights remain external [S1-S3, S9, S13]. |
| Reconcile documented “description” with response schema | 3 | 3 | 4 | 1 | **Pursued:** overview says typical description; reference/official skill do not expose it. Negative result retained. |
| Infer rank model from proxy paths or public examples | 2 | 1 | 3 | 5 | **CURIOSITY_NO_GO:** proxy strings and examples do not reveal ranking; reconstruction is unnecessary and contractually out of bounds. |
| Call API to measure dedupe, safety, or freshness | 4 | 4 | 3 | 5 | **CURIOSITY_NO_GO:** no credentials/paid-test authority; terms constrain benchmarking and result retention. Defer to reviewed pilot. |
| Download original images to inspect metadata | 3 | 3 | 3 | 5 | **CURIOSITY_NO_GO:** source rights, fetch authority, and safe-media harness are absent; public contract already establishes metadata gaps. |
| Reverse engineer thumbnail transform/cache implementation | 2 | 2 | 4 | 5 | **CURIOSITY_NO_GO:** no interoperability need; only public behavioral role transfers clean-room. |
| Jurisdiction-by-jurisdiction image copyright analysis | 4 | 4 | 3 | 5 | **CURIOSITY_NO_GO:** legal advice outside authority; asset-specific counsel workflow is the correct gate. |

**Stop condition:** coverage achieved for all requested categories and public
sources saturated. Remaining high-value questions require an authorized API
contract/test, source-image access, or legal review; private ranking/proxy
details would not change the architecture verdict.

## 14. Primary source ledger

All sources are first-party Brave material and were accessed **2026-08-17**.
Vendor documentation proves the published contract or claim, not effective
quality, corpus coverage, safety accuracy, or third-party rights.

| ID | Primary source | Material used |
| --- | --- | --- |
| S1 | [Image Search service guide](https://api-dashboard.search.brave.com/documentation/services/image-search) | product/index claim, controls, 200 cap, SafeSearch, result summary, proxy/placeholder roles, copyright warning, changelog |
| S2 | [Image Search API reference](https://api-dashboard.search.brave.com/api-reference/images/image_search) | GET endpoint, request bounds/defaults, no pagination, cache/user-agent/version headers, top-level responses/errors |
| S3 | [Official Brave Images Search skill](https://github.com/brave/brave-search-skills/blob/main/skills/images-search/SKILL.md) | expanded optional response fields, example shape, page crawl time, dimensions, confidence, warnings |
| S4 | [API authentication guide](https://api-dashboard.search.brave.com/documentation/guides/authentication) | token header and key-handling requirements |
| S5 | [API versioning guide](https://api-dashboard.search.brave.com/documentation/guides/versioning) | URL/date versions and compatible-change policy |
| S6 | [Rate limiting guide](https://api-dashboard.search.brave.com/documentation/guides/rate-limiting) | sliding window, quota headers, successful-request billing |
| S7 | [Brave Search API product page](https://brave.com/search/api/) | current Search plan, page-scale/update claims, enterprise/ZDR |
| S8 | [API pricing page](https://api-dashboard.search.brave.com/documentation/pricing) | $5/1,000, $5 credit, 50 requests/second, Image inclusion |
| S9 | [Search API Terms of Use](https://api-dashboard.search.brave.com/documentation/resources/terms-of-service) | 2026-02-11 license/restrictions, third-party image rights, disclaimers, termination |
| S10 | [Search API security](https://api-dashboard.search.brave.com/documentation/resources/security) | selected-index clues, malware/phishing/CSAM controls, governance |
| S11 | [Brave Search crawler](https://search.brave.com/help/brave-search-crawler) | general crawler/discovery and WDP relation |
| S12 | [Consumer Brave Search privacy notice](https://search.brave.com/help/privacy-policy) | independent-index and consumer/API privacy boundary |
| S13 | [Brave Search DMCA process](https://search.brave.com/help/copyright-dmca) | image-result takedown workflow and proxy-address identification |
| S14 | [Consumer Safe Search help](https://search.brave.com/help/safesearch) | adult-classification inputs, consumer-mode context, fallibility/reporting |
| S15 | [Search API privacy notice](https://api-dashboard.search.brave.com/documentation/resources/privacy-notice) | 90-day query logs, customer duties, enterprise ZDR |
| S16 | [Official skill repository license](https://github.com/brave/brave-search-skills/blob/main/LICENSE) | MIT scope for public skill repository; not result/image rights |

## 15. Verification record

- Read the repository constitution before research.
- Triangulated the request/result contract across the service guide, rendered
  API reference, and official Brave skill.
- Triangulated commercial, privacy, and rights boundaries across pricing,
  terms, API privacy, DMCA, and security pages.
- Retained material negative results: no pagination, freshness filter, rights
  field, creator, asset fetch time, MIME/byte/hash identity, duplicate relation,
  diversity control, rank score/explanation, complete errors, SLA, or public
  image-description schema.
- Retained rather than papered over the description contradiction and the
  difference between broad Web page update claims and image freshness.
- No credential, endpoint call, paid test, result download, source-image fetch,
  bypass, proprietary behavior reconstruction, or file change outside
  `docs/research/products/brave-image-search-api.md` was performed.
