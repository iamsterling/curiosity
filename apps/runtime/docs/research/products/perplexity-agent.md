# Perplexity Agent API and Deep Research: clean-room product dossier

**Date:** 2026-08-17

**Decision:** which publicly observable Perplexity agent-search patterns should
inform Curiosity's owned, bounded research loop, separately from Perplexity's
raw Search API.

**Status:** research evidence and recommendations only; not an implementation,
integration, benchmark, or deployment record.

## Executive conclusion

Perplexity exposes two materially different contracts. Its Search API returns
ranked web results for caller-owned processing. Its Agent API runs a model-led
loop that can search, fetch, reason, and finally synthesize a cited answer in one
managed response [S1, S2, S3]. The useful lesson for Curiosity is therefore not
"add a better search endpoint." It is to keep retrieval, evidence inspection,
claim synthesis, and stopping as distinct, observable stages while retaining a
single caller-owned frame and aggregate budget.

**ADAPT (high confidence):** explicit loop bounds, typed intermediate search and
fetch outputs, source IDs, per-request cost accounting, asynchronous terminal
states, and separate final synthesis. **REJECT (high confidence):** dynamic
unversioned presets, opaque source-selection/stopping policy, provider-held
conversation state, and model-controlled access to action-capable tools as the
Curiosity authority model. **DEFER (medium confidence):** code-orchestrated
search and persistent research workspaces until owned retrieval has passed the
more basic provenance, safety, and evaluation gates.

The public evidence supports an iterative
`reason -> search/fetch -> observe -> reassess -> repeat -> answer` loop. It does
not disclose the ranking algorithm, a durable plan graph, an exact
evidence-sufficiency test, citation-entailment guarantees, or Agent API-specific
prompt-injection controls. Those remain unknown; no paid or credentialed tests
were performed.

## 1. Frame, bounded questions, and method

### 1.1 Questions

1. Where is the boundary between raw Search API retrieval and Agent API
   planning, tool use, and synthesis?
2. What public contract exposes iterative queries, source selection, budgets,
   stopping, citations, freshness, failures, and model/tool boundaries?
3. Which Deep Research product claims are historical product behavior rather
   than current Agent API guarantees?
4. Which patterns improve Curiosity without widening its authority or making a
   hosted provider the production foundation?
5. What cannot be learned without prohibited paid or black-box testing?

**Depth budget:** official public documentation, API schema, product/research
posts, benchmark descriptions, and official SDK license files; no credentials,
paid calls, UI automation, control bypass, source-code reconstruction, or
proprietary ranking inference.

**Stop condition:** every requested category has a sourced fact, a clearly
labeled inference or unknown, and a Curiosity implication; stop when additional
official pages repeat the same contract or require empirical access.

### 1.2 Evidence labels

- **FACT** — directly stated by an official public source or visible in the
  official public API schema.
- **INFERENCE** — architectural interpretation of those facts; not a verified
  internal implementation detail.
- **RECOMMENDATION** — proposed Curiosity choice.
- Confidence is **high**, **medium**, or **low**. “High” for a vendor contract
  means confidence that the vendor currently documents it, not independent
  proof of quality or implementation.

All web sources were accessed 2026-08-17. Vendor benchmarks and product claims
are primary claims about Perplexity's own system, not independent comparative
evidence. Public documentation is mutable; current preset values below are a
dated snapshot.

## 2. Product and API boundary

### 2.1 Raw Search API

**FACT (high):** `POST https://api.perplexity.ai/search` accepts one query or up
to five related queries and returns a response-level ID plus ranked
`results[]`. A result includes title, URL, snippet, and optional publication and
last-updated dates. `max_results` is 1–20 on this API. Domain, language,
geographic, and time controls are caller parameters. Perplexity explicitly says
to use Search API for raw results and Agent API for an LLM-generated answer with
citations [S1].

**INFERENCE (high):** raw Search API leaves query planning, repeated retrieval,
source qualification, claim extraction, synthesis, and stopping to the caller.
Its multi-query request is parallel retrieval, not evidence that an agent
observes results and adaptively chooses the next query.

### 2.2 Agent API

**FACT (high):** Agent API uses
`POST https://api.perplexity.ai/v1/agent`; `/v1/responses` is accepted as an
OpenAI-compatible alias. A request selects either a preset or model, supplies
input and instructions, enables tools, and may set reasoning, step, output,
streaming, background, state, and structured-output controls [S2, S3].

**FACT (high):** built-in tool results and the final assistant message are
separate typed items in the response `output` array. Search output includes the
agent-generated query strings and result records; fetch output includes fetched
URL content; the message contains final text and citation annotations. Streaming
defines distinct reasoning-started, search-query, search-result, fetch-query,
fetch-result, reasoning-stopped, text, completion, and failure event types [S3].

**INFERENCE (high):** the public wire contract separates retrieval observation
from answer synthesis even though the hosted model orchestrates both. This is a
stronger research substrate than returning only prose because a caller can
retain the evidence trajectory and audit which search/fetch outputs preceded
the answer.

### 2.3 Deep Research surfaces over time

**FACT (high):** the February 2025 consumer Deep Research launch described a
2–4 minute process that performed “dozens of searches,” read “hundreds of
sources,” iteratively refined its research plan, fully evaluated source
materials, and only then wrote a report [S4]. These are historical product
claims, not present Agent API limits.

**FACT (high):** the current preset mapping is:

| Earlier name | Current tier name | Current positioning |
| --- | --- | --- |
| `fast-search` | `fast` | single-fact/quick cited lookup |
| `pro-search` | `low` | light multi-step research |
| `deep-research` | `medium` | multi-hop, multi-source research |
| `advanced-deep-research` | `high` | exhaustive expert-level coverage |
| `ultra` | `xhigh` | open-ended tool/code orchestration |

Perplexity says dynamic presets are unversioned and may change model, prompt,
tools, search configuration, and step budget while targeting the same broad cost
and latency band. A caller can instead copy the dated values into a frozen
configuration [S5].

**INFERENCE (high):** “Deep Research” is not one stable algorithm or model. It
has been a consumer mode, a legacy Sonar model, and now a mutable Agent API
preset tier. Curiosity comparisons must identify the surface and date, never
treat the name as a versioned technical specification.

## 3. Observable research loop

### 3.1 Planning and iterative queries

**FACT (high):** Perplexity defines an agent run as a loop in which the model
reasons, optionally calls tools, reads results, and repeats until it answers.
One step is one model pass that may call tools. The model decides whether and
when to call enabled built-in tools [S6, S7]. Search-result items expose the
queries generated for each invocation, and multiple output items can occur in a
single run [S2, S3].

The public current preset prompts also direct research configurations to break a
question into parts, gather evidence, read results, cover missing parts, and
produce a complete final answer with inline citations [S5]. Historical Deep
Research describes plan refinement as new information is learned [S4].

**UNKNOWN:** no first-class plan object, branch graph, hypothesis list, source
quota, or plan-revision record is documented. Streaming may expose a `thought`
field on reasoning events, but the API does not promise a complete, stable, or
machine-auditable rationale [S3]. Exact query decomposition and parallelization
are model/prompt behavior.

### 3.2 Search, deep reading, and source selection

**FACT (high):** `web_search` discovers pages; `fetch_url` retrieves fuller
content for already-known URLs. Perplexity recommends combining them for
multi-step research. Search supports explicit total and per-page token budgets,
result count, domain/date/recency filters, and location. The backend may return
fewer results than requested [S8, S9].

**FACT (high):** `fetch_url` is best-effort, does not bypass paywalls or login
walls, follows fetchable redirects but reports the requested URL, can return
limited or unrelated text for PDFs/binaries/challenge pages, and omits timed-out
or unreachable URLs from fetched contents. Longer content may be truncated
[S9].

**INFERENCE (medium):** current `medium` and `high` configurations implement a
search-then-read pattern by enabling both tools. The model can discover
candidates from multiple search snippets, choose one URL per fetch invocation,
then revise its next action from fuller content. This is supported by the
contract and prompts but was not exercised here.

**UNKNOWN:** the public sources do not define the underlying candidate corpus,
ranking features, authority model, duplicate handling, source-quality scoring,
ownership/syndication diversity, or why a particular result is promoted or
fetched. Domain filtering constrains eligibility; it does not prove source
quality.

### 3.3 Synthesis and citations

**FACT (high):** final synthesis is a separate assistant `message` after zero or
more tool-result items. Search results carry numeric IDs and source metadata;
preset instructions require source-backed claims to cite those IDs inline. The
API can also enforce a caller-supplied JSON schema for the final output [S2, S3,
S5].

**FACT (medium):** Perplexity's DRACO benchmark explicitly evaluates factual
accuracy, breadth/depth, presentation, and primary-source citations. Its public
report says the product led three of four dimensions in Perplexity's own
evaluation [S10]. WANDR separately re-fetches cited pages and checks whether
submitted excerpts appear on the page and fully support each record [S11].

**INFERENCE (high):** citations are generated links from answer claims back to
the returned source set, not proof of claim entailment. WANDR's need to re-fetch
and separately judge page, excerpt, and claim support—and its reported large
drop from retrieval-only to full evidence scores—shows why citation presence
must not be used as citation correctness [S11].

**UNKNOWN:** Agent API documentation does not promise that every cited sentence
is entailed, that all material claims are cited, or that a cited page remains
byte-identical. No capture ID, passage offsets, content hash, extraction
version, index snapshot, or immutable citation artifact is documented.

## 4. Budgets and stopping

### 4.1 Hard controls

**FACT (high):** request-level `max_steps` accepts 1–100. When the cap is
reached, the agent does not fail; it receives one final pass to answer from what
it has gathered. `max_output_tokens` caps generated output. Web search can be
bounded by `max_results`, total search-context tokens, per-page tokens, source
filters, and request-level step/output ceilings; fetch can be bounded to 1–10
URLs per invocation
[S3, S6, S8, S9].

Current dated preset snapshot [S5]:

| Preset | Model | Steps | Reasoning | Output cap | Built-in tools/search budget |
| --- | --- | ---: | --- | ---: | --- |
| `medium` | `openai/gpt-5.6-luna` | 15 | medium | 128,000 | `web_search`, `fetch_url(max_urls=1)`; 15 results; 2,000 total and 2,000 tokens/page |
| `high` | `openai/gpt-5.6-sol` | 15 | medium | 128,000 | same documented search/fetch bounds |
| `xhigh` | `openai/gpt-5.6-sol` | 100 | high | 128,000 | `web_search`, `finance_search`, `sandbox`; 15 search results |

These are current values, not durable guarantees. Notably, `xhigh` is an
open-ended agent configuration rather than simply a deeper `high`; its tool set
and control regime differ.

### 4.2 Semantic stop policy

**FACT (medium):** product and preset language describes continuing until the
question is resolved, source material is evaluated, or the tool/step limit is
reached [S4, S5]. WANDR's Search-as-Code examples use explicit coverage tables,
sparse-branch backfilling, evidence thresholds, deduplication, and a requested
record-count floor [S11, S12].

**INFERENCE (high):** there are at least two stopping layers: deterministic
resource ceilings imposed by the API and model/prompt judgments about evidence
sufficiency. Only the first is a stable public contract. A polished final answer
can therefore mean “enough evidence,” “step budget exhausted,” or “model chose
to stop”; the response alone does not make that distinction explicit.

**UNKNOWN:** no exact completeness threshold, contradiction-resolution rule,
marginal-gain test, duplicate-saturation metric, per-branch budget, or stop
reason is documented for ordinary Agent API research.

## 5. Model/tool/authority boundary

**FACT (high):** the selected model is the control plane for enabled tools.
Perplexity executes built-in search, fetch, finance, people, and sandbox tools.
For custom functions, the model emits arguments but the caller executes the
function and returns its result. Remote MCP tools are discovered and called via
Perplexity; the current schema says `require_approval` is ignored and every MCP
call auto-runs [S3, S7].

**FACT (high):** Perplexity's Search-as-Code architecture goes further: a model
generates Python in a sandbox to orchestrate retrieval, ranking, filtering,
fan-out, rendering, joins, deduplication, retries, aggregation, and stopping.
Deterministic compute handles bulk operations while the model chooses strategy.
Perplexity says this architecture is used in Agent API and can span thousands
of retrieval operations [S12].

**INFERENCE (high):** the critical design dimension is not simply model versus
search. It is semantic control versus deterministic execution. Models are well
suited to proposing facets, interpreting evidence, and deciding what uncertainty
matters; deterministic components are better for counters, deduplication,
budgets, joins, provenance, retries, and stop enforcement.

**RECOMMENDATION (high):** Curiosity must not copy the Agent API authority
boundary. Its researcher may propose search branches, but retrieval cannot gain
write tools, arbitrary MCP auto-execution, finance transactions, browser action,
or general sandbox egress. Caller-declared frame, allowlisted read-only tools,
hard aggregate budgets, and explicit follow-up authority remain outside model
output.

## 6. Failures, safety, privacy, and operational limits

### 6.1 Failure contract

**FACT (high):** background runs are submitted asynchronously, survive client
disconnects, and terminate as `completed`, `failed`, `cancelled`, or
`incomplete`; `queued` and `in_progress` are non-terminal. A caller may poll,
stream, reconnect within a bounded reconnect window, retrieve a snapshot, or
request asynchronous cancellation [S13]. Rate-limit responses are `429`; the
documentation recommends exponential backoff with jitter. The FAQ states that
Perplexity currently provides no uptime, failure-frequency, or recovery-time
guarantee [S14, S15].

**INFERENCE (high):** a usable Curiosity result contract needs terminal status
and partial-evidence semantics independent of final prose. `completed` must not
mean “research is correct”; `incomplete` must retain already verified evidence
without silently presenting it as full coverage.

### 6.2 Untrusted web content and prompt injection

**FACT (high):** API SafeSearch is on by default for offensive and pornographic
result filtering [S15]. Perplexity's BrowseSafe research treats web tools as an
untrusted-content boundary and proposes layered prompt-injection defenses:
content detection, escalation of uncertain cases, user confirmation, and tool
policy enforcement. Its own report says detection is not a silver bullet and
sophisticated multilingual or camouflaged injections remain difficult [S16].

**FACT (high):** Perplexity describes a VM-isolated sandbox architecture with
egress mediation and credentials held outside the guest for long-running agents
[S17]. This is a general Perplexity agent-runtime claim; the public source does
not map every control to every Agent API preset.

**UNKNOWN / NEGATIVE RESULT:** no public Agent API page found here states that
Agent API web-search or fetch outputs pass through BrowseSafe, identifies the
detector/version, exposes a prompt-injection warning, or guarantees that
retrieved text cannot influence tool selection. SafeSearch is not a
prompt-injection defense. Curiosity must therefore treat all returned text and
metadata as adversarial regardless of provider claims.

### 6.3 State and privacy contradiction

**FACT (high):** conversation state can be caller-replayed or continued with
`previous_response_id`. Perplexity states that response and conversation state
is persisted server-side; `store:false` hides retrieval but does not disable
persistence and the response can still be used for continuation [S18].

**FACT (medium):** Perplexity's privacy and FAQ pages separately claim zero-day
or zero-data retention for API prompt/query data and no model training on that
data [S19, S15]. The privacy page specifically names the Chat Completions API,
while the state page explicitly warns ZDR customers to check before relying on
stateful Agent API features [S18, S19].

**INFERENCE (high):** these statements are not sufficiently scoped to infer
that ordinary stateful Agent API use has zero persistence. `store:false` is a
visibility control, not a deletion or no-retention control.

**RECOMMENDATION (high):** Curiosity should replay only a minimized, redacted
research state that it owns. Do not make provider-side response IDs the sole
record of plan, evidence, or continuity. Require contractual retention review
before sending sensitive research frames to any hosted service.

## 7. Pricing, throughput, and variability

**FACT (high):** Agent API billing combines selected-model input/output/cache
tokens with per-tool fees. As of access, `web_search` costs $0.0025 per
invocation and `fetch_url` $0.0005; sandbox is $0.03 per session and sandbox
search $0.0025. The response includes token, tool-invocation, and USD cost
breakdowns. Perplexity's preset calculator uses representative median values,
not fixed billed amounts [S20].

**FACT (high):** Agent API limits scale from 1 QPS/50 requests per minute at
tier 0 to 33 QPS/2,000 requests per minute at tiers 4–5. Usage tiers are based
on cumulative credit purchases. Search API has a separate 50-query-unit/second
limit; a multi-query search consumes one unit per query even though the
successful request is one Search API billing unit [S14].

**INFERENCE (high):** preset names are poor budget contracts. Dynamic model,
prompt, and tool changes plus model-selected invocation counts make latency and
cost variable. Exact budgets require frozen explicit fields, local aggregate
accounting, timeout/cancellation, and a ceiling that counts every branch and
retry—not a descriptive “medium” or “high” label.

## 8. Provenance and freshness

**FACT (high):** Agent search records expose query text, result ID, URL, title,
snippet, source type, publication date, and `last_updated` where available.
Fetch output exposes requested URL, title, and extracted snippet. Perplexity
documents separate `PerplexityBot` indexing and `Perplexity-User` on-demand
fetch identities; the latter generally ignores `robots.txt` because it is a
user-requested fetch [S3, S21].

**INFERENCE (high):** this is useful display provenance but not a chain of
custody. Publication and last-updated values can be absent or incorrect; the
contract does not distinguish publisher claims from crawler observations.
Redirect-terminal URL, retrieval time, source owner, canonical cluster,
content/passage hash, extractor version, index snapshot, rank explanation, and
policy decision are absent.

**RECOMMENDATION (high):** Curiosity should retain the useful fields but attach
owned request/branch IDs, fetched and terminal URLs, observed time, immutable
capture and passage identity, extraction version, source/owner cluster, trust
label, retrieval warnings, and support/contradiction stance. Never cite the
search snippet as though it were the underlying page.

## 9. Architectural reconstruction (inference, not internals)

The narrowest public-behavior reconstruction is:

```text
caller input + instructions + explicit/frozen budget
  -> model proposes one or more queries/actions
  -> hosted search returns ranked candidates and snippets
  -> model observes results
  -> optional URL fetch / other enabled tool
  -> model reassesses coverage and repeats within max_steps
  -> final synthesis with source-ID citations
  -> typed output, usage/cost, and terminal status
```

For Search as Code, public research supports an alternate inner lane:

```text
model writes task-specific retrieval program
  -> isolated deterministic runtime
  -> composable search primitives + batch/fan-out/filter/join/dedupe
  -> compact persisted intermediate state
  -> model inspects gaps and revises program
  -> evidence-backed output
```

**Confidence: medium.** Both diagrams match public contracts and first-party
architecture descriptions [S3, S6, S12], but they intentionally omit unknown
ranking, model-serving, indexing, safety, caching, and orchestration internals.

## 10. Curiosity patterns and exact implications

| Observed pattern | Verdict | Exact Curiosity implication |
| --- | --- | --- |
| Raw retrieval separate from final answer | **ADOPTED** | `web_search` returns typed evidence only; researcher synthesis remains a later stage. |
| Typed query/result/fetch/message trajectory | **ADAPTED** | Persist branch query, tool result, verification decision, and final claim as different records. |
| Model can iteratively reformulate queries | **ADAPTED** | Permit bounded child branches with parent ID, purpose, expected gain, and remaining budget. |
| Hard `max_steps` plus final pass | **ADAPTED** | Enforce search/fetch/token/time/cost ceilings outside the model; on exhaustion, mark partial coverage before synthesis. |
| Search then fetch important URLs | **ADOPTED** | Discovery snippets are leads; claims require fetched, passage-anchored evidence. |
| Dynamic unversioned presets | **REJECTED** | Use versioned project-owned policy profiles with explicit values and changelog. |
| Provider-selected sources with inline citations | **ADAPTED** | Keep inline citations, but validate claim-to-passage support and preserve immutable capture identity. |
| Model semantic stopping | **REJECTED alone** | Require machine-readable stop reason: coverage, saturation, budget, policy, failure, or caller cancellation. |
| Code for fan-out/dedupe/coverage | **DEFERRED/ADAPTED** | First implement deterministic branch ledger and counters; only later evaluate restricted, no-egress computation over owned evidence. |
| General MCP/action tools in research loop | **REJECTED** | Research loop remains read-only; no external action can be authorized by retrieved text. |
| Provider-held conversation continuation | **REJECTED as authority** | Own, minimize, redact, and replay research state; provider ID may be a cache hint only. |
| Background polling/cancellation | **ADOPTED** | Long research jobs need durable status, idempotent retrieval, cancellation, and partial-evidence recovery. |
| WANDR evidence-completeness hierarchy | **ADAPTED** | Score branch completion and evidence sufficiency, not report polish or citation count. |

### 10.1 Provider-neutral curiosity loop

1. Caller declares frame, authority, total budget, and required evidence classes.
2. Researcher creates a small branch set with IDs: direct answer,
   primary-source verification, disconfirmation, temporal update, and one
   material missing stakeholder/source class.
3. Retrieval returns untrusted candidates with coverage and provenance warnings.
4. Verifier fetches and anchors passages; it records support, contradiction, or
   unresolved status without granting authority.
5. Synthesizer answers only from verified evidence and labels inference.
6. One post-synthesis curiosity pass scores remaining in-frame gaps by
   relevance, value, novelty, and cost.
7. Only the best authorized follow-up runs. Stop on coverage, saturation,
   exhaustion, policy block, repeated near-duplicates, or caller cancellation.
   Record every rejected branch as `CURIOSITY_NO_GO`.

This adapts Perplexity's iterative evidence loop while preserving Curiosity's
ban on live autonomous curiosity.

## 11. Fact / inference / recommendation ledger

| ID | Type | Claim | Confidence | Sources | Verdict |
| --- | --- | --- | --- | --- | --- |
| L1 | FACT | Search API returns raw ranked results; Agent API produces a cited model answer. | High | S1–S3 | **ADOPT boundary** |
| L2 | FACT | Agent runs are iterative model/tool loops with a caller-set step cap. | High | S6–S8 | **ADAPT** |
| L3 | FACT | Tool results and final message are typed, separate output items. | High | S2, S3 | **ADOPT** |
| L4 | FACT | Dynamic presets are unversioned and can change. | High | S5 | **REJECT dynamic dependency** |
| L5 | FACT | Historical Deep Research claimed iterative planning, dozens of searches, hundreds of sources, and 2–4 minute execution. | High as historical claim | S4 | **CONTEXT only** |
| L6 | INFERENCE | Public behavior supports plan/search/observe/synthesize stages, but not a durable plan graph. | High | S3–S7 | **ADAPT with owned ledger** |
| L7 | INFERENCE | Citation presence is not evidence of entailment or completeness. | High | S3, S11 | **ADOPT verification gate** |
| L8 | FACT | Search/fetch expose useful URL, query, snippet, and date metadata but no immutable capture identity. | High | S3, S8, S9 | **ADAPT provenance** |
| L9 | FACT | Agent API can auto-run remote MCP calls; approval flags are ignored. | High | S3 | **REJECT for Curiosity** |
| L10 | FACT | `store:false` hides retrieval but does not prevent provider-side continuation. | High | S18 | **REJECT as privacy control** |
| L11 | INFERENCE | Hard budgets and semantic sufficiency are distinct stopping layers. | High | S5, S6 | **ADOPT explicit stop reasons** |
| L12 | FACT | BrowseSafe advocates treating web tools as untrusted, but Agent API use of it is undocumented. | High | S16 | **UNKNOWN; defend locally** |
| L13 | RECOMMENDATION | Retrieval and curiosity must remain read-only, framed, aggregate-budgeted, and externally authorized. | High | local ADR 0021; L1–L12 | **ADOPTED** |
| L14 | RECOMMENDATION | Defer code-orchestrated retrieval until basic owned provenance and evaluation gates pass. | Medium | S11, S12 | **DEFERRED** |

## 12. Validation checks for a Curiosity design

1. **Boundary:** can a raw search result be stored and inspected without
   triggering synthesis or any external action?
2. **Trace:** does every query carry frame, branch, parent, purpose, policy,
   index/capture, and budget IDs?
3. **Budget:** do aggregate counters include retries, parallel calls, fetches,
   model tokens, elapsed time, and cost, with deterministic cancellation?
4. **Stop:** is the stop reason explicit and independently testable rather than
   inferred from polished prose?
5. **Evidence:** does every cited claim resolve to an immutable capture and
   exact passage/hash, with support/contradiction status?
6. **Freshness:** are claimed publication time, observed fetch time, first/last
   seen, and substantive-change time represented separately?
7. **Diversity:** can evaluation detect ten URLs that reduce to one publisher,
   owner, wire story, or canonical content cluster?
8. **Safety:** can malicious page text neither alter policy nor request secrets,
   action tools, more budget, or self-approval?
9. **Partial failure:** do timeout, blocked fetch, malformed content, budget
   exhaustion, cancellation, and stale index return bounded typed warnings?
10. **Reproducibility:** are policy, prompt, model, extractor, ranker, and schema
    versions pinned for evaluation and replay?
11. **Curiosity:** does the single follow-up demonstrate marginal unique
    relevant evidence or a material contradiction at bounded cost?
12. **Negative path:** are unselected follow-ups retained as
    `CURIOSITY_NO_GO`, including the score and rejection reason?

## 13. Unknowns and negative results retained

- No public source found specifies Agent API ranking features, source authority
  scoring, canonical/near-duplicate clustering, or source-owner diversity.
- No exact evidence-sufficiency, contradiction, saturation, or semantic stopping
  algorithm was found.
- No Agent API-specific guarantee of citation entailment, completeness, stable
  passage identity, or reproducible source selection was found.
- No public guarantee was found that BrowseSafe protects Agent API web search or
  fetch, or that an injection warning is exposed to callers.
- No immutable preset version history or configuration digest was found;
  copying current values is the documented freezing mechanism.
- No ordinary Agent API uptime or recovery SLO is promised in the FAQ.
- Privacy wording is surface-dependent: general API ZDR claims coexist with
  documented Agent API server-side continuation even under `store:false`.
- Historical consumer claims of dozens of searches and hundreds of sources do
  not establish current API per-run behavior.
- First-party benchmark leadership was not independently reproduced; benchmark
  claims are retained only as vendor-reported evidence.
- No paid calls or credentials were used, so actual query trajectories,
  citation accuracy, source diversity, latency, cost distributions, and failure
  behavior remain unmeasured.

## 14. Bounded curiosity pass

Score: 1 (low) to 5 (high); cost 1 (cheap) to 5 (expensive).

| Thread | Relevance | Value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Resolve whether `store:false` means no persistence | 5 | 5 | 4 | 1 | **Pursued:** state docs explicitly say it remains a continuation source; privacy scope remains unresolved [S18, S19]. |
| Verify exact current deep-research preset values | 5 | 5 | 3 | 1 | **Pursued:** captured dated `medium`, `high`, and `xhigh` values from the official preset page [S5]. |
| Test citation entailment with paid runs | 5 | 5 | 4 | 5 | `CURIOSITY_NO_GO`: credentials/paid testing outside authority. |
| Infer proprietary ranking from repeated queries | 3 | 3 | 3 | 5 | `CURIOSITY_NO_GO`: unclean, statistically weak, and unnecessary for the decision. |
| Determine whether BrowseSafe runs on Agent API | 5 | 5 | 4 | 4 | `CURIOSITY_NO_GO`: no public mapping; requires vendor attestation or authorized test. |
| Audit every historical preset revision | 3 | 3 | 3 | 4 | `CURIOSITY_NO_GO`: no official immutable history found; dated snapshot and pinning recommendation suffice. |
| Copy Search-as-Code SDK behavior | 1 | 2 | 4 | 5 | `CURIOSITY_NO_GO`: proprietary internals are outside the clean-room boundary. |

**Coverage:** planning/search/synthesis, queries, source selection, budgets,
stopping, citations, model/tool boundary, failures, safety, pricing, limits,
provenance, freshness, architectural inference, curiosity patterns, clean-room
lessons, checks, and unknowns are represented.

**Saturation:** additional documentation repeated API examples or mutable model
catalog entries without changing the decision. **Stop:** coverage and saturation
reached; empirical behavior and vendor-internal controls remain intentionally
unknown pending separate caller authority.

## 15. Clean-room and license boundary

This dossier describes public behavior; it is not a legal opinion.

- Perplexity's official Python and TypeScript SDK repositories are published
  under Apache-2.0 [S22, S23]. That permits use subject to its terms, but any
  copied SDK code would remain third-party code—not a wholly owned Curiosity
  search core.
- Public API field names and behavior may inform a provider-neutral functional
  specification. Do not copy private prompts, proprietary ranking, hosted
  indexes, product branding, undocumented behavior, or vendor results into the
  owned implementation.
- Search-as-Code, DRACO, WANDR, BrowseSafe, and SPACE are learning and evaluation
  sources. Their product architecture and published examples are not project
  code. Dataset/model/repository licenses require separate artifact-specific
  review before use.
- An implementation team should work from an independently authored Curiosity
  contract and project-created fixtures. No Perplexity source code was inspected
  beyond official SDK repository/license metadata, and no vendor result corpus
  was retained.

## 16. Primary bibliography and source confidence

All sources are official Perplexity pages or repositories, accessed 2026-08-17.

1. **[S1] Perplexity Search API quickstart.**
   https://docs.perplexity.ai/docs/search/quickstart — raw result contract,
   multi-query behavior, filters, and explicit Search-versus-Agent boundary.
   **Source confidence: high for documented contract.**
2. **[S2] Agent API quickstart.**
   https://docs.perplexity.ai/docs/agent-api/quickstart — endpoint/alias,
   presets, tools, response examples, intermediate outputs, citations, and
   usage/cost shape. **High.**
3. **[S3] Create Agent Response API reference.**
   https://docs.perplexity.ai/api-reference/agent-post — normative public
   request, output, status, streaming-event, tool, result, and bound schemas.
   **High.**
4. **[S4] Introducing Perplexity Deep Research (2025-02-14).**
   https://www.perplexity.ai/hub/blog/introducing-perplexity-deep-research
   — historical product process and scale/runtime claims. **High that claimed;
   medium for generalizing to current API.**
5. **[S5] Agent API presets.**
   https://docs.perplexity.ai/docs/agent-api/presets — naming migration,
   dynamic/frozen semantics, current values, and public prompts. **High but
   time-sensitive.**
6. **[S6] Define the run.**
   https://docs.perplexity.ai/docs/agent-api/building-agents/define-the-run —
   step semantics, cap behavior, preset override, and system instructions.
   **High.**
7. **[S7] Give it tools.**
   https://docs.perplexity.ai/docs/agent-api/building-agents/give-it-tools —
   model/tool boundary, built-ins, MCP, custom functions, and typed results.
   **High.**
8. **[S8] Agent API Web Search.**
   https://docs.perplexity.ai/docs/agent-api/tools/web-search — search context,
   result, token, domain/date/location controls, and response shape. **High.**
9. **[S9] Fetch URL Content.**
   https://docs.perplexity.ai/docs/agent-api/tools/fetch-url-content —
   search/fetch separation, bounds, best-effort failures, access controls, and
   pricing. **High.**
10. **[S10] DRACO benchmark report.**
    https://research.perplexity.ai/articles/evaluating-deep-research-performance-in-the-wild-with-the-draco-benchmark
    — production-grounded research dimensions and first-party evaluation.
    **Medium for performance claims; high for disclosed methodology.**
11. **[S11] WANDR benchmark report.**
    https://research.perplexity.ai/articles/wandr-benchmark-evaluating-research-agents-that-must-search-wide-and-deep
    — evidence hierarchy, re-fetch grading, completeness failures, and bounded
    coverage lessons. **Medium for comparisons; high for stated method.**
12. **[S12] Rethinking Search as Code Generation.**
    https://research.perplexity.ai/articles/rethinking-search-as-code-generation
    — model/runtime/search-primitives separation and programmable retrieval.
    **Medium for internal architecture and results; vendor primary source.**
13. **[S13] Agent API Background Mode.**
    https://docs.perplexity.ai/docs/agent-api/background-mode — asynchronous
    status, polling, reconnect, retrieval, and cancellation. **High.**
14. **[S14] Rate Limits & Usage Tiers.**
    https://docs.perplexity.ai/docs/admin/rate-limits-usage-tiers — Agent and
    Search limits, tier progression, and `429` behavior. **High, time-sensitive.**
15. **[S15] API FAQ.**
    https://docs.perplexity.ai/docs/resources/faq — SafeSearch, privacy, errors,
    support, and absence of current service guarantees. **High for stated
    policy; scope caveats noted.**
16. **[S16] BrowseSafe.**
    https://research.perplexity.ai/articles/browsesafe — web prompt-injection
    threat model and defense-in-depth research. **Medium for measured efficacy;
    high for stated architecture.**
17. **[S17] Making SPACE.**
    https://research.perplexity.ai/articles/making-space-secure-and-efficient-runtimes-for-long-running-agents
    — sandbox isolation, egress, credential, lifecycle, and snapshot claims.
    **Medium; no complete Agent API control mapping.**
18. **[S18] Conversation state.**
    https://docs.perplexity.ai/docs/agent-api/conversation-state — replay,
    persistence, `previous_response_id`, retrieval, and `store:false` semantics.
    **High.**
19. **[S19] Privacy & Security.**
    https://docs.perplexity.ai/docs/resources/privacy-security — vendor ZDR,
    billing metadata, training, and certification claims. **Medium because the
    page names Chat Completions and does not resolve stateful Agent scope.**
20. **[S20] Pricing.**
    https://docs.perplexity.ai/docs/getting-started/pricing — current model,
    tool, sandbox, Search, and representative preset cost inputs. **High,
    time-sensitive.**
21. **[S21] Perplexity Crawlers.**
    https://docs.perplexity.ai/docs/resources/perplexity-crawlers — indexing and
    user-requested fetch agents, IP publication, and robots behavior. **High for
    stated policy.**
22. **[S22] Official Python SDK and Apache-2.0 license.**
    https://github.com/perplexityai/perplexity-py and
    https://github.com/perplexityai/perplexity-py/blob/main/LICENSE — license
    boundary only. **High.**
23. **[S23] Official TypeScript SDK and Apache-2.0 license.**
    https://github.com/perplexityai/perplexity-node and
    https://github.com/perplexityai/perplexity-node/blob/main/LICENSE — license
    boundary only. **High.**
24. **[S24] Agent API versus Sonar benchmarks.**
    https://docs.perplexity.ai/docs/agent-api/migrate-from-sonar/benchmarks —
    first-party BrowseComp, DSQA, and WideSearch cost/score comparisons and
    migration mapping. **Medium for comparative claims; not independently
    reproduced.**
