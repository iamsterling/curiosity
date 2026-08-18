# Trafilatura extraction and licensing dossier

**Decision frame:** Should Curiosity use Trafilatura, or independently adapt its
observable extraction patterns, for bounded conversion of untrusted HTML into
retrieval evidence?

**Snapshot and boundary:** Primary sources were accessed 2026-08-17. The latest
published package examined is **Trafilatura 2.2.0**, PyPI upload and Git tag dated
2026-07-31 (tag commit `c1bc9531a2a978326112ca9987e1382745116136`). The default
branch had 2026-08 changes after that tag, including extraction changes, and is
therefore treated as unreleased evidence, not 2.2.0 behavior [S1][S2][S15]. This
is public-source research within the repository's access and license boundaries:
no code was copied into Curiosity and no service was probed. Because source was
inspected, this is **not** a claim that a two-team clean-room implementation has
already occurred. No production recommendation below is legal advice.

Labels used below are **FACT**, **INFERENCE**, **RECOMMENDATION**, and **UNKNOWN**.
Confidence is high/medium/low.

## Executive verdict

**ADAPT the architecture; DEFER an in-process dependency pending legal and
security review (high confidence).** Trafilatura 2.2.0 is not a single selector.
It is a bounded-by-heuristics cascade: parse and clean; optionally separate
comments; locate a likely body with ordered XPath families; prune and transform
structural elements; recover missed text; compare against bundled Readability
and jusText paths; fall back to an embedded-JSON/article/paragraph/body baseline;
and, for suspiciously short balanced results, retry in recall mode. This diversity
explains why its best lesson is **candidate generation plus explicit acceptance
gates**, not any particular XPath or numeric threshold [S3][S4][S5][S6].

For Curiosity, the useful independent lessons are to preserve body, comments,
metadata, tables, and provenance as distinct typed products; run cheap,
high-precision extraction before costlier rescue paths; retain the selected
extractor and rejection reason; validate by page type and language; and keep a
high-recall last resort visibly low-confidence. Do **not** inherit Trafilatura's
silent extractor switching, process-global duplicate state, fail-open optional
language filter, page-declared license as legal authority, or downloader trust
model.

Licensing is version-sensitive. The project and artifacts state that versions
**before 1.8.0 are GPLv3+** and 1.8.0 onward are Apache-2.0. The change landed on
2024-03-20 immediately before tag 1.8.0 [S12][S13]. However, the maintainer's
relicensing issue still displays several contributors as “pending,” while the
one-person pull request has no description or review. That does not prove the
Apache grant invalid, but it is a material chain-of-title uncertainty requiring
counsel rather than inference [S14]. Pinning `trafilatura>=1.8` is also
insufficient for reproducibility: 2.2.0 declares dependency ranges, so the exact
resolved graph and notices must be locked and scanned [S1].

## 1. Bounded questions and findings

| Question | Finding | Status / confidence |
| --- | --- | --- |
| What actually extracts the body? | A rule-based body locator and element transformer, then conditional wild-text recovery, Readability/jusText comparison, baseline rescue, and a recall retry. | FACT / high [S3][S4][S5][S6] |
| Are fallbacks simple “on failure” steps? | No. Length, structure, focus mode, images, page-share, and candidate ratios can replace an otherwise nonempty result. | FACT / high [S3][S4] |
| Are comments and tables first-class? | Internally yes; comments are separately selected and removed from the main tree, and tables are converted to rows/cells. Plain-text serialization can erase that distinction. Both default on. | FACT / high [S3][S5][S8] |
| What metadata is recovered? | Title, author, URL/hostname, description, site, date, categories, tags, image, page type and page-declared license from OpenGraph, ordinary meta, JSON-LD, DOM and external `htmldate` heuristics. Metadata is heuristic page data, not verified fact. | FACT plus inference / high [S7] |
| Does `deduplicate=True` remove near duplicates? | It removes repeated exact segment/body strings through an LRU. SimHash is exposed for fingerprints/similarity, but is not the extraction rejection test. | FACT / high [S9] |
| Is language detection intrinsic? | No. It runs only when a target language is requested and `py3langid` is installed; otherwise filtering may rely on shallow metadata checks or skip detection. | FACT / high [S3][S10] |
| How strong is the quality evidence? | The project's August 2026 selective-segment benchmark reports 2.2.0 standard F1 0.924 on 990 pages, but it is maintainer-run, nonrepresentative, and excludes comments, duplicate behavior and order. | FACT with limitation / high [S11] |
| Is current use permissively licensed? | Published 1.8.0–2.2.0 artifacts say Apache-2.0; earlier artifacts say GPLv3+. Contributor-consent evidence is incomplete on the public issue. | FACT / high for labels; medium for title assurance [S1][S12][S13][S14] |

## 2. Version identity and behavior drift

- **FACT (high):** PyPI 2.2.0 requires Python 3.10+, declares Apache-2.0, and
  depends on `certifi`, `charset_normalizer>=3.4.9`, `courlan>=1.4.0`,
  `htmldate>=1.10.0`, `justext>=3.0.2`, `lxml>=6.1.1`, and
  `urllib3>=1.26,<3`. It is a pure-Python wheel, but native/parser behavior still
  depends on the resolved `lxml` stack [S1].
- **FACT (high):** 2.2.0's changelog calls out a revamped recovery sequence,
  better forum recall, more targeted boilerplate pruning, nested-element fixes,
  and more accurate tables. Thus findings about fallback order and forum routing
  must not be back-projected onto 1.x or 2.0/2.1 [S2].
- **FACT (high):** Other contract changes matter to adapters: Markdown arrived
  in 1.9, duplicate functions moved in 1.10, HTML output arrived in 1.11, and
  2.0 made `bare_extraction()` return a `Document` by default while deprecating
  `no_fallback` in favor of `fast` [S2][S8][S9].
- **UNKNOWN:** The project does not promise output stability across releases.
  Heuristics, dependencies, parser recovery and date/language models can all
  change output without a schema-version field.

**RECOMMENDATION (high):** Any adapter evaluation must pin the package, complete
dependency lock, configuration, parser platform, output format, and extractor
flags. Store those with each extracted artifact; never record only “Trafilatura.”

## 3. Extraction and fallback pipeline (2.2.0)

### 3.1 Observable sequence

**FACT (high):** The public entry point normalizes options, parses HTML through
LXML, optionally rejects a conflicting language hint, optionally extracts
metadata, applies caller-supplied prune XPath, runs the extraction sequence, then
checks output-tree size, minimum body/comment length, duplicate state, and target
language. Expected parse/filter failures generally collapse to `None` [S3].

```text
bytes/string/response/LXML tree
  -> decoding + forgiving static HTML parse
  -> optional metadata and early metadata/URL filters
  -> caller prune rules
  -> tree cleaning + tag conversion
  -> optional comment-region capture/removal
  -> ordered likely-body selection + boilerplate/link-density pruning
  -> structural extraction (heads, paragraphs, lists, quotes, code, tables, ...)
  -> if short: recover unclaimed text from a broader tree
  -> unless fast: compare own candidate with Readability; conditionally try jusText
  -> if still short and not precision: baseline rescue from original tree
  -> if balanced result is short and <20% of page text: recall-mode retry;
       optionally compare an additional jusText candidate
  -> forum-post salvage where schema.org identifies a discussion thread
  -> size / exact-duplicate / target-language gates
  -> Document + format-specific serialization
```

This is a source-derived behavioral description, not reusable code.

### 3.2 Main path and acceptance gates

- **FACT (high):** Ordered body XPath families are tried until the transformed
  candidate contains more than one non-image element. The selected subtree is
  pruned by undesirable-section patterns and repeated link-density passes. A
  paragraph-poor subtree broadens eligible tags to `div` [S5].
- **FACT (high):** If the initial body is empty or under the configured
  `MIN_EXTRACTED_SIZE` (default 250 characters), “wild” recovery scans previously
  unclaimed paragraphs, code, quotes and tables; recall mode widens this to divs,
  line breaks and lists. Exact and substring checks avoid obvious overlap with
  already selected elements [S5][S8].
- **FACT (high):** Unless `fast=True`, a bundled Readability fork runs on the
  raw tree. Its candidate can win when the own output is empty, much longer,
  structurally deficient/table-dominated, or recall mode favors it. jusText is
  examined when the candidate still contains disallowed structures or is short;
  it wins only through further relative-length/image gates [S4].
- **FACT (high):** Baseline rescue is attempted when the selected text remains
  below 250 characters and focus is not precision. It may replace the result if
  longer, or if it restores a requested image [S3][S6].
- **FACT (high):** Balanced mode then detects probable under-extraction when a
  nonempty candidate is under 3,000 characters and under 20% of `html2txt()` page
  text. It reruns main plus external comparison in recall mode. A recall result
  must be at least 250 characters and over 1.5x longer; an extra jusText candidate
  must beat the recall candidate and exceed 2x the incumbent [S3].
- **INFERENCE (high):** Length is a practical proxy for recall, not relevance.
  A longer legal notice, navigation block, pricing table, or injected text can
  satisfy the same gates as a missing article section. The multiple algorithms
  reduce correlated misses but do not create semantic verification.

### 3.3 Baseline and terminal recall

**FACT (high):** `baseline()` takes the first source with over 100 characters in
this order: selected schema.org/embedded JSON full-text properties and Discourse
preload posts; dominant top-level `<article>` blocks; paragraph/quote/code-like
elements; schema.org Product/VideoObject descriptions as a teaser candidate; and
finally all cleaned body text. `html2txt()` is documented as the maximum-recall,
low-context last resort [S6][S8].

**RECOMMENDATION (high):** Curiosity should expose candidates and reason codes
(`primary`, `readability_rescue`, `jsonld_baseline`, `body_dump`, etc.) rather
than silently replacing one result. A body dump must be labeled low-confidence
and may not outrank a shorter, semantically coherent body merely by length.

## 4. Metadata, comments, tables and structure

### Metadata

- **FACT (high):** Metadata extraction bootstraps OpenGraph, scans ordinary meta
  conventions, parses JSON-LD/settings JSON, then uses DOM fallbacks for title
  and author, canonical/base/alternate URL logic, `htmldate` for dates, URL/title
  fallbacks for site name, category/tag links, and `rel=license` or footer CC
  cues for a license string [S7].
- **FACT (high):** `only_with_metadata=True` means all three of date, title and
  URL must be present; it does not establish their correctness. The supplied
  URL materially helps canonicalization and date extraction [S3][S7].
- **INFERENCE (high):** Precedence is source-availability logic, not conflict
  adjudication. JSON-LD, OpenGraph, canonical links, visible text and URL dates
  are publisher-controlled and can be stale, adversarial or mutually inconsistent.
- **RECOMMENDATION (high):** Preserve every metadata observation with source
  kind and raw value, then normalize and resolve separately. Treat the extracted
  page-license string as a **claim by the page**, never as a permission decision.

### Comments and forums

- **FACT (high):** Comments default on. Ordered comment XPath families select
  the first usable comment region, prune subparts, flatten links/spans, transform
  accepted nodes, and remove that subtree from the body tree. `Document` can keep
  comments separately; text output appends them after body text [S3][S5][S8].
- **FACT (high):** 2.2.0 detects schema.org `DiscussionForumPosting` in JSON-LD
  and reroutes captured “comments” into main content, with a salvage step if later
  extraction loses posts. The source explicitly accepts that forums without that
  marker can be missed [S3].
- **UNKNOWN:** There is no published benchmark for comment precision, author/
  timestamp/thread attribution, or forum completeness. Official evaluation says
  comment extraction remains unevaluated [S11].
- **RECOMMENDATION (high):** Curiosity should default comments **off for article
  evidence** and retain them as a separately typed region when requested. Forum
  routing needs an explicit page-type classifier and post-level provenance.

### Tables and formatting

- **FACT (high):** Tables default on. 2.2.0 emits table/row/cell structure,
  captions as header rows, identifies an initial `<th>` header row, pads colspans,
  tracks rowspans, tolerates orphan cells, and treats nested tables separately.
  Link-density pruning may discard navigation-like tables [S5][S8].
- **FACT (high):** Fidelity is output-dependent. XML/TEI or the Python tree can
  preserve structure; Markdown implies formatting by default; TXT/CSV/JSON have
  different capabilities, and the docs warn selected elements may not be visible
  in every format [S8].
- **INFERENCE (medium):** Span padding aids rectangular rendering but is not a
  lossless representation of HTML table semantics, scope attributes, accessibility
  associations, or source DOM anchors.
- **RECOMMENDATION (high):** Preserve a typed cell grid plus source spans and a
  separately rendered text view. Never treat flattened table prose as passage
  evidence without row/column context.

## 5. Deduplication and language

### Deduplication

- **FACT (high):** With `deduplicate=True`, repeated extracted elements and the
  final body are checked as normalized **exact strings** against an LRU cache.
  Default checks start above 100 characters and default `MAX_REPETITIONS=2`; the
  source's `>` comparison means the fourth encounter is the first rejected one
  under a fresh cache, an off-by-one interpretation callers should test [S8][S9].
- **FACT (high):** The cache object is module-global and lock-protected in 2.2.0.
  Therefore threads in one process share state; separate processes do not. This
  contradicts the documentation's statement that each thread independently
  tracks duplicates [S9].
- **FACT (high):** A 64-bit token-sampled SimHash supports `content_fingerprint()`
  and pairwise similarity. Extraction rejection does not query a SimHash index;
  generated fingerprints are added only for non-TXT/Markdown serialization and
  are not a page-version identity [S3][S9].
- **RECOMMENDATION (high):** Curiosity should separate deterministic intra-page
  overlap removal, exact content hashes, and corpus-level near-duplicate clusters.
  State must be explicitly scoped by crawl/corpus and persisted by the owner—not
  hidden in process memory. Keep source diversity even when content is syndicated.

### Language

- **FACT (high):** `target_language` accepts an ISO 639-1 code. When `py3langid`
  is installed, the longer of body or comments is classified and a mismatch drops
  the document. Without the optional detector, detection logs a warning and
  filtering can fail open; `fast` mode or detector absence may first reject an
  explicit conflicting content-language/locale meta value. Bare `<html lang>` is
  not used by the default shallow check [S3][S10].
- **FACT (high):** Language is not populated as a general metadata field unless
  a target language was requested. jusText uses a language-specific stoplist when
  the target maps to one; otherwise it unions all stoplists [S4][S10].
- **INFERENCE (high):** Mixed-language pages, short pages, comments longer than
  the article, and bad publisher metadata can cause unstable filtering. “No
  detector installed” and “language matched” are semantically different states.
- **RECOMMENDATION (high):** Return detector identity/version, score, sampled
  region, declared languages and decision. Use `unknown` rather than pass when a
  language constraint cannot be evaluated; allow multilingual region labels.

## 6. Evaluation evidence and its limits

### Internal benchmark

**FACT (high):** The current official evaluation page reports this 2026-08-04
result on Python 3.13: 990 documents, 2,951 desired segments and 2,966 boilerplate
segments. Trafilatura 2.2.0 standard reports precision 0.906, recall 0.943,
accuracy 0.923 and F1 0.924; precision mode F1 0.920; recall and fast both 0.918.
The strongest listed alternative, `magic-html 0.1.8`, reports F1 0.889 [S11].

Those numbers are **useful regression evidence, not a Curiosity quality forecast**:

1. **FACT:** Pages are mainly news/blog-like and heavily German, with only roughly
   20–30% other languages; chosen segments are explicitly “not statistically
   representative” [S11].
2. **FACT:** Each page has only 1–6 desired and 1–6 undesired snippets. Scoring is
   whitespace-normalized substring presence aggregated into a confusion matrix,
   not character/token overlap, semantic accuracy, completeness, or DOM order
   [S11].
3. **FACT:** Comments are disabled, tables enabled, formatting disabled. Duplicate
   behavior and output order are not evaluated; comments are explicitly still on
   the roadmap [S11].
4. **FACT:** The benchmark and principal paper are authored by the maintainer;
   competitor versions/configurations differ and some are custom-configured.
   Crashes count as misses in the current harness, which is defensible but does
   not remove corpus-selection bias [S11][S16].
5. **INFERENCE:** The large gain over the 2022 1.2.2 standard result (F1 0.909 to
   0.924) is not a clean longitudinal comparison because the corpus grew from 750
   to 990 pages and competitor/runtime versions changed [S11].

### External evidence and negative result

- **FACT (medium):** The official docs cite the peer-reviewed ACL 2021 system
  paper, an older ScrapingHub benchmark, Lejeune & Barbaresi 2020, a Polish sample,
  and a purported Bevendorff et al. 2023 comparison [S11][S16].
- **NEGATIVE RESULT (high):** On 2026-08-17 the official link labeled “An Empirical
  Comparison of Web Content Extraction Algorithms” resolved to a PDF titled
  **“SMAuC – The Scientific Multi-Authorship Corpus,”** not an extraction study.
  The official claim that Trafilatura was best by ROUGE-LSum could not be verified
  from that linked primary artifact and is not relied on here [S11][S17].
- **UNKNOWN:** No primary evaluation found in-frame measures metadata accuracy,
  comments, table reconstruction, adversarial HTML, JavaScript-rendered pages,
  prompt-injection preservation, multilingual parity, or Curiosity's page mix.

**RECOMMENDATION (high):** Require a Curiosity-owned, version-pinned evaluation
with whole-document span alignment, region ordering, metadata field accuracy,
table-cell fidelity, duplicate clusters, language slices, failure rates, latency
and memory—not only selective substring F1.

## 7. Failure and security bounds

Trafilatura is an extractor, not a trust boundary.

| Boundary | Primary-source fact | Curiosity implication |
| --- | --- | --- |
| Dynamic pages | Raw HTML only; docs recommend a browser for JavaScript-injected content. | Classify “not rendered” separately from “no main text”; browser acquisition is a separate sandboxed stage [S18]. |
| Download size/time | Bundled downloader defaults to 20 MB compressed transfer, 30-second timeout and two redirects. Direct `extract()` on supplied bytes/string has no equivalent input-byte cap. | Enforce limits before decode/decompression/parser and independently of provider defaults [S8][S10]. |
| Decompression | Decoder probes gzip/zstd/Brotli/zlib; zstd code itself marks `max_output_size` unresolved. | Decompression bombs remain possible; cap ratio and inflated bytes in a worker [S10]. |
| Tree/output size | `MAX_TREE_SIZE` is unset by default and checked after extraction by top-level output children, not input nodes/bytes. LXML's default parser limits are not an application budget. | Bound input bytes, DOM nodes/depth, CPU, memory, output bytes and wall time externally [S3][S8]. |
| Parser | Static LXML HTML parsing removes comments and processing instructions and does not execute scripts. No explicit `no_network` setting is shown. | Keep a no-network parser sandbox; do not infer XXE/network safety from absence of script execution [S10]. |
| URL fetching | `fetch_response()` accepts a URL without a private-address/scheme policy. On an SSL error, urllib3 path automatically retries with certificate verification disabled; warnings are globally disabled. | Do not expose downloader to untrusted URLs. Use Curiosity's SSRF-safe fetcher, DNS/IP policy, verified TLS, redirect revalidation and MIME checks [S10]. |
| Fetch policy | A direct fetch is not a robots/terms/licensing decision; troubleshooting discusses cookies, headless browsers and paywall extensions. | Acquisition authorization is upstream and independently reviewed; reject bypass guidance for Curiosity [S18]. |
| Output trust | Extracted text, links, images, metadata and page license remain publisher-controlled. | Treat all fields as untrusted evidence; escape by sink and isolate from agent instructions. Extraction does not neutralize prompt injection. |
| Error semantics | Many parse/filter/size/language failures return `None`; fallback exceptions may be logged and suppressed. | Return typed failure/stage/limit causes. “No content,” “wrong language,” “duplicate,” and “parser failed” must not collapse. |
| Caches/concurrency | Dedup and text-processing caches are in-memory; docs acknowledge RAM growth and offer reset. | Worker recycling and explicit cache scope are required; no cross-worker completeness assumption [S8][S9]. |

**INFERENCE (high):** The fallback cascade increases attack surface and worst-case
work because multiple complete-tree algorithms and copies may run. The 2.2.0 API
does not expose a per-stage deadline or memory budget. Run extraction in a
resource-limited process and stop on the caller's deadline.

## 8. License history and clean-room risk

### 8.1 Release-sensitive ledger

| Range / event | Public evidence | Verdict |
| --- | --- | --- |
| Through 1.7.0 | Tag `v1.7.0` declares `GNU GPL v3+`; its LICENSE is GPLv3 and packaging classifier says GPLv3 or later. | **REJECT** for incorporation into Curiosity's permissively licensed project code unless separately approved under GPL-compatible distribution obligations. Do not infer that a new project license retroactively replaces old artifacts. |
| 2024-03-20 commit `c7e00f3` | Replaced GPL text/headers and package metadata with Apache-2.0; README added “Versions prior to v1.8.0 are under GPLv3+.” | **FACT**, but not by itself complete provenance [S12][S13]. |
| 1.8.0 onward, including 2.2.0 | Tags, LICENSE, README and PyPI metadata declare Apache-2.0. `v1.8.0` descends from the relicensing commit. | **DEFER dependency adoption** until exact artifact, notices, dependencies and title record pass review [S1][S12][S13]. |
| Contributor consent | Issue #512 sought consent from contributors with lines still in use; many are checked, several remain visibly “pending.” PR #526 was authored/merged by maintainer, with no description, reviewer or public legal analysis. | **UNKNOWN / medium risk:** not proof of defect; enough uncertainty to require counsel [S14]. |
| Dependencies | 1.8.0 deliberately raised `courlan>=1.0.0` and `htmldate>=1.8.0`; those package releases declare Apache-2.0. jusText declares BSD-2-Clause. 2.2.0 ranges permit dependency drift. | **ADAPT control:** lock and SBOM the full graph; do not rely on top-level metadata alone [S1][S19]. |

Apache-2.0 requires preservation of license notices and provides a conditional
patent grant/termination; it does not license trademarks or the extracted web
content. GPL obligations for old versions and licenses/terms for fetched pages
are separate questions. Counsel must decide the deployment/distribution facts.

### 8.2 Clean-room design boundary

- **FACT (high):** This research inspected public Apache-labeled 2.2.0 source to
  describe behavior, and older tags solely to trace licensing. No source was
  transferred into the workspace document beyond names, public API concepts and
  high-level behavior.
- **RECOMMENDATION (high):** If Curiosity **uses** 2.2.0, treat it as a third-party
  component: pin hashes, retain LICENSE/attribution, inventory the bundled
  Readability fork and all transitive packages, and isolate it behind a
  provider-neutral extraction contract.
- **RECOMMENDATION (high):** If Curiosity **independently implements**, use a
  separate implementer who has not inspected Trafilatura source. Give that team
  a Curiosity-authored behavioral specification and black-box test corpus, not
  Trafilatura XPaths, regexes, constants, comments, table code, tests, or control
  flow. Record provenance and independent rationale.
- **INFERENCE (high):** General ideas—multi-candidate extraction, precision/recall
  modes, table grids, exact/near dedup and metadata source precedence—are broadly
  known. The expressive selector lists, numeric gates, fallback decision tree and
  implementation details create the meaningful copying/similarity risk.
- **UNKNOWN:** No patent/FTO search was authorized. Apache's contributor patent
  grant is relevant when using covered Apache code but does not answer an
  independent implementation's FTO question.

## 9. Curiosity disposition ledger

| Pattern | Verdict | Independent Curiosity treatment |
| --- | --- | --- |
| Cheap primary extractor plus diverse rescues | **ADOPT** | Stage candidates under one deadline; keep provenance, scores and reason for selection. |
| Silent replacement based mostly on length | **REJECT** | Combine structural, semantic and contamination signals; expose candidate trace. |
| Explicit precision/balanced/recall modes | **ADAPT** | Provider-neutral effort/quality profiles with measured budgets and test-set semantics. |
| High-recall baseline/body dump | **ADAPT** | Last resort only, low-confidence label, strict size cap, never silently equivalent to main text. |
| Separate comments/body internally | **ADOPT** | Typed regions and post-level provenance; comments off by default for article evidence. |
| Schema-seeded forum routing | **ADAPT** | One page-type signal among several; emit classifier evidence and unknown state. |
| Structured table conversion | **ADOPT** | Cell grid, spans and source anchors plus a rendered view; evaluate independently. |
| Metadata cascade | **ADAPT** | Preserve all observations and conflicts; resolution is downstream and confidence-bearing. |
| Page license extraction | **ADAPT as a claim only** | Record verbatim declaration/source; never auto-authorize use. |
| Hidden process-global exact dedup | **REJECT** | Explicit corpus-scoped store; separate intra-page, exact-document and near-duplicate policies. |
| SimHash fingerprint | **DEFER** | Benchmark against MinHash/modern embedding/normalized hashes on Curiosity data; never use as immutable identity. |
| Optional fail-open language detector | **REJECT** | Typed unknown, detector/version/score/region, multilingual support. |
| Bundled downloading | **REJECT for untrusted inputs** | Curiosity-owned SSRF-safe acquisition with TLS and policy enforcement. |
| Trafilatura 2.2.0 adapter | **DEFER** | Legal/title review, SBOM, sandbox, reproducible quality/security pilot and operational ownership first. |
| Copying rules/thresholds/source | **REJECT** | Clean-room behavioral specification or properly managed third-party dependency; no hybrid copying. |

## 10. Verification plan (not executed)

Any pilot needs separate caller authority and a pinned, non-sensitive corpus.

1. Verify wheel/sdist hashes against PyPI; archive exact LICENSE, source tag,
   dependency lock and SBOM; obtain counsel disposition on issue #512.
2. Build golden spans for article body, comments, navigation, tables, code, lists,
   metadata observations and page-license claims. Include article, forum, docs,
   catalog, gallery, link-list, malformed and JavaScript-shell pages.
3. Compare `fast`, balanced, precision and recall with fallbacks individually
   instrumented. Record selected candidate, stage time/memory, reason and lost/
   added spans—not only final text.
4. Test comments off/on, forum markers present/absent, nested comments, replies,
   duplicate post text, and comments longer than body.
5. Test malformed/nested tables, captions, multiple header rows, row/col spans,
   orphan cells, layout tables and link-heavy tables in every supported output.
6. Test metadata conflicts across HTTP/final URL, canonical, OG, JSON-LD, DOM and
   URL-derived dates. Score each field and preserve conflict lineage.
7. Run exact and near-duplicate matrices across threads/processes/orderings;
   verify cache reset and the default repetition boundary.
8. Slice language tests by script, short/mixed text, boilerplate language,
   comment dominance and missing detector. A missing detector must fail closed for
   hard constraints.
9. Fuzz only offline parsing with approved malformed/compressed fixtures under
   byte/node/depth/time/memory/output caps. Do not point the bundled downloader at
   private networks or conduct live adversarial testing.
10. Injection-check every sink: Markdown, HTML, JSON, XML, logs and LLM context.
    Preserve text as evidence but never execute or treat it as instruction.

**Pass criteria:** reproducible versioned output; typed failure and candidate
trace; acceptable body/metadata/table/comment metrics by page and language slice;
no boundary escape under caps; deterministic duplicate scope; and approved
license/title/SBOM posture. Otherwise keep the adapter deferred.

## 11. Bounded curiosity pass

After synthesis, in-frame gaps were scored 1–5 for relevance (R), decision value
(V), novelty (N), and cost (C); priority = R + V + N − C. Authority covered public
primary-source follow-up only.

| Thread | R/V/N/C | Priority | Outcome |
| --- | --- | ---: | --- |
| Apache boundary and contributor consent | 5/5/5/1 | 14 | **Pursued.** Tags/commit prove the stated boundary; issue #512 preserves unresolved pending-consent evidence. Dependency adoption remains deferred [S12][S13][S14]. |
| “Near duplicate” docs vs actual extraction gate | 5/5/4/1 | 13 | **Pursued.** Extraction uses exact LRU checks; SimHash is a separate fingerprint/similarity primitive [S9]. |
| “Per-thread” dedup claim vs source state | 4/4/5/1 | 12 | **Pursued.** 2.2.0 has one module-global locked cache, hence process-shared across threads; contradiction retained [S9]. |
| External 2023 quality claim | 4/4/4/1 | 11 | **Pursued.** Official PDF link returned an unrelated corpus paper; result is explicitly unverified [S17]. |
| Exact chain-of-title legal conclusion | 5/5/3/5 | 8 | **CURIOSITY_NO_GO.** Requires counsel, contributor agreements and legal facts not established publicly. |
| Live downloader/SSRF/TLS probing | 4/5/3/5 | 7 | **CURIOSITY_NO_GO.** Static source establishes enough risk; active network testing was not authorized. |
| Patent/FTO search | 3/4/3/5 | 5 | **CURIOSITY_NO_GO.** Legal specialty outside authority and unnecessary for the current defer decision. |
| Reconstruct/copy selector lists and tuned constants | 2/2/2/5 | 1 | **CURIOSITY_NO_GO.** Expressive implementation detail is unnecessary and conflicts with the independent-design boundary. |

**Stop reason:** coverage and saturation. Every requested category has primary
evidence; the material documentation/source and license-history contradictions
were pursued. Remaining high-value gaps require counsel, a separately authorized
offline pilot, or prohibited/unnecessary implementation-level copying.

## 12. Confidence, unknowns and checks

**High confidence:** 2.2.0 package/tag identity; current public API defaults;
fallback sequence and numeric gates; metadata/comment/table paths; exact-LRU
extraction dedup; optional language behavior; published benchmark method/results;
GPLv3+-before-1.8 / Apache-since-1.8 labels.

**Medium confidence:** real-world superiority; the practical severity of the
relicensing consent gap; parser-network behavior inherited from exact LXML/libxml2
build; table fidelity; multilingual robustness; current transitive-license posture.

**Low/unknown:** Curiosity corpus quality and cost; metadata truth; comment/forum
completeness; adversarial robustness; browser-rendered coverage; safe maximum
input complexity; near-duplicate calibration; patent/FTO; whether every copyright
holder validly consented to Apache relicensing.

**Checks before relying on this dossier:** re-check latest PyPI release and tag;
diff extraction and dependency metadata against 2.2.0; verify source URLs and the
misdirected external-paper link; obtain an exact dependency lock/SBOM; and route
license/title questions to counsel.

## 13. Primary sources

All accessed 2026-08-17.

- **[S1]** PyPI, Trafilatura 2.2.0 metadata, files, hashes, dependencies and
  license expression: <https://pypi.org/pypi/trafilatura/2.2.0/json>
- **[S2]** Trafilatura changelog, including 2.2.0 and prior contract changes:
  <https://github.com/adbar/trafilatura/blob/v2.2.0/HISTORY.md>
- **[S3]** Trafilatura 2.2.0 core extraction sequence and public entry points:
  <https://github.com/adbar/trafilatura/blob/v2.2.0/trafilatura/core.py#L42-L496>
- **[S4]** Trafilatura 2.2.0 Readability/jusText comparison and acceptance logic:
  <https://github.com/adbar/trafilatura/blob/v2.2.0/trafilatura/external.py#L30-L208>
- **[S5]** Trafilatura 2.2.0 main body, wild-text, comment and table extraction:
  <https://github.com/adbar/trafilatura/blob/v2.2.0/trafilatura/main_extractor.py#L403-L870>
- **[S6]** Trafilatura 2.2.0 baseline and embedded-content sequence:
  <https://github.com/adbar/trafilatura/blob/v2.2.0/trafilatura/baseline.py#L32-L238>
- **[S7]** Trafilatura 2.2.0 metadata cascade and page-license extraction:
  <https://github.com/adbar/trafilatura/blob/v2.2.0/trafilatura/metadata.py#L168-L558>
- **[S8]** Official Python usage documentation (defaults, formats, metadata,
  language, speed, memory):
  <https://trafilatura.readthedocs.io/en/latest/usage-python.html>
  and default configuration:
  <https://github.com/adbar/trafilatura/blob/v2.2.0/trafilatura/settings.cfg>
- **[S9]** Trafilatura 2.2.0 duplicate source and official documentation:
  <https://github.com/adbar/trafilatura/blob/v2.2.0/trafilatura/deduplication.py>
  and <https://trafilatura.readthedocs.io/en/latest/deduplication.html>
- **[S10]** Trafilatura 2.2.0 input decoding/parser/language and downloader:
  <https://github.com/adbar/trafilatura/blob/v2.2.0/trafilatura/utils.py#L104-L317>,
  <https://github.com/adbar/trafilatura/blob/v2.2.0/trafilatura/utils.py#L446-L503>,
  and <https://github.com/adbar/trafilatura/blob/v2.2.0/trafilatura/downloads.py#L132-L275>
- **[S11]** Official evaluation page and executable-method documentation/source:
  <https://trafilatura.readthedocs.io/en/latest/evaluation.html>,
  <https://github.com/adbar/trafilatura/blob/master/tests/README.rst>, and
  <https://github.com/adbar/trafilatura/blob/master/tests/eval_common.py>
- **[S12]** Tagged license files and package declarations:
  <https://github.com/adbar/trafilatura/blob/v1.7.0/LICENSE>,
  <https://github.com/adbar/trafilatura/blob/v1.8.0/LICENSE>, and
  <https://github.com/adbar/trafilatura/blob/v2.2.0/LICENSE>
- **[S13]** Relicensing commit `c7e00f3` and release boundary comparison:
  <https://github.com/adbar/trafilatura/commit/c7e00f3a31e436c7b6ce666b44712e16e30908c0>
  and <https://github.com/adbar/trafilatura/compare/v1.7.0...v1.8.0>
- **[S14]** Public consent issue and merged license pull request:
  <https://github.com/adbar/trafilatura/issues/512> and
  <https://github.com/adbar/trafilatura/pull/526>
- **[S15]** Default branch at inspected head `a397f890` (unreleased after 2.2.0):
  <https://github.com/adbar/trafilatura/commit/a397f890f75bd3f1df216915617839523010fae8>
- **[S16]** Barbaresi, *Trafilatura*, ACL-IJCNLP 2021 system paper:
  <https://aclanthology.org/2021.acl-demo.15/>
- **[S17]** Officially linked but mismatched Webis PDF retrieved on access date:
  <https://webis.de/downloads/publications/papers/bevendorff_2023b.pdf>
- **[S18]** Official troubleshooting limits and dynamic-page/download guidance:
  <https://trafilatura.readthedocs.io/en/latest/troubleshooting.html>
- **[S19]** Boundary dependency metadata used by 1.8.0:
  <https://pypi.org/pypi/courlan/1.0.0/json>,
  <https://pypi.org/pypi/htmldate/1.8.0/json>, and
  <https://pypi.org/pypi/justext/3.0.0/json>
