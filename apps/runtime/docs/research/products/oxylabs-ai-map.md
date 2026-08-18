# Oxylabs AI-Map: clean-room reverse-engineering dossier

**Research and source access date:** 2026-08-17  
**Decision:** which AI-Map discovery-contract ideas Curiosity should adopt,
adapt, reject, or defer without relying on Oxylabs' undisclosed service
implementation.  
**Product boundary:** Oxylabs **AI-Map only**. AI-Crawler is discussed only to
separate extraction from mapping and to test whether Map depends on that public
product.  
**Status:** research record, not implementation, procurement approval,
benchmark, legal advice, or authority to call the service.

## Executive verdict

**ADAPT the Map/discover abstraction; DEFER an Oxylabs AI-Map adapter (high
confidence).** The current official SDKs expose a materially better contract
than the thin product page: an asynchronous map run accepts a seed URL,
optional path keywords and natural-language intent, depth (default 1, maximum
5), URL-return limit (advertised maximum 10,000), sitemap inclusion, JavaScript
rendering, geolocation, subdomain/external-domain switches, and a credit cap.
Submission returns a run ID; a second endpoint is polled for status and a final
list of URLs [S1-S6]. These are useful ideas for a provider-neutral discovery
operation.

**Do not treat AI-Map as a complete site inventory or evidence-producing
crawler (high confidence).** Oxylabs markets “all” URLs, “systematic”
exploration, “Full Crawl,” and more comprehensive results, but publishes no
coverage guarantee, denominator, frontier residue, per-URL discovery edge,
HTTP result, timestamp, redirect, canonical identity, duplicate treatment,
robots decision, cache state, or partial-failure ledger. Depth, output limit,
credit cap, optional semantic filtering, inaccessible pages, and a five-minute
SDK wait all permit valid but incomplete results [S1-S5]. A returned URL is a
discovery hint—not proof that the URL was fetched, is current, is unique, is in
scope, or contains the requested subject.

**AI-Map depends logically on crawl/acquisition work, not demonstrably on the
public AI-Crawler product (high confidence).** Map is billed for non-JS or JS
“scraping jobs,” can render JavaScript, uses a sitemap as an optional seed, and
has crawl depth. It therefore requires some fetch/render/link-discovery plane.
No inspected source says that Map calls the separate AI-Crawler API. AI-Crawler
adds content extraction and different output/billing operations; representing
it as Map's implementation would be unsupported [S1-S6].

**Most important Curiosity lesson:** keep discovery cheap and separate from
content capture, but make scope, budgets, identity, completeness, failures, and
provenance locally owned. Natural-language intent may rank/filter a bounded
frontier; it must never grant network authority or silently redefine
completeness.

## 1. Frame, bounded questions, and method

### 1.1 Questions

1. What request, run, polling, status, and result contract is publicly
   observable for AI-Map?
2. What exactly bounds domain/path scope, depth, returned URLs, acquisition
   work, cost, and elapsed time?
3. Does “Map” use live crawling, sitemap data, rendering, AI filtering, or the
   separate AI-Crawler product—and what remains unknown?
4. What evidence exists for completeness, freshness, URL normalization,
   canonicalization, deduplication, and result provenance?
5. What limits, errors, billing, privacy, security, and legal constraints matter
   to Curiosity?
6. What minimal architecture can be inferred without claiming proprietary
   internals?
7. Which patterns should Curiosity adopt, adapt, reject, or defer?

### 1.2 Evidence and clean-room boundary

Primary evidence was limited to public Oxylabs documentation, release notes,
pricing and legal pages, official package registries, and the official Python
and JavaScript SDK repositories. The Python package inspected was PyPI
`oxylabs-ai-studio` **0.2.22**, wheel SHA-256
`ba0368f220b1bbdcaf47110a50166dcec03d911e52c7ddf7ca756e93bab33465`,
matching repository commit `bf5649da8797fa58e6655a656b2eec3dd77f4df7`.
The JavaScript source was pinned to npm 1.0.29's `gitHead`
`c4d57ad080fb831eb943ebe35892d7d7095be87c`; repository `main` at access time
was the immediately following merge commit
`d64f3cef7439e51c1a28a93514ead053b0b550da`, whose Map files are unchanged
[S4][S5][S11][S12].

No account was created. No credential, free or paid request, target crawl,
browser execution, endpoint probe, availability/performance monitoring,
security test, CAPTCHA/access bypass, decompilation, or non-public material was
used. SDK source was read only to characterize the published client boundary;
no source text, type, prompt, or implementation is transferred into Curiosity.
Both official SDK repositories identify their code as MIT, while that license
does **not** license the hosted service, its outputs, target content, or
third-party AI [S4][S5][S7].

Labels:

- **FACT** — directly stated or observable in a cited first-party source.
- **INFERENCE** — the narrowest explanation consistent with cited facts, not a
  claim about undisclosed deployment or algorithms.
- **UNKNOWN / NEGATIVE RESULT** — a material behavior not established by the
  inspected sources.
- **RECOMMENDATION** — a Curiosity design or governance choice.
- Confidence is **high**, **medium**, or **low**.

Source precedence for conflicting contract text is: newer pinned SDK/package
behavior and dated release notes; then current pricing/legal text; then the
undated AI-Map overview. This does not turn an SDK default into a server SLA.

## 2. Product and discovery contract

### 2.1 Map is discovery, not extraction

**FACT (high):** AI-Map returns a list of URL strings matching site-level
criteria. AI-Crawler identifies pages and extracts Markdown or schema-shaped
content from them. The FAQ summarizes this as Map finding *where* to collect
and Crawler getting the data [S1][S2].

**FACT (high):** the December 2025 “AI-Map Revamp” added a “Full Crawl” mode,
raised the maximum URL count to 10,000, added sitemap integration enabled by
default, and made keyword and natural-language filtering optional. Oxylabs says
the revamp reduced reliance on AI for faster and more comprehensive results
[S3].

**INFERENCE (high):** there are now at least two logical Map modes:

1. broad traversal with no relevance filter (“Full Crawl” in the UI/release
   vocabulary); and
2. traversal plus URL-keyword and/or natural-language filtering.

No `full_crawl` field exists in either current SDK. The mode is likely expressed
by the presence or absence of `search_keywords`/`user_prompt`, but that mapping
is **not** a normative server contract [S3-S5].

### 2.2 Wire-level lifecycle exposed by both SDKs

| Step | Published client behavior | Contract strength |
| --- | --- | --- |
| Authenticate | `x-api-key` header to `https://api-aistudio.oxylabs.io` | **FACT (high)** in both SDKs [S4][S5]. |
| Submit | `POST /map` with JSON request | **FACT (high)** [S4][S5]. |
| Correlate | response contains `run_id`; JS also tolerates `id` | **FACT (high)**; no idempotency key is exposed [S4][S5]. |
| Poll | `GET /map/run/data?run_id=...` | **FACT (high)** [S4][S5]. |
| In progress | SDK status vocabulary includes `pending`/`running`; clients continue polling for any nonterminal value | **FACT (medium-high)**; no standalone server schema is published [S4][S5]. |
| Complete | Python recognizes `completed`; JS recognizes `completed` or `success` and returns `data` | **FACT (high)** [S4][S5]. |
| Failed | Python recognizes `failed` and returns an `AiMapJob` with `data=None`; JS recognizes `failed` or `error` and throws | **FACT (high)**; cross-SDK semantic mismatch [S4][S5]. |
| Client wait | Both convenience methods poll every 5 seconds for at most 300 seconds | **FACT (high)** client behavior, not a server deadline [S4][S5]. |
| Result | Product examples show `data` as URL strings; Python permits `dict` or `list[str]`, JS uses untyped `any` | **FACT (high)** that the declared result schema is weak [S1][S4][S5]. |

**INFERENCE (high):** AI-Map is server-asynchronous even though `map()` looks
synchronous to SDK callers. A local timeout ends polling, not demonstrably the
server run. There is no published cancellation request, deadline propagation,
run deletion, resumable cursor, webhook, event stream, result expiry, or
exactly-once guarantee.

**RECOMMENDATION (high):** Curiosity should model a durable `DiscoveryRun` with
submission idempotency, explicit local deadline, cancellation, reconciliation,
incremental events, explicit complete/partial/budget-exhausted/timed-out/
cancelled/failed terminal states, and a separate result cursor. A provider
convenience poller must not own the lifecycle.

### 2.3 Effective request contract

The current Python and JavaScript SDKs converge on these Map fields [S4][S5]:

| Field | Public meaning/default/bound | Assessment |
| --- | --- | --- |
| `url` | Required seed URL or domain | No documented scheme, length, port, redirect, path-scope, IDNA, or private-address rule. |
| `search_keywords` | Optional string array; Python describes URL-path keyword filtering | Matching semantics, case, decoding, tokenization, and limits are unknown. |
| `user_prompt` | Optional natural-language relevance instruction; combinable with keywords | Soft selection signal, not a safe scope rule. Prompt length/language/model behavior unknown. |
| `max_crawl_depth` | Default 1; documented range 1–5 | Strong hop bound in name only; seed depth and sitemap depth conventions are unknown. |
| `limit` | Python default 25; JS docs claim default 50; advertised maximum 10,000 | Bounds returned URLs, not proven fetches/discoveries. Caller must set it explicitly. |
| `include_sitemap` | Default true; sitemap is a seed | Discovery source is not identified per result; sitemap location/recursion/caching unknown. |
| `allow_subdomains` | Default false | “Include” may gate discovery, fetching, return, redirects, or all; not defined. |
| `allow_external_domains` | Default false | Same ambiguity; an unsafe widening switch without a domain allowlist. |
| `render_javascript` | Default false | Establishes a browser-capable discovery lane; engine, waits, resources, and child-request scope unknown. |
| `geo_location` | Optional ISO2 or canonical country; selects proxy location | Requested acquisition context, not provenance or content truth. |
| `max_credits` | Optional integer cap | Valuable spend circuit breaker; validation range and terminal behavior are unknown. |

**FACT (high):** `search_keywords`, `user_prompt`, crawl depth, sitemap,
subdomain/external, and `max_credits` are absent from the AI-Map page's request
table but present in both maintained SDKs. This is material documentation drift,
not a reason to infer more hidden fields [S1][S4][S5].

### 2.4 Documentation contradictions

1. **Mandatory prompt:** the AI-Map page marks `user_prompt` mandatory; the
   dated revamp says NLP filtering is optional, and both SDKs make it optional.
   **Resolution:** optional in the current effective SDK contract [S1][S3-S5].
2. **Wrong field in product table:** the AI-Map page labels `output_format` as
   “Max number of sources to return,” defaults it to 25, and shows
   `return_sources_limit` in its example. Current SDKs use `limit`; Map has no
   output-format field [S1][S4][S5]. **Resolution:** the overview table/example
   is stale or erroneous; use no unchecked payload shape in an adapter.
3. **Default limit:** Python 0.2.22 sends `limit=25`; JS README says default 50
   and the JS client omits the field when unspecified. **Resolution:** server
   default is unknown and SDK callers may differ; always set an explicit local
   limit [S4][S5].
4. **Mapping depth:** the overview tells users to configure depth but omits it
   from its table. Current SDKs expose `max_crawl_depth` 1–5 [S1][S4][S5].
5. **Free trial:** product pages/FAQ say 1,000 credits, while the newer general
   quick start says 10,000. Current pricing advertises a trial without fixing
   its credit amount in the fetched page [S1][S2][S13]. **Resolution:** trial
   size is volatile/unknown and irrelevant to production budgeting.
6. **Request rate:** pricing shows 1/5/10/25 requests per second by plan, while
   AI Studio Terms §5.2.5 states a five-connections-per-second limit [S6][S7].
   **Resolution:** contractual entitlement above 5 requires written clarity.

**RECOMMENDATION (high):** an adapter, if ever authorized, should pin a tested
HTTP schema and set every safety/cost field explicitly. SDK README prose is not
a substitute for OpenAPI, and provider defaults must not cross Curiosity's
provider-neutral boundary.

## 3. Scope, coverage, and completeness

### 3.1 What is actually bounded

**FACT (high):** current public controls bound maximum graph depth, returned
URL count, whether sitemap URLs seed discovery, whether subdomains/external
domains may be included, whether JavaScript is rendered, requested geography,
and maximum credits [S3-S5]. Plan request rate bounds caller-to-Oxylabs
submission throughput [S6].

These do **not** establish:

- maximum discovered/enqueued URLs distinct from `limit`;
- maximum fetched pages, bytes, redirects, render resources, or per-host
  concurrency;
- wall-clock server deadline (the five-minute SDK timer only bounds waiting);
- per-page outlink breadth, sitemap size/recursion, or frontier queue size;
- origin delay, robots mode, `Retry-After`, retries, or trap detection;
- whether `max_credits` causes a partial result, failure, or silent truncation;
- whether depth is counted from the submitted URL, normalized origin root,
  redirected final URL, or sitemap entries;
- whether external/subdomain switches gate enqueue, fetch, render subrequests,
  and/or output.

**INFERENCE (high):** `limit` is a result cardinality cap, not a safe upper bound
on all work. Relevance filtering may require discovering or fetching more than
the returned count. Conversely, sitemap entries may be returned without each
being fetched. The billing table does not resolve the ratio among fetched,
successfully scraped, discovered, filtered, and returned URLs [S1][S3-S6].

### 3.2 “Full Crawl” and “all URLs” are not completeness guarantees

**FACT (high):** Oxylabs uses “all connected URLs,” “all blog posts,” “all
documentation pages,” and “whole structure” in product/use-case copy [S1][S2]
[S13]. The release note more carefully says “more comprehensive” and caps
results at 10,000 [S3].

**INFERENCE (high):** these are goal descriptions, not a recall SLA. Even with
depth 5, limit 10,000, sitemap enabled, no filters, and sufficient credits,
coverage can be incomplete because pages may be unlinked, beyond depth, blocked,
auth/paywall/private, dynamically undiscoverable, filtered by undisclosed
policy, failed, duplicated, redirected, or omitted by result truncation. The
FAQ explicitly excludes authentication, paywalls, and private networks “out of
the box” [S2].

**NEGATIVE RESULT (high confidence):** no inspected source defines a
completeness flag, expected/visited/failed/remaining counts, frontier residue,
truncation reason, coverage percentage, sitemap-consumption count, inaccessible
URL list, or proof that an empty list means “no matching pages.”

**RECOMMENDATION (high):** Curiosity must call the result `UrlHint[]`, never a
`SiteMap` or complete inventory. A completed provider run means the provider
stopped normally—not that the site was exhaustively mapped. Locally preserve:
`returned_count`, declared limits, stop reason if available, and
`completeness=unknown`.

### 3.3 Path and authority scope gaps

**FACT (high):** keywords are described as filtering URL paths; there are no
documented include/exclude path prefixes or regexes. The two booleans permit
subdomains and external domains but accept no explicit host allowlist [S4][S5].

**UNKNOWN:** starting from `https://example.com/docs/` may mean descendants of
`/docs/`, the entire exact origin, or the registrable domain. It is also unknown
whether `www` and apex are aliases, whether ports matter, how redirects alter
scope, and whether sitemap entries outside the seed origin are admitted.

**RECOMMENDATION (high):** Curiosity should define separate, parsed controls:

- `discovery_scope`: which links/sitemap entries may become hints;
- `fetch_scope`: which origins and ports may be acquired;
- `render_subresource_scope`: what an isolated browser may request;
- `return_scope`: what may be exposed to the caller;
- explicit normalized origins, path prefixes, document/media types, redirect
  policy, and public-address requirement.

Default all four to the exact normalized public HTTP(S) origin and submitted
path subtree. A prompt and keyword list may narrow ranking/return but may not
widen any authority.

## 4. Crawl and acquisition dependency

### 4.1 What the evidence supports

- **FACT (high):** Map accepts `max_crawl_depth` and Oxylabs calls the revamp a
  “Full Crawl” [S3-S5].
- **FACT (high):** sitemap inclusion is enabled by default and described as a
  seed, so the discovery frontier can originate outside ordinary page links
  [S3-S5].
- **FACT (high):** Map can enable JavaScript rendering and geolocated proxy
  acquisition [S1][S2][S4][S5].
- **FACT (high):** pricing assigns Map one credit to a non-JS scrape and four to
  a JS scrape; producing the URL-list output itself is free [S6].
- **FACT (high):** Map returns URLs only; AI-Crawler separately charges for
  Markdown/parsed output and prompt processing while returning page-derived
  content [S2][S6].

**INFERENCE (high):** Map has, or invokes, a page-acquisition/link-extraction
plane. A sitemap-only seed can provide URLs without fetching every destination,
but following ordinary links or discovering JavaScript-generated links requires
retrieving some representation of frontier pages. “List of URLs: free” means
projection is uncharged, not that discovery is fetch-free.

**INFERENCE (medium):** the no-JS and JS credit classes imply at least two
acquisition routes. They do not prove which fetcher/browser/proxy implementation
is used, whether static attempts automatically escalate, or whether all
subresources are charged.

### 4.2 What the evidence does not support

**NEGATIVE RESULT:** no source says AI-Map calls the public AI-Crawler endpoint,
shares its exact frontier, or inherits its extraction semantics. Product names
and a common platform are insufficient to establish service composition.

Also unknown:

- whether sitemap and HTML crawling run in parallel or sequence;
- whether a sitemap index is recursively expanded and whether robots-declared
  sitemaps are used;
- whether XML `lastmod`, alternate language links, RSS/Atom, canonical links,
  or search-engine/index data contribute candidates;
- whether AI evaluates anchors/URLs before fetch, page content after fetch, or
  both;
- whether JavaScript is applied to every page or selected pages;
- rendering engine/version, load/wait condition, cookies, locale, and resource
  blocking;
- origin request headers/user-agent, proxy class, sessions, retries, and
  anti-blocking choices.

**RECOMMENDATION (high):** provider-neutral discovery must not depend on content
extraction. Keep `discover` and `capture` independently budgeted, but record the
acquisition evidence used for each discovery edge. If a provider cannot expose
that edge, label the hint `provider_opaque_discovery`.

## 5. URL identity, normalization, and deduplication

**NEGATIVE RESULT (high confidence):** no AI-Map source inspected specifies:

- RFC 3986 parsing/resolution rules or accepted schemes;
- host case-folding, IDNA version, default-port removal, dot-segment handling,
  fragment stripping, percent-encoding normalization, or trailing-slash policy;
- query ordering, blank values, tracking/session parameter removal, or
  parameter allow/deny lists;
- redirect-final identity or redirect-loop/limit behavior;
- publisher `rel=canonical`, sitemap canonical preference, `hreflang`, or
  mobile/AMP aliases;
- exact URL deduplication, fetch-key deduplication, exact-content hashes, or
  near-duplicate clustering;
- whether duplicate aliases are fetched, billed, returned, ordered, or counted
  against `limit`.

**FACT (medium):** current plan cards advertise “Advanced URL parsing,” but
publish no semantics or guarantee. A marketing feature name cannot establish
canonicalization or deduplication [S6].

**INFERENCE (medium-high):** bounded traversal practically requires some
visited identity, but the key could be raw string, normalized URL, redirect
target, or another opaque value. The plain URL array provides no way to
distinguish duplicate suppression from non-discovery.

**RECOMMENDATION (high):** Curiosity must independently preserve:

1. source lexical URL and discovery parent/source;
2. parsed and normalized fetch URL with normalization-policy version;
3. redirect chain and final URL;
4. publisher-declared canonical as untrusted evidence;
5. capture hash and exact-content duplicate cluster;
6. near-duplicate cluster with method/version;
7. all aliases and their independent discovery provenance.

Deduplication must control work without erasing lineage or turning mirrors into
false corroboration. Scope policy must run before enqueue and again on every
redirect, DNS resolution, and renderer request.

## 6. Freshness and provenance

### 6.1 Observable output

**FACT (high):** the documented Map output is only an ordered JSON array of URL
strings. The Python wrapper additionally returns the submission `run_id` and a
`message` populated from terminal `error_code`; the JS convenience method
returns only response `data` [S1][S4][S5].

No per-URL field records:

- discovery/fetch time, publication/change time, or sitemap `lastmod`;
- discovery source (`seed`, link parent, sitemap, render, other);
- parent URL, anchor text, depth, queue order, or relevance score/reason;
- submitted, normalized, redirected-final, or canonical URL distinction;
- source HTTP status/headers, media type, bytes, content hash, or capture ID;
- cache hit/age, origin contact, validators, or requested freshness;
- robots/policy outcome, retry attempts, warnings, or per-URL failure;
- requested/observed geography, proxy route, renderer, or model version;
- duplicate identity, truncation, or completeness status.

### 6.2 Freshness cannot be inferred

**NEGATIVE RESULT (high confidence):** no inspected AI-Map source defines cache
use, sitemap cache age, index reuse, origin revalidation, cache bypass,
stale-on-error, or freshness SLA. “Fresh data” elsewhere in platform marketing
is not a Map protocol guarantee. A run ID is operational correlation, not proof
of observation time or immutable input/result binding.

**INFERENCE (high):** a returned URL may be sourced from a fetched page,
sitemap, rendered navigation, or an undisclosed reusable intermediate. Even if
the seed is fetched live, that does not prove each returned URL was fetched or
currently exists. Geo and JavaScript options make maps context-dependent; they
do not make them more canonical.

**RECOMMENDATION (high):** on receipt, Curiosity should add its own request and
receipt timestamps, provider/SDK/config versions, input digest, requested geo,
run ID, result index, and hash of the complete returned array. Every URL remains
`unverified_url_hint` until a separate policy-authorized capture establishes
status and content. Use `freshness=unknown` and `completeness=unknown`; never
manufacture source timestamps.

## 7. Limits, failures, and pricing

### 7.1 Published limits and client behavior

| Dimension | Current evidence | Confidence / caveat |
| --- | --- | --- |
| Crawl depth | 1–5, default 1 | High; SDK docs [S4][S5]. |
| Returned URLs | advertised max 10,000 | High; release + JS SDK [S3][S5]. Default conflicts (25 Python, 50 JS). |
| SDK wait | 300 s; poll every 5 s | High as client behavior only [S4][S5]. |
| Python per-HTTP timeout | 30 s default | High; independent of total map wait [S4]. |
| Python transport retries | five attempts for 429 and 5xx, exponential 1–8 s | High as SDK behavior; POST retries lack a published idempotency key [S4]. |
| JS transport retries | three by default, exponential; retries any thrown request error | High as SDK behavior; can retry permanent 4xx and POST [S5]. |
| Plan request rate | Starter 1/s, Lite 5/s, Standard 10/s, Custom 25/s | High but conflicts with Terms' 5 connections/s [S6][S7]. |
| Credits | 3K/$12, 100K/$62, 500K/$250, custom from 1.35M/$1,200+ monthly | High, time-sensitive list-price snapshot [S6]. VAT may apply. |

**UNKNOWN:** URL/prompt/keyword lengths, keyword count, sitemap bytes/entries,
page/response bytes, redirects, render resources/time, concurrent origin
requests, queue duration, run retention, poll rate, cancellation, and maximum
result payload bytes.

### 7.2 Error and partial-result semantics

**FACT (high):** public SDKs expose terminal `completed/success` and
`failed/error` variants and an `error_code`/message path. Neither publishes an
error-code catalog [S4][S5]. Python returns a failed job object; JS throws.

**FACT (high):** Python retries only 429/5xx but then its Map polling loop catches
request exceptions and non-200 poll responses, waits, and continues until the
five-minute timeout. JS lets exhausted polling errors escape. A Python timeout
can therefore hide the difference between persistent authorization/not-found,
network failure, server slowness, and a still-running job [S4][S5].

**INFERENCE (high):** automatic submission retries are unsafe without server
idempotency evidence: a lost successful POST response could create more than
one billed run. No inspected source offers a client request key or duplicate-run
reconciliation query.

**NEGATIVE RESULT:** no per-URL errors, failed URL list, retry count, partial
status, budget-exhaustion state, frontier remainder, or `Retry-After` handling
contract is published. SDK exponential waits do not inspect a documented
`Retry-After` header.

**RECOMMENDATION (high):** separate `submission_outcome`, `run_outcome`,
`discovery_outcome`, and `billing_outcome`. Preserve raw provider error codes;
never collapse timeout, failed, empty-complete, and partial into the same empty
array. POST retries require idempotency or an explicit no-retry/reconciliation
design.

### 7.3 Cost semantics

**FACT (high, snapshot):** pricing assigns Map one credit per non-JS scraping
job and four per JS scraping job; “List of URLs” output is free. The Map column
does not add the ten-credit prompt-processing item shown for Crawl and Browser
Agent. Credits expire monthly, access pauses when exhausted, and system-caused
failed results are not billed; incomplete input or asking for data absent from
a page may still be billed [S6].

**INFERENCE (medium):** a 10,000-URL request is not proven to cost exactly 10,000
or 40,000 credits because billing does not define which visited/sitemap/
filtered/returned pages constitute scraping jobs. The request's `max_credits`
is therefore more trustworthy as a hard authorization intent than any estimate,
but its stop/result semantics remain unknown [S4-S6].

**RECOMMENDATION (high):** require both a local worst-case credit ceiling and
smaller page/discovery/fetch/render/byte/deadline limits. Reconcile provider
usage by run ID, but do not accept Terms §2.2's “final and undisputable” dashboard
usage language as an engineering substitute for local metering [S7].

## 8. Security, privacy, and legal boundary

### 8.1 URL and hostile-content security

**FACT (medium-high):** the FAQ says most public websites are supported, while
authentication, paywalls, and private networks are not accessible “out of the
box.” That is a product statement, not a normative SSRF defense [S2].

The input seed, sitemap URLs, redirects, dynamically generated links, and
returned URLs are attacker-controlled. Enabling external domains or JavaScript
widens the potential server-side fetch/browser surface. Sitemap poisoning,
redirect-to-private targets, DNS rebinding, huge/decompression payloads, crawl
traps, browser subrequests, and prompt injection are not addressed in the
published Map contract.

**RECOMMENDATION (high):** never expose AI-Map directly to an agent. A Curiosity
adapter must parse and authorize a public HTTP(S) seed; reject credentials in
URLs, private/link-local/loopback/multicast/metadata addresses, unsafe ports,
and unapproved redirects; pin explicit origins; disable external domains and JS
by default; cap all output strings; and treat every returned URL as untrusted
external data. Provider-side filtering is defense in depth, not authority.

### 8.2 Prompt and result privacy

**FACT (high):** AI Studio Terms identify OpenAI (ChatGPT models) and Google
(Gemini) as incorporated third-party AI providers and say prompts/results may be
accessed by them under their own terms. The Terms do not identify which provider
or model AI-Map uses for a given run [S7].

**FACT (high):** the DPA says Oxylabs acts as processor for customer personal
data, processes it in the EEA, may use subprocessors (list available on request),
uses Chapter V safeguards for non-adequate third-country subprocessors, and
retains personal data submitted in prompts/inputs/interactions for at most 90
days unless law or legitimate purposes require otherwise [S8].

**FACT (high):** the AI Studio Privacy Policy explicitly excludes customer data
processed on customers' behalf from its scope; it governs account/site data.
Contract/account personal data may be retained through the relationship and up
to ten years after termination [S9].

**UNKNOWN:** whether target URLs, discovered URLs, fetched page bodies, sitemap
contents, rendering artifacts, and operational logs are all treated as
“prompts, inputs, or interactions” under the 90-day rule; non-personal target
payload retention; deletion timing for runs/results; model training/improvement
use; exact AI-Map subprocessors/regions; encryption/key details; and whether
third-party AI receives full page content, prompt only, or selected features.
The DPA Annex's listed data subjects focus on service users, which does not
clearly resolve personal data about people found on target pages [S8].

**RECOMMENDATION (high):** send no secrets, internal hostnames, authenticated
URLs, personal/sensitive prompt data, or confidential research intent. Before
any adapter, obtain the subprocessor list, data-flow diagram, retention/deletion
matrix for all Map artifacts, training-use statement, region controls, and
contractual deletion/export terms.

### 8.3 Lawful use and service restrictions

**FACT (high):** the AUP requires compliance with target terms/legal documents,
permits only public data absent permission, and prohibits sensitive health and
children's data, authentication circumvention, security breaches, and other
abuse [S10]. The AI Studio Terms make the customer responsible for legality,
third-party rights, prompts, results, and target data; they disclaim accuracy,
availability, legality, originality, and non-infringement [S7].

**FACT (high):** the Terms prohibit using the service for competitive purposes,
monitoring availability/performance/functionality without consent, and
disassembling/reverse engineering/decompiling the service or accessing it to
copy/build similar ideas, features, functions, or graphics [S7].

**RECOMMENDATION (high):** this dossier stays on the safe side of that boundary:
public docs and MIT client wrappers establish interoperability facts; no service
account or service behavior was accessed. Any future live evaluation requires
separate legal/procurement authority and a purpose consistent with the
agreement. Curiosity's own policy gate—not provider reachability—must decide
robots, target terms, copyright/database rights, privacy, retention, and
publisher opt-out.

### 8.4 Assurance unknowns

Oxylabs site footers identify “Proxy Solutions” and “Scraper APIs” as
ISO/IEC 27001:2022 certified products, but do not explicitly name AI Studio or
AI-Map [S7-S10]. **UNKNOWN:** whether AI-Map falls within that certification or
any SOC 2 report boundary. Do not transfer assurance claims from adjacent
Oxylabs products without the certificate and scope statement.

## 9. Minimal architecture inference

The strongest clean-room architecture supported by the public boundary is:

```text
x-api-key authenticated request
  -> request/schema + account/rate/credit validation
  -> durable run record / run_id
  -> seed and scope planner
       -> submitted URL
       -> optional sitemap seed expansion
  -> bounded frontier (depth, visited identity, credit/result budgets)
  -> acquisition route
       -> static fetch, geo/proxy context
       -> optional JavaScript render
  -> link/URL extraction
  -> domain/subdomain/external policy
  -> optional path-keyword and natural-language relevance stage
  -> URL limit/projection
  -> terminal run data retrievable by polling
```

| Inference | Confidence | Evidence and boundary |
| --- | --- | --- |
| Durable run/state store | High | Run ID plus later polling. Persistence technology and retention unknown. |
| Frontier and visited state | Medium-high | Depth-bounded crawling is not practical without them; ordering/key unknown. |
| Sitemap seed path | High | Explicit default-on input and release note. Fetch/cache/recursion unknown. |
| Static and render acquisition lanes | High | Distinct option and 1-versus-4 credit classes. Engines/routing unknown. |
| URL/link extraction | High | Required to derive connected URLs from pages; parser unknown. |
| Hard-ish scope filter | High | Subdomain/external inputs; exact enforcement phase unknown. |
| Keyword filter | High | SDK calls it URL-path filtering; matching algorithm unknown. |
| AI relevance stage | High that it exists, low on placement/model | Optional prompt plus release statement; could run pre- or post-fetch. |
| Separate Map and AI-Crawler public operations | High | Different contracts/outputs/billing. Shared internal service topology unknown. |
| Canonicalization/near-dedup service | Low/unknown | No contract evidence beyond need for some visited key. |
| Robots/politeness service | Low/unknown | No Map guarantee. |
| Cache/index reuse | Low/unknown | No Map freshness contract. |

This diagram does not claim microservices, queue/store technologies, crawler
order, model provider, proxy product, anti-bot method, or AI-Crawler reuse.

## 10. Clean-room lessons and Curiosity implications

### 10.1 Verdict ledger

| Product idea | Verdict | Confidence | Curiosity disposition |
| --- | --- | --- | --- |
| Separate URL Map from content Crawl | **ADOPTED concept** | High | Discovery hints and captures are different types, budgets, and evidence claims. |
| Async run ID plus polling | **ADAPTED** | High | Add idempotency, cancellation, deadline, typed terminal states, retention, cursor, and reconciliation. |
| Depth + result limit + credit cap | **ADAPTED** | High | Add discovered/fetched/failed URLs, bytes, redirects, render resources, per-host concurrency/delay, and elapsed-time caps. |
| Sitemap as explicit discovery source | **ADAPTED** | High | Preserve per-URL sitemap/link provenance, retrieval time/hash, and publisher-policy decision. |
| Exact-origin defaults for subdomain/external | **ADOPTED and strengthened** | High | Separate discover/fetch/render/return scopes; use explicit origin allowlists rather than booleans alone. |
| Keyword and natural-language filters | **ADAPTED** | High | Soft rank/narrow only after hard scope; retain scores/reasons/version and expose false-negative uncertainty. |
| Optional JavaScript discovery | **DEFERRED lane** | High | Isolated renderer only after static-discovery insufficiency; separate egress and tight cost/resource budget. |
| Geolocated mapping | **DEFERRED** | Medium-high | Use only for a declared locality need; label requested/observed context and map variance. |
| Plain URL array as site map/evidence | **REJECTED** | High | No identity, edge, fetch, freshness, policy, failure, or completeness proof. |
| “Full Crawl” as completeness guarantee | **REJECTED** | High | Marketing mode plus bounds is not measured recall or exhaustive coverage. |
| External-domain boolean exposed to agents | **REJECTED** | High | Confused-deputy/SSRF/scope/cost risk; require policy-approved explicit origins. |
| Automatic POST retries without idempotency | **REJECTED** | High | Duplicate jobs and billing ambiguity. |
| Oxylabs AI-Map as Curiosity crawl foundation | **REJECTED** | High | Opaque hosted frontier and insufficient evidence chain. |
| Oxylabs AI-Map as optional discovery adapter | **DEFERRED** | Medium | Needs legal/privacy/security review, normative schema, and authorized evaluation. |
| MIT SDK code reuse | **DEFERRED** | High | License permits it, but HTTP interoperability needs no code transfer; preserve clean-room separation. |

### 10.2 Provider-neutral discovery contract

**RECOMMENDATION (high):** Curiosity should define:

```text
discover(
  seeds,
  authority: {normalized_origins, path_prefixes, redirect_policy,
              discovery_scope, fetch_scope, render_scope, return_scope},
  frontier: {strategy, max_depth, max_outlinks_per_page,
             max_discovered, max_fetches, per_origin_concurrency, delay},
  budget: {bytes, redirects, static_seconds, render_seconds,
           total_deadline, cost_units},
  sources: {links, sitemap, feeds},
  relevance?: {keywords, instruction, scorer_policy},
  freshness_policy,
  robots_policy,
  idempotency_key,
  retention_class
) -> DiscoveryRun
```

Every `UrlHint` should carry:

```text
run_id, hint_id, seed_id, provider?, provider_run_id?
lexical_url, normalized_url, parent_url?, discovery_source, depth?
anchor_or_sitemap_evidence?, discovered_at?, received_at
scope_decision_id, robots_decision_id?, redirect_evidence?
relevance_score?, relevance_reason?, scorer_version?
canonical_evidence?, duplicate_cluster?, fetch_status=not_fetched|...
freshness_status, provenance_completeness, untrusted_external_data=true
```

Question marks are first-class missing evidence. For opaque AI-Map output, only
the lexical URL, provider run correlation, receipt time, result position, input
digest, and local policy wrapper are known.

### 10.3 Evaluation checks if authority is later granted

No benchmark was run. A separately reviewed, non-sensitive public sandbox
evaluation should test:

1. exact seed-path, subdomain, external, redirect, and sitemap scope behavior;
2. depth convention and boundary pages at each depth;
3. empty, failed, timed-out, credit-exhausted, and truncated outcomes;
4. URL normalization and duplicates across fragments, queries, ports,
   redirects, canonical tags, and mirrored content;
5. static versus JS result deltas and all resulting network destinations;
6. completeness against a controlled site with a known graph/sitemap;
7. output ordering/determinism with keywords, prompt, both, and neither;
8. origin traffic/politeness/robots behavior using a controlled server;
9. cost reconciliation among fetched, discovered, filtered, returned, failed,
   sitemap, and rendered pages;
10. retention/deletion and run-result expiry.

Security tests involving private addresses, rebinding, metadata, or bypass need
a dedicated approved test plan and vendor coordination; they are not implied by
ordinary product evaluation.

## 11. Fact / inference / recommendation ledger

| ID | Type | Claim | Confidence | Origin / check |
| --- | --- | --- | --- | --- |
| F1 | FACT | Map returns URL strings; Crawler returns extracted content. | High | S1, S2, S6. |
| F2 | FACT | Current SDK request fields include depth, limit, sitemap, keywords/prompt, JS, geo, scope booleans, and credit cap. | High | S4, S5 pinned source. |
| F3 | FACT | Current maximum depth is 5 and advertised URL maximum is 10,000. | High | S3-S5. |
| F4 | FACT | Sitemap defaults true; subdomains and external domains default false. | High | S4, S5. |
| F5 | FACT | Map is async: POST returns run ID and GET returns run data/status. | High | S4, S5. |
| F6 | FACT | SDK convenience waits are 300 seconds with five-second polls. | High | S4, S5. |
| F7 | FACT | Python and JS disagree on default limit and failed-run behavior. | High | Compare S4 and S5. |
| F8 | FACT | The product request table is inconsistent with maintained SDKs. | High | Compare S1 with S3-S5. |
| F9 | FACT | Map billing distinguishes static and JS scraping while URL-list output is free. | High | S6. |
| F10 | FACT | Result items have no published per-URL provenance fields. | High | Negative schema inspection S1, S4, S5. |
| F11 | FACT | AI Studio Terms identify OpenAI and Google and permit their access to prompts/results under third-party terms. | High | S7 §§4.1–4.4. |
| F12 | FACT | DPA gives a 90-day maximum for personal data submitted in prompts/inputs/interactions, with exceptions. | High | S8 §10.1. |
| F13 | FACT | AUP restricts automated gathering to lawful, terms-compliant public, non-sensitive data absent permission. | High | S10. |
| I1 | INFERENCE | Map invokes an acquisition/link-discovery plane. | High | F2, F3, F4, F9. |
| I2 | INFERENCE | Map is not shown to call the separate AI-Crawler product. | High | Product separation and no positive evidence; S1-S6. |
| I3 | INFERENCE | A frontier and visited key likely exist, but their ordering and URL identity are unknown. | Medium-high | Depth-bounded traversal; no implementation claim. |
| I4 | INFERENCE | Returned count does not bound all discovery/fetch work. | High | Filtering/sitemap plus absent work-unit definition. |
| I5 | INFERENCE | A completed run does not establish exhaustive coverage or URL freshness. | High | F10 and missing coverage/cache contract. |
| R1 | RECOMMENDATION | Treat every Map item as an unverified URL hint. | High | F10, I5. |
| R2 | RECOMMENDATION | Keep semantic relevance subordinate to exact hard scope and budgets. | High | F2, I4 and threat model. |
| R3 | RECOMMENDATION | Own URL identity, edges, attempts, captures, policy, failures, and completeness locally. | High | Contract gaps throughout. |
| R4 | RECOMMENDATION | Defer an adapter; reject AI-Map as owned crawl core. | High | Opaque frontier, weak evidence, and legal/privacy unknowns. |

## 12. Unknowns and pre-adoption questions

### Blocking technical questions

1. Obtain a normative OpenAPI/JSON Schema: exact required fields, types,
   validation limits, defaults, response schemas, statuses, and error catalog.
2. What exactly do `limit`, depth, subdomain/external, and credit cap constrain:
   discovered, queued, fetched, successfully scraped, filtered, or returned?
3. How are seed path, origin, registrable domain, redirects, sitemap off-origin
   entries, ports, IDNs, and DNS changes scoped?
4. What are URL normalization, canonical alias, exact duplicate, near-duplicate,
   and result ordering rules?
5. What is the frontier strategy and tie-break under keyword/prompt filtering?
   Is an unfiltered Full Crawl deterministic?
6. What robots user agent, RFC 9309 behavior, robots cache/failure policy,
   sitemap policy, origin concurrency, delay, and `Retry-After` handling apply?
7. What target failures are retried; how are partial results, failed URLs,
   budget stops, timeout, and remaining frontier represented?
8. Is Map ever served from cache/indexed data? Can live origin contact be
   requested and evidenced? What are run/result retention and deletion APIs?
9. Which fetch/render engine, waits, resource caps, egress checks, and automatic
   escalation rules apply?
10. Are POST submissions idempotent? Can jobs be cancelled and reconciled after
    a client timeout?

### Blocking commercial, privacy, security, and legal questions

1. Resolve plan RPS versus Terms' five-connection limit and define Map's exact
   billable unit, rounding, failed/partial-run treatment, and `max_credits`
   semantics.
2. Obtain AI-Map's data-flow diagram, specific subprocessors/models/regions,
   transfer mechanisms, and confirmation whether prompts/page content/results
   are used for training or service improvement.
3. Define retention/deletion for target URLs, page bodies, sitemap data,
   render artifacts, runs, logs, and non-personal data; clarify the DPA's
   coverage of people represented in target data.
4. Obtain the precise ISO/SOC certification scope naming AI Studio/AI-Map,
   penetration-test summary, incident terms, and tenant/access controls.
5. Confirm publisher opt-out/takedown handling and contractual allocation for
   robots, target terms, copyright/database rights, and personal data.
6. Counsel must confirm whether the intended evaluation/use is compatible with
   the AI Studio competitive-use and reverse-engineering restrictions.

## 13. Reproducible public checks (no API key)

These checks read public vendor material only. They do not contact the AI Studio
API or any mapping target.

```sh
# Thin product contract and the dated Map revamp.
curl -fsS https://developers.oxylabs.io/products/ai-studio/ai-map.md
curl -fsS https://aistudio.oxylabs.io/releases

# Pinned Python SDK Map lifecycle and client retry policy.
curl -fsS \
  https://raw.githubusercontent.com/oxylabs/oxylabs-ai-studio-py/bf5649da8797fa58e6655a656b2eec3dd77f4df7/src/oxylabs_ai_studio/apps/ai_map.py
curl -fsS \
  https://raw.githubusercontent.com/oxylabs/oxylabs-ai-studio-py/bf5649da8797fa58e6655a656b2eec3dd77f4df7/src/oxylabs_ai_studio/client.py

# Registry-pinned Python artifact identity; inspect without installing/running.
curl -fsS https://pypi.org/pypi/oxylabs-ai-studio/0.2.22/json | \
  jq '.info.version, .urls[] | {filename, digests}'

# Pinned JavaScript Map lifecycle/types and npm package-to-commit link.
curl -fsS \
  https://raw.githubusercontent.com/oxylabs/oxylabs-ai-studio-js/c4d57ad080fb831eb943ebe35892d7d7095be87c/src/services/aiMap.ts
curl -fsS \
  https://raw.githubusercontent.com/oxylabs/oxylabs-ai-studio-js/c4d57ad080fb831eb943ebe35892d7d7095be87c/src/types.ts
curl -fsS https://registry.npmjs.org/oxylabs-ai-studio/1.0.29 | \
  jq '{version, gitHead, license}'

# Pricing and legal/privacy boundaries.
curl -fsS https://aistudio.oxylabs.io/pricing
curl -fsS https://oxylabs.io/legal/oxylabs-ai-studio-tos
curl -fsS https://oxylabs.io/legal/oxylabs-ai-studio-data-processing-agreement
curl -fsS https://oxylabs.io/legal/oxylabs-acceptable-use-policy
```

Expected observations: the overview's malformed parameter table differs from
both SDKs; the SDKs show POST/poll/run-ID behavior and the richer request; the
release notes show the 10,000-URL revamp; neither public response shape supplies
per-URL provenance, completeness, normalization, or failures.

## 14. Bounded curiosity pass and stop

Scores are 1 (low) to 5 (high); cost is 1 (cheap) to 5 (expensive).

| Thread | Relevance | Value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Reconcile obsolete AI-Map page with current contract | 5 | 5 | 4 | 1 | **Pursued:** dated revamp plus pinned Python/JS SDKs reveal the current richer contract and contradictions. |
| Determine whether Map is actually synchronous | 5 | 5 | 3 | 1 | **Pursued:** both SDKs expose POST + run ID + polling; convenience methods only simulate sync. |
| Establish crawl/AI-Crawler dependency | 5 | 5 | 4 | 2 | **Pursued:** crawl/acquisition dependency is supported; dependency on the separate AI-Crawler product is not. Negative result retained. |
| Find URL normalization/dedup and completeness guarantees | 5 | 5 | 4 | 2 | **Pursued:** docs, SDKs, release, FAQ, and pricing reached saturation without such a contract. |
| Clarify prompt/model privacy path | 5 | 5 | 4 | 2 | **Pursued:** Terms name OpenAI/Google broadly; exact AI-Map model/data flow remains unknown and is a procurement check. |
| Call free Map against a known site to infer behavior | 4 | 4 | 3 | 4 | **CURIOSITY_NO_GO:** caller forbade credentials/calls; one sample would not establish contractual completeness or internals. |
| Probe localhost, metadata, redirects, or DNS rebinding | 5 | 5 | 3 | 5 | **CURIOSITY_NO_GO:** unauthorized security testing and outside clean-room scope. |
| Inspect/minify the hosted web application bundles | 2 | 2 | 4 | 4 | **CURIOSITY_NO_GO:** maintained MIT SDKs disclose the public client boundary; bundle reversal adds terms/contamination risk with little decision value. |
| Infer proprietary AI ranker/model assignment | 2 | 2 | 5 | 5 | **CURIOSITY_NO_GO:** unpublished, contractually sensitive, and unnecessary; semantic ranking remains opaque by design. |
| Benchmark AI-Map against Tavily/Firecrawl | 3 | 4 | 3 | 5 | **CURIOSITY_NO_GO:** caller authorized AI-Map only; requires a declared corpus, credentials, spend, and separate comparative frame. |
| Produce a jurisdiction-specific scraping opinion | 5 | 5 | 3 | 5 | **CURIOSITY_NO_GO:** legal advice requires counsel; engineering gates and exact policy text are retained. |
| Reuse the MIT SDK in Curiosity | 2 | 2 | 2 | 3 | **CURIOSITY_NO_GO:** implementation is forbidden in this task and unnecessary for contract research; deferred if an adapter is separately approved. |

**Coverage:** map/discovery contract; scope, coverage and completeness; crawl
dependency; normalization/deduplication; freshness/provenance; limits, errors
and pricing; privacy/security/legal; bounded architecture inference; clean-room
lessons; Curiosity implications; confidence, sources, unknowns, checks, and
verdicts are covered.

**Saturation:** the SDKs, product/release/pricing pages, and legal documents
converged on the observable boundary. Additional public pages repeat marketing
claims without resolving frontier, robots, identity, cache, provenance, or
partial-failure semantics.

**Stop:** coverage and source saturation reached. Remaining high-value answers
require vendor disclosure, counsel/procurement review, or separately authorized
controlled testing.

## 15. Primary sources

All sources accessed 2026-08-17. First-party vendor material is authoritative
only for the contract or representation attributed to it, not independent proof
of quality, completeness, security, compliance, or implementation.

1. **[S1] Oxylabs, “AI-Map.”**
   https://developers.oxylabs.io/products/ai-studio/ai-map.md — overview,
   example, malformed request table, URL-list output, and use-case claims.
2. **[S2] Oxylabs, “AI Studio FAQ.”**
   https://developers.oxylabs.io/products/ai-studio/faq.md — Map/Crawler
   distinction, public/access boundary, JS support, and trial statement.
3. **[S3] Oxylabs AI Studio, “Release Notes,” AI-Map Revamp, 2025-12-01.**
   https://aistudio.oxylabs.io/releases — Full Crawl, 10,000 maximum, sitemap,
   and optional keyword/NLP filtering.
4. **[S4] Oxylabs, official Python SDK 0.2.22, commit
   `bf5649da8797fa58e6655a656b2eec3dd77f4df7`.**
   https://github.com/oxylabs/oxylabs-ai-studio-py/tree/bf5649da8797fa58e6655a656b2eec3dd77f4df7 — Map request, defaults,
   POST/poll lifecycle, result type, timeout, retries, base URL/auth, and MIT
   license.
5. **[S5] Oxylabs, official JavaScript SDK 1.0.29, npm `gitHead`
   `c4d57ad080fb831eb943ebe35892d7d7095be87c`.**
   https://github.com/oxylabs/oxylabs-ai-studio-js/tree/c4d57ad080fb831eb943ebe35892d7d7095be87c — Map request/types,
   POST/poll lifecycle, timeout/error/retry behavior, default/max claims, and
   MIT license. Access-time `main` merge commit:
   `d64f3cef7439e51c1a28a93514ead053b0b550da`.
6. **[S6] Oxylabs AI Studio, “Pricing.”**
   https://aistudio.oxylabs.io/pricing — plans, request rates, Map static/JS
   credits, free URL-list output, failure and rollover policy.
7. **[S7] Oxylabs, “AI Studio Terms of Service,” updated 2025-09-18.**
   https://oxylabs.io/legal/oxylabs-ai-studio-tos — product definition,
   third-party AI, usage/monitoring, restrictions, customer responsibility,
   disclaimers, and five-connection language.
8. **[S8] Oxylabs, “AI Studio Data Processing Agreement.”**
   https://oxylabs.io/legal/oxylabs-ai-studio-data-processing-agreement —
   controller/processor roles, EEA processing, subprocessors/transfers,
   security, breach notice, audit, and 90-day personal-data retention.
9. **[S9] Oxylabs, “AI Studio Privacy Policy,” updated 2025-06-30.**
   https://oxylabs.io/legal/oxylabs-ai-studio-privacy-policy — account/site
   processing, customer-data exclusion, sharing/transfers, and retention.
10. **[S10] Oxylabs, “Acceptable Use Policy,” updated 2024-06-25.**
    https://oxylabs.io/legal/oxylabs-acceptable-use-policy — automated data
    gathering, public/sensitive data, target terms, security, and abuse limits.
11. **[S11] PyPI, `oxylabs-ai-studio` 0.2.22 project metadata/artifact.**
    https://pypi.org/pypi/oxylabs-ai-studio/0.2.22/json — package version,
    release time, artifact hash, README contract, and MIT license file.
12. **[S12] npm registry, `oxylabs-ai-studio` 1.0.29 metadata.**
    https://registry.npmjs.org/oxylabs-ai-studio/1.0.29 — package version,
    tarball integrity, git commit, repository, and MIT license declaration.
13. **[S13] Oxylabs, “Quick Start: AI Studio.”**
    https://developers.oxylabs.io/get-started/quick-start-ai-studio.md — app
    boundaries, whole-site wording, and conflicting free-credit statement.

## 16. Confidence summary

- **High:** current SDK-visible fields, defaults sent by Python, endpoints,
  authentication header, run/poll lifecycle, SDK timeout/retry behavior, dated
  10,000/depth limits, plan/pricing text, URL-only output, and legal text.
- **Medium:** logical frontier/visited-state and fetch/render/link-extraction
  decomposition; exact billable-work interpretation; whether the absence of
  filters is exactly the UI's “Full Crawl” mode.
- **Low/unknown:** completeness/recall, frontier ordering, origin politeness and
  robots, URL identity/dedup, retries inside the service, redirects, cache and
  freshness, per-URL provenance/failures, renderer behavior, AI model/placement,
  exact data flows/retention, certification scope, and live quality/cost.
