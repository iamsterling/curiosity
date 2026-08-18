# Google Vertex AI Search: clean-room reverse engineering for owned search

**Research date / source access date:** 2026-08-17  
**Product naming:** Google is renaming **Vertex AI Search** to **Agent Search**. This report uses “Vertex AI Search” for the requested subject and “Agent Search” where current sources do. The API remains `discoveryengine.googleapis.com` and resources remain `discoveryengine` resources. [S1][S5]  
**Method:** Public documentation and public API contracts only. No account, credentials, paid test, traffic interception, decompilation, proprietary material, or implementation.  
**Evidence labels:** **Fact** = directly documented; **Inference** = conclusion from documented interfaces/behavior; **Recommendation** = Curiosity design advice; **Unknown** = not established from sources. Confidence is High / Medium / Low.

## Decision frame

**Decision:** Which observable Vertex AI Search ideas should Curiosity adopt, adapt, reject, or defer while building an owned, provider-neutral search and retrieval system?

Bounded sub-questions:

1. What are the ingestion, storage, refresh, ACL, retrieval, ranking, and answer-stage contracts?
2. Which behaviors are separable architectural lessons versus Google-specific managed capabilities?
3. What operational limits, prices, privacy commitments, and regional trade-offs materially affect a build-versus-buy comparison?
4. What must Curiosity own to preserve portability, auditability, bounded behavior, and trust?

Out of scope: measured relevance/latency, unpublished algorithms or infrastructure, contract negotiation, console-only experiments, and implementation.

## Executive verdict

Vertex AI Search exposes a strong **layered search system**: source connectors → typed data stores → parse/chunk/index → query understanding → broad hybrid retrieval → reranking/business controls → optional grounded generation. Its best transferable ideas are stage separation, stable document/chunk identities, explicit freshness and deletion semantics, authorization-aware retrieval, observable rank signals, golden-query evaluation, and claim-to-source citation structures. [S2][S3][S4][S6][S8][S9][S13]

The product is not a blueprint for an owned engine. Core relevance algorithms, embeddings, cross-attention, query rewriting, proprietary relevance signals, personalization models, and answer models are opaque and mutable. Managed data stores are deeply coupled to Discovery Engine resource paths, schemas, IAM, editions, locations, and billing. Some important configuration choices are creation-time irreversible. [S1][S3][S4][S8][S11]

**Recommendation (High): ADAPT, do not clone.** Copy the explicit contracts and safety boundaries, not Google-specific resource topology or model behavior. Curiosity should retain canonical source records, portable ACLs, parser/chunker provenance, independently reproducible lexical and vector indexes, rank-stage traces, and citation spans. Treat any provider as a replaceable adapter.

## Reconstructed system model

```text
sources / connectors / crawler
  -> normalized source records + stable IDs + ACL principals + timestamps
  -> parser (digital | OCR | layout | customer-parsed)
  -> optional layout-aware chunks + parent/page provenance
  -> typed data store / index (website | structured | unstructured | media)
  -> app + serving configuration (may blend stores)
query
  -> rewrite / decomposition / classification / spell and intent handling
  -> retrieval (keyword + embeddings + graph/web + cross-attention + freshness + events)
  -> metadata/relevance/ACL filters
  -> ranking (default model + boosts + formula + order + tuned/event reranking)
  -> search results, snippets, chunks, rank/retrieval signals
  -> optional answer generation
  -> claim spans + references + support scores + safety/fallback state
```

**Inference (High):** The public API reveals distinct control-plane and serving-plane concepts: projects/locations/collections contain data stores, branches, documents/chunks, apps (“engines”), serving configurations, controls, sessions, evaluations, and long-running operations. This is consistent with immutable/slow indexing artifacts plus request-time policy and ranking. It does not reveal physical index technology or service decomposition. [S1][S3][S4][S5]

## Ingestion, connectors, and normalization

### Source coverage

- **Fact (High):** First-party custom-search ingestion includes public websites; one-time or periodic BigQuery; Cloud Storage; Google Drive; Gmail; Google Sites; Google Calendar; Google Groups; Cloud SQL; Spanner; Firestore; Bigtable; AlloyDB for PostgreSQL; and API-uploaded structured JSON. [S2]
- **Fact (High):** The adjacent Gemini Enterprise connector platform uses the same Discovery Engine/data-store concepts and offers Google and third-party connectors. Documented examples include Confluence, Jira, SharePoint, OneDrive, Outlook, Teams, Slack, Salesforce, ServiceNow, Box, Dropbox, GitHub, GitLab, Notion, Zendesk, and many more. It supports separate entity and identity synchronization. [S14]
- **Caveat (High):** The connector catalog is rapidly changing and product packaging overlaps Gemini Enterprise. Availability in a given Vertex AI Search/Agent Search edition, region, and console must be checked at procurement time; this report does not equate every Gemini Enterprise connector with every standalone Agent Search SKU. [S14]
- **Fact (High):** Connector ingestion can create a separate data store per source entity type (for example, Jira issues, comments, attachments, and worklogs). Connectors may use indexed ingestion or federation; federation avoids copying but Google warns search quality can be lower. [S14]

### Documents, schemas, parsing, and chunks

- **Fact (High):** A data store is single-type: website pages, structured rows/JSON records, unstructured files, media records, or (deprecated) healthcare FHIR resources. Custom search apps and stores can be many-to-many; a blended app can address up to 50 stores. [S1]
- **Fact (High):** Structured schemas can be supplied or auto-detected; Google says explicit schemas typically improve quality. Fields can be annotated for search, retrieval, filtering, faceting, and key-property mappings. [S1][S2]
- **Fact (High):** Unstructured formats include TXT, JSON/parsed content, Markdown, PDF, HTML, DOCX, PPTX, XLSX, and XLSM. A file is limited to 200 MB and a batch import to 100,000 files. Structured Cloud Storage imports use NDJSON/JSONL, with each file under 2 GB, each row under 1 MB, and up to 1,000 files per request. [S2]
- **Fact (High):** The free digital parser extracts machine-readable text. PDF OCR can process at most the first 500 pages. The paid layout parser identifies paragraphs, tables, lists, images, titles, and headings according to format; optional image/table annotations can become retrieval and answer evidence. [S8][S10]
- **Fact (High):** Layout-aware chunking is selected at store creation, defaults to a 500-token maximum, supports 100–500 tokens, and can prepend ancestor headings. Chunking cannot later be enabled or disabled. Customers can instead bring parsed documents or pre-chunked documents in documented JSON structures. Processed parsed/chunked documents can be exported with `getProcessedDocument`. [S8]
- **Inference (High):** Exportable processed artifacts and bring-your-own chunks are meaningful portability escape hatches, but not full index portability: proprietary embeddings, posting lists, model scores, and tuned models are not exported by these interfaces. [S8]

### Identity and reconciliation

- **Fact (High):** Batch imports support `INCREMENTAL` upsert or `FULL` rebase; full reconciliation adds/updates present records and removes records absent from the source. Auto-generated payload-hash IDs may not remain stable between imports, and Google recommends full reconciliation when using them repeatedly. [S2][S7]
- **Fact (High):** Connector full syncs include additions, updates, and deletions and replace store contents. Incremental syncs capture additions/updates but not identity data or deletions. Connector identity sync is independently schedulable. [S14]
- **Recommendation (High):** Curiosity should require adapter-stable source IDs, version/checksum, observed-at and source-updated-at timestamps, and explicit tombstones. Hash-generated IDs should be a fallback, never the primary identity contract.

## Data stores and freshness

- **Fact (High):** A custom app can blend multiple stores, with request-level and per-store filters/boosts. Stores attached to a non-blended app cannot later be swapped; blended mode must start with at least two stores and can never drop below two. A connected store generally cannot be disconnected. [S1]
- **Fact (High):** One-time BigQuery/Cloud Storage imports require manual refresh. Periodic BigQuery ingestion supports 1-, 3-, or 5-day updates and cannot be manually refreshed. Periodic BigQuery connector stores do not enforce source ACLs. [S2]
- **Fact (High):** Connector schedules support full entity/identity sync from every 3 hours to 7 days; independent identity sync can be as frequent as 30 minutes; incremental entity sync defaults to every 3 hours and does not carry deletions. [S14]
- **Fact (High):** Basic website search mirrors Google Search freshness. Advanced indexing supports automatic best-effort discovery/recrawl, sitemap-driven refresh, and explicit recrawl. Automatic refresh regularly refreshes stores with at least 50 queries in 30 days. Manual recrawl allows 20 calls/project/day and 10,000 literal URLs/call; an operation can run up to 24 hours. [S11]
- **Fact (High):** A recrawled page returning 4xx or 5xx is removed. In exact sitemap mode, removing the URL removes it from the index; in discovery mode sitemap removal alone does not. [S11]
- **Inference (High):** Freshness is source-specific and partly demand-driven, not a uniform service-level guarantee. “Automatic” can be stale, periodic imports can be days behind, and incremental connector sync misses deletions until full sync. [S2][S11][S14]
- **Recommendation (High):** Curiosity should expose a freshness budget and state per record/store (`source_updated_at`, `last_seen_at`, `indexed_at`, `delete_observed_at`, lag, sync mode), not a generic “synced” boolean. Deletion SLOs deserve separate monitoring.

## Retrieval and ranking

### Candidate generation

- **Fact (High):** Google documents query understanding and rewriting before retrieval. Retrieval selects “thousands” of documents and scores signals including keyword/knowledge-graph/web topicality, embeddings, cross-attention, freshness, and user events. Ranking then serves up to the top 400. [S3]
- **Fact (High):** Search result diagnostics can expose retrieval sources such as `KEYWORD_SEARCH` and `SEMANTIC_SEARCH`, semantic relevance, and rank signals. [S4]
- **Inference (Medium):** This is a hybrid, multi-stage candidate pipeline rather than a single vector nearest-neighbor lookup. The precise fusion, candidate quotas per channel, model architectures, and calibration are unknown. [S3][S4]

### Ranking and controls

- **Fact (High):** Ranking stages include boosts/buries, custom formulas, explicit ordering, model tuning, and event-based reranking. Boosts affect the first 1,000 retrieved candidates; the system ranks the top 400. [S3]
- **Fact (High):** Serving controls include boost, filter, synonyms, redirect, and promote. Controls attach to serving configurations and can activate on query terms and time windows. Quotas allow 1,000 controls/project and 100 of each boost/filter/redirect/synonym control per serving configuration. [S5][S21]
- **Fact (High):** Formula ranking can combine proprietary semantic/deep relevance/topicality signals, BM25 keyword similarity, default rank, document age, predicted CTR rank, aggregate boost, geodistance, and retrievable numeric document fields. Responses can return contributing `rankSignals`. [S4]
- **Fact (High):** Search tuning is limited to unstructured stores. It requires at least 100 training queries, relevant 250–500-word segments, and recommends at least 10,000 random-negative segments. Tuning can take days and can be A/B selected per request before publication. CMEK-protected stores cannot be tuned. [S12][S16]
- **Fact (High):** The evaluation API uses golden query→target URI/page sets and reports precision, recall, and NDCG at 1/3/5/10, aggregate and per query. It supports up to 20,000 queries/set but is Preview, limited to one active evaluation/project and five creations/day, and does not evaluate blended apps. [S13]
- **Recommendation (High):** Adopt a transparent reranking algebra and stage trace (`candidate_source`, raw score, normalized score, feature contribution, policy action, final rank). Provider-specific scores must remain advisory because proprietary scales are not stable contracts.

## Grounding, answers, and citations

- **Fact (High):** `search` returns retrieval results and can return summaries; `answer` combines query understanding, search, answer generation, multi-turn state, and complex-query handling. Calling both separately lets clients show links before the slower generated answer. [S9]
- **Fact (High):** Query rephrasing is on by default. Advanced answer behavior can decompose compound questions, synthesize conversational context, simplify long queries, and execute ReAct-style multi-step search/reasoning (default maximum five steps). [S9]
- **Fact (High):** Search summaries are generated from top extractive answers or semantic chunks. Semantic-chunk summaries can use at most 10 results; older extractive-answer summaries cite at most five top results. Citations map answer character/byte spans to reference indexes, documents/URIs, and sometimes chunk content/page identifiers. [S9]
- **Fact (High):** The answer API can return per-claim support scores and aggregate answer support, and can suppress answers below a configured grounding threshold. Citations and support scores are optional, not proof of truth. [S9]
- **Fact (High):** Vertex AI model grounding with Agent Search can use at most 10 data stores. Grounding metadata may be absent when source relevance is low or the response is incomplete. [S15]
- **Inference (High):** The product treats retrieval and generation as separable latency/failure domains and makes answer provenance a structured response object rather than only formatted text. This is a strong owned-search pattern. [S9][S15]
- **Recommendation (High):** Curiosity should render search independently, make generation optional, preserve exact evidence text and immutable source/version IDs, and represent citations as claim-span→evidence-span edges. “No supported answer” should be a first-class successful result, not an exception.

## Access control

- **Fact (High):** Cloud IAM controls who can administer or call Discovery Engine resources; it is separate from document-level source authorization. Google recommends narrowly scoped custom roles for production search users rather than broad Viewer roles. [S5][S6]
- **Fact (High):** Document/source access control is Preview. It is available for Cloud Storage, BigQuery, Google Drive, and third-party sources; search identifies the end user through Google Identity or Workforce Identity Federation and returns only authorized documents. [S6]
- **Fact (High):** ACL stores embed user/group principals under `acl_info.readers`; the documented limit is 3,000 readers per document. One identity provider can be selected per supported location. ACL mode must be enabled at store creation and cannot later be toggled. [S6]
- **Fact (High):** Imported BigQuery permissions are not automatically inherited. A normal import can expose imported data to anyone with sufficient Agent Search permissions. Periodic BigQuery connectors explicitly do not respect imported ACLs. [S2][S6]
- **Inference (High):** Authorization is a retrieval invariant only when ACL mode, identity mapping, source ACL sync, and caller identity all align. Configuration mistakes create high-impact overexposure risk. [S2][S6][S14]
- **Recommendation (High):** Curiosity should fail closed. ACL normalization and identity mapping must be versioned inputs to indexing; every result should carry an authorization decision trace; stale identity data and unsupported ACL forms should suppress results. Never infer source ACL inheritance.

## Limits and pricing snapshot

All prices are public list prices in USD observed 2026-08-17 and can change. They exclude network, source services, logging, model tokens where separately charged, and negotiated discounts. [S10]

### Material limits

| Limit | Documented value |
|---|---:|
| Data stores/project | quota 100; technical maximum stated as 500 |
| Engines/project | quota 150; technical maximum stated as 500 |
| Documents/project/location | 10,000,000 |
| Search requests/project/location | 300/min under general pricing |
| LLM search-summary/multi-turn requests | 60/min |
| Ranking API | 500 requests/min |
| Async document imports | 5/min |
| Document writes | 12,000/min |
| Blended stores/app | 50 |
| Search results served after ranking | top 400 |
| Manual recrawl | 20 calls/day; 10,000 URLs/call |

Source: [S1][S3][S5][S11]. Quotas are project-shared across Agent Search and Gemini Enterprise; configurable pricing is the prescribed route above general search QPM. [S5]

### General pricing

- Standard search (semantic retrieval and KPI optimization): **$1.50 / 1,000 queries**.
- Enterprise search (website capability and core generative answers): **$4.00 / 1,000 queries**.
- Advanced generative answers add-on: **+$4.00 / 1,000 user-input queries**.
- Index storage: **$5/GiB/month**, first 10 GiB free; website storage is billed as 500 KiB × indexed pages.
- OCR: first 1,000 pages/month free, then tiered from **$1.50 / 1,000 pages**.
- Layout parser: **$10 / 1,000 pages**.
- Standalone Ranking API: **$1 / 1,000 counts**, where each count covers up to 100 documents.
- Grounded Generation on own retrieved data: **$2.50 / 1,000**, plus model input/output and retrieval charges.

### Configurable pricing

- Minimum commitment: **1,000 QPM and 50 GB**.
- Published equivalents: **$6/QPM/month**, **$1/GB/month** base storage.
- Add-ons: semantic **$0.75/1,000 queries + $1.50/GB/month embeddings**; KPI/personalization **$0.20/1,000**; core answers **$2/1,000**; advanced answers **$4/1,000**. [S10]

**Inference (High):** Costs couple product behavior to architecture: duplicate URLs inflate storage; parsing is page-metered; answers compound retrieval, generation, and potentially model-token charges; semantic and personalization are explicit add-ons in configurable pricing. [S2][S10]

## Safety, privacy, and security

- **Fact (High):** Google states Agent Search customer data is not used to train foundation models; foundation models are frozen for service processing. Customer-specific models are project-specific and their data is also not used to train foundation models. [S17]
- **Fact (High):** SafeSearch filters explicit public website results but is unavailable for private content. Generated summaries are separately filtered for derogatory, sexual, toxic, violent, and policy-violating content even when SafeSearch is off; policy blocks return a structured skipped reason/fallback. [S18]
- **Fact (High):** Data residency at rest is available with `us` and `eu` endpoints, and ML processing occurs within the selected US/EU multi-region. Google recommends `global` for latency and full features. Regional limitations include no basic website search, no search-result influence from user events, reduced autocomplete/dynamic facets, Preview analytics, no media stores, and potentially non-identical results. [S19]
- **Fact (High):** VPC Service Controls apply to Standard and Enterprise. CMEK is Enterprise-only and only for US/EU multi-regions; keys cannot be retroactively attached to existing apps/connectors, protected stores cannot use search tuning, and blended stores must share the CMEK configuration. Access Transparency is US/EU only. [S16][S20]
- **Unknown (Medium):** Exact retention of query text, answer sessions, user-event data, connector credentials, intermediate parsed content, and model-side prompts was not established by the Agent Search-specific sources reviewed. The general Cloud data-processing terms and product documentation should be contractually checked rather than inferred from “not used to train.”
- **Recommendation (High):** “Not trained on” is not a complete privacy property. Curiosity needs explicit retention classes, deletion propagation, purpose limitation, region, encryption, operator-access, and audit contracts for every artifact.

## Architecture clues and lock-in

### Observable clues

1. **Resource topology:** apps/engines are serving compositions; stores own documents, schema, processing configuration, chunks, and controls; serving configs select request-time behavior. [S1][S5]
2. **Broad-then-narrow retrieval:** thousands of candidates → boosts/formula/rerank over bounded subsets → at most 400 served. [S3]
3. **Multiple representations:** documents, extracted segments, semantic chunks, structured metadata, custom embeddings, user events, and identity mappings coexist. [S3][S8][S9]
4. **Asynchronous control plane:** imports, purge, recrawl, tuning, and evaluation use long-running operations with partial-failure metadata. [S2][S11][S12][S13]
5. **Online policy layer:** query/time-conditioned controls and per-request formula, filter, order, user/location, and fine-tuning selection avoid rebuilding the underlying index for many changes. [S4][S5]
6. **Evaluation loop:** labeled queries and events drive explicit offline evaluation, tuning, predicted-CTR ranking, and personalization. [S3][S12][S13]

### Lock-in ledger

| Area | Lock-in evidence | Severity | Portability response |
|---|---|---:|---|
| Resource identity | Discovery Engine paths, apps/stores/branches/serving configs | High | Provider-neutral IDs and adapter mappings |
| Index/relevance | Proprietary semantic, deep-relevance, topicality, cross-attention and event models | High | Own lexical/vector baseline and golden eval set |
| Processing | Google parsers/chunk annotations; some settings immutable | Medium | Store source bytes, parser version, exported parsed/chunk JSON |
| ACL/identity | Google Identity/WIF and source-specific identity stores | High | Canonical user/group graph and fail-closed adapter |
| Answers | Google answer model versions, query decomposition, support scoring | High | Separate answer contract; retain evidence and independent verifier |
| Operations | Quotas, editions, region/feature differences, LRO APIs | Medium | Capability matrix, budgets, portable job state |
| Data model | Schema annotations and key-property mappings | Medium | Canonical schema plus provider projections |
| Tuning/events | Provider-trained customer model and event semantics | High | Own labels/events; export training/eval corpora |

## Clean-room lessons for Curiosity

### Adopt

1. **Stage contracts and asynchronous jobs.** Separate connect, normalize, parse, chunk, index, retrieve, rerank, answer, and evaluate; return bounded job status and failure samples.
2. **Full vs incremental reconciliation.** Make deletion behavior explicit and test it independently.
3. **Hybrid retrieval with a bounded rerank pool.** Lexical and semantic candidates should be traceable before reranking.
4. **Serving-time controls.** Versioned filters, boosts, synonyms, promotions, and time windows should not require index rebuilds.
5. **Golden-query evaluation.** Own query→document/page/chunk labels and track precision, recall, NDCG, answer support, ACL correctness, freshness, and latency.
6. **Citation graph.** Preserve claim spans, source versions, evidence spans, pages, and support status.
7. **Fail-closed source ACLs.** Authorization is part of retrieval, not a UI post-filter.

### Adapt

1. **Data stores → provider-neutral corpora.** Avoid irreversible app/store topology; allow controlled attach/detach, aliasing, and reindex migration.
2. **Custom formula ranking → typed feature pipeline.** Keep feature definitions, normalization, provenance, and versioning explicit; avoid proprietary-score dependence.
3. **Chunking → reproducible transforms.** Preserve parent/ordinal/page/heading relations and permit parallel chunk strategies instead of a creation-time permanent choice.
4. **Connector schedules → freshness policies.** Derive schedules from source rate limits and deletion SLOs; distinguish identity sync from content sync.
5. **Answer support score → evidence policy.** Use calibrated thresholds only after corpus-specific evaluation; always provide a deterministic fallback.

### Reject

1. **Provider resource paths as domain identifiers.** They leak topology and block migration.
2. **Implicit ACL inheritance.** Source permissions must be explicitly normalized and verified.
3. **Opaque “semantic relevance” as sole truth.** Keep lexical retrieval and testable ranking baselines.
4. **Creation-time irreversible processing choices.** Curiosity should support reprocessing into versioned indexes.
5. **Demand-driven freshness without an SLO.** Query volume is not a safe freshness policy.
6. **Answer-first UX.** Results and evidence should remain useful if generation is slow, blocked, unsupported, or wrong.

### Defer

1. Learned personalization/event reranking until privacy, cold-start, feedback integrity, and evaluation are mature.
2. ReAct-style multi-hop answering until single-hop retrieval and citations meet reliability targets.
3. Rich multimodal parsing/answers until text, tables, ACLs, deletion, and source provenance are dependable.
4. Large connector breadth until a narrow connector contract survives multiple heterogeneous sources.

## Verification checks before relying on Google or copying a pattern

1. **ACL canary:** one allowed and one denied user for direct membership, nested group, removed membership, deleted document, and stale identity sync.
2. **Freshness canary:** measure create/update/delete visibility separately across batch, connector, and web sources.
3. **Citation audit:** validate every claim span against returned evidence and exact source version; measure uncited/incorrectly cited claims.
4. **Ranking regression:** fixed golden set across lexical-only, hybrid, boosts, formula, tuned, and event reranked modes.
5. **Failure bounds:** malformed files, parser limits, partial imports, recrawl timeout, quota exhaustion, and unavailable answer model.
6. **Portability drill:** export canonical records, ACLs, parsed text, chunks, labels, and user events; rebuild an independent index and compare quality.
7. **Cost replay:** duplicate URLs, page-heavy PDFs, semantic add-ons, answer call fan-out, and QPM overages.
8. **Regional parity:** compare required features and outputs on `global`, `us`, and `eu`; do not assume identical behavior.

## Unknowns and negative results

- **Unknown:** physical indexing engine, ANN algorithm, tokenizer/analyzers, shard/replica strategy, cache policy, candidate quotas by retrieval channel, fusion method, exact reranker architecture, score calibration, and production latency SLOs. Public docs expose behavior, not internals.
- **Unknown:** whether every current Gemini Enterprise connector is independently licensable and API-configurable in standalone Agent Search; source navigation shows overlap but packaging must be verified.
- **Unknown:** complete artifact-level retention/deletion timelines and connector-secret custody from Agent Search-specific documentation.
- **Unknown:** exportability of learned tuning models, generated embeddings, index postings, click models, and full evaluation history. No public export contract was found in reviewed sources.
- **Negative result:** no public source found that guarantees automatic web refresh latency; documentation explicitly says best effort and potentially stale.
- **Negative result:** no evidence that BigQuery permissions are inherited automatically; documentation warns the opposite.
- **Negative result:** no evidence that citations guarantee factual correctness; metadata can be absent and support is a score, not proof.
- **Negative result:** no paid or authenticated experiment was performed, so relevance, latency, ACL enforcement, and deletion behavior remain unverified empirically.

## Bounded curiosity pass

Scoring: 1–5 each for relevance (R), decision value (V), novelty (N), and cost (C, lower is better). Priority = R + V + N − C.

| Gap/thread | R | V | N | C | Priority | Outcome |
|---|---:|---:|---:|---:|---:|---|
| Connector sync/deletion/identity semantics | 5 | 5 | 4 | 2 | 12 | Pursued via current connector architecture source [S14] |
| Web deletion and refresh guarantees | 5 | 5 | 3 | 1 | 12 | Pursued via recrawl source [S11] |
| Ranking observability/evaluation loop | 5 | 5 | 4 | 2 | 12 | Pursued via custom ranking/tuning/evaluation [S4][S12][S13] |
| Exact internal ANN/reranker implementation | 3 | 2 | 5 | 5 | 5 | **CURIOSITY_NO_GO:** unpublished, low transferability, clean-room boundary |
| Paid empirical latency/relevance benchmark | 5 | 5 | 3 | 5 | 8 | **CURIOSITY_NO_GO:** credentials/paid tests prohibited |
| Exhaustive connector-by-connector catalog | 3 | 2 | 2 | 5 | 2 | **CURIOSITY_NO_GO:** catalog volatility; representative coverage sufficient |
| Contract-specific retention and negotiated terms | 4 | 5 | 2 | 5 | 6 | **CURIOSITY_NO_GO:** requires legal/account materials outside public-doc frame |

**Stop condition:** Coverage reached for every requested topic; the highest-value contradictions (ACL inheritance, deletion semantics, regional feature parity, and freshness) were resolved or explicitly bounded. Remaining gaps require proprietary access, paid tests, or low-value catalog enumeration.

## Source register

All sources are primary Google Cloud documentation, accessed **2026-08-17**.

- **[S1]** [About apps and data stores](https://cloud.google.com/generative-ai-app-builder/docs/create-datastore-ingest) — resource relationships, data-store types, blended search, 50-store limit.
- **[S2]** [Create a search data store](https://cloud.google.com/generative-ai-app-builder/docs/create-data-store-es) and [Prepare data for ingesting](https://cloud.google.com/generative-ai-app-builder/docs/prepare-data) — sources, formats, batch limits, BigQuery modes and ACL warning.
- **[S3]** [About retrieval and ranking](https://cloud.google.com/generative-ai-app-builder/docs/ranking-overview) — query rewrite, retrieval signals, thousands of candidates, ranking stages, top 400.
- **[S4]** [Customize search results ranking](https://cloud.google.com/generative-ai-app-builder/docs/custom-ranking) — rank formula, standard/custom signals, BM25, diagnostics, Clearbox tuning workflow.
- **[S5]** [Quotas and limits](https://cloud.google.com/generative-ai-app-builder/quotas) — allocation and rate quotas, shared quota scope.
- **[S6]** [Set up data source access control](https://cloud.google.com/generative-ai-app-builder/docs/data-source-access-control) and [Access control with IAM](https://cloud.google.com/generative-ai-app-builder/docs/access-control) — document ACLs, identity federation, limits, recommended permissions.
- **[S7]** [Refresh structured and unstructured data](https://cloud.google.com/generative-ai-app-builder/docs/refresh-data) — incremental/full reconciliation and refresh APIs.
- **[S8]** [Parse and chunk documents](https://cloud.google.com/generative-ai-app-builder/docs/parse-chunk-documents) — parsers, chunking, immutable settings, bring/export parsed and chunked data.
- **[S9]** [Get answers and follow-ups](https://cloud.google.com/generative-ai-app-builder/docs/answer) and [Get search summaries](https://cloud.google.com/generative-ai-app-builder/docs/get-search-summaries) — answer pipeline, decomposition, citations, support, safety options.
- **[S10]** [Agent Search pricing](https://cloud.google.com/generative-ai-app-builder/pricing) — general/configurable search, storage, parser, ranking, grounding prices.
- **[S11]** [Refresh web pages using automatic and manual refresh](https://cloud.google.com/generative-ai-app-builder/docs/recrawl-websites) — web freshness, recrawl limits, deletion behavior.
- **[S12]** [Improve search results with search tuning](https://cloud.google.com/generative-ai-app-builder/docs/tune-search) — labeled data requirements, limits, lifecycle.
- **[S13]** [Evaluate search quality](https://cloud.google.com/generative-ai-app-builder/docs/evaluate-search-quality) — golden query sets and precision/recall/NDCG evaluation.
- **[S14]** [Gemini Enterprise: introduction to connectors and data stores](https://cloud.google.com/gemini/enterprise/docs/connectors/introduction-to-connectors-and-data-stores) — connector entities, federation/indexing, full/incremental/identity sync, schedules, source catalog.
- **[S15]** [Grounding with Vertex AI Search](https://cloud.google.com/vertex-ai/generative-ai/docs/grounding/grounding-with-vertex-ai-search) — grounding metadata and ten-store maximum.
- **[S16]** [Customer-managed encryption keys](https://cloud.google.com/generative-ai-app-builder/docs/cmek) — CMEK scope and limitations.
- **[S17]** [Data governance and generative AI](https://cloud.google.com/generative-ai-app-builder/docs/data-governance) — foundation-model and customer-specific-model data-use statements.
- **[S18]** [Responsible AI](https://cloud.google.com/generative-ai-app-builder/docs/responsible-ai) — SafeSearch, generated-output filters, fallback states.
- **[S19]** [Agent Search locations](https://cloud.google.com/generative-ai-app-builder/docs/locations) — residency, regional ML processing, multi-region limitations.
- **[S20]** [Compliance and security controls](https://cloud.google.com/generative-ai-app-builder/docs/compliance-security-controls) — VPC-SC, CMEK, Access Transparency, and certification pointers.
- **[S21]** [Configure serving controls for search](https://cloud.google.com/generative-ai-app-builder/docs/configure-serving-controls) — boost, filter, synonym, redirect, and promote controls and activation conditions.

## Overall confidence

**High** for documented public contracts, limits, pricing snapshot, and feature constraints. **Medium** for reconstructed stage boundaries and lock-in implications. **Low / unknown** for unpublished physical architecture, empirical quality/latency, and account-specific commercial or retention terms.
