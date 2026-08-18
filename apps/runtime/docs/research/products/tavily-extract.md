# Tavily Extract: clean-room product reverse engineering

**Research date / source access date:** 2026-08-17  
**Subject:** Tavily `POST /extract`, independently of Tavily Search, Crawl, Map,
and Research  
**Status:** research record; not implementation, procurement approval, legal
advice, or a quality benchmark  
**Overall confidence:** high for the public contract and prices; medium for the
inferred processing shape; low for undocumented fetch, cache, and safety details

## Executive verdict

**ADAPTED, not adopted wholesale.** Tavily Extract demonstrates a useful narrow
product boundary: the caller supplies one or more already-known URLs, chooses a
bounded extraction tier, and receives cleaned Markdown/text plus per-URL partial
failures. Query-focused chunk reranking is a valuable context-control option.
The endpoint is nevertheless a hosted, opaque fetch-and-transform service. It
does not return enough capture provenance to establish freshness or reproducible
citations, and its public contract does not expose cache policy, redirect chain,
fetch time, HTTP evidence, content hash, robots decision, canonical relation,
extractor version, or hostile-content controls [S1][S2].

For Curiosity:

- **ADOPT** the separation of URL discovery from extraction, batch partial
  success, explicit depth/cost, and caller-controlled focused chunks.
- **ADAPT** the output into a richer provider-neutral evidence envelope with
  hard byte/token bounds, capture identity, temporal provenance, and typed
  failure reasons.
- **REJECT** treating `raw_content` as raw, authoritative, current, safe, or a
  sufficient citation record; it is cleaned/selected vendor output.
- **DEFER** Tavily as a provider decision until permitted evaluation measures
  freshness, static/rendered behavior, hostile-page safety, and quality against
  Curiosity-owned fixtures. Do not make it the owned retrieval foundation.

## 1. Decision frame, bounded questions, and method

### 1.1 Decision and sub-questions

The decision is whether Tavily Extract's observable contract and design lessons
should influence Curiosity's extraction plane, without importing Tavily code,
depending on proprietary behavior, or widening agent authority.

Bounded questions:

1. Which request types, options, limits, outputs, and errors are publicly
   contracted for `/extract`?
2. What evidence supports static versus JavaScript-rendered fetching?
3. What can and cannot be established about caching and freshness?
4. How does the endpoint represent provenance, partial failure, and cost?
5. Which safeguards for hostile pages, privacy, and legal rights are public?
6. Which architectural conclusions are justified, and which remain speculation?
7. Which contract ideas should Curiosity adopt, adapt, reject, or defer?

**Coverage budget:** official documentation, machine-readable OpenAPI, official
SDK source, pricing, policies, and terms. No credentials, API calls (including
keyless calls), paid features, traffic interception, vulnerability probing,
access-control bypass, production interaction, or proprietary-code inspection.

**Stop rule:** stop when every requested category has direct evidence or an
explicit unknown, and further official sources repeat the same contract without
resolving a material gap.

### 1.2 Clean-room method and evidence labels

This review used only public interfaces and Tavily-published materials. The
official Python and JavaScript SDK repositories were read at commits
`de924695765d5cf28bd1975c1cfca0cd07cd7005` and
`c45065fe4546b62da86a3fac1cee2ffd816104c4`, respectively. Both repositories
identify MIT licenses; that applies to their SDK code, **not** to Tavily's hosted
service or to third-party page content [S10][S11]. No SDK code was copied.

- **FACT** — directly supported by a cited source or inspected public SDK.
- **INFERENCE** — a bounded interpretation of facts, not observed internals.
- **RECOMMENDATION** — a Curiosity design or governance choice.
- Confidence is **high**, **medium**, or **low**.

Vendor documentation proves that Tavily represents a capability as offered; it
does not prove comparative quality, completeness, reliability, or compliance.

## 2. Public contract

### 2.1 Endpoint and authentication

**FACT (high):** the REST endpoint is `POST https://api.tavily.com/extract` with
JSON. The regular contract uses a bearer API key. Tavily also documents free,
rate-limited keyless access selected by `X-Tavily-Access-Mode: keyless`; it says
successful keyed and keyless response schemas are identical [S1][S8]. This
review did not call either path.

**FACT (high):** default endpoint rate limits are 100 requests/minute for
development keys and 1,000 requests/minute for production keys. A 429 response
has a `retry-after` header in Tavily's general rate-limit documentation [S6].
Keyless limits are intentionally not quantified publicly [S8].

Optional cross-endpoint attribution headers include `X-Project-ID`,
`X-Session-Id`, and `X-Human-Id`; Tavily says it hashes human IDs before
processing or storing them [S9]. These are observability identifiers, not page
provenance.

### 2.2 Accepted body

| Field | Public type/default/bound | Semantics and caveats |
| --- | --- | --- |
| `urls` | required string or array of strings; at most 20 URLs per call | Exact URL selection is the defining boundary. Public docs do not specify allowed schemes, URL length, normalization, redirects, credentials-in-URL handling, DNS/private-address policy, or duplicate handling [S1][S2]. |
| `extract_depth` | `basic` (default) or `advanced` | Basic is faster/cheaper for straightforward pages. Advanced is slower, has a claimed higher success rate, and targets tables, embedded content, complex/dynamic and JavaScript-rendered pages [S2][S3]. |
| `format` | `markdown` (default) or `text` | Markdown preserves page structure; plain text may increase latency. Neither option returns source HTML or response bytes [S1][S2]. |
| `query` | optional string; no documented length bound | User intent used to rerank extracted chunks. Without it, `raw_content` is described as full page content; with it, `raw_content` becomes selected chunks [S1][S3]. |
| `chunks_per_source` | integer 1–5; default 3; only with `query` | Maximum relevant snippets per URL. Each chunk is at most 500 characters and chunks are joined with the literal separator `[...]` [S1][S3]. |
| `include_images` | Boolean, default false | Adds page image URLs. No image bytes or descriptions are promised [S1]. |
| `include_favicon` | Boolean, default false | Adds a favicon URL per successful result [S1]. |
| `timeout` | float 1.0–60.0 seconds | When omitted at the HTTP contract, documented defaults are 10 seconds for basic and 30 for advanced. The wording says time to wait for “the URL extraction”; batch/whole-request semantics are not precisely defined [S1]. |
| `include_usage` | Boolean, default false | Adds a credit-usage object. It may report zero before the five-success billing threshold is reached [S1][S5]. |

**Negative result (high):** Extract has no documented domain allow/deny list,
safe-search switch, locale, user agent, request headers, cookies, authentication
context, wait condition, browser action, selector, output schema, response-size
cap, or explicit cache/freshness control. Some similarly named options exist in
other Tavily products; they must not be projected onto Extract.

### 2.3 SDK/API contract drift

Public SDKs are thin transport adapters, not evidence of server internals:

- **FACT (high):** the inspected Python SDK forwards the extraction fields to
  `/extract`, accepts arbitrary extra keyword fields, and supplies empty
  `results`/`failed_results` arrays if absent. It performs no visible URL-scheme,
  private-address, or 20-item validation in the extract method [S10].
- **FACT (high):** the inspected JavaScript SDK likewise maps camelCase options
  to the REST body and maps snake_case response fields back to camelCase [S11].
- **FACT (high):** the Python source defaults `timeout` to 30 and sends it,
  although the current Python reference table says `None` and the HTTP contract
  says omitted basic requests default to 10 seconds. The JavaScript SDK uses a
  30-second client timeout but leaves the server payload timeout absent unless
  supplied [S1][S4][S10][S11].
- **FACT (high):** OpenAPI accepts a single URL string or array; the current
  JavaScript type declares an array, while an official REST/JavaScript code
  sample passes a string [S1][S11].

**INFERENCE (high):** generated references, SDK signatures, and the live server
contract can drift. Curiosity must pin provider adapter versions, validate its
own neutral contract, send explicit values, and test provider conformance rather
than relying on vendor defaults.

## 3. Fetching and extraction behavior

### 3.1 Evidence for static and rendered lanes

**FACT (high):** Tavily's tutorial states that Extract handles
JavaScript-rendered pages and removes boilerplate such as ads, navigation, and
footers. It recommends basic for static HTML blogs/articles/docs and advanced
for JavaScript-rendered single-page applications, tables, charts, embedded
content, and the highest success rate [S2]. The best-practices page similarly
describes basic as “simple text extraction” and advanced as appropriate for
dynamic/JavaScript-rendered pages and rich content [S3].

**INFERENCE (medium):** the most economical explanation is a tiered extraction
pipeline: a fast standard-page path and a more expensive path capable of browser
rendering or an equivalent dynamic-content acquisition mechanism, followed by
boilerplate removal and Markdown/text serialization. The documentation does
not prove that every advanced request launches a browser, that basic never
renders, which browser/runtime is used, or what fallback ordering applies.

**Unknown:** rendering wait conditions, script/network permissions, cookies,
geo/locale, consent-wall handling, anti-bot behavior, browser isolation,
download handling, iframe policy, redirect limit, asset fetching, and whether
advanced content is an actual rendered DOM or another source representation.

### 3.2 Full-page and intent-focused modes

**FACT (high):** without `query`, the result's `raw_content` is described as the
full extracted page. With `query`, Tavily splits/exposes short source-derived
chunks, reranks them against user intent, returns at most 1–5 per source, and
joins them in one string with `[...]` [S1][S3]. Query and
`chunks_per_source` were introduced as “Intent Based Extraction” in December
2025 [S7].

**INFERENCE (medium):** focused extraction is likely a post-fetch pipeline of
clean -> segment -> score/rerank -> truncate, because Tavily calls the units
chunks “pulled directly from the source” and returns them in the same
`raw_content` field. The ranking model, chunk overlap/boundaries, source offset
mapping, and whether normalization changes text are undisclosed.

**RECOMMENDATION (high):** Curiosity should model full-document extraction and
query-focused passage selection as separate stages and fields. A selected
passage should retain document/capture ID, exact offsets or a robust span hash,
selector version, score semantics, and selection query. Do not overload a field
named `raw_content` with both a document and a lossy reranked subset.

### 3.3 Output and limits

A successful HTTP response may contain:

| Field | Meaning | Provenance value |
| --- | --- | --- |
| `results[]` | Successful URL extractions | Supports partial batch completion. Ordering guarantee is not documented. |
| `results[].url` | URL “from which” content was extracted | Minimal source pointer; unclear whether input, canonical, or final redirect URL. |
| `results[].raw_content` | Cleaned Markdown/text, or query-ranked chunks | Evidence payload, but no byte/token maximum for full-page mode. |
| `results[].images[]` | Image URL strings, when requested | Links only; no source element, alt text, dimensions, hash, safety status, or fetch proof. |
| `results[].favicon` | Favicon URL, when requested | Display metadata only. |
| `failed_results[]` | `{url,error}` for per-URL failures | Good batch isolation, but error taxonomy is free text. |
| `response_time` | Request duration in seconds | Operational timing, not fetch time. |
| `usage.credits` | Optional metered use | Can be zero while successes accrue toward a five-URL threshold. |
| `request_id` | Provider support identifier | Useful correlation key; not a stable document/capture ID. |

**FACT (high):** batch size is capped at 20; focused output is bounded to five
chunks of at most 500 characters per URL; timeout is at most 60 seconds [S1][S2].

**Negative result (high):** no public maximum was found for full-page
`raw_content`, total response bytes, number of images, URL length, query length,
redirects, fetched bytes, decompressed bytes, DOM size, or server processing
work. The API also exposes no truncation flag. Client-side bounded consumption
is therefore mandatory.

## 4. Caching and freshness

**FACT (high):** the Extract body has no `use_cache`, cache bypass, TTL,
`fetched_at`, source `ETag`, `Last-Modified`, HTTP status, cache age/status, or
page version field [S1][S4]. Tavily markets web access as real-time, but the
Extract reference makes no per-call freshness guarantee [S1][S12].

**Unknown (material):** whether Tavily caches URL responses, rendered DOMs,
cleaned documents, image lists, or reranked chunks; cache keys and TTLs; whether
query-focused calls reuse a capture; whether failures are negatively cached;
how redirects/canonical URLs affect cache identity; and whether customers share
cache entries.

**INFERENCE (high):** consumers cannot establish from the response when page
bytes were acquired, whether two calls used the same capture, or whether the
content corresponds to the page version visible at citation time. “Real-time”
is not an evidence field.

**RECOMMENDATION (high):** Curiosity must not assign its own request timestamp
as source fetch time. If Tavily is evaluated, represent fetch time and cache
status as `unknown` unless Tavily contractually supplies them. For reproducible
evidence, Curiosity needs its own policy-permitted capture/version layer or a
provider that returns equivalent immutable provenance.

## 5. Errors, hostile pages, and bounded behavior

### 5.1 Contracted failures

**FACT (high):** one 200 response can contain both `results` and
`failed_results`, so one bad URL need not fail the batch [S1][S2]. Endpoint-level
documented statuses are:

- `400` invalid request, including more than 20 URLs;
- `401` missing/invalid API key;
- `429` excessive requests;
- `432` API-key or plan limit exceeded;
- `433` pay-as-you-go limit exceeded; and
- `500` provider internal error [S1].

General Tavily rate-limit guidance says to respect `retry-after` on 429 [S6].
The official endpoint schema gives each failed URL only a free-text `error`;
there is no stable error code, retryability flag, failure stage, upstream status,
or partial/truncation indicator [S1].

**Unknown:** exact errors for DNS, TLS, redirect loops, unsupported media,
robots exclusion, login/paywall, anti-bot challenge, malformed markup,
oversize/decompression bomb, malware, timeout, and JavaScript failure. It is
also unclear whether timeout is applied independently to URLs in a batch.

**RECOMMENDATION (high):** normalize free-text failures behind Curiosity-owned
categories (`invalid_input`, `policy_denied`, `network`, `timeout`,
`unsupported_media`, `upstream_denied`, `too_large`, `provider_limit`,
`provider_internal`, `unknown`) while preserving a redacted provider reason and
request ID. Retry only explicitly retryable classes with budgeted backoff and
jitter; split batches to isolate repeated partial failures.

### 5.2 Hostile and unsafe pages

**FACT (high):** Tavily advises clients to validate extracted quality and handle
errors [S3]. Its AUP says output is derived from publicly available content,
may be inaccurate, unreliable, inappropriate, potentially infringing, or
incomplete, and must be independently vetted [S13]. Extract has no documented
`safe_search` option or returned safety labels [S1].

**Negative result (high):** no endpoint-specific public guarantee was found for
prompt-injection neutralization, malware scanning, active-content removal,
Unicode normalization, adult-content filtering, secret/PII detection, download
blocking, image-URL safety, link rewriting, or HTML/Markdown sanitization.
Boilerplate removal is not a security boundary.

**RECOMMENDATION (high):** treat all text and returned URLs as untrusted external
data. The extraction adapter must:

1. accept only Curiosity-approved public `http`/`https` URLs after local
   normalization and policy checks; reject credentials, private/link-local/
   loopback destinations, and signed/sensitive URLs before disclosure;
2. enforce request, response, per-result, image-count, and downstream token
   limits independently of the provider;
3. never render returned Markdown as trusted HTML and never auto-fetch image or
   favicon URLs in a privileged network context;
4. label content as untrusted and prevent page text from changing policy,
   requesting secrets, authorizing tools, or initiating actions; and
5. preserve retrieval-only authority: extraction output cannot itself trigger
   a follow-up fetch or action.

These controls protect Curiosity and its users; they do not claim to describe
Tavily's undisclosed server controls.

## 6. Provenance and reproducibility

**FACT (high):** Tavily returns the source URL, transformed content, optional
media URLs, response duration, usage, and a request ID [S1]. Paid-plan Logs can
later expose timestamp, endpoint, depth, response time, credits, masked API key,
and request ID, but Tavily explicitly says Logs never include request input or
output [S14].

**INFERENCE (high):** the support request ID is useful operational provenance,
but the Extract response is not a capture manifest. It cannot independently
answer “which bytes, fetched when, through which redirects, under which policy,
and transformed by which extractor produced this passage?”

Missing provenance fields:

- submitted URL, redirect-terminal URL, declared canonical URL, and redirect
  chain as distinct values;
- source fetch/observation time and page-declared publication/update time;
- HTTP status, selected response headers, media type/charset, raw/content hashes,
  and truncation/size evidence;
- static versus rendered acquisition, render reason, and render configuration;
- robots/site-policy decision and legal/policy scope;
- extractor and reranker versions, chunk boundaries/scores, and passage anchors;
- document/capture/version IDs and duplicate/cluster relation.

**RECOMMENDATION (high):** a provider-neutral Curiosity envelope should retain
Tavily's request ID only as `provider_trace_id`; it must not invent unavailable
fields. Evidence status should explicitly distinguish `provider_transformed`
from a Curiosity-owned capture.

## 7. Safety, privacy, and legal boundaries

### 7.1 Data sent to Tavily

**FACT (high):** under Tavily's Platform Terms, customer input broadly includes
text, materials, data, and queries submitted to the service. Tavily receives at
least the requested URLs, optional intent query, API/account metadata, and any
tracking headers the client sends [S9][S15].

**FACT (high):** Tavily's Privacy Policy says it collects query data and uploaded
documents to retrieve Internet content, may use portions to improve responses
unless a contract says otherwise, and may share query data with third-party
search-index providers where its own index cannot retrieve content. Its general
retention rule is purpose/account/valid-deletion-request based rather than a
short fixed Extract TTL [S16]. The policy does not clearly isolate Extract URL
handling from other “query data.”

**FACT (high):** the Platform Terms grant broad rights to process customer input
to provide, support, monitor, analyze, and improve services and permit affiliate,
vendor, and relevant third-party processing. The terms prohibit submitting
enumerated sensitive data; the AUP additionally forbids credentials, API keys,
tokens, private keys, and other sensitive data without prior written consent
[S13][S15].

**RECOMMENDATION (high):** do not send private/intranet URLs, presigned URLs,
tokens in URLs, customer secrets, regulated/sensitive data, or personally
identifying intent text. Use opaque project/session identifiers; omit
`X-Human-Id` unless approved. Procurement must review the current order form,
DPA/subprocessors, data residency, retention/deletion, improvement/training use,
incident terms, and enterprise controls rather than infer them from API docs.

### 7.2 Publisher rights, robots, and output use

**FACT (high):** Tavily's AUP says outputs derive from publicly available
content but disclaims guarantees of legality and non-infringement, putting
verification and lawful use on the customer [S13]. Platform Terms likewise make
the customer responsible for lawful input/output use and third-party terms
[S15]. Public availability is not a copyright license.

**Negative result (high):** no public Extract documentation located here states
how robots.txt, publisher terms, `noindex`/`noarchive`, paywalls, takedowns,
copyright notices, or opt-outs affect a requested URL. No returned field records
such a decision.

**FACT (high):** Tavily's terms prohibit reverse engineering the hosted service
and using it to build a competing service [S15]. This dossier therefore limits
itself to public contracts, openly licensed SDK transport code, and bounded
design inference; it does not attempt to discover proprietary algorithms.

**RECOMMENDATION (high):** Curiosity needs its own source-eligibility,
robots/publisher-policy, retention, deletion, and quotation rules. Do not infer
permission from a successful extraction. Preserve source attribution and link;
retain only what the approved use permits; seek counsel for jurisdiction- and
corpus-specific decisions.

## 8. Pricing and operational economics

### 8.1 Metering

**FACT (high):** basic extraction costs one API credit per five successful URL
extractions; advanced costs two. Failed URL extractions are not charged [S5].
Because `include_usage` may show zero until five successful extractions have
accumulated, accounting is thresholded rather than necessarily rounded up on
each small request [S1][S5]. Exact attribution of a threshold-crossing credit to
individual calls is not documented.

**FACT (high):** public plans on 2026-08-17 were:

| Plan | Credits/month | Price | Nominal price/credit |
| --- | ---: | ---: | ---: |
| Researcher | 1,000 | free | — |
| Project | 4,000 | $30 | $0.0075 |
| Bootstrap | 15,000 | $100 | $0.0067 |
| Startup | 38,000 | $220 | $0.0058 |
| Growth | 100,000 | $500 | $0.0050 |
| Pay as you go | usage | — | $0.0080 |
| Enterprise | custom | custom | custom |

Source: Tavily Credits & Pricing [S5]. The interactive marketing pricing page
did not render every slider value reliably in text, so the documentation page
is the pricing authority used here [S12]. Prices can change.

At full five-success increments, the nominal metered cost is:

- basic: 0.2 credit/success, or about $0.0010–$0.0016 at listed paid rates;
- advanced: 0.4 credit/success, or about $0.0020–$0.0032.

These are API charges only. They exclude failed-attempt latency, application
compute/storage, retries, evaluation, compliance, and the value of unused plan
credits.

### 8.2 Operational implications

**INFERENCE (high):** charging only successful extractions and returning partial
failures aligns cost with usable URL outcomes. The 5-success unit, however,
means request-local `usage` is not a complete cost ledger for low-volume calls.

**RECOMMENDATION (high):** record URL attempts, success count, depth, provider
request ID, reported usage, and account-level reconciliation separately. Put
budgets on requested URLs and advanced escalations, not merely HTTP calls.
Start basic; escalate a URL to advanced only after a typed static-quality failure
and within an explicit render budget.

## 9. Architecture clues and what they do not prove

### 9.1 Bounded architecture inference

The observable contract is consistent with:

```text
validated batch (<=20 URLs)
  -> per-URL acquisition lane (basic | advanced)
  -> main-content / structure extraction
  -> Markdown or text serialization
  -> optional image/favicon URL collection
  -> optional segment + intent rerank + top-k truncation
  -> successes + per-URL failures
  -> thresholded successful-URL metering
```

Supporting clues are the depth-dependent success/latency/content claims,
JavaScript-page guidance, query-reranked chunks, independent failures, and
success-only pricing [S1][S2][S3][S5].

**INFERENCE (medium):** per-URL work is likely independently schedulable, because
the batch can report mixed success. This does not prove concurrency, queueing,
worker topology, or isolation.

**INFERENCE (medium):** extraction and relevance selection are separable
components, because `query` changes a full-content field into selected chunks
without changing URL acquisition inputs. It does not identify the segmentation
or ranking technology.

**Unknown:** hosting/cloud, browser engine, parser libraries, model providers,
proxies, geographic fetch location, index/cache use, retry policy, deduplication,
anti-bot providers, queue design, storage duration, and cross-tenant isolation.
No claim about these is warranted.

### 9.2 Clean-room lessons for Curiosity

| Lesson | Verdict | Curiosity treatment |
| --- | --- | --- |
| Known-URL extraction is a separate primitive from discovery | **ADOPTED** | Keep `discover`, `fetch/capture`, `extract`, and `select passages` as distinct contracts. |
| Batch with per-URL successes/failures | **ADOPTED** | Preserve input identity and typed independent outcomes; do not fail all results for one URL. |
| Cheap static/default lane; richer escalation lane | **ADAPTED** | Static HTTP first; sandboxed render only on policy-permitted quality failure, with an escalation reason and separate budget. |
| Markdown/text output | **ADAPTED** | Useful presentation views, but retain capture/DOM-to-text evidence and never call transformed text raw. |
| Intent query + bounded chunks | **ADAPTED** | Separate passage-selection object with offsets/hash, query, score/version, and strict total context limits. |
| Images as URL strings | **REJECTED** as evidence | Do not auto-fetch; require separate media provenance/safety handling if ever enabled. |
| Request ID and source URL as provenance | **REJECTED** as sufficient | Add capture/version/time/hash/redirect/policy/extractor fields; mark unavailable provider facts unknown. |
| Opaque hosted endpoint as owned retrieval core | **REJECTED** | May be an adapter/evaluation comparator only; it cannot meet owned, reproducible chain-of-custody goals. |
| Provider rendering in production | **DEFERRED** | Evaluate with owned fixtures and legal/security review; no default escalation until gates pass. |

## 10. Curiosity contract implications

Minimum provider-neutral request shape:

```text
urls[]                 hard bounded, normalized, policy-approved public URLs
output_view            markdown | text
acquisition_tier       static | rendered_allowed
selection              none | {query, max_passages, max_chars_total}
include_media_refs     false by default
deadline_ms            explicit end-to-end deadline
budget                 max_urls, max_rendered_urls, max_response_bytes
```

Minimum response semantics (conceptual, not an implementation prescription):

```text
attempts[]:
  input_url
  status                success | partial | failure
  failure               {category, retryable, redacted_reason}?
  provider_trace_id?
  source:
    fetched_url?
    terminal_url?
    declared_canonical_url?
    observed_at?         unknown must remain unknown
  acquisition:
    mode                 static | rendered | provider_unknown
    truncation
    bytes_received?
  document:
    content_view
    content_hash?
    capture_id?
    extractor_version?
  passages[]:
    text
    source_anchor?
    selector_query?
    selector_version?
  policy:
    untrusted_external_data = true
    retrieval_only = true
coverage:
  attempted, succeeded, failed, rendered, truncated
usage:
  provider_reported, locally_estimated
```

**RECOMMENDATION (high):** the adapter must distinguish “provider omitted” from
false/empty. A Tavily result can populate `input_url`, transformed content,
provider trace ID, and perhaps a provider-returned URL; it cannot truthfully
populate capture time, raw hash, redirect chain, or policy evidence.

### Evaluation gates before any adoption

Use only organization-owned, public-domain, or explicitly permitted fixtures.
No hostile third-party probing.

1. **Contract:** single/batch, 20-item rejection, focused bounds, partial
   failures, timeout behavior, and SDK/version conformance.
2. **Acquisition:** static page, deterministic client-rendered fixture, table,
   iframe/embed, redirect, malformed page, and declared canonical.
3. **Freshness:** controlled page revisions measured over time; do not infer
   cache policy from one call.
4. **Safety:** owned prompt-injection text, oversized/decompression fixtures,
   unsafe links/media references, and private-address rejection by Curiosity
   before provider disclosure.
5. **Quality:** content coverage, boilerplate ratio, table fidelity, link
   preservation, passage faithfulness/anchorability, and deterministic drift.
6. **Operations/cost:** latency distributions by tier/batch, failure taxonomy,
   retry amplification, success-only credit reconciliation, and bounded output.
7. **Governance:** current terms, DPA/subprocessors, retention/improvement use,
   publisher-policy behavior, security evidence, and exit strategy.

## 11. Fact / inference / recommendation ledger

| ID | Type | Claim | Confidence | Evidence / disposition |
| --- | --- | --- | --- | --- |
| F1 | FACT | `/extract` accepts a URL string or up to 20 URLs plus depth, format, query/chunk, image/favicon, timeout, and usage options. | High | [S1][S2][S4]; **ADAPTED** contract ideas. |
| F2 | FACT | Basic and advanced cost 1 and 2 credits per five successful URL extractions; failures are uncharged. | High | [S5]; **ADAPTED** metering model. |
| F3 | FACT | Advanced is documented for complex/dynamic/JS-rendered pages, tables, and embedded content, with higher latency/success. | High | [S2][S3]; capability claim, not benchmark. |
| F4 | FACT | Query-focused mode returns 1–5 reranked, source-derived chunks, each at most 500 characters. | High | [S1][S3][S7]; **ADAPTED**. |
| F5 | FACT | 200 responses isolate per-URL failures; endpoint errors include 400/401/429/432/433/500. | High | [S1][S2]; **ADOPTED/ADAPTED**. |
| F6 | FACT | Full-page response size and cache/freshness controls are not documented. | High | Negative review of [S1]–[S4]; risk remains. |
| F7 | FACT | Returned provenance is URL + request-level metadata, without capture/version evidence. | High | [S1][S14]; **REJECTED** as sufficient provenance. |
| F8 | FACT | Tavily policies place lawful, safe, non-infringing output use and sensitive-input control on the customer. | High | [S13][S15][S16]; governance requirement. |
| F9 | FACT | Current Python timeout defaults conflict between SDK source and reference/HTTP omitted behavior. | High | [S1][S4][S10]; provider-contract drift check. |
| I1 | INFERENCE | Basic/advanced represent tiered acquisition/extraction lanes, with advanced capable of rendering or equivalent dynamic acquisition. | Medium | F3; implementation mechanism unknown. |
| I2 | INFERENCE | Intent selection occurs after enough page content is acquired to segment/rerank. | Medium | F4; ranking internals unknown. |
| I3 | INFERENCE | A Tavily response cannot support reproducible, time-specific citation by itself. | High | F6–F7. |
| I4 | INFERENCE | Thresholded usage requires account-level reconciliation, not only request-local cost accounting. | High | F2 and zero-before-five note [S1][S5]. |
| R1 | RECOMMENDATION | Keep discovery, capture, extraction, and passage selection separate. | High | **ADOPTED** for Curiosity architecture. |
| R2 | RECOMMENDATION | Use static-first, typed quality failure, and quota-bound sandboxed render escalation. | High | **ADAPTED**; rendering itself deferred. |
| R3 | RECOMMENDATION | Treat content/URLs as untrusted and enforce Curiosity-owned URL, byte, token, action, and egress boundaries. | High | **ADOPTED** safety boundary. |
| R4 | RECOMMENDATION | Never fabricate missing fetch/cache/provenance fields; mark them unknown. | High | **ADOPTED** evidence rule. |
| R5 | RECOMMENDATION | Do not select Tavily as the owned foundation; evaluate only as a bounded adapter/comparator after governance gates. | High | **REJECTED** foundation; **DEFERRED** provider use. |

## 12. Unknowns and negative results retained

Material unknowns after the bounded review:

1. cache presence, TTL, key, bypass, revalidation, and cross-tenant reuse;
2. actual fetch time and static/render fallback sequence;
3. browser/runtime, network isolation, geo, cookies, waits, and script policy;
4. supported URL schemes, redirects, DNS/private-IP/SSRF controls, robots and
   publisher opt-out behavior;
5. raw/decompressed/DOM/output/image limits and truncation semantics;
6. unsupported media, paywall, anti-bot, malformed, malware, and timeout error
   taxonomy;
7. extraction, chunking, and reranking algorithms/versions and passage anchors;
8. data residency and Extract-specific input/output retention and improvement
   use under a prospective order form;
9. ordering/deduplication guarantees for input and result URLs; and
10. comparative quality, latency, reliability, and freshness.

Absence from public documentation is recorded as **unknown**, not evidence that
a safeguard or behavior is absent from Tavily's service.

## 13. Bounded curiosity pass

After synthesis, unresolved in-frame threads were scored 1–5 for relevance (R),
decision value (V), novelty (N), and investigation cost (C); priority is
`R + V + N - C`.

| Thread | R | V | N | C | Score | Action/result |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| SDK/API timeout and input-shape drift | 5 | 4 | 4 | 1 | 12 | **Pursued.** Official SDK source confirmed material timeout and URL-type discrepancies; added conformance lesson. |
| Cache/freshness guarantee | 5 | 5 | 4 | 2 | 12 | **Pursued.** Official API, best practices, tutorial, SDK references, and changelog yielded no Extract cache control or fetch timestamp. Negative result retained. |
| Extract-specific robots/hostile-page controls | 5 | 5 | 4 | 3 | 11 | **Pursued.** Official docs/policies set customer duties but expose no endpoint evidence; unknown retained. |
| Empirical keyless calls against third-party pages | 4 | 4 | 3 | 4 | 7 | **CURIOSITY_NO_GO.** Caller prohibited calls/bypass; one-off observations would not establish cache or quality. |
| Probe private/local URLs or anti-bot targets | 4 | 5 | 3 | 5 | 7 | **CURIOSITY_NO_GO.** Security/legal boundary; no authorization and no need to test Tavily infrastructure. |
| Infer proprietary parser/browser/model vendors | 2 | 2 | 3 | 5 | 2 | **CURIOSITY_NO_GO.** Speculative, terms-sensitive, and unnecessary for the contract decision. |
| Review community anecdotes/issues for quality | 3 | 2 | 2 | 3 | 4 | **CURIOSITY_NO_GO.** Low decision value without reproducible permitted fixtures; primary-source contract already saturated. |

**Stop condition reached:** coverage and saturation. Every requested category has
primary evidence or an explicit unknown; remaining high-value questions require
contractual disclosure or separately authorized fixture evaluation, not more
document search. No autonomous follow-up is authorized by this report.

## 14. Checks performed

- Read repository `AGENTS.md` before research; kept provider-neutral and
  untrusted-data boundaries explicit.
- Used primary Tavily sources accessed 2026-08-17; search snippets were leads,
  not evidence.
- Inspected only public, MIT-identified SDK transport code at recorded commits;
  no code copied and no proprietary implementation inspected.
- Made no Tavily API/keyless/paid calls, supplied no credentials, and performed
  no bypass, probing, deployment, or production mutation.
- Distinguished Tavily Extract from Search, Crawl, Map, and Research; other
  endpoints appear only where needed to avoid importing their capabilities or
  to explain shared account/rate/log policy.
- Retained negative findings and marked architecture claims as inference.
- File-scope check: this research task writes only
  `docs/research/products/tavily-extract.md`.

## Sources

All web sources below were accessed **2026-08-17**.

- **[S1]** Tavily, “Tavily Extract” API reference and embedded OpenAPI:
  https://docs.tavily.com/documentation/api-reference/endpoint/extract
- **[S2]** Tavily, “Clean Content Extraction” tutorial:
  https://docs.tavily.com/examples/quick-tutorials/extract-api
- **[S3]** Tavily, “Best Practices for Extract”:
  https://docs.tavily.com/documentation/best-practices/best-practices-extract
- **[S4]** Tavily, Python SDK reference, Extract section:
  https://docs.tavily.com/sdk/python/reference
- **[S5]** Tavily, “Credits & Pricing”:
  https://docs.tavily.com/documentation/api-credits
- **[S6]** Tavily, “Rate Limits”:
  https://docs.tavily.com/documentation/rate-limits
- **[S7]** Tavily, Changelog (Extract timeout, Markdown, intent extraction,
  usage, and favicon entries): https://docs.tavily.com/changelog
- **[S8]** Tavily, “Try Tavily Without an API Key”:
  https://docs.tavily.com/documentation/keyless
- **[S9]** Tavily, API Introduction (authentication and tracking headers):
  https://docs.tavily.com/documentation/api-reference/introduction
- **[S10]** Tavily, official Python SDK repository, commit
  `de924695765d5cf28bd1975c1cfca0cd07cd7005`, especially
  `tavily/tavily.py` and `tavily/async_tavily.py`:
  https://github.com/tavily-ai/tavily-python/tree/de924695765d5cf28bd1975c1cfca0cd07cd7005
- **[S11]** Tavily, official JavaScript SDK repository, commit
  `c45065fe4546b62da86a3fac1cee2ffd816104c4`, especially `src/extract.ts`,
  `src/types.ts`, and `src/utils.ts`:
  https://github.com/tavily-ai/tavily-js/tree/c45065fe4546b62da86a3fac1cee2ffd816104c4
- **[S12]** Tavily, product/pricing pages (marketing context only):
  https://www.tavily.com/product and https://www.tavily.com/pricing
- **[S13]** Tavily, Acceptable Use Policy, updated 2026-05-05:
  https://www.tavily.com/acceptable-use-policy
- **[S14]** Tavily, Logs API reference:
  https://docs.tavily.com/documentation/api-reference/endpoint/logs
- **[S15]** Tavily, Platform Terms of Service, updated 2026-05-04:
  https://www.tavily.com/terms
- **[S16]** Tavily, Privacy Policy, updated 2025-11-24:
  https://www.tavily.com/privacy
