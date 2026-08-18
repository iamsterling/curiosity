# Diffbot Knowledge Graph: clean-room reverse-engineering dossier

**Research and source-access date:** 2026-08-17  
**Scope:** Diffbot Knowledge Graph only: its published ontology, global graph,
Search/DQL, Enhance identity matching, provenance, freshness, ranking, economics,
privacy, and legal boundary. **Crawl API and Extract API are excluded.** They are
mentioned only as upstream activities that Diffbot itself says produce the KG;
their customer-facing contracts are not analyzed here.  
**Status:** research and architecture recommendations, not an implementation,
benchmark, legal opinion, purchase approval, or representation of undocumented
internals.

## 1. Decision frame and method

### Decision

Which observable Diffbot KG concepts should Curiosity adopt, adapt, reject, or
defer while retaining provider-neutral contracts, bounded authority, auditable
identity history, claim-level evidence, and an owned retrieval path?

### Bounded sub-questions

1. What entity, relationship, type, date, and identifier model is public?
2. What does Diffbot expose about entity resolution, canonicalization, merges,
   splits, redirects, and Enhance matching?
3. What are DQL's query, filter, projection, sort, facet, clustering, result,
   error, snapshot, and cost contracts?
4. How are origins, crawl times, confidence, updates, and stale data represented?
5. Which scale and coverage statements are measurable contracts versus vendor
   claims?
6. What architecture is minimally implied, and what remains proprietary?
7. What privacy, legal, security, and operational limits constrain Curiosity?

### Method, authority, and evidence labels

Only public first-party Diffbot documentation, OpenAPI renderings, a public
machine-readable ontology, product/pricing pages, privacy policy, terms, and data
rights material were used. No account was created; no credential, paid/free API
query, dashboard, restricted document, proprietary code, or response corpus was
used. The public ontology endpoint was read anonymously and summarized, not
copied into the repository. No control was bypassed. All sources were accessed
2026-08-17.

- **FACT** — directly stated or observable in a cited primary source.
- **INFERENCE** — least-assumptive architecture conclusion from those facts.
- **RECOMMENDATION** — a Curiosity design or governance choice.
- **UNKNOWN** — not established by reviewed primary sources.
- Confidence is **high**, **medium**, or **low**.

Vendor claims establish what Diffbot says, not independent quality, accuracy,
completeness, freshness, or scale. Public documentation examples were not treated
as live behavioral tests.

## 2. Executive synthesis and verdict

**FACT (high):** Diffbot presents the KG as a self-updating, vendor-operated
graph of more than 10 billion public-web entities, produced from billions of
pages and trillions of facts. A record is generally a fusion of data from
multiple websites. DQL searches the global graph; Enhance matches partial Person
or Organization inputs and can optionally refresh existing origins or search for
new ones [S1, S2, S12]. These are first-party scale/product statements.

**INFERENCE (high):** the observable system is not merely a graph database. It
is a pipeline of source acquisition, typed extraction, entity resolution,
canonical-fact selection, inference, relation construction, graph/index
publication, structured retrieval, and optional targeted refresh. The boundaries
are supported by contracts; the models, scoring weights, physical stores, and
schedulers are not public.

**Core limitation (high):** Diffbot exposes unusually useful entity IDs, ID
redirects, graph version, origin URLs, per-origin crawl times, query rewrites,
matched nested values, and some confidence. It does **not** publicly guarantee
immutable source captures, exact evidence passages, complete field-to-origin
derivations, contradiction/rejected-fact history, merge/split events, historical
snapshot replay, or calibrated confidence for every fact [S3, S4, S9–S11].

### Verdict

- **ADOPT:** stable logical IDs plus alias/redirect resolution; explicit graph
  snapshot/version; typed linked entities; precise nested filters; separate
  projection; match context; query-rewrite and partial-coverage disclosure.
- **ADAPT:** origins and crawl timestamps into immutable claim-level evidence;
  Enhance into a reviewable candidate-resolution contract; `should`/`must`
  boosting into inspectable provider-neutral ranking stages; coverage reports
  into durable corpus-quality telemetry.
- **REJECT:** Diffbot as Curiosity's owned KG foundation; DQL as Curiosity's
  public ABI; `size=-1` on agent paths; query-string credentials; popularity as
  relevance or truth; opaque confidence as evidence; silent refresh/search.
- **DEFER:** a Diffbot adapter, live quality/freshness benchmark, enterprise
  security/DPA review, and response-retention interpretation until separately
  authorized fixtures, budget, procurement, privacy, and legal review exist.

## 3. Product boundary and observable dataflow

```text
public web + named structured datasets
  -> source observations
  -> typed facts and inferred facts
  -> entity resolution / source fusion / canonical-fact selection
  -> linked ontology records
  -> versioned KG publication + retrieval indexes
       -> DQL: typed filtering / ranking / sort / facet / export
       -> Enhance: candidate retrieval / match scoring
            -> optional refresh of known origins
            -> optional web search for additional origins
```

**FACT (high):** Diffbot says each entity is produced by crawling, structuring,
and processing public-web pages, that facts are linked to entities, and that one
entity generally fuses several websites [S1]. Its source list also names Wikidata
and many geographic datasets with their licenses, so “public web” must not be
read as “only ordinary crawled webpages” [S11].

**INFERENCE (high):** graph build and query serving are distinct. `kgversion` in
responses, mutable identity redirects, a current machine-readable ontology, and
special Article backends imply publication boundaries and multiple serving
indexes. They do not prove a specific storage engine or batch/streaming design.

## 4. Entity and ontology schema

### 4.1 Type system

**FACT (high):** Diffbot defines an ontology as properties and meaningful
relationships by entity type. The human documentation highlights Article,
Organization, Person, Place, AdministrativeArea, CreativeWork, Product, Image,
Video, Event, FAQ, JobPost, and LegalEntity. The anonymously accessible ontology
JSON observed on the access date exposed metadata including KG version `481`, 61
type definitions, 54 composite definitions, 26 enums, and five taxonomies [S2,
S3]. This point-in-time count can change and includes internal/base/subtypes, not
61 disjoint top-level product classes.

**FACT (high):** ontology JSON describes type hierarchy and field metadata such
as primitive/composite/entity, list, enum, deprecated, documented, and fact
status. Representative hierarchy/subtype names include `DiffbotEntity`,
`Organization`, `Company`, `Corporation`, `LocalBusiness`, `Person`, `Place`,
`AdministrativeArea`, `Country`, `Article`, `Product`, and `CreativeWork` [S3].

**FACT (high):** every KG entity has common logical fields including:

- `id`, `diffbotUri`, `type`, and `types`;
- canonical `name`, `description`, `image`, plus all-name/description/URI forms;
- `importance`, `nbIncomingEdges`, and Wikipedia page-view signals;
- `crawlTimestamp`;
- in extended mode, `origins`, `originDetails`, and `nbOrigins`;
- optionally requested `nonCanonicalFacts` [S4].

**FACT (high):** fields are optional in actual records. `type` is the top-level
type; `types` contains all applicable types. Linked values can carry a compact
entity projection including `name`, `type(s)`, `diffbotUri`, and
`targetDiffbotId`. Dates use structured objects with surface string, timestamp,
and precision; examples such as `d1964-XX-XX` preserve partial dates [S5–S7].

### 4.2 Representative domain shapes

| Type | Representative documented shape | Material observation |
| --- | --- | --- |
| Person | aliases/transliterations, public URIs and contacts, locations, education, employment, skills, colleagues, relatives, dates, nationalities, interests | Many properties are sensitive personal data; employment and education are nested temporal relations [S5, S26]. |
| Organization | legal/registry identifiers across jurisdictions, names/URIs, locations, classifications, employees, financials, investors, parent/subsidiary, supplier/customer/competitor, acquisition/dissolution, technographics | `Organization` spans corporations, local businesses, non-profits, and others; legal entity and commercial organization are separately linkable [S6]. |
| Article | URL/resolved URL, title, author, text/HTML, date/estimated date, site/language, categories, tags, quotes, media, sentiment, crawl time | Article IDs and serving behavior differ from durable fused Person/Organization records; Article has special dedupe/cluster and backend semantics [S7, S12]. |
| Place | hierarchical administrative links, address/surface form, coordinates and precision | Place data includes licensed structured datasets, not only webpage observations [S11]. |

**FACT (high):** `nonCanonicalFacts=true` can return facts whose fields are not
defined by the ontology. The `nonCanonicalFacts` field enumerates those keys
[S4, S8].

**INFERENCE (high):** the model is a typed property graph exposed as nested JSON,
not a raw triple interface. Relationships may appear as embedded linked-entity
objects or relationship composites (for example employment with employer, title,
dates, and current status). DQL path traversal operates over that projected
document shape. This does not establish whether the physical source of truth is
a property graph, triple store, document index, or several systems.

**RECOMMENDATION (high):** Curiosity should own a smaller, versioned neutral
schema. Keep `Entity`, `Claim`, `Relation`, `Observation`, and `Evidence` distinct;
model partial temporal precision; retain provider-native payload separately; and
map vendor fields through an adapter rather than copying the ontology or DQL.

## 5. Identity resolution and canonical facts

### 5.1 IDs, aliases, redirects, merges, and splits

**FACT (high):** an alphanumeric Entity ID uniquely identifies the current KG
entity, and `diffbotUri` is that ID under a Diffbot entity URL. Direct lookup uses
`id:<id>` [S9, S13].

**FACT (high):** Organization IDs “rarely” change, but can change after
undermerged records are merged, overmerged records are split, or an organization
is acquired, bankrupt, or dissolved. Diffbot internally redirects old IDs to a
current ID. A lookup by old ID can therefore return a different current `id`;
Diffbot tells clients to update stored IDs. `allOriginHashes` retains secondary
IDs without the leading `E`, and both DQL and Enhance resolve redirects [S9].

**FACT (medium):** the Article ontology says an Article ID is directly derived
from the “most authoritative origin” [S7]. The reviewed documentation does not
define that authority function, collision behavior, or whether Article redirects
have the same lifecycle as Organization redirects.

**INFERENCE (high):** identity is mutable equivalence-class membership with a
current representative, not an immutable one-to-one ID-to-real-world-object
mapping. Redirects preserve lookup continuity but do not expose a complete
merge/split ledger. `allOriginHashes` is useful alias material, not a documented
ordered history with event reasons and times.

### 5.2 Enhance candidate matching

**FACT (high):** Enhance accepts only `Person` or `Organization` and can use ID,
name(s), URL(s), phone, location, description, or IP; Person additionally accepts
email(s), employer, title, and school. It scores several candidates, returns at
most one by default, and supports `size` and a caller threshold. More input is
said to improve matching. A `customId` can correlate calls [S10].

**FACT (high):** Diffbot says the default cut-off is based on the **F2 score** and
therefore favors recall. The response separates `score` (Enhance score) from
`esscore` and includes `kgversion`, request/query context, per-result errors, and
optional refresh/search debug structures. The public docs do not publish feature
weights, score calibration, training data, candidate depth, or false-match rates
[S10].

**INFERENCE (high):** Enhance is probabilistic entity linking over a candidate
index. Its match score is neither a canonical-fact confidence nor a probability
that all returned fields are correct. `esscore` strongly suggests a retrieval
engine score, but naming a specific engine or formula would exceed the evidence.

**RECOMMENDATION (high):** Curiosity entity resolution should return multiple
bounded candidates, normalized feature agreements/conflicts, source independence,
threshold/version, and `matched | ambiguous | no_match | redirected` state.
Automatic merges need stricter thresholds and reversible review than retrieval.
Never use a vendor match score as claim truth.

## 6. DQL query and response contract

### 6.1 Transport and modes

**FACT (high):** DQL is available as GET or JSON POST at
`https://kg.diffbot.com/kg/v3/dql`; authentication is a `token` query parameter
even for POST. The request requires `query`. GET exposes modes `query`, `text`,
`queryTextFallback`, and `crawl`; only the global KG `query`/`text` behavior is in
scope here [S8, S14].

**FACT (high):** structured type queries begin with a type and add field clauses;
ID queries use `id:<id>`. DQL supports nested dot paths and nested-object clauses,
comparison, min/max, range, not, OR, existence, contains, `get`, geographic near,
regex, experimental Organization-only `similarTo`, strict equality, facets,
boosting, and sorting [S13, S15].

**FACT (high):** response metadata includes API `version`, total `hits`, returned
`results`, `kgversion`, `diffbot_type`, facet flag, `textFallback`, `data`, and
possible `rewrites`. Each normal result can include numeric `score`, `entity`, and
`entity_ctx`; nested matches appear as zero-based `inner_hits`, and named boost
clauses appear under `matched_clauses` [S8, S16].

### 6.2 Pagination, projection, formats, and bounds

**FACT (high):** OpenAPI states `size` defaults to 50 and `-1` requests all
results. `from` defaults to zero. Facet pagination requires `from+size <= 10,000`;
the dedicated facet guide says one facet query may return at most 1,000 values.
`from` is deprecated and no longer applicable to Article queries [S8, S17].

**FACT (high):** outputs include JSON, JSONL, CSV, XLS, and XLSX. `filter` and
`filterExclude` project returned JSON through simple fields or Diffbot's JSONPath
variant; `exportspec` controls columnar output. The projection language supports
multiple semicolon-separated paths, wildcard/deep scan, indexes/slices,
predicates, and `mostRelevant()` selection against the current DQL/Enhance query
[S8, S18].

**RECOMMENDATION (high):** do not expose `size=-1`, arbitrary DQL, regex, deep
JSONPath, or spreadsheet export to an agent. Curiosity should compile a small
typed query AST into an adapter request, enforce result/byte/time/cost/nesting
bounds, and sanitize provider errors and spreadsheet cells.

### 6.3 Fact provenance and noncanonical output modes

**FACT (high):** `jsonmode=extended` returns origin information for facts;
`jsonmode=id` returns IDs and origins; `nonCanonicalFacts=true` opts into fields
outside the ontology [S8]. Exactly how every extended fact is wrapped is not
fully specified in the OpenAPI schema, and no paid response was inspected.

### 6.4 Facets, deduplication, and coverage reports

**FACT (high):** facets summarize values/ranges across the primary result set and
return count, value/range, and a callback query. String values are ordered by
matching entity count; numeric and date ranges may be automatic or caller-defined
[S17].

**FACT (high):** Article-specific controls include disabling default
deduplication and `cluster=all|best|dedupe`. `all` assigns thematic cluster IDs;
`best` keeps one representative per thematic cluster; `dedupe` removes exact and
near duplicates [S8]. The representative-selection algorithm is undocumented.

**FACT (high):** `report=1` creates a field-coverage CSV: top-level JSON field
coverage or exported-column coverage. A `reportId` can be returned in JSON/header;
reports are short-lived and deleted 24 hours after results are downloaded [S19].

**RECOMMENDATION (high):** adapt facets and coverage metrics, but persist the
query/snapshot/schema/denominator with the report. A non-null coverage percentage
does not establish correctness, recency, representativeness, or source diversity.

## 7. Ranking, filtering, and ordering

### 7.1 Default score and custom relevance

**FACT (high):** DQL returns a numeric result `score`, but reviewed public sources
do not define its default formula, range, calibration, comparability across
queries, or feature contributions [S8].

**FACT (high):** `should` adds optional boosts; multiple clauses accept weights
from 1 to 100 and optional names. `must` weights required clauses. Named matches
are disclosed in `entity_ctx.matched_clauses`. For nested arrays, `inner_hits`
identifies matched records and generally orders them with more matching clauses
first [S16].

**FACT (high):** `sortBy:<field>` is normally ascending and `revSortBy` descending.
Article date is a legacy exception: `sortBy:date` returns latest first and
`revSortBy:date` oldest first. DQL also offers random and seeded-random ordering;
seeded order is reproducible only while the result set is unchanged [S20].

**FACT (high):** `importance` is a 0–100 popularity measure related to graph
linkage. Diffbot explicitly says it is not query relevance and advises against
filtering by it. `nbIncomingEdges` counts entities and facts pointing to the
entity [S21, S22].

**FACT (high):** `similarTo` is experimental, currently Organization-only, can
take one or multiple seed IDs/names, supports ordinary filters, and exposes a
`similarity_score` predicate. Diffbot warns results may be incorrect [S15]. The
similarity features and calibration are not published.

**INFERENCE (high):** DQL combines structured constraint evaluation with an
opaque base relevance score and caller-specified boosts. Popularity, graph degree,
similarity, match score, and fact confidence are distinct concepts and must not
be conflated.

### 7.2 Article fast/archive routing and rewrites

**FACT (high):** Article queries use a low-latency backend covering the last six
months **by crawled date** and a full historical archive. DQL selects a backend
from date constraints and small date sorts; `searchArchive=1` forces archive.
Archive queries are slower, may yield slightly varying hit counts, and may
transiently time out [S12].

**FACT (high):** when a date sort is routed to the fast backend without a lower
date bound, DQL can add one and return the rewritten query and reason. Articles
without a `date` field are omitted by date sorting [S12].

**CONTRADICTION / check (high):** DQL OpenAPI says default `size=50`, while the
Article backend guide calls 25 the default in its routing rule. Treat 25 as a
special Article-routing threshold, not proof that the API-wide default changed;
verify before integration [S8, S12].

**RECOMMENDATION (high):** Curiosity should disclose selected corpus lane,
effective query, time basis, omitted-undated behavior, coverage boundary, stale
fallback, retries, and partial status. Query rewriting must never be silent.

## 8. Provenance, updates, confidence, and freshness

### 8.1 Origins and derivation

**FACT (high):** an origin is a publicly accessible web location where data was
discovered/extracted **or** a source used to infer a fact. An entity and its facts
may be compiled from one or more origins [S23]. Thus an origin is not necessarily
a direct quotation supporting the returned surface form.

**FACT (high):** in extended JSON, `origins` lists source addresses,
`originDetails` pairs an origin with its latest crawl time, and `nbOrigins` counts
origins. The public product page illustrates a fused Apple record with 560
origins [S1, S4]. That example does not establish typical source count or quality.

**FACT (high):** the entity-level `crawlTimestamp` is the maximum/latest timestamp
across origins used to compute the entity. Origin-level crawl time records when a
specific origin was visited and extracted [S4, S24]. It is not the publication
time, validity time, first observation, age of every field, or graph publication
time.

### 8.2 Confidence and canonical selection

**FACT (high):** Diffbot says every fact has an internal confidence from zero to
one, discards facts below 0.5, and exposes confidence for only some facts such as
Article categories [S25]. It does not publish universal field-level confidence,
calibration, source-weighting, contradiction policy, or a guarantee that 0.5 has
the same empirical meaning across fields/types.

**INFERENCE (high):** a canonical entity record is selected output from a larger
set of observations. `allNames`/`allDescriptions`, noncanonical facts, origin
fusion, and a hidden confidence threshold are visible traces of that process.
The public contract does not expose rejected values or why one value won.

### 8.3 Refresh and graph updates

**FACT (high):** Enhance `refresh=true` revisits matched origins not crawled in
the last 30 days and merges refreshed data into the entity. `refreshOrigins` can
narrow the origins. Diffbot warns refresh is slow and should not be the default.
`search=true` searches for additional origins, scores matches, and merges them;
Diffbot warns this can be very slow and variable in quality [S10].

**FACT (high):** DQL and Enhance return `kgversion`; the public ontology endpoint
also exposes KG metadata. The product calls the graph “self-updating” [S1, S3,
S8, S10].

**UNKNOWN / negative result:** no reviewed page states a global recrawl or graph
build cadence, freshness percentile/SLA, per-type revisit policy, source-change
latency, old-fact retirement rule, bitemporal validity history, deletion
propagation SLA, or public ability to query an old `kgversion`. A snapshot label
without historical access is not replayability.

**RECOMMENDATION (high):** make lookup, source refresh, and new-source discovery
three separate operations and authorities. A read must not silently trigger
network work or spend. Every Curiosity claim should retain source capture ID,
fetched/observed/published/valid times, passage offsets/hash, extraction and
resolution versions, derivation kind, stance, and confidence provenance.

## 9. Scale and coverage claims

| Claim | Status | Qualification |
| --- | --- | --- |
| More than 10 billion entities | **FACT that Diffbot claims it** (high); actual scale **unverified** | No independent inventory, uniqueness audit, or type distribution was reviewed [S1]. |
| Billions of pages and trillions of facts | **Vendor claim** (high that stated) | “Fact” cardinality and retained/current/duplicate semantics are not defined [S1]. |
| Public web coverage | **Vendor scope statement** | “Everywhere on the public web” is marketing-level, not a corpus completeness contract [S27]. |
| Self-updating / “never goes out of date” | **Vendor product language** | Contradicted as a literal guarantee by optional refresh and stale-origin warnings; interpret as aspiration, not SLA [S1, S10]. |
| Ontology breadth | **Observable** | Public JSON exposed 61 definitions on the date, but includes base/subtypes and can change [S3]. |
| Query coverage reports | **Contracted measurement** | Measures populated exported fields, not recall against the real world [S19]. |

**UNKNOWN:** entity counts by type/language/country/date/source class; unique
canonical entities versus articles; precision/recall of identity and facts;
coverage bias; source concentration; suppression/deletion counts; stale-record
distribution; and independently reproducible scale methodology.

## 10. Errors, limits, and pricing

### 10.1 Errors and operational behavior

**FACT (high):** DQL documents:

- `400` query parse error with line, column, plain message, and HTML-marked
  offending token;
- `401` unauthorized with code/message/request ID;
- `422` invalid or missing parameters;
- `500` internal error [S8].

**FACT (high):** Enhance documents `400`, `401`, `429` insufficient credits, and
`500`, with heterogeneous envelopes and possible request context. The global
rate page gives 5 calls/minute Free, 5/second Startup, and 25/second Plus; Free
lists 400 DQL entities/month and 400 Enhance entities/month [S10, S28].

**RECOMMENDATION (high):** normalize HTTP status separately from provider error
shape and retain request IDs. Sanitize `htmlMessage`; do not render provider HTML
unsafely. Retry only explicit transient classes under deadline/backoff and never
retry a paid/non-idempotent refresh blindly.

### 10.2 Point-in-time economics

**FACT (high, 2026-08-17 list price):** Free included 10,000 monthly credits;
Startup cost $299/month for 250,000 credits with $0.001 overage; Plus cost
$899/month for 1,000,000 credits with $0.0009 overage; Enterprise was custom.
Exporting one KG record costs 25 credits, one facet record 100, one normal
Enhance record 25, and Enhance with refresh 100 [S29].

**INFERENCE (high):** cost scales with returned/exported records, not merely
queries. `size=-1`, broad facets, multiple Enhance candidates, and refresh can
turn a small logical request into large spend. Archive retries add uncertainty.

**RECOMMENDATION (high):** snapshot prices operationally; preflight worst-case
records/credits; set a lower Curiosity budget; count retries and partial results;
and require explicit authorization for refresh/search. Never hard-code current
prices into provider-neutral contracts.

## 11. Privacy, security, and legal boundary

### 11.1 Privacy

**FACT (high):** Diffbot distinguishes Subscribers from “Search Subjects” whose
public personal data is indexed. Search Subject fields can include names,
biography, education/employment, work address/phone/email, URLs/handles, and
expertise; sensitive data may be collected when the subject made it public.
Subscriber query history and API calls are logged and tied to the API key [S26].

**FACT (high):** the policy describes automated profiling/categorization and
customer search/list building. It provides a `privacy@diffbot.com` rights/removal
channel, US processing/transfers, service providers, deletion/suppression, and a
statement that personal data is not retained longer than 30 days after verified
awareness of a wish to stop communications/sharing. This is not a complete KG
field-level retention or deletion propagation SLA [S26, S30].

**FACT / security concern (high):** the privacy page says SSL is used wherever
personal data is handled “except API calls that rely on http without encryption.”
Current documented KG endpoints are HTTPS, but this wording requires contractual
clarification before sensitive use [S26].

**RECOMMENDATION (high):** “public” is not unrestricted. Do not send private
identifiers, sensitive hypotheses, or unnecessary personal data. Establish
purpose/lawful basis, minimization, access controls, regional processing,
retention, deletion/suppression propagation, and audit before any Person use.

### 11.2 Terms and clean-room constraints

**FACT (high):** public terms permit displaying/using facts generated by the
service in a commercial application, but prohibit reselling or making the
service available to third parties, unlawful/right-infringing use, reverse
engineering, unauthorized access, bypassing access/robot exclusions, and
scraping/crawling the Diffbot Site or Service. Accuracy, completeness,
usefulness, uninterrupted operation, security, and non-infringement warranties
are disclaimed [S31].

**FACT (high):** Diffbot/licensors retain service IP, excluding user content,
third-party content, and public-domain content from that ownership statement.
The terms grant Diffbot a broad, perpetual license to process user-submitted
queries and Enhance data [S31].

**RECOMMENDATION (high):** treat four rights separately: API/service rights,
ontology/documentation copyright, source-page/content rights, and personal-data
duties. An API fact is not blanket permission to retain source content,
redistribute the graph, train models, or republish personal data. This document
does not copy the ontology and is not legal advice.

## 12. Bounded architecture inference

The least-assumptive architecture consistent with public contracts is:

```text
SOURCE LAYER
  public pages + attributed structured datasets
  -> observations with URL/source and visit time

SEMANTIC LAYER
  -> typed extraction and relation candidates
  -> inferred facts (e.g., location containment)
  -> confidence gating (documented hidden score; <0.5 discarded)

IDENTITY/FUSION LAYER
  -> candidate entities
  -> merge/split/redirect handling
  -> canonical and retained alternate values
  -> linked relationships and incoming-edge counts

PUBLICATION LAYER
  -> ontology-compatible KG build / kgversion
  -> general typed query index
  -> Article recent and archive indexes
  -> candidate index for Person/Organization Enhance

SERVING LAYER
  DQL parse -> constrain -> score/boost/sort/facet -> project/export
  Enhance retrieve -> compare -> threshold -> return candidate(s)
  privileged refresh/search -> acquire -> resolve/fuse -> return
```

**Confidence:** high for functional boundaries; medium that publication uses
separate materialized stores; low for any specific database, ML model, index
technology, scheduler, topology, or consistency mechanism.

**UNKNOWN:** lexical/vector retrieval details, ranking formula, feature store,
canonical-fact algorithm, confidence calibration, authority/source weights,
graph partitioning, transaction/consistency model, event versus batch updates,
cache behavior, disaster recovery, tenancy, and model/build deployment process.

## 13. Clean-room lessons and Curiosity implications

### Adopted

1. **ADOPT — identity redirects (high).** Resolve historical IDs to a current
   representative while retaining requested ID and an auditable alias chain.
2. **ADOPT — graph/schema versioning (high).** Every query result should carry
   graph snapshot, schema version, and adapter version.
3. **ADOPT — typed nested relations with temporal precision (high).** Preserve
   current status, partial dates, and relation-specific evidence.
4. **ADOPT — effective-query disclosure (high).** Return rewrites, selected
   corpus/index lane, omitted-data rules, and coverage warnings.
5. **ADOPT — nested match context (high).** Return which employment/location/etc.
   satisfied a predicate, not only the parent entity.

### Adapted

1. **ADAPT — provenance (high).** URL and crawl time become immutable capture,
   passage, transformation, derivation, and validity lineage per claim.
2. **ADAPT — entity resolution (high).** Enhance-like candidate matching becomes
   reversible candidate evidence with ambiguity and human-review states.
3. **ADAPT — confidence (high).** Separate extraction, identity, source,
   inference, retrieval, and evidence-sufficiency confidence; calibrate each on
   judged data and never suppress contradictions without trace.
4. **ADAPT — scoring (high).** Structured boosts become versioned, named ranking
   stages; popularity, relevance, recency, authority, and diversity remain
   separate features.
5. **ADAPT — facets/coverage (high).** Use bounded aggregate queries and durable
   coverage telemetry tied to snapshot and denominator, with privacy thresholds.

### Rejected

1. **REJECT — hosted KG as owned foundation (high).** Diffbot controls corpus,
   extraction, fusion, identity, ranking, updates, retention, and terms.
2. **REJECT — DQL as public Curiosity ABI (high).** It is proprietary, expressive,
   vendor-shaped, and contains unbounded/high-cost modes.
3. **REJECT — mutable URL provenance as sufficient (high).** It cannot replay
   the observed source or prove a field.
4. **REJECT — popularity/rank/match/confidence as truth (high).** These scores
   answer different opaque questions.
5. **REJECT — implicit refresh or source search (high).** A read cannot expand
   network authority, personal-data processing, latency, or spend.

### Deferred

1. **DEFER — adapter evaluation (medium).** Requires contract tests, data/use-case
   review, and quality/freshness benchmarking against owned evidence.
2. **DEFER — Person enrichment (high).** Requires privacy/legal purpose,
   minimization, deletion, access, regional, and vendor-contract review.
3. **DEFER — experimental similarity (high).** No published features,
   calibration, stability, or error analysis.
4. **DEFER — enterprise controls (medium).** DPA, SOC/security evidence,
   residency, retention, SLA, support, and custom economics were not reviewed.

### Provider-neutral result envelope

**RECOMMENDATION (high):** Curiosity's graph query should return at minimum:

```text
query_id, requested_ast, effective_ast, rewrite_reason
graph_snapshot_id, ontology_version, adapter_version
budgets: candidates, results, bytes, wall_time, cost
coverage_lane, time_basis, partial/errors
entity_id, requested_alias, current_id, identity_state
claim_id, predicate, value, value_precision, observed_or_inferred
valid_time, observed_time, fetched_time, published_time
capture_id, origin_uri, passage_locator/hash, derivation_version
identity_confidence, claim_confidence, evidence_sufficiency
rank stage trace, matched nested records, policy/privacy flags
```

All provider text, HTML-bearing errors, graph fields, source pages, and inferred
facts remain `untrusted_external_data`; none may grant authority, trigger refresh,
request secrets, or approve a curiosity follow-up.

## 14. Unknowns and checks before any evaluation

### Material unknowns / retained negative results

- No independent KG entity/fact count, type distribution, coverage, precision,
  identity-resolution, freshness, or latency benchmark was found or generated.
- No complete merge/split event ledger, reason/timestamp contract, tombstone
  model, or stable-ID guarantee exists in reviewed public docs.
- No per-fact universal confidence, source weighting, conflict set, rejected fact,
  canonical-selection rationale, or calibrated error rate is exposed.
- No immutable capture, content hash, quoted passage, extraction/model version,
  or complete field-to-origin derivation contract was found.
- No global refresh cadence/SLA, stale-fact retirement rule, deletion propagation
  SLA, or historical `kgversion` replay contract was found.
- No default DQL scoring formula, feature contribution, score comparability,
  candidate depth, tie-break, or thematic-cluster representative rule was found.
- No general stable cursor for Article queries or safe bounded replacement for
  `size=-1` was documented.
- No reviewed public source established ordinary query/response retention by
  exact duration, KG tenant isolation, residency, or enterprise security controls.
- No license was found making Diffbot's proprietary KG, DQL, ontology text,
  documentation, models, or service project-owned or freely cloneable.

### Separately authorized checks (not executed)

1. Freeze a synthetic/non-personal fixture set and validate GET/POST equivalence,
   size/from bounds, projection, facets, errors, and result-byte behavior.
2. Query known historical IDs and record redirect, alias, merge/split, and
   snapshot behavior without ingesting vendor data beyond test evidence.
3. Inspect extended JSON for exact claim-to-origin shape, inferred-fact markings,
   stale origins, and confidence exposure.
4. Compare repeated queries across `kgversion`, seeded random order, date sort,
   Article fast/archive routing, and transient failures.
5. Evaluate candidate resolution with labeled ambiguous names and measure
   precision/recall/calibration at multiple thresholds.
6. Validate removal/suppression, query retention, residency, DPA, security,
   contractual response rights, and deletion propagation with owners/counsel.

## 15. Bounded curiosity pass and stop rule

Scores are 1 (low) to 5 (high); cost is investigation cost/risk. Priority was
`relevance + value + novelty - cost`. Only in-frame, public, clean-room threads
capable of changing the decision were eligible.

| Thread | R | V | N | C | Decision/result |
| --- | ---: | ---: | ---: | ---: | --- |
| Identity stability and redirects | 5 | 5 | 5 | 1 | **Pursued.** Primary docs confirm undermerge/overmerge, split/merge, current-ID redirects, and secondary IDs [S9]. |
| Default rank versus popularity versus match/confidence | 5 | 5 | 4 | 1 | **Pursued.** Sources separate DQL score, `importance`, incoming edges, Enhance score, similarity score, and fact confidence; formulas remain hidden [S8, S10, S15, S21, S22, S25]. |
| Provenance granularity and freshness | 5 | 5 | 4 | 1 | **Pursued.** Origins can support observed or inferred facts; entity crawl time is max-origin time; no passage/history contract exists [S23–S25]. |
| Ontology breadth/version | 4 | 4 | 4 | 1 | **Pursued.** Public JSON established point-in-time type/composite/enum/taxonomy metadata without copying it [S3]. |
| Exact fusion, authority, and canonical-selection algorithms | 3 | 4 | 5 | 5 | **CURIOSITY_NO_GO.** Proprietary, undocumented, unnecessary for contract lessons, and terms prohibit reverse engineering the service. |
| Authenticated or paid contract/quality calls | 5 | 5 | 4 | 5 | **CURIOSITY_NO_GO.** Caller prohibited credentials and paid calls; fixtures, budget, and data review are absent. |
| Crawl/Extract implementation details | 1 | 1 | 2 | 4 | **CURIOSITY_NO_GO.** Explicitly out of scope; only vendor-stated upstream role was retained. |
| Scrape dashboard or service endpoints | 1 | 1 | 2 | 5 | **CURIOSITY_NO_GO.** Access/license boundary; public docs were sufficient. |
| Jurisdiction-specific legality of people enrichment | 5 | 5 | 4 | 5 | **CURIOSITY_NO_GO.** Requires a declared use/corpus/jurisdiction and counsel, not autonomous research. |
| Enterprise DPA/SOC/residency/SLA | 3 | 4 | 2 | 4 | **CURIOSITY_NO_GO.** Procurement/security-review authority absent; deferred. |

**Stop condition:** requested coverage is complete and primary-source results are
saturated. Remaining high-value gaps require vendor disclosure, legal/procurement
authority, credentials, paid calls, or an approved empirical fixture plan. No live
autonomous follow-up was initiated.

## 16. Primary source ledger

All sources are official/primary and were accessed 2026-08-17.

- **[S1]** Diffbot, [Knowledge Graph product overview](https://www.diffbot.com/products/knowledge-graph/) — product boundary, fusion, origins example, 10B-entity/billions-of-pages/trillions-of-facts claims, DQL and Enhance.
- **[S2]** Diffbot, [Ontology overview](https://www.diffbot.com/docs/ontology/) — ontology purpose, relationships, canonical type documentation.
- **[S3]** Diffbot, [machine-readable ontology](https://kg.diffbot.com/kg/ontology) — point-in-time metadata, type hierarchy, field/composite/enum/taxonomy descriptors.
- **[S4]** Diffbot, [All Entities ontology](https://www.diffbot.com/docs/ontology/all-entities) — common IDs, aliases, origins, crawl time, importance, incoming edges, and noncanonical fields.
- **[S5]** Diffbot, [Person ontology](https://www.diffbot.com/docs/ontology/person) — Person schema, nested employment/education, public contacts, linked entities, partial dates.
- **[S6]** Diffbot, [Organization ontology](https://www.diffbot.com/docs/ontology/organization) — Organization schema, identifiers, financials, classifications, relationships, and subtypes.
- **[S7]** Diffbot, [Article ontology](https://www.diffbot.com/docs/ontology/article) — Article schema, source-derived ID statement, date/crawl fields, tags, text and URLs.
- **[S8]** Diffbot, [DQL GET API](https://www.diffbot.com/docs/dql/get) — transport, modes, request/response schema, output controls, errors, scores, graph version, clustering.
- **[S9]** Diffbot, [Entity ID and diffbotUri](https://www.diffbot.com/docs/dql/concepts/entity-id-and-diffboturi) — merges, splits, redirects, current IDs, and secondary IDs.
- **[S10]** Diffbot, [Enhance GET API](https://www.diffbot.com/docs/enhance/get) — inputs, matching, F2 threshold, scores, errors, refresh/search, response context.
- **[S11]** Diffbot, [Knowledge Graph sources](https://www.diffbot.com/docs/dql/concepts/sources) — Wikidata and licensed geographic source attribution.
- **[S12]** Diffbot, [Best Practices for Querying Articles](https://www.diffbot.com/docs/dql/article-backends) — recent/archive backends, crawled-date window, routing, rewrites, timeouts, undated omission.
- **[S13]** Diffbot, [DQL query types](https://www.diffbot.com/docs/dql/reference/query-types) — type and ID query shapes and nested paths.
- **[S14]** Diffbot, [DQL POST API](https://www.diffbot.com/docs/dql/post) — JSON POST contract and same response/error model.
- **[S15]** Diffbot, [SimilarTo operator](https://www.diffbot.com/docs/dql/reference/similarto-operator) — experimental Organization similarity, multi-seed and threshold/filter behavior.
- **[S16]** Diffbot, [Custom Scoring & Relevance](https://www.diffbot.com/docs/dql/reference/custom-scoring) — weighted/named `should` and `must`, nested `inner_hits`.
- **[S17]** Diffbot, [Facet Queries](https://www.diffbot.com/docs/dql/reference/facet-queries) — facet semantics, ranges, ordering, response and 1,000-value limit.
- **[S18]** Diffbot, [Filtering Fields](https://www.diffbot.com/docs/dql/filtering-fields) — projection versus query filtering, JSONPath variant, predicates and `mostRelevant()`.
- **[S19]** Diffbot, [Coverage Reports](https://www.diffbot.com/docs/dql/coverage-reports) — field/column coverage, report IDs, CSV and 24-hour deletion.
- **[S20]** Diffbot, [Sorting Results](https://www.diffbot.com/docs/dql/reference/sorting-results) — field/nested/reverse/random/seeded sorts and Article date exception.
- **[S21]** Diffbot, [Importance](https://www.diffbot.com/docs/dql/concepts/importance) — popularity meaning and warning that it is not query relevance.
- **[S22]** Diffbot, [nbIncomingEdges](https://www.diffbot.com/docs/dql/concepts/nb-incoming-edges) — graph in-degree semantics.
- **[S23]** Diffbot, [Origin](https://www.diffbot.com/docs/dql/concepts/origin) — direct and inferential source semantics.
- **[S24]** Diffbot, [crawlTimestamp](https://www.diffbot.com/docs/dql/concepts/crawl-timestamp) — origin visit time and entity max-origin timestamp.
- **[S25]** Diffbot, [Confidence Score](https://www.diffbot.com/docs/dql/concepts/confidence-score) — internal fact confidence, partial exposure, and 0.5 discard threshold.
- **[S26]** Diffbot, [Privacy Policy](https://www.diffbot.com/company/privacy), updated 2025-08-29 — Subscriber/Search Subject data, query logs, profiling, sharing, transfers, security, rights, and retention language.
- **[S27]** Diffbot, [KG data sourcing FAQ](https://www.diffbot.com/docs/dql/faq/data-sourcing) — “Everywhere on the public web” scope statement.
- **[S28]** Diffbot, [Rate Limits](https://www.diffbot.com/docs/rate-limits) — plan QPS and Free DQL/Enhance entity ceilings.
- **[S29]** Diffbot, [Plans & Pricing](https://www.diffbot.com/pricing) — point-in-time plans and KG/Enhance/facet credit costs.
- **[S30]** Diffbot, [GDPR/EU Data Laws](https://www.diffbot.com/docs/account-billing/gdpr) — DPA availability, deletion, suppression, access, portability, and rectification statements.
- **[S31]** Diffbot, [Terms of Use](https://www.diffbot.com/company/terms) — service/use rights, prohibitions, IP, query/Enhance-data license, disclaimers, and liability terms.

## 17. Confidence summary

- **High:** public schema structure, DQL/Enhance request and response fields,
  identity redirects, projection/sort/facet controls, provenance timestamp
  semantics, public limits, list pricing, privacy-policy text, and terms.
- **Medium:** inferred separation of observation, fusion, graph publication,
  general/Article indexes, and Enhance candidate retrieval; Article ID lifecycle.
- **Low/unknown:** actual scale/coverage, identity/fact accuracy, score
  calibration, hidden ranking/fusion algorithms, global freshness, deletion
  latency, historical replay, physical architecture, and comparative value.

**Final verdict:** Diffbot KG is a strong clean-room reference for typed graph
contracts, mutable identity with redirects, structured query, effective-query
disclosure, and source-aware records. Curiosity should extend those concepts into
immutable claim-level evidence and reversible identity history, while rejecting
the proprietary service, ontology, DQL, hidden scores, and refresh behavior as
its owned internal foundation.
