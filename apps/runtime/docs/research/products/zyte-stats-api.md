# Zyte Stats API: standalone operations-surface dossier

**Primary-source access date:** 2026-08-17  
**Research method:** Clean-room review of public first-party documentation,
rendered OpenAPI, Zyte's published Grafana dashboard, pricing, Terms, DPA, and
Privacy Policy. No account, credential, Stats/API request, target request,
traffic interception, private assurance material, source inspection, or
implementation was used.

## Decision frame

Should Curiosity adopt Zyte Stats API as an operations input, and which of its
observable telemetry patterns should Curiosity adopt, adapt, reject, or defer?

Bounded sub-questions:

1. What can be queried, filtered, grouped, and returned?
2. What do time granularity, freshness, and retention actually guarantee?
3. Where are authentication, organization, API-key, domain, and tag boundaries?
4. Can the surface support rate, reliability, cost, and budget operations?
5. What error, pagination, and aggregation limits affect safe collectors?
6. What privacy, security, and commercial constraints follow from the data?
7. What architecture can be inferred without reconstructing private internals?
8. Which lessons transfer cleanly into Curiosity's provider-neutral operations
   contracts?

### Evidence labels

- **FACT** — directly stated or exposed by a cited first-party source.
- **INFERENCE** — clean-room reasoning from public behavior; not a claim about
  Zyte's private implementation.
- **RECOMMENDATION** — a Curiosity design or procurement choice.
- **UNKNOWN / NEGATIVE RESULT** — not established by reviewed public sources;
  absence of documentation is not proof of absence in the service.

Confidence is **high**, **medium**, or **low**. Public vendor security and legal
statements were not independently audited for this study. This is not legal
advice.

## Executive verdict

**ADAPT as a delayed, aggregate provider-operations feed; never use it as the
request ledger, billing authority, tenant isolation control, or retrieval
evidence (high confidence).** The API provides useful count, response-code,
latency, cost, traffic, feature, extraction, tag, time, domain, and domain-health
views. Its strongest patterns are a dedicated analytics credential, exact
micro-currency values, explicit p80s, bounded pagination, composable filters,
hour/day/month/year buckets, and separately labeled organization/domain health.
[S1-S3]

Its decisive limitations are equally clear:

1. it is aggregate-only: no request ID, URL, per-request cost, timestamp, retry,
   cache, chosen network path, or evidence lineage is returned; [S1]
2. only time and domain are groupable; labels, tags, feature, extraction type,
   and source are filters rather than returned dimensions; [S1]
3. ordinary usage-data freshness, ingestion lag, correction behavior, retention,
   maximum query span, and bucket-boundary semantics are undocumented; only
   domain health has an explicit three-hour recalculation statement; [S1]
4. the required `organization_id` is caller-supplied, while the public contract
   does not state how the Stats key is bound to organizations or what scopes,
   roles, rotation, or audit controls it has; [S1]
5. the official Grafana example derives “success rate” as status code 200 divided
   by request count, but Zyte API separately defines provider success more
   broadly, including delivery of non-ban origin errors under an outer 200. The
   Stats documentation does not identify the status-code layer precisely enough
   to make this an SLO or billing-success definition. [S1][S2][S4]

**Verdict:** adopt the telemetry vocabulary and explicit micro-currency units;
adapt the feed behind Curiosity-owned request, cost, freshness, and tenant
ledgers; reject dashboard-derived success as semantic retrieval success and
aggregate Stats as billing reconciliation truth; defer operational dependency
until retention, lag, auth scope, status semantics, and correction behavior are
confirmed in writing and later contract-tested under separate authority.

## 1. Standalone surface and protocol

| Surface | Role | Output | Boundary | Verdict |
|---|---|---|---|---|
| `GET /api/stats` | USD-only aggregate query | Scalar micro-USD cost plus usage metrics | Rejects organizations billed in another currency | **DEFER legacy** |
| `GET /api/v1/stats` | Multicurrency aggregate query | Per-currency arrays plus the same usage dimensions | Currency absent from the period is omitted | **ADAPT** |
| Zyte dashboard Stats page | Interactive monitoring | Cost, response time, feature, and usage views | Account UI, not an export contract | **DEFER** |
| Published Grafana dashboard | Example external visualization | Derived success, cost, time, status, and domain panels | Stores/uses a Stats credential through a third-party plugin | **ADAPT cautiously** |

**FACT (high):** Both HTTP endpoints are read-only `GET` operations on the
separate host `https://zyte-api-stats.zyte.com`. They require HTTP Basic
authentication with a **Zyte dashboard API key**, not the Zyte API acquisition
key, as username and an empty password. The only required query parameter is an
integer `organization_id`, copied from the organization's dashboard URL. [S1]

**FACT (high):** The Stats API is limited to 20 requests/minute; excess requests
return HTTP 429. The rendered contract documents 200, 401, and 422 responses but
does not publish a Stats-specific 429 body or response schema. [S1]

**INFERENCE (high):** This is a reporting/read-model surface, not a synchronous
request-path API. Separate host and credentials, aggregate percentiles, and
three-hour domain-health calculation all point to telemetry being ingested and
queried outside acquisition response assembly.

**RECOMMENDATION:** Put a single bounded collector behind a provider-operations
adapter. Do not let workers, models, dashboards, or end users query it directly.
Use a secret manager, HTTPS verification, egress allowlisting, response-size and
deadline limits, and a collector-side rate budget below 20 RPM.

## 2. Query contract

### 2.1 Time, paging, filters, and grouping

| Parameter | Published contract | Operational interpretation |
|---|---|---|
| `organization_id` | Required integer | Requested organization/tenant selector; authorization binding is undocumented |
| `page` | Integer >=1; default 1 | Page number, not a continuation token |
| `page_size` | 1-500; default 500 | Hard maximum of 500 aggregate rows per response |
| `start_time` | ISO 8601 date-time; default seven days ago | Query lower bound; inclusivity and historical limit unknown |
| `end_time` | ISO 8601 date-time; default current time | Query upper bound; inclusivity and future-time behavior unknown |
| `domains` | String, maximum 64 characters | Domain filter; list grammar and exact/subdomain semantics undocumented |
| `apikey_labels` | String, maximum 64 characters | Filter by acquisition-key label, not by secret key value |
| `response_codes` | String, maximum 64 characters | Code filter; code layer and list grammar undocumented |
| `requested_features` | One documented enum value | `actions`, `browserHtml`, `fileDownload`, `httpResponseBody`, `networkCapture`, `screenshot`, `sessionContext`, or `extendedGeolocation` |
| `extraction_type` | One documented enum value | Eleven typed extraction families |
| `extraction_from` | One documented enum value | `httpResponseBody` or `browserHtml` |
| `tags` | String, maximum 64 characters | Comma-separated existence and `key:value` filters; all predicates must match |
| `groupby_time` | `hour`, `day`, `month`, `year`, or null | Returns the corresponding one time field per result |
| `groupby_domain` | Boolean; default false | Adds one row per domain and returns `domain` |
| `include_domain_health` | Boolean; default false | Requires `groupby_domain=true`, else 422 |

Source: rendered OpenAPI and prose in [S1].

**FACT (high):** Request tags originate on Zyte API acquisition requests as
arbitrary string keys with string or null values. Stats tag filters may require
a key's existence (`tag`) or an exact key/value (`tag:value`); comma-separated
predicates are ANDed. [S1][S5]

**FACT (high):** Only **time** and **domain** are grouping dimensions in the
public contract. API-key labels, response codes, requested features, extraction
type/source, and tags can narrow a query but cannot be returned as independent
group dimensions. Status codes are returned as a nested distribution within
each result. [S1]

**FACT (high):** The public Grafana template uses the same parameters and panels
for key metrics, request/success-rate time series, response-time time series,
cost time series, response-code distribution, and domain metrics. It requests
up to 500 results and configures no pagination traversal. [S2][S3]

**UNKNOWN:** The docs do not specify the grammar for `domains`, `apikey_labels`,
or `response_codes`; case folding; wildcard support; URL/IDN normalization;
registrable-domain versus hostname behavior; whether subdomains match; escaping
for commas/colons in tags; repeated-parameter behavior; or whether feature
filters mean “contains this feature” when several were requested.

**RECOMMENDATION — ADAPT:** Define Curiosity filters as typed arrays and a
versioned tag grammar. Validate against the provider's 64-character limit before
dispatch. Keep an explicit local mapping from Curiosity tenant/job/purpose to an
opaque, low-cardinality provider tag or dedicated API-key label; never put URLs,
queries, user IDs, emails, secrets, or personal data in labels/tags.

### 2.2 Aggregation shape

Without grouping, the example returns one aggregate row for the selected window.
Time grouping adds exactly one of `hour`, `day`, `month`, or `year`; domain
grouping adds `domain`; combining both can produce a time-by-domain result set.
[S1]

**INFERENCE (high):** Pagination primarily bounds dimension cardinality, notably
domain-by-time results. Since pages use numeric offsets and there is no snapshot
or cursor token, data arriving or being corrected during a multi-page walk could
move rows and cause duplicates or omissions.

**UNKNOWN:** Ordering, stable pagination, empty-bucket emission, sparse series,
maximum groups, maximum query duration, server timeout, response byte limit,
sort key, and whether concurrent writes can change page membership are not
documented.

**RECOMMENDATION:** Query closed, non-overlapping windows after a configurable
settling delay; request the finest needed grouping directly; page to
`total_result_count`; deduplicate by organization + exact window + bucket +
domain; then re-read a bounded recent correction window. Do not infer a zero
from a missing bucket until the provider confirms sparse-series semantics.

## 3. Response schema and metric semantics

### 3.1 Envelope

Both endpoints return:

```text
page, page_size, results[], total_result_count
```

Each result requires `organization_id`, `request_count`,
`billed_traffic_bytes`, and average/p80 response time. Legacy USD results also
require all three cost fields; V1's multicurrency cost arrays are not marked
required in the rendered schema. Optional grouping fields, nested
`status_codes`, and optional `domain_health` may appear. [S1]

**FACT (high):** `page_size` is at most 500. The legacy schema requires
`total_result_count >= 1`, while the V1 schema allows `>= 0`. Result rows require
`request_count >= 1`, so no explicit zero-count result row is representable.
[S1]

**CONTRACT DRIFT (high):** The legacy prose examples serialize cost and response
time values as JSON strings (for example, `"1335.10"` and `"5.49"`), while the
rendered OpenAPI declares them as JSON `number`. Domain-health rates, prices,
times, and spend are explicitly typed as strings. A collector cannot safely
assume homogeneous JSON numeric types. [S1]

**RECOMMENDATION:** Parse decimal strings and JSON numbers into arbitrary-
precision decimal/integer types with strict non-negative validation. Quarantine,
rather than coerce, unknown currencies, malformed timestamps, NaN/infinity,
negative values, duplicate currency entries, or count inconsistencies.

### 3.2 Usage, status, latency, and traffic

| Field | Meaning established publicly | Important caveat |
|---|---|---|
| `request_count` | Requests in selected aggregate | Whether it includes every failed/rate-limited attempt is not defined |
| `status_codes[]` | Nullable integer `code` plus count | Status layer and meaning of null are not defined |
| `response_time_sec_avg` | Average response time in seconds | Population/start-stop points are not defined |
| `response_time_sec_p80` | 80th-percentile response time in seconds | Quantile algorithm and population are not defined |
| `billed_traffic_bytes` | Total traffic subject to per-GB billing | Zero for requests without that billing mode, not total network bytes |

**FACT (high):** Billed traffic is non-zero only for requests that trigger
per-GB charges, such as device-residential IP or extended-geolocation requests.
It is zero otherwise. It therefore cannot measure total ingress/egress, payload
size, browser capture bytes, or Curiosity bandwidth. [S1][S6]

**FACT (high):** The official Grafana example derives “successful requests” as
the count where `code=200`, and “success rate” as that value divided by
`request_count`. These are dashboard computations, not response fields. [S3]

**CONTRADICTION / SEMANTIC RISK (high):** Zyte API defines a provider-successful,
billed response as outer HTTP 200 even when the target returns a non-ban error,
browser actions fail, or automatic extraction mismatches. Stats' sample includes
200, 404, and null codes, but does not say whether codes are outer provider,
target-origin, proxy, or another normalized status. Therefore neither the
Grafana 200 ratio nor `domain_health.my_success_rate_*` may be treated as
retrieval quality, billable success, useful yield, or SLO compliance without a
written semantic definition. [S1][S3][S4]

**UNKNOWN:** Retries, provider attempts hidden behind one caller request, action
failure, extraction mismatch, target status, Zyte outer status, ban class,
timeout class, rate-limit class, and charged/free outcome cannot be separated by
the Stats result schema.

**RECOMMENDATION — REJECT DASHBOARD SUCCESS:** Curiosity must calculate at least:

```text
dispatch acceptance
provider transport success
provider delivered/billable outcome
origin response class
artifact completeness (including actions/truncation)
semantic extraction validity
useful downstream yield
policy and budget outcome
```

All must come from a local request ledger. Stats is a delayed cross-check only.

### 3.3 Cost

**FACT (high):** `/api/stats` reports `cost_microusd_total`, `_avg`, and `_p80` in
millionths of USD and rejects organizations billed in other currencies.
`/api/v1/stats` replaces those scalars with `cost_micro_total`, `_avg`, and `_p80`
arrays. Each item has a three-character ISO 4217 currency code and a non-negative
micro-unit value. Divide by 1,000,000 for the main currency unit. Only currencies
present during the selected timeframe appear; absence means not used, not zero.
[S1]

**FACT (high):** Zyte API acquisition pricing is target- and request-type-tiered,
with additional feature, CPU/network, output-size, token, residential, and
geolocation charges. Zyte states that only provider-successful acquisition
responses are charged; rate-limited and unsuccessful responses are free. Plan,
organization, and API-key spending controls exist, while domain alerts are
informational rather than blocking. [S4][S6]

**UNKNOWN:** Stats query pricing is not stated. More importantly, the Stats
contract does not define the denominator for average/p80 cost, rounding,
discount/tax/credit/refund inclusion, invoice-finalization lag, retroactive tier
changes, currency conversion treatment, or whether totals are estimated or
invoice-grade.

**INFERENCE (high):** Total cost is additive within the same currency and
non-overlapping population; average and p80 are not. A p80 of hourly p80s is not
the daily p80, and averages cannot be recomposed exactly without a documented
denominator and sum. Multicurrency totals must never be summed without an
explicit exchange-rate policy.

**RECOMMENDATION — ADOPT/STRENGTHEN:** Store money as `(currency,
decimal_micro_units)` because the schema permits numeric rather than strictly
integral values, and query desired periods directly. Compare Stats totals against
local estimated/observed request cost and invoices with explicit tolerances and
lag windows. Alert on divergence; never overwrite local request costs or approve
more work based solely on a delayed aggregate.

### 3.4 Domain health

**FACT (high):** Domain health is returned only when both
`groupby_domain=true` and `include_domain_health=true`. It targets the
organization's top 100 most-requested domains over the last seven days. A domain
that is not recent or not in that top set gets `null`. Domain health is not real
time; it is calculated once every three hours. [S1]

It exposes:

- global average success rate for 24 hours and seven days;
- the caller's average price, response time, request count, and success rate for
  24 hours and seven days;
- total spend and total successful requests for 24 hours and seven days; and
- status: `healthy`, `possible_misconfiguration`,
  `issue_under_investigation`, or `possible_performance_issue`. [S1]

**INFERENCE (medium):** `global_*` and unqualified `total_*` likely derive from a
cross-customer domain cohort, while `my_*` is organization-specific. This is a
useful provider-wide control-plane signal, but cohort membership, minimum sample
size, anonymization, and status thresholds are not public.

**UNKNOWN:** Success definition, status algorithm, minimum counts, confidence
intervals, outlier handling, customer/region/product mix, price-discount effects,
domain canonicalization, and whether global totals include the caller are not
documented. The top-100 wording also does not state whether ranking occurs before
or after user filters.

**RECOMMENDATION — ADAPT:** Treat provider domain health as a low-authority hint
for operator triage, never as permission to accelerate traffic, bypass target
policy, reclassify errors, or increase spend. Curiosity should maintain its own
tenant-origin health from request-level events and minimum-sample/confidence
rules.

## 4. Granularity, freshness, retention, and corrections

### Established facts

- Default query interval is the preceding seven days through current time. [S1]
- Time grouping supports hour, day, month, and year. [S1]
- Domain health has fixed 24-hour and seven-day views and is recomputed every
  three hours. [S1]
- The public Grafana demo defaults to seven days and daily grouping. [S3]

### Negative results

**NEGATIVE RESULT (high importance):** No reviewed public first-party source
states ordinary Stats event ingestion lag, update cadence, watermark, “data
complete through” timestamp, late-arrival window, or freshness SLA.

**NEGATIVE RESULT (high importance):** No public Stats contract found here states
usage-event or aggregate retention, oldest queryable date, maximum query span,
roll-up schedule, downsampling, deletion behavior, or whether historical results
remain stable.

**NEGATIVE RESULT (high):** Bucket timezone, bucket labels, start/end
inclusivity, daylight-saving handling, leap-second behavior, partial-current-
bucket semantics, empty buckets, and ordering are not documented.

**NEGATIVE RESULT (high):** There is no query snapshot ID, server observation
time, generation timestamp, ETag/version, correction marker, settlement state,
or invoice linkage in a response.

**RECOMMENDATION:** Curiosity must annotate every pull with local
`query_started_at`, `query_completed_at`, exact requested interval, provider
endpoint/version, response hash, page count, and observed schema version. Keep a
provisional horizon, re-query recent closed windows, and mark values
`provisional | settled_locally | superseded`; only a written provider SLA can
turn that local convention into an upstream completeness guarantee.

## 5. Authentication, tenant boundaries, and security

### 5.1 What is established

**FACT (high):** Stats uses a dashboard API key separate from the acquisition
key and HTTP Basic authentication over an HTTPS URL. Organization ID is an
explicit required query parameter. [S1]

**FACT (high):** The official external-dashboard guide instructs users to install
Grafana's Infinity data-source plugin and configure it to fetch from the Stats
host with the Stats dashboard key. The published dashboard then takes an
organization ID as a text variable. [S2][S3]

**FACT (medium-high, contractual statement):** Zyte's DPA describes
confidentiality, least-privilege administrative access, centralized event logs,
daily vulnerability scans, incident handling, TLS 1.2 in transit, and an
ISO-27001-aligned risk program; it also addresses subprocessors, transfer
mechanisms, and security-event notice. These are vendor contractual statements,
not a Stats-specific assurance report reviewed here. [S8]

### 5.2 Boundary gaps

**UNKNOWN (critical):** Public Stats docs do not say:

- whether a dashboard key is bound to exactly one organization, several
  organizations, or dashboard-user permissions;
- whether the supplied `organization_id` is checked against that binding;
- who can create/read/revoke a Stats key, whether scopes or expiry exist, or
  whether multiple purpose-specific keys are supported;
- whether key use is audit-logged or visible to organization owners;
- whether SSO/MFA, IP allowlists, service accounts, key labels, or rotation grace
  periods apply;
- whether one organization can observe another organization's domain health or
  stats by changing the integer ID; or
- rate-limit scope (credential, source IP, organization, or service-wide).

The rendered OpenAPI operations contain an empty `security` array despite the
same page's prose requiring Basic authentication. This appears to be generator/
documentation drift and must not be interpreted as anonymous access. [S1]

**RECOMMENDATION — PROCUREMENT/CONTRACT GATE:** Obtain the authorization matrix
and lifecycle documentation. In a later separately authorized owned-account
test, verify negative cross-organization access, revoked-key behavior, malformed
organization IDs, and audit records. No such test was performed here.

### 5.3 Credential and dashboard risk

**INFERENCE (high):** A Stats key can reveal commercially and operationally
sensitive information: domains targeted, volume, latency, features, extraction
mode, key labels, tags, billed traffic, and spend. Read-only does not mean
low-impact.

**RECOMMENDATION:**

1. Use a dedicated least-privilege Stats credential, never an acquisition key.
2. Store it only in a secret manager; never in dashboard JSON, source control,
   URLs, browser variables, logs, screenshots, or error payloads.
3. Prefer a server-side collector over exposing Basic credentials to browsers or
   general dashboard plugins. If Grafana is approved, pin/review the Infinity
   plugin, restrict data-source editing and query inspection, and keep credentials
   server-side.
4. Redact organization IDs, domains, labels, tags, and costs according to
   operational-data classification; separate customer views at Curiosity's own
   authorization layer.
5. Rate-limit, cache briefly, and fan out sanitized local metrics rather than
   sharing the provider key across dashboards.

## 6. Errors, limits, and collector behavior

| Condition | Published response | Safe collector behavior |
|---|---|---|
| Success | 200 JSON | Validate complete envelope and every field |
| Bad/missing auth | 401 HTTP error | Stop; alert; never retry credentials indefinitely |
| Invalid query/dependency | 422 validation error | Permanent for normalized request; quarantine contract drift |
| Above 20 RPM | 429 | Honor bounded backoff; preserve next scheduled collection |
| Non-USD org on legacy endpoint | Rejected | Use `/api/v1/stats` |
| `include_domain_health` without domain grouping | 422 | Reject locally before dispatch |
| More than 500 rows | Multiple numeric pages | Walk bounded pages; detect movement/duplicates |

**FACT (high):** 401 bodies use a generic object with `message` and `detail`;
422 bodies use field-oriented validation details. No response headers,
`Retry-After`, error type codes, request/correlation ID, 5xx schema, or timeout
behavior are documented in the Stats reference. [S1]

**CONTRACT DRIFT (medium-high):** Legacy `total_result_count` cannot represent
zero under its declared minimum, while V1 can. The Stats page says both endpoints
accept the same parameters, but only V1 has the safer empty-result cardinality.
[S1]

**RECOMMENDATION:** Use V1 by default. Apply finite attempts, deadline, page,
result, byte, and wall-clock budgets. Retry only 429 and bounded transient 5xx/
network failures with jitter; do not retry 401/422. A failed pull must preserve
the last-known sample as stale with age, never silently present it as current.
Instrument collector errors independently from Zyte acquisition errors.

## 7. Pricing, privacy, and legal treatment

### Pricing and spend controls

**FACT (high, time-sensitive):** Zyte acquisition cost varies by target tier,
HTTP/browser mode, feature use, residential/extended-geolocation traffic, and
discount. Public plans have monthly plan/spending limits; additional organization
and API-key blocking limits can be configured. Domain alerts are informational
only. [S6]

**RECOMMENDATION:** Use Stats to detect cost slope, concentration, tier/feature
change, and local-ledger divergence. Keep Curiosity hard budgets at tenant, job,
purpose, origin, provider key, and provider levels. Because domain alerts do not
block and Stats lag is unknown, a poller is not a spend circuit breaker.

### Privacy and service-data handling

**FACT (high):** Zyte's Privacy Policy says service-usage logs are kept as long
as needed for service security and integrity; it gives examples of longer
support and billing retention but no single fixed Stats-data duration. [S9]

**FACT (high):** Zyte's Terms define Service Data broadly and permit service data
use for product development and product training unless an applicable agreement
changes that position. The DPA places controller obligations for Service
Personal Data on the customer and processor obligations on Zyte; international
processing/transfers may occur. [S7-S9]

**INFERENCE (high):** Domains, API-key labels, and tags can reveal customers,
research targets, investigations, competitive plans, or personal identifiers.
The global domain-health aggregates also imply some cross-customer analytical
processing, though the public source does not disclose individual customers.

**UNKNOWN:** Stats-specific raw-event retention, aggregate retention, backup
deletion, regions, subprocessors, tenant partitioning, global-metric privacy
thresholds, data export/deletion, and whether labels/tags are used for training
are not publicly specified in the reviewed contract.

**RECOMMENDATION — ADAPT/DEFER:** Treat Stats metadata as confidential operational
data. Use opaque identifiers and data minimization. Before sensitive workloads,
obtain a no-independent-use/no-training override, retention/deletion schedule,
region/subprocessor matrix, assurance evidence, and an explicit account-closure
deletion path. Do not use tags as a shadow database.

## 8. Clean-room architecture inference

The following is **INFERENCE**, not Zyte implementation disclosure.

```text
Zyte API request path
  auth / account / API-key label / request tags
       |
  target-aware acquisition + optional features/extraction
       |
  outcome + latency + billable feature/traffic/cost events
       v
append/stream telemetry ingestion
       |
normalization + organization/domain attribution
       |
time/domain aggregate and quantile materialization
       +------------------> billing/spend controls
       +------------------> 3-hour domain-health cohort job
       v
Stats read model
       |
separate Basic-auth gateway at zyte-api-stats.zyte.com
       |
filtered/grouped pagination -> dashboard / Grafana / collector
```

### A. Separate analytical read path — **high confidence logically**

Evidence: separate host and key, aggregate-only GET, p80 metrics, and no request
artifact fields. The contract is optimized for reporting, not per-request
decisions. [S1]

### B. Event enrichment before aggregation — **medium-high confidence**

Evidence: filters join request-selected features, extraction source/type, tags,
API-key labels, domain, traffic billing, latency, status, and cost. A normalized
usage event or equivalent logical record must contain those dimensions before
they disappear into aggregates. [S1][S5]

### C. Materialized/cohort domain-health computation — **high confidence
logically**

Evidence: fixed 24-hour/seven-day fields, top-100 eligibility, global versus
`my_*` metrics, finite statuses, and explicit three-hour recalculation. [S1]

### D. Billing and Stats share cost facts — **medium confidence**

Evidence: micro-currency totals, billed traffic, target/feature pricing, and
spending controls. Whether Stats reads invoice-grade ledger entries or a parallel
estimate is unknown; reconciliation semantics are not public. [S1][S6]

### E. Offset/page query over mutable aggregates — **medium confidence**

Evidence: page/page-size/total count without cursor or snapshot. Storage engine,
physical index, stream technology, quantile algorithm, and correction process
remain intentionally unknown and irrelevant to clean-room transfer.

## 9. Curiosity operations contract implications

### Provider-neutral local event (recommendation)

Stats cannot supply Curiosity's canonical event. The owned request ledger should
retain at least:

```text
event_id, request_id, attempt_id, parent_job_id, tenant_id, purpose_id
provider, adapter_version, provider_key_alias (never secret), provider_request_id
requested_url_hash/domain, policy decision, requested/effective capabilities
queued_at, started_at, origin_observed_at, completed_at
transport/provider/origin/action/extraction/semantic status
retry/rate-limit lineage, request/response/artifact bytes, truncation
estimated_cost[], observed_request_cost[], billing_disposition
freshness/cache disposition, artifact/evidence references
tags from a governed low-cardinality namespace
```

Provider aggregate imports should be a separate record:

```text
provider, endpoint_version, organization_alias
requested interval, grouping/filter digest, page/result counts
query start/end, ingestion age = unknown unless provider supplies watermark
raw response hash, parsed schema version
currency totals, counts, latency summaries, traffic, status distribution
provisional/superseded state, reconciliation delta, source citation/version
```

### Why the separation matters

- Aggregates cannot reconstruct retries or per-request evidence.
- p80 cannot be merged safely from subgroups.
- provider status code 200 is not semantic usefulness.
- Stats tags and labels are provider-specific and length-limited.
- provider organization is not Curiosity tenant unless deployment guarantees a
  one-to-one boundary.
- delayed spend metrics cannot prevent a fast cost overrun.
- expired provider telemetry must not erase Curiosity's audit obligations.

## 10. Verdict ledger

### ADOPT

1. Separate operations credentials and endpoints from acquisition credentials.
2. Exact micro-unit money values with explicit ISO currency.
3. Total, average, and p80 as distinctly named metrics.
4. Explicit time/domain grouping and feature/extraction/tag filters.
5. Status-code distributions instead of a single success scalar.
6. Bounded page size and explicit total result count.
7. A provider-wide domain-health hint clearly separate from “my” metrics.
8. Published external-dashboard examples as inspectable, non-normative clients.

### ADAPT

1. Aggregate Stats -> delayed reconciliation against a local request ledger.
2. Organization ID -> explicit provider-account alias, never implicit tenant ID.
3. API-key labels/tags -> governed opaque dimensions with cardinality/privacy
   budgets.
4. Response-code ratio -> typed provider/origin/artifact/semantic SLOs.
5. Provider p80 -> query at the exact desired population; do not roll up p80s.
6. Domain health -> low-authority triage signal with local corroboration.
7. Polling -> closed windows, settling delay, overlap/correction reads, and stale
   age.
8. Grafana example -> server-side sanitized metrics, reviewed plugin, no shared
   provider credential.
9. Spending limits -> Curiosity pre-dispatch hard budgets and local cost slope.

### REJECT

1. Stats as request-level provenance or evidence.
2. `code=200 / request_count` as retrieval-quality, billing, or semantic success.
3. Aggregate cost as a real-time circuit breaker or final invoice truth.
4. Missing bucket/currency as zero without contract-defined semantics.
5. Combining averages or p80s across pages/windows without sufficient statistics.
6. Exposing the dashboard key to browsers, agents, ordinary workers, or users.
7. Putting URLs, queries, users, secrets, or personal data in labels/tags.
8. Treating caller-supplied `organization_id` as proof of authorization.
9. Treating global health as permission to increase target traffic.

### DEFER

1. Production reliance until auth/tenant scope, retention, lag, corrections,
   status semantics, and cost settlement are confirmed.
2. USD legacy endpoint; prefer V1 if a future adapter is approved.
3. Sensitive/customer-identifying telemetry until contract, security, retention,
   and no-training gates are met.
4. Automated budget decisions from Stats until freshness/watermark SLA exists.
5. Cross-customer domain-health automation until cohort/privacy/sample semantics
   are documented.
6. Any live contract test; caller authorized documentation research only.

## 11. Unknowns and required checks

| Unknown / risk | Confidence now | Required check before reliance |
|---|---:|---|
| Stats key organization/role scope and ID authorization | Low | Written auth matrix; later owned multi-org negative test under separate authority |
| Stats key creation, expiry, rotation, revocation, and audit log | Low | Dashboard/security documentation and procurement response |
| Ordinary metric ingestion lag and completeness watermark | Low | Published/written SLA; controlled closed-window observation later |
| Raw-event and aggregate retention / maximum query span | Low | Contract, privacy/security schedule, account documentation |
| Late corrections and stable pagination | Low | Written semantics; later bounded overlap/page test |
| Start/end inclusivity and bucket timezone | Low | OpenAPI clarification and DST boundary test only if authorized |
| Empty buckets and result ordering | Low | Contract clarification |
| Meaning/layer of `status_codes` and null code | Low | Field-level semantic definition across HTTP/proxy modes |
| Denominators/populations for request, latency, and cost | Low | Metrics dictionary |
| Quantile algorithm and low-sample behavior | Low | Metrics dictionary; do not depend on exact p80 meanwhile |
| Invoice-grade versus estimated cost; credits/tax/discounts | Low | Billing reconciliation specification |
| Stats API query charge | Low | Pricing/support confirmation |
| Domain, API-key-label, and response-code filter grammar | Low | Current reference or vendor examples |
| Domain canonicalization/subdomain semantics | Low | Written contract and owned fixtures later |
| Domain-health cohort, threshold, and sample/privacy rules | Low | Product/privacy explanation |
| Error body/request ID/Retry-After and 5xx behavior | Low | Versioned OpenAPI and operational contract |
| Stats-specific regions, subprocessors, deletion, training use | Low | DPA/order form/Trust Center package |
| JSON string-versus-number compatibility commitment | Medium-low | Versioned schema and consumer contract |

## 12. Clean-room observability lessons

1. Transfer the **behavioral need** for typed dimensions, explicit money units, aggregate
   windows, and bounded queries—not Zyte field names or dashboard JSON.
2. Keep provider adapters separate from Curiosity's neutral telemetry and tenant
   authorization contracts.
3. Preserve raw provider responses only under defined access/retention policy;
   normalized aggregates must link to a response hash and import run.
4. Never infer private storage, stream, quantile, billing, or health algorithms
   beyond what public behavior logically requires.
5. Treat dashboard formulas as client examples, not normative API semantics.
6. Treat Stats output and labels as untrusted external data: validate shape,
   length, currency, timestamps, counts, and display escaping.
7. Keep the acquisition request ledger authoritative; a reporting read model is
   necessarily lossy and potentially delayed.
8. Re-check OpenAPI, Grafana example, pricing, security, privacy, and legal terms
   immediately before procurement because the schema and commercial surface can
   change independently.

## 13. Bounded curiosity pass

After synthesis, gaps were scored 1-5 for **relevance (R)**, **decision value
(V)**, **novelty (N)**, and **cost (C, lower is better)**. Only public
primary-source checks requiring no account or live API request were eligible.
Priority was approximately `R + V + N - C`.

| Thread | R/V/N/C | Result |
|---|---:|---|
| Exact rendered OpenAPI and V1 multicurrency delta | 5/5/4/1 | **Pursued.** Confirmed fields, enums, pagination, numeric-type drift, and legacy/V1 empty-result difference. [S1] |
| Official Grafana formulas | 5/5/5/1 | **Pursued.** Found that “success” is client-derived as code-200 ratio and that the template does not traverse pagination. [S3] |
| Status-code layer versus Zyte success semantics | 5/5/5/2 | **Pursued to saturation.** Cross-source contradiction retained; exact layer remains unknown. [S1][S4] |
| Ordinary freshness/retention/watermark | 5/5/4/2 | **Pursued to saturation.** Only domain-health three-hour cadence found; negative result retained. |
| Auth-to-organization binding | 5/5/4/2 | **Pursued to saturation.** Separate key and required organization ID confirmed; scope/binding remains undocumented. [S1] |
| Domain-health cohort/privacy semantics | 4/4/4/2 | **Pursued.** Public fields and top-100/three-hour limits captured; algorithm/sample rules remain unknown. [S1] |
| Private API probes with guessed organization IDs | 5/5/3/5 | **CURIOSITY_NO_GO:** prohibited by caller, unauthorized, and unnecessary to retain the critical auth unknown. |
| Account dashboard/key-creation inspection | 4/4/2/5 | **CURIOSITY_NO_GO:** requires account access; procurement check recorded. |
| Reverse-engineer private storage/quantile/health algorithms | 1/2/4/5 | **CURIOSITY_NO_GO:** proprietary, contract-irrelevant, and outside clean-room boundary. |
| Install/run Grafana Infinity with a credential | 2/3/2/5 | **CURIOSITY_NO_GO:** no credential/live call authority; static first-party dashboard was sufficient. |
| Competitor observability comparison | 2/2/3/4 | **CURIOSITY_NO_GO:** outside standalone Zyte decision frame. |
| Legal interpretation by jurisdiction | 4/5/3/5 | **CURIOSITY_NO_GO:** counsel task; contractual facts and procurement checks retained. |

**Stop reason:** coverage plus saturation. Every requested category has public
primary-source evidence or a clearly bounded negative result. Remaining material
questions require account documentation, a vendor answer, assurance access,
counsel, or separately authorized owned-account tests. No autonomous follow-up
is authorized.

## 14. Sources

All sources are first-party Zyte materials accessed **2026-08-17**.

- **[S1]** Zyte, *Zyte API Stats API* (prose and rendered OpenAPI):
  <https://docs.zyte.com/zyte-api/usage/stats/index.html>
- **[S2]** Zyte, *External dashboard integrations*:
  <https://docs.zyte.com/zyte-api/usage/stats/dashboards.html>
- **[S3]** Zyte, published `stats_api_demo.json` Grafana dashboard:
  <https://docs.zyte.com/_static/stats_api_demo.json>
- **[S4]** Zyte, *Zyte API error handling*:
  <https://docs.zyte.com/zyte-api/usage/errors.html>
- **[S5]** Zyte, *Zyte API reference documentation* (`tags`, features, response
  semantics): <https://docs.zyte.com/zyte-api/usage/reference.html>
- **[S6]** Zyte, *Zyte API pricing*:
  <https://docs.zyte.com/zyte-api/pricing.html>
- **[S7]** Zyte, *Terms of Service*:
  <https://www.zyte.com/terms-policies/terms-of-service/>
- **[S8]** Zyte, *Data Processing Agreement*:
  <https://www.zyte.com/terms-policies/dpa/>
- **[S9]** Zyte, *Privacy Policy* (page states effective 2024-08-30):
  <https://www.zyte.com/terms-policies/privacy-policy/>

## 15. Confidence summary

- **High:** endpoints, separate credential, required organization ID, query
  parameters, time/domain grouping, metrics, multicurrency shape, 500-row page
  bound, 20 RPM, domain-health three-hour/top-100 behavior, and official Grafana
  formulas.
- **Medium:** asynchronous read-model/event-enrichment architecture, mutable-page
  risk, cross-customer interpretation of global domain health, and completeness
  of negative searches over changing public documentation.
- **Low / unknown:** auth-to-organization binding, ordinary lag/retention,
  correction and bucket semantics, status-code layer, metric denominators,
  quantile algorithm, invoice reconciliation, Stats query price, and
  account-specific privacy/security/legal exceptions.
