# Linkup Extract: clean-room product and extraction-plane analysis

**Research date / primary-source access date:** 2026-08-17  
**Scope:** Linkup's closed-beta `POST /v1/extract`, `GET /v1/extract/{id}`,
and `GET /v1/extract` surface only. Fetch, Tasks, account, and security material
is considered only where it establishes a dependency, contradiction, or shared
control; their capabilities are not projected onto Extract.  
**Status:** research and recommendations, not implementation, procurement
approval, legal advice, a quality benchmark, or an observed service test.  
**Overall confidence:** high for the published beta contract and list pricing;
medium for the bounded pipeline inference; low for acquisition, rendering,
caching, freshness, row-level provenance, and runtime safety behavior.

## Executive verdict

**DEFER the provider; ADAPT a few contract ideas (high confidence).** Linkup
Extract is an asynchronous, natural-language-controlled web data agent, not a
narrow page parser. A caller supplies one seed URL plus a description of the
repeated records wanted. Linkup may infer a row shape or enforce a caller's row
JSON Schema, can optionally test extracted URLs for reachability, and delivers
one JSON object per line through a 24-hour download URL [S1–S5].

Its useful ideas are an explicit row contract, asynchronous job envelope,
stream-friendly NDJSON handoff, expected row count, and actual task charge.
The current public contract is nevertheless unsuitable as Curiosity's owned or
evidence-grade extraction plane:

- no caller-selected static/rendered acquisition mode is exposed;
- cost explicitly varies with page size, rows, pagination depth, and URL
  verification, but no page, row, host, fetch, render, byte, time, or spend cap
  is exposed;
- no cache policy, capture time, freshness outcome, redirect chain, HTTP
  evidence, content hash, parser/model version, or truncation marker is
  returned;
- output rows carry no required source page, passage, offset, or confidence;
- the public materials conflict on Tasks support, x402 eligibility, SDK
  coverage, and whether 24-hour result persistence can coexist with ZDR;
- Extract is closed beta and Linkup explicitly warns that parameters, behavior,
  and response shape may change [S1][S4][S6][S8][S9][S13–S15].

For Curiosity:

1. **ADOPT** a separate `bulk_structured_extract` capability, per-row schema,
   async terminal states, and line-oriented artifact validation.
2. **ADAPT** them with immutable capture/derivation provenance, row/page/byte/
   deadline/spend budgets, typed partial outcomes, and a content-addressed
   manifest.
3. **REJECT** “schema-valid,” “URL reachable,” or “task completed” as evidence
   of factual correctness, authority, safety, completeness, or freshness.
4. **DEFER** Linkup Extract integration until the beta stabilizes and contract,
   privacy, legal, resource, and provenance checks are answered.

## 1. Decision frame and clean-room method

### 1.1 Bounded sub-questions

1. What exact request, task, output-file, list, state, error, and price contracts
   are public?
2. Which extraction modes exist, and what does a supplied JSON Schema actually
   guarantee?
3. Does Extract use Linkup Fetch, an index, live crawling, pagination, or
   JavaScript rendering, and how strongly can each dependency be inferred?
4. What can be established about caching, freshness, provenance, and
   reproducibility?
5. Which caller-controlled and provider-side bounds exist for hostile input,
   crawl expansion, URL verification, output size, latency, and cost?
6. Which privacy, security, publisher-rights, and clean-room boundaries apply?
7. Which ideas should Curiosity adopt, adapt, reject, or defer?

### 1.2 Method, authority, and stop rule

Only public primary sources were reviewed: Linkup endpoint documentation and
OpenAPI renderings, best practices, changelog, platform/security pages, and the
official public JavaScript/Python SDK repositories at recorded commits. No
account was created; no credential, free/paid API call, result download,
traffic interception, access-control bypass, vulnerability probe, package
installation, private interface, or proprietary implementation was used. No
SDK or service code is copied into Curiosity.

Official documentation is evidence that Linkup represents a contract or
control as offered; it is not independent proof of runtime behavior, quality,
compliance, or completeness. The investigation stops when every bounded
question has direct evidence or an explicit unknown and further progress would
require provider disclosure, contract review, or separately authorized tests.

Labels:

- **FACT** — directly stated or visible in a cited primary source.
- **INFERENCE** — least-assumptive interpretation of public facts, not an
  assertion about hidden implementation.
- **RECOMMENDATION** — a Curiosity design/governance consequence.
- **UNKNOWN / NEGATIVE RESULT** — not established in the reviewed sources;
  absence of documentation is not proof that a control is absent.
- Confidence is **high**, **medium**, or **low**.

## 2. Product boundary and lifecycle

### 2.1 Extract is a row-producing web agent

**FACT (high):** Extract was announced in June 2026 and remains **closed beta**,
enabled by request. It is intended for repeated records already represented by
a known listing, catalog, directory, team page, job board, or search-results
page. Linkup distinguishes it from Fetch (one page as Markdown) and Research
(multi-source synthesis) [S1][S3][S5].

The direct lifecycle is:

```text
POST /v1/extract
  -> {id, type:"extract", status:"pending", input, output:null, timestamps}

GET /v1/extract/{id}
  -> pending | processing | completed | failed

completed
  -> output {creditsUsed, rowsReturned, resultUrl}
  -> separate GET resultUrl
  -> NDJSON, one row object per line
```

The task object requires `id`, `type`, `status`, `createdAt`, `updatedAt`,
`input`, `output`, and `error`. Terminal states are `completed` and `failed`;
`error` is only a string or null [S1][S2][S4].

**FACT (high):** the separate result URL is valid for 24 hours. The rows are not
included in the API task response. `rowsReturned` is the expected line/record
count and `creditsUsed` is known only after completion [S1][S4].

**RECOMMENDATION (high):** completion must initiate a bounded artifact intake,
not an unbounded generic HTTP fetch. Check download-host policy, redirect and
byte limits, media type, line length, JSON depth, exact row count, schema, and a
locally computed digest before admitting any row. Quarantine the artifact as
untrusted data.

### 2.2 List surface and retention clue

**FACT (high):** `GET /v1/extract` lists the authenticated organization's
Extract tasks. It supports `page` (default 1, minimum 1), `pageSize` (default
10, 1–100), `sortBy: createdAt|updatedAt`, and `sortDirection: asc|desc`
(default `asc`). The response includes `data[]` plus page metadata [S7].

**INFERENCE (high):** task inputs and lifecycle metadata are persistently
queryable for at least some undocumented period, because list/get return the
echoed `q`, seed URL, schema, timestamps, error, and output metadata. The public
contract does not state task-record retention, deletion, access audit, or
whether expired `resultUrl` metadata remains listed.

**UNKNOWN:** cancellation, deletion, webhook/callback, idempotency key,
client-supplied correlation ID, priority, queue position, task deadline,
maximum task age, replay/re-download after expiry, and archival behavior.

## 3. Request and row-schema contract

### 3.1 Exact public input

| Field | Published contract | Material limit/gap |
|---|---|---|
| `q` | required string describing which rows and fields to extract | no public length, token, language, instruction, or complexity bound |
| `url` | required URI seed; guidance says point directly to the listing page | no scheme restriction in Extract OpenAPI, URL-length bound, redirect rule, or host policy |
| `schema` | optional JSON Schema for **one row**; default null | no declared dialect, supported-keyword subset, serialized-size/depth/property limit, or compile-time failure taxonomy |
| `verifyUrls` | Boolean, default false; test URLs found in rows for reachability after extraction | no definition of reachability, schemes, request method, timeout, redirects, count, concurrency, or returned verification evidence |

Sources: [S1][S2][S3][S5].

**FACT (high):** when `schema` is omitted, Linkup infers the row shape from `q`
and the page's data structure. When supplied, documentation says every returned
row must match it. Linkup recommends flat schemas with primitive fields, only
genuinely mandatory `required` fields, and client-side reshaping. It warns that
over-constraining drops otherwise-valid rows [S1][S3].

**FACT/SCHEMA WEAKNESS (high):** the OpenAPI request representation labels
`schema` as `format: json` but does not assign it a JSON type, while the echoed
task input represents it as an arbitrary object. Examples submit an object.
No JSON Schema draft URI or supported validation vocabulary is named [S4].

**INFERENCE (high):** “every returned row must match” is output-shape
conformance, not a completeness or truth guarantee. Because required fields can
cause records to be dropped, a schema can silently trade recall for conformance.
There is no count of candidate, rejected, duplicate, filtered, invalid, or
partially populated rows with which to audit that trade [S3][S4].

**RECOMMENDATION (high):** Curiosity should separate:

```text
capture -> candidate record -> field extraction -> schema validation
        -> accepted row | rejected row with reason
```

Return candidate/accepted/rejected counts and bounded reasons. Retain each
field's source anchor and extraction state (`observed`, `derived`, `missing`,
`conflicting`) rather than using schema validity as evidence.

### 3.2 Observable modes

Extract has no named `basic`, `advanced`, static, rendered, cached, live, or
depth mode. Its observable switches are instead:

| Dimension | Variant | Consequence |
|---|---|---|
| Row shape | inferred | model/agent decides fields from `q` and page structure |
| Row shape | explicit schema | returned rows must conform; over-constraint may drop rows |
| URL handling | `verifyUrls:false` | extracted URL-like values are returned without the optional reachability pass |
| URL handling | `verifyUrls:true` | post-extraction reachability checks add latency and cost |

**RECOMMENDATION (high):** do not map these variants to acquisition modes.
Curiosity's provider-neutral contract should independently state acquisition
(`static_only`, `render_allowed`), traversal budget, schema/validation policy,
and optional URL-check policy. Linkup cannot currently honor that distinction
through its public Extract request.

### 3.3 URL verification is not validation of meaning or safety

**FACT (high):** Linkup describes `verifyUrls` only as checking whether URLs in
rows resolve/reachability and filtering dead links. It reports no per-URL
status or evidence in the task output [S1][S3].

**INFERENCE (high):** a surviving URL is not thereby the intended entity,
canonical, safe, authorized, stable, public, or semantically correct. The
verification pass may also create additional outbound requests whose hosts and
count are controlled partly by hostile page content.

**RECOMMENDATION (high):** if Curiosity ever checks extracted URLs, admit them
through a distinct bounded URL-policy stage. Do not automatically fetch them;
record input value, normalized URL, policy decision, terminal URL, status
class, observation time, and retry budget. A source row cannot grant itself
additional network authority.

## 4. Fetch, render, crawl, and index dependencies

### 4.1 What the sources establish

**FACT (high):** Extract “starts from” one seed URL. Pricing scales with “crawl
complexity,” specifically page size, rows extracted, pagination depth, and
`verifyUrls` [S1][S8]. This establishes that traversal/pagination work can be
material even though the request has no traversal parameter.

**FACT (high):** Linkup separately exposes Fetch, which has explicit
`mode: standard|pro`, `renderJs`, HTML/PDF limits, and known-URL Markdown/raw
output. None of those fields appears in Extract's request or response [S4][S17].

**FACT (high):** Linkup states more generally that it operates its own search
index and processing stack and that LinkupBot is the crawler behind that search
index [S10][S12]. Those statements establish company-level crawler/index
capability, not that Extract uses the index or LinkupBot.

### 4.2 Least-assumptive dependency findings

- **INFERENCE (medium):** Extract performs or orchestrates on-demand web
  acquisition, because cost depends on page size and pagination depth and the
  job starts from a caller URL. Exact acquisition timing remains unknown.
- **INFERENCE (medium):** it can follow pagination or equivalent listing
  continuation beyond the initial representation. “Pagination depth” in the
  price basis is direct evidence that some tasks do more than parse one fixed
  response; trigger detection and host/depth boundaries are undisclosed.
- **UNKNOWN:** whether Extract invokes the public Fetch pipeline internally,
  shares its standard/pro lanes, reuses search-index documents, uses LinkupBot,
  launches a browser, renders JavaScript, executes page interactions, consumes
  APIs/XHR, uses sitemaps, or employs a separate crawler.
- **UNKNOWN:** whether it supports PDFs or only page-like HTML. Fetch's PDF
  support must not be projected onto Extract.

**RECOMMENDATION (high):** provider-neutral designs must not encode “Linkup
Extract” as `fetch + parse`. Model it as an opaque hosted agent with unknown
acquisition lane and potentially expanding traversal. Curiosity should keep
its own separable `admit URL -> capture -> parse -> identify rows -> validate`
stages and require explicit authority at each expansion.

### 4.3 Bounded architecture inference

The smallest processing graph consistent with the public contract is:

```text
bearer auth + beta entitlement + >=$10 balance
  -> validate q / seed / optional schema
  -> create persistent async task envelope
  -> acquire seed representation
  -> optional opaque pagination/traversal
  -> identify repeated entities and candidate fields from q/page
  -> optional schema conformance/drop
  -> optional URL reachability fan-out
  -> serialize accepted rows as NDJSON
  -> store artifact + issue 24-hour result URL
  -> report row count and variable charge
```

**Confidence:** high for the envelope, schema, optional URL-check, NDJSON, and
billing stages; medium for acquisition and pagination; low for component
sharing, rendering, models, storage topology, and concurrency. Nothing public
identifies browser engine, parser, model/provider, prompts, chunking, selectors,
proxy geography, queue implementation, or object store.

## 5. Cache, freshness, and temporal semantics

**NEGATIVE RESULT (high):** no Extract request field controls cache use, TTL,
maximum age, forced live acquisition, stale fallback, revalidation, geographic
fetch location, or observation deadline. No response field reports `fetchedAt`,
cache hit/miss, cache age, HTTP `Date`/`ETag`/`Last-Modified`, publication time,
terminal URL, or page version [S1–S5].

**FACT (high):** `createdAt` and `updatedAt` are task timestamps. They are not
documented as origin fetch, render, extraction, or result-file creation times.
The 24-hour statement covers link validity, not origin freshness and not a
guaranteed deletion time [S1][S4].

**INFERENCE (high):** the response cannot establish whether a row came from a
fresh network response, a provider cache, an index copy, a rendered state, or a
mix across pagination. Repeating a task cannot establish which underlying page
version changed, because acquisition and extractor/model versions are absent.

**UNKNOWN:** raw-response, rendered-DOM, parsed-document, pagination, model, URL
verification, or final-artifact caches; keys/TTLs/revalidation; cross-tenant
reuse; negative caching; stale fallback; whether the seed is fetched once or
multiple times during a long job; whether all pages share one temporal
snapshot.

**RECOMMENDATION (high):** do not assign request or completion time as source
observation time. Curiosity requires explicit requested freshness and observed
outcome:

```text
freshness_policy: cache_only | max_age | require_live
fallback_policy: fail | allow_stale
outcome: cache_hit | revalidated | fetched | stale_fallback | provider_unknown
captured_at?, validated_at?, age_at_response?, stale?
```

For evidence-grade use, extraction must derive from a policy-permitted immutable
capture or equivalent provider evidence, not only a mutable page URL.

## 6. Output, provenance, and reproducibility

### 6.1 What is returned

The task response provides operational lineage only:

- provider task ID and type;
- task create/update timestamps and state;
- echoed seed URL, `q`, schema, and verification choice;
- a free-text task error or null;
- completed row count, credits used, and expiring NDJSON URL [S1][S4].

The output schema permits `rowsReturned` from zero through JavaScript's maximum
safe integer (`9,007,199,254,740,991`). **INFERENCE (high):** this is a schema/
serialization ceiling, not a credible product row budget. No practical maximum
is documented [S4].

### 6.2 Missing evidence

**NEGATIVE RESULT (high):** no required per-row or per-field provenance is in
the public contract. Unless the caller requests a URL-like field in its own
schema, a row may contain no source pointer at all. Even a requested URL does
not identify the exact page bytes or passage used [S1][S4].

Missing fields include:

- requested, fetched, redirect-terminal, and declared-canonical URLs as distinct
  identities;
- complete admitted page/pagination set and per-page terminal outcome;
- fetch/render/extraction times, HTTP status/headers/media type/charset;
- raw, rendered, normalized, and extracted-content hashes or capture handles;
- static/rendered/cache/index acquisition outcome and configuration;
- parser, extractor, model, prompt, schema-validator, and API versions;
- per-row source page, DOM/text locator, offsets, passage hash, and field-level
  evidence;
- candidate/rejected/deduplicated row counts and rejection reasons;
- truncation, partial coverage, pagination stop reason, confidence, conflicts,
  or validation report;
- robots, publisher-policy, safety, malware, privacy, or legal decision IDs;
- result-file byte count, media type, checksum/signature, line count proof, and
  artifact creation/deletion time.

**INFERENCE (high):** the NDJSON file is a derived dataset, not a capture
manifest. Schema-valid rows may still be hallucinated, stale, duplicated,
misattributed, normalized incorrectly, or incomplete. `rowsReturned` detects
transport/parse cardinality mismatches but not omitted records.

**RECOMMENDATION (high):** a Curiosity bulk artifact manifest should bind:

```text
job_id, request_digest, schema_digest, admitted_budget, policy_version
captures[]: capture_id, URL identities, observed_at, response/content hashes
derivation: extractor/model/prompt/validator versions
rows[]: row_id, row_digest, capture_ids, field/passages, validation outcome
coverage: pages attempted/succeeded/failed, candidates/accepted/rejected
artifact: media_type, bytes, lines, sha256, created_at, retention class
usage: provider_reported, local estimate, budget outcome
```

Provider-omitted values must remain unknown; the adapter must never fabricate
them.

## 7. Hostile input and resource bounds

### 7.1 Documented bounds

The narrow public bounds are:

- one seed URL and one task per direct submission;
- four task states;
- poll at roughly 30 seconds for long jobs and no faster than once per second;
- Extract-list page size at most 100;
- result URL validity of 24 hours;
- beta entitlement and at least $10 account balance before submission [S1–S4]
  [S7][S8].

These are transport/operational bounds, not crawl or content-safety budgets.

### 7.2 Material undocumented bounds

**NEGATIVE RESULT (high):** public Extract materials state no maximum for:

- `q` length/tokens, URL length, schema bytes/depth/properties/regex complexity;
- origin bytes, decompressed bytes, DOM nodes, script/network requests, or
  browser memory/CPU;
- redirects, pages, pagination depth, hosts, links, rows, fields, field bytes,
  total NDJSON bytes, or line length;
- URL-verification candidates, schemes, redirects, concurrency, or timeout;
- queue time, execution time, retries, model tokens, worker concurrency, or
  cost per task;
- result-download redirects, bytes, duration, or retry count.

**FACT/RISK (high):** cost varies with precisely several of these unbounded
dimensions—page size, row count, pagination depth, and URL verification—and is
reported only after completion [S1][S8]. The $10 balance gate is not a $10
maximum; “most” tasks costing $2–10 is a distribution statement, not a ceiling.

**INFERENCE (high):** hostile or accidental page structure can amplify network
work and spend through pagination and extracted-URL fan-out. A natural-language
agent processing attacker-controlled pages also creates indirect-prompt-
injection risk. Neither schema validation nor cleaned/structured JSON
neutralizes semantic instructions in source content.

**RECOMMENDATION (high):** Curiosity must require caller-owned ceilings before
admission: seed/host set, pages, pagination depth, redirects, fetched/decompressed
bytes, rendered pages, external requests, URL checks, candidate/accepted rows,
field and artifact bytes, schema complexity, wall time, retries, concurrency,
and spend. If a provider cannot enforce them, enforce what is possible locally
and reject the provider where server-side overspend/authority remains open.

### 7.3 Result URL as a security boundary

**FACT (high):** the example represents the artifact host as `<download-host>`
and shows a URL containing a query string, but documentation does not specify
authentication on download,
one-time use, revocation, IP binding, redirect policy, or content headers [S1].

**INFERENCE (medium):** `resultUrl` likely functions as a time-limited bearer/
capability URL. That is not confirmed, so it must be handled at least as
sensitively as one: redact it from logs/traces/model context, never render it to
untrusted clients, permit only approved download hosts, and prevent redirects
to private or unexpected networks.

**UNKNOWN:** whether anyone possessing the URL can download, whether downloads
are audited, whether the same URL is reusable, whether expiration revokes
underlying data, and whether early deletion is possible.

## 8. Errors, retries, concurrency, and contract drift

### 8.1 Error surface

**FACT (high):** direct POST documents:

| HTTP | Published Extract meaning |
|---:|---|
| 400 | invalid parameters |
| 401 | invalid/missing API key |
| 403 | Extract not enabled for organization |
| 429 | rate limit exceeded **or** insufficient credit |

The general API envelope is `{statusCode,error:{code,message,details[]}}`, and
the general page also documents 402, 409, and 500 classes [S4][S9]. A failed
async task, however, exposes only a free-text `error` string [S4].

**CONTRACT GAP (high):** `GET /extract/{id}` documents only 200/400/401, omitting
not-found, forbidden, rate-limit, and server failures. The list reference only
documents 200/401. Extract-specific fetch, parse, schema, traversal, URL-check,
timeout, oversize, policy, partial, and artifact errors are not enumerated
[S6][S7].

**RECOMMENDATION (high):** preserve provider status/code/text separately and
normalize into `invalid`, `auth`, `entitlement`, `credit`, `rate`, `network`,
`policy`, `timeout`, `too_large`, `schema`, `partial`, `provider_internal`, and
`unknown`. Split 429 credit exhaustion from retryable rate pressure. Never
retry an async submission automatically without a local idempotency ledger.

### 8.2 Polling, retries, and idempotency

**FACT (high):** Linkup recommends polling around every 30 seconds for long
tasks and rate-limits polling above one request per second. Best practices say
retries are unrestricted and failed/no-result tasks are not charged [S1][S3].

**INFERENCE (high):** “unrestricted retries” is commercial policy, not safe
idempotency. POST exposes no idempotency key. A lost submit response followed by
resubmission can plausibly create two variable-cost jobs; public material does
not rule that out.

**UNKNOWN:** submission concurrency, in-flight quota, `Retry-After`, poll
consistency, state monotonicity, exact-once creation, cancellation, timeout,
failure retryability, and whether a completed zero-row task is charged. OpenAPI
permits zero rows, while best practices say tasks returning no result are not
charged; no exact reconciliation rule is published [S3][S4].

### 8.3 Cross-surface contradictions retained

1. **Tasks support.** Current `/tasks` OpenAPI includes an `extract` task input
   and output, and pricing says Tasks can bill Extract. The Tasks overview,
   Tasks parameter table, SDK task unions, and SDK normalizers support only
   Search, Fetch, and Research [S13–S15]. **Working verdict:** REST support is
   schema-present but product/SDK support is inconsistent; do not use without an
   authorized contract test and provider confirmation.
2. **SDK “full API surface.”** SDK docs call the SDK surface “full” but list
   Search, Fetch, Research, and Tasks only. At JS commit
   `c847bb324e5e42be3d91098dfb98f61714aac97f` and Python commit
   `ba083ff21d5dc345447b054f0365055fe58999cc`, public clients/types expose no
   Extract method/model and reject/omit Extract task types [S14][S15]. **Working
   verdict:** use the REST OpenAPI as the beta contract; SDK parity is absent.
3. **x402.** The central pricing page says x402 follows the listed endpoint
   prices, including adjacent Extract pricing text, but the dedicated x402 page
   lists only Search and Fetch at a flat $0.01. Extract also requires closed-beta
   organization enablement and a $10 account balance [S8][S16]. **Working
   verdict:** Extract is bearer/account only unless Linkup explicitly says
   otherwise.
4. **ZDR.** ZDR says search queries/results are memory-only and never persisted,
   but Extract returns listable query/schema/task records and exposes a
   retrievable result artifact for 24 hours [S1][S7][S10]. **Working verdict:**
   ZDR applicability to Extract is unknown and should not be inferred.

## 9. Pricing and cost control

**FACT (high):** Extract uses variable pricing. Linkup says most completed jobs
cost **$2–10**; complexity depends on page size, rows, pagination depth, and
URL verification. Exact `creditsUsed` appears only in completed output. Failed
tasks are uncharged, and submission requires at least a **$10 balance** [S1]
[S8]. Prices are point-in-time statements and can change.

**FACT (high):** ordinary API-key billing uses prepaid USD credit. The general
pricing page says errors do not deduct credit and balance exhaustion is a 429
[S8][S9].

**INFERENCE (high):** pricing reveals a multi-stage agent/crawl workload and
metering dimensions but not a reproducible unit schedule. A customer cannot
pre-compute a hard maximum from the public contract. `creditsUsed` supports
after-the-fact accounting, not admission control.

**RECOMMENDATION (high):** Curiosity should reject production submission unless
the provider adds a per-job quote or enforceable maximum charge and explicit
page/row/verification ceilings. A local balance check alone cannot stop one job
from consuming more than intended. Track estimated and provider-reported cost,
including duplicate submissions and artifact-download failures.

## 10. Privacy, security, and legal boundaries

### 10.1 Data disclosed and retained

**FACT (high):** Linkup receives the seed URL, natural-language extraction
instructions, row schema, and URL-verification choice. It returns those values
in get/list task records and makes the derived dataset retrievable through a
24-hour result URL [S1][S4][S7].

**FACT (high, vendor statement):** by default processing may occur across US,
EU, Canada, and APAC based on load; local processing is not guaranteed. Linkup
offers a DPA, enterprise regional controls, and ZDR on request—not by default.
It states TLS 1.2+ in transit, AES-256 at rest, SOC 2 Type II, ISO 27001, and
HIPAA compliance [S10][S11]. These are organization-level claims, not an
Extract-specific retention schedule or data-flow map.

**RECOMMENDATION (high):** assume non-ZDR, globally routed, persistently logged
processing unless a reviewed contract explicitly covers Extract tasks,
artifacts, backups, URL verification, and subprocessors. Do not submit private
or intranet URLs, signed URLs, credentials, customer secrets, regulated data,
personal identifiers, unpublished hypotheses, or sensitive field descriptions.

**UNKNOWN:** Extract-specific input/task/output retention; backup deletion;
training/improvement use; model providers/subprocessors; tenant isolation;
download-host region; artifact encryption/key scope; access logs; early
deletion; data-subject/takedown flow; and whether ZDR can support async listing
and 24-hour artifacts.

### 10.2 Crawling, publisher rights, and robots

**FACT (medium, scope-qualified vendor statement):** Linkup's general content-
safety page says its crawling respects `robots.txt`, does not bypass CAPTCHAs or
access controls, and only indexes publicly available, non-login/paywall content.
It also states that high-risk content is filtered and quality-scored during
indexing/retrieval [S12]. The page is framed around the search index; it does
not expressly specify Extract's seed/pagination/URL-verification behavior.

**NEGATIVE RESULT (high):** Extract docs return no robots decision, publisher-
policy decision, crawl user agent, opt-out evidence, license, copyright notice,
terms status, takedown marker, or legal basis. A successful task does not grant
rights to copy, retain, combine, redistribute, train on, or publish origin data.

**FACT/ACCESS LIMIT (high):** Linkup links official client terms and a privacy
policy, but their body text rendered only as a loading shell (and the linked
Notion terms body was unavailable) through the public read-only path used here
[S18][S19]. No bypass was attempted. Contractual rights and restrictions remain
a procurement/legal-review unknown, not a presumed permission.

**RECOMMENDATION (high):** Curiosity needs independent source eligibility,
robots/publisher policy, purpose limitation, copyright/quotation, privacy,
retention, deletion, attribution, and jurisdiction rules. “Publicly available”
is not synonymous with licensed or lawful for every downstream use.

### 10.3 Hostile content and model authority

**NEGATIVE RESULT (high):** no Extract-specific public guarantee was found for
prompt-injection detection, malware scanning, script isolation, active-content
sanitization, dangerous links, PII/secrets filtering, Unicode normalization,
schema-complexity defense, poisoned pagination, crawl-trap protection, or
output factuality [S1–S5]. General index filtering must not be assumed to cover
an on-demand beta agent.

**RECOMMENDATION (high):** treat `q`, page content, field values, and returned
URLs as different untrusted classes. Source text cannot change policy, request
credentials, increase a budget, select tools, or authorize another fetch.
Never render NDJSON-derived Markdown/HTML as trusted, and never auto-follow a
row URL from a privileged network.

## 11. Clean-room Curiosity implications

### Adopted

1. **ADOPT — separate bulk structured extraction capability (high).** Keep it
   distinct from discovery, capture, page representation, passage selection,
   and synthesis.
2. **ADOPT — row-level schema and line-oriented transfer (high).** Validate one
   bounded record at a time and fail/quarantine individual rows without loading
   the whole artifact.
3. **ADOPT — durable async envelope (high).** Persist local request digest,
   provider ID, timestamps observed by Curiosity, state transitions, attempts,
   terminal error, artifact digest, and usage.
4. **ADOPT — expected count plus actual artifact checks (high).** Reconcile
   declared rows, parsed lines, accepted rows, rejected rows, and duplicates.

### Adapted

1. **ADAPT — schema conformance into evidence-aware validation (high).** Expose
   candidate and rejection accounting; attach each accepted field to source
   capture/passages; distinguish missing from unsupported/conflicting.
2. **ADAPT — URL verification into a separate policy operation (high).** A
   reachability check has its own URL admission, egress, redirect, deadline,
   byte, and concurrency budget and confers no semantic authority.
3. **ADAPT — expiring artifact into content-addressed intake (high).** Download
   through a bounded worker, compute a digest, validate and quarantine, then
   retain only under Curiosity legal/privacy policy.
4. **ADAPT — variable work into explicit budgets (high).** Make pages, hosts,
   pagination, render, URL checks, rows, bytes, deadline, and spend visible and
   enforceable before execution.
5. **ADAPT — task timestamps into stage-specific temporal provenance (high).**
   Keep request, fetch, extraction, artifact, ingestion, and publication times
   separate; provider-unknown stays unknown.

### Rejected

1. **REJECT — schema validity as truth/completeness (high).** Shape validity
   cannot prove extraction fidelity or enumerate omitted rows.
2. **REJECT — reachable URL as verified source (high).** Reachability says
   nothing about identity, safety, authority, currency, or relevance.
3. **REJECT — opaque agent traversal as ambient authority (high).** A seed URL
   and natural-language prompt must not silently authorize unbounded pages,
   hosts, pagination, or spend.
4. **REJECT — mutable URLs/task metadata as sufficient provenance (high).**
   Evidence needs immutable capture, derivation, and passage identities.
5. **REJECT — Linkup Extract as owned infrastructure (high).** Acquisition,
   models, traversal, cache, provenance, and runtime limits remain vendor-
   controlled and opaque.

### Deferred

1. **DEFER — provider integration (high).** Closed-beta drift, post-hoc variable
   cost, open resource bounds, and weak provenance block production adoption.
2. **DEFER — Linkup Tasks wrapper (high).** OpenAPI, overview, SDK, and pricing
   disagree on Extract support.
3. **DEFER — ZDR/regulatory workloads (high).** Obtain an Extract-specific DPA,
   data-flow/retention statement, subprocessor list, and explanation of async
   artifacts under ZDR.
4. **DEFER — rendering and multi-page extraction (high).** Evaluate only with
   organization-owned/public-domain fixtures after the provider exposes or
   contractually commits acquisition/traversal bounds.

## 12. Provider-neutral contract consequences

A minimum future request should express concepts such as:

```text
seed_urls[]             normalized, policy-approved, tightly bounded
record_description      untrusted data, bounded length
row_schema              pinned dialect + complexity limits + digest
acquisition             static_only | render_allowed
traversal               max_pages, max_depth, allowed_hosts, pagination policy
url_checks              off | {max_urls, allowed_hosts, deadline, bytes}
budgets                 rows, bytes, wall_time, concurrency, retries, spend
freshness               policy + stale-fallback rule
```

A minimum response should provide one outcome per admitted page and record:

```text
job: state, local_idempotency_key, provider_trace_id?, request_digest
captures[]: URL identities, outcome, observed_at?, hashes?, policy decision
rows[]: row_id/digest, value, field evidence, validation outcome
coverage: pages/candidates/accepted/rejected/duplicates/truncated + stop reason
artifact: media type, bytes, lines, digest, retention class
usage: provider_reported, local_estimated, budget status
trust: untrusted_external_data, retrieval_only
```

**RECOMMENDATION (high):** provider capability gaps must be represented as
`unknown` or `unsupported`, never collapsed into false, empty, or successful.
An adapter may populate Linkup's task ID, echoed input, state, row count, charge,
and derived rows. It cannot truthfully populate capture time, cache outcome,
source offsets, or extractor version from the current response.

## 13. Checks required before any later adoption

Any execution requires a separately declared frame and caller authority. Use
only organization-owned, public-domain, or explicitly permitted fixtures.

1. **Contract:** malformed/missing fields, JSON Schema dialect/keywords and
   complexity, zero rows, dropped required fields, state transitions, 403 beta
   entitlement, list retention, and response/OpenAPI drift.
2. **Acquisition:** static page, deterministic client-rendered fixture,
   pagination, redirects, canonical URL, and exact admitted host/page bounds.
3. **Freshness:** controlled revisions over time; identify cache/live outcomes
   contractually rather than infer them from one response.
4. **Artifact:** authentication, host/redirect policy, media type, compression,
   bytes, line limits, checksum, line-count mismatch, expiry, deletion, and
   duplicate-download behavior.
5. **Safety:** owned prompt-injection, crawl-trap, oversized/decompression,
   schema-complexity, unsafe URL, and private-address fixtures—while Curiosity
   rejects disallowed URLs before provider disclosure.
6. **Cost/operations:** preflight/max-charge support, row/page/verification
   metering, duplicate submit, poll throttling, failure charging, cancellation,
   timeouts, and concurrency.
7. **Provenance/quality:** candidate/accepted recall, row/field faithfulness,
   duplicates, omissions, source anchors, deterministic drift, and partial
   coverage.
8. **Governance:** current client terms, DPA, subprocessors, processing region,
   ordinary retention, ZDR applicability, training/improvement use, publisher
   policy, takedown/deletion, and exit strategy.

## 14. Fact / inference / recommendation ledger

| ID | Type | Claim | Confidence | Evidence / verdict |
|---|---|---|---|---|
| F1 | FACT | Extract is a June 2026 closed-beta async endpoint taking one `q`, one seed `url`, optional one-row schema, and optional URL reachability checks. | High | [S1][S4][S5]; product boundary. |
| F2 | FACT | Completion returns an expiring NDJSON URL, row count, and actual credits; rows are not inline. | High | [S1][S4]; **ADAPT** artifact pattern. |
| F3 | FACT | Price varies with page size, rows, pagination depth, and verification; most jobs are $2–10; failures uncharged; $10 balance required. | High | [S1][S8]; no hard maximum. |
| F4 | FACT | An explicit schema promises conformance of returned rows, while over-constraining may drop valid candidates. | High | [S1][S3]; shape, not completeness. |
| F5 | FACT | No named fetch/render/cache/freshness mode exists in the Extract request. | High | Negative review [S1–S5]. |
| F6 | FACT | Public output has job-level operational metadata but no required row/field source evidence or capture identity. | High | [S1][S4]; **REJECT** as sufficient provenance. |
| F7 | FACT | Public Extract docs expose no practical page/row/byte/time/spend/verification bound. | High | Negative review [S1–S5]; JS-safe row integer is not a product budget. |
| F8 | FACT | Direct errors distinguish beta entitlement but async failures are free text; 429 conflates rate and credit. | High | [S4][S9]; normalize locally. |
| F9 | FACT | Tasks OpenAPI includes Extract while Tasks overview and official SDKs omit it. | High | [S13–S15]; **DEFER** wrapper. |
| F10 | FACT | ZDR is optional/not default, while Extract exposes listable task input and a 24-hour result URL. | High | [S1][S7][S10]; applicability unknown. |
| I1 | INFERENCE | Extract orchestrates acquisition plus optional pagination and row extraction, but sharing Fetch/index/render infrastructure is unknown. | Medium | F1, F3, F5. |
| I2 | INFERENCE | Natural-language extraction over hostile pages plus opaque traversal creates prompt-injection and resource-amplification risk. | High | F3, F7. |
| I3 | INFERENCE | A Linkup artifact alone cannot support reproducible, time-specific, field-level evidence. | High | F5–F6. |
| I4 | INFERENCE | `resultUrl` should be treated as a secret capability URL even though auth semantics are undocumented. | Medium | F2 and example URL shape. |
| R1 | RECOMMENDATION | Separate capture, record identification, field extraction, validation, and URL checking. | High | **ADOPT/ADAPT** architecture. |
| R2 | RECOMMENDATION | Require immutable capture/row evidence and complete coverage accounting. | High | **ADAPT** provenance. |
| R3 | RECOMMENDATION | Require enforceable server-side traversal and spend caps before production use. | High | **DEFER** provider. |
| R4 | RECOMMENDATION | Treat every row and URL as untrusted retrieval-only data. | High | **ADOPT** trust boundary. |
| R5 | RECOMMENDATION | Do not use Linkup Extract as the owned extraction foundation. | High | **REJECT** foundation. |

## 15. Unknowns and negative results retained

Material unknowns after the bounded review:

1. acquisition lane, browser/rendering, Fetch/index/LinkupBot reuse, supported
   content types, fetch geography, retries, and interaction/wait policy;
2. cache presence, key, TTL, bypass, revalidation, stale fallback, and temporal
   consistency across pagination;
3. pagination discovery, traversal depth, child/host boundaries, robots behavior
   specifically for Extract, and crawl user agent;
4. JSON Schema dialect, keyword support, schema/input complexity bounds, exact
   validation behavior, and rejected-row accounting;
5. page, host, redirect, byte, decompression, DOM, script, row, field, output,
   URL-check, time, concurrency, and spend ceilings;
6. per-row/field source evidence, capture/version/hash, extraction/model/prompt
   version, confidence, duplicates, omissions, partial/truncation states;
7. URL reachability definition, supported schemes, redirect/private-network
   policy, evidence returned, and billing unit;
8. task idempotency, cancellation, timeout, webhook, concurrency, retention,
   deletion, state consistency, and retry safety;
9. result URL authentication, redirects, headers, checksum, maximum size,
   region, reuse, revocation, audit, storage deletion, and recovery after expiry;
10. exact charging for zero rows, partial work, lost downloads, and duplicates;
11. stable SDK/Tasks/x402 support and beta compatibility/versioning policy;
12. Extract-specific data retention, subprocessors/models, training/improvement
   use, regional routing, tenant isolation, and ZDR feasibility; and
13. publisher terms, copyright/license rights, opt-outs, takedown/deletion, and
   the current client-terms restrictions inaccessible in this review.

These are unknown, not claims that Linkup lacks internal controls.

## 16. Bounded curiosity pass

After synthesis, in-frame gaps were scored 1–5 for relevance (R), decision
value (V), novelty (N), and investigation cost (C); priority is
`R + V + N - C`.

| Thread | R | V | N | C | Score | Action/result |
|---|---:|---:|---:|---:|---:|---|
| Tasks/SDK contract parity | 5 | 4 | 4 | 1 | 12 | **Pursued.** OpenAPI includes Extract; current overview and SDK commits omit/reject it. Drift retained. |
| ZDR versus async artifact persistence | 5 | 5 | 4 | 2 | 12 | **Pursued.** Security and Extract pages do not reconcile them; Extract-specific ZDR remains unknown. |
| Fetch/render/cache dependency | 5 | 5 | 4 | 3 | 11 | **Pursued.** Extract and Fetch/OpenAPI surfaces compared; pagination/crawl work is evidenced, component reuse and freshness remain negative results. |
| Practical resource/spend ceilings | 5 | 5 | 3 | 2 | 11 | **Pursued.** OpenAPI, best practices, errors, and pricing expose no enforceable job maximum. |
| Empirical beta calls/result downloads | 5 | 4 | 3 | 5 | 7 | **CURIOSITY_NO_GO.** Caller prohibited calls/credentials/paid activity; closed-beta access required. |
| Probe SSRF, private URLs, crawl traps, or hostile third-party pages | 5 | 5 | 3 | 5 | 8 | **CURIOSITY_NO_GO.** No authorization; security/legal boundary. Future tests must use owned fixtures and separate authority. |
| Recover dynamic privacy/terms bodies by undocumented interfaces | 4 | 4 | 2 | 4 | 6 | **CURIOSITY_NO_GO.** Public render path returned a shell/Notion body unavailable; no bypass. Procurement must review authoritative documents. |
| Infer proprietary browser/parser/model vendors | 2 | 2 | 3 | 5 | 2 | **CURIOSITY_NO_GO.** Speculative and unnecessary for the contract decision. |
| Competitor benchmark or community anecdotes | 2 | 2 | 2 | 3 | 3 | **CURIOSITY_NO_GO.** Outside Extract-only primary-source frame and not reproducible evidence. |

**Stop condition reached:** coverage and saturation. Every requested category
has primary evidence or an explicit unknown. Remaining decision-critical gaps
require provider confirmation, legal/procurement review, or separately
authorized tests—not additional document search. No autonomous follow-up is
authorized by this report.

## 17. Checks performed

- Read repository `AGENTS.md` before research.
- Used only public primary sources accessed 2026-08-17; web-search snippets were
  not used as evidence.
- Kept Extract separate from Fetch/Search/Research and did not import adjacent
  capabilities merely because Linkup offers them.
- Inspected only public MIT-identified SDK transport repositories at recorded
  commits to establish surface parity; copied no code and inferred no service
  internals from permissive SDK licensing.
- Made no API, keyless, x402, free-credit, or paid call; supplied no credentials;
  downloaded no provider result; performed no bypass, probe, deployment, or
  production mutation.
- Distinguished fact, inference, recommendation, and unknown; retained contract
  contradictions and negative findings.
- File-scope check: this task creates only
  `docs/research/products/linkup-extract.md`.

## 18. Sources

All sources are official/primary and were accessed **2026-08-17**.

- **[S1]** Linkup, “Extract overview” — beta status, request semantics, NDJSON,
  output expiry, lifecycle, pricing dimensions:
  <https://docs.linkup.so/pages/documentation/endpoints/extract/overview>
- **[S2]** Linkup, “Extract for AI agents” — product boundary, tool shape,
  polling, result handling:
  <https://docs.linkup.so/pages/documentation/endpoints/extract/for-agents>
- **[S3]** Linkup, “Extract best practices” — seed/query/schema guidance,
  dropped rows, URL checks, retries, polling:
  <https://docs.linkup.so/pages/documentation/endpoints/extract/best-practices>
- **[S4]** Linkup, `POST /v1/extract` OpenAPI rendering — exact input, task,
  output, states, and endpoint status schemas:
  <https://docs.linkup.so/pages/documentation/endpoints/extract/post>
- **[S5]** Linkup changelog, “Extract Endpoint,” released June 2026:
  <https://docs.linkup.so/pages/changelog/extract-endpoint>
- **[S6]** Linkup, `GET /v1/extract/{id}` OpenAPI rendering:
  <https://docs.linkup.so/pages/documentation/endpoints/extract/get>
- **[S7]** Linkup, `GET /v1/extract` OpenAPI rendering — organization task list
  and pagination:
  <https://docs.linkup.so/pages/documentation/endpoints/extract/list>
- **[S8]** Linkup, “Pricing” — prepaid billing, variable Extract cost, failed
  calls, minimum balance, and Tasks/x402 wording:
  <https://docs.linkup.so/pages/documentation/platform/pricing>
- **[S9]** Linkup, “Errors” — general envelope and status classes:
  <https://docs.linkup.so/pages/documentation/platform/errors>
- **[S10]** Linkup, “Data processing and privacy” — processing regions, DPA,
  own index/stack, and non-default ZDR:
  <https://docs.linkup.so/pages/security-and-privacy/data-processing-privacy>
- **[S11]** Linkup, “Security and compliance” — vendor-stated certifications,
  encryption, enterprise controls, and BYOC:
  <https://docs.linkup.so/pages/security-and-privacy/security-compliance>
- **[S12]** Linkup, “Content safety and index controls” — index filtering,
  quality, public-content and crawling safeguards:
  <https://docs.linkup.so/pages/security-and-privacy/content-safety-index-controls>
- **[S13]** Linkup, “Tasks overview” and current `/tasks` OpenAPI rendering —
  overview omits Extract while OpenAPI includes it:
  <https://docs.linkup.so/pages/documentation/endpoints/tasks/overview>,
  <https://docs.linkup.so/pages/documentation/endpoints/tasks/post>
- **[S14]** Linkup official JavaScript SDK, commit
  `c847bb324e5e42be3d91098dfb98f61714aac97f`, especially
  `src/linkup-client.ts`, `src/types.ts`, tree, and MIT license:
  <https://github.com/LinkupPlatform/linkup-js-sdk/tree/c847bb324e5e42be3d91098dfb98f61714aac97f>
- **[S15]** Linkup official Python SDK, commit
  `ba083ff21d5dc345447b054f0365055fe58999cc`, especially
  `src/linkup/_client.py`, `src/linkup/_types.py`, tree, and MIT license:
  <https://github.com/LinkupPlatform/linkup-python-sdk/tree/ba083ff21d5dc345447b054f0365055fe58999cc>
- **[S16]** Linkup, “x402 Payment Protocol” — supported endpoints limited to
  Search and Fetch:
  <https://docs.linkup.so/pages/documentation/platform/x402>
- **[S17]** Linkup, “Fetch overview” — explicit Fetch acquisition controls and
  constraints absent from Extract:
  <https://docs.linkup.so/pages/documentation/endpoints/fetch/overview>
- **[S18]** Linkup Privacy Policy public route (body rendered as loading shell in
  the available read-only path): <https://www.linkup.so/privacy-policy>
- **[S19]** Linkup-linked “Client General Terms and Conditions” (linked official
  Notion document; body unavailable in the available read-only path):
  <https://linkup-platform.notion.site/Linkup-Client-General-Terms-and-Conditions-13f161ecef69806784dfe808b4e162a1>

## 19. Confidence summary

- **High:** current beta request/task/list/output schemas, task states, NDJSON
  handoff and expiry, recommended polling, published pricing factors, account
  gate, documented general errors, and cross-surface contradictions.
- **High:** provenance and boundedness gaps in the *public contract*; this does
  not prove corresponding internal controls are absent.
- **Medium:** on-demand acquisition, pagination/traversal, async queue, schema
  validation/drop, URL-check fan-out, and artifact-store stages inferred from
  observable behavior and pricing.
- **Low/unknown:** Fetch/index/LinkupBot reuse, browser/rendering, cache/freshness,
  exact traversal, models/parsers, actual limits, runtime safety, quality,
  ordinary retention, ZDR applicability, and publisher/legal handling.
