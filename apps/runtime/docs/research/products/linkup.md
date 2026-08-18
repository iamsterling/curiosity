# Linkup: clean-room search and research API study

**Research date / source access date:** 2026-08-17  
**Decision:** what Linkup's public contracts reveal about bounded web retrieval,
page extraction, and agentic research for Curiosity.  
**Scope:** current Search, Fetch, Research, Tasks, and Extract endpoints; the
hosted MCP surface only where it clarifies those products; and public evidence
about crawl/index ownership, freshness, safety, privacy, errors, and pricing.  
**Status:** research and recommendations only—not implementation, a benchmark,
legal advice, or a production/provider selection.

## 1. Decision frame and method

### Bounded sub-questions

1. What products are currently documented, which are beta, and what are their
   observable request, response, latency, cost, and failure contracts?
2. How do retrieval depth, source/date controls, page extraction, synthesis,
   citations, and structured outputs differ?
3. What primary evidence supports Linkup owning its crawler/index and controlling
   freshness, and what remains unproved?
4. Which clean-room patterns should Curiosity adopt, adapt, reject, or defer?

**Method and boundaries.** Only public, official Linkup documentation, OpenAPI
renderings, product/security pages, changelog, status page, and official GitHub
organization results were used. No account, credential, paid/free API call,
package installation, access-control bypass, private interface, proprietary
content, or implementation inspection was used. Marketing and self-attested
security/quality statements are attributed, not independently validated. Public
behavior was not contract-tested. All sources in the ledger were accessed
2026-08-17.

Labels:

- **FACT** — directly stated by a cited primary source.
- **INFERENCE** — bounded architecture interpretation, not a claim about hidden
  implementation.
- **RECOMMENDATION** — a Curiosity design consequence.
- **UNKNOWN** — not established in reviewed official sources.
- Confidence is **high**, **medium**, or **low**.

## 2. Executive verdict

**RECOMMENDATION — ADAPT the contracts; REJECT Linkup as the foundation of an
owned retrieval stack (high confidence).** Linkup exposes a useful separation:

```text
Search   = query -> ranked snippets, sourced answer, or schema-shaped answer
Fetch    = known public URL -> extracted Markdown/raw content/images
Research = long-running multi-source investigation -> cited answer/JSON
Tasks    = asynchronous batch transport around direct endpoint calls
Extract  = seed page + row description -> downloadable NDJSON (closed beta)
```

The strongest transferable patterns are explicit latency/coverage modes,
separate discovery and known-URL retrieval, source/date constraints, bounded
result counts, schema-constrained derived output, durable async states, typed
errors, and visible per-mode prices. [S1–S8]

The largest gaps are equally important. Search returns mutable URLs and excerpts,
not immutable document versions, content hashes, retrieval/index timestamps,
rank scores, claim-to-passage mappings, or a reproducible search snapshot.
Research citations remain generated-answer provenance rather than complete data
lineage. Linkup says it operates its own index and processing stack, but publishes
no corpus inventory, general crawl cadence, freshness SLA, ranking design,
candidate depths, or proof that all results come exclusively from first-party
crawling. [S2][S10–S12]

For Curiosity, Linkup is therefore a potentially useful **hosted adapter**, not
owned infrastructure or an evidentiary authority. All returned text and model
output must remain untrusted external data; Curiosity must impose its own byte,
item, time, spend, loop, host, and provenance bounds.

## 3. Current product surface and status

| Surface | Current official status | Execution | Core output |
|---|---|---|---|
| Search | Public; `fast` depth is beta | synchronous, <1 s to ~30 s by depth | ranked results, sourced answer, or structured JSON |
| Fetch | Public; `pro` mode released August 2026 | synchronous, documented around ~1 s | clean Markdown; optional raw content and image URLs |
| Research | **Beta** | asynchronous, ~2–20 min | sourced answer or structured JSON |
| Tasks | Public wrapper | asynchronous | up to 100 mixed task envelopes and endpoint-native outputs |
| Extract | **Closed beta**, request access | asynchronous, variable | 24-hour download URL for NDJSON rows |
| MCP | Hosted and local integration surface | mixed | exposes Search, Fetch, start/get Research; narrower than raw API |

**FACT (high):** Linkup's current introduction calls these five API endpoints
and explicitly labels Research beta and Extract closed beta. The status page
separately monitored Search API, Fetch API, Application, and MCP Server; at the
access snapshot all four were operational. Research, Tasks, and Extract were not
separate public status components, so their independent health was not
established. [S1][S19]

**FACT (high):** the MCP wrapper is intentionally narrower than the raw API:
MCP Search exposes standard/deep but not beta fast; MCP Research fixes output to
`sourcedAnswer`; and separate start/get tools implement Research polling. [S24]

**FACT/CONTRADICTION (high):** the Tasks overview says Tasks wraps Search,
Fetch, and Research and its accepted type table lists only those three. The
central pricing page says a task can be billed like Search, Fetch, Research,
**or Extract**. Do not assume Extract-in-Tasks works without a contract check.
[S6][S8]

**FACT (high):** official JavaScript and Python SDK repositories are publicly
available under Linkup's GitHub organization and advertise MIT licenses. This
licenses those SDK repositories, not Linkup's hosted crawler, index, models,
service, or returned third-party web content. [S20]

## 4. Search: retrieval depths, controls, and output

### 4.1 Depth is a pipeline/compute selector

| `depth` | Documented behavior | Vendor latency | Important boundary |
|---|---|---:|---|
| `fast` (beta) | query passed as-is to Linkup's index; no LLM, reinterpretation, scraping, or chaining | <1 s | keyword-shaped retrieval only |
| `standard` | one agentic iteration; query interpretation; parallel sub-searches; can scrape one URL supplied in the query | 1–3 s | no sequential dependency across steps |
| `deep` | multiple agentic search/scrape/evaluation iterations; docs for agents say up to 10 | 5–30 s | supports several URLs and search→scrape chains |

**FACT (high):** these are required Search enum values. Standard and deep may
interpret behavioral instructions; fast does not. The API itself exposes no
caller-selected iteration count, query count, scrape count, token budget,
wall-clock deadline, or stopping rule. [S2][S3]

**INFERENCE (high):** `depth` selects qualitatively different execution graphs,
not a portable relevance setting. Fast is direct indexed retrieval; standard
adds one planning/evaluation layer; deep adds a bounded-but-opaque iterative
agent. Exact models, branches, candidate pools, evaluation criteria, and early
stop behavior are unknown.

**RECOMMENDATION (high):** Curiosity should map provider depth only in a Linkup
adapter. Its provider-neutral request should state permitted operations and hard
budgets: candidate queries, URLs fetched, iterations, parallelism, elapsed time,
returned bytes/tokens, and spend. “Deep” is not a sufficient safety boundary.

### 4.2 Source, date, image, and result controls

Search accepts:

- `includeDomains`: OpenAPI maximum 100 domains;
- `excludeDomains`: exclusion list, but the current OpenAPI shows no `maxItems`;
- `fromDate` / `toDate`: inclusive-looking publication/date-window controls in
  `YYYY-MM-DD`, later than 1970-01-01 and ordered when both are supplied;
- `maxResults`: positive number, documented as an upper bound on returned
  results but with no public maximum in the OpenAPI;
- `includeImages`: image results when requested;
- a natural-language `q`; required with `depth` and `outputType`. [S3]

**FACT/CONTRADICTION (high):** the dedicated filtering tutorial says both
include and exclude accept up to **50 URLs/domains**. The newer OpenAPI says
include accepts **100 domains** and does not schema-cap exclude. The Search
overview says up to 100, while current best-practices text calls exclusion
**unlimited**. Use 50 as the conservative portability ceiling until authenticated
validation or support confirmation; preserve the requested and effective
filters. [S2–S4][S9]

**FACT (medium):** filtering guidance warns that a page's metadata publication
date may differ from its latest update date, making date filtering unstable.
There is no exposed language, country/market, location, content type, safety
level, recency-sort, freshness boost, crawl-age, or index-observation-time
control in the current Search request. [S4][S9]

**RECOMMENDATION (high):** treat date filters as predicates over provider-derived
page metadata, not proof of freshness. Curiosity needs distinct fields for
publication time, first/last observed time, fetch time, index time, and derived
artifact time, each with origin and confidence.

### 4.3 Output types and provenance limits

| `outputType` | Response | Provenance value | Limitation |
|---|---|---|---|
| `searchResults` | `results[]` of text `{type,name,url,content,favicon}` and optional images | source-local retrieved snippets | no score, timestamp, hash, version, or explanation |
| `sourcedAnswer` | generated `answer` plus `sources[]` `{name,url,snippet,favicon}` | answer-level source list; optional inline citations | source list does not prove every claim is supported |
| `structured` | caller-schema-shaped object | optional `includeSources` wraps `data` plus result sources | schema conformance is not factual validation |

**FACT (high):** `includeInlineCitations` defaults false and is relevant only to
sourced answers. `includeSources` defaults false and changes structured output
to `{data, sources}`. `structuredOutputSchema` must describe an object root.
`maxResults` applies to returned results; documentation does not establish it as
a cap on every internal candidate/search/scrape. [S2][S3][S21]

**UNKNOWN:** no public contract establishes stable ordering across calls,
pagination, a continuation token, numeric relevance/authority/freshness scores,
query rewrites, complete internal source set, canonical URL, crawl/fetch time,
content digest, document version, extractor version, source license, robots
decision, or claim-level passage offsets.

**RECOMMENDATION (high):** use `searchResults` for downstream Curiosity
reasoning and preserve provider-native order without inventing scores. Treat
`sourcedAnswer` and `structured` as derived artifacts. Re-fetch and retain lawful,
bounded evidence with hashes/offsets before elevating a generated claim to a
verified state.

## 5. Fetch and Extract: known-URL content acquisition

### 5.1 Fetch

**FACT (high):** `POST /v1/fetch` accepts one HTTP/HTTPS URL. It supports HTML
and PDF and always returns clean Markdown plus a favicon. Optional controls are:

- `mode: standard | pro` (`standard` default; `pro` is higher-success and more
  expensive for hard-to-retrieve pages);
- `renderJs` (default false);
- `includeRawContent` for raw content plus `contentType`;
- deprecated `includeRawHtml`;
- `extractImages` for `{alt,url}` image references. [S5][S22]

Fetch does not authenticate to targets. It returns what an anonymous visitor can
see. HTML above 20 MB, PDF above 100 MB, unsupported binary/media, unreachable
targets, and timeouts are documented 400-class cases. [S5][S7]

**FACT (high):** Fetch prices are:

| Mode | no JS | JS rendered |
|---|---:|---:|
| `standard` | $0.001 | $0.005 |
| `pro` | $0.005 | $0.01 |

`pro` and JavaScript rendering are independent switches. [S5][S8][S18]

**INFERENCE (medium):** Fetch is an on-demand acquisition/extraction path
separate from fast indexed retrieval. Public sources do not establish whether a
fetched page updates the shared search index, what cache exists, or whether
`standard` and `pro` use the same fetching infrastructure.

**FACT/PRODUCT EXCEPTION (high):** Linkup's best-practices page says Fetch does
not retrieve LinkedIn content beyond the anonymous login-wall view, while Search
can extract profiles, company pages, posts, and comments when given the exact
LinkedIn URL; deep can first discover that URL. The public material does not
explain acquisition provenance, field completeness, permitted jurisdictions, or
how long such indexed data persists. Curiosity must treat this as a specialized
Search capability requiring separate legal, privacy, freshness, and evidence
review—not as ordinary public-page Fetch. [S4]

**UNKNOWN / security check:** reviewed public contracts do not document URL
redirect limits, DNS rebinding defenses, private/link-local network blocking,
maximum redirect bytes, decompression bounds, script isolation, or an explicit
fetch timeout. Curiosity must not delegate its SSRF and resource-safety policy to
the absence of documentation.

### 5.2 Extract (closed beta)

**FACT (high):** Extract starts from one seed URL and a natural-language row
description. An optional JSON Schema pins one-row shape; `verifyUrls` checks
extracted URLs for reachability. It runs asynchronously and, on completion,
returns `creditsUsed`, `rowsReturned`, and a `resultUrl` for an NDJSON file. The
file URL expires after 24 hours. Most completed tasks are described as $2–10,
failed tasks are not charged, and submission requires at least $10 balance.
[S10][S8]

**RECOMMENDATION (high):** adapt “schema per record + row count + expiring bulk
artifact,” but require content-addressed manifests, checksums, acquisition times,
source-page versions, per-row evidence, explicit partial/failure accounting, and
a caller-defined row/page/cost ceiling. A reachable URL is not a safe,
authoritative, or semantically correct URL.

## 6. Research and asynchronous execution

### 6.1 Research modes and depth

Research is an autonomous beta endpoint for questions a single search cannot
resolve. It accepts `sourcedAnswer` or `structured` and optional source/date
filters shared with Search. [S1][S11][S12]

| `mode` | Intended work |
|---|---|
| `answer` | precise, evidence-backed answer with a definitive solution |
| `investigate` | focused, multi-angle report on one defined subject |
| `research` | thematic report across many topics/entities |
| omitted / `auto` | agent classifies the request |

| `reasoningDepth` | Typical latency | Cost/call |
|---|---:|---:|
| `S` | 2–5 min | $0.25 |
| `M` | 3–7 min | $0.50 |
| `L` (default) | 5–10 min | $1.50 |
| `XL` | 10–20 min | $2.50 |

**FACT (high):** higher depths are described as consulting more sources,
performing more iterations/cross-checking, and producing longer output. The API
does not expose those counts or stopping criteria. `POST /v1/research` returns a
task envelope; `GET /v1/research/{id}` yields `pending | processing | completed |
failed`, timestamps, error, echoed input, and eventual output. Linkup advises
5–10-second polling and rate-limits polling above once per second. [S11][S12]

**FACT/PROVENANCE GAP (high):** sourced Research output is `answer + sources`,
with inline citations described by the overview. Structured Research output is
the schema-shaped object; unlike Search structured output, the current Research
contract exposes no `includeSources` option or required source wrapper. Thus
structured Research may discard citation transport at the API boundary. [S11]

**RECOMMENDATION (high):** Curiosity should not use citation-free structured
Research for factual ingestion. Prefer cited output, then parse into an internal
schema while retaining claim/source relationships. A completed provider task
means execution ended—not that the answer is correct or sufficiently supported.

### 6.2 Tasks batch wrapper

**FACT (high):** Tasks accepts up to 100 mixed Search/Fetch/Research calls in one
submission, returns one async envelope per item, and applies native endpoint
parameters, output shapes, and prices with no surcharge or discount. Item states
are `pending`, `processing`, `completed`, or `failed`. [S6]

**UNKNOWN:** no reviewed overview guarantee covers idempotency, cancellation,
webhooks, stable ordering, maximum retained task age, partial batch transaction
semantics, or a total batch byte/spend ceiling.

**RECOMMENDATION (high):** assign a Curiosity idempotency key and local
submission ledger even if the provider cannot consume it; cap estimated batch
spend before submission; treat each item independently; and bound polling,
retention, and output download.

## 7. Index ownership, freshness, and clean-room architecture inference

### 7.1 What is actually evidenced

The following independent first-party statements triangulate meaningful index
ownership:

1. Fast Search passes a query directly to “our index.” [S2]
2. Linkup's privacy documentation says ZDR is possible because retrieval is built
   on “its own search index and processing stack,” operated and controlled by
   Linkup. [S14]
3. The public bot page identifies LinkupBot as “the web crawler behind Linkup's
   search index.” [S17]
4. Content-safety documentation describes Linkup filtering pages during
   indexing/retrieval and offers enterprise fast-lane inclusion and custom
   source refresh rates. [S13]
5. Enterprise material offers personalized indexes, dedicated refresh rates,
   private environments, and BYOC; security docs say BYOC can run the search
   index and processing in the customer environment. [S14–S16]

**VERDICT — FACT (high confidence):** Linkup owns and operates at least a
first-party crawler, index, and processing stack used by the service.

**QUALIFICATION — UNKNOWN:** these sources do not prove every candidate or every
Research source is exclusively first-party crawled. No public source inventory
or dependency declaration rules out licensed feeds, external search providers,
partner data, or live on-demand acquisition.

### 7.2 Freshness evidence and limits

**FACT (high):** Linkup markets Search as real-time/live-web retrieval, but the
observable modes differ: fast uses the index with no scrape; standard can scrape
one supplied URL; deep can chain search and multiple JavaScript-rendered scrapes;
Fetch retrieves a specified URL in real time. Enterprise customers can negotiate
custom refresh rates and fast-lane inclusion. [S2][S5][S13]

**INFERENCE (high):** “real time” can mean on-demand page acquisition or agentic
scraping, not necessarily real-time discovery, indexing, deduplication,
embedding, and reranking of the entire candidate corpus. A publication-date
filter is also not an index-freshness guarantee.

**UNKNOWN / negative result:** reviewed official sources provide no general
revisit cadence, discovery lag, fetch-to-index lag, per-result crawl timestamp,
cache age, stale fallback marker, index size, corpus-language/region coverage,
freshness percentile/SLA, sitemap/feed policy, canonicalization, deduplication,
deletion latency, or published-date extraction accuracy.

### 7.3 Bounded architecture inference

The least-assumptive architecture consistent with public contracts is:

```text
public web
  -> LinkupBot crawl -> safety/quality filtering -> owned search index
                                             \-> enterprise custom indexes

query
  -> fast: direct index retrieval
  -> standard: one agentic plan -> parallel index searches + <=1 supplied-URL scrape
  -> deep: iterative searches <-> multi-page JS-capable scrape/evaluate chain
  -> optional answer/schema synthesis -> URLs + excerpts/citations

known URL -> Fetch standard/pro -> HTML/PDF acquisition -> Markdown/raw/images
research question -> async planner/investigator -> repeated retrieval -> synthesis
```

**INFERENCE confidence:** high for the product-stage separation; medium for shared
components; low for internal ranking/retrieval algorithms. No official source
reviewed discloses lexical versus vector retrieval, query expansion model,
fusion, authority/link analysis, reranker, embedding model, index sharding,
cache topology, or agent model/provider.

## 8. Limits, errors, pricing, and operational checks

### 8.1 Errors and rate limits

**FACT (high):** API errors have `statusCode` plus `{code,message,details[]}`.
Documented classes are 400 validation/no-result/fetch failures, 401 invalid or
missing key, 402 x402 payment failure, 403 permission, 409 conflict, 429 either
credit exhaustion or excess concurrency/rate, and 500 internal error. SDKs expose
more specific typed errors for no result, insufficient credit, too many requests,
and Fetch size/type/reachability failures. [S7]

**FACT (high):** Search and Fetch default to 10 queries/second per organization;
x402 is limited per IP. Research and Extract polling over once/second is
rate-limited, although recommended polling is slower. Public docs reviewed do not
state submission/concurrency quotas for Research, Tasks, or Extract. [S11][S23]

**RECOMMENDATION (high):** normalize provider status separately from machine
error code. In particular, split Linkup 429 into `rate_limited` versus
`insufficient_credit`; retry only the former. Do not retry invalid/no-result
400s. Bound retries by deadline and idempotency risk.

### 8.2 Point-in-time list pricing

| Call | Price |
|---|---:|
| fast/standard Search, raw results | $0.005 |
| fast/standard Search, sourced/structured | $0.006 |
| deep Search, raw results | $0.05 |
| deep Search, sourced/structured | $0.055 |
| Fetch | $0.001–$0.01 by mode/JS |
| Research S/M/L/XL | $0.25 / $0.50 / $1.50 / $2.50 |
| Extract closed beta | typically $2–10, variable |

**FACT (high):** successful calls deduct prepaid USD credit; documented errors
do not. A professional-email signup is advertised $20 initial credit topped back
to $20 monthly for eligible accounts. x402 permits USDC-on-Base per-request
payment without an account, with a $0.01 minimum charge. API-key balance
exhaustion returns 429. [S8]

**INFERENCE (high):** output choice reveals where vendor synthesis cost enters:
raw Search is cheaper than answer/schema output. Deep's approximately 10× search
price reflects opaque extra retrieval/agent work. These fixed request prices do
not expose token, crawl, model, cache, or infrastructure utilization and cannot
alone support a build-versus-buy decision.

### 8.3 Documentation checks required before integration

1. Confirm effective include/exclude limits (50 tutorial vs 100/no-cap OpenAPI).
2. Confirm maximum `maxResults` and whether it is honored in every depth.
3. Confirm Research beta retention, cancellation, idempotency, concurrency, and
   structured-output citation behavior.
4. Confirm whether Tasks accepts Extract and what batch retention/idempotency is.
5. Confirm Fetch SSRF/redirect/DNS/script sandbox and timeout controls.
6. Confirm default query/result retention and subprocessors under a DPA; never
   infer ZDR from certification.
7. Run separately authorized, unpaid/free contract tests before production for
   malformed requests, no results, 429 variants, source filters, date semantics,
   result bounds, schema failures, citation shape, and async terminal states.

## 9. Safety, privacy, and trust boundaries

### 9.1 Content safety and crawling

**FACT (high, vendor statement):** Linkup says malware, phishing, spyware, DNS
tunneling, potentially unwanted software, and child-abuse content are excluded
or blocked by default; questionable categories are restricted; and a quality
model prioritizes higher-quality sources. It says crawling respects `robots.txt`,
does not bypass CAPTCHAs/access controls, and does not access authentication,
paywall, or registration-gated content. API users can exclude domains;
enterprise controls add category/domain blocking, fast-lane sources, refresh
rates, and ranking bias. [S13]

**UNKNOWN:** no reviewed public contract exposes a per-result safety decision,
quality score, policy/version ID, malware scan result, robots evidence, or reason
for exclusion. There is no request-level safety toggle or taxonomy in Search.
Prompt-injection detection, dangerous downloads, poisoned SEO/metadata, and
model-output safety are not specified.

**RECOMMENDATION (high):** never translate “clean Markdown,” “quality scored,”
or “cited” into trusted. Curiosity must isolate fetched content from instructions,
strip active content, enforce URL/network policy, scan stored artifacts, preserve
policy decisions, and prevent source text from acquiring tool authority.

### 9.2 Query privacy and enterprise controls

**FACT (high, self-attested):** Linkup states SOC 2 Type II, ISO 27001, HIPAA
compliance, TLS 1.2+ in transit, AES-256 at rest, a DPA, and infrastructure in
US/EU/Canada/APAC. Default queries may be processed across those regions based
on load; guaranteed local processing is enterprise-only. ZDR is available on
request and **not enabled by default**; under ZDR, queries/results remain in
memory and are not persisted. SSO, IP allowlisting, custom regional processing,
and BYOC are enterprise/configured features. [S14–S16]

**FACT/CONTRADICTION (high):** the introduction says “Zero Data Retention,
GDPR, and Single Sign-On on every tier” and calls standard search sub-second.
Dedicated privacy/security pages say ZDR is by request, SSO is enterprise, and
the Search overview assigns sub-second to beta `fast` while `standard` is 1–3
seconds. The specific security/endpoint pages are the safer working authority;
commercial terms must still be confirmed. [S1][S2][S14–S16]

**RECOMMENDATION (high):** assume ordinary use is non-ZDR and globally routed
unless a signed agreement says otherwise. Do not send secrets, credentials,
private hypotheses, personal data, customer identifiers, or unpublished
competitive information. Minimize queries and retain a provider-disclosure
audit. Certification is not a data-flow contract.

## 10. Exact clean-room implications for Curiosity

### Adopted

1. **ADOPT — distinct capability contracts (high).** Keep `search`, `fetch`,
   `research_job`, and `bulk_extract` separate. Composition belongs in bounded
   orchestration, not a misleading universal “search” response.
2. **ADOPT — explicit result and schema bounds (high).** Require result count,
   returned bytes/tokens, schema complexity, deadline, and spend ceilings in the
   provider-neutral request even if an adapter can only enforce some locally.
3. **ADOPT — durable async envelopes (high).** Persist provider job ID, state,
   created/updated times, exact input digest, error, attempts, and output digest.
4. **ADOPT — machine-readable errors (high).** Preserve provider status/code and
   map them to retryable, terminal, policy, auth, credit, and partial categories.
5. **ADOPT — source constraints (high).** Domain and date controls are useful
   retrieval policy, but log their requested and provider-effective forms.

### Adapted

1. **ADAPT — depth modes into explicit execution plans (high).** Curiosity modes
   must resolve to inspectable stage/iteration/fetch/deadline/cost budgets; Linkup
   labels stay adapter hints.
2. **ADAPT — sourced/structured output into evidence-bearing claims (high).**
   Store generated fields separately from source passages; attach field/claim to
   immutable retained evidence and expose unsupported/conflicting states.
3. **ADAPT — index versus live retrieval (high).** Model discovery freshness,
   index freshness, page-fetch freshness, extraction freshness, and publication
   time separately. Never describe a live page fetch as proof of a fresh index.
4. **ADAPT — quality/safety ranking (high).** Use inspectable policy classes and
   versioned decisions across discovery, fetch, parse, storage, retrieval, and
   rendering—not an opaque provider quality promise.
5. **ADAPT — expiring bulk artifacts (medium-high).** Download within a bounded
   worker, verify digest/size/row count, quarantine as untrusted, and persist only
   under Curiosity retention/legal policy.

### Rejected

1. **REJECT — Linkup as the owned-stack substrate (high).** Its crawl corpus,
   ranking, models, versions, and operational freshness remain vendor-controlled
   and largely opaque.
2. **REJECT — generated answer or JSON as evidence (high).** Schema validity and
   citations do not establish factual support, completeness, or independence.
3. **REJECT — mutable URL/snippet provenance as sufficient (high).** Require
   acquisition time, content/version digest, extractor version, passage locator,
   and policy lineage where lawful.
4. **REJECT — unrestricted agentic “deep” execution (high).** Provider iteration
   language is not a caller-enforceable loop, source, token, or fetch budget.
5. **REJECT — security marketing as configuration (high).** ZDR, residency,
   SSO, and BYOC require explicit verified setup and contractual scope.

### Deferred

1. **DEFER — Linkup adapter adoption (medium).** Revisit after contract tests,
   DPA/retention review, error/bound validation, and comparative evidence-quality
   evaluation against owned retrieval at matched freshness and cost.
2. **DEFER — Research beta for production factual ingestion (high).** Wait for a
   stable, cited structured-output contract plus cancellation/idempotency/
   retention/concurrency documentation.
3. **DEFER — Extract beta integration (high).** Closed-beta behavior, variable
   spend, row provenance, and Tasks compatibility are insufficiently stable.
4. **DEFER — provider-generated confidence (high).** Linkup's public response
   contracts reviewed here expose no calibrated claim-confidence primitive.

## 11. Unknowns and negative results retained

The official public sources reviewed did **not** establish:

- complete crawl frontier, revisit policy, sitemap/feed behavior, corpus size,
  language/geography coverage, canonicalization/deduplication, or deletion SLA;
- whether all results use only Linkup-owned crawl data or any third-party feeds;
- lexical/vector/hybrid retrieval, rank features, scores, authority graph,
  freshness function, diversity policy, models, prompts, or version identifiers;
- per-result crawl/index/fetch time, cache age, source hash/version, stable
  pagination/snapshot, or rank explanation;
- hard internal query/source/fetch/token/iteration ceilings for standard, deep,
  or Research beyond “up to 10” deep iterations in agent guidance;
- Search `maxResults` maximum, effective exclusion-list maximum, response-byte
  maximum, or general timeout;
- Research/Tasks cancellation, idempotency, webhook, concurrency, retention, and
  total job/batch spend bounds;
- ordinary (non-ZDR) query/result retention duration, complete subprocessor list,
  or default model-training use;
- public calibration/reproduction of quality, latency, freshness, uptime, or
  comparative benchmark claims.

These gaps do not negate the documented product contracts. They bound the
confidence with which Linkup can be treated as auditable retrieval infrastructure.

## 12. Curiosity pass and stopping rule

After synthesis, unresolved threads were scored qualitatively on relevance,
decision value, novelty, and cost. The highest-value thread—**whether Linkup
actually owns its index**—was pursued across privacy, bot, safety, Search, and
enterprise sources and reached triangulated high confidence. The next thread—
**freshness semantics**—saturated at a useful negative result: live fetch/scrape
is documented, general index freshness is not.

**CURIOSITY_NO_GO:**

- Dynamic blog internals promising crawler detail: official pages rendered only
  a loading shell through the available read-only path; lower value than the
  direct bot/privacy/security statements and no bypass was attempted.
- Paid/free authenticated behavior tests: outside authority; require a separate
  declared test frame and credentials.
- SDK/package source inspection: unnecessary to answer hosted architecture and
  risks conflating permissively licensed adapters with proprietary service code.
- Benchmark reproduction and competitor comparison: outside this product-contract
  frame and would not resolve provenance/freshness gaps.
- Trust-center gated reports and contractual attachments: not publicly reviewed;
  certification claims remain vendor statements pending procurement review.

**Stop condition:** coverage and saturation reached for all bounded sub-questions;
remaining high-value unknowns require provider confirmation, contract review, or
separately authorized API tests.

## 13. Source ledger

All sources are official/primary and were accessed 2026-08-17.

- **[S1]** Linkup, “Introduction” — five endpoints, product status, headline
  claims. <https://docs.linkup.so/pages/documentation/get-started/introduction>
- **[S2]** Linkup, “Search overview” — depth behavior, latency, agentic stages,
  output types, prices. <https://docs.linkup.so/pages/documentation/endpoints/search/overview>
- **[S3]** Linkup, `POST /v1/search` OpenAPI rendering — request/response schema,
  filter bounds, citations, sources, errors. <https://docs.linkup.so/pages/documentation/endpoints/search/reference>
- **[S4]** Linkup, “Search best practices” — depth selection and date metadata
  caveat. <https://docs.linkup.so/pages/documentation/endpoints/search/best-practices>
- **[S5]** Linkup, “Fetch overview” — formats, modes, constraints, extraction,
  pricing. <https://docs.linkup.so/pages/documentation/endpoints/fetch/overview>
- **[S6]** Linkup, “Tasks overview” — batch size, types, states, pricing.
  <https://docs.linkup.so/pages/documentation/endpoints/tasks/overview>
- **[S7]** Linkup, “Errors” — API/SDK error envelopes and classes.
  <https://docs.linkup.so/pages/documentation/platform/errors>
- **[S8]** Linkup, “Pricing” — billing, all endpoint prices, x402, no-charge
  errors. <https://docs.linkup.so/pages/documentation/platform/pricing>
- **[S9]** Linkup, “Source Filtering” — 50-item tutorial limit and prioritization
  guidance. <https://docs.linkup.so/pages/documentation/tutorials/filtering>
- **[S10]** Linkup, “Extract overview” — closed beta, row schema, NDJSON, expiry,
  pricing. <https://docs.linkup.so/pages/documentation/endpoints/extract/overview>
- **[S11]** Linkup, “Research overview” — modes, reasoning depths, prices,
  citations, lifecycle. <https://docs.linkup.so/pages/documentation/endpoints/research/overview>
- **[S12]** Linkup, `POST /v1/research` OpenAPI rendering — request, output, and
  task schemas. <https://docs.linkup.so/pages/documentation/endpoints/research/post>
- **[S13]** Linkup, “Content safety and index controls” — filtering, quality,
  crawl safeguards, enterprise refresh/ranking. <https://docs.linkup.so/pages/security-and-privacy/content-safety-index-controls>
- **[S14]** Linkup, “Data processing and privacy” — regions, own index/stack,
  ZDR behavior. <https://docs.linkup.so/pages/security-and-privacy/data-processing-privacy>
- **[S15]** Linkup, “Security and compliance” — certifications, encryption,
  enterprise controls, BYOC. <https://docs.linkup.so/pages/security-and-privacy/security-compliance>
- **[S16]** Linkup, “Frequently Asked Questions” — default/non-default privacy,
  safety, index, and enterprise controls. <https://docs.linkup.so/pages/security-and-privacy/faq>
- **[S17]** Linkup, “LinkupBot” — crawler identification.
  <https://www.linkup.so/bot>
- **[S18]** Linkup changelog, “Fetch Pro mode” — August 2026 release and prices.
  <https://docs.linkup.so/pages/changelog/fetch-pro-mode>
- **[S19]** Linkup status — monitored components and point-in-time service state.
  <https://status.linkup.so>
- **[S20]** Linkup official GitHub organization and SDK repositories — public
  SDKs and their MIT license files. <https://github.com/LinkupPlatform>,
  <https://github.com/LinkupPlatform/linkup-js-sdk/blob/main/LICENSE>,
  <https://github.com/LinkupPlatform/linkup-python-sdk/blob/main/LICENSE>
- **[S21]** Linkup, “Structured output guide” — object-schema conformance.
  <https://docs.linkup.so/pages/documentation/tutorials/structured-output-guide>
- **[S22]** Linkup, `POST /v1/fetch` OpenAPI rendering — current raw-content
  field and deprecated raw-HTML field. <https://docs.linkup.so/pages/documentation/endpoints/fetch/reference>
- **[S23]** Linkup, “Rate Limits” — Search/Fetch organization QPS and x402 IP
  scope. <https://docs.linkup.so/pages/documentation/platform/rate-limits>
- **[S24]** Linkup, “Linkup MCP Server” — hosted/local surface and API/MCP
  capability differences. <https://docs.linkup.so/pages/integrations/mcp/mcp>

## 14. Confidence summary

- **High:** endpoint shapes, public beta labels, mode descriptions, list prices,
  documented errors/rate limits, output fields, and stated security controls.
- **High:** Linkup operates at least its own crawler/index/processing stack,
  based on multiple first-party statements; **not** high that all inputs are
  exclusively first-party.
- **Medium:** inferred separation/shared use of indexed retrieval, on-demand
  acquisition, extraction, and agent orchestration.
- **Low/unknown:** hidden retrieval/ranking architecture, corpus completeness,
  actual freshness/quality/latency, ordinary retention, and undocumented runtime
  limits without provider confirmation or authorized tests.
