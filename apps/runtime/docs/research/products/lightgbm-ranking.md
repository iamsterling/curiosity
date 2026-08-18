# LightGBM LambdaRank/LTR: clean-room behavior and Curiosity implications

**Research and source-access date:** 2026-08-17  
**Version boundary:** released LightGBM **4.7.0** (`8f7036f...`, released
2026-07-18); historical papers are used only to explain the algorithm's origin.
[S1]  
**Decision:** whether, where, and under what evidence gates LightGBM's ranking
model and LambdaRank design should inform Curiosity's owned reranking plane.  
**Status:** research only. No LightGBM code, model, data, package, or generated
binding was copied into this repository; no training or benchmark was run.

## 1. Decision frame and bounded method

### Questions

1. What does LightGBM's `lambdarank` objective actually optimize, and how do
   query groups, ordinal labels, gains, truncation, and NDCG interact?
2. What position-bias treatment exists, what assumptions does it make, and
   what survives into inference?
3. How are missing and categorical values represented, and which schema
   hazards matter for an evolving search index?
4. What is and is not deterministic across training, evaluation, export, and
   serving?
5. What are the operational cost shape, license boundary, clean-room lessons,
   and safe transfer verdicts for Curiosity?

### Method and limits

Primary evidence was the versioned 4.7.0 documentation, release record,
license, C++ ranking objective and metric implementation, Python API, original
LambdaRank/LambdaMART and LightGBM papers, and the paper cited by LightGBM for
the confounding risk in position debiasing. Sources were read, not executed.
Source inspection is behavioral and clean-room: this report describes contracts,
math, state transitions, and observed edge cases without reproducing source.

No relevance dataset, click log, trained model, latency/cost run, numerical
parity test, or legal review was available. Asymptotic costs below are derived
from the inspected loops, not benchmarks. Coverage stopped after the released
4.7.0 implementation, docs, and originating papers converged on every requested
category.

Labels used below:

- **FACT** — directly established by a cited primary source or versioned source.
- **INFERENCE** — a bounded conclusion from those facts, not measured here.
- **RECOMMENDATION** — a proposed Curiosity decision.
- Confidence is **high**, **medium**, or **low**.

## 2. Executive verdict

**RECOMMENDATION — ADAPT now; DEFER model/dependency adoption (high
confidence).** LambdaMART is a strong fit for a *bounded second-stage reranker*:
it produces one inexpensive scalar per query-document row, learns nonlinear
interactions among lexical, provenance, freshness, authority, and diversity
features, handles sparse/missing values, and directly concentrates training on
rank swaps that matter to NDCG. LightGBM 4.7.0 is mature, MIT-licensed, and
exports compact tree ensembles through first-party native interfaces [S1–S6].

It is not a substitute for retrieval, labels, evidence policy, or online
experimentation. Its output is an uncalibrated ordering score, not relevance
probability or factual confidence. LambdaRank optimizes a query-local surrogate;
it cannot repair an incomplete candidate set, label leakage, click-selection
bias, source monoculture, or abuse features. LightGBM's position treatment is a
useful optional correction, but it is not a general proof of unbiasedness and
can itself be confounded by the logging ranker [S7, S8].

For Curiosity:

| Item | Verdict | Reason |
| --- | --- | --- |
| Query-grouped, top-cutoff LTR stage after owned retrieval | **ADOPT architecture** | Correct optimization unit; keeps candidate recall and reranking separable. |
| NDCG delta-weighted pairwise learning and deterministic fallback contract | **ADAPT** | Valuable design even if Curiosity later uses another implementation. |
| LightGBM 4.7.0 binary/package as a runtime dependency | **DEFER** | Requires benchmark, dependency/security review, model governance, and stable labels. |
| Clicks as direct ground-truth relevance labels | **REJECT** | Exposure, position, presentation, and prior-policy effects are not relevance. |
| Display position as an ordinary inference feature | **REJECT** | Creates self-reinforcing rank feedback and serving-policy dependence. |
| LightGBM position decomposition for an experiment | **DEFER / bounded trial** | Plausible correction, but assumptions and export/evaluation behavior need empirical checks. |
| Learned ranker controlling safety, takedown, or agent authority | **REJECT** | Ranking is not policy; hard filters and authority bounds remain outside the model. |

## 3. What LightGBM LambdaRank actually is

### 3.1 From LambdaRank to LambdaMART

**FACT (high):** ranking measures depend on score-induced order, so their
ordinary derivatives are zero or undefined. The 2006 LambdaRank paper introduced
model-output gradients ("lambdas") associated with rank changes rather than
directly differentiating the metric. The 2010 overview defines LambdaMART as the
boosted-tree version of LambdaRank [S9, S10]. LightGBM supplies histogram-based,
leaf-wise gradient-boosted trees as the function learner [S11].

**INFERENCE (high):** calling LightGBM's objective “NDCG loss” is imprecise. It
does not differentiate NDCG. It builds pairwise pseudo-gradients and Hessians,
scales them by the absolute NDCG change that swapping a differently labeled pair
would cause, then fits regression trees to those values [S3]. The learned score
is meaningful mainly through **within-query order**; an absolute threshold or a
comparison of scores from unrelated queries has no documented calibration.

### 3.2 Per-query gradient path

For each boosting iteration and query group, released source 4.7.0 does the
following [S3]:

1. stably sorts rows by current model score, descending;
2. ignores pairs with equal labels;
3. considers pairs for which at least one member's current rank is above the
   configured truncation level;
4. determines the preferred member by larger label;
5. computes a gain gap and the absolute discount gap between the two current
   ranks, normalized by the query's ideal DCG at the truncation cutoff;
6. multiplies a RankNet-style sigmoid pair gradient and Hessian by that
   delta-NDCG weight;
7. accumulates opposite gradients onto the two rows, then optionally normalizes
   the query's lambdas; and
8. applies row weights, if present, before tree fitting.

**FACT (high):** defaults are `sigmoid=1`,
`lambdarank_truncation_level=30`, and `lambdarank_norm=true`.
`lambdarank_norm=false` requests behavior closer to original LambdaRank; the
default additionally divides swap impact by `0.01 + |score difference|` (when
the query has score spread) and applies a final query-level normalization. The
docs describe normalization as useful for unbalanced data [S2, S3].

**FACT (high):** LightGBM also offers `rank_xendcg` / XE_NDCG_MART, documented
as faster with similar performance. It is a stochastic listwise cross-entropy
alternative; the cited paper presents a convex NDCG upper bound and consistency
result, while the implementation seeds per-query random generators with
`objective_seed + query_index` [S2, S3, S12].

**RECOMMENDATION (high):** benchmark `lambdarank` against `rank_xendcg` and a
fixed transparent scorecard, but do not assume the vendor's “faster / similar”
statement transfers to Curiosity's query and label distribution. Keep objective,
all ranking parameters, feature schema, candidate-generator version, and
training-library build in the model manifest.

## 4. Queries, labels, gains, and NDCG

### 4.1 Query groups are a structural boundary

**FACT (high):** ranking requires query metadata. Python `Dataset.group` and
`LGBMRanker.fit(group=...)` accept **group sizes**, not arbitrary query IDs;
their sum must equal row count. Thus `group=[10,20]` means the first ten rows are
one query and the next twenty another. Text input may instead name a query-ID
column, but rows must already be grouped by query ID [S2, S5]. Missing query
information is fatal in both the ranking objective and NDCG metric [S3, S4].

**INFERENCE (high):** accidental row shuffling after constructing group sizes
silently changes the learning problem if lengths still sum correctly. Random
row-level train/test splitting also leaks query intent and can break groups.

**RECOMMENDATION (high):** make `query_instance_id` a first-class immutable
training key, sort once, derive group boundaries mechanically, and assert every
query is wholly contained in exactly one train/validation/test partition. Split
by query family, time, locale, and source regime where relevant—not by row.
Record zero/one-row and all-equal-label group counts; these contribute little or
no pairwise learning signal.

**FACT (high):** version 4.6 introduced `bagging_by_query`; it remains available
in 4.7. This samples whole queries rather than independent rows when bagging is
enabled [S1, S2]. **RECOMMENDATION:** if row subsampling is used for LTR, prefer
query-level sampling so candidate sets are not partially and inconsistently
observed.

### 4.2 Labels and gain mapping

**FACT (high):** ranking labels must be non-negative integer-valued and smaller
than the number of `label_gain` entries. Larger labels mean higher relevance.
The default gain table has 31 entries for labels 0–30 and maps label `r` to
`2^r - 1` [S2, S6]. Labels are stored through a floating metadata type but are
validated as integer-valued; “int” is therefore a semantic constraint, not a
license to pass fractional judgments [S6].

**INFERENCE (high):** gains define the business meaning of a grade. With default
gains, moving from grade 3 to 4 matters much more than moving from 0 to 1.
Changing grade definitions or gains changes both training gradients and NDCG,
so scores from experiments using different gains are not comparable.

**RECOMMENDATION (high):** begin with a small, documented ordinal rubric such as
`0=not useful/unsafe`, `1=weak`, `2=useful`, `3=highly useful`, but derive gains
from adjudicated utility rather than accepting exponential defaults by habit.
Keep hard safety and eligibility outside the label. Use independent double
judgment and adjudication on a sentinel set; report label agreement by grade and
query class.

### 4.3 Exact LightGBM NDCG semantics

For a query, release 4.7.0 computes [S4, S6]:

`DCG@k = sum(rank i < min(k,n)) gain(label_i) / log2(i + 2)`

after a stable descending score sort, and divides by the DCG of the ideal label
ordering. The built-in metric reports a macro average over queries by default.
`eval_at` defaults to `1,2,3,4,5`; `LGBMRanker.fit()` exposes the same defaults
through `eval_at` and uses NDCG as its default metric [S2, S5].

Important edge behavior:

- **FACT (high):** ties retain input row order because sorting is stable [S6].
- **FACT (high):** if a query's ideal DCG is zero (normally all labels have zero
  gain), built-in NDCG contributes **1.0**, not zero or “undefined” [S4].
- **FACT (high):** with row weights, the objective multiplies each row's
  gradient/Hessian by its weight, while metric aggregation derives one query
  weight as the mean row weight and computes a query-weighted mean [S3, S4].
- **FACT (high):** the implementation rejects a query with more than 10,000
  rows [S6].
- **FACT (high):** `lambdarank_truncation_level` controls objective focus and
  ideal-DCG normalization; `eval_at` controls reporting. They are separate.
  Official guidance says set truncation slightly above target `k` (for example,
  `k+3`), not arbitrarily high [S2].

**INFERENCE (high):** all-zero groups can make aggregate NDCG look excellent
without any ranking ability, and tied-score results can vary with input ordering
even when the scores are identical. A single macro NDCG also hides large-query,
tail-query, and no-positive-query behavior.

**RECOMMENDATION (high):** independently recompute NDCG from exported scores;
publish per-cutoff macro NDCG, query-weighted NDCG, confidence intervals, and
slices. Separately report and optionally exclude no-positive groups, with both
counts visible. Define a deterministic external tie-break (for example,
canonical document ID after fixed fallback rank) and use it in offline and
online serving. Optimize the product cutoff, not the library default.

## 5. Position-bias treatment

### 5.1 Contract and mechanism

**FACT (high):** LightGBM accepts one position category per training row through
`Dataset(position=...)`, `set_position()`, or a line-aligned `.position` sidecar.
Position values are categorical IDs: their absolute magnitude and ordering do
not matter. The docs' example uses “above fold” versus “requires scrolling”
[S7]. In 4.7.0, Arrow arrays and Polars series are also accepted by Python's
position path [S1]. The sklearn-style `LGBMRanker.fit()` signature does **not**
expose `position`; the native `Dataset` + `train()` route is therefore the clear
first-party Python path for this option [S5, S7].

**FACT (high):** during LambdaRank training, LightGBM decomposes the score as
`s(x,pos)=f(x)+g(pos)`. Pairwise gradients are calculated using tree score plus
the current learned position-category bias. After each gradient pass, each
position factor receives a regularized Newton-style update. The non-negative
`lambdarank_position_bias_regularization` (default `0`) shrinks inferred bias;
larger values reduce it [S2, S3, S7].

**FACT (high):** the objective's row weights are applied before position-factor
updates. The implementation allocates per-thread accumulators by number of
position categories, then updates every category [S3].

### 5.2 What is returned—and what is not

**FACT (high):** official docs say the learned relevance component `f(x)` is
later returned as the “unbiased model” [S7]. Source agrees: position factors are
mutable objective state used to alter training scores; prediction accepts only
features, not positions; the objective serialization emits its name, and the
position factors are not part of the tree model's prediction interface [S3,
S13].

**INFERENCE (high):** deployed ranking uses only `f(x)`. Position categories are
neither required nor applied at normal inference, and changing the layout after
training does not require passing a new position to the model. Conversely, the
learned `g(pos)` values are not a durable first-party export artifact suitable
for audit; debug logging is not model provenance.

**INFERENCE (medium):** built-in validation NDCG receives ordinary model scores
and the metric implementation does not inspect positions or objective state
[S4]. It therefore appears to evaluate `f(x)` against supplied labels, not the
compound `f+g`. This is desirable for serving parity but potentially confusing
when validation labels themselves are position-biased. A runtime parity test is
still required before relying on this interpretation.

### 5.3 Scope and confounding risk

**FACT (high):** only `LambdarankNDCG` overrides the position-factor update in
released source. `rank_xendcg` inherits a no-op updater, so supplied positions do
not learn a nonzero bias component there [S3]. The configuration parameter is
also documented as LambdaRank-only [S2].

**FACT (high):** the paper LightGBM itself cites warns that two-tower relevance /
bias decompositions can be confounded because displayed position was selected by
a previous relevance-bearing logging policy [S8]. Position also co-varies with
snippet quality, device, vertical, result block, and candidate eligibility.

**RECOMMENDATION (high):** never label this switch “unbiased LTR” without an
identified data-generating argument. Preserve logging-policy/model version,
actual slot and block, device/viewport, propensities where available, and
randomized/interleaved traffic provenance. Compare at least: judged-only model,
raw-click model, position-decomposed model, and a transparent propensity or
counterfactual baseline. Evaluate on human judgments or randomized exposure,
not only on the same biased clicks. Do not expose current serving rank as a
normal relevance feature.

## 6. Features: categorical values, missingness, and leakage

### 6.1 Native behavior

**FACT (high):** LightGBM bins continuous features and learns histogram-based
leaf-wise trees. Missing handling is enabled by default; NaN is missing when
`zero_as_missing=false`. In sparse input, absent entries are ordinary zeros by
default; with `zero_as_missing=true`, explicit and implicit zeros are missing
[S11, S14].

**FACT (high):** native categorical values are cast to signed 32-bit integers.
Negative values are missing, floating values truncate toward zero, compact
consecutive non-negative codes are recommended, and categorical features cannot
be monotonically constrained. LightGBM orders categories at each split by
accumulated gradient/Hessian statistics and searches grouped partitions rather
than requiring one-hot encoding. Small-cardinality categories can use one-vs-rest;
`min_data_per_group`, `cat_smooth`, `cat_l2`, `max_cat_threshold`, and
`max_cat_to_onehot` control regularization and search [S2, S11, S14].

**FACT (high):** with pandas categorical columns, 4.7 aligns prediction
categories to training categories; unseen categories become missing [S14].

### 6.2 Curiosity feature contract

**RECOMMENDATION (high):** use only features available with identical semantics
at candidate-scoring time. Candidate examples worth evaluating include lexical
score/rank, phrase and field matches, document/passage freshness with explicit
missing flags, source type, language match, duplicate-cluster state, historical
quality aggregates with time-safe joins, and bounded link/provenance signals.
Keep candidate-generator rank as a feature only with model/version provenance;
it is a policy signal, not ground truth.

**RECOMMENDATION (high):** version category dictionaries and missing semantics.
Never use Python's process-randomized hash as a category code. Reserve explicit
unknown/other values when that meaning differs from “not observed,” and test
unseen categories. Do not turn on `zero_as_missing` globally when zero has a
real meaning (no clicks, age zero, exact rank zero, absent sparse term): that
would collapse absence and magnitude.

**RECOMMENDATION (high):** prohibit post-outcome and cross-split leakage:
future clicks, judgment aggregates from the test query, eventual crawl success,
future authority, final selected rank, answer citations, or features computed
after reranking. Every feature needs event time, computation version, missing
policy, and online/offline parity checks.

## 7. Training, determinism, and evaluation protocol

### 7.1 Reproducibility boundary

**FACT (high):** `seed` generates other seeds but has lower priority than
explicit `data_random_seed`, `feature_fraction_seed`, `bagging_seed`,
`objective_seed`, and related seeds. CPU-only `deterministic=true` is documented
to stabilize results for the same data and parameters even across thread counts,
but may slow training; docs advise also forcing either column-wise or row-wise
histogram construction. Different LightGBM versions, compilers, systems, or
seeds are expected to differ [S2]. GPU histogram accumulation normally uses
32-bit floating point; `gpu_use_dp=true` uses 64-bit at a speed cost [S2].

**INFERENCE (high):** a seed is not a reproducibility manifest. Candidate row
order also breaks score ties, categorical dictionaries can drift, sampled bin
construction is seeded, and floating reduction/build differences can alter tree
splits.

**RECOMMENDATION (high):** for the audit baseline, pin 4.7.0 build digest,
compiler/runtime, CPU mode, all seeds, `deterministic=true`, one forced histogram
layout, thread count, feature/category schema, exact ordered training captures,
query boundaries, gains, params, and candidate-generator version. Train twice
and require byte-identical model export and prediction vectors. GPU/distributed
variants are separate model families and must pass tolerance plus rank-parity
gates; do not call them bit-reproducible without evidence.

### 7.2 Validation and early stopping

**FACT (high):** `LGBMRanker` defaults to `lambdarank` and NDCG; validation data
requires corresponding `eval_group`. `eval_at` defaults to positions 1–5. The
wrapper warns that ranking is not fully compatible with the sklearn ecosystem
[S5]. LightGBM early stopping can monitor validation metrics; if several metrics
are supplied, all normally participate unless `first_metric_only` is selected
[S2, S13].

**RECOMMENDATION (high):** choose one primary cutoff before tuning, use a
query-disjoint chronological validation set for early stopping, and reserve an
untouched test set. Tune leaf count/depth, minimum leaf/Hessian mass, learning
rate/iterations, regularization, feature/query bagging, categorical controls,
truncation, normalization, and gain mapping under a fixed budget. Report the
full search space and failed trials, not only the winner.

Evaluate more than relevance:

- NDCG and recall of relevant documents at product cutoffs;
- zero-positive, navigational, exploratory, freshness-sensitive, multilingual,
  safety-sensitive, and long/short candidate-set slices;
- host/owner/source-type concentration, near-duplicate rate, primary-source
  recall, and freshness error;
- score/rank stability under missing features, unseen categories, candidate
  insertion/deletion, and tied scores;
- latency, peak memory, model bytes, feature-computation cost, and fallback rate;
- counterfactual/off-policy diagnostics only where logging support is valid;
- online guardrails and randomized experiment outcomes after offline gates.

**RECOMMENDATION (high):** never let aggregate NDCG trade away hard policy,
corpus eligibility, or citation anchoring. Treat diversity as a constrained
post-rank stage or explicitly evaluated objective; plain LambdaRank does not
guarantee it.

## 8. Inference, export, and cost shape

### 8.1 Serving semantics

**FACT (high):** prediction returns one numeric value per row and does not take
groups. The caller must score all candidates, regroup them, sort descending,
apply deterministic ties, and then enforce duplicate/diversity/policy rules.
Python exposes normal scores, leaf indexes, and per-feature contribution output;
for ranking the normal score is effectively the additive tree margin, not a
probability [S5, S13].

**RECOMMENDATION (high):** return `{model_id, feature_schema_id, score,
fallback_reason}` internally, but do not expose score as factual confidence.
Fail closed to a deterministic transparent ranker on missing model, incompatible
schema, non-finite feature, timeout, or model-integrity failure. Bound candidate
count and feature work before model invocation.

### 8.2 Export boundary

**FACT (high):** first-party `Booster` can save/load its model file, serialize to
and from a string, and dump a JSON representation. The CLI can convert a model
to generated C++ conditionals. Python/native C API, CLI, R, and SWIG Java paths
are first-party surfaces [S2, S13, S15]. `save_model()` defaults to the best
iteration if one exists; an explicit non-positive iteration count saves all
trees [S13].

**UNKNOWN:** no first-party ONNX or generic standards-based portable model
contract was found in the reviewed 4.7.0 docs. Third-party converters exist but
were out of frame and must not be assumed semantically exact, especially for
categorical and missing branches.

**RECOMMENDATION (high):** retain the canonical LightGBM artifact plus hash,
exact library/build, feature names/order/types, category dictionaries, missing
rules, parameters, best iteration, training/evaluation manifests, and license
notices. Test native and any alternate runtime on adversarial branch-boundary,
NaN, sparse-zero, unseen-category, and tie fixtures before promotion.

### 8.3 Cost model

**INFERENCE (high, source-derived):** for a query with `n` candidates and
truncation `T`, each LambdaRank gradient pass costs a stable score sort
`O(n log n)` plus up to `O(n * min(n,T))` pair work; it becomes quadratic if
`T >= n`. The implementation also builds a 1,048,576-entry sigmoid lookup table
per LambdaRank objective (about 8 MiB for double values), caches one ideal-DCG
factor per query, and holds per-query temporary score/order vectors [S3].
Position treatment adds a data pass plus per-thread arrays proportional to the
number of position categories [S3].

**FACT (high):** broader LightGBM training cost is dominated by constructing
histograms and fitting the configured number/size of trees; histogram binning,
histogram subtraction, sparse optimization, and categorical partition search
are the central efficiency mechanisms. GPU/distributed modes exist, while
query-level bagging can reduce row work without fragmenting queries [S1, S2,
S11].

**INFERENCE (high):** inference is substantially cheaper: each candidate walks
one path per retained tree, approximately `O(trees * path depth)`, followed by
`O(n log n)` caller-side sorting. No query-pair loop or position-factor update
occurs. Feature extraction may dominate model evaluation, so total rerank cost
cannot be inferred from tree count alone.

**UNKNOWN:** Curiosity's training time, model size, peak RAM, p50/p95/p99
latency, throughput, and quality/cost frontier. No honest dollar estimate is
possible without row/feature/query distributions, hardware, tree budget, and
retraining cadence.

**RECOMMENDATION (high):** benchmark on representative candidate-set-size and
query-length histograms. Record separately: feature fetch, feature assembly,
native predict, score sort, diversification, and serialization. Gate on tail
latency and peak memory, not average model-call time. Start CPU-only with tens to
low hundreds of candidates and a strict tree/depth budget; make GPU training an
offline optimization, not a serving prerequisite.

## 9. License and clean-room transfer

**FACT (high):** LightGBM 4.7.0 is MIT-licensed. The license permits use,
copying, modification, distribution, sublicensing, and sale, but requires its
copyright and permission notice in copies or substantial portions and provides
no warranty [S16]. The 4.7.0 release also moved the project from Microsoft's
GitHub organization to `lightgbm-org`; versioned URLs and commit IDs should be
recorded rather than relying on moving `latest` pages [S1].

**RECOMMENDATION (high):** dependency adoption and clean-room learning are
different choices:

- If using the library or copied/generated model-scoring code, inventory the
  exact artifact, preserve MIT notices, verify transitive/native build
  dependencies and wheel provenance, scan it, and obtain normal dependency
  approval.
- If independently implementing only behavior learned here, use public papers,
  equations, tests, and this behavior report as specifications; do not copy
  source structure, comments, generated C++, fixtures, or model data. Record
  provenance and independent authorship.
- Paper availability is not a software license. Do not copy paper text/figures
  or training datasets merely because an algorithm is public.
- “MIT” does not grant rights in training logs, judged corpora, page content,
  trademarks, patents, or third-party converters. Those require separate review.

**RECOMMENDATION — ADAPTED (high):** transfer query boundaries, ordinal-gain
contracts, delta-at-cutoff thinking, explicit missing/category semantics,
deterministic artifacts, and cheap reranking/fallback architecture.  
**RECOMMENDATION — REJECTED (high):** transfer no source code into this
documentation repository, make no claim that model score is truth, and do not
allow ranking to widen agent authority.  
**RECOMMENDATION — DEFERRED (high):** any LightGBM package, converter, model,
click-log training, or production deployment pending separate reviewed work.

## 10. Curiosity target contract

```text
bounded query + policy context
  -> owned lexical / other candidate retrieval (recall responsibility)
  -> immutable candidate IDs and feature snapshot
  -> hard eligibility / takedown / safety filters
  -> versioned fallback score and optional learned LTR score
  -> deterministic tie-break
  -> canonical/near-duplicate clustering and bounded diversification
  -> anchored passages and provenance
  -> result trace: candidate lanes, model/schema IDs, rank stages, coverage warnings
```

**RECOMMENDATION (high):** train only after Curiosity has stable query/candidate
logs, explicit judgment rights, a judgment rubric, query-level splits, and a
transparent baseline. The first production-worthy learned model must win an
offline gate against that baseline, pass safety/diversity and parity suites,
operate in shadow mode, then pass a bounded online experiment with rollback.
Model refresh must be a reviewed release, not self-directed online learning.

The model card should minimally include:

1. model, library/build, data-snapshot, feature-schema, and candidate-generator
   IDs;
2. query inclusion/exclusion and split logic;
3. label rubric, gains, adjudication, label-source rights, and position-bias
   treatment;
4. all parameters/seeds, early-stopping cutoff, and best iteration;
5. overall/sliced relevance, diversity, safety, freshness, latency, and parity;
6. unknowns, known failure modes, fallback, owner, expiry/retrain trigger, and
   rollback artifact.

## 11. Verification checklist before any adoption

### Data and metric checks

- [ ] `sum(group)==row_count`; all boundaries are positive, contiguous, and
  query IDs do not cross splits.
- [ ] Labels are finite non-negative integers and fit the versioned gain table.
- [ ] Hand-computed toy queries match LightGBM NDCG at every product cutoff,
  including `k>n`, ties, custom gains, and all-zero labels.
- [ ] Independently scored NDCG matches built-in output; all-zero groups are
  counted and reported separately.
- [ ] Validation has its own `eval_group`; row order and external tie-break are
  fixed.

### Feature and model checks

- [ ] Training/serving feature names, order, types, units, clocks, category
  dictionaries, and missing rules are identical.
- [ ] NaN, sparse absent, explicit zero, negative category, unseen category,
  large category ID, and non-finite inputs have expected outcomes.
- [ ] No current/future rank, click outcome, post-selection, or test-judgment
  leakage exists.
- [ ] Two pinned deterministic CPU trainings produce identical artifact hashes
  and predictions; changes of row order, threads, and batch size have understood
  effects.
- [ ] Saved/loaded and alternate-runtime predictions agree at split boundaries;
  the artifact uses the intended best iteration.

### Position-bias checks

- [ ] Position is a logging-time exposure category, not current inference rank.
- [ ] A toy position-only bias experiment changes learned `f(x)` in the expected
  direction, while normal inference takes no position input.
- [ ] Built-in validation is experimentally confirmed to score the exported
  relevance component, and external evaluation uses unbiased judgments.
- [ ] `rank_xendcg` with positions is not mistakenly assumed to debias.
- [ ] Results are robust across position granularity and regularization, and are
  compared with judged-only and counterfactual baselines.

### Operations and governance checks

- [ ] Candidate cap, timeout, memory cap, model hash verification, fallback,
  metrics, shadow path, and rollback are tested.
- [ ] p50/p95/p99 cost is measured by candidate/query class; feature cost is
  separated from model cost.
- [ ] MIT notices, dependency inventory, source/build provenance, and data rights
  are approved.
- [ ] Model score remains internal uncalibrated rank evidence; policy and agent
  permissions cannot be modified by model output or retrieved content.

## 12. Unknowns and confidence

| Issue | State | Confidence / action |
| --- | --- | --- |
| 4.7.0 objective, grouping, NDCG, position, categorical, missing, and export behavior | Direct docs/source evidence | **High**; verify with parity fixtures before use. |
| Whether built-in validation excludes learned position offsets | Strong source inference | **Medium**; run a toy runtime check. |
| Position decomposition removes bias in Curiosity logs | Not established; confounding is plausible | **Low** until randomized/judged evaluation. |
| LightGBM beats transparent scoring or `rank_xendcg` | Unknown | Benchmark on fixed query splits. |
| Best gains, truncation, tree budget, and category strategy | Unknown | Tune within a declared budget; freeze before test. |
| Production latency, RAM, model size, training time, and dollars | Unknown | Measure on target hardware and feature service. |
| First-party ONNX contract | Negative result in reviewed docs | Treat as **unknown/not found**, not unsupported forever. |
| Exact portability across compilers/devices/versions | Explicitly not guaranteed | Pin build; parity-test every promotion. |

Overall confidence is **high** for released 4.7.0 mechanics and **medium** for the
architectural recommendation, because Curiosity has not yet supplied labels or
benchmark evidence.

## 13. Bounded curiosity pass

After synthesis, remaining in-frame gaps were scored 1–5 (higher is more) for
relevance/value/novelty and 1–5 for cost (lower is cheaper).

| Thread | R/V/N/Cost | Action and stop reason |
| --- | --- | --- |
| Confirm position factors survive export/inference | 5/5/4/1 | **Pursued:** docs plus source agree only `f(x)` is returned; normal predict has no position input. Saturated. |
| Confirm NDCG all-zero and tie semantics | 5/5/4/1 | **Pursued:** metric and DCG source establish `1.0` and stable input-order ties. Saturated. |
| Check whether 4.7 changed ranking mechanics from 4.6 | 4/4/3/1 | **Pursued:** released 4.7 source and release notes show API/platform changes but the inspected core mechanics remain as described. Covered. |
| Runtime-test position-adjusted validation | 5/4/4/4 | **CURIOSITY_NO_GO:** no package execution/benchmark authority; recorded as a required check. |
| Benchmark converters and ONNX parity | 3/3/3/5 | **CURIOSITY_NO_GO:** third-party implementation landscape is outside the declared LightGBM core frame. |
| Derive Curiosity hardware cost quote | 4/4/1/5 | **CURIOSITY_NO_GO:** no workload/hardware/model inputs; a number would be fabricated. |
| Survey every LTR algorithm and vendor | 2/2/2/5 | **CURIOSITY_NO_GO:** would not change the bounded LightGBM mechanics decision. |

Stop condition: requested categories are covered, core behavior is triangulated
across docs/source/papers, and the highest-value unresolved item requires future
authorized execution rather than more desk research.

## Sources

All web sources accessed 2026-08-17. Versioned sources are preferred to moving
`stable` / `main` pages.

- **[S1]** LightGBM, “v4.7.0” release, commit `8f7036f...`, 2026-07-18.
  <https://github.com/lightgbm-org/LightGBM/releases/tag/v4.7.0>
- **[S2]** LightGBM 4.7.0, “Parameters” (objectives, seeds, determinism,
  devices, grouping, categorical/missing, LambdaRank and metric parameters).
  <https://lightgbm.readthedocs.io/en/v4.7.0/Parameters.html>
- **[S3]** LightGBM 4.7.0 source, `src/objective/rank_objective.hpp`.
  <https://github.com/lightgbm-org/LightGBM/blob/v4.7.0/src/objective/rank_objective.hpp>
- **[S4]** LightGBM 4.7.0 source, `src/metric/rank_metric.hpp`.
  <https://github.com/lightgbm-org/LightGBM/blob/v4.7.0/src/metric/rank_metric.hpp>
- **[S5]** LightGBM 4.7.0 Python API, `LGBMRanker`.
  <https://lightgbm.readthedocs.io/en/v4.7.0/pythonapi/lightgbm.LGBMRanker.html>
- **[S6]** LightGBM 4.7.0 source, `src/metric/dcg_calculator.cpp`.
  <https://github.com/lightgbm-org/LightGBM/blob/v4.7.0/src/metric/dcg_calculator.cpp>
- **[S7]** LightGBM 4.7.0, “Advanced Topics,” position-bias treatment and
  categorical/missing behavior.
  <https://lightgbm.readthedocs.io/en/v4.7.0/Advanced-Topics.html>
- **[S8]** Zhang et al., “Towards Disentangling Relevance and Bias in Unbiased
  Learning to Rank,” KDD 2023 / arXiv v4.
  <https://arxiv.org/abs/2212.13937>
- **[S9]** Burges, Ragno, and Le, “Learning to Rank with Nonsmooth Cost
  Functions,” NeurIPS 2006.
  <https://proceedings.neurips.cc/paper/2006/hash/af44c4c56f385c43f2529f9b1b018f6a-Abstract.html>
- **[S10]** Burges, “From RankNet to LambdaRank to LambdaMART: An Overview,”
  MSR-TR-2010-82, 2010.
  <https://www.microsoft.com/en-us/research/publication/from-ranknet-to-lambdarank-to-lambdamart-an-overview/>
- **[S11]** Ke et al., “LightGBM: A Highly Efficient Gradient Boosting Decision
  Tree,” NeurIPS 2017, plus versioned feature overview.
  <https://proceedings.neurips.cc/paper/2017/hash/6449f44a102fde848669bdd9eb6b76fa-Abstract.html>
  and <https://lightgbm.readthedocs.io/en/v4.7.0/Features.html>
- **[S12]** Bruch, “An Alternative Cross Entropy Loss for Learning-to-Rank,”
  arXiv 1911.09798 v5 / WWW 2021.
  <https://arxiv.org/abs/1911.09798>
- **[S13]** LightGBM 4.7.0 Python API, `Booster` and Python-package introduction.
  <https://lightgbm.readthedocs.io/en/v4.7.0/pythonapi/lightgbm.Booster.html>
  and <https://lightgbm.readthedocs.io/en/v4.7.0/Python-Intro.html>
- **[S14]** LightGBM 4.7.0, “Advanced Topics,” missing and categorical support.
  <https://lightgbm.readthedocs.io/en/v4.7.0/Advanced-Topics.html#missing-value-handle>
- **[S15]** LightGBM 4.7.0, “Installation Guide” (native library, CLI, GPU/CUDA,
  MPI, Java/SWIG build surfaces).
  <https://lightgbm.readthedocs.io/en/v4.7.0/Installation-Guide.html>
- **[S16]** LightGBM 4.7.0, MIT license.
  <https://github.com/lightgbm-org/LightGBM/blob/v4.7.0/LICENSE>
