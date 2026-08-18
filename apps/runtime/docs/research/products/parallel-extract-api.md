# Parallel Extract API: clean-room product reverse engineering

**Research date / primary-source access date:** 2026-08-17
**Scope:** Parallel Web Systems `POST /v1/extract` only. Search, Task, the free
Search MCP wrapper, and legacy `/v1beta/extract` appear only where needed to
bound or explain the GA Extract contract.
**Status:** research record, not implementation, legal advice, procurement
approval, or an independent quality/security benchmark.
**Overall confidence:** high for the declared GA wire contract; medium for
fetch/extraction architecture; low for undocumented network safety, retention,
and runtime conformance.

## Executive verdict

**ADAPT, do not treat as an owned evidence plane.** Parallel Extract is a useful
narrow synchronous primitive: the caller supplies up to 20 known public URLs,
optionally describes an information objective, and receives relevance-focused
Markdown excerpts plus optional prefix-truncated full Markdown. Results and
per-URL errors can coexist, and callers can request an age-triggered live fetch
with optional refusal of stale-cache fallback [S1–S4].

Its strongest transferable ideas are separation from discovery, batch partial
success, objective-conditioned context compression, separate excerpt/full-view
budgets, and an explicit stale-fallback policy. Its response is nevertheless a
transformed provider view, not a capture manifest. It exposes no fetch or cache
timestamp, cache outcome, content hash, redirect chain, terminal/canonical URL,
HTTP response evidence, acquisition mode, parser/render version, excerpt
anchor, robots decision, or truncation flag [S1]. Even strict freshness input
cannot be verified from the output.

For Curiosity:

- **ADOPT** the known-URL product boundary, cardinality-aware partial outcomes,
  explicit freshness/fallback request, and distinct focused/full views.
- **ADAPT** Parallel's request into a provider-neutral contract with hard URL,
  byte, token, render, deadline, and cost bounds; explicit capture identity and
  freshness outcome; typed errors; and capture-anchored passages.
- **REJECT** URL plus clean Markdown as sufficient provenance, `publish_date`
  as fetch time, a successful extraction as permission, or “LLM-optimized” as a
  safety property.
- **DEFER** any Parallel adapter selection until contract, security, retention,
  legal, freshness, and extraction behavior can be evaluated on authorized
  project-owned fixtures. Do not use hosted outputs to seed an owned corpus.

## 1. Decision frame, bounded questions, and method

The decision is: **which observable Extract API ideas should influence
Curiosity's extraction plane without copying proprietary implementation,
granting ambient network authority, or weakening evidence provenance?**

Bounded sub-questions:

1. What request, response, limit, warning, error, and billing contract is public?
2. What is claimed about static fetch, JavaScript rendering, PDFs, extraction,
   focused excerpts, and full content?
3. What can a caller prove about cache use, live fetch, freshness, and fallback?
4. Which capture and derivation provenance is present or absent?
5. What public controls address hostile content, SSRF, rendering, and bounded work?
6. What privacy, retention, publisher-rights, and customer-term constraints apply?
7. What architecture is consistent with the contract without claiming hidden
   implementation?
8. Which lessons are adopted, adapted, rejected, or deferred for Curiosity?

**Coverage budget:** current first-party documentation and OpenAPI, official
product/crawler disclosures, pricing, FAQ, privacy policy, Customer Terms, and a
commit-pinned official generated SDK solely to check the declared transport
shape. No API key, account, API/MCP call, paid request, endpoint probing, traffic
inspection, bypass, package execution, proprietary code inspection, or third-
party target testing was used.

**Stop rule:** stop when each requested category has current primary evidence or
an explicit unknown and further public sources repeat the same contract, or the
remaining answer requires provider disclosure, credentials, unsafe probing, or
legal advice.

Labels:

- **FACT** — directly stated by a cited primary source.
- **INFERENCE** — bounded interpretation of public behavior, not a claim about
  undisclosed internals.
- **RECOMMENDATION** — a Curiosity design/governance conclusion.
- **UNKNOWN / NEGATIVE RESULT** — not established in reviewed public sources;
  absence of documentation is not proof a provider control is absent.

## 2. Product and authority boundary

**FACT (high):** `POST https://api.parallel.ai/v1/extract` is an API-key-
authenticated, synchronous known-URL operation. It does not discover or rank new
root pages: `urls` is required, and the output concerns those requested URLs
[S1][S2]. Parallel positions Search as source discovery and Extract as deeper
reading/compression after a source is selected [S3][S8].

**FACT (high):** Parallel says Extract is for public URLs. Its FAQ says core
Parallel retrieval accesses public web content reachable without authentication
[S2][S10]. The November 2025 launch article says Extract can return news content
“without ... paywalls,” but the public-web/no-auth statement is the safer
contract interpretation; no right or mechanism to bypass access controls is
documented [S8][S10].

**RECOMMENDATION (high):** model Extract as `retrieve_known_urls`, not search,
crawl, or research synthesis. The authority is exactly the caller-admitted root
set. Returned links, page instructions, and session context must not authorize
child fetches, tools, credentials, or side effects.

## 3. GA request contract

### 3.1 Endpoint, authentication, and schema strictness

**FACT (high):** the endpoint consumes JSON and authenticates with `x-api-key`.
The GA OpenAPI request sets `additionalProperties:false` at the top level and on
`advanced_settings` and `excerpt_settings` [S1]. `fetch_policy` and
`full_content` do not themselves declare `additionalProperties:false`; this is
schema permissiveness, not evidence the runtime accepts unknown fields.

The OpenAPI version is `0.1.2`, but the response carries no schema/API version
[S1]. Parallel released Extract in beta in November 2025 and announced GA
upgrades in April 2026 [S8][S9]. The beta-to-GA migration increased the URL cap,
made excerpts mandatory, nested advanced settings, and added `client_model` and
`session_id` [S4].

### 3.2 Inputs and declared bounds

| Field | Declared contract | Material qualification |
| --- | --- | --- |
| `urls` | Required `string[]`; documentation says up to 20 [S1–S4] | OpenAPI has no `maxItems`, `minItems`, URI format, item length, scheme, or uniqueness constraint. Empty-array and duplicate behavior are undocumented. |
| `objective` | Optional string; guide says max 5,000 characters [S1][S3][S4] | OpenAPI does not encode the maximum. It conditions relevance selection and therefore affects evidence returned. |
| `search_queries` | Optional `string[]`; guide says at most 5, each at most 200 characters, with 2–3 recommended [S1][S3] | OpenAPI encodes none of these array/string bounds. Unlike Search, queries are not required. |
| `max_chars_total` | Optional integer, total upper bound across **excerpts** from all results [S1][S3] | No documented numeric min/max or counting unit. It does not bound full content or the total HTTP response. Allocation across URLs is unspecified. |
| `session_id` | Optional string, OpenAPI maximum 1,000; echoed or server-generated [S1][S3] | Shared across related Search/Extract calls and may improve subsequent context. Lifetime, isolation, storage, deletion, and exact effect are unspecified. |
| `client_model` | Optional string naming the producing/consuming model [S1][S3] | Parallel may tailor optimizations/defaults. Accepted names, fallback, and reproducibility semantics are not documented. |
| `advanced_settings.fetch_policy` | Optional object controlling index/cache versus live retrieval [S1][S5] | Input policy; response does not report which path occurred. |
| `advanced_settings.excerpt_settings.max_chars_per_result` | Optional per-URL excerpt character ceiling [S1][S5] | Excerpts may be shorter for relevance/token efficiency; no min/max/counting unit. |
| `advanced_settings.full_content` | `false` by default; `true`, `false`, or `{max_chars_per_result}` [S1][S5] | When enabled it is returned in addition to mandatory excerpts. No documented maximum when uncapped. |

**FACT (high):** V1 excerpts cannot be disabled [S4]. Both top-level and nested
character controls limit excerpts, while only the nested full-content limit
affects `full_content` [S1][S5].

**NEGATIVE RESULT (high):** Extract has no documented source/domain allowlist or
denylist, geographic fetch location, locale, caller-supplied headers, cookies,
authentication context, user-agent choice, render switch, browser wait/action,
CSS selector, media include switch, output schema, hard response-byte bound, or
idempotency key [S1–S5]. Source Policy exists for Search and Task, not Extract
[S10]. Capabilities from those other products must not be projected here.

### 3.3 Documentation and schema contradictions

1. **Default fetch policy.** The OpenAPI says omitted `fetch_policy` uses a
   dynamic policy based on objective and URL [S1]. The dedicated advanced guide
   says defaults return cached index content, then separately says unspecified
   `max_age_seconds` uses a dynamic policy [S5]. **Working interpretation:** the
   default is opaque/provider-dynamic and cache-preferring; never promise a
   guaranteed cache hit or live fetch.
2. **No-objective behavior.** Best practices says no objective/query returns
   whole-page Markdown, boilerplate included, while V1 still disables
   `full_content` by default and always places output in `excerpts` [S3][S4]. A
   setup prompt elsewhere says omitting the target produces a “full-page dump”
   [S18]. **Working interpretation:** unfocused excerpts may approximate a broad
   page view, but only explicitly enabled `full_content` has the declared
   full-content field semantics.
3. **Latency.** API pricing docs summarize Extract at 1–20 seconds; the marketing
   matrix says under 3 seconds, and its detail says 1–3 seconds cached versus
   60–90 seconds live; the advanced guide says live fetch may take up to a minute
   with a typical dynamic timeout of 15–60 seconds [S5–S7]. **Working
   interpretation:** no hard end-to-end latency SLA is public.
4. **“Any URL” versus public URL.** Marketing prose says “any public URL”; the
   OpenAPI accepts arbitrary strings and documents no scheme/address policy
   [S1–S3]. **Working interpretation:** caller-side URL admission is mandatory.

## 4. Response schema and partial outcomes

### 4.1 Envelope and successful results

**FACT (high):** a 200 response requires `extract_id`, `results[]`, `errors[]`,
and `session_id`; `warnings` and `usage` are optional/nullable [S1]. A successful
result requires:

- `url: string`;
- `excerpts: string[]` in Markdown;
- optional/nullable `title`, `publish_date` (`YYYY-MM-DD`), and `full_content`
  [S1][S2].

Markdown can contain headings, lists, and links. The official sample includes
both absolute and relative link destinations, so returned links are not
necessarily self-contained absolute URLs [S2]. Plain text requires downstream
format stripping; source HTML/bytes are not returned.

**FACT (high):** full content starts at the beginning of the page and is
truncated at the requested per-result limit. Excerpts are relevance-focused and
may be shorter than their limits [S1][S5]. No truncation Boolean or original
length accompanies either view.

### 4.2 Per-URL errors and coverage

**FACT (high):** `results` are successful URLs; `errors` are requested URLs not
in results. Each `ExtractError` has `url`, free-form `error_type`, nullable
`http_status_code`, and nullable `content` returned for HTTP client/server errors
[S1]. Thus one HTTP 200 can represent mixed URL success and failure.

**INFERENCE (high):** the result/error split suggests a partition of requested
URL attempts, but the public contract does not guarantee ordering, one outcome
per input position, duplicate preservation, or URL identity after redirects.
There is no caller item ID. A URL string is therefore an unsafe join key for
duplicate requests or normalization-sensitive workflows.

**RECOMMENDATION (high):** Curiosity should assign an immutable request-item ID
before provider submission and require one normalized terminal outcome per item.
Preserve provider `extract_id`, error type, status, and a bounded/redacted error
reason. Treat `error.content` as hostile upstream data; never render it as trusted
HTML or expose unbounded origin bodies in logs/UI.

### 4.3 Warnings and usage

Warnings contain `type`, human message, and optional arbitrary detail. Types are
currently `spec_validation_warning`, `input_validation_warning`, or `warning`,
and Parallel explicitly reserves adding types as backward-compatible [S1]. The
guide says broad/redundant full-content requests may warn rather than fail [S3][S5].

Usage is a list of `{name,count}` SKU entries. The sample reports
`sku_extract_excerpts`; the schema does not enumerate names [S1][S2]. Consumers
must preserve unknown SKUs instead of hard-coding one billing shape.

### 4.4 Missing output bounds

**NEGATIVE RESULT (high):** no public maximum was found for uncapped excerpt
defaults, uncapped full content, total response bytes, per-excerpt count/size,
number of Markdown links, PDF pages, origin bytes, decompressed bytes, render DOM,
redirects, or aggregate work across 20 URLs [S1–S5]. There is no output
`truncated`, `partial`, byte count, or original-length field.

**RECOMMENDATION (high):** independently cap provider request time, streamed/body
bytes, JSON depth, per-item characters, aggregate tokens, links, and storage.
Abort bounded consumption even if provider processing continues; an application
deadline is not the same as provider cancellation.

## 5. Fetching, rendering, and extraction behavior

### 5.1 Declared capabilities

**FACT (high as a vendor capability claim):** Parallel says Extract handles
JavaScript-heavy/client-rendered pages and PDFs automatically and converts them
to clean, LLM-optimized Markdown [S2][S3]. The launch article additionally
claims challenging JavaScript sites and complex multi-page PDFs with images,
while the GA article demonstrates objective-based compression of long sources
such as SEC filings [S8][S9].

These statements do **not** establish that every request launches a browser,
that images are returned or OCR'd, that scripts are unrestricted, that PDFs are
complete, or that “clean” means safe.

### 5.2 Focused excerpts versus full view

**FACT (high):** `objective` and/or `search_queries` focus and rank excerpts.
Parallel describes compressed excerpts as dense, semantically selected context;
full content is an additional Markdown view beginning at document start [S3][S5][S8].

**INFERENCE (medium):** the observable behavior is consistent with acquisition
or indexed-document lookup, document parsing/rendering, main/structural content
conversion, segmentation, relevance scoring/compression, then character-budget
selection. The full view likely bypasses relevance selection but still uses a
transformed document representation. This does not identify parser, browser,
OCR, ranking model, chunk boundaries, or service topology.

**RECOMMENDATION (high):** keep `capture`, `extract_document`, and
`select_passages` distinct. A focused excerpt should identify the exact extracted
document version, selection objective/query, selector version, stable offsets or
span hash, score semantics if any, and truncation. “Full” should mean a bounded
view of a derivative, never raw origin bytes.

### 5.3 Material unknowns

Unknown after primary-source review:

- static-first versus render-first/fallback sequence and escalation reason;
- browser/runtime, sandbox, script/network/iframe/download policy, wait condition,
  cookies, geo, locale, consent handling, and anti-bot behavior;
- redirect limits, URL canonicalization, asset requests, content-type sniffing,
  charset handling, PDF/OCR/table/image semantics, and malformed-file behavior;
- boilerplate definition, Markdown dialect, relative-link base, code/table
  fidelity, chunk boundaries/overlap/order, and objective-ranking model/version;
- retries, per-host concurrency/politeness, negative caching, deduplication,
  multi-tenant artifact reuse, and deterministic behavior.

## 6. Cache, live fetch, and freshness

### 6.1 Request policy

**FACT (high):** `fetch_policy.max_age_seconds` is described as the maximum age
of indexed/cached content that triggers a live fetch, with a documented minimum
of 600 seconds. `timeout_seconds` bounds live fetching; when omitted it is
dynamic by URL/content type, typically 15–60 seconds. Live fetching may take up
to roughly a minute and is rate-limited to manage source-site load [S1][S5].

If live fetch fails or times out:

- `disable_cache_fallback:false` (default) allows older indexed content;
- `disable_cache_fallback:true` returns an error instead [S1][S5].

Thus positive `max_age_seconds` is a trigger/attempt policy, not a guaranteed
maximum age when fallback remains enabled.

### 6.2 Unverifiable outcome

**FACT / NEGATIVE RESULT (high):** the result exposes no `source=cached|live`,
`fetched_at`, `indexed_at`, age, stale flag, fallback flag/reason, ETag,
Last-Modified, revalidation status, or cache/capture ID [S1]. `publish_date` is
page publication metadata, not acquisition time.

**INFERENCE (high):** even with `disable_cache_fallback:true`, the caller can
only infer that the provider did not intentionally use its documented stale
fallback if the request succeeded; it still cannot establish exact capture age,
whether an accepted cache entry was revalidated, or which page version produced
the Markdown. Request time must not be copied into `fetched_at`.

**RECOMMENDATION (high):** a provider-neutral contract needs both policy and
outcome:

```text
requested_freshness: cache_allowed | max_age | require_live
max_age_seconds?
stale_fallback: allow | fail

acquisition_outcome: cache_hit | revalidated | live_fetch | stale_fallback | unknown
captured_at?, validated_at?, age_at_response?, stale?, fallback_reason?
```

Fields omitted by Parallel remain `unknown`. For reproducible evidence,
Curiosity needs a lawful immutable capture or a provider contract returning
equivalent evidence.

### 6.3 Architecture evidence for two acquisition lanes

Parallel states Extract uses the proprietary index/retrieval infrastructure also
used by Search and Task [S8]. It separately identifies `ShapBot` as the crawler
that builds/maintains its index and `Shap-User` as user-directed, non-automatic
retrieval [S11][S12].

**INFERENCE (medium-high):** the simplest public-evidence-consistent design has
an indexed/cached representation lane populated by ShapBot and an on-demand lane
identified as Shap-User. This does not prove that every Extract index hit came
directly from ShapBot, every live request uses Shap-User, or that both lanes feed
one physical store/parser.

## 7. Provenance and evidence fitness

### 7.1 What the response can establish

At most, the response supplies:

- provider request correlation (`extract_id`);
- provider-returned URL, title, and page publication-date claim;
- transformed Markdown excerpts and optional transformed full view;
- per-request session, warnings, usage, and per-URL failure metadata [S1].

This supports operational traceability and source attribution, not capture
reproducibility.

### 7.2 Missing chain of custody

| Evidence question | Parallel V1 response | Curiosity requirement |
| --- | --- | --- |
| Which requested item? | URL only; no item ID | stable request-item ID and exact submitted URL |
| Which network resource? | one ambiguous `url` | requested, normalized, fetched, redirect-terminal, declared canonical |
| When observed? | absent; `publish_date` is not fetch time | capture/revalidation timestamps and timestamp source |
| Which bytes? | absent | status, selected headers, media/charset, size, immutable hash/object reference |
| Cached or live? | absent | outcome, age, stale/fallback reason, cache/capture ID |
| Static or rendered? | absent | acquisition mode, render reason/configuration, isolation policy |
| Which extractor? | absent | parser/render/normalizer version and document hash |
| Where did excerpt come from? | Markdown string only | document version + offsets/locator/span hash + selector/query/version |
| Was output truncated? | not reported | explicit stage, returned/original sizes, reason |
| Which policy allowed it? | absent | robots/publisher/tenant/legal policy decision reference |

**RECOMMENDATION (high):** classify Parallel content as
`provider_transformed_unversioned`, not raw capture. Citations may preserve
`extract_id + input item ID + provider URL + excerpt`, but should not claim
immutable source-version proof. Returned page text, title, date, and links are
all untrusted external claims.

### 7.3 Reproducibility hazards

Output can change because the origin changed, cache selection changed, a live
fetch succeeded/failed, extraction/ranking changed, the objective/query changed,
`client_model` altered defaults, or session context influenced processing [S1][S3][S5].
None of those derivation versions/outcomes is returned. Two equal outputs also do
not prove one shared capture.

## 8. Hostile content, SSRF, and security boundary

### 8.1 Publicly documented safeguards

**FACT (high):** API transport uses TLS and Parallel claims encryption at rest,
US data centers, and SOC 2 Type I/II [S10]. The product is scoped to public,
unauthenticated URLs and publishes crawler/on-demand user agents [S10–S12].

**NEGATIVE RESULT (high):** reviewed Extract sources do not document:

- accepted URL schemes, userinfo/credential rejection, DNS resolution policy,
  private/loopback/link-local/cloud-metadata blocking, DNS-rebinding defense, or
  per-redirect address rechecks;
- redirect, origin-byte, decompression, MIME, PDF, DOM, script, subresource,
  iframe, host, or total-work limits;
- browser sandbox/isolation, malware scanning, download handling, active-content
  stripping, Unicode controls, or outbound-network restrictions;
- prompt-injection detection/neutralization, adult/safety filtering, PII/secret
  detection, Markdown sanitization, or returned-link safety labels;
- Extract-specific domain policy, robots decision, or takedown status [S1–S5].

This is not evidence Parallel lacks internal defenses; it means those defenses
are not an auditable customer contract.

### 8.2 Curiosity security requirements

**INFERENCE (high):** a known-URL fetch endpoint is an SSRF boundary, and a
JavaScript-rendering lane adds browser/network exploit and resource-exhaustion
boundaries. Clean Markdown can preserve indirect prompt injection, deceptive
links, hidden Unicode, false claims, copyrighted/personal data, or instructions
to exfiltrate secrets. Extraction quality is not content trust.

**RECOMMENDATION (high):** before any provider call, Curiosity must:

1. accept only normalized policy-approved public HTTP(S) URLs; reject userinfo,
   sensitive query tokens/presigned URLs, and private/intranet destinations;
2. perform its own hostname/IP/redirect policy for owned fetching and never
   assume a hosted provider check is equivalent or externally auditable;
3. disclose no ambient cookies, headers, authorization, or internal URLs;
4. cap URLs, deadline, output bytes/tokens, links, render admissions, retries,
   and provider spend independently;
5. mark all content and metadata `untrusted_external_evidence`; page text cannot
   change system policy, request secrets, call tools, expand URL scope, or act;
6. render Markdown only through a safe display pipeline and never auto-fetch
   returned links/assets from a privileged network; and
7. preserve explicit filtered/failure outcomes rather than silently omitting
   hostile or policy-denied material.

Because the response URL may not identify the final redirect and samples contain
relative links, downstream link resolution is provenance-sensitive and must not
be automatic [S1][S2].

## 9. Limits, errors, reliability, and pricing

### 9.1 Rate, latency, and service commitment

**FACT (high):** default quota is 600 POSTs per minute; each POST counts [S6].
With 20 URLs per body, the nominal input ceiling could be 12,000 URL attempts per
minute, but no URL-throughput, concurrency, bandwidth, or latency guarantee
follows from that arithmetic. Higher limits require support.

Customer Terms promise only commercially reasonable efforts for 24x7
availability; no Extract SLA, uptime percentage, support response time, or
deprecation guarantee appears in the reviewed self-serve contract [S14].

### 9.2 Request-level and item-level errors

**FACT (high):** the Extract OpenAPI explicitly documents 200 and 422. Non-200
errors use `{type:"error", error:{ref_id,message,detail?}}` [S1]. A general
platform page additionally lists 401, 402, 403, 404, 408, 422, 429, 500, 502,
and 503 with broad retry advice, but much of that page is Task-oriented and is
not an Extract-specific exhaustive contract [S13].

Per-URL errors use the unenumerated `error_type` plus optional HTTP status/body
content [S1]. There is no stable taxonomy or retryability field for DNS, TLS,
robots/policy, redirect, unsupported media, authentication/paywall, anti-bot,
oversize, decompression, parse/render, malware, or live-timeout failure.

**RECOMMENDATION (high):** normalize provider errors into Curiosity-owned stages
and categories (`invalid_input`, `policy_denied`, `network`, `timeout`,
`upstream_denied`, `unsupported_media`, `too_large`, `parse`, `render`,
`provider_limit`, `provider_internal`, `unknown`) while preserving a bounded
provider code/reference. Retry only reason-coded transient failures with jitter,
deadline, attempt, and spend budgets. No idempotency key is documented, so retry
of this synchronous POST may duplicate work or charges.

### 9.3 Price and metering ambiguities

**FACT (high):** the API pricing schedule lists Extract at **$1 per 1,000 URLs**
($0.001/URL) [S7]. The marketing matrix alternately says $0.001 per request and
its detail says $1 per 1,000 results [S16]. The API-specific pricing page is the
working authority. Rate limits are separate from price [S6][S7].

**UNKNOWN:** whether failed URLs, cache hits, live attempts, stale fallbacks,
duplicate URLs, full-content plus excerpts, retries, validation failures, or
provider truncation change billing. The sample SKU name mentions excerpts, but
the pricing schedule does not publish a separate full-content SKU [S1][S7].

The platform's monthly spend limit is notify-only and does not block requests
[S10]. Current marketing advertises free request/credit promotions but does not
fully define eligible Extract mix or permanence [S16].

**RECOMMENDATION (high):** admit by attempted URL and worst-case local cost,
enforce a Curiosity-side hard ceiling, and reconcile provider usage separately.
Do not use a dashboard notification as a safety control. Record attempts,
successes, failures, live-policy requests, bytes accepted, provider usage SKUs,
and local estimates.

## 10. Privacy, retention, and legal boundaries

### 10.1 Data disclosed and retained

**FACT (high):** Customer Input under the Customer Terms includes submitted data
and queries; for Extract this necessarily includes requested URLs and may include
objective, search queries, session ID, and client-model label. Customer Output
includes returned page derivatives and metadata [S14].

Parallel says data is encrypted in transit/at rest and stored in US-based data
centers [S10]. Enterprise pricing advertises Zero Data Retention and DPAs [S16].
The privacy policy's EU no-retention endpoint statement is expressly for the
**Search API**, not Extract [S15]. No public Extract-specific retention duration,
session expiry/deletion, request/output deletion API, backup/log scope, region,
or subprocessor list was established.

**MATERIAL CONTRADICTION:** FAQ says Parallel never trains on customer data
[S10]. Current Customer Terms grant a perpetual, sublicensable license for
service development/improvement and explicitly say Parallel may use Customer IP
to train and improve ML/AI models [S14 §4(b)]. The operative signed agreement,
DPA/order, and any ZDR amendment must resolve this; marketing FAQ is not enough.

**RECOMMENDATION (high):** do not send private/internal URLs, signed URLs,
credentials, personal/sensitive data, confidential objectives, or tenant-
identifying session IDs under self-serve assumptions. Before production, obtain
written Extract-specific answers on retention/deletion, training/improvement,
ZDR scope, logs/abuse telemetry, region, subprocessors, support access, and
session linkage.

### 10.2 Output use, caching, and third-party rights

**FACT (high):** the Customer Terms say the customer retains Customer IP but:

- grant Parallel broad processing/improvement rights;
- say output is AI/ML-generated and not tested, verified, endorsed, or guaranteed
  accurate, complete, or current;
- require independent review and lawful rights/permissions for inputs/use;
- restrict copying/caching/storing one query's output for other end customers or
  third parties and prohibit database/data-selling/AI-training uses;
- prohibit reverse engineering, model/service probing, competitive use, service
  scraping, and publishing benchmark/evaluation results without prior consent;
- disclaim security, accuracy, completeness, harmful-code freedom, and
  non-infringement warranties; and
- require human oversight for significant high-risk decisions [S14].

Ownership of a contractual “Customer Output” does not grant copyright, privacy,
database, or redistribution rights in third-party origin content. Public access
is not a license. Successful extraction does not prove robots compliance,
publisher permission, or lawful retention.

**RECOMMENDATION (high):** procurement must determine whether Curiosity's
evidence retention, cross-user retrieval, caching, benchmarking, and owned-index
goals are contract-compatible. Preserve attribution and publisher/takedown
policy, retain only what an approved purpose permits, and seek counsel for
corpus/jurisdiction-specific decisions.

### 10.3 Clean-room boundary

The official TypeScript SDK is generated from OpenAPI and MIT-licensed at commit
`67094960d3aacd975209f3774903c3c60b09b5a5`; that license covers SDK code, not
Parallel's hosted service, index, caches, extractors, outputs, or source-page
content [S17]. No code was copied or executed here.

Permissible transfer is limited to high-level product separation, public field
semantics, bounded policy concepts, and independently authored tests. Do not
copy provider code/prompts, infer proprietary algorithms, ingest provider
outputs into an owned index, or reproduce undocumented service behavior.

## 11. Bounded architecture inference

The public contract is consistent with the following **INFERENCE (medium)**:

```text
caller-admitted URL batch (<=20)
  -> request/account validation
  -> URL/document identity lookup
  -> dynamic cache/index freshness decision
       |-> indexed/cached representation (ShapBot-fed in at least some cases)
       `-> on-demand live acquisition (Shap-User is the disclosed user fetch bot)
             -> static parse and/or isolated render / PDF processing
  -> normalized structured/Markdown document representation
  -> metadata extraction (title, publication-date claim)
  -> segment + objective/query relevance rank/compression
  -> mandatory excerpts + optional prefix full-content view
  -> per-URL successes/errors + warnings + usage + request/session IDs
```

Evidence: explicit index/live policy and fallback [S1][S5], proprietary shared
index/retrieval claim [S8], named crawler/on-demand bots [S11][S12], automatic
JS/PDF support [S2][S3], and separate focused/full views [S1][S5].

**UNKNOWN:** physical service boundaries, cloud/region, cache topology/key/TTL,
raw-versus-derived cache, browser/parser/OCR/model vendors, worker concurrency,
cross-tenant reuse, fetch proxies, retry strategy, index completeness, model
prompts, ranking/calibration, and exact stopping/truncation logic. No stronger
claim is warranted.

## 12. Curiosity contract implications

### 12.1 Minimum provider-neutral request concepts

```text
items[]:
  request_item_id
  normalized_policy_approved_url
  retrieval_reason
representation: focused_passages | extracted_document_view
selection?: {objective, queries, max_passages, max_chars_total}
freshness: {policy, max_age_seconds?, stale_fallback}
acquisition: {static_only | rendered_allowed, max_rendered_items}
budget: {max_items, max_origin_bytes, max_response_bytes, deadline_ms, max_cost}
tenant_policy_ref
```

Parallel cannot populate every concept, but its adapter must never erase the
distinction between “false,” “empty,” and “provider omitted/unknown.”

### 12.2 Minimum response concepts

```text
attempts[]:
  request_item_id
  outcome: success | partial | failure
  failure?: {stage, category, retryable, redacted_provider_reason}
  source:
    submitted_url
    provider_url?
    fetched_url?             # unknown for Parallel
    redirect_terminal_url?   # unknown for Parallel
    canonical_url?           # unknown for Parallel
  acquisition:
    outcome                  # provider_unknown for Parallel
    captured_at?             # unknown for Parallel
    stale_fallback?          # unknown on success for Parallel
    truncation
  document:
    trust = untrusted_external_evidence
    class = provider_transformed_unversioned
    content_view
    content_hash?            # hash of received derivative, not origin bytes
    capture_id?              # unavailable from Parallel
    extractor_version?       # unavailable from Parallel
  passages[]:
    text
    document_anchor?
    selection_query_hash?
provider_trace_id
warnings[]
usage: {provider_reported, locally_estimated}
coverage: {requested, succeeded, failed, truncated, unknown}
```

### 12.3 Evaluation gates before any adapter decision

Future checks require separate authorization and only organization-owned,
public-domain, or explicitly permitted fixtures:

1. **Contract:** zero/one/20/21 URLs, duplicates, URL length/schemes, objective
   and query limits, unknown fields, warning behavior, result/error cardinality,
   order, retry headers, and SDK/OpenAPI drift.
2. **Bounds:** excerpt/full-content caps, allocation across batches, Unicode
   counting, truncation indication, oversized responses, and deadline behavior.
3. **Acquisition:** controlled static, deterministic JS, redirect, canonical,
   PDF/table/code, relative-link, malformed, and unsupported-media fixtures.
4. **Freshness:** controlled revisions under default, cache age, strict fallback,
   live timeout, and repeated requests; do not infer cache policy from one call.
5. **Safety:** Curiosity-side rejection of private/signed URLs before disclosure;
   owned prompt-injection, unsafe-link, large/decompression, and render fixtures.
   Do not probe Parallel's private-network reachability.
6. **Quality:** coverage, boilerplate, table/code/link fidelity, objective passage
   faithfulness and anchor reconstruction, multilingual/PDF behavior, drift.
7. **Operations/cost:** latency distributions, partial failures, retry
   amplification, usage reconciliation, cached/live billing, and hard local spend.
8. **Governance:** signed terms, DPA/subprocessors, Extract ZDR/region/retention,
   training contradiction, publisher policy, security evidence, and exit plan.

No checks above were executed in this research.

## 13. Decision ledger

### Adopted

1. **ADOPTED — known-URL extraction is separate from discovery.** Explicit roots
   and zero implicit child authority.
2. **ADOPTED — batch partial outcomes.** Strengthen to one typed outcome per
   caller item rather than joining solely by URL.
3. **ADOPTED — explicit stale-fallback choice.** Strict-current workflows should
   fail rather than silently use older indexed content.
4. **ADOPTED — warnings and provider usage as first-class metadata.** Preserve
   new/unknown warning and SKU types.

### Adapted

1. **ADAPTED — objective-focused excerpts.** Make them capture-bound passages
   with selection/anchor provenance and hard token budgets.
2. **ADAPTED — excerpt versus full content.** Keep separate derivative classes;
   add truncation and sizes and never call transformed Markdown raw.
3. **ADAPTED — cache-age input.** Add observable acquisition outcome, capture
   time, age, and fallback reason.
4. **ADAPTED — static/render capability.** Static first; sandboxed rendering only
   after a typed quality failure and within explicit policy/budget.
5. **ADAPTED — session/model hints.** Provider-adapter hints only, namespaced and
   opt-in; never part of Curiosity's evidence identity without recorded values.

### Rejected

1. **REJECTED — URL + Markdown as sufficient provenance.** It cannot prove page
   version, acquisition time, redirect identity, or extraction lineage.
2. **REJECTED — `publish_date` as freshness evidence.** Publication metadata and
   fetch/cache age are different clocks.
3. **REJECTED — clean/LLM-ready as safe/trusted.** Formatting does not neutralize
   prompt injection, malicious links, falsehoods, or rights/privacy risk.
4. **REJECTED — provider defaults as bounded execution.** Dynamic cache policy,
   uncapped views, unknown retries, and notify-only spend controls are inadequate.
5. **REJECTED — hosted Extract as Curiosity's owned retrieval foundation.** It is
   an opaque adapter candidate, not an immutable capture/index substrate.

### Deferred

1. **DEFERRED — Parallel provider integration.** Pending authorized fixture
   evaluation and contract/security/privacy review.
2. **DEFERRED — rendered extraction.** Pending sandbox/egress and quality gates.
3. **DEFERRED — strict-freshness reliance.** Pending observable outcome or a
   written provider guarantee plus conformance checks.
4. **DEFERRED — content retention/cross-user caching.** Customer Terms may
   conflict with Curiosity's evidence/corpus model; procurement and counsel gate.
5. **DEFERRED — quality, latency, and price-performance claims.** No paid calls
   were authorized, and Parallel restricts published evaluations without consent.

## 14. Fact / inference / recommendation ledger

| ID | Type | Claim | Confidence | Basis / verdict |
| --- | --- | --- | --- | --- |
| F1 | FACT | V1 Extract is synchronous, API-key authenticated, known-URL extraction with a documented 20-URL cap. | High | [S1–S4]; **ADOPT boundary**. |
| F2 | FACT | Excerpts are mandatory; optional full content is additional and prefix-truncated at its configured cap. | High | [S1][S4][S5]; **ADAPT views**. |
| F3 | FACT | Objective/queries focus ranked Markdown excerpts; no objective broadens output, but docs are ambiguous about whether that equals true full content. | High on fields, medium on default semantics | [S1][S3][S5][S18]; conflict retained. |
| F4 | FACT | Positive cache age triggers live fetch; stale fallback defaults on and can be disabled. | High | [S1][S5]; **ADOPT policy, adapt outcome**. |
| F5 | FACT | The response does not disclose cached/live/fallback outcome or acquisition time. | High | Negative inspection [S1]; provenance gap. |
| F6 | FACT | Parallel claims automatic JavaScript-heavy page and PDF handling. | High as capability claim | [S2][S3][S8]; runtime quality untested. |
| F7 | FACT | 200 can include successes and per-URL errors with free-form type, optional HTTP status, and optional body content. | High | [S1]; **ADOPT partial success, adapt taxonomy**. |
| F8 | FACT | Extract is $1/1,000 URLs and defaults to 600 POSTs/minute. | High | [S6][S7]; commercial terms can change. |
| F9 | FACT | Output lacks capture hash/time, redirect/canonical identity, parser version, anchors, and truncation flags. | High | Negative inspection [S1]. |
| F10 | FACT | Public docs do not specify Extract SSRF/private-IP, redirect, browser-isolation, hostile-content, or response-work limits. | High as negative result | [S1–S5]; control existence remains unknown. |
| F11 | FACT | FAQ “never train” conflicts with Customer Terms permitting Customer-IP model training/improvement. | High | [S10][S14]; production governance blocker. |
| F12 | FACT | EU no-retention language is Search-specific; Extract-specific retention/region is not public. | High | [S15]; enterprise confirmation required. |
| I1 | INFERENCE | Extract likely selects between indexed/cached and on-demand acquisition, normalizes a document, then performs relevance selection and optional full-view serialization. | Medium | F2–F6, [S8][S11][S12]. |
| I2 | INFERENCE | A Parallel response alone cannot support reproducible time-specific citation. | High | F5/F9. |
| I3 | INFERENCE | Rendering and arbitrary URL submission create network/browser threat boundaries regardless of provider-internal controls. | High | F6/F10. |
| R1 | RECOMMENDATION | Keep discovery, URL admission, capture, extraction, passage selection, and synthesis separate. | High | **ADOPTED** target architecture. |
| R2 | RECOMMENDATION | Never invent provider-omitted freshness/provenance; represent unknown explicitly. | High | **ADOPTED** evidence rule. |
| R3 | RECOMMENDATION | Enforce Curiosity URL, byte, token, render, deadline, retry, action, and spend bounds before/around provider use. | High | **ADOPTED** safety boundary. |
| R4 | RECOMMENDATION | Do not select Parallel Extract for production until legal/privacy/security and authorized fixture gates pass. | High | **DEFERRED** provider use. |

## 15. Unknowns and negative results retained

Material unknowns after the bounded review:

1. runtime URL schemes/lengths, empty/duplicate handling, ordering, and exact
   result/error cardinality;
2. cache key, age basis, TTL, capture time, revalidation, negative caching,
   stale retention, cross-tenant reuse, and default dynamic policy;
3. static/render fallback order, browser/network isolation, redirects, DNS/IP
   controls, cookies, waits, assets, iframe/download, geo, and retries;
4. origin/decompression/PDF/DOM/output/link/work limits and truncation semantics;
5. parser/OCR/Markdown/chunk/ranker algorithms and versions, excerpt anchors,
   selection stability, and publication-date extraction accuracy;
6. robots, `noindex`/`noarchive`, publisher opt-out/takedown, paywall, and
   content-licensing behavior for user-directed Extract;
7. stable per-URL error taxonomy, retryability, timeout scope, and whether
   `error.content` is bounded/sanitized;
8. charging for errors, cache/live/fallback, retries, duplicate URLs,
   full-content, and mixed partial requests;
9. Extract-specific request/output/session/log retention, deletion, region, ZDR,
   subprocessors, and training/improvement treatment; and
10. comparative quality, latency, availability, safety, and freshness
    correctness. Vendor claims are not independent measurements.

## 16. Bounded curiosity pass

After synthesis, remaining in-frame threads were scored 1–5 for relevance (R),
decision value (V), novelty (N), and investigation cost (C; lower is better).
Priority was `R + V + N - C`, constrained to public primary sources.

| Thread | R/V/N/C | Score | Action / result |
| --- | --- | ---: | --- |
| Default cache policy contradiction | 5/5/4/1 | 13 | **Pursued.** OpenAPI, advanced guide, and pricing triangulated; default remains provider-dynamic/cache-preferring, not auditable [S1][S5][S7]. |
| Freshness request versus observable outcome | 5/5/4/1 | 13 | **Pursued.** Strict fallback input exists, but no cache/live/age output was found [S1][S5]. |
| No-objective “full page” versus disabled `full_content` | 5/4/4/1 | 12 | **Pursued.** Official pages conflict/blur fields; explicit `full_content` remains the only reliable declared full-view request [S3–S5][S18]. |
| Extract SSRF/render/hostile-content controls | 5/5/4/3 | 11 | **Pursued.** Official API, guides, FAQ, crawler and terms expose no auditable endpoint controls; negative result retained. |
| Training/retention and EU/ZDR scope | 5/5/5/2 | 13 | **Pursued.** FAQ/terms materially conflict; EU statement is Search-only; Extract remains a procurement question [S10][S14–S16]. |
| Per-URL pricing/failure semantics | 4/4/3/2 | 9 | **Pursued.** API schedule says URLs while marketing says requests/results; failure/full-content charging remains unknown [S1][S7][S16]. |
| Probe private/local URLs, redirects, or browser network | 5/5/3/5 | 8 | **CURIOSITY_NO_GO.** Unsafe, unauthorized, terms-sensitive, and unnecessary for clean-room contract analysis. |
| Make free/paid calls against public pages | 4/4/3/5 | 6 | **CURIOSITY_NO_GO.** Caller prohibited credentials/paid calls and quality benchmarking; one-off calls would not establish policy. |
| Infer proprietary parser/browser/ranker vendors | 2/2/3/5 | 2 | **CURIOSITY_NO_GO.** Speculative, restricted, and irrelevant to the provider-neutral decision. |
| Publish comparative benchmark | 3/3/2/5 | 3 | **CURIOSITY_NO_GO.** No authorized corpus/calls; Customer Terms require consent for published evaluation [S14]. |
| Jurisdiction-specific copyright/robots opinion | 4/4/2/5 | 5 | **CURIOSITY_NO_GO.** Requires counsel and corpus/jurisdiction facts, not more product reverse engineering. |

**Stop condition reached:** coverage and saturation. Every requested category has
primary evidence or an explicit unknown. Remaining high-value gaps require a
signed provider answer, separately authorized owned-fixture evaluation, or legal
review. This report authorizes no autonomous follow-up.

## 17. Checks performed

- Read repository `AGENTS.md`; retained provider-neutral contracts, untrusted-
  result handling, license boundaries, and bounded behavior.
- Used first-party sources accessed 2026-08-17; no search snippet was treated as
  evidence.
- Compared current GA OpenAPI, guides, migration history, pricing, crawler/bot
  disclosures, FAQ, privacy policy, and Customer Terms.
- Inspected only the declared transport types in an official, MIT-identified,
  commit-pinned generated SDK; copied no code and inferred no server internals.
- Made no Parallel API/MCP call, created no account, supplied no credential,
  incurred no charge, probed no target, and performed no bypass or benchmark.
- Kept Extract distinct from Search/Task and retained contract contradictions
  rather than silently normalizing them.
- File-scope check: this task creates only
  `docs/research/products/parallel-extract-api.md`.

## 18. Primary sources

All sources were accessed **2026-08-17**.

| ID | Primary source | Supports / caveat |
| --- | --- | --- |
| **S1** | Parallel, [Extract V1 OpenAPI reference](https://docs.parallel.ai/api-reference/extract/extract) and [public OpenAPI JSON](https://docs.parallel.ai/public-openapi.json) | Endpoint, auth, schemas, fields, output, errors, absent provenance. High for declared schema, not runtime conformance. |
| **S2** | Parallel, [Extract API Quickstart](https://docs.parallel.ai/extract/extract-quickstart) | Public URLs, JS/PDF claim, Markdown/result sample, relative links. |
| **S3** | Parallel, [Extract API Best Practices](https://docs.parallel.ai/extract/best-practices) | Input limits, focused/no-objective behavior, sessions, tool boundary. |
| **S4** | Parallel, [Extract Migration Guide: Beta to GA](https://docs.parallel.ai/extract/extract-migration-guide) | V1 changes, 20 URLs, 5,000-character objective, mandatory excerpts. |
| **S5** | Parallel, [Advanced Extract Settings](https://docs.parallel.ai/extract/advanced-extract-settings) | Cache/live policy, 600-second minimum, timeout, stale fallback, excerpt/full semantics. |
| **S6** | Parallel, [API Rate Limits](https://docs.parallel.ai/getting-started/rate-limits) | 600 Extract POSTs/minute and counting rule. |
| **S7** | Parallel, [API Pricing](https://docs.parallel.ai/getting-started/pricing) | $1/1,000 URLs and API-level latency summary. |
| **S8** | Parallel, [“Introducing Parallel Extract”](https://parallel.ai/blog/introducing-parallel-extract) (2025-11-20) | Two views, shared proprietary index/retrieval, JS/PDF marketing claims. |
| **S9** | Parallel, [“Upgrades to the Parallel Search & Extract APIs”](https://parallel.ai/blog/parallel-search-api) (2026-04-21/22) | GA context, long-source compression and shared index positioning; benchmark claims not independently adopted. |
| **S10** | Parallel, [API FAQ](https://docs.parallel.ai/resources/faqs) | Public/no-auth web scope, TLS/storage/SOC 2, notify-only spend, FAQ no-training claim. |
| **S11** | Parallel, [Crawler](https://docs.parallel.ai/resources/crawler) | ShapBot index-building disclosure and published identity. |
| **S12** | Parallel, [Overview of Parallel Web Systems' Bots](https://parallel.ai/parallel-web-systems-bots) | ShapBot versus user-directed Shap-User roles. |
| **S13** | Parallel, [API Error Codes and Warnings](https://docs.parallel.ai/resources/warnings-and-errors) | Platform-level HTTP/retry guidance; page is substantially Task-oriented and not exhaustive for Extract. |
| **S14** | Parallel Web Systems Inc., [Customer Terms and Conditions](https://parallel.ai/customer-terms) | Data/license, training, output, caching/use, reverse-engineering/benchmark, warranties, high-risk and service terms. Legal interpretation deferred. |
| **S15** | Parallel, [Privacy Policy](https://parallel.ai/privacy-policy) | General privacy/retention and Search-specific EU data residency/no-retention statement. |
| **S16** | Parallel, [Marketing pricing page](https://parallel.ai/pricing) | ZDR/DPA enterprise claims and conflicting request/result/latency wording; API docs take precedence operationally. |
| **S17** | Parallel, official [`parallel-sdk-typescript` at `6709496…`](https://github.com/parallel-web/parallel-sdk-typescript/tree/67094960d3aacd975209f3774903c3c60b09b5a5), especially `src/resources/top-level.ts` and [MIT license](https://github.com/parallel-web/parallel-sdk-typescript/blob/67094960d3aacd975209f3774903c3c60b09b5a5/LICENSE) | Generated transport types and SDK-only license boundary; no server implementation evidence. |
| **S18** | Parallel, [API Overview, Extract setup prompt](https://docs.parallel.ai/getting-started/overview) | Official “target omitted → full page” integration wording; conflicts with explicit V1 field defaults and is treated cautiously. |

## Final confidence summary

| Area | Confidence | Reason |
| --- | --- | --- |
| GA request/response shape | High | Current first-party OpenAPI, guides, migration page, and generated SDK agree on core fields. |
| Documented limits | Medium-high | Guide limits are clear, but several are descriptions rather than machine-enforced schema constraints. |
| Cache/freshness request semantics | High | Explicit age trigger and fallback fields; default wording conflicts. |
| Actual freshness/provenance | Low | No observable capture time, cache outcome, or version identity; no calls authorized. |
| JS/PDF capability | Medium | Repeated first-party claim, but mechanism, limits, fidelity, and isolation are untested. |
| Architecture inference | Medium | Consistent with public index/live/bot and output contracts; physical internals unknown. |
| Hostile-content/SSRF controls | Low | No auditable endpoint-specific public details and no probing authorized. |
| Privacy/retention/legal fit | Medium-low | Terms are explicit in places but conflict with FAQ; Extract-specific retention/ZDR/region remains unknown. |
| Price/rate | High for list schedule | Current first-party API pages; failure/full-content billing and commercial changes remain unknown. |
| Production fitness for Curiosity | Low | No authorized conformance, quality, security, freshness, or governance evaluation occurred. |
