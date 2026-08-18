# Brave Answers: clean-room product and architecture dossier

**Research date / source access date:** 2026-08-17  
**Scope:** Brave Search API **Answers** (`/res/v1/chat/completions`), with
consumer AI Answers / Ask Brave evidence only where it illuminates the shared
system.  
**Decision:** which product ideas Curiosity should adopt, adapt, reject, or
defer without importing Brave code, proprietary behavior, data, or authority.  
**Status:** independent documentation research; no implementation, credentials,
paid calls, scraping, control bypass, or production access.

## Executive verdict

**ADAPT, do not adopt as Curiosity's retrieval foundation (high confidence).**
Brave Answers is a hosted synthesis service over Brave's search system. It
draws a useful, explicit distinction between a fast one-search answer and a
bounded iterative research mode, exposes citations and per-request usage, and
puts hard ceilings on research queries, iterations, time, results, and context.
Those are strong contract lessons.

It is not a substitute for a provider-neutral retrieval layer. The service
couples retrieval, source selection, model reasoning, and prose synthesis
behind one endpoint. It does not return the candidate set, rank reasons,
document versions, capture times, source-selection policy, calibrated
confidence, contradiction objects, or a reproducible evidence trace. The API
accepts only one user message, its seed is ignored, and citations are optional
in fast mode. Research mode is iterative but vendor-directed: callers can cap
work, yet cannot declare branches, source classes, disconfirmation goals, or a
Curiosity frame [S1, S2].

For Curiosity, **adopt the bounded-work and usage-accounting patterns; adapt
the progressive citation and blind-spot ideas; reject opaque hosted synthesis
as evidence authority; defer any commercial evaluation until terms, privacy,
quality, and an authorized benchmark are reviewed.** The February 2026 API
terms also prohibit storing or creating a database of results beyond transient
operation, derivative works, reverse engineering, bypassing limits, and using
results to evaluate or improve AI systems. Those restrictions make the API a
particularly poor fit for a durable evidence corpus or provider benchmark
without a negotiated order form [S9].

## 1. Frame, bounded questions, and method

### 1.1 Questions

1. Where is the boundary between retrieval and synthesis?
2. What request, stream, citation, usage, error, and limit contract is public?
3. How are sources selected, refreshed, cited, and qualified?
4. What confidence, model, tool, safety, and privacy behavior is observable?
5. What do pricing and terms imply for a bounded research agent?
6. Which architectural and Curiosity ideas transfer clean-room?

### 1.2 Method and confidence

Primary Brave documentation, API reference, official skill file, product
announcements, policy pages, and terms were read on 2026-08-17. OpenAI's
original SimpleQA description was used to bound interpretation of Brave's
benchmark claim. Search snippets were discovery aids only. No API request was
made because the task forbids credentials and paid calls. Public examples were
read as documentation, not reproduced experimentally.

Labels:

- **FACT** — directly stated in a cited primary source.
- **INFERENCE** — architectural conclusion from facts, not observed internals.
- **RECOMMENDATION** — proposed Curiosity decision.
- Confidence is **high**, **medium**, or **low**.

**Coverage boundary:** public contract and published behavior, not proprietary
ranking/model reconstruction, live quality comparison, source-code inspection,
legal advice, or an assertion that marketing claims are independently proven.

## 2. Product identity and retrieval/synthesis boundary

Brave currently uses overlapping names:

- **AI Answers** is the concise consumer search answer, formerly “Answer with
  AI.” Brave says it summarizes Web results and cites sources [S5, S7].
- **Ask Brave** is the consumer chat/search surface with longer answers,
  follow-ups, enrichments, and Deep Research [S6, S7].
- **Answers** is the paid API resource. Brave says the same service powers Ask
  Brave, but the public API itself supports exactly one user message, not a
  multi-turn conversation [S1, S2].

### 2.1 Publicly supported flow

```text
one user message
  + country / language / SafeSearch
  + optional model and completion cap
  + mode and research ceilings
        |
        v
Brave hosted orchestration
  -> Brave Search retrieval (one search, or iterative queries)
  -> result/page analysis and URL selection
  -> answer synthesis
        |
        v
OpenAI-shaped completion or SSE chunks
  -> text + optional inline citation/entity tags
  -> research progress/blindspots/final-answer tags
  -> final usage/cost data
```

**FACT (high):** single-search issues one Web query, passes results to an LLM,
and generates an answer. Research mode performs sequential searches, iteratively
refines the problem, and can take minutes [S1, S4].

**FACT (high):** official agent guidance identifies research stream events for
generated queries, URL counts, URL-selection thinking, progress, blind spots,
the final answer, and usage. It says intermediate drafts are dropped [S2].

**INFERENCE (high):** the API boundary is **answer-as-a-service**, not
retrieval-as-evidence. Retrieval and synthesis are inseparable in the returned
artifact: the caller does not receive all candidates or a replayable mapping
from candidate -> selected passage -> claim.

**INFERENCE (medium):** the visible `<queries>`, `<analyzing>`, `<thinking>`,
and `<blindspots>` events are an observability projection from vendor
orchestration, not a complete or faithful execution trace. The documentation
does not promise completeness, determinism, or stable semantics for these tags.

## 3. Public answer contract

### 3.1 Request and modes

`POST https://api.search.brave.com/res/v1/chat/completions` is described as
OpenAI SDK compatible [S1]. The material contract is:

| Field / behavior | Published contract | Architectural consequence |
| --- | --- | --- |
| `messages` | Exactly one `user` message | OpenAI-shaped, but not a general chat-completions conversation. |
| `model` | `brave-pro` or `brave`; API-reference default `brave-pro` | Model family is selectable only by opaque product ID. |
| `stream` | Default `true` | SSE is the richest and required research path. |
| `max_completion_tokens` | Optional integer | Bounds answer length, but no documented default/max in the reference. |
| `country`, `language` | Defaults `us`, `en` | Locale controls exist. Exact country-ranking semantics are not published. |
| `safesearch` | Default `moderate` | Search-time safety policy is caller-selectable. |
| `enable_citations` | Default `false`; streaming only; not research-compatible | Fast answers are uncited unless explicitly requested. |
| `enable_entities` | Default `false`; streaming only; not research-compatible | Optional presentation enrichment, not evidence provenance. |
| `enable_research` | Default `false`; streaming required | Turns on vendor-controlled iterative search/synthesis. |
| `web_search_options` | Accepted; official skill names `search_context_size` low/medium/high | Coarse context sizing, not source-policy control. |
| `metadata` | Accepted for SDK compatibility, ignored, not stored/returned | Cannot carry a server-round-tripped frame or trace identifier. |
| `seed` | Accepted but ignored; answers explicitly non-reproducible | Replays cannot be assumed stable. |

Research ceilings are unusually explicit [S1, S2]:

| Ceiling | Range | Default |
| --- | ---: | ---: |
| Tokens gathered per research query | 1,024–16,384 | 8,192 |
| Total search queries | 1–50 | 20 |
| Research iterations | 1–5 | 4 |
| Wall time | 1–300 seconds | 180 seconds |
| Results considered per query | 1–60 | 60 |

**INFERENCE (high):** default research authorizes up to 1,200 result slots
(20×60), and the maximum allows 3,000 (50×60), before deduplication or actual
availability. This is a planning upper bound, not evidence that all slots are
fetched, unique, read, or billed identically.

**FACT (high):** `research_allow_thinking` defaults to true. The official skill
describes `<thinking>` as URL-selection reasoning and calls it debug output
[S2].

**RECOMMENDATION (high):** never treat emitted thinking as evidence, policy, or
trusted chain of thought. If evaluated later, disable it unless a reviewed
operational need exists; retain only bounded progress and evidence metadata.

### 3.2 Response and stream framing

Blocking single-search returns an OpenAI-like object with `id`, `model`,
`choices`, assistant text, finish reason, and token usage. Streaming uses SSE
completion chunks [S1, S2, S15]. Rich data is embedded as string tags inside
`delta.content`, rather than a separate typed event channel:

```text
<citation>{...}</citation>
<usage>{...}</usage>

research only:
<queries>...</queries>
<analyzing>...</analyzing>
<thinking>...</thinking>
<progress>...</progress>
<blindspots>...</blindspots>
<answer>...</answer>
```

The published fast-mode citation object contains:

```json
{
  "start_index": 0,
  "end_index": 10,
  "number": 1,
  "url": "https://...",
  "favicon": "...",
  "snippet": "..."
}
```

Usage contains request/query counts, input/output tokens, each cost component,
and total cost. In streaming mode it arrives last; synchronous usage costs are
also exposed in response headers [S1].

### 3.3 Contract strengths and weaknesses

**Strengths (fact/inference, high):** progressive citations; explicit terminal
usage; bounded research; standard-enough SDK envelope; locale/SafeSearch;
distinguishable final answer; and surfaced blind spots.

**Weaknesses (fact/inference, high unless noted):**

- citations and usage are JSON inside textual tags, so parsers must handle tag
  boundaries and must not render control tags as prose;
- citations are opt-in for fast streaming and unavailable through that same
  option in research mode (research citations are built into `<answer>` per the
  official skill);
- the citation schema lacks title, publisher, source class, retrieved/published/
  fetched time, document/capture ID, passage offsets in source, content hash,
  canonical URL, retrieval query, rank/selection reason, and trust label;
- `start_index` / `end_index` appear to anchor answer text, but index units,
  stream-assembly rules, and Unicode semantics are not publicly defined
  (**unknown, medium confidence**);
- there is no typed confidence, abstention reason, contradiction record,
  coverage warning, partial retrieval failure, index snapshot, schema version,
  or source-set manifest;
- the reference documents dated header versioning generally, but Answers does
  not publish a pinned version/date example or tag-schema changelog beyond its
  2025-08-05 launch entry [S1, S12].

## 4. Source selection, citations, freshness, and confidence

### 4.1 Selection and diversity

**FACT (high):** Brave says answers are grounded in relevant Brave Search
results; multi-search iteratively issues more queries and analyzes pages. The
consumer team says it tries to reflect multiple perspectives when possible and
explicitly warns that grounding is not truth [S4, S5].

**FACT (medium):** Brave describes its index as independent, over 30 billion
pages, with over 100 million page updates daily; the 2025 Ask Brave announcement
used 35+ billion pages. These are first-party scale claims, not independently
audited corpus measurements [S6, S15].

**FACT (high):** Brave's security page says not every known URL is indexed.
Inclusion signals include privacy-preserving evidence of real-person visits,
links from multiple indexed pages, and curated RSS; it also reports phishing/
malware blacklists and CSAM scanning [S11].

**INFERENCE (medium):** answer source selection likely has at least three
stages—index inclusion, query ranking, then model/orchestrator URL selection—
but Brave publishes no feature weights, diversity constraints, authority
taxonomy, publisher-owner clustering, or citation allocation algorithm.

**UNKNOWN:** whether Answers uses only organic Brave-index documents for every
query, whether rich third-party providers can enter answers, how syndication and
near-duplicates are handled, and whether consumer Google fallback mixing can
ever affect API Answers. The API docs do not say; consumer fallback is optional
and should not be imputed to the API [S8, S14].

### 4.2 Citation semantics

**FACT (high):** Brave promises verifiable sources and recommends displaying
citations inline. Consumer AI Answers says references back key claims [S1, S7].

**INFERENCE (high):** a URL and snippet make a claim inspectable, but not
reproducible. A page may change; the snippet is not tied to a capture/version;
and the contract does not say that every generated claim is entailed by its
nearest citation.

**RECOMMENDATION (high):** Curiosity should require claim-to-passage evidence
with source and capture identity. A hosted answer may be a discovery lead, never
the source of record. Follow citations to primary material under permitted
access and label the returned answer untrusted external synthesis.

### 4.3 Freshness

**FACT (high):** Brave describes Answers as backed by real-time Web search and
its index as regularly/continuously updated. The broader Search product exposes
freshness filters and some result age fields [S1, S14, S15].

**FACT (high):** Answers itself exposes no freshness/date-range parameter and
its citation object exposes no source date, index age, or fetch time [S1, S2].

**INFERENCE (high):** “real-time” means query-time retrieval against Brave's
then-current index, not guaranteed currentness of each source or answer. An
answer consumer cannot audit freshness from the Answers contract alone.

### 4.4 Confidence and quality claims

**FACT (high):** no confidence or calibration field is documented. `seed` is
ignored and answers are non-reproducible [S3].

**FACT (high):** Brave reported SimpleQA F1 92.1% for single search and 94.1%
for multi-search in its September 2025 update, along with accuracy variants,
filtering intended to reduce benchmark contamination, human review of rejected
answers, and up to 0.2 percentage-point run variance [S4].

**FACT (high):** SimpleQA is restricted to short, timeless, fact-seeking
questions with a single verifiable answer. Its authors estimate about 3% inherent
dataset error and explicitly leave transfer to long multi-claim answers open
[S13].

**INFERENCE (high):** Brave's benchmark is useful evidence that the vendor
evaluates grounded factual QA, but it does not establish citation entailment,
research completeness, freshness, safety, or calibrated confidence. It is a
vendor-run result and should not be treated as comparative proof.

## 5. Model and tool behavior

- **FACT (high):** only `brave` and `brave-pro` model IDs are public. The
  consumer help page says parts use open-source LLMs, while Brave Search AI is
  built in-house with Brave models/algorithms. The privacy notice also mentions
  open-source LLMs and proprietary AI [S3, S7, S8]. Exact base models,
  versions, prompts, context assembly, and update cadence are not published.
- **FACT (high):** research mode internally plans and issues searches, exposes
  progress and blind spots, and can use extended thinking [S2]. There is no
  caller-visible tool registry, per-query approval, or domain/source policy.
- **FACT (high):** the API is stateless at the request contract level: exactly
  one user message. Multi-turn consumer Ask Brave is a distinct surface [S3,
  S6].
- **INFERENCE (high):** the model has search authority only inside Brave's
  hosted orchestration, but research mode still represents autonomous query
  expansion up to caller-specified ceilings. It does not implement Curiosity's
  caller-declared frame, one bounded follow-up pass, or `CURIOSITY_NO_GO` audit.
- **UNKNOWN:** whether citations are assigned during generation or post hoc;
  whether retrieval snippets or fetched full pages are used for every result;
  how prompt injection in indexed text is detected; and what failures trigger
  abstention, retries, fallback models, or partial answers.

## 6. Safety, security, and privacy

### 6.1 Content and generated-answer safety

**FACT (high):** Answers defaults SafeSearch to `moderate`; `off`, `moderate`,
and `strict` are available [S2, S3]. Consumer documentation says adult-content
Answer with AI is disabled under both off and moderate modes, but does not state
that the API follows exactly the same trigger policy [S10].

**FACT (high):** Brave reports index-level malware/phishing blacklists, CSAM
scanning, security/privacy design reviews, SOC 2 Type II attestation, and an
external API penetration test completed in April 2025 [S11]. These are control
claims, not evidence that generated Answers are safe for every domain.

**FACT (high):** the API terms provide results as-is, disclaim accuracy,
completeness, security, and harmful-code freedom, and say generated results are
not intended to satisfy professional/legal/regulatory/ethical obligations or
provide legal, medical, health, or financial advice [S9].

**UNKNOWN / negative result:** no public Answers documentation located here
defines prompt-injection defenses, source-text isolation, jailbreak policy,
malicious citation handling, per-category refusal behavior, provenance-aware
sanitization, or a generated-answer safety evaluation.

### 6.2 API privacy is not consumer-search privacy

This distinction is material:

- **API:** query records are retained for at most 90 days for billing and
  troubleshooting/abuse prevention. Brave says it cannot link a query to an
  customer's end user, but it does know the customer account making the call.
  Enterprise can negotiate Zero Data Retention, subject to legal obligations.
  The customer remains responsible for end-user notices, consent, and data
  protection compliance [S8].
- **Consumer Ask Brave:** conversations are server-processed on AWS in the US,
  encrypted, and erased after 24 hours of inactivity; the key is stored locally,
  IP addresses are not retained, and questions/conversations are not used for
  training. Publicly shared conversations may remain up to seven days [S6, S16].

**INFERENCE (high):** consumer privacy promises cannot be carried over to an API
deployment. Curiosity would disclose queries to Brave under the API policy, and
ordinary-plan query retention is incompatible with a blanket “private” or ZDR
claim.

**RECOMMENDATION (high):** never submit secrets, credentials, private corpus
text, personal data, or hidden user context. Treat query text as third-party
disclosure; minimize it; require an approved retention/legal basis; and keep
keys server-side and scoped. ZDR must be contractually verified, not inferred
from Brave's consumer brand.

## 7. Pricing, limits, and economic behavior

As published on 2026-08-17 [S1, S17]:

- Answers: **$4 per 1,000 searches/queries** plus **$5 per million input
  tokens** and **$5 per million output tokens**;
- $5 monthly credits automatically applied;
- default capacity **2 requests/second**; higher capacity by contact;
- rate limits use a one-second sliding window and return standard remaining/
  reset headers; only successful requests are counted and billed [S18].

The Answers page gives this formula:

```text
cost = searches × $0.004
     + input_tokens × $0.000005
     + output_tokens × $0.000005
```

**FACT (high):** usage distinguishes one outer request from the number of
internal search queries. Research therefore has variable search and token cost
[S1]. Public pages alternately say “requests,” “queries,” and “searches”; the
detailed usage example charges the internal query count.

**FACT (high):** account monthly credit limits are checked before an answer
starts. An answer that crosses the limit may finish, while charges are capped at
the imposed limit [S1].

**INFERENCE (high):** a monthly ceiling is not a per-request denial-of-wallet
control. Curiosity would still need per-call query/time/token ceilings,
concurrency limits, cancellation, and its own cost admission control.

**UNKNOWN:** taxes, enterprise pricing/SLA, exact token accounting, retries,
cache billing, timeout refund behavior, and whether all research retrieval work
maps one-to-one to `X-Request-Queries`.

## 8. Architectural reconstruction (inference, not implementation fact)

| Likely layer | Evidence | Confidence / limit |
| --- | --- | --- |
| Independent crawl/index and abuse filtering | Brave index, update, inclusion, and blacklist descriptions [S11, S15] | High that layer exists; internals unknown. |
| Query/locale/SafeSearch routing | Public request fields [S3] | High. |
| Candidate retrieval | Single search or iterative generated queries [S2, S4] | High; ranking features unknown. |
| Context/page analysis | Results-per-query and tokens-per-query ceilings; analyzed-URL progress [S2] | High; fetch/extraction semantics unknown. |
| Planner/coverage loop | Iterations, queries, thinking, blind spots [S2, S6] | High; stopping and novelty algorithms unknown. |
| Grounded generator | Model IDs, generated answer, citations [S1, S3] | High; model/prompt unknown. |
| Stream serializer/meter | SSE tags and itemized usage [S1, S2] | High. |

**INFERENCE (medium):** research likely alternates plan -> search -> select/read
-> assess blind spots until a limit or sufficient coverage, then synthesizes.
This is the minimum architecture consistent with published events; it is not a
claim about Brave's private implementation.

## 9. Curiosity lessons and provider-neutral adaptation

### Adopt

1. **Two explicit service levels:** fast retrieval/synthesis and bounded
   research, selected by caller intent rather than hidden escalation.
2. **Independent hard budgets:** query count, iteration count, elapsed time,
   results per query, context tokens, completion tokens, and concurrency.
3. **Progress and terminal usage:** report bounded work performed and cost, even
   on partial completion.
4. **Blind-spot artifact:** let synthesis name unresolved in-frame gaps before
   deciding whether another pass is worth its cost.

### Adapt

1. Replace text tags with typed, versioned events: `evidence`, `citation`,
   `coverage_gap`, `partial_failure`, `answer_delta`, `usage`, `done`.
2. Keep retrieval separate from synthesis. Return the selected evidence and
   selection reason classes before prose.
3. Give every citation document/capture/passage identity, timestamps, hash, and
   entailment target; preserve supporting, contradicting, and unresolved edges.
4. Convert “research mode” into caller-authorized branches with frame ID,
   parent branch, purpose, per-branch budget, and stop reason.
5. Score the one post-synthesis Curiosity pass by relevance, value, novelty,
   and cost. The retrieval/model layer may suggest gaps; it may not grant itself
   authority to pursue them.

### Reject

1. Citations disabled by default.
2. Reasoning/debug traces mixed with answer text.
3. One opaque hosted component as both retriever and verifier.
4. Unversioned or mutable URL citations as durable evidence.
5. Vendor benchmark scores as confidence for an individual answer.
6. Monthly spending limits as the sole bound on a costly research call.

### Deferred

- A live representative quality/latency/cost comparison, pending caller
  authority, terms review, an allowed evaluation purpose, a fixed query set,
  and budget.
- Procurement/ZDR/SLA analysis, pending actual data classes and deployment
  requirements.

## 10. Clean-room and contractual boundary

This is not legal advice. The work remained on public documentation and
lawfully accessible first-party materials.

**FACT (high):** the Search API terms prohibit non-transient result storage,
derivative works of API/docs/results, reverse engineering, limit bypass,
redistribution/resale, and use of results to create, evaluate, train, retrain,
fine-tune, benchmark, or improve AI models/services. Search Results are claimed
by Brave as between the parties, subject to third-party-content rights [S9].

Controls for any later team:

- do not inspect private clients, traffic, binaries, prompts, or endpoints;
- do not scrape the UI or evade keys, payment, quotas, robots, or rate limits;
- do not copy Brave documentation prose, branded tag vocabulary, examples,
  results, or model outputs into a Curiosity implementation/spec fixture;
- learn only abstract public behaviors (bounded iterations, typed usage,
  citations), then author independent neutral requirements and fixtures;
- do not retain API results as a corpus, seed an index, or benchmark an AI
  service without written authorization consistent with the terms;
- separately review the official skills repository's MIT license if code is
  ever considered. Its permissive license does **not** license the hosted API,
  documentation, outputs, third-party pages, or Brave trademarks [S2, S9];
- preserve source/date/author attribution in research records and keep
  researchers separate from clean-room implementers where contamination risk
  is material.

## 11. Fact / inference / recommendation ledger

| ID | Type | Claim | Evidence | Confidence | Verdict |
| --- | --- | --- | --- | --- | --- |
| L1 | FACT | Answers combines search and generated synthesis behind one hosted endpoint. | S1, S4 | High | **REJECTED** as retrieval foundation. |
| L2 | FACT | Fast mode is one search; research is iterative multi-search. | S1, S2, S4 | High | **ADAPTED** as explicit service classes. |
| L3 | FACT | Research exposes independent query/iteration/time/result/token bounds. | S2, S3 | High | **ADOPTED** concept. |
| L4 | FACT | Exactly one user message is supported. | S3 | High | **REJECTED** as a true chat contract; useful boundedness retained. |
| L5 | FACT | Citations are opt-in in fast mode and represented as text-tagged JSON. | S1, S2 | High | **ADAPTED** to typed mandatory evidence. |
| L6 | FACT | Citation records lack capture/version/freshness/confidence fields. | S1 | High | **REJECTED** as durable provenance. |
| L7 | FACT | Seed is ignored and answers are non-reproducible. | S3 | High | **ADAPTED** via snapshot/model/evidence manifests. |
| L8 | INFERENCE | Candidate ranking and source selection remain opaque. | S1–S4 | High | **REJECTED** as evidence authority. |
| L9 | FACT | There is no answer confidence field. | S1–S3 | High | **DEFERRED** confidence must be independently evaluated. |
| L10 | FACT | Brave explicitly says grounding is not truth. | S5 | High | **ADOPTED** epistemic warning. |
| L11 | FACT | Ordinary API query logs may be held 90 days; Enterprise ZDR is optional. | S8, S17 | High | **REJECTED** for sensitive queries without approved terms. |
| L12 | FACT | Research cost varies with internal searches and tokens. | S1 | High | **ADOPTED** itemized metering; add per-call admission. |
| L13 | FACT | Terms restrict storage, reverse engineering, bypass, derivatives, and AI evaluation/training uses. | S9 | High | **REJECTED** for corpus/benchmark use absent permission. |
| L14 | INFERENCE | Blind-spot events can improve bounded Curiosity if the caller controls follow-up. | S2, S6 | Medium | **ADAPTED**. |
| L15 | RECOMMENDATION | Curiosity must return evidence before synthesis and preserve claim-level provenance. | Analysis | High | **ADOPTED**. |

## 12. Verification matrix, unknowns, and negative results

### Verification completed

| Material claim | Primary origin | Triangulation / caveat |
| --- | --- | --- |
| Endpoint, modes, tags, prices | Answers docs/API reference [S1, S3] | Official skill [S2], pricing [S17]. |
| Research bounds | API reference [S3] | Official skill [S2]. |
| Shared Ask Brave grounding system | Answers docs [S1] | Ask Brave announcement [S6]. |
| Grounding does not guarantee truth | 2024 team transcript [S5] | API legal disclaimer [S9]. |
| API retention/ZDR | API privacy notice [S8] | Pricing enterprise feature [S17]. |
| SimpleQA scope | OpenAI origin [S13] | Brave acknowledges pollution, ambiguity, variance [S4]. |
| Index safety controls | Security page [S11] | No generated-answer safety proof inferred. |

### Important unknowns

1. Exact model lineage/version, prompts, and change notifications.
2. Candidate generation, reranking, authority/diversity/dedup signals.
3. Citation entailment, completeness, placement algorithm, and offset units.
4. Per-source crawl/fetch/publish age in Answers.
5. Prompt-injection and poisoned-source defenses after retrieval.
6. Abstention, contradiction, retry, fallback, and partial-failure behavior.
7. Research stop criterion beyond configured hard limits.
8. Enterprise SLA, regional processing, ZDR scope, subprocessors, and price.
9. Whether rich third-party data or consumer fallback can enter API answers.
10. Empirical latency/cost/quality on Curiosity's query distribution.

### Negative source results retained

- No public answer-level confidence or calibration contract was found.
- No public source-selection/ranking explanation for Answers was found.
- No document-version, capture-time, hash, or immutable citation was found.
- No answer-specific freshness filter or coverage warning was found.
- No public Answers prompt-injection threat model or red-team report was found.
- No independent reproduction of Brave's SimpleQA score was found in scope.
- No basis was found to claim API Answers uses consumer Google fallback.
- No basis was found to treat “real-time” as a source-freshness guarantee.
- No paid/live behavior was tested, so malformed stream, cancellation, timeout,
  citation accuracy, and error-body behavior remain unverified.

## 13. Bounded curiosity pass

Scoring: 1 low to 5 high; cost 1 cheap to 5 expensive. Follow-up authority was
limited to public, no-call documentation research.

| Thread | Relevance | Value | Novelty | Cost | Outcome |
| --- | ---: | ---: | ---: | ---: | --- |
| Resolve API-versus-consumer privacy | 5 | 5 | 4 | 1 | **Pursued:** found 90-day API retention versus ephemeral consumer chat [S8, S16]. |
| Inspect exact research ceilings/events | 5 | 5 | 5 | 1 | **Pursued:** official skill materially extended the overview [S2, S3]. |
| Check benchmark transfer limits | 4 | 5 | 3 | 1 | **Pursued:** SimpleQA origin limits it to short timeless facts [S13]. |
| Verify contract/license restrictions | 5 | 5 | 5 | 1 | **Pursued:** terms bar durable corpus and AI benchmark/evaluation uses [S9]. |
| Call API across adversarial queries | 5 | 4 | 4 | 5 | `CURIOSITY_NO_GO`: credentials/paid calls prohibited; terms and benchmark authority absent. |
| Reverse engineer private ranker/prompts | 2 | 2 | 4 | 5 | `CURIOSITY_NO_GO`: prohibited, unnecessary, and outside clean-room boundary. |
| Inspect browser traffic/private clients | 2 | 2 | 3 | 5 | `CURIOSITY_NO_GO`: not needed for the public contract and risks access/terms violations. |
| Negotiate enterprise/ZDR terms | 4 | 4 | 2 | 5 | `CURIOSITY_NO_GO`: procurement authority and concrete data/SLO needs absent. |
| General provider bake-off | 3 | 4 | 2 | 5 | `CURIOSITY_NO_GO`: outside single-product frame and may conflict with API terms. |

**Stop:** requested categories are covered; additional public pages repeated the
same product claims. Remaining high-value gaps require prohibited live access,
vendor disclosure, procurement, legal review, or caller-authorized evaluation.

## 14. Primary bibliography

All sources accessed 2026-08-17.

1. **[S1] Brave Search API, Answers service documentation.**
   https://api-dashboard.search.brave.com/documentation/services/answers —
   endpoint, modes, citation/usage tags, latency, cost, limits, changelog.
2. **[S2] Brave, official `answers` agent skill.**
   https://github.com/brave/brave-search-skills/blob/main/skills/answers/SKILL.md —
   exact ceilings, constraints, research event vocabulary, response examples.
3. **[S3] Brave Search API, Answers API reference.**
   https://api-dashboard.search.brave.com/api-reference/summarizer/answers —
   authoritative fields, defaults, ignored seed/metadata, errors, model IDs.
4. **[S4] Brave, “Introducing AI Grounding with Brave Search API.”**
   https://brave.com/blog/ai-grounding/ — architecture description, evaluation,
   benchmark results/caveats, query/page/latency aggregates.
5. **[S5] Brave, “Answer with AI” announcement and team transcript.**
   https://brave.com/blog/answer-with-ai/ — consumer lineage, retrieval grounding,
   multiple perspectives, explicit “grounded doesn't mean truth,” evaluation.
6. **[S6] Brave, “Introducing Ask Brave.”**
   https://brave.com/blog/ask-brave/ — shared product, Deep Research, blind spots,
   consumer privacy, current product-name distinction.
7. **[S7] Brave Search Help, AI in Brave Search.**
   https://search.brave.com/help/ai — canonical consumer features, citations,
   in-house/open-source model statements.
8. **[S8] Brave Search API privacy notice (updated 2025-12-04).**
   https://api-dashboard.search.brave.com/documentation/resources/privacy-notice
   — account processing, 90-day query logs, end-user responsibility, ZDR.
9. **[S9] Brave Search API Terms of Use (updated 2026-02-11).**
   https://api-dashboard.search.brave.com/documentation/resources/terms-of-service
   — licenses, restrictions, IP, disclaimers, termination.
10. **[S10] Brave Search Help, Safe Search.**
    https://search.brave.com/help/safesearch — policy levels and consumer answer
    suppression for adult content.
11. **[S11] Brave Search API, Security.**
    https://api-dashboard.search.brave.com/documentation/resources/security —
    security review, audits, index inclusion and malicious-content controls.
12. **[S12] Brave Search API, Versioning.**
    https://api-dashboard.search.brave.com/documentation/guides/versioning — URL
    major versions, dated `Api-Version`, and compatibility policy.
13. **[S13] OpenAI, “Introducing SimpleQA.”**
    https://openai.com/index/introducing-simpleqa/ — benchmark origin, scope,
    grading, estimated error, calibration and transfer limitations.
14. **[S14] Brave Search API, Web Search documentation.**
    https://api-dashboard.search.brave.com/documentation/services/web-search —
    broader index, freshness, SafeSearch, Goggles, and third-party enrichments;
    used only to distinguish capabilities absent from Answers.
15. **[S15] Brave Search API product page.**
    https://brave.com/search/api/ — current product positioning, index/update
    claims, pricing/capacity, and public response examples.
16. **[S16] Brave Search privacy notice.**
    https://search.brave.com/help/privacy-policy — consumer Ask Brave hosting,
    ephemeral conversation and IP policy; not the API policy.
17. **[S17] Brave Search API pricing.**
    https://api-dashboard.search.brave.com/documentation/pricing — current
    Search/Answers/Enterprise rates, capacity, monthly credits, ZDR positioning.
18. **[S18] Brave Search API rate limiting.**
    https://api-dashboard.search.brave.com/documentation/guides/rate-limiting —
    sliding window, headers, quota behavior, successful-request billing.
