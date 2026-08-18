# Linkup Research: clean-room reverse-engineering dossier

**Primary-source access date:** 2026-08-17  
**Scope:** Linkup's hosted, beta `/v1/research` product only. Search, Fetch,
Tasks, the owned index, and MCP are considered only where an official Linkup
source establishes a Research dependency, transport option, or boundary.  
**Status:** research and recommendations—not implementation, a service test,
legal advice, procurement approval, or a claim about private internals.

## Decision frame, method, and result

**Decision.** Which externally observable Linkup Research patterns should
Curiosity adopt, adapt, reject, or defer while retaining caller authority,
bounded execution, evidence custody, and provider neutrality?

Bounded sub-questions:

1. What is the exact task, mode, output, lifecycle, error, and price contract?
2. What planning, branching, verification, and stopping behavior is observable?
3. What can be established about Search, Fetch, extraction, index, model, and
   storage dependencies without reconstructing proprietary implementation?
4. How are evidence, citations, source constraints, and freshness represented?
5. What safety, privacy, retention, and operational limits apply?
6. What behavior-level architecture and clean-room lessons follow for
   Curiosity?

**Method and boundary.** This study used only public first-party Linkup API
references, guides, changelog, security pages, status surface, and product
documentation. No account, credential, free or paid request, package install,
traffic inspection, hidden interface, gated report, access-control bypass, or
implementation inspection was used. Vendor benchmark, security, quality, and
latency assertions are attributed rather than independently validated. The
public Terms and Privacy pages rendered only loading shells, and the linked
client terms returned no readable body through the available path; no legal
conclusion is inferred from that negative result.

Labels:

- **FACT** — directly documented by a cited first-party source.
- **INFERENCE** — least-assumptive architecture interpretation consistent with
  the public contract, not a statement about undisclosed internals.
- **RECOMMENDATION** — Curiosity design consequence.
- **UNKNOWN** — not established by reviewed public sources.
- Confidence is **high**, **medium**, or **low**.

### Executive verdict

**ADAPT the task and planning vocabulary; REJECT Research as Curiosity's
control plane or evidence authority (high confidence).** Linkup Research offers
a compact asynchronous contract, explicit investigation shape, four fixed-price
effort tiers, server-side parallel retrieval and verification, source/date
constraints, cited prose, structured output, timestamps, and paginated task
history. Those are useful interface precedents. [S1-S7]

Its decisive gaps are caller-visible branch authority and budgets. A caller
cannot cap branches, searches, pages, fetches, iterations, tokens, output bytes,
wall time, or sources; inspect the plan or retrieval trace; request a
disconfirmation branch; cancel; or receive a stop reason, coverage estimate,
partial result, or consumed budget. The fixed price bounds charge, not work or
latency. [S1-S6]

Research's evidence contract is also insufficient for factual ingestion.
`sourcedAnswer` returns generated prose and source records containing only
title/name, mutable URL, snippet, and favicon. Structured output removes even
that source array at the API boundary. There are no claim IDs, quoted passage
offsets, hashes, capture times, document versions, branch lineage, support/
contradiction edges, or calibrated confidence. [S1-S4]

Curiosity should therefore classify a Linkup Research result as
`generated_synthesis` from an optional hosted adapter—not `web_search`, not
verified evidence, and never authority for another live curiosity pass.

## 1. Public Research contract

### 1.1 Product identity and request

**FACT (high).** Research was released in May 2026 and remains **beta**. It is
an autonomous, asynchronous agent intended for questions one Search call cannot
resolve. Linkup describes it as planning retrieval, collecting evidence from
multiple sources in parallel, iterating, verifying, and synthesizing. [S1][S7]

`POST /v1/research` uses bearer authentication and requires `q` plus
`outputType`. Its documented inputs are: [S2]

| Field | Contract | Material boundary |
|---|---|---|
| `q` | natural-language question | no published character/token bound |
| `outputType` | `sourcedAnswer` or `structured` | required |
| `mode` | `answer`, `investigate`, `research`, or `auto`; default `auto` | server classifies when omitted |
| `reasoningDepth` | `S`, `M`, `L`, or `XL`; default `L` | opaque compute/retrieval preset |
| `includeDomains` | domain restriction | OpenAPI maximum 100 |
| `excludeDomains` | domain exclusion | no OpenAPI maximum |
| `fromDate`, `toDate` | ISO `YYYY-MM-DD` result-date constraints after 1970-01-01 | metadata semantics; not capture time |
| `structuredOutputSchema` | object-root JSON Schema for `structured` | schema representation and size limits are inconsistent/unspecified |

**FACT/CONTRACT CONTRADICTION (high).** The general filtering tutorial says
both inclusion and exclusion support at most 50 URLs/domains; Research's current
OpenAPI and agent guide say inclusion permits 100 and do not cap exclusion.
Use 50 as a conservative adapter ceiling until written confirmation or an
authorized contract test. [S2][S6][S10]

**FACT/SCHEMA CONTRADICTION (high).** The create OpenAPI describes
`structuredOutputSchema` as JSON Schema “as a string” but does not assign that
request property a JSON `type`; the echoed create response models it as an
object. The GET contract again describes a string without a type. The agent
tool definition uses a string, while JavaScript-oriented documentation commonly
shows an object. The root-object rule is clear; the canonical wire
representation is not. [S2][S3][S6][S8]

**UNKNOWN.** There is no documented input/request byte limit, `q` limit,
schema depth/property/byte limit, locale, language, geography, source-type,
minimum-source, diversity, recency-sort, safety-level, or evidence-detail field.

### 1.2 Modes are investigation shapes, not authority

| Mode | Documented behavior | Observable planning implication |
|---|---|---|
| `answer` | precise definitive answer; iterates, reasons against itself, checks alternative candidates, and cross-references evidence | competing answer candidates and verification, but no visible branches |
| `investigate` | deep report on one subject; follows threads and new trails, verifies claims | adaptive sequential exploration can widen the initial path |
| `research` | broad themed report; searches several threads/topics/entities in parallel | explicit breadth/fan-out, but no caller fan-out cap |
| `auto` | classifies the question and chooses one of the above | server-owned routing; there is no dedicated field reporting the underlying selected mode |

These are **FACTS (high)** at product-description level. Exact planning and
verification mechanics remain unknown. [S1][S5][S6]

**FACT/WORDING TENSION (medium-high).** Guides say explicitly setting mode
makes “latency, cost, and output shape” more predictable, while the release and
pricing pages state price is flat by `reasoningDepth` regardless of mode and the
wire output shape is selected by `outputType`. Mode can affect runtime and prose
organization, but it does not change the published per-call price or response
union. [S1][S5][S7][S9]

**RECOMMENDATION (high).** Treat mode as a provider planning hint only.
Curiosity's caller must separately authorize breadth, adaptive follow-up, and
verification branches. `auto` must not silently widen authority.

### 1.3 Depth, latency, and charge

| Depth | Vendor description | Typical/order-of-magnitude latency | Flat successful-call price |
|---|---|---:|---:|
| `S` | light coverage | 2–5 min | $0.25 |
| `M` | balanced | 3–7 min | $0.50 |
| `L` | thorough; default | 5–10 min | $1.50 |
| `XL` | exhaustive | 10–20 min | $2.50 |

**FACT (high).** Higher depth supplies more compute budget, sources,
iterations, cross-checking, and usually longer output. Linkup says the agent is
aware of its budget and “typically reasons until it is satisfied,” within that
budget; an XL run can stop without producing a much longer answer. Price depends
only on depth, not mode or output type. Failed/no-result tasks are not charged.
[S1][S5][S7][S9]

**INFERENCE (high).** Depth selects an internal resource envelope with
quality/latency trade-offs. The fixed successful-call price is a hard charge
ceiling for one admitted request, but it is not a contractual source, branch,
compute, output, or elapsed-time ceiling. The published latency ranges are
descriptive, not deadlines or SLAs.

**RECOMMENDATION (high).** A Curiosity budget must include `max_branches`,
`max_searches`, `max_fetches`, `max_sources`, `max_input/output_bytes`,
`max_tokens`, `deadline`, `max_cost`, and bounded parallelism. Provider depth
can be chosen only after admission under those limits.

## 2. Planning, branching, dependencies, and stopping

### 2.1 Observable orchestration

Official descriptions establish this behavior-level sequence: [S1][S5-S7]

```text
question + mode/depth + source/date constraints + output contract
  -> interpret/classify question
  -> plan retrieval
  -> execute searches in parallel
  -> gather source evidence
  -> mode-specific iteration:
       answer: alternative candidates + self-check + cross-reference
       investigate: follow newly discovered trails
       research: broad parallel threads/topics/entities
  -> verify/cross-check claims
  -> synthesize prose or schema-shaped object
  -> expose a stateful async task projection for polling/listing
```

**INFERENCE confidence:** high for these named stages; medium for whether one
shared orchestrator changes policy by mode; low for any internal DAG, model,
ranking, extraction, or storage topology.

There is no public event stream or trace showing the plan, generated queries,
branch IDs/parents, pages opened, source rejection, tool calls, iteration count,
or merge policy. “Reasons against itself” is a vendor description, not an
inspectable adversarial or independent verification protocol.

### 2.2 Search, Fetch, extraction, index, and model dependencies

**FACT (high).** Research documentation names internal **search** and
**retrieval** budgets, says it executes searches, and calls the product an agent
that navigates the web. Linkup separately exposes Search for synchronous
retrieval and Fetch for known-URL HTML/PDF acquisition, and says Research is for
questions one Search query cannot answer. [S1][S5][S6][S11][S12]

**FACT (high).** Linkup states more generally that retrieval runs on its own
search index and processing stack. Its safety documentation describes filtering
during indexing and retrieval. This supports Research having access to
Linkup-controlled retrieval infrastructure, but does not establish that every
Research source originates exclusively from that index. [S14][S15]

**INFERENCE (medium).** Research likely composes an indexed candidate path with
page-content acquisition/extraction sufficient to create snippets and verify
claims. It may reuse components underlying Search and Fetch. Public evidence
does **not** justify claiming that it invokes the public `/search` or `/fetch`
endpoints, uses their exact depth/mode semantics, live-fetches every cited page,
or writes fetched pages back to the index.

**UNKNOWN / negative result:**

- lexical/vector/hybrid retrieval, candidate counts, ranker, reranker, query
  expansion, link/authority signals, deduplication, source-diversity policy;
- model provider/version, planner prompt, worker topology, context compression,
  citation-generation method, and schema validator;
- index-only versus live fetch per branch/source, cache policy and age,
  JavaScript rendering, PDF support inside Research, extraction limits, and
  whether inaccessible branches become partial failures;
- use of external search indexes, licensed feeds, partner data, or external
  model providers for Research.

### 2.3 No caller-visible stop contract

**FACT/NEGATIVE RESULT (high).** Research accepts and returns none of:

- a maximum branch, query, page, fetch, source, iteration, token, or byte count;
- branch-specific deadlines, budgets, priorities, or cancellation;
- coverage, novelty, contradiction, saturation, or marginal-gain targets;
- a stop reason such as `sufficient_evidence`, `budget_exhausted`, `timeout`,
  `policy_block`, `saturated`, or `source_failure`;
- failed-branch, rejected-source, incomplete-evidence, or partial-output state.

Its terminal state is only `completed` or `failed`. “Satisfied” is an opaque
agent judgment inside an opaque budget, while “exhaustive” is positioning, not a
measurable completeness guarantee. [S2-S6]

**RECOMMENDATION (high).** Curiosity must not interpret provider completion as
coverage or authorize another search from the report's implied gaps. Follow-up
requires the declared frame and caller authority. Curiosity—not Linkup—must emit
budget consumption, unresolved gaps/contradictions, evidence completeness, and
an explicit stop code.

## 3. Evidence, citations, and structured output

### 3.1 Sourced answer

**FACT (high).** A successful `sourcedAnswer` contains:

- `answer`: generated natural-language text, documented as having inline
  citations; and
- `sources[]`: `name`, URL, extracted `snippet`, and favicon (including an empty
  favicon value). Sources are described as those “used” to answer. [S1-S3]

**Strengths.** The source inventory is machine-readable and adjacent to the
answer. Snippets provide more audit value than bare URLs. Domain/date constraints
can focus acquisition toward known authority. The echoed input and task ID allow
the output to be tied to a submitted contract.

**Evidence gaps (fact/negative result, high).** Neither source nor citation has:

- a stable citation/claim ID or machine-readable claim-to-source mapping;
- exact quoted passage and offsets, snippet hash, page/content hash, or capture;
- fetched/crawled/indexed/observed/published timestamps or cache/live marker;
- canonical URL, redirect chain, author/publisher, document/version identity;
- branch/query lineage, candidate rank/score, source role, or selection reason;
- support, contradiction, independence, or corroboration relation;
- source license/rights, robots/safety decision, extractor/model version; or
- calibrated claim confidence and verification status. [S2][S3]

**INFERENCE (high).** Inline citations plus a terminal source array are
presentation-level attribution, not reproducible chain of custody. A listed
snippet may help a human inspect support but the contract cannot prove which
passage entailed each claim, that every material claim is supported, or that
every internally used source is returned. Mutable URLs can drift after the job.

### 3.2 Structured output loses citation transport

**FACT (high).** For `structured`, `output` is the caller-schema-shaped object
itself instead of `{answer, sources}`. Research exposes no `includeSources`
option, citation wrapper, or grounding array. Flat schemas are recommended
because deep arrays/objects increase latency and failure rate; no numeric schema
limit is published. [S1-S3][S6][S8]

**RECOMMENDATION (high).** Do not ingest factual Research JSON as evidence.
Schema conformance is syntactic, not factual. If Research is ever evaluated,
request cited prose, retain the untrusted source projection, and perform local
claim extraction/verification. Curiosity's own structured records should require
claim IDs, exact retained evidence spans, temporal/content identity, stance,
confidence origin, and unsupported/conflicting states.

### 3.3 Confidence and benchmark claims

**FACT (high).** `answer` mode is marketed for high-stakes finance/legal/
research workflows and a “high level of certainty”; Linkup also claims Research
ranks first on SealQA-0. The API returns no confidence value, certainty basis,
benchmark version/run metadata, or per-answer verification result. [S1][S5][S13]

**RECOMMENDATION (high).** Do not convert vendor “certainty,” cross-checking, or
benchmark position into a Curiosity confidence field. Evidence strength, source
quality, independence, contradiction state, and model belief must remain
separate and inspectable.

## 4. Async lifecycle, errors, retries, and pricing

### 4.1 State and retrieval contract

```text
POST /v1/research
  -> HTTP 200 task {pending, output:null, input, timestamps}
  -> GET /v1/research/{id}
       -> pending | processing
       -> completed {output}
       -> failed {error:string, output:null?}

GET /v1/research?page=&pageSize=&sortBy=&sortDirection=
  -> {metadata, data:[full task envelopes]}
```

**FACT (high).** A task contains `id`, constant `type: research`, status,
`createdAt`, `updatedAt`, echoed `input`, nullable `output`, and nullable string
`error`. The list defaults to page 1/size 10, caps page size at 100, and can sort
by creation/update time ascending/descending. [S2-S4]

**CONTRACT QUALITY ISSUES (fact, high):**

- asynchronous creation returns documented HTTP **200**, not 201/202; [S2]
- POST and GET renderings disagree about response-time schema details such as
  nullable dates and the `structuredOutputSchema` representation; [S2][S3]
- the create schema's echoed `ResearchTaskInput` marks `toDate`, `mode`, and
  `reasoningDepth` required while the request and GET schemas require only `q`
  and `outputType`; this likely describes normalized echoed defaults, but is not
  explained; [S2][S3]
- no `completedAt`, progress, queue position, attempt, usage, charge, output
  digest, expiry, or schema/version identifier is returned.

**UNKNOWN.** No public contract establishes create idempotency, duplicate
semantics, cancellation/deletion, webhook, event/SSE stream, priority, queue or
execution timeout, task/result retention, pagination snapshot stability, or
whether failed output can contain partial evidence.

**FACT (high).** The official MCP surface preserves the start/get split but is
narrower than the raw API: it fixes Research output to `sourcedAnswer` and has no
structured-output/schema path. MCP transport does not add progress, cancellation,
budgets, or evidence fields. [S20]

### 4.2 Polling discrepancy and failure behavior

**FACT (high).** Polling faster than once per second is rate-limited. The
overview warns to poll at 5–10 seconds, while best practices recommend 2 seconds
initially and exponential backoff to 10 seconds; official examples also poll at
2 seconds. The latter bounded-backoff guidance is the more operationally
specific interpretation. [S1][S5][S6]

**FACT (high).** Global errors use `statusCode` plus
`error.{code,message,details[]}`. Relevant documented HTTP classes include 400,
401, 402, 403, 409, 429, and 500. A 429 can mean either rate/concurrency pressure
or exhausted API-key credit. The Research POST reference lists 400/401/402/429;
GET lists only 400/401, so global errors must be retained as possible rather
than treating endpoint tables as exhaustive. [S2][S3][S16]

**FACT/RISK (high).** Best practices say failed/no-result tasks are uncharged
and retries are unrestricted. The API has no idempotency field and successful
calls are charged. Therefore an ambiguous create timeout or lost response must
not be retried automatically: a second submission could create another
successful, billable job. [S5][S9]

**RECOMMENDATION (high).** Persist a local submission intent and request digest;
bound polls and elapsed time; preserve provider ID/status/code; distinguish
rate-limit from credit exhaustion even though both can be 429; treat client
timeout as `provider_disposition_unknown`; and require human/policy approval
before ambiguous resubmission. Never infer that stopping polling cancels work.

### 4.3 Cost semantics

**FACT (high).** API-key billing deducts prepaid USD credit for successful calls.
Research is $0.25/$0.50/$1.50/$2.50 by S/M/L/XL. Errors and no-result outcomes
are not charged. Balance exhaustion is 429. x402 permits per-request USDC on
Base but imposes a $0.01 minimum, irrelevant to Research's higher prices. [S9]

**UNKNOWN.** The task envelope has no `creditsUsed`; there is no request-level
max-spend field, preflight admission estimate, reservation state, billing ID,
or documented reconciliation API specific to a job. Research submission/
concurrency quotas are not published; the rate-limit page names only Search and
Fetch, apart from Research's poll ceiling. [S5][S9][S17]

## 5. Freshness, safety, privacy, and trust

### 5.1 Freshness

**FACT (high).** Research accepts publication/result-date filters and is marketed
as web navigation over multiple sources. The result source schema, however,
contains no date or acquisition marker. Enterprise index controls can configure
selected-source refresh rates and fast-lane inclusion. [S2][S6][S15]

**INFERENCE (high).** A Research completion time is the task update time, not
proof that sources were fetched, indexed, or published then. A date predicate
over provider-derived metadata is not a freshness SLA. Linkup's separate Fetch
product being “real-time” does not prove that Research live-fetches citations.

**UNKNOWN / negative result.** No Research source exposes publication time,
last crawl, index time, fetch time, cache age, stale fallback, or version. No
general revisit cadence, discovery lag, fetch-to-index SLA, deletion latency,
or date-extraction accuracy is published. Strict current-state claims are thus
not reproducible from the Research output alone.

### 5.2 Content and agent safety

**FACT (high, vendor statement).** Linkup says its index/retrieval excludes or
blocks high-risk malware, phishing, spyware, DNS tunneling, potentially unwanted
software, and child-abuse content; restricts questionable categories; applies a
quality model; respects `robots.txt`; and does not bypass access controls,
CAPTCHAs, authentication, paywalls, or registration. Research can use domain
include/exclude controls. [S15][S18]

**UNKNOWN.** Research has no request-level safety mode or response safety
verdict. Public sources do not specify indirect prompt-injection defenses,
planner instruction hierarchy, poisoned metadata handling, citation URL checks,
dangerous download isolation, per-source malware/policy decisions, or behavior
when filtering makes a branch incomplete.

**RECOMMENDATION (high).** Treat the question, generated plan, snippets, source
metadata, pages, answer, and JSON as untrusted external data. Source content
cannot issue instructions, grant tool authority, or enlarge the frame. Curiosity
must independently enforce URL/network/content policy and record filtered or
incomplete evidence.

### 5.3 Query privacy and asynchronous retention ambiguity

**FACT (high, vendor statement).** Default queries may be processed across the
US, EU, Canada, and APAC; local processing is not guaranteed. ZDR is available
on request and is **not** default. The ZDR page says queries/results remain only
in RAM, are never persistently written, and are destroyed once results are
returned. TLS 1.2+, AES-256 at rest, SOC 2 Type II, ISO 27001, HIPAA compliance,
DPA availability, enterprise locality, SSO, allowlisting, and selected BYOC are
stated controls. [S14][S18][S19]

**MATERIAL UNKNOWN/TENSION (high relevance).** Research is asynchronous: it
serves an echoed input, output, timestamps, and status through later GET and
account-wide listing. Public ZDR text is generic to “search queries and results”
and does not explain how a multi-minute Research task can be polled/listed if no
query/result is ever persisted, how long ordinary Research tasks remain listed,
or whether Research supports ZDR at all. Do not assume ZDR covers Research
without a product-specific written contract.

**FACT/CONTRADICTION (high).** The introductory page advertises ZDR and SSO “on
every tier,” while dedicated security pages say ZDR is on request and SSO is
enterprise. The specific security pages are the safer operational authority.
[S13][S14][S18]

**UNKNOWN.** Ordinary Research prompt/result retention, deletion, backup/log
scope, subprocessors/model providers, training/improvement use, data residency,
and whether list/get access can be disabled are not established in readable
public material reviewed here. The public Terms/Privacy bodies were unavailable
through the clean read path.

**RECOMMENDATION (high).** Assume non-ZDR, globally routed, retained task data.
Do not submit secrets, credentials, personal/sensitive data, private source,
customer identifiers, or unpublished strategy. Before any trial, obtain written
Research-specific retention/deletion, ZDR, region, subprocessor/model, training,
incident, and task-history terms.

## 6. Clean-room architecture inference

The least-assumptive structure consistent with the published behavior is:

```text
Linkup-controlled crawl/index/processing stack
             + possible on-demand acquisition (unproved per source)
                              |
Research admission -> stateful task record -> mode classifier/planner
                              |
                 parallel search/retrieval branches
                              |
           adaptive trails / candidate checks / cross-checks
                              |
              evidence selection + content compression
                              |
             answer/schema synthesis + citation rendering
                              |
        async status/output store -> GET/list and MCP polling
```

**Confidence:** high for async orchestration, parallel search, iteration,
synthesis, and task projection; medium for shared index/acquisition/extraction
components; low for branch DAG, stores, model topology, ranking, caching, and
verification algorithm.

This is a behavioral decomposition for independent design. It does not copy or
claim Linkup's server architecture. No Linkup service code or returned content
is included. Public SDK/MCP availability does not license the hosted planner,
index, models, or crawler.

## 7. Exact Curiosity implications

The accepted local baseline keeps `web_search` provider-neutral,
researcher-only, bounded, and untrusted, and permits one in-frame,
authority-neutral curiosity pass (ADR 0020). Linkup Research must not silently
change that ABI or authority model. [L1]

### Adopted

1. **ADOPT — separate research-job capability (high).** A long-running generated
   report is not a search-result list. Keep `web_search`, known-URL fetch, and
   optional `research_job` distinct.
2. **ADOPT — explicit investigation intent (high).** Preserve caller-declared
   `answer`, focused investigation, or broad survey intent, but represent it in
   provider-neutral terms.
3. **ADOPT — durable task envelope (high).** Keep job ID, state, created/updated/
   completed times, exact normalized input digest, attempt, error, output digest,
   and provider metadata.
4. **ADOPT — source/date constraints (high).** Typed allow/deny and temporal
   constraints improve predictability; retain requested versus effective policy.
5. **ADOPT — fixed-price admission information (high).** A known charge ceiling
   is valuable, provided local cumulative spend remains hard-bounded.

### Adapted

1. **ADAPT — modes into inspectable branch plans (high).** Emit `branch_id`,
   parent, intent, expected evidence, allowed operations, and per-branch budget.
   A broad/follow-new-trails mode cannot authorize itself.
2. **ADAPT — depth into explicit aggregate budgets (high).** Provider S/M/L/XL
   remains adapter metadata. Curiosity owns branches, searches, fetches, source/
   byte/token/cost ceilings, parallelism, and deadline.
3. **ADAPT — parallel research (high).** Parallelize independent declared
   facets, then merge deterministically with source/owner/time/viewpoint
   diversity and duplicate accounting.
4. **ADAPT — verification vocabulary (high).** Make alternative candidates,
   primary-source checks, disconfirmation, and contradiction edges explicit;
   never equate self-reasoning with independent corroboration.
5. **ADAPT — citation inventory into evidence graph (high).** Add immutable
   capture/passage identity, exact span, hashes, observed/published times,
   acquisition/extractor versions, branch lineage, and support/contradict stance.
6. **ADAPT — async lifecycle (high).** Add `cancelled`, `expired`, partial result,
   idempotency, deadline, progress/event sequence, retention, and terminal stop
   reason. Polling timeout is not cancellation.
7. **ADAPT — structured output (high).** Bound schema depth/properties/bytes,
   validate locally, preserve citations separately, and represent unknown/
   unsupported fields rather than forcing plausible values.

### Rejected

1. **REJECT — expose Linkup Research as `web_search` (high).** It changes result
   semantics, price, latency, evidence custody, and planning authority.
2. **REJECT — provider `auto` as authority (high).** Classification may widen
   breadth and adaptive exploration without caller review.
3. **REJECT — “until satisfied” as stopping contract (high).** Satisfaction,
   exhaustive coverage, and high certainty are neither inspectable nor bounded.
4. **REJECT — generated report/JSON as evidence (high).** Citation and schema
   shape do not prove entailment, completeness, independence, or freshness.
5. **REJECT — completion as success/completeness (high).** It only records that
   provider execution ended with output.
6. **REJECT — default use for sensitive research (high).** Research-specific
   retention, ZDR, locality, and model/subprocessor behavior are unresolved.

### Deferred

1. **DEFER — evaluation adapter (medium).** Only a separately authorized,
   public/synthetic, fixed-budget trial after contract/privacy review may test
   retrieval coverage, citation entailment, contradiction handling, freshness,
   schema conformance, latency, and cost.
2. **DEFER — production use while beta (high).** Wait for stable schemas,
   idempotency/cancellation/retention, structured citations, and explicit limits.
3. **DEFER — ZDR/BYOC claims for Research (high).** Require written
   product-specific architecture and contract scope.
4. **DEFER — provider confidence (high).** No calibrated Research confidence
   primitive or public calibration is available.

### Required bounded-curiosity protocol

1. Caller supplies `research_frame_id`, authority, total budget, and allowed
   source/tool policy.
2. Researcher proposes a small explicit branch set, including primary-source
   discovery and disconfirmation where relevant.
3. Every retrieval is charged to branch and aggregate budgets.
4. Synthesis records supported, contradicted, missing, and uncertain claims.
5. One post-synthesis pass scores only in-frame gaps by relevance, value,
   novelty, and cost; pursue only the authorized best branch.
6. Stop on coverage, saturation, deadline/cost exhaustion, policy block, or
   repeated evidence; record rejected branches as `CURIOSITY_NO_GO`.

Linkup's internal iterations do not satisfy this protocol because they neither
carry Curiosity's caller authority nor expose their branch/budget/stop state.

## 8. Fact / inference / recommendation ledger

| ID | Type | Claim | Sources | Confidence | Verdict |
|---|---|---|---|---|---|
| R1 | FACT | Research is beta, asynchronous, and has three investigation modes, four depth tiers, and two output types. | [S1-S7] | High | Contract ideas **ADAPTED** |
| R2 | FACT | Linkup describes plan -> parallel searches -> iterative verification -> synthesis. | [S1][S5-S7] | High at product level | Observable vocabulary **ADAPTED** |
| R3 | INFERENCE | Research composes Linkup-controlled retrieval with content acquisition/extraction, but exact public-endpoint reuse is unknown. | [S11-S15] | Medium | Dependency hidden behind adapter |
| R4 | FACT | No caller-visible branch/query/fetch/token/deadline limits or stop reason are exposed. | [S2-S6] | High | Control plane **REJECTED** |
| R5 | FACT | Charge is fixed by depth; latency is typical/order-of-magnitude, not a hard SLA. | [S1][S5][S7][S9] | High | Charge bound **ADOPTED**, work bound **REJECTED** |
| R6 | FACT | Source objects contain only name, URL, snippet, and favicon. | [S2][S3] | High | Evidence shape **REJECTED** |
| R7 | FACT | Structured Research output has no source/citation wrapper. | [S1-S3] | High | Factual ingestion **REJECTED** |
| R8 | INFERENCE | Inline citations are attribution, not immutable claim-level provenance. | [S1-S3] | High | Evidence graph required |
| R9 | FACT | Research exposes publication-date constraints but no source temporal/acquisition metadata. | [S2][S3] | High | Freshness claims bounded |
| R10 | FACT | Jobs expose four states, timestamps, input/output/error, get, and paginated list, but no cancellation/idempotency/usage. | [S2-S4] | High | Lifecycle **ADAPTED** |
| R11 | FACT | Poll guidance varies (5–10 seconds versus 2-second exponential backoff); >1 Hz is rate-limited. | [S1][S5][S6] | High | Use bounded backoff |
| R12 | INFERENCE | Unrestricted retries plus absent idempotency make ambiguous resubmission a duplicate-charge risk. | [S2][S5][S9] | High | Automatic replay **REJECTED** |
| R13 | FACT | ZDR is non-default; Research serves listable task state, but public docs do not explain Research/ZDR compatibility or retention. | [S2-S4][S14][S18] | High | Sensitive use **REJECTED** pending contract |
| R14 | RECOMMENDATION | Keep Linkup Research outside provider-neutral `web_search` and outside curiosity authority. | ADR 0020; [S1-S6] | High | **ADOPTED** |
| R15 | RECOMMENDATION | Any future evaluation must be public/synthetic, fixed-budget, locally verified, and separately authorized. | [S1-S19] | High | **DEFERRED** |

## 9. Unknowns and checks before any revisit

### Provider/document checks

1. Canonical `structuredOutputSchema` wire type; accepted JSON Schema subset,
   maximum depth/properties/bytes, validation failure behavior, and output cap.
2. Effective 50-versus-100 include/exclude limits and whether constraints apply
   to every internal branch/context, not just returned sources.
3. Research create concurrency/rate limit, queue/execution deadline, task/result
   retention, deletion, pagination consistency, and output-size maximum.
4. Idempotency/duplicate billing, cancellation, webhook/events, retries,
   partial-result semantics, and what occurs after a client polling timeout.
5. Whether terminal `error` has stable machine codes and whether 429 credit
   exhaustion can be distinguished from rate/concurrency pressure at HTTP level.
6. Per-job usage/charge reconciliation and whether balance is reserved before a
   multi-minute run.
7. Whether all evidence used in synthesis appears in `sources`; how inline
   markers map to source objects; structured-output citation roadmap.
8. Index/cache/live-fetch provenance, PDF/JavaScript behavior, source-count
   policy, stale fallback, date semantics, and inaccessible-branch handling.
9. Research-specific prompt-injection, malicious page/file, citation URL,
   source-rights, and policy-filter incompleteness controls.
10. Research-specific ZDR compatibility, ordinary retention/deletion/backups,
    regions, subprocessors/model providers, training/improvement, and BYOC scope.

### Separately authorized empirical checks

- malformed/defaulted/schema requests and POST/GET echoed-input consistency;
- mode/depth latency distribution and terminal timeout behavior;
- source/date filter enforcement and returned-source completeness;
- citation-to-passage entailment, unsupported claims, contradiction handling,
  source independence, schema null/unknown behavior, and temporal accuracy;
- ambiguous create/retry, polling 429 classification, failed task output, and
  billing reconciliation;
- benign prompt-injection fixtures on an owned/public test corpus.

None were executed. Vendor quality/benchmark examples are not substitutes for
a predeclared corpus, judgments, and authority.

## 10. Bounded curiosity pass

Scoring uses 1 (low) to 5 (high); cost 5 is most expensive. The pass stayed
inside the declared public-contract frame.

| Thread | Rel. | Value | Novelty | Cost | Decision |
|---|---:|---:|---:|---:|---|
| Resolve mode-specific planning/branching | 5 | 5 | 4 | 1 | **Pursued:** best practices revealed answer alternatives/self-checks, investigative trails, and research parallel threads [S5]. |
| Determine actual caller-visible budget/stop contract | 5 | 5 | 4 | 1 | **Pursued to saturation:** fixed depth charge exists; work units, stop reason, and hard latency do not [S1-S6][S9]. |
| Check structured-output evidence preservation | 5 | 5 | 4 | 1 | **Pursued:** output union replaces sourced answer with raw object; no source wrapper [S1-S3]. |
| Reconcile ZDR with asynchronous task history | 5 | 5 | 5 | 2 | **Pursued:** task GET/list require retained projection, while generic ZDR says no persistent query/result; Research-specific behavior remains unknown [S2-S4][S14]. |
| Reconstruct proprietary planner, prompts, models, or ranking | 1 | 2 | 4 | 5 | **CURIOSITY_NO_GO:** unnecessary, unavailable, and outside clean-room purpose. |
| Run free/paid jobs to count branches or test citations | 4 | 5 | 4 | 5 | **CURIOSITY_NO_GO:** caller prohibited credentials/tests; requires a separately approved evaluation frame. |
| Inspect SDK/MCP source to infer hidden endpoints | 2 | 2 | 3 | 4 | **CURIOSITY_NO_GO:** public OpenAPI and MCP contract answer the interface question; implementation inspection adds contamination risk. |
| Obtain gated SOC 2/DPA/client terms | 4 | 4 | 3 | 4 | **DEFERRED:** requires organizational/legal authority; unavailable public bodies are retained as a negative result. |
| Compare Linkup Research with competitors | 1 | 2 | 2 | 5 | **CURIOSITY_NO_GO:** caller requested Linkup Research only. |
| Reproduce SealQA-0 ranking | 2 | 3 | 2 | 5 | **CURIOSITY_NO_GO:** benchmark execution/publication authority absent and does not change the contract verdict. |

**Stop decision:** coverage and saturation. Every requested dimension has a
source-backed finding or retained unknown. Remaining high-value gaps require
provider answers, legal/security access, or separately authorized live tests;
further public pages repeat the same contract.

## 11. Primary sources

All sources are official Linkup materials accessed 2026-08-17.

- **[S1]** Linkup, “Research overview” — product purpose, modes, depths,
  latency/price, output, lifecycle, source example.
  <https://docs.linkup.so/pages/documentation/endpoints/research/overview>
- **[S2]** Linkup, `POST /v1/research` OpenAPI rendering — create request,
  response, errors, task/source schemas.
  <https://docs.linkup.so/pages/documentation/endpoints/research/post>
- **[S3]** Linkup, `GET /v1/research/{id}` OpenAPI rendering — task retrieval
  and output union.
  <https://docs.linkup.so/pages/documentation/endpoints/research/get>
- **[S4]** Linkup, `GET /v1/research` OpenAPI rendering — account task list and
  pagination/sort contract.
  <https://docs.linkup.so/pages/documentation/endpoints/research/list>
- **[S5]** Linkup, “Research best practices” — mode-specific iteration,
  planning loop, budget awareness, polling, retry/failure policy.
  <https://docs.linkup.so/pages/documentation/endpoints/research/best-practices>
- **[S6]** Linkup, “Research for AI agents” — self-contained tool contract,
  schema cautions, source filtering, polling, beta status.
  <https://docs.linkup.so/pages/documentation/endpoints/research/for-agents>
- **[S7]** Linkup changelog, “Research Endpoint,” May 2026 beta — release
  boundary, mode/depth/output and flat-by-depth billing.
  <https://docs.linkup.so/pages/changelog/research-endpoint>
- **[S8]** Linkup, “Structured Output Guide” — schema conformance claim,
  root/object examples, query/schema coupling.
  <https://docs.linkup.so/pages/documentation/tutorials/structured-output-guide>
- **[S9]** Linkup, “Pricing” — prepaid successful-call charging, Research
  prices, no-charge error/no-result policy, x402 and credit exhaustion.
  <https://docs.linkup.so/pages/documentation/platform/pricing>
- **[S10]** Linkup, “Source Filtering” — conflicting 50-item include/exclude
  guidance and filter interaction.
  <https://docs.linkup.so/pages/documentation/tutorials/filtering>
- **[S11]** Linkup, “Search overview” — separate Search role, owned-index fast
  path, agentic search/scrape behavior used only to bound dependencies.
  <https://docs.linkup.so/pages/documentation/endpoints/search/overview>
- **[S12]** Linkup, “Fetch overview” — separate known-URL acquisition/extraction
  contract used only to avoid conflating Research with Fetch.
  <https://docs.linkup.so/pages/documentation/endpoints/fetch/overview>
- **[S13]** Linkup, “Introduction” — beta label, endpoint separation, vendor
  benchmark and broad security claims.
  <https://docs.linkup.so/pages/documentation/get-started/introduction>
- **[S14]** Linkup, “Data processing and privacy” — default regions, non-default
  ZDR, in-memory description, owned index/processing claim.
  <https://docs.linkup.so/pages/security-and-privacy/data-processing-privacy>
- **[S15]** Linkup, “Content safety and index controls” — filtering, quality,
  crawl safeguards, enterprise refresh/ranking controls.
  <https://docs.linkup.so/pages/security-and-privacy/content-safety-index-controls>
- **[S16]** Linkup, “Errors” — API error envelope/classes and SDK error split.
  <https://docs.linkup.so/pages/documentation/platform/errors>
- **[S17]** Linkup, “Rate Limits” — published Search/Fetch QPS only; absence of
  Research creation limit.
  <https://docs.linkup.so/pages/documentation/platform/rate-limits>
- **[S18]** Linkup, security/privacy FAQ — non-default ZDR, processing regions,
  safety, SSO, BYOC, certifications.
  <https://docs.linkup.so/pages/security-and-privacy/faq>
- **[S19]** Linkup, “Security and compliance” — encryption, certifications,
  enterprise controls, BYOC, incident statements.
  <https://docs.linkup.so/pages/security-and-privacy/security-compliance>
- **[S20]** Linkup, “Linkup MCP Server” — Research start/get split and narrower
  sourced-answer-only MCP projection.
  <https://docs.linkup.so/pages/integrations/mcp/mcp>
- **[L1]** Curiosity ADR 0020, “provider-neutral bounded web search” — accepted
  local tool, permission, untrusted-data, and bounded-curiosity baseline.
  [`docs/decisions/0020-provider-neutral-web-search.md`](../../decisions/0020-provider-neutral-web-search.md)

## 12. Confidence summary

| Area | Confidence | Reason |
|---|---|---|
| Request/output/lifecycle/list contract | High | current official OpenAPI and dedicated guides |
| Mode-level planning behavior | High at product level | explicit mode and best-practice descriptions |
| Exact branching, verification, and stopping algorithm | Low | no trace, units, or stop reason |
| Price and no-charge failure policy | High | dedicated pricing plus best practices |
| Hard latency/completeness guarantee | Low/unknown | only typical/order-of-magnitude positioning |
| Evidence and citation schema limits | High | explicit source/output schemas expose omissions |
| Shared retrieval/index dependency | Medium-high | direct owned-stack/search statements; per-source path hidden |
| Search/Fetch implementation reuse | Low/unknown | no documented internal endpoint/component call |
| Freshness of an individual citation | Low/unknown | no temporal/acquisition source metadata |
| Default privacy posture | High | non-default ZDR and multi-region processing are explicit |
| Research retention/ZDR/subprocessors | Low/unknown | async history conflicts with generic ZDR description; readable contract absent |
| Production fitness for Curiosity | Medium-low | beta, no live checks, and material authority/evidence/retention gaps |
