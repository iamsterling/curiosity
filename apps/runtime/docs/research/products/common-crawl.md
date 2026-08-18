# Common Crawl: public crawl/archive/index system and rights boundary

**Research date:** 2026-08-17  
**Decision:** whether Common Crawl can safely inform, test, or supply Curiosity's
owned public-web retrieval architecture.  
**Status:** clean-room research recommendation; not legal advice, an
implementation record, or authority to ingest data.  
**Primary-source access date:** 2026-08-17 for every source unless stated
otherwise.

## Executive verdict

**ADAPTED, narrowly (high confidence):** Common Crawl is an unusually useful
public reference for crawl mechanics, open archive formats, corpus-scale
economics, and sparse compatibility tests. Adopt the WARC/CDXJ/Parquet lessons
and benchmark *methods*. It may also be used, after rights review, for tiny,
URL-bounded, non-production experiments whose payloads are owned or compatibly
licensed and are discarded after measurement.

**REJECTED as Curiosity's production foundation (high confidence):** it is a
sampled archival corpus, not a current web-search service; its public single-URL
index is rate-limited; coverage, recrawl, deletion, and ranking are not under
Curiosity's control; and Common Crawl's Terms of Use grant only a limited access
and use license while expressly preserving third-party copyright and terms.
“Open data” and free access do **not** convey the copyrights in archived pages.
The terms may change, access may be restricted or discontinued, and users take
on broad risk and indemnity obligations, expressly including AI use [S1].

**DEFERRED (high confidence):** any committed Common Crawl payload, recurring
mirror, production index, training corpus, customer-visible excerpt, or
commercial benchmark awaits written counsel and dataset-specific rights review.
Do not infer permission from HTTP accessibility, robots permission, Common
Crawl inclusion, an AWS “open data” label, or a software repository's
Apache-2.0 license.

## 1. Frame, bounded questions, and method

### 1.1 Questions

1. What public evidence explains crawl selection, frontier handling,
   politeness, revisit behavior, deduplication, and the processing pipeline?
2. What do WARC, WAT, WET, CDXJ, and the Parquet URL Index contain, and which
   access pattern is each designed for?
3. What do current releases establish about scale and freshness—and what do
   they not establish?
4. What are the operational, economic, copyright, privacy, deletion, terms,
   and software-license boundaries?
5. Can tiny fixtures or benchmarks provide clean-room evidence without turning
   Common Crawl into Curiosity's corpus or runtime dependency?

### 1.2 Evidence rules and depth boundary

- **FACT** is directly supported by the cited source. **INFERENCE** is a
  reasoned reading, not a measured fact. **RECOMMENDATION** is a Curiosity
  choice. Confidence is high, medium, or low.
- Current Common Crawl pages, repositories, release notices, its engineer's
  public technical answers, IETF/IIPC standards, and AWS's registry were
  preferred. Common Crawl's legal and operational assertions establish its
  stated position, not an adjudicated legal result or independent performance.
- No crawler, index query, Athena job, bulk download, payload inspection, or
  source-code copying was performed. Public source was read only to understand
  behavior and licensing.
- Coverage stops at architecture and decision sufficiency. This is not a
  jurisdiction-by-jurisdiction copyright opinion, a production cost quote, or
  proof that a particular archived page can lawfully be reused.

## 2. System identity: archive and index, not search

**FACT (high):** Common Crawl describes itself as a nonprofit that provides a
copy/sample of the public Internet for research and analysis. Its archive has
been collected since 2008, is hosted primarily in the `commoncrawl` S3 bucket,
and is published as raw captures, metadata/text derivatives, indexes, and web
graphs [S2][S3][S4].

**FACT (high):** it does not expose a query-relevance engine comparable to a web
search engine. CDXJ resolves URL/capture keys to archive coordinates; the
Parquet URL Index supports analytical and bulk filtering. Neither is a
full-text, query-ranked search index [S5][S6].

**INFERENCE (high):** Common Crawl can answer “was this URL captured, when, and
where?” and support offline corpus analytics. It cannot directly answer
Curiosity's “which current pages best answer this query?” without a separately
built extraction, canonicalization, full-text index, ranking, freshness,
rights, deletion, and serving plane.

## 3. Crawl selection and frontier clues

### 3.1 Publicly established mechanics

**FACT (high):** CCBot is based on a Common Crawl fork of Apache Nutch and uses
Hadoop MapReduce. The crawl database yields candidates, the candidate list is
sorted by host, and work is distributed to crawler servers [S7]. Nutch's batch
model preselects fetch lists: results are later parsed, discovered URLs are
added to the crawl database, and another batch is generated; newly discovered
links are not immediately followed inside the same fetch job [S8].

**FACT (high):** the current fork integrates WARC/CDX writing and language
detection into the fetcher. Its alternative `Generator2` combines per-domain
and per-host limits and can generate many segments in one job. The fork is
Apache-2.0 software; that software license does not license crawl payloads
[S9][S10].

**FACT (medium; historical configuration):** in a 2021 public answer, Common
Crawl engineer Sebastian Nagel described selection as follows: domain harmonic
centrality controls the page allowance per domain; domain scores are projected
to pages with OPIC and inlink counts; a random component gives lower-scoring
pages some selection chance; fetch history imposes longer recrawl intervals on
lower-scoring URLs; and an unchanged refetch lengthens the interval [S11]. A
2025 Common Crawl/IETF presentation still described crawl steering by
domain-based harmonic-centrality rankings, corroborating the centrality signal
but not every 2021 parameter [S12].

**FACT (medium; 2023 operating description):** a Common Crawl technical
presentation described the post-2017 workflow as updating the CrawlDb with the
prior crawl, marking duplicates by content signature and redirect target, then
injecting sampled prior-crawl links, links from a shallow priority-first
“fresh” crawl, homepages, and URLs sampled from sitemaps before generating
fetch lists [S13]. These are strong architecture clues, but exact counts and
weights are historical rather than a 2026 contract.

**FACT (high):** Common Crawl's current FAQ is deliberately less specific: the
corpus is a sample, it generally does not archive an entire site, and a site's
pages are a randomly selected subset. CCBot consumes sitemaps announced in
`robots.txt`; pages may also be discovered through links from other sites
[S7].

### 3.2 What selection implies

**INFERENCE (high):** selection is graph- and history-biased sampling with
host/domain quotas and randomness—not an exhaustive traversal and not a
uniform sample of URLs, domains, publishers, languages, or claims. Link-rich
and already-known regions have structural advantages. Language seed projects
and sitemap sampling can improve gaps but do not prove representativeness.

**UNKNOWN:** no reviewed 2026 source disclosed the complete scoring formula,
random distribution, crawl traps/spam classifiers, current per-host/domain
caps, current sitemap budget, exact shallow-crawl mechanism, or language/region
quota policy. Curiosity must not reproduce undocumented weights as if they were
validated design choices.

## 4. Robots, access controls, and politeness

**FACT (high):** CCBot identifies as
`CCBot/2.0 (https://commoncrawl.org/faq/)`, checks `robots.txt` before fetching,
supports HTTP/1.1 and HTTP/2 over TLS, IPv4/IPv6, and up to four page redirects
(five for robots). It does not execute JavaScript and does not use cookies
[S7][S14].

**FACT (high):** Common Crawl says it honors `Disallow`, `Crawl-delay`,
nofollow links, and robots-announced sitemaps; waits a few seconds by default
between requests to a site; and adaptively backs off on HTTP 429 and 5xx
responses. A site can disallow CCBot and it will periodically recheck the robots
file. Published IP ranges and reverse DNS permit bot verification [S7][S14].

**FACT (high):** RFC 9309 standardizes `User-agent`, `Allow`, and `Disallow`,
redirect/error/cache behavior, and a minimum 500 KiB parse limit. It explicitly
says robots rules are **not access authorization**. `Crawl-delay`, sitemap,
training permission, copyright permission, and retroactive deletion are not
rights granted by the RFC [S15].

**FACT (high):** Common Crawl acknowledged in 2024 that it had no technical
implementation for many newer file-based ML opt-out mechanisms. It argued that
WARC-captured HTTP headers and HTML metadata let downstream users evaluate TDM
reservations, but capture is not the same as enforcement [S16]. Its 2024 UK
submission later argued that training/TDM opt-outs should principally be
enforced at the point of application, not archive ingestion [S17].

**INFERENCE (high):** “robots-compliant” means a stated fetch policy, not a
complete rights clearance. Because CCBot does not execute JavaScript, it can
receive HTML that browser-side paywall code would later hide; Common Crawl says
it never logs in or bypasses paywalls, while an independent investigation found
publisher articles exposed through this static-fetch path [S17][S18]. The
factual reconciliation is that “no credential or JS bypass” does not guarantee
“no paywalled expression in the HTTP response.”

## 5. Capture and derivative formats

| Product | Supported fact | Correct use | Material limitation |
| --- | --- | --- | --- |
| **WARC** | Raw crawl mapping: protocol response, request, capture metadata, URI, time, IP, MIME inference, payload/block digests; compressed record containers [S3][S19]. | Audit-grade source capture and range retrieval. | Raw, untrusted third-party bytes; may contain personal, harmful, copyrighted, malformed, or truncated content. Common Crawl raised its payload truncation threshold from 1 MiB to 5 MiB in March 2025 [S20]. |
| **WAT** | WARC-derived metadata records with JSON for WARC/HTTP headers, HTML head metadata, and extracted links [S3]. | Link/metadata analytics without every raw payload. | Computed derivative; parser loss and schema/version behavior matter. Not authoritative page text. |
| **WET** | WARC `conversion` records containing extracted plaintext and URL/language headers [S3]. | Cheap text-oriented experiments. | Markup and response context are lost; the documented extraction retains boilerplate rather than guaranteeing main-content quality [S3][S13]. |
| **CDXJ** | Per-crawl, sorted capture index; SURT + timestamp key and JSON values such as URL, MIME, status, digest, WARC filename/offset/length, language, encoding [S5]. | Point URL/history lookup, then HTTP range-read one WARC record. | No all-crawl index; public API is heavily rate-limited and explicitly unsuitable for broad/bulk use [S5][S7]. Only WARC response captures are indexed, not public WAT/WET record indexes [S21]. |
| **Parquet URL Index** | Columnar WARC index partitioned by crawl/subset with URL parts, fetch metadata, digest/MIME/language, and WARC coordinates; designed for SQL/bulk analytics [S6]. | Filter first, read only selected WARC byte ranges. | Roughly 300 GB of index per monthly crawl; schema evolves and old partitions may have nulls for newer fields [S6]. It is URL/capture metadata, not full text. |

**FACT (high):** WARC 1.1 is an open archival container standard defining
`warcinfo`, `response`, `resource`, `request`, `metadata`, `revisit`,
`conversion`, and `continuation` records. A `revisit` record can record an
identical or server-not-modified recapture without repeating a full payload
[S19].

**UNKNOWN (negative result):** reviewed Common Crawl product documentation did
not establish that current CC-MAIN archives emit WARC `revisit` records. The
documented archive examples and indexes describe response/request/metadata and
conversion records. Do not confuse the WARC format's *ability* to encode a
revisit with Common Crawl's recrawl scheduling or assume storage-level revisit
deduplication without inspecting a bounded sample.

## 6. Pipeline and data flow

The highest-confidence public synthesis is:

```text
prior CrawlDb + prior link graph + sitemaps + seed/enrichment inputs
  -> MapReduce candidate extraction / scoring / history checks
  -> domain and host budgets + randomized page selection
  -> candidates sorted/partitioned by host into many segments
  -> Nutch fetchers: robots check + per-host queues/backoff + HTTP fetch
  -> WARC request/response/metadata + CDX coordinates written by fetcher
  -> parse/extract status, signatures, links, MIME and language
  -> update CrawlDb; mark exact duplicate signatures/redirect targets
  -> generate WAT metadata and WET text derivatives
  -> publish path manifests, CDXJ and Parquet URL indexes, statistics/graphs
  -> S3/HTTPS access; downstream users build their own corpus/search systems
```

**FACT (medium; historical capacity, not a current promise):** the 2021
architecture answer reported 100 sequential segments, each fetched by a Hadoop
job with 40 parallel tasks and 160 fetcher threads per task; 16–20 EC2
instances fetched in about 13 days. That answer is useful for topology and
batching, not a 2026 sizing estimate [S11]. The 2014 account likewise says
politeness and machine count capped throughput, while cloud/spot variability
motivated Nutch adoption [S8].

**INFERENCE (high):** Common Crawl's strongest reusable architecture lessons
are: persist frontier state separately from immutable captures; separate
host-safe scheduling from corpus scoring; record request/response provenance at
fetch time; make extraction and indexes rebuildable derivatives; publish
manifests; and choose point versus bulk indexes deliberately.

## 7. Scale, freshness, recrawls, and duplicates

**FACT (high):** CC-MAIN-2026-30 was crawled 2026-07-07 through 2026-07-25 and
contains 2.14 billion pages, 364.01 TiB uncompressed, 40.5 million hosts, 33.2
million registered domains, and 603 million URLs not seen in earlier Common
Crawl releases. Compressed products include 84.69 TiB WARC, 14.09 TiB WAT, and
5.89 TiB WET across 100,000 files each [S20]. AWS describes the total corpus as
over 300 billion pages with monthly updates [S4].

**INFERENCE (high):** for July 2026, “new to Common Crawl” URLs were about 28%
(603M / 2.14B); the remaining roughly 72% were previously known URLs. That is a
URL-history ratio, **not** proof that 72% had unchanged content, nor that every
known page was recrawled monthly.

**FACT (medium; historical):** the 2021 engineer answer reported under 1%
URL-level duplicates in then-recent crawls, often caused by redirect targets,
and 1.5–4% exact content duplicates across different URLs. The recrawl interval
increased after an unchanged fetch [S11]. These figures are clues, not 2026
measurements and say nothing about near-duplicate boilerplate, mirrors, or
syndication.

**INFERENCE (high):** “monthly release” is archive publication cadence, not a
freshness SLO for a URL or domain. The July crawl spans 18 days; selection is a
sample; CCBot is static-HTML only; and pages can already be stale when fetched.
For query-time discovery, freshness must be measured using capture time,
first/last seen, HTTP validators, claimed publication time, change history, and
source-specific recrawl—not inferred from the crawl label.

## 8. Deletion, privacy, and integrity boundary

### 8.1 Current stated controls

**FACT (high):** Common Crawl's privacy policy says it collects personal data
present in freely accessible Internet content and republishes it in downloadable
repositories. A requester must provide detailed/full URLs; Common Crawl promises
reasonable efforts, may require identity verification, may retain data for
legal or legitimate business reasons, and may decline disproportionate,
systematic, backup-related, or impractical requests [S22].

**FACT (high):** its Terms reserve a right, but not an obligation, to refuse,
change, delete, or recategorize content. The copyright notice process requires
sufficiently specific identification and other statutory statements [S1]. A
public opt-out ledger lists legal exclusion requests and is intended to warn
downstream users; the ledger is not itself proof that historical bytes were
erased [S23].

### 8.2 Material contradiction and residual copies

**FACT (high; Common Crawl's position):** Common Crawl says published WARC files
are immutable. For prior captures it filters affected URLs from later crawls
and makes them inaccessible through public tools/indexes rather than editing
the WARC files. It says this is “to the extent technically possible” and does
not claim instantaneous or complete removal [S24].

**FACT (high; independent contrary evidence):** The Atlantic reported that
bounded code-level inspection still found publisher records after removal
requests, while public index searches returned “no captures.” It reported no
observed content-file modification since 2016 and quoted Common Crawl's
executive director saying the format is meant to be immutable [S18]. Common
Crawl disputes accusations of deception but confirms the core distinction
between index filtering and archive-byte deletion [S24].

**INFERENCE (high):** “removed” is semantically unsafe unless qualified as at
least one of: excluded from future fetches, suppressed from a particular index,
blocked at a serving layer, cryptographically tombstoned, or physically erased
from all controlled copies/backups. Copies already downloaded by third parties
cannot be recalled. Curiosity needs a deletion ledger and propagation protocol
that distinguishes every state; an empty index result must never be represented
as proof of physical erasure.

**INFERENCE (high):** immutable WARC is excellent evidence custody but poor
fine-grained deletion storage. An owned system should preserve immutable capture
objects only behind a revocable authorization map and support object layout,
encryption-key deletion, derived-index tombstones, downstream propagation, and
auditable completion states. Legal retention and erasure requirements must be
resolved before capture, not after petabyte publication.

## 9. Access and economics

**FACT (high):** corpus access is free over HTTPS without an AWS account and via
S3 in `us-east-1`; AWS's Open Data Sponsorship hosts the bucket. Processing,
request, network-routing, storage, and query-engine costs remain the user's.
Common Crawl recommends same-region processing to avoid inter-region/routed
traffic charges [S3][S4].

**FACT (high):** Common Crawl estimated a full single-crawl Parquet URL Index at
about 300 GB and an Athena upper scan cost of about USD 1.50 as of September
2025, with partition/column pruning often reducing it. This excludes WARC
payload scans, result storage, compute, engineering, and egress [S6].

**FACT (high):** the public CDX endpoint is heavily rate-limited; Common Crawl
asks clients to sleep, avoid concurrency/proxies, wait 24 hours after a block,
and use Parquet/Spark for broad filtering [S7]. Its Terms permit changes,
restriction, or discontinuation with or without notice [S1].

**INFERENCE (high):** storage sponsorship makes source bytes cheap to obtain,
not cheap to turn into a reliable search product. The dominant Curiosity costs
would be rights filtering, WARC parsing, extraction, dedup/canonicalization,
versioning, index builds, ranking, evaluation, deletion propagation,
observability, and continuous refresh. A free, rate-limited public endpoint has
no evidenced SLO and is not an acceptable production dependency.

## 10. Rights, terms, copyright, and license boundary

### 10.1 Corpus terms are not a page-content license

**FACT (high):** Common Crawl's March 7, 2024 Terms grant a limited,
non-assignable, non-transferable, non-sublicensable, non-exclusive license to
access and use the Service subject to the terms. They state crawled materials
may have source-owner terms; prohibit violating intellectual property/privacy
rights and separately harvesting personal data; disclaim accuracy, lawfulness,
non-infringement, and availability; recommend legal counsel before any use,
including commercial use; and require users to respect third-party rights [S1].

**FACT (high):** the Terms contain broad user indemnification for third-party
claims arising from crawl use, expressly including AI/ML development, training,
deployment, generated content, copyright, privacy/publicity, defamation, and
regulated harmful material. They use California law and individual JAMS
arbitration, subject to the text's exceptions [S1].

**FACT (high):** AWS labels the corpus available under Common Crawl's Terms of
Use, not CC0, CC BY, ODC, or Apache-2.0 [S4]. A Common Crawl representative
separately stated in its public forum that page content is copyrighted by other
people and Common Crawl cannot offer a license to it [S25].

**INFERENCE (high):** the repository is publicly accessible but not a
rights-cleared commons. There is no reviewed blanket grant to redistribute page
payloads, excerpts, embeddings, derived corpora, or models. Potential statutory
exceptions are purpose- and jurisdiction-dependent defenses, not dataset
licenses; Common Crawl's policy advocacy for TDM exceptions is its legal
position, not authority for Curiosity [S17].

### 10.2 Separate assets, separate obligations

| Asset | Evidenced boundary | Curiosity verdict |
| --- | --- | --- |
| Common Crawl WARC/WAT/WET/index data | Common Crawl ToU plus every underlying content/right/terms issue [S1][S4]. | **DEFERRED/REJECTED as foundation.** |
| `commoncrawl/nutch` source | Apache-2.0 fork; attribution/NOTICE and other license conditions apply [S9][S10]. | **LEARN only** under wholly-owned-core constraint; dependency review if ever proposed. |
| WARC 1.1 / robots RFC concepts | Public standards with their own standards-document terms [S15][S19]. | **ADOPT concepts**, write independent implementation/spec tests. |
| Parquet/CDXJ conventions | Open formats/specifications and separately licensed tooling; tool code license must be checked per repository. | **ADAPT interfaces**, do not import code by implication. |
| A page found in Common Crawl | Rights remain with page/rightsholders; page-level license and terms may differ or be absent. | **No presumed permission.** |

### 10.3 Clean-room risks

- **Code/data conflation:** Apache-2.0 on crawler code does not attach to the
  archive. Keep source-code review notes, format contracts, and payload rights
  ledgers separate.
- **Behavioral copying:** graph rank, randomized sampling, per-host queues, and
  batch frontiers are general ideas. Do not copy source expressions, defaults,
  configuration, tests, or comments into a wholly owned implementation.
- **Fixture laundering:** a ten-kilobyte page remains third-party expression
  even when embedded in a test. Hashing, extracting, or translating it does not
  automatically cure rights risk.
- **Terms propagation:** do not make a non-transferable/non-sublicensable access
  right look like permission for customers or agents to receive archived
  content.
- **Privacy/security:** archive content is untrusted active data. Never render
  it with scripts, resolve embedded resources, execute files, follow redirects,
  or expose raw headers/cookies without isolation and redaction.
- **Provenance drift:** record crawl ID, WARC record ID where present, URL,
  capture timestamp, digest, byte coordinates, terms version, source-page
  license evidence, transforms, and deletion state. A bare URL is insufficient.

## 11. Bounded fixture and benchmark plan

### 11.1 Allowed without making Common Crawl foundational

**RECOMMENDATION (high):** use three escalating lanes, with Common Crawl absent
from the default lane:

1. **Normative synthetic fixtures — ADOPT.** Generate tiny WARC 1.1, CDXJ, WAT-
   like JSON, and WET-like conversion fixtures from Curiosity-authored bytes.
   Include malformed headers, multi-member gzip, unknown record types,
   truncation, duplicate digests, redirects, encodings, and tombstones. These
   test format handling without third-party expression or network dependency.
2. **Permissioned interoperability fixture — ADAPT.** If a real Common Crawl
   record is necessary, preselect a URL whose full payload is Curiosity-owned,
   public-domain, or covered by an explicit compatible license; save only the
   minimal record/range after counsel confirms both source rights and Common
   Crawl ToU handling. Preserve license/attribution and an expiry/deletion
   owner. Prefer an access-controlled coordinate manifest and expected metadata
   over committing payload bytes.
3. **Ephemeral live compatibility probe — DEFERRED until approved.** A manually
   triggered, low-rate test may resolve one exact URL in one fixed crawl and
   range-read one bounded record. It must not run in routine CI, retry broadly,
   enumerate domains, create a cache/corpus, or gate production availability.
   Delete payloads after aggregate parser measurements unless separately
   approved.

### 11.2 Useful benchmarks

| Benchmark | Signal | Guardrail |
| --- | --- | --- |
| Parser conformance | WARC framing, gzip members, record relations, offset/range correctness | Synthetic/permissioned bytes only; fuzz with generated data. |
| Extraction robustness | raw -> text/metadata loss, charset/MIME handling, truncation behavior | Judge against authored fixtures; never treat WET as ground truth. |
| Dedup/version model | exact digest, canonical clusters, same-URL changes, redirect loops, tombstone propagation | Generated families with known lineage; do not import CC rankings. |
| Scale model | bytes/record, CPU/record, peak memory, index amplification | Extrapolate from bounded local fixtures and publish assumptions; CC release size is only a reference envelope. |
| Recall/quality | result relevance/freshness/diversity | Use a separately rights-cleared, time-stamped judged set. Common Crawl presence is not relevance truth. |
| Compatibility drift | schema fields and nullability across documented versions | Contract snapshots from public schemas; no production call dependency. |

**REJECTED:** downloading a monthly WET sample and calling it a benchmark
corpus; indexing random Common Crawl pages for demos; using CDX availability as
web coverage truth; training extraction/ranking models on unreviewed payloads;
or benchmarking “fresh search” against monthly capture membership.

## 12. Curiosity implications and recommendation ledger

| Decision | Verdict | Confidence / reason |
| --- | --- | --- |
| Learn archive/frontier separation, host-safe batching, immutable capture, rebuildable derivatives, and dual point/bulk indexes | **ADOPTED** | High; repeatedly supported by current docs, source repository, and standards. |
| WARC as Curiosity's owned raw-capture envelope | **ADOPTED conceptually** | High; open archival standard supports request/response, metadata, transforms, digests, and revisits. Exact profile is an ADR/design task. |
| CDXJ-like point lookup plus Parquet-like analytical catalog | **ADAPTED** | High; distinct access patterns are sound. Use provider-neutral internal contracts and owned names/schemas. |
| Common Crawl public API as runtime discovery | **REJECTED** | High; URL lookup rather than relevance search, rate limits, mutable terms, no SLO/control. |
| Common Crawl corpus as owned search index seed or permanent backfill | **REJECTED pending counsel; practically deferred** | High on architectural rejection; legal permissibility is jurisdiction/use specific and unknown. |
| Tiny real-record compatibility test | **DEFERRED** | High; useful only with page rights, ToU review, fixed bounds, provenance, and no routine dependency. |
| Synthetic WARC/index fixtures | **ADOPTED** | High; captures technical value with minimal rights and supply-chain exposure. |
| Copy Common Crawl Nutch code/configuration | **REJECTED** for wholly owned core | High; Apache-2.0 is permissive but still third-party code, and copying is unnecessary to learn the architecture. |
| Mirror Common Crawl's harmonic-centrality/random formula | **REJECTED** | High; complete current formula is not public/validated for Curiosity goals; test owned policies against explicit coverage objectives. |
| Treat index suppression as deletion | **REJECTED** | High; contradicted by confirmed immutable archive behavior. |

**RECOMMENDATION (high):** Curiosity should preserve Common Crawl as an
external research comparator behind a zero-authority boundary. It should build
its own narrowly scoped, policy-reviewed crawler and evidence chain; expose
capture/version/provenance/deletion state in the provider-neutral contract; and
use synthetic/permissioned compatibility evidence only. Any future Common Crawl
adapter must be optional, batch-only, rights-filtered, quota-bound, and unable
to expand the agent's crawl or corpus authority.

## 13. Unknowns and required checks before any data use

1. **Legal:** intended jurisdiction, commercial posture, output/excerpt model,
   source-page rights, database rights, privacy basis, TDM reservations, and
   whether Common Crawl's limited/non-transferable terms permit the exact flow.
2. **Deletion:** exact behavior of the opt-out ledger, historical archive
   suppression, WARC byte retention, CDN/S3 copies, backups, and downstream
   notice propagation for the selected record.
3. **Current crawler:** 2026 scoring weights, quotas, trap/spam handling,
   near-dedup, current fetch topology, recrawl schedule, and whether WARC
   `revisit` records are emitted.
4. **Data quality:** WAT/WET extractor version and known failure rates by MIME,
   language, charset, boilerplate, truncation, and malformed content.
5. **Service:** no evidenced availability/latency/retention SLO for indexes or
   HTTPS objects; current rate limit is qualitative.
6. **Security:** malware/CSAM handling, secret/credential redaction, content
   poisoning controls, and incident/takedown response are not established by
   reviewed product documentation.

## 14. Source checks and confidence

| Claim cluster | Origin and triangulation | Check / confidence |
| --- | --- | --- |
| Current formats/indexes | Common Crawl Get Started, CDXJ, URL Index; IIPC WARC standard [S3][S5][S6][S19] | Direct primary documentation; **high**. |
| Crawl frontier/selection | Current FAQ and fork README; 2014 official architecture; 2021 engineer answer; 2023/2025 presentations [S7][S8][S9][S11][S12][S13] | Mechanics triangulated, exact current weights absent; **medium-high**. |
| Politeness | Current FAQ/CCBot plus RFC 9309 [S7][S14][S15] | Stated implementation, not independently load-tested; **high** for policy, medium for perfect compliance. |
| Scale/freshness | July 2026 release plus AWS registry [S4][S20] | Direct release statistics; **high** for that release only. |
| Terms/copyright | Common Crawl Terms, AWS license field, Common Crawl staff answer [S1][S4][S25] | Direct terms; interpretation is not legal advice; **high** boundary, unknown outcome. |
| Privacy/removal | Privacy policy, opt-out ledger announcement, Common Crawl response, independent Atlantic investigation [S18][S22][S23][S24] | Material contradiction retained and both origins cited; **high** that index suppression differs from byte deletion. |
| Economics | Get Started, URL Index/Athena estimate, AWS sponsorship [S3][S4][S6] | Direct but variable and incomplete; **high** facts, medium extrapolation. |

## 15. Bounded curiosity pass

Scoring is 1–5 for **relevance / decision value / novelty / cost**. Pursuit was
authorized by the declared research frame; no out-of-frame follow-up was run.

| Thread | Score | Result |
| --- | --- | --- |
| Does “removal” erase archive bytes or only indexes/future crawls? | 5/5/5/2 | **Pursued.** Common Crawl's own response confirms immutable WARC plus filtering; independent inspection reports residual bytes. This materially strengthens the non-foundation verdict [S18][S24]. |
| Is robots permission a rights license? | 5/5/3/1 | **Pursued.** RFC 9309 explicitly says no; current ToU independently preserves third-party rights [S1][S15]. |
| Does Common Crawl currently emit WARC revisit records? | 3/3/3/3 | **Pursued to saturation; negative result.** WARC supports them, but reviewed CC docs did not establish use. Recorded as unknown rather than inferred. |
| Recover exact current selection probability/weights | 4/2/4/5 | `CURIOSITY_NO_GO`: public clues establish architecture but not a current formula; source-code mining/config reconstruction would add clean-room risk and would not change the verdict. |
| Measure live CDX rate limits | 2/2/2/3 | `CURIOSITY_NO_GO`: live probing is unnecessary, potentially impolite, and qualitative official limits already reject runtime dependence. |
| Download random WARCs to inspect payload quality | 3/2/3/5 | `CURIOSITY_NO_GO`: violates the no-bulk/no-unreviewed-payload boundary; synthetic and permissioned fixtures answer the implementation question more cleanly. |
| Resolve legality in every jurisdiction | 5/5/4/5 | `CURIOSITY_NO_GO`: requires counsel and exact use facts; research can identify gates, not issue legal clearance. |
| Derive exact production cost from Common Crawl | 3/2/2/5 | `CURIOSITY_NO_GO`: workload, region, retention, deletion, indexing, and SLO assumptions are absent. Use pilot unit economics. |

**Stop condition:** requested categories are covered, the key rights/deletion
contradiction is triangulated, and remaining gaps either require a bounded
technical experiment, counsel, or non-public/current configuration. Additional
sources were repeating known classes rather than changing the decision.

## Sources

All accessed 2026-08-17.

- **[S1]** Common Crawl, “Terms of Use,” last updated 2024-03-07.
  https://commoncrawl.org/terms-of-use
- **[S2]** Common Crawl, “Overview.” https://commoncrawl.org/overview
- **[S3]** Common Crawl, “Get Started” (access, WARC/WAT/WET).
  https://commoncrawl.org/get-started
- **[S4]** AWS Registry of Open Data, “Common Crawl.”
  https://registry.opendata.aws/commoncrawl/
- **[S5]** Common Crawl, “CDXJ Index.”
  https://commoncrawl.org/cdxj-index
- **[S6]** Common Crawl, “URL Index.” https://commoncrawl.org/url-index
- **[S7]** Common Crawl, “Frequently Asked Questions.”
  https://commoncrawl.org/faq
- **[S8]** Common Crawl, “Common Crawl's Move to Nutch,” 2014-02-20.
  https://commoncrawl.org/blog/common-crawl-move-to-nutch
- **[S9]** Common Crawl, `commoncrawl/nutch` README, branch `cc`.
  https://github.com/commoncrawl/nutch/tree/cc
- **[S10]** Common Crawl/Apache Nutch fork, Apache License 2.0.
  https://raw.githubusercontent.com/commoncrawl/nutch/cc/LICENSE.txt
- **[S11]** Sebastian Nagel, “Some details on CC architecture,” Common Crawl
  mailing list, 2021-07-19.
  https://groups.google.com/g/common-crawl/c/AB7IzC7vA30
- **[S12]** Common Crawl Foundation, “Observations and Measurements of HTTP/2
  During Large-Scale Web Crawls,” IETF 124 MAPRG slides, 2025.
  https://datatracker.ietf.org/meeting/124/materials/slides-124-maprg-observations-and-measurements-of-http2-during-large-scale-web-crawls
- **[S13]** Sebastian Nagel, “Common Crawl: Data Collection and Use Cases for
  NLP,” 2023-02-06.
  https://www.nlpl.eu/skeikampen23/nagel.230206.pdf
- **[S14]** Common Crawl, “CCBot.” https://commoncrawl.org/ccbot
- **[S15]** IETF, RFC 9309, “Robots Exclusion Protocol,” 2022-09.
  https://www.rfc-editor.org/rfc/rfc9309.html
- **[S16]** Common Crawl, “Balancing Discovery and Privacy: A Look Into Opt-Out
  Protocols,” 2024-02-13.
  https://commoncrawl.org/blog/balancing-discovery-and-privacy-a-look-into-opt-out-protocols
- **[S17]** Common Crawl, “Submission to the UK's Copyright and AI
  Consultation,” published 2024-12-17.
  https://commoncrawl.org/uk-copyright-and-ai-consultation
- **[S18]** Alex Reisner, “The Company Quietly Funneling Paywalled Articles to
  AI Developers,” *The Atlantic*, 2025-11-04.
  https://www.theatlantic.com/technology/archive/2025/11/common-crawl-ai-training-data/684567/
- **[S19]** IIPC, “The WARC Format 1.1” (ISO 28500:2017 text).
  https://iipc.github.io/warc-specifications/specifications/warc-format/warc-1.1/
- **[S20]** Common Crawl, “July 2026 Crawl Archive Now Available,” 2026-07-28.
  https://commoncrawl.org/blog/july-2026-crawl-archive-now-available
- **[S21]** Common Crawl, `whirlwind-python`, “A Whirlwind Tour of Common
  Crawl's Datasets using Python.”
  https://github.com/commoncrawl/whirlwind-python
- **[S22]** Common Crawl, “Privacy Policy,” last updated 2025-04-03.
  https://commoncrawl.org/privacy-policy
- **[S23]** Common Crawl, “Common Crawl Foundation Opt-Out Registry” (now
  ledger), 2025-09-17.
  https://commoncrawl.org/blog/common-crawl-foundation-opt-out-registry
- **[S24]** Rich Skrenta, Common Crawl, “Setting the Record Straight: Common
  Crawl's Commitment to Transparency, Fair Use, and the Public Good,”
  2025-11-04.
  https://commoncrawl.org/blog/setting-the-record-straight-common-crawls-commitment-to-transparency-fair-use-and-the-public-good
- **[S25]** Common Crawl staff response, “Inquiry About Accessing Common Crawl
  Data for Commercial Use,” mailing list, 2025-03-07.
  https://groups.google.com/g/common-crawl/c/wZwjDoxEilw
