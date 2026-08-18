# SearXNG: metasearch transition dependency and clean-room lessons

**Access date:** 2026-08-17  
**Inspected upstream:** official `searxng/searxng` repository at commit
`374939b888c8644b408b793fe42d584454631cec` (2026-08-17) [S1]  
**Decision frame:** what the current `opencode2-curiosity` bounded search path
may safely rely on during transition, and what must not be carried into an owned
public-web retrieval plane.  
**Status:** research only. No SearXNG code, fixtures, image, configuration, or
search-result data was copied into Curiosity.

## Executive verdict

SearXNG is a capable, actively changing **federated metasearch orchestrator**.
It is not a crawler, web corpus, independent index, or owned ranker. It selects
configured engines by category or explicit request, starts one processor thread
per selected engine, converts heterogeneous replies into a shared result model,
merges URL-equivalent items, and ranks the aggregate primarily from upstream
positions, engine weights, and cross-engine occurrence [S2–S7].

**ADAPT for the transition (high confidence):** the engine-adapter boundary,
deadline-bounded concurrent fan-out, explicit source attribution, partial-result
delivery, per-engine deadlines and suspension, capability-aware filters, and
operator-visible metrics are useful patterns. Strengthen every one: use stable
machine failure codes, an explicit engine-status ledger, deterministic
snapshots, bounded upstream work, and provenance beyond engine name.

**REJECT as the target search foundation (high confidence):** SearXNG owns none
of the material general-web discovery, captures, snippets, source ranking, or
availability. Its fusion score rewards upstream positions and repeated URLs;
its deduplication is URL/template/image identity, not document or publisher
identity. It cannot provide immutable citations, temporal custody, content
hashes, corpus coverage, or evidence-level contradiction support.

**REJECT source reuse in Curiosity's owned core (high confidence under the
current ownership decision):** SearXNG files are marked AGPL-3.0-or-later and
the repository contains the GNU AGPL version 3 text. This is third-party
copyleft software, not MIT or project-owned code [S1, S15]. Keep it as a
separately operated transition service and study behavior only.

**Exact `opencode2-curiosity` conclusion:** retain the neutral `web_search` ABI,
researcher-only authority, 1–500 character query bound, `maxResults <= 10`,
15-second gateway envelope, response-size/redirect/media checks, untrusted-data
marker, redacted diagnostics, and deprecated alias. Do **not** treat those
bounds as proof of bounded SearXNG fan-out, stable ranking, complete coverage,
or typed failure. The fixed authenticated `/agent-search` contract is a project
gateway contract, not SearXNG's native API; preserve that separation and never
expose native SearXNG wire types as the agent ABI [L1, L2].

Confidence is **high** for source-level mechanics, native API shape, defaults,
and license text; **medium** for behavior of the intended production gateway
because deployment is pending and its server-side implementation/configuration
was not present here; **low** for live upstream coverage, relevance, retention,
and provider compliance because no instance or upstream engine was queried.

## 1. Frame, bounded questions, and method

### Questions in frame

1. How do engine adapters, categories, fan-out, normalization, ranking, and
   deduplication work at the pinned source snapshot?
2. What happens on timeout, parser error, block, suspension, unsupported filter,
   failed initialization, and total engine failure?
3. What does native JSON actually promise, and how does it differ from the
   Curiosity gateway contract?
4. Which privacy properties are architectural, and which depend on the operator,
   reverse proxy, logs, selected engines, and egress?
5. What must be operated and monitored for a private or public instance?
6. What exactly does the AGPL say about modification, remote network use, and
   conveyance, without pretending to give legal advice?
7. Which behavioral lessons may be specified clean-room without code reuse?

### Method and boundary

The official repository was cloned into approved temporary storage and checked
out at the commit above. Static inspection covered search orchestration,
processors, engine loading/configuration, result types and merging, HTTP errors,
web request parsing, JSON serialization, privacy documentation, limiter,
deployment files, and license. Official documentation in the same commit was
cross-checked against implementation. Local ADR 0020 and the owned-search
dossier provide the `opencode2-curiosity` baseline [L1, L2].

No live SearXNG instance, public instance, upstream search engine, CAPTCHA,
private API, or proprietary ranker was probed. No dependency was installed and
no upstream test suite was run. Source was read only to characterize behavior;
no implementation expression is reproduced here.

Labels:

- **FACT** — directly supported by cited primary evidence.
- **INFERENCE** — a reasoned consequence, not measured here.
- **RECOMMENDATION** — a Curiosity design or operating choice.
- Confidence is **high**, **medium**, or **low**.

## 2. Product identity and dependency boundary

**FACT (high):** SearXNG describes itself as a metasearch engine. Its engine
documentation says there is no general API shared by search providers, so each
external engine needs an adapter under `searx/engines` [S1, S2]. The pinned tree
contains roughly 250 Python engine modules, including web search, vertical
search, API-backed, HTML-parsing, generic JSON/XPath, local/offline, translation,
calculator, and demonstration modules. Module count is **not** enabled-engine
count or coverage evidence.

**FACT (high):** adapters declare capabilities and behavior such as categories,
paging, maximum page, time-range support, safe search, language traits, engine
type, request/response functions, and sometimes API keys. Instance settings can
override categories, timeout, weight, proxies, retries, connection pools,
language, base URL, and enabled/inactive state [S2, S3].

**INFERENCE (high):** SearXNG's broad adapter inventory is maintenance breadth,
not owned information breadth. Every enabled general-web adapter still inherits
the upstream's corpus, ranking, representation, access controls, terms,
geography, and outages. An adapter repair can address a changed representation;
it cannot restore an upstream that withholds results or shuts an API.

**Negative result:** no crawler frontier, robots decision ledger, immutable web
capture store, general-web index, recrawl scheduler, document/version graph, or
owned passage store was found. Local/offline adapters can query operator data,
but they do not turn the product into an owned public-web corpus.

## 3. Engine selection, categories, and capability semantics

### 3.1 Selection

**FACT (high):** categories are configuration groups. An engine may belong to
multiple categories; a category search selects every active engine in that
category, subject to user-disabled engines. Explicit `engines` input selects
named engines and can be combined with categories. Bang syntax can select an
engine or category. Engine/category references are deduplicated by the pair
`category + engine name` [S3, S8].

**FACT (high):** malformed or unknown category names in the form are ignored. If
none remains, preferences are consulted, then `general` is the fallback.
Explicit engine names not present in the loaded registry are filtered out in
the ordinary form path. Private engines require a matching token and otherwise
are hidden from `/config` and preferences [S3, S8].

**INFERENCE (high):** a category is an operator-defined fan-out policy, not a
stable corpus or quality class. Two instances can accept the same query and
return materially different evidence because their loaded engines, enabled
state, preferences, tokens, locale traits, weights, and suspensions differ.

### 3.2 Filter capability

**FACT (high):** the common request carries page, safe-search level, time range,
locale/language, category, and engine-specific continuation data. If page > 1
is unsupported, maximum page is exceeded, or a requested time range is
unsupported, the processor returns no request for that engine. This skip is not
added to `unresponsive_engines` [S4]. Safe search and language are passed into
adapters, but actual support and mapping are adapter/provider specific [S2–S4].

**RECOMMENDATION (high):** Curiosity must model `selected`, `eligible`,
`unsupported_filter`, `disabled`, `not_loaded`, `suspended`, `attempted`, and
`completed` separately. A result set cannot support a coverage claim unless the
response identifies which intended branches were actually eligible and run.

## 4. Fan-out and concurrency

The pinned orchestration can be summarized behaviorally as:

```text
request + preferences
  -> parse query/category/engine/filter controls
  -> validate loaded engines and private-engine tokens
  -> skip missing processors, suspended engines, unsupported page/time filters
  -> build one request per remaining engine
  -> start one thread per request
  -> each adapter constructs upstream HTTP/offline query and parses response
  -> collect typed or legacy result objects under a lock
  -> join only until one request-wide deadline
  -> mark still-running engines timed out
  -> close, score, group, serialize
```

**FACT (high):** each selected request starts in a separate thread. The global
wait is derived from the largest selected engine timeout, then constrained by
the caller's optional `timeout_limit` and operator `max_request_timeout`.
Joining each search thread consumes only the remaining global time; a thread
still alive at the deadline is marked timed out [S5].

**FACT (high):** online processors set a thread-local network deadline, construct
headers including a generated user agent and `DNT: 1`, call the adapter's
request and response functions, and append successful results and timing. HTTP,
TLS, timeout, CAPTCHA, access-denied, too-many-requests, parser, and unexpected
exceptions are caught per engine rather than normally failing the whole search
[S4, S6, S9].

**INFERENCE (high):** latency is bounded at the aggregator wait boundary, but
work amplification is not bounded by the agent's `maxResults`. A ten-result
Curiosity request can still query every enabled engine in a selected category,
each of which may fetch and parse its provider's page-size worth of results.
`maxResults` limits returned evidence in the project adapter; it does not by
itself cap provider calls, connections, response bytes, retries, or parser work.

**INFERENCE (medium):** timed-out worker threads are flagged and no longer
contribute late results after the container closes, but they are not forcibly
terminated by the orchestration shown. Network deadlines should usually end
them; a non-cooperative adapter can outlive the response. This is an operations
risk to verify under load, not a measured leak in this report.

## 5. Normalization and heterogeneous result types

**FACT (high):** adapters return either newer typed result objects or legacy
dictionaries. The container accepts main results plus answers, suggestions,
corrections, infoboxes, and engine continuation data. Legacy dictionaries remain
explicitly transitional in the source [S7].

Shared normalization is deliberately shallow [S7]:

- parse the URL and add `http` if its scheme is missing;
- decode an IDN netloc when it begins with the punycode prefix;
- collapse whitespace in title/content and clear content equal to title;
- normalize a publication date when one was supplied;
- attach the source engine name; and
- let enabled plugins filter or rewrite result URLs.

**INFERENCE (high):** this is adapter unification, not evidence normalization.
It does not establish a fetched/canonical/capture identity, validate that a
snippet occurs in a source version, retain extraction evidence, infer publisher
ownership, normalize tracking parameters reversibly, or distinguish provider
claim from publisher claim. Adapter-produced text and metadata remain untrusted
external data.

**RECOMMENDATION (high):** keep SearXNG output at the transition boundary. The
provider-neutral core should accept only bounded fields after URL policy,
string/array/byte limits, provenance attachment, trust labeling, and failure
normalization. Never deserialize provider-specific extras directly into agent
authority or actions.

## 6. Deduplication and merge behavior

**FACT (high):** ordinary typed and legacy URL results hash on template, parsed
URL excluding scheme, and image source. The URL comparison includes authority,
path, parameters, query, and fragment. Image results include their image source.
Consequently, `http://example.org/x` and `https://example.org/x` can merge, but
differences in host spelling, path, query, fragment, template, or image can keep
items separate [S7]. Tests explicitly confirm scheme-insensitive merging [S10].

**FACT (high):** when items merge, the container keeps the longer title and
content, fills missing fields, unions engine names, records every upstream
position, and prefers a secure URL scheme when available. This can synthesize a
single result whose title/content and URL scheme originated from different
engine observations [S5, S7].

**INFERENCE (high):** the merge proves only that adapter outputs shared this
syntactic identity. It does not prove identical bytes, same publication,
canonical equivalence, independent corroboration, or a common publisher.
Conversely, tracking parameters, redirects, mirrors, localized URLs, AMP paths,
syndication, and near-duplicate content can remain separate and masquerade as
diversity.

**RECOMMENDATION (high):** retain per-engine observations before fusion. For an
owned system, use layered identity: fetched URL, redirect-terminal URL,
publisher canonical candidate, exact capture hash, normalized-content hash,
near-duplicate cluster, and publisher/owner cluster. A merged display object
must not destroy the observation that supplied each field.

## 7. Ranking and post-score grouping

**FACT (high):** the aggregate score is not an independent web relevance model.
For a merged result, the implementation:

1. multiplies the configured weights of engines in the merged engine set;
2. multiplies that by the number of recorded positions; and
3. for normal priority, adds that weight divided by each recorded upstream
   position. High priority adds the full weight per position; low priority adds
   nothing [S5].

After descending score sort, a second pass groups nearby items sharing category,
template, and image/non-image shape, allowing up to eight subsequent insertions
within a distance of twenty. Category is taken from the first category on the
result's selected engine configuration [S5].

**INFERENCE (high):** source rank and repeated appearance dominate. With unit
engine weights, repeated positions increase both the prefactor and number of
summands, strongly rewarding duplicates/cross-engine overlap. This is useful
consensus-style fusion, but it can amplify common upstream indexes, copied
rankings, or same-provider variants as if they were independent evidence.

**INFERENCE (high):** final display order is not simply score order because the
grouping pass can insert later items near previous category/template groups.
The exposed numeric `score` therefore does not completely explain serialized
position.

**Unknown:** no official judged relevance, freshness, source-diversity, or
ablation benchmark for this fusion formula was found in the inspected material.
No claim of comparative quality is made.

**RECOMMENDATION (high):** Curiosity should preserve upstream rank only as a
provider observation. Independently rank and diversify by evaluated feature
classes, source/index lineage, publisher ownership, time, primary-source status,
and branch intent. Do not interpret engine count as viewpoint diversity.

## 8. Timeout, unavailable-engine, and failure semantics

### 8.1 Per-engine handling

**FACT (high):** runtime failures normally yield partial success. The container
records `(engine, error type, suspended?)` only when that engine's
`display_error_messages` setting is true. Human-facing translation collapses
exceptions to labels such as timeout, parsing error, HTTP/network/SSL error,
CAPTCHA, too many requests, access denied, server API error, or unexpected
crash [S5, S11].

**FACT (high):** HTTP 402/403 become access-denied exceptions; 429 becomes
too-many-requests; recognized Cloudflare or reCAPTCHA pages get more specific
exceptions. These and network/TLS/timeouts can suspend an engine for configured
periods. A later successful request resumes it. While suspended, the engine is
not called and can be returned as a suspended failure [S4, S6, S9].

**FACT (high):** suspension state is held in process memory and shared by
processors that share the same network object. The inspected path does not put
engine suspension in Valkey. Therefore multiple application processes can have
different suspension histories unless an external mechanism coordinates them
[S4].

### 8.2 Silent absence

Several absence paths are not equivalent to a reported failure:

- failed or incomplete processor initialization leaves no registered processor,
  and request construction skips it;
- unsupported page/time-range conditions skip an engine;
- disabled/inactive engines and private engines without tokens are not selected;
- unknown category input can be discarded and fall back to defaults; and
- `display_error_messages: false` suppresses a runtime failure from the returned
  failure collection [S3–S5, S8].

**INFERENCE (high):** `unresponsive_engines` is not a complete execution ledger.
An empty array does not prove that every intended engine ran, and an empty
`results` array does not prove that the web or even each selected upstream had
no results.

### 8.3 Whole-request HTTP behavior

**FACT (high):** native malformed search parameters produce format-appropriate
400 errors; a disabled output format is rejected with 403; unexpected search
construction errors can produce 500. Once orchestration succeeds, zero, some,
or all engine failures can still serialize as HTTP 200 with results (possibly
empty) and `unresponsive_engines` [S12].

**RECOMMENDATION (high):** define stable provider-neutral statuses:
`complete`, `partial`, `no_hits`, `not_attempted`, `unsupported_filter`,
`timeout`, `blocked`, `quota_or_rate_limited`, `upstream_changed_or_parse`,
`transport`, `suspended`, and `internal`. Include intended/eligible/attempted/
completed counts. Preserve retryability and redacted reason codes separately
from localized display text.

## 9. Native JSON contract

**FACT (high):** native SearXNG supports GET or form-encoded POST on `/` and
`/search`. JSON is requested with `format=json`, but the format must be enabled;
the shipped default enables only HTML, and official docs warn many public
instances disable machine formats [S12, S13].

At the pinned commit, successful JSON contains [S11]:

- `query`;
- `results`;
- `answers`;
- `corrections`;
- `infoboxes`;
- `suggestions`; and
- `unresponsive_engines`, serialized as engine/display-message pairs.

**FACT (high):** main result serialization projects the result object's fields,
which can include URL, parsed URL, template, title, content, media URLs,
publication date, duration/views/author/metadata, priority, engines, positions,
score, and category. Legacy results can contain additional adapter-specific
keys. Sets become JSON arrays and dates become ISO strings [S7, S11].

**INFERENCE (high):** this is a convenient application output, not a stable
evidence ABI. No response schema version, request ID, configured-engine
fingerprint, index/corpus version, stable failure codes, explicit partial flag,
per-engine completion object, result trust marker, content/capture ID, passage
anchor, or provenance for merged fields is present. Legacy dictionaries and
typed-result migration allow shape variation across result types and releases.

**RECOMMENDATION (high):** never pass native JSON through as the OpenCode tool
contract. Treat it as a version-pinned provider wire format; validate an
allowlist of fields, cap every collection/string/body, reject invalid URLs,
normalize failures, record adapter version, and mark all result text untrusted.

## 10. Privacy: useful intermediary protection, not end-to-end secrecy

### 10.1 What SearXNG changes

**FACT (high):** official documentation says browser cookies are not forwarded
to search engines; an outbound browser profile/user agent is generated; search
engines see the instance's egress IP rather than the user's; proxy or Tor can be
configured; result-page referrer/query leakage is suppressed; tracking/ads are
not intentionally relayed; image proxying can keep the browser from loading
publisher/provider images directly [S6, S14]. Default headers include
`Referrer-Policy: no-referrer`; query in page title is off; POST can be selected
to keep queries out of browser history [S13].

### 10.2 What remains exposed

| Party | Remaining visibility/control |
| --- | --- |
| Selected search engines | Plaintext query, SearXNG egress identity, generated headers, locale/safe-search/time controls, timing, and aggregate behavior; all source coverage and source ranking. |
| SearXNG/gateway operator | Incoming client metadata and plaintext query; selected engines, credentials, preferences, results, logs, metrics, and ability to modify responses. |
| Reverse proxy/hosting platform | Depending on TLS and log configuration, client IP, route, request size/body, status, and timing. |
| Valkey | Limiter/IP behavior data when enabled; it is an operational privacy boundary and must remain private. |
| Destination publisher | User IP/browser on a normal click; image/resource exposure depends on proxy settings. |

**FACT (high):** official guidance explicitly says public-instance users must
trust the administrator because requests may be logged, aggregated, sent, or
sold. It also warns that abuse can cause upstream CAPTCHA/IP bans and fewer
results [S14]. Reverse-proxy logging is separately configurable; privacy is not
proved by application defaults.

**INFERENCE (high):** query unlinkability improves relative to direct browser
search, but query confidentiality does not. Fan-out discloses the query to every
selected upstream. Autocomplete, if enabled, creates a separate pre-search
disclosure to the configured autocomplete backend [S13]. Tor/proxying changes
network attribution; it does not authorize access or make provider retention
unknowns disappear.

**RECOMMENDATION (high):** for Curiosity, disable autocomplete and unnecessary
resource fetches, use a private authenticated gateway, avoid query/token/body
logs, minimize derived telemetry, define retention, keep Valkey unpublished,
and document every selected upstream as a query recipient. Privacy and legal
authority remain separate decisions.

## 11. Deployment and operations

**FACT (high):** official installation paths include source/virtualenv plus an
application server and container images. Current container documentation
recommends Compose with SearXNG and Valkey, persistent configuration/cache and
Valkey volumes, and a reverse proxy when exposed publicly [S16]. The official
Compose template publishes the core port, does not publish Valkey, and defaults
the SearXNG image tag to mutable `latest` unless `SEARXNG_VERSION` is supplied
[S17].

**FACT (high):** a minimal install must replace the default secret key. The
recommended public reference setup enables the limiter and image proxy. Limiter
operation requires Valkey and correct trusted proxy/client-IP headers; a public
instance configured without Valkey exits rather than silently running without
the required limiter [S13, S18].

**FACT (high):** the limiter exists because bot traffic through an instance can
make upstreams classify SearXNG itself as a bot. It combines header checks,
IP pass/block lists, and Valkey-backed behavior limits. Its own documentation
states header checks are easy to bypass and IP lists are difficult to maintain
[S18].

### Operational implications

- **RECOMMENDATION (high):** pin a reviewed commit/image digest, source archive,
  settings schema, engine set, and rollback target. Do not deploy `latest`.
- **RECOMMENDATION (high):** separate process health from synthetic search,
  per-engine success, parse-shape, suspension, result count, latency, and quality
  health. A live web process is not a live search service.
- **RECOMMENDATION (high):** cap category fan-out, connections, retries, body
  size, redirects, total deadline, and per-tenant concurrency at the gateway as
  well as inside SearXNG.
- **RECOMMENDATION (high):** maintain an explicit approved-engine allowlist and
  upstream access/terms ledger. Disable adapters that require evasion, unstable
  scraping, unapproved credentials, or unacceptable query disclosure.
- **INFERENCE (medium):** horizontal workers can disagree about process-local
  engine suspension. Monitor status by worker or add an external circuit-breaker
  policy at the separately designed gateway; do not copy SearXNG code to solve
  it.
- **UNKNOWN:** the intended Dokploy/Traefik project identity, image digest,
  worker count, engine list, log policy, health checks, resources, backups, and
  rollback target were not deployed or verified in this research.

## 12. AGPL-3.0-or-later, network use, and separate-service boundary

This section records license text and engineering risk; it is not legal advice.

### 12.1 What the primary license evidence says

**FACT (high):** SearXNG source files and README use the SPDX expression
`AGPL-3.0-or-later`; the repository `LICENSE` contains GNU AGPL version 3, and
the README calls the project AGPL-3.0 [S1, S15]. It must not be represented as
MIT-licensed or Curiosity-owned.

**FACT (high):** AGPL section 13 says that **if the Program is modified**, the
modified version must prominently offer every remote network user an
opportunity to receive that version's Corresponding Source from a network
server at no charge through a standard/customary copying mechanism. The license
defines Corresponding Source to include source and scripts needed to generate,
install, run, and modify the covered work, subject to stated exclusions [S15].

**FACT (high):** conveyance is a separate trigger. Verbatim source conveyance
must preserve notices/license/warranty terms (section 4). Conveying modified
source requires modification/date notices and licensing the covered whole under
the AGPL (section 5). Conveying object code requires a compliant Corresponding
Source mechanism (section 6) [S15].

**FACT (high):** mere remote interaction is not “conveying” under the license's
definition. Running an unmodified copy is expressly permitted; section 13's
additional network source-offer sentence is conditioned on modification [S15].

### 12.2 What cannot be concluded automatically

**UNKNOWN / legal review required:** whether a particular patch, plugin,
template, linked component, same-process gateway, generated configuration, or
deployment packaging forms a modified/combined covered work; the exact boundary
of Corresponding Source for that deployment; and the effect of any dependency's
separate license. A network hop or separate repository name alone does not
decide copyright derivation.

**INFERENCE (high):** an independently authored gateway communicating with an
unmodified SearXNG service through its ordinary HTTP interface is a cleaner
separation than adding `/agent-search` inside SearXNG. It does not, by itself,
prove a legal conclusion, but it reduces code-contamination and coupling risk.

**RECOMMENDATION (high):** during transition:

1. run an unmodified, commit/digest-pinned SearXNG service if feasible;
2. keep the provider-neutral gateway in a separate process/repository and use a
   documented HTTP boundary;
3. preserve upstream copyright, SPDX, license, and source links;
4. retain the exact source and build/deployment material corresponding to every
   deployed image;
5. if SearXNG is modified, provide the prominent section-13 source opportunity
   to all remote users and satisfy conveyance obligations for distributed
   images;
6. do not copy or translate SearXNG adapter, fusion, limiter, or result code into
   Curiosity; and
7. obtain counsel review before public modified deployment or tighter code-level
   integration.

**FACT (high):** AGPL covers the program, not automatically the copyright,
database rights, API permission, or terms for upstream indexes and returned web
content. Every enabled engine and every retained result remains a separate
rights/access review.

## 13. Clean-room lesson ledger

| Observation | Verdict | Curiosity consequence |
| --- | --- | --- |
| One adapter per heterogeneous provider | **ADAPTED** | Keep provider adapters outside the domain contract; independently specify capability and failure interfaces. |
| Category-driven parallel fan-out | **ADAPTED** | Use explicit bounded source plans; categories must have versioned membership and cost/coverage semantics. |
| One thread/request per engine | **REJECTED as copied design** | Specify concurrency/deadline behavior independently and benchmark bounded cancellation/backpressure. |
| Partial results plus engine failures | **ADOPTED concept** | Return typed intended/attempted/completed ledger and stable errors, not localized pairs alone. |
| Temporary suspension after blocks/errors | **ADAPTED** | Use policy-aware circuit breaking with retry time, scope, process consistency, and operator override. Never evade blocks. |
| Upstream rank/engine-weight fusion | **REJECTED formula** | Treat source rank as one observation; build and evaluate owned rank/diversity stages. |
| Scheme-insensitive URL dedupe | **ADAPTED as first layer** | Add reversible URL normalization, captures, content/near-duplicate and owner clusters. |
| Longer title/snippet wins merge | **REJECTED** | Preserve field-level provenance; generate snippets from stored passages in the owned plane. |
| Engine names survive merging | **ADOPTED, strengthened** | Retain provider/index lineage, observation rank, adapter version, request/capture identity, and merge trace. |
| Native JSON reflects internal result objects | **REJECTED as ABI** | Project a small versioned provider-neutral schema and quarantine provider extras. |
| Generated UA, no browser cookies, no-referrer | **ADAPTED** | Minimize disclosure, but disclose all query recipients and do not claim anonymity/authorization. |
| Tor/proxy/source-IP rotation | **DEFERRED for ordinary privacy; REJECTED for evasion** | Egress policy requires separate review; never rotate identity to defeat denial. |
| Limiter protects shared upstream reputation | **ADAPTED** | Add authenticated tenant quotas and total provider budgets; do not depend on heuristic bot headers. |
| Process-local engine suspension | **REJECTED for distributed truth** | Expose worker-aware health or implement an independent coordinated circuit policy. |
| AGPL service source | **REJECTED from owned core** | Operate separately during transition; learn behavior only and retain obligations explicitly. |

### Clean-room controls

1. Implementation teams receive behavior-level requirements from this report,
   not SearXNG source, constants, selectors, fixtures, or control flow.
2. Independently author adapters and tests from provider documentation and
   approved fixtures; retain source/provenance and authorship records.
3. Do not seed the owned corpus from SearXNG results or snippets.
4. Do not reproduce provider HTML selectors, CAPTCHA markers, generated browser
   profiles, or access workarounds.
5. Use public standards for URL/HTTP/JSON behavior and independent IR literature
   for ranking/dedup concepts.
6. Keep SearXNG names and license facts in operational attribution; do not use
   its branding to imply endorsement or project ownership.

## 14. Exact `opencode2-curiosity` implications

The current local contract is documented in ADR 0020 and the owned-search
dossier [L1, L2]. The following are specific, not generic recommendations.

### Preserve unchanged

1. **Tool ABI:** `web_search` remains neutral; `formerhuman_search` remains only
   as a deprecated identical alias until separately removed.
2. **Authority:** only `researcher` may search; retrieval cannot grant itself a
   curiosity follow-up, provider switch, proxy action, or write capability.
3. **Bounds:** keep query 1–500 characters, requested results 1–10, 15-second
   gateway timeout, 256 KiB response cap, fixed approved HTTPS origin/path,
   manual redirect rejection, JSON media validation, URL/string/engine/result
   bounds, stable redacted errors, and no setup-time network request.
4. **Trust:** every title, URL, snippet/content, and engine label remains
   `untrusted-external-evidence` and must be verified against primary sources.

### Correct the operational interpretation

1. **`/agent-search` is not native SearXNG.** Native endpoints are `/` and
   `/search` with query/form parameters and optional `format=json` [S12]. Keep
   the authenticated route in a separate gateway; if it is implemented as a
   SearXNG patch, section-13 modified-network obligations become directly
   relevant.
2. **`maxResults` is an output bound, not fan-out bound.** Configure an approved
   finite engine set and a gateway-side maximum attempts/connections/retries and
   total provider byte/time budget. Record that plan operationally.
3. **Fifteen seconds is an outer deadline.** SearXNG's selected-engine deadline
   must be lower, leaving time for gateway validation/serialization and body
   delivery. A gateway timeout must remain distinguishable from per-engine
   timeout and SearXNG partial success.
4. **Do not expose native machine format publicly.** Native JSON is disabled by
   default for good operational reasons. The gateway may reach a private
   internal service; public UI, native API, and agent route require separate
   authentication/rate/log policies.
5. **Do not trust `unresponsive_engines` as complete.** Preserve it as partial
   evidence, but add intended/eligible/attempted/completed metadata at the
   gateway where knowable. Report `coverage_unknown` for SearXNG because silent
   skip paths remain.
6. **Do not collapse empty results into “no evidence.”** If every engine failed,
   was skipped, or was suspended, return partial/unavailable. Even zero failures
   plus zero results means only “no hits in the attempted configured sources.”
7. **Do not expose SearXNG score.** Current normalized output correctly omits
   score/positions. Engine names are useful attribution but not independent
   corroboration or diversity.
8. **Dedupe remains weak.** SearXNG's merge plus Curiosity URL dedupe does not
   establish content or publisher uniqueness. The researcher must not count ten
   URLs as ten independent sources.
9. **Pin the evidence substrate.** Record SearXNG commit/image digest, gateway
   version, enabled engines/categories/weights, settings hash, region/egress,
   and request timestamp in operator telemetry. Return only a safe opaque
   provider-snapshot identifier to the agent if the ABI is extended.
10. **Privacy is a deployment property.** Disable autocomplete, broad CORS,
    query/token logs, public Valkey, and unneeded native formats; trust only the
    reviewed Traefik/Dokploy path. Token authentication protects the gateway,
    not query secrecy from selected engines.
11. **Deployment is still pending.** Do not infer production readiness from
    source tests or this report. Retain the existing opt-in smoke test and
    deterministic no-production-call unit tests [L1].

### Minimal next contract extension (deferred design)

Without breaking the current tool, the next version should add a bounded
`search_status` object containing opaque request/provider-snapshot ID,
`complete|partial|unavailable`, attempted/completed counts, stable failure
classes, and a coverage warning. Document/capture/passage IDs must wait for the
owned retrieval plane; SearXNG cannot manufacture that custody.

## 15. Facts, inferences, recommendations, and checks

| ID | Claim | Type | Confidence | Check / falsifier | Verdict |
| --- | --- | --- | --- | --- | --- |
| Q1 | SearXNG is federated metasearch, not an owned public-web index. | FACT | High | Official identity, adapter architecture, absence of crawl/index chain [S1, S2]. | **REJECTED foundation** |
| Q2 | Category membership controls potentially broad fan-out. | FACT | High | Settings and web-adapter selection [S3, S8]. | **ADAPTED** |
| Q3 | `maxResults <= 10` does not cap upstream engine work. | INFERENCE | High | Compare OpenCode boundary [L2] with one-thread-per-engine orchestration [S5]. | **REQUIRE provider budget** |
| Q4 | Fusion inherits upstream ranks and rewards repeated URL observations. | FACT + INFERENCE | High | Score formula and merge positions [S5]. | **REJECTED formula** |
| Q5 | Dedup is scheme-insensitive URL/template/image identity, not content identity. | FACT | High | Result hash and merge test [S7, S10]. | **ADAPT first layer only** |
| Q6 | Runtime engine errors usually yield HTTP-200 partial results. | FACT | High | Processor catches, result container, JSON route [S4–S6, S11, S12]. | **ADOPT partial concept** |
| Q7 | Returned unresponsive engines are not a complete attempt ledger. | FACT + INFERENCE | High | Silent skip and display suppression paths [S3–S5, S8]. | **REQUIRE coverage warning** |
| Q8 | Native JSON is unversioned and heterogeneous. | FACT | High | Serializer and typed/legacy result model [S7, S11]. | **REJECTED as ABI** |
| Q9 | SearXNG hides user IP/cookies from upstreams but sends plaintext queries. | FACT | High | Official privacy and API docs [S12, S14]. | **ADAPT with disclosure** |
| Q10 | Public-instance privacy depends on operator/log/proxy configuration. | FACT | High | Official trust warning and proxy logging guidance [S14]. | **REQUIRE private gateway** |
| Q11 | Engine suspension can differ by application process. | FACT + INFERENCE | Medium-high | In-process global status keyed by network; no Valkey path in processor [S4]. | **VERIFY under deployment** |
| Q12 | Modified remote network versions trigger AGPL section 13 source opportunity. | FACT | High | License section 13 [S15]. | **REQUIRE compliance review** |
| Q13 | Mere remote use of an unmodified copy is not the same trigger as modification or conveyance. | FACT | High | AGPL definitions, sections 2, 4–6, 13 [S15]. | **RETAIN exact distinction** |
| Q14 | A separate HTTP gateway is cleaner than patching SearXNG. | RECOMMENDATION | High engineering confidence | Falsified by an approved need that cannot be met through a bounded external adapter. | **ADOPTED boundary** |
| Q15 | Live quality, coverage, and provider compliance are unverified. | UNKNOWN | High | Requires authorized benchmark and provider-by-provider review. | **DEFERRED** |

## 16. Unknowns and required checks

1. **Production identity:** exact Dokploy project, immutable image digest,
   SearXNG commit, gateway commit, configuration hash, and rollback image.
2. **Engine plan:** enabled/disabled/inactive engines, category membership,
   weights, provider APIs versus HTML adapters, credentials, and upstream terms.
3. **Gateway implementation:** whether `/agent-search` is a separate service,
   reverse-proxy transform, or SearXNG modification; its upstream deadline,
   fan-out policy, result truncation order, authentication comparison, and logs.
4. **Failure contract:** whether gateway preserves suspended/timeout/block/parse
   distinctions or only forwards localized `unresponsive_engines` pairs.
5. **Distributed state:** worker count, process-local suspension divergence,
   graceful timeout behavior, connection saturation, and restart effects.
6. **Privacy:** Traefik/Dokploy/application/metrics log fields and retention,
   trusted-proxy correctness, Valkey ACL/network, backups, and incident access.
7. **Quality:** judged relevance, primary-source recall, freshness, engine/index
   overlap, duplicate publisher rate, locale behavior, and failure-conditioned
   coverage.
8. **Legal/access:** provider-by-provider terms, API licenses, query processing
   regions/retention, result-content rights, and counsel's AGPL boundary view.

## 17. Bounded curiosity pass

Scoring is 1 (low) to 5 (high); cost is 1 (cheap) to 5 (expensive). The caller's
declared frame authorized this one post-synthesis pass.

| Thread | Relevance | Value | Novelty | Cost | Outcome |
| --- | ---: | ---: | ---: | ---: | --- |
| Determine whether `maxResults` bounds upstream work | 5 | 5 | 4 | 1 | **Pursued:** orchestration fans out by selected engines; result count is not an upstream-call budget [S5, L2]. |
| Resolve what `unresponsive_engines` omits | 5 | 5 | 4 | 2 | **Pursued:** initialization, capability, selection, and display-suppression paths can be silent [S3–S5, S8]. |
| Resolve ranking after score sort | 4 | 4 | 4 | 1 | **Pursued:** a second category/template grouping pass can alter score order [S5]. |
| Resolve AGPL “all network use” overstatement | 5 | 5 | 3 | 1 | **Pursued:** section 13 is conditioned on a modified Program; conveyance is separately governed [S15]. |
| Probe the intended live `/agent-search` gateway | 5 | 4 | 3 | 5 | `CURIOSITY_NO_GO`: deployment is pending, credentials/live mutation are outside authority, and deterministic research does not call production. |
| Query public SearXNG instances to compare results | 3 | 2 | 2 | 5 | `CURIOSITY_NO_GO`: third-party load/privacy/terms risk and no controlled judged corpus. |
| Exercise CAPTCHAs or rotate proxies/Tor | 2 | 1 | 2 | 5 | `CURIOSITY_NO_GO`: access-evasion behavior is prohibited and irrelevant to the owned design. |
| Audit every engine adapter and upstream term | 4 | 4 | 2 | 5 | `CURIOSITY_NO_GO`: exact production engine allowlist is unknown; review only the authorized deployed set. |
| Run full dependency/SBOM/CVE audit | 3 | 4 | 2 | 5 | `CURIOSITY_NO_GO`: separate pre-deployment supply-chain review; no deployment/adoption was authorized here. |
| Obtain definitive AGPL integration opinion | 5 | 5 | 2 | 5 | `CURIOSITY_NO_GO`: counsel task; this report preserves the exact text and unknown boundary. |

**Stop:** every requested category has primary-source evidence, an explicit
unknown, or a deferred check. Additional adapter examples repeated the same
HTML/API/local adapter and upstream-dependency classes. Coverage and saturation
reached.

## 18. Sources

All web/upstream sources accessed 2026-08-17. Upstream links are official and
commit-pinned where implementation details matter.

### Official SearXNG primary sources

- **[S1] Repository, README, and pinned tree.**
  https://github.com/searxng/searxng/tree/374939b888c8644b408b793fe42d584454631cec and
  https://github.com/searxng/searxng/blob/374939b888c8644b408b793fe42d584454631cec/README.rst
  — product identity, current source snapshot, license declaration, and project
  status.
- **[S2] Engine overview.**
  https://github.com/searxng/searxng/blob/374939b888c8644b408b793fe42d584454631cec/docs/dev/engines/engine_overview.rst
  — adapter purpose, common capabilities, request/response interface, and
  redirect controls.
- **[S3] Engine settings.**
  https://github.com/searxng/searxng/blob/374939b888c8644b408b793fe42d584454631cec/docs/admin/settings/settings_engines.rst
  — categories, timeouts, weights, enablement, tokens, proxies, retries, and
  private engines.
- **[S4] Abstract processor and suspension state.**
  https://github.com/searxng/searxng/blob/374939b888c8644b408b793fe42d584454631cec/searx/search/processors/abstract.py
  — capability skips, result/failure collection, process-local suspension, and
  initialization behavior.
- **[S5] Search orchestration and result fusion.**
  https://github.com/searxng/searxng/blob/374939b888c8644b408b793fe42d584454631cec/searx/search/__init__.py and
  https://github.com/searxng/searxng/blob/374939b888c8644b408b793fe42d584454631cec/searx/results.py
  — fan-out threads, request deadline, timeout marking, merge, score, grouping,
  timings, and unresponsive-engine collection.
- **[S6] Online processor and outgoing settings.**
  https://github.com/searxng/searxng/blob/374939b888c8644b408b793fe42d584454631cec/searx/search/processors/online.py and
  https://github.com/searxng/searxng/blob/374939b888c8644b408b793fe42d584454631cec/docs/admin/settings/settings_outgoing.rst
  — generated headers, request/parse flow, exception classes, connections,
  retries, proxy/Tor, TLS, and timeout configuration.
- **[S7] Result model and normalization.**
  https://github.com/searxng/searxng/blob/374939b888c8644b408b793fe42d584454631cec/searx/result_types/_base.py
  — typed/legacy fields, URL/text/date normalization, hash identity, and
  serialization projection.
- **[S8] Web request adapter.**
  https://github.com/searxng/searxng/blob/374939b888c8644b408b793fe42d584454631cec/searx/webadapter.py
  — category/engine selection, fallback, token validation, input parsing, and
  query construction.
- **[S9] HTTP error and engine exceptions.**
  https://github.com/searxng/searxng/blob/374939b888c8644b408b793fe42d584454631cec/searx/network/raise_for_httperror.py and
  https://github.com/searxng/searxng/blob/374939b888c8644b408b793fe42d584454631cec/searx/exceptions.py
  — 402/403/429, CAPTCHA recognition, access denial, and configured suspension.
- **[S10] Result-container tests.**
  https://github.com/searxng/searxng/blob/374939b888c8644b408b793fe42d584454631cec/tests/unit/test_results.py
  — primary test evidence for scheme-insensitive merge and title/content choice.
- **[S11] Native JSON serializer and error translation.**
  https://github.com/searxng/searxng/blob/374939b888c8644b408b793fe42d584454631cec/searx/webutils.py
  — top-level JSON keys, result projection, date/set conversion, and localized
  unresponsive-engine labels.
- **[S12] Search API and web route.**
  https://github.com/searxng/searxng/blob/374939b888c8644b408b793fe42d584454631cec/docs/dev/search_api.rst and
  https://github.com/searxng/searxng/blob/374939b888c8644b408b793fe42d584454631cec/searx/webapp.py
  — endpoints, methods, parameters, enabled-format requirement, and HTTP
  success/error behavior.
- **[S13] Default search/server settings.**
  https://github.com/searxng/searxng/blob/374939b888c8644b408b793fe42d584454631cec/searx/settings.yml and
  https://github.com/searxng/searxng/blob/374939b888c8644b408b793fe42d584454631cec/docs/admin/settings/settings_search.rst
  — HTML-only format default, autocomplete, suspension defaults, headers,
  secret, method, image proxy, limiter, and outgoing defaults.
- **[S14] Official privacy/private-instance explanation.**
  https://github.com/searxng/searxng/blob/374939b888c8644b408b793fe42d584454631cec/docs/own-instance.rst
  — cookie/header/egress privacy, operator trust, logging caveat, and upstream
  blocking consequences.
- **[S15] GNU Affero General Public License in the SearXNG repository.**
  https://github.com/searxng/searxng/blob/374939b888c8644b408b793fe42d584454631cec/LICENSE
  — definitions, permissions, source/conveyance duties, Corresponding Source,
  and section 13 remote-network interaction.
- **[S16] Official container installation.**
  https://github.com/searxng/searxng/blob/374939b888c8644b408b793fe42d584454631cec/docs/admin/installation-docker.rst
  — official images, Compose recommendation, volumes, maintenance, and reverse
  proxy guidance.
- **[S17] Official Compose template.**
  https://github.com/searxng/searxng/blob/374939b888c8644b408b793fe42d584454631cec/container/docker-compose.yml
  — SearXNG/Valkey services, port publication, volumes, and mutable default tag.
- **[S18] Limiter implementation/documentation.**
  https://github.com/searxng/searxng/blob/374939b888c8644b408b793fe42d584454631cec/searx/limiter.py
  — purpose, Valkey requirement, trusted proxy/IP dependence, checks, and
  public-instance startup behavior.

### Local repository evidence

- **[L1] ADR 0020: provider-neutral bounded web search.**
  `docs/decisions/0020-provider-neutral-web-search.md` — accepted tool/gateway,
  authority, deployment, and AGPL boundary.
- **[L2] Owned public-web search dossier.**
  `docs/research/owned-public-web-search-architecture-2026-08-17.md:84-155`
  — inspected `opencode2-curiosity` source snapshot, exact bounds, normalization,
  adapter behavior, tests, and current gaps.

### Negative results retained

- No owned general-web crawl, capture, index, ranker, or citation store was found.
- No versioned native JSON schema, OpenAPI document, or stable machine error-code
  contract was found.
- No native complete intended/eligible/attempted/completed engine ledger was
  found; `unresponsive_engines` is materially narrower.
- No evidence was found that `maxResults` bounds upstream engine calls or bytes.
- No official judged benchmark establishing relevance, freshness, completeness,
  or diversity superiority was found.
- No production SLO, provider SLA, or guarantee that a configured HTML adapter
  will remain permitted or parseable was found.
- No evidence was found that engine-count agreement equals independent indexes,
  publishers, or viewpoints.
- No live gateway, public instance, provider response, or deployment state was
  tested.
- No transitive dependency/license/CVE audit was performed; adoption was not
  authorized.
