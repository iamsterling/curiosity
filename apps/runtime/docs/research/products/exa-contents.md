# Exa Contents: clean-room product and retrieval-plane analysis

**Research date / source access:** 2026-08-17  
**Scope:** Exa's known-URL `POST /contents` product only. Exa Search, Deep,
Answer, Agent, and ranking quality are out of scope except where an official
source distinguishes their contracts or pricing.  
**Decision:** which observable ideas to adopt, adapt, reject, or defer when
building a from-scratch Curiosity retrieval/content plane.  
**Method boundary:** public primary documentation, official legal pages, and
official public SDK/skill repositories. No credentials, paid calls, endpoint
probing, control bypass, vendor code reuse, or implementation was performed.
This is product research, not legal advice or evidence of undocumented runtime
behavior.

## Executive conclusion

**ADAPT, do not clone (high confidence).** Exa Contents is a useful example of
separating known-URL content retrieval from discovery: up to 100 URLs enter a
single synchronous request; callers select text, extractive highlights,
generated summaries, link extraction, subpage expansion, and an age-based
cache/live-fetch policy; per-URL statuses permit partial success [S1][S2]. That
is a strong product boundary and a weak evidence boundary.

For a from-scratch plane, retain the separation and the bounded, composable
request idea, but replace Exa's opaque `cached|crawled` result with an explicit
capture and derivation chain. Exa's public response has no capture timestamp,
content hash, raw-response reference, redirect chain, canonical relation,
extractor/model version, passage offsets, or evidence that the returned
`publishedDate` is anything more than an estimate [S1]. A caller therefore
cannot independently prove cache age, reproduce extraction, anchor a quote to a
specific page version, or distinguish a changed page from changed parsing.

The most consequential clean-room lessons are:

1. **Separate URL acquisition from URL discovery.** Contents should accept
   caller-authorized URLs, not silently broaden search authority.
2. **Make freshness an auditable outcome, not only an input preference.** A
   threshold without `captured_at` cannot be verified; stale fallback must be
   explicit in the response.
3. **Keep modes distinct.** Text is a derived representation, highlights are
   query-conditioned extracts, and summaries are model-generated claims. They
   need separate provenance, versions, trust labels, and budgets.
4. **Return a status for every requested root and every discovered child.** An
   HTTP 200 is only an envelope success, not evidence that all documents
   succeeded.
5. **Treat every byte, extracted link, and rendered page as hostile.** Clean
   markdown is not safe markdown, extractive text is not trusted instructions,
   and subpage discovery must not become ambient network authority.

## 1. Decision frame and bounded sub-questions

This report asks:

1. What is the current request/response and extraction contract?
2. What public evidence distinguishes stored content from a live fetch?
3. What do highlights, character limits, links, and subpages actually promise?
4. Which timestamps and provenance fields are present or absent?
5. How are partial failures, hostile content, privacy, law, and cost bounded?
6. What architecture can be inferred without claiming hidden implementation?
7. Which ideas transfer clean-room to `opencode2-curiosity`?

**Coverage criterion:** each question receives a sourced fact, a clearly marked
inference or unknown, and a project verdict. **Stop rule:** stop when additional
official pages repeat the same contract or when the remaining questions require
authenticated experiments, private contractual material, or nonpublic design.

Labels used throughout:

- **FACT** — directly stated by or visible in a cited primary source.
- **INFERENCE** — plausible architecture/behavior deduced from facts, not
  measured here.
- **RECOMMENDATION** — a clean-room project choice.
- Confidence is **high**, **medium**, or **low**.

## 2. Product boundary: Contents is not Search or Deep

**FACT (high):** `POST https://api.exa.ai/contents` is a synchronous known-URL
extraction endpoint. The body provides either `urls` or legacy-compatible
`ids`, not a discovery query. Current OpenAPI permits 1–100 entries, each 1–2048
characters, and says to provide one of the two arrays, not both [S1]. Official
guidance says use Contents when URLs are already known and Search when pages
must first be found [S2][S13]. `/contents` does not stream [S2].

**FACT (high):** content fields are top-level on `/contents`—`text`,
`highlights`, and `summary`—whereas Search nests them under `contents` [S2]. The
official JS SDK sends `{urls, ...options}` directly to `/contents` [S12].

**RECOMMENDATION (high):** preserve this as a separate internal operation such
as `RetrieveKnownUrls`, with no query planner or ranking authority. An adapter
may accept search hits, but it should resolve them to an explicit bounded URL
set before retrieval. This prevents “retrieve this page” from becoming “crawl
whatever the page suggests.”

## 3. Observable extraction contract

### 3.1 Request surface and hard documented limits

| Capability | Current documented contract | Important qualification |
| --- | --- | --- |
| Roots | `urls` or `ids`, 1–100; each string ≤2,048 characters [S1] | `id` is described as temporary and useful for Contents; it is not a durable document identity. |
| Text | `true` or object with `maxCharacters`, `includeHtmlTags`, `verbosity`, `includeSections`, `excludeSections` [S1][S2] | OpenAPI caps `maxCharacters` at 10,000. “Full page” is therefore not a completeness guarantee when a cap/default truncation applies. |
| Highlights | `true` or `{query,maxCharacters}`; cap 1–10,000 characters [S1][S2] | Legacy `numSentences` is deprecated and approximately maps each sentence to 1,333 characters; `highlightsPerUrl` is deprecated and ignored [S1]. |
| Summary | Object with optional `query` and Draft-7-style JSON `schema` [S1][S2] | Guide/SDK also describe boolean `true`, while current OpenAPI does not; structured response typing is inconsistent (section 10). |
| Freshness | `maxAgeHours` from -1 through 720; `livecrawlTimeout` >0 through 90,000 ms, default 10,000 [S1] | The returned result does not expose cache age or capture time. |
| Subpages | 0–100 per root; actual count may be lower; optional target string(s), each ≤100 chars [S1] | Selection is fuzzy/best-effort, not an exhaustive traversal [S2][S12]. |
| Extras | 0–1,000 links, image links, rich links, rich image links, or code blocks per page in OpenAPI [S1] | General guides and current SDK expose a smaller surface; ordering/selection semantics are not documented. |
| Compliance | Enterprise `compliance:"hipaa"` [S1][S8] | Cache-only, no summaries, no freshness setting requiring live fetch; requires account enablement and contractual controls. |

**FACT (high):** Exa says it handles JavaScript-rendered pages, PDFs, and
complex layouts and returns clean markdown with navigation, ads, and boilerplate
removed [S2][S3]. `verbosity` is `compact` (default), `standard`, or `full`;
section labels are `header`, `navigation`, `banner`, `body`, `sidebar`, `footer`,
and `metadata`. Section classification is explicitly best-effort and may be
missing or incomplete [S1].

**FACT (medium):** format wording is internally inconsistent. Current OpenAPI
calls `includeHtmlTags:true` “lightweight HTML tags,” while the June 2025
changelog calls it “raw HTML”; both say main boilerplate is processed away
[S1][S11]. It is therefore not a byte-faithful origin response in either mode.

**INFERENCE (high):** Exa returns a semantic derivative, not an archival
capture. Even “full”/HTML output has passed rendering, classification, and
boilerplate processing. It cannot support forensic replay or exact source
quotation without a separate source capture.

### 3.2 Text limits and truncation

**FACT (high):** current OpenAPI constrains `text.maxCharacters`,
`highlights.maxCharacters`, and deprecated `context.maxCharacters` to 1–10,000
[S1]. The public guide does not state the uncapped `text:true` default length or
whether a character budget selects a prefix, preserves sections, or applies
after markdown conversion [S1][S2].

**FACT (high):** official best-practices currently show
`text:{"maxCharacters":20000}`, contradicting the current 10,000 OpenAPI maximum
[S3]. The SDK does not enforce a TypeScript numeric range [S12].

**RECOMMENDATION (high):** the owned contract should define the counting unit
(Unicode scalar, byte, or code unit), truncation stage, deterministic selection
policy, and a response `{truncated, original_length?, returned_length,
truncation_reason}`. Do not name a bounded representation “full text.” Prefer
bounded passages or a content handle over arbitrarily large inline strings.

### 3.3 Highlights

**FACT (high):** official guidance describes highlights as query-relevant
excerpts “pulled directly from the source, not generated,” selected by an LLM;
`query` steers selection and `maxCharacters` caps total highlight text per URL
[S2][S3]. `highlights:true` uses an undocumented default and is recommended by
Exa for highest-quality default behavior [S2].

**FACT (medium):** response docs show `highlights:string[]` and sometimes
`highlightScores:number[]`, described as cosine similarity scores [S1][S2].
However, the April 2026 changelog says `highlightScores` was returned as `null`
from April 15 and removed May 1, while current OpenAPI, coding-agent guide, and
JS SDK still expose it [S1][S2][S11][S12]. Presence and semantics are therefore
not reliable as of the access date.

**UNKNOWN:** “extractive” does not specify byte-for-byte preservation after
rendering/normalization, contiguous source offsets, overlap policy, sentence
boundary behavior, duplicate suppression, model identity, or score calibration.
No highlight carries a capture ID, offset, or passage hash [S1].

**RECOMMENDATION (high):** model a highlight as an untrusted, query-conditioned
view over a specific extracted document version:

```text
passage_id, capture_id, extractor_version, start_offset, end_offset,
passage_hash, selection_query_hash, selector_version, score?, score_semantics
```

Use highlights to choose reading regions, never as self-authenticating quotes.
The system should verify the passage against the stored extracted version and
retain access to the immutable capture.

### 3.4 Summaries

**FACT (high):** summaries are explicitly LLM-generated, may be steered by a
query, and may request structured output using JSON Schema [S1][S2]. They add an
Exa-side model step and are priced separately as page summaries [S6].

**UNKNOWN:** public Contents responses provide no summary model/version,
prompt/version, grounding map, source offsets, confidence, refusal semantics,
or structured-validation status [S1]. The published response schema types
`summary` as a string even when a JSON schema is supplied [S1]; the current JS
SDK also types it as a string [S12].

**RECOMMENDATION (high):** reject generated summaries as a core retrieval-plane
fact. If added later, place synthesis downstream, label it generated, preserve
its exact inputs, model/prompt/schema versions, validation result, and
field-level evidence. Retrieval must remain useful without synthesis.

## 4. Stored versus live content and freshness

### 4.1 What is established

**FACT (high):** Exa explicitly maintains cached page content. By default it
uses cached content and live-crawls only if no cache exists. Positive
`maxAgeHours=N` accepts cache younger than N hours and otherwise attempts a live
crawl; `0` always live-crawls; `-1` is cache-only [S1][S4]. A successful status
may identify its source as `cached` or `crawled` [S1].

**FACT (high):** the freshness guide states that, for a positive threshold, a
failed/timed-out live crawl falls back to cached content [S4]. Thus a positive
`maxAgeHours` is a desired-cache-age trigger, not necessarily a hard maximum
staleness guarantee. `maxAgeHours:0` is separately documented as “never use
cache” [S2][S4].

**FACT (high):** `publishedDate` is an estimate of creation date parsed from
HTML, not a crawl/capture timestamp [S1]. The response has no `capturedAt`,
`cachedAt`, `ageHours`, `lastValidatedAt`, ETag, Last-Modified, or stale-fallback
flag. `statuses[].source` is the only direct stored/live observation [S1].

**FACT (medium):** current OpenAPI warns that deprecated `livecrawl` does not
guarantee freshly fetched parser output and may be served under server freshness
policy. Text rendering options recommend `maxAgeHours:0` when they must apply to
freshly fetched content [S1].

### 4.2 What can and cannot be inferred

**INFERENCE (medium):** the simplest architecture consistent with the contract
is URL/document lookup → freshness decision → cached derived-content read or
live fetch/render → extraction/metadata → optional highlight/summary → response.
The need to force a fresh crawl for rendering/section options suggests cached
artifacts or parser outputs are material, not merely cached raw bytes. Public
sources do not reveal cache keys, deduplication, revalidation, storage duration,
or whether one capture can be re-extracted with a new parser.

**UNKNOWN:** cache age basis (origin fetch, render, extraction, or insertion),
behavior when the origin returns 304, stale fallback for every positive value,
whether `source:"crawled"` always means this request caused the fetch, and
whether subpages share the root's freshness outcome.

**RECOMMENDATION (high):** use explicit policy and explicit outcome:

```text
requested_freshness: cache_only | max_age | require_live
max_age_seconds?
fallback_policy: fail | allow_stale

outcome: cache_hit | revalidated | fetched | stale_fallback
captured_at, validated_at?, age_at_response, stale, fallback_reason?
```

The caller must be able to reject stale fallback. Capture time, publication
claim, first-seen time, and response time are separate fields.

## 5. Links and subpages

**FACT (high):** `subpages` asks Exa to discover internal linked pages from each
root; `subpageTarget` fuzzy-matches/ranks desired pages, and the actual number
may be limited by system constraints [S1][S12]. Official guidance recommends
starting at 5–10 and describes the result as nested `subpages` [S2][S3].

**FACT (high):** `extras.links` and `extras.imageLinks` return bounded derived
URLs without crawling them. OpenAPI additionally lists `richLinks`,
`richImageLinks`, and `codeBlocks`, each up to 1,000, but current general guides
and SDK types do not consistently expose those additions [S1][S2][S12].

**CONTRACT CONFLICT:** the coding-agent guide says subpages have the same shape
as root results [S2], but the current OpenAPI nested subpage schema only declares
metadata fields (`title`, `url`, `publishedDate`, `author`, `id`, image,
favicon), not text/highlights/summary/extras or deeper subpages [S1]. Actual
content propagation is unknown without a permitted test.

**UNKNOWN:** internal-link definition (same host, registrable domain, or
canonical site), traversal depth, redirect handling, URL normalization,
duplicate policy, target scoring, sitemap use, robots checks per child, failure
reporting per child, ordering, and whether returned links preserve source
anchors/attributes.

**RECOMMENDATION (high):** split link extraction from child retrieval. Return a
bounded link edge with source capture/passage, raw and resolved URL, relation,
anchor text, normalization decision, and policy status. A separate frontier
accepts only caller-authorized child budgets. Root and child status/cost must be
individually visible; no recursive default.

## 6. Failure and partial-result semantics

**FACT (high):** since May 2025, individual URL failures are reported in
`statuses` while the request can return HTTP 200. The request envelope errors on
request/internal classes; callers must inspect every status [S2][S5][S11].

| Per-URL tag | Documented meaning / associated status [S2][S5] |
| --- | --- |
| `CRAWL_NOT_FOUND` | Origin content not found / 404 |
| `CRAWL_TIMEOUT` | Fetch timed out / 504 |
| `CRAWL_LIVECRAWL_TIMEOUT` | Caller live-crawl budget exceeded / 504 |
| `SOURCE_NOT_AVAILABLE` | Forbidden, unavailable, authenticated, or paywalled / 403 |
| `UNSUPPORTED_URL` | Unsupported scheme/type; no fixed HTTP code |
| `CRAWL_UNKNOWN_ERROR` | Other crawl failure / 500+ |

**FACT (high):** request-level failures include invalid body/URLs (400), missing
authentication (401), exhausted credits/budgets (402), feature/robots/policy
blocks (403), processing failures (422), rate limit (429), and service/upstream
errors (5xx). `ROBOTS_FILTER_FAILED` means all Contents URLs were blocked by
robots.txt [S5]. Default `/contents` rate limit is 100 QPS [S14].

**UNKNOWN:** ordering/cardinality invariants between roots, results, statuses,
and subpages; charging on failures; retry safety; retry-after headers; whether a
stale fallback reports success only; and whether nested child failures appear in
top-level statuses. The current JS SDK `Status` type contains only three broad
strings (`id`, `status`, `source`) and omits the documented error object [S12].

**RECOMMENDATION (high):** require exactly one typed terminal outcome per input
item and per admitted child. Keep envelope, policy, transport, fetch, parse,
extract, and derivation failures distinct. Include retryability, stage, bounded
reason code, stale fallback, bytes/time consumed, and a redacted trace ID. Never
infer complete success from HTTP 200 or a nonempty `results` list.

## 7. Hostile-content and network boundaries

### 7.1 Documented boundary

**FACT (high):** Exa documents robots and moderation/policy blocks, unsupported
URL schemes, authentication/paywall failures, timeouts, URL length/count caps,
response-content character caps, and subpage/link count caps [S1][S5]. It claims
JavaScript rendering and PDF/complex-layout processing [S2].

**NEGATIVE RESULT (high):** the reviewed public Contents sources do not specify
DNS rebinding/private-address defenses, redirect limits and per-hop egress
checks, maximum origin bytes, decompression limits, MIME sniffing, browser
sandbox/network policy, cookie/credential policy, malware scanning, prompt-
injection handling, active-HTML sanitization, crawl-trap controls, per-host
politeness, or child-domain boundaries [S1–S5]. Absence from public docs is not
proof Exa lacks these controls; it means clients cannot make them part of an
auditable contract.

### 7.2 Clean-room security requirement

**INFERENCE (high):** “clean, LLM-ready” describes formatting, not trust.
Markdown, HTML, PDFs, code blocks, metadata, and link text can contain indirect
prompt injection, malicious URLs, hidden Unicode, tracking identifiers, false
claims, and copyrighted or personal material. An extractive highlight can
faithfully preserve an attack. A rendered browser and subpage crawler also form
SSRF and browser-exploit boundaries.

**RECOMMENDATION (high):** the owned plane should:

- allow only normalized HTTP(S), resolve and re-check DNS/IP policy at every
  redirect, block private/link-local/metadata ranges, and never forward ambient
  credentials, cookies, or authorization;
- use static fetch first and a disposable, no-intranet rendering lane only when
  policy and quality checks require it;
- enforce redirect, bytes, decompression, MIME, wall-time, script, host,
  concurrency, and child-frontier budgets;
- retain robots/publisher/takedown decisions per capture without treating
  robots as copyright authorization;
- sanitize display surfaces while preserving a non-executable immutable
  capture; never execute returned HTML;
- label all text and metadata `untrusted-external-evidence`; content cannot
  alter agent policy, request secrets, trigger tools, or authorize more crawl;
- expose safety/policy filtering as reason-coded outcomes, not silent deletion.

## 8. Provenance and versioning gap analysis

| Evidence field | Exa Contents public response | Needed owned-plane field |
| --- | --- | --- |
| Requested identity | `statuses[].id`; result `id` is temporary [S1] | stable request item ID plus document ID |
| URL identity | result `url`; examples may resolve an abstract URL to a PDF URL [S1] | requested, fetched, redirect-terminal, declared-canonical, cluster ID |
| Stored/live class | `source: cached|crawled` [S1] | cache outcome plus capture/validation timestamps and stale flag |
| Publication time | estimated `publishedDate` [S1] | claim value, parser evidence, confidence, source field |
| Capture version | absent | immutable capture ID, fetch time, raw hash, headers/status, WARC/object reference |
| Extraction version | absent | extractor/parser/render versions and normalized-content hash |
| Passage anchoring | absent | offsets and hash against extracted version; optional DOM/text locator |
| Highlight derivation | text array; disputed optional scores | selector/query/version, offsets, score semantics |
| Summary derivation | generated value only | model, prompt, schema, validation, evidence links |
| Policy | errors can expose broad policy/robots class | robots/policy decision ID and bounded reason |
| Schema/API version | OpenAPI says API `2.0.0`; response has none [S1] | response schema version and migration policy |
| Cost | `costDollars.total` and optional SDK breakdown [S1][S12] | per-item/per-stage billable units and budget outcome |

**RECOMMENDATION (high):** citations must bind to `document_id + capture_id +
passage_id/hash`, not only a mutable URL. Captures are immutable; new fetches and
new extraction versions create new derivations. Publisher canonical hints may
link documents but never erase capture history.

## 9. Pricing, throughput, and cost controls

**FACT (high):** current self-serve pricing is pay-as-you-go. `/contents` costs
**$1 per 1,000 pages per content type**. A content type is one of text,
highlights, or summary; requesting text and highlights for one page counts as
two. AI page summaries are listed at $1 per 1,000 pages [S6]. Responses may
include `costDollars.total`; the official SDK also models optional text,
highlights, and summary cost breakdowns [S1][S12]. Default throughput is 100 QPS
[S14].

**INFERENCE (medium):** because pricing defines a page as a URL for which Exa
returns content, returned subpages likely increase page units. This is not
spelled out with a worked subpage example. No reviewed source states whether
failed pages, cached versus crawled pages, extras-only calls, or partially
returned subpages are charged.

**FACT (high):** requesting several modes multiplies billed views of the same
page; official Exa skill guidance therefore recommends choosing one mode by
default [S6][S13]. New accounts/free-tier credits and enterprise discounts are
account terms, not retrieval semantics [S6].

**RECOMMENDATION (high):** use caller-visible hard budgets for roots, children,
bytes, render attempts, derivations, latency, and storage. Predict cost before
admission and report actual per-item units. Make “highlight first, escalate to
text by evidence need” a policy, not an automatic second billing pass. Never let
an extracted page raise its own crawl or spend budget.

## 10. Contract drift and contradictions

These are retained rather than normalized away:

1. **Text maximum:** OpenAPI maximum is 10,000, while official best-practices
   show 20,000 [S1][S3]. **Working interpretation:** validate to the stricter
   OpenAPI limit; actual endpoint behavior untested.
2. **Highlight scores:** changelog says removed May 2026, while current
   OpenAPI/guide/SDK still describe them [S1][S2][S11][S12]. **Working
   interpretation:** optional/unstable; do not depend on them.
3. **Summary request/response:** guide and SDK allow `summary:true`, but current
   OpenAPI request schema only declares an object; structured summary is
   advertised, but OpenAPI and SDK type response as string [S1][S2][S12].
   **Working interpretation:** vendor schema drift; preserve as unknown.
4. **Nested subpages:** guide says same shape as results; OpenAPI declares only
   nested metadata [S1][S2]. **Working interpretation:** content inheritance is
   unknown.
5. **HTML:** changelog says raw HTML, current OpenAPI says lightweight tags;
   both acknowledge processing [S1][S11]. **Working interpretation:** derived
   tagged text, not source HTML.
6. **Freshness threshold:** positive `maxAgeHours` is described as a maximum
   cache age but production guidance permits older cached fallback after live
   failure [S4]. **Working interpretation:** soft target unless the caller can
   prohibit fallback; response does not disclose actual age.
7. **SDK-only field:** JS `ContentsOptions` includes `filterEmptyResults`, absent
   from current OpenAPI and coding guide [S1][S2][S12]. **Working interpretation:**
   not part of a portable REST contract.

**RECOMMENDATION (high):** generate no owned contract from vendor SDK types.
Maintain consumer contract tests against an approved independent specification,
version every response, and fail closed on unknown fields that can expand
authority or cost.

## 11. Privacy, legal, and clean-room constraints

### 11.1 Exa service constraints

**FACT (high):** Exa's privacy policy says open-text Query Data is not intended
for personal information, users should not submit personal information there,
and Query Data is used to improve products, including training/fine-tuning
models [S9]. It separately says business-customer data processed as a processor
is governed by customer agreements, and it describes collecting public-source
information to provide/improve services and train/fine-tune models [S9]. The
policy does not clearly classify submitted Contents URLs, target-page content,
or summary schemas as Query Data.

**FACT (high):** Zero Data Retention is an Enterprise offering [S7]. HIPAA mode
requires Enterprise enablement/BAA discussion, includes ZDR for the eligible
request, uses cached retrieval only, and disallows summaries and freshness that
requires live fetch [S8].

**FACT (medium):** Exa's Terms require API use to follow documentation and
limits; place responsibility on the user to avoid IP/proprietary-right
violations; prohibit directing output that violates IP, contract, or law; and
describe returned third-party materials as third-party content [S10]. The Terms
also prohibit scraping/mining the Exa service itself [S10]. These terms do not
grant a customer copyright or redistribution rights in origin pages.

**RECOMMENDATION (high):** do not submit secrets, private URLs, personal data,
signed URLs, or sensitive schema examples to a hosted Contents service without
a reviewed enterprise agreement, DPA, retention terms, and lawful purpose. Do
not treat “publicly available” as permission to retain, redistribute, train on,
or publish content. Track origin terms, copyright, privacy, robots, takedowns,
and jurisdiction separately.

### 11.2 Clean-room transfer boundary

**FACT (high):** the official `exa-js` repository is MIT-licensed, but using or
translating its implementation would create third-party code and is unnecessary
for this from-scratch plane [S12]. The official agent skill is public
instructional material, not a license to copy Exa service behavior or text
[S13]. Exa's hosted caches, content, selectors, models, indexes, and outputs are
not project assets.

**RECOMMENDATION (high):** permissible lessons are high-level functional
separation, bounded parameters, partial-status semantics, and independent tests
written from this fact ledger. Do not copy SDK/service code, prompts, extracted
corpora, caches, ranking/selection outputs, documentation prose, or vendor
fixtures. Do not seed an owned index from Exa results. Record implementer/source
separation and independently authored fixtures if construction is later
authorized.

## 12. Architecture inferences and target design

### 12.1 Minimal inferred Exa stages

The following is an **INFERENCE (medium)**, not a claim about internal services:

```text
known URL batch
  -> validation / account policy
  -> cache lookup + freshness decision
  -> optional live static fetch / render
  -> page/PDF extraction + metadata + link graph
  -> optional subpage selection and child processing
  -> optional query-conditioned highlight selection
  -> optional LLM summary / structured generation
  -> per-root results + statuses + cost
```

It follows only from observable options and outputs. Service topology, storage,
models, cache keys, and ordering remain unknown.

### 12.2 From-scratch content plane

**RECOMMENDATION (high):** use stricter planes and immutable boundaries:

```text
CALLER / POLICY
  explicit roots + reason + tenant policy + deadline + root/child/byte budget
    |
URL ADMISSION + EGRESS
  normalize -> robots/publisher/policy -> DNS/IP/redirect gate -> politeness
    |
CAPTURE
  static fetch -> optional isolated render -> immutable response/capture record
    |
DOCUMENT
  type parse -> metadata evidence -> text/DOM map -> links -> canonical candidates
  -> extractor-versioned document version
    |
DERIVATIONS
  bounded text view -> anchored passage selection -> optional downstream synthesis
    |
RESPONSE
  per-item outcomes + capture/provenance + freshness + policy + cost/coverage
```

Provider-neutral request concepts:

- root URLs, requested representation, exact freshness/fallback policy;
- root/child/depth/host/byte/render/deadline/cost ceilings;
- optional passage-selection query, never an authority-bearing instruction;
- explicit link extraction versus child-fetch choice;
- caller/tenant policy reference without credentials.

Provider-neutral response concepts:

- request/schema version and immutable item IDs;
- requested/fetched/terminal/canonical URLs and redirect evidence;
- capture and extraction identities, times, hashes, formats, and truncation;
- anchored passages/highlights with selector provenance;
- one typed status per admitted item, including stale fallback and filters;
- trust=`untrusted-external-evidence`, warnings, and budget consumption.

## 13. `opencode2-curiosity` use

The current Curiosity path deliberately exposes only a bounded `web_search` to
the researcher, normalizes untrusted snippets, limits results to 10, and allows
one caller-authorized, in-frame curiosity pass. Retrieval must not widen that
authority.

### Recommended flow

1. `web_search` discovers a bounded set of candidates under the existing frame.
2. The researcher/caller selects explicit URLs and a per-item reason.
3. A separate provider-neutral content operation retrieves only those roots;
   default child budget is zero.
4. First request anchored passages/highlights under a character budget. Escalate
   to a fuller extracted view only when evidence is insufficient and remaining
   authority permits it.
5. Return capture-bound evidence, status for every URL, freshness outcome,
   truncation, and failures. Keep original search snippet distinct from fetched
   evidence.
6. The researcher synthesizes with fact/inference/unknown labels and citations.
   Page text cannot ask for new tools, change the frame, or authorize follow-up.
7. The one curiosity pass may propose another explicit retrieval only after the
   existing relevance/value/novelty/cost scoring and caller authority check.

### Project verdicts

| Exa-observed idea | Verdict | Curiosity treatment |
| --- | --- | --- |
| Separate known-URL endpoint | **ADOPTED** | Separate discovery and content contracts/permissions. |
| Batch roots with hard count | **ADAPTED** | Preserve a small caller-configured cap; avoid inheriting Exa's 100 as a default. |
| Text/highlight/summary modes | **ADAPTED** | Extracted view, anchored passage view, and generated synthesis are distinct trust classes. |
| Age-based cache preference | **ADAPTED** | Add capture age, outcome, and explicit stale-fallback policy. |
| Per-URL statuses under HTTP 200 | **ADOPTED** | Strengthen to cardinality-complete typed outcomes for roots and children. |
| Automatic subpage crawl | **REJECTED as default** | Link extraction first; child fetch requires explicit bounded authority. |
| Opaque LLM highlights | **ADAPTED** | Require source offsets/hash and selector version; scores optional and typed. |
| Hosted summary as retrieval fact | **REJECTED** | Optional downstream synthesis only, with grounding/versioning. |
| URL/temporary ID citation | **REJECTED** | Cite immutable capture and passage identities. |
| Hosted Exa as owned-plane foundation | **REJECTED** | Product evidence only; no service/index/cache dependency. |
| Rendering lane | **DEFERRED** | Add only after static extraction quality gates and isolated-browser review. |
| Structured extraction | **DEFERRED** | Add after capture-grounded text/passage contracts and validation provenance. |

## 14. Fact / inference / recommendation ledger

| ID | Type | Claim | Confidence | Basis / verdict |
| --- | --- | --- | --- | --- |
| L1 | FACT | Contents is a known-URL, non-streaming extraction API with 1–100 roots. | High | [S1][S2]; **ADOPT boundary**. |
| L2 | FACT | Cached content is default; live fetch is controlled by `maxAgeHours`; status source can be cached/crawled. | High | [S1][S4]; **ADAPT**. |
| L3 | FACT | Positive age thresholds may stale-fallback after live failure. | High | [S4]; require explicit outcome/policy. |
| L4 | FACT | No capture/cache timestamp is returned; `publishedDate` is only an estimated creation date. | High | [S1]; **REJECT as provenance**. |
| L5 | FACT | Text is processed markdown/tagged output with best-effort section classification. | High | [S1][S3][S11]; derivative, not archive. |
| L6 | FACT | Highlights are described as source-extractive, query-conditioned LLM selections. | High | [S2][S3]; **ADAPT with anchors**. |
| L7 | FACT | Highlight-score documentation conflicts with the removal changelog. | High | [S1][S2][S11][S12]; unstable/unknown. |
| L8 | FACT | Per-root failures can coexist with HTTP 200. | High | [S2][S5][S11]; **ADOPT typed partial success**. |
| L9 | FACT | Links and fuzzy-targeted subpages are bounded but selection/traversal details are unspecified. | High | [S1][S2][S12]; no recursive default. |
| L10 | FACT | Contents is billed per returned page per content type; multiple modes multiply units. | High | [S6][S13]; expose budgets. |
| L11 | FACT | Public response lacks capture hash, extractor/model version, offsets, canonical/redirect chain, and schema version. | High | Negative inspection of [S1][S2]. |
| L12 | FACT | Query data may be used for product/model improvement; ZDR/HIPAA require Enterprise controls. | High | [S7][S8][S9]; hosted-sensitive use rejected absent agreement. |
| L13 | INFERENCE | Exa likely caches derived content/artifacts and conditionally fetches before derivations. | Medium | Consistent with [S1][S4], not measured. |
| L14 | INFERENCE | Clean extraction does not remove prompt injection or network-origin risk. | High | Capability is formatting, not a documented trust guarantee. |
| L15 | RECOMMENDATION | Capture immutably before extraction; version every derivative. | High | **ADOPTED** target principle. |
| L16 | RECOMMENDATION | Keep retrieval unable to grant itself subpage/tool authority. | High | **ADOPTED** for Curiosity. |
| L17 | RECOMMENDATION | Do not copy Exa code, corpora, output, or undocumented behavior. | High | **ADOPTED clean-room boundary**. |

## 15. Unknowns and validation checks

### Material unknowns

- Cache-key, capture-age, revalidation, stale retention, deletion, and
  parser-version behavior.
- Default length and truncation/selection semantics for `text:true` and
  `highlights:true`.
- Exact extraction fidelity for PDF, dynamic, paywalled, multilingual,
  malformed, and very large pages.
- Actual response type for schema summaries and current presence of
  `highlightScores`.
- Root/result/status ordering and cardinality; nested subpage failure/status
  behavior.
- Subpage domain/depth/robots/redirect/dedup rules and extras ordering.
- Charging of cached, crawled, failed, extras-only, and child-page outcomes.
- Origin-fetch safety controls and rendering isolation.
- Contractual retention/use of Contents URLs, fetched target content, schemas,
  and derived outputs under self-serve versus enterprise terms.
- Comparative extraction quality, latency, freshness correctness, and uptime;
  vendor capability documentation is not a benchmark.

### Checks required before any later adapter evaluation

These are a future authorized test plan, **not performed here**:

1. Use only project-owned fixture pages with controlled revisions, redirects,
   robots, large Unicode text, PDFs, JS rendering, links, and deliberate partial
   failures.
2. Record exact API/SDK version and request/response schemas; never include
   credentials in logs or fixtures.
3. Test 1/10,000/10,001 character boundaries, structured summaries,
   highlight exactness/offset reconstruction, and all documented conflicts.
4. Compare default, cache-only, hard-live, positive-age, timeout, and stale
   fallback across known revision times; verify whether any actual age appears.
5. Test status/result cardinality and child failure/cost reporting without
   following off-fixture links.
6. Obtain written pricing/retention answers and legal approval before paid or
   personal-data testing.
7. Treat observations as adapter conformance evidence only, never as permission
   to clone hidden mechanisms or ingest vendor outputs.

## 16. Bounded curiosity pass

After initial synthesis, gaps/contradictions were scored 1–5 on relevance (R),
decision value (V), novelty (N), and research cost (C, lower is better). Pursuit
priority was `R+V+N-C`; only public primary-source checks were authorized.

| Thread | R/V/N/C | Score | Action / outcome |
| --- | --- | ---: | --- |
| Capture timestamp vs `publishedDate` | 5/5/4/1 | 13 | **Pursued:** current OpenAPI confirms publication is estimated and no capture-age field exists [S1]. |
| Freshness threshold vs stale fallback | 5/5/4/1 | 13 | **Pursued:** freshness page explicitly documents cached fallback after live failure [S4]. |
| Highlight scores removal conflict | 4/4/4/1 | 11 | **Pursued:** triangulated changelog, current OpenAPI/guide, and commit-pinned SDK; conflict remains [S1][S2][S11][S12]. |
| Character and structured-summary schema drift | 4/4/4/1 | 11 | **Pursued:** official sources conflict; retained rather than guessed [S1–S3][S12]. |
| Subpage content/status shape | 4/4/3/1 | 10 | **Pursued:** guide/OpenAPI conflict retained; runtime remains unknown [S1][S2]. |
| Hidden cache/render architecture | 3/2/3/5 | 3 | **CURIOSITY_NO_GO:** would require nonpublic access or prohibited speculation; bounded inference only. |
| Live SSRF/browser-control probing | 5/4/3/5 | 7 | **CURIOSITY_NO_GO:** credentials and potentially unsafe probing were outside authority; public negative result retained. |
| Paid quality/latency benchmark | 3/3/2/5 | 3 | **CURIOSITY_NO_GO:** no paid tests and no representative authorized corpus in frame. |
| Jurisdiction-specific copyright opinion | 4/4/2/5 | 5 | **CURIOSITY_NO_GO:** requires counsel and corpus/jurisdiction facts; operational controls recommended instead. |
| Historical reverse engineering of retired contracts | 2/1/2/4 | 1 | **CURIOSITY_NO_GO:** current from-scratch decision does not depend on reconstructing legacy behavior. |

**Stop condition:** coverage was reached for every framed category; additional
official pages repeated the same product claims; remaining high-impact unknowns
require authenticated tests, vendor answers/contracts, or legal review.

## 17. Primary source table

All sources were accessed **2026-08-17**. Dynamic documentation can change;
commit-pinned repository sources are included where available.

| ID | Primary source | What it supports | Confidence / caveat |
| --- | --- | --- | --- |
| S1 | [Exa Contents OpenAPI/reference](https://exa.ai/docs/reference/get-contents) | Endpoint, limits, schemas, source status, metadata, options | High for declared current schema; contains contradictions with guides/changelog. API spec version shown as 2.0.0, but page is mutable. |
| S2 | [Contents API reference for coding agents](https://exa.ai/docs/reference/contents-api-guide-for-coding-agents) | Usage contract, extractive highlights, response/status guidance, mistakes | High for official guidance; not runtime evidence. |
| S3 | [Contents best practices](https://exa.ai/docs/reference/contents-best-practices) | Markdown/extraction claims, modes, subpage/freshness guidance | Medium-high; includes a 20,000-character example conflicting with OpenAPI. |
| S4 | [Content Freshness](https://exa.ai/docs/reference/livecrawling-contents) | Cache/live policy and stale fallback | High; no observable capture-age contract. |
| S5 | [Error Codes](https://exa.ai/docs/reference/error-codes) | Request and per-URL errors, robots/policy classes | High for declared classes; retry/cardinality details absent. |
| S6 | [Pricing](https://exa.ai/docs/reference/pricing) | Per-page/content-type pricing and cost glossary | High as of access date; commercial terms can change. |
| S7 | [Enterprise Documentation & Security](https://exa.ai/docs/reference/security) | SOC 2 claim, ZDR/enterprise boundary, regional blocks | Medium-high; detailed reports/DPA require Trust Center access. |
| S8 | [HIPAA](https://exa.ai/docs/reference/security/hipaa) | Cache-only compliance mode, ZDR, restrictions | High for declared product mode; contractual suitability requires BAA review. |
| S9 | [Exa Privacy Policy](https://exa.ai/privacy-policy) (updated 2026-06-29) | Query-data use, public-source collection, processor boundary | High for published policy; Contents-specific data classification remains unclear. |
| S10 | [Exa Labs Terms of Service](https://exa.ai/assets/Exa_Labs_Terms_of_Service.pdf) | API/documentation compliance, IP responsibility, third-party materials, service-scraping restriction | Medium-high; legal interpretation deferred to counsel. |
| S11 | [Exa Changelog](https://exa.ai/docs/changelog.md) | Markdown shift, status changes, highlight/freshness deprecations, pricing history | High for announced history; conflicts with current schemas are retained. |
| S12 | [`exa-js` `src/index.ts` at `6dcc810…`](https://github.com/exa-labs/exa-js/blob/6dcc81033f43b24418b70ad97092160899db3230/src/index.ts) and [MIT license](https://github.com/exa-labs/exa-js/blob/6dcc81033f43b24418b70ad97092160899db3230/LICENSE) | Official client request shape/types, defaults, drift, license boundary | High for that commit (repository head observed on access date); SDK typing is not server truth. |
| S13 | [Official Exa Contents agent skill at `1ae0160…`](https://github.com/exa-labs/agent-skills/blob/1ae0160526cef42c4fb27cd875b6c22309593bef/skills/exa-contents/SKILL.md) | Known-URL boundary, one-mode default, bounded-agent advice | High for official guidance at commit; not protocol authority. |
| S14 | [Rate Limits](https://exa.ai/docs/reference/rate-limits) | Default Contents 100 QPS | High as of access date; enterprise limits differ. |

## Final verdict

**ADOPTED:** known-URL retrieval as a separate bounded operation; composable
representations; explicit cache preference; cardinality-complete partial
statuses; cost and deadline budgets.  
**ADAPTED:** highlights become capture-anchored passages; freshness becomes a
verifiable outcome; subpages become separately authorized frontier items;
metadata becomes evidence-bearing claims.  
**REJECTED:** Exa as the owned foundation; URL-only citations; opaque summaries
as facts; silent stale fallback; automatic recursive crawl; “clean” content as a
trust guarantee; vendor schemas/SDKs as the project domain model.  
**DEFERRED:** rendering, generated structured extraction, and any hosted adapter
benchmark until static capture/extraction, provenance, legal review, and
authorized fixtures are in place.
