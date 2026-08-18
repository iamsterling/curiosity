# Linkup Search: clean-room product and architecture study

**Research / primary-source access date:** 2026-08-17  
**Scope:** Linkup's synchronous `POST /v1/search` product only, including the
index, crawler, ranking, safety, privacy, and billing claims needed to interpret
Search. Fetch, Extract, Research, Tasks, and their economics/contracts are out of
scope. Search-internal page opening and scraping remain in scope because Linkup
documents them as behavior of `standard` and `deep`.  
**Status:** research evidence and recommendations—not implementation,
procurement approval, legal advice, a benchmark, or a live service test.

## Executive verdict

**ADAPT Linkup Search's observable contract patterns; REJECT it as the foundation
of Curiosity's owned retrieval plane (high confidence).** Linkup Search is a
bounded synchronous API over a vendor-operated web index. Its most useful ideas
are explicit effort modes, a raw ranked-results output distinct from generated
answers, domain/date controls, schema-constrained derived output, a result-count
cap, and simple per-mode prices. Linkup also makes unusually clear that `fast`,
`standard`, and `deep` select different execution graphs rather than portable
relevance levels [S1–S4].

The decisive limitations are provenance and controllability. Search results
contain mutable URLs and query-associated text, but no rank score, crawl/fetch/
index timestamp, content hash, document version, passage locator, canonical URL,
supplier lineage, safety decision, or retrieval snapshot. `maxResults` caps the
returned set, not documented internal sub-searches, candidates, page opens,
bytes, tokens, or spend. Standard and deep accept behavioral instructions and
may scrape pages, yet expose no caller-selected query, fetch, iteration, token,
or wall-clock budget [S1–S4].

Multiple first-party statements support the conclusion that Linkup operates at
least its own crawler, index, and processing stack: `fast` queries “our index”;
the privacy page says Linkup's own index and processing stack enable ZDR; the bot
page identifies LinkupBot as the crawler behind the index; and migration material
calls the index proprietary and AI-native [S1][S12][S16][S17]. This evidence does
**not** establish that every result is exclusively first-party crawled, nor does
it expose corpus coverage, crawl cadence, supplier mix, ranking algorithms, or
freshness distributions.

For Curiosity, Linkup is at most a **deferred hosted adapter**. Returned snippets,
page text, images, citations, and generated JSON remain untrusted external data.
Curiosity must independently enforce branch, query, URL, host, byte, token, time,
retry, and spend bounds and must retain evidence versions before treating claims
as verified.

## 1. Decision frame and research method

### 1.1 Bounded sub-questions

1. What is Search's documented request/response contract, and where are its hard
   bounds, defaults, drift, and contradictions?
2. What do `fast`, `standard`, and `deep` permit, and which execution limits are
   caller-controlled versus opaque?
3. What is established about index/crawler ownership, freshness, ranking,
   snippets, generated output, and provenance?
4. What are the Search-specific rate, error, pricing, safety, and privacy
   boundaries?
5. What is the least-assumptive internal architecture consistent with the public
   contract?
6. Which patterns should Curiosity adopt, adapt, reject, or defer?

### 1.2 Evidence and clean-room boundaries

Only public first-party Linkup documentation, its rendered OpenAPI contract,
security/privacy pages, changelog, crawler declaration, migration guides, and
official MIT-licensed JavaScript SDK types were inspected. The SDK was used only
to triangulate the public wire shape; no code is reproduced or proposed here.
Its MIT license covers that repository—not Linkup's hosted service, crawler,
index, models, ranking, or returned third-party content [S18].

No credential, free/paid API request, account, package installation, private
endpoint, access-control bypass, crawler probing, benchmark, restricted trust
artifact, or proprietary implementation was used. Vendor claims about quality,
freshness, latency, security, compliance, and architecture are attributed and
were not independently validated. All cited web sources were accessed
2026-08-17.

Labels used below:

- **FACT** — directly stated in a cited primary source. Vendor claims remain
  facts about what Linkup publishes, not independent proof of efficacy.
- **INFERENCE** — the least-assumptive interpretation consistent with facts, not
  a claim about undisclosed implementation.
- **RECOMMENDATION** — a Curiosity design or decision consequence.
- **UNKNOWN** — not established in the reviewed public primary sources.
- Confidence is **high**, **medium**, or **low**.

## 2. Product boundary and transport contract

### 2.1 Endpoint, authentication, and execution

**FACT (high):** the normative OpenAPI operation is synchronous JSON
`POST https://api.linkup.so/v1/search`. The body requires `q`, `depth`, and
`outputType`; bearer authentication is declared at the operation. Linkup also
supports accountless x402 payment, represented by a `402` challenge, but no x402
transaction was attempted [S2][S10][S11].

**Documentation contradiction:** several official curl examples use `GET -G`
with query parameters, while the reference exposes only `POST` with a JSON body.
The official JavaScript SDK also posts JSON. Treat POST/JSON as the contract and
do not assume GET is supported without an authorized conformance test
[S1][S2][S18].

**FACT (high):** Search is one synchronous round trip even when `standard` or
`deep` internally plans sub-searches and page scrapes. The vendor latency ranges
are `<1 s`, `1–3 s`, and `5–30 s`, respectively. No request field sets a server
deadline, per-stage timeout, async continuation, cancellation, idempotency key,
or stream [S1–S4].

### 2.2 Request schema

| Field | Public schema / behavior | Material qualification |
|---|---|---|
| `q` | string, required | No `minLength`/`maxLength`, language, syntax, or operator grammar. Instructions are literal only in agentic modes. |
| `depth` | required enum: `fast`, `standard`, `deep` | `fast` is beta; modes select materially different pipelines. |
| `outputType` | required enum: `searchResults`, `sourcedAnswer`, `structured` | Output choice changes semantics and price. |
| `includeDomains` | string array, OpenAPI maximum 100 | Docs alternately call values domains or URLs and disagree on the limit. |
| `excludeDomains` | string array | OpenAPI has no `maxItems`; other pages say 50 or unlimited. |
| `fromDate` | `YYYY-MM-DD` string/null | Must be later than 1970-01-01 and before `toDate` if supplied. |
| `toDate` | `YYYY-MM-DD` string/null | Must be later than `fromDate`, or later than 1970-01-01. |
| `maxResults` | number, minimum 1 | No integer constraint or public maximum in OpenAPI. |
| `includeImages` | boolean or string; default false | Image result count, ranking, safety, and relation to `maxResults` are unspecified. |
| `includeInlineCitations` | boolean or string; default false | Relevant only to `sourcedAnswer`. |
| `structuredOutputSchema` | JSON-schema value represented as a string; default null | Required for `structured`; root must be an object. Public depth/size/property limits are absent. |
| `includeSources` | boolean or string; default false | Relevant only to `structured`; changes the response envelope. |

[S2][S3][S5][S6]

**FACT/CONTRADICTION (high):** source-list limits have four incompatible public
descriptions:

1. Search overview: include/exclude up to 100 domains.
2. OpenAPI: include up to 100; no exclude maximum.
3. best practices: include up to 100; exclude “unlimited.”
4. filtering tutorial: include and exclude up to 50 URLs/domains.

Use **50** as a conservative adapter ceiling until Linkup confirms the effective
contract. Preserve raw requested values, normalized host/path interpretation,
and the provider-effective constraint [S1–S3][S5].

**FACT/CONTRADICTION (high):** migration guides say `maxResults` defaults to 10,
but neither the current OpenAPI schema nor the dedicated launch note declares a
default. `maxResults` is typed as a general number rather than an integer and has
no maximum [S2][S7][S17]. An omitted value, fractional value, or very large value
therefore has undocumented server behavior.

**UNKNOWN:** maximum query length, request-body bytes, schema bytes/nesting,
domain-string length, URL/domain normalization, wildcard/public-suffix rules,
subdomain/path behavior, IDN handling, redirects, include/exclude conflict
precedence beyond “inclusion wins,” and invalid-but-well-formed date behavior.

### 2.3 Controls: filter, hint, and absent controls

| Control | Defensible class | Qualification |
|---|---|---|
| `includeDomains` | intended hard inclusion filter | Exact matching grammar is not normative; tutorials also say URLs. |
| `excludeDomains` | intended hard exclusion filter | Conflicting bounds; redirect/canonical/subdomain semantics unknown. |
| `fromDate` / `toDate` | provider-metadata date filter | Best practices warns publication metadata can differ from latest update, making filtering unstable. |
| `<guidance><priority>…` in `q` | agent instruction / hint | Not a typed rank control, validation rule, or guaranteed restriction. Only meaningful in instruction-aware modes. |
| `maxResults` | hard returned-item upper bound | Not documented as an internal candidate, search, scrape, or source-use bound. |
| `includeImages` | output expansion | No image-domain/date/provenance contract is documented. |

Search exposes no typed language, country/market, user location, source class,
MIME type, license, adult/safety level, crawl-age, cache-age, recency sort,
freshness boost, authority/diversity target, exact-match mode, pagination, or
stable snapshot control [S2][S3][S5].

**RECOMMENDATION (high):** Curiosity should distinguish `filter`, `boost`, and
`instruction`. Do not convert prompt-level priority into a hard source policy.
Validate returned URLs against caller policy after retrieval, because provider
filtering is not an authorization boundary.

## 3. Depth modes are execution-policy selectors

| Depth | Directly documented behavior | Vendor latency | Observable/claimed bound |
|---|---|---:|---|
| `fast` (beta) | query passed as-is to Linkup's index; no retrieval LLM, reinterpretation, scraping, sub-search, or evaluation | `<1 s` | single direct indexed pass |
| `standard` | one agentic iteration; interprets instructions; may fan out parallel searches; may scrape one URL supplied in the query | `1–3 s` | one iteration; outputs cannot feed a later iteration |
| `deep` | several sequential search/scrape/evaluate iterations; discovered outputs may feed later steps; several URLs and JS-rendered scrapes | `5–30 s` | agent integration guide says up to 10 iterations |

[S1][S3][S4]

### 3.1 Important semantic nuances

**FACT/QUALIFICATION (high):** “fast has no LLM” describes its retrieval path,
not necessarily the entire response. The pricing page says `sourcedAnswer` and
`structured` invoke an LLM for every depth, including fast. Thus
`fast + searchResults` is the defensible no-LLM product shape;
`fast + sourcedAnswer/structured` is direct retrieval followed by generation
[S1][S9].

**FACT/CONTRADICTION (medium-high):** the fast launch note says fast returns only
search results and snippets, then demonstrates `outputType: sourcedAnswer`.
Current OpenAPI permits all three output types with fast. Treat the current
OpenAPI/pricing combination as authoritative, while retaining the changelog
drift [S2][S9].

**FACT (high):** standard can perform multiple *parallel* sub-searches inside its
one iteration. Therefore “single iteration” does not mean one query, one source,
or one page. Deep supports sequential dependencies and several page scrapes.
The public API exposes neither generated sub-queries nor visited-page manifests
[S3][S4].

**INFERENCE (high):** `depth` is a pipeline/compute policy, not a calibrated
quality setting. Fast is direct indexed candidate retrieval. Standard adds a
planner/interpreter and one bounded graph layer. Deep adds an iterative stateful
planner/evaluator with page acquisition. Exact query counts, candidate depths,
models, stopping criteria, and early cancellation remain hidden.

### 3.2 Missing bounds

No public Search request constrains:

- number of generated sub-queries or parallel branches;
- internal candidate/source count;
- page opens, URLs, hosts, redirects, or per-host concurrency;
- downloaded or returned bytes;
- LLM input/output tokens or model choice;
- standard/deep wall-clock deadline below vendor service behavior;
- deep iteration count below the vendor's documented “up to 10”;
- aggregate source count used for synthesis;
- retry count or fallback behavior; or
- maximum charged calls if a caller itself retries.

**RECOMMENDATION (high):** provider-neutral effort modes must resolve to explicit
budgets (`max_queries`, `max_candidates`, `max_fetches`, `max_hosts`,
`max_iterations`, `max_bytes`, `max_tokens`, `deadline_ms`, `max_spend`). A
Linkup adapter may only approximate unsupported controls locally and must report
which bounds were not enforceable server-side.

## 4. Results, ranking, content, and provenance

### 4.1 Three semantically different outputs

| `outputType` | Current response | Provenance value | Primary limitation |
|---|---|---|---|
| `searchResults` | `{results: (TextResult | ImageResult)[]}` | provider-ranked source-local records | no score, time, version, passage anchor, or request ID |
| `sourcedAnswer` | `{answer, sources[]}` | generated answer plus source list; optional inline citations | source list/inline markers do not prove claim support or completeness |
| `structured` | caller-schema object; with `includeSources`, `{data, sources}` | optional source transport around derived fields | schema conformance is not factual validation or field-level grounding |

[S1][S2][S6][S18]

Text results require:

```text
type = "text"
name: string
url: URI
content: string
favicon: URI or empty string
```

Image results require only `type = "image"`, `name`, and `url`. Sourced-answer
sources require `name`, `url`, `snippet`, and `favicon` [S2].

### 4.2 What `content` does—and does not—mean

**FACT/DRIFT (high):** the current overview calls Search result `content` a
snippet, and OpenAPI calls it “extracted text content associated with the
resource.” Migration examples instead call it “Full content text” and use a
non-current `type: html`, while the current schema fixes text records to
`type: text` [S1][S2][S17]. The narrower current interpretation is a
query-associated excerpt/content fragment, not guaranteed full-page content.

**FACT/DRIFT (high):** the 2024 date-filter changelog example adds a `date` field
to a result; the current Search result schema does not contain `date` at all.
Date controls therefore do not yield observable per-result date provenance in
the current contract [S2][S8].

**UNKNOWN:** whether snippets are copied, compressed, generated, cached, or
request-time extracted in each depth; maximum snippet size; truncation markers;
passage ordering; HTML-to-text rules; language; page section; offsets; and
whether page scraping in standard/deep changes the result content representation.

### 4.3 Ranking facts and limits

**FACT (high):** Linkup describes results as ranked and says a quality-scoring
model evaluates candidate pages during indexing and retrieval, prioritizing
higher-quality sources and de-prioritizing low-trust content. Enterprise controls
can add customer-specific ranking bias [S1][S13].

**UNKNOWN / negative result:** reviewed primary sources do not disclose lexical,
BM25, vector, hybrid, link/authority, click, embedding, freshness, diversity,
personalization, or reranker features; score ranges or calibration; candidate
depths; fusion; query rewrite models; rank stability; sponsored/commercial
influence; or rank explanations.

The public response exposes no document score, rank number, safety/quality score,
feature contribution, resolved query, generated sub-query, or applied-control
echo. Result order is the only document-level ranking signal [S2][S18].

**RECOMMENDATION (high):** preserve provider order and provider identity, but do
not invent a score or treat position as authority. If a provider-local rank is
used as one feature, record that it is opaque and request-specific.

### 4.4 Provenance gaps

No reviewed Search response contract establishes:

- request/trace ID, server timing, or returned usage/cost;
- retrieval, crawl, fetch, parse, index, or cache timestamp;
- first/last observed time or provider corpus/index version;
- source supplier (Linkup crawler, live scrape, licensed feed, or other path);
- original/final/canonical URL or redirect chain;
- raw capture, content/document ID, digest, or immutable version;
- excerpt offsets/hash or extractor/model version;
- publication/update timestamp and its evidence;
- robots, copyright/license, policy, malware, or safety decision;
- duplicate/syndication/owner cluster;
- stable pagination, cursor, total hits, or reproducible snapshot; or
- claim/field-to-passage grounding and contradiction state.

**RECOMMENDATION (high):** use `searchResults` for candidate discovery. Before a
claim becomes verified, lawfully acquire a bounded evidence version and retain
capture time, digest, canonical/redirect lineage, extraction version, passage
anchor, source ownership class, policy decision, and claim relationship.
Generated answers and structured fields are derived artifacts, never evidence
by themselves.

## 5. Index ownership and freshness

### 5.1 Ownership evidence

The ownership conclusion is triangulated across independent first-party pages:

1. `fast` passes the query directly to “our index” [S1].
2. Linkup says ZDR is possible because retrieval uses “its own search index and
   processing stack,” operated and controlled by Linkup [S12].
3. Linkup's public bot page labels LinkupBot “The web crawler behind Linkup's
   search index” [S16].
4. Migration guidance says Linkup uses a “proprietary, AI-native web index,” not
   Google SERP scraping [S17].
5. Content-safety material describes filtering during indexing and retrieval,
   fast-lane index inclusion, and custom source refresh rates [S13].
6. BYOC material says the search index and processing can run inside a selected
   customer's environment [S14].

**VERDICT — FACT (high confidence that Linkup makes and operationalizes the
claim):** Linkup operates at least a material first-party crawler, index, and
processing stack used by Search.

**QUALIFICATION — UNKNOWN:** public evidence does not prove that all candidates
or results are exclusively Linkup-crawled. No supplier manifest, dependency
statement, or result-level lineage rules out licensed feeds, partner data,
specialized datasets, or other upstreams. “Proprietary” establishes control, not
complete exclusivity or customer ownership.

### 5.2 Freshness has three different meanings

| Freshness dimension | Public evidence | What remains unknown |
|---|---|---|
| discovery/index freshness | Linkup markets real-time/live-web search and offers enterprise refresh rates/fast-lane inclusion | general discovery lag, revisit cadence, index-update lag, stale fallback |
| page-acquisition freshness | standard/deep can scrape pages during Search; deep supports JS-rendered page chains | whether every selected page is live-fetched, cache age, failure fallback, fetch time |
| publisher-date freshness | `fromDate`/`toDate` filter an index window | extracted field origin, accuracy, missing-date behavior, timezone, per-result value |

[S1][S3][S4][S13]

**INFERENCE (high):** “real time” can describe request-time page acquisition or
live agentic work without implying that the full candidate index was freshly
discovered, fetched, parsed, embedded, and reranked. Fast explicitly reads the
index with no scraping. Date filtering over page metadata is not index-freshness
proof.

**UNKNOWN / negative result:** no general crawl frontier, sitemap/feed policy,
revisit schedule, corpus size, language/geography coverage, MIME coverage,
canonicalization/deduplication, deletion/takedown latency, crawl-to-index lag,
freshness percentile/SLA, per-result crawl time, cache state, or versioned index
snapshot was found in reviewed official public sources.

**RECOMMENDATION (high):** Curiosity must model `published_claimed_at`,
`updated_claimed_at`, `first_seen_at`, `last_seen_at`, `fetched_at`, `indexed_at`,
and `derived_at` separately, each with origin and confidence. Never infer one
from another.

## 6. Bounds, errors, throughput, and economics

### 6.1 Observable bounds and conspicuous absences

Publicly documented Search bounds are sparse:

- include-domain maximum: 100 in current OpenAPI, conservatively 50 because of
  conflicting tutorial text;
- `maxResults >= 1`, with no public maximum or integer requirement;
- Search rate limit: 10 queries/second per organization, or per IP for x402;
- standard: one agentic iteration and at most one supplied-URL scrape;
- deep: “up to 10 iterations” only in agent integration guidance; and
- vendor latency ranges, which are descriptions rather than caller deadlines.

There is no pagination and no response-byte, snippet-byte, image-count, query-
length, schema-complexity, internal-source, page-fetch, total-token, or aggregate
spend limit in the public Search contract [S2–S4][S11].

### 6.2 Error contract

**FACT (high):** generic API errors are:

```json
{
  "statusCode": 400,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [{"field": "outputType", "message": "..."}]
  }
}
```

| HTTP | Documented Search-relevant meaning |
|---|---|
| `400` | missing/invalid parameter or no search result |
| `401` | missing/invalid API key |
| `402` | x402 signature/settlement failure or payment challenge |
| `403` | key lacks permission |
| `409` | resource/request conflict (generic docs) |
| `429` | insufficient prepaid credit **or** excess rate/concurrency |
| `500` | internal failure |

[S2][S10]

Official SDK error types separately distinguish no result, insufficient credit,
and too many requests, but the generic HTTP status alone does not. The Search
OpenAPI lists only 400/401/402/429, while the platform guide lists 403/409/500 as
general possibilities [S2][S10][S18].

**UNKNOWN:** `Retry-After`, stable machine-code enumeration, timeout status,
partial results, idempotency/retry safety, whether all 5xx classes share the
documented envelope, and whether request IDs are returned in headers.

**RECOMMENDATION (high):** normalize provider status and machine code separately.
Retry only an explicitly transient rate/server class, never a validation/no-
result/credit failure. Bound attempts by caller deadline and aggregate spend;
preserve the provider body after credential-safe redaction.

### 6.3 Point-in-time Search pricing

| Depth | Raw `searchResults` | `sourcedAnswer` or `structured` |
|---|---:|---:|
| `fast` (beta) / `standard` | $0.005/call | $0.006/call |
| `deep` | $0.050/call | $0.055/call |

**FACT (high):** successful requests deduct prepaid USD credit; Linkup says no
credit is deducted for errors, including no relevant result and internal error.
Eligible professional-email accounts are advertised $20 initially and topped
back to $20 monthly. Accountless x402 uses USDC on Base and imposes a $0.01
minimum per request, making that floor higher than the listed fast/standard
Search prices [S9].

**INFERENCE (high):** the answer/structured premium identifies a separate
generation stage. Deep's roughly 9–10x price reflects opaque additional work,
but fixed request pricing reveals neither query/fetch/token utilization nor a
hard internal budget. List price alone cannot decide build versus buy.

**RECOMMENDATION (high):** pin depth and output type; calculate maximum retries
before execution; reject automatic depth escalation; and retain locally computed
expected/actual spend. Search returns no documented usage field.

## 7. Safety, privacy, and trust boundaries

### 7.1 Content and crawl safety

**FACT (high, vendor statement):** Linkup says it blocks or excludes malware,
phishing, spyware, DNS tunneling, potentially unwanted software, and child-abuse
content by default; restricts hacking, drugs, unreliable-information patterns,
profanity-heavy, and adult-themed pages; and applies quality scoring during
indexing and retrieval. It says Linkup crawling respects `robots.txt`, does not
circumvent CAPTCHAs/access controls, and indexes only publicly available content,
not authentication-, paywall-, or registration-gated content [S13][S15].

**FACT (high):** Search exposes no request-level safety mode and returns no
per-result safety category, decision, policy/model version, quality score,
malware result, or robots evidence. Enterprise agreements can add domain/category
blocking, fast-lane inclusion, refresh controls, and ranking bias [S2][S13].

**MATERIAL CONTRADICTION / CHECK:** Search best practices claim exact-URL
extraction of LinkedIn profiles, company pages, posts, and comments and instruct
deep mode to discover then scrape such URLs. Security material says only public
content is indexed and login/registration-gated content is not accessed. The
public sources do not explain the acquisition path, field provenance, public-
visibility threshold, retention, or jurisdictional/privacy treatment. Do not
infer bypass; treat LinkedIn capability as an unresolved specialized data path
requiring written provenance and legal review [S3][S13][S15].

**UNKNOWN:** prompt-injection detection, poisoned SEO/metadata defenses,
dangerous-download handling, image safety, false-positive/negative rates,
policy appeals, and whether Search-internal scraping has redirect/DNS/private-
network/resource controls.

**RECOMMENDATION (high):** all returned strings and URLs remain
`untrusted_external_data`. Provider filtering is defense-in-depth only. Curiosity
must prevent source text from gaining instruction/tool authority, revalidate URLs
and content, isolate active content, scan retained artifacts, and preserve local
policy decisions.

### 7.2 Query privacy and security posture

**FACT (high, self-attested):** Linkup states SOC 2 Type II, ISO 27001, HIPAA
compliance, TLS 1.2+ in transit, AES-256 at rest, DPA availability, and
infrastructure in US/EU/Canada/APAC. By default queries may be processed across
those regions according to load; local processing is enterprise-configured
[S12][S14][S15].

**FACT (high):** ZDR is available only on request and is not default. When
enabled, Linkup says Search queries/results stay in memory, are not logged or
written to persistent storage, and are destroyed after return. SSO, regional
processing, IP allowlisting, and BYOC are enterprise/configured features
[S12][S14][S15].

**UNKNOWN / negative result:** ordinary non-ZDR query/result/log retention,
training or product-improvement use, complete subprocessors, default deletion
timelines, and exact regional data flows were not established. The public privacy
policy and terms pages rendered only loading shells in the available read-only
path, and the linked Notion client terms returned no readable body. Restricted
trust reports were not accessed [S19].

**RECOMMENDATION (high):** assume non-ZDR, globally routed processing unless a
signed agreement and verified configuration say otherwise. Do not send secrets,
credentials, private URLs, personal data, unpublished hypotheses, customer
identifiers, or confidential competitive plans. Certification is not a data-flow
or retention contract.

## 8. Least-assumptive architecture inference

The smallest architecture consistent with the public Search contract is:

```text
public web
  -> LinkupBot / other permitted inputs
  -> crawl-time safety + quality filtering
  -> parse/index pipeline
  -> vendor-controlled search index

Search request
  -> authentication/payment + validation
  -> domain/date/output policy
  -> depth router
       fast: query as-is -> index retrieval
       standard: one planner iteration
                 -> parallel sub-search(es)
                 -> optional one supplied-URL scrape
       deep: iterative planner/evaluator (documented up to 10)
             -> search <-> discovered/supplied page scraping (JS-capable)
  -> quality/policy ranking + top-k truncation
  -> one output branch
       ranked text/image results
       answer generation + source list/optional inline citations
       schema generation + optional source wrapper
  -> synchronous response
```

**INFERENCE confidence:**

- **High:** depth routing, direct-index fast path, agentic standard/deep paths,
  optional generation branches, and top-k response truncation.
- **Medium:** shared candidate index and safety/quality stages across modes;
  exact placement can differ.
- **Low/unknown:** crawler exclusivity, cache topology, lexical/vector blend,
  candidate depths, query planners/models, rerankers, source authority signals,
  and mode-specific fallback paths.

This diagram is a compatibility model, not a reproduction plan. It uses only
observable/public stage boundaries and deliberately omits undisclosed algorithms.

## 9. Curiosity implications and verdict ledger

### Adopted

1. **ADOPT — raw retrieval distinct from synthesis (high).** Keep ranked
   candidate evidence separate from generated answer/JSON artifacts.
2. **ADOPT — explicit returned-result cap (high).** Require a positive integer
   top-k and enforce a stricter Curiosity maximum independent of provider limits.
3. **ADOPT — typed domain/date controls (high).** Preserve requested and effective
   constraints and validate outputs after retrieval.
4. **ADOPT — machine-readable error normalization (high).** Preserve provider
   status/code/details while mapping no-result, policy, auth, credit, rate,
   transient, and terminal classes separately.
5. **ADOPT — visible operation pricing (high).** Estimate spend before execution
   and record cost class with the retrieval trace.

### Adapted

1. **ADAPT — depth into explicit execution plans (high).** Curiosity effort modes
   must name allowed stages and hard query/fetch/iteration/time/token/byte/spend
   budgets; Linkup depth remains an adapter hint.
2. **ADAPT — snippets into evidence passages (high).** Add immutable document
   version, capture/extractor identity, offsets/hash, and truncation metadata.
3. **ADAPT — source filtering (high).** Use parsed URL policy with explicit host,
   subdomain, path, redirect, IDN, and conflict semantics—not ambiguous strings
   or prompt guidance.
4. **ADAPT — structured output (high).** Require every material generated field
   to map to retained source passages and carry unsupported/conflicting state.
5. **ADAPT — freshness (high).** Separate publisher time, observation, fetch,
   index, and derivation freshness; expose stale fallback.
6. **ADAPT — quality/safety ranking (high).** Use versioned, inspectable policy
   classes at discovery, fetch, parse, storage, retrieval, and rendering. Vendor
   safety remains one upstream signal only.

### Rejected

1. **REJECT — Linkup as owned-search foundation (high).** Corpus, crawler
   coverage, index versions, ranking, models, freshness, and operations remain
   vendor-controlled and mostly opaque.
2. **REJECT — generated answer/JSON as evidence (high).** Citations and schema
   conformance do not establish support, accuracy, completeness, or independence.
3. **REJECT — URL/snippet-only provenance (high).** Mutable locators without
   capture/version/passage lineage are insufficient for verification.
4. **REJECT — unrestricted provider-agent depth (high).** “Deep” is not a caller-
   enforceable search, host, page, token, or loop budget.
5. **REJECT — prompt-level priority as policy (high).** Natural-language guidance
   is not an authorization or deterministic ranking contract.
6. **REJECT — marketing “real time” as freshness proof (high).** Live scraping,
   index freshness, and publication recency are distinct.

### Deferred

1. **DEFER — Linkup hosted adapter (medium).** Revisit after legal/privacy review,
   written supplier/retention answers, and authorized contract/quality tests.
2. **DEFER — fast beta for stable production behavior (medium-high).** Confirm
   supported output combinations, latency, freshness, and beta change policy.
3. **DEFER — Search-internal page scraping (high).** Prefer caller-controlled
   evidence acquisition until URL manifests, resource bounds, provenance, and
   network-safety behavior are contractually clear.
4. **DEFER — LinkedIn-specialized Search (high).** Provenance, visibility,
   privacy, retention, and legal scope are unresolved.
5. **DEFER — provider quality/safety claims as measurable signals (high).** No
   result-level signal or public calibration is available.

## 10. Checks required before any adapter decision

These are a future validation plan, **not executed**. It requires separate caller
authority, then-current terms acceptance, an approved non-sensitive key/budget,
and permission to record redacted observations.

1. **Transport/defaults:** POST/JSON versus documented GET examples; omitted
   `maxResults`; omitted optional booleans; content types and response headers.
2. **Bounds:** 1/fractional/large `maxResults`; query and schema lengths; domain
   counts 50/51/100/101; response-byte and timeout behavior.
3. **Depth:** stable navigational, niche, recent, and sequential queries across
   modes; count visible sources/page opens; verify no-LLM claim only for raw fast.
4. **Filters:** exact host, subdomain, path, URL, wildcard, IDN, redirect,
   include/exclude conflict, missing dates, publication/update mismatch, and date
   boundary inclusivity.
5. **Outputs:** text/image union; snippet truncation/stability; inline-citation
   mapping; structured schema rejection, strictness, and `includeSources` shape.
6. **Ranking/provenance:** repeat order stability, duplicate handling, content
   correspondence to timestamped lawful captures, and any response/header trace
   identifiers.
7. **Errors:** malformed bodies and natural no-result only; verify status, machine
   code, billing, and redaction. Do not induce overload or payment failure.
8. **Cost:** returned/ledger charges for every depth/output pair and x402 minimum;
   confirm failed calls are free.
9. **Privacy/supply:** written retention, training/improvement use, subprocessors,
   regions, ZDR scope, external data suppliers, deletion, and incident terms.
10. **Safety/legal:** result-level policy evidence, Search-internal scrape network
    controls, LinkedIn provenance, robots handling, and third-party content rights.

**Pass criteria:** stable versionable contract; deterministic bounded spend;
known hard/soft control semantics; sufficient evidence lineage; acceptable
retention/supplier/legal terms; and quality above an approved Curiosity baseline.
Otherwise the adapter remains deferred.

## 11. Unknowns and retained negative results

Reviewed public sources did **not** establish:

- exclusive first-party supply for every result;
- corpus size, language/geography/MIME coverage, crawl frontier, revisit policy,
  sitemap/feed handling, canonicalization, deduplication, or deletion SLA;
- crawl/index/cache age, freshness distributions, or stale fallback per result;
- lexical/vector/hybrid retrieval, query expansion, fusion, authority graph,
  reranker, model/provider, rank weights, score calibration, or personalization;
- query rewrite/sub-query manifest, internal candidates, source-use list, or
  standard/deep fetch/byte/token ceilings;
- `maxResults` default/maximum/integer enforcement and its interaction with
  images or generated-source counts;
- exact domain/URL grammar or authoritative include/exclude limits;
- response/request byte limits, caller deadline, cancellation, idempotency,
  `Retry-After`, partial results, or request/trace IDs;
- immutable document identity, source hash/version, passage offsets, capture
  time, extractor version, date evidence, supplier, or rank explanation;
- non-ZDR query/result/log retention, training/improvement use, full
  subprocessors, or default deletion schedule; or
- independently reproducible quality, safety, freshness, latency, and uptime.

These are not claims that the capabilities do not exist. They are limits on what
Curiosity can safely infer or contract against.

## 12. Bounded curiosity pass

After synthesis, in-frame gaps and contradictions were scored 1–5 for relevance
(R), decision value (V), novelty (N), and investigation cost (C), with priority
`R + V + N - C`. Caller authority covered public-source follow-up only.

| Thread | R/V/N/C | Priority | Outcome |
|---|---|---:|---|
| Own index versus wrapper | 5/5/5/1 | 14 | **Pursued.** Search, privacy, bot, migration, safety, and BYOC statements triangulate a material owned stack; exclusivity remains unknown [S1][S12–S17]. |
| Fast “no LLM” versus generated outputs | 5/5/4/1 | 13 | **Pursued.** Retrieval can be no-LLM while answer/schema generation invokes one; changelog contradiction retained [S1][S9]. |
| Source-filter limits | 5/4/4/1 | 12 | **Pursued.** 50/100/unlimited conflict retained; conservative 50 ceiling recommended [S1–S3][S5]. |
| Freshness semantics | 5/5/4/2 | 12 | **Pursued.** Index, page-acquisition, and publisher-date freshness separated; no public SLA/cadence found [S1][S3][S13]. |
| `maxResults` default/maximum | 5/4/4/1 | 12 | **Pursued.** Migration default conflicts with current schema; no maximum found [S2][S7]. |
| LinkedIn versus public-only crawl | 4/5/5/2 | 12 | **Pursued.** Contradiction retained; public evidence cannot resolve provenance/legal path [S3][S13][S15]. |
| Ranking algorithm/model internals | 5/4/3/5 | 7 | **CURIOSITY_NO_GO.** Undisclosed; no lawful public primary evidence sufficient to resolve. |
| Live quality/freshness benchmark | 5/4/3/5 | 7 | **CURIOSITY_NO_GO.** Requires credentials, calls, budget, and separate benchmark authority. |
| Privacy policy/client terms body | 5/5/3/4 | 9 | **CURIOSITY_NO_GO.** Public routes rendered loading shells/blank Notion content; no bypass attempted. Procurement must obtain readable controlling terms [S19]. |
| Trust-center reports | 3/4/2/4 | 5 | **CURIOSITY_NO_GO.** Gated artifacts exceed public-source authority; certification remains self-attested here. |
| Fetch/Extract/Research/Tasks | 1/1/1/4 | -1 | **CURIOSITY_NO_GO.** Explicitly out of frame. |

**Stop reason:** coverage and saturation. Every requested Search category has a
primary-source finding or explicit negative result. Remaining high-value gaps
require provider confirmation, readable contractual artifacts, credentials,
paid/free service calls, or a separate benchmark/security/legal frame.

## 13. Confidence summary

- **High:** current OpenAPI fields and response unions; depth descriptions;
  Search list prices; 10 QPS limit; documented error envelope; non-default ZDR;
  public source/date-limit contradictions.
- **High:** Linkup operates at least a material crawler/index/processing stack,
  based on multiple first-party statements; **not high** that every input/result
  is exclusively first-party.
- **Medium-high:** direct-index versus agentic/scrape pipeline separation and
  generation-stage interpretation.
- **Medium:** safety, quality, certification, latency, and privacy control
  existence/effectiveness because these are untested vendor statements.
- **Low/unknown:** actual relevance, freshness, coverage, supplier mix, ranking
  internals, ordinary retention, undocumented runtime limits, and legal treatment
  of specialized data.

## 14. Primary-source ledger

All sources are official/primary and were accessed 2026-08-17.

- **[S1]** Linkup, “Search overview” — modes, latency, output types, controls,
  prices. <https://docs.linkup.so/pages/documentation/endpoints/search/overview>
- **[S2]** Linkup, `POST /v1/search` OpenAPI rendering — authoritative request/
  response schema and operation errors.
  <https://docs.linkup.so/pages/documentation/endpoints/search/reference>
- **[S3]** Linkup, “Search best practices” — one-iteration standard, sequential
  deep, URL scraping, source/date caveat, LinkedIn behavior.
  <https://docs.linkup.so/pages/documentation/endpoints/search/best-practices>
- **[S4]** Linkup, “Search for AI agents” — up-to-10 deep iterations and
  integration-oriented mode constraints.
  <https://docs.linkup.so/pages/documentation/endpoints/search/for-agents>
- **[S5]** Linkup, “Source Filtering” — 50-item include/exclude claims,
  inclusion precedence, prompt-level priority.
  <https://docs.linkup.so/pages/documentation/tutorials/filtering>
- **[S6]** Linkup, “Structured Output Guide” — strict schema-shaped output and
  schema/query guidance.
  <https://docs.linkup.so/pages/documentation/tutorials/structured-output-guide>
- **[S7]** Linkup changelog, “maxResults parameter” — returned-result control,
  no declared maximum/default.
  <https://docs.linkup.so/pages/changelog/max-results>
- **[S8]** Linkup changelog, “Dates Filtering” — date controls and stale example
  containing a response `date` field.
  <https://docs.linkup.so/pages/changelog/datefiltering>
- **[S9]** Linkup, “Pricing,” and fast-depth launch note — point-in-time Search
  prices, successful-call billing, x402 floor, fast beta drift.
  <https://docs.linkup.so/pages/documentation/platform/pricing>,
  <https://docs.linkup.so/pages/changelog/fast-depth>
- **[S10]** Linkup, “Errors” — error envelope, statuses, SDK error distinctions.
  <https://docs.linkup.so/pages/documentation/platform/errors>
- **[S11]** Linkup, “Rate Limits” and “Authentication” — 10 QPS scope, bearer
  auth, x402 alternative.
  <https://docs.linkup.so/pages/documentation/platform/rate-limits>,
  <https://docs.linkup.so/pages/documentation/platform/authentication>
- **[S12]** Linkup, “Data processing and privacy” — processing regions, ZDR,
  own index/processing-stack claim.
  <https://docs.linkup.so/pages/security-and-privacy/data-processing-privacy>
- **[S13]** Linkup, “Content safety and index controls” — safety categories,
  quality model, crawl safeguards, enterprise refresh/ranking controls.
  <https://docs.linkup.so/pages/security-and-privacy/content-safety-index-controls>
- **[S14]** Linkup, “Security and compliance” — certifications, encryption,
  enterprise controls, BYOC.
  <https://docs.linkup.so/pages/security-and-privacy/security-compliance>
- **[S15]** Linkup, security/privacy FAQ and overview — defaults, public-content
  claim, configurable controls.
  <https://docs.linkup.so/pages/security-and-privacy/faq>,
  <https://docs.linkup.so/pages/security-and-privacy/overview>
- **[S16]** Linkup, “LinkupBot” — public identification as crawler behind the
  search index; detailed body did not render in the available path.
  <https://www.linkup.so/bot>
- **[S17]** Linkup, “Migrating from SerpAPI” and “Migrating from Tavily” —
  proprietary/AI-native index claim and examples exposing documentation drift.
  <https://docs.linkup.so/pages/documentation/tutorials/migrating-from-serpapi>,
  <https://docs.linkup.so/pages/documentation/tutorials/migrating-from-tavily>
- **[S18]** Linkup official JavaScript SDK `types.ts`, client, and MIT license —
  public Search transport/types and license boundary.
  <https://github.com/LinkupPlatform/linkup-js-sdk/blob/main/src/types.ts>,
  <https://github.com/LinkupPlatform/linkup-js-sdk/blob/main/src/linkup-client.ts>,
  <https://github.com/LinkupPlatform/linkup-js-sdk/blob/main/LICENSE>
- **[S19]** Linkup public privacy policy, terms-of-use route, and linked client
  terms — official locations; substantive bodies did not render through the
  available public read-only path, retained as a negative result.
  <https://www.linkup.so/privacy-policy>,
  <https://www.linkup.so/terms-of-use>,
  <https://linkup-platform.notion.site/Linkup-Client-General-Terms-and-Conditions-13f161ecef69806784dfe808b4e162a1>
