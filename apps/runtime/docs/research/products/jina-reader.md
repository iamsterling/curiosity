# Jina Reader: standalone URL-to-content clean-room reconstruction

**Research / primary-source access date:** 2026-08-17  
**Subject:** Jina AI Reader at `r.jina.ai`, treated only as a known-URL fetch,
render, and extraction product. Jina Search (`s.jina.ai`) is excluded.  
**Status:** research and recommendations only; not an implementation,
benchmark, procurement approval, security test, or legal opinion.  
**Inspected public source:** Apache-2.0 repository commit
`1574bfd380d249c86c82db4dace0d9c8fe17e2b1` (commit timestamp
2026-05-22T10:55:53+08:00).  
**Live API description:** OpenAPI `0.5.0+4e81fa5`.

## Executive verdict

**ADAPT the product boundary and selected contract ideas; do not adopt the
hosted service as Curiosity's evidence system of record (high confidence).**
Reader is a sophisticated URL-to-content transformer with a static
`curl-impersonate` lane, a headless-Chrome lane, document parsers, main-content
extraction, several formatting profiles, cache-tolerance controls, and a useful
distinction between rejecting over-budget output and truncating output [S1]–[S4].

The result is nevertheless a lossy, mutable view, not a reproducible capture.
The public response does not guarantee the redirect chain, fetch time, cache
creation/age, response headers, capture/content hash, renderer/extractor/model
version, publication-time origin, robots decision, or passage-to-source anchors.
The pinned source can silently fall back to stale cache after a live failure,
while the returned DTO does not expose that fallback [S3][S4].

**DEFER a tightly bounded hosted adapter or evaluation-oracle role (medium
confidence).** Jina receives every submitted URL and may receive cookies,
scripts, proxy credentials, referers, uploaded documents, and extracted
content. Public documentation does not fully specify Reader-specific logs,
backups, deletion, tenant cache isolation, or all hosted SSRF/browser-isolation
controls. The service's published source demonstrates useful safeguards but is
not proof of the hosted perimeter [S1][S3][S5].

**REJECT as defaults:** opt-in robots enforcement, silent stale fallback,
caller-supplied cookies/scripts/proxies in an agent-facing surface, anti-bot
proxy escalation, ambiguous `publishedTime`, and treating Markdown or returned
URLs as trusted. Curiosity should own URL policy, immutable capture identity,
temporal provenance, hostile-content isolation, and every byte/time/token bound.

## 1. Decision frame, bounded questions, and method

### 1.1 Decision and sub-questions

The decision is which observable Reader behaviors are suitable clean-room
lessons for Curiosity's known-URL retrieval plane, without depending on
undocumented hosted behavior or transferring implementation.

Bounded questions:

1. What does Reader accept and return for a known URL or submitted document?
2. How does it select static fetch, browser rendering, document parsing,
   extraction, and output formatting?
3. What are the cache, freshness, token, content, and resource semantics?
4. Which timestamps and provenance fields survive into the response?
5. What public evidence exists for robots, SSRF/private-network defense,
   hostile-content handling, privacy, and lawful use?
6. Which errors, rate limits, prices, and reliability claims are contracted?
7. Which architecture conclusions are facts, bounded inferences, or unknown?
8. What should Curiosity adopt, adapt, reject, or defer?

**Coverage bound:** primary evidence or an explicit unknown for every category
above. **Stop conditions:** coverage and saturation, or a question requiring
credentials, a paid/live Reader content call, private-target probing,
access-control bypass, proprietary hosted code, or legal judgment.

### 1.2 Method and clean-room boundary

- Read the live Reader product/FAQ, live OpenAPI, official legal page, status
  page, public architecture, README, license, and relevant public source at the
  pinned commit [S1]–[S7].
- Used the repository only as intentionally public Apache-2.0 behavioral
  evidence. The README states this is an OSS branch of the service code with the
  MongoDB-backed SaaS storage layer removed [S2][S6]. No source was copied.
- Made no URL-to-content request, uploaded no file, supplied no API key or
  credential, incurred no charge, probed no private/blocked target, and
  attempted no bypass.
- Jina's terms prohibit reverse engineering the Services and using Output to
  build a competing service. This review therefore stops at published contracts,
  openly licensed source, and independently stated design lessons [S5].
- The Apache-2.0 grant applies to the repository, not to the hosted service,
  ReaderLM-v2, vendor services, or third-party page content. Jina's FAQ calls
  ReaderLM-v2 CC-BY-NC 4.0 and not open source for commercial use [S1][S6].

### 1.3 Evidence labels

- **FACT** — directly stated by a cited primary source or observed in pinned
  public source.
- **INFERENCE** — the narrowest architecture/security interpretation supported
  by facts; not independently measured against hosted traffic.
- **RECOMMENDATION** — a Curiosity choice.
- **UNKNOWN / NEGATIVE RESULT** — public evidence is absent, conflicting, or
  hosted-only.
- Confidence is **high**, **medium**, or **low**.

Vendor statements establish advertised behavior, not independent quality,
security, completeness, compliance, scale, or an SLA.

## 2. Product boundary and public contract

### 2.1 Endpoint and input forms

**FACT (high):** the live OpenAPI exposes `GET /`, `POST /`, and `GET/POST
/{url}`. A URL may be embedded after `https://r.jina.ai/` or supplied in POST
input. POST accepts JSON, multipart, and form bodies. It can also accept raw HTML,
base64/file uploads, PDFs, and a nominal URL/page selector for document parsing
[S1][S4]. This dossier analyzes those capabilities only as parts of Reader's
one-resource transformation path; it does not cover discovery or Search.

**FACT (high):** the current input surface includes:

- acquisition: URL, engine (`auto`, `browser`, `curl`, or experimental
  `cf-browser-rendering`), timeout (positive, maximum 180 seconds), readiness
  timing, locale, viewport, referer, user agent, cookies, storage state, proxy,
  custom headers, preload URL, service-worker control, iframe/shadow-DOM
  inclusion, and caller-supplied page/frame JavaScript;
- narrowing: target, wait-for, and remove CSS selectors, overlay removal, and
  detachment of invisible elements;
- representations: main `content`, fuller-page `markdown`, HTML, text,
  screenshot, pageshot, YAML frontmatter combinations, chunks, ReaderLM-v2,
  and VLM;
- formatting: link/image/media retention, generated image alt text, summaries,
  base-URL mode, Markdown style, structured/heading chunking, and document page;
- policy/bounds: cache tolerance/bypass, DNT, robots user agent, asserted target
  status, token budget, and maximum output tokens [S1][S2][S4].

**FACT (high):** selector values beginning with match-all forms are rejected in
the pinned source as a performance guard. Cookies, scripts, viewport,
instruction, overlay removal, and invisible-element detachment make ordinary
cache reuse inapplicable; invisible detachment also forces a private/no-cache
path [S3].

**CONTRADICTION (high confidence):** the live product builder and OpenAPI
advertise raw HTML/PDF/file input and cookie/storage-state controls, while the
FAQ says local HTML is unsupported and login-protected content cannot be
accessed [S1][S4]. The likely explanation is documentation drift or tier/hosted
restrictions, but the actual supported matrix is **unknown** without an approved
contract test. Curiosity must not rely on the broader capability merely because
it appears in schema.

### 2.2 Response shapes and success meaning

**FACT (high):** content negotiation selects:

- plain text / Markdown-like output;
- JSON envelope with `code`, extended `status`, `data`, and optional `meta`;
- server-sent events for progressive snapshots; or
- image bytes/redirects for visual representations in the pinned source [S3][S4].

The live `FormattedPageDto` can expose title, description, URL, content, chunks,
`publishedTime`, HTML/text, screenshot/pageshot URLs, page count, links, images,
warning, metadata, external relations, target HTTP status/status text, and
storage state [S4]. Most fields are optional; only `url` is required in the DTO.

**FACT (high):** a non-2xx target response need not become a non-2xx Reader API
response. The formatter can return extracted content with a warning such as
`Target URL returned error 404`; the caller must request an asserted target
status to reject a mismatch [S3][S4].

**RECOMMENDATION (high):** Curiosity must separate:

1. API transport outcome;
2. fetch/policy outcome;
3. target HTTP outcome;
4. render completeness;
5. extraction quality; and
6. truncation/derivation status.

A `200` from the adapter must never imply that the origin returned `200`, the
page was complete, the content was current, or the extraction was faithful.

### 2.3 Progressive output

**FACT (high):** Reader can stream formatted intermediate snapshots as SSE. The
pinned loop may coalesce updates while formatting is in flight, emits an SSE
`error` event after stream establishment, and ends after the latest available
snapshot [S3]. Readiness choices range from raw HTML and first visible content
through mutation/resource/media idle to network idle [S2][S4].

**INFERENCE (high):** streaming improves latency for large/dynamic pages but
weakens a naïve “one response equals one document” model. Intermediate and final
views can differ; the public stream does not assign immutable capture/version
IDs to events.

**RECOMMENDATION (high):** if Curiosity ever streams extraction, every event
needs a sequence, capture attempt ID, `intermediate|final` state, cumulative
byte/token accounting, and a terminal completeness/error record. Downstream
citations may bind only to a finalized immutable artifact.

## 3. Fetching, rendering, parsing, and extraction

### 3.1 Reconstructed acquisition flow

```text
known URL / submitted document + acquisition policy
  -> auth, tier, rate and budget setup
  -> URL normalization + initial address checks
  -> optional robots assertion (only when requested)
  -> eligible snapshot-cache lookup
  -> auto lane:
       curl-impersonate side-load / content classification
       -> optionally proxy retry
       -> optionally headless Chrome rendering
     forced lane:
       curl | browser | Cloudflare Browser Rendering
  -> HTML/text | PDF.js | LibreOffice-to-PDF/HTML | image/VLM path
  -> Readability / fuller-page rules / ReaderLM or VLM conversion
  -> selector narrowing, link/image/media treatment, chunking
  -> token trim or budget rejection
  -> plain text | JSON | SSE | visual artifact
  -> eligible cache write and usage report
```

This is a supported reconstruction from public code, not a guarantee of the
current hosted topology or exact engine order [S2][S3].

### 3.2 Static and browser lanes

**FACT (high):** `curl` uses `curl-impersonate`, does not execute JavaScript,
and includes a simulated cookie layer for basic cookie redirects. `browser`
uses headless Chrome through Puppeteer and executes page JavaScript. `auto`
combines the two based on content and requested capabilities. Cloudflare Browser
Rendering is described as rate-limited, experimental/fallback-oriented [S2][S7].

**FACT (high, pinned source):** auto mode can side-load bytes, classify content,
emit a fast static snapshot when permitted, retry thin/non-200 responses through
an allocated proxy, and continue into Chrome when browser-only capabilities or
content quality require it. Target/remove selectors, iframe/shadow-DOM capture,
screenshots, scripts, viewport, and richer readiness can require the browser
[S3].

**INFERENCE (high):** the key design is capability-driven escalation, not a
single scraper. However, the public response does not require the service to say
which acquisition lane, proxy, region, fallback, or render condition produced
the artifact. Two identical requests can therefore be epistemically different.

### 3.3 Readiness and completeness

**FACT (high):** explicit readiness modes are:

| Mode | Published meaning |
| --- | --- |
| `html` | return when unrendered HTML is available |
| `visible-content` | return when readable content appears |
| `mutation-idle` | DOM mutation quiet for at least 0.2 s |
| `resource-idle` | content-affecting resource quiet for at least 0.5 s |
| `media-idle` | resource/media quiet for at least 0.5 s |
| `network-idle` | full `networkidle0` |

Without an explicit mode, the pinned source selects a heuristic based on output,
elapsed time, timeout, and iframe/visual requirements; timeout at least 20
seconds implies network-idle [S2][S3][S4].

**INFERENCE (high):** none of these conditions proves semantic completeness.
Timers, infinite polling, consent walls, user interaction, viewport/locale,
personalization, lazy loading, and anti-bot pages can all satisfy a technical
idle condition while omitting the intended evidence.

### 3.4 Parsing and transformation

**FACT (high):** HTML's default `content` path uses Mozilla Readability before a
custom rule-based HTML-to-Markdown conversion inspired by Turndown. Explicit
`markdown` converts the fuller page without Readability. If Readability output
is too small or conversion is poor, the pinned formatter can revert toward the
full DOM or plain text [S2][S3][S7].

**FACT (high):** excessive DOM depth/count causes degradation to text: pinned
thresholds are depth over 256, anonymous/non-internal element count over 10,000,
or absolute count over 80,000. This is source evidence, not a hosted contractual
limit [S3][S7].

**FACT (high):** PDFs use PDF.js; Office documents are converted through
LibreOffice to PDF/HTML; image captions use a VLM. The architecture names
`gemini-2.5-flash-lite` as the then-current hosted caption model. ReaderLM-v2 is
an experimental HTML-to-Markdown/structured-data path [S1][S7].

**INFERENCE (high):** every output except a separately preserved source capture
is a versioned transformation. Readability choice, DOM timing, fallback,
viewport, locale, selector, link/image policy, parser, and model can alter the
same URL. Model-generated alt text is a derived claim, not text from the page.

**RECOMMENDATION (high):** Curiosity should make `capture`, deterministic
`extract`, and model-assisted `derive` distinct artifact classes. Model output
must be labeled and grounded to capture spans or image hashes; it must not be
silently merged into source-authored text.

## 4. Cache and freshness semantics

### 4.1 Public controls and source behavior

**FACT (high):** `X-No-Cache` is equivalent to cache tolerance zero;
`X-Cache-Tolerance: N` accepts an entry younger than N seconds. `DNT: 1` is
described in OpenAPI as preventing result caching and on the product UI as
preventing caching or logging/tracking [S1][S2][S4].

**FACT (high, pinned source):** the Reader host has a one-hour default freshness
window and seven-day cache retention. Its URL digest removes ordinary fragments
(but keeps hash-router fragments beginning `#/`) and lower-cases the entire
normalized URL before hashing. Signed visual URLs default to roughly four hours
[S3]. The README calls the cache lifetime 3,600 seconds, while the FAQ says a
repeat URL within five minutes is cached [S1][S2].

**CONTRADICTION (high confidence):** five minutes versus one hour is unresolved
for the current hosted service. Seven-day retention is source behavior, not a
published SaaS retention promise. Regional coherence and eviction are unknown.

**FACT (high, pinned source):** cache reads are suppressed for cookies, injected
scripts, viewport, instruction, overlay removal, and invisible detachment.
Locale is checked on a candidate cache hit. Cache identity itself is URL-based,
not a public digest of all acquisition/extraction policy [S3].

**SECURITY/CORRECTNESS INFERENCE (medium):** source-level cache exclusions show
awareness of personalization, but public evidence does not prove full variation
by custom headers, referer, user agent, proxy geography, engine, storage state,
robots user agent, or hosted tenant. Lower-casing an entire URL can also merge
paths/query values that case-sensitive origins treat as distinct. Hosted code
may differ; no cross-tenant flaw is alleged or tested.

### 4.2 Silent stale fallback

**FACT (high, pinned source):** when a live browser scrape fails and any older
cache entry exists, Reader can yield that stale snapshot unless the error is a
`SecurityCompromiseError`. The log records fallback, but the public formatted DTO
does not carry `isFromCache`, cache creation time, age, or stale-fallback reason
[S3][S4].

**INFERENCE (high):** `X-No-Cache` asks for a live attempt, but source behavior
and hosted guarantees must be distinguished. A default or tolerance-bearing
request can return old content after a fresh attempt fails, without allowing a
consumer to prove which version it received.

**RECOMMENDATION (high):** Curiosity should support only explicit states:

```text
live_validated
fresh_cache {captured_at, age, tolerance}
stale_fallback {captured_at, age, live_failure}
provider_cache_unknown
```

Stale fallback must require caller policy and remain visible in citations. A
freshness request must never be rewritten into an observation timestamp.

### 4.3 DNT is not a complete retention contract

**FACT (high):** in pinned source, DNT marks the crawl private, suppresses page
snapshot caching/indexing, and suppresses generated-alt cache writes [S3]. The
legal page permits retention of operational, diagnostic, and usage metadata in
aggregated/anonymized form and says Input/Output is stored as required to provide
the service [S5].

**UNKNOWN:** whether DNT suppresses access/security/billing logs, URL fields in
all telemetry, transient buffers, vendor-model calls, backups, or every hosted
subprocessor; and what deletion period applies. “Do not cache or track” is not a
complete zero-retention specification.

## 5. Token, content, and work bounds

### 5.1 Output tokens and billing semantics

**FACT (high):** `X-Token-Budget` rejects a Reader result when intended charge
exceeds the supplied budget. `X-Max-Tokens` (minimum 500) truncates the selected
output instead. Plain responses expose `X-Usage-Tokens`; JSON metadata can carry
usage [S2][S3][S4].

**FACT (high, pinned source):** charge estimation counts selected text/HTML and
adds image-like charges; amount is capped at two million tokens. ReaderLM-v2 has
a 3x scalar and a 4,000-token minimum; allocated proxy use has a 5x scalar;
screenshots and generated-alt work have image/minimum charges. These values are
source observations and may not all be hosted commercial promises [S1][S3].

**INFERENCE (high):** token budget is evaluated after acquisition and
transformation, so it bounds billed/returned content, not necessarily network,
browser, parser, or model work already consumed. Output truncation also lacks a
mandatory public `truncated=true` or original-length field.

### 5.2 Input and renderer limits

**FACT (high, pinned source):** notable internal ceilings include:

- URL fetch timeout up to 180 seconds;
- six curl redirect hops;
- a configured 1 GiB curl acquisition ceiling (libcurl itself set to 4 GiB);
- 32 MiB checks when materializing HTML/text and some local files;
- browser abuse stops around 3,300 total requests, 1,000 document requests, or
  200 registrable-domain values per page;
- DOM fallback thresholds described in section 3.4 [S3].

These are not all in the live public contract, differ by stage/media type, and
do not establish decompressed-size, archive expansion, PDF page, DOM memory,
image pixel, or aggregate model-input limits.

**NEGATIVE RESULT (high):** no mandatory public response field reports fetched
bytes, decompressed bytes, redirect count, DOM nodes/depth, subresource count,
render CPU/memory, extracted pre-trim tokens, or exact truncation point [S4].

**RECOMMENDATION (high):** Curiosity needs independent, predeclared ceilings for
redirects, response/decompressed bytes, document pages, archive expansion,
image pixels, DOM nodes/depth, subresources/domains, render wall time, CPU/memory,
extracted tokens, and returned bytes. `reject_if_over_budget` and
`truncate_to_limit` should remain separate operations with explicit outcomes.

## 6. Temporal provenance and reproducibility

### 6.1 What Reader returns

**FACT (high):** the public result may retain URL, title, description, extracted
content, links/images, metadata, target status, and `publishedTime` [S4].

**FACT (high, pinned source):** `publishedTime` selects the first available of
parsed page publication metadata, `article:published_time`, or HTTP
`Last-Modified`. For PDFs it can come from PDF modification or creation metadata
[S3]. The response does not identify which signal won.

**INFERENCE (high):** `publishedTime` is not one temporal concept. A publisher
claim, file creation, file modification, and HTTP resource modification have
different semantics and reliability. It is particularly unsafe to interpret
this field as Reader fetch time.

### 6.2 Missing chain of custody

**NEGATIVE RESULT (high):** the live public contract does not require:

- input URL, every redirect, final response URL, and declared canonical URL as
  distinct values;
- fetch start/end, cache-created-at/age, or stale-fallback state;
- selected response headers such as ETag and `Last-Modified` as separate fields;
- raw capture hash, normalized-content hash, immutable capture/version ID;
- acquisition engine, region, IP/proxy class, viewport/locale, or fallback path;
- renderer, browser, parser, extractor, ReaderLM, or VLM version;
- publication-time source and confidence;
- robots/policy result and version;
- passage offsets/DOM anchors back to captured bytes; or
- a mandatory truncation/completeness marker [S4].

The optional provider URL and request/usage metadata are attribution and
operations aids, not a capture manifest.

**RECOMMENDATION (high):** Curiosity's minimum evidence envelope should include:

```text
requested_url, redirect_chain, final_url, declared_canonical_url
fetch_started_at, fetch_completed_at, cache_state, cached_at, cache_age
target_status, selected_headers, media_type, charset, bytes/decompressed_bytes
capture_id, raw_hash, normalized_hash, immutable_artifact_ref
acquisition_mode/version, locale, viewport, policy/options_digest
robots_decision, source_claimed_times[{kind,value,origin,confidence}]
extraction_id/version, passages[{capture_anchor,span_hash}]
truncated, completeness, warnings, provider_trace_id
```

Unknown provider facts must remain unknown; receipt time is not fetch time.

## 7. Robots, access controls, and anti-bot behavior

### 7.1 Robots is opt-in

**FACT (high):** Reader checks robots only when `X-Robots-Txt`/`robotsTxt` is
supplied; the value can select a bot user agent. It is not a default Reader
policy in the live schema or pinned controller [S3][S4].

**FACT (high, pinned source):** the custom robots service fetches `/robots.txt`
with a five-second timeout, caches by lower-cased origin, and treats fetch/non-OK
failure as public access. Its parser walks user-agent, allow, and disallow lines
with simple prefix/wildcard handling [S3].

**INFERENCE (high):** this is not evidence of complete RFC 9309 semantics. The
reviewed parser does not establish longest-match resolution, complete multiple
group merging, percent-encoding rules, or crawl-delay handling. Cached robots
age is not exposed to the caller.

**RECOMMENDATION (high):** Curiosity should own standards-reviewed robots/site
policy before fetch, record retrieval time/status/rule/user agent, fail according
to an explicit policy, and combine it with per-origin politeness. An agent must
not be able to disable that policy.

### 7.2 Anti-bot contradiction

**FACT (high):** the current FAQ says Reader operates as a standard client, does
not actively circumvent anti-bot/access controls, respects blocks, and paid keys
do not unlock blocked sites [S1].

**FACT (high):** the public README advises forcing browser mode, using a hosted
pool that rotates residential/datacenter IPs and “handles common anti-bot
challenges,” or supplying a third-party residential/ISP proxy [S2].

**CONTRADICTION (high confidence):** these descriptions are materially
different. The exact operational line between resilience and circumvention is
not defined publicly.

**RECOMMENDATION (high):** Curiosity should reject residential-proxy and
challenge-bypass escalation. A successful response is not evidence of
permission. Any proxy route requires explicit source-policy, contractual,
privacy, and legal review.

## 8. SSRF and private-network security

### 8.1 Public-source safeguards

**FACT (high):** Reader is an arbitrary server-side URL fetcher with redirects,
browser subresources, optional proxies, scripts fetched by URL, cookies,
iframes, shadow DOM, PDF/Office parsing, and model calls. This is intrinsically a
high-risk egress and parser boundary [S2]–[S4].

**FACT (high, pinned source):** initial normalization accepts HTTP, HTTPS, and
internal blob URLs. Direct non-public IP literals are rejected. In a
production-on-GCP configuration, `localhost` and hostnames resolving to
non-public addresses are also rejected. Initial DNS addresses are returned as
hints, but public source does not show connection pinning to those hints [S3].

**FACT (high, pinned source):** browser interception permits HTTP(S), Chrome
internal schemes, and `about:blank`; blocks the Reader's own circular hosts; and,
under the same hosted-environment flag, blocks `localhost`/`127.*`. It also caps
request/domain counts. Each page gets a dedicated Chrome browser context [S3].

**FACT (high, pinned source):** production Chrome keeps its default sandbox;
`--no-sandbox` is added only when `NODE_ENV` is absent or test. Page CSP is
bypassed to support instrumentation. Hosted architecture says suspicious
addresses are filtered and services communicate over private VPC links [S3][S7].

### 8.2 What this does not prove

**SECURITY INFERENCE (medium):** the initial URL check is stronger than the
visible browser subrequest check. The latter does not visibly resolve and reject
all private/link-local/metadata IPv4/IPv6 destinations. Public code also does not
prove DNS pinning/revalidation for every redirect, subresource, injected-script
URL, custom proxy, and alternate engine. Script URLs are fetched during option
configuration with ordinary `fetch` in the pinned code, outside the shown URL
normalizer [S3].

This is **not a vulnerability claim about the hosted service**. The SaaS storage,
network perimeter, and some controls are omitted; no exploit or private-target
test was performed. The evidence supports only “hosted SSRF completeness is
unknown.”

**RECOMMENDATION (high):** Curiosity must independently:

1. allow only reviewed HTTP(S) ports and reject URL credentials;
2. normalize, resolve, classify, and pin every connection;
3. reject loopback, private, link-local, multicast, reserved, and cloud-metadata
   ranges for IPv4 and IPv6;
4. repeat policy for every redirect, DNS result, browser subresource, frame,
   script, stylesheet, media URL, proxy, and parser callback;
5. isolate renderers/parsers in disposable, no-secret sandboxes behind an egress
   gateway; and
6. give page content no ambient credentials, internal DNS, filesystem, or tool
   authority.

## 9. Hostile content and downstream trust

**FACT (high):** browser mode executes target JavaScript; Reader can include
iframe/shadow content, links, media/image URLs, page metadata, generated image
captions, raw/full HTML, and caller scripts. The terms explicitly disclaim
complete, accurate, or true output [S1][S4][S5].

**NEGATIVE RESULT (high):** no endpoint contract promises prompt-injection
neutralization, malware scanning, secret/PII detection, safe URL classification,
Unicode-confusable handling, factual validation, model-caption grounding, or
safe rendering of returned Markdown/HTML [S1][S4]. A `451 HarmfulContentError`
exists in the OpenAPI taxonomy, but its trigger/coverage does not establish
these safeguards.

**INFERENCE (high):** Readability and Markdown conversion remove some active
markup but are not a security boundary. Instructions in extracted prose remain
attacker-controlled. Returned links/images can target internal or malicious
destinations if later fetched in a more privileged context. Raw HTML and the
`retainMedia=html` view remain active-content hazards to clients.

**RECOMMENDATION (high):** Curiosity should:

- label all text, metadata, captions, URLs, and warnings `external_untrusted`;
- never allow retrieved text to modify system policy, request credentials,
  authorize tools, or trigger a follow-up action;
- keep evidence data outside instruction/control channels;
- sanitize display separately from preservation and never render provider HTML
  as trusted application HTML;
- validate every returned/follow-up URL through the same egress policy; and
- preserve source-authored versus model-derived fields as separate trust classes.

## 10. Privacy, custody, and legal boundaries

### 10.1 Data disclosed to Jina and vendors

**FACT (high):** depending on options, Jina can receive URL paths/query strings,
referer, user agent, cookies/storage state, custom headers, scripts or script
URLs, proxy URL and embedded credentials, raw HTML, uploaded documents, locale,
viewport, and output content. Image captioning and ReaderLM paths may involve
additional model services [S1][S3][S4][S7].

**FACT (high):** Jina says API inputs/outputs are not used to train its models.
Its legal page, last modified 2026-05-04 after Elastic's acquisition, points to
Elastic's DPA/privacy statement. It allows storage required to provide the
service and retention of aggregated/anonymized operational, diagnostic, and
usage metadata [S1][S5].

**FACT (high):** the architecture describes US and EU clusters. The product
builder advertises experimental EU residency, but the reviewed public OpenAPI
does not make the exact routing field/guarantee clear [S1][S4][S7].

**UNKNOWN:** Reader-specific URL/content/log retention; DNT's exact scope;
subprocessor/model routing by option; backup/deletion schedule; tenant cache
isolation; encryption/keying details; whether experimental EU routing covers all
models/proxies/support metadata; and current contractual SLA/security exhibits.

**RECOMMENDATION (high):** never send ambient cookies, authorization headers,
private/intranet URLs, presigned URLs, query-string secrets, regulated data,
customer documents, or proxy credentials to hosted Reader by default. Any pilot
should be public-URL-only, DNT/no-cache, secret-redacted, region-policy-bound,
and gated by current DPA, subprocessors, retention/deletion, incident, and
cross-border-transfer review.

### 10.2 Publisher rights and service terms

**FACT (high):** Jina says third-party rights in extracted/restructured material
remain unaffected, disclaims non-infringement, and makes the customer responsible
for lawful source access and Output use. Public availability is not a copyright
license [S5].

**FACT (high):** Jina's terms prohibit reverse engineering the hosted Services,
competitive use of Output, third-party-rights violations, and automated
extraction from Jina's own site/Services [S5]. The public repository separately
offers Apache-2.0 rights to that Work [S6].

**RECOMMENDATION (high):** source eligibility, target terms, copyright/database
rights, retention, quotation, deletion/takedown, and jurisdiction-specific
questions require Curiosity policy and counsel. A successful Reader response and
an opt-in robots check do not grant rights.

## 11. Errors, rates, pricing, and reliability

### 11.1 Error contract

**FACT (high):** the live OpenAPI documents a structured error body with `code`,
extended `status`, `message`, and optional `readableMessage`, and these HTTP
classes [S4]:

| HTTP | Documented classes / meaning |
| ---: | --- |
| 400 | parameter validation or broken data stream |
| 401 | authentication failed/required |
| 402 | tier feature constraint or insufficient balance |
| 403 | operation not allowed or abuse alleviation |
| 409 | resource-policy denial or budget exceeded |
| 413 | target file too large |
| 422 | malformed submission, downstream failure, or assertion failure |
| 429 | rate limit, with optional retry-after seconds/date |
| 451 | harmful content |
| 500 | downstream/internal service error |
| 503 | worker resource drain |

**FACT (high):** extraction can instead return target errors as a successful
payload warning; SSE can report errors inside an already-successful stream. The
pinned source also suppresses repeated failing URLs for a period after a
consecutive-error threshold [S3][S4].

**INFERENCE (high):** HTTP status alone is not a stable retry policy. For example,
`422` groups malformed caller input, downstream failure, and content assertions,
which have different retryability. Provider extended status and redacted message
must be preserved, then normalized behind Curiosity-owned categories.

**RECOMMENDATION (high):** normalize to `invalid_input`, `auth`, `policy_denied`,
`target_http`, `network`, `timeout`, `unsupported_media`, `too_large`,
`budget`, `rate_limit`, `provider_capacity`, `provider_internal`, and `unknown`.
Retry only explicitly transient categories, with deadline, jitter, attempt cap,
and no silent stale substitution.

### 11.2 Published limits and metering on 2026-08-17

| Reader tier | Published rate |
| --- | ---: |
| no key | 20 RPM |
| free key | 500 RPM |
| paid key | 500 RPM |
| premium key | 5,000 RPM |

**FACT (high):** Jina says Reader usage counts output-response tokens, new keys
receive ten million free tokens, and failed requests are not charged. It
publishes 7.9 seconds average Reader latency. Generic cross-API limits also list
2/50/500 concurrent requests for free/paid/premium and a 10,000 requests per 60
seconds IP cap, but the product table is the more specific Reader RPM evidence
[S1]. These are vendor figures, not measurements or an SLA.

**UNKNOWN (medium):** exact current token top-up package prices are revealed
through an API-key purchase flow and were not accessed. No responsible cost per
page can be quoted without output-size distribution, cache behavior, render/model
features, charge scalars, failures, and checkout/order-form terms.

### 11.3 Reliability evidence

**FACT (medium):** the official status page displayed approximately 99.98% 90-day
uptime for `r.jina.ai` at access time. It also showed recent regional incidents,
including Europe partial outages on 2026-08-15 with reported error rates up to
33.66% and p99 around 63 seconds, and several 2026-08-05 Europe incidents [S8].
Status-page telemetry is vendor-reported and is not an SLA.

**RECOMMENDATION (high):** treat Reader as a fallible external dependency with
strict caller deadlines, circuit breaking, bounded retries, local output limits,
and an owned fallback. Do not turn a provider outage into an unlabeled stale
answer.

## 12. Architecture inference and hosted/OSS boundary

### 12.1 Supported architecture

```text
                   r.jina.ai edge / RPC host
                 auth | tier | rate | billing
                            |
           URL/policy/options normalization
                  /         |          \
          snapshot cache   curl      Chrome / CF render
              |             \          /
              |          acquired representation
              |       HTML | PDF | Office | image
              |             |
              |   Readability / rule / LM / VLM
              |             |
              +------ format, chunk, bound ------+
                            |
                  text | JSON | SSE | image

Hosted persistence: MongoDB Atlas metadata/rate state + GCS cache
Hosted compute: GCP Cloud Run, US and EU clusters, private service links
OSS modes: stateless or S3-compatible bucket cache; SaaS Mongo layer absent
```

**FACT (high):** the application is multi-threaded Node.js. Headless Chrome and
LibreOffice are resource-heavy; Cloud Run supplies autoscaling. SaaS uses MongoDB
Atlas for metadata/rate limiting and Google Cloud Storage for cache objects;
internal billing/model services use private VPC links [S7].

**FACT (high):** OSS can run stateless or with S3-compatible object caching but
omits the hosted MongoDB storage/index/rate layer. It therefore cannot prove
hosted cache isolation, eviction, logging, billing, regional routing, queueing,
or abuse controls [S2][S7].

**INFERENCE (high):** Reader's core is best understood as a capability-routed
snapshot pipeline plus optional persistence—not as a simple HTML-to-Markdown
function. The hosted value includes operations, proxy/model dependencies,
cache/rate state, and browser scaling that the public stateless branch alone
does not reproduce.

**UNKNOWN:** hosted queue/autoscale policy, worker/tenant isolation, browser
sandbox/container topology, cache encryption and tenant key, exact deployed
source correspondence, failover between regions, model/provider routing,
observability retention, and disaster recovery.

## 13. Clean-room lessons and Curiosity implications

### 13.1 Verdict ledger

| Reader pattern / lesson | Verdict | Curiosity treatment |
| --- | --- | --- |
| Known-URL reading separate from discovery | **ADOPTED** | Keep discovery outside this contract; a reader does not decide which source is relevant. |
| Static-first plus browser escalation | **ADAPTED** | Static capture first; sandboxed render only after a typed quality/capability reason and within a separate budget. |
| Explicit readiness conditions | **ADAPTED** | Preserve render condition and reason, but never equate idle with complete. |
| Readability plus full-page fallback | **ADAPTED** | Keep extractor profiles explicit and versioned; always retain source capture/anchors. |
| Reject token budget vs truncate max tokens | **ADOPTED / strengthened** | Keep distinct; add pre-fetch work bounds and mandatory truncation metadata. |
| Caller cache tolerance | **ADAPTED** | Immutable local captures and explicit state/age; no silent stale fallback. |
| URL-only, option-light cache identity | **REJECTED** | Key by normalized acquisition policy, final identity, and content hash; validate variant isolation. |
| `publishedTime` synthesized from unlike signals | **REJECTED** | Return typed source-claimed times with origin/confidence, separate from fetch/cache times. |
| Opt-in robots check | **REJECTED** | Policy is mandatory and auditable before fetch; no agent override. |
| Cookies/scripts/proxies in general reader surface | **REJECTED** by default | Separate privileged workflow if ever needed; never expose to autonomous retrieval. |
| Hosted anti-bot/residential proxy escalation | **REJECTED** | No bypass-oriented behavior. |
| SSE progressive snapshots | **DEFERRED / adapted** | Only with sequence, total budget, terminal state, and final citation binding. |
| Hosted Reader as source of truth | **REJECTED** | Optional comparator/adapter only; Curiosity owns chain of custody. |
| Hosted Reader evaluation | **DEFERRED** | Requires permitted fixtures, governance review, and explicit caller authority. |
| Apache source transfer into Curiosity core | **REJECTED by default** | Learn behavior clean-room; any dependency/code reuse needs separate license, attribution, architecture, and supply-chain review. |
| ReaderLM-v2 in commercial core | **DEFERRED / likely reject** | CC-BY-NC boundary and derived-output provenance require separate approval/license. |

### 13.2 Provider-neutral operation

**RECOMMENDATION (high):** Curiosity should expose one bounded conceptual read
operation while retaining separate internal stages:

```text
read(requested_url,
     url_policy,
     freshness_policy,
     acquisition_policy,
     extraction_policy,
     work_budget,
     output_budget)
  -> capture_attempt
  -> immutable_capture | typed_failure
  -> extracted_view[]
  -> evidence_manifest
```

The provider adapter may populate only fields it can prove. A Jina response
without fetch/cache/version evidence must be typed `provider_transformed`, not
silently promoted to a Curiosity-owned capture.

### 13.3 Required checks before any hosted adapter

Use only organization-owned, public-domain, or explicitly permitted fixtures.
No third-party hostile probing.

1. **Contract:** pin OpenAPI/service version; verify GET/POST, content negotiation,
   target-status behavior, SSE terminal semantics, token rejection/truncation,
   and error extended codes.
2. **Acquisition:** controlled static HTML, deterministic SPA, redirects,
   locale/viewport variants, PDF/Office, malformed content, and browser
   escalation reason.
3. **Freshness:** revise an owned page over time; measure cache tolerance,
   no-cache, DNT, stale fallback, and region behavior. One request proves none
   of these.
4. **Provenance:** capture actual headers/envelopes and establish which fields
   remain unavailable; never infer fetch time, final URL, or cache state.
5. **Safety:** Curiosity must reject private/metadata URLs before provider
   disclosure; use owned fixtures for redirect/subresource policy, prompt
   injection, oversized/decompression/DOM cases, and unsafe returned links.
6. **Quality:** main-content coverage, tables/code/links, PDF fidelity,
   passage anchorability, determinism, model-caption separation, and extractor
   drift.
7. **Operations/economics:** p50/p95/p99 latency, regional errors, retry
   amplification, response-size distribution, actual token accounting, feature
   scalars, and circuit-breaker behavior.
8. **Governance:** current order form, DPA/subprocessors, DNT/log/cache/backup
   retention, deletion SLA, EU routing coverage, security evidence, publisher
   policy, and exit strategy.

## 14. Fact / inference / recommendation ledger

| ID | Type | Claim | Confidence | Disposition / check |
| --- | --- | --- | --- | --- |
| F1 | FACT | Reader accepts known URLs and POSTed HTML/documents and emits multiple transformed representations. | High | [S1][S2][S4]; product boundary **ADOPTED**. |
| F2 | FACT | Auto combines curl and Chrome; explicit browser/curl/CF engines exist. | High | [S2][S3][S7]; tiered acquisition **ADAPTED**. |
| F3 | FACT | Default content uses Readability plus rules; explicit markdown is fuller-page conversion. | High | [S2][S3][S7]; version every extraction. |
| F4 | FACT | Token budget rejects while max tokens truncates at minimum 500. | High | [S2][S4]; distinction **ADOPTED**. |
| F5 | FACT | Pinned source defaults to one-hour freshness, seven-day retention, and may silently use stale cache on live failure. | High for source | [S3]; hosted TTL unknown; silent fallback **REJECTED**. |
| F6 | FACT | `publishedTime` merges page metadata, article metadata, HTTP modification, or PDF metadata. | High | [S3]; field design **REJECTED**. |
| F7 | FACT | Robots enforcement is opt-in and its public parser is fail-open on retrieval failure. | High | [S3][S4]; policy default **REJECTED**. |
| F8 | FACT | Public source applies initial private-address checks and narrower browser subrequest controls. | High for source | [S3]; not hosted security proof. |
| F9 | FACT | Response lacks mandatory capture/time/hash/engine/extractor/robots lineage. | High | [S4]; hosted output insufficient as evidence manifest. |
| F10 | FACT | Reader can return target non-2xx content in an API-success payload with warning. | High | [S3][S4]; split outcome layers. |
| F11 | FACT | URLs/cookies/scripts/proxies/documents cross into Jina; no-training is stated, but retention specifics remain incomplete. | High | [S1][S5]; public-only pilot at most. |
| F12 | FACT | Public rates are 20/500/500/5,000 RPM by anonymous/free/paid/premium; exact top-up price was key-gated. | High | [S1]; revalidate commercially. |
| I1 | INFERENCE | Reader is a capability-routed acquisition/snapshot/transformation pipeline. | High | Supported by [S3][S7]; exact hosted scheduling unknown. |
| I2 | INFERENCE | A Reader result alone cannot establish reproducible, time-specific citation. | High | F5, F6, F9. |
| I3 | INFERENCE | Public source does not establish comprehensive hosted SSRF defense across all engines/options. | Medium | Requires vendor evidence and authorized owned fixtures. |
| I4 | INFERENCE | DNT lowers cache exposure but is not proof of zero logs/retention. | High | Obtain contractual scope. |
| R1 | RECOMMENDATION | Own immutable capture, provenance, policy, and bounds; treat provider output as transformed/untrusted. | High | **ADOPTED** Curiosity rule. |
| R2 | RECOMMENDATION | Evaluate hosted Reader only as a bounded comparator/optional adapter. | Medium | **DEFERRED** pending gates. |
| R3 | RECOMMENDATION | Do not expose cookies/scripts/proxies/robots override to autonomous retrieval. | High | **REJECTED** authority widening. |

## 15. Unknowns and negative results retained

1. Exact currently deployed source revision and parity with the OSS branch.
2. Hosted default cache TTL, eviction, regional coherence, variant key, tenant
   isolation, stale-fallback behavior, and backup deletion.
3. Full hosted SSRF/egress controls across curl, Chrome, Cloudflare, redirects,
   subresources, script URLs, proxy routes, file conversion, and model fetches.
4. Browser/container isolation, patch cadence, resource quotas, and crash/blast
   radius under hostile pages/documents.
5. Reader-specific URL/content/access/security/billing log retention and exact
   DNT semantics.
6. Exact EU-residency selector and whether all caches, models, proxies, support
   telemetry, and subprocessors stay in-region.
7. Extractor/model version reporting, deterministic replay, span anchors, and
   publication-time source.
8. Robots RFC conformance, cache lifetime, target terms/opt-outs, and hosted
   default outside the optional header.
9. Full decompressed/DOM/PDF/image/output limits and mandatory truncation signal.
10. Exact current paid token packages and real cost distributions.
11. Comparative extraction quality, freshness, availability, and latency.

Absence from public documentation means **unknown**, not that a control is
absent. Public source behavior means “observed at the pinned commit,” not a SaaS
guarantee.

## 16. Bounded curiosity pass

After synthesis, unresolved in-frame threads were scored 1–5 for relevance (R),
decision value (V), novelty (N), and cost (C; lower is better). Priority is
`R + V + N - C`. Only documentary/public-source work inside the caller's frame
was authorized.

| Thread | R | V | N | C | Score | Outcome |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Cache freshness and stale-fallback observability | 5 | 5 | 5 | 2 | 13 | **Pursued.** Pinned source established one-hour default, seven-day retention, URL-only digest behavior, and silent stale fallback; hosted TTL remains unknown. |
| SSRF checks across initial and browser paths | 5 | 5 | 5 | 2 | 13 | **Pursued.** Found environment-conditional DNS checks and narrower subrequest handling; retained as hosted unknown, not vulnerability claim. |
| Target HTTP status versus Reader API success | 5 | 5 | 4 | 1 | 13 | **Pursued.** Confirmed warning/success behavior and explicit status assertion; added layered-outcome requirement. |
| DNT/privacy/legal scope after Elastic acquisition | 5 | 5 | 4 | 2 | 12 | **Pursued.** Product/source/legal statements triangulated; no Reader-specific complete retention schedule found. |
| Exact source and output resource ceilings | 4 | 5 | 4 | 2 | 11 | **Pursued.** Recorded curl, text materialization, browser, DOM, timeout, redirect, and token observations; contractual gaps retained. |
| Live calls to infer cache, SSRF, or extraction behavior | 5 | 4 | 3 | 5 | 7 | **CURIOSITY_NO_GO:** caller prohibited calls/probing; one-off third-party observations would not prove a guarantee. |
| Probe private, metadata, paywalled, or anti-bot targets | 5 | 5 | 3 | 5 | 8 | **CURIOSITY_NO_GO:** safety/access boundary; no authorization and no bypass purpose. |
| Reverse-engineer omitted Mongo/cache or hosted network code | 3 | 3 | 4 | 5 | 5 | **CURIOSITY_NO_GO:** proprietary/absent, terms-sensitive, and unnecessary for contract verdict. |
| Quote exact paid checkout economics | 3 | 3 | 2 | 5 | 3 | **CURIOSITY_NO_GO:** API-key purchase flow and workload distribution required. |
| Produce definitive copyright/privacy/robots legality opinion | 5 | 5 | 2 | 5 | 7 | **CURIOSITY_NO_GO:** counsel authority required; engineering boundary is sufficient. |
| Transitive dependency/SBOM audit | 2 | 3 | 2 | 5 | 2 | **CURIOSITY_NO_GO:** separate adoption/supply-chain review; no dependency adoption authorized. |

**Stop reason:** coverage and saturation. Every requested category has primary
evidence or an explicit unknown. Remaining material gaps require vendor
disclosure, contractual/legal review, or a separately authorized owned-fixture
evaluation. This report does not authorize autonomous follow-up.

## 17. Checks performed

- Read repository `AGENTS.md` and kept provider-neutral contracts, untrusted
  external data, license boundaries, and bounded behavior explicit.
- Used primary Jina/Elastic sources accessed 2026-08-17; search snippets and
  third-party commentary were not evidence.
- Pinned the public repository commit and recorded live OpenAPI version.
- Distinguished hosted claims, pinned-source facts, inferences, and unknowns.
- Excluded Jina Search from analysis; no search architecture or quality verdict
  is imported into this standalone Reader dossier.
- Made no Reader content request, paid/free key call, upload, credential use,
  bypass attempt, private-target probe, deployment, or production mutation.
- Wrote only `docs/research/products/jina-reader.md` in the workspace.

## 18. Primary sources

All web sources below were accessed **2026-08-17**.

- **[S1] Jina AI, Reader product page, interactive contract, pricing, and FAQ.**
  Parameters, cache/DNT claims, upload/cookie controls, rate limits, token
  metering, latency, no-training/access-control statements, ReaderLM licensing,
  and documentation contradictions. <https://jina.ai/reader/>
- **[S2] Jina AI, Reader repository README at commit `1574bfd...`.** Reader
  boundary, headers, engines, cache statement, streaming/readiness, extraction
  profiles, self-host modes, proxy guidance, SaaS/OSS storage boundary, and
  Apache license claim.
  <https://github.com/jina-ai/reader/blob/1574bfd380d249c86c82db4dace0d9c8fe17e2b1/README.md>
- **[S3] Jina AI, public Apache-licensed source at commit `1574bfd...`.** In
  particular `src/api/crawler.ts`, `src/dto/crawler-options.ts`,
  `src/services/misc.ts`, `src/services/curl.ts`,
  `src/services/puppeteer.ts`, `src/services/binary-extractor.ts`,
  `src/services/snapshot-formatter.ts`, `src/services/robots-text.ts`,
  `src/services/errors.ts`, and storage models/interfaces.
  <https://github.com/jina-ai/reader/tree/1574bfd380d249c86c82db4dace0d9c8fe17e2b1/src>
- **[S4] Jina AI, live Reader OpenAPI `0.5.0+4e81fa5`.** Paths, body/header
  options, DTO, content negotiation, bounds, and error classes.
  <https://r.jina.ai/openapi.json>
- **[S5] Jina AI, legal information, last modified 2026-05-04.** Post-acquisition
  Elastic DPA/privacy notice; service/output disclaimers; input/output rights,
  storage, no-training, reverse-engineering/competitive-use, and customer
  lawful-use duties. <https://jina.ai/legal/>
- **[S6] Jina AI, repository Apache License 2.0 at commit `1574bfd...`.**
  <https://github.com/jina-ai/reader/blob/1574bfd380d249c86c82db4dace0d9c8fe17e2b1/LICENSE>
- **[S7] Jina AI, Reader architecture at commit `1574bfd...`.** Node/Chrome,
  curl, PDF.js, LibreOffice, extraction profiles, abuse mitigation, persistence
  stages, hosted GCP/Mongo/GCS/VPC topology, regions, and vendor-model boundary.
  <https://github.com/jina-ai/reader/blob/1574bfd380d249c86c82db4dace0d9c8fe17e2b1/architecture.md>
- **[S8] Jina AI official status page.** Vendor-reported 90-day uptime and
  regional Reader incident history. <https://status.jina.ai/>

## Final decision

**Reader contract lessons — ADOPTED/ADAPTED.** Keep known-URL reading separate
from discovery; use capability-driven static/rendered lanes; expose readiness;
and distinguish budget rejection from truncation.

**Hosted Reader — DEFERRED as a bounded comparator or optional adapter.** It
cannot by itself provide Curiosity's required capture identity, freshness proof,
temporal provenance, policy record, or hostile-content boundary. Governance,
security, quality, reliability, and cost gates remain.

**Curiosity evidence plane — OWN.** Curiosity should own URL/robots/egress
policy, immutable bytes and hashes, explicit cache state, renderer/extractor
lineage, source anchors, typed errors, strict work bounds, and untrusted-data
handling. Silent stale fallback, ambiguous timestamps, credential forwarding,
and anti-bot proxy escalation are rejected.

**Clean-room transfer — concepts only by default.** Preserve attribution to the
Apache-licensed public source, do not infer hosted guarantees from it, do not
transfer code/models/data without a separate review, and treat ReaderLM-v2 and
third-party page rights as distinct license/legal boundaries.
