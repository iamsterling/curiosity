# Firecrawl hosted and OSS surfaces: clean-room reverse-engineering dossier

**Research date / source access date:** 2026-08-17  
**Decision:** what Curiosity should adopt, adapt, reject, or defer from
Firecrawl's hosted and self-hosted map, crawl, scrape, and extract surfaces.  
**Status:** research only. No paid request, live target crawl, exploit test,
deployment, or third-party code transfer was performed.  
**Inspected OSS release:** `v2.11.162`, resolved checkout
`7666c1f9ae8720a6bba271e0f60b6a217f8a5210`.

## Executive verdict

**ADAPT the contract patterns, do not adopt Firecrawl as Curiosity's owned
retrieval foundation (high confidence).** Firecrawl offers an unusually coherent
four-stage vocabulary: cheap URL discovery (`map`), bounded recursive retrieval
(`crawl`), one-resource rendering and normalization (`scrape`), and
schema/prompt-driven synthesis (`extract`). Its best lessons are explicit
frontier controls, async job envelopes, output-format selection, cache freshness
knobs, per-page failures, and clear separation between discovery and content
acquisition.

**REJECT direct source reuse in Curiosity's provider-neutral core (high
confidence).** The server is primarily AGPL-3.0, while only identified SDK and
UI subtrees are MIT. Network deployment of a modified AGPL server engages the
AGPL's source-offer requirement. Fire-engine and several Cloud capabilities are
not in the default OSS stack. Learn behavior clean-room; do not copy server
implementation, types, prompts, or tests into MIT/permissive project code
without a separately approved licensing design [S12][S13].

**DEFER any hosted adapter until privacy, provenance, robots/politeness, SSRF,
retention, and cost gates are answered (high confidence).** Cloud is useful as
an optional, quota-bound rendering/extraction lane, not as the evidence system
of record. The most material concerns are: default provider-side caching; unspecified
activity-log retention; hosted processing and storage in the United States;
weak evidence-chain fields; a documented ability for Enterprise users to ignore
robots; no demonstrated automatic use of robots `Crawl-delay`; and commercial
documentation contradictions about charging failed requests and Map's unit of
billing [S4][S6][S8][S10][S15].

## 1. Frame, bounded questions, and method

### 1.1 Questions

1. What contracts do `map`, `crawl`, `scrape`, and `extract` actually expose?
2. How are discovery frontier, path/domain scope, rendering, extraction,
   caching, provenance, and failures represented?
3. What evidence exists for robots compliance and origin politeness?
4. What differs between Firecrawl Cloud and the default self-hosted stack?
5. What safety, SSRF, privacy, retention, pricing, and licensing constraints
   matter to Curiosity?
6. Which patterns can be adopted or adapted without copying AGPL code or
   widening agent authority?

### 1.2 Method and evidence rules

Official documentation, OpenAPI pages, pricing/legal pages, the upstream
license, and a shallow checkout of the documented self-host release were used.
The release was inspected only to characterize observable behavior and fill
documentation gaps; no source text was copied into project code. Vendor claims
show what Firecrawl says it offers, not independent quality or security proof.

Labels:

- **FACT** — directly supported by a cited primary source or pinned source file.
- **INFERENCE** — reasoned from facts but not directly measured.
- **RECOMMENDATION** — proposed Curiosity choice.
- Confidence is **high**, **medium**, or **low**.

**Coverage bound:** contract, frontier, rendering, extraction, robots and
politeness, cache/provenance, limits/pricing, deployment gaps, safety/privacy,
license boundaries, and Curiosity implications. **Stop condition:** all topics
have primary evidence and additional inspection repeats an established pattern.

## 2. Product model and endpoint contracts

### 2.1 Contract summary

| Surface | Input and execution | Output | Important bounds / semantics | Verdict |
| --- | --- | --- | --- | --- |
| `POST /v2/map` | Base URL plus optional relevance `search`, sitemap mode, location, and URL normalization controls; synchronous. | `success` and URL records with optional title/description. | Default `limit=5,000`, maximum `100,000`; `includeSubdomains=true`, `ignoreQueryParameters=true`; one documented credit per **call**. Prioritizes speed, not completeness. | **ADAPT** as a cheap discovery-only contract. |
| `POST /v2/crawl` | Seed URL, frontier/scope policy, and per-page `scrapeOptions`; async job with poll, WebSocket, or webhook delivery. | Job status, totals, completed count, credits, expiry, paginated documents; separate errors endpoint. | Default `limit=10,000`; result pages over 10 MB paginate; results available through API for 24 hours; limit is a cap, not a coverage promise. | **ADAPT** bounded async job and explicit frontier policy. |
| `POST /v2/scrape` | One HTTP(S) URL and format/render/extraction/cache options; synchronous response. | Requested representations plus metadata. | Default main-content filter; timeout documented 60 s, maximum 300 s; default cache eligibility two days; many representations may be requested together. | **ADAPT** only behind Curiosity's provider-neutral fetch contract. |
| `POST /v2/extract` | Up to ten URLs in inspected v2 schema, including experimental `/*` domain wildcard, or prompt-only alpha discovery; prompt and/or JSON Schema; async. | Job id, then status and collated structured `data`; optional `sources`; completed job result API lifetime 24 hours. | Beta; full large-site coverage and complex universal queries explicitly not reliable; external discovery can be enabled. `/agent` is described as its successor. | **REJECT** as evidence-producing truth; **DEFER** as optional synthesis aid. |

**FACT (high):** Map primarily combines sitemap URLs, Firecrawl's existing
index/crawl data, and search-engine results. Its own documentation says it may
miss links and recommends Crawl for a more thorough/current inventory [S1]. The
pinned implementation queries the index and a search path in parallel, adds a
sitemap when requested, normalizes and deduplicates URLs, filters domain/path,
and then truncates to `limit` [S14].

**INFERENCE (high):** Map is not a live graph traversal and its result title or
description is not page evidence. Curiosity must type these as *discovered URL
hints*, with discovery source and observation time, never as fetched documents.

**FACT (high):** Crawl is composition rather than a distinct extractor: every
accepted frontier URL is scraped using the supplied `scrapeOptions`. Successful
target responses, including origin 404s, appear in `data` with
`metadata.statusCode`; Firecrawl-internal failures, timeouts, and robots blocks
are retrieved separately [S2].

**RECOMMENDATION (high):** Curiosity should retain separate `map`, `fetch`, and
`crawl` concepts even if one provider implements all three. Never infer fetch
success from discovery, or retrieval validity from HTTP transport success.

### 2.2 Scrape representations and extraction

**FACT (high):** Scrape can return markdown, cleaned HTML, raw HTML, screenshot,
links, images, summary, branding, product, audio, video, natural-language answer,
highlights, and custom JSON. Metadata examples include title, description,
language, robots meta, OpenGraph fields, source URL, final URL, status code,
content type, and scrape id [S3].

**FACT (high):** `onlyMainContent` is documented as deterministic HTML-level
filtering. `onlyCleanContent` adds an LLM pass and is skipped with a warning when
the markdown is too long; it is unavailable with ZDR. Custom JSON accepts JSON
Schema and/or a prompt. Product extraction is documented as deterministic and
fail-closed, merging on-page structured sources in priority order; it depends on
a separate service when self-hosted [S3].

**FACT (medium):** The inspected engine registry contains index, Fire-engine
Chrome/TLS paths, Playwright, plain fetch, PDF/document, Wikipedia, X/Twitter,
and exchange paths, selected by required capabilities and availability. This is
implementation evidence for a fallback/escalation architecture, not proof that
all engines are available or used in every Cloud request [S16].

**INFERENCE (high):** Firecrawl's normalized markdown/JSON is a transformation,
not a primary capture. Custom JSON, summaries, questions, highlights, and
LLM-cleaning introduce model-dependent claims; even deterministic product
merging can omit or choose among conflicting page signals.

**RECOMMENDATION (high):** Curiosity should persist a capture reference and
transformation manifest before derived text: final URL, fetch time, status,
media type, body hash, rendering mode, locale, request options, extractor name
and version, cache state, and warnings. Model output must cite captured spans or
remain explicitly `derived_unverified`.

## 3. Frontier, scope, and determinism

**FACT (high):** Crawl exposes:

- pathname regex `includePaths` and `excludePaths`, optionally against the full
  URL with `regexOnFullURL`;
- hop-based `maxDiscoveryDepth` (sitemap URLs count as depth 0);
- `crawlEntireDomain`, `allowSubdomains`, and `allowExternalLinks` (all false by
  default);
- sitemap `include` / `skip` / `only` (default `include`);
- query-parameter deduplication, similar-URL deduplication, total page `limit`,
  `maxConcurrency`, and an optional inter-scrape `delay` [S2][S17].

**FACT (high):** Default path scope is narrower than same-domain scope: starting
at `/blogs/` does not include sibling/parent paths unless
`crawlEntireDomain=true`. Pages at the maximum discovery depth may be scraped,
but links from them are not followed. Firecrawl warns that concurrent discovery
can make boundary results non-deterministic; concurrency 1 or sitemap-only is
suggested for greater repeatability [S2].

**FACT (high):** Map has materially different defaults: subdomains and query
parameter removal are enabled by default, path filtering is enabled, and the
source schema allows at most 100,000 results [S5][S17].

**INFERENCE (high):** A generic `scope` boolean is insufficient. The provider-
neutral contract needs separately typed origin, registrable-domain, subdomain,
path-prefix, query, redirect, external-link, sitemap, depth, document-kind, and
budget policies. Map and Crawl defaults must never silently substitute for each
other.

**RECOMMENDATION (high):** Curiosity should default to same-origin, seed-path
descendants, no subdomains, no external links, query normalization, conservative
document types, explicit page/byte/time/depth budgets, and redirect revalidation.
Any widening should be an auditable policy decision, not a model-generated crawl
prompt.

## 4. Rendering and acquisition behavior

**FACT (high):** The default self-host Compose stack includes an API/worker,
Playwright microservice, Redis, RabbitMQ, and PostgreSQL queue. The current
self-host guide says basic fetch and Playwright processing are included, while
Fire-engine's advanced anti-bot behavior is a separately run/configured service
and not included [S9][S18].

**FACT (high):** Hosted Scrape defaults proxy selection to `auto`, described as
basic first with enhanced retry. Location can select a proxy and emulate
language/timezone. JavaScript rendering, smart wait, explicit `waitFor`, mobile
emulation, headers/cookies, ad blocking, and browser actions are exposed [S3]
[S19].

**FACT (high):** The default self-host stack does **not** support screenshots or
page actions through its fetch/Playwright paths; the guide says both require
Fire-engine. Agent, Browser, Interact, managed dashboards, enterprise controls,
and specialized product/menu/audio/video formats are Cloud-only or require
external services [S9].

**INFERENCE (medium):** The hosted service's success on difficult sites depends
on a proprietary/managed plane that cannot be reproduced merely by running the
AGPL repository. “Open source Firecrawl” and “Cloud parity” are not equivalent.

**RECOMMENDATION (high):** Curiosity should use static HTTP first and route to an
isolated browser lane only after a content-quality failure. Browser requests
need lower concurrency and byte/time budgets, disposable state, egress policy,
and no arbitrary page actions by default.

## 5. Robots and politeness evidence

### 5.1 What is supported

**FACT (high):** The README says Firecrawl respects `robots.txt` by default.
Crawl fetches robots, checks discovered links, records blocked URLs, reports
them through crawl errors/warnings, and allows Enterprise-enabled
`ignoreRobotsTxt` and custom robots user agents [S2][S12][S20]. Map also fetches
and imports robots before sitemap/search/index aggregation; a robots fetch
failure is fail-open [S14].

**FACT (high):** The crawler parser reads `Crawl-delay`, but in the v2 Crawl
controller the code that would apply that value to job delay is commented out.
The explicit user `delay` is limited to 60 seconds and forces concurrency to
one; absent it, `maxConcurrency` defaults to the team's available concurrency
[S2][S20][S21].

**FACT (high):** One-off Scrape robots checking is conditional on an internal
team flag (`checkRobotsOnScrape`) in the inspected release, rather than being an
unconditional property of the public scrape schema. Lockdown correctly skips
robots because even fetching `robots.txt` would violate its no-egress promise
[S22].

### 5.2 Interpretation

**INFERENCE (high):** The public “respects robots by default” statement is well
supported for Crawl discovery, but not sufficient to prove universal hosted
Scrape enforcement. Whether Cloud enables the internal scrape flag for all
teams is **UNKNOWN**. Robots-fetch failure is fail-open, and automatic
`Crawl-delay` observance is not evidenced in the inspected v2 controller.

**INFERENCE (high):** A per-request delay is not a complete politeness system.
The reviewed public surfaces do not establish per-origin distributed
scheduling, adaptive backoff from 429/503 and `Retry-After`, traffic windows, or
shared host budgets across teams/jobs. Firecrawl's “handles rate limits” copy is
not evidence for those properties.

**RECOMMENDATION (high):** Curiosity must own a stricter policy record:
robots fetch result and timestamp, selected user agent, matched rule, sitemap
source, crawl-delay decision, failure policy, per-origin next-eligible time,
response-driven backoff, and operator override authority. Do not expose
`ignoreRobotsTxt` to an agent.

## 6. Cache, retention, and provenance

### 6.1 Cache and retention facts

**FACT (high):** Hosted Scrape uses a two-day cache eligibility window by
default. `maxAge=0` forces a live attempt; `minAge` is cache-only and returns a
specific 404 on miss; `storeInCache=false` avoids storing the result. Cached
responses still cost a base credit. Change tracking bypasses cache [S3].

**FACT (high):** Map documentation says sitemap data can be cached for up to
seven days. The pinned Map path also caches search-derived map results in Redis
for 48 hours unless cache is ignored or forced ZDR applies [S5][S14].

**FACT (high):** Crawl, batch, and Extract results are available through their
job APIs for 24 hours. The documentation says history/results remain viewable in
activity logs afterward, but gives no retention period there [S2][S3][S4].

**FACT (high):** Enterprise ZDR says page content and extracted data are not
persisted past the request. It costs one additional credit per page and cannot
return screenshots because those require persistent upload. Lockdown is a
Scrape-only cache-read mode, implies ZDR, makes no target egress, and charges
five credits on hit / one on miss [S3][S7].

**FACT (high):** Firecrawl's privacy policy says it uses personal information
for caching and indexing, locates servers in the United States, and currently
retains PII until written deletion request rather than on a recurring deletion
schedule. It lists analytics/support/payment sharing but does not provide a
complete request-content subprocessor/retention matrix [S10].

### 6.2 Provenance assessment

**FACT (high):** Responses carry useful operational metadata such as
`sourceURL`, final URL, target status code, content type, scrape id, and in some
modes `cacheState`/`cachedAt`; Extract can optionally return sources [S2][S3]
[S4][S7].

**INFERENCE (high):** This is not a sufficient chain of custody. The public
contract does not guarantee a raw-capture content hash, immutable capture id,
request-header policy, robots verdict, discovery edge, renderer/engine version,
extractor/model version, transformation lineage, or span-level grounding.
Map's mixed sitemap/index/SERP output does not label each URL's origin.

**RECOMMENDATION (high):** Treat every Firecrawl response as untrusted external
data. Curiosity's adapter should add a local request id, provider/version,
received time, exact options digest, source class, cache declaration, hashes of
returned artifacts, and an immutable evidence pointer. Never let provider job
expiry define Curiosity retention.

## 7. Limits, pricing, and documentation contradictions

### 7.1 Current published limits and prices

**FACT (high, time-sensitive):** The pricing page displayed Free (1,000 monthly
credits, two concurrent requests), Hobby (5,000, five), Standard (100,000, 50),
Growth (500,000, 100), and Scale (1,000,000, 150). Effective annual-billing
prices shown were $16, $83, $333, and $599 per month respectively; Enterprise is
custom and advertises ZDR, SSO, SLA, and advanced security [S6].

**FACT (high):** Current endpoint rate limits per minute range from Free
Scrape/Map 10 and Crawl/Extract 2, through Scale Scrape/Map 10,000 and
Crawl/Extract 2,000. Concurrent browser caps are 2 / 5 / 50 / 100 / 150+ by
Free through Scale/Enterprise. Queued jobs can wait up to 48 hours [S8].

**FACT (high):** Billing docs price Scrape and Crawl at one credit per processed
page, Map at one credit per call, Search at two per ten results, JSON extraction
at +4/page, PDF parse at +1/PDF page, and ZDR at +1/page. Crawl preflights
against the requested `limit`; omitting it can require 10,000 available credits
even if fewer pages would be found [S15].

### 7.2 Contradictions retained

1. **Map unit:** billing docs and feature docs say one credit per **call**,
   regardless of URL count; the pricing page says “Map 1 / page” [S1][S6][S15].
   **Assessment:** use per-call only as the better-specified current contract,
   but verify in an order form before budgeting.
2. **Failed requests:** billing docs say infrastructure-processed origin 403/404
   responses are charged; pricing FAQ says “we only charge for successful
   requests” [S6][S15]. **Assessment:** likely different meanings of Firecrawl
   failure versus successful processing of an origin error, but the customer-
   visible distinction remains ambiguous.
3. **Scrape timeout/defaults:** current OpenAPI describes a 60 s default and 300
   s maximum, while some source defaults/transforms vary by proxy/format and
   older error copy says 60 s maximum [S3][S17]. **Assessment:** adapter must set
   an explicit lower timeout; never rely on evolving provider defaults.
4. **TLS verification:** current OpenAPI documents `skipTlsVerification=true` by
   default; inspected code defaults it false when custom headers or actions are
   supplied and true otherwise [S3][S17]. **Assessment:** explicitly require
   verification in Curiosity's request policy and reject downgrade unless a
   reviewed exception exists.

**RECOMMENDATION (high):** Every Curiosity call must set page/result, byte,
duration, and concurrency ceilings. Smart Upgrade should be disabled for an
experimental adapter; budget exhaustion should fail closed, not automatically
increase plan spend.

## 8. Hosted versus self-hosted gap

| Capability / responsibility | Firecrawl Cloud | Default self-host `v2.11.162` |
| --- | --- | --- |
| Core scrape/crawl/map/search | Managed | Included |
| Static fetch + JS rendering | Managed multi-engine path | Fetch + Playwright included |
| Advanced anti-bot / Fire-engine | Managed where supported | Not included; separately configured service |
| LLM formats / Extract | Managed provider | Requires OpenAI-compatible provider or Ollama and separate validation |
| Screenshots / page actions | Available | Not in default fetch/Playwright path; requires Fire-engine |
| Product/menu/audio/video specialized formats | Managed product-dependent services | External/dedicated services required or unavailable |
| Agent, Browser, Interact | Cloud product | Not in default stack |
| Auth, TLS, durable storage, HA, monitoring, backup | Managed | Operator responsibility; quickstart intentionally lacks production design |
| Data residency / retention | Vendor-hosted; U.S. policy, Enterprise controls | Operator controls core stack, but optional AI/proxy/parser services create outbound flows |
| Billing / rate controls | Credits, plan RPM, browser concurrency | Infrastructure/provider cost and operator-defined bounds |

**FACT (high):** The official self-host guide warns that its unauthenticated
quickstart is trusted-network only and omits durable storage, TLS, high
availability, and every Cloud capability. It also states that no verified
minimum host size is published [S18].

**FACT (high):** Compose gives API and Playwright containers CPU/memory limits
and drops Playwright container capabilities, but launches Chromium with
`--no-sandbox`; the service performs browser-side SSRF checks (discussed below)
[S23][S24].

**INFERENCE (high):** Self-hosting gains data-plane control but inherits a
nontrivial queue/browser/database/security platform and still may export data
to proxies, LLMs, parsers, or specialized services. It is not automatically
private, durable, or cheaper.

## 9. Safety, SSRF, privacy, and abuse boundaries

### 9.1 SSRF and egress evidence

**FACT (high):** Public URL schemas accept only HTTP(S), validate URL shape, and
the fetch dispatcher inspects the connected remote address with `ipaddr.js`,
destroying non-unicast/private connections unless `ALLOW_LOCAL_WEBHOOKS=true`.
The default Playwright service resolves hostnames, blocks any private/internal
resolution, checks every browser request, blocks service workers, and also
routes traffic through a local SSRF-filtering proxy that repeats the DNS/IP
check [S17][S23][S24].

**FACT (high):** Redirect destinations are subject to connection-time or
browser-request checks; Enterprise Threat Protection additionally states that
redirect destinations are reclassified and can be blocked [S11].

**INFERENCE (medium):** These are meaningful SSRF defenses, including defense
against obvious DNS-to-private resolution. They are not a security proof. No
paid or destructive testing was authorized; alternate address forms, proxy
interactions, DNS rebinding timing, redirects across every engine, webhook
egress, file parsing, and Cloud-only engines were not independently tested.
The shared `ALLOW_LOCAL_WEBHOOKS` name controlling scrape-local access is an
operator footgun.

**RECOMMENDATION (high):** Curiosity must enforce URL and resolved-IP policy at
every redirect and connection in its own egress gateway, independent of the
provider. Deny loopback, private, link-local, multicast, metadata endpoints,
non-HTTP protocols, credentials in URLs, and non-approved ports; re-resolve and
pin safely; cap redirect count far below the inspected fetch path's 5,000.

### 9.2 Content and model safety

**FACT (high):** Enterprise Threat Protection can apply local lists plus Google
Web Risk or a customer's Zscaler tenant. It is off by default and normal-mode
classification costs +2 credits per URL. Agent browser navigations inside a
page are explicitly not all intercepted by this policy [S11].

**INFERENCE (high):** Threat/malware classification is distinct from prompt-
injection defense. Raw HTML, markdown, metadata, extracted JSON, action results,
and map descriptions remain attacker-controlled input.

**RECOMMENDATION (high):** Preserve Curiosity's untrusted-result label, strip
active content, isolate parsing/rendering, never execute scraped instructions,
bound schemas/strings/arrays, and keep retrieval output outside control-message
channels. Model-generated crawl prompts and FIRE-1 actions must not gain network
or credential authority.

### 9.3 Privacy and legal use

**FACT (high):** Custom headers/cookies and persistent browser profiles can
carry secrets/session state. `storeInCache=false`, ZDR, PII redaction, and
lockdown reduce specific risks, but redaction is a post-fetch transformation
and model-based in its default accurate mode [S3][S7][S25].

**FACT (high):** Hosted terms prohibit unlawful use, disseminating another
person's PII without permission, hard background checks, debt collection,
FCRA-covered uses, intelligence-agency people surveillance, and evidentiary law
enforcement/criminal-prosecution uses. Users remain responsible for target-site
rights and policies [S12][S26].

**RECOMMENDATION (high):** Do not send authenticated/private pages, session
cookies, personal datasets, or confidential query URLs to Cloud without an
approved DPA/subprocessor/retention review and Enterprise ZDR. PII redaction is
defense in depth, not authorization to collect.

## 10. License and clean-room boundary

**FACT (high):** The repository root and server are primarily AGPL-3.0. The
README identifies SDKs and some UI components as MIT; corresponding subtrees
contain separate license files. The AGPL permits running the unmodified program
but requires a modified version used over a network to offer its corresponding
source to remote users (section 13) [S12][S13].

**FACT (high):** Fire-engine is not included in the ordinary self-host offering,
and managed/specialized Cloud services are not made OSS merely because the core
API repository is public [S9][S18].

**INFERENCE (high):** Public API shapes, high-level behaviors, and independently
authored interoperability code can be studied without importing the AGPL server
implementation. Copying internal TypeScript schemas, prompts, extraction logic,
tests, or server modules would create avoidable license and provenance risk.

**RECOMMENDATION (high):** Maintain clean-room separation:

1. Cite public docs and the pinned source revision as behavioral evidence.
2. Author Curiosity contracts independently from requirements in this dossier.
3. Reuse only separately verified MIT SDK code if legal review approves it;
   otherwise call the HTTP API with original adapter code.
4. If Firecrawl server code is modified or combined into a deployed service,
   obtain legal review and satisfy AGPL source/notice obligations; never label
   that code as Curiosity's MIT project code.
5. Preserve this research's attribution and revision pin; re-check directory-
   specific licenses on upgrade.

This is an engineering boundary, not legal advice.

## 11. Curiosity contract implications

### 11.1 Provider-neutral shape to adapt

**RECOMMENDATION (high):** Define four independent operations, with adapters
free to combine them internally:

- `discover(seed, scope, budget) -> UrlHint[]`
- `fetch(url, representation, freshness, renderPolicy) -> Capture`
- `crawl(seeds, scope, frontierPolicy, fetchPolicy, budget) -> CrawlJob`
- `derive(captureRefs, schema, modelPolicy) -> DerivedArtifact`

Every response should include:

- stable local request/job/capture ids and provider request id;
- requested, canonical, and final URL;
- discovery source/edge and observed/fetched timestamps;
- HTTP status/media type and redirects;
- cache state, cached-at time, and freshness request;
- robots/politeness decision and policy version;
- renderer/extractor/model identity and options digest;
- content hash, immutable artifact reference, warnings, and per-item errors;
- explicit trust class (`external_untrusted`, `captured`, `derived_unverified`,
  `derived_grounded`).

### 11.2 Bounded operational policy

**RECOMMENDATION (high):** If a Cloud adapter is piloted:

1. Enable only `map` and static `scrape` initially; no actions, wildcard
   Extract, external links, agent, persistent profiles, or arbitrary headers.
2. Set all limits explicitly: at most 10 map results for agent-visible calls,
   one scrape URL, strict response-byte cap, short timeout, no auto-upgrade.
3. Force TLS verification, same-origin redirects, `storeInCache=false`, and ZDR
   where contractually available; otherwise exclude sensitive workloads.
4. Locally enforce robots and host politeness even if Firecrawl also does.
5. Accept only markdown plus metadata initially; retain local hashes and source
   citations. Add JSON extraction only after grounding evaluation.
6. Meter requested versus actual credits and fail closed at the local budget.

### 11.3 Verdict ledger

| Finding / pattern | Verdict | Rationale |
| --- | --- | --- |
| Separate discover/map from content scrape | **ADOPT** | Prevents URL hints from masquerading as evidence. |
| Explicit crawl frontier controls and hard page cap | **ADOPT / strengthen** | Good API vocabulary; add bytes/time/origin budgets and policy records. |
| Async crawl jobs, item errors, pagination, webhook signature | **ADAPT** | Useful operations pattern; local job state and signatures remain required. |
| Multi-format scrape response | **ADAPT narrowly** | Start with capture + markdown; derived/model formats need lineage. |
| Default shared cache | **REJECT** for sensitive work | Freshness and privacy ambiguity; use local evidence store. |
| Hosted Map as canonical inventory | **REJECT** | Mixed index/SERP/sitemap, incomplete, source attribution absent. |
| Wildcard/prompt-only Extract as factual research | **REJECT** | Beta, incomplete, variable, model-collated. |
| Hosted browser/actions/Agent | **DEFER** | Wider authority, proprietary plane, higher cost and attack surface. |
| Self-hosted Firecrawl as Curiosity core | **DEFER / likely reject** | AGPL and substantial operations burden; useful reference, not current need. |
| Firecrawl HTTP adapter as optional renderer | **DEFER** | Possible after privacy, robots, SSRF, provenance, and cost gates. |
| Copying OSS server internals | **REJECT** | AGPL/provenance boundary; clean-room learning only. |

## 12. Unknowns and required checks

| Unknown | Why it matters | Check before adoption |
| --- | --- | --- |
| Is `checkRobotsOnScrape` enabled for every hosted team and engine? | Public default claim and source gate do not prove universal Scrape behavior. | Written vendor confirmation plus controlled free-tier test on owned domains. |
| Does Cloud apply robots and SSRF policy identically across Fire-engine, index, specialty, browser action, and proxy paths? | Gaps can bypass policy. | Security architecture statement and authorized owned-target tests. |
| What exact content, URL, prompt, header, log, cache, backup, and activity-log retention applies by plan? | Privacy and deletion decisions. | DPA, subprocessor list, retention schedule, deletion SLA, ZDR scope. |
| Are cached objects tenant-isolated, and can one tenant receive another's authenticated/header-dependent capture? | Cross-tenant confidentiality. | Vendor cache-key/isolation statement and SOC 2 evidence under NDA. |
| Which model/provider and region process each LLM format and Extract request? | Data-flow and reproducibility. | Current subprocessor/model-region matrix and opt-out controls. |
| What fields are guaranteed on cache hits and which engine/version produced them? | Evidence reproducibility. | Contract test and versioned provenance schema. |
| How are canonical URLs, fragments, tracking queries, calendars, traps, and per-origin budgets handled at scale? | Frontier explosion and duplicate evidence. | Owned-site benchmark with deterministic expected graph. |
| How are `Retry-After`, 429/503, robots `Crawl-delay`, and distributed host fairness enforced? | Origin politeness. | Vendor statement and owned-origin timing trace. |
| Actual billing for origin errors, retries, cache hits, and Map | Current docs conflict. | Free-tier owned-domain billing reconciliation, then order-form wording. |
| Cloud service implementation/license correspondence to public repo | Avoids assuming source parity. | Vendor release mapping; never depend on unverified parity. |

## 13. Bounded curiosity pass

After synthesis, remaining in-frame gaps were scored 1–5 for **relevance (R)**,
**decision value (V)**, **novelty (N)**, and **cost (C, lower is better)**. Pursuit
priority was `R + V + N - C`; only primary-source checks requiring no account or
live target were authorized.

| Thread | R | V | N | C | Score | Result |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Robots claim versus source enforcement and crawl-delay | 5 | 5 | 5 | 2 | 13 | **Pursued.** Found Scrape team-flag gate, Crawl fail-open fetch, and unapplied crawl-delay code. Material contradiction retained. |
| SSRF behavior beyond URL regex | 5 | 5 | 4 | 2 | 12 | **Pursued.** Found connection-time IP checks plus Playwright DNS/request/proxy checks; live bypass testing remains unauthorized. |
| Cache/ZDR/activity-log retention | 5 | 5 | 4 | 2 | 12 | **Pursued.** Established 2-day cache eligibility, 24-hour job API, unspecified later log retention, and privacy-policy indefinite PII baseline. |
| Billing contradictions | 4 | 4 | 5 | 1 | 12 | **Pursued.** Retained Map and failed-request discrepancies rather than silently resolving them. |
| Reverse-engineer proprietary Fire-engine protocol | 3 | 2 | 4 | 5 | 4 | **CURIOSITY_NO_GO.** Not required for contract decision; proprietary boundary and no clean-room need. |
| Run free hosted requests against third-party sites | 3 | 3 | 2 | 4 | 4 | **CURIOSITY_NO_GO.** User prohibited paid tests and no live crawl was needed; owned-domain fixture authority was not provided. |
| Inspect SOC 2 report / Bugcrowd private scope | 3 | 3 | 2 | 5 | 3 | **CURIOSITY_NO_GO.** Report access/terms unavailable in the public no-account budget. |
| Benchmark markdown/extraction accuracy | 4 | 4 | 3 | 5 | 6 | **DEFERRED.** Requires a licensed fixture corpus, scoring rubric, and caller authority. |

**Stop reason:** coverage and saturation. Every requested category has primary
evidence; remaining high-value questions require vendor/account material or
authorized controlled testing, outside this research frame.

## 14. Sources

All web sources accessed **2026-08-17**.

- **[S1]** Firecrawl, “Map,” official feature documentation:
  <https://docs.firecrawl.dev/features/map>
- **[S2]** Firecrawl, “Crawl,” official feature documentation:
  <https://docs.firecrawl.dev/features/crawl>
- **[S3]** Firecrawl, “Scrape,” official feature documentation:
  <https://docs.firecrawl.dev/features/scrape>
- **[S4]** Firecrawl, “Extract,” official feature documentation:
  <https://docs.firecrawl.dev/features/extract>
- **[S5]** Firecrawl v2 OpenAPI, Map endpoint:
  <https://docs.firecrawl.dev/api-reference/endpoint/map>
- **[S6]** Firecrawl, pricing page:
  <https://www.firecrawl.dev/pricing>
- **[S7]** Firecrawl, “Lockdown Mode”:
  <https://docs.firecrawl.dev/features/lockdown>
- **[S8]** Firecrawl, rate limits:
  <https://docs.firecrawl.dev/rate-limits>
- **[S9]** Firecrawl, “Open source or Firecrawl Cloud”:
  <https://docs.firecrawl.dev/contributing/open-source-or-cloud>
- **[S10]** SideGuide Technologies / Firecrawl, Privacy Policy (last revision
  2024-12-26): <https://www.firecrawl.dev/privacy-policy>
- **[S11]** Firecrawl, “Threat Protection”:
  <https://docs.firecrawl.dev/features/threat-protection>
- **[S12]** Firecrawl repository README at inspected release:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/README.md>
- **[S13]** Firecrawl root AGPL-3.0 license at inspected release:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/LICENSE>
- **[S14]** Firecrawl Map composition at inspected release,
  `apps/api/src/lib/map-utils.ts`:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/lib/map-utils.ts>
- **[S15]** Firecrawl, billing and credits:
  <https://docs.firecrawl.dev/billing>
- **[S16]** Firecrawl engine registry at inspected release,
  `apps/api/src/scraper/scrapeURL/engines/index.ts`:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/scraper/scrapeURL/engines/index.ts>
- **[S17]** Firecrawl v2 schemas at inspected release,
  `apps/api/src/controllers/v2/types.ts`:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/controllers/v2/types.ts>
- **[S18]** Firecrawl self-host guide and pinned Compose:
  <https://docs.firecrawl.dev/contributing/self-host> and
  <https://github.com/firecrawl/firecrawl/blob/v2.11.162/docker-compose.yaml>
- **[S19]** Firecrawl, “Enhanced Mode”:
  <https://docs.firecrawl.dev/features/enhanced-mode>
- **[S20]** Firecrawl crawler robots/frontier implementation at inspected
  release, `apps/api/src/scraper/WebScraper/crawler.ts`:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/scraper/WebScraper/crawler.ts>
- **[S21]** Firecrawl v2 Crawl controller at inspected release,
  `apps/api/src/controllers/v2/crawl.ts`:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/controllers/v2/crawl.ts>
- **[S22]** Firecrawl Scrape robots gate at inspected release,
  `apps/api/src/scraper/scrapeURL/shouldCheckRobots.ts`:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/scraper/scrapeURL/shouldCheckRobots.ts>
- **[S23]** Firecrawl secure fetch dispatcher at inspected release,
  `apps/api/src/scraper/scrapeURL/engines/utils/safeFetch.ts`:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/scraper/scrapeURL/engines/utils/safeFetch.ts>
- **[S24]** Firecrawl Playwright service at inspected release,
  `apps/playwright-service-ts/api.ts`:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/playwright-service-ts/api.ts>
- **[S25]** Firecrawl, “PII Redaction”:
  <https://docs.firecrawl.dev/features/pii-redaction>
- **[S26]** SideGuide Technologies / Firecrawl, Terms of Use (last revision
  2024-11-05): <https://www.firecrawl.dev/terms-of-service>

## 15. Confidence summary

- **High:** public API shapes, documented limits, frontier defaults, inspected
  release behavior, Cloud/self-host capability gap, root licensing, published
  privacy/terms language.
- **Medium:** exact correspondence between inspected OSS release and current
  Cloud internals; hosted engine selection and SSRF consistency; interpretation
  of pricing contradictions.
- **Low / unknown:** comparative scrape accuracy, anti-bot success, complete
  Cloud retention/subprocessor behavior, universal hosted Scrape robots
  enforcement, and origin-politeness behavior under distributed load.
