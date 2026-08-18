# Bright Data MCP: clean-room standalone agent-integration study

**Research and primary-source access date:** 2026-08-17  
**Decision frame:** whether Bright Data MCP is a sufficiently bounded,
auditable standalone integration for Curiosity agents, and which observable
contract patterns should be adopted, adapted, rejected, or deferred.  
**Inspected open-source release:** npm `@brightdata/mcp@2.11.1`, whose npm
metadata identifies git commit
`4fa3872cfde4a223187fb6ddb57d34505c9ed5ba` (published 2026-07-27). The
repository head inspected for documentation drift was
`88bbdcda51ed1644edbc542d0672867660d07f0e` (2026-08-12). [S1-S4]  
**Status:** research and recommendations only—not implementation, legal advice,
security testing, a live MCP/API/target call, or procurement approval.

## Executive verdict

**VERDICT — ADAPT the capability vocabulary and narrow tool selection; REJECT
Bright Data MCP as Curiosity's provider-neutral authority, trust, provenance,
or budget boundary; DEFER provider use pending contract and controlled tests
(high confidence).**

Bright Data MCP is a broad agent adapter over several materially different
products:

```text
search_engine / *_batch      -> Web Unlocker request to search-engine URLs
scrape_*                     -> Web Unlocker API
discover                     -> Bright Data asynchronous Discover endpoint
web_data_* (50 tools)        -> Web Scraper API dataset trigger + snapshot poll
list/search_dataset          -> metadata + synchronous dataset-search APIs
scraping_browser_* (14)      -> Browser API over CDP/Playwright
extract                      -> Web Unlocker + MCP client-side LLM sampling
session_stats                -> local process counters only
```

The published v2.11.1 source can register **74 tools**, not the **69** claimed by
the current README. The five source-visible but README-table-absent tools are
`list_dataset_fields`, `search_dataset`, `web_data_reddit_comments`,
`web_data_reuter_news`, and `scraping_browser_fill_form`. Official docs more
loosely say “60+.” Actual hosted `tools/list` remains unknown because no live
connection was authorized. [S1][S5-S9]

The adapter is operationally capable, but its current public contract is too
permissive and too lossy for Curiosity:

- model calls can spend shared credits, create provider jobs, navigate arbitrary
  URLs, click/type/submit forms, collect personal/social data, and invoke a
  caller-paid LLM through MCP sampling;
- startup checks and can automatically create both an Unlocker zone configured
  with `ub_premium: true` and a Browser API zone, even when only basic tools are
  intended;
- there is no per-task dollar, result, byte, domain, page, internal-attempt,
  browser-session, or total-call budget; source defaults include no base-request
  timeout, no local rate limit, and up to 600 one-second polling attempts;
- successful structured objects are returned as JSON-looking MCP text without
  `outputSchema` or `structuredContent`; most other results are prose/Markdown/
  HTML, and screenshot is the only typed media result;
- Web Unlocker target/provider statuses and request IDs are discarded; dataset
  snapshot/task IDs are logged but not returned; null-valued record fields are
  removed; Google SERP output is reduced to link/title/description;
- the generic wrapper logs complete arguments to stderr, including queries,
  URLs, extraction prompts, dataset filters, and browser-typed text;
- asynchronous poll loops retry almost every HTTP failure—including 401, 403,
  404, 429, and 5xx—until the polling ceiling, while exposing no cancellation or
  idempotency key;
- hosted authentication is documented exclusively as a token in the endpoint
  query string, despite Bright Data's general instruction to use bearer headers;
- public docs, source, package/registry manifests, MCPB, and Docker artifacts
  disagree on tool count, batch maximum, rate-limit default, selection
  precedence, country targeting, and version.

Bright Data MCP may be useful as a convenience adapter behind Curiosity-owned
authorization, budget, quarantine, provenance, and audit controls. It must not
be connected as an ambient “all web operations” permission, allowed to modify
its own tool configuration, or treated as an evidence source merely because an
Unlocker, scraper, or LLM returned a successful result.

## 1. Frame, bounded questions, and method

### 1.1 Bounded sub-questions

1. What tools, prompts, input schemas, outputs, annotations, and selection modes
   are actually exposed by the current public package?
2. How do those operations map to SERP, Web Unlocker, Web Scraper, dataset,
   Discover, Browser API, and proxy infrastructure?
3. How do hosted SSE/Streamable HTTP, local stdio, npm, Docker, MCPB, and
   authentication differ?
4. What authority does an agent receive, and which call, time, result, retry,
   polling, byte, browser, and spend bounds exist?
5. What happens on partial success, target/provider error, polling failure,
   timeout, disconnect, duplicate creation, and quota exhaustion?
6. Which outputs remain untrusted, what provenance survives, and where are data
   disclosed or logged?
7. What security, privacy, acceptable-use, license, and service-term boundaries
   apply?
8. Which clean-room lessons should Curiosity adopt, adapt, reject, or defer?

### 1.2 Evidence and clean-room boundary

Only public first-party sources were inspected: Bright Data's official GitHub
repository and release/npm metadata; official product, API, security, pricing,
privacy, AUP, MSA, and DPA materials; and the official MCP specification.
Search was used only for discovery. Material claims trace to their origin.

The official MIT source was read to reconstruct observable contracts. No code
was copied into Curiosity. No account, credential, free credit, API request,
MCP initialization, `tools/list`, tool call, package execution, browser session,
target fetch, traffic capture, security probe, private deployment inspection,
or paid action was performed. A temporary read-only clone of the public release
was used only to count and compare declarations; it was outside the workspace
and is not a project artifact.

This boundary also respects the MSA prohibition on copying, decompiling,
deriving proprietary service source, decrypting, or mapping Bright Data IPs.
“Reverse-engineering” here means public contract and logical architecture
reconstruction, not discovery of private service algorithms. [S23]

Labels:

- **FACT** — directly stated or visible in a cited primary source.
- **INFERENCE** — least-assumptive clean-room interpretation, not a claim about
  hidden implementation.
- **RECOMMENDATION** — a Curiosity design, governance, or procurement action.
- **UNKNOWN / NEGATIVE RESULT** — not established in reviewed public sources.
- Confidence is **high**, **medium**, or **low**.

**Coverage rule:** each requested category ends in evidence or a retained
negative result. **Stop rule:** stop when remaining material gaps require a
credential, live target/provider action, confidential contract/audit evidence,
or proprietary implementation access.

## 2. Product identity and observable architecture

### 2.1 It is an adapter, not one retrieval product

**FACT (high):** the local package is a Node/FastMCP stdio server. It validates
inputs with Zod and calls Bright Data APIs using one `API_TOKEN`; Browser tools
first exchange that token for account/zone information and a Browser-zone
password, then connect Playwright over CDP. [S5-S7]

```text
model / agent
  -> MCP client confirmation and policy (if any)
  -> Bright Data MCP
       |-- Web Unlocker request gateway
       |-- Discover create/poll
       |-- Web Scraper dataset trigger/snapshot poll
       |-- dataset metadata/search
       |-- Browser credential lookup -> CDP browser sessions
       `-- sampling/createMessage back to client (extract only)
  -> target web / search engines / platform-specific collectors
  -> text, JSON-as-text, HTML, ARIA/DOM prose, or screenshot
  -> model / agent
```

**INFERENCE (high):** outer planning—tool choice, fallbacks, retries, browser
steps, pagination, and repeated dataset search—belongs to the agent/client.
Unblocking, peer selection, challenge handling, platform collection, and
Discover ranking are provider-owned inner operations. Neither layer exposes a
complete attempt/evidence ledger.

### 2.2 MCP capability surface beyond tools

**FACT (high):** source registers two MCP prompts:

1. `web_scraping_strategy` instructs the agent to prefer `web_data_*`, then
   retry `scrape_as_markdown` once, then escalate after two failures to Browser;
2. `diagnose_scraping_approach` instructs an Unlocker attempt followed by a
   Browser attempt and recommendation.

The server registers no source-visible resources. `extract` makes a nested MCP
sampling request and therefore additionally depends on a sampling-capable
client/model. [S5][S10][S30]

**RECOMMENDATION (high):** treat prompts as authority-bearing product surface,
not documentation. Automatic retry and Browser escalation must not override a
Curiosity budget or target-policy denial. Nested sampling must be separately
authorized and metered.

## 3. Exact tool exposure and schemas

### 3.1 Tool-selection modes and material drift

The following describes published local package v2.11.1. Hosted behavior may
differ.

| Configuration | Source-visible local behavior | Documentation claim |
|---|---|---|
| no `PRO_MODE`, `GROUPS`, or `TOOLS` | five tools: `search_engine`, `search_engine_batch`, `scrape_as_markdown`, `scrape_batch`, `discover` | Rapid/free; current docs emphasize search, Markdown, Discover and classify batch under advanced group |
| `PRO_MODE=true` | all 74 tools are added immediately | all Pro tools |
| one or more `GROUPS` | union of named group tools; every group includes three base tools: search, Markdown, Discover | selected groups plus base tools |
| `TOOLS` without Pro | only named tools plus any group union; unknown names are silently ineffective | tools “add on”; README says base tools always enabled |
| Pro plus groups/tools | **Pro wins; all tools remain enabled** because source checks Pro first | groups/tools take priority and override Pro |

**FACT/CONTRADICTION (high):** local source default `RATE_LIMIT` is absent/
unlimited, while current local advanced docs say default `100/1h`. Source batch
schemas cap searches and URLs at **5**, while README, docs, and MCPB manifest say
**10**. [S1][S5][S8][S11-S13]

**FACT (high):** groups reduce schema/context exposure, but are not request-level
authorization. Group names and arbitrary tools come from process environment
(local) or endpoint query parameters (hosted). The source does not reject an
unknown group/tool name or report the effective authority set. [S5][S8]

### 3.2 Search, scrape, discovery, dataset search, and local utility (10)

| Tool | Input schema in v2.11.1 | Execution/output |
|---|---|---|
| `search_engine` | required `query:string`; `engine=google|bing|yandex` default Google; optional `cursor:string`; optional `geo_location:string` exactly 2 chars | Web Unlocker call. Google -> JSON text `{organic:[{link,title,description}]}`; Bing/Yandex -> provider Markdown text. |
| `search_engine_batch` | `queries`: array 1–5 of the same fields | one Unlocker call/item in parallel; JSON text with per-item `result` or prose `error`. |
| `scrape_as_markdown` | `url`: syntactically valid URL | Unlocker Markdown is passed through `remark` + `strip-markdown`, retaining links/code but removing much Markdown formatting; returns text. |
| `scrape_batch` | `urls`: 1–5 syntactically valid URLs | parallel Unlocker calls; JSON text of `Promise.allSettled` results. Rejected JavaScript `Error` objects may serialize without useful fields. |
| `scrape_as_html` | `url`: syntactically valid URL | raw Unlocker response body as MCP text; it bypasses configured base timeout/retry helper. |
| `extract` | valid `url`; optional `extraction_prompt:string` | Unlocker Markdown, then `sampling/createMessage` to the MCP client's model; returned model text is not JSON-parsed or schema-validated. |
| `discover` | required `query`; optional `intent`, 2-char `country`, `city`, `language`, integer `num_results`, string-array `filter_keywords`, Boolean `remove_duplicates`, string `start_date`, string `end_date` | create/poll `/discover`; JSON text array of link/title/description/relevance score. |
| `list_dataset_fields` | `dataset_id` enum of exactly 3 IDs (LinkedIn profile, contact-enriched profile, company) | metadata API; JSON text list of active field name/type/description. |
| `search_dataset` | same 3-ID enum; required filter tree; `size` positive integer max 10 default 10; optional sort and arbitrary `search_after[]` | synchronous dataset search; JSON text `{hits,total_hits,took,search_after?}`. |
| `session_stats` | empty object | process-memory tool-call counts; no provider usage, records, bytes, browser traffic, credits, dollars, or failed-attempt accounting. |

Search-dataset filters permit depth-three `and|or` groups and leaves with
`name:string`, `operator:string`, and a scalar/array value. The description lists
operators (`=`, `!=`, comparisons, membership, includes, null checks), but the
leaf operator itself is only `z.string()`, not an enum. Field names and values
are not locally checked against metadata. [S5][S14]

**Schema negative results (high):** there are no query/prompt length bounds,
result maximum for Discover, keyword-array cap, date-format/order validation,
cursor integer validation, country alphabetic validation, output-byte bound, or
domain allow/deny list. `scrape_as_*` accepts any URL scheme accepted by Zod's
URL parser; Browser navigation uses only `z.string()`. Downstream services may
reject more cases, but those rules are not agent-visible admission controls.

### 3.3 Structured Web Scraper dataset tools (50)

All 50 tools are generated from one pattern:

- every listed input is a **string**; `url` alone receives generic URL syntax
  validation, not the platform path/host validation promised in descriptions;
- listed inputs are required unless a default is explicitly shown below;
- the server submits a one-object array to `/datasets/v3/trigger` with a fixed
  provider `dataset_id`, then polls the snapshot endpoint once per second;
- all are annotated `readOnlyHint: true` and `openWorldHint: true`, even though
  each call creates a provider collection job and may collect/bill records;
- output is the provider snapshot body after recursively dropping every null
  property, serialized as MCP text; no per-tool output schema is declared.

| Tools | Required/optional string inputs and adapter-fixed behavior |
|---|---|
| `web_data_amazon_product`, `web_data_amazon_product_reviews` | `url` |
| `web_data_amazon_product_search` | `keyword`, `url`; fixed `pages_to_search="1"` |
| `web_data_walmart_product`, `web_data_walmart_seller`, `web_data_ebay_product`, `web_data_homedepot_products`, `web_data_zara_products`, `web_data_etsy_products`, `web_data_bestbuy_products`, `web_data_google_shopping` | `url` |
| `web_data_linkedin_person_profile`, `web_data_linkedin_company_profile`, `web_data_linkedin_job_listings`, `web_data_linkedin_posts` | `url` |
| `web_data_linkedin_people_search` | `url`, `first_name`, `last_name` (all required strings despite the apparent alternatives) |
| `web_data_crunchbase_company`, `web_data_zoominfo_company_profile` | `url` |
| `web_data_instagram_profiles`, `web_data_instagram_posts`, `web_data_instagram_reels`, `web_data_instagram_comments` | `url` |
| `web_data_facebook_posts`, `web_data_facebook_marketplace_listings`, `web_data_facebook_events` | `url` |
| `web_data_facebook_company_reviews` | `url`, `num_of_reviews:string` |
| `web_data_tiktok_profiles`, `web_data_tiktok_posts`, `web_data_tiktok_shop`, `web_data_tiktok_comments` | `url` |
| `web_data_google_maps_reviews` | `url`; `days_limit:string` default `"3"` |
| `web_data_google_play_store`, `web_data_apple_app_store` | `url` |
| `web_data_reuter_news`, `web_data_github_repository_file`, `web_data_yahoo_finance_business` | `url` |
| `web_data_x_posts` | `url` |
| `web_data_x_profile_posts` | `url`; `start_date` and `end_date` default empty strings; fixed discovery mode and `limit_per_input:10` |
| `web_data_zillow_properties_listing`, `web_data_booking_hotel_listings` | `url` |
| `web_data_youtube_profiles`, `web_data_youtube_videos` | `url` |
| `web_data_youtube_comments` | `url`; `num_of_comments:string` default `"10"` |
| `web_data_reddit_posts` | `url` |
| `web_data_reddit_comments` | `url`; `days_back:string` default empty |
| `web_data_chatgpt_ai_insights` | `prompt`; fixed ChatGPT URL/country/web-search/additional-prompt values; projection `answer_text_markdown` |
| `web_data_grok_ai_insights`, `web_data_perplexity_ai_insights` | `prompt`; fixed site URL and other values; projection `answer_text_markdown` |
| `web_data_npm_package`, `web_data_pypi_package` | `package_name` |

**FACT (high):** the adapter's descriptions repeatedly say a tool can be a
cache lookup. A structured record is therefore not necessarily a live fetch.
The generic response omits the fixed `dataset_id`, snapshot ID, cache
disposition, collector version, and charged records unless they happen to be in
the returned provider body. [S5]

**CONSEQUENCE:** URL descriptions such as “Amazon `/dp/`” and “Walmart `/ip/`”
are agent guidance, not local validators. Review/count/date inputs that are
semantically numeric are strings with no range or format checks. Platform
collector schemas remain provider-defined and mutable.

### 3.4 Browser automation tools (14)

| Tool | Input schema | Important behavior |
|---|---|---|
| `scraping_browser_navigate` | `url:string`; optional 2-letter alphabetic `country` | obtains/reuses a Browser session, clears recorded requests, `goto` with 120s timeout and DOM-content-loaded wait; returns title/final URL prose |
| `scraping_browser_go_back`, `scraping_browser_go_forward` | empty | mutates navigation; returns title/URL prose |
| `scraping_browser_snapshot` | optional `filtered:boolean` default false | ARIA snapshot; optionally adds a DOM-derived interactive-element list with refs |
| `scraping_browser_click_ref` | `ref`, `element` strings | click timeout 5s |
| `scraping_browser_type_ref` | `ref`, `element`, `text`; optional `submit` | fills, optionally presses Enter; success output echoes typed text |
| `scraping_browser_fill_form` | `fields`: array of `{name,type,ref,value}` with no minimum; type enum textbox/checkbox/radio/combobox/slider | serially fills/checks/selects fields; has no source annotations object |
| `scraping_browser_screenshot` | optional `full_page` default false | MCP image content; no source byte/pixel cap |
| `scraping_browser_network_requests` | empty | method, URL, status/status text since navigation; no headers, body, timing, redirect, initiator, or hash |
| `scraping_browser_wait_for_ref` | `ref`, `element`; optional `timeout:number` default 30,000ms | no nonnegative or maximum bound |
| `scraping_browser_get_text` | empty | page-body inner text |
| `scraping_browser_get_html` | optional `full_page` default false | body `innerHTML` or full serialized page; no byte bound |
| `scraping_browser_scroll` | empty | one scroll to document bottom |
| `scraping_browser_scroll_to_ref` | `ref`, `element` | scrolls referenced element into view |

**FACT (high):** source annotations mark navigation/history/click/type/scroll as
destructive and navigation as open-world; snapshot/screenshot/text/HTML/network
and wait are read-only. `fill_form` declares no annotations. MCP warns that
annotations are untrusted hints, not authorization. [S6][S29]

**FACT (high):** one process-global `open_session` is used. A `Browser_session`
keeps a separate CDP browser/page/request map per parsed **hostname** and never
exposes a close-session tool. Changing country replaces the global session
reference without explicitly closing prior domain sessions. Browser API itself
documents one domain/session, five-minute network-idle termination, and a
60-minute maximum. [S6-S7][S27]

**INFERENCE (medium-high):** in ordinary local stdio, one client owns the
process, but browser pages, counters, and last client identity are still
process-global rather than explicitly tenant/session scoped. It is **UNKNOWN**
whether the hosted service reuses this state model or isolates every remote MCP
session in a dedicated process.

## 4. Mapping to Bright Data products

| MCP family | Actual public-source mapping | Not equivalent to / important loss |
|---|---|---|
| Search | `POST api.brightdata.com/request` to Google/Bing/Yandex URLs through the configured Web Unlocker zone; Google requests `parsed_light` | SERP-like behavior, but not the dedicated SERP API contract; no SERP request ID/status/features; Bing/Yandex schema differs from Google |
| Markdown/HTML scrape and batch | Web Unlocker API | not a neutral fetch; managed proxies, challenge handling, CAPTCHA and retries are opaque; headers/status/debug evidence discarded |
| Discover | `/discover` create + get-by-task-id polling | separate asynchronous ranked-discovery service; task ID is not returned to the caller |
| `extract` | Web Unlocker scrape plus MCP client sampling | not Web Scraper API and not a provider-defined extraction schema; adds the client's model/data/cost boundary |
| `web_data_*` | fixed Web Scraper API collector (`dataset_id`) + snapshot lifecycle | not a generic scraper, Crawl API, or live guarantee; no list/cancel/download/parts/delivery surface |
| dataset list/search | metadata and synchronous Elasticsearch-described dataset search over three fixed datasets | not unrestricted Dataset Marketplace or Deep Lookup; cursor permits repeated enumeration |
| Browser | Browser API via retrieved zone password and CDP | not Web Unlocker fetch; stateful remote browser interaction and traffic billing |
| Proxy infrastructure | indirect dependency of Unlocker/Browser/scrapers | no raw proxy tool, peer selector, or proxy evidence contract |

**FACT (high):** there is no MCP tool for generic Crawl API, Scraper Studio
creation/editing, generic snapshot list/get/cancel, delivery, Dataset
Marketplace purchase, raw Residential/ISP/Datacenter proxy access, account
balance, spend limit, zone list/create, or API-key management. Zone creation is
instead a hidden startup side effect. [S5][S16]

**RECOMMENDATION (high):** never map the server to a single neutral `Search` or
“web” capability. Curiosity must negotiate distinct `Search`, `FetchKnownUrl`,
`Discover`, `ExtractWithModel`, `CollectTypedRecord`, `SearchDataset`, `Render`,
and `Interact` authorities.

## 5. Authentication, transport, and deployment

### 5.1 Hosted remote MCP

**FACT (high):** Bright Data documents two hosted endpoints:

- legacy HTTP+SSE: `https://mcp.brightdata.com/sse?token=...`;
- Streamable HTTP: `https://mcp.brightdata.com/mcp?token=...`.

Optional query fields select `unlocker`, `browser`, `pro`, `groups`, and
`tools`. No username is used. [S12][S15]

**SECURITY FINDING (high):** every official hosted example places the API token
in the URI. Such a token can enter copied configuration, shell history,
screenshots, browser/client diagnostics, reverse-proxy/access logs, and support
artifacts. TLS protects transit, not endpoint-local URI handling.

**CONTRADICTION (high):** Bright Data's documentation index says “ALWAYS” send
the API key as `Authorization: Bearer`, and its general authentication guide
requires that header for APIs; the remote MCP pages document only query-token
authentication. No bearer-header, OAuth, short-lived delegated token,
MCP-specific scope, or per-tool credential option was found for hosted MCP.
[S15-S17]

**UNKNOWN / NEGATIVE RESULT:** the public repository implements stdio only. It
does not establish the hosted gateway's source/build, session ID and state
isolation, Origin validation, CORS, GET/DELETE behavior, SSE replay,
disconnect/cancellation behavior, request/output cap, gateway timeout, audit
log, token redaction, or whether hosted schemas exactly match v2.11.1. MCP
requires Origin validation for Streamable HTTP and recommends proper auth, but
compliance was not tested. [S5][S31]

### 5.2 Local stdio

**FACT (high):** local examples run `npx @brightdata/mcp` and pass `API_TOKEN`
plus optional configuration in the child environment. stdio keeps MCP messages
between client and subprocess, but the subprocess still sends all operations to
Bright Data and may send scraped content back to the client's model via
sampling. It is not local/offline retrieval. [S1][S13]

**FACT (high):** startup, before MCP service begins, lists active zones. If the
configured/default zones are absent, it attempts to create:

- `mcp_unlocker`, type `unblocker`, plan `{type:"unblocker",ub_premium:true}`;
- `mcp_browser`, type `browser_api`.

Errors are logged and startup continues. This happens regardless of effective
tool selection. Browser use later calls account status and zone-password APIs.
[S5-S6]

**AUTHORITY CONSEQUENCE (high):** the integration needs more than content-read
authority to deliver its advertised zero-setup behavior. Public materials do
not state the minimum API-key role that can simultaneously use APIs, create
zones, and retrieve Browser zone passwords. Bright Data recommends a scoped
`User` key for least privilege, but the documented `User` role cannot manage
product configuration; exact compatibility is **UNKNOWN**. [S17][S22]

### 5.3 Package, MCPB, Docker, and version identity

| Artifact observed | Identity / issue |
|---|---|
| npm latest | 2.11.1; integrity, signature, SLSA provenance pointer, git head `4fa3872...` |
| GitHub latest release | v2.11.1, same source commit |
| repository head package | still 2.11.1; README changed later |
| `manifest.json` (MCPB manifest) | 2.10.0 |
| committed binary filename | `brightdata-mcp-2.7.1.mcpb` |
| `server.json` MCP Registry descriptor | 2.9.4 |
| current README/docs | 69 / “60+” tools, while source can expose 74 |

**FACT (high):** npm examples are unpinned. The published package declares
semver ranges for most dependencies; its `files` list excludes `package-lock`,
so installation does not reproduce the repository's full lock graph. Local
execution therefore adds supply-chain and host-process risk. [S1-S4][S18]

**FACT (high):** the public Dockerfile's release stage copies `server.js`, two
browser files, package manifests, but omits source-imported `prompts.js`,
`tool_groups.js`, `search_utils.js`, `search_dataset_schema.js`, and
`aria_snapshot_filter.js`. On the inspected commit, that image layout cannot
satisfy all static module imports. No official container digest/release image
was found. [S19]

**RECOMMENDATION (high):** reject unpinned `npx` and the current Dockerfile for
controlled use. If local evaluation is authorized later, pin package version
and integrity, verify npm attestation/git identity, review dependencies, run
with a minimal environment/filesystem/network profile, disable startup mutation,
and record the observed `tools/list` digest rather than trusting a manifest
version.

## 6. Authority, budgets, limits, and pricing

### 6.1 Agent authority

MCP tools are model-controlled; MCP recommends a human able to deny calls, but
does not mandate a confirmation UI. Bright Data supplies annotations and tool
descriptions, not an in-server confirmation/elicitation gate. [S29]

Connecting a broad key can permit the model to:

- issue paid search/scrape/Discover calls and parallel batches;
- trigger platform collectors and poll long-running snapshots;
- search professional/company datasets repeatedly with cursors;
- disclose prompts to ChatGPT, Grok, and Perplexity collection products;
- start/reuse remote browsers, navigate arbitrary strings, observe requests,
  click controls, type arbitrary content, submit forms, and retain session state;
- ask the MCP client to call an LLM on provider-returned webpage content; and
- indirectly cause account-zone creation at process startup.

**CONTRADICTION (high):** README use-case text recommends Browser tools for
“login walls,” while Bright Data's AUP forbids collection of nonpublic data
behind login. The Browser tools themselves do not block login fields,
credentials, posting, purchases, or other consequential form submissions.
[S1][S24]

### 6.2 Source-visible bounds

| Dimension | Bound |
|---|---|
| local tool-call rate | optional process-memory `RATE_LIMIT=N/T`; source default unlimited; counts outer tool calls, not internal requests/records/bytes |
| basic retry | `BASE_MAX_RETRIES`, nominally 0–3; source default 0; only helper-using base calls; no backoff/jitter |
| basic timeout | `BASE_TIMEOUT` seconds; source default Axios `0` (no timeout) |
| batch | source max 5 searches or URLs, executed concurrently |
| web-data/Discover polling | `POLLING_TIMEOUT` attempts, one/second; default 600; no upper validation |
| Browser navigation | 120 seconds in adapter |
| Browser ref click/wait | click 5 seconds; wait default 30 seconds, caller number unbounded |
| Browser provider lifecycle | connect 30 seconds; network idle 5 minutes; total 60 minutes; one provider-defined domain/session |
| dataset search | max 10 returned hits/call; caller can paginate |
| Amazon search / X profile | first page fixed / limit 10 fixed |

There is no tool-schema field for maximum dollars/credits, internal provider
attempts, total target requests, records, response bytes/tokens, redirects,
browser requests/traffic/pages/domains, calls, polls, retries, wall deadline,
concurrency, or retained context. There is no idempotency key, cancel tool, or
client operation ID. [S5-S7]

**Implementation edge (high):** `BASE_MAX_RETRIES` and polling values are parsed
from strings without robust finite/nonnegative validation. The retry helper
retries network/5xx failures immediately, but not outer 4xx. Discover and
Web-Scraper pollers retry every caught failure except HTTP 400—including auth,
permission, not-found, throttling, and provider errors—once per second until the
ceiling.

### 6.3 Pricing observed 2026-08-17

| MCP activity | Published meter / caveat |
|---|---|
| free account pool | 5,000 shared monthly credits across eligible products; the free-tier page describes one credit per eligible request or record without fully reconciling the unit by MCP tool; hard stop only if no deposited balance |
| search, scrape, extract | MCP pricing page: PAYG $1.50/1K “results”; $1.30/$1.10/$1.00 at $499/$999/$1,999 monthly tiers |
| Browser navigation | $8/GB PAYG; $7/$6/$5 per GB at the same tiers |
| `extract` client sampling | no Bright Data receipt; separate client/model token cost and policy may apply |
| dataset polling/status and `session_stats` | no MCP-specific price found |

**CONTRADICTION (high):** README/pricing copy says Browser automation is included
in the 5,000-request free tier, while the detailed free-tier page says Browser
API is **not** included and instead gets a separate one-time $2 trial (plus a
conditional $5 bonus). The latter is the more specific billing contract and
must control planning until Bright Data confirms otherwise. [S1][S20-S21]

**UNKNOWN:** “result” is not reconciled per tool: one Google call returns many
SERP rows; Web Scraper APIs charge records; Discover returns a ranked list;
batches issue multiple underlying requests; Browser interactions generate
traffic. No tool result reports charged units, dollars, remaining balance,
provider retries, or billable browser bytes.

**RECOMMENDATION (high):** Curiosity must pre-authorize a complete operation
plan: tool/capability, target/domain/data class, maximum outer and internal
calls, batch width, rows, polls, browser navigations/requests/bytes, sampling
tokens, attempts, wall time, and dollars. Provider account balance and the local
rate limiter are backstops, not per-run budgets.

## 7. Errors, retries, cancellation, and ambiguous disposition

### 7.1 Three status layers are collapsed

Web Unlocker direct API can return outer HTTP 200 after admission while placing
the Unlocker/target outcome in `x-brd-status-code`; errors use
`x-brd-error-code` or `x-brd-err-code`, and debug mode can provide a request ID.
The MCP code returns body data and discards those headers. It therefore cannot
reliably distinguish MCP transport success, Bright Data execution success, and
target HTTP success. [S5][S26]

The generic wrapper logs Axios HTTP status, text, and body. If response data has
a `.length`, it throws `HTTP <status>: <data>`; otherwise it generally rethrows
the library error. It does not return a stable structured taxonomy, retry-after,
provider request ID, target status, or ambiguity flag.

**FACT (high):** when a particular default-zone quota code is detected, the
wrapper creates a long imperative error telling the agent it “must immediately
stop,” tell the user to create another Unlocker zone, modify MCP configuration,
and restart the client. This is commercial/operational instruction embedded in
an error channel, not a typed quota state. [S5]

**RECOMMENDATION (high):** Curiosity must translate provider failures to bounded
data: `invalid`, `auth`, `permission`, `policy`, `robots_denied`, `target`,
`unreachable`, `timeout`, `rate_limited`, `quota_exhausted`, `capacity`,
`provider`, `partial`, and `unknown`. Preserve redacted raw codes/statuses and
retry-after separately. Never let provider error prose command configuration,
purchases, retries, or user messaging.

### 7.2 Batch and async behavior

- Search batch catches each failure and returns its message beside successful
  items.
- Scrape batch uses `Promise.allSettled`; JSON serialization of rejected Error
  values can erase message/type, producing a weak partial-result contract.
- Discover returns only final result rows; its task ID is stderr-only.
- Every `web_data_*` call creates a snapshot, but the returned result does not
  add the snapshot ID; terminal `failed`/`canceled` states are not explicitly
  handled by the recognized pending-state list.
- Polling recognizes a few mutable state strings and otherwise treats the body
  as a result. Public Web Scraper documentation itself has state/status drift.
- No MCP tool lists, gets by durable ID, cancels, resumes, or reconciles a job.

**UNKNOWN / NEGATIVE RESULT:** no safe duplicate-trigger rule, idempotency key,
disconnect-to-cancel mapping, terminal immutability, partial-result contract,
poll-cost contract, or local recovery after process/client loss is exposed. MCP
also states transport disconnection is not cancellation. [S5][S31]

**RECOMMENDATION (high):** never blindly replay an ambiguous Discover or dataset
trigger. Curiosity must persist intent and attempt before dispatch, bind returned
provider IDs, poll through a durable coordinator with deadline/jitter/max polls,
and represent `locally_abandoned`, `provider_unknown`, `provider_failed`, and
`completed_unverified` separately.

## 8. Untrusted outputs, provenance, and reproducibility

### 8.1 Output shape

**FACT (high):** no source tool declares an MCP `outputSchema` or returns
`structuredContent`. Strings—including serialized JSON—become unstructured MCP
text through FastMCP. Screenshot returns image content. There are no returned
resource links, content annotations, byte counts, trust labels, or
cryptographic digests. MCP supports all of these stronger shapes. [S5-S7][S29]

Potentially hostile content includes:

- SERP titles, URLs, descriptions, and Bing/Yandex Markdown;
- scraped text, links, code blocks, HTML, scripts, attributes, and errors;
- arbitrary structured-record strings, URLs, biographies, comments, reviews,
  posts, package READMEs, and LLM-generated answer Markdown;
- Discover titles/descriptions/links;
- dataset field descriptions, hits, and cursor values;
- ARIA/DOM accessible names, page text/HTML, network URLs/status text, image
  pixels, and browser titles/URLs; and
- sampling output generated from attacker-controlled webpage content.

Bright Data itself warns that scraped web content is untrusted and should be
filtered before an LLM prompt. Its source `extract` nevertheless directly
places fetched Markdown into a sampling prompt; the custom extraction prompt
and webpage can both influence the nested model. [S5][S22]

### 8.2 Provenance preserved and lost

| Family | Preserved | Lost or not guaranteed |
|---|---|---|
| Google search | rank order within `organic`, link, title, description | engine status, query echo, request ID, target status, result features, scores, capture/index time, cache, provider attempts |
| Bing/Yandex | provider Markdown text | typed result schema and all above |
| scrape | transformed text or body | request/debug ID, target/provider status, final URL, redirects, headers, content type, raw bytes, fetch time, renderer/retry/peer/cache evidence, hash |
| Discover | link/title/description/relevance score | task ID, ranking/model/version, search branches, sources consulted, stop reason, cost |
| web-data | provider-returned non-null fields | wrapper removes nulls; snapshot/dataset ID not added; no immutable collector/schema version, per-record fetch trace, cache disposition, charged units, raw-byte binding |
| dataset search | hits, total, duration, next cursor | dataset/version not echoed, source capture lineage per hit not guaranteed |
| Browser | current/final page URL/title, page-derived output, basic network URL/status | provider session ID, browser build, redirects/headers/bodies/timing, requested/observed geo, retry/CAPTCHA/peer history, billable bytes, DOM derivation, content hash |

**FACT (high):** the Web-data serializer recursively converts every `null` to
missing before returning results. This destroys the distinction between
provider-declared null and field absence/schema drift. [S5]

**INFERENCE (high):** JSON-looking text is convenient for a model but is not a
validated evidence contract. Unlocking success means provider operational
acceptance, a scraper `ready` result means collection ended, and an LLM answer
means text was generated. None proves accuracy, freshness, completeness,
lawfulness, or claim-to-source support.

### 8.3 Curiosity handling

**RECOMMENDATION (high):** every result must enter a quarantine/data channel
with `untrusted_external_data=true`. Curiosity should:

- validate a provider-neutral result schema and cap items, nesting, strings,
  bytes, images, decompression, and tokens before model exposure;
- neutralize active HTML and never execute returned instructions;
- authorize every returned URL again before dereference;
- preserve null versus missing, raw provider state/code, partial/truncation, and
  schema drift;
- bind requested/final URL, start/end times, provider/tool/build/schema digest,
  target/provider status, content/media type, content hash, extraction chain,
  policy decision, and cost where observable; and
- require a new authorization decision before retrieved data can cause another
  search, fetch, scraper, browser, sampling, shell, configuration, or payment
  action.

## 9. Privacy, safety, and security

### 9.1 Data disclosures and local logging

Every call can reveal investigative intent. Search/Discover send queries,
filters, dates, location, and intent; scraping sends full URLs; platform tools
send profile/product/post URLs, names, date ranges, and prompts; Browser sends
navigation and form interaction to provider and target; `extract` sends webpage
content plus extraction instructions to the MCP client's selected model.

**FACT (high):** `tool_fn` writes the complete input object to stderr before
execution. This includes full URLs/query strings, search and LLM prompts,
dataset filters, extraction prompts, and Browser `text`/form `value` fields.
Dataset snapshot IDs and Discover task IDs are also logged. MCP clients may
capture or forward subprocess stderr. [S5][S31]

**RECOMMENDATION (high):** do not send credentials, signed/private URLs,
personal secrets, customer data, or form credentials. Production adapters must
use structured redaction by field/data class, never log raw prompts/URLs/typed
values, and keep content-bearing diagnostics disabled by default.

### 9.2 Target/network and browser safety

Web Unlocker documentation states private/reserved targets and unsupported ports
can be blocked by provider policy. The MCP adapter itself exposes no public-IP,
scheme, port, DNS, redirect, subresource, download, or per-domain policy and no
network-policy receipt. Browser navigation is merely a string and permits page
scripts, cross-origin resources, clicks, typing, form submission, screenshots,
and request observation. [S6][S26-S27]

**UNKNOWN / SECURITY NEGATIVE RESULT:** public MCP sources do not establish
hosted gateway SSRF controls; DNS-rebinding defense; redirect-hop and browser
subresource revalidation; safe-port list; browser worker/process/filesystem/
network tenant isolation; CPU/memory/disk/request/image/output bounds; session
cleanup; or protection against a credential-bearing CDP endpoint appearing in
library errors/logs.

**RECOMMENDATION (high):** Curiosity must independently normalize and authorize
targets, deny private/reserved/link-local/metadata/service addresses and unsafe
schemes/ports after DNS resolution, recheck redirects/connections, and cap all
requests/bytes/time. Browser interaction must be a separately approved
capability with credentials, login, posting, payment, download, upload, and
CAPTCHA solving denied by default.

### 9.3 API key and shared-state risks

Bright Data API keys have broad roles (Admin, Finance, Ops, Limit, User) and can
expire, but no MCP-specific, per-tool, per-dataset, per-target, per-zone,
per-client, or per-purpose scope was found. One token is used for all selected
operations. [S17]

Source process state—call counters, timestamps, current browser country/session,
and last client info—is global. `extract` selects `server.sessions[0]` for
sampling. **INFERENCE (medium):** a multi-client deployment of this exact stdio
process model would risk wrong-session sampling/attribution and browser-state
sharing. Ordinary stdio is normally one subprocess per client; hosted
multi-tenancy is unknown and must not be inferred from local source.

### 9.4 Published security posture and limits of assurance

**FACT (medium, vendor-claimed/attested as identified):** Bright Data reports
ISO 27001/27017/27018 scope covering agent/RAG public-web collection, SOC 2 Type
II under NDA, public SOC 3, TLS 1.3/minimum 1.2, AES-256 at rest, AWS multi-AZ,
RBAC, secure SDLC, and annual testing. Its listed 2025 penetration-test products
include APIs, Unlocker, SERP, Web Scraper, Marketplace, proxies, and archive, but
do not explicitly name the MCP hosted gateway or Browser API worker. [S22]

Certification is not proof of MCP query-token redaction, exact remote-session
isolation, browser containment, output sanitization, or Curiosity's account
configuration.

### 9.5 Privacy and service terms

**FACT (high):** the privacy policy covers account/KYC identifiers, IPs,
documents, payment data, possibly recorded calls, usage analytics, and public
personal data; permits service providers/affiliates and processing outside the
EEA under asserted safeguards; and uses purpose/legal-need rather than fixed
retention. It says User Data is not rented or sold, while its CCPA notice says
the category “Identifiers” may have been sold in the preceding 12 months.
[S25]

**FACT (high):** the MSA makes the client responsible for actions, law,
third-party rights, and privacy; disclaims accuracy, completeness,
non-infringement, security, virus absence, and uninterrupted/error-free service;
and gives Bright Data broad suspension rights. For Proxy Services and Scraping
Browser API, it says Bright Data may retain client-collected data and use it for
its own purposes in its sole discretion. A similar clause covers Web Scraper
IDE. [S23]

**MATERIAL UNKNOWN (high):** the MSA does not name “MCP Server,” “Web Unlocker
API,” or current “Web Scraper API” in that retention/reuse clause. Because MCP
routes across these products, it is unsafe to assume either that all collected
inputs/results are covered by the clause or that they are exempt. Public sources
do not specify hosted MCP query/result/error/gateway logs, ordinary retention,
regions, support access, model training, deletion SLA, or nested-sampling model
retention.

The public DPA supplies general processor commitments but does not resolve the
MCP-specific data-flow and retention questions. [S28]

**RECOMMENDATION (high):** assume ordinary provider and client/model logging
until contractually disproved. Require an order-form/DPA schedule covering MCP,
Unlocker, Discover, Browser, Web Scraper, dataset search, and nested sampling:
no independent reuse/training; exact content/URL/prompt/job/browser/log/backup
retention; deletion SLA; regions/subprocessors; support access; incident timing;
and audit evidence.

### 9.6 Acceptable use and source rights

Bright Data's AUP prohibits nonpublic/behind-login collection, fraud, spam,
impersonation, fake accounts/content/engagement, automated ticket purchasing,
SEO manipulation, and violations of law or third-party rights; it may block
content/categories at its discretion. [S24]

**RECOMMENDATION (high):** provider access, KYC, unblocking, CAPTCHA success, a
pre-built collector, or a Browser interaction does not grant target permission.
Curiosity must enforce purpose, robots, terms, copyright/database rights,
privacy, proportionality, and data-subject handling before dispatch. Social and
professional records remain potentially personal data even when public.

## 10. Clean-room logical architecture

The following is **INFERENCE**, not a claim about Bright Data's private hosted
code, orchestrators, stores, ranking models, or browser isolation technology.

```text
Curiosity / MCP client
  | local stdio OR hosted SSE/Streamable HTTP query-token gateway
  v
MCP schema + static tool-selection layer
  |-- startup account/zone provisioning
  |-- in-memory rate/call/session state
  |
  +--> Unlocker adapter -> provider unblock/proxy/challenge/retry -> target
  |       |-> SERP URL transformation / Markdown stripping
  |       `-> optional client sampling for extract
  |
  +--> Discover create -> task poll -> ranked result projection
  |
  +--> collector definition (fixed dataset_id)
  |       -> Web Scraper trigger -> snapshot poll -> null-stripped JSON text
  |
  +--> dataset metadata/search -> bounded hits/cursor
  |
  `--> account + zone-password lookup -> CDP endpoint
          -> per-host Browser API sessions -> page state/ARIA/network/image
```

This model is supported by public endpoints and source control flow. It does
not establish hosted tenant/process topology, queueing, storage technology,
unblocking retries, scraper implementations, Discover model/ranker, cache
policy, proxy peer selection, or browser worker isolation.

## 11. Curiosity decision ledger

### Adopted

1. **ADOPT — capability-specific naming (high).** Search, known-URL fetch,
   structured platform collection, dataset search, discovery, rendering, and
   interaction are distinct permissions.
2. **ADOPT — narrow tool-set negotiation (high).** Expose only tools needed for
   an approved purpose; keep the effective schema digest in audit records.
3. **ADOPT — static fetch before Browser (high).** Browser interaction is a
   higher-authority, traffic-metered escalation, never a transparent retry.
4. **ADOPT — ref-based browser actions (medium-high).** A fresh accessibility
   snapshot and opaque element ref is safer than model-guessed selectors, while
   still requiring action confirmation and freshness checks.
5. **ADOPT — batch item-level disposition (medium-high).** Partial success must
   be representable per item rather than failing an entire bounded batch.
6. **ADOPT — split asynchronous creation/observation concept (high).** Durable
   provider work needs a stable local/provider handle even though the current
   MCP wrapper fails to expose it adequately.

### Adapted

1. **ADAPT — groups into policy profiles (high).** Curiosity-owned profiles bind
   tenant, purpose, data class, target policy, tool set, result/byte/call/time/
   dollar limits, and secret reference. They cannot be changed by model output.
2. **ADAPT — JSON text into validated structured results (high).** Publish
   output schemas/`structuredContent`, retain bounded text compatibility, and
   quarantine violations.
3. **ADAPT — provider jobs into durable owned attempts (high).** Persist intent,
   idempotency fingerprint, provider task/snapshot/session ID, every state
   observation, deadline, cancellation request, cost, and unknown disposition.
4. **ADAPT — Unlocker status into three layers (high).** Preserve MCP transport,
   provider/unlocker, and target outcomes separately with stable codes.
5. **ADAPT — platform collectors into namespaced extractors (high).** Fixed
   `dataset_id` remains adapter metadata; Curiosity owns expected schema/version,
   evidence requirements, personal-data policy, and drift quarantine.
6. **ADAPT — nested sampling into an explicit transform (high).** Name the
   model/provider, prompt/version, input hash, token/cost cap, injection policy,
   output schema, and human approval. Do not hide it inside `extract`.
7. **ADAPT — Browser state into an explicit finite session (high).** One approved
   public domain, fresh profile, maximum navigations/requests/bytes/time, close
   and terminal reason, with no credentials or form submission by default.
8. **ADAPT — local logs into redacted audit events (high).** Record who approved
   what and outcome/cost hashes; never raw secrets, signed URLs, prompts, page
   content, or form values.

### Rejected

1. **REJECT — ambient “all web” model authority (high).** A provider key is not
   standing permission for all 74 tools or all targets/data classes.
2. **REJECT — model/self-modification of MCP groups/tools (high).** Retrieved
   data and vendor skills must not broaden tool authority or edit connection
   configuration.
3. **REJECT — startup zone creation (high).** Integration initialization must
   not silently mutate account resources or enable a premium plan option.
4. **REJECT — provider prompts as retry/budget policy (high).** Retry and Browser
   escalation require Curiosity authority and remaining budget.
5. **REJECT — JSON-in-text and “structured” marketing as trust (high).** A
   scraper record or model response remains untrusted and schema/version
   uncertain.
6. **REJECT — query-string API tokens (high).** Require runtime secret-to-header
   injection or a short-lived delegated mechanism.
7. **REJECT — full-input stderr logging (high).** It leaks investigative intent
   and potentially typed secrets into client diagnostics.
8. **REJECT — unbounded/default polling and blind retries (high).** Especially
   retrying 401/403/404/429 once per second.
9. **REJECT — login/credential/posting/payment interaction (high).** It conflicts
   with Curiosity's public-web lane and can violate AUP/target rights.
10. **REJECT — provider success as provenance (high).** Unlocking, job readiness,
    relevance score, and generated citations are not source evidence.

### Deferred

1. **DEFER — any production Bright Data MCP adapter (high).** Contract,
   retention, schema, error, cost, isolation, and credentials checks remain.
2. **DEFER — hosted MCP (high).** Require bearer/OAuth auth, gateway/build
   identity, token redaction, Origin/session/isolation evidence, size/time caps,
   and audit terms.
3. **DEFER — local package (medium-high).** Require pin/attestation/dependency
   review, sandboxing, startup-mutation removal, redacted logs, and contract tests.
4. **DEFER — Browser tools (high).** Require network/isolation threat model,
   explicit close/cancel, fresh-session proof, per-run traffic cap, and no-login
   policy.
5. **DEFER — social/professional dataset tools (high).** Require purpose/lawful
   basis, field minimization, provenance, retention, correction/deletion, and
   scraper-specific rights review.
6. **DEFER — `extract` (high).** Require sampling-capability consent, model/data
   boundary, token/cost cap, injection containment, and schema validation.
7. **DEFER — Discover/dataset search (medium-high).** Pricing, ranking lineage,
   pagination authority, task recovery, and data-source rights remain unclear.

## 12. Minimum provider-neutral agent contract implied by the study

```text
AgentWebRequest {
  operation_id, tenant_id, purpose, data_class,
  capability: search|fetch|discover|collect|dataset_search|render|interact|transform,
  target_or_query, target_policy_id, rights_policy_id,
  max_calls, max_internal_attempts, max_items, max_bytes,
  max_browser_requests?, max_browser_bytes?, max_sampling_tokens?,
  admission_deadline, wall_deadline, max_polls, max_usd,
  credential_ref, confirmation_requirement, retention_class
}

AgentWebResult {
  operation_id, attempt_id, provider, adapter_build, observed_schema_digest,
  provider_job_ref?, provider_session_ref?, provider_request_ref?,
  requested_url?, final_url?, redirect_chain?, query?, rank?, score_semantics?,
  transport_outcome, provider_outcome, target_outcome, terminal_reason,
  started_at, ended_at, source_observed_at?, cache_disposition,
  content_type?, items?, content_ref?, content_hash?, byte_length?,
  extraction_chain[], model_ref?, prompt_digest?,
  charged_units?, cost_usd?, partial, truncated, warnings[],
  policy_decision_id, provenance_completeness,
  untrusted_external_data: true
}
```

Question marks are deliberate. Missing provider evidence remains missing; it is
never inferred from a completed call.

## 13. Unknowns and checks required before revisit

### 13.1 Contract/schema checks (only with separate authority)

1. Compare hosted SSE, hosted Streamable HTTP, exact-pinned npm, and any MCPB
   `initialize`/`tools/list`/prompt schemas; resolve 74/69/60+, five/ten batch,
   Rapid base tools, annotations, and output types.
2. Verify groups/tools/Pro precedence, unknown-name behavior, list-changed
   notifications, and whether every remote MCP session is process/state isolated.
3. Confirm bearer-header or OAuth support and disable query-token auth; test URI,
   header, error, and gateway-log redaction without retaining a credential.
4. Establish hosted MCP protocol version, session ID, GET/DELETE, disconnect,
   cancellation, Origin validation, replay, timeout, request/output-size, and
   concurrency behavior.
5. Verify no startup zone mutation under a least-privilege key; identify exact
   permissions for API use versus zone creation/password retrieval.

### 13.2 Bounded benign-fixture checks (not performed)

6. On owned public fixtures, verify all input constraints, output media,
   `structuredContent` absence, byte/truncation behavior, target/provider status,
   request ID, redirects, content type, and malformed/oversized output handling.
7. Verify a one-call batch's actual provider calls/charges and partial errors;
   reconcile source max five against hosted/docs max ten.
8. Test Discover/Web-data timeout, 401/403/404/429/5xx, failed/canceled state,
   disconnect, duplicate trigger, snapshot retention, and cancellation with a
   tiny call/spend ceiling.
9. Verify dataset IDs/schema drift, cache disposition, snapshot/task ID recovery,
   null preservation, source URL/fetch time, and charged-record receipts.
10. Verify `extract` sampling consent, exact client/model routing, prompt display,
    token/cost receipt, non-text response, invalid JSON, and prompt-injection
    quarantine on owned content.
11. Verify Browser host/domain semantics, country switching, state isolation,
    explicit cleanup after process/client loss, request/traffic accounting, and
    private-address/redirect/subresource defenses on owned infrastructure.

### 13.3 Provider/procurement questions

12. Which commit/artifact is deployed remotely, and how are breaking schema,
    dataset ID, collector, price, and prompt changes versioned and announced?
13. What hosted MCP inputs/results/errors/headers/URIs are logged, where, for how
    long, by which subprocessors, and under which deletion/support controls?
14. Which MSA retention/reuse clause applies to each MCP path, and can it be
    replaced by no independent use or training?
15. What exact MCP per-tool billing unit, retries, polling, failure billing,
    premium-domain multiplier, and machine-readable receipt apply?
16. What browser worker/session tenant isolation, network containment, patching,
    profile cleanup, and independent test evidence cover MCP-created sessions?
17. Can credentials be scoped to tool, product, zone, dataset, target, purpose,
    tenant, spend, and duration without zone-management authority?

## 14. Fact / inference / recommendation summary

| ID | Type | Claim | Confidence | Sources | Verdict |
|---|---|---|---|---|---|
| M1 | FACT | Published local source can register 74 tools across multiple Bright Data products. | High | [S5-S8] | Capability split **ADAPTED** |
| M2 | FACT/CONTRADICTION | README says 69 and docs say 60+; hosted list was not tested. | High | [S1][S8][S11] | Schema pin **REQUIRED** |
| M3 | FACT | Search uses Web Unlocker against search-engine URLs, not the dedicated SERP endpoint. | High | [S5] | Product mapping retained |
| M4 | FACT | Fifty generated `web_data_*` tools trigger fixed dataset collectors and poll snapshots. | High | [S5] | Collector handles **ADAPTED** |
| M5 | FACT | Fourteen Browser tools share process-global session state and expose interaction without a close tool. | High | [S6-S7] | Browser **DEFERRED** |
| M6 | FACT | `extract` sends scraped content to MCP client sampling and does not validate returned JSON. | High | [S5][S30] | Hidden transform **REJECTED** |
| M7 | FACT | No tool has `outputSchema`/`structuredContent`; structured objects are JSON text. | High | [S5-S7][S29] | Output **ADAPTED** |
| M8 | FACT | Startup may create Unlocker premium-option and Browser zones. | High | [S5] | Mutation **REJECTED** |
| M9 | FACT | Full tool arguments and provider job IDs are written to stderr. | High | [S5] | Logging **REJECTED** |
| M10 | FACT | Poll loops retry all non-400 HTTP errors up to 600 one-second attempts by default. | High | [S5] | Retry policy **REJECTED** |
| M11 | FACT | Hosted docs put the API token in the URL; public local source is stdio-only. | High | [S5][S12][S15] | Hosted auth **DEFERRED** |
| M12 | FACT | Batch maxima and rate-limit defaults conflict between source and docs. | High | [S5][S11][S13] | Contract test required |
| M13 | FACT | Web-data output removes null fields and does not add snapshot/dataset identity. | High | [S5] | Provenance **ADAPTED** |
| M14 | INFERENCE | Broad connection grants paid network, collection, interaction, and nested-model authority beyond ordinary search. | High | [S5-S10] | Ambient authority **REJECTED** |
| M15 | FACT/UNKNOWN | Security certifications exist, but MCP-specific retention, hosted isolation, and gateway controls remain unproven publicly. | Medium-high | [S22-S25] | Sensitive use **DEFERRED** |
| M16 | RECOMMENDATION | Curiosity must own authorization, budgets, error taxonomy, provenance, quarantine, secrets, and audit. | High | synthesis | **ADOPT** |

## 15. Bounded curiosity pass

After synthesis, remaining in-frame gaps were scored 1–5 for **relevance (R)**,
**decision value (V)**, **novelty (N)**, and investigation **cost (C)**, where 5
is expensive. Only public-source, read-only threads within the caller's declared
frame were eligible.

| Thread | R/V/N/C | Outcome |
|---|---:|---|
| Source tool count and docs drift | 5/5/5/1 | **Pursued:** 74 source tools versus 69 README; identified the five absent declarations. |
| Tool-selection precedence | 5/5/4/1 | **Pursued:** source Pro wins, contrary to docs; `TOOLS`-only can remove base tools locally. |
| Hidden startup authority | 5/5/5/1 | **Pursued:** found automatic zone checks/creation and premium Unlocker option. |
| Nested `extract` model boundary | 5/5/5/1 | **Pursued:** client sampling, first-session selection, no JSON validation or model cost receipt. |
| Async retry/error disposition | 5/5/4/1 | **Pursued:** non-400 poll failures retry once/second up to default 600; IDs not returned. |
| Output/provenance transformation | 5/5/4/1 | **Pursued:** Unlocker headers lost, Google projection, Markdown stripping, null removal. |
| Deployment identity/supply chain | 4/5/5/2 | **Pursued:** npm/release align, but MCPB/manifests drift and Docker omits imported modules. |
| Hosted `tools/list` and auth behavior | 5/5/3/5 | **CURIOSITY_NO_GO:** user prohibited credentials/live calls; public hosted implementation is absent. |
| Install/run npm, Docker, or MCPB | 4/4/3/5 | **CURIOSITY_NO_GO:** executes third-party code and may mutate account/network state; source inspection answered the decision. |
| Probe SSRF, redirects, browser isolation, or target bypass | 5/5/5/5 | **CURIOSITY_NO_GO:** security/target testing needs separate authority and owned fixtures. |
| Reconstruct private unblocking, scraper, Discover, or ranking algorithms | 1/2/5/5 | **CURIOSITY_NO_GO:** proprietary, prohibited by clean-room/service boundary, and unnecessary. |
| Benchmark quality, blocking success, latency, or cost | 3/4/3/5 | **CURIOSITY_NO_GO:** no credentials/budget; cannot cure provenance and authority gaps. |
| Jurisdiction-specific legality for every platform dataset | 5/5/4/5 | **CURIOSITY_NO_GO:** requires exact purpose/data/target/jurisdiction and counsel; retained as a per-use gate. |
| Confidential SOC 2/DPA/order-form negotiation | 4/5/3/4 | **DEFERRED:** procurement/legal authority required. |

**Stop condition:** coverage plus public-source saturation reached. Remaining
high-value gaps require provider confirmation, contractual evidence, or a
separately authorized credentialed/benign-fixture test. No live autonomous
curiosity follow-up is authorized.

## 16. Primary-source ledger

All sources were accessed **2026-08-17**. Vendor product, security,
performance, scale, “reliability,” and compliance statements are treated as
vendor claims unless the cited source identifies independent attestation.

- **[S1]** Bright Data, official MCP README at repository head—product claims,
  hosted/local setup, 69-tool claim, tool reference, groups, configuration,
  prices, and agent-skill instructions.
  <https://github.com/brightdata/brightdata-mcp/blob/88bbdcda51ed1644edbc542d0672867660d07f0e/README.md>
- **[S2]** GitHub repository metadata and inspected head commit.
  <https://api.github.com/repos/brightdata/brightdata-mcp>,
  <https://api.github.com/repos/brightdata/brightdata-mcp/commits/88bbdcda51ed1644edbc542d0672867660d07f0e>
- **[S3]** npm `@brightdata/mcp@2.11.1` metadata—integrity, signature,
  provenance pointer, dependency declarations, and git head.
  <https://registry.npmjs.org/@brightdata%2fmcp/latest>
- **[S4]** GitHub v2.11.1 release and pinned commit metadata.
  <https://github.com/brightdata/brightdata-mcp/releases/tag/v2.11.1>,
  <https://api.github.com/repos/brightdata/brightdata-mcp/commits/4fa3872cfde4a223187fb6ddb57d34505c9ed5ba>
- **[S5]** Pinned `server.js`—tool schemas, API mappings, defaults, selection,
  zone creation, retries, polling, output projection, logging, errors, prompts,
  sampling, and stdio transport.
  <https://github.com/brightdata/brightdata-mcp/blob/4fa3872cfde4a223187fb6ddb57d34505c9ed5ba/server.js>
- **[S6]** Pinned `browser_tools.js`—14 Browser tool schemas, annotations,
  credential lookup, browser actions, and output behavior.
  <https://github.com/brightdata/brightdata-mcp/blob/4fa3872cfde4a223187fb6ddb57d34505c9ed5ba/browser_tools.js>
- **[S7]** Pinned `browser_session.js`—per-host sessions, global-current-domain
  behavior, ARIA/DOM refs, request tracking, reconnect, and close implementation.
  <https://github.com/brightdata/brightdata-mcp/blob/4fa3872cfde4a223187fb6ddb57d34505c9ed5ba/browser_session.js>
- **[S8]** Pinned `tool_groups.js`—group membership and three base tools.
  <https://github.com/brightdata/brightdata-mcp/blob/4fa3872cfde4a223187fb6ddb57d34505c9ed5ba/tool_groups.js>
- **[S9]** Bright Data MCP changelog—search-dataset and Reddit-comments
  additions, browser ref migration, and version history.
  <https://github.com/brightdata/brightdata-mcp/blob/4fa3872cfde4a223187fb6ddb57d34505c9ed5ba/CHANGELOG.md>
- **[S10]** Pinned MCP prompts—tool-selection, retry, and Browser escalation
  instructions.
  <https://github.com/brightdata/brightdata-mcp/blob/4fa3872cfde4a223187fb6ddb57d34505c9ed5ba/prompts.js>
- **[S11]** Bright Data, current MCP tools reference—Rapid/Pro/groups and
  documented 60+ tool inventory.
  <https://docs.brightdata.com/ai/mcp-server/tools>
- **[S12]** Bright Data, remote advanced configuration—query fields,
  selection precedence claim, SSE/HTTP examples.
  <https://docs.brightdata.com/ai/mcp-server/remote/advanced>
- **[S13]** Bright Data, local quickstart/advanced configuration—stdio setup,
  environment fields, rate-limit and selection-default claims.
  <https://docs.brightdata.com/ai/mcp-server/local/quickstart>,
  <https://docs.brightdata.com/ai/mcp-server/local/advanced>
- **[S14]** Pinned dataset-search schema and Google search projection.
  <https://github.com/brightdata/brightdata-mcp/blob/4fa3872cfde4a223187fb6ddb57d34505c9ed5ba/search_dataset_schema.js>,
  <https://github.com/brightdata/brightdata-mcp/blob/4fa3872cfde4a223187fb6ddb57d34505c9ed5ba/search_utils.js>
- **[S15]** Bright Data, remote quickstart—hosted SSE/Streamable HTTP endpoints
  and token-only remote authentication.
  <https://docs.brightdata.com/ai/mcp-server/remote/quickstart>
- **[S16]** Bright Data documentation index and MCP overview—product mapping,
  “always bearer” instruction, shared free pool, and provider product inventory.
  <https://docs.brightdata.com/llms.txt>,
  <https://docs.brightdata.com/ai/mcp-server/overview>
- **[S17]** Bright Data API authentication—API/native methods, key generation,
  expiration, and five broad permission levels.
  <https://docs.brightdata.com/api-reference/authentication>
- **[S18]** Pinned package, MCPB manifest, and MCP Registry descriptor—artifact
  versions, npm file list, tool descriptions, runtime/environment metadata.
  <https://github.com/brightdata/brightdata-mcp/blob/4fa3872cfde4a223187fb6ddb57d34505c9ed5ba/package.json>,
  <https://github.com/brightdata/brightdata-mcp/blob/4fa3872cfde4a223187fb6ddb57d34505c9ed5ba/manifest.json>,
  <https://github.com/brightdata/brightdata-mcp/blob/4fa3872cfde4a223187fb6ddb57d34505c9ed5ba/server.json>
- **[S19]** Pinned Dockerfile—build/release layout.
  <https://github.com/brightdata/brightdata-mcp/blob/4fa3872cfde4a223187fb6ddb57d34505c9ed5ba/Dockerfile>
- **[S20]** Bright Data MCP pricing—current plan meters and free-tier claims.
  <https://brightdata.com/pricing/mcp-server>
- **[S21]** Bright Data free tier—shared credits, per-product units, hard-stop
  conditions, rate limit, and Browser exclusion/trial.
  <https://docs.brightdata.com/general/account/billing-and-pricing/free-tier>
- **[S22]** Bright Data security and compliance—certifications, controls,
  named 2025 test scope, MCP/agent statements, and untrusted-content warning.
  <https://docs.brightdata.com/general/security/security-overview>
- **[S23]** Bright Data Master Service Agreement, updated 2026-06-16—service
  rights, client duties, reverse-engineering boundary, disclaimers, suspension,
  and product-specific retention/reuse clauses.
  <https://brightdata.com/license>
- **[S24]** Bright Data Acceptable Use Policy—prohibited nonpublic, fraudulent,
  posting/manipulation, and rights-violating activities.
  <https://brightdata.com/acceptable-use-policy>
- **[S25]** Bright Data Privacy Policy, reviewed 2026-05-14—data categories,
  uses/sharing, international processing, retention, rights, and CCPA notice.
  <https://brightdata.com/privacy>
- **[S26]** Bright Data Web Unlocker errors—three-layer status/header behavior,
  error codes, retry guidance, target/private-address and policy handling.
  <https://docs.brightdata.com/scraping-automation/web-unlocker/error-codes>
- **[S27]** Bright Data Browser API errors—provider session limits, capacity,
  policy, proxy, and browser failure taxonomy.
  <https://docs.brightdata.com/scraping-automation/scraping-browser/error-codes>
- **[S28]** Bright Data public Data Protection Addendum.
  <https://brightdata.com/static/web/Bright-Data-Data-Protection-Agreement.pdf>
- **[S29]** Model Context Protocol, Tools specification 2025-06-18—model
  control, human-in-loop guidance, schemas, structured results, annotations,
  errors, validation, timeouts, sanitization, and audit.
  <https://modelcontextprotocol.io/specification/2025-06-18/server/tools>
- **[S30]** Model Context Protocol, Sampling specification 2025-06-18—nested
  model requests, client control, review, errors, and sensitive-data guidance.
  <https://modelcontextprotocol.io/specification/2025-06-18/client/sampling>
- **[S31]** Model Context Protocol, Transports specification 2025-06-18—stdio,
  stderr, Streamable HTTP, Origin/auth, sessions, replay, and cancellation.
  <https://modelcontextprotocol.io/specification/2025-06-18/basic/transports>
- **[S32]** Bright Data MCP MIT license—adapter source license and notice.
  <https://github.com/brightdata/brightdata-mcp/blob/4fa3872cfde4a223187fb6ddb57d34505c9ed5ba/LICENSE>

## 17. License and transfer boundary

**FACT (high):** the official adapter source is MIT-licensed, copyright Bright
Data 2025. npm metadata points to the same repository/release. MIT covers that
source, not the hosted service, provider APIs, private unblocking/scraper/
ranking/browser implementations, returned third-party content, target rights,
trademarks, or service terms. Dependencies have separate licenses. [S3-S4][S32]

No code was transferred or implemented. If source reuse is ever separately
approved, preserve the MIT notice and perform dependency, service, content,
patent, trademark, and target-rights review. Curiosity should prefer independent
provider-neutral contracts derived from documented behavior rather than copying
the adapter.

## 18. Confidence summary

- **High:** v2.11.1 local source tool count/names/inputs/defaults, API paths,
  startup zone creation, static selection behavior, polling/retry loops, logging,
  Browser state model, nested sampling, JSON-text outputs, null removal, and
  artifact version drift.
- **High:** official hosted endpoint/query-token documentation, current pricing
  text, free-tier contradiction, AUP/MSA/privacy text, and MCP protocol guidance.
- **Medium-high:** thin-adapter architecture, authority amplification,
  cross-product billing ambiguity, and Curiosity control recommendations.
- **Medium:** applicability of platform security controls and product-specific
  MSA retention terms to every MCP path; multi-client implications of global
  source state.
- **Low/unknown:** actual hosted `tools/list`, deployed build, gateway/session
  isolation, bearer support, logging/retention, exact per-tool charges,
  empirical quality/latency, and unobservable provider retries or provenance.
