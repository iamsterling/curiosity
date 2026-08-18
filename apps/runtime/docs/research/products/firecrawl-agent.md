# Firecrawl Agent: clean-room reverse-engineering dossier

**Research and source-access date:** 2026-08-17  
**Subject:** hosted `POST /v2/agent`, `GET /v2/agent/{jobId}`, and
`DELETE /v2/agent/{jobId}` as a standalone product. Firecrawl Extract,
FIRE-1-inside-Scrape/Extract, Parallel Agents, the historical Deep Research API,
and the MIT `web-agent` project are separated explicitly.  
**Pinned Firecrawl OSS release:** `v2.11.162`, resolved checkout
`7666c1f9ae8720a6bba271e0f60b6a217f8a5210` (2026-07-30).  
**Pinned `firecrawl/web-agent` revision:**
`f023adf1cd1f731e27fdc844af62996f6c2a41c4` (main resolved 2026-08-17).  
**Status:** research only. No API request, free or paid run, target fetch,
playground use, browser action, traffic interception, vulnerability test,
deployment, or source-code transfer was performed. This is not legal advice or
a quality benchmark.

## Executive verdict

**DEFER Firecrawl Agent as a Curiosity provider and REJECT it as Curiosity's
evidence system of record (high confidence).** Agent is a hosted, Cloud-only
Research Preview product whose public contract combines planning, web search,
scraping/parsing, remote browser actions, model extraction, and final collation
behind one prompt. It has a useful hard credit ceiling, asynchronous job
lifecycle, cooperative cancellation, action webhooks, and structured output.
But the ordinary result contains only generated `data`, model preset, expiry,
and aggregate credits—no source list, captures, quotes, timestamps, search
queries, action trace, cache state, per-source failures, coverage, or stop
reason [S1-S5].

**ADAPT the bounded-loop patterns, not the authority boundary (high
confidence).** Curiosity should adopt a caller-owned research frame, aggregate
resource ledger, typed lifecycle, cooperative cancellation plus hard abort,
separate planner proposals, deterministic tool admission, and structured final
output. It should reject a model's implicit authority to widen from optional
seed URLs to the web, operate a browser, select arbitrary sources, decide
evidence sufficiency, and collapse evidence into ungrounded JSON [S1][S7][S13].

**Treat Agent and Extract as different products (high confidence).** Agent
launched on 2025-12-18 as the successor to Extract and remains active but in
early-access Research Preview. Extract is an older URL-led collation endpoint;
Agent is a prompt-led autonomous acquisition and extraction loop. The older
FIRE-1 beta is yet another surface: a browser-navigation option inside v1
Scrape/Extract. Neither should be used to infer Agent's current contract [S1]
[S6][S18].

**Do not infer hosted internals from either open repository (high confidence).**
The pinned AGPL server validates and fronts Agent, but delegates execution to a
separate configured service. Firecrawl's later MIT `web-agent` repository is
explicitly “not a port” of hosted `/agent`; it is only a lighter reference using
Search, Scrape, Interact, a plan-act loop, skills, and subagents [S13-S17].

## 1. Decision frame, bounded questions, and evidence rules

### 1.1 Decision and sub-questions

The decision is whether Firecrawl Agent's externally observable product contract
or clean-room design lessons should influence Curiosity's bounded research loop
without copying code, treating model output as evidence, or delegating retrieval
authority to an opaque hosted planner.

Bounded questions:

1. What is Agent's current lifecycle and how is it distinct from Extract,
   FIRE-1, Parallel Agents, legacy Deep Research, and `web-agent`?
2. What do prompt, seed URLs, strict URL constraint, schema, model, credit cap,
   webhook, threat policy, and output fields actually promise?
3. What can be established about planning, Search/Scrape/Parse/browser
   dependencies, parallelism, and semantic stopping?
4. Which work, time, spend, output, cancellation, queue, and retention bounds are
   hard contracts, and which are absent?
5. Can a consumer prove source provenance, support, freshness, cache use,
   completeness, or stop cause from the result?
6. What privacy, safety, legal-use, and licensing constraints matter?
7. What should Curiosity adopt, adapt, reject, or defer?

### 1.2 Method and labels

Primary evidence is Firecrawl's current feature/API, webhook, billing, limits,
threat, deployment, privacy, terms, launch, and model documentation, plus a
read-only inspection of the pinned Firecrawl server release. The later MIT
`web-agent` repository is used only to establish its boundary from hosted Agent
and to triangulate the published high-level tool decomposition. Vendor claims
prove what Firecrawl publishes, not comparative accuracy, security, or Cloud
implementation. Pinned source describes that revision, not necessarily current
Cloud code or configuration.

- **FACT** — directly stated by a cited primary source or pinned source file.
- **INFERENCE** — bounded interpretation consistent with facts, not a claim
  about proprietary implementation.
- **RECOMMENDATION** — proposed Curiosity design or governance choice.
- **UNKNOWN / NEGATIVE RESULT** — not established in the reviewed sources.
- Confidence is **high**, **medium**, or **low**.

**Clean-room boundary:** public, no-account materials and openly licensed source
only. No hosted-service reverse engineering, hidden API discovery, bypass,
prompt extraction, benchmark calls, or implementation copying. **Stop rule:**
stop when every requested category has primary evidence or an explicit unknown
and remaining questions require a controlled service test or vendor disclosure.

## 2. Product identity and lifecycle

### 2.1 Current status

**FACT (high):** Firecrawl launched `/agent` on 2025-12-18 in “research
preview.” Current docs still label it “Research Preview,” “early access,” and
warn of rough edges and significant future change. Pricing is explicitly
subject to change before general availability [S1][S6].

**FACT (high):** current extractor guidance calls Agent active and the successor
to Extract; current Extract guidance recommends migration. Agent's feature page
positions it for cases where URLs are unknown or autonomous navigation is
needed, while known one-page JSON extraction belongs on synchronous Scrape
[S1][S6].

**INFERENCE (high):** “active” does not mean generally available or contract-
stable. The preview label, mutable pricing, changing model defaults, and
documentation/source drift make a durable provider-neutral dependency
premature.

### 2.2 Names that must not be conflated

| Surface | Actual role | Lifecycle / boundary |
| --- | --- | --- |
| Hosted `/v2/agent` | Prompt-led autonomous web discovery, navigation, and structured gathering | Launched Dec 2025; active Research Preview; Cloud-only [S1][S6][S13] |
| `/v2/extract` | Older URL/prompt/schema multi-page collation | Deprecated; Agent named successor in product docs [S6] |
| FIRE-1 beta | Browser-navigation option nested inside v1 Scrape/Extract | Older beta documentation; not the `/v2/agent` task contract [S18] |
| Parallel Agents | Playground CSV/cell fan-out with Spark-1 Fast-to-Mini waterfall | Added Jan/Feb 2026; public REST Agent schema has no batch/cell contract [S19][S20] |
| Legacy v1 Deep Research | Older report-oriented research endpoint | Current deep-research guide recommends caller composition from Search/Scrape instead [S21] |
| MIT `firecrawl/web-agent` | Forkable reference agent over Search/Scrape/Interact | Released Apr 2026; explicitly not a hosted-Agent port [S14][S15] |

**Negative result (high):** no GA date, versioned semantic contract, deprecation
policy, compatibility window, SLA specific to Agent, or preview exit criteria
was found.

## 3. Request and task contract

### 3.1 Public contract

| Field | Published meaning | Material caveat |
| --- | --- | --- |
| `prompt` | Required natural-language task, maximum 10,000 characters | It describes both what to find and what to return; no separate immutable research frame or extraction instruction exists. |
| `urls` | Optional starting/focus URLs | Without strict mode, they are not a closed acquisition boundary. Public docs alternately say “focus,” “constrain,” and “starting points.” |
| `strictConstrainToURLs` | If true, visit only supplied URLs; default false | No definition for redirects, URL fragments, subresources, same-origin links, or browser in-page navigation. |
| `schema` | Optional JSON Schema for structured output | No supported-key/version profile, schema byte/depth/node cap, or proof of literal enforcement is published. |
| `model` | `spark-1-mini` or `spark-1-pro` | Current docs/OpenAPI say Mini default; pinned server defaults Pro. “Model” is a preset name, not a disclosed foundation-model/version chain. |
| `maxCredits` | Maximum run credits; default 2,500 | Limit exhaustion fails with no data. No public minimum/maximum; API may accept over 2,500 and treats it as paid. |
| `webhook` | Started/action/completed/failed/cancelled delivery | Accepted by pinned schema and webhook docs but omitted from current Agent OpenAPI request schema. |
| `threatProtection` | Enterprise per-request URL-policy override | Off by default at organization level; Normal mode adds +2 credits per scanned URL. Browser navigations inside a page are not all intercepted. |
| `auditMetadata` | Username attribution for SIEM events | Enterprise SIEM feature; not returned in normal result evidence. |

Sources: [S1-S5][S8][S11][S16].

**FACT (high):** the current OpenAPI requires only `prompt`; `urls` has no
published item count, `schema` is an unconstrained object, and `maxCredits` is a
number with no minimum or maximum. The pinned strict server schema validates URL
shape and compiles supplied JSON Schema, but likewise applies no URL-array cap,
schema size/depth cap, or positive/range check to `maxCredits` [S2][S16].

**FACT (high):** the pinned API route requires authentication, country and
blocklist checks, and a 20-credit preflight. It then generates a job ID, records
the request, and hands the task—including the customer's API key, team ID,
prompt, URLs, schema, model, webhook, and budget—to a separately configured
Agent service [S16].

**INFERENCE (high):** `maxCredits` is a spend stop, not a complete work bound.
It does not state limits for requests, searches, pages, origins, browser actions,
bytes, tokens, elapsed time, or output rows. The preflight is also admission
logic rather than the final dynamic charge.

### 3.2 Scope ambiguity

**FACT (high):** Firecrawl says Agent needs no URLs and autonomously searches
the web. Supplied URLs can be “focus” or “starting points.” Only
`strictConstrainToURLs=true` promises that it “only visits” the supplied URLs
[S1-S3][S7].

**UNKNOWN:** whether strict mode permits redirects, same-origin child pages,
embedded resources, search-index retrieval about those URLs, browser network
requests, or data already held in an index. Threat documentation separately says
remote-browser navigations inside a page are not intercepted by its URL policy,
which makes “visit” insufficient as a network-scope definition [S11].

**RECOMMENDATION (high):** Curiosity scope must be a typed, caller-owned policy:
allowed exact URLs/origins, redirects, subdomains, path prefixes, external links,
document classes, index/cache use, and browser egress. A prompt or provider
boolean must not define network authority.

### 3.3 Schema is output shape, not evidence policy

**FACT (high):** Agent can return model-generated data with or without a schema;
the server verifies that supplied schema compiles. Public examples return a JSON
object [S1][S2][S16].

**UNKNOWN:** supported JSON Schema dialect, normalization, strictness, retry or
repair behavior, handling of optional fields, arrays and recursive schemas,
output validation failure behavior, or maximum generated output. Firecrawl's
release notes mention improvements for recursive schemas but do not define a
versioned conformance contract [S20].

**INFERENCE (high):** schema conformance, even if exact, proves shape—not source
support, accuracy, uniqueness, completeness, or freshness.

## 4. Planning and acquisition dependencies

### 4.1 What is directly supported

**FACT (high):** product sources state that hosted Agent plans, searches the
web, visits multiple sites, cross-references information, navigates pages,
clicks buttons, follows links, handles pagination/dynamic content, and processes
sources in parallel before returning structured data [S1][S6][S7].

**FACT (high):** `agent.action` webhooks are emitted after tool execution and the
official example names a scrape action with its URL. Pinned Firecrawl source
contains authenticated Agent-interop paths for Search, Scrape, Batch Scrape, and
Parse; those child calls can be associated with the parent Agent request,
bypass ordinary per-tool billing, and receive boosted concurrency for some
operations [S4][S17].

**FACT (high):** Firecrawl's later `web-agent` reference architecture uses
Search for discovery, Scrape for content, Interact for browser automation, and a
plan-act-observe loop with optional parallel subagents. Firecrawl expressly says
this is not a port of hosted Agent [S14][S15].

**INFERENCE (high):** the least-assumptive hosted architecture is:

```text
validated task + credit ceiling
  -> proprietary Spark planner/controller
  -> one or more search / scrape / parse / remote-browser actions
  -> observations and plan revision, with possible parallel work
  -> schema-guided collation
  -> durable job/result + aggregate billing
```

The sequence and components are supported at this level. Exact prompts, models,
tool schemas, ranking, memory, branch topology, retries, and stopping logic are
not.

### 4.2 What “browser” means here

**FACT (high):** launch materials claim Agent can click through pages,
authentication flows, menus, dropdowns, forms, modals, and multi-step processes.
Threat Protection states that it covers start URLs and content fetched through
the Firecrawl API, but cannot intercept every navigation made by the remote
browser inside a page [S7][S11].

**INFERENCE (high):** Agent is not merely a search-plus-Extract wrapper. It has
active browser authority, which widens cost, SSRF/egress, prompt-injection,
credential, side-effect, and legal risk. Marketing examples of authentication
flows do not establish a safe credential contract.

**Negative result (high):** no Agent request fields were found for cookies,
credentials, persistent profile, browser locale, proxy, action allowlist,
read-only mode, download policy, form-submit prohibition, per-origin egress,
maximum actions, or human approval. There is also no public guarantee that
browser actions are side-effect free.

**RECOMMENDATION (high):** Curiosity retrieval must not authenticate, submit
forms, write data, purchase, upload, or reuse session state. Browser escalation
must be a separately authorized, disposable, read-only lane with an action and
egress allowlist; model output cannot grant that authority.

### 4.3 Source selection and planning observability

**FACT (high):** action webhooks expose an action name, its input, and an
estimated cumulative credit count. Normal polling exposes no actions. The
published action payload does not show tool output, planner rationale, branch,
query/result set, selected passage, cache state, or why another action followed
[S3][S4].

**UNKNOWN:** whether all hosted tools emit action events; whether actions are
ordered, replayable, deduplicated, or complete; exact search corpus/ranker;
candidate diversity and deduplication; contradiction handling; source-quality
policy; or whether a durable plan graph exists.

**RECOMMENDATION (high):** Curiosity should expose a compact plan ledger—not
hidden reasoning—with authorized branch, query, candidate IDs, tool input,
outcome, evidence gain, budget delta, and next-step rationale. Private chain of
thought is unnecessary; operational causality is necessary.

## 5. Budgets, stopping, and cancellation

### 5.1 Hard bounds actually exposed

| Dimension | Agent contract |
| --- | --- |
| Prompt | 10,000 characters |
| Spend | `maxCredits`; default 2,500; over 2,500 allowed by API and always paid |
| Model choice | Mini or Pro preset |
| URL scope | Optional exact-list semantic flag, incompletely defined |
| Request RPM | 2 / 20 / 100 / 1,000 / 2,000 by Free through Scale |
| Status RPM | 500 / 5,000 / 25,000 / 250,000 / 500,000 |
| Result API availability | documented as 24 hours after completion |
| Webhook delivery | 10-second receiver deadline; 1/5/15-minute retries, then stop |

Sources: [S1][S4][S8][S9].

**FACT (high):** when the credit ceiling is reached, feature docs say the job
fails, returns no data, reports zero final credits, does not charge AI reasoning,
and refunds tool-call credits. This makes `maxCredits` a fail-closed spend cap,
but also discards partial output [S1].

**FACT (high):** cancellation is cooperative. The cancellation request is
registered immediately, but an in-flight reasoning step, tool call, or browser
action runs to a clean stopping point; credits may continue to accrue [S1].

**FACT (high):** the official SDK's convenience `timeout` only stops client
polling and returns the latest status. It neither sets a server deadline nor
cancels the Agent job [S22].

### 5.2 Missing aggregate bounds

**UNKNOWN / negative result (high):** no public request control was found for
maximum planner steps, searches, query count, search results, fetched pages,
origins, redirects, browser sessions/actions/minutes, parsed documents/pages,
compressed/decompressed bytes, model tokens/calls, elapsed server time,
parallelism, retries, schema complexity, output bytes/items/rows, or sources.
There is no caller deadline or per-branch budget.

**FACT (high):** Agent documentation says structured runs have an underlying
generation ceiling of roughly 150-200 rows and recommends splitting large work
into 3-5 URL batches. This is operational guidance, not a schema-level or API-
enforced output contract [S1].

**INFERENCE (high):** a 2,500-credit default bounds billing better than work.
Dynamic conversion and refunded failures can decouple provider compute from the
consumer's final charged credits; work amplification and latency remain opaque.

### 5.3 Semantic stop policy

**FACT (medium):** marketing says Agent plans and acts until it gathers the
requested data. No ordinary response field states why it stopped [S1][S7].

**UNKNOWN:** evidence-sufficiency threshold, coverage target, contradiction
resolution, duplicate saturation, marginal-value test, branch pruning, maximum
attempts, or whether `completed` can mean best-effort incomplete collection.

**INFERENCE (high):** terminal completion conflates “goal satisfied,” “planner
chose to stop,” and potentially “best effort under hidden limits.” Credit-limit
exhaustion is distinguishable only because it fails; other budget/coverage stop
causes are not typed.

**RECOMMENDATION (high):** Curiosity needs deterministic ceilings plus semantic
stopping: required facets, minimum evidence per facet, contradiction queue,
duplicate/marginal-gain saturation, and explicit `stop_reason` such as
`sufficient`, `budget_exhausted`, `deadline`, `cancelled`, `policy_denied`, or
`no_gain`. Partial verified evidence must survive every stop.

## 6. Asynchronous lifecycle and operational semantics

### 6.1 Submission, polling, webhook, cancellation

**FACT (high):** REST submission returns `{success,id}`. Polling returns
`success`, `processing|completed|failed`, optional `data`/`error`, model,
`expiresAt`, and `creditsUsed`. DELETE cancels an unfinished job. Webhooks can
emit started, action, completed, failed, and cancelled events [S2-S4].

**FACT (high):** pinned routing applies Agent's submission and status rate
limiters and exposes all three routes. Status and cancellation verify team
ownership; cancellation returns conflict if already finished or already
cancelled [S16].

**Negative result (high):** no idempotency key, caller job key, list endpoint,
pagination, priority, queue position, server deadline, resume, retry, clone,
partial result, event cursor, replay guarantee, or polling interval is in the
REST contract. Webhooks are retried only three times and may therefore be lost
after the retry budget [S2-S4].

### 6.2 Contract drift and contradictions

1. **Cancellation state.** Feature docs list `cancelled`; webhook docs define it;
   SDK polling treats it terminal. Current OpenAPI and pinned status types expose
   only processing/completed/failed, and pinned status maps any finished
   unsuccessful row to `failed` [S1-S4][S16][S22].
2. **Model default.** Current feature docs, OpenAPI, and v2.8 release say Mini is
   default; pinned v2.11.162 request schema defaults Pro, and status fallback
   also reports Pro [S1][S2][S16][S20].
3. **Expiry origin.** Feature docs say results remain via API for 24 hours after
   completion; pinned status computes `expiresAt` as request/agent creation plus
   24 hours [S1][S16].
4. **Webhook discoverability.** Pinned schema, SDK, release notes, and webhook
   docs support Agent webhooks, but current Agent OpenAPI omits the request field
   [S2][S4][S16][S20].

**INFERENCE (high):** generated OpenAPI, prose, SDKs, and pinned server cannot be
assumed mutually consistent. A Curiosity adapter would need a dated conformance
matrix and defensive unknown-state handling.

## 7. Output, evidence, provenance, and completeness

### 7.1 What the consumer receives

**FACT (high):** completed polling returns one model-collated `data` object,
model preset name, expiry, and aggregate credits. A completed webhook wraps the
same data and credits. No `sources` field appears in the Agent OpenAPI, status
type, feature examples, or completed webhook example [S1-S4][S16].

**FACT (high):** action webhooks may reveal that a tool was called and its input
URL/query, but their documented payload does not include returned page content,
result ranking, selected span, or a relation between a source and an output
field [S4].

**INFERENCE (high):** Agent output is a derived artifact, not a factual capture.
Even retaining all documented webhooks cannot prove that a value came from a
particular page or passage, that all relevant pages were seen, or that the
source supported the model's synthesis.

### 7.2 Missing evidence chain

The ordinary contract does not provide:

- requested/canonical/final URL and redirect chain per acquisition;
- search query, rank, discovery source, selection/rejection reason;
- HTTP status, media type, headers, fetch timestamp, body hash, bytes, or
  truncation;
- cache/index hit, cached-at time, freshness age, or revalidation result;
- raw/normalized capture reference, parser/renderer/browser version;
- exact quote, span offsets, DOM selector, passage hash, or field-to-source link;
- model/provider/version, prompt/policy version, repair/merge history;
- per-source or per-field failure, confidence, coverage, contradiction, or
  unsupported status; or
- stop reason and consumed/remaining non-credit budgets.

**RECOMMENDATION (high):** never elevate Agent `data` to `Capture` or
`FieldClaim`. At most, type it `provider_derived_unverified`. Every Curiosity
claim must link to immutable captures and exact supporting spans independently
of provider prose.

### 7.3 Sharing and activity history

**FACT (high):** Agent playground runs can be shared by public bearer-like link;
anyone with it can view output and activity. Sharing can be revoked and pages
are said not to be search-indexed. API results are documented for 24 hours, with
history/results still visible later in activity logs [S1].

**INFERENCE (high):** “not indexed” is not access control. Public sharing can
expose prompts, target URLs, actions, and outputs; activity-log visibility also
means API expiry is not a deletion guarantee.

## 8. Cache, freshness, and reproducibility

**FACT (high):** Agent has no public `maxAge`, cache-only, live-only, index-
snapshot, or `storeInCache` request field. By contrast, shared Scrape defaults
to cache eligibility and Firecrawl Search can use indexed/retrieved content.
Pinned Agent interop can call those shared paths, but the proprietary planner's
actual options are undisclosed [S2][S10][S17].

**UNKNOWN:** whether hosted Agent prefers live fetches, Firecrawl's semantic
index, shared Scrape cache, Search snippets, browser state, or combinations;
cache keys, age, tenant isolation, revalidation, temporal consistency across
parallel sources, and whether repeated runs reuse captures.

**INFERENCE (high):** Agent cannot support a claim of “as of submission time.”
Neither request nor response lets a caller demand or verify live acquisition.
The output can combine sources acquired at different unknown times.

**FACT (medium):** Firecrawl markets Agent for live web gathering, but its terms
disclaim third-party-content timeliness and accuracy. Marketing language does
not override the missing wire-level freshness fields [S7][S25].

**RECOMMENDATION (high):** Curiosity must capture before deriving and record
`observed_at`, `fetched_at`, cache/index state, freshness policy, body hash, and
temporal skew. A provider job timestamp or `expiresAt` is never source time.

## 9. Limits, pricing, and spend predictability

### 9.1 Current plan limits

**FACT (high, time-sensitive):** Agent request RPM by plan is Free 2, Hobby 20,
Standard 100, Growth 1,000, and Scale 2,000; status RPM is 500, 5,000, 25,000,
250,000, and 500,000. Limits are team-wide. Firecrawl separately publishes
concurrent-browser ceilings of 2/5/50/100/150+ and queues that can wait up to 48
hours, but does not state how the general browser queue and request timeout map
to an Agent run [S9].

### 9.2 Dynamic billing

**FACT (high, time-sensitive):** all users receive five free Agent runs per day.
Paid usage is dynamic, based on task complexity, amount of data processed, and
output structure. Firecrawl says most runs use a few hundred credits, while its
extractor guide gives roughly 100-500 credits for a founder-finding example.
Mini is advertised as 60% cheaper than Pro [S1][S6][S23].

**FACT (high):** `maxCredits` defaults to 2,500; the dashboard caps its control
at 2,500, while API values above that are allowed and always paid. Firecrawl
recommends disabling neither Smart Upgrade nor an equivalent automatic plan
escalation by default; current billing says Smart Upgrade automatically raises
the subscription tier when credit balance reaches zero unless disabled [S1]
[S8].

**FACT (high):** Parallel Agents' Spark-1 Fast path is advertised at 10 credits
per cell, with escalation to normal Mini pricing. That is a Playground/batch
product behavior, not the two-model REST `/v2/agent` pricing contract [S19]
[S20].

### 9.3 Billing contradictions

**FACT (high):** feature docs say a `maxCredits` failure is unbilled and reports
zero, with tool credits refunded. Webhook docs show a generic `agent.failed`
example with eight credits and a cancelled event with three credits. Pricing FAQ
says only successful requests are charged, while pinned source separately bills
threat scans when a starting URL is blocked before an Agent job exists [S1][S4]
[S8][S16].

**INFERENCE (high):** “failed runs are free” is not a sufficiently precise
billing schedule. Credit-limit failure, policy rejection, cancellation, tool
failure, planner failure, timeout, and partially completed work may differ.

**UNKNOWN:** credit conversion formula; per-model reasoning rate; per-tool rates
inside Agent; billing for cancellation, non-budget failures, cached/indexed
retrieval, retries, webhook delivery, partial output, blocked/discovered URLs,
or completed but sparse data.

**RECOMMENDATION (high):** any evaluation must disable Smart Upgrade, set a low
local and provider cap, reserve worst-case subscription cost, reconcile terminal
charges, and obtain a written failure/cancellation/refund schedule. Request count
is not a spend estimate.

## 10. Privacy, retention, safety, and legal use

### 10.1 Zero data retention is not supported

**FACT (high):** pinned Agent controller rejects teams with forced ZDR and logs
Agent requests with `zeroDataRetention=false`. It records a target hint derived
from the first URL or prompt; its application logger also receives the parsed
and original request. It sends the task and customer API key to the separate
Agent service. Successful result data is retrieved from configured GCS; the
Agent and request records retain options, cost, success, and error metadata
[S16].

**FACT (high):** current Cloud comparison names Agent as Cloud-only. Firecrawl's
privacy policy says personal information may be used for caching/indexing,
servers are in the United States, and PII currently remains until a written
deletion request rather than under a recurring deletion policy [S13][S24].

**UNKNOWN:** Agent-specific prompt, schema, action, page, browser-state, model-
provider, GCS, activity-log, database, telemetry, backup, and webhook retention;
subprocessors/foundation models; training/improvement use; regions; deletion
SLA; and cross-tenant cache/index isolation.

**RECOMMENDATION (high):** do not send private/authenticated URLs, credentials,
cookies, personal datasets, secrets, presigned links, or confidential prompts.
Procurement requires a DPA, Agent-specific subprocessor/model matrix, retention
and deletion schedule, region commitments, and confirmation that public sharing
is disabled by policy.

### 10.2 URL and browser safety

**FACT (high):** Enterprise Threat Protection is off by default. Normal mode
checks URLs against Google Web Risk at +2 credits each; policy lists and
fail-open/fail-closed behavior are configurable. For Agent, starting URLs and
content fetched through Firecrawl APIs are checked, but remote-browser
navigations inside a page are not all intercepted [S11].

**FACT (high):** pinned shared fetch/browser paths contain private-network
checks, but Agent's proprietary remote browser and all Cloud paths are not
available for clean-room verification. No security test was performed [S16].

**UNKNOWN / negative result:** no Agent-specific public guarantee was found for
prompt-injection detection, instruction/data isolation, browser-side egress at
every request, side-effect prevention, downloads/malware, secret entry,
clipboard, file upload, form submission, payment, adult content, output URL
safety, or sanitization of generated strings.

**INFERENCE (high):** URL threat classification is not prompt-injection defense,
and start-URL checking is not full browser mediation. Hostile content can
influence a planner that controls later searches and actions.

**RECOMMENDATION (high):** treat all page, webhook, and final output as
adversarial. Curiosity must keep retrieved text out of control channels,
authorize every tool class and scope deterministically, mediate all egress and
redirects, prohibit write actions, cap output structures, and never auto-fetch
returned URLs.

### 10.3 Robots, publisher rights, and terms

**Negative result (high):** Agent's result does not return a robots decision,
publisher terms/license, `noindex`/`noarchive`, crawl delay, acquisition method,
or takedown status. Firecrawl's general robots statements do not prove identical
enforcement across proprietary Agent search, API fetch, and remote-browser paths.

**FACT (high):** Firecrawl terms put lawful use and third-party-content risk on
the user, disclaim timeliness and accuracy, prohibit disseminating another
person's PII without permission, and restrict debt collection, hard background
checks, FCRA uses, intelligence-agency people surveillance, and evidentiary law-
enforcement/criminal-prosecution uses. They also prohibit reverse engineering
the hosted service [S25].

**RECOMMENDATION (high):** successful Agent output is not permission to collect,
retain, republish, or train on source material. Curiosity must own source
eligibility, robots/politeness, rights, quotation, deletion, and audit policy.

## 11. License and clean-room boundary

**FACT (high):** the pinned Firecrawl repository root/server is AGPL-3.0. The
Agent-facing controllers and interop code inspected here are therefore covered
by that repository license. The hosted planner itself is delegated to a
separately configured service and is not present in the pinned server tree
[S16][S26].

**FACT (high):** `firecrawl/web-agent` is MIT-licensed, released later, and
explicitly “not a port” of hosted Agent. It is a lighter foundation built over
hosted Search/Scrape/Interact and third-party agent libraries [S14][S15].

**INFERENCE (high):** the MIT reference can demonstrate a public composition
pattern but cannot establish Spark's proprietary prompts, algorithms, stop
policy, or service behavior. Conversely, its MIT license does not relicense
Firecrawl server code, hosted services, or dependencies.

**RECOMMENDATION (high):** retain revision pins and attribution; author any
Curiosity contract independently from this requirements dossier; copy neither
AGPL controllers/types/tests nor hosted prompts; inspect every dependency and
directory license before considering MIT reference material; and obtain legal
review before deploying modified AGPL code. This is an engineering boundary,
not legal advice.

## 12. Clean-room architecture lessons for Curiosity

### 12.1 Provider-neutral decomposition

**RECOMMENDATION (high):** replace the monolithic Agent authority with:

```text
frame(question, scope, evidence_policy, aggregate_budget)
  -> plan(facets, proposed_queries, stop_tests)
  -> discover(query, source_policy, result_budget) -> UrlHint[]
  -> capture(url, freshness, render_policy, byte_budget) -> Capture
  -> inspect(capture_refs, facet) -> EvidenceSpan[]
  -> synthesize(evidence_refs, output_schema) -> Claims
  -> verify(claims, contradictions, coverage) -> ResearchResult
```

The planner may propose; deterministic policy admits. Browser rendering is an
acquisition escalation, not a general action tool. Every stage consumes one
aggregate budget ledger and preserves typed failures.

### 12.2 Minimum result envelope

Curiosity should require:

- local run/branch/tool/capture/claim IDs and provider request IDs;
- caller frame and policy-version digests;
- authorized query or URL and reason;
- discovery rank/source and requested/canonical/final URLs;
- redirects, fetch time, status/media type, cache/index state and content hash;
- parser/renderer/model/provider revisions and truncation/repair flags;
- exact evidence span/selector or quote hash for every material claim;
- per-facet coverage, contradiction and unsupported-claim ledger;
- consumed and remaining URL/page/byte/render/time/model/cost budgets; and
- terminal status plus explicit stop reason.

### 12.3 Verdict ledger

| Pattern / capability | Verdict | Curiosity treatment |
| --- | --- | --- |
| Prompt-led managed research | **ADAPTED** | Prompt becomes a caller-approved frame, not network/action authority. |
| Optional seed URLs | **ADAPTED** | Typed starting hints; widening requires explicit scope policy. |
| `strictConstrainToURLs` boolean | **REJECTED** as sufficient scope | Replace with origin/path/redirect/index/browser-egress policy. |
| Schema-guided final JSON | **ADAPTED** | Deterministically validate; every field retains evidence refs and unsupported state. |
| Mini/Pro preset selection | **ADAPTED** | Versioned policy tier with provider/model identity and evaluation, not mutable marketing name. |
| Aggregate `maxCredits` | **ADOPTED / strengthened** | Keep fail-closed cost cap; add pages, bytes, origins, actions, time, tokens, output, and branch caps. |
| Failure discards all data | **REJECTED** | Preserve safe partial captures/evidence with explicit incomplete status. |
| Async submit/poll/cancel | **ADAPTED** | Add idempotency, deadline, event cursor, typed cancellation, hard abort, and partial state. |
| Action webhooks | **ADAPTED** | Useful progress ledger; include ordered tool outcome, evidence gain, budget delta, signatures, replay. |
| Cooperative cancellation | **ADAPTED / strengthened** | Graceful stop plus hard deadline/kill; prevent new work immediately. |
| Autonomous search and source selection | **ADAPTED cautiously** | Model proposes facets/queries; deterministic controller bounds source policy and fan-out. |
| Model-controlled browser actions | **REJECTED** for retrieval | Read-only isolated rendering only; no auth, forms, writes, profiles, or unrestricted egress. |
| Normal Agent `data` as evidence | **REJECTED** | Store only as `provider_derived_unverified`; verify against independent captures/spans. |
| Opaque provider cache/freshness | **REJECTED** | Caller-enforceable freshness and temporal provenance are mandatory. |
| Hosted Agent for sensitive work | **REJECTED** currently | No Agent ZDR and retention/model-provider matrix is incomplete. |
| Hosted Agent as optional comparator | **DEFERRED** | Owned fixtures, explicit authority, low caps, billing/privacy review, no browser side effects. |
| MIT `web-agent` code adoption | **DEFERRED** | Separate dependency/license/security review; it is not needed to adopt the concepts. |
| AGPL server code/prompts/tests reuse | **REJECTED** | Clean-room behavioral requirements only. |

## 13. Unknowns and checks required before any evaluation

| Unknown | Why it matters | Required check |
| --- | --- | --- |
| GA roadmap and semantic versioning | Adapter lifetime | Written preview/compatibility/deprecation policy. |
| Hosted Spark foundation models/providers/versions | Privacy and reproducibility | Subprocessor/model matrix and returned immutable version IDs. |
| Exact tool set and action permissions | Safety and cost | Versioned tool manifest; read-only guarantees; approval model. |
| Search corpus/ranking/source quality | Coverage and bias | Provider disclosure plus licensed benchmark with candidate logs. |
| Strict URL constraint semantics | Egress boundary | Written redirect/subresource/index/browser rules and controlled owned-site tests. |
| Total pages/origins/actions/bytes/time/tokens/retries | Denial-of-wallet and latency | Hard quota sheet and runtime budget telemetry. |
| Semantic stop and completion meaning | Coverage | Stop-reason contract and branch/facet coverage report. |
| Cancellation propagation | Cost and side effects | Test that new work stops and in-flight browser/tool/model work terminates within a bound. |
| Failure/cancellation/threat-scan billing | Spend predictability | Written state-by-state billing/refund schedule and free-credit reconciliation. |
| Agent cache/index/freshness behavior | Time-specific claims | Returned capture timestamps/cache state plus controlled changing fixture. |
| Source and field grounding | Citation validity | Capture/span manifest and claim-entailment benchmark. |
| Schema dialect/transformation/output ceiling | Contract correctness | Versioned supported profile and conformance suite. |
| Agent-specific retention and ZDR roadmap | Sensitive use | DPA, storage/log/backup TTLs, deletion SLA, regions, ZDR support. |
| Prompt-injection/browser containment | Tool safety | Security design review and authorized adversarial owned-fixture test. |
| Robots/politeness across all tool paths | Rights/origin safety | Per-fetch policy records and provider architecture evidence. |
| Cloud versus pinned server drift | Reproducibility | Hosted build/schema identifier and dated conformance test. |

## 14. Fact / inference / recommendation ledger

| ID | Type | Claim | Confidence | Evidence / disposition |
| --- | --- | --- | --- | --- |
| F1 | FACT | Agent is active but remains Research Preview/early access. | High | [S1][S6][S7]; **DEFERRED** dependency. |
| F2 | FACT | Agent launched Dec 2025 as Extract's successor and accepts prompt-only tasks. | High | [S6][S7]. |
| F3 | FACT | Request exposes prompt, optional URLs/schema, strict URL flag, two presets, credit cap, and enterprise controls. | High | [S1][S2]. |
| F4 | FACT | Hosted execution is delegated from AGPL API server to a separate Agent service. | High | [S16]. |
| F5 | FACT | Product claims planning, search, browser navigation/actions, parallel source processing, and structured collation. | High that claimed | [S1][S7]. |
| F6 | FACT | Agent interop paths exist for Search, Scrape, Batch Scrape, and Parse. | High for pinned release | [S17]. |
| F7 | FACT | `maxCredits` defaults to 2,500; exhaustion fails with no data. | High | [S1-S3]. |
| F8 | FACT | Cancellation is cooperative and can accrue more credits before stopping. | High | [S1]. |
| F9 | FACT | Poll result has no source/capture/span evidence or stop reason. | High | [S2][S3][S16]. |
| F10 | FACT | Action webhooks show tool name/input and estimated credits, not evidence output. | High | [S4]. |
| F11 | FACT | Agent rejects forced ZDR in pinned source and is Cloud-only. | High | [S13][S16]. |
| F12 | FACT | Public docs, OpenAPI, SDK, and pinned source conflict on cancellation, model default, expiry, and webhook visibility. | High | [S1-S4][S16][S22]. |
| F13 | FACT | Hosted Agent is not open-sourced; MIT `web-agent` explicitly is not its port. | High | [S14][S15]. |
| I1 | INFERENCE | Agent is an opaque acquisition-and-derivation orchestrator, not an Extract replacement primitive. | High | F4-F6. |
| I2 | INFERENCE | Credit ceiling bounds spend more clearly than total work or latency. | High | F7 plus absent resource controls. |
| I3 | INFERENCE | `completed` does not prove coverage, freshness, support, or semantic sufficiency. | High | F9-F10. |
| I4 | INFERENCE | Browser action authority creates a materially wider trust boundary than Search/Scrape. | High | F5 and [S11]. |
| I5 | INFERENCE | Agent output alone cannot support reproducible, time-specific claims. | High | F9 and missing freshness/capture fields. |
| R1 | RECOMMENDATION | Separate frame, plan, discover, capture, inspect, synthesize, and verify. | High | **ADOPTED** architecture lesson. |
| R2 | RECOMMENDATION | Model proposes; deterministic policy admits tools, scope, and budgets. | High | **ADOPTED** authority rule. |
| R3 | RECOMMENDATION | Require immutable captures and exact spans for every material claim. | High | **ADOPTED** evidence rule. |
| R4 | RECOMMENDATION | Do not use hosted Agent for sensitive work or as evidence record. | High | **REJECTED** current uses. |
| R5 | RECOMMENDATION | Any benchmark requires owned fixtures and a new caller-approved frame. | High | **DEFERRED**. |

## 15. Bounded curiosity pass

After synthesis, in-frame gaps were scored 1-5 for relevance (R), decision value
(V), novelty (N), and cost (C, lower is better). Priority was `R + V + N - C`.
Only public primary-source and pinned-source checks within the declared frame
were pursued.

| Thread | R | V | N | C | Score | Action / result |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Hosted-versus-OSS execution boundary | 5 | 5 | 5 | 2 | 13 | **Pursued.** Pinned server delegates to separate service; MIT reference says it is not a port. |
| Agent tool dependencies | 5 | 5 | 4 | 2 | 12 | **Pursued.** Product claims plus interop paths support Search/Scrape/Batch/Parse and remote browser use, not exact orchestration. |
| Cancellation/status contradiction | 5 | 5 | 4 | 1 | 13 | **Pursued.** Feature/webhooks/SDK include cancelled; OpenAPI and pinned status do not. |
| Freshness/cache controls | 5 | 5 | 4 | 2 | 12 | **Pursued.** No Agent freshness field or returned cache/capture evidence; exact tool cache use remains unknown. |
| Evidence in action webhooks | 5 | 5 | 4 | 1 | 13 | **Pursued.** Actions expose tool/input and estimated credits, not results or claim support. |
| ZDR and result persistence | 5 | 5 | 4 | 2 | 12 | **Pursued.** Pinned Agent rejects forced ZDR and retrieves successful results from GCS. |
| Run five daily free calls | 3 | 4 | 3 | 5 | 5 | **CURIOSITY_NO_GO.** Caller prohibited tests; one-off output would not establish contract, grounding, or freshness. |
| Probe browser side effects or SSRF | 5 | 5 | 4 | 5 | 9 | **CURIOSITY_NO_GO.** Security testing and target interaction were not authorized. |
| Recover Spark prompts/model chain | 2 | 3 | 4 | 5 | 4 | **CURIOSITY_NO_GO.** Proprietary/terms boundary; unnecessary for the defer/reject decision. |
| Copy MIT reference loop | 2 | 2 | 2 | 4 | 2 | **CURIOSITY_NO_GO.** Research-only mandate; concept-level lessons are sufficient and dependencies need separate review. |
| Benchmark recall/grounding | 5 | 5 | 4 | 5 | 9 | **DEFERRED.** Needs licensed owned fixtures, scoring rules, service calls, and explicit caller authority. |

**Stop condition reached:** coverage and saturation. Every requested category has
primary evidence, a bounded inference, or an explicit unknown. Remaining high-
value questions require vendor disclosure or controlled service tests under a
new authorized frame.

## 16. Checks performed

- Read repository `AGENTS.md` before research and retained provider-neutral,
  untrusted-data, bounded-behavior, attribution, and licensing requirements.
- Used primary Firecrawl sources accessed 2026-08-17 and pinned OSS inspection
  to release `v2.11.162` / commit
  `7666c1f9ae8720a6bba271e0f60b6a217f8a5210`.
- Kept `/v2/agent` distinct from Extract, nested FIRE-1, Parallel Agents,
  historical Deep Research, and MIT `web-agent`.
- Inspected Agent routes, request/status/cancel controllers, types, storage
  tables, SDK polling, tool interop, logging/ZDR, threat handling, and license.
- Compared feature prose, OpenAPI, webhooks, SDK, release notes, and pinned
  source; retained contradictions rather than silently choosing one.
- Made no API/playground call, no paid test, no target fetch, no browser action,
  no exploit/bypass attempt, and copied no source implementation.
- File-scope check: this task adds only
  `docs/research/products/firecrawl-agent.md`.

## Sources

All web sources were accessed **2026-08-17**. Pinned Firecrawl source links
resolve to commit `7666c1f9ae8720a6bba271e0f60b6a217f8a5210`.

- **[S1]** Firecrawl, **Agent** feature documentation (Research Preview,
  contract, lifecycle, cooperative cancellation, models, limits, pricing,
  failure/refund behavior, sharing, output ceiling):
  <https://docs.firecrawl.dev/features/agent>
- **[S2]** Firecrawl v2 OpenAPI, **POST Agent**:
  <https://docs.firecrawl.dev/api-reference/endpoint/agent>
- **[S3]** Firecrawl v2 OpenAPI, **GET Agent Status**; full OpenAPI also contains
  DELETE cancellation:
  <https://docs.firecrawl.dev/api-reference/endpoint/agent-status> and
  <https://docs.firecrawl.dev/api-reference/v2-openapi.json>
- **[S4]** Firecrawl, webhook overview and event types (Agent action and terminal
  payloads, retries): <https://docs.firecrawl.dev/webhooks/overview> and
  <https://docs.firecrawl.dev/webhooks/events>
- **[S5]** Firecrawl, Advanced Scraping Guide, Agent section:
  <https://docs.firecrawl.dev/advanced-scraping-guide#agent-endpoint>
- **[S6]** Firecrawl, **Choosing the Data Extractor** (Agent/Extract/Scrape
  boundary, active status, price examples):
  <https://docs.firecrawl.dev/developer-guides/usage-guides/choosing-the-data-extractor>
- **[S7]** Firecrawl, **Introducing /agent: Gather Data Wherever It Lives on the
  Web**, 2025-12-18: <https://www.firecrawl.dev/blog/introducing-agent>
- **[S8]** Firecrawl, billing and current pricing:
  <https://docs.firecrawl.dev/billing> and
  <https://www.firecrawl.dev/pricing>
- **[S9]** Firecrawl, rate/concurrent-browser/queue limits:
  <https://docs.firecrawl.dev/rate-limits>
- **[S10]** Firecrawl, Scrape cache timing and Search/Scrape capabilities:
  <https://docs.firecrawl.dev/advanced-scraping-guide#timing-and-cache> and
  <https://docs.firecrawl.dev/features/search>
- **[S11]** Firecrawl, Threat Protection (Agent coverage, remote-browser gap,
  cost and policy): <https://docs.firecrawl.dev/features/threat-protection>
- **[S12]** Firecrawl, SIEM Audit Logging:
  <https://docs.firecrawl.dev/features/siem>
- **[S13]** Firecrawl, open source versus Cloud:
  <https://docs.firecrawl.dev/contributing/open-source-or-cloud>
- **[S14]** Firecrawl, **Introducing Firecrawl web-agent**, 2026-04-16:
  <https://www.firecrawl.dev/blog/firecrawl-agent-open-source>
- **[S15]** Pinned Firecrawl `web-agent` README and MIT license (explicit
  architecture and hosted distinction), commit
  `f023adf1cd1f731e27fdc844af62996f6c2a41c4`:
  <https://github.com/firecrawl/web-agent/blob/f023adf1cd1f731e27fdc844af62996f6c2a41c4/README.md> and
  <https://github.com/firecrawl/web-agent/blob/f023adf1cd1f731e27fdc844af62996f6c2a41c4/LICENSE>
- **[S16]** Pinned Agent routes, request/status/cancel controllers, request and
  response types, request/result tables, logging, and AGPL license:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/routes/v2.ts>,
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/controllers/v2/agent.ts>,
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/controllers/v2/agent-status.ts>,
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/controllers/v2/agent-cancel.ts>,
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/controllers/v2/types.ts>,
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/db/schema/public.ts>, and
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/LICENSE>
- **[S17]** Pinned Agent-interop paths in Search, Scrape, Parse, Batch Scrape and
  shared routing:
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/controllers/v2/search.ts>,
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/controllers/v2/scrape.ts>,
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/controllers/v2/parse.ts>, and
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/api/src/controllers/v2/batch-scrape.ts>
- **[S18]** Firecrawl, older nested **FIRE-1 Agent (Beta)** docs:
  <https://docs.firecrawl.dev/agents/fire-1> and
  <https://docs.firecrawl.dev/agents/fire-1-extract>
- **[S19]** Firecrawl, **Extract Web Data at Scale With Parallel Agents**,
  2026-01-30: <https://www.firecrawl.dev/blog/introducing-parallel-agents>
- **[S20]** Firecrawl OSS release `v2.8.0` (Parallel Agents, Spark family,
  webhooks, model selection):
  <https://github.com/firecrawl/firecrawl/releases/tag/v2.8.0>
- **[S21]** Firecrawl, current Deep Research use-case guidance:
  <https://docs.firecrawl.dev/use-cases/deep-research>
- **[S22]** Pinned JavaScript SDK Agent methods (client polling timeout and
  cancellation):
  <https://github.com/firecrawl/firecrawl/blob/7666c1f9ae8720a6bba271e0f60b6a217f8a5210/apps/js-sdk/firecrawl/src/v2/methods/agent.ts>
- **[S23]** Firecrawl, **Introducing Spark 1 Pro and Spark 1 Mini**,
  2026-01-14 (vendor model/cost/benchmark claims):
  <https://www.firecrawl.dev/blog/introducing-spark-1>
- **[S24]** Firecrawl Privacy Policy:
  <https://www.firecrawl.dev/privacy-policy>
- **[S25]** Firecrawl Terms of Service:
  <https://www.firecrawl.dev/terms-of-service>
- **[S26]** GNU, AGPL-3.0 text and section 13:
  <https://www.gnu.org/licenses/agpl-3.0.html>
