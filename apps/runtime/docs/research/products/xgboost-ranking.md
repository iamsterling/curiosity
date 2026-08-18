# XGBoost learning-to-rank: clean-room capability study

**Research and source access date:** 2026-08-17  
**Version frame:** XGBoost **3.4.1**, the latest public release observed on the
research date; mutable `stable` documentation was checked against the `v3.4.1`
source tag where behavior or defaults mattered. [S1][S7][S8]  
**Method:** public XGBoost documentation, release-tagged source, license, and
primary papers only. No model was trained, no package or dataset was downloaded,
and no source code was copied into Curiosity. This is research, not an
implementation, benchmark, security audit, or legal opinion.  
**Evidence labels:** **FACT** is directly supported; **INFERENCE** is a bounded
conclusion from facts/source; **RECOMMENDATION** is Curiosity advice;
**UNKNOWN** was not established. Confidence is high / medium / low.

## Decision frame

**Decision:** Should Curiosity use or adapt XGBoost LambdaMART as an owned,
auditable reranker, and what contracts and safeguards would make that decision
sound?

Bounded sub-questions:

1. What objective, label, query-group, pair-construction, and metric semantics
   does XGBoost actually implement?
2. Is any behavior genuinely listwise, and what does position debiasing require?
3. How do missing features, training topology, evaluation, and reproducibility
   affect ranking correctness?
4. What are the inference, serialization, portability, cost, security, and
   licensing boundaries?
5. Which lessons should Curiosity adopt, adapt, reject, or defer?

Out of scope: measured relevance/latency/cost, a production feature schema,
hyperparameter optimization, non-public implementations, and implementation.

## Executive verdict

**RECOMMENDATION — ADOPT as a controlled classical reranking baseline; ADAPT
the surrounding data/evaluation contracts (high confidence).** XGBoost offers a
mature, Apache-2.0, CPU/GPU-capable LambdaMART implementation with query groups,
graded or binary labels, NDCG/MAP/RankNet objectives, top-focused or sampled
pairs, group-aware metrics, stable model IO, and cross-language inference. It is
a strong fit for scoring a bounded candidate set from Curiosity's retrievers,
especially where tabular lexical, semantic, source, freshness, and quality
features interact nonlinearly. [S2][S3][S7][S12][S15]

It is **not** a retriever, neural cross-encoder, calibrated relevance
probability, true listwise optimizer, policy engine, or complete click-learning
system. Training is pairwise: NDCG and MAP change the weight of pairwise
logistic gradients using the metric delta of a swap. At serving time, the model
emits one scalar per candidate; Curiosity must group, sort, tie-break, enforce
ACL/safety/business rules, and preserve the candidate and feature provenance.
[S2][S8][S9]

Position debiasing is real but experimental and operationally easy to misuse.
It assumes binary clicks presented in within-query display order, jointly
estimates clicked and unclicked position-bias ratios, tracks only a bounded
position range, and is not supported by XGBoost's distributed ranking
interfaces. It should be deferred until Curiosity has trustworthy impression,
position, examination/randomization, and consent/retention contracts plus an
independent editorial-label evaluation set. [S2][S5][S8][S10]

## Reconstructed capability model

```text
retriever(s) -> bounded candidates per query/impression
  -> immutable query/document features + label/click + qid
  -> split by qid; sort rows by qid
  -> pair construction within each query
       topk: all differing-label partners for model-top-k rows
       mean: random differing-label partners per row
  -> pairwise logistic lambdas
       × 1              (rank:pairwise)
       × |delta NDCG|   (rank:ndcg)
       × |delta MAP|    (rank:map)
       × optional position inverse-bias factors
  -> regularized boosted trees
  -> scalar score per candidate
  -> application groups by query, sorts, tie-breaks, applies policy
  -> query-level offline evaluation and controlled online experiment
```

**INFERENCE (high):** The clean architecture boundary is a bounded reranking
stage. XGBoost consumes already generated candidates and numeric/categorical
features; it has no crawler, lexical/vector index, candidate recall mechanism,
query/document encoder, or authorization layer. [S2][S3][S12]

## Objectives, groups, labels, and weights

### Query-group contract

- **FACT (high):** Every training row represents one candidate document. Rows
  are grouped by query either through `qid` (one ID per row) or `group` (the
  ordered size of each group). `qid` rows must be in non-decreasing order.
  `XGBRanker.fit` requires one of these, and validation data needs corresponding
  `eval_qid` or `eval_group`. [S2][S4][S7]
- **FACT (high):** A dataframe can carry a special `qid` column, allowing
  group-aware scikit-learn splitters and search utilities to pass it through.
  The wrapper removes that column before model fitting and prediction; it is
  metadata, not a feature. XGBoost warns that `XGBRanker` cannot fully conform
  to scikit-learn because scikit-learn has no native LTR estimator contract.
  [S2][S7]
- **FACT (high):** Ranking weights are **one weight per query group**, not one
  per document. Release source verifies that the weight vector length equals
  the number of groups and normalizes aggregate group weight. [S7][S8]
- **RECOMMENDATION (high):** Curiosity should define a canonical training row
  key `(dataset_version, split, qid, candidate_id, impression_position)` and
  assert contiguity, group size, unique candidate identity, feature schema, and
  no qid leakage before XGBoost sees the data.

### Objective and label matrix

| Objective | Label contract | Pair delta multiplier | Best fit | Important caveat |
|---|---|---|---|---|
| `rank:ndcg` (XGBRanker default) | Binary or graded relevance. With default exponential gain, non-negative integers `0..31`; gain is `2^rel-1`. `ndcg_exp_gain=false` uses label directly as gain. | Absolute change in query NDCG if the two current ranks swap | Graded search relevance and top-heavy quality | Surrogate pairwise optimization, not direct discrete NDCG optimization |
| `rank:map` | Binary `0/1` only | Absolute change in AP/MAP from the swap | Binary relevance where MAP is the target | Fewer effective pairs than NDCG; inappropriate for graded labels |
| `rank:pairwise` | Ordered relevance values; equal labels form no pair | `1` | RankNet-style robust baseline, especially with limited data | Does not target a position-discounted metric |

Sources: official objective/parameter docs and release source label validation.
[S2][S3][S8][S9]

- **FACT (high):** Multi-output ranking is unsupported; release source requires
  at most one label target. [S8]
- **FACT (high):** Equal-label pairs generate zero gradient and are skipped.
  A query in which every candidate has the same label supplies no useful
  ordering signal. [S2][S9]
- **INFERENCE (high):** Labels express preference only *within* qid. Treating a
  label of `3` on one query as comparable to a `3` on another, or treating raw
  output scores as cross-query calibrated utility, is not justified by the
  ranking objective.
- **RECOMMENDATION (high):** Start with an explicit editorial relevance rubric
  and `rank:ndcg`; preserve raw assessor judgments, adjudication, locale,
  intent, candidate-pool version, and label provenance. Use `rank:map` only if
  the product decision is genuinely binary and MAP is the acceptance metric.

## Pairwise mechanics and the limited listwise behavior

### What is pairwise

**FACT (high):** For a selected pair whose labels differ, XGBoost computes a
RankNet logistic gradient/hessian from the score difference. `rank:pairwise`
uses this directly. `rank:ndcg` and `rank:map` multiply it by the absolute
metric change caused by swapping the documents at their current model ranks.
The resulting per-document lambdas are then used by the ordinary second-order
tree booster. [S2][S9][S11]

**INFERENCE (high):** This is best described as **pairwise optimization with
list-context weighting**. NDCG's IDCG, rank discounts, and MAP's accumulated
relevant counts depend on the full query list, but the primitive training event
is still a pair. XGBoost does not expose a ListNet/ListMLE-style listwise
softmax or permutation likelihood objective. The documentation's phrase
“LambdaMART is a pairwise ranking model” is the controlling description. [S2]

### Pair construction

| Method | Exact release behavior | Default | Cost/control implication |
|---|---|---:|---|
| `topk` | For each row currently in model ranks `0..k-1`, pair it with every lower-ranked row; equal labels are skipped. Approximately `k × |query|`, less for overlap/equal labels. | Method default; `k=32` when pair count unset | Deterministic and top-focused; pair work grows roughly linearly in query length for fixed `k` |
| `mean` | Bucket equal labels, then for each row randomly sample `lambdarank_num_pair_per_sample` partners from other-label buckets. | Pair count `1` when unset | Broader/random regularization; more pairs increase signal and CPU/GPU work |

[S2][S3][S8][S9]

- **FACT (high):** `lambdarank_num_pair_per_sample` means different things:
  sampling count per row under `mean`, but cutoff/truncation depth `k` under
  `topk`. [S2][S3]
- **FACT (high):** XGBoost recommends target-matching objective plus `topk`
  for large data; for smaller data, NDCG or RankNet plus `mean` can create more
  effective pairs. For top-`k` production quality, docs suggest setting the
  training cutoff slightly above the serving cutoff. [S2]
- **FACT (high):** `lambdarank_normalization` defaults true. For `mean`, release
  behavior normalizes by requested pairs per sample; for `topk`, it normalizes
  using aggregate lambda. `lambdarank_score_normalization` also defaults true
  and divides the metric delta by score difference plus a small stabilizer;
  both regularize but can slow/stagnate convergence. [S3][S8][S9]
- **RECOMMENDATION (high):** Make objective, pair method, pair count, gain,
  both normalizations, seed, and package version mandatory manifest fields.
  Defaults have changed materially since 1.7 and should never silently define a
  production experiment. [S2][S3][S6]

## Position debiasing

### Supported behavior

- **FACT (high):** Added in 2.0 and explicitly marked experimental,
  `lambdarank_unbiased=true` enables XGBoost's implementation of Unbiased
  LambdaMART for position-biased click data. The underlying paper jointly
  estimates bias for clicked and unclicked positions while fitting the pairwise
  ranker, instead of requiring a separate propensity model first. [S2][S5][S10]
- **FACT (high):** The official worked example uses binary click labels for
  training, sorts each query's rows by original presentation position, and
  evaluates separately against editorial relevance and clicks. Release source
  uses a row's within-group input index as its observed position and explicitly
  assumes the label/input list is position-sorted. [S5][S8][S9]
- **FACT (high):** The implementation initializes clicked (`ti+`) and unclicked
  (`tj-`) bias-ratio vectors to one, updates them each boosting round, and
  applies their product as an inverse factor to pair gradients. Bias ratios are
  normalized to position zero; source comments caution that this normalization
  breaks a literal probability interpretation. [S8][S9][S10]
- **FACT (high):** Tracked positions are bounded: under `topk`, by the chosen
  truncation `k`; under `mean`, by `min(max_query_length, 32)`. Pairs outside
  the tracked range are not inverse-bias adjusted. [S8][S9]
- **FACT (high):** Position debiasing is **not supported by existing
  distributed interfaces**. [S2]

### Material documentation/source contradiction

**FACT (high):** The mutable parameter page says
`lambdarank_bias_norm` defaults to `2.0`; XGBoost 3.4.1 release source declares
and registers `1.0`. The worked example explicitly sets `1`. The compiled
release source is stronger evidence of actual 3.4.1 behavior, but this mismatch
means Curiosity must set and log the value explicitly and verify `save_config()`
in the installed build. [S3][S5][S8]

### Limits and decision

- **INFERENCE (high):** Row order becomes semantic only in unbiased mode. A
  generic qid sort that does not preserve impression position silently corrupts
  the bias model. Repeated impressions also need distinct groups; combining
  different result lists under one qid creates a fictitious position sequence.
- **INFERENCE (high):** Debiasing position does not remove trust, selection,
  snippet, device, attractiveness, presentation, bot, accidental-click,
  satisfaction, or historical-ranker bias. Nor does observational click data
  establish relevance for never-exposed candidates. The paper and docs only
  claim position-bias treatment. [S2][S10]
- **RECOMMENDATION (high): DEFER.** Before use, require immutable impression
  IDs, displayed candidate order, ranker/policy version, eligibility set,
  device/locale, click definition, dwell/satisfaction policy, bot filtering,
  privacy basis, and controlled exploration or randomized-position evidence.
  Validate against an editorial set and an online guardrail experiment; never
  use click NDCG alone as proof of relevance improvement.

## Features and missing data

- **FACT (high):** Tree boosters support missing values natively. During
  training, XGBoost learns the default branch direction for a missing value;
  `missing` defaults to `NaN`. The linear booster instead treats missing as
  zero, though tree ensembles are the relevant LambdaMART choice. [S13]
- **FACT (high):** Sparse absent entries are treated as missing by tree
  boosters, whereas dense zero is a real numeric value. Converting sparse input
  to dense zero-filled input can therefore change ranking. [S13]
- **FACT (high):** Numerical and native categorical tree features are
  supported. Current Python dataframe inference can preserve/recode stored
  category dictionaries, but cross-language/category pipelines still require
  consistent encoding. Unseen categories need an explicit policy; current docs
  recommend retraining or a trained “unknown” category. [S16]
- **INFERENCE (high):** XGBoost does not know whether “missing” means absent
  source metadata, extractor failure, unsupported provider, timeout, or true
  null. Learned missing branches are useful, but can turn provider outages into
  uncontrolled rank changes.
- **RECOMMENDATION (high):** Curiosity should retain typed feature value plus
  availability/provenance/status. Train explicit availability indicators where
  useful, canary feature-loss scenarios, preserve sparse/dense semantics, and
  reject non-finite/invalid values before model execution. Do not encode qid,
  candidate rank from the target serving policy, label-derived aggregates, or
  post-click facts as ordinary features.

## Training, evaluation, and reproducibility

### Data splitting and evaluation

- **RECOMMENDATION (high):** Split by query group—never by row—to prevent the
  same query's candidates appearing in train and validation. For temporal or
  changing-corpus systems, add forward-time and source/intent slices. A random
  group split alone can overstate generalization to new queries and freshness.
- **FACT (high):** Built-in ranking metrics include `ndcg[@k]`, `map[@k]`,
  `pre[@k]`, ranking AUC, and ranking AUCPR. MAP, precision, and AUCPR require
  binary labels; NDCG supports graded labels. Group scores are averaged, with
  optional group weights. [S3][S7][S14]
- **FACT (high):** XGBoost defines NDCG/MAP for a query with no positive label
  as `1` by default; suffixing the metric with `-` (for example `ndcg@10-`)
  makes it `0`. This choice can materially inflate evaluation when many
  no-positive queries exist. [S3][S14]
- **FACT (high):** Source notes that NDCG prediction ties are ignored, which can
  differ from other implementations. Ranking AUC also has distributed averaging
  caveats and is undefined (`NaN`) for all-positive or all-negative data. [S3][S14]
- **FACT (high):** With early stopping, the last validation set and last metric
  govern stopping. The sklearn estimator automatically predicts through
  `best_iteration`; native `Booster.predict` uses the full model unless an
  iteration range is supplied. [S7][S12]
- **RECOMMENDATION (high):** Predeclare a primary metric such as NDCG@10 and
  report NDCG@1/3/5/10, recall of the upstream candidate pool, no-positive query
  rate, MRR/precision where appropriate, pair accuracy, latency, model size,
  feature missingness, source/locale/intent slices, and worst-query regressions.
  Set the no-positive convention explicitly and cross-check metric values in an
  independent evaluator with an explicit tie policy.

### Reproducibility

- **FACT (high):** XGBoost says results should reproduce with the same hardware,
  software, data, and distributed partitions. GPU ranking objectives and
  metrics have deterministic reduction machinery. General floating-point
  summation, multithreading, and distributed partition changes can still cause
  differences. [S2][S6][S8][S13]
- **FACT (high):** `mean` pair construction is randomized. Even with a seed,
  Microsoft C++ and GCC/Clang/Thrust use differing `minstd_rand` behavior, so
  Windows can differ significantly from Linux. `topk` avoids random pair
  sampling. XGBoost 2.0 also changed LTR defaults and random-seed behavior from
  1.7. [S2]
- **FACT (high):** Distributed LTR can split a query across workers. XGBoost
  describes that as theoretically valid local pair sampling but potentially
  less accurate because pair counts and IDCG/normalization change. Splitting
  every group across workers can be disastrous. Dask and Spark can sort by qid,
  but preserving whole groups may require costly group-by/shuffle. [S2]
- **RECOMMENDATION (high):** Pin release/build, OS/compiler, CPU/GPU, CUDA,
  input format, qid partition plan, feature schema and transforms, all params,
  seed, thread count, train/validation row hashes, candidate/label snapshots,
  and model checksum. Use `topk` for the first reproducible baseline; compare
  reranked document IDs and metrics within declared tolerances, not only model
  bytes.

## Inference, export, and cost

### Serving semantics

- **FACT (high):** Prediction returns one relevance score per row. Ranking
  output is a column vector under strict shape. `XGBRanker.predict` does not
  require qid; if a dataframe contains the special qid column, the wrapper
  strips it. [S2][S7][S12]
- **INFERENCE (high):** Serving pair cost disappears: each candidate traverses
  the trained trees independently, then Curiosity sorts scores within the
  request. A query's candidate set still matters operationally because it
  determines what can win, but it does not change another candidate's raw tree
  score.
- **RECOMMENDATION (high):** Treat score as an ordinal model output, not a
  probability or stable cross-model/cross-query scale. Define deterministic
  fallback and tie-break keys, cap candidate count and feature work, and log
  `(model, feature_schema, candidate_set, raw_score, final_rank, policy_actions)`.

### Portability and export

- **FACT (high):** JSON and UBJSON are stable model formats; UBJSON is default
  since 2.1. Saved models contain trees, relevant model parameters, and the
  objective. Models are backward compatible and portable across XGBoost
  language bindings and CPU/GPU. Memory snapshots such as Python pickle/R RDS
  are not stable across versions. [S12][S15]
- **FACT (high):** Human-readable `dump_model` output is for inspection, not
  reload. Custom objective/metric/callback code is not stored in the model
  format. Native categorical splits require JSON/UBJSON and consistent category
  handling. [S12][S16]
- **UNKNOWN (medium):** No first-party source reviewed establishes ONNX as a
  complete, supported round-trip contract for all XGBoost 3.4.1 ranking and
  categorical models. Third-party converters/runtimes were outside the primary-
  source frame.
- **RECOMMENDATION (high):** Archive `.ubj` or `.json` plus a separate signed
  training manifest, evaluation report, feature schema/encoder, dependency
  lock, and golden inference vectors. Test the exact target binding before
  promotion; do not rely on pickle or a text dump for durable deployment.

### Cost model

- **FACT (high):** XGBoost itself has no per-query license fee. CPU and CUDA
  training/prediction are available; GPU-trained models can run on CPU and vice
  versa. `hist` is the default tree method, `QuantileDMatrix` reduces memory,
  and external-memory training exists but can become IO-bound. [S1][S3][S15][S17]
- **INFERENCE (high):** Ranking-specific gradient cost is approximately
  proportional to selected pairs: about `k × n` for fixed-`k` topk or
  `p × n` for `p` sampled partners, plus per-group sorting, metric state, and
  ordinary histogram tree construction. Serving is approximately candidates ×
  trees × traversed depth plus feature computation and sorting. Release source
  confirms the pair loops, but constants and end-to-end throughput are hardware
  and data dependent. [S8][S9]
- **RECOMMENDATION (high):** Optimize the **whole rerank budget**, not only tree
  prediction. Query/document feature joins or embeddings may dominate. Benchmark
  candidate counts (for example 20/50/100/200), missingness, CPU concurrency,
  model depth/tree count, serialization size, feature fetch, and tail latency.
  Do not assume a GPU is cheaper for small online batches.
- **UNKNOWN (high):** Curiosity-specific training time, memory, model size,
  P50/P95/P99 latency, throughput, relevance lift, retraining cadence, and cloud
  cost remain unmeasured.

## Security, privacy, and license

- **FACT (high):** XGBoost 3.4.1 is Apache License 2.0, including copyright and
  patent grants, redistribution/notice duties, a patent-litigation termination
  clause, trademark limits, and warranty/liability disclaimers. It is not AGPL
  and does not impose a hosted-service source-release obligation. This report
  does not determine obligations of transitive binary dependencies or datasets.
  [S1]
- **FACT (high):** XGBoost warns that loading JSON model files not produced by
  XGBoost can cause undefined behavior and crashes. Python pickle, joblib, and
  cloudpickle are unsafe for untrusted files. Prediction is thread-safe for tree
  boosters, but concurrent mutation/training of the same booster is undefined.
  [S12]
- **FACT (high):** XGBoost's current security disclosure says model and array
  inputs are not comprehensively sanitized and manipulated inputs can cause
  out-of-bounds crashes. Its distributed collective transport has no TLS,
  authentication, or encryption; workers must run on a secured network. Only
  the latest release receives security support, on a best-effort basis. [S18]
- **INFERENCE (high):** A model registry is a code-adjacent trust boundary even
  for “data” formats. Model, feature-schema, and encoder substitution can alter
  search results; click and query logs can contain personal or sensitive data;
  poisoned clicks/labels/features can steer ranking.
- **RECOMMENDATION (high):** Accept models only from a signed, allowlisted build
  pipeline; checksum and scan artifacts; run load/predict in a resource-bounded
  service; never deserialize untrusted pickle; pin dependencies and monitor
  XGBoost advisories. Minimize and access-control impression logs, define
  retention/deletion, aggregate rare queries, and separate user identifiers from
  training rows. Validate numeric/categorical ranges, dimensions, candidate
  count, and feature names before inference.
- **RECOMMENDATION (high):** Maintain a poisoning/fairness audit: provenance and
  anomaly detection for labels/clicks, source/locale/user-cohort slices,
  protected-attribute review, adversarial feature-loss tests, and rollback.
  XGBoost optimizes supplied signals; it supplies no fairness, privacy, ACL, or
  policy guarantee.

## Clean-room implications for Curiosity

### Adopt

1. **Bounded reranking contract.** Retrieve first, score a capped candidate set,
   then apply explicit policy and deterministic tie-breaking.
2. **Query-group-native datasets.** qid is a first-class split, weight,
   evaluation, and provenance boundary—not just another column.
3. **NDCG LambdaMART baseline.** Use explicit cutoffs and all defaults pinned;
   compare every more complex reranker against it on owned labels.
4. **Stable model artifacts.** JSON/UBJSON plus signed manifests and golden
   vectors; cross-language/CPU portability is valuable.
5. **Missing-feature robustness.** Exploit learned default branches, but make
   reason/provenance and outage tests explicit.

### Adapt

1. **Pair-method controls → product depth.** Choose topk slightly beyond the
   number of results users actually inspect; measure deeper regressions.
2. **Built-in metrics → independent evaluation.** Preserve XGBoost metrics for
   training speed, but independently specify ties, no-positive queries, group
   weighting, and uncertainty.
3. **Feature importance/SHAP → diagnostic evidence only.** Contributions can
   help debug a rank decision; they do not establish causality, fairness, or
   factual relevance. [S12][S15]
4. **Distributed training → group-preserving partitioning.** Scale only after
   single-node limits are measured; shard whole qids and validate parity.
5. **Click learning → separately governed pipeline.** Impression position and
   exposure policy must remain immutable evidence, not inferred metadata.

### Reject

1. Row-wise train/test splitting or distributed shuffles that fragment every
   query.
2. Interpreting scores as probabilities or stable values across queries/models.
3. Optimizing click metrics without independent relevance and safety labels.
4. Silent defaults, especially pair cutoff, normalization, no-positive metric
   convention, gain, and the contradicted bias regularizer.
5. Pickle/joblib/cloudpickle as a production model interchange format.
6. Ranking after authorization as a substitute for fail-closed candidate
   filtering; unauthorized documents must never enter a user-visible pool.

### Defer

1. **Position-debiased LambdaMART** until impression integrity, privacy,
   exploration, and editorial counterfactual evaluation are mature.
2. **Distributed LTR** until a single-node baseline proves insufficient and
   whole-qid partitioning is verified.
3. **Native categorical features across heterogeneous runtimes** until category
   dictionary parity and unseen-category behavior pass golden tests.
4. **Third-party export formats/runtimes** until feature parity, missing values,
   categorical splits, early-stopping range, and numerical tolerance are tested.
5. **Replacing a neural reranker.** XGBoost should first complement/stack with
   semantic signals; whether it can replace text interaction models is empirical.

## Verification checks before adoption

1. **Group integrity:** malformed/unsorted qid, empty/singleton/all-tied groups,
   duplicate candidates, fragmented impressions, and group-weight length.
2. **Objective contract:** graded NDCG labels, binary MAP labels, label `31/32`,
   `ndcg_exp_gain=false`, and no-positive query conventions.
3. **Metric parity:** independent NDCG/MAP at cutoffs, score ties, group weights,
   and early-stopping best iteration.
4. **Pair/reproducibility matrix:** topk versus mean; seeds; thread counts;
   CPU/GPU; Linux/Windows; fixed versus changed qid partitions.
5. **Position-bias canary (if later authorized):** preserve within-impression
   display order, inspect learned `ti+`/`tj-`, verify tracked depth, compare
   editorial relevance, and prove distributed mode is disabled.
6. **Feature parity:** sparse-absent versus dense-zero, NaN, provider outage,
   category order/unseen category, feature names/types, and training/serving
   transform hashes.
7. **Serving bounds:** candidate/feature byte limits, malformed values, timeout,
   concurrency, deterministic ties, fallback model, and policy/ACL precedence.
8. **Artifact security:** signed JSON/UBJSON only, corrupted/external JSON,
   forbidden pickle, version upgrade/downgrade, golden vectors, and rollback.
9. **Cost replay:** candidate depths, tree counts/depths, feature-fetch cost,
   CPU/GPU batch size, memory, throughput, and tail latency.
10. **Ranking quality:** head/tail and new queries, intent/locale/source/freshness
    slices, candidate-recall ceiling, worst-query review, and online guardrails.

## Unknowns and retained negative results

- **UNKNOWN:** empirical Curiosity lift, calibration, latency, memory, training
  cost, and robustness; no package execution or benchmark was authorized.
- **UNKNOWN:** the best feature set, candidate depth, objective, pair method,
  cutoff, and retraining cadence for Curiosity.
- **UNKNOWN:** exact tie ordering of all CPU/GPU prediction-sort paths under
  equal floating scores; official metric source says NDCG ties are ignored, so
  Curiosity needs its own tie contract.
- **UNKNOWN:** complete security history and transitive dependency obligations;
  only the project license, model-loading warnings, and current public policy
  pointer were reviewed.
- **NEGATIVE RESULT:** no first-party evidence of a true listwise objective,
  score probability calibration, candidate retrieval, ACL enforcement,
  business-rule layer, or built-in fairness/privacy mechanism was found.
- **NEGATIVE RESULT:** no first-party supported ONNX parity contract was found
  in the reviewed sources.
- **NEGATIVE RESULT:** no support for multi-output LTR or distributed position
  debiasing was found; source explicitly rejects multi-target labels and docs
  explicitly warn on distributed debiasing. [S2][S8]
- **NEGATIVE RESULT:** no guarantee that a qid can be freely split across
  workers without quality impact was found; documentation warns the opposite.
- **NEGATIVE RESULT:** no claim that Unbiased LambdaMART removes biases other
  than position bias was found.
- **NEGATIVE RESULT:** documentation and release source disagree on the default
  `lambdarank_bias_norm`; relying on that default is unsafe. [S3][S8]

## Bounded curiosity pass

Scoring is 1–5 for relevance (R), decision value (V), novelty (N), and cost (C,
lower is better). Priority = R + V + N − C.

| Gap/thread | R | V | N | C | Priority | Outcome |
|---|---:|---:|---:|---:|---:|---|
| Exact pair loops, label checks, normalization, tracked bias depth | 5 | 5 | 4 | 2 | 12 | Pursued in release-tagged source [S8][S9] |
| Debiasing input-order assumption and learned ratios | 5 | 5 | 5 | 2 | 13 | Pursued through example, source, and paper [S5][S8][S10] |
| Defaults/documentation drift | 5 | 5 | 4 | 1 | 13 | Pursued; found `bias_norm` contradiction [S3][S8] |
| Metric no-positive/tie behavior | 5 | 5 | 4 | 2 | 12 | Pursued in parameter docs and metric source [S3][S14] |
| Exact ONNX/operator parity by converter | 3 | 3 | 3 | 5 | 4 | **CURIOSITY_NO_GO:** third-party, version-fragmented, lower value than native stable IO |
| Empirical benchmark/HPO on Curiosity data | 5 | 5 | 4 | 5 | 9 | **CURIOSITY_NO_GO:** no implementation/data-execution authority; requires caller-approved experiment |
| Exhaustive language-binding comparison | 3 | 2 | 2 | 4 | 3 | **CURIOSITY_NO_GO:** provider-neutral contracts and Python/native paths cover decision |
| Historical reconstruction before 1.7 | 2 | 1 | 3 | 4 | 2 | **CURIOSITY_NO_GO:** current 3.4.1 adoption is the frame |
| Reverse engineer unpublished production users | 1 | 1 | 4 | 5 | 1 | **CURIOSITY_NO_GO:** irrelevant and outside clean-room boundary |

**Stop condition:** Coverage was reached for all requested topics; the two
highest-value ambiguities—position-order semantics and the bias-regularizer
default—were resolved or bounded through release source. Remaining material
questions require Curiosity data and authorized experiments, not more public
document reading.

## Source register

All sources were accessed **2026-08-17**. Sources are primary XGBoost project
materials or original papers. Release-tagged source is cited for behavioral
details, not copied into Curiosity.

- **[S1]** XGBoost [3.4.1 release](https://github.com/dmlc/xgboost/releases/tag/v3.4.1)
  and [`v3.4.1` LICENSE](https://github.com/dmlc/xgboost/blob/v3.4.1/LICENSE) —
  version identity, release commit/artifact checksums, Apache License 2.0.
- **[S2]** [Learning to Rank tutorial](https://xgboost.readthedocs.io/en/stable/tutorials/learning_to_rank.html)
  — overview, objectives, pair methods, effective pairs, position bias,
  distributed limitations, version migration, reproducibility.
- **[S3]** [XGBoost parameters](https://xgboost.readthedocs.io/en/stable/parameter.html)
  — ranking objectives/parameters/defaults and built-in metric semantics.
- **[S4]** [DMatrix text/input format](https://xgboost.readthedocs.io/en/stable/tutorials/input_format.html)
  — group-size and qid format, sorting constraints. The internal text parser is
  deprecated; this source is used only for metadata semantics.
- **[S5]** [Official learning-to-rank example](https://xgboost.readthedocs.io/en/stable/python/examples/learning_to_rank.html)
  — MSLR relevance training, click simulation, position ordering, learned-bias
  inspection, editorial-versus-click validation.
- **[S6]** XGBoost [`NEWS.md` 2.0 release notes](https://github.com/dmlc/xgboost/blob/v3.4.1/NEWS.md#200-2023-aug-16)
  — rewritten LTR implementation, default changes, experimental unbiased LTR,
  deterministic GPU objectives/metrics.
- **[S7]** [`XGBRanker` Python API / release wrapper source](https://github.com/dmlc/xgboost/blob/v3.4.1/python-package/xgboost/sklearn.py#L2204)
  — fit/predict/score contracts, special qid column, group weights, evaluation
  metadata, early stopping, custom-objective restriction.
- **[S8]** [`v3.4.1` ranking utilities and objective](https://github.com/dmlc/xgboost/blob/v3.4.1/src/common/ranking_utils.h)
  and [`lambdarank_obj.cc`](https://github.com/dmlc/xgboost/blob/v3.4.1/src/objective/lambdarank_obj.cc)
  — compiled defaults, label/multi-output/group validation, cache, bias vectors,
  normalization, objective registration.
- **[S9]** [`v3.4.1` LambdaRank mechanics](https://github.com/dmlc/xgboost/blob/v3.4.1/src/objective/lambdarank_obj.h)
  — pair loops, random sampling, swap deltas, score normalization, inverse-bias
  weighting, position-index assumption.
- **[S10]** Hu, Wang, Peng, Li,
  [“Unbiased LambdaMART: An Unbiased Pairwise Learning-to-Rank Algorithm”](https://arxiv.org/abs/1809.05818),
  WWW 2019 — original joint clicked/unclicked position-bias method and claims.
- **[S11]** Burges,
  [“From RankNet to LambdaRank to LambdaMART: An Overview”](https://www.microsoft.com/en-us/research/publication/from-ranknet-to-lambdarank-to-lambdamart-an-overview/),
  MSR-TR-2010-82 — primary LambdaRank/LambdaMART algorithm overview.
- **[S12]** [Model IO](https://xgboost.readthedocs.io/en/stable/tutorials/saving_model.html)
  and [Prediction](https://xgboost.readthedocs.io/en/stable/prediction.html) — stable
  models versus snapshots, unsafe pickle/external JSON, output shape, early
  stopping, in-place prediction, thread safety.
- **[S13]** [XGBoost FAQ](https://xgboost.readthedocs.io/en/stable/faq.html) —
  missing/sparse semantics, run variation, portability.
- **[S14]** [`v3.4.1` ranking metric source](https://github.com/dmlc/xgboost/blob/v3.4.1/src/metric/rank_metric.cc)
  — group aggregation, binary checks, NDCG/MAP no-positive behavior, tie note.
- **[S15]** [GPU support](https://xgboost.readthedocs.io/en/stable/gpu/index.html)
  and Chen & Guestrin,
  [“XGBoost: A Scalable Tree Boosting System”](https://arxiv.org/abs/1603.02754)
  — CPU/GPU portability, memory model, scalable regularized tree boosting.
- **[S16]** [Categorical data](https://xgboost.readthedocs.io/en/stable/tutorials/categorical.html)
  — categorical splits, model format, recoding, unseen-category boundaries.
- **[S17]** [External memory](https://xgboost.readthedocs.io/en/stable/tutorials/external_memory.html)
  — out-of-core behavior, memory/IO trade-offs, inference cost context.
- **[S18]** [Security disclosure](https://xgboost.readthedocs.io/en/latest/security.html)
  — pickle risk, unauthenticated/unencrypted collectives, unsanitized model and
  array inputs, supported-version and reporting policy.

## Overall confidence

**High** for 3.4.1 objective/group/label/pair/metric mechanics, model IO,
license, and documented limitations because documentation was triangulated with
release-tagged source. **Medium-high** for the reconstructed cost model and
Curiosity architecture implications. **Low / unknown** for empirical relevance,
latency, cost, calibration, production feature behavior, third-party export
parity, and position-debiasing effectiveness on Curiosity data.
