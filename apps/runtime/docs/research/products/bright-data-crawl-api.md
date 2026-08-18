# Bright Data Crawl API: clean-room contract reverse engineering

**Research and source-access date:** 2026-08-17

**Status:** product research; not an implementation, benchmark, legal opinion,
purchase authorization, or authorization to crawl a target.

**Exclusive scope:** Bright Data **Crawl API** and the shared snapshot/delivery
machinery it invokes. Other Bright Data products appear only where an official
source creates a dependency or a boundary that must not be misattributed.

**Access boundary:** public first-party documentation, product/pricing pages,
security materials, Master Service Agreement (MSA), Privacy Policy, Acceptable
Use Policy (AUP), and public DPA only. No account, Control Panel, credential,
free or paid API call, target crawl, traffic capture, bypass, proprietary code,
or private material was used.

## Executive verdict

**DEFER Bright Data Crawl API as a Curiosity crawl provider; ADAPT its durable
job and delivery patterns (high confidence).** The service has a compact async
boundary: submit URL inputs with a required Crawl `dataset_id`, receive a
`snapshot_id`, poll, cancel or rerun, then download or separately deliver the
result. Bright Data markets whole-domain mapping, static/dynamic acquisition,
JavaScript rendering, residential proxies, CAPTCHA solving, geotargeting,
discovery, validation, scheduling, and high concurrency [S1-S5].

The public crawl contract does **not** expose the controls needed to authorize
or bound that work. It defines no host/subdomain/redirect scope, depth, breadth,
page/byte/time ceiling, path filter, sitemap policy, robots identity or decision,
origin pacing, canonicalization, deduplication, trap defense, retry budget,
incremental mode, or priced-unit definition. Even the central input semantics
are unresolved: product copy says “define the root URL” and map an entire site,
while the API example supplies an array of explicit page URLs. There is no
public statement of how either input seeds the frontier [S1-S4].

The evidence boundary is also too thin for an owned retrieval plane. Crawl can
return convenient Markdown, text, HTML, or `ld_json`, and the shared platform
retains job/input/log metadata. But the public Crawl schema does not promise a
per-page fetch time, requested/final URL pair, redirect chain, source status and
headers, robots decision, parent edge/depth, render mode, attempt history,
content hash, canonical identity, duplicate relation, transform version, or
completeness reason [S2-S4, S8-S13].

**Decision:**

- **ADOPTED:** durable asynchronous jobs; collection state separate from
  delivery state; cancellation; immutable run handles; input retrieval; bounded
  multipart download; explicit retention expiry.
- **ADAPTED:** provider dataset IDs as adapter-private collector references;
  rerun as a new job rather than mutation; provider derivatives as untrusted
  convenience outputs wrapped in Curiosity provenance.
- **REJECTED:** “crawl any domain” without hard caller-visible scope and work
  limits; marketing “compliance” as a robots or rights guarantee; provider
  `ready` as proof of complete or trustworthy acquisition.
- **DEFERRED:** any provider trial or adoption until Bright Data supplies a
  written Crawl-specific contract and pricing definition and a separately
  authorized, no-cost fixture test verifies it.

## 1. Decision frame, bounded questions, and evidence rules

### 1.1 Decision

Which observable Bright Data Crawl API contract ideas should Curiosity adopt,
adapt, reject, or defer while retaining provider-neutral policy, bounded crawl
authority, trustworthy evidence, cost control, and an owned crawl path?

### 1.2 Bounded sub-questions

1. What request, collector, snapshot, state, cancellation, rerun, download, and
   delivery contracts are public?
2. What does a URL input authorize: one page, a root, a site, a domain, or an
   opaque provider-defined discovery run?
3. What is evidenced about frontier order, scope, robots, politeness, redirects,
   retries, deduplication, canonicalization, and termination?
4. How are JavaScript rendering, unblocking, proxies, CAPTCHA solving,
   geotargeting, extraction, and validation selected and evidenced?
5. Can outputs establish source provenance, freshness, completeness, and replay?
6. Which limits, prices, privacy/security controls, and legal terms constrain a
   Curiosity integration?
7. What minimal architecture can be inferred without claiming Bright Data's
   proprietary implementation?

### 1.3 Labels and method

- **FACT** — directly stated or structurally present in a cited first-party
  source.
- **INFERENCE** — the narrowest clean-room conclusion consistent with facts;
  not a claim about private code, algorithms, or deployment.
- **UNKNOWN** — material behavior not established by the inspected sources.
- **RECOMMENDATION** — a Curiosity design, evaluation, or procurement action.
- Confidence is **high**, **medium**, or **low**. Marketing performance and
  scale claims remain vendor assertions even when accurately cited.

The source budget covered all caller-requested dimensions and one bounded
curiosity pass. The official documentation index and complete public docs corpus
were searched for Crawl-specific controls as well as likely synonyms [S19]. Product
claims were checked against the dedicated Crawl OpenAPI and the shared
scraper/snapshot contracts. Cross-product behavior was not transferred to Crawl
without an explicit bridge.

## 2. Product boundary: a specialized collector on a generic job platform

### 2.1 Observable surface

**FACT (high):** the dedicated Crawl reference calls
`POST https://api.brightdata.com/datasets/v3/trigger`, authenticated by bearer
API key. The required query parameter is a provider dataset ID; the example is
`gd_m6gjtfmeh43we6cqc`. The JSON body is an array of open-ended objects, usually
containing `url`. A successful trigger returns only `snapshot_id` [S3].

**FACT (high):** the same path, request shape, snapshot vocabulary, and
management/delivery endpoints serve Web Scraper API collections. The generic
async reference offers additional query parameters—discovery type/method,
result limits, webhook configuration, serialization format, and field
projection—that the dedicated Crawl OpenAPI omits [S3-S5].

**INFERENCE (high):** externally, Crawl API is a provider-maintained collector
definition running on the shared scraper/snapshot platform, not a standalone
generic crawl protocol. The dataset ID is an opaque program/schema handle. Its
stability does not establish stable traversal, extraction, or output semantics.

**UNKNOWN:** whether the example dataset ID is global, account-bound, versioned,
mutable, or one of several Crawl templates; whether a customer can pin a
collector revision; and whether generic async parameters omitted by the Crawl
reference are supported, ignored, or rejected for this dataset.

### 2.2 Marketing capability versus callable contract

| Claimed capability | First-party statement | Public Crawl wire control/evidence |
| --- | --- | --- |
| Whole-site/domain mapping | “Define the root URL,” “map entire site structures,” and “across an entire domain” [S1-S3] | No documented root flag, domain policy, depth, breadth, page limit, path rule, or discovered-edge output |
| Static and dynamic content | Crawl overview/product pages [S1, S2] | No render selector or record-level render-used field |
| JavaScript rendering | Included feature on pricing page [S4] | No engine, version, wait condition, resource policy, timeout, or opt-out |
| Residential proxies / automated proxy management | Included features [S4] | No proxy class/zone field, KYC relation, peer evidence, or per-job policy |
| CAPTCHA solving / user-agent rotation | Included features [S4] | No attempt events, solver result, identity, or escalation control |
| Worldwide geotargeting | Included feature [S4] | No country/region input or observed-exit metadata in dedicated OpenAPI |
| Custom headers | Included feature [S4] | No header input in dedicated OpenAPI; allowed names, forwarding, and redirect behavior unknown |
| Data discovery | Included feature [S4] | No crawl-specific discovery mode or frontier contract; generic scraper discovery parameters are a different documented surface [S5] |
| Scheduler | Crawl overview/product FAQ [S1, S2] | No public Crawl scheduling REST contract found; cadence, overlap, missed-run, and version semantics unknown |
| Validation | Included feature [S4] | Shared dataset validation exists, but Crawl-specific enabled checks, thresholds, and blocking behavior are not published [S17] |

**INFERENCE (high):** many advertised features are provider-side defaults or
Control Panel configuration, not request-scoped capabilities. That may simplify
use, but it prevents a caller from proving which authority and execution path
applied to a specific page.

## 3. Crawl scope and frontier

### 3.1 Seed ambiguity

**FACT (high):** official product copy says a caller defines a **root URL** and
retrieves the full website, while the quick start says “specify the URLs” and
posts both `https://example.com` and `https://example.com/1`. The OpenAPI merely
says the objects contain URLs or other dataset-dependent fields [S2-S4].

**UNKNOWN (blocking):** for each submitted URL, the public contract does not say:

- whether it is fetched only, treated as a traversal seed, or both;
- whether an explicit non-root URL causes link discovery;
- whether multiple seeds share a visited set or result budget;
- whether the seed itself counts as a result or priced unit;
- whether a failed seed can still produce discovered results;
- whether traversal can continue after cancellation is accepted.

### 3.2 Authority boundary and stop conditions

No inspected Crawl-specific source defines:

- exact-origin, same-host, subdomain, registrable-domain, or arbitrary-domain
  scope;
- treatment of `www`, ports, schemes, IDNs, redirects, canonical links, embeds,
  scripts, frames, images, or cross-origin assets;
- depth, breadth, outlink, discovered-URL, fetched-page, successful-page, record,
  byte, render, cost, or wall-clock ceilings;
- allow/exclude paths, query parameters, fragments, pagination, or URL-pattern
  controls;
- sitemap discovery, sitemap recursion, `lastmod`, feeds, or seed-source order;
- trap defenses for calendars, facets, session IDs, infinite pagination, or
  generated URLs;
- deterministic terminal reasons such as budget exhausted, frontier empty,
  deadline, policy denied, or repeated failure.

**FACT (high negative result):** none of those fields appears in the dedicated
Crawl OpenAPI [S3]. The general async scraper endpoint has
`limit_per_input`/`limit_multiple_results` with a minimum of one and no published
maximum, but the Crawl reference omits them and does not define “result” as a
fetched page [S5].

**INFERENCE (medium-high):** whole-site mapping necessarily entails a logical
frontier, visited state, and worker scheduling. Public evidence supports those
functional necessities only; it does not reveal queue technology, ordering,
fairness, persistence, or scheduler topology.

**RECOMMENDATION (high):** Curiosity must not convert a seed URL into
open-ended provider authority. Require separate normalized allowlists for
discovery, fetch/render, redirect, and return; hard local ceilings for pages,
URLs, bytes, time, renders, retries, per-origin concurrency, and spend; and an
enumerated stop reason. If Bright Data cannot accept and report those bounds,
the adapter is not a crawl provider—at most it is an unbounded outsourced data
collection job and should remain disabled.

## 4. Robots, publisher policy, and politeness evidence

### 4.1 Crawl-specific result

**UNKNOWN (high confidence that the public evidence is absent):** no inspected
Crawl overview, quick start, OpenAPI, product page, or pricing page promises:

- RFC 9309 parsing or any robots processing;
- a crawler product token, HTTP user agent, contact URL, or reverse-DNS identity;
- robots fetch/cache/expiry, redirect, unavailable-file, or fail-open/closed
  semantics;
- `crawl-delay` handling;
- per-origin concurrency, minimum delay, adaptive throttling, target
  `Retry-After`, or publisher opt-out;
- a retained robots document, matched rule, policy version, or denial event.

### 4.2 Evidence that must not be transferred

**FACT (high):** Bright Data's **Web Unlocker** error documentation says an
immediate/no-KYC mode blocks a target path disallowed by `robots.txt`, while a
full-access account can remove that provider check. Residential-proxy docs also
describe a KYC/use-case policy [S20, S21]. Those are different products and
access modes. The Crawl request does not name a zone or account mode [S3].

**FACT (high):** Crawl pricing says residential proxies are included, while the
current Residential network policy says new Residential zones after 2026-07-07
require human-reviewed KYC for registered companies [S4, S21]. The Crawl docs do
not explain whether managed Crawl traffic uses a customer Residential zone,
provider infrastructure outside that zone model, or which KYC/robots rule
applies.

**INFERENCE (high):** neither “compliant,” “public website,” KYC approval,
residential routing, nor CAPTCHA solving proves Crawl robots compliance or legal
authorization. Provider access permission cannot expand Curiosity's authority.

**RECOMMENDATION (high):** Curiosity must perform its own publisher-policy
decision before dispatch and retain the policy input and decision. A provider
must not override a local denial. Any robots exception needs a separate,
auditable authorization object and counsel/policy-owner approval; it must never
be inferred from KYC or successful retrieval.

## 5. Job, snapshot, rerun, and delivery lifecycle

### 5.1 Public state model

```text
POST trigger
  -> snapshot_id
  -> starting -> running -> ready
                    |         |
                    |         +-> download (pull, retained 16 days)
                    |         +-> delivery job -> done | failed | canceled
                    +-> cancel request -> canceled
             any collection path -> failed

POST rerun(old snapshot_id) -> new snapshot_id
```

**FACT (high):** progress and snapshot-list schemas enumerate `starting`,
`running`, `ready`, `failed`, and `canceled`. Progress includes snapshot and
dataset IDs. Snapshot lists can filter by dataset, status, date, and trigger
type, returning creation time and record count [S6, S9].

**FACT (high):** cancellation is a POST against a running snapshot and returns
plain `OK`; attempting it when not running is documented as an error. Rerun
creates a new snapshot ID from a prior snapshot's stored inputs. Input expiry can
make rerun fail, but its duration is not stated. Original inputs can be retrieved
as CSV while available [S12-S14].

**FACT (high):** a ready snapshot can be pulled by API or submitted to a
separate delivery operation that returns a delivery ID. Delivery status is
independent and terminally `done`, `canceled`, or `failed`; delivered file names
and timestamps may be returned [S8, S10, S11].

### 5.2 Contract drift and incomplete semantics

- The scraper overview prose says monitor status should be `collecting`, then
  `digesting`, while current progress OpenAPI enumerates `starting` and
  `running` [S6, S7].
- Download documentation says not-ready can be HTTP 202 with `status` including
  `building`; the current download OpenAPI declares HTTP 409 for not-ready
  [S8, S15].
- The error catalog includes “Failed to deliver snapshot” as a collection
  progress failure even though delivery is separately modeled [S15].
- No public contract defines legal transitions, state timestamps, progress
  counts, cancellation latency, race outcome, or whether a ready snapshot can
  later become failed/expired.

**RECOMMENDATION (high):** parse unknown states defensively; preserve the raw
provider state; map only known states into a Curiosity state machine. Collection
completion and delivery completion must remain separate. Cancellation should be
treated as a requested transition until confirmed, never as instantaneous proof
that origin work stopped.

### 5.3 Idempotency and replay

**UNKNOWN:** trigger and rerun expose no idempotency key, request fingerprint,
deduplication window, job alias, immutable collector version, or exactly-once
guarantee. Delivery exposes no documented idempotency key, event ID, ordering,
retry schedule, webhook signature, or replay protection [S3, S10-S14].

**INFERENCE (high):** caller retries can create duplicate snapshots and
deliveries. Rerun is an explicit whole-job replay, not evidence that the same
pages, versions, frontier order, or output will recur.

**RECOMMENDATION (high):** use a Curiosity-owned dispatch fingerprint over
provider, collector reference/version expectation, normalized inputs, policy,
hard budgets, output projection, and freshness window. Model at-least-once
effects, authenticate callbacks independently, and deduplicate jobs, records,
and delivery events without erasing lineage.

## 6. Rendering, unblocking, extraction, and validation

### 6.1 Rendering and unblocking

**FACT (medium; vendor capability claim):** Bright Data says Crawl includes
JavaScript rendering, residential proxies, CAPTCHA solving, automated proxy
management, user-agent rotation, custom headers, and worldwide geotargeting, and
captures static and dynamic content [S1, S2, S4].

**UNKNOWN:** the public Crawl contract does not state:

- when rendering is selected, whether it can be disabled, or whether every page
  is rendered;
- browser engine/build, wait condition, JavaScript timeout, cookies/storage,
  subresource policy, downloads, service workers, locale, timezone, or device;
- whether a static attempt precedes render escalation and what quality signal
  triggers escalation;
- proxy class, IP/session affinity, geographic accuracy, peer evidence, or
  attempt count;
- CAPTCHA provider, solve policy, retry/timeout, challenge evidence, or whether
  solving can expand access contrary to caller policy;
- custom-header approval, secret handling, same-origin restriction, redirect
  stripping, or record of what was sent.

**INFERENCE (medium-high):** Crawl likely reuses some Bright Data unblocking and
browser capabilities, but product bundling does not prove a specific internal
pipeline or that Web Unlocker/Browser API semantics apply. No stronger
architecture claim is justified.

### 6.2 Extraction and output-field ambiguity

**FACT (high):** quick-start examples describe content projections called
Markdown, `html2text`, page HTML, and `ld_json`. The query parameter
`custom_output_fields` is formally a pipe-separated field projection, with an
OpenAPI example such as `url|about.updated_on`; the prose also presents it as a
way to choose `markdown`, `html`, or `ld_json` [S2, S3].

**FACT (high):** result **serialization** is a separate concept: the shared
trigger/download platform supports JSON, NDJSON/JSONL, and CSV, while delivery
can additionally support XLSX and Parquet [S5, S8, S10]. Thus “JSON output” can
mean a file/container format or a per-page `ld_json` field; they are not the same
contract.

**UNKNOWN:** exact Crawl record schema; mandatory URL/input/error/timestamp
fields; whether `html`, `html2text`, and `page_html` are aliases; default fields;
field nullability; maximum content length; truncation markers; DOM-to-Markdown
algorithm; boilerplate removal; sanitization; JSON-LD handling of multiple or
invalid blocks; extractor versions; and schema-change notice.

### 6.3 Validation is not provenance or deduplication

**FACT (medium):** Crawl pricing lists data validation. Bright Data's shared
dataset validation framework can check uniqueness, filling rate, required
fields, types/schema, stability, minimum records, size fluctuation,
completeness, and duplicate identity. Failed checks may be overridden or
thresholds changed, and a snapshot pending approval is auto-delivered after 14
days [S4, S17].

**UNKNOWN:** which, if any, checks run for Crawl API; whether they block API
`ready`; what identity key is used; and whether “uniqueness” concerns output
rows rather than fetch/frontier deduplication.

**INFERENCE (high):** quality validation cannot prove source fidelity,
completeness, or duplicate-free crawling. A unique Markdown row can still come
from duplicate fetches, and an exact duplicate page can legitimately require two
distinct provenance records.

## 7. Retries, canonicalization, and duplicate handling

### 7.1 Negative results

No inspected Crawl-specific source documents:

- target/network/status classes eligible for retry;
- attempt cap, backoff, jitter, target `Retry-After`, alternate proxy/render
  escalation, or deadline interaction;
- per-page failure shape or a count of abandoned frontier entries;
- URL normalization, fragment removal, query sorting/filtering, trailing slash,
  case, IDNA, default-port, or percent-encoding rules;
- redirect aliasing, `rel=canonical`, exact raw/rendered/content hashes,
  near-duplicate detection, or duplicate charging;
- cache reuse, conditional HTTP, ETag/Last-Modified, or content-change detection.

**FACT (high):** shared Datasets API guidance covers **caller-to-provider** 429s:
at 5,000 active jobs, honor `Retry-After` or use exponential backoff; 25 or more
429 responses from one IP within five minutes can cause automatic blacklisting
[S7, S15]. This is not evidence about Crawl's target-origin retry policy.

**FACT (high):** `include_errors=true` promises a detailed error report, but the
dedicated Crawl reference publishes no record schema, attempt history, retryable
flag, or completeness semantics for that report [S2, S3].

**RECOMMENDATION (high):** Curiosity should preserve submitted, normalized,
redirect-final, publisher-canonical, capture, and duplicate-cluster identities
separately. Provider retries must fit inside Curiosity's attempt/time/byte/cost
budget. A partial run must disclose failed and unvisited counts and reasons;
absence of an error row must not be treated as completeness.

## 8. Outputs, provenance, evidence, and freshness

### 8.1 What the shared platform preserves

**FACT (high):** Bright Data defines a snapshot as one collection event storing
that run's results and inputs. Inputs can be retrieved separately. Snapshot lists
provide creation time, state, dataset ID, record count, and trigger type [S9,
S13, S16].

**FACT (high):** snapshot log examples can include creation time, dataset and
scraper names/IDs, dataset size, input count, file size, duration, duration per
input, success rate, and trigger type/user/IP/URL/time [S18]. These are job-level
operations metadata, not per-page source evidence.

**FACT (high):** generic delivery can attach HTML, screenshot, and sometimes
WARC, but only for storage/webhook delivery and with “not always available”
qualifiers. Crawl documentation does not promise that these artifacts exist for
its dataset [S11].

### 8.2 Missing provenance

The public Crawl result contract does not promise:

- submitted URL, normalized request URL, final URL, or redirect chain per row;
- parent/referrer edge, crawl depth, discovery time/order, or selection reason;
- request start/end or exact page observation time;
- source HTTP status, headers, MIME type, byte count, or content encoding;
- robots/publisher-policy document, decision, or identity;
- static/render mode, browser/extractor version, requested/observed geo, proxy
  class, or attempt history;
- raw capture ID/hash, transformed-content hash, canonical relation, duplicate
  cluster, or transformation lineage;
- partial/truncated flags, unvisited frontier count, coverage estimate, or stop
  reason.

**INFERENCE (high):** snapshot creation proves that a collection was requested
at a time; it does not prove when each page was observed. Snapshot `ready` proves
provider workflow state; it does not prove complete-site coverage, semantic
correctness, freshness, or legal permission.

### 8.3 Freshness and recurring runs

**FACT (medium):** Crawl product material says jobs can be scheduled daily,
weekly, or on a custom timetable [S1, S2]. No public Crawl scheduling endpoint or
schedule object was found.

**UNKNOWN:** fixed-time versus completion-relative cadence, overlap behavior,
missed runs, timezone, collector-version pinning, full versus incremental crawl,
conditional requests, unchanged-page suppression, deleted-page detection,
change history, or freshness SLA.

**RECOMMENDATION (high):** every provider result needs a Curiosity evidence
envelope containing, at minimum: provider and product; opaque dataset and
snapshot IDs; immutable normalized request/policy/budget; requested/final URL
and redirect evidence when available; page observed time (or explicitly
unknown); source status/MIME/bytes; render/geo/attempt metadata; raw capture and
content hashes; transformation name/version; canonical/duplicate evidence;
job/record correlation; warnings/partial reason; and provider retention expiry.
Markdown or JSON-LD is a derivative, never the sole evidentiary object.

## 9. Limits, errors, and cost

### 9.1 Published platform limits

| Dimension | Public statement | Applicability caveat |
| --- | --- | --- |
| Active jobs | 5,000 snapshots; excess returns 429 [S7, S15] | Shared scraper-platform limit, not a target-origin or page-concurrency limit |
| Input | Up to 1 GB per batch [S7] | No URL count/length or per-seed crawl-work cap |
| Discovery batch | Generic docs mention up to 100 requests [S7] | Whether the Crawl dataset is this “Discovery Scraper” mode is unstated |
| API download | 5 GB per request; batch size minimum 1,000 records [S8] | Output transport bound, not fetch/crawl bound |
| Webhook | Shared overview says up to 1 GB [S7] | Dedicated Crawl webhook behavior not separately specified |
| Delivery API | Overview calls it unlimited; delivery schema caps a part at 5 GB [S7, S10] | “Unlimited” means no stated total there, not no operational/cost limit |
| Result retention | 16 days [S8] | Input/rerun/log/artifact retention is not fully specified |
| Snapshot list | Default 1,000; maximum 5,000 returned [S9] | Listing bound only |
| Limited Trial | 100 requests/minute across products [S22] | Separate from the 5,000 active-job ceiling |

**UNKNOWN (blocking):** maximum crawl pages, discovered URLs, depth, response or
decompressed bytes per page, total fetched bytes, redirects, render time,
job duration, attempts, origin concurrency, and cost per seed. “Unlimited
concurrent requests” on pricing copy conflicts with the shared 5,000-active-job
limit and says nothing about per-origin politeness [S4, S7].

### 9.2 Error boundary

**FACT (high):** trigger documents invalid input/dataset states, 429 for too
many running jobs, and 500. Progress can be HTTP 200 with `status: failed` and an
`error_message`. Download distinguishes expired, empty, not-ready, missing, and
internal failures. Cancellation, parts, and delivery have their own errors
[S15].

**UNKNOWN:** stable machine-readable Crawl page-error codes, failure ordering,
whether a 200/ready snapshot may be partial, and which failures are billable.
Message text should not be treated as a stable typed contract.

### 9.3 Pricing contradiction observed 2026-08-17

| First-party page | PAYG and commitment units shown |
| --- | --- |
| Dedicated pricing [S4] | $1.50/1K **requests**; $499 for 380K at $1.30/1K; $999 for 900K at $1.10/1K; $1,999 for 2M at $1.00/1K |
| Product page [S2] | $1.50/1K **records**; 510K/$499, 1M/$999, 2.5M/$1,999, plus displayed 25%-off promotional effective rates |

**UNKNOWN (blocking):** whether a request is a trigger, seed, page attempt,
successful page, or delivered record; whether duplicates, errors, retries,
renders, assets, and empty/partial jobs are charged; price rounding; and which
page is authoritative. The generic free-tier page names Web Scraper API, not
Crawl API, so its 5,000 monthly credits cannot safely be assumed to cover Crawl
[S23].

**RECOMMENDATION (high):** obtain a written billable-event definition and
preflight a worst-case ceiling across seeds, discoveries, attempts, pages,
records, renders, artifacts, and delivery bytes. Provider wallet/quota and
marketing concurrency are not Curiosity budget controls.

## 10. Security, privacy, and legal boundaries

### 10.1 Security and untrusted data

**FACT (medium; platform-level):** Bright Data states ISO/IEC 27001:2022,
ISO 27017, ISO 27018, SOC 2 Type II under NDA, public SOC 3, TLS 1.3/minimum 1.2,
AES-256 at rest, AWS multi-AZ, RBAC, secure SDLC, and annual penetration testing.
Its published 2025 penetration-test scope names Web Scraper API, though not Crawl
API separately [S24]. Certifications are control evidence, not a Crawl-specific
SSRF, sandbox, or provenance guarantee.

**FACT (high):** API keys can have expiration and one of five broad permission
profiles. A key is displayed once and can be refreshed; the least-privileged
`User` profile permits API use without product configuration access [S25].

**FACT (high):** delivery configurations may transmit cloud/storage/database
credentials to Bright Data. S3 can instead use role ARN plus external ID [S10,
S11]. Webhook endpoint and optional authorization header can be supplied through
the shared trigger surface [S5].

**UNKNOWN:** Crawl-specific private/reserved/link-local blocking; DNS rebinding
defense; redirect and rendered-subresource scope checks; unsafe-port policy;
browser isolation; malware scanning; cross-tenant isolation; key scoping to one
dataset; webhook signing/replay protection; and crawl/log regional residency.

**RECOMMENDATION (high):** use an expiring `User` key from a secret manager;
separate environments; never put credentials in seed URLs or target headers;
prefer write-only assumed roles; enforce callback authentication at Curiosity;
and independently reject private/reserved destinations at every seed and
redirect. Treat URLs, HTML, Markdown, JSON-LD, errors, filenames, and callbacks
as untrusted external data. Bright Data itself warns that scraped content can
carry prompt injection [S24].

### 10.2 Privacy and DPA

**FACT (high):** Bright Data's Privacy Policy covers account/KYC data, IDs and
possibly recorded calls; collection and sharing of publicly posted personal
data to provide services; purpose/legal-need-based rather than fixed retention;
international processing; and GDPR/CCPA rights channels. It says Bright Data
does not rent or sell User Data, while its CCPA notice says it may have sold the
category “Identifiers” in the prior 12 months [S27].

**FACT (high):** the public two-page DPA applies when Bright Data processes
personal data on a partner's behalf. It requires documented instructions,
confidentiality, breach notice without undue delay, rights/DPIA assistance,
cessation and deletion on request or termination subject to law, transfer
safeguards, reasonable security, and annual audit rights on 30 days' notice. It
allows general subprocessor authorization with seven days' notice and objection
[S28].

**UNKNOWN:** Crawl input/output/log retention, deletion SLA, subprocessors and
regions, fixed incident-notice time, treatment of source-page personal data,
and whether schedules/outputs are used to improve products or models. The public
DPA has no processing annex naming Crawl, data categories, subjects, purpose,
retention, or subprocessor list [S28].

### 10.3 Service terms, target rights, and product-classification gap

**FACT (high):** the AUP prohibits collection of nonpublic/behind-login data,
illegal/fraudulent/abusive uses, and violations of law or third-party rights.
Bright Data may block adult, governmental, harmful, and other content at its
discretion [S26]. Product FAQ likewise describes Crawl targets as public
websites [S2].

**FACT (high):** the June 2026 MSA places legal, privacy, rights, and use-case
responsibility on the client; permits compliance review and suspension; disclaims
accuracy, completeness, non-infringement, security, and uninterrupted service;
limits aggregate liability to fees received in the month before the event; and
requires client indemnity for many third-party claims [S29].

**FACT (high):** MSA specific-service clauses expressly permit data retention
and provider use for **Proxy Services/Scraping Browser API** and similarly for
**Web Scraper IDE**. The MSA separately governs Dataset Service review-period
retention. It does **not name Crawl API** in those specific clauses [S29].

**UNKNOWN (consequential):** whether Bright Data classifies Crawl as Proxy,
Scraping Browser, Web Scraper IDE, Dataset Service, another Data Service, or only
the general “Services” for retention, output-license, and reuse terms. Because
Crawl advertises residential proxies but invokes the dataset/snapshot platform,
the public documents do not resolve the classification. It would be incorrect
to assume either that the retention/reuse clause applies or that it does not.

**RECOMMENDATION (high):** require an order form to name Crawl API and define:
no independent use/model training; input/output/artifact/log retention and
deletion; output rights; source-rights allocation; subprocessors/regions;
incident deadline; audit evidence; takedown/deletion propagation; and precedence
over online terms. Robots compliance is not copyright, database-right, privacy,
terms-of-use, or access authorization. Obtain corpus/use-case-specific counsel
review.

## 11. Clean-room architecture reconstruction

The following is **INFERENCE**, not a description of Bright Data's private
implementation:

```text
caller URL inputs + opaque Crawl dataset_id + output projection
  -> bearer-auth / account / policy / billing gate
  -> provider-managed Crawl collector definition
  -> logical frontier + visited state + worker scheduling
  -> target fetch lane
       -> proxy/unblocking selection
       -> optional browser/render/CAPTCHA path
  -> content projection (Markdown/text/page HTML/ld_json)
  -> snapshot store
       -> progress / cancel / rerun / input / log
       -> retained result + parts
  -> separate delivery workers
       -> webhook / object storage / queue / SFTP / warehouse / email
```

| Inference | Confidence | Public basis and boundary |
| --- | --- | --- |
| Crawl is a logical collector on the scraper platform | High | Same trigger, dataset ID, snapshots, management, and delivery [S3-S15] |
| A frontier and visited state exist | Medium-high | Required to map a site in finite work; identity/order/store unknown |
| Fetch/render/unblock routing exists | Medium-high | Static/dynamic, JS, proxies, CAPTCHA claims; route algorithm and evidence unknown [S1, S2, S4] |
| Results are transformed before snapshot storage | High | Content projections and field selection precede snapshot download [S2, S3, S8] |
| Delivery is a separate worker/resource plane | High | Separate delivery request, ID, states, and files [S10, S14] |
| Robots/politeness subsystem | Unknown | No Crawl-specific contract evidence |
| Standards-grade canonicalization or dedup subsystem | Unknown | No Crawl-specific contract evidence |
| Deterministic incremental crawler | Unknown | Scheduling claim does not establish deltas/change detection |

The strongest observable design is separation of collection from delivery. The
weakest is caller-visible crawl authority and page-level evidence.

## 12. Curiosity implications and verdict ledger

| Product idea | Verdict | Confidence | Curiosity disposition |
| --- | --- | --- | --- |
| Durable asynchronous crawl job | **ADOPTED** | High | Return a stable run ID immediately and persist immutable request/policy/budget. |
| Collection state separate from delivery | **ADOPTED** | High | A complete crawl can have a failed delivery; model both. |
| Cancellation plus confirmed terminal state | **ADAPTED** | High | Cancellation is requested then observed, with race and residual-work semantics. |
| Rerun creates a new snapshot | **ADOPTED** | High | Every replay is a new run with parent lineage and current policy/version. |
| Input retrieval and job-level log | **ADOPTED and extended** | High | Add policy, page attempts, frontier events, captures, and hashes. |
| Parts and bounded pull download | **ADOPTED** | High | Use manifest checksums, byte caps, immutable part IDs, and expiry. |
| Opaque provider `dataset_id` | **ADAPTED** | High | Adapter-private collector reference plus observed schema/contract version; never a core type. |
| Provider Markdown/text/JSON-LD | **ADAPTED** | High | Untrusted derivative linked to raw capture and transform version. |
| Whole-domain mapping with hidden defaults | **REJECTED** | High | No dispatch without exact scope and hard work/cost bounds. |
| Provider validation as provenance/dedup | **REJECTED** | High | Validate output separately; retain capture and identity evidence. |
| Marketing compliance as policy proof | **REJECTED** | High | Curiosity owns robots, rights, privacy, and purpose decisions. |
| Automatic render/unblock/CAPTCHA escalation | **REJECTED by default** | High | Each escalation needs explicit capability, authority, budget, and evidence. |
| Bright Data Crawl as optional provider | **DEFERRED** | High | Written contract, security/privacy/legal review, and approved fixture test first. |
| Bright Data Crawl as owned crawl core | **REJECTED** | High | Frontier, policy, evidence, versions, and stop behavior remain provider-controlled. |

### Provider-neutral contract minimum

A Curiosity `CrawlRun` request should include:

1. immutable caller authority, purpose, seeds, idempotency key, and freshness
   objective;
2. parsed-origin allowlists separately for discover/fetch/render/redirect/return;
3. depth, outlink, discovered URL, page, byte, redirect, render, retry,
   per-origin delay/concurrency, deadline, result-size, and spend bounds;
4. robots/publisher-policy mode and immutable policy snapshot;
5. deterministic URL/path/query rules and trap defenses;
6. fetch/render/extract modes, permitted escalation, and output/artifact limits;
7. cancellation, retention, deletion, callback, and delivery policy.

Each page should emit edge, attempt, policy, redirect, capture, canonical,
duplicate, extraction, and error records. Results remain
`untrusted-external-evidence`; no page text, script, JSON-LD, URL, or provider
error can grant authority, disclose secrets, invoke tools, expand scope, or
approve follow-up work.

## 13. Fact / inference / recommendation ledger

| ID | Type | Claim | Confidence | Origin / check |
| --- | --- | --- | --- | --- |
| F1 | FACT | Crawl uses `POST /datasets/v3/trigger` and returns `snapshot_id`. | High | S3; inspect dedicated OpenAPI. |
| F2 | FACT | The request requires an opaque dataset ID and array of dataset-dependent objects. | High | S3. |
| F3 | FACT | Product copy promises domain mapping and static/dynamic content. | High | S1-S3; offered behavior, not measured quality. |
| F4 | FACT | Dedicated Crawl OpenAPI exposes no depth, scope, page, byte, time, robots, or pacing control. | High | Negative schema inspection S3. |
| F5 | FACT | Generic async parameters exceed the dedicated Crawl schema. | High | Compare S3 with S5. |
| F6 | FACT | Progress enumerates starting/running/ready/failed/canceled. | High | S6, S9. |
| F7 | FACT | Rerun returns a new snapshot ID and can fail after input expiry. | High | S12. |
| F8 | FACT | Result retention is 16 days; API download is capped at 5 GB/request. | High | S8. |
| F9 | FACT | Delivery has a separate ID and done/canceled/failed state. | High | S10, S14. |
| F10 | FACT | Content projection and transport serialization are separate but docs blur them. | High | S2, S3, S5, S8, S10. |
| F11 | FACT | No public Crawl record schema promises page-level provenance fields. | High | Negative schema inspection S2-S4. |
| F12 | FACT | Pricing pages disagree on requests versus records and tier quantities. | High | Compare S2 with S4 on access date. |
| F13 | FACT | Cross-product robots/KYC docs do not name Crawl behavior. | High | S20-S22 versus S3. |
| F14 | FACT | MSA specific-service clauses do not expressly name Crawl API. | High | S29. |
| I1 | INFERENCE | Crawl is a specialized collector on the shared snapshot platform. | High | F1, F2, F5-F9. |
| I2 | INFERENCE | Site mapping requires a logical frontier and visited state. | Medium-high | F3; implementation/order unknown. |
| I3 | INFERENCE | Provider-managed defaults hide material crawl authority. | High | F4, capability/wire gap in Section 2. |
| I4 | INFERENCE | Reruns/caller retries can duplicate jobs and need local idempotency. | High | F7 and absence of an idempotency contract. |
| I5 | INFERENCE | Snapshot readiness is not provenance, freshness, or completeness. | High | F6, F11 and missing stop/page evidence. |
| R1 | RECOMMENDATION | Do not dispatch an unbounded seed. | High | F3-F5 and denial-of-wallet/scope risk. |
| R2 | RECOMMENDATION | Enforce robots/rights policy before provider dispatch. | High | F13 and MSA/AUP allocation. |
| R3 | RECOMMENDATION | Preserve raw captures and page-level evidence outside provider retention. | High | F8, F11. |
| R4 | RECOMMENDATION | Defer adoption pending written unit/scope/retention contracts. | High | F4, F12, F14. |

## 14. Unknowns and required pre-adoption checks

### 14.1 Written vendor answers — blockers

1. Define input/seed semantics and exact discover/fetch/render/redirect/return
   scope, including subdomains, ports, schemes, assets, and redirects.
2. Define hard page, URL, depth, breadth, byte, render, retry, origin-rate,
   deadline, output, and spend limits and deterministic stop reasons.
3. Define robots user-agent/token, RFC 9309 behavior, caching, unavailable-file,
   redirect, `crawl-delay`, publisher opt-out, and retained decision evidence.
4. Define frontier order/fairness, sitemap use, trap defense, URL identity,
   canonical handling, exact/near deduplication, and duplicate charging.
5. Define fetch retry classes/budgets, backoff, target `Retry-After`, partial
   results, cancellation races, and unvisited-frontier reporting.
6. Define when render/proxy/CAPTCHA escalation occurs, how it is disabled, and
   which per-page metadata proves the execution lane.
7. Publish the Crawl input/output/error schema, mandatory provenance fields,
   maximum content sizes, truncation, transform versions, and schema-change SLA.
8. Reconcile progress and not-ready states and document webhook authentication,
   retries, ordering, and duplicate delivery.
9. Define “request” versus “record,” retries/duplicates/errors/renders, free
   credits, rounding, and worst-case billing.
10. Contractually classify Crawl under the MSA and define retention, independent
    use/training, output rights, deletion, subprocessors, and regions.

### 14.2 Separately authorized fixture checks — not executed

Only after vendor answers, legal/privacy/security approval, and caller authority,
use project-authored or explicitly permitted public fixtures and a hard no-cost
budget to check:

- seed/root and cross-origin redirect scope; depth/page/byte/time termination;
- robots allow/disallow, unavailable robots, pacing, and target `Retry-After`;
- static versus rendered discovery, CAPTCHA escalation, and subresource egress;
- query/canonical/redirect duplicates and repeated triggers/reruns;
- page errors, partial/empty snapshots, cancellation races, expiry, and unknown
  states;
- record schema, exact observation time, source status, hashes, WARC/HTML
  availability, and Markdown/JSON-LD fidelity;
- webhook authentication, replay, duplicate delivery, parts, checksums, and
  credential redaction;
- measured billed units against seeds, attempts, pages, records, errors, and
  duplicates.

No target bypass, private address, cloud metadata, DNS-rebinding, login, paywall,
or CAPTCHA-defeat probe is authorized by this research.

## 15. Reproducible public-document checks

These commands retrieve only public documentation; they do not call the Crawl
API, create an account, or access a target site.

```sh
# Dedicated Crawl contract and the broader async contract it links to.
curl -fsS https://docs.brightdata.com/api-reference/rest-api/scraper/crawl-api.md
curl -fsS https://docs.brightdata.com/api-reference/rest-api/scraper/asynchronous-requests.md

# Search the complete public docs corpus for absent crawler controls.
curl -fsS https://docs.brightdata.com/llms-full.txt -o /tmp/brightdata-docs.txt
rg -n -i 'Crawl API|gd_m6gjtfmeh43we6cqc|robots\.txt|crawl-delay|canonical|dedup|frontier|max.depth|sitemap' \
  /tmp/brightdata-docs.txt

# Compare point-in-time pricing nouns and quantities.
curl -fsS https://brightdata.com/products/crawl-api
curl -fsS https://brightdata.com/pricing/crawl-api

# Inspect lifecycle and retention contracts.
for p in monitor-progress get-snapshots cancel-snapshot rerun-snapshot \
  get-snapshot-input snapshot-data monitor-delivery; do
  curl -fsS "https://docs.brightdata.com/api-reference/scrapers/management-apis/$p.md"
done
curl -fsS https://docs.brightdata.com/api-reference/scrapers/delivery-apis/download-snapshot.md
curl -fsS https://docs.brightdata.com/api-reference/scrapers/delivery-apis/deliver-snapshot.md
```

Expected observations: the dedicated request has dataset ID, errors flag, field
projection, and open-ended inputs but no crawl bounds; shared lifecycle states
and endpoints match Section 5; public pricing pages use different units; and
searches find robots rules for other Bright Data products but no complete Crawl
robots/politeness contract.

## 16. Bounded curiosity pass and stop

Scores are 1 (low) to 5 (high); cost is 1 (cheap) to 5 (expensive).

| Thread | Relevance | Value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Compare dedicated Crawl and generic async schemas | 5 | 5 | 4 | 1 | **Pursued:** established that many generic discovery/delivery controls are omitted from the Crawl-specific contract. |
| Determine whether robots evidence transfers from Unlocker/Residential | 5 | 5 | 4 | 1 | **Pursued:** it does not; retained Crawl robots behavior as unknown. |
| Reconcile billing unit and commitment quantities | 5 | 5 | 4 | 1 | **Pursued:** first-party product and pricing pages materially conflict. |
| Inspect rerun/input lifecycle | 4 | 4 | 4 | 1 | **Pursued:** found whole-run replay with a new snapshot and unspecified input expiry. |
| Classify Crawl under MSA retention clauses | 5 | 5 | 5 | 2 | **Pursued:** Crawl is not expressly named; classification retained as a procurement blocker rather than guessed. |
| Infer proprietary frontier/render/unblocking algorithms | 1 | 2 | 3 | 5 | **CURIOSITY_NO_GO:** no decision value beyond the bounded functional decomposition; conflicts with clean-room and contractual boundaries. |
| Run free or paid Crawl requests | 4 | 5 | 4 | 5 | **CURIOSITY_NO_GO:** caller prohibited calls/credentials; sampling would not establish a durable contract. |
| Probe private IPs, redirects, DNS rebinding, robots bypass, or CAPTCHA behavior | 5 | 5 | 3 | 5 | **CURIOSITY_NO_GO:** unsafe/unauthorized security and bypass testing. |
| Inspect the authenticated Control Panel | 3 | 4 | 3 | 4 | **CURIOSITY_NO_GO:** credentials/account access prohibited; undocumented UI defaults would not replace a written API contract. |
| Third-party benchmarks and reviews | 2 | 2 | 2 | 3 | **CURIOSITY_NO_GO:** lower evidentiary value than primary contracts and unable to resolve policy semantics. |
| Jurisdiction-specific crawl/copyright/privacy case law | 5 | 5 | 4 | 5 | **CURIOSITY_NO_GO:** requires declared corpus/use case and counsel; outside product-contract authority. |

**Coverage:** crawl contract/scope/frontier/job lifecycle; robots/politeness;
rendering/unblocking; dedup/retries; outputs/provenance/freshness; limits/pricing;
privacy/security/legal; clean-room architecture; Curiosity implications;
facts/inferences/recommendations; confidence, unknowns, checks, and verdicts are
covered.

**Saturation:** the complete first-party docs corpus repeated the same short
Crawl pages and generic snapshot platform without resolving traversal, robots,
dedup, retries, provenance, or pricing semantics.

**Stop:** coverage and source saturation reached. Remaining material questions
require written vendor responses, counsel/security/privacy review, or new caller
authority for a bounded fixture evaluation.

## 17. Primary sources

All sources are first-party Bright Data materials accessed **2026-08-17**.
Product, performance, compliance, and scale statements are vendor claims unless
the cited independent report itself is reviewed.

1. **[S1] Bright Data, Crawl API overview.**
   https://docs.brightdata.com/scraping-automation/crawl-api/overview — product
   purpose, content forms, scheduler/webhook claims, and use cases.
2. **[S2] Bright Data, Crawl API product page.**
   https://brightdata.com/products/crawl-api — root/site claims, static/dynamic
   content, delivery, schedules, public-site FAQ, and record-based pricing.
3. **[S3] Bright Data, Crawl API reference and quick start.**
   https://docs.brightdata.com/api-reference/rest-api/scraper/crawl-api and
   https://docs.brightdata.com/scraping-automation/crawl-api/quick-start —
   dedicated trigger schema, dataset ID, URL inputs, projection examples, and
   snapshot result.
4. **[S4] Bright Data, Crawl API pricing.**
   https://brightdata.com/pricing/crawl-api — request-based prices and bundled
   rendering/proxy/CAPTCHA/geo/discovery/validation/concurrency claims.
5. **[S5] Bright Data, asynchronous scraper requests.**
   https://docs.brightdata.com/api-reference/rest-api/scraper/asynchronous-requests
   — broader shared trigger parameters, webhook and serialization contract.
6. **[S6] Bright Data, Monitor progress.**
   https://docs.brightdata.com/api-reference/scrapers/management-apis/monitor-progress
   — snapshot progress states.
7. **[S7] Bright Data, Scrapers Library overview.**
   https://docs.brightdata.com/datasets/scrapers/scrapers-library/overview —
   async platform behavior, input/delivery limits, concurrency, and state prose.
8. **[S8] Bright Data, Download snapshot.**
   https://docs.brightdata.com/api-reference/scrapers/delivery-apis/download-snapshot
   — formats, parts, 5 GB request cap, 1,000-record minimum, and 16-day retention.
9. **[S9] Bright Data, Get snapshots.**
   https://docs.brightdata.com/api-reference/scrapers/management-apis/get-snapshots
   — list filters, state, creation time, trigger type, and record count.
10. **[S10] Bright Data, Deliver snapshot.**
    https://docs.brightdata.com/api-reference/scrapers/delivery-apis/deliver-snapshot
    — delivery ID, target types, credentials, formats, and part size.
11. **[S11] Bright Data, Delivery options.**
    https://docs.brightdata.com/datasets/scrapers/scrapers-library/delivery-options
    — streamed batches and optional HTML/screenshot/WARC artifacts.
12. **[S12] Bright Data, Rerun snapshot.**
    https://docs.brightdata.com/api-reference/scrapers/management-apis/rerun-snapshot
    — new snapshot ID and input-expiry failure.
13. **[S13] Bright Data, Get snapshot input.**
    https://docs.brightdata.com/api-reference/scrapers/management-apis/get-snapshot-input
    — stored trigger-input retrieval.
14. **[S14] Bright Data, Cancel snapshot and Monitor delivery.**
    https://docs.brightdata.com/api-reference/scrapers/management-apis/cancel-snapshot
    and https://docs.brightdata.com/api-reference/scrapers/management-apis/monitor-delivery
    — collection cancellation and separate delivery states/files.
15. **[S15] Bright Data, scraper endpoint errors.**
    https://docs.brightdata.com/datasets/scrapers/scrapers-library/error-list-by-endpoint
    — endpoint failures, not-ready drift, 429 backoff, and IP blacklisting.
16. **[S16] Bright Data, Terminology.**
    https://docs.brightdata.com/api-reference/terminology — snapshot and dataset
    definitions.
17. **[S17] Bright Data, dataset validation for customers.**
    https://docs.brightdata.com/datasets/data-validation/data-validation-for-customers
    — validation checks, override/approval, and auto-delivery.
18. **[S18] Bright Data, Get snapshot log.**
    https://docs.brightdata.com/api-reference/scrapers/management-apis/snapshot-data
    — job-level operational metadata.
19. **[S19] Bright Data, official documentation index and corpus.**
    https://docs.brightdata.com/llms.txt and
    https://docs.brightdata.com/llms-full.txt — coverage and negative-result
    search corpus.
20. **[S20] Bright Data, Web Unlocker error codes.**
    https://docs.brightdata.com/scraping-automation/web-unlocker/error-codes —
    cross-product robots behavior used only to prevent invalid transfer.
21. **[S21] Bright Data, Residential network access policy.**
    https://docs.brightdata.com/proxy-networks/residential/network-access —
    2026 KYC and approved-use-case policy, not a Crawl guarantee.
22. **[S22] Bright Data, Limited Trial restrictions.**
    https://docs.brightdata.com/general/account/limited-trial-restrictions —
    account-wide trial request rate.
23. **[S23] Bright Data, Free tier.**
    https://docs.brightdata.com/general/account/billing-and-pricing/free-tier —
    named eligible products and prepaid behavior.
24. **[S24] Bright Data, Security & compliance.**
    https://docs.brightdata.com/general/security/security-overview — platform
    certifications, encryption, testing, and untrusted-content warning.
25. **[S25] Bright Data, Authentication.**
    https://docs.brightdata.com/api-reference/authentication — API-key lifecycle
    and permission profiles.
26. **[S26] Bright Data, Acceptable Use Policy.**
    https://brightdata.com/acceptable-use-policy — public/nonpublic boundary,
    prohibited uses, target blocking, and third-party rights.
27. **[S27] Bright Data, Privacy Policy, reviewed 2026-05-14.**
    https://brightdata.com/privacy — account/public data, sharing, retention,
    transfers, rights, and CCPA disclosures.
28. **[S28] Bright Data, Data Protection Addendum (public PDF).**
    https://brightdata.com/static/web/Bright-Data-Data-Protection-Agreement.pdf
    — processor duties, deletion, subprocessors, transfers, security, and audit.
29. **[S29] Bright Data, Master Service Agreement, updated 2026-06-16.**
    https://brightdata.com/license — service responsibilities, disclaimers,
    liability, client duties, specific-service terms, and product-classification
    gap for Crawl API.
