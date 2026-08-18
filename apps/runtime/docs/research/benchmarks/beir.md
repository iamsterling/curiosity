# BEIR as a standalone retrieval evaluation suite

**Research date:** 2026-08-17  
**Decision frame:** whether, and under what gates, Curiosity may use BEIR as an
offline evaluation suite. BEIR is assessed as a benchmark and data/evaluation
bundle, **not** as a product, hosted service, or production dependency.  
**Method boundary:** public papers, repositories, dataset pages, and license or
terms pages only. No dataset was downloaded, no benchmark was run, and no
private endpoint or model was inspected.

Labels used below: **FACT** is directly supported by a cited source;
**INFERENCE** is a bounded conclusion from facts; **RECOMMENDATION** is a
Curiosity control; **UNKNOWN** was not established. Confidence is high, medium,
or low. Rights descriptions are issue-spotting, not legal advice.

## 1. Decision and bounded questions

**Verdict — ADOPT, gated (high confidence):** adopt the *evaluation pattern*
and a rights-cleared subset of BEIR for offline regression and retrieval-stage
diagnosis. Do not adopt a single BEIR average as a release criterion, do not
call a result “zero-shot” without a model/data provenance check, and do not
assume the Apache-2.0 software license covers any constituent dataset.

Bounded questions:

1. What exactly belongs to the canonical English suite, and what does it test?
2. Which metrics and aggregation choices are comparable?
3. What rights attach to the framework and to each data component?
4. How far can “zero-shot,” reproducibility, and generalization claims travel?
5. Which contamination, language/domain, and judgment biases matter to
   Curiosity?
6. Which exact Curiosity evaluations are permissible, and what blocks them?

Out of frame: downloading data, executing models, choosing production ranking
architecture, legal clearance, and reproducing proprietary model internals.

## 2. Identity, scope, and current state

- **FACT (high):** The 2021 BEIR paper defines 18 English zero-shot test
  datasets across nine retrieval tasks. MS MARCO is reported alongside them as
  an in-domain passage-retrieval dataset but is excluded from the paper's
  zero-shot aggregate because most evaluated models were trained on it [S1,
  §§3–5].
- **FACT (high):** The current repository README describes 17 preprocessed
  benchmark datasets, while its table lists 19 rows including MS MARCO and the
  three non-public-to-BEIR archives BioASQ, Signal-1M, TREC-NEWS, and Robust04.
  This is not a stable count unless “canonical 18,” “downloadable subset,” and
  “MS MARCO in-domain row” are distinguished [S2].
- **FACT (high):** Code release v2.2.0 (2025-06-04) is the latest GitHub release
  observed. The inspected `main` head was commit
  `ef83d29307061c65d04b035b4f4e7c18bd8374af` (2025-10-16). The package declares
  Python >=3.9 and version 2.2.0 [S3–S5].
- **FACT (high):** BEIR software is Apache-2.0; the README expressly disclaims
  that this grants rights to datasets and assigns permission checking to the
  user [S2, S6].
- **INFERENCE (high):** “BEIR score” is underspecified without dataset set,
  corpus/qrels version, preprocessing, metric, model checkpoint, retrieval
  depth, and implementation. Curiosity must name all of them.

## 3. Canonical constituent datasets and tasks

Counts below are the canonical paper/README test view; they are descriptive,
not a fresh integrity check. `Rel/Q` is mean relevant documents per query.

| Task | Dataset (BEIR name) | Test queries / corpus / Rel-Q | Relevance | What the retrieval task operationalizes |
|---|---|---:|---|---|
| In-domain passage retrieval (not in zero-shot 18) | MS MARCO (`msmarco`) | 6,980 / 8.84M / 1.1 | binary | rank web passages for short Bing-derived queries |
| Biomedical IR | TREC-COVID (`trec-covid`) | 50 / 171K / 493.5 | 3-level | COVID scientific literature retrieval |
| Biomedical IR | NFCorpus (`nfcorpus`) | 323 / 3.6K / 38.2 | 3-level | nutrition/medical information retrieval |
| Biomedical IR | BioASQ (`bioasq`) | 500 / 14.91M / 4.7 | binary | retrieve biomedical articles for expert questions |
| Question answering | Natural Questions (`nq`) | 3,452 / 2.68M / 1.2 | binary | retrieve Wikipedia passages answering questions |
| Question answering | HotpotQA (`hotpotqa`) | 7,405 / 5.23M / 2.0 | binary | retrieve multi-hop Wikipedia evidence |
| Question answering | FiQA-2018 (`fiqa`) | 648 / 57K / 2.6 | binary | retrieve financial answers |
| Tweet retrieval | Signal-1M RT (`signal1m`) | 97 / 2.86M / 19.6 | 3-level | retrieve tweets for news topics |
| News retrieval | TREC-NEWS (`trec-news`) | 57 / 595K / 19.6 | 5-level | background/linking retrieval over news |
| News retrieval | Robust04 (`robust04`) | 249 / 528K / 69.9 | 3-level in BEIR | ad-hoc retrieval over licensed news/government archives |
| Argument retrieval | ArguAna (`arguana`) | 1,406 / 8.67K / 1.0 | binary | retrieve the paired counterargument |
| Argument retrieval | Touché-2020 (`webis-touche2020`) | 49 / 382K / 19.0 | 3-level | retrieve conversational arguments |
| Duplicate questions | CQADupStack (`cqadupstack`) | 13,145 / 457K / 1.4 | binary | retrieve duplicates in 12 StackExchange forums |
| Duplicate questions | Quora (`quora`) | 10,000 / 523K / 1.6 | binary | retrieve duplicate questions |
| Entity retrieval | DBpedia-Entity (`dbpedia-entity`) | 400 / 4.63M / 38.2 | 3-level | retrieve entities described by keyword queries |
| Citation prediction | SCIDOCS (`scidocs`) | 1,000 / 25K / 4.9 | binary | retrieve papers likely to be cited |
| Fact checking | FEVER (`fever`) | 6,666 / 5.42M / 1.2 | binary | retrieve Wikipedia evidence for claims |
| Fact checking | Climate-FEVER (`climate-fever`) | 1,535 / 5.42M / 3.0 | binary | retrieve Wikipedia evidence for climate claims |
| Fact checking | SciFact (`scifact`) | 300 / 5.2K / 1.1 | binary | retrieve scientific abstracts supporting/refuting claims |

**Sources and confidence:** high for canonical values and task construction
from the original paper Table 1 and Appendix D [S1], triangulated against the
current README table [S2]. The 2024 resources paper instead reports 4,681
Climate-FEVER queries in its Table 1, versus 1,535 in the original BEIR paper
and current README [S7]. **UNKNOWN:** whether this is a different query subset,
an error, or later preprocessing; Curiosity must not mix those score lines.

The original suite is unusually heterogeneous in query length, corpus size,
document form, relevance density, and annotation process. That is valuable for
stress testing but means rows are not exchangeable samples from Curiosity's
traffic distribution.

## 4. Metrics and interpretation

- **FACT (high):** The original benchmark's common headline metric is
  nDCG@10, computed with the TREC evaluation interface. The paper chose nDCG
  because it is rank-aware and supports binary and graded relevance [S1, §3.3].
- **FACT (high):** Current BEIR code computes nDCG, MAP, recall, and precision
  at caller-provided cutoffs; custom metrics include MRR, capped recall,
  Hole@k, and top-k accuracy. Default cutoffs are 1, 3, 5, 10, 100, and 1000.
  By default it removes a result whose document ID equals the query ID [S8].
- **FACT (high):** The 2024 reference paper standardizes reporting on
  nDCG@10 and Recall@100 and macro-averages dataset scores, but explicitly says
  the single average is deficient and can hide large per-dataset losses [S7,
  §§2,4].
- **INFERENCE (high):** nDCG@10 is useful for an end-user top-results view;
  Recall@100 (or a Curiosity-selected candidate depth) is more relevant to the
  first-stage retriever's reranking ceiling. Neither measures answer
  correctness, citation faithfulness, source authority, freshness, latency,
  index cost, or safety.
- **RECOMMENDATION (high):** report every dataset separately, plus task-family
  aggregates and paired deltas against a pinned BM25/hybrid baseline. Add
  confidence intervals or a paired randomization/bootstrap test; do not gate
  on a naked macro-average. The very small query sets (49–57 for several TREC
  rows) make point-estimate movement particularly unstable.
- **RECOMMENDATION (high):** preserve the exact relevance scale and qrels;
  never silently binarize graded labels. Record the evaluator and whether
  identical query/document IDs were removed.

## 5. Rights are per component, not inherited from BEIR

**Controlling rule (high confidence):** Apache-2.0 applies to BEIR software,
not the corpora, queries, or qrels [S2, S6]. A green “public” download indicator
means reachable, not commercially reusable. The original paper's Appendix E is
useful provenance but is not itself a license grant; it reported no license for
NFCorpus, FiQA, Quora, or Climate-FEVER [S1, Appendix E].

| Component | Rights evidence observed | Curiosity disposition before any acquisition |
|---|---|---|
| BEIR code/evaluator | Apache-2.0 repository license [S6] | **ADOPT** with notice/attribution; pin version and dependencies |
| MS MARCO | Current Microsoft terms: non-commercial research only, no IP license extended, underlying-document rights may be absent [S9] | **REJECT** for commercial/product evaluation unless counsel obtains separate permission; it is not in the canonical zero-shot average |
| TREC-COVID | BEIR paper says “Dataset License Agreement”; collection fixes the 2020-07-16 CORD-19 release and NIST qrels [S1, S10] | **DEFER** pending the exact CORD-19 snapshot agreement and article-level rights; NIST topics/qrels do not clear papers |
| NFCorpus | No license reported by BEIR paper [S1] | **DEFER** until owner terms are captured and approved |
| BioASQ | Copyrighted archive and no BEIR-hosted download; reproduction instructions require source acquisition [S1, S2] | **DEFER** pending BioASQ/PubMed access and permitted-use review; never redistribute source abstracts by assumption |
| Natural Questions | BEIR paper reports CC BY-SA 3.0; corpus derives from Wikipedia [S1] | **DEFER** until the exact annotation license, Wikipedia snapshot/license, attribution, and share-alike treatment are recorded |
| HotpotQA | BEIR paper reports CC BY-SA 4.0; Wikipedia-derived [S1] | **DEFER** pending exact snapshot and attribution/share-alike plan |
| FiQA-2018 | No license reported by BEIR paper [S1] | **DEFER**; public availability is insufficient |
| Signal-1M (RT) | BEIR paper reports CC BY-SA 3.0, but BEIR does not distribute it and the content is tweets [S1, S2] | **DEFER/likely no-go** until X/Twitter content and redistribution terms plus hydration/deletion obligations are cleared |
| TREC-NEWS | Copyrighted collection, unavailable in BEIR bundle [S1, S2] | **DEFER** until the Washington Post/TREC collection is legitimately licensed |
| Robust04 | Copyrighted TREC disks; NIST identifies Financial Times, Federal Register, FBIS, and LA Times sources [S11] | **DEFER** until disks/source rights are legitimately held; no copying from another lab |
| ArguAna | BEIR paper reports CC BY 4.0 [S1] | **ADAPT** only after validating license attachment to the exact transformed corpus and retaining attribution |
| Touché-2020 / args.me | BEIR paper reports CC BY 4.0; BEIR also alters original negative qrels to zero [S1, Appendix D/E] | **ADAPT** with exact corpus/qrels version, attribution, and modification notice |
| CQADupStack | BEIR paper reports Apache-2.0 [S1] | **DEFER** until exact archive license and StackExchange post attribution/CC terms are reconciled |
| Quora | No license reported by BEIR paper [S1] | **REJECT by default** absent written terms permitting Curiosity's use; do not infer rights from a download |
| DBpedia-Entity | BEIR paper reports CC BY-SA 3.0; Wikipedia/DBpedia-derived [S1] | **ADAPT** after attribution/share-alike and snapshot review |
| SCIDOCS | BEIR paper reports GPL-3.0; current source repository license inspected was CC BY 4.0, showing provenance/version drift [S1, S12] | **DEFER** until exact BEIR artifact and all paper metadata/abstract rights are mapped; do not assume a code-repo license clears paper text |
| FEVER | BEIR paper reports CC BY-SA 3.0; Wikipedia-derived [S1] | **ADAPT** after exact snapshot, attribution, and share-alike review |
| Climate-FEVER | No license reported by BEIR paper; Wikipedia-derived [S1] | **DEFER** pending annotation license and exact FEVER/Wikipedia corpus rights |
| SciFact | BEIR paper reports CC BY-NC 2.0; scientific abstracts [S1] | **REJECT** for commercial evaluation absent separate permission; separately clear underlying abstracts |

**Negative result retained:** public primary license text was not found during
this bounded pass for every transformed BEIR archive, and license labels in the
2021 paper are sometimes ambiguous or conflict with current source repos.
Therefore no row marked DEFER is cleared by this report. The BEIR README itself
warns that it does not vouch for permission [S2].

## 6. “Zero-shot” claim limits and contamination

### What the claim did mean

- **FACT (high):** In the original experiment, “zero-shot” meant applying a
  pretrained retrieval system to a target task/domain without target training
  data. The paper evaluated mostly MS-MARCO-trained models and excluded MS
  MARCO from the 18-dataset zero-shot aggregate [S1].
- **FACT (high):** This was never a claim of no semantic overlap. DPR had been
  trained on NQ among four QA datasets; the paper marks its NQ result as
  in-domain. Only 8 of 19 listed datasets had train data, and the paper notes
  that training provenance differs by model [S1, §§3–4].

### Why a 2026 model may not be zero-shot

- **INFERENCE (high):** BEIR corpora, queries, qrels, papers, leaderboards, and
  converted archives have been public for years. A post-2021 foundation model
  or embedding model trained on unspecified web/repository data may have seen
  test queries, relevant documents, qrels, or score tables. “No fine-tuning by
  Curiosity” does not establish zero exposure.
- **FACT (high):** The 2024 paper documents copied score tables, evaluation on
  partially overlapping subsets, and a stale spreadsheet before creation of a
  standardized leaderboard [S7, §§1,6]. This supports a comparison-provenance
  risk; it does not prove training contamination.
- **FACT (high):** Some task content intrinsically overlaps common pretraining
  sources: Wikipedia (NQ, HotpotQA, DBpedia, FEVER, Climate-FEVER), web Q&A
  (Quora/StackExchange), news, tweets, and scientific abstracts [S1].
- **UNKNOWN (high-impact):** For opaque third-party checkpoints/APIs, exact
  exposure to BEIR queries, labels, or documents is generally not auditable
  from the suite. No repository mechanism was found that certifies model
  training-data non-overlap.

### Required contamination protocol

**RECOMMENDATION (high):** classify every result before publication:

1. **Target-supervised:** any target queries/qrels used for training, mining,
   prompt selection, thresholding, or model choice.
2. **Benchmark-tuned:** BEIR test performance used iteratively for architecture,
   prompt, fusion weight, checkpoint, or hyperparameter selection.
3. **Provenance-clean zero-shot:** frozen before access; training corpus dates
   and manifests support no target qrel/query exposure; only global protocol
   choices fixed independently.
4. **Exposure-unknown:** no target tuning by Curiosity, but upstream training
   data are undisclosed. This is the honest default for opaque modern models.

Keep a sealed final run, log all prior benchmark contacts, hash query/qrel
manifests, and report suspected source overlap. Do not convert
“exposure-unknown” into “zero-shot.” If a model has already been selected on
public BEIR performance, BEIR can still be a regression check but not an
independent selection test.

## 7. Bias, leakage, and external-validity limits

- **FACT (high): pooled-label bias.** Unjudged documents are generally treated
  as nonrelevant. The original paper found much higher TREC-COVID Hole@10 for
  several dense systems than lexical systems and manually judging 980 holes
  materially improved dense-system nDCG@10. It attributes this to lexical
  selection bias in pools [S1, §6]. A novel Curiosity retriever can therefore
  be penalized for retrieving relevant but unjudged items.
- **FACT (high): shallow/small rows.** The 2024 paper highlights Touché's 49
  queries, shallow top-5 pools, likely lexical bias, and very different task;
  it also notes that an average hides row-level failures [S7, §4].
- **FACT (high): source/task artifacts.** ArguAna has exactly one paired
  counterargument per query; fact-check rows seek evidence, not general web
  relevance; citation prediction measures citation linkage; duplicate-question
  rows are near-duplicate detection. These are not interchangeable with open
  web search [S1, Appendix D].
- **FACT (high): English bias.** The canonical 18 are English. The BEIR wiki
  separately lists multilingual conversions/collections (Mr. TyDi, mMARCO,
  GermanQuAD, ViHealthQA); these are extensions, not evidence that the canonical
  suite tests multilingual retrieval [S13].
- **INFERENCE (high): Western/institutional skew.** Wikipedia, English-language
  news, StackExchange/Quora, scientific publishing, and TREC dominate. The
  suite weakly represents low-resource languages, local search intent,
  non-Western web ecosystems, commerce, navigational search, current events,
  adversarial SEO/spam, freshness, and multimedia.
- **FACT (high): static snapshots.** TREC-COVID's official complete collection
  fixes the 2020-07-16 CORD-19 snapshot; NIST warns that qrels differ across
  rounds and that some cross-round train/test comparisons are invalid [S10].
- **INFERENCE (high):** BEIR cannot validate Curiosity's live freshness,
  recrawl policy, deduplication, rights deletion, language coverage, source
  trust, or answer synthesis. Those need separate owned tests.

## 8. Reproducibility and versioning contract

The suite improves format-level reproducibility (`corpus.jsonl`,
`queries.jsonl`, `qrels/*.tsv`) and publishes archive MD5s in the README [S2].
The 2024 work adds reproducible Pyserini reference runs and standardizes
nDCG@10/Recall@100 [S7, §5]. These are useful, but insufficient alone.

**RECOMMENDATION (high):** each Curiosity run record must include:

- canonical dataset name plus upstream owner, exact split, archive URL,
  owner-license snapshot, BEIR archive MD5, and Curiosity SHA-256;
- BEIR release/tag and commit; evaluator package and dependency lock;
- corpus/query/qrel counts and hashes after transformation;
- model/provider/checkpoint digest, tokenizer, query/document prompt, maximum
  length/truncation, title-body handling, normalization and similarity;
- exact versus ANN search, index/library/version, random seeds, retrieval depth,
  reranker candidate depth, hardware, and deterministic settings;
- metric cutoffs, relevance mapping, identical-ID rule, missing-query handling,
  per-query run file, per-dataset scores, and uncertainty test;
- rights decision, access date, retention/deletion obligations, contamination
  class, and every parameter selected after seeing benchmark results.

**No comparability without normalization (high confidence):** the original
paper truncated neural documents to 512 wordpieces; BM25 title/body field
handling and analyzer choices affect results; Touché has a later “v2” score line;
and current BEIR code can differ from original Elasticsearch/Anserini/Pyserini
setups [S1, §4; S7, §§3,7; S8]. Reproducing a score requires the implementation
contract, not merely the dataset name.

## 9. Permissible clean-room evaluation

**RECOMMENDATION (high):** a clean-room Curiosity evaluation is permissible
only when all of the following hold:

1. Legal/provenance reviewers approve each exact dataset artifact for the
   intended entity, commercial context, storage, processing, and output use.
2. Data are acquired from the owner/authorized channel—not copied from another
   lab—and stored in an access-controlled evaluation environment.
3. BEIR code is obtained under Apache-2.0 with notices; dataset licenses,
   attribution, share-alike/noncommercial limits, and deletion obligations are
   tracked separately.
4. The frozen Curiosity system receives only queries and authorized corpus
   fields. It receives no qrels, test answers, paired positives, leaderboard
   scores, or prior run labels at retrieval time.
5. Evaluation joins run IDs to qrels after retrieval in a separate harness.
   Per-query text and retrieved content are not sent to a third-party API unless
   both data rights and provider retention/training terms permit it.
6. The run is offline, bounded, non-production, and non-redistributive. Publish
   aggregate metrics/run metadata only unless redistribution rights expressly
   cover documents, queries, qrels, and run snippets.
7. Any adaptation or repeated model selection changes the contamination class;
   reserve an untouched, independently rights-cleared Curiosity holdout for the
   final decision.

This is behavioral evaluation, not reverse engineering: do not inspect private
model internals, infer proprietary training records from outputs, or copy third-
party implementation details beyond their license.

## 10. Exact Curiosity uses and no-go gates

| Curiosity use | Verdict | Required measure / interpretation | Gate |
|---|---|---|---|
| Candidate-retriever regression on rights-cleared BEIR rows | **ADOPT** | Recall@100/selected depth, nDCG@10, latency and index cost reported separately | frozen manifests and BM25/hybrid baseline |
| Reranker regression | **ADOPT** | nDCG@10 plus delta from the same frozen candidate set | candidate depth and candidate IDs identical |
| Lexical-vs-semantic failure analysis | **ADOPT** | row/query-level deltas, Hole@k and manual review only on text whose review is licensed | do not treat unjudged as proven irrelevant in conclusions |
| Task/domain robustness smoke test | **ADOPT** | per-row and task-family results | no single aggregate gate |
| Architecture selection | **ADAPT** | BEIR may be development evidence; final choice requires untouched Curiosity holdout | label benchmark-tuned, not zero-shot |
| Provider/API comparison | **DEFER** | same frozen inputs and protocol | dataset rights must permit transmission; provider must prohibit retention/training as required |
| Multilingual quality claim | **REJECT** from canonical BEIR | separate native-language suite | translated/multilingual extensions need independent rights and validity review |
| Live web-search quality/freshness claim | **REJECT** | owned, time-stamped web-search benchmark | BEIR is static corpus retrieval |
| RAG answer correctness/citation claim | **REJECT** | answer-level factuality, citation support, safety suite | retrieval metrics are insufficient |
| Production-release approval from macro-average alone | **REJECT** | per-domain floors plus owned workload/SLO tests | no row may be hidden by average gains |
| Commercial use of NC/research-only/unclear rows | **REJECT** | none until permission/counsel approval | includes MS MARCO and SciFact by default |
| Public redistribution of BEIR bundle or examples | **REJECT by default** | component-by-component grant and attribution | Apache-2.0 code license is not data clearance |
| “Zero-shot” marketing claim for opaque post-2021 model | **REJECT** | use “no Curiosity target tuning; upstream exposure unknown” | provenance-clean evidence required |

### Mandatory stop gates

Stop before acquisition or execution if any applies:

- exact artifact license/terms, upstream provenance, or commercial-use right is
  missing, conflicting, noncommercial, research-only, or source-restricted;
- provider transmission, retention, model-training, confidentiality, or
  deletion treatment is unresolved;
- corpus/qrel checksum or split differs from the declared benchmark line;
- model/checkpoint/training exposure cannot support the proposed “zero-shot”
  wording;
- test qrels informed tuning without the run being reclassified;
- comparison uses different subsets, preprocessing, candidate depths, or
  evaluator semantics;
- the decision depends only on macro-average, or on a row with too few queries
  without uncertainty/error analysis;
- requested output would redistribute restricted text, queries, qrels, or
  identifiable user content.

## 11. Unknowns and bounded checks

| Unknown | Impact | Required check before use |
|---|---|---|
| Exact current license of each transformed BEIR archive | critical | owner-source license/terms capture, artifact-to-license mapping, counsel/provenance approval |
| Climate-FEVER 1,535 vs 4,681 query discrepancy | high | compare pinned qrels/manifests and score protocol without mixing results |
| Current availability/terms for BioASQ, Signal-1M, TREC-NEWS, Robust04 | high | acquire only through authorized owner channel and record agreement |
| Opaque model exposure to public BEIR data | high | model-card/training-manifest review; otherwise classify exposure-unknown |
| Statistical significance of a proposed Curiosity delta | high | preregister paired test and minimum meaningful effect before execution |
| Relevance of BEIR row mix to Curiosity traffic | high | map an owned query taxonomy and weight only in a separately labeled analysis |
| Personally identifiable/deleted user content in social/Q&A rows | high | privacy, platform-terms, deletion, and retention review |
| Official leaderboard's current operational status | low for offline use | verify only if submission is later authorized; not needed for suite adoption |

## 12. Curiosity pass and rejected threads

Scoring is **relevance/value/novelty/cost**, each 1–5. Pursued only the best
in-frame contradiction: the constituent-count/version drift and the
Climate-FEVER query-count mismatch, because both directly affect comparable
score claims. Coverage then saturated for this document-only decision.

| Thread | Score | Disposition |
|---|---:|---|
| Resolve exact licenses by accepting/downloading every archive | 5/5/2/5 | **CURIOSITY_NO_GO:** user prohibited downloads; acceptance may create obligations; legal/provenance gate retained |
| Run models to reproduce headline scores | 4/4/2/5 | **CURIOSITY_NO_GO:** no execution authority and rights are not cleared |
| Audit opaque model training corpora | 5/4/3/5 | **CURIOSITY_NO_GO:** unavailable for proprietary models; use exposure-unknown classification |
| Reconstruct deprecated leaderboard history | 2/2/2/4 | **CURIOSITY_NO_GO:** does not change benchmark suitability; current score provenance is enough |
| Download rows and detect verbatim contamination | 4/4/3/5 | **CURIOSITY_NO_GO:** prohibited data acquisition and no model-training corpus to compare |
| Determine jurisdiction-specific copyright outcome | 5/5/3/5 | **CURIOSITY_NO_GO:** counsel task requiring exact entity, location, artifact, and use facts |
| Reverse engineer proprietary rankers from BEIR outputs | 1/1/2/5 | **CURIOSITY_NO_GO:** unnecessary, unreliable, and outside clean-room boundary |

## 13. Confidence summary

| Finding | Confidence | Basis |
|---|---|---|
| Canonical suite structure, tasks, original metrics | high | original peer-reviewed benchmark paper plus current repository |
| Software license/version behavior | high | repository license, release API, package metadata, evaluator source |
| Per-component rights are heterogeneous and not inherited | high | BEIR disclaimer, paper Appendix E, owner terms examples |
| Any specific DEFER row is commercially usable | low/unknown | exact current owner grant and transformed-artifact mapping not established |
| Macro-average is insufficient | high | 2024 BEIR resources paper and heterogeneous row construction |
| Modern opaque model is contamination-free | unknown | no auditable training manifest; public exposure is plausible, not proven |
| Canonical BEIR supports multilingual/live-web/RAG claims | high confidence that it does not | canonical English static retrieval scope and metrics |

## Sources

All sources were accessed **2026-08-17**. Primary benchmark papers,
repositories, and owner/organizer pages were preferred.

- **[S1]** Thakur et al., *BEIR: A Heterogeneous Benchmark for Zero-shot
  Evaluation of Information Retrieval Models*, NeurIPS 2021, arXiv v4.
  <https://arxiv.org/html/2104.08663>
- **[S2]** BEIR repository README (datasets, hashes, disclaimer, current
  examples). <https://github.com/beir-cellar/beir/blob/main/README.md>
- **[S3]** BEIR GitHub release v2.2.0.
  <https://github.com/beir-cellar/beir/releases/tag/v2.2.0>
- **[S4]** BEIR `main` commit inspected.
  <https://github.com/beir-cellar/beir/commit/ef83d29307061c65d04b035b4f4e7c18bd8374af>
- **[S5]** BEIR package metadata (`pyproject.toml`).
  <https://github.com/beir-cellar/beir/blob/main/pyproject.toml>
- **[S6]** BEIR software license, Apache License 2.0.
  <https://github.com/beir-cellar/beir/blob/main/LICENSE>
- **[S7]** Kamalloo et al., *Resources for Brewing BEIR: Reproducible
  Reference Models and an Official Leaderboard*, SIGIR 2024 / arXiv.
  <https://arxiv.org/html/2306.07471>
- **[S8]** BEIR current evaluation source.
  <https://github.com/beir-cellar/beir/blob/main/beir/retrieval/evaluation.py>
- **[S9]** Microsoft, MS MARCO terms and dataset page.
  <https://microsoft.github.io/msmarco/>
- **[S10]** NIST, TREC-COVID data and version guidance.
  <https://ir.nist.gov/covidSubmit/data.html>
- **[S11]** NIST, TREC 2004 Robust Track collection/guidelines.
  <https://trec.nist.gov/data/robust/04.guidelines.html>
- **[S12]** AllenAI, SCIDOCS repository license observed as CC BY 4.0.
  <https://github.com/allenai/scidocs/blob/master/LICENSE>
- **[S13]** BEIR wiki, multilingual datasets (extensions outside canonical
  English 18).
  <https://github.com/beir-cellar/beir/wiki/Multilingual-datasets>
