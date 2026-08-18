# You.com Answer API: clean-room product and architecture dossier

**Research and source-access date:** 2026-08-17  
**Surface:** `POST https://api.you.com/v1/answer` only. Web Search, Contents,
and Research are discussed only where they establish this endpoint's boundary.  
**Status:** documentation-based reverse engineering, not an implementation,
integration, benchmark, endorsement, or legal opinion.  
**Access boundary:** public first-party documentation, legal pages, and official
open-source artifacts only; no credentials, free credits, paid calls, consumer
UI inspection, traffic capture, adversarial prompts, or private interfaces.

## Executive verdict

**ADAPT the evidence ergonomics; REJECT Answer as a retrieval or evidence
authority; DEFER any provider adapter until an authorized contract, privacy,
and empirical review (high confidence).**

The Answer API is a narrow, synchronous **search-plus-synthesis** product. A
caller submits one question of at most 400 characters plus freshness, locale,
and domain controls. You.com performs a managed single-search retrieval path,
selects supporting content, synthesizes Markdown, verifies citations, and
returns three artifacts: answer text with `[[n]]` markers, cited URLs with
verbatim excerpts, and web results described as all results considered during
synthesis [S1-S3]. The caller cannot choose the model, prompt, search count,
page-reading policy, synthesis length, citation policy, or verifier.

That compact contract contains two useful ideas:

1. preserve the **considered set** separately from the **cited set**; and
2. return the exact evidence excerpts used for a citation rather than URLs
   alone.

Neither is durable provenance. The response has no capture or passage ID,
fetch time, content hash, canonical/redirect URL, rank or selection reason,
model/prompt/verifier version, request ID, usage, confidence, contradiction,
coverage, abstention, partial-failure, or freshness warning. A mutable URL and
copied string cannot establish which page version supported a claim.

There is also a material documentation-integrity warning. The official examples
do not consistently exhibit the public guarantees. In the aurora example, one
cited URL is absent from `results.web`; in the federal-funds example, none of
the three cited URLs appears among the three displayed considered results. The
FDA example's answer contains markers `[[1, 2, 3, 4, 5]]` while the displayed
`citations` array has three members. The AI-regulation example attaches one
excerpt about two state bills to a long answer containing many other specific
claims [S2]. These are published examples, not live observations; they may be
abridged or stale. They nevertheless mean a client must validate marker
resolution, cited/result-set joins, and claim/excerpt support rather than rely
on prose promises.

You.com reports **93.48% SimpleQA accuracy** and **2.67 s p50 latency** [S1,
S3]. Confidence in the existence of that vendor claim is high; confidence that
it predicts Curiosity quality is low. No Answer-specific evaluation protocol,
run manifest, sample count, date, model/version, error bars, abstention rate, or
raw outputs were found. SimpleQA itself is restricted to short, timeless,
single-answer questions and has an estimated ~3% inherent dataset error [S14].
The official public evaluation repository predates Answer, evaluates Search
results synthesized by a separately chosen LLM, and reports a different
92.09% result for Search-with-livecrawl; it does not reproduce the Answer API
number [S15].

## 1. Decision frame, bounded questions, and evidence rules

### 1.1 Bounded questions

1. What is the current request, response, citation, limit, price, and failure
   contract?
2. Where does raw retrieval end and vendor synthesis begin?
3. What can be established about source selection, excerpts, citation
   verification, freshness, confidence, and model behavior?
4. Which safety, privacy, terms, and data-retention boundaries affect a bounded
   Curiosity integration?
5. What is the least speculative architecture consistent with public behavior?
6. Which ideas should Curiosity adopt, adapt, reject, or defer clean-room?

### 1.2 Labels and source policy

- **FACT**: directly stated in a cited primary source or present in an official
  published schema/artifact. A vendor statement proves what the vendor claims
  or documents, not its empirical truth under every input.
- **INFERENCE**: the narrowest explanation consistent with facts; not a claim
  about proprietary internals.
- **RECOMMENDATION**: an independently authored Curiosity design decision.
- Confidence is **high**, **medium**, or **low**.
- Current endpoint reference and guide outrank launch prose where they differ.
- Official examples are evidence about published documentation, not live API
  observations.
- Vendor benchmarks are first-party claims. SimpleQA's original description is
  used to bound transfer, not to independently validate You.com.

### 1.3 Stop condition

Every requested category must have a sourced fact, uncertainty boundary, and
Curiosity implication. Stop on coverage and source saturation. Gaps requiring
credentials, paid traffic, unsafe/adversarial probing, procurement, legal
interpretation, or proprietary reconstruction remain explicit unknowns.

## 2. Product identity and retrieval/synthesis boundary

### 2.1 The public boundary

```text
question + retrieval controls
        |
        v
You.com managed Answer pipeline
  -> one search/retrieval pass
  -> supporting-content selection
  -> chunking and reranking
  -> LLM answer synthesis
  -> citation existence/support verification
        |
        v
answer Markdown + citations/excerpts + considered web results
```

**FACT (high):** You.com calls Answer a single-request pipeline over the same
retrieval and extraction infrastructure as Web Search and Contents. It says the
pipeline retrieves web results, pulls relevant supporting content, synthesizes
the answer, and verifies citations [S1]. The launch post names chunking,
reranking, and citation verification as underlying functions [S3].

**FACT (high):** Answer is intended for straightforward questions answerable
from a single high-quality search. Multi-step searches and cross-source
reasoning are directed to Research [S1, S3].

**INFERENCE (high):** this is **answer-as-a-service**, not raw retrieval. Even
though raw-looking `results.web` records are returned, candidate retrieval,
passage selection, generation, and verification are controlled inside one
hosted operation. The caller cannot replay the synthesis from the response
because it lacks the selected page captures, complete passage set, model/prompt,
and verifier policy.

**INFERENCE (medium):** at least two relevance stages exist: search ranking and
supporting-chunk reranking. No public evidence establishes lexical/vector
methods, a specific model, rank fusion, source-authority scoring, or how many
documents/chunks enter either stage.

### 2.2 What “single search” does and does not mean

It supports a bounded product distinction, not an exact call graph:

- it is not documented as an adaptive multi-query agent loop;
- there is no plan, generated-query list, iteration count, branch, progress,
  background task, or stop reason;
- it may still retrieve multiple results and multiple excerpts per source;
- supporting content may be fetched or extracted internally, but its cache/live
  status is not exposed;
- the citation/result mismatches in official examples leave open whether a
  hidden supporting pool differs from the returned result set or the examples
  are merely inconsistent [S2].

**RECOMMENDATION (high):** Curiosity must classify an Answer response as
`untrusted_generated_inference`. If used at all, its citations become discovery
leads to independently fetched evidence; the response must not enter the raw
retrieval ABI.

## 3. Request contract

### 3.1 Transport and authentication

**FACT (high):** the endpoint is synchronous JSON over `POST
https://api.you.com/v1/answer`, authenticated with `X-API-Key` [S2, S9]. Keys
are product-scoped; a missing scope can return 403 [S8, S9]. The official SDK
routes Answer to `api.you.com`, while Search and Contents use `ydc-index.io`
[S4].

There is no documented Answer streaming, asynchronous submission, status poll,
cancellation endpoint, idempotency key, request body schema version, or dated
API-version header.

### 3.2 Current body fields

| Field | Current documented contract | Important boundary |
| --- | --- | --- |
| `query` | required nonblank string, max 400 characters | Official SDK says Search operators such as `site:` and `OR` are unsupported [S4]; pricing says “same operators as Web Search” [S6], so operator behavior is contradictory. |
| `freshness` | `day`, `week`, `month`, `year`, or `YYYY-MM-DDtoYYYY-MM-DD` | If query language and parameter both express time, the broader window wins [S2]. Not a strict caller upper bound. |
| `country` | optional enumerated country code; 36 values in current reference | Geographic focus, not a documented hard source-origin filter. |
| `language` | optional enumerated BCP-47-style tag; 46 values in current reference | Controls web-result language; no separate answer-language parameter. |
| `include_domains` | strict allowlist, max 500 | Cannot combine with either exclude or boost. |
| `exclude_domains` | exclusion list, max 500 | Can combine with boost, not include. |
| `boost_domains` | ranking preference, max 500 | Can combine with exclude, not include; boost magnitude is unspecified. |

Sources: [S1, S2, S4]. Unknown or extra request fields are rejected [S1].

### 3.3 Deliberately absent caller controls

The current Answer schema exposes no:

- result count, offset/cursor, vertical selection, or mandatory news path;
- SafeSearch level;
- extraction mode, page-read count, crawl timeout, or cache-age control;
- model, model version, prompt/instructions, temperature, seed, reasoning
  effort, max output tokens, verbosity, response language, or structured schema;
- citation enable/disable, source-diversity quota, primary-source requirement,
  contradiction search, or minimum evidence threshold;
- deadline, per-call cost ceiling, idempotency key, client trace/frame/branch
  identifier, or callback.

**FACT (high):** launch prose said Answer accepted the same parameters as Web
Search and that full response parity would arrive “in the coming weeks” [S3].
Twelve days later, the current endpoint schema still exposes only the fields
above: it omits Search's count, pagination, SafeSearch, and extraction controls
[S2, S16]. The narrower current schema is the contract to rely on.

**RECOMMENDATION (high):** never derive product behavior from “same as Search.”
Maintain an Answer-specific adapter capability matrix and reject unsupported
neutral fields rather than silently dropping them.

## 4. Response contract

### 4.1 Normative shape

```text
AnswerResponse
  answer: string                   # Markdown, [[n]] references
  citations[]
    source: string                 # URL
    excerpts[]: string             # claimed verbatim support passages
  results
    web[]                          # all considered, per documentation
      url: string
      title: string
      snippets[]?: string
      page_age?: string
```

The endpoint reference marks `answer`, `citations`, `results`, `results.web`,
each citation `source`/`excerpts`, and result `url`/`title` as required [S2].
The official SDK is more defensive: it requires only `answer`, making
`citations`, `results`, `web`, and citation `excerpts` optional [S4].

**INFERENCE (high):** this is contract tension, not evidence that production
actually omits the arrays. A robust adapter should follow the normative schema
for conformance but tolerate absent optionalized SDK fields as a partial or
schema-drift outcome rather than crash or fabricate an empty evidence set.

### 4.2 Useful properties

1. **Inline-to-array indirection.** Human-readable Markdown can reference a
   separately typed source list.
2. **Verbatim excerpts.** A consumer can inspect the text said to support the
   answer without immediately fetching every page.
3. **Considered versus cited sets.** Uncited retrieved records can expose some
   selection/omission behavior.
4. **Minimal result records.** URL, title, snippets, and optional page age are
   easy to normalize.

### 4.3 Material omissions

No documented response field supplies:

- request/search UUID, server latency, created time, terminal status, usage,
  billed units, or cost;
- model, prompt, reranker, extractor, verifier, safety-policy, or schema version;
- input normalization, generated retrieval query, result rank/score, rank or
  source-selection reason, candidate count, or dropped-result reason;
- answer finish reason, answer language, token count, truncation, refusal,
  abstention, or output-safety label;
- claim objects, claim spans, citation-to-claim edges, entailment scores,
  unsupported claims, contradictions, or uncertainty;
- original, fetched, terminal, or canonical URL distinction;
- publisher identity/owner, source class, author, content license, canonical or
  duplicate cluster, or syndication relation;
- crawl/fetch/first-seen/last-seen time, HTTP outcome, extraction mode/version,
  page/capture/content hash, passage offsets/hash, or archive reference;
- index snapshot, coverage warning, freshness warning, policy-filter count,
  timeout/partial-shard/fetch failures, or omitted-result explanation;
- untrusted-content, prompt-injection, malware, PII, or source-safety markers.

**RECOMMENDATION (high):** preserve the response exactly as received in an
ephemeral provider trace only when contractually permitted, but normalize every
missing epistemic field as `unknown`, never as a favorable default.

## 5. Citations, excerpts, and evidence integrity

### 5.1 The vendor guarantee

**FACT (high that claimed):** You.com says every returned citation is checked
to exist in source text and support the answer, and that citation excerpts are
the verbatim passages the LLM used to construct it [S1, S3]. Pricing separately
says answers are generated only from retrieved passages [S6].

This promise appears to cover two checks:

1. **existence** — the excerpt can be found in source text; and
2. **support** — the excerpt supports the generated claim.

The contract does not expose verifier output, threshold, model, version,
failure count, or the exact claim checked. It also does not promise that every
material answer claim has a citation, that each citation supports every clause
in the sentence/paragraph carrying its marker, that contrary evidence was
considered, or that the source itself is true.

### 5.2 Official-example contradictions

These checks were performed against the complete examples published in the
current endpoint reference [S2]:

| Example | Published inconsistency | Consequence |
| --- | --- | --- |
| Aurora | citation 2 (`valofinland.com`) is absent from the three displayed `results.web` members | Cannot assume `citations.source` is a subset of returned considered-result URLs. |
| Federal funds | three citation sources (USA Today, NerdWallet, CBS) and three result sources (FRED, Trading Economics, FRED) do not overlap | “All results considered” cannot be audited from this example; a hidden evidence pool or stale example is possible. |
| FDA GLP-1 | answer references `[[1, 2, 3, 4, 5]]`, but three citation objects are displayed | Clients must range-check markers and handle unresolved references. |
| AI regulation | one excerpt mentions California TFAIA and New York RAISE, while the answer makes numerous dated federal/state claims | Citation presence does not establish claim-level support in the published artifact. |
| Local news | one citation contains four headlines, while the answer asserts additional stories/details | Multi-claim answer support is not independently inspectable from the displayed excerpt set. |

**FACT (high):** these are documentation inconsistencies.  
**UNKNOWN:** whether they reflect production behavior, example editing,
truncation, contract drift, or separate internal retrieval/evidence pools.  
**RECOMMENDATION (high):** a future authorized conformance pilot must reject or
flag an answer if a marker is out of range, an excerpt is empty, a cited URL
cannot be reconciled, or a material claim lacks passage support. Do not silently
repair vendor citations.

### 5.3 Evidence strength

**INFERENCE (high):** a verbatim excerpt is stronger than URL-only attribution
but weaker than provenance. The source may mutate; the excerpt may occur in a
different context; offsets and capture time are absent; a quotation can support
a claim without the publisher being authoritative or correct.

**RECOMMENDATION (high):** Curiosity's independent citation edge should be:

```text
claim_id -> capture_id -> passage_id/offsets/hash
         + support | contradict | unclear
         + verifier/policy version
         + publication claim, fetch observation, and source class
```

Retain a separately auditable considered-evidence manifest. A generated answer
must not be its own verifier or source of record.

## 6. Model behavior, controllability, and reproducibility

### 6.1 What is documented

- One query produces one synthesized Markdown answer [S1, S2].
- There are no effort tiers, and the endpoint is positioned as predictable in
  price and latency compared with Research [S1].
- The service, not the caller, chooses search strategy, page reads, prompts,
  model, chunking, reranking, and citation logic [S1, S3].
- Unknown input fields are rejected, preventing undocumented model knobs [S1].

### 6.2 What remains unknown

- base model/provider, model size, model and prompt versions, update cadence;
- whether one model or several perform selection, synthesis, and verification;
- context size, chunk size/overlap, reranking method, selected-source count;
- deterministic versus sampled decoding, repeated-call variance, caching;
- answer-length policy, citation allocation, style, language behavior;
- refusal and abstention policy, no-answer behavior, fallback models;
- treatment of conflicting sources, low-quality consensus, duplication, and
  source-owner diversity;
- truncation and partial-generation semantics;
- prompt-injection defenses and whether retrieved instructions can influence
  source selection or answer text.

**INFERENCE (high):** the endpoint is not reproducible. There is no seed,
snapshot, model/prompt digest, evidence capture, or request replay token.
Identical requests at different times may see a different index, pages,
pipeline, and model.

**RECOMMENDATION (high):** use generated Answer output only for low-authority
discovery or optional synthesis. Consequential Curiosity outputs need a pinned
owned evidence manifest and project-owned synthesis/verifier policy.

## 7. Freshness and confidence

### 7.1 Freshness

**FACT (high):** freshness filters are `day`, `week`, `month`, `year`, and a
custom date range. When the query contains a temporal keyword and the parameter
is also set, the broader timeframe is used [S2]. `page_age` is optional and is
described as the publication date or age supplied by the search result [S1,
S2].

**UNKNOWN:** date-range inclusivity, time zone, future dates, missing-date
handling, and whether filtering uses publication, modification, first-seen,
index, or fetch time. The response does not expose when a page was fetched or
whether supporting text came from a live fetch, cached extraction, or indexed
content.

**INFERENCE (high):** “real-time web results” means, at most, retrieval against
the provider's then-current system. It is not a per-source freshness guarantee.
The broadening rule also means an explicit caller `freshness` value is not
always a hard constraint.

**RECOMMENDATION (high):** Curiosity must keep query-derived temporal intent
separate from a hard caller time range. Return publisher-claimed dates and
observed fetch/index times as different fields with provenance and confidence.

### 7.2 Confidence and benchmark transfer

**FACT (high):** no answer-level confidence, calibrated probability, evidence
coverage score, citation-support score, or abstention status is documented
[S1, S2].

**FACT (high that claimed):** You.com reports 93.48% SimpleQA accuracy and 2.67
seconds p50 [S1, S3, S6]. No public Answer-specific method card was located.

**FACT (high):** SimpleQA contains 4,326 short fact-seeking questions designed
to have a single indisputable answer that does not change over time. Its
original authors estimated about 3% inherent dataset error and explicitly said
transfer to long answers with many facts remains open [S14].

**FACT (high):** You.com's public evaluation repository's latest visible commit
predates Answer's launch. It evaluates search providers by passing results to
GPT 5.4 nano and grading with GPT 5.4 mini, and reports 92.09% for
`you_search_with_livecrawl`; it contains no Answer sampler [S15].

**INFERENCE (high):** 93.48% is neither an individual-answer confidence value
nor evidence of citation completeness, freshness, multi-claim synthesis,
medical/legal/financial safety, or Curiosity workload performance.

## 8. Limits, latency, errors, pricing, and lifecycle

### 8.1 Hard and missing limits

Documented:

- query: nonblank, maximum 400 characters;
- each domain-control list: maximum 500;
- rate limits vary by subscription tier;
- rate-limit responses expose `X-RateLimit-Limit`, `Remaining`, `Reset`, and a
  429 may include `Retry-After` [S1, S2, S7].

Not publicly quantified for Answer:

- calls per second/minute/day by tier;
- returned result/citation/excerpt counts;
- answer, snippet, excerpt, response-body, or domain-string size;
- server deadline, queue timeout, maximum response time, or SLA;
- concurrency, region, uptime, recovery, or data-residency guarantee.

### 8.2 Latency tension

The guide calls 2.67 s a typical p50; the launch post scopes it to SimpleQA
[S1, S3]. The official SDK documentation warns that its inherited 5 s timeout
is “far too short” for Answer and that these endpoints routinely take tens of
seconds [S4].

**INFERENCE (high):** there is no contradiction if the benchmark distribution
has a 2.67 s median while broader real workloads have a long tail. But “a few
seconds” is not a dependable deadline. Curiosity would need its own timeout,
cancellation at the client boundary, and latency distribution measurement.

### 8.3 Error contract

The shared error guide lists 400, 401, 402, 403, 404, 422, 429, and 500, with
body examples alternating among `detail` and `error` [S8]. For Answer, the
official SDK has typed handlers for 401, 402, 403, 422, and 500; other 4xx/5xx
statuses fall into a generic error [S4]. The 402 Answer model can include
`error`, `message`, `upgrade_url`, `limit`, `used`, `period`, and `reset_at`
[S4]. Answer is not listed among keyless machine-payment challenge endpoints,
so its 402 should be treated as keyed-account credit failure, not an automatic
wallet challenge [S8].

Unknowns include exact status for blank/too-long queries and extra fields,
stable error envelope, billing on timeout/5xx, and whether retrying a completed
but disconnected POST can double bill. The SDK performs no retries by default;
when enabled, it can retry 429, 500, 502, 503, and 504 [S4].

**RECOMMENDATION (high):** normalize failures into stable internal classes,
retain redacted provider diagnostics, honor `Retry-After`, and do not
automatically retry a paid non-idempotent synthesis call without a reviewed
billing/idempotency policy.

### 8.4 Price on 2026-08-17

**FACT (high):** Answer costs **$5 per 1,000 calls** ($0.005/call). No separate
token, result, excerpt, or page-extraction fee is published for Answer. New
accounts are advertised with $100 credit; volume, annual, enterprise, custom
QPS, and ZDR terms are separate [S1, S6].

**UNKNOWN:** failed-call charging, taxes, credit expiry, cache/retry billing,
enterprise price/SLA, and maximum internal retrieval work behind one flat-price
call.

### 8.5 Lifecycle risk

Answer launched on 2026-08-05; official Python SDK support landed in v3.0.0 on
2026-08-06 [S3-S5]. Launch prose promised fuller Search-response parity later,
so this is a young, likely evolving contract. Terms allow features and capacity
to change [S12].

**RECOMMENDATION (high):** pin an adapter schema, run contract-drift checks,
tolerate optional fields, and gate additive fields before granting them trust or
authority.

## 9. Safety, privacy, security, and legal boundary

### 9.1 Content safety

**FACT (high):** Answer exposes no SafeSearch request parameter, refusal reason,
moderation result, source-risk label, or answer-safety field [S1, S2]. Web
Search separately exposes `off`, `moderate`, and `strict`, but that control
cannot be assumed available or fixed at an undocumented Answer default [S16].

**FACT (high):** the API AUP makes the integrator responsible for appropriate
input filtering, output moderation, and rate limiting. It prohibits bypassing
safety controls, prompt-injection/jailbreak/adversarial manipulation, malware,
spam, harmful content, discriminatory consequential uses, deceptive output,
and unauthorized professional advice [S13].

**FACT (high):** Terms warn that outputs can be inaccurate, incomplete,
incorrect, offensive, or misleading; they require independent confirmation and
special care for consequential decisions [S12].

**UNKNOWN / negative result:** no public Answer-specific prompt-injection
threat model, retrieval-text isolation guarantee, malware/source scanning
contract, jailbreak policy, PII/secret detector, citation poisoning defense, or
safety evaluation was found.

**RECOMMENDATION (high):** treat `answer`, `excerpts`, titles, snippets, and URLs
as untrusted external data. Render Markdown safely; strip active content; bound
all strings and arrays; keep retrieved text out of instruction channels; never
let it request tools, secrets, more budget, or policy changes; apply local output
policy before display.

### 9.2 Privacy and retention

**FACT (high):** ZDR is optional, enterprise-only, account-wide, and enabled by
You.com in an agreement—not a request toggle. It currently covers Web Search and
Answer. Under ZDR, request/response content is retained only for the short-term
processing window, not logged beyond that window, not used to train models, and
not sold downstream; You.com says queries do not go to Google or Bing [S10].

**FACT (high):** ZDR is not the default. The general Privacy Policy permits
collection of account, IP/device, usage, and fraud telemetry, names multiple
LLM providers (OpenAI, Anthropic, Google) among general service providers, and
advises against sensitive personal data [S11]. Terms also permit content use to
provide, maintain, train, improve, and develop services unless superseded by a
different agreement [S12]. These general statements do not prove which model
provider processes Answer traffic.

**UNKNOWN:** standard Answer query/response retention duration, standard
training use in practice, endpoint-specific subprocessors/model provider,
regional processing, backup deletion, telemetry fields, abuse-review access,
and whether cited third-party page content receives distinct retention
treatment.

**RECOMMENDATION (high):** absent written ZDR/DPA/MSA confirmation, treat every
question as third-party disclosure that may be retained and used under standard
terms. Do not submit secrets, credentials, private URLs, internal corpus text,
restricted personal data, tenant identifiers, or hidden user context. Verify
ZDR scope and activation in writing.

### 9.3 Terms and clean-room access limits

Public Terms prohibit discovering underlying models/algorithms/systems,
automated extraction outside permitted API access, bypassing controls,
vulnerability testing, and developing competing services [S12]. The API AUP
also prohibits unauthorized load testing, prompt-injection/jailbreak probing,
and storing significant API content for reuse without contractual authority
[S13]. A negotiated order may differ; this dossier is not legal advice.

This research therefore did not:

- call the endpoint, even with promotional credits;
- inspect private clients, consumer traffic, hidden endpoints, prompts, or
  models;
- run repeated-query inference, injection tests, citation audits, load tests,
  or provider comparisons;
- copy hosted outputs into fixtures or a corpus;
- infer proprietary algorithms beyond minimum public-behavior layers.

The official Python SDK is MIT-licensed [S17]. That license covers the SDK code,
not the hosted service, index, documentation, outputs, third-party pages,
trademarks, or private internals.

## 10. Bounded architecture inference

| Likely layer | Public evidence | Confidence and limit |
| --- | --- | --- |
| Auth, product scope, credit, rate validation | key, 401/402/403/429 contract [S4, S7-S9] | High that boundary exists; ordering unknown. |
| Query normalization and source controls | strict body, locale/freshness/domain fields [S1, S2] | High; defaults and normalization beyond enums unknown. |
| Index-backed candidate retrieval | single search, real-time web results, shared Search infrastructure [S1, S3] | High that retrieval exists; corpus/ranker/snapshot unknown. |
| Supporting-content acquisition | “pulls” relevant content; shared extraction infrastructure [S1] | High that content is obtained; live/cache/index path unknown. |
| Chunk selection/reranking | launch explicitly names chunking/reranking [S3] | High that claimed; method/counts unknown. |
| LLM synthesis | natural-language generated answer and LLM-used excerpts [S1-S3] | High; model/provider/prompt unknown. |
| Citation verification | existence/support promise [S1, S3] | High that claimed; exact verifier and completeness unknown. |
| Serializer/billing | typed JSON, flat per-call charge [S2, S6] | High; usage metadata and charge timing unknown. |

The minimum reconstruction is:

```text
validate/auth/admit
  -> normalize query + retrieval controls
  -> retrieve ranked web candidates from current provider state
  -> obtain/select supporting page text
  -> chunk and rerank support passages
  -> synthesize Markdown from selected passages
  -> verify candidate citations for text existence/support
  -> serialize answer, citation excerpts, and a web-result projection
  -> meter one call
```

**Caveat:** the official examples do not establish whether the returned
`results.web` projection is the exact superset from which citations are drawn.
No further hidden-pool inference is justified.

## 11. Clean-room lessons and Curiosity implications

### Adopted

1. **Separate considered and cited evidence.** Audit what generation could have
   used as well as what it chose to cite.
2. **Return citation excerpts.** URLs alone are poor verification ergonomics.
3. **Keep source controls typed.** Allow, deny, and prefer have distinct
   semantics.
4. **Reject unknown request controls.** Failing closed is preferable to silently
   ignoring caller policy.
5. **Expose a fast synthesis service class separately from research.** A
   single-pass answer and iterative research have different authority, cost,
   and coverage expectations.

### Adapted, not copied

1. Replace mutable URL + excerpt with capture and passage identity, offsets,
   hash, extractor version, and observed time.
2. Replace paragraph-level `[[n]]` syntax as the sole relation with typed
   claim-to-passage edges; render inline citations as a view.
3. Add `support`, `contradict`, and `unclear` stances plus verifier version and
   bounded score—not a binary vendor promise.
4. Add request/frame/branch/index/policy/model IDs, usage, cost, latency, and
   explicit stop/partial-failure reasons.
5. Keep hard temporal constraints separate from query-derived intent; never
   silently broaden an explicit window.
6. Make model, prompt policy, output schema/length, source class, diversity,
   and contradiction requirements caller-owned where synthesis is used.
7. Validate every citation marker and considered/cited join as untrusted input.

### Rejected

1. **Answer as raw retrieval.** It has already crossed the generation boundary.
2. **Vendor verifier as evidence authority.** Verification is opaque and the
   published examples are internally inconsistent.
3. **Aggregate benchmark as answer confidence.** SimpleQA does not calibrate a
   particular response or transfer to complex multi-claim work.
4. **“Real-time” as freshness proof.** No capture/fetch time exists.
5. **Flat price as a sufficient budget.** Internal work and tail latency are
   hidden; local call/time/cost admission remains necessary.
6. **Generated output as an owned corpus.** Provenance and contractual storage
   authority are insufficient.
7. **Retrieved text or answer text as agent instructions.** Both are untrusted.

### Deferred

1. Provider-adapter evaluation until terms/AUP, DPA/MSA, endpoint-specific ZDR,
   storage, and permitted evaluation purposes are reviewed.
2. Live quality, citation-support, freshness, latency-tail, cost, and failure
   testing until a fixed authorized corpus, credentials, budget, and protocol
   exist.
3. SDK adoption. Its resilience and error types are useful evidence, but a
   transport library must not define Curiosity's neutral domain model.
4. Any use for legal, medical, financial, personal, or other consequential
   outputs until domain-specific policy and human verification are approved.

### Provider-neutral answer shape

```text
SynthesisRequest
  frame_id, branch_id, question
  hard_time_range, source_allow/deny/prefer, source_classes
  max_candidates, max_captures, max_context_tokens
  deadline, max_cost, output_schema, synthesis_policy_version

GeneratedAnswer
  answer_id, text_or_object
  model/prompt/policy versions
  considered_evidence_ids[]
  claim_records[]
    claim_id, answer_span, confidence_state
    citation_edges[]
      capture_id, passage_id, offsets, hash
      stance, verification_state, verifier_version
  unsupported_claims[], contradictions[], unresolved_questions[]
  usage, cost, latency, stop_reason, partial_failures[]
  trust = untrusted_generated_inference
```

## 12. Fact / inference / recommendation ledger

| ID | Type | Claim | Confidence | Origin/check | Verdict |
| --- | --- | --- | --- | --- | --- |
| L1 | FACT | Answer is a synchronous single-search retrieval-plus-synthesis endpoint. | High | S1-S3 | **REJECTED** as retrieval ABI. |
| L2 | FACT | Request controls are query, freshness, locale, and domain lists only. | High | S1, S2, S4 | **ADAPTED** capability matrix. |
| L3 | FACT | Query is nonblank, max 400 characters. | High | S1, S4 | **ADOPTED** bounded-input principle. |
| L4 | FACT | Operator support conflicts: SDK says unsupported; pricing says same Search operators. | High | S4 versus S6 | **DEFERRED/avoid operators**. |
| L5 | FACT | Answer returns Markdown, citation URLs/excerpts, and a considered web-result projection. | High | S1, S2 | **ADAPTED** evidence shape. |
| L6 | FACT | Endpoint reference requires evidence arrays; SDK tolerates them as optional. | High | S2, S4 | **ADAPTED** partial/schema-drift handling. |
| L7 | FACT | You.com claims citation existence/support verification. | High that claimed | S1, S3 | **REJECTED** as independent proof. |
| L8 | FACT | Official examples contain marker, citation/result-set, and support inconsistencies. | High | Direct S2 comparison | **ADOPTED** validation requirement. |
| L9 | INFERENCE | Citation and result candidate pools cannot be assumed identical. | Medium | L8; alternative is stale/abridged docs | **UNKNOWN; do not join blindly**. |
| L10 | FACT | No capture/passage identity, model version, confidence, usage, coverage, or partial-failure fields exist. | High | S2 schema negative check | **REJECTED** as provenance. |
| L11 | FACT | Freshness may broaden an explicit parameter from query language. | High | S2 | **REJECTED** hard-bound behavior. |
| L12 | FACT | 93.48%/2.67 s are vendor SimpleQA claims without an Answer method card found here. | High that claimed; low transfer | S1, S3, S14, S15 | **CONTEXT only**. |
| L13 | FACT | SDK warns a 5 s timeout is too short despite 2.67 s benchmark p50. | High | S4 versus S1/S3 | **ADOPTED** tail-latency caution. |
| L14 | FACT | Answer costs $5/1k calls; tier rate quantities are not public. | High | S6, S7 | **ADAPTED** local admission/metering. |
| L15 | FACT | Answer has no caller SafeSearch/moderation field; AUP assigns moderation duties to integrators. | High | S2, S13, contrast S16 | **ADOPTED** local safety gate. |
| L16 | FACT | Enterprise account-level ZDR covers Answer; default retention/training details remain unclear. | High | S10-S12 | **DEFERRED** privacy gate. |
| L17 | INFERENCE | At least retrieval ranking, passage reranking, synthesis, and verification stages exist. | Medium-high | S1, S3 | **ADAPTED** stage separation only. |
| L18 | RECOMMENDATION | Treat Answer as untrusted optional synthesis and independently fetch/anchor primary evidence. | High | L1-L17 | **ADOPTED**. |
| L19 | RECOMMENDATION | Do not use You.com Answer as Curiosity's evidence authority or owned foundation. | High | Opaque pipeline, provenance and contract gaps | **REJECTED foundation**. |
| L20 | RECOMMENDATION | Evaluate an adapter only under explicit legal/privacy/test authority. | High | S10-S13 and no live evidence | **DEFERRED**. |

## 13. Unknowns, validation checks, and negative results

### 13.1 Blocking unknowns

1. Exact model/provider/version, prompts, decoding, update/change policy.
2. Candidate and selected-document counts; ranking/reranking/source-quality,
   diversity, deduplication, and contradiction behavior.
3. Whether cited sources must belong to `results.web`, and why official examples
   violate that expected relation.
4. Citation verifier design, claim segmentation, support threshold, precision,
   recall, completeness, and failure handling.
5. Live versus cached/indexed supporting content; crawl/fetch timestamps and
   cache policy.
6. SafeSearch default, prompt-injection defenses, source sanitization,
   refusal/moderation policy, and safety evaluation.
7. Standard retention/training/subprocessor/data-region behavior for Answer.
8. Rate tiers, result/citation/response limits, server deadline, SLA, and tail
   latency.
9. Idempotency, retry and timeout billing, failed-call charges, cancellation.
10. Operator support, exact freshness date semantics, and output-language rules.
11. No-answer/empty-result, contradiction, paywall, blocked fetch, and partial
    failure behavior.
12. Empirical accuracy, citation support/completeness, source diversity,
    freshness, reproducibility, and cost on Curiosity tasks.

### 13.2 Checks for any future authorized pilot

1. Range-check every inline marker and verify its exact grammar/Unicode span.
2. Compare cited URL set, considered URL set, redirect-terminal URLs, and
   canonical clusters.
3. Fetch cited pages under permitted access; freeze captures and verify excerpt
   existence, context, and claim-level support.
4. Score material uncited claims and contradictory evidence, not citation count.
5. Separate publisher publication date, page change, provider index age, and
   observed fetch time.
6. Repeat fixed questions to measure source/answer variance; never call that
   confidence without calibration.
7. Exercise empty, malformed, blocked, low-evidence, conflicting, and timeout
   paths under a reviewed safe test plan.
8. Measure p50/p95/p99 and client timeout behavior, not vendor p50 alone.
9. Confirm 4xx/5xx envelopes, rate headers, retries, idempotency, and billing.
10. Verify ZDR activation, retention, processors, region, and allowed storage in
    writing before sending real data.

### 13.3 Negative results retained

- No Answer-specific public OpenAPI artifact with a stable version/date or
  changelog was found beyond the generated current reference.
- No model ID, model card, prompt version, seed, or deterministic replay
  contract was found.
- No public Answer-specific benchmark method card, raw outputs, error bars,
  abstention rate, or independent reproduction of 93.48% was found.
- The public You.com eval repository does not contain an Answer sampler and
  predates its launch.
- No answer-level confidence/calibration, citation score, contradiction,
  coverage, or abstention field was found.
- No capture ID, fetch time, page hash, passage offsets, index snapshot, or
  immutable evidence record was found.
- No Answer SafeSearch control or Answer-specific prompt-injection/security
  mapping was found.
- No standard Answer retention duration or endpoint-specific LLM provider was
  found.
- No public Answer QPS table, SLA, max response size, citation count, or server
  deadline was found.
- No live behavior was tested; official examples must not be represented as API
  observations.

## 14. Bounded curiosity pass and stop

Scores are 1 (low/cheap) to 5 (high/expensive). Follow-up authority was limited
to public, no-call, in-frame research.

| Thread | Relevance | Value | Novelty | Cost | Outcome |
| --- | ---: | ---: | ---: | ---: | --- |
| Reconcile citation verifier promise with official examples | 5 | 5 | 5 | 1 | **Pursued:** found unresolved markers, cited/result-set mismatch, and weak claim/excerpt alignment in S2; retained as documentation contradiction. |
| Bound 93.48% benchmark transfer | 5 | 5 | 4 | 1 | **Pursued:** SimpleQA origin limits transfer; official eval repo predates Answer and does not reproduce the number [S14, S15]. |
| Reconcile 2.67 s p50 with operational timeout advice | 4 | 5 | 4 | 1 | **Pursued:** official SDK says 5 s is too short and Answer can take tens of seconds [S4]. |
| Check operator and Search-parity claims | 5 | 4 | 4 | 1 | **Pursued:** current SDK says no operators; pricing says same operators; current endpoint omits material Search fields [S2, S4, S6]. |
| Determine hidden citation candidate pool via calls | 5 | 5 | 5 | 5 | `CURIOSITY_NO_GO`: credentials/calls prohibited; examples do not justify proprietary inference. |
| Test citation entailment and freshness | 5 | 5 | 4 | 5 | `CURIOSITY_NO_GO`: requires paid authorized fixtures, output retention rights, and a reviewed protocol. |
| Probe prompt injection/refusals | 4 | 5 | 4 | 5 | `CURIOSITY_NO_GO`: AUP prohibits adversarial manipulation and caller did not authorize safety testing. |
| Infer ranker, prompts, or model through repetition | 2 | 2 | 4 | 5 | `CURIOSITY_NO_GO`: terms/clean-room boundary, weak identifiability, no decision need. |
| Negotiate ZDR/MSA/SLA | 4 | 4 | 2 | 5 | `CURIOSITY_NO_GO`: procurement/legal authority and deployment data classes absent. |
| Compare Answer against other providers | 2 | 3 | 2 | 5 | `CURIOSITY_NO_GO`: caller constrained scope to You.com Answer only. |

**Coverage:** answer contract, retrieval/synthesis boundary, citations/evidence,
model behavior, freshness/confidence, limits/errors/pricing, safety/privacy,
architecture inference, clean-room lessons, Curiosity implications, source
confidence, unknowns, checks, and negative results are covered.

**Saturation:** current guide, endpoint reference, launch post, SDK, pricing,
operations, privacy/legal sources, SimpleQA origin, and official evaluation
repository now triangulate all material public claims. Remaining gaps require
live access, vendor disclosure, procurement, or prohibited reverse engineering.

**Stop:** coverage and source saturation reached.

## 15. Primary bibliography and confidence

All sources were accessed 2026-08-17. Sources are You.com first-party materials
except SimpleQA's original OpenAI source, which is primary to that benchmark.

1. **[S1] You.com, Answer API Overview.**  
   https://you.com/docs/guides/answer.md  
   Pipeline, product boundary, parameters, citation promise, output, benchmark,
   price, ZDR, and best practices. **High for current documented behavior; low
   for unverified quality claims.**
2. **[S2] You.com, `POST /v1/answer` API reference.**  
   https://you.com/docs/api-reference/answer/v1-answer.md  
   Current request/response schema and complete published examples. **High for
   current schema; examples are documentation, not observations.**
3. **[S3] You.com, “Introducing the You.com Answer API,” 2026-08-05.**  
   https://you.com/resources/introducing-the-ydc-answer-api  
   Launch date, single-search positioning, chunking/reranking/verification,
   benchmark/latency, product family, and parity roadmap. **High that claimed;
   medium for current contract where launch prose differs from S2.**
4. **[S4] You.com official Python SDK 3.1.1 documentation and source.**  
   https://github.com/youdotcom-oss/youdotcom-python-sdk  
   https://github.com/youdotcom-oss/youdotcom-python-sdk/blob/main/docs/sdks/answer/README.md  
   https://github.com/youdotcom-oss/youdotcom-python-sdk/blob/main/src/youdotcom/models/answerrequestbody.py  
   https://github.com/youdotcom-oss/youdotcom-python-sdk/blob/main/src/youdotcom/models/answerresponse.py  
   Host, strict request notes, operator prohibition, tolerant response models,
   errors, retries, timeout advice, and debug warning. **High for published SDK
   behavior; not proof of server internals.**
5. **[S5] You.com Python SDK changelog.**  
   https://github.com/youdotcom-oss/youdotcom-python-sdk/blob/main/CHANGELOG.md  
   Answer support in v3.0.0, dated 2026-08-06, and lifecycle. **High.**
6. **[S6] You.com API Pricing.**  
   https://you.com/pricing  
   $5/1k calls, included features, credits, enterprise/ZDR/custom-QPS claims,
   operator wording. **High for dated public list price; time-sensitive.**
7. **[S7] You.com, Rate Limits.**  
   https://you.com/docs/using-the-api/rate-limits.md  
   Tier-dependent limits, headers, 429, `Retry-After`, backoff. **High; tier
   quantities remain undisclosed.**
8. **[S8] You.com, Errors.**  
   https://you.com/docs/using-the-api/error-code-reference.md  
   Shared status meanings, body examples, credit versus machine-payment 402,
   and endpoint list. **High for documented classes; endpoint envelopes vary.**
9. **[S9] You.com, Authentication.**  
   https://you.com/docs/using-the-api/authentication.md  
   `X-API-Key`, product scopes, key handling, 403. **High.**
10. **[S10] You.com, Zero Data Retention.**  
    https://you.com/docs/administration/zero-data-retention.md  
    Answer coverage, enterprise/account-wide enablement, retention/training/
    downstream assertions, no Google/Bing query forwarding. **High that policy
    states this; contractual confirmation still required.**
11. **[S11] You.com Privacy Policy, page dated 2024-12-10.**  
    https://you.com/legal/privacy  
    General collection, telemetry, service providers, international processing,
    and sensitive-data warning. **Medium for Answer-specific inference because
    the policy is service-wide and old relative to Answer.**
12. **[S12] You.com Terms & Conditions, page dated 2024-08-27.**  
    https://you.com/legal/terms  
    Output disclaimers, content use, prohibited reverse engineering/testing,
    third-party content, service modification, and supplemental terms. **Medium
    for a future API account because an order/MSA may supersede it.**
13. **[S13] You.com API Acceptable Use Policy, effective 2026-05-15.**  
    https://you.com/acceptable-use-policy-may-2026  
    Integrator safeguards, output moderation, API misuse, injection/jailbreak,
    load testing, harmful/deceptive uses, and storage limits. **High for public
    API policy; legal interpretation deferred.**
14. **[S14] OpenAI, “Introducing SimpleQA,” 2024-10-30.**  
    https://openai.com/index/introducing-simpleqa/  
    Benchmark scope, 4,326 questions, timeless/single-answer construction,
    grading, ~3% estimated error, and transfer limitation. **High as benchmark
    origin.**
15. **[S15] You.com official `web-search-api-evals` repository, latest visible
    commit `32db6bb` dated 2026-05-18.**  
    https://github.com/youdotcom-oss/web-search-api-evals  
    Search-plus-external-LLM methodology, model/judge identities, 92.09% Search
    result, and absence of an Answer sampler before launch. **High for repository
    contents; not Answer performance evidence.**
16. **[S16] You.com, Web Search API Overview.**  
    https://you.com/docs/guides/search.md  
    Contrast source for Search-only count, SafeSearch, pagination, extraction,
    and freshness behavior. **High for boundary comparison.**
17. **[S17] You.com official Python SDK MIT license.**  
    https://github.com/youdotcom-oss/youdotcom-python-sdk/blob/main/LICENSE  
    SDK license boundary only. **High.**
