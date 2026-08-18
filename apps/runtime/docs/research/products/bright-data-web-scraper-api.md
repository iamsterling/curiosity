# Bright Data Web Scraper API: clean-room reverse-engineering dossier

**Research and source-access date:** 2026-08-17  
**Scope:** Bright Data **Web Scraper API only**: pre-built, provider-maintained
site/entity scrapers selected by `dataset_id`, their extraction contracts, job
lifecycle, snapshots, validation, and delivery. Crawl API, Web Unlocker API,
Browser API, Scraper Studio, Dataset Marketplace, and raw proxy products are out
of scope except where public Web Scraper API material identifies rendering,
unblocking, or proxy capabilities as dependencies.  
**Method and boundary:** Public first-party documentation, API references,
pricing, security material, MSA, AUP, privacy policy, and public DPA. No account,
credentials, API call, paid/free-credit test, target request, traffic capture,
private scraper code, bypass experiment, or implementation. The pre-built
scraper code is expressly unavailable to customers [S14].

## Executive verdict

**DEFER provider adoption; ADAPT the contract patterns (high confidence).** Web
Scraper API is a managed, site-specific structured-data service, not a generic
page fetcher. A `dataset_id` selects provider-maintained acquisition and parsing
behavior; `/scrape` can return records synchronously or promote to a snapshot;
`/trigger` creates a snapshot directly; and collection, snapshot storage, and
delivery are observably separate resources [S1-S8]. This is a strong optional
adapter shape for entity enrichment where a specific scraper's schema, target
rights, and evidence quality have all been approved. It is not a suitable
provider-neutral retrieval core.

The principal blockers are contractual and evidentiary, not basic API
functionality:

1. request and state schemas conflict across current first-party pages;
2. a stable `dataset_id` has no published immutable version or schema-change
   guarantee;
3. convenient structured records do not consistently carry source URL, exact
   fetch time, redirects, raw-byte hashes, extraction version, or field-level
   grounding;
4. public retention is contradictory (16 versus 30 days), callback
   authentication/retry and create idempotency are undocumented;
5. “successful record” is a billing/delivery result, not proof of freshness,
   completeness, factual accuracy, permission, or evidentiary integrity; and
6. the MSA names “Web Scraper IDE,” not “Web Scraper API,” in the clause allowing
   provider retention and discretionary reuse of collected/delivered data. The
   applicability of that consequential term to this API is therefore **UNKNOWN**
   and requires a written order-form answer [S1][S18].

**Recommended Curiosity disposition:** use no production or sensitive workload
until the contract checks at the end pass. If later approved, expose Web Scraper
API only through a provider adapter with a Curiosity-owned job, evidence,
freshness, policy, schema, and cost envelope.

## 1. Decision frame and bounded questions

The decision is:

> Can a particular pre-built Bright Data scraper safely supply bounded,
> attributable structured records to Curiosity without turning provider-specific
> dataset, snapshot, delivery, unblocking, or billing semantics into Curiosity's
> core contract?

Bounded sub-questions:

1. What do `dataset_id`, input rows, output records, projection, URL collection,
   and discovery mean?
2. What are the synchronous, asynchronous, cancellation, rerun, snapshot,
   download, and delivery states?
3. Which rendering/unblocking capabilities are bundled, and what is actually
   observable to the caller?
4. Can each record establish source, acquisition time, transformation, freshness,
   and integrity?
5. Which hard limits, billing units, privacy, security, and legal terms constrain
   adoption?
6. What logical architecture can be inferred without inspecting proprietary code
   or reproducing anti-bot techniques?
7. Which patterns should Curiosity adopt, adapt, reject, or defer?

### Evidence labels

- **FACT** — directly stated or shown by a cited first-party source.
- **INFERENCE** — a bounded clean-room explanation of documented behavior, not a
  claim about undisclosed implementation.
- **RECOMMENDATION** — a Curiosity design, governance, or procurement action.
- **UNKNOWN / NEGATIVE RESULT** — not established by the reviewed public sources.

Confidence is **high**, **medium**, or **low**. Vendor scale, performance,
security-effectiveness, freshness, and quality claims remain vendor assertions
unless the cited source itself provides independent audit evidence.

## 2. Product boundary: a catalog of typed collectors

**FACT (high):** Web Scraper API offers pre-built scrapers for known sites and
entities. The caller sends scraper-specific inputs and receives structured JSON,
NDJSON/JSONL, or CSV. Bright Data says it manages proxies, browsers, anti-bot
systems, parsing, rendering, CAPTCHA handling, and scraper maintenance [S1][S2]
[S17].

**FACT (high):** `dataset_id` is the public selector for a particular scraper/data
type. LinkedIn profiles, companies, jobs, and posts use four different IDs even
though they share one target domain and the same `/datasets/v3/scrape` endpoint.
The generic trigger schema allows arbitrary object properties because exact
inputs vary by dataset [S2][S13][S25].

**INFERENCE (high):** despite the name, `dataset_id` acts as a provider-side
**collector definition handle**, not merely a stored dataset identifier. It
resolves target scope, accepted inputs, acquisition behavior, parser, output
shape, and likely validation policy. A snapshot is the result of one execution
of that definition.

### 2.1 URL collection versus discovery

**FACT (high):** documented scraper families include:

- URL/PDP collection: retrieve a known page or entity from caller-supplied URLs;
- discovery: find entities by keyword, category URL, best-sellers URL, location,
  or another scraper-specific input; and
- discovery+PDP: discover entity URLs and then visit detail pages. “Discovery
  only” can stop after returning discovered URLs [S2][S14].

**FACT (high):** discovery requires asynchronous `/trigger`; trigger parameters
include `type=discover_new`, `discover_by`, `limit_per_input`, and an overall
`limit_multiple_results`. The permitted discovery fields remain scraper-specific
[S3][S14].

**INFERENCE (high):** discovery is bounded by returned-record parameters, but the
public generic contract does not reveal pages explored, requests attempted,
frontier ordering, deduplication, stop reason, or source coverage. A result limit
is not an acquisition-work limit.

**RECOMMENDATION (high):** authorize each `(dataset_id, mode)` pair separately.
Do not infer that approval for “collect this known URL” also approves keyword or
category discovery, which expands target requests, records, privacy exposure, and
cost.

### 2.2 Input and output shape

**FACT (high):** both sync and async surfaces accept scraper-specific object
arrays, commonly containing `url`. Async also accepts a CSV upload and documents
`custom_output_fields` as a pipe-separated projection such as
`url|about.updated_on`. Custom input fields can be declared and copied unchanged
to result rows to correlate records with caller IDs [S3][S15].

**FACT (high):** a concrete LinkedIn profile reference documents one required URL
and a large, target-specific record including nested company/experience objects,
counts, arrays, nulls, identifiers, and URLs. Its OpenAPI response schema is only
`array<object>` even though the prose/example exposes many fields [S25].

**CONTRACT CONTRADICTION (high):** current overview and tutorial examples send a
top-level JSON array, while the generic synchronous OpenAPI and current
dataset-specific LinkedIn reference model `{ "input": [...] }`. The generic sync
OpenAPI also describes a 200 response as `text/plain`, while product examples
return JSON/CSV data [S1][S4][S13][S25].

**INFERENCE (high):** documentation examples currently function as a de facto
contract beside incomplete OpenAPI schemas. Code generation from the generic
OpenAPI alone is unsafe.

**RECOMMENDATION (high):** for every approved scraper, pin an adapter contract
containing:

- `dataset_id`, collection/discovery mode, accepted input schema and URL patterns;
- exact request envelope observed in a separately authorized contract test;
- expected output schema, nullable/missing rules, and schema hash;
- required evidence fields (`input`, source URL, timestamps, errors);
- maximum fan-out and result cardinality; and
- a quarantine path for additive, missing, type-changing, or semantic drift.

Do not project away evidence fields merely to reduce payload size.

## 3. Collection and job lifecycle

### 3.1 Synchronous request with async promotion

**FACT (high):** `POST /datasets/v3/scrape` is nominally synchronous. It uses a
Bearer API key, `dataset_id`, optional field projection/error inclusion, and an
output format. A current product-specific contract permits up to 20 URLs. The
server imposes a one-minute limit; if work exceeds it, HTTP 202 returns a
`snapshot_id` for the asynchronous path [S4][S13].

**INFERENCE (high):** synchronous and asynchronous modes are two admission paths
to the same collector/snapshot machinery, not two independent extraction engines.
The client must be prepared for a type-changing response (`records` versus job
handle) even when it deliberately chose sync.

### 3.2 Asynchronous collection

**FACT (high):** `POST /datasets/v3/trigger` returns a `snapshot_id`. The caller
polls `GET /datasets/v3/progress/{snapshot_id}`, then downloads from
`GET /datasets/v3/snapshot/{snapshot_id}` once ready [S3][S5][S6].

**FACT (high):** the normative progress OpenAPI enumerates `starting`, `running`,
`ready`, `failed`, and `canceled`. Snapshot listing uses the same five states and
supports dataset, date, trigger type, and status filters [S5][S9].

**DOCUMENTATION DRIFT (high):** the library guide also says polling can return
`collecting` and `digesting`; the FAQ elsewhere lists `scheduled`, `building`,
`ready`, and `failed`; and download error docs use `building` as an intermediate
state [S2][S8][S14].

**RECOMMENDATION (high):** preserve the raw provider state, map known states into
Curiosity's state model, treat unknown nonterminal values as `provider_pending`,
and never fail merely because a new state string appears.

### 3.3 Cancellation, deadline, rerun, and retries

**FACT (high):** `POST /datasets/v3/snapshot/{id}/cancel` returns `OK`; the FAQ
says a finished snapshot cannot be canceled and a canceled run delivers no data.
The error catalog distinguishes “not running” and “not found” [S8][S10][S14].

**FACT (medium):** a `deadline` query parameter accepts an ISO instant or duration
such as `3m`. The deadline guide shows a terminal per-input error row with
`error_code: aborted_page` and “Crawl aborted on job cancel” when the deadline is
reached [S16]. This establishes a bounded execution feature, although the exact
HTTP/job-state interaction is not fully specified.

**FACT (medium):** the FAQ documents a rerun endpoint
`POST /datasets/v3/snapshot/{snapshot_id}/rerun`, but the reviewed main API
reference does not define its response, billing, identity, or whether it reuses
the original collector/schema version [S14].

**UNKNOWN (high importance):** no reviewed trigger contract documents a client
idempotency key, duplicate-submission window, exactly-once execution, attempt ID,
or safe retry rule for an ambiguous POST response. Cancellation race semantics
and whether partial results survive cancellation are also unspecified.

**RECOMMENDATION (high):** model logical job, provider snapshot, and retry attempt
separately. Persist a Curiosity submission fingerprint before dispatch; do not
blindly retry an ambiguous trigger; make cancellation best-effort; and consider a
rerun a new attempt with a new evidence manifest and budget.

### 3.4 Snapshot download and parts

**FACT (high):** ready snapshots can be downloaded as JSON, NDJSON/JSONL, or CSV,
optionally gzip-compressed. `batch_size` (minimum 1,000 records) plus `part`
splits a snapshot. A parts endpoint reports part count, but format, compression,
and batch size must match the download parameters [S6][S11].

**FACT (high):** API download is capped at 5 GB per request. The current download
guide says results are retained for 16 days [S6].

**CONTRADICTION (high):** the FAQ says snapshots are available for 30 days [S14].
Use 16 days as the conservative operational maximum until a written contract
resolves the conflict.

**CONTRADICTION (medium):** the download OpenAPI documents HTTP 409 when a
snapshot is not ready, while the endpoint error catalog documents HTTP 202 with
`status` and retry guidance [S6][S8]. A client must handle both.

### 3.5 Delivery is a separate job

**FACT (high):** `POST /datasets/v3/deliver/{snapshot_id}` accepts a delivery
configuration and returns a separate delivery `id`. Supported targets include
webhook, S3, GCS, Azure, GCP Pub/Sub, SFTP, Snowflake, email/build, and Aliyun OSS;
formats include JSON, CSV, XLSX, NDJSON/JSONL, and Parquet depending on target.
S3 supports role ARN plus external ID or access keys [S7].

**FACT (high):** `GET /datasets/v3/delivery/{delivery_id}` reports `done`,
`canceled`, or `failed` plus delivered filenames/timestamps [S12]. One ready
snapshot can be delivered to multiple destinations [S14].

**FACT (high):** streamed delivery emits batches of 10–100,000 lines and requires
storage or webhook; it is incompatible with API download. File delivery can add
HTML (documented as always available), WARC, or screenshots (not always
available), again only through storage/webhook delivery [S17].

**UNKNOWN (high importance):** reviewed public sources do not specify delivery
retry count/schedule, ordering, duplicate behavior, atomicity across parts,
webhook signature, event ID, timestamp/replay protection, destination redirect
policy, or exactly-once semantics.

**RECOMMENDATION (high):** treat delivery callbacks as untrusted, at-least-once
hints. Collection `ready` must not mean evidence was durably ingested. Prefer
pull download for a pilot; if push is approved, use a dedicated ingress endpoint,
strong independent authentication, destination allowlisting, replay/deduplication,
body/time limits, and reconciliation by polling authoritative snapshot/delivery
state.

## 4. Extraction, rendering, and unblocking dependencies

**FACT (high, product representation):** Web Scraper API pricing/product pages
say every plan includes automated proxy management, residential proxies,
JavaScript/full-browser rendering, CAPTCHA solving, geotargeting, user-agent
rotation, custom headers, validation, parsing, and discovery [S23][S24]. The
LinkedIn page similarly says the API manages proxy rotation, anti-bot bypass, and
parsing [S13].

**BOUNDARY FACT (high):** none of those components is a caller-controlled Browser
API, Unlocker API, or raw proxy contract here. The caller supplies entity inputs
to a pre-built scraper and receives records/snapshots. The pre-built scraper's
underlying code cannot be viewed or modified [S14].

**INFERENCE (medium-high):** a provider-owned acquisition planner can select
HTTP/browser execution, proxy/geo identity, challenge handling, retries, and
target-specific parsing behind the collector definition. Public materials do not
establish that the separately sold Browser API or Web Unlocker API is literally
invoked internally; they establish only equivalent bundled capabilities.

**UNKNOWN / NEGATIVE RESULT (high confidence):** the reviewed Web Scraper API
response contract does not guarantee disclosure of:

- whether a particular record used HTTP or browser rendering;
- browser/runtime version, viewport, locale, or action sequence;
- chosen proxy class, exit IP/geo, session, user agent, or fingerprint;
- CAPTCHA occurrence or handling;
- attempt/retry count, origin status, headers, redirect chain, or fetch timing;
- provider cache disposition for every scraper/mode; or
- the parser build/version that produced each field.

**RECOMMENDATION (high):** do not call opaque unblocking “provenance” or “source
truth.” It may improve delivery success but cannot establish permission,
freshness, completeness, factual accuracy, or representativeness. Curiosity must
authorize target/mode before dispatch and retain `execution_details_unknown`
where the provider does not disclose them.

## 5. Provenance, freshness, validation, and quality

### 5.1 What evidence exists

**FACT (medium-high):** some official examples contain result `url`, original
`input`, and a `timestamp`; custom input fields can round-trip a Curiosity
correlation ID [S2][S15]. Snapshot listing/logging can expose snapshot ID,
request-created time, dataset/scraper IDs and names, input and record counts,
file size, duration, per-input duration, success rate, and trigger user/IP/URL
[S9][S20].

**FACT (high):** raw page HTML can be requested through file delivery; WARC and
screenshot availability is scraper-dependent [S17].

**LIMITATION (high):** these fields are not a uniform record contract. The
current dataset-specific LinkedIn profile example omits `timestamp` and original
`input`, while another generic example includes them. Snapshot creation time is
job admission time, not necessarily each page's fetch time. “Raw HTML” is not
documented as original wire bytes with headers/TLS/redirect metadata [S2][S20]
[S25].

### 5.2 Freshness claims and gaps

**FACT (medium, vendor assertion):** the generic FAQ says URL-input scrapers up to
20 inputs return fresh data without cache. Current LinkedIn documentation says
every request triggers a live scrape and returns no cached or stale data [S13]
[S14]. Similar claims exist on several current site-specific scraper pages, but
they are product representations rather than per-record origin evidence.

**UNKNOWN / NEGATIVE RESULT (high confidence):** no reviewed generic contract
defines a cache key, cache-bypass parameter, origin-contact proof, cache
disposition, revalidation semantics, provider `Age`, stale-on-error behavior,
exact page fetch timestamp, or freshness SLA across every async/discovery
scraper. Source publication timestamps, when extracted, are target fields and not
acquisition timestamps.

**RECOMMENDATION (high):** record separately:

- `submitted_at`, provider snapshot creation, `received_at`, and record-reported
  collection/publication times;
- freshness claim (`provider_live_claim`) versus evidence (`origin_observed_at`,
  often unavailable);
- source and normalized URLs, dataset ID, schema hash, record/content hash;
- input/correlation ID, collection mode, error/partial state, and artifact links;
- provider/adapter version and transformation chain; and
- `cache_disposition: unknown` unless a chosen scraper contract proves otherwise.

Never derive freshness solely from snapshot completion or download time.

### 5.3 Validation is not provenance

**FACT (high):** Bright Data documents checks for uniqueness, fill rate, required
fields, type/schema, stability, minimum records, size fluctuation, record
completeness, and duplicate identity. Failed checks can be fixed, overridden,
threshold-adjusted, temporarily ignored, or rejected; a snapshot pending customer
approval is automatically delivered after 14 days [S19].

**INFERENCE (high):** validation measures conformance and distribution-level
quality, not truth or lineage. An overridden fill-rate check does not ground a
field in source bytes; uniqueness does not prove entity identity; schema validity
does not prove semantic accuracy.

**RECOMMENDATION (high):** preserve provider warnings and validation disposition,
then run Curiosity-owned schema, evidence, domain, duplicate, semantic, and
freshness checks. A provider success rate must never be the sole ingestion gate.

## 6. Limits and economics observed on 2026-08-17

Public prices and promotions are volatile; this section records the observed
meter and contradictions, not a quote.

| Dimension | Published value / caveat |
|---|---|
| Sync | Current site-specific docs: up to 20 URLs; one-minute server limit, then HTTP 202 plus snapshot [S4][S13]. |
| Async input | Generic batch input up to 1 GB; LinkedIn/product pages say up to 5,000 URLs, but this is not established as universal for every scraper [S2][S13][S24]. |
| Active jobs | 5,000 concurrent jobs/snapshots; 429 beyond the limit. Discovery documentation separately mentions up to 100 batch requests [S2][S8]. |
| 429 behavior | Honor `Retry-After`, otherwise exponential backoff. 25+ 429s from one IP in five minutes can blacklist that IP; warning begins at 10 [S8]. |
| Pull download | 5 GB/request, minimum part size 1,000 records, retention stated as 16 days [S6]. |
| Push/files | Library table says webhook 1 GB, API delivery unlimited in total; each delivered file/batch has a 5 GB hard maximum [S2][S7][S14]. |
| Stream | 10–100,000 lines per batch; storage/webhook only [S17]. |
| Snapshot list | Default 1,000, maximum 5,000 rows per list call [S9]. |
| Retention contradiction | Download guide: 16 days; FAQ: 30 days [S6][S14]. |

**FACT (high):** the pricing page body showed a 5,000-record monthly free tier,
PAYG at **$1.50/1,000 records**, and a **$499/month** tier with 384,000 included
records and **$1.30/1,000** additional. It says charging is per successfully
delivered record and failed deliveries are not charged [S23].

**CONTRADICTION (high):** the same page navigation advertised promotional pricing
starting at $0.75/1,000, while the FAQ said pricing starts at $0.70/1,000 and
clarified that failures caused by incorrect caller inputs may still be billed
[S14][S23]. “Pay only for success” is therefore qualified and must not be used as
a complete cost rule.

**INFERENCE (high):** record billing makes discovery fan-out and one-to-many
scrapers economically different from one-URL/one-record collection. A returned
record can be billable even when optional fields are null, stale at the source,
semantically wrong, duplicative, or unusable for Curiosity.

**RECOMMENDATION (high):** admission must cap inputs, expected/maximum records,
discovery fan-out, bytes, deadline, concurrent snapshots, delivery parts, and USD.
Reconcile provider records/cost after completion. “Unlimited concurrency” on the
pricing page is marketing shorthand contradicted by the documented 5,000-active-
job ceiling [S2][S23].

## 7. Security, privacy, and legal boundaries

This section reports public terms and controls, not legal advice.

### 7.1 Authentication, secrets, and delivery egress

**FACT (high):** Web Scraper API uses a Bearer API key. Keys can expire and have
five broad profiles: Admin, Finance, Ops, Limit, and User. Each user has one key;
keys are shown once and can be refreshed [S21].

**FACT (high):** delivery configurations can contain cloud access keys, GCS
private keys, Azure keys/SAS tokens, SFTP passwords/SSH keys, or Snowflake
passwords. S3 alternatively supports role assumption with external ID [S7].

**UNKNOWN (high importance):** public authentication docs do not establish a
Web-Scraper-only key scope, per-`dataset_id` grants, source IP allowlisting for API
keys, webhook signatures, customer-managed encryption keys, or regional
processing for a chosen account.

**RECOMMENDATION (high):** use a dedicated expiring `User` key in a secret
manager; separate environments/accounts where possible; redact bearer keys,
snapshot trigger URLs, user/IP logs, and delivery secrets. Prefer pull download
or S3 role assumption into a write-only prefix. Never send broad cloud or
warehouse credentials, and do not let an agent choose arbitrary webhook/storage
destinations.

### 7.2 Published security posture

**FACT (medium):** Bright Data reports ISO/IEC 27001:2022, ISO 27017, and ISO
27018 certificates; SOC 2 Type II under NDA and public SOC 3; TLS 1.3/minimum 1.2,
AES-256 at rest, AWS multi-AZ, RBAC, employee MFA, secure SDLC, backups, and
annual penetration testing. Its 2025 penetration-test scope expressly included
Web Scraper IDE, Marketplace, and API [S22]. Certification/control statements do
not establish Curiosity-specific configuration or payload retention.

**FACT (high):** Bright Data itself warns that scraped web content is untrusted
input and should be validated/filtered before entering an LLM prompt [S22].

**RECOMMENDATION (high):** all records, URLs, HTML/WARC, screenshots, filenames,
errors, and callback fields remain `untrusted_external_data`. Enforce byte/record/
nesting/decompression limits, schema validation, active-content neutralization,
prompt-injection isolation, and destination policy before use.

### 7.3 Personal data and DPA

**FACT (high):** the privacy policy says Bright Data collects account/KYC data,
may collect and share publicly posted personal data to provide services, uses
purpose/legal-need rather than fixed retention, and supports GDPR/CCPA request
channels. It says it does not rent or sell **User Data**, while its CCPA notice
says it may have sold “Identifiers” in the preceding 12 months [S26].

**FACT (high):** the public DPA requires documented instructions,
confidentiality, assistance with data-subject and breach obligations, breach
notice without undue delay, deletion on request/termination subject to law,
reasonable security, general subprocessor authorization with seven days' notice
and objection, transfer safeguards, and an annual audit right on 30 days' notice
[S27]. It does not provide a named subprocessor list, fixed deletion period, or
fixed breach-notification hours.

**RECOMMENDATION (high):** treat social-profile, review, job, and marketplace
entity data as potentially personal even when public. Require purpose/lawful-
basis review, minimization, field allowlists, data-subject correction/deletion
handling, retention limits, and jurisdiction-specific counsel where applicable.
Do not ingest sensitive attributes merely because a scraper returns them.

### 7.4 Service terms and source rights

**FACT (high):** the AUP prohibits collecting nonpublic/behind-login information,
illegal/fraudulent/abusive use, fake engagement/accounts, ticket bots, spam, and
third-party-rights violations. Bright Data can block categories or suspend use
at its discretion [S28].

**FACT (high):** the MSA makes the client responsible for law, privacy, and
third-party rights; prohibits using Data Services data to offer a similar or
competitive product; disclaims accuracy, completeness, non-infringement,
security, and uninterrupted operation; limits liability; and assigns broad
client indemnity for third-party claims [S18].

**MATERIAL UNKNOWN (high):** the MSA's specific-service section calls the managed
collector product **“Web Scraper IDE”** and allows Bright Data to retain data it
collected or delivered and use it for its own purposes in its sole discretion.
Public product/docs now distinguish Web Scraper API from Scraper Studio/IDE, and
the MSA does not expressly say “Web Scraper API” in that clause [S1][S18]. It is
unsafe either to assume the clause applies or to assume the API is exempt.

**RECOMMENDATION (high):** require an order form that expressly covers Web Scraper
API and states: no independent reuse/model training; exact payload/input/log/
artifact/backup retention; deletion SLA; regions/subprocessors; output ownership
and internal redistribution rights; schema-change notice; incident deadline; and
rights to preserve HTML/WARC as evidence. Provider technical access, KYC, or
successful delivery never substitutes for Curiosity's robots, target-terms,
copyright/database-right, privacy, and purpose decisions.

## 8. Clean-room logical architecture

The following is **INFERENCE**, not a claim about Bright Data source code,
services, databases, or deployment topology.

```text
Curiosity adapter
  -> Bearer-authenticated API gateway / admission controls
       -> dataset_id resolver
            collector definition + accepted input + output schema/policy
       -> synchronous wait path ---------------------------+
       -> asynchronous scheduler -> collection attempt(s)  |
              -> target-specific acquisition planner       |
                   HTTP/render | geo/proxy | challenge/retry|
              -> target web                                 |
              -> parser / record shaper / validation -------+
                                   |
                                   v
                            snapshot/result store
                    progress | log | input | parts | expiry
                                   |
                         +---------+----------+
                         |                    |
                      API pull          delivery workers
                                  webhook | object store | warehouse
```

Evidence supporting this logical decomposition:

- one endpoint plus `dataset_id` selects multiple target/entity contracts [S3]
  [S13][S25];
- sync can promote to the same snapshot lifecycle as async [S4][S5];
- collection has a snapshot ID/state/log while delivery has a different ID/state
  [S5][S7][S12][S20];
- provider product material bundles acquisition/render/unblocking/parser behavior
  but exposes structured records rather than those controls [S13][S23]; and
- durable snapshots can be downloaded, parted, rerun, or delivered after worker
  execution [S6][S11][S14].

**INFERENCE (high):** the cleanest reusable pattern is separation of collector
definition, collection attempt, immutable result manifest, and delivery attempt.
The weakest pattern is that evidence is optional and schema-specific while the
collector definition is provider-maintained and apparently versionless.

## 9. Curiosity decision ledger

### ADOPT

1. **Sync-to-async promotion.** A short synchronous request may return a durable
   job handle without losing correlation.
2. **Definition / attempt / result separation.** Extractor identity, job attempt,
   snapshot, and downstream delivery are distinct resources.
3. **Explicit terminal and partial/error records.** Preserve per-input failures,
   not only aggregate job success.
4. **Parted pull and bounded streaming.** Ingest large result sets incrementally
   with immutable manifests and checksums.
5. **Separate collection and delivery state.** A ready collection is not a
   successful Curiosity ingest.
6. **Caller correlation fields.** Round-trip a non-secret Curiosity operation ID
   where the scraper contract supports it.

### ADAPT

1. **`dataset_id` → namespaced adapter extractor reference**, never a core API
   field; attach Curiosity-owned schema/version expectations.
2. **Provider validation → one quality signal**, supplemented by source evidence,
   semantic checks, drift detection, and quarantine.
3. **Discovery → separately authorized fan-out**, with hard record/cost/deadline
   ceilings and an explicit incomplete-coverage state.
4. **Provider deadlines/cancel → owned budgets**, where cancellation is
   best-effort and late/partial outputs remain reconcilable.
5. **HTML/WARC artifacts → derivation evidence**, content-addressed and retained
   under Curiosity policy; never assume “raw HTML” is a complete wire capture.
6. **Live/fresh claim → typed uncertainty**, preserving provider assertion
   separately from observable origin/cache evidence.

### REJECT

1. Web Scraper API resources (`dataset_id`, `snapshot_id`, delivery ID/state) as
   Curiosity's provider-neutral ABI.
2. Provider `ready`, “success,” HTTP 200, validation pass, or billable record as
   proof of accuracy, freshness, completeness, rights, or evidence validity.
3. Automatic escalation into opaque rendering/residential/CAPTCHA capability
   without target policy and budget approval.
4. Agent-controlled scraper ID, discovery mode, webhook URL, cloud credentials,
   output projection, or record limit.
5. Depending on provider snapshot retention as Curiosity's archive.
6. Broad social/personal-data collection simply because a pre-built scraper
   exists.
7. Blind retries of trigger/delivery POSTs or assumptions of exactly-once
   callback behavior.

### DEFER

1. Any production adapter until contract/DPA, retention/reuse, schema/version,
   callback, and source-rights checks pass.
2. Any discovery scraper until its exact fan-out, priced-record, coverage, and
   stop semantics are validated.
3. Sensitive/personal-data workloads until purpose, lawful basis, rights handling,
   region/subprocessor, and deletion controls are approved.
4. Push/cloud delivery until callback authenticity or least-privilege destination
   access and duplicate/reconciliation behavior are proven.
5. Evidentiary use until a chosen scraper consistently supplies source URL,
   acquisition time, errors, and HTML/WARC with a Curiosity-owned hash chain.

## 10. Proposed provider-neutral evidence envelope

**RECOMMENDATION (high):** an approved adapter should return at least:

```text
logical_job_id, attempt_id, provider, adapter_version
extractor_ref, provider_dataset_id, expected_schema_hash, observed_schema_hash
input_correlation_id, requested_input, collection_mode
submitted_at, provider_snapshot_created_at, received_at
source_url?, final_url?, redirect_chain?
provider_live_claim, origin_observed_at?, cache_disposition
transport_outcome, collection_outcome, extraction_outcome, delivery_outcome
record_hash, artifact_hashes[], media_types[], byte_lengths[]
html_ref?, warc_ref?, screenshot_ref?, artifact_availability
warnings[], error_code?, partial, truncation_flags[]
validation_disposition, provenance_completeness
policy_decision_id, rights_review_id, retention_until, cost_units
untrusted_external_data=true
```

Question marks are explicit unavailable fields. They must not be guessed from
snapshot completion time or marketing claims.

## 11. Unknowns and pre-adoption checks

### Contract and privacy

1. Confirm in writing whether the MSA's Web Scraper IDE retention/reuse clause
   applies to pre-built Web Scraper API, and supersede it with no independent use
   or training.
2. Obtain current order form, DPA annexes, named subprocessors/regions, transfer
   mechanism, fixed incident deadline, payload/log/artifact/backup retention, and
   deletion evidence.
3. Clarify output ownership/license, internal redistribution, derived indexes,
   preservation of source HTML/WARC, target complaint/deletion handling, and
   schema-change notice.

### Per-scraper contract (no paid test; only separately authorized benign fixtures)

4. Resolve top-level array versus `{input: [...]}` request shape and 200 response
   media type against the current production schema.
5. Verify required input fields, accepted URL hosts/patterns, sync URL maximum,
   async input/record maximum, one-to-many cardinality, and discovery fan-out.
6. Verify stable presence and semantics of input correlation, source/final URL,
   collection timestamp, target errors, null/missing fields, warnings, and
   per-record identity.
7. Establish whether `dataset_id` is versioned or mutable, how schema changes are
   announced, and whether old schemas/extractors can be pinned.
8. Verify sync 202 shape; every observed state; cancel/deadline races; rerun
   identity/billing; empty/partial snapshot; expiry; 202 versus 409 download; and
   duplicate trigger behavior.

### Delivery, safety, and operations

9. Obtain webhook signing/replay/retry/order/duplicate semantics; confirm notify
   versus data-webhook payloads and maximum compressed/uncompressed size.
10. Confirm SSRF/redirect protections for target inputs, webhook/storage endpoints,
    and any rendered subresources; confirm forbidden private/reserved/link-local
    destinations and unsafe ports.
11. Verify API-key scope, audit logs, IP restrictions, rotation, destination-secret
    redaction, and S3 role-assumption behavior.
12. Verify HTML/WARC/screenshot availability and whether HTML is response bytes or
    serialized/normalized content; preserve hashes after pull.
13. Reconcile billing for bad caller input, error rows, duplicate/multi-record
    outputs, canceled/deadline snapshots, reruns, and partial delivery.
14. Use Curiosity-side kill switches and conservative ceilings below provider
    limits; never rely on delayed monthly spend controls or “unlimited” marketing.

## 12. Documentation contradictions and retained negative results

| Topic | First-party evidence | Safe treatment |
|---|---|---|
| Sync body | Top-level array in overview/tutorial; `{input:[...]}` in generic and dataset-specific OpenAPI [S1][S4][S25] | Contract-test chosen scraper; do not codegen blindly. |
| Sync 200 | Product says JSON/CSV records; generic OpenAPI says `text/plain` [S1][S4] | Negotiate by status and content type; validate body. |
| Progress states | `starting/running/ready/failed/canceled` versus `collecting/digesting` and `scheduled/building` [S2][S5][S14] | Preserve unknown provider states. |
| Not-ready download | HTTP 409 in OpenAPI versus HTTP 202 in error catalog [S6][S8] | Handle both as nonterminal. |
| Snapshot retention | 16 days in current download guide versus 30 days in FAQ [S6][S14] | Export immediately; budget to 16 days. |
| Concurrency | Pricing says unlimited; library says 5,000 active snapshots [S2][S23] | 5,000 is a ceiling, not a safe target. |
| Async volume | Generic input is 1 GB; site/product pages say up to 5,000 URLs [S2][S13][S24] | Treat as separate and scraper-specific dimensions. |
| Price | Body PAYG $1.50/1K; promotion/nav $0.75; FAQ “starting” $0.70 [S14][S23] | Dashboard/order form is authoritative at purchase. |
| Billing failure | “No charges for failed deliveries” versus caller-caused failures billable [S14][S23] | Budget all submitted inputs; reconcile actual charge. |
| Freshness | Live/no-cache claims, but no generic cache disposition or origin proof [S13][S14] | Preserve claim; mark evidence unknown. |
| Legal product name | MSA says Web Scraper IDE; current product is Web Scraper API [S1][S18] | Written applicability/override required. |

Additional **negative results** from reviewed public sources:

- no trigger idempotency key or duplicate-submission guarantee;
- no cryptographic webhook-signature contract;
- no provider-wide immutable scraper/extractor version;
- no guaranteed per-record redirect/origin-status/header/retry/render/geo ledger;
- no generic field-to-source grounding or record/artifact cryptographic binding;
- no complete callback retry/order/duplicate specification;
- no public exact target-policy/robots behavior per pre-built scraper; and
- no empirical quality, latency, availability, legal-compliance, or cost result
  because tests and credentials were explicitly outside authority.

## 13. Bounded curiosity pass

Scoring is relevance/value/novelty/cost from 1 (low) to 5 (high). Only public,
first-party, in-frame threads were eligible. The pass stopped at **coverage plus
saturation**: every requested dimension is covered, while remaining material
unknowns require a contract or separately authorized test rather than more
speculation.

| Thread | R/V/N/C | Decision and result |
|---|---:|---|
| Does `dataset_id` pin code/schema? | 5/5/4/2 | **Pursued.** Concrete references bind IDs to scraper types, but no immutable version/pinning guarantee was found; retained as a blocker. |
| Can records prove source and freshness? | 5/5/4/2 | **Pursued.** Found optional/example URL/input/timestamp and HTML/WARC delivery, but no uniform fetch-time/cache/redirect/hash/grounding contract. |
| Is collection separate from delivery? | 5/5/3/1 | **Pursued.** Distinct snapshot and delivery IDs/states confirmed [S5][S7][S12]. |
| Retention and state contradictions | 5/5/4/1 | **Pursued.** 16/30-day and state/status conflicts retained rather than normalized away. |
| Does the MSA reuse clause cover this API? | 5/5/5/2 | **Pursued to public-source exhaustion.** Product naming does not resolve applicability; written override/check required. |
| Hidden pre-built scraper source/algorithms | 1/1/4/5 | **CURIOSITY_NO_GO:** proprietary code is unavailable; inspection/reconstruction is outside access and clean-room boundaries [S14][S18]. |
| CAPTCHA, proxy, or fingerprint reproduction | 2/1/4/5 | **CURIOSITY_NO_GO:** bypass-adjacent, unnecessary to assess the public contract, and outside scope. |
| Live success/quality/latency benchmark | 4/4/3/5 | **CURIOSITY_NO_GO:** caller prohibited credentials, paid tests, and API/target calls; vendor claims remain unverified. |
| Jurisdiction-specific scraping legality | 5/5/4/5 | **CURIOSITY_NO_GO:** needs target, purpose, data, and jurisdiction facts plus counsel; public terms are reported, not converted into legal advice. |
| Broader Crawl/Unlocker/Browser/proxy comparison | 1/2/2/3 | **CURIOSITY_NO_GO:** explicitly excluded except dependency boundary; separate products would dilute the decision. |

No live autonomous follow-up is authorized beyond this declared frame.

## Sources

All sources are first-party Bright Data materials accessed **2026-08-17**.
Product, freshness, scale, success, and security-effectiveness statements are
attributed vendor claims unless the cited document supplies audit evidence.

- **[S1]** Bright Data, “Scrapers.” <https://docs.brightdata.com/datasets/scrapers/overview>
- **[S2]** Bright Data, “Scrapers library overview.” <https://docs.brightdata.com/datasets/scrapers/scrapers-library/overview>
- **[S3]** Bright Data, “Scraper async requests,” OpenAPI for `POST /datasets/v3/trigger`. <https://docs.brightdata.com/api-reference/rest-api/scraper/asynchronous-requests>
- **[S4]** Bright Data, “Synchronous requests,” OpenAPI for `POST /datasets/v3/scrape`. <https://docs.brightdata.com/api-reference/scrapers/synchronous-requests>
- **[S5]** Bright Data, “Monitor progress.” <https://docs.brightdata.com/api-reference/scrapers/management-apis/monitor-progress>
- **[S6]** Bright Data, “Download snapshot.” <https://docs.brightdata.com/api-reference/scrapers/delivery-apis/download-snapshot>
- **[S7]** Bright Data, “Deliver snapshot to storage or webhook.” <https://docs.brightdata.com/api-reference/scrapers/delivery-apis/deliver-snapshot>
- **[S8]** Bright Data, “Error codes by endpoint.” <https://docs.brightdata.com/datasets/scrapers/scrapers-library/error-list-by-endpoint>
- **[S9]** Bright Data, “Get snapshots.” <https://docs.brightdata.com/api-reference/scrapers/management-apis/get-snapshots>
- **[S10]** Bright Data, “Cancel snapshot.” <https://docs.brightdata.com/api-reference/scrapers/management-apis/cancel-snapshot>
- **[S11]** Bright Data, “Get snapshot delivery parts.” <https://docs.brightdata.com/api-reference/scrapers/management-apis/get-snapshot-delivery-parts>
- **[S12]** Bright Data, “Monitor delivery.” <https://docs.brightdata.com/api-reference/scrapers/management-apis/monitor-delivery>
- **[S13]** Bright Data, “LinkedIn Scraper API” and “Send your first LinkedIn API request.” <https://docs.brightdata.com/datasets/scrapers/linkedin/introduction>, <https://docs.brightdata.com/datasets/scrapers/linkedin/send-first-request>
- **[S14]** Bright Data, “Scrapers FAQs.” <https://docs.brightdata.com/datasets/scrapers/scrapers-library/faqs>
- **[S15]** Bright Data, “Custom inputs.” <https://docs.brightdata.com/datasets/scrapers/scrapers-library/custom-inputs>
- **[S16]** Bright Data, “Deadline feature.” <https://docs.brightdata.com/datasets/scrapers/scrapers-library/deadline-feature>
- **[S17]** Bright Data, “Delivery options” and “Streamed and file delivery.” <https://docs.brightdata.com/datasets/scrapers/scrapers-library/delivery-options>, <https://docs.brightdata.com/datasets/scrapers/scrapers-library/stream-and-file-delivery>
- **[S18]** Bright Data, “Master Service Agreement,” updated 2026-06-16. <https://brightdata.com/license>
- **[S19]** Bright Data, “Data validation for customers.” <https://docs.brightdata.com/datasets/data-validation/data-validation-for-customers>
- **[S20]** Bright Data, “Get snapshot log.” <https://docs.brightdata.com/api-reference/scrapers/management-apis/snapshot-data>
- **[S21]** Bright Data, “Authentication.” <https://docs.brightdata.com/api-reference/authentication>
- **[S22]** Bright Data, “Security & compliance.” <https://docs.brightdata.com/general/security/security-overview>
- **[S23]** Bright Data, “Web Scraper API Pricing.” <https://brightdata.com/pricing/web-scraper>
- **[S24]** Bright Data, “Web Scraping API” product page. <https://brightdata.com/products/web-scraper>
- **[S25]** Bright Data, “Collect LinkedIn profiles by URL,” dataset-specific API reference. <https://docs.brightdata.com/api-reference/scrapers/social-media-apis/linkedin-profiles-collect-by-url>
- **[S26]** Bright Data, “Privacy Policy,” reviewed 2026-05-14. <https://brightdata.com/privacy>
- **[S27]** Bright Data, “Data Protection Addendum,” public PDF. <https://brightdata.com/static/web/Bright-Data-Data-Protection-Agreement.pdf>
- **[S28]** Bright Data, “Acceptable Use Policy.” <https://brightdata.com/acceptable-use-policy>

## Confidence summary

- **High:** documented endpoints, IDs, formats, nominal states, sync promotion,
  snapshot/delivery separation, published file/job limits, current price-page
  body, authentication options, and public legal text.
- **Medium:** logical architecture; exact deadline/rerun behavior; vendor
  assertions about no-cache freshness, bundled rendering/unblocking, validation
  effectiveness, and security controls not independently tested here.
- **Low/unknown:** immutable collector/schema version, callback guarantees,
  idempotency, cache/origin evidence across all modes, exact per-record execution
  details, payload/log retention, MSA reuse-clause applicability to this API,
  empirical accuracy/availability/latency, and actual charged cost for a chosen
  scraper.
