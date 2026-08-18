# MTEB Retrieval as a standalone benchmark suite

**Research and source access date:** 2026-08-17  
**Version frame:** MTEB **2.19.4** (release published 2026-08-17), with
dataset revisions pinned by the task metadata at that tag. [S1][S5]  
**Method:** public papers, tagged MTEB source and licenses, official dataset
pages/repositories, and the official results repository. No package, model, or
dataset was downloaded; no benchmark was run. This is research, not legal
advice or an empirical endorsement.  
**Labels:** **FACT** is directly supported; **INFERENCE** is a bounded
conclusion; **RECOMMENDATION** is Curiosity advice; **UNKNOWN** was not
established. Confidence is high / medium / low.

## Decision frame

**Decision:** Should Curiosity adopt “MTEB Retrieval” as a standalone retrieval
quality gate, and if so, which frozen task set and what additional evidence are
required?

Bounded sub-questions:

1. What does “MTEB Retrieval” identify today: a benchmark, a task filter, or a
   historical paper table?
2. How are queries, judgments, metrics, multilingual subsets, and task scores
   evaluated and aggregated?
3. What overlap, training contamination, rights, and version-drift limitations
   affect interpretation?
4. Which parts transfer to public-web search and Curiosity, and which do not?

Out of scope: running MTEB, downloading data, choosing a production model,
legal clearance, reproducing leaderboard scores, or implementing an adapter.

## Executive verdict

**RECOMMENDATION — ADAPT, do not adopt as the sole or unnamed quality gate
(high confidence).** MTEB provides a useful, Apache-2.0 evaluation framework,
pinned task datasets, standard IR metrics, published result records, broad
model support, and heterogeneous retrieval fixtures. Use a named, frozen
retrieval slice as one *offline semantic-retrieval regression suite*, retaining
per-dataset results and lexical/dense/hybrid baselines. [S1][S4][S5][S9]

“MTEB Retrieval” is not one immutable current benchmark preset. It can mean:

1. the original paper's English retrieval category—15 dataset families, with
   CQADupStack aggregated over 12 forums;
2. retrieval tasks filtered from legacy `MTEB(eng, v1)`; or
3. the **ten** retrieval task entries currently obtained by filtering the
   recommended `MTEB(eng, v2)` at MTEB 2.19.4. [S2][S5][S6]

The unconstrained current registry is much larger, multilingual, and now
multimodal; selecting every task of type `Retrieval` would therefore be a
moving toolbox query, not a reproducible standalone suite. [S1][S7]

MTEB does **not** validate web crawling, corpus coverage, freshness, authority,
spam/adversarial resistance, deduplication, safe-content policy, snippets,
citations, answer synthesis, geographic/personalized intent, live latency,
cost, index updates, or end-to-end agent success. A high MTEB score is evidence
about ranking judged documents in frozen corpora—not proof of a good public-web
search engine.

## What exactly would be frozen

### Historical v1 retrieval suite

**FACT (high):** The original MTEB paper reuses BEIR retrieval data and
evaluation. Each task supplies a corpus, queries, and query-to-relevant-document
qrels; the paper embeds the corpus and queries, ranks by cosine similarity, and
uses nDCG@10 as the main metric. It evaluated test splits except MS MARCO dev.
The paper reports the mean main metric over 15 English retrieval datasets.
[S2][S3]

The 15 task families are ArguAna, Climate-FEVER, CQADupStack, DBpedia-Entity,
FEVER, FiQA-2018, HotpotQA, MS MARCO, NFCorpus, Natural Questions, Quora,
SCIDOCS, SciFact, TREC-COVID, and Touché-2020. CQADupStack itself combines 12
forum-specific retrieval tasks by an unweighted mean, so it contributes one
family score in the legacy suite rather than twelve independent weights.
[S3][S6]

### Recommended English v2 retrieval slice at 2.19.4

**FACT (high):** Filtering `MTEB(eng, v2)` to `Retrieval` yields these ten task
entries, all on `test`: [S5]

| Task entry | Fixture character | Material caveat |
|---|---|---|
| ArguAna | claim → counterargument | one-to-one argumentative matching |
| CQADupstackGamingRetrieval | duplicate community questions | one Stack Exchange domain |
| CQADupstackUnixRetrieval | duplicate community questions | a second, correlated forum |
| ClimateFEVERHardNegatives | climate claim verification | pooled subset of FEVER's corpus |
| FEVERHardNegatives | general claim verification | pooled subset; public Wikipedia-derived data |
| FiQA2018 | financial QA/opinion retrieval | rights unspecified in MTEB metadata |
| HotpotQAHardNegatives | multi-hop QA evidence | pooled subset, not open-web multi-hop search |
| SCIDOCS | citation prediction | citation relevance is not user relevance |
| TRECCOVID | expert biomedical search | 50 topics; incomplete pooled judgments risk |
| Touche2020Retrieval.v3 | controversial-question arguments | corrected v3 fixture |

**FACT (high):** English v2 was built to be cheaper and more zero-shot-like. It
removed commonly fine-tuned tasks including MS MARCO and Natural Questions,
selected correlated tasks, and uses optimized variants. The MMTEB paper reports
a 0.90 Spearman correlation between v1 and v2 model scores, not identity.
[S4]

**VERSION WARNING (high):** At tag 2.19.4, the benchmark still names the
unversioned `ClimateFEVERHardNegatives`, `FEVERHardNegatives`, and
`HotpotQAHardNegatives`, while each task's metadata marks it superseded by a
`.v2` prompt-corrected variant. Replacing them silently changes the protocol.
Freeze the exact benchmark task names, source tag, dataset commit hashes, and
prompts rather than referring only to “English v2.” [S5][S8]

## Evaluation and aggregation contract

### Retrieval run

- **FACT (high):** Current retrieval accepts an encoder, cross-encoder, or full
  search implementation. It indexes the supplied corpus, searches to the
  task's maximum cutoff (normally 1,000), removes query-document self-matches
  only for tasks that request it, and scores against qrels. [S9][S10]
- **FACT (high):** Standard cutoffs are 1, 3, 5, 10, 20, 100, and 1,000. MTEB
  emits nDCG, MAP, recall, precision, MRR, hit rate, and confidence-abstention
  nAUC variants; the canonical retrieval `main_score` is normally nDCG@10.
  Queries without any positive are filtered before evaluation. [S9][S10]
- **FACT (high):** Prompts can differ by query/document role, task type, task,
  and task-role pair. Model metadata records model revision, similarity
  function, maximum tokens, training datasets, and whether instructions are
  used. Thus prompt, truncation, pooling, precision, score function, and model
  revision are part of the evaluated system, not incidental details.
  [S11][S12]
- **INFERENCE (high):** Results from a custom approximate or hybrid
  `SearchProtocol` can be valid MTEB results but are not automatically an
  isolated embedding comparison. Backend, candidate depth, ANN settings,
  lexical analyzer, fusion, and reranking must be reported for system-level
  runs.

### Aggregation

- **FACT (high):** A task score averages its `main_score` across selected
  splits/subsets. A benchmark's `Mean(Task)` is then an unweighted mean over
  task scores; `Mean(TaskType)` is an unweighted mean of task-type means.
  Leaderboard rank is Borda rank over per-task model ordering, and all required
  task results must be present. [S13][S14]
- **FACT (high):** CQADupStack legacy aggregation averages the 12 forum task
  scores, again unweighted. [S6]
- **INFERENCE (high):** Neither queries nor corpus documents are micro-averaged.
  A 49-query task and a thousands-query task can receive the same top-level
  weight. For Curiosity, the macro mean must never replace the per-task table,
  uncertainty, and a use-case-weighted rollup.
- **RECOMMENDATION (high):** Publish nDCG@10 for comparability, but gate also on
  Recall@10/100 (candidate coverage), MRR@10 or hit rate (first-useful-result),
  and worst-slice regressions. Do not optimize only the public macro mean.

## Dataset overlap, judgments, and contamination

### Structural overlap

- **FACT (high):** Climate-FEVER and FEVER use the same Wikipedia corpus. The
  original MTEB paper explicitly observed corpus-level similarity 1.0 for this
  pair. CQADupStack tasks are variants of one collection; scientific tasks also
  share domain and document lineage. [S2][S3]
- **INFERENCE (high):** Treating correlated tasks as independent evidence
  overstates coverage and narrows confidence intervals. English v2 reduces but
  does not eliminate this problem: two CQADupStack forums remain, and the two
  FEVER-family tasks remain.
- **FACT (high):** MMTEB's optimized hard-negative fixtures union the top 250
  documents per query from BM25, multilingual-e5-large, and
  e5-Mistral-instruct; tasks over 1,000 queries may be sampled to 1,000. This
  greatly reduces evaluation cost and preserved model ordering for the models
  tested by the authors. [S4]
- **INFERENCE (high):** A pooled fixture validates discrimination inside a
  candidate set generated by three known systems. It is closer to controlled
  hard-negative ranking than full-corpus recall and can miss failure modes or
  novel candidates outside that pool. The reported rank preservation is not a
  guarantee for lexical, sparse, late-interaction, future, or Curiosity systems.

### Training and test contamination

- **FACT (high):** The original paper states that controlling training overlap
  was difficult, notes likely SciDocs overlap for some models, and deliberately
  ignored training/test overlap in MTEB scores on the belief that averaging many
  datasets would reduce its effect. [S2]
- **FACT (high):** Current model submissions declare `training_datasets`, and
  the leaderboard exposes a computed zero-shot field; maintainers may request
  leakage checks. These are metadata/review controls, not content-level proof
  that pretraining or proprietary training corpora excluded public test data.
  [S12][S15]
- **FACT (high):** English v2 excludes MS MARCO and Natural Questions because
  they are frequently fine-tuned on. All remaining fixtures and qrels are still
  public. [S4]
- **INFERENCE (high):** English v2 is *contamination-reduced*, not
  contamination-free. Repeated public-leaderboard model selection is itself
  adaptation to the test set. Foundation-model web pretraining may include
  source pages, benchmark mirrors, queries, qrels, or discussions even when a
  developer did not explicitly fine-tune on a task.
- **RECOMMENDATION (high):** Record explicit/possible/unknown overlap for every
  candidate model, report “known zero-shot” and “unknown pretraining exposure”
  separately, and pair MTEB with a private, time-split Curiosity set whose
  judgments are not used during model selection.

## Multilingual slices

**FACT (high):** Original MTEB retrieval was English-only; its 112-language
headline came mainly from other task types. MMTEB expanded to 500+ tasks over
250+ languages. The paper's `MTEB(Multilingual)` had 132 task entries, including
18 retrieval entries, after excluding machine-translated, under-licensed, and
overly domain-specific candidates and applying correlation-based task
selection. [S2][S4]

**FACT (high):** Current MTEB supports language/subset filtering using ISO
639-3 codes. A multilingual task's overall score is an unweighted mean of the
included subset scores; benchmark task means then weight task entries equally.
[S7][S13]

**INFERENCE (high):** “Multilingual retrieval score” is not population-, query-,
traffic-, or language-weighted. A language can be represented by one translated
QA set, one native set, a cross-lingual task, or several correlated tasks. An
overall average can hide script, dialect, code-switching, cross-language query
→ document, and low-resource failures.

**RECOMMENDATION (high):** For Curiosity, freeze separate native-language and
cross-lingual slices; report every language-script pair and macro averages by
language family/resource tier. Add the actual target locales, localized web
sources, code-switching, and locale-sensitive freshness/safety judgments.
Do not infer multilingual web-search fitness from English v2.

## Rights and licensing

**FACT (high):** MTEB framework code is Apache-2.0 and the official results
repository is CC0. Neither license clears component datasets or underlying
documents. [S1][S16]

The following is the MTEB 2.19.4 metadata declaration for each historical
retrieval family, checked against available original project terms where found.
It is an inventory, **not** a rights opinion. “Unspecified” means no usable
grant was established in the bounded review.

| Dataset family | MTEB metadata label | Rights disposition for Curiosity |
|---|---|---|
| ArguAna | CC BY-SA 4.0 | **DEFER** ingestion; attribution/share-alike review plus source-text provenance |
| Climate-FEVER | CC BY-SA 4.0 | **DEFER**; derivative of FEVER/Wikipedia, preserve source attribution |
| CQADupStack | Apache-2.0 | **DEFER**; wrapper label does not by itself resolve Stack Exchange post attribution/share-alike lineage |
| DBpedia-Entity | MIT | **ADAPT for evaluation**; original collection license grants use, but verify DBpedia/Wikipedia field provenance [S17] |
| FEVER | CC BY-NC-SA 3.0 | **REJECT for commercial production corpus** absent permission; evaluation use requires NC/SA review |
| FiQA-2018 | not specified | **DEFER** pending original data grant and source-post rights |
| HotpotQA | CC BY-SA 4.0 | **DEFER**; Wikipedia-derived content and share-alike/attribution obligations |
| MS MARCO | MSR-LA-NC | **REJECT for commercial production use**; official terms say non-commercial research only and disclaim underlying document rights [S18] |
| NFCorpus | not specified | **DEFER** pending grant and medical-source provenance |
| Natural Questions | CC BY-NC-SA 3.0 in MTEB | **DEFER/REJECT commercial corpus**; MTEB's content label differs from the upstream repository's Apache-2.0 code/license, so scope must be resolved [S19] |
| Quora | not specified | **DEFER** pending Quora/Kaggle terms and question-author rights |
| SCIDOCS | CC BY-SA 4.0 | **DEFER**; verify abstract/metadata rights and attribution chain |
| SciFact | CC BY-NC 4.0 | **REJECT for commercial production corpus** absent permission |
| TREC-COVID | not specified | **DEFER**; judgments, CORD-19 metadata, and article/abstract rights are separable |
| Touché-2020 | CC BY-SA 4.0 | **DEFER**; verify v3 corpus source and share-alike attribution chain |

**FACT (high):** English v2 still contains FEVER (non-commercial metadata) and
FiQA/TREC-COVID (unspecified metadata). Its hard-negative derivatives do not
erase upstream restrictions. MMTEB's construction explicitly removed
under-specified licenses from the multilingual benchmark, but that does not
retroactively clear English v2. [S4][S5][S8]

**NEGATIVE RESULT (high):** No blanket license covering all MTEB/BEIR retrieval
content was found. BEIR and MTEB code licenses, or a Hugging Face card's blanket
label, cannot safely be treated as rights to all underlying web, Wikipedia,
forum, financial, or scientific text. Dataset-by-dataset approval remains
mandatory.

## Reproducibility and version drift

### Minimum reproducibility record

**RECOMMENDATION (high):** A result is comparable only when the record pins:

1. suite ID of our own making (for example
   `curiosity-mteb-retrieval-eng-v2@2026-08-17`), MTEB 2.19.4/tag commit, and
   exact task names;
2. every dataset repository and revision hash, split, language subset, prompt,
   and relevant task flags (self-ID removal, candidate pool);
3. model ID and immutable model revision, code/remote-API version, model
   license, training-overlap declaration, tokenizer, max length/truncation,
   prompt/prefix, pooling, normalization, score function, dimensions, dtype,
   and encode settings;
4. for search-system runs, corpus parsing, lexical analyzer, index build,
   ANN/candidate depth, fusion/reranking, tie-breaking, hardware, and software
   environment;
5. raw per-query rankings where rights permit, all per-task/per-subset metrics,
   failures, evaluation time phases, and cost/CO2 if claimed.

**FACT (high):** Official result JSON records dataset revision, task, MTEB
version, model revision path, metrics, runtime, date, and optionally phase
timings/CO2. Current merge logic checks dataset revision by default; checking
MTEB version is opt-in. The public results repository changes independently
from the MTEB package. [S13][S15][S16]

**FACT (high):** Drift is material, not hypothetical: English v1 had a known
scoring bug and was superseded; English v2 changed task membership and used
optimized datasets; task versions repair corpus/qrel/prompt errors; release
2.19.4 itself retained old Clotho tasks while adding corrected `.v2` variants.
[S1][S4][S5]

**INFERENCE (high):** A model name plus “MTEB Retrieval” score is insufficient
provenance. Never merge or compare scores across task name/revision, prompt,
MTEB version, model revision, or candidate-corpus changes without an explicit
compatibility check.

## What MTEB Retrieval does and does not validate

| Question | Verdict | Confidence |
|---|---|---|
| Can an embedding/search implementation rank judged text in frozen heterogeneous corpora? | **Validates**, within the selected fixtures and protocol | High |
| Does performance transfer across QA, arguments, claims, finance, science, and duplicate questions? | **Partially validates**; per-task variance is more informative than the mean | High |
| Can the model separate query and document roles and use prompts? | **Partially validates** | High |
| Is full-corpus candidate recall good? | **Partially** for legacy full corpora; **not established** by pooled hard-negative variants | High |
| Is the system multilingual? | **Not by English v2**; only bounded language/subset evidence from named multilingual slices | High |
| Is a result uncontaminated/zero-shot? | **Does not validate**; metadata and task exclusion only mitigate | High |
| Is the public-web index complete, fresh, authoritative, safe, and spam-resistant? | **Does not validate** | High |
| Are citations/snippets/answers faithful, or does an agent finish research tasks? | **Does not validate** | High |
| Are latency, throughput, memory, cost, and update behavior production-ready? | **Does not validate**; timing is workload/hardware-specific and incomplete | High |
| May Curiosity commercially ingest the corpora? | **Does not validate**; several rights are NC or unspecified | High |

## Curiosity adoption plan

| Element | Verdict | Rationale |
|---|---|---|
| MTEB 2.19.4 evaluation/metric definitions as an external oracle | **ADOPT** | Mature, inspectable, standard metrics; no code need enter the owned core |
| Frozen English v2 retrieval slice | **ADAPT** | Useful compact semantic regression set, but correlated, public, rights-mixed, and partially pooled |
| Legacy v1/full BEIR slice | **DEFER** | Better full-corpus breadth but expensive, contaminated by common training, and includes MS MARCO NC terms |
| Per-task nDCG@10 plus recall/MRR and lexical/dense/hybrid baselines | **ADOPT** | Separates ranking quality, candidate coverage, and first-hit utility |
| One macro score or leaderboard rank as release gate | **REJECT** | Equal weighting hides use-case and slice failures; Borda depends on compared model set |
| Public MTEB as final model selection set | **REJECT** | Public-test adaptation and unknown pretraining exposure |
| Private, rights-cleared, time-split Curiosity web-search set | **ADOPT** | Required for freshness, authority, multilingual, safety, and workflow fit |
| MTEB dataset content as production training/index data | **REJECT/DEFER per row** | Framework license does not clear component content |

Suggested evidence ladder:

1. **Sanity:** tiny rights-cleared fixtures and deterministic metric checks.
2. **External regression:** frozen MTEB English-v2 retrieval slice; retain
   per-task outputs and overlap flags.
3. **Retrieval ablations:** BM25, dense, sparse, hybrid, rerank, and
   candidate-depth curves on authorized corpora.
4. **Private web set:** navigational/informational/temporal/local/controversial,
   spam and near-duplicate queries; source-level judgments; native-language and
   cross-lingual slices; held-out recent pages.
5. **End to end:** citation and answer faithfulness, research-task completion,
   safety/policy, latency tails, cost, cancellation, and update/freshness tests.

## Unknowns and required checks

| ID | Unknown | Consequence | Required check |
|---|---|---|---|
| U1 | Exact upstream rights to FiQA, NFCorpus, Quora, and TREC-COVID component text | Cannot approve redistribution, training, or production indexing | Dataset-owner terms plus counsel; distinguish annotations, metadata, and source documents |
| U2 | Whether each candidate model's pretraining contains MTEB queries/qrels/corpora | “Zero-shot” comparison may be biased | Provider disclosure where possible; similarity/memorization audit; private set |
| U3 | Whether hard-negative pooling preserves rankings for Curiosity's lexical/hybrid stack | Compact scores may mis-rank system families | Authorized full-corpus versus pool comparison |
| U4 | Current leaderboard's exact prompts/backends for every third-party result | Apparent model differences may include protocol differences | Inspect pinned model metadata and result/run-settings records |
| U5 | Statistical uncertainty and incomplete-judgment sensitivity per task | Small apparent deltas may be noise or unjudged relevance | Query bootstrap, significance test, judgment-depth audit |
| U6 | Correlation with Curiosity web-search and agent outcomes | External benchmark gain may not transfer | Preregistered private evaluation and end-to-end study |

## Bounded curiosity pass

Scoring is **relevance / decision value / novelty / cost**, each 1–5. Only the
highest-value in-frame gap was pursued.

| Thread | Score | Outcome |
|---|---:|---|
| Verify whether “MTEB Retrieval” is still one fixed suite | 5/5/4/1 | **Pursued:** it is ambiguous; v1, filtered v2, and registry-wide selection differ materially [S5][S7] |
| Verify rights from wrapper license labels alone | 5/5/4/3 | **Pursued:** MS MARCO primary terms contradict any blanket permissive assumption; multiple task labels remain unspecified [S8][S18] |
| Enumerate every current retrieval task/language/modal combination | 2/2/2/5 | **CURIOSITY_NO_GO:** registry is rapidly moving and broader than the standalone text-retrieval decision; freeze named benchmark slices instead |
| Reproduce v1↔v2 correlations or leaderboard scores | 4/4/2/5 | **CURIOSITY_NO_GO:** requires downloads/execution and caller authority; paper reports are sufficient for protocol framing |
| Audit every source document's copyright chain | 5/5/3/5 | **CURIOSITY_NO_GO:** legal/content audit exceeds bounded research; recorded as a mandatory pre-use check |
| Compare live Curiosity rankings | 5/5/4/5 | **CURIOSITY_NO_GO:** no benchmark execution or production authority |

**Stop condition:** coverage reached for identity, aggregation, metrics,
protocol, multilinguality, contamination, rights, drift, and Curiosity fit.
Remaining high-value gaps require dataset access, model execution, private
judgments, or legal authority.

## Sources

All sources accessed 2026-08-17.

1. **[S1] MTEB repository README, Apache-2.0 license, and release 2.19.4.**
   https://github.com/embeddings-benchmark/mteb/tree/2.19.4 ·
   https://github.com/embeddings-benchmark/mteb/blob/2.19.4/LICENSE ·
   https://github.com/embeddings-benchmark/mteb/releases/tag/2.19.4
2. **[S2] Muennighoff et al., “MTEB: Massive Text Embedding Benchmark,” v3.**
   https://arxiv.org/abs/2210.07316v3
3. **[S3] Thakur et al., “BEIR,” official repository/dataset inventory.**
   https://github.com/beir-cellar/beir ·
   https://openreview.net/forum?id=wCu6T5xFjeJ
4. **[S4] Enevoldsen et al., “MMTEB,” v4.**
   https://arxiv.org/abs/2502.13595v4
5. **[S5] MTEB 2.19.4 benchmark definitions (`MTEB(eng, v1/v2)`).**
   https://github.com/embeddings-benchmark/mteb/blob/2.19.4/mteb/benchmarks/benchmarks/benchmarks.py
6. **[S6] CQADupStack aggregate definition.**
   https://github.com/embeddings-benchmark/mteb/blob/2.19.4/mteb/tasks/aggregated_tasks/eng/cqadupstack_retrieval.py
7. **[S7] Official task/benchmark selection documentation and current retrieval registry.**
   https://embeddings-benchmark.github.io/mteb/get_started/usage/selecting_tasks/ ·
   https://embeddings-benchmark.github.io/mteb/overview/available_tasks/retrieval/
8. **[S8] MTEB 2.19.4 canonical retrieval task metadata (licenses, revisions,
   prompts, supersession).** Directory containing one source file per task:
   https://github.com/embeddings-benchmark/mteb/tree/2.19.4/mteb/tasks/retrieval/eng
9. **[S9] Current retrieval task protocol.**
   https://github.com/embeddings-benchmark/mteb/blob/2.19.4/mteb/abstasks/retrieval.py
10. **[S10] Current retrieval metrics and evaluator.**
    https://github.com/embeddings-benchmark/mteb/blob/2.19.4/mteb/_evaluators/retrieval_metrics.py ·
    https://github.com/embeddings-benchmark/mteb/blob/2.19.4/mteb/_evaluators/retrieval_evaluator.py
11. **[S11] Official evaluation/prompt documentation.**
    https://embeddings-benchmark.github.io/mteb/get_started/usage/running_the_evaluation/
12. **[S12] Official model metadata/submission documentation.**
    https://embeddings-benchmark.github.io/mteb/contributing/adding_a_model/
13. **[S13] `TaskResult` score/subset/version semantics.**
    https://github.com/embeddings-benchmark/mteb/blob/2.19.4/mteb/results/task_result.py
14. **[S14] Benchmark aggregation and Borda semantics.**
    https://github.com/embeddings-benchmark/mteb/blob/2.19.4/mteb/benchmarks/benchmark.py ·
    https://github.com/embeddings-benchmark/mteb/blob/2.19.4/mteb/benchmarks/_benchmark_metrics.py
15. **[S15] Official result submission/review documentation.**
    https://embeddings-benchmark.github.io/mteb/contributing/submitting_results/
16. **[S16] Official MTEB results repository and CC0 license.**
    https://github.com/embeddings-benchmark/results ·
    https://github.com/embeddings-benchmark/results/blob/main/LICENSE
17. **[S17] DBpedia-Entity collection MIT license.**
    https://github.com/iai-group/DBpedia-Entity/blob/master/LICENSE
18. **[S18] MS MARCO official terms and conditions.**
    https://microsoft.github.io/msmarco/
19. **[S19] Natural Questions upstream repository Apache-2.0 license.**
    https://github.com/google-research-datasets/natural-questions/blob/master/LICENSE

## Confidence summary

| Area | Confidence | Basis |
|---|---|---|
| Suite identity and current task membership | High | Tagged benchmark source plus papers/docs |
| Metrics and aggregation | High | Tagged evaluator/result/benchmark source |
| Hard-negative and multilingual construction | High | MMTEB primary paper plus task metadata |
| Contamination risk | High for existence; low for any model's exact exposure | Primary papers acknowledge overlap; proprietary pretraining remains opaque |
| License labels | High as metadata transcription | Tagged task source |
| Commercial-use clearance | Low / unresolved | Labels do not clear all underlying content; several NC/unspecified cases |
| Transfer to Curiosity web search | Medium | Strong architectural inference, not an executed correlation study |
