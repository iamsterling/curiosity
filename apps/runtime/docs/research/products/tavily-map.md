# Tavily Map: clean-room standalone product reverse engineering

**Research and source-access date:** 2026-08-17  
**Subject:** Tavily `POST /map`, independently of Tavily Crawl, Extract, Search,
and Research  
**Status:** research record; not implementation, procurement approval, legal
advice, a performance claim, or authorization to call Tavily  
**Overall confidence:** high for the published request/response and price;
medium for traversal-shape inference; low for undocumented origin-fetch,
normalization, completeness, freshness, and policy behavior

## Executive verdict

**ADAPT the discovery contract; REJECT it as Curiosity's owned mapping
foundation.** Tavily Map is a synchronous, hosted URL-discovery surface: submit
one seed URL, optionally constrain graph distance, branching, total work, paths,
domains, external links, semantic intent, and elapsed wait, and receive a flat
list of discovered URL strings. Unlike Crawl, Map returns no page body and has
no extraction depth, content format, chunk, image, or favicon contract. Tavily's
own rule is “Map to find, Crawl to read” [S1-S4].

The strongest transferable idea is the product boundary itself: inspect a site
graph cheaply before authorizing content acquisition. The public surface also
has useful depth, breadth, total-limit, timeout, and explicit-filter concepts. It is
not, however, a defensible completeness or provenance record. The response does
not expose link edges, parent/depth, attempted or rejected URLs, frontier state,
robots decisions, HTTP observations, redirects, normalization, duplicate
relations, discovery time, cache state, sitemap comparison, stop reason, or
partial failures [S1-S3]. Semantic `instructions` are a relevance aid, not an
authority or completeness control.

For Curiosity:

- **ADOPT** discovery as a separate, cheaper primitive from fetch/extract.
- **ADAPT** depth/breadth/total/time controls into stronger local budgets for
  discovered URLs, attempted fetches, bytes, redirects, per-origin concurrency,
  and cost.
- **REJECT** Tavily's `allow_external=true` default and ambiguous “follow” versus
  “return” semantics; default to an exact normalized origin and distinguish
  discovery, fetch, and return scopes.
- **REJECT** a flat URL list as proof of a complete, fresh, canonical, unique, or
  policy-permitted site map.
- **DEFER** Tavily Map as an optional provider adapter until contract,
  legal/privacy/security, and owned-fixture evaluation gates are satisfied. It
  cannot be Curiosity's owned frontier or evidence chain.

## 1. Decision frame, bounded questions, and method

### 1.1 Decision and sub-questions

The decision is which behavior-level lessons from Tavily Map should shape a
provider-neutral Curiosity URL-discovery plane without importing Tavily code,
depending on proprietary algorithms, or expanding caller authority.

Bounded questions:

1. What exactly does `/map` accept and return, and how is it distinct from
   `/crawl`?
2. How do depth, breadth, total limit, path/domain regexes, external-link mode,
   instructions, and timeout constrain discovery?
3. What evidence exists for frontier order, robots compliance, politeness,
   retries, URL normalization, canonicalization, and deduplication?
4. What can be claimed about completeness, freshness, reproducibility, and
   provenance from a flat URL list?
5. What are the published limits, errors, rate limits, and prices?
6. What SSRF, hostile-input, privacy, publisher-rights, and contractual risks
   remain at this boundary?
7. Which architecture can be inferred clean-room, and which Curiosity patterns
   should be adopted, adapted, rejected, or deferred?

**Research boundary.** Only public first-party documentation, the public
OpenAPI description, public Tavily policy pages, and official public SDK source
at pinned commits were inspected. No API key, keyless or paid call, target-site
mapping, packet capture, vulnerability test, access bypass, proprietary code,
or service-output benchmark was used. The official SDKs identify MIT licenses;
that license applies to SDK code, not the hosted service or discovered pages
[S10][S11]. No SDK code was copied.

**Stop rule.** Stop after every requested category has direct evidence or an
explicit unknown, one bounded curiosity pass has pursued the highest-value
documentation contradictions, and further first-party sources repeat rather
than resolve material gaps.

### 1.2 Evidence labels

- **FACT** — directly supported by a cited public source or inspected SDK.
- **INFERENCE** — the narrowest behavior-level interpretation of facts, not an
  observation of Tavily internals.
- **UNKNOWN** — materially undocumented after bounded review.
- **RECOMMENDATION** — a Curiosity design/governance choice.
- Confidence is **high**, **medium**, or **low**.

Vendor documentation establishes what Tavily represents as offered. It does
not prove comparative quality, coverage, freshness, reliability, or legal
compliance for a particular site.

## 2. Standalone product boundary and public contract

### 2.1 Map is URL discovery, not Crawl

| Property | Tavily Map | Tavily Crawl contrast |
| --- | --- | --- |
| Endpoint | `POST https://api.tavily.com/map` | `POST /crawl` |
| Purpose | Traverse a site graph and return discovered URLs | Traverse and extract page content |
| Result item | URL string | Object with URL and transformed content |
| Shared traversal controls | instructions, depth, breadth, limit, path/domain regexes, external mode, timeout, usage | Same logical controls |
| Extraction controls | **None** | extraction depth, format, focused chunks, images, favicon |
| Price basis | successful pages returned | mapping plus successful extraction |
| Default endpoint rate limit | General: 100 development / 1,000 production RPM | Special Crawl limit: 100 RPM in both environments |

**FACT (high):** Tavily describes Map as graph traversal with parallel,
“intelligent” discovery and says Map returns only URLs, is faster and cheaper,
and is intended for site discovery, URL filtering, and sitemap generation.
Tavily's dedicated tutorial recommends Map followed by Extract when callers want
to choose which discovered URLs to read [S1-S5].

**INFERENCE (high):** URL-only output does not mean no origin pages are fetched.
Following HTML links, applying path filters, and semantic discovery generally
require acquiring some page/link representation. Public sources do not reveal
whether Map uses live HTTP, Tavily's index/cache, sitemaps, rendered DOMs, or a
combination for a given URL.

**Negative result (high):** do not project Crawl's extraction, rendered-page,
image, chunk, favicon, or `failed_results` behavior onto Map. They are absent
from Map's REST contract [S1].

### 2.2 Authentication and synchronous lifecycle

**FACT (high):** `/map` uses bearer-key authentication. The regular successful
response is HTTP 200, not an asynchronous job handle [S1][S7]. Official SDK
source explicitly rejects Map in keyless mode; public keyless positioning
supports Search and Extract rather than Map [S10][S11].

**FACT (high):** optional request attribution headers are `X-Project-ID`,
`X-Session-Id`, and `X-Human-Id`. Tavily says it hashes human identifiers before
processing or storage [S7]. These are customer/account analytics identifiers,
not source provenance.

**UNKNOWN:** server-side idempotency, cancellation after client disconnect,
whether a timeout halts queued/in-flight origin work, resumability, incremental
events, result retention, and duplicate-request coalescing. A 150-second HTTP
wait does not prove a durable map run or cancellation protocol.

### 2.3 Request fields

| Field | Published type/default/bound | Standalone Map meaning and caveat |
| --- | --- | --- |
| `url` | required string; no documented length/scheme bound | Seed/root URL. Examples include schemes, while the OpenAPI example also shows a bare host; accepted schemes, ports, credentials, fragments, and normalization are unspecified [S1-S3]. |
| `instructions` | optional string; no length bound | Natural-language guidance/semantic filtering. Raises mapping price from 1 to 2 credits per 10 successful pages [S1][S5]. |
| `max_depth` | integer 1–5; default 1 | Maximum graph distance from seed. Seed depth convention and redirect treatment are unspecified. |
| `max_breadth` | integer 1–500; default 20 | Described inconsistently as links per level and “i.e., per page.” Those are different bounds. |
| `limit` | integer >=1; default 50; no published maximum | Total links the mapper will “process” before stopping. Other docs call it a hard page/URL cap; processed, fetched, successful, and returned are not formally equated. |
| `select_paths` | optional array of regex strings | Include URL paths matching patterns. Match input, dialect, anchoring, precedence, and complexity limits are undocumented. |
| `exclude_paths` | optional array of regex strings | Exclude URL paths matching patterns; same ambiguities. |
| `select_domains` | optional array of regex strings | Include domains/subdomains matching patterns. Host normalization and redirect application are unspecified. |
| `exclude_domains` | optional array of regex strings | Exclude domains/subdomains matching patterns; inclusion/exclusion precedence is unspecified. |
| `allow_external` | Boolean; default `true` | REST/JS say external links may appear in final output; Python docs say external links may be followed. Material scope ambiguity [S1][S8][S9]. |
| `timeout` | float 10–150 seconds; default 150 | Maximum wait for the operation. Partial-result/cancellation semantics are undocumented. |
| `include_usage` | Boolean; default false | Adds credit usage. Value may be zero until the 10-success threshold is reached [S1][S5]. |

**Negative result (high):** Map has no contracted locale, country, user agent,
cookies, authentication context, request headers, sitemap mode, recrawl mode,
cache bypass, freshness target, render mode, per-host delay/concurrency, retry
budget, redirect limit, byte limit, MIME policy, URL score, or result ordering
control [S1-S3].

### 2.4 Response fields

The 200 envelope contains:

| Field | Published meaning | Evidentiary value |
| --- | --- | --- |
| `base_url` | Seed/base URL that was mapped | Minimal request echo; not defined as normalized, resolved, or redirect-final identity. |
| `results[]` | Discovered URL strings | Useful candidates only; no title, edge, score, status, time, or policy evidence. |
| `response_time` | Overall operation duration in seconds | Operational latency, not per-origin fetch time. |
| `usage.credits` | Optional metered usage | Post-hoc billing signal; thresholding can yield zero locally. |
| `request_id` | Identifier shareable with support | Provider trace key, not a stable map/capture/version ID. |

**UNKNOWN:** ordering guarantee, uniqueness guarantee, whether seed is always in
results, relationship between `limit` and result count, partial response on
timeout, and whether `base_url` preserves exactly the submitted string.

## 3. Discovery mechanics and hard/soft scope

### 3.1 Depth, breadth, and total work

Ignoring filtering and duplicates, a tree can grow approximately as
`1 + b + ... + b^d`. At advertised maxima (`b=500`, `d=5`), depth/breadth alone
are not a practical cost or safety bound. `limit` is therefore essential, but
its absent maximum and “processed” wording leave provider work semantics vague.

**FACT (high):** official guidance recommends beginning with depth 1, breadth
20, and an explicit conservative `limit`; it warns of exponential latency as
depth rises [S3][S4].

**RECOMMENDATION (high):** Curiosity should separately bound:

1. accepted seeds and normalized origins;
2. discovered outlinks and queued URLs;
3. origin fetch attempts, successes, and retries;
4. bytes downloaded/decompressed and parsing work;
5. redirects, renders, wall time, per-origin concurrency/delay, and credits;
6. returned candidates and serialized response bytes.

A single `limit` must never be treated as all six.

### 3.2 Path and domain regexes

**FACT (high):** the four select/exclude fields are regex arrays. Tavily examples
use `/docs/.*` for paths and `^docs\.example\.com$` for domains [S1-S4][S8][S9].

**UNKNOWN (material):**

- regex engine, flags, anchoring defaults, invalid-pattern errors, and defenses
  against pathological expressions;
- whether path input is raw, decoded, normalized, slash-collapsed, and whether
  it includes query or fragment;
- host treatment for case, IDNA, trailing dot, port, IPv4/IPv6 literals, public
  suffixes, and DNS aliases;
- select-versus-exclude precedence, seed exemptions, and empty-array behavior;
- whether checks occur on discovery, enqueue, fetch, redirect, or output;
- whether a filtered page can still be fetched to discover allowed descendants.

**RECOMMENDATION (high):** use parsed, normalized host/origin allowlists at the
security boundary. Regex may be a bounded convenience over normalized path
strings, never the primary SSRF/domain authorization mechanism. Every redirect
and renderer subrequest requires a fresh destination decision.

### 3.3 External domains: documented contradiction

**FACT (high):** OpenAPI says `allow_external` controls whether external-domain
links are included “in the final results list,” and the current JavaScript SDK
reference says whether to return them. The current Python SDK reference says
whether to **follow** them. All current contract/reference defaults are `true`
[S1][S8][S9]. The Map tutorial deliberately sets it to false in focused examples
but does not resolve the stage at which it applies [S2].

**ASSESSMENT (high):** this is security-significant contract drift. “Discover
but suppress,” “enqueue/fetch,” and “return” are distinct permissions. A caller
cannot safely infer one from another.

**RECOMMENDATION (high):** Curiosity needs three explicit scopes:

```text
discover_scope   which outlinks may be recorded as candidates
fetch_scope      which destinations may be contacted or followed
return_scope     which candidates may leave the provider adapter
```

All should default to the exact normalized seed origin, with external expansion
requiring caller authority and a finite host allowlist. Provider default values
must be overridden explicitly.

### 3.4 Natural-language instructions

**FACT (high):** instructions guide the mapper toward topics/content types and
double the mapping credit rate per ten successful returned pages [S1-S5].

**INFERENCE (medium):** the added cost and “semantic filtering” language are
consistent with a scoring/model stage that prioritizes or filters candidate
URLs/pages. Public evidence does not locate the stage: it may score anchors,
URLs, acquired page content, or some combination.

**UNKNOWN:** model/provider/version, deterministic behavior, score threshold,
false-negative rate, prompt-injection handling, whether instructions alter
frontier order, and whether they can interact unexpectedly with hard filters.

**RECOMMENDATION (high):** instructions are a soft relevance hint strictly
inside hard origin, path, policy, and budget gates. They cannot widen authority.
Store the original goal and any provider-returned selection evidence; Map
returns no scores/reasons, so that evidence is currently unavailable.

## 4. Frontier, robots, politeness, retries, and rendering

### 4.1 What public evidence supports

- **FACT (high):** Map is described as graph traversal that can explore
  hundreds of paths in parallel [S1].
- **FACT (medium):** Tavily's official JavaScript SDK README calls the related
  Crawl surface breadth-first, but does not make Map ordering a versioned API
  guarantee [S11]. The claim must not be silently transferred to Map.
- **FACT (medium):** Crawl best practices advise users to respect robots.txt and
  implement delays [S3]. This advice discusses crawler integrations and does
  not explicitly promise that Tavily's managed Map endpoint enforces either.
- **FACT (high):** client-to-Tavily 429 behavior and rate limits are documented;
  this is not evidence of Tavily-to-origin politeness [S6].

**INFERENCE (medium):** practical bounded graph traversal requires some
frontier, visited identity, and worker scheduling. Parallel path exploration is
consistent with concurrent workers. Nothing public identifies data structures,
queue ordering, worker topology, or isolation.

### 4.2 Robots evidence must remain surface-specific

Tavily separately documents its **Search index crawler**: it does not advertise
a differentiated user agent, will not crawl a page unavailable to Googlebot,
does not use `robots.txt` to prevent indexing, and uses a robots `noindex`
directive plus a re-fetch for delisting [S12].

**FACT/negative result (high):** that is not a Map contract. No inspected Map
source promises RFC 9309 processing, a user-agent token, robots fetch/cache
policy, fail-open/fail-closed behavior, `crawl-delay`, sitemap processing,
publisher opt-out, redirect re-evaluation, or returned robots decision [S1-S4].

**RECOMMENDATION (high):** Curiosity must make robots/publisher policy explicit,
versioned, and observable. Do not infer permission or compliance from a URL
appearing in Map output.

### 4.3 Politeness, retry, fetch, and rendering unknowns

No inspected first-party source establishes:

- per-origin concurrency, minimum delay, fairness, or target `Retry-After` use;
- DNS/TLS/HTTP retry classes, backoff/jitter, and attempt caps;
- redirects, loops, cross-origin/scheme handling, or credential stripping;
- fetch user agent, geo, locale, headers, cookies, authentication, or proxy use;
- page/response/decompression/DOM limits or MIME allowlist;
- JavaScript rendering, browser/runtime, iframe/resource requests, or waits;
- sitemap/feed ingestion, trap detection, calendar/facet/session suppression;
- live fetch versus cache/index reuse, negative caching, or snapshot consistency.

Map's lack of extraction output does not prove a static-HTTP-only path. Likewise,
Crawl's advanced rendering capability must not be projected onto Map.

## 5. URL normalization, canonicalization, and deduplication

**Negative result (high):** the Map contract does not document:

- scheme/host case folding, default-port removal, IDNA, fragment removal, dot
  segment resolution, slash handling, percent-encoding, or query ordering;
- tracking/session parameter removal;
- redirect-final identity or alias relationships;
- HTML `rel=canonical` handling;
- exact URL, exact-content, or near-duplicate suppression;
- duplicate return guarantees or charging behavior for aliases [S1-S4][S8-S10].

**INFERENCE (medium):** a finite graph traversal probably has a visited key, but
its form, scope, and lifetime are unknown. A visited key is not necessarily web
canonicalization and cannot establish content uniqueness.

**RECOMMENDATION (high):** preserve distinct identities:

1. submitted seed URL;
2. parsed/normalized candidate URL;
3. attempted fetch URL and redirect chain;
4. terminal response URL;
5. publisher-declared canonical URL as evidence, not authority;
6. capture/content hash and exact/near-duplicate cluster.

Deduplication must preserve aliases and link provenance. Mirrors or aliases
must not become fake independent corroboration, and canonical tags must not be
allowed to expand fetch authority.

## 6. Completeness, freshness, and provenance

### 6.1 Completeness cannot be established

Tavily marketing/reference language includes “comprehensive site maps” and the
tutorial says “discover all URLs on a domain” [S1][S2]. These are capability
descriptions, not measurable completeness guarantees.

**FACT (high):** default depth 1, breadth 20, limit 50, timeout 150 seconds,
optional semantic filtering, and path/domain exclusions intentionally bound or
remove candidates [S1]. A link traversal can also miss orphaned, form/search-
only, JavaScript-generated, authenticated, blocked, or failed pages.

**FACT/negative result (high):** response schema provides no:

- attempted/fetched/rejected/failed/unprocessed counts;
- remaining frontier or budget-exhaustion reason;
- per-depth counts, parent edges, discovery reason, or sitemap comparison;
- denominator or coverage estimate;
- inaccessible-page report or partial/complete status.

**INFERENCE (high):** `len(results)` shows returned candidates only. It cannot
distinguish “complete site,” “50-result limit reached,” “timed out,” “semantic
filter excluded most pages,” “origin failures,” or “frontier exhausted.”

**RECOMMENDATION (high):** call Map output a bounded `candidate_url_set`, never
an authoritative sitemap. Curiosity needs explicit stop reason, remaining-work
estimate, per-stage counts, rejected reasons, and optional reconciliation with
declared sitemaps and owned known-URL fixtures.

### 6.2 Freshness is unknown

**FACT (high):** Map exposes no cache control, bypass, recrawl interval,
`observed_at`, per-URL discovery time, source HTTP validator, or content/version
field [S1][S8][S9]. `response_time` is elapsed operation time, not freshness.

**UNKNOWN:** whether URLs are discovered from live pages, a Tavily cache/index,
sitemaps, prior traversals, or blended sources; cache keys/TTLs; cross-tenant
reuse; stale-link handling; and whether a map is internally snapshot-consistent.

**INFERENCE (high):** a request timestamp cannot truthfully be used as each
URL's observation time. “Real-time” marketing elsewhere does not create a
per-URL Map freshness guarantee.

### 6.3 Provenance is minimal

The flat result strings do not answer: “which source page linked this URL, at
what depth, fetched when, with what HTTP/robots/scope decision, through which
redirect, under which normalization and mapper version?”

Missing provenance fields include:

- input, normalized, terminal, and canonical URL as distinct values;
- parent/referrer URL, anchor/link evidence, depth, order, and selection reason;
- fetch/observation time, status, selected headers, MIME, bytes, and hash;
- robots/publisher-policy decision and policy snapshot;
- redirect chain and destination-scope decisions;
- map run/config/version, semantic scorer/version/score;
- duplicate/alias/cluster relation;
- terminal status, errors, truncation, and stop reason.

Paid Logs can later expose request timestamp, endpoint, server response time,
credits, masked API key, and request ID, but explicitly never input or output
[S13]. The support request ID is operational correlation, not a capture
manifest.

## 7. Limits, errors, and operational behavior

### 7.1 Published limits

- `max_depth`: 1–5;
- `max_breadth`: 1–500;
- `limit`: minimum 1, default 50, **no published maximum**;
- `timeout`: 10–150 seconds;
- Map uses general endpoint limits: 100 RPM for development keys and 1,000 RPM
  for production keys; only Crawl has the separate 100/100 RPM table [S6];
- production keys require a paid plan or PAYGO [S6].

**Negative result (high):** no Map-specific maximum is published for seed URL,
instructions, regex count/length/complexity, total output bytes, URL length,
redirects, origin bytes, queued candidates, or concurrent target origins.

### 7.2 HTTP errors

| Status | Published meaning |
| --- | --- |
| 400 | Invalid request; example: no starting URL |
| 401 | Missing/invalid API key |
| 403 | URL is not supported |
| 429 | Tavily request-rate limit exceeded |
| 432 | API-key or plan limit exceeded |
| 433 | PAYGO limit exceeded |
| 500 | Internal server error |

Errors use `detail.error`; 429 additionally carries `retry-after` under general
rate-limit guidance [S1][S6].

**FACT (high):** official Python SDK source maps 429 to a usage-limit exception,
403/432/433 together to a forbidden exception, 400/401 separately, and client
timeout separately. The Map method does not automatically retry [S10].

**UNKNOWN:** typed errors for DNS, TLS, robots denial, redirect, malformed URL,
regex failure, blocked/private address, unsupported scheme/media, target 4xx/5xx,
oversize content, parser failure, and semantic-model failure. No stable retryable
flag or failure stage exists at the REST boundary.

### 7.3 Partial and timeout semantics

Map's schema has no `failed_results`, warnings, run status, or unprocessed count
[S1]. Crawl guidance mentioning failed pages cannot be transferred to Map.

**UNKNOWN:** whether a 200 can be incomplete, whether timeout produces an error
or partial 200, whether completed URLs are returned after one target failure,
whether timed-out work continues, and how any partial success is charged.

**RECOMMENDATION (high):** normalize provider outcomes behind stable Curiosity
states (`complete`, `partial`, `timed_out`, `cancelled`, `failed`) and typed,
redacted attempt errors. Retry only explicit retryable classes within aggregate
page/time/cost budgets; do not automatically resubmit an ambiguous timeout.

### 7.4 SDK/API drift

**FACT (high):** the public JavaScript SDK is a thin `/map` adapter and returns
camel-cased envelope fields. The public Python method similarly forwards fields
and returns server JSON [S10][S11]. Neither reveals the server frontier.

Material drift/quality findings:

1. REST/JavaScript describe `allow_external` as return-list behavior, while
   Python reference describes following external links [S1][S8][S9].
2. REST defaults `allow_external=true`; integrations should not trust inherited
   defaults at a security boundary [S1].
3. Pinned Python source exposes an `include_images` argument on Map, but current
   Map OpenAPI and response schema do not contract image output; pinned
   JavaScript Map does not expose it [S1][S10][S11].
4. SDK option bags accept/pass extra fields, so client acceptance is not proof
   of server support [S10][S11].

**RECOMMENDATION (high):** pin adapter versions, send every security/cost value
explicitly, locally validate a provider-neutral schema, reject or quarantine
unknown response growth, and run owned conformance fixtures before adoption.

## 8. Pricing and cost semantics

**FACT (high):** Map charges by successful pages returned [S5]:

- regular mapping: 1 credit per 10 successful pages;
- mapping with `instructions`: 2 credits per 10 successful pages;
- failed map requests are not charged.

`include_usage` may report zero before enough successful pages accumulate to the
ten-page threshold [S1][S5]. Exact cross-request accumulation, rounding, and
attribution of the threshold-crossing credit are not fully documented.

Public plans on 2026-08-17 were:

| Plan | Credits/month | Price | Nominal price/credit |
| --- | ---: | ---: | ---: |
| Researcher | 1,000 | free | — |
| Project | 4,000 | $30 | $0.0075 |
| Bootstrap | 15,000 | $100 | $0.0067 |
| Startup | 38,000 | $220 | $0.0058 |
| Growth | 100,000 | $500 | $0.0050 |
| PAYGO | usage | — | $0.0080 |
| Enterprise | custom | custom | custom |

At full ten-page increments, regular mapping is nominally about
$0.0005–$0.0008 per successful returned URL on listed paid rates; instructions
double that. This excludes retries, failures, plan underuse, local validation,
downstream fetch/extract, storage, and governance costs.

**INFERENCE (high):** success/return-based pricing is attractive for candidate
discovery, but it gives no visibility into origin fetch work or completeness.
Instructions price semantic selection, not guaranteed additional coverage.

**RECOMMENDATION (high):** budget maximum returned URLs and provider credits
before dispatch, but also budget local/owned downstream work independently.
Reconcile request usage, result count, request ID, and account-level Map usage
[S21]; do not interpret request-local `usage=0` as free.

## 9. SSRF, hostile input, privacy, and legal boundary

### 9.1 SSRF and origin-scope risk

**FACT (medium):** 403 “URL is not supported” shows some server URL policy. No
public Map guarantee defines allowed schemes, ports, credentials, IP ranges,
DNS rebinding, redirects, or cloud-metadata defenses [S1].

Caller-supplied seed URLs plus default external expansion, regex domain rules,
redirects, parallel discovery, and potentially acquired page/link data form an
SSRF and egress-policy surface even though only URLs are returned.

**RECOMMENDATION (high):** Curiosity must reject credentials and sensitive
query material in seeds; allow only public `http`/`https`; normalize and resolve
hosts; deny loopback, private, link-local, multicast, reserved, and metadata
destinations; defend DNS rebinding; restrict ports; re-check every redirect;
and impose finite redirect, byte, time, origin, and result budgets **before**
disclosing a seed to a provider. Provider-side controls are defense in depth,
not Curiosity's authorization boundary.

Returned URLs are untrusted external data. They may contain prompt injection in
paths/queries, credentials/tokens, tracking IDs, malicious schemes after parsing
bugs, or enormous strings. Do not auto-fetch them or render them as trusted
links; a separate policy-approved fetch action is required.

### 9.2 Input privacy and retention

**FACT (high):** Tavily receives at least the seed URL, natural-language
instructions, scope patterns, API/account metadata, and optional tracking IDs.
Platform Terms define Customer Input broadly enough to include these values
[S14].

**FACT (high):** the Privacy Policy says Tavily collects query data/documents to
provide results, may use portions to improve responses unless contractually
specified otherwise, may share query data with third-party search-index
providers when its own index cannot retrieve content, and retains information
according to purpose/account/deletion criteria rather than a short fixed API
TTL [S15]. The policy does not isolate Map seeds/instructions from “query data.”

**FACT (high):** an account help page says setting “Allow Use of Query Data” OFF
means query data is not stored or used for improvements [S17]. The May 2026
Platform Terms grant broader processing/improvement rights over Customer Input,
and a FAQ advertises zero data retention without making the exact Map/plan/
contract scope clear [S14][S18]. A separately executed agreement may control.

**ASSESSMENT (high):** do not infer zero retention. Procurement must reconcile
the order form, DPA, account setting, terms, privacy policy, subprocessors,
regions, deletion/backups, and any model/index provider use.

**RECOMMENDATION (high):** never send intranet/private hostnames, presigned or
authenticated URLs, tokens, personal/sensitive instructions, customer secrets,
or regulated data. Omit `X-Human-Id` unless specifically approved; hashing is
pseudonymization, not anonymity.

### 9.3 Robots, publisher rights, and service terms

Robots rules are not a copyright or access license. Tavily's AUP says outputs
derive from public material but may be inaccurate, incomplete, inappropriate,
or infringing, and makes customers responsible for lawful use and independent
verification [S16]. Public availability does not grant reuse rights.

**Negative result (high):** Map returns no evidence for publisher terms,
robots/noindex/noarchive, paywall/access state, takedown, RTBF status, copyright,
database rights, or content retention permission. Search-index delisting pages
do not define on-demand Map behavior [S12][S19].

**FACT (high):** Platform Terms/AUP prohibit reverse engineering the hosted
service, discovering underlying algorithms, competitive access, bypass, and
unauthorized vulnerability testing [S14][S16]. This report therefore uses only
public contracts, openly published SDK transport code, and bounded behavior
inference. It does not infer or reproduce proprietary ranking/frontier logic.

**RECOMMENDATION (high):** Curiosity needs its own source eligibility,
robots/publisher policy, retention, deletion/takedown, attribution, and reuse
rules. Counsel must decide jurisdiction/corpus/use-specific legal questions.

## 10. Bounded architecture inference

The strongest architecture consistent with public behavior is:

```text
authenticated synchronous request
  -> account/rate/credit gate
  -> seed and request validation (some URLs yield 403)
  -> graph frontier with depth/breadth/limit/time envelope
  -> parallel link/page discovery + some visited identity
  -> path/domain/external filters
  -> optional semantic prioritization/filtering
  -> flat URL projection
  -> response/request/usage logging
```

This is conceptual, not a claim about deployment.

| Inference | Confidence | Boundary |
| --- | --- | --- |
| Frontier and visited state exist | Medium-high | Practically required for bounded graph traversal; identity/store/lifetime unknown. |
| Parallel scheduling exists | High | Tavily explicitly claims hundreds of paths in parallel; topology and politeness unknown. |
| Semantic stage exists when instructions are supplied | High | Documented guidance and doubled price; stage location/model unknown. |
| Map and Crawl share a logical discovery abstraction | High | Same traversal fields and Crawl price is map + extraction; shared code/deployment not proven. |
| Some URL-policy gate exists | High | 403 unsupported URL; comprehensive SSRF behavior not proven. |
| Live HTTP is always used | Low/unknown | Cache/index/sitemap/live blend is undisclosed. |
| Breadth-first ordering is guaranteed for Map | Low/unknown | Related SDK marketing says Crawl breadth-first; Map contract does not. |
| Robots/politeness subsystem exists | Low/unknown | Advice is not endpoint guarantee. |
| Standards-grade canonicalization/near-dedup exists | Low/unknown | No contract evidence. |

Do not infer cloud, proxies, parser/browser libraries, model provider, queue,
storage engine, cache, or cross-tenant implementation.

## 11. Clean-room lessons and Curiosity implications

### 11.1 Verdict ledger

| Product idea | Verdict | Confidence | Curiosity disposition |
| --- | --- | --- | --- |
| Separate URL discovery from content acquisition | **ADOPTED** | High | Keep `map/discover` distinct from `fetch/capture`, `extract`, and passage selection. |
| Map then select then Extract | **ADAPTED** | High | Useful staged-authority pattern, but selection and fetch require local policy/budget. |
| Depth + breadth + total limit + timeout | **ADAPTED** | High | Add candidate/fetch/byte/redirect/render/per-origin/response/cost limits. |
| Regex path/domain controls | **ADAPTED** | High | Parsed host allowlists for security; bounded regex only on normalized paths. |
| `allow_external=true` | **REJECTED** | High | Exact-origin default; separate discover/fetch/return permissions. |
| Natural-language instructions | **ADAPTED** | High | Soft priority only; cannot override authority, filters, robots, or budget. |
| Flat URL list as sitemap/completeness proof | **REJECTED** | High | Call it candidates; require frontier/edge/stop/coverage evidence. |
| Request ID as provenance | **REJECTED as sufficient** | High | Retain only as provider trace ID. |
| Hosted proprietary Map as owned frontier | **REJECTED** | High | No frontier custody, fetch evidence, canonicalization, or reproducibility. |
| Tavily Map adapter | **DEFERRED** | Medium | Only after legal/security/privacy review and owned-fixture conformance. |
| MIT SDK code | **DEFERRED** | High | Unneeded for research; license does not transfer service internals or page rights. |

### 11.2 Provider-neutral discovery request

Conceptual requirements, not an implementation prescription:

```text
seeds[]
authority:
  normalized_origin_allowlist
  discover_scope
  fetch_scope
  return_scope
policy:
  robots_mode
  publisher_policy_snapshot
filters:
  normalized_path_rules
goal?:                     soft only
budget:
  max_depth
  max_outlinks_per_page
  max_discovered_urls
  max_fetch_attempts
  max_bytes
  max_redirects
  per_origin_concurrency
  min_origin_delay
  deadline_ms
  max_provider_credits
idempotency_key
```

### 11.3 Provider-neutral discovery response

```text
run:
  status                    complete | partial | timed_out | cancelled | failed
  stop_reason               frontier_exhausted | page_budget | byte_budget |
                            deadline | policy | provider_limit | failure
  counts                    discovered, queued, attempted, fetched, rejected,
                            failed, returned, remaining_estimate?
  provider_trace_id?
candidates[]:
  submitted_seed
  discovered_url
  normalized_url?
  parent_url?
  depth?
  discovery_evidence?
  observed_at?              unknown remains unknown
  selection_reason?
  policy_decision?
  aliases[]
  duplicate_cluster?
  untrusted_external_data = true
errors[]:
  stage, category, retryable, redacted_reason
usage:
  provider_reported, locally_estimated
```

A Tavily adapter can truthfully populate the returned strings, response time,
usage, and provider trace. It must mark missing edge, depth, observation,
policy, canonical, duplicate, failure, and stop fields as unknown—not fabricate
them from the request timestamp or list order.

### 11.4 Evaluation gates before reconsideration

Only organization-owned, public-domain, or explicitly permitted fixtures; no
third-party hostile probing.

1. **Contract:** default/explicit bounds, invalid values, regex errors,
   403/429/432/433, timeout shape, SDK drift, ordering/duplicates, and output cap.
2. **Scope:** exact origin, subdomain, external link, redirect, IDNA, port,
   query/fragment, select/exclude precedence, and seed exemption.
3. **Coverage:** controlled graph with orphans, cycles, duplicates, canonical
   aliases, pagination/traps, sitemap-only URLs, and known denominator.
4. **Freshness:** revision/add/remove controlled links over time; never infer a
   cache policy from one call.
5. **Politeness/policy:** vendor contractual disclosure plus owned origin logs
   for user agent, robots, delay/concurrency, retries, and target Retry-After.
6. **Safety:** Curiosity blocks private/metadata/rebinding destinations before
   provider disclosure; owned redirect and oversized-link fixtures only.
7. **Operations/cost:** p50/p95 duration, result utility per credit, threshold
   reconciliation, ambiguous timeout, and partial failure visibility.
8. **Governance:** current terms/order form/DPA, retention/improvement setting,
   subprocessors/regions, publisher/takedown treatment, and exit strategy.

## 12. Fact / inference / recommendation ledger

| ID | Type | Claim | Confidence | Evidence / disposition |
| --- | --- | --- | --- | --- |
| F1 | FACT | Map returns a flat URL list and no page content; Crawl is a distinct extraction surface. | High | [S1-S4]; boundary **ADOPTED**. |
| F2 | FACT | Defaults are depth 1, breadth 20, limit 50, timeout 150 s, external true. | High | [S1][S8][S9]. |
| F3 | FACT | Depth max is 5 and breadth max 500; no `limit` maximum is published. | High | [S1] OpenAPI. |
| F4 | FACT | Path/domain fields are regex arrays; semantics and precedence are not specified. | High | [S1-S4][S8][S9]. |
| F5 | FACT | REST/JS define external return behavior; Python defines external following. | High | [S1][S8][S9]; ambiguity **REJECTED**. |
| F6 | FACT | Instructions provide semantic focus and double cost per ten successful pages. | High | [S1-S5]. |
| F7 | FACT | Map charges 1 credit/10 successful pages, or 2/10 with instructions; failed map requests are uncharged. | High | [S5]. |
| F8 | FACT | Map uses general 100 development / 1,000 production RPM limits, unlike Crawl's separate 100/100. | High | [S6]. |
| F9 | FACT | The response lacks edge, depth, fetch, robots, canonical, duplicate, freshness, and complete/partial evidence. | High | Negative schema inspection [S1][S8][S9]. |
| F10 | FACT | Map-specific robots/politeness/retry guarantees were not found; Search crawler policy is a separate surface. | High | [S1-S4][S12]. |
| F11 | FACT | Python source exposes undocumented Map `include_images`; REST/JS do not contract it. | High | [S1][S10][S11]. |
| F12 | FACT | Public legal/privacy materials place lawful input/output use and sensitive-data control on the customer and do not establish a short Map retention TTL. | High | [S14-S18]. |
| I1 | INFERENCE | Map needs a frontier, some visited identity, and parallel scheduling. | Medium-high | F1-F3 and graph/parallel claim; internals unknown. |
| I2 | INFERENCE | Instructions activate semantic prioritization/filtering, but stage and model are unknown. | Medium | F6. |
| I3 | INFERENCE | A flat list cannot establish complete, fresh, canonical, unique site coverage. | High | F2-F4, F9. |
| I4 | INFERENCE | 403 proves some URL gate, not comprehensive SSRF protection. | High | [S1]. |
| R1 | RECOMMENDATION | Default all discovery/fetch/return scopes to exact normalized origin. | High | **ADOPTED** safety rule. |
| R2 | RECOMMENDATION | Keep semantic goals subordinate to hard scope, robots, and budget. | High | **ADOPTED** authority rule. |
| R3 | RECOMMENDATION | Preserve frontier, edge, attempt, policy, URL identity, duplicate, and stop provenance. | High | **ADOPTED** evidence requirement. |
| R4 | RECOMMENDATION | Treat Tavily Map as candidates/provider trace, not owned map or evidence. | High | Foundation **REJECTED**; adapter **DEFERRED**. |

## 13. Material unknowns and required checks

1. Exact accepted schemes, ports, URL length, credentials, IP policy, redirect
   and DNS-rebinding behavior.
2. Whether Map uses live fetch, Search index, cache, sitemap, rendered DOM, or a
   blend; cache TTL/key/bypass and snapshot consistency.
3. Depth convention, redirect depth, `max_breadth` per-level versus per-page,
   and exact relationship among processed, fetched, successful, and returned.
4. External-follow versus external-return behavior and filter enforcement on
   redirects and descendants.
5. Regex engine/input/precedence/count/length/complexity and invalid patterns.
6. Frontier order, tie-breaking, semantic priority, per-origin fairness, and
   visited identity lifecycle.
7. Robots user-agent/cache/failure behavior, origin delay/concurrency, target
   Retry-After, retries, and attempt caps.
8. URL normalization, redirect aliases, canonical tags, exact duplicates,
   near-duplicates, ordering, and uniqueness guarantees.
9. Timeout cancellation, partial result/error shape, unprocessed frontier, and
   charging for interrupted work.
10. Completeness denominator, stop reason, sitemap reconciliation, orphaned and
    client-generated URL discovery.
11. Result and origin byte limits, MIME/parser/render behavior, and hostile-link
    handling.
12. Map-specific input/output/log retention, regions/subprocessors,
    improvement/training exclusion, account-setting enforcement, and deletion.
13. Rights to retain/use discovered URLs and source-specific robots, terms,
    privacy, database-right, takedown, and attribution obligations.
14. Comparative recall, freshness, cost, latency, and reliability on a
    predeclared permitted fixture graph.

Absence from public documentation means **unknown**, not that Tavily lacks an
internal safeguard or behavior.

## 14. Bounded curiosity pass

Scores are 1–5 for relevance (R), decision value (V), novelty (N), and cost (C);
priority is `R + V + N - C`.

| Thread | R | V | N | C | Score | Action/result |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Reconcile external follow versus return | 5 | 5 | 4 | 1 | 13 | **Pursued.** REST/JS say return; Python says follow; retained as security-significant contradiction [S1][S8][S9]. |
| Separate Map rate limit from Crawl | 5 | 4 | 3 | 1 | 11 | **Pursued.** Rate table gives Map the general 100/1,000 RPM while Crawl alone is 100/100 [S6]. |
| Check Map-only SDK drift | 4 | 4 | 4 | 1 | 11 | **Pursued.** Pinned Python source has undocumented `include_images`; JS/REST omit it [S1][S10][S11]. |
| Resolve robots evidence by surface | 5 | 5 | 3 | 2 | 11 | **Pursued.** Best-practice advice and Search-crawler policy do not establish Map enforcement [S3][S12]. |
| Find Map completeness/freshness proof | 5 | 5 | 4 | 2 | 12 | **Pursued to saturation.** Tutorial/marketing claims are not accompanied by coverage, cache, observation, or stop fields [S1-S4]. |
| Make live free/paid calls against controlled sites | 4 | 4 | 3 | 4 | 7 | **CURIOSITY_NO_GO:** caller prohibited calls/credentials; isolated behavior would not prove general policy. |
| Probe localhost, metadata, redirects, or rebinding | 5 | 5 | 3 | 5 | 8 | **CURIOSITY_NO_GO:** unauthorized security testing and outside clean-room boundary. |
| Infer proprietary semantic model/frontier algorithm | 1 | 2 | 3 | 5 | 1 | **CURIOSITY_NO_GO:** terms-sensitive, unidentifiable, and unnecessary for contract lessons. |
| Benchmark Map versus other providers | 2 | 3 | 2 | 5 | 2 | **CURIOSITY_NO_GO:** outside standalone Tavily Map frame and lacks corpus/budget authority. |
| Jurisdiction-by-jurisdiction mapping legality | 5 | 5 | 4 | 5 | 9 | **CURIOSITY_NO_GO:** counsel task requiring exact site, data, use, and jurisdiction. |

**Stop condition reached:** requested coverage and primary-source saturation.
The best contradictions were resolved as far as public evidence permits.
Remaining high-value unknowns require vendor contractual disclosure, counsel, or
separately authorized owned-fixture evaluation. No autonomous follow-up is
authorized by this report.

## 15. Checks performed

- Read repository `AGENTS.md` before research and kept provider-neutral
  contracts, untrusted external data, bounded behavior, and attribution in view.
- Inspected the Map REST page/OpenAPI, dedicated Map tutorial, Crawl best
  practices only where they explicitly discuss Map/shared traversal, pricing,
  rate limits, usage/logging, legal/privacy pages, and official SDKs.
- Used primary Tavily sources accessed 2026-08-17; no search snippet is evidence.
- Inspected official public SDK transport code at pinned commits; no code was
  copied and no proprietary implementation was inspected.
- Made no Tavily API/keyless/paid call, supplied no credential, mapped no site,
  and performed no bypass, vulnerability probe, deployment, or production
  mutation.
- Kept Map separate from Crawl: extraction/render/content/partial-page claims
  were not imported into the Map contract.
- Retained negative results and marked architecture statements as inference.
- File-scope check: only `docs/research/products/tavily-map.md` is written by
  this task.

## Sources

All web sources accessed **2026-08-17**.

- **[S1]** Tavily, “Tavily Map” API reference and embedded OpenAPI — canonical
  request, response, limits, authentication, and errors:
  https://docs.tavily.com/documentation/api-reference/endpoint/map
- **[S2]** Tavily, “Site Structure Discovery with Map” — standalone Map
  tutorial, Map/Crawl boundary, filters, and Map + Extract workflow:
  https://docs.tavily.com/examples/quick-tutorials/map-api
- **[S3]** Tavily, “Best Practices for Crawl” — shared traversal controls,
  Map/Crawl comparison, robots/delay advice, and Map-first workflow:
  https://docs.tavily.com/documentation/best-practices/best-practices-crawl
- **[S4]** Tavily, “Website Crawling and Content Extraction” — Map/Crawl
  distinction and production Map-first guidance:
  https://docs.tavily.com/examples/quick-tutorials/crawl-api
- **[S5]** Tavily, “Credits & Pricing” — plans, Map price, instruction uplift,
  and failed-map charging:
  https://docs.tavily.com/documentation/api-credits
- **[S6]** Tavily, “Rate Limits” — general Map limits, separate Crawl limits,
  production-key requirement, and 429 `retry-after`:
  https://docs.tavily.com/documentation/rate-limits
- **[S7]** Tavily, API Introduction — base URL, bearer auth, project/session/
  human tracking headers, and human-ID hashing claim:
  https://docs.tavily.com/documentation/api-reference/introduction
- **[S8]** Tavily, Python SDK Reference, Map section — request/response fields
  and external-follow wording:
  https://docs.tavily.com/sdk/python/reference
- **[S9]** Tavily, JavaScript SDK Reference, Map section — request/response
  fields and external-return wording:
  https://docs.tavily.com/sdk/javascript/reference
- **[S10]** Tavily, official Python SDK, commit
  `de924695765d5cf28bd1975c1cfca0cd07cd7005`, especially
  `tavily/tavily.py` — Map transport, keyless gate, timeout/error mapping, extra
  fields, and MIT license:
  https://github.com/tavily-ai/tavily-python/tree/de924695765d5cf28bd1975c1cfca0cd07cd7005
- **[S11]** Tavily, official JavaScript SDK, commit
  `c45065fe4546b62da86a3fac1cee2ffd816104c4`, especially `src/map.ts`,
  `src/types.ts`, and README — Map transport/types, Crawl breadth-first label,
  keyless boundary, and MIT license:
  https://github.com/tavily-ai/tavily-js/tree/c45065fe4546b62da86a3fac1cee2ffd816104c4
- **[S12]** Tavily, “Tavily Search Crawler” — separate Search-index crawler,
  user-agent/Googlebot condition, robots/noindex, and delisting policy:
  https://docs.tavily.com/documentation/search-crawler
- **[S13]** Tavily, Logs API — paid per-request logs, Map filtering, returned
  fields, and explicit input/output exclusion:
  https://docs.tavily.com/documentation/api-reference/endpoint/logs
- **[S14]** Tavily, Platform Terms of Service, updated 2026-05-04 — Customer
  Input, service restrictions, reverse engineering, third parties, sensitive
  data, processing/improvement rights, and customer responsibilities:
  https://www.tavily.com/terms
- **[S15]** Tavily, Privacy Policy, updated 2025-11-24 — query/document
  collection, improvement, third-party search indexes, retention, and transfers:
  https://www.tavily.com/privacy
- **[S16]** Tavily, Acceptable Use Policy, updated 2026-05-05 — prohibited
  inputs/uses, output verification, lawfulness, infringement, probing, and
  reverse-engineering bounds:
  https://www.tavily.com/acceptable-use-policy
- **[S17]** Tavily Help, “Understanding the ‘Allow Use of Query Data’ Setting” —
  ON/OFF storage and improvement representation:
  https://help.tavily.com/articles/4205958832-understanding-the-allow-use-of-query-data-setting
- **[S18]** Tavily, FAQ — product/privacy positioning including zero-retention
  marketing claim:
  https://docs.tavily.com/faq/faq
- **[S19]** Tavily, “Right To Be Forgotten” — separate Search-index delisting
  process and privacy statement:
  https://docs.tavily.com/documentation/Right-To-Be-Forgotten
- **[S20]** Tavily, Changelog — Map timeout and usage chronology:
  https://docs.tavily.com/changelog
- **[S21]** Tavily, Usage API — key/account-level `map_usage` accounting:
  https://docs.tavily.com/documentation/api-reference/endpoint/usage
