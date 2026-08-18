# Zyte API, browser extraction, and Scrapy Cloud: clean-room product study

**Research date:** 2026-08-17  
**Decision frame:** What externally observable product and contract lessons should an owned Curiosity crawler adopt, adapt, reject, or defer?  
**Method:** Clean-room review of public Zyte documentation and legal terms only. No account, credentials, paid calls, target-site requests, bypass experiments, source inspection, or implementation. All linked sources were accessed 2026-08-17 unless stated otherwise.

## Executive verdict

Zyte separates two concerns that Curiosity should also separate:

1. **Single-resource acquisition and extraction** through one blocking API contract with explicit raw HTTP, rendered browser, screenshot, network-capture, and typed extraction outputs.
2. **Crawl orchestration** through Scrapy Cloud jobs, schedules, retained outputs, and a persistent host-slotted frontier.

The strongest lessons are not Zyte's anti-blocking techniques themselves, which remain intentionally opaque. They are the contract boundaries around them: request feature selection, typed incompatibilities, bounded browser execution, per-action outcomes, session semantics, target-aware rate limits, structured error classes, and usage/cost observability. Curiosity should **adopt the separation and boundedness**, **adapt the output model to stronger provenance and freshness**, and **reject opaque success semantics, unbounded rate-limit retries, and default CAPTCHA/residential escalation**.

Confidence is **high** for documented contracts and legal terms, **medium** for architectural inferences, and **low** for undocumented runtime internals, cache behavior, and exact current tier prices.

## Scope and bounded sub-questions

In scope:

- fetch/render/extract contract;
- anti-blocking and proxy layers;
- browser actions and sessions;
- crawl scheduling/frontier lessons;
- freshness, caching, and provenance;
- limits, errors, observability, and pricing;
- privacy, legal, and safety controls;
- architecture inferences and Curiosity implications.

Out of scope:

- benchmarking success rate, latency, extraction accuracy, or cost;
- testing CAPTCHA, residential IPs, or protected targets;
- reconstructing proprietary detection or evasion techniques;
- evaluating account-only dashboards or contracts;
- implementation guidance for bypassing access controls.

## Evidence labels

- **FACT** — stated in a cited primary Zyte source.
- **INFERENCE** — reasoned from multiple observable contracts; not confirmed internals.
- **RECOMMENDATION** — proposed Curiosity design choice.
- **UNKNOWN** — public evidence was insufficient or contradictory.

## Product map

| Surface | Observable role | Boundary |
|---|---|---|
| Zyte API HTTP API | Blocking processing of one URL | Acquisition/render/extract primitive, not a crawl scheduler [S1] |
| Zyte API proxy mode | Compatibility interface for existing proxy-aware clients | Lower overhead, but no actions, screenshots, capture, extraction, or server-managed sessions [S5] |
| Zyte browser automation | Rendered DOM, screenshots, action sequences, network capture | Per-request browser execution, not a persistent remote browser [S2][S4] |
| Automatic extraction | Standard typed schemas plus custom attributes | At most one standard extraction type per request [S1][S3] |
| Scrapy Cloud | Runs and schedules spiders/scripts and retains job data | Separate from Zyte API; either may be used independently [S16][S20] |
| Hub Crawl Frontier | Persistent visited set and outstanding-request queues | Project/frontier/slot scheduler storage, typically host-slotted [S19] |
| Stats API | Aggregated cost, traffic, latency, status, feature, and domain health | Operational telemetry, not page-level evidence [S9] |

**FACT:** Zyte's Terms define Software Services to include Zyte API, Automatic Extraction API, Scrapy Cloud, Smart Proxy Manager, and related platforms. They define Service Data broadly as data extracted through the software, including screenshots [S12].

## 1. Fetch, render, and extract contract

### 1.1 One endpoint, explicit output selection

**FACT:** `POST /v1/extract` accepts one absolute URL (maximum 8,192 characters; host must be a domain, not an IP address), blocks until the result is ready, and requires at least one output: `httpResponseBody`, `httpResponseHeaders`, `browserHtml`, `screenshot`, or one automatic extraction field [S1]. The overall request body limit is 5 MiB [S1].

**FACT:** Raw HTTP and browser modes are deliberately distinct:

- HTTP mode supports method, text/binary body, custom headers, response body, and response headers.
- Browser mode supports rendered DOM HTML, screenshots, actions, network capture, viewport/render options, and limited initial request headers.
- `httpResponseBody` cannot be mixed with browser-exclusive fields.
- `httpResponseHeaders` can accompany most valid combinations.
- Browser HTML and raw HTTP body are each limited to 10 MB before Base64 encoding; longer responses are truncated [S1][S10].

**FACT:** The HTTP API wraps raw bodies as Base64, adding traffic, latency, and client decoding overhead. Proxy mode returns the body directly with lower overhead [S5].

**INFERENCE (high confidence):** Zyte exposes a provider-neutral *intent* (`url` plus desired outputs) but a provider-specific monolithic response. A feature planner behind the endpoint can choose acquisition technology while preserving a stable external schema.

**RECOMMENDATION — ADOPT:** Curiosity should expose one retrieval intent with an explicit output set, while keeping internal fetch, render, and extract adapters separate. Invalid combinations should be rejected before dispatch rather than silently coerced.

### 1.2 HTTP acquisition

**FACT:** HTTP requests can use GET, POST, PUT, DELETE, OPTIONS, TRACE, PATCH, or HEAD; request body fields are capped at 400,000 characters; custom headers are capped at 200 entries [S1]. The `Cookie` header cannot be set directly; cookies use structured request fields [S1].

**FACT:** Zyte automatically supplies headers for ban avoidance and may override or drop custom headers. Custom headers may themselves break ban avoidance. The service aims to return what a browser network stack would receive, not necessarily byte-for-byte what `curl` receives [S1][S6].

**FACT:** A target's non-ban error (for example, origin 404) is wrapped in a successful Zyte API HTTP 200 response, with the origin status in `statusCode` [S6].

**RECOMMENDATION — ADAPT:** Separate `transport_status`, `origin_status`, and `policy_status` in Curiosity. Calling an origin 404 a provider “success” is useful for billing but dangerous for downstream retrieval quality.

### 1.3 Browser render

**FACT:** `browserHtml` is a serialized DOM after rendering and after actions finish or time out. Iframes are empty unless `includeIframes` is enabled. Standard selectors cannot enter iframes or shadow DOM; Zyte directs users to evaluate/scripts for those cases [S1][S2].

**FACT:** Screenshots are Base64 PNG or JPEG (default JPEG at 75% quality). Full-page screenshots are JPEG-only, minimum 1920×1080, and clipped above 5000×10000 pixels [S1].

**FACT:** The initial browser request does not support arbitrary method, body, or headers (only Referer is documented). Redirects, page JavaScript, and actions may subsequently issue unrestricted requests, which network capture can observe [S2].

**RECOMMENDATION — ADOPT:** Treat rendered DOM, screenshot, and captured network responses as distinct artifacts with explicit derivation links. Never label serialized DOM as the origin HTTP response.

### 1.4 Structured extraction

**FACT:** Standard extraction types cover products, product lists/navigation, articles, article lists/navigation, forum threads, job postings/navigation, generic page content, and SERP. Only one standard type can be requested at once [S1][S3]. Product/article/job/page extraction is AI-powered; SERP extraction is described as non-AI [S3].

**FACT:** Extraction sources include raw HTTP, browser-derived content, and caller-provided HTML. Raw HTTP is characterized as faster and cheaper; browser extraction may improve quality on JavaScript-heavy pages; `userHtml` avoids a new download and charges only extraction, with a 2.5 MiB default HTML limit [S1][S3].

**FACT:** The extraction guide distinguishes `browserHtmlOnly` (DOM only) from `browserHtml` (DOM plus visual features), but the rendered API reference visible on the research date lists `httpResponseBody`, `browserHtml`, and `userHtml` for the main `extractFrom` enum [S1][S3].

**UNKNOWN / CONTRACT DRIFT:** It is unclear whether `browserHtmlOnly` is generally accepted, accepted only in per-type options, newly introduced ahead of reference regeneration, or documentation drift. A production adapter must validate against the current OpenAPI/schema rather than prose alone.

**FACT:** AI extraction mismatch does not make the API request fail. The response may still be HTTP 200, with `metadata.probability` indicating whether the requested page type matches [S6].

**FACT:** Some extraction models can be pinned. Zyte says models are retrained a few times per year, pinned versions remain available for at least one year after release, and users receive at least three months' notice before removal [S3].

**RECOMMENDATION — ADOPT:** Version every extractor and preserve the extraction source class. **ADAPT:** require downstream quality gates to inspect page-type confidence; never equate schema conformance with factual correctness.

### 1.5 Custom attributes

**FACT:** Custom attributes require a standard extraction type (except SERP) that scopes the page region passed to an LLM. The caller supplies a constrained OpenAPI-like schema [S4].

**FACT:** Zyte offers:

- `generate`: generative LLM, variable token-based cost, supports normalization/summarization/translation and richer schemas;
- `extract`: non-generative LLM, fixed cost, limited to simple scalar types and no transformation [S4][S7].

**FACT:** Zyte guarantees returned values conform to the requested schema, but all fields are effectively nullable/omittable. Its guidance warns that mathematical transformations cannot always be correct, larger schemas tend to reduce quality, and deterministic post-processing is preferable [S4].

**RECOMMENDATION — ADOPT:** Distinguish extractive evidence capture from generative transformation. Schema validity is not evidence validity. Preserve source text/spans before normalization; perform arithmetic and canonicalization deterministically.

## 2. Anti-blocking, proxy, and identity layers

### 2.1 Observable controls

**FACT:** Zyte automatically chooses technology, IP type, and geolocation based on the target unless overridden. `ipType` supports datacenter and residential. Explicit residential use requires KYC and affects cost. Zyte describes residential addresses as end-user devices whose users explicitly consent to bandwidth sharing [S1][S8].

**FACT:** Country-level geolocation is supported; extended locations cost more. Finer location is generally achieved through cookies, actions, or sessions rather than IP granularity [S8][S10].

**FACT:** Anti-ban behavior may include automatic cookies, header selection/ordering, IP/network-stack continuity, CAPTCHA management, residential IPs, retries, and target-specific handling [S1][S6][S8]. Zyte says it does not automatically log in and cannot automatically obtain content always locked behind login [S6].

**FACT:** Account-level permissions can disable CAPTCHA management and device residential IPs; both are enabled by default. Disabling residential limits access to datacenter IPs and disables extended geolocations, potentially increasing bans [S8].

**FACT:** Zyte may return 451 `/download/domain-forbidden` for disallowed domains [S6]. Proxy mode rejects spoofing-style forwarding headers including `X-Forwarded-For`, `True-Client-IP`, and related variants [S5].

**RECOMMENDATION — REJECT DEFAULTS:** Curiosity should not default to CAPTCHA solving or residential escalation. These must be separately governed capabilities, off by default, with target policy, lawful-purpose review, provenance, spend bounds, and human authorization.

### 2.2 Proxy compatibility layer

**FACT:** Proxy mode uses `api.zyte.com:8011` (or HTTPS proxy interface on 8014) and exposes controls through `Zyte-*` headers [S5]. It supports direct body retrieval and rendered browser HTML but not screenshots, browser actions, network capture, JavaScript disabling, automatic extraction, server-managed sessions, or echo metadata [S5].

**FACT:** Proxy mode can set cookies only for the target domain, whereas HTTP API cookies can span domains. Zyte says proxy mode is not optimized for local browser automation and recommends its browser API instead [S5].

**INFERENCE (high confidence):** Proxy mode is a migration façade over the same acquisition control plane, intentionally narrower than the canonical JSON contract.

**RECOMMENDATION — ADAPT:** If Curiosity ever offers protocol compatibility, keep it a lossy adapter. The provider-neutral JSON contract remains canonical; compatibility modes must advertise unsupported capabilities rather than approximate them.

### 2.3 Sessions and cookies

**FACT:** Cookies are structured request/response objects. If no caller cookies are provided, Zyte may add cookies to reduce bans; `cookieManagement: "discard"` disables automatic cookies while still allowing explicit caller cookies [S1][S8].

**FACT:** Sessions bind request conditions such as IP, cookie jar, and network stack. They do **not** preserve a browser tab, process, machine, DOM, or JavaScript heap [S8].

**FACT:** Client-managed sessions use caller-provided UUIDv4 IDs. The reference says they can expire after 15 minutes from creation, two minutes since use, or three consecutive bans, followed by a 5–10 minute tombstone period [S1][S8]. Server-managed sessions use up to ten caller-defined context pairs, can initialize state through parameters, and expire after four hours or three bans [S1].

**RECOMMENDATION — ADOPT:** Define session scope precisely as transport identity plus cookies, not “browser persistence.” Use explicit expiry reasons and make session state non-portable across providers unless the contract proves otherwise.

## 3. Browser actions and bounded execution

**FACT:** Actions run sequentially before output generation. Zyte describes three categories: generic actions, target-specific “special” actions, and browser scripts [S2]. Generic actions cover text input, mouse interaction, scrolling, key/evaluate behavior, and event/time waiting. Special actions are available only for selected sites and are discovered by trying a request; unsupported use returns an error [S2].

**FACT:** Element selectors support CSS and XPath 1.0. Selectors cannot directly interact with iframe or shadow-DOM contents [S2].

**FACT:** Wait primitives include `waitForSelector`, `waitForRequest`, `waitForResponse`, and `waitForTimeout`. Zyte recommends condition/event waits over fixed sleeps [S2].

**FACT:** There is no stated count limit, but total browser execution is capped at 60 seconds. At expiry, the active action is interrupted, later actions do not run, and outputs reflect the partial page state. Response action records expose at least elapsed time, error, and status [S2].

**FACT:** Action failure does not fail the overall request. Requested artifacts are returned from the resulting partial state, and per-action outcomes must be inspected [S6].

**FACT:** Network capture uses up to ten filter sequences and returns at most ten matched responses whose combined bodies fit within 5 MiB; earlier captures win when the size cap is exceeded [S1][S2]. Captures can include responses caused by rendering and actions [S2].

**RECOMMENDATION — ADOPT:**

- bound total browser wall time, action count, navigation count, captured responses, captured bytes, and output bytes;
- prefer semantic/event waits;
- return an ordered action ledger and explicit `complete | partial | failed` artifact state;
- make partial success impossible to miss;
- prohibit side-effecting actions by policy unless explicitly authorized.

**RECOMMENDATION — REJECT:** Do not discover target-specific action support by paid trial requests in normal operation. Curiosity should expose a capability registry with version and target scope.

## 4. Crawl orchestration lessons from Scrapy Cloud

### 4.1 Jobs and schedules

**FACT:** A Scrapy Cloud job is execution of a spider or Python script. Paid accounts can schedule jobs; the Periodic Jobs API manages cron-based spider/script tasks, priority (0–4), arguments, tags, pause state, and descriptions [S16][S18].

**FACT:** Its cron grammar is intentionally narrow: five fields, each a single value or `*`; ranges, lists, and steps are unsupported [S18]. The API suggests a UTC hour to spread scheduled load [S18].

**FACT:** Scrapy Cloud and Zyte API are separate products and can be used independently [S20].

**RECOMMENDATION — ADOPT:** Keep crawl scheduling above retrieval providers. Provider adapters should process bounded fetch/render/extract units; an owned scheduler should own recurrence, crawl policy, retries, budgets, and stop conditions.

### 4.2 Persistent frontier

**FACT:** Hub Crawl Frontier stores visited fingerprints and outstanding request queues. A fingerprint may be a URL or another stable string, such as a URL plus POST-data hash. Arbitrary queue and fingerprint data can be stored [S19].

**FACT:** Each frontier is partitioned into slots, each with a separate priority queue. Zyte's example uses hostname as slot and states a crawler should ensure each host is crawled by only one process at a time so politeness can be maintained [S19]. Batches are leased/retrieved and explicitly acknowledged as deleted when processed [S19].

**INFERENCE (high confidence):** Slot partitioning provides the natural enforcement point for per-origin concurrency, delay, fairness, and adaptive backpressure; fingerprints provide idempotence independently from URL syntax.

**RECOMMENDATION — ADOPT:** Curiosity's frontier should use canonical request fingerprints, host/eTLD+1 policy slots, per-slot queues, explicit lease/ack semantics, and arbitrary bounded metadata for depth, discovery edge, revisit schedule, and policy decision.

### 4.3 Resource and retention boundaries

**FACT:** Jobs take 1–6 units. Each regular unit contributes one compute unit, 1 GB memory, and 2.5 GB disk; total purchased units bound concurrent jobs [S17]. Jobs producing no logs, requests, or items for one hour are cancelled as stalled [S20].

**FACT:** Free Scrapy Cloud includes one half-resource unit, up to one-hour jobs, and up to seven days' job-data retention. Purchasing units at $9/month each replaces the free unit with regular units, enables unlimited job duration and scheduling, and raises job-data retention to up to 120 days [S15].

**RECOMMENDATION — ADAPT:** Apply explicit CPU/memory/disk/wall-time budgets even if infrastructure can run indefinitely. “Unlimited” duration is an account feature, not a safe crawler default. Retention must be policy-driven per artifact class, not only plan-driven.

## 5. Caching, freshness, and revisit semantics

### 5.1 What is documented

**FACT:** The Zyte API endpoint is described as blocking until a single URL's result is ready [S1]. HTTP response headers may be requested, and custom HTTP headers permit conditional request headers in principle, subject to Zyte's header caveats [S1]. Scrapy Cloud documentation links to support for using Scrapy's HTTP cache, which places caching in crawler code rather than defining it as Zyte API freshness behavior [S16].

**NEGATIVE RESULT:** No first-party Zyte API documentation reviewed here defines:

- a provider response cache or cache key;
- `max_age`, `freshness`, `stale-if-error`, or force-refresh request controls;
- whether successful responses can be served from an internal cache;
- a response `fetchedAt` timestamp;
- revisit scheduling or change-detection semantics.

**UNKNOWN:** A provider may use internal caches operationally, but no public contract found during this review makes that observable or controllable. Therefore “live fetch on every call” must not be assumed as a guaranteed fact.

### 5.2 Curiosity implication

**RECOMMENDATION — ADAPT:** Freshness belongs in the owned retrieval contract, not as an inference from request time. Include:

- `requested_at`, `fetch_started_at`, `origin_response_at`, and `completed_at`;
- cache disposition: `miss | fresh_hit | revalidated | stale_hit | bypass`;
- validators (`ETag`, `Last-Modified`) and origin cache headers when present;
- caller policy (`max_age`, `max_stale`, `revalidate`, `bypass`);
- content hash and normalized-content hash;
- revisit reason and next eligible fetch time.

Acquisition cache keys must include canonical URL, method/body fingerprint, representation-affecting headers/cookies, geolocation, device/IP class, render settings, action program, and session scope. Extraction cache keys additionally include acquisition artifact hash, schema, extractor/model version, and extraction options.

## 6. Provenance and auditability

### 6.1 Zyte's observable provenance

**FACT:** Responses expose the requested URL and origin `statusCode`; callers can request origin response headers and cookies [S1]. Proxy mode returns a unique `Zyte-Request-ID` suitable for support correlation [S5].

**FACT:** `echoData` round-trips arbitrary caller metadata, while `tags` allow later Stats API filtering [S1][S8][S9]. Action records describe individual execution outcomes [S2]. Network captures preserve matched response URL/status/headers/body according to selected fields and limits [S1][S2].

**FACT:** Extraction mismatch probability and model pinning provide some model-level context [S3][S6]. Stats can aggregate by time, domain, key label, response code, feature, extraction type/source, and tags, and report request count, response-time average/p80, cost, traffic, and domain health [S9]. Domain health is calculated every three hours and is limited to recently used/top domains, so it is not real-time page provenance [S9].

### 6.2 Provenance gaps

**NEGATIVE RESULT:** The reviewed public response contract does not clearly guarantee all of the following:

- authoritative fetch/start/end timestamps;
- complete redirect and subresource chain;
- actual selected IP class/geolocation when defaults are automatic;
- cache disposition;
- browser/runtime version and render policy version;
- extractor build/model version on every response;
- per-field source selector/span or visual region;
- content hashes;
- robots/terms/policy decision record;
- explicit indication of every provider override of caller headers;
- billing cost attached to each response rather than aggregate telemetry.

**RECOMMENDATION — ADOPT STRONGER CONTRACT:** Every Curiosity artifact should carry a provenance envelope:

```text
request_id, crawl_id, parent_discovery_id
requested_url, canonical_url, final_url, redirect_chain
request_fingerprint, representation_key, session_scope
requested_at, fetch_started_at, origin_response_at, completed_at
origin_status, transport_status, policy_status
fetch_mode, render_mode, action_program_hash, completion_state
actual_geo, actual_ip_class, user_agent_profile, adapter/version
cache_disposition, validators, raw_hash, rendered_hash
extractor/model/schema version, extraction_source
field -> source artifact + selector/span/region + confidence
policy decision, robots snapshot/hash, terms-review reference
retry lineage, cost units, truncation and limit flags
```

Search results and extracted fields remain untrusted external data. Provenance must be attached, not inferred from logs that may expire.

## 7. Limits, errors, and pricing

### 7.1 Rate and concurrency limits

**FACT:** Standard plans are limited to 3,000 requests/minute per API key; Enterprise is documented as custom in the rate-limit page and 10,000 RPM in the pricing comparison table [S7][S11]. Additional limits exist per website, per account+website, and temporarily during platform demand [S11].

**FACT:** Limits are RPM, not direct concurrency. Zyte estimates concurrency as `RPM / 60 × average response seconds`; browser requests commonly take 10–30 seconds [S11][S21].

**FACT:** Rate-limit responses use 429 or 503 and are free. Zyte recommends randomized exponential backoff and says rate-limit responses should be retried indefinitely, while other unsuccessful retries should be capped [S6].

**RECOMMENDATION — ADAPT:** Preserve separate global, tenant, domain, and tenant-domain token buckets. **REJECT** infinite retries: Curiosity should bound attempts, elapsed time, spend, and deadline, then return an explicit deferred state for scheduler-controlled retry.

### 7.2 Error taxonomy

**FACT:** Zyte distinguishes:

- provider success (200), even with origin non-200, extraction mismatch, or action failure;
- rate limiting (429/503);
- temporary download/ban failure (520);
- permanent/internal download failure (521);
- provider timeout/internal failure (500);
- invalid/auth/unreachable/incompatible/forbidden (400/401/421/422/451);
- suspended account (403) [S6].

**FACT:** Zyte warns that some 521 errors may actually be transient bans and suggests target-specific reclassification when repeated observations justify it [S6].

**RECOMMENDATION — ADOPT:** Use typed, machine-actionable errors with retry class and origin/provider separation. **ADAPT:** classification changes should be versioned policy decisions with evidence, not hidden provider heuristics.

### 7.3 Zyte API pricing

**FACT:** Zyte charges only successful responses; unsuccessful and rate-limited responses are free [S7]. Base cost depends on target website, request type (HTTP/browser), and one of five automatically assigned tiers for each request type. New target/request combinations receive temporary tiers; assignments are reviewed quarterly with two weeks' notice [S7].

**FACT:** Additional charges apply for actions (CPU/network), network capture (output size), screenshot ($0.002), automatic extraction ($0.0004–$0.0016 except free SERP extraction), and custom attributes: generative input $0.002/1k tokens plus output $0.01/1k, or fixed $0.001 extractive mode, before volume discounts [S7]. Residential/extended geolocation add network-sensitive cost [S7].

**FACT:** Standard PAYG starts with $5 first-month credit, 3,000 RPM, and $100/month plan spending limit. Commitment plans offer $200–$2,500 spending limits, $100–$500 monthly commitments, and 25%–52% discounts. Enterprise terms are custom [S7]. Organization and per-key blocking limits can stop service; domain alerts are informational only [S7].

**UNKNOWN:** The documentation delegates exact base tier prices and distribution to a dynamic marketing pricing page/cost estimator. This review did not use account tools and does not claim an exact all-in cost per 1,000 requests.

**RECOMMENDATION — ADOPT:** Preflight cost estimation, per-job/per-domain/per-adapter hard budgets, and feature-level cost attribution. A provider HTTP 200 must not alone authorize spend continuation if downstream yield is poor.

## 8. Privacy, legal, and safety

This section reports contract terms, not legal advice.

### 8.1 Access and use restrictions

**FACT:** Zyte Terms say services are solely for scraping publicly accessible websites. Customers must determine legality and use services legally and ethically for internal intelligence/business purposes. Zyte may suspend service if it determines the customer breached target-source terms, receives a cease request from a target, or identifies legal/operational/business risk [S12].

**FACT:** Zyte does not grant copyright or permission to use Service Data/Data Feeds and disclaims non-infringement warranties; lawful downstream use remains the customer's responsibility [S12].

**FACT:** The AUP prohibits unlawful/fraudulent collection, privacy-law violations, rights infringement, accessing systems whose terms the customer explicitly accepted prohibit that access/use, LinkedIn scraping, specified sensitive/illegal content categories, fraudulent ad activity, and security testing/unauthorized access [S13]. It also specifically prohibits using screenshots to process personal data, copyrighted material, or illegal content [S13].

**FACT:** Zyte may use Service Data, Data Feeds, code, and other service data for product development and product training under its published Terms, subject to any separately applicable agreement [S12]. This is material for confidential or sensitive retrieval workloads.

**RECOMMENDATION — ADOPT/strengthen:** Curiosity needs target allow/deny policy, public-access verification, robots and terms review hooks, complaint/cease workflow, purpose limitation, and explicit artifact-use licensing review. Technical accessibility is not authorization.

### 8.2 Personal data and data protection

**FACT:** The Terms and DPA generally make the customer/controller responsible for Service Personal Data and Zyte the processor. The customer warrants lawful instructions, notices/consent where required, and compliant collection/storage/use [S12][S14].

**FACT:** The DPA states Zyte processes Service Personal Data on documented instructions, applies Article 32-aligned technical/organizational measures, binds authorized persons to confidentiality, uses contracted subprocessors, and will notify the client of a security event without undue delay and no later than 72 hours [S14]. International transfers may occur with contractual transfer mechanisms [S14].

**FACT:** Zyte's privacy policy says service usage logs are retained as long as needed for security/integrity, support tickets are typically deleted after four years, and invoices/billing details after seven years. It does not provide a single public retention duration for all fetched Service Data [S22]. The DPA says Service Personal Data retention is as specified in the applicable agreement [S14].

**UNKNOWN:** Exact Zyte API request/response body retention, debug logging, regional processing, and model-training opt-out terms for a particular account require the applicable agreement and Trust Center/subprocessor review.

**RECOMMENDATION — DEFER PROVIDER USE FOR SENSITIVE DATA:** Do not send credentials, private pages, regulated data, or confidential corpora to Zyte based only on public documentation. Require DPA/security/retention/training review, data-flow mapping, deletion terms, and approved purpose first.

### 8.3 Safety controls implied by the product

**FACT:** Zyte supports domain forbids, KYC for forced residential use, target-specific limits, account permissions for CAPTCHA/residential, blocking spend limits, and target cease handling [S6][S7][S8][S12].

**INFERENCE (medium confidence):** Safety is split across request validation, account entitlements, target policy, operational throttles, billing controls, and contractual enforcement rather than one crawler-level policy engine.

**RECOMMENDATION — ADAPT:** Curiosity should make that composition explicit in a single policy decision record. Fetch authorization, data-use authorization, sensitive-data handling, and budget authorization are separate gates.

## 9. Architecture inferences

The following are clean-room inferences, not claims about Zyte implementation.

### A. Capability planner and acquisition router — **medium-high confidence**

Evidence: one request schema, incompatible output combinations, automatic target tiering, target-selected IP/geolocation, and automatic extraction source defaults [S1][S7][S8].

Likely logical shape:

```text
request validation
  -> capability/cost/policy planner
  -> target-aware acquisition router
       -> HTTP/browser transport profile
       -> IP/geolocation/session/cookie layer
       -> retry + target-rate controller
  -> optional actions/capture
  -> optional typed extractor
  -> response assembly + billing/stats
```

### B. Target-domain adaptive control plane — **medium confidence**

Evidence: domain-specific price tiers, website rate limits, global domain health, automatic IP/geolocation selection, and active monitoring of popular websites [S6][S7][S9][S11].

Inference: domain-level telemetry feeds policy/configuration used by the request path. The precise signals, models, and update process are unknown.

### C. Ephemeral browser workers — **high confidence at logical level**

Evidence: 60-second execution cap; sessions do not preserve browser process/tab/machine; outputs generated after actions [S2][S8].

Inference: browser work is designed as disposable request-scoped execution, even if physical workers are pooled internally.

### D. Crawl plane above retrieval plane — **high confidence**

Evidence: Zyte API processes one URL; Scrapy Cloud independently runs spiders and HCF stores a persistent frontier [S1][S19][S20].

Inference: crawl graph expansion, revisit policy, and persistent deduplication belong outside the single-resource extraction endpoint.

### E. Separate telemetry/billing path — **medium-high confidence**

Evidence: tags/echo metadata in requests; Stats API aggregates cost, features, latency, traffic, and domain health with non-real-time calculations [S8][S9].

Inference: request events flow into an asynchronous analytics and billing pipeline distinct from synchronous response assembly.

## 10. Curiosity decision ledger

### Adopt

1. **Fetch/render/extract as explicit capabilities**, with invalid-combination validation.
2. **Crawler orchestration separate from retrieval providers.**
3. **Host-slotted persistent frontier** with fingerprint dedupe and lease/ack batches.
4. **Bounded browser execution** and event-based waits.
5. **Per-action outcome ledger** and explicit partial completion.
6. **Typed transport/origin/policy errors** and target-aware rate limiting.
7. **Session semantics limited to transport identity/cookies** unless actual browser persistence exists.
8. **Model/schema version pinning** and extraction source declaration.
9. **Feature-level cost and usage telemetry**, tags, and hard budgets.
10. **Compatibility adapters as narrower façades**, never the canonical contract.

### Adapt

1. Replace Zyte's provider-centric “HTTP 200 = successful delivery” with retrieval-quality states.
2. Add first-class freshness/cache controls and timestamps.
3. Add stronger evidence provenance: hashes, redirect chain, actual execution choices, and per-field spans.
4. Make extraction confidence actionable and separate schema conformity from factual confidence.
5. Bound retries by deadline/attempts/spend rather than retrying rate limits forever.
6. Make target capabilities discoverable without trial execution.
7. Make policy gates and data-use rights visible in the request/audit record.
8. Apply finite crawl job limits even where infrastructure supports unlimited runtime.

### Reject

1. Default CAPTCHA solving or residential routing.
2. Any design whose anti-blocking success obscures target permission or legal constraints.
3. Automatic provider defaults that are omitted from provenance.
4. Silent partial browser success.
5. Generative normalization without preserved source evidence and deterministic checks.
6. Treating aggregate stats/logs as durable item-level provenance.
7. Infinite in-process retries.

### Defer

1. Residential IP capability and CAPTCHA services pending legal/safety review.
2. Persistent authenticated browser sessions pending a concrete owned use case and threat model.
3. Target-specific “special actions”; prefer generic, policy-bounded actions first.
4. Third-party managed extraction for personal/confidential data pending contractual retention/training/security review.
5. A proxy-compatibility interface until a migration requirement exists.

## 11. Unknowns and validation checks

| Unknown / risk | Confidence now | Required check before reliance |
|---|---:|---|
| Whether Zyte API ever serves cached page content | Low | Obtain contractual/product answer; test only with authorized benign fixtures if later approved |
| Exact request/response body retention | Low | Review account agreement, Trust Center, DPA annexes, and support response |
| Whether customer Service Data trains extraction models by default and opt-out mechanics | Medium that Terms permit use; low on account exceptions | Contract/legal review |
| Exact current HTTP/browser base tier prices | Low | Use current public pricing table/cost estimator at decision time |
| `browserHtmlOnly` schema availability | Medium-low | Validate current OpenAPI and a no-cost schema validator or vendor answer |
| Actual chosen IP/geolocation/profile when omitted | Low | Confirm whether response/account telemetry exposes it |
| Page-level request ID in canonical HTTP API | Medium-low | Inspect actual documented response headers/OpenAPI or vendor confirmation |
| Robots.txt behavior | Low | No reviewed product contract states automatic robots enforcement; obtain explicit answer |
| Extraction field-level grounding | High that public contract is insufficient | Confirm whether newer API/model responses expose spans or evidence |
| Browser engine/version and update policy | Low | Obtain compatibility/version policy |
| HCF retention/capacity/lease timeout guarantees | Low | Review plan-specific storage contract before architectural dependence |
| Anti-ban performance by target | Unknown | Do not generalize marketing claims; benchmark only owned/authorized fixtures under separate approval |

## 12. Bounded curiosity pass

Budget: pursue only gaps that materially affect the owned-crawler decision and can be answered from public primary sources without accounts or live extraction.

Scoring: 1 (low) to 5 (high); priority roughly increases with relevance + value + novelty and decreases with cost.

| Thread | Relevance | Value | Novelty | Cost | Action/result |
|---|---:|---:|---:|---:|---|
| Legal/customer responsibility and data training rights | 5 | 5 | 4 | 2 | **Pursued.** Terms/AUP/DPA materially changed the safety verdict [S12–S14]. |
| Crawl frontier semantics | 5 | 5 | 4 | 2 | **Pursued.** HCF confirmed slot queues, fingerprints, and ack semantics [S19]. |
| Cache/freshness contract | 5 | 5 | 3 | 2 | **Pursued to saturation.** No public Zyte API cache/freshness guarantee found; retained as negative result. |
| `browserHtmlOnly` contradiction | 4 | 4 | 4 | 2 | **Pursued.** Guide/reference drift documented; current runtime remains unknown [S1][S3]. |
| Exact anti-bot algorithms/fingerprints | 2 | 2 | 4 | 5 | **CURIOSITY_NO_GO:** proprietary, bypass-adjacent, unnecessary for contract lessons. |
| Live success-rate or CAPTCHA experiments | 2 | 3 | 3 | 5 | **CURIOSITY_NO_GO:** prohibited by frame; requires calls/targets/credentials and would not generalize. |
| Dynamic per-domain tier-price distribution | 3 | 3 | 2 | 4 | **CURIOSITY_NO_GO:** exact values are volatile; architecture decision needs cost controls, not a snapshot. |
| Scrapy Cloud internals/source reconstruction | 2 | 2 | 3 | 5 | **CURIOSITY_NO_GO:** public API semantics are sufficient; internals are out of scope. |
| Marketing comparison with competitors | 1 | 1 | 2 | 3 | **CURIOSITY_NO_GO:** outside single-product owned-crawler frame. |

**Stop condition:** Coverage reached for every requested dimension; additional public-source searches were saturating around undocumented runtime details. No further autonomous follow-up is authorized.

## Sources

All sources are first-party Zyte pages accessed 2026-08-17.

- **[S1]** Zyte, [Zyte API reference documentation](https://docs.zyte.com/zyte-api/usage/reference.html).
- **[S2]** Zyte, [Zyte API browser automation](https://docs.zyte.com/zyte-api/usage/browser.html).
- **[S3]** Zyte, [Zyte API automatic extraction](https://docs.zyte.com/zyte-api/usage/extract/index.html).
- **[S4]** Zyte, [Custom attributes extraction](https://docs.zyte.com/zyte-api/usage/extract/custom-attributes.html).
- **[S5]** Zyte, [Zyte API proxy mode](https://docs.zyte.com/zyte-api/usage/proxy-mode.html).
- **[S6]** Zyte, [Zyte API error handling](https://docs.zyte.com/zyte-api/usage/errors.html).
- **[S7]** Zyte, [Zyte API pricing](https://docs.zyte.com/zyte-api/pricing.html).
- **[S8]** Zyte, [Zyte API shared features](https://docs.zyte.com/zyte-api/usage/features.html).
- **[S9]** Zyte, [Zyte API Stats API](https://docs.zyte.com/zyte-api/usage/stats/index.html).
- **[S10]** Zyte, [Zyte API frequently asked questions](https://docs.zyte.com/zyte-api/faq.html).
- **[S11]** Zyte, [Zyte API rate limits](https://docs.zyte.com/zyte-api/usage/rate-limit.html).
- **[S12]** Zyte, [Terms of Service](https://www.zyte.com/terms-policies/terms-of-service/).
- **[S13]** Zyte, [Acceptable Use Policy](https://www.zyte.com/terms-policies/acceptable-use-policy/).
- **[S14]** Zyte, [Data Processing Agreement](https://www.zyte.com/terms-policies/dpa/).
- **[S15]** Zyte, [Scrapy Cloud pricing](https://docs.zyte.com/scrapy-cloud/pricing.html).
- **[S16]** Zyte, [Scrapy Cloud jobs](https://docs.zyte.com/scrapy-cloud/usage/jobs/index.html).
- **[S17]** Zyte, [Scrapy Cloud units](https://docs.zyte.com/scrapy-cloud/usage/units.html).
- **[S18]** Zyte, [Periodic Jobs API](https://docs.zyte.com/scrapy-cloud/usage/reference/http/periodicjobs.html).
- **[S19]** Zyte, [Hub Crawl Frontier API](https://docs.zyte.com/scrapy-cloud/usage/reference/http/frontier.html).
- **[S20]** Zyte, [Scrapy Cloud FAQ](https://docs.zyte.com/scrapy-cloud/usage/faq.html).
- **[S21]** Zyte, [Optimizing Zyte API usage](https://docs.zyte.com/zyte-api/usage/optimize.html).
- **[S22]** Zyte, [Privacy Policy](https://www.zyte.com/terms-policies/privacy-policy/).

## Overall confidence

- **High:** published request/response surfaces, action bounds, session non-persistence, documented limits, pricing mechanics, Scrapy Cloud frontier model, and published legal terms.
- **Medium:** logical architecture, separation of synchronous and telemetry paths, and target-control-plane inferences.
- **Low/unknown:** cache behavior, exact retention and training exceptions for a particular account, browser runtime versions, anti-ban internals, live quality, and volatile per-target pricing.
