# Bright Data Scraper Studio: clean-room product-surface reverse engineering

**Research and primary-source access date:** 2026-08-17  
**Status:** research only; not an implementation, purchase authorization, target
authorization, benchmark, or legal opinion.  
**Exclusive scope:** Bright Data **Scraper Studio** as a standalone product:
AI-generated and customer-authored custom scrapers, the hosted IDE/runtime,
collector publication and versions, collection APIs, schedules, jobs, outputs,
and delivery. Pre-built Web Scraper API, Crawl API, Browser API, Web Unlocker,
raw proxies, and managed scraper services are out of scope except where a
first-party Scraper Studio source makes them a dependency or boundary.  
**Access boundary:** public first-party documentation, API/OpenAPI references,
product/pricing pages, security material, MSA, AUP, Privacy Policy, and public
DPA. No account, credentials, Control Panel access, generated scraper, free or
paid run, target request, packet capture, proprietary source, bypass experiment,
or implementation was used.

## Executive verdict

**DEFER Scraper Studio as a Curiosity hosted extraction provider; ADAPT its
definition/version/attempt and evidence patterns (high confidence).** Scraper
Studio is a hosted, programmable extraction product rather than a generic fetch
API. A user describes a target and schema to an AI Agent or writes JavaScript in
an IDE; publishes a stable `c_...` Collector ID; then runs the collector in
batch, asynchronous real-time, or synchronous real-time mode on Bright Data's
code/browser workers, proxy/unblocking network, job system, retained result
store, and delivery plane [S1-S16].

The strongest product qualities are observable and reusable:

1. generated code remains reviewable/editable, with an approval gate before AI
   Self-Healing reaches production;
2. a stable collector identity is distinct from a run and from the template
   version recorded on that run;
3. static HTTP and browser interaction are explicit worker capabilities and can
   be selected per stage;
4. one input may create a bounded-by-code graph of child stages and many output
   rows;
5. batch jobs expose queue/start/finish, page-load, failure, output, cost, and
   template metadata; and
6. optional timestamp, redirect, HTML, screenshot, and WARC facilities can
   materially strengthen evidence [S4-S13][S17-S21].

The blockers are also material:

- generated or customer-written code executes only against a proprietary
  Bright Data function/runtime contract; copying the JavaScript does not export
  the worker, browser, scheduler, proxy, unblocking, storage, or delivery plane;
- a stable Collector ID is intentionally changed in place by publication and
  Self-Healing; historical template identity is visible on jobs, but the public
  trigger contract does not pin an arbitrary immutable production revision;
- browser/proxy retries, CAPTCHA solving, geolocation, sessions, and stage
  fan-out can multiply authority, page loads, personal-data exposure, and cost;
- most provenance fields are off by default, Code workers cannot emit WARC, and
  neither job completion nor a formatted schema proves source truth or
  freshness;
- public scheduling, callback, delivery, sandbox, egress, idempotency, and
  retention contracts are incomplete;
- pricing/free-trial pages conflict over page loads, records/results, free-tier
  shape, concurrency, and “pay only for success”; and
- the MSA's **Web Scraper IDE** clause expressly allows Bright Data to retain
  collected or delivered data and use it for its own purposes. Public API
  metadata still calls the surface `web-scraper-ide-rest-api`, strongly linking
  that clause to Scraper Studio, but the renamed product should still be named
  and overridden in an order form [S14][S22-S31].

**Decision ledger:**

- **ADOPTED:** definition/template/attempt separation; explicit draft-to-
  production publication; human approval for generated changes; per-stage
  minimum-capability workers; new run identity for reruns; optional browser
  WARC; page-load and output cardinality as separate meters.
- **ADAPTED:** Collector ID becomes an adapter-private extractor reference;
  template versions become immutable Curiosity manifests; generated code is
  reviewed like third-party code; stages run under explicit URL/cost/evidence
  bounds; callbacks are untrusted hints.
- **REJECTED:** mutable collector identity as a reproducibility guarantee;
  autonomous Self-Healing to production; unbounded `next_stage`/`rerun_stage`;
  agent-selected arbitrary target, geo, headers, cookies, CAPTCHA, delivery URL,
  or cloud credentials; provider `done`/formatted output as evidence validity.
- **DEFERRED:** any pilot until contract/DPA, retention/reuse, source rights,
  sandbox/egress, version pinning, scheduling, callback, billing, and evidence
  checks pass under a separately authorized no-cost fixture plan.

## 1. Decision frame and bounded questions

The decision is:

> Can a customer-defined Scraper Studio collector safely act as an optional,
> bounded Curiosity extractor while Curiosity retains authority, executable
> identity, source evidence, freshness semantics, cost control, and neutral job
> contracts?

Bounded sub-questions:

1. What does the product generate, and what remains customer-controlled?
2. How do collector, draft, production template, stage, input, page, record, job,
   response, snapshot, schedule, and delivery relate?
3. Which code/browser/proxy/unblocking capabilities are selected and evidenced?
4. Can output establish source, observation time, transformation, integrity,
   completeness, and freshness?
5. Which hard limits, billing units, security/privacy controls, and legal terms
   constrain use?
6. What logical architecture follows from the public behavior without claiming
   private implementation?
7. Which ideas should Curiosity adopt, adapt, reject, or defer?

### Evidence labels

- **FACT** — directly stated or structurally shown by a cited first-party source.
- **INFERENCE** — the narrowest clean-room explanation of documented behavior;
  not a claim about private code, algorithms, databases, or deployment.
- **RECOMMENDATION** — a Curiosity design, governance, evaluation, or
  procurement action.
- **UNKNOWN / NEGATIVE RESULT** — not established by the public sources reviewed.

Confidence is **high**, **medium**, or **low**. Vendor performance, scale,
security-effectiveness, freshness, compliance, and quality claims remain vendor
assertions unless the cited source supplies independent evidence.

## 2. Product model and creation workflow

### 2.1 Product boundary

**FACT (high):** Scraper Studio is a cloud-hosted custom-scraper environment
with two creation modes. The AI Agent turns a target URL and natural-language
requirements into an output schema and JavaScript; the IDE lets a developer
write and debug the same scraper form directly. AI-created collectors can later
be edited in the IDE [S1-S4].

**FACT (high):** Bright Data distinguishes Scraper Studio from its pre-built
Scrapers Library and Dataset Marketplace. Studio is intended for a custom target
or data shape where a pre-built provider-maintained scraper is unavailable. A
separate “Scraper Studio Managed” mode is built and maintained by Bright Data,
whereas ordinary Studio collectors are maintained by the customer or AI [S1]
[S20].

**FACT (medium-high):** the Studio FAQ says the customer owns every line of the
scraper, including AI-generated code, may read/edit it, and may copy the plain
JavaScript into its own repository. It also says external execution would
require replacement proxy and unblocking infrastructure [S18].

**INFERENCE (high):** “own the code” is not portability of the product. The code
depends on Bright Data globals and functions such as `navigate`, `next_stage`,
`parse`, `collect`, browser traffic tagging, proxy-session controls, and typed
file constructors. Reusing its ideas outside Studio requires an independently
designed runtime or translation layer, not merely copying the script [S5-S7].

### 2.2 AI generation workflow

**FACT (high):** the UI flow is: provide target URL/context; answer clarifying
questions; review, inline-edit, replace, or reject a generated schema; approve
the schema; wait while the Agent writes navigation, extraction, validation, and
error-handling code; then run, schedule, or open the result in the IDE. Product
material says generation commonly takes about 10–15 minutes and sends an email
when complete [S2][S22].

**FACT (high):** the public AI Flow API separates creation into (1) create a
scraper entity, (2) trigger asynchronous code/schema generation, and (3) poll
progress. Self-Healing similarly has trigger, progress, `pending_answer`, and
resume/approve-or-reject calls [S15].

**INFERENCE (high):** the generated scraper is an editable proposal plus hosted
definition, not an opaque model response. This is materially safer than silently
executing newly generated scraping code, but only if approval includes code,
schema, target scope, worker type, fan-out, headers/cookies, evidence fields, and
cost review.

**UNKNOWN:** public sources do not identify the generation model, model/version
pin, prompt and target-page retention, training-use policy, deterministic
generation settings, generated dependency manifest, secure-code analysis, or a
machine-readable attestation binding a prompt/schema/code result.

### 2.3 AI Agent scraper shapes are not a generic crawler

**FACT (high):** current AI Agent guidance names five shapes [S2]:

| Shape | Input | Work/output relationship |
|---|---|---|
| PDP | detail-page URLs | normally one visit and one detail row per URL |
| Discovery | listing/category URL | one listing visit may produce many listing rows |
| Discovery + PDP | listing/category URL | listing plus `N` detail visits; many full rows |
| Search | keyword and optional country | search pages, optionally followed by detail visits |
| Sitemap | domain/sitemap URL | sitemap load plus `N` selected page visits |

The same guidance warns that the AI Agent is **not a general crawler** and not to
pass a homepage asking for “everything” [S2]. The IDE nevertheless permits a
custom multi-stage traversal using sitemap loading and child-stage fan-out [S4]
[S5].

**RECOMMENDATION (high):** authorize a collector by exact shape and fan-out.
Approval for a list of known detail URLs must not authorize search, listing
discovery, sitemap traversal, or arbitrary deeper link discovery.

## 3. Generated scraper lifecycle and executable identity

### 3.1 Draft, publication, and stable collector identity

**FACT (high):** IDE work auto-saves as a development draft. A new collector is
made available outside the IDE with **Finish editing**; subsequent changes use
**Save to production**. Draft collectors cannot be externally initiated;
published collectors appear as Active/Ready and receive a stable Collector ID
beginning `c_` [S3][S8][S12].

**FACT (high):** batch and both real-time trigger endpoints accept
`version=dev`, allowing explicit execution of the development version. Default
calls run the published collector [S8-S10].

**FACT (high):** Self-Healing proposes a code diff. Accepting it writes only to
the draft; production changes only after preview and **Save to production**. A
schema-changing edit requires an explicit schema update. Self-Healing keeps the
same Collector ID and can be initiated via UI, CLI, or API. The FAQ clarifies
that it is user-triggered, not an automatic DOM-change repair [S4][S18].

**FACT (medium-high):** the dashboard exposes a Versions menu with rollback;
each run shows a Template version; job metadata includes a value like
`template: t_m9jty150kxgwtzcgi.3` [S4][S13][S20].

**INFERENCE (high):** the externally observable identity model is:

```text
stable collector c_* -> mutable development draft
                     -> current production template t_*.revision
                     -> run j_* or real-time response d*
```

Collector identity is integration identity, not executable identity. A run's
template value is the closest public evidence of the executable revision.

**UNKNOWN (high importance):** no reviewed public trigger contract allows a
caller to name an arbitrary historical production `t_*` revision, return a
cryptographic code/schema hash, retrieve the exact source and runtime manifest
for a past run, or guarantee that rollback restores every worker/runtime/schema/
delivery dependency. `version=dev` is an environment selector, not immutable
revision pinning.

**RECOMMENDATION (high):** an approved adapter must export and hash the reviewed
source, input/output schemas, worker-per-stage settings, evidence fields,
delivery configuration, and normalized target policy before publication. Every
run must retain that Curiosity manifest plus the observed provider template ID.
Do not dispatch after an in-place production update until the manifest is
re-approved.

### 3.2 Deletion and ownership transfer

**FACT (high):** `DELETE /dca/collector/{scraper_id}` irreversibly removes a
collector from My Scrapers and prevents future manual, scheduled, or API runs;
an optional deletion reason can be recorded [S16].

**UNKNOWN:** the public delete contract does not say whether it deletes code
versions, AI prompts/chats, schedules, past job inputs/results, logs, WARC/media,
delivery copies, support artifacts, backups, or provider-retained copies.

**RECOMMENDATION (high):** treat collector deletion, schedule disablement,
credential revocation, retained result deletion, delivery-object deletion, and
contractual erasure as separate decommissioning steps.

## 4. Programming and execution model

### 4.1 Interaction, parser, stages, and records

**FACT (high):** Studio splits code into:

- **interaction code** — JavaScript plus provider functions for navigation,
  direct requests, browser interaction, waits, network capture, stage fan-out,
  sessions, geolocation, and data emission; and
- **parser code** — JavaScript with Cheerio-style selectors and typed value
  constructors that turns the current HTML/tagged responses into objects [S5].

`parse()` runs parser code; `collect(object)` appends an output row;
`set_lines(array)` replaces rows emitted by prior `set_lines` calls so a
progressive run can retain its latest complete set [S5][S6].

**FACT (high):** `next_stage(input)` runs the next stage in a new browser
session; `run_stage(index,input)` selects a stage; and `rerun_stage(input)`
creates another execution of the current stage. Bright Data recommends fanning
pagination out from the root so pages run in parallel rather than recursively
serializing the crawl [S5][S21].

**INFERENCE (high):** one trigger input is a root work item, not a page or record
limit. A collector can create a page graph, and every node may emit zero, one,
or many records. Input count, page loads, discovered pages, successful pages,
records, bytes, and billed units are separate dimensions.

**UNKNOWN:** no public request-level controls cap child stages, total discovered
URLs, depth, pages per input, redirects, bytes, or records. `too_many_pages`
exists, but the numeric threshold and whether it is account/scraper/job/input-
specific are not published [S19].

### 4.2 Code and browser workers

**FACT (high):** every scraper uses a **Code worker** (direct HTTP; no page
JavaScript, click, or scroll) or **Browser worker** (real headless browser with
JavaScript and interaction). Worker-per-stage mode allows a different type for
each stage. Bright Data recommends starting with Code and escalating only when
needed because Browser is slower and more expensive [S6].

**FACT (high):** documented Browser-only capabilities include DOM waits,
click/type/scroll, pop-up handling, CAPTCHA solving, network-idle and DOM-idle
waits, XHR/fetch and GraphQL capture/replay, screenshots/downloads, device and
geolocation emulation, and browser traffic inspection. Both worker contexts can
use direct requests; routing/session functions can set country, proxy location,
cookies, and headers [S5-S7].

**FACT (high):** `navigate()` exposes timeout, wait condition, referrer,
accepted statuses, screen fingerprint, and MIME sniffing. The runtime also
exposes final-URL resolution, redirect history, response headers, and source
status, but collectors must explicitly record those values [S5].

**RECOMMENDATION (high):** Curiosity should model `http`, `render`, `interact`,
`capture_network`, `download`, `geo_route`, `session_state`, and `captcha_solve`
as distinct capabilities. A worker switch is a policy event, not an invisible
quality tier.

### 4.3 Retry and partial-output behavior

**FACT (medium-high):** Bright Data's best-practices guide says Studio performs
job-level retries with a fresh peer session and advises against custom retry
loops. Error guidance distinguishes retryable infrastructure/browser/proxy/rate
failures from deterministic bad input/dead page errors [S19][S21].

**FACT (high):** `set_lines()` can preserve the latest progressive set even if
a later step fails. A configured deadline stops remaining work and delivers
data collected so far; cancellation can leave already collected data available,
while queued pages receive `aborted_page` [S5][S11][S16].

**UNKNOWN:** public docs do not give per-error retry counts, backoff, jitter,
which attempts are billed, retry evidence, attempt IDs, whether page-level
retries preserve the same stage/page ID, or ordering/duplication guarantees when
`collect()` succeeds before worker failure.

**RECOMMENDATION (high):** assume at-least-once page execution and duplicate
records. Give every root and child page an owned operation key; separate page
attempt from output commit; retain partial/aborted state; deduplicate without
erasing attempt lineage.

## 5. Inputs, schemas, outputs, and validation

### 5.1 Input contract

**FACT (high):** input schema fields are named, typed, optionally required,
described, and in some cases constrained to predefined/case-insensitive values.
Inputs may be URLs, keywords, countries, dates, IDs, or custom parameters; a
collector may also hard-code its work and accept no caller input [S7].

**FACT (high):** batch API input is a JSON array of open-ended objects matching
the schema; real-time endpoints accept exactly one object. The UI accepts manual
rows or CSV/TXT/JSON uploads up to 1 GB. A collector can mix optional fields in
one batch if every row conforms to the schema [S8-S11].

**SECURITY INFERENCE (high):** schema validation establishes shape, not target
authority. A syntactically valid URL, header, country, keyword, or cookie can
still expand egress, rights, privacy, cost, and credential risk.

### 5.2 Output schema and emission

**FACT (high):** Studio can infer output schema changes from objects passed to
`collect()` and can edit schema manually in table or JSON view. Current docs
enumerate 18 user field types: text, number, URL, price, boolean, date, country,
phone, image, video, PDF, document, array, object, and HTML-to-text/Markdown/
HTML/JSON-LD conversions [S7].

Fields can be active/hidden, required, defaulted, nested, arrays, formatted,
validated by custom JavaScript, marked as PII, or configured for file download.
Downloaded file objects may include path, remote URL, MIME type, byte size, and
response headers [S7].

**FACT (high):** required or custom validation can turn missing/invalid values
into error rows; warnings can still accompany delivered records. Preview offers
raw output before schema processing and formatted output after types, defaults,
formatting, and validation [S7][S19][S20].

**INFERENCE (high):** schema formatting is a transformation boundary. The raw
emitted object, formatted record, downloaded artifact, and source capture are
different evidence objects. Defaults can conceal absence; custom formatting can
change semantics; a PII flag is metadata, not automatic minimization or access
control.

**RECOMMENDATION (high):** preserve both raw and formatted representations plus
schema/version/hash, formatting and validation disposition. Disallow silent
defaults for evidence-bearing fields. Treat PII markings as policy inputs and
independently scan/minimize output.

### 5.3 System fields and evidence defaults

**FACT (high):** system fields include input, prime/root input, error and warning
text/codes, status, collection/request timestamps, page/job/collector IDs,
queue, crawl type, screenshot, full HTML, and WARC. Only input/error/warning
fields are on by default; most provenance and artifact fields are off [S7].

**FACT (high):** screenshot watermarks can include browser URL, capture time,
and input. The delivery guide says media files cannot be delivered through email
or API pull and require storage, SFTP, or webhook [S7][S11]. The WARC guide,
however, says WARC can use API pull or email as well as those destinations [S21].
Artifact-by-destination compatibility is therefore not a stable generic contract.

**RECOMMENDATION (high):** a Curiosity-approved collector should require input,
prime input, status/error/warning, collection/request timestamps, page/job/
collector identity, and crawl type. Browser collectors used for evidence should
also require URL-watermarked screenshots, HTML, and WARC where rights and cost
permit.

## 6. Collection API and job lifecycle

### 6.1 Three initiation modes

| Mode | Endpoint | Input | Immediate result | Retention |
|---|---|---|---|---|
| Batch | `POST /dca/trigger` | array | `collection_id` (`j_*`) and optional `start_eta` | 16 days |
| Async real-time | `POST /dca/trigger_immediate` | one object | `response_id` (`d*`) | 7 days |
| Sync real-time | `POST /dca/crawl` | one object | data, or HTTP 202 plus `response_id` after 25–50 s timeout | 7 days |

**FACT (high):** batch results are polled with `GET /dca/dataset?id=j_*`, which
returns HTTP 202 `{status:"building"}` until HTTP 200 returns a JSON array.
Real-time results are retrieved by `GET /dca/get_result?response_id=d*`, with
optional 25–50 second long polling [S8-S10][S14].

**FACT (high):** `collection_id`, `snapshot_id`, and batch `job_id` refer to the
same `j_*` run on different pages. This naming drift does not extend to the
real-time `response_id` [S8][S12-S14].

**RECOMMENDATION (high):** normalize logical job, attempt, provider collector,
provider template, batch job, and real-time response separately. Never expose
provider naming aliases as Curiosity core types.

### 6.2 Queueing and dangerous trigger options

**FACT (high):** batch trigger options include production versus `dev`, a name,
queue name, `queue_next`, `confirm_cancel`, media-download suppression,
deadline, notification, and request-level delivery [S8].

**DOCUMENTATION TENSION (high):** quickstart says `queue_next=1` runs inputs
immediately and omitting it queues behind in-flight work; the trigger OpenAPI
says `queue_next` means queue after another collection and defaults to 1. The
FAQ likewise describes queued requests as serial. `confirm_cancel=1` is
documented as canceling an existing run so the new one replaces it, also with a
default of 1 in OpenAPI [S8][S18]. These semantics are too consequential to
infer from parameter names.

**RECOMMENDATION (high):** do not use replace/cancel behavior through an agent.
Before a pilot, obtain exact precedence and defaults for `queue_next`, `queue`,
and `confirm_cancel`, including races and whether omitted parameters can cancel
or serialize work.

### 6.3 States, control operations, rerun, and idempotency

**FACT (high):** job metadata commonly reports `building`, `running`, `done`,
`failed`, and `cancelled`; list/dashboard material also uses `canceled`, `Ready`,
`Active`, `Draft`, `Running`, and pause/resume docs add `paused` [S12-S16][S20].

**FACT (high):** running jobs can be paused and resumed. Cancel permanently
stops remaining inputs and cannot be resumed. Rerun creates a **new** job while
leaving the original untouched; it can replay all or only failed steps while
the old data remains unexpired [S16].

**FACT (high):** ordinary batch trigger is explicitly non-idempotent: replaying
the same request creates a new collection ID and does not deduplicate across
runs. Job metadata separately exposes `dup_inputs`, implying within-job input
deduplication exists, but its identity rule is not documented [S8][S13].

**UNKNOWN:** pause/cancel acknowledgement-to-stop latency, in-flight completion,
partial delivery ordering, duplicate commit behavior, state transition rules,
replay build selection, and the deduplication key behind `dup_inputs`.

### 6.4 Job observability

**FACT (high):** job list/metadata can expose collector/template IDs, queue/
start/finish/expiry times, input and duplicate-input counts, pages and pages
left, page loads/navigations, failures, successes, records/lines, success rate,
queue/job duration, trigger user/IP/type, estimated time left, assigned versus
allowed workers, and run cost [S12][S13][S20].

**LIMITATION (high):** these are job/page aggregates. They do not automatically
bind every delivered field to a source response, attempt, transform, or exact
observation time.

**DOCUMENTATION DEFECT (high):** the published per-job error endpoint
`/dca/jobs/{job_id}/hp_errors` says its ID must come from an undocumented-in-this-
workflow `/trigger_hp`; it may not work for ordinary `/dca/trigger` jobs. The
quickstart nevertheless directs regular users toward that error endpoint [S17].

## 7. Scheduling, publication, and delivery

### 7.1 Scheduling

**FACT (high):** the Control Panel can schedule published collectors with a
start date/time, hourly/daily/weekly/custom frequency, fixed inputs or an input
file, and deadline [S11][S22]. Scheduled runs appear in the same Runs view and
carry trigger and template metadata [S20].

**UNKNOWN / NEGATIVE RESULT:** no reviewed public Studio schedule REST object or
contract defines timezone, DST, clock versus completion-relative cadence,
overlap, concurrency interaction, jitter, catch-up, missed runs, retry, pause,
schedule version pinning, input immutability, schema changes, destination
changes, or behavior when the prior occurrence is still running.

**RECOMMENDATION (high):** Curiosity should own recurrence. Each occurrence
must resolve an approved immutable extractor manifest and inputs into a new
attempt, with explicit `scheduled_for`, `submitted_at`, `started_at`, page
observation times, missed/overlap disposition, and deadline.

### 7.2 Publication is deployment

**FACT (high):** **Save to production** applies draft code/schema changes to the
collector used by external triggers. Development and production can have
separate delivery settings, and `version=dev` can execute the draft [S3][S8]
[S11].

**INFERENCE (high):** Studio's deployment unit is a provider template behind a
stable Collector ID. Save-to-production is a mutable alias update, while job
template metadata is the execution occurrence's revision evidence.

**UNKNOWN:** public sources do not establish branch/review roles, two-person
approval, signed builds, CI policy, environment promotion, immutable artifact
download, secret references, change webhooks, audit retention, or rollback API.

### 7.3 Delivery surface

**FACT (high):** batch completion, split batches, and real-time delivery support
JSON, NDJSON, CSV, XLSX, and sometimes Parquet. Destinations include API pull,
webhook, S3, GCS, Azure Blob, Alibaba OSS, Google Pub/Sub, OCI PAR, SFTP/FTP,
and email; restrictions vary by format and media [S11][S22].

**FACT (high):** outputs can combine or separate successful/error records, or
include only one class. Split delivery emits a configured maximum number of
lines per payload/file. Re-delivery can send dataset only or dataset plus media.
An S3 delivery to an existing key overwrites that object [S11][S20].

**FACT (high):** batch trigger can put `deliver` and `notify` JSON in URL query
parameters. The official S3 example includes access key and secret key inside
that URL-encoded JSON. Notification-only fires after collection; notification
plus delivery fires after delivery [S8].

**SECURITY RECOMMENDATION (high):** reject credentials in URL query parameters;
they are prone to browser, proxy, gateway, tracing, support, and application-log
leakage. Prefer a preconfigured destination using role assumption or another
short-lived, write-only credential if the product supports it; otherwise do not
use push delivery. Never let an agent choose a destination.

**UNKNOWN (high importance):** webhook signature, timestamp/replay protection,
retry count/schedule, redirect policy, ordering, duplicate semantics, payload
compression and uncompressed limit, delivery attempt ID, object atomicity,
checksums, and exact behavior after partial split delivery. Studio's public API
does not expose the separate delivery-job resource available on Bright Data's
newer Datasets API.

## 8. Rendering, proxy, unblocking, and external dependencies

**FACT (high, vendor representation):** Scraper Studio executes on Bright Data
cloud infrastructure with automated proxy management, browser rendering,
fingerprinting, retries, geotargeting, CAPTCHA solving, and unblocking. Product
copy says no customer-managed servers or proxy pool are required [S1][S6][S18]
[S22].

**FACT (high):** collector code can request a country or fine-grained latitude/
longitude/radius, preserve a proxy session across child stages, set cookies and
headers, emulate browser geolocation/device, and explicitly invoke CAPTCHA
solving [S5].

**BOUNDARY FACT (high):** none of this makes Studio's worker a caller-controlled
Browser API or raw proxy contract. Studio code uses a constrained provider
function surface; Bright Data selects and operates underlying workers, peers,
retry behavior, and unblocking infrastructure [S5][S6][S18].

**INFERENCE (medium-high):** public behavior supports a worker scheduler with
separate code and browser pools, a proxy/unblocking broker, fresh-session retry,
and stage queues. It does not establish that separately sold Web Unlocker or
Browser API services are literally called internally.

**UNKNOWN / NEGATIVE RESULT (high confidence):** the default result does not
guarantee disclosure of browser/runtime build, OS/container image, viewport,
locale/timezone, proxy class, exit IP/ASN/geo, session identity, fingerprint,
CAPTCHA event, attempt count, retry reason, worker migration, request DNS/TLS,
or exact headers/cookies sent. Most must be explicitly recorded where the
runtime exposes them; some are not exposed at all.

**RECOMMENDATION (high):** never interpret unblocking success as source
permission, freshness, representativeness, or provenance. Store requested
capability separately from observed execution evidence, and mark undisclosed
details `unknown`.

## 9. Provenance, freshness, and evidence quality

### 9.1 Evidence available by design

**FACT (high):** Studio can expose submitted/root inputs, source status,
redirect chain, response headers, current/final URL, request and collection
timestamps, page/job/collector/template IDs, errors/warnings, screenshot, HTML,
and WARC when the collector records or enables them [S5][S7][S13][S20].

**FACT (high):** Browser-worker WARC is documented as ISO 28500 output
containing browser-side request/response pairs, headers, timestamps, and payload
bytes for traffic captured while the browser is actively loading. It can include
documents, scripts, CSS, images, fonts, XHR, and fetch traffic. Code workers and
their raw `request()` calls cannot produce this browser WARC [S21].

**DOCUMENTATION DRIFT (high):** the schema page calls the system field `warc`,
while the dedicated WARC guide instructs users to enable `warc_snapshot`. The
WARC guide says API/email delivery is supported, while the generic delivery
guide excludes media from API/email [S7][S11][S21]. Verify the actual field and
delivery matrix before treating WARC as guaranteed evidence.

**FACT (high):** waiting for network idle and performing lazy-load interactions
before finalization can enlarge what the WARC captures. Therefore WARC coverage
depends on collector behavior and capture timing; it is not synonymous with all
potential page resources [S21].

**INFERENCE (high):** WARC is the strongest Studio evidence artifact, but still
needs a Curiosity-side content hash, manifest, collection-policy reference, and
binding to output fields. It records observed traffic, not why a field was
selected or whether a transformed value is correct.

### 9.2 Evidence absent by default

**FACT (high):** timestamp/status/page/job/collector/crawl-type/screenshot/HTML/
WARC fields are off by default [S7]. The default structured record may contain
only customer fields plus input/errors.

**UNKNOWN / NEGATIVE RESULT:** no generic contract automatically provides:

- a cryptographic hash of source response, WARC, HTML, formatted row, or code;
- field-to-DOM/network-response grounding;
- immutable input/schema/code/runtime manifest;
- robots/target-policy decision and matched rule;
- requested/final URL and redirect chain on every row;
- attempt/retry/proxy/render/CAPTCHA ledger;
- canonical URL or exact/near-duplicate relation;
- truncation and completeness reason across every field; or
- signed binding among record, artifacts, page, job, and template.

### 9.3 Freshness

**FACT (medium):** each production run processes URL requests and records
request/collection times when enabled. Schedules can repeat collection. Public
Studio material does not present the product as a pre-collected cache [S7][S11]
[S23].

**UNKNOWN (high importance):** no reviewed Studio contract defines cache key,
origin revalidation, bypass, stale-on-error, conditional request, cache
disposition, or freshness SLA. A trigger, schedule, queue, job start, job finish,
or delivery time is not page observation time. A source publication date is a
different field again.

**RECOMMENDATION (high):** retain separately `scheduled_for`, `submitted_at`,
`started_at`, `requested_timestamp`, per-page `timestamp`, `received_at`, and
source publication/update time. Mark `cache_disposition: unknown` unless an
approved collector captures trustworthy response evidence. Never derive
freshness from `done`, delivery, or schedule time.

## 10. Limits and pricing observed on 2026-08-17

Public prices and promotions are volatile. This records the observed meter and
documentation conflicts, not a quote.

### 10.1 Published limits

| Dimension | Current first-party statement / caveat |
|---|---|
| Batch jobs | Up to 100 simultaneous jobs **per scraper**; additional jobs queue. Queue size described as unlimited [S11][S23]. |
| Real-time trigger | `/trigger_immediate`: 50,000 requests/minute per customer [S11][S23]. |
| Real-time result polling | `/get_result`: 165,000 requests/minute, a different limit [S14]. |
| Input upload | CSV/TXT/JSON up to 1 GB in UI [S11]. No public row or per-field maximum found. |
| Page/session size | `page_too_big` at 16 MB; best practices say one session's accumulated lines/results/children/parser metadata also has a 16 MB limit [S19][S21]. |
| Sync wait | 25–50 seconds; then HTTP 202 and asynchronous response ID [S10]. |
| Retention | Batch results/artifacts 16 days; real-time 7 days; then documented permanent deletion [S14][S21][S23]. |
| Error history | Last 1,000 failures per virtual job in IDE [S3][S18]. Retention duration unspecified. |
| Job list | Up to 500 rows/page, date range required [S12]. |
| Fan-out | `too_many_pages` exists, but numeric child/page threshold is unpublished [S19]. |

**CONTRADICTION (high):** product/pricing copy advertises “unlimited
concurrency,” while specifications enforce 100 parallel batch jobs per scraper
and real-time request-rate ceilings [S22][S23]. Treat documented limits as
provider maxima, not safe operating targets.

**CONTRACT QUALIFICATION (high):** 16/7 days are customer result-availability
windows. They must not be treated as complete provider erasure because the MSA
separately permits retention/reuse of Web Scraper IDE data, and the public DPA
uses request/termination plus a “reasonable period” rather than those fixed
windows [S27][S30].

### 10.2 Meter and prices

**FACT (high):** specifications define billing as page loads in CPM plus file
downloads per GB. One page load is one URL request processed by Studio,
regardless of response size. `navigate()`, `request()`, and `load_more()` can
create billable page loads; one page can produce zero, one, or many records
[S18][S23].

**FACT (high):** the dedicated pricing page displayed:

- 5,000 page loads in a free tier;
- PAYG **$1.50/1,000 page loads**;
- Scale **$499/month**, 383,000 included, then **$1.30/1,000**; and
- enterprise custom pricing [S22].

**FACT (high):** the general free-tier page clarifies that those 5,000 are a
single shared monthly credit pool across Web Unlocker, SERP, Web Scraper API,
and Scraper Studio—not 5,000 dedicated Studio loads. Studio consumes one credit
per page load; unused credits do not roll over [S24].

### 10.3 Material pricing/documentation conflicts

1. **Free trial versus free tier.** Pricing FAQ says unlimited tests and three
   published scrapers up to 100 records each, “limited by scraped records”; the
   current free-tier docs say a recurring shared 5,000-credit pool metered by
   Studio page load [S22][S24]. Whether these are concurrent programs is
   **UNKNOWN**.
2. **Page load versus result.** Pricing FAQ defines initial render as one result
   and click/new page or lazy-load scroll as another; specifications define one
   processed URL request and list `navigate`, `request`, and `load_more` [S22]
   [S23]. Complex actions can issue many browser subrequests, but the exact
   billable boundary is not fully specified.
3. **Success-only claim.** Pricing says “pay only for success,” while specs say
   a processed URL request is a page load regardless of response size and best
   practices warn custom retry fan-out spends extra CPM [S21-S23]. Which target,
   proxy, timeout, parser, validation, canceled, or duplicate outcomes are
   billable is not defined publicly.
4. **Payment method.** the Studio API quickstart requires a payment method,
   while the current free-tier and product pages say no credit card is required
   [S8][S22][S24].

**RECOMMENDATION (high):** preflight and cap root inputs, child pages, direct
requests, `load_more`, redirects, retries, renders, records, source bytes,
download bytes, WARC/media bytes, concurrent jobs, deadline, and USD. Reconcile
actual page-load/cost metrics after every run. Provider monthly spend controls
and prepaid wallets are not per-attempt hard bounds.

## 11. Security, privacy, and legal boundaries

This section reports public controls and terms, not legal advice.

### 11.1 Hosted-code, browser, and egress risk

**FACT (high):** Studio code can navigate arbitrary input URLs, make direct HTTP
requests with method/headers/body, set cookies and session headers, preserve
proxy sessions, interact with pages, capture request/response bodies and headers,
replay GraphQL requests, download files, and emit HTML/screenshots/WARC [S5].

**INFERENCE (high):** this is customer-controlled remote web execution. A
malicious input, generated edit, target page, or operator can attempt SSRF,
credential exfiltration, excessive egress, malicious downloads, prompt
injection, and cost amplification unless the platform and Curiosity both bound
it.

**UNKNOWN / NEGATIVE RESULT (high importance):** public Studio material does not
establish private/reserved/link-local/metadata-address blocking; DNS-rebinding
defense; redirect and browser-subresource revalidation; unsafe-port policy;
filesystem/process/package access; parser/browser/container isolation; tenant
boundary; secret-store integration; network egress allowlisting; download
malware scanning; or cleanup after timeout/crash.

**RECOMMENDATION (high):** no sensitive pilot before written sandbox/egress
answers. Independently parse and authorize initial URL, redirects, child-stage
inputs, direct requests, downloads, and returned URLs. Use no target credentials,
cookies, login sessions, internal endpoints, or secrets in collector input/code.
Treat all target content, network captures, filenames, errors, and AI-generated
code as untrusted.

### 11.2 Authentication and control-plane permissions

**FACT (high):** Studio APIs use Bearer API keys. Keys can expire and use one of
five broad profiles: Admin, Finance, Ops, Limit, or User. Each user can generate
one key; it is displayed once and can be refreshed [S25].

**UNKNOWN:** no reviewed public source establishes a Studio-only key, per-
collector create/run/edit/delete grants, dev-versus-production grant, API source
IP allowlist, two-person publication approval, or schedule/delivery-specific
permission.

**RECOMMENDATION (high):** use an expiring `User` key in a secret manager and a
dedicated account/environment if possible. Separate collector-author, publisher,
runner, and destination-manager duties outside Studio where native roles cannot.
Never expose delete, Self-Heal auto-approve, replace/cancel, `version=dev`, or
request-level delivery to an autonomous retrieval agent.

### 11.3 Published platform security

**FACT (medium):** Bright Data reports ISO/IEC 27001:2022, ISO 27017, ISO 27018,
SOC 2 Type II under NDA, public SOC 3, TLS 1.3/minimum 1.2, AES-256 at rest, AWS
multi-AZ, RBAC, secure SDLC, encrypted backups, and annual penetration testing.
The 2025 independent test scope expressly included Web Scraper IDE, Marketplace,
and API [S26]. Certifications and attestations do not prove the unknown Studio-
specific controls above.

**FACT (high):** Bright Data itself warns that scraped content is untrusted and
should be validated/filtered before entering LLM prompts [S26].

### 11.4 Public data, login contradiction, and source authority

**FACT (high):** the product page and AUP say collection is for publicly
available information and prohibit nonpublic/behind-login collection [S22][S28].

**CONTRADICTION (high):** worker documentation says Browser workers are suitable
for login flows, and the AI Agent FAQ says login-required sites can be built in
the IDE with `set_session_cookie()` or another authentication pattern [S2][S6].
Those technical statements conflict with the AUP/product policy and do not grant
authorization.

**RECOMMENDATION (high):** Curiosity must reject login, paywall, private account,
or access-control workflows regardless of runtime capability. It must decide
robots, target terms, copyright/database rights, privacy, purpose, rate, and
publisher opt-out before dispatch. Proxy/CAPTCHA success, KYC, or provider
acceptance cannot override a local denial.

### 11.5 Personal data and DPA

**FACT (high):** the Privacy Policy covers account/KYC data, IDs and possibly
recorded calls; says publicly posted personal data may be collected/shared to
provide services; uses purpose/legal-need rather than fixed retention; and
provides GDPR/CCPA rights channels. It says Bright Data does not sell **User
Data**, while its CCPA notice says it may have sold the category “Identifiers”
in the prior 12 months [S29].

**FACT (high):** the public DPA requires documented instructions,
confidentiality, rights/DPIA/breach assistance, breach notice without undue
delay, cessation/deletion on request or termination within a reasonable period
subject to law, reasonable security, general subprocessor authorization with
seven days' notice and objection, transfer safeguards, and annual audit rights
on 30 days' notice [S30].

**UNKNOWN:** the public DPA has no Studio processing annex naming generated
prompts/code, target URLs, inputs, outputs, WARC/media, logs, error history,
schedules, data subjects/categories, purpose, fixed retention, regions, or named
subprocessors. It gives no fixed breach-notification hours or backup-deletion
period.

**RECOMMENDATION (high):** PII schema flags do not establish lawful basis.
Require purpose and field allowlists, minimization, rights/correction/deletion
propagation, fixed Curiosity retention, region/subprocessor review, and counsel
for the specific target/use case. Do not collect sensitive attributes because a
generated schema can.

### 11.6 MSA, code, output, and data reuse

**FACT (high):** the June 2026 MSA's specific **Web Scraper IDE** terms describe
a service collecting and delivering publicly available data and say Bright Data
may retain data it collected or delivered and use it for its own purposes in its
sole discretion. The MSA places legal/privacy/third-party-right responsibility
on the client; prohibits using Data Services output to offer a similar or
competitive product; disclaims accuracy, completeness, non-infringement,
security, and uninterrupted operation; limits liability; and imposes broad
client indemnity [S27].

**INFERENCE (medium-high):** “Web Scraper IDE” is very likely the contractual
predecessor/name for Scraper Studio because current public Studio OpenAPI blocks
still identify themselves as `web-scraper-ide-rest-api`, and Studio is the
hosted IDE data-collector product. This is product/technical evidence, not a
legal conclusion [S8-S17][S27].

**MATERIAL UNKNOWN:** the order-form classification of the renamed Scraper
Studio; ownership/license for runtime-specific generated code beyond the FAQ;
rights to internal redistribution and derived indexes; provider use for model
training or product improvement; exact code/prompt/input/output/artifact/log/
backup retention; and whether “own every line” is contractually binding.

**RECOMMENDATION (high):** require an order form that expressly names Scraper
Studio and overrides independent retention/reuse/training; defines code and
output ownership/license, portability and internal derivative rights; fixes
retention/deletion and regions/subprocessors; preserves WARC/HTML evidence
rights; provides schema/runtime-change notice; and allocates target complaint,
takedown, and data-subject duties.

## 12. Clean-room logical architecture

The following is **INFERENCE**, not a claim about Bright Data source code,
service boundaries, queues, databases, models, or deployment topology.

```text
AI Agent / IDE / CLI / AI Flow API
  -> collector control plane
       stable collector c_*
       development draft -> reviewed production template t_*.revision
       input/output schema | worker-per-stage | delivery | schedule
  -> bearer-authenticated run admission
       batch j_* | real-time d* | queue/deadline/cost controls
  -> stage/work graph coordinator
       root inputs -> next/run/rerun child stages
       retries / pause / resume / cancel / rerun
  -> worker pools
       Code worker: direct HTTP + parser
       Browser worker: headless browser + interaction/network capture
            -> proxy / geo / session / unblocking / CAPTCHA broker
            -> target web
       parser + schema formatting/validation
  -> result and artifact store
       rows | errors | HTML | screenshot | WARC | media
       job/template/page-load/cost metadata | 7/16-day expiry
  -> delivery workers
       API pull | webhook | object store | queue | SFTP | email
```

Evidence supporting the decomposition:

- separate AI entity/generation/progress and Self-Heal approval APIs [S15];
- stable collector, draft/prod execution selector, and per-run template revision
  [S8-S10][S13];
- explicit stage fan-out into new sessions and worker-per-stage selection
  [S5][S6];
- worker lifecycle/proxy/browser/storage error classes and fresh-peer retries
  [S19][S21];
- durable jobs with queue/page/worker/output/cost state [S12][S13][S20]; and
- independent retained outputs/artifacts and configurable delivery [S11][S21].

**INFERENCE (high):** the best pattern is stable logical extractor identity plus
reviewed versions plus immutable run identity. The central weakness is that the
stable ID mutates in place while the public caller cannot pin or hash the full
runtime manifest. Evidence is capable but opt-in.

## 13. Curiosity implications and verdict ledger

| Product idea | Verdict | Confidence | Curiosity disposition |
|---|---|---:|---|
| AI schema/code proposal with approval | **ADOPTED** | High | Generation ends at a review gate; no direct production mutation. |
| Stable definition, version, run separation | **ADOPTED and strengthened** | High | Use immutable manifests/digests; stable alias only points to approved revision. |
| Draft versus production | **ADOPTED** | High | Separate test and production authority, credentials, inputs, delivery, and data. |
| Code versus browser per stage | **ADOPTED** | High | Minimum capability per stage; browser escalation requires approval. |
| Root/child stage graph | **ADAPTED** | High | Explicit normalized edges, depth/page/byte/time/cost ceilings, and operation keys. |
| Schema inference and formatted output | **ADAPTED** | High | Preserve raw output; quarantine drift; hash schema and transformations. |
| Required/default fields | **ADAPTED** | High | Required evidence fails closed; defaults cannot fabricate source values. |
| WARC + screenshot + HTML | **ADOPTED for evidence lane** | High | Content-address, bind to page/run/output, export before expiry. |
| Stable Collector ID alone | **REJECTED as reproducibility** | High | Mutable integration alias, never executable identity. |
| Self-Heal auto-approve | **REJECTED** | High | Generated changes cannot alter targets, capabilities, schema, or spend autonomously. |
| Provider retries/fresh peer | **ADAPTED** | Medium-high | Only inside owned attempt/deadline/request/cost budget; preserve duplicate risk. |
| Provider `done`/success rate | **REJECTED as quality proof** | High | Operational status, not source truth, completeness, freshness, or rights. |
| Request-level delivery credentials | **REJECTED** | High | Never secrets in query strings; destinations are pre-approved and least privilege. |
| Hosted Studio adapter | **DEFERRED** | High | Contract, sandbox, evidence, pricing, and authorized fixture gates first. |
| Studio as Curiosity core/runtime | **REJECTED** | High | Proprietary DSL/runtime, mutable alias, provider job and delivery semantics. |

### Provider-neutral extractor manifest

**RECOMMENDATION (high):** a later approved adapter would need at least:

```text
extractor_definition_id, immutable_revision_id, source_code_hash
input_schema_hash, output_schema_hash, transform_manifest_hash
stage_graph_hash, worker_type_per_stage, allowed_capabilities
target_scope_policy_id, robots_rights_purpose_decision_id
redirect/subresource/download/geo/session/captcha policies
max_inputs/pages/depth/requests/redirects/retries/renders/records/bytes/usd/time
logical_job_id, submission_id, attempt_id, provider_collector_id
provider_template_id, provider_job_or_response_id, parent_attempt_id?
scheduled_for?, submitted_at, started_at, finished_at, received_at
requested_url, normalized_url, final_url?, redirect_chain?
page_observed_at?, source_status?, response_headers_hash?
raw_capture_hash?, warc_hash?, html_hash?, screenshot_hash?
raw_record_hash, formatted_record_hash, field_lineage[]
warnings[], errors[], partial, stop_reason, completeness
page_loads, download_bytes, records, actual_cost
retention_until, deletion_status, untrusted_external_data=true
```

Unknown fields remain null/unknown; they must not be inferred from schedule,
job completion, or delivery time.

## 14. Fact / inference / recommendation ledger

| ID | Type | Claim | Confidence | Origin / check |
|---|---|---|---:|---|
| F1 | FACT | AI and IDE produce the same editable collector form. | High | S1-S4. |
| F2 | FACT | Draft publication changes production behind a stable `c_*` ID. | High | S3, S4, S8, S18. |
| F3 | FACT | Runs record a provider template revision such as `t_*.3`. | High | S13, S20. |
| F4 | FACT | Batch trigger is non-idempotent across runs. | High | S8. |
| F5 | FACT | Code and Browser workers can be selected per stage. | High | S6. |
| F6 | FACT | Child stages run in new sessions and can fan out. | High | S5. |
| F7 | FACT | One page load may emit many records; billing is page-load based. | High | S18, S23. |
| F8 | FACT | Most source-evidence system fields are off by default. | High | S7. |
| F9 | FACT | Browser WARC captures observed browser requests/responses; Code worker lacks it. | High | S21. |
| F10 | FACT | Batch and real-time retention are 16 and 7 days. | High | S14, S21, S23. |
| F11 | FACT | Public schedule UI exposes recurrence and deadline, not complete semantics. | High | S11. |
| F12 | FACT | Studio APIs expose pause/resume/cancel/new-ID rerun. | High | S16. |
| F13 | FACT | Pricing/concurrency/free-trial materials conflict. | High | S8, S22-S24. |
| F14 | FACT | MSA Web Scraper IDE permits provider retention/reuse. | High | S27. |
| F15 | FACT | AUP forbids behind-login data, despite login-capable docs. | High | S2, S6, S22, S28. |
| I1 | INFERENCE | Collector ID is a mutable alias, not immutable executable identity. | High | F2-F3. |
| I2 | INFERENCE | Execution is at-least-once at page/record boundary. | Medium-high | retries, rerun, pause/cancel partials, absent commit guarantee. |
| I3 | INFERENCE | Studio has worker pools, work graph, result store, and delivery workers. | High | F3-F12; exact internals unknown. |
| I4 | INFERENCE | “Own the code” does not export the proprietary runtime. | High | S5, S6, S18. |
| I5 | INFERENCE | Web Scraper IDE terms likely correspond to renamed Studio. | Medium-high | current OpenAPI label plus product continuity; legal confirmation required. |
| R1 | RECOMMENDATION | Pin and hash an owned extractor manifest before every run. | High | F2-F3, I1. |
| R2 | RECOMMENDATION | Enforce target/capability/work/cost authority before dispatch. | High | F5-F7, legal boundary. |
| R3 | RECOMMENDATION | Export and hash WARC/HTML plus raw/formatted rows. | High | F8-F10. |
| R4 | RECOMMENDATION | Defer provider use pending written no-reuse and sandbox terms. | High | F13-F15 and unknowns. |

## 15. Unknowns and required pre-adoption checks

### Contract, privacy, and code rights — blockers

1. Make the order form name **Scraper Studio / Web Scraper IDE** and override
   provider retention, independent use, and training for code, prompts, inputs,
   outputs, network captures, WARC/media, errors, logs, and backups.
2. Define customer ownership/license for AI-generated and customer-edited code,
   output, schemas, derived indexes, and artifacts; confirm export and post-
   termination use rights.
3. Obtain a Studio processing annex, named subprocessors/regions, transfer
   mechanism, fixed incident deadline, deletion/backups SLA, and erasure proof.
4. Confirm target complaints/takedowns, data-subject rights, source terms,
   robots, IP/database rights, and indemnity for the proposed corpus and purpose.

### Definition, version, and generation

5. Prove how to export exact code, schemas, worker/stage settings, runtime build,
   delivery config, and immutable template revision for every run.
6. Verify historical revision pinning, rollback completeness, schema migration,
   schedule revision behavior, change audit, and deletion scope.
7. Obtain AI model/version, prompt/target/code retention and training policy,
   generated-code security checks, tenant isolation, and approval audit.

### Runtime and egress

8. Document blocking for private/reserved/link-local/cloud-metadata addresses,
   DNS rebinding, redirects, alternate IPs, unsafe ports, browser subresources,
   popups, service workers, downloads, and direct `request()` calls.
9. Document code/parser/browser/container isolation, filesystem/process/package
   access, secrets, worker cleanup, cross-job session/cache state, and malware
   scanning.
10. Define per-page retry classes/count/backoff, attempt IDs, fresh-peer billing,
    duplicate commits, partial output, and cancellation/pause races.

### API, scheduling, and delivery

11. Resolve `queue_next`, `queue`, and `confirm_cancel` defaults/precedence and
    test ambiguous trigger retries without duplicating cost.
12. Reconcile state vocabularies (`done`/`ready`, `canceled`/`cancelled`, paused)
    and publish legal transitions with timestamps.
13. Supply schedule timezone/DST/overlap/missed-run/catch-up/retry/version/input/
    destination semantics and a supported schedule API if required.
14. Supply webhook signature/replay/retry/order/duplicate/redirect/size rules,
    delivery attempt IDs, checksums, split atomicity, and redelivery semantics.
15. Provide a regular-batch per-input error API, not the `/trigger_hp`-specific
    ambiguity.

### Evidence, quality, and cost

16. Verify required source/final URL, redirect, status, headers, exact observation
    time, job/template/page identity, errors, and artifact binding per row.
17. Verify WARC completeness, request coverage, byte fidelity, timestamps,
    compression, media delivery, hashes after pull, and Code-worker alternatives.
18. Define cache behavior/freshness, page/input canonicalization, within-job
    dedupe key, child graph completeness, and deterministic stop reasons.
19. Reconcile page load/result/record/success billing, built-in retries, failures,
    cancellation, deadline, duplicate input, redirects, subrequests, downloads,
    WARC/media, free tier, and promotion.
20. Establish hard request-level page/child/byte/record/download/USD ceilings;
    otherwise a generated collector is not safely admissible.

No test is authorized by this report. Any future test requires separate caller
authority, a project-owned or expressly permitted fixture, no credentials in
target content, a hard no-cost budget, and security/legal/privacy approval.

## 16. Contradictions and retained negative results

| Topic | First-party evidence | Safe treatment |
|---|---|---|
| Login | Product/AUP prohibit behind-login; worker and Agent docs describe login/session-cookie use [S2][S6][S22][S28] | Prohibit login; technical capability is not policy permission. |
| Queue | Quickstart says `queue_next=1` immediate; OpenAPI/FAQ describe queue-after-running [S8][S18] | Written/default contract check before use. |
| Status | `building/running/done/failed/cancelled`, dashboard `Ready/Canceled`, control `paused` [S12-S16][S20] | Preserve raw state; normalize defensively. |
| Error API | Regular trigger docs link errors; endpoint says IDs come from `/trigger_hp` [S8][S17] | Do not assume per-input error retrieval for ordinary jobs. |
| Free use | 5K Studio page loads, shared 5K credits, and 3×100-record trial [S22-S24] | Dashboard/order form controls; budget zero until clarified. |
| Payment method | Studio quickstart requires one; free-tier pages say none [S8][S22][S24] | Do not create an account/test under this report. |
| Meter | Page loads versus pricing “result”; records are separate [S22][S23] | Budget all three dimensions. |
| Pay for success | Marketing says success-only; specs say processed request/page load [S22][S23] | Budget all attempts until billable event is written. |
| Concurrency | “Unlimited” marketing versus 100 batch jobs and rate ceilings [S22][S23] | Use documented ceiling, then set much lower local limits. |
| WARC field/delivery | `warc` versus `warc_snapshot`; WARC guide permits API/email while generic media delivery does not [S7][S11][S21] | Contract-test an approved fixture; require owned export before relying on evidence. |
| Retention meaning | Product docs say result expiry/permanent deletion after 16/7 days; MSA permits IDE-data retention/reuse [S14][S23][S27] | Treat as availability, not erasure; require written deletion matrix. |
| Product legal name | Current Scraper Studio; MSA/API internals say Web Scraper IDE [S8-S17][S27] | Written order-form classification and override. |

Additional **negative results** from the reviewed public sources:

- no caller idempotency key on batch or real-time creation;
- no immutable historical production revision parameter or code/runtime hash;
- no complete public schedule object/semantics;
- no cryptographic callback contract or complete delivery attempt model;
- no public Studio-specific SSRF/egress and tenant-sandbox specification;
- no generic cryptographic record/artifact/code binding or field grounding;
- no uniform per-page retry/proxy/render/CAPTCHA ledger;
- no numeric public child-page/fan-out ceiling;
- no fixed payload/log/error/AI-prompt/code-version/backup retention matrix;
- no empirical accuracy, latency, availability, WARC fidelity, isolation, or
  charged-cost result because account/credential/target tests were prohibited.

## 17. Bounded curiosity pass and stop

Scores are relevance/value/novelty/cost from 1 (low) to 5 (high). Only public,
first-party, in-frame threads were eligible.

| Thread | R/V/N/C | Decision and result |
|---|---:|---|
| Stable collector versus immutable executable | 5/5/5/1 | **Pursued.** Stable `c_*`, mutable draft/prod, run `template t_*.revision`, rollback, and `version=dev` found; historical production pin/hash remains unknown. |
| Evidence beyond structured rows | 5/5/4/1 | **Pursued.** Optional source fields and Browser WARC found; most are off by default and Code worker lacks WARC. |
| Trigger idempotency and queue defaults | 5/5/4/1 | **Pursued.** Non-idempotency is explicit; `queue_next`/replace semantics conflict and remain a check. |
| Login/AUP boundary | 5/5/5/1 | **Pursued.** Direct first-party contradiction retained; capability does not authorize use. |
| MSA applicability after rename | 5/5/5/2 | **Pursued.** Current OpenAPI still says Web Scraper IDE, strongly linking the clause, but order-form confirmation/override remains necessary. |
| Pricing unit and free allowance | 5/5/4/1 | **Pursued.** Page-load/record/result and shared/dedicated trial claims retained rather than harmonized. |
| Hidden worker, proxy, or self-healing implementation | 1/1/4/5 | **CURIOSITY_NO_GO:** proprietary, unnecessary for the decision, and outside clean-room/access boundaries. |
| Generate or run a scraper | 4/5/4/5 | **CURIOSITY_NO_GO:** caller prohibited credentials, free/paid tests, target requests, and implementation. |
| Probe SSRF, private IP, redirects, CAPTCHA, login, or sandbox escape | 5/5/4/5 | **CURIOSITY_NO_GO:** unauthorized security/bypass testing; written controls are required first. |
| Reproduce fingerprinting or unblocking | 2/1/4/5 | **CURIOSITY_NO_GO:** bypass-oriented and irrelevant to neutral contract assessment. |
| Jurisdiction-specific scraping opinion | 5/5/4/5 | **CURIOSITY_NO_GO:** requires target, purpose, data, jurisdiction, and counsel. |
| Third-party reviews/benchmarks | 2/2/2/3 | **CURIOSITY_NO_GO:** primary sources reached coverage; reviews cannot resolve contract semantics. |

**Coverage:** workflow/model; generated lifecycle; inputs/outputs; job, scheduling,
publication and delivery; rendering/proxy dependencies; provenance/freshness;
limits/pricing; security/privacy/legal; architecture inference; clean-room lessons;
Curiosity implications; facts/inferences/recommendations; confidence, unknowns,
checks, contradictions, and verdicts are covered.

**Saturation:** additional first-party searches repeated the same Studio guides
and API summaries without resolving revision pinning, schedule semantics,
sandbox/egress, callback guarantees, billable failures, or exact retention.

**Stop:** coverage and source saturation reached. Remaining material questions
require written vendor answers, counsel/security/privacy review, or new caller
authority for a bounded fixture evaluation. No live autonomous follow-up is
authorized beyond this declared frame.

## Primary sources

All sources are first-party Bright Data materials accessed **2026-08-17**.
Product, scale, performance, compliance, freshness, and security-effectiveness
statements are vendor claims unless the cited source supplies an independent
report.

- **[S1]** Bright Data, “When to use Scraper Studio.”
  <https://docs.brightdata.com/datasets/scraper-studio/introduction>
- **[S2]** Bright Data, “Build a scraper with the AI Agent.”
  <https://docs.brightdata.com/datasets/scraper-studio/ai-agent>
- **[S3]** Bright Data, “Develop a scraper with the IDE.”
  <https://docs.brightdata.com/datasets/scraper-studio/develop-a-scraper>
- **[S4]** Bright Data, “Fix scrapers with the Self-Healing tool.”
  <https://docs.brightdata.com/datasets/scraper-studio/self-healing-tool>
- **[S5]** Bright Data, “Scraper Studio functions reference.”
  <https://docs.brightdata.com/datasets/scraper-studio/functions>
- **[S6]** Bright Data, “Scraper Studio worker types.”
  <https://docs.brightdata.com/datasets/scraper-studio/worker-types>
- **[S7]** Bright Data, “Input and output schema.”
  <https://docs.brightdata.com/datasets/scraper-studio/input-and-output-schema>
- **[S8]** Bright Data, Studio API quickstart and batch trigger OpenAPI.
  <https://docs.brightdata.com/datasets/scraper-studio/quickstart>,
  <https://docs.brightdata.com/api-reference/scraper-studio-api/Trigger_a_scraper_for_batch_collection_method>
- **[S9]** Bright Data, async real-time trigger.
  <https://docs.brightdata.com/api-reference/scraper-studio-api/initiate-a-realtime-job/async-realtime-job>
- **[S10]** Bright Data, synchronous real-time trigger.
  <https://docs.brightdata.com/api-reference/scraper-studio-api/initiate-a-realtime-job/sync-realtime-job>
- **[S11]** Bright Data, “Initiate collection and delivery.”
  <https://docs.brightdata.com/datasets/scraper-studio/initiate-collection-and-delivery-options>
- **[S12]** Bright Data, list collectors and jobs.
  <https://docs.brightdata.com/api-reference/scraper-studio-api/list-scrapers>,
  <https://docs.brightdata.com/api-reference/scraper-studio-api/list-jobs>
- **[S13]** Bright Data, get job metadata.
  <https://docs.brightdata.com/api-reference/scraper-studio-api/job-data>
- **[S14]** Bright Data, receive batch and real-time data.
  <https://docs.brightdata.com/api-reference/scraper-studio-api/Receive_batch_data>,
  <https://docs.brightdata.com/api-reference/scraper-studio-api/Receive_data_from_real_time_work_scraper>
- **[S15]** Bright Data, AI Flow API overview and create/refactor flows.
  <https://docs.brightdata.com/api-reference/scraper-studio-api/ai-flow/overview>,
  <https://docs.brightdata.com/api-reference/scraper-studio-api/ai-flow/create-scraper-template>,
  <https://docs.brightdata.com/api-reference/scraper-studio-api/ai-flow/trigger-ai-flow>,
  <https://docs.brightdata.com/api-reference/scraper-studio-api/ai-flow/ai-job-progress>,
  <https://docs.brightdata.com/api-reference/scraper-studio-api/ai-flow/trigger-self-healing>,
  <https://docs.brightdata.com/api-reference/scraper-studio-api/ai-flow/self-healing-job-progress>,
  <https://docs.brightdata.com/api-reference/scraper-studio-api/ai-flow/resume-self-healing-job>
- **[S16]** Bright Data, pause/resume/cancel/rerun/delete APIs.
  <https://docs.brightdata.com/api-reference/scraper-studio-api/pause-job>,
  <https://docs.brightdata.com/api-reference/scraper-studio-api/resume-job>,
  <https://docs.brightdata.com/api-reference/scraper-studio-api/cancel-job>,
  <https://docs.brightdata.com/api-reference/scraper-studio-api/rerun-job>,
  <https://docs.brightdata.com/api-reference/scraper-studio-api/delete-scraper>
- **[S17]** Bright Data, “Get errors for a job.”
  <https://docs.brightdata.com/api-reference/scraper-studio-api/get-errors-for-job>
- **[S18]** Bright Data, “Scraper Studio FAQs.”
  <https://docs.brightdata.com/datasets/scraper-studio/faqs>
- **[S19]** Bright Data, “Scraper Studio error codes.”
  <https://docs.brightdata.com/datasets/scraper-studio/error-codes>
- **[S20]** Bright Data, Studio dashboard/features and IDE interface.
  <https://docs.brightdata.com/datasets/scraper-studio/features>,
  <https://docs.brightdata.com/datasets/scraper-studio/scraper-studio-ide-interface>
- **[S21]** Bright Data, WARC snapshots and IDE best practices.
  <https://docs.brightdata.com/datasets/scraper-studio/warc-ide>,
  <https://docs.brightdata.com/datasets/scraper-studio/best-practices>
- **[S22]** Bright Data, Scraper Studio product and pricing pages.
  <https://brightdata.com/products/web-scraper/studio>,
  <https://brightdata.com/pricing/web-scraper/studio>
- **[S23]** Bright Data, “Scraper Studio specifications.”
  <https://docs.brightdata.com/datasets/scraper-studio/specifications>
- **[S24]** Bright Data, “Free tier.”
  <https://docs.brightdata.com/general/account/billing-and-pricing/free-tier>
- **[S25]** Bright Data, “Authentication.”
  <https://docs.brightdata.com/api-reference/authentication>
- **[S26]** Bright Data, “Security & compliance.”
  <https://docs.brightdata.com/general/security/security-overview>
- **[S27]** Bright Data, Master Service Agreement, updated 2026-06-16.
  <https://brightdata.com/license>
- **[S28]** Bright Data, Acceptable Use Policy.
  <https://brightdata.com/acceptable-use-policy>
- **[S29]** Bright Data, Privacy Policy, reviewed 2026-05-14.
  <https://brightdata.com/privacy>
- **[S30]** Bright Data, public Data Protection Addendum (two-page PDF).
  <https://brightdata.com/static/web/Bright-Data-Data-Protection-Agreement.pdf>
- **[S31]** Bright Data documentation index and complete public docs corpus,
  used to retain negative searches.
  <https://docs.brightdata.com/llms.txt>,
  <https://docs.brightdata.com/llms-full.txt>

## Confidence summary

- **High:** documented creation/edit/publication workflow; collector/run IDs;
  batch/real-time calls; non-idempotency; stages and worker capabilities; schema
  and system fields; job controls/metadata; retention; current list prices;
  published MSA/AUP/privacy text.
- **Medium:** clean-room architecture; exact relation between Studio and the
  MSA's renamed Web Scraper IDE; vendor assertions about retries, unblocking,
  scale, WARC fidelity, and security controls not empirically tested here.
- **Low/unknown:** immutable revision pinning and runtime identity; schedule
  semantics; callback/delivery guarantees; sandbox/egress isolation; per-page
  retry/billing; cache/freshness contract; exact AI/code/payload/log/backup
  retention; empirical accuracy, availability, latency, security, and cost.
