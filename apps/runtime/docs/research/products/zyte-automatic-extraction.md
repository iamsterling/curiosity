# Zyte Automatic Extraction: clean-room product dossier

**Research and primary-source access date:** 2026-08-17  
**Scope:** Zyte API Automatic Extraction as a standalone product surface:
standard typed extraction, extraction-source selection, model pinning, and
Custom Attributes. General Zyte HTTP/browser behavior is included only where
extraction depends on it. Search API, IDE/Scripting, Scrapy Cloud, proxy mode,
and crawl orchestration are otherwise out of scope.  
**Method boundary:** Public first-party documentation, rendered OpenAPI 1.0.0,
pricing, Terms, AUP, DPA, and Privacy Policy. No account, credentials, API call,
free credit, paid test, target request, traffic interception, private model or
prompt inspection, bypass experiment, or implementation. This is not legal
advice, a security certification, or an accuracy benchmark.

## Executive verdict

**ADAPT the typed-derivation boundary; DEFER the hosted provider (high
confidence).** Automatic Extraction is a synchronous, known-URL derivation
surface inside `POST /v1/extract`: select exactly one of eleven standard data
types, select HTTP, rendered/visual, or caller-supplied HTML as source, and
receive typed JSON. Ten types are AI-powered; SERP is documented as non-AI.
Custom Attributes adds a caller schema and a Zyte-operated LLM after a standard
type has scoped the relevant page text [S1][S2][S3].

Its strongest transferable patterns are:

1. separate single-item, list, and navigation shapes;
2. explicit acquisition source and an extraction-only `userHtml` path;
3. raw-plus-normalized values for dates, currency, and selected identifiers;
4. type-mismatch probability distinct from transport success;
5. model pinning with an announced retention window; and
6. extractive versus generative Custom Attributes with token/truncation
   telemetry [S1-S3].

Its evidence contract is insufficient for Curiosity. `metadata.probability` is
a type/item signal, not field confidence; list probabilities are expressly
uncalibrated. Outputs have no field-to-source spans, artifact hashes, redirect
chain, cache disposition, extractor build for most types, or derivation
explanations. `dateDownloaded` is useful but ambiguous for `userHtml`, where
Zyte performs no download. Schema conformance, HTTP 200, and low mismatch
probability do not prove truth, completeness, freshness, or rights [S1-S5].

**Disposition:**

- **ADOPTED:** extraction as a bounded operation over an immutable capture;
  typed single/list/navigation distinctions; source-literal plus normalized
  value; explicit semantic outcome.
- **ADAPTED:** provider schemas into neutral claims with source anchors;
  mismatch probability into a named, calibrated type signal; model pinning into
  a full derivation version; navigation into policy-checked frontier candidates.
- **REJECTED:** provider output as capture evidence; outer HTTP 200 as extraction
  success; schema-valid custom output as fact; implicit render/source defaults;
  automatic execution of returned navigation methods, headers, or bodies.
- **DEFERRED:** any provider trial until privacy/retention/training terms,
  security controls, approved fixtures, evaluation measures, and a capped
  budget are authorized.

## 1. Decision frame, questions, and evidence rules

### Decision

Which observable Zyte Automatic Extraction concepts should Curiosity adopt,
adapt, reject, or defer while preserving capture provenance, bounded network
authority, provider neutrality, and untrusted-output handling?

### Bounded sub-questions

1. What types and fields constitute the public ontology?
2. How does extraction depend on fetch, render, actions, visual features, or
   supplied HTML?
3. What do probability, timestamps, model versions, token counts, and errors
   establish about quality, provenance, and freshness?
4. Which limits, retry rules, and prices bound use?
5. What privacy, security, service-data, and target-rights constraints apply?
6. What logical architecture is inferable without reconstructing private
   models, prompts, anti-bot methods, or service topology?
7. Which lessons transfer cleanly to Curiosity?

Labels:

- **FACT** — directly supported by cited first-party material.
- **INFERENCE** — bounded reasoning from public behavior, not a claim about
  Zyte's private implementation.
- **RECOMMENDATION** — a Curiosity design, governance, or procurement choice.
- **UNKNOWN / NEGATIVE RESULT** — not established by reviewed public sources;
  absence in documentation is not proof of absence in the service.

Confidence is **high**, **medium**, or **low**. Vendor quality, performance, and
security-effectiveness statements remain vendor claims.

## 2. Product boundary and common contract

**FACT (high):** The unit of work is one absolute URL in one blocking
`POST /v1/extract` call. The URL is limited to 8,192 characters, its host must be
a domain rather than an IP literal, the request body is limited to 5 MiB, and
Basic authentication uses the API key as username [S1].

**FACT (high):** Exactly one standard extraction field may be enabled per
request. Automatic extraction may be combined with compatible acquisition
artifacts, such as headers, rendered HTML, or screenshot, except SERP, which can
only be combined with its options and URL. Incompatible source/capability
combinations produce 422 `/request/unprocessable` [S1][S5].

**FACT (high):** Standard types are:

| Family | Request/response field | Semantic cardinality | Method |
|---|---|---|---|
| Commerce | `product` | one product plus variants | AI |
| Commerce | `productList` | products visible on one list page | AI |
| Commerce | `productNavigation` | products, subcategories, pagination request candidates | AI |
| Editorial | `article` | one article | AI |
| Editorial | `articleList` | article summaries visible on one page | AI |
| Editorial | `articleNavigation` | article and pagination candidates | AI |
| Community | `forumThread` | one topic plus posts visible on the page | AI |
| Employment | `jobPosting` | one posting | AI |
| Employment | `jobPostingNavigation` | posting and pagination candidates | AI |
| Generic | `pageContent` | primary content plus navigation partitions | AI |
| Search | `serp` | organic results and search metadata | non-AI |

[S1][S2]

**INFERENCE (high):** This is a page classifier/extractor and navigation-candidate
generator, not a crawler. Navigation outputs do not schedule, authorize,
deduplicate, revisit, or prove that linked resources were fetched.

**RECOMMENDATION (high):** Keep `AcquireCapture`, `ExtractTypedClaims`, and
`AdmitFrontierCandidates` separate. A provider extraction call must never gain
ambient crawl authority.

## 3. Observable typed schemas

The following summarizes the rendered OpenAPI rather than reproducing Zyte's
schema as Curiosity's ontology [S1]. Most semantic fields are optional; required
URL/metadata fields do not imply complete extraction.

### 3.1 Article, article list, and navigation

**FACT (high):** `article` can return headline; clean `articleBody` text;
simplified/standardized `articleBodyHtml`; a human-provided or auto-generated
description; normalized and raw publication/modification dates; authors with
normalized name and `nameRaw`; ISO 639-1 language; breadcrumbs; main/all images;
video/audio URLs; extracted URL; canonical URL; and metadata [S1].

**SECURITY FACT (high):** `articleBodyHtml` may include embedded content such as
videos and tweets. “Simplified and standardized” is not documented as inert or
safe HTML [S1].

**FACT (high):** `articleList.articles[]` is deliberately thinner: URL,
headline, page-visible body text, normalized/raw publication date, authors,
language, images, and item metadata. The top level adds source URL and download
metadata. `articleNavigation` narrows further to article URL/name,
normalized/raw publication date, next-page URL/name, and page number [S1].

**INFERENCE (high):** list extraction is an enrichment shortcut, while
navigation extraction is a frontier-hint projection. Neither is a substitute
for acquiring each detail page, and list-page claims may differ from detail-page
claims.

### 3.2 Product, product list, and navigation

**FACT (high):** `product` can return name; current and regular numeric-string
prices; normalized ISO 4217 and raw currency; two-state normalized availability;
SKU, MPN, and typed GTIN-family identifiers; brand; breadcrumbs; images;
plain/simplified-HTML description; aggregate rating; color, size, weight with
normalized/raw units, material, style; name/value properties; feature strings;
URL/canonical URL; metadata; and variants [S1].

**FACT (high):** variants reuse a subset of product fields (identity, offer,
availability, identifiers, images, color/size/style, properties, and URL) but do
not expose the parent's full metadata contract [S1].

**FACT (high):** `productList.products[]` returns URL, name, current/regular
price, normalized/raw currency, main image, and uncalibrated item probability;
the top level adds breadcrumbs, category name, URL, and download timestamp [S1].

**FACT (high, security-relevant):** `productNavigation.items[]` and
`subCategories[]` may return not only URLs and names but a method (`GET`, `POST`,
`PUT`, `DELETE`, `OPTIONS`, `TRACE`, or `PATCH`), headers, and a Base64 request
body. They also carry item probability; top-level fields include category,
pagination, URL, and download metadata [S1].

**RECOMMENDATION — REJECT EXECUTION (high):** Treat navigation methods, headers,
bodies, and URLs as untrusted derived data, never executable instructions.
Curiosity may admit normalized, rights-approved, side-effect-free GET candidates
after redirect/host/policy/budget checks. Discard credentials and deny
state-changing methods, TRACE, and provider-derived headers/bodies by default.

### 3.3 Forum, jobs, generic content, and SERP

**FACT (high):** `forumThread` returns topic name and posts containing text,
normalized/raw publication date, like/reply counts, and item probabilities, plus
page URL and download metadata. The public shape does not show post author,
post URL/ID, parent/reply edge, or per-post source anchor [S1].

**FACT (high):** `jobPosting` includes title, normalized/raw publication date,
valid-through date, plain and simplified-HTML description, employment type,
hiring-organization name, raw/max/currency/raw-currency salary, raw location,
page URL, and metadata. The public schema exposes neither a general remote-work
classification nor detailed normalized address in this surface [S1].

**FACT (high):** `jobPostingNavigation` contains job URL/name, item probability,
next page, page number, source URL, and download timestamp [S1].

**FACT (high):** `pageContent` partitions a generic page into headline, HTML
`title`, primary clean text (`itemMain`), an XPath 1.0 pointer to the smallest
HTML element containing that text, breadcrumbs, header/footer/sidebar links,
pagination, next page, URL/canonical URL, and metadata. Zyte warns that the XPath
may require an HTML5-compliant parser [S1].

**FACT (high):** `serp` returns organic result title, excerpt, URL, displayed URL
text, and page-local rank; search URL/page number; displayed versus requested
query; reported organic-result total; and download timestamp. Rank starts at one
on every page, so it is not a global rank without caller normalization [S1].

**RECOMMENDATION (high):** `pageContent.itemMainXPath` is the closest public
field anchor, but it is parser- and document-version-sensitive. Preserve it with
the exact capture hash and parser identity; never treat it as an immutable
citation by itself.

## 4. Fetch, render, and extraction-source dependency

### 4.1 Four documented source concepts, three in the rendered enum

**FACT (high):** The extraction guide documents:

- `httpResponseBody`: usually faster and cheaper;
- `browserHtmlOnly`: rendered DOM without visual features, typically better than
  HTTP on JavaScript-heavy pages;
- `browserHtml`: rendered DOM plus visual page features, typically better than
  DOM-only but less robust when rendering has issues; and
- `userHtml`: caller-provided HTML, with no Zyte fetch or render [S2].

**CONTRACT DRIFT (high):** The rendered top-level and per-type `extractFrom`
enums list only `httpResponseBody`, `browserHtml`, and `userHtml`; they omit
`browserHtmlOnly`. The API reference describes `browserHtml` as using rendered
HTML and screenshot/visual information. Runtime acceptance of `browserHtmlOnly`
was not tested [S1][S2].

**FACT (high):** AI extraction currently defaults to `browserHtml`; non-AI SERP
defaults to HTTP. Zyte explicitly says future defaults may vary by target site
[S1][S2].

**RECOMMENDATION (high):** Always select an explicit source. A target-adaptive
default silently changes latency, cost, network authority, visual dependence,
and reproducibility.

### 4.2 HTTP and browser coupling

**FACT (high):** HTTP extraction can use request method, body, and custom
headers. Browser extraction can use JavaScript toggles, actions, network capture,
screenshots, and the browser's narrower initial-header contract. Extraction
happens after actions finish or time out [S1][S2][S4].

**FACT (high):** Browser action failures and the 60-second action ceiling can
still yield outer HTTP 200 with artifacts and extraction from the partial state.
Action outcomes are reported separately [S4][S5].

**INFERENCE (high):** A typed extraction may therefore be causally downstream of
redirects, JavaScript, subresource requests, action side effects, partial action
execution, serialized DOM, and visual analysis. The typed object alone does not
reveal that chain.

**RECOMMENDATION (high):** Capture an immutable causal ledger:

```text
seed -> redirects -> acquisition attempts -> raw/rendered artifacts
     -> actions and partial state -> extraction source hash
     -> extractor/schema/model -> typed claims
```

Do not let an extraction adapter obscure whether a claim came from response
bytes, rendered DOM, visual state, or caller-supplied HTML.

### 4.3 Caller-supplied HTML

**FACT (high):** `userHtml` works for AI types, uses the same extraction model as
HTTP-source extraction, performs no download/render, and uses the required URL
only to resolve relative links. It incurs extraction-only cost. The guide calls
the limit 2.5 MiB, while the rendered schema expresses 1–2,621,440 characters and
says support may adjust the limit [S1][S2].

**CONTRACT AMBIGUITY (high):** Standard AI schemas expose
`metadata.dateDownloaded` (required when that metadata object is present), yet
`userHtml` explicitly performs no download. The public contract does not say
whether this field becomes Zyte processing time, caller capture time, submission
time, or another value in this mode [S1][S2].

**RECOMMENDATION — ADOPT CONCEPT, STRENGTHEN CONTRACT (high):** Prefer extraction
from a Curiosity-held capture. Send a non-sensitive canonical/base URL only when
needed, and preserve caller `captured_at` independently. Never reinterpret
Zyte's `dateDownloaded` as source acquisition time for `userHtml` without written
confirmation.

## 5. Quality, confidence, provenance, and freshness

### 5.1 Probability semantics

**FACT (high):** Single-item metadata contains required `probability` in `[0,1]`
for whether the page contains the requested type. Zyte recommends 0.5 as a
threshold but returns data even for very low probability [S1][S5].

**FACT (high):** List/navigation/post items have a required probability for
whether each returned candidate is valid. Zyte says unlikely items are already
omitted and explicitly states that this probability is **not calibrated** [S1].

**NEGATIVE RESULT (high):** No general per-field confidence, source precedence,
abstention reason, coverage/recall estimate, probability calibration dataset,
or accuracy by field/type/language/source was found.

**INFERENCE (high):** A high single-item probability means “likely the requested
kind of page,” not “every field is correct.” A list with only high-probability
items can still omit true items; item filtering offers no completeness measure.

**RECOMMENDATION (high):** Name these signals `type_match_probability` and
`candidate_validity_score`, not `confidence`. Calibrate independently on an
authorized corpus and preserve missingness. Field confidence must remain
`unknown` unless supported by separate evidence.

### 5.2 Derivation and normalization

**FACT (high):** Several schemas preserve both raw and normalized values:
publication dates, currency, weights, author names, and salary currency. Other
fields are only normalized or derived: article description may be auto-generated,
availability is reduced to two states, simplified HTML is transformed, and
language/canonical URL are inferred or selected [S1].

**INFERENCE (high):** Each normalized field is a claim derived from a source
literal, not source truth. Correct formatting does not prove correct extraction.

**RECOMMENDATION (high):** Adopt `{source_literal, normalized_value, unit,
normalizer_version, source_anchor}`. Do not overwrite literals, and do not map
Zyte's two-state availability directly into a richer neutral ontology without
retaining uncertainty.

### 5.3 Provenance present and absent

**FACT (high):** Standard objects expose extraction/page URL; some expose
canonical URL; all standard types expose `dateDownloaded`; type/list metadata
provides probability; optional acquisition fields can return final URL, origin
status, response headers, raw body, rendered DOM, screenshot, action records,
and captures when requested compatibly [S1][S4].

**NEGATIVE RESULT (high):** The typed extraction object itself does not guarantee:

- a provider request/trace ID;
- full redirect chain or per-hop time/status;
- raw/rendered artifact hash, size, or immutable reference;
- cache status, age, revalidation, force-refresh, or stale-on-error semantics;
- effective HTTP/browser/visual policy when the source default is omitted;
- browser/runtime/render-policy build;
- field-level selector, text span, DOM range, image region, or source literal;
- per-field confidence or derivation explanation;
- exact extractor/model build for types without pinning; or
- robots, target-terms, rights, purpose, or retention decision.

`pageContent.itemMainXPath` is the sole general source-location-like field and
anchors only the primary-content block [S1-S4].

### 5.4 Freshness and reproducibility

**FACT (high):** `dateDownloaded` is documented as a required UTC ISO-8601
timestamp “at which the data was downloaded” for standard types and SERP [S1].

**NEGATIVE RESULT (medium-high):** No reviewed first-party Automatic Extraction
page defines ordinary response caching, cache keys, freshness SLA, cache
disposition, or a force-refresh/max-age control. It is therefore unsupported to
claim either guaranteed live fetch or documented cache reuse.

**FACT (high):** Product extraction currently exposes two dated model names,
`2024-02-01` and default `2024-09-16`. Zyte says applicable models are retrained a
few times per year, remain pinnable at least one year after release, and receive
at least three months' end-of-life notice [S2].

**INFERENCE (high):** A model date is useful change control, not full
reproducibility. Source artifact, preprocessing, render state, schema revision,
model runtime, and postprocessing can still vary. Public pinning observed here is
product-specific, not a guarantee for every type [S1][S2].

**RECOMMENDATION (high):** A Curiosity derivation record needs:

```text
capture_id, capture_hash, captured_at, requested_url, terminal_url, redirects
source_mode, source_artifact_hash, render/action/visual policy digests
provider, adapter_version, type, schema_id+hash, extractor/model identifier
claims[field -> literal + anchor + normalized value + confidence?]
type_match_probability, missing_fields, warnings, semantic_status
provider_date_downloaded?, requested_at, completed_at, cache_disposition
```

Unknown provider fields must remain unknown; local request time is not a fetch
timestamp.

## 6. Custom Attributes

### 6.1 Position in the pipeline

**FACT (high):** Custom Attributes requires one standard AI extraction type and
cannot accompany SERP. That standard type determines the relevant page portion
sent to a Zyte-operated LLM, excluding unrelated areas such as menus and footers.
The caller supplies a subset-of-OpenAPI schema; results appear under
`customAttributes.values` [S3].

**INFERENCE (high):** Custom Attributes is not generic extraction over all input
bytes. It is downstream of standard type recognition and provider-controlled
content selection; an upstream scope error can invisibly remove needed evidence.

### 6.2 Generate versus extract

**FACT (high):** `generate` supports strings, booleans, numbers, integers,
non-nested arrays, and objects whose subfields are scalar. Scalar enums are
supported. Attributes are implicitly nullable/omittable, while returned values
are guaranteed to conform to the requested schema [S3].

**FACT (high):** Generative descriptions can request normalization,
summarization, translation, categorization, or explanatory analysis. Zyte says
attribute order can affect later outputs, larger schemas generally reduce
quality, and internal mathematical transformations cannot always be correct;
it recommends verbatim extraction followed by caller-side deterministic
transformation [S3].

**FACT (high):** `extract` is documented as a cheaper non-generative LLM method
for simple string/integer/number attributes. Unsupported objects, lists, and
booleans are ignored. Zyte recommends question-form descriptions only when names
alone are insufficient [S3].

**DOCUMENTATION DRIFT (medium-high):** The guide and pricing page support both
`generate` and `extract`, but the rendered reference fragment observed for
`customAttributesOptions.method` displayed default/value `generate`. This may be
a conditional-schema rendering artifact; no call was made [S1][S3][S6].

**RECOMMENDATION (high):** Preserve `extractive` versus `generative` derivation.
Only verbatim, source-anchored extraction may contribute evidence directly.
Summary, translation, explanation, and normalization are derived claims and must
not masquerade as quotations or provenance.

### 6.3 Bounds, telemetry, and semantic failures

**FACT (high):** `maxInputTokens` includes schema and page text but excludes
Zyte's fixed internal prompt. Excess page text is truncated. `maxOutputTokens`
can cap cost but degrade output. Response metadata can return total input/output
tokens, page-text tokens before/after truncation, effective maximum input, an
error, and names of attributes excluded due to PII risk [S1][S3].

**FACT (high):** Documented metadata errors include
`extraction/unparsable-response` and `extraction/schema-size-exceeded`; they are
represented inside Custom Attributes metadata. The public description advises
simplifying the task/schema or increasing input limits [S1].

**INFERENCE (high):** A request can be transport-successful and standard-
extraction-successful while Custom Attributes is truncated, omits fields, drops
PII-risk attributes, or reports a semantic failure.

**UNKNOWN (high importance):** Public docs do not define the PII detector's
categories, locale coverage, false-positive/negative behavior, whether detection
inspects requests, source text, or generated values, or whether exclusion occurs
before or after generation. It is a provider safeguard, not a Curiosity privacy
control.

**RECOMMENDATION (high):** Require explicit statuses for acquisition, standard
extraction, custom extraction, truncation, policy filtering, and validation.
Store token/cost telemetry, but do not retain provider prompts or explanatory
chain-of-thought as evidence. Independently minimize personal data before
disclosure.

## 7. Errors, limits, retries, and prices

### 7.1 Success and error semantics

**FACT (high):** Outer HTTP 200 means Zyte supplied requested ban-free data. It
can wrap an origin non-200 status, failed/partial browser actions, or content
mismatched to the requested extraction type [S5].

**FACT (high):** Relevant machine-readable classes include 503
`/extractor/over-global-limit`; 429 account/domain/account-domain limits; 520
temporary download/ban; 521 permanent/internal download; 500 timeout/internal;
400 malformed/invalid; 401 authentication; 421 unreachable domain; 422
incompatible request; 451 forbidden domain; and 403 suspended account [S5].

**FACT (high):** Rate-limited and unsuccessful responses are uncharged. Zyte
recommends randomized exponential backoff, indefinite retry for rate limiting,
and capped retry for other errors [S5][S6].

**RECOMMENDATION — REJECT INFINITE WORKER RETRY (high):** Normalize provider,
origin, render/action, type-match, and custom-derivation outcomes separately.
Bound retries by deadline, attempts, bytes, target rate, and spend, then return a
deferred state to the scheduler.

### 7.2 Published and missing limits

| Dimension | Published bound / caveat |
|---|---|
| Request body | 5 MiB [S1] |
| URL | 8,192 characters; domain host, no IP literal [S1] |
| `userHtml` | guide: 2.5 MiB; schema: 2,621,440 characters; support-adjustable [S1][S2] |
| Raw/rendered body | 10 MB before Base64; longer body truncated [S7] |
| Browser actions | 60 seconds; partial state may still be extracted [S4][S5] |
| Standard API-key rate | 3,000 RPM plus website/account-website/platform limits [S8] |
| Stats API | 20 RPM [S9] |
| Custom generation | caller may cap input/output tokens [S1][S3] |

**NEGATIVE RESULT (high):** No public hard maximum was found for extracted list
items, variants, navigation candidates, HTML-field bytes, total structured JSON
bytes, custom attribute count/schema bytes/nesting beyond the described type
subset, or standard-extractor processing time independent of the overall call.
The 10 MB acquisition-artifact limit is not documented as an extraction-output
limit [S1-S8].

### 7.3 Point-in-time pricing

**FACT (high, time-sensitive):** Automatic Extraction adds $0.0004–$0.0016 per
requested standard type before discount; SERP extraction is free. This sits on
top of target- and HTTP/browser-tier base cost. `userHtml` avoids the download
portion and incurs extraction cost only [S2][S6].

**FACT (high):** Generative Custom Attributes cost $0.002/1,000 input tokens and
$0.01/1,000 output tokens; extractive Custom Attributes cost a fixed $0.001.
Requested screenshot is $0.002; actions/capture and residential/extended-geo
features add other usage-sensitive costs [S6].

**FACT (high):** Base acquisition has five automatically assigned tiers per
HTTP/browser request type and target. New target/type pairs receive a temporary
tier; assignments are reviewed quarterly with two weeks' notice. Standard PAYG
shows $5 first-month credit, 3,000 RPM, and a $100 monthly plan ceiling; higher
commitment/limit and Enterprise terms vary [S6][S8].

**INFERENCE (high):** Extraction price is not total request price. Source choice,
target tier, rendering/actions, token volume, retries, and discounts dominate
some workloads, and a billed 200 can still be semantically unusable.

**RECOMMENDATION (high):** Preflight expected/worst-case source and token cost;
cap per request/job/tenant/domain; preserve estimated and reconciled cost next to
semantic outcome. Aggregate Stats is operational telemetry, not item provenance.

## 8. Privacy, security, and legal boundary

### 8.1 Data disclosed and service-data use

**FACT (high):** An extraction request can disclose target URL, supplied HTML,
headers/cookies/session context, rendered content, extraction type, custom schema
and descriptions, and resulting structured data to Zyte. Generative Custom
Attributes sends provider-selected page text and caller schema to a
Zyte-operated LLM [S1-S4].

**FACT (high):** Public Terms define Service Data broadly as data extracted
through the software, including screenshots, and permit use of Service Data,
Data Feeds, code, content, and other service data for product development and
product training unless an applicable agreement changes that result [S10].

**FACT (high):** For Service Personal Data, the DPA positions the customer as
controller and Zyte as processor, with the customer responsible for lawful
instructions, notices/consent, and compliant collection/use. International
processing/transfers may occur [S10][S12][S13].

**UNKNOWN (high importance):** Reviewed public material does not specify
Automatic-Extraction-specific retention for URL, supplied HTML, raw/rendered
artifacts, schemas, prompts, outputs, token records, sessions, or debug logs;
backup deletion; exact regions; complete current subprocessors; tenant cache
isolation; or per-account training opt-out.

**RECOMMENDATION — PROCUREMENT BLOCKER (high):** Before confidential, personal,
unpublished, or regulated content, require written no-independent-use/no-training
terms, category-specific retention/deletion SLAs, regions/subprocessors, key and
audit controls, assurance evidence, incident terms, and model-provider/data-flow
disclosure. Do not send credentials or private pages under the public default.

### 8.2 Published security posture and residual risk

**FACT (medium-high):** The DPA describes confidentiality, least-privilege
administrative access, centralized event logs, daily vulnerability scans,
incident management, TLS 1.2 in transit, ISO-27001-certified cloud providers,
and an ISO-27001-aligned risk program. It requires Security Event notice without
undue delay and within 72 hours [S12]. These are contractual statements, not an
independent report reviewed here.

**INFERENCE (high):** Documented features create URL-fetch/redirect SSRF risk,
browser/parser/resource-exhaustion risk, active-markup risk, secret leakage risk,
prompt-injection risk, and denial-of-wallet risk. This is a threat analysis, not
a claim that Zyte lacks controls.

**NEGATIVE RESULT (high):** Automatic Extraction documentation does not establish
private/link-local/metadata destination blocking across redirects/subrequests,
renderer isolation, MIME/malware controls, prompt-injection treatment, secret
redaction, cache isolation, or Custom Attribute model isolation.

**RECOMMENDATION (high):** Only policy-approved public HTTP(S) URLs or inert
captures may enter the adapter. Never forward ambient credentials. Treat typed
fields, links, HTML, XPath, schemas, metadata, errors, and navigation requests as
untrusted external data; sanitize display, cap nesting/bytes/cardinality, and
prevent outputs from authorizing tools or follow-up requests.

### 8.3 Target rights and acceptable use

**FACT (high):** Terms limit Services to scraping publicly accessible websites,
make the customer responsible for legal and ethical use, allow target activity
to be stopped for cease requests or risk, and give no copyright permission or
non-infringement warranty for Service Data [S10].

**FACT (high):** The AUP prohibits unlawful/fraudulent or rights-violating
collection, access contrary to explicitly accepted target terms, LinkedIn
scraping, security testing/unauthorized access, and material site interference.
It restricts screenshots involving personal data, copyrighted material, or
illegal content, and prohibits use for specified EU AI Act prohibited/high-risk
systems, including listed employment examples [S11].

**FACT (high):** Zyte's AUP prohibits attempts to decipher, decompile, reverse
engineer, or discover the service/software source. The analysis here is limited
to public, externally documented behavior and does not attempt those acts [S11].

**NEGATIVE RESULT (high):** No reviewed Automatic Extraction contract says the
endpoint automatically enforces robots.txt, target terms, copyright/database
rights, purpose limitation, crawl delay, or Curiosity's data-category policy.

**RECOMMENDATION (high):** Technical extraction success, a probability score,
or provider KYC is not authorization. Curiosity must decide target, robots,
terms, purpose, personal-data category, rights, retention, complaint/cease path,
and follow-link policy before disclosure or use.

## 9. Clean-room logical architecture inference

Everything in this section is **INFERENCE**, not disclosure of Zyte internals.

```text
request + exactly one standard type + source/options
                    |
          auth / validation / cost planning
                    |
       +------------+------------------+
       |            |                  |
   userHtml      HTTP acquire       browser acquire
   + base URL     + redirects       + JS/actions/visual state
       |            |                  |
       +------ source artifact / representation --------+
                                                        |
                                  standard type extractor/router
                                                        |
                          typed fields + normalization + probability
                                                        |
                  optional relevant-text selection for Custom Attributes
                                                        |
                           extractive or generative LLM + schema validation
                                                        |
                             response + usage/billing/stats telemetry
```

### A. Capability/source planner — **high logical confidence**

Evidence: one endpoint, incompatible field combinations, one selected type,
three/four documented source concepts, target-varying future default, and
feature-based prices [S1][S2][S6]. Physical service topology is unknown.

### B. Type-specific extractor family — **medium-high confidence**

Evidence: materially different schemas, type-mismatch probability, separate
extractor overload, and product-specific model versions [S1][S2][S5]. Whether
types share models, classifiers, prompts, or preprocessors is unknown.

### C. Separate normalization/response shaping — **medium confidence**

Evidence: paired raw/normalized fields, fixed enums/formats, simplified HTML,
schema-conforming custom output, and metadata assembly [S1][S3]. Exact ordering
and implementation are unknown.

### D. Standard-extraction-scoped Custom Attributes stage — **high confidence**

Evidence: a standard type is mandatory and determines which selected page text
the LLM receives [S3]. The selector's exact algorithm and artifact are unknown.

### E. Asynchronous aggregate telemetry path — **medium confidence**

Evidence: separate Stats host/key, extraction type/source dimensions, aggregate
cost/latency, and three-hour domain-health refresh [S9]. This path cannot repair
missing item-level evidence.

## 10. Curiosity decision ledger

### ADOPT

1. **Capture-to-extraction boundary:** extraction can consume an already acquired
   immutable artifact without network authority.
2. **Single/list/navigation distinction:** avoid one ambiguous universal object.
3. **Explicit source mode:** raw, rendered-DOM, visual-rendered, and supplied
   capture are semantically distinct.
4. **Literal plus normalized fields:** preserve both and version transformation.
5. **Semantic mismatch outcome:** type mismatch does not become transport error.
6. **Partial/custom telemetry:** token truncation, omitted attributes, and
   semantic errors are first-class outcomes.
7. **Model lifecycle controls:** version pin, deprecation window, and drift test.

### ADAPT

1. Provider types become namespaced adapter schemas mapped into neutral claims,
   not Curiosity's core ontology.
2. `probability` becomes explicitly named type/candidate signal, independently
   calibrated and never reused as field confidence.
3. `dateDownloaded` becomes provider-reported metadata beside owned capture and
   processing timestamps; its `userHtml` meaning remains unknown.
4. Navigation arrays become inert candidates admitted individually through
   policy, deduplication, and budgets; derived methods/bodies are denied.
5. Model pinning expands to schema hash, source hash, preprocessing/render
   policy, model/runtime, normalizer, and adapter version.
6. Custom schema validity is supplemented by source anchors, deterministic
   validation, missingness, and factual evaluation.
7. HTML and XPath outputs are bound to exact inert artifacts and parser IDs.

### REJECT

1. HTTP 200, billability, schema validity, or high type probability as proof of
   factual quality, completeness, freshness, or rights.
2. Implicit target-dependent extraction-source defaults.
3. Provider URL/typed JSON as sufficient citation or archival evidence.
4. Automatic execution of product-navigation methods, headers, or bodies.
5. Returned simplified HTML as sanitized or safe to render.
6. Generative summaries, translations, explanations, or arithmetic as source
   evidence.
7. Infinite in-worker retry or reliance on provider monthly limits as job bounds.
8. Provider PII filtering as Curiosity's privacy policy.

### DEFER

1. A Zyte Automatic Extraction adapter until procurement/security checks and an
   authorized, no-sensitive-data evaluation plan pass.
2. Browser/visual extraction and actions until a separate egress, side-effect,
   render, and cost threat model is approved.
3. Custom Attributes on personal/confidential content until no-training,
   retention, model-provider, region, and deletion terms are written.
4. Evidentiary use until source artifacts, hashes, timestamps, and field anchors
   are independently owned.
5. Automatic navigation crawling until neutral frontier policy exists.

## 11. Unknowns and required checks

| Material unknown / risk | Confidence now | Required check before reliance |
|---|---:|---|
| Standard extraction accuracy/completeness by field, type, language, and source | Low | Licensed, stratified fixture corpus; precision/recall/missingness and drift study |
| Calibration of single-item probability and semantics of list score | Low-medium | Model card/vendor answer plus reliability curves; list score is documented uncalibrated |
| `dateDownloaded` meaning under `userHtml` | Low | Written contract answer; never substitute for caller capture time |
| Ordinary cache/live-fetch behavior and cache disposition | Low | Written product contract; owned-fixture test only under separate authority |
| `browserHtmlOnly` runtime support | Medium-low | Versioned OpenAPI/vendor answer; controlled schema-validation test if authorized |
| Exact model/build for non-product types and custom methods | Low | Versioned model/extractor identifiers and change notice |
| Product model list currency and pinning for other types | Medium-low | Current account/order-form capability matrix at decision time |
| Field grounding and source precedence | Low | Contract enhancement or reconstruction against owned capture with measured fidelity |
| Extracted array/output/cardinality ceilings | Low | Written limits and local hard caps regardless |
| Custom schema/attribute/nesting limits and `extract` reference drift | Low-medium | Current versioned OpenAPI and non-billable/vendor validation |
| PII exclusion detector scope and behavior | Low | Privacy/security design, categories, tests, false-positive/negative handling |
| Raw/rendered/request/output retention, training, and deletion | Low | Order-form override, DPA annex, deletion SLA, audit evidence |
| Regions, subprocessors, model providers, isolation, assurance | Low | Current Trust Center/procurement package |
| Redirect/subrequest private-address and egress controls | Low | Security architecture; separately authorized owned-fixture test |
| Effective fetch/render/visual/retry choices per item | Low | Item-level execution/provenance contract |
| Exact total cost for a target/type/source | Low/time-sensitive | Current estimator/order form and capped pilot |
| Rights to preserve source artifacts and use each extracted field | Corpus-specific | Target/purpose/data/jurisdiction review with counsel where needed |

## 12. Fact / inference / recommendation ledger

| ID | Type | Claim | Confidence | Disposition/evidence |
|---|---|---|---|---|
| L1 | FACT | Eleven standard types exist; ten are AI and SERP is non-AI; one type per call. | High | [S1][S2] |
| L2 | FACT | AI extraction can consume HTTP, rendered/visual, or supplied HTML; guide also documents DOM-only. | High | [S1][S2] |
| L3 | FACT | Guide/reference disagree on `browserHtmlOnly`. | High | Retained contract drift [S1][S2] |
| L4 | FACT | Single probability is type-match; list probability is uncalibrated item validity. | High | Adapted, not field confidence [S1][S5] |
| L5 | FACT | All standard schemas expose download timestamp; its supplied-HTML meaning is unspecified. | High fact / low meaning | Provenance ambiguity [S1][S2] |
| L6 | FACT | Product navigation can emit state-changing methods, headers, and bodies. | High | Execution rejected [S1] |
| L7 | FACT | Custom Attributes is scoped by standard extraction and can generate or extract. | High | [S3] |
| L8 | FACT | Custom metadata exposes token truncation, semantic error, and excluded PII attribute names. | High | [S1] |
| L9 | FACT | Outer 200 can wrap origin/action/type mismatch. | High | Provider-success semantics rejected [S5] |
| L10 | FACT | Public Terms permit product development/training use of Service Data absent overriding agreement. | High | Procurement blocker [S10] |
| L11 | INFERENCE | Typed JSON is a semantic derivative, not a capture. | High | L2, L4-L5 and negative evidence inspection |
| L12 | INFERENCE | Custom extraction quality depends on upstream content scoping. | High | L7 |
| L13 | INFERENCE | Navigation output is an untrusted program-like proposal. | High | L6 |
| L14 | RECOMMENDATION | Separate capture, typed extraction, normalization, and frontier admission. | High | Adopted architecture |
| L15 | RECOMMENDATION | Hosted output may be a bounded comparator, never the owned evidence plane. | High | Provider deferred |

## 13. Bounded curiosity pass

After synthesis, in-frame gaps were scored 1–5 for **relevance (R)**,
**decision value (V)**, **novelty (N)**, and **cost (C, lower is better)**.
Priority was approximately `R + V + N - C`. Only public primary-source checks
requiring no account or request were eligible.

| Thread | R/V/N/C | Decision and result |
|---|---:|---|
| Exact standard schemas and confidence semantics | 5/5/4/2 | **Pursued.** Rendered OpenAPI establishes sparse required fields, type versus uncalibrated item probability, and no general field confidence [S1]. |
| `userHtml` timestamp provenance | 5/5/5/1 | **Pursued.** Required `dateDownloaded` conflicts semantically with explicit no-download mode; meaning remains unknown [S1][S2]. |
| Navigation as executable request output | 5/5/5/1 | **Pursued.** Methods include POST/PUT/DELETE/TRACE/PATCH plus headers/body; elevated to rejection criterion [S1]. |
| Custom truncation/error/PII metadata | 5/5/4/1 | **Pursued.** Found token before/after truncation, embedded errors, and excluded attribute names; PII mechanism remains unknown [S1]. |
| DOM-only guide/reference drift | 4/4/4/1 | **Pursued.** Contradiction retained; no runtime claim made [S1][S2]. |
| Cache/freshness contract | 5/5/3/2 | **Pursued to saturation.** No ordinary cache disposition, bypass, or live-fetch guarantee found; negative result retained. |
| Hidden model architecture, prompts, training data, or anti-bot methods | 1/1/5/5 | **CURIOSITY_NO_GO:** proprietary, terms-sensitive, unnecessary for contract evaluation, and outside clean-room authority. |
| Live accuracy/cache/SSRF/browser tests | 4/5/3/5 | **CURIOSITY_NO_GO:** caller prohibited credentials, paid tests, and requests; no authorized isolated fixture frame. |
| Account-only assurance/subprocessor material | 4/5/2/5 | **CURIOSITY_NO_GO:** unavailable within public no-account budget; retained as procurement gate. |
| Copy provider schemas into Curiosity implementation | 1/1/1/5 | **CURIOSITY_NO_GO:** no implementation authority; violates provider-neutral clean-room purpose. |
| Jurisdiction-specific scraping/employment legality | 5/5/3/5 | **CURIOSITY_NO_GO:** requires target, purpose, data, jurisdiction, and counsel facts outside research authority. |

**Stop reason:** coverage plus saturation. Every requested category has primary
evidence or an explicit unknown. Remaining material questions require an account
agreement, vendor answer, assurance access, counsel, or separately authorized
controlled evaluation. No live autonomous follow-up is authorized.

## 14. Checks performed and clean-room transfer rules

- Read repository `AGENTS.md`; preserved provider-neutral contracts and
  untrusted-data boundaries.
- Used only public first-party Zyte sources accessed 2026-08-17.
- Inspected the publicly rendered OpenAPI without calling the API.
- Made no credentialed, free-credit, paid, target-page, or bypass request.
- Retained documentation conflicts and negative results rather than guessing.
- Wrote only `docs/research/products/zyte-automatic-extraction.md`.

Transfer rules:

1. Transfer behavioral requirements and acceptance criteria, not Zyte prompts,
   models, training data, private methods, target playbooks, or schema prose.
2. Author neutral schemas independently; keep Zyte field names/model IDs inside
   an adapter specification.
3. Do not inspect service binaries/private interfaces or attempt prohibited
   source discovery [S11].
4. Do not use provider examples or outputs as training truth without separate
   rights, provenance, and evaluation review.
5. Re-check OpenAPI, model lifecycle, pricing, Terms, AUP, DPA, and Privacy
   Policy immediately before procurement.

## 15. Primary sources

All sources are first-party Zyte materials accessed **2026-08-17**. Mutable
documentation, model lists, prices, and policies are point-in-time.

- **[S1]** Zyte, “Zyte API reference documentation,” rendered OpenAPI 1.0.0 —
  request/response schemas, fields, metadata, bounds, and compatibility.
  <https://docs.zyte.com/zyte-api/usage/reference.html>
- **[S2]** Zyte, “Zyte API automatic extraction” — types, source modes,
  `userHtml`, and model pinning.
  <https://docs.zyte.com/zyte-api/usage/extract/index.html>
- **[S3]** Zyte, “Custom attributes extraction” — LLM scope, schemas, methods,
  quality guidance, generation, and transformation caveats.
  <https://docs.zyte.com/zyte-api/usage/extract/custom-attributes.html>
- **[S4]** Zyte, “Zyte API browser automation” — rendered artifacts, actions,
  partial outcomes, and browser limits.
  <https://docs.zyte.com/zyte-api/usage/browser.html>
- **[S5]** Zyte, “Zyte API error handling” — outer success, extraction mismatch,
  extractor overload, typed errors, retries, and charging boundary.
  <https://docs.zyte.com/zyte-api/usage/errors.html>
- **[S6]** Zyte, “Zyte API pricing” — extraction/custom costs, acquisition tiers,
  plans, discounts, and spend controls.
  <https://docs.zyte.com/zyte-api/pricing.html>
- **[S7]** Zyte, “Zyte API frequently asked questions” — 10 MB raw/rendered
  response limit and truncation.
  <https://docs.zyte.com/zyte-api/faq.html>
- **[S8]** Zyte, “Zyte API rate limits” — 3,000 RPM standard limit and
  website/account-website limits.
  <https://docs.zyte.com/zyte-api/usage/rate-limit.html>
- **[S9]** Zyte, “Zyte API Stats API” — extraction dimensions, aggregate cost and
  latency, separate key, 20 RPM, and delayed domain health.
  <https://docs.zyte.com/zyte-api/usage/stats/index.html>
- **[S10]** Zyte, “Terms of Service” — Service Data, product development/training,
  public-access boundary, customer responsibility, and rights disclaimers.
  <https://www.zyte.com/terms-policies/terms-of-service/>
- **[S11]** Zyte, “Acceptable Use Policy” — prohibited access/use, screenshot and
  AI-system restrictions, target interference, and reverse-engineering boundary.
  <https://www.zyte.com/terms-policies/acceptable-use-policy/>
- **[S12]** Zyte, “Data Processing Agreement” — roles, security measures,
  subprocessors/transfers, incidents, and deletion/retention framework.
  <https://www.zyte.com/terms-policies/dpa/>
- **[S13]** Zyte, “Privacy Policy” (page states effective 2024-08-30) — personal
  data, international processing, purpose-based retention, and rights.
  <https://www.zyte.com/terms-policies/privacy-policy/>

## 16. Confidence summary

- **High:** endpoint/type/source contract; rendered schema fields; mismatch and
  list-score semantics; `userHtml` no-fetch behavior; custom schema/method/token
  contract; errors; public limits/prices; public legal text.
- **Medium:** functional architecture; completeness of negative searches across
  mutable docs; security-control effectiveness described contractually.
- **Low / unknown:** empirical accuracy and calibration; cache/live-fetch
  behavior; `userHtml` timestamp semantics; current private model/runtime and
  PII detector; exact retention/regions/subprocessors/isolation; item-level
  execution lineage; account-specific contractual exceptions; actual target cost.
