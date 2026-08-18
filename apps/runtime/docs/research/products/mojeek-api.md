# Mojeek Search API and independent-index claims

**Research date / source access date:** 2026-08-17  
**Scope:** clean-room product and architecture research; no API key, paid call,
scraping, bypass, source-code inspection, implementation, or deployment.  
**Decision frame:** what Mojeek establishes about an independently crawled web
index; whether its Search API is useful evidence or a dependency for Curiosity;
and which observable ideas should be adopted, adapted, rejected, or deferred in
an owned-search design.

## Executive verdict

**REJECTED as the owned-search foundation; ADAPTED as evidence and a possible
bounded comparison provider (high confidence).** Mojeek offers a commercial
web-results API over what it consistently describes as its own crawler,
index, ranking software, and physical infrastructure. Current first-party pages
claim a nine-billion-page milestone in 2025, a full index “of billions,” a
proprietary stack written mostly in C, self-built/managed servers, and an
identifiable crawler. These claims are mutually consistent across product,
technology, crawler, milestone, and ranking documentation. They are meaningful
architecture evidence, but remain vendor self-attestation rather than an
independent index audit [S1–S7].

The API is unusually permissive in product positioning: AI use and re-ranking
are allowed, combining results with other data is allowed, and Business has
storage rights. It also exposes useful controls—language/region boosts,
freshness restrictions, host inclusion/exclusion, clustering, Safe Search, and
on custom plans keyword, semantic, and authority signals [S8–S12]. It is not a
stable, complete public contract: endpoint and pagination examples conflict,
HTTP status/retry behavior is undocumented, no availability or freshness SLA is
public, API-specific privacy behavior and customer terms are not public, and
corpus coverage cannot be audited without authorized calls.

For Curiosity, Mojeek is strongest as evidence that a small organization can own
the crawl-to-rank chain and as a source of clean-room interface lessons. It does
not satisfy the project decision to own the corpus, captures, retrieval
evidence, and ranking. The API returns URLs, titles, snippets, and optional
metadata—not immutable document versions or passage-level provenance—and its
own FAQ explicitly says the API agreement grants no rights to underlying
third-party page content [S8].

## 1. Frame, bounded questions, and method

### 1.1 Questions

1. What first-party evidence supports Mojeek's claim to crawl, index, and rank
   the public web independently?
2. What corpus scope, languages, regions, ranking signals, and freshness
   controls are actually documented?
3. What is the observable Search API request/response, pricing, quota, error,
   retention, privacy, and rights contract?
4. What can be learned without copying proprietary code, data, or algorithms?
5. What follows for a wholly owned Curiosity search plane and bounded curiosity
   retrieval?

### 1.2 Evidence rules and limits

- **FACT** is directly stated in a cited first-party source. Vendor facts about
  its own system are marked **self-attested** where they lack external audit.
- **INFERENCE** is a conclusion from cited facts, not a measurement.
- **RECOMMENDATION** is a project choice.
- Confidence is **high**, **medium**, or **low**.
- Product documentation can establish an offered capability, not comparative
  quality. Index-size and independence claims cannot be independently verified
  from the public interface.
- Public pages were read normally. No API call was made because an active
  account/key is a prerequisite and general Terms prohibit automated access
  unless authorized [S9, S16]. No credentials, payment, private agreement,
  source code, crawler execution, or access-control workaround was used.
- The API, general web search, image search, News, Substack search, and Site or
  Organisation Search are distinct surfaces. Claims about one are not silently
  transferred to another.

**Stop condition:** coverage was sufficient when each requested category had
current first-party evidence, a confidence label, and unresolved contract gaps
were recorded rather than guessed.

## 2. Independent crawl and index: claim versus evidence

### 2.1 Claim chain

| Observable claim | First-party evidence | Assessment |
| --- | --- | --- |
| Results are not simply retrieved from another engine | Technology page says Mojeek was created not to retrieve results from another engine; product page sells access to its “full index”; 2022 milestone post contrasts its stack with Big Tech proxy services [S1, S2, S5]. | **FACT, self-attested (medium-high).** Consistent across independent pages, but no audit or reproducible corpus sample proves exclusivity. |
| Crawler and index are built in-house | Mojeek says its technology was developed from scratch, mostly in C, with no pre-existing search or crawler technology; all technology/IP is owned by Mojeek Limited [S1]. | **FACT, self-attested (medium).** Precise ownership claim; implementation is proprietary and uninspected. |
| A live first-party crawler exists | MojeekBot documentation specifies robots behavior, meta directives, a one-request-per-site-per-second ceiling, reverse/forward DNS verification, and a machine-readable IP list [S3, S4]. | **FACT (high) that an operational crawler identity and policy are published.** This does not measure crawl completeness. |
| Large, independently built index | About/technology history records 1B (2015), 2B (2018), 3B (2020), 4B (2021), 5B and 6B (2022), 7B (2023), 8B (2024), and 9B (2025); the current API page says “billions” [S1, S2, S5–S7]. | **FACT, self-attested (medium-high) as milestone reporting.** “Pages” is not publicly defined as unique URLs, live documents, searchable documents, or versions. |
| Own physical serving/index infrastructure | Mojeek says it builds/manages its servers in a dedicated room at Custodian; its 2019 post documents 100 Supermicro 2U twin-node servers, component specifications, rack layout, and intended index capacity [S1, S6]. | **FACT, self-attested with concrete physical detail (medium-high).** Public evidence does not reveal current topology, redundancy, storage layout, or which stages run where. |
| Own link authority computation | Current API scoring docs describe “Gravity,” a 0–100 PageRank-like, query-independent authority score computed using on the order of `10^11` links [S10]. | **FACT, self-attested (medium-high).** It supports the existence of a large link graph; exact algorithm and current graph coverage are unknown. |

### 2.2 Corpus scope

**FACT (high):** Mojeek's current content policy says its web index contains
only HTML webpages, not images or video, and web results show URLs, titles, and
snippets derived from page content [S13]. It lists common non-indexing reasons:
new pages, robots/meta/blocking, and predominantly JavaScript text. MojeekBot
obeys the Robots Exclusion Standard and `noindex`, `nocache`, and `nofollow`; it
does not support the non-standard `crawl-delay` directive [S3].

**FACT (high):** this narrow web-index statement coexists with Mojeek-branded
image and other search tabs. Mojeek's 2023 update says image search removed Bing
and uses Openverse/Pixabay plus “try elsewhere” links [S7]. Therefore those
surfaces are not evidence that Mojeek's own general web index stores images.

**INFERENCE (high):** the index is an HTML-first, static-text-biased corpus, not
a rendered-web, multimedia, or full-content archive. A nine-billion “page”
count says little about host diversity, language distribution, spam, recrawl
age, canonical duplication, or usable query recall.

**Unknowns requiring vendor confirmation or an authorized evaluation:**

- exact definition and current count of searchable pages;
- unique hosts/domains, country/language distribution, and coverage by vertical;
- handling of PDFs and other non-HTML documents (the content policy says “only
  HTML,” but the public parameter schema refers generically to documents);
- JavaScript rendering, sitemap ingestion, canonicalization, duplicate and
  near-duplicate policies, crawl traps, redirect limits, and robots cache;
- crawl frontier prioritization, recrawl scheduling, deletions/tombstones,
  malware/spam classifiers, and index replication;
- whether every API web result is exclusively sourced from the owned index.

### 2.3 Observable architecture

Mojeek describes the standard pipeline as:

```text
discovered links -> MojeekBot queues page content + links
  -> parse / sort / compress into compact index structures
  -> query matching over indexed pages
  -> automated ranking
  -> title + query-dependent snippet + URL
```

The company's architecture explainer says indexing consumes roughly 100 times
the compute of crawling and that pages must be revisited to keep a web index
current [S14]. Its current technology page says the stack is proprietary,
mostly C, and runs on owned/managed servers in a UK colocation facility [S1].
In 2019 it reported almost doubling its fleet with 100 servers; in 2021 it
reported growth above two million pages/day and another 100-server installation
that would increase capacity by 50% [S6, S15]. These are historical snapshots,
not a current capacity specification.

**INFERENCE (medium-high):** independent control is supported by a coherent set
of costly-to-fake operational details—crawler identity, robots rules, IP range,
server acquisitions, long index-growth history, link-graph scoring, and exposed
query/index metadata. Still, none proves completeness or quality, and all
material internal claims originate with Mojeek.

**Negative result:** no current public architecture diagram, shard/index format,
distributed query plan, replication model, capacity number, crawl budget, or
third-party audit was found. The public `mojeekbot.json` listed one IPv4 `/28`
with creation time 2025-05-14 [S4]; it is an identification list, not proof that
all crawl or serving infrastructure fits in that range.

## 3. Search API contract

### 3.1 Endpoint and authentication

**FACT (high):** Quickstart requires an active account and API key and shows:

```text
GET https://api.mojeek.com/search
  ?q=mojeek
  &api_key=...
  &lb=EN&lbb=100
  &rb=GB&rbb=10
  &fmt=json
```

The key is a query parameter rather than an Authorization header [S9].

**Contract contradiction:** the request-parameter page says listed endpoints
should be appended to `https://www.mojeek.com`, while Quickstart and scoring
docs use `https://api.mojeek.com` [S9–S11]. Treat `api.mojeek.com/search` as the
current example, but require written vendor confirmation and keep the base URL
configurable. Query-string credentials can leak through logs and diagnostics;
redaction is mandatory.

### 3.2 Parameters

| Concern | Documented controls | Important boundary |
| --- | --- | --- |
| Query | `q`; excluded words `qm`; search operators `inanchor`, `intext`, `intitle`, `inurl`, `allin*`, `site`, `since`, `before` | `q` is URL-encoded; no public max query length. [S11, S17] |
| Pagination/count | `s` start, `t` maximum results; default `t=10` | Plan pages cap results/request at 10/40/100. Public docs conflict on whether start is zero- or one-based (below). [S8, S11, S12] |
| Domain scope | `site`; comma-separated include `fi` and exclude `fe`, each max 25 domains; leading dot includes subdomains | `fi` defaults `si` to zero; exact interaction order is undocumented. [S11] |
| Time | `since`, `before`; `date=1`; `cdate=1`; `datewr=100` | Restrictions/ranking use Mojeek-recognized modified date; no accuracy warranty or freshness SLA. [S11, S17] |
| Region | `rb` ISO 3166-1 alpha-2 preference plus `rbb` 1–100 (recommended 10); `reg` restriction | `reg` description says UK/Germany/France/EU only but its valid-options text says country codes generally—ambiguous. Boost is not restriction. [S11] |
| Language | `lb` ISO 639-1 preference plus `lbb` 1–100 (recommended 100); beta `lr` restriction | No supported-language list, detected-language accuracy, or per-language coverage statistics. [S11] |
| Diversity | `clufmt` 0–5 and `si` max results/hostname; defaults recommended | Clustering algorithm and stable cluster identity are not exposed. [S11] |
| Presentation | `fmt=json|xml` (XML default); `tlen` 0–127 (default 56); `dlen` 0–511 (default 160); optional `size` | JSON must be explicitly requested. No schema/version media type. [S11] |
| Safety | `safe=0|1`, default 0 | Binary and optional; no policy taxonomy, reason code, or recall statement. [S11] |
| Scoring | all plans: `score`; custom: `fscr=1` adds detailed signals | `fscr` is documented on scoring page but absent from main request-parameter list. [S10, S11] |
| OrgSearch only | categories, category suggestions, and date facets | Not part of ordinary whole-web Search API; do not assume availability. [S11] |

**Pagination contradiction (high-confidence finding):** request docs say `s=1`
is the first result and `s=11` the second page. JSON docs show `start:1` while
commenting “first result equals start + 1” and then “1st result equals 0.” XML
docs show `start=0` for the first page [S11, S12, S18]. An adapter cannot safely
normalize pagination without an authorized contract test or vendor answer.

### 3.3 Response model

The documented JSON envelope is `response` with:

- `status`: `OK` or an error message;
- `head`: normalized query, word/stem/use/hit data, query timer, start, return
  count, exact/estimated total, internal ranking-method number, duplicate flag,
  and number excluded by clustering/domain/category filtering;
- optional category/date-facet blocks (primarily OrgSearch);
- `results[]`: `url`, `title`, query-dependent `desc`, optional size and date
  fields, domain-clustering marker `mres`, overall `score`, experimental
  relevance confidence `cfs`, and optional image metadata [S12].

Date examples include last-modified `timestamp/date`, published `pdate`, and
last-crawled `cdatetimestamp/cdate`. Main parameter docs only explain how to
request modified and crawl dates, and do not define provenance or confidence
for `pdate` [S11, S12]. The example also appears to show all optional fields at
once, so field presence must not be assumed.

**INFERENCE (high):** useful provenance exists internally (crawl date, language,
link graph, stems, scores), but the public response is a mutable search result,
not an evidence object. It lacks document/version ID, content hash, canonical
chain, immutable capture, passage offsets, snippet derivation evidence, rank
explanation, publisher/owner cluster, policy reason, and stable trace/request ID.

### 3.4 Ranking, relevance, and freshness

**FACT (high):** Mojeek says ranking is fully automated, signals are calculated
uniformly for URLs, algorithms are “largely deterministic,” human curation does
not re-rank results, and personalization is rejected [S13]. The same policy
allows deindexing/action for legal obligations, CSAM, search spam, phishing, and
malware; “no human re-ranking” is not “no content policy.”

**FACT (high):** current ranking documentation exposes or describes:

- `score`: overall match, available on every API plan, affected by boosts and
  explicitly said to be inconsistent enough that Mojeek does not recommend it
  alone for quality filtering;
- `onscr`: custom-plan keyword/content score, 0–1, without region/language
  boosts; Mojeek suggests `<0.15` as a possible removal threshold;
- `sescr`: custom-plan semantic similarity, -1–1, roughly cosine-like; absent
  when no embedding exists; Mojeek suggests `<0.5` in combination with keyword
  score rather than alone;
- `g` (“Gravity”): custom-plan, query-independent authority 0–100, similar to
  PageRank and computed over order `10^11` links;
- `nph`: number of query phrases and number found per result [S10].

Scores may change without notice [S10]. A February 2024 announcement said the
new live ranker remained fundamentally keyword-based but added semantic matching
for English-language results, then intended expansion to other languages [S19].
The current scoring page still says only pages detected as English are embedded
[S10].

**FACT (high):** freshness controls are date filtering (`since`, `before`),
date-weight ranking (`datewr=100`), returned modified date, and crawl date
[S11]. Historical posts document index growth rates, not recrawl freshness
[S6, S15]. The separate Site Search product advertises weekly/daily/on-demand
refresh, but that is not a general-web Search API SLA and is excluded here.

**Unknown:** no public recrawl percentile, index-to-query latency, deletion
latency, date extraction method, time-zone rule for boundaries, or freshness
SLA. `datewr=100` ranking by a recognized modification date is not equivalent to
ranking by verified publication time.

## 4. Language and geography

**FACT (high):** the API accepts ISO 639-1 language preference/restriction and
ISO 3166-1 alpha-2 regional preference; boost magnitudes are caller-controlled
[S11]. The quickstart deliberately supplies both English and UK preferences and
says callers should substitute their user’s language/location [S9].

**FACT (high):** semantic scoring is currently documented only for pages
detected as English [S10]. The 2018 claim to be among the largest “English and
Western Language” indexes was explicitly estimated and conceded uncertainty
[S20]. It is historical marketing context, not current coverage evidence.

**INFERENCE (high):** language and country codes describe ranking controls, not
coverage guarantees. They do not establish that all ISO languages/countries are
well represented, nor that `rb` geolocates the searcher. Curiosity should pass
an explicit language/region preference only with caller authority and should
surface when semantic signals are absent rather than silently treating lexical
and semantic scores as comparable.

**Unknowns:** supported language set, tokenizers/stemmers by language, language
detection quality, geographic classification method, EU semantics, country
boost interactions, and corpus/query quality by locale.

## 5. Privacy, content, and rights

### 5.1 Public search privacy

**FACT (high):** the privacy policy says Mojeek does not perform specific user
tracking; by default it sets no cookies without agreement. Standard logs are
kept indefinitely but do not record IP addresses: IP is replaced by a two-letter
country code. Remaining logs include time, requested page, possible referrer,
and separately browser information. Aggregate, non-personal search data may be
used to improve results [S21].

**Boundary (high):** that page is a general Mojeek privacy policy, last updated
2022-02-02. It does not specify API-key request logs, account/payment records,
query retention per customer, processor/subprocessor terms, deletion, data
residency, or whether API queries receive the same IP transformation. API use
requires an account/key and payment may use Stripe [S8, S9]. Do **not** claim the
web-search privacy policy as a complete API data-processing contract.

### 5.2 Result and underlying-content rights

**FACT (high):** Mojeek's API FAQ allows AI use on all plans, re-ranking,
advertising beside results, and combining Mojeek results with other engines or
data [S8]. It says the API returns URL, title, and query-dependent snippet; the
customer agreement grants no rights to third-party content at result URLs, and
customers extracting page content must comply with publisher copyright terms.

**FACT (high):** general Terms prohibit automated access unless the caller is an
authorized API user and prohibit scraping without prior consent; a separately
presented API agreement is therefore material [S16]. The public product page is
not a substitute for that agreement.

**RECOMMENDATION (high):** treat every API field as untrusted external data;
retain vendor/result attribution and retrieval time; never infer a license to
fetch, archive, train on, or redistribute target-page content. Review signed API
terms, retention rights, data protection, acceptable use, and termination before
any evaluation beyond public documentation.

## 6. Limits, errors, pricing, and operations

### 6.1 Public pricing on 2026-08-17

| Plan | Price | QPS | Daily requests | Results/request | Storage |
| --- | ---: | ---: | ---: | ---: | --- |
| Startup | £2 CPM, pay-as-you-go, tax excluded | 5 | 100,000 | up to 10 | FAQ says plans other than Business (and optional Enterprise) may cache for one hour only. |
| Business | £3 CPM, pay-as-you-go, tax excluded | 10 | 400,000 | up to 40 | FAQ explicitly says results may be stored. |
| Enterprise | custom | custom | “No Limit” | up to 100 | FAQ says storage is optional; contract required. |

All plans advertise AI use, web search, Focus, language/region boosts,
clustering, length controls, Safe Search, operators, and commands. Detailed
authority/keyword/semantic scores are custom-plan features. Payment uses Stripe
credit; Enterprise invoicing may be possible. A limited-query free trial is
available by contacting Mojeek [S8].

**Pricing-page ambiguity:** the visual plan cards flatten feature labels in text
extraction, while the FAQ gives the operative distinction on storage. Confirm
minimum credit, expiry/refunds, failed-request billing, overages, concurrency,
and exact Enterprise storage rights in the customer agreement.

### 6.2 Errors and resilience

**FACT (high):** the JSON/XML docs define an in-body `status` of `OK` or
`ERROR AND MESSAGE`, with `ERROR: Daily Limit Reached` as the only concrete
example [S12, S18]. The product page supplies QPS and daily ceilings [S8].

**Negative result / unknown (high):** public docs found no HTTP status mapping,
error schema, stable code list, authentication-error example, QPS response,
`Retry-After`, idempotency semantics, request ID, timeout, availability SLA,
maintenance policy, response-size ceiling, deprecation/version policy, or
support target. General Terms permit interruption or modification without prior
notice and disclaim availability/quality warranties [S16].

**RECOMMENDATION (high):** if ever evaluated, use a separately reviewed adapter
with fixed HTTPS origin, secret redaction, timeout and byte ceiling, strict
media/schema validation, bounded retries only for clearly transient failures,
per-plan token bucket, no redirects with credentials, response-body status
checking even on HTTP success, and a circuit breaker. This is a contract lesson,
not implementation authorization.

## 7. Clean-room lessons and verdict ledger

Mojeek code, index data, ranking algorithms, and IP are proprietary [S1]. This
research copies no implementation and makes no compatibility claim. Public
behavioral concepts and general search architecture are learnable; names,
branding, code, private specifications, and corpus are not project assets.

| Item | Type | Confidence | Verdict and reason |
| --- | --- | --- | --- |
| Separate crawler, index, and ranker | FACT/general pattern | High | **ADOPTED** conceptually. Clear ownership boundaries and stage-level provenance. |
| Identifiable crawler, robots/noindex policy, one-request/second published ceiling | FACT | High | **ADAPTED.** Publish identity/contact and conservative politeness; use standards-correct per-origin scheduling rather than copying one fixed rate or Mojeek's string-matching description. |
| Static HTML-first lane | FACT about Mojeek | High | **ADAPTED.** Start static-first for cost/safety, but retain a separately gated renderer and document formats rather than accepting permanent HTML-only blindness. |
| Query metadata: stems, hit counts, exactness, exclusions, timer | FACT | High | **ADAPTED.** Useful diagnostics, but expose typed, versioned semantics and avoid leaking sensitive internals. |
| Language/region as tunable boosts, not automatic personalization | FACT/design inference | High | **ADAPTED.** Caller-explicit locale fits bounded authority; always report boost provenance. |
| Lexical core plus bounded semantic signal | FACT | High | **ADAPTED.** Preserve exact/phrase retrieval; treat vectors as optional candidates/features with model/language provenance. |
| Separate overall, keyword, semantic, authority, and phrase signals | FACT | High | **ADAPTED.** Feature-class separation aids re-ranking and evaluation; Curiosity should define owned features, not emulate thresholds or formulas. |
| Domain clustering and include/exclude controls | FACT | High | **ADAPTED.** Add stable host/owner/content clusters and diversity reasons; do not copy opaque cluster behavior. |
| Crawl/modified date controls | FACT | High | **ADAPTED.** Distinguish fetched, first-seen, last-seen, publisher-claimed publication, and verified modification time. |
| Binary Safe Search | FACT | High | **REJECTED** as sufficient. Owned search needs policy version, signal/reason, appeal/takedown, and uncertainty. |
| Query-string API key | FACT | High | **REJECTED.** It increases accidental secret exposure; a provider adapter must at minimum redact it. |
| Mutable, versionless JSON/XML schema with prose ambiguities | FACT | High | **REJECTED.** Use a versioned provider-neutral contract and characterization tests. |
| Mojeek API as production foundation | RECOMMENDATION | High | **REJECTED.** Hosted corpus/ranking cannot provide owned captures, complete provenance, or autonomous policy. |
| Mojeek as benchmark/diversity source | RECOMMENDATION | Medium | **DEFERRED.** Potentially useful after signed-term/privacy review and a prepaid, explicitly authorized evaluation budget. |
| Reimplement Mojeek internals | RECOMMENDATION | High | **REJECTED.** No source/algorithm access, no need, and clean-room ownership requires independent requirements and evaluation. |

## 8. Owned-search implications for Curiosity

1. **Ownership is a chain, not an API label.** Mojeek's strongest lesson is the
   coupling of crawler identity, frontier, index, link graph, ranker, and serving
   infrastructure. Consuming its API would transfer that chain to Mojeek rather
   than make Curiosity owned.
2. **Scale is long-horizon.** Mojeek reports starting in 2004, rebuilding the
   index from scratch in 2011, reaching one billion in 2015 and nine billion in
   2025 [S1]. Its history argues for a bounded corpus and explicit usefulness
   gates, not immediate whole-web parity.
3. **Page count is not a quality gate.** Track unique hosts/owners, language,
   canonical and near-duplicate clusters, recrawl age, policy exclusions,
   retrieval recall, nDCG, source diversity, contradiction yield, and citation
   stability—not only indexed URLs.
4. **Expose evidence Mojeek's API does not.** Return immutable capture and
   document-version IDs, hashes, fetch/publish/observed times, canonical chain,
   passage coordinates, extractor/model/index versions, rank-feature classes,
   cluster membership, and coverage warnings.
5. **Preserve lexical exactness.** Mojeek's keyword-first semantic blend is a
   useful counterexample to replacing retrieval with embeddings. Dense matching
   should be language/model-qualified and should not erase exact terms,
   operators, or auditable snippets.
6. **Do not learn privacy from slogans.** Build explicit query-log fields,
   purpose and retention limits, IP handling, access controls, aggregate-release
   rules, deletion, and audit. Public-site privacy does not answer API or owned
   search operations.
7. **Keep search result authority bounded.** URLs, snippets, dates, and scores
   are untrusted hints. They cannot grant crawl permission, content rights,
   factual truth, or authority to invoke tools. Retrieval remains read-only and
   the researcher verifies primary evidence.

### Curiosity opportunities

An owned index can support curiosity better than this API by making exploration
features explicit:

- **Coverage-gap branch:** surface sparse language, source-type, time, host, or
  authority regions and propose one in-frame query to reduce the best gap.
- **Contradiction branch:** cluster claims and preserve independently sourced
  dissent rather than allowing authority score to collapse viewpoints.
- **Freshness branch:** distinguish “newly published,” “newly discovered,” and
  “changed since prior capture”; target the missing temporal state.
- **Provenance branch:** prefer primary/original documents when many results are
  syndications; expose why a candidate is likely original.
- **Lexical/semantic disagreement:** when exact and semantic candidates diverge,
  present the divergence as uncertainty and spend curiosity budget only if it
  can change the synthesis.
- **Novel-host exploration:** use bounded host/owner diversity after relevance
  gates, not novelty alone, to avoid both monopoly and random long-tail noise.

Each opportunity remains caller-framed, read-only, cost-bounded, and limited to
the declared post-synthesis curiosity pass. Search content cannot create new
authority or approve further calls.

## 9. Unknowns and pre-evaluation checks

Before any separately authorized trial, obtain written answers or contract text
for:

1. canonical endpoint, pagination base, maximum query/URL size, and precise
   response field optionality;
2. HTTP/error/retry semantics, request IDs, timeouts, availability/support, and
   version/deprecation policy;
3. failed/empty request billing, credits, QPS burst interpretation, concurrency,
   and result caps;
4. API query/IP/header logs, retention, account linkage, subprocessors, data
   residency, deletion, and model-training use;
5. storage, cache, redistribution, derived-score, benchmarking/publication, AI,
   termination, and post-termination deletion rights;
6. current index definition/count, source exclusivity, file types, rendering,
   language/country coverage, freshness distributions, and deletion latency;
7. custom-score availability and semantics, especially absent embeddings and
   score comparability across locales/queries;
8. Safe Search and content-policy behavior, notification, and legal removals;
9. whether result snippets/images carry required attribution or display rules.

An authorized comparison should pre-register query strata (navigational,
informational, long-tail, exact phrase, breaking/fresh, multilingual, regional,
adversarial/spam), judge relevance and provenance blind, record result and host
overlap, measure date correctness and latency, and spend only free-trial or
explicitly approved funds. It should not fetch result pages unless separately
permitted.

## 10. Bounded curiosity pass

After the main synthesis, remaining in-frame gaps were scored 1–5 on relevance
(R), decision value (V), novelty (N), and research cost (C; 5 = expensive). The
priority heuristic was `R + V + N - C`.

| Thread | R | V | N | C | Score | Action |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Resolve endpoint/pagination contradictions from current public docs | 5 | 5 | 4 | 1 | 13 | **Pursued.** Quickstart, request, JSON, XML, and scoring pages were cross-read; contradiction remains and is recorded. |
| Establish current semantic-language boundary | 4 | 4 | 4 | 1 | 11 | **Pursued.** Current scoring docs still say English-detected pages only, despite the 2024 intention to expand. |
| Verify API-specific privacy/customer terms | 5 | 5 | 3 | 4 | 9 | **CURIOSITY_NO_GO.** Public policy is insufficient; contract/contact or credentials would exceed authority. |
| Measure live result quality/coverage/freshness | 5 | 5 | 4 | 5 | 9 | **CURIOSITY_NO_GO.** Requires authorized key, query budget, and judged evaluation. |
| Reverse engineer ranking from result perturbations | 2 | 2 | 4 | 5 | 3 | **CURIOSITY_NO_GO.** Low decision value, potentially contrary to terms, and clean-room boundary risk. |
| Infer topology from crawler IP space/DNS | 2 | 2 | 3 | 4 | 3 | **CURIOSITY_NO_GO.** Identification data does not support topology conclusions; active probing prohibited. |
| Reconstruct historical page counts beyond current timeline | 2 | 1 | 1 | 2 | 2 | **CURIOSITY_NO_GO.** Saturated; would not change the decision. |

**Stop reason:** coverage and saturation. The best low-cost contradictions were
resolved as far as public sources allow; remaining material gaps require vendor
authority, contract access, credentials, paid calls, or active measurement.

## 11. Fact / inference / recommendation ledger

| ID | Statement | Label | Confidence | Sources |
| --- | --- | --- | --- | --- |
| L1 | Mojeek publicly claims a proprietary, mostly-C crawler/search stack and owned/managed server infrastructure. | FACT, self-attested | Medium-high | [S1] |
| L2 | Current first-party history says the index passed nine billion pages in 2025; the API advertises its full index of billions. | FACT, self-attested | Medium-high | [S1], [S2] |
| L3 | Published crawler behavior, DNS verification, IP list, robots/meta handling, and historical hardware are credible operational evidence of an independent crawl. | INFERENCE | Medium-high | [S3], [S4], [S6] |
| L4 | Public evidence does not independently audit index size, exclusivity, coverage, or quality. | FACT about evidence boundary | High | Source set as a whole |
| L5 | The own web index is documented as HTML-only and may miss predominantly JavaScript pages. | FACT | High | [S13] |
| L6 | API locale controls are boosts/restrictions, not coverage guarantees; semantic embeddings are currently documented only for English-detected pages. | FACT + INFERENCE | High | [S10], [S11] |
| L7 | Ranking is described as automated and largely deterministic, combining lexical foundations with semantic and authority signals. | FACT, self-attested | High | [S10], [S13], [S19] |
| L8 | Public freshness controls exist, but no general-web freshness SLA or accuracy guarantee was found. | FACT / negative result | High | [S11], [S17] |
| L9 | Endpoint, pagination, and some field/parameter documentation conflict. | FACT | High | [S9]–[S12], [S18] |
| L10 | Public error and operational semantics are inadequate for a production adapter without vendor confirmation and defensive boundaries. | INFERENCE | High | [S12], [S16], [S18] |
| L11 | The no-tracking privacy policy is strong for public search but insufficient to characterize authenticated API data handling. | FACT + INFERENCE | High | [S8], [S9], [S21] |
| L12 | API permissions do not convey rights to underlying page content. | FACT | High | [S8] |
| L13 | Mojeek can diversify a comparative benchmark but cannot make Curiosity's search corpus or evidence chain owned. | RECOMMENDATION | High | [S2], contract analysis |
| L14 | Adopt stage ownership, explicit locale boosts, feature separation, clustering, and temporal controls; independently specify and evaluate them. | RECOMMENDATION | High | [S3], [S10]–[S14] |
| L15 | Reject query-string keys, opaque mutable schema assumptions, binary-only safety, and page count as a quality objective. | RECOMMENDATION | High | [S8], [S9], [S11], [S12] |

## 12. Sources

All sources were accessed **2026-08-17**. Mojeek pages are primary sources for
its products and its own claims; they are not independent validation.

- **[S1]** Mojeek, “Team and Technology.”
  https://www.mojeek.com/about/technology.html
- **[S2]** Mojeek, “Mojeek Web Search API.”
  https://www.mojeek.com/services/search/web-search-api/
- **[S3]** Mojeek, “MojeekBot.” https://www.mojeek.com/bot.html
- **[S4]** Mojeek, machine-readable MojeekBot IP list.
  https://www.mojeek.com/mojeekbot.json
- **[S5]** Mojeek Blog, “Mojeek - Now 6 Billion Pages,” 2022-10-05.
  https://blog.mojeek.com/2022/10/mojeek-now-six-billion-pages.html
- **[S6]** Mojeek Blog, “100 Server Build and Install,” 2019-12-02.
  https://blog.mojeek.com/2019/12/100-server-build-and-install.html
- **[S7]** Mojeek Blog, “Mojeek Updates, August 2023,” 2023-08-31.
  https://blog.mojeek.com/2023/08/mojeek-updates.html
- **[S8]** Mojeek, “Mojeek Web Search API,” pricing and FAQ.
  https://www.mojeek.com/services/search/web-search-api/
- **[S9]** Mojeek, “Search API Quickstart.”
  https://www.mojeek.com/support/api/search/quickstart.html
- **[S10]** Mojeek, “Scorings in the Mojeek API.”
  https://www.mojeek.com/support/api/search/results_scoring.html
- **[S11]** Mojeek, “Search API Request Parameters.”
  https://www.mojeek.com/support/api/search/request_parameters.html
- **[S12]** Mojeek, “Search API JSON Response Format.”
  https://www.mojeek.com/support/api/search/json_response.html
- **[S13]** Mojeek, “Search Content Policy.”
  https://www.mojeek.com/about/content/
- **[S14]** Mojeek Blog, “No-Tracking Search, How Does it Work?,” 2021-05-04.
  https://blog.mojeek.com/2021/05/no-tracking-search-how-does-it-work.html
- **[S15]** Mojeek Blog, “Mojeek Reaches the 4 Billion Page Milestone,”
  2021-06-28. https://blog.mojeek.com/2021/06/four-billion-pages.html
- **[S16]** Mojeek, “Terms of Service.”
  https://www.mojeek.com/about/terms.html
- **[S17]** Mojeek, “Search Operators.”
  https://www.mojeek.com/support/search-operators.html
- **[S18]** Mojeek, “Search API XML Response Format.”
  https://www.mojeek.com/support/api/search/xml_response.html
- **[S19]** Mojeek Blog, “Major Algorithm Update; Adding A Semantic Element,”
  2024-02-07. https://blog.mojeek.com/2024/02/major-algorithm-update.html
- **[S20]** Mojeek Blog, “Two Billion Pages,” 2018-06-12.
  https://blog.mojeek.com/2018/06/two-billion-pages.html
- **[S21]** Mojeek, “Privacy Policy,” updated 2022-02-02.
  https://www.mojeek.com/about/privacy/
