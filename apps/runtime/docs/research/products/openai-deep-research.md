# OpenAI Deep Research: standalone product and agent architecture study

**Access date:** 2026-08-17  
**Decision frame:** Which publicly documented OpenAI Deep Research patterns
should Curiosity adopt, adapt, reject, or defer for a bounded, evidence-first
research agent?  
**Scope:** ChatGPT Deep Research and its developer-facing long-research
counterpart. OpenAI Web Search is treated only as one retrieval dependency;
quick Search, ChatGPT agent mode, shopping research, and generic chat are not
treated as Deep Research [S1][S2][S3].  
**Status:** clean-room competitor research, not an implementation, benchmark,
legal opinion, or claim about private internals. No account, credentials, paid
call, UI automation, hidden endpoint, traffic interception, bypass, or vendor
output corpus was used.

## Executive verdict

**ADAPT the workflow; REJECT the hosted product as Curiosity's foundation
(high confidence).** Deep Research is a long-running, model-led research
workflow, not a richer search-results endpoint. In ChatGPT it clarifies intent,
proposes an editable plan, lets the user choose public sites, uploaded files,
and read-only connected apps, iteratively searches and reads sources, optionally
analyzes data with code, shows progress, accepts mid-run refinement, and emits a
downloadable cited report plus source and activity views [S1][S2][S4]. This is
materially different from OpenAI Search, which is optimized for quick, recent
answers and short summaries [S1][S3].

The strongest design lesson is the separation of **research intent, source
authority, plan, execution, and report review**. The strongest warning is that
the public product does not expose exact branch budgets, a stable plan graph,
coverage or saturation measures, source-selection reasons, an evidence-
sufficiency function, immutable captures, passage hashes, or a terminal stop
reason. A polished report may mean sufficient evidence, model choice, budget
exhaustion, tool failure, or interruption; the contract does not distinguish
these outcomes.

For Curiosity:

- **ADOPT** preflight clarification, editable bounded plans, explicit source
  selection, progress, interruption, asynchronous lifecycle, a consulted-source
  inventory, and report-span citations.
- **ADAPT** iterative model planning into caller-authorized branches with exact
  aggregate budgets, immutable passage evidence, contradiction tracking, and
  machine-readable stop reasons.
- **REJECT** opaque semantic stopping, qualitative/unlimited work controls,
  mixed public/private retrieval in one unconstrained context, provider-held
  state as the audit record, and URL-only citations as proof.
- **DEFER** broad app and code execution until the owned retrieval, provenance,
  injection-resistance, and evaluation gates are independently satisfied.

**Overall confidence:** high for current public product behavior, API lifecycle,
pricing, and stated safety/privacy policy; medium for the functional architecture
inferences; low for ranking, exact planning, source weighting, and stopping
internals.

## 1. Frame, bounded questions, and method

### 1.1 Questions

1. What is Deep Research as a standalone product, and where is its boundary
   from quick Web Search and ChatGPT agent mode?
2. What can the user or API caller control about clarification, planning,
   sources, files, tools, progress, budgets, interruption, and stopping?
3. What evidence and citations survive into the result, and what provenance is
   missing?
4. What are the current product/API status, plan limits, pricing, privacy,
   safety, reliability, and failure boundaries?
5. What minimum architecture follows from public behavior, and what remains
   unknowable without prohibited reverse engineering?
6. What exact implications follow for Curiosity's provider-neutral, bounded
   research loop?

### 1.2 Evidence and authority boundary

- Primary evidence is limited to current OpenAI product/help pages, developer
  documentation, API reference/guides, pricing, status, policies, and the Deep
  Research system card. Vendor quality and benchmark statements are evidence
  that OpenAI made a claim, not independent proof of performance.
- Documentation was read live on 2026-08-17 and is mutable. Historical launch
  claims are dated and are not silently promoted into current guarantees.
- No paid or authenticated observations were made. Actual plan UI, citation
  accuracy, query trajectories, source diversity, latency, and failure recovery
  were not measured.
- OpenAI's business agreement restricts reverse engineering, service-data
  extraction, safeguard/rate-limit circumvention, and—outside narrow stated
  exceptions—using output to develop competing AI models [S15]. This dossier
  therefore uses published behavior only and does not copy outputs, hidden
  prompts, rankings, or server implementation.

### 1.3 Labels and stop rule

- **FACT** — directly stated in an official public source.
- **INFERENCE** — the narrowest functional explanation consistent with facts;
  not a disclosed internal implementation.
- **RECOMMENDATION** — an independently authored Curiosity design choice.
- Confidence is **high**, **medium**, or **low**. High confidence in a vendor
  contract does not establish runtime quality.

**Research stop:** stop when every requested category has a sourced fact,
labeled inference or unknown, and Curiosity implication; when additional public
sources repeat the same contract; or when the next step requires credentials,
paid calls, hidden-system probing, or legal/vendor review.

## 2. Product identity, boundaries, and current status

### 2.1 Deep Research versus adjacent surfaces

| Surface | Public purpose and behavior | Boundary |
| --- | --- | --- |
| ChatGPT Search | Quick recent facts or short conversational summaries with source links; may search automatically [S1][S3]. | Retrieval-grounded answering. It does not promise a user-reviewed research plan, long run, or report artifact. |
| **ChatGPT Deep Research** | User-invoked multi-step research. User selects sources, reviews a proposed plan, watches progress, may interrupt/refine, and receives a structured cited report [S1][S2]. | The product studied here. It orchestrates retrieval, analysis, and synthesis. |
| ChatGPT agent mode | A broader agent with visual browser and action capabilities. The July 2025 update says agent mode gained deeper/broader visual browsing while original Deep Research remained separately available [S2]. | Action/browser agent, not equivalent to read-oriented Deep Research. |
| Responses long research | Reasoning model plus hosted `web_search`, optional file/MCP retrieval and code, normally in background mode [S4][S5]. | Developer composition path. Current generic-model guidance supersedes retired dedicated model aliases. |
| Retired dedicated Deep Research API models | `o3-deep-research` and `o4-mini-deep-research` were dedicated Responses models with restricted research tools [S4]. | Shut down 2026-07-23; historical contract only [S6]. |

**FACT (high):** current ChatGPT Help explicitly says use Search for quick facts
and Deep Research for depth and thoroughness [S1]. The product is started via
`/Deepresearch`, the tools menu, or sidebar; it does not silently replace ordinary
Search [S1].

**INFERENCE (high):** Deep Research is an orchestration/product layer over
retrieval and analysis tools. Web search is necessary for public-web discovery,
but it is not sufficient to reproduce editable planning, private-source
selection, long-lived progress, interruption, report assembly, and review UX.

### 2.2 Evolution without collapsing surfaces

- **2025-02-02 launch:** OpenAI described an o3-derived agent that planned and
  executed multi-step browser/Python trajectories, pivoted and backtracked, read
  text/images/PDFs and uploaded files, and took 5–30 minutes [S2].
- **2025-04-24:** OpenAI published historical allowances of 25 monthly tasks for
  Plus/Team/Enterprise/Edu, 250 for Pro, and 5 for Free, with automatic fallback
  to a smaller o4-mini-derived version after the full-version allowance [S2].
  These figures are **not current guarantees**; current Help instead directs the
  user to the in-product counter and says allowance varies by plan [S1].
- **2025-07-17:** visual-browser depth moved into agent mode, while original
  Deep Research remained in the tools menu [S2].
- **2026-02-10:** Deep Research added arbitrary MCP/app connections, trusted-site
  restriction, real-time progress, and mid-run interruption/refinement [S2].
- **2026-07-23 API:** dedicated o3/o4-mini Deep Research aliases shut down, with
  `gpt-5.6-sol` listed as replacement [S6]. Current Web Search guidance calls
  extended investigation with GPT-5.5 high/xhigh reasoning “deep research”
  [S3].

**Current product status (high):** ChatGPT Deep Research remains an offered,
separately selectable product on Free, Go, Plus, Pro, Business, Enterprise, and
Edu subject to plan, country, workspace, role, and app availability [S1][S7].
The consumer product uses the latest model by default and permits legacy model
selection where available; no stable Deep Research model identifier is promised
to ChatGPT users [S1].

### 2.3 Official documentation contradiction retained

The live Deep Research API guide still instructs callers to use
`o3-deep-research` or `o4-mini-deep-research` with `web_search_preview` and
presents executable-looking examples [S4]. The official deprecation ledger says
both aliases and snapshots were shut down on 2026-07-23 [S6]. Separately, the
current Web Search guide recommends GPT-5.5 high/xhigh reasoning for long-running
research, while the deprecation replacement column names `gpt-5.6-sol` [S3][S6].

**Verdict:** the dedicated-model guide is stale design evidence, not a current
callability guarantee. For current integrations, use supported GPT-5-family
reasoning models and the Responses `web_search` contract, validating the model
catalog at integration time. **Confidence:** high that the contradiction exists;
medium on OpenAI's intended single canonical recipe because two current official
pages name different GPT-5-family paths.

## 3. The observable ChatGPT research workflow

### 3.1 Preflight: outcome, clarification, sources, plan

Current official behavior is [S1]:

1. The user describes the desired outcome and constraints.
2. The user chooses eligible sources: public web, uploaded files, specific sites,
   and enabled connected apps.
3. Deep Research may ask clarifying questions.
4. ChatGPT generates a proposed research plan.
5. The user reviews and can modify the plan before execution.

The historical API guide discloses a three-stage ChatGPT pattern: an intermediate
model clarifies intent, another rewrites the original input and answers into a
detailed prompt, and the research model receives that expanded prompt [S4]. The
API did not automatically perform those first two stages and expected a complete
prompt. Current consumer documentation does not promise which models implement
these stages.

**INFERENCE (high):** the plan is both a quality mechanism and a scope/consent
checkpoint. It converts an underspecified conversational request into an
execution objective before expensive tool use. It is not evidence of a durable
machine-readable DAG; no public schema for plan nodes, dependencies, estimates,
or acceptance state was found.

### 3.2 Execution: iterative search, reading, analysis, and replanning

**FACT (high):** launch material says the model learned to “plan and execute a
multi-step trajectory,” backtrack, and react to real-time information [S2]. It
can search the web, read text/images/PDFs, browse uploaded files, and use Python
to analyze data and iterate on graphs [S2][S11]. Developer output can contain
multiple `web_search_call`, `file_search_call`, `mcp_tool_call`, and
`code_interpreter_call` items before the final message [S4]. Web actions are
typed as `search`, `open_page`, and `find_in_page` [S3][S4].

**FACT (high):** the running ChatGPT task exposes progress and activity. The user
may interrupt at any time, refine the focus, add new sources, or change source
access [S1][S2]. This is stronger than passive polling: the execution objective
and retrieval envelope can change during the run.

**UNKNOWN:** public evidence does not specify:

- the internal plan representation, branch fan-out, or branch dependencies;
- whether queries run serially or concurrently in the current product;
- query deduplication, canonicalization, source-quality scoring, or diversity;
- when snippets trigger a full page open, file fetch, or code analysis;
- whether all queries/actions appear in the consumer activity history;
- how interruption checkpoints context or invalidates prior work;
- how the agent decides to backtrack, replan, or finish.

### 3.3 Final artifact and review

**FACT (high):** completed work opens in a fullscreen report view with a table of
contents, citations or source links, a “sources used” section, and activity
history. Reports can be downloaded as Markdown, Word, or PDF [S1]. The launch
post also describes embedded generated graphs and web images [S2].

**INFERENCE (high):** the product optimizes for a reusable human work product,
not raw retrieval. Retrieval candidates, analysis state, and prose are collapsed
into a report-oriented projection. That projection is useful UX but insufficient
as Curiosity's canonical evidence record.

## 4. Source, file, and tool selection

### 4.1 Consumer source authority

| Source lane | User control | Public boundary |
| --- | --- | --- |
| Public web | Enabled by default [S1]. | General web retrieval; provider/index details belong to Web Search and are not exposed per Deep Research report. |
| Specific sites | `Sites → Manage sites`; either restrict to entered domains or prioritize them while allowing the full web [S1]. | Restriction is hard eligibility; prioritization is a soft preference. Exact site count and matching semantics are not stated on the Deep Research page. |
| Uploaded files | Default eligible context; files/spreadsheets can be attached [S1][S2]. | File-size/type limits inherit ChatGPT upload policy; Deep Research-specific maxima were not found. |
| Connected apps | User-selected document stores and authenticated datasets such as Google Drive, SharePoint, FactSet, PitchBook, and Scholar Gateway [S1]. | Deep Research uses only read actions, even if the broader app supports writes [S1]. Plan/workspace/role/region and third-party limits apply [S8]. |

The product page says Deep Research “prioritizes connected sources—private
files, apps, paid datasets, and approved URLs” [S9]. This is a positioning claim,
not a documented weighting formula. The Help page provides the more precise
control semantics: restrict to specified sites, or prioritize them while keeping
full-web search [S1].

### 4.2 Developer source and tool contract

The historical dedicated models required at least one of web search, file search,
or remote MCP. They supported [S4]:

- web search for public internet discovery and page navigation;
- file search over at most two caller-managed vector stores, using only required
  file-search fields;
- connectors or remote MCP servers implementing a specialized read-only
  `search(query) -> results` and `fetch(id) -> document` interface;
- Code Interpreter for analysis;
- no arbitrary functions or non-search/fetch MCP tools.

Dedicated Deep Research MCP required `require_approval: "never"` because the
supported search/fetch tools were read-only and per-call approval was not
supported [S4]. This differs from generic MCP defaults and from the current
ChatGPT product's stronger up-front source selection. It should be treated as a
historical adapter constraint, not a Curiosity approval model.

Current generic GPT-5 research can use Responses tools, but tool compatibility
must be checked per current model. The stable architectural lesson is the narrow
retrieval interface, not the retired model name.

### 4.3 Selection semantics and gaps

**INFERENCE (medium-high):** at least four selection layers exist functionally:

1. **Eligibility:** user/admin source and app permissions.
2. **Discovery:** queries return candidate pages/documents.
3. **Inspection:** the agent chooses which candidates to open/fetch/analyze.
4. **Evidence/report selection:** a subset supports claims and appears in
   citations or “sources used.”

No official source inspected exposes candidate counts, provider rank, why a URL
was opened, why a document was rejected, primary-source classification,
publisher-owner diversity, duplicate clusters, or a complete rejected-source
ledger.

**Curiosity implication:** represent `eligible`, `discovered`, `fetched`,
`verified`, `selected`, `cited`, and `rejected` as different sets with transition
reasons. “Source used” must not ambiguously mean retrieved, read, or evidentiary.

## 5. Budgets, stopping, asynchronous execution, and control

### 5.1 Exposed bounds

**Consumer product:**

- A task historically took 5–30 minutes; the current feature page advertises
  “30-minute reports.” These are product expectations, not deadlines or SLAs
  [S2][S9].
- Current usage is plan-dependent and shown by an in-product remaining-task
  counter. Fixed monthly allowances reset 30 days after first use [S1].
- The user can edit before launch, monitor, interrupt, and redirect while the
  task runs [S1].
- No consumer control for max queries, pages, tool calls, tokens, bytes, cost,
  branches, concurrency, deadline, or minimum source count is documented.

**API/product-building path:**

- The historical Deep Research guide calls `max_tool_calls` the primary control
  on total web/MCP calls, cost, and latency [S4]. It is aggregate, not per branch
  or tool type.
- Current web research can vary reasoning effort and use
  `return_token_budget: default|unlimited`; “unlimited” removes a standard
  returned-search-content cap but does not remove the model/search context limit
  [S3]. Search context remains capped at 128k [S3].
- Background Responses have `queued` and `in_progress` nonterminal states, can
  be polled, streamed with resumable sequence cursors if created with streaming,
  and cancelled idempotently [S5].
- Background execution temporarily stores response data for roughly ten minutes
  to support polling, including under `store:false` [S5][S10].

### 5.2 Stopping model

The public facts support two layers:

1. **Hard resource/lifecycle bounds:** plan allowance, model context, tool-call
   cap where supplied, returned-content cap, cancellation, platform limits.
2. **Model semantic stop:** the agent assesses whether to keep searching,
   backtrack, or synthesize [S2][S3].

**INFERENCE (high):** only the first layer is externally enforceable. No exact
coverage threshold, contradiction policy, novelty metric, source quota,
confidence threshold, saturation rule, marginal-gain test, or terminal reason is
documented. Interruption is user control, not a reproducible semantic stop.

**RECOMMENDATION (high):** Curiosity should expose exact
`max_branches`, `max_queries`, `max_fetches`, `max_bytes`, `max_passage_tokens`,
`max_model_tokens`, `deadline_ms`, `max_cost`, and concurrency. The terminal
record should distinguish `coverage`, `saturation`, `exhaustion`, `budget`,
`deadline`, `policy`, `failure`, `user_cancel`, and `user_redirect`. Never offer
an operationally unbounded mode.

## 6. Citations, evidence, and report trust

### 6.1 What OpenAI exposes well

- Reports include citations or source links and a source section [S1].
- Web citations are structured annotations attached to answer character spans,
  with title and URL; clients must make them visible and clickable [S3][S4].
- The API trajectory separates web/file/MCP/code calls from the final message
  [S4].
- Current Web Search can optionally return the complete URL set consulted,
  usually larger than inline citations [S3].
- Activity history gives end users a coarse account of research progression
  [S1].

### 6.2 What citations do not prove

OpenAI's launch post claimed citations to “specific sentences or passages” and
that outputs cite each claim [S2]. The documented API annotation, however,
anchors the **answer span** and supplies only source URL/title; it does not return
the supporting source passage, its offset, or a capture hash [S3][S4]. Treat the
stronger launch language as product intent, not an immutable evidence contract.

A citation does not prove:

- that the source entails every claim in the annotated answer span;
- that all material claims are cited or all consulted sources are shown;
- which file/app passage supported a mixed-source claim;
- that a page is unchanged since research time;
- independent corroboration rather than syndicated duplication;
- primary-source status, authority, freshness, or absence of contradiction.

No public canonical evidence object contains provider lineage, terminal redirect
URL, capture/index ID, fetch time, publication-time evidence, passage offset,
verbatim quote, content/passage hash, extractor version, canonical/duplicate
cluster, source owner, support/contradict stance, or citation-entailment score.

**RECOMMENDATION:** keep answer-span citation UX, but resolve it to Curiosity's
immutable `claim_id -> capture_id -> passage_id/hash` graph. Preserve current URL
only as a convenience. Independently score support, source role, diversity,
freshness, and contradiction; never use citation count as confidence.

## 7. Retrieval-versus-agent boundary

### 7.1 Functional decomposition

**FACT:** OpenAI's current search guide defines three distinct levels [S3]:

1. non-reasoning web search, with no internal planning;
2. agentic search, where a reasoning model manages repeated search;
3. Deep Research, extended agent-driven investigation over potentially hundreds
   of sources and several minutes.

Deep Research adds capabilities outside retrieval: clarification, prompt
expansion, source consent, editable planning, iterative interpretation,
backtracking, code analysis, report structure, and lifecycle UX [S1][S2][S4].

### 7.2 Authority boundary

In current ChatGPT Deep Research, the user chooses sources and approves/edits the
plan; connected apps are read-only during research; workspace admins can gate
Deep Research and app availability through RBAC [S1]. In the agent loop, the
model chooses queries, candidate inspection, analysis, and semantic stopping,
but the user may interrupt and change focus/source access [S1].

**INFERENCE (high):** semantic agency and execution authority are partly
separated, but not fully. User/admin policy constrains source eligibility; the
model controls substantial work allocation inside that envelope. Exact resource
authority remains provider-owned.

**Curiosity boundary:**

- Retrieval returns typed untrusted evidence, never action authority.
- The researcher may propose query facets and interpret evidence.
- Deterministic infrastructure enforces permissions, network policy, counters,
  deduplication, deadlines, and stop ceilings.
- Synthesis is downstream and cannot retroactively redefine what was retrieved.
- Retrieved content cannot authorize tools, widen scope, reveal secrets, add
  budget, or approve its own follow-up.

## 8. Safety, privacy, and trust boundaries

### 8.1 Prompt injection and exfiltration

**FACT (high):** OpenAI explicitly treats web pages, file search results, and MCP
results as prompt-injection sources and says no automated filter catches every
attack [S4]. It recommends trusted files/MCPs, logging and review, schema/regex
validation, link screening, and splitting public-web research from sensitive
private-data work so the private phase has no web access [S4]. Even read-only MCP
results may contain malicious instructions.

The 2025 system card says launch mitigations included injection-resistance
training and preventing the then-current model from navigating to or constructing
arbitrary URLs, limiting URL-parameter exfiltration [S11]. It also reports that
targeted jailbreaks bypassed some refusals during red teaming. These are facts
about the launch system, not guarantees for the mutable 2026 product or every app.

**RECOMMENDATION (high):** adopt the threat model, not the assurance. Stage
public and private retrieval; disable public egress after sensitive context is
loaded; enforce tool arguments below the model; redact query logs; screen URLs;
and retain policy decisions. Curiosity must assume every retrieved byte is
adversarial data.

### 8.2 Privacy and retention

**ChatGPT:** Deep Research follows ordinary ChatGPT conversation data handling
and privacy settings [S1]. Chats remain until deleted; deletion schedules
permanent removal within 30 days subject to de-identification and legal/security
exceptions. Library files are managed separately, so deleting a chat does not
necessarily delete a Library file [S12]. Consumer Free/Go/Plus/Pro content may be
used for training if “Improve the model for everyone” is on; opt-out is available
[S7][S8]. Business/Enterprise/Edu app data is not used for training by default
[S8].

**Apps:** an enabled app can receive relevant conversation context; if Memory is
enabled, relevant memories may be used. Apps may see routine connection metadata
such as IP/device/language/region/approximate location, and app-shared data is
governed by the third party's terms and privacy policy [S8]. Deep Research limits
itself to app read actions, but read access can still disclose sensitive content
[S1].

**API:** API content is not used for model improvement unless the customer opts
in. Default abuse logs may retain prompts, responses, and derived metadata for up
to 30 days. Responses state is retained for at least 30 days by default; ZDR
forces `store:false`; background mode still writes temporary state for roughly
ten minutes. MCP and other third parties have their own retention policies
[S10]. Live Web Search is not HIPAA/BAA eligible; cache-only Responses search may
be eligible only under the documented ZDR conditions [S10].

### 8.3 Product safety and personal information

The launch system card reports external red teaming across personal information,
disallowed and regulated advice, dangerous advice, jailbreaks, prompt injection,
code execution, hallucination, bias, and frontier risks. It describes refreshed
personal-data policy/training/evaluations plus a system blocklist, and classifies
the launch model Medium in CBRN, cyber, persuasion, and autonomy [S11]. These are
first-party assessments of a retired launch-model family, not current-product
certification.

**UNKNOWN:** no current product page identifies the safety model/version,
injection detector, source malware scanner, citation URL checks, per-source
warning, or current false-positive/false-negative rate. No guarantee says app or
web text cannot influence later source/tool choices.

## 9. Limits, pricing, status, and failures

### 9.1 Consumer limits and pricing

Current pricing describes Deep Research qualitatively [S7]:

| Plan | Current public entitlement wording |
| --- | --- |
| Free / Go | Limited Deep Research and limited apps for Deep Research. |
| Plus | Expanded/available Deep Research and apps. |
| Pro | Maximum Deep Research, subject to abuse guardrails and model allowances. |
| Business / Enterprise / Edu | Available subject to workspace, role, country, and flexible-pricing terms. |

The current Help article does not publish fixed Free/Plus/Pro task counts; it
directs users to the in-product counter [S1]. Do not use the April 2025 numbers
as a procurement limit [S2]. Under the current Business/Enterprise/Edu flexible
rate card, one Deep Research task is approximately **50 credits**; Edu includes
five queries per rolling 24 hours before extra credit consumption [S13]. Plan
subscription prices and enterprise commitments vary by market/order form and are
not a Deep Research per-task price.

### 9.2 API economics

Current long research is normal model-plus-tool billing [S3][S14]:

```text
task cost = model input + cached input + reasoning/output tokens
          + each web-search action ($10 / 1,000 calls)
          + retrieved search-content tokens at model input rates
          + file-search calls/storage
          + code-interpreter container time
          + remote MCP / third-party charges
```

As accessed, GPT-5.5 standard short-context rates were $5/M input,
$0.50/M cached input, and $30/M output; long-context rates were $10/$1/$45.
GPT-5.6 Sol had the same listed standard rates. These are date-sensitive and not
a fixed Deep Research task price [S14]. More reasoning, pages, returned content,
and tool calls increase cost and latency.

### 9.3 Availability and operational status

At access, the status page reported fully operational aggregate service and
90-day aggregates of 99.94% for APIs and 99.68% for ChatGPT [S16]. It explicitly
says metrics aggregate tiers, models, and error types and individual availability
may vary. No Deep Research-specific component, uptime, latency SLO, completion
SLO, or recovery-time commitment was found.

Current availability depends on plan, supported country/territory, workspace
RBAC, web-search settings, app enablement, role, and third-party availability
[S1][S8]. A green aggregate ChatGPT status does not establish Deep Research or a
selected source lane is healthy.

### 9.4 Failure semantics

**Documented/observable failure classes:**

- ordinary model hallucination or incorrect inference;
- poor authority discrimination, rumor confusion, and weak confidence
  calibration;
- report/citation formatting errors and slow kickoff (explicit launch
  limitations) [S2];
- web/file/app/MCP fetch denial, timeout, missing content, or third-party failure;
- prompt injection, refusal, policy filtering, or over-refusal;
- context/tool/task allowance exhaustion;
- client disconnect (background work can continue), user cancellation, or
  user interruption/redirection [S1][S5];
- generic ChatGPT/API elevated errors and file/app incidents, reflected only at
  broader status-component granularity [S16].

**Negative result:** no product-specific typed reason taxonomy was found for
`no evidence`, `partial sources`, `provider timeout`, `paywall`, `robots/policy`,
`unsafe source removed`, `citation generation failed`, `budget exhausted`, or
`report incomplete`. Nor is it documented whether interrupted runs preserve a
partial report, refund/restore a task allowance, or resume idempotently.

**Curiosity implication:** terminal prose is not status. Return a typed partial-
evidence ledger, per-branch failure, retry decision, budget consumed/remaining,
and completeness warning independently of synthesis.

## 10. Architecture reconstruction (inference, not internals)

The narrowest architecture consistent with public behavior is:

```text
user objective + conversation + selected source authority
        |
        v
clarification stage -> expanded research brief
        |
        v
editable plan + user approval
        |
        v
long-running research orchestrator / reasoning model
   |-- public web search -> search/open/find
   |-- uploaded-file / vector retrieval
   |-- connected app/MCP -> search/fetch (read-only)
   `-- Python / code analysis
        |
        v
candidate normalization + inspection + evidence selection
        |
        +---- progress/activity events ----> user interrupt/refine/source change
        |
        v
claim synthesis + citation mapping + report formatting
        |
        v
fullscreen report + TOC + sources + activity + exports
```

**Confidence: medium-high at the functional level.** Clarification, planning,
typed tool calls, source lanes, progress, interruption, and report outputs are
public facts [S1][S4]. Separate orchestration, normalization, and citation mapping
are functionally necessary. Their deployment, models, data structures, and
algorithms are unknown.

### 10.1 Responsible inferences

| Inference | Basis | Confidence |
| --- | --- | --- |
| Deep Research is an agent orchestration layer, not a retrieval API. | It composes clarification, plan, repeated tools, code, lifecycle, and report. | High |
| Source eligibility is separate from source selection. | User/admin choose allowed sources; agent selects which to inspect/cite. | High |
| Retrieval and synthesis are separate decisions. | Typed tool calls precede a final message; consulted URLs can exceed citations. | High |
| Long tasks require durable provider-side state/checkpoints. | Background continuation, polling, progress, interruption, and report history. | High functionally; storage design unknown |
| A context-selection/compression layer is necessary. | Potentially hundreds of sources must fit bounded model/search context. | High functionally; method unknown |
| Semantic stopping is model/policy driven inside hard envelopes. | Agent decides whether to continue; external exact sufficiency rule absent. | High |
| Consumer and API share concepts but not necessarily an identical backend. | Different clarification, source, control, and stale-model contracts. | High |

### 10.2 What cannot be inferred responsibly

- planner prompts, chain of thought, hidden reasoning, or model routing;
- query-generation, branch scheduling, backtracking, or stop algorithms;
- search providers, rank fusion, rank features, index/corpus size, and cache age;
- page rendering/extraction, PDF/image OCR, passage scoring, or deduplication;
- source authority and citation-entailment models;
- exact persistence/checkpoint schema and consumer/API backend sharing;
- safety classifier implementations and current mitigation efficacy.

Attempting to discover these via adversarial queries, traffic inspection, bulk
output collection, or model extraction is outside the clean-room boundary.

## 11. Exact Curiosity implications and verdicts

| OpenAI pattern | Verdict | Exact Curiosity implication |
| --- | --- | --- |
| Search is one tool inside a research product. | **ADOPTED** | Keep provider-neutral retrieval separate from researcher planning and report synthesis. |
| Clarify before expensive work. | **ADOPTED** | Freeze objective, audience, time horizon, exclusions, and required evidence classes before execution. |
| User reviews an editable research plan. | **ADAPTED** | Plan has branch IDs, parent IDs, purpose, expected source class, estimate, and hard allowance; caller approval grants execution authority. |
| User selects public, file, site, and app sources. | **ADOPTED** | Use an explicit source-policy object; distinguish hard restriction from soft prioritization. |
| Model iterates, pivots, and backtracks. | **ADAPTED** | Permit child branches only within frame and remaining aggregate budget; record why each branch was created or abandoned. |
| Search/open/find and search/fetch are distinct. | **ADOPTED** | Discovery snippets are leads; factual claims require fetched, passage-anchored evidence. |
| Read-only apps in research. | **ADOPTED** | Research tools remain read-only. No retrieved content can invoke write/action tools. |
| Mixed public and private research. | **REJECTED by default** | Run public acquisition first, then private retrieval/synthesis with public egress disabled. |
| Real-time progress and interruption. | **ADOPTED** | Emit plan/branch/tool/evidence/stop events; cancellation is idempotent and partial evidence remains inspectable. |
| Mid-run source/focus edits. | **ADAPTED** | Version the frame and plan; invalidate or retain prior evidence explicitly rather than silently changing objective. |
| Model-owned “enough” decision. | **REJECTED alone** | Deterministic policy enforces coverage, saturation, exhaustion, deadline, policy, and cancellation stops. |
| Qualitative or unlimited work settings. | **REJECTED** | Every run has exact finite action, byte, token, time, and cost ceilings. |
| URL/answer-span citations. | **ADAPTED** | Preserve report UX but cite immutable capture/passage hashes and support relations. |
| Sources-used and activity views. | **ADOPTED** | Preserve complete eligible/discovered/fetched/verified/selected/cited/rejected ledgers and a redacted action trace. |
| Downloadable report artifact. | **ADOPTED** | Generate Markdown/JSON from the evidence graph; PDF/Word are presentation adapters, not canonical state. |
| Broad code analysis. | **DEFERRED** | First allow deterministic calculations over owned evidence; evaluate isolated no-egress code only after security review. |
| Hosted Deep Research as core. | **REJECTED** | It may be a manually reviewed reference or optional adapter, never Curiosity's owned retrieval/evidence foundation. |

### 11.1 Curiosity research loop

1. Caller declares the frame, authority, privacy mode, source policy, evidence
   requirements, and exact total budget.
2. Researcher asks only material clarifying questions and proposes a small plan.
3. Caller approves a versioned plan; approval does not authorize later scope
   expansion.
4. Retrieval executes typed search/open/find/fetch actions and returns untrusted
   evidence with branch and attempt lineage.
5. Verifier deduplicates, anchors passages, classifies primary/secondary source,
   and records support, contradiction, or unresolved status.
6. Synthesizer produces facts, inferences, unknowns, and confidence from verified
   evidence only.
7. One bounded post-synthesis curiosity pass scores remaining in-frame gaps by
   relevance, value, novelty, and cost.
8. Execute only the highest-value authorized follow-up. Stop on coverage,
   saturation, exhaustion, deadline, policy, duplicate evidence, or cancellation.
   Record every rejected thread as `CURIOSITY_NO_GO`.

OpenAI demonstrates the value of interactive planning and iterative evidence
collection. It does not demonstrate that the model should own unbounded authority
or that report polish establishes evidence sufficiency.

### 11.2 Required contract fields

**Request:** `research_frame_id`, objective, exclusions, audience, time horizon,
language/locale, source allow/deny/prioritize policy, network mode, privacy phase,
required evidence classes, branch seeds, output schema, exact aggregate budget,
deadline, and caller authorization record.

**Execution:** versioned plan; branch/parent IDs; query/fetch purpose; provider
adapter; attempt; started/ended time; budget debit; typed outcome; redacted error;
and stop reason.

**Evidence:** discovered/fetched/terminal/canonical URLs; source owner/type;
retrieval channel; observed and claimed publication times; capture and passage
IDs/hashes; extractor version; duplicate cluster; trust=`untrusted_external`;
policy warnings; and support/contradict/unresolved edges.

**Result:** claim graph, inline render annotations, complete source-set
transitions, unresolved contradictions, coverage/freshness/diversity warnings,
partial-failure ledger, budget consumed/remaining, plan/frame version, and
machine-readable terminal reason.

## 12. Validation checks

1. Can the caller inspect retrieval evidence without invoking synthesis?
2. Is plan approval versioned and narrower than general tool availability?
3. Does every child branch remain inside the original frame and shared budget?
4. Are retries, parallel calls, page renders, bytes, tokens, and code charged to
   one deterministic ledger?
5. Can progress omit secrets and raw sensitive queries while preserving audit
   value?
6. Does an interrupted or failed run retain typed partial evidence and say why it
   is incomplete?
7. Can every claim resolve to an immutable capture and exact passage/hash?
8. Can evaluation detect one wire story presented as ten corroborating URLs?
9. Are publication time, observation time, fetch time, and validity time separate?
10. Can page/file/app content neither alter policy nor request secrets, egress,
    actions, more budget, or self-approval?
11. Does public egress become impossible after sensitive private evidence loads?
12. Does every stop report coverage, saturation, budget, deadline, policy,
    failure, cancellation, or redirection rather than merely “completed”?
13. Are model, prompt/policy, retrieval, extractor, and schema versions recorded?
14. Does the single curiosity follow-up add unique relevant evidence or resolve a
    material contradiction, and are rejected options retained as
    `CURIOSITY_NO_GO`?

## 13. Fact / inference / recommendation ledger

| ID | Type | Claim | Confidence / sources | Verdict |
| --- | --- | --- | --- | --- |
| L1 | FACT | ChatGPT Deep Research is separately invoked and intended for multi-step depth; Search is for quick facts. | High [S1][S3] | **ADOPT boundary** |
| L2 | FACT | Users select sources and review/edit a proposed plan before research. | High [S1] | **ADOPT** |
| L3 | FACT | Users can watch progress, interrupt, refine focus, and change source access. | High [S1][S2] | **ADOPT with versioning** |
| L4 | FACT | Deep Research uses public web, uploaded files, specific sites, and read-only connected apps. | High [S1] | **ADOPT source authority** |
| L5 | FACT | Launch behavior included iterative planning, backtracking, browser/file/Python work, and cited reports. | High as historical claim [S2][S11] | **CONTEXT; adapt** |
| L6 | FACT | Dedicated o3/o4-mini API models shut down 2026-07-23 although the live guide still recommends them. | High [S4][S6] | **REJECT stale contract** |
| L7 | FACT | Current API long research uses GPT-5 reasoning plus tools/background; current pages disagree on one canonical model recipe. | High [S3][S6] | **ADAPT via capability detection** |
| L8 | FACT | API output separates search/file/MCP/code calls and final message. | High [S4] | **ADOPT typed trajectory** |
| L9 | FACT | Background execution supports polling, streaming/reconnect, and idempotent cancellation. | High [S5] | **ADOPT lifecycle** |
| L10 | FACT | Consumer exact task counts are not currently public; flexible managed-workspace Deep Research costs about 50 credits/task. | High [S1][S13] | **Treat limits as dynamic** |
| L11 | FACT | OpenAI warns no injection filter catches every attack and recommends public/private phase separation. | High [S4] | **ADOPT threat model** |
| L12 | FACT | URL citations lack immutable source-passage identity. | High [S3][S4] | **ADAPT provenance** |
| L13 | INFERENCE | Deep Research is a planning/orchestration/report layer over retrieval and analysis. | High, L1–L9 | **ADOPT separation** |
| L14 | INFERENCE | Hard bounds and semantic evidence sufficiency are separate stopping layers. | High [S2][S3][S4] | **ADOPT explicit stops** |
| L15 | INFERENCE | A context-selection/compression layer is necessary but publicly unspecified. | High functionally | **Own and audit it** |
| L16 | UNKNOWN | Ranking, branch graph, source weighting, deduplication, citation entailment, and exact stop function. | Negative result | **Do not speculate** |
| L17 | RECOMMENDATION | Keep caller frame/authority and exact aggregate budgets outside model output. | High | **ADOPTED** |
| L18 | RECOMMENDATION | Use one bounded, authorized post-synthesis curiosity pass only. | High | **ADOPTED** |
| L19 | RECOMMENDATION | Do not make OpenAI Deep Research, outputs, or hosted evidence the Curiosity foundation. | High, clean-room boundary | **REJECTED foundation** |
| L20 | RECOMMENDATION | Defer arbitrary apps/code until owned provenance and safety gates pass. | Medium-high | **DEFERRED** |

## 14. Unknowns and negative results retained

- No public plan DAG schema, branch trace, estimate, coverage score, saturation
  score, contradiction policy, or stop reason was found.
- No consumer exact controls for queries, sources, pages, bytes, tool calls,
  tokens, cost, concurrency, deadline, or minimum evidence were found.
- No current fixed Free/Plus/Pro task counts were found; the Help page deliberately
  points to a dynamic in-product counter. Historical 2025 counts are not current.
- No Deep Research-specific status component, uptime/latency/completion SLO, or
  recovery-time guarantee was found.
- No product-specific failure taxonomy or documented partial-report/refund/resume
  behavior was found.
- No complete candidate/rejected-source set, source-selection reason, rank score,
  authority score, owner cluster, or primary-source classifier was found.
- No immutable capture, source passage offset/hash, extractor version, or
  citation-entailment guarantee was found.
- No evidence establishes the current planner model, stable prompt, retrieval
  provider mix, corpus size, index freshness, or shared consumer/API backend.
- The 2025 system card applies to the launch model family; no source found maps
  every mitigation or evaluation result to the mutable 2026 product.
- No authenticated test was run, so actual report quality, citation correctness,
  source diversity, latency, allowance accounting, interruption recovery, and
  export fidelity remain unmeasured.
- Web discovery returned HTTP 429 for several official-site searches. Direct
  official URLs and documentation indexes were used; this tooling result is not
  evidence about OpenAI product availability.

## 15. Bounded curiosity pass

Scores: 1 (low) to 5 (high); cost 1 (cheap) to 5 (expensive).

| Thread | Rel. | Value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Resolve standalone product versus Search/agent mode | 5 | 5 | 4 | 1 | **Pursued:** current Help and launch updates preserve a distinct Deep Research surface [S1][S2][S3]. |
| Resolve current API status after model retirements | 5 | 5 | 5 | 1 | **Pursued:** retained contradiction among stale guide, deprecation ledger, and current generic-model guidance [S3][S4][S6]. |
| Verify current consumer plan counts | 5 | 4 | 3 | 1 | **Pursued:** found only dynamic counter/qualitative tiers; historical counts retained as historical, not current [S1][S2][S7]. |
| Determine public/private source and injection boundary | 5 | 5 | 4 | 1 | **Pursued:** official API safety guidance explicitly recommends phased separation [S4]. |
| Find Deep Research-specific status/SLO | 4 | 4 | 3 | 2 | **Pursued, negative:** only aggregate ChatGPT/API components and metrics found [S16]. |
| Run paid tasks to measure planning and stops | 5 | 5 | 4 | 5 | `CURIOSITY_NO_GO`: credentials/paid tests prohibited and no approved fixture protocol. |
| Infer hidden planner prompts or ranking via adversarial prompts | 2 | 2 | 5 | 5 | `CURIOSITY_NO_GO`: prohibited reverse engineering, weak inference, unnecessary. |
| Bulk scrape reports/source inventories | 1 | 2 | 3 | 5 | `CURIOSITY_NO_GO`: extraction, contamination, and terms risk. |
| Test injection against arbitrary third-party apps | 3 | 4 | 4 | 5 | `CURIOSITY_NO_GO`: no account, app-owner permission, or safe fixture authority. |
| Full patent/FTO analysis | 3 | 4 | 3 | 5 | **DEFERRED:** requires narrowed design and counsel; not product-contract research. |

**Stop:** coverage reached across product/API/status, planning, iterative search,
sources/files/tools, budgets/stopping/async, evidence, agent boundary,
safety/privacy, limits/pricing, failures, architecture, clean-room lessons, and
exact Curiosity implications. Additional official pages saturated around the
same contracts; remaining material gaps require authenticated tests, vendor
attestation, or legal review.

## 16. Clean-room and license/terms boundary

| Risk | Required boundary |
| --- | --- |
| Service reverse engineering | Do not intercept traffic, inspect hidden endpoints, decompile clients, adversarially infer prompts/ranking, extract models, or bypass limits/safeguards [S15]. |
| Output contamination | Do not use OpenAI reports, reasoning, rankings, or source inventories as Curiosity training data, labels, fixtures, or index seeds. |
| Bulk extraction | Do not scrape reports, citations, snippets, partner/app content, or search results to reconstruct a corpus [S15]. |
| Contract copying | Public concepts may inform an independently authored provider-neutral contract; do not copy OpenAI prose, branding, hidden prompts, UI assets, IDs, or undocumented quirks. |
| Third-party/app data | App access is governed by both OpenAI and third-party terms; a citation is not a content license. Preserve permissions, attribution, robots/policy, and takedown decisions independently. |
| Code/SDK licensing | No OpenAI SDK or sample code is copied here. Any future dependency requires separate license and provenance review and remains adapter code, not the owned search core. |
| Patents/trade secrets | Public behavior is not freedom to operate. Seek counsel for a narrowed implementation before commercializing novel planning, ranking, citation, or agent-control methods. |
| Privacy | Never submit sensitive project/customer prompts to a competitor for evaluation. Use independently authored fixtures and disclose any future external transmission. |

## 17. Reproduction checks

1. On Deep Research Help [S1], verify source choice, proposed editable plan,
   clarification, real-time progress, interruption, specific-site modes,
   read-only apps, report sections/exports, dynamic limits, RBAC, and Search
   distinction.
2. On the launch/update post [S2], verify 2025 launch behavior, historical
   5–30-minute range and allowances, visual-browser/agent-mode separation, and
   the 2026 apps/trusted-sites/progress update.
3. Compare the Deep Research API guide's o3/o4 examples [S4] with the 2026-07-23
   shutdown rows [S6] and current GPT-5 research guidance [S3].
4. On Web Search [S3], verify the three modes, search/open/find, citations,
   complete sources, returned-token budget, 128k search-context limit, and
   background recommendation.
5. On Background mode [S5], verify terminal polling, cancellation idempotence,
   resumable streaming precondition, and temporary storage.
6. On pricing [S13][S14], verify 50 credits/task for managed ChatGPT and current
   model/tool rates; record a new access date before procurement use.
7. On data/retention pages [S10][S12], verify ChatGPT versus API retention,
   Library-file separation, ZDR/background, third-party, and HIPAA boundaries.
8. On the system card [S11], verify injection/privacy mitigations, jailbreak
   caveats, code risk, and launch-model Preparedness ratings; do not generalize
   them silently to current models.
9. On status [S16], verify aggregate metrics and the disclaimer that individual
   availability varies; do not report those numbers as a Deep Research SLO.

## 18. Primary source table

All sources accessed 2026-08-17. Official OpenAI sources are primary for offered
features, contracts, policies, and vendor claims, but not independent evidence of
quality.

| ID | Official source | Material supported | Confidence |
| --- | --- | --- | --- |
| [S1] | OpenAI Help, **Deep research in ChatGPT**, https://help.openai.com/en/articles/10500283 | Current workflow, source controls, plan, progress/interruption, reports/exports, limits, RBAC/privacy, Search distinction. | High; mutable current product contract. |
| [S2] | OpenAI, **Introducing deep research**, https://openai.com/index/introducing-deep-research/ | Launch architecture/claims, iteration/backtracking, files/Python, runtime, historical limits, limitations, 2025–2026 updates and agent-mode boundary. | High that stated; historical/current-update mix carefully dated. |
| [S3] | OpenAI Developers, **Web search**, https://developers.openai.com/api/docs/guides/tools-web-search | Three search modes, current long-research path, actions, citations/sources, token budgets, limits, live/cache and pricing linkage. | High for current API guidance. |
| [S4] | OpenAI Developers, **Deep research**, https://developers.openai.com/api/docs/guides/deep-research | Historical dedicated-model workflow, clarification/rewrite split, tools, `max_tool_calls`, output trajectory, MCP interface, safety and private/public phase separation. | High as published design evidence; model examples stale per S6. |
| [S5] | OpenAI Developers, **Background mode**, https://developers.openai.com/api/docs/guides/background | Async polling, cancellation, streaming/resume, state and limits. | High. |
| [S6] | OpenAI Developers, **Deprecations**, https://developers.openai.com/api/docs/deprecations | 2026-07-23 o3/o4-mini Deep Research shutdown and replacements. | High; authoritative lifecycle ledger. |
| [S7] | OpenAI, **ChatGPT pricing**, https://chatgpt.com/pricing | Current qualitative plan entitlements, privacy/training opt-out, model/context plan table. | High but market/date-sensitive. |
| [S8] | OpenAI Help, **Apps in ChatGPT**, https://help.openai.com/en/articles/11487775 | App capabilities, permissions, third-party data, Memory/training, plan/workspace controls and limits. | High; Deep Research read-only restriction is more specifically stated by S1. |
| [S9] | OpenAI, **Deep research in ChatGPT feature page**, https://chatgpt.com/features/deep-research/ | Current positioning, authenticated sources, source prioritization claim, process control, 30-minute report claim. | Medium-high; marketing page, not normative schema. |
| [S10] | OpenAI Developers, **Data controls in the OpenAI platform**, https://developers.openai.com/api/docs/guides/your-data | API training default, abuse/state retention, ZDR/MAM, background state, MCP/third-party, residency and Web Search HIPAA boundary. | High. |
| [S11] | OpenAI, **Deep research System Card**, https://openai.com/index/deep-research-system-card/ and https://deploymentsafety.openai.com/deep-research | Launch-model training/tool description, red teaming, injection/privacy/code mitigations and Preparedness ratings. | High for 2025 launch assessment; low for unqualified current-product generalization. |
| [S12] | OpenAI Help, **Chat and File Retention Policies in ChatGPT**, https://help.openai.com/en/articles/8983778 | Chat deletion, Temporary Chat, Library-file separation, project/GPT file retention and enterprise file behavior. | High. |
| [S13] | OpenAI Help, **ChatGPT Rate Card (Business, Enterprise/Edu)**, https://help.openai.com/en/articles/11481834 | Approx. 50 credits per Deep Research task and Edu included allowance. | High; highly time-sensitive. |
| [S14] | OpenAI Developers, **API pricing**, https://developers.openai.com/api/docs/pricing | Current model token, web search, file search, and container prices. | High; highly time-sensitive. |
| [S15] | OpenAI, **Services Agreement** (effective 2026-01-01), https://openai.com/policies/services-agreement/ | Reverse-engineering, extraction, competing-model, circumvention, third-party, output and customer-responsibility boundaries. | High for covered business/developer customers; not legal advice. |
| [S16] | OpenAI Status and history, https://status.openai.com/ and https://status.openai.com/history | Current aggregate status/90-day metrics, incident granularity, and individual-availability disclaimer. | High for status display; insufficient for Deep Research-specific reliability. |

### Final confidence and decision

- **High:** standalone product boundary, plan/source/progress UX, read-only app
  rule, API model retirement, typed tool trajectory, async lifecycle, current
  pricing mechanics, retention statements, and provenance deficits.
- **Medium:** functional architecture, context-compression need, separate
  selection stages, and provider-owned stopping envelope.
- **Low/unknown:** private planning/ranking/selection/stopping algorithms,
  current mitigation efficacy, comparative quality, and production reliability.

**Final verdict:** **ADOPTED** as a reference for preflight planning, source
consent, progress, interruption, and report review; **ADAPTED** into exact
budgets, evidence-state transitions, immutable passages, explicit stop reasons,
and one caller-authorized curiosity pass; **REJECTED** as Curiosity's hosted
foundation or authority model; **DEFERRED** for broad app/code execution and any
empirical comparison requiring a separately approved protocol.
