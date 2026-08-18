# Owned public-web search for Curiosity: research and architecture dossier

**Date:** 2026-08-17
**Decision:** whether and how to replace the current metasearch-backed discovery
path with an owned-semantics, locally installable public-web search system that
strengthens Curiosity without widening agent authority.
**Related decision:** [ADR 0021](../decisions/0021-owned-public-web-search.md)
**Status:** research recommendation, not an implementation or deployment record.

## Executive conclusion

**Recommendation — PROPOSE, staged (high confidence):** build an owned search
semantic core from scratch, beginning as an installable local single-node
runtime over a deliberately bounded, legally reviewed corpus cell. Own
crawler/frontier policy, extraction semantics, document identity/versioning,
lexical index, ranking, evidence/provenance, and authority. Preserve `web_search`
as the provider-neutral agent ABI and integrate first through a native OpenCode
adapter; MCP is optional and later. Do not use a third-party search API,
metasearch engine, crawler, external index, hosted answer engine, copied
implementation, or bundled corpus as the foundation.

“From scratch” applies to search semantics, not every infrastructure primitive.
Separately reviewed commodity OS/runtime/TLS/database/object-storage/compression/
observability libraries may be permitted behind replaceable boundaries and a
dependency/license ledger. Products and open-source projects in this report are
evidence and learning sources unless such a narrow infrastructure dependency is
separately approved.

The first useful system is not “the whole web.” It is a reliable chain of
custody for a small corpus: discovery -> robots/policy decision -> polite fetch
-> fail-closed illegal-content pre-capture gate -> immutable capture -> extraction
-> canonical document/version -> lexical
index -> retrieval/diversification -> bounded agent response -> offline and
online evaluation. Add vectors, learned ranking, rendering, and global breadth
only after the preceding stage passes explicit gates. Common Crawl's July 2026
archive—2.14 billion pages, 364.01 TiB uncompressed, 40.5 million hosts—shows
why immediate global parity is not a credible first milestone [S12].

The current OpenCode path has good safety properties—small schemas, hard bounds,
stable redacted failures, untrusted-result labels, a researcher-only bundled
default,
and a bounded post-synthesis curiosity pass—but has almost none of the evidence
or ranking signals needed for curiosity-aware retrieval. It also remains
operationally and epistemically dependent on SearXNG and its upstream engines.

## 1. Frame, sub-questions, and method

### 1.1 Bounded questions

1. What exactly exists in this repository and the transferred
   `opencode2-curiosity` source workspace?
2. Which capabilities and failure modes recur across the 2026 search stack?
3. Which ideas can be learned clean-room without importing code, indexes, or
   incompatible obligations?
4. What contract maps the current bounded agent flow to owned crawl, index,
   retrieval, and evidence services?
5. What sequence gives useful evidence early while bounding legal, quality,
   security, scale, and cost risk?

**Depth budget:** architecture-level coverage of every requested category,
named comparative examples, and primary evidence for consequential claims; not
hands-on benchmarking, source-code reverse engineering, a global cost quote, or
jurisdiction-specific legal advice.

**Sufficient coverage:** each requested category has (a) a role in the target
architecture, (b) representative products/projects, (c) a hosted/license
boundary where material, and (d) a build/learn verdict. Coverage stops when new
sources repeat known capability classes rather than changing the decision.

### 1.2 Discovery methodology and limitations

Sources were discovered by category queries, official documentation indexes,
standards bodies, project repositories/license files, government sources, and
the local transferred source workspace. Primary specifications, official API
references, official project repositories, and original benchmark pages were
preferred. Vendor documentation establishes that a capability is offered; it
does **not** establish comparative superiority. All web sources were accessed
2026-08-17 unless noted. Search snippets were treated as leads, not authority.

The named matrix is broad but **not literally exhaustive**. Products change,
regional engines and private systems are under-documented, commercial index
coverage cannot be independently audited here, and 2026 documentation may be
personalized or revised. No paid APIs were called, no crawler was run, no
vendor quality claim was accepted as a benchmark, and no third-party source or
dataset was copied into this repository.

Labels used below:

- **FACT** — directly supported by the cited source or inspected repository.
- **INFERENCE** — reasoned conclusion from facts; not directly measured here.
- **RECOMMENDATION** — proposed project choice.
- Confidence is **high**, **medium**, or **low**.

## 2. Repository and `opencode2-curiosity` baseline

### 2.1 Repository authority and provenance

**FACT (high):** this repository is documentation-only and was split from
`iamsterling/opencode2-config`; retrieval belongs here while Ledger/Loop,
runtime state, credentials, and implementation do not (`README.md:3-9,17-21`).
The constitution requires provider-neutral contracts, untrusted result
handling, explicit third-party licensing, and concise ADRs
(`AGENTS.md:3-15`). The only transferred decision is ADR 0020, moved from the
source workspace at commit `8ff93f27...`; it was untracked there. The statement
that no separate report was found describes the transfer-time search, not the
repository's present research inventory (`provenance/origin.md:3-23`).

**FACT (high):** ADR 0020 accepts `web_search`, retains
`formerhuman_search` as a deprecated ABI alias, allows search only for the
`researcher`, confines Curiosity to one bounded in-frame pass, and separates
normalization from a SearXNG adapter
(`docs/decisions/0020-provider-neutral-web-search.md:14-35`). Deployment is
pending and mutation requires separate reviewed authority (ibid. `:37-43`).

### 2.2 Inspected source-workspace snapshot

The source workspace `/Volumes/dev/opencode2-config` was inspected at HEAD
`8ff93f27bd8a19cf548a562a6c684c87a9e37004` with uncommitted search work. The
exact inspected bytes, paths, per-file worktree states, date, and SHA-256 hashes
are recorded in the [baseline evidence manifest](../../provenance/opencode2-search-pipeline-baseline-2026-08-17.md). That manifest freezes evidence
identities, not the mutable external worktree. The following are source
references, not files transferred into this repository:

| Stage | Verified behavior and locator |
| --- | --- |
| Agent routing | The bundled transform prepends allow rules for both names to `researcher` and denies to the other bundled agents (`src/features/config/agents.ts:9-21`, `src/features/config/index.ts:4-17`). This is a shipped default, not proof that every host/user configuration preserves the rule. |
| Research policy | Frame bounded questions; search broadly; prefer primary sources; mark results untrusted; synthesize; score one curiosity pass by relevance/value/novelty/cost; stop on coverage/saturation/exhaustion (`src/features/config/agents.ts:52-57`, `assets/skills/deep-research/SKILL.md:7-14`). |
| Tool surface | Both tool names share one executor and one JSON input schema: `query` 1–500 characters, optional `maxResults` 1–10, no extra properties (`src/features/search/index.ts:5-33`). |
| Core normalization | Result fields are `title`, `url`, `content`, `engines`, and a fixed untrusted marker; URL, strings, engine count, failures, and result count are bounded (`src/features/search/core.ts:3-18,43-87`). |
| Adapter | A single approved HTTPS origin/path, bearer token, POST body, 15 s default timeout, 256 KB default response cap, manual redirects, JSON media check, URL deduplication, and stable redacted diagnostics (`src/features/search/searxng-adapter.ts:4-48,60-176`). |
| Gateway response | SearXNG `results` and `unresponsive_engines` become normalized results and partial failures; the token is not returned (`src/features/search/searxng-adapter.ts:149-174`). |
| Test evidence | Unit tests characterize authentication, offline setup, bounds, malformed/oversize/timeout behavior, body cancellation, redaction, URL dedupe, and alias identity (`tests/unit/web-search.test.mjs:33-171`). |
| Curiosity authority | The disposable live curiosity harness was rejected; only the bounded prompt/research protocol remains (`docs/research/README.md:15-19`). |

### 2.3 Current data flow

```text
caller-declared frame and budget
  -> bundled researcher-only web_search permission (effective config may vary)
  -> {query,maxResults<=10} validation
  -> SearXNG-specific adapter
  -> authenticated fixed gateway /agent-search
  -> SearXNG + upstream engines
  -> normalize / URL-dedupe / bound / mark untrusted
  -> researcher verifies primary sources and synthesizes
  -> one scored, in-frame curiosity follow-up
  -> citations, confidence, unknowns, verdicts
```

**INFERENCE (high):** “provider-neutral” currently describes the public tool
name and core validation, not the end-to-end evidence model. The executor is a
SearXNG adapter alias, and the output cannot explain crawl time, document
version, canonical relation, rank features, source lineage, source class,
content hash, or why a result was selected.

**FACT (high):** the inspected source establishes only the bundled-agent
default. Host configuration, user configuration, plugin ordering, or separately
defined agents can alter the effective runtime tool/permission surface; those
compositions were not exhaustively inspected or tested here. **PROPOSED future
invariant:** after all configuration layers are composed, only the effective
`researcher` role may invoke either search tool name, and startup/contract tests
must fail closed if an override grants either name elsewhere. This is a
recommendation of proposed ADR 0021, not current adopted behavior.

### 2.4 Gaps that suppress Curiosity

| Gap | Consequence | Owned-search amplification |
| --- | --- | --- |
| URL-only dedupe | mirrors and near-duplicates masquerade as diversity | canonical clusters, content fingerprints, host/owner diversity |
| No document/version IDs | citations can drift after recrawl | immutable capture and version IDs; cited passage hash |
| No observed/published timestamps | “new” and “changed” are conflated | fetch, first-seen, last-seen, claimed-published, valid-time fields |
| No rank explanation | agent cannot distinguish relevance from popularity/freshness | bounded feature classes and retrieval-stage trace |
| No source taxonomy | ten hits can represent one authority or syndication chain | source type, publisher/owner cluster, primary/secondary hints |
| No uncertainty/contradiction object | disagreement is rediscovered in prose | claim/evidence edges, stance candidates, confidence provenance |
| One query string only | branch quality is hidden from retrieval | explicit branch IDs, parent query, intent/facet, exploration budget |
| Partial failure only by engine | no corpus/freshness blind-spot signal | coverage warnings by language, time, source class, and shard |
| Snippet is unanchored | evidence may not exist in fetched version | passage offsets/hash tied to capture and extractor version |
| Metasearch dependency | coverage and ranking are inherited and opaque | owned frontier, corpus, ranking, and evaluation |

## 3. Landscape matrix: comparative evidence, not foundations

The detailed [cross-product synthesis](cross-product-web-search-synthesis-2026-08-17.md)
integrates the canonical inventory of 172 product and 6 benchmark reports. This
dossier's matrix is a category-level architecture summary, not an exhaustive
product inventory.

“Hosted” means the material search/index/crawl happens in another party's
service. “Self-hosted OSS” does not mean project-owned. License entries are
identification aids, not a completed dependency review.

| Category | Representative named offerings/projects | Material lesson and boundary | Verdict |
| --- | --- | --- | --- |
| Agent-native search/answer APIs | OpenAI Web Search/Deep Research; Anthropic Web Search; Perplexity Search/Agent; Exa Search/Contents/Deep; Tavily Search/Extract/Crawl/Research; Brave LLM Context/Answers | Hosted stacks combine query planning, retrieval, extraction, and citations. OpenAI exposes search/open/find actions and URL annotations [S5]; Anthropic exposes bounded `max_uses` and result metadata [S6]; Perplexity separates raw search from cited answer [S7]. Coverage/ranking remain opaque. | **REJECTED** as foundation; **ADAPTED** contract ideas. |
| Conventional web APIs | Brave Web/News/Image; Google Custom Search JSON; retired Bing Web Search; SerpAPI; Scale SERP; Mojeek API | Raw ranked URLs/snippets, locale/freshness/safe-search controls are useful interface precedents. Brave documents a first-party index and separate machine context [S8]. Google is closed to new JSON API customers and ends existing access 2027-01-01 [S9]; Bing docs are retired [S10]. | **REJECTED** foundation; **LEARN** filters and lifecycle risk. |
| Metasearch | SearXNG; Whoogle; MetaGer; Kagi's hosted aggregation | Aggregation broadens sources but inherits upstream ToS, outages, ranking, and coverage. SearXNG is AGPL-3.0 and an aggregator [S11], not an owned web index. | **REJECTED** target; current transition only. |
| Open crawlers/frontiers | Apache Nutch; Heritrix; StormCrawler; Scrapy; Apache Any23; Frontera; BUbiNG; YaCy crawler | Study frontier partitioning, retries, traps, robots, WARC, and backpressure. Scrapy documents robots middleware and adaptive throttle [S16]. Licenses vary (Apache/BSD/GPL); code must not enter clean-room implementation without approval. | **ADAPTED** concepts/specs only. |
| Search/index engines | Lucene/Solr; OpenSearch; Vespa; Tantivy; Xapian; YaCy; Meilisearch; Typesense; Quickwit | Inverted indexes, BM25, segments, postings, ANN and phased ranking are mature patterns. Lucene exposes BM25 semantics [S17]; OpenSearch is Apache-2.0 and supports lexical/vector/hybrid [S18]; Vespa documents union retrieval and phased ranking [S19]. They are not wholly owned implementations. | **LEARN** and benchmark; **REJECTED** as owned core. |
| Browser/render/crawl services | Chromium; Playwright; Puppeteer; Selenium; Crawlee; Browserless; Browserbase; Apify; Firecrawl | Rendering is expensive and expands browser exploit/SSRF risk. Keep an isolated, quota-bound second lane triggered only after static fetch fails quality checks. Hosted browser/crawl services violate the foundation constraint; OSS licenses differ. | **DEFERRED** lane; learn behavior only. |
| Parsing/extraction | Apache Tika; Mozilla Readability; jusText; Boilerpipe; Trafilatura; Goose; unstructured | Use an extractor ensemble only as an evaluation oracle. Preserve raw bytes, DOM/text maps, metadata evidence, and extractor version. Trafilatura documents extraction/dedup and has changed licensing across versions; verify the exact release [S20]. | **BUILD** owned baseline; compare clean-room outputs. |
| Storage/data formats | WARC 1.1; object storage/S3 protocol; Parquet; RocksDB/LMDB/PostgreSQL as components | WARC is an open, ISO-standardized capture envelope supporting response, request, metadata, revisit and conversion records [S13]. Commodity storage may be replaceable infrastructure, but dependency and data-license review remain separate. | **RECOMMEND** public formats; infrastructure decision deferred. |
| Vector/ANN systems | FAISS; hnswlib; ScaNN; Qdrant; Milvus; Weaviate; pgvector | Semantic candidates improve recall but add model/data provenance, memory, drift, multilingual, and poisoning concerns. Dense retrieval must not replace exact lexical retrieval or citation evidence. | **DEFERRED** until lexical baseline wins gates. |
| Ranking/LTR | BM25; LambdaMART/XGBoost/LightGBM; cross-encoders; RRF; OpenSearch pipelines; Vespa phased ranking | Candidate generation and expensive reranking should be distinct; evaluate nDCG/recall and latency by query class. Clicks are biased and abuseable. | **RECOMMEND** architecture; build owned scoring first. |
| Protocols/contracts | JSON Schema 2020-12; OpenAPI 3.1; MCP 2026-07-28; OpenSearch response conventions | MCP defines typed input/output schemas, structured content, validation, timeouts, rate limits, and treats annotations/results as untrusted [S4]. MCP is an adapter, not the internal domain model or authority system. | **ADAPT** at boundary. |
| Evaluation corpora | TREC DL; MS MARCO; BEIR; MIRACL; MTEB retrieval; LoTTE; FreshQA; FACTS; custom judged set | Use metrics and test design, but verify every dataset and underlying-document right. MS MARCO is non-commercial research only and disclaims underlying rights [S21], so it is not production training/index data. | **RECOMMEND** methods; datasets case-by-case. |
| Public crawl datasets | Common Crawl WARC/WAT/WET/indexes | Valuable scale reference and possible research fixture; not an ownership shortcut. The archive contains third-party pages, and Common Crawl terms do not grant page copyrights [S14, S15]. | **DEFERRED** data use pending legal review. |

### 3.1 Capability lessons by stack layer

#### Frontier, fetching, and politeness

**FACT (high):** RFC 9309 standardizes robots group matching, longest-match
rules, redirect/error behavior, caching (normally no more than 24 hours), and a
minimum parser limit; it explicitly says robots is not authorization [S1].
Sitemaps provide discovery hints, not permission [S2].

**RECOMMENDATION (high):** frontier keys are scheme + normalized authority,
with one scheduler owner per politeness key; retain robots fetch/version and the
exact allow/deny decision for every fetch. Use identifiable user-agent/contact,
DNS rebinding and private-address defenses, per-host concurrency and minimum
delay, adaptive backoff on latency/429/5xx, retry ceilings, redirect ceilings,
response byte/type limits, decompression-ratio limits, trap detection, and
global/tenant budgets. Treat `crawl-delay` as a nonstandard site preference
requiring an explicit conservative policy, not an RFC rule.

#### Fetch and render

**RECOMMENDATION (high):** static HTTP first. Resolve DNS and enforce the egress
policy on every redirect; never send cookies, credentials, or ambient cloud
metadata access. Render only when static extraction is inadequate and policy
permits it. Run browsers in disposable sandboxes with no intranet access,
downloads, extensions, persistent profile, or cross-job state. Record render
reason and incremental information gained so the lane can be disabled if its
quality/cost ratio is poor.

#### Parsing, canonicalization, deduplication

**FACT (high):** RFC 3986 defines URI syntax, reference resolution, a
normalization ladder, and security considerations; equivalence is not simply
lowercasing or dropping all query parameters [S3].

**RECOMMENDATION (high):** retain four identities rather than one “canonical
URL”: fetched URL, redirect-terminal URL, publisher-declared canonical URL, and
system cluster ID. Normalize only standards-safe components; learn tracking
parameters per host with reversible evidence. Deduplicate in layers: exact raw
hash, normalized-content hash, near-duplicate fingerprint, then template and
syndication clusters. Never let publisher canonical hints erase captures.

#### Spam, safety, privacy, and abuse

Search content is adversarial input. Apply malware/type checks, Unicode and HTML
sanitization, prompt-injection indicators, spam features, adult/safety policy,
PII/secret classifiers, and takedown/deindex workflows. Keep classifiers as
signals with reason codes and appeal paths, not silent irreversible deletion.
OWASP identifies web pages and tool output as indirect prompt-injection paths
and recommends separation of untrusted content [S22]. MCP likewise requires
input validation, access control, rate limiting, output sanitization, and client
result validation [S4].

**RECOMMENDATION (high):** a retrieval service never gains write/action tools.
The privileged research agent receives bounded structured evidence, not active
HTML. Search text cannot modify policy, request secrets, initiate further tools,
or approve work.

**RECOMMENDATION (high): illegal-content pre-capture gate.** Fetch bytes first
into an encrypted, access-denied, size/time-bounded provisional buffer that is
not a WARC, corpus object, index input, general log payload, or backup. Before
any durable capture, run approved detection and policy checks. A suspected
illegal-content match must atomically block ordinary capture/indexing, quarantine
only the minimum evidence required by policy, restrict access to named trained
specialists, and trigger security/privacy/legal escalation. Counsel and the
designated reporting function determine preservation, mandatory reporting, and
deletion under the applicable jurisdiction; ordinary operators and researchers
must not inspect or redistribute it. Logs retain only opaque case IDs, decision
codes, and minimal timing/size metadata—never URLs, thumbnails, snippets, hashes
that are themselves prohibited to retain, or body content unless counsel has
approved that evidence field.

The gate is fail closed. **GO** to durable capture only on an explicit clear
decision tied to classifier/policy versions, or on a documented specialist/legal
release. **STOP/QUARANTINE** on a positive, indeterminate, unavailable, timed-out,
or policy-version-missing check. **STOP the crawl lane** when quarantine storage,
restricted review, reporting, deletion, audit, or incident-response controls are
unavailable or exceed their approved capacity. Detection tools and hash lists
also require controlled access and legal approval; this dossier does not define
jurisdiction-specific reporting duties.

#### Index and retrieval

Start with document and passage inverted indexes, positional postings, fielded
BM25, language-specific analysis, phrase/exact filters, and freshness/source
features. Store immutable index manifests and tombstones. Query path:

1. parse/normalize intent without losing the original;
2. derive bounded facets/branches;
3. retrieve a generous lexical candidate set;
4. filter policy/tombstones;
5. rerank with transparent features;
6. cluster near duplicates and syndication;
7. diversify by host/owner/source type/time/viewpoint;
8. select passages anchored to capture IDs;
9. return evidence and coverage warnings.

Vectors enter as an additional candidate channel, fused with lexical rankings
(for example, RRF), only after they demonstrate incremental recall on held-out
queries without unacceptable cost or citation drift. Learned rankers enter
after stable labels and counterfactual logging; models must be versioned and
fall back to deterministic ranking.

#### Freshness and change discovery

Maintain observed change intervals and a host/URL hazard estimate. Sources are
sitemaps/RSS/Atom, links, `Last-Modified`/ETag, historical content change,
importance, and explicit monitoring scopes. Honest `<lastmod>` may be useful;
`changefreq` and `priority` are weak self-reports and Google documents ignoring
the latter two [S2]. Schedule exploration capacity for unseen URLs and
exploitation capacity for high-value changing URLs. A change event links old
and new captures and classifies metadata-only, template-only, and substantive
change.

#### Snippets, answers, citations, and provenance

Generate query-biased snippets only from stored passages. A citation identifies
`document_id`, `capture_id`, URL, fetch time, passage offsets/hash, extractor
version, and displayed title. An answer is downstream synthesis over selected
evidence; it must distinguish source claim from system inference and expose
supporting, contradicting, and unresolved evidence. Never cite a search snippet
as if it were the source document.

## 4. Clean-room / from-scratch boundary

This is an engineering boundary, not a legal opinion.

### 4.1 Permissible learning, subject to recording

- Public standards and protocols: RFC 3986, RFC 9309, HTTP, DNS, TLS, JSON
  Schema, MCP, WARC, sitemap and feed formats. Implement from the normative text;
  preserve standard attribution and licenses for extracted code components.
- Published algorithms, papers, equations, and measurements: BM25, PageRank-like
  link signals, SimHash/MinHash concepts, RRF, nDCG/MRR/recall. Record the paper,
  patents status check, and independently authored tests.
- Public API documentation and black-box observations made under permitted
  access: field names may inspire a neutral contract, but do not clone branding,
  nonpublic behavior, or copyrighted documentation.
- Independently created fixtures and pages, publisher-opted corpus data, and
  public-domain or project-authored evaluation content.
- Aggregate measurements that do not retain restricted content and can be
  reproduced from authorized inputs.
- Separately reviewed commodity OS, runtime, TLS, database, object-storage,
  compression, and observability libraries. Each exception remains replaceable
  infrastructure and must not define frontier, extraction, identity, lexical,
  ranking, provenance, evidence, deletion, bound, or authority semantics.

### 4.2 Dependency and rights ledger

Before use, record exact component/dataset name, version and integrity hash;
role and replaceability; source, license and NOTICE obligations; transitive
dependencies; security/update owner; data and network access; clean-room review;
and approval/expiry. For a corpus or benchmark, separately record owner, terms,
underlying-document rights, commercial/display/training/redistribution rights,
privacy, attribution, deletion, geography, and custody lineage. A software
license never clears content rights.

### 4.3 Contamination risks and controls

| Risk | Boundary/control |
| --- | --- |
| OSS source copied or translated | Design team may study public behavior/docs; implementers work from an approved functional specification and independent fixtures. Keep source-reading and implementation roles/logs separate for high-risk components. |
| AGPL service code | SearXNG remains third-party AGPL-3.0; do not copy, relabel, statically combine, or imply MIT/project ownership. Network deployment/modification obligations require counsel [S11]. |
| “Permissive” OSS copied into owned core | Apache/MIT/BSD still require notices/attribution and create third-party code, contradicting a strict wholly-owned core. Use only after an explicit exception; otherwise use as an external benchmark oracle. |
| Public crawl/index used as seed | Public availability is not copyright permission. Preserve origin/robots/license metadata; require dataset terms, privacy, deletion and jurisdiction review before any ingestion [S14, S15]. |
| Search-result scraping | API/UI terms, database rights, contract, rate limits, and robots may prohibit or constrain it. Do not seed from vendor results. |
| Benchmark leakage | Separate train/dev/test, hash fixtures, version datasets, and prevent judged test queries/documents from ranking training. |
| Patent/trade secret | Public functionality is not a patent clearance. Perform a targeted freedom-to-operate review before novel ranking/crawl commercialization. Never bypass controls or solicit confidential details. |
| Personal/sensitive data | Minimize capture and query logs, set retention, support erasure/deindex, restrict access, and complete privacy impact and lawful-basis review before public/global operation. |

### 4.4 Standards, robots, and datasets

**Public standards:** usable as specifications under their publication terms;
do not assume sample code has the same license as prose. RFC code components
carry IETF Trust conditions. WARC is an open standard with no format patent or
license identified by the Library of Congress [S13].

**Robots:** implement RFC 9309 and retain decisions, but robots is neither
authorization nor a complete copyright/privacy license [S1]. Also honor
explicit noindex/nosnippet and project policy, contractual restrictions,
takedowns, and publisher controls after legal review. A robots allow does not
answer whether public display, model training, or long retention is lawful.

**Benchmark datasets:** use only after a dataset-by-dataset ledger records
owner, version, terms, commercial-use right, underlying-document rights,
attribution, privacy, deletion, and redistribution. MS MARCO's non-commercial
research restriction makes it unsuitable for production training or commercial
quality claims without separate permission [S21]. BEIR is a collection of
datasets, not one blanket license; inspect each component.

## 5. Target architecture and provider-neutral contracts

### 5.1 Planes and trust boundaries

```text
CONTROL / POLICY PLANE
  corpus policy | robots/takedown | budgets | schema/model versions | audit
          | immutable policy decision IDs
          v
DISCOVERY + CRAWL PLANE
  seeds/sitemaps/feeds/links -> partitioned frontier -> DNS/egress gate
  -> static fetch / optional isolated render into ephemeral buffer
  -> pre-capture illegal-content gate -> WARC capture/object store
                  \-> restricted minimum-evidence quarantine + escalation
          | capture events (append-only)
          v
DOCUMENT PLANE
  type detect -> parse -> extract -> language -> canonical candidates
  -> exact/near dedup -> spam/safety/PII signals -> document/version graph
          | versioned index records
          v
SEARCH PLANE
  lexical index (+ later vector index) -> candidate generation -> rerank
  -> policy filter -> cluster/diversify -> passage/snippet -> search response
          | bounded typed evidence
          v
AGENT ADAPTER PLANE
  OpenCode tool / HTTP / optional MCP adapters -> researcher Curiosity process

EVALUATION + OPERATIONS PLANE (cross-cutting)
  crawl health | freshness | relevance | provenance | abuse | cost | SLOs
```

The internal search service never imports OpenCode permissions or SearXNG wire
types. OpenCode, HTTP, and MCP are adapters. Provider-neutral domain contracts
live separately from crawler, index, model, storage, and deployment operations.

### 5.2 Conceptual contract (not code)

`SearchRequest` should include:

- `query`, `max_results`, locale/language, safe-search policy;
- optional time range, domain/source filters, freshness mode;
- `research_frame_id`, `branch_id`, `parent_branch_id`, exploration budget;
- requested evidence detail and a hard deadline/cost class;
- opaque caller/tenant policy reference, never credentials.

`SearchResponse` should include:

- stable request and index-snapshot IDs;
- hits containing document/capture/passage IDs, canonical and fetched URL,
  title/snippet, observed/published times, content/passage hash;
- source/publisher cluster and source-type hints;
- retrieval channels and bounded reason classes (not proprietary score internals);
- citation/provenance object, trust=`untrusted-external-evidence`;
- coverage, freshness, policy-filter, and partial-failure warnings;
- pagination/cursor and response/schema version.

Keep ranking scores optional and explicitly non-comparable across index/model
versions. Do not expose crawler locations, internal object keys, model secrets,
or raw safety labels. Preserve current query/result/time/size limits unless an
evaluated versioned contract changes them. Keep `formerhuman_search` only in the
OpenCode adapter until a separately reviewed ABI removal.

### 5.3 Curiosity-aware retrieval loop

1. The caller supplies frame, authority, and total budget.
2. Researcher creates a small explicit branch set: direct answer, primary-source
   discovery, disconfirmation, temporal update, and missing stakeholder/source.
3. Search assigns a branch ID and enforces per-branch and aggregate limits.
4. Ranking optimizes relevance subject to source, owner, time, and viewpoint
   diversity constraints; it does not invent “contradiction.”
5. The researcher extracts claims and marks evidence support/contradiction/
   uncertainty with citations.
6. After synthesis, one curiosity pass scores remaining in-frame gaps by
   relevance, value, novelty, and cost. Search supplies expected coverage and
   overlap estimates; caller authority remains outside search.
7. Stop on coverage, saturation, budget exhaustion, policy block, or repeated
   near-duplicate evidence. Record rejected branches as `CURIOSITY_NO_GO`.

This improves novelty and disconfirmation while preserving the current ban on
live autonomous curiosity.

### 5.4 Installable runtime and authority boundaries

The canonical provider-neutral domain API is the only semantic entry point. The
first reference profile is a local single-node runtime. Its bounded read-only
query surface is credential- and schema-separated from admin crawl, import,
pause/resume, delete, rebuild, backup, restore, and policy operations. Setup,
schema discovery, health, offline query, and uninstall perform no provider call
or implicit crawl. No corpus is bundled.

| Boundary | Responsibility and authority |
| --- | --- |
| Runtime | Owns search semantics, aggregate bounds, policy/capture/version records, projections, rank traces, provenance and limitations. It owns no OpenCode role assignment or action tool. |
| Native OpenCode adapter | First integration. Owns tool/alias registration, domain mapping, local endpoint configuration, stable diagnostics, and effective researcher-only enforcement after all configuration composition. It cannot crawl/import/delete. |
| Skill | Guidance only: framing, primary-source preference, warning interpretation, bounded curiosity, citation, and stopping. It cannot enforce permission, hold credentials, or make hidden calls. |
| MCP adapter | Optional later transport/schema translation only. It cannot become the domain model, authority system, or admin path. |
| Admin surface | Explicit operator lifecycle under separate credentials and audit. Query clients and agents cannot reach it. |

Single-tenant server mode may follow an independent gate. Cluster operation and
true multi-tenancy are deferred; neither is implied by the API. Distribution
must specify signed/versioned artifacts, compatibility, upgrade preflight and
rollback, backup/restore and projection rebuild, credential revocation, and
uninstall choices that never silently retain or delete corpus, quarantine,
backups, logs, or configuration. Offline query uses the last authorized snapshot
and discloses staleness/coverage; admin network work fails explicitly offline.
See proposed [ADR 0022](../decisions/0022-installable-search-runtime.md).

## 6. Staged delivery sequence, gates, and stop/go criteria

### Stage 0 — authority, corpus, dependency, and evaluation design

Choose one language and bounded vertical with cooperative/public-domain or
explicitly permitted sources. Define crawler identity, inclusion policy,
takedown/deindex, retention, rights/dependency/benchmark ledgers, threat/privacy
reviews, and 200–500 representative project-owned or rights-cleared judgments.
Define the fail-closed illegal-content provisional-buffer, quarantine,
escalation, reporting-decision, deletion, and audit runbook before fetching.

**GO:** legal/security/privacy review approves the cell; evaluation and failure
taxonomy exist; funding and named operators cover judgments, complaints,
restricted response and on-call. **STOP:** rights, deletion, illegal-content, or
operational duties cannot be performed.

### Stage 1 — installable empty local runtime and separated lifecycle

Define the canonical domain request/response, local process and storage profile,
separate query/admin schemas and credentials, status/version reporting, and
empty-corpus/offline behavior. Package no corpus and perform no network call,
crawl, import, or telemetry during install or startup.

**GO:** clean install, upgrade rehearsal, backup/restore skeleton, and uninstall
custody choices pass; query authority cannot reach admin operations; version and
compatibility diagnostics are deterministic. **STOP:** setup mutates corpus or
network state silently, credentials cross boundaries, or rollback is undefined.

### Stage 2 — admin lifecycle and capture-quality static crawler

Build explicit seed/import, pause/resume, delete/tombstone, rebuild,
backup/restore and audit operations plus seed/sitemap/feed/link discovery,
durable frontier, robots cache, per-authority politeness, egress guard, ephemeral
static fetch, pre-capture illegal-content gate, WARC capture only after clearance,
restricted quarantine, retries, backpressure, and operator kill switch. No
browser rendering.

**GO:** zero known private-network fetches; every attempt links policy/robots
records; restart is bounded and idempotent; delete, restore, and projection
rebuild drills pass; no positive/indeterminate/unscanned response reaches durable
capture. Any unavailable quarantine, reporting, deletion, or audit control is
**STOP**, not degraded mode.

### Stage 3 — document/version pipeline, lexical search, and citations

Build type detection, safe decoding, owned extraction acceptance semantics,
metadata evidence, language, canonical candidates, exact/near dedup,
document/version graph, spam/safety signals, immutable manifests, positional
inverted segments, fielded BM25, transparent features, policy/tombstone filters,
diversification, passage selection, anchored snippets, and snapshot rollback.
The single-node profile need not introduce distributed sharding.

**GO:** held-out nDCG/recall and primary-source coverage meet predeclared pilot
gates; citations reproduce from capture and pipeline versions; malformed inputs
remain bounded; deletion, rebuild and rollback work; p95 fits the measured local
envelope. **STOP:** gains depend on leakage, scores are presented across versions
as absolute, or citations/deletion/rollback are unreliable.

### Stage 4 — native OpenCode adapter, guidance skill, and bounded Curiosity

Adapt `web_search` to the local owned runtime behind the unchanged public name;
return typed provenance and branch warnings. Preserve the deprecated alias,
bounds, stable redacted diagnostics, no setup network call, and untrusted-data
label. After all host/user/plugin configuration composition, enforce effective
researcher-only permission and fail closed on leakage. The skill provides
procedure only. Deterministic tests use fixtures, never production.

**GO:** no authority expansion; citations resolve to captures; novelty,
contradiction, independent-source diversity, uncertainty, temporal change and
branch lineage are visible; exploration/exploitation and marginal-gain stopping
produce `GO`, `CURIOSITY_NO_GO`, or `STOP` within aggregate budget. **ROLL BACK:**
citation integrity, permission, safety, or availability regresses.

### Stage 5 — optional single-tenant server and MCP transports

Add neither by default. Gate a server on credential isolation, backup/restore,
patching, observability, and single-tenant operations. Gate MCP on negotiated
version/schema, cancellation, error, bounds, and permission behavior against the
same canonical API. MCP never exposes admin operations or owns semantics.

### Stage 6 — independently gated retrieval enhancements

Add adaptive recrawl, change events, publisher/owner clustering, source typing
and explicit diversification, then independently consider sandboxed rendering,
vector candidates/fusion, and versioned learned ranking. Train only on approved
data and retain deterministic lexical fallback.

**GO independently per feature:** material held-out gain by query class with no
important-slice regression, rights ambiguity, citation drift, isolation failure,
or unaffordable latency/compute. Disable any feature that cannot prove marginal
value. Static fetch remains first.

### Stage 7 — cell-by-cell breadth and only then possible clustering

Expand language/region/vertical cells one at a time, each with policy, rights,
judgments, abuse controls, deletion, funding and capacity envelope. Consider
cluster operation only after local and any single-tenant server profiles
demonstrate backup/restore, projection rebuild, failover and deindex propagation.
True multi-tenancy requires a new ADR. Policy and document identity remain
coherent across any later regions.

**Never use “pages indexed” alone as a launch gate.** Require quality, freshness,
diversity, safety, rights, reversibility, funding, and operations together.

## 7. Capacity and economic model (assumptions, not a quote)

### 7.1 Variables

For a corpus of `N` captures:

- raw compressed storage = `N * mean_compressed_capture_bytes`;
- derived text/metadata = `N * mean_derived_bytes`;
- index = total indexed tokens/postings + stored fields + vectors;
- durable footprint multiplies by replicas + backups + retained versions;
- daily ingress = fetched pages/day * transferred bytes/page;
- crawl egress is dominated by body bytes and retries; render compute by
  rendered pages * browser-seconds;
- query compute = QPS * (candidate retrieval + feature evaluation + reranking);
- people/on-call, moderation, legal response, and relevance judgments are
  first-class costs, not overhead omitted from “storage per page.”

### 7.2 Planning scenarios

**Pilot assumption (low confidence until measured):** 1 million accepted
documents, average compressed capture 50–200 KiB, one current capture plus
limited history. Raw storage is therefore roughly 50–200 GiB before derived
data, index, replicas, backups, rejected fetches, and logs. Use this only to size
a pilot order of magnitude.

**Expansion inference (medium):** at 100 million documents, even 100 KiB mean
compressed capture is about 10 TB raw; multiple versions, replicas and indexes
move the durable footprint into tens of TB or more. Vector storage adds
`passages * dimensions * bytes/value` before ANN overhead; this is why vectors
wait for measured value.

**Global reference fact (high):** Common Crawl July 2026 reports 84.69 TiB
compressed WARC and 364.01 TiB uncompressed for 2.14 billion pages in one crawl,
excluding the project's own history, serving replicas, and search indexes
[S12]. A competitive fresh global corpus is therefore a recurring
hundreds-of-TiB-to-PiB-class data operation, not a one-time download.

No dollar figure is offered because region, hardware purchase/lease, bandwidth
peering, retention, replication, render rate, QPS, latency target, staffing, and
legal workload are unknown. A finance gate should price measured pilot unit
rates: accepted documents per fetched byte, changed documents per recrawl,
relevant judged hits per query CPU-second, and citations per marginal curiosity
branch.

## 8. Observability, evaluation, and operations

### Crawl/document SLOs

- frontier age by priority/language/host class; fetch success/status/latency;
- robots cache age and decision outcomes; bytes, redirects, retries, trap drops;
- host load/complaints and emergency suppression;
- extraction success, text ratio, language confidence, duplicate-cluster size;
- time from takedown/policy change to query-serving removal;
- index lag, shard health, rebuild and restore time, capture-to-index lineage.

### Search/Curiosity quality

- Recall@k, nDCG@k, MRR (where appropriate), answerable-query coverage;
- primary-source recall, citation passage entailment and URL/capture resolvability;
- freshness lag and changed-page retrieval;
- host, publisher/owner, source-type, language, geography and temporal diversity;
- duplicate/syndication rate, spam rate, unsafe-content leakage;
- contradiction discovery precision (human judged), uncertainty calibration;
- branch marginal gain, overlap, latency, and cost; stop-decision correctness;
- slices for navigational, exact entity, rare term, exploratory, time-sensitive,
  multilingual, adversarial and no-good-answer queries.

Offline tests need frozen captures and index manifests. Online experiments need
predeclared metrics, guardrails, enough sample, and rollback; clicks alone are
not relevance truth. Log query text only under an approved minimization and
retention policy; prefer derived aggregates and sampled/redacted traces.

## 9. Legal, licensing, privacy, and security review gates

Before public operation, independent counsel should review at least: crawling
and website terms by jurisdiction; copyright and database rights; snippets,
caching and full-text retention; publisher opt-out/takedown; trademark and
attribution; robots versus license; privacy lawful basis, minimization,
retention, access/erasure and cross-border transfer; children's/sensitive data;
benchmark/training data; and AGPL obligations in the transition deployment.
GDPR is a primary EU privacy authority but applying it to a concrete crawl and
query-log design requires counsel [S23].

Security review should threat-model SSRF/DNS rebinding, decompression bombs,
parser/browser exploits, malicious redirects, Unicode spoofing, malware,
indirect prompt injection, index poisoning, rank manipulation, query abuse,
scraping of the search service, denial-of-wallet, cross-tenant leakage,
credential/log leakage, model supply chain, and deletion bypass. Red-team the
complete capture-to-agent chain, not only the API.

## 10. Decisions and unresolved questions

| Item | Verdict | Confidence / rationale |
| --- | --- | --- |
| Owned crawl, corpus, index and ranking | **RECOMMENDED / PROPOSED staged** | High; only path identified to control coverage, evidence lineage and curiosity signals; ADR 0021 is not accepted. |
| Preserve neutral `web_search` ABI and effective researcher-only invariant | **RECOMMENDED / PROPOSED** | High; current source tests support the ABI and bundled default, but host/user override enforcement is future work. |
| SearXNG as target core | **REJECTED** | High; metasearch is upstream-dependent and AGPL third-party software. |
| Commercial/hosted search APIs | **REJECTED** foundation | High; violate ownership premise and hide index/ranking. |
| Public standards and published IR algorithms | **RECOMMENDED** with attribution/FTO checks | High. |
| OSS engines/crawlers in owned core | **REJECTED under strict ownership** | Medium; may be reconsidered only by explicit license/ownership exception. |
| WARC capture envelope | **RECOMMENDED** | High; open, interoperable capture/provenance format. |
| Static fetch first, isolated rendering | **ADAPTED/deferred** | High; controls cost and attack surface. |
| Lexical baseline before vector/LTR | **RECOMMENDED** | High; debuggable baseline and lower rights/model risk. |
| Common Crawl content as seed | **DEFERRED** | High; scale value but unresolved content rights/privacy/robots history. |
| MCP | **ADAPTED as optional adapter** | High; useful typed tools, not internal architecture or authority. |
| MS MARCO production use | **REJECTED** | High; official terms limit it to non-commercial research [S21]. |
| First deployment profile | **RECOMMENDED / PROPOSED local single-node** | High; minimizes custody, trust, and operations surface while testing canonical semantics. |
| First agent integration | **RECOMMENDED / PROPOSED native OpenCode** | High; preserves ADR 0020 ABI and effective permission boundary; MCP remains optional/later. |
| Commodity infrastructure | **PERMITTED only after review** | High; OS/runtime/TLS/database/object storage/compression/observability may not own search semantics and require ledger approval. |

Blocking choices for the next reviewed design phase:

1. Which initial vertical, languages, jurisdictions, and publisher permission
   model are authorized?
2. Which exact commodity dependencies and package/platform formats pass the
   dependency, security, license, and replaceability review?
3. What are target QPS, p95 latency, freshness classes, retention/history,
   availability, regions, and annual people/infrastructure envelope?
4. May captured full text be retained, displayed, or used for ranking/model
   training, by jurisdiction and source license?
5. What is the supported publisher deindex/takedown/appeal SLA?
6. Who owns relevance judgments, abuse response, privacy requests, and 24x7
   crawl/search operations?

## 11. Curiosity pass and stop decision

Scoring is 1 (low) to 5 (high); cost is 1 (cheap) to 5 (expensive).

| Thread | Relevance | Value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Verify real global scale against the latest crawl archive | 5 | 5 | 4 | 1 | **Pursued:** July 2026 primary archive changed the scale evidence to 2.14B pages/364.01 TiB [S12]. |
| Verify benchmark commercial-use boundary | 5 | 5 | 4 | 1 | **Pursued:** MS MARCO is non-commercial research only [S21]. |
| Patent landscape by every ranking algorithm | 3 | 4 | 3 | 5 | `CURIOSITY_NO_GO`: requires counsel/FTO search and does not change staged architecture today. |
| Benchmark all named products live | 2 | 3 | 2 | 5 | `CURIOSITY_NO_GO`: paid access and reproducible test corpus absent; vendor comparison is not the decision. |
| Jurisdiction-by-jurisdiction crawl legality | 5 | 5 | 4 | 5 | `CURIOSITY_NO_GO`: legal advice outside authority; mandatory later counsel review. |
| Select exact hardware/cloud and dollar cost | 4 | 4 | 2 | 4 | `CURIOSITY_NO_GO`: workload/SLO/region assumptions absent; use pilot unit economics. |
| Reverse engineer proprietary ranking | 1 | 2 | 3 | 5 | `CURIOSITY_NO_GO`: unnecessary, unclean, and potentially prohibited. |

**Coverage check:** all requested stack, process, clean-room, architecture,
sequence, economics, evaluation, legal/license/privacy/security and curiosity
categories are represented.
**Saturation check:** additional discovered products repeated the same hosted
API, crawler, extractor, index, vector, or evaluation classes and did not change
the decision.
**Stop:** coverage and category saturation reached. Exact corpus, legal posture,
SLOs and capacity remain intentionally unresolved pending caller authority and
independent reviews.

## 12. Primary bibliography and selection rationale

All accessed 2026-08-17.

1. **[S1] IETF, RFC 9309, Robots Exclusion Protocol.**
   https://datatracker.ietf.org/doc/html/rfc9309 — normative robots parsing,
   access-result, cache, limits, and non-authorization source.
2. **[S2] Sitemaps protocol; Google sitemap guidance.**
   https://www.sitemaps.org/protocol.html and
   https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
   — primary discovery format and documented handling of hints.
3. **[S3] IETF, RFC 3986, URI Generic Syntax.**
   https://www.rfc-editor.org/rfc/rfc3986 — normative normalization,
   resolution, comparison, and security source.
4. **[S4] Model Context Protocol 2026-07-28, Tools.**
   https://modelcontextprotocol.io/specification/2026-07-28/server/tools —
   normative tool schemas, structured results, validation, and security.
5. **[S5] OpenAI, Web search tool documentation.**
   https://platform.openai.com/docs/guides/tools-web-search — first-party
   hosted agent-search actions, citations, source lists, filtering and bounds.
6. **[S6] Anthropic, Web search tool.**
   https://docs.anthropic.com/en/docs/build-with-claude/tool-use/web-search-tool
   — first-party hosted tool versions, use bounds, result and citation shape.
7. **[S7] Perplexity, Search API.**
   https://docs.perplexity.ai/guides/search-quickstart — first-party raw
   search versus answer boundary, multi-query and filters.
8. **[S8] Brave, Web Search API.**
   https://api-dashboard.search.brave.com/app/documentation/web-search/get-started
   — first-party index/API controls and machine-context distinction.
9. **[S9] Google, Custom Search JSON API.**
   https://developers.google.com/custom-search/v1/overview — primary closure
   and 2027 transition notice; evidence of provider lifecycle risk.
10. **[S10] Microsoft, Bing Web Search API overview (retired archive).**
    https://learn.microsoft.com/en-us/previous-versions/bing/search-apis/bing-web-search/overview
    — primary retired-service boundary and historical API shape.
11. **[S11] SearXNG repository and license.**
    https://github.com/searxng/searxng — project description and
    AGPL-3.0-or-later license; prevents ownership/license misstatement.
12. **[S12] Common Crawl, July 2026 archive.**
    https://commoncrawl.org/blog/july-2026-crawl-archive-now-available — latest
    primary scale, host, WARC/WAT/WET and compressed-size reference.
13. **[S13] Library of Congress, WARC format description.**
    https://www.loc.gov/preservation/digital/formats/fdd/fdd000236.shtml —
    authoritative standard, record types, adoption, and licensing summary.
14. **[S14] Common Crawl, FAQ.** https://commoncrawl.org/faq — first-party
    crawler behavior, robots, JavaScript/cookie and politeness description.
15. **[S15] Common Crawl, Terms of Use.**
    https://commoncrawl.org/terms-of-use — primary dataset/service terms;
    selected to avoid treating open access as content ownership.
16. **[S16] Scrapy, robots middleware and AutoThrottle.**
    https://docs.scrapy.org/en/latest/topics/downloader-middleware.html and
    https://docs.scrapy.org/en/latest/topics/autothrottle.html — first-party
    comparative implementation behavior, not copied design.
17. **[S17] Apache Lucene, BM25Similarity.**
    https://github.com/apache/lucene/blob/main/lucene/core/src/java/org/apache/lucene/search/similarities/BM25Similarity.java
    — primary implementation documentation for BM25 semantics; learning only.
18. **[S18] OpenSearch, search and license.**
    https://docs.opensearch.org/latest/search-plugins/ and
    https://github.com/opensearch-project/OpenSearch/blob/main/LICENSE.txt —
    first-party hybrid capability and Apache-2.0 boundary.
19. **[S19] Vespa, phased ranking.**
    https://docs.vespa.ai/en/ranking/phased-ranking.html — first-party
    retrieval/candidate/phased-ranking architecture evidence.
20. **[S20] Trafilatura documentation.**
    https://trafilatura.readthedocs.io/ — first-party extraction and evaluation
    reference; exact-version license must be checked before any use.
21. **[S21] Microsoft, MS MARCO datasets.**
    https://microsoft.github.io/msmarco/Datasets.html — primary non-commercial
    research terms and underlying-rights disclaimer.
22. **[S22] OWASP, LLM Prompt Injection Prevention.**
    https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html
    — security-community primary guidance for indirect web-content injection.
23. **[S23] European Union, GDPR official text.**
    https://eur-lex.europa.eu/eli/reg/2016/679/oj — primary privacy regulation;
    included to flag review, not to provide legal interpretation.
24. **[S24] NIST, TREC 2022 Deep Learning overview.**
    https://trec.nist.gov/pubs/trec31/papers/Overview_deep.pdf — original
    evaluation design and human-judgment source.

### Negative source results retained

- No independent evidence was found here that any hosted vendor is
  categorically more relevant, fresh, or complete than another; superiority
  claims were excluded.
- No blanket commercial license was found for BEIR's component datasets; each
  must be checked separately.
- No reliable global owned-search dollar estimate can be inferred from public
  crawl size alone.
- No public standard makes robots permission equivalent to copyright,
  privacy, contract, or model-training permission.
- At transfer time, no completed provider benchmark was found in the searched
  source-workspace or terminal artifacts. That historical result does not
  describe or constrain the repository's current `docs/research/products/` and
  `docs/research/benchmarks/` inventories.
