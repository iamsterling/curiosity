# Mozilla Readability: clean-room product and algorithm study

**Date / source-access date:** 2026-08-17  
**Decision:** which behavioral ideas Curiosity should adopt, adapt, reject, or
defer when designing an independently authored main-content extractor.  
**Status:** research record only; not an implementation, dependency approval,
or legal opinion.  
**Upstream snapshot:** `@mozilla/readability` 0.6.0, repository `main` at
`ab4027a8b37669745016869a37a504727992b2ba` (latest commit observed on the
access date) [S1][S16].

## Executive verdict

**ADAPT, do not clone (high confidence).** Readability is a mature,
deterministic DOM heuristic whose durable idea is not one magic score. It is a
pipeline: normalize messy HTML, cheaply reject obvious chrome, let substantial
text vote for nearby containers, discount link-heavy regions, widen the winner
to plausible siblings, clean the resulting subtree, and retry with successively
less aggressive filters when the result is too short [S2]. Metadata extraction
is a separate precedence system over JSON-LD, meta elements, title heuristics,
and body byline signals. That decomposition is highly relevant to Curiosity.

It is not a security boundary, a general semantic-document parser, a multi-
article segmenter, or a stable-output contract. Its README explicitly requires
external sanitization and defense-in-depth CSP; its changelog says output for a
given document may change in minor releases [S3][S5]. Its default element bound
is unlimited, its output length is uncapped, and its quick readerability probe
is intentionally allowed both false positives and false negatives [S2][S3].

For Curiosity, retain immutable raw captures and provenance, perform extraction
in a bounded non-networked parser, represent metadata as source-attributed
claims rather than unquestioned truth, return extraction diagnostics and
alternatives, sanitize before any rendering, and index only a separately
normalized safe representation. Build an independent extractor from a written
behavioral specification and independently curated corpus; do not translate
Readability's source, regular expressions, constants, or fixture outputs.

## 1. Frame, method, and evidence labels

### 1.1 Bounded sub-questions

1. What observable stages lead from a DOM to the selected content?
2. How are title, byline, excerpt, publication time, language, direction, and
   site name chosen?
3. What is removed, preserved, or rewritten, and what is *not* sanitized?
4. Which resource bounds, retry behavior, and output guarantees exist?
5. Where do DOM shape, language, site vocabulary, and dynamic layout bias the
   result?
6. Which product ideas transfer to Curiosity without source-code or license
   contamination?

**Research boundary.** Public, authorized materials only: Mozilla's repository,
README, changelog, security policy, source, test-tree inventory, and public
issues; one paper lead cited by a maintainer was checked. No private Firefox
telemetry, proprietary browser implementation, live-site crawling, package
execution, or source/test copying occurred. Source was read to describe behavior
at a conceptual level. All web sources were accessed 2026-08-17.

**Labels:**

- **FACT** — directly supported by cited primary evidence.
- **INFERENCE** — a reasoned consequence not directly measured here.
- **RECOMMENDATION** — a proposed Curiosity choice.
- Confidence is **high**, **medium**, or **low**.

### 1.2 Product boundary

**FACT (high):** the repository describes the package as the standalone library
used for Firefox Reader View, but the package is not the complete Reader View
product UI. The public API accepts a DOM `Document`, mutates it during `parse()`,
and returns one article object or `null`; callers should clone the document if
they need the original [S3]. The object contains title, processed HTML, plain
text, character length, excerpt, byline, direction, site name, language, and
published time [S3].

**FACT (high):** `isProbablyReaderable` is a separate, deliberately cheap
preflight. It is not equivalent to `parse()` and Mozilla documents that it can
produce both false positives and false negatives [S3][S4].

**INFERENCE (high):** Curiosity should evaluate the extractor, preflight, and
Firefox UI decision as three different behaviors. A missing Reader View icon
does not prove that full extraction would fail.

## 2. Behavioral model

### 2.1 End-to-end state machine

The following is a behavioral restatement, not pseudocode derived for reuse:

```text
input DOM + base/document URI + options
  -> reject over-element-limit document if a nonzero limit was configured
  -> recover selected images represented inside noscript elements
  -> read supported JSON-LD while script elements still exist
  -> remove script/noscript and stylesheet elements
  -> normalize legacy/paragraph-like markup
  -> resolve metadata and title
  -> repeat candidate extraction under an ordered relaxation policy
       remove invisible/dialog/unlikely regions
       normalize text-bearing containers
       score text blocks into ancestor containers
       discount link-dense candidates
       select/widen a winning region
       join qualifying siblings
       clean the assembled subtree
       accept, relax one filter, or retain the longest nonempty attempt
  -> fix media/link URIs, simplify wrappers, remove most classes
  -> derive excerpt fallback and serialize one article result
```

This sequence is supported by the constructor flags, document preparation,
candidate loop, post-processing, and `parse()` orchestration in the pinned source
[S2].

### 2.2 DOM preparation

**FACT (high):** before scoring, Readability:

- optionally rejects a document whose element count exceeds the configured
  `maxElemsToParse`;
- recovers an image from a narrowly recognized `noscript` pattern, then removes
  scripts and remaining `noscript` elements;
- removes stylesheet elements, rewrites legacy font elements, and converts runs
  of line breaks into paragraph structure;
- traverses depth-first, records root language, removes nodes hidden by selected
  inline/HTML/ARIA signals, and removes modal dialogs;
- recognizes and removes a short byline-looking node before content scoring;
- suppresses one heading sufficiently similar to the chosen title;
- removes regions whose class/id or ARIA role looks like navigation, comments,
  banners, dialogs, sidebars, and related chrome, subject to exceptions;
- converts text-like runs inside generic containers into paragraphs and treats
  paragraph-like generic containers as paragraphs [S2].

**Important boundary (fact, high):** visibility is inferred from DOM attributes
and inline style properties, not computed layout. External CSS, clipping,
off-screen positioning, overlays, viewport position, and shadow/composed-tree
semantics are not generally observed by this stage [S2].

**INFERENCE (high):** this is a source-DOM extractor with sparse presentation
signals, not a visual extractor. Server-side HTML that differs from the hydrated
DOM and pages whose meaning is created by CSS/JavaScript are intrinsic weak
spots.

### 2.3 Scored blocks and candidate formation

**FACT (high):** scoring starts from section and heading elements plus paragraph,
table-cell, and preformatted-text elements. A text block shorter than 25
characters does not vote. A qualifying block receives a base contribution,
additional contribution for sentence-like comma punctuation, and a capped
length contribution. That contribution flows upward through at most five
ancestors: the parent receives the most, the grandparent less, and deeper
ancestors sharply less [S2].

**FACT (high):** when a candidate container is initialized, its HTML element
type supplies a prior: generic content containers and preformatted/table-cell/
quotation containers receive positive priors, while list, form, address,
heading, and header-cell containers receive negative priors. Class and ID tokens
that look content-positive or chrome-negative can each strongly alter the score.
The candidate's final score is then multiplied by the complement of its link
density; fragment-only links are discounted in that density calculation [S2].

**INFERENCE (high):** the model encodes a newspaper/blog prior: prose is made of
moderately long, punctuation-bearing blocks clustered beneath one nearby
container, while navigation is link-heavy. It is structurally interpretable but
not content-semantic. Repetitive generated text or adversarial class names can
win; terse technical, poetic, conversational, or CJK prose can under-vote.

### 2.4 Winner correction and sibling assembly

**FACT (high):** the highest adjusted candidate is not accepted blindly.
Readability keeps a configurable top-N list (default five), can promote a common
ancestor when at least three near-competitive alternatives share it, may move
upward when a parent's score improves without falling below a floor, and climbs
through single-child wrappers [S2][S3]. If no useful candidate exists, it wraps
the body as a fallback [S2].

**FACT (high):** it then examines siblings of the winner. The winner is always
included. Other siblings can join if their score clears a threshold, if they
share a class with the winner, or if they are plausible prose paragraphs based
on length, link density, and terminal punctuation [S2].

**INFERENCE (high):** sibling joining is what recovers introductions and article
segments separated by ads, but it also explains footer, recommendations, and
adjacent-article leakage. The unit returned is a connected neighborhood around
one winner, not a set of semantically segmented article blocks.

### 2.5 Ordered relaxation and success semantics

**FACT (high):** extraction begins with three aggressive behaviors active:
unlikely-region stripping, class/id weighting, and conditional cleaning. If the
assembled text is shorter than the configurable character threshold (default
500), the original page body is restored and one behavior is disabled at a time
in that order. After exhausting relaxations, the longest nonempty attempt is
returned; only an empty best attempt produces `null` [S2][S3].

**Consequence (fact, high):** `charThreshold` is not a hard minimum on returned
article length. It controls acceptance/retry. A nonempty result below that
threshold can still be returned after all attempts [S2].

**INFERENCE (high):** this ordered sieve is a strong recall mechanism, but the
last-resort result has materially weaker precision than a first-pass result. The
public output does not disclose which attempt won or which filters were relaxed.

## 3. Metadata behavior

### 3.1 Title

**FACT (high):** metadata title precedence begins with supported JSON-LD and then
recognized Dublin Core, Open Graph, Weibo, generic, Twitter, and Parse.ly meta
fields. If none exists, the title heuristic starts from `document.title`. It
tries to remove a site/section suffix around common separators, treats colon
titles specially, may use the sole H1 when the title is unusually short or
long, normalizes whitespace, and backs away from over-shortening. When JSON-LD
offers distinct `name` and `headline`, similarity to the HTML title helps choose
between them [S2].

**FACT (high):** one H1/H2 whose token similarity to the resolved title exceeds
the internal threshold is removed from the body to avoid duplication; remaining
H1 elements in extracted content are demoted to H2 [S2].

**INFERENCE (medium):** title logic assumes separators and whitespace-delimited
words with conventions common in Latin-script publishing. It can preserve a
site suffix, discard a meaningful subtitle, or remove a legitimate first
heading. Structured metadata can override a visually correct title even when it
is stale or SEO-oriented.

### 3.2 Byline

**FACT (high):** metadata byline precedence is supported JSON-LD, selected
Dublin Core/generic/Parse.ly meta fields, then a non-URL `article:author` value.
If metadata is absent, the body traversal recognizes a short node by `rel`,
`itemprop`, class, or ID author signals. It prefers a descendant marked as a
name when found, stores its text, and removes the byline node from scored
content. The DOM fallback requires nonempty text shorter than 100 characters
[S2].

**INFERENCE (high):** byline extraction is a destructive first-match heuristic.
It can lose dates or affiliations nested in the same node, select an unrelated
“author” UI label, or miss a long/multi-author byline. Metadata precedence hides
conflicts rather than reporting them.

### 3.3 Other fields

**FACT (high):** excerpt, site name, and publication time use supported JSON-LD
and recognized meta fields. If excerpt is absent, the first extracted paragraph
becomes the excerpt. Direction is taken from the first qualifying ancestor of
the selected region; language comes from the root HTML element. Returned length
is the JavaScript string length of extracted `textContent`, not bytes, words,
grapheme clusters, or semantic content units [S2][S3].

**INFERENCE (high):** publication time and author are publisher assertions, not
verified facts. Curiosity should preserve the field origin and raw value, and
must not conflate claimed publication time with fetch, first-seen, or revision
time.

## 4. Content cleanup and preservation

### 4.1 Presentation cleanup

**FACT (high):** after assembly, Readability removes presentational attributes
and inline styles (with an SVG exception), identifies probable data tables so
they survive stronger cleanup, repairs common lazy-image encodings, and removes
or conditionally removes forms, fieldsets, objects, embeds, footers, links,
asides, iframes, controls, suspicious headers, tables, lists, and generic
containers [S2].

Conditional removal considers class weight, punctuation, paragraph/image/list/
input/embed counts, heading and text density, link density, short suspicious
words, figure/code/data-table context, and exceptions for image lists. Single-
cell layout tables are flattened. Empty paragraphs and redundant line breaks
are removed. Classes are stripped by default except Readability's page marker
and explicitly configured preserves [S2][S3].

**FACT (high):** embedded media is allowlisted by URL-pattern matching; the
default recognizes several major video/archive providers, and callers may
replace the expression. Lazy-image repair infers image URLs from attributes.
Post-processing makes link and media URLs absolute using the document base URI,
replaces links beginning with the `javascript:` spelling, simplifies empty or
single-wrapper generic containers, and serializes HTML by default [S2][S3].

### 4.2 Data-table inference

**FACT (high):** a table is treated as data-bearing when indicated by semantics
such as summary/caption/header structures or sufficient two-dimensional size;
presentation roles, nested tables, and single-row/column shapes count against
it. Marked data tables and their descendants are protected from some cleanup
[S2].

**INFERENCE (medium):** table preservation is useful for evidence retrieval but
remains heuristic. Small legitimate tables can flatten or disappear, while
large layout matrices can survive. Curiosity should retain a table-specific
representation and extraction warning instead of relying only on serialized
HTML.

## 5. Bounds, determinism, and operational contract

| Property | Observed behavior | Curiosity consequence |
| --- | --- | --- |
| Input element bound | Option exists; default is 0, meaning unlimited. Exceeding a configured bound throws before extraction [S2][S3]. | **RECOMMENDATION:** require nonzero policy bounds and return a typed bounded-failure result. |
| Candidate breadth | Top-candidate count defaults to five; it does not bound input traversal [S2][S3]. | Do not mistake ranking breadth for resource control. |
| Retry count | Initial attempt plus up to three ordered relaxations [S2]. | Budget worst-case repeated traversal and expose winning attempt. |
| Output size | No public content/text cap; serializer is caller-supplied [S2][S3]. | Cap stored/returned representations independently of fetch size. |
| Recursion/depth | Several cleanup and ancestry operations recurse or walk DOM depth; no documented depth bound [S2]. | Parser depth and wall-clock/cancellation limits are required. |
| DOM mutation | Parsing removes, moves, wraps, and retags nodes [S2][S3]. | Operate on an isolated parsed copy and retain immutable source bytes. |
| Network | Core accepts a DOM; it does not fetch the page. Correct base URI must be supplied for URL rewriting [S3]. | Keep fetch policy/SSRF controls outside but upstream of extraction. |
| Result cardinality | Exactly one article or `null` [S2][S3]. | Multi-article ambiguity needs a different contract. |
| Output stability | Changelog excludes per-document output from minor-version stability [S5]. | Pin extractor version and include it in every document/passage identity. |
| Fast preflight | Tunable minimum block length/score; intentionally approximate [S3][S4]. | Never treat it as a quality verdict or authoritative filter. |

**INFERENCE (high):** for ordinary DOMs, dominant work appears approximately
linear in nodes plus repeated descendant queries and up to four attempts, but no
formal complexity or adversarial runtime guarantee was found. Nested descendant
queries and repeated text aggregation can make practical behavior worse than a
single linear pass. This study did not benchmark it.

**FACT (high):** the pinned repository contains 130 fixture directories, each
generally pairing captured source with expected HTML and metadata, plus parser
and readerability tests [S10]. This is substantial regression evidence, not a
representative-web accuracy benchmark. No official precision/recall, multilingual
coverage, latency SLO, or adversarial-resource claim was found.

## 6. Failure patterns and layout/language bias

### 6.1 Structural and dynamic failures

| Failure family | Mechanism | Evidence / confidence |
| --- | --- | --- |
| Multiple or infinite-scroll articles | One-winner API selects the largest plausible prose neighborhood; it cannot attach the current URL/title/byline to one of several articles. | Mozilla maintainer describes this limitation and the architecture change required [S8]. **High.** |
| Wrong large region / truncation | A long header, transcript, comments block, or later article can outscore the intended body; sibling joining can over- or under-include. | Public cut-off report [S12], scoring source [S2]. **Medium-high**; issue report is a case, not prevalence data. |
| JavaScript-only or partially hydrated body | Extraction sees only the supplied DOM snapshot and removes scripts; it does not execute an application to obtain missing text. | API/source [S2][S3]. **High.** |
| CSS-dependent visibility/order | Only selected inline/attribute visibility signals are tested; computed layout and viewport order are absent. | Source [S2]. **High.** |
| Nonsemantic paragraph markup | Quick preflight chiefly examines paragraph/pre/article and line-break containers; full extraction normalizes some generic containers but cannot infer every custom component. | Readerability source [S4], maintainer discussion [S7]. **High.** |
| Dense navigation / references | Link density suppresses candidates and conditional cleanup removes link-heavy regions, potentially losing legitimate link essays, bibliographies, tables of contents, or API indexes. | Source [S2]. **High.** |
| Media-first pages | Image/embed ratios and text thresholds favor prose; supported provider patterns can preserve some video but do not make the page semantically extractable. | Source [S2]. **High.** |
| Adversarial or accidental class tokens | Human-language substring patterns strongly affect prior scores; modern utility classes can accidentally match negative vocabulary. | Open issue gives an `overflow-hidden` example [S11]; source confirms weighting [S2]. **Medium-high.** |

### 6.2 Language and genre bias

**FACT (high):** the full scorer rewards comma-like punctuation and character
count. Mozilla expanded recognized comma variants in 2023, showing active
multilingual correction, but the positive/negative class vocabulary and many
chrome/ad/loading terms remain largely English-oriented [S2][S5]. An open issue
reports footer leakage on non-English sites [S9].

**FACT (medium-high):** an open Japanese-site issue reports that the cheap
readerability probe discarded many short paragraphs even though unconditional
full extraction worked “more or less correctly.” A maintainer identified both
the speed constraint and cross-language information-per-character difference as
the fundamental concern, and pointed to reading-rate research as a possible
normalization source [S7].

**INFERENCE (high):** fixed character thresholds are not language-neutral.
Character count differs from words and graphemes; punctuation frequency and
whitespace segmentation vary by script and genre. The bias affects the fast
probe most clearly, but also block voting, retry acceptance, title word counts,
short-content cleanup, and byline length.

**INFERENCE (medium):** the fixture tree spans several languages and right-to-
left cases, but fixture presence does not establish balanced language coverage
or generalization. The open language issues are negative evidence against any
claim of language neutrality [S7][S9][S10].

### 6.3 Metadata and semantic failures

- **FACT (high):** only a bounded subset of Schema.org JSON-LD shapes and article
  types is interpreted; it is not a general JSON-LD graph processor [S2].
- **INFERENCE (high):** SEO metadata may be stale, promotional, truncated, or for
  the wrong entity; precedence can make it outrank correct visible text.
- **INFERENCE (high):** body byline removal can alter subsequent content scoring
  and discard context; title-heading deduplication can remove nonduplicate
  headings because similarity is asymmetric token overlap rather than semantic
  identity [S2].
- **FACT (high):** Mozilla says semantic HTML alone is insufficient because real
  sites often misuse elements; the maintainer characterizes the algorithm as
  largely heuristic and class/ID-driven [S6].

## 7. Security analysis

### 7.1 What Readability does and does not guarantee

**FACT (high):** Mozilla explicitly states that unsafe-content sanitization is
out of scope. For untrusted HTML/DOM input, it strongly recommends a sanitizer
such as DOMPurify and CSP; Firefox uses both. The security policy further says
interactive/scripting input may remain after Readability processing [S3][S13].

**FACT (high):** script elements, many controls, inline presentation attributes,
and some `javascript:` links are removed, but these transformations are content
cleanup, not a complete allowlist sanitizer. The output is HTML by default,
allowed embeds can survive, SVG receives special style treatment, arbitrary
attributes are not comprehensively removed, and rewritten media URLs can cause
network activity when later rendered [S2].

**RECOMMENDATION (high):** treat every extracted field as untrusted:

1. Fetch with independent SSRF, redirect, MIME, decompression, byte, time, and
   egress controls.
2. Parse without scripts, subresource loading, navigation, custom elements, or
   network access. Mozilla likewise warns Node users to keep jsdom script and
   resource capabilities disabled [S3].
3. Enforce element, depth, attribute, text, JSON-LD, image-candidate, wall-clock,
   and output limits before/during extraction; cancellation must be cooperative.
4. Store immutable raw bytes separately. Never render raw or merely extracted
   HTML.
5. Sanitize the extracted subtree with a project-owned, versioned allowlist;
   preferably convert to typed blocks and plain text for retrieval. Use CSP and
   a sandboxed origin if HTML rendering is ever needed.
6. Prevent passive-resource leaks: do not auto-load images, audio, video,
   iframes, styles, fonts, or hyperlinks during extraction/review.
7. Bound logs and never emit full adversarial DOM/text in debug diagnostics.

**INFERENCE (high):** sanitizing only input can damage extraction cues, while
sanitizing only output leaves the parser exposed to resource exhaustion.
Curiosity needs structural parser limits on input *and* security sanitization on
the selected output.

## 8. License and clean-room contamination boundary

### 8.1 Upstream obligations

**FACT (high):** Readability is Apache License 2.0. Its NOTICE attributes Arc90
and Mozilla/contributors, and the source says it is heavily based on Arc90
Readability 1.7.1 [S2][S14][S15]. Apache 2.0 permits use and modification but
requires license/notice preservation for redistribution, marking modified files,
and other conditions; it includes a patent grant and termination condition and
does not grant trademark rights [S14].

**INFERENCE (medium):** directly translating or closely re-expressing source,
regular-expression vocabularies, score tables, control flow, or expected fixture
outputs would create avoidable derivative-work and attribution questions even
though Apache 2.0 is permissive. This is a process-risk statement, not legal
advice.

### 8.2 Independent-derivation protocol

**RECOMMENDATION (high):** if Curiosity owns its extractor rather than depending
on the package, use this clean-room sequence:

1. **Requirements team:** write only observable goals and broad principles from
   this report—e.g., text clustering, chrome evidence, link density, metadata
   provenance, conservative sibling expansion, bounded fallback. Exclude
   upstream identifiers, regex vocabularies, numeric tables, source structure,
   comments, and fixtures.
2. **Corpus team:** create or license an independent, stratified corpus with
   human annotations. Do not import Mozilla's captured pages or expected outputs
   without separate provenance/copyright review.
3. **Implementation team:** must not consult Readability source or tests. Derive
   features and thresholds empirically from Curiosity's requirements/corpus.
4. **Evaluation team:** black-box compare released tools only on the independent
   corpus, recording disagreement categories rather than copying outputs into
   implementation fixtures.
5. **Provenance:** retain this research record, team/access declarations,
   corpus licenses, design notes, and independent authorship history.
6. **Review:** counsel/license review decides whether behavioral compatibility
   testing or any package distribution changes the obligations.

**Alternative — ADOPT dependency (deferred):** using the official Apache-2.0
package may be operationally simpler and legally clearer than creating a near
clone, provided its license/NOTICE and security/upgrade obligations are accepted.
That is a separate build-vs-buy ADR; this report does not approve a dependency.

## 9. Independent extractor design implications

### 9.1 Adopt the pipeline, not the constants

**RECOMMENDATION (high):** independently specify these stages:

1. **Capture contract:** immutable bytes, final URL, fetch chain, MIME/charset,
   capture time/hash, and parser version.
2. **Safe DOM normalization:** deterministic repairs with a transformation log;
   no code execution or network.
3. **Metadata claim collection:** gather visible, meta, and structured claims
   separately with source locators, normalized values, and conflicts.
4. **Block graph:** typed text/media/table/code blocks with DOM ancestry,
   document order, local density features, language/script estimate, and stable
   source spans where possible.
5. **Candidate segmentation:** produce several coherent regions, not just one
   node. Aggregate independent positive/negative evidence and calibrate scores.
6. **Selection policy:** support zero, one, and ambiguous/multiple article
   outcomes; URL/heading/metadata consistency and DOM order can disambiguate
   dynamic pages without pretending certainty.
7. **Conservative expansion:** include adjacent blocks only with explicit
   continuity evidence; record every inclusion/exclusion reason.
8. **Safe rendering/index form:** typed blocks and normalized text first;
   sanitized HTML only as an optional derivative.

Do not use fixed thresholds as universal truths. Calibrate by script/language
and genre where evidence permits, but include a language-unknown path and report
calibration coverage. Prefer features such as sentence boundaries, grapheme/
token estimates, block continuity, metadata alignment, and repeated-template
evidence over English substring lists.

### 9.2 Proposed bounded result contract

This conceptual contract is intentionally provider-neutral and not code:

| Field class | Required behavior |
| --- | --- |
| Identity | capture ID/hash, extractor name/version/config, source URL/base URL |
| Outcome | `success`, `ambiguous`, `no_content`, `bounded_failure`, or `parse_failure` |
| Candidates | bounded top regions with calibrated score band, DOM locator, text length, and reason codes |
| Selected blocks | ordered typed blocks with source locators and normalized safe text |
| Metadata claims | value, field, origin kind/locator, confidence, conflict group; no silent precedence loss |
| Diagnostics | language/script guess, relaxations used, truncation flags, removed-content categories, elapsed/resource counters |
| Safety | sanitizer policy/version, active-content removal flags, unresolved/external-resource inventory |

**RECOMMENDATION (high):** hard limits must cover fetched/decompressed bytes,
elements, tree depth, attributes and attribute bytes, text units, metadata JSON,
candidate count, retries, elapsed CPU/wall time, and each output field. On a
limit, preserve the immutable capture and return `bounded_failure`; do not
silently index partial text as complete.

### 9.3 Evaluation and checks

An independent test program should include:

- prose news/blogs, documentation, forums, recipes, fiction, papers, code-heavy
  pages, link essays, tables, image galleries, transcripts, and short notices;
- multiple scripts and languages, especially CJK, RTL, agglutinative languages,
  and pages missing or lying about `lang`;
- responsive duplication, external-CSS hiding, shadow DOM, custom elements,
  hydration/no-hydration captures, paywalls, consent dialogs, AMP/print views,
  malformed HTML, and infinite-scroll multi-article snapshots;
- adversarial DOM depth/width, huge JSON-LD/attributes/text, regex-stressing
  strings, data URLs, active attributes, SVG/MathML, hostile base URLs, and
  subresource references;
- block-level precision/recall and boundary error, metadata exact/normalized
  accuracy by origin, no-content calibration, ambiguity calibration, latency/
  memory percentiles, bounded-failure correctness, and sanitizer escape tests;
- versioned golden annotations with multiple reviewers and disagreement records,
  not one extractor's output as ground truth.

## 10. Curiosity retrieval implications

**RECOMMENDATION — ADOPT:**

- Keep raw capture, extraction derivative, sanitized derivative, and indexed
  representation as distinct immutable/versioned objects.
- Make passage citations point to capture plus extractor version and source
  block/span; recrawls must create new versions rather than move citations.
- Store metadata as claims with origin and conflict, especially author,
  publisher, title, and publication time.
- Propagate extraction confidence, ambiguity, truncation, and language coverage
  into ranking and answer evidence. A clean-looking article is not necessarily a
  faithful one.
- Use repeated cross-page template evidence available to an owned crawler: site
  chrome can be learned from many captures without hard-coded English labels.
- Permit the research agent to request another candidate region only within the
  declared bounded frame; extraction itself must not trigger autonomous fetches.

**RECOMMENDATION — ADAPT:**

- Readability's link-density, ancestor voting, sibling recovery, data-table
  protection, and staged fallback are useful feature *families*. Re-derive their
  definitions and parameters independently and expose their diagnostics.
- Its metadata precedence should become evidence reconciliation, not overwrite.
- Its single-result API should become bounded candidate/ambiguity output.
- Its retry sieve should preserve precision tiers and never hide relaxation.

**REJECT:**

- treating extracted HTML as sanitized;
- unlimited default input/output or unbounded debug content;
- using the fast readerability probe as a crawl/index gate;
- silent single-winner behavior on multi-article pages;
- universal character/punctuation thresholds and English class-token lists;
- copying upstream source, regexes, score constants, test snapshots, or expected
  outputs into a nominally independent Curiosity implementation.

**DEFER:**

- visual/layout extraction requiring a browser renderer;
- per-site rules (maintenance, manipulation, and policy surface are high);
- ML ranking until a licensed, stratified, adjudicated corpus and interpretable
  baseline exist;
- direct package adoption and its Apache NOTICE process to a separate ADR;
- multipart article stitching across URLs until canonical/version semantics and
  fetch authority are settled.

## 11. Confidence, unknowns, and negative results

### Confidence summary

- **High:** pinned algorithm stages, options, metadata precedence, mutation,
  cleanup, retry behavior, security disclaimer, and license—direct source/docs.
- **Medium-high:** named failure mechanisms—triangulated between source and
  public Mozilla issues, but prevalence was not measured.
- **Medium:** language/genre bias magnitude and independent-design superiority—
  mechanisms are clear, comparative measurements are absent.
- **Low / not claimed:** current web-wide accuracy, Firefox telemetry outcomes,
  comparative superiority to other extractors, formal complexity bounds, or
  legal classification of a future implementation.

### Material unknowns

1. No official representative-corpus precision/recall or multilingual fairness
   report was found.
2. No formal worst-case CPU/memory/depth analysis was found.
3. The exact Firefox integration and UI eligibility policy were not fully traced;
   package behavior should not be equated with every Firefox release.
4. Live issue prevalence and site behavior were not reproduced; cited issues are
   case evidence.
5. No legal opinion was obtained on behavioral compatibility, fixture copyright,
   or what design similarity would constitute a derivative work.
6. The maintainer-linked IOVS paper page was access-blocked in this environment;
   it is only evidence that maintainers considered cross-language reading-rate
   data relevant, not direct support for extraction thresholds [S7].

### Checks before a consequential decision

- Counsel approves either dependency obligations or the clean-room protocol.
- Security reviews parser/fetch/sanitizer boundaries with adversarial fixtures.
- Evaluation publishes corpus provenance, language/genre strata, annotation
  agreement, block metrics, calibration, resource percentiles, and failures.
- Re-run this source audit against the exact upstream release considered; minor
  versions may change output [S5].
- Verify any Firefox-product claim against the exact Firefox source/release, not
  this standalone package alone.

## 12. Bounded curiosity pass

After synthesis, remaining in-frame gaps were scored 1 (low) to 5 (high). Cost
is inverse desirability: 1 is cheap, 5 expensive.

| Thread | Relevance | Value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Pin current upstream commit/version and characterize fixture breadth | 5 | 4 | 3 | 1 | **Pursued:** API/package/tree evidence fixed the snapshot and found 130 fixture directories [S1][S10]. |
| Confirm multi-article limitation in maintainer words | 5 | 5 | 4 | 1 | **Pursued:** issue comments explicitly describe the largest-prose winner and need for API/architecture change [S8]. |
| Find an official algorithm design paper | 3 | 3 | 3 | 3 | **CURIOSITY_NO_GO:** repository issue requesting algorithm documentation remains open; no Mozilla-authored design/evaluation paper surfaced in bounded searches. Source is the authoritative algorithm evidence [S6]. |
| Reproduce current live-site failures | 4 | 3 | 2 | 5 | **CURIOSITY_NO_GO:** pages drift, crawling/rendering was outside authority, and case reproduction would not establish prevalence. |
| Reverse-engineer Firefox worker/parser integration | 3 | 3 | 3 | 5 | **CURIOSITY_NO_GO:** standalone extractor was the declared product frame; exact Firefox integration is deferred. |
| Benchmark alternative extractors | 2 | 4 | 4 | 5 | **CURIOSITY_NO_GO:** comparative landscape and implementation were outside this exclusive product study. |

**Stop condition:** coverage reached for every declared sub-question; additional
searches repeated known heuristic/failure classes, while the remaining gaps
require live experiments, legal review, or a broader comparative frame.

## Sources

All web sources accessed 2026-08-17. GitHub source links are commit-pinned where
behavior depends on exact code.

- **[S1]** Mozilla, GitHub commit API for repository `main`, commit
  `ab4027a8b37669745016869a37a504727992b2ba`, including commit date and tree:
  <https://api.github.com/repos/mozilla/readability/commits/main>
- **[S2]** Mozilla, `Readability.js`, pinned source (algorithm, constants,
  metadata, cleanup, parse orchestration):
  <https://github.com/mozilla/readability/blob/ab4027a8b37669745016869a37a504727992b2ba/Readability.js>
- **[S3]** Mozilla, README/API/security guidance, pinned:
  <https://github.com/mozilla/readability/blob/ab4027a8b37669745016869a37a504727992b2ba/README.md>
- **[S4]** Mozilla, cheap readerability probe, pinned:
  <https://github.com/mozilla/readability/blob/ab4027a8b37669745016869a37a504727992b2ba/Readability-readerable.js>
- **[S5]** Mozilla, changelog, including output-compatibility statement and
  multilingual/cleanup changes, pinned:
  <https://github.com/mozilla/readability/blob/ab4027a8b37669745016869a37a504727992b2ba/CHANGELOG.md>
- **[S6]** Mozilla Readability issue #9, “Document how the algorithm works,”
  especially maintainer comment on heuristic/class-ID behavior:
  <https://github.com/mozilla/readability/issues/9#issuecomment-221275484>
- **[S7]** Mozilla Readability issue #429, Japanese readerability thresholds and
  maintainer discussion of speed/language density/paper lead:
  <https://github.com/mozilla/readability/issues/429>
  and <https://github.com/mozilla/readability/issues/429#issuecomment-372988745>
- **[S8]** Mozilla Readability issue #473, multiple/infinite-scroll articles and
  maintainer architecture explanation:
  <https://github.com/mozilla/readability/issues/473#issuecomment-418126722>
- **[S9]** Mozilla Readability issue #468, non-English footer inclusion:
  <https://github.com/mozilla/readability/issues/468>
- **[S10]** Mozilla, pinned recursive test-fixture tree (130 directories counted
  locally from this API response) and test directory:
  <https://api.github.com/repos/mozilla/readability/git/trees/582c0693a5f171d6568c82554dba462f0c44c46b?recursive=1>
  and <https://github.com/mozilla/readability/tree/ab4027a8b37669745016869a37a504727992b2ba/test>
- **[S11]** Mozilla Readability issue #903, negative class-token collision:
  <https://github.com/mozilla/readability/issues/903>
- **[S12]** Mozilla Readability issue #819, reported main-content truncation:
  <https://github.com/mozilla/readability/issues/819>
- **[S13]** Mozilla, security policy, pinned:
  <https://github.com/mozilla/readability/blob/ab4027a8b37669745016869a37a504727992b2ba/SECURITY.md>
- **[S14]** Mozilla, Apache License 2.0, pinned:
  <https://github.com/mozilla/readability/blob/ab4027a8b37669745016869a37a504727992b2ba/LICENSE.md>
- **[S15]** Mozilla, NOTICE attribution, pinned:
  <https://github.com/mozilla/readability/blob/ab4027a8b37669745016869a37a504727992b2ba/NOTICE>
- **[S16]** Mozilla, package manifest (version, engine, license, scripts), pinned:
  <https://github.com/mozilla/readability/blob/ab4027a8b37669745016869a37a504727992b2ba/package.json>
