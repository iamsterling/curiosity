# Boilerpipe content extraction: clean-room reverse-engineering dossier

**Access date:** 2026-08-17  
**Scope:** The WSDM 2010 method, archived first-party documentation, and the
public Java source snapshot at commit `2c78035a830282e2435c466f3f14d6d4104d0a94`.
The released 1.2.0 lineage and the later unfinished 2.0-SNAPSHOT transfer are
distinguished where possible.  
**Status:** Research evidence and recommendations, not implementation, legal
advice, dependency approval, or a current quality benchmark. No source code was
copied into Curiosity; public source was read only to establish behavior.

## Decision frame and result

**Question.** Which Boilerpipe ideas should Curiosity adopt or adapt for owned,
bounded extraction, and should the old library itself be a production
dependency?

Bounded sub-questions were: (1) segmentation and block features; (2) trained
classifiers and extractor variants; (3) malformed-HTML behavior; (4) language,
layout, and genre bias; (5) reported evaluation; (6) hostile-input and fetching
risk; (7) maintenance, licensing, and clean-room boundaries; and (8) exact
implications for Curiosity. Primary sources were the authors' paper, archived
project documentation, and pinned first-party source. No service, live target,
credential, unpublished dataset, or access-control bypass was used.

**Overall verdict — ADAPT the block-signal baseline; REJECT the historical
library as Curiosity's production extractor (high confidence).** Boilerpipe's
durable insight is that cheap, interpretable per-block signals—word count, link
density, neighboring-block context, and coarse text density—form a strong
static-HTML baseline. Its fixed English/news-era thresholds, parser-dependent
block boundaries, destructive binary decision, old fetching/parser stack, and
stale maintenance make the artifact unsuitable as the owned foundation. It can
serve only as an isolated, version-pinned evaluation oracle if separately
approved.

Labels below mean **FACT** (direct source), **INFERENCE** (reasoned consequence),
**RECOMMENDATION** (Curiosity choice), and **UNKNOWN** (materially unresolved).
Confidence is high/medium/low.

## 1. What Boilerpipe actually is

**FACT (high).** The paper frames extraction as classifying text blocks within
one HTML page, without requiring a rendered page or a same-site corpus. The
project pipeline is: tolerant HTML parser -> ordered `TextBlock` sequence ->
filter/classifier pipeline -> blocks marked content or boilerplate -> retained
plain text. Filters may also merge blocks or add labels [S1-S4].

**FACT (high).** The shipped library is not exactly the experimental program in
the paper. The archived Components page explicitly calls it a reimplementation
and says minor differences were known and intended for a later release [S4].
Therefore paper scores must not be represented as scores of release 1.2.0 or the
GitHub 2.0-SNAPSHOT.

**FACT (high).** The core is not a reader-mode DOM distiller. It does not render
CSS, execute JavaScript, inspect accessibility geometry, infer visual columns,
or use repeated pages from a site. It consumes parser events and shallow text
statistics. Text hidden by CSS but present in HTML can remain eligible; content
created only by JavaScript is absent [S1-S4].

### Clean-room behavioral model

```text
HTML bytes/string
  -> tolerant parser repairs/synthesizes an event tree
  -> ignore selected elements; preserve anchor boundaries
  -> flush parser-defined atomic text blocks
  -> count words, linked words, wrapped-line words; record order/tag depth
  -> classify from current + neighboring block signals
  -> optional genre heuristics, fusion, largest-block selection
  -> content flags -> plain-text projection
```

This is a behavior-level summary, not copied implementation.

## 2. Segmentation and text-block features

### 2.1 Atomic blocks

**FACT (high).** In the paper, an atomic block is character data separated by
one or more HTML tags, except anchors are not separators so link density can be
measured. In the source, known inline tags such as emphasis, `span`, `code`,
`sub`, `sup`, and `var` do not flush a block; anchors inject internal markers;
unknown tags normally do flush. `style`, `script`, `option`, `object`, `embed`,
`applet`, `link`, and `noscript` content is ignored [S1][S6-S8]. Thus the exact
block sequence is a function of the tag-action table and parser repair, not an
intrinsic property of the visible document.

**INFERENCE (high).** A parser/tag-table update can change word counts,
neighbor relationships, and classifications even when classifier thresholds do
not change. Extraction provenance therefore needs parser, segmentation, and
classifier versions, not one generic “extractor version.”

### 2.2 Features considered in the paper

The paper systematically considered [S1]:

| Family | Features | Role / caveat |
| --- | --- | --- |
| Shallow text | number of words; average word length; average sentence length | Avoids topical bag-of-words features, but thresholds reflect the training language and genre. |
| Orthographic/punctuation | initial-uppercase and all-uppercase counts/ratios; periods per word; date/time tokens; vertical bars | Heuristic and writing-system dependent. |
| Links/structure | linked-token ratio; enclosing `H1`-`H6`, `P`, `DIV`, `A` indications | Link density became central; CSS and visual layout were intentionally excluded. |
| Position/context | absolute/relative block position; current, previous, and next block values; density/count quotients | Neighbor features had high information gain and encode local continuity. |
| Densitometric | text density after synthetic 80-character wrapping | A compact proxy for sentence-like versus short functional text, not measured screen density. |
| Site/global reference | frequency of exact text in the corpus | Evaluated as a reference; deliberately unnecessary in the simplified local rules. |

**FACT (high).** The released representation retains text, content flag, word
count, words in anchor text, synthetic wrapped-line counts, text density, link
density, block offsets, tag depth, source-text-element membership, and labels.
Text density is words in completed synthetic wrapped lines divided by their
line count; link density is linked words divided by words [S6-S7].

**Important terminology.** Boilerpipe “text density” is not DOM area, font size,
pixels, or responsive layout. The source wraps token lengths at a fixed 80 Java
characters and excludes the final incomplete line when wrapping occurred
[S1][S7]. Emoji/supplementary characters, combining marks, scripts without
spaces, and modern visual layout can therefore interact very differently from
the English prose for which 80–90 characters was reported suitable.

### 2.3 Simplified decision trees

**FACT (high).** C4.8 pruning reduced the paper's 67-feature model to six inputs:
current/previous/next block text (or word-count) values and link densities. The
published density tree uses cut points around current link density 1/3,
previous link density 5/9, and text densities 4, 9, 10, and 11. The word-count
tree uses the same link cuts and count cuts at 4, 15, 16, 17, and 40. The pinned
source implements these fixed trees directly [S1][S5].

**INFERENCE (high).** These are frozen learned rules, not an online-trained
model and not calibrated probabilities. A `content` boolean gives no confidence,
rejection reason, uncertainty, or alternate extraction.

## 3. Extractor variants are different policies

| Variant | First-party intent and pipeline | Curiosity assessment |
| --- | --- | --- |
| `NumWordsRulesExtractor` | Only the fixed word-count/link-density neighbor tree corresponding to paper Algorithm 2. | Best reference for the paper's minimal rule; still English/news-trained. |
| `DefaultExtractor` | Generic: simple block fusion, proximity fusion, then density rules. | Useful conceptual baseline; merging before classification makes output segmentation-sensitive. |
| `LargestContentExtractor` | Word/link rules, proximity fusion, then retain the largest content component. | Raises precision for a single article but can discard sidebars, captions, comments, or multiple legitimate articles. |
| `ArticleExtractor` | News-tuned chain: English end markers, title matching, word/link rules, post-content suppression, headline/list handling, proximity fusion, largest-block and same-tag-depth expansion. | Highest historical article ambition, but substantially heuristic, genre-, language-, and DOM-order-specific. |
| `ArticleSentencesExtractor` | `ArticleExtractor`, paragraph splitting, then minimum-clause filtering. | More destructive; unsuitable where fragments, tables, code, or captions matter. |
| `CanolaExtractor` | A different fixed neighbor rule trained for the krdwrd Canola definition of boilerplate. | Evidence that “main content” is corpus-policy dependent, not a universal label. |
| `KeepEverythingExtractor` / minimum-word variant | Debug identity baseline, or fusion then keep blocks above a chosen word floor. | Valuable evaluation control, not extraction intelligence. |

Sources: [S3-S5][S9-S10].

**FACT (high).** `ArticleExtractor`'s terminator vocabulary is mostly literal
English phrases such as comment/rating prompts, plus one Swedish phrase and a
Reuters marker; after at least 60 content words, the terminator and all following
blocks can be demoted [S10]. This is direct language bias and a false-positive
amplifier when page text happens to match a marker.

**RECOMMENDATION (high).** Curiosity must make extraction intent explicit
(`article`, `document`, `discussion`, `all-visible-text`) and retain a scored
block ledger. “Largest block” and “after comments” should be policy features,
not universal deletion rules.

## 4. Malformed HTML and parser dependence

**FACT (high).** Boilerpipe's default parser embeds/pins a patched CyberNekoHTML
1.9.13 path on Xerces. Neko's tag balancer adds missing parents, closes optional
end tags, and repairs mismatched inline tags. It can synthesize `html`, `head`,
and `body` events and move bare text into a body [S4][S8][S11]. This allows many
malformed pages to produce blocks instead of failing.

**FACT (high).** Repair is not guaranteed to be browser-equivalent. The project
shipped 1.0.2 specifically to patch a NekoHTML bug that caused rare low-quality
results. The FAQ says incorrect parser events can degrade extraction and advises
external HTML cleanup. The source detects nested-anchor events associated with
that bug, logs a warning, and attempts recovery rather than establishing general
malformed-input correctness [S2][S6][S8].

**FACT/contradiction (high).** The archived FAQ says known incorrect parser input
will cause a `BoilerpipeProcessingException`; the pinned later handler's
nested-anchor branch instead prints a warning and attempts recovery [S3][S6].
The exact failure contract is therefore version- and fault-dependent.

**FACT (medium-high).** An open first-party issue records a crafted/real malformed
page causing `StackOverflowError` in Neko's recursive tag balancing. This is a
reported case, not a controlled reproduction here [S14].

**INFERENCE (high).** Malformation can: (1) change body membership; (2) split or
merge atomic blocks; (3) alter anchor scope and link density; (4) alter tag depth
used by article heuristics; (5) suppress text under an erroneously extended
ignorable element; or (6) fail parsing. A successful parse is not evidence of
faithful extraction.

**UNKNOWN.** The sources provide no conformance matrix against HTML5 parsing,
browser DOMs, malformed encoding declarations, template/shadow DOM, SVG/MathML,
or modern custom elements. No bounded fuzzing or adversarial parser benchmark is
published.

## 5. Language, layout, and genre bias

### Directly established

- **FACT (high):** The 621-page main training/test collection was English news
  sampled from six English-speaking Google News portals in 2008. It contained
  72,662 blocks; 79% of blocks but only 35% of words were labeled boilerplate.
  Each page was assessed once; the authors expected little disagreement but did
  not report inter-annotator agreement [S1].
- **FACT (high):** The paper says 80–90 wrap characters was empirically suitable
  for English and lists testing other languages as future work. The FAQ says to
  try English news/blog first and that non-English parameters may need manual
  changes [S1][S3].
- **FACT (high):** The source tokenizer recognizes Unicode letter/number
  categories for deciding whether a token is a word, but its boundary process,
  fixed character wrap, fixed word thresholds, and English heuristics do not
  thereby become language-neutral [S7][S10].
- **FACT (high):** CSS semantics and rendered geometry were intentionally
  excluded to avoid site dependence and rendering cost. HTML source order, not
  visual reading order, controls neighbors [S1].

### Consequences

**INFERENCE (high).** Likely weak cases include CJK/Thai or other text without
English-like whitespace segmentation; agglutinative or unusually short-sentence
languages; right-to-left/mixed-script pages; microblogs, FAQs, recipes, product
specifications, code/API docs, tables, poetry, transcripts, and list-heavy pages;
multi-article fronts; and mobile/responsive pages whose DOM order diverges from
visual order. Long navigation/promotional prose can be false-positive content;
short but essential titles, captions, warnings, quotations, and facts can be
false-negative boilerplate.

**INFERENCE (high).** The method is “site-independent” in the narrow sense that
it does not train on a site's repeated template, not “layout-independent” or
“language-independent.” Parser block boundaries and fixed distributions still
encode layout and corpus assumptions.

## 6. Evaluation evidence and limits

### Paper results

**FACT (high).** On word-weighted 10-fold cross-validation over GoogleNews, the
paper reports for the two-class task:

- one-feature rules: word-count threshold 15, F1 86.7%; link-density threshold
  about 0.33, F1 87.4%; text-density threshold 10.5, F1 87.9%;
- simplified six-feature word/link tree: precision/recall/F1 92.2/92.2/92.2,
  ROC AUC 95.7%;
- simplified six-feature density/link tree: 92.4/92.4/92.4, AUC 96.9%;
- all 67 features with C4.8: F1 95.1%, AUC 98.0%; linear SMO: F1 95.3%, AUC
  95.0% [S1].

The same table also reports materially lower four-class performance; the binary
headline/content/boilerplate simplification hides policy distinctions.

**FACT (high).** For CleanEval, the paper could not map browser-derived plain-text
gold labels directly back to HTML blocks, replaced CleanEval's weighted edit
distance with an approximated bag-of-words token F1, and re-evaluated competitors
under that proxy. The authors found “keep all text” surprisingly competitive,
questioned corpus suitability, and found their article-specific largest/main
heuristics worse than baseline there. Their simple word/link classifier improved
the stated baseline by 33.3%; exact per-system values are presented mainly in a
figure [S1].

**FACT (high).** On BLOGS06 retrieval, baseline Lucene yielded P@10 0.18 and
NDCG@10 0.0985. A minimum text-density threshold of 14 yielded 0.32/0.1823; a
minimum 11–100 words yielded 0.44/0.2476; BTE yielded 0.33/0.1627. These were 50
historical TREC Blog queries, not an extraction-gold test and not a modern web
benchmark [S1].

### Validity cautions

1. **Training/test leakage risk is not resolved.** Cross-validation is described
   over pages, while pages came from 408 sites and some sites contributed multiple
   examples. The paper does not state host-grouped folds; shared layouts could
   cross folds (**UNKNOWN**, high relevance).
2. **Gold policy is narrow.** News comments counted as content; related content
   did not. Every page had one assessor, with no measured agreement [S1].
3. **Metrics are word-weighted.** Large prose blocks dominate; catastrophic loss
   of short titles/captions is weakly penalized.
4. **Comparator and corpus limitations are acknowledged by the authors.** One
   external news system was called through a service and suspected of a bug or
   overfitting; CleanEval mapping forced a proxy metric [S1].
5. **Artifact mismatch.** Archived docs say the library is a reimplementation
   with differences [S4]. No source-backed basis exists to transfer paper numbers
   to current Curiosity data or the pinned GitHub tree.

**RECOMMENDATION (high).** Evaluate at block, token, field, and claim-retention
levels, grouped by host/template and stratified by language, genre, rendering
need, and malformedness. Include title/byline/date/caption/table/code/list recall,
not only article-body F1, plus extraction latency and failure/empty-output rates.

## 7. Security and operational behavior

### Fetching

**FACT (high).** The source labels `HTMLFetcher` “really just for demo purposes,”
yet `ExtractorBase.getText(URL)` invokes it. It accepts arbitrary Java URLs via
`URLConnection`, follows platform behavior, checks only a `text/html` content
type, defaults decoding to Cp1252, optionally handles gzip, and buffers the
entire decompressed response in memory. It sets no connect/read timeout, byte
limit, decompression-ratio limit, redirect/host/IP policy, protocol allowlist,
DNS rebinding defense, or credential/cookie policy [S12]. An open issue confirms
the absent timeout [S13].

**INFERENCE (high).** Exposing that helper to untrusted URLs creates SSRF/local
resource access, hangs, oversized-body/decompression exhaustion, redirect, and
encoding-confusion risk. The content classifier does not mitigate network risk.

### Parsing and extraction

- **FACT (high):** Input strings and parser buffers have no documented maximum;
  text blocks and the full result are retained in memory [S6-S7].
- **FACT (medium-high):** A reported Neko path can recurse to stack exhaustion on
  malformed HTML [S14]. Deep nesting and pathological tokenization/resource use
  are otherwise unbounded by a public contract.
- **FACT (high):** Script/style-like content is skipped as text, but Boilerpipe
  is not an HTML sanitizer, malware scanner, prompt-injection defense, or URL
  policy engine [S6-S8]. Returned page text remains attacker-controlled data.
- **INFERENCE (high):** An attacker can shape block lengths, links, and DOM order
  to force inclusion/exclusion. Extraction labels are quality hints, never a
  trust or safety verdict.

**RECOMMENDATION (high).** Curiosity should fetch separately under its existing
egress/robots policy, retain raw bytes, enforce MIME/byte/time/redirect/
decompression limits before parsing, parse in an isolated resource-bounded lane,
and never let extracted text issue instructions or authorize tools. Preserve
partial/failure reason codes and an identity fallback rather than silently
returning empty “clean” text.

## 8. Maintenance, license, and clean-room boundary

**FACT (high).** Boilerpipe code is Apache-2.0, copyright Christian Kohlschütter
(2009, 2014); patched Neko files identify Andy Clark and Marc Guillemot and are
also Apache-2.0 [S8][S15]. This permits use subject to Apache-2.0 conditions; it
does not make the ACM paper text/code freely copyable, grant rights in fetched
web pages, or remove dependency-notice review.

**FACT (high).** Version history is fragmented: archived Google Code shows 1.2.0
tarballs in 2012, while Maven Central exposes only 1.1.0 (last metadata update
2010). GitHub is explicitly a work-in-progress transfer, has no releases, uses
`2.0-SNAPSHOT`, and its latest commit is the 2015 README merge at the pinned
hash. Current open issues include EOL concerns, missing 2.0 artifacts, parser
class conflicts, timeout, and stack overflow [S2][S13-S18].

**FACT (high).** The GitHub build targets Java 7 and references Xerces 2.9.1,
relocated/patched NekoHTML 1.9.13, JUnit 4.11, and Log4j 1.2.17 in its parent/
module POMs [S11]. These are maintenance facts, not a complete vulnerability
finding. Exact transitive and security posture depends on the artifact chosen.

**ASSESSMENT (high).** Direct dependency adoption would import an ambiguous,
unmaintained artifact lineage and old parser/build assumptions into a
security-sensitive untrusted-input path. Apache licensing makes reuse legally
possible but does not make it architecturally prudent.

**Clean-room rule.** Curiosity may independently implement general, published
ideas—ordered blocks, word/link ratios, neighbor context, confidence-bearing
classification—and cite their origin. It should not transcribe the fixed source
trees, filter pipelines, phrase lists, or patched parser code. If any Apache code
is ever reused instead, that is no longer clean-room work and requires a
separately reviewed dependency/NOTICE/provenance path. No such code is included
here.

## 9. Exact Curiosity implications

| Verdict | Implication |
| --- | --- |
| **ADOPTED** — cheap block features | Compute transparent length, link, punctuation, DOM-depth/order, and neighbor-continuity signals as one owned baseline; record every value and reason. |
| **ADAPTED** — text density | Replace the English fixed-80-character surrogate with language-aware, explicitly versioned features; never call it visual density. Measure whether it adds value beyond word/character counts. |
| **ADAPTED** — local context | Use bounded previous/next or segment context, but preserve source offsets and avoid irreversible fusion before evidence capture. |
| **ADAPTED** — variant profiles | Expose extraction intent and profile (`article`, `document`, `discussion`, fallback), not provider/library class names. Profiles share a neutral block/evidence contract. |
| **REJECTED** — binary destructive output | Retain all blocks with scores, roles, offsets, DOM/text mapping, exclusion reasons, and alternate projections. “Boilerplate” is task-relative and untrusted. |
| **REJECTED** — largest block as default | It loses multi-article, caption, table, list, and discussion content. Largest-component score may be one article-profile signal only. |
| **REJECTED** — fixed English/news trees | Do not inherit 2008 thresholds or phrase markers. Train/calibrate only on licensed, multilingual, host-grouped Curiosity fixtures. |
| **REJECTED** — bundled fetcher/parser stack | Fetching, HTML5 parsing, resource bounds, and security belong to owned, separately versioned stages. Never expose Boilerpipe URL fetching. |
| **DEFERRED** — evaluation oracle | A pinned 1.2.0 or source-snapshot oracle may be compared offline on public/licensed fixtures after dependency/license/security approval; sandbox it and prohibit network access. |
| **ADOPTED** — provenance lesson | Store raw capture ID/hash, decoding decision, parser/segmentation version, block offsets, classifier/profile version, scores, and terminal quality/failure reason. |

### Proposed evaluation gates (not implementation)

1. Compare keep-all, cheap owned rules, Boilerpipe oracle, and at least one modern
   independent oracle on the same frozen captures.
2. Group train/test splits by publisher/template family and reserve temporal
   holdouts; report confidence intervals.
3. Stratify English/non-English, spaced/unspaced scripts, article/non-article,
   static/render-required, and valid/malformed HTML.
4. Measure body precision/recall and critical-field retention separately.
5. Treat empty, parser error, timeout, resource limit, and low-confidence output
   as distinct outcomes; do not score failures as clean negatives.
6. Red-team long-link prose, short essential facts, nested/missing tags, encoding
   conflicts, oversized/decompression inputs, and source-order/visual-order
   disagreement on owned fixtures only.

## 10. Fact / inference / recommendation ledger

| ID | Type | Claim | Sources | Confidence | Verdict |
| --- | --- | --- | --- | --- | --- |
| L1 | FACT | Boilerpipe classifies parser-derived ordered text blocks using shallow local signals. | [S1][S4][S6-S9] | High | **ADAPT** |
| L2 | FACT | Word count, link density, and previous/next context support the two published simplified trees. | [S1][S5] | High | Concepts **ADOPTED**, thresholds **REJECTED** |
| L3 | FACT | Fixed synthetic 80-character wrapping defines released text density. | [S1][S7] | High | **ADAPT**, rename precisely |
| L4 | FACT | Article, Default, Largest, Canola, and identity variants encode materially different content policies. | [S3-S5][S9-S10] | High | Neutral profiles **ADAPTED** |
| L5 | FACT | Neko repairs malformed markup but had a project-patched quality bug and a reported stack-overflow case. | [S2][S3][S8][S14] | High/medium-high | Parser stack **REJECTED** |
| L6 | INFERENCE | Parser repair and tag mappings can alter every downstream classifier feature. | [S6-S8] | High | Version full pipeline |
| L7 | FACT | Main labels/training are 2008 English news; other languages remained future/manual-parameter work. | [S1][S3] | High | Universal claims **REJECTED** |
| L8 | FACT | Paper reports ~92.2–92.4% word-weighted binary F1 for simplified trees and 95% for fuller models on GoogleNews CV. | [S1] | High | Historical evidence only |
| L9 | FACT | CleanEval required a proxy metric and article heuristics failed there; keep-all was competitive. | [S1] | High | Keep negative result |
| L10 | FACT | BLOGS06 retrieval improved strongly after filtering, but this was 50 historical queries, not extraction-gold evaluation. | [S1] | High | Hypothesis worth retesting |
| L11 | FACT | Demo URL fetching lacks elementary network/resource bounds. | [S12-S13] | High | **REJECTED** |
| L12 | FACT | Code is Apache-2.0, but artifact/version/maintenance lineage is fragmented and stale. | [S2][S15-S18] | High | Dependency **REJECTED** |
| L13 | RECOMMENDATION | Preserve raw bytes and all blocks with offsets, scores, reasons, versions, and alternate projections. | Synthesis | High | **ADOPTED** |
| L14 | RECOMMENDATION | If used at all, Boilerpipe is an offline sandboxed oracle, not production or clean-room source. | Synthesis | High | **DEFERRED** |

## 11. Unknowns and checks required before revisit

1. Which exact artifact is meant by “Boilerpipe”: Google Code 1.2.0, Maven 1.1.0,
   a language port, or GitHub 2.0-SNAPSHOT; hashes and dependency closure differ.
2. Whether GoogleNews folds were grouped by host/template; the paper does not say.
3. Per-page distributions and confidence intervals behind reported aggregate
   metrics; surviving gold-data rights and availability.
4. Inter-annotator agreement and operational definitions for headline,
   supplemental, comments, related content, and boilerplate.
5. Release-versus-paper output differences acknowledged in the archived docs.
6. Accuracy on modern HTML5, multilingual and unspaced scripts, accessibility
   markup, custom elements, responsive source order, and JavaScript-rendered text.
7. Current, exact security advisories for every resolved dependency/artifact.
   This dossier did not claim a complete CVE audit.
8. HTML parser external-entity/network behavior under the precise configuration;
   validate in a sandbox before any oracle execution.
9. Whether a modern owned block baseline gains anything from synthetic text
   density after language-aware character/word/link and structural features.
10. Copyright/license status of any historical corpora before obtaining or using
    them; paper availability is not dataset permission.

## 12. Bounded curiosity pass

Scoring: 1 (low) to 5 (high); cost is 1 (cheap) to 5 (expensive). The pass stayed
inside public primary-source and clean-room boundaries.

| Thread | Rel. | Value | Novelty | Cost | Action |
| --- | ---: | ---: | ---: | ---: | --- |
| Distinguish paper algorithm from released library | 5 | 5 | 5 | 1 | **Pursued:** archived Components page explicitly says reimplementation with differences [S4]. |
| Resolve “latest” version and maintenance status | 5 | 5 | 4 | 2 | **Pursued:** 1.2.0 archive, Maven-only 1.1.0, unfinished GitHub 2.0-SNAPSHOT, and 2015 last commit establish fragmented lineage [S2][S17-S18]. |
| Verify malformed-HTML failure modes | 5 | 5 | 4 | 2 | **Pursued:** tag-balancer repair behavior, nested-anchor patch history, and open stack-overflow report establish tolerance without robustness guarantee [S2-S3][S8][S14]. |
| Quantify multilingual accuracy | 5 | 5 | 4 | 4 | **DEFERRED:** no first-party multilingual benchmark; needs licensed stratified fixtures and separately authorized execution. |
| Reproduce GoogleNews/CleanEval scores | 4 | 5 | 3 | 5 | **DEFERRED:** artifact/gold mapping and dataset rights unresolved; paper already reveals major validity limits. |
| Enumerate current CVEs from package names alone | 4 | 4 | 2 | 3 | `CURIOSITY_NO_GO`: exact artifact resolution is absent and name-only matching risks false claims; require formal dependency scan if adoption is reconsidered. |
| Copy/port classifier source for a trial | 2 | 2 | 1 | 4 | `CURIOSITY_NO_GO`: caller prohibited implementation/code copying; concept-level evidence is sufficient. |
| Probe arbitrary live malformed sites | 2 | 2 | 2 | 5 | `CURIOSITY_NO_GO`: unnecessary, unbounded, and outside owned-fixture/access boundary. |
| Reverse-engineer online demo differences | 2 | 2 | 4 | 5 | `CURIOSITY_NO_GO`: service is historical/opaque and cannot establish the released artifact. |

**Stop decision.** Coverage reached every requested category. The highest-value
contradictions—paper versus library, 1.2.0 versus Maven/GitHub lineage, and
“tolerant parser” versus malformed-input failures—were pursued to primary-source
saturation. Remaining material gaps require licensed datasets, dependency
resolution, or authorized sandbox experiments, so the pass stops on coverage
and access-budget exhaustion.

## 13. Primary sources

All sources were accessed 2026-08-17. Archived pages preserve first-party
statements but are not current support commitments. GitHub source links are
pinned to commit `2c78035a830282e2435c466f3f14d6d4104d0a94`.

- **[S1]** Christian Kohlschütter, Peter Fankhauser, Wolfgang Nejdl,
  [“Boilerplate Detection using Shallow Text Features,” WSDM 2010, pp. 441–450](http://www.wsdm-conference.org/2010/proceedings/docs/p441.pdf),
  DOI [10.1145/1718487.1718542](https://doi.org/10.1145/1718487.1718542) — method,
  features, corpora, classifiers, evaluation, retrieval experiment, limitations.
- **[S2]** Boilerpipe archived [Project Home](https://web.archive.org/web/20100110232140id_/http://code.google.com/p/boilerpipe/)
  and [archived download inventory](https://web.archive.org/cdx/search/cdx?url=boilerpipe.googlecode.com/files/*&output=json&filter=statuscode:200&collapse=urlkey&fl=timestamp,original,mimetype,statuscode,digest,length&limit=1000)
  — first-party purpose/license/news; 1.0–1.2.0 release evidence.
- **[S3]** Boilerpipe archived [FAQ](https://web.archive.org/web/20150321004815id_/https://code.google.com/p/boilerpipe/wiki/FAQ)
  and [QuickStart](https://web.archive.org/web/20150321004815id_/https://code.google.com/p/boilerpipe/wiki/QuickStart)
  — English/news guidance, short-page/JS limits, parser bug, extractor guidance.
- **[S4]** Boilerpipe archived [Components](https://web.archive.org/web/20100223024737id_/http://code.google.com/p/boilerpipe/wiki/Components)
  — parser/block/filter architecture, English package warning, and explicit
  paper-code reimplementation difference.
- **[S5]** Boilerpipe source,
  [`NumWordsRulesClassifier`](https://github.com/kohlschutter/boilerpipe/blob/2c78035a830282e2435c466f3f14d6d4104d0a94/boilerpipe-common/src/main/java/com/kohlschutter/boilerpipe/filters/english/NumWordsRulesClassifier.java)
  and [`DensityRulesClassifier`](https://github.com/kohlschutter/boilerpipe/blob/2c78035a830282e2435c466f3f14d6d4104d0a94/boilerpipe-common/src/main/java/com/kohlschutter/boilerpipe/filters/english/DensityRulesClassifier.java)
  — fixed published decision rules.
- **[S6]** Boilerpipe source,
  [`DefaultTagActionMap`](https://github.com/kohlschutter/boilerpipe/blob/2c78035a830282e2435c466f3f14d6d4104d0a94/boilerpipe-common/src/main/java/com/kohlschutter/boilerpipe/sax/DefaultTagActionMap.java)
  and [`CommonTagActions`](https://github.com/kohlschutter/boilerpipe/blob/2c78035a830282e2435c466f3f14d6d4104d0a94/boilerpipe-common/src/main/java/com/kohlschutter/boilerpipe/sax/CommonTagActions.java)
  — skipped/inline/body/anchor behavior and nested-anchor recovery.
- **[S7]** Boilerpipe source,
  [`BoilerpipeHTMLContentHandler`](https://github.com/kohlschutter/boilerpipe/blob/2c78035a830282e2435c466f3f14d6d4104d0a94/boilerpipe-common/src/main/java/com/kohlschutter/boilerpipe/sax/BoilerpipeHTMLContentHandler.java),
  [`TextBlock`](https://github.com/kohlschutter/boilerpipe/blob/2c78035a830282e2435c466f3f14d6d4104d0a94/boilerpipe-common/src/main/java/com/kohlschutter/boilerpipe/document/TextBlock.java), and
  [`UnicodeTokenizer`](https://github.com/kohlschutter/boilerpipe/blob/2c78035a830282e2435c466f3f14d6d4104d0a94/boilerpipe-common/src/main/java/com/kohlschutter/boilerpipe/util/UnicodeTokenizer.java)
  — segmentation, feature calculation, retained block fields, tokenizer.
- **[S8]** Boilerpipe patched NekoHTML,
  [`HTMLTagBalancer`](https://github.com/kohlschutter/boilerpipe/blob/2c78035a830282e2435c466f3f14d6d4104d0a94/nekohtml/src/main/java/org/cyberneko/html/HTMLTagBalancer.java)
  and [`BoilerpipeHTMLParser`](https://github.com/kohlschutter/boilerpipe/blob/2c78035a830282e2435c466f3f14d6d4104d0a94/boilerpipe-common/src/main/java/com/kohlschutter/boilerpipe/sax/BoilerpipeHTMLParser.java)
  — malformed-tag repair and parser coupling.
- **[S9]** Boilerpipe source extractors:
  [`CommonExtractors`](https://github.com/kohlschutter/boilerpipe/blob/2c78035a830282e2435c466f3f14d6d4104d0a94/boilerpipe-common/src/main/java/com/kohlschutter/boilerpipe/extractors/CommonExtractors.java),
  [`ArticleExtractor`](https://github.com/kohlschutter/boilerpipe/blob/2c78035a830282e2435c466f3f14d6d4104d0a94/boilerpipe-common/src/main/java/com/kohlschutter/boilerpipe/extractors/ArticleExtractor.java),
  [`DefaultExtractor`](https://github.com/kohlschutter/boilerpipe/blob/2c78035a830282e2435c466f3f14d6d4104d0a94/boilerpipe-common/src/main/java/com/kohlschutter/boilerpipe/extractors/DefaultExtractor.java),
  [`LargestContentExtractor`](https://github.com/kohlschutter/boilerpipe/blob/2c78035a830282e2435c466f3f14d6d4104d0a94/boilerpipe-common/src/main/java/com/kohlschutter/boilerpipe/extractors/LargestContentExtractor.java), and
  [`CanolaExtractor`](https://github.com/kohlschutter/boilerpipe/blob/2c78035a830282e2435c466f3f14d6d4104d0a94/boilerpipe-common/src/main/java/com/kohlschutter/boilerpipe/extractors/CanolaExtractor.java)
  — variant intent and composition.
- **[S10]** Boilerpipe source,
  [`TerminatingBlocksFinder`](https://github.com/kohlschutter/boilerpipe/blob/2c78035a830282e2435c466f3f14d6d4104d0a94/boilerpipe-common/src/main/java/com/kohlschutter/boilerpipe/filters/english/TerminatingBlocksFinder.java)
  and [`IgnoreBlocksAfterContentFilter`](https://github.com/kohlschutter/boilerpipe/blob/2c78035a830282e2435c466f3f14d6d4104d0a94/boilerpipe-common/src/main/java/com/kohlschutter/boilerpipe/filters/english/IgnoreBlocksAfterContentFilter.java)
  — literal terminators and downstream suppression.
- **[S11]** Boilerpipe pinned
  [parent POM](https://github.com/kohlschutter/boilerpipe/blob/2c78035a830282e2435c466f3f14d6d4104d0a94/pom.xml) and
  [`boilerpipe-common` POM](https://github.com/kohlschutter/boilerpipe/blob/2c78035a830282e2435c466f3f14d6d4104d0a94/boilerpipe-common/pom.xml)
  — Java/build and dependency versions.
- **[S12]** Boilerpipe source,
  [`ExtractorBase`](https://github.com/kohlschutter/boilerpipe/blob/2c78035a830282e2435c466f3f14d6d4104d0a94/boilerpipe-common/src/main/java/com/kohlschutter/boilerpipe/extractors/ExtractorBase.java)
  and [`HTMLFetcher`](https://github.com/kohlschutter/boilerpipe/blob/2c78035a830282e2435c466f3f14d6d4104d0a94/boilerpipe-common/src/main/java/com/kohlschutter/boilerpipe/sax/HTMLFetcher.java)
  — URL helper and absent operational bounds.
- **[S13]** Boilerpipe GitHub issue
  [#12, “Time out in HTMLFetcher”](https://github.com/kohlschutter/boilerpipe/issues/12)
  — open first-party tracker evidence of absent timeout.
- **[S14]** Boilerpipe GitHub issue
  [#13, “StackOverflowError”](https://github.com/kohlschutter/boilerpipe/issues/13)
  — reported malformed-parser stack exhaustion.
- **[S15]** Boilerpipe pinned
  [LICENSE](https://github.com/kohlschutter/boilerpipe/blob/2c78035a830282e2435c466f3f14d6d4104d0a94/LICENSE)
  and Neko source header [S8] — Apache-2.0 attribution evidence.
- **[S16]** Boilerpipe archived [WSDM paper page](https://web.archive.org/web/20100315174955id_/http://code.google.com/p/boilerpipe/wiki/WSDM2010Paper)
  and DBLP [bibliographic record](https://dblp.org/rec/conf/wsdm/KohlschutterFN10.html)
  — first-party paper linkage and bibliographic triangulation.
- **[S17]** Maven Central,
  [`de.l3s.boilerpipe:boilerpipe` metadata](https://repo1.maven.org/maven2/de/l3s/boilerpipe/boilerpipe/maven-metadata.xml)
  and [1.1.0 POM](https://repo1.maven.org/maven2/de/l3s/boilerpipe/boilerpipe/1.1.0/boilerpipe-1.1.0.pom)
  — sole Central release and 2010 timestamp.
- **[S18]** Boilerpipe GitHub
  [repository](https://github.com/kohlschutter/boilerpipe),
  [latest commit](https://github.com/kohlschutter/boilerpipe/commit/2c78035a830282e2435c466f3f14d6d4104d0a94),
  [releases](https://github.com/kohlschutter/boilerpipe/releases), and
  [issues](https://github.com/kohlschutter/boilerpipe/issues) — transfer status,
  no GitHub releases, 2015 tip, and unresolved maintenance reports.
