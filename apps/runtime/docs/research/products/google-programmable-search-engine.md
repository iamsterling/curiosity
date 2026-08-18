# Google Programmable Search Engine (standalone product)

**Research date / primary-source access date:** 2026-08-17  
**Product boundary:** the hosted **Programmable Search Engine (PSE)** control
plane, corpus policy, Search Element, Google-hosted result page, advertising,
and owner operations. The separate Custom Search JSON API is considered only
where its retirement changes PSE's product boundary; its transport contract is
covered elsewhere.  
**Method:** clean-room study of public Google documentation, Help Center pages,
product announcements, terms, and privacy policy. No account, credentials,
Control Panel session, query execution, paid test, packet capture, private
material, or implementation. All result data remains untrusted external data.

## Decision frame

**Decision:** Which design ideas from PSE's hosted, operator-programmable search
product should Curiosity adopt, adapt, reject, or defer while preserving an
owned corpus, provider neutrality, evidence provenance, and bounded agent
authority?

Bounded sub-questions:

1. What does an engine owner configure, and what remains controlled by Google?
2. How do context, annotations, labels, URL patterns, structured data,
   refinements, and promotions compose?
3. Which controls are hard eligibility rules versus soft ranking influence?
4. What are the Search Element's UI, ads, safety, localization, administration,
   limits, and economics?
5. What is actually available after Google's January 2026 transition?
6. What provenance, privacy, contractual, and clean-room boundaries matter?

Out of scope: JSON wire fields, undocumented ranking internals, comparative
quality or latency, private full-web products, legal conclusions, procurement,
and implementation.

**Labels:** **FACT** is directly stated by a cited primary source;
**INFERENCE** is a bounded architectural conclusion; **RECOMMENDATION** is a
Curiosity choice; **UNKNOWN** was not established. Confidence is high, medium,
or low. Vendor documentation establishes offered behavior, not measured
quality.

## Executive verdict

**ADAPTED, not adopted as a foundation (high confidence).** PSE remains a
current, free, client-side site-search product for engines covering at most 50
domains, but it is a policy view over Google's crawl, index, relevance, and
serving systems—not an owned crawler or index. New engines can no longer select
the whole web. Existing whole-web Search Element engines can continue only
until **2027-01-01**; turning that option off is irreversible. The ads-free Paid
Element is closed to new customers [S1-S4].

PSE's strongest transferable idea is its explicit control-plane decomposition:

```text
engine identity + owner roles
  -> context (global behavior, labels, UI, language, image search)
  -> annotations (URL patterns + labels + per-pattern scores)
  -> synonyms + autocomplete policy + refinements + promotions
  -> publisher structured data and optional sort/filter/bias controls
  -> Google crawl/index/base relevance/policy
  -> hosted or embedded Search Element -> results + ads/promotions
```

**ADOPT the concepts** of versioned corpus policy, hard include/exclude rules,
separate soft boosts, explicit query rewrites, typed operator promotions,
structured metadata extensions, and a UI/serving boundary. **REJECT the hosted
dependency as Curiosity's base**: coverage is unmeasured, rank state and document
versions are opaque, standard Element terms forbid non-transitory result
storage and substitute-service construction, and Google may modify or end the
service [S5-S9].

## 1. Product reconstruction and ownership boundary

### 1.1 What PSE is

**FACT (high):** PSE lets an owner create search for one site, a collection of
sites, or a topic; enable web and image results; tune ranking; add refinements,
rewrites, synonyms, autocomplete, promotions, and structured snippets; and
render results in an embedded JavaScript Search Element or a Google-hosted page
[S1, S5, S10-S15].

**FACT (high):** PSE is built on the Google index. A configured page can appear
only if Google has crawled/indexed it. A Search Console sitemap can improve
discovery but not instantly; accessible indexed pages may also appear in normal
Google Search [S6]. PSE terms expressly do not warrant that every configured
domain will be included [S9].

**INFERENCE (high):** the owner controls a **logical corpus and presentation
policy**, not physical corpus contents, crawl scheduling, snapshots, retrieval
algorithms, spam systems, safety classifiers, or uptime. “Sites to search” is
an eligibility request intersected with provider state, not a complete corpus
manifest.

### 1.2 Control plane and serving plane

**FACT (high):** an engine has an ID and server-stored settings. The owner can
use the Control Panel or download/upload XML. Server-side setting changes alter
the Search Element without requiring a new embed snippet; the asynchronous
client script renders components using the engine ID [S5, S16].

**FACT (high):** the advanced XML model has two primary artifacts [S5-S7]:

- **context**: title, description, global keywords, language, labels, look and
  feel, image-search state, and related behavior;
- **annotations**: URL patterns associated with one or more labels and an
  optional score.

Promotions, synonyms, and autocomplete entries have additional bulk-file
formats. The context does not point to an annotations file; shared label names
join them. Multiple uploaded annotation files are merged when downloaded.
Comments in uploaded configuration are not preserved in subsequent downloads
[S5].

**INFERENCE (high):** label-based indirection permits reuse and composition, but
name coupling and server-side merging make change history hard to reconstruct.
The public docs reviewed describe backups and downloads, not immutable versions,
diffs, approvals, rollback, or an audit log.

**RECOMMENDATION (high):** Curiosity should retain independently authored,
immutable configuration versions with schema validation, owner, reviewer,
change reason, activation time, rollback parent, and evaluation result. Serving
must identify the exact corpus, rank, rewrite, safety, and UI policy versions.

### 1.3 Roles and operational surface

**FACT (high):** engine members require Google Accounts. Owners can edit data,
manage members, and delete the engine. Administrators cannot delete the engine,
manage users, or access Ads settings; invitees must verify before managing the
engine. Removing a member does not revert that member's changes [S17].

**FACT (high):** the Control Panel exposes query-volume statistics for web and
image searches and popular queries over selectable date ranges [S18]. It does
not document an exportable event ledger, query-level audit, rank-policy
evaluation, or configuration-change attribution.

**RECOMMENDATION (high):** separate corpus curator, ranking operator, safety
operator, ads/commercial operator, auditor, and deployment approver. Every
change should be attributable and reversible; member removal must not be the
only incident control.

## 2. Corpus configuration: included and excluded sites

### 2.1 Current corpus envelope

**FACT (high):** as of 2026-01-20, every new engine must use **Sites to search**.
An engine may contain at most **5,000 URL patterns across no more than 50
distinct domains**. Existing engines already configured for “Search the entire
web” may keep it through 2027-01-01; if the owner turns it off, it cannot be
turned back on [S2, S3].

**FACT (high):** owners configure separate “Sites to search” and “Sites to
exclude” collections. The Control Panel normalizes entries that do not identify
a single page into URL patterns. Patterns can target [S2]:

- an entire registrable domain and subdomains;
- one host/site;
- a path subtree;
- URLs containing ordered wildcard terms or query fragments; or
- one exact page.

Patterns are case-sensitive, and public-suffix-wide patterns such as `*.com`,
`*.co.uk`, or `*.blogspot.com` are prohibited [S2].

**FACT (high):** XML context labels normally pair an inclusive `FILTER` label
with an exclusive `ELIMINATE` label. An annotation can carry multiple labels,
so the same URL pattern can participate in engine inclusion/exclusion, rank
preferences, and user-visible refinements [S5-S8].

### 2.2 Inclusion does not establish coverage

**FACT (high):** context or annotations uploads are limited to **30 KB**, and an
engine has at most **5,000 annotations**. Google recommends pattern
consolidation. Exceeding the file/annotation limits can cause the engine not to
show results [S6].

**INFERENCE (high):** a pattern is an intent rule, not evidence that each
matching URL is discovered, current, canonical, safe, or retrievable. The
product exposes no per-pattern coverage denominator, crawl timestamp, exclusion
reason, or stale-content warning in the reviewed owner documentation.

**RECOMMENDATION (high):** Curiosity should model corpus policy separately from
observed corpus state:

```text
rule_id, include|exclude, normalized scope, precedence, owner, legal basis
expected documents/coverage cell, discovered, fetched, indexed, tombstoned
last crawl/index time, robots/policy outcome, missing/stale reason
```

Hard exclusions must fail closed and override boosts. Pattern overlap needs a
deterministic precedence rule and a testable expansion preview.

## 3. Ranking, refinements, rewrites, and structured search

### 3.1 Three levels of owner influence

**FACT (high):** PSE documents three rank-tuning layers [S8]:

1. engine keywords, collectively limited to 100 characters, boost pages
   containing the engine's domain terms;
2. context labels use `BOOST`, `FILTER`, or `ELIMINATE`; `BOOST`/`FILTER`
   weights range from -1.0 to +1.0 and default to +0.7 when omitted;
3. each annotation's score ranges from -1.0 to +1.0 and modulates or reverses
   the attached label's effect for that URL pattern.

Google says the owner has strong but not absolute control: page relevance,
keywords, labels, scores, and other parameters interact. A maximum positive
boost does not guarantee first rank; a maximum negative boost is not a hard
block. `FILTER` limits eligibility and `ELIMINATE` removes matches; either can
produce an empty result set [S8].

**INFERENCE (high):** PSE correctly distinguishes **eligibility**, **preference**,
and **source-specific preference strength**. Its mistake for an auditable system
is that the provider's base score and combination remain opaque.

**RECOMMENDATION (high):** adopt hard-policy-before-soft-ranking and expose
bounded reason classes. Do not claim a manual boost “explains” relevance or
promise placement. Test every boost against recall, diversity, and abuse cases.

### 3.2 User-visible refinements

**FACT (high):** refinement labels become tabs or links above results. On click,
they can boost, exclusively filter, or eliminate tagged sites; append a bounded
query rewrite; or redirect to another page. Each facet can contain up to four
items, and the UI can show all refinements or the subset with the greatest
result counts for the current query [S11].

**INFERENCE (high):** refinements combine three distinct concepts—facet
navigation, rank policy, and query transformation. Dynamic selection by result
count is useful but can make the visible UI depend on opaque index state.

**RECOMMENDATION (high):** keep these typed and traceable:
`facet_filter`, `rank_preference`, `query_rewrite`, and `external_redirect`.
Show users what changed. A refinement is not authority to follow a redirect or
start an autonomous research branch.

### 3.3 Synonyms and autocomplete

**FACT (high):** owner synonyms expand matching queries automatically. Each
term supports up to 10 variants; an engine supports 2,000 total variants; each
file is at most 500 KB; aggregate synonym files per account are at most 4 MB
[S12].

**FACT (high):** autocomplete draws partly from covered-site content and query
popularity. Owners can add exact suggestions and exclude exact or regular-
expression terms. Generation may take hours (the bulk documentation says up to
48 hours), and autocomplete is available only to engines over included sites
[S7, S12].

**INFERENCE (high):** query telemetry feeds a user-facing feature, while owner
rules can suppress harmful or misleading suggestions. The product docs do not
provide suggestion provenance, frequency threshold, abuse review, or per-term
reason to end users.

**RECOMMENDATION (high):** Curiosity should version expansions and suggestions,
retain their origin and safety decision, bound expansion fan-out, and return the
actual executed query plan. Never silently let an expansion change legal,
language, time, or corpus scope.

### 3.4 Publisher metadata, filtering, sorting, and snippets

**FACT (high):** PSE extracts publisher-supplied PageMaps, selected meta tags,
estimated page dates, and subsets of JSON-LD, Microformats, RDFa, and Microdata.
These can populate rich snippets and structured filters, hard sorts, soft
biases, and numeric/date ranges [S13-S15].

Material bounds include [S13, S14]:

- up to 50 selected meta tags converted to PageMap data, no more than 1 MB
  total processed property text and 1,024 characters per property;
- up to 200 structured attributes per page for attribute filtering, in a
  documented source order;
- only the first 10 tokens of a textual attribute become restrictions;
- JSON-LD strings are truncated to roughly 50 characters for restrictions;
- hard sorting excludes pages without the field or a parseable value.

**FACT (high):** Google estimates a page date from title, URL, byline, and other
features, warns that inconsistent dates can produce an unexpected estimate,
and does not expose that estimate in PageMap/Search Element data even though it
can affect ordering [S13].

**INFERENCE (high):** structured data is publisher assertion plus provider
extraction, not verified truth. A hidden value materially affecting rank is not
auditable. Hard sort also changes corpus eligibility, not merely order.

**RECOMMENDATION (high):** return each material field with source location,
raw value, normalized value, parser/version, confidence, and whether it
filtered, scored, or rendered the hit. Keep publisher-claimed dates distinct
from fetched, first-seen, modified, and indexed times.

## 4. Promotions, UI, branding, and advertising

### 4.1 Promotions are operator-authored results

**FACT (high):** promotions are owner-authored title/URL/description/image
objects displayed at the top when a query exactly matches a configured term or
matches a configured regular expression. They can interpolate the user's query
into title or URL. An engine supports 2,000 promotions; each file is at most
500 KB and aggregate promotion files per account at most 4 MB [S10].

**INFERENCE (high):** promotions are neither organic retrieval nor necessarily
paid ads. Query interpolation into a destination URL is also a navigation
security boundary.

**RECOMMENDATION (high):** preserve explicit types—`organic`,
`operator_promotion`, `paid_ad`, `sponsored`, `answer`—and exclude promotions
from organic relevance metrics. Validate schemes/hosts and encode interpolated
queries; never let promotion text authorize tool use.

### 4.2 Search Element and hosted presentation

**FACT (high):** the Search Element is asynchronously loaded Google JavaScript
that renders a search box, results, or both. Layouts include overlay, full-width,
compact/mobile, two-column, two-page, results-only, and Google-hosted results.
The iframe option is no longer supported [S16, S19].

**FACT (high):** settings are overridable with HTML attributes for history,
autocomplete, refinements, web/image mode, result count (1-20), site/language/
country/license/file filters, SafeSearch, sorting, link target, and mobile
layout. Initialization, pre-search, results-ready, and results-rendered
callbacks permit query changes and custom rendering. Callback result objects
include titles, URLs, snippets, thumbnails, refinement labels, and open-shaped
structured data [S16].

**FACT (high):** operators can customize theme, fonts, colors, result and
promotion styling, tabs, and selected layouts. Google-hosted pages can carry an
owner logo; embedded Element branding/attribution is governed by Google's
branding rules [S19-S21].

**INFERENCE (high):** the Element is a remotely controlled UI dependency and
data plane, not merely a local component library. Server-side changes and
remote script changes can alter behavior without an application release.

**RECOMMENDATION (high):** Curiosity should own result rendering, accessibility,
sanitization, and release pinning. Provider adapters return typed plain data;
remote provider scripts must not own the agent/search trust boundary.

### 4.3 Ads and ads-free variants

**FACT (high):** the free Standard Search Element has no daily query limit but
shows ads. An owner can create a new AdSense search-engine ad unit and receive a
share of revenue from contextually relevant ads clicked in an Element deployed
on the owner's site. Revenue is not shared for Google-hosted/public engine pages
or after “Search on Google” navigation; monetization cannot be enabled on an
existing PSE and instead requires a new AdSense-created search engine [S4, S22].

**FACT (high):** qualifying nonprofit, education, and government sites can use
an ad-free Element at no charge after organization verification. This applies
only to the client-side Element [S23].

**FACT (high):** the ads-free Paid Element costs **US$5 per 1,000 Element
queries**, has no documented daily query limit, and is closed to new customers.
Existing customers use a Cloud API key and billing; Google recommends an
explicit daily quota because new consumer projects default to unlimited daily
quota. Per-minute and per-user-per-minute quotas are available [S4].

**RECOMMENDATION (high):** ads and operator promotions must never be evidence.
Commercial placement should be isolated from rank policy, evaluation, and agent
follow-up. Cost controls must default bounded rather than “unlimited.”

## 5. Safety and localization

### 5.1 Safety is narrow

**FACT (high):** engine creation and the Control Panel expose a SafeSearch
toggle; Search Element attributes can set `off` or `active`. Google describes it
as filtering explicit web and image results [S16, S24].

**FACT (high):** PSE terms also prohibit an operator's site from containing
pornographic, hate-related, violent, illegal, or rights-violating material, and
contain separate warranties about adult content and harmful/illegal activity
[S9]. That contractual site rule is not a documented result classifier or
per-hit policy explanation.

**INFERENCE (high):** SafeSearch is not a general safety boundary. Reviewed
Element docs expose no per-hit malware, prompt-injection, spam, hate/violence,
self-harm, PII/secrets, legal, or classifier-version reason object.

**RECOMMENDATION (high):** Curiosity needs layered, versioned safety checks at
fetch, index, retrieval, and display. Return bounded reason classes and
uncertainty. Search content is untrusted evidence and cannot change policy,
grant tools, or approve an exception.

### 5.2 Localization controls are distinct but documentation drifts

**FACT (high):** the Element exposes separate controls for UI language,
document-language restriction, country restriction, and country boost. The
language reference lists 38 explicit UI languages plus the user's locale;
English is the XML default [S16, S25].

**CONTRADICTION:** the developer language reference says engine language both
localizes UI and boosts results in that language, while the current Help Center
says changing interface language affects only UI and not results. Both direct
users to a separate language restriction for filtering [S25, S26]. Without a
live authorized test, the rank-boost effect is **UNKNOWN**.

**RECOMMENDATION (high):** represent these independently:
`ui_locale`, query language + confidence, desired document languages,
geographic intent, user region, and legal/policy jurisdiction. Never infer
country, language, or consent from one another, and evaluate quality by
language-region-corpus cell.

## 6. Lifecycle, current availability, limits, and pricing

### 6.1 Current availability ledger

| Surface on 2026-08-17 | Current status | Material boundary |
| --- | --- | --- |
| Standard Search Element | **Available** | Free, ads, no daily query limit, sites-only for new engines, <=50 domains [S2-S4]. |
| Nonprofit Search Element | **Available to qualifying organizations** | Free, no ads, Google branding, organization verification [S23]. |
| Paid Search Element | **Existing customers only** | Ads-free, $5/1,000, no documented daily cap, key/billing [S4]. |
| Existing whole-web Search Element | **Transitioning out** | Continues only through 2027-01-01; disabling is irreversible [S2, S3]. |
| Custom Search JSON API | **Separate transport; closed/retiring** | Existing customers transition by 2027-01-01; not the subject of this report [S3]. |
| Contact-only full-web successor | **UNKNOWN** | Public announcement provides intake, not a public contract, price, or GA commitment [S3]. |

**FACT (high):** Google's January 2026 announcement and current site-management
page preserve the <=50-domain Search Element path while retiring whole-web use.
The Paid Element page was updated 2026-01-30 to say it is closed to new
customers [S2-S4].

**CONTRADICTION / stale documentation:** the general PSE overview and Help
Center “Versions” table still say the Paid Element and JSON API are available to
“Everyone.” Later, product-specific notices supersede those rows [S1, S4, S27].

### 6.2 Material standalone limits

| Control | Documented limit |
| --- | ---: |
| Distinct domains per current sites-only engine | 50 [S2] |
| URL patterns / annotations per engine | 5,000 [S2, S6] |
| Context or annotations upload | 30 KB [S6] |
| Engine keywords | 100 characters [S7, S8] |
| Rewrite attached to a refinement | 100 characters [S11, S12] |
| Facet items in one facet | 4 [S11] |
| Synonym variants per term / total per engine | 10 / 2,000 [S12] |
| Synonym or promotion file / account aggregate | 500 KB / 4 MB [S10, S12] |
| Promotions per engine | 2,000 [S10] |
| Element web results per page | 1-20 [S16, S28] |
| Standard/Nonprofit/Paid Element daily queries | No documented daily limit [S4, S27] |

**UNKNOWN:** public sources reviewed did not establish engines per account,
burst capacity or SLA for the free Element, total reachable result depth for
every layout, configuration propagation SLO, or a support escalation/SLA beyond
Help Center and community [S29]. No load or billing test was authorized.

### 6.3 Economics and fit

**INFERENCE (high):** Standard Element's direct search fee is zero, but its cost
model exchanges UI/data-plane control and ad inventory for service access.
Paid Element list price is simple but unavailable to new customers. Neither
variant prices the hidden switching cost of an unexportable provider index and
base ranker.

**RECOMMENDATION (high):** do not compare “free” with owned search using request
fees alone. Include consent/ads operations, UI dependency, outage and retirement
risk, configuration portability, evidence reacquisition, and inability to
inspect corpus/ranking state.

## 7. Provenance, privacy, and terms

### 7.1 Provenance: what exists and what does not

**FACT (high):** useful provenance-like artifacts are the downloadable context
and annotations, engine ID, source URL, title/snippet, optional structured data,
refinement labels, promotion identity, and aggregate/popular-query statistics
[S5, S10, S13, S16, S18].

**FACT (high):** reviewed Element contracts do not expose an immutable document
version, fetch/index timestamp, content hash, canonicalization decision, snippet
offset, rank score/reason, index snapshot, ranker version, duplicate cluster,
rights decision, or safety decision.

**INFERENCE (high):** PSE supports discovery and presentation, not reproducible
evidence. Configuration export does not export Google's index, crawl state,
rank state, or result history.

**FACT (high):** the Element offers Creative Commons-category rights filters
for web and image search, but the reviewed result object does not expose a
verified per-result license or chain of title [S16]. **INFERENCE (high):** a
rights filter is a discovery predicate, not permission to copy, index, train on,
or redistribute a result. Curiosity must independently capture the asserted
license, source evidence, applicable content, verification state, and legal/
policy decision; unknown rights remain unknown.

**RECOMMENDATION (high):** a Curiosity hit must name immutable capture/passage
IDs, hashes and offsets, fetch/index times, canonical/redirect lineage, parser
version, corpus/rank/safety policy versions, bounded rank reasons, rights/policy
decisions, and coverage warnings. Cite a captured passage, not a mutable search
snippet.

### 7.2 Query and end-user privacy

**FACT (high):** PSE terms say end-user queries are forwarded to Google, which
processes them with its search engine. Google and subsidiaries may retain and
use information collected through the service under Google's Privacy Policy;
the PSE terms incorporate Ads Controller-Controller terms and the EU User
Consent Policy [S9].

**FACT (high):** Google's policy says it may collect search terms, interactions
with content and ads, IP address, device/browser identifiers and settings,
request date/time and referrer, activity on third-party sites using Google
services, and location signals depending on product/settings. It uses data to
provide, maintain, improve, develop, personalize, measure, advertise, protect,
and communicate, with retention depending on data, purpose, and controls [S30].

**FACT (high):** for Standard Element partners serving EEA/UK users, Google
requires a certified TCF CMP. PSE's IVT option controls whether an invalid-
traffic-only cookie/local storage is permitted on unconsented traffic; Google
says PSE stopped serving personalized ads in that region from November 2023,
with rollout completed in February 2024 [S16, S31].

**INFERENCE (high):** embedding the Element causes user query and browser/device
data to cross into Google's service and advertising stack. “No direct monetary
charge” does not mean no privacy or governance cost. The general policy does not
establish a PSE-specific query retention period, region, deletion SLO, or
tenant isolation.

**UNKNOWN / contract review required:** exact retention for PSE query logs,
whether each query is attached to an account or browser under each state,
server regions, subprocessor scope, operator export/deletion controls, and the
complete controller allocation are not established by the public PSE-specific
sources reviewed.

### 7.3 Configuration and result rights

**FACT (high):** PSE terms grant Google an irrevocable, perpetual, worldwide,
royalty-free right to use, copy, modify, distribute, derive from, and display
operator-supplied “Metadata Content,” including labels, attributes, URL
associations, display content, and related updates, through Google services.
The operator retains underlying ownership aside from that license [S9].

**FACT (high):** standard PSE terms prohibit modifying/reordering or commingling
results outside permitted features; automated or invalid query generation;
reverse engineering; crawling/indexing or non-transitory storage/cache of
results; and creating a substitute or similar service from access. They require
attribution, allow advertising, permit service modification/termination, and
disclaim completeness and uninterrupted/error-free operation [S9].

**INFERENCE (high):** PSE results and metadata are not a lawful or technically
sufficient seed for Curiosity's owned index under the public standard terms.
The operator's XML export is configuration portability, not data portability.

**UNKNOWN / legal review required:** the exact agreement for a legacy Paid
Element customer, interpretation of agent/automation clauses in a specific use,
and rights in independently owned source pages are fact-specific. This report
is not legal advice.

## 8. Clean-room lessons and Curiosity verdicts

| PSE observation | Verdict | Curiosity disposition |
| --- | --- | --- |
| Context and annotations separate engine behavior from URL policy [S5-S7] | **ADOPTED** | Separate immutable corpus, rank, rewrite, safety, and UI policies. |
| Labels join reusable URL scopes to behaviors [S5-S8] | **ADAPTED** | Use typed rule IDs and schemas, not Google label/XML compatibility. |
| Hard `FILTER`/`ELIMINATE` differs from soft `BOOST` [S8] | **ADOPTED** | Eligibility before scoring; explicit precedence and reasons. |
| Scores modulate global policy per URL pattern [S8] | **ADAPTED** | Bounded source preferences with evaluation, not opaque score emulation. |
| Refinements can filter, boost, rewrite, or redirect [S11] | **ADAPTED** | Split into four typed operations; show user-visible trace. |
| Synonyms and autocomplete are domain-curated [S12] | **ADAPTED** | Versioned, provenance-bearing, safety-reviewed expansions with fan-out budgets. |
| Publisher structured data drives snippets and rank [S13-S15] | **ADAPTED** | Open extensions with field-level origin, confidence, parser version, and trust. |
| Estimated date can rank without being returned [S13] | **REJECTED** | Every material filter/sort signal must be auditable. |
| Promotions are separately authored [S10] | **ADOPTED** | Typed, visually explicit, excluded from organic evidence metrics. |
| Remote Search Element combines UI and serving [S16, S19] | **REJECTED** as core | Own UI/sanitization; keep providers behind neutral adapters. |
| Ads fund free serving [S22] | **REJECTED** for evidence search | Ads never become evidence or agent navigation targets. |
| Google index determines actual availability [S6, S9] | **REJECTED** foundation | Own crawl/index and measurable coverage. |
| Configuration export excludes index/ranker state [S5] | **REJECTED** portability claim | Export all owned source, index manifests, policies, and evaluations. |
| Whole-web and paid/API paths close after long availability [S2-S4] | **ADOPTED** risk lesson | Lifecycle register, shadow path, provider-removal drill, no hidden dependency. |
| Terms prohibit storing/indexing results [S9] | **REJECTED** data source | Acquire source content independently under explicit rights/policy. |
| Full-web successor is contact-only [S3] | **DEFERRED** | Reassess only under a procurement/legal frame with a public or reviewed contract. |

### 8.1 Provider-neutral boundary

Do not expose PSE names such as `cx`, `PageMap`, Google label modes, or Search
Element callback objects in Curiosity's domain contract. Independently model:

```text
corpus_policy_version, source_scope, hard_exclusions
query_plan + expansions, locale/language/geographic intent
rank_profile + bounded preferences, safety_policy
organic hits, operator promotions, ads (normally absent)
evidence lineage, coverage/freshness/partial-failure warnings
```

### 8.2 Bounded agent authority

Search returns untrusted evidence. It cannot create a new research frame, spend
beyond caller budget, follow a refinement/promotion/redirect automatically,
grant action tools, alter corpus policy, or approve a safety exception. A
post-synthesis curiosity pass may only score in-frame gaps; execution requires
declared caller authority.

## 9. Unknowns, contradictions, and negative results

### Material unknowns

1. Free Element QPS/burst limits, SLA, failure semantics, and total reachable
   depth by layout.
2. Coverage completeness, crawl/freshness SLO, missing-page reasons, and
   duplicate/syndication behavior for one engine.
3. Proprietary base ranking, spam/personalization behavior, boost calibration,
   and interaction among overlapping labels.
4. Configuration propagation time, version history, audit export, and rollback
   behavior in the live Control Panel.
5. PSE-specific query retention, data region, deletion, and account/browser
   linkage under each consent state.
6. Public contract, price, availability, or technical shape of Google's
   contact-only full-web successor.
7. Exact post-2027 behavior for legacy whole-web Element engines and export
   windows.

### Contradictions / documentation drift

- “Versions” and overview tables say Paid Element/JSON API availability is
  “Everyone”; later product-specific pages say both are closed to new customers
  [S1, S4, S27].
- the developer language page says UI language also boosts same-language
  results; Help Center says UI language does not affect results [S25, S26].
- legacy developer pages describe many features without always distinguishing
  current sites-only engines from the whole-web mode ending in 2027. Capability
  semantics remain useful, but current envelope comes from S2-S4.

### Negative results retained

- No official public benchmark of PSE relevance, recall, freshness, safety,
  availability, or latency for Curiosity workloads was found.
- No result-level rank explanation, score, crawl time, immutable snapshot,
  document hash/version, or passage anchor was found for the Element.
- No coverage dashboard or per-pattern missing/stale reason was found.
- No generally available, documented full-web replacement was found.
- No public source reviewed established that PSE results may seed a permanent
  owned index; standard terms say the opposite.
- No live engine was created: Control Panel-only behavior, runtime headers,
  scripts, cookies, ads, errors, and propagation were not inferred.

## 10. Verification checks

| Check | Triangulation | Outcome |
| --- | --- | --- |
| Standalone/API boundary | overview, Element docs, 2026 announcement [S1, S3, S16] | Kept PSE control/UI product distinct from JSON transport. |
| Current corpus scope | current Help page + announcement [S2, S3] | Confirmed new sites-only engines, 50 domains, whole-web sunset and irreversible opt-out. |
| Configuration model | basics, context, annotations, ranking [S5-S8] | Confirmed context/annotation/label join and hard/soft controls. |
| UI and ads | Element, UI, Paid Element, AdSense, nonprofit pages [S4, S16, S19, S22, S23] | Confirmed variants, layouts, ads, price, and current closure. |
| Safety/localization | Element + Help + language reference [S16, S24-S26] | Confirmed controls; retained language contradiction. |
| Privacy/terms | PSE terms, consent page, privacy policy [S9, S30, S31] | Confirmed query transfer/data-use boundary; product-specific retention remains unknown. |
| Limits | current site page plus feature-specific docs [S2, S6, S10-S14] | Confirmed principal config bounds; no runtime load test. |
| Access boundary | research log | Public pages only; no account, key, billing, form, query, or private data. |

## 11. Bounded curiosity pass and stop decision

Scores: 1 low to 5 high; cost 1 cheap to 5 expensive.

| Thread | Rel. | Value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Distinguish surviving Element from retiring JSON/whole-web modes | 5 | 5 | 4 | 1 | **Pursued:** current product pages resolved the boundary [S2-S4]. |
| Verify corpus rule limits/irreversible transition | 5 | 5 | 4 | 1 | **Pursued:** current Help page established 50 domains, 5,000 patterns, irreversible opt-out [S2]. |
| Establish end-user query/privacy path | 5 | 5 | 4 | 2 | **Pursued:** terms, consent page, and privacy policy confirmed transfer and broad processing, but not PSE retention [S9, S30, S31]. |
| Resolve UI-language ranking contradiction with live engine | 3 | 3 | 4 | 5 | `CURIOSITY_NO_GO`: requires account/runtime experiment and a measured protocol outside authority. |
| Create engine to inspect Control Panel history/export | 4 | 3 | 3 | 4 | `CURIOSITY_NO_GO`: user explicitly prohibited credentials/tests; public docs sufficient for architectural verdict. |
| Submit full-web contact form | 2 | 3 | 4 | 4 | `CURIOSITY_NO_GO`: creates external procurement/contact activity and non-public evidence. |
| Reconstruct ranking from outputs | 1 | 2 | 4 | 5 | `CURIOSITY_NO_GO`: terms-sensitive, unreliable, and unnecessary for clean-room lessons. |
| Give definitive legal interpretation of automation/metadata license | 4 | 4 | 3 | 5 | `CURIOSITY_NO_GO`: counsel and complete customer agreement required. |

**Stop:** coverage reached across engine/corpus configuration, annotations and
context, include/exclude rules, ranking/refinements, UI/ads, safety/localization,
lifecycle, limits/pricing, provenance/privacy/terms, clean-room transfer, and
Curiosity implications. Additional public pages repeated these boundaries;
remaining high-value gaps require prohibited account, commercial, or legal
authority. Follow-up execution requires a new caller-declared frame.

## 12. Primary-source ledger

All sources are Google primary sources accessed 2026-08-17. Page update dates
are included when shown and material. Public documentation is authoritative for
documented behavior, not observed quality.

| ID | Source | Use / confidence |
| --- | --- | --- |
| **S1** | Google, **Programmable Search Engine overview**, updated 2024-08-21. https://developers.google.com/custom-search/docs/overview | Product surfaces/use cases. **Medium-high**; availability table is stale. |
| **S2** | Google, **Update sites in your search engine**. https://support.google.com/programmable-search/answer/12397162 | Current URL rules, 50 domains, 5,000 patterns, whole-web transition. **High**. |
| **S3** | Google PSE Blog, **Updates to our Web Search Products & Programmable Search Engine Capabilities**, 2026-01-20. https://programmablesearchengine.googleblog.com/2026/01/updates-to-our-web-search-products.html | Original transition announcement and successor paths. **High**. |
| **S4** | Google, **Programmable Search Element Paid API**, updated 2026-01-30. https://developers.google.com/custom-search/docs/paid_element | Closure, price, quotas, monitoring. **High**. |
| **S5** | Google, **Creating PSE with configuration files**, updated 2024-08-21. https://developers.google.com/custom-search/docs/basics | Artifact model, merge/export/comment behavior. **High**. |
| **S6** | Google, **Annotations: Defining Sites to Search**, updated 2024-08-21. https://developers.google.com/custom-search/docs/annotations | Google-index dependency, annotations, file limits. **High**. |
| **S7** | Google, **Context: Defining a PSE**, updated 2024-08-21. https://developers.google.com/custom-search/docs/context | Context fields, labels, keywords, image/autocomplete. **High**. |
| **S8** | Google, **Custom Ranking**, updated 2024-08-21. https://developers.google.com/custom-search/docs/ranking | Modes, weights, scores, non-absolute control. **High**. |
| **S9** | Google, **PSE Terms of Service**. https://support.google.com/programmable-search/answer/1714300 | Service, privacy, metadata license, storage/automation/reverse-engineering restrictions, lifecycle. **High** as public terms; legal application needs counsel. |
| **S10** | Google, **Promotions**, updated 2024-08-21. https://developers.google.com/custom-search/docs/promotions | Promotion behavior and limits. **High**. |
| **S11** | Google, **Refining Searches**, updated 2024-08-21. https://developers.google.com/custom-search/docs/refinements | Facets, modes, rewrites, redirects, display selection. **High**. |
| **S12** | Google, **Rewriting Queries**, updated 2024-08-21. https://developers.google.com/custom-search/docs/queries | Synonyms/autocomplete behavior and limits. **High**. |
| **S13** | Google, **Providing Structured Data**, updated 2024-08-21. https://developers.google.com/custom-search/docs/structured_data | PageMap, markup extraction, dates, metadata bounds. **High**. |
| **S14** | Google, **Filtering and sorting search results**, updated 2024-08-21. https://developers.google.com/custom-search/docs/structured_search | Filters, tokenization, hard sort, bias, ranges. **High**. |
| **S15** | Google, **Customizing Results Snippets**, updated 2024-08-21. https://developers.google.com/custom-search/docs/snippets | Structured snippet/presentation pipeline. **High**. |
| **S16** | Google, **PSE Element Control API**, updated 2026-02-10. https://developers.google.com/custom-search/docs/element | Current embedding, layouts, controls, callbacks, IVT. **High**. |
| **S17** | Google, **Choose who can edit your search engine**. https://support.google.com/programmable-search/answer/12921665 | Owner/admin roles and verification. **High**. |
| **S18** | Google, **Statistics**. https://support.google.com/programmable-search/answer/13595016 | Query volume and popular-query analytics. **High**, scope narrow. |
| **S19** | Google, **Search UI Components**, updated 2026-01-20. https://developers.google.com/custom-search/docs/ui | Layouts, customization, iframe retirement. **High**. |
| **S20** | Google, **Context File / Look and Feel**, updated 2024-08-21. https://developers.google.com/custom-search/docs/ui_xml | XML presentation and hosted logo. **High**. |
| **S21** | Google, **PSE Branding Guidelines**. https://support.google.com/programmable-search/answer/10026723 | Attribution boundary. **High**. |
| **S22** | Google, **PSE AdSense Monetization**. https://support.google.com/programmable-search/answer/13315956 | Revenue-sharing scope and setup limitation. **High**. |
| **S23** | Google, **Information for non-profits**. https://support.google.com/programmable-search/answer/12423873 | Qualifying ad-free Element. **High**. |
| **S24** | Google, **Enable SafeSearch**. https://support.google.com/programmable-search/answer/12423678 | Engine-level explicit-content control. **High**, narrow. |
| **S25** | Google, **Language Values**, updated 2024-08-21. https://developers.google.com/custom-search/docs/ref_languages | UI languages and claimed boost. **Medium** due conflict with S26. |
| **S26** | Google, **Language settings**. https://support.google.com/programmable-search/answer/12423871 | Current UI-only statement and all-languages behavior. **Medium-high**; conflict retained. |
| **S27** | Google, **PSE Versions**. https://support.google.com/programmable-search/answer/9069107 | Offering comparison. **Medium-low for availability**, contradicted by current specific notices. |
| **S28** | Google, **Advanced PSE features**. https://support.google.com/programmable-search/answer/12420301 | Element result count, filters, sort settings. **High**. |
| **S29** | Google, **Support**, updated 2024-08-21. https://developers.google.com/custom-search/docs/support | Public Help Center/community path. **High**, no SLA claim. |
| **S30** | Google, **Privacy Policy**, effective 2026-05-26. https://policies.google.com/privacy | General collection, uses, controls, retention classes. **High** as general policy; not PSE-specific retention. |
| **S31** | Google, **Managing consent on sites linked to your engine**. https://support.google.com/programmable-search/answer/14545993 | EEA/UK CMP, IVT, personalized-ad transition. **High** for stated partner requirements. |

### Overall confidence

- **High:** current sites-only envelope, Google-index dependence, configuration
  semantics, principal limits, Element/ads variants, Paid Element closure and
  price, standard terms, and absence of documented evidence provenance.
- **Medium-high:** current behavior of older advanced XML/ranking features in
  sites-only engines; docs remain published but no live test was authorized.
- **Low / unknown:** proprietary ranking, measured quality, runtime capacity,
  PSE-specific retention, exact 2027 shutdown mechanics, and full-web successor.
