# Diffbot Crawl, Extract, and Knowledge Graph: clean-room product dossier

**Research date / source access:** 2026-08-17  
**Status:** product research and architecture lessons; not an implementation,
deployment, benchmark, legal opinion, or purchase recommendation.  
**Authority boundary:** public documentation and public product/legal pages only.
No account was created, no paid or authenticated API was called, no credential
was used, no control was bypassed, and no proprietary code or response corpus
was obtained.

## Executive synthesis

Diffbot presents three connected but distinct surfaces:

1. **Crawl API (historically “Crawlbot”)** is a customer-scoped spider and job
   manager. It discovers URLs, applies crawl and processing filters, invokes a
   selected Extract API, and stores typed results in a named collection.
2. **Extract API** is the page fetch/render/classify/extract layer. Analyze
   chooses a page-type extractor; typed endpoints force an Article, Product,
   Image, Video, Discussion, Event, List, or Job schema. Extract output can
   include entity-linked tags and therefore touches the Knowledge Graph's
   identity system without becoming the global graph.
3. **Knowledge Graph (KG)** is Diffbot's vendor-operated, fused public-web
   entity graph. DQL searches it, Enhance resolves partial person/organization
   records, and extended JSON can expose origin URLs and crawl times. The same
   DQL endpoint can query private Crawl collections, but Diffbot describes
   those collections as “kind of like small Knowledge Graphs,” not as writes to
   the global KG [S1, S8, S14].

**Core finding — FACT (high confidence):** this is not one monolithic crawler
API. It is a pipeline-shaped product family with explicit seams: URL discovery
versus page processing, generic versus typed extraction, collection search
versus global-graph search, and entity matching versus optional live refresh
[S1–S3, S8, S14, S20].

**Architecture finding — INFERENCE (high confidence):** the strongest lesson
for Curiosity is the separation of discovery, extraction, ontology, fusion,
query, and provenance. The weakest fit is evidentiary: documented origins and
crawl timestamps are valuable, but they do not establish immutable captures,
passage anchors, complete per-fact derivations, historical validity intervals,
or reproducible extractor versions. Diffbot is useful as a contract and
evaluation reference, not as the provenance model for an owned search plane.

**Verdict:**

- **ADAPTED:** separate crawl from process; use typed extraction contracts;
  retain URL-parent/hop/redirect/duplicate diagnostics; query collections while
  work is in progress; expose graph snapshot/version and source origins.
- **REJECTED as Curiosity's foundation:** hosted crawl, extraction, KG, and
  proprietary ranking/fusion remain provider-controlled and do not satisfy an
  owned, reproducible public-web search plane.
- **REJECTED:** copying Diffbot names, DQL, ontology text, undocumented
  behavior, or attempting to reproduce proprietary internals.
- **DEFERRED:** any vendor trial or output-quality benchmark until an approved
  fixture set, budget, data-processing review, and purchase authority exist.

## 1. Decision frame, bounded questions, and method

### 1.1 Decision

What publicly documented behavior of Diffbot's Crawl, Extract, and Knowledge
Graph surfaces should Curiosity adopt, adapt, reject, or defer while preserving
provider-neutral contracts, bounded agent authority, evidence lineage, and a
clean-room owned-search path?

### 1.2 Bounded sub-questions

1. What is visible about Crawl scope, URL discovery, frontier controls,
   deduplication, recrawl, diagnostics, and lifecycle?
2. Where does browser rendering occur, and how does it change cost and crawl
   behavior?
3. How do generic and typed Extract APIs map pages into structured objects and
   the published ontology?
4. How are global KG entities queried, matched, fused, sourced, versioned, and
   refreshed?
5. What are the public request/response contracts, limits, prices, retention,
   privacy, security, and legal boundaries?
6. Which architecture conclusions are supported inferences, and what remains
   unknown without prohibited or paid investigation?

### 1.3 Method and evidence labels

Primary sources were Diffbot's current documentation, OpenAPI-generated
reference pages, product pages, pricing, privacy policy, and terms. Multiple
Diffbot pages were used to cross-check consequential claims. Vendor sources
establish documented behavior, not quality, completeness, or comparative
superiority. All were accessed 2026-08-17.

- **FACT** — directly stated or shown by a cited Diffbot source.
- **INFERENCE** — architecture conclusion from documented behavior, not an
  observation of private internals.
- **RECOMMENDATION** — proposed Curiosity choice.
- Confidence is **high**, **medium**, or **low**.

**Coverage budget:** architecture-level examination of all requested surfaces,
contracts, risks, economics, and clean-room lessons. **Out of scope:** live API
testing, dashboard inspection, source-code reverse engineering, circumvention,
comparative quality claims, legal advice, and implementation.

## 2. Surface map and connection model

```text
customer seeds
  -> Crawl URL discovery (raw HTML by default)
  -> crawl scope/pattern/robots/canonical/duplicate decisions
  -> selected Extract API URL
       -> fetch + browser render
       -> Analyze classification OR forced typed extractor
       -> structured object + optional DOM/meta/links/NLP/KG-linked tags
  -> named customer collection
       -> JSON/CSV download OR DQL type=crawl

Diffbot-operated public-web crawl + extraction + inference/fusion
  -> global Knowledge Graph snapshot (kgversion)
       -> DQL search/export/facets
       -> Enhance match
            -> optional recrawl of origins and/or web search
```

**FACT (high):** Crawl explicitly “hands” discovered links to an automatic or
custom Extract API, compiles results into one collection, and permits download
or DQL search [S1]. Crawl creation requires an `apiUrl`, commonly Analyze, and
the URL may carry Extract options [S2].

**FACT (high):** DQL's `type=crawl` and `col` parameters search customer crawl
collections at the same host/endpoint used for KG DQL. Diffbot says these
collections are “kind of like small Knowledge Graphs”; collection DQL is
credit-free and live-searchable before a crawl finishes [S8].

**FACT (high):** Analyze responses can include tags with KG entity URIs and RDF
types, while the global KG represents fused entities assembled from multiple
websites [S10, S14]. This is an identity/provenance connection, not evidence
that a customer's crawl collection is automatically merged into the global KG.

**UNKNOWN:** no reviewed public source states that customer Crawl output writes
to, trains, or changes the global KG. Treat the stores and update authorities as
separate unless a contract explicitly says otherwise.

## 3. Crawl surface: scope, frontier evidence, and lifecycle

### 3.1 Scope and discovery controls

**FACT (high):** `POST https://api.diffbot.com/v3/crawl` accepts
`application/x-www-form-urlencoded`, explicitly not JSON. Required fields are a
unique `name`, one or more whitespace-separated `seeds`, and a full Extract
`apiUrl` [S2].

Documented scope levers are:

| Lever | Documented behavior | Evidence |
| --- | --- | --- |
| Seed scope | A non-`www` subdomain seed restricts to that subdomain; a bare/`www` seed covers the domain and subdomains by default. Multiple seeds can span sites. | [S2, S6] |
| Domain escape | `restrictDomain=0` gives limited off-domain traversal, described as up to one hop; multiple domains should be separate seeds. A positive `urlCrawlPattern` is separately documented as allowing all matching URLs regardless of domain. | [S2, S6] |
| Depth | `maxHops=0` processes seeds only; 1 processes matching links on seeds; higher values continue by link depth; `-1` is unlimited depth. | [S2] |
| Crawl filter | `urlCrawlPattern` uses `||`-separated substrings, `!` negatives, and `^`/`$` anchors; `urlCrawlRegEx` overrides the pattern. | [S2, S3] |
| Processing filter | Separate URL pattern/regex and raw-HTML `pageProcessPattern` decide which fetched pages are sent to Extract. | [S2, S3] |
| Budgets | Defaults shown are 100,000 pages crawled and 100,000 pages processed, with optional per-subdomain caps. | [S2] |
| Rate/politeness | `crawlDelay` waits between URLs from one IP; robots rules and `crawl-delay` are honored by default. | [S1, S2] |
| Repeat | `repeat` is a floating number of days; `seedRecrawlFrequency` is independent; `maxRounds` caps rounds. | [S2, S5] |

**FACT (high):** crawl and processing are intentionally different operations.
The crawler may download a page merely to find links without paying the Extract
cost; processing invokes the configured Extract API [S1–S3, S25].

**INFERENCE (medium):** these controls prove a URL frontier with at least seed,
domain/subdomain, hop, discovered-time, parent, retry, queue, and round state.
They do **not** reveal queue ordering, priority scoring, per-host concurrency,
partitioning, durable restart semantics, backpressure, trap detection, DNS
policy, or adaptive recrawl. Those internals remain unknown.

### 3.2 Raw-HTML discovery, rendering, canonicalization, and duplicates

**FACT (high):** Crawl normally discovers links from raw HTML and does not run
JavaScript at crawl time. Extract and Custom APIs do execute JavaScript [S3,
S4]. Adding `&links` to the nested Extract `apiUrl` enables a rendered browser
for link discovery. Every page crawled in that mode is also processed and costs
an Extract credit; the seed is always processed [S4].

**FACT (high):** default duplicate detection compares each page's **exact raw
HTML** with previously spidered pages before processing. Exact duplicates are
ignored and recorded against the prior document ID. If a page declares another
canonical URL, the current page is skipped and the canonical URL is queued
[S7]. The `&links` rendering mode disables this raw-source duplicate detection
because identical source can render into different content [S4, S7].

**INFERENCE (high):** Diffbot effectively has two cost/trust lanes: cheap static
discovery and expensive rendered processing. Its explicit loss of raw-source
dedup under rendered discovery demonstrates why render reason, rendered-content
hash, and incremental information gain must be tracked independently.

**RECOMMENDATION (high):** Curiosity should adapt the two-lane split, but never
let canonical markup erase a capture. Preserve submitted, normalized,
redirect-terminal, publisher-canonical, and system-cluster identities. Use
exact raw, exact rendered, normalized-content, and near-duplicate signals as
distinct evidence.

### 3.3 Robots and politeness

**FACT (high):** Crawl honors `robots.txt`, including `Disallow` and
`crawl-delay`, by default; `obeyRobots=0` overrides it. Diffbot describes the
override as appropriate in specific partnership/agreement cases. The docs also
state that Crawl does not honor the `Allow` directive [S1, S2].

**RECOMMENDATION (high):** do not copy this robots behavior. Curiosity should
implement RFC 9309's matching rules, retain the exact robots document and policy
decision, and require a separately auditable authorization object for any
override. Robots is neither copyright permission nor an access-control bypass.

### 3.4 Repeats and freshness

**FACT (high):** a repeated crawl starts its next round the configured interval
**after the prior round ends**, not at fixed wall-clock cadence. A manual
`roundStart=1` can force a round [S5]. By default, repeats process only new,
previously unprocessed URLs (`onlyProcessIfNew=1`), rather than re-extracting
all known URLs [S2, S4].

**INFERENCE (high):** “only new URLs” is a discovery optimization, not a content
freshness guarantee. Existing URLs can change without being processed. The
separate seed frequency helps rediscovery but does not expose conditional HTTP,
change probability, substantive-change detection, or per-document staleness.

### 3.5 Diagnostics, controls, and retention

**FACT (high):** job status exposes attempts/successes, URLs harvested, objects
found, current round, creation/start/completion times, settings, and status
codes. A job is automatically paused after at least 10,000 consecutive
downloads with no successful processing, a visible efficiency guard [S9].

**FACT (high):** the URL report is available once a job begins and records
normalized URL, document ID, first-seen and crawl times, content length,
duplicate target, redirect chain result/count, robots delay, round, retry,
hop, crawl/process status, `diffbotUri`, and proxy use [S18]. Extracted records
include collection, immediate `parentUrl`, page URL, type, ID, and extraction
timestamp [S17].

**FACT (high):** jobs can be paused/resumed, restarted, or deleted. The control
surface uses GET query parameters for these mutations. Restart erases processed
data; delete is irreversible [S9]. Inactive crawls are removed after 18 days on
Startup and 32 days on Plus, including data and metadata; active recurring
crawls are exempt until their final round [S1].

**RECOMMENDATION (high):** adopt the diagnostic concepts, not the wire design.
Curiosity control operations should use authenticated mutation methods,
idempotency keys, explicit state transitions, signed webhooks, immutable audit
events, and separate serve-deletion from restricted audit tombstones.

## 4. Extract surface: rendering, classification, and schema

### 4.1 Generic and typed extraction

**FACT (high):** every documented Extract endpoint accepts a URL and token,
renders the page, and returns JSON objects. Analyze first classifies the page
and routes supported types; a direct endpoint forces a particular schema [S10,
S11]. Current documentation lists Analyze plus Article, Product, Image, Video,
Discussion, Event (beta), List (beta), and Job (beta) [S10].

**FACT (high):** Analyze documents automatic extraction for supported types and
`other` for unsupported pages. `mode` restricts extraction to one type;
`fallback` forces an extractor for unclassifiable pages. Diffbot explicitly
warns that classification can be wrong [S11].

| Extractor | Representative documented output |
| --- | --- |
| Article | clean text and normalized HTML; dates; author; language; site/publisher; images/video; sentiment; categories; entity-linked tags; comments; multipage concatenation up to 20 pages by default [S12] |
| Product | title/description, brand, offer/regular price details, shipping/discount, GTIN/UPC/SKU/MPN/ISBN, specifications, images, reviews, availability, category, variants/ranges [S13] |
| Image / Video | media URLs, dimensions, captions/metadata, primary selection, and IDs [S10] |
| Discussion | threads, posts/comments/reviews and related metadata [S10, S12, S13] |
| Event / List / Job | typed event, listing, and job-post fields; documented as beta [S10] |

**FACT (high):** Article tags are generated by the Natural Language API and can
link to primary KG entities with `uri` and `rdfTypes`; tag relevance is scored.
Categories have a separate taxonomy/score. Article and Product can automatically
embed Discussion extraction unless disabled [S12, S13].

**INFERENCE (high):** the observable extraction pipeline is approximately:

```text
URL or supplied HTML -> fetch/render -> page-type classifier
  -> typed visual/DOM/content extraction -> normalization
  -> language/NLP/category/entity linking -> typed JSON object
```

This ordering is inferred from contracts, not a claim about private services or
models.

### 4.2 Rendering and customization

**FACT (high):** Extract is render-first according to the product docs. Optional
fields can expose visible links, header/footer links, metadata (OpenGraph,
Twitter Card, schema.org, oEmbed), query parameters, breadcrumbs, Article-like
content, all rendered body text, or the rendered DOM [S10, S15].

**FACT (high):** callers can inject JavaScript through
`X-Forward-X-Evaluate`; scripts run before extraction and can mutate the DOM or
save values directly into JSON. Debug mode can return the entire page console,
not only caller logs. A script without Diffbot's `end()` times out [S16].

**RECOMMENDATION (high):** treat render, custom headers, custom JavaScript,
console output, and returned DOM as privileged high-risk modes. They can expose
cookies, page secrets, active content, or attacker-controlled data. Curiosity
should not offer arbitrary extraction-time JavaScript to an agent. Any internal
render lane needs disposable isolation, no ambient credentials/private network,
strict egress and byte/time limits, and sanitized inert output.

### 4.3 Identity, ontology, and reproducibility

**FACT (high):** Extract responses carry request API/version metadata and a
`diffbotUri`. Article documentation says its `diffbotUri` is generated from
values of several fields and can be used for deduplication [S12]. Extract type
names are shown lowercase (for example, `article`), while KG ontology examples
use top-level `Article`, `Product`, `Person`, and `Organization` [S11, S24].

**FACT (high):** the published KG ontology defines entity types, properties,
and meaningful relationships and offers a machine-readable JSON source. Common
fields include stable entity ID/URI, names/URIs, type(s), origins, crawl time,
importance, incoming edges, descriptions, and images [S23, S24].

**INFERENCE (medium):** Extract and KG share semantic vocabulary and IDs, but
their response envelopes and type casing are not one identical contract.
Provider adapters should normalize explicitly rather than leak either schema
into a provider-neutral document model.

**UNKNOWN:** the public pages reviewed do not provide an immutable extractor
build/model ID, raw response hash, screenshot hash, DOM-to-field span map, or
field-level extraction rationale. `request.version=3` is an API version, not
proof of reproducible extraction.

## 5. Knowledge Graph surface: entity model, query, provenance, freshness

### 5.1 Entity and fusion model

**FACT (high):** Diffbot describes the KG as a self-updating graph with more
than 10 billion entities, generated by crawling and structuring the public web.
Entities represent things such as people, organizations, articles, products,
and places; relationships connect entities semantically. A single entity is
generally a fusion of data from several websites [S14]. This is a vendor scale
claim, not independently audited here.

**FACT (high):** the predefined ontology is intended to keep entity properties
and relationships consistent across KG builds. It includes both canonical
fields and optional `nonCanonicalFacts` not defined in the ontology [S23, S24].

**INFERENCE (high):** documented fields imply separate stages for extraction,
entity resolution, canonical fact selection, relationship construction, and
index publication. `nonCanonicalFacts=true` exposes retained schema overflow;
it does not reveal the fusion algorithm.

### 5.2 DQL API contract

**FACT (high):** DQL is available by GET and POST at
`https://kg.diffbot.com/kg/v3/dql`. A query can filter nested typed fields and
return scored entities. Responses include API `version`, total `hits`, returned
`results`, `kgversion`, entity type, facet/text-fallback flags, entities, match
context, errors, and possible query rewrites [S19].

Important controls include:

- `size` defaults to 50 and `-1` requests all results; facet pagination requires
  `from+size <= 10,000` [S19].
- output formats include JSON, JSONL, CSV, XLS, and XLSX; field inclusion and
  exclusion use path filters/export specs [S19].
- `jsonmode=extended` returns fact-origin information; `jsonmode=id` returns
  IDs and origins; `nonCanonicalFacts=true` includes non-ontology facts [S19].
- article controls include deduplication and thematic/exact-near duplicate
  clustering modes (`all`, `best`, `dedupe`) [S19].
- `kgversion` identifies the graph snapshot queried, a useful but not fully
  specified reproducibility hook [S19].

**FACT (high):** article search has a low-latency backend covering the last six
months by **crawled date** and a slower full archive. DQL may rewrite sorted
queries with an explicit date bound and disclose the rewrite/reason. Archive
hit counts may vary and transient timeout retries may be needed [S22].

**RECOMMENDATION (high):** Curiosity should adapt explicit query rewrites,
snapshot IDs, dedup/cluster modes, and coverage warnings. It should not adapt
`size=-1` for agent-facing paths; every request needs hard result, byte, time,
and cost bounds.

### 5.3 Enhance and entity resolution

**FACT (high):** Enhance resolves a partially identified Person or Organization
from fields such as ID, name, URL, phone, email, employer, title, school,
location, description, or IP. It scores candidates, defaults to one result, and
supports a configurable match threshold [S20]. Bulk Enhance is asynchronous;
Combine returns a person and current employer [S21].

**FACT (high):** `refresh=true` recrawls matched entity origins not visited in
the last 30 days and merges refreshed data; it is documented as slow and not a
default. `refreshOrigins` can narrow refresh. `search=true` searches the web for
additional origins and merges matches, but Diffbot warns it can be very slow
and variable quality [S20]. Pricing charges 25 credits for normal Enhance and
100 for refresh [S27].

**INFERENCE (high):** entity matching, source refresh, and origin discovery are
separate control paths. This is a strong design lesson: a read/query should not
silently expand crawl authority or spend. Refresh and search must be explicit,
budgeted, and visible in provenance.

### 5.4 Provenance and confidence

**FACT (high):** an `origin` is a public-web location where data describing an
entity was discovered, or a source used to infer a fact. Entities and facts can
be compiled from one or more origins [S28]. In extended JSON, `origins` lists
source addresses and `originDetails` associates origins with crawl times;
`nbOrigins` counts them [S24].

**FACT (high):** entity `crawlTimestamp` is the **most recent** timestamp among
origins used to compute the entity. Origin-level timestamps identify when a
specific origin was last visited/extracted [S24, S29]. This is not the age of
every fact.

**FACT (high):** Diffbot says each fact has an internal confidence score, facts
below 0.5 are discarded, and scores are exposed for only some fields, such as
Article categories [S30]. Diffbot also documents external structured sources,
including Wikidata and multiple geographic datasets with source licenses,
rather than claiming every graph fact comes solely from crawling ordinary pages
[S31].

**INFERENCE (high):** entity-level origins are much better than source-free
facts, but a client cannot assume that every origin supports every returned
canonical value. `jsonmode=extended` is required to inspect fact origins, and
even then public docs do not promise quoted evidence spans, inference rules,
contradiction sets, rejected facts, or a fully exposed confidence score.

**RECOMMENDATION (high):** Curiosity evidence should go further: each served
claim needs origin/capture ID, fetched and valid/published time, exact passage
offset/hash, extractor/model version, transformation lineage, stance, and
confidence provenance. Keep observed claims distinct from inferred relations.

### 5.5 Freshness limits

**FACT (high):** the KG exposes a `kgversion`, per-origin last-crawl time in
extended mode, entity max-origin `crawlTimestamp`, a six-month fast Article
index, and on-demand Enhance refresh for origins older than 30 days [S19, S20,
S22, S24, S29].

**UNKNOWN / negative result:** no reviewed primary page provided a guaranteed
global KG refresh SLA, per-entity recrawl policy, full build cadence, bitemporal
fact history, deletion propagation SLA, or immutable access to old KG versions.
“Self-updating” and the current crawl timestamp are not historical
reproducibility guarantees [S14].

## 6. API contract and operational observations

| Surface | Contract observations | Curiosity implication |
| --- | --- | --- |
| Crawl create | POST form encoding; token in query; job starts immediately; nested `apiUrl`; webhook/email completion; 505 when 1,000-job total ceiling is reached [S2]. | Validate nested URLs/options; require explicit start authority; never put credentials in URLs; sign callbacks. |
| Crawl manage | GET query parameters mutate pause/restart/delete; restart and delete are destructive [S9]. | Do not copy unsafe HTTP semantics; use idempotent authenticated commands and audit. |
| Crawl retrieve | GET; JSON/CSV; optional recent `num`; URL report; sample extraction includes a `token` field [S17]. | Strip credentials and provider-internal fields before persistence or agent delivery. |
| Extract | Primarily GET with token and target URL in query; 30 s default third-party fetch timeout; proxy and proxy-auth options; POST supplied HTML supported [S11–S13]. | This is an SSRF/secret/logging boundary. Provider adapter must enforce destination, redirect, DNS, byte, type, and timeout policy independently. |
| DQL | GET/POST; rich unbounded-looking export options; query parser errors include line/column and marked HTML; results carry snapshot/rewrite metadata [S19]. | Keep rich internal query separate from small agent ABI; sanitize errors/HTML; cap output. |
| Enhance | GET/POST; partial identifiers including personal data; optional refresh/search invoke additional network work [S20]. | Separate lookup from discovery/refresh authority and privacy purpose. |

**FACT (high):** public rate limits are 5 calls/minute Free, 5 calls/second
Startup, and 25 calls/second Plus. Plus lists 25 active and 1,000 total
Crawl/Bulk jobs; enterprise limits are custom [S26].

**Documentation consistency checks:**

- The Crawl create example sends `maxToCrawl=100` but its shown response reports
  `maxToCrawl: 100000`. This may be a stale example, omitted update behavior, or
  documentation error; it was not tested [S2].
- `maxRounds` prose says repeating crawls default to 0 for indefinite repeats,
  while shown response objects contain `-1` [S2].
- The create reference says a positive crawl pattern can cross domains, while
  the domain FAQ says unrestricted off-domain processing is limited to one hop
  and recommends multiple seeds [S2, S6]. Exact precedence needs a fixture test.
- The rate page says Crawl/Bulk are unavailable below Plus, while the Crawl
  overview retention text names Startup retention. This may reflect legacy or
  migrated plans [S1, S26].

These contradictions argue for contract tests against an approved sandbox
before any integration and against inferring behavior from samples alone.

## 7. Pricing, quotas, and retention

**FACT (high, point-in-time):** pricing on 2026-08-17 was Free at 10,000 monthly
credits/5 requests per minute; Startup at $299/month with 250,000 credits,
$0.001 overage, and 5 requests/second; Plus at $899/month with 1,000,000 credits,
$0.0009 overage, 25 active crawls, three seats, and 25 requests/second;
Enterprise was custom with 100+ active crawls and 25+ requests/second [S27].

**FACT (high):** one normal page extraction costs one credit and extraction via
Diffbot's datacenter proxy costs two. Link spidering itself is listed as zero
credits, but extracted/processed pages consume Extract credits; JS link
discovery processes crawled pages and therefore consumes credits [S4, S27].
Exporting or enhancing one KG entity costs 25 credits; facet records and Enhance
with refresh cost 100; collection DQL search is documented as free [S8, S27].

**INFERENCE (high):** Crawl's price driver is not discovered URLs alone but the
processing/render ratio, repeat policy, proxy use, and number of exported graph
records. A cost model must count attempted fetches, rendered pages, extracted
objects, repeated unchanged pages, KG records, and retries separately.

**RECOMMENDATION (high):** do not hard-code these prices. Snapshot price and
limit terms in provider operations, preflight worst-case credits, enforce a
customer budget below vendor quota, and alert on divergence between discovered,
processed, successful, and exported counts.

## 8. Safety, privacy, and legal boundaries

### 8.1 Security and abuse surface

**INFERENCE (high):** this product family necessarily fetches caller-selected
URLs, follows links/redirects, executes page JavaScript, accepts custom headers
and proxy credentials, can run caller JavaScript, returns rendered DOM/console,
and posts to caller webhooks [S2, S4, S15–S17]. It therefore concentrates SSRF,
DNS rebinding, redirect escape, parser/browser exploit, decompression/oversize,
malware, credential forwarding, cookie/session leakage, webhook forgery,
cross-job leakage, prompt injection, and denial-of-wallet risk.

**UNKNOWN:** reviewed docs did not specify private-IP blocking, DNS rebinding
defense, browser sandbox boundaries, redirect/response-byte ceilings, malware
scanning, webhook signatures/replay protection, encryption of collection data,
or tenant isolation architecture. Absence from docs is not proof of absence.

### 8.2 Privacy

**FACT (high):** Diffbot's privacy policy explicitly distinguishes Subscribers
from “Search Subjects,” people whose publicly posted personal data is indexed.
It describes collection of names, jobs, education/employment, work contact
details, public URLs/handles, and—if subjects themselves made it public—even
sensitive data. It also logs Subscriber query history and API calls [S32].

**FACT (high):** the policy provides a `privacy@diffbot.com` removal channel,
describes access/rectification/deletion/portability handling, suppression of
incoming PII following verified deletion, US processing/transfers, and use of
service providers. It says Search Subject personal data is kept only as needed
and not longer than 30 days after Diffbot becomes aware of a verified wish to
stop sharing/communications, but this wording is not a complete dataset-level
retention schedule [S32, S34].

**RECOMMENDATION (high):** a Curiosity adapter must not treat “public” as
unrestricted. Before any use involving people, establish lawful purpose,
minimize query/input/output/log fields, restrict access, record source and
purpose, provide deletion/suppression propagation, and obtain independent
privacy review. Avoid sending private customer identifiers to Enhance unless
explicitly authorized.

### 8.3 Terms, content rights, and clean-room constraints

**FACT (high):** Diffbot's terms permit displaying/using facts generated by the
Service in a commercial application but prohibit reselling/making the Service
available to third parties, unlawful/right-infringing use, reverse engineering,
unauthorized access, bypassing robot-exclusion/access measures, and scraping or
crawling the Diffbot Site/Service. The terms disclaim accuracy, completeness,
usefulness, uptime, and non-infringement warranties [S33].

**FACT (high):** the terms say Diffbot/licensors retain service IP while
excluding user, third-party, and public-domain content from that ownership
statement. They also grant Diffbot a broad license to process user-submitted
queries or Enhance data [S33].

**RECOMMENDATION (high):** treat vendor API rights, underlying webpage rights,
personal-data duties, and ontology/documentation copyright as separate reviews.
An API response is not a blanket license to retain, redistribute, train on, or
publish underlying content. This report is not legal advice.

## 9. Architecture inferences and clean-room lessons

### 9.1 Supported internal decomposition (not proprietary internals)

The public contracts support this minimal functional decomposition:

```text
JOB/POLICY: name, seeds, scope, budgets, robots, repeat, notifications
DISCOVERY: static fetch, link parse, normalize, redirect/canonical handling
FRONTIER: queue + parent/hop/round/retry/subdomain state
PROCESS: optional browser render -> classifier -> typed extractor -> NLP/linker
COLLECTION: typed records + URL diagnostics -> download / collection DQL

GLOBAL GRAPH PIPELINE (vendor-operated and distinct):
public-web sources -> extract -> entity resolve/fuse -> ontology/canonical facts
-> graph/index snapshot -> DQL / Enhance -> optional refresh/search
```

**Confidence: high** for the boundaries; **low** for any unstated algorithm,
storage engine, scheduler, model, or physical deployment.

### 9.2 Adopt/adapt/reject/defer ledger

| Lesson | Verdict | Confidence and clean-room boundary |
| --- | --- | --- |
| Separate crawling (discovery) from processing (extraction) | **ADOPTED** | High; a generic architecture pattern directly visible in contracts. |
| Static discovery first, selective browser processing | **ADAPTED** | High; preserve isolation and only render after an explicit quality/policy trigger. |
| Distinct crawl/process patterns and budgets | **ADAPTED** | High; use provider-neutral predicates, not Diffbot syntax or DQL. |
| Parent, hop, first-seen, redirect, duplicate, robots, round, retry diagnostics | **ADOPTED** | High; extend with immutable capture/policy IDs. |
| Canonical URL queues and raw exact dedup | **ADAPTED** | High; signals must not erase captures or replace near-duplicate clustering. |
| Analyze-like classifier plus forced typed extractor | **ADAPTED** | High; return classification confidence/fallback reason and preserve raw evidence. |
| Published typed ontology and entity relationships | **ADAPTED conceptually** | High; author a Curiosity-owned neutral schema; do not copy proprietary ontology text. |
| Stable entity IDs and graph snapshot version | **ADOPTED** | High; IDs must coexist with version/merge/split history. |
| Origin URLs and per-origin crawl timestamps | **ADOPTED and extended** | High; add capture, passage, derivation, observed/valid time, and extractor version. |
| Live collection query during crawl | **ADAPTED** | High; responses need explicit incompleteness/frontier-watermark warnings. |
| Query rewrites and archive/fast-lane disclosure | **ADOPTED** | High; expose bounded reason classes and coverage effects. |
| Lookup versus optional refresh/search | **ADOPTED** | High; refresh/discovery need separate authority and budget. |
| Hosted Diffbot as owned search/KG core | **REJECTED** | High; provider controls crawl, corpus, extraction, fusion, ranking, retention, and terms. |
| GET mutations, query-string credentials, `size=-1` agent access | **REJECTED** | High; avoid unsafe semantics, leakage, and unbounded output. |
| Arbitrary agent-supplied render JavaScript/proxy/auth headers | **REJECTED** | High; excessive authority and data-exfiltration surface. |
| Live vendor benchmark | **DEFERRED** | High; needs approved fixtures, privacy/legal review, credits, and procurement authority. |

### 9.3 Provider-neutral Curiosity implications

**RECOMMENDATION (high):** keep three neutral contracts rather than one Diffbot
adapter-shaped API:

1. `CrawlJob` controls authorized corpus discovery and emits immutable capture
   and frontier events.
2. `ExtractDocument` transforms one authorized capture into versioned typed
   claims and evidence mappings; it never silently fetches or expands scope.
3. `EntityGraphQuery` searches a versioned graph and returns claim-level
   provenance; `RefreshEntity` is a separate privileged command.

Agent-facing search should receive bounded, inert evidence only. Rich DQL-like
expressiveness belongs behind a validated service, not in the researcher's
tool schema. Results remain `untrusted-external-evidence`; extracted text,
metadata, graph facts, and source pages cannot alter authority, trigger refresh,
request secrets, or approve follow-up actions.

## 10. Unknowns and checks required before any evaluation

### Material unknowns

- Actual Crawl queue ordering, fairness, host concurrency, retry/backoff,
  restart durability, and trap defenses.
- Network and browser sandbox controls, private-address blocking, redirect and
  byte limits, cookie isolation, and webhook authentication.
- Extraction accuracy by type/language/site, classifier calibration, rendered
  page fidelity, and stability across model changes.
- Exact mapping between an Extract object's `diffbotUri` and global KG entity
  lifecycle, including entity merges/splits/deletions.
- Field-level origin representation in real extended JSON, especially for
  inferred and conflicting facts; public docs describe it but no paid response
  was inspected.
- KG build cadence, recrawl priority, stale-fact retirement, historical version
  access, and deletion/suppression propagation SLO.
- Contractual rights for retaining/redistributing specific response fields and
  underlying source content under a contemplated use case.
- Enterprise security, residency, DPA, SLA, support, and custom price terms.

### Approved future checks (not executed)

If separately authorized, use only project-authored or explicitly permitted
fixtures and a capped free/paid sandbox:

1. characterize seed/domain/pattern precedence and robots `Allow` behavior;
2. compare static versus `&links` discovery, cost, and duplicate handling;
3. verify destructive-operation semantics, webhook authentication, and token
   redaction without putting secrets in logs;
4. freeze HTML fixtures and measure Extract schema stability, field precision,
   language behavior, classifier mistakes, and provenance reproducibility;
5. inspect extended KG JSON for per-field origins, timestamps, confidence,
   inference markings, and snapshot stability;
6. validate deletion/suppression, retention, and DPA obligations with privacy
   and legal owners.

## 11. Curiosity pass and stop decision

Scores are 1 (low) to 5 (high); cost is 1 (cheap) to 5 (expensive).

| Thread | Relevance | Value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Resolve provenance granularity and freshness semantics | 5 | 5 | 4 | 1 | **Pursued:** origin, originDetails, `crawlTimestamp`, `jsonmode=extended`, and Enhance refresh sources show useful provenance but no immutable passage evidence [S19, S20, S24, S28–S30]. |
| Check static-vs-rendered crawl contradiction | 5 | 5 | 4 | 1 | **Pursued:** Crawl is raw-HTML by default; `&links` makes every discovered page processed/charged and disables raw-source dedup [S4, S7]. |
| Verify current price/limits rather than legacy Crawl wording | 4 | 5 | 3 | 1 | **Pursued:** current pricing and rate pages establish Plus access, credits, active/total jobs, and current rates [S26, S27]. |
| Determine exact proprietary frontier/ranker/fusion algorithms | 1 | 2 | 3 | 5 | `CURIOSITY_NO_GO`: not needed for functional lessons and would cross clean-room/terms boundaries. |
| Run authenticated quality/cost benchmark | 4 | 5 | 4 | 5 | `CURIOSITY_NO_GO`: no credentials, paid-call authority, approved fixtures, or data-processing review. |
| Test robots override or access-controlled targets | 1 | 1 | 2 | 5 | `CURIOSITY_NO_GO`: bypass prohibited; no legitimate need. |
| Obtain enterprise DPA/SOC/residency/SLA materials | 3 | 4 | 2 | 4 | `CURIOSITY_NO_GO`: procurement/security-review authority absent; defer to a real vendor evaluation. |
| Jurisdiction-specific legality of crawling/indexing people | 5 | 5 | 4 | 5 | `CURIOSITY_NO_GO`: requires independent counsel and a declared corpus/use case. |

**Coverage:** crawl scope/frontier evidence, extraction/ontology, KG provenance
and freshness, contracts, rendering, safety/privacy/legal, limits/pricing,
architecture inferences, clean-room lessons, and Curiosity implications are all
represented. **Saturation:** additional product pages repeated the same
surfaces without changing the decision. **Stop:** coverage and saturation
reached; remaining material questions require caller authority, paid access, or
specialist review.

## 12. Primary bibliography

All sources accessed 2026-08-17. Diffbot documentation and legal pages are
first-party sources; they document offered behavior and vendor positions, not
independent performance validation.

1. **[S1] Diffbot, Crawl API overview.**
   https://www.diffbot.com/docs/crawl/ — Crawl/Extract/collection relationship,
   robots behavior, access tier, and inactive-job retention.
2. **[S2] Diffbot, Create a Crawl.**
   https://www.diffbot.com/docs/crawl/create — form contract, seeds, scope,
   limits, repeats, filters, callbacks, response schema, and errors.
3. **[S3] Diffbot, Crawl and Processing Patterns and Regexes.**
   https://www.diffbot.com/docs/crawl/patterns — separate crawl/process
   filters, regex precedence, raw-HTML processing patterns.
4. **[S4] Diffbot, JavaScript-generated links while crawling.**
   https://www.diffbot.com/docs/crawl/faq/javascript-links — static discovery,
   `&links` rendering, credit and dedup effects.
5. **[S5] Diffbot, recurring crawl scheduling.**
   https://www.diffbot.com/docs/crawl/faq/recurring-crawls — rounds and
   completion-relative scheduling.
6. **[S6] Diffbot, restricting crawls to domains/subdomains.**
   https://www.diffbot.com/docs/crawl/faq/restrict-to-domains — default scope
   and limited off-domain traversal.
7. **[S7] Diffbot, duplicate pages/content.**
   https://www.diffbot.com/docs/crawl/faq/duplicate-content — exact raw-source
   comparison, canonical handling, and JS-mode exception.
8. **[S8] Diffbot, Search Crawl Job Data.**
   https://www.diffbot.com/docs/crawl/search — collection DQL endpoint, shape,
   live querying, and no-credit statement.
9. **[S9] Diffbot, Manage a Crawl Job.**
   https://www.diffbot.com/docs/crawl/manage — GET controls, state codes,
   destructive restart/delete, and efficiency pause.
10. **[S10] Diffbot, Extract API overview.**
    https://docs.diffbot.com/reference/extract-introduction — rendering,
    Analyze, typed APIs, base credits, and authentication.
11. **[S11] Diffbot, Analyze API.**
    https://www.diffbot.com/docs/extract/analyze — classifier, fallback/mode,
    request/response, KG-linked tags, timeout, proxy, and raw-HTML support.
12. **[S12] Diffbot, Article API.**
    https://www.diffbot.com/docs/extract/article — Article schema, IDs, NLP,
    comments, pagination, language and API controls.
13. **[S13] Diffbot, Product API.**
    https://www.diffbot.com/docs/extract/product — Product schema, normalized
    commerce fields, reviews, and API controls.
14. **[S14] Diffbot, Knowledge Graph overview.**
    https://www.diffbot.com/products/knowledge-graph — entity/fusion model,
    origin example, scale claim, DQL and Enhance surfaces.
15. **[S15] Diffbot, Extract optional fields.**
    https://www.diffbot.com/docs/extract/optional-fields — links, metadata,
    rendered text, content, and DOM.
16. **[S16] Diffbot, Custom JavaScript.**
    https://www.diffbot.com/docs/extract/custom-javascript — pre-extraction
    script execution, saved fields, timeout behavior, and console debugging.
17. **[S17] Diffbot, Retrieve Crawl Job Data.**
    https://www.diffbot.com/docs/crawl/retrieve — download contract, URL report,
    parent URL, timestamp, and record schema.
18. **[S18] Diffbot, URL Report.**
    https://www.diffbot.com/docs/crawl/faq/url-report — per-URL provenance and
    operational diagnostic columns.
19. **[S19] Diffbot, DQL GET API.**
    https://www.diffbot.com/docs/dql/get — DQL parameters, extended origins,
    output formats, clustering, snapshot and error response.
20. **[S20] Diffbot, Enhance GET API.**
    https://www.diffbot.com/docs/enhance/get — matching, thresholds, refresh,
    web search, extended origins, and response contract.
21. **[S21] Diffbot, Enhance overview.**
    https://www.diffbot.com/docs/enhance/ — entity enrichment surfaces and
    returned match score.
22. **[S22] Diffbot, Best Practices for Querying Articles.**
    https://www.diffbot.com/docs/dql/article-backends — six-month fast index,
    archive behavior, rewrites, and date limitations.
23. **[S23] Diffbot, Ontology overview.**
    https://www.diffbot.com/docs/ontology/ — ontology purpose, types, and
    machine-readable source.
24. **[S24] Diffbot, All Entities ontology.**
    https://www.diffbot.com/docs/ontology/all-entities — common IDs, origins,
    origin details, crawl timestamp, edges, and noncanonical fields.
25. **[S25] Diffbot, Crawl duration.**
    https://www.diffbot.com/docs/crawl/faq/crawl-duration — performance factors,
    crawler capacity, robots delay, and live output availability.
26. **[S26] Diffbot, Rate Limits.**
    https://www.diffbot.com/docs/rate-limits — plan call rates and job ceilings.
27. **[S27] Diffbot, Plans & Pricing.**
    https://www.diffbot.com/pricing — point-in-time plan prices, credits,
    overage, crawling access, and action costs.
28. **[S28] Diffbot, Origin concept.**
    https://www.diffbot.com/docs/dql/concepts/origin — source and inferred-fact
    origin definition.
29. **[S29] Diffbot, crawlTimestamp concept.**
    https://www.diffbot.com/docs/dql/concepts/crawl-timestamp — origin and
    entity timestamp semantics.
30. **[S30] Diffbot, Confidence Score concept.**
    https://www.diffbot.com/docs/dql/concepts/confidence-score — internal fact
    confidence, partial exposure, and 0.5 discard statement.
31. **[S31] Diffbot, Knowledge Graph Sources.**
    https://www.diffbot.com/docs/dql/concepts/sources — named structured data
    sources and licenses, including Wikidata and geographic sources.
32. **[S32] Diffbot, Privacy Policy (updated 2025-08-29).**
    https://www.diffbot.com/company/privacy — Subscriber/Search Subject data,
    crawling, profiling, logs, sharing, transfers, security and rights.
33. **[S33] Diffbot, Terms of Use.**
    https://www.diffbot.com/company/terms — service license, restrictions,
    commercial fact use, IP, user-data processing license, and disclaimers.
34. **[S34] Diffbot, GDPR/EU Data Laws.**
    https://www.diffbot.com/docs/account-billing/gdpr — vendor compliance
    position, DPA, deletion, suppression, access, portability, rectification.
35. **[S35] Diffbot, Coverage Reports.**
    https://www.diffbot.com/docs/dql/coverage-reports — field-coverage report
    generation and 24-hour report retention.

### Negative source results retained

- No independent, reproducible evidence was found or generated for Diffbot's
  extraction accuracy, crawl completeness, graph accuracy, or freshness.
- No public guarantee was found that customer Crawl collections update the
  global KG.
- No immutable capture/passage-level provenance or historical KG replay
  contract was found in the reviewed documentation.
- No public description was found for frontier ordering, adaptive recrawl,
  browser/egress isolation, webhook signatures, or private-network defenses.
- No current global KG refresh SLA or deletion propagation SLA was found.
- No license was found that makes Diffbot's proprietary service, ontology text,
  DQL, or documentation project-owned or freely cloneable.
- No paid plan, authenticated dashboard, enterprise contract, or live output
  was inspected; undocumented behavior remains unknown.
