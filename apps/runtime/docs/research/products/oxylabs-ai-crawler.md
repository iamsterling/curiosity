# Oxylabs AI-Crawler: clean-room reverse-engineering dossier

**Research and source-access date:** 2026-08-17  
**Decision:** which observable AI-Crawler ideas Curiosity should adopt, adapt,
reject, or defer without depending on Oxylabs' proprietary implementation.  
**Status:** research only—not implementation, procurement approval, a quality
benchmark, legal advice, or authority to crawl a target.  
**Access boundary:** public first-party documentation, pricing/legal pages, and
the official MIT-licensed Python and JavaScript SDKs at pinned public revisions.
No account, credential, free or paid API call, target crawl, bypass test,
vulnerability probe, private material, package execution, or service code was
used.

## Executive verdict

**DEFER AI-Crawler as a provider and REJECT it as Curiosity's crawl foundation;
ADAPT only its job, budget, and source-linked extraction concepts (high
confidence).** The public boundary is a prompt-guided, asynchronous, within-site
discovery-and-extraction job. A caller supplies a seed URL and natural-language
goal, optionally requests JavaScript rendering and geolocation, chooses Markdown
or schema-shaped output, and caps returned sources (default 25). Official SDKs
show `POST /crawl/run`, a returned `run_id`, and polling
`GET /crawl/run/data?run_id=...` until `completed` or `failed` [S1-S4].

That compact contract is not a crawler-control contract. It publishes no depth,
path, origin/subdomain/external-domain, discovered-link, fetched-page, byte,
redirect, or wall-clock service bound. `return_sources_limit` limits what is
returned, not demonstrably what is discovered, fetched, rendered, processed, or
billed. Natural-language relevance controls selection but is neither a security
scope nor a completeness guarantee. The public sources also do not establish
robots behavior, publisher identification, origin politeness, sitemap use,
frontier order, canonicalization, duplicate suppression, target-fetch retries,
cache/freshness semantics, partial-page failures, or cancellation [S1-S4].

**The evidence boundary is especially thin (high confidence).** JSON examples
link each extracted `data` object to `src`, and the run has an operational ID,
but there is no guaranteed fetch timestamp, HTTP status/headers, redirect chain,
parent edge/depth, robots decision, raw capture/hash, cache status, renderer or
model version, extraction spans, per-page attempt record, truncation marker, or
per-item error. A source URL plus AI-generated text/JSON is useful retrieval
output, not a reproducible capture or chain of custody [S1-S4][S9].

Oxylabs represents AI Studio as handling JavaScript, IP blocks, CAPTCHAs, and
dynamic content. These are delivery claims, not crawler-policy or provenance
claims. Its terms identify OpenAI and Google as third-party AI providers and say
they may access prompts and results according to their terms. The DPA gives a
90-day maximum for personal data submitted in prompts/inputs/interactions and
states EEA processing by Oxylabs, while permitting protected transfers to
subprocessors; the current subprocessor list is available only on request
[S5-S9]. Production use therefore needs technical, legal, privacy, and
procurement answers that the public contract does not supply.

## 1. Decision frame and method

### 1.1 Bounded questions

1. What request, job, status, polling, and result contract is publicly
   observable?
2. What hard scope and frontier controls exist, and what does the source limit
   actually bound?
3. What evidence exists for robots, origin politeness, rendering, unblocking,
   retries, canonicalization, deduplication, and extraction?
4. Can returned data support freshness and provenance claims?
5. What rate, credit, timeout, privacy, security, contractual, and licensing
   constraints matter?
6. What minimal architecture can be inferred without claiming proprietary
   algorithms or service topology?
7. Which patterns transfer clean-room to Curiosity?

### 1.2 Evidence and confidence rules

- **FACT** — directly stated or observable in a cited first-party source.
- **INFERENCE** — the narrowest explanation consistent with those facts; not a
  claim about undisclosed internals.
- **UNKNOWN / NEGATIVE RESULT** — material behavior not established after the
  bounded primary-source review.
- **RECOMMENDATION** — a Curiosity design or governance choice, not an Oxylabs
  claim.
- Confidence is **high**, **medium**, or **low**.

Official documentation and SDKs establish published interfaces, not actual
service quality, complete server behavior, legal permission to crawl, or
certification scope. Marketing claims are attributed, not independently
validated. SDK behavior is kept distinct from server-side crawler behavior.

The official Python SDK was inspected at version **0.2.22**, commit
`bf5649da8797fa58e6655a656b2eec3dd77f4df7`; the JavaScript SDK at version
**1.0.29**, commit `d64f3cef7439e51c1a28a93514ead053b0b550da` [S3][S4].
Both repositories declare MIT for their client code. That license does not cover
the hosted service, documentation, prompts, results, or proprietary internals.

### 1.3 Product boundary

This dossier covers **AI-Crawler only**. General AI Studio pages are used only
where they govern AI-Crawler pricing, data processing, security, or legal use.
No behavior from Web Scraper API, Web Unblocker, Headless Browser, or AI-Map is
imputed to AI-Crawler. In particular, controls documented for another Oxylabs
product are not evidence that AI-Crawler implements them.

## 2. Observable crawl contract

### 2.1 Request surface

| Field | Public meaning | Default / requirement | Boundary assessment |
| --- | --- | --- | --- |
| `url` | Starting URL to crawl | Required | No published scheme, port, URL-length, redirect, private-network, or normalized-origin contract. |
| `user_prompt` | Natural-language guidance for finding/extracting relevant content | Required in docs and sync Python method | A soft semantic objective, not hard authority, scope, or completeness. |
| `output_format` | Docs: `markdown` or `json`; official SDKs also expose `csv` and `toon` | `markdown` | SDK support is a first-party client surface but less stable than the narrower product page. |
| `schema` / wire `openapi_schema` | Structured extraction schema; mandatory for JSON in docs and for JSON/CSV/Toon in SDKs | Conditional | Called “OpenAPI schema,” while examples are JSON-Schema-like objects; accepted dialect/limits are unspecified. |
| `render_javascript` | Render JavaScript before extraction | `false` | Boolean route only; browser/version, wait condition, resource policy, state, and budget are undisclosed. |
| `return_sources_limit` | Maximum pages/sources to return | `25` | No documented maximum; does not state a discovery/fetch/work cap. |
| `geo_location` | Proxy location, documented as ISO2; SDK docs also allow country canonical name | Optional | Acquisition context, not truth or publication locale. |
| `max_credits` | SDK-exposed cap on credits for the run | Optional | Valuable hard-spend intent; absent from the product parameter table and with no documented exhaustion/result semantics. |

**FACT (high):** AI-Crawler begins from a supplied URL, uses a prompt to identify
and prioritize relevant pages, and returns Markdown or structured results. The
product page says the tool crawls a “given domain” and “explores the site”; the
quick start uses looser language—“all related pages” and “hundreds of related
pages” [S1][S10].

**UNKNOWN (high confidence that the contract is absent):** whether “domain”
means exact origin, host, registrable domain, or seed-path descendants; whether
subdomains or external links/redirects are followed; whether the seed must be a
page versus a domain root; and whether URL credentials, unusual ports, fragments,
queries, IDNs, and non-public destinations are rejected.

**RECOMMENDATION (high):** Curiosity must express authority as parsed,
deterministic scope—allowed scheme/port/public IP, exact origins, path rules,
redirect rules, and separate discover/fetch/return permissions. A prompt may
rank an authorized frontier; it may never widen it.

### 2.2 Async run lifecycle

The product page shows only a high-level SDK call. The official clients expose
the underlying lifecycle [S3][S4]:

```text
POST /crawl/run
  body: url, user_prompt, output_format, openapi_schema?,
        render_javascript, return_sources_limit, geo_location?, max_credits?
  -> HTTP 200 with run_id

GET /crawl/run/data?run_id=<id>
  -> HTTP 202 while unavailable/processing in the Python client
  -> HTTP 200 body with status: processing | completed | failed
  -> completed data: list[object] | list[string]
```

**FACT (high):** Python polls every five seconds for at most ten minutes. On
completion it maps `run_id`, `error_code` into a generic `message`, and `data`;
on `failed` it returns `data=None`. The JavaScript helper polls every five
seconds with a default 120-second local deadline and returns the untyped response
when status is `completed` [S3][S4].

**INFERENCE (high):** AI-Crawler is operationally asynchronous even when an SDK
presents a blocking `crawl()` convenience method. SDK timeout is not proof of
server cancellation. The run may continue after the caller stops polling.

**UNKNOWN:** job retention, authorization scope of a `run_id`, cancellation,
deletion, pagination, callback/webhook, resumption, queue priority, server
deadline, terminal `cancelled`/`partial`/`budget_exhausted` states, and whether a
failed run can contain partial data.

**RECOMMENDATION (high):** adapt the run ID and explicit lifecycle, but require
Curiosity-owned idempotency, cancellation, deadline, retention, and terminal
partial/budget states. Polling must be bounded and may not be confused with
ownership of the provider job.

### 2.3 Result contract

**FACT (high):** the documented JSON example is a top-level list of records,
each shaped `{ "data": <schema-shaped object>, "src": <page URL> }`. Markdown
is described but its exact per-source wire shape is not documented. The Python
model admits either `list[dict]` or `list[str]` [S1][S3].

**FACT (medium-high):** official SDKs expose CSV and Toon in addition to the
product page's JSON/Markdown. This is a documentation-layer mismatch, not proof
that every format is production-stable or identical in both dashboard and API
[S1][S3][S4].

**UNKNOWN:** ordering, duplicate `src` values, output cardinality relative to
`return_sources_limit`, null/missing handling, schema-validation strictness,
additional properties, truncation, maximum record/result bytes, Markdown source
linkage, CSV/Toon schema fidelity, and whether one bad extraction fails a run or
is silently omitted.

**RECOMMENDATION (high):** preserve the useful result-to-source association, but
validate all structured output against a locally pinned schema and retain the
raw provider response separately. A URL citation does not prove that each field
appeared on that page.

## 3. Scope, frontier, and completeness

### 3.1 What is evidenced

- **FACT (high):** a seed URL starts the crawl [S1-S4].
- **FACT (high):** AI-assisted URL selection identifies and prioritizes pages
  aligned with the prompt [S1][S2].
- **FACT (high):** the caller caps returned sources, default 25 [S1-S4].
- **FACT (medium):** quick-start prose says AI-Crawler can find and scrape
  “hundreds” of related pages, but gives no normative bound or completeness
  condition [S10].

### 3.2 Material negative results

No inspected AI-Crawler source publishes:

- maximum crawl depth, breadth, queued/discovered URLs, fetched pages, or
  outlinks per page;
- path include/exclude rules, same-origin/subdomain/external-domain controls, or
  redirect scope;
- sitemap discovery/use, seed depth convention, frontier traversal order,
  fairness, priority score, or deterministic tie-breaking;
- a distinction among discovered, selected, attempted, fetched, rendered,
  extracted, returned, and billed pages;
- trap detection for calendars, faceted navigation, sessions, query explosion,
  infinite scroll, or cyclic redirects;
- wall-clock, response-byte, decompression, media-type, render-resource, or
  output-byte service bounds;
- completeness, snapshot consistency, stable ordering, or reproducibility
  guarantees.

**INFERENCE (medium-high):** identifying pages beyond a seed requires some
logical discovery frontier and visited-state mechanism. Public evidence does not
justify claims about breadth-first/depth-first order, storage structures,
parallelism, or the identity key used for “visited.”

**INFERENCE (high):** `return_sources_limit` is a projection bound. Its name and
description constrain returned sources only. Treating it as a maximum-work or
maximum-cost bound would be unsafe absent a written provider guarantee.

**RECOMMENDATION (high):** Curiosity's crawl budget must separately cap
discovered URLs, queue size, fetch attempts, successful captures, bytes,
redirects, render pages/time/subresources, extraction bytes, deadline,
per-origin concurrency/delay, returned records, and cost. Record why every URL
entered, left, or remained in the frontier.

## 4. Robots, publisher control, and politeness

### 4.1 Evidence assessment

**NEGATIVE RESULT (high confidence):** neither the AI-Crawler page, AI Studio
FAQ, official crawler SDKs, AI Studio pricing, nor the reviewed public legal
documents promise that AI-Crawler fetches or enforces `robots.txt`, identifies a
crawler user agent, respects robots meta directives, follows sitemap directives,
or implements publisher opt-out [S1-S9].

The AUP requires customers to comply with target terms/legal documents and to
collect public data absent permission. That allocates legal responsibility; it
is not evidence of technical robots enforcement [S7]. Likewise, a plan-level
request-per-second limit controls caller-to-Oxylabs submissions, not
Oxylabs-to-origin request cadence [S5].

**UNKNOWN:** robots user-agent token; RFC 9309 matching; robots cache/revalidation;
unavailable/5xx/timeout policy; redirect re-evaluation; `Crawl-delay`; per-origin
concurrency; delays; target `Retry-After`; 429/503 backoff; traffic windows;
cross-customer host fairness; and takedown/opt-out effects on on-demand runs.

**RECOMMENDATION (high):** absence of evidence must fail closed for a Curiosity
integration. Curiosity should evaluate publisher policy before dispatch, retain
the robots retrieval timestamp/body hash/status, selected user-agent and matched
rule, re-check every redirect, and enforce a shared per-origin scheduler with
adaptive backoff. Provider reachability never grants permission.

## 5. Rendering and unblocking

### 5.1 Crawler-specific facts

**FACT (high):** `render_javascript` defaults to false and can be enabled for
dynamic pages. Geolocation selects proxy location. AI Studio pricing describes
one credit for non-JS scrape and four for JS scrape [S1-S5].

**FACT (medium):** Oxylabs represents AI Studio generally—not AI-Crawler's
normative per-page protocol—as bypassing IP blocks, solving CAPTCHAs, handling
dynamic content, and including advanced anti-blocking in every paid plan [S5].

**UNKNOWN:** whether every crawler fetch uses an Oxylabs proxy; exit class and
rotation/session policy; header/cookie/fingerprint policy; browser engine and
version; JavaScript wait/readiness condition; blocked resources; locale/device;
cookie/storage isolation; CAPTCHA attempt policy; origin status considered
successful; redirect limit; automatic fallback from static to browser; and
whether anti-block retries alter page identity or freshness.

**INFERENCE (medium-high):** the boolean render switch and distinct credit rates
support at least two logical acquisition lanes—non-JS and JS-rendered. They do
not prove implementation topology or that non-JS never uses a browser.

**RECOMMENDATION (high):** keep static acquisition and isolated rendering as
separate, auditable lanes. Rendering requires lower budgets, disposable state,
public-web-only egress, redirect/subresource checks, no ambient credentials, and
recorded engine/options. Do not reproduce anti-bot evasion or treat it as a
Curiosity policy responsibility.

## 6. Retries, errors, cancellation, and deduplication

### 6.1 Three retry layers must be separated

1. **Origin-fetch retries:** **UNKNOWN.** No source defines status classes,
   transport failures, attempt count, backoff, jitter, proxy changes, or whether
   retries are billed/returned [S1-S5].
2. **Polling retries:** **FACT (high).** Python repeats polling every five
   seconds after HTTP 202, non-200 responses, and caught exceptions until its
   ten-minute local budget is exhausted [S3].
3. **SDK HTTP retries:** **FACT (high).** Python retries HTTP 429 and 5xx up to
   five attempts with exponential waits capped at eight seconds, for both GET
   and POST. JavaScript defaults to three attempts and retries all thrown request
   errors with 1/2-second waits, also for both GET and POST [S3][S4].

**INFERENCE (high):** because SDK retry wrappers include `POST /crawl/run` and
no idempotency key is exposed, an ambiguous network/server failure can create
duplicate runs if the first submission succeeded but its response was lost.
Public sources do not promise provider deduplication. This is a client-side risk,
not proof that duplicates occur.

**FACT (high):** interrupting/timing out the SDK helper stops local waiting; no
server cancellation call is made. Python's “cancelled by user” log message on
`KeyboardInterrupt` therefore does not establish remote cancellation [S3].

### 6.2 URL and content deduplication

**NEGATIVE RESULT (high confidence):** no reviewed source specifies URL
normalization, fragment removal, query ordering, tracking-parameter stripping,
redirect aliases, `rel=canonical`, exact-content hashing, near-duplicate
clustering, duplicate suppression, or charging of duplicates [S1-S4].

**INFERENCE (medium):** finite traversal probably uses a visited identity, but
its key and lifetime are unknown and cannot be described as canonicalization.

**RECOMMENDATION (high):** Curiosity must retain submitted, normalized, and
final URL separately; preserve redirect and discovery edges; treat publisher
canonical as evidence rather than authority; and assign immutable capture hashes
plus exact/near-duplicate cluster IDs. Retry and duplicate suppression may reduce
work but must never erase attempt provenance.

## 7. Extraction and output trust

**FACT (high):** one prompt guides relevant-page identification and extraction.
For structured output the caller supplies a schema or separately asks
AI-Crawler to generate one from a natural-language prompt [S1-S4].

**FACT (high):** pricing separates scraping work, output work, prompt processing,
and schema generation. The Crawl column lists: one credit for a non-JS scrape,
four for a JS scrape, Markdown output free, parsed JSON four credits, prompt
processing ten credits, and schema generation one credit [S5].

**FACT (high):** AI Studio terms identify OpenAI ChatGPT and Google Gemini as
incorporated third-party AI. They warn that results may be inaccurate,
unavailable, non-unique, non-original, unsuitable, and potentially subject to
third-party rights [S6].

**UNKNOWN:** which model performs URL relevance, extraction, or schema
generation; model/prompt version; whether extraction is per page or across
pages; temperature/determinism; HTML-to-Markdown algorithm; main-content
selection; prompt-injection defenses; structured-output validation/retries;
source-span grounding; and how conflicting pages are handled.

**INFERENCE (medium):** separate pricing units imply logical acquisition,
semantic-prompt, schema-generation, and format/extraction work, but not their
order, service topology, or exact per-run versus per-source charging boundary.

**RECOMMENDATION (high):** treat Markdown, JSON, CSV, and Toon as derived,
untrusted external data. Validate shape and size, sanitize active content, never
execute instructions found in pages, and require source-span anchors or mark
fields `derived_unverified`. Keep source capture and extraction as distinct
artifacts.

## 8. Freshness and provenance

### 8.1 What the boundary provides

- an operational `run_id` [S3][S4];
- a terminal run status and generic error code/message [S3][S4];
- schema-shaped `data` associated with `src` in the JSON example [S1];
- caller-requested render and geo settings at submission time [S1-S4].

### 8.2 What it does not establish

**NEGATIVE RESULT (high confidence):** the public result contract does not
guarantee:

- requested/final URL, redirect chain, discovery parent, depth, or selection
  score/reason;
- request, fetch, render, extraction, or received timestamps;
- origin status, headers, validators, MIME type, byte count, IP/ASN, or locale;
- cache hit/miss, cached-at/age, origin contact, forced refresh, revalidation, or
  stale-on-error behavior;
- raw HTML/response bytes, screenshot, immutable capture ID, or content hash;
- robots/policy verdict, origin delay, retry attempts, or fetch error;
- proxy/browser/extractor/model/prompt version and options digest;
- canonical/duplicate identity, passage offsets/hashes, schema-validation
  result, or per-page credit;
- frontier totals, omissions, truncation, or completeness.

**INFERENCE (high):** `run_id` identifies provider work, not an immutable source
observation. `src` is useful attribution but cannot establish that returned
fields were observed at a particular time or extracted faithfully.

**RECOMMENDATION (high):** mark provider freshness `unknown` unless a future
contract supplies cache/origin evidence. At receipt, Curiosity can add its own
request/received times, provider and adapter version, exact options digest,
response hash, run ID, requested geo/render, and local policy decision—but it
must not invent missing origin metadata. Hosted crawler output cannot substitute
for a Curiosity-owned capture ledger.

## 9. Limits, pricing, and billing uncertainty

### 9.1 Published plan snapshot

**FACT (high, time-sensitive):** on 2026-08-17 AI Studio listed Starter at
$12/month for 3,000 credits and 1 request/s; Lite at $62 for 100,000 and 5/s;
Standard at $250 for 500,000 and 10/s; and Custom from $1,200 for 1.35 million+
and 25/s. Credits reset monthly and do not roll over; access pauses when credits
are exhausted. VAT may apply [S5].

**FACT (high):** system-error failures are not billed, but a request can be
billed when the prompted data does not exist on the page. The terms say dashboard
usage records prevail over customer records and may not support a claim; they
also reserve possible charges beyond allocated credits, in tension with pricing
FAQ language that access pauses at exhaustion [S5][S6].

**CONTRADICTION:** product docs/FAQ advertise a 1,000-credit free trial, while
the AI Studio quick start says 10,000 free credits. The pricing page inspected
does not resolve the amount [S1][S2][S10]. Verify in the current order flow; do
not budget from either statement.

**CONTRADICTION:** plan rates range from 1 to 25 requests/s, while AI Studio
terms state customer usage is limited to five connections/s. The likely reading
is plan-specific rates within a contractual ceiling/default, but the documents
do not reconcile Standard/Custom rates [S5][S6].

### 9.2 Missing operational/economic limits

No public AI-Crawler contract gives a maximum for `return_sources_limit`, seed
URL or prompt length, schema size/complexity, result bytes, fetched page bytes,
depth, links, duration, queue time, concurrent runs, retained jobs, or renders.
The Python ten-minute and JavaScript two-minute waits are SDK-local defaults, not
service SLAs [S1-S4].

The credit table does not unambiguously state whether scrape/output/prompt units
apply per attempted, successful, selected, or returned source; how retries,
duplicates, cache hits, or partial runs charge; or how `max_credits` terminates a
run and reports partial output [S3-S5].

**RECOMMENDATION (high):** never infer worst-case spend from
`return_sources_limit`. Require written billing semantics and use a conservative
local authorization budget. `max_credits` is worth adapting as defense in depth,
not replacing page/byte/render/time caps or billing reconciliation.

## 10. Privacy, security, and legal boundary

### 10.1 Data processing and third-party AI

**FACT (high):** the AI Studio privacy policy excludes personal data processed
on behalf of customers; that processing is governed by the terms and DPA, with
Oxylabs as processor and customer as controller [S8][S9].

**FACT (high):** the DPA states that Oxylabs processes customer personal data in
the EEA; transfers to subprocessors in non-adequate third countries require SCCs
or another Chapter V safeguard. The current subprocessor list is supplied on
request, changes receive seven business days' notice, and customers can object
on reasonable protection grounds [S9].

**FACT (high):** personal data submitted as prompts, inputs, or other service
interactions has a maximum 90-day retention under the DPA, subject to legal or
legitimate-purpose exceptions with isolation from further processing. The DPA
permits maintaining, optimizing, and improving the service and does not restrict
non-personal or anonymized data [S9].

**FACT (high):** terms say OpenAI and Google providers may access prompts and
results under their own terms; Oxylabs disclaims how those providers access/use
them. This means the EEA-processing statement is not a no-transfer/no-third-party
processing promise [S6][S9].

**UNKNOWN:** the actual subprocessor/model/region matrix for each Crawler stage;
retention for non-personal target URLs/content, operational logs, backups and
run results; deletion latency; whether content is used for model/provider
training; tenant cache isolation; and whether 90 days covers scraped result
personal data not “submitted” by the customer.

**RECOMMENDATION (high):** do not send confidential prompts, authenticated URLs,
private hosts, personal/sensitive data, or source credentials. Before any pilot,
obtain the subprocessor list, transfer assessment, model data-use terms,
retention/deletion matrix, incident terms, and a contractual no-training/no-
improvement rule where required.

### 10.2 API and egress security

**FACT (high):** official SDKs authenticate to
`https://api-aistudio.oxylabs.io` with an `x-api-key` header over HTTPS [S3][S4].

**FACT (high):** JavaScript SDK debug mode logs request headers (including the
API key), payloads, and responses to the console. It should not be enabled where
logs are retained or shared [S4]. Python logs seed URLs and run IDs at info level
[S3].

**NEGATIVE RESULT:** “publicly accessible” and “private networks are not
accessible out of the box” are product statements, not a normative SSRF
contract. No inspected source specifies schemes, ports, DNS resolution/rebinding,
private/link-local/metadata IP denial, redirect re-checking, URL credentials, or
renderer subresource egress [S1][S2].

**RECOMMENDATION (high):** never expose seed URL or prompt directly to an agent-
controlled privileged adapter. Parse and resolve URLs locally; deny non-HTTP(S),
credentials, unapproved ports, loopback/private/link-local/multicast/metadata
destinations; re-check DNS and redirects; strip secrets; rate- and size-bound
responses; and label all content as untrusted. Redact API keys, prompts, URLs,
schemas, and results from logs.

### 10.3 Security assurance

Oxylabs' public compliance page explicitly attributes SOC 2 Type 2 to **Web
Scraper API and Web Unblocker**, not AI Studio. It makes broader ISO claims for
main product areas, while page footers identify proxy solutions and scraper
APIs. **UNKNOWN:** whether AI-Crawler is in either audit/certification scope.
The DPA lists technical and organizational measures, but a list is not an
independent audit report [S9][S11].

### 10.4 Legal and contractual constraints

**FACT (high):** the AUP requires compliance with applicable laws and target
terms/legal documents, public data absent permission, and excludes sensitive
health/children's data. It prohibits authentication/security circumvention,
security breaches, infringement, ticket-buying bots, invalid ad traffic, and
other abuses [S7].

**FACT (high):** terms place responsibility for prompts, results, target data,
privacy, intellectual property, and third-party AI terms on the customer; make
no accuracy/non-infringement warranty; limit ordinary liability; prohibit
competitive monitoring/use and service reverse engineering; and apply Lithuanian
law and courts [S6].

**RECOMMENDATION (high):** require counsel review for target terms, copyright/
database rights, personal data, retention/display/indexing, takedown, and
jurisdiction. Robots permission, technical accessibility, “public” status, and
legal authority are different questions.

### 10.5 Clean-room and license boundary

This report uses public documentation and observable client interfaces for
interoperability research. It does not copy SDK code, service output, proprietary
prompts, or service internals. The Python and JavaScript SDK code is MIT-licensed
at the pinned revisions [S3][S4]; the hosted service and its ideas, features,
documentation, and output are governed separately, including contractual
reverse-engineering restrictions [S6]. Any future adapter should be independently
authored against an approved provider-neutral contract, not derived from service
internals.

## 11. Minimal architecture inference

The strongest clean-room decomposition supported by the public boundary is:

```text
x-api-key authenticated request
  -> input/account/rate/credit validation
  -> durable run record and asynchronous execution
  -> seed-based URL discovery frontier + visited state
  -> prompt-guided relevance/selection
  -> acquisition route
       -> requested geo/proxy context
       -> non-JS or JS-rendered fetch
       -> undisclosed access/unblocking behavior
  -> Markdown transformation or schema-guided extraction
       -> third-party AI may process prompts/results
  -> source-linked result projection, capped by return_sources_limit
  -> polling status/result store
```

| Inference | Confidence | Basis and bound |
| --- | --- | --- |
| Durable asynchronous run coordinator | High | `run_id`, create then poll, processing/completed/failed. Storage technology and retention unknown. |
| Logical frontier and visited state | Medium-high | Seed-based multi-page exploration requires them in practical terms. Order, identity, and data structure unknown. |
| Semantic selector/prioritizer | High | Product explicitly says prompt-guided URL identification/prioritization. Model and stage location unknown. |
| Separate static/rendered acquisition routes | Medium-high | Boolean render control and different credit rates. Engine/topology unknown. |
| Acquisition, prompt, schema, and output accounting stages | Medium | Separate credit categories. Unit granularity and deployment unknown. |
| Third-party AI stage | High | Terms name OpenAI and Google. Which stage/model sees which data is unknown. |
| Source-linked projection after extraction | High | JSON sample and returned-source cap. Internal aggregation behavior unknown. |
| Robots/politeness subsystem | Low/unknown | No AI-Crawler-specific public evidence. |
| Canonicalization/content-dedup service | Low/unknown | No public contract evidence. |
| Origin retry/unblocking classifier | Low/unknown | General delivery claims only; no Crawler retry protocol. |

No stronger claim about queues, databases, models, proxies, browsers, algorithms,
or deployment is justified.

## 12. Curiosity implications and verdict ledger

### 12.1 Adopted/adapted/rejected/deferred decisions

| Pattern / proposition | Verdict | Confidence | Curiosity disposition |
| --- | --- | --- | --- |
| Stable run ID plus processing/completed/failed lifecycle | **ADOPTED concept** | High | Add idempotency, cancellation, partial/budget states, deadline, and retention. |
| Source URL attached to each structured record | **ADOPTED / strengthened** | High | Preserve it, but require capture/span lineage and never equate URL with proof. |
| Returned-source limit | **ADAPTED** | High | Keep a result cap, plus independent discovery/fetch/byte/render/time/cost caps. |
| `max_credits` run budget | **ADAPTED** | Medium-high | Useful adapter circuit breaker after semantics are documented; local budget remains authoritative. |
| Static versus JS-rendered selection | **ADAPTED** | High | Static first; isolated render lane only under explicit policy and tighter budgets. |
| Prompt-guided URL prioritization | **ADAPTED** | High | Soft ranking inside a deterministic authorized frontier; never scope or permission. |
| Generated schema and schema-shaped output | **ADAPTED** | High | Pin/validate schema; generated schema is a reviewed derived artifact, not authority. |
| Provider Markdown/JSON as evidence | **REJECTED** | High | Missing capture, policy, freshness, attempt, and transformation provenance. |
| `return_sources_limit` as crawl/cost bound | **REJECTED** | High | It only promises a return cap. |
| Opaque anti-blocking as policy | **REJECTED** | High | Reachability does not establish permission, truth, or provenance. |
| Automatic POST retries without idempotency | **REJECTED** | High | Duplicate-run and cost risk after ambiguous completion. |
| Agent-supplied arbitrary URL/prompt/schema | **REJECTED** | High | SSRF, prompt injection, secret disclosure, output-size, and spend risks. |
| AI-Crawler as Curiosity crawl core | **REJECTED** | High | No owned frontier, deterministic scope, robots/politeness, or evidence ledger. |
| AI-Crawler as optional hosted adapter | **DEFERRED** | High | Requires written contract answers, legal/security review, and authorized controlled evaluation. |
| Official SDK dependency | **DEFERRED / unnecessary** | High | MIT permits reuse with notice, but thin HTTP integration is preferable only after adapter approval; SDK retry/logging defaults need hardening. |

### 12.2 Provider-neutral crawl contract lesson

**RECOMMENDATION (high):** a Curiosity crawl request should minimally contain:

- immutable task authority, purpose, seed, normalized allowed origins/paths,
  and distinct discover/fetch/return scope;
- robots/publisher-policy mode and policy snapshot;
- deterministic frontier policy plus optional semantic priority signal;
- depth, outlink, discovered, queue, attempt, success, byte, redirect, render,
  deadline, per-origin concurrency/delay, result, and cost budgets;
- static/render escalation policy, locale/geo, MIME allowlist, and extraction
  schema/version;
- idempotency key, cancellation authority, retention class, and no-secret rule.

Every run should report complete/partial/timed-out/cancelled/budget-exhausted
status and unprocessed-frontier counts. Every page needs discovery edge/depth,
requested/normalized/final/canonical URLs, policy decision, attempts and errors,
HTTP metadata, capture time/hash/reference, cache/freshness status, renderer and
extractor versions, duplicate identity, derived artifact hashes, warnings, and
anchored passages. All provider results remain untrusted external data.

### 12.3 Evaluation implications

No benchmark was run. A separately authorized evaluation on owned public
fixtures should measure scope leakage, robots behavior, origin cadence,
redirect/SSRF handling, trap resistance, frontier determinism, duplicate rate,
partial-failure visibility, static/render fidelity, citation grounding,
freshness/cache evidence, timeout/cancellation, p50/p95 completion, and credits
per useful unique capture—not merely returned-source count.

## 13. Fact / inference / recommendation ledger

| ID | Type | Claim | Confidence | Origin / check |
| --- | --- | --- | --- | --- |
| F1 | FACT | Seed URL and prompt are the required documented crawl inputs. | High | S1-S4. |
| F2 | FACT | Markdown defaults; JSON requires a schema; SDKs additionally expose CSV/Toon. | High | Compare S1 with S3/S4. |
| F3 | FACT | Returned sources default to 25; no public maximum is stated. | High | S1-S4. |
| F4 | FACT | SDKs expose create-run then polling by `run_id`. | High | S3/S4 pinned files. |
| F5 | FACT | Python recognizes processing/completed/failed and HTTP 202 while polling. | High | S3 `ai_crawler.py`. |
| F6 | FACT | Python/JS local polling deadlines differ and do not call cancellation. | High | S3/S4. |
| F7 | FACT | Python retries 429/5xx; JS retries all request errors; both include POST. | High | S3/S4 clients. |
| F8 | FACT | JSON sample associates schema-shaped `data` with `src`. | High | S1. |
| F9 | FACT | JS rendering is optional/default false; geo selects proxy location. | High | S1-S4. |
| F10 | FACT | Pricing separates non-JS/JS scrape, Markdown/JSON, prompt, and schema credits. | High | S5. |
| F11 | FACT | OpenAI and Google may access prompts/results under third-party terms. | High | S6. |
| F12 | FACT | DPA gives submitted personal data a 90-day maximum and allows protected subprocessor transfers. | High | S9. |
| F13 | FACT | AUP limits use to lawful/public data absent permission and excludes sensitive categories. | High | S7. |
| F14 | FACT | Reviewed contract lacks robots, politeness, frontier, dedup, cache, and capture-provenance fields. | High | Negative inspection S1-S4. |
| I1 | INFERENCE | A logical frontier/visited state exists. | Medium-high | Multi-page seed exploration; implementation unknown. |
| I2 | INFERENCE | Prompt scoring prioritizes or filters frontier candidates. | High | Explicit product behavior; stage/model unknown. |
| I3 | INFERENCE | `return_sources_limit` does not safely bound work/cost. | High | Return-only wording; no work guarantee. |
| I4 | INFERENCE | SDK POST retries can duplicate ambiguous submissions. | High | F7 plus absent idempotency contract. |
| I5 | INFERENCE | Static/render routes and AI/extraction stages are logically distinct. | Medium-high | Controls and pricing; topology unknown. |
| R1 | RECOMMENDATION | Semantic selection must remain inside hard local scope/budgets. | High | F1, F3, F14, I2-I3. |
| R2 | RECOMMENDATION | Curiosity must own robots, politeness, capture, and provenance. | High | F14. |
| R3 | RECOMMENDATION | Reject automatic non-idempotent submission retry. | High | I4. |
| R4 | RECOMMENDATION | Defer provider integration pending contractual and controlled checks. | High | Provenance, privacy, billing, and safety unknowns. |

## 14. Reproducible public checks (no API call)

These checks inspect public documentation and pinned MIT SDK files only. They do
not install/execute packages, contact `api-aistudio.oxylabs.io`, or crawl a
target.

```sh
# Product contract and current pricing/legal text.
curl -fsS https://developers.oxylabs.io/products/ai-studio/ai-crawler.md
curl -fsS https://aistudio.oxylabs.io/pricing
curl -fsS https://oxylabs.io/legal/oxylabs-ai-studio-tos
curl -fsS https://oxylabs.io/legal/oxylabs-ai-studio-data-processing-agreement

# Pinned official Python client: lifecycle, 10-minute poller, status handling.
curl -fsS \
  https://raw.githubusercontent.com/oxylabs/oxylabs-ai-studio-py/bf5649da8797fa58e6655a656b2eec3dd77f4df7/src/oxylabs_ai_studio/apps/ai_crawler.py
curl -fsS \
  https://raw.githubusercontent.com/oxylabs/oxylabs-ai-studio-py/bf5649da8797fa58e6655a656b2eec3dd77f4df7/src/oxylabs_ai_studio/client.py

# Pinned official JavaScript client: run endpoints, local poller, broad retries.
curl -fsS \
  https://raw.githubusercontent.com/oxylabs/oxylabs-ai-studio-js/d64f3cef7439e51c1a28a93514ead053b0b550da/src/services/aiCrawler.ts
curl -fsS \
  https://raw.githubusercontent.com/oxylabs/oxylabs-ai-studio-js/d64f3cef7439e51c1a28a93514ead053b0b550da/src/client.ts
```

Expected observations: the public product table has no depth/domain/frontier
controls; SDKs add `max_credits`, CSV/Toon, run creation and polling; Python and
JavaScript differ in local timeout/retry behavior; and no complete robots,
canonicalization, freshness, or evidence contract appears.

## 15. Unknowns and pre-adoption checks

### Blocking technical questions

1. What exact URL schemes, ports, public-IP, DNS, redirect, and renderer-resource
   policy prevents SSRF and scope escape?
2. Does Crawler enforce RFC 9309? What token, cache, unavailable-robots,
   redirect, meta-robots, sitemap, crawl-delay, and opt-out rules apply?
3. What are exact-origin/subdomain/external/path boundaries and depth accounting?
4. What do `return_sources_limit` and `max_credits` bound at discovery, fetch,
   extraction, return, and billing stages?
5. What maximum depth/pages/links/bytes/redirects/render resources/duration/
   response size/concurrency applies?
6. How is frontier order determined; can prompt scoring change depth/fairness;
   and what completeness or determinism is promised?
7. Which target errors retry, with what attempts/backoff/proxy/session changes,
   `Retry-After` handling, and billing?
8. Are create calls idempotent? Can jobs be cancelled/deleted, and how long are
   run IDs/results retained?
9. How are URLs, redirects, canonical tags, exact content, and near duplicates
   represented and charged?
10. What per-page failures and unprocessed-frontier state are returned on
    timeout, budget exhaustion, or mixed success?
11. What cache is used; can origin contact/revalidation be required and
    evidenced?
12. Which browser/extractor/model/prompt versions produce each artifact, and can
    output cite immutable source spans?

### Blocking privacy, security, commercial, and legal questions

1. Obtain the current subprocessor/model/region matrix, SCCs/transfer assessment,
   provider training terms, and no-improvement option.
2. Clarify retention/deletion for URLs, prompts, schemas, target content,
   results, run metadata, logs, caches, and backups—including data not personal.
3. Confirm AI-Crawler's ISO/SOC audit scope and obtain relevant reports under
   appropriate confidentiality.
4. Reconcile plan request rates, the contractual five-connection clause, free
   trial credits, overage versus pause language, and the dashboard-record clause.
5. Define billing for attempts, successes, returned pages, retries, duplicates,
   JS subresources, cache hits, partial runs, and absent prompted data.
6. Obtain normative response/error schemas, field/size limits, SLA/support, and
   security incident/deletion terms.
7. Require target-rights, privacy, source-terms, takedown, and intended-output-use
   review. No vendor feature substitutes for caller authority.

### Only after separate authorization

Use owned, public, non-sensitive fixtures with deterministic graphs and robots
policies. Reconcile run/credit records; test duplicate submission safely; inspect
origin timing; compare static/render outputs; verify scope/redirect enforcement;
measure omissions/duplicates; and validate that timeout/cancel/budget states do
not leave uncontrolled work. No such execution is authorized by this dossier.

## 16. Bounded curiosity pass and stop

Scores are 1 (low) to 5 (high); cost is 1 (cheap) to 5 (expensive). Only public,
no-account, clean-room checks within the declared frame were authorized.

| Thread | Relevance | Value | Novelty | Cost | Decision / result |
| --- | ---: | ---: | ---: | ---: | --- |
| Inspect official SDK for real lifecycle and limits | 5 | 5 | 5 | 2 | **Pursued.** Found create/poll contract, statuses, local deadlines, `max_credits`, and undocumented formats. |
| Separate SDK retries from origin retries | 5 | 5 | 4 | 1 | **Pursued.** Found Python/JS retry differences and non-idempotent POST risk; origin retries remain unknown. |
| Find robots/politeness promise | 5 | 5 | 4 | 2 | **Pursued.** Product docs, FAQ, SDKs, pricing, AUP reviewed; no managed enforcement contract found. |
| Reconcile retention and third-party AI access | 5 | 5 | 4 | 2 | **Pursued.** Found DPA 90-day personal-data cap, EEA/subprocessor transfer terms, and OpenAI/Google access. |
| Resolve trial/rate/billing contradictions | 4 | 4 | 4 | 1 | **Pursued.** Contradictions retained; public pages do not resolve them. |
| Query GitBook's generated `?ask=` answers | 3 | 2 | 2 | 1 | **CURIOSITY_NO_GO.** Generated answers are not a stable normative contract; source pages are stronger evidence. |
| Run free Crawler calls on third-party sites | 4 | 4 | 3 | 4 | **CURIOSITY_NO_GO.** Caller prohibited credentials/calls; no target authority, and samples would not prove internals. |
| Probe localhost, metadata, redirects, or DNS rebinding | 5 | 5 | 3 | 5 | **CURIOSITY_NO_GO.** Unauthorized security testing and outside clean-room scope. |
| Infer CAPTCHA/fingerprint/proxy algorithms | 2 | 1 | 4 | 5 | **CURIOSITY_NO_GO.** Proprietary, unnecessary for the decision, and risks evasion-oriented research. |
| Reverse-engineer hosted service code/protocol beyond SDK | 2 | 2 | 3 | 5 | **CURIOSITY_NO_GO.** Contract prohibits service reverse engineering; public MIT wrappers suffice for interoperability analysis. |
| Benchmark extraction accuracy and prompt injection | 4 | 5 | 4 | 5 | **DEFERRED.** Needs owned/licensed corpus, rubric, credentials, budget, and explicit authority. |

**Coverage:** crawl contract/scope/frontier; robots/politeness; rendering and
unblocking; retries, cancellation, deduplication, extraction; provenance and
freshness; limits/pricing; privacy/security/legal/license boundaries;
architecture inference; clean-room lessons; Curiosity verdicts; confidence,
unknowns, checks, and negative results are covered.

**Stop reason:** coverage and source saturation. The remaining high-value gaps
require written vendor disclosure, audit/contract materials, counsel, or
separately authorized controlled calls. More speculation would reduce—not
increase—confidence.

## 17. Primary sources

All sources accessed **2026-08-17**. First-party vendor material is authoritative
only for the published interface or representation attributed to it.

1. **[S1] Oxylabs, “AI-Crawler,” official product documentation.**  
   <https://developers.oxylabs.io/products/ai-studio/ai-crawler.md> — product
   role, request table/defaults, JSON sample, SDK example, and claimed use cases.
2. **[S2] Oxylabs, “AI Studio FAQ.”**  
   <https://developers.oxylabs.io/products/ai-studio/faq.md> — public-site,
   dynamic-page, schema, trial, and product-boundary representations.
3. **[S3] Oxylabs, official Python AI Studio SDK 0.2.22, commit
   `bf5649da8797fa58e6655a656b2eec3dd77f4df7`.**  
   <https://github.com/oxylabs/oxylabs-ai-studio-py/tree/bf5649da8797fa58e6655a656b2eec3dd77f4df7> — MIT client; `ai_crawler.py`,
   `client.py`, README, and license establish endpoints, payload, status polling,
   local timeout/retry behavior, result model, formats, and `max_credits`.
4. **[S4] Oxylabs, official JavaScript AI Studio SDK 1.0.29, commit
   `d64f3cef7439e51c1a28a93514ead053b0b550da`.**  
   <https://github.com/oxylabs/oxylabs-ai-studio-js/tree/d64f3cef7439e51c1a28a93514ead053b0b550da> — MIT client; `aiCrawler.ts`,
   `client.ts`, `types.ts`, README, and license establish API host/auth,
   endpoints, payload, polling, retries/debug logging, and formats.
5. **[S5] Oxylabs AI Studio pricing.**  
   <https://aistudio.oxylabs.io/pricing> — plans, request rates, credit units,
   rollover/exhaustion, failure billing, and general anti-blocking claims.
6. **[S6] Oxylabs AI Studio Terms of Service, updated 2025-09-18.**  
   <https://oxylabs.io/legal/oxylabs-ai-studio-tos> — third-party AI, prompt/
   result risk, rate/use restrictions, billing precedence, IP, liability,
   reverse engineering, public-data responsibility, and governing law.
7. **[S7] Oxylabs Acceptable Use Policy, updated 2024-06-25.**  
   <https://oxylabs.io/legal/oxylabs-acceptable-use-policy> — automated data
   gathering, public/sensitive data, target terms, security, and prohibited use.
8. **[S8] Oxylabs AI Studio Privacy Policy, updated 2025-06-30.**  
   <https://oxylabs.io/legal/oxylabs-ai-studio-privacy-policy> — controller-side
   account/usage processing and explicit exclusion of customer-controlled
   service data in favor of the DPA.
9. **[S9] Oxylabs AI Studio Data Processing Agreement.**  
   <https://oxylabs.io/legal/oxylabs-ai-studio-data-processing-agreement> —
   processor/controller roles, purposes, TOMs, EEA/transfers, subprocessors,
   breach notice, audits, and 90-day personal-data maximum.
10. **[S10] Oxylabs, “Quick Start: AI Studio.”**  
    <https://developers.oxylabs.io/get-started/quick-start-ai-studio.md> — suite
    framing, related-page claims, and conflicting free-credit statement.
11. **[S11] Oxylabs, “Risk and Legal Compliance.”**  
    <https://oxylabs.io/risk-and-legal-compliance> — attributed certification
    scope, KYC, reporting, and governance representations.

## 18. Confidence summary

- **High:** documented inputs/defaults; create/poll lifecycle in pinned official
  SDKs; local SDK statuses, timeouts, and retries; JSON sample; published prices,
  credit categories, AUP/terms/DPA language; and negative schema/documentation
  results.
- **Medium:** architecture decomposition, logical frontier/visited state,
  static/render routing, stage implications of pricing, and interpretation of
  unresolved billing/rate contradictions.
- **Low / unknown:** actual frontier order/scope/completeness, robots and
  politeness, origin retries/unblocking choices, canonicalization/deduplication,
  cache/freshness, server limits/retention/cancellation, model/extractor versions,
  per-page failure/provenance, comparative quality, complete subprocessors/
  regions/training behavior, and AI-Crawler certification scope.
