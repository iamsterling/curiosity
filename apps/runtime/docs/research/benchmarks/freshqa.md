# FreshQA benchmark assessment

**Research date:** 2026-08-17  
**Decision frame:** Whether and how to use FreshQA as a standalone freshness-sensitive benchmark for owned public-web search and temporal Curiosity. This is a benchmark assessment, not an endorsement of FreshPrompt or its Google/SerpApi implementation.  
**Overall confidence:** High on the 2023 design and the 2026-04-21 artifact inspected; medium on ongoing maintenance and dataset-license scope.

## Executive verdict

**ADAPTED.** FreshQA is a useful, small, human-authored test of current-answer synthesis, false-premise rejection, and one-/multi-hop temporal QA. Use a pinned snapshot as one component of a temporal evaluation suite, not as the sole search benchmark and not as a timeless leaderboard.

Its strongest fit is an end-to-end comparison of (a) model-only answering and (b) the same model with owned search, run at the same time against the same version. It does **not** natively isolate retrieval quality: there are no passage-level relevance judgments, recall denominators, frozen corpora, or required citations. Add owned retrieval and evidence-grounding measures around it.

Do not call the repository's currently linked sheet “weekly fresh” without qualification. As observed on 2026-08-17, the newest named snapshot was **2026-04-21**, its announced next update was **2026-05-11**, the repository's last push was **2026-05-01**, and a 2026-07-31 maintenance-status issue was unanswered. This is a material contradiction between stated cadence and observed availability [S2, S5, S7].

## Bounded questions

1. What exactly is timestamped, refreshed, and versioned?
2. Which question and reasoning types are measured?
3. Can scores distinguish retrieval gains from parametric model knowledge?
4. How are correctness and hallucination graded?
5. What rights and third-party-content constraints apply?
6. What temporal leakage and reproducibility risks remain?
7. What should Curiosity adopt, adapt, reject, or defer?

## Benchmark design

### Original collection and question types

**FACT — high confidence.** The paper defines 600 open-ended questions: a 500-question test set and 100-question development set, balanced at creation across four answer-dynamics categories (125 test and 25 development questions per category). Fifteen additional examples were selected for few-shot demonstrations. Questions were written by NLP researchers/colleagues and Upwork freelancers, then manually reviewed for form, duplicates, validity, answers, and supporting URLs [S1 §2.1].

The four categories are:

- **Never-changing:** answer almost never changes.
- **Slow-changing:** answer usually changes over several years.
- **Fast-changing:** answer usually changes within a year or less.
- **False-premise:** the question must be rebutted rather than answered as posed.

Each category includes **one-hop** and **multi-hop** questions. The maintainers later clarified that multi-hop items are “usually 2-3 hops,” but they do not have an exact range [S8]. The paper notes that categories can change over time; for example, a false-premise relationship question can become valid and fast-changing after a real-world event [S1 §1].

**FACT — high confidence.** To bound maintenance load, the original collection excluded answers expected to change more often than weekly. Annotators supplied the year the answer last changed and a reputable supporting URL; maintainers added valid answer variants and an expected next-review date [S1 §2.1].

### Current artifact inspected

**FACT — high confidence for the inspected sheet.** The named 2026-04-21 Google Sheet exposes these columns: `id`, `split`, `question`, `effective_year`, `next_review`, `false_premise`, `num_hops`, `fact_type`, `source`, `answer_0` through `answer_9`, and `note`. It includes a warning not to submit thumbs-up/down feedback on examples in model web interfaces because such feedback may enter future training [S3].

**INFERENCE — medium confidence.** `effective_year` operationalizes the paper's “year the answer last changed”; `next_review` is a maintenance priority rather than an answer-validity interval. Some values are coarse (`occasionally`, `hardly_ever`, `N/A`) rather than timestamps, so neither field alone provides a machine-verifiable `valid_from`/`valid_to` history [S1, S3].

## Timestamping, refresh, and versioning

**FACT — high confidence.** The paper commits to regular ground-truth updates and asks evaluations to use the latest version as close to its release date as possible. The current README says “weekly or upon request,” links many separately dated Google Sheets, and asks users to report missed updates or misclassifications by sheet comment or email [S1 §2.1; S2].

**FACT — high confidence.** Historical links provide dated snapshots from 2024-02-26 onward, but the repository has no GitHub releases or tags. Data are hosted outside Git in Google Sheets. The repository records README-link changes, not the sheet contents themselves [S2, S5].

**FACT — high confidence.** Maintenance has not been reliably weekly. The link history contains long gaps (for example, 2025-11-24 to 2026-04-21). On 2026-04-17, the owner promised an update and published it on 2026-04-21. By the research date, the README still named 2026-04-21 as latest and 2026-05-11 as next; an open 2026-07-31 issue asked whether maintenance continued [S2, S7].

**INFERENCE — high confidence.** FreshQA's date labels are publication/version labels, not sufficient provenance. A Google Sheet can be edited in place; there is no published content hash, immutable release object, row-level change log, source-access time, reviewer identity, or explicit answer-validity interval. Reproducing “FreshQA April 21, 2026” therefore requires locally pinning an export and hash at run time.

**UNKNOWN.** Whether older linked sheets are guaranteed immutable; whether all row IDs remain stable across reclassification/removal; the exact refresh workflow, number of reviewers, disagreement resolution, and evidence revalidation policy; and whether an unpublished post-2026-04-21 snapshot existed on the research date.

## What it measures—and does not

### Retrieval versus model knowledge

**FACT — high confidence.** The original study ran model-only baselines and search-augmented systems on the same date (2023-04-26). Model-only prompts used temperature 0. FreshPrompt queried Google Search verbatim through SerpApi and supplied result snippets plus metadata; the experiments also compared Google Search snippets, Self-Ask, Perplexity, and GPT-3.5/GPT-4 with FreshPrompt [S1 §§3–4].

**FACT — high confidence.** The best reported GPT-4 + FreshPrompt configuration reached 77.6% strict accuracy with 15 evidences, versus 28.6% for model-only GPT-4 in the main table. The study found gains from additional evidence and smaller but positive effects from ordering and non-organic result features. These are historical findings from a dated proprietary search/model stack, not portable expected scores [S1 §4.3].

**INFERENCE — high confidence.** A paired model-only/search-enabled delta estimates the benefit of the **whole retrieval-augmentation pipeline**, not the retriever alone. FreshQA lacks judged relevant documents, retrieval recall/precision, source-quality labels, citation correctness, and a fixed document collection. Answer accuracy confounds query interpretation, retrieval, ranking, evidence freshness, synthesis, and model knowledge.

**RECOMMENDATION.** For owned search, report at least four same-day conditions with identical prompts/decoder where possible:

1. model-only;
2. owned search snippets;
3. owned search opened-page evidence;
4. oracle evidence from the snapshot's supporting source, where usable.

Record the question-snapshot hash, answer time, query text, index/crawl cutoff, retrieved URLs/content hashes/ranks, model/version, prompt, decoding, tool failures, and grader version. Add `evidence_recall@k`, answer-support coverage, citation entailment, source temporal fitness, abstention, latency, and cost. The oracle gap separates evidence-use failure from retrieval failure more clearly than FreshQA accuracy alone.

### Grading and metrics

**FACT — high confidence.** FreshQA uses binary per-answer accuracy in two modes [S1 §2.2, Appendix A]:

- **Relaxed:** the primary/final answer must be correct; peripheral outdated or hallucinated content can pass if it does not materially alter the primary answer.
- **Strict:** every factual claim must be correct and current; any hallucination fails.

Answers must be confident/definitive or make the correct answer obvious. False-premise items receive credit only when the false premise is identified. Entity names should be complete or commonly recognized; approximate numbers generally fail unless explicitly accepted by the gold answers. The paper interprets the relaxed–strict gap as a hallucination indicator [S1 §2.2].

**FACT — high confidence.** Two authors independently graded 100 responses, agreeing 99% relaxed and 96% strict. FreshEval, a few-shot LLM judge, reportedly agreed with human labels 96.5% relaxed and 96% strict. The README still prefers human factuality review, permits overlap metrics such as exact match/F1/recall, and provides separate relaxed/strict notebooks; its model recommendation (`gpt-4-1106-preview`) is itself obsolete and provider-dependent [S1 §2.2 and Appendix B; S2].

**INFERENCE — high confidence.** Exact match is a poor primary metric for multi-answer paraphrases and premise rebuttals. FreshEval is reproducibility-sensitive because model endpoints drift or disappear, and its published agreement sample does not establish reliability on current Curiosity output styles.

**RECOMMENDATION.** Preserve strict and relaxed accuracy, macro-average by `fact_type`, premise validity, hop count, and effective-year bucket, and publish confidence intervals. Blindly double-grade a stratified sample and adjudicate disagreements. Treat strict-minus-relaxed as “extra-claim error exposure,” not a calibrated hallucination rate. Freeze the judge prompt/model and retain explanations; never let automated grading silently update gold answers.

## Rights and access boundaries

**FACT — high confidence.** The GitHub repository contains an Apache License 2.0 file. It was added in direct response to an issue asking for the dataset's usage conditions, and the owner answered by pointing to that license. This is strong evidence that the maintainers intend Apache-2.0 to cover the dataset as well as code [S4, S6]. Apache-2.0 permits use, modification, and redistribution subject to license-copy, modification-notice, and attribution/notice retention requirements; it does not grant trademark rights and provides no warranty [S4].

**QUALIFICATION / UNKNOWN — medium confidence.** The data itself is linked as an external Google Sheet rather than stored beside the license, and the sheet inspected did not display its own license notice. The repository LICENSE has no filled copyright notice or dataset-specific scope statement. The issue response supports coverage, but a formal rights review should confirm this before redistributing a derived corpus externally.

**FACT — high confidence.** Rows contain links and sometimes text-fragment URLs to third-party sources. Apache-2.0 cannot relicense those third-party pages. FreshPrompt additionally depended on Google results, SerpApi, and proprietary model APIs, each with separate access/terms considerations [S1 §4; S3].

**RECOMMENDATION.** Internal evaluation may reference the pinned questions/answers under the maintainers' apparent Apache-2.0 intent. Preserve the license, citation, original snapshot URL/date/hash, and mark local corrections. Store only minimal evidence excerpts or owned crawl references consistent with source rights; do not treat linked-page content, search snippets, trademarks, or Google Sheet service access as Apache-licensed. Obtain counsel/maintainer confirmation before publishing a modified full dataset.

## Leakage, reproducibility, and validity threats

- **Temporal leakage (FACT/INFERENCE, high):** public questions, answers, and demos have been available since 2023 and can enter model training or vendor evaluation tuning. The 2026 sheet explicitly warns against model-feedback ingestion [S3]. A high score can reflect memorization, especially for unchanged IDs.
- **Current-answer ambiguity (INFERENCE, high):** answers can change between snapshot publication, search crawl, model run, and grading. Same-day execution does not fix a stale gold snapshot.
- **Search non-determinism (FACT/INFERENCE, high):** the paper acknowledges mutable systems and synchronized the original run date. Live rankings, snippets, localization, personalization, index state, and APIs remain unrecoverable unless captured [S1 §4.2].
- **Version drift (FACT, high):** categories may be reclassified and the balanced distribution may change [S1 §2.1]. Cross-version aggregate scores are not directly comparable without a stable intersection and change accounting.
- **Source weakness (FACT/INFERENCE, medium):** the inspected sheet includes many Wikipedia links, some commercial/news sources, and occasional `N/A`; one supporting URL can be unrelated or insufficient. The benchmark's source column is a gold-maintenance aid, not a complete evidence set [S3].
- **Small/curated sample (FACT/INFERENCE, high):** 500 test questions cannot represent real query frequency, locales, languages, high-frequency changes, or all temporal domains. Original balancing is deliberate, not production prevalence [S1].
- **Grader drift (INFERENCE, high):** human factuality checking is costly; closed LLM judges and notebook dependencies change. Reported 2023 agreement does not guarantee 2026 behavior.

### Minimum reproducibility envelope

Pin and hash the exact sheet export; preserve original IDs and all fields; record retrieval and answer timestamps in UTC; freeze model/prompt/tool settings; capture a bounded evidence manifest; run all compared systems in the same window; manually preflight every due/overdue item; quarantine disputed golds before scoring; publish both full-snapshot and unchanged-intersection results; and never overwrite prior scores after a gold refresh.

## Applicability to Curiosity

### Adopt

- The four-way temporal/premise taxonomy and one-/multi-hop slices.
- Paired model-only versus search-enabled same-window evaluation.
- Relaxed and strict answer grading, with human adjudication.
- Explicit next-review scheduling and stable question IDs.

### Adapt

- Mirror each approved snapshot into an immutable internal evaluation artifact with hash, access date, license/provenance, and row-level diffs.
- Add `valid_at`, `gold_verified_at`, source-access time, reviewer status, and machine-readable evidence provenance.
- Separate retriever, evidence, and synthesizer metrics; test provider-neutral owned search rather than reproducing Google/SerpApi-specific FreshPrompt features.
- Add temporal Curiosity cases that require deciding **whether to search**, query reformulation, source disagreement handling, update detection, and calibrated abstention.
- Maintain a private rotating holdout or newly authored “delta” set to reduce public-benchmark memorization.

### Reject

- A single live-sheet URL as the reproducible benchmark identity.
- Claims that FreshQA alone measures search quality or retriever recall.
- Direct comparison to 2023 headline scores as evidence of current superiority.
- Exact match as the only grade; automatic FreshEval as an unversioned oracle.
- Blind reliance on the nominal weekly cadence or on source URLs as sufficient gold evidence.

### Defer

- External redistribution of a modified full snapshot until dataset-license scope is confirmed.
- A longitudinal leaderboard until immutable releases, stable intersections, and gold-change accounting exist.
- Production-weight conclusions until query-frequency and domain-representative temporal sets supplement FreshQA.

## Checks before each run

1. Is there a newer named snapshot, and is its announced next-update date already past?
2. Was the exact artifact exported, hashed, and preserved without editing?
3. Were due/overdue and high-volatility golds independently rechecked at the target time?
4. Are stale/disputed rows quarantined and reported?
5. Are all systems run against the same benchmark, search index window, locale, and clock?
6. Are retrieval traces treated as untrusted data and bounded in count/size/time?
7. Are model-only, search-enabled, and (where possible) oracle-evidence conditions included?
8. Are strict/relaxed accuracy and retrieval/evidence metrics sliced by temporal type, premise, and hops?
9. Are licenses, attributions, source rights, model/API terms, and local modifications recorded?
10. Is leakage disclosed, including possible training exposure and any prompt tuning on the public test set?

## Unknowns requiring owner or legal confirmation

- Exact Apache-2.0 scope for externally hosted sheet data and future versions.
- Whether linked historical sheets are immutable and whether stable IDs have formal guarantees.
- Current maintenance status after 2026-04-21 and the missed 2026-05-11 target.
- Row-level refresh/adjudication protocol and reviewer count.
- Whether source snapshots or source-access dates exist privately.
- Whether current FreshEval has a maintained, reproducible judge configuration.

## Bounded curiosity pass

Scoring scale 1–5; priority favors relevance × value × novelty over cost.

| Thread | Relevance | Value | Novelty | Cost | Result |
|---|---:|---:|---:|---:|---|
| License intent for dataset | 5 | 5 | 4 | 1 | Pursued: issue #2 ties dataset request to Apache-2.0 LICENSE [S6]. |
| Maintenance contradiction | 5 | 5 | 4 | 1 | Pursued: README, commit history, and issues confirm stale cadence [S2, S5, S7]. |
| Exact multi-hop range | 3 | 3 | 3 | 1 | Pursued: owner says usually 2–3, exact range unknown [S8]. |
| Diff every historical sheet | 4 | 4 | 3 | 5 | **CURIOSITY_NO_GO:** prohibited/no-download scope and high cost; adopt row-diff requirement instead. |
| Regrade current 500 rows | 5 | 5 | 2 | 5 | **CURIOSITY_NO_GO:** new empirical study outside bounded source assessment. |
| Benchmark successors (for example SealQA) | 2 | 3 | 3 | 3 | **CURIOSITY_NO_GO:** caller requested standalone FreshQA. |
| Reproduce FreshPrompt | 2 | 2 | 2 | 5 | **CURIOSITY_NO_GO:** implementation/live-service experiment outside frame and access boundaries. |

**Stop condition:** coverage reached for all requested dimensions; the remaining high-value gaps require maintainer contact, legal review, downloads, or empirical execution not authorized by this frame.

## Primary sources

All sources accessed 2026-08-17.

- **[S1] Paper:** Tu Vu et al., “FreshLLMs: Refreshing Large Language Models with Search Engine Augmentation,” arXiv:2310.03214v2 (2023), especially §§1–4 and Appendices A–B. <https://arxiv.org/html/2310.03214v2> (record and version history: <https://arxiv.org/abs/2310.03214>)
- **[S2] Official repository README:** snapshot links, stated cadence, FreshEval instructions. <https://github.com/freshllms/freshqa> (raw: <https://raw.githubusercontent.com/freshllms/freshqa/main/README.md>)
- **[S3] Official 2026-04-21 sheet:** schema and inspected current rows. <https://docs.google.com/spreadsheets/d/1_8mi-yuK30mvoDJu1KQXD6ODem7MKMcIgVAwDSzJkjM/edit?usp=sharing>
- **[S4] Official repository LICENSE:** Apache License 2.0. <https://github.com/freshllms/freshqa/blob/main/LICENSE>
- **[S5] GitHub repository API:** repository metadata, contents, commits, tags, and releases. <https://api.github.com/repos/freshllms/freshqa> and <https://api.github.com/repos/freshllms/freshqa/commits>
- **[S6] Official issue #2 and owner response:** dataset-license request answered by adding/linking LICENSE. <https://github.com/freshllms/freshqa/issues/2>
- **[S7] Official issues #5 and #6:** maintenance questions, April update response, and unanswered July status question. <https://github.com/freshllms/freshqa/issues/5>, <https://github.com/freshllms/freshqa/issues/6>
- **[S8] Official issue #3 owner response:** multi-hop questions are usually 2–3 hops; exact range unavailable. <https://github.com/freshllms/freshqa/issues/3>

## Confidence summary

| Claim area | Confidence | Basis |
|---|---|---|
| Original design, splits, categories, grading | High | Primary paper plus official artifacts. |
| 2026-04-21 schema and latest named snapshot | High | Direct sheet and README inspection. |
| Cadence currently stale | High | README date/target, repo push date, and open issue triangulate. |
| Apache-2.0 intended for dataset | Medium-high | Owner answered dataset-license issue with repository LICENSE; external-sheet scope is not explicit in the sheet. |
| Retrieval cannot be isolated natively | High | Direct absence of retrieval judgments/frozen corpus in design and artifacts. |
| Historical immutability and row stability | Low/unknown | No tags, releases, hashes, or formal guarantee found. |
