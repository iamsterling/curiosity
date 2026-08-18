# TREC Deep Learning: evaluation design, drift, and rights

**Research date / source access date:** 2026-08-17  
**Decision:** whether, and under what controls, the TREC Deep Learning (DL)
track can evaluate Curiosity's owned public-web retrieval and agent-search
system.  
**Scope:** the five and final annual editions, TREC 2019–2023; MS MARCO
ranking v1/v2 corpora; topics, pools, qrels, tasks, metrics, access terms,
leakage, reproducibility, and transfer into Curiosity evaluation.  
**Status:** clean-room research, not a benchmark run, legal opinion, dataset
license grant, or production approval. No corpus, topics, qrels, run files, or
other dataset artifacts were downloaded. Public track pages and NIST overview
papers were read; temporary local copies of the papers were used only for text
inspection and were not added to this repository.

## 1. Decision frame and method

### Bounded sub-questions

1. What exactly is evaluated at passage and document level, against which
   corpus and topics in each year?
2. How were pools and judgments constructed, how complete and reusable are
   they, and what do the reported metrics mean?
3. Which year-to-year changes prevent scores from being treated as one
   continuous leaderboard?
4. What rights and access conditions attach separately to MS MARCO content,
   NIST qrels/pages, documentation, and evaluation code?
5. Which Curiosity claims can this fixed, answer-seeking, English benchmark
   support—and which global-search or agent claims can it not support?
6. What clean-room controls are required to obtain credible, reproducible
   results without importing third-party content into project code?

### Method and evidence discipline

Primary sources are the annual Microsoft track guidelines, annual NIST track
overview papers, NIST's per-year qrels pages, MS MARCO's terms, NIST's data and
copyright statements, and the NIST `trec_eval` implementation. Numerical
claims were checked between at least the guideline and overview where both
published the value. The NIST pages are authoritative for which qrels variant
to use. `ir_datasets` was consulted only as a secondary catalog check and is
not authority for rights or official scoring [S1–S20].

Labels used below:

- **FACT** — stated by a cited source.
- **INFERENCE** — bounded conclusion from facts, not directly tested here.
- **RECOMMENDATION** — proposed Curiosity choice.
- Confidence is **high**, **medium**, or **low**.

## 2. Executive conclusion and verdicts

**RECOMMENDATION — ADAPT as one offline retrieval slice; REJECT as a global
agent-search validator (high confidence).** TREC DL is valuable for one narrow
question: on a frozen, large, English web-derived corpus, does a system rank
answer-bearing passages or relevant documents near the top? Its strongest
assets are NIST's graded judgments, deep assessment compared with ordinary MS
MARCO labels, full-ranking and controlled-reranking variants, and an unusually
well-documented history of collection-construction failure and repair.

It cannot establish that Curiosity searches the global or current web well.
It has no live crawl, freshness, geographic/language breadth, temporal truth,
source-authority, safety, citation, synthesis, multi-query planning, stopping,
latency, cost, or end-to-end task-success judgment. The test queries were
filtered toward English questions answerable by a short passage; the corpora
were selected through Bing/MS MARCO pipelines, not sampled as a neutral web
census. Public qrels and years of benchmark use also defeat any unqualified
claim of blind evaluation for contemporary pretrained models.

The rights constraint is decisive. Microsoft says MS MARCO and ORCAS are for
**non-commercial research purposes only**, are supplied without extending a
license or other IP rights, may contain documents Microsoft does not own, and
terminate access rights on violation [S1, S6]. The repository's CC BY 4.0
documentation and MIT code licenses do **not** relicense the dataset. Curiosity
must not ship, redistribute, train a commercial feature on, or assume internal
commercial R&D use of the corpus is permitted without an independent legal
review and, where needed, written permission.

| Decision item | Verdict | Why |
| --- | --- | --- |
| Evaluation pattern: frozen corpus + hidden/held-out topics + graded qrels | **ADOPT** | Strong, separable retrieval regression design. |
| TREC DL 2022/2023 passage test as an offline research slice | **ADAPT** | Best reusable editions, but public/contaminated and rights-constrained. |
| 2019/2020 as additional v1 robustness slices | **ADAPT** | Useful distribution/version contrast; corpus construction leaks query-conditioned selection. |
| 2021 original qrels as a headline score | **REJECT** | Organizers found serious incompleteness, old/new bias, reuse, and saturation concerns. |
| 2021 expanded qrels for diagnosis | **ADAPT** | Better for analysis; scores are not comparable with original-qrels track results. |
| 2022/2023 inferred document qrels as direct document-relevance truth | **REJECT** | They test “contains a relevant passage,” not independent whole-document relevance. |
| 2023 synthetic topics as a sole test set | **REJECT** | Small accepted sample, human filtering required, model-family bias not ruled out. |
| TREC DL as proof of global/live/agent search quality | **REJECT** | Construct mismatch is fundamental. |
| Commercial use or redistribution of MS MARCO | **DEFER** | Requires legal/rights-holder clearance; current terms do not grant it. |
| TREC-style pooling/CAL for a Curiosity-owned evaluation corpus | **ADAPT** | Transfer the method, not MS MARCO content or hidden implementation details. |

## 3. What the benchmark actually contains

### 3.1 Query and corpus origin

**FACT (high):** MS MARCO questions are sampled from anonymized Bing user
queries. The original pipeline filtered non-English, adult/offensive, likely
navigational, transactional, and long-answer needs, targeting the estimated
10–20% of English queries that might be answerable by a short passage. Crowd
workers saw up to ten Bing-retrieved passages, marked passages used to answer,
and wrote an answer; roughly 35% could not be answered from those candidates
[S7–S11].

**INFERENCE (high):** “real user queries” does not mean representative public
web demand. The track heavily represents English, informational, short-answer
questions that survived proprietary classification and annotation filters.
It underrepresents navigation, transactions, exploration, long-form research,
non-English needs, ambiguous dialogue, adversarial information environments,
and tasks requiring several independent sources.

### 3.2 MS MARCO ranking v1: TREC 2019–2020

**FACT (high):** the v1 passage collection has 8,841,823 passages. It is the
union of top-ten passage candidates retrieved for roughly one million MS MARCO
queries, so every passage entered because of some query. The v1 document corpus
has 3,213,835 URL-derived documents. Original passages were extracted between
January 2016 and February 2018; documents were fetched in March 2018 through a
different parsing pipeline, leaving missing pages, text drift, encoding, and
whitespace problems. Only about 2.8 passages per document were present, and
passage selection could have used a future test query. The track therefore did
not expose/permit a passage-document mapping in v1 [S1, S2, S7, S10].

Training data is large but shallow: 502,939 passage training queries / 532,761
passage qrels and 367,013 document training queries / 384,597 document qrels.
Usually only one positive is known. A marked passage was transferred to its
source document as a positive document label [S1, S2, S7, S8].

**INFERENCE (high):** v1 tests ranking over a query-conditioned candidate
universe, not unbiased crawling or discovery. Sparse training qrels contain
false negatives by construction. Document labels conflate “contained a passage
used in an answer” with whole-document relevance.

### 3.3 MS MARCO ranking v2: TREC 2021–2023

**FACT (high):** v2 became document-native: 2.7 million still-retrievable v1
URLs plus 9.2 million additional documents selected as likely to contain useful
passages, totaling 11,959,635 documents. A proprietary, query-independent
algorithm selected non-overlapping promising passages, averaging 11.6 per
document and yielding 138,364,198 passages. The release added explicit
passage-to-document IDs and byte spans, titles/headings/body fields, cleaner
text, and corrected many v1 encoding issues [S3, S7, S9–S11].

V2 train sets changed as well: 277,144 passage queries / 287,889 qrels and
322,196 document queries / 331,956 qrels, with two dev sets per task. Old
document qrels were mapped by URL; old passage qrels required the same URL and
sufficient text similarity. The organizers explicitly note that later page
content may no longer support the old label [S3, S7, S9–S11].

**INFERENCE (medium):** v2 is more realistic than v1 but still not a general web
sample. Selection depends on proprietary Bing history and a proprietary
passage-quality algorithm that cannot be independently reproduced from the
public specification.

## 4. Tasks, run boundaries, and judgment meaning

### 4.1 Passage versus document ranking

**FACT (high):** every year offered full ranking from the complete corpus and
reranking of a supplied lexical candidate list. Passage ranking asks for
passages likely to contain an answer. Through 2021, document ranking asked for
documents relevant to the query. In 2022–2023 it was redefined as ranking
documents by likelihood of containing a relevant passage [S1–S5].

Submission/candidate bounds drifted:

| Edition | Document full/rerank | Passage full/rerank | Consequence |
| --- | --- | --- | --- |
| 2019 | up to 1,000 full; rerank 100 | up to 1,000; rerank 1,000 | Full runs can expose deeper candidate recall. |
| 2020 | up to 100; rerank 100 | up to 1,000; rerank 1,000 | Task depths differ. |
| 2021 | up to 100; rerank 100 | up to 100; rerank 100 | V2 and shallow submission cut-off arrive together. |
| 2022–2023 | up to 100; rerank 100 | up to 100; rerank 100 | Passage-primary design; document labels inferred. |

The 2020 document rerank used Indri with Krovetz stemming and stopword removal;
passage rerank used BM25 without stemming. The 2021 rerank candidates used
Pyserini. The guideline pages provide candidate files, but the exact software,
index, analyzer, and file checksum must be pinned to reproduce a run [S2, S3].

### 4.2 Four grades are not semantically identical

**FACT (high):** document grades in independently judged years are 0 irrelevant,
1 relevant/minimal information, 2 highly relevant/substantial information,
3 perfectly relevant/dedicated top result. Binary document measures count 1–3
as relevant. Passage grades are 0 irrelevant, 1 **related but does not answer**,
2 highly relevant/has an answer, 3 perfect/exact answer. Binary passage metrics
must count only 2–3 as relevant [S12–S16].

NIST therefore publishes both full passage qrels and, from 2021 onward, a
variant mapping grade 1 to 0. Use full qrels for nDCG; use the `no1` qrels or
`trec_eval -l 2` for binary metrics. Treating passage grade 1 as relevant is a
material scoring bug. Conversely, replacing grade 1 with 0 before nDCG changes
the official graded gain [S14–S16].

**FACT (high):** in 2022–2023, document qrels are inferred by taking the maximum
judged passage grade among passages in a document (including propagated
near-duplicates). Binary document scoring still treats inferred grades 1–3 as
relevant [S4, S5, S15, S16].

**INFERENCE (high):** a 2022/2023 document score does not validate holistic
document usefulness, authority, completeness, or even that the document was
viewed by an assessor. It validates passage containment under the available
passage judgments.

## 5. Pools, active assessment, and qrels

### 5.1 Why these qrels are deeper—but not complete truth

**FACT (high):** the ordinary MS MARCO labels are sparse and highly incomplete;
the selected positive is not asserted to be the best answer. TREC submitted
runs were pooled before NIST assessors produced graded labels. `trec_eval`
normally treats unpooled/unjudged items as nonrelevant for most measures, so a
new system that retrieves relevant material outside the historical pools can
be under-scored [S7, S18].

**INFERENCE (high):** the qrels are observations under a run-dependent sampling
design, not exhaustive relevance ground truth. Pool diversity matters. A novel
Curiosity retriever is precisely the case where missing judgments may be
non-random.

### 5.2 2019 construction

**FACT (high):** 200 topics were run; NIST selected 52 for assessment using
submitted-document-run behavior under sparse MS MARCO MRR (median MRR >0 and
<=0.5). For each task, a depth-10 union pool plus sparse positives was judged,
then NIST's modified HiCAL active-learning process selected likely relevant
unjudged items. Topic-specific stopping aimed at roughly `2R + 100` judgments;
topics with fewer than three relevant items or relevant/judged ratio >=0.6 were
excluded. Both task test sets ended with 43 topics, overlapping but not
identical. The same assessor judged both forms at different times. There were
16,258 document qrels and 9,260 passage qrels [S1, S7, S12].

Top-10 pooling both let assessors learn the topic and made cutoff-at-10 scores
precise for the pooled runs. Dynamic HiCAL then sought recall beyond those
pools. The overview's leave-out analysis supported reuse, but it also explains
why ordinary static “remove one team's unique documents” tests do not exactly
simulate this dynamic collection process [S7].

### 5.3 2020 and 2021

**FACT (high):** 2020 ran 200 topics and retained 45 document and 54 passage
topics (not subset-related), with 9,098 and 11,386 qrels respectively. It again
used pooled, multi-grade NIST assessment and produced separate document and
passage collections [S2, S8, S13].

In 2021, 477 submitted topics were stratified at ten query words, sampling
roughly equal short/long strata. NIST retained 57 document topics (28 short, 29
long) and 53 passage topics (25 short, 28 long), with 13,058 and 10,828 qrels.
Documents and passages were judged independently [S3, S9, S14].

**FACT (high):** the 15.6x passage and 3.7x document corpus growth did not bring
a commensurate assessment-budget increase. Organizers warned that the original
2021 collection had high unjudged proportions below the shallow pool and weak
reuse. NIST later published expanded 2021 judgments and explicitly warns that
scores computed with original qrels must not be compared to scores computed
with expanded qrels [S9, S14].

The 2021 analysis also found “oldness” bias: mapped training/test positives came
from the v1 universe while many new v2 documents were negatives or unjudged.
The overview reported only moderate agreement (Cohen's kappa 0.468) between
actual document judgments and labels inferred from passage judgments, and
noted that missing passage judgments can leave relevant documents unlabeled
[S9].

### 5.4 2022 repair

**FACT (high):** 2022 submitted 500 queries: 250 backup-style and 250 newly
sampled after the original one-million-query cutoff, whose top-ten passages and
URLs had never contributed to corpus construction. NIST considered the latter
250; staff rejected 21 before assessment. The final set had 76 topics [S4,
S10].

Three changes addressed 2021: passage-only assessment (effectively doubling its
budget), document labels inferred from passages, and near-duplicate clustering.
One canonical passage per near-duplicate class was judged and its label was
propagated to class members. Of 100 passage runs, 82—baseline runs and up to
three priority runs per team/subtask—entered initial pools [S10, S15].

The published `withDupes` passage qrels contain 386,416 rows and inferred
document qrels 369,638 rows. These row counts are inflated by propagation across
near-duplicate classes and document inference; they are not counts of distinct
human assessment actions [S4, S15].

Assessment began with up to 100 items ordered from a depth-10 run pool. A topic
was discarded if none or at least half were relevant. Remaining pool items, a
depth-10 pool over a fixed random one-tenth corpus (for an experiment), and
continuous-active-learning candidates were judged. Acceptance required at
least 150 judgments, more than three relevant passages, and relevant density
below 40%; high-density or budget-incomplete topics were rejected. Three CAL
threads were run, and the full-corpus/all-available-judgment thread produced the
official qrels [S10].

**INFERENCE (high):** 2022 is the strongest single TREC DL fit for reusable
passage evaluation. Its topic selection deliberately avoids both no-positive
and too-many-positive needs, however, so it estimates performance on a
tractable middle band rather than all search traffic.

### 5.5 2023 replication plus synthetic topics

**FACT (high):** 2023 reused v2, the held-out human-query method, passage-only
judging, deduplication, and inferred documents. It supplied 700 topics: 200
held-out human queries, 250 T5-generated queries, and 250 GPT-4-generated
queries. All 35 submitted passage runs entered depth-10 pools. NIST retained 82
topics: 51 human, 13 T5, and 18 GPT-4. The released duplicate-expanded passage
qrels have 22,327 rows and inferred document qrels 18,034 rows [S5, S11, S16].

Synthetic construction was not automatic evaluation generation. Organizers
sampled 1,000 corpus passages, used GPT-4 to score standalone passage quality,
discarded malformed and score-<50 cases, generated 100 T5 queries and one
GPT-4 query per seed, and matched T5 query length/lexical overlap to a 2022
target sample. Assessors then accepted only 13/48 T5, 18/49 GPT-4, and 51/147
human candidates reaching them [S11].

**FACT / SOURCE CONTRADICTION (high):** the pre-submission 2023 guideline says
synthetic queries were “not intended for use in the official NIST evaluation,”
but the final overview calls the 82-topic human-plus-synthetic set the final
test collection and evaluates track runs on it; NIST's released qrels include
the assessed topics [S5, S11, S16]. The final report documents what was done and
therefore governs reproduction of its tables, but “official 2023 score” is
ambiguous unless the report names the exact topic subset. Curiosity must record
whether it scores all 82, the 51 human topics, or the 31 synthetic topics and
must not compare those values as if they were the same evaluation.

The 31 accepted synthetic topics gave a system-order Kendall tau of 0.8487
against the 51 human topics; all 82 versus human gave 0.9395. GPT-4 topics
slightly overestimated GPT systems; T5 topics showed little same-family bias in
this small run set. The authors call the result initial and require more
analysis [S11].

**INFERENCE (high):** this is evidence that carefully filtered synthetic topics
can supplement—not replace—human topics. It is not evidence that generated
qrels, unfiltered generated queries, or self-evaluation by the same model are
reliable.

## 6. Metrics and correct interpretation

**FACT (high):** NDCG@10 was the primary analysis metric in all five annual
overviews. It rewards graded relevance near the top and normalizes per topic.
The overviews also report combinations of:

- NIST-judgment reciprocal rank (RR), sparse-MS-MARCO RR, and average
  precision (AP) in 2019–2021;
- normalized cumulative gain (NCG), typically at candidate depth 100 or 1,000,
  to inspect full-retrieval candidate quality;
- NDCG@10, NCG@100, and AP in 2022; and
- NDCG@10, NDCG@100, and AP in 2023 [S7–S11].

Sparse MS MARCO evaluation and NIST evaluation are not interchangeable. For
example, the 2020 overview reports lower ordering agreement than 2019 and
discusses correlation between ORCAS usage, Bing-derived labels, and sparse-MRR
results. From 2022, held-out topics have no sparse qrel, so sparse RR disappears
[S8, S10].

**RECOMMENDATION (high):** Curiosity should report at minimum:

1. NDCG@10 on full graded qrels (top-rank quality);
2. MAP and NDCG@100 where official for the chosen edition (deeper ranking);
3. Recall/NCG at the candidate handoff depth, clearly labeled as a diagnostic;
4. per-topic scores and paired confidence intervals or randomization tests,
   never only a macro mean;
5. judged@k and residual/unjudged rate for Curiosity versus historical runs;
6. latency, index size, query-time compute, and retrieval-stage cost outside
   the TREC relevance score.

Do not compare raw scores across years, v1 versus v2, original versus expanded
qrels, passage versus document tasks, full rank versus constrained rerank, or
different dedup/qrels variants. The topic/corpus/qrels tuple is the benchmark
identity.

## 7. Version drift: five related benchmarks, not one time series

| Year | Corpus | Submitted -> evaluated topics | Judgment design | Material interpretation change |
| --- | --- | --- | --- | --- |
| 2019 | v1: 3.2M docs / 8.8M passages | 200 -> 43 docs; 43 passages | depth-10 + sparse positives + HiCAL; independent task qrels | First deep sets; topic selection observes sparse-label run behavior. |
| 2020 | same v1 | 200 -> 45 docs; 54 passages | pooled graded NIST judgments | New topics; document full list capped at 100; ORCAS permitted. |
| 2021 | v2: 11.96M docs / 138.36M passages | 477 -> 57 docs; 53 passages | length-stratified; independent task qrels | New corpus/mappings; passage depth 100; incomplete judgments and oldness bias. |
| 2022 | same v2 | 500 -> 76 shared | passage depth-10 + CAL + dedupe; docs inferred | Held-out harder topics; passage-primary; document task redefined; no sparse RR. |
| 2023 | same v2 | 700 -> 82 shared | passage depth-10 + dedupe; docs inferred | 51 human + 31 filtered synthetic topics; final track year. |

**FACT (high):** 2023 was explicitly the fifth and final TREC Deep Learning
track. There is no TREC DL 2024 continuation to silently append [S5, S11].

## 8. Leakage, bias, and validity threats

### 8.1 Known construction leakage

- **FACT (high):** v1 corpus membership and passage choice were conditioned on
  the original million queries, potentially including test queries. V2 removes
  that direct passage-selection issue, but 2021 reused/mapped old labels [S7,
  S9, S10].
- **FACT (high):** 2021–2023 prohibited ORCAS and any mapping from v2 items back
  to v1 because it could reveal old positives. QnA/NLGEN and other unlisted MS
  MARCO datasets were prohibited because they reveal construction information
  unavailable to a real search engine. Passage-document mapping was permitted
  only with v2 [S3–S5].
- **FACT (high):** previous TREC topics/qrels were allowed for later track
  participation (subject to the listed exceptions), making later editions
  validation sets rather than independent replicas of all prior decisions
  [S3–S5].

### 8.2 Pool and assessor bias

**INFERENCE (high):** pools favor approaches represented by submitted runs.
Strong neural, lexical, dense, and baseline submissions improve coverage, but
cannot remove it. HiCAL adds model-guided discovery and its own selection bias.
Unjudged-as-nonrelevant especially risks penalizing a novel retrieval lane.

Topic rejection also conditions the estimand: unclear, no-relevant, and
high-relevant-density queries are deliberately removed to build affordable,
discriminative collections. This is appropriate for system comparison but not
for estimating production failure prevalence.

### 8.3 Contemporary model contamination

**FACT (high):** NIST qrels and topics for all five editions are now publicly
downloadable, and annual results/papers expose topic text and system behavior
[S12–S16].

**INFERENCE (high):** a 2026 foundation model may have seen MS MARCO corpora,
topics, qrels, papers, generated-query models, or derived benchmarks during
pretraining or fine-tuning. Unless training lineage excludes them, a present-day
run is a public regression benchmark, not blind generalization evidence. Exact
contamination is **UNKNOWN** for opaque model providers.

**RECOMMENDATION (high):** label every run `public-seen-risk`; record model name,
immutable version, provider, training-data disclosure, prompts, and whether any
component was tuned after viewing qrels. Reserve a newly authored, access-
controlled Curiosity set for release decisions.

### 8.4 Domain and social bias

The source is historical Bing traffic and Bing-selected pages; language and
answerability filters remove whole need classes. URL survival and later recrawl
change the available distribution. The benchmark does not publish a sufficient
demographic, country, language, source-type, viewpoint, or harmful-content
audit to support fairness claims. Adult/offensive filtering also means safety
behavior is not stressed [S6–S11]. These are **known design limits**; magnitude
for Curiosity is **UNKNOWN**.

## 9. Rights, access, and clean-room boundary

### 9.1 Separate the assets

| Asset | Stated access/rights | Curiosity consequence |
| --- | --- | --- |
| MS MARCO corpora, queries, labels, candidates; ORCAS | Non-commercial research only; free of charge **without extending any license or other IP rights**; underlying document rights may not be owned; as-is; takedown contact; rights terminate on violation [S1, S6]. | Restricted external research data. No redistribution, bundling, product training, or production serving absent clearance. |
| Microsoft `msmarco` repository documentation | CC BY 4.0; repository code under MIT [S5, S17]. | May cite/adapt docs with attribution, but these licenses do not cover dataset payloads. |
| NIST-hosted qrels/pages | Direct public download. NIST says unmarked site information is public information; NIST-employee non-SRD works generally lack US copyright, with broad foreign-use permission and acknowledgment conditions [S12–S16, S19, S20]. | Qrels appear reusable with attribution, but the individual TREC pages do not attach an explicit asset-specific license. Preserve provenance; confirm with NIST/legal before redistribution or commercial packaging. |
| NIST `trec_eval` | Current NIST page offers 9.0.7/latest. The repository-level `LICENSE.md` now permits use, copying, distribution, modification, and derivatives with the notice, modification labeling, and NIST acknowledgment; legacy Chris Buckley source headers still say research/non-commercial [S18]. | Pin the exact revision and preserve both the repository notice and applicable file headers. Resolve the apparent legacy-header conflict before commercial redistribution; ordinary internal scoring is not a reason to copy its source into this repo. |
| Track overview papers | NIST-hosted proceedings with mixed Microsoft/UCL/NIST/Waterloo authorship. | Cite; do not infer that general NIST public-domain rules apply to every coauthored paper. |

**INFERENCE (high):** “available by URL” is not “open data” and “repository is
MIT/CC” is not “corpus is MIT/CC.” The MS MARCO click-through acceptance and
automatic agreement language creates a contract risk independent of copyright.

**UNKNOWN (material):** whether Curiosity's specific organizational use counts
as non-commercial research; whether evaluation outputs or model weights are
“research outputs in products”; whether NIST qrels incorporate protectable
non-federal contributions outside NIST's general statement; foreign database
rights; and required deletion behavior after MS MARCO document takedowns.
Microsoft expressly recommends independent legal review for product questions
[S1, S6].

### 9.2 Clean-room operating rules

**RECOMMENDATION (high):** if counsel approves research evaluation:

1. obtain data only from the official Microsoft/NIST endpoints after capturing
   the terms, acceptance actor, date, purpose, and approved users;
2. keep corpora/qrels outside this repository and all distributable artifacts;
   never commit excerpts, caches, indexes, logs, or generated embeddings;
3. inventory exact filenames, official checksums where published, byte counts,
   acquisition date, and a local dataset ID; preserve a takedown/deletion path;
4. restrict access to the approved research environment and prevent corpus text
   from entering telemetry, third-party model prompts, or provider retention;
5. use only the edition-allowed resources when claiming track comparability;
   do not exploit QnA/NLGEN, ORCAS-to-v2 links, old/new mappings, or qrels during
   ranking;
6. separate development from final evaluation; freeze code/config/index/model
   before exposing the held-out set to the evaluation operator;
7. publish only aggregate scores and permissible minimal examples; do not
   redistribute dataset records;
8. retain attribution and an immutable source/terms ledger, and stop use if
   permissions terminate or a rights holder requests removal.

This is clean-room **use**, not reverse engineering of Bing's proprietary
ranker or v2 passage selector. Public behavioral specifications may inform an
independent Curiosity evaluator; proprietary models, hidden data, credentials,
or access controls must not be sought or reconstructed.

## 10. Reproducibility protocol

**RECOMMENDATION (high):** a result is reproducible only if its manifest pins:

- task (`passage`/`document`, `fullrank`/`rerank`), year, v1/v2 corpus, and exact
  official topic/qrels/candidate filenames and checksums;
- original versus expanded 2021 qrels; `withDupes` versus `no1`; duplicate
  equivalence-class version; document-inference rule;
- `trec_eval` source/version/build hash, full command line, relevance threshold,
  cutoffs, and treatment of missing topics/duplicate IDs/unjudged items;
- indexer, tokenizer, stemmer, stopwords, field mapping, passage spans,
  deduplication, ranking/fusion/reranking formulas, tie breaking, and random
  seeds;
- immutable model and embedding IDs, quantization, prompt templates, generation
  settings, hardware/software environment, and external resources;
- run-file validation: six columns, official IDs, unique item per topic,
  contiguous/valid rank, non-increasing score, allowed maximum depth, and every
  evaluated topic represented;
- per-topic outputs, aggregate metrics, statistical comparison method,
  unjudged@k, wall time, compute, and failure count.

Use full official qrels for nDCG. For binary passage metrics use `no1` or
`-l 2`, but not both as an undocumented transformation. Evaluate the 2022/2023
official expanded duplicate qrels exactly as NIST directs. Use `trec_eval -c`
or independently verify topic completeness: the tool's default can ignore a
qrels topic with no retrieved results, which can hide a broken run [S14–S18].

**CHECK:** reproduce a published organizer baseline from the same edition
before comparing Curiosity. A mismatch blocks quality conclusions until corpus,
analyzer, candidates, qrels variant, and scorer are reconciled.

## 11. What TREC DL can and cannot validate for Curiosity

### It can support, with bounded wording

- **FACT/INFERENCE (high):** static English question-passage/document ranking
  effectiveness on the exact MS MARCO corpus and assessed topic distribution;
- top-ten graded relevance, deeper ranked relevance, and candidate-generation
  diagnostics;
- comparison of lexical, dense, hybrid, reranking, and full-retrieval changes
  under a frozen index;
- passage versus document retrieval plumbing and passage-to-document mapping;
- regressions across independently maintained Curiosity components, provided
  the same frozen benchmark identity is used;
- sensitivity analysis across v1 and v2 and across the stronger 2022/2023 sets.

### It cannot validate

- global-web coverage, crawl completeness, recency/freshness, change detection,
  canonicalization, robots/publisher policy compliance, or takedown handling;
- language, country, locality, personalization, navigation, transaction,
  long-form research, multimodal, code, product, news, or social-search quality;
- source authority, trustworthiness, independence, viewpoint diversity,
  misinformation resistance, safety, privacy, or legal compliance;
- query decomposition, iterative browsing, follow-up selection, budget/stopping,
  tool failure recovery, memory, or other agent policy;
- content extraction fidelity from live HTML/PDF, citation correctness,
  entailment, answer completeness, contradiction handling, or hallucination;
- latency, availability, throughput, index/build cost, marginal query cost, or
  quality under operational budgets;
- blind generalization of a modern opaque pretrained model;
- commercial deployability or rights to index/serve the underlying web pages.

**RECOMMENDATION (high):** claim only “TREC DL YEAR TASK NDCG@10 on exact
manifest,” never “global search quality” or “agent quality.”

## 12. Curiosity evaluation design derived from the track

### Adopt

1. **Graded, task-specific relevance.** Preserve the useful passage distinction
   between merely related and answer-bearing. Add separate authority,
   freshness, evidence, and safety dimensions rather than collapsing them.
2. **Full retrieval plus controlled reranking.** Measure candidate recall before
   reranker quality so improvements cannot hide a weak first stage.
3. **Pooling with diverse baselines.** Include lexical, dense, hybrid,
   source-aware, freshness-aware, and prior production runs; cap each team's
   pool contribution.
4. **Active recall search after fixed-depth pooling.** Use CAL/HiCAL-like
   selection to discover missed relevant items, but log its model and sampling
   probability.
5. **Per-topic viability gates.** Reject only by predeclared criteria and retain
   a negative-results ledger so production-hard cases are not silently erased.
6. **Immutable benchmark identity.** Corpus snapshot + topics + qrels + scorer +
   policy version, never a bare metric name.

### Adapt

For Curiosity's owned corpus, build a rights-cleared, time-versioned test set
with explicit strata: freshness, breaking changes, local/non-English, broad
research, multi-source corroboration, adversarial SEO, low-resource domains,
and no-answer needs. Judge retrieval items and end-to-end evidence separately.
Keep an access-controlled final set whose topics and qrels are not available to
the models or developers being tested.

Measure at least four layers:

```text
crawl/index: coverage, version/freshness lag, canonical and policy correctness
retrieval: recall/NCG, NDCG, unjudged rate, source/domain diversity
evidence: extraction fidelity, citation entailment, contradiction and authority
agent: task success, query/tool budget, stop correctness, failures, latency/cost
```

### Reject or defer

- Reject sparse one-positive labels as final truth.
- Reject inferred document labels where whole-document quality is the claim.
- Reject generated-query/generated-judge loops without independent human
  validation and held-out generator families.
- Defer any MS MARCO commercial, production, redistribution, or model-training
  use pending written legal clearance.

## 13. Unknowns and required checks

| Unknown / check | Why material | Owner / gate |
| --- | --- | --- |
| Written interpretation of “non-commercial research” for Curiosity | Determines whether any corpus use is allowed. | Legal/rights gate before acquisition. |
| Current asset-specific terms at actual download endpoint | Landing-page terms may change or differ. | Capture and review at access time. |
| Exact model training contamination | Determines whether “held out” or “blind” is defensible. | Model/provider disclosure; otherwise mark unknown. |
| Official checksums for every chosen topic/qrels/candidate artifact | Prevents silent version drift. | Evaluation manifest gate. |
| 2021 original versus expanded impact on Curiosity | Quantifies pool incompleteness for the new retriever. | Diagnostic only; never mix score series. |
| Curiosity unique relevant results outside qrels | Tests pool bias. | Human adjudicate a blinded sample of unjudged top results. |
| Document inference validity for Curiosity use cases | Passage containment may not equal useful source. | Independently judge whole documents. |
| Takedown synchronization and derivative deletion | Terms acknowledge third-party rights and removal. | Data governance procedure. |
| Statistical power of 76/82-topic sets | Small sets can make close differences unstable. | Paired intervals/tests and minimum effect gate. |

## 14. Bounded curiosity pass

After the main synthesis, remaining in-frame gaps were scored 1–5 for
relevance/value/novelty (higher is better) and cost (higher is worse).

| Thread | R/V/N/Cost | Action and result |
| --- | --- | --- |
| Asset-level distinction between Microsoft docs license and dataset terms | 5/5/4/1 | **Pursued.** Confirmed CC BY/MIT applies to repository docs/code while dataset terms separately restrict use [S5, S17]. |
| NIST qrels reuse posture | 5/5/3/2 | **Pursued.** NIST general pages support public reuse/attribution, but no qrels-specific license was found; retained as an explicit legal unknown [S19, S20]. |
| 2023 synthetic-query acceptance and model-family bias | 4/4/4/2 | **Pursued.** Found accepted counts, tau values, human filtering, and limited bias analysis [S11]. |
| Exact commercial interpretation for private internal evaluation | 5/5/2/5 | **CURIOSITY_NO_GO.** Public sources cannot resolve organization-specific legal interpretation; counsel/permission required. |
| Recompute qrels distributions and baseline scores | 3/3/2/4 | **CURIOSITY_NO_GO.** Would require dataset/qrels download, prohibited by task scope and unnecessary for design conclusion. |
| Reverse engineer proprietary Bing/v2 passage selector | 2/2/3/5 | **CURIOSITY_NO_GO.** Unnecessary, non-reproducible, and outside clean-room/access boundaries. |
| Survey every derived MS MARCO benchmark | 2/2/2/4 | **CURIOSITY_NO_GO.** Out of frame; does not change TREC DL rights or construct validity. |

**Stop reason:** coverage and saturation. The best additional checks resolved
the rights-layer confusion and synthetic-query caveat; remaining high-impact
questions require caller-authorized legal review or dataset execution, neither
permitted in this research task.

## 15. Source ledger

All web sources were accessed **2026-08-17**. Annual overview papers are the
official track reports hosted in the NIST TREC proceedings.

- **[S1] Microsoft, TREC 2019 Deep Learning Track Guidelines.** Tasks, v1
  records, sparse/deep labels, candidates, terms, checksums.
  https://microsoft.github.io/msmarco/TREC-Deep-Learning-2019
- **[S2] Microsoft, TREC 2020 Deep Learning Track Guidelines.** Tasks, qrel
  counts, candidates, ORCAS context, terms.
  https://microsoft.github.io/msmarco/TREC-Deep-Learning-2020
- **[S3] Microsoft, TREC 2021 Deep Learning Track Guidelines.** V2 schema and
  counts, mappings, external-data prohibitions, checksums.
  https://microsoft.github.io/msmarco/TREC-Deep-Learning-2021
- **[S4] Microsoft, TREC 2022 Deep Learning Track Guidelines.** Passage-primary
  design, inferred document labels, external-data rules.
  https://microsoft.github.io/msmarco/TREC-Deep-Learning-2022
- **[S5] Microsoft, TREC 2023 Deep Learning Track Guidelines.** Final edition,
  tasks, files, qrels, terms, documentation/code license notice.
  https://microsoft.github.io/msmarco/TREC-Deep-Learning
- **[S6] Microsoft, MS MARCO home and Terms and Conditions.** Dataset origin,
  non-commercial-research restriction, no IP grant, underlying-rights warning.
  https://microsoft.github.io/msmarco/
- **[S7] Craswell et al., Overview of the TREC 2019 Deep Learning Track.**
  NIST, TREC 2019 proceedings. https://trec.nist.gov/pubs/trec28/papers/OVERVIEW.DL.pdf
- **[S8] Craswell et al., Overview of the TREC 2020 Deep Learning Track.**
  NIST, TREC 2020 proceedings. https://trec.nist.gov/pubs/trec29/papers/OVERVIEW.DL.pdf
- **[S9] Craswell et al., Overview of the TREC 2021 Deep Learning Track.**
  NIST, TREC 2021 proceedings. https://trec.nist.gov/pubs/trec30/papers/Overview-DL.pdf
- **[S10] Craswell et al., Overview of the TREC 2022 Deep Learning Track.**
  NIST, TREC 2022 proceedings. https://trec.nist.gov/pubs/trec31/papers/Overview_deep.pdf
- **[S11] Craswell et al., Overview of the TREC 2023 Deep Learning Track.**
  NIST, TREC 2023 proceedings. https://trec.nist.gov/pubs/trec32/papers/Overview_deep.pdf
- **[S12] NIST, TREC 2019 Deep Learning data page.** Official qrels and grade
  semantics. https://trec.nist.gov/data/deep2019.html
- **[S13] NIST, TREC 2020 Deep Learning data page.** Official qrels and grade
  semantics. https://trec.nist.gov/data/deep2020.html
- **[S14] NIST, TREC 2021 Deep Learning data page.** Original, `no1`, and
  expanded qrels; non-comparability warning.
  https://trec.nist.gov/data/deep2021.html
- **[S15] NIST, TREC 2022 Deep Learning data page.** Duplicate-expanded passage
  qrels, `no1`, equivalence classes, inferred document qrels.
  https://trec.nist.gov/data/deep2022.html
- **[S16] NIST, TREC 2023 Deep Learning data page.** Official duplicate-expanded
  qrels, `no1`, and inferred document qrels.
  https://trec.nist.gov/data/deep2023.html
- **[S17] Microsoft, `msmarco` repository LICENSE and LICENSE-CODE.** CC BY 4.0
  for repository documentation/content and MIT for repository code.
  https://github.com/microsoft/msmarco/blob/master/LICENSE and
  https://github.com/microsoft/msmarco/blob/master/LICENSE-CODE
- **[S18] NIST / `usnistgov`, `trec_eval`.** Current NIST release page,
  repository `LICENSE.md`, and source help/header; unjudged handling, `-l`,
  `-c`, and `-J` semantics.
  https://trec.nist.gov/trec_eval/index.html,
  https://github.com/usnistgov/trec_eval/blob/main/LICENSE.md, and
  https://github.com/usnistgov/trec_eval/blob/main/trec_eval.c
- **[S19] NIST, Copyrights & Disclaimers.** Public-information and data
  disclaimer. https://www.nist.gov/copyrights-disclaimers
- **[S20] NIST, Copyright, Fair Use, and Licensing Statements for SRD, Data,
  Software, and Technical Series Publications.** Non-SRD NIST data reuse,
  foreign rights, attribution, and extramural caveats.
  https://www.nist.gov/open/license

### Confidence summary

- **High:** task definitions, corpus/topic/qrel counts, relevance scales,
  annual drift, 2021 completeness problem, 2022/2023 inferred-document design,
  official qrels selection, Microsoft dataset terms.
- **Medium:** general NIST reuse rules as applied specifically to these qrels;
  representativeness consequences of proprietary corpus selection.
- **Low/unknown:** organization-specific commercial-use interpretation,
  foundation-model contamination, foreign/underlying page rights, and exact
  fairness magnitude. None should be converted into an affirmative claim
  without the checks above.
