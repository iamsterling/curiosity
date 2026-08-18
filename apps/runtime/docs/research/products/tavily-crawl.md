# Tavily Crawl: clean-room product reverse engineering

**Date:** 2026-08-17  
**Decision:** which public Tavily Crawl/Map contract ideas Curiosity should
adopt, adapt, reject, or defer without depending on Tavily's proprietary
implementation.  
**Status:** research record, not an implementation, benchmark, legal opinion,
or authorization to call Tavily.  
**Access boundary:** public first-party documentation, public official SDK
repositories, and Tavily's public legal pages only. No account, credential,
paid or free API call, target crawl, bypass, vulnerability probe, or private
material was used.

## Executive verdict

**ADAPT the bounded public contract; REJECT Tavily as an owned-crawl
foundation (high confidence).** Tavily exposes a useful two-stage abstraction:
`Map` discovers URLs and `Crawl` combines mapping with extraction. Both accept
depth, breadth, total-work, regex path/domain, external-domain, semantic
instruction, and wall-clock controls. Crawl additionally selects extraction
depth and output format. This is a compact agent-facing surface worth learning
from [S1-S5].

Do **not** copy the contract literally. Its defaults are unsafe for a strict
same-site boundary (`allow_external=true`); `limit` has no published maximum;
filter precedence and regex semantics are unspecified; documentation conflicts
on whether `allow_external` controls following or only returned links; and the
response omits fetch status, redirect chain, timestamps, robots decisions,
canonical identity, content hashes, edge lineage, extractor version, and
complete partial-failure semantics [S1-S5]. Tavily's proprietary service also
cannot supply Curiosity with an owned frontier or evidence chain.

Most crawler internals remain legitimately unknown. First-party material says
the traversal is graph-based, parallel, and (in the official JavaScript SDK
README) breadth-first; it does not publish queue ordering under semantic
instructions, retry classes/budgets, host politeness, redirect policy,
canonicalization, duplicate suppression, cache behavior, renderer selection,
or consistency guarantees [S1, S2, S8]. These absences are findings, not an
invitation to probe.

## 1. Frame, bounded questions, and method

### 1.1 Questions

1. What are the exact Crawl and Map request/response contracts?
2. How do depth, breadth, limit, semantic instructions, paths, domains, and
   external-link controls bound traversal?
3. What public evidence exists for robots compliance, politeness, frontier
   order, retries, rendering, extraction, canonicalization, and deduplication?
4. What provenance, limits, error, price, privacy, safety, and legal properties
   are—and are not—observable at the boundary?
5. Which architecture can be inferred without claiming knowledge of Tavily's
   proprietary internals?
6. Which lessons transfer clean-room to Curiosity?

### 1.2 Method and sufficiency

Primary sources were preferred: the current OpenAPI pages/specification,
official best-practice/tutorial/SDK docs, Tavily-owned SDK repositories pinned
to public commits, pricing/rate-limit pages, and Tavily's legal/privacy pages.
All were accessed 2026-08-17. Vendor docs establish offered behavior, not
comparative quality or actual implementation. Search snippets were discovery
leads only.

The depth budget covered every category in the caller's frame and one bounded
curiosity pass. Research stopped at coverage and source saturation. No live
service behavior was measured, because even a free call would require a
credential and would not justify probing undocumented security or crawler
internals.

Labels:

- **FACT** — directly supported by cited public first-party material.
- **INFERENCE** — the narrowest architecture implication consistent with facts.
- **UNKNOWN** — material behavior not established by inspected sources.
- **RECOMMENDATION** — a Curiosity design choice, not a Tavily claim.
- Confidence is **high**, **medium**, or **low**.

## 2. Product boundary and contract

### 2.1 Crawl versus Map

| Property | `POST /map` | `POST /crawl` |
| --- | --- | --- |
| Stated role | Graph traversal and site-map discovery | Graph traversal plus content extraction |
| Required input | `url` | `url` |
| Shared controls | `instructions`, `max_depth`, `max_breadth`, `limit`, select/exclude path and domain regexes, `allow_external`, `timeout`, `include_usage` | Same |
| Extra controls | None in REST OpenAPI | `chunks_per_source`, `include_images`, `extract_depth`, `format`, `include_favicon` |
| Main result | URL strings | `{url, raw_content, favicon?}` objects; image support is requested but not declared in the REST result schema |
| Common envelope | `base_url`, `results`, `response_time`, optional/declared `usage`, `request_id` | Same |
| Default work bounds | depth 1, breadth 20, limit 50, timeout 150 s | Same |
| Published timeout range | 10–150 s | 10–150 s |
| Authentication | Bearer API key | Bearer API key |

**FACT (high):** Tavily's tutorial rule is “Map to find, Crawl to read.” Map is
described as faster/cheaper because it returns URL lists; Crawl returns cleaned
markdown or text and is priced as map plus extraction [S3-S5].

**INFERENCE (high):** the public abstraction separates cheap frontier
inspection from expensive content acquisition, but the service may still fetch
enough page representation to discover links or apply semantic instructions.
“Map returns URLs only” is an output statement, not proof that mapping performs
no HTTP content retrieval or parsing.

### 2.2 Scope, depth, breadth, and total-work controls

| Control | Published contract | Boundary analysis |
| --- | --- | --- |
| `max_depth` | Integer 1–5, default 1; distance from starting URL | Strong, explicit topological bound. The starting page's depth convention is not specified. Docs warn latency grows exponentially. |
| `max_breadth` | Integer 1–500, default 20; described both as links per “level” and “per page” | Ambiguous. “Per level” and “per page” produce different maximum frontiers. `limit` is the reliable total cap. |
| `limit` | Integer ≥1, default 50; total links/pages processed | Essential global cap, but OpenAPI declares no maximum. “Processed,” “crawled,” and “returned” are used interchangeably across pages, so charging/result cardinality need not equal queue attempts. |
| `timeout` | Number 10–150 s, default 150 | Bounds synchronous wait. The contract does not say whether work is cancelled, whether partial results return, or whether timeout can consume credits. |
| `instructions` | Natural-language guidance/semantic filtering | A relevance control, not a deterministic safety boundary. It doubles mapping cost per ten successful pages. |
| `chunks_per_source` | 1–5, default 3, only with instructions; chunks ≤500 characters joined by `[...]` | Bounds returned context per successful source, but not crawl work or extraction input size. |

The theoretical tree without a total cap can grow approximately as
`1 + b + ... + b^d`; at documented maxima, depth/breadth alone is not a useful
cost bound. **RECOMMENDATION (high):** Curiosity must require an explicit,
locally capped `max_pages` smaller than any provider maximum and must separately
bound discovered links, fetched bytes, redirects, render time, extracted bytes,
and response bytes.

### 2.3 Path, domain, and external controls

`select_paths`, `exclude_paths`, `select_domains`, and `exclude_domains` are
arrays of regex strings [S1, S2]. Examples use URL paths such as `/docs/.*` and
anchored hosts such as `^docs\.example\.com$`.

Material unknowns:

- regex dialect, flags, anchoring, normalization, and invalid-pattern errors;
- whether paths include query strings, percent-decoded text, trailing slash,
  fragments, or the origin;
- whether host matching occurs before/after IDNA conversion, case folding,
  port stripping, redirect resolution, and DNS resolution;
- inclusion/exclusion precedence and whether the seed is exempt;
- limits on pattern count/length/complexity and protection from pathological
  regexes;
- whether filters gate enqueue, fetch, extraction, return, or some combination.

**FACT (high):** sources conflict on `allow_external`. REST OpenAPI says it
controls external links “in the final results list”; Python SDK docs say it
controls following external links; JavaScript docs again say it controls return
links. All currently default it to `true` [S1, S2, S9, S10].

**RECOMMENDATION (high):** model three separate controls—`discovery_scope`,
`fetch_scope`, and `return_scope`—and default every one to exact normalized
origin. Domain selection must be a parsed-host allowlist, not user regex, at the
security boundary. Regex path filtering may be layered on after URL parsing.

### 2.4 Semantic instructions

**FACT (high):** instructions focus Map/Crawl by natural-language topic. On
Crawl they also unlock query-relevant chunk return. Tavily says this semantic
mode raises mapping from one to two credits per ten successful pages [S1-S5].

**INFERENCE (medium):** semantic scoring likely influences candidate selection
or return filtering and chunk reranking. Public evidence does not distinguish
pre-fetch URL/anchor scoring, post-fetch page scoring, or both. It also does not
establish determinism, model/version stability, false-negative behavior, or
whether an instruction can override path/domain exclusions.

**RECOMMENDATION (high):** treat natural language only as a soft priority signal
inside hard scope and budget gates. Record the instruction, scorer/version,
score, and rejection reason; never let model output expand authority.

## 3. Frontier, robots, politeness, and retries

### 3.1 What is evidenced

- **FACT (high):** official API docs call Map/Crawl graph-based traversal that
  explores hundreds of paths in parallel [S1, S2].
- **FACT (medium):** the official JavaScript SDK README calls Crawl
  “breadth-first.” This is first-party descriptive material but not a server
  protocol guarantee [S8].
- **FACT (high):** docs advise starting at depth 1 and breadth 20, setting a
  limit, monitoring failures, and using Map before Crawl [S3, S4].
- **FACT (high):** Tavily's own endpoint is rate limited to 100 requests/minute
  for both development and production keys; 429 includes `retry-after`, which
  clients are told to respect [S6]. This is caller-to-Tavily throttling, not
  proof of Tavily-to-origin politeness.
- **FACT (medium):** best-practice docs say “Respect site's robots.txt” and
  “Implement appropriate delays between requests” [S3]. The wording is advice
  in an integration section; it does not explicitly promise that the managed
  Crawl service performs either behavior.

### 3.2 Robots evidence must not be conflated

Tavily separately documents its **Search crawler**. That crawler does not
advertise a distinct user agent, will not crawl a page unavailable to Googlebot,
does not use `robots.txt` to prevent indexing, and uses a robots `noindex`
directive plus re-fetch for delisting [S11]. This raises policy and
transparency questions, but it does **not** establish the behavior of the
on-demand Crawl API. “Not crawlable by Googlebot” is also not a published,
testable equivalence to RFC 9309 processing.

**UNKNOWN (high confidence that evidence is absent):** the inspected Crawl/Map
contract does not promise robots fetching/parsing, user-agent token, per-origin
delay, `crawl-delay`, concurrency cap, sitemap handling, publisher opt-out,
robots cache/expiry, redirect robots re-evaluation, or fail-open/fail-closed
behavior.

### 3.3 Frontier and retry unknowns

No inspected first-party source specifies:

- queue tie-breaking, depth accounting, link scoring, or semantic priority;
- per-host versus global concurrency and fairness;
- retryable status classes, transport retries, exponential backoff, jitter,
  `Retry-After` handling at target origins, or attempt caps;
- redirect count/scheme/host rules, loops, or credential stripping;
- timeout cancellation and partial queue disposition;
- trap detection, calendar/facet/session URL controls, maximum response bytes,
  decompression ratio, MIME allowlist, or content sniffing;
- resumability, idempotency, cache reuse, recrawl, or snapshot consistency.

**INFERENCE (medium):** parallel graph traversal requires at least a frontier,
visited-state mechanism, and worker scheduling. Nothing public justifies a
stronger claim about their data structures, deployment, or algorithms.

**RECOMMENDATION (high):** Curiosity should expose fetch attempts and terminal
states, with bounded retry budgets and per-origin schedulers. “Breadth-first”
should be an explicit, testable policy—not inferred from a vendor label.

## 4. Rendering and extraction

**FACT (high):** Crawl returns cleaned content in markdown by default or plain
text; `text` may increase latency. `basic` extraction is the faster/default
path. `advanced` is documented as higher-success and able to retrieve tables,
embedded content, complex structured data, media, and JavaScript-rendered
pages, at twice the extraction-credit rate [S1, S3, S4, S10]. Images and
favicons are optional URL outputs.

**FACT (high):** with instructions plus `chunks_per_source`, `raw_content`
changes meaning: it contains up to 1–5 relevance-ranked snippets, each at most
500 characters and separated by `[...]`, rather than full page content [S1,
S3-S5]. The Crawl OpenAPI description incorrectly says “when `query` is
provided,” while Crawl's request field is `instructions`; the changelog and
best-practice docs support `instructions` [S1, S3, S16].

**UNKNOWN:** browser engine/version, JavaScript execution policy, resource and
network interception, cookies/storage, wait condition, geolocation/locale,
anti-bot behavior, PDF/office support, DOM-to-markdown algorithm, boilerplate
removal, table fidelity, content length caps, sanitization, and extractor/model
versions.

**INFERENCE (medium):** `advanced` is likely a routed extraction lane and may
include rendering, but the sources do not establish that every advanced page
uses a browser or that basic never does.

**RECOMMENDATION (high):** Curiosity should statically fetch first, route to an
isolated renderer only on explicit quality signals, preserve raw capture and
render metadata, sanitize output, and mark extracted text as untrusted. A
renderer must have a separate egress allowlist and may not fetch private or
newly discovered origins.

## 5. URL identity, canonicalization, and deduplication

**NEGATIVE RESULT:** neither Crawl nor Map documents URL normalization,
`rel=canonical`, redirect-final identity, fragment removal, query ordering,
tracking-parameter stripping, case/trailing-slash treatment, content hashes,
exact duplicate suppression, near-duplicate clustering, or duplicate-result
guarantees [S1-S5, S9, S10]. Returned URLs alone cannot show whether duplicates
were fetched, charged, suppressed, or aliased.

**INFERENCE (medium):** any finite traversal probably maintains some visited
identity, but its key and lifecycle are unknown. It must not be represented as
standards-grade canonicalization.

**RECOMMENDATION (high):** maintain separately:

1. submitted URL;
2. normalized fetch URL;
3. redirect chain and final URL;
4. publisher-declared canonical URL as evidence, not authority;
5. immutable capture hash/version;
6. exact-content and near-duplicate cluster IDs.

Scope checks must run on every redirect and embedded/render request. Dedup must
not erase provenance or falsely turn mirrors into independent corroboration.

## 6. Outputs and provenance

### 6.1 What is returned

Map returns `base_url`, discovered URL strings, `response_time`, `request_id`,
and optionally `usage.credits`. Crawl returns the same envelope with per-page
`url`, `raw_content`, optional favicon, and—according to request/docs—optional
images [S1, S2, S9, S10]. `request_id` is explicitly for support. Paid accounts
can query separate logs containing timestamp, endpoint, depth/model,
server-side response time, credits, masked key, and request ID; logs explicitly
exclude request input and output [S14]. Optional project/session/human headers
support analytics; Tavily says human IDs are hashed [S7].

### 6.2 Provenance gaps

The Crawl/Map response does not declare:

- fetch/observed timestamp or source HTTP status/headers;
- redirect chain, requested URL, resolved IP/ASN, MIME type, byte count;
- referrer/parent URL, link edge, depth, frontier order, or selection reason;
- robots/policy decision and policy version;
- raw response hash/capture ID or extraction/render version;
- canonical relation, duplicate cluster, language, publication time, title;
- passage offsets/hashes for chunks or relevance score;
- per-page credit, failure attempts, or completeness/truncation indicator.

**RECOMMENDATION (high):** never map `raw_content` directly to trusted evidence.
Wrap it in provider provenance and untrusted-data markers. A Curiosity-owned
crawl must produce page/attempt/edge/capture/extraction records and citation
anchors; hosted output cannot substitute for an immutable capture chain.

## 7. Limits, partial failures, and errors

### 7.1 Published limits

- depth 1–5; breadth 1–500; chunk count 1–5; timeout 10–150 seconds;
- limit defaults to 50 and has only a minimum of 1 in OpenAPI;
- Crawl endpoint: 100 requests/minute for either key environment;
- production keys require a paid plan or PAYGO;
- plans/credit and PAYGO limits can independently stop work [S1, S2, S6].

No published Crawl/Map caps were found for URL length, instructions, regex
arrays/length, total result bytes, page bytes, images, or `limit` maximum.

### 7.2 HTTP errors

Both endpoint references declare:

| Status | Meaning |
| --- | --- |
| 400 | Invalid request; example: no starting URL |
| 401 | Missing/invalid key |
| 403 | Unsupported URL |
| 429 | request-rate limit exceeded |
| 432 | API-key or plan limit exceeded |
| 433 | PAYGO limit exceeded |
| 500 | internal server error |

The standard envelope is `detail.error`. Rate-limit docs additionally promise a
`retry-after` header for 429 [S1, S2, S6]. Official Python SDK 0.7.27 maps 429
to `UsageLimitExceededError`, 403/432/433 collectively to `ForbiddenError`, 401
and 400 to typed exceptions, and client timeout to its own `TimeoutError`; it
does not automatically retry Crawl/Map [S17].

### 7.3 Partial-failure inconsistency

The Crawl tutorial tells callers to inspect `response["failed_results"]`, and
best practices say to monitor failed results [S3, S4]. Yet the current Crawl
OpenAPI and Python/JavaScript SDK response tables list no `failed_results`
field; the Python wrapper also returns the Crawl JSON unchanged, unlike Extract
where it defaults both `results` and `failed_results` [S1, S9, S10, S17].

**UNKNOWN:** whether the live service currently returns per-page failures, the
shape of each failure, whether a 200 can be incomplete, and how timeout is
represented. This is a contract-quality defect, not evidence of runtime loss.

**RECOMMENDATION (high):** Curiosity needs explicit terminal run status
(`complete`, `partial`, `timed_out`, `cancelled`, `failed`), page-attempt errors,
unprocessed-frontier count, budget exhaustion reason, and retry guidance.
Provider adapters should preserve unknown fields but validate and cap all
known fields.

## 8. Pricing and cost semantics

As published 2026-08-17 [S5]:

- Free Researcher plan: 1,000 credits/month, no card.
- Monthly plans: Project 4,000/$30; Bootstrap 15,000/$100; Startup
  38,000/$220; Growth 100,000/$500 (about $0.0075–$0.005/credit).
- PAYGO: $0.008/credit; Enterprise custom.
- Map: 1 credit per 10 successful pages, or 2/10 with instructions; failed map
  requests are not charged.
- Extract: basic 1 credit per 5 successful URL extractions; advanced 2/5;
  failed extractions are not charged.
- Crawl = mapping + extraction. Published examples: 10 pages cost 3 credits
  basic, 5 advanced; instructions would raise the mapping component, implying
  4 and 6 credits respectively, although those combined examples are not
  printed explicitly.

At PAYGO, the published ten-page examples are approximately $0.024 basic and
$0.040 advanced before instruction uplift. Credit rounding/aggregation is not
fully stated: `include_usage` may report zero until map/extract minimum units
are accumulated [S1, S2, S5]. Therefore per-request `usage=0` is not proof of
free work.

**RECOMMENDATION (high):** maintain hard page/byte/render/credit ceilings and
derive worst-case authorized cost before dispatch. Never rely on provider
timeout or billing limits as the primary budget.

## 9. Safety, SSRF, privacy, and legal boundary

### 9.1 SSRF and hostile-content risk

**FACT (medium):** a 403 “URL is not supported” demonstrates some server-side
URL policy, but Tavily publishes no Crawl/Map SSRF guarantee or allowed scheme,
port, IP range, redirect, DNS-rebinding, or cloud-metadata rules [S1, S2].

The combination of caller-supplied seed URLs, external following defaulting to
true, regex domain controls, redirects, optional images, and JavaScript-capable
advanced extraction creates a substantial SSRF/browser attack surface.
Returned page text, markdown, URLs, images, and favicons are untrusted and can
contain prompt injection, malicious links, exfiltration instructions, or huge
payloads.

**RECOMMENDATION (high):** do not expose Tavily Crawl directly to an agent.
Place it behind a fixed-origin, authenticated provider adapter with URL parsing,
public-IP resolution at every hop, scheme/port allowlists, rebinding defense,
redirect caps, response byte/time caps, output validation, secret redaction,
and untrusted-content labeling. For an owned crawler, rendering requires an
isolated network namespace and no ambient credentials.

### 9.2 Query/input privacy

**FACT (high):** Tavily's Privacy Policy says it collects query data and
uploaded documents to provide the service and, unless contractually otherwise
specified, may use portions of query data to improve future responses. It may
share query data with third-party search-index providers when its own index
cannot retrieve content. Retention is purpose/account/deletion based rather
than a fixed public duration [S12]. Although written primarily around queries,
seed URLs, instructions, project/session identifiers, and crawl content can
constitute Customer Input under the Platform Terms [S13].

**FACT (high):** the Platform Terms prohibit specified sensitive data in
Customer Input; the AUP prohibits unlawful personal data and restricts
sensitive information. The customer is responsible for notices, consents,
lawful input, downstream users, and verification/legal use of output [S13,
S15]. Optional session/human IDs are for attribution and analytics; hashing a
human ID is pseudonymization, not proof of anonymity [S7].

**CONTRADICTION:** the RTBF page says Tavily Search does not collect personal
information about searches and that searches remain private, while the general
Privacy Policy says the Platform collects query data and may use/share it in
the circumstances above [S12, S18]. The narrower statement may refer to a
different search surface, but the page does not resolve that scope. Treat the
Privacy Policy and negotiated agreement as controlling pending counsel review.

**RECOMMENDATION (high):** never send secrets, personal/sensitive data, private
hostnames, authenticated URLs, or internal corpus instructions to Tavily under
the standard public terms. Enterprise use requires DPA/subprocessor/retention/
training review and a contract that disables improvement use where needed.

### 9.3 Robots, copyright, site terms, and output rights

Robots is a crawl-preference protocol, not a copyright or access license.
Tavily's best practices tell users to respect robots and site policies, while
its AUP makes customers responsible for lawful, non-infringing use and
third-party contractual obligations [S3, S15]. Outputs are derived from public
material, but Tavily disclaims their legality, non-infringement, accuracy, and
suitability [S15]. Platform Terms limit service use to internal business
purposes and prohibit reverse engineering, competitive use, safeguard bypass,
and disclosure of performance analysis [S13].

**RECOMMENDATION (high):** legal review remains required for source terms,
copyright/database rights, retention, display, indexing, personal data,
takedown, and jurisdiction. This report copies no service code or output. It
uses public interface facts for interoperability research and does not attempt
to infer proprietary algorithms. Official SDKs are MIT-licensed, but that
license covers SDK code—not Tavily's hosted implementation, web content, or
service output [S8, S17].

## 10. Minimal architecture inference

The following is the strongest clean-room architecture justified by public
behavior; component names are conceptual, not claims about Tavily deployment:

```text
authenticated synchronous request
  -> input validation / account and rate-limit gate
  -> URL-policy gate (some URLs yield 403)
  -> graph frontier with depth/breadth/limit/time budget
  -> parallel URL discovery and visited-state
  -> hard path/domain filters + optional semantic prioritization/filtering
  -> [Map] URL result projection
  -> [Crawl] basic or advanced extraction/render route
  -> optional relevance chunk selection / images / favicon
  -> response envelope + request/usage logging
```

| Inference | Confidence | Why it is bounded |
| --- | --- | --- |
| Shared discovery plane under Map and Crawl | High | Same traversal controls and explicit Crawl pricing as map + extract. Could still be separate implementations behind a common contract. |
| Frontier plus visited state | Medium-high | Required by bounded graph traversal in practical terms; exact identity/store/order unknown. |
| Breadth-first default | Medium | Official SDK README says so; API does not make it a versioned guarantee, and instructions may reorder. |
| Parallel workers | High | API explicitly claims hundreds of paths in parallel; worker topology unknown. |
| Basic/advanced extraction routing | Medium-high | Distinct latency/cost/capability modes; implementation and renderer usage unknown. |
| Semantic relevance stage | High | Instructions filter pages and chunks are ranked; model/location/version unknown. |
| Per-request accounting/logging | High | request IDs, optional usage, Usage/Logs endpoints. |
| Robots/politeness service | Low/unknown | Advice exists, managed-service guarantee does not. |
| Canonicalization/near-dedup service | Low/unknown | No public contract evidence. |
| Retry subsystem | Low/unknown | No target-fetch retry contract. |

## 11. Clean-room lessons and Curiosity implications

### 11.1 Verdict ledger

| Product idea | Verdict | Confidence | Curiosity disposition |
| --- | --- | --- | --- |
| Separate Map (discover) from Crawl (read) | **ADOPTED concept** | High | Keep discovery and acquisition independently budgeted and observable. |
| Depth + breadth + total limit + timeout | **ADAPTED** | High | Require all, but add bytes, redirects, render, per-host, result-size, and credit bounds. |
| Regex path/domain controls | **ADAPTED** | High | Parsed-host allowlists for security; bounded regex only for normalized paths. |
| `allow_external=true` default | **REJECTED** | High | Exact-origin default; distinct discover/fetch/return permissions. |
| Natural-language crawl instructions | **ADAPTED** | High | Soft ranking only, subordinate to hard authority and budget. |
| `chunks_per_source` context control | **ADAPTED** | High | Return anchored passages with offsets/hashes; never overload “raw content.” |
| Basic vs advanced extraction | **ADAPTED/deferred** | High | Static lane first; isolated renderer only after explicit quality failure. |
| Synchronous 150-second operation | **REJECTED as internal model** | Medium-high | Use durable run state, cancellation, incremental events, and bounded API wait. |
| Tavily response as provenance record | **REJECTED** | High | Insufficient lineage, policy, version, canonical, and failure evidence. |
| Tavily as owned crawl core | **REJECTED** | High | Hosted proprietary frontier/extraction and contractual dependence. |
| Tavily as optional provider adapter | **DEFERRED** | Medium | Only after legal/privacy/security review and a provider-neutral contract. |
| Official MIT SDK code | **DEFERRED** | High | License is permissive, but dependency is unnecessary for contract research and does not transfer service internals. |

### 11.2 Provider-neutral contract lessons

A Curiosity crawl request should minimally distinguish:

- immutable caller frame, authority, seed(s), and run budget;
- normalized origin allowlist and explicit external discovery/fetch/return
  scopes;
- depth, per-page outlink, discovered-URL, fetch, byte, redirect, render,
  per-host concurrency/delay, deadline, and cost limits;
- deterministic path rules plus optional soft goal/instruction;
- robots/publisher-policy mode and policy snapshot;
- extraction/render lane and output-size/passages limits;
- idempotency key, cancellation, and retention class.

A result should include run status and warnings; every page needs URL lineage,
depth, attempts, policy decision, HTTP/fetch metadata, immutable capture/hash,
canonical evidence, duplicate cluster, extractor/render versions, extracted
content hash, and anchored passages. Search results remain untrusted external
data even when a provider calls them “clean” or “LLM-ready.”

### 11.3 Evaluation implications

Do not evaluate only returned-page count. A clean-room comparison should judge:
scope leakage, robots/policy compliance, trap resistance, unique canonical
recall, duplicate rate, partial-failure visibility, extraction fidelity by page
class, citation anchoring, p50/p95 completion time, bytes/pages/renders per
useful document, and reproducibility. No such benchmark was run here.

## 12. Fact / inference / recommendation ledger

| ID | Type | Claim | Confidence | Origin / reproducible check |
| --- | --- | --- | --- | --- |
| F1 | FACT | Map returns URLs; Crawl returns URLs plus extracted content. | High | S1-S4; inspect OpenAPI paths and tutorial comparison. |
| F2 | FACT | Both default to depth 1, breadth 20, limit 50, timeout 150 s. | High | S1, S2. |
| F3 | FACT | Depth max is 5, breadth max 500, but `limit` has no published max. | High | S1, S2 OpenAPI schemas. |
| F4 | FACT | Path/domain controls are regex arrays. | High | S1, S2, S9, S10. |
| F5 | FACT | `allow_external` defaults true; docs disagree on following versus return semantics. | High | Compare S1/S2 with S9 and S10. |
| F6 | FACT | Official JS README describes breadth-first crawling. | Medium | S8 pinned public README; not in API guarantee. |
| F7 | FACT | API claims graph traversal and parallel exploration. | High | S1, S2. |
| F8 | FACT | Crawl cost is mapping plus successful extraction; instruction doubles mapping rate. | High | S5 and instruction fields in S1/S2. |
| F9 | FACT | Advanced extraction includes JS-rendered/complex content claims and costs more. | High | S3, S4, S10. |
| F10 | FACT | Crawl's documented result lacks source capture and canonical provenance. | High | Negative schema inspection S1, S9, S10. |
| F11 | FACT | Crawl tutorial mentions `failed_results`; current Crawl schemas do not. | High | Compare S4 with S1, S9, S10, S17. |
| F12 | FACT | Endpoint rate limit is 100 RPM; 429 supplies `retry-after`. | High | S6. |
| F13 | FACT | Best practices advise robots and delays but do not promise managed enforcement. | Medium-high | Exact wording/context S3. |
| F14 | FACT | Search-crawler policy is separate and says robots.txt does not prevent indexing. | High | S11. |
| F15 | FACT | Privacy Policy permits query collection, improvement use, and limited third-party index sharing. | High | S12. |
| F16 | FACT | Platform terms/AUP place lawfulness and output verification on customer and restrict reverse engineering/competitive use. | High | S13, S15. |
| I1 | INFERENCE | Map and Crawl likely share a logical discovery plane. | High | Identical controls + additive pricing; deployment unknown. |
| I2 | INFERENCE | A frontier and visited state exist. | Medium-high | Necessary for practical graph traversal; representations unknown. |
| I3 | INFERENCE | Instructions affect a semantic priority/filter stage. | Medium | Behavior/cost establish semantics, not stage location. |
| I4 | INFERENCE | Advanced extraction is a routed lane that may render. | Medium | Capability statement; no guarantee every page renders. |
| I5 | INFERENCE | A 403 unsupported URL implies some URL policy, not comprehensive SSRF defense. | High | S1/S2 error contract; absence of detailed guarantee. |
| R1 | RECOMMENDATION | Exact-origin and public-network access should be default-deny. | High | F5, I5 and hostile-input threat model. |
| R2 | RECOMMENDATION | Semantic instructions must never override hard scope/budget. | High | F3-F5, I3. |
| R3 | RECOMMENDATION | Preserve captures, policy, attempt, edge, canonical, duplicate, and extractor lineage. | High | F10 and Curiosity evidence requirements. |
| R4 | RECOMMENDATION | Tavily may be studied or later adapted, not used as owned crawl foundation. | High | Proprietary hosted boundary and provenance gaps. |

## 13. Reproducible checks (public, no API key)

These checks download documentation/repositories only. They do not call
`api.tavily.com`, create an account, or crawl a target.

```sh
# Snapshot the current public machine-readable contract.
curl -fsS https://docs.tavily.com/documentation/api-reference/openapi.json \
  -o /tmp/tavily-openapi-2026-08-17.json
jq '.paths["/crawl"].post.requestBody.content["application/json"].schema,
    .paths["/crawl"].post.responses,
    .paths["/map"].post.requestBody.content["application/json"].schema,
    .paths["/map"].post.responses' \
  /tmp/tavily-openapi-2026-08-17.json

# Confirm no declared maximum on Crawl/Map limit and inspect allow_external.
jq '.paths | {crawl: .["/crawl"].post, map: .["/map"].post}
  | .. | objects | with_entries(select(.key == "limit" or
      .key == "allow_external" or .key == "maximum" or .key == "default"))
  | select(length > 0)' /tmp/tavily-openapi-2026-08-17.json

# Search public docs for unresolved crawler internals / contract mismatches.
curl -fsS https://docs.tavily.com/llms-full.txt -o /tmp/tavily-docs.txt
rg -n 'failed_results|robots\.txt|breadth-first|canonical|dedup|retry|polite|allow_external' \
  /tmp/tavily-docs.txt

# Inspect pinned official SDK snapshots without executing them.
curl -fsS https://raw.githubusercontent.com/tavily-ai/tavily-python/de924695765d5cf28bd1975c1cfca0cd07cd7005/tavily/tavily.py \
  -o /tmp/tavily-python-client.py
curl -fsS https://raw.githubusercontent.com/tavily-ai/tavily-js/c45065fe4546b62da86a3fac1cee2ffd816104c4/README.md \
  -o /tmp/tavily-js-readme.md
rg -n 'def _crawl|def _map|failed_results|breadth.first|allow_external' \
  /tmp/tavily-python-client.py /tmp/tavily-js-readme.md
```

Expected observations: Crawl/Map bounds and response fields match Sections 2
and 7; `limit.maximum` is absent; `failed_results` appears in tutorial/Extract
material but not the Crawl response schema; “breadth-first” is SDK README text;
and no complete canonicalization/retry/politeness contract appears.

## 14. Unknowns and questions requiring vendor or internal authority

### Blocking technical unknowns

1. Does Crawl enforce RFC 9309 robots rules? With what user-agent token,
   caching, redirect, unavailable-robots, and opt-out semantics?
2. What origin delay/concurrency and target `Retry-After` policy applies?
3. What exactly does `allow_external` gate, and are redirects checked?
4. What is the regex dialect, match input, precedence, and complexity limit?
5. What is the maximum `limit`, output/page byte size, redirect count, and
   renderer resource budget?
6. Is the frontier strictly breadth-first when instructions are present? How
   are links prioritized and depth counted?
7. Which fetch failures are retried, how often, and how are partial results
   returned/charged on timeout?
8. How are URL identity, redirect aliases, canonical tags, exact duplicates,
   and near duplicates handled?
9. What renderer/extractor versions and sanitization policies apply?
10. Does `request_id` bind to an immutable input/config snapshot? What logs and
    input/output are retained, for how long, and in which regions?

### Legal/privacy unknowns

1. Does a negotiated DPA prohibit improvement/training use for all Crawl input
   and output and bind subprocessors/regions/deletion SLAs?
2. What rights does a customer receive to retain, index, display, and derive
   from third-party crawled content? Source rights still govern regardless.
3. Which publisher opt-out/takedown mechanism applies to on-demand Crawl versus
   Tavily's Search index?
4. How should the RTBF privacy statement be reconciled with the general query
   collection policy?

These questions require vendor answers, counsel, security review, or authorized
testing. They are not grounds for unauthorised probing.

## 15. Bounded curiosity pass and stop

Scores are 1 (low) to 5 (high); cost is 1 (cheap) to 5 (expensive).

| Thread | Relevance | Value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Reconcile `allow_external` semantics | 5 | 5 | 4 | 1 | **Pursued:** REST, Python, and JS docs conflict; elevated to a security-significant unknown. |
| Verify Crawl `failed_results` | 5 | 5 | 4 | 1 | **Pursued:** tutorial says it exists; OpenAPI/SDK response contracts omit it. |
| Separate Search crawler robots policy from Crawl API | 5 | 5 | 4 | 1 | **Pursued:** prevented an invalid transfer of evidence. |
| Check official SDK for client retries/frontier disclosure | 4 | 4 | 3 | 2 | **Pursued:** pinned SDK shows transport wrapper/no Crawl retry and JS README supplies only breadth-first label. |
| Run free live calls against controlled public sites | 4 | 4 | 3 | 4 | `CURIOSITY_NO_GO`: caller forbade credentials/calls; behavior sampling would still not prove internals. |
| Probe localhost, cloud metadata, redirect, DNS rebinding | 5 | 5 | 3 | 5 | `CURIOSITY_NO_GO`: unsafe, unauthorized security testing and explicitly outside clean-room scope. |
| Decompile/minify SDK or infer proprietary scoring | 1 | 2 | 2 | 5 | `CURIOSITY_NO_GO`: platform/AUP restrictions and no decision value; public SDK wrapper is sufficient. |
| Benchmark extraction quality/cost | 3 | 4 | 3 | 4 | `CURIOSITY_NO_GO`: requires live calls, corpus, judgments, and budget; defer to separately authorized evaluation. |
| Jurisdiction-by-jurisdiction crawl legality | 5 | 5 | 4 | 5 | `CURIOSITY_NO_GO`: legal advice outside authority; counsel gate retained. |

**Coverage:** crawl/map contract; scope, depth, breadth, path/domain/external
controls; robots/politeness; frontier/retries; rendering/extraction;
canonicalization/dedup; output/provenance; limits/errors; safety/SSRF/privacy/
legal; pricing; bounded architecture inference; clean-room lessons; Curiosity
implications; confidence, checks, verdicts, and unknowns are covered.

**Saturation:** additional first-party pages repeated the OpenAPI/SDK contract
without resolving target politeness, retries, canonicalization, or provenance.

**Stop:** coverage and source saturation reached. Live verification, vendor
questions, legal review, and product selection require new caller authority.

## 16. Primary sources

All accessed 2026-08-17.

1. **[S1] Tavily, Crawl API reference / OpenAPI.**
   https://docs.tavily.com/documentation/api-reference/endpoint/crawl and
   https://docs.tavily.com/documentation/api-reference/openapi.json — canonical
   request, response, bounds, authentication, and errors.
2. **[S2] Tavily, Map API reference / OpenAPI.**
   https://docs.tavily.com/documentation/api-reference/endpoint/map — mapping
   request/response and shared traversal controls.
3. **[S3] Tavily, Best Practices for Crawl.**
   https://docs.tavily.com/documentation/best-practices/best-practices-crawl —
   control intent, examples, robots/delay advice, performance and failure notes.
4. **[S4] Tavily, Website Crawling and Content Extraction.**
   https://docs.tavily.com/examples/quick-tutorials/crawl-api — Map/Crawl split,
   advanced rendering claim, partial-failure note, and production guidance.
5. **[S5] Tavily, Credits & Pricing.**
   https://docs.tavily.com/documentation/api-credits — plan and endpoint credit
   prices and successful-page charging examples.
6. **[S6] Tavily, Rate Limits.**
   https://docs.tavily.com/documentation/rate-limits — Crawl RPM and 429
   `retry-after` contract.
7. **[S7] Tavily, API Introduction.**
   https://docs.tavily.com/documentation/api-reference/introduction — base URL,
   bearer auth, project/session/human tracking and stated hashing.
8. **[S8] Tavily, official JavaScript SDK README, commit
   `c45065fe4546b62da86a3fac1cee2ffd816104c4`.**
   https://github.com/tavily-ai/tavily-js/blob/c45065fe4546b62da86a3fac1cee2ffd816104c4/README.md — breadth-first label,
   public client examples, and MIT license notice.
9. **[S9] Tavily, JavaScript SDK reference.**
   https://docs.tavily.com/sdk/javascript/reference — typed request/response and
   external-return wording.
10. **[S10] Tavily, Python SDK reference.**
    https://docs.tavily.com/sdk/python/reference — typed request/response,
    external-follow wording, and extraction behavior.
11. **[S11] Tavily, Tavily Search Crawler.**
    https://docs.tavily.com/documentation/search-crawler — separate Search-index
    crawler identity, Googlebot condition, indexing/noindex policy.
12. **[S12] Tavily Privacy Policy, updated 2025-11-24.**
    https://www.tavily.com/privacy — Customer query collection, improvement,
    third-party index sharing, retention, transfers, and rights.
13. **[S13] Tavily Platform Terms, updated 2026-05-04.**
    https://www.tavily.com/terms — service/use restrictions, Customer Input,
    privacy, sensitive information, third-party services, and responsibility.
14. **[S14] Tavily, Logs API reference.**
    https://docs.tavily.com/documentation/api-reference/endpoint/logs — paid
    request logs, fields, and explicit input/output exclusion.
15. **[S15] Tavily Acceptable Use Policy, updated 2026-05-05.**
    https://www.tavily.com/acceptable-use-policy — lawful use, sensitive inputs,
    output verification, infringement, scraping, and reverse-engineering bounds.
16. **[S16] Tavily Changelog.**
    https://docs.tavily.com/changelog — Crawl beta origin, timeout, chunks,
    usage, and 2025–2026 contract chronology.
17. **[S17] Tavily, official Python SDK 0.7.27, commit
    `de924695765d5cf28bd1975c1cfca0cd07cd7005`.**
    https://github.com/tavily-ai/tavily-python/tree/de924695765d5cf28bd1975c1cfca0cd07cd7005 — public HTTP wrapper, timeout/error
    mapping, response handling, tests, and MIT license.
18. **[S18] Tavily, Right To Be Forgotten.**
    https://docs.tavily.com/documentation/Right-To-Be-Forgotten — independent
    Search-index claim, delisting process, and narrower search-privacy statement.
