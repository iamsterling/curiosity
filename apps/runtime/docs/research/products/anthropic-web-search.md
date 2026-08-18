# Anthropic Web Search: clean-room product and architecture study

**Access date:** 2026-08-17  
**Subject:** Anthropic's server-executed Web Search tool in the Claude Messages
API, with adjacent Web Fetch behavior only where it reveals the search boundary.  
**Decision:** which observable contract and control ideas should inform a
from-scratch, owned agent-search system for `opencode2-curiosity`, and which
hosted/product-specific choices should be rejected.  
**Status:** competitor research, not implementation, endorsement, benchmark, or
legal advice.

## Executive verdict

Anthropic's strongest product idea is not a novel public search schema. It is a
server-side **agent loop** in which Claude decides whether and how to search,
can issue progressive queries, receives opaque search evidence, and returns
passage-level citations in one Messages response. The integration has several
good control precedents: a per-request `max_uses`, request and organization
domain policies, approximate location, typed in-band tool failures, explicit
usage metering, immutable encrypted continuation state, and a separate fetch
capability for full-page reading [S1][S2][S3].

Those ideas should be **ADAPTED**, not cloned. Anthropic does not expose corpus
coverage, rank scores or reasons, result count control, provider identity in the
Claude response, capture/version identity, stable passage offsets, claimed
publication time, retrieval time, freshness filters, or a no-search/coverage
explanation. The public contract is answer-centric and vendor-stateful:
`encrypted_content` and `encrypted_index` must be round-tripped unchanged, and
the provider controls retrieval, result filtering, query refinement, and the
server loop [S1]. Google Cloud's official integration documentation further
states that Claude web search sends derived queries to a third-party provider
selected by Anthropic and lists Brave Search; Anthropic separately documents a
`Claude-SearchBot` that indexes content to improve search quality [S8][S9]. The
exact corpus composition and ranking path remain undisclosed.

**Overall verdict — REJECTED as a foundation; ADAPTED as a control and envelope
reference (high confidence).** `opencode2-curiosity` should retain its neutral
`web_search` ABI, researcher-only permission, explicit untrusted-data marker,
and caller-framed curiosity budget. It should add an owned evidence envelope
and budget ledger rather than reproduce Anthropic's encrypted vendor handles or
give the retrieval plane model-selected code execution by default.

## 1. Frame, bounded questions, and method

### 1.1 Questions

1. What product versions and request/response contracts are publicly observable?
2. Where are hard bounds applied, and where can authority or cost escape them?
3. What domain, localization, citation, freshness, safety, privacy, and failure
   controls exist?
4. What can be inferred—without claiming hidden implementation details—about
   search providers, retrieval depth, filtering, and the server-side loop?
5. Which behaviors should `opencode2-curiosity` adopt, adapt, reject, or defer?

### 1.2 Clean-room method and limits

This report uses public Anthropic documentation, Anthropic's public generated
SDK type declarations as contract corroboration, Google's official Claude
integration documentation, and public behavior described in those sources.
No credentials or paid calls were used; no access controls were bypassed; no
private traffic, binaries, prompts, or service-implementation source was
inspected; public generated SDK declarations were used only to corroborate the
wire types; no vendor output was used to seed an index; and no implementation
was produced.

Vendor documentation proves that a documented feature or behavior exists; it
does not prove quality, completeness, latency, comparative superiority, or the
hidden architecture. Marketing terms such as “real-time” and customer quotes
are not accepted as benchmarks. All web sources were accessed 2026-08-17.

Labels:

- **FACT** — directly supported by a cited primary or official source.
- **INFERENCE** — bounded explanation consistent with facts but not confirmed.
- **RECOMMENDATION** — proposed project response.
- Confidence is **high**, **medium**, or **low**.

## 2. Product surface and version history

### 2.1 Current tool versions

Anthropic documents three concurrently available, generally available search
tool types [S1][S4]:

| Tool type | Publicly documented delta | Default invocation path | Material boundary |
| --- | --- | --- | --- |
| `web_search_20250305` | Basic web search | `allowed_callers: ["direct"]` when omitted | Eligible for ZDR when the organization has a ZDR arrangement and an eligible model/configuration [S2][S6]. |
| `web_search_20260209` | Adds dynamic filtering | code execution (`code_execution_20260120`) | Claude writes/runs filtering code before selected results enter model context; not ZDR-eligible by default [S1][S2]. |
| `web_search_20260318` | Adds `response_inclusion` | code execution by default | Can omit result/call pairs consumed by completed code execution; released in platform notes on 2026-06-11 despite the date in the type name [S1][S4][S10]. |

**FACT (high):** a date suffix is a behavior/schema version, not necessarily the
public release date. Anthropic says older versions remain available and both old
and new versions can be current, selected by needed capability [S4]. Pinning a
dated type therefore gives better compatibility than an undated “latest” alias.

**FACT (high):** later versions can be forced back to direct invocation with
`allowed_callers: ["direct"]`. This disables dynamic filtering and restores ZDR
eligibility for an otherwise eligible request. Models that do not support
programmatic tool calling require direct mode [S1][S2].

**Surface variation:** Anthropic's current first-party page says direct and
dynamic search are available on the Claude API, Claude Platform on AWS, and
Anthropic-hosted Microsoft Foundry; Google Cloud supports basic search only;
Amazon Bedrock does not support it [S1]. Google's surface uses its own enablement,
organization-policy, VPC Service Controls, model, and sometimes undated-type
rules [S8]. Treat deployment surface as part of the compatibility key.

### 2.2 Historical evolution

- **2025-05-07:** Anthropic announced API web search for then-current Sonnet and
  Haiku models at $10/1,000 searches. The launch already described model-chosen
  queries, query refinement, progressive multi-search, citations, `max_uses`,
  domain controls, and organization enablement [S5].
- **2025-09-10:** the launch post records the addition of Web Fetch, establishing
  a product distinction between discovery/search and retrieving a specified
  page [S5].
- **2026-02-09 family:** current docs identify dynamic filtering as the new
  capability, implemented through provisioned code execution [S1][S2].
- **2026-05-18:** platform release notes say Web Search began returning richer
  SEC filing data. No public field-level schema change or completeness guarantee
  accompanies that statement [S10].
- **2026-06-11:** `web_search_20260318` added response-inclusion control without
  a beta header [S10].

**INFERENCE (medium):** versioning is capability-keyed while result quality and
vertical enrichment can change behind a pinned tool type. Type pinning limits
wire/behavior drift but does not freeze corpus, ranking, extraction, or provider
behavior.

## 3. Request contract

Web Search is an Anthropic-executed server tool embedded in `POST /v1/messages`.
The client declares it in `tools`; Claude emits a `server_tool_use`; Anthropic
executes it and returns the matching result in the same assistant turn under
normal conditions [S1][S2]. A representative definition is:

```json
{
  "type": "web_search_20250305",
  "name": "web_search",
  "max_uses": 5,
  "allowed_domains": ["example.com/docs"],
  "user_location": {
    "type": "approximate",
    "city": "San Francisco",
    "region": "California",
    "country": "US",
    "timezone": "America/Los_Angeles"
  },
  "allowed_callers": ["direct"]
}
```

For later versions, `response_inclusion: "full" | "excluded"` is also
available; `full` is the default [S1]. Generic tool properties such as
`cache_control`, `defer_loading`, and `strict` are documented separately [S4].

### 3.1 Tool input chosen by Claude

The observed call input is minimal:

```json
{
  "type": "server_tool_use",
  "id": "srvtoolu_...",
  "name": "web_search",
  "input": { "query": "claude shannon birth date" }
}
```

The application does not submit a query directly to a search endpoint. It
submits messages and tool policy; Claude decides whether to call the tool and
generates the query. System prompts can encourage or discourage search, and an
explicit user request tends to trigger it, but Anthropic documents `max_uses`—
not prompt text—as the hard search-count constraint [S1].

### 3.2 Domain controls

**FACT (high):** `allowed_domains` and `blocked_domains` are mutually exclusive;
providing both returns HTTP 400. Entries omit schemes, include subdomains by
default, may identify a specific subdomain, and may include paths for Web Search.
Wildcards are allowed only in paths, not domain labels [S1][S2].

Request restrictions compose with organization restrictions. A request allow
list must be a subset of the organization allow list. Organization-blocked
domains are removed from a request allow list; some other policy mismatches are
validation errors [S2]. Organization administrators can disable Web Search
entirely; then a request declaring it fails with HTTP 400 rather than an in-band
search error [S1].

Anthropic explicitly warns that visually confusable Unicode domains can bypass
naive domain-filter review and recommends ASCII-only policy entries [S2].

**Unknown:** no current public limit on domain entry count or total serialized
length was found. `request_too_large` is documented for a search request whose
domain filter list is too long, but no threshold is stated [S1].

### 3.3 Localization

`user_location.type` must be `approximate`, with at least one of city, region,
ISO 3166-1 alpha-2 country, or IANA timezone. Unsupported country codes produce
HTTP 400 [S1]. This is a relevance hint, not a jurisdiction, residency, language,
or geofence guarantee. The consumer Claude product may infer location from IP
for localized answers; the API contract instead exposes an explicit approximate
location object [S1][S11].

**Negative result:** no API parameter was found for result language, UI language,
market, coordinates/radius, safe-search level, date range, freshness window,
sort order, result count, source type, or “as of” time.

## 4. Bounds, cost control, and authority

### 4.1 What `max_uses` actually bounds

**FACT (high):** `max_uses` limits the number of searches performed in an API
request. One search is one use regardless of result count. If Claude attempts
another search, the next result is an in-band `max_uses_exceeded` error. Anthropic
says simple facts typically take 1–3 searches while comparative/multi-entity
research can take 10 or more [S1].

**Unknown (material):** Anthropic does not document a default `max_uses`, a
minimum/maximum accepted integer, or the precise accounting behavior across a
`pause_turn` continuation. The official generated Python type is merely an
optional integer and supplies no range [S7]. Absence of a documented default
must not be treated as an implicit safe cap.

Other independent bounds exist but do not replace search authority:

- `max_tokens` bounds generated output, not search count or search-result input.
- Messages requests are limited to 32 MB [S12].
- Domain filters and organization policy bound reachable result domains [S2].
- Workspace/organization spend and Messages rate limits can bound aggregate
  service usage, but published rate tables do not give a universal numeric
  search-specific limit [S13].
- Batch search is throttled per organization, with the actual search limit shown
  in Console; batches are charged like regular requests [S1].

### 4.2 Who holds authority

| Actor | Observable authority |
| --- | --- |
| Organization administrator | Enable/disable Web Search and set organization domain restrictions [S1][S2]. |
| Application developer | Select model/tool version, expose the tool, set `max_uses`, domains, location, caller route, response inclusion, messages, and system policy. |
| User | Supply intent and may explicitly request or forbid search in prompt text; prompt text is steering, not the hard policy boundary [S1]. |
| Claude | Decide whether to search, formulate/refine queries, repeat searches, select evidence, and synthesize an answer [S1][S5]. |
| Anthropic/server stack | Execute the loop, choose provider/infrastructure, filter/encode results, meter uses, enforce policy, and pause long turns. |
| Search provider / indexed sites | Determine upstream coverage, ranking inputs, content availability, and data handling within their boundaries [S8][S9]. |

`allowed_callers` controls whether Claude invokes search directly or through
Anthropic code execution. It is **not** a substitute for application RBAC or user
consent. Likewise, `response_inclusion: "excluded"` reduces returned payload and
token cost only for results consumed by completed code execution; direct or
paused results remain full [S1]. Omitting evidence blocks trades away client
auditability and should not be confused with reduced agent authority.

### 4.3 Agent-loop lifecycle

Normally, search call and result blocks are paired by `tool_use_id` in one
assistant message. Long-running loops can return `stop_reason: "pause_turn"`;
the client must append the assistant content unchanged, preserve the same tools,
and continue. A continuation can pause again, and Anthropic explicitly tells
clients to cap continuations [S2].

If Claude calls a server tool and a client tool in parallel, the response ends
with `tool_use`; search execution is deferred until the client tool results are
returned. Pairing must use IDs rather than array position [S2].

**RECOMMENDATION (high):** count authority across the whole caller-declared task,
not merely one transport request. Search calls, fetches, branches,
continuations, retries, bytes, elapsed time, and input tokens need one monotonic
budget ledger. A `pause_turn` or adapter retry must never mint new curiosity
budget.

## 5. Response, results, metadata, and citations

### 5.1 Observable response envelope

The content sequence can contain model text, one or more search calls, their
results, and final cited text:

```json
{
  "type": "web_search_tool_result",
  "tool_use_id": "srvtoolu_...",
  "content": [
    {
      "type": "web_search_result",
      "url": "https://example.org/page",
      "title": "Example",
      "encrypted_content": "...",
      "page_age": "April 30, 2025"
    }
  ]
}
```

The top-level `usage.server_tool_use.web_search_requests` reports the number of
searches. With dynamic filtering, nested search call/result pairs carry a
`caller` identifying the code execution call [S1].

**FACT (high):** for a multi-turn conversation, the client must send result
blocks back exactly, including `encrypted_content`; missing or modified encrypted
content causes HTTP 400. The generated SDK contract confirms `url`, `title`,
`encrypted_content`, and optional `page_age` as the result fields [S1][S7].

### 5.2 Citation contract

Web Search citations are always enabled. Citations attach to generated text
blocks and contain [S1]:

```json
{
  "type": "web_search_result_location",
  "url": "https://example.org/page",
  "title": "Example",
  "encrypted_index": "...",
  "cited_text": "up to 150 characters of cited content"
}
```

`cited_text`, title, and URL in web-search citations do not count toward token
usage. `encrypted_index` is another opaque continuation reference that must be
round-tripped. Anthropic requires citations to original sources when API output
is displayed directly; transformed or combined output needs an appropriate
citation policy developed with legal counsel [S1].

### 5.3 Evidence strengths and gaps

| Property | Anthropic contract | Consequence for an owned system |
| --- | --- | --- |
| Query trace | Explicit `server_tool_use.input.query` | **ADOPT** typed branch/query trace. |
| Call/result pairing | Stable per-call IDs | **ADOPT** IDs independent of array order. |
| URL/title | Plain result metadata | **ADOPT**, but normalize safely and retain fetched/canonical identities separately. |
| `page_age` | Optional string described as when the site was last updated | **ADAPT** only as an untrusted claimed/derived timestamp; do not equate with publication, fetch, or index time. |
| Result content | Opaque `encrypted_content` | **REJECT** vendor-only evidence handles for the owned core; preserve immutable owned captures and readable bounded passages. |
| Citation | URL/title, opaque index, up to 150 characters | **ADAPT** visible passage citation, but anchor to capture ID, extractor version, offsets/hash, and retrieval trace. |
| Rank evidence | None exposed | **ADD** rank position, stage, bounded feature classes, diversification reason, and uncertainty. |
| Coverage/provider | None exposed in Claude result | **ADD** corpus/shard/provider lineage and coverage warnings. |
| Result count/score | Neither exposed nor request-controlled | **ADD** bounded top-k and calibrated/non-comparative score semantics. |
| Temporal provenance | No `retrieved_at`, capture/version ID, or as-of contract | **ADD** observed/fetched/indexed/claimed-published times and version identity. |

**INFERENCE (high):** citations are suitable for user verification but not for
reproducible evidence custody. A mutable URL plus 150-character quote and opaque
index cannot prove which page version, extraction, or rank path supported a
claim after the page changes.

## 6. Likely retrieval boundary and architecture

### 6.1 Confirmed boundaries

1. Claude decides to search and generates a query [S1][S5].
2. Anthropic executes search as a server tool, potentially multiple times, and
   adds results to the same logical Messages turn [S1][S2].
3. On Google Cloud, official documentation says derived queries go to a
   third-party search service selected by Anthropic and lists **Brave Search** as
   the service the feature can call [S8].
4. Google describes encrypted result content as a list of snippets from the web
   search provider, decrypted before the next model sampling run [S8].
5. Anthropic documents its own `Claude-SearchBot`, which navigates/indexes public
   content to improve relevance and accuracy of search responses; a distinct
   `Claude-User` retrieves content at a user's direction [S9].
6. Full-page retrieval is a separate Web Fetch tool. Search can locate a URL and
   Fetch can then read it; Fetch does not support JavaScript-rendered sites and
   constrains fetchable URLs to those already in user/tool/search context [S3].

### 6.2 Bounded architecture inference

```text
messages + developer policy
  -> Claude query decision / formulation
  -> Anthropic server-loop policy and metering
  -> third-party search service (Brave explicitly listed on Google Cloud)
     + possibly Anthropic search-quality/index signals
  -> result/snippet normalization and encrypted continuation envelope
  -> [20260209+] sandboxed model-written filtering code
  -> selected result evidence in Claude context
  -> optional progressive query / optional separate web fetch
  -> answer generation + URL/title/short-text citations
```

**INFERENCE (medium):** the basic retrieval unit is probably provider result
metadata plus snippets/passages, not an unconditional live full-page fetch.
Evidence: Google labels encrypted content provider snippets, the result contract
does not expose a retrieved document, and full-page access is separately sold as
Web Fetch [S1][S3][S8]. Some verticals such as SEC filings may receive richer
processing [S10].

**INFERENCE (medium-low):** `Claude-SearchBot` suggests Anthropic maintains some
search-oriented index or enrichment layer, but public evidence does not establish
whether it is a global primary index, a supplemental cache, quality corpus,
reranking input, or fetch aid [S9]. It does not contradict use of Brave; a hybrid
path is plausible but unconfirmed.

**Unknowns retained:** provider routing outside Google Cloud; whether Brave is
the only provider; query rewriting beyond visible calls; candidate count;
lexical/vector methods; rerank model/features; deduplication/diversification;
snippet extraction; cache TTL; geographic index selection; safety filtering;
and whether `page_age` originates with publisher metadata, provider data, or
Anthropic processing.

## 7. Dynamic filtering

With `web_search_20260209` and later, Claude writes and executes code to filter
search results before they enter the context window. Anthropic automatically
provisions the code-execution environment; developers need not declare it, and
there is no additional execution charge beyond normal token costs when used
this way [S1][S14].

Benefits are clear: irrelevant candidates need not consume the main model's
context, and code can perform compact selection over many results. Costs and
risks are equally material:

- model-written selection code is another non-deterministic retrieval stage;
- discarded candidates and reasons are not guaranteed visible, especially with
  `response_inclusion: "excluded"`;
- code execution makes these versions non-ZDR-eligible by default and container
  data can be retained under code-execution policy [S2][S6];
- the caller route expands the effective tool graph even though the developer
  did not explicitly add code execution.

**RECOMMENDATION (high):** **REJECT** automatic model-written filtering as the
default owned retrieval path. First implement deterministic, versioned filters
and diversification with recorded candidate/rejection reason codes. A later
model-authored analysis sandbox may be **DEFERRED** behind explicit authority,
no network/write credentials, input/output/CPU/time caps, full selection trace,
and demonstrated incremental value.

## 8. Freshness and temporal semantics

**FACT (high):** Anthropic markets Web Search as access to “real-time” or current
web information and describes triggers such as recent events, prices, scores,
and changing product facts [S1][S5]. The result schema's only temporal field is
optional free-form `page_age`, described as when the site was last updated [S1].

**Negative results:** no documented search freshness/date filter, index update
SLO, retrieval timestamp, provider timestamp, publication timestamp, cache
bypass, archive/as-of query, or guarantee that a result reflects the current
page was found. Web Fetch explicitly documents cached results and offers
`use_cache: false` only in later fetch versions; the Search page does not expose
an analogous control [S3].

**INFERENCE (high):** “real-time” means online access to a changing search
service, not temporal reproducibility or guaranteed recency. `page_age` should
not support an exact freshness claim without checking the source itself.

**RECOMMENDATION (high):** owned search should expose `fetched_at`, `first_seen`,
`last_seen`, `indexed_at`, `claimed_published_at`, `claimed_modified_at`, and
capture/version ID separately. Freshness constraints need explicit semantics
(`observed_after`, claimed publication window, or current-live fetch) and a
coverage warning when the corpus cannot satisfy them.

## 9. Safety, privacy, abuse, and publisher control

### 9.1 Data flow and retention

Google's official page is unusually explicit: enabling Claude Web Search sends
queries **derived from the request** to an Anthropic-selected third-party search
provider; Google's CMEK and data-residency commitments do not apply while that
provider processes them, and VPC-SC projects reject search requests. Brave is
the listed provider [S8]. This statement is scoped to the Google Cloud offering,
but it demonstrates a real search-query subprocessor boundary.

Anthropic says basic direct Web Search is eligible for ZDR under an enabled ZDR
arrangement; dynamic filtering is not eligible by default because it uses code
execution. Web Search is HIPAA-eligible only without dynamic filtering [S2][S6].
ZDR is contractual and organization-specific, not a default synonym for “API.”
Even under ZDR/HIPAA, content flagged by trust-and-safety systems or subject to
legal hold may be retained; Anthropic documents up to two years for flagged
inputs/outputs [S6].

**RECOMMENDATION (high):** never put secrets, private identifiers, unreleased
names, raw incident data, or internal URLs into public-web queries. Apply a
query-egress classifier/redactor before any external provider and record the
policy decision without logging sensitive raw queries broadly.

### 9.2 Untrusted content and prompt injection

Search results are web-controlled text that enters the agent's context. The
public Web Search page does not provide a client-visible malware, prompt-
injection, safety score, or source-trust field. Domain allow/block lists are
reachability controls, not content validation. Anthropic's separate Web Fetch
page warns of data exfiltration when untrusted input and sensitive data coexist,
restricts dynamically constructed URLs, blocks private/forbidden addresses, and
recommends use/domain caps [S3].

**INFERENCE (high):** indirect prompt injection and poisoned snippets remain a
boundary risk even if Anthropic applies hidden filters. Nothing in the response
contract lets a client verify those filters or grant search text trusted status.

**RECOMMENDATION (high):** `opencode2-curiosity` must preserve the explicit
untrusted-result marker. Retrieved text can support claims but cannot change
system policy, expand scope/budget, authorize another tool, request secrets, or
approve actions. Search/retrieval workers should have no mutation tools.

### 9.3 Publisher controls and removals

Anthropic documents three distinct bots: training (`ClaudeBot`), user-directed
retrieval (`Claude-User`), and search-quality indexing (`Claude-SearchBot`). It
says they honor robots directives, do not bypass CAPTCHAs, and support
`Crawl-delay` [S9]. Its removal guidance says `noindex` tells search partners not
to return content, robots can control media crawling, blocking Anthropic bots
reduces search visibility, and verified owners can request URL blocking [S15].

**RECOMMENDATION (high):** learn the separation of crawler purposes and publish
identifiable user agents, but implement an independent rights/policy review.
Owned crawling needs retained robots/noindex decisions, purpose-specific agents,
polite scheduling, takedown/deindex, appeal, recrawl/delete propagation, and no
CAPTCHA or authentication bypass.

### 9.4 Abuse controls

Anthropic's Usage Policy applies to agentic use, prohibits privacy violations,
malware/unauthorized compromise, deceptive misinformation, spam/fraud,
guardrail circumvention, and model scraping/distillation, and permits throttling,
suspension, termination, or output modification [S16]. Standard API rate/spend
limits are organization/workspace based and designed partly to mitigate misuse
[S13].

These policies constrain Anthropic customers; they are not a substitute for an
owned system's abuse model. The owned system needs tenant quotas, query anomaly
detection, corpus poisoning/spam controls, deletion operations, audit trails,
incident handling, and explicit high-risk use policies.

## 10. Failure semantics and operational behavior

### 10.1 Search-local failures inside HTTP 200

A search execution failure is normally a successful Messages HTTP response with
`web_search_tool_result.content` changed from a result list to one error object:

| Code | Meaning documented by Anthropic |
| --- | --- |
| `too_many_requests` | Search rate limit exceeded |
| `invalid_tool_input` | Invalid query parameter |
| `max_uses_exceeded` | Request search budget exhausted |
| `query_too_long` | Query exceeds an undisclosed maximum |
| `request_too_large` | Search request too large, commonly long domain filters |
| `unavailable` | Internal search error |

A successful search with no matches returns an empty list, not an error. Failed
searches are not billed [S1].

### 10.2 Request/platform failures

Malformed/mutually exclusive controls, unsupported country codes, invalid domain
formats, disabled organization search, missing/modified encrypted continuation
state, unsupported model/caller combinations, or policy mismatches can return
HTTP 400 [S1][S2]. Normal API failures include 401, 403, 413, 429, 500, 504, and
529, with request IDs; official SDKs retry selected transient failures twice by
default [S12]. Google Cloud additionally blocks Web Search under VPC-SC [S8].

### 10.3 Partial completion and observability

Claude can see an in-band search error and still continue its turn, so a final
answer is not proof that retrieval succeeded. `usage.server_tool_use` gives call
count but not provider latency, candidate count, rank trace, corpus coverage, or
per-result rejection. `response_inclusion: "excluded"` can remove completed
nested evidence pairs entirely [S1].

**RECOMMENDATION (high):** normalize transport, policy, retrieval, empty,
partial, timeout, budget, and synthesis failures separately. Final research
output should disclose searched/not-searched, branches attempted, partial
failures, freshness/coverage warnings, and evidence actually used. Retry only
idempotent stages, charge retries to the same task budget, add jitter/backoff,
and retain stable redacted diagnostics plus internal correlation IDs.

## 11. Pricing and limits

**FACT (high):** Web Search costs **$10 per 1,000 searches** ($0.01 per successful
search) in addition to model token charges. Each call costs one use regardless
of result count; failed search executions are not billed. Search-generated
content is input-token billed during repeated searches in a turn and when
round-tripped in later conversation turns [S1][S14].

Dynamic-filter code execution adds no execution fee when used with Web Search,
but standard model token charges remain [S1][S14]. `response_inclusion:
"excluded"` is explicitly positioned as reducing output-token cost for agents
that do not need raw nested blocks [S1]. Batch calls use the same search price;
search capacity is organization-throttled [S1].

**Unknowns:** no public universal search QPS/RPM, candidate/result count, latency
SLO, maximum `max_uses`, maximum query length, or domain-list threshold was
found. Actual organization limits are Console/account specific. General API
tiers impose spend, request, input-token, and output-token limits, but those do
not establish guaranteed search throughput [S13].

**RECOMMENDATION (high):** owned cost accounting should meter query attempts,
candidates, fetched bytes, parsing/render CPU, index reads, model reranks,
context tokens, wall time, and retries. A count-only search price is simple for
customers but too coarse for capacity governance or curiosity value scoring.

## 12. Exact implications for `opencode2-curiosity`

Local repository facts: ADR 0020 fixes `web_search` as the provider-neutral ABI,
keeps `formerhuman_search` as a deprecated alias, allows only the `researcher`,
marks external results untrusted, and constrains Curiosity to one bounded
in-frame pass. The current transferred contract is `{query,maxResults<=10}` with
small normalized results and stable redacted adapter failures. ADR 0021 proposes
an owned plane with versioned captures, evidence lineage, diversity, temporal
signals, and no autonomous continuation (local `docs/decisions/0020-...` and
`0021-...`; architecture dossier §§2–4).

### 12.1 Adopt

1. **Typed query/call/result IDs.** Preserve every original and derived query,
   branch/parent ID, call ID, and result linkage.
2. **Hard task budget.** Keep a caller-selected cap analogous to `max_uses`, but
   make it monotonic across searches, fetches, curiosity branches,
   continuations, and retries.
3. **Layered policy.** Compose repository/organization policy with request-level
   domain and location controls; fail closed for invalid intersections.
4. **Empty versus error.** Preserve no-match as a valid empty result distinct
   from unavailable, rate-limited, invalid, or budget-exhausted.
5. **Usage accounting.** Return bounded machine-readable counts and cost/latency
   classes even when some evidence is omitted from the human answer.
6. **Explicit pause/resume state.** If long work is ever resumable, require an
   integrity-protected state token and the exact same authority envelope.

### 12.2 Adapt

1. **Citations:** return readable citations, but bind them to owned immutable
   capture/document/version and passage hash/offsets—not encrypted vendor
   indices or mutable URLs alone.
2. **Localization:** separate language/market/relevance hints from legal policy,
   egress region, and data residency. Record which hint changed ranking.
3. **Domain filters:** canonicalize to ASCII/punycode, distinguish registrable
   domain/subdomain/path semantics, compile once, and record policy reason codes.
4. **Progressive search:** allow bounded query branches only after a declared
   research frame. Every child query consumes task budget and records expected
   information gain; no live autonomous curiosity.
5. **Response inclusion:** offer summary/full evidence views, but never let a
   presentation optimization erase the internal audit/evaluation trace.
6. **Vertical enrichment:** richer SEC-like handling can be evaluated later, but
   it needs a typed source adapter and provenance rather than an invisible rank
   special case.

### 12.3 Reject

1. Anthropic or any hosted search API as the production corpus/ranking
   foundation; it conflicts with the owned-search decision.
2. Opaque `encrypted_content`/`encrypted_index` as the internal evidence model.
3. Model discretion as the only “must search” or “must not search” mechanism.
4. An absent/unknown default budget. Require explicit safe defaults and lower
   caller ceilings.
5. Treating `page_age` or “real-time” as reproducible freshness.
6. Treating domain lists, citations, or hidden provider safety as proof that web
   text is trusted.
7. Automatic model-written filtering code in the trusted retrieval plane.
8. Search results or provider snippets as crawl seeds for the owned index.

### 12.4 Defer behind evidence gates

1. Model-assisted candidate filtering or reranking sandbox.
2. Search-plus-live-fetch composition beyond static, policy-approved HTTP.
3. Vertical source enrichments, images, or rendered pages.
4. Learned progressive-query policy.

Each requires held-out relevance/freshness/citation evaluation, security and
privacy review, explicit budget semantics, and proof of incremental value over a
deterministic lexical baseline.

### 12.5 Target provider-neutral envelope

This is a conceptual requirement set, not an implementation:

```text
SearchTask
  frame_id, original_query, branch_budget, search/fetch/byte/token/deadline caps
  locale_hint, language, temporal_constraint, domain_policy, safety_policy

SearchCall
  call_id, parent_call_id, query, purpose/facet, started/ended, policy_decision
  corpus/index/extractor/ranker versions, partial_failures, coverage_warnings

EvidenceResult
  result_id, rank, fetched_url, terminal_url, publisher_canonical, cluster_id
  capture_id/version, title, passage, passage_offsets/hash
  first_seen/fetched/indexed/claimed_published/claimed_modified timestamps
  source/owner class, retrieval stages/features, uncertainty, untrusted=true

SearchUsage
  attempted/succeeded/failed searches and fetches, candidates, returned results
  bytes, tokens, elapsed time, budget remaining, stop reason
```

This adds what Anthropic's answer-centric contract omits while preserving its
most useful bounded-loop lessons.

## 13. Fact / inference / recommendation ledger

| ID | Type | Claim | Confidence | Evidence / verdict |
| --- | --- | --- | --- | --- |
| L1 | FACT | Three GA types are documented: 20250305 basic, 20260209 dynamic filtering, 20260318 response inclusion. | High | [S1][S4]; **ADAPT** version pinning. |
| L2 | FACT | Claude chooses whether to search and can conduct progressive searches; `max_uses` caps searches per request. | High | [S1][S5]; **ADAPT** only inside caller authority. |
| L3 | FACT | No documented default/range for search `max_uses` was found. | High | [S1][S7]; negative result; **REJECT** implicit default. |
| L4 | FACT | Domain allow/block controls are mutually exclusive and compose with organization policy. | High | [S1][S2]; **ADOPT/ADAPT**. |
| L5 | FACT | Result metadata is URL, title, opaque encrypted content, and optional page age. | High | [S1][S7]. |
| L6 | FACT | Search citations are mandatory and include URL/title, opaque index, and up to 150 cited characters. | High | [S1]; **ADAPT** to owned anchors. |
| L7 | FACT | Search failures are usually typed blocks inside HTTP 200; empty success is an empty list. | High | [S1]; **ADOPT** distinction. |
| L8 | FACT | Google says its Claude search path uses an Anthropic-selected third party and lists Brave Search. | High, scoped to Google Cloud | [S8]; **REJECT** hosted dependency. |
| L9 | FACT | Anthropic documents a separate SearchBot that indexes content for search quality. | High | [S9]. |
| L10 | INFERENCE | Anthropic likely combines partner search with some owned enrichment/index signals. | Medium-low | L8+L9; exact topology unknown. |
| L11 | INFERENCE | Basic search usually supplies provider snippets/passages rather than guaranteed live full pages. | Medium | [S1][S3][S8]. |
| L12 | FACT | Dynamic filtering provisions model-written code execution and is non-ZDR by default. | High | [S1][S2][S6]. |
| L13 | RECOMMENDATION | Use deterministic filters first; defer model code filtering. | High | Auditability, authority, retention, and clean-room goals; **DEFERRED**. |
| L14 | FACT | Search costs $0.01/use plus tokens; errors are not billed. | High | [S1][S14]. |
| L15 | INFERENCE | Pinned tool versions do not freeze ranking/corpus behavior. | High | [S4][S10]. |
| L16 | RECOMMENDATION | Use one task-level budget across transport continuations and curiosity. | High | [S2] plus ADR 0020/0021; **ADOPT**. |
| L17 | RECOMMENDATION | Preserve untrusted evidence and prevent search text from granting authority. | High | Contract lacks verifiable content-safety metadata; **ADOPT**. |
| L18 | RECOMMENDATION | Do not use vendor outputs as owned-index seeds or copy SDK code. | High | Clean-room/ownership boundary; **REJECT** transfer. |

## 14. Reproducible checks

These checks are documentation/schema observations and safe test plans. They do
not require credentials to reproduce the first group. Paid/live checks remain
**deferred** until separately authorized.

### 14.1 No-credential checks performed

1. Fetch [S1] and locate “Three versions,” “Tool definition,” “Response,”
   “Errors,” and “Usage and pricing.” Verify names, fields, error list, citation
   limit, and price.
2. Fetch [S2] and locate “ZDR and allowed_callers,” “Domain filtering,” and
   “pause_turn.” Verify caller defaults/workaround, path/wildcard semantics,
   homograph warning, and continuation guidance.
3. Fetch [S4] and verify Web Search is GA and versions are capability-keyed.
4. Inspect the public generated Python types in [S7]. Verify `max_uses` is
   `Optional[int]` without an annotated range and result fields match [S1].
5. Fetch [S8], locate “Data Governance,” and verify third-party query transfer,
   Brave listing, VPC-SC rejection, and encrypted provider snippets.
6. Fetch [S9] and verify distinct `ClaudeBot`, `Claude-User`, and
   `Claude-SearchBot` purposes and opt-out behavior.
7. Fetch [S10] and locate 2026-05-18 and 2026-06-11 to verify vertical enrichment
   and 20260318 release timing.

### 14.2 Authorized future black-box matrix

If caller authority, credentials, budget, legal terms, and logging controls are
later supplied, run only a small prepaid matrix and retain request IDs, raw
redacted envelopes, model/tool version, time, and expected outcome:

| Check | Inputs varied | Verify |
| --- | --- | --- |
| Search trigger | stable fact, current fact, explicit search, explicit no-search | Search/no-search trace and whether prompt steering is honored. |
| Bound | `max_uses` omitted, 0, 1, representative high value | Validation range, default, exact exhaustion behavior; stop before broad probing. |
| Domain policy | allow, block, both, parent/subdomain/path, Unicode confusable | HTTP versus in-band failure and actual returned domains. |
| Localization | country, timezone, unsupported country, no location | Validation and rank/result differences without asserting causality from one run. |
| Empty/error | impossible query, overlong query, disabled org in test workspace | Empty list versus typed error versus HTTP error. |
| Continuation | forced long task with small bounds | Whether budget is preserved over repeated `pause_turn`; client hard-cap continuations. |
| Citation integrity | mutable controlled page with unique canary passage | Citation text length, drift, page-age behavior, and round-trip validation. |
| Version A/B | identical prompt on direct basic versus dynamic-filter version | Returned blocks, callers, candidate visibility, token usage; no quality conclusion without judged repetitions. |
| Freshness | controlled page updated at known times | Lag distribution and `page_age` meaning; never crawl or modify third-party pages. |

Do not send secrets or personal data, test harmful content, bypass controls,
probe hidden infrastructure, scrape at scale, or use returned URLs/snippets to
seed the owned corpus.

## 15. Unknowns and negative findings

Material unknowns remaining after source triangulation:

- `max_uses` default, accepted range, and accounting over `pause_turn`;
- maximum query length and domain-filter thresholds;
- search-specific throughput/SLOs and result count;
- provider(s) and routing outside the documented Google Cloud path;
- exact role and size of Anthropic's SearchBot-derived index;
- candidate generation, reranking, deduplication, diversity, spam, and safety
  algorithms;
- source of `page_age` and vertical metadata;
- Web Search cache and freshness policy;
- complete supported-model matrix over every cloud and tool version;
- data passed to upstream provider beyond derived query and normal request
  metadata;
- recall, precision, geographic/language coverage, citation correctness, latency,
  and comparative quality under a controlled benchmark.

Negative findings are findings, not omissions: no public request field or result
field was found for top-k/result count, language, date filter, freshness SLA,
rank score/reason, provider, retrieved-at timestamp, capture/version, canonical
cluster, passage offsets/hash, source owner/type, or coverage warning.

## 16. Bounded curiosity pass

Post-synthesis gaps were scored 1–5 (higher is more) for relevance, decision
value, novelty, and research cost (lower is cheaper). Only the best low-cost,
in-frame contradiction was pursued.

| Thread | R | V | N | Cost | Outcome |
| --- | ---: | ---: | ---: | ---: | --- |
| Third-party provider versus Anthropic SearchBot | 5 | 5 | 5 | 1 | **Pursued:** [S8] confirms Brave on Google Cloud; [S9] confirms SearchBot. Resolved as compatible layers, exact hybrid topology unknown. |
| Exact `max_uses` range/default | 5 | 5 | 3 | 4 | **CURIOSITY_NO_GO:** docs and generated type give no range; live boundary probing requires credentials/paid authority and could become unbounded. |
| Infer rank algorithm from result order | 4 | 2 | 3 | 5 | **CURIOSITY_NO_GO:** low-identifiability black-box inference, unstable corpus, no clean ground truth. |
| Identify Brave use on every Anthropic surface | 4 | 4 | 4 | 5 | **CURIOSITY_NO_GO:** Google scope is explicit; extrapolation would overclaim, traffic inspection is out of bounds. |
| Benchmark quality/latency/freshness | 5 | 4 | 2 | 5 | **CURIOSITY_NO_GO:** no credentials, paid tests, or judged repeated-run budget. |
| Reverse engineer encrypted fields | 2 | 1 | 3 | 5 | **CURIOSITY_NO_GO:** opaque state is documented; decryption/probing would violate the clean-room boundary and add no owned-design value. |

**Stop condition:** requested product/contract/control/failure/pricing categories
are covered, the provider contradiction was triangulated, and further threads
require paid execution or speculative hidden-system inference. Coverage and
authority exhaustion reached.

## 17. Sources

All accessed 2026-08-17.

1. **[S1] Anthropic, Web search tool.**
   https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-search-tool
   — canonical versions, request fields, result/citation/error contract,
   dynamic filtering, streaming, batch behavior, and pricing.
2. **[S2] Anthropic, Server tools.**
   https://platform.claude.com/docs/en/agents-and-tools/tool-use/server-tools
   — server loop, `pause_turn`, mixed tools, domain semantics, caller controls,
   and ZDR qualification.
3. **[S3] Anthropic, Web fetch tool.**
   https://platform.claude.com/docs/en/agents-and-tools/tool-use/web-fetch-tool
   — official search-versus-full-fetch boundary, URL provenance restriction,
   caching/freshness contrast, JS limitation, and exfiltration warning.
4. **[S4] Anthropic, Tool reference.**
   https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-reference
   — GA status, capability-keyed versioning, and generic tool properties.
5. **[S5] Anthropic, “Introducing web search on the Anthropic API,” 2025-05-07.**
   https://claude.com/blog/web-search-api — original product claims, launch
   models/price, progressive-search behavior, and Web Fetch update.
6. **[S6] Anthropic, API and data retention.**
   https://platform.claude.com/docs/en/manage-claude/api-and-data-retention
   — ZDR/HIPAA scope, dynamic-filter exclusion, third-party boundary, and
   safety/legal-hold retention.
7. **[S7] Anthropic official generated Python SDK types.**
   https://github.com/anthropics/anthropic-sdk-python/blob/main/src/anthropic/types/web_search_tool_20250305_param.py and
   https://github.com/anthropics/anthropic-sdk-python/blob/main/src/anthropic/types/web_search_result_block.py
   — public OpenAPI-derived type corroboration only; no code adopted.
8. **[S8] Google Cloud, Web search with Anthropic Claude models.**
   https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/partner-models/claude/web-search
   — official cloud integration, Brave provider disclosure, provider snippets,
   VPC-SC/data-governance boundary, and server-loop example.
9. **[S9] Anthropic Privacy Center, “Does Anthropic crawl data from the web, and
   how can site owners block the crawler?”, 2026-04-07.**
   https://privacy.anthropic.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler
   — distinct bot purposes, SearchBot indexing claim, robots/CAPTCHA/crawl-delay
   behavior.
10. **[S10] Anthropic, Claude Platform release notes.**
    https://platform.claude.com/docs/en/release-notes/overview — SEC enrichment
    and 20260318 release chronology.
11. **[S11] Anthropic Help Center, Enable and use web search.**
    https://support.claude.com/en/articles/10684626-enable-and-use-web-search
    — consumer-surface controls, source UX, IP localization limitation, and
    Bing-powered image-search boundary (not evidence for API text search).
12. **[S12] Anthropic, Claude API errors.**
    https://platform.claude.com/docs/en/api/errors — transport errors, 32 MB
    Messages limit, retries, request IDs, and long-request guidance.
13. **[S13] Anthropic, Rate limits.**
    https://platform.claude.com/docs/en/api/rate-limits — organization/workspace
    limits, spend caps, token buckets, and non-guaranteed capacity.
14. **[S14] Anthropic, Pricing.**
    https://platform.claude.com/docs/en/about-claude/pricing — independent
    confirmation of search and dynamic-filter execution pricing.
15. **[S15] Anthropic Help Center, Report, block, and remove content from Claude.**
    https://support.claude.com/en/articles/10684638-reporting-blocking-and-removing-content-from-claude
    — noindex, bot blocking, partner-index, and verified removal routes.
16. **[S16] Anthropic, Usage Policy, effective 2025-09-15.**
    https://www.anthropic.com/legal/aup — abuse categories and agentic-use
    enforcement boundary.

## Final decision record

- **ADOPTED:** explicit per-task bounds, typed call/result/usage/failure state,
  layered domain policy, query trace, empty/error distinction, and resumable-loop
  integrity concepts.
- **ADAPTED:** progressive search, localization, citations, response-inclusion,
  and vertical enrichment—only with owned provenance, deterministic policy, and
  caller-framed authority.
- **REJECTED:** hosted Anthropic/Brave foundation, opaque evidence handles,
  implicit budgets, freshness-by-marketing, vendor results as corpus seeds, and
  model-written filtering in the trusted retrieval plane.
- **DEFERRED:** sandboxed model filtering, learned query planning, live fetch,
  rendering, images, and vertical adapters pending explicit evidence gates.

**Overall confidence:** high for the public contract and controls; medium for the
retrieval-boundary model; low for any hidden ranking, provider-routing, or index
topology claim. The owned-system decision does not depend on resolving those
hidden details.
