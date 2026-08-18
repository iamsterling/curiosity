# Diffbot Crawl / Crawlbot: clean-room reverse-engineering dossier

**Research and source-access date:** 2026-08-17  
**Scope:** Diffbot Crawl API, historically called Crawlbot, only. Extract is
considered only where Crawl delegates page processing or browser-assisted link
discovery to it. Knowledge Graph is excluded; the collection-query endpoint is
mentioned only as a Crawl output surface.  
**Status:** research record, not an implementation, benchmark, legal opinion,
purchase recommendation, or authorization to crawl.  
**Access boundary:** public first-party documentation, public OpenAPI, pricing,
privacy, and terms only. No account, token, paid/free API call, target crawl,
dashboard access, bypass, security probe, proprietary code, or response corpus
was used.

## Executive verdict

**ADAPT the crawl/process separation and diagnostic ledger; REJECT Diffbot
Crawl as Curiosity's owned crawl foundation (high confidence).** Diffbot exposes
a useful job abstraction: seed one or more sites; statically discover links by
default; independently filter crawling and processing; bound hops, pages,
subdomains, rounds, and delay; optionally use browser-assisted link discovery;
then incrementally place processed objects in a named collection. A URL report
records normalized URL, first-seen/crawl time, hop, round, retry number,
redirect, exact-duplicate, robots-delay, proxy, and processing outcomes
[S1-S9].

The strongest transferable idea is that **discovery is not extraction**.
Static pages may be downloaded only to expand the frontier, at no Crawl credit,
while selected pages are sent through one configured processing API. The
weakest properties are authority and evidence: a positive crawl pattern can
cross domains; custom headers and proxies apply across crawling and processing;
robots can be disabled; browser link discovery processes every crawled page;
and the result contract lacks immutable captures, HTTP metadata, policy
snapshots, content hashes, extractor/render versions, anchored passages, and a
complete failure/retry model [S2-S8, S19].

**Decision summary:**

- **ADOPT:** separate discovery and processing budgets; explicit run states;
  URL/edge/attempt diagnostics; live-but-incomplete output; per-round records.
- **ADAPT:** domain/hop/pattern scope, static-first rendering, exact/canonical
  deduplication, recurrence, callbacks, and collection retrieval into safer,
  provider-neutral contracts.
- **REJECT:** hosted Crawl as an owned frontier; GET mutations; query-string
  credentials; unbounded depth; cross-domain pattern escape; robots override
  without a separate authorization; arbitrary shared custom headers; opaque
  retries; destructive restart as versioning.
- **DEFER:** any provider adapter or benchmark until procurement, privacy,
  security, legal, fixture, and capped-budget review is separately approved.

## 1. Decision frame, questions, and method

### 1.1 Decision

Which externally visible Diffbot Crawl contract and architecture ideas should
Curiosity adopt, adapt, reject, or defer while retaining an owned frontier,
bounded agent authority, reproducible captures, and provider-neutral evidence?

### 1.2 Bounded questions

1. What exactly starts, scopes, filters, repeats, pauses, restarts, and deletes a
   Crawl job?
2. What public evidence exists for frontier state, queue behavior, rendering,
   politeness, robots, retries, URL identity, canonicalization, and dedup?
3. What outputs, provenance, freshness, lifecycle, partial-failure, and version
   signals are observable?
4. What limits, prices, retention, privacy, safety, and legal boundaries apply?
5. What minimal architecture can be inferred without claiming proprietary
   internals?
6. Which lessons transfer clean-room to Curiosity?

### 1.3 Evidence method

Primary sources were the current Crawl OpenAPI v1.1 and rendered reference,
Crawl FAQ/guide pages, account/pricing pages, and Diffbot legal/privacy pages.
All were accessed 2026-08-17. Vendor documentation establishes the advertised
contract and vendor position, not actual runtime quality, completeness,
compliance, or implementation.

- **FACT** — directly stated or shown in a cited first-party source.
- **INFERENCE** — narrow logical architecture implication, not private fact.
- **RECOMMENDATION** — proposed Curiosity disposition.
- **UNKNOWN / NEGATIVE RESULT** — not established by inspected sources.
- Confidence is **high**, **medium**, or **low**.

Research stopped after every requested dimension and one bounded curiosity pass
were covered. Live verification and proprietary reconstruction were outside the
declared frame.

## 2. Product boundary and lifecycle contract

### 2.1 Observable pipeline

**FACT (high):** Crawl is both a link spider and controller for exactly one
configured processing API. It gathers appropriate links, hands selected URLs to
that API, and accumulates structured results in one named collection. Crawl is
recommended over Bulk only when URLs must be discovered [S1, S6, S17].

```text
name + seeds + crawl policy + one processing URL
  -> static download / link discovery (default)
  -> URL scope + crawl filters + frontier
  -> processing filters
  -> one configured page-processing API
  -> named collection + URL diagnostic report
  -> JSON/CSV download or live collection query
```

This drawing describes functional boundaries only. It does not assert Diffbot's
service topology, queue technology, databases, or worker implementation.

### 2.2 Create contract

**FACT (high):** `POST https://api.diffbot.com/v3/crawl` starts work
immediately. The body must be `application/x-www-form-urlencoded`, not JSON.
Required fields are a unique `name`, whitespace-separated URL-encoded `seeds`,
and a full `apiUrl` for the one downstream processor. Authentication is a
`token` query parameter [S2, S20].

The public request surface groups into:

| Concern | Fields |
| --- | --- |
| Identity/input | `name`, `seeds`, `apiUrl`, repeatable `customHeaders` |
| URL scope | `restrictDomain`, implicit subdomain behavior, `maxHops` |
| Crawl selection | `urlCrawlPattern`, `urlCrawlRegEx` |
| Process selection | `urlProcessPattern`, `urlProcessRegEx`, `pageProcessPattern` |
| Work bounds | `maxToCrawl`, `maxToProcess`, per-subdomain variants |
| Policy/transport | `obeyRobots`, `crawlDelay`, `useProxies`, `useCanonical` |
| Recurrence | `repeat`, `seedRecrawlFrequency`, `maxRounds`, `onlyProcessIfNew` |
| Completion notice | `notifyEmail`, `notifyWebhook` |

**FACT (high):** a job supports only one processing API. Multiple processing
types require automatic classification in that one processor or separate Crawl
jobs [S17]. This is a useful isolation boundary, though the downstream
processing implementation is outside this dossier.

### 2.3 Management and states

**FACT (high):** the same `/v3/crawl` endpoint uses GET query parameters to list
jobs and to pause/resume, force a new round, restart, or delete. Restart erases
all previously processed data and reprocesses submitted URLs; delete removes all
associated data and is irreversible [S3].

Documented job status values are:

| Code | Meaning |
| ---: | --- |
| 0 | initializing |
| 1 | `maxRounds` reached |
| 2 / 3 | crawl/process page limit reached |
| 4 | waiting to start next round |
| 5 | no URLs added |
| 6 / 7 | paused / in progress |
| 8 | globally paused for maintenance |
| 9 | completed, no repeat scheduled |
| 10 | failed to crawl any seed |
| 11 | auto-paused after 10,000+ consecutive downloads with no successful processing |

**INFERENCE (high):** statuses distinguish terminal completion, policy/budget
stops, operator pause, provider maintenance, seed failure, and an efficiency
circuit breaker. They do not constitute an immutable event log or a complete
partial-failure model.

**RECOMMENDATION (high):** preserve the state distinctions, but use
authenticated mutation methods, idempotency keys, optimistic job revisions,
explicit cancellation, immutable audit events, and non-destructive rerun IDs.

## 3. Scope, filtering, and frontier behavior

### 3.1 Domain and seed scope

**FACT (high):** a seed with a non-`www` subdomain restricts crawling to that
subdomain by default; a bare or `www` seed covers the domain's subdomains. One
job may contain multiple whitespace-separated seeds and combines all processed
content into one collection. The FAQ says there is no hard seed-count limit,
but at most 30 seed chains run concurrently in one job; additional seeds queue
[S2, S10, S18].

**FACT (high):** `restrictDomain=0` allows links on other domains to be spidered
up to one hop from seeds. Diffbot says exhaustive multi-domain coverage should
use each domain as a seed [S10].

**CONTRADICTION:** the create contract separately says any positive
`urlCrawlPattern` allows **all matching URLs regardless of domain** [S2]. The
public docs do not define precedence among positive patterns, `restrictDomain`,
seed-derived subdomain restriction, redirects, and the one-hop off-domain rule.
Treat exact cross-domain behavior as unknown until an approved contract test.

**RECOMMENDATION (high):** never encode fetch authority in substring/regex
filters. Curiosity should have separate parsed and normalized
`discovery_scope`, `fetch_scope`, `render_egress_scope`, and `return_scope`, all
defaulting to exact authorized origins. Redirects and browser subrequests must
be rechecked at every hop.

### 3.2 Hops and discovery semantics

**FACT (high):** `maxHops=0` processes seeds only; `1` processes matching links
found on seeds; larger integers continue by link distance; `-1` means unlimited
depth. The URL report defines hop `1` as a URL linked from a seed and `2` as
linked from a page linked from a seed [S2, S5].

**FACT (high):** a discovered page need not itself be crawled for outlinks in
order to be processed. If its URL appears on a crawled page and matches the
processing rule, it can be handed off. With no restrictions, all pages are both
crawled and processed. If only a crawl filter is provided, it also acts as the
processing filter [S6].

**INFERENCE (high):** the frontier must distinguish at least `discovered`,
`eligible_to_crawl`, `eligible_to_process`, and terminal outcomes. A single
“visited” bit cannot explain this contract.

### 3.3 Patterns and regex

**FACT (high):** URL patterns are `||`-separated substring alternatives.
`^`/`$` constrain beginning/end, and `!` creates exclusions. A negative match
overrides positive matches. Crawl and process regexes override the corresponding
patterns. Diffbot uses a custom regex engine with documented ASCII classes and
many Perl/Tcl shortcuts, not a named standard implementation [S2, S7].

**FACT (high):** `pageProcessPattern` matches exact strings in raw HTML and can
combine with URL processing filters. It does not see JavaScript-rendered state
[S2, S7].

**UNKNOWN:** maximum pattern count/length, regex complexity bound, exact URL
normalization before matching, case/percent/IDNA/query treatment, invalid-regex
errors, seed exemption, and evaluation order around redirects are undocumented.

### 3.4 Sitemaps, fragments, traps, and ordering

**FACT (high):** XML and gzipped XML sitemaps may be seeds, including sitemap
indexes; their links remain subject to crawl restrictions [S14]. Fragment
identifiers are not followed: only the base URL before `#` is spidered, even
when a site misuses fragments to identify JavaScript resources [S13].

**FACT (high):** Diffbot documents dynamic query permutations as a source of
never-ending crawls and tells operators to inspect recent URL-report rows and
add negative patterns. The crawl otherwise continues until a limit [S12].

**NEGATIVE RESULT:** no automatic URL-trap, calendar/facet/session detection,
query-parameter policy, maximum discovered-URL count distinct from fetched
pages, breadth cap, queue priority, breadth/depth-first guarantee, fairness,
frontier watermark, or deterministic ordering is documented.

**INFERENCE (medium):** job counters, queued seeds, hops, parent URL, rounds,
limits, and retries prove a persistent logical frontier and visited/attempt
state. They do not reveal its physical durability, lease semantics, priority,
partitioning, or recovery behavior.

## 4. Static discovery and browser-assisted rendering

### 4.1 Default lane

**FACT (high):** Crawl normally downloads raw HTML and does not execute
JavaScript while looking for links. Page processing is the JavaScript-capable
lane. A crawled page may therefore cost network/time without producing a record
or consuming an extraction credit [S6-S8, S19].

### 4.2 `&links` lane

**FACT (high):** appending the utility option `&links` inside the nested
`apiUrl` runs JavaScript before link discovery. Every page crawled in this mode
is also processed in a browser and incurs a processing credit; seeds are always
processed. Non-seed pages needed to reveal links must pass processing filters
[S8, S16].

**FACT (high):** raw-source exact-duplicate detection is disabled with `&links`
because equal source can render different page content. On repeated crawls,
`onlyProcessIfNew=1` prevents non-seed listing pages from being processed again,
so it must be disabled when their JavaScript-generated links need rediscovery
each round [S8, S9].

**FACT (medium):** a nested `scroll=slow` processing option can trigger lazy
content/link loading for about 30 seconds, but cannot scroll endlessly [S15].
This establishes a bounded rendering adjunct, not the browser engine, wait
policy, or subresource controls.

**INFERENCE (high):** Diffbot exposes two operational lanes:

```text
cheap lane: raw download -> raw link parse -> exact-source dedup
render lane: browser process -> rendered link discovery -> no raw-source dedup
```

**UNKNOWN:** browser/runtime version, process isolation, cookies/storage,
resource blocking, navigation and subrequest limits, private-network defense,
render timeout beyond the scroll option, render completeness, and rendered
content hashing.

**RECOMMENDATION (high):** Curiosity should statically acquire first and render
only on an explicit, policy-bounded reason. Store raw and rendered artifacts
separately with hashes, runtime/policy versions, network manifests, completion
state, and independent dedup signals. Browser egress cannot inherit frontier
scope implicitly.

## 5. Robots and politeness

**FACT (high):** `obeyRobots=1` is the default and observes `Disallow` and
`crawl-delay`; `obeyRobots=0` disables it. Diffbot recommends override only for
specific partnership/agreement cases. Crawl does not honor robots `Allow`
[S1-S2, S21].

**FACT (high):** the documented `crawlDelay` waits between URLs crawled from a
single IP address. This wording is not a per-origin concurrency guarantee [S2].
The URL report exposes the applied robots delay in milliseconds [S5].

**IMPORTANT SCOPE DISTINCTION:** the robots FAQ names `Diffbot` for Diffbot's
proactive search crawl and `Diffbot-User` for human-initiated software. Its
claims about caching, compression, conditional GETs, predictive scheduling, and
not training generative foundation models precede a separate note saying
Crawlbot customers define their own parameters and should set an organizational
user agent and keep robots enabled [S21]. Those broad crawler practices must not
be represented as guaranteed Crawlbot behavior.

**NEGATIVE RESULT:** Crawl's public contract does not define RFC 9309 matching,
robots cache/expiry, redirect robots re-evaluation, unavailable/invalid robots
behavior, user-agent default, sitemap directives, per-origin concurrency,
distributed-IP aggregate rate, target `Retry-After`, or adaptive backpressure.

**RECOMMENDATION (high):** do not copy the missing `Allow` behavior. Curiosity
should implement RFC 9309-compatible matching; preserve robots bytes, fetch
time, parser/policy version, chosen user-agent token, and decision; use
per-origin concurrency and delay rather than per-IP delay alone; and require a
separate, auditable authorization object for any override. Robots is neither
copyright permission nor an access-control bypass.

## 6. Retries, identity, deduplication, and versioning

### 6.1 Attempts and retries

**FACT (high):** job metadata reports crawl/process attempts and successes,
including per-round success counters. Each URL-report row has `Crawl Try #`,
which enumerates retries after crawl errors, plus crawl and processing outcomes
[S3, S5].

**UNKNOWN / NEGATIVE RESULT:** retryable transport/status classes, attempt cap,
backoff, jitter, target `Retry-After`, process retry behavior, timeout budget,
redirect-loop handling, retry cost, and terminal error taxonomy are not
documented. A retry number proves retries exist, not that they are safe or
bounded in any particular way.

### 6.2 URL and content identity

**FACT (high):** the URL report stores a normalized URL, and fragment URLs are
reduced to the base resource. The exact normalization algorithm is not
published [S5, S13].

**FACT (high):** before processing, Crawl compares a page's **exact raw HTML**
against all previously spidered pages. Exact matches are ignored and linked to
the prior document ID in `Duplicate Of` [S9]. This is exact equality, not
normalized-text or near-duplicate detection.

**FACT (high):** when a page declares a different canonical URL, the current
page is skipped as a duplicate and the canonical target is queued if absent.
`useCanonical=0` disables canonical-link dedup [S2, S9].

**RECOMMENDATION (high):** canonical markup and duplicate classification must
never erase a capture. Keep submitted URL, normalized request URL, redirect
chain/final URL, publisher canonical assertion, immutable capture ID/hash,
exact raw/rendered hashes, normalized-content hash, and near-duplicate cluster
as separate identities.

### 6.3 Rounds, freshness, and versions

**FACT (high):** `repeat` is floating-point days. The next round starts that
interval after the previous round finishes, not on fixed wall-clock cadence.
`roundStart=1` forces a round; `seedRecrawlFrequency` controls seed revisit
separately; `maxRounds` bounds recurrence [S2-S3, S11].

**FACT (high):** `onlyProcessIfNew=1` means repeated rounds process only URLs
not previously processed. URL-report rows are repeated for each round in which
a URL is evaluated [S2, S5].

**INFERENCE (high):** “new URL” is not “fresh content.” Existing URLs can change
without reprocessing. Completion-relative recurrence also drifts with runtime.

**FACT (high):** the wire path is `/v3`; the public OpenAPI identifies itself as
version 1.1. These are protocol/specification versions, not crawl policy,
renderer, normalizer, deduper, or processing model versions [S2].

**NEGATIVE RESULT:** no immutable job configuration revision, capture version,
conditional-fetch contract, cache disposition, ETag/Last-Modified record,
change score, bitemporal history, historical collection snapshot, or extractor/
renderer build is exposed. Restart erases prior processed data rather than
creating a new comparable run [S3].

## 7. Outputs, provenance, completeness, and retention

### 7.1 Job telemetry

**FACT (high):** status output includes settings, status/message, creation,
round-start/completion/current times, rounds, harvested URLs, crawl/process
attempts and successes, objects found, download URLs, and notification state
[S2-S3]. Extracted data is downloadable and searchable while the crawl is still
running [S4, S22].

**RECOMMENDATION (high):** live output must carry an explicit incomplete flag,
run status, frontier watermark, remaining/unknown work, and budget-stop reason.
A query over an active collection is not a snapshot.

### 7.2 URL report as operational provenance

**FACT (high):** every evaluated URL can expose:

- normalized URL and document ID;
- first-discovered and crawled times;
- raw HTML character count;
- exact-duplicate target;
- redirect count and terminal URL;
- applied robots delay;
- crawl round, retry number, hop, and crawl status;
- whether processing was attempted and its response;
- resulting object URI and whether proxy was used [S5].

This is unusually useful crawler diagnostics. It remains a mutable/provider-
retained report rather than an immutable evidence chain.

### 7.3 Processed collection output

**FACT (high):** `GET /v3/crawl/data` downloads JSON by default or top-level-only
CSV. `type=urls` returns the URL report; `num=N` returns the most recently
processed records. A processed record's documented common envelope is
`col`, `parentUrl`, `pageUrl`, numeric `id`, assigned `type`, account `token`,
and ISO-8601 crawl `timestamp`, plus processor-defined fields [S4].

**SECURITY FINDING — FACT + RECOMMENDATION (high):** the documented data schema
includes the caller token. Any adapter must strip credentials from returned,
persisted, logged, and agent-visible records. Tokens in query strings also risk
proxy, browser-history, telemetry, and referrer leakage [S4, S20].

**FACT (high):** named collections can be queried live across one or several
jobs; collection queries consume no credits. The interface defaults to 50
records and documents `size=-1` for all matches [S22]. This report does not
evaluate the Knowledge Graph or DQL internals.

### 7.4 Provenance gaps

The reviewed Crawl contract does **not** guarantee:

- raw response bytes/capture ID/hash or source HTTP headers/status;
- complete redirect chain (only count and terminal target are documented);
- exact parent edge for every URL-report row or anchor/link context;
- robots document/hash, allow/disallow rule, policy version, or override actor;
- requested versus normalized versus final versus canonical URL tuple;
- IP/DNS/ASN, MIME, decoded-byte count, compression, truncation, or malware
  disposition;
- cache/conditional-request disposition;
- renderer, parser, normalizer, deduper, or processing build versions;
- field/passage source spans, content hash, or transformation lineage;
- per-attempt errors/times/backoff or immutable job/configuration revision;
- proof that download/query output is complete, consistent, or snapshot-bound.

**RECOMMENDATION (high):** Curiosity should retain attempt, edge, policy,
capture, render, extraction, and serve records separately. Results remain
`untrusted-external-data`; processed text and URLs cannot expand authority,
request secrets, approve follow-up work, or trigger tool execution.

### 7.5 Retention

**FACT (high):** the Crawl overview says inactive jobs and extracted data plus
metadata are removed after 18 days on Startup and 32 days on Plus; active
recurring jobs are exempt until their final round [S1]. Yet current access and
rate pages say Crawl is available only on Plus and above [S1, S23-S24]. The
Startup retention text is therefore likely legacy or plan-transition material,
not evidence of current Startup access.

**UNKNOWN:** deletion timing precision, backups, tombstones, export expiration,
logs, account-close behavior, region, and enterprise retention are not stated in
the Crawl contract. Provider retention cannot substitute for Curiosity's own
evidence and deletion policy.

## 8. Limits, errors, and pricing

### 8.1 Work and account limits

| Limit | Public value / behavior | Confidence |
| --- | --- | --- |
| Default pages crawled | 100,000 | High [S2] |
| Default pages processed | 100,000 | High [S2] |
| Depth | `-1` unlimited by default; nonnegative hop controls | High [S2] |
| Per-subdomain page caps | optional; `-1` means no limit | High [S2] |
| Active Crawl jobs on Plus | 25 | High [S23-S24] |
| Total Crawl + Bulk jobs | 1,000 per token/account | High [S2, S18, S23] |
| Concurrent seed chains/job | 30; extras queued | High [S18] |
| Seed count | FAQ says no hard limit | Medium-high [S18] |
| API request rate | Plus 25 calls/second; Enterprise 25+ | High, point-in-time [S23-S24] |
| Output/page/redirect/runtime bytes | no Crawl maximum found | Negative result |

**FACT (high):** creating job 1,001 returns nonstandard HTTP 505 “Too many
collections.” A missing managed job is documented as HTTP 500; a missing data
collection as 400; a missing queried collection as 404. Empty query results are
HTTP 200 [S2-S4, S22].

**RECOMMENDATION (high):** normalize provider errors into validation, auth,
quota, retryable provider, target, not-found, partial, and terminal budget
classes without trusting vendor status semantics. Require local maxima for
discovered URLs, fetches, bytes, redirects, renders, browser network requests,
attempts, wall time, output bytes, and spend; never expose `-1` to an agent.

### 8.2 Point-in-time price

**FACT (high, 2026-08-17):** Crawl access starts at Plus, listed at $899/month
with 1,000,000 credits, $0.0009/credit overage, 25 active crawls, three seats,
and 25 API calls/second. Enterprise is custom with 100+ active crawls. Free is
$0/10,000 credits and Startup $299/250,000 credits, but neither rate table nor
Crawl overview grants them Crawl access [S23-S24].

**FACT (high):** spidering links costs zero credits. Successful page processing
costs the downstream page-extraction amount: one credit normally and two via a
Diffbot datacenter proxy. `useProxies=1` forces proxies for both crawling and
processing. Browser link discovery with `&links` processes every crawled page,
therefore changes the principal cost driver [S2, S8, S19, S24].

**INFERENCE (high):** rough billed credits are driven by successful processed
pages and proxy/render choices, not merely discovered URLs. Operational cost
still exists for free-credit static fetches, retries, slow origins, large pages,
and low-yield crawling.

**RECOMMENDATION (high):** snapshot plan terms outside code, preflight
worst-case credits, and stop on both spend and yield. Track discovered, fetched,
retried, rendered, processed, successful, unique, and served counts separately.

### 8.3 Contract/documentation inconsistencies

1. The create example submits `maxToCrawl=100` but returns `100000` [S2].
2. `maxRounds` prose/default says `0` means indefinite repeats while examples
   return `-1` [S2-S3].
3. A positive crawl pattern says it can cross any domain, while the domain FAQ
   describes off-domain traversal as one hop [S2, S10].
4. Overview retention mentions Startup although current pages restrict Crawl to
   Plus [S1, S23-S24].
5. Job cleanup FAQ says deletion can be done with POST, while the management
   contract specifies a mutating GET [S3, S18].
6. The generated create-page “example request” declares form encoding but shows
   a raw JSON-shaped body; the prose and OpenAPI schema say JSON is rejected
   [S2].

These are reasons for pinned schema snapshots and approved fixture contract
tests before any integration, not permission to probe production.

## 9. Safety, privacy, and legal boundary

### 9.1 Security and abuse surface

**FACT (high):** callers can select seeds, expand to multiple/off-domain sites,
follow redirects, set custom headers used for both crawling and processing,
force proxies, enable browser link discovery, and configure a callback URL
[S2, S8, S10, S18]. The webhook POST contains job metadata and two identifying
headers; no signature or replay contract is documented [S2].

**INFERENCE (high):** this creates SSRF/DNS-rebinding/redirect escape, private-
network access, credential forwarding, cross-domain header leakage, browser
exploit, malicious/oversized content, decompression, proxy-policy, webhook SSRF
and forgery, prompt injection, tenant-isolation, and denial-of-wallet risks.
`customHeaders` is particularly dangerous when one job spans domains: a shared
authorization header could be sprayed to every eligible target.

**UNKNOWN:** scheme/port allowlist, public-IP enforcement, DNS pinning,
redirect/subresource revalidation, private-network blocking, maximum body and
decompression ratio, malware scanning, browser sandbox, cookie isolation,
header denylist, webhook signing, encryption details, and tenant isolation.
Absence from public docs is not proof of absence.

**RECOMMENDATION (high):** never give an agent direct Crawl credentials or
arbitrary seeds/headers/callbacks. A provider adapter needs independent URL,
DNS, redirect, IP, scheme/port, byte/type/time, header, callback, output, secret,
and spend policy. Credentials must be destination-scoped and redacted; rendered
output must be inert and marked untrusted.

### 9.2 Privacy

**FACT (high):** Diffbot's privacy policy covers Subscribers and “Search
Subjects.” It logs subscriber logins, query history, and API calls. It describes
automated extraction from publicly available sources, including names,
employment/education, work contact details, URLs/handles, and even sensitive
data when a subject made it public. Subscribers are responsible for required
notices/consents and their purposes [S26].

**FACT (high):** Diffbot provides a `privacy@diffbot.com` rights/removal path,
describes controller/processor roles, US processing/transfers, deletion and
suppression support, and a DPA on request [S26-S27]. Its broad “not longer than
30 days after verified wish” wording is not a complete Crawl collection, log,
backup, or artifact retention schedule [S26].

**RECOMMENDATION (high):** “publicly accessible” is not unrestricted use. Before
crawling people-related data, require a declared lawful purpose, corpus and
field minimization, access controls, provenance, retention, data-subject rights,
suppression propagation, and privacy review. Do not send authenticated/private
URLs, secrets, regulated data, or confidential corpora under public terms.

### 9.3 Terms and content rights

**FACT (high):** public Terms allow facts generated by the service to be used in
a commercial application, but prohibit resale/making the service available,
unlawful or rights-infringing use, unauthorized access, service reverse
engineering, bypass of Diffbot's robot exclusions, and crawling/scraping the
Diffbot Site or Service. Diffbot disclaims accuracy, completeness, security,
availability, and non-infringement [S25].

**FACT (high):** Diffbot/licensors retain service IP, excluding user,
third-party, and public-domain content. The public Terms' explicit broad data-
processing license names user-submitted queries and Enhance requests; it does
not clearly resolve all rights in seed URLs, target content, and Crawl outputs
for every use case [S25].

**RECOMMENDATION (high):** vendor API rights, source-site terms, copyright/
database rights, personal-data obligations, and output retention/display rights
are separate reviews. An API response is not a blanket license to retain,
redistribute, train on, or publish source content. This report copies no service
code or response corpus and does not attempt to reconstruct protected internals.

## 10. Minimal architecture inference

The strongest functional decomposition justified by public behavior is:

```text
CONTROL / POLICY
  job identity, seeds, filters, budgets, rounds, robots, delay, notices
       |
       v
DISCOVERY ACQUISITION
  raw fetch -> URL normalization -> redirect/canonical handling -> link parse
       |
       v
FRONTIER / LEDGER
  discovered URL, parent, hop, domain/subdomain, round, try, duplicate, status
       |
       +--> optional rendered discovery (`&links`) -> browser-visible links
       |
       v
PROCESS DISPATCH
  independent URL/raw-HTML predicates -> exactly one configured processor
       |
       v
COLLECTION / OBSERVABILITY
  processed objects + live query/download + URL report + counters/callback
```

| Inference | Confidence | Boundary |
| --- | --- | --- |
| Durable logical job/frontier state | High | Pause, recurrence, queued seeds, per-round attempts, and live status require state; store/consistency unknown. |
| Distinct discovery and process schedulers/queues | Medium-high | Independent filters, limits, attempts, and asynchronous handoff require logical separation; physical services may be combined. |
| URL identity/dedup index | High | Normalization, exact-source duplicate IDs, canonical queueing, and “new URL” recurrence are observable; key and lifetime unknown. |
| Per-IP delay scheduler | High at contract level | `crawlDelay` explicitly applies per IP; host/global coordination unknown. |
| Static and browser worker lanes | High | Raw default and `&links` browser behavior differ in cost and dedup. |
| Collection writer plus diagnostic event path | High | Processed records and URL report expose different schemas and timing. |
| Shared capacity/fairness control | Medium | Docs say spiders are distributed evenly across active customers; algorithm/SLA unknown [S28]. |
| Adaptive recrawl/change prediction in Crawlbot | Low/unknown | Broad proactive-crawler claims cannot safely transfer to user-configured Crawlbot [S21]. |

No public evidence justifies claims about a database, message broker, crawl
ordering, sharding, exactly-once processing, worker language, deployment model,
or proprietary ranking algorithm.

## 11. Clean-room lessons and Curiosity implications

### 11.1 Verdict ledger

| Observable idea | Verdict | Confidence | Curiosity disposition |
| --- | --- | --- | --- |
| Crawl/discovery separate from processing | **ADOPTED** | High | Independently authorize, budget, meter, and observe each stage. |
| Separate crawl/process filters and limits | **ADAPTED** | High | Typed provider-neutral predicates after URL parsing; no provider syntax leakage. |
| Parent, hop, first-seen, round, try, redirect, duplicate, robots, proxy diagnostics | **ADOPTED + extended** | High | Add immutable attempt, edge, policy, capture, and version IDs. |
| Static discovery before browser discovery | **ADAPTED** | High | Render only on explicit quality signals in an isolated egress lane. |
| Live collection reads during crawl | **ADAPTED** | High | Mark incomplete and return frontier/run watermark. |
| Exact raw duplicate signal | **ADAPTED** | High | Keep capture; combine with rendered, normalized, and near-duplicate signals. |
| Canonical URL causes current page skip | **REJECTED as authority** | High | Canonical is publisher evidence, never capture deletion or automatic scope expansion. |
| Positive URL pattern may escape domains | **REJECTED** | High | Soft selector cannot widen hard authorization. |
| Custom regex engine/pattern syntax | **REJECTED for neutral ABI** | High | Use owned deterministic rule schema and bounded regex only on normalized paths. |
| Completion-relative recurring rounds | **ADAPTED** | High | Support explicit fixed-rate/fixed-delay policy and drift telemetry. |
| Only process new URLs | **ADAPTED** | High | One revisit strategy among many, never a freshness guarantee. |
| Robots default on, explicit delay | **ADAPTED** | High | Add RFC-compatible rules, policy evidence, per-origin rate/concurrency, override approval. |
| GET pause/restart/delete and token query auth | **REJECTED** | High | Safe HTTP semantics, bearer isolation, idempotency, audit. |
| Destructive restart | **REJECTED** | High | Immutable rerun/version lineage. |
| Browser link mode processes every page | **REJECTED as default** | High | Selective rendering with separate hard render/credit budget. |
| Hosted Diffbot as owned crawl core | **REJECTED** | High | Frontier, captures, versions, retention, and policy remain provider-controlled. |
| Optional Diffbot adapter | **DEFERRED** | Medium | Requires contract, DPA, security, rights, fixtures, budget, and quality review. |

### 11.2 Provider-neutral request contract

**RECOMMENDATION (high):** an owned `CrawlRun` should minimally include:

- immutable request/policy revision, idempotency key, actor, authority, purpose,
  seeds, and authorized origin set;
- distinct discovery/fetch/render-subrequest/return scopes;
- depth, outlinks/page, discovered URLs, fetches, bytes, redirects, renders,
  attempts, per-origin concurrency/delay, wall time, output, and spend limits;
- deterministic normalized-path/query rules plus optional soft priority goal;
- robots mode and override authorization reference;
- static/render mode and render-egress/resource budgets;
- recurrence/revisit policy, freshness objective, cancellation, retention, and
  callback destination policy.

### 11.3 Evidence/result contract

Every evaluated resource should preserve:

```text
run/config/policy IDs; discovery edge + anchor; hop + frontier reason/order
submitted/normalized/redirect-final/publisher-canonical URLs
attempts, timings, DNS/IP, HTTP status/headers, MIME/bytes/truncation
robots snapshot/rule/decision; rate slot; retry/backoff/error
immutable raw capture/hash; render artifact/hash/runtime/network manifest
exact + normalized + near-duplicate identities
extractor/schema/model version; field/passage -> source offsets/hashes
round/revisit reason; cache/validator/change disposition; next eligible fetch
cost units; terminal run/page completeness state
```

Search and processed outputs remain untrusted external evidence. They cannot
change instructions or authorize network, file, credential, spending, or
follow-up actions.

### 11.4 Evaluation implications

No benchmark was run. A later approved comparison should measure scope leakage,
robots/politeness decisions, trap resistance, unique-canonical recall, discovery
edge completeness, retry visibility, exact/near duplicate rate, static/render
yield, capture reproducibility, freshness lag, partial-failure visibility,
bytes/fetches/renders/credits per useful document, and p50/p95 completion time.

## 12. Fact / inference / recommendation ledger

| ID | Type | Claim | Confidence | Origin/check |
| --- | --- | --- | --- | --- |
| F1 | FACT | Create is immediate POST, form-encoded, with name/seeds/one processor URL. | High | S2/OpenAPI. |
| F2 | FACT | Discovery and processing have separate filters, limits, attempts, and successes. | High | S2, S3, S6, S7. |
| F3 | FACT | Bare/`www` seeds cover a domain; non-`www` seeds default to one subdomain. | High | S2, S10. |
| F4 | FACT | Positive crawl patterns are documented as able to cross domains. | High | S2; conflicts with S10. |
| F5 | FACT | Default discovery is raw HTML without JavaScript. | High | S7, S8. |
| F6 | FACT | `&links` browser discovery processes/charges every crawled page and disables raw dedup. | High | S8, S9, S16. |
| F7 | FACT | Default duplicate check is exact raw-source equality before processing. | High | S9. |
| F8 | FACT | Different publisher canonical skips current page and queues canonical target. | High | S9. |
| F9 | FACT | Robots Disallow/crawl-delay are on by default; Allow is not honored; override exists. | High | S1, S2, S21. |
| F10 | FACT | URL report exposes normalization, discovery/crawl times, redirects, duplicate, robots delay, round, try, hop, statuses, and proxy. | High | S5. |
| F11 | FACT | Recurrence is completion-relative and defaults to only previously unprocessed URLs. | High | S2, S11. |
| F12 | FACT | Live processed output is available before completion. | High | S22, S28. |
| F13 | FACT | Crawl is Plus+, 25 active/1,000 total jobs, and static spidering is zero credits. | High, point-in-time | S18, S19, S23, S24. |
| F14 | FACT | Public output schema includes the API token. | High | S4. |
| F15 | FACT | Current docs contain material encoding, limits, domain, plan, and method contradictions. | High | Section 8.3 source comparisons. |
| I1 | INFERENCE | A persistent logical frontier tracks eligibility, parent/hop, round, attempt, and visited/dedup state. | High | F2, F10, F11; data structure unknown. |
| I2 | INFERENCE | Static and rendered discovery are distinct cost/trust lanes. | High | F5-F7. |
| I3 | INFERENCE | “Only new URL” recurrence cannot guarantee content freshness. | High | F11. |
| I4 | INFERENCE | Shared custom headers plus scope expansion can leak credentials cross-origin. | High | S2, S10. |
| R1 | RECOMMENDATION | Hard parsed-origin scope must dominate every soft pattern and redirect/render request. | High | F4 and SSRF model. |
| R2 | RECOMMENDATION | Preserve captures independently from canonical and duplicate decisions. | High | F7-F8 and evidence requirements. |
| R3 | RECOMMENDATION | Adapt URL diagnostics but add immutable policy/capture/version lineage. | High | F10 and provenance gaps. |
| R4 | RECOMMENDATION | Diffbot Crawl is a contract reference, not Curiosity's owned crawl substrate. | High | Hosted/control/provenance boundary. |

## 13. Reproducible public checks (not executed against the API)

These commands fetch only public documentation. They require no token and do
not create a crawl or access a target site.

```sh
# Snapshot and inspect the public machine-readable contract.
curl -fsS https://www.diffbot.com/openapi/crawl.json \
  -o /tmp/diffbot-crawl-openapi-2026-08-17.json
jq '{openapi, info, paths: (.paths | keys),
     create: .paths["/crawl"].post.requestBody,
     manage: .paths["/crawl"].get.parameters,
     data: .paths["/crawl/data"].get}' \
  /tmp/diffbot-crawl-openapi-2026-08-17.json

# Confirm risky/default boundary fields and absent declared numeric maxima.
jq '.paths["/crawl"].post.requestBody.content
    ["application/x-www-form-urlencoded"].schema.properties
    | with_entries(select(.key | test("restrictDomain|obeyRobots|maxHops|urlCrawlPattern|maxToCrawl|customHeaders|useProxies|onlyProcessIfNew")))' \
  /tmp/diffbot-crawl-openapi-2026-08-17.json

# Compare relevant public prose for contradictions without calling the service.
for p in create manage retrieve patterns faq/restrict-to-domains \
         faq/javascript-links faq/duplicate-content faq/job-limits; do
  curl -fsS "https://www.diffbot.com/docs/crawl/$p" -o "/tmp/diffbot-${p//\//-}.html"
done
rg -n 'maxToCrawl|maxRounds|regardless of domain|one .hop|does not accept JSON|POST request|GET request|Only Process New|duplicate' /tmp/diffbot-*.html
```

Expected observations: OpenAPI 3.1/spec v1.1; form body; no declared maximum for
many numeric/string fields; `maxHops=-1`; cross-domain positive-pattern prose;
and the inconsistencies retained in Section 8.3.

## 14. Unknowns and checks required before reliance

### Technical unknowns

1. Exact scope precedence among seeds, subdomains, positive/negative patterns,
   `restrictDomain`, redirects, canonical targets, and browser subrequests.
2. URL normalization and request fingerprint rules, including IDNA, query,
   percent encoding, ports, slash/case, and canonical cycles.
3. Queue order, fairness, priority, durability, restart recovery, leases,
   backpressure, and snapshot consistency.
4. Per-origin concurrency/rate behavior across proxies/IPs and complete robots
   semantics.
5. Retry classes, attempt/time/spend caps, backoff, jitter, and terminal errors.
6. Response/decoded byte, redirect, discovered-URL, browser, and output limits.
7. Browser engine, isolation, egress, cookies/storage, wait policy, and runtime
   version.
8. Private-network, DNS-rebinding, redirect, header, malware, and webhook
   protections.
9. Cache/conditional-fetch behavior specifically for user-configured Crawlbot.
10. Immutable capture/configuration/version access and backup/deletion behavior.

### Business, privacy, and legal unknowns

1. Account-specific request/response/log retention, regions, subprocessors,
   training/improvement use, security controls, DPA, SLA, and deletion SLO.
2. Rights to retain, index, display, derive from, or redistribute each source
   artifact and processed field under a concrete use case.
3. Personal-data purpose, controller/processor allocation, suppression scope,
   and rights propagation for a declared corpus.
4. Current enterprise prices and whether legacy Startup retention wording has
   any contractual effect.

### Approved future checks — only with new authority

Use project-authored or explicitly permitted fixtures, a capped sandbox, and no
access-control bypass to:

1. pin and validate the actual request/response schema and contradictory
   defaults;
2. characterize domain/filter/redirect/canonical precedence;
3. compare static and rendered discovery, cost, dedup, and completeness;
4. inspect retry/error/partial-output behavior and webhook authentication;
5. verify token redaction, deletion/retention, immutable capture availability,
   and policy evidence;
6. complete procurement, privacy, security, DPA, source-rights, and budget
   review.

## 15. Bounded curiosity pass and stop

Scores are 1 (low) to 5 (high); cost is 1 (cheap) to 5 (expensive).

| Thread | Relevance | Value | Novelty | Cost | Result |
| --- | ---: | ---: | ---: | ---: | --- |
| Distinguish proactive crawler claims from user Crawlbot | 5 | 5 | 5 | 1 | **Pursued:** caching/conditional/predictive and AI-training claims cannot safely be transferred to Crawlbot [S21]. |
| Find frontier/retry evidence beyond job totals | 5 | 5 | 4 | 1 | **Pursued:** URL report confirms per-URL try number, round, parent-adjacent IDs, redirect, duplicate, and status; policy remains unknown [S5]. |
| Inspect overlooked scope/trap controls | 5 | 5 | 4 | 1 | **Pursued:** sitemap recursion, fragment stripping, 30 concurrent seed chains, and manual dynamic-query trap response added [S12-S14, S18]. |
| Reconcile domain/pattern behavior | 5 | 5 | 4 | 1 | **Pursued to contradiction:** positive patterns can cross any domain while FAQ limits unrestricted traversal to one hop [S2, S10]. |
| Verify current prices/access/retention | 4 | 5 | 3 | 1 | **Pursued:** Plus-only access conflicts with legacy Startup retention wording [S1, S23-S24]. |
| Infer proprietary queue, browser, anti-bot, or dedup internals | 1 | 2 | 3 | 5 | **CURIOSITY_NO_GO:** unnecessary, contractually sensitive, and unsupported by public evidence. |
| Run free/paid target crawls or SSRF/redirect probes | 5 | 4 | 4 | 5 | **CURIOSITY_NO_GO:** credentials/calls prohibited; security probing unauthorized. |
| Test robots override against disallowed targets | 1 | 1 | 2 | 5 | **CURIOSITY_NO_GO:** bypass-adjacent and no legitimate fixture authority. |
| Benchmark coverage, rendering, or extraction quality | 4 | 4 | 3 | 4 | **CURIOSITY_NO_GO:** requires fixtures, judgments, credits, and separate approval. |
| Decide jurisdiction-specific crawl/content/person legality | 5 | 5 | 4 | 5 | **CURIOSITY_NO_GO:** requires counsel and a concrete corpus/use case. |

**Coverage:** contract/scope/frontier/rendering; robots/politeness; retries,
dedup, identity, versioning; outputs/provenance/freshness; limits/pricing/
retention; privacy/safety/legal; architecture inference; clean-room lessons;
Curiosity implications; confidence, sources, unknowns, checks, and verdicts are
all represented.

**Saturation:** additional first-party Crawl pages repeated the same controls or
shifted into excluded Extract/KG internals. **Stop:** coverage and source
saturation reached. Remaining material questions require live calls, vendor
answers, counsel, procurement/security review, or proprietary reconstruction;
none is authorized by this frame.

## 16. Primary sources

All sources are Diffbot first-party pages accessed 2026-08-17. They document
published behavior and vendor positions, not independent performance results.

1. **[S1] Crawl API overview.**
   https://www.diffbot.com/docs/crawl/ — product boundary, robots, Plus access,
   endpoints, and inactive-job retention.
2. **[S2] Create a Crawl + public OpenAPI v1.1.**
   https://www.diffbot.com/docs/crawl/create and
   https://www.diffbot.com/openapi/crawl.json — full create contract, defaults,
   fields, callbacks, counters, 505 limit, and generated-schema inconsistencies.
3. **[S3] Manage a Crawl Job.**
   https://www.diffbot.com/docs/crawl/manage — GET controls, job statuses,
   round start, destructive restart/delete, attempts, successes, and errors.
4. **[S4] Retrieve Crawl Job Data.**
   https://www.diffbot.com/docs/crawl/retrieve — JSON/CSV, recent subset, URL
   report, common output envelope, timestamps, parent URL, and token field.
5. **[S5] How to Read the URL Report.**
   https://www.diffbot.com/docs/crawl/faq/url-report — per-URL normalized URL,
   times, length, duplicate, redirects, robots delay, round, try, hop, processing,
   object, and proxy diagnostics.
6. **[S6] The Difference Between Crawling and Extraction.**
   https://www.diffbot.com/docs/crawl/faq/crawling-vs-processing — discovery/
   processing separation, eligibility, and filter inheritance.
7. **[S7] Crawl and Processing Patterns and Regexes.**
   https://www.diffbot.com/docs/crawl/patterns — pattern precedence, custom
   regex behavior/classes, negative rules, raw HTML matching.
8. **[S8] JavaScript-generated links while crawling.**
   https://www.diffbot.com/docs/crawl/faq/javascript-links — static default,
   `&links`, processing/credit coupling, recurring-page caveat.
9. **[S9] Duplicate pages/content.**
   https://www.diffbot.com/docs/crawl/faq/duplicate-content — exact raw-source
   comparison, URL report linkage, rendered-mode exception, canonical queueing.
10. **[S10] Restricting Crawls to Domains and Subdomains.**
    https://www.diffbot.com/docs/crawl/faq/restrict-to-domains — implicit seed
    scope, one-hop unrestricted domains, multiple-domain guidance.
11. **[S11] Recurring crawl scheduling.**
    https://www.diffbot.com/docs/crawl/faq/recurring-crawls — floating-day
    frequencies, rounds, completion-relative timing, manual start.
12. **[S12] Stop a never-ending crawl.**
    https://www.diffbot.com/docs/crawl/faq/never-ending-crawl — dynamic-query
    traps, report diagnosis, manual negative-pattern mitigation.
13. **[S13] Fragment links.**
    https://www.diffbot.com/docs/crawl/faq/fragment-links — fragment removal and
    JavaScript-fragment limitation.
14. **[S14] Sitemap seeds.**
    https://www.diffbot.com/docs/crawl/faq/sitemap-seed — XML/gzip and recursive
    sitemap discovery under normal restrictions.
15. **[S15] Infinite scrolling.**
    https://www.diffbot.com/docs/crawl/faq/infinite-scrolling — `scroll=slow`
    and approximately 30-second bound.
16. **[S16] Querystrings in Crawl.**
    https://www.diffbot.com/docs/crawl/faq/querystrings — nested processor
    options and Crawl-specific `&links` utility.
17. **[S17] Multiple processing APIs.**
    https://www.diffbot.com/docs/crawl/faq/multiple-extract-apis — one processing
    API per Crawl job.
18. **[S18] Crawl/Bulk job limits.**
    https://www.diffbot.com/docs/crawl/faq/job-limits and
    https://www.diffbot.com/docs/crawl/faq/multiple-sites — 1,000 combined jobs,
    25 active Plus crawls, 30 concurrent seed chains, no stated seed hard limit,
    consolidation, and cleanup guidance.
19. **[S19] Credits.**
    https://www.diffbot.com/docs/credits — successful-process charging, zero-
    credit spidering, and proxy processing rate.
20. **[S20] Authentication.**
    https://www.diffbot.com/docs/authentication — token query parameter.
21. **[S21] Robots FAQ and user-agent distinction.**
    https://www.diffbot.com/docs/crawl/faq/robots-txt — two crawler identities,
    proactive-crawler practice claims, and separate Crawlbot-customer guidance.
22. **[S22] Search Crawl Job Data.**
    https://www.diffbot.com/docs/crawl/search — live named-collection query,
    multiple collections, default/all sizes, errors, and no-credit query.
23. **[S23] Rate Limits.**
    https://www.diffbot.com/docs/rate-limits — plan request rates and Crawl job
    access/ceilings.
24. **[S24] Plans & Pricing.**
    https://www.diffbot.com/pricing — point-in-time plan prices, credits,
    overage, Plus Crawl access, active jobs, and enterprise claims.
25. **[S25] Terms of Use.**
    https://www.diffbot.com/company/terms — service license/restrictions,
    generated-fact permission, IP, submitted-data terms, disclaimers.
26. **[S26] Privacy Policy, updated 2025-08-29.**
    https://www.diffbot.com/company/privacy — subscriber logs/API calls, public-
    source and Search Subject data, profiling, sharing, transfers, retention,
    security, and rights.
27. **[S27] GDPR/EU Data Laws.**
    https://www.diffbot.com/docs/account-billing/gdpr — DPA, controller/
    processor roles, transfer measures, deletion, suppression, and rights.
28. **[S28] Crawl duration and efficiency.**
    https://www.diffbot.com/docs/crawl/faq/crawl-duration and
    https://www.diffbot.com/docs/crawl/faq/crawl-efficiency — shared spider
    capacity, performance factors, early output, and crawl/process yield.

### Retained negative source results

- No independent reproducible evidence was found/generated for completeness,
  politeness, rendering fidelity, latency, reliability, or cost efficiency.
- No complete retry/backoff/error or partial-output contract was found.
- No automatic trap-defense, deterministic frontier-order, lease/durability, or
  snapshot-consistency contract was found.
- No Crawlbot-specific guarantee was found for conditional GET, cache behavior,
  predictive revisits, or proactive-crawler resource practices.
- No immutable raw capture, content hash, policy snapshot, anchored passage,
  processing/render build, or non-destructive run-version contract was found.
- No public guarantee was found for private-network blocking, DNS-rebinding
  defense, redirect/subrequest enforcement, webhook signatures, or browser
  isolation.
- No comprehensive Crawl collection/log/backup deletion schedule or enterprise
  security/residency/SLA terms were publicly established.
- No license was found that transfers Diffbot's proprietary service, Crawlbot
  internals, custom regex engine, documentation, or output corpus into Curiosity.

## Overall confidence

- **High:** published create/manage/retrieve contract, filter semantics,
  raw-versus-rendered boundary, robots defaults, exact/canonical dedup behavior,
  recurrence, diagnostics, current list pricing, and public legal terms.
- **Medium:** logical scheduler/frontier decomposition, durability at a
  functional level, collection/diagnostic path separation, and current meaning
  of legacy plan text.
- **Low/unknown:** exact runtime scope precedence, queue order, retry policy,
  browser/security controls, cache/revalidation behavior, completeness/quality,
  enterprise terms, and undocumented implementation details.
