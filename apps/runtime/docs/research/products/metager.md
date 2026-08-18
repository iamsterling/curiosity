# MetaGer: hybrid metasearch service and open project

**Research date:** 2026-08-17  
**Decision frame:** what MetaGer demonstrates for Curiosity's transition from
metasearch-backed discovery toward an owned public-web retrieval plane.  
**Status:** clean-room product/project research; not an implementation,
deployment, legal opinion, availability test, or comparative quality benchmark.

## Executive verdict

MetaGer is **operating and actively maintained**, not defunct. It is a German
nonprofit-operated, paid metasearch service whose current web focus is built
primarily from paid upstream indexes. Its production source branch was updated
on 2026-08-13, the public site is live, and its current key offering sells
search credit. The September 2024 announcement ended the ad-financed public
form, dismissed staff, and initially described only a small volunteer niche;
support and membership subsequently allowed development to continue. The
service therefore survived, but with a changed economic model [S1][S2][S3].

MetaGer is legitimately **hybrid**, but not an owned-web-index precedent at
competitive breadth. It says it uses small indexes of its own; public code and
the current science focus show a SUMA-hosted specialist `Minisucher`; and the
privacy policy says the citation database is local. Yet the current production
web-focus configuration names Brave, Serper/Google, Mojeek and a disabled
Yandex adapter, while MetaGer's own public engine page lists Brave,
Serper/Google and Mojeek. SUMA-EV's separate Nolm project aims to search the
European Open Web Index and may later be integrated into MetaGer. Neither that
external index nor Nolm should be counted as a current MetaGer-owned general
web index [S4][S5][S6][S7][S8].

**Overall verdict for Curiosity:**

- **ADOPT** its explicit engine attribution, separate organic/advertising
  lists, bounded asynchronous fan-out, partial-completion state, and anonymous
  bearer-credit lesson.
- **ADAPT** its provider adapters, staged result loading, deterministic
  fusion, per-source cost accounting, user-selectable sources/filters, and
  proxy separation into provider-neutral, typed evidence contracts.
- **REJECT** MetaGer itself, its upstream result APIs, or its AGPL code as the
  foundation of a wholly owned search plane. The service transfers queries to
  partners and inherits their coverage, ranking, contracts, jurisdictional
  exposure, prices and continuity.
- **DEFER** any code reuse, live service integration, anonymous-token protocol,
  proxy/browser capability, or Open Web Index/Nolm data use pending separate
  architecture, security, license, terms, data-rights and operational review.

Confidence is **high** on ownership, operating status, disclosed sources,
ranking shape, public code license, list pricing and the wording of published
privacy statements;
**medium** on exact live source defaults and production behavior because no
paid call was made and deployment/configuration parity was not independently
tested. Confidence in the **actual search-query retention behavior is low**
because current production source conflicts materially with the privacy and
“no logging” pages. Confidence is also low on undisclosed corpus size,
relevance quality, upstream processing locations, financial runway and
Nolm/OWI production readiness.

## 1. Frame, bounded questions, and method

### 1.1 Questions

1. Who owns and operates MetaGer, and what survived the 2024 discontinuity?
2. Which results come from upstream indexes versus SUMA-EV-controlled or local
   indexes, and is the current general web search genuinely owned?
3. How does MetaGer fan out, normalize, blend, rank, deduplicate and return
   partial results?
4. What does the public human/machine product contract expose, and what does a
   search cost?
5. What privacy boundary is actually provided, under which jurisdiction, and
   what still leaves that boundary?
6. What is open source, under which license, and what can Curiosity learn
   without copying code or inheriting obligations?
7. Which implications improve curiosity-aware retrieval without broadening
   agent authority?

### 1.2 Scope and evidence controls

Primary official sources were accessed on 2026-08-17: MetaGer and SUMA-EV
pages, the public MetaGer GitLab project/API, and source files at production
branch commit `38ead07bbb5c06661716a387d205d485829b3f14` (which merged the
2026-08-13 development head). Public source was inspected only to characterize
observable contracts and architecture. No repository was incorporated, no
credentials were requested, no paid search was called, no access control was
bypassed, and no proprietary upstream behavior was reverse-engineered.

Source comments and vendor pages establish implementation intent and offered
features, not service-level performance or comparative quality. Search-engine
index-size figures on MetaGer's page are the project's estimates “without
guarantee” and are not adopted here. `master` is evidence of production-branch
intent, not proof that every live host runs identical bytes [S2][S5].

Labels below:

- **FACT** — directly supported by cited primary evidence.
- **INFERENCE** — reasoned from facts, not independently measured.
- **RECOMMENDATION** — a proposed Curiosity choice.
- Confidence: **high**, **medium**, or **low**.

## 2. Ownership, current status, and timeline

| Finding | Label / confidence | Evidence and interpretation |
| --- | --- | --- |
| SUMA-EV operates MetaGer. | FACT / high | The privacy policy names SUMA-EV as operator and controller; the imprint identifies the registered charitable association in Hannover (VR200033) and its board [S9][S10]. |
| MetaGer originated at the University of Hannover and transferred to SUMA-EV in 2012. | FACT / high | MetaGer's official timeline says development began as a university/regional-computing-centre research project in 1996 and sponsorship transferred on 2012-10-01 while cooperation continued [S11]. |
| The 2024 event was a contraction and business-model break, not complete shutdown. | FACT / high | Yahoo ended the ad/search-results agreement without notice. MetaGer ended ad-financed search, dismissed employees and office, but retained paid-key search and volunteer operation [S1]. |
| Development recovered materially after 2024. | FACT / high | SUMA-EV said donations funded at least six months in early 2025 and memberships nearly doubled; the public production branch merged current work on 2026-08-13 [S3][S2]. |
| MetaGer is presently a maintained paid service. | FACT / high | The live site requires/markets an anonymous key, lists token packs, and advertises search plus anonymous browsing. The production source contains 2026 JSON-client and SafeBrowse work [S12][S13][S2]. |
| Long-term financial sustainability is unproven here. | UNKNOWN / low | SUMA-EV disclosed 2025 uncertainty and a membership-dependent plan, but this pass found no official audited 2026 service P&L or runway statement. Current activity is not proof of durable economics [S3]. |

**Status resolution.** Calling MetaGer “discontinued” is misleading as of the
research date. Calling it unchanged is also wrong. The accurate description is
an actively developed, nonprofit, key-funded successor to the formerly
ad-funded public service.

## 3. Source and index composition

### 3.1 Current general web path

**FACT (high):** MetaGer's current engine page lists these web sources:
Mojeek's index, Brave Search's index, and Serper returning Google-index results.
Its 2025 operator update also called Brave the most important source and Mojeek
and Serper the main complements after Bing API access ended on 2025-08-11
[S5][S14].

**FACT (high):** production `foki.json` defines web candidates as `mojeek`,
`yandex`, `brave`, and `serper_web`, with Brave as the main engine. The Yandex
adapter is statically disabled; Mojeek's constructor makes it disabled by
default; Brave and Serper carry source-level boosts of 1.2 and published
internal token costs of 0.8 and 0.2 respectively, while Mojeek declares 0.3.
Engine configuration is assembled from public parser constants plus a private
`sumas.json` containing only credentials [S6][S15].

**INFERENCE (medium):** a default web request likely uses Brave and Serper at a
raw internal cost of 1.0 token; users can opt into Mojeek, raising cost. This
matches the one-token advertised default, but exact live settings remain
unverified because no paid request was made and server-side configuration may
change [S6][S13][S15].

### 3.2 Owned/local evidence and its limit

| Evidence | What it proves | What it does **not** prove |
| --- | --- | --- |
| MetaGer's transparency statement says it uses “small indexes of our own” [S4]. | Some first-party/local indexed retrieval exists. | Size, freshness, crawl policy, general-web coverage or current contribution to default web results. |
| Current science focus contains `minism_science`, TUBdok and BASE; the public `Minisucher` adapter queries a SUMA-lab Solr endpoint and selected scholarly subcollections [S6][S7]. | A specialist SUMA-hosted mini-index path is in current production source. | That SUMA owns every underlying document/crawl, or that this engine participates in general web search. |
| Privacy policy says citation search uses a citation database on MetaGer's server and therefore need not send that query to third parties [S9]. | A local vertical database changes the privacy boundary. | That citation search is part of the web ranker or a general owned web index. |
| Legacy parser classes include `Opencrawl*` and other first-party-looking sources [S16]. | The adapter architecture can ingest specialist/owned sources. | Enabled production use; parser presence alone is not deployment evidence. |
| Nolm is being built as a separate SUMA-EV research project over the European Open Web Index; free MetaGer integration was planned [S8][S17]. | A credible transition path from pure upstream metasearch toward an open external index. | Current integration, owned crawl/index custody, production readiness, or MetaGer ownership of OWI. |

**INFERENCE (high):** MetaGer is hybrid at the service portfolio and adapter
level, but its current **general web** result plane remains upstream-dependent.
Its owned/local evidence is narrow and vertical. Nolm/OWI is an adjacent future
index consumer, not a present owned MetaGer corpus.

**Negative result:** no official source inspected supplied current page count,
WARC/capture custody, recrawl cadence, corpus license, deletion process, or
quality measurements for MetaGer's “small indexes.” No such claims are made.

## 4. Fan-out, blending, ranking, and result lifecycle

### 4.1 Reconstructed request path

The following is a clean-room architectural reading of the published
production source, not copied implementation:

```text
localized GET/POST /meta/meta.ger3
  -> key or anonymous-token authorization and predicted source cost
  -> query/focus/source/filter settings
  -> per-engine adapter configuration (public fields + private credential)
  -> cache check
  -> Redis fetch mission per uncached engine
  -> workers call upstream APIs with an operator-side user agent
  -> wait up to 6 s for configured main source(s)
  -> parse available heterogeneous responses into common Result objects
  -> source rank + lexical/URL adjustments, multiplied by engine boost
  -> merge, descending sort, blacklist/stopword validation
  -> normalized-URL duplicate collapse with engine attribution merge
  -> HTML/feed/JSON response
  -> one-hour search state enables late-engine load-more and next page
```

This path is supported by `routes/web.php`, `MetaGerSearch.php`,
`SearchEngineRegistry.php`, `Searchengine.php`, `MetaGer.php`, and `Result.php`
at the pinned production commit [S6][S15].

### 4.2 Ranking and blending mechanics

**FACT (high):** the public transparency statement gives the durable policy:
MetaGer weights upstream rankings, converts them to scores, adjusts for query
terms in URL/snippet and excessive special characters, then applies a block
list for legal, demonstrably false, extremely poor-quality or especially
dubious pages [S4].

**FACT (high):** the pinned code makes the mechanics more specific:

- an upstream position is converted to `20 - position`, bounded to positions
  1–20, and contributes `0.02 * converted_position`;
- small adjustments are computed from query occurrence in title/description
  and a URL heuristic;
- the score is multiplied by an engine-specific boost (1.2 for the current
  Brave, Mojeek and Serper adapters; 1 for Yandex);
- all available results are sorted descending, then validated;
- duplicates normalize URL scheme, leading `www`, decoding and trailing slash,
  retain one result, and append the other engines' names/links; images and
  deep-result buttons can be merged [S6][S15].

**INFERENCE (high):** this is a simple deterministic federation ranker, not an
owned relevance model. Source boosts and upstream positions dominate; lexical
checks can perturb but cannot remove inherited upstream selection bias.

**INFERENCE (medium):** because late engines cause the complete list to be
reranked, result order can change after initial rendering. The JSON load-more
contract deliberately returns the full reranked list rather than a delta
[S6]. This is a sound distributed-search contract lesson.

### 4.3 Gaps and risks

- Exact weights are source-code details, not a promised stable ranking API.
- URL deduplication is not content/canonical/owner deduplication; mirrors and
  syndication can remain falsely diverse.
- Engine attribution survives dedupe, but upstream crawl/document lineage,
  capture time, content hash and rank-feature explanation do not.
- Global and personal blocklists introduce editorial policy, yet the public
  transparency page does not publish the actual list or appeal/version model.
- The inspected formula contains old/unclear URL-heuristic code. No relevance
  benchmark or ablation study was found, so effectiveness is **unknown**.
- “Diverse” means multiple result suppliers, not measured viewpoint, owner,
  language, temporal or evidence-class diversity.

## 5. Privacy, trust boundary, and jurisdiction

### 5.1 What the operator promises

**FACT (high):** for web search, MetaGer says it does not save or share IP
address or user agent. It sends the search query to partners, retains received
results including the search term for a few hours for display, stores some
preferences in non-personal statistics, and does not profile. Optional address
bar suggestions create a SHA-1-hashed key from IP, user agent and language;
that feature is disabled by default [S9].

**CONTRADICTION / UNKNOWN (high that the contradiction exists; low on live
retention):** the pinned production source calls `QueryLogger::createLog()`
when building every response. That logger records the full query, UTC time,
referrer, duration, focus and locale to Redis, then inserts them into a
`logs_partitioned` database. The same source documents a restricted Logs API
that gives NDA-authorized researchers historical timestamp/query rows and
withholds only the newest five minutes. The scheduled `logs:truncate` command
does not truncate this query table, and this pass found no retention/deletion
job for it [S6][S29]. This conflicts with the key page's broad “no logging”
claim and is difficult to reconcile with the privacy policy's “few hours”
description [S9][S12]. Production-branch code does not prove live deployment,
but neither may the marketing claim be accepted as verified behavior. Exact
retention, purpose, access population, deployment flags and policy accuracy are
unresolved and require operator clarification.

**FACT (high):** SUMA-EV administers the services on hardware rented from
Hetzner. SUMA-EV additionally states that its servers are exclusively in
Germany. The controller is a German registered association, data-subject
rights are described under GDPR, and complaints are directed to Lower
Saxony's data-protection authority [S9][S10][S18].

**FACT (high):** the service offers a Tor onion endpoint and an “Open
Anonymously” capability. Current help describes an isolated server-side
browser, with fallback to a simpler proxy, and claims session deletion at end.
These protect the user's network identity from target sites, but place browsing
content inside MetaGer-operated infrastructure [S19][S20].

**FACT (high):** a normal paid key is a reusable pseudonymous bearer secret.
The browser extension/app can instead obtain blind-signed, locally generated
one-time anonymous tokens so a search cannot be linked back to the funding key
by the described protocol [S21].

### 5.2 Boundary analysis

**INFERENCE (high):** MetaGer meaningfully reduces direct exposure: upstream
engines see MetaGer infrastructure rather than the user's IP, and target sites
can see the proxy/browser rather than the user. It does **not** make a query
local. Search terms are explicitly sent to Brave, Mojeek, Serper or other
selected partners; Serper in turn fronts Google results [S5][S9].

**INFERENCE (high):** “German jurisdiction” accurately describes SUMA-EV and
its disclosed hosting, not the entire processing chain. Brave is listed in San
Francisco, Mojeek in the UK, and Serper is an intermediary for Google-index
results; the inspected official material does not disclose each upstream
processing location, retention policy or onward transfer. Those are
jurisdictional **unknowns**, not cured by German front-end hosting [S5].

**RECOMMENDATION (high):** Curiosity should separate four privacy claims:
caller-to-gateway, gateway-to-provider, result browsing, and local telemetry.
Never summarize an intermediary's privacy as end-to-end anonymity. Treat
queries as potentially sensitive disclosures to every selected provider, and
require retention controls to be verified from deployed configuration and
deletion evidence rather than marketing language alone.

## 6. Product and API contract

### 6.1 Human-facing contract

- Search foci: Web, Images and News are exposed on the current result UI;
  source also defines Products and Science [S6][S22].
- Users can choose engines, locale/language, safe search and freshness where
  sources support them; site restriction, negative words, `-url:` and phrase
  syntax are documented [S22][S23].
- Personal domain/TLD blacklist settings and “search this domain” are exposed
  [S22].
- Results contain title, URL, snippet, upstream-engine labels, optional image,
  date/deep links, and direct/new-tab/anonymous-open actions [S22].
- OpenSearch discovery advertises a GET template with `eingabe={searchTerms}`
  plus a suggestion endpoint [S24].

### 6.2 Machine-facing search contract

**FACT (high):** current production source implements GET or POST
`/meta/meta.ger3` with `out=json`; this was added in July 2026 and versioned as
schema 1. Initial JSON contains:

- envelope: `version`, `query`, `focus`, `searchUid`, response-local
  `resultCount`, `nextPage`, `searchTime`, `warnings`, `errors`;
- separate `results` and `ads` arrays;
- result: `title`, `link`, `displayLink`, short and long descriptions,
  `proxyLink`, engine name/link objects, optional image/proxy/thumbnail
  metadata, ISO date, host, domain, partner-shop flag, price and sitelinks;
- load-more: full reranked result list plus `finished` and per-engine completion
  state; the search state is held for up to one hour [S6][S25].

**FACT (high):** response formats also include HTML fragments/pages, RSS 2.0,
Atom-like `api`/`atom10`, and result count. JSON replaces malformed UTF-8,
keeps ads distinct, and uses a curated projection rather than exposing ranking
internals [S6].

**INFERENCE (medium):** `out=json` is a real current app/client contract but
not yet a conventional developer product. No official OpenAPI, SDK, public SLA,
rate-limit contract, independent API documentation, or machine-client pricing
page was found. Authentication redirects and browser-compatible query/header/
cookie settings also make it less clean than a dedicated REST boundary.

### 6.3 Availability and economics

**FACT (high):** published retail packs are linear: 500/1,000/2,000/3,000/
4,000/6,000 tokens cost €5/€10/€20/€30/€40/€60. A default ad-free web search
costs one token; tokens are described as valid for two years and unused credit
has a 30-day refund window. Cash is offered alongside payment providers
[S13]. This is €0.01 per default search before refund/tax interpretation.

**FACT (high):** actual cost is source-dependent. Public source sums enabled
engines' fractional costs and floors the charge at one token. The pricing page
says most revenue flows to queried search services, with personnel, servers,
payment fees and tax also covered [S13][S15].

**INFERENCE (high):** the token model makes marginal upstream cost visible and
lets users choose coverage/cost, but it demonstrates supplier dependence rather
than owned-search economics. The 2024 Yahoo termination and 2025 Bing API exit
are direct continuity evidence [S1][S14].

**UNKNOWN:** no official uptime SLA, historical availability series, p95
latency, quota guarantee, bulk/agent terms, or current production capacity was
found. The source waits up to six seconds for main engines and supports late
loading, but code timeout is not an SLA [S6].

## 7. Open project and licensing boundary

**FACT (high):** the public project is active and names `development` as its
default branch; `master` merged that branch on 2026-08-13. No repository tags
were returned by the official API [S2].

**FACT (high):** MetaGer-owned code, unless otherwise noted, is **GNU AGPL v3**.
The repository's raw `LICENSE` explicitly says so and includes the AGPL text;
the README says the same. Laravel and Bootstrap entries are separately MIT
licensed dependencies. GitLab's generic UI/search metadata has at times called
the project MIT, but that conflicts with the raw license and README and must
not be used to relicense the project [S26][S27].

**FACT (high):** the project has a non-exclusive contributor agreement granting
SUMA-EV broad copyright and patent rights while committing it to FSF-free and
OSI-approved licensing. The README says external code changes are not presently
accepted, though issues may be opened [S27][S28].

**INFERENCE (high):** public source does not make a turnkey independent search
service. API credentials are intentionally private; upstream contracts and
credits are separate; the software is a metasearch orchestrator, not its
suppliers' indexes; and the repository has no versioned release tags [S2][S15].

### Clean-room rule for Curiosity

1. Use official pages and public source only as behavior/architecture evidence.
2. Do not copy MetaGer code, fixtures, styles, ranking constants, configuration
   or protocol implementation into Curiosity.
3. Record independently written requirements: bounded fan-out, source
   attribution, partial completion, cost ledger and normalized evidence.
4. If reuse is ever proposed, perform separate AGPL compatibility, notices,
   Corresponding Source/network-use, dependency, trademark, upstream-terms and
   contribution-history review. This report is not that review.
5. Do not imply that an AGPL orchestrator licenses third-party indexes or
   returned page content. Code license, API contract, index rights and document
   rights are separate.

## 8. Architectural lessons and Curiosity implications

### 8.1 Adopt or adapt

| Lesson | Curiosity verdict | Rationale |
| --- | --- | --- |
| Per-provider adapters behind one common result type | **ADAPT** | Preserve provider-neutral ABI while isolating supplier-specific query/filter/parse behavior. |
| Asynchronous fan-out with a main-source deadline and late completion | **ADOPT concept** | Bounds initial latency while exposing partial state; return complete reranked snapshots, not ambiguous deltas. |
| Engine attribution survives dedupe | **ADOPT, strengthen** | Keep every origin, request/capture identifier and transformation; add content/canonical/owner clustering. |
| Separate ads from organic results | **ADOPT** | Different trust and policy classes must never be indistinguishable entries. |
| Cost attached to enabled provider and paid after uncached use | **ADAPT** | Maintain estimated/actual cost per branch and provider, including cache status and failures. |
| One-time anonymous bearer tokens | **LEARN; DEFER** | Strong unlinkability concept, but cryptographic/auth integration needs dedicated threat model and review. |
| User-selectable engines and filter capability negotiation | **ADAPT** | Model source capability explicitly; do not silently pretend every source honored freshness, locale or safe search. |
| Public deterministic ranking explanation | **ADOPT principle, reject formula** | Explain feature classes and policy, but independently design and evaluate ranking. |
| Server-side anonymous browser/proxy | **DEFER** | Useful boundary but high SSRF/browser-isolation/abuse/cost risk and outside search-core scope. |

### 8.2 Reject as owned-search foundation

- Upstream result resale/aggregation remains contract- and supplier-bound.
- Upstream ranks are not independent evidence of relevance or diversity.
- A small local vertical index does not establish crawl-to-citation custody for
  general web results.
- `searchUid` and temporary result cache are session mechanics, not immutable
  document/version provenance.
- AGPL source availability does not transfer index, credentials, supplier
  agreements, relevance judgments, or operations.
- A blocklist without reason/version/appeal provenance is insufficient for an
  auditable owned retrieval plane.

### 8.3 Curiosity-specific contract implications

**RECOMMENDATION (high):** a Curiosity search result should exceed MetaGer's
display contract with:

- branch/query intent and bounded budget;
- provider, source class (owned crawl, external API, local vertical), corpus
  and adapter version;
- immutable document/capture/version ID, fetch and observed timestamps,
  content hash and citation passage anchor;
- provider rank, owned rank-stage trace by feature **class**, and selection or
  exclusion reason without leaking exploitable internals;
- canonical/content/publisher-owner cluster and diversity contribution;
- per-provider status, timeout, coverage warning, estimated/actual cost and
  cache provenance;
- explicit untrusted-data marker and policy/filter decisions;
- contradiction/uncertainty links suitable for the bounded curiosity pass.

The agent should receive only the bounded normalized contract. Provider source
selection, pagination, proxy browsing, account/credit state and index mutation
remain outside agent authority.

## 9. Fact / inference / recommendation ledger

| ID | Claim | Type | Confidence | Check / falsifier | Verdict |
| --- | --- | --- | --- | --- | --- |
| L1 | SUMA-EV is the current German nonprofit operator/controller. | FACT | High | Imprint, privacy controller, registry identity [S9][S10]. | ADOPT context |
| L2 | MetaGer is live and actively maintained after its 2024 contraction. | FACT | High | Live product/pricing plus 2026 production merge [S2][S12][S13]. | ADOPT finding |
| L3 | Current general web results primarily depend on Brave and Serper/Google, with Mojeek optional/complementary. | FACT + INFERENCE | Medium | Public engine list, foki/adapters; a paid response/settings export could verify live defaults [S5][S6][S15]. | REJECT foundation |
| L4 | MetaGer has some local/owned specialist index capability, not a competitive owned general-web corpus. | FACT + INFERENCE | High | Transparency, science focus and local citation DB; falsified by official current owned-corpus evidence [S4][S6][S7][S9]. | ADAPT vertical lesson |
| L5 | Nolm/OWI is separate and not current MetaGer-owned index evidence. | FACT | High | SUMA-EV calls Nolm independent and OWI-based; 2025 update says research/internally tested [S8][S17]. | DEFER |
| L6 | Fusion is deterministic and heavily inherits upstream position/source weighting. | FACT + INFERENCE | High | Transparency and pinned `Result`/`MetaGer` code [S4][S6]. | ADAPT principle, reject formula |
| L7 | Query privacy is intermediary privacy, not local/end-to-end privacy. | FACT + INFERENCE | High | Privacy policy explicitly sends query to partners [S9]. | ADOPT boundary model |
| L8 | Hosting/controller are German; entire provider chain jurisdiction is not established. | FACT + UNKNOWN | High/Low | German hosting/operator evidence; upstream subprocessors/locations absent [S5][S9][S18]. | Require disclosure |
| L9 | A default search retails for €0.01 and token cost varies by enabled sources. | FACT | High | Pricing and source cost aggregation [S13][S15]. | ADAPT cost ledger |
| L10 | JSON schema v1 is a current production-source client contract, not a documented SLA-backed public developer API. | FACT + INFERENCE | High/Medium | Production commit and absent official API docs/OpenAPI [S6][S25]. | ADAPT schema ideas |
| L11 | MetaGer-owned code is AGPL-3.0 unless otherwise noted. | FACT | High | Raw LICENSE and README override misleading generic metadata [S26][S27]. | REJECT code import |
| L12 | Async main-engine wait plus late full rerank is a useful bounded federation pattern. | RECOMMENDATION | High | Independently specify and test deadline, stable snapshot semantics and failures. | ADOPT concept |
| L13 | Current relevance, diversity, uptime and financial durability cannot be inferred from openness/activity. | UNKNOWN | High | Requires judged benchmark, telemetry/SLA and audited current economics. | DEFER claims |
| L14 | Published “no logging”/few-hour language conflicts with production-source historical full-query logging and restricted research access. | FACT + UNKNOWN | High/Low | Source logger/database/API versus privacy/product text; resolve with operator and deployed retention evidence [S9][S12][S29]. | REJECT unqualified privacy claim |

## 10. Unknowns and required follow-up checks

1. **Live source/default parity:** obtain an operator-published production
   settings snapshot or separately authorized paid observation; do not infer it
   forever from source.
2. **Owned-index inventory:** corpus names, ownership/controller, crawl source,
   page/document counts, languages, refresh cadence, robots/removal policy,
   capture/version retention and current traffic share.
3. **Provider privacy:** contracts/subprocessors, processing regions, query
   retention, abuse logs, training use and government-request handling for
   each selected upstream.
4. **API stability:** formal authentication, parameter/schema compatibility,
   quotas, retries, errors, pagination expiry, rate limits, ToS, agent/bulk use
   and SLA.
5. **Quality:** judged relevance, freshness, duplicate/owner diversity,
   multilingual coverage, censorship/blocklist errors and late-rerank churn.
6. **Economics:** token-to-provider reconciliation, cache savings, refund/tax
   treatment, per-focus/source margins, current staffing and runway.
7. **Nolm/OWI:** current public availability, index license/data rights,
   provenance granularity, freshness, query API, funding after 2026, and actual
   MetaGer integration status.
8. **Operational/privacy verification:** production/source parity, retention
   enforcement (especially the full-query Logs API), researcher access,
   proxy/browser deletion, blind-token implementation audit and incident
   history.

## 11. Bounded curiosity pass

Scoring is 1 (low) to 5 (high). Pursuit threshold favored high relevance/value
with bounded cost. The caller's declared frame authorized this one pass.

| Thread | Relevance | Value | Novelty | Cost | Outcome |
| --- | ---: | ---: | ---: | ---: | --- |
| Resolve “ended in 2024” versus current operation | 5 | 5 | 4 | 1 | **Pursued:** live pricing, 2025 recovery and 2026 production commits resolve the contradiction. |
| Determine whether “small own indexes” reach default web | 5 | 5 | 5 | 2 | **Pursued:** current foci/adapters separate upstream web from specialist science/local citation paths. |
| Resolve licensing metadata conflict | 5 | 5 | 3 | 1 | **Pursued:** raw LICENSE and README establish AGPL-3.0, not MIT for MetaGer-owned code. |
| Reconcile “no logging” with source behavior | 5 | 5 | 5 | 2 | **Pursued:** production source logs full queries and exposes historical query rows to NDA-authorized research; live retention remains unresolved. |
| Verify exact live ranking/results with a paid key | 4 | 3 | 2 | 5 | `CURIOSITY_NO_GO`: prohibited paid call/credential use and unnecessary for architecture verdict. |
| Audit blind-signature cryptography or anonymous browser | 3 | 4 | 4 | 5 | `CURIOSITY_NO_GO`: separate security-review frame required; no implementation decision here. |
| Enumerate every historical parser/branch | 2 | 2 | 2 | 4 | `CURIOSITY_NO_GO`: parser presence does not prove deployment; current foci reached saturation. |
| Reverse engineer proprietary upstream ranking | 1 | 1 | 2 | 5 | `CURIOSITY_NO_GO`: outside access/license boundaries and irrelevant to owned design. |
| Establish jurisdiction-by-jurisdiction legality | 4 | 4 | 3 | 5 | `CURIOSITY_NO_GO`: counsel task; report only disclosed controller/hosting and unknown provider chain. |

**Stop condition:** coverage and saturation. Every requested category has
primary-source evidence or an explicit unknown; further low-cost official
source inspection repeated the same supplier-dependent architecture without
changing the verdict.

## Sources

All sources accessed 2026-08-17. Official primary sources only.

- **[S1]** SUMA-EV, “An era comes to an end” (2024-09-10):
  https://suma-ev.de/en/eine-aera-geht-zu-ende/
- **[S2]** MetaGer GitLab project/branches/commits API (public project 2):
  https://gitlab.metager.de/api/v4/projects/2 and
  https://gitlab.metager.de/open-source/MetaGer/-/commit/38ead07bbb5c06661716a387d205d485829b3f14
- **[S3]** SUMA-EV, “2025 at SUMA-EV: an Update and an Outlook”:
  https://suma-ev.de/en/2025-im-suma-ev-ein-update-und-ein-ausblick/
- **[S4]** MetaGer transparency statement:
  https://metager.org/en-EN/transparency
- **[S5]** MetaGer, “About our search engines”:
  https://metager.org/en-EN/search-engine
- **[S6]** MetaGer production source at `38ead07b`: `config/foki.json`,
  `app/MetaGer.php`, `app/Models/Result.php`, `routes/web.php`, and
  `app/Http/Controllers/MetaGerSearch.php`:
  https://gitlab.metager.de/open-source/MetaGer/-/tree/38ead07bbb5c06661716a387d205d485829b3f14/metager
- **[S7]** MetaGer production `Minisucher.php` and current science focus:
  https://gitlab.metager.de/open-source/MetaGer/-/blob/38ead07bbb5c06661716a387d205d485829b3f14/metager/app/Models/parserSkripte/Minisucher.php
- **[S8]** SUMA-EV, Nolm announcement (2025-04-15 release, posted 2025-04-30):
  https://suma-ev.de/en/pressemitteilung-vom-15-4-2025-metager-betreiber-praesentieren-die-entwicklung-einer-suchmaschine-auf-basis-des-open-web-index/
- **[S9]** MetaGer privacy policy, version dated 2026-07-02:
  https://metager.org/en-EN/datenschutz
- **[S10]** MetaGer site notice/imprint:
  https://metager.org/en-EN/impressum
- **[S11]** MetaGer official About/timeline:
  https://metager.org/en-EN/about
- **[S12]** MetaGer live start page:
  https://metager.org/en-EN
- **[S13]** MetaGer Key pricing:
  https://metager.org/en-EN/keys/cost
- **[S14]** SUMA-EV, “Soon no more access to the Bing index” (2025-06-02):
  https://suma-ev.de/en/bald-kein-zugriff-mehr-auf-den-bing-index-was-bedeutet-das-fuer-metager/
- **[S15]** MetaGer production `SearchEngineRegistry`, `Searchengines`,
  `Searchengine`, Brave/Mojeek/Serper/Yandex adapters and example secrets:
  https://gitlab.metager.de/open-source/MetaGer/-/tree/38ead07bbb5c06661716a387d205d485829b3f14/metager/app/Models
- **[S16]** MetaGer parser directory at pinned production commit:
  https://gitlab.metager.de/open-source/MetaGer/-/tree/38ead07bbb5c06661716a387d205d485829b3f14/metager/app/Models/parserSkripte
- **[S17]** SUMA-EV, Nolm update (2025-10-21):
  https://suma-ev.de/en/ein-kleines-update-und-ein-ausblick-nolm/
- **[S18]** SUMA-EV, “MetaGer & MetaGer Maps”:
  https://suma-ev.de/en/aktivitaeten/metager/
- **[S19]** MetaGer Tor hidden-service page:
  https://metager.org/en-EN/tor
- **[S20]** MetaGer privacy/security help (Tor and anonymous browser):
  https://metager.org/en-EN/hilfe/datensicherheit
- **[S21]** MetaGer anonymous-token design:
  https://metager.org/en-EN/keys/help/anonymous-token
- **[S22]** MetaGer main-pages/results/settings help:
  https://metager.org/en-EN/hilfe/hauptseiten
- **[S23]** MetaGer search-functions help:
  https://metager.org/en-EN/hilfe/funktionen
- **[S24]** MetaGer OpenSearch description:
  https://metager.org/plugins/opensearch.xml
- **[S25]** MetaGer JSON API commits (2026-07-29 and 2026-08-05):
  https://gitlab.metager.de/open-source/MetaGer/-/commit/4010ed2ec66a13532fe3ecb7116a21edf6f2c18a and
  https://gitlab.metager.de/open-source/MetaGer/-/commit/ab6ef7a1f17baa10e42e1e7291a1ec72004fe2ad
- **[S26]** MetaGer raw LICENSE at pinned production commit:
  https://gitlab.metager.de/open-source/MetaGer/-/raw/38ead07bbb5c06661716a387d205d485829b3f14/LICENSE
- **[S27]** MetaGer README at pinned production commit:
  https://gitlab.metager.de/open-source/MetaGer/-/blob/38ead07bbb5c06661716a387d205d485829b3f14/readme.md
- **[S28]** MetaGer contributor agreement:
  https://gitlab.metager.de/open-source/MetaGer/-/blob/38ead07bbb5c06661716a387d205d485829b3f14/contributor%20license%20agreement.md
- **[S29]** MetaGer production query logging and restricted Logs API:
  https://gitlab.metager.de/open-source/MetaGer/-/blob/38ead07bbb5c06661716a387d205d485829b3f14/metager/app/QueryLogger.php and
  https://gitlab.metager.de/open-source/MetaGer/-/blob/38ead07bbb5c06661716a387d205d485829b3f14/metager/app/Models/Logs/logs.md
