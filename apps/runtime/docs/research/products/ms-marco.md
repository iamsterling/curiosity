# MS MARCO dataset and benchmark: clean-room evaluation and rights review

**Research date / source access date:** 2026-08-17  
**Subject:** Microsoft MAchine Reading COmprehension (MS MARCO), principally the question-answering data, ranking v1/v2 corpora, MS MARCO leaderboards, and TREC Deep Learning uses  
**Method:** Public Microsoft pages/repositories, published papers, and NIST/TREC materials only. No dataset was downloaded, no endpoint or access control was tested, and no corpus text, labels, or implementation was copied.  
**Legal posture:** This is technical and rights-risk research, not legal advice. “Permissible” below means a candidate posture for counsel/data-governance review, not a legal conclusion.

## Decision frame

**Decision:** May Curiosity use MS MARCO to evaluate or develop an owned commercial search system, and which benchmark lessons can be adopted without importing its data or rights risk into production?

Bounded sub-questions:

1. What are the actual tasks, corpora, queries, labels, versions, and metrics behind the overloaded “MS MARCO” name?
2. Which construction choices create sampling, judgment, staleness, leakage, and reproducibility bias?
3. What permission does Microsoft actually state for the datasets, as distinct from repository documentation and code?
4. What rights remain with publishers of the underlying web documents, and what does that imply for training, fixtures, redistribution, and production?
5. What, if anything, could Curiosity evaluate with under a separately approved, non-production research protocol?

Labels used below: **FACT** = directly supported by cited evidence; **INFERENCE** = reasoned consequence; **RECOMMENDATION** = proposed Curiosity action; **UNKNOWN** = not established. Confidence is High / Medium / Low.

## Executive verdict

**RECOMMENDATION (High): REJECT MS MARCO data for Curiosity production, production training, shipped fixtures, and routine commercial CI.** Microsoft's current terms say the datasets are intended **only for non-commercial research**, are supplied “without extending any license or other intellectual property rights,” may contain documents whose underlying rights Microsoft does not own, and terminate use rights automatically on violation. Microsoft specifically directs users considering dataset or research-output use in products or services to independent legal review. The CC BY 4.0 and MIT files in the website repository apply to repository documentation/content and code respectively; they do **not** convert the datasets or copied publisher text into CC-BY/MIT material.[S1][S2][S3]

**RECOMMENDATION (High): DEFER even internal evaluation or tiny copied fixtures until written legal/data-governance approval defines “non-commercial research,” the authorized artifacts, storage, access, deletion, publication, and model-output disposition.** A commercial entity's internal benchmark may or may not qualify; the public terms do not define “non-commercial,” “research,” model weights, derived labels, or evaluation in product development. Do not resolve that ambiguity in Curiosity's favor.[S1][S2]

Technically, MS MARCO remains useful as a **historical research benchmark**, not a production acceptance test. Its scale enabled neural IR work, but the canonical ranking labels are shallow answer-support labels, usually one positive per query, derived from passages shown by Bing. Ranking v1's corpus was itself formed using all train/dev/eval queries; its passage-document relation could leak test-query selection. Ranking v2 is larger and structurally cleaner, but reuses labels mapped across later web snapshots and has documented false-positive/false-negative and judgment-completeness concerns. Public dev/TREC labels, repeated leaderboard iteration, unofficial title-augmented corpora, and possible modern-model pretraining exposure further weaken claims of blind generalization.[S4][S5][S6][S7][S8]

**Overall confidence:** High on the public terms, corpus construction, published sizes, official task rules, and principal metrics; Medium on the practical interpretation of product-adjacent internal research; Low/unknown on publisher-by-publisher rights, model contamination, personal-data residue, and any private permission Microsoft might grant.

## What “MS MARCO” denotes

### Original QA/NLG family

- **FACT (High):** The 2018 dataset paper describes 1,010,916 anonymized questions sampled from Bing search logs; 8,841,823 passages extracted from 3,563,535 web documents; and 182,669 fully rewritten, well-formed answers. Questions may have multiple answers or no answer.[S4]
- **FACT (High):** For each query, editors saw up to ten Bing-retrieved passages, marked passages used as support (`is_selected`), and composed an answer from the supplied evidence. The paper expressly says support annotations were not required to be exhaustive.[S4]
- **FACT (High):** The released components include queries, passages, answers, well-formed answers, question/answer-type segments, URLs, titles, and extracted document bodies. Documents were fetched in a later processing step; roughly 300,000 could no longer be retrieved and surviving page content could have changed.[S4]
- **FACT (High):** The public site records a naming sequence that is easy to confuse with ranking versions: QA v1.0 (100,000 pairs), v1.1, QA/NLG v2.0, then v2.1 (over one million queries and about 182,000 well-formed answers). It also records that v2.1 moved evaluation examples whose answers overlapped older/rewrite sets into training.[S1]
- **FACT (High):** QA and NLG leaderboards used answer-overlap metrics including ROUGE-L and BLEU-1 and were closed in 2020; the data remained hosted. These are separate from passage/document ranking leaderboards.[S1][S4]
- **FACT (High):** The current official site marks the v1 passage and document retrieval leaderboards retired on 2023-01-01, while still presenting the datasets as downloadable after terms acceptance. The historical benchmark remains reusable research data, but it is not an actively maintained production-quality certification service.[S1]

### Query distribution is real but deliberately narrow

- **FACT (High):** Queries originated in anonymized Bing/Cortana logs, but automatic filtering selected question-like, short-answer information needs. Navigational and other intents were excluded.[S4]
- **FACT (High):** The TREC 2021 overview adds that non-English and adult/offensive queries were removed and that the retained set came from the estimated 10–20% of English queries potentially answerable with a short passage. The intended exclusions included navigational, long-answer, and transactional queries. About 35% still could not be answered from the ten shown passages.[S6]
- **INFERENCE (High):** “Real queries” does not mean representative web search traffic. The set is English, Bing-era, safe-filtered, question/short-answer heavy, and conditioned on Bing's answerability classifier and retrieval stack. It is a poor standalone proxy for Curiosity's navigational, exploratory, multilingual, freshness, safety, local, or transactional workloads.

## Ranking benchmark reconstruction

### Ranking v1: passage task

- **FACT (High):** Ranking v1 takes the union of the up-to-ten passages shown for the original million queries, yielding 8,841,823 distinct passages. The associated query file has 1,010,916 queries: 808,731 train, 101,093 dev, and 101,092 eval.[S5]
- **FACT (High):** Public qrels contain 532,761 train and 59,273 full-dev positive pairs. The commonly used small dev set is about 6,980 queries with 7,437 positive pairs; the official eval/test labels were withheld for leaderboard evaluation.[S1][S5][S8]
- **FACT (High):** A positive means an editor used/marked the passage while answering from the original top-ten evidence. Unmarked passages and BM25 negatives were not necessarily judged nonrelevant. The official description explicitly warns that negatives may be false negatives and that not all top-1000 candidates were seen by a judge.[S4][S5]
- **FACT (High):** Two subtasks were defined: full retrieval from 8.8 million passages and reranking an official BM25 candidate set (historically top 1,000). The official passage leaderboard metric is MRR@10.[S1][S5]
- **FACT (High):** Distributed convenience files include almost 398 million query-positive-negative triples. Their “negative” member means not marked relevant under this sparse process, not adjudicated irrelevant.[S5]

### Ranking v1: document task

- **FACT (High):** Full documents were fetched in March 2018 from about 3.5 million source URLs associated with the earlier passages; only 3,213,835 documents remained. The document corpus includes URL, title, and extracted body.[S5][S6]
- **FACT (High):** Passage positives were projected to their source documents. The official v1 document ranking files list 367,013 training queries/384,597 qrels, 5,193 dev queries/5,478 qrels, and 5,793 leaderboard test queries. Full retrieval returned up to 100 documents; reranking used an official top 100.[S5]
- **FACT (High):** The historical document leaderboard used MRR@100, while the passage leaderboard used MRR@10.[S7]
- **INFERENCE (High):** A document qrel is not an independent whole-document relevance judgment. It inherits an answer-support decision made on an earlier passage, then applies that decision to a separately fetched and parsed page that may have changed.

### Ranking v1 corpus construction leakage

- **FACT (High):** Every v1 passage/document entered the corpus because Bing retrieved it for one of the million original queries, including potential test queries. On average only 2.8 passages per document were present. Organizers therefore forbade use/reconstruction of the v1 passage-document mapping because knowing which passage had been selected from a document could reveal query-dependent information unavailable in a realistic query-independent corpus.[S6]
- **FACT (High):** Official ranking rules also prohibited using original QA/NLG data in ranking submissions because it reveals construction signals; only listed ranking artifacts were allowed. External information was otherwise reportable/allowed under task rules.[S5]
- **INFERENCE (High):** This is **benchmark leakage by corpus design**, not evidence that individual test labels were directly published. It can inflate ecological validity: a full-corpus retriever searches a collection preselected with knowledge of the benchmark's entire query universe.

### Ranking v2: refreshed corpus, reused supervision

- **FACT (High):** Ranking v2, first used at TREC 2021, contains 11,959,635 documents and 138,364,198 passages. Of the 3.2 million v1 documents, 2.7 million were still recoverable; 9.2 million additional documents were selected because they resembled documents that had yielded useful passages for prior Bing queries.[S6][S9]
- **FACT (High):** A query-independent proprietary passage-selection algorithm selected non-overlapping passages, averaging 11.6 passages/document. V2 exposes document IDs, URLs, titles, headings, bodies and explicit passage-to-document IDs/spans; the mapping is permitted for v2 experiments.[S6][S9]
- **FACT (High):** Published v2 files list 322,196 document-training queries/331,956 qrels and 277,144 passage-training queries/287,889 qrels. The two document dev sets contain 4,552 and 5,000 queries; passage dev sets contain 3,903 and 4,281 queries.[S9]
- **FACT (High):** V2 did not buy a comparably new large label set. Document qrels were transferred by URL; passage qrels required source-URL agreement and sufficient text similarity to an old positive passage. Organizers warned that later page content increased the chance that transferred labels were no longer valid.[S6]
- **FACT (High):** TREC 2021/2022 used top-100 reranking and full retrieval from v2. In 2022, document ranking was redefined as ranking documents by likelihood of containing a relevant passage, and document labels were inferred from passage judgments rather than separately judged.[S9][S10]
- **INFERENCE (High):** V2 fixes the most obvious query-conditioned passage sampling and mapping limitation, but its large-corpus realism and its supervision quality are separate properties. Corpus refresh does not refresh the semantic ground truth.

### Version identity rule for Curiosity

**RECOMMENDATION (High):** Never record a result as merely “MS MARCO.” A reproducible record must identify at least:

1. QA/NLG v1.1 or v2.1 versus ranking v1 or ranking v2;
2. passage versus document; full retrieval versus fixed-candidate reranking;
3. exact corpus digest/distribution and whether titles/headings/augmentation were present;
4. query split (full dev, 6,980 dev, leaderboard eval, TREC year/topics);
5. qrel origin (sparse MS MARCO, transferred v2, or graded NIST pool);
6. metric, depth, relevance threshold, candidate depth, and tie handling;
7. external data, pretrained checkpoints, MS MARCO-derived negatives/distillation, and prior exposure.

## Labels, metrics, and what a score means

### Sparse MS MARCO labels

- **FACT (High):** In the commonly used 6,980-query passage dev set, 6,590 queries (94.4%) have exactly one positive label; none have explicit negative judgments.[S8]
- **FACT (High):** Organizers state that a positive qrel should not be understood as the “best answer.” It is a passage selected from Bing's displayed evidence; qrels are highly incomplete.[S6]
- **INFERENCE (High):** MRR@10 measures how early the first **known selected support passage** appears, assigns zero if none is in the first ten, ignores all ranks after the first known positive, and cannot reward retrieving several additional useful passages. It is not recall, answer correctness, source quality, coverage, freshness, or user satisfaction.
- **FACT (Medium):** A sensitivity study found that adding plausible positives could markedly change absolute scores while top-system ordering remained comparatively stable (top-weighted Kendall correlation above 0.9 in the studied setting). This supports some comparative use but does not make missing labels true negatives.[S8]

### TREC Deep Learning labels and metrics

- **FACT (High):** TREC pools submitted runs and has NIST assessors apply four-level judgments. For TREC 2021, document levels 1–3 were binary-relevant; passage levels 2–3 were binary-relevant while level 1 meant related but not answering.[S6]
- **FACT (High):** TREC used NDCG@10 as its primary top-rank metric, NCG@100 to examine candidate-generation coverage, and also reported reciprocal rank and average precision. NIST labels are richer than sparse MS MARCO labels, but only pooled items for a judged subset of released topics are assessed.[S6][S9]
- **FACT (High):** At TREC 2021, 477 topics were released; only 57 document and 53 passage topics were ultimately judged. Pooling is intentionally bounded by assessment budget.[S6]
- **INFERENCE (High):** NDCG@10 better represents graded ranking quality than MRR@10, but it remains top-heavy and pool-dependent. New systems that retrieve relevant material outside historical pools can be undercredited; small judged query counts produce uncertainty and make per-segment claims fragile.

### Metric recommendations

**RECOMMENDATION (High):** If a separately approved evaluation ever occurs, report a panel rather than a single leaderboard number: NDCG@10, MRR@10 only for historical comparability, recall/NCG at candidate depth, judged/unjudged rate, per-query confidence intervals, latency/resource cost, duplicate/domain concentration, and Curiosity-specific safety/freshness/source-quality failures. Do not convert a statistically significant MS MARCO gain into a production-quality claim.

## Bias, leakage, and validity ledger

| Issue | Evidence and effect | Classification / confidence |
| --- | --- | --- |
| Bing sampling and ranking | Queries came from Bing/Cortana; evidence came from Bing retrieval. Labels are conditioned on what Bing surfaced. | **FACT / High** [S4][S6] |
| Intent/language filtering | English, non-adult/offensive, short-answer/question-like subset; navigational, transactional, and long-answer intents intentionally excluded. | **FACT / High** [S6] |
| Position/exposure bias | Editors saw passages in Bing-ranked order and only up to ten, so unseen evidence could not be selected. | **FACT / High** [S4] |
| Sparse positives / false negatives | Supporting annotation was non-exhaustive; triples and qrels contain unjudged items rather than reliable negatives. | **FACT / High** [S4][S5][S8] |
| Answer-support ≠ general relevance | Passage labels ask whether text supports an answer; document labels are transferred from passage support. | **FACT / High** [S4][S5] |
| V1 test-conditioned corpus | Corpus union used evidence retrieved for all million queries, potentially including test queries; mapping was forbidden. | **FACT / High** [S6] |
| Temporal/parser mismatch | Passages, later documents, and still-later v2 snapshots differ; pages disappeared/changed; v1 had encoding/whitespace defects. | **FACT / High** [S4][S6] |
| V2 label transfer | URL/text-similarity mapping can preserve stale or wrong positives and miss new positives. | **FACT / High** [S6] |
| Pooling bias | NIST judges bounded pools from submitted systems, not the whole 12M/138M corpus. | **FACT / High** [S6] |
| Public-dev reuse | Public qrels support unlimited experimentation; leaderboard/TREC test collections become reusable after release. | **FACT / High** [S7] |
| Leaderboard feedback | Organizers limited repeated submissions and retained private queries because repeated public feedback can overfit. | **FACT / High** [S1][S7] |
| Unofficial titled corpus | A title-augmented v1 variant gives title availability/content correlated with positives and produced gains on MS MARCO dev that did not generalize consistently to TREC 2019/2020. | **FACT / High** [S11] |
| Cross-split overlap | The project records that v2.0 eval answers overlapping older/well-formed sets were removed from eval for v2.1. | **FACT / High** [S1] |
| Modern model contamination | MS MARCO queries/corpora/labels and many derivative checkpoints have been public and heavily reused; a third-party model may have direct or indirect exposure. Exact exposure is usually undisclosed. | **INFERENCE / Medium; UNKNOWN per model** |
| Demographic/geographic representativeness | Bing-log origin and filtering are known, but no reviewed source establishes demographic, country, socioeconomic, dialect, or device representativeness. | **UNKNOWN / High** |

### Published label disagreement warning

- **FACT (High):** The TREC 2021 overview reports decreasing agreement between sparse-label RR and NIST-label NDCG system orderings. Kendall's tau for document runs was 0.69 (2019), 0.46 (2020), 0.43 (2021); passage runs were 0.68, 0.69, 0.51.[S6]
- **FACT (High):** For 2021 transferred positives, NIST assigned grade 0 to 7% of document positives and 15% of passage positives in the overview's compared sample. The paper notes both potential transfer noise and ordinary assessor disagreement.[S6]
- **INFERENCE (High):** Sparse-label and NIST scores are related but not interchangeable objectives. Curiosity should not tune to sparse MRR and claim improvement in graded relevance, nor compare numbers across v1/v2/TREC years as if the population and labels were fixed.

## Rights and production-risk analysis

### The controlling public dataset notice

- **FACT (High):** Microsoft's current website and repository state that MS MARCO and ORCAS are intended “for non-commercial research purposes only.”[S1][S2]
- **FACT (High):** The notice says the datasets are made available without extending any license or other intellectual-property rights, are provided as-is, and carry risk because Microsoft may not own underlying rights in the documents.[S1][S2]
- **FACT (High):** Use is deemed acceptance; stated rights end automatically on violation. Rights holders can request document removal, and Microsoft directs product/service questions—including questions about research outputs—to independent legal review.[S1][S2]
- **INFERENCE (High):** The safest reading is a narrow, purpose-limited permission, not an open-data license. The language does not grant a commercial production right, sublicensing right, or clean title to web content.

### Repository licenses are not a dataset escape hatch

- **FACT (High):** The `microsoft/msmarco` repository separately licenses its documentation/other repository content under CC BY 4.0 and its code under MIT. The passage-ranking code repository also carries MIT.[S2][S3]
- **FACT (High):** That same repository places the non-commercial/no-IP-rights dataset notice above those legal notices.[S2]
- **INFERENCE (High):** CC BY covers the authored documentation to which Microsoft applied it; MIT covers software. Neither should be treated as permission to commercialize corpus blobs, user queries, annotations, or third-party page text. A package or dataset host displaying a generic permissive license does not override the upstream dataset notice.
- **RECOMMENDATION (High):** Maintain separate SBOM/data-bill entries for evaluation code, documentation, queries/qrels, corpora, and trained artifacts. Never label “MS MARCO” wholesale as MIT or CC-BY.

### Underlying-document rights

- **FACT (High):** The corpora reproduce titles and substantial body/passage text from real web pages; Microsoft explicitly says it may not own the underlying document rights and offers an owner removal channel.[S1][S2][S4]
- **INFERENCE (High):** Publisher copyright, database rights, privacy/personality rights, contractual restrictions, and changed/withdrawn content may survive dataset inclusion. A page being publicly reachable, indexed by Bing, or distributed in MS MARCO does not establish Curiosity's right to reproduce it, ship it, train a commercial model on it, or answer users from it.
- **INFERENCE (High):** The notice's lack of warranty/title shifts rather than resolves infringement and privacy risk. Takedown after distribution is not equivalent to prior permission, and downstream copies/models may be difficult to purge.
- **UNKNOWN:** No reviewed source provides publisher-by-publisher license metadata, robots state at collection time, author consent, geographic rights, personal-data inventory, or a complete deletion ledger.

### Production prohibition and derivative-artifact risk

**RECOMMENDATION (High): Prohibited absent new written rights and legal approval:**

1. indexing MS MARCO documents/passages in any Curiosity production or staging corpus connected to product delivery;
2. training, distilling, fine-tuning, embedding, hard-negative mining, or reranker calibration intended for commercial deployment;
3. shipping corpus-derived examples in unit tests, demos, prompts, documentation, packages, dashboards, or customer-visible traces;
4. redistributing the corpus or a “cleaned,” titled, chunked, embedded, or deduplicated derivative;
5. using MS MARCO traffic as a production-quality gate, product claim, sales benchmark, or substitute for source-specific permissions;
6. assuming trained weights, embeddings, synthetic rewrites, qrels, or aggregate snippets are unrestricted merely because they are transformed.

**INFERENCE (Medium):** The public terms do not expressly define whether non-expressive aggregates, model weights, embeddings, or research outputs are copies/derivatives or whether later commercial use is allowed. That ambiguity is a risk requiring counsel, not affirmative permission. Microsoft's explicit product-output review warning makes a production interpretation especially unsafe.[S1][S2]

## Narrow evaluation/fixture posture, subject to review

The following is a **proposed control envelope**, not present permission.

### Potentially reviewable

- **DEFERRED:** A time-bounded, access-controlled, genuinely non-commercial research evaluation by an approved research group, using an exact upstream distribution solely to reproduce published results, may be reviewable if counsel accepts the purpose under Microsoft's terms.
- **DEFERRED:** Local use of Microsoft's MIT evaluation script can be assessed separately from dataset use; retain its notice and verify the exact file/revision. Metric reimplementation from the mathematical definition is preferable where practical.
- **ADAPTED:** Public aggregate facts—corpus counts, task definitions, metric definitions, and published findings—can inform Curiosity design documentation with citation and without acquiring the data.
- **ADAPTED:** Build Curiosity-owned synthetic fixtures that imitate only conventional structure (`query`, candidate IDs, graded labels, ranks), not MS MARCO text, query strings, IDs, selection patterns, or hidden answers.

### Required approval controls if data use is authorized

1. written scope naming legal entity, personnel, purpose, versions, exact files, and whether the organization qualifies as non-commercial research for this activity;
2. segregated non-production storage, least-privilege access, no cloud/service upload unless explicitly approved, no telemetry containing corpus text, and no repository commit;
3. artifact ledger for raw data, indexes, embeddings, checkpoints, predictions, reports, caches, and backups with deletion/purge method;
4. no model or derived artifact promotion to Curiosity; an independent clean model must be trained on authorized Curiosity data;
5. exact corpus/split/qrel checksums, evaluation protocol preregistration, contamination disclosure, and no tuning on the final test set;
6. publisher/Microsoft takedown monitoring and a provable purge procedure;
7. citation, terms snapshot, source-access date, and separate license notices for code/documentation;
8. fixed end date and signed destruction/retention review.

### Fixtures

- **RECOMMENDATION (High):** Do not copy even a “small” passage/query pair into Curiosity tests by default. Small quantity reduces exposure but does not create a license, and one passage can contain substantial publisher expression or personal data.
- **RECOMMENDATION (High):** Use authored synthetic queries and documents with unambiguous Curiosity-owned rights. Include adversarial fixture shapes learned abstractly from MS MARCO—typos, unanswerable queries, multiple plausible supports, stale documents, false-negative labels—without reproducing source expression.
- **UNKNOWN:** Whether a particular minimal excerpt qualifies for fair use/fair dealing or another exception is jurisdiction- and context-specific and cannot be decided at dataset level.

## Clean-room boundary for Curiosity

This report extracts public facts and benchmark lessons only. Curiosity should not reproduce Microsoft's dataset generation, Bing rankings/signals, proprietary v2 passage selector, corpus, labels, queries, hidden answers, or unofficial derivatives.

1. **Independent requirements.** Define Curiosity's evaluation dimensions from product needs: relevance, answer support, source quality, freshness, safety, diversity, multilinguality, latency, and rights compliance.
2. **Independent corpus.** Acquire documents under explicit source permissions and preserve URL, acquisition basis, robots/terms snapshot, publisher license, timestamps, deletion status, and content hash.
3. **Independent queries.** Use consented/authorized Curiosity traffic only under an approved privacy protocol, plus authored or licensed test queries. Do not backfill with Bing queries.
4. **Independent labels.** Judge candidates from multiple retrieval systems, include explicit nonrelevance and unjudged states, use multiple assessors/adjudication, and version labels against immutable document snapshots.
5. **Blind final set.** Keep a one-shot, access-controlled test set; rotate it. Public development labels and private acceptance labels must be different.
6. **No cross-boundary artifacts.** No MS MARCO-trained checkpoint, embedding, mined negative, title augmentation, output cache, or corpus-derived fixture enters the owned pipeline without an explicit rights decision.
7. **Contamination ledger.** Record every pretrained model's known MS MARCO exposure. A model trained on MS MARCO is not a zero-shot baseline on MS MARCO, and an unknown training manifest means contamination is unknown, not absent.
8. **Bounded evaluation.** Cap candidates, bytes, time, model calls, and assessor exposure; treat all corpus content as untrusted and never execute or render active material.

## Curiosity implications and verdicts

| MS MARCO element / lesson | Verdict | Curiosity treatment | Confidence |
| --- | --- | --- | --- |
| Dataset in production index | **REJECTED** | Non-commercial/no-IP grant and underlying publisher-rights risk. | High |
| Dataset-trained production model | **REJECTED** absent new rights | Public terms do not authorize commercial deployment; outputs/weights unresolved. | High |
| Routine commercial CI benchmark | **REJECTED** by default | Product-development purpose may exceed non-commercial research; copied fixtures persist. | High |
| Separately approved research reproduction | **DEFERRED** | Only under written legal/data controls and no production transfer. | High |
| MS MARCO text as fixtures/examples | **REJECTED** | Use Curiosity-authored synthetic equivalents. | High |
| Large-query supervised ranking | **ADOPTED** as research lesson | Build an authorized Curiosity label program; do not import data. | High |
| Passage and document tasks | **ADAPTED** | Evaluate passage retrieval, document retrieval, and passage-in-document support separately. | High |
| Full retrieval plus reranking | **ADOPTED** | Separate candidate recall/coverage from reranker quality and cost. | High |
| One selected support as “relevance” | **REJECTED** | Multi-grade, multi-positive, explicit unjudged/nonrelevant labels. | High |
| MRR@10 as sole quality metric | **REJECTED** | Metric panel plus uncertainty and operational/safety measures. | High |
| NIST-style graded pooled judgment | **ADAPTED** | Diverse-system pooling, residual judging, assessor agreement, and pool-bias audit. | High |
| Query-conditioned corpus construction | **REJECTED** | Corpus acquisition/segmentation must be query-independent. | High |
| V2 query-independent passages and mappings | **ADAPTED** | Reproducible open segmentation with document/passage lineage; no proprietary selector. | High |
| Reusing labels across changing pages | **REJECTED** as silent behavior | Snapshot/version bind every label; rejudge or mark stale. | High |
| Real-query noise/unanswerability | **ADOPTED** | Authorized fixtures should include ambiguity, typos, conflicting and insufficient evidence. | High |
| Hidden, rotating final evaluation | **ADOPTED** | One-shot protected acceptance sets; rate-limit feedback. | High |
| Published counts/findings | **ADOPTED** with citation | Architectural evidence only; no corpus acquisition needed. | High |

## Verification checks before any approved use

1. **Terms check:** archive the exact Microsoft terms presented at access and confirm they cover every requested artifact/version; repository license files alone are insufficient.
2. **Purpose check:** counsel explicitly classifies the activity as within “non-commercial research,” despite Curiosity's commercial context.
3. **Artifact check:** inventory raw corpus, queries, qrels, candidate lists, derived indexes/embeddings/models, output reports, logs, and backups.
4. **Version check:** hash exact files and distinguish QA v2.1, ranking v1, ranking v2, official/augmented/titled corpus, sparse/NIST/transferred qrels, and query split.
5. **Leakage check:** prohibit original QA construction signals for v1 ranking comparisons; disclose passage-document mapping, titles, ORCAS, external data, and checkpoint exposure.
6. **Metric check:** independently validate qrel thresholds, query inclusion, missing-run behavior, tie handling, cutoff, and aggregation against a hand-computed synthetic case.
7. **Judgment check:** quantify labels/query, unjudged top-k, disagreement, stale URL/text mappings, and result changes under denser qrels.
8. **Contamination check:** inspect model cards/training manifests and run overlap probes where authorized; report unresolved exposure as unknown.
9. **Isolation check:** demonstrate that no data, checkpoint, embedding, or corpus-derived example can be promoted to production.
10. **Deletion check:** prove purge of working storage, caches, logs, object versions, and backups, and retain only approved non-expressive aggregate reports.

## Unknowns and negative results

- **UNKNOWN:** The public terms do not define “non-commercial,” “research,” internal commercial R&D, derived data, model weights, embeddings, or when a research output becomes product use.
- **UNKNOWN:** No public commercial license, production addendum, or standard process/price for expanded MS MARCO rights was found in the official materials reviewed. Private permissions may exist.
- **UNKNOWN:** Microsoft/publisher title and authorization for every query, passage, document, answer, and annotation; the public notice affirmatively disclaims certainty for underlying documents.
- **UNKNOWN:** Complete privacy analysis of anonymized queries and page text, including residual re-identification, sensitive queries, personal data, and applicable deletion rights.
- **UNKNOWN:** Exact model-by-model contamination for modern proprietary or open checkpoints unless a complete training manifest exists.
- **UNKNOWN:** Whether all historical download mirrors and third-party packaged variants display the same terms; upstream Microsoft terms remain the baseline, not mirror metadata.
- **NEGATIVE RESULT:** No basis was found to characterize the datasets themselves as MIT, CC BY 4.0, public domain, or generally commercial-use data.[S2][S3]
- **NEGATIVE RESULT:** No basis was found to infer rights from public web accessibility, Bing indexing, a URL field, or Microsoft hosting.[S1][S2]
- **NEGATIVE RESULT:** No single canonical “MS MARCO score” exists across QA/NLG, passage/document, v1/v2, sparse/NIST labels, and MRR/NDCG variants.
- **NEGATIVE RESULT:** No empirical relevance, latency, or storage test was performed; dataset access/download was intentionally avoided.
- **NEGATIVE RESULT:** No claim that sparse labels are unusable is warranted: published studies show useful system-order stability/correlation in some settings, while also documenting substantial incompleteness and objective mismatch.[S6][S8]

## Bounded curiosity pass

Scoring is 1–5 for relevance (R), decision value (V), novelty (N), and cost (C; lower is better). Priority = R + V + N − C.

| Thread | R | V | N | C | Priority | Outcome |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Dataset terms versus repository CC/MIT | 5 | 5 | 4 | 1 | 13 | Pursued through current README/notice/license files; scope separation confirmed.[S2][S3] |
| Underlying publisher rights | 5 | 5 | 4 | 2 | 12 | Pursued through Microsoft terms and corpus schema/paper; lack of title confirmed, item-level rights remain unknown.[S1][S2][S4] |
| V1 test-conditioned corpus and v2 label transfer | 5 | 5 | 4 | 2 | 12 | Pursued through TREC 2021 overview and official guidelines; both risks confirmed.[S6][S9] |
| Unofficial title augmentation leakage | 4 | 4 | 5 | 2 | 11 | Pursued via SIGIR paper; material reproducibility/leakage effect confirmed.[S11] |
| Exact model-pretraining contamination inventory | 4 | 4 | 4 | 5 | 7 | **CURIOSITY_NO_GO:** model-specific, unbounded, often undisclosed; require per-model review. |
| Publisher-by-publisher license reconstruction | 5 | 5 | 3 | 5 | 8 | **CURIOSITY_NO_GO:** millions of changing pages, no data download, and outside clean-room/access budget. |
| Download/sample corpus to inspect personal data | 4 | 4 | 3 | 5 | 6 | **CURIOSITY_NO_GO:** prohibited by frame and unnecessary to reach rights verdict. |
| Determine legal enforceability/fair use | 5 | 5 | 3 | 5 | 8 | **CURIOSITY_NO_GO:** jurisdiction- and facts-specific legal advice; escalate to counsel. |
| Recover every historic leaderboard rule/version | 2 | 2 | 2 | 4 | 2 | **CURIOSITY_NO_GO:** principal tasks/metrics/version hazards covered; low marginal decision value. |

**Stop reason:** coverage and saturation. The highest-value contradiction—permissively licensed repository materials beside restrictive dataset terms—was resolved by the repository's own scope language. The construction, metric, leakage, and underlying-rights evidence is sufficient for the production rejection and review-gated research posture. Remaining questions require legal authority, private agreements, item-level rights work, model manifests, or prohibited dataset access.

## Primary and published sources

All sources accessed **2026-08-17**.

- **[S1] Microsoft, [MS MARCO official site](https://microsoft.github.io/msmarco/).** Current terms; task history/retirement; corpus and leaderboard descriptions; submission rules; version/change history.
- **[S2] Microsoft, [`microsoft/msmarco` README and Notice](https://github.com/microsoft/msmarco) and [raw `Notice.md`](https://raw.githubusercontent.com/microsoft/msmarco/master/Notice.md).** Dataset non-commercial/no-IP terms; repository documentation/code license scope; trademark and product-review warning.
- **[S3] Microsoft, [`microsoft/msmarco` CC BY 4.0 `LICENSE`](https://github.com/microsoft/msmarco/blob/master/LICENSE), [MIT `LICENSE-CODE`](https://github.com/microsoft/msmarco/blob/master/LICENSE-CODE), and archived [MSMARCO Passage Ranking MIT license](https://github.com/microsoft/MSMARCO-Passage-Ranking/blob/master/LICENSE).** License texts and scope distinction.
- **[S4] Bajaj et al., [“MS MARCO: A Human Generated MAchine Reading COmprehension Dataset”](https://arxiv.org/abs/1611.09268) (arXiv v3, 2018).** Original generation pipeline, fields, counts, filters, non-exhaustive support labels, tasks, and QA metrics.
- **[S5] Microsoft, [“Datasets for Document and Passage Ranking Leaderboards”](https://github.com/microsoft/msmarco/blob/master/Datasets.md) and archived [Passage Ranking README](https://github.com/microsoft/MSMARCO-Passage-Ranking/blob/master/README.md).** Official v1 files/counts, formats, tasks, candidate sets, sparse-label warnings, and external-data restrictions.
- **[S6] Craswell et al., [“Overview of the TREC 2021 Deep Learning Track”](https://trec.nist.gov/pubs/trec30/papers/Overview-DL.pdf) (NIST TREC proceedings; accessible [author-posted text](https://arxiv.org/abs/2507.08191)).** V1/v2 construction, filtering, corpus leakage, v2 mapping, graded judgments, metrics, judged-topic counts, and sparse/NIST disagreement.
- **[S7] Craswell et al., [“MS MARCO: Benchmarking Ranking Models in the Large-Data Regime”](https://arxiv.org/abs/2105.04021) (SIGIR 2021).** Leaderboard metrics, repeated-testing/internal-validity controls, private leaderboard, metric limitations, and external validity.
- **[S8] Mackenzie, Petri, and Moffat, [“A Sensitivity Analysis of the MSMARCO Passage Collection”](https://arxiv.org/abs/2112.03396) (2022).** Exact small-dev positive-label density and sensitivity to plausible missing positives.
- **[S9] Microsoft/TREC, [TREC 2021 Deep Learning Track Guidelines](https://microsoft.github.io/msmarco/TREC-Deep-Learning-2021).** V2 official counts/schema/checksums, allowed mappings, prohibited leakage signals, reranking depths, and evaluation protocol.
- **[S10] Microsoft/TREC, [TREC 2022 Deep Learning Track Guidelines](https://microsoft.github.io/msmarco/TREC-Deep-Learning-2022).** V2 reuse, revised document task, passage-derived document judgments, run limits, and test protocol.
- **[S11] Lassance and Clinchant, [“The tale of two MS MARCO—and their unfair comparisons”](https://arxiv.org/abs/2304.12904) (SIGIR 2023).** Official versus title-augmented v1 corpus, title-availability label leakage, and cross-test effectiveness results.
