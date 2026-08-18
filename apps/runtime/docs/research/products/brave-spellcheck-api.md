# Brave Spellcheck API: clean-room product dossier

**Date and source access:** 2026-08-17  
**Product boundary:** the standalone Brave Search API
`GET /res/v1/spellcheck/search`, not consumer Brave Search, browser spellcheck,
Autosuggest, or the spelling option embedded in Web/Image/News/Video/LLM
Context search. Integrated spellcheck is compared only where its semantics
prevent a false equivalence.  
**Status:** research evidence and recommendations; not an implementation,
purchase, benchmark, legal opinion, or authorization to call the service.  
**Clean-room boundary:** public first-party Brave documentation and Brave's
public skill repository only. No credentials, endpoint calls, paid tests,
traffic interception, bypass, decompilation, or private artifacts were used.

## Executive verdict

**ADAPTED as a contract and query-understanding reference; REJECTED as an
owned query-understanding substrate (high confidence).** Brave exposes a small,
useful full-query correction contract: a bounded original query plus language
and country hints goes in; zero or more corrected query strings come out. The
standalone surface is inexpensive—**$5 per 10,000 successful requests**, with
an advertised **100 requests/second** capacity and $5 monthly credit—and can be
used before retrieval rather than silently rewriting a search [S1-S4].

Its apparent simplicity hides material uncertainty. Brave publishes no
correction confidence, token/edit alignment, explanation, candidate limit,
ranking/calibration semantics, detected/effective locale, model family/version,
training corpus, dictionary ownership, update cadence, false-correction rate,
or sensitive-domain behavior [S1-S3]. “Contextual” and “search patterns” are
vendor claims, not an algorithm disclosure [S1]. Country and language are only
hints. An empty `results` array means no correction was found, not proof that the
input is correct [S1-S3].

The privacy boundary is consequential: the endpoint is GET-only, so the entire
query is placed in the URL; API query records may be retained for up to 90 days.
Brave says it does not collect identifiers linking an API query to an end user
or device, but the customer can often make that link and owns the notice and
consent obligations. Enterprise Zero Data Retention (ZDR) is optional and still
subject to legal obligations [S2, S8]. Curiosity should therefore treat remote
spellchecking as third-party disclosure and never send secrets, private corpus
text, exact identifiers, or sensitive free text by default.

The strongest clean-room lessons are:

1. preserve original, normalized, suggested, accepted, and executed queries as
   separate artifacts;
2. make language, market, and correction policy explicit, while recording that
   locale controls are preferences rather than guarantees;
3. return alternatives with evidence and calibrated uncertainty rather than an
   unexplained replacement string;
4. do not equate “no suggestion” with “correct,” or a suggestion with user
   intent;
5. keep remote correction off sensitive-query paths unless retention and
   disclosure authority are explicit; and
6. separate provider-neutral query understanding from provider adapters and
   keep every external correction bounded and reversible.

## 1. Decision frame and bounded questions

### 1.1 Decision

What should Curiosity learn from Brave Spellcheck API as a standalone product
without copying proprietary behavior, disclosing sensitive queries by default,
or coupling query understanding to a hosted provider?

### 1.2 Bounded sub-questions

1. What exactly are the transport, query, locale, response, version, and error
   contracts?
2. What correction behavior and confidence are documented, and what remains
   unknown?
3. What can be established about model/data ownership and the relationship to
   Brave Search?
4. What privacy, sensitive-query, terms, rate, availability, and price
   constraints matter operationally?
5. Which public architectural clues safely transfer to an owned,
   provider-neutral query-understanding layer?

**Depth budget:** first-party public sources for all requested categories;
contract triangulation across the service guide, rendered API reference, and
official skill; one bounded pass over pricing, privacy, terms, rate/versioning,
security, and status. No live correction-quality/latency test, paid account,
contract negotiation, model extraction, or jurisdiction-specific legal
analysis. Stop when public sources saturate or the remaining question requires
credentials, private implementation access, contractual interpretation, or
sensitive data.

Labels below:

- **FACT** — directly supported by cited first-party material.
- **INFERENCE** — reasoned conclusion, not directly verified.
- **RECOMMENDATION** — proposed Curiosity choice.
- Confidence is **high**, **medium**, or **low**.

## 2. Product role and boundaries

**FACT (high):** Brave describes the product as query spell correction for
search applications, “Did you mean?” interfaces, data cleanup, autocorrect, and
query analysis. It claims full-query context, spelling-error detection, corrected
alternatives, low latency, multiple languages, country-specific corrections,
and use of query context and search patterns [S1, S3]. No public SLO or measured
quality evidence accompanies those claims.

**FACT (high):** Brave's official skill says most search endpoints already have
spellcheck built in and recommends the standalone API only when the correction
is needed before search or for a “Did you mean?” UI. It specifically names Web
Search and LLM Context as defaulting integrated spellcheck to true [S3].

**FACT (high):** Autosuggest is a separate endpoint and product: it completes
partial queries, can tolerate typos, and can return multiple/rich suggestions.
Those are not documented capabilities of standalone Spellcheck [S12].

**FACT (high):** standalone and integrated spellcheck must not be treated as the
same contract:

| Concern | Standalone Spellcheck | Search-integrated spelling |
| --- | --- | --- |
| Primary output | correction suggestions only | search results plus query metadata |
| User control | caller may show/accept/reject suggestion | Web docs say an altered query is always searched when enabled |
| Response placement | `results[].query` | typically `query.altered` |
| Search side effect | none documented | retrieval occurs using correction |
| Commercial unit | Spellcheck request | request to the selected search product |

Sources: [S1-S3, S13].

**INFERENCE (high):** standalone Spellcheck is best modeled as a hosted query
transformation service, not a dictionary API, language detector, tokenizer,
grammar checker, transliterator, named-entity resolver, intent classifier, or
retrieval service. Those capabilities are neither inputs nor typed outputs.

## 3. Request and localization contract

### 3.1 Transport and authentication

**FACT (high):** the public reference lists only:

```http
GET https://api.search.brave.com/res/v1/spellcheck/search
X-Subscription-Token: <API_KEY>
Accept: application/json
```

The token header is required. Brave says keys are confidential, must not be
placed in client-side code or public locations, and can be created/revoked in
the dashboard [S2, S9]. No POST equivalent is documented.

**INFERENCE (high):** because `q` is a GET query parameter, query text can be
captured by customer-side URL, reverse-proxy, observability, browser-history,
or intermediary logging independently of Brave's own retention. HTTPS protects
the URL in transit from ordinary network observation but does not remove it from
endpoint and infrastructure logs.

**RECOMMENDATION (high):** if ever authorized, call server-to-server only; never
embed the subscription token in a browser/mobile client; suppress query strings
from traces, metrics, exception messages, and access logs; and use structured
redaction before constructing the URL.

### 3.2 Query and locale inputs

| Input | Contract | Important semantic |
| --- | --- | --- |
| `q` | required, non-empty string; maximum 400 characters and 50 words | complete phrase to correct |
| `lang` | optional enum; default `en` | language preference; only a hint when calculating responses |
| `country` | optional enum; default `US` | country preference; only a hint when calculating responses |
| `Api-Version` | optional `YYYY-MM-DD`; latest if omitted | pins dated incompatible behavior |
| `Accept` | `application/json` or `*/*`; default JSON | response media type |
| `Cache-Control` | only documented value `no-cache` | asks for no cached content, best effort |
| `User-Agent` | optional string | Brave says device description may alter experience |

Sources: [S2, S3, S6].

**FACT (high):** the rendered reference currently enumerates **52** language
codes:

```text
ar eu bn bg ca zh-hans zh-hant hr cs da nl en en-gb et fi fr gl de el
gu he hi hu is it ja jp kn ko lv lt ms ml mr nb pl pt-br pt-pt pa ro ru
sr sk sl es sv ta te th tr uk vi
```

and **38** country values:

```text
AR AU AT BE BR CA CL DK FI FR DE GR HK IN ID IT JP KR MY MX NL NZ NO CN
PL PT PH RU SA ZA ES SE CH TW TR GB US ALL
```

The values must be treated as Brave enums, not assumed standards: the language
list contains both `ja` and `jp`, region/script variants vary in form, and the
country list includes `ALL` [S2].

**FACT (high, documentation contradiction):** the official skill says “51 codes
supported,” while its examples and the current rendered reference expose a list
of 52. The reference should govern a pinned integration, but exact enums must be
archived and contract-tested before use [S2, S3].

**FACT (high):** `lang` and `country` are explicitly hints. The standalone
response documents neither detected language nor effective language/country,
and there is no UI-language parameter [S2, S3].

**INFERENCE (high):** a correction cannot prove that it is linguistically valid
for the requested dialect or country. The independent controls likely influence
candidate generation and/or scoring, but their interaction, fallback chain, and
precedence are not public.

**UNKNOWN (high relevance):** unsupported-code behavior; mixed-language and
code-switching behavior; script detection; diacritics; transliteration;
right-to-left handling; capitalization and punctuation preservation; regional
vocabulary; locale fallback; and whether `country=ALL` removes, broadens, or
merely weakens country preference.

## 4. Response and correction semantics

### 4.1 Documented shape

**FACT (high):** the success contract is deliberately small [S1-S3]:

```json
{
  "type": "spellcheck",
  "query": { "original": "artifical inteligence" },
  "results": [
    { "query": "artificial intelligence" }
  ]
}
```

| Field | Documented meaning |
| --- | --- |
| `type` | constant/default `spellcheck` |
| `query.original` | input query as requested |
| `results` | array of spell-checked results; defaults to `[]` |
| `results[].query` | complete spellcheck-corrected query string |

**FACT (high):** examples show one complete correction for a typo and for a
two-word typo, and an empty array for an already-correct example. The official
skill states the array “may be empty when no correction is found” [S1, S3].

**INFERENCE (high):** an empty list means only that the service emitted no
candidate. It cannot distinguish “correct,” unknown word/name, unsupported
language, low internal confidence, policy suppression, or candidate-generation
failure. The success schema has no reason/status discriminator.

### 4.2 Alternatives, ranking, and confidence

**FACT (high):** `results` is an array, so the schema can represent multiple
alternatives. However, all public examples contain at most one, and no maximum,
ordering promise, uniqueness promise, or score is documented [S1-S3].

**FACT (high):** the contract exposes no:

- confidence or probability;
- correction reason/type;
- token, character, or edit spans;
- edit distance;
- per-token alternatives;
- detected language/effective locale;
- candidate rank explanation;
- “safe to auto-apply” flag;
- dictionary/entity/proper-noun provenance;
- model or data version; or
- explicit unchanged candidate.

Sources: [S1-S3].

**FACT (medium, vendor claim):** Brave calls correction “contextual” and says it
uses full-query context and search patterns rather than merely processing words
independently [S1, S3]. Public documentation provides examples, not validation,
and does not define “search patterns.”

**INFERENCE (medium):** a plausible minimal serving path is locale-conditioned
candidate generation followed by query-context/search-pattern scoring and a
threshold deciding whether to emit an alternative. That explains the hints,
full-query output, contextual claim, ordered array shape, and empty-list case.
It does **not** establish whether the backend uses dictionaries, finite-state
methods, edit-distance indexes, n-grams, neural models, search-result evidence,
query frequencies, or an ensemble.

**RECOMMENDATION (high):** never auto-apply a Brave standalone suggestion in a
high-impact or ambiguous flow. Preserve it as an opaque provider hypothesis,
show it reversibly where appropriate, and execute the user's original query or
both bounded variants according to explicit policy. Do not manufacture a
numeric confidence from result position or presence.

### 4.3 Normalization and intent risks

**FACT (high):** Brave's service guide recommends preserving user intent,
showing “Did you mean?” gracefully, permitting the original search, and
highlighting differences [S1]. The API itself does not return differences.

**INFERENCE (high):** callers must compute a display diff, but a byte/character
diff is presentation evidence—not an explanation of Brave's reasoning. Unicode
normalization, grapheme segmentation, scripts, and tokenization can make naive
diffs misleading.

**UNKNOWN:** behavior for quoted phrases, search operators, URLs, email-like
strings, product codes, medication names, legal citations, usernames, emerging
entities, profanity, adversarial strings, and queries already normalized by
another stage. The standalone contract has no operator-awareness or protected-
span input.

## 5. Data, model, and intellectual-property ownership

**FACT (high, not legal advice):** the standard terms state that, as between the
parties, Brave owns the API, documentation, marks, and Search Results, subject
to third-party rights; the customer owns Search Query Data. The customer grants
Brave a worldwide, irrevocable, non-exclusive, sublicensable, royalty-free
license **during the term** to use Search Query Data with the API, provide Search
Results, and otherwise perform under the agreement [S7].

**FACT (high):** standard terms prohibit, unless an Order Form changes them,
non-transient Search Result storage, derivative works, redistribution/resale,
reverse engineering, limit bypass, API replication/replacement, and use of
Search Results to create, evaluate, train, retrain, fine-tune, benchmark, or
improve AI models/services. Search Results must be erased after termination;
Brave may terminate for convenience on ten days' notice [S7].

**FACT (high):** Brave's public `brave-search-skills` repository publishes a
human-readable Spellcheck integration under that repository's MIT license. It
contains request/response documentation, not the spellchecking backend or model.
The repository license does not license Brave's service implementation, model,
correction outputs, or private corpora [S3, S14].

**UNKNOWN (high relevance):** Brave does not publicly identify the standalone
spellcheck model family, weights owner, dictionary/lexicon sources and licenses,
training/evaluation corpora, use of customer query logs for improvement, human
labeling, search-index dependency, update cadence, tenant isolation, or whether
corrections are shared identically with consumer/integrated Search.

**CAUTION (high):** “search patterns” must not be expanded into a claim that API
customer logs train the model. The privacy notice gives billing,
troubleshooting, abuse-prevention, and legal purposes for query-log retention;
the public sources reviewed do not expressly document model training on those
logs [S1, S8]. Negative result retained.

**RECOMMENDATION (high):** Curiosity may independently specify concepts such as
locale hints, alternatives, reversibility, and correction traces. It must not
use Brave outputs to train, evaluate, benchmark, or tune query-understanding
models under standard terms, or attempt behavioral/model extraction. Any use
requires exact Order Form and legal review.

## 6. Privacy and sensitive queries

### 6.1 Published API privacy boundary

**FACT (high):** API access requires an account, subscription, and payment
details. Stripe processes payment information. Brave retains a record of API
search queries for a maximum of **90 days** for billing and troubleshooting,
subject to legal obligations; its processing table also identifies abuse
prevention. Enterprise clients can request ZDR, subject to legal obligations
[S8].

**FACT (high):** Brave says it does not collect identifiers that can link a
query to an individual or device, and says it knows the customer account making
the call but not the end user. It also states that query data may be personal
data for the customer because the customer may hold linkage information. The
customer is responsible for applicable privacy notice and consent obligations;
Brave excludes Search Query Data from its DPA [S8].

**CAUTION (high):** “no end-user identifier” is not anonymity. Query text itself
can contain names, account numbers, symptoms, addresses, secrets, or rare
phrases, while the request is still attributable to a customer account. The
privacy notice's legal characterization is Brave's position, not a universal
finding for Curiosity or every jurisdiction [S8].

**FACT (medium, vendor assurance):** Brave reports SOC 2 Type II attestation,
security/privacy review processes, Search API monitoring, and an April 2025
external penetration test [S11]. These controls do not change query disclosure,
90-day standard retention, or Curiosity's need for a data-flow threat model.

### 6.2 Sensitive-query policy for Curiosity

**RECOMMENDATION (high):** default-deny remote spellcheck for:

- credentials, tokens, recovery phrases, or secret material;
- private corpus excerpts and unpublished text;
- direct identifiers, account/order/case numbers, exact addresses, or contact
  details;
- medical, legal, financial, employment, education, or intimate free text;
- minors' data or safety reports;
- tenant-confidential names, code names, URLs, and internal identifiers; and
- any query whose provider disclosure/retention authority is absent or unclear.

Prefer local Unicode normalization, protected-span recognition, language
detection, and owned correction for those paths. If remote use is separately
authorized, minimize/redact first, send only on deliberate submit rather than
every keystroke, record provider/version/purpose/retention authority without raw
text, and provide an explicit no-remote-correction mode.

**FACT (high, documentation tension):** the service guide includes browser-style
JavaScript with `YOUR_API_KEY` and recommends caching frequent spellchecks, while
the authentication guide says never expose keys in client-side code and the
standard terms prohibit Search Result caching except transiently for operation
[S1, S7, S9]. The security guide and terms control Curiosity's design: no client
key and no durable correction cache without an Order Form expressly allowing it.

**INFERENCE (high):** debouncing reduces cost and disclosure volume but does not
make keystroke telemetry appropriate. A submit-only boundary and sensitivity
gate are stronger privacy controls than timing alone.

## 7. Errors, limits, versioning, cache, and operations

### 7.1 Input and response limits

**FACT (high):** public hard bounds are 400 characters and 50 words for `q`.
No response candidate count, response-byte, corrected-string-length, latency,
timeout, concurrency, batch, or payload-compression guarantee is published
[S1-S3]. The endpoint accepts one query per request; no batch endpoint is listed.

**RECOMMENDATION (high):** independently cap input bytes/graphemes/tokens,
response bytes, candidate count, candidate length, total latency, retries, and
cost. Reject or locally handle over-budget input before provider disclosure.

### 7.2 Error contract

**FACT (high):** the rendered reference explicitly lists [S2]:

| HTTP status | Meaning |
| ---: | --- |
| 200 | successful response |
| 404 | not found |
| 422 | unprocessable entity |
| 429 | too many requests |

Its published error shape is `type` (default `ErrorResponse`), required `error`,
and `time` (default `0`). `error` includes required `id`, integer `status`, and
application `code`, plus optional/localizable `detail` and optional `meta`.
Published application codes are `INTERNAL`, `QUOTA_LIMITED`, `RATE_LIMITED`,
`SUBSCRIPTION_TOKEN_INVALID`, `SUBSCRIPTION_NOT_FOUND`, `RESOURCE_NOT_ALLOWED`,
`OPTION_NOT_IN_PLAN`, `USAGE_LIMIT_EXCEEDED`, and `INVALID_URL` [S2].

**UNKNOWN (high relevance):** status-to-code mapping; authentication HTTP
status; 5xx and timeout body behavior; `Retry-After`; request IDs in headers;
partial response possibility; retry idempotence; maximum server processing time;
and whether every listed application code can occur on Spellcheck. The page
lists no 401, 403, or 5xx response despite auth and `INTERNAL` codes.

**RECOMMENDATION (high):** classify invalid input, authentication, entitlement,
quota, burst rate, timeout, upstream 5xx, malformed/oversize response, empty
suggestion, and unavailable separately. Honor rate headers, retry only bounded
transient classes with jitter, and never log raw query text or tokens.

### 7.3 Rate and billing semantics

**FACT (high):** Brave enforces a one-second sliding request window per
subscription and exposes `X-RateLimit-Limit`, `X-RateLimit-Policy`,
`X-RateLimit-Remaining`, and `X-RateLimit-Reset`. Multiple burst/month windows
can apply. Requests are counted on arrival, but only successful, non-error
requests consume quota and are billed; a 429 fails [S4].

**INFERENCE (high):** a client timeout does not prove the provider categorized
the request as unsuccessful. Do not assume a retry is free or deduplicated.

### 7.4 Version and cache behavior

**FACT (high):** URL `v1` is the rarely changed major version. `Api-Version:
YYYY-MM-DD` pins backward-incompatible behavior; omission selects latest. Brave
classifies new optional request parameters/properties, new resources, property
reordering, and string length/format changes as backward compatible [S6].

**FACT (high):** cached content is returned by default; `Cache-Control: no-cache`
asks otherwise only on a best-effort basis. The Spellcheck docs do not define
what is cached, cache keys, locale inclusion, freshness, lifetime, invalidation,
or whether the header changes billing [S2].

**RECOMMENDATION (high):** pin a date version, parse unknown fields additively,
and treat corrections as time/version/provider observations. A repeated query
need not remain stable as model, lexicon, search patterns, or caches change.

### 7.5 Availability

**FACT (high):** no Spellcheck-specific SLA or latency distribution is public.
The service page says “low-latency”; status history records whole-API downtime or
degradation from a migration, subsystem failure, DDoS, and failed deployment
[S1, S10]. These incidents establish shared API operational risk, not a measured
Spellcheck availability rate.

**RECOMMENDATION (high):** spellcheck must fail open to the original query. It
must never block retrieval, corrupt the original input, or trigger unbounded
retry. Record a typed stop reason such as `provider_unavailable` rather than
pretending an uncorrected query was provider-validated.

## 8. Pricing and economic shape

**FACT (high, as accessed 2026-08-17):** the Spellcheck plan is **$5 per 10,000
requests** ($0.0005 per successful request), includes **$5 in credits each
month**, and advertises **100 requests/second**. The pricing page lists
Spellcheck, Autosuggest, and Enriched Autosuggest as features under this
additional-feature plan. Enterprise offers custom terms, capacity, support, and
ZDR [S5]. Only successful requests are billed [S4].

| Successful standalone calls | List-price fee before credit |
| ---: | ---: |
| 1 | $0.0005 |
| 10,000 | $5 |
| 1,000,000 | $500 |

**INFERENCE (high):** if applied only to Spellcheck at current list price, the
monthly $5 credit offsets 10,000 successful calls. Account/payment requirements,
networking, gateway, privacy review, observability, and fallback engineering
remain real costs.

**INFERENCE (high):** calling on every keystroke multiplies query disclosure and
cost, can consume burst capacity, and generates corrections for incomplete
intent. Submit-time or deliberately debounced UI invocation is operationally
safer, but sensitive-query gating still comes first.

**UNKNOWN:** taxes, overage/credit order, regional billing, enterprise price,
committed-spend discounts, Spellcheck-specific support/SLA, and whether current
plan bundling or capacity can change without notice.

## 9. Clean-room architecture inference

### 9.1 Minimum architecture consistent with public evidence

```text
GET URL query
  -> edge/authentication
  -> entitlement + sliding-window/quota accounting
  -> request validation (non-empty, 400 chars, 50 words, locale enums)
  -> locale/context-conditioned correction service
       -> candidate generation                 [inferred]
       -> full-query/search-pattern scoring    [inferred from vendor claim]
       -> emission threshold / ordering        [inferred from [] or array]
  -> minimal response projection
  -> billing/rate headers + query-log operations
```

**FACT (high):** authentication, plan entitlement clues, validation bounds,
rate/quota headers, locale hints, minimal response shape, and 90-day operational
query records are public [S2-S5, S8-S9].

**INFERENCE (medium):** candidate generation, contextual scoring, and an
emission threshold are the smallest useful conceptual decomposition consistent
with contextual full-query correction and an empty-or-array result. They are not
claims about Brave's internal components, process boundaries, algorithms, or
deployment topology.

**UNKNOWN:** whether Spellcheck shares consumer Search query-understanding
services; uses the independent Web index; uses aggregate query/click signals;
routes by language to separate models; has deterministic inference; performs
safety filtering; or returns cached outputs before/after correction. No model,
feature store, dictionary, index, storage, or inference topology is public.

### 9.2 What must not be inferred

- “Contextual” does not establish a neural or generative model.
- “Search patterns” does not establish use of customer API query logs for
  training.
- An array does not establish meaningful n-best ranking or calibrated ordering.
- `lang`/`country` do not establish language detection or jurisdictional origin.
- Empty results do not establish correctness.
- A correction does not establish intent, safety, truth, popularity, or entity
  identity.
- Shared Brave branding does not establish exact parity among standalone,
  integrated API, consumer Search, or browser spellcheck.

## 10. Clean-room query-understanding lessons

| Public clue | Safe Curiosity lesson | Boundary |
| --- | --- | --- |
| full-query replacement [S1-S3] | make the complete candidate an explicit artifact | also preserve token/edit lineage; do not copy ranking |
| zero-or-more results [S2-S3] | model abstention separately from correctness | provider gives no abstention reason |
| contextual/search-pattern claim [S1, S3] | score candidates in query context, not token isolation only | algorithm/data sources remain private |
| independent language/country hints [S2] | separate linguistic and market preferences | hints are not effective-locale guarantees |
| no confidence [S2-S3] | require owned calibration/evidence for auto-action | never invent probability from presence/rank |
| original echoed [S1-S3] | preserve input through every transformation | echo is not immutable provenance |
| standalone before retrieval [S3] | separate query planning from retrieval execution | integrated search has different side effects |
| best-practice reversible UX [S1] | let users inspect/reject correction | API provides no edit spans |
| GET + 90-day logs [S2, S8] | query transformation has disclosure/retention policy | no remote sensitive text by default |
| additive versioning [S6] | pin versions and tolerate unknown properties | provider latest is not reproducible history |

**REJECTED (high confidence):** model extraction, probing protected behavior,
using outputs as a training/evaluation corpus, copying undocumented correction
heuristics, treating Brave suggestions as labels, or reconstructing ranking
through bulk query grids. These are unnecessary for interoperability and cross
clean-room and standard-terms boundaries [S7].

## 11. Curiosity implications and verdict ledger

| Verdict | Decision |
| --- | --- |
| **ADOPTED** | immutable original query; explicit query budgets; reversible correction; typed abstention/failure; sensitive-query local-only path; fail-open retrieval; provider/version trace |
| **ADAPTED** | `lang` + `country` into provider-neutral linguistic/market preferences with “hint” semantics; `results[]` into bounded alternatives carrying opaque provider rank; standalone pre-retrieval stage into policy-controlled query planning |
| **REJECTED** | Brave as owned query-understanding substrate; correction presence as confidence; empty result as correctness; silent auto-apply; durable output cache under standard terms; client-side token; remote correction for secrets/private text; Brave outputs for model training/evaluation/benchmarking |
| **DEFERRED** | any API pilot; exact Order Form/DPA/ZDR rights; authorized multilingual quality/latency study; protected-domain policy; exact candidate ordering/cap; commercial SLA; parity with integrated spellcheck |

### 11.1 Provider-neutral correction observation

**RECOMMENDATION (high):** Curiosity's contract should be designed from owned
needs, not copied from Brave's sparse schema:

```text
correction_request:
  original_query
  + linguistic_preferences[]
  + market_preferences[]
  + protected_spans[]
  + correction_policy         # off | suggest | bounded_parallel | auto (rare)
  + sensitivity_class
  + candidate/time/cost budgets

correction_observation:
  provider + endpoint + contract_version + model_version?
  + observed_at + requested_preferences
  + effective_locale?         # unknown if provider does not return it
  + alternatives[] {
      complete_query
      + opaque_provider_rank?
      + calibrated_confidence? # absent for Brave; never synthesized
      + edits[]? + reason? + evidence?
    }
  + abstention_reason?         # unknown_provider_reason when results=[]
  + privacy/retention_authority
  + stop_reason

execution_trace:
  original + normalized + suggested + user_accepted? + executed_queries[]
```

The core contract should permit richer owned evidence without pretending Brave
supplies it. Provider-specific unknown fields remain in an extension envelope.

### 11.2 Safe execution policy

1. Classify sensitivity and protected spans locally.
2. Preserve the exact original and create a separately versioned normalization.
3. Skip remote correction unless provider disclosure is authorized.
4. Apply explicit language/market preferences; never silently default to
   English/US for an unknown user.
5. Bound provider calls, latency, candidates, bytes, retries, and fee.
6. Validate returned strings as untrusted external data; reject controls,
   oversize output, invalid Unicode, or transformations of protected spans.
7. Preserve alternatives as hypotheses. Show a diff or search bounded variants;
   do not replace the original silently.
8. Record accepted/executed query separately and measure downstream outcomes
   only with a lawful, privacy-reviewed evaluation design.

## 12. Material unknowns and checks before any pilot

### 12.1 Unknowns

1. Model family, version, owner, lexicons/corpora/licenses, training sources,
   update cadence, and customer-log use.
2. Candidate maximum, ordering, uniqueness, determinism, internal confidence,
   threshold, and reason for empty results.
3. Precision/recall and false-correction rates by language, region, script,
   query length, and domain.
4. Mixed-language, transliteration, diacritics, Unicode normalization,
   punctuation/case, protected identifiers, and operator behavior.
5. Effective locale/fallback and the semantics of `country=ALL`, `ja` versus
   `jp`, and unsupported locale values.
6. Standalone parity with Web/LLM Context/other integrated spelling and consumer
   Brave Search.
7. Complete HTTP/auth/5xx/timeout behavior, response and candidate bounds,
   retry semantics, and Spellcheck-specific SLO/SLA.
8. Cache key, placement, lifetime, invalidation, and `no-cache` effect.
9. Exact rights for transient correction retention, user display, evaluation,
   and ZDR under a purchasable Order Form.
10. Sensitive-content policy, abuse controls, and whether corrections can echo
    or amplify harmful, identifying, or regulated text.

### 12.2 Verification gates

- **Legal/procurement:** exact Order Form, Search Result display/retention,
  evaluation/AI restrictions, termination deletion, DPA exclusion, ZDR scope,
  subprocessors, support, and attribution.
- **Privacy/security:** data-flow and threat model; server-side key management;
  URL/access-log suppression; sensitivity classifier; tenant isolation; consent;
  incident/deletion workflow.
- **Contract:** archive a pinned dated reference and exact locale enums; obtain
  complete status/code/header/size/timeout/SLA documentation from Brave.
- **License-safe offline fixtures:** customer-authored only; cover unknown fields,
  empty/multiple candidates, oversize strings, invalid Unicode, mixed scripts,
  punctuation, protected spans, and all typed failures.
- **Authorized live study:** only if the contract permits evaluation; predeclare
  multilingual and domain slices, protected synthetic queries, budget, metrics,
  retention, and deletion. Measure correction precision, harmful false changes,
  abstention, stability, locale sensitivity, candidate count, latency, and
  errors without using outputs to train or improve a model.
- **Exit:** original-query fail-open path, provider outage/termination drill,
  token revocation, and verified deletion of provider outputs.

## 13. Bounded curiosity pass

After synthesis, in-frame gaps and contradictions were scored from 1 (low) to 5
(high). Cost includes access, privacy, contractual, and clean-room risk.

| Thread | Relevance | Value | Novelty | Cost | Outcome |
| --- | ---: | ---: | ---: | ---: | --- |
| Resolve exact locale contract | 5 | 5 | 4 | 1 | **Pursued:** rendered reference exposes 52 language and 38 country values; official skill says 51 languages. Contradiction retained [S2, S3]. |
| Determine whether confidence/edits/reasons exist | 5 | 5 | 3 | 1 | **Pursued:** reference, guide, and skill expose only complete query strings; no confidence or alignment found [S1-S3]. |
| Separate empty suggestion from correctness | 5 | 5 | 4 | 1 | **Pursued:** skill says “no correction is found,” not “query is correct”; semantic negative result retained [S3]. |
| Establish standalone versus integrated side effect | 5 | 5 | 3 | 1 | **Pursued:** standalone returns suggestions; integrated Web spelling searches the altered query [S1-S3, S13]. |
| Reconcile caching/client examples with security/terms | 5 | 5 | 4 | 1 | **Pursued:** service advice conflicts with key-security and non-transient-storage constraints; strict boundary adopted [S1, S7, S9]. |
| Find model/training corpus or customer-log training statement | 5 | 5 | 5 | 2 | **Pursued:** no first-party disclosure found; privacy purposes do not expressly include model training. Unknown retained [S1, S3, S8]. |
| Probe corrections, confidence thresholds, and n-best behavior | 4 | 4 | 4 | 5 | **CURIOSITY_NO_GO:** no credentials/live-test authority; paid probing and output-based benchmarking are out of scope and terms-sensitive. |
| Reconstruct model via bulk query grids | 1 | 1 | 4 | 5 | **CURIOSITY_NO_GO:** no interoperability need; violates clean-room intent and standard reverse-engineering/AI-evaluation boundaries. |
| Infer algorithm from “contextual” marketing | 2 | 2 | 3 | 4 | **CURIOSITY_NO_GO:** multiple architectures fit the evidence; only minimal conceptual stages retained. |
| Jurisdiction-specific privacy/legal conclusion | 4 | 4 | 3 | 5 | **CURIOSITY_NO_GO:** requires counsel and Curiosity-specific data flows. |
| Exhaustively compare every integrated endpoint | 2 | 2 | 2 | 3 | **CURIOSITY_NO_GO:** standalone decision only; Web evidence is sufficient to establish semantic non-equivalence. |

**Stop condition:** requested categories are covered and the three public product
descriptions saturate the behavioral contract. Remaining high-value questions
require a reviewed contract, authorized controlled test, or private model/data
disclosure; further public marketing does not resolve them.

## 14. Primary source ledger

All sources are first-party Brave material and were accessed **2026-08-17**.
Vendor documentation proves the published contract or claim, not effective
quality, model behavior, privacy outcome, or fitness for Curiosity.

| ID | Primary source | Material used |
| --- | --- | --- |
| S1 | [Spellcheck service guide](https://api-dashboard.search.brave.com/documentation/services/spellcheck) | role, endpoint, examples, contextual/search-pattern and low-latency claims, UX/integration advice, May 1 2023 changelog |
| S2 | [Spell check API reference](https://api-dashboard.search.brave.com/api-reference/other/spell_check) | GET contract, query bounds, exact language/country enums, headers, success/error schemas and codes |
| S3 | [Official Brave Spellcheck skill](https://github.com/brave/brave-search-skills/blob/main/skills/spellcheck/SKILL.md) | plan/standalone role, 51-code claim, response fields, context-aware note, integrated alternative |
| S4 | [Rate limiting guide](https://api-dashboard.search.brave.com/documentation/guides/rate-limiting) | sliding window, rate headers, arrival counting, successful-request quota/billing |
| S5 | [API pricing](https://api-dashboard.search.brave.com/documentation/pricing) | $5/10,000, $5 monthly credit, 100 requests/second, bundled features, enterprise/ZDR |
| S6 | [API versioning](https://api-dashboard.search.brave.com/documentation/guides/versioning) | URL/date versions and compatible-change policy |
| S7 | [Search API Terms of Use](https://api-dashboard.search.brave.com/documentation/resources/terms-of-service) | 2026-02-11 rights, ownership, query-data license, restrictions, disclaimers, termination |
| S8 | [Search API privacy notice](https://api-dashboard.search.brave.com/documentation/resources/privacy-notice) | 2025-12-04 account/query data, 90-day logs, stated purposes, customer obligations, DPA exclusion, ZDR |
| S9 | [Authentication guide](https://api-dashboard.search.brave.com/documentation/guides/authentication) | token header, server-side confidentiality, rotation/revocation |
| S10 | [Status updates](https://api-dashboard.search.brave.com/documentation/resources/status-updates) | public whole-API incident history and May 23 2023 API launch date |
| S11 | [Search API security](https://api-dashboard.search.brave.com/documentation/resources/security) | security review, SOC 2 Type II claim, April 2025 penetration test, incident controls |
| S12 | [Autosuggest service guide](https://api-dashboard.search.brave.com/documentation/services/suggest) | adjacent-product boundary; typo-resilient completion and rich-result distinction |
| S13 | [Web Search service/reference evidence](https://api-dashboard.search.brave.com/api-reference/web/search/get) | integrated `spellcheck` default and altered-query search behavior |
| S14 | [Official skill repository license](https://github.com/brave/brave-search-skills/blob/main/LICENSE) | MIT scope of public skill repository, not hosted backend/output rights |

## 15. Confidence, negative results, and verification record

### Confidence summary

- **High:** endpoint/method/authentication; input bounds; locale enums and hint
  semantics; minimal output; lack of documented confidence; listed errors;
  price/rate/version/privacy/standard-terms contract.
- **Medium:** minimal candidate-generation/context-scoring/threshold architecture;
  contextual quality claim; likely operational interpretation of URL exposure.
- **Low/unknown:** algorithm/model family; training data; quality/calibration;
  integrated-product parity; cache internals; effective locale; sensitive-domain
  behavior; SLA.

### Retained negative results and contradictions

- No public confidence, probability, score, edit spans, reasons, candidate cap,
  or ordering guarantee found.
- No public model, weight, dictionary, training/evaluation corpus, update cadence,
  customer-log training, or search-index dependency disclosure found.
- No detected/effective locale, locale fallback, UI language, or per-result
  language metadata found.
- No batch/POST API, response-size bound, latency SLO, Spellcheck SLA, complete
  HTTP error catalogue, timeout contract, or cache semantics found.
- API reference lists 52 language values; official skill says 51.
- Service guide recommends browser-style integration/caching; authentication and
  standard terms require a stricter key/storage interpretation.
- Spellcheck changelog says initial launch 2023-05-01; status history says the
  Brave Search API launched 2023-05-23. This low-impact timeline discrepancy was
  not forced into a single date [S1, S10].

### Verification record

- Read the repository constitution before research.
- Triangulated standalone contract across service guide, rendered API reference,
  and official Brave skill.
- Triangulated commercial, operational, privacy, security, and ownership claims
  across pricing, rate/versioning, terms, privacy, authentication, security, and
  status pages.
- Inspected the public rendered reference's embedded schema only to read the
  documentation delivered to any browser; no private endpoint or implementation
  artifact was accessed.
- No credential, endpoint call, paid test, correction download, behavioral
  probing, model extraction, or change outside
  `docs/research/products/brave-spellcheck-api.md` was made.
