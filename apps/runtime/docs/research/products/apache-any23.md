# Apache Any23: structured-data extraction architecture study

**Research date:** 2026-08-17  
**Sources accessed:** 2026-08-17; official Apache and canonical archived source
unless a dependency source is explicitly identified.  
**Decision frame:** what Apache Any23 demonstrates about extracting embedded
structured data from already-retrieved, untrusted Web documents, and which
contracts Curiosity should adopt without importing an unsupported parser stack
or its unsafe fetch behavior.  
**Status:** clean-room, read-only reverse engineering of public documentation
and Apache-licensed source. No code was copied, executed against live pages, or
incorporated into Curiosity.

## Executive finding

Any23's enduring architectural idea is useful: **detect a document type, select
named extractor factories, run each extractor into a common RDF statement
event stream, and retain extractor-scoped diagnostics**. Its final source tree
supports a broad set of embedded HTML signals—default RDFa 1.1, Microdata,
embedded JSON-LD, twelve Microformats1 families, and ordinary head metadata—
plus standalone RDF, calendar, CSV, YAML, and OWL syntaxes [S2][S5][S7]. The
common `TripleHandler` boundary can preserve document and extractor context
while allowing filtering and multiple serializers [S8][S9].

It is **not a safe production dependency or a ready-made Curiosity adapter**.
Apache retired Any23 for inactivity in June 2023; the final release was 2.7 in
June 2022 and the archived repository is read-only [S1][S3][S4][S36]. The default
path buffers whole responses, then may create another whole in-memory copy and
an HTML DOM, without an input-byte, triple-count, depth, or per-extractor time
budget [S10][S11][S12]. Its URL fetcher follows redirects with no host/network
policy, and its JSON-LD extractor uses jsonld-java's default document loader,
which permits remote context retrieval unless a JVM-wide property disables it
[S13][S14][S15]. Those properties are incompatible with a parser boundary for
untrusted Web evidence.

**Overall verdict:**

- **ADOPT** a manifest-driven extractor registry, MIME/capability routing,
  extractor-scoped contexts, streaming statement events, structured issues,
  and explicit partial-success accounting.
- **ADAPT** the common RDF normalization target: retain normalized RDF terms,
  but also preserve source capture, embedded-block locator and hash, original
  syntax, parser/version/policy, repairs, and statement-level derivation.
- **REJECT** Any23's built-in remote fetching, implicit remote JSON-LD context
  loading, unbounded whole-document buffering/DOM construction, mutable global
  registry, and fail/partial-output semantics.
- **DEFER** any code or dependency reuse. The project is Apache-2.0, but it is
  retired and carries NOTICE and third-party-license obligations; a maintained
  parser bake-off and security review must precede a separately reviewed ADR.

Confidence is **high** on the final public architecture, registry contents,
failure paths, maintenance state, and license; **medium** on behavior of every
malformed-input corner because no adversarial runtime corpus was authorized;
and **low** on production-scale throughput, for which Apache published no
representative benchmark.

## 1. Frame, bounded questions, and method

The investigation asked:

1. Which embedded and standalone formats are actually enabled by the final
   default registry, rather than merely mentioned in prose or present as
   dormant source?
2. How does MIME detection select extractors, and how can callers/plugins
   alter that set?
3. What document, extractor, graph, diagnostic, and repair provenance survives
   parsing and serialization?
4. What happens on malformed or malicious input, parser disagreement, remote
   references, oversized documents, and partial extractor failure?
5. What normalization is useful, and what source evidence does it collapse?
6. What do the release history, retirement, license, and dependency surface
   imply for Curiosity?

### Method and clean-room boundary

The primary evidence was Apache's retired project site, Attic record, release
archive, board resolution, license/NOTICE, and the canonical repository's final
`master` commit `458219e5a396cedcc93b3debf4a6497ce424d167`
(2022-06-03). The site labels itself `2.8-SNAPSHOT`; 2.7 is the last released
artifact. Findings from final `master` are therefore labeled as final-source
behavior, not silently attributed to a released 2.8 [S1][S3][S4]. The pinned
jsonld-java 0.13.4 source was read only to verify the remote-context behavior
of the dependency declared by final Any23 source [S14][S15].

No credentials, private artifacts, retired service endpoint, live URL,
malformed-input execution, binary decompilation, or access-control bypass was
used. Search snippets were not evidence. No implementation was produced.

Labels:

- **FACT** — directly stated by a cited primary source or directly observable
  in pinned public source.
- **INFERENCE** — the narrow operational or architectural conclusion supported
  by those facts.
- **RECOMMENDATION** — a Curiosity design choice.
- Confidence is **high**, **medium**, or **low**.

## 2. Supported formats: documentation versus the registry

### 2.1 Embedded HTML extraction enabled by default

The final service-provider manifest lists 34 factories. Startup configuration
removes one of the two RDFa factories—RDFa 1.1 is enabled by default—and can
remove HTML meta extraction; with defaults, 33 factories remain [S5][S6][S7].

| Embedded family | Final default-source evidence | Normalized shape | Confidence |
| --- | --- | --- | --- |
| JSON-LD | `html-embedded-jsonld` scans HTML `script` elements and invokes the standalone JSON-LD extractor when an attribute value equals `application/ld+json` [S7][S13]. | JSON-LD is expanded through jsonld-java into RDF terms/triples. | High |
| RDFa | Both RDFa 1.0 and 1.1 factories are discoverable; configuration defaults to the programmatic/RDF4J RDFa 1.1 factory and unregisters the 1.0 factory [S5][S6]. | RDF statements resolved against the document IRI. | High |
| HTML Microdata | `html-microdata` implements the Microdata-to-RDF conversion, resolves item identifiers and links against the document IRI, emits types/properties, and retains a backward-compatibility `microdata#item` triple removed from the specification [S7][S16]. | RDF graph using vocabulary/type-derived predicate IRIs and blank nodes where needed. | High |
| Microformats1 | Default factories cover `adr`, `geo`, `hcalendar`, `hcard`, `hlisting`, `hrecipe`, `hresume`, `hreview`, aggregate review, license, species, and XFN [S5][S7]. | Vocabulary-specific RDF plus optional nesting/domain consolidation. | High |
| Head/document metadata | Title, generic `meta`, `link`, and ICBM geographic metadata are registered [S5][S7]. | Primarily document-subject RDF statements. | High |
| XPath | An experimental generic XPath extractor is registered [S2][S5]. | Rule-defined RDF; policy and configuration dependent. | High |

**FACT (high):** one parsed TagSoup/Xerces-style DOM is cached and shared by
all DOM extractors for the same extraction parameters. It uppercases element
names, lowercases attributes, and is not namespace-aware [S12]. This both
amortizes parsing and means all embedded extractors see a parser-normalized DOM,
not the original byte-level markup.

**Documentation/source discrepancy (high):** the introduction claims
Microformats2 support and Microformats2 factory classes exist in final source,
but none appears in the final default service-provider manifest. Likewise,
`TurtleHTMLExtractorFactory` exists but is not registered there [S2][S5]. They
may be manually registered by code, but **must not be represented as default
final-build capabilities**. The generated extractor page is also incomplete:
it omits JSON-LD, calendar, YAML, OWL and several final-source entries [S17].

### 2.2 Standalone formats

The final manifest additionally registers:

- RDF/XML, Turtle/N3 media aliases, N-Triples, N-Quads, TriX, and JSON-LD;
- OWL Manchester and Functional syntaxes;
- iCalendar, jCal, and xCal;
- header-driven CSV; and
- YAML [S5][S7].

The public supported-formats page is stale in places: it documents only a
subset and still promises a future N-Quads update under “Version 1.2,” despite
the site identifying itself as 2.8-SNAPSHOT [S17]. The runtime registry and
factory media declarations are the safer source of truth.

**INFERENCE (high):** format support is not one homogeneous guarantee. Some
formats delegate to RDF4J/OWLAPI/jsonld-java, embedded HTML shares a tolerant
DOM, Microdata and Microformats use Any23-specific mappings, and CSV/YAML invent
RDF structures. Curiosity must version capabilities by `format + parser +
mapping policy`, not expose a single “Any23-compatible” boolean.

## 3. Extractor registry and routing

### 3.1 Registration model

`ExtractorRegistryImpl` extends RDF4J's service registry and discovers
`ExtractorFactory` implementations through Java's service-provider mechanism.
Factories have stable names and supported MIME types; registration rejects
duplicate keys, lookup of an unknown name fails, and callers can request all
factories or a named subset [S5][S6]. Plugins can load JARs dynamically and
register their factories into the same singleton registry [S18].

The `Any23` facade snapshots an `ExtractorGroup` when constructed. The default
constructor obtains all currently registered names; an explicit constructor
accepts a group or extractor-name list [S6][S19]. For each document, Any23:

1. creates/reuses a local copy;
2. detects encoding and MIME type (Tika plus a whitespace purifier by default);
3. filters factories by supported MIME type;
4. creates a fresh extractor from each matching factory;
5. runs matching extractors **sequentially**; and
6. consolidates Microformat roots/nesting and optionally adds time/size or
   domain metadata [S10][S19].

For overly generic detected types (`text/plain`, octet-stream, generic XML, or
wildcards), final source runs matching candidates and narrows the reported MIME
type when triple-producing RDF extractors agree on a more specific type. It
also removes generic candidates that produced nothing [S10].

### 3.2 Registry lessons

**FACT (high):** the registry is extensible and introspectable, but its
singleton is mutable. Configuration-dependent unregistration happens during
first access, while plugin registration can mutate it later [S6][S18].

**INFERENCE (high):** a long-lived process can have behavior that depends on
initialization order, classpath, plugin directory, and prior registry mutation.
An identical document and nominal config are not sufficient to reproduce the
extractor set unless the resolved registry is also captured.

**RECOMMENDATION (high):** Curiosity should use an immutable, per-run extractor
manifest containing factory ID, implementation/version digest, accepted media
types, syntax profile, network policy, and limits. Resolve it before processing
and return its digest. Plugins belong behind deployment review and process
isolation, not a user-writable runtime directory or mutable global registry.

## 4. Parsing flow and provenance

### 4.1 What Any23 preserves

Every extractor receives an `ExtractionContext` containing:

- extractor name;
- document IRI;
- default document language; and
- a local context identifier incorporated into an `urn:x-any23:...` unique ID
  [S8].

`TripleHandler` exposes document start/end, context open/close, namespace, and
quad events. Every statement event carries the extraction context separately
from the RDF graph term [S9]. `ExtractionReport` returns matching extractors,
detected encoding, detected MIME type, HTML validation report, and issues by
extractor [S20]. Issue severity is warning/error/fatal and normally includes
line/column where the delegated parser supplies it [S21].

Most writers map a statement with no explicit graph to the document IRI as its
graph; an explicit input graph wins. N-Quads and JSON statements can therefore
retain document-level graph identity [S22]. An optional annotated writer emits
human-readable begin/end comments containing extraction contexts where the
serialization supports comments [S23].

### 4.2 What it collapses or does not record

The ordinary serialized RDF output does **not** reliably retain:

- extractor identity per statement (the writer substitutes document IRI, not
  extractor context, as the graph);
- embedded block/node locator or byte/character offsets;
- input capture hash, fetch time, HTTP redirect chain, response headers, or
  claimed publication time;
- parser/dependency version and resolved registry digest;
- exact repair applied to the emitted statement;
- statement confidence, disagreement, or alternative parse;
- original lexical markup, JSON object path/order, RDF prefix spelling, or
  source syntax; or
- stable blank-node identity across independent runs [S8][S9][S20][S22][S23].

The `ExtractionReport` is document-level and returned separately from emitted
statements. A consumer that keeps only Turtle/JSON-LD/RDF/XML output loses most
diagnostic and extractor lineage. Even “annotated” comments are not a durable,
statement-level provenance model.

**INFERENCE (high):** Any23's context is strong enough for runtime routing and
metrics but insufficient for evidence chain-of-custody. Document IRI as named
graph answers “which logical document?” but not “which captured bytes, parser,
embedded block, or repair produced this claim?”

**RECOMMENDATION (high):** Curiosity should emit a separate derivation record
for every normalized statement (or a bounded batch with identical lineage):
capture ID/hash, final and requested URL, content type/encoding, embedded syntax
and locator/hash, extractor ID/version, policy/manifest digest, applied repair,
issue references, and source offsets where available. Keep asserted input
graphs distinct from Curiosity provenance graphs; do not overload one RDF graph
slot with both meanings.

## 5. Malformed and untrusted input behavior

### 5.1 Tolerance and diagnostics

**FACT (high):** HTML is parsed tolerantly into one DOM. Optional validation
can report common RDFa/HTML errors and optional fixes can mutate that DOM before
all DOM extractors consume it [S12][S24]. Default CLI extraction does not imply
pedantic validation/fixing; Rover exposes it as a flag [S2].

**FACT (high):** standard RDF extractors default to datatype verification off
and nonfatal parser settings broadly tolerated. RDF4J warnings/errors/fatals are
copied into extractor issues; external DTD loading is explicitly disabled.
Parser exceptions are caught and recorded as a fatal issue, allowing the RDF
extractor call itself to return [S21].

**FACT (high):** the JSON-LD parser is deliberately mixed-tolerance: it permits
unquoted field names, leading-zero and nonnumeric numbers, arbitrary backslash
escapes and unescaped controls, while rejecting comments, single quotes,
missing values and trailing commas. Parse locations become fatal issues where
available, and other exceptions are truncated into a fatal report [S13]. One
bad embedded JSON-LD block does not throw out of that parser; the outer HTML
extractor can proceed to later script nodes.

**FACT (high):** invalid IRI construction is sometimes repaired by
`RDFUtils.fixIRIWithException`; unfixable values become `null` with a warning.
Null statement terms are then silently dropped by `ExtractionResultImpl`
[S25][S26]. Microdata separately reports parser errors, may substitute blank
nodes for invalid item IDs, and in non-strict mode constructs predicates from a
default namespace [S16]. These are recovery transformations, not neutral
validation.

### 5.2 Failure and partial-output semantics

The top-level document runner streams output as extractors run. It does not
stage each extractor transactionally. An uncaught `ExtractionException`,
runtime exception, validation error, DOM failure, output-handler error, or I/O
error aborts the sequential loop; already emitted triples remain in the
handler. `endDocument` is attempted in a `finally`, but no rollback occurs, and
the normal `ExtractionReport` is not returned if the run throws [S10][S26].

**INFERENCE (high):** “fatal issue” and “failed extraction” are different
states. Delegated RDF/JSON-LD parsers often convert failure to an issue and
permit other extractors to run; uncaught failures elsewhere can terminate the
document after partial output. A consumer cannot infer completeness merely
from receiving triples or an end-document event.

**RECOMMENDATION (high):** isolate each extractor with independent hard limits
and a transactional result buffer. Return explicit status per extractor:
`success | success_with_issues | no_data | rejected | timed_out | truncated |
failed`, plus whether output was committed. Commit only bounded, validated
results; retain partial data only in a quarantined diagnostic lane.

### 5.3 Resource and network hazards

| Hazard | Source-grounded behavior | Curiosity consequence |
| --- | --- | --- |
| Response size | `DefaultHTTPClient` reads the entire HTTP entity into a byte array. The default local-copy path can read/copy the full content again [S11][S27]. | Reject unbounded reads; enforce compressed and decompressed byte ceilings before parsing. |
| DOM amplification | HTML is fully materialized as a DOM shared by extractors. Release notes record a historical possible OOM on deeply nested HTML and an earlier malformed-markup infinite loop [S12][S28]. | Parse in a memory/CPU-bounded worker; cap depth/nodes/attributes/text and kill on deadline. |
| Triple/output amplification | No core maximum triple count, literal length, issue count, blank nodes, or expansion ratio was found in configuration or the runner [S5][S10]. | Add hard per-block/document/event ceilings and truncation reasons. |
| Initial URL fetch | The built-in client accepts HTTP(S), follows redirects, requires status 200, applies connect/socket timeouts, but exposes no allowlist, private-network denial, redirect budget policy, or response-byte cap [S11][S19]. | Keep acquisition outside the parser; use Curiosity's reviewed fetcher and immutable capture. |
| JSON-LD contexts | Any23 creates default `JsonLdOptions`. jsonld-java 0.13.4's default `DocumentLoader` resolves remote context URLs unless a JVM system property is `true` [S13][S14][S15]. | Default-deny all parser egress. Resolve only approved, cached contexts by digest under an explicit budget. |
| XML entities | RDF parser configuration disables external DTD loading [S21]. | Adopt this defense, but independently harden every XML/HTML parser and dependency. |
| YAML objects | The YAML extractor uses SnakeYAML `SafeConstructor`, avoiding arbitrary object construction, but applies no visible node/alias/depth/output limits [S29]. | Safe constructors are necessary, not sufficient; bound aliases, nesting, size, and output. |

**INFERENCE (high):** the URL-taking facade combines acquisition and parsing in
one trust domain, while JSON-LD can create a second, less visible acquisition
path through a dependency. This defeats deterministic replay and can create
SSRF/data-egress exposure if used on attacker-controlled URLs or contexts.

## 6. Output normalization and filtering

Any23 normalizes heterogeneous inputs to RDF4J resources, IRIs, literals,
namespaces and optional graph names, then streams them through composable
handlers. Writers cover Turtle, N-Triples, N-Quads, RDF/XML, JSON-LD and a
deprecated JSON-statements structure; the latter explicitly distinguishes IRI,
blank-node and literal values with language/datatype [S17][S22][S23]. Input
named graphs are retained where the parsed context is an IRI [S30].

Optional filters remove known accidental output such as CSS-shaped RDFa and
titles from empty documents. Microformat consolidation can add nesting and
domain triples, and optional extraction metadata can add time/size triples
[S10][S31]. Duplicate/spurious filtering is a handler concern rather than an
intrinsic guarantee of each extractor.

### Normalization strengths

- one typed term model across embedded syntaxes;
- relative-IRI resolution against a document base;
- language/datatype-bearing literals;
- explicit graph support;
- streaming handler composition; and
- deterministic capability naming suitable for metrics and policy.

### Normalization hazards

- repairs and heuristic mappings can make malformed input look authoritative;
- format-specific meaning is flattened (for example Microdata's mapping and
  compatibility triple are policy choices);
- document-graph substitution erases extractor-level statement lineage;
- output ordering and blank-node labels are not evidence identities;
- serializers can lose context comments or namespaces; and
- filters can remove triples without a durable statement-level rejection log.

**RECOMMENDATION (high):** Curiosity should treat normalized RDF as a derived
view, never as the sole stored evidence. Preserve the capture and embedded
fragment, emit a canonical internal term representation, and attach explicit
`asserted`, `repaired`, `inferred`, `filtered`, and `rejected` states. Apply
deduplication only after retaining per-source derivations; identical triples
from RDFa and JSON-LD are corroborating derivations, not disposable duplicates.

## 7. Scale and maintenance assessment

### 7.1 Scale shape

**FACT (high):** within one document, matching extractors run sequentially and
share one local copy and, for HTML, one cached DOM [S10]. This avoids repeated
network fetches and DOM parses, but worst-case work still scales with document
size, DOM complexity, number of matching extractors, remote JSON-LD contexts,
and emitted statements. The default HTTP client allows five total connections
and a 10-second timeout [S5].

The plugin crawler historically offered page/depth/concurrency controls, but
the documented defaults shown for page and depth were effectively unbounded;
it is a basic plugin, not evidence of production crawl scheduling or isolation
[S2]. No official throughput, latency distribution, memory profile, corpus
coverage, conformance score for the final build, or adversarial benchmark was
found.

**INFERENCE (medium):** Any23 is designed as a reusable conversion toolkit and
CLI/service, not a hardened high-throughput evidence parser. Shared parsing and
streaming output are good scale primitives; the absence of hard budgets,
isolation, backpressure and transactional extractor boundaries dominates them
for hostile Web inputs.

### 7.2 Maintenance state

- Last release: **2.7**, archived 2022-06-17 [S3][S4].
- Final canonical source commit examined: 2022-06-03, labeled 2.8-SNAPSHOT.
- ASF Board termination: **2023-06-21**, expressly “due to inactivity”
  [S1][S36].
- Attic transition completed October 2023; repository is read-only [S1][S32].
- Apache's archive warns historical releases “may be unsupported and unsafe to
  use” [S3].

Final release notes show substantial parser/dependency maintenance and a long
history of malformed-input bugs: JSON-LD pathological slowness and malformed
JSON cases, deeply nested HTML OOM, an infinite loop, microdata/RDFa correctness
defects, generic text misclassification, and external-DTD hardening [S28]. Many
were fixed before retirement, but the history demonstrates the continuing
security and conformance burden; it is not evidence that the final build is
vulnerable to every historical issue.

**RECOMMENDATION (high):** do not add archived Any23 artifacts to a networked
Curiosity service. Evaluate maintained, syntax-specific parsers behind a small
provider-neutral extraction contract. Require conformance corpora, fuzzing,
SBOM/license review, dependency freshness, bounded-resource tests, and a
documented replacement path.

## 8. License and clean-room transfer

**FACT (high):** Any23 project code is Apache License 2.0. The license grants
copyright and contributor patent rights subject to its terms. Redistribution
requires a license copy, prominent notices on modified files, retention of
relevant notices, and reproduction of applicable NOTICE attribution. It does
not grant Apache trademarks [S33].

**FACT (high):** Any23's NOTICE includes ASF and DERI copyright history and
attribution for RDF4J, SnakeYAML, and an MIT component. The repository license
also records included jQuery/MIT and RDF4J/Eclipse Distribution License
material [S34]. Dependencies have their own licenses; the project license page
explicitly warns that its displayed project license is typically not a list of
dependency licenses [S35].

Clean-room implications:

1. **Architecture observations are safe to learn from.** Registry manifests,
   typed contexts, handler events, issue taxonomies and MIME routing are
   behavioral/design facts. Curiosity can independently specify these ideas.
2. **Direct code reuse is legally possible, not automatically prudent.** Any
   copied or derived Any23 code would trigger Apache-2.0 attribution/change/
   NOTICE duties and repository provenance requirements. Retirement and old
   dependencies add security ownership that the license does not solve.
3. **Dependency code is not relicensed by Any23.** RDF4J, jsonld-java,
   SnakeYAML, parsers, OWLAPI and transitive artifacts require independent
   version, license and vulnerability review.
4. **Generated RDF is not automatically Apache-licensed.** Source-page rights
   and database/content terms remain with their owners. Extraction does not
   transfer copyright or establish truth.
5. **Apache names and marks remain protected.** A fork or clean-room component
   must not imply ASF maintenance or endorsement.

This study intentionally transfers **requirements and tests**, not source code:
same public facts, independently authored contracts, no copied algorithms or
test fixtures, and explicit provenance if a future review authorizes reuse.

## 9. Curiosity implications and verdict ledger

| Capability or lesson | Verdict | Curiosity disposition | Confidence |
| --- | --- | --- | --- |
| Named extractor-factory manifest | **ADOPTED** | Immutable, versioned per-run manifest with accepted media/syntax, limits and network policy. | High |
| MIME-guided candidate selection | **ADAPTED** | Combine declared type, sniffed type and embedded markers; preserve disagreement and never run every parser merely because type is generic. | High |
| Shared parsed HTML representation | **ADAPTED** | One bounded parse can feed extractors, but retain original capture and record parser normalization; isolate it in a worker. | High |
| Common typed statement event stream | **ADOPTED** | Provider-neutral RDF term events with backpressure and hard count/size ceilings. | High |
| Extractor-scoped context and issues | **ADAPTED** | Add capture/block offsets, parser digest, repairs, outcome and statement derivations; bound issue volume. | High |
| Document IRI as fallback graph | **REJECTED** as provenance | Preserve asserted graph separately; use explicit derivation/provenance objects. | High |
| Mutable singleton/plugin registry | **REJECTED** | No runtime classpath/plugin mutation from unreviewed locations. | High |
| Built-in HTTP acquisition | **REJECTED** | Parser accepts immutable bytes plus retrieval metadata; no URL-opening API in the extraction worker. | High |
| Default JSON-LD remote contexts | **REJECTED** | No parser egress; approved context cache by digest only. | High |
| Tolerant parsing and repair | **ADAPTED** | Strict and recovery lanes; every deviation/repair is explicit, policy-versioned and queryable. | High |
| Streaming partial output | **REJECTED** | Per-extractor transactional commit; explicit partial/truncated status. | High |
| RDF as the only retained output | **REJECTED** | RDF is a derived view beside capture, source fragment and derivation ledger. | High |
| Any23 2.7/final source as dependency | **DEFERRED** (presumptive reject) | Archived/inactive; only revisit through maintained-fork evidence, dependency audit and ADR. | High |
| Apache-2.0 source reuse | **DEFERRED** | Requires explicit need, provenance/NOTICE handling, license scan and security ownership; clean-room contract work is preferred. | High |

### Recommended provider-neutral extraction contract

Without granting any fetch or curiosity authority, a future extraction adapter
should accept:

- immutable capture bytes/stream plus capture ID/hash, final URL, media type,
  encoding and caller-owned budgets;
- an immutable extractor manifest and offline context/vocabulary cache;
- explicit strict/recovery policy; and
- cancellation/deadline signal.

It should return bounded:

- normalized statements with source graph distinct from provenance;
- derivations to block/node/byte or character spans where available;
- per-extractor status, issues, repair/filter decisions and counters;
- detected-versus-declared type evidence;
- truncation/timeout/budget reasons; and
- parser, dependency, policy and manifest versions.

## 10. Fact / inference / recommendation ledger

| ID | Type | Claim | Evidence | Confidence | Verdict |
| --- | --- | --- | --- | --- | --- |
| L1 | FACT | ASF retired Any23 in June 2023 due to inactivity; Attic completion followed in October. | [S1][S36] | High | Dependency risk retained. |
| L2 | FACT | 2.7 is the last archived release; final source is an unreleased 2.8-SNAPSHOT. | [S3][S4][S32] | High | Do not call 2.8 a release. |
| L3 | FACT | Final default discovery comprises a 34-factory service manifest with one RDFa implementation removed by config. | [S5][S6] | High | Registry is source of truth. |
| L4 | FACT | Default embedded extraction includes JSON-LD, RDFa 1.1, Microdata, Microformats1 and head metadata. | [S5][S7] | High | Capability shape adopted, implementation not. |
| L5 | FACT | Microformats2 and script-Turtle classes are not in the final default service manifest despite broader documentation/source claims. | [S2][S5] | High | Mark non-default. |
| L6 | FACT | Extractors are MIME-filtered, freshly instantiated and run sequentially over a reusable local copy/shared DOM. | [S10][S19] | High | Adapt with hard budgets. |
| L7 | FACT | Context contains extractor name/document IRI/language/ID; report contains type, encoding, validation and extractor issues. | [S8][S20] | High | Extend provenance. |
| L8 | FACT | Default writers generally use document IRI, not extractor identity, as fallback graph. | [S22] | High | Insufficient chain-of-custody. |
| L9 | FACT | RDF/XML external DTD loading is disabled and parser errors can become structured issues. | [S21] | High | Defense adopted. |
| L10 | FACT | Whole HTTP bodies and local copies are memory-buffered without a visible core byte ceiling. | [S11][S27] | High | Built-in fetch rejected. |
| L11 | FACT | Default JSON-LD processing can retrieve remote contexts through jsonld-java. | [S13][S14][S15] | High | Parser egress rejected. |
| L12 | INFERENCE | Any23's partial streamed output cannot establish document completeness. | [S10][S20][S26] | High | Transactional extractor boundary required. |
| L13 | INFERENCE | RDF-only storage loses source syntax, block location, parser/repair lineage and corroborating derivations. | [S8][S20][S22][S23] | High | Preserve capture + derivation. |
| L14 | INFERENCE | Shared DOM and streaming are useful scale primitives but do not compensate for missing resource isolation. | [S10][S12][S28] | High | Adapt, do not clone. |
| L15 | RECOMMENDATION | Extraction must be offline, immutable-input, process-isolated and bounded by bytes, time, depth, events and output. | Synthesis | High | **ADOPTED**. |
| L16 | RECOMMENDATION | Treat strict parse, recovered parse and rejected data as separate, provenance-bearing outcomes. | Synthesis | High | **ADOPTED**. |
| L17 | RECOMMENDATION | Do not use retired Any23 in production without a new maintained-fork/dependency/security decision. | [S1][S3][S28] | High | **DEFERRED / presumptive reject**. |

## 11. Unknowns and checks

### Material unknowns

1. Exact behavior differences between released 2.7 source and the final
   2.8-SNAPSHOT commit for every extractor and transitive dependency.
2. Current conformance against modern JSON-LD, RDFa, Microdata and
   Microformats test suites; the project published no final aggregate score.
3. Peak memory/CPU and expansion ratios on representative and adversarial Web
   corpora.
4. Whether every parser path—not only RDF4J's RDF/XML path—fully disables
   external entity/schema access under final transitive versions.
5. Remote-context redirect, byte, recursion, cache and private-network behavior
   of the exact packaged dependency graph.
6. Determinism of blank-node allocation and statement order across JVMs,
   dependencies and repeated runs.
7. Which dormant/unregistered Microformats2 and script-Turtle implementations
   were intended, tested or shipped in 2.7 artifacts.
8. Any maintained third-party fork with credible security response,
   conformance, release and migration evidence.

### Checks actually performed

- Cross-checked site claims, generated extractor lists, final service-provider
  manifest, factory names, and startup unregistration.
- Traced the facade through local copy, MIME filtering, extractor sequencing,
  shared DOM, extraction contexts, issue reports, handlers and writers.
- Traced JSON-LD embedded-block parsing into the pinned dependency's default
  document loader and confirmed the opt-out is not set by the extractor.
- Checked HTTP buffering/redirect behavior, default timeout/concurrency,
  external-DTD setting, YAML safe constructor, and absence of visible core
  input/output ceilings in the examined runner/configuration.
- Cross-checked release archive, final source state, Attic page, board
  resolution, Apache license, NOTICE and generated license caveat.
- Retained negative results: no official final benchmark, resource-budget
  contract, statement-level provenance, final conformance dashboard,
  maintained release after 2.7, or default registry entries for the dormant
  Microformats2/script-Turtle factories were found.

### Required checks before any implementation decision

1. Build a parser-neutral conformance corpus with valid, ambiguous, malformed,
   hostile and mixed-syntax captures; record gold statements and lineage.
2. Compare maintained syntax-specific parsers under identical offline context,
   byte/time/memory/depth/output budgets.
3. Fuzz HTML/JSON-LD/RDFa/Microdata and verify cancellation, no egress, no
   partial commit, deterministic diagnostics and bounded expansion.
4. Generate SBOM/license notices and scan the exact candidate dependency graph.
5. Review any chosen mapping/repair policy in an ADR; do not inherit Any23's
   compatibility transforms implicitly.

## 12. Bounded curiosity pass

After synthesis, in-frame gaps were scored 1–5 for relevance (R), decision
value (V), novelty (N), and cost (C), using `R+V+N-C`.

| Thread | R | V | N | C | Score | Action |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Final registry versus generated support claims | 5 | 5 | 5 | 1 | 14 | **Pursued**; found default-manifest omissions for Microformats2 and script Turtle [S2][S5]. |
| JSON-LD remote-context loader | 5 | 5 | 5 | 1 | 14 | **Pursued**; established hidden parser egress through the pinned default loader [S13][S14][S15]. |
| Whole-body/DOM resource bounds | 5 | 5 | 4 | 1 | 13 | **Pursued**; established full buffering and no visible core ceilings [S10][S11][S12][S27]. |
| Statement provenance through writers | 5 | 5 | 4 | 1 | 13 | **Pursued**; document graph survives but extractor/block/repair lineage does not [S8][S22][S23]. |
| Execute adversarial malformed corpus | 5 | 5 | 4 | 5 | 9 | **CURIOSITY_NO_GO** — caller authorized research, not execution/benchmarking; no approved corpus or sandbox budget. |
| Audit every transitive CVE/license | 4 | 4 | 2 | 5 | 5 | **CURIOSITY_NO_GO** — exact candidate artifact is undecided; required only if reuse is separately proposed. |
| Probe retired any23.org service | 1 | 1 | 2 | 5 | -1 | **CURIOSITY_NO_GO** — retired endpoint is unnecessary, potentially unsafe, and not evidence of final library behavior. |
| Reconstruct dormant plugin packaging/history | 2 | 2 | 3 | 4 | 3 | **CURIOSITY_NO_GO** — does not change the default-registry or dependency verdict. |
| Patent/FTO analysis beyond Apache grant | 2 | 3 | 2 | 5 | 2 | **CURIOSITY_NO_GO** — legal advice outside authority; escalate only for an implementation choice. |

**Stop condition:** requested categories are covered and the highest-value
contradictions (registry claims, parser egress, bounds, provenance) were
resolved from primary source. Remaining material questions require execution,
dependency selection, legal review, or maintained-fork evidence, so research
stopped on coverage and authority exhaustion.

## Sources

All sources accessed 2026-08-17. Apache documentation is historical and often
labels itself “Last Published: 2022-03-03, Version: 2.8-SNAPSHOT.” Pinned source
links establish code shape, not current support or safety.

- **[S1]** Apache Attic, “Apache Any23”; retirement timeline and read-only
  resources. <https://attic.apache.org/projects/any23.html>
- **[S2]** Apache Any23, “Introduction” and “Getting Started”; stated formats,
  modules and CLI extractor listing.
  <https://any23.apache.org/> and
  <https://any23.apache.org/getting-started.html>
- **[S3]** Apache Archive Distribution Directory, `any23/`; release chronology
  and unsupported/unsafe archive warning.
  <https://archive.apache.org/dist/any23/>
- **[S4]** Apache Any23, “Download”; last release 2.7 and artifact/plugin/service
  packaging notes. <https://any23.apache.org/download.html>
- **[S5]** Apache Any23 final source, extractor service-provider manifest,
  commit `458219e`.
  <https://github.com/apache/any23/blob/458219e5a396cedcc93b3debf4a6497ce424d167/core/src/main/resources/META-INF/services/org.apache.any23.extractor.ExtractorFactory>
- **[S6]** Apache Any23 final source, `ExtractorRegistryImpl`, commit
  `458219e`; service registry and configuration-dependent unregistration.
  <https://github.com/apache/any23/blob/458219e5a396cedcc93b3debf4a6497ce424d167/core/src/main/java/org/apache/any23/extractor/ExtractorRegistryImpl.java>
- **[S7]** Apache Any23 final source, extractor packages, commit `458219e`.
  <https://github.com/apache/any23/tree/458219e5a396cedcc93b3debf4a6497ce424d167/core/src/main/java/org/apache/any23/extractor>
- **[S8]** Apache Any23 final source, `ExtractionContext`, commit `458219e`.
  <https://github.com/apache/any23/blob/458219e5a396cedcc93b3debf4a6497ce424d167/api/src/main/java/org/apache/any23/extractor/ExtractionContext.java>
- **[S9]** Apache Any23 final source, `TripleHandler`, commit `458219e`.
  <https://github.com/apache/any23/blob/458219e5a396cedcc93b3debf4a6497ce424d167/api/src/main/java/org/apache/any23/writer/TripleHandler.java>
- **[S10]** Apache Any23 final source, `SingleDocumentExtraction`, commit
  `458219e`; routing, sequencing, contexts, shared DOM and consolidation.
  <https://github.com/apache/any23/blob/458219e5a396cedcc93b3debf4a6497ce424d167/core/src/main/java/org/apache/any23/extractor/SingleDocumentExtraction.java>
- **[S11]** Apache Any23 final source, `DefaultHTTPClient`, commit `458219e`;
  redirects, status, full-body buffering and timeouts.
  <https://github.com/apache/any23/blob/458219e5a396cedcc93b3debf4a6497ce424d167/core/src/main/java/org/apache/any23/http/DefaultHTTPClient.java>
- **[S12]** Apache Any23 final source, `TagSoupParser`, commit `458219e`;
  normalized DOM and validation/fix path.
  <https://github.com/apache/any23/blob/458219e5a396cedcc93b3debf4a6497ce424d167/core/src/main/java/org/apache/any23/extractor/html/TagSoupParser.java>
- **[S13]** Apache Any23 final source, `JSONLDExtractor` and
  `EmbeddedJSONLDExtractor`, commit `458219e`.
  <https://github.com/apache/any23/blob/458219e5a396cedcc93b3debf4a6497ce424d167/core/src/main/java/org/apache/any23/extractor/rdf/JSONLDExtractor.java> and
  <https://github.com/apache/any23/blob/458219e5a396cedcc93b3debf4a6497ce424d167/core/src/main/java/org/apache/any23/extractor/html/EmbeddedJSONLDExtractor.java>
- **[S14]** jsonld-java 0.13.4, `JsonLdOptions`; default `DocumentLoader`.
  <https://github.com/jsonld-java/jsonld-java/blob/v0.13.4/core/src/main/java/com/github/jsonldjava/core/JsonLdOptions.java>
- **[S15]** jsonld-java 0.13.4, `DocumentLoader`; remote loading and JVM-wide
  opt-out property.
  <https://github.com/jsonld-java/jsonld-java/blob/v0.13.4/core/src/main/java/com/github/jsonldjava/core/DocumentLoader.java>
- **[S16]** Apache Any23 final source, `MicrodataExtractor`, commit `458219e`.
  <https://github.com/apache/any23/blob/458219e5a396cedcc93b3debf4a6497ce424d167/core/src/main/java/org/apache/any23/extractor/microdata/MicrodataExtractor.java>
- **[S17]** Apache Any23, “Supported Formats” and “Extractors.”
  <https://any23.apache.org/supported-formats.html> and
  <https://any23.apache.org/extractors.html>
- **[S18]** Apache Any23, “Any23 Plugins”; dynamic registration model.
  <https://any23.apache.org/any23-plugins.html>
- **[S19]** Apache Any23 final source, `Any23`, commit `458219e`; facade,
  source selection, extractor-group snapshot and extraction report creation.
  <https://github.com/apache/any23/blob/458219e5a396cedcc93b3debf4a6497ce424d167/core/src/main/java/org/apache/any23/Any23.java>
- **[S20]** Apache Any23 final source, `ExtractionReport`, commit `458219e`.
  <https://github.com/apache/any23/blob/458219e5a396cedcc93b3debf4a6497ce424d167/core/src/main/java/org/apache/any23/ExtractionReport.java>
- **[S21]** Apache Any23 final source, `BaseRDFExtractor` and
  `RDFParserFactory`, commit `458219e`; tolerance, issues and external-DTD
  setting.
  <https://github.com/apache/any23/blob/458219e5a396cedcc93b3debf4a6497ce424d167/core/src/main/java/org/apache/any23/extractor/rdf/BaseRDFExtractor.java> and
  <https://github.com/apache/any23/blob/458219e5a396cedcc93b3debf4a6497ce424d167/core/src/main/java/org/apache/any23/extractor/rdf/RDFParserFactory.java>
- **[S22]** Apache Any23 final source, `TripleWriterHandler`, commit `458219e`;
  fallback document graph.
  <https://github.com/apache/any23/blob/458219e5a396cedcc93b3debf4a6497ce424d167/core/src/main/java/org/apache/any23/writer/TripleWriterHandler.java>
- **[S23]** Apache Any23 final source, `RDFWriterTripleHandler`, commit
  `458219e`; serialization and optional context comments.
  <https://github.com/apache/any23/blob/458219e5a396cedcc93b3debf4a6497ce424d167/core/src/main/java/org/apache/any23/writer/RDFWriterTripleHandler.java>
- **[S24]** Apache Any23, “Validation and Fixing.”
  <https://any23.apache.org/dev-validation-fix.html>
- **[S25]** Apache Any23 final source, `Any23ValueFactoryWrapper`, commit
  `458219e`; IRI repair and issue reporting.
  <https://github.com/apache/any23/blob/458219e5a396cedcc93b3debf4a6497ce424d167/core/src/main/java/org/apache/any23/rdf/Any23ValueFactoryWrapper.java>
- **[S26]** Apache Any23 final source, `ExtractionResultImpl`, commit `458219e`;
  event forwarding, null-term drop, issues and context closure.
  <https://github.com/apache/any23/blob/458219e5a396cedcc93b3debf4a6497ce424d167/core/src/main/java/org/apache/any23/extractor/ExtractionResultImpl.java>
- **[S27]** Apache Any23 final source, `MemCopyFactory`, commit `458219e`.
  <https://github.com/apache/any23/blob/458219e5a396cedcc93b3debf4a6497ce424d167/core/src/main/java/org/apache/any23/source/MemCopyFactory.java>
- **[S28]** Apache Any23 final source, `RELEASE-NOTES.md`, commit `458219e`;
  parser/security/correctness issue history.
  <https://github.com/apache/any23/blob/458219e5a396cedcc93b3debf4a6497ce424d167/RELEASE-NOTES.md>
- **[S29]** Apache Any23 final source, `YAMLExtractor`, commit `458219e`.
  <https://github.com/apache/any23/blob/458219e5a396cedcc93b3debf4a6497ce424d167/core/src/main/java/org/apache/any23/extractor/yaml/YAMLExtractor.java>
- **[S30]** Apache Any23 final source, `RDFHandlerAdapter`, commit `458219e`;
  named-graph forwarding.
  <https://github.com/apache/any23/blob/458219e5a396cedcc93b3debf4a6497ce424d167/core/src/main/java/org/apache/any23/extractor/rdf/RDFHandlerAdapter.java>
- **[S31]** Apache Any23, “Data Extraction”; filters and handler usage.
  <https://any23.apache.org/dev-data-extraction.html>
- **[S32]** Apache Any23 canonical GitHub archive; archived 2023-07-03 and
  final commit state. <https://github.com/apache/any23>
- **[S33]** Apache Any23, project license / Apache License 2.0.
  <https://any23.apache.org/licenses.html>
- **[S34]** Apache Any23 final source, `NOTICE.txt` and `LICENSE.md`, commit
  `458219e`; attribution and included-source notices.
  <https://github.com/apache/any23/blob/458219e5a396cedcc93b3debf4a6497ce424d167/NOTICE.txt> and
  <https://github.com/apache/any23/blob/458219e5a396cedcc93b3debf4a6497ce424d167/LICENSE.md>
- **[S35]** Apache Any23, “Project Licenses”; caveat that displayed project
  licenses are not dependency licenses. <https://any23.apache.org/licenses.html>
- **[S36]** ASF Board minutes, 2023-06-21, Special Order 7A; termination due
  to inactivity.
  <https://svn.apache.org/repos/asf/infrastructure/site/trunk/content/foundation/records/minutes/2023/board_minutes_2023_06_21.txt>
