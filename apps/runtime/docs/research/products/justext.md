# jusText boilerplate-removal clean-room dossier

**Decision frame:** Which published jusText ideas should Curiosity adopt, adapt,
reject, or defer when designing a bounded, provenance-preserving main-text
extraction stage for an owned retrieval pipeline?

**Snapshot and authority:** Official project source at release `v3.0.2` (commit
`9fb3340ad2087110348de513e4a4b6fd4f3cc839`), the author's 2011 thesis, and
published evaluations were accessed 2026-08-17. No package was incorporated,
no implementation was produced, and no code or stop-list content is reproduced
here. Public source was read only to distinguish documented behavior from current
release behavior [S1-S5].

**Bounded questions:** (1) How are blocks made? (2) Which local features classify
them? (3) How does neighboring context alter the decision? (4) What language
assumptions and failure modes follow? (5) What performance and security properties
are supported by evidence? (6) What may Curiosity learn without importing code or
data?

## Executive verdict

jusText is a small, deterministic, page-local **block sequence classifier**, not a
semantic article extractor. It cleans and parses HTML, splits text at a fixed set of
block-like tags and repeated line breaks, computes character length, anchor-character
density, and stop-word density, assigns one of four provisional classes, then resolves
the uncertain classes from neighboring reliable blocks. Its objective is explicitly
corpus text made mostly of full sentences, not complete preservation of every useful
fact or every page type [S1-S4].

The durable lesson is the architecture: **cheap local evidence first, bounded sequence
context second, with reasons retained per block**. The exact tag list, stop lists,
thresholds, heading logic, and binary final decision should not be copied. They encode
a 2011 corpus-building objective, language and tokenization assumptions, and current
implementation defects. For Curiosity, extraction should be an evidence-preserving,
versioned projection over an immutable capture, with uncertainty, language routing,
quality gates, and a recall-oriented fallback.

**Overall confidence:** high for release behavior and license; medium-high for the
algorithm's original intent and comparative limitations; medium for asymptotic and
security inferences; low for current real-world latency, stop-list provenance, and
quality on Curiosity's unknown page distribution.

## 1. Identity, objective, and non-goals

- **Fact (high):** The maintained repository describes jusText as a heuristic
  boilerplate remover for navigation, headers, and footers, designed primarily to
  preserve full-sentence text for linguistic corpora. It says this repository is a
  fork of the original, now-unmaintained Google Code project [S1].
- **Fact (high):** PyPI and GitHub identify `3.0.2`, released 2025-02-25, as the
  current release at the snapshot. Its parser dependency is
  `lxml[html_clean] >= 4.4.2`, plus a conditional `functools` backport for Python
  below 3.2; the release fixed Python 2/3 URL imports rather than extraction
  behavior [S2][S5].
- **Fact (high):** The originating thesis frames boilerplate cleaning as avoiding
  corpus-frequency distortion from repeated menus, copyright text, advertisements,
  templates, and similar material. It separately treats duplicate removal; jusText
  itself is not a deduplicator, crawler, renderer, language detector, metadata
  extractor, trust system, or citation verifier [S3].
- **Inference (high):** “Main content” in jusText means *prose-like corpus material*,
  not necessarily the text a search user would consider relevant. A product name,
  price, code sample, table cell, forum reply, address, or legal notice can be highly
  relevant to retrieval while looking non-grammatical to this classifier.

## 2. Behavioral reconstruction

### 2.1 DOM cleaning and block segmentation

**Fact (high).** The public algorithm says that textual blocks are separated at a
fixed list of browser-block-like elements and at two consecutive `<br>` elements.
The current release includes `body`, headings, paragraph/list/table/form-related
elements, `div`, `blockquote`, and others in this separator set. A SAX traversal of
the cleaned DOM accumulates normalized text, counts inline tags, tracks characters
seen while inside anchors, and emits only non-empty blocks. Each block receives a DOM
path and positional XPath [S4][S5].

**Fact (high).** The default preprocessor uses `lxml.html.clean.Cleaner` to remove the
document head, scripts, styles, comments, embedded content, and forms before
segmentation. HTML is parsed into a full DOM first. Character decoding prefers an
explicit caller encoding, then a charset meta declaration, then UTF-8, then a caller
default with replacement by default [S5].

**Negative result / contradiction (high).** The algorithm document says `<header>`,
`<style>`, and `<script>` contents are removed and `<select>` blocks are labeled bad.
Release `3.0.2` instead kills `head` (not the HTML5 `header` element) and removes forms
in its default cleaner; the classifier's `select` rule mainly matters when a custom
preprocessor preserves it. The prose documentation is therefore not an exact current
contract [S4][S5].

**Inference (high).** Segmentation is structural but not visual. It cannot observe
CSS layout, computed visibility, shadow DOM, post-JavaScript content, overlays, or
semantic relationships that do not align with its separator tags. A mixed-content
`div` becomes one indivisible decision; excessively nested block tags fragment prose.

### 2.2 Features and context-free classes

For each block, the release calculates:

| Signal | Current meaning | Clean-room interpretation |
| --- | --- | --- |
| Length | Number of characters after whitespace normalization | Coarse evidence that prose is substantial |
| Link density | Characters accumulated inside anchors divided by all block characters | High values often identify menus/link farms |
| Stop-word density | Case-insensitive stop-list matches divided by whitespace-split words | Proxy for function-word-rich grammatical prose |
| Structural flags | Heading ancestry and whether the DOM path contains `select` | Narrow markup priors |
| Literal marker | Copyright symbol/entity-like text | Strong but brittle boilerplate prior |

Sources: [S4][S5].

**Fact (high).** The published defaults are maximum link density `0.20`, lower and
upper character lengths `70` and `200`, and lower and upper stop-word densities
`0.30` and `0.32`. Release behavior is:

1. excessive link density, a copyright marker, or a select-path block is `bad`;
2. a block shorter than the lower length is `bad` if it contains any linked
   character, otherwise `short`;
3. a non-short block above the high stop-word threshold is `good` only when longer
   than the upper length, otherwise `neargood`;
4. a non-short block above the low threshold is `neargood`; all else is `bad`
   [S4][S5].

`good` and `bad` are intended as reliable anchors. `short` means there is too little
local evidence; `neargood` means prose-like but not independently strong enough.

**Negative result / contradiction (high).** Documentation pseudocode uses strict
`>` stop-word comparisons, whereas release code uses `>=`. The implementation also
treats exactly 200 characters as not long because the upper test is strict. These
boundary differences are small but demonstrate why prose docs and constants should
not be treated as an executable specification [S4][S5].

### 2.3 Context-sensitive resolution

**Fact (high).** Context processing treats document edges as `bad` and searches each
uncertain block's sequence for the nearest stable `good`/`bad` anchors. In conceptual
terms [S4][S5]:

- a `short` block becomes `good` only in strong good context, including the published
  case where it is bracketed by good blocks; otherwise it normally becomes `bad`;
- a `neargood` block becomes `bad` only when both stable sides are bad, otherwise it
  becomes `good`;
- original stable `good` and `bad` classifications are never reconsidered.

The asymmetry is deliberate: ambiguous near-prose is recall-favored near any good
content, while truly short material needs stronger support. Mixed good/bad runs use a
near-good block as a transition marker; a run containing only short blocks is lost at
the document edge or between conflicting anchors [S4].

**Fact (high).** Heading handling is intended to promote a short heading near a later
good block (default distance 200 characters) before context resolution, then promote
eligible headings again after resolution. The post-pass is non-iterative [S4][S5].

**Observed release defect (high).** Open issue #45 demonstrates that in `3.0.0` the
heading pre-pass copied and examined classifications incrementally, so later good
blocks were not yet visible. The same control flow remains in `3.0.2`; thus the
pre-pass cannot provide the documented rescue of intervening short blocks. The later
heading post-pass can still promote the heading itself. This is a source-backed static
observation, not an executed test in this research [S8].

**Inference (medium-high).** Neighbor scans restart for each uncertain block. A long
run of uncertain blocks can therefore produce quadratic classification work in block
count, although normal pages with nearby stable anchors are likely much closer to
linear. No official complexity or worst-case bound was found.

## 3. Language dependency

- **Fact (high):** Stop-word membership is the only lexical language model. Words are
  lowercased and split on whitespace; there is no morphology, script segmentation,
  language identification, sentence parser, or multilingual mixture model [S4][S5].
- **Fact (high):** Release `3.0.2` packages 100 named stop-list files. That count is an
  inventory count, not evidence of equal coverage or quality. Japanese and Chinese
  are not included; a proposed Japanese list was closed without merge [S9].
- **Fact (high):** Since `2.2.0`, matches are case-insensitive. Since `1.2.0`, character
  counts replaced word counts where possible to help a language-independent mode for
  languages where whitespace word counting is difficult [S2].
- **Fact / interface trap (high):** The command-line program activates its
  language-independent profile by passing an empty stop list *and setting both
  stop-word thresholds to zero*. The library entry point does not perform that
  adjustment. Calling the API with an empty list and default thresholds yields zero
  density and makes every non-short block locally bad. “No language” is therefore a
  profile, not merely an empty lexical resource [S5].
- **Fact (medium-high):** An open project issue has long challenged the German list as
  containing many content words. The report is not a benchmark, but it is concrete
  evidence that packaged-list presence is not quality assurance [S10].
- **Fact (medium-high):** A five-language 2020 evaluation found material performance
  variation across languages and page layouts; no single generic extractor dominated
  every setting. It reported the jusText language-independent setting as useful for
  Chinese, reinforcing that a mismatched whitespace stop list is not a safe default
  [S6].

**Inference (high).** Wrong-language and mixed-language pages move density in
unpredictable directions. Domain terms accidentally present in a stop list can make
menus or catalogs look grammatical; inflection, clitics, punctuation attachment, and
scripts without spaces can suppress legitimate matches. Thresholds calibrated for
one stop-list construction method are not portable to another list size or domain.

## 4. Failure-mode map

| Page/content condition | Likely failure | Basis | Curiosity control |
| --- | --- | --- | --- |
| SPA or client-rendered body | Empty/stale extraction after scripts are removed | Structural fact + inference [S5] | Static quality gate, then isolated rendered lane |
| Terse product, API, address, recipe, code, table, poetry | False-negative blocks from low stop-word density or shortness | Objective and rules [S1][S4] | Page-type-aware profile; retain structured/terse lane |
| Forum/chat with many short messages | Loss unless strong good context brackets the run | Context rules [S4] | Preserve uncertain run; forum-aware extractor |
| Heavily linked legitimate prose/citations | False negative from anchor-character ratio | Rule [S4][S5] | Treat density as evidence, not an irreversible veto |
| Unlinked navigation or prose-like cookie/legal text | False positive from low link density and function words | Feature limitations | Repetition/site-template and semantic priors |
| Article paragraph containing `©` | Entire block forced bad | Current release behavior [S5] | Narrow marker scope; reason code and override |
| Mixed good and boilerplate inside one DOM block | All-or-nothing error | Segmentation model [S4] | Finer candidate spans, but bounded fragmentation |
| Over-fragmented markup | Good prose loses independent length and context | Segmentation/context inference | Merge evidence with provenance before final decision |
| Content near document edge | Recall loss because edges are synthetic bad anchors | Published rule [S4] | Learn edge prior, never make it absolute |
| Heading followed by short lead then prose | Lead can be lost due to current heading pre-pass defect | Open defect [S8] | Conformance tests for every sequence transition |
| Wrong or empty API stop list | Broad misclassification | Language/interface facts [S5] | Explicit validated language profile |
| Malformed encoding/HTML | Replacement characters, parser repair, altered blocks | Decode/parser behavior [S5] | Record decode/parser diagnostics and raw digest |
| CSS-hidden or accessibility-only text | Visibility disagreement | No rendering/CSS signal | Separate DOM text from rendered visibility policy |

The classifier is also susceptible to **content-shaped evasion**: an adversarial page
can wrap desired text in anchors, pad a block with function words, split text around
separator tags, or imitate prose in boilerplate. This is an inference from transparent
features, not evidence that jusText claims adversarial robustness.

## 5. Performance and evaluation evidence

### What is supported

- **Fact (high):** Feature extraction is shallow, deterministic, model-free, and
  local to one parsed page. Stop-list normalization is cached and membership uses a
  frozen set in the current release [S5].
- **Fact (medium-high):** A 2012 paper by the original author reports using jusText in
  the pipeline that produced a 70-billion-word English corpus from ClueWeb09. This is
  evidence of practical batch scalability, not a reproducible per-page throughput or
  memory guarantee for release `3.0.2` [S7].
- **Fact (medium-high):** A 2021 published benchmark using a customized jusText 2.2.0
  configuration reported precision `0.870`, recall `0.584`, F1 `0.699`, and runtime
  `6.1x` its simple baseline on that benchmark. The low recall is consistent with the
  corpus-prose objective; results are version-, tuning-, corpus-, and metric-specific
  and must not be generalized to Curiosity [S11].
- **Fact (medium-high):** The 2020 multilingual study found divergent outcomes by
  language/layout and emphasized tool choice and tuning rather than a universal
  winner [S6].

### What is not supported

- **Negative result (high):** No official current p50/p95 latency, bytes/sec, maximum
  input, peak-memory bound, cancellation mechanism, or concurrency guarantee was
  found.
- **Inference (high):** Building and cleaning a complete DOM makes memory at least
  proportional to parsed document size with parser overhead. Segmentation and feature
  passes are normally linear in DOM/text size, while repeated neighbor searches admit
  a quadratic block-count worst case.
- **Recommendation (high):** Curiosity must benchmark extraction separately by page
  type, language, input bytes, DOM nodes, blocks, output recall/precision, retrieval
  recall, latency, and peak RSS. A corpus-token total or aggregate F1 is not an SLO.

## 6. Security and operational boundary

**Facts.** The library API parses caller-supplied HTML through lxml and accepts a
pluggable preprocessor. The bundled CLI can also open a URL directly. The project has
no `SECURITY.md` and showed no published GitHub security advisories at the snapshot.
Its dependency declaration permits any lxml from `4.4.2` upward rather than pinning a
reviewed release [S5][S12]. Absence of a project advisory is not evidence of safety.

**Inferences.** Main risks are parser/dependency vulnerabilities, CPU and memory
exhaustion from oversized or pathological HTML, deep/numerous DOM nodes, decode
amplification, and unbounded output. If the URL-capable CLI is exposed as a service,
the surrounding application also inherits SSRF, redirect, DNS-rebinding, scheme, and
response-size risks. A custom preprocessor is executable trusted code, not untrusted
configuration. Extracted text remains attacker-controlled and may contain prompt
injection, misinformation, secrets, or active-looking instructions even after scripts
are stripped.

**Recommendations.** Fetch outside the extractor under Curiosity's URL/IP/scheme,
redirect, robots, MIME, byte, decompression, deadline, and egress policies. Parse in an
isolated worker with current pinned parser dependencies, input/DOM/block/output caps,
CPU and memory limits, cancellation, and typed failure. Disable external resource
resolution explicitly rather than relying on changing parser defaults. Treat all text
and attributes as untrusted data; never let extraction labels grant instruction
authority. Preserve the immutable fetched bytes and diagnostics so a new extractor
can be replayed without refetching.

## 7. License and code-contamination boundary

- **Fact (high):** Release `v3.0.2` is BSD-2-Clause, copyright Jan Pomikálek (2011)
  and Michal Belica (2013). Source redistribution must retain copyright, conditions,
  and disclaimer; binary redistribution must reproduce them in accompanying material
  [S13].
- **Fact (high):** The package includes 100 stop-list files and depends on lxml.
  Third-party dependency notices and any stop-list data provenance remain separate
  diligence items; the repository does not provide a per-list origin/license ledger
  [S5].
- **Unknown (medium):** This research did not establish the origin, authorship, or
  independent reuse rights of every bundled stop list. A repository-level BSD file is
  positive evidence for the distribution, but is not a substitute for a Curiosity
  provenance review before copying those data files.

**Clean-room rule:** Curiosity may learn from the paper's public algorithm and general
ideas—block candidates, link-density evidence, function-word evidence, uncertain
states, and sequence context—but should author its own specification and tests from
requirements. Do not copy Python control flow, constant names, tag sets, test fixtures,
comments, or packaged stop lists. Do not translate line-by-line. If the project is
ever used as a dependency or code is reused, record the exact version and hashes in
`provenance/`, preserve BSD notices, review lxml and data licenses, and keep it behind
a provider-neutral adapter. No jusText code or stop-list material is included here.

## 8. Curiosity decision ledger

| ID | Type | Claim / action | Confidence | Verdict |
| --- | --- | --- | --- | --- |
| L1 | Fact | Cheap block features followed by bounded sequence context are the core design. | High [S3-S5] | **ADAPTED** |
| L2 | Recommendation | Preserve block boundaries, local features, provisional/final labels, and reason codes. | High | **ADOPTED** |
| L3 | Recommendation | Keep `uncertain` as a first-class outcome instead of forcing every block to content/boilerplate. | High | **ADAPTED** from short/neargood |
| L4 | Fact | Stop-word density is language-, tokenization-, list-, domain-, and profile-dependent. | High [S4-S6][S10] | Exact feature **REJECTED** as universal gate |
| L5 | Recommendation | Route by language/script/page type and validate the profile explicitly; support mixed-language segments. | High | **ADOPTED** |
| L6 | Fact | Link density is useful but legitimate linked prose and adversarial markup violate the prior. | High | **ADAPTED** as soft evidence |
| L7 | Fact | Stable local good/bad anchors are never reconsidered by context. | High [S4][S5] | **REJECTED**; permit bounded override with reason |
| L8 | Fact | Document edges are hard-coded as bad context. | High [S4] | **REJECTED** as absolute rule |
| L9 | Fact | Current heading preprocessing diverges from documented intent. | High [S8] | **ADOPTED lesson:** transition-level conformance tests |
| L10 | Recommendation | Separate static extraction from an isolated rendered fallback selected by quality gates. | High | **ADOPTED** |
| L11 | Recommendation | Preserve raw capture; make cleaned text a versioned, replayable projection. | High | **ADOPTED** |
| L12 | Recommendation | Evaluate downstream retrieval/citation recall, not just boilerplate token F1. | High | **ADOPTED** |
| L13 | Fact | jusText is BSD-2-Clause but code/data/dependency obligations still require provenance. | High [S5][S13] | Dependency use **DEFERRED** |
| L14 | Recommendation | Independently design the owned extractor; do not copy source, tests, tag lists, or stop lists. | High | **ADOPTED** clean-room boundary |
| L15 | Recommendation | Maintain more than one bounded extractor/profile and choose by observable quality, not silent fallback. | Medium-high [S6][S11] | **ADAPTED** |

## 9. Proposed checks before any Curiosity decision

1. **Gold corpus:** Stratify owned/public fixtures by articles, forums, products,
   docs/code, tables, legal pages, multilingual/mixed-language, malformed HTML, SPA,
   accessibility text, and adversarial structure.
2. **Span labels:** Label required, optional, boilerplate, unsafe, and uncertain spans;
   do not force all visible text into a binary gold label.
3. **Sequence properties:** Test every combination of stable/uncertain neighbors,
   edge runs, heading distance, exact thresholds, and long uncertain runs.
4. **Metamorphic checks:** Anchor-wrap prose, add benign stop words, vary block tags,
   move content to edges, change language, and insert copyright markers; decisions
   should change only for recorded reasons.
5. **Resource checks:** Enforce byte/DOM/depth/block/output/time/memory caps against
   synthetic worst cases; verify cancellation and no network access during parsing.
6. **Retrieval checks:** Measure query-level relevant-passage recall, citation-span
   preservation, ranking effect, and false evidence introduced—not only token F1.
7. **Replay/drift:** Store capture digest, decoder/parser/extractor/profile versions,
   language decision, features, reasons, and output digest; compare versions offline.
8. **License checks:** Produce a dependency and data SBOM, verify every lexical
   resource's origin, and obtain review before any third-party implementation enters
   the owned core.

## 10. Unknowns

| Unknown | Why it matters | Bounded resolution |
| --- | --- | --- |
| Curiosity page/language distribution | Determines whether prose priors fit | Sample captures after collection policy is approved |
| Exact stop-list provenance and per-list quality | Rights and classification drift | Trace repository history/upstream sources; do not copy meanwhile |
| Current `3.0.2` quality and latency | Published results use older/tuned versions | Reproducible offline benchmark only if dependency evaluation is authorized |
| Worst-case parser/classifier resources | Availability/security | Synthetic capped worker benchmark and complexity tests |
| Best uncertainty/fallback trigger | Controls recall, cost, render escalation | Tune against downstream passage recall and explicit budget |
| Mixed-language routing granularity | Affects cross-language pages | Compare document, block, and script-run routing on labeled fixtures |
| Rich-structure preservation | Search may need tables, code, lists, headings | Define separate structural extraction contract before implementation |

## 11. Bounded curiosity pass

Scoring is relevance / decision value / novelty / cost, each 1–5. Only already
authorized public-source research was pursued.

| Thread | Score | Action |
| --- | --- | --- |
| Reconcile algorithm prose with release behavior | 5/5/4/2 | **Pursued:** found preprocessing and threshold drift. |
| Verify heading-context behavior | 5/5/5/2 | **Pursued:** open issue plus current source show the pre-pass defect persists. |
| Clarify language-independent mode | 5/5/4/1 | **Pursued:** found CLI/API semantic mismatch. |
| Find cross-language evidence | 5/4/3/2 | **Pursued:** retained the 2020 five-language evaluation and its limited conclusion. |
| Infer hidden proprietary behavior | 1/1/1/5 | **CURIOSITY_NO_GO:** none exists or is needed; public algorithm/source suffice. |
| Copy or execute packaged stop lists | 2/2/2/4 | **CURIOSITY_NO_GO:** provenance unresolved and clean-room transfer unnecessary. |
| Live-crawl websites to compare extractors | 3/4/3/5 | **CURIOSITY_NO_GO:** no declared corpus, network-test authority, or reproducibility plan. |
| Exhaustively audit 100 stop-list histories | 3/4/4/5 | **DEFERRED:** required only if lexical data reuse is proposed. |
| Provide a legal/patent freedom-to-operate opinion | 3/5/2/5 | **CURIOSITY_NO_GO:** outside research authority; counsel decides. |
| Benchmark parser denial-of-service payloads | 4/5/3/5 | **DEFERRED:** valuable in a separately authorized isolated security test. |

**Stop condition:** Coverage was reached for every caller-requested dimension and
primary-source findings saturated. Remaining material gaps require an authorized
benchmark, security test, lexical provenance audit, or legal review; research stopped
on authority/budget exhaustion rather than speculating.

## Sources

All sources were accessed 2026-08-17. GitHub source links are pinned to release
`v3.0.2` commit `9fb3340ad2087110348de513e4a4b6fd4f3cc839` where applicable.

- **[S1]** jusText official README, purpose, history, usage, and dependency statement,
  <https://github.com/miso-belica/jusText/blob/9fb3340ad2087110348de513e4a4b6fd4f3cc839/README.rst>.
- **[S2]** jusText official changelog and release `v3.0.2`,
  <https://github.com/miso-belica/jusText/blob/9fb3340ad2087110348de513e4a4b6fd4f3cc839/CHANGELOG.rst> and
  <https://github.com/miso-belica/jusText/releases/tag/v3.0.2>.
- **[S3]** Jan Pomikálek, *Removing Boilerplate and Duplicate Content from Web
  Corpora*, PhD thesis, Masaryk University, 2011, especially chapter 2, pp. 19–54,
  <https://is.muni.cz/th/o6om2/> and
  <https://is.muni.cz/th/45523/fi_d/phdthesis.pdf>.
- **[S4]** jusText, “Description of the jusText boilerplate cleaning algorithm,”
  <https://github.com/miso-belica/jusText/blob/9fb3340ad2087110348de513e4a4b6fd4f3cc839/doc/algorithm.rst>.
- **[S5]** jusText `3.0.2` pinned source: parser/preprocessor, segmentation,
  classification, and entry point,
  <https://github.com/miso-belica/jusText/blob/9fb3340ad2087110348de513e4a4b6fd4f3cc839/justext/core.py>;
  paragraph metrics,
  <https://github.com/miso-belica/jusText/blob/9fb3340ad2087110348de513e4a4b6fd4f3cc839/justext/paragraph.py>;
  CLI language-independent profile,
  <https://github.com/miso-belica/jusText/blob/9fb3340ad2087110348de513e4a4b6fd4f3cc839/justext/__main__.py#L277-L301>;
  package metadata,
  <https://github.com/miso-belica/jusText/blob/9fb3340ad2087110348de513e4a4b6fd4f3cc839/setup.py#L22-L43>.
- **[S6]** Adrien Barbaresi and Gaël Lejeune, “Out-of-the-Box and into the
  Ditch? Multilingual Evaluation of Generic Text Extraction Tools,” WAC 2020,
  <https://aclanthology.org/2020.wac-1.2/>.
- **[S7]** Jan Pomikálek, Miloš Jakubíček, and Pavel Rychlý, “Building a 70 billion
  word corpus of English from ClueWeb,” LREC 2012,
  <https://aclanthology.org/L12-1624/>.
- **[S8]** jusText issue #45, “Preprocessing of header blocks,” open since
  2022-11-09, <https://github.com/miso-belica/jusText/issues/45>, triangulated
  against current `core.py` [S5].
- **[S9]** Official stop-list directory and unmerged Japanese proposal,
  <https://github.com/miso-belica/jusText/tree/9fb3340ad2087110348de513e4a4b6fd4f3cc839/justext/stoplists> and
  <https://github.com/miso-belica/jusText/pull/44>.
- **[S10]** jusText issue #10, “Broken stopword list (German),”
  <https://github.com/miso-belica/jusText/issues/10>.
- **[S11]** Adrien Barbaresi, “Trafilatura: A Web Scraping Library and Command-Line
  Tool for Text Discovery and Extraction,” ACL-IJCNLP 2021, table 1 and discussion,
  <https://aclanthology.org/2021.acl-demo.15/>.
- **[S12]** jusText GitHub security overview (no policy/advisories at snapshot),
  <https://github.com/miso-belica/jusText/security>.
- **[S13]** jusText BSD-2-Clause license text,
  <https://github.com/miso-belica/jusText/blob/9fb3340ad2087110348de513e4a4b6fd4f3cc839/LICENSE.rst>.
