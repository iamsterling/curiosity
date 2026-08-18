# Jina AI Search and Reader: clean-room product reconstruction

**Research date / source access:** 2026-08-17  
**Subject:** the hosted `s.jina.ai` Search surface and `r.jina.ai` Reader
surface, treated as distinct but related services.  
**Status:** research evidence and recommendations only; not an implementation,
benchmark, security assessment, or deployment record.  
**Overall confidence:** high for public contracts and the published OSS branch;
medium for hosted internals; low where Jina's current pages contradict one
another or the hosted-only storage implementation is absent.

## Executive verdict

**REJECTED as Curiosity's search/index foundation (high confidence).** Jina
Search is not evidence of a Jina-owned broad-web index. Jina's own architecture
document says Search primarily relies on external SERP providers. The published
code tries provider results (Serper/Google/Bing paths), can race them against a
Reader-local cache index, then fetches and extracts result pages with Reader.
This is a useful *search-and-read convenience product*, but its source coverage,
ranking lineage, provider choice, cache state, and full hosted index behavior are
not sufficiently transparent for an owned Curiosity retrieval plane
[S1][S3][S5].

**DEFERRED as an evaluation oracle or optional, tightly bounded Reader adapter
(medium confidence).** Reader has valuable contract ideas: explicit fetch
engines, render-completeness controls, selector narrowing, cache tolerance,
output-token rejection versus truncation, content/link/image retention, and
structured output. A hosted reader nevertheless receives every submitted URL
and possibly cookies or proxy credentials, performs server-side fetches, and
returns untrusted transformed content without capture identity or a complete
provenance chain. Curiosity should own the default fetch/extract path; a later
Jina adapter would require legal, privacy, SSRF, reliability, and reproducibility
gates [S2][S4][S8].

**ADAPTED, not copied (high confidence):** separate discovery from reading;
separate source bytes, rendering, extraction, and formatting; make freshness and
boundedness caller-visible; stream progressive work only behind a bounded
contract; distinguish “reject if too large” from “truncate to fit.” Do **not**
adopt silent stale fallback, opt-in robots enforcement, opaque provider/index
races, forwarding ambient credentials, or content-heavy search as Curiosity's
provider-neutral ABI.

## 1. Decision frame, method, and boundaries

### 1.1 Bounded questions

1. What does each public surface accept and return?
2. Does Search use an owned index, an external SERP, a cache-derived local
   index, or some combination?
3. How does Reader fetch, render, extract, cache, bound, and timestamp content?
4. What provenance, freshness, safety, SSRF, privacy, pricing, and operational
   guarantees are actually exposed?
5. Which behavior can Curiosity learn from clean-room, and what must it reject?

**Coverage threshold:** primary evidence for every requested category, explicit
fact/inference/unknown labels, hosted-versus-OSS boundaries, and exact Curiosity
implications. **Stop conditions:** category coverage, repeated evidence, or a
question requiring credentials, paid traffic, access-control bypass, or
non-public hosted code.

### 1.2 Clean-room method

- Read the official product page, live OpenAPI documents for both origins,
  official legal page, official launch article, status page, and Jina's public
  `jina-ai/reader` repository.
- Inspected a temporary, read-only clone at commit
  `1574bfd380d249c86c82db4dace0d9c8fe17e2b1` (commit timestamp 2026-05-22),
  outside this workspace. The repository is Apache-2.0, but its README says it
  is an OSS branch with the MongoDB-backed SaaS storage layer removed [S3][S5].
- Compared that pinned source with live OpenAPI version `0.5.0+4e81fa5`.
- Made no Search or Reader content request, used no key or credential, incurred
  no paid call, tested no private/blocked URL, and attempted no bypass. This is
  documentary/source reconstruction, not black-box probing.
- Jina's terms prohibit reverse engineering of the Services and competitive use
  of Output. This report therefore relies only on Jina's intentionally public,
  Apache-licensed source and public documentation, derives no hidden code, and
  recommends concepts rather than code transfer [S8].

### 1.3 Labels

- **FACT** — directly stated by a cited primary source or present in the pinned
  public source.
- **INFERENCE** — the most plausible architecture/behavior implied by facts,
  not independently measured against hosted traffic.
- **RECOMMENDATION** — a Curiosity design choice.
- **UNKNOWN** — primary evidence was absent, conflicting, or hosted-only.

Vendor statements establish advertised behavior, not independent quality,
security, factuality, completeness, or scale.

## 2. Two surfaces, one extraction stack

| Dimension | Search (`s.jina.ai`) | Reader (`r.jina.ai`) |
| --- | --- | --- |
| Caller supplies | Query plus search/filter/fetch options | A URL, or via POST raw HTML/document input |
| Primary job | Discover ranked candidates, then fetch/extract their pages | Fetch/render one supplied resource and extract/format it |
| Public paths | `GET/POST /search`, `GET/POST /{q}` | `GET/POST /`, `GET/POST /{url}` |
| Auth | API key required in current code/product table | Anonymous 20 RPM or keyed tiers |
| Default result | Public page says top five; current source defaults `count=10` and targets six qualified pages | One formatted page |
| JSON payload | Envelope whose `data` is `FormattedPage[]` | Envelope whose `data` is one `FormattedPage` |
| Shared mechanism | Uses the Reader crawler/formatter to hydrate SERP candidates | The crawler/formatter itself |
| Freshness risk | SERP cache plus per-page cache plus upstream search freshness | Per-URL cache plus target/CDN/browser state |
| Billing | Fixed floor starting at 10,000 tokens/request | Output-response tokens, with feature scalars |

**FACT (high):** Jina describes Search as searching the web and returning the
content behind results, while Reader converts a caller-selected URL. The
repository says Search fetches each result and reuses the Reader stack [S1][S2].

**INFERENCE (high):** these should not be collapsed into one provider-neutral
Curiosity operation. Search decides *what evidence candidates exist*; Reader
decides *what a selected resource says now*. Combining both hides ranking,
fetch, and extraction failures behind one result and makes freshness ambiguous.

## 3. Search surface and contract

### 3.1 Request contract

**FACT (high):** the live `s.jina.ai` OpenAPI exposes `GET/POST /search` and
`GET/POST /{q}`. The current public source accepts:

- query in the path or `q`;
- `type`: `web` (default), `images`, or `news`;
- `count`/`num`: 0–20 (source default 10);
- `provider`/`engine`: `google`, `bing`, or `reader`;
- country `gl`, language `hl`, free-form `location`, result `page`, `fallback`,
  and `nfpr`;
- explicit operators including repeated `site`, `ext`, `filetype`, `intitle`,
  language, and location-like constraints;
- Reader fetch/format controls inherited into Search, including response mode,
  cache control, selectors, locale, and output token trimming [S4][S5].

**FACT (high):** Search supports plain text, JSON, and server-sent event
responses. JSON is an envelope (`code`, `status`, `data`, optional `meta`). Each
formatted result can contain `title`, `description`, `url`, `content`, chunks,
`publishedTime`, HTML/text, screenshot URLs, page count, links, images, warning,
metadata, and external relations [S4][S5]. Search text formatting may also show
source, date, image dimensions, favicon, and the fetched content.

**Material drift (high confidence):** the product page repeatedly promises five
results, while live source/OpenAPI permit 0–20, the source defaults to 10, and
an internal qualification target is six. Treat “top five” as marketing/default
history, not a durable contract. The 2024 launch article also documents old
anonymous Search access and old rate/latency values that no longer match the
2026 product table [S2][S7].

### 3.2 Search flow reconstructed

```text
query + filters + output controls
  -> authenticate / rate-limit
  -> normalize explicit query operators
  -> for ordinary web search with cache enabled:
       race external/cached-SERP path against Reader-local index path
     otherwise:
       selected path/provider
  -> external path tries configured providers in order
  -> map SERP title/link/snippet/date-like fields
  -> fetch candidate URLs through Reader, in parallel/progressively
  -> format extracted page content
  -> prefer qualified pages and cap result count
  -> plain text / JSON / SSE
  -> charge at least fixed Search floor
```

**FACT (high):** provider iteration in the pinned source uses configured Serper
Google first when available, native Google, Bing, and a common Google SERP path;
explicit Bing and Google preferences change order. The official architecture
says Reader “primarily relies on external SERP providers” [S3][S5].

**FACT (high):** Search is not merely a snippet API. It maps SERP results to
partial pages, calls the crawler for all candidate URLs, progressively fills the
objects, and considers a page qualified when it has a title plus content or a
screenshot/pageshot/text/HTML representation [S5].

**INFERENCE (high):** ranking is primarily inherited from the selected upstream
SERP. Hydration can remove/unqualify pages and preserve order among accepted
ones, but no first-party relevance model or stable rank explanation is exposed.

### 3.3 Index evidence: what exists and what does not

**FACT (high):** the public model contains `IndexedPage` fields for URL digest,
domain/TLD, language, geolocation, title, description, text, semantic text,
created/published/scraped/expiry times. The storage interface exposes
`indexWebSearchEntry`, `indexSnapshot`, and `searchLocalIndex`, whose results
contain score, highlights, and sequence [S5].

**FACT (high):** external web SERP entries are submitted to the local index with
language/geolocation, and Search-fetched pages are marked eligible for page
indexing. A `provider=reader` option searches only that local index. For normal
web queries, local-index results may race live/cached upstream results and can
win when quicker [S5].

**FACT (high):** the OSS `StorageLayer` implementations of indexing and local
search are no-ops. The README and architecture explicitly say the MongoDB SaaS
storage/index/rate-limit layer is not included [S3][S5].

**INFERENCE (high):** the local index is best described as a *cache-derived
index of previously encountered SERP entries and fetched snapshots*, not an
independently crawled, owned broad-web index. It can improve latency/resilience
and accumulate useful pages, but corpus coverage depends on prior demand and
external providers.

**UNKNOWN (low confidence):** hosted local-index engine, analyzers, semantic
field population, scoring formula, deduplication, canonicalization, corpus size,
recrawl policy, deletion handling, spam controls, click signals, and the actual
fraction of queries won by the local race. Nothing public supports a claim of
independent whole-web coverage.

### 3.4 Search freshness and failure semantics

**FACT (high, pinned source):** SERP records are retained seven days and treated
fresh for one hour. If live upstream search fails and an older record exists,
the source silently yields stale cache. Search hydration defaults each page to a
24-hour cache tolerance. This is separate from Reader's one-hour source default
and the product FAQ's “same URL within five minutes” statement [S2][S5].

**FACT (high):** Search result output can include source-claimed dates, but its
public contract does not require query execution time, SERP cache age, page
fetch time, page-cache age, provider, original rank, extraction version, content
hash, or whether stale fallback occurred [S4][S5].

**INFERENCE (high):** “latest world knowledge” is an aspiration, not a
provenance guarantee. A Search response can combine a cached SERP (up to the
stale fallback retention), independently cached pages, and heterogeneous
publisher dates without exposing those clocks.

**RECOMMENDATION (high):** Curiosity must never silently substitute stale
search or document state. Return `query_observed_at`, upstream/index lineage,
`rank_at_source`, `serp_cache_age`, `document_fetched_at`, `document_cache_age`,
and explicit `fresh|stale-fallback|unknown` states.

## 4. Reader live fetch, rendering, and extraction

### 4.1 Fetch and render engines

**FACT (high):** Reader supports an automatic combination of a lightweight
`curl-impersonate` path and headless Chrome/Puppeteer; the caller can force
`curl`, `browser`, or experimental Cloudflare Browser Rendering. Curl does not
execute JavaScript. Browser does and is required by selectors, scripts,
viewports, some timing modes, iframes/shadow DOM, and visual outputs [S1][S3].

**FACT (high):** response readiness is controllable as raw HTML, visible
content, mutation-idle, resource-idle, media-idle, or network-idle. A timeout is
at most 180 seconds; a timeout of at least 20 seconds implies network-idle in
the pinned implementation. Default auto mode chooses based on requested output
and page behavior [S1][S4][S5].

**FACT (high):** Reader accepts target/wait/remove CSS selectors, locale,
referer, user-agent, viewport, cookies, custom/provided proxy, iframe and shadow
DOM inclusion, base-URL mode, custom JavaScript, image captioning, and link/image
summaries. POST also supports uploaded/raw HTML and binary documents in the
current source and live schema [S1][S4][S5].

**Documentation contradiction (high confidence):** the product UI and live
schema advertise POST file/HTML input and forwarded cookies, while the FAQ says
local HTML is unsupported and content behind login cannot be accessed. The
most charitable reading is that upload and cookie-forwarding capabilities were
added without all FAQ text being updated, or that some hosted-tier/access
constraints remain. Capability must be tested in an approved evaluation before
relying on it.

### 4.2 Extraction and formatting

**FACT (high):** Reader's default content path uses Mozilla Readability to
isolate main content, followed by a custom rule-based HTML-to-Markdown layer.
Requesting raw `markdown` bypasses Readability and converts the fuller page.
Alternative outputs include text, HTML, screenshots/pageshots, YAML
frontmatter, chunks, and experimental ReaderLM-v2/VLM paths [S1][S3][S5].

**FACT (high):** PDF.js handles PDFs; LibreOffice converts Office documents to
PDF/HTML; a vision-language model may caption images. The architecture names
`gemini-2.5-flash-lite` as the current VLM provider and says ReaderLM-v2 is an
experimental conversion engine [S3].

**FACT (high):** response fields preserve title, description, URL, extracted
content, optional source-claimed publication time, links/images, warnings, and
some metadata. Chunking is heading-based (`h1`–`h5`) or structured
(`s1`–`s5`) [S1][S4][S5].

**INFERENCE (high):** transformed Markdown is a lossy, extractor-versioned view,
not a capture. Readability, dynamic timing, viewport, locale, cookie state,
target selectors, image models, and base-URL choice can all change what the
same URL means. Reader does not expose enough mandatory state to reproduce a
response later.

### 4.3 Caching and live-fetch semantics

**FACT (high):** `X-No-Cache`/`cacheTolerance=0` requests a live fetch;
`X-Cache-Tolerance: N` accepts a cached result younger than N seconds. Cookies,
injected scripts, viewport, instruction, overlay removal, and invisible-element
detachment make cached reuse inapplicable in the pinned source. `DNT: 1` marks
the request private and suppresses result caching/indexing [S1][S5].

**FACT (high, pinned source):** URL digests lower-case the whole normalized URL
and remove ordinary fragments; snapshots are retained seven days, default cache
freshness is one hour, and signed screenshot links are short-lived. The hosted
FAQ instead says a repeat within five minutes is cached. Search has its own
one-hour SERP and 24-hour page tolerances [S2][S5].

**UNKNOWN (medium):** actual hosted default cache lifetime in version
`0.5.0+4e81fa5`, regional cache coherence, eviction, whether `DNT` suppresses
all logs versus only product cache/tracking, cache key variation by headers,
and whether deletion propagates to backups. “No cache or track” is not a full
retention specification.

**RECOMMENDATION (high):** Curiosity should key captures by normalized request
policy plus final URL and content hash, preserve immutable raw bytes separately,
and return cache creation/age explicitly. Locale, viewport, cookie state,
renderer, selector policy, and extractor version belong in provenance, not in
an implicit cache key.

### 4.4 Token and resource bounds

**FACT (high):** `X-Token-Budget` rejects Reader output when intended charge
exceeds the budget. `X-Max-Tokens` (minimum 500) truncates output instead. The
live docs explicitly say token budget is ignored by Search [S1][S4][S5].

**FACT (high, pinned source):** Reader's fetch timeout is capped at 180 seconds;
the curl download ceiling defaults to 1 GiB; browser abuse controls stop around
3,300 total requests, 1,000 document requests, or 200 domains. Those are source
observations, not promised hosted limits [S5].

**FACT (high):** Search charging is at least 10,000 tokens per ten-result block,
scaled for Bing/non-web variants in the source, with a two-million-token cap.
ReaderLM-v2 costs 3×; proxy allocation can scale Reader charge by 5×. The
public table only guarantees that Search starts at a fixed 10,000 tokens and
Reader counts output tokens [S2][S5].

**RECOMMENDATION (high):** preserve the reject/truncate distinction, but bound
inputs before expensive work: redirects, response bytes, decompressed bytes,
DOM nodes/depth, subresources, domains, render seconds, extracted tokens, and
aggregate search fan-out. Search needs a total token/output budget; Jina's
ignored Search token budget is unsuitable for agent authority.

## 5. Provenance and temporal semantics

### 5.1 What is retained

**FACT (high):** a result can carry source URL, title, description, content,
links/images, metadata, and `publishedTime`. Search-local records model
`createdAt`, `publishedAt`, and `scrappedAt`; SERP/page cache records have
creation and expiry times internally [S4][S5].

**FACT (high):** `publishedTime` is synthesized from parsed page metadata,
`article:published_time`, or HTTP `Last-Modified`; PDF publication time may come
from PDF modification or creation metadata. These signals are not equivalent
and the public result does not identify which won [S5].

### 5.2 Missing chain of custody

**FACT (high):** mandatory public output does not identify:

- query provider/index and original rank;
- requested URL versus redirect chain versus canonical URL;
- fetch start/end and cache creation/age;
- HTTP status, ETag, `Last-Modified` as a distinct field, or response headers;
- capture/content hash, immutable version ID, renderer/extractor/model version;
- publication-time source and confidence;
- extraction offsets mapping Markdown passages back to captured bytes/DOM;
- robots/policy decision or access context;
- partial-result/fetch failure details per Search hit.

**INFERENCE (high):** a URL citation proves attribution intent, not that the
cited claim appeared in a specific immutable resource version. “Published Time”
can actually mean server `Last-Modified`, and stale page content can be paired
with a fresh query.

**RECOMMENDATION (high):** Curiosity requires separate times:
`query_observed_at`, `fetch_started_at`, `fetch_completed_at`, `first_seen_at`,
`last_seen_at`, `source_claimed_published_at`, `source_claimed_modified_at`, and
`valid_time` where known. Every extracted passage should point to capture ID,
content hash, extractor version, and offsets/anchor evidence.

## 6. Safety, SSRF, access policy, and privacy

### 6.1 Server-side fetching and SSRF

**FACT (high):** Reader is an arbitrary-URL server-side fetcher with optional
browser execution, redirects, subresources, cookies, caller scripts, proxies,
iframes, and shadow DOM. Jina's architecture says the SaaS blocks suspicious
addresses, throttles per-page work, blocks abusive domains for anonymous users,
and falls back on excessive DOM complexity [S3].

**FACT (high, pinned OSS source):** target normalization allows HTTP, HTTPS, and
internal blob URLs; rejects direct non-public IPs; and, only under a
production-on-GCP flag, rejects `localhost` and hostnames resolving to non-public
addresses. Browser interception blocks circular hosts and, under that same flag,
`localhost`/`127.*`; it also caps request/domain counts [S5].

**SECURITY INFERENCE (medium):** the public source demonstrates intent but is
not sufficient evidence of robust hosted SSRF defense. The checks are
environment-conditional, and the inspected browser subrequest guard is narrower
than the initial target's non-public CIDR check. The public code does not by
itself prove DNS pinning and address revalidation for every redirect and every
browser subresource. This is **not** a claim that the hosted service is
vulnerable: hosted filtering/network controls are omitted and were not tested.

**RECOMMENDATION (high):** Curiosity must resolve and validate every connection
and redirect against denylisted IPv4/IPv6/link-local/loopback/private/metadata
ranges, pin approved addresses, isolate renderers in no-credential sandboxes,
deny ambient cloud metadata and internal DNS, limit protocols/ports, and apply
the same policy to subresources, scripts, frames, proxies, and redirects.

### 6.2 Robots, anti-bot behavior, and access controls

**FACT (high):** robots enforcement is opt-in via `X-Robots-Txt`; it is not the
Reader default. The pinned implementation fetches `/robots.txt` and applies a
small custom parser. It treats retrieval failure as public access [S1][S5].

**INFERENCE (medium):** that parser is not evidence of full RFC 9309 semantics
(for example, longest-match and complete group handling). Curiosity should not
reuse it as a policy specification.

**FACT (high):** the current FAQ says Reader does not bypass blocks or anti-bot
controls and paid keys do not unlock blocked sites. The public README, however,
recommends forced browser mode, hosted rotating residential/datacenter proxies,
and third-party residential proxies to handle common anti-bot challenges [S1]
[S2].

**CONTRADICTION (high confidence):** “does not actively circumvent” and
“rotates proxies and handles anti-bot challenges” are materially different
descriptions. Regardless of intent, Curiosity should reject bypass-oriented
behavior and require explicit site-policy/legal approval for any proxy route.

### 6.3 Prompt/data safety

**FACT (high):** Search and Reader return page-controlled Markdown, links,
metadata, image captions, and optionally iframe/shadow content. Jina's terms say
output is not guaranteed complete, accurate, or true and must be reviewed [S8].

**INFERENCE (high):** extraction does not make content trusted. Hydrated Search
results increase prompt-injection exposure because one query fans out into
multiple rendered pages, third-party links, and model-generated image captions.

**RECOMMENDATION (high):** mark every field untrusted; never execute page
instructions; strip or quarantine active content; preserve source boundaries;
validate all returned URLs before later fetches; and keep evidence text outside
the agent's authority/control channel.

### 6.4 Privacy and credentials

**FACT (high):** Reader can receive target URLs, custom cookies, referers,
scripts, uploaded documents, proxy URLs (possibly containing credentials), and
the resulting content. Cookie/script/viewport requests are excluded from cache;
`DNT` says no caching/tracking. Jina says API inputs/outputs are not used to
train models [S1][S2][S8].

**FACT (high):** Jina's legal page, last modified 2026-05-04, points post-
acquisition processing to Elastic's DPA/privacy terms. It permits retention of
operational, diagnostic, and usage metadata in aggregated/anonymized form and
says Input/Output is stored as required to provide the service. It does not give
a Reader-specific URL/content/log retention schedule on the cited page [S8].

**INFERENCE (high):** “DNT” lowers product-cache exposure but is not enough to
authorize secrets or private content. A submitted URL itself may contain
sensitive path/query data; forwarded cookies and proxy credentials cross a
third-party trust boundary even if output caching is disabled.

**RECOMMENDATION (high):** Curiosity should never send ambient browser cookies,
authorization headers, intranet URLs, signed URLs, user documents, or proxy
credentials to a hosted reader by default. If an adapter is ever approved, use
public URLs only, redact query secrets, disable provider caching, enforce data
classification and regional policy, and document vendor/subprocessor retention.

## 7. Limits, pricing, and operations

### 7.1 Published limits on 2026-08-17

| Surface/tier | No key | Free key | Paid key | Premium key | Counting |
| --- | ---: | ---: | ---: | ---: | --- |
| Reader | 20 RPM | 500 RPM | 500 RPM | 5,000 RPM | Output response tokens |
| Search | blocked | 100 RPM | 100 RPM | 1,000 RPM | Fixed, starting at 10,000 tokens/request |

**FACT (high):** Jina advertises average latency of 7.9 s for Reader and 2.5 s
for Search, ten million free tokens on each new key, one shared key/balance for
Search Foundation products, and no token deduction for failed requests. These
are vendor figures, not this study's measurements [S2].

**FACT (high):** the same page also gives generic cross-API concurrency/rate
figures (free 2 concurrent, paid 50, premium 500; 10,000 requests/60 s IP cap),
but its product-specific Reader/Search table differs from generic free RPM.
Product-specific limits should control planning and be revalidated [S2].

**UNKNOWN (medium):** exact current top-up package prices are behind an API-key
purchase flow and were not accessed. No cost per page/query can be responsibly
quoted without content-size distributions, feature scalars, Search result
count, cache behavior, and actual checkout terms.

### 7.2 Reliability evidence

**FACT (medium):** the official status page showed approximately 99.98% 90-day
uptime for both origins at access time, while also listing recent regional
Reader partial outages and Search latency/error degradation [S9]. Status-page
figures are vendor telemetry, not an SLA.

**RECOMMENDATION (high):** treat the surfaces as fallible dependencies: strict
timeouts, circuit breaking, bounded retry with jitter, no retry on deterministic
policy/budget errors, per-result partial failures, and an owned fallback. Never
make stale fallback invisible merely to improve availability.

## 8. Architecture inferences

### 8.1 Supported reconstruction

```text
                         +-----------------------------+
Search query ---------->| Search host                 |
                         | - auth/rate/billing         |
                         | - SERP cache (Mongo in SaaS)|
                         | - external SERP providers  |
                         | - local cache index race    |
                         +--------------+--------------+
                                        |
                                        | candidate URLs
                                        v
URL / uploaded document -> Reader crawler host
                         | - URL/policy/abuse checks
                         | - page/snapshot cache
                         | - curl / Chrome / CF render
                         | - PDF.js / LibreOffice
                         | - Readability / rules / LM
                         | - VLM captions
                         | - format / chunk / bound
                         v
                  text | JSON envelope | SSE
```

**FACT (high):** the application is multi-threaded Node.js. Hosted deployment is
described as GCP Cloud Run; MongoDB Atlas stores/indexes metadata and rate-limit
state; Google Cloud Storage stores cache data; model/billing services are behind
private VPC links; Jina describes separate US and EU clusters [S3].

**FACT (high):** the OSS image can be stateless or use S3-compatible bucket
caching. It omits SaaS MongoDB storage, billing, and full rate limiting. The code
is Apache-2.0, while ReaderLM-v2 is CC-BY-NC 4.0/non-open-source for commercial
purposes according to Jina's FAQ. Runtime also requires separately licensed or
non-redistributable assets [S2][S3][S5][S6].

**INFERENCE (high):** Search is an orchestration layer over (a) external SERP,
(b) demand-shaped local cache/index, and (c) Reader fan-out. Reader is a
fetch/render/extract service with optional persistent cache. The two share DTOs,
formatting, cache machinery, auth, and token accounting but have different
epistemic roles.

**UNKNOWN (medium):** hosted queueing, autoscale controls, tenant isolation,
browser sandbox details, cache encryption/keying, provider selection frequency,
index backend/query DSL, observability retention, and disaster recovery.

## 9. Exact Curiosity implications

### 9.1 Provider-neutral contracts

**RECOMMENDATION — ADOPT (high):** expose two internal operations even if an
adapter can fuse them:

1. `discover(query, filters, max_candidates, freshness_policy)` returns lean,
   ranked candidate records and retrieval lineage.
2. `read(url, capture_policy, extraction_policy, output_budget)` returns a
   versioned capture/extraction record.

Search results should not inline full pages by default. The researcher can
select a diverse bounded subset to read, preserving authority and budget.

Minimum discovery fields:

```text
candidate_id, query_id, url, title, snippet,
source_provider_or_index, source_rank, retrieved_at,
serp_cache_state/age, published_hint{value,source,confidence},
language, region, result_type, selection_reason, warnings
```

Minimum read fields:

```text
requested_url, redirect_chain, final_url, canonical_url,
fetch_started_at, fetch_completed_at, cache_state/age,
http_status, content_type, bytes, content_hash, capture_id,
renderer/version, locale/viewport, extraction_policy/version,
source_claimed_times with origins, content/passages/anchors,
truncated, token_count, policy_decision, warnings/partial_failures
```

### 9.2 Freshness and evidence

- **ADOPT:** separate SERP and document caches; explicit caller tolerance.
- **ADAPT:** stale fallback only when requested, labeled with both ages.
- **REJECT:** a single “date” or “publishedTime” that conflates page metadata,
  HTTP modification, and fetch time.
- **ADOPT:** immutable captures and passage hashes so citations survive recrawl.
- **ADOPT:** ranking/provider trace; local-index score must not masquerade as an
  upstream rank.

### 9.3 Safety and boundedness

- **ADOPT:** public HTTP(S)-only egress, DNS/redirect/subresource revalidation,
  no ambient credentials, isolated renderer, strict byte/decompression/DOM/
  subresource/domain/time/token ceilings.
- **ADAPT:** `token_budget` as reject and `max_output_tokens` as truncate, with
  explicit `truncated=true` and stable error classes.
- **REJECT:** opt-in robots compliance; Curiosity records policy evidence and
  applies the reviewed default before every fetch.
- **REJECT:** caller-supplied cookies/scripts/proxies in the researcher surface.
- **REJECT:** anti-bot bypass and residential proxy escalation.
- **ADOPT:** all search/extraction output is untrusted data, never instructions.

### 9.4 Ownership and licensing

- **REJECT:** hosted Search, its external SERP, or its demand-shaped cache index
  as the owned-search foundation.
- **DEFER:** hosted Reader as a benchmark/evaluation oracle, not source of truth.
- **DEFER:** browser rendering until static fetch quality gates justify its
  security and resource cost.
- **DEFER/REJECT for commercial core:** ReaderLM-v2 until a compatible license
  is obtained; CC-BY-NC is not an open-source commercial grant.
- **ADAPTED only:** study Apache-licensed behavior and public contracts; do not
  copy source into a clean-room owned core without separate dependency/design
  review and attribution. Preserve third-party asset obligations separately.

## 10. Facts, inferences, recommendations, and unknowns ledger

| ID | Statement | Type | Confidence | Verdict/check |
| --- | --- | --- | --- | --- |
| L1 | Search discovers via primarily external SERP and hydrates pages with Reader. | FACT | High | **REJECTED** as owned index foundation |
| L2 | A hosted local cache index exists conceptually; its implementation is omitted from OSS. | FACT | High | Treat as opaque, demand-shaped cache index |
| L3 | Search may race upstream/cached SERP against local-index results. | FACT | High | **REJECTED** unless lineage is returned |
| L4 | “Top five” conflicts with current 0–20/default-10 source contract. | FACT | High | Pin/validate adapter contract |
| L5 | Search can silently use stale SERP cache and 24-hour page cache. | FACT in pinned source | High | **REJECTED** silent; **ADAPTED** explicit stale mode |
| L6 | Reader supports curl/browser/CF engines and multiple extraction profiles. | FACT | High | **ADAPTED** tiered fetch architecture |
| L7 | Token budget rejects; max tokens truncates; Search ignores token budget. | FACT | High | **ADOPT** distinction; fix Search gap |
| L8 | Published time merges heterogeneous signals without origin. | FACT | High | **REJECTED** temporal field design |
| L9 | Robots enforcement is opt-in. | FACT | High | **REJECTED** policy default |
| L10 | Public SSRF source is environment-dependent and incomplete evidence for hosted controls. | INFERENCE | Medium | Require independent security review |
| L11 | DNT does not establish a complete no-log/no-retention guarantee. | INFERENCE | High | Public-only data; obtain DPA specifics |
| L12 | Reader output is not reproducible evidence without capture/version metadata. | INFERENCE | High | **ADOPT** capture IDs/hashes/trace |
| L13 | Hosted Reader could be useful as a bounded extraction comparison oracle. | RECOMMENDATION | Medium | **DEFERRED** approved benchmark |

### Material unknowns and required checks before any adapter

1. Obtain current commercial terms, top-up price, DPA/subprocessor list, API
   request/content/log retention, deletion, backup, and EU-routing guarantees.
2. Get a written description or audited evidence for hosted SSRF/redirect/
   subresource policy and browser isolation; do not infer it from OSS.
3. Run an approved, credential-free fixture benchmark for static HTML, SPA,
   redirects, PDF, malformed content, cache controls, timestamps, truncation,
   partial Search hydration, and prompt injection.
4. Capture actual response headers/envelopes and pin OpenAPI version; reconcile
   five/default-ten/target-six behavior and cache defaults.
5. Measure content fidelity, citation anchoring, p50/p95/p99 latency, errors,
   token charges, and regional variance. Vendor average latency is insufficient.
6. Confirm robots behavior and target-site terms. Never use the proxy features
   to defeat access controls.

## 11. Bounded curiosity pass

The caller authorized research within the frame above. After initial synthesis,
remaining gaps were scored 0–3 on relevance (R), decision value (V), novelty
(N), and cost (C; lower is better). Priority = R + V + N - C.

| Thread | R | V | N | C | Score | Outcome |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Reconcile “owned Search” with index/source evidence | 3 | 3 | 3 | 1 | 8 | Pursued: architecture + storage interface + Search code; no owned broad-web index evidence |
| Reconcile caching/result-count contradictions | 3 | 3 | 2 | 1 | 7 | Pursued: live OpenAPI vs product page vs pinned source |
| Inspect SSRF/robots/privacy boundaries | 3 | 3 | 2 | 2 | 6 | Pursued to public-source boundary; hosted claims remain unknown |
| Benchmark live result quality | 2 | 2 | 2 | 3 | 3 | **CURIOSITY_NO_GO:** no calls/credentials; fixtures and repeated trials required |
| Infer hidden Mongo index/ranker | 2 | 2 | 3 | 3 | 4 | **CURIOSITY_NO_GO:** hosted implementation omitted; speculation would not be evidence |
| Test blocked/paywalled/private targets | 1 | 1 | 1 | 3 | 0 | **CURIOSITY_NO_GO:** outside safety/access boundary |
| Quote exact paid package economics | 2 | 2 | 1 | 3 | 2 | **CURIOSITY_NO_GO:** checkout/key-gated and workload-dependent |
| Audit every dependency/license transitively | 1 | 2 | 1 | 3 | 1 | **CURIOSITY_NO_GO:** separate legal/SBOM review; not needed for product verdict |

**Stop reason:** coverage and saturation. The best in-frame contradictions were
resolved as far as public primary evidence permits. Remaining high-impact gaps
require caller-approved evaluation, vendor disclosure, legal review, or hosted
security evidence—not more documentary searching.

## 12. Primary sources

All web sources below were accessed 2026-08-17.

- **[S1] Jina AI, Reader repository README, pinned commit
  `1574bfd...`.** Usage, Search→Reader fan-out, controls, caching statements,
  self-host modes, proxy guidance, Apache license boundary.
  <https://github.com/jina-ai/reader/blob/1574bfd380d249c86c82db4dace0d9c8fe17e2b1/README.md>
- **[S2] Jina AI, Reader product page and FAQ.** Live product contract, feature
  descriptions, rate limits, token counting, pricing mechanics, cache/login/
  anti-bot statements, shared key/balance, no-training statement.
  <https://jina.ai/reader/>
- **[S3] Jina AI, public Reader architecture, pinned commit.** External SERP,
  engines/extractors, SaaS/OSS storage boundary, GCP/Mongo/GCS deployment,
  abuse controls, regions, model providers.
  <https://github.com/jina-ai/reader/blob/1574bfd380d249c86c82db4dace0d9c8fe17e2b1/architecture.md>
- **[S4] Jina AI, live Reader and Search OpenAPI documents, version
  `0.5.0+4e81fa5`.** Paths, request parameters, result envelope/DTO, error
  classes, current validation. <https://r.jina.ai/openapi.json> and
  <https://s.jina.ai/openapi.json>
- **[S5] Jina AI, Apache-licensed public source, pinned commit.** In particular
  `src/api/searcher.ts`, `src/api/crawler.ts`,
  `src/dto/crawler-options.ts`, `src/db/models.ts`,
  `src/db/noop-storage.ts`, `src/services/snapshot-formatter.ts`,
  `src/services/misc.ts`, `src/services/puppeteer.ts`, and
  `src/services/robots-text.ts`.
  <https://github.com/jina-ai/reader/tree/1574bfd380d249c86c82db4dace0d9c8fe17e2b1/src>
- **[S6] Jina AI Reader Apache-2.0 license, pinned commit.**
  <https://github.com/jina-ai/reader/blob/1574bfd380d249c86c82db4dace0d9c8fe17e2b1/LICENSE>
- **[S7] Jina AI, “Jina Reader for Search Grounding to Improve Factuality of
  LLMs,” 2024-05-14.** Launch-era contract and historical limits.
  <https://jina.ai/news/jina-reader-for-search-grounding-to-improve-factuality-of-llms/>
- **[S8] Jina AI legal information, last modified 2026-05-04.** Terms,
  reverse-engineering restriction, output/third-party rights, accuracy
  disclaimer, storage/training statements, Elastic DPA/privacy notice.
  <https://jina.ai/legal/>
- **[S9] Jina AI official status page.** Vendor-reported uptime and incident
  history. <https://status.jina.ai/>

## Final decision

**Search — REJECTED as foundation; ADAPTED as a contract lesson.** It is a
content-hydrating SERP orchestrator with a cache-derived local index, not
evidence of an independently owned web index. Its fused response and hidden
freshness/provider race work against Curiosity's evidence chain.

**Reader — DEFERRED as a bounded comparison adapter; concepts ADOPTED/ADAPTED.**
Its fetch/extraction controls are instructive, but hosted use expands privacy,
SSRF, reproducibility, policy, and vendor-dependency risk. Curiosity should own
static fetch/capture/extraction first and add isolated rendering only after
quality gates.

**Clean-room transfer — ADOPT concepts, REJECT code/model/data transfer by
default.** The public service code is Apache-2.0, but hosted storage/index
behavior is absent, ReaderLM-v2 has a non-commercial license boundary, and
third-party page rights remain with their owners. Any dependency adoption needs
separate review, attribution, and a provider-neutral ADR.
