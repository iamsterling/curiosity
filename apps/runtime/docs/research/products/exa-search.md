# Exa Search: clean-room product and architecture study

**Research date / source access date:** 2026-08-17
**Decision:** what Exa Search reveals about building a wholly owned public-web
retrieval stack for Curiosity.
**Scope:** Exa's synchronous `POST /search` product, its directly coupled content
retrieval, and public clues about the crawl/index/ranking machinery beneath it.
Agent, Websets, Answer, Connect, and Monitors are considered only where they
clarify the Search boundary.
**Status:** research evidence and recommendations, not an implementation,
benchmark, legal opinion, or production change.

## 1. Decision frame and method

### Bounded sub-questions

1. What is the current Search API contract, including bounds and failure modes?
2. Which retrieval, ranking, crawl, index, freshness, safety, and economics
   properties are documented versus merely inferable?
3. Which product ideas transfer clean-room into a wholly owned stack, and which
   create vendor, privacy, legal, or epistemic risk?
4. Which Exa-like capabilities could improve Curiosity without giving an agent
   broader authority or treating generated output as evidence?

**Method and boundaries.** Primary Exa documentation, Exa's current OpenAPI
specification, Exa engineering posts, its crawler declaration, privacy policy,
and pricing/security pages were read without credentials or paid calls. No API
quality or latency claim was independently tested; no private endpoint, source
code, model, index, or restricted content was accessed; and no Exa code or data
was copied. Public implementation descriptions are treated as architectural
evidence, not as a license to reproduce proprietary details. All web sources in
the source ledger were accessed 2026-08-17.

Labels:

- **FACT** — stated in a cited primary source.
- **INFERENCE** — a bounded conclusion from facts, not directly verified.
- **RECOMMENDATION** — a proposed Curiosity/owned-stack choice.
- Confidence is **high**, **medium**, or **low**.

## 2. Executive conclusion

**RECOMMENDATION — ADAPT, never adopt as the foundation (high confidence).**
Exa is unusually informative because it publicly describes a genuinely owned
search stack: first-party crawling, web-scale preprocessing, dense and sparse
retrieval paths, specialized models, multi-stage reranking, diversity/safety,
and bounded content delivery. Its strongest transferable pattern is not
"neural search" alone; it is a layered retrieval system in which query mode,
candidate generation, filters, reranking, content freshness, output budget, and
cost are explicit decisions.

Do **not** make Exa the production foundation for a wholly owned stack. Its
index, models, ranking weights, training data, coverage, freshness schedules,
and most relevance signals remain proprietary and unauditable. Its public API
does not expose a general result score, stable pagination, versioned evidence,
or a retrieval explanation. Default query handling also permits query data to
be used for model training; Zero Data Retention (ZDR) is Enterprise-only [S10,
S11].

The owned-stack lesson is therefore:

```text
policy-bounded discovery and crawl
  -> immutable document/version evidence
  -> lexical + dense candidate lanes
  -> filter before/within retrieval where possible
  -> explicit fusion and learned/heuristic reranking
  -> authority, diversity, safety and freshness stages
  -> bounded passages plus provenance (not generated summaries as evidence)
  -> per-stage trace, confidence and cost
```

## 3. Product boundary and API contract

### 3.1 Endpoint, authentication, and transport

**FACT (high):** Search is `POST https://api.exa.ai/search`, accepts JSON, and
supports either `x-api-key` or `Authorization: Bearer` authentication. The
required body field is a non-empty `query`. Normal success is JSON; when
`stream: true` is used with synthesis, the endpoint can return Server-Sent
Events (SSE). The canonical OpenAPI version identifies itself as Exa Public API
2.0.0 [S1, S2].

**FACT (high):** the synchronous endpoint is not a traditional page/cursor
SERP. `numResults` defaults to 10 and is publicly bounded to 1–100. The Search
request and response schema contain no `page`, `offset`, `cursor`, `nextCursor`,
or continuation token. Enterprise advertises up to 1,000 results per search,
but that is custom-plan capability, not the public contract [S1, S9].

**INFERENCE (high):** consumers cannot reliably enumerate a deep result set or
resume from a stable rank boundary. Reissuing date/domain partitions is an
application workaround, not stable pagination, and may duplicate or omit pages
as the index/ranker changes.

### 3.2 Query modes

| `type` | Documented role | Approximate vendor latency | Current price class |
| --- | --- | ---: | ---: |
| `instant` | minimum response time; chat, voice, autocomplete | ~250 ms in docs; launch claimed sub-200 ms | Search |
| `fast` | low latency with stronger quality than Instant | ~450 ms | Search |
| `auto` (default) | balance quality and speed | ~1 s | Search |
| `deep-lite` | lightweight research and synthesis | ~4 s | $12/1k base |
| `deep` | multi-step planning/search/reasoning and synthesis | 4–15 s | $12/1k base |
| `deep-reasoning` | strongest reasoning for difficult analysis | 12–40 s | $15/1k base |

**FACT (high):** these are the only current enum values in the OpenAPI schema.
`neural` appears in legacy examples/cost fields but current guidance says not to
use it for new integrations. `additionalQueries` accepts 1–10 query variants
only for deep modes. `systemPrompt` guides synthesis and deep planning.
`outputSchema` asks for synthesized text or an object and works with every mode;
it adds roughly two seconds and has documented limits of depth 2 and ten total
properties. SSE is useful only when synthesis is requested [S1, S2, S3].

**INFERENCE (medium):** the type selector is a compute/latency policy switch,
not merely a choice between fixed rankers. The deep modes clearly add planning
and synthesis; public material does not disclose the exact query count, stopping
rule, models, or per-mode candidate/ranking graph.

### 3.3 Filters, categories, and controls

| Control | Current behavior and bound |
| --- | --- |
| Domains/paths | `includeDomains` and `excludeDomains`, each up to 1,200 entries; hostname, path prefix, and wildcard subdomain forms are documented. Exa says not to duplicate them with `site:` syntax. |
| Publication time | `startPublishedDate` / `endPublishedDate`, ISO 8601. The result date is an **estimate** derived from parsed HTML, not a guaranteed publisher timestamp. |
| Crawl time | `startCrawlDate` / `endCrawlDate` are deprecated, ignored, and therefore cannot constrain index observation time. |
| Location | `userLocation` is a two-letter ISO country code. No city, language, market, or explicit result-language field exists in the canonical Search request. |
| Safety | `moderation` defaults to `false`; `true` filters unsafe results. |
| Categories | Known values: `company`, `people`, `publication`, `news`, `personal site`, `financial report`. Other strings may be accepted as hints even though the schema lists an enum. |
| Text predicates | No `includeText` or `excludeText` field appears in the current 2.0 OpenAPI `SearchRequest`. Older integrations mentioning such fields should not be assumed current. |
| Sorting | No public sort-by-date, sort-by-score, order, freshness-boost, or diversity control is exposed. |

**FACT (high):** `company` and `people` reject publication date filters and
`excludeDomains` with HTTP 400. `publication` is described as surfacing papers,
preprints, and journal articles with structured scholarly metadata, while news,
personal-site, and financial-report categories select specialized coverage
[S1–S3].

**FACT (medium):** Exa's index guide self-rates research papers, personal pages,
Wikipedia, news, LinkedIn people (US+EU), LinkedIn companies, company homepages,
and financial reports as “Very High”; GitHub, blogs, places, legal/policy, and
government sources as “High”; and events/jobs as “Moderate” [S6]. These are
vendor descriptions, not independently audited corpus measurements.

**INFERENCE (high):** category is more than a simple metadata filter for at
least people/company/publication. Different filter restrictions and Exa's
references to in-house indexes imply specialized corpora, metadata, and/or
ranking paths. Exact routing and overlap with the general web index are unknown.

### 3.4 Search plus content retrieval

`contents` is nested under `/search` and can request:

- `text`: plain/Markdown-style extracted content, or options including
  `maxCharacters` (canonical max 10,000), HTML tags, verbosity, and best-effort
  semantic section include/exclude controls;
- `highlights`: query-relevant excerpts, optionally guided by another query and
  capped by `maxCharacters` (max 10,000);
- `summary`: LLM-generated page summary, optionally guided and schema-shaped;
- `extras`: links, image links, rich links/images, and code blocks, each publicly
  bounded up to 1,000 per page in the OpenAPI schema;
- `subpages`: 0–100 requested subpages with a string or list of targets, though
  the actual count may be system-limited;
- freshness controls `maxAgeHours` (-1–720) and `livecrawlTimeout` (>0 through
  90,000 ms) [S1, S2].

**FACT (high):** Exa recommends highlights for agent workflows and claims about
10x fewer tokens than full text. `numSentences`, `highlightsPerUrl`, `context`,
and string `livecrawl` are deprecated; content options on `/search` must be
nested even though they are top-level on `/contents` [S2–S4].

**RECOMMENDATION (high):** adapt the “retrieve passages by default, fetch full
text only on demand” pattern, but do not adapt generated page summaries as
primary evidence. Every owned excerpt should carry document-version ID,
extractor version, byte/text offsets, and a hash; generated summaries should be
clearly derived artifacts with cited source spans.

## 4. Response semantics, ranking, scores, and bounds

### 4.1 Result metadata

**FACT (high):** a result can contain `title`, `url`, temporary `id`, estimated
`publishedDate`, nullable `author`, `image`, and `favicon`, plus requested
`text`, `highlights`, `highlightScores`, `summary`, `subpages`, and `extras`.
Top-level fields include `requestId`, `results`, optional synthesized `output`,
and `costDollars`. The legacy `resolvedSearchType` and combined `context` fields
are deprecated; clients are warned not to branch on `resolvedSearchType` [S1,
S2].

**FACT (high):** `highlightScores` are cosine-similarity scores for highlighted
snippets. They are **not** documented as document rank scores. The current
Search result schema exposes no general `score`, per-stage feature vector,
retrieval lane, rank explanation, crawl timestamp, content hash, canonical URL,
or document version [S1].

**INFERENCE (high):** result order is the only public document-level ranking
signal. A consumer cannot calibrate score thresholds, distinguish lexical from
dense candidates, audit authority/freshness/diversity contributions, or compare
scores across requests. Even highlight cosine values should not be interpreted
as answer confidence.

### 4.2 Synthesized output and grounding

**FACT (high):** when `outputSchema` is present, `output.content` is synthesized
and `output.grounding` can identify field paths, source `{url,title}` pairs, and
model-reported `low|medium|high` confidence. Streaming emits typed chunks for
text deltas, grounding, results, reset, completion, and errors [S1, S2].

**RECOMMENDATION (high):** adapt field-level evidence mapping, but label the
confidence source. “Model-reported confidence” must never be promoted into an
objective retrieval or factual probability. Curiosity should calculate its own
evidence sufficiency from source provenance, independence, recency, and
contradiction state.

### 4.3 Bounds and errors

**FACT (high):** default `/search` capacity is 10 QPS. Current error guidance
lists 400 malformed/conflicting requests, 401 auth, 402 exhausted credits or
budgets, 403 permission/policy, 404 missing resource, 422 processing failure,
429 rate limit, and transient 500/502/503 classes. Most errors carry
`requestId`, a human-readable `error`, and a machine `tag`; 429 may return only
`error`. Tags distinguish invalid request bodies, invalid URLs/result counts,
feature access, policy filtering, exhausted budgets, and internal failures.
Exponential backoff is recommended for 429 and transient server failures [S7,
S8].

**INFERENCE (high):** the endpoint has useful request/result ceilings, but its
response-volume bound is multiplicative: up to 100 results × text/highlights ×
subpages × extracted links can still be very large. A safe provider-neutral
adapter must enforce independent byte, item, nesting, wall-clock, and per-host
budgets rather than trust vendor maxima.

## 5. Freshness and crawl ownership

### 5.1 Two different freshness questions

**FACT (high):** `startPublishedDate`/`endPublishedDate` filter ranked links by
an estimated creation date. `contents.maxAgeHours` controls the age of cached
page content returned after selection:

- positive value: use cache if younger; otherwise live-fetch;
- `0`: always live-fetch;
- `-1`: cache only;
- omitted: cached content with live fetch as fallback if unavailable.

When a live fetch fails or times out under a positive threshold, Exa documents
a fallback to cached content. The old `livecrawl` strings are deprecated [S4].

**INFERENCE (high):** live crawling freshens the returned representation of a
selected URL; it does not prove the search index or candidate set was recrawled,
re-embedded, or reranked at that moment. Exa exposes no current crawl-date
filter, so “fresh page text” and “fresh discovery” must not be conflated.

### 5.2 First-party crawler and index control

**FACT (high):** Exa identifies `ExaSearchBot` as its public-web discovery and
indexing crawler. It declares an identifiable user agent and robots product
token, signed requests using RFC 9421/Web Bot Auth and published Ed25519 keys,
per-site rate limiting, robots compliance, `noindex` removal after re-fetch, and
no attempts to bypass logins, paywalls, CAPTCHAs, or forms [S12].

**FACT (high):** Exa says its broader crawler continuously discovers URLs,
fetches them across distributed machines and IPs, parses HTML with a custom
parser, and stores documents in S3. It describes billions of gathered documents;
the 2026 Instant post describes retrieval over tens of billions of pages. Exa's
home/research material also says it trains, embeds, and serves its own index and
models [S13, S14]. These are first-party claims, not an externally audited index
inventory.

**RECOMMENDATION (high):** adopt verifiable crawler identity, explicit robots
and `noindex` behavior, conservative host budgets, and an index-removal path.
Adapt—not copy—the architecture. An owned crawler also needs immutable robots
decision evidence, redirect/DNS/SSRF controls, raw capture retention policy,
revisit scheduling, canonical/version lineage, legal basis, deletion SLAs, and
coverage telemetry; Exa's public declaration does not fully specify these.

## 6. Retrieval and ranking reverse engineering

### 6.1 What is directly documented

**FACT (high):** Exa describes specialized transformers that convert a document
to one or more embeddings and a query to an embedding. Its 2024 vector-system
post reports:

- Matryoshka-trained embeddings, truncating 4,096 dimensions to 256 for the
  first-stage representation;
- binary-quantized document vectors while retaining floating query vectors;
- a custom dot-product lookup strategy using CPU registers/SIMD-oriented work;
- roughly 100,000 semantic clusters, searching selected nearby clusters rather
  than every vector;
- over-retrieval followed by reranking against uncompressed data to recover
  recall;
- inverted indexes over filterable values such as category/date/domain/keyword;
- a custom query language for composing multi-stage scoring pipelines [S15].

These are historical/public design disclosures, not a guarantee that every 2026
mode uses the same dimensions, quantization, cluster count, or serving path.

**FACT (high):** Exa's April 2026 Canon post depicts a query pipeline with query
enrichment, routing, replicated query encoders, sharded ANN/scorer workers,
diversity and safe-search stages, relevance/authority reranking, content
retrieval, and response assembly. It states that classification, localization,
retrieval, and ranking across multiple indexes execute concurrently. An example
graph combines a dense web lane and sparse inverted-index lane with Reciprocal
Rank Fusion (RRF); a runtime example races web, inverted, and news indexes,
cancels losing branches, then reranks and runs snippet extraction and safety in
parallel [S16].

### 6.2 Lexical, neural, and hybrid interpretation

**FACT (high):** neural/dense retrieval is foundational, and sparse/inverted
retrieval exists. Authority, diversity, safe-search, localization, freshness,
and multiple index routes are explicit pipeline concepts [S13, S15, S16].

**INFERENCE (medium-high):** Exa has the machinery for hybrid candidate
generation and fusion. The dense+sparse RRF graph is presented as a composable
example, not an assertion that every public `auto`, `fast`, or `instant` request
uses that exact graph. Public sources do not reveal the production BM25 variant,
tokenization, fusion constants, candidate depths, reranker model/features,
authority graph, freshness function, spam model, or mode-specific weights.

**INFERENCE (medium):** category and latency mode likely select different DAGs,
indexes, candidate depths, model sizes, or race/cancellation policies. That is
consistent with Canon and mode behavior, but Exa does not publish a mode-to-node
mapping.

### 6.3 Index preprocessing and update architecture

**FACT (high):** Exa's 2026 `exa-d` article describes an in-house web processing
framework where extracted text, metadata, embeddings, and other search signals
are typed columns in a dependency DAG. Data is stored in Lance fragments on S3;
columns/fragments can be patched without rewriting unrelated data. Jobs compile
to Ray Data pipelines, and stateful actors keep models loaded while CPU, GPU,
network, and storage work is pipelined. The same missing/invalid-column plan is
used for incremental updates, backfills, model migrations, and recovery [S17].

**INFERENCE (high):** separating immutable/raw captures from versioned derived
columns is a major operational advantage: a parser or embedding update can be
recomputed without re-fetching every page, and completeness can be measured per
artifact. The exact storage choices are not essential to the transferable
principle.

### 6.4 Negative results retained

The following material facts were **not** found in the accessed official public
sources:

- complete crawl frontier policy, revisit algorithm, sitemap/feed handling,
  canonicalization, deduplication, spam defenses, or deletion SLA;
- exact 2026 index size by unique canonical document, language, region, host, or
  category; coverage and recall audits; crawl/embedding lag distributions;
- production lexical formula, dense model architecture/size, training corpus,
  labels, negative mining, or model/version identifiers;
- production fusion and reranking weights, authority/link graph, freshness
  feature, personalization behavior, or result diversity guarantees;
- general document scores, feature explanations, stable pagination, deterministic
  snapshots, content hashes, or immutable citation/version identifiers;
- public retention duration for ordinary API Query Data, regional processing/data
  residency specifics, or a public Search-specific ZDR default;
- independently reproducible quality, latency, freshness, or comparative
  economics at equal relevance targets.

These unknowns prevent an audit of Exa's claimed relevance and freshness. They
do not negate the architectural evidence.

## 7. Safety, privacy, compliance, and trust boundaries

### 7.1 Result safety

**FACT (high):** Search moderation is opt-in and defaults false. A policy block
may return `403 CONTENT_FILTER_ERROR`. Exa's architecture depicts a safety stage
after retrieval/reranking; Enterprise offers tailored moderation [S1, S7, S9,
S16].

**RECOMMENDATION (high):** Curiosity must continue to treat all fetched text,
metadata, summaries, schemas, and instructions as untrusted external data.
Safety needs controls at discovery, fetch, parse, storage, retrieval, and agent
rendering—not one optional rank-stage flag. Preserve raw evidence separately
from executable/tool context and defend against prompt injection, malicious
markup, oversized/decompression content, poisoned metadata, and unsafe links.

### 7.2 Query privacy and enterprise controls

**FACT (high):** Exa's privacy policy says open query fields are not intended
for personal information, are not actively monitored for it, and Query Data is
used to improve products and to train/fine-tune models. It also describes
collection of account, device, IP-derived location, interaction, and partner/
public-source data. For business offerings where Exa is a processor, customer
agreements govern processing [S10].

**FACT (high):** Exa is SOC 2 Type II certified according to its security page;
Enterprise can negotiate ZDR, HIPAA, DPA/MSA, SSO, SLAs, and custom security.
HIPAA mode is per request, Enterprise-enabled, and includes ZDR for those
requests, but Search is limited to cache-only `instant`/`fast` retrieval with
text/highlights and no summaries or freshness fetches. Regional sanctions may
be enforced by Cloudflare before Exa, producing a WAF page rather than normal
JSON [S9, S11, S18].

**INFERENCE (high):** ordinary API use should be assumed non-ZDR unless contract
terms state otherwise. Sensitive Curiosity branches, unpublished hypotheses,
customer identifiers, credentials, and personal data should not be sent to a
hosted search provider. A wholly owned stack removes this vendor disclosure path
but still needs internal query minimization, access controls, retention limits,
auditability, and deletion.

## 8. Pricing and economics

**FACT (high, point-in-time):** current documented PAYGO pricing is:

| Component | Price |
| --- | ---: |
| Search (`instant`/`fast`/`auto`) | $7 / 1,000 requests, first 10 results included |
| `deep-lite` / `deep` | $12 / 1,000 requests, first 10 included |
| `deep-reasoning` | $15 / 1,000 requests, first 10 included |
| Results above 10 | $1 / 1,000 additional results |
| AI page summaries | $1 / 1,000 pages |
| `/contents` | $1 / 1,000 pages **per content type** |

There is no subscription/minimum in PAYGO; credits are prepaid. New accounts are
advertised with $20 initial credits and the free tier with $10 monthly credits.
Enterprise adds volume discounts, postpaid invoicing, custom indexes/QPS, and up
to 1,000 results [S9].

**INFERENCE (high):** a nominal ten-result standard search costs $0.007 before
downstream LLM tokens. At one million such searches, the list-retrieval line is
about $7,000; 20 results/request adds about $10,000 per million calls. Requesting
text plus highlights through `/contents` doubles the per-page content-type
charge, while summaries add another generation charge. Live-crawl operational
cost is hidden inside the service price rather than metered transparently.

**INFERENCE (medium):** Exa's price is a useful external upper/lower comparison,
not a make-versus-build proof. Owned search transfers spend into crawl egress,
storage, parsing, embedding/backfills, lexical/vector replicas, GPUs/CPUs,
relevance judgments, abuse operations, and on-call labor. Cost must be compared
at matched corpus, quality, freshness, latency, availability, and evidence
requirements—not API calls alone.

## 9. Clean-room lessons for the owned stack

### Adopted

1. **ADOPT — explicit latency/quality modes (high confidence).** Define modes by
   budgets and permitted stages, not opaque brand names: e.g. lexical-fast,
   hybrid-balanced, and bounded-research. Return the resolved plan and costs.
2. **ADOPT — multi-stage retrieval (high).** Keep exact lexical and dense
   candidate lanes independently measurable; fuse explicitly; rerank only a
   bounded pool; then apply authority, freshness, diversity, policy, and evidence
   packaging.
3. **ADOPT — filter-aware indexes (high).** Apply host/path, time, language,
   source class, and policy constraints during candidate generation whenever
   possible, not only after top-k.
4. **ADOPT — derived-artifact DAG (high).** Version every parser, metadata
   extractor, embedding, spam signal, and rank feature; make missing/stale
   artifacts observable and incrementally repairable.
5. **ADOPT — passages by default (high).** Return bounded evidence passages;
   retrieve full text only when the caller's declared frame and budget require
   it.
6. **ADOPT — typed failure/cost telemetry (high).** Stable machine tags,
   request/trace IDs, partial-stage status, retries, and per-stage resource
   counters belong in the provider-neutral contract.

### Adapted

1. **ADAPT — category routing (high).** Use a provider-neutral source taxonomy
   and inspectable route decision; do not hard-code vendor labels or silently
   substitute specialized corpora.
2. **ADAPT — field-level grounding (high).** Ground generated fields to immutable
   document versions and passage hashes, not mutable URLs alone.
3. **ADAPT — freshness controls (high).** Separate discovery freshness, index
   freshness, page-fetch freshness, extraction freshness, and publication time.
   Expose stale fallback explicitly.
4. **ADAPT — pipeline DAG orchestration (medium-high).** Parallelism,
   cancellation, memoization, and per-node traces are useful; the owned design
   should arise from Curiosity's constraints rather than reproduce Exa's Canon
   interfaces or implementation.
5. **ADAPT — verifiable crawler identity (high).** Public bot declaration and
   signed identity are desirable, subject to standards/security review and a
   project-owned implementation.

### Rejected

1. **REJECT — hosted Exa as owned foundation (high).** It violates crawl/index/
   ranking ownership and creates a query-data dependency.
2. **REJECT — dense-only retrieval (high).** Exact names, identifiers, quotes,
   dates, code tokens, and negations require a first-class lexical lane.
3. **REJECT — opaque auto mode in the internal contract (high).** An adapter may
   map to vendor auto, but the owned plane must report its selected route,
   versions, bounds, and fallbacks.
4. **REJECT — result order as sufficient evidence (high).** Preserve rank-stage
   provenance and bounded feature classes; never expose proprietary-sensitive
   internals to agents if that would increase attackability.
5. **REJECT — model summary/confidence as source truth (high).** Store it as a
   derived claim with grounding and independent verification state.

### Deferred

1. **DEFER — Exa-scale dense infrastructure (high).** Prove corpus legality,
   lexical baseline, relevance judgments, and versioned evidence before
   web-scale ANN/GPU investment.
2. **DEFER — deep multi-query search (medium-high).** First define branch and
   compute ceilings, loop authority, duplicate controls, and evaluation against
   single-query baselines.
3. **DEFER — custom vertical indexes (medium).** Add only where judged-query
   evidence shows general retrieval cannot meet a material need.

## 10. Curiosity-specific implications

**RECOMMENDATION (high):** Curiosity should consume a bounded retrieval envelope,
not a vendor-shaped result list:

```text
query_id, parent_query_id, declared_intent/facet, execution_mode
retrieval_plan_id + lexical/dense/filter/rerank versions
hard budgets: results, candidates, bytes, passages, wall time, branches, cost
per result: document_id, version_id, fetched_at, first/last_seen,
            claimed_published_at + provenance,
            canonical/duplicate cluster, source/publisher class,
            passage offsets/hash, retrieval lanes, rank-stage trace,
            policy flags, freshness/fallback state
coverage and partial-failure warnings
```

This enables the bounded curiosity pass to ask whether a top gap is caused by
missing evidence, stale coverage, rank suppression, source monoculture, or a
true contradiction. Curiosity may propose a follow-up only inside the caller's
declared frame and budget; it must not autonomously crawl a new scope, increase
compute mode, or turn a page instruction into a tool call.

Useful curiosity signals adapted from the Exa study:

- semantic distance can identify related evidence, but novelty should also use
  canonical/publisher clusters and claim overlap;
- lexical-only and dense-only wins are disagreement signals worth inspecting;
- freshness should score each timestamp dimension separately;
- category/router uncertainty should be visible rather than silently resolved;
- source authority and diversity should be distinct so several mirrors do not
  masquerade as corroboration;
- synthesis confidence should never override contradictory primary evidence;
- additional query variants are a bounded research action with explicit parent,
  expected value, and stop condition.

## 11. Risks and unknowns

| Risk / unknown | Assessment | Owned-stack response |
| --- | --- | --- |
| Proprietary quality claims | High uncertainty; no paid benchmark run | Build a versioned judged set; compare lexical, dense, hybrid, and rerank ablations. |
| Index coverage and bias | Vendor self-ratings only; people coverage is region-skewed | Publish corpus cards and coverage gaps by language, region, source class, time, and policy. |
| Training-data provenance | Undisclosed | Maintain source/license/policy lineage for every training and evaluation example. |
| Query privacy | Ordinary Query Data may train models | Keep sensitive queries in the owned plane; minimize and expire query logs. |
| Freshness ambiguity | Search discovery freshness is not exposed | Measure fetch-to-index and index-to-query lag; return every relevant timestamp. |
| Ranking opacity | No document score/explanation | Store bounded stage traces and offline feature contributions; protect abuse-sensitive signals. |
| Citation drift | URL and temporary ID do not identify immutable content | Cite capture/version/passage hashes and preserve replayable evidence. |
| Enumeration limits | No stable Search pagination | Use owned snapshot/cursor semantics for collection jobs; hard-cap interactive search separately. |
| Neural poisoning/adversarial SEO | Public web and embeddings are attackable | Multi-lane retrieval, spam/policy models, provenance, anomaly detection, and adversarial evaluation. |
| Crawl rights and publisher preferences | Public accessibility is not blanket reuse permission | Policy registry, robots/noindex evidence, legal review, deletion workflow, and per-use rights checks. |
| Cost extrapolation | Hosted unit prices hide shared infrastructure/economies | Model full lifecycle cost and quality-normalized throughput before scaling. |

## 12. Bounded curiosity pass

After synthesis, the remaining in-frame gaps were scored 1–5 (higher is more)
for relevance (R), decision value (V), novelty (N), and research cost (C). The
priority heuristic was `R + V + N - C`; only primary-source threads able to
change the clean-room decision were eligible.

| Thread | R | V | N | C | Score | Action/result |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Verify hybrid retrieval is real rather than marketing shorthand | 5 | 5 | 5 | 2 | 13 | **Pursued.** Canon provides dense+sparse RRF and multi-index pipeline examples, but exact production defaults remain unknown [S16]. |
| Separate content livecrawl from index freshness | 5 | 5 | 4 | 1 | 13 | **Pursued.** Current docs confirm cache/live-fetch semantics and deprecated crawl-date search filters [S1, S4]. |
| Verify first-party crawl ownership and publisher controls | 5 | 5 | 4 | 1 | 13 | **Pursued.** ExaSearchBot declaration supplies robots, signed identity, public-only behavior, and removal instructions [S12]. |
| Find exact model/training/ranker weights | 4 | 4 | 5 | 5 | 8 | **CURIOSITY_NO_GO.** Proprietary and not publicly specified; further searching would invite speculation or boundary crossing. |
| Run paid/API quality and freshness benchmark | 5 | 5 | 4 | 5 | 9 | **CURIOSITY_NO_GO.** Caller forbade credentials/paid calls; a no-call review cannot validate live quality. |
| Reverse engineer SDK or service binaries | 2 | 2 | 3 | 5 | 2 | **CURIOSITY_NO_GO.** Unnecessary, outside clean-room/API scope, and higher legal/license risk. |
| Investigate every adjacent Exa product | 2 | 2 | 2 | 4 | 2 | **CURIOSITY_NO_GO.** Agent/Websets/Connect do not change the standalone owned-Search verdict. |

**Stop condition reached:** requested categories have primary-source coverage;
additional accessible material repeated the same capability classes; the
highest-value unresolved items require vendor disclosure or authorized empirical
testing. No live autonomous follow-up was initiated.

## 13. Source ledger

All sources are official/primary and were accessed 2026-08-17.

- **[S1]** Exa, [Search OpenAPI reference](https://exa.ai/docs/reference/search)
  (request/response schemas, bounds, modes, filters, content options, streaming,
  scores, deprecated fields).
- **[S2]** Exa, [Search API Reference for coding agents](https://exa.ai/docs/reference/search-api-guide-for-coding-agents)
  (current integration semantics, latency, errors, categories, output grounding).
- **[S3]** Exa, [Search Best Practices](https://exa.ai/docs/reference/search-best-practices)
  (mode intent, token-efficiency and structured-output guidance).
- **[S4]** Exa, [Content Freshness](https://exa.ai/docs/reference/livecrawling-contents)
  (`maxAgeHours`, live fetch, cache fallback, deprecated controls).
- **[S5]** Exa, [Contents API Reference](https://exa.ai/docs/reference/contents-api-guide-for-coding-agents)
  (content metadata and subpage/extras boundary).
- **[S6]** Exa, [The Exa Index](https://exa.ai/docs/reference/the-exa-index)
  (vendor-stated category coverage).
- **[S7]** Exa, [Error Codes](https://exa.ai/docs/reference/error-codes)
  (HTTP classes, stable tags, retry guidance, policy errors).
- **[S8]** Exa, [Rate Limits](https://exa.ai/docs/reference/rate-limits)
  (default endpoint QPS).
- **[S9]** Exa, [Pricing](https://exa.ai/docs/reference/pricing)
  (PAYGO dimensions, free credits, Deep and Enterprise economics).
- **[S10]** Exa Labs, [Privacy Policy](https://exa.ai/privacy-policy), updated
  2026-06-29 (Query Data, training, collection and disclosure).
- **[S11]** Exa, [HIPAA](https://exa.ai/docs/reference/security/hipaa)
  (per-request ZDR and cache-only restrictions).
- **[S12]** Exa, [Exa Search Crawler](https://crawler.exa.ai/), updated
  2026-07-30 (first-party bot, signed identity, robots/noindex, access limits).
- **[S13]** Will Bryk / Exa, [How we're building the next generation of search](https://exa.ai/blog/how-to-build-nextgen-search),
  2025-03-11 (crawl, parser, S3, embeddings, model training, serving stack).
- **[S14]** Will Bryk / Exa, [Introducing Exa Instant](https://exa.ai/blog/exa-instant),
  2026-02-12 (index scale and vendor latency benchmark methodology/claim).
- **[S15]** Exa, [How we built a web-scale vector database](https://exa.ai/blog/building-web-scale-vector-db),
  2024-12-17 (dense index, compression, clustering, filters, reranking).
- **[S16]** Rohit Prakash and Nitya Sridhar / Exa,
  [Composing a Search Engine](https://exa.ai/blog/composing-a-search-engine),
  2026-04-17 (Canon DAG, dense/sparse fusion example, multi-index routing,
  authority/diversity/safety and execution behavior).
- **[S17]** Hubert Yuan and Nitya Sridhar / Exa,
  [exa-d: Data Framework to Process the Web](https://exa.ai/blog/exa-d),
  2026-01-13 (typed derived columns, Lance/S3 storage, Ray processing,
  incremental index maintenance).
- **[S18]** Exa, [Enterprise Documentation & Security](https://exa.ai/docs/reference/security)
  (SOC 2 Type II, ZDR/HIPAA availability, regional access behavior).

## 14. Final confidence and verdict

**Overall confidence: high** for the current public API, pricing, privacy,
crawler declaration, and existence of dense/sparse/multi-stage architecture;
**medium** for conclusions about which pipelines public modes actually execute;
**low/unknown** for comparative quality, corpus coverage, rank weights, training
provenance, and live freshness.

**Final verdict:** **ADOPT** the layered, bounded, filter-aware, passage-first
architecture; **ADAPT** categories, grounding, freshness controls, and DAG
orchestration into provider-neutral, versioned evidence contracts; **REJECT**
Exa as the owned foundation, dense-only retrieval, opaque auto-routing, and
generated confidence as truth; **DEFER** web-scale ANN and deep multi-query
research until a legally bounded lexical corpus, immutable evidence model, and
judged evaluation suite pass explicit gates.
