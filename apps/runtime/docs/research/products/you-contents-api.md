# You.com Contents API: clean-room known-URL retrieval analysis

**Research and source-access date:** 2026-08-17  
**Scope:** You.com `POST /v1/contents` only. Web Search, Answer, Research,
Finance Research, and their quality are out of scope except where a primary
source explicitly distinguishes the Contents product or its privacy boundary.  
**Status:** documentation-based product research; not an implementation,
benchmark, procurement decision, endorsement, or legal opinion.  
**Overall confidence:** high for the published request/response surface and
list price; medium for freshness and extraction semantics; low for
undocumented network, cache, renderer, robots, and deletion behavior.

## Executive verdict

**ADAPT the narrow known-URL boundary; do not adopt the evidence contract or
the hosted service as Curiosity's owned content plane (high confidence).**

You.com Contents is a synchronous batch read/extraction product: the caller
supplies up to ten known URLs, asks for Markdown, HTML, and/or metadata, chooses
a 1–60 second per-URL crawl timeout, and may set a maximum acceptable cached
age. You.com says the URLs are processed in parallel and that a failed member
can return null content without failing the whole array [S1][S2]. This is a
useful separation from Search discovery and from Answer/Research synthesis.

The observable evidence contract is much weaker. A success carries only a URL,
title, optional transformed HTML/Markdown, and sparse site metadata. It carries
no capture time, cache age or source, HTTP status, redirect chain, canonical
URL, content type/size/hash, raw-response identity, renderer indication,
extractor version, truncation flag, robots/policy decision, stable item status,
or request/capture identifier [S1][S2]. Even `max_age=0` expresses a fetch
policy but does not return auditable proof of when or what was fetched.

The most important clean-room lessons are:

1. **Keep read-known-URLs separate from discover-by-query.** A content request
   must not silently acquire search, ranking, or recursive-crawl authority.
2. **Make freshness observable.** Return capture/validation time, cache outcome,
   and stale-fallback status—not only an input threshold.
3. **Do not call transformed output raw.** You.com's own sources conflict:
   marketing/examples call the HTML “raw,” while the guide promises parsing,
   removal of HTML noise, and LLM-ready extraction; the official example is
   visibly not a byte-faithful origin document [S1][S3][S4].
4. **Return one typed outcome per input.** Null bodies preserve a batch but do
   not explain timeout, login wall, 404, policy block, unsupported media, or
   empty extraction.
5. **Treat URLs and extracted bytes as hostile.** “Clean” means presentation,
   not SSRF safety, malware safety, prompt-injection safety, truth, or lawful
   reuse.
6. **Do not rely on standard-service privacy assumptions.** Contents is
   explicitly outside You.com's current Zero Data Retention coverage [S7].

## 1. Decision frame and bounded questions

The decision is which observable Contents ideas Curiosity may adopt, adapt,
reject, or defer while retaining provider neutrality, bounded behavior,
capture-level provenance, and clean-room independence.

Bounded sub-questions:

1. What URL, authentication, request, response, timeout, and batch contract is
   publicly documented?
2. What distinguishes cached, live-fetched, and stored derived content?
3. What do HTML, Markdown, metadata, “full page,” and JavaScript support
   actually promise, and what output bounds are absent?
4. Which provenance and freshness claims can a caller verify?
5. How do member failures, request errors, rate limits, and prices compose?
6. What is publicly stated about SSRF, redirects, robots, privacy, retention,
   hostile content, publisher rights, and safety?
7. What minimal architecture follows from the contract without claiming
   proprietary internals?
8. Which lessons transfer clean-room to Curiosity?

**Method boundary:** public first-party documentation, official public SDK
artifacts at a recorded commit, and published legal/policy materials. No API
key, free-credit or paid request, keyless call, MCP invocation, traffic
interception, private endpoint, vulnerability test, third-party target probe,
package installation, vendor-output ingestion, or proprietary code inspection
was used. The official SDK was read only as a public transport/schema artifact;
no code was copied [S8].

**Coverage criterion:** every caller-requested category receives a sourced
fact, an explicit inference or unknown, and a Curiosity implication. **Stop
rule:** stop on coverage and source saturation; do not cross into authenticated
experiments, vendor internals, contract negotiation, or legal interpretation.

Labels:

- **FACT** — directly stated in or visible from a cited primary source.
- **INFERENCE** — the least-assumptive explanation consistent with the facts;
  not an observation of You.com's internals.
- **RECOMMENDATION** — a clean-room Curiosity design/governance choice.
- Confidence is **high**, **medium**, or **low**.

## 2. Product boundary: read, not search or synthesize

**FACT (high):** Contents starts from caller-supplied URLs and returns extracted
page representations. It accepts no discovery query, ranking control, answer
prompt, citation request, or research effort. The endpoint is
`POST https://ydc-index.io/v1/contents`, authenticated with `X-API-Key` [S1][S2].

**FACT (high):** You.com's comparison says Contents is for already-known URLs,
whereas Web Search full-page extraction begins from a query and You.com
discovers the URLs. Contents batches 10 URLs; Search can attach extraction to
up to 100 results per search [S1]. Contents itself has no generated answer or
summary field in its current endpoint schema [S2].

**CONTRACT CONFLICT (high):** the pricing page describes Contents as extracting
“page text, summaries, and metadata,” but the current guide, endpoint reference,
and official SDK expose only `html`, `markdown`, and sparse metadata—no summary
request or response [S1–S4][S8]. Treat summaries as marketing drift or another
surface, not as a current portable Contents contract.

**RECOMMENDATION (high):** preserve a separate operation such as
`RetrieveKnownUrls`. Search may produce candidate URLs, but the caller must
materialize and authorize the exact bounded set before read. Child links and
page instructions confer no additional authority.

## 3. Request contract and bounds

### 3.1 Published request

| Field | Published contract | Qualification |
| --- | --- | --- |
| `urls` | array of URL strings; guide says required and at most 10 [S1] | Generated reference and SDK model mark it optional [S2][S8]. No minimum, string-length, scheme, normalization, duplicate, fragment, credential-in-URL, or redirect rule is published. |
| `formats` | any combination of `markdown`, `html`, `metadata`; guide says default Markdown [S1] | Reference and SDK do not state/model that default; both allow omission [S2][S8]. Empty-array behavior and duplicate formats are unknown. |
| `crawl_timeout` | integer 1–60 seconds; default 10; described as per URL [S1][S2] | It is not an overall request deadline. Queuing, DNS, redirects, rendering, and serialization allocation within it are unspecified. |
| `max_age` | nullable integer ≥0, seconds; null/unset accepts cached content regardless of age; `0` bypasses cache; positive values reject older cache and cause refetch [S1][S2] | No upper bound, actual age, cache source, hard-freshness outcome, or stale fallback indicator is returned. |

**FACT (high):** the guide says one request processes its URLs in parallel and
recommends batching ten URLs rather than issuing ten separate requests [S1].

**UNKNOWN:** whether the ten-item limit is endpoint validation or only published
guidance. The generated endpoint reference says only “array of URLs” and marks
`urls` optional, while the guide says “up to 10” and required [S1][S2]. No call
was authorized to resolve empty, absent, 10/11-item, or malformed-URL behavior.

**RECOMMENDATION (high):** Curiosity's neutral request must require a nonempty,
locally validated list with a smaller policy-selected cap; normalize and admit
only public HTTP(S) URLs; reject embedded credentials and sensitive/signed URLs;
and set independent per-item, whole-request, byte, render, and cost deadlines.
Never inherit vendor optionality or defaults into the neutral contract.

### 3.2 Authentication and transport

**FACT (high):** direct REST uses an `X-API-Key` header and JSON. Contents is
not available in You.com's unauthenticated MCP free profile; the authenticated
MCP server exposes a separate `you-contents` tool [S2][S11].

**FACT (medium):** the official Python SDK routes Contents to the
`ydc-index.io` operation server, constructs the same four request fields, and
returns a list of typed page objects. The SDK permits a separately configured
overall HTTP timeout; that client timeout is distinct from `crawl_timeout`
[S8].

**RECOMMENDATION (high):** credentials belong to a provider adapter/secret
boundary, never the agent or provider-neutral request. Do not place URLs,
responses, keys, or provider error bodies in unrestricted logs.

## 4. Response, extraction, and output bounds

### 4.1 Observable response shape

HTTP 200 is an array whose members have only optional fields [S2][S8]:

```text
ContentsResult
  url?       string
  title?     string
  html?      string | null
  markdown?  string | null
  metadata?  {
    site_name?   string | null
    favicon_url? string
  } | null
```

**FACT (high):** `metadata` appears only when requested. The reference says the
format obtains JSON-LD and OpenGraph information “if available,” but the public
response schema exposes only OpenGraph `site_name` and a You.com-provided
favicon URL; it exposes no JSON-LD object or field-level origin evidence [S2].

**FACT (high):** the response has no request ID, input item ID, status, failure
reason, retryability, usage/cost, response latency, fetched bytes, or output
length. All principal page fields are optional [S2][S8].

**UNKNOWN:** result ordering, exact cardinality, duplicate handling, whether
`url` is the submitted, normalized, redirected, or canonical URL, and whether a
format not requested is absent or null. The guide implies one object per input,
but neither reference nor SDK documents a positional/cardinality invariant.

### 4.2 Markdown is a semantic derivative

**FACT (high):** You.com says Markdown strips navigation, ads, footers, and
other boilerplate, returning LLM-ready page content. It recommends longer
timeouts for JavaScript-heavy pages and describes a renderer completing such
pages [S1].

**INFERENCE (high):** Markdown is a derived main-content representation, not an
archival capture. Boilerplate decisions, DOM/render state, normalization, and
serialization can omit or reorder page evidence. A title or metadata value can
also be extractor-derived rather than a verified publisher claim.

**UNKNOWN:** parser, renderer, browser, wait condition, viewport, locale,
cookies, consent handling, script/network policy, DOM stabilization, iframe and
shadow-DOM handling, PDF/office/media support, table/code fidelity,
multilingual behavior, link/image preservation, extractor version, and quality
fallback order.

### 4.3 “HTML” is not safely established as raw origin HTML

Primary sources conflict:

1. The guide's top-level description says it extracts “clean HTML or Markdown,”
   promises “no parsing” by the client and “no HTML noise,” and says each format
   adds processing time [S1].
2. The example page and pricing page call the HTML format “raw HTML” [S3][S4].
3. The official reference calls it “retrieved HTML,” but its own sample starts
   with plain text, omits apparent opening angle brackets on an element, and is
   a truncated illustrative page fragment—not an HTTP entity-body example
   [S2].

**INFERENCE (medium-high):** HTML is likely a rendered and/or extracted
derivative, not guaranteed byte-for-byte origin HTML. The public contract does
not promise raw response bytes, response headers, transfer decoding identity,
DOM snapshot fidelity, or preservation of scripts/styles/resources.

**RECOMMENDATION (high):** never map this field to `raw_html` or immutable
capture. Use a label such as `provider_html_view`, with acquisition and
transformation details explicitly unknown. Never execute it; sanitize only for
display while preserving trust labels.

### 4.4 Completeness and bounds

**FACT (high):** the docs repeatedly say “full page content,” and an example
says a Wikipedia Markdown body is about 12,000 characters [S1][S3]. No current
reference field defines a character/token/byte maximum, counting unit,
selection rule, or truncation flag [S1–S3][S8].

**NEGATIVE RESULT (high):** no public Contents maximum was found for:

- URL string length, source response bytes, decompressed bytes, DOM nodes, or
  origin redirects;
- returned HTML/Markdown characters or total JSON response bytes;
- title, metadata, or favicon URL length;
- renderer CPU/memory/network work; or
- number/size of embedded links, images, scripts, iframes, or downloads.

“Full page” is therefore a product description, not a verifiable completeness
guarantee.

**RECOMMENDATION (high):** Curiosity must enforce local response-byte,
per-field, document-character, token, and wall-time limits before parsing or
prompt inclusion. Return `{truncated, reason, observed_bytes,
returned_characters}`. Prefer immutable capture handles and bounded passage
views over arbitrarily large inline documents.

## 5. Cache, live fetch, stored artifacts, and freshness

### 5.1 What the public contract establishes

**FACT (high):** You.com maintains or can serve cached page content. Default
`max_age=null`/unset accepts cached content regardless of age. A positive
threshold causes cached content older than that number of seconds to be ignored
and the page re-fetched. `max_age=0` always bypasses cache and re-fetches [S1][S2].

**FACT (high):** the response has no `fetched_at`, `cached_at`, `age`,
`cache_hit`, `source`, `revalidated_at`, ETag, Last-Modified, 304 indicator, or
stale-fallback field [S2]. A request timestamp is not a source capture time.

**INFERENCE (high):** callers cannot verify the age requirement from the
response. `max_age` is an acquisition-policy input, not self-authenticating
freshness evidence.

### 5.2 Hard versus soft freshness is unresolved

The docs say old cached content is “ignored, forcing a fresh fetch” and that
`max_age=0` bypasses cache [S1][S2]. They do not state:

- whether a failed/timed-out refetch can fall back to older cached content;
- whether a 304 counts as fresh fetch/revalidation;
- whether “age” starts at HTTP fetch, render completion, extraction, or cache
  insertion;
- whether the cache stores origin bytes, rendered DOM, extracted fields,
  serialized formats, or combinations;
- whether the requested formats are generated anew from a shared capture;
- cache key normalization, tenant sharing, TTL/eviction, negative caching,
  purge, or cross-format reuse; or
- whether a returned null body can coexist with usable stale cache.

**INFERENCE (medium):** the least-assumptive pipeline is URL lookup → cache-age
decision → cached artifact or fetch/render → extraction/formatting. The ability
to request multiple formats and metadata is consistent with a capture or parsed
artifact feeding several serializers, but does not prove what is persisted.

**RECOMMENDATION (high):** the owned contract should separate policy from
outcome:

```text
freshness_policy: cache_only | max_age | require_live
max_age_seconds?
stale_fallback: deny | allow

acquisition_outcome: cache_hit | revalidated | fetched | stale_fallback
captured_at, validated_at?, age_at_response, stale, fallback_reason?
```

The caller must be able to prohibit stale fallback. Capture time, first-seen
time, publisher-claimed publication/modified time, extraction time, and response
time are distinct.

## 6. Provenance and reproducibility gap

| Evidence question | You.com Contents response | Curiosity requirement |
| --- | --- | --- |
| What input item? | only optional `url`; no caller item ID | stable request item ID and exact submitted URL |
| Which network resource? | ambiguous returned URL | normalized, requested, fetched, redirect-terminal, and declared-canonical URLs |
| When acquired? | absent | capture/validation timestamps and clock provenance |
| Cached or live? | absent despite `max_age` input | explicit outcome, age, and stale fallback |
| Which bytes? | absent | status/selected headers, media type/charset, byte length, raw hash/object reference |
| Which representation? | HTML/Markdown string | capture ID, extraction ID/hash, renderer/parser/serializer versions |
| Was it complete? | no bound or truncation flag | truncation stage/reason and observed/returned lengths |
| Which metadata evidence? | title, site name, favicon URL | claim value, source element/header, confidence, extractor version |
| What policy allowed it? | absent | URL admission, robots/publisher/takedown, egress, and retention decisions |
| What operational trace? | absent | redacted provider trace plus Curiosity request/attempt IDs |
| What did it cost? | absent | predicted and actual per-item billable units |

**INFERENCE (high):** a Contents response cannot by itself support reproducible,
time-specific citation or prove that two calls used the same page version. A URL
plus transformed text is a useful reading aid, not a chain-of-custody record.

**RECOMMENDATION (high):** citations should bind to `document_id + capture_id +
extraction_id + passage_id/hash`, not a mutable URL. If You.com is ever used as
an adapter, unavailable fields must remain `unknown`; do not manufacture fetch
times or raw hashes from provider-transformed output.

## 7. Partial failures and request errors

### 7.1 Per-URL failure semantics

**FACT (high):** You.com says one failed URL does not fail the whole batch. A
login wall or 404 can produce a member whose `markdown` and `html` are null;
clients are told to check for null before processing [S1].

**FACT (high):** no per-member `status`, `error`, `stage`, origin HTTP code,
retryability, timeout indicator, or policy reason exists in the response schema
[S2]. Title, URL, metadata, and both content fields are independently optional.

**UNKNOWN:** how to distinguish crawl failure from legitimately empty content,
format-specific parse failure, omitted format, policy block, timeout, unsupported
media, and truncation. It is also unknown whether a failed member is billed and
whether every admitted input always gets an array member.

**RECOMMENDATION (high):** require exactly one terminal attempt record per
input, with distinct `validation`, `policy`, `dns`, `connect`, `tls`, `redirect`,
`fetch`, `render`, `parse`, `extract`, `serialize`, `provider_limit`, and
`provider_internal` classes; include retryability, bounded redacted detail,
budget consumed, and whether any stale/partial representation was returned.

### 7.2 Envelope errors and retries

**FACT (medium-high):** shared You.com documentation lists 400, 401, 402, 403,
404, 422, 429, and 500 classes. Contents is used as the example for 403 missing
API-key scope. The error examples are not one stable body shape: they use
`detail` or `error` [S5].

**FACT (medium):** the generated official Python operation specifically models
JSON 401, 403, and 500 responses and treats other 4xx/5xx responses as generic
provider errors. When retrying is explicitly configured, its operation defaults
cover 429, 500, 502, 503, and 504; retries are not proof of endpoint-side
idempotency or charging behavior [S8].

**FACT (high):** every response is documented to carry `X-RateLimit-Limit`,
`X-RateLimit-Remaining`, and `X-RateLimit-Reset`; 429 may carry `Retry-After`.
The numeric limit depends on subscription and is not public by tier [S6].

**RECOMMENDATION (high):** normalize provider errors into a stable internal
taxonomy while preserving redacted provider status and retry hints. Retry only
explicitly retryable failures with jitter, attempt/deadline/cost ceilings, and
item-level idempotency accounting. A 200 array is not complete success.

## 8. Pricing and operational economics

**FACT (high):** the public self-serve list price on the access date is **$1.00
per 1,000 pages**. The guide says billing is based on the number of pages
fetched; batching is included. Multiple requested formats add processing time,
but no primary source says they multiply page charges [S1][S4].

**FACT (high):** responses expose no usage or price breakdown [S2]. Rate limits
are plan-dependent; enterprise custom QPS, discounts, annual terms, and other
commercial controls are negotiated [S4][S6]. Free-credit/onboarding offers are
not durable retrieval semantics.

**UNKNOWN:** whether charges apply to failed/null, cached, revalidated,
redirected, duplicate, unsupported, or timed-out URLs; whether a page means an
input, an attempted fetch, or a successful returned representation; and whether
requesting zero or several formats changes billing.

At list price, one successfully billed page is nominally $0.001 and a full
10-page batch is nominally $0.01. These arithmetic examples are not statements
about failure charging or enterprise rates.

**RECOMMENDATION (high):** admit work against caller-visible maxima for URLs,
origin attempts, render escalations, bytes, latency, retries, storage, and
provider dollars. Record predicted and actual page units per input and reconcile
against account analytics; never let page content authorize another billed
fetch.

## 9. SSRF, robots, hostile content, and safety

### 9.1 Origin-fetch security boundary

**FACT (high):** You.com markets “any URL,” parallel crawling, and support for
heavy JavaScript pages through a renderer [S1]. This creates server-side URL
fetch and browser/parser attack surfaces, regardless of You.com's undisclosed
implementation.

**NEGATIVE RESULT (high):** reviewed public Contents sources do not specify:

- allowed schemes/ports, userinfo handling, IP literals, or URL normalization;
- DNS rebinding protection, private/loopback/link-local/metadata address blocks,
  or per-hop redirect revalidation;
- redirect count, cross-domain redirect policy, origin byte/decompression/DOM
  limits, MIME sniffing, archive handling, or download policy;
- cookie, authorization, proxy, credential, geolocation, or customer-header
  behavior;
- renderer sandbox, process/network isolation, script/iframe/service-worker
  limits, malware scanning, or browser patch level; or
- same-host concurrency, crawl-delay, politeness, trap detection, or egress
  region.

Absence from public docs does **not** prove You.com lacks these controls; it
means a client cannot make them part of an auditable Contents contract.

**RECOMMENDATION (high):** Curiosity must reject private/sensitive URLs before
provider disclosure; permit only normalized HTTP(S); resolve and re-check
address policy at every redirect; never forward ambient cookies, credentials,
or authorization; isolate optional rendering in a no-intranet disposable lane;
and enforce redirects, bytes, decompression, MIME, script, network, CPU, memory,
and wall-time budgets independently of the provider.

### 9.2 Robots, publishers, and lawful use

**NEGATIVE RESULT (high):** no reviewed Contents guide/reference field states
how `robots.txt`, crawl delay, `noindex`, `nofollow`, `nosnippet`, `noarchive`,
publisher opt-outs, paywalls, logins, takedowns, copyright notices, or site terms
affect a request. The response records no robots or publisher-policy decision
[S1][S2].

**FACT (high):** published customer terms put responsibility on the customer to
hold rights/permissions for submitted material and lawful use, and treat
third-party services/output as subject to third-party terms. The current API
AUP prohibits infringing third-party rights and, without contractual
authorization, copying or storing for reuse significant portions of API content
[S9][S10].

**CONTRACT TENSION (high):** the Contents guide promotes knowledge-base
ingestion and scheduled competitive-page monitoring, while the AUP restricts
significant copying/storage absent contractual authorization [S1][S10]. The
docs do not resolve what quantity, duration, or use qualifies as “significant.”
A successful fetch is not permission to retain, redistribute, train on, or
publish origin content.

**RECOMMENDATION (high):** any adapter evaluation needs current MSA/order/AUP,
DPA, source-rights, robots/publisher, retention, deletion, and permitted-output
use review. Curiosity should record the policy decision per capture and support
takedown/deletion lineage. Robots is a crawl instruction, not a copyright
license; public availability is not a reuse license.

### 9.3 Content trust and prompt injection

**FACT (high):** You.com's API AUP requires developers to implement appropriate
input filtering, output moderation, and rate limiting, and prohibits using
prompt-injection/adversarial techniques to manipulate You.com model behavior
[S10]. These are customer-use obligations, not a promise that Contents removes
prompt injection from fetched pages.

**NEGATIVE RESULT (high):** Contents exposes no SafeSearch/moderation switch,
malware label, prompt-injection signal, PII/secret detector, source reputation,
sanitization status, or policy reason [S1][S2].

**INFERENCE (high):** a clean Markdown transformation can faithfully preserve a
malicious indirect instruction, false assertion, tracking URL, hidden Unicode,
personal data, or copyrighted passage. Extraction quality and content safety
are independent dimensions.

**RECOMMENDATION (high):** label every returned character and URL
`untrusted_external_evidence`; retrieved content cannot change system policy,
request secrets, authorize tools, increase budgets, or trigger another network
action. Never auto-fetch favicon or embedded URLs in a privileged context.

## 10. Privacy, retention, and data governance

### 10.1 Endpoint-specific public facts

**FACT (high):** You.com's current Zero Data Retention option covers Web Search
and Answer only. The ZDR page explicitly says Contents and Research are not yet
supported and asks customers to contact their account team if that is required
[S7]. Therefore, a Search account with ZDR does not make a Contents call ZDR.

**FACT (medium-high):** the general Privacy Policy says You.com collects device,
usage, telemetry, and supplied information; may use information to provide,
secure, analyze, improve, and develop services; uses service providers; advises
users not to submit sensitive regulated data; and retains information as long as
reasonably necessary to provide services or meet legal requirements [S12]. It
does not specify a Contents URL/page/output retention period.

**FACT (high):** the published December 2025 MSA defines customer data as
prompts and outputs, limits its use to service provision, legal compliance, and
safety, permits service providers/subcontractors, and describes deletion after
a post-termination retrieval period. The April 2025 DPA applies when You.com is
a processor and provides security/subprocessor/deletion terms [S9][S13]. An
applicable ordering document and negotiated terms take precedence; this report
does not determine which document governs a particular account.

**UNKNOWN:** how a submitted Contents URL, fetched origin bytes, rendered DOM,
cached page, extracted output, and favicon request are classified under
“Prompt,” “Output,” service cache, platform analysis, or third-party content;
standard-service retention/backup deletion; cache sharing between tenants;
regional acquisition/processing; endpoint subprocessors; or model/training use
for Contents specifically.

**RECOMMENDATION (high):** assume standard Contents requests and outputs may be
retained until written endpoint-specific terms say otherwise. Do not submit
private/intranet/presigned URLs, URL credentials, tenant identifiers, secrets,
regulated data, or pages whose disclosure to You.com is unauthorized. Require
written Contents-specific retention, deletion, cache-isolation, training/use,
subprocessor, residency, and incident answers before sensitive use.

### 10.2 Policy contradictions retained

The MSA warns against restricted personal data, while the DPA contemplates that
customer-controlled personal data—including potentially special categories,
subject to agreement restrictions—may be processed [S9][S13]. This is not an
endpoint capability or self-serve permission. It demonstrates why generic
public policy text cannot substitute for an executed order/DPA and use-case
review.

## 11. Bounded architecture inference

The observable contract is consistent with the following **INFERENCE (medium)**:

```text
authenticated known-URL batch (<=10)
  -> request/account validation + format/freshness policy
  -> per-URL parallel scheduling
  -> normalized URL/cache lookup + max-age decision
  -> cached artifact OR live static fetch / rendered acquisition
  -> title + main-content + OpenGraph/JSON-LD-oriented metadata extraction
  -> HTML-view and/or Markdown serialization
  -> sparse per-input objects, with null bodies on some failures
  -> page metering
```

Evidence is limited to the cache-age gate, parallel batch claim, JavaScript
renderer guidance, format-specific processing, metadata claim, partial nulls,
and page pricing [S1][S2].

This does **not** establish service topology, concurrency implementation, cloud,
browser engine, parser libraries, proxies, models, index/cache technology,
cross-tenant storage, retry policy, queueing, or whether cached objects are raw,
rendered, parsed, or serialized. Attempts to discover underlying components are
also outside the clean-room and contractual boundary [S9].

## 12. Curiosity clean-room implications

### 12.1 Target separation

```text
CALLER / FRAME
  exact roots + purpose + tenant policy + deadline + URL/byte/render/cost budget
    |
URL ADMISSION / EGRESS
  normalize -> public-address gate -> source/robots policy -> redirect rechecks
    |
CAPTURE
  static fetch -> optional isolated render -> immutable response manifest
    |
EXTRACTION
  media parse -> title/metadata claims -> text/DOM map -> links
  -> extractor-versioned document
    |
VIEWS
  bounded Markdown/text -> capture-anchored passages
    |
RESPONSE
  one typed outcome/input + freshness + provenance + truncation + policy + cost
```

**RECOMMENDATION (high):** discovery, URL admission, capture, extraction,
passage selection, and synthesis are separate capabilities. A hosted
transformed page may fill a provider adapter's reading view, but it cannot be
silently promoted to an owned capture.

### 12.2 Minimum provider-neutral request concepts

```text
items[]: {item_id, normalized_public_url, purpose}
representation: text | markdown | html_view
freshness: {policy, max_age_seconds?, stale_fallback}
acquisition: static_only | rendered_allowed
deadline_ms
budgets: {max_urls, max_bytes, max_chars, max_rendered, max_retries, max_cost}
policy_ref, frame_id, branch_id
```

### 12.3 Minimum response concepts

```text
attempts[]:
  item_id, input_url
  status: success | partial | failure
  failure?: {stage, category, retryable, redacted_reason}
  urls: {normalized, fetched?, terminal?, declared_canonical?}
  acquisition: {outcome, captured_at?, validated_at?, stale, mode, redirects}
  capture?: {capture_id, status, media_type, bytes, raw_hash, object_ref}
  document?: {extraction_id, extractor_version, content_hash, view, truncation}
  policy: {url_admission, robots, publisher, retention, trust}
  provider_trace_id?
coverage: {attempted, succeeded, partial, failed, truncated, rendered}
usage: {predicted, actual, provider_reported?}
```

Unknown provider fields stay unknown. A You.com adapter could populate input
URL, provider-returned URL, title, transformed representations, site name, and
favicon reference. It could not truthfully populate capture time, raw hash,
redirect chain, renderer, robots decision, or extractor version from the public
response.

### 12.4 Adopted / adapted / rejected / deferred

| You.com-observed idea | Verdict | Curiosity treatment |
| --- | --- | --- |
| Known-URL retrieval separate from discovery | **ADOPTED** | Distinct contract and authority from Search and synthesis. |
| Small bounded batch | **ADOPTED/ADAPTED** | Require explicit nonempty roots and policy-selected cap; do not copy optional schema/default drift. |
| Parallel independent page work | **ADAPTED** | Internally schedulable per item, but preserve host politeness and total concurrency budgets. |
| Markdown/HTML/metadata format selection | **ADAPTED** | Versioned derived views; HTML is never assumed raw or executable. |
| `max_age` cache policy | **ADAPTED** | Add observable capture age/outcome and explicit stale-fallback policy. |
| Null content for member failure | **REJECTED as sufficient** | Preserve partial batch success but require typed per-item outcomes. |
| URL + title as provenance | **REJECTED as sufficient** | Capture, extraction, temporal, redirect, policy, and passage identities required. |
| “Full page” without bounds/truncation | **REJECTED** | Hard local bounds and explicit truncation semantics. |
| “Clean/LLM-ready” as trust guarantee | **REJECTED** | All content remains untrusted external evidence. |
| Hosted You.com cache as owned capture plane | **REJECTED** | Opaque storage/provenance/retention; adapter at most. |
| You.com provider evaluation | **DEFERRED** | Requires legal/privacy approval and controlled owned fixtures. |
| Rendered acquisition | **DEFERRED** | Static-first; add only after isolated-render security and quality gates. |

## 13. Fact / inference / recommendation ledger

| ID | Type | Claim | Confidence | Basis / verdict |
| --- | --- | --- | --- | --- |
| L1 | FACT | Contents is an authenticated POST known-URL extraction endpoint, separate from query discovery and synthesis. | High | [S1][S2]; **ADOPT boundary**. |
| L2 | FACT | Guide limit is 10 URLs and processing is described as parallel. | High | [S1]; **ADAPT bounded batch**. |
| L3 | FACT | `urls` is required in the guide but optional in reference/SDK schemas. | High | [S1][S2][S8]; contract drift retained. |
| L4 | FACT | Formats are HTML, Markdown, metadata; guide alone states Markdown default. | High | [S1][S2][S8]; send explicit format. |
| L5 | FACT | `crawl_timeout` is 1–60 seconds per URL, default 10. | High | [S1][S2]; add total deadline. |
| L6 | FACT | Unset `max_age` accepts cache of any age; 0 bypasses cache; positive values trigger refetch when cache is too old. | High | [S1][S2]; **ADAPT**. |
| L7 | FACT | Response does not disclose actual cache age, source, or capture time. | High | Negative schema inspection [S2][S8]; provenance gap. |
| L8 | FACT | Markdown is boilerplate-removed derived content; JS-heavy pages may need longer renderer time. | High | [S1]; untrusted derivative. |
| L9 | FACT | “Raw HTML” marketing conflicts with clean/processed wording and the official example. | High | [S1–S4]; never call it raw capture. |
| L10 | FACT | No full-page/output byte or character bound or truncation flag is public. | High | [S1–S3][S8]; impose local bounds. |
| L11 | FACT | A member failure may appear as null HTML/Markdown under HTTP 200, without a typed reason. | High | [S1][S2]; **ADAPT partial success, reject diagnostics**. |
| L12 | FACT | Public price is $1/1,000 pages; response has no usage field. | High | [S1][S2][S4]; expose owned cost ledger. |
| L13 | FACT | Contents is excluded from current ZDR coverage. | High | [S7]; privacy gate. |
| L14 | FACT | Public Contents docs expose no SSRF, robots, hostile-content, or renderer-isolation contract. | High | Negative review [S1][S2]; unknown, not absence. |
| L15 | FACT | AUP requires customer safeguards and restricts significant output storage without contractual authorization. | High | [S10]; legal/governance review. |
| L16 | INFERENCE | Contract is consistent with cache gate → fetch/render → extract → serialize, but persistence/topology are unknown. | Medium | L6, L8, L11; bounded only. |
| L17 | INFERENCE | Contents output cannot independently support time-specific reproducible citation. | High | L7, L9–L11 and missing hashes/IDs. |
| L18 | INFERENCE | “Clean” output does not neutralize prompt injection or prove truth/lawful use. | High | No safety field; formatting and trust are separate. |
| L19 | RECOMMENDATION | Keep exact-root retrieval unable to grant itself discovery, child crawl, tool, or spend authority. | High | **ADOPTED**. |
| L20 | RECOMMENDATION | Capture immutably, then version extraction and passage views. | High | **ADOPTED** target principle. |
| L21 | RECOMMENDATION | Do not use You.com as the owned retrieval foundation. | High | **REJECTED foundation**; opaque evidence/retention. |
| L22 | RECOMMENDATION | Evaluate a hosted adapter only with written governance and project-owned fixtures. | High | **DEFERRED**. |

## 14. Material unknowns and future checks

### 14.1 Unknowns retained

1. Actual 0/1/10/11 URL validation, URL length/schemes, normalization,
   duplicates, ordering, and one-result-per-input invariant.
2. Empty/omitted/duplicate formats and actual server default.
3. Cache key, artifact type, age clock, TTL, eviction, tenant sharing,
   revalidation, stale fallback, negative caching, and deletion.
4. Static/render acquisition sequence, renderer/runtime/network isolation,
   scripts/cookies/waits/locale, and supported media.
5. Redirect/canonical behavior and all source/output/DOM/decompression bounds.
6. HTML fidelity, Markdown completeness, links/tables/code/images, metadata
   evidence, extraction versions, determinism, and truncation behavior.
7. Per-URL error taxonomy, status/cardinality, total-request timeout, and
   retry/charging semantics.
8. Cached/live/failed/duplicate/multi-format billing and numeric rate limits.
9. SSRF/private-address, malware, robots, publisher opt-out, paywall, politeness,
   prompt-injection, and takedown controls.
10. Contents-specific retention, cache isolation, subprocessors, residency,
    training/improvement use, backup deletion, and ZDR roadmap timing.
11. Comparative quality, freshness, latency, uptime, and extraction fidelity;
    vendor examples are not benchmarks.

### 14.2 Separately authorized validation plan

These checks were **not performed**. If future authority exists, use only
organization-owned, public-domain, or explicitly permitted fixture pages:

1. Pin the REST schema and adapter version; test absent/empty/1/10/11 URLs,
   malformed URL classes, format omission, timeout and `max_age` bounds.
2. Verify positional/cardinality invariants and null/error behavior for owned
   404, login-like, timeout, unsupported-media, redirect-loop, and empty pages.
3. Change fixture revisions at controlled times; compare unset, positive, and
   zero `max_age`; detect stale fallback and revalidation without treating one
   observation as a general cache policy.
4. Compare origin bytes, static DOM, controlled client-rendered DOM, returned
   HTML, and Markdown; measure omission, transformation, table/link/code
   fidelity, deterministic drift, and output limits.
5. Confirm Curiosity rejects private/link-local/credential-bearing/signed URLs
   locally. Do not probe You.com's private-network defenses.
6. Reconcile billed units for success, cache, null failure, timeout, redirect,
   duplicates, and multiple formats with written pricing clarification.
7. Obtain current Contents-specific MSA/order/AUP/DPA, retention, ZDR,
   subprocessors, robots/publisher, security, and output-storage answers before
   any sensitive or production evaluation.
8. Treat observations as provider-adapter conformance evidence only—not a
   license or basis to clone hidden mechanisms or seed an owned corpus.

## 15. Bounded curiosity pass

After synthesis, in-frame gaps and contradictions were scored 1–5 for relevance
(R), decision value (V), novelty (N), and research cost (C, lower is better).
Priority was `R + V + N - C`. The caller authorized public primary-source
follow-up only.

| Thread | R/V/N/C | Score | Action / result |
| --- | --- | ---: | --- |
| Cached-age input versus observable freshness | 5/5/4/1 | 13 | **Pursued.** Guide, reference, and pinned SDK agree on `max_age`; exhaustive response fields confirm no age/source/capture outcome [S1][S2][S8]. |
| Raw HTML versus processed extraction | 5/5/4/1 | 13 | **Pursued.** Guide, example, pricing, and reference conflict; retained as provider HTML view, not origin bytes [S1–S4]. |
| Contents-specific ZDR/retention | 5/5/4/2 | 12 | **Pursued.** ZDR explicitly excludes Contents; general policy/MSA/DPA do not supply a standard endpoint TTL [S7][S9][S12][S13]. |
| Required URL/default format/schema drift | 4/4/4/1 | 11 | **Pursued.** Guide conflicts with reference and commit-pinned SDK; recommend explicit neutral validation/defaults [S1][S2][S8]. |
| Ingestion examples versus output-storage restriction | 5/5/4/2 | 12 | **Pursued.** Current AUP restricts significant storage absent authorization; guide use cases do not resolve scope [S1][S10]. |
| Per-URL error and failed-page pricing | 5/4/3/2 | 10 | **Pursued.** Primary docs expose only null member behavior and page list price; taxonomy/charging remain unknown [S1][S2][S4]. |
| Probe SSRF/private URLs or redirects | 5/5/3/5 | 8 | **CURIOSITY_NO_GO.** No credentials/calls or security probing authorized; dangerous and unnecessary. Public negative result retained. |
| Infer cache database, crawler, parser, browser, or cloud internals | 2/2/4/5 | 3 | **CURIOSITY_NO_GO.** Speculative, terms-sensitive, and irrelevant to the neutral contract. |
| Run free-credit quality/latency tests | 4/4/3/5 | 6 | **CURIOSITY_NO_GO.** Caller prohibited calls/credentials; no approved corpus or benchmark plan. |
| Resolve copyright/robots law across jurisdictions | 5/5/2/5 | 7 | **CURIOSITY_NO_GO.** Requires counsel and use/corpus facts; operational uncertainty and review gate retained. |
| Predict future Contents ZDR date or undocumented limits | 3/2/2/5 | 2 | **CURIOSITY_NO_GO.** Roadmap/speculation has no present contract value. |

**Stop condition:** coverage and source saturation reached. Remaining high-value
unknowns require authenticated fixture tests, written vendor answers, executed
contract review, or counsel—not more public-document search. No autonomous
follow-up is authorized by this report.

## 16. Checks performed

- Read repository `AGENTS.md` before research and kept provider-neutral
  contracts, untrusted external data, bounded behavior, and license boundaries
  explicit.
- Cross-checked the Contents guide, generated endpoint reference, example,
  pricing, shared errors/rate limits, and official SDK at commit `8e4ced6…`.
- Checked endpoint-specific ZDR separately from general privacy, MSA, DPA, and
  API AUP; did not project Search/Answer guarantees onto Contents.
- Retained contradictions and negative results rather than normalizing them
  into unsupported behavior.
- Made no You.com API, MCP, free-credit, keyless, or paid call and supplied no
  credentials.
- Inspected no private interface or proprietary implementation and copied no
  SDK code, prompts, fixtures, caches, or outputs.
- File-scope check: this task creates only
  `docs/research/products/you-contents-api.md`.

## 17. Primary sources

All sources were accessed **2026-08-17**. Dynamic pages can change; the SDK
source is commit-pinned where used.

| ID | Primary source | Supports / caveat |
| --- | --- | --- |
| **S1** | You.com, [Contents API Overview](https://you.com/docs/guides/contents.md) | Product boundary, 10-URL batch, parallel claim, formats/default, timeout, cache policy, Markdown/renderer claims, partial nulls, use cases and price. High for published guide; marketing/completeness claims are not runtime proof. |
| **S2** | You.com, [`POST /v1/contents` reference](https://you.com/docs/api-reference/contents.md) | Endpoint/auth, request/response schema, optionality, constraints and illustrative example. High for current declared schema; omits guide's ten-item/default statements. |
| **S3** | You.com, [Contents Extraction example](https://you.com/docs/examples/contents.md) | “Raw HTML” wording, example output, approximate 12,000-character Markdown body. Medium-high; examples are illustrative, not live observations. |
| **S4** | You.com, [API Pricing](https://you.com/pricing) | $1/1,000 pages, enterprise positioning, “raw HTML,” and conflicting summary marketing. High for list price on access date; marketing text is not endpoint schema. |
| **S5** | You.com, [Errors](https://you.com/docs/using-the-api/error-code-reference.md) | Shared HTTP classes, body-shape variation, Contents missing-scope example. Medium-high; not every class is separately declared on Contents reference. |
| **S6** | You.com, [Rate Limits](https://you.com/docs/using-the-api/rate-limits.md) | Limit/remaining/reset headers, 429, Retry-After and backoff. High for shared operational contract; numeric plan limits undisclosed. |
| **S7** | You.com, [Zero Data Retention](https://you.com/docs/administration/zero-data-retention.md) | Enterprise/account boundary and explicit current exclusion of Contents. High. |
| **S8** | You.com official Python SDK 3.1.1 at [`8e4ced63802d…`](https://github.com/youdotcom-oss/youdotcom-python-sdk/tree/8e4ced63802db764aca515a56016f0de80dbe2c3), especially [`sdk.py`](https://github.com/youdotcom-oss/youdotcom-python-sdk/blob/8e4ced63802db764aca515a56016f0de80dbe2c3/src/youdotcom/sdk.py), [Contents request](https://github.com/youdotcom-oss/youdotcom-python-sdk/blob/8e4ced63802db764aca515a56016f0de80dbe2c3/docs/models/contentsrequest.md), [response](https://github.com/youdotcom-oss/youdotcom-python-sdk/blob/8e4ced63802db764aca515a56016f0de80dbe2c3/docs/models/contentsresponse.md), and [MIT license](https://github.com/youdotcom-oss/youdotcom-python-sdk/blob/8e4ced63802db764aca515a56016f0de80dbe2c3/LICENSE) | Host/transport, typed fields, optionality, operation errors/retry defaults, license boundary. High for that client commit; SDK is not server truth and no code was copied. |
| **S9** | You.com, [Online MSA, December 2025](https://45321510.fs1.hubspotusercontent-na1.net/hubfs/45321510/Legal/You.com%20MSA%20%28Online%29%20%28December%202025%29.pdf) | API/customer-data, use, third-party, restrictions, rights, security/confidentiality and deletion terms. Medium-high for published standard terms; order-specific applicability/interpretation requires review. |
| **S10** | You.com, [API Acceptable Use Policy, effective 2026-05-15](https://you.com/acceptable-use-policy-may-2026) | Developer safeguards, privacy/IP/platform restrictions, prompt injection, rate limiting, significant-output storage. High for published AUP; legal scope requires counsel/contract context. |
| **S11** | You.com, [MCP Server](https://you.com/docs/build-with-agents/mcp-server.md) | Authenticated `you-contents` tool and exclusion from free profile. High; MCP transport is not the direct REST evidence contract. |
| **S12** | You.com, [Privacy Policy](https://you.com/privacy) (page dated 2024-12-10) | General collection/use/vendors/retention and sensitive-data warning. Medium; not Contents-specific and may be superseded by enterprise terms. |
| **S13** | You.com, [Data Processing Addendum](https://45321510.fs1.hubspotusercontent-na1.net/hubfs/45321510/Legal/You.com%20DPA%20Template%20%28March%202025%29.pdf) (document says updated 2025-04-28) | Processor scope, subprocessors, security, deletion, transfers, possible data categories. Medium-high as a public template; requires execution/applicability review and is not endpoint behavior. |

## Final disposition

**ADOPTED:** known-URL retrieval as a separate bounded operation; explicit
representation choice; independent per-item processing; caller-visible
freshness intent and hard budgets.  
**ADAPTED:** cache age becomes verifiable acquisition outcome; partial success
becomes cardinality-complete typed attempts; Markdown/HTML become versioned
untrusted views over immutable captures; metadata becomes evidence-bearing
claims.  
**REJECTED:** You.com as the owned content foundation; URL-only provenance;
null-as-error-contract; “raw/full/clean” as fidelity, completeness, safety, or
permission guarantees; provider cache as a citation archive; page content
granting more authority.  
**DEFERRED:** any You.com adapter benchmark, hosted rendered acquisition, or
production/sensitive use until controlled fixtures, security review, current
contract/AUP/DPA, Contents-specific retention/ZDR answers, source-rights review,
and cost reconciliation are separately authorized.
