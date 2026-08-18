# Brave Place / Local Search API: clean-room product dossier

**Research date / primary-source access date:** 2026-08-17  
**Product boundary:** Brave Search API's standalone Place Search endpoint,
`GET /res/v1/local/place_search`, and its two ID-dependent enrichment endpoints,
`GET /res/v1/local/pois` and `GET /res/v1/local/descriptions`. Web Search is
considered only where it supplies the same temporary POI IDs or explains the
underlying index. Consumer Brave Maps is context, not an API contract.  
**Status:** primary-source desk research; no account, credential, paid/free API
call, endpoint probing, packet inspection, result retention, benchmark, or
implementation.  
**Clean-room boundary:** public Brave documentation, policy pages, product
announcements, and Brave's public official skills. No reconstruction of private
ranking, entity resolution, crawling, geocoding, or source-provider logic.

## Executive verdict

**ADAPTED as a bounded place-discovery adapter and contract pattern; REJECTED as
Curiosity's durable place identity, source of truth, or owned local index (high
confidence).** Place Search is genuinely standalone at discovery time: one GET
can search businesses, landmarks, POIs, addresses, streets, neighborhoods,
cities, regions, and countries without first running Web Search. It accepts a
coordinate anchor or location string, permits query-free Explore mode, returns
up to 100 items across typed buckets, and can include coordinates, address,
contact, aggregate rating, hours, categories, cuisine, price, images, profiles,
timezone, and distance [S1-S3].

The product's most useful architecture clue is the separation of:

1. **discovery/ranking** (`place_search`);
2. a short-lived **provider handoff handle** (`id`, about eight hours);
3. **structured enrichment** (`local/pois`); and
4. **generated narrative enrichment** (`local/descriptions`).

That separation should transfer, but Brave's `id` must not. It is explicitly
ephemeral, is not documented as globally stable or version-independent, and is
absent from the published shapes for cities, countries, regions,
neighborhoods, bare addresses, and streets [S1-S6]. Curiosity needs its own
durable entity/branch identity and must retain source assertions separately.

Place Search is not a geofence or directory export. `radius` is a **ranking
bias**, not a boundary; results may lie outside it. There is no bounding box,
polygon, hard-distance filter, cursor, offset, total count, stable snapshot,
sort order, open-now filter, category ID filter, minimum rating, price filter,
or documented exhaustive enumeration mode [S1-S3]. The returned order is a
provider ranking, while `mixed` is a presentation recipe for interleaving typed
buckets.

Brave says it owns and operates the Place Search stack and an independent index
of about/over 200 million POIs, drawing local data from its Web crawler and Web
Discovery Project (WDP) signals [S1, S11, S12]. That does **not** mean every
place fact is authored or owned by Brave. Responses expose provider pages,
rating-provider metadata, external profiles, images, and third-party content;
the standard terms expressly preserve third-party rights [S3-S6, S16]. Public
documentation provides no per-field source, observation time, evidence chain,
owner verification state, or currentness guarantee.

Freshness is the critical product limitation. No place result field says when
an address, coordinate, phone, rating, review count, hours schedule, category,
closure, or photo was observed. Brave itself says Google has a staleness
advantage because business owners often update Google Business Profile before
the open Web; Brave obtains its data from its crawler and WDP signals [S11].
`Cache-Control: no-cache` is best effort and is not a source refresh command
[S2, S4-S6].

As accessed, Place Search is on the Search plan at **$5 per 1,000 successful
requests**, with $5 monthly credit and advertised plan capacity of 50 requests
per second. Place requests are billed separately from Web Search; deeper POI or
description requests are additional API requests [S1, S11, S13-S15]. Standard
terms prohibit durable result databases beyond transient operation,
redistribution, API replacement, reverse engineering, and use of Search Results
to create/evaluate/train/benchmark AI systems [S16]. A production pilot
therefore requires legal/procurement review and cannot bootstrap Curiosity's
owned place graph under the public terms.

## 1. Decision frame and bounded questions

### 1.1 Decision

What can Curiosity safely learn from Brave's public place-search contract while
keeping provider-neutral place identity, field-level provenance, geographic
policy, and freshness under Curiosity's control?

### 1.2 Bounded sub-questions

1. What are the three endpoint contracts, request bounds, response buckets, and
   follow-up flow?
2. What does a Brave POI `id` identify, for how long, and what does it not prove?
3. How do coordinate anchors, user geolocation, location strings, country,
   radius, distance, and ranking interact?
4. Which place details, ratings, reviews, hours, images, and generated
   descriptions are actually documented?
5. What source, ownership, provenance, and freshness evidence is exposed or
   omitted?
6. What privacy, safety, error, quota, pricing, and contractual constraints
   affect use?
7. Which public ideas are adopted, adapted, rejected, or deferred for
   Curiosity?

**Depth budget:** first-party public sources for every requested category, with
material contract, commercial, privacy, provenance, and ownership claims
triangulated. Excluded: authenticated calls, source scraping, private schema
discovery, proprietary algorithm inference, paid comparative tests, and legal
advice.

Labels used below:

- **FACT** — directly stated or structurally shown in cited first-party
  material.
- **INFERENCE** — narrow consequence of cited facts, not an observation of
  Brave internals.
- **RECOMMENDATION** — proposed Curiosity treatment.
- Confidence is **high**, **medium**, or **low**.

## 2. Product topology

### 2.1 Endpoints and roles

| Endpoint | Role | Input identity | Published output | Standalone? |
| --- | --- | --- | --- | --- |
| `GET /res/v1/local/place_search` | discover and rank physical/geographic places | query and/or geographic anchor | typed place buckets plus temporary POI IDs | **Yes** |
| `GET /res/v1/local/pois` | enrich known POIs | 1-20 temporary IDs | richer `LocationResult` records | No |
| `GET /res/v1/local/descriptions` | generate narratives for known POIs | 1-20 temporary IDs | ID-keyed markdown descriptions, possibly null | No |

Sources: [S1-S6]. All require `X-Subscription-Token`; Brave warns not to expose
the key in client code or public locations [S14].

**FACT (high):** Place Search was added in January 2026. Brave announced it as
access to the same technology behind consumer Search Area/map place search and
as an index of over 200 million POIs [S1, S10]. A July 2026 announcement calls
the improved product the backbone of place search in Brave Search and says the
index contains about 200 million worldwide and is growing [S11]. The exact
counting method and current number are not published.

**FACT (high):** the older local flow remains interoperable. Web Search can
return `locations.results[].id`; Place Search returns the same kind of ID; both
can feed `/local/pois` and `/local/descriptions` [S1, S3-S7, S9]. This is contract
interoperability, not evidence that Web and Place candidate generation or order
are identical.

**INFERENCE (high):** “standalone” applies to initial discovery only. A caller
that needs fields present only in POI details or a generated description still
has a multi-request workflow and must finish it before the handle expires.

### 2.2 Not a maps stack

**FACT (high):** the response can provide points, suggested zoom levels, and
map-oriented result types. Public API material does not expose map tiles,
routes, turn-by-turn directions, travel times, isochrones, road topology,
traffic, geocoding as a separately guaranteed service, reverse geocoding,
autocomplete, polygons, or spatial joins [S1-S6].

**INFERENCE (high):** Place Search can populate a map or place picker but is not
a complete mapping/navigation platform. A resolved `location` object is an
observed search-center interpretation, not a general-purpose geocoder SLA.

## 3. Place Search request contract

### 3.1 Query and geography

**FACT (high):** `GET https://api.search.brave.com/res/v1/local/place_search`
documents these inputs [S1-S3]:

| Input | Type/default | Published semantics and bounds |
| --- | --- | --- |
| `q` | optional string; default empty | POI query; omission enters Explore mode when geography is supplied |
| `latitude` | optional number | search-center latitude, -90 to 90; paired with longitude |
| `longitude` | optional number | search-center longitude, -180 to 180; paired with latitude |
| `location` | optional string | alternative named anchor; US guidance is `city state country`, elsewhere `city country`; multilingual |
| `radius` | optional number; meters | minimum 0; geographic relevance bias, not hard cutoff; no current upper bound |
| `geoloc` | optional string | user location in `<latitude>x<longitude>` form, used to calculate distance |
| `count` | integer; 20 | 1-100 total items; official skill says budget spans all result buckets |
| `country` | enum; `US` | two-letter country scope; official skill additionally names `ALL` |
| `search_lang` | enum; `en` | result/search language preference |
| `ui_lang` | enum; `en-US` | response UI locale |
| `units` | enum; `metric` | `metric` (km) or `imperial` (miles) for distance |
| `safesearch` | enum; `strict` | `off`, `moderate`, or `strict` |
| `spellcheck` | boolean; `true` | apply correction before search |

**UNKNOWN / documentation tension:** the rendered reference presents `country`
as a finite enum and the service table says two-letter ISO code, while the
official skill additionally allows `ALL` [S1-S3]. The effective accepted values
must be confirmed against a pinned contract rather than guessed.

**FACT (high):** latitude and longitude are conditional partners. A query may be
global without either anchor. Conversely, `q` may be empty when coordinates or
a location string are provided. The official skill says omitting all query and
anchor inputs yields HTTP 422 [S3].

**FACT (high):** location-name parsing is heuristic. Brave recommends no commas,
case-insensitive city/state/country wording and says English or the target
city's most popular language generally works best [S1-S3]. No location ID,
administrative code, ambiguity list, confidence score, or strict resolution
mode is accepted.

**INFERENCE (high):** a location string is not an exact geographic constraint.
Names can be ambiguous, multilingual, misspelled, or refer to multiple
administrative levels. The response's resolved center must be inspected and
recorded rather than assuming the requested text was interpreted as intended.

### 3.2 Radius semantics and documentation drift

**FACT (high):** current service/reference material says radius has no upper
limit, defaults to none, biases results rather than clipping them, and may
return results outside the supplied radius [S1-S3]. The changelog says radius
restrictions were lifted on 2026-03-04 [S1].

**FACT (high, historical contradiction resolved):** the 2026-02-26 launch post
says the radius could be up to 20 km [S10]. That statement predates the
2026-03-04 documented change and must not be treated as the current contract.

**FACT (medium, vendor guidance):** Brave says radii under roughly 20 km tend to
yield focused area matches, while large/no radius works better for distinctive
names than generic categories [S1]. This is guidance, not a completeness or
precision guarantee.

**RECOMMENDATION (high):** encode `radius` as `soft_radius_m`, never
`max_distance_m`. When a caller requires a hard geofence, separately validate
returned coordinates and apply a Curiosity-owned point-in-circle/polygon rule.
Reject or mark unknown any result without coordinates; do not infer compliance
from rank or returned `distance` alone.

### 3.3 Three distinct geographic concepts

The public contract exposes concepts that should remain separate:

```text
search anchor: latitude + longitude OR location string
  -> influences candidate retrieval/ranking and resolved location

soft radius around coordinate anchor
  -> bias only, not containment

user geolocation: geoloc=<lat>x<long>
  -> documented purpose is returned-distance calculation
```

**UNKNOWN / documentation tension:** service examples describe distance from
the “search center,” while the API reference and official skill say `geoloc` is
used to calculate distance [S1-S3]. It is not specified whether anchor
coordinates are a fallback distance origin, which origin wins when both differ,
or whether every distance is geodesic. Curiosity must preserve the exact inputs
and not silently relabel distance as distance-from-anchor.

### 3.4 Important absent controls

**FACT (high):** no public Place Search parameter is documented for offset,
cursor, page, total count, stable snapshot, bounding box, viewport, polygon,
hard radius, sort, category ID, include/exclude category, open-now, hours/date,
minimum rating, review count, price, cuisine, chain, accessibility, service
area, business status, owner verification, source selection, freshness, field
mask, fields requested, Goggles, or duplicate grouping [S1-S3].

**INFERENCE (high):** prose such as “three highly-rated lunch spots within
500m” may influence semantic ranking, but does not create hard numeric filters.
Callers must not represent those constraints as verified unless they
post-validate explicit fields—and even then freshness remains unknown.

## 4. Place Search response schema

### 4.1 Envelope and heterogeneous buckets

**FACT (high):** a successful response has `type: "locations"` and can contain
[S1-S3]:

```text
query?                  original, altered?, spellcheck_off?, strict warning?
results?                individual business/landmark/POI LocationResult
cities?                 CityResult
countries?              CountryResult
regions?                RegionResult
neighborhoods?          NeighborhoodResult
addresses?              AddressResult(type=address)
streets?                AddressResult(type=street)
mixed                   ordered references into the above buckets
location?               resolved center: coordinates, name, country
```

Every content bucket may be null or absent; `mixed` defaults to an empty array
in the reference. Address-shaped queries can spend the result budget entirely
in `addresses`/`streets`, leaving `results` empty [S1-S3].

**FACT (high):** `mixed[]` carries `type`, optional zero-based `index`, and
`all`. It is a display/interleaving plan: `all=true` means insert all items from
that bucket at that position [S1-S3]. Clients interested only in POIs may ignore
it and read `results`, but doing so discards Brave's cross-type presentation
order.

**INFERENCE (high):** rank is two-layered: order within each bucket plus
`mixed` cross-bucket placement. A provider-neutral observation should preserve
both rather than flattening without a trace.

### 4.2 `LocationResult`

The union of the service guide, rendered API reference, and official skill
documents the following shape [S1-S3]:

| Field | Meaning / caveat |
| --- | --- |
| `type` | `location_result` |
| `id?` | opaque enrichment handle, valid about eight hours |
| `title` | place/business display name |
| `url` | called canonical URL by documentation |
| `provider_url` | provider page URL; may be empty in official example |
| `description?` | short description or category label |
| `coordinates?` | `[latitude, longitude]` |
| `postal_address` | display string plus optional street, locality, region, postal code, country |
| `contact?` | optional telephone and email |
| `rating?` | average value, best value, review count; place skill also shows `is_tripadvisor` |
| `opening_hours?` | `current_day` intervals and weekly `days` interval arrays |
| `categories` | strings; official skill says default `[]` |
| `serves_cuisine?` | cuisine strings |
| `price_range?` | display indicator/range |
| `distance?` | numeric value and units |
| `icon_category?` | display/icon slug |
| `thumbnail?` | `src` and `original` image URLs |
| `pictures?` | additional image results with `src` and `original` |
| `profiles?` | external profile name, URL, long name, and image |
| `timezone?` | IANA timezone name |
| `zoom_level` | map zoom hint; official skill says default 7 |

Most substantive children are optional in the official skill/reference. The
service overview's prose “every result” should not override schema nullability
[S1-S3, S11].

**UNKNOWN / documentation tension:** service prose says each result includes an
ID for details, while the official skill types `id` as optional [S1, S3]. A
caller must tolerate POIs that cannot enter the enrichment flow.

### 4.3 Geographic and address entities

**FACT (high):** city/country/region/neighborhood results expose `type`, `name`,
`country`, coordinates, and a thumbnail. Published material does not show a
temporary ID, structured administrative hierarchy, boundary geometry,
population, timezone, canonical URL, or provider source for these objects
[S1-S3].

**FACT (high):** address/street results expose `type`, `name`, coordinates,
`pois` located at the address/street, `pois_nearby`, suggested `zoom_level`
(skill default 15), optional distance, and optional postal address [S1-S3]. The
nested POIs use `LocationResult` shape.

**INFERENCE (high):** “at” and “nearby” are provider relations, not surveyed
topology. No distance threshold, parcel geometry, entrance point, rooftop vs
centroid quality, or relation confidence is exposed.

### 4.4 No pagination or completeness contract

**FACT (high):** Place Search allows `count` 1-100 and publishes no continuation
mechanism [S1-S3]. The official skill says this count is shared across all
buckets, a detail not explicit in the rendered reference [S3].

**INFERENCE (high):** 100 is a candidate/presentation window, not evidence of
all matching places within an area. Tiling space or varying query text to
simulate export would be incomplete, unstable, costly, potentially duplicative,
and inconsistent with the no-database/API-replacement terms [S16].

## 5. Identity and entity resolution

### 5.1 The temporary POI ID

**FACT (high):** POI IDs are opaque, interchangeable between Place Search and
Web Search local results, accepted by both detail endpoints, and expire after
approximately eight hours. Brave explicitly says not to store them for later
use [S1, S3-S7]. The versioning guide also says object-ID length and format may
change compatibly [S15].

**INFERENCE (high):** the ID is a capability-like provider handoff token, not a
durable business key. Its prefix/base64-like appearance has no public semantics
and must not be decoded. Expiry may represent cache/session resolution rather
than entity deletion or business closure.

**UNKNOWN:** whether repeated searches for the same branch return the same ID
within the eight-hour period; whether an ID is subscription-bound, query-bound,
locale-bound, or version-bound; exact expiry behavior; whether expired IDs
yield null, 400, 404, or partial success; and whether aliases, relocations,
closures, chains, departments, and co-located businesses share or split IDs.

### 5.2 URLs, coordinates, and names are not stable identity

**FACT (high):** documentation labels `url` “canonical URL” and separately
exposes `provider_url` [S1-S5]. It does not define canonical relative to the
business, Brave's entity graph, a source provider, or the Web. Official examples
are inconsistent: one uses a business-owned URL with a Yelp provider URL; the
skill example uses a Yelp URL as `url` and an empty `provider_url` [S1, S3].

**INFERENCE (high):** neither URL is a guaranteed stable place identifier.
Businesses change domains; provider pages move; chains share domains; one
building hosts multiple entities. Likewise, names, phones, addresses, and
coordinates can change or collide.

**RECOMMENDATION (high):** Curiosity should assign its own immutable entity and
physical-site IDs only after evidence-backed resolution. Preserve each Brave ID
as a time-bounded `provider_handle` observation with provider, API/date version,
obtained/expiry times, originating query, and raw source fields. Never use it as
a primary key for durable records.

### 5.3 Entity classes must remain distinct

**RECOMMENDATION (high):** model at least:

- legal/operating organization;
- brand/chain;
- physical establishment or branch;
- geographic feature/landmark;
- postal address;
- street;
- neighborhood/locality/region/country;
- provider listing/profile;
- temporal business state; and
- media asset.

Brave's buckets and strings provide candidate assertions for these concepts,
not a complete ontology or verified equivalence relation.

## 6. Details, ratings, reviews, hours, images, and descriptions

### 6.1 Structured POI enrichment

**FACT (high):** `/res/v1/local/pois` accepts repeated `ids` (1-20), optional
`search_lang`, `ui_lang`, and `units`, plus optional `X-Loc-Lat` and
`X-Loc-Long` headers for distance. It returns `type: "local_pois"` and nullable
`results` containing `LocationResult` objects [S4, S5].

The enrichment schema additionally documents:

- `rating.profile.name/url` for rating-provider attribution;
- `reviews.reviews_in_foreign_language`;
- `action.type/url`;
- related local Web results with `meta_url`;
- additional pictures and profiles; and
- optional `timezone_offset` [S4, S5].

**FACT (high):** the public schema does **not** document review text, review ID,
review author, review date, per-review rating, language, owner response,
distribution, or review URL. “Reviews” in product prose therefore should not be
read as a contractual review-body feed [S1, S4, S5, S11].

**UNKNOWN / negative result:** why Place Search skill uses
`rating.is_tripadvisor` while Local POIs documents the more general
`rating.profile`; whether both can appear; and whether every displayed rating
has provider attribution. An absent provider must remain unknown.

### 6.2 Ratings are source assertions

**INFERENCE (high):** `ratingValue`, `bestRating`, and `reviewCount` are not
comparable until provider, scale, aggregation rule, locale, and observation time
are known. `4.5/5` from one provider and `4.5/5` from another are distinct
assertions. A review count can fall because of moderation or source change; it
is not monotonic identity evidence.

**RECOMMENDATION (high):** store rating observations as:

```text
entity/site + source_profile + value + best_value + count
+ observed_at + source_updated_at? + provider_attribution? + retrieval_evidence
```

Do not average provider averages, infer quality from missing values, or expose a
rating without its source and observation date.

### 6.3 Opening-hours limits

**FACT (high):** documented hours consist of today's interval objects and/or
arrays of intervals for days, with abbreviated/full day names and `opens` /
`closes` clock strings. `timezone` and `timezone_offset` can be separately
present [S1, S3-S5].

**FACT (high):** no documented field expresses open-now status, schedule
effective date, holiday/special hours, temporary closure, permanent closure,
appointment-only status, 24-hour semantics, seasonal schedule, last order,
split-interval ordering rules, or source/last-update time [S1-S5].

**INFERENCE (high):** `current_day` is a provider-rendered observation whose
reference date/time and timezone are not fully specified. A client cannot safely
recompute “open now” from it without validating the place timezone, weekly
schedule semantics, exceptional dates, and observation freshness.

**RECOMMENDATION (high):** never promise that a place is open solely from this
API. Label hours with source and retrieval time, preserve intervals verbatim,
and prompt users to verify high-consequence visits. Maintain exceptional and
weekly schedules as separate typed assertions.

### 6.4 Images and external actions

**FACT (high):** thumbnail, original-image, picture, profile-image, profile URL,
action URL, business URL, provider URL, and related-Web-result URLs may be
returned [S1-S5]. No place schema exposes image creator, license, hash, MIME,
dimensions, capture time, safety decision, or rights evidence.

**INFERENCE (high):** these are external, mutable, potentially hostile
resources. `original` describes a URL role, not an immutable original work or a
reuse license. An action link may initiate booking, ordering, calling, or another
external flow; its exact taxonomy and trust model are undocumented.

### 6.5 AI-generated local descriptions

**FACT (high):** `/res/v1/local/descriptions` accepts 1-20 repeated IDs and
returns `type: "local_descriptions"`; each non-null result has
`type: "local_description"`, matching `id`, and nullable `description` [S6,
S7]. The official skill says descriptions are AI-generated markdown, typically
travel-guide-like and grounded in Web Search context [S7].

**FACT (high):** the response contract exposes no citations, source URLs,
supporting snippets, model/version, generation time, claim spans, confidence,
safety labels, or freshness timestamp [S6, S7]. It also permits unavailable/null
descriptions.

**INFERENCE (high):** “grounded in Web Search context” is generation-process
provenance, not claim-level evidence. A narrative may synthesize stale,
conflicting, promotional, or incorrect pages. Markdown is presentation content,
not verified structured truth.

**RECOMMENDATION (high):** keep generated descriptions in a separate,
non-authoritative artifact class; sanitize rendered markdown and links; never
parse narrative claims back into canonical place facts without cited source
evidence and validation. Do not use descriptions for safety-critical travel,
accessibility, health, legal, financial, or opening-status decisions.

## 7. Source provenance, ownership, and freshness

### 7.1 What Brave says it owns

**FACT (medium, vendor claim):** Brave calls Place Search an independent index
of about/over 200 million POIs and says “we own and operate the entire stack,
Place Search included” [S1, S10, S11]. It says the API powers its own map/place
search rather than scraping Google [S10, S11].

**FACT (medium, vendor claim):** Brave says local data comes from its Web crawler
and WDP signals [S11]. WDP is opt-in and contributes unlinkable fractions of
queries, result clicks, visited URLs, engagement, and page metadata; some
carefully bounded fetch jobs can return public-page HTML [S19].

**INFERENCE (high):** stack/index ownership is not equivalent to ownership of
business facts, reviews, photos, or source pages. It describes Brave's index and
serving infrastructure. The result itself may contain third-party material and
links, as Brave's terms acknowledge [S16].

### 7.2 Exposed provenance

| Assertion | Public provenance clue | Missing evidence |
| --- | --- | --- |
| place identity/name | temporary ID, title, URL/provider URL | durable source ID, match/merge evidence, aliases, confidence |
| coordinates/address | values only | source, geocode method/precision, rooftop/centroid/entrance, observed time |
| contact | phone/email | publisher/owner source, verification, observed time |
| rating | optional provider profile or Tripadvisor flag | per-review evidence, aggregation method/date, complete attribution guarantee |
| hours | schedule/timezone | owner/source, exceptional dates, effective/observed time |
| category/cuisine/price | strings | taxonomy IDs/version, source, confidence, update time |
| image | provider/profile/original URLs | creator, license, byte identity, capture and transform lineage |
| narrative | “AI-generated from Web Search context” | citations, model/version, source set, claim support |
| related mentions | Web results/meta URLs in POI details | relation extraction basis and assertion-level mapping |

**FACT (high):** no field-level source, source observation timestamp,
`last_updated`, business-owner verification, confidence, dispute state, or
field lineage is documented [S1-S7]. `provider_url` is listing/page provenance,
not a blanket source declaration for every sibling field.

### 7.3 Freshness

**FACT (high):** none of the three local endpoint schemas documents a content
timestamp for place facts, ratings, review counts, hours, closures, contacts,
categories, or photos [S1-S7]. The eight-hour ID lifetime concerns handle
validity, not fact freshness.

**FACT (high):** Brave explicitly concedes a staleness disadvantage against
Google because direct business-owner updates reach Google Business Profile
before the Web; Brave uses crawler and WDP inputs [S11].

**FACT (high):** `Cache-Control: no-cache` asks Brave not to return cached
content on a best-effort basis [S2, S4, S6]. The documentation does not say this
triggers recrawl, provider refresh, re-geocoding, or description regeneration.

**RECOMMENDATION (high):** separate `source_claimed_at`, `source_observed_at`,
`provider_indexed_at`, `provider_returned_at`, and `curiosity_verified_at`.
Because Brave exposes only the last of those indirectly (request observation
time), record the rest as unknown. Never substitute ID expiry or API request
time for business-fact freshness.

### 7.4 Corrections and removals

**FACT (medium):** Brave publishes API support and general consumer Search
feedback, and its broader independent Web index has a global RTBF/objection
process that can delist URLs containing personal data [S17, S18]. Public Place
Search documentation does not identify a business-owner claim/edit API,
listing-specific correction workflow, update SLA, or place-ID deletion process.

**UNKNOWN:** whether correcting a source page updates the local entity; how long
that takes; how closures/relocations/duplicates are handled; whether RTBF URL
delisting propagates to derived place facts; and how third-party provider
corrections are reconciled.

## 8. Ranking, geography, and quality evidence

### 8.1 Observable ranking controls

**FACT (high):** public controls are query text, coordinate or named anchor,
soft radius, country, search/UI language, user geolocation, units, SafeSearch,
spellcheck, and result budget [S1-S3]. `query.altered` can reveal correction;
`show_strict_warning` can indicate strict filtering. No numeric relevance score
or rank explanation is exposed.

**FACT (high):** Explore mode omits `q` and returns general/popular or interesting
POIs around an anchor [S1, S3, S10, S11]. “Popular” and “interesting” are not
defined or scored in the response.

**INFERENCE (high):** result position is the only per-item relevance signal.
Distance is an attribute, not necessarily the sort key. A closer result can rank
below a farther result because textual, popularity, category, or other private
signals may contribute.

### 8.2 Vendor benchmark evidence

**FACT (medium, self-evaluation):** Brave reports a 1,000-query global,
multilingual comparison against Google Maps judged by an LLM (Opus 4.8): overall
6.4 vs 7.3, recall 7.2 vs 6.8 in Brave's favor, and precision 6.2 vs 8.2 in
Google's favor [S11]. Brave says it did better on ambiguous names,
streets/addresses, and recall, and worse on category ranking and fuzziness.

**FACT (high):** Brave itself discloses limitations: vendor-run setup, LLM judge
bias toward verbose listings, and failure to capture data staleness, where it
says Google has an edge [S11]. No query set, labels, scoring prompt, per-query
outputs, statistical uncertainty, latency distribution, or independently
reproducible artifact is linked in the post.

**INFERENCE (high):** the benchmark is directional marketing evidence, not a
Curiosity acceptance test. It supports the hypothesis that recall/long-tail
address matching may be strengths and category precision/freshness risks, but
does not establish performance for Curiosity's users, regions, languages, or
safety-sensitive queries.

### 8.3 Ranking unknowns

**UNKNOWN / negative result:** no first-party specification was found for place
candidate generation, entity deduplication, distance decay, popularity,
click/WDP use specifically in local ranking, textual matching, category
taxonomy, sponsor handling, chain diversity, geographic density normalization,
review influence, freshness weighting, closure demotion, spam/fraud resistance,
owner verification, multilingual transliteration, tie behavior, or Explore-mode
selection.

## 9. Privacy and safety boundary

### 9.1 Query and location privacy

**FACT (high):** the API privacy notice says search-query records are retained
for up to 90 days for billing, troubleshooting, abuse prevention, and legal
obligations. Brave says it does not collect identifiers linking a query to an
individual/device, while the customer may be able to make that link and is
responsible for notices and consent. Enterprise ZDR is optional and subject to
legal obligations [S20].

**FACT (high):** account/API processing can include IP address and authentication
token under the privacy table [S20]. Consumer Brave Search's anonymous-local
promises are a separate product/privacy contract and must not be imputed to API
calls [S21].

**INFERENCE (high):** exact coordinates, named locations, “near me” queries,
addresses, and sensitive-category searches can reveal routine, health,
religion, politics, relationships, or intent even without a provider-side end
user ID. The public notice does not specify whether coordinates in query
parameters/headers are included in the retained query record or separately
logged.

**RECOMMENDATION (high):** treat all query text, anchors, `geoloc`, and
`X-Loc-*` headers as disclosure to a third party. Minimize precision, do not send
background location without explicit purpose/consent, separate search anchor
from user location, redact telemetry, and obtain a reviewed ZDR/DPA position for
sensitive use cases.

### 9.2 SafeSearch is not physical-world safety

**FACT (high):** Place Search offers `off`, `moderate`, and `strict`, defaulting
to strict, and can return `query.show_strict_warning` [S1-S3]. The Place Search
documentation does not define which place categories or fields each level
filters, classifier accuracy, jurisdiction behavior, or whether photos,
profiles, generated descriptions, and follow-up details receive identical
filtering.

**INFERENCE (high):** SafeSearch does not certify that a place is lawful, open,
accessible, child-safe, non-discriminatory, in a safe area, or appropriate to
visit. Nor does it mitigate stalking, doxxing, sensitive-facility discovery,
fraudulent listings, unsafe routes, stale emergency information, or harmful
external URLs.

### 9.3 Output safety

Every returned string and URL is untrusted external data. Risks include:

- malicious or deceptive business/provider/profile/action URLs;
- markdown/HTML/link injection in generated descriptions;
- stale hours, addresses, contacts, closure state, or coordinates;
- phone/email abuse and personal information in listings;
- copyrighted or harmful images;
- false ratings or review-source ambiguity;
- exact coordinates for homes or sensitive sites; and
- model-generated narrative errors without citations.

**RECOMMENDATION (high):** sanitize display strings and markdown; allowlist URL
schemes; interpose warning/confirmation before external actions; do not
auto-call, book, order, email, or navigate; apply domain/network fetch policy;
proxy images only with rights and safety controls; label source and observation
time; and require independent verification for high-impact recommendations.

**FACT (high):** standard terms prohibit API use connected with surveillance,
interception, illegal activity, hate/offensive content, and other listed harmful
uses [S16]. This contractual restriction supplements rather than replaces
Curiosity's own abuse controls.

**FACT (medium, vendor assurance):** Brave states that the Search API is SOC 2
Type II attested and describes broader malicious-Web-index controls for
phishing, malware, and CSAM [S23]. Those system-level controls do not verify a
place's coordinates, hours, identity, reviews, external action URLs, or physical
safety.

## 10. Limits, errors, versioning, and pricing

### 10.1 Limits and billing units

**FACT (high):** Place Search returns at most 100 total items; both enrichment
endpoints accept at most 20 IDs per request [S1-S7]. IDs last about eight hours.
No response-byte maximum, batch-body alternative, asynchronous mode, pagination,
or place-specific latency/availability SLA is published.

**FACT (high, as accessed):** Place Search is included in the Search plan at $5
per 1,000 requests, with $5 monthly credit and advertised 50 requests/second
capacity [S1, S11, S13]. Place Search requests are billed separately from Web
Search [S1]. Only successful non-error requests count toward quota and billing
[S8].

| Workflow | Minimum successful calls | List-price implication |
| --- | ---: | ---: |
| discover up to 100 items | 1 Place Search | $0.005 |
| discover then enrich up to 20 IDs | 2 | $0.010 |
| discover + POIs + descriptions for up to 20 IDs | 3 | $0.015 |
| enrich 100 returned POIs in 20-ID batches | 5 additional POI calls | $0.025 additional |

**INFERENCE (medium):** this arithmetic treats each successful endpoint request
as one Search-plan request, consistent with flat per-request pricing and the
statement that follow-up endpoints share the plan. The subscription dashboard
should confirm exact metering before procurement; retries that succeeded
server-side should not be assumed free.

### 10.2 Rate limiting

**FACT (high):** rate limits use a one-second sliding window per subscription,
potentially alongside monthly quota. Responses expose `X-RateLimit-Limit`,
`X-RateLimit-Policy`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset`; excess
returns 429 [S8]. The advertised 50 RPS is plan capacity, not an SLA.

**RECOMMENDATION (high):** schedule the entire search-plus-enrichment DAG under
one bounded call budget, honor both windows, use bounded jittered retries, and
stop enrichment when the handle lifetime or request deadline is insufficient.

### 10.3 Errors and partial results

**FACT (high):** rendered references for all three endpoints document 200, 400,
404, 422, and 429. Error responses have top-level `type`, required `error`, and
`time`; child error catalogues are not expanded in the rendered pages [S2,
S4, S6].

**UNKNOWN / negative result:** public material does not fully document missing
or invalid auth responses, 5xx/timeouts, mixed valid/expired ID batches, result
alignment, per-item errors, partial success, unknown location resolution,
malformed provider data, or whether generated-description nulls are billable
successful responses.

**RECOMMENDATION (high):** classify transport, auth, permission, invalid query,
unresolved anchor, rate, expired handle, upstream, parse, partial, empty, and
null-enrichment outcomes separately. Join enrichments by returned `id`, never
only by array position. Preserve omission vs null vs empty.

### 10.4 Version and cache behavior

**FACT (high):** URL `v1` is the major version. `Api-Version: YYYY-MM-DD` can pin
backward-incompatible behavior; omission selects latest. New response fields,
new optional inputs, property reordering, and changes to object-ID/URL/display
string lengths and formats are considered backward compatible [S15].

**RECOMMENDATION (high):** pin a tested date version, parse unknown fields
additively, never regex IDs, and retain endpoint/version/request controls with
each provider observation. A date-pinned schema still does not pin corpus
contents, rank, third-party facts, or generated text.

## 11. Commercial, rights, and clean-room boundary

**FACT (high, not legal advice):** standard terms last updated 2026-02-11 grant
a limited, revocable API/result-use license for customer applications. Unless an
Order Form changes them, they prohibit [S16]:

- storing/caching/building a Search Results database beyond transient operation;
- derivative works of API, documentation, or Search Results;
- redistribution, resale, or sublicensing of Search Results;
- reverse engineering or bypassing rate/service limits;
- using the API to replicate or replace its functionality;
- using Search Results to create, evaluate, train, retrain, fine-tune,
  benchmark, or improve AI models/services; and
- retaining Search Results after termination.

**FACT (high):** as between Brave and customer, the terms assign Brave ownership
of Search Results subject to third-party rights. Third-party content may be
referenced, linked, or included, and Brave does not grant the third party's
rights. Results are supplied without accuracy, completeness, security,
non-infringement, or error-free warranties [S16].

**FACT (high):** the official skill repository is MIT licensed [S22]. That
license covers the repository's software/documentation material, not API Search
Results, place facts, reviews, images, provider profiles, or underlying index.

**RECOMMENDATION (high):** reject using standard-plan results to seed a durable
Curiosity place database, train entity resolution/ranking, or benchmark models.
Legal/procurement must approve exact Order Form rights for retention,
attribution, generated descriptions, third-party data/images, evaluation,
deletion, DPA/ZDR, and business continuity before any pilot.

## 12. Clean-room architecture lessons

| Public clue | Safe Curiosity lesson | Boundary |
| --- | --- | --- |
| direct `place_search` [S1-S3] | expose place discovery separately from Web page retrieval | do not force local discovery through Web results |
| temporary interoperable ID [S1, S3-S7] | model provider handles and enrichment handoffs explicitly | never use ephemeral handle as durable identity |
| typed buckets + `mixed` [S1-S3] | preserve entity class and provider presentation order separately | do not flatten city/address/POI into one entity type |
| soft radius [S1-S3] | distinguish ranking bias from hard spatial predicate | post-validate any hard geofence |
| anchor vs user geolocation [S2-S5] | model search area and user's position independently | do not leak user coordinates merely to anchor search |
| optional rich facts [S1-S5] | represent every fact as a source assertion | absence is not false/closed/unrated |
| provider URL/rating profile [S3-S5] | retain field/source attribution when present | one provider URL does not source every field |
| generated description endpoint [S6-S7] | separate narrative generation from structured truth | uncited markdown is not evidence |
| no content timestamps [S1-S7] | make freshness clocks and verification status mandatory | request time is not fact update time |
| up-to-100 unpaged window [S1-S3] | explicit candidate ceilings and stop reasons | no directory completeness claim |

**REJECTED (high confidence):** decoding IDs; scraping consumer Brave Maps;
tiling queries to clone the index; copying undocumented ranking/entity matching;
treating `canonical URL` as entity identity; treating radius as containment;
using generated descriptions as citations; inferring owner verification;
storing provider results as Curiosity's source of truth; or using API results to
train/evaluate Curiosity under the standard terms.

## 13. Curiosity implications and verdict ledger

| Verdict | Decision |
| --- | --- |
| **ADOPTED** | standalone place-discovery capability; typed POI/geographic/address buckets; explicit query and enrichment budgets; separate search anchor and user location; source-aware ratings; schedule intervals; opaque provider-rank preservation |
| **ADAPTED** | temporary Brave ID into generic expiring provider handle; `mixed` into auditable cross-type presentation rank; radius into `soft_radius_m`; rich result fields into field-level assertions; generated descriptions into quarantined narrative artifacts |
| **REJECTED** | Brave ID/URL as canonical identity; radius as geofence; rank as distance sort; ratings as source-free truth; hours as open-now proof; descriptions as evidence; Place Search as exhaustive directory, owned index, or durable ingestion source |
| **DEFERRED** | commercial pilot; Order Form rights; exact metering; authorized quality/freshness test; source roster; update/correction SLA; special-hours semantics; sensitive-place policy; business continuity/SLA |

### 13.1 Minimum provider-neutral contract

**RECOMMENDATION (high):** design from Curiosity's needs, not Brave's optional
schema:

```text
place_query:
  text? + requested_anchor? + user_position?
  + soft_geo_bias? + hard_geo_constraint?
  + locale_preferences + safety_policy
  + candidate_budget + enrichment_budget + deadline

provider_observation:
  provider + endpoint + api_version + observed_at
  + original_query? + altered_query? + resolved_anchor?
  + bucket + bucket_rank + mixed_rank? + provider_warnings[]
  + temporary_handle? { value, obtained_at, expires_at? }

place_candidate:
  curiosity_entity_id? + curiosity_site_id?
  + entity_class + names[] + coordinates[] + addresses[]
  + organization/brand/site relations + duplicate_candidates[]

field_assertion:
  field + value + source_profile? + source_url?
  + provider_observed_at + source_observed_at?
  + effective_at? + confidence? + verification_state

schedule_assertion:
  weekly_intervals + exceptional_intervals? + timezone?
  + source + observed_at + semantics_version

generated_artifact:
  text + format + generator/provider + generated_at?
  + source_evidence[] + safety_state + non_authoritative=true

governance:
  query_location_sensitivity + retention_basis + rights_state
  + correction/removal state + external_action_policy
```

### 13.2 Adapter behavior if separately authorized

1. Validate the query/anchor contract and minimize user-location precision.
2. Record requested and resolved geography separately.
3. Treat all buckets, strings, coordinates, and URLs as untrusted observations.
4. Preserve bucket rank and `mixed` rank; do not imply a universal score.
5. Record `radius` as soft; independently enforce any hard spatial rule.
6. Store Brave ID only as an expiring handle and complete bounded enrichment
   promptly.
7. Join enrichments by ID and retain missing/null/expired outcomes.
8. Keep every rating, hour, address, contact, and image as a sourced temporal
   assertion; unknown source/freshness remains unknown.
9. Quarantine generated descriptions from canonical facts and sanitize output.
10. Expire/delete provider results according to the reviewed commercial terms;
    retain only separately authorized Curiosity evidence.

## 14. Material unknowns and verification gates

### 14.1 Unknowns

1. Exact POI count, counting unit, coverage by country/language/category, and
   inclusion of closed/seasonal/non-business features.
2. Source-provider roster, per-field source mapping, licenses, and attribution
   obligations.
3. Entity merge/split, chain/branch, co-location, alias, relocation, closure,
   duplicate, and spam policies.
4. Coordinate provenance/precision and meaning of point geometry.
5. Exact ranking, Explore-mode, distance, country, language, and SafeSearch
   behavior.
6. Distance origin when anchor and `geoloc` differ; fallback when `geoloc` is
   absent.
7. Durable identity mapping across repeated searches, versions, and ID expiry.
8. Per-field freshness, recrawl cadence, source conflict resolution, and
   correction/removal propagation.
9. Special/holiday/overnight/24-hour schedule semantics and `current_day` clock.
10. Whether review bodies are ever returned; complete rating attribution and
    the `is_tripadvisor`/`profile` relationship.
11. Generated-description model, prompt, citations, source set, regeneration,
    safety, and freshness.
12. Complete error taxonomy, mixed-ID batch behavior, billability of nulls,
    latency, uptime, and support SLA.
13. Exact Search-plan metering for each follow-up endpoint and enterprise terms.
14. Place-specific owner claim/edit, appeals, sensitive-location, and takedown
    workflows.

### 14.2 Checks before any pilot

- **Legal/procurement:** exact Order Form; transient/durable retention;
  redistribution; third-party place/review/image rights; generated-text use;
  evaluation/AI restrictions; attribution; deletion; DPA/ZDR; termination and
  continuity.
- **Contract:** archive a dated schema; confirm all enum values (including
  `country=ALL`), nullability, total-count semantics, headers, ID expiry, mixed
  batches, distance origin, errors, and endpoint billing.
- **Privacy/safety:** location precision and consent; sensitive categories;
  minors; exact-address handling; external actions; SafeSearch propagation;
  markdown/image/URL sanitation; abuse response.
- **Authorized fixtures only:** customer-owned fictional/consenting businesses
  covering duplicate names, chains, co-location, moves, closure, missing
  coordinates, overnight/holiday hours, multiple rating scales, malformed URLs,
  and conflicting sources.
- **Authorized quality study:** predeclare regions/languages/query classes and
  budgets; measure entity precision/recall, hard-radius leakage, coordinate
  error, source attribution, stale/closed records, hours accuracy, duplicates,
  missing fields, and rank stability. Confirm terms permit the study and result
  retention first.
- **Exit:** provider outage/termination behavior, handle expiry, local fallback,
  and verified deletion of provider results.

## 15. Bounded curiosity pass

After synthesis, remaining in-frame threads were scored 1 (low) to 5 (high).
Cost includes access, contractual, privacy, and clean-room risk.

| Thread | Relevance | Value | Novelty | Cost | Outcome |
| --- | ---: | ---: | ---: | ---: | --- |
| Reconcile launch-post 20 km cap with current no-limit radius | 5 | 5 | 3 | 1 | **Pursued:** current changelog says restrictions lifted 2026-03-04; old launch limit is historical [S1, S10]. |
| Determine whether POI ID is durable identity | 5 | 5 | 2 | 1 | **Pursued:** docs repeatedly say opaque, about eight hours, do not store; no stable-ID promise [S1, S3-S7]. |
| Find source and freshness evidence for each fact | 5 | 5 | 4 | 2 | **Pursued:** provider/rating clues exist, but no field timestamps/lineage; Brave admits crawler/WDP staleness disadvantage [S3-S5, S11]. |
| Determine whether “reviews” means review bodies | 4 | 5 | 3 | 1 | **Pursued:** schema exposes aggregate rating and foreign-language availability, not review text/author/date. Negative result retained [S4-S5]. |
| Resolve distance origin | 4 | 4 | 4 | 2 | **Pursued to saturation:** API says `geoloc` computes distance; prose says search center. Exact precedence remains unknown [S1-S3]. |
| Find business-owner claim/edit API | 4 | 4 | 3 | 2 | **Pursued:** API support/general index processes found; no place-specific owner workflow in public docs. Negative result retained [S17-S18]. |
| Decode ID to infer source/entity structure | 2 | 1 | 4 | 5 | **CURIOSITY_NO_GO:** ID is explicitly opaque/format-variable; decoding is unnecessary and outside clean-room need. |
| Call endpoint to test rank, expiry, errors, and fields | 5 | 5 | 3 | 5 | **CURIOSITY_NO_GO:** no credential/test authority; terms constrain benchmarking and retention. Deferred to reviewed pilot. |
| Tile geography to estimate/export index | 3 | 2 | 3 | 5 | **CURIOSITY_NO_GO:** incomplete due soft radius/no pagination, expensive, and conflicts with database/API-replacement boundary. |
| Reproduce vendor Google comparison | 3 | 3 | 3 | 5 | **CURIOSITY_NO_GO:** paid calls, proprietary results, and benchmarking rights absent; vendor caveats already bound the claim. |
| Reverse engineer private source providers/ranking | 2 | 2 | 4 | 5 | **CURIOSITY_NO_GO:** no interoperability need; public field/source gaps are sufficient for architecture decision. |

**Stop condition:** requested categories are covered and public sources are
saturated. Remaining material questions require an authorized subscription,
contract, test corpus, vendor answer, or legal/privacy review. Private algorithm
reconstruction would not change the provider-neutral verdict.

## 16. Primary source ledger

All sources are first-party Brave material and were accessed **2026-08-17**.
Vendor documentation supports the published contract or vendor claim, not
effective coverage, accuracy, safety, freshness, rights, or benchmark validity.

| ID | Primary source | Material used |
| --- | --- | --- |
| S1 | [Place Search service guide](https://api-dashboard.search.brave.com/documentation/services/place-search) | endpoint role, 200M+ claim, inputs, radius/explore guidance, schema, IDs, billing note, changelog |
| S2 | [Place Search API reference](https://api-dashboard.search.brave.com/api-reference/web/place_search) | exact GET path, bounds/defaults, `geoloc`, headers, nullable buckets, response/error statuses |
| S3 | [Official Place Search skill](https://github.com/brave/brave-search-skills/blob/main/skills/local-place-search/SKILL.md) | expanded fields/optionality, shared count budget, empty-query validation, ID/details flow |
| S4 | [Local POIs API reference](https://api-dashboard.search.brave.com/api-reference/web/local_pois) | detail inputs, location headers, cache/version headers, nullable response, statuses |
| S5 | [Official Local POIs skill](https://github.com/brave/brave-search-skills/blob/main/skills/local-pois/SKILL.md) | max 20, expanded detail schema, rating source, review-language flag, actions, related Web results |
| S6 | [POI Descriptions API reference](https://api-dashboard.search.brave.com/api-reference/web/poi_descriptions) | ID input, nullable result envelope, headers, statuses |
| S7 | [Official Local Descriptions skill](https://github.com/brave/brave-search-skills/blob/main/skills/local-descriptions/SKILL.md) | max 20, ID-keyed nullable markdown, AI-generated/Web-context characterization |
| S8 | [Rate limiting guide](https://api-dashboard.search.brave.com/documentation/guides/rate-limiting) | sliding window, quota headers, successful-request billing |
| S9 | [Web Search service guide](https://api-dashboard.search.brave.com/documentation/services/web-search) | older local flow, shared temporary IDs, two enrichment endpoints |
| S10 | [Place Search launch announcement, 2026-02-26](https://brave.com/blog/place-search-api/) | product origin, consumer-map relation, launch capabilities/latency claim, historical radius cap |
| S11 | [Improved Place Search announcement and evaluation, 2026-07-08](https://brave.com/blog/place-search-improved/) | current price, index/stack/source claims, fields, benchmark and caveats, staleness admission |
| S12 | [Brave Search API product page](https://brave.com/search/api/) | independent-index positioning, current plan/capacity, Place news links, enterprise/ZDR |
| S13 | [API pricing](https://api-dashboard.search.brave.com/documentation/pricing) | Search plan price, credit, 50 RPS, enterprise option |
| S14 | [Authentication guide](https://api-dashboard.search.brave.com/documentation/guides/authentication) | subscription-token requirement and secret handling |
| S15 | [Versioning guide](https://api-dashboard.search.brave.com/documentation/guides/versioning) | URL/date versions, latest default, additive/ID-format compatibility policy |
| S16 | [Search API Terms of Use, updated 2026-02-11](https://api-dashboard.search.brave.com/documentation/resources/terms-of-service) | license/restrictions, ownership, third-party content, disclaimers, harmful-use restriction, termination |
| S17 | [API Help & Feedback](https://api-dashboard.search.brave.com/documentation/resources/help-feedback) | public API support channel and index FAQ boundary |
| S18 | [Brave Search index RTBF/objection process](https://search.brave.com/help/brave-search-index-right-to-be-forgotten) | broader index control, URL delisting, crawler recrawl context |
| S19 | [Web Discovery Project explainer](https://support.brave.app/hc/en-us/articles/4409406835469-What-is-the-Web-Discovery-Project-) | WDP inputs, unlinkability, retention, filtering, crawler/fetch-job relationship |
| S20 | [Search API privacy notice, updated 2025-12-04](https://api-dashboard.search.brave.com/documentation/resources/privacy-notice) | 90-day query records, account/IP/token processing, customer duties, ZDR |
| S21 | [Consumer Brave Search privacy notice](https://search.brave.com/help/privacy-policy) | consumer anonymous-local behavior and API/consumer boundary |
| S22 | [Official skill repository license](https://github.com/brave/brave-search-skills/blob/main/LICENSE) | MIT scope for skill material only |
| S23 | [Search API security](https://api-dashboard.search.brave.com/documentation/resources/security) | SOC 2 claim, malicious-Web controls, RTBF/security governance; not place-field verification |

## 17. Verification record

- Read the repository constitution before research.
- Triangulated Place Search parameters/schema across the service guide, rendered
  reference, and official skill.
- Triangulated detail and generated-description contracts across each rendered
  reference and its official skill.
- Triangulated index/source/ownership claims across product docs, two launch
  posts, WDP documentation, terms, and privacy material.
- Retained negative results: no durable ID, pagination, hard radius, bbox/polygon,
  stable snapshot, score/explanation, field source/time, owner verification,
  open-now/special hours, review bodies, description citations, complete errors,
  or place-specific SLA/correction contract.
- Retained contradictions/drift: historical 20 km cap vs current no limit;
  distance-from-center prose vs `geoloc` contract; canonical/provider URL
  examples; `is_tripadvisor` vs rating profile; and product “reviews” prose vs
  no review-body schema.
- No credential, API call, payment, result download, benchmark, ID decoding,
  source scraping, proprietary behavior reconstruction, or edit outside
  `docs/research/products/brave-place-search-api.md` was performed.
