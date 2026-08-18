# FACTS benchmarks: identity and applicability to Curiosity

**Research date:** 2026-08-17  
**Decision frame:** identify what the unqualified `FACTS` entry in the Curiosity
search-evaluation landscape most likely denotes, without silently collapsing
different releases; determine what each candidate measures and whether it is a
valid retrieval, search-agent, or synthesis evaluation. This is a research
dossier, not legal advice.

## Executive verdict

**INFERENCE (medium-high confidence):** the dossier most likely intended
**Google DeepMind/Google Research's FACTS Search**, now one component of the
four-part **FACTS Benchmark Suite**, rather than the earlier standalone FACTS
Grounding benchmark. The local landscape places `FACTS` among search/retrieval
corpora, the suite existed before that landscape's 2026-08-17 date, and FACTS
Search is the only named FACTS component that invokes web search [S1, S2]. The
local text provides no citation or qualifier, however, so this identity is not
proved.

Do **not** treat “FACTS” as one stable dataset:

1. **FACTS Grounding v1** (announced 2024-12-17; paper 2025-01-06) evaluates
   long-form answers against a document already supplied in the prompt. It is
   synthesis/grounding evaluation, not retrieval [S5, S6].
2. The **FACTS Benchmark Suite / FACTS Leaderboard** (announced 2025-12-09;
   paper 2025-12-11) combines FACTS Search, Parametric, Multimodal, and
   Grounding v2 [S2, S3].
3. **FACTS Search (2025 paper release)** is an end-to-end search-*use* task:
   the model chooses searches against a common Brave Search API and produces a
   short answer. It does not expose passage relevance judgments or separately
   score retrieval [S2].
4. **FACTS Search V2** is the title of the live Kaggle page as observed on the
   research date, but neither the 2025 paper nor the accessible static page
   describes V2's changes [S4]. Results labeled merely “FACTS Search” therefore
   need a benchmark-version declaration.

**Verdicts**

- **ADOPT (method):** the Search benchmark's hard-tail and multi-source question
  design, immutable-answer filter, search-off filter, and answer/abstention
  reporting.
- **ADAPT (Curiosity evaluation):** run rights-cleared public questions against
  a pinned Curiosity snapshot and add retrieval judgments, source provenance,
  citation correctness, freshness, diversity, latency, cost, and failure-class
  metrics.
- **DEFER (dataset run):** current FACTS Search V2 until its prompt set, tool
  contract, scorer, rights files, and version identifier can be archived and
  reviewed.
- **REJECT (scope claim):** neither FACTS Search answer accuracy nor the overall
  FACTS Score is a standalone benchmark of Curiosity's crawler, index, recall,
  ranking, or citation retrieval.
- **ADAPT (Grounding):** use Grounding only as a post-retrieval synthesis stress
  test, subject to per-document rights review.
- **REJECT (data foundation/training):** do not infer that the Kaggle-level
  Apache-2.0 label grants rights in every embedded web document or image; do not
  use these assets as production training or index data without provenance and
  rights clearance.

## Candidate and release disambiguation

| Candidate | Origin/release | What it is | Search/retrieval relevance | Identity verdict |
| --- | --- | --- | --- | --- |
| FACTS Grounding v1 | Google DeepMind + Google Research; 2024 announcement, arXiv:2501.03200v1 | 1,719 prompt/document/request examples in the original report: 860 open and 859 blind; documents up to 32k tokens | No search. The document is oracle input. Measures instruction fulfillment and document-grounded generation [S5, S6]. | **Not the best fit**, but plausibly what an older unqualified reference meant. |
| FACTS Benchmark Suite / Leaderboard | Google DeepMind + Google Research + Kaggle; arXiv:2512.10791v1 | Four equal-weight factuality components: Search, Parametric, Multimodal, Grounding v2 | Only Search directly exercises web search. Aggregate score mixes unrelated capabilities [S2, S3]. | **Umbrella identity; likely intended family.** |
| FACTS Search, 2025 report release | Component of the suite | 1,884 short-answer questions: 890 public, 994 private; common Brave Search API [S2] | End-to-end tool selection + retrieval interaction + synthesis + answer production. No retrieval-only score. | **Most likely intended benchmark.** |
| FACTS Grounding v2 | Component of the suite | Same prompts as v1; evaluator changed to Gemini 2.5 Flash and GPT-5 with a revised judge prompt [S2] | Synthesis/grounding only. Scores are not directly comparable to v1 because judges changed. | **Relevant secondary benchmark.** |
| FACTS Parametric | Component of the suite | 2,104 closed-book atomic QA pairs, split 1,052/1,052; answers supported in Wikipedia [S2] | Search is prohibited; useful only as a search-off baseline or routing diagnostic. | **Not a search benchmark.** |
| FACTS Multimodal | Component of the suite | 711 public + 811 private image questions, rubric-scored for coverage and contradiction [S2] | No direct public-web retrieval test. | **Out of frame for current search architecture.** |
| FActScore and similarly named FACT/FACTS projects | Separate authors and methods | Atomic-fact precision metric and unrelated fact-checking/retrieval projects | Potential complementary measures, but not branded as Google's FACTS Leaderboard [S10]. | **Rejected as the referent absent additional evidence.** |

**FACT (high confidence):** the suite paper is arXiv v1 only as of the research
date and is licensed CC BY 4.0 as a *paper* [S2]. That license statement does not
by itself license the benchmark payloads or their third-party source material.

**UNKNOWN:** whether the local author originally saw the 2024 Grounding release,
the 2025 suite, or a secondary list retaining the old unqualified name. Resolve
by obtaining the source/transfer note for the landscape row; do not rewrite the
row to `FACTS Search` solely from this inference.

## FACTS Search (2025 report release)

### Tasks and sources

The paper divides 1,884 questions into four construction slices [S2]:

| Slice | Reported final size | Construction and intended difficulty |
| --- | ---: | --- |
| Hard Tail | 328 | Human-authored questions whose answer was not a first-page, single-step extraction and that Gemini 1.5 with search could not solve. |
| Wiki Two-Hop | 932 | Wikipedia-abstract QA about tail entities, with the target entity replaced by a Google Knowledge Graph-derived relational description. Search-on and search-off Gemini checks were low (reported 38% and 30%). |
| Wiki Multi-Doc | 268 | Gemini-synthesized questions requiring a seed Wikipedia document plus one or more related documents; critic filtering and a search-enabled Gemini hardness filter. |
| KG Hops | 356 | Composed path queries over Google Knowledge Graph, sometimes with an aggregation such as earliest or maximum. |

Three independent human raters checked **correctness, uniqueness, and expected
five-year immutability**; all three had to accept. The final pool excluded items
Gemini 2.5 Flash could answer without search [S2].

**FACT (high):** all leaderboard models were given the same described search
tool, backed by the Brave Search API; a tool call's API output was appended to
model context [S2]. This standardizes the provider for comparing *models*.

**INFERENCE (high):** that standardization intentionally removes custom search
engines as an experimental variable. Consequently, the published leaderboard
cannot establish that Curiosity retrieves or ranks better than Brave. Replacing
Brave with Curiosity changes the evaluated system and forfeits direct
leaderboard comparability, but is still useful as a controlled internal test.

### Metrics

The 2025 release uses Gemini 2.0 Flash as an autorater given the question,
candidate response, and gold answer. It labels the response correct, incorrect,
or not attempted [S2]. Reported measures are:

- **accuracy** (primary suite component; fraction correct over all questions),
- **attempted accuracy** (accuracy conditioned on attempts),
- **hedging/not-attempted rate**,
- **F1**, described for the analogous Parametric grader as the harmonic mean of
  accuracy and attempted accuracy, and
- **average number of searches** [S2].

The suite's overall **FACTS Score** averages each component's public/private
accuracy, then averages the four component accuracies equally [S2]. It is a
model-factuality summary, not an information-retrieval metric.

### What it does and does not isolate

**Measured jointly:** query planning, deciding when to search, reformulating
queries, reading returned snippets/results, multi-hop synthesis, answer
formatting, and abstention behavior.

**Not measured separately:** document recall, passage recall, rank quality,
nDCG/MRR, source authority, ownership/syndication diversity, evidence-to-claim
support, citation precision/recall, stale-result behavior, crawl coverage,
index freshness, or answer provenance. A correct answer could come from model
memory; a wrong answer does not reveal whether retrieval or synthesis failed.
The authors explicitly say it is hard to guarantee that sought information is
absent from every model's training data and therefore use tail/multi-hop design
and search-off filtering rather than such a guarantee [S2].

**RECOMMENDATION (high):** for Curiosity, preserve the final answer metrics but
add an instrumented stage ledger: issued queries; ranked immutable result and
capture IDs; passage hashes; judged relevant/source-diverse evidence; claim to
passage edges; retrieval recall/nDCG; citation entailment; and stage-specific
failure labels. Run at least (a) search-off, (b) frozen oracle evidence, and (c)
Curiosity end-to-end arms to separate memory, synthesis, and retrieval effects.

## Grounding v1 and v2

### Task and data

Each example contains a web-sourced context document (or review set), a system
instruction to rely exclusively on it, and a human-written non-trivial user
request. Tasks include Q&A, fact finding, summarization, comparison, and
rewriting across medical, legal, technology, finance, and retail domains. The
mean document length reported for v1 is 2.5k tokens and the maximum is 32k;
creative writing, expert knowledge, mathematics/logic, and unreadable OCR were
filtered out [S5]. Grounding v2 reuses the same prompt set [S2].

### Metrics and evaluator drift

Grounding v1 first checks whether a response meaningfully fulfills the request;
responses unanimously classified ineligible by three judges are counted
inaccurate. Eligible responses are accurate only if every information-bearing
claim is supported by the supplied document. Its score averages verdicts from
Gemini 1.5 Pro, GPT-4o, and Claude 3.5 Sonnet. Prompt variants were selected
against held-out human labels; the paper reports judge self-preference averaging
+3.23%, one rationale for the panel [S5].

Grounding v2 keeps the two-stage approach but changes the judging panel to
Gemini 2.5 Flash and GPT-5 and changes the judge prompt. On a 320-item human-
labeled evaluator set, the selected combinations' reported macro-F1 values were
65.33 and 65.18 respectively [S2].

**INFERENCE (high):** v1 and v2 scores are different measurement instruments;
score deltas cannot safely be attributed to model improvement without rescoring
the same outputs under both judge stacks. The autorater validation also shows
material error, so small model or system deltas need human adjudication and
confidence intervals.

**Curiosity scope:** Grounding is useful after retrieval—especially for
measuring unsupported additions, instruction compliance, and long-context
synthesis—but supplies perfect input evidence and has no citation requirement.
It cannot test query planning, corpus coverage, ranking, or whether Curiosity
found the right source.

## Rights and clean-room boundaries

### Established facts

- Kaggle's dataset API currently labels the public Grounding, Search,
  Parametric, and Multimodal packages **Apache 2.0** [S7, S8, S9]. Apache 2.0
  permits use, modification, and distribution of the licensed Work subject to
  license/notice, modified-file notice, and attribution-preservation conditions;
  it disclaims title and non-infringement warranties and does not grant
  trademark rights [S11].
- The Grounding paper says its context documents were collected from the web
  [S5]. The Multimodal paper visibly carries per-image credits including CC BY
  and CC BY-SA examples [S2]. Search questions are partly derived from
  Wikipedia and Google Knowledge Graph and partly human-authored [S2].
- No source-code repository or open implementation is identified by either
  FACTS paper. Kaggle holds the private sets and conducts leaderboard evaluation
  [S2, S3].

### Boundary and recommendation

**INFERENCE (high):** a package-level Apache label cannot convey copyright or
database rights the licensor does not possess in incorporated third-party web
pages or images. It also does not erase source-level attribution/share-alike
conditions. The absence of warranty makes a per-asset review important rather
than optional.

Use the public benchmark only in an isolated evaluation workspace after
capturing the exact package version, LICENSE, NOTICE, manifest, and per-item
source/license metadata. Preserve Wikipedia/image/document attribution. Do not
republish web contexts, images, or derived corpus snapshots; do not put them in
Curiosity's production index or training set without separate clearance.

Clean-room use may adopt published task concepts and observable I/O contracts,
then implement Curiosity-side harnesses independently. Do not scrape, infer,
probe, reconstruct, or train against Kaggle's private examples or hidden
scoring service. Treat all supplied and live-search content as untrusted data,
with normal fetch, prompt-injection, and egress controls.

**UNKNOWN / legal check required:** whether every public package actually
contains a LICENSE/NOTICE file; exact provenance and license for every Grounding
document and Multimodal image; Google Knowledge Graph terms applicable to the
released derived questions; and whether benchmark redistribution is intended
to cover embedded source text. Dataset payloads were deliberately not
downloaded for this research.

## Contamination, versioning, and reproducibility

### Contamination

- Grounding's authors acknowledge that web documents may have appeared in model
  pretraining. They argue the requests/instructions are novel and that exclusive
  grounding remains distinct; this mitigates but does not eliminate memorized
  document effects [S5].
- Search public questions and gold answers have been public since December
  2025. Any post-release model, prompt optimizer, agent, or test harness may
  have trained on or tuned to them. The private split reduces direct leakage but
  is only runnable through Kaggle [S2, S3].
- Search's final search-off filter used one named model (Gemini 2.5 Flash), not
  every evaluated or future model. Parametric knowledge can therefore produce
  correct answers without retrieval [S2].

**RECOMMENDATION:** record model provider/version, knowledge cutoff if known,
evaluation date, public-data exposure declaration, prompt/tool policy, and
search-off performance. Treat public results as development diagnostics and a
fresh sealed Curiosity set as the release gate.

### Material release drift

1. The 2025 paper defines Search as 1,884 examples (890 public/994 private), but
   current Kaggle dataset metadata describes “1,842” examples while linking a
   legacy `facts-search-on` leaderboard [S2, S7]. This unresolved 42-item/count
   discrepancy must not be normalized as a typo without inspecting the payload.
2. The live Kaggle benchmark title is **FACTS Search V2**, while the paper
   documents the original Search release and the static live page exposes no V2
   changelog [S2, S4].
3. Grounding v1's paper and launch page report 860 public examples, while the
   current Kaggle API says 856 public examples, dataset version 17, updated
   2026-01-07 [S5, S6, S9]. Four removals or another transformation occurred,
   but the accessible metadata gives no item-level changelog.
4. Grounding v2 retains the v1 prompt set but changes judges and prompts; this is
   evaluator versioning even if the data were byte-identical [S2].

**RECOMMENDATION (high):** identify a run by benchmark family/component,
dataset owner/ref, Kaggle version, item count and manifest hash, scorer/judge
model and dated endpoint, judge prompt hash, tool schema, search provider/API
configuration, retrieval timestamp, model version, and decoding settings.
Never report only “FACTS”.

### Reproducibility limitations

The papers provide construction and grading methodology, and v1 Grounding
publishes judge prompt templates [S5]. Full independent reproduction remains
bounded because private prompts are unavailable; Kaggle controls evaluation;
Search depends on a mutable hosted Brave index/API; exact returned result
snapshots are not part of the paper; autoraters are mutable hosted models; and
the Search report does not specify enough request parameters, tool-call limits,
result normalization, or retry behavior to recreate the original environment
from the paper alone [S2].

For an internal Curiosity adaptation, freeze the corpus/results and deterministic
tool envelope for regression runs, while maintaining a separately labeled live
web track for freshness. Archive responses and judge inputs, and adjudicate a
stratified sample with humans. Do not compare frozen and live runs as one series.

## Curiosity evaluation design implications

1. **Use FACTS Search as an agent-level challenge set, not IR ground truth.** It
   is strongest for hard-tail and multi-hop workflows and weakest for diagnosing
   why a search system failed.
2. **Create retrieval annotations.** For a rights-cleared subset, judge relevant
   URLs/passages and source independence against a dated corpus. Add Recall@k,
   nDCG@k, success conditional on evidence retrieved, and evidence diversity.
3. **Separate retrieval and synthesis.** Compare search-off, oracle-document,
   frozen Curiosity, and live Curiosity arms with an identical answer model.
4. **Score provenance, not only answers.** Require citations tied to immutable
   capture IDs and passage hashes; evaluate entailment, completeness, and
   freshness. FACTS Search's gold short answer alone cannot validate evidence.
5. **Preserve abstention views.** Accuracy rewards attempting; attempted
   accuracy and hedging reveal different policies. Add calibrated “insufficient
   evidence” and contradiction outcomes rather than optimizing one aggregate.
6. **Do not optimize the global FACTS Score.** Equal weighting of image
   understanding, closed-book memory, document grounding, and search use has no
   principled relation to Curiosity's retrieval goals.

## Unknowns and pre-run checks

- [ ] Confirm, from the landscape's provenance/transfer record, whether `FACTS`
  meant Search, Grounding, or the whole suite.
- [ ] Obtain an authoritative FACTS Search V2 changelog and protocol; determine
  whether V2 supersedes or coexists with the 2025 release.
- [ ] Resolve 1,884 versus 1,842 Search and 860 versus 856 Grounding counts.
- [ ] Inspect exact dataset LICENSE/NOTICE and per-item provenance/license fields
  before any payload is acquired.
- [ ] Obtain/pin tool description, schema, query/result limits, locale/safe-search
  settings, retries, API/index date, and returned fields.
- [ ] Pin judge endpoint/model, prompt, sampling count/temperature, parsing, and
  aggregation; validate on a Curiosity-specific human-rated sample.
- [ ] Decide whether a Kaggle private evaluation is permitted and operationally
  reproducible; never infer private-set composition.
- [ ] Establish a fresh sealed set because the public questions are contaminated
  as a release gate after 2025 publication.

## Bounded curiosity pass

Scoring scale 1–5; priority favors relevance × value × novelty relative to cost.

| Gap/thread | R | V | N | Cost | Action/result |
| --- | ---: | ---: | ---: | ---: | --- |
| Whether a newer Search release exists | 5 | 5 | 5 | 1 | **Pursued.** Live Kaggle title says `FACTS Search V2`; no accessible static changelog. This materially changes the verdict to DEFER current runs [S4]. |
| Dataset/reported count and license consistency | 5 | 5 | 4 | 2 | **Pursued.** Found Search 1,884/1,842 and Grounding 860/856 discrepancies plus Apache metadata; retained as unresolved, not “corrected” [S2, S5, S7, S9]. |
| Exact live Kaggle internal protocol/private data | 3 | 3 | 2 | 5 | **CURIOSITY_NO_GO:** would require dynamic authenticated/internal inspection and risks crossing the private-evaluation boundary. Request public documentation instead. |
| Enumerate every similarly named FACT/FACTS benchmark | 2 | 2 | 2 | 4 | **CURIOSITY_NO_GO:** exact-project ambiguity is already resolved enough for this decision; FActScore is retained only as a naming warning. |
| Reproduce leaderboard scores | 2 | 2 | 1 | 5 | **CURIOSITY_NO_GO:** out of frame, mutable paid APIs, no dataset downloads, and no added identity value. |

**Stop condition:** coverage reached for identity, tasks, metrics, stage scope,
rights, contamination/versioning, reproducibility, and Curiosity implications.
The best remaining gap—Search V2's protocol—requires authority/public material
not available in the bounded pass.

## Sources

Primary sources are preferred; access date is 2026-08-17 unless noted.

- **[S1]** Curiosity repository, *Owned public-web search architecture*,
  landscape evaluation-corpora row (unqualified `FACTS`):
  [`../owned-public-web-search-architecture-2026-08-17.md`](../owned-public-web-search-architecture-2026-08-17.md).
- **[S2]** Cheng et al., *The FACTS Leaderboard: A Comprehensive Benchmark for
  Large Language Model Factuality*, arXiv:2512.10791v1 (2025-12-11), CC BY 4.0:
  https://arxiv.org/html/2512.10791v1
- **[S3]** Google DeepMind, *FACTS Benchmark Suite: Systematically evaluating
  the factuality of large language models* (2025-12-09):
  https://deepmind.google/blog/facts-benchmark-suite-systematically-evaluating-the-factuality-of-large-language-models/
- **[S4]** Kaggle, live *FACTS Search V2 Leaderboard* page; static metadata title
  and description observed, but no accessible V2 protocol/changelog:
  https://www.kaggle.com/benchmarks/google/facts-search
- **[S5]** Jacovi et al., *The FACTS Grounding Leaderboard: Benchmarking LLMs'
  Ability to Ground Responses to Long-Form Input*, arXiv:2501.03200v1
  (2025-01-06), CC BY 4.0:
  https://arxiv.org/html/2501.03200v1
- **[S6]** Google DeepMind, *FACTS Grounding: A new benchmark for evaluating the
  factuality of large language models* (2024-12-17):
  https://deepmind.google/blog/facts-grounding-a-new-benchmark-for-evaluating-the-factuality-of-large-language-models/
- **[S7]** Kaggle public API metadata, `deepmind/facts-search-public`, version 1,
  updated 2025-12-03, marked Apache 2.0:
  https://www.kaggle.com/api/v1/datasets/view/deepmind/facts-search-public
- **[S8]** Kaggle public API metadata for suite datasets, both marked Apache 2.0:
  `kaggle/facts-parametric-public-examples` and
  `deepmind/facts-multimodal-v2-public-data`:
  https://www.kaggle.com/api/v1/datasets/view/kaggle/facts-parametric-public-examples ;
  https://www.kaggle.com/api/v1/datasets/view/deepmind/facts-multimodal-v2-public-data
- **[S9]** Kaggle public API metadata,
  `deepmind/FACTS-grounding-examples`, current version 17, updated 2026-01-07,
  marked Apache 2.0:
  https://www.kaggle.com/api/v1/datasets/view/deepmind/facts-grounding-examples
- **[S10]** Min et al., *FActScore: Fine-grained Atomic Evaluation of Factual
  Precision in Long Form Text Generation* (separate project), EMNLP 2023:
  https://aclanthology.org/2023.emnlp-main.741/
- **[S11]** Apache Software Foundation, *Apache License, Version 2.0*:
  https://www.apache.org/licenses/LICENSE-2.0.txt

## Confidence summary

| Claim | Confidence | Reason |
| --- | --- | --- |
| FACTS Search is the likely intended referent | Medium-high | Context and chronology align, but the local row is uncited and unqualified. |
| 2025 Search tasks, counts, Brave tool, and metrics | High | Direct suite paper, triangulated by Google launch and Kaggle metadata except noted count drift. |
| Live benchmark is titled Search V2 | High for title; low for semantics | Direct live metadata; no public changelog found. |
| Grounding is synthesis rather than retrieval | High | Oracle document is explicitly part of every prompt. |
| Public package metadata says Apache 2.0 | High | Direct Kaggle API metadata. |
| Apache covers every embedded third-party asset | **Unknown / not assumed** | Per-source provenance and payload notices were not inspected; papers identify web and separately licensed sources. |
| Independent leaderboard reproduction is possible | Low | Private sets, mutable hosted search, hosted judges, and incomplete tool details prevent exact recreation. |
