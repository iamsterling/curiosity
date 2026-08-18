# Firecrawl Crawl: clean-room reverse-engineering dossier

**Research and source-access date:** 2026-08-17  
**Subject boundary:** Firecrawl **Crawl** (`POST /v2/crawl`, status, errors,
cancel, and the per-page Scrape behavior Crawl composes); Map, Search, Extract,
Agent, and Interact are out of scope except where Crawl invokes a shared
component.  
**Pinned OSS baseline:** Firecrawl release `v2.11.162`, resolved commit
[`7666c1f9ae8720a6bba271e0f60b6a217f8a5210`](https://github.com/firecrawl/firecrawl/tree/7666c1f9ae8720a6bba271e0f60b6a217f8a5210).
**Status:** research only. No API credential, account, paid call, live crawl,
deployment, private interface, control bypass, or code transfer was used.

## Executive decision

**ADAPT the Crawl contract and diagnostic vocabulary; do not adopt Firecrawl
Crawl as Curiosity's crawl authority or evidence ledger (high confidence).**
The strongest patterns are an asynchronous job handle, explicit scope and
frontier knobs, per-page scrape policy, independent success/error retrieval,
bounded page count, completion streaming, and explicit cache freshness.
Firecrawl also documents an important non-guarantee: concurrent frontier
discovery makes boundary coverage non-deterministic [S1-S5].

**DEFER a hosted Crawl adapter (high confidence).** Material gates remain:
per-authority robots and politeness behavior, cache and activity-log retention,
hosted engine/version provenance, exact retry and billing semantics, and
authorized SSRF/redirect tests. The pinned OSS implementation is useful
behavioral evidence, but Cloud correspondence is not established [S9-S22].

**REJECT direct server-code reuse in Curiosity's provider-neutral core (high
confidence).** The root/server repository is AGPL-3.0. The AGPL permits
unmodified use, but section 13 requires a modified network-served version to
offer its corresponding source to remote users. Firecrawl identifies some SDK
and UI subtrees separately as MIT; that does not relicense the server [S19,
S20]. No implementation text, types, tests, or prompts should be copied.

### Verdict ledger

| Pattern or product role | Verdict | Why |
| --- | --- | --- |
| Async crawl ID; poll, signed webhook, or watcher | **ADAPT** | Useful lifecycle seam; add submission idempotency and replay control. |
| Explicit path/domain/depth/sitemap/page controls | **ADOPT and strengthen** | Good vocabulary; add byte, time, outlink, per-origin, and novelty budgets. |
| Sitemap plus recursive page-link discovery | **ADAPT** | Coverage is useful but source class and discovery edge must be retained. |
| URL-identity dedup before enqueue | **ADAPT** | Efficient, but keep URL identity separate from content/capture identity. |
| Default provider cache | **REJECT for sensitive/evidentiary retrieval** | A two-day-old transformed page may be returned and still charged. |
| Crawl output as citation evidence | **REJECT** | Missing immutable raw hash, fetch trace, policy verdict, versions, and passage lineage. |
| Enterprise robots bypass | **REJECT from agent authority** | Overrides require independently recorded source authorization. |
| Arbitrary page actions, cookies, headers, persistent profile | **DEFER / default deny** | Expands credential, privacy, egress, and state-contamination risk. |
| Hosted Crawl as optional bulk renderer | **DEFER** | Plausible after contract, privacy, robots, SSRF, and billing gates. |
| Self-hosted server as Curiosity core | **DEFER / likely reject** | AGPL boundary plus queue/browser/storage operations burden. |

## 1. Decision frame, questions, and evidence method

**Decision:** which observable Firecrawl Crawl behaviors should influence a
bounded, provider-neutral Curiosity crawl plane without importing AGPL code,
depending on undocumented Cloud internals, or expanding an agent's authority?

Bounded sub-questions:

1. What are the create, status, pagination, error, cancel, watcher, and webhook
   contracts?
2. How are seeds, sitemaps, discovered links, path/domain scope, depth, limits,
   concurrency, and ordering represented?
3. What does public and pinned-source evidence establish about robots and
   politeness, especially across subdomains or external links?
4. Which acquisition/rendering, retry, deduplication, and failure stages are
   visible?
5. Which outputs and operational lineage exist, and what is missing for
   provenance and freshness?
6. What quotas, prices, retention, SSRF, privacy, hosted/OSS, and license
   boundaries constrain adoption?
7. Which architecture conclusions are justified without claiming knowledge of
   private Cloud internals?

**Method and budget.** Primary evidence is current official documentation,
OpenAPI, pricing/legal pages, RFC 9309, the upstream AGPL, and a read-only
inspection of the pinned official repository. Source inspection was limited to
Crawl admission, frontier, worker/queue, robots, acquisition, result, and SSRF
paths. No dependency was installed and no crawler was run. Vendor documentation
establishes represented behavior, not quality, completeness, SLA, legal right to
crawl, or correspondence between Cloud and OSS.

Evidence labels:

- **FACT** — directly supported by a cited primary source.
- **INFERENCE** — bounded interpretation of facts, not a claim about private
  internals.
- **UNKNOWN** — not established by reviewed primary sources; negative results
  are retained.
- **RECOMMENDATION** — Curiosity design or governance advice.
- Confidence is **high**, **medium**, or **low**.

**Stop rule:** every requested category has direct evidence or an explicit
unknown, and further public inspection repeats an established pattern or would
cross the no-account/no-live-test boundary.

## 2. Public Crawl contract

### 2.1 Creation and lifecycle

**FACT (high):** `POST /v2/crawl` accepts JSON and requires one URI `url`. It
returns HTTP 200 with `success`, a UUID job `id`, and a status URL. The operation
is asynchronous. The documented terminal/in-progress vocabulary is `scraping`,
`completed`, `failed`, and `cancelled`; `DELETE /v2/crawl/{id}` cancels a
non-completed job [S1-S5].

**FACT (high):** `GET /v2/crawl/{id}` returns `status`, attempted `total`,
successful `completed`, `creditsUsed`, `expiresAt`, `createdAt`, optional
`completedAt`, duration, documents, and a `next` URL. Direct API responses
paginate when unfinished or larger than 10 MiB; SDKs collect pages
automatically. Completed job results remain available through the API for 24
hours; documentation says later history/results remain visible in activity logs
without stating that log retention period [S1, S3].

**FACT (high):** successfully processed target responses, including an origin
404, appear in `data` and expose `metadata.statusCode`. Firecrawl-internal
failures such as timeout, network error, or robots denial are separate:
`GET /v2/crawl/{id}/errors` returns per-item `id`, timestamp, URL, error, and a
`robotsBlocked` list [S1, S4]. Thus HTTP success, target status, and Crawl worker
success are different states.

**FACT (high):** WebSocket/watcher delivery is documented as snapshots with an
HTTP fallback. Webhooks can emit started, page, completed, and failed events.
Firecrawl signs the raw body with account-secret HMAC-SHA256 in
`X-Firecrawl-Signature`; the security page requires timing-safe verification
[S1, S6].

**UNKNOWN / negative result (high):** the create contract documents no caller
idempotency key. A client that loses the create response cannot prove whether a
retry creates a second crawl and spend. The webhook signature contract does not
document a signed timestamp, nonce, expiry window, or delivery retry schedule;
authenticity therefore does not by itself establish freshness or replay
uniqueness [S2, S6].

**INFERENCE (medium):** cancellation is best treated as a request to stop, not
proof that no in-flight page will complete. The pinned PG-oriented cancellation
path marks the crawl cancelled and removes concurrency-backlogged jobs, while
workers consult crawl cancellation before expanding links; the public API does
not specify an instantaneous cancellation barrier [S5, S14, S29].

**RECOMMENDATION (high):** Curiosity should assign an immutable logical crawl
ID and separate provider-attempt ID before submission, make create reconciliation
explicit, treat webhooks as signed hints to poll authoritative state, deduplicate
events, and preserve cancel-requested versus actually-quiesced times.

### 2.2 Input contract and defaults

**FACT (high):** the current Crawl controls are [S1, S2]:

| Control | Current documented behavior |
| --- | --- |
| `limit` | Maximum pages; default 10,000. Credit preflight uses the requested limit. |
| `maxDiscoveryDepth` | Link-hop depth; seed and sitemap URLs are depth 0. Pages at the boundary are scraped but not expanded. |
| `includePaths`, `excludePaths` | Regexes over path by default; the seed is also subject to inclusion. |
| `regexOnFullURL` | Applies path regexes to the full URL including query. |
| `crawlEntireDomain` | Allows sibling/parent paths; false defaults to descendants of the seed path. |
| `allowSubdomains` | Allows subdomains; default false. |
| `allowExternalLinks` | Allows different domains; default false. |
| `sitemap` | `include` (default), `skip`, or `only`. |
| `ignoreQueryParameters` | Collapses query variants when true; default false. |
| `ignoreRobotsTxt`, `robotsUserAgent` | Enterprise-enabled robots override/custom matcher; default obey. |
| `delay` | Seconds between scrapes; forces concurrency one; maximum documented elsewhere in source/schema is 60 seconds. |
| `maxConcurrency` | Per-crawl ceiling, capped by the team's available concurrency; otherwise team limit. |
| `scrapeOptions` | One per-page acquisition/render/output/cache policy applied to every accepted URL. |
| `webhook` | URL, custom headers/metadata, selected events. |
| `zeroDataRetention` | Enterprise-controlled Crawl ZDR request. |
| `prompt` | Natural language can generate crawl options; explicit fields override generated equivalents. |

**RECOMMENDATION (high):** Curiosity must not offer `prompt` as crawl authority.
A model may propose a reviewed policy draft, but expansion to external domains,
subdomains, credentials, actions, robots override, higher limits, or higher
concurrency requires typed authorization outside untrusted/model text.

## 3. Frontier, scope, ordering, and coverage

### 3.1 Observable frontier composition

**FACT (high):** documented discovery combines the seed, sitemap URLs, and links
recursively extracted from successfully scraped pages. `sitemap: only` disables
HTML-link expansion; `skip` omits sitemap discovery. PDFs and unlinked resources
can therefore enter through sitemaps [S1].

**FACT (high, pinned OSS):** the kickoff worker separately queues the seed,
tries robots-declared and conventional sitemap locations, and can admit
index-sourced links where an index is configured. Every successful page's raw
HTML is passed to link extraction, filtered, URL-locked, and enqueued as a new
per-page scrape job with discovery depth incremented. Sitemap and index jobs use
their own priority values [S14, S15]. This establishes multiple producers for a
shared frontier; it does not prove the same optional index path is enabled in
Cloud.

```text
POST /crawl
  -> validate/admit, resolve options, create crawl group and transient state
  -> kickoff job
       -> seed page job
       -> robots + conventional sitemap jobs
       -> optional configured-index URL candidates
  -> per-page scrape jobs
       -> cache/index or fetch/render engine waterfall
       -> transformed document + metadata
       -> raw-HTML link extraction
       -> scope/robots/threat filter
       -> crawl-wide URL lock/dedup
       -> more page jobs
  -> group quiescence -> completion record/webhook
  -> status pages + independent error report
```

This is an **INFERENCE (high)** from public behavior and pinned source, not a
claim about Firecrawl Cloud's private deployment topology.

### 3.2 Scope is multidimensional

**FACT (high):** default scope is not “same site.” It is same host/domain class
*and* descendants of the seed path. `crawlEntireDomain` widens path scope;
`allowSubdomains` and `allowExternalLinks` independently widen host scope.
Include/exclude patterns, query treatment, document-extension filtering, sitemap
mode, path depth, discovery depth, and page limit further intersect [S1, S2,
S15].

**FACT (high):** the pinned filter has a Rust path and a JavaScript fallback. It
rejects non-web protocols, configured patterns, out-of-path URLs, external or
subdomain URLs unless enabled, robots-denied URLs, and a fixed list of media,
archive, font, and script extensions; PDF and common office/document paths are
not all rejected [S15].

**INFERENCE (high):** a provider-neutral `same_domain` Boolean would lose
material semantics. Curiosity needs explicit rules for scheme/port/origin,
registrable domain, subdomain, seed path, query identity, redirect destination,
document class, discovery source, hop depth, and budgets.

### 3.3 Deduplication and boundary determinism

**FACT (high):** URL normalization optionally strips query strings, removes
ordinary fragments while retaining hash-router forms, and uses a crawl-wide
Redis set as a pre-enqueue lock. With similar-URL dedup enabled by default in
the pinned schema, equivalence includes `www`/bare host, HTTP/HTTPS, trailing
slash, and `index.html`/`index.php` variants. This is URL heuristic dedup, not
content dedup [S12, S13].

**FACT (high):** Firecrawl explicitly warns that concurrent discovery can yield
different branches near `limit` or depth boundaries because completion timing
changes which links are admitted first. It suggests `maxConcurrency: 1` or
`sitemap: only` for greater repeatability [S1]. Pinned result listing is ordered
by completion time, not a documented BFS/DFS traversal order [S13, S16].

**INFERENCE (high):** the page limit is an admission budget, not a coverage
promise or stable sample. In the pinned URL lock, count-check and insertion are
separate Redis operations, so concurrent lockers can race around the boundary;
Cloud may add controls not visible here [S13].

**RECOMMENDATION (high):** Curiosity should expose deterministic scheduling
mode separately from throughput mode. Preserve every candidate's discovery
source, parent URL/capture, hop, scope verdict, suppression reason, normalized
key, and admission sequence. Never infer a missing page was absent from the
site; it may have lost a timing-dependent frontier race.

## 4. Robots and politeness

### 4.1 Supported behavior

**FACT (high):** Firecrawl says Crawl respects `robots.txt` by default. The
pinned controller fetches robots before creating page jobs, stores the text on
the crawl, and the frontier filter applies it to candidates. Robots-declaring
sitemaps are imported. Blocked pages are intended to appear in Crawl errors or
warnings. Enterprise flags can force/allow `ignoreRobotsTxt` and a custom robots
user agent [S1, S10-S15].

**FACT (high):** the robots fetch uses an up-to-8-second Scrape path and a
one-day cache unless custom user-agent behavior forces cache bypass. A 2xx body
is parsed; 404 becomes empty rules. Other provider errors or non-2xx responses
also return empty content, and calling paths log/fall through. This is fail-open
for unreachable robots, contrary to RFC 9309's requirement to assume complete
disallow on network/server failure; RFC 9309 permits access for 4xx
“unavailable” responses and says cached robots normally should not exceed 24
hours [S10, S18].

**FACT (high):** the parser reads a `Crawl-delay` value, but the v2 Crawl
controller lines that would apply it to crawl delay are commented out. The
public `delay` is caller-supplied and forces one concurrent scrape; absent it,
the crawl may use the team's concurrency [S11, S15].

### 4.2 Material source-level gaps

**FACT (high, pinned OSS):** the crawl stores one robots body fetched relative
to the seed and imports that same body into each per-page crawler. When a page
redirects or external/subdomain crawling is enabled, the worker changes the
link-filter base URL but does not fetch a new authority's robots in that path.
The optional per-scrape robots gate also prefers the crawl-stored body whenever
a crawl ID exists [S10, S15, S21].

**INFERENCE (high):** the pinned implementation does not establish correct
per-authority robots evaluation for a crawl widened across subdomains or
external domains. Cloud behavior is **UNKNOWN**. Curiosity must not treat
`allowExternalLinks` as safe simply because the seed robots was checked.

**FACT (high, pinned contradiction):** discovery code attempts to record robots
denials only when a denial reason exactly equals `URL blocked by robots.txt`,
while the current filter wraps that result in a longer explanatory message.
Top-level scrape denial uses the short value. This appears capable of
undercounting some discovery-time `robotsBlocked` diagnostics; it was not run
or tested [S14, S15].

**INFERENCE (high):** `delay` is a crawl-global serial throttle, not a complete
politeness scheduler. Reviewed sources do not establish per-authority queues,
shared host budgets across tenants/jobs, adaptive latency delay, `Retry-After`
handling, 429/503 backoff, traffic windows, or publisher complaint suppression.

**RECOMMENDATION (high):** Curiosity must own robots and politeness before any
provider call: fetch and retain robots per scheme/authority; implement RFC 9309
failure states; record bytes/hash, fetched time, cache age, product token,
matched group/rule, and verdict; schedule with per-origin concurrency and
next-eligible time; honor `Retry-After`; and maintain emergency deny/complaint
controls. Robots is not access authorization or a grant to retain, index, train,
or display content [S18]. Never expose robots bypass to an agent.

## 5. Rendering and acquisition

**FACT (high):** Crawl is orchestration over the Scrape pipeline: every admitted
URL receives the same `scrapeOptions`. Those options can request Markdown,
cleaned HTML, raw HTML, links, images, screenshot, summary, JSON, product,
question/highlights, media, and other formats; choose cache policy, proxy,
location/language, mobile mode, waits, headers/cookies, TLS verification, ad
blocking, PII redaction, persistent profile, and page actions [S1, S2, S7].

**FACT (high):** hosted `proxy: auto` is documented as starting with basic and
retrying enhanced where needed. The pinned engine layer builds a feature-aware
waterfall that can include index, Chrome/Fire-engine, Playwright, fetch, PDF,
document, and specialized paths. With Fire-engine available, it intentionally
prefers managed Chrome paths and may decline to degrade to plain fetch after a
bot-wall failure [S7, S17]. Exact Cloud engine selection remains unknown.

**FACT (high):** default self-host includes fetch and Playwright processing;
advanced anti-bot and specialized extraction require separately configured
services. The pinned Playwright service uses a fresh browser context per
request, blocks service workers, checks every request's resolved address, and
runs through a local SSRF-filtering proxy, but launches the shared Chromium
process with `--no-sandbox` [S9, S23].

**INFERENCE (high):** Firecrawl has at least three acquisition classes:
provider index/cache reuse, direct/static fetch, and browser/managed rendering.
The same Crawl output envelope hides meaningful differences in observation
time, network path, JS execution, locale, and anti-bot behavior.

**RECOMMENDATION (high):** Curiosity should start static and escalate to an
isolated renderer only on a typed insufficiency signal. A Crawl adapter should
initially prohibit actions, arbitrary JavaScript, custom credentials, persistent
profiles, TLS downgrade, downloads, and external links. Every page needs a
declared acquisition class and render reason.

## 6. Retries, leases, failures, and duplicate work

**FACT (high, pinned OSS):** acquisition has an internal engine waterfall plus
bounded handled retries for feature changes and PDF/document anti-bot prefetch.
Defaults cap the retry tracker's handled loop at six total records, with lower
sub-limits; the exact number of network attempts can differ because one loop
iteration can race or waterfall engines [S17, S24].

**FACT (high, pinned OSS):** the current PostgreSQL NuQ backend leases jobs,
renews the lock every 15 seconds, and requeues a job whose lock has been stale
for one minute. The schema's reaper requeues while stall count is below nine and
fails later stalls. This is crash/stall recovery, not exactly-once execution
[S16, S25, S26]. A second FDB backend exists behind routing/team flags, so these
precise mechanics do not establish universal Cloud behavior [S16].

**FACT (high, pinned OSS):** a normal per-page scrape exception is recorded as a
failed Crawl job. Its `visited_unique` count entry is removed, but the primary
`visited` dedup key is not; later rediscovery of the same URL-equivalence class
therefore does not create an ordinary retry in that crawl. Redirect races are
treated as expected duplicate suppression and omitted from the errors response
[S13, S14].

**INFERENCE (high):** observable execution is at-least-once at the worker lease
layer, but effectively at-most-one admitted job per URL key in the ordinary
frontier. Engine retries may repeat network work inside that job. Neither URL
dedup nor job ID proves one fetch, one charge, one capture, or one output.

**UNKNOWN (high confidence in negative result):** public Crawl docs do not state
a stable per-error retryability taxonomy, per-URL application retry count,
exponential backoff policy, `Retry-After` policy, conditional request behavior,
or whether a failed page can be explicitly retried inside the same crawl.

**RECOMMENDATION (high):** Curiosity should separate candidate identity,
attempt identity, fetch identity, and capture identity. Use a retry matrix by
typed failure; exponential backoff with jitter; per-origin next-eligible state;
hard attempt/time/cost budgets; and idempotent capture commits. A failed attempt
must not silently erase the URL from coverage accounting or permanently suppress
a policy-approved retry.

## 7. Outputs, provenance, and freshness

### 7.1 What Crawl returns

**FACT (high):** each successful page can return requested representations and
metadata including submitted `sourceURL`, final `url`, target status code,
content type, title/description/language and page-declared metadata, Scrape ID,
proxy class, cache hit/miss and `cachedAt` in applicable paths, credits, PDF
page/truncation counts, and concurrency-queue diagnostics [S3, S7, S12]. Failed
items have job ID, URL, completion timestamp, optional stable error code in the
pinned controller, and message [S4, S22].

**FACT (high):** these are heterogeneous artifacts. `rawHtml` is represented as
the received page HTML; `html` is cleaned; Markdown is transformed; main-content
selection is deterministic HTML filtering; optional `onlyCleanContent`, custom
JSON, summaries, questions, highlights, and some PII redaction modes use models;
product extraction is documented as deterministic merging of structured page
signals [S2, S7].

**INFERENCE (high):** Crawl is an extraction collection, not a capture archive.
A target 404 can be a successful processed document; an LLM-derived field can
sit beside source HTML; a cache hit can be older than the request; and one
completion count says nothing about graph coverage.

### 7.2 Freshness

**FACT (high):** Crawl inherits per-page `maxAge`: the hosted default allows a
cached result up to 172,800,000 ms (two days). `maxAge: 0` bypasses cache;
`minAge` is cache-only; `storeInCache: false` avoids adding the result; change
tracking bypasses cache. Cache hits still consume the base page credit. Firecrawl
itself warns that `maxAge` controls cache eligibility, not whether represented
page state is current [S2, S7, S8].

**INFERENCE (high):** crawl `createdAt`, per-job completion timestamp,
`cachedAt`, page publication time, and true source observation time are distinct.
Where `cachedAt` is absent, the consumer cannot infer a fresh fetch. A provider
request time must never be substituted as source-observation time.

### 7.3 Missing evidence chain

**UNKNOWN / negative result (high):** the public Crawl contract does not
guarantee:

- raw response-byte hash or immutable raw-capture reference;
- request/response timestamps, selected headers, TLS/DNS/remote-IP trace, or
  full redirect chain;
- parent capture/discovery edge, sitemap/index/link source, or admission order;
- robots bytes/hash, matched rule, failure state, or politeness decision;
- engine/browser/container, extractor, model, prompt-template, or schema version;
- viewport, locale/timezone, proxy exit, JS completion condition, or action log
  sufficient to reproduce rendering;
- normalized-document hash, canonicalization rationale, duplicate relation, or
  content-change lineage;
- field/passage offsets, source hashes, confidence, or derivation for JSON and
  model outputs; or
- immutable access to old job results after the 24-hour API window [S1-S4, S7].

**RECOMMENDATION (high):** treat Firecrawl documents as untrusted,
provider-transformed observations. Curiosity should wrap each in an immutable
manifest containing local crawl/attempt/capture IDs; provider job/scrape IDs;
requested/final/canonical URLs; discovery edge; fetched/received/cached/published
times kept distinct; status/media type/redirects; policy verdict; acquisition
class and versions; option digest; artifact hashes; warnings/truncation; and
claim-to-passage lineage. Never let Firecrawl's 24-hour TTL define Curiosity's
retention.

## 8. Limits, pricing, and bounded behavior

**FACT (high, point-in-time):** on 2026-08-17 the pricing page showed Free 1,000
credits and 2 concurrent requests; Hobby 5,000/5 at an annualized $16/month;
Standard 100,000/50 at $83; Growth 500,000/100 at $333; and Scale
1,000,000/150 at $599. Enterprise is custom [S8]. Prices and intermediate credit
tiers are mutable operational data, not an API constant.

**FACT (high):** Crawl charges one base credit per processed page. JSON adds
four credits per page; PDF parsing adds one per PDF page; ZDR adds one per page,
and other current Scrape formats can add costs. Billing is asynchronous as pages
complete. Submission preflights remaining credits against `limit`, so omitting
it can require 10,000 available credits even for a small site [S1, S8].

**FACT (high):** current Crawl create RPM limits are 2 / 20 / 100 / 1,000 /
2,000 for Free through Scale; Crawl status RPM is 500 / 5,000 / 25,000 /
250,000 / 500,000. Browser concurrency is 2 / 5 / 50 / 100 / 150, and per-team
queued-job ceilings range from 50,000 upward. Queued jobs can expire after 48
hours [S8].

**Documentation contradiction:** billing says infrastructure-processed origin
403/404 responses are charged, while the pricing FAQ says Firecrawl charges
only successful requests [S8]. The most plausible interpretation is “provider
successfully processed an origin error” versus “provider failed,” but the
customer-visible billing boundary remains ambiguous. **Check the order form and
an authorized owned-domain billing fixture before adoption.**

**INFERENCE (high):** `limit` is not a sufficient safety budget. One accepted
URL can incur browser work, retries, large/decompressed content, many PDF pages,
LLM formats, and new outlinks. Cancellation and async billing can lag intent.

**RECOMMENDATION (high):** set explicit local ceilings for pages, candidate
URLs, per-page and total bytes, decompressed bytes, redirects, outlinks, PDF
pages, time, attempts, origin concurrency/rate, browser slots, model tokens,
credits, and money. Disable Smart Upgrade for an evaluation and reserve budget
below provider limits.

## 9. SSRF, privacy, content safety, and license boundaries

### 9.1 SSRF and hostile content

**FACT (high, pinned OSS):** URL schemas restrict public Crawl input to HTTP(S).
The static fetch dispatcher checks the connected remote address and destroys
non-unicast/private connections unless `ALLOW_LOCAL_WEBHOOKS=true`; redirect
handling uses that dispatcher. The default Playwright service checks initial
and every browser request after DNS resolution and repeats the private-address
check in a local proxy [S12, S23]. These are meaningful controls, not a security
proof.

**INFERENCE (medium):** the shared `ALLOW_LOCAL_WEBHOOKS` setting relaxing page
destination checks is an operator footgun, and the static path's 5,000 redirect
ceiling is far beyond a bounded research crawler's need [S23]. Cloud-only
engines, proxy paths, alternate address forms, DNS rebinding, and webhook egress
were not tested.

**RECOMMENDATION (high):** Curiosity must independently allow only policy-
approved public HTTP(S) targets, forbid URL credentials and unapproved ports,
resolve and validate every connection/redirect, block loopback/private/link-
local/multicast/metadata ranges, safely pin DNS, and cap redirects tightly.
Returned Markdown, HTML, links, errors, metadata, and model fields remain
attacker-controlled and cannot authorize tools, disclose secrets, or trigger
follow-up retrieval.

### 9.2 Privacy and retention

**FACT (high):** Crawl may send URLs, headers, cookies, actions, location, and
page content to a U.S.-hosted service and its configured processing paths.
Firecrawl's privacy policy says information is used for service delivery,
caching, and indexing; servers are in the United States; and its general PII
retention baseline is until written deletion request, with no current recurring
deletion policy. The public page does not provide a complete Crawl content,
cache, log, backup, subprocessors, or deletion-SLA matrix [S2, S7, S27].

**FACT (high):** Enterprise Crawl exposes ZDR; documentation says page content
and extracted data are not persisted beyond request lifetime, adds one credit
per page, and conflicts with screenshots because those require persistent
upload. Crawl's transient OSS bookkeeping still stores URLs while work executes;
the pinned source expires most crawl keys at 24 hours and eagerly deletes some
ZDR state on finish [S2, S7, S13].

**RECOMMENDATION (high):** do not send authenticated/private pages, cookies,
personal datasets, secret-bearing query URLs, or confidential prompts to Cloud
without an approved DPA, subprocessor/region/retention matrix, cache isolation
statement, deletion SLA, and verified ZDR scope. PII redaction occurs after
collection and is not permission to collect.

**FACT (high):** Firecrawl terms place legal-use responsibility on the user and
prohibit unlawful use, disseminating another person's PII without permission,
hard background checks, debt collection, FCRA-covered uses, intelligence-agency
people surveillance, and evidentiary law-enforcement/criminal-prosecution uses
[S28]. This dossier is engineering analysis, not legal advice.

### 9.3 Hosted versus OSS and licensing

**FACT (high):** default self-host provides core Crawl plus fetch/Playwright but
leaves authentication, TLS, persistence, HA, monitoring, capacity, backup,
upgrades, and recovery to the operator. Managed anti-bot, dashboards,
enterprise controls, and specialized services differ from Cloud [S9].

**FACT (high):** the repository root/server is AGPL-3.0; identified SDK/UI
subtrees may be MIT. AGPL section 13 applies source-offer duties when a modified
covered program supports remote network interaction. Cloud service code is not
proven identical to the public release [S19, S20].

**RECOMMENDATION (high):** preserve clean-room separation: cite behavior and
revision; independently author Curiosity requirements and adapters; do not copy
server schemas, queue logic, prompts, extraction code, or tests; re-check every
subtree license before considering an SDK; and obtain legal review before
modifying, combining, or network-deploying the AGPL server.

## 10. Architecture reconstruction and Curiosity implications

### 10.1 Reconstructed responsibility split

**INFERENCE (high):** the pinned/open observable architecture separates:

1. **API admission/control:** authentication, feature permissions, credit
   preflight, threat-policy seed check, option generation/validation, job ID.
2. **Crawl coordination:** Redis-stored crawl policy/robots/transient sets and a
   queue group with concurrency/delay.
3. **Frontier producers:** seed kickoff, sitemaps, optional configured index,
   and page outlinks.
4. **URL admission:** scope/robots/type/threat filters plus a crawl-wide URL
   identity lock.
5. **Per-page execution:** durable queue lease, cache/index check, engine
   selection/waterfall, rendering/parsing, transformation, billing, and logging.
6. **Result plane:** queue/GCS/DB-backed page artifacts, Redis status metadata,
   completion ordering, paginated reads, errors, and webhook events.
7. **Finish detection:** kickoff and sitemap completion plus no outstanding group
   jobs, then terminal logging/webhook and transient-state cleanup [S11-S17,
   S25, S26].

This is scalable job orchestration, but the URL frontier is not visibly a
per-origin politeness frontier and the result plane is not an immutable evidence
store.

### 10.2 Clean-room lessons for Curiosity

**ADOPT:**

- separate crawl coordination from per-page fetch/extract attempts;
- explicit sitemap/link/index discovery source types;
- async job IDs, signed events, polling, partial success, and an error channel;
- typed scope dimensions and a hard page-admission cap;
- one immutable resolved page policy snapshot per crawl attempt;
- completion diagnostics distinct from target HTTP status.

**ADAPT / strengthen:**

- replace one crawl-wide URL set with explainable candidate, normalized-request,
  capture-content, and document-cluster identities;
- use scheduling cells per origin, not global concurrency as politeness;
- record parent capture/hop and every policy/suppression verdict;
- make deterministic traversal an explicit mode with stable priority/tie-break;
- treat cached retrieval as a separately typed observation with `cachedAt`;
- give retries their own durable attempt records and cost budget;
- keep provider events and provider storage behind a neutral local job ledger.

**REJECT:**

- provider defaults as Curiosity policy;
- natural-language scope generation as execution authority;
- robots fail-open behavior or seed-robots reuse across authorities;
- `allowExternalLinks` without per-destination authorization;
- URL dedup as proof of duplicate content or exactly-once capture;
- Markdown/JSON as raw or reproducible evidence;
- cache timestamp, request timestamp, or page metadata as interchangeable time;
- arbitrary actions/credentials in an agent-facing Crawl API.

**DEFER:** hosted adapter, self-hosting, rendering/actions, and structured/model
formats until the checks below are answered.

## 11. Unknowns and adoption checks

| Unknown | Confidence in negative result | Why it matters | Required check before adoption |
| --- | --- | --- | --- |
| Does Cloud fetch/evaluate robots separately for every redirected, subdomain, and external authority? | High | Pinned source reuses seed robots. | Written architecture statement plus authorized multi-origin fixture. |
| Does Cloud honor robots `Crawl-delay` automatically? | High | Parsed value is not applied in pinned v2 controller. | Vendor statement and owned-origin timing trace. |
| How are 429/503, `Retry-After`, host latency, and cross-job host fairness enforced? | High | No public per-origin scheduler contract. | Controlled origin logs and vendor scheduler statement. |
| Is discovery-time `robotsBlocked` complete despite reason-string mismatch? | Medium | Diagnostics may underreport policy denial. | Upstream issue/version check and owned fixture. |
| Exact Cloud engine waterfall and release mapping | High | Rendering, retries, safety, and reproducibility vary. | Versioned provider attestation and response provenance. |
| Exact application retry/billing for origin errors, engine fallbacks, stalls, cancel, and duplicates | High | Spend and source load. | Order-form wording and owned-domain billing reconciliation. |
| Cache key/tenant isolation with headers, cookies, location, profile, and redirects | High | Cross-tenant/session disclosure. | Vendor security statement/SOC evidence and controlled test. |
| Content, URL, prompt, header, cache, activity-log, backup, and ZDR retention by plan | High | Privacy and deletion. | DPA, subprocessor matrix, retention schedule, deletion SLA. |
| Raw capture hashes, immutable artifact IDs, engine/model versions, and field grounding | High | Citation reproducibility. | Versioned response contract; otherwise classify unavailable. |
| Webhook retries, duplicate delivery, signed timestamp, and replay window | High | Reliable and safe event consumption. | Vendor delivery/security contract and sandbox test. |
| Strictness of page limit under concurrent admission and cancellation | Medium | Bounded spend and load. | High-concurrency owned graph with exact expected bounds. |
| Authorized SSRF behavior across all Cloud engines and redirects | High | Network isolation. | Vendor threat model and authorized security test only. |

## 12. Bounded curiosity pass

After synthesis, in-frame gaps were scored 1-5 for **relevance (R)**,
**decision value (V)**, **novelty (N)**, and **cost (C; lower is better)**.
Priority was `R + V + N - C`. Only public, read-only, clean-room checks within
the caller's declared frame were pursued.

| Thread | R | V | N | C | Score | Result |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Per-authority robots under widened scope | 5 | 5 | 5 | 2 | 13 | **Pursued.** Found seed robots reused by pinned per-page/link paths; Cloud remains unknown. |
| Retry versus frontier dedup interaction | 5 | 5 | 5 | 2 | 13 | **Pursued.** Found lease redelivery, engine retries, and terminal ordinary page failures still retained in primary URL dedup. |
| Limit/order determinism | 5 | 4 | 4 | 2 | 11 | **Pursued.** Docs admit timing-sensitive coverage; source shows completion ordering and non-atomic count/admission steps. |
| Robots-blocked diagnostic consistency | 4 | 4 | 5 | 2 | 11 | **Pursued.** Retained the denial-string mismatch as an untested source contradiction. |
| Reverse-engineer proprietary Fire-engine or Cloud topology | 3 | 2 | 4 | 5 | 4 | **CURIOSITY_NO_GO.** Proprietary boundary; unnecessary for contract decision. |
| Run Crawl against third-party sites | 3 | 3 | 1 | 5 | 2 | **CURIOSITY_NO_GO.** No live-crawl authority and no need to impose source load. |
| Create account/free-tier billing experiment | 4 | 4 | 2 | 5 | 5 | **CURIOSITY_NO_GO.** User prohibited calls; procurement/privacy authority absent. |
| Copy OSS tests to reproduce edge behavior | 2 | 1 | 2 | 5 | 0 | **CURIOSITY_NO_GO.** Violates clean-room/no-copy boundary and adds no decision value. |
| Benchmark extraction quality | 3 | 3 | 3 | 5 | 4 | **DEFERRED.** Requires licensed fixtures, scoring rubric, budget, and caller authority. |

**Stop reason:** coverage and saturation. All requested topics have primary
evidence, an inference, or an explicit unknown. Remaining high-value questions
require vendor/account material or authorized controlled testing.

## 13. Sources

All web sources accessed **2026-08-17**. GitHub links are pinned to the inspected
commit unless noted.

- **[S1]** Firecrawl, “Crawl,” official feature documentation:
  <https://docs.firecrawl.dev/features/crawl>
- **[S2]** Firecrawl v2 OpenAPI, `POST /crawl`:
  <https://docs.firecrawl.dev/api-reference/endpoint/crawl-post>
- **[S3]** Firecrawl v2 OpenAPI, `GET /crawl/{id}`:
  <https://docs.firecrawl.dev/api-reference/endpoint/crawl-get>
- **[S4]** Firecrawl v2 OpenAPI, Crawl errors:
  <https://docs.firecrawl.dev/api-reference/endpoint/crawl-get-errors>
- **[S5]** Firecrawl v2 OpenAPI, cancel Crawl:
  <https://docs.firecrawl.dev/api-reference/endpoint/crawl-delete>
- **[S6]** Firecrawl, webhook signature security:
  <https://docs.firecrawl.dev/webhooks/security>
- **[S7]** Firecrawl, “Scrape” (used only for per-page options composed by
  Crawl): <https://docs.firecrawl.dev/features/scrape>
- **[S8]** Firecrawl billing, rate limits, and pricing:
  <https://docs.firecrawl.dev/billing>,
  <https://docs.firecrawl.dev/rate-limits>, and
  <https://www.firecrawl.dev/pricing>
- **[S9]** Firecrawl, “Open source or Firecrawl Cloud”:
  <https://docs.firecrawl.dev/contributing/open-source-or-cloud>
- **[S10]** Firecrawl pinned robots fetch/check implementation,
  `apps/api/src/lib/robots-txt.ts`:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/lib/robots-txt.ts>
- **[S11]** Firecrawl pinned v2 Crawl controller:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/controllers/v2/crawl.ts>
- **[S12]** Firecrawl pinned v2 request and document types:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/controllers/v2/types.ts>
- **[S13]** Firecrawl pinned crawl state, normalization, and URL locking,
  `crawl-redis.ts`:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/lib/crawl-redis.ts>
- **[S14]** Firecrawl pinned Crawl worker expansion/kickoff logic,
  `scrape-worker.ts`:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/services/worker/scrape-worker.ts>
- **[S15]** Firecrawl pinned frontier/filter/robots/sitemap logic,
  `crawler.ts`:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/scraper/WebScraper/crawler.ts>
- **[S16]** Firecrawl pinned status/result and queue routing paths:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/controllers/v2/crawl-status.ts> and
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/services/worker/nuq-router.ts>
- **[S17]** Firecrawl pinned acquisition engine selection/retry paths:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/scraper/scrapeURL/index.ts> and
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/scraper/scrapeURL/engines/index.ts>
- **[S18]** IETF, RFC 9309, Robots Exclusion Protocol:
  <https://www.rfc-editor.org/rfc/rfc9309.html>
- **[S19]** Firecrawl pinned repository README/license map:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/README.md>
- **[S20]** Firecrawl pinned root AGPL-3.0 license and FSF AGPL text:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/LICENSE> and
  <https://www.gnu.org/licenses/agpl-3.0.html>
- **[S21]** Firecrawl pinned conditional per-scrape robots gate:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/scraper/scrapeURL/shouldCheckRobots.ts>
- **[S22]** Firecrawl pinned Crawl errors controller:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/controllers/v2/crawl-errors.ts>
- **[S23]** Firecrawl pinned safe-fetch and Playwright SSRF controls:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/scraper/scrapeURL/engines/utils/safeFetch.ts> and
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/playwright-service-ts/api.ts>
- **[S24]** Firecrawl pinned bounded handled-retry tracker and defaults:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/scraper/scrapeURL/retryTracker.ts> and
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/config.ts>
- **[S25]** Firecrawl pinned NuQ PostgreSQL queue schema/reaper:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/nuq-postgres/nuq.sql>
- **[S26]** Firecrawl pinned NuQ worker lock renewal/finish path:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/services/worker/nuq-worker-runner.ts>
- **[S27]** SideGuide Technologies / Firecrawl, Privacy Policy (revision
  2024-12-26): <https://www.firecrawl.dev/privacy-policy>
- **[S28]** SideGuide Technologies / Firecrawl, Terms of Use (revision
  2024-11-05): <https://www.firecrawl.dev/terms-of-service>
- **[S29]** Firecrawl pinned v2 Crawl cancellation controller:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/controllers/v2/crawl-cancel.ts>

## 14. Confidence summary

- **High:** public endpoint shapes/defaults, documented cache and 24-hour API
  result window, point-in-time pricing/limits, pinned source behavior, root
  AGPL license, published privacy/terms language.
- **Medium:** architecture reconstruction and cancellation/limit race effects;
  these follow pinned source but were not executed.
- **Low / unknown:** exact Cloud-to-OSS correspondence, per-origin Cloud
  scheduling, universal Cloud robots behavior, hosted engine selection, cache
  tenant isolation, complete retention/subprocessor matrix, and comparative
  rendering/extraction quality.
