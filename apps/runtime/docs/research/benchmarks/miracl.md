# MIRACL multilingual retrieval benchmark: clean-room evaluation review

**Research / source access date:** 2026-08-17  
**Scope:** MIRACL as a standalone benchmark for monolingual passage retrieval;
languages, corpora, queries, judgments, metrics, tokenization, rights, leakage,
versioning, reproducibility, and implications for Curiosity.  
**Method:** Public papers, project pages, repository and dataset metadata,
Wikimedia licensing materials, and Pyserini reproduction documentation only.
No MIRACL dataset, corpus, qrels, topics, index, or model was downloaded; no
benchmark was run. A paper PDF was inspected as documentation only.  
**Legal posture:** Technical rights-risk research, not legal advice.

## Decision frame

**Decision:** Should Curiosity use MIRACL to evaluate multilingual retrieval,
and what can be transferred without treating a Wikipedia question-answering
benchmark as proof of multilingual public-web or agent-search quality?

Bounded sub-questions:

1. What language, corpus, query, split, and judgment populations does a MIRACL
   score actually describe?
2. How do candidate pooling, binary judgments, script-specific analysis, and
   model tokenization affect scores?
3. Which rights attach separately to MIRACL-authored material, Wikipedia text,
   papers, repository code, and corpus-generation tooling?
4. Which public releases and documentation gaps prevent blind or exact
   reproduction?
5. Which methods should Curiosity adopt, adapt, reject, or defer?

Labels below are **FACT** (directly supported), **INFERENCE** (reasoned
consequence), **RECOMMENDATION** (proposed action), and **UNKNOWN** (not
established). Confidence is high / medium / low.

## Executive verdict

**RECOMMENDATION — ADAPT as a bounded offline multilingual passage-ranking
slice; REJECT as a standalone validator for multilingual web search or agent
search (high confidence).** MIRACL's strengths are unusually broad native-
language coverage, native-speaker-authored questions, explicit positive and
hard-negative judgments, fixed corpora, and per-language baselines. It tests a
narrow construct: monolingual retrieval of answer-bearing passages from a
historical same-language Wikipedia snapshot. It does not test cross-lingual
retrieval, live-web coverage, freshness, source diversity, authority, safety,
multi-source research, extraction, citations, synthesis, or agent policy.[S1]

**RECOMMENDATION — DEFER acquisition and any commercial redistribution or
shipped fixture use pending an asset-level rights review (high confidence).**
The paper, GitHub repository, and Hugging Face cards label MIRACL Apache-2.0,
but the corpus reproduces Wikipedia article titles and text. Wikimedia's
controlling terms impose the applicable CC BY-SA/GFDL attribution and
share-alike conditions and warn of fair-use material and possible unnoticed
infringement. An Apache label cannot extinguish upstream contributor rights.
The exact license version and attribution path for each 2019/2022 source dump,
and whether MIRACL's `docid` plus title preserves sufficient attribution
lineage, were not established.[S1][S2][S3][S7][S8]

**RECOMMENDATION — if approved, report each language separately and macro
aggregates only as secondary summaries (high confidence).** Freeze the exact
corpus, topic, qrel, scorer, analyzer/tokenizer, title handling, model length,
and code revisions. Treat public dev scores as regression results with
contamination risk, not blind generalization. Audit unjudged top results with
native speakers before interpreting improvements from retrieval families not
represented in the original pool.[S1][S4][S5]

**Overall confidence:** High on task design, counts, construction, official
metrics, principal tokenization hazards, and public license labels; medium on
the practical impact of pool bias and model contamination; low/unknown on
snapshot-specific Wikipedia rights compliance, query copyright ownership,
item-level privacy/defamation residue, and private test-qrel availability.

## Benchmark identity and language coverage

### What it evaluates

- **FACT (high):** MIRACL is ad hoc **monolingual** retrieval: a well-formed
  question and its passage corpus use the same language. The retrieval unit is
  a pre-segmented Wikipedia passage, although the paper uses “document” in the
  generic IR sense. It is not cross-lingual retrieval.[S1]
- **FACT (high):** The final TACL paper reports 18 languages, 106,332,152
  passages from 19,593,919 Wikipedia articles, 78k queries, and more than 726k
  binary query-passage judgments. The languages span 11 scripts, 10 families,
  and 13 sub-families.[S1]
- **FACT (high):** The languages are Arabic (`ar`), Bengali (`bn`), English
  (`en`), Finnish (`fi`), Indonesian (`id`), Japanese (`ja`), Korean (`ko`),
  Russian (`ru`), Swahili (`sw`), Telugu (`te`), Thai (`th`), Spanish (`es`),
  Persian/Farsi (`fa`), French (`fr`), Hindi (`hi`), Chinese (`zh`), German
  (`de`), and Yoruba (`yo`). German and Yoruba were the WSDM 2023 Cup
  “surprise” languages; that distinction ceased to matter after the event.[S1]
- **FACT (high):** Corpus size is extremely uneven: English has 32,893,221
  passages while Yoruba has 49,043 and Swahili 131,924. Dev topics likewise
  range from 119 for Yoruba and 213 for Korean to 2,896 for Arabic.[S1]
- **INFERENCE (high):** Equal-weight language macro averages answer “average
  over these 18 benchmark editions,” not “average user,” “average native
  speaker,” or “average web page.” Corpus and query imbalance also makes equal
  absolute score changes very different in uncertainty and practical reach.

### Splits and origin

- **FACT (high):** Eleven languages inherit queries/splits from Mr. TyDi, which
  in turn derives from TyDi QA: `ar`, `bn`, `en`, `fi`, `id`, `ja`, `ko`, `ru`,
  `sw`, `te`, and `th`. MIRACL rejudged richer candidate sets after rebuilding
  passage segmentation. The seven added languages were built from scratch.[S1]
- **FACT (high):** For inherited languages, train/dev/test-A align to Mr. TyDi
  train/dev/test after removal of queries for which MIRACL found no relevant
  candidate. Test-B consists of newly authored questions. For new known
  languages, new questions were split 50%/15%/35% into train/dev/test-B.
  German and Yoruba have dev and test-B but no train or test-A split.[S1]
- **FACT (high):** Final totals by split are: train 40,203 queries / 343,177
  judgments; dev 13,495 / 130,408; test-A 7,611 / 76,544; and test-B 17,362 /
  174,496. Public Hugging Face files expose train/dev qrels and topic files for
  all applicable splits; the file inventory exposes test-A/test-B topics but no
  test qrels.[S1][S3]
- **INFERENCE (high):** Train/dev/test-A are not independent of the older TyDi
  lineage. Test-A questions were already public before MIRACL. Test-B was a
  genuine competition holdout in 2023, but its topics are now public and the
  benchmark has been widely reported; it is not a defensible blind set for an
  opaque 2026 model.

## Corpus construction

- **FACT (high):** MIRACL uses raw Wikipedia dumps. Existing Mr. TyDi languages
  reuse early-2019 dumps (Thai: 2019-01-01; the others: 2019-02-01). The new
  known languages use 2022-03-01 dumps. The project table links the exact raw
  dump identifiers. The final paper describes German/Yoruba as new languages,
  but the reviewed project table does not state their source-dump dates.[S1][S2]
- **FACT (high):** WikiExtractor converted markup to plain text; images and
  tables were discarded. Two consecutive newlines/natural discourse units
  defined passage boundaries. Each record contains `docid`, article `title`,
  and passage `text`; `X#Y` groups passage `Y` under article `X`.[S1][S2][S3]
- **FACT (high):** The segmentation is more consistent than Mr. TyDi's mixed
  TyDi/custom passages. To reuse old positives, organizers searched each
  relevant Mr. TyDi passage against the new corpus with BM25 and sent either
  the top one or top five likely projections for fresh human assessment.[S1]
- **INFERENCE (high):** Results measure retrieval against the organizers'
  parser and discourse segmentation, not whole-article ranking. Removing
  tables/images excludes information needs answerable only from those media;
  a live-web parser or different chunker changes both retrievable evidence and
  IDs and therefore cannot be compared against qrels without remapping.
- **UNKNOWN:** The exact WikiExtractor revision, invocation, cleanup rules,
  Unicode normalization, redirect handling, namespace filters, and complete
  corpus-build script were not published in the reviewed primary repository.
  In a maintainer response, the author said the MIRACL corpus-preparation
  script was not online and pointed only to similar Mr. TyDi logic.[S6]

## Query and judgment construction

### Query generation

- **FACT (high):** The team hired 31 part-/full-time annotators, interviewed
  them, verified each as a native speaker, trained them consistently, and paid
  USD 18.50/hour (versus a cited local minimum of USD 11.50). Work ran from
  April through September 2022 and exceeded 10,000 hours.[S1]
- **FACT (high):** For new queries, annotators saw the first 100 words of a
  randomly selected Wikipedia article as a prompt. They wrote natural-language
  questions likely to have precise, unambiguous answers, were told not to ask
  questions directly answerable by the prompt, and could skip uninspiring
  prompts. Query generation was completed before seeing retrieval results;
  annotators were not told to keep questions within Wikipedia's scope.[S1]
- **FACT (high):** Automatic checks flagged empty/near-duplicate questions,
  missing language-specific interrogative cues, and length outliers. For
  Chinese/Japanese/Thai, length checks used characters; other languages used
  whitespace tokens. Manual review found roughly 12% with spelling/syntax
  errors or artificial phrasing, but over 99% of those remained understandable
  and were retained.[S1]
- **INFERENCE (high):** These are native-authored questions, not translated
  English, which is a major validity advantage. They are nevertheless
  prompt-elicited, precision-answer-seeking questions, not sampled search logs.
  Prompt choice, permission to skip, and the “precise, unambiguous answer” rule
  condition the topic distribution toward Wikipedia-style factual needs.

### Candidate selection and labels

- **FACT (high):** Each question was run through BM25, mDPR, and mColBERT. Each
  retrieved top 1,000; scores were min-max normalized and averaged; annotators
  judged the fused top 10, plus projected Mr. TyDi candidates where applicable.
  BM25 used the corresponding Lucene language analyzer when one existed,
  otherwise whitespace tokenization. Both neural pool systems were initialized
  from multilingual BERT and fine-tuned on English MS MARCO Passage.[S1]
- **FACT (high):** Judgments are binary (`1` relevant, `0` not relevant), and
  negatives are explicitly assessed rather than inferred merely from absence
  of a positive. Each pair received one primary judgment, not multiple votes.
  Independent native reviewers relabeled random subsets; the paper reports
  average agreement above 80%, with disagreement often involving partial
  relevance or threshold differences.[S1]
- **FACT (high):** Queries with no positive among the shown candidates were
  discarded. The authors explicitly state that a relevant passage could still
  exist outside the pool; five discarded queries per language were spot-
  checked, not exhaustively searched.[S1]
- **INFERENCE (high):** MIRACL is denser than one-positive benchmarks but not
  exhaustive. A label `0` is meaningful for a judged pair; an absent qrel is
  **unjudged**, not nonrelevant. Relevant passages missed by all three pool
  systems cannot receive labels. New lexical/dense architectures, alternative
  tokenization, title-independent retrieval, or source-aware methods may find
  legitimate positives outside the historical pool and be undercredited.
- **INFERENCE (high):** Pooling is partly endogenous: baseline families used to
  construct the labels are also official baselines. MS MARCO tuning in two
  neural pool systems transfers English benchmark/model bias into candidate
  exposure even though MIRACL judgments themselves are native-language.
- **INFERENCE (high):** Removing all no-positive-in-pool questions makes the
  final benchmark conditional on baseline answerability. It cannot measure
  abstention, no-answer detection, or the prevalence of corpus gaps and may
  disproportionately remove needs from smaller Wikipedias.
- **UNKNOWN:** Per-language reviewer sample sizes, pairwise agreement values,
  Cohen's kappa, adjudication outcomes, positive counts per query, annotator
  demographics beyond native-language status, geographic/dialect coverage,
  and inter-split prompt/article overlap were not established in the reviewed
  sources.

## Metrics and interpretation

- **FACT (high):** Official metrics are binary **nDCG@10** and **Recall@100**.
  nDCG rewards known relevant passages near the top, normalized by the ideal
  ranking for that query. Recall@100 measures the fraction of known relevant
  passages retrieved in the top 100.[S1]
- **FACT (high):** The Pyserini reproduction page generates 1,000 hits and shows
  `trec_eval -c -M 100 -m ndcg_cut.10` for nDCG reproduction. The `-c` choice
  includes qrel topics missing from a run; `-M 100` caps judged run depth for
  that evaluation command.[S4]
- **INFERENCE (high):** nDCG@10 and Recall@100 measure rank effectiveness only
  against pooled, binary labels. They do not measure answer correctness,
  passage entailment beyond the assessor threshold, source quality, diversity,
  timeliness, safety, latency, cost, or task completion.
- **INFERENCE (high):** Binary nDCG loses the useful distinction between exact
  answer support, partial answer, merely related material, and high-quality
  alternative evidence. Recall@100 is also only recall of **known pooled
  positives**, not recall over the corpus.
- **RECOMMENDATION (high):** Report nDCG@10 and Recall@100 for historical
  comparability, plus per-query paired intervals, judged/unjudged@k, MRR or
  success@k only as labeled diagnostics, index/query latency, resource cost,
  passage duplication, article/domain concentration, and a native-speaker
  residual judgment sample. Never compare an overall average without the 18
  per-language scores and query counts.

## Script, segmentation, and tokenization hazards

Tokenization does not change qrel-based metric arithmetic, but it materially
changes which candidates reach those metrics.

- **FACT (high):** MIRACL spans 11 scripts. For descriptive lengths and query
  validation, Chinese, Japanese, and Thai are counted in characters; all other
  languages use whitespace-delimited tokens. The final paper explicitly notes
  that not all languages use whitespace as a token delimiter.[S1]
- **FACT (high):** Original BM25 pool construction used a Lucene language
  analyzer “if it exists,” otherwise whitespace. Current Pyserini reproduction
  commands pass a language code for 17 languages, but Yoruba uses a separately
  pretokenized path. Thus “BM25” is a family of analyzer-specific experiments,
  not one language-neutral implementation.[S1][S4]
- **FACT (high):** Released dense indexes encode both `title` and `text`, joined
  with a double-newline delimiter. Maintainers confirmed both fields and the
  default dense encoder maximum length of 256 tokens. The metadata pins one
  example index build to Pyserini commit `2b2856a…` on 2022-10-04.[S5][S6]
- **INFERENCE (high):** Character counts are not comparable across scripts:
  code points, grapheme clusters, combining marks, punctuation, and CJK
  ideographs encode different amounts of linguistic content. Whitespace is
  especially inadequate as a universal lexical boundary for Thai, Chinese,
  Japanese, and potentially punctuation-rich or clitic-heavy text.
- **INFERENCE (high):** Arabic/Persian character variants and diacritics,
  Unicode normalization, German compounding, Finnish morphology, Korean
  morphology, Indic combining characters, Chinese segmentation, Japanese
  script mixing, Thai word breaking, and Yoruba diacritics can all alter term
  matching. Analyzer/version changes can move scores without any model-level
  insight.
- **INFERENCE (high):** A universal 256-subword limit is not a universal amount
  of text. WordPiece fertility differs by language/script; title prefixes
  consume part of the budget, and long passages are silently truncated for the
  reference dense index. Comparing a longer-context model to that index tests
  both ranking and evidence visibility.
- **RECOMMENDATION (high):** Pin and disclose Unicode normalization, locale,
  analyzer and dictionary versions, stemming/stopwords, title inclusion and
  delimiter, model tokenizer files, query/passage max lengths, truncation side,
  special tokens, and pretokenization. Report subwords/character and truncation
  rates by language. A tokenizer change creates a new run condition, not a
  drop-in reproduction.

## Bias, leakage, and validity ledger

| Threat | Evidence / consequence | Classification |
| --- | --- | --- |
| Wikipedia-only domain | Historical encyclopedia passages; no general web, news, commerce, social, forums, code, or local service corpus. | **FACT / high** [S1] |
| Factual-question construct | Questions are elicited to have precise, unambiguous answers. | **FACT / high** [S1] |
| Prompt conditioning | First 100 words of random Wikipedia articles elicit questions; workers can skip prompts. | **FACT / high** [S1] |
| Pooling/exposure bias | Only fused BM25/mDPR/mColBERT top 10 plus projections are judged. | **FACT / high** [S1] |
| Single primary assessor | Each pair is judged once; random review reports >80% average agreement. | **FACT / high** [S1] |
| Binary threshold | Partial/related and exact answer support collapse into 0/1; paper identifies this as a disagreement source. | **FACT / high** [S1] |
| Answerability filtering | Queries with no known positive in the candidate pool are removed. | **FACT / high** [S1] |
| TyDi lineage | Eleven languages inherit public queries/splits and projected positives. | **FACT / high** [S1] |
| Split-generation drift | Final paper finds question-word shift between inherited English splits and new test-B despite similar procedure. | **FACT / high** [S1] |
| Public evaluation exposure | Dev qrels and all test topics are public; years of papers, models, and leaderboard feedback exist. | **FACT / high** [S2][S3][S4] |
| Foundation-model contamination | Wikipedia snapshots, TyDi/Mr. TyDi/MIRACL topics, and derivative models may occur in pretraining/fine-tuning. Exact exposure is provider-specific. | **INFERENCE / medium; UNKNOWN per model** |
| Corpus-size/resource bias | Passage counts vary from 49k to 32.9M; Wikipedia size is itself used as a resource proxy. | **FACT / high** [S1] |
| Geographic/dialect bias | Native-speaker status is documented; country, dialect, class, gender, age, and device/usage representativeness are not. | **UNKNOWN / high** |
| Safety/content bias | Wikipedia may contain errors, objectionable text, personal data, defamation, or unnoticed infringement; no reviewed MIRACL safety audit inventories this. | **FACT for Wikimedia warning; UNKNOWN magnitude** [S7] |
| Article/prompt leakage | Whether randomly selected prompt articles or near-duplicate questions cross train/dev/test was not documented. | **UNKNOWN / medium** |

**RECOMMENDATION (high):** Label present-day runs `public-seen-risk`; require a
model/data contamination statement. Use a separately authored and protected
Curiosity set for release decisions.

## Rights and license analysis

### Assets must remain separate

| Asset | Public statement | Curiosity posture |
| --- | --- | --- |
| MIRACL repository | Root `LICENSE` is Apache License 2.0; no `NOTICE` file was found at the reviewed path. | Apache applies to the repository work to the extent its licensors own it; preserve license and revision. [S2] |
| MIRACL topics/qrels | Paper says “MIRACL dataset” is Apache 2.0; Hugging Face card labels topics/qrels Apache-2.0. | Potentially usable under Apache after confirming authorship/authority, privacy, and exact artifact notices. Do not infer that this resolves corpus rights. [S1][S3] |
| MIRACL corpus packaging | Hugging Face corpus card labels the dataset Apache-2.0. | Metadata/selection may be Apache, but copied Wikipedia title/text remains under upstream terms. Treat as a layered dataset, not Apache-only. [S3][S7] |
| Wikipedia text | Wikimedia's current dump guide says original text is generally GFDL and CC BY-SA 4.0 (some CC-only or additionally licensed), requires controlling Terms review, and warns of fair-use material and possible infringement. Current Terms require attribution and share-alike for reused text. | Attribution/share-alike and item-specific exceptions survive extraction. Determine the license/version applicable to each historical dump; preserve article/history provenance. [S7][S8] |
| MIRACL TACL paper | Published under CC BY 4.0. | Cite/adapt with attribution; this does not license the dataset payload. [S1][S9] |
| WikiExtractor | Current upstream repository exposes AGPL-3.0. | Running an unmodified tool is distinct from copying it. Do not incorporate its source into Curiosity without AGPL review; pin the historical revision if reconstruction is approved. [S10] |
| Pyserini/Anserini, models, indexes | Separate third-party projects/models with separate notices and training-data lineage. | Review each exact revision/checkpoint/index independently; MIRACL's Apache label does not cover them. [S4][S5] |

### Material rights conclusions

- **FACT (high):** Apache 2.0 grants broad copyright/patent permissions for the
  covered “Work,” but disclaims title/non-infringement warranties and does not
  grant rights a contributor does not control.[S2]
- **FACT (high):** Wikimedia requires attribution and share-alike for reused
  text and says underlying page/history and visible additional attribution
  requirements must be checked. Its dump guide warns that some material relies
  on exceptions and that dumps may contain unnoticed infringement.[S7][S8]
- **INFERENCE (high):** The Hugging Face `license: apache-2.0` tag is not a
  reliable whole-corpus rights bill. Wikipedia text cannot be relicensed solely
  under Apache by dataset maintainers absent separate authority. Redistributing
  a corpus, embedding passages in fixtures, or serving passages requires a
  documented upstream attribution/share-alike design.
- **INFERENCE (medium):** Internal scoring against a locally held corpus may
  pose different obligations from redistribution or public serving, but it
  does not erase privacy, contractual, copyright, or provenance duties. Legal
  review must decide the concrete use.
- **UNKNOWN:** Exact source-license version for every 2019/2022 dump; whether
  each MIRACL `X` article ID can be deterministically mapped to the required
  article/history URL; treatment of deleted/suppressed revisions; rights in
  annotator-authored queries and employer assignments; foreign database rights;
  and license treatment of embeddings, indexes, or model weights.

**RECOMMENDATION (high):** Do not commit MIRACL passages, queries, qrels,
indexes, embeddings, or checkpoints to this repository. Do not ship examples or
production artifacts until a rights review approves the exact assets and an
attribution/share-alike/takedown procedure.

## Versioning and reproducibility

### Known drift and contradictions

- **FACT (high):** The October 2022 arXiv v1 described 16 known plus two hidden
  languages and reported approximately 77k queries / 700k judgments. The final
  2023 TACL paper identifies German/Yoruba and reports 78k / 726k with final
  per-split totals. Use the final paper for final statistics.[S1][S9]
- **FACT (high):** Current project/Hugging Face assets use `miracl-v1.0-*` and
  `miracl-corpus-v1.0-*`, but the GitHub repository publishes no Git tags or
  releases. Its latest reviewed commit is `fa3a57c89ad8f61f0a02d8c27167d8141cfd77ca`
  (2024-07-31).[S2]
- **FACT (high):** Hugging Face metadata is internally stale: both cards still
  say they contain only 16 known languages, while API file inventories include
  German and Yoruba. The corpus repository's API revision is `d921ec7e…`
  (last modified 2023-01-05); topics/qrels is `5be20db…` (last modified
  2024-12-29).[S3]
- **FACT (high):** The project page has editorial errors (“Germany” rather than
  German; January releases dated 2022 despite the 2023 competition timeline).
  These do not alter the files but show that a landing-page label is not a
  sufficient version identifier.[S2]
- **FACT (high):** Pyserini offers executable reproduction commands and
  prebuilt indexes, but corpus rebuilding is not fully captured in the MIRACL
  repository. Maintainer clarifications about title inclusion and 256-token
  truncation appeared only in 2024 issue comments/documentation.[S4][S5][S6]

### Required run manifest

**RECOMMENDATION (high):** A reproducible result must pin:

1. all 18 or an explicit language subset; per-language corpus, split, topic,
   and qrel filenames plus cryptographic hashes and byte counts;
2. Hugging Face repository commit IDs and captured dataset cards/licenses;
3. dump date/identifier, parser revision/options, segmentation, record count,
   article-ID mapping, title handling, and corpus-build checks;
4. full retrieval versus reranking, hit depth, ANN/exact-search settings,
   deduplication, score normalization/fusion, and deterministic tie handling;
5. lexical analyzer, dictionaries, stemming, stopwords, Unicode normalization,
   pretokenization, and Lucene/Anserini/Pyserini revisions;
6. model/checkpoint/tokenizer immutable IDs, training lineage, max lengths,
   truncation, title/text delimiter, quantization, hardware, seeds, and library
   versions;
7. exact scorer implementation/command, `-c`/topic inclusion, qrel threshold,
   cutoffs, duplicate/missing ID behavior, and per-query outputs;
8. contamination disclosure, development/tuning history, native-speaker residual
   judgments, confidence intervals, latency, compute, and failures.

**CHECK:** First reproduce one published per-language BM25 result from the exact
official index/toolchain. Any mismatch blocks comparative conclusions until
corpus, analyzer, topics, qrels, scorer, and title settings are reconciled.

## Clean-room use for Curiosity

If acquisition is separately approved:

1. Obtain only from official project/Wikimedia endpoints; capture terms,
   revisions, hashes, attribution sources, approval, users, and purpose.
2. Keep all dataset content in segregated non-production storage outside this
   repository; do not place corpus text in logs, traces, third-party prompts,
   telemetry, examples, or caches without explicit approval.
3. Treat every passage as untrusted text. Never render active markup or execute
   content; cap candidates, bytes, time, memory, and model calls.
4. Freeze retrieval before final evaluation; separate public-dev iteration from
   a Curiosity-owned protected test set.
5. Audit a blinded sample of unjudged top results per language using qualified
   native assessors; preserve `relevant`, `partially relevant`, `nonrelevant`,
   and `unjudged` rather than coercing missing qrels to negatives.
6. Publish only approved aggregates and attribution; maintain deletion,
   correction, takedown, and derivative-artifact ledgers.
7. Do not reverse engineer proprietary competition infrastructure or recover
   hidden qrels. Public formats and mathematical metric definitions are enough
   to build an independent Curiosity evaluator.

## Curiosity evaluation implications and verdicts

| MIRACL element / lesson | Verdict | Curiosity treatment | Confidence |
| --- | --- | --- | --- |
| MIRACL as proof of multilingual web search | **REJECTED** | Wikipedia factual passage retrieval is too narrow. | High |
| MIRACL as proof of agent search | **REJECTED** | No planning, browsing, synthesis, citation, stopping, or task-success labels. | High |
| Approved offline passage-ranking slice | **ADAPTED** | Useful for same-language historical Wikipedia retrieval only. | High |
| Commercial redistribution / shipped fixtures | **DEFERRED** | Resolve Apache versus Wikipedia rights layers and attribution first. | High |
| Native-authored rather than translated queries | **ADOPTED** | Curiosity should author/judge in-language, not translate an English master set. | High |
| 18-language typological spread | **ADAPTED** | Preserve breadth but add Curiosity traffic, locale, dialect, and script strata. | High |
| Per-language reporting | **ADOPTED** | Mandatory; macro averages secondary, uncertainty explicit. | High |
| Explicit hard-negative judgments | **ADOPTED** | Keep explicit negatives distinct from unjudged candidates. | High |
| Top-10 three-system judgment pool | **REJECTED as sufficient** | Use deeper, family-diverse pools plus residual judging/active recall. | High |
| Binary relevance only | **REJECTED** | Add grades for exact support, partial answer, relation, authority, freshness, and harm. | High |
| Removing no-positive queries | **REJECTED for product evaluation** | Retain no-answer/corpus-gap tasks and score abstention separately. | High |
| Fixed discourse passages with article lineage | **ADAPTED** | Keep immutable chunk-to-source lineage, but evaluate chunking separately. | High |
| nDCG@10 + Recall@100 | **ADAPTED** | Historical metrics plus judged-rate, uncertainty, cost, safety, and end-to-end evidence metrics. | High |
| One analyzer/tokenizer policy for all scripts | **REJECTED** | Language-aware, versioned analysis with cross-script diagnostics. | High |
| Public dev/test topics as release gate | **REJECTED** | Public-seen-risk regression only; protected Curiosity final sets decide release. | High |
| Surprise-language idea | **ADAPTED** | Test a protected no-tuning language/locale transfer slice, with ethical native review. | Medium |

## Unknowns, negative results, and required checks

- **UNKNOWN:** Exact historical license/version and attribution requirements for
  each source dump and whether current corpus records preserve sufficient page
  history lineage.
- **UNKNOWN:** Whether test-A/test-B qrels remain available through a maintained
  evaluator, who controls them, and the current leaderboard rules. EvalAI did
  not return usable public details during this review.
- **UNKNOWN:** Exact per-language positive density, reviewer sample sizes and
  agreement, assessor demographic/dialect coverage, and discarded-query rates.
- **UNKNOWN:** Cross-split prompt/article/query overlap and item-level model
  contamination.
- **UNKNOWN:** Exact corpus-build code and environment, German/Yoruba dump
  dates, and whether all original raw dump links remain byte-identical.
- **NEGATIVE RESULT:** No source supports calling MIRACL a cross-lingual,
  multilingual live-web, or end-to-end agent benchmark.
- **NEGATIVE RESULT:** No basis was found to characterize copied Wikipedia text
  as Apache-2.0-only merely because the repository/dataset cards say Apache.
- **NEGATIVE RESULT:** No tags/releases or complete MIRACL corpus-generation
  script were found in the official repository.
- **NEGATIVE RESULT:** No benchmark data was downloaded and no empirical score,
  corpus audit, privacy scan, or tokenization experiment was performed.

**Pre-use checks:** legal approves the exact layered assets; hashes and terms
are captured; corpus-to-article attribution is proven; a published baseline is
reproduced; tokenization/truncation is audited per language; public exposure is
disclosed; unjudged results are residually judged; and no dataset-derived
artifact can enter production without a separate review.

## Bounded curiosity pass

Scores are 1–5 for relevance (R), decision value (V), novelty (N), and cost (C;
lower is better). Priority = R + V + N − C.

| Thread | R | V | N | C | Priority | Outcome |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Apache dataset label versus Wikipedia rights | 5 | 5 | 5 | 2 | 13 | **Pursued.** Confirmed layered-license conflict; retained snapshot-specific compliance as unknown.[S2][S3][S7][S8] |
| Final paper versus stale 16-language cards | 5 | 4 | 4 | 1 | 12 | **Pursued.** Final 18-language totals and German/Yoruba files confirmed; metadata drift recorded.[S1][S3] |
| Script/tokenization and dense truncation | 5 | 5 | 4 | 2 | 12 | **Pursued.** Character/whitespace split, Yoruba pretokenization, title+text, and 256-token limit confirmed.[S1][S4][S5][S6] |
| Exact corpus reconstruction | 4 | 5 | 4 | 4 | 9 | **Pursued to boundary.** Official script absent; similar Mr. TyDi code is not an exact recipe. No dataset reconstruction attempted.[S6] |
| Hidden test-qrel recovery | 2 | 2 | 3 | 5 | 2 | **CURIOSITY_NO_GO:** outside clean-room need; do not probe competition infrastructure. |
| Download corpus to measure normalization/privacy | 4 | 4 | 3 | 5 | 6 | **CURIOSITY_NO_GO:** explicitly prohibited by caller; requires separate data/rights authority. |
| Per-model contamination census | 4 | 4 | 3 | 5 | 6 | **CURIOSITY_NO_GO:** unbounded and provider-specific; require run-time model review. |
| Item-level Wikipedia license reconstruction | 5 | 5 | 3 | 5 | 8 | **CURIOSITY_NO_GO:** 106M passages and historical revisions exceed budget; legal/data-governance project required. |

**Stop reason:** coverage and saturation. The highest-value gaps—asset-level
rights, final-vs-stale version identity, and script/tokenization details—were
resolved enough to bound the decision. Remaining material questions require
dataset acquisition, native-speaker empirical work, counsel, private evaluator
access, or model-provider manifests, all outside this authorized frame.

## Source ledger

All sources accessed **2026-08-17**.

- **[S1] Zhang et al., “MIRACL: A Multilingual Retrieval Dataset Covering 18
  Diverse Languages,” TACL 11 (2023), pp. 1114–1131.** Final peer-reviewed task,
  corpus/query/judgment construction, quality control, counts, metrics,
  typology, splits, baselines, and limitations. Paper is CC BY 4.0.
  https://aclanthology.org/2023.tacl-1.63/
- **[S2] MIRACL official project site and `project-miracl/miracl` repository.**
  Dataset links/counts, dump identifiers, record schema, v1.0 naming, baseline
  pointers, repository Apache-2.0 license, commit history, and absence of
  tags/releases/NOTICE at reviewed paths.
  https://project-miracl.github.io/ and
  https://github.com/project-miracl/miracl
- **[S3] Official Hugging Face datasets: `miracl/miracl` and
  `miracl/miracl-corpus`.** Public file inventories, repository revisions,
  Apache-2.0 card labels, topic/qrel/corpus schema, and stale 16-language prose.
  https://huggingface.co/datasets/miracl/miracl and
  https://huggingface.co/datasets/miracl/miracl-corpus
- **[S4] Castorini, Pyserini MIRACL two-click reproductions.** Current reference
  commands, per-language baselines, language/pretokenized analyzer paths,
  retrieval depth, and scorer flags.
  https://castorini.github.io/pyserini/2cr/miracl.html
- **[S5] Castorini, Pyserini MIRACL dense-index metadata.** Pinned index date and
  commit, `title text` fields, delimiter, encoder, and build command.
  https://github.com/castorini/pyserini/blob/master/pyserini/resources/index-metadata/faiss.miracl-v1.0.20221004.2b2856.mdpr-tied-pft-msmarco-ft-all.README.md
- **[S6] MIRACL repository issues #17–#19 and maintainer responses.** Missing
  exact corpus-preparation script, reference-index title/text use, and confirmed
  256-token dense-encoding length.
  https://github.com/project-miracl/miracl/issues/17,
  https://github.com/project-miracl/miracl/issues/18, and
  https://github.com/project-miracl/miracl/issues/19
- **[S7] Wikimedia Foundation, dump License Information.** Current layered text
  licensing, controlling-Terms caveat, fair-use exceptions, and potential-
  infringement warning. https://dumps.wikimedia.org/legal.html
- **[S8] Wikimedia Foundation Terms of Use, section 7.** Attribution,
  share-alike, imported-text, page-history, modification, and reuse duties.
  https://foundation.wikimedia.org/wiki/Policy:Terms_of_Use
- **[S9] arXiv v1 record for 2210.09984 and Crossref DOI record.** Initial 2022
  16-known/2-hidden version and final publication/license metadata.
  https://arxiv.org/abs/2210.09984 and
  https://api.crossref.org/works/10.1162/tacl_a_00595
- **[S10] `attardi/wikiextractor` current repository license.** Current
  WikiExtractor AGPL-3.0 license; not proof of the revision used in 2022.
  https://github.com/attardi/wikiextractor/blob/master/LICENSE

### Confidence summary

- **High:** benchmark task, language list, split/corpus counts, query and pool
  construction, binary label process, official metrics, published quality
  controls, v1.0 naming, analyzer/truncation hazards, and current public license
  statements.
- **Medium:** magnitude of pool bias, contemporary contamination, and practical
  share-alike treatment of indexes/embeddings.
- **Low/unknown:** exact item-level rights and provenance, organization-specific
  commercial posture, demographic representativeness, private test evaluator,
  corpus-build reproducibility, and model-specific prior exposure.
