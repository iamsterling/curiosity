# Bright Data: clean-room product and architecture research

**Research date:** 2026-08-17  
**Source access date:** 2026-08-17  
**Scope:** Bright Data Web Scraper API, Crawl API, Web Unlocker API, Browser API
(formerly Scraping Browser), and the proxy infrastructure beneath them.  
**Method:** Public, first-party documentation, product pages, pricing pages, legal
terms, and the public DPA only. No account, credentials, paid test, target-site
test, traffic interception, access-control bypass, or implementation was used.

## Decision frame

The decision is not “can Bright Data scrape the web?” It plainly offers several
ways to do so. The decision for Curiosity is:

> Which Bright Data capabilities, if any, should sit behind Curiosity's
> provider-neutral retrieval contracts, and what evidence, safety, cost, and
> lifecycle controls must Curiosity retain rather than delegate?

Bounded sub-questions:

1. Where are the boundaries between fetching, browser execution, crawling,
   extraction, and pre-collected data?
2. What are the real request, job, result, error, and delivery contracts?
3. What does Bright Data automate in unblocking and proxy selection, and what
   remains the customer's responsibility?
4. Does the output carry enough source provenance and freshness evidence for a
   trustworthy retrieval system?
5. What security, privacy, legal, and commercial constraints change the design?
6. Which architecture lessons should Curiosity adopt, adapt, reject, or defer?

### Evidence labels

- **FACT** — stated by a cited first-party source.
- **INFERENCE** — a clean-room conclusion from documented external behavior;
  not a claim about private source code or internals.
- **RECOMMENDATION** — a Curiosity design or procurement action.
- **UNKNOWN** — not established by the public sources reviewed.

Confidence is **high**, **medium**, or **low**. Marketing performance and scale
claims remain vendor claims even when cited.

## Executive assessment

**FACT (high):** Bright Data exposes a layered portfolio rather than one generic
crawler: pre-built Web Scraper APIs return site-specific structured records;
Crawl API maps/extracts content across a domain; Web Unlocker performs a managed
single-request fetch; Browser API exposes a managed remote Chromium session; and
raw proxy products expose routing primitives. Bright Data itself recommends
starting with a pre-built scraper, then Scraper Studio, and reserving Browser API
for JavaScript rendering or interaction. [S1][S2]

**INFERENCE (high):** The best Curiosity fit is an optional provider adapter at
two seams, not a wholesale architecture: (a) bounded page fetch via Web Unlocker
and (b) asynchronous structured collection via Web Scraper/Crawl API. Browser
API is a separate, much higher-risk execution capability and should not be
silently selected as a retry tier.

**RECOMMENDATION (high):** Run a contract and legal pilot before adoption. The
public API surface is useful but internally inconsistent in places, crawl-policy
controls are under-documented, source evidence is optional or scraper-specific,
and the Master Service Agreement says Bright Data may retain data collected via
Proxy Services/Scraping Browser and use it for its own purposes. [S19]

**Overall verdict: ADAPT / DEFER.** Adapt the job, bounded-delivery, and explicit
capability patterns. Defer a provider decision until written clarification and a
no-cost contract test resolve the checks at the end of this report.

## 1. Product boundaries

| Product | Unit of work | Execution control | Native output | Best fit | Important non-fit |
|---|---|---|---|---|---|
| Web Scraper API | Inputs against a `dataset_id` (a pre-built scraper) | Bright Data owns fetch, render, unblock, parse, and scraper maintenance | Site-specific structured records in JSON/NDJSON/JSONL/CSV | Covered popular sites; entities such as profiles, products, posts, and reviews | Not a provider-neutral page fetch; schemas and accepted inputs vary by scraper [S2][S3] |
| Crawl API | Root URL(s) against a Crawl dataset ID | Bright Data owns discovery, fetch/render, transformation, and job execution | Per-page content fields such as Markdown, text, HTML, or `ld_json`, delivered through the snapshot system | Whole-domain content acquisition, SEO, migration, AI corpora | Public docs do not define crawl depth, scope, page cap, politeness, dedupe, canonicalization, or redirect policy [S4][S5] |
| Scraper Studio | Customer-defined collector | Customer defines browser/request and parsing logic; Bright Data hosts workers and delivery | Typed records plus optional system/evidence fields | Long-tail structured extraction | A programmable hosted scraper product, not the same contract as the pre-built library [S28] |
| Web Unlocker API | One target URL/request | Customer supplies URL and limited request options; provider selects proxy/fingerprint/retries/CAPTCHA/browser rendering | Raw target body, JSON envelope, Markdown transformation, or screenshot | Stateless page retrieval where interaction is unnecessary | No clicks, scrolling, form flows, persistent browser, or file downloads [S6][S7] |
| Browser API | One remote browser session, constrained to one domain | Customer drives Puppeteer/Playwright/Selenium/CDP; provider hosts browser and manages unblocking/proxy | Whatever the script reads: HTML, screenshot, downloads, DOM/network state | Dynamic or multi-step interaction | Not a crawler/extractor contract; metered traffic and arbitrary script behavior enlarge risk [S8][S9] |
| Proxy networks | Individual network connections/requests | Customer owns browser/client, rotation policy, retries, parsing, and block handling | Target response bytes | Maximum routing control | No managed extraction or outcome semantics [S10][S11] |
| Dataset Marketplace | Search/filter or purchase of already collected/on-demand datasets | Provider owns collection and curation | Dataset records and snapshot metadata | Data acquisition without running retrieval | Different freshness, provenance, licensing, and charging model; do not conflate with live retrieval [S29] |

**FACT (high):** Web Unlocker direct API and native proxy access are presented as
two access methods yielding the same result. Direct access uses a bearer key and
`POST https://api.brightdata.com/request`; native access tunnels through
`brd.superproxy.io` with zone credentials. [S6][S7]

**FACT (high):** Browser API is a remote browser protocol service. Puppeteer and
Playwright connect over CDP WebSocket on port 9222; Selenium uses WebDriver on
9515. It allows unlimited navigation only within the same domain, terminates an
idle session after five minutes, and caps a session at 60 minutes. [S8][S12]

**FACT (high):** Browser API can automatically solve CAPTCHAs, can disable or
manually invoke that behavior through custom CDP commands, supports proxy-peer
session affinity, and exposes custom domains for session ID, file download,
device emulation, ad blocking, and client certificates. [S13]

**RECOMMENDATION (high):** Model these as distinct Curiosity capabilities:
`fetch`, `render`, `interact`, `crawl`, and `extract`. Do not present them as
quality levels of one operation. Capability escalation must be policy-approved,
observable, and budgeted.

## 2. Fetch, render, discover, and extract

### Web Unlocker

**FACT (high):** The direct request body requires `zone`, `url`, and `format`
(`raw` or `json`), with optional `method`, two-letter `country`, `data_format`
(`markdown` or `screenshot`), `render`, and `debug`. `render=true` forces browser
use and may substantially increase latency. Debug mode returns an `x-brd-debug`
header containing request ID, traffic counters, billing status, destination IP,
and peer details. [S7]

**FACT (medium):** Bright Data says Web Unlocker selects a proxy network, sets
headers and fingerprints, solves challenges, retries alternative configurations,
and bills only successful requests. Custom headers/cookies require a zone option
and pre-approved values; enabling them changes billing to all attempts, including
failures. Auto-throttling begins when target success falls below a default 70%
threshold. [S6][S14]

**INFERENCE (high):** Web Unlocker is an outcome-oriented gateway, not merely a
proxy. Content verification and rejection of block pages occur behind the API,
which explains provider retries and pay-for-success accounting. This is useful
for retrieval, but “success” is the provider's operational classification, not
proof that the response is complete, current, semantically correct, or lawful.

**FACT (high):** Direct access deliberately separates transport status from
target/unlocker status: after the request reaches Unlocker, the outer response
can be HTTP 200 while `x-brd-status-code` carries 4xx/5xx. Native proxy access
uses the outer status. Unlocker errors use `x-brd-error-code`; passed-through
proxy errors use `x-brd-err-code`. A response without `x-brd-error` may be a
target-originated error page delivered as-is. [S15]

**RECOMMENDATION (high):** A Curiosity adapter must normalize all three layers:
provider transport, provider outcome, and target outcome. Never treat outer 200
as retrieval success. Preserve provider request ID and raw status headers while
redacting peer IP and credential-bearing data from ordinary logs.

### Web Scraper API

**FACT (high):** Synchronous collection uses `POST /datasets/v3/scrape`; async
uses `POST /datasets/v3/trigger`. Both require a scraper/dataset ID and accept
scraper-specific input objects, commonly URLs. The sync endpoint has a one-minute
limit and can return HTTP 202 plus a snapshot ID, converting the operation into
the asynchronous lifecycle. [S3][S16]

**FACT (high):** Async supports URL/parameter arrays or CSV input and options for
field projection, error rows, per-input/total result limits, discovery, webhook,
format, and compression. Discovery can operate from keyword, category URL,
best-sellers URL, or location where supported by that scraper. [S3]

**FACT (medium):** Public docs state up to 1 GB of batch input, 5,000 concurrent
jobs overall, and a special 100-request batch concurrency statement for
discovery. A marketing product page separately claims bulk handling “up to 5K
URLs.” These are different dimensions but not reconciled into one authoritative
limit model. [S17][S30]

**INFERENCE (high):** `dataset_id` is effectively a versionless provider-side
program/schema handle. A stable ID does not demonstrate a stable extraction
schema, parsing algorithm, target behavior, or semantics.

**RECOMMENDATION (high):** Pin and validate an expected adapter schema per
scraper. Store the dataset ID, observed field set/schema hash, request mode,
input, and provider collection timestamp with every batch. Reject or quarantine
breaking shape changes rather than accepting arbitrary records into the core.

### Crawl API

**FACT (high):** Crawl API reuses the same `POST /datasets/v3/trigger` endpoint,
snapshot ID, progress, download, and delivery machinery as Web Scraper API; its
public example uses Crawl dataset ID `gd_m6gjtfmeh43we6cqc`. Output selection is
expressed through `custom_output_fields`, with documented examples for Markdown,
HTML-to-text, page HTML, and page `ld_json`. [S4][S5]

**FACT (medium):** Product material says it maps an entire site, handles static
and dynamic content, supports scheduling and webhooks, and includes JavaScript
rendering, residential proxies, CAPTCHA solving, geotargeting, discovery, and
validation. [S4][S31]

**UNKNOWN (high importance):** No reviewed public contract defines:

- same-host versus registrable-domain versus subdomain scope;
- redirect scope and cross-domain asset behavior;
- robots policy by account/KYC mode;
- sitemap seeding, link extraction rules, depth, breadth, or page caps;
- query-parameter normalization, canonicalization, deduplication, or traps;
- per-origin pacing, crawl-delay, adaptive throttling, or user-agent identity;
- maximum bytes/page, render timeout, retry budget, or deterministic stop reason;
- incremental crawl, conditional requests, change detection, or cache semantics;
- whether one priced “request” means seed, fetched page, or delivered record.

**INFERENCE (high):** Crawl API appears externally as a specialized collector
running on the same dataset/snapshot platform, not a separate generic crawl
protocol. That explains the shared endpoint and field projection, but it also
means the generic Web Scraper OpenAPI says little about crawl safety.

**RECOMMENDATION (high):** Do not enable “entire domain” mode in Curiosity until
Bright Data supplies a written crawl contract and hard page/byte/time/depth
limits. Initial evaluation should use explicit URL lists and Curiosity-owned
budgets, not discovery.

### Browser API

**FACT (high):** Browser API runs customer automation against provider-hosted
Chromium and supports DOM interaction, screenshots, network interception,
downloads, cookies (KYC-gated in one standard-CDP example), device emulation,
country targeting, CAPTCHA events, and live DevTools inspection. [S8][S9][S13]

**FACT (high):** Session-log APIs expose session ID, API/zone name, status,
initial and final URL, navigation count, start time, duration, CAPTCHA state,
billable bandwidth, and error. [S32]

**INFERENCE (medium):** A browser-worker pool sits behind the CDP/WebDriver edge;
custom CDP domains form a control shim around Chromium, while a proxy broker
assigns or reuses a peer. The documented `no_free_workers`, `worker_disconnect`,
and `job_killed` errors support the worker-pool inference. [S12][S13]

**RECOMMENDATION (high):** If ever adopted, isolate Browser API as remote code
execution: one task/domain, short timeout, no credentials or logged-in sessions,
downloads disabled by default, destination allowlist, network egress policy,
strict output size, and separate operator approval. HTML returned by a browser
must remain untrusted external data.

## 3. Proxy and unblocking infrastructure

**FACT (high):** Documented proxy classes are:

- Residential: rotating IPv4/IPv6 real-device peers, optional sticky sessions,
  country/state/city/US ZIP/ASN/carrier targeting; vendor claims 400M+ monthly IPs
  in 195+ countries. [S10][S18]
- ISP: IPs bought or leased from ISPs but hosted on servers, intended to combine
  residential classification with datacenter stability. [S11]
- Datacenter: server-assigned addresses; vendor claims 1.6M+ IPs in 98+ countries
  and positions them as fastest/least expensive. [S11]
- Mobile also exists in pricing/product material, although it was not central to
  the reviewed scraper/browser contracts. [S33]

**FACT (high):** New Residential zones after 2026-07-07 require human-reviewed
KYC for registered companies with a corporate domain. Residential traffic is
monitored, constrained to the approved use case, and can be blocked by target
category/method. Datacenter, ISP, and Web Unlocker are documented alternatives
without Residential KYC. [S34]

**FACT (medium, vendor assertion):** Bright Data says Residential peers explicitly
opt in through approved applications, are informed how their IP is used, and are
compensated. The privacy policy also warns peers that their IP can be visible to
customers routing through it. [S10][S20]

**FACT (high):** Proxy username flags encode target country and other routing or
session choices. Shared Residential rotates by default; a session can request
stickiness. Automatic failover may substitute peers, but selected-country
constraints can instead fail. [S18]

**INFERENCE (high):** A logical zone is the central policy/billing boundary. It
binds credentials, product type, targeting defaults, custom-header permission,
premium-domain access, budgets, and compliance policy. Requests reach a common
gateway (`brd.superproxy.io` or `api.brightdata.com`), which routes to proxy,
unlocker, browser, or collector data planes.

**RECOMMENDATION (high):** Treat geo and peer class as requested constraints, not
verified facts. If location matters, preserve provider-observed exit metadata
and independently validate at sampling time. Do not expose raw peer selection or
sticky session identifiers in Curiosity's provider-neutral API.

## 4. Job, snapshot, and delivery contracts

### State machine

**FACT (high):** Trigger returns `snapshot_id`. Progress reports `starting`,
`running`, `ready`, `failed`, or `canceled`; a separate snapshot-list contract
documents a smaller set. Ready data is downloaded by snapshot ID. [S3][S21]

**FACT (high):** Download supports JSON, NDJSON/JSONL, and CSV, optional gzip,
record batching (minimum 1,000), and parts. Each request is capped at 5 GB and
results are retained for 16 days. Download before expiry or push to owned
storage. [S22]

**FACT (high):** Delivery is a second asynchronous resource with its own ID and
status. Targets include webhook, S3, GCS, Azure, GCP Pub/Sub, SFTP, Snowflake,
email/build, and Aliyun OSS; formats extend to XLSX and Parquet for some delivery
paths. Record-count splitting is supported, with a documented 5 GB maximum part.
[S23]

**FACT (high):** Stream delivery emits batches of 10 to 100,000 lines but
requires storage or webhook and is incompatible with API download. Optional
artifact fields include HTML, screenshot, and sometimes WARC. [S24]

**FACT (high):** Snapshot logs can include created time, scraper and dataset
names/IDs, size, input count, file size, duration, per-input duration, success
rate, and trigger user/IP/URL/timestamp. [S25]

**INFERENCE (high):** The public architecture has at least four durable resource
types: collector definition (`dataset_id`), collection (`snapshot_id`), delivery
job (`delivery_id`), and output parts/artifacts. Collection and delivery failure
are intentionally separate.

**RECOMMENDATION (high):** Curiosity should mirror the separation without
copying names: `RetrievalJob`, immutable `ResultManifest`, and `DeliveryAttempt`.
The terminal collection state must not imply successful downstream delivery.

### Retry, cancellation, and idempotency

**FACT (high):** The docs expose cancel-snapshot and distinguish retryable peer
or unlock failures from deterministic target/configuration failures. Scraper 429
guidance says honor `Retry-After`, otherwise exponential backoff; 25 or more 429s
from an IP in five minutes can automatically blacklist that IP. [S15][S26]

**UNKNOWN (high importance):** The reviewed trigger and delivery contracts do
not document idempotency keys, deduplication windows, webhook signatures,
delivery retry schedule, event IDs, ordering, or exactly-once semantics.

**RECOMMENDATION (high):** Assume at-least-once side effects and duplicate jobs.
Generate a Curiosity idempotency fingerprint from provider, operation, normalized
inputs, policy, and freshness window; deduplicate records and deliveries locally.
Authenticate webhooks independently and reject unsigned callbacks unless a
private contract supplies verifiable signing.

## 5. Provenance, evidence, and freshness

**FACT (high):** Example Web Scraper records include source `url`, original
`input`, and `timestamp`. Scraper Studio has optional system fields for input,
prime input, collection and request timestamps, page/job/collector IDs, crawl
type, status/error/warning codes, screenshot, full HTML, and WARC. Most evidence
fields besides `input` and errors are off by default. [S17][S28]

**FACT (high):** Snapshot metadata establishes collection request time, provider
dataset ID, status, record count, size, and sometimes cost/warnings; it does not
by itself establish each record's source URL or exact fetch time. [S25][S27]

**FACT (high):** Marketplace “freshness” is a displayed indicator of how recently
data was collected. Pre-collected and fresh-on-demand purchases differ, and
records refreshed later may cease to match a filter even though the initial
scrape remains billable. [S29][S35]

**FACT (high):** Bright Data documents validations for uniqueness, fill rate,
required fields, type/schema, stability, size fluctuation, completeness, and
duplicates. Failed checks can be overridden or thresholds changed, and a
snapshot awaiting customer approval is auto-delivered after 14 days. [S36]

**INFERENCE (high):** Provider validation is quality control, not provenance.
Markdown or structured extraction can irreversibly remove headers, DOM context,
canonical links, and byte-level evidence. A “timestamp” field may be a scraper
system field and is not guaranteed across all pre-built schemas.

**RECOMMENDATION (high):** Curiosity must wrap every provider result in its own
evidence envelope:

- requested URL and normalized URL;
- final URL and redirect chain when available;
- source domain and provider product/zone (logical name only);
- request start/end and provider collection timestamp;
- HTTP/provider statuses and content type;
- render mode, requested geo, observed geo if available;
- dataset/scraper ID and observed schema hash;
- content hash and byte length;
- extraction/transformation chain (`raw_html -> markdown`, parser/version);
- snapshot/job ID, record/input correlation, warnings, and partial flag;
- retention expiry and artifact references.

For evidentiary or replayable collection, request HTML/WARC where contractually
available and store it in Curiosity-controlled storage with retention policy.
Never infer freshness from job completion time alone.

## 6. Security, privacy, and legal boundaries

### Platform security

**FACT (medium):** Bright Data states ISO/IEC 27001:2022, ISO 27017, ISO 27018,
SOC 2 Type II (under NDA), and public SOC 3 coverage; TLS 1.3/minimum 1.2 in
transit, AES-256 at rest, AWS multi-AZ, encrypted backups, RBAC, MFA for employee
AWS access, annual penetration testing, and a secure SDLC. Certificates and the
SOC 3 report are linked publicly; detailed SOC 2 controls require NDA. [S37]

**FACT (high):** API keys support expiration and five broad permission profiles:
Admin, Finance, Ops, Limit, and User. A key is shown once and can be refreshed.
Native proxy access uses zone username/password and may require Bright Data's
TLS interception certificate. [S38]

**RECOMMENDATION (high):** Use a dedicated `User` key, expiration, one zone per
environment/capability, secret-manager storage, no credentials in URLs or logs,
and immediate rotation testing. Browser/native credentials embedded in WebSocket
or proxy URLs are especially likely to leak through exception and tracing tools.

**FACT (high):** Delivery APIs can receive long-lived cloud/storage credentials.
S3 alternatively supports role ARN plus external ID. [S23][S24]

**RECOMMENDATION (high):** Prefer short-lived role assumption and write-only
destinations. Never provide broad cloud keys, Snowflake administrator credentials,
or a webhook able to reach internal control planes.

### Privacy and data use

**FACT (high):** The privacy policy covers account/KYC data, including IDs and
possibly recorded calls; says public personal data may be collected and shared
to provide services; states retention is purpose/legal-need based rather than a
fixed period; and provides GDPR/CCPA request channels. It says Bright Data does
not rent or sell User Data, while the CCPA section says it may have sold the
category “Identifiers” in the preceding 12 months. [S20]

**FACT (high):** The public two-page DPA requires processing on documented
instructions, confidentiality, breach notice without undue delay, data-subject
assistance, deletion on request/termination subject to law, general subprocessor
authorization with seven days' notice/objection, transfer safeguards, reasonable
security, and annual-audit rights on 30 days' notice. It does not name
subprocessors or set a fixed breach-notification period. [S39]

**FACT (high, consequential):** The June 2026 MSA says for Proxy Services and
Scraping Browser API that Bright Data “may retain data Client has collected and
may use it for its own purposes in its sole discretion.” A materially similar
clause applies to Web Scraper IDE data. The MSA also disclaims accuracy,
completeness, non-infringement, security, and uninterrupted operation, limits
liability, places legal/privacy obligations on the client, and prohibits reverse
engineering or mapping Bright Data IPs. [S19]

**RECOMMENDATION (high):** This retention/reuse language is a procurement blocker
for sensitive retrieval until superseded in an order form/DPA. Require: no model
training or independent use; defined content/log/session retention; deletion SLA;
subprocessor list and regions; incident deadline; audit evidence; and ownership/
license terms for collected output and artifacts.

### Acceptable use and target rights

**FACT (high):** The AUP prohibits collection of nonpublic/behind-login data,
illegal/fraudulent/abusive use, account/content fakery, spam, ticket bots, click
fraud, and violation of law or third-party rights. Bright Data may block adult,
government, harmful, and other content at its discretion. [S40]

**FACT (high):** Immediate/no-KYC modes can enforce target `robots.txt`; some
error documentation says KYC/full access can remove that provider check. Browser
errors likewise say a robots restriction can be removed by KYC. [S12][S15]

**INFERENCE (high):** Provider permission to proceed is not legal authorization
from the target, and KYC is not a substitute for Curiosity's robots, terms,
copyright, database-right, privacy, or purpose review.

**RECOMMENDATION (high):** Curiosity should enforce its own target policy before
the provider call. Never use KYC or an unblock feature to override a Curiosity
deny decision. No login, personal-account, paywall, or access-control material
should enter this integration.

### Untrusted content and remote execution

**FACT (high):** Bright Data's own security guidance says scraped content must be
treated as untrusted before it reaches an LLM because of prompt injection. [S37]

**RECOMMENDATION (high):** Keep fetched bytes out of system/developer prompts;
label source boundaries; sanitize active content; strip scripts from display;
scan downloads; prevent retrieved instructions from invoking tools; and cap
decompression, redirects, records, recursion, and parser work.

## 7. Limits and pricing observed on 2026-08-17

Public list prices are volatile, promotional, and sometimes inconsistent. They
are evidence for metering shape, not a quote.

| Product | Observed public price/meter | Operational limits or caveats |
|---|---|---|
| Web Scraper API | Free 5K records/month; PAYG $1.50/1K successful records; $499 tier includes 384K, then $1.30/1K [S30] | Sync 1 minute then 202/snapshot; batch input up to 1 GB; 5,000 active jobs; 16-day result retention; 5 GB/download request [S16][S17][S22] |
| Crawl API | Pricing page: PAYG $1.50/1K **requests**, tiers $1.30/$1.10/$1.00; product page instead labels units **records** and shows promotional values [S31][S41] | No authoritative public crawl page/depth/byte/time limit found; shared snapshot limits appear to apply |
| Web Unlocker | Free 5K requests/month; PAYG $1.50/1K; $499 includes 383K and $1.30/1K additional; success-only unless custom headers/cookies [S42][S14] | Marketing says unlimited concurrency; auto-throttle under low success; premium domains cost more; no reviewed numeric body/timeout cap |
| Browser API | PAYG $8/GB; $499/71 GB ($7), $999/166 GB ($6), $1,999/399 GB ($5) [S43] | One domain/session; 5-minute network idle; 60-minute max; 30-second connect timeout; worker capacity can still fail despite “unlimited concurrency” marketing [S12] |
| Residential proxy | Pricing page displayed a 50%-off PAYG $4/GB versus $8 list, with commitment tiers [S33] | Bandwidth includes request/response headers and bodies; spend/traffic caps evaluated about every 15 minutes and can overshoot [S18][S33] |
| ISP / Datacenter proxy | Public plans sold static IP counts, roughly $1.30–$1.80/IP for ISP and $0.90–$1.40/IP for datacenter depending tier [S33] | Availability, targeting, and restricted targets vary; raw proxies shift retry/unblocking cost to Curiosity |

**RECOMMENDATION (high):** Normalize cost as both expected and worst-case units:
successful records, attempted requests, page fetches, browser bytes, artifact
bytes, and delivery bytes. Set Curiosity-side hard ceilings because provider
zone limits can lag and “unlimited concurrency” is not a cost boundary.

## 8. Clean-room architecture reconstruction

The following is **INFERENCE**, not a description of Bright Data private code.

```text
Customer
  |-- Bearer API -----------------------------------------------|
  |-- Zone user/password -> superproxy/CDP/WebDriver -----------|
                                                                v
                 Account / zone / policy control plane
              auth | product | KYC | geo | budget | billing
                                |
        +-----------------------+------------------------+
        |                       |                        |
  Request gateway        Browser worker pool      Collector scheduler
  (Unlocker/proxy)        (remote Chromium)        (dataset/scraper ID)
        |                       |                        |
  unblock orchestrator <-------+------------------------+
  proxy class/peer, headers, fingerprint, CAPTCHA, retry, validation
        |                                                |
        +-------------------- target web ----------------+
                                                         |
                                              records/artifacts
                                                         v
                                              snapshot store
                                        progress | logs | parts
                                                         |
                                                  delivery workers
                                API | webhook | object store | warehouse
```

Evidence for this reconstruction:

- common API and superproxy hosts plus zone-bound credentials [S7][S8][S38];
- one collection endpoint and snapshot lifecycle across scraper and crawl [S3][S5];
- worker-capacity and worker-crash browser errors [S12];
- explicit proxy errors beneath Browser/Unlocker [S12][S15];
- custom CDP control methods around ordinary Chromium [S13];
- separate collection and delivery IDs/states [S21][S23].

**INFERENCE (high):** The strongest pattern is separation of policy/control from
execution/data plane. The weakest is evidence coupling: provider-native records
and Markdown are convenient, but source proof is optional and per-collector.

## 9. Curiosity implications and verdicts

### ADOPT

1. **Asynchronous job abstraction** — accept, monitor, cancel, manifest, expire.
2. **Separate delivery state** — collection success is not delivery success.
3. **Explicit sync-to-async promotion** — a short request may yield a job handle.
4. **Bounded streaming and part manifests** — do not require a full dataset in
   memory.
5. **Typed structured errors** — distinguish policy/configuration, target,
   transient peer, capacity, and customer-code failures.
6. **Capability-based product choice** — fetch, render, interact, crawl, extract.

### ADAPT

1. **Zones** → Curiosity provider profiles, but keep credentials/operations out
   of provider-neutral request contracts.
2. **Dataset IDs** → adapter-specific extractor references plus Curiosity-owned
   version/schema validation.
3. **Provider retries** → accept only inside a Curiosity deadline, attempt, byte,
   and cost budget; retain aggregate attempt evidence where available.
4. **Markdown/JSON extraction** → useful derivatives, never the sole evidence.
5. **Geo targeting** → a request constraint with observed-evidence fields, not a
   guarantee.
6. **Success billing** → cost metadata, not semantic quality assurance.

### REJECT

1. Automatic escalation from ordinary fetch to Browser API without policy and
   budget approval.
2. Treating provider HTTP 200 or “success” as trustworthy content.
3. Provider-specific snapshot, zone, dataset, or CDP concepts in Curiosity's
   core interfaces.
4. Unbounded “crawl any domain” or discovery with undocumented stop rules.
5. Behind-login retrieval, target-account automation, or bypass of Curiosity's
   robots/rights policy.
6. Long-lived cloud credentials in delivery configuration.
7. Depending on provider retention as Curiosity's archive.

### DEFER

1. Browser API until a separate threat model, sandbox, and cost envelope exist.
2. Crawl API domain discovery until crawl policy and billing units are written.
3. Residential proxy use until KYC, peer-data, purpose, and geo requirements are
   reviewed.
4. Marketplace datasets until dataset-specific rights, lineage, freshness, and
   deletion handling are assessed.

## 10. Unknowns and pre-adoption checks

### Contract checks

- Obtain an order-form override for provider retention/reuse of collected data.
- Obtain current DPA, subprocessor list/regions, SCC mechanism, deletion SLA,
  fixed breach-notification period, and audit reports.
- Clarify output ownership, WARC/HTML rights, target terms responsibility,
  indemnity, and whether provider scraper maintenance can change schema without
  notice.

### API checks (free/no-cost only, with approved public test domains)

- Verify sync 202 shape, progress states, cancellation races, expiry, part
  manifests, empty and partial snapshots, and duplicate triggers.
- Verify target versus provider status normalization and debug-header redaction.
- Verify record-level `input`, final URL, timestamp, status, and artifact fields
  for each proposed scraper/Crawl dataset ID.
- Verify webhook authentication, retries, duplicate delivery, redirects, maximum
  body, compression, and timeout behavior.
- Verify schema-change behavior and whether a dataset ID is immutable/versioned.

### Crawl checks

- Demand written definitions for scope, page/depth/byte/time caps, robots,
  pacing, redirects, canonicalization, dedupe, traps, retries, incremental mode,
  rendering policy, and priced unit.

### Security and operations checks

- Confirm private/reserved/link-local destinations and unsafe ports are blocked
  for every chosen product, including redirect hops and browser subrequests.
- Confirm Browser session-log and Unlocker request-log retention and deletion.
- Confirm API-key resource scoping beyond broad account roles, webhook signing,
  audit logs, regional processing, and IP allowlisting.
- Load-test only under a separately approved free budget; confirm backpressure,
  429 handling, and kill switches before any production trial.

## 11. Contradictions and documentation drift

These are material because adapters and budgets must use an authoritative
contract, not marketing copy.

1. **Browser form:** one pricing FAQ says a GUI/headful browser experienced as
   headless, while a newer product FAQ says browsers are headless, then describes
   Browser API as GUI/headful elsewhere on the same page. **UNKNOWN:** actual
   launch mode/fingerprint contract. [S9][S43]
2. **Crawl pricing unit:** dedicated pricing says requests; product page says
   records. **UNKNOWN:** whether a page, seed, and output record are billed
   differently. [S31][S41]
3. **Product counts:** official pages variously say 1,000+, 1,300+, 1,466, and
   600+ scrapers/domains. Treat as changing catalog/marketing counts. [S1][S2][S30]
4. **Unlocker success:** docs headline says 98%; pricing copy says “typically
   100%.” Neither is an SLA in the reviewed material. [S6][S42]
5. **Native Unlocker port:** error docs describe 33335 while current examples use
   44445. Use control-panel connection details, not a hard-coded inferred port.
   [S7][S15]
6. **Sync input schema:** OpenAPI models an object containing `input`, while
   current examples send a top-level array. Contract test is mandatory. [S2][S16]
7. **Progress vocabulary:** one guide mentions `collecting` and `digesting`, but
   OpenAPI enumerates `starting`, `running`, `ready`, `failed`, `canceled`. Parse
   unknown states defensively. [S17][S21]
8. **“Unlimited” claims:** Browser and scraper marketing says unlimited
   concurrency, while docs expose worker exhaustion and 5,000 active-job limits.
   [S12][S17][S30]

## 12. Bounded curiosity pass

Scoring: relevance/value/novelty/cost, each 1–5. Only in-frame, public-source
threads were eligible. The pass stopped at **coverage + saturation**: primary
sources covered every requested dimension, and additional searches mostly
returned the same docs or marketing claims.

| Thread | R/V/N/C | Decision and result |
|---|---:|---|
| MSA data-retention clause | 5/5/5/1 | **Pursued.** Found consequential provider reuse language; elevated to procurement blocker. [S19] |
| Crawl stop/scope contract | 5/5/4/2 | **Pursued.** Official docs remained silent; retained as a high-priority negative result. |
| Provenance system fields/WARC | 5/5/4/2 | **Pursued.** Found fields are optional and artifacts delivery-dependent. [S24][S28] |
| DPA/subprocessors | 5/5/3/2 | **Pursued.** Read public PDF; no named subprocessor list found in reviewed public sources. [S39] |
| Browser implementation fingerprint | 2/2/3/5 | **CURIOSITY_NO_GO:** would require active fingerprinting or reverse engineering contrary to scope and MSA boundaries; public contradiction is enough for procurement check. |
| Residential peer application binaries/SDK traffic | 2/3/4/5 | **CURIOSITY_NO_GO:** unnecessary invasive reverse engineering; vendor opt-in statements were recorded as claims only. |
| Paid success-rate benchmark | 3/4/2/5 | **CURIOSITY_NO_GO:** user prohibited paid tests and target bypass; vendor claims are not treated as verified. |
| Litigation/case-law survey | 3/4/3/5 | **CURIOSITY_NO_GO:** legal landscape is broader than the declared product-contract frame; counsel review is deferred. |
| Third-party reviews/benchmarks | 2/2/2/3 | **CURIOSITY_NO_GO:** lower evidentiary value than primary contracts/docs; no need after saturation. |

## Sources

All sources are first-party Bright Data materials accessed **2026-08-17**.
Product and performance statements are vendor claims unless independently
certified in the cited material.

- **[S1]** Product selector — https://docs.brightdata.com/product-selector
- **[S2]** Web Scraper overview — https://docs.brightdata.com/datasets/scrapers/overview
- **[S3]** Async Web Scraper API — https://docs.brightdata.com/api-reference/rest-api/scraper/asynchronous-requests
- **[S4]** Crawl API overview — https://docs.brightdata.com/scraping-automation/crawl-api/overview
- **[S5]** Crawl API reference and quick start — https://docs.brightdata.com/api-reference/rest-api/scraper/crawl-api and https://docs.brightdata.com/scraping-automation/crawl-api/quick-start
- **[S6]** Web Unlocker overview — https://docs.brightdata.com/scraping-automation/web-unlocker/introduction
- **[S7]** Web Unlocker API/reference and access methods — https://docs.brightdata.com/api-reference/rest-api/unlocker/unlock-website and https://docs.brightdata.com/scraping-automation/web-unlocker/send-your-first-request
- **[S8]** Browser API introduction/configuration — https://docs.brightdata.com/scraping-automation/scraping-browser/introduction and https://docs.brightdata.com/scraping-automation/scraping-browser/configuration
- **[S9]** Browser API product page — https://brightdata.com/products/scraping-browser
- **[S10]** Residential proxy introduction — https://docs.brightdata.com/proxy-networks/residential/introduction
- **[S11]** ISP and Datacenter introductions — https://docs.brightdata.com/proxy-networks/isp/introduction and https://docs.brightdata.com/proxy-networks/data-center/introduction
- **[S12]** Browser API error catalog — https://docs.brightdata.com/scraping-automation/scraping-browser/error-codes
- **[S13]** Browser custom CDP functions — https://docs.brightdata.com/scraping-automation/scraping-browser/cdp-functions/custom
- **[S14]** Web Unlocker configuration — https://docs.brightdata.com/scraping-automation/web-unlocker/configuration
- **[S15]** Web Unlocker error catalog — https://docs.brightdata.com/scraping-automation/web-unlocker/error-codes
- **[S16]** Synchronous Web Scraper API — https://docs.brightdata.com/api-reference/scrapers/synchronous-requests
- **[S17]** Scrapers Library overview/limits — https://docs.brightdata.com/datasets/scrapers/scrapers-library/overview
- **[S18]** Residential proxy configuration — https://docs.brightdata.com/proxy-networks/residential/configure-your-proxy
- **[S19]** Master Service Agreement, updated 2026-06-16 — https://brightdata.com/license
- **[S20]** Privacy Policy, reviewed 2026-05-14 — https://brightdata.com/privacy
- **[S21]** Monitor progress — https://docs.brightdata.com/api-reference/scrapers/management-apis/monitor-progress
- **[S22]** Download snapshot — https://docs.brightdata.com/api-reference/scrapers/delivery-apis/download-snapshot
- **[S23]** Deliver snapshot — https://docs.brightdata.com/api-reference/scrapers/delivery-apis/deliver-snapshot
- **[S24]** Delivery options — https://docs.brightdata.com/datasets/scrapers/scrapers-library/delivery-options
- **[S25]** Snapshot log — https://docs.brightdata.com/api-reference/scrapers/management-apis/snapshot-data
- **[S26]** Scraper endpoint errors/rate limits — https://docs.brightdata.com/datasets/scrapers/scrapers-library/error-list-by-endpoint
- **[S27]** Marketplace snapshot metadata — https://docs.brightdata.com/api-reference/marketplace-dataset-api/get-snapshot-meta
- **[S28]** Scraper Studio input/output schema — https://docs.brightdata.com/datasets/scraper-studio/input-and-output-schema
- **[S29]** Dataset Marketplace overview/API — https://docs.brightdata.com/datasets/marketplace/overview and https://docs.brightdata.com/api-reference/marketplace-dataset-api/overview
- **[S30]** Web Scraper product/pricing — https://brightdata.com/products/web-scraper and https://brightdata.com/pricing/web-scraper
- **[S31]** Crawl product page — https://brightdata.com/products/crawl-api
- **[S32]** Browser session API — https://docs.brightdata.com/api-reference/browser-api/get-session
- **[S33]** Proxy pricing — https://brightdata.com/pricing/proxy-network
- **[S34]** Residential network access policy — https://docs.brightdata.com/proxy-networks/residential/network-access
- **[S35]** Marketplace freshness/purchase options — https://docs.brightdata.com/datasets/marketplace/fill-rates-and-statistics and https://docs.brightdata.com/datasets/marketplace/purchase-options
- **[S36]** Dataset validation — https://docs.brightdata.com/datasets/data-validation/data-validation-for-customers
- **[S37]** Security and compliance — https://docs.brightdata.com/general/security/security-overview
- **[S38]** Authentication — https://docs.brightdata.com/api-reference/authentication
- **[S39]** Data Protection Addendum (public PDF) — https://brightdata.com/static/web/Bright-Data-Data-Protection-Agreement.pdf
- **[S40]** Acceptable Use Policy — https://brightdata.com/acceptable-use-policy
- **[S41]** Crawl API pricing — https://brightdata.com/pricing/crawl-api
- **[S42]** Web Unlocker pricing — https://brightdata.com/pricing/web-unlocker
- **[S43]** Browser API pricing — https://brightdata.com/pricing/scraping-browser
