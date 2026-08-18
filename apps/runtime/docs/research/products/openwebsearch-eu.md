# OpenWebSearch.EU and the Open Web Index: federated search-data pilot and rights boundary

**Research date:** 2026-08-17  
**Decision:** whether OpenWebSearch.EU, the Open Web Index, or their published
software can safely inform, test, or supply Curiosity's owned public-web search
architecture.  
**Status:** clean-room research recommendation; not legal advice, an
implementation record, or authority to access or ingest OWI data.  
**Primary-source access date:** 2026-08-17 for every source unless stated
otherwise.

## Executive verdict

**ADAPTED as architecture research (high confidence):** OpenWebSearch.EU is a
valuable public case study in separating distributed crawl, central frontier,
WARC capture, Spark/Parquet enrichment, CIFF index construction, federated data
custody, downloadable index shards, and downstream search applications. Adopt
the *lessons*: portable index interchange, versioned partitions, machine-readable
usage signals, authenticated data access, takedown propagation, and a governance
layer that spans every downstream copy.

**REJECTED as Curiosity's production foundation (high confidence):** the funded
project is closed; the OWI is still described as a beta/prototype for research
and development; its current OWIL is non-commercial, revocable, requires
third-party-rights compliance and destruction after termination; exact current
coverage, refresh, ranking quality, service levels, legal operator, and durable
funding are not established. Its software and operational stack also depend on
multiple third-party projects rather than forming a wholly owned core [S1][S2]
[S3][S4].

**DEFERRED (high confidence):** do not download an index partition, WARC dataset,
or derivative corpus; call an OWI service from production; train on OWI data; or
redistribute OWI-derived text without separate approval of the exact dataset,
OWIL version, source-content rights, jurisdiction, deletion mechanics, and
commercial posture. A software license on OWLer, Resilipipe, the Spark indexer,
owilix, or MOSAIC does **not** license indexed web content.

## 1. Frame, bounded questions, and method

### 1.1 Questions

1. What are the funded OpenWebSearch.EU project, operational OWI, OWSE-HUB,
   OWLer, owilix, and MOSAIC, and which should not be conflated?
2. How did the documented crawl-to-index pipeline handle frontier scheduling,
   capture, enrichment, sharding, distribution, and downstream search?
3. What do current public statistics establish about size, coverage, and
   freshness—and what remains unknown?
4. What access, software-license, data-license, content-rights, takedown,
   governance, and post-project-operability boundaries apply?
5. Which patterns can Curiosity learn clean-room without importing code, data,
   authority, or unverified operational assumptions?

### 1.2 Evidence and clean-room boundary

- **FACT** is directly supported by the cited source. **INFERENCE** is a
  reasoned reading, not a measurement. **RECOMMENDATION** is a Curiosity choice.
  Confidence is high, medium, or low.
- EU CORDIS, official project pages/deliverables, the live OWI licence asset,
  official OpenCode repositories, and project Zenodo records were preferred.
  Project claims establish what its authors report, not independent quality,
  legal validity, or current service performance. Zenodo explicitly notes that
  the reviewed D1.2 and D3.4 deliverables express their authors' opinions and
  had not yet been approved by the European Commission [S6][S7].
- No account was created, API was probed, dataset or software archive was
  downloaded, crawler was run, or code was copied. Public documentation and
  repository licence/README files were read only.
- The review stops at decision sufficiency. It is not a legal opinion, security
  audit, load test, relevance benchmark, or verification of every transitive
  dependency.

## 2. Identity and lifecycle: six related but different things

| Name | Supported identity | Decision-relevant boundary |
| --- | --- | --- |
| **OpenWebSearch.EU** | Horizon Europe research project, grant `101070014`, DOI `10.3030/101070014`, coordinated by the University of Passau. It ran 2022-09-01 through 2026-02-28; CORDIS now says **Project closed** [S1]. | A completed grant is not itself a continuing service operator, production SLO, or content licence. |
| **OWSAI / Open Web Search and Analysis Infrastructure** | The broader proposed European infrastructure: cooperative compute/data centres and services for creating and using an open index [S1]. | Vision and architecture, not one verified production product. |
| **Open Web Index (OWI)** | The project defines it as Index Data plus an Index Service; data includes an inverted search index, metadata, plain text, and processed information, distributed in partitions across data centres [S3]. The public page calls it a European open-source web-index pilot in beta [S2]. | It is licensed data and access machinery, not automatically “open” in the unrestricted open-data sense. |
| **OWLer** | Distributed crawler family. The documented stable implementation derives from StormCrawler/Apache Storm and uses a shared URL Frontier; experimental variants test other approaches [S5][S6]. | Crawler software and crawl payloads have separate rights. Historical behavior is not a 2026 service contract. |
| **OWSE-HUB** | Envisioned “hub” of declarative, pull/build/push search-engine stacks. In the Y2 deliverable, MOSAIC2go implemented only part of that vision for one backend [S7]. | Do not describe OWSE-HUB as a mature hosted search marketplace or API. |
| **owilix / MOSAIC** | owilix is an authenticated OWI dataset client with pull/push, local/remote management, Parquet/DuckDB queries, iRODS/py4lexis integration, and version control. MOSAIC is a modular self-hostable search application that imports OWI slices into Lucene and serves JSON or OpenSearch XML [S8][S9]. | These are client/application software, not evidence that OWI offers a supported general-purpose production search API. |

**FACT (high):** a 2024 project status page explicitly said the project's main
aim was to share index files and associated metadata, **not** to provide a
corresponding search API. The page described CIFF import into downstream search
engines [S10].

**INFERENCE (high):** the clean conceptual boundary is: OWI supplies versioned
search data; MOSAIC makes selected slices searchable; OWSE-HUB describes a
future composition/distribution layer. Treating all three as “the
OpenWebSearch API” would overstate both interface maturity and operating scope.

## 3. Documented crawl-to-search architecture

### 3.1 End-to-end flow

The strongest public synthesis is:

```text
seeds + discovered links + sitemaps + permitted external WARC/fill-in sources
  -> singleton URL Frontier / OpenSearch persistence
       next-fetch schedule + URL state/tags + host politeness + gRPC stream/batch APIs
  -> OWLer instances at participating data centres
       robots/policy checks + HTTP fetch + parsing/outlinks
  -> local S3-compatible WARC capture
  -> Resilipipe / Spark preprocessing and enrichment
       cleaned main content + URL/HTTP/crawl metadata + language/topics + use flags
  -> partitioned Parquet records
  -> Spark indexer
       inverted index + metadata-selected shards -> CIFF (+ matching Parquet)
  -> local MinIO/S3 + federated iRODS/LEXIS datasets and changelog
  -> authenticated portal or owilix pull/query/push/version management
  -> downstream importer/search application, e.g. MOSAIC -> Lucene -> JSON/OpenSearch XML
```

**FACT (high; 2024 design/operation):** the project described four cluster
tiers: Crawling Cluster Tier (CCT), singleton Crawler Frontier Tier (CFT),
Preprocessing and Enrichment Tier (PET), and Indexing and Storage Tier (IST).
OWLer produced WARC; Spark/Resiliparse produced Parquet; another Spark job
partitioned inverted files into CIFF shards and distributed corresponding
Parquet metadata. iRODS federated storage across data centres, with local
S3-compatible access and daily LEXIS datasets [S7].

**FACT (high):** the current Spark-indexer README accepts WARC, Parquet, JSON,
TREC, or TRECWeb inputs; can filter, deduplicate, strip HTML, assign identifiers,
and partition by arbitrary metadata columns; and emits CIFF or a CIFF-shaped
Parquet representation. It can also create a Parquet web graph [S11].

**FACT (high):** Resilipipe's documented schema preserves capture and lineage
fields such as WARC record ID/date/file/offset, URL components, MIME/charset,
main content and metadata, language, validity/error state, canonical candidate,
outlinks, crawl-source type, and `ows_index` / `ows_genai` use signals. The
repository marks old schema versions deprecated, demonstrating schema evolution
rather than a timeless contract [S12].

### 3.2 Frontier and recrawl clues

**FACT (medium; 2024 implementation):** crawler/frontier communication used a
Protocol Buffers gRPC API with streaming and batch forms. The frontier ordered
URLs continuously by `nextFetchDate`; a completed fetch could reschedule a URL
using content quality and change frequency, while adding newly discovered URLs.
Change detection used `If-Modified-Since` and MD5 comparisons. The documented
quality heuristic used curated host/domain lists from ClueWeb22, Curlie, and
Wikipedia outlinks, explicitly accepting high precision and low recall for the
proof of concept [S6].

**FACT (medium; historical configuration):** the standard crawler initially
used ten requests per 30 seconds per domain, then moved to a heuristic policy.
Maximum crawl depth was 20. Authors acknowledged blacklisting and incidents,
including ambiguous robots handling and access to institutionally licensed
content; they established incident channels, a kill-switch group, dedicated
crawl subnets, robots opt-out, and takedown intake [S6].

**INFERENCE (high):** OWLer provides useful evidence for a durable shared
frontier and explicit incident response, but not parameters Curiosity should
copy. Central frontier state was an admitted bottleneck/single point of failure;
politeness acceptance varies by host; list-based quality selection is biased;
and old MD5/`If-Modified-Since` behavior is insufficient as a complete modern
freshness policy.

### 3.3 Index portability and serving

**FACT (high):** CIFF contains collection headers, per-term frequencies and
posting lists, and per-document identifiers/lengths. It was chosen as an
interchange format so independent engines could import a prebuilt inverted
index. Metadata-bearing Parquet travels alongside CIFF for filtering, snippets,
and enrichment [S7].

**FACT (high):** current MOSAIC documentation describes a REST service over one
or more imported slices. `/search` returns JSON; `/searchxml` returns Atom-style
OpenSearch XML; `/index-info` reports local indexes; `/full-text` retrieves
stored content; query controls include index, language, pagination/limit, and
optional full content. The framework is Apache-2.0 but imports CIFF into Apache
Lucene and uses Parquet metadata [S9][S13].

**INFERENCE (high):** CIFF is a good interchange/checkpoint boundary, not a
complete online retrieval model. Curiosity would still need owned document and
passage identities, canonical/version graphs, tombstones, current ranking,
diversification, citation anchoring, safety, evaluation, and serving SLOs.
MOSAIC's URL/title/snippet/language/crawl-time result precedent is useful, but
its wire shape must not become Curiosity's provider-neutral domain contract.

## 4. Access model and operational status

**FACT (high):** the public OWI page says the index is in beta, registration
requires B2Access or listed social identity providers, use is for R&D under a
research licence, and users should expect approximately one petabyte of open-web
data [S2]. The Y2 deliverable documented B2Access-controlled LEXIS access,
public-versus-project-private datasets, and raw crawl data kept project-private
for legal reasons [S7].

**FACT (high):** owilix 0.12.1 was published as a client for authenticated OWI
shard retrieval and community push, remote/local datasets, SQL over DuckDB and
Parquet, iRODS parallel transfer, py4lexis access, and dataset versioning [S8].
These are batch/data-plane functions, not a relevance-search SLO.

**FACT (high):** OWIL 1.0 itself defines an Index Service accessible through a
web interface or API and permits partition download, but simultaneously labels
the OWI a research-purpose prototype, “as is,” with incomplete features,
temporary limitations, downtime, and possible change or termination [S3].

**FACT (medium):** the official site reported in August 2026 that OWI datasets
had been ingested into the LUMI AI Factory Dataset-as-a-Service environment for
experimentation. A separate German-funded SOURCE project launched in April 2026
and plans to use OWI data for disinformation research [S14][S15].

**INFERENCE (high):** these post-grant uses show continuing assets and community
activity, not a verified successor operating entity or general production
commitment. A closed grant, beta licence, and project-specific collaborations do
not establish availability, support, incident ownership, retention, or a
commercial service path for Curiosity.

## 5. Scale, coverage, freshness, and quality

### 5.1 What current public numbers say

**FACT (medium; project-reported counters):** on 2026-08-17 the official home
page displayed 9.14 billion URLs crawled, 1,577.06 TiB total crawled, 1 TiB/day,
328 WARC datasets, a 35.09 TiB Open Web Index, 28.83 TiB of WARC datasets, and
1,963 public datasets. It displayed 185 languages and 28 million hosts, while
noting those two values were from March 2024 and the other values were daily
statistics [S4].

**FACT (medium; historical measurement):** the Y2 deliverables reported, for
August 2024, up to about 105 million visited URLs/day, 10.76 billion cumulative
fetches, about 1.17 billion unique visited URLs, 40.5 million unique visited
hosts, 184 detected languages, and 315 TB of WARC. They also reported about 2.2
billion preprocessed/indexed documents and 198 public daily index datasets.
Seed distribution was acknowledged as biased by prior Common Crawl dumps [S6]
[S7].

### 5.2 What the numbers do not prove

- **Freshness:** “1 TiB crawled per day” and daily counters do not prove that a
  given URL, host, shard, or downloadable index is updated daily. In September
  2024, preprocessing/indexing lag meant only data through March/April had been
  publicly released; robust automation and takedown updates were future work
  [S7]. No reviewed 2026 source closes that gap with a measured publication-lag
  distribution or freshness SLO.
- **Coverage:** cumulative fetches/URLs are not unique current searchable
  documents. No reviewed source provides a reproducible sampling frame,
  language/region/domain recall study, current duplicate rate, current core
  selection rule, or query-weighted coverage benchmark.
- **Comparable categories:** 2024 sources variously report 184 crawler
  languages, 600+ unique index-language values, and 40.5M hosts; the current
  homepage displays 185 languages and 28M hosts dated March 2024 [S4][S6][S7].
  Definitions, windows, filtering, and counter resets are not explained. These
  values must not be combined into a trend.
- **Quality:** no reviewed primary source demonstrates production relevance,
  spam precision, freshness, citation fidelity, or superiority against a
  commercial engine on a current representative judged set.
- **Storage scope:** “approximately one petabyte of open web data,” total TiB
  crawled, WARC dataset size, and index size refer to different scopes. They are
  not interchangeable corpus-size measurements [S2][S4].

**INFERENCE (high):** the project proved web-scale pipeline feasibility and
substantial corpus production. It did not establish a current, comprehensive,
fresh, quality-measured production search index suitable as Curiosity's default
evidence plane.

## 6. Rights, licences, and takedown boundary

### 6.1 Current OWI data licence

**FACT (high):** the live dashboard serves **Open Web Index Licence (OWIL) 1.0,
last updated 2024-05-08**, with Universität Passau identified as licensor acting
on behalf of the consortium. The licence:

- limits current use to lawful personal/non-commercial/research use;
- requires prominent OpenWebSearch.EU/EU-funding attribution for applications,
  presentations, and services built on an index partition;
- states content remains property of respective owners and requires users to
  obtain necessary permissions and follow owner terms, intellectual-property
  law, and technical restrictions such as `robots.txt`;
- disclaims accuracy, completeness, fitness, non-infringement, and availability;
- shifts third-party-rights and use risk to the user and includes
  indemnification;
- allows terms to change with at least 14 days' notice for an effective
  revision and permits access revocation/termination;
- requires use to stop and all full or partial OWI data copies to be destroyed,
  with written confirmation within seven days after termination; and
- specifies German law and competent courts in Munich [S3].

**INFERENCE (high):** OWI data is publicly discoverable and research-accessible,
but it is not CC0, CC BY, ODC, Apache-2.0, or an unconditional corpus grant. Its
revocation, destruction, downstream-rights, and non-commercial constraints are
incompatible with treating a downloaded partition as Curiosity-owned permanent
production data.

### 6.2 Code is not data, and metadata conflicts matter

| Asset | Public evidence | Curiosity verdict |
| --- | --- | --- |
| OWI index/Parquet/WARC data | OWIL plus rights and terms of each underlying owner [S3]. | **REJECTED as foundation; data use deferred.** |
| OWLer StormCrawler Y2 | Zenodo says Apache-2.0 and derived from StormCrawler [S5]. | **LEARN only** under strict wholly-owned-core policy. |
| OWLer URL Frontier | Zenodo says Apache-2.0 and identifies upstream URLFrontier/OpenSearch work [S16]. | **LEARN;** preserve upstream provenance. |
| Resilipipe | Repository and Zenodo record identify Apache-2.0; depends on Resiliparse, Spark, and Magpie [S12][S17]. | **LEARN schemas/pipeline concepts.** |
| Spark indexer | Zenodo release `0.1.0` labels Apache-2.0; current `main` repository `LICENSE` is MIT, copyright 2025 [S11][S18]. | **VERSION-SPECIFIC REVIEW REQUIRED;** do not flatten to one licence. |
| owilix | Zenodo record metadata labels the archive CC BY 4.0, while current repository `LICENSE` is Apache-2.0 [S8]. | **DISCREPANCY;** exact artifact/commit controls. |
| MOSAIC v2 / MosaicRAG | Zenodo records label both Apache-2.0; MOSAIC relies on Lucene/CIFF/Parquet and MosaicRAG may use Mosaic or Chroma [S9][S13]. | **LEARN interfaces; reject as owned core.** |
| Deliverables / LISA publication | Zenodo labels reviewed deliverables and LISA CC BY 4.0 [S6][S7][S19]. | **CITE/LEARN** with attribution; not authority to use data. |

**FACT (high):** the licence mismatch is not merely spelling. Zenodo describes
an archived software release; a repository `main` licence may describe a later
snapshot. For owilix, record-level CC BY metadata and repository Apache-2.0 are
different asserted terms for related artifacts [S8][S18].

**RECOMMENDATION (high):** record repository, commit/tag, archive checksum,
licence text, NOTICE files, dependencies, and data terms separately. Never infer
payload rights from a repository licence or infer a repository snapshot's
licence solely from a Zenodo metadata field.

### 6.3 Takedown and downstream copies

**FACT (medium; implementation/design split):** by 2024 the crawler project had
a prototypical webmaster takedown intake. Daily datasets were designed with a
`changelog.json` for removals, but robust update propagation was still priority
future work [S6][S7]. Current OWIL makes source-owner restrictions and user
responsibility explicit, but its published v1 text does not itself prove that
every downloaded shard consumes a complete, low-latency removal feed [S3].

**FACT (high; recommendation, not proven operation):** the 2025 LISA whitepaper
proposes tiered OWIL (non-commercial), OWICL (commercial), and OWIDAA (bulk/data
access) arrangements; latest-version discipline; removal feeds; downstream
takedown acknowledgements; audit trails; version rollover; termination purge;
and a non-profit public-interest steward coordinating federated nodes, with a
ring-fenced commercial arm [S19].

**INFERENCE (high):** LISA is valuable governance design, not evidence that
OWICL/OWIDAA, the proposed legal entity, synchronized removals, audits, or a
commercial arm are currently constituted and operating. The live public licence
reviewed here remains OWIL 1.0 and non-commercial. Curiosity must not turn a
whitepaper's future-tense controls into claims about current production state.

## 7. Security, privacy, and supply-chain implications

**FACT (medium):** OWLer documentation acknowledges that web-scale crawling can
trigger denial-of-service effects, reach malicious infrastructure, and
accidentally benefit from institutionally licensed IP ranges. Reported incidents
included robots ambiguity and unallowed licensed-content access. Responses
included an operator kill switch, dedicated crawler subnets, blacklists,
identifiable contact, and webmaster controls [S6].

**FACT (high):** OWI data includes untrusted third-party text and metadata.
Resilipipe schemas include validity/error, crawl provenance, canonical hints,
outlinks, and use flags, but a field such as `ows_index=true` or
`ows_genai=true` is a derived signal—not a warranty or blanket licence [S12].
OWIL expressly leaves content rights with owners [S3].

**INFERENCE (high):** Curiosity would inherit web-content malware/parser,
privacy, secrets, prompt-injection, poisoning, defamation, and deletion risk, as
well as a broad JVM/Python/Spark/OpenSearch/Lucene/iRODS/MinIO/Parquet/CIFF and
container supply chain. Authenticated access and content flags reduce neither
the need for isolation nor independent rights verification.

**RECOMMENDATION (high):** search results remain
`untrusted-external-evidence`; never render active content or execute retrieved
files. Preserve capture, source, extractor, flag derivation, licence version,
and deletion state. A binary AI/index flag must carry its origin, observation
time, rule version, and uncertainty, and must never silently grant authority.

## 8. Exact Curiosity implications

### 8.1 Adopt or adapt

1. **ADOPT — capture/derivative/index separation.** Keep WARC-like immutable
   capture evidence separate from rebuildable extraction and index snapshots.
2. **ADAPT — dual artifact delivery.** A portable lexical-index checkpoint plus
   a columnar metadata companion is useful for reproducibility and offline
   interchange. Use independently specified, provider-neutral Curiosity schemas.
3. **ADAPT — metadata-selectable partitions.** Language, time, source class,
   geography, and corpus-policy shards can make bounded vertical search
   tractable. Require overlap/dedup semantics and a manifest.
4. **ADOPT — explicit frontier service contract.** Separate crawler workers
   from durable scheduling state; support bounded stream and bulk exchanges,
   but avoid a singleton authority/failure point.
5. **ADOPT — usage-policy evidence.** Preserve robots, HTTP/meta directives,
   source terms/licence evidence, and derived use decisions as separate,
   versioned facts—not two unqualified booleans.
6. **ADOPT — downstream deletion protocol.** Every released snapshot or consumer
   needs sequence/checkpoint identity, authenticated tombstones, acknowledgement,
   expiry, and auditable propagation. Suppression and physical erasure remain
   distinct states.
7. **ADAPT — search application composition.** Learn from MOSAIC's modular
   retrieval and metadata filters, but keep the agent ABI, neutral search domain,
   index implementation, and operational adapters separate.
8. **ADOPT — governance precedes federation.** A distributed data plane requires
   one accountable policy authority, common incident/takedown semantics,
   version enforcement, and node audits before expansion.

### 8.2 Reject or defer

| Decision | Verdict | Confidence / reason |
| --- | --- | --- |
| OWI index as Curiosity's production seed/backfill | **REJECTED / legally deferred** | High; non-commercial revocable OWIL, third-party rights, unknown current coverage/freshness, purge duty. |
| OWI/LEXIS/dashboard as runtime search provider | **REJECTED** | High; beta/research posture, no evidenced relevance-search SLO or stable neutral API. |
| OWLer, Resilipipe, Spark indexer, owilix, MOSAIC in wholly owned core | **REJECTED under current ownership premise** | High; third-party code and extensive dependencies even where permissively licensed. |
| CIFF-compatible export/import concept | **ADAPTED** | High; useful interchange, but it is not the internal online index or evidence contract. |
| Copy OWLer scheduling/politeness defaults | **REJECTED** | High; historical proof-of-concept parameters, acknowledged incidents, and incomplete current validation. |
| Treat `ows_index` / `ows_genai` as rights clearance | **REJECTED** | High; derived metadata cannot grant owner rights or settle jurisdiction/use. |
| Small OWI interoperability fixture | **DEFERRED** | High; use synthetic CIFF/Parquet/WARC first; any real record needs OWIL and page-rights review, fixed bounds, provenance, and deletion owner. |
| LISA's version/takedown/audit pattern | **ADOPTED conceptually** | High as architecture; implementation and legal adequacy require independent design/counsel. |
| LISA's proposed legal entity/licence stack | **DEFERRED** | High; proposal, not verified current governance or a Curiosity legal recommendation. |

**RECOMMENDATION (high):** keep OpenWebSearch.EU as a zero-authority research
comparator. Curiosity should independently build its bounded, rights-reviewed
corpus and provider-neutral evidence contracts. If future OWI evaluation is
authorized, use an optional batch-only adapter in an isolated experiment; pin
one dataset and licence version; cap bytes/documents/time; prohibit recursive
expansion; and require deletion/takedown propagation before any result reaches
an agent.

## 9. Validation plan before reconsideration

No OWI data or service should advance without written answers and bounded tests:

1. **Operator/governance:** current legal operator and licensor after grant
   closure; decision authority; funding horizon; support and incident owners;
   whether the proposed non-profit/commercial structure exists.
2. **Terms:** exact intended dataset, OWIL/OWICL/OWIDAA text and hierarchy,
   commercial permission, underlying-content rights, database rights,
   attribution, sublicensing, model-training, output, and termination effects.
3. **Coverage/freshness:** unique current documents/hosts, inclusion method,
   duplicates, language/region slices, crawl-to-publication lag distribution,
   recrawl policy, snapshot retention, and update completeness.
4. **Deletion:** authenticated removal-feed protocol, sequence/checkpoint model,
   handling of WARC/index/Parquet/caches/backups, consumer acknowledgement,
   SLA, missed-update recovery, reinstatement, and audit evidence.
5. **Quality:** held-out primary-source recall, nDCG/Recall, freshness, spam,
   duplication, source diversity, snippet/citation fidelity, and slice-specific
   coverage warnings against Curiosity's approved judged set.
6. **Service:** documented API/CLI version, quotas, availability/latency SLO,
   data locality/egress, support, auth lifecycle, schema compatibility, and
   deprecation policy.
7. **Security/privacy:** payload threat model, malware/illegal-content handling,
   personal-data basis/retention, query/access logging, isolation, breach
   process, dependency inventory, and independent security review.

## 10. Source checks, contradictions, and confidence

| Claim cluster | Origin and triangulation | Confidence / retained limitation |
| --- | --- | --- |
| Project identity and closure | CORDIS fact sheet plus grant-linked Zenodo records [S1][S5]-[S9] | **High.** Operational successor remains unknown. |
| Four-tier architecture | D3.4 Y2 deliverable, D1.2 crawler deliverable, current component READMEs [S6][S7][S11][S12] | **High** for 2024 architecture; medium for current deployment. |
| Access and beta status | Current public OWI page, live OWIL, owilix record [S2][S3][S8] | **High** for stated posture; no service testing. |
| Current size | Official home-page counters [S4] | **Medium.** Self-reported; category methodology absent. |
| Freshness | Historical release lag in D3.4 versus current daily counters [S4][S7] | **High** that daily crawl volume is not a per-document freshness SLO; current lag unknown. |
| Hosted search/API | Project status says index sharing rather than search API; MOSAIC README documents self-hosted REST [S9][S10] | **High** distinction; dashboard internals are not a supported contract. |
| OWI data rights | Live OWIL plus public R&D statement [S2][S3] | **High** boundary; exact legal outcome requires counsel. |
| Code licences | Current repo files and exact Zenodo records [S5][S8][S11]-[S13][S16]-[S18] | **High** that terms differ by artifact/version; dependency review incomplete. |
| Governance | LISA final report plus live OWIL [S3][S19] | **High** that LISA recommends controls; **unknown** whether proposed entities/licences operate. |
| Post-project continuation | CORDIS closure, LUMI and SOURCE announcements [S1][S14][S15] | **Medium-high.** Demonstrates reuse, not durable general service. |

### Negative and contradictory results retained

- No reviewed primary source established a 2026 production availability,
  latency, support, freshness, retention, or takedown-propagation SLO.
- No reproducible current web-coverage or search-quality evaluation was found.
- No current public evidence confirmed that OWICL, OWIDAA, the proposed
  non-profit steward, or commercial subsidiary is legally constituted and
  generally available; LISA describes a recommended framework.
- The current home page's 28M hosts/185 languages cannot be reconciled from
  public definitions with the 2024 deliverables' 40.5M hosts, 184 crawler
  languages, and 600+ index-language values.
- The public site's approximate 1 PB statement, cumulative 1,577 TiB crawled,
  35.09 TiB index, and 28.83 TiB WARC counters describe different scopes; no
  safe conversion to “current searchable corpus size” was found.
- Zenodo and current repository licence metadata conflict for the Spark indexer
  and owilix. Exact artifacts must be pinned; no blanket project-code licence
  was inferred.
- The live dashboard's OWIL asset was recoverable, but a supported public
  production search API contract was not. Dashboard implementation strings were
  not treated as contractual API documentation.

## 11. Bounded curiosity pass

Scores are 1–5 for **relevance / decision value / novelty / cost**. Follow-up
was authorized by the declared frame; no live or out-of-frame probing occurred.

| Thread | Score | Result |
| --- | --- | --- |
| What does the live OWIL actually permit? | 5/5/5/2 | **Pursued.** Recovered the current versioned licence asset; non-commercial/research, third-party-rights, revocation, attribution, and purge terms materially reject foundation use [S3]. |
| Did OWI activity continue after grant closure? | 5/4/4/2 | **Pursued.** LUMI DaaS and SOURCE show reuse after February 2026, but do not establish a successor operator/SLO [S14][S15]. |
| Is OWSE-HUB a mature hosted product? | 5/5/3/2 | **Pursued.** D3.4 calls MOSAIC2go partial; current MOSAIC is a self-hostable slice application. Hub maturity remains unproven [S7][S9]. |
| Are all project software artifacts Apache-2.0? | 5/5/4/2 | **Pursued.** No: the current Spark-indexer licence is MIT while its old Zenodo release says Apache-2.0; owilix's record metadata and repository file also differ [S8][S18]. |
| Reconcile every live corpus counter | 4/3/4/4 | `CURIOSITY_NO_GO`: definitions and historical windows are absent; further arithmetic would create false precision without changing the verdict. |
| Create an account and measure API/download behavior | 3/2/3/4 | `CURIOSITY_NO_GO`: unnecessary access and live probing; beta/research terms and absent SLO already answer the foundation question. |
| Download a shard to inspect content quality | 4/3/3/5 | `CURIOSITY_NO_GO`: data-rights and purge obligations are unresolved; synthetic/permissioned fixtures are cleaner. |
| Determine legality across EU/US jurisdictions | 5/5/4/5 | `CURIOSITY_NO_GO`: requires counsel and exact use facts; this report records gates, not clearance. |
| Reverse engineer crawler/ranking behavior from source | 2/2/3/5 | `CURIOSITY_NO_GO`: public architecture is sufficient; code-level reconstruction adds contamination and licence risk. |
| Price OWI-based production deployment | 3/2/2/5 | `CURIOSITY_NO_GO`: QPS, egress, refresh, retention, support, deletion, and service terms are unknown. |

**Stop condition:** identity, pipeline, access, scale, freshness, rights,
licences, governance, continuation, and Curiosity implications are covered. The
highest-value contradictions were resolved or retained. Remaining gaps require
operator disclosure, counsel, or an authorized bounded experiment, and further
public sources were repeating the same component and policy classes.

## Sources

All accessed 2026-08-17.

- **[S1]** European Commission CORDIS, OpenWebSearch.EU grant `101070014`, fact
  sheet and project status. https://cordis.europa.eu/project/id/101070014
- **[S2]** OpenWebSearch.EU, “The Open Web Index in a nutshell.”
  https://openwebsearch.eu/open-webindex/
- **[S3]** Open Web Index Dashboard, “Open Web Index Licence (OWIL) – Version
  1.0,” last updated 2024-05-08. Canonical route:
  https://openwebindex.eu/owil-current ; versioned public application asset
  reviewed: https://openwebindex.eu/assets/index-HTuHDtO8.js
- **[S4]** OpenWebSearch.EU, official home page and OWI statistics.
  https://openwebsearch.eu/
- **[S5]** OpenWebSearch.EU, “OWLer StormCrawler,” Y2 software record,
  Apache-2.0, DOI `10.5281/zenodo.13836849`.
  https://zenodo.org/records/13836849
- **[S6]** Dinzinger et al., “Crawler Coordination Software Stack &
  Demonstrator V2,” Deliverable D1.2, DOI `10.5281/zenodo.14180359`.
  https://zenodo.org/records/14180359
- **[S7]** Hendriksen et al., “The OpenWebSearch Hub and the Open Web Index
  Y2,” Deliverable D3.4, DOI `10.5281/zenodo.14186646`.
  https://zenodo.org/records/14186646
- **[S8]** OpenWebSearch.EU, “OWILIX – Open Web Index Client” 0.12.1, DOI
  `10.5281/zenodo.13833664`, and current repository licence.
  https://zenodo.org/records/13833664 and
  https://opencode.it4i.eu/openwebsearcheu-public/owi-cli/-/raw/main/LICENSE
- **[S9]** OpenWebSearch.EU, MOSAIC repository README (REST, JSON/OpenSearch,
  modules and dependencies).
  https://opencode.it4i.eu/openwebsearcheu-public/mosaic/-/raw/main/README.md
- **[S10]** OpenWebSearch.EU, “The Open Web Index – Current Status.”
  https://openwebsearch.eu/the-project/status/
- **[S11]** OpenWebSearch.EU, Spark indexer README and current MIT licence.
  https://opencode.it4i.eu/openwebsearcheu-public/spark-indexer/-/raw/main/README.md
  and
  https://opencode.it4i.eu/openwebsearcheu-public/spark-indexer/-/raw/main/LICENSE
- **[S12]** OpenWebSearch.EU, Resilipipe/preprocessing-pipeline README and
  schema history.
  https://opencode.it4i.eu/openwebsearcheu-public/preprocessing-pipeline/-/raw/main/README.md
- **[S13]** Gürtl and Nussbaumer, “Mosaic Search Engine Framework” v2,
  Apache-2.0, DOI `10.5281/zenodo.18769363`.
  https://zenodo.org/records/18769363
- **[S14]** OpenWebSearch.EU, “OpenWebSearch.eu and LUMI AI Factory: powering
  Dataset-as-a-Service with a European Open Web Index,” 2026-08-05.
  https://openwebsearch.eu/openwebsearch-eu-and-lumi-ai-factory-powering-dataset-as-a-service-with-a-european-open-web-index-lumi-ai-factory/
- **[S15]** OpenWebSearch.EU, “New project in Open Web Search launched:
  SOURCE,” 2026-07-22.
  https://openwebsearch.eu/new-project-in-open-web-search-launched-source/
- **[S16]** OpenWebSearch.EU, “OWLer URLFrontier” 0.1.0, Apache-2.0, DOI
  `10.5281/zenodo.13837305`. https://zenodo.org/records/13837305
- **[S17]** Heineking, Zelch, and Hendriksen, “Resilipipe” 0.1.0,
  Apache-2.0, DOI `10.5281/zenodo.13784624`.
  https://zenodo.org/records/13784624
- **[S18]** Hendriksen, “OWS.eu Indexer” 0.1.0, Zenodo metadata
  Apache-2.0, DOI `10.5281/zenodo.8261098`.
  https://zenodo.org/records/8261098
- **[S19]** Matthias Wendland, “A Legal Framework for the Development and
  Operation of an Open Web Search Index (LISA),” final report/whitepaper,
  CC BY 4.0, DOI `10.5281/zenodo.18414874`.
  https://zenodo.org/records/18414874
