# Apache Tika for untrusted document extraction

**Research date:** 2026-08-17  
**Product baseline:** Apache Tika 3.3.2, the latest stable 3.x release on the
access date; 4.0.0-beta-1 is noted only where the project's current security
model distinguishes 4.x [S1].  
**Decision:** what Curiosity should learn from, and whether it should depend on,
Apache Tika when extracting untrusted documents.  
**Status:** clean-room research record; no Tika source or implementation was
copied into this repository.

## Executive verdict

**ADAPTED, not adopted as an in-process trust boundary (high confidence).**
Tika is an unusually broad and useful extraction reference: one detector/parser
model covers more than a thousand detectable types, streams structured XHTML,
normalizes multi-valued metadata, recursively exposes embedded resources, and
has explicit hooks for OCR, parser provenance, truncation, and parse warnings
[S1-S8]. Its mature failure history is even more valuable than its happy path:
Apache explicitly says parsing is dangerous, Tika is **not a security boundary**,
and a hostile file may crash, hang, or take over the parsing process [S9].

For Curiosity:

- **ADOPT the architectural lessons:** detector and parser registries are
  separate; declared type and file name are hints; structured content and
  metadata are separate outputs; embedded resources form a bounded tree;
  every output carries parser/config/version lineage and truncation/failure
  state.
- **ADAPT Tika only as a replaceable, isolated extraction worker or benchmark
  oracle:** fixed allowlisted parser profile, bytes supplied by the caller,
  no ambient network, no fetcher/emitter endpoints, no per-request
  reconfiguration, hard process/OS limits, and a typed provider-neutral result.
- **REJECT direct in-process parsing of hostile documents, the all-available
  default registry, public `tika-server`, caller-controlled fetch/emit or parser
  settings, and attachment names as filesystem paths.**
- **DEFER a runtime dependency decision** until license/SBOM review and an
  adversarial benchmark compare a pinned Tika distribution against an owned
  minimal extractor. Apache-2.0 permits use subject to its conditions, but Tika
  distributions contain many third-party components and notices; “Tika is
  Apache-2.0” is not a complete dependency conclusion [S16-S17].

## 1. Frame, bounded questions, and method

### 1.1 Questions

1. How do Tika's detector, parser registry, and dispatch path work?
2. What are the content, metadata, embedded-resource, and OCR output models?
3. Which controls bound time, memory, output, recursion, compressed expansion,
   child processes, and server callers—and which important bounds are absent?
4. What does Tika's malformed-document and vulnerability history imply for a
   hostile corpus?
5. Which provenance and license lessons transfer clean-room to Curiosity?

**Coverage boundary:** public official Apache pages, 3.3.2 Javadocs, release
notes, official wiki pages, and the official 3.3.2 repository tag. No service
was run, no corpus was parsed, no vulnerability was reproduced, and no source
was copied. Official sources were accessed 2026-08-17. The wiki's server and
pipes pages were last updated in 2024 and sometimes describe multiple Tika
generations; current 3.3.2 Javadocs, release notes, security model, and tagged
source take precedence where they differ.

Labels:

- **FACT** — directly stated by an official source or visible in official API
  documentation/tagged configuration source.
- **INFERENCE** — architectural or security conclusion from cited facts; not
  measured here.
- **RECOMMENDATION** — proposed Curiosity choice.
- Confidence is **high**, **medium**, or **low**.

## 2. Architecture: detection, registry, and dispatch

### 2.1 Detection is evidence fusion, not truth

**FACT (high):** a Tika `Detector` receives an input stream plus metadata and
returns its best media-type guess. The default MIME detector combines, in
sequence, magic bytes (including XML root inspection), resource-name patterns,
and a supplied content type. A user override can supersede automatic detection.
The documentation explicitly warns that file-name detection is fast but less
reliable because files can be renamed [S2].

**FACT (high):** container formats need a second, more expensive detection lane.
ZIP and OLE2 magic identify only the container; format-specific container
detectors inspect its contents. `DefaultDetector` discovers detector providers
through the service-provider mechanism. Container-aware detection requires
parser dependencies and a `TikaInputStream`; with an ordinary stream, only the
default MIME magic path runs. Some container detection may read the whole file
and spool it [S2].

**INFERENCE (high):** type is a versioned claim with evidence, not an admission
control decision. A filename, HTTP `Content-Type`, magic match, container
inspection, and eventual parser may disagree. Polyglots and parser
differentials make a single “MIME type” unsuitable as a security verdict; the
Apache security model says detection and extraction should not be trusted
without verification in high-risk applications [S9].

### 2.2 Parser registry and selection

**FACT (high):** `DefaultParser` is a composite of parser implementations found
through Java's service-provider mechanism. Static service loading is the
default; providers are described in `META-INF/services`. Tika config can exclude
parsers, override particular media types, or omit `DefaultParser` and enumerate
an allowlist. Service initialization failures can be ignored (the default),
warned, or thrown [S3-S4].

**FACT (high):** `AutoDetectParser` combines a detector with a composite parser
registry. It detects the stream's type, writes/uses that metadata, and delegates
to the matching component parser. The documented 3.3.2 configuration path says
only one parser runs against a document by default; alternative/fallback parser
machinery exists elsewhere but is not the default behavior [S3-S5].

**FACT (high):** parser coverage is classpath- and configuration-dependent.
`tika-core` has interfaces and detection but no parser implementations;
`tika-parsers-standard-package` supplies common parsers and substantial
transitive dependencies, while SQLite, scientific, ML, and other families are
separate/optional [S6]. Thus “Tika supports X” does not prove that a particular
deployment can parse X.

**RECOMMENDATION (high):** Curiosity must pin an explicit capability manifest:
Tika version, Java/runtime image, parser and detector allowlists, dependency
versions, external tools, MIME registry hash, and config hash. Start-up must
fail closed on provider load errors. Do not expose classpath auto-discovery as
the production contract.

### 2.3 Parser interface and content model

**FACT (high):** Tika's parser interface consumes an `InputStream`, emits
structured XHTML as SAX events to a `ContentHandler`, reads/writes a `Metadata`
object, and accepts contextual strategy/configuration via `ParseContext`.
Streaming avoids requiring the entire document or output in memory, but
random-access formats may be spooled to temporary files. The caller owns and
must close the input stream [S5].

**INFERENCE (high):** a streaming interface is necessary but not sufficient for
bounded extraction. A parser or dependency may still allocate from hostile
length fields, expand compressed content, recurse, write temp files, invoke an
external process, or never return. Tika's security record confirms each class
of risk [S9-S10].

## 3. Formats, metadata, and embedded resources

### 3.1 Coverage is broad but nonuniform

**FACT (high):** Apache describes detection and text/metadata extraction from
over a thousand file types [S1]. Its supported-format inventory spans HTML/XML,
legacy and OOXML Office, ODF/iWork/WordPerfect, PDF/EPUB/RTF, archives and
compressors, text/CSV, mail and PST/MSG/TNEF, images/audio/video, source and Java
artifacts, CAD/fonts, scientific formats, executables, crypto containers,
databases, WARC/WACZ, NLP, and image/video recognition [S7]. Detection supports
more formats than extraction.

**FACT (high):** much of Tika is adapters over specialist libraries—PDFBox for
PDF, POI for Office, Commons Compress for package/compression formats, jsoup for
HTML, ICU-derived logic for character encoding, and others. Package parsers
unpack entries and hand streams to a second parse stage [S5, S7].

**INFERENCE (high):** breadth multiplies dependency and native/external-tool
risk. A “standard” install is neither a uniform parser implementation nor a
single attack surface. Curiosity should partition format families into
separately deployable risk tiers rather than copy Tika's maximal registry.

### 3.2 Metadata is useful evidence but not authoritative provenance

**FACT (high):** `Metadata` is a multi-valued container. Tika defines normalized
core properties for creator/title/dates/language/rights and operational fields
including content type, parser chain (`TIKA_PARSED_BY` and full set), parse time,
embedded depth/path/ID, exceptions, warnings, write-limit state, truncation,
detected encoding, encryption/signature hints, and extracted content [S8]. Tika
distinguishes a content-type hint—which may be faulty—from user and parser
overrides [S8].

**FACT (high):** Tika's own metadata docs distinguish metadata from the document
from `X-TIKA`-style parsing-process metadata. However, the generic container
does not itself provide an immutable input capture ID, source-byte digest,
extractor distribution digest, config digest, or stable metadata schema
version. Digests can be configured, but they are not a complete chain of
custody [S6, S8].

**RECOMMENDATION (high):** Curiosity should retain three namespaces:

1. **observed transport/capture** — fetched URL, capture ID/time, raw-byte hash,
   declared media type and filename;
2. **document claims** — author, title, dates, language, embedded names, links;
3. **extraction observations** — detector evidence, chosen parser, worker image,
   tool/config/schema versions, output hash, duration, warnings, exceptions,
   truncation and limit reasons.

Every field from document bytes remains untrusted. Normalization must preserve
the raw key/value and parser source so canonical mappings do not erase
conflicts.

### 3.3 Embedded resources are a graph-shaped amplification boundary

**FACT (high):** `EmbeddedDocumentExtractor` gives parsers a policy hook to
decide whether an embedded stream should be parsed and to delegate it [S11].
`RecursiveParserWrapper` returns one metadata object for the outer container
and one per embedded resource, records embedded paths, and can retain each
resource's extracted content. It catches and records many embedded exceptions
by default, but its Javadocs warn that it holds all results in memory and is not
appropriate when content cannot fit in memory [S12].

**FACT (high):** the server's `/rmeta` endpoint returns parent and recursively
embedded metadata/content. It supports skipping embedded files,
`maxEmbeddedResources`, and a write limit. In modern behavior the write limit
applies across the full document including embedded files; metadata filtering
reduces returned/storage fields but does not necessarily shortcut parser work
[S13]. Tika also records a stable counter-based embedded ID path. Its docs
explicitly warn that document-provided embedded names/paths can collide,
contain illegal characters, or cause “other mayhem” and must not create output
directory structures [S8].

**RECOMMENDATION (high):** model attachments as child records with opaque IDs,
never as trusted filesystem paths. Enforce all of: total children, depth,
per-child compressed and expanded bytes, aggregate expanded bytes, aggregate
text/metadata bytes, duplicate-content count, per-family quotas, and wall/CPU
budget. Limit rejection must be a normal partial result with exact reason and
location, not success and not an untyped parser error.

## 4. OCR and other external-process hooks

**FACT (high):** Tika can chain `TesseractOCRParser` for images and PDF
workflows. It is an external-process parser and requires Tesseract installed on
the system path or at a configured executable location. Configuration includes
language, page segmentation, text or hOCR output, optional ImageMagick
preprocessing/rotation, minimum and maximum file sizes, and skip/inline controls
[S7, S14].

**FACT (high):** Tesseract OCR has a configurable process timeout (120 seconds
by default in `TesseractOCRConfig`), and its parser-level timeout can be
overridden by a task timeout in `ParseContext`. The config object is not thread
safe and retains fields previously set on an update object, so the Javadocs
recommend a fresh update object per parse [S14].

**FACT (high):** OCR is not the only command boundary. Tika supports external
parsers/tools and some optional recognition/NLP services. The 3.3.2 standard
format inventory includes an `ExternalParser` for some video types, and Tika's
2.8 release restored discovery of a composite external parser that invokes
ExifTool and FFmpeg when installed unless excluded [S7, S15].

**INFERENCE (high):** executable discovery through `PATH`, mutable per-parse
configuration, and optional remote services violate a deterministic extraction
worker unless deliberately removed. OCR also creates an independent expansion
path: rendered pages, pixels, preprocessing temp files, process output, and
language models need limits separate from input bytes.

**RECOMMENDATION (high):** put OCR in an optional second worker tier, disabled
unless selected by an explicit policy. Pin executable and model digests; clear
`PATH`; prohibit shell interpretation; disable ImageMagick and arbitrary
Tesseract options unless independently approved; cap pages, pixels, render
DPI, file sizes, temp space, process count, output, CPU and wall time; and
record whether text is native, OCR, or mixed. Never let document content choose
an executable, path, endpoint, or command option.

## 5. Isolation and bounded behavior

### 5.1 What Tika provides

| Boundary | Official behavior | Security interpretation |
| --- | --- | --- |
| Output text | `WriteOutContentHandler` supports a character limit; its no-argument in-memory buffer is bounded at 100k characters [S18]. | Useful output cap; not an input, CPU, heap, metadata, temp, or child-count cap. |
| Compressed/XML expansion | `SecureContentHandler` compares output characters with input bytes after a threshold and limits XML and package-entry nesting. `AutoDetectParserConfig` exposes spool threshold, output threshold, maximum compression ratio, XML depth, and package-entry depth [S19-S20]. | Defense in depth against some bombs; it observes handler output and cannot contain every parser allocation or native flaw. |
| Embedded documents | `/rmeta` can skip children and bound maximum embedded resources and aggregate write output [S13]. | Must be fixed by trusted policy, not caller-controlled, and supplemented with byte/time/metadata limits. |
| OCR | Min/max OCR file size and external-process timeout [S14]. | Does not alone cap pages, pixels, temp bytes, whole-worker heap, or all subprocesses. |
| `ForkParser` | Runs parsers in child JVMs, supports a process pool, parse timeout, JVM command/heap, and restart after a maximum number of files [S21]. | Correct containment direction; JVM fork is not by itself an OS sandbox or egress/filesystem policy. |
| Tika server 3.x | Parsing forks by default. On OOM, timeout, crash, or file-count retirement the child restarts; `--noFork` opts into more dangerous behavior [S9, S13, S15]. | A catastrophic request can terminate concurrent requests in the same child and cause brief unavailability. |
| Server defaults in 3.3.2 | Tagged config sets a 300s task timeout, 30s minimum caller timeout, 10s pulse, 120s fork-start timeout, and child retirement after 100,000 files; fork JVM arguments are operator-configurable [S22]. | Defaults are availability-oriented, not an adequate hostile-file policy; 100,000 files permits long-lived state and a five-minute task is excessive for many indexing paths. |
| Server caller controls | Apache says server/grpc belong only on trusted, access-controlled networks; per-request config and fetch/emit can defeat limits or gain server-level read/write authority. 3.3.2 refuses to start with `/pipes`, `/async`, or `/status` selected unless `enableUnsecureFeatures=true` [S9, S15, S22]. | Do not treat the opt-in flag as authentication or a sandbox. Do not expose these endpoints in Curiosity. |

### 5.2 What process forking does and does not solve

**FACT (high):** Apache's robustness guidance says high-volume untrusted files
will eventually encounter infinite loops or surprising allocations and strongly
recommends not running Tika in the same JVM as an indexer, search system, or
other critical code. It lists ForkParser, batch mode, forked server, and pipes as
process-isolation options [S10]. Apache's current security model goes further:
assume a hostile file can take over the parsing process, and apply sandboxing,
network isolation, resource limits, and least privilege [S9].

**INFERENCE (high):** a forked JVM protects the caller's address space and makes
timeout/OOM recovery possible, but a compromised worker retains the worker's OS
user rights, mount visibility, network reachability, credentials, process
creation ability, and kernel attack surface. Tika server's parent/child restart
model also has a failure domain larger than one request when the child handles
concurrency [S13].

**RECOMMENDATION (high):** Curiosity's minimum hostile-document envelope is one
job in a disposable worker with:

- read-only parser/runtime image and no host source tree, home directory,
  credentials, sockets, or shared mutable cache;
- bytes streamed from controlled object storage or stdin—not a URL/path chosen
  by the document or remote caller;
- deny-by-default egress, loopback, DNS, cloud metadata, and IPC;
- non-root UID, dropped capabilities, no privilege escalation, syscall/process
  policy, CPU/memory/PID/file-descriptor/file-size/temp-disk limits, and a hard
  external kill deadline;
- a fresh job directory and deterministic cleanup; worker retirement after one
  document for the high-risk tier;
- bounded typed output over a narrow channel; no active HTML, object
  deserialization, stack trace, or arbitrary metadata key/value size;
- quarantine and circuit breakers by byte hash, parser family, tenant, and
  repeated catastrophic signature.

### 5.3 Material missing or unclear bounds

**UNKNOWN (high relevance):** the inspected official 3.3.2 sources do not
establish one universal, finite default for HTTP request bytes, raw input bytes,
aggregate decompressed bytes, metadata key count/value bytes, embedded bytes,
PDF pages, rendered pixels, temp-disk bytes, subprocess count, or per-document
CPU. Individual parsers have settings (for example PDF memory controls), and
4.0.0-beta-1 added a PDF `maxPages`, but this is not proof of a uniform 3.3.2
envelope [S1, S15].

**RECOMMENDATION (high):** enforce these limits outside Tika before and during
the job. Treat parser-local controls as additional defenses, never the primary
resource boundary.

## 6. Malformed documents and security history

**FACT (high):** Apache's security page is explicitly incomplete, yet records a
long cross-format history [S23]. Representative failure classes include:

- **XXE/local or network access:** CVE-2016-4434 across parsers,
  CVE-2018-11761 entity expansion, and CVE-2025-54988 in PDF XFA parsing
  (affected through 3.2.1).
- **Command/host authority:** CVE-2018-1335 command execution in Tika server,
  CVE-2015-3271 remote host-file access, and CVE-2020-9489 including a
  `System.exit` path.
- **OOM/resource exhaustion:** crafted ZIP, PDF, PSD, BPG, Office/OLE and tar
  inputs, including CVE-2019-10088 and CVE-2023-42503.
- **Infinite loops/hangs:** MP3, SQLite, PSD, CHM, package and PDF dependency
  paths, among others.
- **Recursion/stack and algorithmic complexity:** recursive compressed/package
  stack overflow (CVE-2019-10094) and regex DoS in the standards-extracting
  handler (CVE-2022-30216/30973/33879).
- **Dependency/supply-chain exposure:** Log4j remote-code-execution advisories
  and recurring fixes in PDFBox, Commons Compress, POI, SQLite and other
  libraries.

**FACT (high):** recent releases continue to change the attack surface: 3.3.2
updated dependencies, tightened unsafe endpoint selection, and made SAX-based
OOXML parsers the default; 3.3.0 improved ZIP parsing and added per-file pipes
timeouts; 3.2.3 fixed XFA handling with Woodstox present after the XFA XXE line
was fixed in 3.2.2 [S1, S15, S23].

**INFERENCE (high):** malformed-document security is not a finite validation
problem. The adapter graph changes with classpath, optional native binaries,
parser mode, and dependency versions. Successful parsing is not proof that
content is benign; failed or truncated parsing is still useful evidence if its
limits and provenance are explicit.

**RECOMMENDATION (high):** maintain a format/failure matrix and regression
corpus containing bombs, deep nesting, huge declared lengths, malformed
containers, polyglots, encrypted files, bad encodings, recursive attachments,
PDF JavaScript/actions/XFA, macros, and historic Tika CVE triggers where legal
fixtures are available. Test timeout kill, output truncation, cleanup, retry
suppression, and sibling-job isolation—not only parser exceptions.

## 7. Provenance, license, and clean-room lessons

### 7.1 Provenance contract

**RECOMMENDATION (high):** a Curiosity `ExtractionResult` should preserve:

- capture/document ID, raw-byte SHA-256, input byte count, source/capture time;
- declared name/type and every detector observation, selected type, confidence
  class (not fabricated numeric confidence), and disagreement flags;
- worker image and SBOM digest, Tika/tool/dependency/config/schema versions,
  parser chain/full set, external-tool/model digests;
- one parent record and opaque child IDs with depth, relationship, safe display
  name, raw embedded name/path, raw/expanded bytes and content hash;
- content representation (structured XHTML/text), native/OCR/mixed origin,
  language/encoding observations, and bounded metadata preserving multiplicity;
- start/end/duration plus CPU/peak memory/temp/output counters where available;
- complete/partial/rejected status and typed reason: unsupported, encrypted,
  malformed, timeout, OOM, crash, output/child/depth/byte/pixel/page limit,
  sandbox violation, or policy exclusion;
- content and result hashes so downstream passages and citations bind to this
  exact extraction.

No parser output should overwrite immutable capture metadata. Search indexing
must consume only a validated, bounded projection and retain the extraction
record for reproducibility.

### 7.2 License and clean-room boundary

**FACT (high):** the Tika 3.3.2 repository is licensed under Apache License 2.0,
whose redistribution conditions include providing the license, marking changed
files, retaining relevant notices, and reproducing NOTICE attribution where
applicable. It grants copyright and contributor patent licenses but not
trademark permission beyond customary attribution [S16].

**FACT (high):** Tika's top-level license and notice enumerate separately
licensed or attributed subcomponents, including MIME and charset data, PRONOM
adaptations, UnRAR restrictions, NetCDF/UCAR material, IPTC descriptions, and
multiple dependencies. Optional parser packages and external executables add
their own licenses. Exact obligations therefore depend on the selected release
artifact and transitive/runtime set [S16-S17].

**RECOMMENDATION (high):** for a strict owned-core Curiosity implementation:

- learn from public behavior, interfaces, failure taxonomies, and published
  docs; independently author provider-neutral contracts and adversarial tests;
- do not copy or mechanically translate Tika source, MIME tables, fixtures,
  documentation, or parser-specific constants into owned code;
- if Tika is used, treat it as an attributed third-party worker/adapter, retain
  LICENSE/NOTICE and a release-specific SBOM, and do not label it project-owned;
- record research-to-spec transfer in `provenance/` before implementation, with
  independent implementers for any strict clean-room component;
- perform artifact-by-artifact legal/security review, including optional
  codecs, OCR language data, native libraries, model/data licenses, and patent
  considerations. This report is not legal advice.

## 8. Curiosity-specific decision ledger

| Capability/lesson | Verdict | Curiosity treatment |
| --- | --- | --- |
| Detector evidence + parser dispatch separation | **ADOPTED** | Neutral `DetectionObservation[]` followed by policy-selected extractor; never trust one type string. |
| Service-provider auto-discovery | **REJECTED** in production | Pin an allowlist and capability manifest; fail closed on load errors. |
| Streaming structured content | **ADAPTED** | Bounded structured events/passes, with deterministic text projection and output hashes. |
| Multi-valued normalized metadata | **ADAPTED** | Preserve raw values/source namespace and separate document claims from extraction observations. |
| Recursive embedded-resource model | **ADAPTED** | Opaque child IDs, stable relationship graph, aggregate budgets, partial-result semantics. |
| Attachment names as output paths | **REJECTED** | Display-only untrusted strings; never filesystem/object keys. |
| OCR/external-process hooks | **DEFERRED, separate tier** | Explicit policy, fixed binaries/models, stronger page/pixel/process/temp bounds. |
| In-process Tika library | **REJECTED** for hostile bytes | It is not a security boundary; keep critical index/search code outside the parser JVM. |
| ForkParser/default forked server | **ADAPTED** | Disposable OS-sandboxed workers; do not equate JVM fork with containment. |
| Public/general-purpose Tika server | **REJECTED** | No public listener, fetchers, emitters, status, runtime reconfiguration, URL/file access, or caller timeout control. |
| Tika as benchmark oracle | **ADOPTED conditionally** | Authorized fixtures only; compare extraction and failure behavior, retain version/config, do not copy outputs as implementation assets. |
| Tika runtime dependency | **DEFERRED** | Decide after adversarial quality/cost tests, SBOM/license review, patch-SLO and operational ownership. |

## 9. Unknowns and verification checks

### 9.1 Unknowns

1. **Exact production profile:** no Curiosity format corpus, quality target,
   latency budget, or hostile-file threat model was supplied.
2. **Uniform defaults:** no verified universal 3.3.2 caps were found for all
   input, expansion, metadata, child bytes, temp disk, pages/pixels, CPU, or
   subprocesses.
3. **Artifact closure:** transitive/native/model licenses and vulnerabilities
   were not resolved for a proposed parser allowlist because none exists yet.
4. **Quality:** no extraction fidelity, OCR quality, metadata accuracy,
   determinism, throughput, or memory benchmark was run.
5. **Isolation strength:** no container/runtime/kernel policy was selected or
   tested, and Java process isolation alone is insufficient.
6. **4.x migration:** 4.0.0-beta-1 has a new sandbox direction and PDF page cap,
   but beta behavior and compatibility were not evaluated [S1, S9].

### 9.2 Required checks before any adoption

- Pin a release and obtain/verify the ASF signature and hashes; generate SBOM
  and scan exact jars, native tools, OCR data and image.
- Enumerate loaded parsers/detectors at startup and diff against the allowlist;
  reject unexpected providers or external command discovery.
- Run authorized benign, malformed, historic-regression, bomb, recursive,
  encrypted, macro/action/XFA, and polyglot fixtures per format family.
- Verify every external limit from outside the worker: input, wall/CPU, heap,
  PIDs, FDs, temp/file bytes, children/depth/expanded bytes, output/metadata,
  pages/pixels, and concurrency.
- Prove no egress/private-network/credential access, no attachment path escape,
  no persistent cross-job state, deterministic cleanup, and caller survival
  after OOM/crash/hang.
- Verify partial-result/truncation/failure provenance reaches the index and that
  search never presents truncated extraction as complete.
- Compare against an owned baseline on held-out quality, catastrophic failure
  rate, p95/p99 resource use, and operational patch burden.

## 10. Bounded curiosity pass

After the first synthesis, remaining in-frame gaps were scored 0–3 on
**relevance / decision value / novelty / cost** (lower cost is better).

| Thread | Score | Action/result |
| --- | --- | --- |
| Confirm current stable release and post-2024 security posture | 3/3/2/1 | **Pursued.** Homepage, 3.3.2 changes, security model, and tagged server config established latest stable, explicit “not a security boundary,” tightened unsafe endpoints, and concrete server defaults [S1, S9, S15, S22]. |
| Find a universal input/decompression/temp/page/resource envelope | 3/3/2/2 | **Pursued to saturation; negative result retained.** Found output, compression-ratio, depth, child-count, timeout, OCR-file and process controls, but no one finite universal 3.3.2 envelope. Recorded as unknown rather than inferring safety. |
| Resolve every parser/transitive license | 2/3/1/3 | **CURIOSITY_NO_GO:** no proposed artifact/allowlist exists; full closure would be costly and would not change the staged verdict. Required at dependency gate. |
| Benchmark Tika against alternatives | 3/3/3/3 | **CURIOSITY_NO_GO:** caller authorized research, not execution; no corpus, thresholds, or runtime sandbox were supplied. Deferred as an explicit adoption check. |
| Reverse engineer unpublished parser algorithms | 1/1/1/3 | **CURIOSITY_NO_GO:** unnecessary to decide trust boundaries and creates avoidable clean-room contamination. Public behavior and official contracts were sufficient. |

**Stop reason:** requested categories are covered; additional official pages were
repeating known control classes, while the remaining high-value gaps require a
declared corpus/runtime and separate execution authority.

## Sources

All sources are official Apache project/ASF materials accessed 2026-08-17.

- **[S1]** Apache Tika, project home and release news (latest stable 3.3.2,
  4.0.0-beta-1 note, “over a thousand” types),
  https://tika.apache.org/
- **[S2]** Apache Tika 3.3.2, *Content Detection*,
  https://tika.apache.org/3.3.2/detection.html
- **[S3]** Apache Tika 3.3.2, *Configuring Tika*,
  https://tika.apache.org/3.3.2/configuring.html
- **[S4]** Apache Tika 3.3.2 Javadocs, `DefaultParser`,
  https://tika.apache.org/3.3.2/api/org/apache/tika/parser/DefaultParser.html
- **[S5]** Apache Tika 3.3.2, *The Parser interface*,
  https://tika.apache.org/3.3.2/parser.html
- **[S6]** Apache Tika 3.3.2, *Getting Started* (artifacts, dependencies, CLI
  and batch bounds), https://tika.apache.org/3.3.2/gettingstarted.html
- **[S7]** Apache Tika 3.3.2, *Supported Document Formats*,
  https://tika.apache.org/3.3.2/formats.html
- **[S8]** Apache Tika 3.3.2 Javadocs, `TikaCoreProperties` and `Metadata`,
  https://tika.apache.org/3.3.2/api/org/apache/tika/metadata/TikaCoreProperties.html
  and https://tika.apache.org/3.3.2/api/org/apache/tika/metadata/Metadata.html
- **[S9]** Apache Tika, *Security Model*,
  https://tika.apache.org/security-model.html
- **[S10]** Apache Tika wiki, *The Robustness of Apache Tika* (last updated
  2024-01-30),
  https://cwiki.apache.org/confluence/display/TIKA/The+Robustness+of+Apache+Tika
- **[S11]** Apache Tika 3.3.2 Javadocs, `EmbeddedDocumentExtractor`,
  https://tika.apache.org/3.3.2/api/org/apache/tika/extractor/EmbeddedDocumentExtractor.html
- **[S12]** Apache Tika 3.3.2 Javadocs, `RecursiveParserWrapper`,
  https://tika.apache.org/3.3.2/api/org/apache/tika/parser/RecursiveParserWrapper.html
- **[S13]** Apache Tika wiki, *TikaServer* (last updated 2024-01-30),
  https://cwiki.apache.org/confluence/display/TIKA/TikaServer
- **[S14]** Apache Tika 3.3.2 Javadocs, `TesseractOCRParser` and
  `TesseractOCRConfig`,
  https://tika.apache.org/3.3.2/api/org/apache/tika/parser/ocr/TesseractOCRParser.html
  and https://tika.apache.org/3.3.2/api/org/apache/tika/parser/ocr/TesseractOCRConfig.html
- **[S15]** Apache Tika 3.3.2 release changes,
  https://dist.apache.org/repos/dist/release/tika/3.3.2/CHANGES-3.3.2.txt
- **[S16]** Apache Tika 3.3.2 tagged `LICENSE.txt`,
  https://github.com/apache/tika/blob/3.3.2/LICENSE.txt
- **[S17]** Apache Tika 3.3.2 tagged `NOTICE.txt`,
  https://github.com/apache/tika/blob/3.3.2/NOTICE.txt
- **[S18]** Apache Tika 3.3.2 Javadocs, `WriteOutContentHandler`,
  https://tika.apache.org/3.3.2/api/org/apache/tika/sax/WriteOutContentHandler.html
- **[S19]** Apache Tika 3.3.2 Javadocs, `SecureContentHandler`,
  https://tika.apache.org/3.3.2/api/org/apache/tika/sax/SecureContentHandler.html
- **[S20]** Apache Tika 3.3.2 Javadocs, `AutoDetectParserConfig`,
  https://tika.apache.org/3.3.2/api/org/apache/tika/parser/AutoDetectParserConfig.html
- **[S21]** Apache Tika 3.3.2 Javadocs, `ForkParser`,
  https://tika.apache.org/3.3.2/api/org/apache/tika/fork/ForkParser.html
- **[S22]** Apache Tika 3.3.2 tagged source, `TikaServerConfig`,
  https://github.com/apache/tika/blob/3.3.2/tika-server/tika-server-core/src/main/java/org/apache/tika/server/core/TikaServerConfig.java
- **[S23]** Apache Tika, *Security* vulnerability inventory,
  https://tika.apache.org/security.html

## Confidence summary

- **High:** architecture and current stable version; parser/detector discovery;
  structured and recursive output; OCR/external-process nature; fork isolation;
  security warning/history; Apache-2.0 plus third-party notice obligations.
- **Medium:** operational implications of specific server/wiki behaviors across
  all 3.3.2 deployment modes, because official wiki pages span versions and no
  live deployment was inspected.
- **Low / unknown:** comparative extraction quality, real corpus resource
  distributions, complete artifact license closure, and effectiveness of any
  proposed OS sandbox until benchmarked and independently reviewed.
