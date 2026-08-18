# Perplexity Deep Research: clean-room standalone-product dossier

**Access date:** 2026-08-17  
**Scope:** Perplexity's user-facing Deep Research / Research product family on
Perplexity, including its documented move into Computer where necessary to
describe current product status. It is **not** the Agent API, Search API, Sonar,
or a claim that their contracts apply to the consumer product.  
**Status:** research and architecture lessons only; no account, credentials,
paid request, UI automation, traffic inspection, private interface, benchmark
run, implementation, or production change was used.

## Executive decision

Perplexity Deep Research is a hosted research **product**, not a stable public
developer contract. Its strongest observable pattern is a staged loop:

```text
clarify broad request
  -> plan and decompose
  -> search several paths
  -> read and reassess evidence
  -> follow gaps / retry weak paths
  -> evaluate sufficiency and conflicts
  -> synthesize an inline-cited report
  -> retain it as an editable/shareable artifact
```

Perplexity directly documents every stage except a durable branch ledger and the
exact sufficiency algorithm [S1-S5]. The June 2026 Computer variant goes further:
it can generate task-specific search programs, execute hundreds or thousands of
retrieval steps in parallel, deduplicate/join/filter results, combine live web,
uploaded files, connectors, and premium sources, and continue from research into
decks, dashboards, or other work [S4-S6]. Those are first-party product claims,
not an inspectable protocol or proof that the older Research mode uses the same
architecture.

**Overall verdict — ADAPT the workflow, REJECT the authority boundary (high
confidence).** Curiosity should adopt clarification before expensive work,
explicit branch purposes, progressive evidence visibility, conflict tracking,
search-then-read escalation, claim-level citations, and an editable final
artifact. It should not copy opaque model routing, provider-owned planning,
unbounded “search until enough,” provider-held evidence custody, or Computer's
ability to turn retrieved content into action-capable workflows.

The material product-status finding is that “Deep Research” is now an evolving
family rather than one stable implementation:

- current Help Center pages still describe a selectable **Research mode** on
  web, mobile, and Mac, with plan quotas and automatically selected models
  [S2-S3, S10];
- the current product page sends “Try Deep Research” to **Deep Research in
  Computer**, calls the earlier system “Legacy DR,” and describes Search as Code
  architecture [S5]; and
- the June 2026 launch says Computer and Deep Research were previously separate
  and are now combined [S4].

No official source found says the older Research selector is retired. Treat the
two surfaces as coexisting or transitioning until Perplexity states otherwise;
never transfer Computer or API behavior to Research mode without evidence.

## 1. Decision frame, bounded questions, and method

### 1.1 Decision and sub-questions

**Decision:** which externally documented standalone-product patterns should
inform Curiosity's owned, bounded research loop without depending on a hosted
provider's hidden planner, index, evidence store, or execution authority?

Bounded sub-questions:

1. What product exists as of the access date, and how does it differ from the
   Agent API, Search API, and Computer?
2. What is observable about clarification, planning, branching, source
   discovery, reading, reassessment, and synthesis?
3. Which budgets and stop conditions are caller-visible, provider-internal, or
   entirely undocumented?
4. How are progress, latency, persistence, sharing, citations, conflicts, and
   source quality represented?
5. What are the current plan, quota, freshness, privacy, safety, and legal
   boundaries?
6. Which behavior-level architecture is defensible, and which internals remain
   unknown?
7. What exact Curiosity implications follow?

### 1.2 Evidence and confidence rules

- **FACT** — directly stated in an official Perplexity page. A vendor quality,
  benchmark, scale, latency, or security statement is a fact only that
  Perplexity made the claim.
- **INFERENCE** — the narrowest architecture interpretation consistent with the
  facts; not a claim about private code.
- **RECOMMENDATION** — a proposed Curiosity decision.
- **UNKNOWN / NEGATIVE RESULT** — materially absent, contradictory, or not
  safely generalizable from public primary evidence.
- Confidence is **high**, **medium**, or **low**. “High” on mutable product Help
  means confidence in what Perplexity documented on 2026-08-17, not runtime
  verification.

All cited web sources are first-party Perplexity sources accessed 2026-08-17.
No product output was generated. The Terms prohibit reverse engineering the
service or underlying algorithm, unauthorized automation, and scraping; this
study therefore uses only voluntarily published product, Help, research,
security, status, privacy, and legal material [S19].

**Coverage stop:** every requested category receives a sourced fact, bounded
inference, or explicit unknown. **Saturation stop:** research ended when new
official sources repeated the same product claims or crossed into Computer/API
behavior that cannot be attributed to standalone Research mode.

## 2. Product identity, status, and boundaries

### 2.1 Evolution

| Date/snapshot | First-party description | Correct interpretation |
| --- | --- | --- |
| 2025-02-14 | Deep Research launched as a mode selected in the search box; free users received limited daily answers and Pro users high volume. It claimed dozens of searches, hundreds of sources, 2–4 minute work, iterative planning, report synthesis, and PDF/document/Page export [S1]. | Historical launch behavior and entitlement, not a current quota or architecture guarantee. |
| 2026-02-04 | DRACO described production Deep Research on Perplexity.ai as a model-agnostic harness using Perplexity search, browser infrastructure, and code execution [S7]. | Strong evidence for the evaluated consumer product family; still no public wire contract. |
| 2026 Help snapshot | “Research mode” remains selectable on web, mobile, and Mac. It automatically selects a combination of models; the user cannot choose one. Advanced Deep Research adds clarification, during-run follow-ups, progress, key findings, uploads, and an editable streamed report [S2-S3]. | Current documented answer-product surface. |
| 2026-06-11 | Deep Research was added to Computer. Computer Deep Research uses Search as Code, internal/app context, premium data, and artifact creation [S4-S6]. | A newer, broader agent product surface with different authority, budget, and privacy implications. |
| 2026-08-17 | Current Deep Research product page routes trials to Computer, labels benchmark comparison “Legacy Deep Research vs Computer Deep Research,” while Help still documents Research mode [S2, S5]. | Product transition or coexistence; exact lifecycle is unresolved. |

**FACT (high):** the current Help Center uses “Research” and “Deep Research” for
the same advanced research feature [S2-S3]. Naming alone is not a version.

**INFERENCE (high):** a benchmark, quota, model, latency, or architecture claim
must be tagged as `legacy Research`, `advanced Research`, or `Computer Deep
Research`. Treating all three as one implementation would produce false
precision.

### 2.2 Explicit product boundary

| Surface | Caller receives / controls | Why it is different |
| --- | --- | --- |
| **Standalone Research mode** | User asks a question, may answer clarification and add follow-ups while work runs, sees progress/findings, and receives an editable cited report [S2-S3]. | Human-facing answer product; no public endpoint, request schema, step cap, event protocol, usage object, or programmatic lifecycle. |
| **Computer Deep Research** | Research skill inside an action-capable digital worker; can use files/apps/connectors and turn results into assets or workflows [S4-S6, S16]. | Broader agent authority, credit economics, background execution, and external actions. |
| **Search API** | Raw ranked search results under a documented API contract. | Retrieval substrate, not the consumer report product. Its fields, limits, pricing, and retention terms do not describe Research mode. |
| **Agent API** | Programmatic model/tool loop with explicit API controls and typed outputs. | Developer runtime. Its presets, `max_steps`, status states, cost fields, and tool schemas are not standalone-product guarantees. |

**RECOMMENDATION (high):** preserve separate dossiers and adapter classes.
Consumer Research output is `generated_research_report`; Search API output is
`retrieval_results`; Agent API output is `hosted_agent_run`; Computer is an
`action_capable_worker`. They are not substitutable merely because Perplexity may
share infrastructure.

### 2.3 Availability and status

**FACT (high):** Research mode is documented on mobile, web browser, and Mac;
free users have limited access, paid plans more [S2]. Computer is separately
available to active subscribers on web desktop, iOS, and Android [S16].

**FACT (medium):** the public status page showed the aggregate Website, API, and
Computer components operational with a 90-day view at access time [S18]. It has
no standalone Research component and therefore proves neither Research-mode
availability nor an SLO.

**UNKNOWN:** public sources found no Research-specific uptime, recovery,
regional availability, task retention SLO, or deprecation schedule.

## 3. User task and interaction contract

### 3.1 Inputs and model selection

**FACT (high):** Research accepts a user question through the mode selector.
Advanced Deep Research may ask clarifying questions before starting when the
query is broad. The user can attach documents, and the system can process them
directly [S2-S3].

**FACT (high):** ordinary Research automatically selects a “specific
combination” of optimal models and does not allow manual model choice [S2]. The
Advanced page says Max receives Opus 4.6 Thinking, while Pro receives 4.5
Thinking gradually; it also says usage limits were adjusted to allocate more
compute per session [S3].

**INFERENCE (medium):** “combination of models” plus plan-specific lead models
is compatible with routing separate planning, coding, reading, and writing work
to different components. It does not establish the count, role, or version of
every model in a run.

**UNKNOWN:** no standalone Research contract specifies prompt length, uploaded
file count/size/types in Research, output length, citation style, domain/date/
locale filters, structured schema, primary-source requirement, minimum source
count, or deterministic model pin.

### 3.2 During-run interaction

**FACT (high):** the advanced interface shows sources being read, what is being
learned, and how the report is coming together; key findings appear during the
run. Users may add follow-up questions before completion. The report streams
directly into an editable/shareable file [S3].

**INFERENCE (high):** this is progressive disclosure over a long-running task,
not a synchronous one-shot chat response. Intermediate findings are useful for
human steering, but are not documented as durable evidence events or a complete
execution trace.

**UNKNOWN:** whether a follow-up appends a bounded branch, revises the current
plan, restarts synthesis, increases quota/cost, or can widen scope without a new
Research query. No event IDs, sequence guarantees, replay cursor, or audit log
are documented.

### 3.3 Completion, persistence, export, and sharing

**FACT (high):** the historical product exported PDF or document and could
convert a report to a Perplexity Page [S1]. Current Sessions include prompts,
follow-ups, responses, and sources; signed-in sessions are saved indefinitely in
History until deleted, can be exported as PDF/Markdown/DOCX, and are private by
default unless shared [S12]. Advanced reports are editable and shareable [S3].

**FACT (high):** an anonymous session is visible for 14 days; signed-in sessions
are stored in History indefinitely until deletion. A link-shared session can be
viewed and reshared by anyone with the link; changing it back to private revokes
that public setting. A viewer's follow-up creates a new session rather than
altering the original [S12].

**INFERENCE (high):** the final report is both answer and persisted product
artifact. This is convenient but couples research continuity, evidence access,
and privacy to provider-side state.

## 4. Planning, branching, and reassessment

### 4.1 What Perplexity directly says

The following are **FACTS as product claims**:

1. Legacy Deep Research uses search and coding capabilities to iteratively
   search, read documents, reason about the next action, and refine its plan as
   it learns [S1-S2].
2. The June 2026 description says Deep Research plans before action, runs
   multiple searches, reads results after each search, decides what to search
   next, evaluates whether evidence is sufficient, notes conflicts, reads
   deeply, then synthesizes one answer [S4].
3. Advanced Deep Research can request clarification before beginning and accept
   user follow-ups while running [S3].
4. Computer can break a query into subtasks routed across 20+ models. A legal
   example follows four parallel jurisdiction/regulatory paths and reconciles
   them into one assessment [S4].
5. Computer's Search as Code path can break a question into hundreds or
   thousands of targeted retrievals, execute in parallel, follow newly revealed
   threads, retry weak answers, and clean results with code [S4-S6].

### 4.2 Narrow architectural interpretation

**INFERENCE (high):** standalone Research has at least three semantic control
layers:

```text
scope control: clarification / user steering
research control: plan -> search/read -> evidence-gap reassessment
answer control: conflict-aware source evaluation -> report synthesis
```

**INFERENCE (medium):** branching is likely a dynamic tree or DAG rather than a
single query list, because later searches depend on earlier reading and the
current product explicitly describes subtasks/parallel paths. Public output does
not expose enough branch identity to prove its exact form.

**UNKNOWN / NEGATIVE RESULT:** no standalone Research page exposes:

- a plan object, query list, branch IDs, parent IDs, branch rationale, or branch
  budget;
- hypotheses, required evidence classes, source quotas, or planned
  disconfirmation;
- which progress entries are model thoughts versus verified evidence;
- plan revisions, discarded branches, retries, duplicate branches, or merge
  policy;
- a record equivalent to `CURIOSITY_NO_GO` for considered but rejected work.

**RECOMMENDATION (high):** Curiosity should expose a small pre-execution branch
manifest with `branch_id`, `parent_id`, `purpose`, `question`, `required_source_
class`, `expected_gain`, and budget. Planning can adapt, but every addition must
remain within the caller's declared frame and shared envelope.

## 5. Source discovery, reading, and synthesis

### 5.1 Discovery and retrieval

**FACT (high as a historical claim):** launch materials say Deep Research
performs dozens of searches and reads hundreds of sources [S1]. Current Help
repeats those scale claims [S2]. They are not contractual minima or maxima.

**FACT (high for Computer Deep Research):** the current product says it finds
primary sources across hundreds of sites, can combine files and apps with the
live web, and may pull premium sources such as Statista, PitchBook, and CB
Insights [S4-S5]. Search as Code exposes retrieval, ranking, filtering, fan-out,
rendering, intermediate candidate/ranking state, deduplication, joins, retries,
and aggregation to model-generated programs [S6].

**FACT (medium):** general Perplexity Help says search is real-time and gathers
authoritative articles, websites, and journals [S11]. That describes the overall
product, not a per-source freshness guarantee.

**UNKNOWN:** for standalone Research, public sources do not disclose corpus
coverage, upstream indexes/feeds, candidate counts, ranking features, query
rewrites, live-fetch versus cached/indexed content, browser rendering, paywall
handling, canonicalization, duplicate clustering, owner diversity, source
authority score, or why a particular source was read/cited.

### 5.2 Search versus deep reading

**FACT (high):** Perplexity distinguishes searching from reading documents and
“reads deeply” before synthesis [S1-S4]. DRACO says the production product uses
proprietary search tools, browser infrastructure, and code execution [S7].

**INFERENCE (medium):** a plausible legacy path is broad candidate discovery
followed by selective full-page/document inspection. The current Computer path
can more explicitly render and filter candidate sets in a sandbox before sending
compact evidence to a reasoning model [S4, S6].

**UNKNOWN:** no public standalone-product source specifies how much of each page
is read, whether citations derive from snippets or fetched bodies, how PDFs and
dynamic pages are parsed, extraction truncation, or how inaccessible sources are
represented.

### 5.3 Synthesis

**FACT (high):** report writing begins after source material is evaluated; the
system synthesizes a clear comprehensive report [S1-S2]. Current Computer Deep
Research reconciles parallel paths into one answer and can continue into a
brief, PDF, deck, spreadsheet, dashboard, website, or other artifact [S4-S5].

**INFERENCE (high):** retrieval and final writing are semantically separate even
though the product does not expose a stable machine interface between them.
Curiosity should preserve that boundary as an actual contract.

## 6. Budgets, limits, pricing, and stopping

### 6.1 What the user can bound

**NEGATIVE RESULT (high):** standalone Research exposes no documented caller
field for maximum searches, branches, pages, sources, fetched bytes, model
tokens, output tokens, elapsed time, cost, or deadline. It exposes a product mode
and plan entitlement, not a research budget object [S2-S3, S10].

**FACT (high):** current plan documentation reports:

| Plan | Research entitlement shown 2026-08-17 | Public subscription price |
| --- | --- | ---: |
| Free | 1 Research query/month | $0/month |
| Pro | “Monthly limits (average use)” | $20/month |
| Max | “Monthly limits (advanced use)” | $200/month or $2,000/year |
| Enterprise Pro | 50 Research queries/month | starts at $40/month or $400/year/seat |
| Enterprise Max | 500 Research queries/month | price not stated on the cited consumer comparison |

Sources: [S9-S10]. Consumer Pro/Max counts are intentionally not made numeric in
the current comparison. Earlier launch language (“limited number per day” and
“high volume”) is superseded for present planning [S1].

**FACT (high):** current pricing markets Pro as including “Deep research” and
Max as “Expert level research.” Computer credits are separate: Help says Ask
searches do not consume Computer credits, and credits are consumed by Computer
tasks [S9, S17].

**ASSESSMENT (high):** a standalone Research query quota and Computer credits
are different economic controls. Once Deep Research runs inside Computer, the
exact entitlement/credit interaction is not made clear by the cited pages. Do
not assume a Research query is free of Computer credits or that Computer's
credit spending cap bounds legacy Research without written confirmation.

### 6.2 Semantic stopping

**FACT (high):** Perplexity says Deep Research evaluates whether it has enough
evidence, notes conflicts, and writes after source materials are fully evaluated
[S1, S4]. Search as Code descriptions say it can retry when answers fall short
and alter course when source quality is inadequate [S4].

**INFERENCE (high):** stopping combines at least:

1. a semantic judgment of evidence sufficiency;
2. hidden provider compute/latency/plan ceilings; and
3. possible human steering during the run.

Only the semantic aspiration is public. “Completed report” does not reveal which
layer stopped the run.

**UNKNOWN:** no exact coverage threshold, marginal-gain calculation,
contradiction-resolution rule, duplicate-saturation test, minimum independent
source count, per-branch floor/cap, stop reason, or partial-completion flag is
documented. No source says “fully evaluated” means every discovered source was
read.

**RECOMMENDATION (high):** Curiosity must enforce deterministic aggregate limits
outside the model and return one typed stop reason: `coverage`, `saturation`,
`budget`, `deadline`, `policy`, `failure`, or `caller_cancelled`. Semantic
sufficiency can propose a stop; it cannot erase exhaustion or failed branches.

## 7. Latency, progressive results, and asynchronous behavior

### 7.1 Published latency claims

**FACT (high as historical claim):** the 2025 launch positioned Deep Research as
a 2–4 minute process and said most tasks completed under three minutes [S1].

**FACT (high that current Help is internally awkward):** the July 2026 Research
article says most tasks complete under three minutes and then says “it can take
around 4 to 5 minutes to generate a response” [S2]. These statements should not
be collapsed into a precise SLO.

**FACT (medium as vendor evaluation):** DRACO reports 459.6 seconds for the
tested Perplexity Deep Research configuration versus 592–1,808 seconds for three
comparators [S7]. That is a benchmark-run aggregate, not a consumer latency
guarantee and is materially longer than the launch positioning.

**INFERENCE (high):** latency increased or varies materially with system
generation, query complexity, model/plan, and evaluation setup. The safe product
expectation is multi-minute, variable work—not “under three minutes.”

### 7.2 UX lifecycle

**FACT (high):** Advanced Research emits progress, key findings, and report text
before completion and accepts user follow-ups during work [S3]. Computer can run
tasks in the background and can execute workflows for hours or longer [S16].

**UNKNOWN / NEGATIVE RESULT:** no standalone Research documentation found here
defines queued/running/completed/failed/cancelled states, cancellation, task ID,
polling, webhook, reconnect, durable stream cursor, background continuation
after disconnect, server deadline, retry behavior, failure diagnostics, or
partial evidence recovery. Computer background claims do not establish these
semantics for Research mode.

**RECOMMENDATION (high):** retain Perplexity's progressive UX idea, but base it
on durable typed events: plan accepted, branch started, candidates discovered,
evidence verified, conflict found, branch failed, finding published, synthesis
started, terminal stop. Findings must be retractable/versioned when later
evidence changes them.

## 8. Citations, evidence, source labels, and benchmark lessons

### 8.1 Product citation contract

**FACT (high):** general Perplexity answers use numbered inline citations linked
to original sources [S11]. Current Computer Deep Research says every factual
claim has an inline numbered citation linking to a live source URL [S4]. Sessions
retain all sources used and allow the user to open a source list [S12].

**FACT (high):** Perplexity may attach Government, Academic, or Trusted labels to
rated domains. The review is domain-level, considers practices such as
corrections, authorship, and separating news from advertising/opinion, and is
said to be independent of partnerships/payments. Most domains are unlabeled;
labels can change and are explicitly not endorsement or page/claim accuracy
[S13].

**INFERENCE (high):** a clickable citation and domain label improve inspection,
but neither proves that the cited page entails the nearby claim. A mutable live
URL is not an immutable evidence capture.

**UNKNOWN:** the standalone product does not document citation IDs, quoted
passages, offsets, content hashes, retrieval times, page versions, canonical/
redirect lineage, extraction version, branch lineage, support/contradiction
relation, citation completeness, or entailment score.

### 8.2 DRACO: what it establishes and what it does not

**FACT (high for method):** DRACO contains 100 tasks across ten domains with
expert-crafted rubrics averaging about 40 criteria. Criteria cover factual
accuracy, breadth/depth, presentation, and primary-source citation; some impose
negative penalties. Tasks were derived from de-identified production request
patterns and reformulated/reviewed. The evaluation is English-only and
single-turn; binary rubric grading uses LLM judges [S7].

**FACT (medium for comparative result):** Perplexity reports its system led all
ten domains and three of four dimensions among four products, with lowest tested
latency [S7]. This was vendor-run, was not independently reproduced here, and
does not establish current per-user quality.

**RECOMMENDATION (high):** adapt DRACO's multidimensional rubric and negative
criteria, but use blinded provider-neutral evaluation, independently captured
evidence, human adjudication samples, and versioned configurations.

### 8.3 WANDR: the strongest negative evidence

**FACT (high for disclosed method):** WANDR re-fetches every cited URL and checks
page usability, claim scope, excerpt presence, and whether page plus excerpt
support all requirements. It scores precision, requested-volume-adjusted recall,
and soft/hard completion through evidence hierarchies [S8].

**FACT (medium for results):** Perplexity reports that even its strongest system
achieved only 0.363 soft F1 and 0.133 hard F1 in the main evaluation. Its
retrieval-only soft F1 fell from 0.531 to 0.363 after stricter validity and
excerpt support checks; 41.4% of submitted pages missed at least one substantive
requirement and 57.5% of excerpts failed to support everything claimed [S8].

**INFERENCE (high):** citation presence, plausible pages, and polished synthesis
systematically overstate evidence completeness. WANDR concerns a broader mix of
systems and Search as Code, not proof of exact standalone Research behavior; its
failure hierarchy is nevertheless a strong first-party reason to require
claim-passage verification.

## 9. Freshness and provenance

**FACT (high as current product claims):** Computer Deep Research can search the
live web and says output reflects real-time data. General Help describes
Perplexity as searching in real time [S4-S5, S11].

**FACT (high):** current crawler Help says PerplexityBot respects `robots.txt`,
may still index domain/headline/brief factual summary when full text is blocked,
and uses third-party crawlers whose agreements were updated to respect
`robots.txt`, particularly for news sites [S14].

**INFERENCE (high):** “live web” is a retrieval-positioning claim, not evidence
that every cited page was fetched live or that the report reflects a single
consistent snapshot. Combining an index, browser infrastructure, third-party
crawlers, files, connectors, and premium datasets creates multiple freshness
domains.

**UNKNOWN:** no per-citation fetched-at time, index snapshot, cache/live marker,
premium-dataset vintage, connector synchronization time, first/last seen,
publication-date evidence, content hash, or stale-source warning is documented.
No freshness filter or “as of” lock is exposed for Research mode.

**RECOMMENDATION (high):** Curiosity should model `publisher_claimed_at`,
`first_seen_at`, `fetched_at`, `source_dataset_as_of`, and `valid_for` separately.
Each claim must resolve to an immutable capture/passage. “Live” must never be a
single boolean inherited from a provider.

## 10. Privacy, safety, and trust boundary

### 10.1 Consumer privacy and persistence

**FACT (high):** the consumer Privacy Notice covers prompts, queries, uploads,
outputs, collections, Pages, and Spaces; Perplexity uses content to provide and
personalize services and states that data may be used to improve/create products
and AI models [S20]. Consumer Help says Free, Pro, and Max have AI data retention
enabled by default and can opt out prospectively; opt-out does not remove
previously collected training data and does not prevent operational, legal, or
product-improvement processing [S15].

**FACT (high):** Perplexity says third-party model agreements prohibit external
providers such as OpenAI and Anthropic from retaining Perplexity data or training
their models on it [S21]. This does not negate Perplexity's own consumer policy.

**FACT (high):** Help says personal information is retained while an account is
active and removed from servers within 30 days after account deletion, while the
Privacy Notice permits retention as necessary for stated/legal purposes [S20,
S22]. Sessions are separately documented as stored indefinitely until deletion
[S12].

**ASSESSMENT (high):** consumer Deep Research is not zero-retention by default.
Research plans, uploads, progress, reports, and sources can be sensitive even if
external model providers do not train. Prospective training opt-out is not a
no-storage or immediate-deletion control.

**FACT (high):** Enterprise data is said never to be used for AI training;
Enterprise uploaded files are retained seven days by default, and eligible
organizations can configure retention. Enterprise protections are a different
contract and cannot be assumed for consumer Pro/Max [S15].

### 10.2 Web and uploaded content safety

**FACT (high):** Perplexity's consumer Terms disclaim completeness, accuracy,
availability, timeliness, and reliability; warn that output may be incorrect,
biased, or incomplete; and say users should not rely on it for medical, legal,
investment, financial, or other professional advice [S19].

**FACT (medium):** Perplexity's BrowseSafe research defines web retrieval tools
as an untrusted-content boundary and recommends layered prompt-injection defense:
fast detection, escalation of uncertain cases, user confirmation, and tool
policy enforcement. It explicitly says detection is not a silver bullet [S23].

**UNKNOWN / NEGATIVE RESULT:** no public source found states that standalone
Research or Computer Deep Research routes every fetched page/upload through
BrowseSafe, exposes injection warnings, identifies detector/version, or prevents
retrieved instructions from affecting plan/tool selection. General security
certifications and a secure sandbox do not answer this product-specific question
[S16, S24].

**RECOMMENDATION (high):** all titles, snippets, pages, files, connector data,
premium-source text, progress messages, and generated reports remain untrusted.
Curiosity's research capability must be read-only; retrieved content cannot
grant tools, reveal secrets, widen scope/budget, approve a follow-up, or authorize
external action.

## 11. Behavior-level architecture reconstruction

These are clean-room inferences, not private implementation claims.

### 11.1 Legacy / standalone Research mode

```text
question + optional files
  -> broadness check / clarification
  -> hidden model router and initial plan
  -> iterative query generation
  -> proprietary search candidate retrieval
  -> selected page/document reading via browser/extraction
  -> code sandbox for calculations/data work when needed
  -> plan revision + evidence/conflict sufficiency judgment
  -> final report synthesis + inline URL citations
  -> progressive/editable session artifact + export/share
```

**Confidence: medium.** Search, browser, code, iteration, clarification,
conflict/sufficiency assessment, synthesis, and artifact behavior are directly
documented [S1-S4, S7]. Router topology, branch graph, exact read path, and stop
logic are not.

### 11.2 Computer Deep Research

```text
question + files/connectors + user authority
  -> clarification / skill selection
  -> subtask and retrieval-path decomposition across model router
  -> model-generated Python search program
  -> isolated sandbox + Agentic Search SDK
       fan-out | parallel retrieve | rank | render | filter | join | dedupe
       retry / backfill weak paths | persist selected intermediate state
  -> live web + internal + premium-source evidence
  -> conflict-aware reconciliation + inline citations
  -> report and optional action-capable deliverable/workflow
```

**Confidence: medium-high as public architecture, low for exact deployment.**
Perplexity directly describes the layers and operations [S4-S6], but does not
publish the production code, SDK contract, model prompts, complete tool policy,
or per-run trace. Search as Code's research paper specifically says its rollout
started with Computer and Agent API; it is not proof for legacy Research [S6].

### 11.3 Key architectural lesson

**INFERENCE (high):** the valuable split is semantic control versus deterministic
execution. Models can propose facets, assess ambiguity, choose what evidence is
needed, and synthesize. Deterministic components should own fan-out counters,
deduplication, joins, retries, provenance, deadlines, and budget enforcement.

## 12. Curiosity verdicts and exact implications

| Observed pattern | Verdict | Exact Curiosity implication |
| --- | --- | --- |
| Clarification before expensive research | **ADOPTED** | If scope is broad/ambiguous, pause before retrieval; answers modify the declared frame, not hidden prompt state. |
| Iterative search-read-reassess loop | **ADAPTED** | Use visible bounded branches with parent, purpose, evidence need, and aggregate counters. |
| Parallel paths for independent legal/topic facets | **ADOPTED** | Execute independent branches concurrently under fixed fan-out/concurrency and deterministic merge. |
| Model-generated search programs | **DEFERRED** | First build an owned branch ledger and safe primitives; later evaluate restricted code over read-only evidence with no ambient credentials/egress. |
| Search then deep-read selected sources | **ADOPTED** | Discovery snippets are leads; material claims require fetched, passage-anchored captures. |
| Evidence sufficiency and conflict awareness | **ADAPTED** | Maintain explicit support/contradict/unresolved edges and coverage criteria; model judgment cannot override hard limits. |
| Hidden model routing | **REJECTED as contract** | Version the project policy/model/extractor/ranker configuration; report every effective component used. |
| Progress and key findings during execution | **ADAPTED** | Stream typed, durable, retractable findings with evidence state—not unverifiable chain-of-thought. |
| User follow-up while running | **ADAPTED** | Queue only explicitly authorized in-frame amendments; re-estimate budget and preserve revision lineage. |
| Editable/shareable report artifact | **ADOPTED** | Separate immutable evidence/claim graph from mutable presentation; sharing never changes evidence custody. |
| “Every factual claim” inline citation | **ADAPTED** | Require exact claim-to-capture/passage edges and local entailment checks, not URL presence alone. |
| Domain source labels | **ADAPTED** | Track source class and ownership/review signals, but never infer page or claim correctness from domain reputation. |
| Opaque “enough evidence” stopping | **REJECTED alone** | Emit coverage, saturation, budget, deadline, policy, failure, or cancellation stop reason and unresolved branches. |
| Provider-side sessions stored indefinitely | **REJECTED as authority/evidence store** | Own minimized/redacted research state and immutable captures; hosted IDs are optional display references only. |
| Computer can act after research | **REJECTED for retrieval loop** | Research remains read-only. Any later action is a separately framed, confirmed capability outside retrieved-text authority. |
| Consumer training opt-out | **REJECTED as sufficient privacy** | Hosted use requires data classification, minimization, retention/contract review, and no secrets/private repository content. |
| Vendor benchmark leadership | **REJECTED as proof** | Reproduce provider-neutral evidence and latency/cost evaluation on a predeclared public corpus. |

### 12.1 Provider-neutral bounded research loop

1. Caller supplies objective, exclusions, evidence classes, freshness need,
   output contract, authority, and aggregate budget.
2. Clarifier pauses on material ambiguity; it does not silently guess.
3. Planner emits a small branch manifest including primary-source verification,
   direct answer, disconfirmation, and temporal update where relevant.
4. Retrieval returns untrusted candidates grouped by branch with coverage and
   policy warnings.
5. Reader fetches selected sources into immutable captures and anchors passages.
6. Verifier records support, contradiction, and unresolved evidence edges.
7. Synthesizer writes only from verified evidence, preserving unknowns and
   partial-coverage warnings.
8. One post-synthesis curiosity pass scores remaining in-frame gaps by relevance,
   value, novelty, and cost.
9. Only the best caller-authorized follow-up may execute. Stop on coverage,
   saturation, exhaustion, policy, failure, or cancellation. Record all rejected
   candidates as `CURIOSITY_NO_GO`.

This adapts Deep Research's strongest product behavior while prohibiting live
autonomous curiosity and action authority.

## 13. Fact / inference / recommendation ledger

| ID | Type | Claim | Confidence | Sources | Verdict |
| --- | --- | --- | --- | --- | --- |
| L1 | FACT | Research is a user-facing cited-report mode, distinct from APIs. | High | S1-S3, S10 | **ADOPT boundary** |
| L2 | FACT | Current official pages expose both a Research selector and Computer Deep Research, while the product page calls the earlier system Legacy DR. | High | S2, S4-S5 | **STATUS unresolved** |
| L3 | FACT | Research iteratively searches, reads, reasons, revises its plan, evaluates evidence, and synthesizes. | High as product claim | S1-S4 | **ADAPT** |
| L4 | FACT | Advanced Research can clarify first, accept during-run follow-ups, show progress/findings, and stream an editable report. | High | S3 | **ADOPT/ADAPT UX** |
| L5 | FACT | Computer Deep Research uses parallel subtasks and Search as Code according to Perplexity. | High as product claim | S4-S6 | **DEFER code execution** |
| L6 | INFERENCE | Legacy Research likely has dynamic branching, but no public branch ledger exists. | Medium-high | S1-S4 | **Add owned ledger** |
| L7 | FACT | Standalone Research exposes no documented work budget or stop reason. | High negative result | S2-S3, S10 | **REJECT opaque control** |
| L8 | FACT | Current quotas are 1/month Free, 50/month Enterprise Pro, and 500/month Enterprise Max; consumer Pro/Max counts are qualitative. | High | S10 | **Treat as mutable entitlement** |
| L9 | FACT | Launch and current Help latency statements conflict with DRACO's longer tested runtime and with each other. | High | S1-S2, S7 | **No SLO inference** |
| L10 | FACT | Computer DR promises inline live-URL citations for factual claims; source labels rate domains, not claims. | High | S4, S13 | **Add passage verification** |
| L11 | INFERENCE | Citation presence is not entailment or completeness. | High | S8, S13 | **ADOPT evidence gate** |
| L12 | FACT | “Live web” is claimed, but per-source capture/freshness provenance is absent. | High | S4-S5, S11 | **Add temporal provenance** |
| L13 | FACT | Consumer AI training use is enabled by default with prospective opt-out; sessions persist until deleted. | High | S12, S15, S20 | **Sensitive use rejected** |
| L14 | FACT | BrowseSafe advocates untrusted web boundaries, but no Research-specific deployment mapping was found. | High | S23 | **UNKNOWN; defend locally** |
| L15 | RECOMMENDATION | Research remains read-only, caller-framed, hard-budgeted, evidence-anchored, and externally authorized. | High | L1-L14 | **ADOPTED** |
| L16 | RECOMMENDATION | Computer Deep Research should not be exposed as neutral `web_search`. | High | S4-S6, S16 | **REJECTED** |

## 14. Unknowns and validation checks

### 14.1 Retained unknowns / negative results

1. Whether standalone Research mode is being retired, remains fully supported,
   or will converge with Computer Deep Research.
2. Exact Pro/Max consumer Research quotas, reset windows, burst/concurrency
   rules, and whether Advanced Research consumes more quota.
3. Whether Computer Deep Research consumes only Computer credits, Research
   query entitlement, both, or plan-dependent combinations.
4. Exact planner/model/tool versions, branch graph, generated queries, retries,
   per-branch budgets, and plan-revision history.
5. Exact semantic stop rule, hidden hard ceilings, completion reason, and partial
   result behavior.
6. Candidate corpus, ranking, authority/diversity scoring, duplicate ownership,
   search versus browser-fetch split, and inaccessible-page handling.
7. Whether every synthesis source appears in the source panel and every citation
   maps to the exact content version read.
8. Citation entailment/completeness, source-label coverage/error rates, and
   treatment of conflicting primary sources.
9. Per-source live/cache/index/premium/connectors provenance and freshness.
10. Standalone Research cancellation, disconnect, retry, background durability,
    failure states, and report recovery.
11. Research-specific prompt-injection, file isolation, malware, source-policy,
    and content-safety controls.
12. Actual latency, quality, source diversity, cost, and reproducibility under
    current plans; no run was made.

### 14.2 Checks before any separately authorized evaluation

1. Confirm in writing which product surface and entitlement is under test.
2. Use only synthetic/public prompts and owned benign files; no secrets, personal
   data, private URLs, or repository context.
3. Predeclare atomic, multi-hop, contradictory, time-sensitive, and wide tasks.
4. Record effective plan/model labels, wall time, progress events, quotas/credits,
   source count, unique owner clusters, and all failures.
5. Capture cited pages independently at completion and judge exact
   claim-to-passage entailment, not citation presence.
6. Test whether during-run follow-ups widen work/charges and whether cancellation
   or disconnect stops provider execution.
7. Compare citations against source panel and exports; verify links and labels
   survive export without changing claim identity.
8. Repeat over time to detect product/model drift. Never generalize one run.

## 15. Bounded curiosity pass

Score: 1 (low) to 5 (high); cost 1 (cheap) to 5 (expensive). This pass remained
inside the caller-declared public-primary-source frame.

| Thread | Rel. | Value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Resolve current Research versus Computer product status | 5 | 5 | 5 | 1 | **Pursued:** Help still documents Research mode; product page routes to Computer and calls old system Legacy DR. Retained transition as unresolved [S2-S5]. |
| Reconcile current limits and prices | 5 | 5 | 4 | 1 | **Pursued:** exact Free/Enterprise quotas found; consumer Pro/Max remain qualitative; Computer credits are separate [S9-S10, S17]. |
| Test whether Search as Code applies to legacy Research | 5 | 5 | 4 | 2 | **Pursued to saturation:** official rollout claims Computer and Agent API; no proof for legacy Research. Kept architectures separate [S4-S6]. |
| Verify citation entailment with live/paid runs | 5 | 5 | 4 | 5 | `CURIOSITY_NO_GO`: credentials, paid testing, and product probing were forbidden. |
| Inspect private traffic/UI endpoints to recover plans | 3 | 2 | 4 | 5 | `CURIOSITY_NO_GO`: Terms and clean-room boundary prohibit it; public behavior is sufficient. |
| Infer proprietary planner prompts/ranking | 2 | 2 | 5 | 5 | `CURIOSITY_NO_GO`: unnecessary, unreliable, and outside license/access boundaries. |
| Claim BrowseSafe deployment in Research | 5 | 4 | 4 | 4 | `CURIOSITY_NO_GO`: no official mapping; requires vendor attestation or separately authorized benign test. |
| Reproduce DRACO/WANDR leadership | 3 | 4 | 3 | 5 | **DEFERRED:** requires a versioned independent benchmark plan and product access. |
| Investigate every premium-source license | 3 | 4 | 3 | 5 | **DEFERRED:** exact procurement/source set is task- and plan-dependent; legal review requires a concrete use. |

**Coverage:** product/status, planning/branching, discovery/read/synthesis,
budgets/stopping, citations/evidence, latency/async UX, limits/pricing,
freshness/privacy/safety, architecture, clean-room lessons, Curiosity
implications, confidence, unknowns, and validation checks are represented.

**Stop:** coverage and documentary saturation reached. Remaining high-value gaps
require vendor confirmation, credentials, paid/live tests, or legal/procurement
authority not granted here.

## 16. Clean-room and license/access boundary

This is behavioral research, not legal advice.

- Perplexity's consumer Terms restrict reverse engineering underlying ideas or
  algorithms, unauthorized automation, scraping, access-control bypass, and use
  outside expressly permitted service access [S19]. No such activity occurred.
- Product pages, Help, legal pages, and research reports are evidence, not code
  or permission to reproduce prompts, private ranking, hosted indexes, datasets,
  results, source labels, or branding.
- DRACO and WANDR are described as open releases [S7-S8], but no dataset,
  benchmark code, prompts, or fixtures are incorporated here. Any future reuse
  requires artifact-specific license, data-rights, privacy, and attribution
  review.
- Search as Code's published examples and architecture can inform general
  provider-neutral patterns. Curiosity must independently specify its own
  contracts and use project-created fixtures; it must not reconstruct or claim
  compatibility with Perplexity's Agentic Search SDK.
- Uploaded, connected, premium, and public-web content may carry third-party
  rights. A citation or product access does not transfer those rights.

## 17. Primary sources

All sources were accessed 2026-08-17. Product/help pages are mutable snapshots;
vendor benchmark and architecture statements were not independently verified.

1. **[S1]** Perplexity, [Introducing Perplexity Deep Research](https://www.perplexity.ai/hub/blog/introducing-perplexity-deep-research), 2025-02-14 — launch process, source/search scale, latency, access, export, and initial benchmarks. **High for historical claim; medium for current behavior.**
2. **[S2]** Perplexity Help, [What is Research mode?](https://www.perplexity.ai/help-center/en/articles/10738684-what-is-research-mode.html), updated 2026-07-16 — current mode access, automatic model selection, process, and latency wording. **High, time-sensitive.**
3. **[S3]** Perplexity Help, [What's New in Advanced Deep Research](https://www.perplexity.ai/help-center/en/articles/13600190-what-s-new-in-advanced-deep-research.html), updated 2026-07-16 — clarification, during-run follow-up, progress/findings, uploads, code sandbox, models, and editable report. **High.**
4. **[S4]** Perplexity, [Deep Research, now in Computer](https://www.perplexity.ai/hub/blog/deep-research-now-in-computer), 2026-06-11 — planning, evidence/conflicts, parallel paths, live/internal/premium sources, Search as Code, citations, and product migration. **High for vendor architecture claim.**
5. **[S5]** Perplexity, [Deep Research product page](https://www.perplexity.ai/hub/products/deep-research) — current Computer routing, primary-source/site scale, files/apps, premium sources, 20+ models, and Legacy-versus-Computer benchmark framing. **High, mutable marketing source.**
6. **[S6]** Perplexity Research, [Rethinking Search as Code Generation](https://research.perplexity.ai/articles/rethinking-search-as-code-generation), 2026-06-01 — model/sandbox/Agentic Search SDK layers, programmable retrieval operations, intermediate state, and rollout scope. **Medium-high for described architecture; does not establish legacy Research internals.**
7. **[S7]** Perplexity Research, [Evaluating Deep Research Performance in the Wild with the DRACO Benchmark](https://research.perplexity.ai/articles/evaluating-deep-research-performance-in-the-wild-with-the-draco-benchmark), 2026-02-04 — production-derived benchmark, toolset, rubric dimensions, judge method, latency, and limitations. **High for disclosed method; medium for comparative results.**
8. **[S8]** Perplexity Research, [WANDR Benchmark: Evaluating Research Agents That Must Search Wide and Deep](https://research.perplexity.ai/articles/wandr-benchmark-evaluating-research-agents-that-must-search-wide-and-deep), 2026-07-14 — evidence re-fetch grading, hierarchy completion, citation-support failures, cost/latency, and Search as Code results. **High for disclosed method; medium for vendor results; indirect to standalone Research.**
9. **[S9]** Perplexity, [Pricing](https://perplexity.ai/hub/pricing) and Help [Perplexity Max](https://www.perplexity.ai/help-center/en/articles/11680686-perplexity-max.html) — Free/Pro/Max prices and qualitative research positioning. **High, time-sensitive.**
10. **[S10]** Perplexity Help, [Which Perplexity Subscription Plan is right for you?](https://www.perplexity.ai/help-center/en/articles/11187416-which-perplexity-subscription-plan-is-right-for-you.html), updated 2026-08-17 — current plan matrix, Research quotas, privacy distinctions, and API separation. **High, time-sensitive.**
11. **[S11]** Perplexity Help, [How does Perplexity work?](https://www.perplexity.ai/help-center/en/articles/10352895-how-does-perplexity-work.html), updated 2026-05-01 — general real-time search, citation, source, and Research descriptions. **Medium for Research-specific behavior.**
12. **[S12]** Perplexity Help, [What is a Session?](https://www.perplexity.ai/help-center/en/articles/10354769-what-is-a-thread.html), updated 2026-07-30 — session contents, retention, modes, source lists, export, privacy, and sharing. **High.**
13. **[S13]** Perplexity Help, [Understanding source labels](https://www.perplexity.ai/help-center/en/articles/20260806-understanding-source-labels.html), updated 2026-08-07 — Government/Academic/Trusted labels, domain-level review, non-endorsement, mutability, and feedback. **High.**
14. **[S14]** Perplexity Help, [How does Perplexity follow robots.txt?](https://www.perplexity.ai/help-center/en/articles/10354969-how-does-perplexity-follow-robots-txt.html), updated 2026-07-16 — current crawler and third-party crawler policy. **High for stated policy.**
15. **[S15]** Perplexity Help, [Data Collection at Perplexity](https://www.perplexity.ai/help-center/en/articles/11564572-data-collection-at-perplexity.html), updated 2026-07-16 — consumer default training use, prospective opt-out, and Enterprise differences. **High for stated policy.**
16. **[S16]** Perplexity Help, [What is Computer?](https://www.perplexity.ai/help-center/en/articles/13837784-what-is-computer.html) and [Computer product page](https://www.perplexity.ai/products/computer) — action authority, connectors, background execution, parallel research, sandbox, access, and product boundary. **High for published product behavior.**
17. **[S17]** Perplexity Help, [How Credits Work on Perplexity](https://www.perplexity.ai/help-center/en/articles/13838041-how-credits-work-on-perplexity.html), updated 2026-08-06 — Computer-only credits, variable task cost, pause/resume, spending caps, and Ask separation. **High, time-sensitive.**
18. **[S18]** Perplexity, [Status page](https://status.perplexity.com/) — point-in-time aggregate Website/API/Computer status and 90-day view. **High for displayed aggregate status; low for Research-specific reliability.**
19. **[S19]** Perplexity, [Consumer Terms of Service](https://www.perplexity.ai/hub/legal/terms-of-service), updated 2026-01-23 — service/API distinction, restrictions, content rights, third-party materials, output limitations, and professional-advice warnings. **High; not legal advice.**
20. **[S20]** Perplexity, [Privacy Notice](https://www.perplexity.ai/hub/legal/privacy-notice), updated 2026-07-08 — consumer prompts/uploads/outputs, uses, sharing, choices, security, and purpose-based retention. **High for stated policy.**
21. **[S21]** Perplexity Help, [Are third-party model providers training on my data?](https://www.perplexity.ai/help-center/en/articles/10354963-are-third-party-model-providers-training-on-my-data.html), updated 2026-07-16 — claimed no-retention/no-training agreements with external model providers. **High for stated claim; contract not inspected.**
22. **[S22]** Perplexity Help, [How long does Perplexity retain my search history, profile data, and personal information?](https://www.perplexity.ai/help-center/en/articles/10354873-how-long-does-perplexity-retain-my-search-history-profile-data-and-personal-information.html), updated 2026-07-16 — account-active retention and 30-day deletion statement. **Medium-high; legal exceptions remain.**
23. **[S23]** Perplexity Research, [BrowseSafe](https://research.perplexity.ai/articles/browsesafe), 2025-12-02 — untrusted web boundary and defense-in-depth prompt-injection research. **High for proposed architecture; no standalone Research deployment mapping.**
24. **[S24]** Perplexity, [Security](https://www.perplexity.ai/hub/security) — SOC 2 Type II, infrastructure/access controls, vendor review, monitoring, and VDP claims. **Medium-high for general posture; not a Research-specific guarantee.**
