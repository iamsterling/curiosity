# Firecrawl Map: clean-room URL-discovery reverse engineering

**Research and source-access date:** 2026-08-17  
**Decision:** which Firecrawl Map contract and architecture lessons Curiosity
should adopt, adapt, reject, or defer.  
**Scope:** `POST /v2/map` only. Firecrawl Crawl, Scrape, Extract, Search as a
standalone product, Agent, and browser automation are out of scope except where
Map internally depends on an index, search service, robots fetch, or sitemap
fetch.  
**Status:** research only. No account, credential, paid/free API call, target
mapping, deployment, benchmark, bypass test, or source-code transfer was
performed.  
**Pinned OSS evidence:** Firecrawl release `v2.11.162`, resolved commit
`7666c1f9ae8720a6bba271e0f60b6a217f8a5210` [S12].

## Executive verdict

**ADAPT Map's discovery-only boundary, but REJECT Firecrawl Map as a canonical
site inventory or evidence source (high confidence).** It is a fast,
synchronous URL-hint aggregator, not a live hyperlink traversal. Current
first-party documentation says it combines sitemap URLs, cached prior-crawl
data, and search-engine results, prioritizes speed, can miss links, and should
not be used when a thorough/current list is required [S1]. The public response
does not identify which source produced each URL, whether coverage was
truncated, when the URL was observed, or whether the page still exists [S2].

**ADOPT the product separation:** URL discovery must remain cheaper and less
trusted than content acquisition. **ADAPT the request shape:** explicit seed,
sitemap policy, subdomain/query policy, result cap, timeout, and optional
relevance hint are useful. Strengthen it with exact origin/registrable-domain
semantics, byte/work budgets, source labels, freshness policy, item provenance,
partial-result status, and deterministic normalization.

**REJECT source reuse in Curiosity's provider-neutral core (high confidence).**
The inspected server and Map implementation are under the repository's
AGPL-3.0 license. The separately identified SDK/UI exceptions do not relicense
the server. Learn behavior and author an independent contract; do not copy Map
server code, schemas, ranking, tests, or prompts into permissively licensed
Curiosity code [S12][S13].

**DEFER a hosted adapter (high confidence)** until Firecrawl provides acceptable
Map-specific retention/ZDR terms, source provenance, tenant/cache assurances,
robots and origin-politeness commitments, billing reconciliation, and
controlled owned-domain verification. The pinned controller explicitly marks
Map ZDR unsupported and logs the seed/options/results; public policy gives no
fixed Map-result retention period [S14][S21][S9].

## 1. Frame, bounded questions, and method

### 1.1 Decision questions

1. What exactly does Map accept and return, and which fields are stable public
   contract versus merely present in one OSS release?
2. Which sources discover URLs, in what order, and what completeness or
   freshness can be claimed?
3. How are domain/path/query scope, redirects, normalization, ranking, and
   duplicate suppression handled?
4. Does Map honor robots and origin politeness while fetching its discovery
   inputs?
5. What cache, logging, provenance, limit, error, price, privacy, SSRF, and
   license boundaries matter to Curiosity?
6. Which clean-room lessons transfer without importing AGPL implementation?

### 1.2 Evidence and confidence rules

Primary evidence was limited to Firecrawl's current documentation, OpenAPI,
pricing/legal pages, and read-only inspection of the pinned public release.
Vendor statements establish an offered behavior, not independent quality,
security, completeness, or Cloud/source parity. Source inspection establishes
what the pinned OSS revision says, not necessarily what Firecrawl Cloud runs.

- **FACT** — directly supported by a cited first-party source or pinned file.
- **INFERENCE** — the narrowest consequence supported by facts.
- **UNKNOWN / NEGATIVE RESULT** — inspected evidence does not establish it.
- **RECOMMENDATION** — a Curiosity choice, not a Firecrawl claim.
- Confidence is **high**, **medium**, or **low**.

**Coverage bound:** discovery contract, scope/completeness, robots/politeness,
normalization/deduplication, cache/freshness/provenance, limits/errors/pricing,
SSRF/privacy/license, and Curiosity implications. **Stop condition:** primary
evidence covers each category and further public inspection repeats known
patterns or requires live/vendor-private evidence.

## 2. Public URL-discovery contract

### 2.1 Request and response

`POST https://api.firecrawl.dev/v2/map` is synchronous and bearer-authenticated
in OpenAPI [S2].

| Public field | Contract on 2026-08-17 | Boundary consequence |
| --- | --- | --- |
| `url` | Required URI; HTTP(S) in pinned validation | A discovery seed, not proof the resource was fetched successfully. |
| `search` | Optional string; orders results by relevance; example describes matching URL text | Soft relevance hint, not a security scope. |
| `sitemap` | `include` (default), `skip`, or `only` | Source-selection policy, not a completeness promise. |
| `includeSubdomains` | Boolean, default `true` | Broad default; exact domain semantics are not defined in OpenAPI. |
| `ignoreQueryParameters` | Boolean, default `true` | Destructive identity collapse, despite the name saying only “do not return.” |
| `ignoreCache` | Boolean, default `false`; described as bypassing sitemap cache | Does not publicly promise bypass of every discovery source/cache. |
| `limit` | Default 5,000; maximum 100,000; minimum 1 in pinned schema | Return cap, not discovered/fetched-work cap or completeness indicator. |
| `timeout` | Positive milliseconds; no default documented | Bounds synchronous wait only when supplied; cancellation/partial semantics are not fully declared. |
| `location` | Country and preferred languages; country defaults to US | Docs claim proxy/language/timezone behavior; exact effect per discovery source is unspecified. |
| `auditMetadata` | Enterprise SIEM attribution object | Operational attribution, not URL provenance. |
| `threatProtection` | Enterprise per-request policy override | Safety classification; off by default and separately billed in Normal mode. |

The success envelope is `{success: true, links: [{url, title?,
description?}]}`; the pinned controller also returns an `id` and may return a
low-result `warning` [S2][S14][S15]. Title and description are optional [S1].

**FACT (high):** the OpenAPI declares only 200, 402, 429, and 500 for this
endpoint, while the general error catalog and pinned controller establish
additional 400/401/403/408 possibilities [S2][S7][S14]. Clients must not treat
the endpoint page's response list as exhaustive.

**CONTRADICTION:** the Map feature page's SDK setup comments say no API key is
needed to get started, but its cURL request includes authorization, OpenAPI
requires bearer authentication, and the rate-limit page explicitly says Map is
not keyless [S1][S2][S4]. **Assessment (high):** require a key; do not build a
keyless assumption into an adapter.

### 2.2 Output meaning

**FACT (high):** Map documentation says URLs are “primarily” from sitemaps,
supplemented by search-engine results and previously crawled pages. It warns
that speed is prioritized, links can be missed, and a more thorough/up-to-date
inventory requires a different product [S1].

**INFERENCE (high):** each returned item is a `UrlHint`, not a fetched document.
The optional title/description can originate from stale index/search metadata;
sitemap-only entries generally have no such metadata in the pinned composition
path [S16]. No claim from a Map result should be cited as page evidence.

**NEGATIVE RESULT:** the response has no per-item discovery source, parent edge,
observation time, source-cache time, HTTP status, redirect chain, canonical URL,
robots verdict, rank/score, language, content hash, or “still exists” signal
[S2][S15]. It also has no total-candidate count, `hasMore`, truncation flag, or
coverage estimate.

## 3. Discovery composition and completeness

### 3.1 Highest-confidence architecture

The pinned release supports this clean-room behavioral model [S14-S20][S22]:

```text
validated seed
  -> bounded HEAD, then GET redirect resolution
  -> fetch/import robots.txt (failure tolerated)
  -> unless sitemap-only:
       index lookup and proprietary map-search lookup in parallel
       optionally fetch seed/robots-declared sitemap trees
       combine candidates according to search/no-search ordering
  -> or, sitemap-only:
       fetch sitemap trees only
  -> normalize URLs
  -> same-domain, optional same-subdomain, and seed-path filtering
  -> exact-string deduplication
  -> return first `limit` URL records
  -> optionally filter returned URLs through Enterprise Threat Protection
  -> bill and log
```

This describes the pinned code's observable composition, not Firecrawl Cloud's
private topology.

### 3.2 Source behavior and ordering

**FACT (high):** when `sitemap != only`, the pinned implementation performs an
index lookup and a Fire-engine `/map` lookup concurrently. It then optionally
adds sitemap candidates [S16]. The Fire-engine integration is separately
configured and returns nothing when absent; its own warning says local results
may differ from Cloud [S22]. Thus default self-host availability is not Cloud
parity even though the route exists.

**FACT (high):** without `search`, candidate precedence before filtering is
index, then sitemap, then search results. With `search`, search results are
prepended before index/sitemap candidates; candidates are truncated and then
lexically reranked using only URL text in the pinned implementation [S16][S23].
Title and description are not included in that local relevance calculation.

**INFERENCE (high):** `search` is not semantic site search and ranking is not
stable evidence. It combines an upstream result order with a simple URL-token
rerank over a pre-truncated pool. Relevant sitemap/index URLs outside that pool
cannot be recovered by reranking.

**FACT (high):** the ordinary Fire-engine contribution is capped internally at
100 results in this release even when the public `limit` is much larger; index
and sitemap candidates can supply the rest [S16]. The public contract does not
expose source quotas.

**FACT (high for the pinned source; Cloud effect unknown):** `location` is
forwarded to the robots/sitemap acquisition options, but not to the Map index
query or the Fire-engine Map request in this revision [S16][S20][S22]. The
public claim that location selects relevant content therefore lacks
source-by-source semantics and cannot be assumed to localize every candidate.

### 3.3 Why completeness cannot be inferred

Map does not traverse ordinary page hyperlinks. Coverage depends on:

- target sitemap presence, validity, currency, and the inspected 25-sitemap
  fetch cap;
- Firecrawl's prior index coverage, whose Map query only selects index records
  created within the preceding two days in the pinned release;
- private search-provider coverage and its per-call candidate cap;
- source failures, timeout, caches, filtering, normalization, deduplication,
  source ordering, and final limit [S16-S20].

**FACT (high):** source errors are commonly converted to empty candidates or
silently ignored, and Map can still return `success: true` [S16-S20]. A sitemap
timeout returns zero sitemap results; index query errors return an empty array;
sitemap include errors are swallowed.

**FACT (high):** the implementation truncates a combined pool before final URL
normalization, domain/path filtering, and deduplication, then slices again at
the end [S16]. Therefore invalid, out-of-scope, or duplicate early candidates
can produce substantially fewer than `limit` results even when later valid
candidates existed.

**SOURCE ANOMALY (high confidence in code, unknown Cloud impact):** in
`sitemap=only`, after sitemap processing reports success, the pinned code drops
the first collected record with `slice(1)`. The surrounding sitemap helper adds
the seed after sitemap URLs, so this is not reliably equivalent to removing the
seed and can discard the first actual sitemap URL [S16][S17]. This was not live
tested and must not be generalized beyond the pinned release.

**RECOMMENDATION (high):** a Curiosity discovery result must declare
`complete=false` unless completeness is established against a bounded,
versioned source manifest. A return cap should yield `truncated=true` and
candidate counts by source and rejection reason.

## 4. Scope semantics and redirects

### 4.1 Public intent

The documented scope controls are seed URL/path, optional subdomains, query
removal, and sitemap source mode. Map has no documented external-domain,
redirect-scope, depth, breadth, byte, sitemap-count, or per-origin work policy
[S2].

**FACT (high):** the pinned Map defaults to path filtering. For a non-root seed,
only candidate pathnames beginning with the seed pathname survive; a root seed
does not trigger this filter [S14-S16]. This consequential behavior is absent
from current OpenAPI. The comparison is a raw string prefix, not a path-segment
boundary, so a seed path such as `/docs` can also admit `/docstore` [S16].

**FACT (high):** a seed redirect is probed with HEAD, falling back to GET if
needed, each with a two-second timeout. If the final hostname is judged a
different domain, the code substitutes only that hostname into the original
seed URL; it does not adopt the resolved scheme, path, query, or port
[S16][S24]. Returned records do not expose this transformation.

**INFERENCE (high):** redirect resolution changes discovery scope invisibly and
can produce a synthetic seed different from both submitted and final URLs.
Curiosity must preserve `submitted_url`, every redirect hop, `final_url`, and
the separately approved scope root.

### 4.2 Domain-boundary defect in pinned OSS

**FACT (high):** the final “same domain” predicate strips leading `www`, then
compares only the last two hostname labels. It does not use the Public Suffix
List, although another index helper in the same repository does [S19][S24].

**INFERENCE (high):** with default `includeSubdomains=true`, this can treat
unrelated sites under multi-label public suffixes as one domain—for example,
`a.co.uk` and `b.co.uk`. It also intentionally admits every subdomain of an
ordinary two-label domain. Ports are not part of the comparison. This is not a
safe authorization boundary.

**RECOMMENDATION (high):** Curiosity must define and test separate exact-origin,
exact-host, registrable-domain (PSL), and approved-subdomain policies. Never
delegate security scope to a provider's “same domain” label. Revalidate every
redirect and every fetched sitemap URL against local policy.

### 4.3 Undocumented accepted controls

The pinned strict schema inherits several crawl-oriented fields not shown on
the public Map OpenAPI, including path regexes, external-link flags, robot
override fields, and delay [S15]. Some names are not wired to the fields the
Map-created crawler reads, and final filtering still enforces the Map domain
boundary [S16][S25].

**RECOMMENDATION (high):** do not depend on undocumented Map request fields.
Their presence in one server schema is not a stable hosted contract and their
effects are inconsistent in this revision.

## 5. Robots and origin politeness

### 5.1 What Map actually establishes

**FACT (high):** the repository README says Firecrawl respects `robots.txt` by
default [S12]. Map fetches `/robots.txt`, imports its rules and sitemap
declarations, and continues without them on failure [S16][S17][S20]. The robots
fetch can use an index entry up to one day old before live/fallback engines
[S20].

**FACT (high):** the pinned Map path does **not** establish that disallowed URL
candidates are filtered:

- sitemap-only bypasses the crawler's filtering entirely;
- sitemap-include calls filtering with `skipRobots=true`;
- index and search candidates never pass through the crawler robots filter;
- the final pipeline filters domain/subdomain/path but not robots [S16][S17].

**INFERENCE (high):** “fetches robots” is not equivalent to “Map honors robots.”
The inspected source supports using robots-declared sitemap locations, but not
applying robots allow/disallow to returned Map URLs. RFC 9309 also defines
robots as crawler access rules, not access authorization or a general ban on
listing known URLs [S11]. The practical defect is narrower: the broad README
claim is not evidenced for Map's own sitemap fetches or result filtering.

**FACT (high):** `Crawl-delay` is parsed by the shared crawler, but Map does not
apply the value. Sitemap indexes are recursively fetched in parallel, with up
to 25 sitemap resources visited; no Map-specific per-origin delay, concurrency
budget, `Retry-After` policy, or adaptive 429/503 backoff is exposed [S17][S18].

### 5.2 Politeness interpretation

Map is materially lighter than a page crawl, but it still performs origin
requests: seed redirect probes, robots, seed/robots-declared sitemaps, recursive
sitemap indexes, and potentially gzip downloads. “One Map call” is therefore
not “one origin request.”

**UNKNOWN:** Cloud-wide per-origin coordination, request user agent, robots
cache revalidation, target-response retry budget, publisher rate controls, and
whether parallel Maps from different tenants share a host budget.

**RECOMMENDATION (high):** Curiosity should own robots and politeness before
calling any provider: policy/user-agent, robots retrieval time/result, selected
rule, declared sitemap URLs, fetch permission, crawl-delay interpretation,
per-origin concurrency/next-eligible time, 429/503 and `Retry-After` backoff,
and explicit fail policy. An agent must not receive robots-override authority.

## 6. URL normalization, ranking, and deduplication

### 6.1 Pinned normalization behavior

**FACT (high):** final Map normalization in this release:

1. prepends `http://` if no protocol is present;
2. accepts only HTTP(S);
3. removes one terminal `/` from the raw string;
4. when `ignoreQueryParameters=true`, removes everything from the first `?`;
5. trims whitespace;
6. deduplicates by the resulting URL string, preferring a duplicate record
   that has a title when the first lacks one [S16][S24].

The used Map path does not generally collapse HTTP/HTTPS, `www`/bare host,
default ports, path case, percent-encoding variants, fragments, parameter
ordering, tracking parameters, `/index.html`, publisher `rel=canonical`, or
redirect aliases. A more elaborate helper exists elsewhere in the file but is
not used by final Map deduplication [S16][S24].

**INFERENCE (high):** default query removal can merge semantically different
resources, while retained fragments and scheme/host aliases can preserve
duplicates. Exact-string deduplication prevents identical returned strings but
does not establish resource identity or content duplication.

**FACT (high):** the `search` reranker tokenizes the query, counts query-token
occurrences in URL strings, computes a cosine-like score, and performs a stable
descending sort; it does not use page content or, despite a source TODO,
title/description [S23].

**RECOMMENDATION (high):** Curiosity should retain independently:

- submitted URL text and discovery source;
- parsed/normalized fetch URL;
- redirect chain and final URL;
- publisher canonical as an untrusted assertion;
- exact origin/host/PSL identity;
- query policy and removed-parameter record;
- exact-capture hash and duplicate cluster, once fetched.

Normalization must not erase provenance, and ranking must never widen hard
scope or imply that unvisited pages are relevant evidence.

## 7. Cache, freshness, and provenance

### 7.1 Cache behavior

**FACT (high):** public OpenAPI says sitemap data may be cached for up to seven
days and `ignoreCache=true` bypasses that sitemap cache [S2]. In the pinned
implementation, sitemap fetches request a maximum cache age of seven days;
robots requests can use one-day-old index data; search-derived Map results are
cached in Redis for 48 hours [S16-S20]. Index candidates queried by Map are
limited to index records created in the prior two days, which bounds record
age in that index query but does not prove the underlying page was fetched at
record-creation time [S19].

**FACT (high):** `ignoreCache` bypasses the pinned search cache and forces
zero-age sitemap retrieval, but it is not passed to the Map index query and
does not force a fresh page traversal [S16][S19]. Thus “ignore cache” cannot
mean “current website inventory.”

**FACT (high):** the search-cache key is derived from the textual map query and
is not team-scoped in the inspected source. Location is not included in that
key. Forced ZDR suppresses writing this cache, but the code can still read an
existing cached search result [S16]. Tenant isolation and Cloud correspondence
remain unknown. The same path writes the search result back with a new 48-hour
TTL even after a cache hit, so frequently requested entries can remain stale
for longer than 48 hours unless cache bypass or eviction intervenes [S16].

### 7.2 Logging, retention, and evidence gaps

**FACT (high):** the pinned controller passes `zeroDataRetention: false` to Map
request and result logging with the comment “not supported.” The logger stores
the seed, options, count, credits, and—when ZDR is false—the result object in
configured object storage [S14][S21]. No TTL is visible in that Map logging
path.

**FACT (high):** Firecrawl's privacy policy says personal information may be
used for caching/indexing, data is stored on US servers, and PII is retained
until written deletion request because no recurring deletion policy currently
exists [S9]. This is not a Map-result retention schedule, but it is the public
baseline when no stronger agreement is supplied.

**NEGATIVE RESULT:** the public Map response does not reveal discovery source,
cache hit/state/time, provider index snapshot, search provider, sitemap fetch
time, robots fetch time, source failure, normalization actions, dropped count,
or options digest [S2]. Its `id` is useful for support correlation but not a
chain of custody.

**RECOMMENDATION (high):** Curiosity must wrap every hosted result with local
provider/version, request ID, received time, exact request-policy digest,
per-item source class, observed time if known, provider cache declaration,
normalization trace, scope verdict, and warnings. Unknown provenance stays
unknown; do not manufacture a fetch timestamp from response receipt time.

## 8. Limits, errors, and pricing

### 8.1 Work and output limits

- public return `limit`: 1–100,000, default 5,000 [S2][S15];
- pinned sitemap-resource cap: 25, including nested sitemaps [S17][S18];
- pinned ordinary private-search contribution: at most 100 by default [S16];
- sitemap internal timeout: 30 seconds in Map unless request timeout is passed;
  outer request has no default timeout [S2][S14][S16];
- Map rate limits per minute: Free 10, Hobby 100, Standard 500, Growth 5,000,
  Scale 10,000, shared per team [S4].

**NEGATIVE RESULT:** no public Map cap was found for seed/search/header length,
response bytes, sitemap bytes/decompression ratio, URLs parsed before final
limit, or total origin requests. In particular, sitemap-only filtering bypasses
the crawler's result limit until the final output slice in the pinned code
[S16-S18]. A 100,000 result cap is not a safe memory/network budget by itself.

### 8.2 Failure semantics

| Class | Published/pinned behavior | Curiosity handling |
| --- | --- | --- |
| 400 | Invalid body/URL | Non-retryable after schema correction. |
| 401 | Missing/invalid key | Non-retryable until credentials change. |
| 402 | Insufficient credits | Budget/plan failure; no automatic upgrade. |
| 403 | Permission or Threat Protection | Non-retryable without reviewed policy change. |
| 408 | Explicit Map timeout in pinned controller | Retryable only if local budget and idempotency permit; prior work/logging state is not fully specified. |
| 429 | Team rate/concurrency limit; `Retry-After` when available | Respect header and local retry cap. |
| 500/502/503/504 | Server/upstream failure classes | Bounded backoff; never infinite retry. |

**FACT (high):** many discovery-source failures do not produce non-2xx at all;
they produce a successful but partial/empty URL list [S16-S20]. The response
does not distinguish complete, partial, timed-out source, or exhausted source
budget.

### 8.3 Pricing and contradictions

**FACT (high, time-sensitive):** Map feature and billing docs say one credit per
**call**, regardless of returned URL count [S1][S3]. Current plans showed Free
1,000 monthly credits; annual-billing effective prices of $16/month Hobby
(5,000), $83 Standard (100,000), $333 Growth (500,000), and $599 Scale
(1,000,000), with Enterprise custom [S5].

**CONTRADICTION:** the pricing page's API table and FAQ say Map costs one credit
per **page**, while the endpoint/billing docs say one per call [S1][S3][S5].
The pinned standard controller bills one base credit, but an undocumented
special resolver branch bills one credit per returned result [S14].
**Assessment (medium):** one per call is the best-specified ordinary contract,
but budgeting requires order-form confirmation and actual invoice reconciliation
on an owned-domain test.

**FACT (high):** Enterprise Threat Protection Normal mode adds two credits per
unique URL scanned; Map removes blocked results. The docs warn scan counts can
slightly exceed returned results, while Zscaler mode checks Map output only
against local/synced rules and has no Firecrawl scan fee [S6]. A nominal
one-credit Map can therefore become expensive when URL-level scanning is on.

**RECOMMENDATION (high):** pre-authorize worst-case base plus security-scan
credits; disable Smart Upgrade for experimental integration; meter provider
reported and locally estimated cost; fail closed at local per-call/day/month
budgets.

## 9. SSRF, hostile data, and privacy boundaries

### 9.1 SSRF and egress

**FACT (high):** pinned URL validation accepts HTTP(S) URLs with a plausible
TLD, and the initial redirect resolver uses a dispatcher that destroys
connections to non-unicast/private addresses unless an operator enables
`ALLOW_LOCAL_WEBHOOKS` [S15][S24][S26]. The same dispatcher is used by plain
file downloads, including gzip sitemaps [S27]. Redirect following is configured
for up to 5,000 redirects in that shared dispatcher [S26].

**FACT (high):** sitemap indexes and robots-declared sitemap URLs can cause
additional fetches. The sitemap parser recursively follows declared sitemap
locations before final Map result scope filtering; custom headers accepted by
the pinned, undocumented schema are propagated to robots and sitemap fetches
[S16-S20].

**INFERENCE (high):** connection-time public-IP checking is meaningful SSRF
defense, but final-result domain filtering is not an egress boundary. External
sitemap resources may be fetched, and forwarding caller headers across those
resources can leak secrets if used incautiously. A 5,000-redirect cap is far
above a defensible retrieval default. Private-address checks were not probed
against alternate forms, rebinding, every proxy/engine, or Cloud-only paths.

**RECOMMENDATION (high):** do not expose hosted Map directly to an agent. A
Curiosity gateway must independently enforce HTTP(S), approved ports, no URL
credentials, public resolved addresses at every connection/redirect, DNS
rebinding resistance, low redirect cap, approved origin for every sitemap
fetch, no arbitrary headers, and byte/time/decompression budgets. Provider
Threat Protection is malware/phishing classification, not an SSRF substitute
[S6].

### 9.2 Untrusted output and privacy

Map URLs, titles, and descriptions are attacker-controlled external data. They
can contain prompt injection, misleading hostnames, Unicode confusables,
tracking identifiers, personal data, or very long strings. Threat Protection
is off by default and does not make allowed text trustworthy [S2][S6].

**FACT (high):** hosted use sends seed/search/location/audit metadata and the
resulting discovered URL set into Firecrawl's processing/logging plane. Public
privacy terms locate storage in the US and do not provide a complete
Map-specific content, URL, cache, backup, subprocessor, or deletion schedule
[S9]. The pinned controller says Map ZDR is unsupported [S14][S21].

**FACT (high):** Firecrawl's terms prohibit unlawful use, disseminating another
person's PII without permission, certain surveillance/background/FCRA/law-
enforcement uses, and make users responsible for legal/contractual compliance
[S10]. Robots permission is neither copyright permission nor authorization to
collect personal data [S11].

**RECOMMENDATION (high):** do not submit private hosts, signed/authenticated
URLs, session identifiers, personal-data searches, confidential path names, or
secret headers to hosted Map. Enterprise use requires DPA, subprocessors,
retention/deletion, residency, cache isolation, and Map-specific ZDR review.
Returned fields remain `external_untrusted` and must never enter instruction or
tool-control channels.

## 10. Hosted versus self-hosted and license boundary

**FACT (high):** official self-host documentation says core Map is included,
but the default stack does not include Fire-engine. The pinned Map integration
returns no private-search candidates when Fire-engine is absent and warns local
results may differ from Cloud [S8][S22]. A self-hosted Map can still use the
local index only if its index database is configured/populated; source presence
does not imply a pre-existing Cloud-like corpus.

**INFERENCE (high):** default self-host Map may degrade largely to sitemap
discovery until the operator supplies supporting services and index history.
“Core route available” does not mean Cloud-equivalent coverage, freshness, or
ranking.

**FACT (high):** the repository root/server is AGPL-3.0; README identifies SDKs
and some UI components as separate MIT exceptions. AGPL section 13 requires a
modified network-interactive version to offer its Corresponding Source to
remote users [S12][S13]. Fire-engine and managed Cloud services are not made
AGPL merely by the core repository being public [S8].

**RECOMMENDATION (high):** preserve clean-room separation:

1. cite public API behavior and pinned revision, as this record does;
2. independently author provider-neutral requirements from the findings;
3. do not copy server source, internal schemas, ranking logic, tests, or comments;
4. use an independently written HTTP adapter if later approved;
5. re-check SDK directory licenses before any SDK reuse;
6. obtain legal review before modifying/network-deploying the AGPL server and
   satisfy all source/notice obligations.

This is an engineering boundary, not legal advice.

## 11. Curiosity implications and verdict ledger

### 11.1 Provider-neutral discovery contract

**RECOMMENDATION (high):** model Map-like behavior as:

```text
discover(seed, scopePolicy, sourcePolicy, freshnessPolicy, budget, relevanceHint?)
  -> DiscoveryRun(status, hints[], sourceStats, rejected[], truncation, errors)
```

Minimum run fields:

- stable local run ID and provider request ID;
- submitted, resolved, and policy-root URLs;
- exact origin/host/registrable-domain/path/query policy;
- requested sources and actual source outcomes;
- start/end time, timeout/cancellation, complete/partial/truncated status;
- candidate/accepted/rejected/deduplicated counts by source;
- robots/politeness policy and observations;
- freshness request, source cache state/time when known;
- local cost authorization and provider charge;
- options/policy digest and adapter/provider version.

Minimum URL-hint fields:

- discovered URL text and independently normalized URL;
- source class (`sitemap`, `provider_index`, `provider_search`, `unknown`);
- discovery parent/sitemap when known and observation time;
- scope and threat-policy verdicts;
- rank/score with method/version, if any;
- normalization decisions and duplicate aliases;
- untrusted optional title/description;
- explicit `not_fetched=true`.

### 11.2 Verdicts

| Firecrawl Map idea or dependency | Verdict | Confidence | Curiosity disposition |
| --- | --- | --- | --- |
| Separate fast URL discovery from content acquisition | **ADOPTED** | High | Keep URL hints unable to masquerade as captures/evidence. |
| Synchronous seed + scope + source + limit + timeout shape | **ADAPTED** | High | Add bytes/work/source budgets, exact scope, partial status, and provenance. |
| `sitemap: include/skip/only` | **ADAPTED** | High | Useful source policy; record every attempted sitemap and failure. |
| Default include subdomains | **REJECTED** | High | Default exact origin/host; widen only by reviewed PSL-aware policy. |
| Default remove all query parameters | **REJECTED as identity rule** | High | Use explicit parameter policy and preserve aliases/provenance. |
| Mixed sitemap/index/search URL list without source labels | **REJECTED** | High | Cannot support freshness, corroboration, or audit claims. |
| Hosted Map as complete/current site inventory | **REJECTED** | High | Explicitly speed-biased and incomplete. |
| Search hint as soft URL prioritization | **ADAPTED narrowly** | Medium-high | May prioritize within hard scope; record scorer/version; never imply content relevance. |
| Provider cache as Curiosity evidence store | **REJECTED** | High | Missing cache/provenance and retention assurances. |
| Firecrawl-hosted Map adapter | **DEFERRED** | High | Requires privacy/ZDR, billing, robots, SSRF, provenance, and owned-domain gates. |
| Self-hosted Firecrawl Map as Curiosity foundation | **DEFERRED / likely reject** | High | AGPL, nontrivial services, and no default Cloud index/search parity. |
| Enterprise Threat Protection | **DEFERRED defense in depth** | High | Helpful malware policy, costly, off by default, not SSRF/prompt-injection defense. |
| Copying pinned Map server implementation | **REJECTED** | High | AGPL and provenance boundary. |

## 12. Unknowns and checks required before adoption

| Unknown | Why it matters | Authorized future check |
| --- | --- | --- |
| Exact Cloud revision/parity with pinned Map code | Source findings may differ from production. | Written release mapping; never infer private implementation. |
| Per-item source and observation/cache time | Freshness and evidence weighting. | Ask vendor for versioned provenance schema. |
| Map URL/result/log/cache/backup retention; ZDR availability | Seed and discovered URLs can be sensitive. | DPA, retention schedule, deletion SLA, Map-specific ZDR terms. |
| Search and sitemap cache tenant isolation/keying | Cross-tenant leakage/staleness risk. | Vendor architecture attestation and contract; controlled test only if authorized. |
| Robots enforcement for Map's sitemap fetches and returned candidates | Broad default claim is not evidenced in pinned path. | Written endpoint-specific policy plus owned-origin fixture trace. |
| Per-origin concurrency, crawl-delay, 429/503 backoff, and shared fairness | Publisher safety. | Vendor timing policy plus controlled owned-origin trace. |
| Location/language effect on index, search, robots, and sitemap separately | Reproducibility and cache correctness. | Versioned contract and owned multilingual fixture. |
| Completeness/truncation/source-failure signals | Successful partial lists are otherwise indistinguishable. | Contract revision or owned graph with expected manifest. |
| Public-suffix/domain and redirect behavior in Cloud | Security scope defect exists in pinned OSS. | Vendor remediation statement and owned domains across PSL cases. |
| Billing for ordinary Map, special resolver URLs, failures, retries, cache hits, and Threat scans | Public pages and source branches conflict. | Order form plus free-plan owned-domain invoice reconciliation. |
| Maximum sitemap bytes, decompression ratio, URL count, and total origin requests | Resource-exhaustion and cost bounds. | Vendor limits; then licensed fixture test under explicit authority. |
| Whether result title/description can be stale, generated, or cross-locale | Trust and display safety. | Field-level provenance contract; do not infer meanwhile. |

## 13. Bounded curiosity pass

After synthesis, in-frame gaps were scored 1–5 for **relevance (R)**,
**decision value (V)**, **novelty (N)**, and **cost (C, lower is better)**.
Priority was `R + V + N - C`. Only public, read-only primary-source inspection
was authorized.

| Thread | R | V | N | C | Score | Result |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Robots claim versus Map candidate/fetch enforcement | 5 | 5 | 5 | 2 | 13 | **Pursued.** Found robots fetched/imported but skipped for sitemap candidates and absent from final index/search filtering. |
| Scope correctness across redirects and multi-label public suffixes | 5 | 5 | 5 | 2 | 13 | **Pursued.** Found hostname-only redirect substitution and last-two-label domain comparison. |
| Cache/ZDR/logging provenance | 5 | 5 | 4 | 2 | 12 | **Pursued.** Established 7d sitemap, 1d robots, 48h search cache patterns and explicit Map ZDR/logging gap in pinned source. |
| Truncation/dedup ordering and sitemap-only anomaly | 5 | 4 | 5 | 2 | 12 | **Pursued.** Found pre-filter truncation, exact-string dedup, and first-item drop in sitemap-only path. |
| Pricing-unit contradiction | 4 | 4 | 5 | 1 | 12 | **Pursued.** Retained per-call versus per-page conflict and special source branch rather than guessing. |
| Reverse-engineer proprietary Fire-engine `/map` ranking/provider | 3 | 2 | 4 | 5 | 4 | **CURIOSITY_NO_GO.** Proprietary boundary; unnecessary for the adopt/defer decision. |
| Run Firecrawl Cloud against third-party sites | 3 | 3 | 2 | 5 | 3 | **CURIOSITY_NO_GO.** No credential/call authority and no third-party target consent. |
| Probe SSRF, rebinding, redirects, or cache isolation | 5 | 5 | 4 | 5 | 9 | **DEFERRED.** High value, but requires a controlled owned environment, account, rules of engagement, and caller authority. |
| Benchmark completeness on public sites | 4 | 4 | 3 | 5 | 6 | **DEFERRED.** Requires licensed/owned fixtures and a known-complete manifest; public sites cannot provide ground truth. |
| Inspect private SOC 2/security reports | 3 | 3 | 2 | 5 | 3 | **CURIOSITY_NO_GO.** Not publicly available within the no-account frame. |

**Stop reason:** coverage and saturation. Every requested category has primary
evidence; remaining decision-relevant gaps require vendor-private material or
authorized controlled tests.

## 14. Sources

All web sources were accessed **2026-08-17**. Pinned source links are cited for
behavioral inspection only; no source text was transferred into project code.

- **[S1]** Firecrawl, “Map,” current feature documentation:
  <https://docs.firecrawl.dev/features/map>
- **[S2]** Firecrawl, v2 Map OpenAPI endpoint:
  <https://docs.firecrawl.dev/api-reference/endpoint/map>
- **[S3]** Firecrawl, “Billing”:
  <https://docs.firecrawl.dev/billing>
- **[S4]** Firecrawl, “Rate Limits”:
  <https://docs.firecrawl.dev/rate-limits>
- **[S5]** Firecrawl, pricing page:
  <https://www.firecrawl.dev/pricing>
- **[S6]** Firecrawl, “Threat Protection”:
  <https://docs.firecrawl.dev/features/threat-protection>
- **[S7]** Firecrawl, API error catalog:
  <https://docs.firecrawl.dev/api-reference/errors>
- **[S8]** Firecrawl, “Open source or Firecrawl Cloud” and pinned self-host
  guide: <https://docs.firecrawl.dev/contributing/open-source-or-cloud> and
  <https://docs.firecrawl.dev/contributing/self-host>
- **[S9]** SideGuide Technologies / Firecrawl, Privacy Policy, last revision
  2024-12-26: <https://www.firecrawl.dev/privacy-policy>
- **[S10]** SideGuide Technologies / Firecrawl, Terms of Use, last revision
  2024-11-05: <https://www.firecrawl.dev/terms-of-service>
- **[S11]** IETF, RFC 9309, “Robots Exclusion Protocol,” September 2022:
  <https://www.rfc-editor.org/rfc/rfc9309>
- **[S12]** Firecrawl repository README at pinned commit:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/README.md>
- **[S13]** Firecrawl root AGPL-3.0 license at pinned commit:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/LICENSE>
- **[S14]** Firecrawl v2 Map controller, pinned
  `apps/api/src/controllers/v2/map.ts`:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/controllers/v2/map.ts>
- **[S15]** Firecrawl v2 schemas, pinned
  `apps/api/src/controllers/v2/types.ts`:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/controllers/v2/types.ts>
- **[S16]** Firecrawl Map composition, pinned `apps/api/src/lib/map-utils.ts`:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/lib/map-utils.ts>
- **[S17]** Firecrawl shared crawler/robots/sitemap orchestration, pinned
  `apps/api/src/scraper/WebScraper/crawler.ts`:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/scraper/WebScraper/crawler.ts>
- **[S18]** Firecrawl sitemap parser/fetcher, pinned
  `apps/api/src/scraper/WebScraper/sitemap.ts`:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/scraper/WebScraper/sitemap.ts>
- **[S19]** Firecrawl index querying/normalization, pinned
  `apps/api/src/services/index.ts`:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/services/index.ts>
- **[S20]** Firecrawl robots fetch/parser, pinned
  `apps/api/src/lib/robots-txt.ts`:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/lib/robots-txt.ts>
- **[S21]** Firecrawl Map logging, pinned
  `apps/api/src/services/logging/log_job.ts`:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/services/logging/log_job.ts>
- **[S22]** Firecrawl Fire-engine Map adapter, pinned
  `apps/api/src/search/fireEngine.ts`:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/search/fireEngine.ts>
- **[S23]** Firecrawl Map URL-text reranking, pinned
  `apps/api/src/lib/map-cosine.ts`:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/lib/map-cosine.ts>
- **[S24]** Firecrawl URL validation/domain/redirect helpers, pinned
  `apps/api/src/lib/validateUrl.ts`:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/lib/validateUrl.ts>
- **[S25]** Firecrawl crawler construction adapter, pinned
  `apps/api/src/lib/crawl-redis.ts`:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/lib/crawl-redis.ts>
- **[S26]** Firecrawl secure fetch dispatcher, pinned
  `apps/api/src/scraper/scrapeURL/engines/utils/safeFetch.ts`:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/scraper/scrapeURL/engines/utils/safeFetch.ts>
- **[S27]** Firecrawl file downloader, pinned
  `apps/api/src/scraper/scrapeURL/engines/utils/downloadFile.ts`:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/scraper/scrapeURL/engines/utils/downloadFile.ts>

## 15. Confidence summary

- **High:** public request/response shape, published limits/rates, explicit
  incompleteness warning, pinned composition/ordering/filtering/cache/logging,
  Map ZDR source statement, root AGPL license.
- **Medium:** exact Cloud correspondence to pinned OSS, ordinary billing where
  public pages conflict, interpretation of proprietary search/index freshness,
  Cloud cache isolation and location behavior.
- **Low / unknown:** comparative completeness, production Cloud ranking,
  distributed origin politeness, full retention/subprocessor behavior, and
  resistance to SSRF/cache-isolation bypasses without authorized testing.
