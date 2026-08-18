# Cross-product public-web search synthesis

**Date:** 2026-08-17
**Inventory reviewed:** 172 product reports and 6 benchmark reports in the
canonical live directories.
**Status:** research synthesis and recommendation; not an implementation,
dependency approval, corpus authorization, benchmark result, or deployment
record.
**Related:** [owned-search dossier](owned-public-web-search-architecture-2026-08-17.md),
[ADR 0021](../decisions/0021-owned-public-web-search.md), and
[ADR 0022](../decisions/0022-installable-search-runtime.md), all proposals where
identified as such.

## Executive recommendation

Proceed, subject to the gates below, with an installable **local single-node
reference runtime** that owns Curiosity's search semantics: crawl/frontier
policy, extraction semantics, document identity and versioning, lexical index,
ranking, evidence/provenance, and authority boundaries. Use a canonical
provider-neutral domain API. Integrate it first through a native OpenCode
adapter that preserves `web_search` and the deprecated alias. A skill may teach
the procedure but must not enforce permissions or become a runtime dependency.
MCP is an optional later transport adapter.

Do not make a hosted search API, metasearch service, third-party crawler,
third-party search/index engine, public crawl index, copied implementation, or
bundled corpus the foundation. Separately reviewed commodity operating-system,
runtime, TLS, database, object-storage, compression, and observability libraries
may be permitted behind replaceable boundaries and a dependency/license ledger.
This is ownership of **search semantics**, not an assertion that every binary
instruction must be project-authored.

The minimum product sequence is local runtime, explicit admin lifecycle, native
OpenCode adapter, then guidance skill. Server mode, MCP, rendering, vectors,
learned ranking, cluster operation, and true multi-tenancy are independent later
decisions. Confidence is **high** in these boundaries, **medium** in the initial
capacity shape, and **low** in cost or relevance at scale because no corpus was
acquired and no live comparative benchmark was run.

## Method and completeness limits

The synthesis groups the canonical reports by observable product role, reads
their dated fact/inference/recommendation ledgers, and compares recurring
contract, lifecycle, provenance, safety, rights, and operational claims. Source
paths below point to the detailed reports and their primary bibliographies.
The landscape is broad and methodical but **never literally exhaustive**:
private systems are not observable, products and terms drift, regional products
are unevenly documented, and source availability biases the inventory.

No paid or live comparative benchmark, proprietary reverse engineering, corpus
download, provider call, or vendor-superiority test was performed. Vendor claims
establish represented capabilities, not comparative quality. The six benchmark
reports are rights and methodology reviews, not executed scorecards. Counts are
file counts, not claims that the market has exactly 172 products or only six
relevant benchmarks.

## Top 20 source-path-backed findings

1. **Agent search is usually a routed fabric, not one index.** Hosted tools mix
   query rewriting, upstream/provider search, partner feeds, cache, page open,
   extraction, and synthesis; their polished citation UX does not establish
   immutable evidence custody ([OpenAI](products/openai-web-search.md),
   [Anthropic](products/anthropic-web-search.md),
   [Perplexity](products/perplexity-search-api.md)).
2. **A URL citation is not a capture-anchored citation.** Major APIs generally
   omit capture/version IDs, passage hashes, extractor versions, index snapshots,
   and policy decisions ([Parallel Search](products/parallel-search-api.md),
   [Exa Search](products/exa-search.md), [You Search](products/you-search-api.md)).
3. **Cache and freshness controls are often hints with hidden fallback.** Some
   products expose freshness maxima or live/cache modes, yet actual cache age,
   origin contact, stale fallback, and transformed-artifact identity remain
   incomplete ([Firecrawl Crawl](products/firecrawl-crawl.md),
   [OpenAI](products/openai-web-search.md),
   [Parallel Search](products/parallel-search-api.md)).
4. **Marketing ZDR is not the contract.** Retention and training statements can
   conflict with customer terms or vary by enterprise order, region, endpoint,
   and abuse logging ([Parallel Search](products/parallel-search-api.md),
   [Bright Data proxies](products/bright-data-proxy-networks.md),
   [Pinecone](products/pinecone.md)).
5. **Metasearch breadth is upstream dependency breadth.** SearXNG's adapter
   inventory, fan-out, and fusion do not create owned coverage, ranking, or
   evidence; configuration also hides which engines were eligible or skipped
   ([SearXNG](products/searxng.md), [Whoogle](products/whoogle.md),
   [MetaGer](products/metager.md)).
6. **Crawler correctness is a recoverable state machine.** Durable eligibility,
   leases/generations, per-origin policy, idempotent attempts, immutable evidence,
   and rebuildable projections recur across crawler studies
   ([Nutch](products/apache-nutch.md), [Heritrix](products/heritrix.md),
   [Frontera](products/frontera.md), [PostgreSQL](products/postgresql-search-substrate.md)).
7. **Robots support claims are not equivalent.** RFC conformance, nonstandard
   `crawl-delay`, error caching, redirects, agent matching, operator bypasses,
   and publisher/legal authority differ; robots is policy input, not permission
   ([Scrapy](products/scrapy.md), [Firecrawl Crawl](products/firecrawl-crawl.md),
   [Common Crawl](products/common-crawl.md)).
8. **Rendering is a second security product.** Browser sandboxes do not replace
   public-only egress, redirect/DNS revalidation, fresh profiles, no credentials,
   host isolation, resource ceilings, and destruction after each job
   ([Chromium](products/chromium-rendering.md), [Playwright](products/playwright.md),
   [Browserbase](products/browserbase.md)).
9. **Extraction quality comes from candidates plus explicit acceptance gates.**
   Fallback ensembles can improve recall but can silently change algorithm,
   structure, language handling, and output across versions
   ([Trafilatura](products/trafilatura.md),
   [Mozilla Readability](products/mozilla-readability.md),
   [Apache Tika](products/apache-tika.md)).
10. **Document identity must not collapse into URL identity.** Fetched URL,
    redirect target, declared canonical, content/version identity, duplicate
    cluster, and passage identity answer different questions
    ([Nutch](products/apache-nutch.md), [Lucene](products/apache-lucene.md),
    [Common Crawl](products/common-crawl.md)).
11. **Immutable segments and atomic manifests are the durable lexical lesson.**
    Search engines vary in files, distribution, and APIs, but point-in-time
    publication, rebuild, rollback, and external IDs are consistently valuable
    ([Lucene](products/apache-lucene.md), [Tantivy](products/tantivy.md),
    [Xapian](products/xapian.md)).
12. **Raw ranking scores are version-relative.** Segment-local IDs and scores
    are not stable evidence; analyzer, corpus, statistics, feature, model, and
    snapshot versions determine meaning ([Lucene](products/apache-lucene.md),
    [Vespa](products/vespa.md), [OpenSearch](products/opensearch.md)).
13. **Vectors add candidates, not truth.** ANN systems introduce model/data
    provenance, recall approximation, deletes, memory, filters, and operational
    complexity; they do not replace lexical exactness or citation evidence
    ([FAISS](products/faiss.md), [hnswlib](products/hnswlib.md),
    [Qdrant](products/qdrant.md), [pgvector](products/pgvector.md)).
14. **Learned rankers need labels and deterministic fallback.** LambdaRank-style
    objectives optimize a chosen metric over chosen labels; they do not create
    unbiased judgments, authority, or score portability
    ([LightGBM](products/lightgbm-ranking.md),
    [XGBoost](products/xgboost-ranking.md)).
15. **Transactional metadata and immutable payloads have different homes.** A
    database can own policy, leases, identities, and audit relationships while
    captures and derived artifacts remain content-addressed objects; neither is
    automatically tamper-proof ([PostgreSQL](products/postgresql-search-substrate.md),
    [RocksDB](products/rocksdb.md), [LMDB](products/lmdb.md)).
16. **Protocol typing does not define search or authority.** MCP supplies a
    generic tool transport and schema lifecycle, but no standard provenance,
    ranking, branch, coverage, cost, or permission semantics
    ([MCP tools](products/model-context-protocol-tools.md)).
17. **Hosted and OSS surfaces under one brand need not correspond.** Cloud
    behavior, versions, queues, retention, security fixes, and licenses may not
    match the public repository or SDK
    ([Firecrawl](products/firecrawl.md), [Scrapy Cloud](products/scrapy-cloud.md),
    [Bright Data Crawl](products/bright-data-crawl-api.md)).
18. **API prose, schemas, SDKs, and deprecation ledgers drift independently.**
    Examples can remain after model/endpoint shutdown, SDK polling can add
    retries absent from the API contract, and enums can retain discontinued
    products ([OpenAI](products/openai-web-search.md),
    [Oxylabs AI Crawler](products/oxylabs-ai-crawler.md),
    [Bright Data proxies](products/bright-data-proxy-networks.md)).
19. **Open software and open access do not grant content rights.** Software
    licenses do not clear crawled pages, benchmark constituents, queries, qrels,
    display, training, or redistribution
    ([Common Crawl](products/common-crawl.md), [BEIR](benchmarks/beir.md),
    [MS MARCO](products/ms-marco.md), [MIRACL](benchmarks/miracl.md)).
20. **A benchmark aggregate is not a product acceptance test.** Dataset/task
    composition, rights, preprocessing, contamination, temporal cutoff,
    languages, relevance density, and metric all matter; freshness,
    contradiction, provenance, safety, latency, and cost require project-owned
    evaluations ([BEIR](benchmarks/beir.md), [FreshQA](benchmarks/freshqa.md),
    [LoTTE](benchmarks/lotte.md), [MTEB Retrieval](benchmarks/mteb-retrieval.md)).

## Category decisions

| Category | Conclusion | Curiosity disposition |
| --- | --- | --- |
| Agent APIs | Useful separation of search/open/find, source inventories, progress, and hard budgets; model-managed trajectories are not authority. | **ADAPT** contract/UX; **REJECT** hosted foundation. |
| Search APIs | Useful filters, warnings, result bounds, and partial-failure vocabularies; provenance and coverage are generally insufficient. | **ADAPT** neutral fields; **REJECT** as semantic core; provider adapters only by separate decision. |
| Metasearch | Good transition lesson for adapter isolation, partial results, and fan-out accounting; inherits upstream rank, terms, outages, and hidden work. | **REJECT** target foundation; retain only as reversible transition. |
| Crawlers/frontiers | Durable state, politeness ownership, leases/generations, bounded retries, backpressure, and discovery edges are essential. | **ADAPT** public concepts/specifications; **REJECT** third-party crawler implementation in owned semantic core. |
| Browser/rendering | Needed for a measured minority of pages and costly to secure. | **DEFER**; static first; later isolated, disposable lane only. |
| Extraction | Typed candidates, structure preservation, acceptance/rejection reasons, and extractor versioning are essential. | **ADAPT** concepts and test oracles; build owned semantics; dependency exceptions separately reviewed. |
| Lexical/index | Positional inverted index, immutable segments, manifests, fielded BM25, tombstones, and rebuild are the baseline. | **ADAPT** published algorithms/patterns; **REJECT** third-party search engine/index as owned core. |
| Vector/ANN | Potential additional recall with material model, rights, memory, and drift costs. | **DEFER** until lexical baseline and rights-cleared evaluation demonstrate marginal gain. |
| Ranking | Transparent deterministic features, diversification, stage traces, and versioning first; LTR only with stable labels. | **ADAPT** published methods; **DEFER** learned ranking. |
| Storage | Transactional policy/identity metadata plus content-addressed captures and rebuildable projections fits local-first operation. | **ADAPT** reviewed commodity database/object storage; do not delegate semantics. |
| Protocols | JSON Schema/OpenAPI and later MCP can version wire boundaries; no protocol grants trust or action authority. | **ADAPT** at edges; native OpenCode first, MCP optional/later. |
| Corpora/benchmarks | Methods and rights-cleared fixtures help; public availability and framework licenses do not clear payload rights. | **ADAPT** methods; **DEFER/REJECT** each dataset until ledger approval; no bundled corpus. |

## Contradictions that the design must retain, not smooth over

- **Provenance:** provider-returned URLs, source names, proxy headers, or cited
  output spans are often called provenance, but they do not identify immutable
  bytes, extraction, passage, policy, or rank context. Curiosity uses
  capture-anchored citations; transition results must be labeled as weaker.
- **Hidden caching:** “live,” freshness maxima, and cache controls may coexist
  with undocumented transformed caches, stale fallback, browser caches, or
  partner feeds. Responses must disclose known cache/capture state and `unknown`.
- **Retention/ZDR:** marketing, FAQs, DPAs, and base customer terms can disagree.
  Signed scope-specific terms control; unknown retention blocks sensitive use.
- **Robots/politeness:** “honors robots” can hide parser, cache, redirect,
  `crawl-delay`, user-agent, bypass, and distributed-concurrency differences.
  Preserve the versioned input and exact decision for every attempt.
- **SSRF/render isolation:** URL allowlists and browser contexts are repeatedly
  presented as controls while post-DNS addresses, redirects, subresources,
  browser privileged processes, and host-kernel exposure remain. Egress policy
  must be independent of the fetcher/renderer.
- **Licensing versus content rights:** Apache/MIT/AGPL labels cover software,
  not pages or benchmark documents. “Open data,” robots allow, and public URL
  access are also not blanket rights grants.
- **API/SDK drift:** prose, OpenAPI, examples, SDK defaults/retries, release
  notes, and endpoint behavior have separate lifecycles. Compatibility evidence
  must pin each artifact and test the public contract without provider calls in
  deterministic tests.
- **Lifecycle:** products and models retire, preview names persist, jobs expire,
  and deprecation ledgers conflict with examples. Stable diagnostics and
  reversible adapters are mandatory.
- **Hosted versus OSS:** a brand's cloud may contain proprietary components or
  newer behavior than its repository; self-hosting does not make third-party
  semantics owned, and cloud claims do not validate OSS behavior.
- **Score versioning:** ordered results and numeric scores look absolute but are
  relative to corpus, candidate set, analyzer/statistics, model, and snapshot.
  Never compare across versions without an explicit calibration study.
- **Hidden fan-out:** one search call may rewrite into many queries, engines,
  page fetches, retries, and model steps. Enforce and report aggregate work, not
  only top-level calls or returned hits.

## Target architecture and integration map

```text
OpenCode researcher
  -> native adapter: web_search + deprecated formerhuman_search alias
     registration | schema mapping | effective permission fail-closed check
  -> canonical provider-neutral SearchRequest/SearchResponse
  -> local single-node runtime
     query API (read-only, bounded)
       -> lexical candidates -> policy/tombstone filter -> transparent rerank
       -> duplicate/source/time diversification -> capture-anchored passages
     admin API/CLI (separate authority)
       -> seed/import/crawl/pause/resume/delete/rebuild/backup/restore
     semantic core
       -> frontier/politeness -> static fetch -> capture gate
       -> extraction -> document/version graph -> segments/manifests
     commodity infrastructure boundary
       -> OS/runtime/TLS/database/object store/compression/observability

Optional later: MCP transport adapter -> same canonical domain API
Later and separately gated: single-tenant server, isolated render lane,
vectors/LTR, corpus cells, cluster. True multi-tenancy remains deferred.
```

Mapping to the inspected `opencode2-curiosity` path is intentionally narrow:
the native adapter preserves the `web_search` name, deprecated alias, bounded
request shape, stable redacted failures, no setup network call, untrusted-result
label, and effective researcher-only rule. It replaces the SearXNG wire adapter
with the canonical domain client. Rich capture/version/evidence fields can be
added through a versioned response while compatibility rendering remains
bounded. The runtime never imports OpenCode agent configuration or tool names.

### Responsibility and authority ledger

| Boundary | Owns | Must not own |
| --- | --- | --- |
| Runtime | Search semantics, hard work/result bounds, policy records, captures/versions, index snapshots, ranking/version traces, provenance, coverage/partial/stale disclosures | OpenCode registration, caller role assignment, action tools, ambient credentials |
| Native plugin | Tool registration and alias, request/response mapping, local endpoint selection, stable diagnostics, and **effective** researcher-only enforcement after configuration composition | Crawl/import/delete authority, rank semantics, evidence mutation, policy inferred from a skill |
| Skill | Human/agent procedure: frame questions, prefer primary evidence, inspect warnings, run bounded curiosity, cite and stop | Permission enforcement, credentials, network transport, hidden calls, runtime policy |
| MCP adapter (later) | Transport, capability negotiation, schema translation, cancellation/error mapping | Search semantics, permission discovery, corpus administration, score reinterpretation |
| Admin surface | Explicit crawl/import/delete/rebuild/backup/restore lifecycle under operator credentials and audit | Agent query traffic, implicit setup crawl, use of query credentials |
| Query surface | Bounded, read-only search over authorized snapshots | Seeds, crawl, import, delete, policy changes, arbitrary fetch, action authority |

## Curiosity semantics

Each research frame has a finite branch graph. A branch records parent/lineage,
intent, expected novelty, attempted query variants, snapshot, evidence overlap,
cost, and disposition. Retrieval should expose signals for:

- novelty relative to already selected evidence;
- support and contradiction candidates without claiming semantic truth;
- independent source diversity by host, publisher/owner, source type, and
  syndication cluster;
- explicit uncertainty and missing/partial evidence;
- temporal change across capture versions;
- branch lineage and rejected branches;
- exploration of under-covered sources/time/facets versus exploitation of known
  relevant regions; and
- marginal gain in new relevant, independent, capture-anchored evidence.

The caller supplies frame and aggregate budget. Search bounds every branch and
returns evidence; it cannot grant more tools or continue autonomously.
`GO` means a branch has expected in-frame marginal value within budget and
policy. `CURIOSITY_NO_GO` records a considered branch rejected for low value,
duplication, risk, rights, authority, or cost. `STOP` is mandatory at sufficient
coverage/saturation, budget exhaustion, policy block, repeated duplicates,
unavailable safeguards, or nonpositive measured marginal gain.

## Clean-room and dependency boundary

The project authors its crawl/frontier policy, extraction acceptance semantics,
document/capture/version identity, lexical structures and publication lifecycle,
ranking/diversification, evidence/provenance, deletion behavior, bounds, and
authority contract from public specifications, published algorithms, and
project-authored tests. It does not copy or translate third-party crawler,
extractor, search engine/index, hosted-provider, fixtures, generated tables,
prompts, or private behavior.

Every proposed dependency or dataset needs a ledger entry: exact name/version
and hash; role and replaceability; source and license/NOTICE; transitive
dependencies; security owner/update policy; data touched; network behavior;
content/data rights (separate from software license); clean-room review; and
approval/expiry. Commodity OS/runtime/TLS/database/object-storage/compression/
observability components may pass this gate. Search engines, crawlers, indexes,
hosted providers, copied implementations, and unreviewed corpora do not.

## Delivery sequence and gates

| Stage | Minimum deliverable | Gate |
| --- | --- | --- |
| 0 | Authority model, one bounded corpus cell, rights/dependency/benchmark ledgers, threat/privacy/illegal-content runbooks, project-owned fixtures and judgments | Legal, security, privacy, funding, and named operations owners approve; otherwise **STOP**. |
| 1 | Installable local single-node runtime skeleton, canonical domain API, separate query/admin credentials and schemas, status/health, empty-corpus offline behavior | Clean install/uninstall; no network/crawl on setup; query cannot mutate; deterministic version report. |
| 2 | Admin lifecycle plus static frontier/fetch/capture, policy/robots records, delete/tombstone, rebuild, backup/restore | Every durable capture is cleared and attributable; restore/rebuild drills pass; no rendering. |
| 3 | Document/version/extraction pipeline, owned lexical segments/manifests, transparent ranking/diversification, capture-anchored snippets, coverage/partial/stale warnings | Held-out relevance, provenance, bounds, deletion propagation, rollback, and latency gates pass. |
| 4 | Native OpenCode adapter preserving `web_search` and alias; effective researcher-only fail-closed tests; guidance skill | No authority expansion, setup call, secret leakage, or unstable diagnostics; local runtime loss fails safely. |
| 5 | Single-tenant server profile and/or optional MCP adapter, each separately reviewed | Canonical semantics remain identical; transport/admin/credential isolation and compatibility tests pass. |
| 6 | Independently gated selective rendering, vectors, and learned ranking | Each feature proves marginal slice-level gain, rights, fallback, isolation, and affordable capacity; otherwise disabled. |
| 7 | Language/region/vertical cells, then only if needed cluster operation | Cell-by-cell rights, quality, safety, staffing, backup, deindex, and funding gates; true multi-tenancy remains a new decision. |

## Distribution and corpus custody requirements

- **Install:** signed/versioned artifacts and manifest; explicit paths/ports;
  least privilege; dependency ledger; no bundled corpus, silent crawl, telemetry,
  or provider call. An empty runtime starts offline and returns a stable
  empty/unavailable-with-reason response.
- **Upgrade:** preflight schema/index compatibility, backup checkpoint, migration
  plan, rollback window, preserved old manifests, and explicit irreversible-step
  warning. Scores are not compared across rank/index versions by default.
- **Backup/restore:** separate policy/identity database, capture objects, index
  manifests, keys, and audit material; encryption and retention; integrity
  verification; documented RPO/RTO; restore and projection-rebuild drills.
- **Uninstall:** stop services, revoke local credentials, optionally export a
  custody manifest, and offer explicit retain/delete choices for corpus,
  quarantine, backups, logs, and configuration. Never silently delete or retain.
- **Offline:** query the last authorized local snapshot without network;
  disclose staleness and coverage. Admin crawl/import fails explicitly offline.
  Help, health, schema discovery, and uninstall need no network.
- **Custody:** imported/crawled bytes keep source, rights, policy, capture,
  version, deletion, and backup lineage. Corpus movement is an admin act; query
  clients and skills cannot import it.

## Capacity, legal, security, and operations gates

Capacity remains variable-driven: accepted captures and versions; compressed
capture/derived/index bytes; URL/frontier churn; hosts and politeness buckets;
fetch/render rate; corpus-change rate; query QPS/concurrency; candidate depth;
latency; backup retention; deletion SLO; languages/analyzers; judgment volume;
moderation/legal workload; and staffing/on-call coverage. No dollar estimate or
global-scale promise follows from this research.

Before any real crawl or corpus import: counsel must approve source/corpus rights,
jurisdictions, retention/display/training, takedown and illegal-content handling;
security must approve SSRF/DNS/redirect controls, parser isolation, provisional
capture gate, secrets and backup design; privacy must approve minimization and
data-subject handling; operations must own complaints, deletion, restore,
patching, observability, and incident response; funding must cover recurring
people and infrastructure, not only hardware. If restricted quarantine,
reporting, deletion, audit, or response capacity is unavailable, the crawl lane
is `STOP`.

## Confidence and unresolved decisions

**High confidence:** local-first/native-first sequence; query/admin separation;
runtime/plugin/skill/MCP authority boundaries; static-before-render; lexical
before vectors/LTR; capture-anchored evidence; score version relativity;
dependency and rights ledgers; no silent crawl or bundled corpus.

**Medium confidence:** PostgreSQL-like transactional metadata plus object and
segment stores is an appropriate reference profile; exact component choices
still require dependency review and measured workload evidence.

**Unresolved approval inputs:** initial corpus cell, language and jurisdictions;
publisher permission model; local platform matrix and packaging format; concrete
commodity dependencies; schema compatibility window; retention/history;
query/fetch QPS and p95 targets; storage and backup envelopes; takedown SLO;
single-tenant server need; funding and named operational owners. Global breadth,
cluster topology, and true multi-tenancy are not current product requirements.

**Stop conclusion:** the inventory is sufficient to recommend boundaries and a
gated local-first sequence. It is insufficient to authorize implementation,
select a corpus, approve dependencies, predict vendor superiority, claim product
completion, or accept either proposed ADR.
