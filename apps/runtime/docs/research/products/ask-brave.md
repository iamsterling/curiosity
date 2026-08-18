# Ask Brave: clean-room standalone consumer-product dossier

**Primary-source access date:** 2026-08-17  
**Product boundary:** the user-facing **Ask Brave** surface at
`search.brave.com/ask` and its integration into Brave Search. AI Answers,
Brave Leo, Search API, LLM Context, and API Answers are adjacent products, not
this product's contract.  
**Status of this study:** public-documentation and passive public-page research
only. No account, credentials, query submission, paid feature, UI automation,
traffic inspection, private endpoint, source-code inspection, benchmark run,
implementation, or production access was used.

## Executive decision

Ask Brave is a **free consumer search-and-chat surface** that joins three
interaction forms in one place:

```text
ordinary search / SERP
       <-> grounded answer with source references and search enrichments
       <-> stateful follow-up conversation or explicit Deep Research
```

It launched on 2025-09-29, remains linked as a first-class Brave product, and
its public `/ask` page was reachable on the access date. It is available from
the Brave Search home page, an Ask tab on the results page, a double-question-
mark shortcut from a default-search address bar, and its own `/ask` route. The
current unauthenticated page also exposes **New conversation**, Search vertical
navigation, and image attachment for GIF, JPEG/JPG, PNG, and WebP [S1, S2].

**Overall verdict: ADAPT the surface, REJECT it as an evidence or execution
authority (high confidence).** Its strongest product lesson is not merely
“chat with search.” It preserves reversible movement between a familiar SERP,
an explanatory answer, cited webpages, and typed actionable enrichments such as
videos, news, products, businesses, and shopping. It also separates ordinary
answers from an explicitly slower Deep Research path and shows research steps
and blind spots [S1, S3].

The public consumer contract is much weaker than the experience. Brave does not
publish Ask Brave's exact models, request/event schema, source-selection rules,
citation object, claim-entailment guarantees, per-run budgets, quota, stop
criterion, freshness metadata, failure states, safety evaluation, or service
level. The answer and research planner remain provider-controlled. A URL
citation helps inspection but does not preserve a document capture, passage,
retrieval time, contradiction, or reproducible evidence trace.

For Curiosity:

- **ADOPT** reversible search/chat navigation, explicit fast-versus-research
  intent, source-adjacent enrichments, visible progress, and ephemeral-by-
  default conversational state.
- **ADAPT** follow-ups into caller-authorized branches; citations into immutable
  claim-to-passage evidence; and blind spots into one scored, bounded curiosity
  pass.
- **REJECT** automatic “resolution” as hidden authority, grounding as a truth
  guarantee, provider-held conversation state as the durable record, and an
  opaque answer as evidence.
- **DEFER** empirical quality, citation, latency, quota, and safety judgments
  until a separately authorized, terms-reviewed, fixed-budget consumer test.

## 1. Decision frame and bounded questions

**Decision:** which documented Ask Brave product patterns should shape
Curiosity's owned research experience without treating Brave's hidden planner,
index, models, conversations, or generated answers as Curiosity infrastructure?

Bounded sub-questions:

1. What product exists now, and where are its boundaries from AI Answers, Leo,
   and API products?
2. How does a user move among query, SERP, answer, follow-up chat, and Deep
   Research?
3. What can be established about retrieval, planning, citations, enrichments,
   state, and stopping?
4. What freshness, safety, privacy, persistence, sharing, and locality claims
   actually apply to the consumer surface?
5. What limits and economics are user-visible, and what remains hidden?
6. What minimum architecture follows from public behavior without reconstructing
   proprietary internals?
7. Which clean-room lessons transfer to Curiosity?

### 1.1 Evidence rules

- **FACT** — directly stated or visibly exposed by a cited first-party source.
  Scale, benchmark, quality, and privacy statements are facts that Brave made
  the claim, not independent verification.
- **INFERENCE** — the narrowest product or architecture interpretation
  consistent with facts; not an implementation claim.
- **RECOMMENDATION** — a proposed Curiosity decision.
- **UNKNOWN / NEGATIVE RESULT** — not documented, contradictory, or unsafe to
  transfer from an adjacent product.
- Confidence is **high**, **medium**, or **low**.

All cited sources are first-party Brave sources accessed 2026-08-17. The launch
post, current Search/AI/help/policy pages, and the passive unauthenticated Ask
landing page were the principal evidence. The API grounding post is used only
where Brave itself says that technology underlies Ask Brave. No API field,
price, hard limit, or statelessness behavior is imported into the consumer
contract [S1, S9].

**Stop rules:** coverage was reached when every requested category had a
sourced fact, bounded inference, or explicit unknown. Saturation was reached
when additional official pages repeated the launch/help claims or described AI
Answers, Search API, or Leo rather than Ask Brave.

## 2. Current status, lineage, and strict product boundaries

### 2.1 Status timeline

| Date / current evidence | First-party fact | Correct scope |
| --- | --- | --- |
| 2023-03 | Brave launched Summarizer, the consumer answer lineage [S1]. | Historical predecessor, not Ask Brave chat. |
| 2024-04 | Answer with AI replaced/expanded that answer experience; it was designed as a short grounded answer beside ordinary results [S4]. | Now called **AI Answers**. Its historical statelessness does not describe Ask Brave. |
| 2025-08-05 / 09-01 | Brave announced API AI Grounding and said its Research mode would soon power consumer research; it documented single-search versus iterative multi-search at the shared-technology level [S9]. | Architecture clue only, not the consumer wire, limit, or billing contract. |
| 2025-09-25 | Brave Help says all follow-up questions were moved to Ask Brave [S6]. | Strong cutover evidence for consumer follow-up ownership. |
| 2025-09-29 | Ask Brave launched as a free interface combining search and AI chat, in addition to AI Answers [S1]. | Product launch and canonical positioning. |
| 2026-08-17 | `/ask`, the Brave Search product page, AI Help, sharing help, privacy notice, and usage-metrics help all still present Ask Brave [S2, S3, S5-S7, S15]. | High confidence that it remains a current supported surface; no deprecation evidence found. |

**FACT (high):** Brave says AI Answers remains the quick-summary feature while
Ask Brave provides longer answers, follow-ups, chat, Deep Research, and richer
contextual elements [S1, S3].

**FACT (high):** Ask Brave is free and available in any browser or platform;
the dedicated page is not Brave-browser-only [S1, S2].

**FACT (high):** the current Ask landing page describes itself as “AI-powered
answers. No AI profiling,” provides a New conversation action, and accepts
listed image formats [S2]. This proves public affordances, not successful image
analysis, file-size limits, retention differences, or multimodal model behavior.

**INFERENCE (high):** Ask Brave is current, but its documentation has naming
drift. The privacy notice describes a concise cited summary and calls it Ask
Brave, while current AI Help reserves that description for AI Answers. Search
settings still label the automatic-answer toggle “Answer with AI” [S3, S5,
S16]. Use the launch/help feature boundary, not any isolated legacy label.

### 2.2 What Ask Brave is not

| Surface | Public role | Boundary that must be preserved |
| --- | --- | --- |
| **AI Answers** | Concise summary automatically or manually shown with search results and references [S3, S16]. | Not the long-form chat/research product. Its triggering and adult-content language cannot automatically be assigned to Ask Brave. |
| **Ask Brave** | Human-facing search/chat product with follow-ups, Deep Research, citations, and result enrichments [S1-S3]. | No public developer endpoint or stable machine contract. |
| **Brave Leo** | Browser-integrated assistant. The grounding announcement named it as another future consumer of Research technology [S9]. | Browser assistant context, models, plans, and permissions do not describe Ask Brave. |
| **Search API / LLM Context** | Paid developer retrieval/context services. | Their query fields, response schemas, prices, rate limits, retention, and terms are separate. |
| **API Answers** | Paid, OpenAI-shaped hosted answer resource described in its own docs [S17]. | Shared service lineage does not make its one-message contract, stream tags, ceilings, or billing the Ask Brave contract. |

**RECOMMENDATION (high):** maintain distinct Curiosity research records and
adapter concepts: `consumer_search_chat`, `consumer_quick_answer`,
`browser_assistant`, `retrieval_api`, and `hosted_answer_api` are different
authority and provenance classes even when a provider shares internals.

## 3. Entry, query resolution, and search/chat integration

### 3.1 Entry paths and reversibility

Brave documents four routes [S1]:

1. select **Ask** beside Search on the Brave Search home page;
2. select the **Ask** tab from an existing SERP, expanding a normal search into
   chat search;
3. append `??` when Brave Search is the browser's default search engine; or
4. open `https://search.brave.com/ask` directly.

The current Ask page also retains navigation to All, Images, News, Videos, Maps,
and Goggles [S2].

**INFERENCE (high):** this is a reversible **mode continuum**, not a chatbot
island. The same information need can begin as a navigational query, become a
SERP, escalate to synthesis, and continue in chat while source-oriented verticals
remain one click away.

**RECOMMENDATION (high):** Curiosity should preserve that reversibility. A user
must be able to move from synthesized prose back to candidate results, selected
evidence, media/commerce/local facets, and the exact branch that produced a
claim. “Ask” must not erase “Search.”

### 3.2 Resolution and output form

**FACT (high):** Brave says users may enter simple queries or nuanced questions;
Ask Brave determines the “level of resolution” and returns both an answer and
contextual follow-up actions [S1].

**FACT (high):** documented enrichments include webpages, videos, news articles,
products, businesses, and shopping, placed in context rather than offered only
as undifferentiated links [S1, S3, S15].

**INFERENCE (medium):** “level of resolution” implies an intent/complexity
router that chooses answer depth and presentation components. It may also help
control cost, but no source states the features, thresholds, or whether it
automatically invokes Deep Research. The launch post tells users they “may want
to run” Deep Research, which is more consistent with an explicit slower mode
than silent escalation [S1].

**INFERENCE (high):** enrichments require typed retrieval/rendering lanes beyond
one prose generator: at minimum Web documents plus media, news, commerce, or
local entities are selected and placed around the answer. This does not prove
that every lane is retrieved from Brave's general index or that every provider
is owned by Brave.

**UNKNOWN:** whether search operators, region/freshness filters, Goggles, Rerank,
anonymous local settings, or Google fallback are honored identically inside Ask
Brave. They are documented for Search, not for the Ask planner [S12, S14, S16].

## 4. Standard answer and Deep Research flow

### 4.1 Defensible public flow

```text
user text and possibly an image
  -> intent / resolution decision
  -> current Brave Search retrieval
  -> source and enrichment selection
  -> grounded answer with source references
  -> optional follow-up, preserving conversation context

explicit Deep Research path
  -> iterative query generation
  -> multiple rounds of Brave Search
  -> analyze many result pages
  -> expose research steps and blind spots
  -> synthesize a longer source-referenced answer
```

The first path is supported by the launch/help/product pages; the second is
supported by the Ask launch and the grounding announcement [S1-S3, S9, S15].

**FACT (high):** Brave says Ask answers are always grounded in information found
on the Web and constrained to search results relevant to the question [S1].

**FACT (high, claim scope):** for Deep Research, Brave says the system uses
multiple rounds of search, iteratively covers blind spots, issues dozens of
queries, analyzes thousands of pages, and exposes “transparent research steps”
[S1]. These are provider descriptions, not a per-run minimum or independently
observed trace.

**FACT (high):** the shared grounding description distinguishes a fast single
search from sequential multi-search in which an LLM refines its understanding
and issues further searches; it says multi-search increases context, compute,
and latency into minutes [S9].

**INFERENCE (medium):** Ask Deep Research likely alternates:

```text
plan/decompose -> search -> select/read -> assess coverage/blind spots
               -> repeat while useful and permitted -> synthesize
```

This is the minimum loop consistent with the published description. It does not
establish private prompts, model count, page-fetch mechanism, parallelism,
reasoning visibility, or exact stop policy.

### 4.2 Planning authority and stopping

**FACT (high):** no current consumer source found publishes a query cap,
iteration cap, result cap, context cap, token cap, wall-time cap, cancellation
semantics, or stop reason for Ask Brave.

**INFERENCE (high):** the provider controls decomposition, query reformulation,
URL selection, and sufficiency. Showing steps makes work legible but does not
give the user branch-level authorization or prove the display is a complete
execution trace.

**RECOMMENDATION (high):** Curiosity should not copy “iteratively cover blind
spots” as an open-ended mandate. Every branch needs a declared purpose, parent,
allowed sources/actions, query/read/time/token/cost budgets, and stop reason.
After synthesis, only one caller-authorized curiosity pass may score remaining
gaps by relevance, value, novelty, and cost.

## 5. Citations, sources, confidence, and contradictions

### 5.1 What Brave promises

**FACT (medium, naming caveat):** current Brave materials collectively portray
the consumer experience as source-referenced: AI Help says AI Answers references
key claims and treats provenance/transparency as crucial; Ask Brave is described
as Web-grounded and places webpages and other source enrichments beside answers;
and the privacy notice calls its cited consumer summary “Ask Brave.” The last
page conflicts with the current feature-name boundary, so it supports the
presence of references but not a precise Ask citation contract [S1, S3, S5,
S15].

**FACT (high):** Brave explicitly warns in its answer-engine engineering
discussion that **grounded does not mean true**. An answer reflects search-result
quality and may need to represent multiple perspectives; critical facts still
need checking [S4].

**INFERENCE (high):** Ask Brave offers **inspectability**, not reproducibility.
The public consumer documentation does not define a citation schema, immutable
capture, quoted passage, source offsets, retrieval/publish timestamps, canonical
URL, query/rank lineage, entailment score, or coverage guarantee.

**UNKNOWN:** whether every material claim is cited; whether citations are
assigned during generation or afterward; whether an adjacent citation entails
the precise claim; whether the displayed snippet is the model's evidence; and
how removed, changed, paywalled, duplicated, syndicated, or contradictory pages
are handled.

### 5.2 Confidence and quality claims

**FACT (high):** Ask Brave exposes no documented answer-level confidence,
calibration, abstention, contradiction, or evidence-coverage field.

**FACT (high, vendor-claim scope):** the launch post cites 94.9% SimpleQA
accuracy for the underlying Deep Research technology. The originating grounding
post identifies this as `Accuracy Given Attempted`, separately reports 94.1% F1
and 93.25% accuracy, and discusses contamination filtering, ambiguous labels,
human re-review, metric choice, and run variance [S1, S9].

**INFERENCE (high):** the headline cannot be treated as Ask Brave's general
accuracy. SimpleQA concerns short, single, timeless facts; it does not establish
multi-claim report completeness, citation entailment, current-event freshness,
conversation consistency, safety, or individual-answer confidence. The launch
post's use of the highest metric further requires the originating caveat.

**RECOMMENDATION (high):** Curiosity should treat an Ask Brave answer as
untrusted external synthesis and its citations as discovery leads. Durable
claims require independently fetched, permitted primary evidence with capture,
passage, time, hash, and support/contradiction edges.

## 6. Follow-ups, conversation state, images, and sharing

### 6.1 Follow-up semantics

**FACT (high):** Ask Brave supports chat-style follow-up queries, and Brave Help
says all consumer follow-ups have been handled by Ask Brave since 2025-09-25
[S1, S6].

**FACT (high):** the current page offers **New conversation** and an image-add
control with accepted file extensions [S2].

**INFERENCE (high):** follow-ups use prior-turn context because Brave says state
is maintained and stored for the conversation's duration [S5, S6]. This is
session continuity, not evidence that each answer is reproducible or that every
turn performs fresh retrieval.

**UNKNOWN:** context-window length; truncation/summarization behavior; whether
citations and source selections carry forward; whether pronouns resolve against
prior answer text or evidence; whether each follow-up searches; branching/edit
semantics; image size/count limits; image-derived data retention; and whether a
new conversation cryptographically or merely logically separates state.

### 6.2 Persistence and sharing

**FACT (high):** Brave says conversation state is stored on its AWS servers in
the United States, encrypted, and automatically erased after **24 hours of
inactivity**; the encryption key is stored locally on the user's device. Brave
says it does not retain IP addresses [S5, S6].

**FACT (high):** when a user deliberately makes a conversation public, Brave
says it may store that conversation for up to **7 days** [S5, S6].

**INFERENCE (high):** this design favors ephemeral device-bound continuity over
an account-based durable history. No source found documents cross-device sync,
account recovery, export, deletion controls, forks, or a persistent conversation
library.

**CAUTION (high):** “encrypted” plus “key stored locally” must not be expanded
into an end-to-end-encryption claim. Brave must process the request on its
servers and does not publish the protocol, key lifecycle, at-rest/in-transit
boundaries, server plaintext exposure, backup behavior, or independent audit.

**RECOMMENDATION (high):** Curiosity should preserve the privacy pattern—short
idle expiry, local state handles, explicit sharing, separate public retention—
but make encryption and deletion semantics precise. Durable research artifacts
should be user-owned exports with evidence manifests, not silent server history.

## 7. Freshness, index boundary, and source diversity

**FACT (high, vendor-claim scope):** Brave says Ask Brave uses Web information
and was launched over Brave's independent index of more than 35 billion pages.
The broader Search product says results are served solely from its index [S1,
S5].

**FACT (high):** ordinary Brave Search exposes a result-recency filter [S12]. No
Ask Brave source found documents an answer-specific date range, freshness mode,
retrieval timestamp, index snapshot, or citation date.

**INFERENCE (high):** Web grounding can improve recency relative to model-only
knowledge, but “found on the Web” is not a freshness guarantee. A current query
can retrieve an old page; a citation URL can change after generation; and a
consumer cannot audit the indexed/fetched version from the published surface.

**BOUNDARY / UNKNOWN:** Brave offers optional browser-side Google fallback for
some ordinary searches when opted in [S14]. No primary source found says Ask
Brave or Deep Research uses those mixed results. The privacy notice's “solely
from this index” language and the launch's Brave-index description counsel
against assuming fallback participation, but they do not publish an Ask-specific
source manifest [S1, S5].

**UNKNOWN:** recrawl age, live-fetch behavior, source diversity constraints,
publisher/owner deduplication, primary-source preference, regional coverage,
paywall handling, rich-provider participation, and the treatment of retracted or
updated pages.

**RECOMMENDATION (high):** Curiosity must represent `published_at`,
`retrieved_at`, `captured_at`, canonical identity, content hash, and freshness
requirement separately. It should expose source-owner clusters and unresolved
freshness gaps rather than infer freshness from query time.

## 8. Safety, integrity, and privacy

### 8.1 Content safety and untrusted retrieval

**FACT (high):** Brave Search has Off, Moderate (default), and Strict Safe Search
settings. Its help page says the older “Answer with AI” is disabled for adult
content under Off and Moderate, and adult classification uses third-party lists
and machine-learning models [S10].

**BOUNDARY (high):** that page does not specify Ask Brave or Deep Research
behavior. It is unsafe to claim the same trigger/refusal policy applies to chat,
images, follow-ups, or generated enrichments.

**FACT (high):** general consumer terms forbid illegal, infringing, deceptive,
privacy-invasive, obscene, malicious-code, abusive, and service-interfering use;
they prohibit bypassing access restrictions and provide the service/content “as
is” [S13]. Search financial data is informational only, may be delayed, is not
verified by Brave, and is not advice [S11].

**UNKNOWN / negative result:** no public Ask Brave documentation located here
defines prompt-injection defenses, retrieved-text isolation, malicious-page or
malicious-image handling, jailbreak/refusal taxonomy, self-harm/medical/legal/
financial policy, child protections, citation-safety checks, source-poisoning
response, output moderation, red-team results, or incident reporting specific to
generated answers.

**INFERENCE (high):** Safe Search and index legality controls are not a complete
generated-answer safety case. Search results, uploads, and model output must all
be treated as separate untrusted boundaries.

**RECOMMENDATION (high):** Curiosity should sanitize and isolate retrieved
content, prohibit it from granting tool authority, label source instructions as
data, preserve refusals/partial failures as typed states, and require domain-
appropriate warnings and human review. Enrichments must not become actions
without explicit user confirmation.

### 8.2 Privacy claims and qualifications

**FACT (high):** Brave says questions and conversations are never used for
training; chats are server-processed on AWS in the US; conversation state expires
after 24 inactive hours; public shares may remain seven days; and IP addresses
are not retained [S1, S5, S6].

**FACT (high):** service-integrity systems temporarily process IP addresses for
bot detection and delete them within seconds [S5]. “Does not retain” therefore
does not mean “never processes.”

**FACT (high):** anonymous usage metrics are enabled by default but can be
disabled. Brave says the metrics count Ask Brave use and aggregate broad usage/
environment facts, while excluding query text, IP addresses, unique identifiers,
PII, personal history, and specific searches; it describes the data as anonymous,
aggregated, and stored on-device before aggregate reporting [S7].

**INFERENCE (high):** “No AI profiling” is consistent with the documented
absence of query-text metrics and retained IPs, but it is not “no processing” or
“no telemetry.” Conversation contents are necessarily processed, optional
public sharing changes retention, and aggregate feature metrics are collected by
default.

**UNKNOWN:** AWS region(s), subprocessors, encryption protocol, memory/log/cache
handling during the 24-hour window, deletion from backups, legal-process handling,
uploaded-image treatment, age policy, data-subject request mechanics, and whether
abuse/safety records can outlive ordinary conversation state.

**RECOMMENDATION (high):** never place secrets, credentials, private-corpus
material, or unnecessary personal data into a hosted consumer chat. Curiosity
should disclose processing location and every telemetry/retention exception in
the same place as the short privacy claim.

## 9. Limits, availability, and economics

### 9.1 What is public

- **FACT (high):** Ask Brave launched free on any browser/platform [S1].
- **FACT (high):** core Brave Search is ad-supported. Search Premium removes
  ads and is available only in the Brave browser [S12, S15].
- **FACT (high):** the Premium help page documents ad removal, not higher Ask
  Brave/Deep Research quotas, better models, longer state, or priority service
  [S8].
- **FACT (high):** Brave may impose feature/service limits or restrict access;
  it forbids disproportionate load, interference, and bypass, and uses private
  Proof-of-Work captchas against suspected bots/scrapers [S13, S18].

### 9.2 Material unknowns

No public consumer source found specifies:

- daily/monthly Ask or Deep Research allowance;
- turn, image, query, page, token, iteration, or time ceilings;
- concurrent-conversation limit or queue priority;
- model tier or user model selection;
- overload, timeout, cancellation, retry, partial-result, or refund semantics;
- country/age availability, SLO, uptime component, or support commitment; or
- whether advertisements appear within Ask answers/enrichments rather than only
  elsewhere in Search.

**INFERENCE (medium):** the free surface is economically supported by the wider
Search product, which has ads, Premium revenue, and commercial APIs. Dynamic
resolution, explicit Deep Research, anti-bot controls, and hidden limits are
plausible cost controls. Brave does not publish Ask Brave unit economics, so no
cost allocation or subsidy ratio can be claimed.

**BOUNDARY (high):** API Answers' per-search/per-token prices and hard research
ceilings must not be presented as consumer Ask Brave economics or quotas [S17].

**RECOMMENDATION (high):** Curiosity needs explicit per-run and per-branch work
budgets even when end-user price is zero. Free pricing is not bounded execution,
predictable capacity, or an SLA.

## 10. Clean-room architecture inference

The following is a behavioral decomposition, not Brave implementation fact:

| Likely layer | Public evidence | Confidence and limit |
| --- | --- | --- |
| Entry/mode router | `/ask`, Ask button/tab, `??`, New conversation [S1, S2] | High that routing exists; rules unknown. |
| Intent/resolution classifier | Brave says the system chooses the level of resolution [S1] | High that some decision exists; features and outputs unknown. |
| Conversation-state service | Follow-ups plus server state, local key, idle expiry [S5, S6] | High; protocol and context management unknown. |
| Brave Search retrieval | Answers grounded in relevant Web search; Deep Research performs repeated search [S1, S9] | High; exact candidate set/ranker unknown. |
| Page/context analyzer | Thousands-of-pages claim; shared grounding describes context processing [S1, S9] | Medium-high; snippets versus full fetch and extraction unknown. |
| Research planner/coverage loop | Iterative queries, blind spots, transparent steps [S1] | High at behavior level; stop/sufficiency logic unknown. |
| Grounded generator/citation allocator | Long answers, source references, in-house models/algorithms [S1, S3] | High that synthesis exists; model/prompt/citation timing unknown. |
| Enrichment selector/composer | Videos, news, pages, products, businesses, shopping [S1, S3] | High; data-provider and ranking lineage unknown. |
| Safety/abuse boundary | Safe Search, conduct terms, transient-IP bot controls, PoW [S5, S10, S13, S18] | High for Search-level controls; Ask-output controls unknown. |
| Metrics/economic control | Aggregate Ask counts, ads/Premium, dynamic resolution [S7, S8, S12] | High for first two; cost-routing role is inference only. |

### 10.1 What must not be inferred

Public evidence does **not** establish a particular model vendor, parameter
count, prompt, embedding model, vector store, reranker, browser engine,
parallelism strategy, citation algorithm, encryption primitive, API endpoint,
event schema, database, or deployment topology. It does not establish that
displayed research steps are private chain of thought or a complete trace.

## 11. Curiosity implications and verdicts

### Adopt

1. **Reversible search/chat surface.** Keep ordinary candidates and verticals
   available before, during, and after synthesis.
2. **Explicit service intent.** Separate quick answer from slower research; do
   not silently spend a research budget.
3. **Contextual enrichments.** Present source-typed media, news, commerce, and
   local objects where they answer the task, while preserving provider lineage.
4. **Visible progress and gaps.** Show bounded work completed, unresolved blind
   spots, and terminal stop reason.
5. **Ephemeral default state.** Use short idle expiry and make public sharing a
   separate, explicit retention decision.

### Adapt

1. Replace provider-chosen “resolution” with a proposed plan and caller approval
   whenever work crosses a cost, privacy, or authority threshold.
2. Replace chat turns with a branch ledger: frame ID, parent, purpose, evidence,
   permitted actions, budgets, and stop reason.
3. Replace mutable URL references with claim-to-passage records carrying source,
   canonical URL, capture identity/hash, publish/retrieve/capture times, and
   support/contradiction/unknown relation.
4. Replace opaque research-step narration with typed events:
   `plan_proposed`, `query_issued`, `candidate_selected`, `evidence_captured`,
   `coverage_gap`, `partial_failure`, `budget_update`, `answer_delta`, `done`.
5. Keep image and retrieved-page content in untrusted-data sandboxes; neither may
   authorize tools or alter the caller's frame.
6. Turn blind spots into one post-synthesis curiosity queue scored by relevance,
   value, novelty, and cost. Suggestions do not self-authorize execution.

### Reject

1. Grounding as proof of truth or completeness.
2. A hosted answer or displayed research steps as the evidence ledger.
3. Citation URLs without immutable captures as durable provenance.
4. Hidden automatic escalation, hidden quotas, or “free” as a work bound.
5. Search-level Safe Search as a complete chat/research safety policy.
6. A short privacy slogan without processing, telemetry, sharing, location, and
   retention qualifications.
7. Importing API contracts, prices, limits, or terms into the consumer surface.

### Deferred

- Representative citation entailment/completeness, follow-up consistency,
  freshness, latency, quota, cancellation, and adversarial safety testing.
- Image behavior and retention verification.
- Regional availability, accessibility, uptime, support, and actual ad placement.
- Procurement or API evaluation; those are separate product decisions.

## 12. Fact / inference / recommendation ledger

| ID | Type | Claim | Evidence | Confidence | Verdict |
| --- | --- | --- | --- | --- | --- |
| L1 | FACT | Ask Brave is a current free consumer search/chat surface, separate from AI Answers. | S1-S3, S15 | High | **ADOPTED** product boundary. |
| L2 | FACT | Users can enter through `/ask`, Ask button/tab, or `??`. | S1, S2 | High | **ADOPTED** reversible entry pattern. |
| L3 | FACT | It supports longer answers, chat follow-ups, Deep Research, and contextual enrichments. | S1, S3 | High | **ADAPTED** with typed provenance. |
| L4 | FACT | Deep Research iteratively searches, analyzes pages, surfaces steps/blind spots, and may take much longer than single search. | S1, S9 | High for provider claim | **ADAPTED** to bounded branches. |
| L5 | INFERENCE | Provider-controlled resolution/planning is a hidden authority boundary. | S1 | High | **REJECTED** without caller approval. |
| L6 | FACT | Brave says answers are Web-grounded; Brave also says grounding is not truth. | S1, S4 | High | Warning **ADOPTED**. |
| L7 | FACT | No public Ask citation schema, immutable capture, or confidence field was found. | S1-S3 | High | **REJECTED** as durable evidence. |
| L8 | FACT | Follow-up state is server-held, encrypted, locally keyed, and erased after 24 hours idle. | S5, S6 | High for documented policy | Pattern **ADAPTED**; cryptographic assurance deferred. |
| L9 | FACT | Public sharing can retain a conversation up to seven days. | S5, S6 | High | Separate retention class **ADOPTED**. |
| L10 | FACT | Questions/conversations are not used for training; IPs are transiently processed but not retained. | S1, S5 | High for documented policy | **ADAPTED** with precise disclosure. |
| L11 | FACT | Default anonymous metrics count Ask use but exclude query text and identifiers. | S7 | High for documented policy | Opt-out and disclosure **ADAPTED**. |
| L12 | FACT | Ask is free; Premium documentation promises ad-free Search, not Ask quota benefits. | S1, S8, S12 | High | Economics **DEFERRED**. |
| L13 | FACT | No public consumer research ceilings or quota were found. | S1-S3, S8 | High | Hidden bounds **REJECTED** for Curiosity. |
| L14 | INFERENCE | The UX composes typed search/enrichment lanes around generated prose. | S1-S3 | Medium-high | **ADAPTED** provider-neutrally. |
| L15 | RECOMMENDATION | Curiosity must preserve evidence before synthesis and authorize follow-up branches explicitly. | Analysis | High | **ADOPTED**. |

## 13. Verification matrix, unknowns, and negative results

### 13.1 Material-claim checks

| Material claim | Primary origin | Triangulation / caveat |
| --- | --- | --- |
| Current product and entry points | Ask launch [S1] | Live public landing [S2], product page [S15]. |
| Boundary from AI Answers | Ask launch [S1] | AI Help [S3]; privacy/settings naming drift noted [S5, S16]. |
| Deep Research iterative flow | Ask launch [S1] | Originating grounding description [S9]; API details not transferred. |
| Source references / Web grounding | Ask launch [S1] | AI Help, privacy, and product pages [S3, S5, S15] collectively support references but exhibit naming drift; no schema found. |
| Grounding is not truth | Engineering transcript in official launch [S4] | SimpleQA caveats in grounding post [S9]. |
| Conversation expiry/sharing | Privacy notice [S5] | Dedicated sharing help [S6], launch [S1]. |
| No training / IP handling | Ask launch and privacy [S1, S5] | Metrics page qualifies anonymous telemetry [S7]. |
| Free/ad-supported context | Ask launch [S1] | Search overview/Premium [S8, S12]. No Ask unit economics published. |

### 13.2 Important unknowns

1. Exact model lineage, routing, prompts, context window, and update policy.
2. Triggering and “resolution” features, including whether Deep Research can
   auto-start.
3. Candidate retrieval, page fetching, reranking, deduplication, diversity, and
   primary-source preference.
4. Citation placement, entailment, completeness, source version, and offsets.
5. Follow-up search frequency, context truncation, evidence carry-forward, and
   branch/edit semantics.
6. Consumer query/page/iteration/token/time quotas and stop reasons.
7. Freshness filters, index/fetch timestamps, and changed-page handling.
8. Prompt-injection, poisoned-source, malicious-image, refusal, and output-
   moderation controls.
9. Exact encryption/key/deletion protocol, backups, subprocessors, and image
   retention.
10. Region/age availability, accessibility, SLO, overload, cancellation, errors,
    and support.
11. Enrichment provider lineage, ranking, advertising, and disclosure rules.
12. Whether Ask ever incorporates optional Google fallback results; no basis was
    found to claim that it does.

### 13.3 Negative results retained

- No standalone Ask Brave technical reference or stable machine contract found.
- No public consumer quota, hard research ceiling, price meter, or usage object
  found.
- No citation schema, immutable capture, claim-coverage guarantee, confidence,
  contradiction, or abstention contract found.
- No Ask-specific freshness/date control or retrieval timestamp found.
- No Ask-specific generated-answer safety policy, prompt-injection threat model,
  red-team report, or safety evaluation found.
- No public proof that every follow-up performs fresh search found.
- No basis found to transfer API Answers limits, prices, event tags, or
  one-message behavior to Ask Brave.
- No basis found to describe local-key storage as end-to-end encryption.
- No basis found to claim Google fallback mixing enters Ask answers.
- No current Ask retirement/deprecation notice found.
- No live query was submitted, so runtime UI, citations, research steps, state,
  limits, latency, errors, accessibility, image behavior, and output quality are
  unverified.

## 14. Clean-room and access boundary

This is not legal advice. The research used voluntarily published public pages
and did not inspect private traffic, clients, binaries, prompts, hidden APIs, or
runtime outputs.

The general consumer terms prohibit disproportionate load, interference, and
bypassing service access controls; the service can impose limits and is provided
as-is [S13]. Ask Brave's public landing accepts image uploads, but no file was
uploaded. The public page was read only to record visible affordances [S2].

Controls for any later work:

- do not automate or scrape the consumer surface, evade Proof-of-Work or other
  restrictions, or infer hidden endpoints from traffic;
- do not copy Brave prose, branding, screenshots, outputs, private behavior, or
  undocumented schemas into Curiosity specifications or fixtures;
- derive neutral requirements from public behavior, then author independent
  names, events, tests, and UX;
- do not treat public Brave repositories or licenses as licensing the hosted
  service, generated answers, third-party pages, trademarks, or data;
- keep retrieved/provider output untrusted and do not retain it as a corpus
  without separate access, copyright, privacy, and terms review; and
- preserve source, access date, fact/inference labels, and transfer history.

## 15. Bounded curiosity pass

Scoring is 1 (low/cheap) to 5 (high/expensive). Follow-up authority was limited
to first-party public, no-query, no-account research.

| Thread | Relevance | Value | Novelty | Cost | Outcome |
| --- | ---: | ---: | ---: | ---: | --- |
| Resolve current product status and naming drift | 5 | 5 | 4 | 1 | **Pursued:** `/ask`, Help, product, privacy, and settings show a current surface with legacy wording [S2, S3, S5, S15, S16]. |
| Resolve follow-up state/privacy | 5 | 5 | 5 | 1 | **Pursued:** found 24-hour idle expiry, local key, AWS US processing, seven-day public sharing, and no-training claim [S1, S5, S6]. |
| Qualify “no profiling” against telemetry | 5 | 5 | 4 | 1 | **Pursued:** default aggregate Ask-use metrics exclude query text and identifiers [S7]. |
| Check Deep Research evidence versus API leakage | 5 | 5 | 5 | 2 | **Pursued:** shared flow is supported, but API wire/limits/economics were explicitly rejected as consumer facts [S1, S9, S17]. |
| Inspect citation/freshness contract | 5 | 5 | 4 | 2 | **Pursued:** claims and references exist, but no consumer schema, capture, timestamp, or confidence was found. |
| Submit benign/adversarial queries | 5 | 5 | 4 | 4 | `CURIOSITY_NO_GO`: live product testing was expressly prohibited and needs a fixed corpus, terms review, and budget. |
| Upload an image to infer multimodal behavior | 4 | 4 | 5 | 4 | `CURIOSITY_NO_GO`: upload/testing prohibited; privacy and retention details are unknown. |
| Inspect browser traffic or hidden endpoints | 2 | 2 | 4 | 5 | `CURIOSITY_NO_GO`: unnecessary, outside clean-room boundary, and risks access-control/terms violations. |
| Read public frontend source to reproduce interaction details | 3 | 2 | 3 | 4 | `CURIOSITY_NO_GO`: public product documentation already reached coverage; implementation contamination adds little decision value. |
| Infer private prompts/models/ranking | 2 | 2 | 4 | 5 | `CURIOSITY_NO_GO`: unsupported, proprietary, and not required for provider-neutral lessons. |
| General competitor bake-off | 2 | 3 | 2 | 5 | `CURIOSITY_NO_GO`: outside the declared Ask Brave frame. |

**Stop:** coverage and saturation reached. Remaining high-value questions require
live runtime testing, vendor disclosure, cryptographic/privacy review, or
commercial/legal authority that the caller explicitly withheld.

## 16. Primary bibliography

All sources accessed 2026-08-17.

1. **[S1] Brave, “Introducing Ask Brave,” 2025-09-29.**  
   https://brave.com/blog/ask-brave/ — launch status, boundary from AI Answers,
   entry methods, follow-ups, enrichments, grounding, Deep Research, privacy,
   index/usage and benchmark claims.
2. **[S2] Ask Brave public landing page.**  
   https://search.brave.com/ask — current public availability, New conversation,
   Search vertical navigation, no-profiling copy, and accepted image extensions.
3. **[S3] Brave Search Help, “AI in Brave Search.”**  
   https://search.brave.com/help/ai — current AI Answers/Ask Brave distinction,
   longer answers, follow-ups, Deep Research, enrichments, and model positioning.
4. **[S4] Brave, “Brave Unveils New Privacy-Focused AI Answer Engine,”
   2024-04-17, updated 2024-08-23.**  
   https://brave.com/blog/answer-with-ai/ — product lineage and official team
   transcript on triggering, grounding, multiple perspectives, non-determinism,
   evaluation, and the explicit “grounded doesn't mean truth” caveat.
5. **[S5] Brave Search privacy notice.**  
   https://search.brave.com/help/privacy-policy — AWS US processing,
   conversation state, encryption/local key, 24-hour idle expiry, seven-day
   public sharing, IP handling, index and privacy claims.
6. **[S6] Brave Search Help, “Sharing conversations with AI.”**  
   https://search.brave.com/help/sharing-conversations-with-ai — Ask Brave
   follow-up cutover and duplicated state, encryption, expiry, and sharing policy.
7. **[S7] Brave Search Help, “Anonymous usage metrics.”**  
   https://search.brave.com/help/usage-metrics — default/opt-out behavior,
   Ask-use counts, aggregation, collected environment data, and exclusions.
8. **[S8] Brave Search Help, “What is Brave Search Premium?”**  
   https://search.brave.com/help/premium — Premium's ad-free benefit and
   Brave-browser-only availability; no documented Ask entitlement.
9. **[S9] Brave, “Introducing AI Grounding with Brave Search API,” 2025-08-05,
   updated 2025-09-01.**  
   https://brave.com/blog/ai-grounding/ — origin of shared grounding/research
   claims, single versus multi-search flow, latency/cost shape, SimpleQA metrics
   and caveats. Used as architecture context, not consumer contract.
10. **[S10] Brave Search Help, “Safe Search.”**  
    https://search.brave.com/help/safesearch — levels, default, adult
    classification, and legacy Answer-with-AI suppression language.
11. **[S11] Brave Search Help, “Financial data disclaimers.”**  
    https://search.brave.com/help/finance-disclaimer — informational-only,
    provider/delay, non-verification, and non-advice boundaries.
12. **[S12] Brave Search Help, “How to use Brave Search: an overview.”**  
    https://search.brave.com/help/index — SERP verticals, recency/region filters,
    ads/Premium, Search features and consumer AI lineage.
13. **[S13] Brave consumer Terms of Use, last updated 2023-05-11.**  
    https://brave.com/terms-of-use/ — conduct, access/load/bypass restrictions,
    mutable limits/service, termination, disclaimers, and Premium terms.
14. **[S14] Brave Search Help, “Google fallback mixing.”**  
    https://search.brave.com/help/google-fallback — optional browser-side mixing
    for ordinary Search; used only to identify an unresolved Ask boundary.
15. **[S15] Brave Search product page.**  
    https://brave.com/search/ — current Ask Brave placement, search/chat summary,
    supporting videos/websites/products, follow-ups, ads, and Premium context.
16. **[S16] Brave Search settings page.**  
    https://search.brave.com/settings — current legacy “Answer with AI” toggle,
    region, display language, Safe Search, local and metrics controls.
17. **[S17] Brave Search API, Answers service documentation.**  
    https://api-dashboard.search.brave.com/documentation/services/answers —
    adjacent paid developer product, consulted only to enforce the non-transfer
    boundary from consumer Ask Brave.
18. **[S18] Brave Search Help, “Proof of Work captchas.”**  
    https://search.brave.com/help/pow-captcha — anti-bot/scraping purpose,
    private first-party challenge design, and access-integrity context.
