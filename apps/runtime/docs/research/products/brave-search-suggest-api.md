# Brave Search Autosuggest API: clean-room product dossier

**Research and primary-source access date:** 2026-08-17  
**Product boundary:** Brave Search API `GET /res/v1/suggest/search`, called
“Autosuggest” on the service page and “Suggest” in the API reference and
response. Standalone Spellcheck, Web Search query correction, the consumer
Brave Search UI, browser omnibox history/bookmark suggestions, and Brave News
source suggestions are out of scope except where first-party material prevents
misattribution or clarifies data lineage, privacy, or safety.  
**Status:** public-documentation research and independent architecture analysis;
not an implementation, purchase, benchmark, legal opinion, or authorization to
call the service. No credential, paid/free authenticated request, endpoint
probe, traffic capture, output corpus, or private material was used.  
**Clean-room boundary:** only publicly available Brave documentation, policies,
help pages, product pages, and Brave's public Search skill file were examined.
No attempt was made to recover proprietary candidate-generation, ranking,
moderation, entity-resolution, or caching code.

## Executive verdict

**ADAPTED as a small query-assistance contract; REJECTED as an authoritative
query-understanding, safety, trend, or evidence source (high confidence).** The
API turns one partial query into at most 20 ordered query strings. Language and
country are relevance hints rather than constraints. A paid rich mode can add
optional entity classification, title, description, and image. It is designed
for low-latency typeahead, is typo-resilient, and has a separate commercial
plan priced at **$5 per 10,000 successful requests**, including $5 monthly
credit and advertised capacity of 100 requests/second [S1-S5].

Its greatest clean-room lesson is the separation of **literal user input** from
**ranked candidate formulations**, with locale as explicit context and entity
enrichment remaining optional. Its most important warning is what the tiny
contract omits: no candidate ID, source, generation method, popularity or trend
metric, timestamp, freshness control, score, rank reason, safety control,
moderation label, confidence, explanation, or executed-search trace is exposed
[S1-S3]. A suggestion is therefore a provider-authored prompt candidate—not a
fact, popularity measurement, safe recommendation, or faithful statement of the
user's intent.

Public Brave material supports a broad relevance-data story: Brave owns and
operates its search index and ranking stack; its opt-in Web Discovery Project
(WDP) can contribute unlinkable query/click/visit signals, including keyword
popularity and query recency, after sensitive-input checks [S10-S12]. **It does
not establish that this API's candidates come from the Web index, WDP, consumer
Brave searches, an entity graph, editorial inputs, or any particular mixture.**
The minimum defensible reconstruction is a Brave-hosted, typo-tolerant,
locale-conditioned candidate retrieval/ranking service with an optional entity
enrichment lane. Everything below that abstraction remains unknown.

The sensitive-query posture is inadequate for automatic research expansion.
Autosuggest exposes no SafeSearch/sensitivity parameter or output warning.
WDP's checks prevent some personal or sensitive queries from entering that
specific contribution stream; they do not prove suppression of unsafe,
defamatory, sexual, self-harm, discriminatory, illegal, or privacy-invasive
suggestions at serving time [S1-S3, S11]. Ordinary API query records may be kept
for up to 90 days, while enterprise customers can negotiate Zero Data Retention
(ZDR) [S6, S13]. Curiosity should not send secrets, identifiers, private user
fragments, or regulated data to the ordinary endpoint.

## 1. Decision frame and bounded questions

### 1.1 Decision

What can Curiosity safely learn from Brave's standalone Autosuggest product
without copying private behavior, confusing popularity with truth, leaking
incremental user input, or allowing externally ranked strings to drive
unbounded search?

### 1.2 Bounded sub-questions

1. What request, response, version, and error shapes are publicly documented?
2. What do language, country, user-agent, cache, and “real-time” claims mean—and
   not mean—for locale and freshness?
3. What is known about candidate generation, typo handling, entity enrichment,
   source-data ownership, and ranking?
4. What privacy and sensitive-query risks arise when every keystroke-like prefix
   can become a server request?
5. What commercial limits, billing semantics, rights, and operational gaps
   constrain use?
6. What minimum architecture is consistent with the public contract?
7. Which provider-neutral query-understanding patterns should Curiosity adopt,
   adapt, reject, or defer?

**Research budget:** first-party public sources sufficient to cover every
requested category and triangulate material contract, commercial, privacy, and
lineage claims. No live testing, quality sampling, paid access, private schema
discovery, exhaustive locale transcription, proprietary algorithm inference,
or legal interpretation. Stop on coverage, saturation, or when the remaining
question requires vendor clarification or prohibited access.

Labels used throughout:

- **FACT** — directly stated or shown by cited first-party material.
- **INFERENCE** — the narrowest architecture or behavior conclusion consistent
  with cited facts; not an observation of Brave internals.
- **RECOMMENDATION** — an independently authored Curiosity choice.
- Confidence is **high**, **medium**, or **low** for the claim as scoped.

## 2. Product identity and boundary

**FACT (high):** Brave introduced the search-suggestions endpoint on 2023-05-01.
The service is now presented as “Autosuggest,” while the reference names it
“Suggest,” the response discriminator is `"suggest"`, and the official skill is
named `suggest` [S1-S3]. These are names for the same endpoint, not distinct API
products.

**FACT (high):** the endpoint is:

```http
GET https://api.search.brave.com/res/v1/suggest/search
X-Subscription-Token: <secret>
```

Only GET is documented. There is no POST equivalent, streaming interface,
batch request, cursor, feedback endpoint, or session object [S1-S3].

**FACT (high):** Brave positions it for search boxes, query formulation and
refinement, content discovery, mobile typeahead, and trending/related topics.
The official skill additionally suggests RAG query expansion and entity
detection [S1, S3]. These are vendor-recommended uses, not guarantees that a
candidate preserves intent, is factual, or improves retrieval.

**FACT (high):** standalone Spellcheck is a separate endpoint with a one-or-few
correction contract. Autosuggest is itself described as typo-resilient; it does
not expose a `spellcheck` switch or say which characters were corrected [S1-S3,
S14, S15]. Web Search's built-in correction and Autosuggest must not be modeled
as the same operation.

**INFERENCE (high):** the product is best modeled as:

```text
partial text + weak locale context -> ordered provider query candidates
                                     -> optional display enrichment
```

It is not a semantic parser, intent classifier, trend analytics API, entity
authority, search-results API, factual answer service, or evidence source.

## 3. Public request contract

### 3.1 Query parameters

| Input | Type/default/bound | Documented meaning | Contract caveat |
| --- | --- | --- | --- |
| `q` | required string; non-empty; max 400 characters and 50 words | partial suggest query | No minimum prefix policy, normalization trace, or byte limit is documented. |
| `lang` | finite string enum; default `en` | preferred suggestion language; code length 2+ | Explicitly only a hint; not a language filter or guaranteed output language. |
| `country` | finite two-character enum; default `US` | country from which suggestions could come | Explicitly only a hint; not a provenance, residency, or legal-jurisdiction constraint. |
| `count` | integer 1–20; default 5 | desired number of results | Actual result count can be lower; no total is returned. |
| `rich` | boolean; default false | request entity-oriented enrichment | Requires a paid Autosuggest subscription; optional fields can still be absent. |

Sources: [S1-S3]. The official skill says `country` can be `ALL`, while the
rendered reference presents a finite country enum but collapses most values.
The skill says 51 language codes are supported; the reference rendering shows
three values plus “49 more,” which appears to imply 52. **UNKNOWN:** whether this
is counting drift, documentation error, or an `ALL`/alias distinction. Archive
the dated machine-readable enum before any implementation rather than hard-code
counts from prose.

### 3.2 Headers, transport, and version

| Header | Public behavior |
| --- | --- |
| `X-Subscription-Token` | Required API key. Brave says it must not be exposed in client-side code or public locations. |
| `Api-Version` | Optional date `YYYY-MM-DD`; omission selects the latest behavior. |
| `Accept` | `application/json` or `*/*`; JSON is default. |
| `Accept-Encoding` | Official examples recommend `gzip`. |
| `Cache-Control: no-cache` | Best-effort request to avoid Brave's default cached content. |
| `User-Agent` | Brave may provide a different experience based on device class encoded in the string. |

Sources: [S2, S3, S8, S9].

**FACT (high):** URL major version and dated header version are independent.
Brave treats adding optional response fields as backward-compatible, while
removal, rename, or type changes require a dated version transition. A caller
that omits `Api-Version` accepts the latest contract [S9].

**RECOMMENDATION (high):** a browser must not call this token-authenticated API
directly. A separately authorized integration would need a server-side boundary,
per-user privacy controls, prefix minimization, debounce, cancellation, and
strict budget enforcement. The service page's JavaScript sample embeds a token
placeholder in `fetch`; it does not override the authentication guide's explicit
instruction never to expose an actual key client-side [S1, S8].

### 3.3 Important absent controls

**FACT (high):** the reference documents no:

- SafeSearch, adult, violence, self-harm, hate, illegal-content, or sensitive-
  person control;
- spelling on/off, literal-prefix-only, exact-match, or “do not rewrite” mode;
- freshness/date/trending window, as-of time, timezone, or recency policy;
- UI locale distinct from suggestion language;
- exact location, latitude/longitude, region, or city;
- personalization, session, prior-query, history, account, or user identifier;
- domain/source, category, vertical, entity type, or allow/deny filter;
- score threshold, diversity, deduplication, or ranking mode;
- pagination, offset, cursor, snapshot, or stable seed;
- operator-parsing or Goggles policy control [S1-S3].

**INFERENCE (high):** absence of a personalization parameter means the public
contract does not request user history. It does **not** prove candidates are
globally identical across callers: country, language, user-agent, cache state,
time, API version, and undisclosed server-side updates can all change output.

## 4. Response contract

### 4.1 Basic envelope

**FACT (high):** successful status 200 returns:

```text
type: "suggest"
query:
  original: string
results[]:
  query: string
```

`query.original` is the only returned query trace. `results` defaults to an
empty array. In ordinary non-rich mode, each result contains only `query`
[S1-S3].

**FACT (high):** the array is presented as the list of suggestions; its order is
the only exposed rank signal. There is no candidate ID, rank integer, numeric
score, probability, confidence, feature contribution, source, explanation,
timestamp, or relation to the input [S1-S3].

**INFERENCE (high):** array position can be retained as `provider_rank`, but
must not be transformed into calibrated relevance or probability. Empty results
can mean no candidates, suppression, unsupported locale, cache state, or another
unknown condition; the envelope has no reason code.

### 4.2 Rich suggestions

**FACT (high):** with `rich=true`, the official service page and skill document
these optional result members:

| Field | Meaning stated by Brave | Limitation |
| --- | --- | --- |
| `query` | suggested query text | Still the only required candidate value. |
| `is_entity` | whether enriched suggestion is an entity | No entity ID, ontology, type, confidence, or resolution reason. |
| `title` | enriched title | No source, language, or factual provenance. |
| `description` | enriched description | No source URL, passage, timestamp, or attribution. |
| `img` | enriched image URL | No owner, creator, license, content hash, dimensions, or durability contract. |

Fields with null values are omitted. A rich result can therefore carry only
`query`, or report `is_entity: false` without the descriptive fields [S1, S3].

The service guide's illustrative rich response additionally shows a `type`
member (`entity` or `query`), but the official skill's field table omits that
member, and the endpoint reference's rendered child schema is collapsed [S1-S3].
**UNKNOWN:** whether `results[].type` is a current guaranteed field, merely an
illustrative example, plan/version dependent, or documentation drift. A parser
would need additive unknown-field handling and dated fixtures.

**INFERENCE (high):** `is_entity` is a provider assertion for presentation, not
an identity binding. “Albert Einstein” could denote a person, query topic,
title, organization fragment, or ambiguous name; without a stable entity ID and
source graph, Curiosity cannot safely merge it with an owned entity.

**RECOMMENDATION (high):** treat all strings and URLs as untrusted external data.
Escape text, proxy or independently validate display media only when rights and
security permit, constrain URL schemes/hosts/bytes, and never execute or quote
rich descriptions as evidence.

### 4.3 No effective-context echo

**FACT (high):** the response does not echo effective `lang`, `country`,
`rich`, `count`, cache disposition, API date version, generation time, or safety
policy [S1-S3].

**INFERENCE (high):** a caller can preserve what it requested but cannot prove
from the body which hint was applied, whether fallback occurred, whether output
was cached, or which serving snapshot generated it.

## 5. Locale and freshness semantics

### 5.1 Locale

**FACT (high):** Brave calls both `lang` and `country` hints for calculating
suggest responses. The service guide says suggestions “adapt” to country and
language preferences; the stronger word does not convert either parameter into
a hard filter [S1-S3].

**INFERENCE (high):** country likely selects or weights a market context, while
language weights lexical candidates. Their exact ordering, fallback, script
handling, multilingual mixing, transliteration, and treatment of `ALL` are not
published.

**UNKNOWN:** output language detection; country-to-language priors; locale
fallback chain; script normalization; diacritics; transliteration; code-switch
behavior; regional spelling; minority-language coverage; whether user-agent
device class alters wording or only presentation-oriented selection.

**RECOMMENDATION (high):** Curiosity should represent:

```text
input_language?          # detected/declared language of typed text
preferred_languages[]   # caller ordering
market?                 # weak relevance context
ui_locale?               # presentation, distinct from candidate language
locale_strictness       # hint | require | no_preference
```

An adapter must mark Brave locale enforcement as `hint`, not silently satisfy a
hard language or jurisdiction requirement.

### 5.2 Freshness and “real-time”

**FACT (high):** Brave calls the product “real-time query autocompletion,” “as
users type,” and suitable for surfacing “trending or related topics.” Its
official skill claims design latency below 100 ms. These are service-positioning
and latency claims, not candidate freshness guarantees [S1, S3].

**FACT (high):** `Cache-Control: no-cache` is only best effort, and Brave returns
cached content by default. The request has no freshness window and the response
has no generated-at, candidate-observed-at, popularity period, trend period, or
cache-age field [S2].

**FACT (high, broader relevance context):** WDP documentation says Brave needs
to understand how recent searches are for keywords and how popular keywords
are. WDP contributes only a fraction of eligible queries and associated clicks
under an opt-in, unlinkable process [S11]. This describes one Brave relevance
signal system, not the Autosuggest generator.

**INFERENCE (high):** “real-time” is best read as interactive serving latency.
It does not prove real-time ingestion, trending detection, current-event
coverage, monotonic updates, or uncached computation.

**RECOMMENDATION (high):** never label a suggestion “trending,” “popular,” or
“fresh” unless the provider supplies a defined metric/window or Curiosity has an
independently measured, rights-cleared signal. Store only `observed_at` for the
API interaction under permitted terms; do not invent a candidate timestamp.

## 6. Candidate generation, data ownership, and ranking

### 6.1 Directly supported facts

- **FACT (high):** Brave says Autosuggest returns contextually relevant query
  completions, is resilient to common typos, and optionally detects/enriches
  entity-oriented suggestions [S1, S3].
- **FACT (high):** country and language can affect relevance calculations, and
  user-agent can affect experience [S1-S3].
- **FACT (high, general stack):** Brave says its Search API uses Brave's own
  proprietary Web index and ranking algorithms rather than a scraper, and that
  Brave controls the crawl-to-endpoint stack [S10, S13].
- **FACT (high, general relevance input):** WDP can contribute unlinkable search
  queries, result clicks, visited URLs, engagement, and page metadata. Brave
  says these signals help keyword popularity/recency and result relevance
  [S11, S12].
- **FACT (high, contractual ownership):** as between customer and Brave, Brave's
  terms assign Brave ownership of Search Results subject to third-party rights;
  the customer owns Search Query Data and grants Brave a broad license during
  the term to use it to provide the API and perform the agreement [S7].
- **FACT (high):** WDP's pooled, unlinkable contribution records cannot be tied
  back to a contributor or selectively removed; Brave says it erases WDP data
  after one year [S11]. This is separate from API query-log retention [S6].

### 6.2 Claims the sources do not support

No first-party source found in scope says Autosuggest candidates are generated
from:

- the text of Brave's Web index;
- consumer Brave Search query logs;
- API customer queries;
- WDP contributions;
- clicked-query pairs, browser history, editorial lists, an entity graph,
  language models, or third-party feeds;
- a prefix trie, finite-state transducer, neural retriever, popularity table,
  spell model, or hybrid system.

Likewise, no source defines candidate eligibility, minimum frequency, update
cadence, bot/spam resistance, deduplication, diversity, entity authority, or
removal/appeal policy.

**INFERENCE (high):** the general independent-index claim cannot be narrowed to
“every suggestion is derived from Brave's index.” Suggestions are strings, not
indexed pages, and rich entities may require a distinct data path. Any stronger
claim would conflate the overall Search API architecture with an undocumented
subsystem.

### 6.3 Narrow architecture inference

The minimum architecture consistent with the public surface is:

```text
authenticated prefix request
  q + lang hint + country hint + user-agent + rich flag
                    |
                    v
          bounds / normalization
                    |
                    v
     typo-tolerant candidate retrieval
          (source corpus unknown)
                    |
                    v
   locale/market-conditioned eligibility + ranking
       (safety/moderation stage unknown)
                    |
              top K (<=20)
             /             \
       basic strings     optional entity enrichment
             \             /
          cache/version serialization
                    |
         ordered `results[]` response
```

**INFERENCE (medium):** typo resilience implies a fuzzy retrieval or
normalization stage in addition to literal prefix lookup. Rich mode implies
entity classification/resolution and metadata/image lookup can occur separately
from base candidate generation. These are capability layers, not claims about
algorithms or physical services.

**INFERENCE (medium):** a shared or adjacent popularity/relevance signal store
would be architecturally economical given Brave's broader WDP and ranking stack,
but public sources do not prove reuse. This inference must not become a
Curiosity requirement or attribution claim.

### 6.4 Ranking opacity

**FACT (high):** neither endpoint docs nor skill expose ranking factors,
weights, learning objective, score, tie-break, trend boost, popularity count,
prefix quality, entity boost, diversity rule, or moderation demotion [S1-S3].

**UNKNOWN:** whether order optimizes completion probability, search likelihood,
click utility, lexical closeness, popularity, recency, geographic affinity,
entity prominence, safety, diversity, or a multi-objective combination.

**RECOMMENDATION (high):** retain provider order for traceability, but rerank or
filter only with independently defined Curiosity policy. Never infer aggregate
public interest, demographic preference, endorsement, or truth from rank.

## 7. Privacy and sensitive-query safety

### 7.1 API query privacy

**FACT (high):** the API privacy notice says Brave retains a record of queries
submitted through a customer's Search API account for at most 90 days for
billing and troubleshooting, subject to legal obligations. Brave says it does
not collect identifiers that can tie a query to an individual/device, but the
customer account is known and API logs can include IP address and authentication
token for billing/troubleshooting and abuse prevention [S6].

**FACT (high):** enterprise plans can negotiate ZDR. Brave says ZDR prevents
query retention, while the ordinary published notice remains the baseline
[S4, S6, S13].

**FACT (high):** customers are responsible for applicable privacy notices,
consents, end-user obligations, and conduct through their applications [S6,
S7].

**INFERENCE (high):** search-as-you-type magnifies exposure: successive prefixes
can disclose a name, diagnosis, account number, address, allegation, or secret
before the user submits a final query. Debounce reduces request volume but does
not make the transmitted content non-sensitive.

**RECOMMENDATION (high):** default Curiosity policy should not send prefixes to
external providers. If separately approved, require explicit user action or a
declared interactive mode; local prefilters for secrets/PII; minimum useful
prefix length; 150–300 ms debounce; cancellation; no request on every keystroke;
server-held key; no client/session identifier beyond operational necessity;
shortest permitted local trace; and ZDR/contract review for regulated contexts.

### 7.2 Collection safety is not serving safety

**FACT (high):** WDP is opt-in and filters contribution candidates on-device.
Queries that look like email addresses, phone numbers, hashes, or other personal
data are discarded; long/unique URLs and authenticated/capability URLs are also
excluded. Records are unlinkable and cannot form user sessions [S11, S12].

**FACT (high):** those protections govern data contributed through WDP. The
Autosuggest request contract has no analogous documented PII rejection,
sensitive-query classifier, k-anonymity threshold, minimum popularity,
SafeSearch switch, or output moderation field [S1-S3, S11].

**INFERENCE (high):** WDP filtering cannot be cited as proof that Autosuggest
will neither accept nor emit sensitive strings. Other candidate sources may
exist, and serving policy is undocumented.

### 7.3 Content safety

**FACT (high):** Brave's API security page describes phishing/malware blacklists,
CSAM scanning, and right-to-be-forgotten processing for the search index [S12].
The terms also prohibit customer applications involving illegal, hateful,
abusive, obscene, surveillance, hacking, or otherwise offensive uses [S7].

**FACT (high):** no first-party source found applies a specific Autosuggest
serving filter, documents suppression categories, or provides an appeal/report
mechanism for a suggestion. No output marks adult, offensive, sensitive-person,
defamatory, protected-class, self-harm, election, health, legal, or financial
content [S1-S3].

**RECOMMENDATION (high):** Curiosity must put a policy gate after any external
suggestion and before display or execution. At minimum: PII/secrets, sexual
content involving minors, self-harm, violence, hate/harassment, illegal
facilitation, defamatory person completions, medical/legal/financial high-stakes
inference, protected traits, and prompt/code injection patterns. Suppression
must be reason-coded and auditable without retaining the sensitive plaintext
longer than policy permits.

### 7.4 Suggestion harm model

A suggestion can harm even if a later search would be lawful:

1. **Intent steering:** ranked completions can turn an ambiguous prefix into an
   allegation, stereotype, or sensational claim.
2. **False popularity:** users may interpret appearance/order as what “people
   search,” although no metric is exposed.
3. **Entity conflation:** `is_entity` can encourage merging ambiguous names.
4. **Privacy leakage:** prefix transmission happens before deliberate submit.
5. **Automation amplification:** RAG expansion can execute several provider
   suggestions and feed a feedback loop.
6. **Freshness illusion:** a cached completion can appear current.
7. **Rich-content authority:** polished titles/descriptions/images can look
   verified despite absent provenance.

**RECOMMENDATION (high):** user-facing copy should say “suggested query,” not
“related fact,” “popular search,” or “recommended investigation.” Automatic
execution requires a declared goal, policy approval, deduplication, and a hard
branch/cost/time cap.

## 8. Errors, limits, pricing, and operations

### 8.1 Documented statuses and error envelope

**FACT (high):** the Suggest reference documents:

| Status | Meaning in reference | Public shape |
| --- | --- | --- |
| 200 | success | `type`, required `query`, `results[]` |
| 404 | not found | `type: "ErrorResponse"`, required `error`, integer `time` |
| 422 | unprocessable entity | same high-level error envelope |
| 429 | too many requests | same high-level error envelope |

The rendered reference does not expose the child members of `error` [S2]. It
does not list 400, 401/403, 408, 5xx, gateway, network, or timeout behavior,
although such outcomes must be operationally expected.

**UNKNOWN:** error code/message/details schema; whether invalid token is 401 or
403; `time` units/meaning; request ID; retry headers; timeout; idempotent retry
guidance; malformed UTF-8/control-character handling; and Autosuggest-specific
SLA.

**RECOMMENDATION (high):** classify failures as authentication, validation,
quota, provider transient, network, and schema errors. Retry only bounded
transients/429 with jitter and server reset guidance; never retry validation or
credential failures blindly. Empty success is not an error.

### 8.2 Rate limits and billing

**FACT (high):** current Autosuggest pricing is **$5 per 10,000 requests**, with
$5 monthly credits and advertised capacity of **100 requests/second**. Both the
Autosuggest and Spellcheck pricing cards list Spellcheck, Autosuggest, and
enriched Autosuggest as included features [S4]. This is materially cheaper and
higher-capacity than the Search plan, but it is a separate product family.

**FACT (high):** limits use a one-second sliding window per subscription, and
plans can also have monthly quotas. Responses expose
`X-RateLimit-{Limit,Policy,Remaining,Reset}`. Brave says only successful,
non-error requests count against quota and billing [S5].

**FACT (high):** the service page says rich suggestions require the Autosuggest
plan. The official skill header says the Suggest plan, while one parameter note
says “Paid Search plan required.” Pricing places enriched Autosuggest under the
Autosuggest/Spellcheck add-ons [S1, S3, S4]. **CONTRADICTION:** plan naming in
the skill is inconsistent; current pricing/service pages are stronger for
procurement, but entitlement must be confirmed in an actual subscription/order
form.

**INFERENCE (high):** at list price, each successful request is $0.0005 and the
$5 credit nominally covers 10,000 requests, before taxes or negotiated terms.
Interactive typeahead can still multiply cost rapidly because one user intent
can generate several successful prefix requests.

**RECOMMENDATION (high):** budget by **interaction**, not final query. Enforce
requests-per-edit-session, debounce, repeated-prefix cache subject to contract,
max candidates, cancellation, and global cost/rate ceilings. Client caching is
recommended by Brave's service guide, but terms permit only transient storage
needed for application operation [S1, S7]; retention duration needs written
interpretation.

### 8.3 Availability and change risk

**FACT (high):** Brave publishes a general API status page and incident history,
including whole-API key disablement, subsystem failure, DDoS degradation, and
deployment-related throughput loss [S16]. This is not an Autosuggest SLA.

**FACT (high):** Brave may update the API, require a current version, suspend
access, and terminate on ten days' notice under standard terms. Customers must
delete Search Results and cease use at termination unless an Order Form says
otherwise [S7].

**RECOMMENDATION (high):** suggestions must be optional enhancement, never a
hard dependency for query submission. A user must always be able to submit the
literal input or proceed with locally derived query understanding.

## 9. Rights, storage, and trust boundary

**FACT (high):** standard terms prohibit non-transient storage/cache/database
creation from Search Results, derivative works, redistribution/resale,
replicating/replacing the API, reverse engineering, rate-limit bypass, and use
of Search Results to create, evaluate, train, fine-tune, benchmark, or improve
AI models/services [S7].

**FACT (high):** Brave disclaims accuracy, completeness, uninterrupted service,
security, and fitness; third-party content may carry third-party rights. Rich
image/title/description fields do not transfer ownership or reuse permission
[S7].

**INFERENCE (high):** collecting a historical suggestion corpus to train
Curiosity, measure longitudinal trends, imitate Brave ranking, or benchmark a
query model is outside the standard rights and clean-room boundary. This dossier
records public contract facts only; it contains no retained API output from a
live call.

**RECOMMENDATION (high):** before any pilot, obtain written answers for transient
cache duration, incident traces, user-visible display, rich image proxying,
evaluation, deletion, and whether model-assisted query planning counts as an AI
service use prohibited by standard terms.

## 10. Clean-room query-understanding lessons

### 10.1 Transferable patterns

| Public clue | Independent lesson | Boundary |
| --- | --- | --- |
| original query echoed [S1-S3] | preserve literal input separately from all derived candidates | echo is not a full normalization trace |
| max-20 ordered strings [S2] | keep query branching small and explicit | provider rank is not confidence |
| locale as hints [S2, S3] | model language and market as weak context | never claim hard locale compliance |
| typo resilience [S1, S3] | fuzzy candidate retrieval can improve incomplete inputs | preserve whether/how intent changed |
| optional rich entity lane [S1, S3] | entity linking is separate from lexical completion | no identity merge without owned ID/evidence |
| default caching + no-cache best effort [S2] | latency and freshness are separate contracts | no cache flag proves freshness |
| sparse optional schema [S3] | parse additively and tolerate absent enrichment | do not depend on illustrations |
| one-second rate policy [S5] | interactive expansion needs request/session budgets | 100 RPS is capacity, not a target |
| no safety controls [S1-S3] | serving safety must be an explicit owned stage | WDP collection checks cannot substitute |
| 90-day logs / optional ZDR [S6, S13] | prefix privacy is a first-class routing decision | “no end-user ID” is not no retention |

### 10.2 What not to copy

**REJECT:** opaque rank as a proxy for likelihood or truth; optional entity flag
as identity; country as jurisdiction; language as validation; `no-cache` as an
as-of guarantee; provider suggestions as automatic query branches; rich text as
evidence; live prefixes as harmless telemetry; and WDP's private methodology as
the implementation blueprint.

**DEFER:** provider evaluation, locale quality, freshness, safety rates,
duplication, latency, and typo behavior until rights and an authorized test plan
exist. The standard terms' AI evaluation/benchmark restriction is a gate, not a
detail.

## 11. Exact Curiosity implications

### 11.1 Provider-neutral contract

**RECOMMENDATION (high):** keep provider objects behind an adapter boundary:

```text
SuggestionRequest
  literal_prefix
  input_language?
  preferred_languages[]
  market?
  locale_strictness: hint | require | none
  max_candidates <= policy_limit
  enrichment: none | entity_preview
  sensitivity_class
  user_activation: explicit | interactive_approved
  latency_budget_ms + request_budget + cost_budget

SuggestionObservation
  provider + endpoint + api_version?
  requested_context + unsupported_controls[]
  literal_prefix_hash_or_redacted_trace
  observed_at
  cache_directive_requested
  result_count + stop_reason + rate/cost accounting

SuggestionCandidate
  text
  provider_rank
  relation: completion | correction | expansion | unknown
  provider_entity_claim?
  untrusted_title? + untrusted_description? + untrusted_image_url?
  policy_decision + policy_reasons[]
  provenance: provider_suggestion_only
```

Because Brave does not expose the relation, all its candidates begin as
`relation=unknown`; Curiosity may independently classify but must retain the raw
provider observation separately.

### 11.2 Query trace

Curiosity should preserve these as distinct values:

```text
literal_prefix       # exactly what user typed, locally where possible
normalized_prefix    # independently specified Unicode/space normalization
candidate_text       # untrusted external suggestion
selected_text        # what user/agent explicitly chose
executed_query       # final query actually sent to retrieval
```

**RECOMMENDATION (high):** never overwrite `literal_prefix` with a suggestion.
Highlight changes, especially names, negation, numbers, quoted phrases, medical
terms, and protected traits. The user should be able to submit the literal text.

### 11.3 Bounded automatic expansion

If caller authority explicitly permits non-interactive query expansion:

1. Start from a declared research question and sensitivity class.
2. Generate local deterministic variants first.
3. Route to an external suggest provider only if privacy/terms permit.
4. Fetch at most one bounded candidate set per root, not recursively per
   suggestion.
5. Apply safety, semantic-distance, duplicate, and scope gates.
6. Execute at most a caller-declared number of branches under cost/time limits.
7. Preserve each parent/child edge and rejection reason.
8. Never cite a suggestion; cite independently retrieved source evidence.
9. Stop on coverage, saturation, budget exhaustion, or contradiction resolution.

**RECOMMENDATION (high):** recursive provider-suggestion expansion is rejected.
It creates popularity feedback, intent drift, privacy multiplication, and
unbounded fan-out without evidence.

### 11.4 Entity handling

Rich results should enter only a provisional resolver:

```text
ProviderEntityClaim
  label/title/description/image
  provider_boolean_is_entity
  no_stable_id = true
  no_source_provenance = true
  resolution_status = unresolved
```

Resolve against owned, cited entity evidence; do not let a provider description
create or merge an identity. Images need separate rights, fetch-security, and
lineage treatment.

## 12. Fact / inference / recommendation verdict ledger

| ID | Type | Claim / decision | Evidence | Confidence | Verdict |
| --- | --- | --- | --- | --- | --- |
| A1 | FACT | GET endpoint returns up to 20 ordered query candidates. | S1-S3 | High | **ADAPTED** as bounded candidate interface. |
| A2 | FACT | `lang` and `country` are hints, not filters. | S2, S3 | High | **ADOPTED** distinction between preference and constraint. |
| A3 | FACT | Rich mode adds optional entity/title/description/image fields. | S1, S3 | High | **ADAPTED** as untrusted preview only. |
| A4 | FACT | No IDs, scores, reasons, sources, timestamps, or effective-context echo are documented. | S1-S3 | High | **REJECTED** as authoritative query understanding. |
| A5 | FACT | No SafeSearch/sensitivity input or moderation output is documented. | S1-S3 | High | **REJECTED** for ungated display/execution. |
| A6 | FACT | Brave describes typo-resilient, contextually relevant completions. | S1, S3 | High for vendor claim | **DEFERRED** quality until authorized measurement. |
| A7 | FACT | WDP can supply unlinkable query/click/recency/popularity signals after sensitive-input filtering. | S11, S12 | High | **ADAPTED** only as a privacy design clue. |
| A8 | INFERENCE | WDP or Web-index data may support suggestions, but no source proves it. | S1-S3, S10-S12 | Medium possibility / high uncertainty | **REJECTED** as attribution claim. |
| A9 | INFERENCE | Minimum serving path is bounds/normalization, fuzzy candidate retrieval, locale-conditioned ranking, optional enrichment, and caching. | S1-S3 | Medium | **ADAPTED** as conceptual decomposition only. |
| A10 | FACT | Ordinary API query records can persist up to 90 days; enterprise ZDR is optional. | S6, S13 | High | **REJECTED** for sensitive prefixes absent approved terms. |
| A11 | FACT | Autosuggest costs $5/10,000 successful requests with $5 credit and 100 RPS advertised capacity. | S4, S5 | High | **ADAPTED** into interaction-level budgets. |
| A12 | FACT | Standard terms restrict storage, derivatives, redistribution, replacement, reverse engineering, and AI evaluation/training. | S7 | High | **REJECTED** for corpus/benchmark/model use absent written rights. |
| A13 | RECOMMENDATION | Preserve literal, candidate, selected, and executed query separately. | Analysis | High | **ADOPTED**. |
| A14 | RECOMMENDATION | External suggestions require privacy and safety gates and no recursive fan-out. | Analysis | High | **ADOPTED**. |
| A15 | RECOMMENDATION | Rich entity claims require independent identity resolution and cited evidence. | Analysis | High | **ADOPTED**. |

## 13. Unknowns, negative results, and verification gates

### 13.1 Material unknowns retained

1. Candidate source corpus and proportions: Web index, WDP, consumer/API query
   aggregates, entity data, editorial sources, third parties, or other inputs.
2. Candidate eligibility, frequency/privacy threshold, bot/spam defenses,
   deletion, takedown, and appeal behavior.
3. Ranking objective, factors, weights, trend/popularity windows, diversity,
   deduplication, and tie-breaking.
4. Refresh cadence, cache TTL, cache-key dimensions, regional replication, and
   meaning of best-effort `no-cache`.
5. Typo algorithm, normalization, Unicode, script, transliteration, and relation
   between Autosuggest and standalone Spellcheck.
6. Entity ontology, source, stable identity, confidence, update path, and rich
   image provenance/rights.
7. Serving-time safety policy and outcomes for adult, violent, self-harm, hate,
   illegal, defamatory, sensitive-person, and regulated topics.
8. Exact locale enum count, `ALL` support, fallback, output language, and market
   behavior.
9. Whether `results[].type` is contractual, versioned, or illustrative.
10. Full error schema, status coverage, `time` semantics, timeouts, retries,
    request IDs, and endpoint-specific SLA.
11. Exact entitlement for rich mode given official skill plan-name drift.
12. Rights under an actual Order Form for transient caching, user display,
    evaluation, traces, ZDR, and AI-assisted research.

### 13.2 Negative source results

- No documented stable suggestion/entity ID, score, confidence, rank reason, or
  source provenance found.
- No documented generated-at, observed-at, popularity count/window, trend score,
  freshness filter, snapshot, or cache age found.
- No documented SafeSearch, PII, sensitive-query, minimum-frequency, or
  moderation control/label found for Autosuggest.
- No documented guarantee that candidates are literal completions, rather than
  corrections, expansions, or related queries.
- No documented relation from a suggestion to Web results, pages, clicks, WDP,
  query logs, or an entity graph found.
- No documented personalization/session/history parameter found.
- No documented POST, batch, stream, pagination, cursor, total, or feedback API
  found.
- No documented source/license/creator information for rich text or images
  found.
- No public ranking algorithm or candidate-generation code found; public Brave
  browser and WDP materials describe adjacent systems, not this backend.
- No live behavior was tested; latency, locale quality, safety, drift, cache,
  errors, duplication, and rich-field conformance remain empirically unverified.

### 13.3 Gates before any authorized pilot

- **Legal/procurement:** Order Form; interactive display and transient-cache
  rights; AI/evaluation restrictions; rich-content rights; DPA/ZDR; deletion;
  termination; SLA; plan entitlement.
- **Privacy/security:** data-flow and threat model; prefix PII/secret classifier;
  explicit end-user notice/choice; server-side key; log redaction; retention;
  abuse and prompt-injection controls.
- **Contract:** dated schema and enum archive; pinned `Api-Version`; full errors;
  rich `type` clarification; locale fallback; cache semantics; safety policy.
- **Offline fixtures:** customer-created synthetic fixtures only; empty and
  missing-rich fields, unknown fields, invalid URLs, bidi/control characters,
  confusables, long Unicode, duplicate candidates, malicious markup, and entity
  ambiguity.
- **Authorized live study:** only if terms expressly permit evaluation. Measure
  p50/p95 latency, cache/drift, locale/script behavior, typo intent preservation,
  duplicate rate, entity precision, sensitive-output rates, malformed-input
  errors, cancellation/rate behavior, and cost per user interaction.
- **Exit:** literal-query path independent of provider; key revocation; deletion
  of result traces under contract; ten-day termination readiness.

## 14. Bounded curiosity pass

In-frame gaps were scored 1 (low) to 5 (high). Cost includes access, legal,
privacy, and clean-room risk. Follow-up authority allowed public first-party
research only—no live service use.

| Thread | Relevance | Value | Novelty | Cost | Outcome |
| --- | ---: | ---: | ---: | ---: | --- |
| Establish exact basic/rich schema | 5 | 5 | 4 | 1 | **Pursued:** reference, service guide, product example, and official skill triangulate core fields; `results[].type` drift remains [S1-S3, S10]. |
| Establish locale strength/fallback | 5 | 5 | 3 | 1 | **Pursued:** both dimensions are explicitly hints; fallback and enum-count discrepancy remain [S2, S3]. |
| Find candidate data lineage | 5 | 5 | 5 | 2 | **Pursued:** broader owned index/WDP context found, but no source binds either to Autosuggest; negative result retained [S10-S12]. |
| Find serving-time sensitive-query policy | 5 | 5 | 5 | 2 | **Pursued:** WDP collection filters and general index security found; no Autosuggest serving guarantee/control found [S1-S3, S11, S12]. |
| Reconcile rich-plan entitlement | 4 | 4 | 3 | 1 | **Pursued:** pricing/service support Autosuggest add-on; skill contains “Search plan” inconsistency [S1, S3, S4]. |
| Recover hidden error child schema from site internals | 3 | 2 | 2 | 4 | **CURIOSITY_NO_GO:** rendered public contract is sufficient to retain the gap; site reverse engineering adds risk and little decision value. |
| Infer rank weights from sampled prefixes | 5 | 2 | 5 | 5 | **CURIOSITY_NO_GO:** credentials/live calls prohibited; statistically weak, proprietary, and terms-sensitive. |
| Build historical output corpus to measure trends | 4 | 3 | 4 | 5 | **CURIOSITY_NO_GO:** prohibited live collection and standard storage/evaluation restrictions; no defined trend metric. |
| Transfer consumer browser omnibox behavior | 2 | 1 | 2 | 2 | **CURIOSITY_NO_GO:** history/bookmark/default-engine suggestions are a different client product and would misattribute behavior [S17]. |
| Treat WDP source as Autosuggest implementation | 4 | 1 | 4 | 4 | **CURIOSITY_NO_GO:** adjacent public system only; no lineage evidence and clean-room boundary forbids copying internals. |
| Negotiate ZDR and special rights | 4 | 4 | 2 | 5 | **CURIOSITY_NO_GO:** no procurement authority or concrete deployment. |

**Stop condition:** coverage and saturation. The public endpoint/service/skill,
pricing, version/rate guides, privacy/terms, general architecture, WDP, and
security sources cover all requested categories. Remaining high-value gaps
require vendor clarification, an Order Form, or caller-authorized testing under
express evaluation rights.

## 15. Primary source ledger

All sources are first-party Brave materials accessed **2026-08-17**. They prove
published contracts and vendor statements, not runtime conformance or
comparative quality.

| ID | Primary source | Material used |
| --- | --- | --- |
| S1 | [Autosuggest service guide](https://api-dashboard.search.brave.com/documentation/services/suggest) | identity, use cases, endpoint, basic/rich examples, typo resilience, debounce/cache recommendations, launch date |
| S2 | [Suggest GET reference](https://api-dashboard.search.brave.com/api-reference/other/suggestions) | exact request bounds/defaults/hints, headers, success/error envelope, documented statuses |
| S3 | [Official Brave Suggest skill](https://github.com/brave/brave-search-skills/blob/main/skills/suggest/SKILL.md) | expanded rich schema, null omission, locale notes, latency claim, plan wording |
| S4 | [Current pricing](https://api-dashboard.search.brave.com/documentation/pricing) | Autosuggest/Spellcheck price, monthly credit, 100 RPS, enriched entitlement, enterprise options |
| S5 | [Rate limiting](https://api-dashboard.search.brave.com/documentation/guides/rate-limiting) | one-second sliding window, quota headers, successful-request billing |
| S6 | [API privacy notice](https://api-dashboard.search.brave.com/documentation/resources/privacy-notice) | 90-day query records, account/IP/token processing, customer duties, enterprise ZDR |
| S7 | [Search API Terms of Use](https://api-dashboard.search.brave.com/documentation/resources/terms-of-service) | 2026-02-11 terms, ownership, query license, storage/derivative/AI/reverse-engineering restrictions, disclaimers, suspension/termination |
| S8 | [Authentication guide](https://api-dashboard.search.brave.com/documentation/guides/authentication) | key header, client-side exposure prohibition, rotation |
| S9 | [Versioning guide](https://api-dashboard.search.brave.com/documentation/guides/versioning) | URL/date versioning and compatibility rules |
| S10 | [Brave Search API product page](https://brave.com/search/api/) | official basic Suggest sample, overall index positioning, plan/product context |
| S11 | [Web Discovery Project help](https://support.brave.app/hc/en-us/articles/4409406835469-What-is-the-Web-Discovery-Project-) | opt-in query/click/visit signals, recency/popularity purpose, unlinkability, sensitive-query checks, one-year erasure |
| S12 | [API security](https://api-dashboard.search.brave.com/documentation/resources/security) and [Brave Browser privacy—WDP](https://brave.com/privacy/browser/#web-discovery-project) | general index inclusion/security controls; independent corroboration of WDP sensitive-input filtering |
| S13 | [Search API ZDR architecture](https://brave.com/blog/search-api-zero-data-retention/) | vendor claim of owned crawl/index/ranking path and enterprise no-query-retention option |
| S14 | [Spellcheck service guide](https://api-dashboard.search.brave.com/documentation/services/spellcheck) | separate product boundary, context-aware correction, best practices |
| S15 | [Official Brave Spellcheck skill](https://github.com/brave/brave-search-skills/blob/main/skills/spellcheck/SKILL.md) | separate endpoint/schema and query-context correction boundary |
| S16 | [Status updates](https://api-dashboard.search.brave.com/documentation/resources/status-updates) | general API incident history and live status |
| S17 | [Brave default search/browser suggestions help](https://support.brave.app/hc/en-us/articles/360017479752-How-do-I-set-my-default-search-engine) | separate browser setting; suggestions send text to default engine, off by default and disabled in Private browsing |

## 16. Verification record

- Read the repository constitution before research and wrote only this dossier.
- Cross-checked endpoint, query bounds, defaults, locale-hint wording, count,
  basic/rich fields, pricing, capacity, billing, versioning, privacy retention,
  and terms across independent first-party pages.
- Preserved documentation contradictions for language-enum count,
  `results[].type`, and rich-plan naming instead of silently choosing one.
- Distinguished API privacy from consumer Search privacy and WDP collection
  privacy; did not project consumer guarantees onto the authenticated API.
- Retained negative results for candidate lineage, ranking, freshness, and
  serving-time safety rather than inferring private mechanisms.
- Performed no authenticated or unauthenticated API call, paid test, output
  collection, code implementation, or edit outside this file.
