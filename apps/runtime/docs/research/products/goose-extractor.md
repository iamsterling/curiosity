# Goose article extraction: clean-room reverse-engineering dossier

**Decision frame:** Which Goose extraction ideas should Curiosity adopt, adapt,
reject, or defer for an owned, bounded, provenance-preserving article extractor?

**Snapshot:** Public primary sources accessed 2026-08-17. The maintained subject
is **Goose3 3.1.22** (`goose3/goose3`, PyPI package `goose3`), not the old Scala
Goose or Python-2 `goose-extractor` package. Source behavior was reviewed at
release/master commit `87b6003d740e1be591ede6a2c328e02ed7c1d84c`. No code is
copied here [S1][S2].

**Boundary:** Static HTML article extraction, metadata, and optional lead-image
selection are in scope. Crawling at scale, rendering, search, and publisher
rights are not. No live third-party pages, credentials, access-control bypass,
or hostile security probes were used. This is research, not implementation or
legal advice.

## Executive verdict

Goose3 is a maintained Python continuation of a 2011-era news/article extractor.
Its core is understandable and still useful as an **evaluation oracle**: find
paragraph-like nodes, score their ancestors using language stopword density,
penalize link-heavy regions, select one high-scoring container, prune it, and
flatten the result to text. Separate precedence chains infer title, publication
date, authors, Open Graph/schema.org metadata, and—only when explicitly enabled—a
probable lead image [S3][S4][S5][S6].

The transferable lesson is not the particular thresholds. It is the staged
combination of explicit article-container hints, publisher metadata, structural
text density, link-density rejection, sibling recovery, and conservative text
formatting. The major deficiencies for Curiosity are equally important:

- extraction decisions have no field-level evidence, confidence, or rejection
  ledger;
- claimed metadata can override the fetched URL and is treated as truth;
- publication, modification, fetch, and observation times are conflated or
  absent;
- the stopword/layout model is brittle for wrong-language, non-prose, dynamic,
  fragmented, and list/table-heavy pages;
- the built-in fetcher is not a safe crawler boundary, and optional image
  fetching materially expands SSRF, resource-exhaustion, and credential/header
  propagation risk;
- returned raw DOM/HTML, metadata, URLs, and embed code remain hostile even when
  `cleaned_text` is plain text [S4][S6][S7].

**Decision — ADAPT concepts; DEFER Goose3 itself to a pinned, sandboxed offline
oracle; REJECT it as Curiosity's fetcher, security boundary, sole extractor, or
evidence authority (high confidence).** Build Curiosity's owned baseline from an
independent specification with explicit bounds, field provenance, confidence,
and typed failures. Do not copy Goose source or magic constants into the owned
implementation.

## 1. Frame, questions, and evidence policy

### 1.1 Bounded questions

1. Which project and version currently carry the Goose article-extraction line?
2. How are main text and container boundaries inferred?
3. How are title, date, image, language, URLs, and other metadata selected?
4. Which language and layout assumptions control accuracy?
5. What does “cleaned” mean, and what remains untrusted or executable?
6. What failure, maintenance, license, and clean-room risks matter?
7. Which ideas should Curiosity adopt, adapt, reject, or defer?

Labels used throughout:

- **FACT** — directly established by cited first-party artifacts.
- **INFERENCE** — the narrowest architectural or behavioral conclusion supported
  by those facts; not a quality measurement.
- **RECOMMENDATION** — a Curiosity design or evaluation decision.
- Confidence is **high**, **medium**, or **low**.

Repository source, release metadata, PyPI metadata/artifact records, project
documentation, changelog, tests, and maintainer issue discussions are primary
for project behavior and represented maintenance. User-reported issues establish
that a failure was reported, not its frequency or persistence. No comparative
accuracy or security efficacy claim is made.

## 2. Product identity, lineage, and maintenance

### 2.1 Current maintained identity

**FACT (high):** Goose3 3.1.22 was released on GitHub and PyPI on 2026-07-23,
requires Python 3.9+, and declares Apache-2.0. The release notes cite a quadratic
search fix, non-UTF-8 decoding fix, Kurdish stopword update, other fixes, and
dependency updates. The public repository was not archived and its current CI
matrix covered Python 3.9–3.14 at the reviewed commit [S1][S2][S8].

**FACT (high):** The exact PyPI 3.1.22 artifacts were:

- wheel SHA-256 `787daa1a6439222e462e1da1783601f44affa0d941aba7e2609f71e2e2eb8aa0`;
- sdist SHA-256 `db53cb2ffbab3d5dfe933ded4568ba41243bf349a264aceccc01109d19e15f23` [S1].

**Maintenance assessment (medium-high):** A release less than one month before
the access date, modern Python CI, active maintainers, dependency automation,
and fixes across 2023–2026 support “maintained.” They do not establish response
SLAs, bus factor, security-review depth, extraction quality, or production
fitness. Packaging still labels the project Beta, dependency requirements are
mostly unbounded, and stale copy/paste links in packaging/contribution metadata
point at an unrelated `barrust/mediawiki` issue tracker [S8].

### 2.2 Lineage and names that must not be confused

| Name | Current interpretation | Evidence / verdict |
| --- | --- | --- |
| GravityLabs `goose` | Original Java-to-Scala project; latest checked commit was 2015-12-01 and README says Gravity open-sourced it in 2011. | Historical origin only; **REJECT** as current project [S10]. |
| PyPI `goose-extractor` / `grangier/python-goose` | Python-2 rewrite by Xavier Grangier; PyPI latest is 1.0.25 uploaded 2015-01-03. A 2026 README-only repository commit does not make the published Python-2 package current. | Historical predecessor; **REJECT** for current use [S11]. |
| PyPI `Goose` | An unrelated SQL migration tool. | **REJECT** as name collision [S11]. |
| `goose3/goose3`, PyPI `goose3` | Python-3 continuation, version 3.1.22. | **Current maintained subject** [S1][S2]. |

**Reproducibility caveat (high):** The repository simultaneously exposed a tag
`v3.1.22` at `87b6003...` and a same-named branch at `9acbaa1...`. Static
comparison found extraction source equivalent; workflow files differed. A build
or citation must therefore pin the commit or PyPI digest, not merely the ref name.

## 3. Observable result model and pipeline

### 3.1 Inputs and outputs

**FACT (high):** `Goose.extract` accepts a URL or previously fetched raw HTML. If
truthy raw HTML is supplied, it is parsed instead of fetched. The result is an
`Article` carrying `cleaned_text`, title, description, language, encoding,
favicon, keywords, canonical and final URLs, domain, authors, tags, publication
date/string and parsed datetime, Open Graph and selected schema data, links,
tweets, videos, top node, top-node HTML, original HTML/DOM, and optional image
data [S3][S5].

**FACT (high):** The principal pipeline is:

```text
URL fetch or caller-supplied HTML
  -> HTML parse (lxml; soup parser is fallback for limited exception classes)
  -> Open Graph + selected JSON-LD + general metadata
  -> title/date/author/tag inference
  -> optional known article-container restriction
  -> structural cleanup
  -> paragraph/pre/table-cell scoring and best ancestor selection
  -> sibling recovery + post-pruning
  -> link/format flattening + short-node removal
  -> plain cleaned text
  -> optional image downloads/scoring during the selected-node phase
```

Metadata is extracted before destructive content cleanup. The original HTML and
an original DOM copy remain on the `Article`; the selected-node HTML is captured
before post-cleanup and text formatting [S4][S5].

### 3.2 No evidence contract

**FACT (high):** Goose3 returns values but not, for each value, the exact source
element, selector, alternative candidates, rejection reason, calibrated
confidence, extraction warning, or content offsets. Image has a heuristic
`confidence_score` and extraction type internally, but `Article.infos` omits
both. Main-text scoring attributes mutate the working DOM and are not presented
as a stable audit contract [S4][S5][S6].

**RECOMMENDATION (high):** Curiosity must emit candidate/evidence records for
every inferred field: source kind, DOM locator or byte/span anchor, raw value,
normalized value, precedence rule, confidence factors, alternatives, and
warnings. A value without its evidence is a convenience projection, not an
authoritative fact.

## 4. Main-text and layout inference

### 4.1 Explicit container hints

**FACT (high):** Before general scoring, Goose looks for configured container
patterns. Defaults include classes such as `short-story`, `post-content`,
`g-content`, and `post-outer`, `itemprop=articleBody`, and the `<article>` tag.
Patterns can be domain-specific and callers can prepend custom patterns. If any
matching nodes exist, cleaning and scoring are restricted to those nodes; this
does not simply accept the first match [S4].

**INFERENCE (high):** Semantic markup can materially improve precision, but one
false-positive generic `<article>` or broad class can hide the real body. A list
of site-specific selectors is operational policy, not universal semantics.

### 4.2 Candidate and ancestor scoring

**FACT (high):** Candidate text nodes are only `<p>`, `<pre>`, and `<td>`. A
candidate enters scoring when it contains more than two language stopwords and
is not high-link-density. Its stopword count, plus an order/adjacency boost or
late-page adjustment, is propagated up every ancestor with depth decay. The
highest-scoring ancestor becomes the top node [S4].

The important mechanics are:

1. **Prose density proxy:** stopword count stands in for sentence-like natural
   language rather than raw character length.
2. **Link-density filter:** linked words multiplied by link count relative to all
   words rejects navigation/link farms at a fixed threshold.
3. **Early connected-prose boost:** a paragraph near other substantial preceding
   paragraphs receives a diminishing boost.
4. **Ancestor aggregation:** related paragraphs make their common container win.
5. **Bottom adjustment:** on documents with more than 15 eligible nodes, nodes
   in the last quarter receive a nonlinear adjustment intended to reduce footer
   capture, with a cap-like reversal in extreme cases.
6. **Fallback:** if restricted known-container scoring yields no node, Goose
   retries against the root document [S4].

**INFERENCE (medium-high):** This is a deterministic, lexical-layout heuristic,
not semantic article understanding. It favors continuous prose with common
function words inside a shared ancestor. It is naturally weaker for poetry,
code, recipes, bullet lists, data tables, terse live blogs, transcripts with
short turns, FAQs, captions, and languages whose tokenization differs from
space-delimited words.

### 4.3 Sibling recovery and pruning

**FACT (high):** Unless the selected top node itself matches a known article
pattern, Goose walks preceding siblings and may prepend paragraphs whose
stopword score exceeds 30% of the selected node's average qualifying paragraph
score and whose link density is low. It then prunes direct children that are
link-heavy, table-like without paragraphs, or scored below 8% of the top-node
score. Paragraphs, optionally lists, and optionally headings are favored [S4].

**INFERENCE (high):** Preceding-sibling recovery can restore an introduction that
the ancestor scorer missed, but it does not recover following fragments or
content split across unrelated containers. The asymmetric walk and direct-child
pruning explain plausible partial extraction without any explicit partial flag.

### 4.4 Text formatting

**FACT (high):** Formatting strips anchor and common emphasis tags while retaining
their text, converts `<br>` to a line marker, removes descendants with fewer than
three stopwords (subject to embed exceptions), can remove parenthetical-only
nodes, renders list items with bullets, unescapes HTML entities, normalizes
whitespace, and joins child blocks with blank lines. It returns plain text, not
sanitized HTML [S4].

**INFERENCE (medium):** Because conversion iterates children of the top node,
direct text attached to the selected root can be underrepresented. Bottom-up
short-node removal can also lose meaningful datelines, labels, captions,
single-sentence corrections, or terse headings. Formatting destroys emphasis
and link-span boundaries that would be useful for exact citation maps.

## 5. Title, date, image, language, and metadata inference

### 5.1 Field precedence ledger

| Field | Goose3 precedence / behavior | Consequential limitation |
| --- | --- | --- |
| Final URL | `og:url`, then selected schema `url`, then supplied/fetched URL; a list is collapsed to its first item. | Publisher-controlled metadata can replace transport identity; redirects and declarations become conflated [S4]. |
| Canonical URL | First `<link rel=canonical>`; relative values are joined to scheme + hostname; otherwise final URL. | No trust/same-origin policy, URL validation, or distinction between declaration and system identity [S5]. |
| Title | First `og:title`; selected schema `headline`; `meta[name=headline]`; first `<title>`. Domain and Open Graph/schema publisher strings may be removed using separator heuristics. | Does not use visible `<h1>` as fallback; duplicate/list metadata and title punctuation can alter output [S5]. |
| Publication date | `article:published_time` in Open Graph; selected schema `datePublished`; first matching configured tag, including generic `<time>`. | No `dateModified` result, no visible date scoring, and generic first `<time>` may be unrelated [S5]. |
| UTC datetime | `dateutil` parses the selected string using a large abbreviation-offset map; zoned values are converted to UTC, unzoned values remain naive. | A property named `publish_datetime_utc` may contain a timezone-naive value [S4][S5]. |
| Authors | Selected schema `author` first; otherwise configured `itemprop=author/name` or `meta[name=author]`; meta values are deduplicated with a set. | No byline normalization, role/organization model, stable ordering guarantee for set-derived results, or evidence [S5]. |
| Language | First two letters of `<html lang>`, Content-Language meta, or `meta[name=lang]`; if absent, deterministic `langdetect` over description + title + keywords + tags. Scoring falls back to configured target language (`en`). | Locale/script subtags are discarded; body text is not the fallback detector input [S4][S5][S7]. |
| Description/keywords/favicon | First conventional meta description/keywords and first icon link. | Values are publisher claims; favicon may remain relative; no normalization/confidence [S5]. |
| Tags | Anchor `rel=tag`, else URL paths resembling tag/topic/keyword; deduplicated. | URL-shape heuristic can misclassify navigation and loses order [S5]. |
| Open Graph | Collects all property/content pairs for `og:*` and page-declared OG-type prefixes; duplicates become lists. | Arbitrary untrusted values are retained; downstream field consumers support only some list shapes [S5]. |
| JSON-LD schema | Parses JSON scripts whose top object has exact schema.org context; returns the first exact scalar type among `ReportageNewsArticle`, `NewsArticle`, `Article`, including supported `@graph` forms. | No merge; context/type arrays, aliases, richer types, malformed graphs, and many valid image/author shapes may be missed [S5]. |

### 5.2 Language assumptions

**FACT (high):** Version 3.1.22 ships stopword files for 44 two-letter language
codes. Generic scoring tokenizes on whitespace and ASCII punctuation. Dedicated
classes exist for Chinese (`jieba`), Arabic (`nltk` stemming/tokenization),
Korean (`pyahocorasick`), and Japanese (`fugashi`); README usage requires the
caller to choose those classes. Detecting `zh`, `ar`, `ko`, or `ja` does not by
itself dynamically select the specialized tokenizer [S3][S7][S8].

**INFERENCE (high):** “Language aware” means language-indexed stopwords plus
caller-selectable tokenizers, not broad multilingual robustness. Wrong or absent
metadata can make the body disappear because the wrong stopword vocabulary
prevents paragraphs from entering scoring. Thai and other scripts without
reliable whitespace segmentation remain especially exposed even when a
stopword file exists. Mixed-language pages and script variants are not modeled.

### 5.3 Lead-image selection

**FACT (high):** Image extraction is disabled by default. When enabled, Goose
tries, in order: known site/CSS image locations; images in/near the selected
content; `link rel=image_src`; then Open Graph or schema.org image metadata. DOM
candidates are filtered by filename patterns and fetched to disk so Pillow can
inspect dimensions. At most roughly 30 candidates are considered; sequence,
area relative to the first image, minimum width, ancestor depth, and extreme
aspect-ratio rejection influence selection [S6][S8].

**FACT (high):** Candidate discovery reads `img[src]`, not modern `srcset`,
`picture/source`, CSS backgrounds, or common lazy-load attributes. The code
comment describes a HEAD phase, but the implementation performs full GETs.
Metadata fallback also downloads the claimed image before returning details.
The 15 MiB check occurs after download and disk write [S6].

**INFERENCE (high):** Image fetching is neither metadata-only nor cheap. It can
multiply network calls and latency, select low-resolution placeholders, miss
responsive/lazy hero images, or fail the whole extraction under strict network
mode. Its `100 / candidate_count` confidence is not a probability of correctness.

## 6. Cleaning is not sanitization

### 6.1 What cleanup does

**FACT (high):** The document cleaner removes scripts, styles, comments, and
elements whose id/class/name matches a hard-coded clutter regex (navigation,
comments, footers, social tools, subscription, byline/date patterns, and more).
It drops some formatting tags, unwraps paragraph spans, and converts eligible
div/span text into paragraph-like nodes. Later stages strip links and formatting
from the selected text [S4].

This is **boilerplate reduction** and layout normalization. It is not a general
HTML sanitizer, network policy, prompt-injection filter, malware scanner, or
content-safety classifier.

### 6.2 Untrusted surfaces retained

**FACT (high):** `Article` retains original raw HTML, an original DOM, working
DOM/top node, pre-post-cleanup top-node HTML, all collected Open Graph values,
the selected JSON-LD object, URLs, links, tweets, and serialized video embed
code. Video provider recognition is a substring check for a small provider list;
embed markup is serialized from the page [S5].

**RECOMMENDATION (high):** Curiosity must never render, execute, follow, or pass
these fields into an instruction channel without separate validation. Store raw
captures in a quarantined evidence store; expose plain text and typed metadata
through escaped interfaces; validate every URL at use time; strip active embeds;
and mark all extracted page text as `untrusted_external_data`. Plain text can
still contain prompt injection, malicious instructions, secrets, defamation, or
copyrighted content.

## 7. Fetching and security analysis

### 7.1 Built-in page fetcher

**FACT (high):** Goose3's fetcher is a reusable `requests.Session` issuing GETs
with a default 30-second timeout, caller-configurable headers/proxies/auth, and a
`Goose/<version>` user agent. Non-success responses raise only when `strict=True`;
with strict mode off, their bodies can continue into extraction. The response
status, headers, content type, byte count, redirect chain, fetch time, and source
IP are not represented in `Article` [S4][S6].

**Negative result (high):** Reviewed Goose3 source and documentation expose no
robots policy, per-host politeness, redirect ceiling of its own, scheme allowlist,
DNS/private-address guard, post-redirect IP validation, response-byte or
decompression limit, MIME allowlist, total request deadline, retry/backoff
policy, cache provenance, or capture digest [S3][S4][S6]. Underlying Requests
defaults may provide TLS verification and redirect behavior, but they do not
create Curiosity's required crawler policy or evidence record.

### 7.2 Optional image-fetch risk

**FACT (high):** Image URLs come from hostile page markup/metadata and are fetched
through the same configured fetcher. Full bodies are loaded before size checks,
written to a shared configurable temporary directory under names based on
non-cryptographic hashes plus time, and parsed by Pillow. Base64 data images are
decoded and written without a declared pre-decode bound. Cleanup runs at the end
of normal processing, so exceptional paths may leave files [S6].

**INFERENCE (high):** In a server context this creates material risks:

- SSRF to loopback, private, link-local, metadata, or redirected destinations;
- cross-origin propagation of caller-supplied generic headers and configured
  authentication to image requests;
- memory, disk, CPU, decompression, and latency exhaustion across many images;
- parser exposure to adversarial image files;
- extraction failure because one secondary asset errors;
- temporary-file collisions/leakage concerns in shared workers.

**RECOMMENDATION (high):** Do not allow Goose3 to fetch URLs inside Curiosity.
Supply already bounded HTML to any oracle run. If images are evaluated later,
use Curiosity's isolated fetch service with DNS and redirect revalidation,
public-address-only policy, no ambient credentials, strict byte/MIME/dimension/
decompression bounds, bounded candidate count/concurrency, disposable storage,
and independent failure reporting.

## 8. Failure-mode register

| Failure class | Mechanism / observed evidence | Curiosity treatment |
| --- | --- | --- |
| Empty or wrong main text | Wrong language/stopwords, fewer than three stopwords per paragraph, high link density, no eligible prose, or a wrong known container. Maintainer discussions and issue #106 connect language selection to empty extraction [S9]. | Typed `no_candidate`/`language_uncertain`; retain candidates and retry only within a declared bounded policy. |
| Partial article | Fragmented containers, preceding-only sibling recovery, aggressive direct-child/short-node pruning. Open issue #196 reports missing middle content; #169 reports incomplete publisher pages [S9]. | Coverage checks against DOM text blocks; report omitted high-text regions, never silently claim completeness. |
| List/table/reference page loss | Prose-centric `<p>/<pre>/<td>` scoring and pruning. Open issue #204 reports omissions on Wikipedia list pages [S9]. | Route detected non-article document classes to a different extractor; do not force article semantics. |
| Dynamic or consent-gated content | No JavaScript execution, interaction, cookie workflow, shadow DOM, or hydration. Maintainer response on issue #121 explicitly notes script-loaded media is absent from original HTML [S9]. | Static-first; return `render_required`/`access_interstitial`, with separately authorized bounded render lane. |
| Paywall/anti-bot/error page selected | Fetcher can receive access walls; strict-off mode parses non-2xx bodies; no page-type classifier or status provenance. | Fetch layer preserves status/redirect/content type; classify interstitials before extraction. |
| Metadata spoof/conflict | OG/JSON-LD are publisher-controlled and precedence selects one value without corroboration; generic first `<time>` is accepted. Historical duplicate OG/schema shape bugs caused exceptions [S8][S9]. | Keep all candidates and source locators; conflict object; never overwrite transport URL or factual time. |
| Title damage | Publisher/domain removal and separator heuristics; no visible-heading fallback. Duplicate title/site-name shapes have repeatedly required fixes [S8][S9]. | Score visible and metadata title candidates; preserve original values and transformations. |
| Date ambiguity | Only one “publish” field; no modification extraction; unzoned parsed dates may remain naive. | Separate claimed published/modified times, normalized instant, original string, timezone status, and confidence. |
| Image absent/wrong/failing | Disabled by default; modern responsive/lazy attributes missed; downloads can fail; heuristic favors early large non-banner images. | Metadata-only candidates first; fetch selected few in isolated lane; preserve alt/caption/declared role and failure. |
| Encoding/parser failure | Conflicting declarations, malformed HTML, or non-UTF-8 bytes. 3.1.22 fixed one decode case; fallback catches only `UnicodeDecodeError` and `ValueError` [S2][S4]. | Byte-faithful capture; bounded encoding candidates; parser warning ledger; never discard raw bytes. |
| Resource exhaustion | Unbounded page body/DOM, recursive ancestor updates, regex/XPath work, image fanout and bodies. 3.1.22 fixed one quadratic search path, demonstrating algorithmic sensitivity [S2][S4][S6]. | Pre-parse byte/decompression caps, DOM node/depth/time budgets, cancellation, and per-stage metrics. |
| False clutter removal | Broad id/class/name regex can remove legitimate `date`, `byline`, `footnote`, `tags`, captions, or social-reporting content. | Treat class names as weak features; record removed-block summaries and allow domain-scoped policy. |
| No failure/completeness signal | Empty strings/`None` and partial values are ordinary fields; no warnings or coverage score. | Typed result status, warnings, stage errors, completeness estimate, and fallback lineage. |

## 9. Curiosity implications and verdict ledger

| Goose pattern | Verdict | Rationale |
| --- | --- | --- |
| Separate metadata extraction before body cleanup | **ADOPT** | Preserves metadata that destructive cleaning would remove; add evidence anchors. |
| Explicit semantic/site container hints | **ADAPT** | Valuable high-precision feature, but scope by host/template/version and never hard-accept without text/coverage validation. |
| Stopword-density prose signal | **ADAPT** | Cheap, interpretable feature; combine with punctuation, sentence, DOM, accessibility, and multilingual segmentation signals. Do not use as sole gate. |
| Link-density rejection | **ADOPT as one feature** | Useful against navigation; avoid fixed universal thresholds and preserve citation/link text separately. |
| Ancestor aggregation | **ADOPT** | Shared-container support is a strong provider-neutral layout principle. |
| Order boost and preceding-sibling recovery | **ADAPT** | Helps restore leads but must inspect both directions and maintain DOM-order provenance. |
| Hard-coded clutter class regex | **REJECT as authority** | Brittle and capable of deleting legitimate evidence; retain only as weak, testable features. |
| One best node, one plain-text projection | **ADAPT** | Useful convenience output, but preserve multiple candidate regions, block map, offsets, and completeness. |
| Metadata precedence to one value | **REJECT** | Preserve candidates/conflicts; infer a preferred projection with reason and confidence. |
| OG/schema URL as `final_url` | **REJECT** | Transport-terminal URL, publisher canonical, OG URL, and system cluster ID are distinct identities. |
| Generic first `<time>` as publication time | **REJECT** | Too ambiguous; type and corroborate date candidates. |
| Specialized language tokenizers | **ADAPT** | Script-aware segmentation is necessary, but selection must be automatic, explicit, versioned, and fallback-safe. |
| Lead-image candidate scoring | **ADAPT** | Sequence, dimensions, role metadata, caption proximity, and aspect ratio are useful features; fetching belongs elsewhere. |
| Built-in URL/image fetch | **REJECT** | Missing Curiosity's network safety, bounds, provenance, and politeness contract. |
| Raw DOM/HTML and embed fields in normal result | **REJECT at ordinary boundary** | Keep quarantined capture references, not casually consumable active markup. |
| Goose3 as extraction ensemble member | **DEFER** | Useful pinned offline oracle after dependency/license/security review and representative evaluation; not core production authority. |
| Copying Goose implementation/constants | **REJECT** | Conflicts with owned clean-room baseline and imports historical assumptions even where Apache permits reuse. |

### 9.1 Required owned extraction contract

**RECOMMENDATION (high):** Curiosity's extractor result should minimally preserve:

1. capture ID/digest, raw-byte length, MIME/encoding evidence, fetched URL,
   redirect-terminal URL, HTTP status, and fetch time;
2. extractor name/version/config and deterministic stage budget;
3. a DOM-to-text block map with source offsets/locators and block classifications;
4. body candidates with feature contributions, selected regions, excluded
   high-text regions, and completeness warnings;
5. title/author/date/image/language/canonical candidates, each with raw value,
   source, normalized value, confidence factors, and conflicts;
6. distinct `published_claimed_at`, `modified_claimed_at`, `fetched_at`, and
   `first_seen_at`, retaining timezone uncertainty;
7. immutable plain-text passage anchors/hashes for citation;
8. typed statuses such as `ok`, `partial`, `no_candidate`, `unsupported_layout`,
   `render_required`, `interstitial`, `parse_failed`, and `budget_exhausted`;
9. an untrusted-data marker on every publisher-derived field;
10. no network access in the parsing process.

## 10. License, dependency, and clean-room risk

### 10.1 License facts

**FACT (high):** Goose3 declares Apache License 2.0. Source headers attribute the
original Gravity.com work and the Python port by Xavier Grangier. Apache-2.0
permits use, modification, and redistribution subject to its conditions,
including license delivery, modified-file notices, and preservation of relevant
notices; it includes a patent grant and trademark limitation [S3][S12].

**FACT (high):** Reviewed Goose3 3.1.22 source headers say to consult a distributed
`NOTICE` file, but the repository snapshot contains no top-level `NOTICE`. The
historical GravityLabs repository's `NOTICE` says the product includes software
developed by Gravity.com [S10][S12]. This is an attribution-packaging ambiguity,
not proof that Goose3 is unlicensed.

**RECOMMENDATION (high):** Before distributing Goose3 or a derivative, legal/
license review should resolve the missing NOTICE, preserve source-header and
historical attribution as required, inventory every mandatory and optional
dependency and bundled stopword resource, and pin exact artifacts. Apache-2.0
does not grant rights to republish extracted publisher content.

### 10.2 Dependency and supply-chain boundary

**FACT (high):** Runtime dependencies include Requests, Pillow, lxml, cssselect,
Beautiful Soup, python-dateutil, langdetect, and pyahocorasick; Chinese, Arabic,
and Japanese extras add jieba, NLTK, and fugashi/unidic-lite. `setup.cfg` leaves
versions unbounded, while the repository's developer requirements pin
`lxml<6.0.0`, creating an install-path discrepancy [S8].

**RECOMMENDATION (high):** Any oracle environment needs a reviewed lockfile,
artifact hashes, transitive license/SBOM review, vulnerability scanning,
read-only root, no network, CPU/memory/time/file quotas, and disposable storage.
Do not infer dependency safety from Goose3's Apache label.

### 10.3 Clean-room boundary

This dossier describes observable outputs, public documentation, and high-level
algorithmic behavior. Curiosity's owned extractor should be authored from an
independent requirements/behavior specification and test corpus, not by
translating Goose source, comments, thresholds, regexes, resource lists, or test
fixtures. If a separately reviewed decision instead elects to reuse Apache code,
that is ordinary licensed dependency work—not clean-room implementation—and its
attribution, modification, provenance, and dependency obligations must be
tracked explicitly.

## 11. Checks and unknowns

### 11.1 Checks completed

- **Identity check:** triangulated GitHub release/repository state, PyPI current
  metadata, version source, changelog, and documentation; resolved current
  subject to Goose3 3.1.22 [S1][S2][S8].
- **Lineage check:** inspected first-party original Scala and Python-2 project
  artifacts plus PyPI publication history [S10][S11].
- **Behavior check:** traced extraction order and field precedence across the
  pinned crawler, configuration, content, cleaner, formatter, metadata, image,
  network, parser, and text sources [S4]–[S7].
- **Failure triangulation:** compared inferred weaknesses with maintainer issue
  discussions for empty/partial/list/dynamic/metadata-shape failures [S9].
- **License check:** read the exact Goose3 Apache license, source attribution,
  package metadata, and historical Gravity NOTICE [S10][S12].
- **Negative-source check:** searched public source/docs for network bounds,
  robots, safe URL policy, field evidence, completeness, and sanitization; none
  was found in the reviewed contract.

No package was installed, tests executed, live extraction benchmarked, arbitrary
page fetched, or security condition probed. Those require a separately declared
evaluation frame and budget.

### 11.2 Material unknowns

| Unknown | Confidence / impact | Required bounded check |
| --- | --- | --- |
| Comparative extraction recall/precision by page class and language | Unknown; blocks quality adoption. | Offline, rights-cleared corpus with block-level gold labels; pin all versions. |
| Current CI pass state across all advertised Python versions | Not independently observed; medium operational impact. | Inspect signed/current workflow runs and reproduce in isolated lockfile environment. |
| Security posture of exact transitive dependency set | Unknown until resolved install; high impact. | Generate SBOM from pinned wheel lock and scan; review parser/image advisories. |
| Whether PyPI artifacts exactly reproduce from tagged source | Unknown; medium supply-chain impact. | Reproducible isolated build and file-level diff against both published digests. |
| NOTICE/attribution obligations for Goose3's port lineage and bundled resources | Ambiguous; high distribution impact. | Maintainer clarification plus legal review of source/package history. |
| Behavior on malformed/deep/huge HTML and image bombs | Unknown; high availability impact. | Owned synthetic fixtures only, under strict process quotas; no public target probing. |
| Stability of heuristic outputs across dependency upgrades | Unknown because requirements are broad. | Version matrix on fixed fixtures, recording parser and normalized block diffs. |
| Correctness of image confidence and date normalization | Uncalibrated; medium evidence impact. | Human-labeled image/date fixtures and reliability curves; do not treat current scores as probability. |

## 12. Proposed reproducible evaluation (not executed)

Future execution requires caller authority, an approved rights-cleared fixture
set, exact artifact pins, and a no-network sandbox.

1. **Contract fixtures:** one case per title/date/author/URL/OG/JSON-LD precedence
   and conflict, including duplicate/list/null/array values and timezone absence.
2. **Layout matrix:** continuous news prose; fragmented article; live blog;
   transcript; listicle; reference list; table; FAQ; recipe; code-heavy post;
   captions/footnotes; multi-article landing page; error/consent/paywall shell.
3. **Language matrix:** correct/wrong/missing language metadata; locale/script
   subtags; mixed-language bodies; whitespace and non-whitespace scripts; generic
   versus specialized tokenizer selection.
4. **Completeness:** compare selected blocks with gold DOM blocks; report body
   precision/recall, boundary accuracy, omitted-high-text blocks, and boilerplate.
5. **Metadata:** exact-match and normalized accuracy per candidate source; conflict
   handling; publication versus modification; naive-time frequency.
6. **Image:** metadata-only candidate recall, responsive/lazy markup, hero versus
   ad/avatar/logo/caption; image downloads remain disabled for Goose.
7. **Resource bounds:** synthetic byte/node/depth/paragraph/link/metadata sizes;
   measure CPU and memory under an outer kill deadline. Do not test network SSRF.
8. **Differential oracle:** compare Goose3 with Curiosity's owned baseline and
   other approved extractors. Inspect disagreements rather than majority-voting.
9. **Stability:** repeat across pinned parser/dependency versions; record every
   output and evidence-map change.
10. **Pass gate:** no untyped empty/partial success; provenance for every field;
    acceptable block metrics by declared page/language class; deterministic
    bounds; no parser network access; legal and dependency review complete.

## 13. Bounded curiosity pass

Gaps were scored 1–5 for relevance (R), decision value (V), novelty (N), and cost
(C); priority = R + V + N − C. Caller authority covered only public-source,
in-frame follow-up.

| Thread | R/V/N/C | Priority | Outcome |
| --- | --- | ---: | --- |
| Identify the actually maintained Goose | 5/5/4/1 | 13 | **Pursued.** Release/PyPI/source triangulation established Goose3 3.1.22 and excluded two historical/name-collision packages [S1][S2][S10][S11]. |
| Resolve image extraction's network implications | 5/5/4/2 | 12 | **Pursued.** Source established default-off behavior, full GET fanout, post-download size check, shared credentials/config, and missing network policy [S6]. |
| Explain language-linked empty extraction | 5/5/4/2 | 12 | **Pursued.** Source plus maintainer issue discussion established stopword gating, first-two-letter language selection, fallback detection limits, and manual specialized tokenizers [S7][S9]. |
| Trace metadata precedence and malformed shapes | 5/4/4/2 | 11 | **Pursued.** Pinned extractors and changelog/issues established exact precedence and repeated duplicate/list/null shape fixes [S5][S8][S9]. |
| Check release-reference reproducibility | 4/4/4/1 | 11 | **Pursued.** Same-name branch/tag divergence found; commit and PyPI hashes retained. |
| Determine missing NOTICE significance | 4/5/4/3 | 10 | **Pursued to public-source limit.** Missing current file and historical Gravity notice recorded; legal obligation remains deferred [S10][S12]. |
| Benchmark quality on current publishers | 5/5/3/5 | 8 | **CURIOSITY_NO_GO.** Requires live pages or a rights-cleared corpus, execution authority, and benchmark design. |
| Probe SSRF/redirect/image bombs | 5/5/3/5 | 8 | **CURIOSITY_NO_GO.** Static source is sufficient to reject the fetch boundary; active probing is unnecessary and outside authority. |
| Reconstruct or port exact heuristics | 2/1/3/5 | 1 | **CURIOSITY_NO_GO.** Violates the clean-room objective and adds no decision value. |
| Audit every stopword list's origin/license | 3/4/3/5 | 5 | **DEFERRED.** Necessary only if Goose/resources are distributed; dependency/legal review is the proper frame. |
| Inspect all historical forks | 1/1/2/5 | -1 | **CURIOSITY_NO_GO.** Current maintained identity is resolved; fork archaeology is out of frame. |

**Stop reason:** coverage and saturation. Every caller-requested dimension has a
pinned primary-source account. Remaining high-value unknowns require execution,
rights-cleared data, dependency resolution, maintainer clarification, or legal
authority; further public-source browsing would not resolve them.

## 14. Confidence summary

**High confidence:** current project/version; release date and artifact hashes;
Python/license declarations; pipeline order; text scoring/pruning mechanics;
metadata precedence; image default and download behavior; fetcher configuration;
absence of Curiosity-grade network bounds and field provenance.

**Medium confidence:** project-maintenance health beyond recent activity;
real-world frequency of each failure; resource-exhaustion severity under a given
deployment; exact legal consequence of the absent NOTICE; likely direct-root-text
loss and layout-class weaknesses until empirically measured.

**Low/unknown:** comparative quality, multilingual accuracy, security of a
resolved 2026 dependency graph, CI reproducibility, score calibration, publisher
coverage, and output stability across unpinned dependencies.

## Sources

All sources are first-party/public project artifacts accessed 2026-08-17.

- **[S1]** Python Packaging Authority, PyPI `goose3` 3.1.22 project and JSON
  metadata/artifact records, <https://pypi.org/project/goose3/3.1.22/> and
  <https://pypi.org/pypi/goose3/json>.
- **[S2]** Goose3, GitHub repository metadata and release 3.1.22 (2026-07-23),
  <https://github.com/goose3/goose3> and
  <https://github.com/goose3/goose3/releases/tag/v3.1.22>.
- **[S3]** Goose3 3.1.22 README and public API/quickstart documentation,
  <https://github.com/goose3/goose3/blob/87b6003d740e1be591ede6a2c328e02ed7c1d84c/README.rst>,
  <https://goose3.readthedocs.io/en/stable/code.html>, and
  <https://goose3.readthedocs.io/en/stable/quickstart.html> (both identified
  themselves as 3.1.22 on the access date).
- **[S4]** Goose3 pinned core pipeline source: `crawler.py`, `configuration.py`,
  `extractors/content.py`, `cleaners.py`, and `outputformatters.py`, repository
  commit `87b6003d740e1be591ede6a2c328e02ed7c1d84c`,
  <https://github.com/goose3/goose3/tree/87b6003d740e1be591ede6a2c328e02ed7c1d84c/goose3>.
- **[S5]** Goose3 pinned result/metadata source: `article.py`, `metas.py`,
  `opengraph.py`, `schema.py`, `title.py`, `publishdate.py`, `authors.py`,
  `tags.py`, and `videos.py`, same commit,
  <https://github.com/goose3/goose3/tree/87b6003d740e1be591ede6a2c328e02ed7c1d84c/goose3/extractors>.
- **[S6]** Goose3 pinned network/image source: `network.py`,
  `extractors/images.py`, `utils/images.py`, and `image.py`, same commit,
  <https://github.com/goose3/goose3/blob/87b6003d740e1be591ede6a2c328e02ed7c1d84c/goose3/network.py> and
  <https://github.com/goose3/goose3/blob/87b6003d740e1be591ede6a2c328e02ed7c1d84c/goose3/extractors/images.py>.
- **[S7]** Goose3 pinned parser/language source: `parsers.py`, `text.py`, and
  bundled stopword resources, same commit,
  <https://github.com/goose3/goose3/blob/87b6003d740e1be591ede6a2c328e02ed7c1d84c/goose3/text.py>.
- **[S8]** Goose3 changelog, package configuration, requirements, CI, and
  contribution guide at the pinned commit,
  <https://github.com/goose3/goose3/blob/87b6003d740e1be591ede6a2c328e02ed7c1d84c/CHANGELOG.md> and
  <https://github.com/goose3/goose3/tree/87b6003d740e1be591ede6a2c328e02ed7c1d84c>.
- **[S9]** Goose3 maintainer issue records: language/empty extraction
  [#106](https://github.com/goose3/goose3/issues/106), dynamic video
  [#121](https://github.com/goose3/goose3/issues/121), incomplete publishers
  [#169](https://github.com/goose3/goose3/issues/169), partial middle content
  [#196](https://github.com/goose3/goose3/issues/196), duplicate URL
  [#199](https://github.com/goose3/goose3/issues/199), JSON-LD graph shape
  [#202](https://github.com/goose3/goose3/issues/202), and list pages
  [#204](https://github.com/goose3/goose3/issues/204).
- **[S10]** GravityLabs, original Goose Scala repository README, license, and
  NOTICE at commit `462f04a0b3d79508266770fd2462b1d4b43f6c54`,
  <https://github.com/GravityLabs/goose/tree/462f04a0b3d79508266770fd2462b1d4b43f6c54>.
- **[S11]** Xavier Grangier, historical `python-goose` repository and PyPI
  `goose-extractor` 1.0.25 metadata/publication history,
  <https://github.com/grangier/python-goose/tree/d8476fae22962f7c358e6ea3cd3bc26770c95af7> and
  <https://pypi.org/project/goose-extractor/1.0.25/>. PyPI `Goose` name-collision
  record: <https://pypi.org/project/Goose/>.
- **[S12]** Goose3 Apache License 2.0 and attribution-bearing source headers at
  the pinned commit,
  <https://github.com/goose3/goose3/blob/87b6003d740e1be591ede6a2c328e02ed7c1d84c/LICENSE.txt>.
