# Linkup Fetch: clean-room known-URL retrieval study

**Research date / primary-source access date:** 2026-08-17  
**Product boundary:** Linkup `POST /v1/fetch` only. Search, Research, and
Extract are out of scope except where an official source establishes Fetch's
boundary; Tasks is covered only as an asynchronous transport for Fetch.  
**Decision:** which observable Linkup Fetch contract ideas should influence
Curiosity's known-URL acquisition plane, and which claims are too opaque to
carry into an owned retrieval architecture.  
**Status:** research and recommendations—not implementation, legal advice,
procurement approval, a vulnerability assessment, or a quality benchmark.

## Executive verdict

**VERDICT — ADAPT, do not adopt as an evidentiary substrate (high
confidence).** Linkup Fetch has a valuable narrow shape: one already-known
HTTP(S) URL enters; the caller independently chooses an access tier and
JavaScript execution; HTML or PDF becomes clean Markdown; optional origin-like
content and image references can accompany it; hard input-size classes, typed
failures, request-rate limits, and per-mode prices are public [S1–S7].

That is a useful product boundary, but a weak capture boundary. The current
success object contains only required `markdown` and `favicon`, plus optional
`rawContent`, `contentType`, deprecated `rawHtml`, and `{alt,url}` images. It
does **not** expose the requested or final URL, redirect chain, origin status or
headers, fetch time, cache state/age, content digest, byte length, truncation,
robots decision, renderer/extractor version, or passage offsets [S2]. The 2025
launch example did return a URL and timestamp, but those fields disappeared
from the current contract [S2][S8]. A successful response therefore cannot
prove which representation was acquired when, whether it was live rather than
cached, or whether later extraction can be reproduced.

The largest operational risk is undocumented rather than demonstrated:
Linkup accepts caller-selected URLs, yet reviewed public material does not
specify private/link-local address blocking, redirect revalidation, DNS
rebinding defenses, URL-credential handling, redirect or decompression limits,
renderer isolation, subresource policy, or server-side deadline. Linkup's
general crawling page says its crawling respects `robots.txt` and does not
circumvent CAPTCHAs or access controls, but it does not unambiguously bind those
statements to on-demand Fetch [S9]. Curiosity must keep its own URL/network,
robots, rights, privacy, hostile-content, and resource policies; a hosted fetch
response is untrusted external data, not delegated authorization.

## 1. Decision frame and bounded method

### 1.1 Bounded sub-questions

1. What exactly may a caller send, and what does success return?
2. What distinguishes origin-live retrieval from stored or cached content?
3. What do `standard`, `pro`, and `renderJs` establish about access and
   rendering—and what do they leave unknown?
4. Which provenance survives extraction, and can a result support reproducible
   evidence?
5. What public safeguards cover SSRF, redirects, robots, hostile pages,
   privacy, and target-site rights?
6. Which byte, time, concurrency, error, and spend bounds are enforceable?
7. What minimal architecture is consistent with public facts without claiming
   proprietary internals?
8. Which lessons should Curiosity adopt, adapt, reject, or defer?

### 1.2 Clean-room boundaries

Only public, official Linkup documentation, the current Linkup OpenAPI
rendering, official security/privacy pages, and public official SDK repositories
were inspected. SDK observations are pinned to the public repository heads
available on the access date: Python `ba083ff21d5dc345447b054f0365055fe58999cc`
(package 0.20.0) and JavaScript
`c847bb324e5e42be3d91098dfb98f61714aac97f` [S15–S17]. SDK source was used only
to check the public client contract; no code was copied.

No credential, account, free or paid call, x402 payment, target fetch,
traffic interception, package installation, access-control bypass, security
probe, proprietary implementation inspection, or benchmark was performed.
No conclusion below claims measured runtime behavior. Public marketing and
self-attested controls are attributed to Linkup.

Labels:

- **FACT** — directly stated or visible in a cited primary source.
- **INFERENCE** — least-assumptive interpretation consistent with facts, not an
  observation of hidden implementation.
- **RECOMMENDATION** — a Curiosity design or governance consequence.
- **UNKNOWN / NEGATIVE RESULT** — not established by reviewed sources.
- Confidence is **high**, **medium**, or **low**.

**Coverage and stop rule:** every requested category must have a sourced fact
or explicit negative result and a Curiosity consequence. Stop when remaining
material gaps require provider confirmation, private contractual evidence, or
authorized calls.

## 2. Product and execution boundary

### 2.1 Synchronous Fetch

**FACT (high):** `POST https://api.linkup.so/v1/fetch` accepts JSON describing
one known URL. Linkup positions Fetch separately from discovery: use it when a
URL is already known, often after Search, and use one call per URL [S1][S3][S10].
The normal path uses a bearer API key; an x402 path can execute `/v1/fetch`
without an account after a 402 payment handshake [S11][S12].

**RECOMMENDATION (high):** preserve a `RetrieveKnownUrl` operation that has no
discovery, ranking, recursive traversal, or ambient link-following authority.
The caller or a prior bounded stage must materialize the exact authorized URL
set before acquisition.

### 2.2 Asynchronous Fetch through Tasks

**FACT (high):** the Tasks endpoint can wrap up to 100 mixed calls, including
Fetch, and later returns the same Fetch output inside a per-item envelope with
`id`, `status`, `createdAt`, `updatedAt`, echoed input, output, and error. Items
complete or fail independently and have the same price as direct Fetch [S13].
Linkup says task results have a bounded lifetime but publishes no duration;
polling above one request per second is rate-limited [S14].

**QUALIFICATION:** task timestamps describe the task lifecycle, not the target
capture time. `createdAt` and `updatedAt` cannot be treated as `fetchedAt`, and
the direct success contract has neither field [S2][S13]. Tasks therefore add
transport durability, not capture provenance.

**RECOMMENDATION (high):** keep synchronous versus queued transport orthogonal
to retrieval semantics. If a hosted task is used, persist the exact input,
provider task ID, state transitions, received time, response digest, and local
deadline; never synthesize a capture timestamp from task metadata.

## 3. Current URL fetch request contract

| Field | Current REST contract | Decision-relevant caveat |
|---|---|---|
| `url` | required URI; product docs narrow it to HTTP/HTTPS; one URL [S1][S2] | no documented string-length cap, normalization, fragment/userinfo rule, default-port rule, duplicate behavior, or redirect policy |
| `mode` | `standard` (default) or `pro`; controls how a page is accessed [S1][S5] | “hard-to-retrieve” and higher success are not a mechanism or permission model |
| `renderJs` | Boolean-like OpenAPI field, default false; execute page JavaScript before extraction [S1][S2] | no browser, wait, interaction, subresource, sandbox, or execution budget contract |
| `includeRawContent` | default false; add raw page content and `contentType` [S2] | “raw” is not specified as exact origin bytes; PDF representation is undocumented |
| `includeRawHtml` | deprecated; use `includeRawContent`; described as non-LinkedIn HTML only [S2] | current overview/best-practices/agent pages still emphasize this older field [S1][S3][S4] |
| `extractImages` | default false; add `{alt,url}` references; documentation says it adds latency [S1–S4] | no image bytes, dimensions, MIME, digest, ordering, count, or URL-selection bound |

### 3.1 Schema precision and caller-side validation

**FACT/CONTRACT WEAKNESS (high):** current OpenAPI requires only `url`.
`mode` is a strict string enum, but the four Boolean controls are each modeled
as `boolean OR string`, without a string enum [S2]. Request
`additionalProperties:false` is not declared. The OpenAPI's URI format by
itself is broader than the overview's HTTP/HTTPS rule [S1][S2].

**RECOMMENDATION (high):** a Curiosity adapter should accept strict Booleans,
reject unknown fields, parse and canonicalize only explicitly allowed schemes,
and apply its own URL-length, host, port, credential, and query-secret policy
before any provider call. Do not rely on OpenAPI `format: uri` as a network
security boundary.

### 3.2 SDK and documentation drift

**FACT/CONTRADICTION (high):** `pro` was released in August 2026, after both
official SDK heads inspected here (August 5). The current REST OpenAPI and docs
accept `mode`, but neither pinned JavaScript `FetchParams` nor the pinned Python
`fetch` signature/type exposes it [S2][S5][S15–S17]. The JavaScript client sends
Fetch parameters through without local validation and configures no explicit
Axios timeout; Python exposes a client-side `timeout`, with `None` documented as
no timeout, but that is not a server deadline [S15][S16].

**FACT/CONTRADICTION (high):** the September 2025 launch page described an
older request (`outputFormat`, `renderJS`) and response (`url`, `content`,
`outputFormat`, `timestamp`). None of those are current response fields; the
current casing is `renderJs`, Markdown is always present, and raw output is
optional [S2][S8]. Current overview, best-practices, agent, and migration pages
still teach deprecated `includeRawHtml`, while OpenAPI says to use
`includeRawContent` [S1–S4][S10].

**INFERENCE (high):** the REST surface is evolving faster than generated/manual
clients and secondary documentation. Changelog recency does not guarantee SDK
parity.

**RECOMMENDATION (high):** pin an adapter against a dated OpenAPI snapshot,
send every semantically important value explicitly, and gate upgrades on
separately authorized contract tests. Treat SDK convenience types as transport
helpers, not the authoritative service contract.

## 4. Retrieval modes, live/stored behavior, and freshness

### 4.1 What `standard` and `pro` prove

**FACT (high):** `standard` is the regular, lower-cost default. Linkup says
`pro` has “significantly higher success rates” for hard-to-retrieve pages.
Linkup explicitly separates `mode` (“how the page is accessed”) from
`renderJs` (whether JavaScript is executed) [S3][S5]. Prices reinforce four
independent combinations (section 9).

**INFERENCE (medium):** the least-assumptive design has at least two access
strategies feeding a shared or equivalent extraction contract. `pro` may use
different networking, retry, egress, or acquisition machinery, but public
sources do not identify any of those. It is not justified to infer proxy type,
geographic routing, anti-bot evasion, browser use, CAPTCHA handling, or target
identity.

**RECOMMENDATION (high):** map `standard|pro` only as provider-specific access
hints. Curiosity's provider-neutral contract should instead express allowed
operations and enforceable budgets. Never reinterpret “hard-to-retrieve” as
authorization to bypass a target's controls.

### 4.2 “Real-time” is not auditable freshness

**FACT (high, vendor description):** Linkup repeatedly calls Fetch a
“real-time page content extractor” and says it retrieves a specified public URL
[S1][S4][S10]. It contrasts this known-URL operation with Search discovery
[S3][S10].

**UNKNOWN / NEGATIVE RESULT (high confidence in absence):** no reviewed Fetch
request exposes `maxAge`, cache-only, force-live, revalidate, stale-allowed, or
conditional-request controls. No success response exposes cache hit/miss,
capture time, origin `Age`/`Date`/`ETag`/`Last-Modified`, validator outcome,
stale fallback, or index relationship [S1–S5]. Nothing says whether identical
requests are deduplicated, cached, retried from storage, or update Linkup's
search index.

**INFERENCE (high):** “real-time” establishes intended request-time service
behavior, not proof that every successful call contacted the origin or that the
returned representation was current at response time. An intermediary cache,
origin CDN, renderer cache, or extracted-content cache would be compatible with
the observable contract.

**RECOMMENDATION (high):** freshness must be represented as evidence, not a
marketing label. Curiosity should distinguish:

```text
requested_at                 local attempt time
origin_contacted_at?         only when evidenced
captured_at                  acquisition time of immutable bytes
validated_at?                conditional-validation time
derived_at                   parse/render/extract time
source_published_at?         page metadata, separately qualified
cache_state / cache_age?     known, provider-asserted, or unknown
```

For Linkup output, `captured_at` and cache state remain provider-unknown; local
`received_at` must not be relabeled.

### 4.3 Stored behavior through Tasks

**FACT (high):** direct non-ZDR response retention is not specified. Tasks, by
design, retain input/output for later retrieval for an unspecified bounded
period [S13][S14]. Linkup says ZDR is optional, not default, and describes
search queries/results as memory-only under ZDR [S18]. Public privacy text does
not clearly state whether “queries/results” includes direct Fetch URLs/content
or whether Tasks is compatible with ZDR.

**RECOMMENDATION (high):** assume Fetch URLs and returned page content may be
persisted and globally processed unless a signed agreement explicitly covers
Fetch and the selected transport. Do not send signed URLs, embedded credentials,
private endpoints, secrets in query strings, or sensitive investigation URLs.

## 5. Rendering and extraction semantics

### 5.1 Static and JavaScript lanes

**FACT (high):** `renderJs:false` is the cheaper default. Linkup recommends
`true` for unknown sites and identifies SPAs, dashboards, and modern marketing
sites as common rendered cases. It says indicators of a missing render include
short/empty Markdown, “Loading…”, and browser-visible sections absent from the
result [S1][S3][S4]. JavaScript rendering is described for HTML pages; HTML and
PDF are the only supported document classes [S1].

**QUALIFICATION (high):** “ensures full content” appears in operational
guidance, but there is no completeness field, DOM/response comparison, or
contracted wait condition. It is guidance, not a verifiable completeness
guarantee [S3][S4].

**UNKNOWN:** browser/runtime and version; viewport, locale, timezone, geolocation,
user agent, cookies, consent state, and session isolation; `DOMContentLoaded`
versus network-idle/custom waits; navigation and redirect caps; iframe,
subresource, WebSocket, service-worker, popup, download, and external-protocol
policy; script CPU/memory/wall time; renderer egress policy; whether scripts can
reach private addresses; whether `renderJs:true` on PDF is rejected or ignored;
and whether `pro` changes renderer behavior.

**RECOMMENDATION (high):** model rendering as a separately authorized,
more-expensive, higher-risk capability. Require renderer profile/version,
wait rule, network/resource caps, isolation policy, and a returned render
outcome in an owned plane. Prefer static acquisition first when completeness
can be established; do not automatically copy Linkup's “JS true by default”
agent advice into a security-sensitive service.

### 5.2 Markdown, raw content, PDF, and images

**FACT (high):** Markdown is always returned and described as clean and
LLM-ready. Optional raw content is paired with a free-form `contentType` string.
The deprecated raw-HTML field was intended to preserve structures such as
complex tables and widgets that Markdown may erase. Image extraction returns
references with alt text and URL; a separate favicon URL is always required by
the current schema [S1–S3].

**INFERENCE (high):** Markdown is a semantic derivative produced after HTML or
PDF acquisition and extraction. It cannot be a byte-faithful source capture.
Image entries are derived metadata/references, not retained images. The example
favicon uses `https://favicons.linkup.so?domain=...`, so even the required
favicon can be a Linkup-served derivative rather than the target's exact icon
URL [S2].

**UNKNOWN / NEGATIVE RESULT:**

- whether `rawContent` means origin response bytes, decoded text, rendered DOM
  serialization, normalized HTML, or another representation;
- what `rawContent` contains for a PDF, how binary bytes could be represented
  in a JSON string, and which `contentType` values are stable;
- whether static raw content is pre- or post-redirect and rendered raw content
  is original HTML or post-JS DOM;
- Markdown flavor, boilerplate policy, link rewriting/base-URL resolution,
  metadata/table/code/footnote handling, character encoding, Unicode
  normalization, and extractor version;
- output-byte/token limit, truncation behavior, extraction completeness, or
  whether a large accepted input can yield a smaller silently selected output;
- image discovery scope (`img`, CSS, `srcset`, lazy-loaded, PDF figures), URL
  resolution, deduplication, ordering, count, and safety validation.

**RECOMMENDATION (high):** never name a vendor string “raw” in Curiosity's
neutral evidence model unless exact-byte semantics are proven. Store distinct
typed artifacts—wire capture, decoded body, rendered DOM, extracted document,
Markdown, and image references—with parent digests, media types, byte lengths,
tool versions, and derivation timestamps. Treat Markdown, alt text, image URLs,
and favicons as hostile input.

## 6. Output and provenance audit

### 6.1 Current success object

| Output | Required | Evidentiary value | Missing context |
|---|---:|---|---|
| `markdown:string` | yes | convenient extracted representation | source version, extractor, offsets, completeness, truncation |
| `favicon:uri` | yes | display hint | origin/derivation status, bytes, hash |
| `rawContent:string` | no | potentially closer representation | exact semantics, encoding, digest, byte fidelity |
| `contentType:string` | no | labels `rawContent` | enum, origin versus derived media type, charset |
| `rawHtml:string` | no, deprecated | legacy HTML-like representation | same ambiguities; non-LinkedIn caveat |
| `images:[{alt,url}]` | no | references found by extraction | bytes, source locator, safety, count/order |

The current schema sets `additionalProperties:false` on success and image
objects, which is a useful compatibility signal, but only `markdown` and
`favicon` are guaranteed [S2]. Official JavaScript tests even permit requested
raw content to be absent, reflecting its optional response typing rather than a
server guarantee [S15].

### 6.2 Provenance fields absent from the contract

**UNKNOWN / NEGATIVE RESULT (high):** the current response provides no:

- requested, normalized, canonical, or final URL;
- redirect hops, DNS/IP observations, TLS identity, origin status, headers, or
  validators;
- attempt, fetch, render, extract, or receive timestamp;
- cache state, age, revalidation, stale-fallback, or shared-index linkage;
- body/DOM/Markdown digest, bytes read/returned, encoding, or truncation flag;
- renderer, PDF parser, extractor, sanitizer, or Markdown serializer version;
- robots URL/bytes/status/parser/version/decision or target terms observation;
- source license, rights basis, safety scan, malware verdict, or policy version;
- mapping from Markdown spans/image references to source offsets or DOM/PDF
  locations;
- provider request ID, trace ID, metered mode in the response, or charge amount.

**RECOMMENDATION (high):** a Curiosity adapter may record what it requested and
when it received a response, but must mark provider acquisition metadata
unknown rather than fabricate it. Evidence-quality use should require a lawful
owned capture or a provider contract that returns immutable capture identity,
hashes, temporal data, and derivation lineage.

## 7. SSRF, robots, privacy, rights, and hostile content

### 7.1 URL and network safety

**FACT (high):** public docs constrain intended input to HTTP/HTTPS public URLs,
say Fetch is anonymous, and state login-wall pages return what a logged-out
visitor sees [S1][S3][S4]. Unsupported media, unreachable targets, and timeouts
are failures [S6].

**UNKNOWN / SECURITY NEGATIVE RESULT:** no reviewed public Fetch contract
documents:

- blocking of loopback, RFC1918, carrier-grade NAT, link-local, multicast,
  reserved, metadata-service, Unix/file, or internal DNS targets;
- hostname normalization, Unicode/IDNA handling, userinfo rejection, allowed
  ports, DNS pinning, DNS-rebinding checks, or post-resolution policy;
- per-hop redirect count/scheme/host/address revalidation or sensitive-header
  stripping;
- compressed versus decompressed byte accounting, compression-ratio bounds,
  slow-response limits, connection/read/total deadlines, or retry ceilings;
- renderer subresource egress controls and aggregate request/byte limits;
- callback/webhook interaction, request smuggling defenses, or whether target
  URLs are logged/redacted.

**RECOMMENDATION (high):** the provider call itself is an outbound network
capability. Curiosity must authorize the normalized URL and every redirect,
resolve and classify every address, deny non-public ranges and unsafe ports,
strip credentials, cap DNS/redirect/body/decompression/time, and prohibit
renderer access to internal networks. Hosted execution reduces direct access
to Curiosity's network but does not remove abuse, privacy, legal, or callback
risks.

### 7.2 Robots and access controls

**FACT (medium, scope-qualified vendor statement):** Linkup's content-safety
page says “crawling respects `robots.txt`,” only public content is indexed, and
CAPTCHAs, authentication, paywalls, and registration are not circumvented [S9].
Fetch-specific pages independently say Fetch does not authenticate [S1][S3].

**UNKNOWN:** the safety page is framed around indexing and retrieval, but does
not state the Fetch user agent, robots parser/precedence, cache/recheck cadence,
failure policy, redirect-host handling, or whether a user-requested on-demand
Fetch is blocked by robots. No robots observation or decision appears in the
Fetch response. `pro` does not document how its higher access success interacts
with robots, CAPTCHAs, or target terms [S2][S5][S9].

**RECOMMENDATION (high):** Curiosity must make robots and rights policy an
inspectable pre-fetch decision and preserve evidence of the policy version and
robots observation. Provider marketing is not a per-attempt authorization
record. Pro mode should remain disabled for a domain until its access semantics
and contractual use are reviewed.

### 7.3 Content safety and prompt injection

**FACT (medium, vendor statement):** Linkup says it blocks or excludes malware,
phishing, spyware, DNS tunneling, potentially unwanted software, child-abuse
content, and other restricted categories during indexing/retrieval; it also
describes DNS security and quality scoring [S9].

**UNKNOWN:** whether every Fetch response passes those index-oriented controls;
the scanner engine/version, file and script policy, safety-result visibility,
quarantine behavior, prompt-injection detection, active-link rewriting, and
rendered download handling. “Clean Markdown” means presentation cleanup, not
security sanitization [S1][S9].

**RECOMMENDATION (high):** quarantine all returned fields, disable active
content, scan retained artifacts, label source text as data, and prevent it from
granting tools or changing policy. Links and image URLs must be separately
authorized before dereference.

### 7.4 Customer privacy and target data

**FACT (high, self-attested):** Linkup says API traffic uses TLS 1.2+ and stored
data AES-256; default processing may occur across US, EU, Canada, and APAC.
Guaranteed local processing and IP allowlisting are enterprise options. ZDR is
available on request and is **not** default [S18][S19].

**QUALIFICATION / UNKNOWN:** the privacy page explicitly describes search
queries/results, not a Fetch-specific retention schedule. It does not establish
ordinary Fetch URL/content/log retention, subprocessor/model exposure, training
use, deletion time, whether fetched third-party content is “customer data,” or
ZDR compatibility with queued Tasks. The public privacy-policy body and client
terms were not readable through the reviewed public text path; no bypass was
attempted.

**RECOMMENDATION (high):** minimize disclosed URLs, do not send private or
capability-bearing URLs, and treat provider, region, transport, retention mode,
and DPA as explicit policy inputs. Certification and encryption do not answer
purpose limitation, retention, target-subject privacy, or lawful basis.

## 8. Hard bounds, latency, and errors

### 8.1 Published bounds

| Dimension | Published Fetch bound | Qualification |
|---|---:|---|
| root URLs/direct call | exactly one [S1][S2] | Tasks can queue up to 100 independent items [S13] |
| supported targets | HTML and PDF [S1] | detection rules and MIME/sniff mismatch behavior unknown |
| HTML input | 20 MB [S1][S6] | compressed/decompressed/wire/decoded counting point unknown |
| PDF input | 100 MB [S1][S6] | page count, object expansion, parser memory bound unknown |
| synchronous rate | 10 requests/s per organization [S7] | concurrency/burst window and headers unknown; x402 is per IP |
| typical latency | about 1 second [S4] | not an SLA; no percentile, per-mode split, or maximum |
| Tasks submission | 1–100 items [S13] | in-flight quota is account-visible but no public default [S15][S16] |
| Tasks polling | at most 1 request/s [S14] | Tasks result-retention duration unspecified |

**UNKNOWN / NEGATIVE RESULT:** URL length; request JSON size; redirect hops;
origin and total timeout; retries; JS CPU/memory/network; aggregate
subresources; images returned; Markdown/raw/output bytes; PDF pages; response
compression; synchronous concurrency; idempotency; cancellation; and maximum
per-call latency are not publicly bounded.

**RECOMMENDATION (high):** Curiosity must enforce lower local limits on URL and
request bytes, redirects, decoded body, output representations, image refs,
subresources, script budget, elapsed time, retries, concurrent host/global work,
and spend. Provider input caps do not bound response or renderer amplification.

### 8.2 Failure contract

**FACT (high):** API failures use
`{statusCode,error:{code,message,details:[{field,message}]}}`. Documented classes
include 400 validation, no-result, Fetch-too-large, unsupported type, and
unreachable/timeout; 401 authentication; 402 x402 payment; 403 permission; 409
conflict; 429 insufficient credit or excess requests/concurrency; and 500
internal error [S6]. Official SDKs refine Fetch failures into generic fetch,
response-too-large, target-unreachable, and unsupported-content-type errors;
newer SDK source also distinguishes budget and queued-task limits [S6][S15–S17].

**FACT/CONTRACT LIMITATION (high):** all target acquisition failures described
above are 400-class client errors even when the origin is unreachable or times
out. The current `/fetch` OpenAPI lists only 200, 400, 401, 402, and 429, while
the platform error guide additionally documents 403/409/500 [S2][S6]. A 429 can
mean credit exhaustion or rate/concurrency pressure.

**UNKNOWN:** stable machine `code` values for every Fetch case, retry-after
header, origin HTTP status mapping, redirect-loop/TLS/DNS distinctions,
partial/truncated success, renderer crash, parser error, and whether timeout
means origin-connect, origin-read, rendering, extraction, provider gateway, or
caller SDK timeout.

**RECOMMENDATION (high):** preserve HTTP status and provider code/message,
then map separately into `invalid`, `policy_denied`, `not_found`, `dns`,
`connect`, `tls`, `origin_status`, `timeout`, `too_large`, `unsupported`,
`render`, `parse`, `rate_limited`, `credit_exhausted`, `provider`, and `unknown`.
Retry only explicitly transient classes within deadline, attempt, idempotency,
and spend bounds. Never retry all 400s or all 429s uniformly.

## 9. Pricing and budget semantics

Point-in-time API-key list prices [S1][S5][S12]:

| `mode` | `renderJs:false` | `renderJs:true` |
|---|---:|---:|
| `standard` | $0.001/call | $0.005/call |
| `pro` | $0.005/call | $0.01/call |

**FACT (high):** `pro` and JS charges compose independently. Tasks has neither
discount nor surcharge. Linkup says successful API calls deduct prepaid credit
and errors do not. Account credit exhaustion returns 429 [S5][S12][S13].

**FACT/CONTRADICTION (high):** the current pricing page says x402 follows the
endpoint prices with a $0.01 minimum, while the dedicated x402 page says every
x402-enabled Search/Fetch request is a flat $0.01 [S11][S12]. Both produce
$0.01 for any Fetch call, but their general pricing rules differ. Confirm before
using x402.

**INFERENCE (medium):** higher prices indicate materially different access and
rendering work, but reveal neither resource consumption nor mechanism. Fixed
per-success pricing does not cap retries orchestrated by a caller or prove that
the origin was reached.

**RECOMMENDATION (high):** pre-authorize maximum calls and spend, record
requested and effective provider mode, and prevent automatic standard→pro or
static→JS escalation unless the policy and budget permit it. Billing success is
not retrieval correctness.

## 10. Bounded architecture inference

The least-assumptive shape consistent with public contracts is:

```text
caller-supplied HTTP(S) URL
  -> API authentication / x402 / organization rate and credit gate
  -> undisclosed URL and target policy
  -> access strategy: standard | pro
  -> acquisition
       static HTTP path
       or HTML JavaScript-rendering path
  -> supported-type and size enforcement (HTML <=20 MB; PDF <=100 MB)
  -> HTML/PDF extraction and Markdown serialization
  -> optional rawContent/contentType and image-reference derivation
  -> required Markdown + favicon response

optional Tasks transport
  -> queued independent Fetch item -> persisted task envelope -> same output
```

**INFERENCE confidence:**

- **High:** known-URL acquisition is separate from Search discovery; access
  strategy and JS execution are independent; extraction follows acquisition.
- **Medium:** standard and pro converge on equivalent downstream extraction;
  static and rendered HTML use a common Markdown serializer.
- **Low/unknown:** fetcher/proxy/browser vendors, cache topology, retry/fallback
  order, network isolation, HTML/PDF parsers, extraction algorithm, shared index
  integration, and infrastructure regions per call.

No official source reviewed identifies Chromium or another browser, proxy
types, lexical/readability algorithms, PDF libraries, sandbox technology,
cache keys, conditional requests, or capture storage. Those details must not be
reverse-engineered into claims from mode names or prices.

## 11. Clean-room implications for Curiosity

### Adopted

1. **ADOPT — known-URL retrieval as a distinct capability (high).** Discovery
   produces a bounded URL set; acquisition does not silently search or crawl.
2. **ADOPT — independent access/render intent (high).** Keep “harder access”
   separate from JavaScript execution, because they have different cost, risk,
   and failure semantics.
3. **ADOPT — typed document and size failures (high).** Preserve validation,
   unsupported media, too large, unreachable, and timeout as distinct outcomes.
4. **ADOPT — per-item async envelopes (high).** For bulk acquisition, one item
   can fail without erasing other results; preserve exact input and timestamps.
5. **ADOPT — visible capability pricing (high).** Estimate and authorize access
   and rendering cost before execution.

### Adapted

1. **ADAPT — mode into an inspectable plan (high).** Provider-neutral requests
   state allowed network path, rendering, redirects, time, bytes, retries,
   concurrency, and spend; `standard|pro` remains adapter metadata.
2. **ADAPT — Markdown into a versioned derivation (high).** Attach it to an
   immutable lawful capture/DOM digest with extractor and serializer versions,
   timestamps, byte counts, truncation, and locators.
3. **ADAPT — raw content into typed representations (high).** Distinguish wire
   bytes, decoded body, rendered DOM, and PDF bytes. Never collapse them under a
   provider's ambiguous `rawContent` label.
4. **ADAPT — live retrieval into auditable freshness (high).** Report capture,
   validation, cache, and derivation time separately; unknown remains unknown.
5. **ADAPT — image extraction into bounded references (high).** Return source
   locators and normalized URLs, but require a separate authorized fetch for
   image bytes.
6. **ADAPT — hosted error codes (high).** Preserve provider-native evidence and
   map to a richer neutral failure taxonomy with conservative retry policy.

### Rejected

1. **REJECT — “real-time” as freshness proof (high).** The contract exposes no
   capture time, cache state, validators, or stale marker.
2. **REJECT — clean/LLM-ready Markdown as safe or complete (high).** It is an
   unversioned, hostile derivative with no completeness signal.
3. **REJECT — mutable URL plus text as sufficient provenance (high).** Require
   immutable identity, temporal and network evidence, hashes, and derivation
   lineage for evidentiary use.
4. **REJECT — provider Fetch as Curiosity's SSRF/robots/rights boundary (high).**
   Public safeguards are incomplete and not per-attempt evidence.
5. **REJECT — automatic JS or pro escalation (high).** Cost and attack surface
   increase; escalation needs explicit authorization and bounded retry state.
6. **REJECT — hosted Fetch as an owned-stack foundation (high).** Access,
   caching, rendering, extraction, versions, and retention remain vendor
   controlled and largely opaque.

### Deferred

1. **DEFER — Linkup Fetch adapter selection (medium-high).** Revisit after DPA/
   retention review and separately authorized contract tests on owned fixtures.
2. **DEFER — `pro` use (high).** Await exact access semantics, robots/CAPTCHA
   policy, target terms review, SDK support, and measured benefit.
3. **DEFER — raw PDF evidence use (high).** The public contract does not define
   PDF `rawContent` representation or byte fidelity.
4. **DEFER — rendered output as citation evidence (high).** Wait for capture/
   final-URL/timestamp/hash/renderer provenance or retain an owned capture.
5. **DEFER — Tasks under ZDR (high).** Queued persistence and ZDR compatibility
   need explicit provider and contractual confirmation.

## 12. Required pre-integration checks

These are proposed checks, **not executed in this study**:

1. Obtain written answers for private-address, DNS-rebinding, redirect-hop,
   port, URL-userinfo, decompression, server-timeout, and renderer-egress policy.
2. Confirm whether robots applies to Fetch, identify its user agent and robots
   failure/cache policy, and clarify `pro` interaction with access controls.
3. Define cache/live semantics, stale fallback, conditional validation, and
   whether Fetch affects or reads the Search index.
4. Clarify `rawContent` exactly for static HTML, rendered HTML, and PDF,
   including byte fidelity, encoding, and `contentType` values.
5. Confirm output byte/truncation/image-count caps and which representation the
   20 MB/100 MB limits measure.
6. Resolve REST/SDK drift: `mode` support, Boolean-string schema, deprecated
   `includeRawHtml`, and required favicon behavior.
7. Confirm stable error `code` values, `Retry-After`, origin-status mapping,
   idempotency, and whether charged success includes empty/incomplete Markdown.
8. Under procurement authority, bind Fetch URL/content retention, regions,
   subprocessors, deletion, training exclusion, ZDR scope, and Tasks compatibility.
9. Under a separately declared test frame, use only owned fixtures to check
   static/rendered equivalence, redirects, changing content, PDFs, malformed
   MIME, size boundaries, truncation, timeouts, errors, and billing. Do not probe
   third-party defenses or private networks.

## 13. Unknowns and retained negative results

Material unknowns after official-source saturation:

- live-origin versus cache behavior and all freshness evidence;
- exact `standard`/`pro` acquisition mechanisms and fallback order;
- final URL, redirect/DNS/TLS/HTTP evidence and SSRF controls;
- Fetch-specific robots, user-agent, target-rights, and safety decisions;
- renderer identity, isolation, waits, subresources, and resource budgets;
- exact raw HTML/PDF representation, Markdown algorithm, versions, hashes,
  offsets, and truncation;
- URL/output/redirect/image/page/decompression limits and server deadline;
- origin status/error granularity, stable error codes, retry headers, and
  partial-success semantics;
- direct Fetch retention, task retention duration, ZDR coverage, processors,
  and deletion;
- whether Fetch reads/writes Linkup's index or shares cache/infrastructure with
  Search;
- measured success, latency, completeness, safety, and price correctness without
  authorized tests.

These absences do not prove unsafe or deficient implementation. They bound how
much authority Curiosity can assign to the hosted contract.

## 14. Bounded curiosity pass

After synthesis, remaining threads were scored 1–5 for **relevance (R)**,
**decision value (V)**, **novelty (N)**, and **cost (C, where 5 is expensive)**.
Priority was assessed qualitatively as high R/V/N with low C.

| Thread | R | V | N | C | Outcome |
|---|---:|---:|---:|---:|---|
| Current REST versus SDK/changelog drift | 5 | 5 | 4 | 1 | pursued; found missing SDK `mode` and removed timestamp/URL |
| Fetch-specific cache/freshness semantics | 5 | 5 | 4 | 1 | pursued across all Fetch docs; saturated as negative result |
| Fetch-specific SSRF/robots controls | 5 | 5 | 4 | 2 | pursued across Fetch/security docs; remained ambiguous/unknown |
| `rawContent` PDF semantics | 4 | 4 | 4 | 1 | pursued in OpenAPI/docs/SDK; saturated as unknown |
| Public SDK transport/error shape | 4 | 4 | 3 | 2 | pursued at pinned official commits; useful client-timeout/error findings |
| Hidden vendor/cache/proxy implementation | 3 | 3 | 5 | 5 | rejected: no lawful public evidence; speculation would not improve decision |

**CURIOSITY_NO_GO:**

- Authenticated, free-credit, or x402 calls: outside authority and would create
  provider/target traffic or payment.
- SSRF, redirect, CAPTCHA, bot-defense, signed-URL, or private-network probes:
  security testing and third-party interaction were outside scope.
- Inferring or fingerprinting `pro` proxies, browser binaries, or parser
  libraries: no public necessity; would cross from contract analysis into
  speculative/probing reverse engineering.
- Trust-center reports, DPA, client terms, and privacy-policy dynamic document:
  public text was gated or not rendered through the read-only path; no bypass
  attempted. Procurement review remains required.
- Competitor comparison and quality benchmark: outside the Linkup-Fetch-only
  frame and unable to resolve provenance/security unknowns.
- Copying SDK code: unnecessary; MIT licensing of clients does not license the
  hosted service, hidden implementation, or fetched third-party content.

**Stop condition:** coverage and saturation reached for the declared
sub-questions. Remaining high-value gaps require provider confirmation,
contractual review, or separately authorized owned-fixture testing.

## 15. Primary-source ledger

All sources are official/primary and were accessed 2026-08-17.

- **[S1]** Linkup, “Fetch overview” — product boundary, fields, HTML/PDF and
  size constraints, anonymous behavior, prices, success example.
  <https://docs.linkup.so/pages/documentation/endpoints/fetch/overview>
- **[S2]** Linkup, current `POST /v1/fetch` OpenAPI rendering — authoritative
  request/response schemas, defaults, deprecation, required fields, statuses.
  <https://docs.linkup.so/pages/documentation/endpoints/fetch/reference>
- **[S3]** Linkup, “Fetch best practices” — mode/JS distinction, rendered-page
  indicators, raw HTML/image guidance, Search→Fetch pattern.
  <https://docs.linkup.so/pages/documentation/endpoints/fetch/best-practices>
- **[S4]** Linkup, “Fetch for AI agents” — known-URL boundary, typical latency,
  rendering guidance, limits, tool schema.
  <https://docs.linkup.so/pages/documentation/endpoints/fetch/for-agents>
- **[S5]** Linkup changelog, “Fetch Pro mode,” August 2026 — release date,
  independent mode/render switches, pricing.
  <https://docs.linkup.so/pages/changelog/fetch-pro-mode>
- **[S6]** Linkup, “Errors” — common envelope, HTTP classes, Fetch error types
  and size/unreachable/unsupported cases.
  <https://docs.linkup.so/pages/documentation/platform/errors>
- **[S7]** Linkup, “Rate Limits” — 10 requests/s per organization and x402
  per-IP scope.
  <https://docs.linkup.so/pages/documentation/platform/rate-limits>
- **[S8]** Linkup changelog, “Fetch Endpoint,” September 12, 2025 — historical
  launch request/response contract including URL and timestamp.
  <https://docs.linkup.so/pages/changelog/fetch-endpoint>
- **[S9]** Linkup, “Content safety and index controls” — vendor statements on
  safety filtering, DNS controls, robots, CAPTCHAs, access controls, and public
  content.
  <https://docs.linkup.so/pages/security-and-privacy/content-safety-index-controls>
- **[S10]** Linkup, “Migrating from Tavily” — one-URL Fetch boundary, Tasks for
  batches, response examples.
  <https://docs.linkup.so/pages/documentation/tutorials/migrating-from-tavily>
- **[S11]** Linkup, “x402 Payment Protocol” — unauthenticated payment handshake,
  endpoint coverage, flat-price statement, per-IP behavior context.
  <https://docs.linkup.so/pages/documentation/platform/x402>
- **[S12]** Linkup, “Pricing” — current four Fetch prices, successful/error
  billing, x402 minimum, credit-exhaustion status.
  <https://docs.linkup.so/pages/documentation/platform/pricing>
- **[S13]** Linkup, “Tasks overview” and current `POST /v1/tasks` OpenAPI —
  asynchronous Fetch wrapper, 100-item cap, states, timestamps, same output and
  price, per-item isolation.
  <https://docs.linkup.so/pages/documentation/endpoints/tasks/overview>
  <https://docs.linkup.so/pages/documentation/endpoints/tasks/post>
- **[S14]** Linkup, “Tasks best practices” — poll cap, independent failures,
  bounded but unspecified result lifetime.
  <https://docs.linkup.so/pages/documentation/endpoints/tasks/best-practices>
- **[S15]** Linkup official JavaScript SDK at commit
  `c847bb324e5e42be3d91098dfb98f61714aac97f` — Fetch types, pass-through
  transport, errors, favicon/raw optionality, missing `mode`.
  <https://github.com/LinkupPlatform/linkup-js-sdk/tree/c847bb324e5e42be3d91098dfb98f61714aac97f>
- **[S16]** Linkup official Python SDK 0.20.0 at commit
  `ba083ff21d5dc345447b054f0365055fe58999cc` — Fetch signature/types, local
  timeout, error refinement, missing `mode`.
  <https://github.com/LinkupPlatform/linkup-python-sdk/tree/ba083ff21d5dc345447b054f0365055fe58999cc>
- **[S17]** Linkup Python SDK changelog — Fetch introduction, image support,
  timeout, typed errors, raw content, favicon chronology.
  <https://github.com/LinkupPlatform/linkup-python-sdk/blob/ba083ff21d5dc345447b054f0365055fe58999cc/CHANGELOG.md>
- **[S18]** Linkup, “Data processing and privacy” — default processing regions,
  ZDR non-default and memory-only vendor description.
  <https://docs.linkup.so/pages/security-and-privacy/data-processing-privacy>
- **[S19]** Linkup, “Security and compliance” — encryption, network controls,
  certifications, enterprise locality/IP controls.
  <https://docs.linkup.so/pages/security-and-privacy/security-compliance>

## 16. Confidence summary

- **High:** current REST request/response schema, documented mode/render
  distinction, HTML/PDF and size classes, prices, rate limit, common error
  envelope, Tasks transport, and dated SDK/document drift.
- **Medium:** product-stage architecture and the interpretation that Tasks adds
  transport persistence but not capture provenance; applicability of general
  indexing/retrieval safety statements to Fetch.
- **Low/unknown:** actual cache/live behavior, pro mechanism, renderer/parser
  internals, SSRF/robots enforcement, raw PDF fidelity, extraction completeness,
  retention, and measured runtime quality without provider confirmation or
  authorized tests.
