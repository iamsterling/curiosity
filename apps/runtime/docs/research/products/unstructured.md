# Unstructured document partitioning: clean-room product study

**Decision frame:** Which observable Unstructured partitioning patterns should
Curiosity adopt, adapt, reject, or defer for bounded, provenance-preserving
document retrieval, without coupling its core contract to Unstructured's local
library or hosted control plane?

**Snapshot and boundary:** Primary public sources were accessed 2026-08-17.
This study covers the Apache-2.0 `unstructured`, `unstructured-inference`, and
legacy `unstructured-api` repositories at public HEAD commits
`104b585d4e84ad987b121e86aecf80315e8a12a6`,
`fc64017eafaccad7e5567c0f8e357867039dacf7`, and
`0830d20252687ed1c01a5c52e3a6ca27f6980984`, plus current first-party docs,
terms, privacy material, and security advisories [S1-S25]. No service account,
API key, paid or free processing call, traffic interception, private artifact,
model extraction, or access-control bypass was used. Public source was read for
interfaces and dependency facts; no code is copied into Curiosity. Hosted
implementation details remain proprietary and are not inferred from the legacy
API repository.

**Bounded questions:** (1) What formats and partition paths exist? (2) How do
text extraction, OCR, layout detection, table inference, and hosted VLM routing
differ? (3) What element, metadata, chunk, and provenance contracts result?
(4) Which native and system dependencies establish the trust boundary? (5)
Which security and resource bounds are public or missing? (6) What is truly
available locally versus hosted, and under which licenses and service terms?
(7) What independently designed lessons apply to Curiosity?

Labels below mean **FACT** (directly evidenced), **INFERENCE** (reasoned from
public evidence), **RECOMMENDATION** (Curiosity choice), **UNKNOWN**, and
**NEGATIVE RESULT**. Confidence is high, medium, or low.

## Executive verdict

**ADAPT the element-and-provenance shape; REJECT either Unstructured surface as
Curiosity's unbounded parser authority (high confidence).** Unstructured's
strongest transferable idea is a two-stage abstraction: format-aware
partitioning produces ordered semantic elements, then chunking combines whole
elements and splits text only when a hard limit requires it. Typed elements,
page coordinates, hierarchy, table HTML, source metadata, and recoverable
`orig_elements` are materially better retrieval inputs than undifferentiated
text [S2-S4].

The local library is a useful independently deployable adapter, but its broad
parser/converter/model dependency graph, lazy model downloads, remote-URL input,
attachment recursion, and lack of documented whole-job CPU/RAM/time/page/output
bounds make it unsafe to expose directly to untrusted documents. The hosted API
adds production jobs, cancellation, failed-file reports, file/concurrency
limits, broader formats, per-page Auto routing, VLM/fine-tuned OCR, advanced
chunking, enrichments, connectors, identity, and compliance claims. It also
sends document content into a proprietary service and potentially third-party AI
providers, and does not return enough processing provenance to reproduce why a
page took a route or which model/extractor version produced an element [S9-S19].

Curiosity should own admission limits, isolation, canonical provenance,
validation, chunk policy, retries, and terminal reasons. An Unstructured adapter
may return candidate elements, never trusted facts or authorization to fetch,
recurse, enrich, or continue.

**Overall confidence:** high for public contracts, current open-source paths,
licenses, job limits, and legal terms; medium for operational data flow across
hosted VLM providers; low for hosted routing thresholds, fine-tuned OCR/model
identity, internal resource ceilings, and output reproducibility.

## 1. Surface map and product boundary

| Surface | Observable role | Lifecycle and custody | Verdict |
| --- | --- | --- | --- |
| `unstructured` Python library | Format detection, document-specific partitioners, cleaning, staging, basic/by-title chunking; local calls return `Element` objects. | In-process; caller owns files, dependencies, model artifacts, isolation, and limits. Some functions can fetch URLs or call a remote inference/API surface. | **ADAPT** behind a sandboxed local adapter. |
| `unstructured-inference` | Layout detection, OCR/layout fusion, and optional table-structure inference used by `hi_res`. | Local model inference package; models can be downloaded lazily from Hugging Face. | **ADAPT** only as a replaceable implementation dependency. |
| Legacy Partition Endpoint | One local file per synchronous request; `auto`, `fast`, `hi_res`, `ocr_only`, and hosted `vlm`; limited chunking. | Hosted or self-hosted legacy API; current docs recommend it only for prototyping. | **DEFER/legacy**; do not make a new core dependency. |
| Pipeline API / Pipelines | Asynchronous jobs and workflow DAGs for batches or connectors; partition, chunk, enrich, embed, extract, load; status, cancel, failed-file, and download surfaces. | Multi-tenant SaaS, dedicated instance, or Business in-VPC. | **ADAPT** lifecycle ideas, not provider ownership. |
| Transform MCP | Agent-facing hosted document transformation built over Unstructured processing. | Remote MCP/service path with billing and platform terms. | **REJECT** as Curiosity's implicit parser; it broadens external authority and custody. |

**FACT (high):** The company explicitly describes the open-source library as a
quick-prototyping surface, says GPU use is unsupported there, and reserves newer
VLMs, fine-tuned OCR, by-page/by-similarity chunking, enrichments, production
orchestration, identity, and compliance features for hosted products [S1][S9].
This is a product support boundary, not proof that every underlying primitive is
technically absent from public code.

**NEGATIVE RESULT (high):** The public legacy `unstructured-api` repository is
Apache-2.0, but current hosted Pipeline/VLM/routing/enrichment behavior is not
published as corresponding server source. Self-hosting that legacy image cannot
be represented as feature-equivalent to current SaaS.

## 2. Format routing and partitioners

### 2.1 Detection and common return shape

**FACT (high):** `partition()` uses `libmagic` when available, otherwise file
extension, and routes to a document-specific function. A caller may bypass
detection with a MIME `content_type`. The generic function is a least-common-
denominator interface; direct partitioners expose format-specific controls
[S2]. Detection is routing evidence, not content validation: extension, MIME,
and magic can disagree, so Curiosity must retain all three and the selected
parser.

The open-source support page lists 27 distinct extensions across email, ebook,
HTML/Markdown/Org/RST/XML/text, images, PDF, Office/OpenDocument, CSV/TSV, and
RTF. The hosted API lists roughly 50 extensions, adding legacy Apple, AbiWord,
Hanword, StarOffice, dBase/data-interchange, macro/template Office variants,
and other conversion formats [S5][S10]. Hosted breadth is therefore a real
surface difference, not just a deployment difference.

### 2.2 Clean-room partition-path matrix

| Family | Observable path and output | Important caveats |
| --- | --- | --- |
| Plain text and code | `partition_text`; heuristic text classes; `max_partition` defaults to 1,500 characters. Listed code extensions route as text. | No syntax-tree semantics; `max_partition` is an element bound, not input/output/job bound. |
| HTML | DOM-aware `partition_html` from file, text, or URL; headings, links, hierarchy, emphasis, and image URLs can become element metadata. | URL fetching is network authority; HTML is still untrusted and active content must never be rendered as trusted markup. |
| Markdown | Markdown-to-HTML-style semantic path, then elements. | Embedded HTML/links remain untrusted; URL input exists in current source. |
| XML | Text extraction or tag-preserving mode; optional path selection. | Tag preservation does not validate schema, entity safety, or downstream HTML safety. |
| DOCX/PPTX | Uses native styles/structure to classify titles, narrative, lists, headers/footers, tables, and available page/slide metadata. | DOCX page numbers depend on renderer-inserted page breaks and can be incomplete. |
| DOC/PPT | Converts with LibreOffice, then delegates to DOCX/PPTX. | Invokes a large native converter; output may differ by LibreOffice version. |
| XLS/XLSX, CSV, TSV | Spreadsheet sheets become `Table` elements; CSV/TSV produce one table; text plus `text_as_html`. | A large sheet can become a large element/output; formulas/macros are not a trustworthy execution contract. |
| EPUB/ODT/Org/RST/RTF | Uses Pandoc or format conversion, then delegates to HTML/DOCX-style processing. | Native/binary dependency and conversion drift; current code uses Pandoc sandboxing after prior external-file inclusion risk [S23]. |
| EML/MSG/P7S | Body plus email headers/metadata; optional recursive attachment processing; encrypted PGP mail returns no elements with warning. | Attachment recursion and filenames are hostile-input boundaries; older MSG handling had critical path traversal [S21]. |
| PDF | Selects extractable-text, raster OCR, layout-model, or hosted VLM path; emits page elements, tables, links, coordinates/images when configured. | Most complex and resource-sensitive path; strategy fallback can silently change cost and fidelity. |
| Image | OCR-only or layout-model path locally; hosted VLM also supports image-heavy inputs. | Pixel dimensions, decompression, OCR language packs, and image crops dominate resource/output risk. |

**FACT (high):** Table support is not uniform. Native spreadsheets and CSV/TSV
carry HTML representations; PDF/image table structure requires the appropriate
layout/table path. The open-source metadata page says table extraction is on by
default unless types are skipped, while workflow High Res parameters separately
default table-structure flags to false [S2][S3][S12]. Treat table HTML presence
as an observed capability bit, not a universal guarantee.

**RECOMMENDATION (high):** Curiosity's provider-neutral parser request should
name the admitted content family and requested capabilities (`text`, `layout`,
`tables`, `images`, `links`, `hierarchy`) separately. Never make one opaque
`auto` choice determine network use, OCR, VLM disclosure, or resource class.

## 3. PDF/image strategies, OCR, and layout models

### 3.1 Local strategy state machine

**FACT (high):** Public local docs define:

* `fast`: extract embedded PDF text with `pdfminer`, then classify text. If text
  is not extractable, it can fall back to OCR. Recommended for ordinary digital
  PDFs.
* `ocr_only`: rasterize and use Tesseract, then feed raw text to
  `partition_text`. It can preserve reading order better than `hi_res` for some
  multi-column scans, but loses layout classes. It falls back to `fast` when
  Tesseract is absent and text is extractable.
* `hi_res`: run document layout detection, merge direct text/OCR into detected
  regions, and optionally infer tables. It can fall back to `ocr_only` if the
  documented layout dependency is unavailable.
* local `auto`: for PDFs, uses `fast` when text is extractable and `ocr_only`
  otherwise, but table-inference requirements can force `hi_res`; for images it
  chooses OCR unless table inference requires `hi_res` [S2][S6].

Copy-protected PDFs cannot use the direct `fast` path; documentation says they
fall to image-based `hi_res`, and fail if the layout path is unavailable [S2].
These fallbacks improve convenience but make the requested strategy different
from the executed strategy.

### 3.2 Local model and OCR inventory

**FACT (high, current source):** `unstructured-inference` currently defaults to
`yolox`; public configurations include YOLOX full, tiny, and quantized ONNX
models with classes for captions, footnotes, formulae, list items, headers,
footers, pictures, section headers, tables, text, and titles. Detectron2 ONNX
configurations remain available with a smaller Text/Title/List/Table/Figure
label map. Model files are lazily resolved from Unstructured Hugging Face
repositories. Table structure uses Microsoft's Table Transformer structure
recognition model after OCR tokens are collected [S7][S8].

**Documentation contradiction:** The partitioning page still says `hi_res`
uses `detectron2_onnx`, while current inference source sets `yolox` as the
default [S2][S7]. Therefore `hi_res` is a strategy name, not a stable model
identity. Curiosity must record actual model artifact ID/digest and package
version, not infer them from the strategy label.

**FACT (high, current source):** Tesseract is the default OCR agent. Optional
in-process agent classes exist for PaddleOCR and Google Cloud Vision; dynamic
agent loading is constrained to an environment-configured module allowlist
[S7]. Tesseract and Paddle require language mapping/model assets. Google Vision
changes the data boundary from local to remote even when the partition call is
otherwise local.

**UNKNOWN:** Public docs do not publish accuracy calibration by element class,
OCR confidence policy by language, exact model artifact digests used by hosted
High Res, or a reproducibility commitment across library/model upgrades.

### 3.3 Hosted routing and VLM

**FACT (high):** Current hosted Auto evaluates PDF pages independently and
routes embedded-text-only pages to Fast, pages with tables to High Res, and
other visually complex pages to High Res or VLM using an explicitly proprietary
and continuously optimized decision [S11][S13]. Hosted VLM accepts providers
including Anthropic, Bedrock, OpenAI/Azure OpenAI, and Vertex AI, with a mutable
model catalog [S14]. It is positioned for handwriting, multilingual, scanned,
and visually complex pages and can produce HTML-like canonical output [S11].

**Contract contradiction (high):** The VLM node guidance says every page routes
directly to the VLM, but its `allow_fast` setting defaults to `true` and says it
allows Fast routing. A caller requiring all-page VLM must set and verify
`allow_fast=false`; current docs do not expose per-page route decisions in the
output [S13].

**INFERENCE (medium):** Hosted Auto is a cost/quality optimizer rather than a
deterministic parser. Since routing thresholds and provider model versions can
change, identical input and request settings need not yield stable element
boundaries. This is acceptable for convenience ingestion, not sufficient for
audit-grade replay without captured output and route/model provenance.

## 4. Element, metadata, and provenance contract

### 4.1 What is preserved

**FACT (high):** An element normally has `type`, `element_id`, `text`, and
format-dependent metadata. Public element categories include `Title`,
`NarrativeText`, `ListItem`, `Table`, `Image`, `Formula`, `FigureCaption`,
`Header`, `Footer`, `PageNumber`, `CodeSnippet`, `Address`, `EmailAddress`,
`PageBreak`, and `UncategorizedText`; chunking adds `CompositeElement` and
`TableChunk` [S3][S4].

Useful metadata includes:

* source filename/directory/type and last-modified value;
* page/sheet/section and email header fields;
* bounding-box points plus coordinate-system width, height, orientation;
* `parent_id` and `category_depth` hierarchy;
* links, emphasized text, and HTML table representation;
* extracted image path or Base64 payload and MIME type;
* detected languages and layout detection class probabilities;
* connector record locator, URL/version, created/modified/processed times;
* `orig_elements` and `is_continuation` after chunking [S3].

**FACT (high, current source):** Default non-UUID IDs are the first 32 hex
characters of SHA-256 over filename, text, page number, and element sequence on
that page. `unique_element_ids=true` selects UUIDs. Parent IDs are remapped after
hashing [S3][S7]. The legacy endpoint parameter page imprecisely says the ID is a
hash of text, so the implementation-level definition should control only for a
pinned library version [S15].

### 4.2 Provenance loss and ambiguity

**NEGATIVE RESULT (high):** The standard element contract does not require:

* source-byte digest, byte offsets, immutable capture ID, or custody event;
* parser/converter/OCR/layout/table/VLM name, version, artifact digest, prompt,
  route, confidence calibration, or dependency lock digest;
* requested versus executed strategy and fallback reason;
* source MIME/magic/extension disagreement;
* OCR token/span confidence or claim-level support relation;
* processing start/end time, host/runtime identity, warnings, completeness,
  truncation, failed pages, or terminal reason.

Coordinates and a deterministic element ID improve traceability but are not a
reproducible chain of custody. Filename participates in the ID, while source
bytes and extractor version do not; renaming changes IDs and changed bytes can
retain an ID when visible text/position remain identical.

**RECOMMENDATION (high):** Curiosity should wrap every returned element in its
own provenance envelope: source capture ID and digest; detected/declared type;
parser adapter and pinned dependency/model digests; requested/executed route;
page and exact region; extraction confidence; warnings/fallbacks; parent and
original-element lineage; observed time; and completeness. Provider IDs are
aliases, never primary provenance keys.

## 5. Chunking behavior and retrieval consequences

### 5.1 Local core

**FACT (high):** Chunking is downstream of partitioning. It combines consecutive
whole elements and resorts to text splitting only when one element exceeds the
hard maximum. Output is limited to `CompositeElement`, `Table`, and
`TableChunk`. Local core exposes:

* `basic`: pack consecutive elements up to `max_characters`;
* `by_title`: additionally close at title/optional page boundaries and optionally
  combine undersized sections;
* hard `max_characters` (documented local default 500), soft
  `new_after_n_chars`, `overlap`, and risky `overlap_all` [S4].

Tables remain isolated and oversized tables become `TableChunk`s. Chunk
serialization can retain originals as gzip-compressed Base64 JSON in
`metadata.orig_elements`; those originals retain page and coordinate metadata
that cannot be unambiguously collapsed onto the chunk [S4].

### 5.2 Hosted additions

**FACT (high):** Hosted workflows add by-page and embedding-based by-similarity
chunking. The documented similarity model is
`sentence-transformers/multi-qa-mpnet-base-dot-v1`; low-similarity consecutive
elements are not combined, but the character maximum still wins [S16]. Hosted
contextual chunking is a later enrichment that prepends LLM-generated context,
preserves chunk count/order/IDs by contract, uses a default 15,000-character
context window, and returns original text unchanged on estimated time-limit or
per-element failure [S17].

**INFERENCE (high):** Preserving an ID while mutating text by adding generated
context breaks content-address semantics. Context is synthetic retrieval aid,
not source evidence, and must be stored in a separate field with model/prompt
provenance. Curiosity should never merge `Prefix:` text into quoted source text.

**RECOMMENDATION (high):** Adopt element-aware chunking and recoverable lineage;
adapt defaults to token-aware limits at the embedding boundary; reject
`overlap_all` by default; keep tables/images independently addressable; and
separate source text, normalized text, and generated context. Chunking must be
repeatable from captured elements without rerunning OCR/VLM.

## 6. Dependency and deployment envelope

### 6.1 Python and native dependencies

**FACT (high):** A minimal install handles text, HTML, XML, and email. Format
extras add libraries such as `python-docx`, `python-pptx`, Pandas/OpenPyXL/XLRD,
PDFMiner, PikePDF, PyPDF, PDF-to-image, HEIF, OCR wrappers, and
`unstructured-inference`. Full compatibility also requires `libmagic`, Poppler,
Tesseract plus language packs, LibreOffice, and Pandoc [S5][S7]. PaddleOCR adds
PaddlePaddle; the inference stack adds ONNX Runtime/OpenCV/Transformers and
model artifacts. Platform/Python support varies by optional dependency [S7][S8].

This is not a normal pure-Python parser. Office/ebook paths invoke converters;
PDF/image paths rasterize and run native/model code; OCR may spawn Tesseract;
models and language assets can be large and version-sensitive.

### 6.2 Network and supply-chain behavior

**FACT (high):** Local `partition`/HTML/Markdown can fetch URLs. Release 0.24.0
centralized these paths behind scheme/IP validation, per-redirect revalidation,
credential stripping on cross-origin redirects, proxy refusal, and default
10-second connect/300-second read timeouts. Private destinations can be re-
enabled by argument/environment escape hatch [S22]. Current layout models are
lazy downloaded from Hugging Face when needed [S7][S8].

**RECOMMENDATION (high):** A Curiosity local adapter must be offline at request
time: prefetch and digest-pin all wheels, native binaries, language packs, and
model weights under separate review. Disable URL inputs, private-network escape
hatches, custom headers, remote OCR, and model downloads. Treat conversion and
inference workers as disposable, unprivileged, read-only, no-network sandboxes.

### 6.3 License boundary

**FACT (high):** The three inspected public repositories declare Apache License
2.0 [S20]. Apache-2.0 permits independent use and modification subject to license,
notice, changed-file, and attribution obligations; it does not grant trademark
rights. Individual dependencies and downloaded models retain their own licenses
and must be inventoried separately. Public repository licensing does not license
hosted routing, proprietary fine-tuned OCR/VLM behavior, service output, or
Unstructured marks.

**FACT (high):** Hosted Platform Terms prohibit reverse engineering, circumventing
limits, using the service to develop competing products, and model/training-data
extraction; they also require compliance with provider AI terms [S18][S19]. This
study therefore uses documentation as a contract and open-source repositories
under their licenses, not hosted black-box probing.

## 7. Security and bounded-resource assessment

### 7.1 Document trust boundary

**FACT (high):** Historical first-party security evidence demonstrates that
parsing is security-sensitive: `partition_msg(process_attachments=True)` before
0.18.18 allowed malicious attachment filenames to escape the output directory,
with arbitrary overwrite/RCE impact (CVE-2025-64712, CVSS 9.8) [S21]. Release
0.21.0 replaced NLTK with spaCy because the NLTK downloader's unsafe extraction
had an unpatched RCE-class issue [S24]. Current Pandoc conversion uses sandboxing
after an external-file inclusion issue, and 0.24.0 hardened URL fetches against
SSRF [S22-S24]. These are fixed examples, not claims that current versions remain
vulnerable; they establish the required isolation class.

**RECOMMENDATION (high):** Treat every document, nested attachment, embedded
object, hyperlink, table HTML, image, and extracted string as attacker-controlled.
Never execute formulas, macros, links, HTML, or extracted code. Disable attachment
recursion by default; if enabled under explicit policy, bound depth/count/bytes,
discard source filenames for filesystem placement, and give each child an
independent provenance/admission record.

### 7.2 Public bounds and missing bounds

| Boundary | Local open source | Hosted local-file job |
| --- | --- | --- |
| Input files | No documented whole-call count limit for direct functions. | 10 files/job [S25]. |
| Input bytes | No documented default file-byte limit. | 50 MB/file [S25]. |
| Pages | No documented whole-document page cap. | No public page cap found; billing is per logical page [S9][S25]. |
| Concurrency | Caller/runtime-owned; no global safe default contract. | Five running jobs/account; later jobs queue; launches must be at least one second apart [S25]. |
| PDF split | Caller can implement; legacy SDK batches 2–20 pages and caps split concurrency at 15. | Legacy client behavior, not a Pipeline server work cap [S15]. |
| Pixels | Current source default `PDF_RENDER_MAX_PIXELS_PER_PAGE` is 1,000,000,000 at 350 DPI, configurable by environment [S7]. | Internal limit not published. |
| CPU/RAM/time | No document/job cap or kill contract documented. | Job runtime returned; cancellation exists, but server deadline/CPU/RAM ceilings are unpublished [S25]. |
| Output bytes/elements/images | No documented cap; Base64 images and `orig_elements` can amplify output. | No documented output-byte/element cap found. |
| Chunk size | `max_characters` is a hard per-chunk text limit. | Same concept; not a job/output budget. |
| Retry | Caller-owned. | SDK exponential backoff defaults up to one hour; workflow jobs expose failed files [S25]. |

**INFERENCE (high):** A 50 MB compressed Office/PDF/image input is not a safe
memory bound. Rasterization, decompression, Base64 (+ roughly one-third), OCR
tokens, HTML tables, and duplicated `orig_elements` can multiply resident and
output size. The local one-billion-pixel default is a guard, but far above a
reasonable shared-service allowance and says nothing about page count.

**NEGATIVE RESULT (high):** Neither local nor hosted public contracts expose a
complete budget object covering decoded bytes, pixels, pages, nested objects,
elements, OCR tokens, model calls, CPU-seconds, memory, temp disk, output bytes,
and wall deadline. Hosted jobs have cancellation and failed-file diagnostics,
but no documented partial-page manifest or terminal reason such as
`resource_exhausted`, `malformed`, `policy_blocked`, or `cancelled_with_partial`.

**RECOMMENDATION (high):** Curiosity admission must enforce all of those budgets
before and during parsing. Use per-page subprocess deadlines, OS CPU/RSS/temp-
disk quotas, decompression/pixel checks, parser-specific circuit breakers,
bounded logs, and deterministic truncation. Return accepted/rejected pages and
attachments, consumed budget, warnings, fallback path, and one terminal reason.

## 8. Hosted security, privacy, custody, and price

**FACT (high):** Hosted docs claim authentication, RBAC, encrypted transit,
SOC 2 Type II, HIPAA, GDPR, ISO 27001 and other deployment-dependent compliance;
Business offers multi-tenant SaaS, dedicated instance, and customer in-VPC
options [S9][S18]. Certifications are organizational controls, not proof that an
individual extraction is accurate or complete.

**FACT (high):** Current Platform Terms say Transform and Pipelines process
Customer Data transiently, prohibit Restricted Data unless separately authorized,
retain customer ownership, and promise not to train generalized Unstructured or
managed-provider models on Customer Data. The privacy policy nevertheless defines
uploaded documents and outputs as collected Content and uses purpose-based rather
than numeric retention language for personal information; exact enterprise/DPA
terms can supersede it [S18]. The pricing page markets “zero data retention,” but
the operative terms and deployment-specific security practices must control.

**FACT (high):** SaaS subprocessors include AWS, Anthropic, Azure, Google,
OpenAI, Voyage AI/MongoDB, observability and storage providers; the exact set
differs for dedicated and in-VPC deployments [S19]. A hosted VLM request may
therefore cross an additional provider boundary. BYOK makes that AI provider the
customer's vendor; managed AI carries Unstructured's no-training commitment
[S18][S19].

**FACT (high):** Let's Go provides 15,000 Transform pages monthly; PAYG charges
$0.03/page beyond that, capped at $3,000 until one million pages, with additional
usage beyond one million again charged under current terms. Non-page formats are
metered at file size/100 KB; PDF/PPTX/TIFF use pages/slides/images and DOCX uses
page metadata where available [S9][S18]. This billing unit is not a compute or
quality unit: a simple text page and complex VLM page can count alike.

**RECOMMENDATION (high):** Before any hosted evaluation, require exact plan/DPA,
region, deployment, subprocessor/model route, transient-storage/deletion SLA,
backup/log policy, support access, incident terms, and Restricted Data approval.
Use only public/synthetic documents until reviewed. Never let free-page allowance
authorize upload of repository or user data.

## 9. Reliability, errors, and observability

**FACT (high):** Pipeline jobs expose `SCHEDULED`, `IN_PROGRESS`, `COMPLETED`,
`STOPPED`, and `FAILED`, plus creation time, runtime, input file IDs, output-node
files, cancellation, and a failed-files endpoint carrying document and error
[S25]. SDK error classes preserve status, headers, body, and raw response; retry
configuration uses exponential backoff and defaults to a one-hour elapsed ceiling
[S25]. The legacy partition endpoint is synchronous and less suitable for
production [S15].

**Limits:** Job state does not identify each page's parser/model route, warning,
retry attempt, or completeness. A completed output can still include heuristic
misclassification, OCR errors, lost images after chunking, or contextual-
enrichment fallback. Model/routing updates are not exposed as a replay version.

**RECOMMENDATION (high):** Normalize provider transport state separately from
document extraction state. Preserve attempt IDs, provider job/file IDs, retry
decisions, exact request policy, partial outputs, warning ledger, and adapter
version. Never retry an ambiguous create without a caller-generated idempotency
key or duplicate-work guard; the current create-job docs do not publish
idempotency-key semantics.

## 10. Clean-room architectural inference

The following is an interface-level model, not a claim about proprietary hosted
implementation:

```text
admitted bytes + declared type + capability policy + budget
  -> type detection / converter selection
  -> format-native extraction
  -> [PDF/image: embedded text test + rasterization]
  -> [OCR and/or layout detection and table inference]
  -> ordered semantic elements + hierarchy + regions + warnings
  -> optional element-aware chunking
  -> [hosted only: optional VLM/enrichment/context/embedding nodes]
  -> destination serialization + job/error accounting
```

The architecture is useful because it separates semantic extraction from chunk
formation, but public Unstructured contracts conflate several policies inside
`auto`: cost, quality, network/model provider, page routing, and fallback.
Curiosity should decompose those decisions and retain a route trace.

## 11. Fact / inference / recommendation ledger

| ID | Type | Claim | Confidence | Sources | Verdict |
| --- | --- | --- | --- | --- | --- |
| L1 | FACT | Generic partition detects type and dispatches to format-specific functions returning semantic elements. | High | [S2-S3] | **ADOPT** abstraction. |
| L2 | FACT | Open source and hosted support materially different format sets. | High | [S5][S10] | **ADAPT** capability negotiation. |
| L3 | FACT | Local PDF/image paths expose fast, OCR-only, High Res, and Auto with documented fallbacks. | High | [S2][S6] | **ADAPT** explicit route/fallback ledger. |
| L4 | FACT | Current source defaults layout detection to YOLOX although docs still name Detectron2 ONNX. | High | [S2][S7-S8] | **REJECT** strategy-as-model identity. |
| L5 | FACT | Local OCR defaults to Tesseract and has optional Paddle/Google Vision agents. | High | [S7] | **ADAPT** OCR as policy-selected adapter. |
| L6 | FACT | Hosted Auto routes per PDF page among Fast, High Res, and VLM using proprietary logic. | High | [S11-S14] | **REJECT** opaque route for audit use. |
| L7 | FACT | VLM “every page” guidance conflicts with default `allow_fast=true`. | High | [S13] | **DEFER** until route is observable. |
| L8 | FACT | Elements preserve type/text, page/region, hierarchy, table/image/link and source metadata where available. | High | [S3] | **ADOPT** normalized shape. |
| L9 | INFERENCE | Standard element metadata is not a complete reproducible provenance record. | High | [S3][S7] | **ADAPT** with Curiosity envelope. |
| L10 | FACT | Chunking preserves whole semantic elements and can retain compressed original-element lineage. | High | [S4][S16] | **ADOPT** with bounded serialization. |
| L11 | INFERENCE | Generated contextual prefixes must not share source-text evidence semantics, especially when IDs are preserved. | High | [S17] | **REJECT** merged representation. |
| L12 | FACT | Local full-format operation depends on native converters, OCR, rasterization, inference libraries, and model assets. | High | [S5][S7-S8] | **ADAPT** only in sandbox. |
| L13 | FACT | Recent releases fixed critical attachment traversal, unsafe download/extraction, external inclusion, and URL SSRF classes. | High | [S21-S24] | **ADOPT** hostile-parser threat model. |
| L14 | FACT | Hosted local jobs bound files, bytes, launch rate, and concurrent jobs but not all decoded-resource dimensions. | High | [S25] | **ADAPT** lifecycle; add budgets. |
| L15 | FACT | Public repositories are Apache-2.0; hosted behavior and service use are separately governed. | High | [S18-S20] | **ADOPT** explicit license boundary. |
| L16 | FACT | Platform Terms promise no generalized-model training on Customer Data but prohibit Restricted Data absent agreement. | High | [S18] | Hosted sensitive use **DEFERRED**. |
| L17 | RECOMMENDATION | Parser outputs are untrusted observations, not verified facts or execution instructions. | High | security history and repo constitution | **ADOPTED**. |
| L18 | RECOMMENDATION | Curiosity must own admission, route, provenance, resource, fallback, and stop contracts. | High | synthesis | **ADOPTED**. |

## 12. Exact implications for Curiosity

1. **ADOPTED — provider-neutral element ABI.** Represent source-backed `text`,
   `table`, `image`, `formula`, `heading`, `list_item`, `header/footer`, and
   `unknown` elements with stable Curiosity IDs, order, hierarchy, page/region,
   source capture, confidence, and raw provider category.
2. **ADAPTED — capability negotiation.** The request declares needed text,
   layout, table, image, link, hierarchy, OCR, and language capabilities. An
   adapter returns `supported`, `unsupported`, or `degraded`; no silent feature
   promotion.
3. **ADOPTED — two-stage partition/chunk flow.** Persist bounded elements before
   chunking so chunk policy can be tuned without rerunning expensive or
   nondeterministic extraction.
4. **ADAPTED — page-level routing.** A local planner may choose native text,
   OCR, or layout per page, but only within caller-approved providers and budget.
   Emit route and fallback reason for every page.
5. **REJECTED — hosted Auto as authority.** Proprietary optimization cannot
   satisfy provenance, cost prediction, data-boundary, or reproducibility needs
   when route thresholds are hidden.
6. **REJECTED — strategy/model conflation.** Record package version, actual
   parser/converter, OCR/layout/table model ID and digest, and configuration.
7. **ADOPTED — original-element lineage.** Each chunk references original
   element IDs. Store lineage structurally, not only as compressed Base64 nested
   output, and cap lineage/output bytes.
8. **REJECTED — generated context as evidence.** Keep generated descriptions,
   table summaries, OCR correction, and contextual prefixes in separate derived
   records with model/prompt provenance and explicit non-source status.
9. **ADOPTED — hostile parser sandbox.** No network, no ambient credentials,
   read-only root, isolated temp directory, unprivileged UID, seccomp/container
   boundary where available, pinned artifacts, and killable per-document/page
   workers.
10. **ADOPTED — multidimensional budgets.** Enforce compressed and decoded
    bytes, pages, pixels/page and total pixels, nested attachment count/depth,
    elements, OCR/model calls, CPU, RSS, temp disk, output bytes, and deadline.
11. **ADOPTED — partial-result ledger.** Report every page/attachment as
    processed, skipped, failed, truncated, or policy-blocked, with consumed
    budget and terminal reason. Never present partial extraction as complete.
12. **ADAPTED — deterministic IDs.** Hash source capture digest + parser profile
    + page/region + normalized element content; filename is metadata, not identity.
13. **ADOPTED — untrusted output.** Escape table HTML; block active URLs;
    validate coordinates, types, nesting, UTF-8, and size; never execute extracted
    formulas, macros, code, or instructions.
14. **DEFERRED — Unstructured adapter evaluation.** Only a separately approved
    corpus test can measure recall, reading order, table fidelity, latency, peak
    RSS, output amplification, and determinism. No present authority to install,
    call, or integrate either surface.

## 13. Unknowns and checks required before any revisit

| Unknown | Why it matters | Authorized future check |
| --- | --- | --- |
| Hosted per-page route/model/version trace | Replay, privacy, and quality attribution. | Ask vendor for written output/telemetry contract; do not infer from output alone. |
| Fine-tuned OCR/layout/table model identity and update policy | Accuracy and drift. | Vendor model card, artifact/version policy, benchmark corpus details. |
| Hosted page, decoded-byte, pixel, output, runtime, and retention ceilings | Admission and worst-case cost. | Written plan/SLA/security-practices response. |
| Whether cancel stops provider VLM work and billing immediately | Safe deadline handling. | Vendor answer before any controlled job test. |
| Job-create idempotency and duplicate billing semantics | Retry correctness. | Contract/support clarification. |
| Completeness of failed-file reports for partial page/enrichment failures | Avoid false completeness. | Synthetic malformed corpus only after separate authorization. |
| Exact SaaS transient data/log/backup deletion timing by plan and subprocessor | Sensitive-data custody. | DPA, Security Practices, architecture/data-flow review. |
| Quality across multilingual scans, handwriting, columns, tables, formulae, and legacy formats | Adapter fitness. | Predeclared public corpus, human ground truth, pinned versions. |
| Local peak CPU/RSS/temp/output amplification by format | Sandbox sizing. | Offline benchmark in disposable worker; no hostile third-party targets. |
| Model/dependency license compatibility for selected artifacts | Distribution obligations. | Generate SBOM and legal review for the exact lock/artifact set. |

## 14. Bounded curiosity pass

Scoring is 1 (low) to 5 (high); cost is 1 (cheap) to 5 (expensive). Only the
highest-value threads inside the declared clean-room frame were pursued.

| Thread | Rel. | Value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Reconcile documented Detectron2 High Res with current default model | 5 | 5 | 4 | 2 | **Pursued:** pinned source shows YOLOX default and retained doc contradiction [S2][S7-S8]. |
| Verify whether hosted VLM truly processes every page | 5 | 5 | 4 | 1 | **Pursued:** `allow_fast=true` contradicts prose; retained as contract ambiguity [S13]. |
| Find concrete hosted admission bounds | 5 | 5 | 3 | 1 | **Pursued:** found 10 files, 50 MB/file, 1-second launch spacing, five concurrent jobs; broader bounds remain unknown [S25]. |
| Test whether “local” can initiate network access | 5 | 5 | 4 | 2 | **Pursued:** URL inputs, optional Google Vision, and lazy Hugging Face artifacts establish network-capable paths [S2][S7][S22]. |
| Establish parser threat class from disclosed history | 5 | 5 | 4 | 2 | **Pursued:** attachment traversal, downloader, include, and SSRF fixes justify sandbox recommendation [S21-S24]. |
| Reverse-engineer proprietary Auto thresholds/prompts | 2 | 2 | 5 | 5 | **CURIOSITY_NO_GO:** prohibited by terms, unavailable in public source, and unnecessary for adapter verdict. |
| Run free or paid hosted files to fingerprint models | 4 | 3 | 4 | 5 | **CURIOSITY_NO_GO:** caller forbade tests; would add custody and terms risk without a predeclared corpus. |
| Download and inspect model weights/training data | 2 | 2 | 5 | 5 | **CURIOSITY_NO_GO:** outside interface analysis and model-extraction boundary. |
| Execute malicious files/CVE reproductions | 3 | 3 | 3 | 5 | **CURIOSITY_NO_GO:** advisories establish the threat; exploit execution is unnecessary and not authorized. |
| Audit every transitive package/model license | 4 | 5 | 2 | 4 | **DEFERRED:** must be done against the exact future lock/artifact set, not a mutable optional superset. |
| Compare extraction accuracy against competitors | 3 | 4 | 2 | 5 | **CURIOSITY_NO_GO:** outside the single-product architecture frame and no test authority. |

**Stop decision:** Coverage reached every requested category. The best
contradictions (model identity and VLM route) and highest-value bounds/security
threads were pursued to public-source saturation. Remaining material gaps
require vendor answers, exact deployment terms, or separately authorized corpus
testing, so research stopped on coverage and authority exhaustion.

## Sources

All sources were accessed 2026-08-17. Documentation and model catalogs are
mutable; repository commit IDs are included where source-level behavior matters.

* **[S1]** Unstructured, [Open-source overview and limits](https://docs.unstructured.io/open-source/introduction/overview.md).
* **[S2]** Unstructured, [Open-source partitioning](https://docs.unstructured.io/open-source/core-functionality/partitioning).
* **[S3]** Unstructured, [Open-source document elements and metadata](https://docs.unstructured.io/open-source/concepts/document-elements).
* **[S4]** Unstructured, [Open-source chunking](https://docs.unstructured.io/open-source/core-functionality/chunking).
* **[S5]** Unstructured, [Open-source supported file types](https://docs.unstructured.io/open-source/introduction/supported-file-types.md) and [full installation](https://docs.unstructured.io/open-source/installation/full-installation).
* **[S6]** Unstructured, [Open-source partitioning strategies](https://docs.unstructured.io/open-source/concepts/partitioning-strategies).
* **[S7]** Unstructured, public `unstructured` repository snapshot commit [`104b585`](https://github.com/Unstructured-IO/unstructured/tree/104b585d4e84ad987b121e86aecf80315e8a12a6): `pyproject.toml`, partition metadata/ID, OCR-agent, PDF config, and safe-HTTP modules.
* **[S8]** Unstructured, public `unstructured-inference` repository snapshot commit [`fc64017`](https://github.com/Unstructured-IO/unstructured-inference/tree/fc64017eafaccad7e5567c0f8e357867039dacf7): README; model base, YOLOX, Detectron2 ONNX, and table modules.
* **[S9]** Unstructured, [API overview and hosted/open-source comparison](https://docs.unstructured.io/api-reference/overview) and [pricing](https://unstructured.io/pricing).
* **[S10]** Unstructured, [API supported file types](https://docs.unstructured.io/api-reference/supported-file-types.md).
* **[S11]** Unstructured, [Hosted partitioning concepts](https://docs.unstructured.io/concepts/partitioning).
* **[S12]** Unstructured, [High Res workflow node](https://docs.unstructured.io/api-reference/workflow/nodes/transform/partitioner-high-res.md).
* **[S13]** Unstructured, [Auto](https://docs.unstructured.io/api-reference/workflow/nodes/transform/partitioner-auto.md) and [VLM](https://docs.unstructured.io/api-reference/workflow/nodes/transform/partitioner-vlm.md) workflow nodes.
* **[S14]** Unstructured, [Available hosted models](https://docs.unstructured.io/api-reference/workflow/models.md).
* **[S15]** Unstructured, [Legacy Partition Endpoint overview](https://docs.unstructured.io/api-reference/legacy-api/partition/overview), [parameters](https://docs.unstructured.io/api-reference/legacy-api/partition/api-parameters), and [large-file splitting](https://docs.unstructured.io/api-reference/legacy-api/partition/speed-up-large-files-batches.md).
* **[S16]** Unstructured, [Hosted chunking concepts](https://docs.unstructured.io/concepts/chunking.md) and [similarity node](https://docs.unstructured.io/api-reference/workflow/nodes/transform/chunker-chunk-by-similarity.md).
* **[S17]** Unstructured, [Contextual chunking node](https://docs.unstructured.io/api-reference/workflow/nodes/enhancement/chunker-chunk-by-contextual.md).
* **[S18]** Unstructured, [Platform Terms of Service](https://unstructured.io/platform-terms-of-service) (updated 2026-07-09), [Acceptable Use Policy](https://unstructured.io/acceptable-use-policy), and [Privacy Policy](https://unstructured.io/privacy-policy) (updated 2026-07-08).
* **[S19]** Unstructured, [Sub-Processor List](https://unstructured.io/sub-processor-list) (updated 2026-07-09).
* **[S20]** Apache-2.0 license files in `unstructured` [`104b585`](https://github.com/Unstructured-IO/unstructured/blob/104b585d4e84ad987b121e86aecf80315e8a12a6/LICENSE.md), `unstructured-inference` [`fc64017`](https://github.com/Unstructured-IO/unstructured-inference/blob/fc64017eafaccad7e5567c0f8e357867039dacf7/LICENSE), and `unstructured-api` [`0830d20`](https://github.com/Unstructured-IO/unstructured-api/blob/0830d20252687ed1c01a5c52e3a6ca27f6980984/LICENSE.md).
* **[S21]** Unstructured/GitHub, [GHSA-gm8q-m8mv-jj5m / CVE-2025-64712](https://github.com/Unstructured-IO/unstructured/security/advisories/GHSA-gm8q-m8mv-jj5m), patched in 0.18.18.
* **[S22]** Unstructured, [release 0.24.0](https://github.com/Unstructured-IO/unstructured/releases/tag/0.24.0) and pinned current `safe_http.py` in [S7].
* **[S23]** Unstructured, [Pandoc sandbox fix commit `b10379c`](https://github.com/Unstructured-IO/unstructured/commit/b10379c14cc83382b81174b777bb411b25ad16a9).
* **[S24]** Unstructured, [release 0.21.0](https://github.com/Unstructured-IO/unstructured/releases/tag/0.21.0), replacing NLTK with spaCy for CVE-2025-14009 remediation.
* **[S25]** Unstructured, [Transform quickstart limits](https://docs.unstructured.io/api-reference/quickstart/transform.md), [jobs](https://docs.unstructured.io/api-reference/workflow/jobs.md), [cancel](https://docs.unstructured.io/api-reference/api/job/cancel-job.md), [failed files](https://docs.unstructured.io/api-reference/api/job/get-job-failed-files.md), [retries](https://docs.unstructured.io/api-reference/workflow/retries.md), and [errors](https://docs.unstructured.io/api-reference/workflow/errors.md).
