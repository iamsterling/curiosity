# Firecrawl Extract: clean-room reverse-engineering dossier

**Research and source-access date:** 2026-08-17  
**Subject:** hosted and self-hosted `POST /v2/extract` and
`GET /v2/extract/{id}` only; other Firecrawl surfaces appear only where Extract
depends on them  
**Pinned OSS release:** `v2.11.162`, resolved checkout
`7666c1f9ae8720a6bba271e0f60b6a217f8a5210`  
**Status:** research only. No API call, paid operation, target fetch, deployment,
traffic interception, vulnerability probe, or source-code transfer was
performed. This is not legal advice or a quality benchmark.

## Executive verdict

**REJECT Firecrawl Extract as a new Curiosity foundation or durable provider
contract (high confidence).** The endpoint is beta, explicitly deprecated in the
pinned v2 server, and has two inconsistent named successors: current feature
documentation calls `/agent` “the successor,” while the server emits deprecation
headers directing clients to synchronous `/v2/scrape` with JSON format. No
sunset date is published [S1][S9]. Building a new dependency on this moving
surface would create migration work before its evidence and safety gaps were
solved.

**ADAPT a few ideas, not the implementation (high confidence):** asynchronous
job submission, schema-or-prompt extraction, explicit source display, a
discovery-to-fetch-to-derive pipeline, schema-aware multi-entity handling, and
separate operational/model usage are useful patterns. Curiosity should split
these more strongly into `discover`, `capture`, `extract`, and `collate`, with
immutable captures and span-level evidence.

**REJECT Extract output as factual capture or sufficient citation evidence
(high confidence).** The response is model-generated, collated JSON. Optional
`sources` associate a result field or array item with one or more URLs, but not
with capture versions or exact supporting spans. The contract omits fetch time,
redirect chain, response headers/status, body hash, renderer and model version,
cache age, transformation lineage, and confidence. Pinned source also reveals a
forced four-hour scrape cache eligibility window that the caller cannot reduce
through `scrapeOptions.maxAge` [S2][S10][S14][S18].

**DEFER any controlled comparison until a concrete evaluation frame is
authorized (high confidence).** A permitted test would need owned fixtures,
freshness revisions, prompt-injection cases, strict spend and fan-out limits,
and a current commercial/privacy review. No autonomous follow-up is authorized
by this dossier.

## 1. Decision frame and bounded method

### 1.1 Decision and sub-questions

The decision is whether Firecrawl Extract's observable contract or clean-room
design lessons should influence Curiosity without copying AGPL server code,
depending on an already-deprecated interface, or giving a model uncontrolled
retrieval authority.

Bounded questions:

1. What do schema, prompt, URL, discovery, scrape, job, and output contracts
   actually mean?
2. Which fetch, map, render, cache, queue, storage, and model paths does Extract
   depend on?
3. What provenance and freshness can a consumer prove from a response?
4. How are hostile content, SSRF, prompt injection, resource fan-out, time, and
   output bounded?
5. What are current limits, errors, rate limits, billing, retention, privacy,
   legal, and license constraints?
6. Which architecture claims are facts, bounded inferences, or unknowns?
7. What should Curiosity adopt, adapt, reject, or defer?

### 1.2 Evidence and clean-room rules

Primary sources were Firecrawl's current official feature/API, billing, limits,
deployment, legal, and privacy pages plus a read-only checkout of the pinned OSS
release. Source inspection characterizes that release; it does **not** prove
that Firecrawl Cloud runs identical code or configuration. Vendor claims prove
what Firecrawl publishes, not comparative accuracy, security, or compliance.

- **FACT** — directly supported by a cited primary source or pinned source file.
- **INFERENCE** — a bounded explanation consistent with the facts, not an
  observed proprietary implementation.
- **RECOMMENDATION** — a Curiosity design or governance choice.
- Confidence is **high**, **medium**, or **low**.

**Research boundary:** public, no-account materials and openly available source;
no service requests, credentials, bypass, reverse engineering of proprietary
Fire-engine/Cloud protocols, or implementation copying. **Stop rule:** every
requested category has primary evidence or an explicit unknown, and additional
inspection repeats an established pattern or requires controlled testing/vendor
disclosure.

## 2. Lifecycle status: beta and already deprecated

**FACT (high):** the feature page labels Extract beta, describes `/agent` as its
successor, and lists known limitations: incomplete massive-site coverage,
unreliable complex universal queries, run-to-run inconsistencies, and evolving
behavior [S1].

**FACT (high):** in the pinned release, both v2 Extract routes run deprecation
middleware. Responses receive `Deprecation: true`, a successor link, warning,
and body fields identifying `/v2/scrape` with a JSON format object as the
replacement. The table defines no `Sunset` date [S9].

**FACT (high):** the public OpenAPI continues to publish both routes without a
deprecation marker. The status schema still includes `cancelled`, but the pinned
v2 router exposes only POST submit and GET status—no Extract cancellation route
[S2][S3][S8].

**INFERENCE (high):** “successor” is not a stable architectural commitment here.
`/agent` replaces broad discovery/research behavior, whereas `/scrape` JSON
replaces known-page structured extraction. Extract combines both, which is
likely why replacement guidance diverges.

**RECOMMENDATION (high):** do not create a Curiosity adapter to `/extract`.
Evaluate successor capabilities as separate primitives if separately requested;
never preserve the old endpoint's conflation merely for compatibility.

## 3. Request contract

### 3.1 Publicly documented body

| Field | Published semantics | Material caveat |
| --- | --- | --- |
| `urls` | URL array, with experimental `/*` domain wildcard | OpenAPI marks it required; feature docs and source permit prompt-only use. Pinned source caps the input array at 10. |
| `prompt` | Natural-language extraction instruction | Maximum 10,000 characters in source, not shown in Extract OpenAPI. Prompt-only mode invokes web discovery. |
| `schema` | JSON Schema for final structured data | Validated then normalized for model compatibility; it is not preserved literally. |
| `enableWebSearch` | Allow related external information | Source transforms this into `allowExternalLinks=true`; it changes acquisition scope, not just enrichment. |
| `ignoreSitemap` | Ignore sitemap files | Published in OpenAPI, but pinned F0 URL processing hard-codes sitemap use rather than reading this field. |
| `includeSubdomains` | Scan subdomains; default `true` | A broad default for wildcard mapping. |
| `showSources` | Return sources | URL associations only, not evidence spans or capture manifests. |
| `scrapeOptions` | Shared Scrape acquisition/render options | Large nested authority surface; Extract overrides at least freshness and, in multi-entity mode, main-content selection. |
| `ignoreInvalidURLs` | Default `true`; continue and report invalid URLs | Initial invalid/blocked URLs can be omitted from the job rather than failing it. |
| `threatProtection` | Enterprise per-request policy override | Off by default at organization level; normal scanning costs extra credits. |

Sources: [S1][S2][S10].

### 3.2 Source-visible contract drift

**FACT (high):** the pinned strict request schema accepts additional fields not
shown in current Extract OpenAPI: `systemPrompt` (10,000 characters), positive
unbounded `limit`, `allowExternalLinks`, `urlTrace`, positive `timeout >= 1000`,
`agent`, webhook configuration, and experimental step/usage/source/cost flags.
It accepts at most ten input URLs and requires only that `urls` or `prompt` be
present [S10].

**FACT (high):** this means URL-only input with neither prompt nor schema passes
the server schema, despite feature prose saying prompt is optional only when a
schema exists and schema is optional only when a prompt exists. Conversely,
OpenAPI requires `urls`, while feature examples and server tests accept prompt-
only input [S1][S2][S10][S25].

**FACT (high):** URL preprocessing adds `http://` when no protocol is supplied,
then requires HTTP(S), a plausible public TLD/path, and shared URL validation.
The endpoint separately applies a blocklist and optional threat policy. Invalid
URLs are returned only when the default `ignoreInvalidURLs=true` behavior is
used [S10][S11].

**FACT (high):** `enableWebSearch=true` is normalized to
`allowExternalLinks=true`. In F0 processing, **any** exact URL with external
links enabled takes the map/rerank path rather than the direct single-URL path.
Thus the option can replace “extract this page plus supporting context” with
“map and choose links around this seed” [S10][S15].

**FACT (high):** `ignoreSitemap` is parsed but F0 calls its map helper with
`ignoreSitemap: false`; `request.timeout` is parsed but the F0 service uses
hard-coded scrape and completion timeouts. The `agent` object defaults to a
`fire-1` string shape, yet the pinned extract worker always invokes the F0
service; it only explicitly rejects `v3-beta`. These fields should not be
treated as demonstrated behavior in this release [S8][S10][S12][S14][S15].

**RECOMMENDATION (high):** a provider-neutral contract must validate locally,
pin a provider revision, send explicit bounded values, and test behavior rather
than infer it from generated OpenAPI, feature prose, or an SDK signature.
Provider-accepted but undocumented knobs must not leak into Curiosity's public
core.

## 4. Schema and prompt semantics

### 4.1 Schema is transformed, not simply enforced

**FACT (high):** request validation first asks AJV to compile the supplied JSON
Schema. It then normalizes it for OpenAI-compatible structured output: among
other changes, object `additionalProperties` can be removed and invalid
`required` names are removed. It rejects a schema-less dictionary represented
as an object with `additionalProperties: true` and no declared properties
[S10].

**FACT (high):** before model extraction, F0 applies a second normalization. It
removes constraints including defaults, patterns, formats, string/number bounds,
array cardinality/uniqueness, and several object constraints; makes every object
property required; and sets `additionalProperties=false`. Top-level arrays are
temporarily wrapped in an object for structured generation [S18].

**INFERENCE (high):** “must conform to JSON Schema” overstates fidelity. The
input may be syntactically valid JSON Schema but its validation intent can be
weakened or changed before generation. For example, `maxItems`, `maximum`,
`pattern`, and `format` cannot be relied upon as model-output resource or value
guards in pinned F0.

**FACT (high):** without a schema, F0 asks `gpt-4o-mini` (or a configured model
override) to generate a simple schema from the prompt. It tries temperatures
0, 0.1, and 0.3, and explicitly tells the model not to use formats or min/max
constraints [S18].

### 4.2 Prompt hierarchy and untrusted content

**FACT (high):** callers can supply both a user prompt and an undocumented
`systemPrompt`. For single-answer extraction, caller system text is prepended
to Firecrawl's “use provided content / do not hallucinate” system text. The
runtime user prompt also includes the current timestamp. For multi-entity
extraction, a stronger system suffix explicitly labels page content untrusted
and instructs the model to ignore page-hosted schema or data-processing
directions [S19][S20].

**FACT (high):** the common structured-generation prompt additionally says to
ignore data-processing directives embedded in content. Page metadata has
newlines/control characters removed and each value is capped to 250 characters,
but page Markdown itself remains model input [S18][S24].

**INFERENCE (high):** these are useful prompt-injection mitigations, not a
security boundary. A caller-supplied system prompt can change extraction
behavior; hostile page text still enters model context; reranking consumes
attacker-controlled URL/title/description text; and no output field proves that
the model followed the intended hierarchy.

**RECOMMENDATION (high):** Curiosity should not expose arbitrary system prompts.
Use a fixed reviewed extraction policy, treat schema and query as data, isolate
page content in a typed untrusted channel, validate outputs deterministically,
and require supporting spans. Model output must never authorize more network
requests or actions.

## 5. Acquisition, discovery, and rendering dependencies

### 5.1 Observable pipeline

The pinned F0 implementation supports this bounded architecture inference:

```text
strict request validation
  -> optional prompt-to-search-query -> up to 10 search URLs
  -> per-seed direct selection OR map + model rerank
  -> shared scrape queue (static/render/parse engine chosen downstream)
  -> prompt-to-schema when schema absent
  -> model classification: single answer vs multi entity
  -> model extraction over all selected documents or one document at a time
  -> deterministic-ish transform/deduplicate/merge
  -> URL-level source association
  -> final-result-sized credit calculation
  -> Redis/GCS result + database/activity record
```

**FACT (high):** prompt-only mode first uses a model to rewrite the prompt as a
search query, requests ten search results, and mutates those result URLs into the
job input [S14].

**FACT (high):** an exact URL with external links disabled bypasses mapping and
is scraped directly. A `/*` seed or externally widened request removes the
wildcard, calls Firecrawl's map helper, retries with a broader map if one or
fewer unique URLs are found, retains at most 1,000 candidates per seed, and
model-reranks URL/title/description chunks of 100. If more than 100 survive, a
second rerank runs [S15][S16].

**FACT (high):** selected URLs become internal scrape jobs with billing bypassed
(Extract bills separately). They use the shared scrape pipeline and whatever
static, Playwright, document, proxy, or Cloud engine its capability selection
chooses. Default self-host includes basic fetch and Playwright; advanced
Fire-engine behavior, screenshots, and actions require separately configured or
Cloud services [S7][S12][S14].

**FACT (high):** `scrapeOptions` can carry shared acquisition settings such as
headers/cookies, wait, mobile, TLS verification, parsers, browser actions,
location, proxy, ad blocking, cache storage, persistent profile, and threat
policy. This makes Extract more than a passive text-to-JSON function [S2].

**FACT (high):** F0 overwrites `scrapeOptions.maxAge` with four hours for every
internal scrape. Therefore a caller's `maxAge=0` cannot force a live scrape via
Extract in this release. Single-answer jobs with no `scrapeOptions` default the
internal helper to `onlyMainContent=false`; multi-entity jobs force
`onlyMainContent=true` [S14].

**INFERENCE (medium):** hosted acquisition quality can depend on proprietary
Cloud engines and services not represented by the default OSS deployment.
Source proves fallback-capable plumbing, not Cloud engine choice or parity.

**RECOMMENDATION (high):** Curiosity should fetch/capture before extraction.
Static HTTP should be default; browser rendering should be a separately
authorized, sandboxed escalation with a reason and budget. Extraction must not
accept cookies, persistent profiles, arbitrary actions, or JavaScript execution.

## 6. Model use and result collation

**FACT (high):** pinned F0 names `gpt-4o-mini` for query rewriting, schema
generation, normal extraction, JSON repair, relevance checks, and link reranking
through the common extraction transformer. It names `gpt-4.1` for deciding
single-answer versus multi-entity shape. `MODEL_NAME` can globally replace these
names; the default provider is OpenAI unless `OLLAMA_BASE_URL` is configured.
The generic provider layer also contains other providers, but F0 calls do not
demonstrate their use in Cloud [S15][S16][S18][S21][S23].

**FACT (high):** the multi-entity classifier can split large array keys away
from top-level single-answer fields. Multi-entity pages first receive a model
relevance check, then per-page structured extraction; outputs are transformed,
deduplicated, and null-valued objects can be merged. Single-answer extraction
concatenates all selected documents into one completion [S14][S19][S20][S21].

**FACT (high):** malformed model JSON may receive a second model call to repair
it. Model refusal raises a special internal error. The public result does not
identify repairs, model/provider/version, classifier decisions, or extraction
temperature [S18].

**INFERENCE (high):** final values may be synthesized across multiple pages,
generated after truncation, merged from separately generated objects, or changed
by JSON repair. Schema conformance does not establish factual faithfulness.

**RECOMMENDATION (high):** Curiosity should record every derivation stage:
capture IDs, selected spans, prompt-policy version, schema digest, model/provider
revision, truncation, repair attempt, per-field validation, merge rule, and
source relation. Do not collapse all of this into one `data` object.

## 7. Output, sources, provenance, and freshness

### 7.1 Public job envelope

**FACT (high):** POST returns `success`, job `id`, and optionally
`invalidURLs`. GET returns `success`, collated object `data`, one of
`processing|completed|failed|cancelled`, `expiresAt`, and optionally
`tokensUsed` in OpenAPI. Feature examples also show error/warning/sources, and
pinned status source can expose sources, credits, session IDs, steps, LLM usage,
and cost tracking when internal flags enabled [S1][S2][S3][S8][S11].

**FACT (high):** `showSources` associates each top-level single-answer property
with the complete list of documents supplied to that completion. For
multi-entity arrays, source keys such as `products[3]` are inferred by matching
or “mergeable” generated objects back to per-page results [S14][S22].

**INFERENCE (high):** sources are coarse attribution, not grounding. A URL in a
field's source list does not prove that page supports the value; single-answer
fields all receive the same broad document list, and multi-entity associations
follow generated-object matching after merging. There are no quotes, offsets,
DOM selectors, span hashes, or entailment evidence.

### 7.2 Freshness and storage contradictions

**FACT (high):** the feature page says completed results remain available from
the API for 24 hours and remain viewable afterward in activity logs [S1].

**FACT (high):** pinned OSS uses a six-hour Redis TTL for mutable job metadata
and a 24-hour Redis TTL for final result fallback. With GCS configured, the
result is written there instead. The database log stores the full request
options and job outcome; public source does not establish a GCS or activity-log
deletion TTL [S11][S13].

**FACT (high):** status fallback under database authentication computes expiry
as creation time plus 24 hours—not completion plus 24 hours. In-progress Redis
status computes expiry from the remaining six-hour metadata TTL. The default
unauthenticated self-host path has no demonstrated robust status fallback after
that Redis metadata expires [S8][S11].

**FACT (high):** internal page acquisition is eligible for captures up to four
hours old. Neither POST nor GET promises `cachedAt`, cache hit/miss, actual fetch
time, or page version, and the final output lacks capture hashes [S2][S3][S14].

**INFERENCE (high):** a consumer cannot determine whether a result describes the
target at submission time, when its pages were acquired, whether pages came
from one temporal snapshot, or whether two jobs used the same captures.
`expiresAt` is result-access metadata, not source freshness.

**RECOMMENDATION (high):** never convert request time to fetch time or treat an
Extract job ID as a capture ID. Curiosity needs a local evidence envelope with
requested/canonical/final URLs, redirect chain, fetch time, status/media type,
selected headers, body hash, bytes/truncation, cache state, rendering mode,
robots/policy decision, parser version, and immutable artifact reference.

## 8. Hostile input and resource bounds

### 8.1 Positive bounds found

**FACT (high):** the pinned request schema caps input URLs at ten and prompt and
system prompt at 10,000 characters. Shared scrape timeout input has documented
1–300 second bounds, and shared browser-action wait is capped. The generic API
documents HTTP 413 for oversized request bodies [S2][S4][S10].

**FACT (high):** candidate mapping is truncated to 1,000 URLs per seed before
reranking. Reranking batches 100 links, uses a 20-second race, and retries twice.
Multi-entity extraction processes document chunks of 50 sequentially, while
documents inside a chunk run concurrently; each completion has a 45-second
race. Internal scrapes wait 60 seconds [S14][S15][S16].

**FACT (high):** model input is trimmed to 80% of the configured model's input
limit. Before synchronous tokenization, F0 caps input characters at five times
that token budget. If still over limit, it token-truncates; on tokenizer failure
it applies a conservative character fallback [S18].

### 8.2 Material missing or ineffective bounds

**FACT (high):** `limit` is any positive finite integer with no Extract-specific
maximum. Ten wildcard seeds can each contribute up to 1,000 candidates before
deduplication across the combined list. Map/rerank promises and selected-page
scrapes are created with broad `Promise.all` fan-out; worker queue prefetch is
one job, but one job can fan out internally [S10][S12][S14][S15][S16].

**FACT (high):** the top-level request `timeout` is not used as an end-to-end F0
deadline. Per-stage timeout races do not cancel the underlying model promise,
and there is no published maximum job duration, selected pages, fetched bytes,
decompressed bytes, DOM nodes, redirects, total model calls, schema bytes/depth,
final JSON bytes/items, or sources count [S10][S14][S16][S18].

**FACT (high):** single-answer mode concatenates selected documents and then
prefix-truncates the combined model input. Later documents can therefore be
silently excluded. The trimming warning produced by the model helper is not
propagated through single-answer or batch completion wrappers to the final
Extract response [S18][S19][S20].

**FACT (high):** schema limits such as `maxItems`, string bounds, and numeric
bounds are stripped before model generation, so caller schema cannot be relied
upon to cap output. Final model output and intermediate generated objects remain
untrusted data [S18].

**INFERENCE (high):** nominal “10 URLs” is not a work bound. Wildcards,
subdomains by default, external discovery, browser options, map retries, model
reranking, per-page relevance calls, extraction, and repair can amplify one job
substantially.

**RECOMMENDATION (high):** Curiosity must impose independent hard budgets:
seeds, discovered URLs, selected captures, origins, redirects, bytes compressed
and expanded, render minutes, wall time, model calls/tokens, schema nodes/depth,
output bytes/items, and cost. Cancellation must propagate to queued fetches and
model calls. Never accept silent prefix truncation as complete extraction.

### 8.3 Network and content safety

**FACT (high):** initial URLs receive schema/blocklist checks and optional
Enterprise Threat Protection; pinned F0 threads the resolved policy into
discovered-page scrapes. Threat Protection is off by default and distinguishes
malware/social-engineering URL classification from content-level prompt
injection [S6][S11][S14].

**FACT (high):** the shared pinned fetch and Playwright paths contain resolved-IP
and request-level private-network checks, including redirect/browser requests.
These are meaningful OSS controls but not proof for every Cloud engine, proxy,
file parser, action, or webhook path [S26][S27].

**Negative result (high):** no Extract-specific public guarantee was found for
prompt-injection elimination, malware scanning by default, output link safety,
Markdown sanitization, secret detection, adult-content filtering, download
blocking, or browser-action containment. Threat Protection is an optional
Enterprise URL classifier, not a default content trust boundary [S1][S2][S6].

**RECOMMENDATION (high):** reject credentials in URLs, private/special IPs,
nonstandard ports, signed URLs, cookies, arbitrary headers/actions, and private
pages before provider disclosure. Treat returned strings and URLs as untrusted;
do not render them as trusted HTML, auto-fetch them, or let them trigger tools.

## 9. Errors, completion semantics, and operability

**FACT (high):** submission documents 200/400/500 only in endpoint OpenAPI, but
shared middleware and the general catalog also permit 401, 402, 403, 413, 422,
429, and upstream/server timeout classes. Errors are primarily human-readable
strings; some 403 responses include a stable threat code [S2][S4][S6][S8].

**FACT (high):** the job is all-or-collated-result at status level. Individual
scrape failures become null documents and may leave URL-trace errors internally,
but the ordinary documented response has no stable per-URL outcome array.
Successful completion can therefore represent extraction from only the pages
that survived discovery, scrape, relevance, timeout, and model stages [S8][S14].

**FACT (high):** handled worker errors are acknowledged rather than retried.
Queue messages are durable quorum messages with prefetch one, a delivery limit
of one, and a dead-letter queue. A crash reaching the DLQ marks the job failed;
the DLQ handler itself requeues if its failure handling fails [S12].

**FACT (high):** source comments and implementation disagree in places: the
Redis link limit constant is 100 while comments say 20; public status promises
24-hour availability while mutable status TTL is six hours; and public status
includes `cancelled` without a v2 cancellation route [S1][S3][S8][S11]. These
are retained as contract-quality signals, not generalized reliability claims.

**RECOMMENDATION (high):** Curiosity outcomes need typed per-input/per-capture
states (`selected`, `policy_denied`, `fetch_failed`, `too_large`, `truncated`,
`model_refused`, `schema_invalid`, `derived`, `unsupported`) plus coverage counts.
A completed job must never imply complete domain or field coverage.

## 10. Limits, rate limits, and pricing

### 10.1 Published limits

**FACT (high, time-sensitive):** Extract shares Agent request limits: Free 2,
Hobby 20, Standard 100, Growth 1,000, and Scale 2,000 requests per minute.
Limits are team-wide. Concurrent browser caps are 2/5/50/100/150+ by plan, and
queued jobs can wait up to 48 hours [S5].

**FACT (high):** pinned routing requires a 20-credit preflight balance before
accepting Extract. This is an admission check, not the final job charge [S8].

### 10.2 Extract billing is output-sized and incompletely documented

**FACT (high):** the feature page says one credit equals 15 Extract “tokens.”
Pinned F0 estimates billable tokens from serialized **final result** length as
`floor(characters / 4 + 300)` and charges `ceil(tokens / 15)` credits. Internal
page scrapes bypass ordinary scrape billing; actual LLM token usage is estimated
separately [S1][S14][S17].

**INFERENCE (high):** these billable “tokens” are a product meter, not actual
model tokens. The 300-token base implies at least 20 credits for an ordinary F0
success, matching route preflight. A larger output—not necessarily more fetched
pages or more model work—raises the final Extract charge in pinned OSS.

**FACT (high):** current general billing tables do not list Extract as a row;
pricing lists Agent dynamic and feature docs carry the 15-token statement. The
general JSON-extraction `+4/page` price is documented for Scrape/Crawl/Search,
not clearly for deprecated `/extract`. Threat Protection Normal mode adds two
credits per scanned URL [S1][S6][S28].

**FACT (high):** current plans display Free 1,000 credits; paid 5,000 / 100,000 /
500,000 / 1,000,000 credit starting tiers; and annual-billing prices of $16,
$83, $333, and $599 per month. Smart Upgrade can automatically move a team to a
higher tier unless disabled [S28][S29]. Prices and product rules can change.

**Unknown:** exact hosted Extract billing for failed jobs, partially scraped
jobs, model refusal, timed-out-but-still-running model calls, cached pages,
wildcard mapping, and FIRE-1 preview requests. The pricing FAQ's “successful
requests only” and general billing's charge for infrastructure-processed origin
errors do not resolve deprecated Extract's collated job semantics [S28][S29].

**RECOMMENDATION (high):** do not budget from request count. Disable automatic
plan upgrades for evaluation, set a local per-job credit ceiling, record
admission estimate and final charge separately, and obtain written current
endpoint terms before procurement.

## 11. Privacy, retention, legal use, and license

### 11.1 Extract does not support zero data retention

**FACT (high):** pinned controller rejects Extract for teams with forced ZDR and
says the feature is unsupported. Every internal scrape is marked
`zeroDataRetention: false`. Controller logging includes parsed and original
requests; durable Extract logging stores URLs and the complete request options;
results go to configured GCS or 24-hour Redis fallback [S11][S13][S14].

**INFERENCE (high):** prompts, schemas, requested URLs, and nested scrape options
such as headers/cookies can enter operational logs or durable job records. The
OSS paths show this possibility; exact Cloud logging redaction, access, backup,
and deletion are unknown.

**FACT (high):** Firecrawl's privacy policy says personal information is used
for caching and indexing, servers are in the United States, and PII is currently
retained until a written deletion request rather than under a recurring deletion
schedule. It does not provide an Extract-specific prompt/result/model-provider
retention matrix [S30].

**RECOMMENDATION (high):** never send authenticated/private URLs, cookies,
authorization headers, personal datasets, presigned links, secrets, or sensitive
prompts to hosted Extract. An eventual provider review needs a DPA, subprocessor
and model-provider matrix, regions, log/cache/backup TTLs, deletion SLA,
training/improvement terms, and tenant-isolation evidence.

### 11.2 Publisher and service terms

**FACT (high):** Firecrawl terms place lawful use and third-party-content risk on
the user, disclaim timeliness/accuracy, prohibit disseminating another person's
PII without permission, and restrict debt collection, hard background checks,
FCRA uses, intelligence-agency people surveillance, and evidentiary law-
enforcement/criminal-prosecution uses. They also prohibit decompiling or reverse
engineering the hosted service [S31].

**Negative result (high):** Extract exposes no returned robots verdict,
publisher license, `noarchive`/`noindex` decision, terms-policy decision, or
takedown status. Shared Crawl/Map/Scrape behavior must not be converted into a
claim that every hosted Extract acquisition path universally enforces the same
policy.

**RECOMMENDATION (high):** successful extraction is not permission to collect,
retain, republish, or train on page content. Curiosity must own source
eligibility, robots/politeness, rights, quotation, deletion, and audit policy.

### 11.3 AGPL clean-room boundary

**FACT (high):** the pinned repository root and API server are primarily
AGPL-3.0; identified SDKs and some UI components have separate MIT licenses.
AGPL section 13 applies source-offer obligations to a modified covered program
used over a network [S32][S33].

**INFERENCE (high):** public HTTP behavior and independently authored contract
requirements can be studied clean-room. Copying server schemas, prompt text,
tests, source tracking, merge algorithms, or worker code into permissively
licensed Curiosity code would create avoidable license and provenance risk.

**RECOMMENDATION (high):** preserve this revision pin and attribution; author
any Curiosity contract independently from the requirements in this dossier; do
not copy code or prompts; and obtain legal review before modifying/deploying the
AGPL server or reusing even separately licensed SDK material. Cloud-only code is
not licensed merely because the core repository is public.

## 12. Architecture inference and clean-room lessons

### 12.1 What is justified

**INFERENCE (high):** Extract is an orchestration product, not one extractor. It
composes search/map discovery, model-based candidate selection, the shared
scrape/render queue, schema adaptation, multiple LLM decisions, per-page and
cross-page extraction, deterministic postprocessing, source approximation,
storage, and output-sized billing. This follows directly from pinned component
boundaries [S12]–[S24].

**INFERENCE (medium):** per-job worker serialization (prefetch one) controls the
number of top-level Extract jobs per worker, while most expensive work is
delegated and fanned out. It does not establish Cloud worker count, fair
scheduling, origin politeness, or tenant isolation.

**INFERENCE (high):** splitting single-answer from multi-entity extraction is a
reasonable quality/cost optimization, but the split itself is model-generated
and can alter acquisition and cleaning behavior. It belongs in lineage, not as
an invisible implementation detail.

### 12.2 What is not justified

The sources do **not** establish:

- Cloud's exact model/provider, model snapshots, prompts, or F0/FIRE-1 routing;
- that every mapped or selected URL is fetched live;
- comparative extraction accuracy, completeness, or reproducibility;
- exact Cloud render/proxy/anti-bot fallback order;
- universal robots, SSRF, threat, or browser isolation across every engine;
- cross-tenant cache/storage isolation;
- a stable Extract cancellation, idempotency, retry, or ordering contract;
- that source URLs support the associated values; or
- that self-hosted OSS and Cloud produce equivalent results.

## 13. Curiosity implications and verdict ledger

### 13.1 Provider-neutral decomposition

**RECOMMENDATION (high):** replace the monolith with four authority-separated
operations:

```text
discover(query_or_seed, scope, frontier_budget) -> UrlHint[]
capture(url, freshness_policy, render_policy, byte_budget) -> Capture
extract(capture_refs, schema, extraction_policy, model_budget) -> FieldClaims
collate(field_claims, merge_policy) -> DerivedArtifact
```

Minimum `FieldClaim` evidence should include capture ID and body hash, exact
span/selector or quote hash, schema field path, extraction/model policy versions,
truncation and repair flags, and confidence/validation status. `DerivedArtifact`
must retain every contributing claim and any merge/deduplication decision.

### 13.2 Verdicts

| Pattern or capability | Verdict | Curiosity treatment |
| --- | --- | --- |
| Async submit/poll job envelope | **ADAPTED** | Useful for bounded derivation; add cancellation, idempotency, deadline, coverage, and typed item outcomes. |
| Schema plus natural-language intent | **ADAPTED** | Keep schema deterministic and immutable; query may guide extraction but cannot rewrite validation policy. |
| Prompt-only URL discovery | **REJECTED** inside extraction | Discovery is a separate, auditable operation with its own scope and budget. |
| Wildcard domain extraction | **REJECTED** for agent-facing use | Hidden, high fan-out and incomplete; use explicit crawl/frontier contracts. |
| Model link reranking | **ADAPTED** only after capture-neutral discovery | Preserve candidate set, scores/model/version, and deterministic cap; never treat omission as irrelevance fact. |
| Static/render fetch hidden under extraction | **REJECTED** | Capture first; render only through an isolated escalation lane. |
| Four-hour forced cache eligibility | **REJECTED** | Caller freshness policy must be enforceable and evidenced. |
| Single-answer vs multi-entity policy | **ADAPTED** | Explicit extraction strategy in lineage; deterministic override and evaluation required. |
| URL-level `sources` | **ADAPTED but insufficient** | Keep URL attribution, add immutable capture and span-level support. |
| Model JSON repair | **ADAPTED cautiously** | Record original/repair output and revalidate; repair cannot silently change factual content. |
| Output-sized credit metering | **REJECTED** as local resource control | Budget actual capture/render/model/storage work and output separately. |
| Arbitrary caller system prompt/actions/headers | **REJECTED** | Fixed policy; no credentials or active browser authority in extraction. |
| Hosted Extract as evidence foundation | **REJECTED** | Deprecated, opaque freshness, coarse sources, no ZDR, variable beta results. |
| Firecrawl Extract as evaluation comparator | **DEFERRED** | Only owned fixtures, current contract review, hard spend/fan-out limits, and caller authorization. |
| Copying pinned OSS internals/prompts | **REJECTED** | AGPL/provenance boundary; clean-room behavioral learning only. |

## 14. Unknowns and required checks before any evaluation

| Unknown | Why it matters | Required check |
| --- | --- | --- |
| Hosted endpoint sunset and supported successor | Adapter lifetime | Written product timeline and versioned migration contract. |
| Current Cloud F0/FIRE-1/model/provider/region routing | Privacy, quality, reproducibility | Vendor model/subprocessor matrix and returned version IDs. |
| Whether `ignoreSitemap`, `timeout`, `agent`, and caller `maxAge` work on Cloud | Contract drift | Owned-fixture conformance tests plus vendor confirmation. |
| Cache key, tenant isolation, revalidation, and actual capture time | Confidentiality and freshness | Architecture statement and controlled revision tests. |
| Full URL/page/model/output work ceilings | Cost and denial-of-service bounds | Written quotas and measured owned-fixture fan-out. |
| Cancellation and underlying task abortion | Cost containment | Contract test proving queued fetch/model cancellation, not status-only change. |
| Robots, redirect, SSRF, parser, action, and proxy consistency | Network/legal safety | Security design and authorized controlled tests across enabled engines. |
| Extract-specific prompt/result/log/cache/GCS/backup retention | Privacy/deletion | DPA, retention schedule, deletion SLA, and ZDR roadmap. |
| Source association accuracy after merge/deduplication | Citation validity | Field-and-span grounded benchmark on licensed fixtures. |
| Failed/partial/cached/wildcard/FIRE-1 billing | Spend predictability | Written billing schedule and free-credit reconciliation on owned fixtures. |
| Schema transformation contract | Output correctness/bounds | Versioned supported-key list and conformance suite. |
| Comparative quality and deterministic drift | Product value | Repeated benchmark with expected captures and scored fields. |

## 15. Fact / inference / recommendation ledger

| ID | Type | Claim | Confidence | Evidence / disposition |
| --- | --- | --- | --- | --- |
| F1 | FACT | Extract is beta and pinned v2 routes emit deprecation metadata. | High | [S1][S8][S9]; **REJECTED** as new dependency. |
| F2 | FACT | Feature docs name Agent as successor; server names Scrape JSON. | High | [S1][S9]; contradiction retained. |
| F3 | FACT | Source caps ten input URLs and 10k prompt/system text, but `limit` has no maximum. | High | [S10]. |
| F4 | FACT | OpenAPI, feature prose, and source disagree on URL/prompt/schema requirements and visible fields. | High | [S1][S2][S10][S25]. |
| F5 | FACT | Schema constraints are normalized/removed before generation and object fields become required. | High | [S10][S18]; schema fidelity caveat. |
| F6 | FACT | Prompt-only mode searches; wildcard/external mode maps and LLM-reranks; exact narrow URLs go direct. | High | [S14]–[S16]. |
| F7 | FACT | Internal scrapes force four-hour cache eligibility and bypass page billing. | High | [S14]. |
| F8 | FACT | F0 uses multiple model calls and distinguishes single-answer from multi-entity extraction. | High | [S14]–[S23]. |
| F9 | FACT | Sources are URL associations; no capture or span provenance is returned. | High | [S2][S8][S14][S22]. |
| F10 | FACT | Extract rejects forced ZDR and persists request/result state through Redis/GCS/database paths. | High | [S11][S13][S14]. |
| F11 | FACT | Per-stage limits exist, but no effective top-level F0 deadline or hard total fan-out/output bound is evident. | High | [S10][S14]–[S18]. |
| F12 | FACT | Pinned billing is based on serialized final-result size plus a base, not actual LLM usage. | High | [S14][S17]. |
| I1 | INFERENCE | Extract is orchestration over discovery, capture, multiple derivations, collation, and persistence—not a primitive extractor. | High | F6–F10. |
| I2 | INFERENCE | A completed job can be partial without a consumer-visible stable per-page failure ledger. | High | F6, F9, F11. |
| I3 | INFERENCE | Extract alone cannot support reproducible, time-specific citation. | High | F7, F9, F10. |
| I4 | INFERENCE | “10 URLs” is not a meaningful work/cost bound under wildcard or external discovery. | High | F3, F6, F11. |
| R1 | RECOMMENDATION | Separate discovery, capture, extraction, and collation authorities and records. | High | **ADOPTED** for Curiosity architecture. |
| R2 | RECOMMENDATION | Require immutable capture plus span-level support for every derived field. | High | **ADOPTED** evidence rule. |
| R3 | RECOMMENDATION | Treat page/model output as untrusted and enforce independent URL, byte, time, token, output, and action budgets. | High | **ADOPTED** safety rule. |
| R4 | RECOMMENDATION | Do not build an Extract adapter or copy AGPL internals. | High | **REJECTED** provider/foundation and source reuse. |
| R5 | RECOMMENDATION | Evaluate only with owned fixtures and a new caller-approved frame. | High | **DEFERRED**. |

## 16. Bounded curiosity pass

After synthesis, remaining in-frame gaps were scored 1–5 for relevance (R),
decision value (V), novelty (N), and investigation cost (C, lower is better).
Priority was `R + V + N - C`; only public primary-source and pinned-source checks
within the declared frame were pursued.

| Thread | R | V | N | C | Score | Action/result |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Deprecation successor contradiction | 5 | 5 | 5 | 1 | 14 | **Pursued.** Route middleware names Scrape JSON while feature docs name Agent; no sunset found. |
| Freshness/cache override | 5 | 5 | 5 | 2 | 13 | **Pursued.** Found forced four-hour internal `maxAge`; no fetch/cache provenance in response. |
| Schema fidelity and output bounds | 5 | 5 | 4 | 2 | 12 | **Pursued.** Found constraint removal and required-field normalization; caller schema is not a hard output-resource bound. |
| Top-level timeout/fan-out | 5 | 5 | 4 | 2 | 12 | **Pursued.** Request timeout is parsed but F0 uses stage constants; mapped candidates and concurrent work can amplify substantially. |
| Source precision after collation | 5 | 5 | 4 | 2 | 12 | **Pursued.** Single fields receive broad document lists; multi-item sources follow generated-object merge matching, not spans. |
| Retention/ZDR realization | 5 | 5 | 4 | 2 | 12 | **Pursued.** Extract rejects forced ZDR; metadata/result TTLs differ and long-term activity/GCS retention remains unknown. |
| Run hosted free/paid calls | 3 | 4 | 3 | 5 | 5 | **CURIOSITY_NO_GO.** Caller prohibited calls; no owned fixture and one-off results would not establish freshness or quality. |
| Probe SSRF, private URLs, redirects, or anti-bot targets | 4 | 5 | 3 | 5 | 7 | **CURIOSITY_NO_GO.** Security testing was not authorized; shared source controls were documented without bypass attempts. |
| Reverse-engineer Fire-engine or Cloud model routing | 3 | 3 | 4 | 5 | 5 | **CURIOSITY_NO_GO.** Proprietary/terms boundary and unnecessary for the reject/defer decision. |
| Copy prompts/tests to create a comparator | 2 | 2 | 2 | 5 | 1 | **CURIOSITY_NO_GO.** AGPL/provenance boundary; clean-room findings are sufficient. |
| Benchmark field accuracy | 5 | 5 | 3 | 5 | 8 | **DEFERRED.** Requires licensed fixtures, scoring rules, calls, and explicit caller authority. |

**Stop condition reached:** coverage and saturation. All requested categories have
primary evidence, a bounded inference, or an explicit unknown. Remaining
high-value questions require vendor disclosure or controlled service tests under
a new approved frame.

## 17. Checks performed

- Read repository `AGENTS.md` before research and retained provider-neutral,
  untrusted-data, licensing, and bounded-behavior requirements.
- Used primary Firecrawl sources accessed 2026-08-17 and pinned the OSS checkout
  to resolved commit `7666c1f9ae8720a6bba271e0f60b6a217f8a5210`.
- Distinguished public Cloud claims from pinned OSS behavior and labeled Cloud
  correspondence unknown where appropriate.
- Inspected Extract controllers, schema, routes/deprecation, queue/worker,
  discovery, scrape delegation, LLM extraction, prompts, source tracking,
  storage, logging, billing, deployment, and license boundaries.
- Made no Firecrawl API call, no paid call, no fetch against a target site, no
  exploit or bypass attempt, and copied no source implementation into Curiosity.
- Retained negative results and documentation/source contradictions rather than
  silently resolving them.
- File-scope check: this task writes only
  `docs/research/products/firecrawl-extract.md`.

## Sources

All web sources were accessed **2026-08-17**. Pinned source links resolve to
commit `7666c1f9ae8720a6bba271e0f60b6a217f8a5210` unless stated otherwise.

- **[S1]** Firecrawl, “Extract” feature documentation (beta, Agent successor,
  usage, source option, job retention, limitations, FIRE-1, 15 tokens/credit):
  <https://docs.firecrawl.dev/features/extract>
- **[S2]** Firecrawl v2 OpenAPI, POST Extract:
  <https://docs.firecrawl.dev/api-reference/endpoint/extract>
- **[S3]** Firecrawl v2 OpenAPI, GET Extract status:
  <https://docs.firecrawl.dev/api-reference/endpoint/extract-get>
- **[S4]** Firecrawl, API errors:
  <https://docs.firecrawl.dev/api-reference/errors>
- **[S5]** Firecrawl, rate and concurrent-browser limits:
  <https://docs.firecrawl.dev/rate-limits>
- **[S6]** Firecrawl, Threat Protection:
  <https://docs.firecrawl.dev/features/threat-protection>
- **[S7]** Firecrawl, open source versus Cloud and self-hosting guide:
  <https://docs.firecrawl.dev/contributing/open-source-or-cloud> and
  <https://docs.firecrawl.dev/contributing/self-host>
- **[S8]** Pinned v2 routes and Extract controllers:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/routes/v2.ts>,
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/controllers/v2/extract.ts>, and
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/controllers/v2/extract-status.ts>
- **[S9]** Pinned deprecation definitions and response middleware:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/lib/deprecations.ts>
- **[S10]** Pinned v2 request/schema/URL/response types:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/controllers/v2/types.ts>
- **[S11]** Pinned Extract Redis metadata/result state:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/lib/extract/extract-redis.ts>
- **[S12]** Pinned Extract worker and RabbitMQ queue:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/services/extract-worker.ts> and
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/services/extract-queue.ts>
- **[S13]** Pinned Extract durable logging/result storage:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/services/logging/log_job.ts>
- **[S14]** Pinned F0 orchestration and internal document scraper:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/lib/extract/fire-0/extraction-service-f0.ts> and
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/lib/extract/fire-0/document-scraper-f0.ts>
- **[S15]** Pinned F0 direct/map URL processing:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/lib/extract/fire-0/url-processor-f0.ts>
- **[S16]** Pinned F0 link reranker:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/lib/extract/fire-0/reranker-f0.ts>
- **[S17]** Pinned F0 final-result billing calculation:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/lib/extract/fire-0/usage/llm-cost-f0.ts>
- **[S18]** Pinned F0 model extraction, trimming, schema normalization, repair,
  and prompt-to-schema generation:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/lib/extract/fire-0/llmExtract-f0.ts>
- **[S19]** Pinned F0 single-answer completion:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/lib/extract/fire-0/completions/singleAnswer-f0.ts>
- **[S20]** Pinned F0 batch extraction and injection-aware prompts:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/lib/extract/fire-0/completions/batchExtract-f0.ts> and
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/lib/extract/fire-0/build-prompts-f0.ts>
- **[S21]** Pinned F0 schema classification and relevance check:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/lib/extract/fire-0/completions/analyzeSchemaAndPrompt-f0.ts> and
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/lib/extract/fire-0/completions/checkShouldExtract-f0.ts>
- **[S22]** Pinned F0 source tracker:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/lib/extract/fire-0/helpers/source-tracker-f0.ts>
- **[S23]** Pinned generic model/provider selection:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/lib/generic-ai.ts>
- **[S24]** Pinned model-document serialization and metadata sanitization:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/lib/extract/fire-0/build-document-f0.ts>
- **[S25]** Pinned v2 Extract schema tests:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/__tests__/snips/v2/types-validation.test.ts>
- **[S26]** Pinned shared safe fetch:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/scraper/scrapeURL/engines/utils/safeFetch.ts>
- **[S27]** Pinned Playwright service request/DNS controls:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/playwright-service-ts/api.ts>
- **[S28]** Firecrawl, billing and credit rules:
  <https://docs.firecrawl.dev/billing>
- **[S29]** Firecrawl, current pricing page:
  <https://www.firecrawl.dev/pricing>
- **[S30]** SideGuide Technologies / Firecrawl, Privacy Policy, last revised
  2024-12-26: <https://www.firecrawl.dev/privacy-policy>
- **[S31]** SideGuide Technologies / Firecrawl, Terms of Use, last revised
  2024-11-05: <https://www.firecrawl.dev/terms-of-service>
- **[S32]** Pinned repository README license/deployment statement:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/README.md>
- **[S33]** Pinned root AGPL-3.0 license:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/LICENSE>

## 18. Confidence summary

- **High:** pinned request validation, F0 orchestration, named model defaults,
  cache override, resource fan-out shape, source tracking, storage TTLs,
  deprecation headers, root license, and published product/price/legal text.
- **Medium:** correspondence between pinned OSS and current Cloud; hosted engine,
  model, storage, and billing realization; whether accepted-but-unused source
  fields behave differently in Cloud.
- **Low / unknown:** comparative accuracy/completeness, Cloud cache isolation,
  exact fetch times, universal robots/SSRF/action enforcement, activity/GCS
  retention, and cancellation of underlying work.
