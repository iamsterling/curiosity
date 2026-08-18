# Brave AI Answers: consumer-surface clean-room dossier

**Research and source access date:** 2026-08-17  
**Scope:** the consumer **AI Answers** feature embedded in the ordinary Brave
Search results page, formerly named **Answer with AI**.  
**Explicit exclusions:** Brave Search API **Answers**, **Ask Brave**, Brave Leo,
authenticated account behavior, paid testing, private interfaces, browser
traffic, implementation, and production changes. Those adjacent products are
discussed only to establish boundaries.  
**Status:** first-party public-documentation research. No search query was sent
to the live answer engine and no account, credential, subscription, automation,
or access-control bypass was used.

## Executive decision

**ADAPT the interaction pattern; REJECT it as an evidence or retrieval contract
(high confidence).** AI Answers is a low-friction, one-query synthesis layer in
the normal search journey. Brave may trigger it automatically for queries it
classifies as answerable, while a user can disable automatic answers globally;
historically the user could also invoke an answer from the results-page search
box. The result is a concise, source-bearing answer placed alongside ordinary
search results rather than a separate chat workspace [S1-S4].

The strongest product idea is **progressive disclosure without forcing a mode
change**: detect when synthesis may save work, keep the underlying result page
available, show source links, enrich prose with structured media when useful,
and preserve an opt-out. The key weakness is that the consumer receives a
presentation, not an evidence contract. Public materials do not expose the
candidate set, selected passages, page captures, retrieval/fetch times, rank or
selection reasons, citation-entailment guarantees, source-set completeness,
conflicts, confidence, usage, or stop reason.

AI Answers must not be collapsed into either adjacent Brave product:

- **Answers API** is a paid programmatic endpoint with request fields, stream
  events, research budgets, usage, retention terms, and a one-user-message
  contract. None of those API fields or guarantees is a consumer UI contract.
- **Ask Brave** is the longer, stateful chat/research surface. It supports
  follow-ups and Deep Research; its conversation state is stored for up to 24
  hours of inactivity. Since 2025-09-25, Brave says all follow-up questions are
  handled by Ask Brave, not AI Answers [S1, S3, S6].

**Curiosity verdict:**

- **ADOPTED:** answerability routing, user override/opt-out, synthesis beside
  normal results, progressive source disclosure, and format selection.
- **ADAPTED:** source links become claim-to-captured-passage evidence; hidden
  automatic triggering becomes an explainable recommendation under caller
  policy; rich presentation remains downstream from provider-neutral evidence.
- **REJECTED:** generated prose as evidence authority, mutable URL cards as
  durable provenance, undocumented automatic scope expansion, and carrying
  Ask Brave/API state or limits into AI Answers by association.
- **DEFERRED:** quality, latency, citation accuracy, source diversity, and
  current UI details until an authorized, reproducible consumer-product study.

## 1. Decision frame, bounded questions, and method

### 1.1 Decision and sub-questions

**Decision:** which publicly documented behaviors of Brave's concise consumer
answer layer should inform Curiosity without copying Brave's private ranking,
model behavior, UI, outputs, data, or product authority?

Bounded questions:

1. Where does AI Answers begin and end in the ordinary search journey?
2. What is established about retrieval, passage selection, synthesis, and rich
   result assembly?
3. What do the user actually see and control for sources and citations?
4. How fresh, complete, attributable, and confidence-bearing is an answer?
5. Does the surface retain state or support follow-ups?
6. What safety, privacy, commercial, and limit boundaries are public?
7. What minimum architecture is consistent with those facts?
8. Which clean-room lessons transfer to Curiosity?

### 1.2 Evidence rules

- **FACT** — directly stated or visibly shown by an official Brave source. A
  scale, quality, independence, or performance statement is a fact only that
  Brave made the statement, not independent proof.
- **INFERENCE** — the narrowest architecture/product conclusion consistent with
  the facts; never a claim about proprietary code.
- **RECOMMENDATION** — a Curiosity design or evaluation decision.
- **UNKNOWN / NEGATIVE RESULT** — not established, contradicted, stale, or not
  transferable from an adjacent product.
- Confidence is **high**, **medium**, or **low**. “High” means confidence in the
  cited published behavior as of access, not live verification.

Primary sources were accessed 2026-08-17. Current help, policy, settings, and
product pages were preferred. Dated launch posts and their official screenshots
were used for lineage and architecture only, and are explicitly marked
historical where current behavior is not re-confirmed. The 2024 post includes a
transcript with the Brave Search engineering team; claims from it remain
first-party but are not treated as a current service-level guarantee [S2].

### 1.3 Access and clean-room boundary

The study used only voluntarily published Brave pages and official images. It
did not inspect minified application code, network calls, private clients,
hidden endpoints, model prompts, binaries, cookies from a generated answer, or
third-party output. Public settings and empty product shells were read without
submitting a query. The general consumer Terms prohibit bypassing measures and
unreasonable infrastructure load; those controls were respected [S16].

Coverage stops when every requested category has a sourced fact, bounded
inference, or explicit unknown. Saturation stops when further official pages
repeat marketing claims or cross into Ask Brave/API behavior.

## 2. Product identity and strict boundary

### 2.1 Names and lineage

| Name | Period / role | What can safely be said |
| --- | --- | --- |
| **Summarizer** | Launched 2023 | Historical predecessor: a multi-source summary at the top of the SERP plus AI-written single-result descriptions [S8]. |
| **Answer with AI** | Launched 2024 | Replaced/expanded Summarizer with broader answers, automatic/on-demand triggering, entities, cards, images, location data, and CodeLLM integration [S2, S20]. |
| **AI Answers** | Renamed 2025; current concise feature | Quick summaries with references backing key claims; remains available in addition to Ask Brave [S1, S3]. |
| **Ask Brave** | Separate 2025 chat/search product | Longer answers, follow-up chat, enrichments, and Deep Research. Not this dossier's subject [S1, S3]. |
| **Answers API** | Developer product | Paid hosted answer/research contract. Shared grounding technology does not make its schema a UI guarantee [S9]. |

**FACT (high):** Brave's current help page explicitly contrasts AI Answers'
“quick summaries” with Ask Brave's longer answers, follow-ups, and Deep Research
[S1]. The Ask Brave launch says both products coexist [S3].

**INFERENCE (high):** the correct architectural type is
`consumer_serp_synthesis`, not `chat_session`, `research_run`, or
`developer_completion`. Product naming and shared backend claims are
insufficient reasons to merge contracts.

### 2.2 Boundary matrix

| Dimension | AI Answers | Ask Brave | Answers API |
| --- | --- | --- | --- |
| Primary surface | Ordinary Search “All” results page [S1-S4] | `/ask`, Ask tab/button, chat-style answer surface [S3] | Authenticated HTTPS endpoint |
| Typical result | Concise summary plus source references and normal results [S1, S2] | Longer answer, contextual enrichments, chat follow-ups, optional Deep Research [S1, S3] | Completion/stream plus documented tags and usage |
| State | No AI-Answers conversation contract found; historically described as a one-off search query [S2] | Conversation retained up to 24 hours inactive [S5, S6] | One user message per public API request; not a consumer session |
| Follow-up | Since 2025-09-25, all follow-up questions are handled by Ask Brave [S6] | Yes [S1, S3, S6] | No multi-turn conversation in the public contract |
| User work budget | None published | Deep Research described qualitatively; no UI ceiling cited here | Explicit query/iteration/time/result/token ceilings |
| Economics | Free search feature; ad-supported SERP or ad-free Search Premium [S2, S12, S13] | Advertised free at launch [S3] | Metered paid service |
| Privacy frame | General private-search/query frame; current wording is partially ambiguous [S2, S5] | Server-side encrypted ephemeral conversation [S5, S6] | Customer-account/API privacy notice, outside this scope |

**RECOMMENDATION (high):** Curiosity should represent these as separate output
types and policy surfaces. Shared retrieval infrastructure may be recorded as
lineage, never as contract inheritance.

## 3. Consumer user flow

### 3.1 Entry and triggering

The defensible flow is:

```text
user enters an ordinary Brave Search query
        |
        v
query/intent routing
  -> ordinary result page only, or
  -> AI Answers automatically for selected answerable queries
        |
        +-- user may disable automatic AI answers in Search settings
        +-- historical 2024 UI also offered an on-demand AI button
        |
        v
concise generated answer at/near top of ordinary results
  + linked/highlighted source references or source cards
  + optional entity/card/image/location enrichments
  + ordinary Web results remain available
        |
        +-- source click leaves synthesis for publisher page
        +-- feedback controls may be offered
        +-- follow-up is now an Ask Brave handoff, not AI Answers state
```

**FACT (high):** current Search settings contain “Answer with AI — Make
AI-powered answers appear automatically for some searches,” as an on/off
preference [S4]. The current AI help says the concise answer is provided when a
user asks Brave Search a question [S1].

**FACT (high, historical behavior):** the 2024 launch said informational,
question-like queries defaulted to the answer experience, while other query
classes could invoke it via an AI icon beside the results-page search bar. Its
official screenshot shows that control [S2].

**UNKNOWN:** the 2026 public pages do not clearly re-confirm a manual
“AI Answers” button after Ask Brave added its own Ask button/tab. The automatic
setting is current; the manual invocation detail must be treated as historical
until checked under separately authorized UI observation.

### 3.2 Answerability and format routing

**FACT (high, historical):** Brave grouped search intents into navigational,
informational (specific lookup or question-like), commercial, and transactional,
and said question-like informational queries were the default automatic-answer
target [S2]. The engineering transcript calls triggering one of the hardest
tasks and describes heuristics that control both suitability and serving load.

**FACT (medium, lineage evidence):** CodeLLM's programming-query detection was
performed outside the LLM by ordinary search components, and CodeLLM was folded
into Answer with AI in August 2024 [S20]. This proves one historical specialized
route, not the entire current trigger architecture.

**INFERENCE (medium):** a pre-generation router likely separates at least
`no_answer`, `concise_answer`, and specialist/rich presentation paths. It may use
query class, locale, safety, answerability, and capacity signals. Exact features,
thresholds, learned models, fallbacks, and load shedding are unknown.

**RECOMMENDATION (high):** Curiosity may recommend synthesis, but should expose
the routing reason and allow a caller to accept, force, or decline it. Capacity
or commercial routing must not be presented as epistemic confidence.

### 3.3 Result presentation

**FACT (high):** Brave describes AI Answers as a concise summary with references
to sources backing key claims. It supports code, news, language, people, and
other question classes [S1].

**FACT (high, 2024 feature description):** generated answers could mix prose
with named-entity enrichments, informational cards, images, and point-of-interest
data. Brave described transforming a generated token stream on the fly,
detecting entity types, fetching additional metadata, and rendering a richer
representation [S2].

**FACT (medium, historical screenshot):** an official 2024 screenshot shows an
answer above normal results, highlighted spans, a “Context” row containing
multiple source cards plus a “+ more” expansion, feedback/share/copy controls,
images, and suggested follow-ups [S2]. Since all current follow-ups route to Ask
Brave, the screenshot is not a current state contract [S6].

**INFERENCE (high):** AI Answers is designed as an **augmenting SERP block**. It
reduces click/reading effort but leaves ordinary result discovery available,
which is materially different from a chat answer replacing the SERP.

## 4. Retrieval and synthesis boundary

### 4.1 What Brave establishes

**FACT (high):** current Brave help says references back key claims and parts of
AI Answers use open-source LLMs; Brave Search AI is built in-house with Brave's
models and algorithms [S1]. The exact models and versions are not named.

**FACT (high):** Brave repeatedly describes the generated summary as based
solely on Web search results [S2, S8, S10]. The 2025 grounding announcement says
the same grounding service powers Answer with AI and distinguishes fast
single-search from sequential multi-search research [S9].

**INFERENCE (high):** AI Answers is the fast **single-search** consumer path,
whereas multi-search research belongs to Ask Brave/Answers Research. “Single
search” does not prove one backend RPC, one index shard, or a fixed number of
documents; it means no publicly claimed iterative query-planning loop.

**FACT (high, 2024 engineering account):** after search ranking, AI Answers
needed finer-grained context selection because an entire top-ranked page is not
necessarily relevant. Brave named paragraphs, individual sentences, tables,
table rows, and structured data as possible evidence units, and named
embeddings, question answering, and semantic understanding among the existing
technologies used to select context [S2].

**FACT (high, historical predecessor):** Summarizer used QA extraction,
zero-shot candidate classifiers including hate/vulgarity/spam criteria, and a
summarization/paraphrasing model [S8]. The 2024 product is described as a major
step beyond Summarizer, so this exact three-model pipeline must not be imputed to
the current feature.

### 4.2 Boundary reconstruction

```text
Brave index + locale / search policy / safety context
        |
        v
ordinary query retrieval and ranking
        |
        +---------------------------> normal SERP results
        |
        v
answerability / product router
        |
        v
fine-grained context extraction and candidate filtering
        |
        v
grounded generation (streamed internally or to UI)
        |
        +--> citation/source association
        +--> entity recognition and metadata enrichment
        |
        v
AI Answers SERP component
```

**INFERENCE (high):** retrieval and synthesis are operationally separable
inside Brave—the same ranked search also feeds normal results—but inseparable in
the consumer answer artifact. The user can inspect linked pages, yet receives no
machine-readable evidence set or replayable retrieval manifest.

**INFERENCE (medium):** source association may occur during generation, after
generation, or in both phases. Highlighted answer spans and context cards show a
presentation mapping, but public consumer material does not define the mapping
algorithm or entailment semantics.

### 4.3 What must not be inferred from Answers API

The API publishes citation offsets/snippets, usage, models, completion limits,
SafeSearch fields, and rich research events. None of these is documented as an
AI Answers UI guarantee. Likewise, public API research defaults cannot be used
to estimate AI Answers cost, context size, or source count.

**RECOMMENDATION (high):** Curiosity must keep `retrieval_run`,
`selected_evidence`, `generated_answer`, and `presentation_enrichment` as
separate artifacts. A provider can supply one or more, but prose cannot silently
stand in for retrieval.

## 5. Sources, citations, and provenance

### 5.1 Published behavior

**FACT (high):** Brave says AI Answers always shows where information comes from
and provides references that back key claims [S1]. The 2024 and 2023 launches
describe cited sources alongside traditional results and links to original data
[S2, S8].

**FACT (medium, historical UI):** official imagery shows highlighted answer
spans and a source-card group labeled “Context,” with several domains visible
and additional sources collapsed [S2]. It does not establish that every span or
claim has exactly one citation, nor what a highlight means programmatically.

**FACT (high):** Brave's team cautions that grounding is not truth. An answer
reflects the quality and potentially multiple perspectives of search results;
critical facts still require checking [S2].

### 5.2 Evidence strengths

- Source links make at least some factual claims inspectable.
- Keeping ordinary results below/near the answer preserves alternative
  discovery instead of forcing acceptance of the synthesis.
- Multiple source cards make source plurality visible at a glance.
- Rich layouts can make tables, entities, places, and images easier to inspect
  than a prose wall, if source lineage remains visible.

### 5.3 Provenance weaknesses and unknowns

No public consumer source found defines:

1. citation object fields or a stable export format;
2. whether a citation supports one phrase, sentence, paragraph, list, or answer;
3. whether every material claim must be cited;
4. whether the cited passage was a result snippet, extracted page region,
   structured datum, or model-composed interpretation;
5. source-page capture ID, content hash, fetch time, publication time, or version;
6. canonicalization, mirrors, syndication, near-duplicate handling, or owner
   diversity;
7. retrieval query, rank, selection reason, exclusion reason, or source class;
8. contradiction, uncertainty, consensus, or primary/secondary-source labels;
9. citation behavior when a page changes, disappears, blocks access, or differs
   from Brave's indexed copy;
10. whether enrichment providers and normal Web citations share one lineage
    model.

**INFERENCE (high):** citations improve inspectability and attribution but do
not create durable provenance. A mutable URL plus generated answer is not a
reproducible evidence trace.

**RECOMMENDATION (high):** Curiosity should require each answer claim to link to
one or more captured passages with source URL, canonical identity, capture time,
published/modified time where available, content hash, retrieval query, rank,
and support/contradict/unresolved relation. Source cards are presentation over
that ledger, not the ledger itself.

## 6. Freshness, coverage, and confidence

### 6.1 Freshness

**FACT (high):** Brave markets AI Answers and its predecessors as grounded in
real-time/up-to-date Web search rather than only model training data [S2, S8,
S9]. Brave's ordinary search UI supports a recency filter [S11].

**FACT (high):** the public AI Answers help and settings expose no
answer-specific freshness target, maximum index age, retrieval timestamp,
source publication date requirement, or stale-result warning [S1, S4].

**UNKNOWN:** whether ordinary SERP recency filters constrain AI Answers context;
whether each cited page is fetched at answer time versus read from indexed
content; and how dynamic pages, news corrections, and conflicting publication
dates are handled.

**INFERENCE (high):** “real-time” means retrieval against Brave's then-current
search system, not guaranteed currentness of each fact. Without source dates and
captures, a consumer cannot audit answer freshness from the answer alone.

### 6.2 Coverage and diversity

**FACT (high):** Brave says the answer synthesizes multiple sources and tries to
reflect multiple perspectives where possible [S2, S8].

**UNKNOWN:** candidate count, domain cap, publisher-owner diversity, geographic
or language coverage, primary-source preference, tail-source recall, and whether
rich third-party providers can contribute answer content.

**FACT / UNKNOWN (high):** ordinary Brave Search publishes operators for site,
language, location, file type, title/body terms, exact matching, and Boolean
logic [S18]. No consumer AI Answers source found says which operators constrain
answer retrieval, are ignored, or merely affect the visible result list.

**UNKNOWN / boundary warning:** optional Google fallback mixing operates in the
Brave browser and mixes result sets client-side when enabled [S17]. No primary
source found says Google fallback results enter AI Answers. It is therefore
unsafe to claim either inclusion or exclusion.

### 6.3 Confidence and quality

**FACT (high):** no answer-level confidence, calibration, coverage, abstention,
or contradiction field is documented for the consumer feature [S1-S4].

**FACT (high):** Brave says search and LLM outputs are non-deterministic and the
index changes. In 2024 it described automated expected-entity/format checks,
blind human side-by-side evaluation, a dedicated quality team, and dogfooding
[S2]. This is process evidence, not a current public quality SLO.

**FACT (high):** Brave's 2025 grounding benchmark concerns the grounding system
and short factual SimpleQA questions, not a consumer AI Answers contract or
claim-level citation evaluation [S9].

**RECOMMENDATION (high):** never convert a product-level benchmark or “grounded”
label into confidence for an individual answer. Curiosity confidence must be
derived from evidence quality, agreement/conflict, coverage, and evaluation
appropriate to the claim type.

## 7. Follow-ups and state

### 7.1 Current product transition

**FACT (high):** Brave's dedicated sharing help says: “As of Sep 25th, 2025,
all followup questions are handled by Ask Brave” [S6]. Current AI help similarly
reserves follow-ups for Ask Brave [S1].

**FACT (high):** the 2024 AI Answers predecessor was explicitly described as
less interactive and as a one-off search task with no sessions or history. Its
UI nevertheless displayed suggested follow-up questions [S2].

**INFERENCE (high):** follow-up suggestions in an AI Answers result are now a
**handoff boundary**: selecting one initiates/continues Ask Brave behavior rather
than extending an AI Answers-native conversation. Historical screenshots must
not be interpreted as proof of current AI Answers state.

### 7.2 State and privacy ambiguity

The general Search privacy notice has a naming inconsistency: under “Ask Brave”
it first describes a “concise summary answer,” language otherwise used for AI
Answers, and then describes conversation state, encryption, and 24-hour erasure
[S5]. Current product help clearly distinguishes concise AI Answers from stateful
Ask Brave [S1].

**FACT (high):** Ask Brave conversation state is server-processed on AWS in the
US, encrypted, erased after 24 hours of inactivity, and keyed locally; public
sharing may retain it for up to seven days [S5, S6].

**FACT (medium for current AI Answers):** Brave's 2024 engineering account said
Answer with AI was treated exactly as a search query, with no session or query
history and IP dropped before reaching the search team [S2]. General current
Search privacy says searches are not collected and IPs used for service
integrity are deleted within seconds [S5].

**UNKNOWN:** the current privacy notice does not give AI Answers its own explicit
retention subsection after the Ask Brave split. Therefore exact current
server-log, generated-answer, and transient-cache retention for AI Answers is
not independently specified.

**RECOMMENDATION (high):** Curiosity should make the transition explicit:
`one_shot_answer -> user_authorized_new_conversation`, showing what context will
cross the boundary and the resulting retention policy. No implicit transfer of
answer, query, clicked sources, or hidden profile should occur.

## 8. Safety, privacy, and user control

### 8.1 Content safety

**FACT (high):** Brave Search offers Off, Moderate (default), and Strict
SafeSearch. For adult content, Answer with AI is disabled under both Off and
Moderate settings [S7]. This is a notable suppression policy: turning filtering
off does not turn adult-content generation on.

**FACT (medium, historical predecessor):** Summarizer candidates were filtered
by zero-shot classifiers for criteria including hate speech, vulgarity, and spam
[S8]. Because AI Answers replaced that pipeline, the exact classifiers and
criteria cannot be assumed current.

**FACT (high):** Brave acknowledged possible hallucinated, false, offensive, or
controversial output and provides feedback/reporting channels [S2, S8]. The
general Terms provide the service/content as-is and disclaim reliance [S16].

**FACT (high):** financial search data is informational, may be delayed, is not
verified by Brave, and is not trading, investment, tax, legal, or accounting
advice [S19]. The page does not specifically define how generated AI Answers
identify or isolate those provider data.

**UNKNOWN / negative result:** no current public AI Answers-specific document
was found for prompt injection, malicious retrieved text, jailbreaks, source
poisoning, citation phishing, professional-domain refusal, self-harm, election
content, child safety beyond SafeSearch, generated-code safety, or red-team
results.

**RECOMMENDATION (high):** Curiosity should treat retrieved text and generated
answers as untrusted. Separate retrieval content from instructions; sanitize
rendering and URLs; preserve source policy; apply domain-specific warning or
abstention; and never equate SafeSearch with answer safety.

### 8.2 Search privacy

**FACT (high):** Brave says Search does not collect personal information or
search history and does not profile users. IP addresses temporarily processed
for service integrity are deleted within seconds [S5].

**FACT (high):** Search preferences use anonymous finite-valued cookies; the
published cookie list includes SafeSearch, country, units, local-results,
location, theme, fallback, and rerank preferences. It does not list an
AI-Answers-specific identifier [S14].

**FACT (high):** anonymous usage metrics are on by default but can be disabled.
Brave says it collects aggregate query counts and average query length, not
query text, IPs, unique identifiers, or personal history; it separately counts
Ask Brave use [S15]. AI Answers use is not explicitly listed as a metric row.

**INFERENCE (medium):** AI Answers inherits a substantially less stateful
privacy posture than chat because it is embedded in ordinary search and does
not need conversation continuity. The exact current transient processing and
cache behavior remains undocumented, so “nothing is ever retained anywhere”
would overstate the primary evidence.

**RECOMMENDATION (high):** privacy claims for Curiosity must enumerate query,
retrieval, evidence, generated answer, telemetry, feedback, cache, and abuse-log
retention separately. “No profile” is valuable but not a complete data-flow
contract.

### 8.3 Agency and defaults

**FACT (high):** automatic AI Answers can be disabled in Search settings [S3,
S4]. SafeSearch, region, location, and anonymous usage metrics are separately
controlled [S4].

**INFERENCE (high):** automatic triggering is an opt-out default, not affirmative
per-answer consent. It reduces friction but also increases the risk that
generated synthesis is mistaken for authoritative search output.

**RECOMMENDATION (high):** retain easy opt-out and manual synthesis, but label
generated content, expose why it appeared, keep raw results reachable, and
avoid dark-pattern escalation from concise answer to stateful chat.

## 9. Business model, availability, and limits

### 9.1 Economics

**FACT (high):** Brave launched Answer with AI as free to all users on desktop
and mobile and said it hoped to keep it free [S2]. Ask Brave's 2025 announcement
confirmed AI Answers remained a separate widely used feature and advertised Ask
Brave as free [S3].

**FACT (high):** ordinary Brave Search is ad-supported. Search Premium removes
ads and is currently documented as exclusive to the Brave Browser [S12, S13].
The Premium help page describes ad removal, not enhanced AI Answers quotas,
models, citation features, or quality [S13].

**FACT (medium):** Brave reported more than 15 million AI Answers per day in
2025 [S3, S9]. This is a first-party usage claim, not an entitlement or capacity
guarantee.

**INFERENCE (high):** AI Answers functions as a free search-retention and
utility feature supported by the broader ad/subscription/search ecosystem, not
as a separately metered consumer SKU. Its economic objective can influence
triggering and layout even when answers are free.

### 9.2 Public limits and availability

**FACT (high):** current primary pages publish no per-user/day answer quota,
source count, answer length, context window, latency SLO, concurrency, or retry
limit for AI Answers [S1-S4].

**FACT (medium, historical):** the 2024 launch documented English, French,
German, Italian, and Spanish support, with other-language answers possibly
appearing in English [S2]. Current help only says AI Answers can help with
language questions and does not publish a current supported-language matrix
[S1].

**FACT (high):** the general Terms allow Brave to change, suspend, discontinue,
or impose limits on features without notice, and prohibit excessive load and
access-control bypass [S16].

**UNKNOWN:** geographic exclusions, present language matrix, capacity shedding,
anonymous abuse quotas, CAPTCHA interaction, answer timeout, partial rendering,
cache reuse, publisher remuneration, ad placement relative to generated
answers, and Search Premium treatment of generation cost.

**RECOMMENDATION (high):** Curiosity must not adopt “free and apparently
unlimited” as an architecture assumption. Define per-request budgets, capacity
fallback to normal results, timeout/partial states, and cost telemetry even for
a free consumer tier.

### 9.3 Publisher ecosystem tension

**FACT (high):** Brave acknowledged that answer engines can reduce publisher
visits and erode incentives to publish, and said it intended to monitor and
quantify the impact and eventually address disruption [S2].

**UNKNOWN / negative result:** no current primary source found in frame reports
that measurement, a publisher compensation mechanism, opt-out specific to AI
Answers, or how answer inclusion interacts with ordinary crawl/index controls.

**RECOMMENDATION (medium):** Curiosity should preserve click-through, clear
attribution, source visibility, and source-level usage accounting; publisher
policy requires separate legal/product review rather than assuming citations
resolve the economic issue.

## 10. Clean-room architecture inference

This is a minimum logical architecture, not a reconstruction of Brave code.

| Likely layer | Public evidence | Confidence and boundary |
| --- | --- | --- |
| Independent index and normal ranker | Answers are based on Brave Web results; ordinary results remain present [S1, S2, S10] | High that the layer exists; rank features and corpus state unknown. |
| Query/intent router | Automatic answers for “some searches”; historical intent taxonomy and trigger heuristics [S2, S4] | High; exact implementation unknown. |
| Safety/locale gate | Search region/language context and adult-content suppression [S2, S4, S7] | High for policy inputs; evaluation order unknown. |
| Single-search retrieval | Grounding service powers Answer with AI; single versus multi-search distinction [S9] | High at product level; backend fan-out unknown. |
| Fine-grained evidence selector | Paragraph/sentence/table/row/structured-data selection; embeddings/QA/semantic understanding [S2] | High for disclosed 2024 design; current model/thresholds unknown. |
| Candidate/content safety filter | Historical Summarizer classifiers and current SafeSearch [S7, S8] | Medium that filtering exists; low on current pipeline details. |
| Grounded generator | Solely Web-result-based concise synthesis; open-source and proprietary AI [S1, S2] | High; models, prompts, context size, fallback unknown. |
| Citation associator | References/highlights/source cards [S1, S2] | High that association exists; timing and entailment unknown. |
| Entity/enrichment assembler | On-stream entity typing and metadata/card/image/location enrichment [S2] | Medium-high for 2024 architecture; current providers/schema unknown. |
| SERP presenter and handoff | Generated block plus normal results; follow-ups now Ask Brave [S2, S6] | High. |
| Anonymous preference/metrics plane | Settings, anonymous cookies, aggregate metrics [S4, S14, S15] | High at policy level; runtime event schema unknown. |

### 10.1 Control/data flow inference

1. Normal search policy supplies query, locale, SafeSearch, and optional location.
2. A router predicts whether concise synthesis is suitable and permitted.
3. Brave performs the normal ranked retrieval used by the SERP.
4. A finer-grained selector extracts candidate evidence units from selected
   results/pages/structured data.
5. Safety/quality filters remove some candidates.
6. A grounded model generates a concise answer from the selected context.
7. Citation association and entity recognition annotate the answer stream.
8. Enrichment lookups supply cards/images/place metadata where relevant.
9. The SERP renders the answer, context links, controls, and normal results.
10. Any conversational continuation crosses into Ask Brave's state boundary.

**INFERENCE (medium):** generation, citation association, and enrichment may be
pipelined to reduce perceived latency. Brave explicitly described on-the-fly
token-to-rich-representation conversion, but not service boundaries [S2].

**UNKNOWN:** cache keys, request deduplication, retriever/generator concurrency,
model routing, source-fetch isolation, prompt-injection defenses, citation
alignment, error states, and whether an answer may be synthesized from cached
context.

## 11. Curiosity implications and verdicts

### 11.1 Adopted

1. **Synthesis beside retrieval.** Keep ordinary ranked evidence available when
   a concise answer is generated.
2. **Answerability routing.** Avoid wasting generation on navigational,
   transactional, or directly structured intents when another presentation is
   better.
3. **User agency.** Provide global policy, per-query override, and clear disable
   controls.
4. **Fine-grained context selection.** Select passage/table/row/structured-data
   evidence rather than treating an entire high-ranked page as relevant.
5. **Format-aware presentation.** Use tables, cards, entities, images, or direct
   values when they improve comprehension—after provenance is established.
6. **State-boundary handoff.** Make one-shot answer versus conversation/research
   an explicit product and retention transition.

### 11.2 Adapted

1. Replace hidden trigger heuristics with an explainable
   `synthesis_recommendation` containing reason class, policy inputs, and user
   decision.
2. Replace mutable source cards with typed claim-to-captured-passage edges.
3. Separate `search_results`, `selected_evidence`, `answer`, and `enrichments`;
   show all four without implying identical authority.
4. Add freshness targets and per-source capture/publish/modify times.
5. Add supporting, contradicting, and unresolved evidence rather than only
   sources selected for fluent synthesis.
6. Add coverage, partial-failure, abstention, and stop-reason objects.
7. Keep feedback anonymous where possible, but disclose precisely what query,
   answer, source IDs, and diagnostics a submission includes.

### 11.3 Rejected

1. Generated prose as a source of record.
2. “Grounded” as a synonym for true, complete, current, or safe.
3. Automatic synthesis without visible generated-content labeling and override.
4. Citation cards without capture/version/claim semantics as durable provenance.
5. Inferring consumer state, retention, limits, or schema from Ask Brave or the
   Answers API.
6. Rich entity metadata whose provider and evidence lineage are hidden.
7. Product-level accuracy claims as per-answer confidence.

### 11.4 Deferred

- Current live UI behavior, including manual invocation and citation interaction.
- Citation correctness/completeness and source diversity measurement.
- Quality, latency, determinism, and safety benchmark on Curiosity's query mix.
- Exact privacy retention, subprocessors, caches, and regional processing for
  current AI Answers.
- Publisher impact, content-use terms, attribution sufficiency, and compensation.
- Locale, accessibility, mobile/desktop, and failure-state evaluation.

## 12. Fact / inference / recommendation ledger

| ID | Type | Claim | Evidence | Confidence | Verdict |
| --- | --- | --- | --- | --- | --- |
| L1 | FACT | AI Answers is the concise consumer summary on ordinary Brave Search; Ask Brave is longer and stateful. | S1, S3, S6 | High | **ADOPTED** as distinct product types. |
| L2 | FACT | Automatic AI Answers can be disabled in current Search settings. | S3, S4 | High | **ADOPTED** user control. |
| L3 | FACT | Historical Answer with AI supported both automatic and manual invocation. | S2 | High historically; medium currently | **DEFERRED** current manual path. |
| L4 | FACT | AI Answers is grounded in Web search results and shows source references for key claims. | S1, S2, S10 | High | **ADAPTED** to typed evidence. |
| L5 | INFERENCE | AI Answers is the fast single-search path, not iterative research. | S1, S3, S9 | High | **ADOPTED** service-class distinction. |
| L6 | FACT | Fine-grained context may include paragraphs, sentences, tables, rows, and structured data. | S2 | High for 2024 disclosure | **ADOPTED** abstract selection pattern. |
| L7 | FACT | Answers can include entity/card/image/location enrichments. | S2 | High for launched product; medium current detail | **ADAPTED** with provenance. |
| L8 | FACT | All follow-ups have been handled by Ask Brave since 2025-09-25. | S1, S6 | High | **ADOPTED** explicit handoff boundary. |
| L9 | FACT | Consumer sources publish no answer-level confidence or work budget. | S1-S4 | High | **REJECTED** as evidence contract. |
| L10 | INFERENCE | URL cards improve inspectability but are not durable provenance. | S1, S2 | High | **ADAPTED** to captures and passage edges. |
| L11 | FACT | “Real-time” grounding has no per-source freshness guarantee in the consumer contract. | S1, S2, S8, S9 | High | **REJECTED** as freshness proof. |
| L12 | FACT | Adult-content AI answers are disabled even with SafeSearch Off or Moderate. | S7 | High | **ADAPTED** as independent generation policy. |
| L13 | FACT | General Search claims no profiling/query history; exact current AI Answers transient retention is not separately specified. | S2, S5 | Medium-high | **DEFERRED** privacy diligence. |
| L14 | FACT | AI Answers is free; Search monetizes via privacy-preserving ads and ad-free Premium. | S2, S12, S13 | High | **ADAPTED**; do not infer unlimited capacity. |
| L15 | FACT | No consumer answer quota, latency SLO, or source-count limit is published. | S1-S4 | High | **REJECTED** as an operational contract. |
| L16 | RECOMMENDATION | Curiosity should preserve results/evidence before generated presentation. | Analysis | High | **ADOPTED**. |
| L17 | RECOMMENDATION | A one-shot-to-chat transition must disclose context and retention changes. | Analysis from S1, S5, S6 | High | **ADOPTED**. |

## 13. Verification matrix, unknowns, and negative results

### 13.1 Material-claim triangulation

| Material claim | Primary origin | Triangulation / caveat |
| --- | --- | --- |
| Current AI Answers versus Ask Brave distinction | Current AI help [S1] | Ask Brave launch says both coexist [S3]; follow-up help fixes transition date [S6]. |
| Automatic trigger and opt-out | Current rendered settings [S4] | 2024 launch explains answerability routing [S2]; current manual trigger remains unknown. |
| Search-grounded synthesis with citations | Current AI help [S1] | 2024 launch/engineering account [S2], current Search product page [S10]. |
| Single-search consumer path | Grounding architecture [S9] | AI Answers is concise while research belongs to Ask Brave [S1, S3]. This is product-level inference, not wire observation. |
| Fine-grained evidence extraction | 2024 engineering transcript [S2] | 2023 predecessor separately documents QA/candidate/summarizer stages [S8]; exact current pipeline unknown. |
| Stateful follow-ups belong to Ask Brave | Dated sharing help [S6] | Current AI help and Ask launch [S1, S3]. |
| Search privacy rather than API privacy | Current Search privacy [S5] | 2024 AI Answers-specific account [S2], cookies and metrics [S14, S15]. Current notice wording is ambiguous. |
| Free/ad-supported economics | 2024 launch [S2] | Ads and Premium help [S12, S13]; no AI-specific paid entitlement found. |
| Safety suppression | Current SafeSearch help [S7] | Historical candidate filtering [S8] is not assumed current. |

### 13.2 Important unknowns / checks for any authorized evaluation

1. Current manual invocation and exact auto-trigger eligibility.
2. Whether a no-answer decision is based on epistemic insufficiency, safety,
   capacity, query class, locale, or a mixture.
3. Exact models, prompts, versions, routing, and change notice.
4. Candidate count, context size, source diversity/dedup, and primary-source
   preference.
5. Search snippet versus fetched-page versus structured-data evidence path.
6. Citation placement, entailment, completeness, and stale/dead-link behavior.
7. Freshness-filter interaction and source capture times.
8. Google fallback mixing interaction, if any.
9. Prompt-injection and poisoned-source controls.
10. Safety categories, refusals, professional-domain handling, and code safety.
11. Current transient logs, generated-answer cache, deletion, AWS/subprocessor,
    and regional processing specifics for AI Answers.
12. Quotas, timeouts, retries, cancellation, load shedding, and partial UI.
13. Ads/Premium relationship to answer trigger, layout, and capacity.
14. Publisher controls, attribution usage, traffic impact, and compensation.
15. Accessibility, mobile parity, localization, and screen-reader citation flow.

### 13.3 Negative results retained

- No current public AI Answers request/response or event contract was found.
- No answer-level confidence, calibration, abstention, contradiction, or
  coverage field was found.
- No immutable citation, document capture, content hash, or claim-entailment
  contract was found.
- No answer-specific freshness target or stale-source warning was found.
- No current source-count, answer-length, context, latency, or user-quota limit
  was found.
- No basis was found to apply Answers API fields, budgets, prices, or retention
  to consumer AI Answers.
- No basis was found to claim Google fallback results enter AI Answers.
- No current AI Answers-specific prompt-injection threat model, safety card, or
  red-team report was found.
- No current AI Answers-only retention section was found; the Search privacy
  notice conflates concise-answer and Ask Brave conversation wording.
- No current language/region support matrix was found.
- No published follow-through on the 2024 promise to quantify publisher impact
  was found in the bounded sources.
- No live output was generated; citation accuracy, UI behavior, latency,
  non-determinism, failure states, and accessibility remain unverified.

## 14. Clean-room transfer controls

This report is behavior-level research, not legal advice or a compatibility
specification.

- Do not inspect or reproduce Brave private clients, prompts, traffic, endpoint
  shapes, cache keys, model outputs, ranker features, or hidden UI state.
- Do not scrape the consumer UI, evade CAPTCHA/quotas, automate queries, or
  create load without a separately approved test plan.
- Do not copy Brave prose, screenshots, branded controls, generated outputs, or
  look-and-feel into Curiosity fixtures or implementation.
- Transfer only abstract requirements: answerability recommendation, source
  visibility, evidence/presentation separation, user override, and explicit
  state handoff.
- Author independent provider-neutral schemas, terminology, tests, and visual
  design from Curiosity requirements.
- Treat every search result, extracted passage, enrichment, URL, and generated
  answer as untrusted external data.
- Review source/publisher rights, privacy, accessibility, and safety separately
  before any live evaluation or provider integration.
- Preserve this source/date ledger and separate research evidence from any later
  implementation handoff where contamination risk is material.

## 15. Bounded curiosity pass

Scoring is 1 (low) to 5 (high). Cost is research/access cost, where 5 is most
expensive or risky. Caller authority allowed only public, no-query research.

| Thread | Relevance | Value | Novelty | Cost | Outcome |
| --- | ---: | ---: | ---: | ---: | --- |
| Resolve current AI Answers / Ask Brave follow-up boundary | 5 | 5 | 5 | 1 | **Pursued:** dated help says every follow-up moved to Ask Brave on 2025-09-25 [S6]. |
| Verify current automatic-answer control | 5 | 5 | 3 | 1 | **Pursued:** rendered settings retain the Answer with AI automatic toggle [S4]. |
| Recover fine-grained retrieval boundary from first-party engineering account | 5 | 5 | 5 | 2 | **Pursued:** passages, sentences, tables, rows, structured data, and on-stream enrichment are documented [S2]. |
| Reconcile AI Answers privacy with Ask Brave retention | 5 | 5 | 4 | 2 | **Pursued:** product/help distinction is clear, but privacy wording remains internally ambiguous [S1, S2, S5, S6]. |
| Determine whether Google fallback enters answers | 4 | 4 | 4 | 2 | **Pursued to negative result:** no first-party linkage found; retained as unknown [S17]. |
| Run live queries to inspect current citations and handoff | 5 | 5 | 4 | 4 | **CURIOSITY_NO_GO:** caller prohibited live tests; no declared corpus, privacy review, or reproducibility plan. |
| Inspect browser traffic or minified client to discover endpoints/state | 2 | 2 | 4 | 5 | **CURIOSITY_NO_GO:** unnecessary for behavior-level decision and outside clean-room/access boundary. |
| Fingerprint models through adversarial outputs | 1 | 1 | 4 | 5 | **CURIOSITY_NO_GO:** model extraction is irrelevant, unreliable, and unauthorized. |
| Test safety failures or prompt injection against production | 4 | 4 | 4 | 5 | **CURIOSITY_NO_GO:** needs a separately reviewed safety protocol, account/load authority, and disclosure plan. |
| Measure publisher traffic impact | 4 | 5 | 4 | 5 | **CURIOSITY_NO_GO:** requires longitudinal analytics, publisher cooperation, and a causal design outside the product-contract frame. |
| Determine Premium pricing/account entitlements | 2 | 2 | 2 | 4 | **CURIOSITY_NO_GO:** no account or paid tests authorized; public help already shows no AI-specific entitlement. |
| Infer private ranker/citation algorithm | 2 | 2 | 5 | 5 | **CURIOSITY_NO_GO:** proprietary, not required for transferable lessons, and high contamination risk. |

**Stop:** all requested categories are covered. The best remaining gaps require
live behavior, private vendor disclosure, procurement/privacy review, publisher
data, or a separately authorized safety/quality study. Additional public pages
were saturated or belonged to Ask Brave/API rather than AI Answers.

## 16. Primary bibliography

All sources accessed 2026-08-17.

1. **[S1] Brave Search Help, “AI in Brave Search.”**  
   https://search.brave.com/help/ai  
   Current canonical distinction among AI Answers, Ask Brave, featured snippets,
   and AI-written descriptions; source-reference and model-positioning claims.
2. **[S2] Brave, “Brave Unveils New Privacy-Focused AI Answer Engine…”**
   (2024-04-17; updated 2024-08-23).  
   https://brave.com/blog/answer-with-ai/  
   Launch flow, automatic/manual triggering, intent classes, rich entities,
   citations, languages, free availability, publisher concern, official UI
   images, and engineering-team transcript on retrieval, context selection,
   privacy, evaluation, streaming, and enrichment.
3. **[S3] Brave, “Introducing Ask Brave”** (2025-09-29).  
   https://brave.com/blog/ask-brave/  
   AI Answers rename/coexistence, product boundary, free Ask surface, current
   follow-up/research role, and reported AI Answers volume.
4. **[S4] Brave Search, rendered Search settings.**  
   https://search.brave.com/settings  
   Current “Answer with AI” automatic-answer toggle and adjacent Search privacy,
   locale, SafeSearch, and anonymous-metrics controls.
5. **[S5] Brave Search privacy notice.**  
   https://search.brave.com/help/privacy-policy  
   General Search privacy, service-integrity IP processing, Ask Brave server,
   encryption/state/retention, and the retained naming ambiguity.
6. **[S6] Brave Search Help, “Sharing conversations with AI.”**  
   https://search.brave.com/help/sharing-conversations-with-ai  
   Exact 2025-09-25 follow-up transition and Ask Brave state/retention boundary.
7. **[S7] Brave Search Help, “Safe Search.”**  
   https://search.brave.com/help/safesearch  
   Off/Moderate/Strict policy and adult-content suppression for Answer with AI.
8. **[S8] Brave, “Brave Search introduces the Summarizer…”** (2023-03-02).  
   https://brave.com/blog/ai-summarizer/  
   Historical predecessor pipeline, citation philosophy, real-time claim,
   candidate classifiers, known errors, and opt-out. Used only as lineage.
9. **[S9] Brave, “Introducing AI Grounding with Brave Search API”**
   (2025-08-05; updated 2025-09-01).  
   https://brave.com/blog/ai-grounding/  
   Shared grounding lineage, consumer power claim, single- versus multi-search
   distinction, vendor benchmark and caveats. API schema is not transferred.
10. **[S10] Brave Search product page.**  
    https://brave.com/search/  
    Current SERP answer positioning, source-citation claim, ads/Premium context,
    and distinction from Ask Brave and Search API.
11. **[S11] Brave Search Help, “How to use Brave Search: an overview.”**  
    https://search.brave.com/help/  
    Ordinary SERP flow, recency/region filters, ads/Premium, and historical
    Summarizer presentation.
12. **[S12] Brave Search Help, “Ads in Brave Search.”**  
    https://search.brave.com/help/ads  
    Anonymous/marked Search Ads and Premium ad removal.
13. **[S13] Brave Search Help, “What is Brave Search Premium?”**  
    https://search.brave.com/help/premium  
    Ad-free entitlement and Brave Browser exclusivity; no AI-specific benefit.
14. **[S14] Brave Search Help, “Anonymous cookies.”**  
    https://search.brave.com/help/anonymous-cookies  
    Published finite preference-cookie list and absence of an AI-specific ID.
15. **[S15] Brave Search Help, “Anonymous usage metrics.”**  
    https://search.brave.com/help/usage-metrics  
    Default/opt-out, aggregate fields, explicit noncollection, Ask usage counts.
16. **[S16] Brave, consumer Terms of Use** (last updated 2023-05-11).  
    https://brave.com/terms-of-use/  
    Service change/limits, conduct/access controls, as-is and reliance terms.
17. **[S17] Brave Search Help, “Google fallback mixing.”**  
    https://search.brave.com/help/google-fallback  
    Optional client-side fallback behavior; no documented AI Answers linkage.
18. **[S18] Brave Search Help, “Search Operators.”**  
    https://search.brave.com/help/operators  
    Current ordinary retrieval controls; no guarantee of AI Answers propagation.
19. **[S19] Brave Search Help, “Financial data disclaimers.”**  
    https://search.brave.com/help/finance-disclaimer  
    Provider, delay, verification, advice, and reuse boundaries for financial
    search data.
20. **[S20] Brave, “Brave Search now features its AI-powered CodeLLM…”**
    (2024-01-10; updated 2024-08-23).  
    https://brave.com/blog/codellm/  
    Historical specialist query detection outside the LLM and merger into
    Answer with AI; used only as architecture lineage.
