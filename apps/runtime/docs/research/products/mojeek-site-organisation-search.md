# Mojeek Site Search and Organisation Search

**Research date / primary-source access date:** 2026-08-17
**Status:** clean-room product research; not an implementation, benchmark,
purchase recommendation, legal opinion, or authorization to crawl.
**Product boundary:** Mojeek's currently marketed **Site Search API**, the
documented **Organisation Search (OrgSe) API**, and the shared Search API only
where it defines their retrieval surface. The whole-web API and free Simple
Search Boxes are distinguished rather than silently treated as the same
product.

## Executive verdict

**ADAPT the tenant corpus-control and faceting ideas; REJECT the hosted product
as Curiosity's owned-search foundation; DEFER any commercial evaluation (high
confidence).**

Mojeek exposes an unusually compact hosted site-search control plane. A customer
submits a URL on an authorized domain; Mojeek crawls and indexes the page; the
customer can attach a publisher-supplied date, up to 16 case-sensitive
categories, and a live/hidden flag; and a shared Search API retrieves across one
or more organization sites with category and date facets. Scheduled refresh is
weekly on Bronze/Silver and daily on Gold/Custom, while refresh requests are
available weekly, daily, daily, or without a stated frequency cap respectively
[S1-S7].

That control does **not** confer corpus ownership. The customer supplies URLs and
small metadata, not document bodies or immutable captures. Crawl, parsing,
indexing, ranking, serving, storage, and freshness execution remain inside
Mojeek's proprietary hosted stack. Public documentation exposes no crawl job,
per-URL status read, bulk ingest, sitemap contract, immutable version, content
hash, passage offsets, configuration history, tenant-isolation model, query-log
contract, deletion proof, availability SLA, or index-publication SLO [S1-S8].

The current price is also not public: every Site Search tier is **POA**. Published
envelopes range from 1,000 pages and 100 queries/day to “Unlimited” pages and
queries on Custom, but “unlimited” has no public fair-use, rate, or concurrency
definition [S1]. OrgSe separately says to contact Mojeek for information and
pricing [S3]. No credentials, contact request, free/paid call, dashboard session,
or target crawl was used.

## 1. Decision frame and evidence method

### 1.1 Decision

Which externally observable design ideas from Mojeek's hosted, domain-scoped
search product should Curiosity adopt, adapt, reject, or defer while retaining
an owned crawler, corpus, evidence chain, tenant boundary, and bounded authority?

### 1.2 Bounded sub-questions

1. What can a tenant submit, crawl, tag, hide, refresh, search, and facet?
2. What corpus scope and page identity rules are documented, and what remains
   inside Mojeek?
3. How do Site Search, OrgSe, the shared Search API, and Simple Search Boxes
   relate without conflating them?
4. What are the management and query contracts, ranking/freshness semantics,
   user interface options, errors, and limits?
5. What tenant, privacy, rights, retention, and hosted-dependency boundaries are
   public?
6. Which clean-room lessons change Curiosity's architecture decision?

### 1.3 Method and labels

- **FACT** is directly stated or shown by a cited first-party source. Vendor
  claims about proprietary internals are self-attested.
- **INFERENCE** is a narrow implication from cited facts, not a measurement or
  claim about private implementation.
- **RECOMMENDATION** is a Curiosity disposition.
- **UNKNOWN / NEGATIVE RESULT** records what the inspected sources do not
  establish. Confidence is high, medium, or low.
- Public Mojeek product, API, crawler, content, technology, privacy, and terms
  pages were read normally. No source code, private agreement, account, key,
  payment, API request, crawl, probe, scrape, or access-control bypass was used.
- Vendor documentation establishes an advertised contract, not actual
  relevance, latency, completeness, isolation, security, or compliance.

**Stop condition:** each requested dimension had primary-source coverage and a
confidence label; remaining material gaps required a contract, vendor answer,
credentials, or live measurement and were retained as unknowns.

## 2. Product surfaces and ownership boundary

### 2.1 The names do not describe one fully unified public contract

| Surface | Public description | Boundary | Assessment |
| --- | --- | --- | --- |
| Site Search API | Marketed product for retrieving site results plus on-demand crawling/indexing; plans are page/query/refresh bundles [S1]. | Product page links shared Search response docs, but not the OrgSe management docs. | **FACT (high).** |
| Organisation Search / OrgSe | “Everything the Search API does,” plus add/refresh pages, multiple websites, categories, and facets; management operations are limited to the customer's own domains [S2-S4]. | Pricing and enrollment are contact-only. | **FACT (high).** |
| Search API | Query and result contract used to retrieve OrgSe results; `site`, categories, and date facets gain OrgSe semantics [S5-S8]. | General whole-web commercial plans and custom-score entitlements are separate. | **FACT (high).** |
| Simple Search Boxes | Free HTML form generator with web/country/site options; submits to Mojeek's `/search` [S9]. | The Site Search page explicitly presents it as the alternative for customers who do not need on-demand indexing or API access [S1]. | **FACT (high): not the paid Site Search API.** |

**INFERENCE (medium-high):** Site Search appears to be the commercially packaged
single/few-site use of the same general search and organization-control
capabilities, while OrgSe documents the richer multi-site management plane. The
public pages do not explicitly state that every Site Search customer receives
every OrgSe endpoint or that Site Search and OrgSe are contractually identical.
Entitlement mapping must therefore remain **UNKNOWN**.

### 2.2 Observable hosted pipeline

```text
tenant API key + vendor-authorized domains
  -> submit URL + optional pubdate/categories/live
  -> Mojeek-hosted crawl of page when needed
  -> Mojeek-hosted parse/index/rank state
  -> scheduled or requested refresh
  -> shared Search API scoped to organization / optional site
  -> JSON or XML results + category/date facets
  -> customer-built UI
```

This is a functional reconstruction, not a topology claim.

**FACT (high):** OrgSe is for centrally managing one or more websites and limits
operations to domains belonging to the customer “to prevent any abuse” [S3].
The add endpoint says it adds a URL to the organization's page list and starts a
crawl if Mojeek has not already indexed that page [S4]. The Search API `site`
parameter restricts an OrgSe query to one supplied domain; absent that parameter,
all sites in the organization are searched [S5].

**INFERENCE (high):** the API key selects both a tenant and its logical corpus.
The searchable organization view is likely an authorization/filter layer over
Mojeek-managed index records, including records that may already exist in its
general index. It is not a tenant-owned index export or isolated search cluster.

**UNKNOWN:** whether customer pages are copied into a physically separate index,
stored once and referenced by multiple products, or reprocessed into an
OrgSe-specific shard; whether the same URL can belong to multiple organizations;
and how metadata conflicts are isolated. Public evidence supports no stronger
storage/topology claim.

## 3. Ingestion, corpus scope, and lifecycle

### 3.1 What can be submitted

`POST https://www.mojeek.com/api/orgse/url` accepts [S4]:

- `api_key`;
- one `url`;
- optional Unix `pubdate`;
- optional pipe-separated, case-sensitive `categories`; and
- optional `live` (`0|1`, default `1`).

Each category is limited to 63 bytes and each URL to 16 categories. The request
example uses `curl -d`, which ordinarily produces form-encoded fields; the page
does not independently declare a required request media type [S4]. No title,
description, body, raw HTML, vector, attachment, or canonical ID is accepted.

**INFERENCE (high):** this is **URL-led crawl ingestion**, not document push.
Page content and result snippets come from Mojeek's fetch/extract/index path;
tenant-supplied metadata augments that record.

### 3.2 Corpus envelope

**FACT (high):** the published Site Search tiers cap “Pages” at 1,000, 5,000,
10,000, or “Unlimited” [S1]. OrgSe can search one or more managed sites and its
operations are restricted to the customer's domains [S3].

**FACT about the shared Mojeek index (high):** Mojeek says it indexes only HTML
webpages, not images or video; predominantly JavaScript text is a common reason
for a missing result. MojeekBot follows robots rules and `noindex`, `nocache`,
and `nofollow`, and publishes a one-request-per-site-per-second ceiling [S10,
S11].

**INFERENCE (medium-high):** because OrgSe explicitly uses Mojeek crawling and
indexing, Site/Org search should be treated as public, crawlable, HTML-first
search unless a customer agreement states otherwise. The product docs do not
promise authenticated/private-source connectors, JavaScript rendering, PDF or
office-document extraction, feed/database ingestion, or attachment indexing.
The general crawler policy is strong evidence of default behavior, but the
public OrgSe docs do not explicitly restate every robots/file-type rule.

### 3.3 URL and crawl lifecycle

| Operation | Method/path | Observable effect | Important gap |
| --- | --- | --- | --- |
| Add URL | `POST /api/orgse/url` | Adds to organization and initiates crawl only if not already indexed [S4]. | No force-refresh semantics, idempotency rule, canonicalization result, or existing-record merge rule. |
| Add categories | `POST /url/categories` | Appends categories [S4]. | No duplicate/category-order behavior. |
| Replace categories | `PATCH /url/categories` | Replaces all categories [S4]. | No revision/precondition or atomicity statement. |
| Delete categories | `DELETE /url/categories` | Removes named categories [S4]. | No “not present” behavior. |
| Change publication date | `PATCH /url/pubdate` | Replaces tenant-supplied date [S4]. | No range, timezone, provenance, or validation rule. |
| Change live state | `PATCH /url/live` | `0` hides URL from results; `1` shows it [S4]. | No activation latency or relation to page cap. |
| Refresh | `GET /url/refresh?api_key=...&url=...` | Marks URL for recrawl and reindex [S4]. | Side-effectful GET; no job/status/completion endpoint. |

**Contract mismatch (high confidence):** the OrgSe overview promises ability to
“add, remove and refresh pages,” but the management reference exposes no delete-
URL endpoint. `live=0` hides a URL; it is not documented as removing the URL,
stored content, metadata, or quota consumption [S3, S4]. “Remove” may mean hide
or may be a contact/private capability; public behavior is **UNKNOWN**.

**Negative results (high):** inspected docs expose no URL GET/list, bulk add,
sitemap/RSS submission, prefix/domain crawl, link-discovery depth, include/
exclude patterns, redirect handling, canonical policy, duplicate handling,
retry policy, fetch headers, recrawl job ID, callback, status poll, last error,
tombstone, purge, restore, or export. Adding one URL is not evidence that linked
pages are traversed or automatically enrolled.

## 4. Configuration, query, response, and UI

### 4.1 Configuration model

The observable tenant configuration is small:

```text
organization membership: vendor-approved domain(s)
page membership: URL
page metadata: pubdate, categories[<=16], live
query-time scope: optional site, categories, time, locale, clustering, safety
presentation: customer code consuming JSON/XML
```

**FACT (high):** categories are case-sensitive. Query `categories` values are
pipe-separated and all selected categories must match. `num_ref_cats` requests
up to 20 popular categories within the current result set; `num_other_cats`
requests up to 20 suggested categories from all matching documents [S4-S7]. XML
documentation says refinement counts use the top 1,000 results, while “other”
counts use all results [S7]. Date facets group by UTC day, month, or year;
`facet_date_gap` is mandatory and `facet_date_limit` requests the most recent
groups [S5-S7].

**INFERENCE (high):** categories are tenant-authored taxonomy, not automatically
extracted content labels. They act as hard conjunction filters and facets, not
documented rank boosts. `pubdate` is likewise a tenant assertion.

### 4.2 Query surface

OrgSe retrieval uses the shared Search API. Material controls include [S5-S8]:

- query `q`, excluded words `qm`, operators, pagination `s`/`t`;
- organization-wide search by default or domain restriction with `site`;
- `since`/`before`, modified/crawl dates, and date-first ranking;
- language and region preferences/restrictions;
- hostname clustering, include/exclude domains, title/snippet lengths;
- optional Safe Search, size, JSON/XML; and
- OrgSe-only categories, category suggestions, and date facets.

`datewr=100` ranks ordinary results by Mojeek's recognized modified date, but by
tenant-set `pubdate` for OrgSe when present [S5]. Search result records can
contain URL, title, query-dependent snippet, size, modified date, publication
timestamp, crawl date, clustering marker, pipe-separated categories, overall
score, experimental relevance-confidence score, and image metadata [S6, S7].

**Important inherited contradiction:** Search request docs say `s=1` is the
first result. JSON commentary simultaneously says first result is `start + 1`,
“1st result equals 0,” and shows `start:1`; XML shows `start=0` [S5-S7]. An
OrgSe client cannot safely normalize deep pagination from public prose alone.

### 4.3 Management errors versus search errors

**FACT (high):** OrgSe documents HTTP-like management outcomes `200`, `201`,
`202`, `400`, `403`, `404`, and `503`, with a JSON example containing string
fields `status` and `response` [S12]. `202` means accepted but not completed;
the docs do not map each operation to expected codes or provide a status resource.

The shared Search API instead documents an in-body `status` of `OK` or an error
message, with “Daily Limit Reached” as its concrete example [S6, S7].

**INFERENCE (high):** management and retrieval have different error contracts.
The public contract is insufficient for safe retry decisions: no stable machine
error code, validation detail, `Retry-After`, request ID, idempotency key,
conflict code, timeout, or partial-success model is documented.

### 4.4 UI and embedding

**FACT (high):** Site Search is sold as an API returning JSON or XML and is
ad-free and free of Mojeek branding [S1]. That implies the paying customer owns
the visible search UI. The reviewed product docs expose no hosted Site Search
result template, JavaScript component, dashboard UI, theming API, accessibility
contract, autocomplete, analytics screen, or embeddable faceting widget.

**FACT (high):** the separate free Simple Search Boxes page generates an HTML
form targeting Mojeek's hosted `/search`; it can present web, country, and site
search options with radio/dropdown choices and optional logo [S9]. It is
explicitly positioned for customers who do **not** need Site Search API access or
on-demand indexing [S1]. Historical claims that Mojeek offered custom search and
theming do not establish a current paid UI contract [S13].

**RECOMMENDATION (high):** keep tenant configuration, query API, and UI as
separate versioned surfaces. Curiosity should render and sanitize provider-
neutral result data itself; a hosted result page or remote script must not own
the evidence, accessibility, or agent-authority boundary.

## 5. Ranking and freshness

### 5.1 Ranking

**FACT (high):** the general Search API exposes an overall `score`; custom Web
API plans can request separate keyword (`onscr`), semantic (`sescr`), authority
(`g`), and phrase-count (`nph`) signals. Mojeek warns scores can change without
notice; semantic scores are absent for pages not embedded, currently pages not
detected as English [S8].

**FACT (high):** Mojeek's content policy describes its general ranking as fully
automated, uniformly signal-calculated, largely deterministic, not personally
curated or personalized, while still applying legal, spam, phishing, malware,
and CSAM policy [S11].

**Boundary:** OrgSe says it provides everything Search API does, and Site Search
uses Search API response documentation [S1-S3]. It is therefore reasonable to
infer a shared retrieval/ranking family. However, the Site Search price table
does not promise the Web API custom detailed scores, and no OrgSe-specific
ranking formula, category boost, per-domain weight, synonym, typo, stopword,
field weight, freshness weight, or tenant ranking override is public.

**INFERENCE (medium-high):** tenant control is principally eligibility,
metadata, filtering, freshness triggering, and presentation—not ranker
ownership. A customer can post-process returned scores/results, but cannot
reproduce the provider's candidate set or base ordering from published data.

### 5.2 Freshness semantics

| Tier | Scheduled “Refreshed” | On-demand indexing entitlement | Public page/query envelope |
| --- | --- | --- | --- |
| Bronze | Weekly | Weekly | 1,000 pages; 100 queries/day |
| Silver | Weekly | Daily | 5,000 pages; 500 queries/day |
| Gold | Daily | Daily | 10,000 pages; 1,000 queries/day |
| Custom | Daily | “Unlimited” | “Unlimited” pages and queries/day |

Source: current Site Search plan table [S1].

**FACT (high):** refresh marks a URL for recrawl and reindex; it does not promise
immediate completion [S4]. `cdate` can return the last crawl date, while
`pubdate` and provider-recognized modification dates support filters/ranking
[S5-S7].

**INFERENCE (high):** “Refreshed daily” is a schedule label, not a maximum staleness
or publication-latency SLA. On-demand frequency is likewise not an index-
visibility deadline. Because there is no public status read, a customer cannot
distinguish queued, fetched, rejected, unchanged, parsed, indexed, or serving
states from the management API alone.

**UNKNOWN:** schedule timezone; weekly day; page-selection order; recrawl age
distribution; on-demand quota counting; crawl start/completion/index-to-serve
latency; conditional requests; failure retries; stale-on-error behavior;
deletion latency; and whether a hidden URL continues to refresh.

## 6. Tenancy, privacy, rights, and security boundary

### 6.1 Tenant authorization and isolation

**FACT (high):** operations are restricted to a customer's own domains, and a
unique API key is required. A `403` means the key lacks endpoint permission and
is commonly associated with an incorrect key [S3, S4, S12].

**UNKNOWN / negative result (high):** public docs do not explain domain
verification, organization/member model, multiple keys, key rotation, least-
privilege scopes, read versus write keys, RBAC, SSO, MFA, audit log, IP allowlist,
rate isolation, noisy-neighbor protection, metadata isolation, encryption,
backup, disaster recovery, data export, tenant deletion, or incident notice.

**Security observations:**

- Add/update examples put the key in the POST/PATCH/DELETE body, reducing but
  not eliminating accidental exposure [S4].
- Refresh is a state-changing `GET` with key and target URL in the query string;
  browser history, proxy/server logs, referrers, prefetchers, and monitoring can
  expose or replay it. **REJECT** this interface pattern.
- The shared search quickstart places `api_key` in the query string as well
  [S14]. Redaction and no-redirect handling would be mandatory in any separately
  approved adapter.
- “Own domains only” is an abuse-control claim, not evidence of SSRF protection,
  DNS-rebinding defenses, redirect reauthorization, or browser-subresource
  egress controls. No active test was authorized.

### 6.2 Query and metadata privacy

**FACT (high):** Mojeek's general privacy policy says it does no specific-user
tracking, normally sets no cookies without agreement, and keeps standard logs
indefinitely after replacing IP addresses with a two-letter country code. Logs
retain time, requested page, possible referrer, and separately browser data;
aggregate non-personal search data may improve results [S15].

**Boundary (high):** that policy describes the Mojeek website and is dated
2022-02-02. It does not specifically describe authenticated Site/Org API query
logs, API-key/account linkage, customer URL/category metadata, billing records,
retention, deletion, subprocessors, controller/processor roles, model training,
or customer-selected residency. Categories can expose business taxonomy and
queries can expose end-user intent; the no-tracking statement is not a Site
Search data-processing agreement.

Mojeek says its proprietary technology and servers are owned/built/managed by
Mojeek and housed in its dedicated room in a green data centre [S13].
**INFERENCE (medium):** the product is a direct Mojeek hosted dependency rather
than a hyperscaler-branded search service. This does not establish data
residency, current topology, subprocessors, or contractual localization.

### 6.3 Content and rights

**FACT (high):** general Terms prohibit automated use unless the user is an
authorized API customer, allow policy/legal removal, permit service changes or
interruption, reserve service IP to Mojeek, and disclaim quality and availability
warranties [S16]. Mojeek's Web API FAQ separately warns that its agreement does
not grant rights to underlying third-party pages [S17].

**INFERENCE (high):** domain control permits Mojeek to operate the contracted
crawl; it does not automatically prove that every submitter owns every page,
metadata value, embedded third-party asset, or downstream reuse right. Public
Site/Org terms, DPA, retention/storage rights, output redistribution rights, and
post-termination deletion obligations were not found. The public general Terms
are not a substitute for the customer agreement.

## 7. Limits, pricing, and operational dependency

### 7.1 Current public commercial envelope

| Plan | Price | Pages | Queries/day | Scheduled refresh | On-demand indexing | Ads/branding |
| --- | --- | ---: | ---: | --- | --- | --- |
| Bronze | POA/month | 1,000 | 100 | Weekly | Weekly | None |
| Silver | POA/month | 5,000 | 500 | Weekly | Daily | None |
| Gold | POA/month | 10,000 | 1,000 | Daily | Daily | None |
| Custom | POA | “Unlimited” | “Unlimited” | Daily | “Unlimited” | None |

Discounts are advertised for charitable, educational, and non-commercial/open
projects [S1]. OrgSe separately provides no figure and directs prospects to
contact Mojeek [S3].

**UNKNOWN:** currency/tax treatment beyond the displayed pound symbol; setup or
minimum fee; contract term; overages; whether hidden/unindexed/duplicate pages
count; maximum domains; results/request; QPS; concurrency; maximum URL/query/
payload size; on-demand requests per period; facet cost; failed-call billing;
support response; uptime; latency; backup; export; termination; fair use behind
“Unlimited”; and change/deprecation notice.

### 7.2 Hosted dependency analysis

| Capability | Customer controls | Mojeek controls |
| --- | --- | --- |
| Corpus intent | Domain enrollment request, submitted URLs, live flag | Domain authorization, crawl acceptance, actual indexed/servable set |
| Content | Public source page and small supplied metadata | Fetch, extraction, canonical/duplicate decisions, stored representation |
| Freshness intent | Tier and refresh request | queueing, crawl, retry, index publish, serving activation |
| Retrieval | query, filters, facets, post-ranking | candidate generation, base score/rank, index snapshot, policy removal |
| Presentation | customer API client and UI | result schema and mutable snippets/metadata |
| Operations | API requests | infrastructure, capacity, availability, maintenance, product lifecycle |

**RECOMMENDATION (high):** treat this as a replaceable provider adapter only,
never as proof of an owned corpus. A provider outage, contract change, account
loss, stale crawl, or product retirement removes both ingestion and serving.
Configuration export alone—if privately available—would still not export the
captures, index, rank state, or reproducible evidence.

## 8. Clean-room lessons and verdict ledger

Mojeek's software, index, ranking algorithms, infrastructure, and branding are
proprietary [S13, S16]. This report derives requirements only from documented
external behavior and general search patterns. It copies no code, private data,
ranking formula, or corpus.

| Observable idea | Label / confidence | Curiosity verdict |
| --- | --- | --- |
| One organization manages multiple authorized domains | FACT / high | **ADOPTED conceptually.** A tenant can own multiple source scopes, but authorization must be explicit per normalized origin. |
| Separate page membership from visible `live` state | FACT / high | **ADAPTED.** Use immutable document versions plus indexed/active/tombstoned states and reasoned transitions. |
| URL-led crawl ingestion | FACT / high | **ADAPTED.** Useful for public-web sources, but also support independently authorized push/connectors; never equate submitted with fetched/indexed. |
| Per-page categories with conjunctive filtering and facets | FACT / high | **ADAPTED.** Typed, namespaced, versioned taxonomy with source, confidence, and counts over a declared snapshot. |
| Tenant-supplied publication date | FACT / high | **ADAPTED.** Preserve as publisher/operator claim; never overwrite fetched/first-seen/verified-modified times. |
| Live hide without documented deletion | FACT / high | **REJECTED as sufficient.** Define hide, tombstone, purge, legal hold, quota, retention, and proof independently. |
| Scheduled plus on-demand refresh | FACT / high | **ADAPTED.** Separate requested, queued, fetched, parsed, indexed, and activated states with deadlines and errors. |
| `cdate`, modified date, publication date | FACT / high | **ADAPTED.** Return all temporal sources with provenance and confidence. |
| Refinement versus alternative category suggestions | FACT / high | **ADAPTED.** Useful exploration affordance; counts must name scope, cap, snapshot, and approximation. |
| Search all tenant sites, optionally one domain | FACT / high | **ADOPTED conceptually.** Model source scope as an explicit query predicate and return executed scope. |
| Customer-rendered, unbranded, ad-free UI | FACT + INFERENCE / high | **ADOPTED.** Retrieval should return typed data; Curiosity owns safe rendering and evidence presentation. |
| Side-effectful refresh GET with query-string key | FACT / high | **REJECTED.** Use authenticated mutation, secret-safe transport, idempotency, revision, and audit event. |
| Opaque hosted crawl/index/rank chain | FACT + inference / high | **REJECTED as foundation.** It cannot provide owned captures or reproducible retrieval. |
| Mojeek Site/Org as a temporary provider | RECOMMENDATION / medium | **DEFERRED.** Only after private terms, DPA/security, domain verification, deletion, fixtures, and capped-budget review. |
| Reconstruct Mojeek ranking or internals | RECOMMENDATION / high | **REJECTED.** No need, no source access, low decision value, and clean-room risk. |

## 9. Curiosity implications

1. **Make corpus intent and observed state different objects.** A submitted URL
   should create an auditable enrollment intent, not a successful-document fact.
   Preserve each authorization, redirect check, robots/policy outcome, attempt,
   capture, extraction, index publication, and serving activation.
2. **Model freshness as a state machine, not “daily.”** Return request ID,
   previous and candidate versions, requested/start/fetch/index/activate times,
   failure reason, next eligibility, and stale-on-error policy. Bounded curiosity
   can prioritize the highest-value stale cell without gaining authority to
   crawl new domains.
3. **Treat operator metadata as a claim.** Categories and publication dates need
   tenant, actor, configuration version, source, and effective interval. They
   may filter or rank only under a declared policy and must not masquerade as
   extracted or verified facts.
4. **Make facet counts reproducible.** State whether counts cover all matches or
   a top-k sample, whether exact/estimated, the category semantics, index
   snapshot, and applied filters. A facet click changes query scope; it does not
   authorize autonomous follow-up.
5. **Expose evidence absent from the hosted API.** Results should include capture
   and document-version IDs, content hash, canonical/redirect lineage, passage
   coordinates, fetch and source dates, extractor/index/ranker/policy versions,
   tenant/corpus scope, bounded rank reasons, duplicate cluster, and coverage
   warnings.
6. **Design tenant isolation explicitly.** Separate enrollment authority, crawl
   egress scope, configuration roles, query keys, mutation keys, quotas, audit,
   encryption, retention, deletion, and incident response. Revalidate every
   redirect and browser subrequest rather than trusting a submitted hostname.
7. **Keep hosted search replaceable.** If Site/Org is ever evaluated, normalize
   only provider-neutral results and preserve vendor/result/retrieval
   attribution. Provider snippets, dates, scores, and categories remain
   untrusted external data and cannot grant content rights or tool authority.
8. **Bound product economics by work, not marketing labels.** Track documents,
   bytes, fetch/render time, index writes, refresh attempts, query CPU, result
   depth, and tenant burst. “Unlimited” is not an engineering bound.

## 10. Unknowns and pre-evaluation checks

Before any separately authorized contact, trial, or paid test, obtain written
answers and applicable customer terms for:

1. exact Site Search versus OrgSe entitlement mapping and current lifecycle;
2. domain-ownership verification, redirect/subdomain rules, maximum domains, and
   treatment of the same URL across tenants;
3. supported schemes/file types/rendering, robots/canonical/duplicate rules,
   discovery scope, maximum page/URL size, and failed page counting;
4. add idempotency, URL identity/normalization, list/read/delete/purge/export,
   hidden-page quota and recrawl behavior, and deletion proof;
5. scheduled/on-demand counting, queue/status API, crawl/index/serve SLOs,
   retries, failure notifications, and stale-on-error behavior;
6. canonical search endpoint, pagination base, result cap/depth, QPS,
   concurrency, timeouts, errors, retries, request IDs, SLA, and versioning;
7. Site/Org ranker behavior, detailed-score entitlement, category/date effects,
   typo/language support, index-snapshot stability, and score change notice;
8. API query/IP/header and customer metadata logs, retention, account linkage,
   training/use, subprocessors, residency, DPA roles, deletion, and incidents;
9. RBAC, key scopes/rotation, SSO/MFA, audit logs, encryption, backup/recovery,
   penetration/compliance evidence, and tenant/noisy-neighbor isolation;
10. price, minimum/term/overage, taxes, support, fair use, result/output storage
    and redistribution, underlying-content rights, termination, and exit export.

An authorized evaluation should pre-register owned test domains and pages with
known canonical duplicates, redirects, robots/noindex, JavaScript-only text,
edits, deletions, dates, categories, language, and adversarial metadata. Measure
state-transition latency, completeness, rank/facet behavior, error stability,
isolation, and reproducibility within an explicit no-surprise spend cap. Do not
submit third-party domains or confidential queries.

## 11. Bounded curiosity pass

After synthesis, in-frame gaps were scored 1-5 for relevance (R), decision value
(V), novelty (N), and cost (C; 5 is expensive). Priority is `R + V + N - C`.

| Thread | R | V | N | C | Score | Action |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Resolve Site Search versus OrgSe surface relationship | 5 | 5 | 4 | 1 | 13 | **Pursued.** Product, API index, OrgSe, and shared Search docs were cross-read; likely relationship is bounded as inference and exact entitlements remain unknown. |
| Determine whether “remove” means delete | 5 | 5 | 4 | 1 | 13 | **Pursued.** No delete-URL endpoint was found; hide and deletion remain distinct and contradiction is retained. |
| Identify facet count scope | 4 | 4 | 4 | 1 | 11 | **Pursued.** XML docs establish top-1,000 for refinement categories versus all matches for alternatives. |
| Establish private/API privacy and tenant isolation | 5 | 5 | 4 | 5 | 9 | **CURIOSITY_NO_GO.** Requires customer terms, DPA/security material, or vendor response beyond public authority. |
| Measure crawl/index freshness and ranking | 5 | 5 | 4 | 5 | 9 | **CURIOSITY_NO_GO.** Requires account, approved domains, calls, controlled pages, and possibly payment. |
| Test domain verification or redirect escape | 5 | 5 | 4 | 5 | 9 | **CURIOSITY_NO_GO.** Active security testing was not authorized. |
| Recover historical custom-search UI behavior | 2 | 2 | 3 | 3 | 4 | **CURIOSITY_NO_GO.** Current headless product boundary is established; old behavior would not change the decision. |
| Infer physical multitenant index layout | 2 | 2 | 4 | 5 | 3 | **CURIOSITY_NO_GO.** Public behavior does not support topology claims; low decision value and clean-room risk. |

**Stop reason:** coverage and saturation. The best low-cost contradictions were
resolved as far as public first-party pages permit. Remaining high-value gaps
require caller-authorized vendor engagement, credentials, contract access,
controlled domains, or live testing.

## 12. Fact / inference / recommendation ledger

| ID | Statement | Label | Confidence | Sources |
| --- | --- | --- | --- | --- |
| L1 | Site Search is a hosted, ad-free, unbranded API with page/query/freshness bundles and POA pricing. | FACT | High | [S1] |
| L2 | OrgSe adds domain-authorized URL management, multiple sites, metadata, categories, and facets to Search API behavior. | FACT | High | [S2-S5] |
| L3 | Exact contractual equivalence between Site Search and OrgSe is not public. | UNKNOWN / evidence boundary | High | [S1-S4] |
| L4 | Ingestion is URL-led crawl ingestion, not document-body push. | FACT + INFERENCE | High | [S4] |
| L5 | Customer controls logical membership and metadata; Mojeek controls crawl, index, ranking, and serving. | INFERENCE | High | [S1-S5], [S13] |
| L6 | Categories are case-sensitive, at most 16 per URL and 63 bytes each, and query filters require all selected categories. | FACT | High | [S4], [S5] |
| L7 | OrgSe overview promises removal, but no URL-delete endpoint is publicly documented; hide is not proven deletion. | FACT / contradiction | High | [S3], [S4] |
| L8 | Scheduled and requested refresh exist, but no completion/index-publication SLO or status read is public. | FACT / negative result | High | [S1], [S4] |
| L9 | Shared search exposes categories/dates/crawl dates and inherits a pagination documentation contradiction. | FACT | High | [S5-S7] |
| L10 | Public Site/Org docs do not establish API-specific query retention, DPA, residency, isolation, RBAC, or deletion. | NEGATIVE RESULT | High | [S1-S4], [S15] |
| L11 | Site/Org remains a Mojeek-hosted dependency despite tenant corpus controls. | INFERENCE | High | [S1-S4], [S13] |
| L12 | Curiosity should adopt explicit corpus controls and facets but independently own captures, lifecycle, retrieval evidence, and tenancy. | RECOMMENDATION | High | Synthesis |
| L13 | Any provider evaluation requires separate procurement/privacy/security authority and controlled-domain tests. | RECOMMENDATION | High | Unknowns above |

## 13. Primary sources

All sources below were accessed **2026-08-17**. They are primary sources for
Mojeek's product and its own claims, not independent runtime validation.

- **[S1]** Mojeek, “Mojeek Site Search API,” current product and pricing page.
  https://www.mojeek.com/services/search/site-search-api/
- **[S2]** Mojeek, “API Documentation,” Search API and Organisation Search
  descriptions. https://www.mojeek.com/support/api/
- **[S3]** Mojeek, “Organisation Search.”
  https://www.mojeek.com/support/api/orgse/
- **[S4]** Mojeek, “OrgSe Request Parameters.”
  https://www.mojeek.com/support/api/orgse/request_parameters.html
- **[S5]** Mojeek, “Search API Request Parameters.”
  https://www.mojeek.com/support/api/search/request_parameters.html
- **[S6]** Mojeek, “Search API JSON Response Format.”
  https://www.mojeek.com/support/api/search/json_response.html
- **[S7]** Mojeek, “Search API XML Response Format.”
  https://www.mojeek.com/support/api/search/xml_response.html
- **[S8]** Mojeek, “Scorings in the Mojeek API.”
  https://www.mojeek.com/support/api/search/results_scoring.html
- **[S9]** Mojeek, “Simple Search Boxes.”
  https://www.mojeek.com/services/search/searchbox.html
- **[S10]** Mojeek, “MojeekBot.” https://www.mojeek.com/bot.html
- **[S11]** Mojeek, “Search Content Policy.”
  https://www.mojeek.com/about/content/
- **[S12]** Mojeek, “OrgSe Response Codes.”
  https://www.mojeek.com/support/api/orgse/response_codes.html
- **[S13]** Mojeek, “Team and Technology.”
  https://www.mojeek.com/about/technology.html
- **[S14]** Mojeek, “Search API Quickstart.”
  https://www.mojeek.com/support/api/search/quickstart.html
- **[S15]** Mojeek, “Privacy Policy,” updated 2022-02-02.
  https://www.mojeek.com/about/privacy/
- **[S16]** Mojeek, “Terms of Service.”
  https://www.mojeek.com/about/terms.html
- **[S17]** Mojeek, “Mojeek Web Search API,” FAQ used only for the underlying
  content-rights boundary. https://www.mojeek.com/services/search/web-search-api/
