# Bright Data Dataset Marketplace: clean-room reverse-engineering dossier

**Research and primary-source access date:** 2026-08-17  
**Scope:** Bright Data **Dataset Marketplace as a standalone finished-data
product**: catalog, schemas, subsets/views, synchronous Search, asynchronous
Filter, snapshots, delivery, subscriptions, updates, freshness, provenance,
quality, economics, rights, privacy, deletion, and clean-room implications.
Web Scraper API, Scraper Studio, Crawl API, Deep Lookup, proxies, and Browser API
are excluded except where Marketplace documentation names collection or delivery
dependencies.  
**Authority and access boundary:** Public Bright Data documentation, API
references, release notes, product/pricing pages, MSA, AUP, privacy policy,
security page, and public DPA only. No account, credential, control-panel access,
sample or dataset download, purchase, API request, data-row corpus, target-site
request, private term, or implementation was used.

## 1. Decision frame and evidence rules

### Decision

> Can a purchased or subscribed Marketplace dataset safely supply bounded,
> attributable, update-aware records to Curiosity without becoming its source of
> truth, provider-neutral contract, rights decision, or owned retrieval path?

Bounded sub-questions:

1. What is cataloged, and what identity/schema contract is public?
2. How do filtering, Search, Filter, views, snapshots, and delivery behave?
3. What do “fresh,” scheduled, and delta updates actually establish?
4. What source lineage and collection evidence accompany records?
5. Which validation controls measure shape, completeness, stability, and identity?
6. What license, source-rights, privacy, correction, deletion, and retention
   obligations remain with the customer?
7. What are the price meters and bounded operational limits?
8. Which concepts should Curiosity adopt, adapt, reject, or defer without copying
   provider data, schemas, or proprietary behavior?

### Labels

- **FACT** — directly stated or exposed by a cited Bright Data primary source.
- **INFERENCE** — least-assumptive clean-room explanation of public behavior, not
  a claim about private code, models, collection methods, or physical topology.
- **RECOMMENDATION** — Curiosity design, governance, legal, or procurement action.
- **UNKNOWN / NEGATIVE RESULT** — not established by reviewed public sources.
- Confidence is **high**, **medium**, or **low**. Marketing, compliance, scale,
  quality, representativeness, and freshness statements remain vendor claims.

## 2. Executive synthesis and verdict

**FACT (high):** Marketplace is a vendor-operated catalog of pre-collected and
fresh-on-demand structured datasets. Customers can inspect a dictionary and
fill-rate/freshness summaries; select/rename fields; filter records; make a
one-time purchase or subscription; query some data synchronously; create bulk
filter snapshots; and receive files through API pull or external destinations
[S1-S13]. It is data acquisition, not live public-web search.

**INFERENCE (high):** the observable product is a shared, mutable provider corpus
published through dataset definitions and serving indexes, then projected into
customer-specific views and point-in-time delivery snapshots. A `dataset_id`
selects a corpus/schema family; a view selects recurring filters/projection; a
snapshot represents one materialized result; a delivery job moves that result.
The public contracts do not prove a physical database, index pipeline, or
collection architecture.

**Material strengths (high):** explicit field dictionaries; field-level fill
rates; expressive but bounded filters; bulk and low-latency query lanes; distinct
snapshot and delivery resources; record/file bounds; recurring views; and a
provider validation workflow that surfaces failed tests rather than treating all
output as silently valid [S3-S16].

**Material blockers (high):**

1. no public immutable dataset/schema version, schema hash, change notice contract,
   record-version contract, or stable primary-key guarantee;
2. “freshness” means how recently data was collected, not proof of exact
   per-record observation time, source currency, or origin contact;
3. broad public/ethical/diverse-source claims do not provide a uniform row- or
   field-level lineage, source capture, or rights grant;
4. validation can be overridden, thresholds can be lowered, and a snapshot
   awaiting approval is automatically delivered after 14 days;
5. delta subscriptions disclose “new or updated” records but no public identity,
   comparison, deletion/tombstone, late-arrival, replay, or schema-change semantics;
6. Marketplace data may include public personal data and third-party enrichment,
   while public sources do not give a customer-facing deletion/correction feed or
   propagation SLA;
7. the MSA permits dataset-specific additional terms, places legality/privacy and
   rights responsibility on the customer, disclaims accuracy/completeness/
   non-infringement, and does not supply a general public grant for redistribution,
   model training, derived indexes, or use after termination [S17-S21]; and
8. catalog counts, available dataset counts, and list pricing are inconsistent
   across current first-party pages.

### Verdict

**DEFER acquisition; ADAPT the contracts; REJECT Marketplace as Curiosity's owned
retrieval or evidence foundation (high confidence).** A specifically identified
dataset may later be useful for bounded historical backfill, entity enrichment,
or an offline baseline, but only after its exact order form, dataset-specific
terms, source lineage, schema, privacy class, update semantics, deletion process,
and intended use are approved. Do not ingest a generic “Bright Data dataset.”

## 3. Product boundary and catalog

### 3.1 Catalog breadth and drift

**FACT (high):** the documentation overview says **350+ datasets from 250+
domains**, spanning social media, real estate, B2B, e-commerce, and AI training
[S1]. The Marketplace FAQ lists representative datasets from Amazon, Crunchbase,
Facebook, GitHub, Glassdoor, LinkedIn, Zillow, travel, real estate, social media,
and B2B sources, plus a few free datasets [S2].

**CONTRADICTION (high):** on the access date, the main product page simultaneously
displayed “Number of datasets 700+,” “250+ domains,” and “350+ datasets”; its hero
also claimed 21B+ total records. The dedicated pricing page instead displayed
“120+ domains” and “190+ datasets,” while docs and Dataset API pages used 250+
[S1][S22][S23]. These are changing marketing/catalog totals, not a stable coverage
contract.

**FACT (high):** `GET /datasets/list` returns only `id`, human name, and current
record count (`size`) for datasets available to the authenticated account [S4].
Availability is therefore account/entitlement-sensitive; the public marketing
catalog is not necessarily the callable catalog.

**UNKNOWN (high confidence):** no reviewed anonymous source provides a complete,
versioned machine-readable catalog with category, source-domain set, jurisdiction,
languages, time coverage, update cadence, license, privacy class, source count,
and retirement status. No public deprecation/tombstone contract for a
`dataset_id` was found.

**RECOMMENDATION (high):** freeze a procurement manifest for every candidate:
provider, dataset ID/name, order-form SKU, dataset-specific terms, source-domain
list, intended purpose, allowed users/uses, data classes, schema hash, advertised
record count/freshness, ordered update mode, and approval date. Catalog labels
must never authorize ingestion by themselves.

### 3.2 Product families are not one homogeneous corpus

**FACT (high):** named categories include records for people, companies, jobs,
products, reviews, posts, properties, places, travel, and enriched B2B data [S2]
[S22]. Product material also advertises text, images, videos, and structured data
[S22]. One priced “record” is one dataset-specific entity/row or JSON object; its
semantic unit varies from a person to a product, job, company, or post [S23].

**FACT (high):** standard LinkedIn profile records do not include email/phone, but
an enriched business-contact option can add them through a named RevenueBase
partnership; coverage varies [S2]. This is direct evidence that at least some
Marketplace products combine a target-site record with third-party enrichment.

**INFERENCE (high):** “Dataset Marketplace” is a commercial/product umbrella, not
a common ontology. Dataset IDs can differ in source chain, record identity,
privacy sensitivity, collection cadence, enrichment, and rights. A single global
approval or schema is unsafe.

## 4. Schema, identity, filtering, and serving

### 4.1 Public schema contract

**FACT (high):** each dataset page exposes a data dictionary with column name,
description, and type; it also exposes sample preview, fields, record count,
freshness, and minimum order. The public page says a download sample contains
1,000 records even though the preview shows 30; no sample was downloaded in this
research [S3].

**FACT (high):** authenticated metadata at
`GET /datasets/{dataset_id}/metadata` returns dataset ID and a map of fields. A
field can expose `type`, `active`, `required`, and `description`; documented type
examples include text, number, and URL [S5]. Customers can choose visible/exported
fields and can rename fields in a saved subset [S3][S6].

**FACT (high):** schemas can contain arrays and arrays of objects. Shared API
filters support scalar comparison, membership, text/array containment, null
checks, `and`/`or`, and three levels of nesting. `combine_nested_fields=true`
requires predicates to match in the same nested object [S7].

**UNKNOWN / NEGATIVE RESULT (high confidence):** public metadata does not expose:

- schema version, release/effective time, compatibility policy, or schema hash;
- a guaranteed primary key, uniqueness scope, record-version ID, or stable entity
  identity across snapshots;
- complete nullability, default, enum, unit, locale, normalization, precision,
  sensitivity, or field-level source metadata;
- transformation/enrichment lineage or source-to-field derivation;
- a dataset-level license or permitted-use object; or
- historical schemas and migration mappings.

An `active` field flag is evidence of mutability, not versioning.

**RECOMMENDATION (high):** acquire and hash the current dictionary through an
approved process before any purchase. Ingest into a provider-native quarantine
area first; validate expected keys, types, nesting, nullability, enum/cardinality,
privacy class, and semantic invariants. Never map mutable provider columns
directly into Curiosity's provider-neutral core.

### 4.2 Saved subsets and views

**FACT (high):** UI filters create named subsets; selected fields control preview
and exports. A dataset view is also documented as a “saved, filtered subscription”
that delivers fresh records on a recurring schedule and has its own view ID,
name, underlying dataset ID/name, and primary domain [S6][S10].

**INFERENCE (medium-high):** “subset” and “view” are provider-side logical query/
projection definitions reused across deliveries. Public APIs expose delivery
settings for views but not a complete immutable view definition, revision ID, or
filter/projection history.

**UNKNOWN (high confidence):** no reviewed API contract returns the full saved
filter, selected/renamed fields, update mode, schedule, schema version, or revision
history alongside each delivered snapshot. It is therefore not publicly
established that a snapshot alone can reconstruct the exact effective view.

### 4.3 Search and Filter are different serving lanes

**FACT (high):** the Dataset API has two paid record-serving endpoints [S8-S9]:

| Lane | Observable contract | Important bound |
|---|---|---|
| Search | `POST /datasets/search/:dataset_id`; synchronous, Elasticsearch-powered; returns `hits`, `total_hits`, `took`, and optionally `search_after` | alpha; three LinkedIn datasets on access date; recommended maximum 1,000 records/call; no file filters |
| Filter | `POST /datasets/filter`; asynchronous snapshot; all 250+ claimed datasets; JSON or multipart CSV/JSON filters | 200 MiB request, 10,000 rows/file, five-minute job, 100 parallel jobs/dataset, 120 calls/hour |

**FACT (high):** Search supports default, random, or field sorting and cursor
pagination when sorted. Filter returns `snapshot_id` and supports a record limit
[S8-S9]. Both use the same nominal filter object and cost $2.50 per 1,000 returned
records; zero-match operations are stated as free [S9][S13].

**FACT (high):** Bright Data warns that Search and Filter can return different
results because Elasticsearch tokenizes text differently from the snapshot
engine [S8]. Search documentation calls random-sort output a “representative
sample,” but publishes no sampling frame, randomization method, seed, bias, or
reproducibility guarantee.

**INFERENCE (high):** the same dataset ID does not imply identical query semantics
across lanes. Text matching, totals, order, cursor behavior, and repeated random
samples can differ independently of underlying data updates.

**RECOMMENDATION (high):** record requested and effective filter AST, field
projection, serving lane/engine, sort, cursor, query time, dataset/schema manifest,
result count, and cost. Never silently fail over Search to Filter or compare their
totals as if generated by the same semantics. Do not expose arbitrary field/filter
or random broad-sampling controls to an agent.

## 5. Snapshot and delivery lifecycle

### 5.1 Snapshot state and metadata

**FACT (high):** Marketplace Filter, fresh collection, and subscriptions can
produce snapshot IDs. `GET /datasets/snapshots/{id}` exposes `created`,
`scheduled|building|ready|failed`, dataset/customer IDs, record and file size,
cost, error/warning codes, and initiation type [S11][S15].

**FACT (high):** download uses
`GET /datasets/snapshots/{id}/download`, with JSON, JSONL/NDJSON, CSV, XLSX, or
Parquet in the schema, optional gzip, and record parts. `batch_size` is at least
1,000; a single file is limited to 5 GB; a parts endpoint computes the number of
parts using matching format/compression/batch parameters [S15-S16].

**DOCUMENTATION DRIFT (medium-high):** the download response advertises multiple
formats but describes HTTP 200 as `application/json` with a single object example;
the parts endpoint enumerates only JSON/NDJSON/JSONL/CSV while delivery supports
XLSX and Parquet [S15-S16]. Clients must honor actual content type/file framing,
not generate behavior from the response schema alone.

**FACT (high):** the MSA says datasets/exports may be retained for only a dynamic
“Review Period” specified in the platform, portal, or documentation. After it,
Bright Data may delete or stop retaining them with no obligation to store,
reproduce, redeliver, or verify original data/issues [S17]. API troubleshooting
also exposes an expired-snapshot condition [S24].

**UNKNOWN (high confidence):** no Marketplace-specific public fixed Review Period
was found. No checksum, ETag, immutable-manifest guarantee, snapshot revision,
exact expiry timestamp, or historical redelivery guarantee appears in the
reviewed Marketplace contracts.

**RECOMMENDATION (high):** export immediately into approved Curiosity-owned
storage; compute hashes and byte/row counts per part; retain provider metadata,
dictionary, effective filter/view manifest, warning/validation disposition,
invoice/order, and expiry. Do not treat provider retention as an archive.

### 5.2 Delivery is a separate operation

**FACT (high):** delivery destinations include API pull, webhook, email, S3, GCS,
GCP Pub/Sub, Azure, Snowflake, SFTP, Aliyun OSS, and (in the UI guide) Oracle OCI;
formats are JSON, NDJSON/JSONL, CSV, XLSX, and Parquet, with gzip and some TAR/CSV
flattening options [S10][S12][S14]. The docs say 11 methods, while API option
enums differ by endpoint and do not include OCI, another contract/UI mismatch.

**FACT (high):** delivering a ready snapshot creates a separate delivery job ID.
Its monitored terminal status is `done`, `canceled`, or `failed`, with filenames
and delivery timestamps. The same snapshot can be delivered repeatedly to
different destinations [S12]. Subscription views persist a destination, filename
template/timezone, format, flattening, TAR, compression, and batch size [S10]
[S14].

**UNKNOWN / NEGATIVE RESULT (high confidence):** reviewed public contracts do not
specify webhook signatures, replay prevention, retry schedule, event IDs,
ordering, duplicate behavior, transactional/atomic multipart delivery, checksum
manifests, or exactly-once semantics. They accept broad cloud/SFTP/warehouse
credentials; S3 also offers role ARN plus external ID [S12].

**RECOMMENDATION (high):** prefer authenticated pull or write-only object storage
role assumption. Treat push as at-least-once untrusted input; use a dedicated
ingress, allowlisted destination, independent authentication, dedupe keys,
reconciliation polling, strict bytes/records/decompression limits, and no agent-
selected destination or credentials.

## 6. Updates, time, and freshness

### 6.1 What the product states

**FACT (high):** a Marketplace “freshness” value means how recently data was
collected. Buyers can select pre-collected data, fresh data collected after order,
or a pre-collected time range “back from today” [S13][S25]. Product material says
pre-collected data may date from a few days to a couple of months [S22].

**FACT (high):** a scheduled collection may start earlier than its delivery date
because delivery deadlines are estimated from prior cycles and expected refresh
duration. Therefore collection timestamp and delivery date intentionally differ
[S2].

**FACT (high):** subscriptions are marketed with daily, weekly, monthly,
quarterly, biannual, or yearly schedules depending on dataset/product page;
release notes specifically said daily/weekly updates were available for 41 of 73
e-commerce datasets in March 2025, not universally [S22][S23][S26]. The MSA only
promises subscription updates “if and when available” [S17].

**FACT (medium-high):** release notes describe delta subscriptions that emit only
new or updated records, snapshot comparisons, and a “No changes detected” state
[S26]. The product page calls this Smart Data Updates and says customers can pay
for only new/updated records [S22]. These are vendor behavior descriptions, not a
complete normative change-data-capture schema.

### 6.2 What freshness does not establish

**UNKNOWN / NEGATIVE RESULT (high confidence):** no reviewed general Marketplace
contract defines:

- a guaranteed per-record origin fetch timestamp versus job/snapshot time;
- source publication/effective/valid time for every field;
- cache key, cache age, revalidation, stale-on-error, or origin-contact evidence;
- collection-window start/end and distribution across a large snapshot;
- recrawl prioritization, percentile freshness, or source-change-to-delivery SLA;
- update identity key, before/after values, changed-field list, comparison snapshot
  IDs, late-arrival handling, correction versus source change, or dedupe scope;
- deletion, disappearance, filter-exit, suppression, or privacy-removal tombstones;
- full-plus-delta replay order, sequence, gap detection, or backfill semantics; or
- a historical snapshot query API for an arbitrary prior catalog version.

**FACT (high):** when a purchase requests fresh collection for records outside a
selected pre-collected time range, refreshed records may no longer satisfy the
filter and be excluded, while the initial scrape remains chargeable [S25]. Thus a
requested candidate set, collected set, matched delivered set, and billed set can
differ.

**INFERENCE (high):** Marketplace freshness is a collection-age/product selection
signal. It is not bitemporal validity, source truth, or reproducible recency. A
delta feed without deletion semantics cannot maintain a correct mirror by itself.

**RECOMMENDATION (high):** store separately: order/query time, snapshot created
time, provider collection times when present, received time, source publication/
valid time when present, and provider freshness claim. Require periodic approved
full reconciliation until identity and tombstone semantics are contractually
proven. Never infer record age from delivery time or filename timestamp.

## 7. Provenance, collection, and representativeness

### 7.1 Vendor claims

**FACT (high that stated; quality unverified):** Bright Data calls Marketplace
data “ethically sourced from publicly available information,” and product pages
describe “reliable and diverse public online data sources,” cleaning,
structuring, validation, and continuous refresh [S1][S22-S23]. The privacy policy
says Bright Data collects publicly posted personal data from online sources,
processes it under legitimate interest subject to fundamental rights, and shares
Public Data with users to provide services [S18].

**FACT (high):** an individual dataset page can state “what domain we collect
from” [S3]. Records commonly include source-like URLs depending on the dataset,
and one download OpenAPI example includes `url` and an `input.url` [S15]. Enriched
contact data has a named partner in the FAQ [S2].

### 7.2 Provenance gaps

**UNKNOWN / NEGATIVE RESULT (high confidence):** the reviewed generic Marketplace
schema does not require, per record or field:

- exact source URL/final URL, redirect chain, source-domain list, or source count;
- observation timestamp, status, headers, content type, geo/session/render mode,
  or attempt history;
- immutable HTML/WARC/screenshot/source bytes and cryptographic binding;
- extraction/parser/enrichment/model version and transformation chain;
- direct versus inferred/derived/enriched classification;
- partner/source license, target terms, robots policy, lawful-basis assessment,
  or collection notice;
- field-to-passage/source grounding or contradiction/rejected-value history; or
- coverage denominator and sampling/collection methodology.

The presence of `url` in one example is not a universal evidence contract.

**INFERENCE (high):** a Marketplace record is a provider-curated assertion. The
provider may have observed source material, but the purchased row generally does
not let Curiosity independently replay or audit field derivation. Multi-source
and enriched datasets can further obscure source attribution.

**RECOMMENDATION (high):** require a dataset-specific lineage schedule before
purchase: source classes/domains/partners, collection method at a policy level,
field-level direct/derived/enriched mapping, timestamps, stable identity, source
URLs, deletion chain, and any permissible evidence artifacts. Mark every field
without evidence `provider_asserted`; do not synthesize provenance from dataset
name, URL shape, or freshness badge.

### 7.3 Coverage and random limits

**FACT (high):** each dataset displays current record count and field fill rates.
When a buyer sets a record limit, records are selected randomly according to the
purchase guide [S25]. Search also offers random sort [S8].

**UNKNOWN (high confidence):** no public methodology establishes whole-source
recall, geographic/language/time distributions, source independence, selection
bias, random seed, stable sampling frame, entity duplication rate, or confidence
intervals. “Complete Dataset” is a purchase tier label, not demonstrated complete
coverage of the real-world source.

## 8. Quality controls and their limits

### 8.1 Observable controls

**FACT (high):** Marketplace exposes fill rate (percentage of records where a
field is populated), record count, and collection freshness. Bright Data warns
that source availability and source quality cause varying fill rates, especially
for contact fields [S13].

**FACT (high):** automated validation rules can cover [S27]:

- uniqueness percentage;
- minimum fill rates and required fields;
- type/schema/custom field rules;
- value stability against prior collection;
- minimum record count and size fluctuation;
- per-record completeness; and
- unique identity/duplicate detection.

**FACT (high):** if tests fail, a developer may fix them or deliver with an
override explanation. The customer can approve, approve temporarily, set a new
or achieved threshold, ignore once, reject for repair, or eventually receive a
snapshot automatically after 14 days pending approval [S27].

### 8.2 Limits of validation

**INFERENCE (high):** these are conformance and distribution checks. They do not
prove source truth, current validity, lawful collection, representative coverage,
correct entity resolution, semantic consistency, or field-level evidence.
“Stability” can even flag a legitimate real-world jump; duplicate heuristics can
merge distinct entities or miss variants.

**FACT (high):** the MSA and privacy policy disclaim accuracy, completeness,
correctness, security, and non-infringement notwithstanding marketing quality
claims [S17-S18].

**RECOMMENDATION (high):** preserve validation rule/version, threshold,
denominator, result, override reason/actor/time, and approval state. Curiosity
must rerun owned schema, primary-key, referential, duplicate, privacy, source,
drift, freshness, and semantic checks; quarantine failed or unexplained deltas.
Auto-delivery must never equal auto-approval.

## 9. Pricing and cost bounds observed 2026-08-17

Public prices are volatile and sometimes promotional. This records meter shape,
not a quote or purchase authorization.

**FACT (high):** current Dataset API documentation prices Search and Filter at
**$2.50 per 1,000 returned records** and says zero matches are free. The FAQ says
the Filter API currently has neither monthly commitment nor $250 minimum [S9]
[S13]. A matched Filter request incurs compute/record charges when executed, not
only after a separate download/purchase action [S2].

**FACT (high):** the public pricing page describes one row/JSON object as one
record; hiding fields does not reduce record count. It gives a **100,000-record,
$250 one-time** example and says plans can have monthly commitment and overage
[S23]. The product hero says “up to $0.0025 per record” and “Min Order $250”
[S22].

**FACT (medium-high):** purchase docs show that Marketplace quotes can include
record cost, compute fee, minimum small-dataset cost, maximum snapshot cost,
fresh-collection surcharge, tax, and subscription discounts. One UI example
shows $0.0006/record, which is dataset/order-specific and conflicts with the
general $0.0025/record/API rate if read as universal [S25]. Product/pricing pages
advertise biannual 25%, quarterly 50%, and monthly 80% savings [S22-S23].

**INFERENCE (high):** price can depend on dataset, pre-collected versus fresh work,
records matched/returned, compute, minimum order, subscription cadence, and
promotion. Filter cardinality and refreshed records that later fail the filter
create cost before usefulness is known.

**RECOMMENDATION (high):** require an immutable quote/order manifest with maximum
records, expected and maximum price, compute/fresh surcharge, cadence, delta/full
mode, taxes, retry/redelivery rules, and cancellation. Preflight by provider
preview only under approved authority; set a lower Curiosity cap; reconcile
requested/candidate/collected/matched/delivered/accepted/billed records separately.

## 10. Licensing, rights, privacy, and deletion

This section reports contract text and product claims, not legal advice.

### 10.1 Dataset and service rights

**FACT (high):** the MSA classifies Datasets as Data Services and prohibits
distributing, transmitting, reproducing, publishing, licensing, transferring, or
selling data **to offer a similar or competitive product**. It also requires
legally valid purposes and compliance with applicable domestic/international
law, privacy, marketing, and third-party rights [S17].

**FACT (high):** Dataset Service terms say individual datasets may carry
additional terms and conditions. Subscription updates are only provided “if and
when available”; requested changes require approval and can cost extra. The MSA
makes fees noncancelable/nonrefundable, requires outstanding collected-data
charges on termination, says the granted license terminates, and requires the
client to stop using the Service [S17].

**FACT (high):** Bright Data disclaims warranties of non-infringement, accuracy,
completeness, security, quality, and fitness; liability is generally capped at
one month of fees; and the client broadly indemnifies Bright Data for third-party
IP, privacy, law, or damage claims arising from client use [S17].

**MATERIAL UNKNOWN (high):** reviewed public terms do not clearly grant or define
for Marketplace output:

- perpetual possession/use after subscription or Agreement termination;
- internal sharing across affiliates/contractors or multi-tenant end users;
- publication, redistribution, resale, or customer-facing query results outside
  the “competitive product” prohibition;
- derivative datasets, embeddings, search indexes, cached excerpts, analytics,
  or model training/evaluation rights;
- rights to source text/images/video, screenshots, or evidence artifacts;
- treatment of corrections/deletions in derived systems; or
- conflict order among MSA, dashboard, order form, dataset-specific terms, source
  terms, and third-party enrichment licenses.

Marketing AI-training use cases are product positioning, not a copyright/privacy/
source-license grant [S1][S22].

**RECOMMENDATION (high):** counsel must approve the exact dataset, entity,
jurisdiction, fields, purpose, recipients, retention, and derivative outputs.
Require an order-form rights matrix covering internal retrieval/indexing,
embeddings, excerpts, model training/evaluation, redistribution, post-termination
retention, deletion propagation, audit, and source/partner terms. Absence of a
prohibition is not permission.

### 10.2 Source rights and collection claims

**FACT (high):** the AUP bans collection of nonpublic/behind-login information,
illegal/fraudulent/abusive uses, and third-party-rights violations [S19]. The MSA
states that Marketplace/Dataset legality remains the customer's responsibility
[S17].

**INFERENCE (high):** Bright Data's access, KYC/compliance review, “public,”
“ethical,” or “GDPR-ready” label cannot decide Curiosity's copyright, database
right, contract/terms, robots, publicity, marketing, or privacy position. Rights
must be assessed for source, field, use, and jurisdiction.

### 10.3 Public personal data and enrichment

**FACT (high):** the privacy policy defines Public Data as publicly posted
personal data, often name, email, and job title; claims legitimate interest as
the processing basis subject to fundamental rights; and says Bright Data may
share Public Data with customers. It also states Bright Data may have sold the
CCPA category “Identifiers” in the preceding 12 months [S18]. Marketplace offers
people/profile, employee, contact, demographic, reviews, and social datasets,
including third-party-enriched email/phone [S2][S22].

**FACT (high):** data subjects can seek access, rectification, restriction,
objection, erasure, and other rights via `privacy@brightdata.com` and EU/UK
representatives. CCPA verifiable deletion requests target Bright Data and its
service providers/subcontractors/consultants subject to exceptions; the stated
response goal is 45 days, extendable [S18].

**CRITICAL DISTINCTION (high):** the public DPA applies when Bright Data processes
personal data **on the customer/Partner's behalf**. It requires documented
instructions, confidentiality, rights/breach assistance, reasonable security,
deletion on request/termination within a reasonable period subject to law,
seven-day subprocessor change notice/objection, transfer safeguards, and annual
audit on 30 days' notice [S20]. Marketplace Public Data that Bright Data collects
for its own corpus may instead involve Bright Data's controller/independent role;
the public DPA does not by itself establish the allocation for that corpus.

**UNKNOWN / NEGATIVE RESULT (high confidence):** no reviewed source gives a
customer-facing Marketplace protocol or SLA that maps a data-subject correction,
objection, suppression, or deletion to:

- affected dataset IDs, record IDs, fields, snapshots, subscriptions, and
  downstream customers;
- notification to prior purchasers;
- a tombstone/correction feed and effective time;
- derived/enriched records, backups, invoices/logs, or customer destinations; or
- proof and deadline for customer-side propagation.

**RECOMMENDATION (high):** classify all person-linked data before acquisition;
establish controller/processor roles, lawful purpose/basis, notice, minimization,
access controls, recipient restrictions, and retention. Require stable subject
and record IDs plus signed correction/deletion events. Curiosity must be able to
find and purge raw rows, derivatives, embeddings, caches, and indexes; never rely
on a future full refresh to remove a subject.

### 10.4 Security and untrusted delivery

**FACT (medium):** Bright Data reports ISO 27001/27017/27018, SOC 2 Type II under
NDA, public SOC 3, TLS 1.3/minimum 1.2, AES-256 at rest, AWS multi-AZ, RBAC, MFA,
backups, and annual testing. A 2025 penetration test included Dataset Marketplace
and Custom Dataset API [S21]. These are provider control claims/audit scope, not
proof of Curiosity-specific configuration or dataset rights.

**FACT (high):** delivery configuration may contain cloud access keys, private
keys, SFTP credentials, or warehouse passwords [S12][S14]. Search/Filter rows,
errors, filenames, URLs, nested values, and spreadsheet cells originate outside
Curiosity's trust boundary.

**RECOMMENDATION (high):** keep all output `untrusted_external_data`; validate
media type and schema; cap files, rows, nesting, decompression, and parser work;
neutralize active/spreadsheet content; isolate prompt injection; scan URLs/files;
and prohibit data-driven tool calls. Use dedicated expiring keys and least-
privilege destination roles; do not log credentials or person-level payloads.

## 11. Clean-room logical architecture

The following is **INFERENCE**, not a claim about Bright Data source code,
databases, crawlers, ranking, models, or deployment topology.

```text
public sources + licensed/partner enrichment (dataset-specific, often undisclosed)
        -> collection observations
        -> extraction / normalization / enrichment / identity handling
        -> validation and provider review
        -> mutable provider dataset corpus (dataset_id + current dictionary)
                   |
          +--------+-------------------+
          |                            |
   serving/index lane             subscription/view lane
   Search (limited ES index)      saved filter + projection + schedule
   Filter (snapshot engine)                |
          |                                v
          +-----------------------> materialized snapshot
                                    metadata | warnings | parts | review expiry
                                                  |
                                      delivery job / API pull
                              webhook | object stores | SFTP | warehouse
```

Evidence for the functional boundaries:

- dataset IDs and separate metadata dictionaries [S4-S5];
- Search and Filter use different engines and can differ [S8-S9];
- views are saved filtered subscriptions [S10];
- snapshots have separate IDs/states/costs and can be multipart [S11][S15-S16];
- delivery has its own ID/state and reusable destinations [S12][S14]; and
- validation precedes approval/delivery while subscriptions refresh [S26-S27].

**Confidence:** high for these logical resources; medium for separate publication
and materialization stages; low/unknown for physical stores, consistency,
collection topology, update algorithm, entity resolution, validators, and models.

## 12. Curiosity decision ledger

### ADOPT

1. **ADOPT — dictionary before query (high).** A dataset should expose typed,
   described fields before filters or acquisition are accepted.
2. **ADOPT — definition/view/snapshot/delivery separation (high).** Corpus
   definition, recurring query, materialized result, and transfer attempt are
   different resources and states.
3. **ADOPT — field fill-rate and dataset drift telemetry (high).** Persist
   denominators and snapshots; use as coverage signals, never correctness.
4. **ADOPT — bounded filter AST (high).** Typed operators, explicit nested-object
   matching, finite nesting, and record caps are safer than arbitrary queries.
5. **ADOPT — multipart manifests and independent delivery status (high).** A ready
   dataset is not a durably ingested result.
6. **ADOPT — explicit full versus delta/no-change delivery (medium-high).** Make
   update intent and empty/no-change outcomes visible.

### ADAPT

1. **ADAPT — `dataset_id` to namespaced provider corpus reference (high).** Attach
   Curiosity-owned rights, privacy, schema, source, and version manifests.
2. **ADAPT — provider freshness to typed uncertainty (high).** Preserve collection-
   age claim separately from origin observation, publication, validity, and
   receipt times.
3. **ADAPT — validation to reviewable evidence (high).** Preserve rules,
   thresholds, failures, overrides, and approvers; add owned semantic/source/
   privacy tests.
4. **ADAPT — saved views to immutable revisions (high).** Every snapshot must bind
   exact filter, projection, rename mapping, schedule, update mode, schema, and
   policy decision.
5. **ADAPT — delta updates to auditable CDC (high).** Require stable identity,
   before/after hash, change type, base/current snapshot, sequence, tombstones,
   and full reconciliation.
6. **ADAPT — provider snapshots to owned manifests (high).** Hash every part and
   record; preserve count/bytes/cost/warnings and import disposition.

### REJECT

1. **REJECT — Marketplace as Curiosity's owned retrieval/index foundation
   (high).** Provider controls corpus, schema, updates, collection, validation,
   serving, retention, and terms.
2. **REJECT — current provider schema/filter syntax as Curiosity's public ABI
   (high).** It is mutable, heterogeneous, and provider-specific.
3. **REJECT — “public,” “ethical,” “validated,” “fresh,” or “GDPR-ready” as rights,
   accuracy, evidence, or deletion proof (high).**
4. **REJECT — silent subscription auto-ingest (high).** Validation override and
   14-day auto-delivery require quarantine and an owned acceptance gate.
5. **REJECT — delta-only mirroring without deletion/replay semantics (high).**
6. **REJECT — agent-selected dataset, broad filter, record limit, schedule,
   destination, or purchase (high).** These expand rights, personal-data, spend,
   and egress authority.
7. **REJECT — Marketplace rows or samples as clean-room test fixtures/training
   data without explicit rights and contamination review (high).**

### DEFER

1. **DEFER — any purchase/subscription (high).** Exact dataset/order-form/source/
   rights/privacy/schema/update facts are absent.
2. **DEFER — people, social, contact, demographic, review, and enrichment datasets
   (high).** Require controller-role, purpose, data-subject-rights, marketing,
   jurisdiction, retention, and deletion review.
3. **DEFER — Search/Filter adapter evaluation (medium-high).** Requires approved
   non-personal fixtures, budget, contract tests, and reconciliation of engine
   semantics.
4. **DEFER — push/warehouse delivery (high).** Authentication, retry/deduplication,
   secret handling, and deletion controls need proof.
5. **DEFER — model-training/evaluation or benchmark use (high).** Requires an
   express license and contamination plan, not product marketing.

## 13. Proposed provider-neutral acquisition envelope

**RECOMMENDATION (high):** any later approved adapter/import should preserve:

```text
acquisition_id, provider, adapter_version, order_form_id, rights_review_id
provider_dataset_id, provider_dataset_name, provider_view_id?, view_revision
requested_filter_ast, effective_filter_ast, projection_and_rename_map
serving_lane, serving_engine_claim, sort, cursor?, result_limit
schema_manifest_hash, provider_dictionary_capture, observed_schema_hash
snapshot_id, base_snapshot_id?, snapshot_created_at, update_mode
part_number, part_count, provider_row_count, received_row_count
provider_file_size, received_bytes, media_type, compression, content_hash
record_provider_id?, record_hash, prior_record_hash?, change_type?
source_url?, source_class?, source_partner?, provenance_completeness
provider_collection_time?, source_published_time?, valid_time?, received_at
freshness_claim, validation_ruleset?, failures[], overrides[], warnings[]
privacy_classes[], subject_key?, deletion_state, retention_until
requested_cost_cap, quoted_cost, charged_cost, accepted_row_count
delivery_attempt_id, delivery_status, partial, truncation_flags[], errors[]
untrusted_external_data=true
```

Question marks mean genuinely unavailable fields, not permission to infer them.

## 14. Material unknowns and pre-acquisition checks

### Dataset identity, schema, and quality

1. Obtain exact dataset ID/SKU and every dataset-specific term; capture current
   dictionary, samples only under approved rights, field sensitivity, identity
   key, null rules, enrichment/source mapping, and schema-change policy.
2. Demand immutable schema/revision identifiers and notice/rollback/migration
   terms; determine whether a stable ID can silently change fields or semantics.
3. Obtain validation rules, thresholds, denominators, override history, known
   coverage gaps, duplicate/entity-resolution methodology, and correction SLA.
4. Define “complete,” collection universe, languages/geographies/time span,
   excluded records, random-limit method, and measured source recall.

### Freshness and update correctness

5. Define per-record collection timestamp, snapshot collection window, source
   publication/validity times, cache/revalidation behavior, and freshness SLO.
6. Define full/delta identity, comparison base, sequence/gap detection, changed
   fields, corrections, late arrivals, filter exits, deletions/suppressions,
   replay, and periodic full reconciliation.
7. Establish what happens when a scheduled update is unavailable under “if and
   when available,” and whether missing/partial/no-change outputs are charged.

### Rights, privacy, and deletion

8. Obtain source-domain/source-partner inventory, source licenses/terms, collection
   authority at a policy level, output ownership/license, and express rights for
   indexing, embeddings, excerpts, derivatives, internal sharing, evaluation,
   training, and post-termination retention.
9. Determine Bright Data/customer/partner controller-processor roles per data
   flow; obtain DPA annexes, subprocessors/regions, transfer mechanism, retention,
   breach deadline, and security evidence.
10. Contract for record-level correction/deletion/tombstone events, prior-customer
    notice, stable subject lookup, propagation deadlines, backups/derivatives,
    and audit evidence.

### API, delivery, cost, and operations

11. With separately authorized benign non-personal fixtures only, validate schema
    metadata, Search versus Filter semantics, totals, random behavior, cursors,
    job timeout, duplicate submissions, snapshot expiry, part framing/checksums,
    content types, warnings, and error envelopes.
12. Obtain idempotency, cancellation, rate/backoff, webhook signature/retry/order/
    duplicate, delivery atomicity, checksums, and role-assumption contracts.
13. Freeze quote and billing rules for pre-collected/fresh/matched/excluded/error/
    delta records, compute, minimums, redelivery, retries, and termination.
14. Verify API-key resource scope, destination-secret retention/redaction, audit
    logs, IP restrictions, regional processing, and deletion of provider copies.

## 15. Contradictions and retained negative results

| Topic | First-party conflict/gap | Safe treatment |
|---|---|---|
| Catalog size | 700+, 350+, 190+ datasets; 250+, 120+ domains [S1][S22-S23] | Treat catalog as mutable; freeze exact entitled list. |
| Formats/destinations | UI says 11 methods incl. OCI; API enums differ; download media schema is inconsistent [S12][S14-S16] | Validate selected path; do not derive one universal enum. |
| Price | $2.50/1K API/general rate; order example $0.0006/record; minimum/compute/fresh fees and promotions vary [S9][S22-S25] | Signed quote/order form controls. |
| “Fresh” | Recently collected or newly collected; collection can begin before delivery; no per-row freshness SLA [S2][S13][S25] | Preserve claim and time fields separately. |
| “Representative” random sample | Search uses the word without method; purchase random selection also undocumented [S8][S25] | Do not claim statistical representativeness. |
| Validation | “Rigorous/accurate” marketing versus override, lowered thresholds, auto-delivery, and disclaimers [S17][S22][S27] | Validation is a signal, not truth. |
| Subscription | Many cadences marketed; only some datasets support frequent cadence; MSA says updates if/when available [S17][S22-S23][S26] | Contract exact dataset cadence/SLO. |
| Privacy role | Privacy policy describes Bright Data's own Public Data legitimate-interest processing; DPA covers processing on customer instructions [S18][S20] | Allocate roles per flow in writing. |

Additional **negative results**:

- no uniform record/field-level provenance or immutable source capture;
- no generic source-license or field-rights manifest;
- no immutable dataset/schema/record version contract;
- no complete delta/deletion/tombstone/replay protocol;
- no public Marketplace correction/removal propagation SLA to purchasers;
- no public fixed Marketplace Review Period;
- no authenticated-callback or exactly-once delivery guarantee;
- no independent quality, freshness, coverage, or bias result was generated;
- no purchase, sample, record, or API behavior was inspected; and
- no license was found making Marketplace records, schemas, dictionaries,
  enrichment, or service behavior Curiosity-owned or freely reusable.

## 16. Bounded curiosity pass

Scores are relevance/value/novelty/cost from 1 (low) to 5 (high). Only public,
first-party, in-frame threads that could change this decision were eligible.

| Thread | R/V/N/C | Decision and result |
|---|---:|---|
| Dataset rights and post-termination use | 5/5/5/2 | **Pursued to public-source exhaustion.** MSA restricts competitive redistribution and permits dataset-specific terms but provides no complete output-rights matrix; written order-form license is mandatory. |
| Delta/deletion semantics | 5/5/5/2 | **Pursued.** Release notes prove new/updated and no-change modes; no identity, tombstone, sequence, replay, or privacy-removal protocol found. |
| Freshness versus collection/delivery time | 5/5/4/1 | **Pursued.** Freshness is collection recency; scheduled collection may begin early; no per-row origin-freshness SLA found. |
| Privacy role and deletion propagation | 5/5/5/2 | **Pursued.** Privacy policy, MSA, and DPA establish rights and role ambiguity; no purchaser correction/deletion feed or SLA found. |
| Search versus Filter equivalence | 4/4/4/1 | **Pursued.** Bright Data expressly warns results differ because engines tokenize text differently. |
| Catalog/count/price contradictions | 4/4/3/1 | **Pursued.** Current primary pages conflict materially; exact entitlement and quote must be frozen. |
| Download free 1,000-row samples | 5/4/3/5 | **CURIOSITY_NO_GO:** caller prohibited downloads; rows can contain personal/licensed material and create contamination/retention obligations. |
| Purchase or credentialed contract test | 5/5/4/5 | **CURIOSITY_NO_GO:** expressly prohibited; no approved fixture, budget, rights review, or credentials. |
| Infer proprietary collection/entity-resolution/update algorithms | 2/2/5/5 | **CURIOSITY_NO_GO:** undocumented, unnecessary to evaluate public contracts, and risks prohibited reverse engineering/contamination. |
| Audit every source site's terms and every dataset field | 5/5/3/5 | **CURIOSITY_NO_GO:** no exact candidate dataset/use/jurisdiction; this is a later dataset-specific legal/provenance project. |
| Jurisdiction-specific legality of people/contact datasets | 5/5/4/5 | **CURIOSITY_NO_GO:** needs exact fields, subjects, purpose, regions, recipients, and counsel. |
| Third-party reviews or comparative benchmarks | 2/2/2/3 | **CURIOSITY_NO_GO:** lower authority than contracts and would not close source-rights/schema/deletion gaps. |

**Stop condition:** coverage plus saturation. Every requested dimension is covered;
remaining material unknowns require a named dataset, private order form/terms,
vendor disclosure, counsel/procurement authority, or approved empirical access.
No live autonomous follow-up is authorized outside this declared frame.

## 17. Primary source ledger

All sources are official Bright Data materials accessed **2026-08-17**.

- **[S1]** [Dataset Marketplace overview](https://docs.brightdata.com/datasets/marketplace/overview) — product boundary, 350+/250+ claim, public/ethical/update claims.
- **[S2]** [Marketplace FAQs](https://docs.brightdata.com/datasets/marketplace/faqs) — categories, free data, snapshots, collection/delivery timing, limits, enrichment partner, filter charging.
- **[S3]** [Dataset view](https://docs.brightdata.com/datasets/marketplace/dataset-view) — preview/sample, dictionary, fields, freshness, customization, source-domain description.
- **[S4]** [Get dataset list](https://docs.brightdata.com/api-reference/marketplace-dataset-api/get-dataset-list) — ID/name/current size and account availability.
- **[S5]** [Get dataset metadata](https://docs.brightdata.com/api-reference/marketplace-dataset-api/get-dataset-metadata) — field type/active/required/description.
- **[S6]** [Customization and filtering](https://docs.brightdata.com/datasets/marketplace/customization-and-filtering) — field projection, renamed/subset views, filter operators and UI bounds.
- **[S7]** [Dataset API filter syntax](https://docs.brightdata.com/api-reference/marketplace-dataset-api/filter-syntax) — operators, nested objects, three-level filter groups.
- **[S8]** [Search dataset](https://docs.brightdata.com/api-reference/marketplace-dataset-api/search-dataset) — alpha Elasticsearch lane, supported datasets, result shape, cursor, sort, 1,000-record guidance, engine difference.
- **[S9]** [Filter dataset](https://docs.brightdata.com/api-reference/marketplace-dataset-api/filter-dataset) — async snapshots, limits, errors, all-dataset claim, pricing.
- **[S10]** [Get dataset views](https://docs.brightdata.com/api-reference/marketplace-dataset-api/get-dataset-views) and [update delivery settings](https://docs.brightdata.com/api-reference/marketplace-dataset-api/update-view-delivery-settings) — saved recurring views and packaging.
- **[S11]** [Get snapshot metadata](https://docs.brightdata.com/api-reference/marketplace-dataset-api/get-snapshot-meta) — states, created time, dataset/customer IDs, size, cost, warnings/errors/initiation.
- **[S12]** [Deliver snapshot](https://docs.brightdata.com/api-reference/marketplace-dataset-api/deliver-snapshot) — separate delivery job, destinations, formats, multipart and credentials.
- **[S13]** [Marketplace fill rates](https://docs.brightdata.com/datasets/marketplace/fill-rates-and-statistics) and [Marketplace API overview](https://docs.brightdata.com/api-reference/marketplace-dataset-api/overview) — fill-rate semantics, freshness indicator, Search/Filter comparison and price.
- **[S14]** [Marketplace data delivery](https://docs.brightdata.com/datasets/marketplace/data-delivery-and-export) and [delivery options](https://docs.brightdata.com/api-reference/marketplace-dataset-api/get-delivery-options) — formats, methods, gzip, destination enum drift.
- **[S15]** [Snapshot content/download](https://docs.brightdata.com/api-reference/marketplace-dataset-api/download-the-file-by-snapshot_id) — download formats, parts, compression, response/status contract and example record.
- **[S16]** [Get snapshot parts](https://docs.brightdata.com/api-reference/marketplace-dataset-api/get-snapshot-parts) — matching parameters, part count, minimum batch.
- **[S17]** [Master Service Agreement](https://brightdata.com/license), updated 2026-06-16 — Data Services/Dataset terms, Review Period, rights restrictions, responsibilities, disclaimers, liability, termination.
- **[S18]** [Privacy Policy](https://brightdata.com/privacy), reviewed 2026-05-14 — Public Data, legitimate interest, sharing, rights, retention, CCPA sale/deletion language.
- **[S19]** [Acceptable Use Policy](https://brightdata.com/acceptable-use-policy) — nonpublic-data and unlawful/rights-infringing prohibitions.
- **[S20]** [Data Protection Addendum](https://brightdata.com/static/web/Bright-Data-Data-Protection-Agreement.pdf) — processor scope, instructions, rights/breach assistance, deletion, subprocessors, transfers, security, audit.
- **[S21]** [Security and compliance](https://docs.brightdata.com/general/security/security-overview) — certifications, encryption, infrastructure, testing scope, security claims.
- **[S22]** [Datasets product page](https://brightdata.com/products/datasets) — catalog/record claims, Smart Updates, delivery, use cases, subscriptions and public sourcing claims.
- **[S23]** [Dataset pricing page](https://brightdata.com/pricing/datasets) — current pricing/discount presentation, record definition, minimum example, catalog contradiction.
- **[S24]** [Marketplace/API troubleshooting](https://docs.brightdata.com/api-reference/marketplace-dataset-api/troubleshooting) — expiry, state, permission, billing, and error surfaces.
- **[S25]** [Purchase options](https://docs.brightdata.com/datasets/marketplace/purchase-options) and [pricing guide](https://docs.brightdata.com/datasets/marketplace/pricing) — pre-collected/fresh/time range, filter exit, random record limit, compute/record/min/max fees.
- **[S26]** [Release notes](https://docs.brightdata.com/release-notes) — delta subscriptions, no-change state, cadence availability, schema/preview/delivery changes.
- **[S27]** [Data validation for customers](https://docs.brightdata.com/datasets/data-validation/data-validation-for-customers) — validation rules, developer/customer override flow, 14-day auto-delivery.

## 18. Confidence summary

- **High:** documented catalog surfaces; dataset/field/view/snapshot/delivery IDs;
  metadata/filter schemas; Search/Filter distinction; nominal states/formats/
  limits; current public pricing meter; validation workflow; MSA/privacy/AUP/DPA
  text.
- **Medium:** inferred separation of corpus publication, serving indexes, view
  evaluation, snapshot materialization, and delivery; exact universality of
  subscription/delta behavior; security and quality effectiveness claims.
- **Low/unknown:** actual catalog/coverage, source lineage and licenses, schema and
  identity stability, per-row freshness, delta/deletion semantics, data-subject
  propagation, rights for derivatives/training/post-termination use, physical
  architecture, empirical accuracy/bias, and actual cost/value for any candidate.

**Final verdict:** Marketplace is a potentially useful, bounded acquisition source
for a specifically approved historical or enrichment corpus. Its strongest
clean-room lessons are explicit dictionaries, finite filters, immutable-import
manifests, and separation of view/snapshot/delivery. Curiosity should extend those
patterns with owned versioning, claim-level evidence, rights/privacy manifests,
auditable CDC with tombstones, and independent deletion—while rejecting vendor
rows, schemas, freshness badges, validation passes, and subscriptions as source
truth or owned retrieval architecture.
