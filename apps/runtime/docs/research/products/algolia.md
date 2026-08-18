# Algolia: clean-room architectural lessons

**Research date / source access:** 2026-08-17  
**Purpose:** architectural study only; Algolia is **not** proposed as a Curiosity production dependency.  
**Method boundary:** public Algolia documentation, pricing, legal, and status surfaces only. No account, credentials, paid test, private endpoint, traffic interception, source extraction, bypass, or implementation was used.

## Decision frame

**Decision:** Which externally observable Algolia patterns should Curiosity adopt, adapt, reject, or defer while preserving a provider-neutral, owned retrieval architecture?

Bounded sub-questions:

1. What contracts exist for records, indexing, updates, and publication?
2. How are textual relevance, business ranking, rules, sorting, and personalization composed?
3. What are the typo, facet, filter, and analytics semantics?
4. What public evidence supports claims about distribution, consistency, and availability?
5. Which costs, limits, proprietary semantics, and data loops create lock-in?
6. Which lessons are sufficiently generic and independently expressible for clean-room adoption?

Out of frame: reproducing Algolia's engine, API, wire compatibility, UI, proprietary ranking internals, or commercial benchmarking.

## Executive verdict

Algolia's strongest architectural lesson is not an undisclosed search algorithm. It is the separation of a **denormalized search projection**, **asynchronous publication plane**, **ordered relevance policy**, **query-time curation**, and **behavioral feedback plane**. Public documentation exposes their contracts well enough to learn from those boundaries, but not enough to recreate the implementation.

| Pattern | Verdict | Curiosity treatment |
|---|---|---|
| Stable source-owned record identity and denormalized search projection | **ADOPTED** | Keep canonical source identity and a rebuildable retrieval projection. |
| Async mutation receipt plus explicit publication barrier | **ADOPTED** | Return operation IDs; distinguish accepted, applied, and query-visible states. |
| Atomic shadow rebuild and alias/swap | **ADOPTED** | Rebuild off-path, validate, then atomically promote. |
| Lexicographic relevance stages | **ADAPTED** | Use explicit stages and deterministic tie-breaks, but define Curiosity's own portable scoring contract. |
| Rules as versioned policy separate from records | **ADOPTED** | Keep bounded, auditable curation with validity windows and provenance. |
| Facets as both navigation and personalization vocabulary | **ADAPTED** | Preserve typed metadata, but do not couple identity or all personalization to facets. |
| Replica-per-sort as the public query contract | **REJECTED** | Keep sort/rerank intent provider-neutral; permit adapters to materialize views internally. |
| Vendor-owned analytics-to-ranking loop | **REJECTED** | Curiosity owns events, consent, retention, joins, features, and experiment assignments. |
| Exact Algolia typo/ranking/filter semantics | **REJECTED** | Avoid behavioral cloning and contract lock-in; specify outcome properties instead. |
| Hosted distributed topology | **DEFERRED** | Useful evidence, but not transferable without workload, failure, and cost measurements. |

**Overall confidence: high** for documented product contracts and posted prices; **medium** for architectural inferences; **low** for internal implementation details and real-world tail behavior.

## 1. Indexing contract and data model

### Facts

- A record is a schema-flexible JSON-like set of attributes. Algolia recommends including the data needed to search, rank, filter, and render a result, even when that repeats source data. Attributes are searchable by default until `searchableAttributes` is configured. [S1][S2]
- Records are identified by `objectID`. Algolia can generate one, but updates and deletes require it; incremental-update guidance explicitly recommends mapping it to a source-owned key. [S3][S4]
- The write surface supports full replacement, partial attribute updates, deletion, and filtered deletion. Writes can create absent records depending on the chosen operation. Client helpers chunk writes, commonly at 1,000 records; Algolia recommends roughly 10 MB / 1,000–10,000 records per batch, while the service-level request ceiling is 1 GB. Batching reduces calls, not billed operation count. [S3][S5][S6]
- All indexing operations are asynchronous queue jobs and return a `taskID`. A wait operation is the explicit completion barrier. Jobs usually complete in milliseconds or seconds, but queue depth governs delay. [S7]
- Full replacement is implemented at the public contract level as: copy configuration to a temporary index, populate it, then replace the original. Searches continue during the rebuild; failed builds do not replace the original. Temporary record count can double. [S8]
- Export is supported: records through browse/CLI and configuration as settings, synonyms, and rules. This reduces data captivity, although it does not export the engine's derived index structures or reproduce result semantics elsewhere. [S9]
- Algolia documents conditional numeric operations for last-write/version gating and optimistic locking. Critically, a rejected conditional update does not provide direct rejection feedback; the client must wait and re-read to verify. [S10]

### Inferences

- **High confidence:** Algolia treats the index as a **derived read model**, not the system of record. Denormalization, source-owned IDs, partial updates, and full rebuild all point to a CQRS-like projection boundary.
- **High confidence:** `taskID` acknowledges queueing and eventually completion, not necessarily a caller-specific freshness SLA. Publication delay is workload- and topology-dependent.
- **Medium confidence:** the temporary-index swap implies an indirection layer between logical index name and physical generation. The mechanism behind that indirection is not public.
- **High confidence:** silent conditional-update rejection is an unsafe contract for authoritative state. It is acceptable only when the source remains canonical and reconciliation exists.

### Curiosity implications

1. Define a provider-neutral `DocumentProjection` with canonical source ID, version, source timestamp, content digest, typed fields, and provenance. Never let a provider-generated ID become canonical.
2. Mutation results should carry `operation_id`, accepted count, rejected count where known, and state: `accepted | applied | query_visible | failed`. A separate freshness watermark should identify the highest source version query-visible per corpus.
3. Support idempotent upsert/delete plus guarded updates, but make conditional rejection observable. Reconciliation must compare source inventory/digests against each projection.
4. Treat full rebuild as a first-class generation protocol: build, validate completeness and policy, canary, atomic promote, retain bounded rollback, then garbage-collect.
5. Keep records and all policy artifacts exportable in open, versioned forms. Search-engine derived state must always be disposable.

## 2. Ranking formula, custom ranking, and rules

### Facts

- Algolia describes default ranking as an ordered **tie-breaking** sequence, not one disclosed weighted sum: Typo, Geo (when applicable), Words (when applicable), Filters, Proximity, Attribute, Exact, then Custom. A later criterion only participates while earlier criteria remain tied. [S11][S12]
- Attribute priority comes from ordered searchable attributes and word position. Custom ranking uses boolean or numeric business fields and is last by default. Algolia explicitly recommends reducing metric precision to create ties so later custom criteria can matter. [S2][S12]
- An index has one ranking/sorting strategy that cannot be changed at query time. Algolia says pre-sorting during indexing improves performance; alternate sorting is exposed through replica indices. [S13]
- Rules are separate index policy objects. Conditions can match query patterns, filters, or caller-supplied contexts; consequences can pin/hide, add query parameters, rewrite/remove terms, replace a query, return custom data, or add filtering/boosting. Rules may have validity windows. A rule supports up to 25 conditions; conditions are ORed, while pattern/filter/context inside one condition are jointly required. [S14][S15]

### Inferences

- **High confidence:** the ordered criteria make relevance explainable as a comparison tuple. This is operationally easier to reason about than a single opaque score, but may make small changes to early stages dominate every later business signal.
- **High confidence:** precision is policy. Numeric rounding is not just storage optimization; it controls how frequently subsequent ranking dimensions get a vote.
- **Medium confidence:** index-time pre-sorting trades query flexibility for latency predictability and creates operational/cardinality cost as sort variants grow.
- **High confidence:** rules form a query-policy layer distinct from base retrieval. They can also become an unbounded second programming language unless typed, versioned, and constrained.

### Curiosity implications

- Represent ranking as explicit stages: eligibility → lexical/semantic match → trust/quality → freshness → diversity → optional context → deterministic tie-break. Each stage must emit reason codes and bounded feature values.
- Do not copy Algolia's exact ordering or semantics. Curiosity needs its own documented, testable relevance contract and may use calibrated score fusion where appropriate.
- Make curation policy immutable by version, scoped, time-bounded, explainable, and attributable. Enforce maximum rules, conditions, rewrites, promoted items, and execution budget.
- Keep “retrieve,” “rerank,” “sort,” and “curate” separate in the provider-neutral contract. A provider adapter may map sort to a replica, but callers should not name replicas.

## 3. Replicas and personalization

### Replicas: facts and lessons

- Standard and virtual replicas automatically follow primary record changes and cannot accept direct record mutations. Standard replicas are full copies for exhaustive sort; virtual replicas are views for relevance-preserving sort and support only a subset of settings. [S13]
- Standard replicas multiply billed/stored record count; virtual replicas do not, though Algolia says they add a small amount of primary-index size. The documented limit is 20 virtual replicas per index. [S13][S16][S17]
- Replica settings, rules, and synonyms have forwarding and synchronization nuances; direct policy changes can diverge. [S13][S16]

**Inference (high confidence):** exposing alternate sort through index identity couples a user-facing capability to deployment topology. It is performant but leaks infrastructure into application contracts.

**Recommendation:** Curiosity accepts a bounded sort/rerank specification. Physical generations, materialized sort views, and replicas stay adapter-internal and are costed by the planner.

### Personalization: facts and lessons

- Classic personalization builds per-user affinities from click/view/like/purchase-style events, extracts facet values from interacted records, weights event types and facets, and boosts matching facet values. Algolia states textual/business/merchandising relevance remains part of the strategy and personalization impact is configurable. [S18]
- Advanced Personalization likewise builds user profiles from standardized events and facet categories, then combines profiles with keyword or NeuralSearch retrieval. [S19]
- The advanced real-time mode is documented as beta. Historical mode operates over hours/days and persistent users; real-time mode uses seconds/minutes of session behavior. The page also says real-time personalization activates only for new users while historical personalization applies to returning users—an unusually strict product statement that should not be generalized. [S20]

### Inferences and risks

- **High confidence:** facets do double duty as navigation taxonomy and learned-user feature space. This is economical, but taxonomy mistakes propagate into filtering, analytics, and personalization simultaneously.
- **High confidence:** event identity (`userToken`), index metadata, and vendor profile state form a strong data/network-effect lock-in loop.
- **Medium confidence:** personalization can reinforce popularity and narrow exposure unless evaluation includes diversity, novelty, and protected-segment checks. Public pages emphasize engagement/relevance, not a complete fairness model.

### Curiosity implications

- Own pseudonymous event IDs, consent state, retention, deletion, experiment assignment, and feature computation outside any search provider.
- Separate navigational taxonomy from personalization features even when values overlap.
- Personalization must be opt-in by policy, bounded after base relevance, disableable per query, and accompanied by non-personalized fallback and reason codes.
- Do not adopt a persistent profile until deletion propagation, cold start, poisoning resistance, fairness/diversity metrics, and regional privacy constraints are specified.

## 4. Typo tolerance

### Facts

- Typo tolerance is enabled by default and is based on edit operations: insertion, deletion, substitution, and transposition. Algolia documents up to two typos per word, with special treatment when the first character is wrong. [S21]
- Defaults allow one typo at four characters and two at eight; first-character errors count more heavily for ranking. Modes include on, off, `min`, and `strict`. Numeric tokens are typo-tolerant by default, and attributes or words can opt out. Quoted queries, punctuation/special characters, and logographic languages have documented exceptions. [S21][S22]
- Typo count is the first default ranking criterion, so exact matches dominate one-typo matches, which dominate two-typo matches. [S11][S21]

### Inferences and recommendations

- **High confidence:** typo tolerance is a candidate-generation policy and a ranking policy; treating it as only fuzzy matching misses the relevance effect.
- **High confidence:** identifier-like fields (URLs, codes, hashes, domains, versions) require stricter behavior than natural language. Numeric typo tolerance is hazardous for years, ports, IDs, and security-sensitive queries.
- **Recommendation:** Curiosity should define field-typed fuzziness, language-aware normalization, strict exact lanes for identifiers, and a hard expansion budget. Preserve original query and report which correction/normalization caused a match.
- **Rejected:** cloning Algolia's thresholds, edit treatment, or mode names. Test Curiosity outcomes against corpus-specific typo sets instead.

## 5. Faceting and filters

### Facts

- Filterable/faceted attributes must be declared. `filterOnly` avoids facet-count overhead; `searchable(...)` enables searching facet values. [S23]
- The general `filters` expression supports string and numeric predicates with AND/OR/NOT. `numericFilters` and `facetFilters` are alternate forms with different capabilities. Algolia limits combined filters to 1,000. [S15]
- Facets return contextual values and counts. At large scale counts may be approximate, exposed by `exhaustiveFacetsCount`. Default facet values per response are 100 and maximum 1,000. [S24]
- Hierarchical facets are encoded as denormalized level paths. The docs warn that deeply nested or high-cardinality facets increase metadata and can harm performance; disjunctive hierarchical facets are not supported. [S24]

### Inferences and Curiosity implications

- **High confidence:** declaring filterable fields is a capacity and security decision, not merely schema metadata. Unbounded cardinality and Boolean complexity are denial-of-service vectors.
- Use a typed filter AST rather than provider query strings. Validate fields/operators, nesting depth, clause count, cardinality, and authorization before adapter translation.
- Responses should mark facet counts `exact | approximate | unavailable`, include scope, and never imply exactness from an integer alone.
- Security filters must be injected and enforced separately from user facets; they must not be overridable by rule or query text.

## 6. Analytics and feedback

### Facts

- Search analytics include popular/no-result searches and click-through measures; click, conversion, and revenue metrics require client or server events. Dashboard exports are available as CSV/XLSX. [S25]
- Search-as-you-type queries are aggregated by edit distance, timestamp (within 30 seconds), and user ID; the final query is counted. IP is the default identity unless a user token is supplied. Backend searches need a forwarded user identity or token to avoid collapsing all users onto a server IP. [S26]
- Query-attributed conversion/revenue relies on `queryID` joins. Algolia allows uploading general historical events from only the last four days, and query-linked event timestamps must be within one hour of the related search/browse request. [S27]
- The posted service limit for Analytics API reads is 100 calls/minute/application; processed analytics tag combinations are also bounded. Pricing currently lists analytics retention as 7 days Free, 30 Grow, and 90 Grow Plus/Elevate. [S17][S28]

### Inferences and Curiosity implications

- **High confidence:** analytics semantics are part of relevance behavior. Aggregation windows, identities, attribution joins, and late-event rules materially change metrics.
- **High confidence:** provider query IDs and short late-arrival windows create migration friction and make independent replay difficult.
- Curiosity should own an append-only event envelope: event ID, pseudonymous actor/session, query ID, request/experiment version, corpus generation, result IDs/positions, action, client/server timestamps, consent, and provenance.
- Keep raw events and derived metrics separate; version sessionization and attribution logic; make late-arrival policy explicit. Never use IP as the primary analytical identity.
- Treat event payloads as untrusted. Rate-limit, deduplicate, schema-check, and defend training/ranking feedback from bot or merchant manipulation.

## 7. Updates, freshness, and distributed-operation evidence

### Public evidence

- Classic infrastructure is documented as three identical bare-metal servers, separated across data centers/providers, using Raft for update consensus. Searches continue with one available server; indexing may queue during partitions. Algolia explicitly says it chooses availability over consistency and that short-lived result discrepancies can occur. [S29]
- DSN adds independent data/configuration duplicates near users. Main-cluster indexing is finalized first, then replayed on DSN nodes; updates may lag by up to minutes. Clients use nearest-server selection and fallback hosts. DSN is an add-on and is not available on dynamic infrastructure. [S30][S31]
- Dynamic infrastructure independently scales search and indexing and is the home of newer features, but the public page does not disclose consensus, replication factor, partition behavior, or durability protocol. [S31]
- Algolia's infrastructure/subprocessor list corroborates a mixture of cloud, colocation, server, DNS/CDN, and observability providers, but does not prove per-application topology. [S32]
- The current SLA posts plan-specific monthly availability from 99.95% through optional 99.999%; exclusions and client-version eligibility apply. This is a commercial remedy, not evidence of a particular architecture or a freshness guarantee. [S33]

### Evidence assessment

| Claim | Classification | Confidence |
|---|---|---|
| Classic applications use three-server clusters and Raft | Vendor-documented fact | High for stated design; not independently tested |
| Searches favor availability during failures | Vendor-documented behavior | High |
| All reads are always mutually consistent | Contradicted by Algolia's own docs | High |
| DSN reads can be minutes stale after writes | Vendor-documented bound (“up to a few minutes”) | High |
| Dynamic infrastructure has the same topology/consistency as classic | Unknown; no public support found | High confidence in unknown |
| Posted uptime proves index freshness or durability | False inference | High |

### Curiosity implications

1. Specify availability and freshness independently. A successful query can be stale; a successful mutation can still be unpublished.
2. Carry `generation`, `indexed_through`, and `served_region/replica` where feasible. Allow callers to request bounded staleness or route freshness-sensitive reads to an authoritative region.
3. Pause or reject writes when the system cannot preserve the declared mutation contract; do not silently imply global visibility.
4. Separate search serving, indexing, replication, and analytics scaling. Failure drills must test queue growth, replay, replica lag, split-brain prevention, and generation rollback.
5. Treat vendor architecture pages as hypotheses until Curiosity has its own load, chaos, recovery-point, and recovery-time evidence.

## 8. Pricing, limits, and cost shape (as posted 2026-08-17)

### Current public prices

| Plan | Included search / records | Posted overage / contract | Selected capability notes |
|---|---|---|---|
| Free | 10,000 search requests/month; 50,000 records | Free; no card | 7-day analytics retention |
| Grow | 10,000 requests/month; 100,000 records | $0.50/additional 1,000 requests; $0.40/additional 1,000 records | Keyword search; 10 rules/index; 30-day analytics |
| Grow Plus | 10,000 requests/month; 100,000 records | $1.75/additional 1,000 requests; $0.40/additional 1,000 records | Advanced Personalization/AI features; 10,000 rules/index; 90-day analytics |
| Elevate | Custom | Annual contract / request pricing | NeuralSearch, real-time personalization, dynamic infrastructure, enterprise options |

Source: live pricing page text [S28]. A “search request” can contain one or more search operations; autocomplete can create a request per keystroke. Records are summed across indices, and pre-sorted standard copies increase record count. Algolia ignores the three highest record-count days in monthly record billing. [S28]

### Selected hard/service limits

- Application/index size: 100 GB, except 1 GB Free; record size: 10–100 KB by plan, 10 KB Free; search request body: 50 MB; indexing batch body: 1 GB. [S17]
- Pending requests: 5,000; throttling: 100 pending; indexing rate: documented as 10,000 operations per unit where applicable. [S17]
- Query text: 512 bytes; pagination: 20,000; filters: 1,000; facet values/query: 1,000; virtual replicas/index: 20. [S17]
- Standard replicas multiply record count; virtual replicas do not. Full shadow rebuild can temporarily double records. [S8][S16]

### Contradiction retained

The generated service-limit documentation says indices/application are “1,000 (Premium), 50 (Grow), or 10 (Free),” while the live pricing comparison says **20 Free, 50 Grow/Grow Plus, 1,000 Elevate** and no longer presents “Premium” as a current plan. [S17][S28] The pricing page is more current for purchasing, but this conflict means limits must be checked at procurement/runtime rather than hard-coded from documentation.

### Cost implications

- **High confidence:** cost scales on both request volume and maximum stored records; search-as-you-type, federated calls, replicas, segmentation indices, and reindex overlap are cost multipliers.
- **High confidence:** feature gates can be more consequential than unit prices—advanced personalization, rule counts, retention, AI ranking, and infrastructure differ by plan.
- Curiosity should meter provider-neutral units internally: logical query, physical provider calls, documents/bytes stored, mutation operations, materialized copies, events, and egress. Budgets need preflight estimates and hard ceilings.

## 9. Lock-in analysis

| Lock-in vector | Evidence | Severity | Mitigation |
|---|---|---:|---|
| Record/query schema | Algolia attribute settings, facet modifiers, filter syntax | Medium | Canonical typed schema and adapter compiler |
| Relevance semantics | Ordered criteria, rules, exact/typo behavior | High | Curiosity-owned ranking spec, golden relevance set, reason codes |
| Sort topology | Replica index names encode sort strategy | High | Logical sort contract; adapter-owned materialization |
| Behavioral data | `queryID`, `userToken`, profiles, short event windows | High | First-party event ledger and feature store |
| UI/client coupling | Search-only keys, InstantSearch, Insights integrations | Medium–high | Curiosity gateway and provider-neutral UI model |
| Commercial plan gates | Rules, retention, personalization, infrastructure | High | Capability negotiation and graceful degradation |
| Export gap | Records/config exportable, derived engine state/behavior not portable | Medium | Rebuild drills on an alternate owned backend |
| Legal/IP boundary | Terms restrict competitive development and reverse engineering | High | Legal review; abstract lessons only; no behavioral cloning [S34] |

The public export path is meaningful but insufficient: data can leave, while ranking equivalence, profiles, aggregated analytics, and operational behavior do not automatically transfer.

## 10. Clean-room transfer boundary

Algolia's January 12, 2026 Terms state that the service and documentation are proprietary and restrict using the service/documentation to develop a competitive product and reverse engineering except where law permits. API clients may be open source under their accompanying licenses. [S34]

Accordingly this report:

- records only public, documented contracts and high-level architectural patterns;
- does **not** copy source, proprietary assets, undocumented responses, exact algorithms, API compatibility, or UI;
- rejects exact behavioral cloning of ranking, typo, rules, filters, or personalization;
- recommends independently specifying Curiosity requirements from first principles and validating them against Curiosity-owned corpora;
- requires legal review before any transfer that goes beyond generic patterns widely used in information retrieval and distributed systems.

**Clean-room lesson:** adopt the problem decomposition, not Algolia's expression of it.

## 11. Unknowns and required checks

### Material unknowns

1. Internal posting-list/index structures, scoring calculations inside criteria, cache topology, shard strategy, and query planner are not public.
2. Dynamic-infrastructure replication, durability, consistency, failover, and regional placement details were not found in public docs.
3. No independent latency, freshness, RPO/RTO, or recovery validation was performed; no credentials were used.
4. Exact atomicity across records in a batch is not established by the reviewed sources. A request/job boundary must not be assumed to be a transaction.
5. Whether task completion means visibility on every DSN/region is not stated; DSN lag documentation suggests it does not.
6. Personalization profile export completeness and reproducibility of vendor-derived profiles were not established.
7. Current limits conflict across pricing and generated docs; contractual service orders may override public pages.

### Checks before Curiosity adopts analogous behavior

- Define conformance tests for idempotency, partial failure, ordering, conditional rejection, and read-after-write.
- Test generation promotion under crash, timeout, duplicate delivery, and stale workers.
- Establish relevance golden sets by language/field type, including typo and identifier attacks.
- Load-test facet cardinality and filter complexity with explicit work budgets.
- Validate event deletion, late arrival, bot poisoning, attribution replay, and non-personalized fallback.
- Measure region/replica lag and expose it; do not infer freshness from uptime.
- Run quarterly portability drills from canonical records/policy/events to an alternate backend.

## 12. Bounded curiosity pass

Budget: one follow-up pass over contradictions and high-value gaps, public sources only.

| Thread | Relevance (5) | Value (5) | Novelty (5) | Cost (5 low=good) | Action |
|---|---:|---:|---:|---:|---|
| Pricing/service-limit plan-name contradiction | 5 | 4 | 4 | 1 | **Pursued**: compared live pricing with generated limits; contradiction retained above. |
| Task completion versus DSN visibility | 5 | 5 | 4 | 2 | **Pursued**: async and DSN docs do not establish global visibility; retained as unknown. |
| Dynamic topology parity with classic | 4 | 4 | 3 | 3 | **Pursued to saturation**: public dynamic page omits topology; stopped rather than speculate. |
| Independent status incident triangulation | 3 | 3 | 2 | 3 | **CURIOSITY_NO_GO**: status API fetch yielded only the status shell in this environment; incident mining would not establish steady-state architecture. |
| Black-box free-tier ranking experiments | 4 | 3 | 3 | 5 | **CURIOSITY_NO_GO**: would require account/credentials and risks crossing the declared clean-room/terms boundary. |
| Client source inspection for retry details | 3 | 3 | 2 | 3 | **CURIOSITY_NO_GO**: public docs already state host retry behavior; source inspection adds little decision value and raises copying risk. |
| Patent/source-code reconstruction | 2 | 1 | 3 | 5 | **CURIOSITY_NO_GO**: outside frame, legally sensitive, and unnecessary for architectural lessons. |

**Stop condition:** coverage reached for every framed sub-question; additional public pages repeated the same contracts, while the remaining high-value gaps require vendor disclosure or empirical testing forbidden by the frame.

## Sources

All sources are Algolia primary sources accessed **2026-08-17** unless noted.

- **[S1]** [Prepare your records for indexing](https://www.algolia.com/doc/guides/sending-and-managing-data/prepare-your-data)
- **[S2]** [Searchable attributes](https://www.algolia.com/doc/guides/managing-results/must-do/searchable-attributes/)
- **[S3]** [Send and update your data](https://www.algolia.com/doc/guides/sending-and-managing-data/send-and-update-your-data)
- **[S4]** [Incremental updates](https://www.algolia.com/doc/guides/sending-and-managing-data/send-and-update-your-data/how-to/incremental-updates)
- **[S5]** [Sending records in batches](https://www.algolia.com/doc/guides/sending-and-managing-data/send-and-update-your-data/how-to/sending-records-in-batches)
- **[S6]** [Partial update objects](https://www.algolia.com/doc/libraries/sdk/methods/search/partial-update-objects)
- **[S7]** [Index operations are asynchronous](https://www.algolia.com/doc/guides/sending-and-managing-data/send-and-update-your-data/in-depth/index-operations-are-asynchronous)
- **[S8]** [Replace all records](https://www.algolia.com/doc/libraries/sdk/methods/search/replace-all-objects)
- **[S9]** [Export and import indices and settings](https://www.algolia.com/doc/guides/sending-and-managing-data/manage-indices-and-apps/manage-indices/how-to/export-import-indices)
- **[S10]** [Handling concurrency with versioning](https://www.algolia.com/doc/guides/sending-and-managing-data/send-and-update-your-data/in-depth/handling-concurrency-with-versioning)
- **[S11]** [The eight ranking criteria](https://www.algolia.com/doc/guides/managing-results/relevance-overview/in-depth/ranking-criteria)
- **[S12]** [Custom ranking](https://www.algolia.com/doc/guides/managing-results/must-do/custom-ranking)
- **[S13]** [Understanding replicas](https://www.algolia.com/doc/guides/managing-results/refine-results/sorting/in-depth/replicas)
- **[S14]** [Rules overview](https://www.algolia.com/doc/guides/managing-results/rules/rules-overview)
- **[S15]** [Filters and facet filters](https://www.algolia.com/doc/guides/managing-results/refine-results/filtering/in-depth/filters-and-facetfilters)
- **[S16]** [Replica impact on record count and operations](https://www.algolia.com/doc/guides/managing-results/refine-results/sorting/in-depth/replicas-impact-on-pricing)
- **[S17]** [Algolia service limits](https://www.algolia.com/doc/guides/scaling/algolia-service-limits)
- **[S18]** [How Classic Personalization works](https://www.algolia.com/doc/guides/personalization/classic-personalization/what-is-personalization/in-depth/how-personalization-works)
- **[S19]** [How Advanced Personalization works](https://www.algolia.com/doc/guides/personalization/advanced-personalization/what-is-advanced-personalization/in-depth/how-does-advanced-personalization-work)
- **[S20]** [Real-time and historical personalization](https://www.algolia.com/doc/guides/personalization/advanced-personalization/what-is-advanced-personalization/in-depth/real-time-personalization-and-historical-personalization)
- **[S21]** [Typo tolerance](https://www.algolia.com/doc/guides/managing-results/optimize-search-results/typo-tolerance)
- **[S22]** [Configure typo tolerance](https://www.algolia.com/doc/guides/managing-results/optimize-search-results/typo-tolerance/in-depth/configuring-typo-tolerance)
- **[S23]** [Declare attributes for faceting](https://www.algolia.com/doc/guides/managing-results/refine-results/faceting/how-to/declaring-attributes-for-faceting)
- **[S24]** [Faceting](https://www.algolia.com/doc/guides/managing-results/refine-results/faceting)
- **[S25]** [Search analytics](https://www.algolia.com/doc/guides/search-analytics/overview)
- **[S26]** [Query aggregation and processing](https://www.algolia.com/doc/guides/search-analytics/concepts/query-aggregation)
- **[S27]** [Choose how to send events](https://www.algolia.com/doc/guides/sending-events/getting-started)
- **[S28]** [Pricing](https://www.algolia.com/pricing/)
- **[S29]** [Servers and clusters](https://www.algolia.com/doc/guides/scaling/infrastructure/classic/servers-clusters)
- **[S30]** [Distributed Search Network](https://www.algolia.com/doc/guides/scaling/infrastructure/classic/distributed-search-network-dsn)
- **[S31]** [Dynamic scaling infrastructure](https://www.algolia.com/doc/guides/scaling/infrastructure/dynamic/dynamic)
- **[S32]** [Infrastructure and subprocessors](https://www.algolia.com/policies/infrastructure-and-sub-processors/)
- **[S33]** [Service Level Agreement](https://www.algolia.com/policies/sla/) (page last updated 2025-08-27)
- **[S34]** [Terms of Service](https://www.algolia.com/policies/terms/) (last updated 2026-01-12)
