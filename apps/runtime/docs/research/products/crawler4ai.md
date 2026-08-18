# Crawl4AI reverse-engineering dossier

**Research / source-access date:** 2026-08-17  
**Decision:** whether Crawl4AI concepts or software should inform
`opencode2-curiosity`'s bounded, provider-neutral public-web retrieval plane.  
**Status:** research only. No package was installed into the workspace, crawler
was run, target was fetched, container was started, vulnerability was probed, or
third-party code was copied.  
**Inspected release:** latest official release `v0.9.2` (published 2026-07-15),
resolved tag commit
[`7e801521428ee12509994d39151006f64055ebe3`](https://github.com/unclecode/crawl4ai/tree/7e801521428ee12509994d39151006f64055ebe3)
[S1].

## Executive verdict

**ADAPT selected architecture concepts; REJECT Crawl4AI as Curiosity's owned
crawl, render, or extraction foundation (high confidence).** Crawl4AI has useful
seams: separate HTTP and Playwright strategies, a prefetch/full-processing split,
raw/cleaned/fit/derived representations, deterministic CSS/XPath extraction
before LLM extraction, typed cache modes, per-domain response backoff, explicit
frontier strategies, streaming, cancellation, and externally persisted
checkpoints [S2-S9]. These are good requirements evidence, not an adoption
decision.

The library's operating premise is materially broader than Curiosity's. Browser
rendering is the default; robots checking is disabled by default and fails open;
the SDK permits local files, raw HTML, arbitrary headers/cookies/JavaScript,
proxies, persistent profiles, downloads, and anti-bot escalation; browser TLS
errors are ignored by default; and the in-process HTTP path has no identified
private-network guard or response-byte/decompression ceiling. Its deep-crawl
`max_pages` defaults to infinity and counts only successful pages. A page-count
limit is therefore not a complete attempt, byte, render, time, or origin-load
budget [S3][S5][S10-S14].

**REJECT the Python package even though the manifest says `Apache-2.0` (high
confidence under the current ownership premise).** ADR 0021 prohibits adopting a
third-party crawler into the owned core without a new ownership/license decision.
More unusually, the release's `LICENSE` appends a mandatory prominent-attribution
condition after the Apache 2.0 text while `pyproject.toml` declares only
`Apache-2.0`; there is no separate `NOTICE` file. The exact license expression
and compatibility of the added condition require counsel and must not be
collapsed to “plain Apache-2.0” [S15][S16][C2].

**DEFER Crawl4AI only as an offline extraction/render benchmark oracle on
project-authored or otherwise licensed fixtures (medium-high confidence).** Do
not expose it as an agent tool, seed from its DomainMapper, use it to evade
publisher controls, or make its cache/result model Curiosity's evidence record.
Any future dependency, HTTP adapter, or deployment needs a separately approved
ADR, exact-version SBOM/license review, threat model, and adversarial validation.

## 1. Frame, bounded questions, and method

### 1.1 Decision frame

The bounded questions were:

1. Are static HTTP and browser rendering truly separate modes, and which is the
   default?
2. How do capture, HTML cleaning, Markdown, deterministic extraction, and LLM
   derivation compose?
3. What frontier, scope, deduplication, cancellation, checkpoint, cache, and
   session semantics are actually offered?
4. What guarantees exist for robots, origin politeness, retries, redirects, and
   publisher identity?
5. Which controls contain hostile URLs, SSRF, hostile page content, secret-bearing
   sessions, resource exhaustion, and browser compromise?
6. What differs between the in-process SDK and self-hosted Docker API?
7. What provenance is returned, what remains unknown, and which concepts transfer
   clean-room to `opencode2-curiosity`?

### 1.2 Evidence and access boundary

Official documentation, the official GitHub release record, and a read-only
shallow checkout of the official `v0.9.2` tag in the approved temporary directory
were inspected. Consequential defaults were checked against the pinned source
because several documentation pages are stale or internally inconsistent. No
Cloud beta account or nonpublic material was used. Product performance claims are
vendor claims, not independent measurements.

Labels:

- **FACT** — directly supported by a cited official document or pinned source.
- **INFERENCE** — the narrowest architectural conclusion supported by facts.
- **RECOMMENDATION** — proposed Curiosity choice, not a product claim.
- **UNKNOWN / NEGATIVE RESULT** — behavior not established in the bounded review;
  absence is not a universal proof.
- Confidence is **high**, **medium**, or **low**.

**Coverage bound:** modes, extraction/Markdown, frontier/scope/cache, robots and
politeness, sessions, hostile input/SSRF, provenance, deployment, license, and
Curiosity implications. **Stop condition:** every category had primary evidence
and further public inspection repeated known patterns or required live testing,
legal advice, or private operational evidence.

## 2. Reconstructed product model

```text
URL / raw HTML / local file
  -> AsyncWebCrawler orchestration
     -> cache read and optional freshness validation
     -> optional robots decision
     -> acquisition strategy
          browser: Playwright/Patchright context + page + optional session/actions
          HTTP: aiohttp request + optional file download
     -> raw HTML and response operational metadata
     -> scraping strategy -> cleaned HTML, links, media, tables
     -> Markdown generator -> raw / cited / references / fit Markdown
     -> optional CSS/XPath/regex or LLM extraction -> extracted_content
     -> optional cache write

deep crawl:
  seed -> BFS / DFS / best-first frontier
       -> filters + scorer + URL-normalized visited set
       -> arun_many dispatcher -> per-page pipeline above
       -> streamed/list results + caller-owned checkpoint callback
```

**FACT (high):** `AsyncWebCrawler` defaults to
`AsyncPlaywrightCrawlerStrategy`, not the lightweight HTTP strategy. The
`AsyncHTTPCrawlerStrategy` is a separately constructed acquisition strategy with
HTTP(S), local-file, and raw-content schemes [S10][S11].

**FACT (high):** deep crawl decorates the same one-page pipeline. BFS and DFS use
level/stack traversal; best-first uses scores. They invoke `arun_many()` for
frontier batches and annotate results with depth and parent URL [S5][S12].

**INFERENCE (high):** Crawl4AI is a feature-rich scraping job library and Docker
API, not a durable search-engine crawl plane. The reviewed model has no
first-class WARC record, immutable capture/version graph, transactional frontier
lease/ack protocol, recrawl policy, source-rights/takedown workflow, canonical
document graph, index handoff, or citation-span contract.

## 3. Static HTTP and browser modes

### 3.1 HTTP-only strategy

**FACT (high):** the HTTP strategy uses `aiohttp`, verifies TLS and follows
redirects by default, has a 30-second default client timeout, DNS cache TTL of 300
seconds, and at most `min(32, CPU*4)` connections. It accepts GET or POST,
headers/body/JSON, a proxy, and HTTP(S), `file`, and `raw` schemes [S11].

**FACT (high):** it calls `response.read()` before processing. Any non-HTML MIME
type is treated as a download and written beneath a download directory; text-like
downloads are also decoded into the `html` field. Safe filename/path primitives
reduce traversal and symlink-write risk, but no response body, decompressed-body,
or compression-ratio ceiling was identified in this path [S11].

**FACT (high):** only 2xx responses are successful in the HTTP strategy; a 3xx is
normally followed, while other statuses become exceptions. The result records the
final response URL, status, headers, and downloaded file paths, but not the full
redirect chain [S11].

**INFERENCE (high):** this is the appropriate *economic shape* for Curiosity's
first lane, but not the security boundary. Direct SDK callers can fetch local
files and private addresses, write downloads, send arbitrary requests, and retain
unbounded responses. Redirect following delegates all destination policy to the
HTTP client.

### 3.2 Browser strategy

**FACT (high):** browser mode supports Chromium, Firefox, and WebKit; JavaScript,
cookies, headers, page actions, iframes, shadow-DOM flattening, scrolling,
screenshots/PDF/MHTML, downloads, proxies, geolocation, locale, and persistent
profiles. `ignore_https_errors=True` is the library default [S3][S10].

**FACT (high):** Browser sessions reuse a page/context by caller-supplied
`session_id`; the in-memory manager expires entries after 1,800 seconds and
provides explicit kill/cleanup. The documentation warns sessions are sequential,
not parallel. Persistent contexts and storage-state input can retain cookies and
local storage beyond an individual page [S8][S10].

**FACT (high):** anti-bot support detects challenge/block pages, can retry every
configured proxy over multiple rounds, use stealth/user simulation, and call an
arbitrary fallback fetch function. The documented worst-case browser attempts are
`(1 + max_retries) * proxy_count`, followed by the fallback [S14].

**INFERENCE (high):** browser sessions and persistent profiles are secret-bearing
state with cross-request influence. A caller-controlled session identifier is not
tenant isolation. Proxy escalation, stealth, randomized identity, consent-popup
clicking, and “undetected” modes optimize access success rather than an
identifiable, publisher-respecting crawler.

**RECOMMENDATION (high):** Curiosity must keep static and render attempts
distinct. Static capture commits first. A deterministic quality gate may enqueue
a new isolated render attempt with its own reason, policy, budget, identity and
capture. Never make browser mode the invisible default or let a page, model, or
fallback function choose its own egress authority.

## 4. Cleaning, Markdown, and extraction

### 4.1 Representation layers

**FACT (high):** `CrawlResult` can carry raw HTML, cleaned HTML, raw/cited/fit
Markdown, reference Markdown, extracted content, links, media, tables,
screenshots/PDF/MHTML, headers/status, redirect endpoint, session id, network and
console captures, cache state, and anti-bot attempt statistics [S4][S17].

**FACT (high):** Markdown generation is a separate transform. Its input can be
raw HTML, cleaned HTML (default), or fit HTML. The default generator is a modified
HTML-to-text implementation. It can produce reference-style links and a
`fit_markdown` selected by deterministic pruning, BM25 query filtering, or an LLM
content filter [S6][S18].

**FACT (high):** extraction is another distinct transform:

- CSS and XPath schemas select repeated/nested fields;
- regex returns labels, values, source URL, and character spans;
- LLM extraction accepts Markdown, fit Markdown, or HTML, chunks it, sends it
  through LiteLLM-supported providers, and merges model output;
- LLMs may also generate CSS/XPath schemas or regexes, after which deterministic
  extraction can reuse them [S7][S9].

**INFERENCE (high):** “cleaned,” “fit,” “LLM-friendly,” and schema-shaped do not
mean factual, safe, or source-faithful. Pruning can remove caveats; BM25 changes
the visible evidence based on a query; reference Markdown cites links *found in
the page*, not immutable evidence; model filters/extractors can omit, infer, or
hallucinate. Regex spans are useful but refer to the selected transform input,
not automatically to raw capture bytes.

### 4.2 Curiosity transfer

**RECOMMENDATION (high):** ADAPT the explicit transform ladder:

1. immutable response bytes / rendered snapshot;
2. decoded DOM with byte/character mapping;
3. cleaned content with transform manifest;
4. deterministic Markdown and structured extraction;
5. model-derived artifacts, never silently replacing earlier layers.

Each layer needs a content hash, producer/version, configuration digest, input
artifact id, warnings/truncation, and offsets back to the preceding layer. Only
captured or deterministically anchored passages may support citations. LLM output
remains `derived_unverified` until grounded.

**RECOMMENDATION (high):** ADOPT the “deterministic extraction first” priority,
but do not copy schemas, prompts, regex catalogs, modified html2text code, tests,
or default thresholds. Independently specify the behavior and evaluate on
authorized fixtures.

## 5. Frontier, scope, and discovery

### 5.1 Deep-crawl semantics

**FACT (high):** BFS, DFS, and best-first expose `max_depth`, optional
`max_pages`, external-link inclusion, filter chains, URL scoring, and score
thresholds. `max_pages` defaults to infinity; docs explicitly recommend setting
it. The seed is depth 0 and bypasses the filter chain [S5][S12].

**FACT (high):** available filters include wildcard URL patterns, allow/block
domains, content type, SEO characteristics, and BM25 content relevance. The
visited key normalizes relative URLs, lowercases the network location, removes
fragments and selected tracking parameters, parses/sorts query parameters, and
does not represent redirect-final or content identity [S5][S12].

**FACT (high):** the page counter advances only for successful results. Failed
attempts are marked visited but do not consume `max_pages`. The frontier can run
an entire concurrent batch; cancellation completes the current URL/batch step
before stopping. State callbacks serialize visited URLs, pending frontier,
depths, success count and cancellation, but persistence is supplied by the
caller [S5][S12].

**INFERENCE (high):** `max_pages` bounds accepted successful pages, not network
attempts or origin load. A hostile or broken site can produce many failures,
redirects, bytes, resources, or retries outside that count. The checkpoint is a
mutable job snapshot, not a transactional exactly-once frontier. Crash between
capture side effects and checkpoint callback can duplicate work or lose the
latest transition.

### 5.2 Prefetch, adaptive crawl, and DomainMapper

**FACT (high):** prefetch still fetches a page but skips normal scraping,
Markdown, media and extraction, returning HTML and quickly extracted links. The
docs present it as phase one of a map-then-process pattern [S5].

**FACT (high):** AdaptiveCrawler ranks links and stops on statistical or embedding
estimates of query coverage, consistency, saturation and gain, with a hard
`max_pages` available. Embedding mode can call external embedding and chat-model
providers [S19].

**FACT (high):** DomainMapper is a materially wider reconnaissance surface. It
combines sitemaps, Common Crawl, Wayback, certificate transparency, guessed path
probing, **robots Disallow/Allow path mining**, feed discovery and homepage links;
it can discover subdomains, probe common admin/API paths, and defaults `max_urls`
to unlimited, concurrency 50 and ten hits/second [S20].

**RECOMMENDATION (high):** ADAPT prefetch only as a typed discovery capture whose
URL hints are not evidence. Adaptive relevance may prioritize already-authorized
frontier items, but may never widen domain, depth, byte, time, render, or cost
authority. **REJECT DomainMapper's CT/subdomain guessing, path probing, archive
enumeration, and robots-path mining** for Curiosity's baseline. Robots Disallow
is a publisher restriction, not an invitation to discover sensitive paths.

## 6. Cache, freshness, and sessions

### 6.1 Cache behavior

**FACT (high):** cache modes distinguish read/write, read-only, write-only,
disabled and bypass. In the inspected release `CrawlerRunConfig` defaults to
`BYPASS`; only an explicit `None` is changed by `AsyncWebCrawler` to enabled.
The current API documentation's “if None, typically enabled” wording can be read
as a different default, so callers must set the mode explicitly [S3][S13].

**FACT (high):** the local cache uses a URL-primary-keyed SQLite row plus
content-addressed files for HTML, cleaned HTML, Markdown, extracted content and
screenshot. Content filenames use xxHash64. A new capture overwrites the URL row.
Rows also hold media, links, metadata, headers, download paths, ETag,
Last-Modified, a head fingerprint, and cache timestamp [S13].

**FACT (high):** optional smart validation uses conditional HEAD and, if needed,
up to 64 KiB of `<head>` content. Matching head fingerprints can declare the
whole cached page fresh. Validation follows redirects; on timeout/request error
the caller returns the cached object with `cache_status=hit_fallback` rather than
failing closed [S13].

**INFERENCE (high):** a title/meta/head match is not body freshness. URL-keyed
overwrite is not version history, xxHash64 is not an evidence-integrity digest,
and no default retention/eviction or tenant partition was found for the SDK
cache. Response headers and authenticated output may persist alongside local
paths and derived data.

### 6.2 Session/cache interaction

**FACT (high):** the cache key is URL, not session, cookie set, authorization
identity, request options, final URL, renderer version, or extraction version.
The cache read occurs before robots and network acquisition. Session id is set on
the returned result but is not part of the storage key [S8][S13].

**INFERENCE (high):** enabling cache for authenticated or personalized crawling
can cross-contaminate identities or serve stale/private content under the same
URL. A cache hit also bypasses a current robots decision. This is sufficient to
reject the cache as Curiosity's evidence store without needing a live exploit.

**RECOMMENDATION (high):** Curiosity needs immutable captures and explicit
revisit records, not URL overwrite. A cache lookup key must include normalized
request identity and policy class; sensitive/authenticated captures should be
excluded by default. Freshness must preserve old and new versions and state why a
revisit was avoided. Cryptographic content hashes and local retention/deletion
policy remain mandatory.

## 7. Robots and politeness

### 7.1 Robots findings

**FACT (high):** `check_robots_txt` defaults to **false**. When enabled, Crawl4AI
uses the browser-level user agent, stores rules in a SQLite cache for seven days,
fetches `robots.txt` with a two-second timeout and TLS verification disabled, and
returns allow on invalid URL, non-200, timeout/connection error, empty rules, or
parser uncertainty [S3][S21].

**FACT (high):** robots checking occurs only when a live fetch is needed. It is
after cache lookup, before anti-bot/proxy attempts, and checks the submitted URL.
No evidence was found that it re-evaluates redirect destinations or browser
subresources. The per-run `user_agent` update occurs later than this check in the
inspected orchestration, so the UA used for robots may differ from the eventual
request UA [S10][S21].

**NEGATIVE RESULT (high confidence in reviewed paths):** no handling of robots
redirect/error semantics as a persisted policy verdict, RFC-oriented 24-hour
normal cache bound, `Crawl-delay`, sitemap decision lineage, or publisher
noindex/nosnippet/takedown policy was identified in the robots wrapper.

### 7.2 Politeness findings

**FACT (high):** `arun_many()` auto-creates a memory-adaptive dispatcher with a
per-netloc `RateLimiter`. It introduces randomized delay and doubles delay with
jitter on 429/503, then reduces it after other statuses. The code does not use
`Retry-After`. Delay state is in process memory [S22].

**INFERENCE (high):** this is response backoff, not a complete politeness
scheduler. There is no per-domain lock around concurrent eligibility checks,
distributed ownership, cross-job/tenant fairness, persisted next-eligible time,
latency adaptation, traffic window, or robots-policy binding. Memory pressure
controls machine health, not publisher load. The Docker default API limit of
1,000 requests/minute controls clients calling Crawl4AI, not Crawl4AI calling an
origin [S22][S23].

**RECOMMENDATION (high):** REJECT product defaults. Curiosity must always enable
and independently implement RFC 9309 decisions, use a published crawler token,
persist robots bytes/hash/fetch/expiry/matched rule, conservatively handle
unavailable policy, check every redirect, and schedule through one owner per
normalized authority. Apply minimum delay, authority concurrency, 429/503 and
`Retry-After` backoff, complaint kill switch, and job/tenant/global budgets.

## 8. Hostile input, SSRF, and content security

### 8.1 In-process SDK boundary

**FACT (high):** the SDK is designed for trusted Python callers. It permits
`file:` and `raw:` inputs in the HTTP strategy, arbitrary destination URLs,
custom methods/body/headers/cookies/proxies, caller JavaScript and hooks,
persistent profiles, downloads, CDP endpoints, and external LLM/fallback
providers. Browser TLS errors are ignored by default [S3][S8][S10][S11][S14].

**NEGATIVE RESULT (medium-high):** no SDK-level destination policy rejecting
loopback, private, link-local, metadata, multicast, or rebinding destinations was
identified in the HTTP/browser acquisition paths. The HTTP client automatically
follows redirects and reads the complete decoded body. Cache validation is a
second direct HTTP path that follows redirects without the Docker egress broker
[S11][S13].

**INFERENCE (high):** the package must not process agent-selected URLs inside a
network with credentials or internal reachability. URL filters and
`include_external=False` are graph-scope controls, not DNS/IP authorization.

### 8.2 Hardened Docker API boundary

**FACT (high):** `v0.9.x` materially improves the server boundary. It binds
loopback by default, generates an ephemeral token if none is set, refuses an
unauthenticated non-loopback bind, auth-gates routes, denies CORS by default,
accepts only HTTP(S) seeds, rejects dangerous config fields, disables arbitrary
JavaScript endpoint access by default, replaces Python hooks with declarative
actions, removes caller output paths, constrains LLM provider endpoints, caps
request body/deep-crawl depth/pages, bounds the job queue, and gives task records
a one-hour default TTL [S23-S25].

**FACT (high):** its egress broker rejects any resolved address that is not
globally routable, including embedded IPv4 transition forms, rejects a host if
any answer is nonglobal, and pins an IP. A loopback forward proxy forces browser
subrequests through the same resolve/check/pin path; webhook redirects are
followed manually with destination revalidation. TLS verification is forced on
unless an operator escape hatch is set [S24].

**FACT (high):** the hardened Compose drops all capabilities, uses
`no-new-privileges`, a read-only root filesystem, private tmpfs paths, a PID cap
and memory limit. Chromium nevertheless still runs with `--no-sandbox` by default;
the project explicitly tracks enabling the renderer sandbox as an operator/build
gate [S25][S26].

**FACT (high):** release `0.8.7` fixed critical prior Docker API issues including
two RCEs, hardcoded JWT secret, auth bypass, webhook and crawl SSRF, arbitrary
file write, stored XSS and arbitrary JS exposure. The `0.9.0` migration states
that hardening is server-only and the in-process SDK remains fully powerful [S27]
[S25].

**INFERENCE (medium-high):** the current Docker controls are thoughtful and
specifically address DNS rebinding, but they are not a security proof. The
unsandboxed renderer leaves greater consequence from a browser exploit, resource
caps can be configured to zero, `wall_clock_s` defaults to zero, no fetched-page
byte/decompression cap was found, and operator escape hatches can reopen internal
egress/TLS risk. The history also makes exact-version pinning and regression tests
non-negotiable.

### 8.3 Hostile page and model output

**FACT (high):** raw HTML, cleaned HTML, Markdown, page metadata, console/network
captures, extracted JSON, generated schemas and LLM responses are returned to the
caller. The product docs tell users to validate model output but do not define an
indirect prompt-injection or evidence-trust contract [S4][S7][S9].

**INFERENCE (high):** removing script/style tags from an output representation
does not neutralize instructions embedded in text, poisoned metadata, malicious
URLs, parser bombs, Unicode confusion, or model prompt injection. Browser-side
page JavaScript has already executed before cleaned HTML exists.

**RECOMMENDATION (high):** every product result is
`untrusted_external_evidence`. Curiosity must isolate decode/parse/render,
stream-enforce compressed and decompressed byte/ratio limits, sanitize active
content, bound every string/array/schema/regex, prohibit scraped instructions
from tool/control channels, and give retrieval no write or credential authority.
Model extraction cannot approve another fetch, broaden scope, or become cited
truth without capture-grounded spans.

## 9. Provenance and evidence fitness

### 9.1 Useful fields

**FACT (high):** Crawl4AI returns more operational context than a simple Markdown
scraper: submitted URL, redirect endpoint/final status, response headers/status,
raw and transformed representations, links/media/tables, session id, optional
TLS certificate, dispatcher timing/memory, cache status/time, network/console
captures, crawl attempt/proxy statistics, and deep-crawl parent/depth [S4][S17].

### 9.2 Material omissions

**NEGATIVE RESULT (high confidence in public result model):** no guaranteed fields
were identified for:

- immutable local capture, document and version ids;
- fetch start/end observation times and exact response-byte count;
- full redirect chain, DNS answers, connected IP, or egress-policy decision;
- robots bytes/hash/version, matched rule, user-agent token, or politeness slot;
- discovery-edge identity beyond mutable `parent_url`, enqueue/dequeue order, or
  skipped reason ledger;
- browser/engine binary version and exact render environment;
- raw cryptographic body hash and content-encoding/decompression facts;
- cleaning/Markdown/extractor/model version and complete options digest;
- canonical-link evidence, exact/near duplicate clusters, rights/retention class;
- raw-byte-to-DOM-to-Markdown-to-extraction span lineage.

The cache's internal xxHash64 filenames and head fingerprint are implementation
details, not an immutable evidence contract [S13][S17].

**RECOMMENDATION (high):** never use `CrawlResult` directly as Curiosity's
`Capture`. A wrapper cannot reconstruct facts the fetcher discarded. Curiosity's
owned fetch plane must generate policy, attempt, redirect, capture and transform
events at the time they occur, retain immutable artifacts, and anchor passages to
the exact capture.

## 10. Deployment and operational boundary

| Surface | What is offered | Decision-significant boundary |
| --- | --- | --- |
| Python SDK / CLI | Local trusted-code library; browser default; full hooks, JS, sessions, files, proxies and extraction | Maximum caller power; no demonstrated SDK SSRF boundary; third-party runtime and broad dependencies |
| Hardened Docker API | REST, jobs/webhooks, MCP, browser pool, Redis, monitor, artifacts, auth and egress proxy | Better untrusted-request boundary, but large service surface, unsandboxed Chromium default, operator-owned TLS/retention/HA/patching |
| Cloud API | Documentation home calls it a closed beta “launching soon” | No stable public contract, privacy/retention/SLA or behavior evaluated; **DEFER** |

**FACT (high):** the package requires Python 3.10+ and directly depends on both
Playwright and Patchright, a project-specific LiteLLM fork, aiohttp/httpx,
parsers, image/numeric/NLP/geospatial libraries and others; optional profiles add
PyTorch, transformers, sentence-transformers, scikit-learn and Selenium. The
release includes a CycloneDX SBOM, but no transitive license/vulnerability audit
was performed here [S16][S28].

**CONTRADICTION retained:** the current self-host page announces `0.9.0` as
secure-by-default, but its installation section still calls `0.8.0` latest and
shows now-invalid `output_path`, inline-hook and JavaScript examples. The pinned
`0.9.2` migration/source says output paths and arbitrary hooks are removed and
the JS endpoint is disabled by default [S23][S25]. Treat release-pinned source and
migration material as authoritative; copying documentation snippets is unsafe.

**INFERENCE (high):** self-hosting controls location but does not make the system
owned, minimal, or automatically private. Browser pages, proxies, webhooks, LLM
providers and fallback functions are outbound data paths. Cache, artifacts,
Redis, logs, screenshots and profiles create retention/backup/secret obligations.

## 11. License and clean-room boundary

**FACT (high):** `pyproject.toml` declares `Apache-2.0`. The root `LICENSE`
contains Apache License 2.0 and then, after its “END OF TERMS AND CONDITIONS,”
adds a mandatory prominent attribution for all distributions, publications and
public uses. No root `NOTICE` file was present in the inspected tag [S15][S16].

**UNKNOWN (blocking):** whether the appended condition is intended as a separate
additional license restriction, an enforceable attribution notice, or
informational project policy; whether package metadata accurately expresses the
complete terms; and how it applies to internal service use, public research, or
derivative works. This dossier provides attribution but does not resolve the
license. Counsel must.

**FACT (high):** Apache 2.0 itself grants copyright and contributor patent rights
subject to license/notice/modified-file conditions and excludes trademarks. Even
if counsel concludes the work is permissively usable, its packages and broad
dependency graph remain third-party software [S15][S16].

**RECOMMENDATION (high):** maintain a clean-room boundary:

1. Preserve this dossier, product/release/commit attribution, and source ledger.
2. Turn only approved behavior into an independently written functional
   specification using provider-neutral names.
3. Do not copy or translate source, modified html2text behavior, prompts,
   extraction schemas, regex catalogs, tests, comments, defaults, Docker
   hardening modules, or documentation examples into owned project code.
4. Use independently authored fixtures and standards-derived behavior.
5. A package, container, SDK code, or adapted source import requires a new ADR,
   counsel's exact license expression, SBOM/notices, vulnerability review and an
   explicit exception to the wholly-owned premise.
6. Do not imply that the Cloud beta, third-party web content, model output, or
   dependency graph inherits the root project license.

This is an engineering boundary, not legal advice.

## 12. Exact `opencode2-curiosity` implications

### 12.1 Current ABI and authority must not change

**FACT (high):** the current OpenCode surface is a researcher-only
`web_search(query,maxResults<=10)` with a deprecated identical alias. Inputs,
response size, timeout and redirects are bounded; normalized text is explicitly
untrusted. Curiosity gets one caller-framed, scored follow-up pass [C1][C3].

**RECOMMENDATION (high):** Crawl4AI does **not** justify adding `crawl`, `open`,
`render`, JavaScript, session, proxy, file, webhook, or extraction controls to
the agent ABI. The researcher may request evidence through the existing bounded
search contract; only the owned service's policy plane decides whether an
already-authorized URL receives a static revisit or later render attempt. Search
output can never carry session ids, filesystem paths, CDP endpoints, cookies,
headers, scripts, or fallback callbacks.

### 12.2 Fit to the staged owned-search plan

| Curiosity stage / requirement | Crawl4AI lesson | Exact disposition |
| --- | --- | --- |
| Stage 1: static capture, RFC 9309, WARC, durable frontier | HTTP strategy and prefetch show static acquisition/discovery value, but robots/SSRF/bytes/frontier are insufficient | **REJECT implementation; ADAPT split only.** Build standards-derived policy and capture independently. |
| Stage 2: versioned extraction and provenance | raw/cleaned/fit/structured layers are useful | **ADAPT transform manifest.** Do not use URL-overwrite cache or unversioned result as evidence. |
| Stage 4: unchanged provider-neutral agent adapter | Docker/MCP expose broad crawler power | **REJECT direct integration.** Preserve current researcher-only ABI and untrusted marker. |
| Stage 5: selective rendering after measured gain | distinct browser strategy supports capability separation | **ADAPT concept, DEFER execution.** Sandboxed second queue only after static-quality evaluation. |
| Bounded curiosity | AdaptiveCrawler models coverage/saturation | **ADAPT metrics only.** Search reports coverage; caller retains follow-up authority and `CURIOSITY_NO_GO`. |
| Wholly owned core | Third-party package/container | **REJECT** absent a new ownership/license ADR [C2]. |

### 12.3 Provider-neutral contracts reinforced by this review

**RECOMMENDATION (high):** keep operations separate even if one internal service
implements several:

- `discover(seed, hard_scope, discovery_budget) -> UrlObservation[]`
- `fetch(url, policy_ref, freshness, byte_time_budget) -> CaptureAttempt`
- `render(capture_ref, reason, render_policy, render_budget) -> RenderAttempt`
- `transform(capture_ref, transform_spec) -> DerivedArtifact`
- `crawl(seeds, scope, frontier_policy, aggregate_budget) -> CrawlRun`

Hard request policy must separately bound origins, paths, query handling,
redirects, depth, discovered/fetched/success/failed pages, compressed and decoded
bytes, resources, retries, browser seconds, wall time, host concurrency/delay and
cost. Success-only `max_pages` is expressly insufficient.

Every attempt/result needs stable local ids, requested/normalized/final URLs,
full redirect and discovery edges, timestamps, status/MIME/encoding/bytes,
robots/politeness decision ids, DNS/connected-IP policy facts, renderer/extractor
versions, cryptographic hashes, transform lineage, cache/revisit state,
truncation/warnings, typed terminal failure, and trust class. This extends the
current architecture's required capture and citation fields rather than adopting
Crawl4AI wire names [C3].

### 12.4 Evaluation-only use, if separately authorized

The narrowest acceptable future evaluation would:

1. pin the exact release/container digest and retain the SBOM/license review;
2. use only project-authored or rights-approved static fixtures, preferably
   `raw:` input with the test environment denied network egress;
3. compare extraction/Markdown fidelity, omission and span anchoring against an
   independently specified oracle—never copy generated code or defaults;
4. run outside the owned package/runtime graph with no credentials, profiles,
   cache carry-over, downloads, model providers or proxying;
5. record version/options/output hashes and delete runtime/cache artifacts; and
6. make benchmark results informative, not a production dependency decision.

## 13. Verdict ledger

| Product pattern / capability | Verdict | Confidence | Rationale |
| --- | --- | --- | --- |
| Explicit HTTP and browser strategies | **ADAPTED concept** | High | Correct capability seam; Curiosity reverses the default to static-first. |
| Prefetch before full processing | **ADAPTED** | High | Discovery is cheaper, but still a fetch and only returns untrusted URL hints. |
| Raw/cleaned/fit/derived representation ladder | **ADAPTED / strengthened** | High | Add immutable capture and span/version lineage. |
| CSS/XPath/regex before LLM extraction | **ADOPTED priority** | High | Deterministic first; independently specify implementation. |
| LLM Markdown/filter/extraction as evidence | **REJECTED** | High | Model-dependent transformation without guaranteed grounding. |
| BFS/DFS/best-first and filter/scorer ports | **ADAPTED** | High | Useful policies; add durable leases, fairness, reason records and hard aggregate budgets. |
| Success-only, infinite-default `max_pages` | **REJECTED** | High | Does not bound attempts, bytes, retries, resources or origin load. |
| Mutable checkpoint callback | **ADAPTED narrowly** | High | Useful observability/resume shape; not transactional capture/frontier durability. |
| URL-overwrite local cache | **REJECTED as evidence store** | High | No immutable versions; session/options absent from key; freshness can be false. |
| Cache-state vocabulary and conditional revisit | **ADAPTED** | High | Preserve old capture; use stronger validators and explicit fallback policy. |
| Browser sessions/persistent profiles | **DEFERRED / restricted** | High | Secret-bearing and cross-request state; not needed for public baseline. |
| Robots implementation/default | **REJECTED** | High | Off, fail-open, seven-day cache, TLS disabled, weak lineage/redirect semantics. |
| Per-domain 429/503 backoff | **ADAPTED / strengthened** | High | Keep response signal; add serialized/distributed origin scheduler and Retry-After. |
| Proxy escalation, stealth and challenge evasion | **REJECTED** | High | Conflicts with identifiable publisher-respecting crawling. |
| DomainMapper reconnaissance | **REJECTED** | High | Subdomain/path probing and robots-path mining exceed baseline authority. |
| Hardened Docker egress pinning | **ADOPTED as requirement evidence** | High | Strong defense pattern; implement independently and validate every path. |
| Docker server as production crawl plane | **REJECTED** | High | Third-party core, broad surface, unsandboxed browser default, provenance gaps. |
| Crawl4AI as offline benchmark oracle | **DEFERRED** | Medium-high | Only after license/fixture/security authority and isolated protocol. |
| Crawl4AI source/package in owned core | **REJECTED** | High | ADR 0021 plus unresolved added license condition and dependency breadth. |

## 14. Unknowns, negative results, and required validation

| Item | Type / confidence | Why it matters | Required check before reconsideration |
| --- | --- | --- | --- |
| Exact legal effect of appended attribution condition | **UNKNOWN / high materiality** | Package says Apache-2.0 but root text adds a condition | Counsel opinion and machine-readable exact license expression |
| SDK private-network protection | **NEGATIVE RESULT / medium-high** | Direct library paths appeared unrestricted | Authorized offline SSRF/DNS/redirect test matrix on exact build |
| Response/decompression ceiling across SDK and Docker browser | **NEGATIVE RESULT / medium-high** | Memory/disk DoS and parser bombs | Controlled compressed/streaming fixture tests and source-wide audit |
| Full redirect policy/provenance | **NEGATIVE RESULT / high** | Scope, robots and citation identity | Owned redirect fixtures across HTTP and browser paths |
| Robots RFC 9309 edge conformance | **UNKNOWN / medium** | Current wrapper is convenience-oriented | Standards-derived test suite; do not use live publisher sites |
| Crash consistency of deep-crawl checkpoint/cache | **UNKNOWN / high materiality** | Duplicate/lost captures after interruption | Kill at every frontier/fetch/capture/checkpoint boundary |
| Cache isolation with sessions/auth headers | **UNKNOWN / high materiality** | Possible private-content cross-use | Controlled two-principal fixture test; default remains cache-off |
| Browser exploit containment with `--no-sandbox` | **UNKNOWN / high materiality** | Hostile pages execute renderer code | Independent container/browser security review; sandbox must be on |
| Docker egress parity for every endpoint, mapper, cache validator and optional provider | **UNKNOWN / medium-high** | One bypass defeats SSRF boundary | Route inventory plus authorized network-policy tests |
| Markdown/extraction accuracy and reproducibility | **UNKNOWN / medium** | Vendor examples are not quality evidence | Licensed fixture corpus, versioned judgments and span-level scoring |
| Cloud API contract, retention, regions, subprocessors, robots and security | **UNKNOWN / high** | Closed beta is not a public stable product | Vendor contract/DPA/security package; no inference from OSS |
| Dependency vulnerabilities/licenses at exact deployment date | **UNKNOWN / high** | Broad browser/LLM/parser graph | Exact image/package SBOM, notices, CVE and provenance audit |

Additional retained negatives:

- No WARC or immutable capture/version/citation model was found.
- No recrawl hazard scheduler, publisher complaint/takedown/deindex workflow, or
  content-rights ledger was found.
- No evidence shows that cleaned HTML or fit Markdown is prompt-injection safe.
- No evidence shows exactly-once results or an atomic capture/frontier commit.
- No independent benchmark was found or used for speed, extraction quality,
  anti-bot success, security, or web-scale durability.

## 15. Validation performed

The review was mechanically bounded and reproducible without executing product
code:

1. Resolved official latest release metadata and tag; confirmed release
   `v0.9.2`, commit `7e8015…`, package version `0.9.2`.
2. Read official v0.9.x pages for simple/deep/adaptive crawl, configuration,
   cache, sessions, Markdown, deterministic/LLM extraction, results,
   DomainMapper, anti-bot behavior and self-hosting.
3. Inspected pinned acquisition strategies, orchestrator, deep-crawl strategies,
   robots wrapper, dispatcher, cache/database/validator, browser sessions,
   Docker auth/egress/governance/deployment, manifest, SBOM and license.
4. Cross-checked documentation defaults against source and retained differences
   rather than silently resolving them.
5. Read project-authored security release and migration records; no exploit
   reproduction was attempted.

No functional, load, security, quality, license-compliance, container, network,
or target-site test was run. “Validated” here means source/document
triangulation, not runtime certification.

## 16. Bounded curiosity pass

Remaining in-frame threads were scored 1–5 for **relevance (R)**, **decision
value (V)**, **novelty (N)** and **cost (C, lower is better)**. Priority was
`R + V + N - C`. Only official-source inspection requiring no runtime access was
authorized.

| Thread | R | V | N | C | Score | Outcome |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| SDK versus Docker SSRF boundary | 5 | 5 | 5 | 2 | 13 | **Pursued.** Found robust Docker resolve/check/pin proxy but no equivalent SDK gate; distinction is decision-critical. |
| Robots default, cache and failure behavior | 5 | 5 | 4 | 1 | 13 | **Pursued.** Confirmed off, seven-day cache, TLS-disabled fetch and fail-open outcomes; cache hits precede checks. |
| “Static mode” versus browser default | 5 | 5 | 4 | 1 | 13 | **Pursued.** Confirmed genuine HTTP strategy but Playwright remains orchestrator default. |
| Cache provenance/session isolation | 5 | 5 | 5 | 2 | 13 | **Pursued.** Found URL-only overwrite key, xxHash64 objects, optional weak freshness and no session/options keying. |
| License declaration versus appended condition | 5 | 5 | 5 | 2 | 13 | **Pursued.** Material mismatch retained as counsel gate; not self-resolved. |
| Current Docker docs versus migration/source | 4 | 4 | 4 | 1 | 11 | **Pursued.** Found stale 0.8 install and removed-feature examples on a page announcing 0.9 hardening. |
| Run localhost/metadata/DNS-rebinding probes | 5 | 5 | 2 | 5 | 7 | **CURIOSITY_NO_GO.** Live security testing was not authorized and source evidence sufficed for the decision. |
| Benchmark Markdown/extraction on third-party pages | 3 | 4 | 3 | 5 | 5 | **CURIOSITY_NO_GO.** Needs a rights-approved corpus, judgments, package execution and separate authority. |
| Reverse engineer Cloud beta internals | 2 | 2 | 4 | 5 | 3 | **CURIOSITY_NO_GO.** Nonpublic/proprietary boundary and no stable contract; irrelevant to owned-core verdict. |
| Audit every transitive dependency/CVE | 3 | 4 | 2 | 5 | 4 | **CURIOSITY_NO_GO.** Required only if adoption/evaluation is proposed; current verdict rejects dependency. |
| Determine enforceability of license addition | 5 | 5 | 3 | 5 | 8 | **CURIOSITY_NO_GO.** Legal advice exceeds authority; uncertainty is explicitly blocking. |

**Stop reason:** coverage and saturation. All caller-requested categories have
primary evidence and verdicts. Remaining high-value gaps require counsel, vendor
material, package execution, controlled fixtures, or authorized security tests;
none may be pursued autonomously.

## 17. Source ledger

All web sources were accessed **2026-08-17**. Pinned-source citations describe
release `v0.9.2` at commit `7e801521428ee12509994d39151006f64055ebe3`,
not every historical version or future Cloud deployment.

- **[S1]** Crawl4AI official GitHub release `v0.9.2` (publication date and tag):
  <https://github.com/unclecode/crawl4ai/releases/tag/v0.9.2>
- **[S2]** Crawl4AI documentation home and Quick Start (product boundary, Cloud
  closed-beta notice): <https://docs.crawl4ai.com/>
- **[S3]** Official configuration reference (browser, crawl, robots, sessions,
  actions and HTTP options): <https://docs.crawl4ai.com/api/parameters/>
- **[S4]** Official `CrawlResult` guide (public result model and
  representations): <https://docs.crawl4ai.com/core/crawler-result/>
- **[S5]** Official Deep Crawling guide (frontier modes, limits, checkpoints,
  cancellation and prefetch): <https://docs.crawl4ai.com/core/deep-crawling/>
- **[S6]** Official Markdown Generation guide (source layers, citations, pruning,
  BM25 and LLM filtering):
  <https://docs.crawl4ai.com/core/markdown-generation/>
- **[S7]** Official LLM-free extraction guide (CSS, XPath, regex, generated
  schemas and span output):
  <https://docs.crawl4ai.com/extraction/no-llm-strategies/>
- **[S8]** Official Session Management guide:
  <https://docs.crawl4ai.com/advanced/session-management/>
- **[S9]** Official LLM extraction guide (provider, chunk, input and validation
  semantics): <https://docs.crawl4ai.com/extraction/llm-strategies/>
- **[S10]** Pinned `AsyncWebCrawler`, browser strategy/config and browser manager:
  <https://github.com/unclecode/crawl4ai/blob/7e801521428ee12509994d39151006f64055ebe3/crawl4ai/async_webcrawler.py>,
  <https://github.com/unclecode/crawl4ai/blob/7e801521428ee12509994d39151006f64055ebe3/crawl4ai/async_crawler_strategy.py>,
  <https://github.com/unclecode/crawl4ai/blob/7e801521428ee12509994d39151006f64055ebe3/crawl4ai/async_configs.py>, and
  <https://github.com/unclecode/crawl4ai/blob/7e801521428ee12509994d39151006f64055ebe3/crawl4ai/browser_manager.py>
- **[S11]** Pinned `AsyncHTTPCrawlerStrategy` in `async_crawler_strategy.py`:
  <https://github.com/unclecode/crawl4ai/blob/7e801521428ee12509994d39151006f64055ebe3/crawl4ai/async_crawler_strategy.py>
- **[S12]** Pinned deep-crawl source (`base_strategy.py`, `bfs_strategy.py`,
  `dfs_strategy.py`, `bff_strategy.py`, filters/scorers):
  <https://github.com/unclecode/crawl4ai/tree/7e801521428ee12509994d39151006f64055ebe3/crawl4ai/deep_crawling>
- **[S13]** Pinned cache context/database/validator and content-hash utility:
  <https://github.com/unclecode/crawl4ai/blob/7e801521428ee12509994d39151006f64055ebe3/crawl4ai/cache_context.py>,
  <https://github.com/unclecode/crawl4ai/blob/7e801521428ee12509994d39151006f64055ebe3/crawl4ai/async_database.py>,
  <https://github.com/unclecode/crawl4ai/blob/7e801521428ee12509994d39151006f64055ebe3/crawl4ai/cache_validator.py>, and
  <https://github.com/unclecode/crawl4ai/blob/7e801521428ee12509994d39151006f64055ebe3/crawl4ai/utils.py>
- **[S14]** Official Anti-Bot & Fallback guide:
  <https://docs.crawl4ai.com/advanced/anti-bot-and-fallback/>
- **[S15]** Pinned root license, including appended attribution condition:
  <https://github.com/unclecode/crawl4ai/blob/7e801521428ee12509994d39151006f64055ebe3/LICENSE>
- **[S16]** Pinned `pyproject.toml` (declared license, package and dependency
  surface):
  <https://github.com/unclecode/crawl4ai/blob/7e801521428ee12509994d39151006f64055ebe3/pyproject.toml>
- **[S17]** Pinned `CrawlResult` model:
  <https://github.com/unclecode/crawl4ai/blob/7e801521428ee12509994d39151006f64055ebe3/crawl4ai/models.py>
- **[S18]** Pinned Markdown generation and content-filter strategies:
  <https://github.com/unclecode/crawl4ai/blob/7e801521428ee12509994d39151006f64055ebe3/crawl4ai/markdown_generation_strategy.py> and
  <https://github.com/unclecode/crawl4ai/blob/7e801521428ee12509994d39151006f64055ebe3/crawl4ai/content_filter_strategy.py>
- **[S19]** Official Adaptive Crawling guide:
  <https://docs.crawl4ai.com/core/adaptive-crawling/>
- **[S20]** Official Domain Mapping guide:
  <https://docs.crawl4ai.com/core/domain-mapping/>
- **[S21]** Pinned `RobotsParser` and orchestration call site:
  <https://github.com/unclecode/crawl4ai/blob/7e801521428ee12509994d39151006f64055ebe3/crawl4ai/utils.py> and
  <https://github.com/unclecode/crawl4ai/blob/7e801521428ee12509994d39151006f64055ebe3/crawl4ai/async_webcrawler.py>
- **[S22]** Pinned dispatcher and per-domain rate limiter:
  <https://github.com/unclecode/crawl4ai/blob/7e801521428ee12509994d39151006f64055ebe3/crawl4ai/async_dispatcher.py>
- **[S23]** Official Self-Hosting guide:
  <https://docs.crawl4ai.com/core/self-hosting/>
- **[S24]** Pinned Docker egress broker, browser pinning proxy, webhook and URL
  validation:
  <https://github.com/unclecode/crawl4ai/blob/7e801521428ee12509994d39151006f64055ebe3/deploy/docker/egress_broker.py>,
  <https://github.com/unclecode/crawl4ai/blob/7e801521428ee12509994d39151006f64055ebe3/deploy/docker/egress_proxy.py>,
  <https://github.com/unclecode/crawl4ai/blob/7e801521428ee12509994d39151006f64055ebe3/deploy/docker/webhook.py>, and
  <https://github.com/unclecode/crawl4ai/blob/7e801521428ee12509994d39151006f64055ebe3/deploy/docker/server.py>
- **[S25]** Pinned Docker hardening migration and configuration:
  <https://github.com/unclecode/crawl4ai/blob/7e801521428ee12509994d39151006f64055ebe3/deploy/docker/MIGRATION.md> and
  <https://github.com/unclecode/crawl4ai/blob/7e801521428ee12509994d39151006f64055ebe3/deploy/docker/config.yml>
- **[S26]** Pinned Dockerfile, Compose and security verification guide:
  <https://github.com/unclecode/crawl4ai/blob/7e801521428ee12509994d39151006f64055ebe3/Dockerfile>,
  <https://github.com/unclecode/crawl4ai/blob/7e801521428ee12509994d39151006f64055ebe3/docker-compose.yml>, and
  <https://github.com/unclecode/crawl4ai/blob/7e801521428ee12509994d39151006f64055ebe3/deploy/docker/SECURITY-VERIFY.md>
- **[S27]** Official `v0.8.7` security-hardening release notes retained in the
  pinned release: <https://github.com/unclecode/crawl4ai/blob/7e801521428ee12509994d39151006f64055ebe3/docs/blog/release-v0.8.7.md>
- **[S28]** Pinned CycloneDX SBOM and explanatory README:
  <https://github.com/unclecode/crawl4ai/tree/7e801521428ee12509994d39151006f64055ebe3/sbom>

Repository-local decision sources:

- **[C1]** ADR 0020, provider-neutral bounded web search:
  `docs/decisions/0020-provider-neutral-web-search.md:14-35`.
- **[C2]** ADR 0021, staged owned public-web search:
  `docs/decisions/0021-owned-public-web-search.md:22-60`.
- **[C3]** Owned-search architecture baseline, contracts and stage gates:
  `docs/research/owned-public-web-search-architecture-2026-08-17.md:84-155,`
  `181-276,331-487`.

## 18. Confidence summary

- **High:** latest release/tag identity; browser-default versus separate HTTP
  strategy; public result/extraction/frontier/cache/session contracts; inspected
  robots, rate-limit, cache and Docker security defaults; manifest and root
  license text; Curiosity ADR implications.
- **Medium-high:** completeness of negative source results for SDK SSRF and
  response-size controls; exact operational consequences of cache/session
  keying; Docker-path coverage without runtime testing.
- **Medium:** current documentation's exact correspondence to all `v0.9.2`
  behaviors; comparative extraction quality; checkpoint behavior under crashes;
  residual container/browser exploit containment.
- **Low / unknown:** Cloud beta internals and legal/privacy terms; full
  transitive license/CVE status; web-scale performance; anti-bot success; exact
  legal effect of the appended attribution condition.
