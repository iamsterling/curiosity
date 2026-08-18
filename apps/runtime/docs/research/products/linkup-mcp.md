# Linkup MCP: clean-room agent-facing product-surface study

**Research and primary-source access date:** 2026-08-17  
**Decision frame:** whether Linkup's MCP integration is a sufficiently bounded,
auditable agent-facing surface for Curiosity, and which interface patterns should
be adopted, adapted, rejected, or deferred.  
**Scope:** the hosted Streamable HTTP endpoint, public local stdio package/MCPB,
the four exposed tools, their mapping to Linkup Search/Fetch/Research/Tasks/
Extract, and the authority, cost, error, trust, provenance, privacy, safety,
transport, and supply-chain boundaries visible in official sources.  
**Status:** research and recommendations only—not implementation, a live service
test, legal advice, a security assessment, or procurement approval.

## Executive verdict

**VERDICT — ADAPT the capability split; REJECT the current MCP surface as a
provider-neutral authority or evidentiary boundary (high confidence).**

Linkup MCP is a thin agent adapter over three Linkup products:

```text
linkup-search        -> synchronous Search, forced to raw searchResults
linkup-fetch         -> synchronous Fetch
linkup-research      -> create Research job, forced to sourcedAnswer
linkup-get-research  -> get one Research job by id
```

It does **not** expose Linkup Extract, the generic Tasks batch/list/get surface,
fast Search, sourced/structured Search, structured Research, Research listing,
account balance, cancellation, or generic asynchronous composition. The two
Research tools represent the Research endpoint's own job lifecycle; they must not
be mistaken for the separate `/tasks` product. [S1][S3-S5][S11]

The strongest transferable idea is the narrow set of named capabilities and the
separation of long-running job creation from observation. The largest defects for
Curiosity are:

- model-controlled calls can spend money and disclose queries/URLs without a
  server-side confirmation, per-run cost cap, deadline, retry cap, or policy
  envelope;
- `linkup-research` defaults indirectly to the API's **L** depth when omitted,
  currently a 5–10 minute, $1.50 operation;
- outputs are JSON stringified into unstructured MCP text with no `outputSchema`,
  `structuredContent`, trust label, byte bound, or evidence envelope;
- wrapper errors collapse provider status/code/details into one prose string;
- tool descriptions call sources “trusted” and answers “verified,” while the
  response contracts do not establish either property;
- current MCP documentation and the latest published open-source package disagree
  about Fetch `mode`, so the hosted and local tool schemas cannot be assumed
  identical without an authorized `tools/list` check;
- API keys can be placed in a URL or process arguments, and the package's public
  version identity is inconsistent across npm, MCP server metadata, and source
  manifests. [S1-S10][S12-S16]

For Curiosity, Linkup MCP could be a convenience adapter behind Curiosity-owned
authorization, budget, provenance, quarantine, and retry controls. It should not
be the neutral contract, a broad ambient agent permission, or a source of trusted
facts.

## 1. Frame, bounded questions, and method

### 1.1 Bounded sub-questions

1. Which MCP capabilities and tools are exposed, with what input and output
   schemas?
2. How do those tools map—and fail to map—to Search, Fetch, Extract, Research,
   and Tasks?
3. How do hosted HTTP, local stdio, MCPB, authentication, and package execution
   differ?
4. What authority can an agent exercise, and which work, time, result, loop, and
   spend bounds are caller-enforceable?
5. How are errors, asynchronous state, cancellation, retries, and ambiguous
   outcomes represented?
6. Which returned fields are untrusted, what provenance survives, and what
   privacy/safety claims apply?
7. Which clean-room lessons should Curiosity adopt, adapt, reject, or defer?

### 1.2 Evidence and clean-room boundary

Only public first-party sources were inspected: Linkup documentation and
OpenAPI, the official GitHub repository at commit
`b7c8bb9eb6447ec4e0cde6471de27c573e1bd787`, official release/npm metadata,
and the official MCP specification. Public source was read to understand the
adapter contract; no source was copied into Curiosity. [S1-S18]

No account, credential, free credit, paid call, x402 payment, MCP handshake,
`tools/list`, tool invocation, package install, MCPB execution, traffic capture,
target-page fetch, security probe, access-control bypass, or proprietary service
inspection was performed. Hosted deployment behavior is therefore distinguished
from the public package implementation. Marketing and security statements remain
vendor assertions unless the response contract itself demonstrates them.

Labels:

- **FACT** — directly stated or visible in a cited primary source.
- **INFERENCE** — least-assumptive interpretation consistent with facts, not a
  claim about hidden implementation.
- **RECOMMENDATION** — a Curiosity architecture or governance consequence.
- **UNKNOWN / NEGATIVE RESULT** — not established in reviewed sources.
- Confidence is **high**, **medium**, or **low**.

**Coverage rule:** every requested category must end in a sourced fact or a
retained negative result and a Curiosity consequence. **Stop rule:** stop when the
remaining material gaps require credentials, provider confirmation, contractual
artifacts, or separately authorized execution.

## 2. Product identity and observable architecture

### 2.1 Three delivery forms

| Form | Transport | Execution location | Credential placement | Public recommendation |
|---|---|---|---|---|
| Hosted MCP | Streamable HTTP at `https://mcp.linkup.so/mcp` | Linkup-hosted | preferred bearer header; query parameter fallback | recommended for most users |
| Local npm | stdio subprocess, Node.js 24+ | client machine | CLI argument; source also accepts environment variable | available for MCP clients |
| MCPB | packaged local Node stdio server | client machine | sensitive user config substituted into an `apiKey=...` process argument | recommended for Claude Desktop |

**FACT (high):** all forms require a Linkup API key. There is no keyless MCP
demo. Hosted HTTP accepts `Authorization: Bearer ...`; clients unable to set a
header may use `?apiKey=...`. Local examples use `npx -y
linkup-mcp-server apiKey=...`; the current source also accepts
`--apiKey=...` or `LINKUP_API_KEY`. [S1][S7-S9]

**FACT/CONTRADICTION (high):** the troubleshooting text says the v1 environment
format is “no longer supported” in v2+, while current v3.3.0 source explicitly
falls back to `LINKUP_API_KEY`, and the README's development section documents
that fallback. The safe conclusion is that generic client configuration examples
migrated to process arguments; environment support remains in the published
stdio implementation. [S1][S2][S8]

### 2.2 Minimal request path

```text
agent/model
  -> MCP client policy/UI (if any)
  -> tools/call
       hosted: TLS -> mcp.linkup.so -> per-request API-key resolution
       local:  stdio -> local Node process -> configured API key
  -> linkup-sdk client
  -> Linkup Search | Fetch | Research API
  -> SDK object
  -> JSON.stringify(..., null, 2)
  -> one MCP TextContent item
  -> agent/model
```

**FACT (high):** the public adapter constructs a new `LinkupClient` for each
tool execution and a new MCP server for each HTTP POST. Every successful tool
handler returns one text content item containing pretty-printed JSON. No tool
declares an output schema or returns `structuredContent`. [S3-S7]

**INFERENCE (high):** this is an interface adapter, not an independent retrieval
or research engine. Planning inside deep Search or Research remains provider
owned; planning around tool selection, retries, polling, and follow-ups remains
MCP-client/agent owned.

### 2.3 MCP capability boundary

**FACT (high):** the repository registers only four tools. It registers no
resources, resource templates, prompts, sampling callback, elicitation flow,
generic task capability, completion provider, or logging interface. The fixed
server instruction is simply to use the server when web information is needed.
[S2][S6]

**UNKNOWN:** the current hosted endpoint may run a newer build or gateway than
the public v3.3.0 package. No public deployment commit, MCP `implementation`
version, schema snapshot, or hosted changelog binds `mcp.linkup.so` to the
repository head.

## 3. Exact exposed tool inputs

The following is the public v3.3.0 source contract. Current documentation drift
is called out separately rather than silently merged into it.

### 3.1 `linkup-search`

| Input | Requirement / default | Source-level validation | Forwarded API behavior |
|---|---|---|---|
| `query` | required | string; no non-empty minimum | renamed by SDK/API mapping; natural-language query |
| `depth` | optional; `standard` | enum `standard \| deep` | fast is unavailable |
| `includeImages` | optional; `false` | Boolean | forwarded |
| `includeDomains` | optional | array of strings; description says max 100, schema code has no `.max(100)` | forwarded |
| `excludeDomains` | optional | array of strings; no item cap | forwarded |
| `fromDate` | optional | ISO `YYYY-MM-DD` date | converted to JavaScript `Date` |
| `toDate` | optional | ISO `YYYY-MM-DD` date | converted to JavaScript `Date` |
| `maxResults` | optional | positive integer; no maximum | caps returned results, not proven internal work |

**FACT (high):** the adapter always sends `outputType: "searchResults"`.
Consequently the MCP tool exposes ranked result records rather than Linkup's
sourced-answer or schema-shaped Search outputs. It exposes neither inline
citations nor structured-output schema controls. [S3][S11]

**FACT/SCHEMA GAP (high):** “max 100 domains” is descriptive text, not enforced
by the visible Zod definition. There is also no visible domain syntax rule,
include/exclude conflict rule, `fromDate <= toDate` rule, query-length bound,
array-length bound for exclusion, request-byte bound, or maximum `maxResults`.
The downstream API may reject additional cases, but the MCP schema does not make
them agent-visible. [S3][S11]

### 3.2 `linkup-fetch`

Public v3.3.0 source registers:

| Input | Requirement / default | Source-level validation |
|---|---|---|
| `url` | required | syntactically valid URL string; no visible HTTP/HTTPS allowlist |
| `renderJs` | optional; `false` | Boolean |
| `extractImages` | optional; `false` | Boolean |
| `includeRawHtml` | optional; `false` | Boolean |

The source forwards these four fields to `client.fetch` and returns the complete
SDK result as text. It does not expose REST's newer `includeRawContent` field.
[S4][S11]

**FACT/CONTRADICTION (high):** current Linkup MCP documentation adds
`mode: standard | pro`, default `standard`, while the latest GitHub source,
README, npm git head, and June v3.3.0 release do **not** define or forward `mode`.
`pro` launched in August 2026, after the latest public MCP release. Therefore:

- the latest local npm/MCPB source contract has no `mode`;
- current hosted documentation claims that MCP does have `mode`;
- actual hosted `tools/list` and whether a newer unpublished adapter is deployed
  are **UNKNOWN**. [S1][S2][S4][S9][S11]

**FACT (high):** the Fetch tool description advises retrying with JavaScript if
content cannot be fetched. Its `renderJs` parameter description is more
conservative: use only when explicitly requested or content is unavailable.
Neither mechanism enforces user approval or an attempt budget. [S4]

### 3.3 `linkup-research`

| Input | Requirement / default | Source-level validation / consequence |
|---|---|---|
| `query` | required | non-empty string |
| `mode` | optional | enum `answer \| investigate \| research`; omission lets provider classify |
| `reasoningDepth` | optional | enum `S \| M \| L \| XL`; omission reaches API default `L` |
| `includeDomains` | optional | array strings; “max 100” only in description |
| `excludeDomains` | optional | array strings; no cap |
| `fromDate`, `toDate` | optional | ISO dates converted to JavaScript `Date` |

**FACT (high):** the tool forces `outputType: "sourcedAnswer"`. It cannot request
Research structured output or a structured schema. The call returns immediately
with the Research task envelope, not the final report. [S5][S11]

**FACT (high):** omission is not cheap neutrality. Linkup documents that omitted
`reasoningDepth` defaults to `L`, currently 5–10 minutes and $1.50. Omitted
`mode` lets the provider choose the investigation class and makes output/latency
less predictable. [S5][S12]

### 3.4 `linkup-get-research`

The only input is required non-empty string `id`. The wrapper calls
`client.getResearch(id)` and returns the entire job object as text. The tool
description instructs the model to poll every few seconds while state is
`pending` or `processing`, stopping at `completed` or `failed`; polling faster
than once per second is rate-limited. [S5][S11]

**UNKNOWN:** the schema does not identify the ID format, ownership before the API
check, expiry, or whether an ID can be observed after organization/key changes.
Authorization is delegated to the Linkup API key and organization boundary.

## 4. Mapping to Linkup products and neutral capabilities

| Linkup product | MCP exposure | Neutral interpretation | Important loss |
|---|---|---|---|
| Search | `linkup-search` | `Search` | no fast, answer, structured output, inline citation control, or explicit max cost |
| Fetch | `linkup-fetch` | `FetchKnownUrl` | local/hosted mode drift; no current raw-content field; no capture provenance |
| Research | start + get tools | `CreateResearchJob` + `GetResearchJob` | no list, structured output, cancel, deadline, webhook, event cursor, or result schema |
| Tasks | **not exposed** | none | no generic batch create/list/get, mixed child types, quota projection, or batch transport |
| Extract | **not exposed** | none | no seed-to-rows agent, schema, job polling, credit usage, or NDJSON artifact |

**FACT (high):** no tool invokes `/v1/tasks` or `/v1/extract`. The public source
tree has only Search, Fetch, and Research modules. [S2-S6][S18]

**RECOMMENDATION (high):** never map the MCP server as a universal `Search`
provider. Capability negotiation must report the narrower operations and output
forms. Research jobs must remain distinct from generic transport tasks, and the
absence of Extract/Tasks must be explicit rather than emulated through prompts.

## 5. Output contract, untrusted data, and agent exposure

### 5.1 Everything is unstructured MCP text

**FACT (high):** each successful tool output is:

```text
content: [{ type: "text", text: JSON.stringify(providerObject, null, 2) }]
```

There is no MCP `outputSchema`, `structuredContent`, result MIME type, embedded
resource, resource link, content annotation, byte count, truncation marker, trust
classification, or output digest. MCP supports structured results and output
schemas, but the Linkup adapter does not use them. [S3-S6][S15]

**INFERENCE (high):** machines and models can parse the JSON-looking text, but no
protocol-level validator can establish the expected shape. Endpoint evolution,
error prose, or malformed/unexpected fields reach the agent through the same
text channel.

### 5.2 Tool-specific hostile fields

| Tool | Potentially untrusted content reaching the model |
|---|---|
| Search | page names, URLs, snippets/content, favicon URLs, image metadata/URLs |
| Fetch | extracted Markdown, raw HTML, image alt text/URLs, favicon and any current response fields |
| Research | generated answer, source names/URLs/snippets, echoed input, error string, task metadata |
| Get Research | all of the above plus persisted asynchronous envelope |

**FACT (medium, vendor statement):** Linkup says it filters malware, phishing,
spyware, questionable categories, and low-quality candidates, and that crawling
respects robots and does not bypass access controls. It does not expose a
per-result safety verdict, policy version, prompt-injection verdict, or trust
score through these MCP tools. [S14]

**RECOMMENDATION (high):** every returned string and URL remains untrusted
external data. Curiosity must:

- keep tool output in a data channel that cannot grant authority or rewrite
  system/tool policy;
- strip or neutralize active HTML before display and never execute returned
  markup;
- separately authorize every returned URL before dereference;
- cap accepted bytes/tokens/items and quarantine oversized or malformed output;
- scan retained artifacts under Curiosity policy;
- require a new declared authorization decision before source text can trigger
  follow-up Search, Fetch, Research, shell, browser, or network work.

### 5.3 Agent-facing descriptions overstate epistemic status

**FACT (high):** official descriptions say Search uses “trusted sources,”
Research produces “verified answers,” and Fetch returns content from “any
webpage.” The observable contracts provide URLs/snippets, a generated cited
answer, or extracted derivatives; they do not provide source-authority proofs,
claim verification records, universal reachability, or complete web coverage.
[S1][S3-S5]

**RECOMMENDATION (high):** tool descriptions should state operation and evidence
shape, not epistemic conclusions. Curiosity should replace “trusted” and
“verified” with inspectable states such as provider-returned, captured,
corroborated, contradicted, policy-approved, or human-reviewed.

## 6. Provenance and reproducibility

### 6.1 What survives the wrapper

**FACT (high):** the wrapper serializes the whole SDK object, so it generally
preserves endpoint-native fields rather than selecting individual values:

- Search raw results preserve source-local names, URLs, snippets/content, and
  optional display/image fields;
- Research preserves the job ID/state/timestamps/input and, when complete, its
  answer plus source list;
- Fetch preserves the currently returned Markdown/raw/image fields.

The wrapper itself adds no source transformation beyond JSON serialization and
date conversion on inputs. [S3-S5][S11]

### 6.2 What is absent

**UNKNOWN / NEGATIVE RESULT (high confidence in public-contract absence):** the
MCP surface exposes no guaranteed:

- provider request/trace ID for synchronous Search/Fetch;
- MCP server build commit, package version, tool-schema version, or adapter
  version in each result;
- query-plan, rewrite, branch, candidate, iteration, scrape, or stop lineage;
- source capture/index/fetch time, cache state/age, final URL, redirect chain,
  response headers, immutable document ID, content hash, or version;
- rank score/explanation, source-authority score, or safety-policy decision;
- claim-to-source-passage or result-to-captured-byte offsets;
- renderer, parser, extractor, model, prompt, or index version;
- output digest, byte/token usage, charged amount, or remaining budget;
- complete source set or independent corroboration record. [S1-S6][S11]

Research job `createdAt`/`updatedAt` describe job records, not source acquisition
or publication. Citations are generated-answer attribution, not chain-of-custody.
A Search URL/snippet is mutable web provenance, and Fetch Markdown/raw HTML is an
unversioned derivative. [S11]

### 6.3 Version identity is internally inconsistent

**FACT (high):** as accessed:

- npm latest and GitHub latest release are `3.3.0` at commit `b7c8bb9...`;
- the source `package.json` and MCPB manifest still say `3.0.0`;
- MCP initialization metadata hardcodes server version `1.0.0`;
- the current docs describe post-release Fetch `pro` behavior absent from that
  source commit. [S1][S2][S6][S8-S9]

**INFERENCE (high):** semantic-release changes the published npm version without
updating every source/server identity, and documentation evolves independently.
An MCP transcript cannot currently identify the exact schema/build solely from
the announced server version.

**RECOMMENDATION (high):** Curiosity must record transport, endpoint, observed
tool-list digest, package/release digest where local, documentation snapshot,
and provider response digest. Never use the announced `1.0.0` as build identity.

## 7. Authentication, transport, and credential boundary

### 7.1 Hosted Streamable HTTP

**FACT (high):** the public HTTP implementation exposes `/mcp`:

- `POST` handles MCP JSON-RPC;
- `GET` and `DELETE` return 405;
- no MCP session ID is generated;
- a bearer header takes precedence over `apiKey` query input;
- a malformed or empty authorization header returns 401 rather than falling
  back to the query parameter;
- missing credentials return a JSON-RPC-shaped error with code `-32000`;
- unexpected handler errors return HTTP 500 / JSON-RPC `-32603`. [S7]

The MCP transport specification permits GET 405 and sessionless Streamable HTTP.
It requires Origin validation for Streamable HTTP and recommends authentication
and localhost-only binding for local HTTP. No Origin check or explicit bind
address is visible in the public Linkup HTTP source. [S7][S16]

**QUALIFICATION:** that is a source-level negative result, not proof that the
hosted endpoint lacks gateway-level Origin, WAF, rate, or bind controls.

### 7.2 Bearer versus query secret

**FACT (high):** Linkup itself recommends the bearer header and retains the query
parameter for client compatibility. [S1]

**INFERENCE (high):** a query credential is more likely to be copied into MCP
configuration, deep links, screenshots, URL histories, diagnostics, and proxy or
access logs. TLS protects transit but not those endpoint-local exposures.

**RECOMMENDATION (high):** reject query-string API keys. Use a secret reference
resolved into a header at runtime, redact headers and URLs from diagnostics, and
rotate any key ever placed in a URI.

### 7.3 Local stdio and package execution

**FACT (high):** local stdio keeps MCP traffic between the client and child
process, but the child still sends queries/URLs/results to Linkup's hosted API.
Local MCP is therefore not local retrieval or offline processing. [S2][S8]

**FACT (high):** documentation examples use unpinned `npx -y`, which downloads
and runs whatever package version npm resolves. npm publishes integrity,
signature, provenance-attestation metadata, and a git head for v3.3.0; GitHub
publishes a release-asset SHA-256 for the MCPB. These help verification but are
not used by the one-line examples. [S1][S9]

**RECOMMENDATION (high):** if local execution is ever approved, pin an exact
version and integrity/digest, verify npm/GitHub provenance, run with minimal file
and environment access, pass a scoped secret without process arguments, and
upgrade only after schema/diff review. Local code execution expands supply-chain
and host privilege risk even though the current adapter itself exposes only web
operations. MCP security guidance treats local servers as code executing with
client privileges. [S17]

### 7.4 Authorization granularity

**UNKNOWN / NEGATIVE RESULT:** public MCP material exposes one Linkup API key,
not OAuth, MCP-specific scopes, per-tool credentials, per-domain grants,
read/search/fetch/research separation, per-client consent, or delegated user
identity. API-key organization permissions may exist, but no MCP-specific
least-privilege contract was found.

**RECOMMENDATION (high):** Curiosity must keep its own tool, tenant, purpose,
domain, data-class, and spend authorization in front of the provider credential.
One provider key must not imply ambient permission for all four tools.

## 8. Authority, work budgets, and pricing

### 8.1 Model control versus human control

**FACT (high):** MCP tools are designed to be model-controlled; the MCP
specification recommends client UI, visible invocations, and human ability to
deny calls. Linkup's server supplies tools and descriptions but no in-protocol
confirmation/elicitation gate or tool annotations. Whether a user sees or
approves a call depends on the MCP client. [S3-S6][S15]

**INFERENCE (high):** connecting the server to an autonomous client can grant the
model paid web-search, arbitrary public-URL retrieval, raw-HTML return, JavaScript
rendering, and long-running research-start authority up to shared account limits.

### 8.2 Point-in-time prices inherited from APIs

| MCP action | Forced/default provider mode | Current API list price |
|---|---|---:|
| Search, standard | raw `searchResults` | $0.005 |
| Search, deep | raw `searchResults` | $0.05 |
| Fetch, static standard | standard implied in local package | $0.001 |
| Fetch, JS standard | standard implied in local package | $0.005 |
| Fetch pro, if hosted schema really exposes it | static / JS | $0.005 / $0.01 |
| Research S / M / L / XL | sourced answer | $0.25 / $0.50 / $1.50 / $2.50 |
| Get Research polling | status retrieval | no separate public price found |

**FACT (high):** Linkup charges successful API requests, says errors are not
charged, and uses 429 both for credit exhaustion and excess request/concurrency.
Search/Fetch are documented at 10 requests/second per organization. Research
polling over once/second is rate-limited. [S11-S13]

**UNKNOWN:** no MCP-specific surcharge/discount, hosted MCP quota, maximum
concurrency, context/output-byte cap, call timeout, or billing receipt is
documented. The reasonable but unconfirmed assumption is that MCP inherits
ordinary endpoint billing because it uses the caller's API key.

### 8.3 Missing admission and stopping controls

The tool schemas expose no:

- maximum dollars/credits or preflight estimate;
- wall-clock deadline or SDK timeout;
- maximum attempts, retries, calls, or follow-up calls;
- maximum response bytes/tokens;
- maximum Research sources, iterations, pages, or tool calls;
- maximum polling count/duration;
- cancellation, pause, or server-side stop reason;
- idempotency key or client request ID;
- host-level Fetch concurrency/bytes/subresources/redirect bounds;
- output retention or local context-window budget. [S3-S7][S11]

`maxResults` limits returned Search results, not all internal retrieval work.
Domain/date filters constrain candidate selection but are not resource budgets.
Provider credit and rate limits are shared account capacity, not a per-run safety
budget.

### 8.4 Cost-amplification cases

1. Standard→deep retry raises raw Search list price 10×.
2. Static→JS retry raises standard Fetch price 5×.
3. A documented hosted static→pro→JS escalation can reach 10× static standard.
4. Omitted Research depth chooses L at 6× S cost.
5. Retrying ambiguous Research creation can create another expensive job because
   the MCP input has no idempotency key.
6. Polling is an agent loop with only prose timing guidance and no poll budget.

**RECOMMENDATION (high):** the Curiosity coordinator—not the tool description—
must authorize an exact operation plan with maximum calls, depth/mode, result
count, fetched URLs, JS/pro escalation, attempts, deadline, output bytes, polls,
and dollars. Omission must resolve to Curiosity's cheapest safe mode, not the
provider's L Research default.

## 9. Errors, retries, and asynchronous disposition

### 9.1 Two different error layers

**FACT (high):** input-schema/protocol failures are handled through MCP/SDK
validation. Once a Linkup SDK call throws, `safeExecuteLinkupMethod` catches every
error and returns:

```text
isError: true
content[0].text = "An error occurred while executing Linkup client: <message>"
```

It discards structured exception type, HTTP status, Linkup code, validation
details, retry-after metadata, and any separate provider request ID available on
the thrown object. [S5-S6][S13][S15]

**FACT (high):** the underlying API distinguishes validation/no-result/fetch
classes, authentication/permission, payment, conflict, credit, rate/concurrency,
and internal errors. In particular, 429 is ambiguous between exhausted credit
and pressure. The MCP wrapper does not expose that taxonomy structurally. [S13]

**RECOMMENDATION (high):** preserve raw provider status/code/details as bounded
data and map them to explicit `invalid`, `auth`, `policy`, `not_found`,
`unreachable`, `too_large`, `unsupported`, `timeout`, `rate_limited`,
`credit_exhausted`, `conflict`, `provider`, and `unknown` classes. Retryability
must be a policy field, never inferred from prose alone.

### 9.2 Research lifecycle

**FACT (high):** Research state is `pending | processing | completed | failed`.
Completion places the sourced answer in `output`; failure places prose in
`error`. MCP offers create-one and get-one only. [S5][S11]

**UNKNOWN / NEGATIVE RESULT:** no MCP Research list, webhook, SSE completion
event, cancellation, deletion, deadline, event history, cursor, partial output,
retry state, terminal immutability, or retention duration is exposed. A local
client timeout or stopped poll leaves provider disposition unknown. The MCP
transport specification also warns that disconnection is not cancellation.
[S5][S11][S16]

**RECOMMENDATION (high):** persist local intent before creation, bind a local
attempt ID to the returned provider ID, never blindly replay an ambiguous create,
poll with jitter/deadline/max polls, and represent local abandonment separately
from provider cancellation. A completed job means work ended—not that claims are
correct or adequately evidenced.

## 10. Fetch/network, content, and target safety

**FACT (high):** MCP Fetch accepts a caller-selected URL and can request
JavaScript execution, images, and raw HTML. Current REST docs restrict intended
targets to public HTTP/HTTPS HTML or PDF, reject unsupported media and oversized
inputs, and do not authenticate to target sites. The MCP source's visible URL
schema checks URL syntax but does not itself express an HTTP/HTTPS scheme
allowlist or network policy. [S4][S11]

**UNKNOWN / SECURITY NEGATIVE RESULT:** neither the MCP tool nor reviewed public
Fetch contract establishes private/link-local/metadata address blocking, DNS
rebinding defenses, redirect-hop revalidation, port restrictions, redirect/body/
decompression/subresource limits, renderer isolation, script budget, final URL,
or per-attempt robots decision. General Linkup crawling safeguards do not provide
a Fetch-specific network-policy receipt. [S4][S11][S14]

**RECOMMENDATION (high):** hosted execution does not transfer Curiosity's target
authorization. Before dispatch, Curiosity must normalize and authorize the URL,
deny credentials and secrets in URLs, enforce public-network and port policy,
bound redirects/bytes/time/rendering, preserve rights/robots decisions, and
prevent returned links/images from being followed automatically. `pro` or JS
must be separately authorized escalation, never a generic retry.

## 11. Privacy, data handling, and audit

### 11.1 Disclosed data

Every tool can disclose sensitive investigation intent:

- Search/Research send full natural-language questions, source allow/deny lists,
  and date windows;
- Fetch sends exact URLs, which may reveal subjects, identifiers, paths, query
  values, or capability tokens;
- Research persists an asynchronous input/output record long enough to poll;
- tool outputs pass through the MCP client and may enter its model context,
  local logs, chat retention, telemetry, or downstream model provider.

**FACT (high, vendor statement):** Linkup says default query processing may occur
across US, EU, Canada, and APAC; local processing is not guaranteed. ZDR is by
request, not default. Under ZDR, Linkup says search queries/results remain in
memory and are not persisted. TLS 1.2+ and AES-256 at rest are stated; guaranteed
local processing, IP allowlisting, SSO, and BYOC are enterprise/configured
features. [S14]

**UNKNOWN:** public privacy text does not specifically bind hosted MCP request
logs, query-parameter credentials, Fetch URLs/content, Research asynchronous
records, MCP gateway telemetry, local client logs, subprocessors, ordinary
retention/deletion, model training, or ZDR compatibility with Research jobs.
ZDR's no-persistence description is in tension with asynchronous get-by-ID, but
the public material does not reconcile them.

**RECOMMENDATION (high):** assume ordinary, potentially multi-region,
non-ZDR processing and retention unless a signed agreement and verified
configuration say otherwise. Never send credentials, private URLs, signed URLs,
customer secrets, unpublished strategy, or unnecessary personal data. Record
provider, tool, purpose, data classification, policy decision, effective region/
retention mode, and exact disclosed-input digest.

### 11.2 Audit surface

**FACT/NEGATIVE RESULT (high):** tool results expose no billed amount, API key
identity, organization, MCP-client identity, approval actor, policy digest, or
provider trace. Hosted and local examples do not define an MCP audit API. [S1-S9]

**RECOMMENDATION (high):** Curiosity must create its own pre-dispatch and
post-result audit records. Logs must hash or redact queries/URLs according to
data class and must never log the API key.

## 12. License, provenance, and clean-room boundary

**FACT (high):** the official `linkup-mcp-server` repository is MIT-licensed;
the notice is copyright Linkup 2025. npm identifies the same repository/git head,
and the release is publicly downloadable. [S2][S9-S10]

**QUALIFICATION (high):** MIT covers that adapter source, not Linkup's hosted MCP
deployment, API, crawler, index, research models, returned third-party web
content, target-site rights, trademarks, or service terms. The dependency tree
has its own licenses and must be reviewed if redistributed.

**Clean-room lesson:** observable contracts and behavior-level patterns may be
described independently. Curiosity should not copy code merely because it is
permissively licensed; if any code is ever reused, preserve the MIT notice and
complete a dependency/service/content rights review. No code reuse occurred in
this study.

## 13. Curiosity decision ledger

### Adopted

1. **ADOPT — capability-specific tools (high).** Keep Search, known-URL Fetch,
   Research creation, and Research observation distinct.
2. **ADOPT — asynchronous start/get split (high).** A long-running operation
   should return a durable local/provider handle rather than occupy a tool call
   for minutes.
3. **ADOPT — typed input constraints (high).** Enums, ISO dates, positive integer
   result counts, and explicit source filters improve model/tool interoperability.
4. **ADOPT — conservative static-fetch default (high).** JavaScript rendering is
   a separately selected, slower, more expensive capability.
5. **ADOPT — endpoint-native output preservation (medium-high).** Avoid silently
   dropping returned fields, while still translating into a safer neutral
   envelope.

### Adapted

1. **ADAPT — tools into policy-bearing commands (high).** Add tenant, purpose,
   data class, allowed capability, domain/network policy, deadline, attempts,
   bytes, items, polls, and spend before provider payloads.
2. **ADAPT — MCP JSON text into validated structured content (high).** Publish an
   output schema and `structuredContent`, retain a bounded compatibility text
   projection, and reject schema/size violations before model exposure.
3. **ADAPT — Research polling into a locally durable job (high).** Store intent,
   attempt, provider ID, state observations, deadlines, costs, and unknown
   disposition; never let a model own an unbounded polling loop.
4. **ADAPT — provider depth into inspectable work budgets (high).** `standard`,
   `deep`, and S/M/L/XL are adapter hints; neutral contracts specify enforceable
   retrieval, fetch, iteration, token, time, and dollar ceilings.
5. **ADAPT — citations into evidence-bearing claims (high).** Bind claims to
   lawful immutable captures and passages with hashes/times/versions; preserve
   unsupported and contradictory states.
6. **ADAPT — errors into a typed two-layer taxonomy (high).** Preserve MCP
   protocol errors separately from provider execution failures and retry policy.
7. **ADAPT — credentials into scoped secret references (high).** Resolve a
   provider key at dispatch, never expose it in URLs/process arguments, and
   rotate/redact/audit it.
8. **ADAPT — tool descriptions into non-epistemic language (high).** Describe
   operations and source shape; do not promise “trusted” or “verified.”

### Rejected

1. **REJECT — broad ambient model authority (high).** A connected key is not
   standing approval for arbitrary paid Search/Fetch/Research calls.
2. **REJECT — provider defaults as budget policy (high).** In particular, omitted
   Research depth must not silently select $1.50 L.
3. **REJECT — unbounded polling and escalation (high).** Stop-on-error retries,
   standard→deep, static→JS, or standard→pro require explicit authority and
   remaining budget.
4. **REJECT — JSON-in-text as a structured contract (high).** Parseable prose is
   not schema-validated structured content.
5. **REJECT — generated answer, snippet, Markdown, or raw HTML as evidence
   (high).** All are untrusted mutable or derived data.
6. **REJECT — query-string and process-argument secrets (high).** Compatibility
   does not justify routine credential exposure.
7. **REJECT — unpinned `npx -y` in controlled environments (high).** Latest-at-
   execution is an unaudited code change.
8. **REJECT — MCP version `1.0.0` as provenance (high).** It does not identify the
   current package, schema, or hosted deployment.

### Deferred

1. **DEFER — Linkup MCP adapter selection (medium-high).** Require hosted/local
   schema reconciliation, DPA/retention review, and separately authorized
   contract tests.
2. **DEFER — hosted MCP for sensitive work (high).** Await verified header-only
   secret handling, gateway controls, region/ZDR scope, logging, and audit terms.
3. **DEFER — Research for autonomous production ingestion (high).** Require hard
   cost/deadline/poll/cancel semantics and claim-level evidence handling.
4. **DEFER — Fetch `pro` through MCP (high).** Hosted docs and published package
   conflict; exact access semantics and safety policy remain unclear.
5. **DEFER — local MCP/MCPB (medium-high).** Require exact-version/digest pinning,
   sandboxing, dependency review, and secret-delivery remediation.
6. **DEFER — ZDR Research use (high).** Asynchronous record persistence and ZDR
   claims are not publicly reconciled.

## 14. Unknowns and required checks before revisit

### 14.1 Contract checks (not performed)

Under a separately authorized, no-secret-in-artifact test frame:

1. Compare hosted and exact-pinned local `tools/list` schemas and tool metadata;
   resolve Fetch `mode`, `includeRawContent`, defaults, domain limits, and server
   version.
2. Capture initialize capability/version negotiation and confirm whether hosted
   HTTP is sessionless, POST-only, and stateless as public source suggests.
3. Verify bearer-only operation, query-key disablement options, redaction, error
   header behavior, and per-client/tool key scope.
4. Use only benign owned fixtures to verify Search/Fetch/Research output shape,
   maximum bytes, truncation, date/domain validation, empty query, unsupported
   schemes, and provider/MCP error preservation.
5. Confirm timeout, disconnect, duplicate create, retry, polling, task retention,
   cancellation, and ambiguous-disposition behavior with strict call/spend caps.
6. Reconcile MCP charges against API list prices and obtain a machine-readable
   per-call usage/cost record.
7. Verify prompt-injection/content quarantine behavior without using hostile or
   third-party targets.

### 14.2 Provider/procurement questions

1. Which commit/package/schema is deployed at `mcp.linkup.so`, and how are
   breaking tool changes versioned and announced?
2. What MCP gateway data is logged, for how long, in which regions, and under
   which subprocessors? Are API keys or full URLs ever logged?
3. Does ZDR cover hosted MCP, Fetch, and asynchronous Research records, metadata,
   failures, backups, and gateway telemetry?
4. Which API-key scopes and per-tool/domain restrictions exist?
5. What hosted MCP rate, concurrency, request/output-size, timeout, and abuse
   controls differ from direct API limits?
6. What Fetch network/redirect/DNS/render isolation and per-attempt robots policy
   apply through MCP?
7. Can errors preserve stable provider codes/status/details and request IDs?
8. Can Research creation accept idempotency, deadline, maximum cost, cancellation,
   and webhook/event delivery?

## 15. Fact / inference / recommendation summary

| ID | Type | Claim | Confidence | Sources | Verdict |
|---|---|---|---|---|---|
| M1 | FACT | Four tools expose Search, Fetch, and Research start/get only. | High | [S1-S6] | Split **ADOPTED** |
| M2 | FACT | Generic Tasks and Extract are absent. | High | [S2-S6][S18] | Absence explicit |
| M3 | FACT | Search is forced to raw results; Research to sourced answer. | High | [S3][S5] | Output choice **ADAPTED** |
| M4 | FACT | All provider objects are JSON-stringified into MCP text with no output schema. | High | [S3-S6][S15] | Text contract **REJECTED** |
| M5 | FACT | Current docs claim Fetch pro mode; latest public package source lacks it. | High | [S1][S2][S4][S9] | Pro **DEFERRED** |
| M6 | FACT | Hosted supports bearer or query API key; header is preferred. | High | [S1][S7] | Query key **REJECTED** |
| M7 | FACT | Local uses stdio and published examples use unpinned `npx -y` with key argument. | High | [S1][S8-S9] | Pin/sandbox **REQUIRED** |
| M8 | FACT | Research omission defaults through to L: 5–10 min, $1.50. | High | [S5][S11-S12] | Provider default **REJECTED** |
| M9 | FACT | Wrapper failures lose structured provider error taxonomy. | High | [S6][S13] | Error handling **ADAPTED** |
| M10 | INFERENCE | MCP is a thin adapter; agent owns outer orchestration and provider owns deep internal work. | High | [S3-S7] | Boundary retained |
| M11 | INFERENCE | Connecting without client confirmation/budgets grants broad paid network authority. | High | [S3-S5][S12][S15] | Ambient authority **REJECTED** |
| M12 | FACT/UNKNOWN | Security/ZDR controls are vendor-stated but not specifically bound to all MCP/Research data paths. | High | [S14] | Sensitive use **DEFERRED** |
| M13 | FACT | npm/release/source/server announce inconsistent versions. | High | [S2][S6][S8-S9] | Build identity **ADAPTED** |
| M14 | RECOMMENDATION | Curiosity must own authorization, budgets, provenance, quarantine, and audit. | High | synthesis | **ADOPT** |

## 16. Bounded curiosity pass

After synthesis, remaining in-frame threads were scored 1–5 for **relevance
(R)**, **decision value (V)**, **novelty (N)**, and investigation **cost (C)**,
where 5 is expensive. Only high-value, low-cost public-source threads were
pursued.

| Thread | R | V | N | C | Outcome |
|---|---:|---:|---:|---:|---|
| Exact source-level schemas versus current MCP docs | 5 | 5 | 5 | 1 | **Pursued:** found Fetch pro-mode drift and descriptive-only domain cap. |
| Published package/release/build identity | 5 | 5 | 4 | 1 | **Pursued:** npm 3.3.0, source/MCPB 3.0.0, server 1.0.0. |
| Research default cost and polling authority | 5 | 5 | 4 | 1 | **Pursued:** omission reaches L; no poll/deadline/cancel budget. |
| Error preservation across MCP wrapper | 5 | 5 | 4 | 1 | **Pursued:** provider taxonomy collapses to `Error.message`. |
| Hosted versus local transport/security boundary | 5 | 5 | 4 | 2 | **Pursued:** bearer/query, sessionless POST, stdio, MCPB, source-level Origin gap. |
| ZDR compatibility with asynchronous Research | 5 | 5 | 5 | 2 | **Pursued to saturation:** not reconciled publicly. |
| Inspect latest npm tarball binaries beyond pinned source | 3 | 3 | 2 | 3 | **CURIOSITY_NO_GO:** registry git head matches pinned commit; no expected decision gain. |
| Invoke hosted `tools/list` without credentials | 5 | 4 | 3 | 5 | **CURIOSITY_NO_GO:** credentials/live calls explicitly forbidden. |
| Install/run npm or MCPB locally | 4 | 4 | 3 | 5 | **CURIOSITY_NO_GO:** executable supply-chain action outside clean-room read-only scope. |
| Probe Fetch SSRF/redirect/renderer behavior | 5 | 5 | 5 | 5 | **CURIOSITY_NO_GO:** security testing and target traffic require separate authority. |
| Infer hosted private deployment or backend models | 2 | 2 | 5 | 5 | **CURIOSITY_NO_GO:** proprietary, unsupported, and unnecessary for the interface decision. |
| Review gated Trust Center/DPA evidence | 4 | 4 | 3 | 4 | **DEFERRED:** requires organizational/procurement authority. |
| Benchmark result quality or compare MCP vendors | 3 | 3 | 2 | 5 | **CURIOSITY_NO_GO:** outside this product-surface frame and cannot close provenance gaps. |

**Stop condition:** coverage and public-source saturation reached. Remaining
high-value gaps require provider confirmation, contract review, or separately
authorized credentialed tests. No live autonomous curiosity follow-up is
authorized.

## 17. Primary-source ledger

All sources were accessed 2026-08-17.

- **[S1]** Linkup, “Linkup MCP Server” — hosted/local/MCPB installation,
  authentication, current tool documentation, and stated parameter differences.
  <https://docs.linkup.so/pages/integrations/mcp/mcp>
- **[S2]** Linkup official MCP repository at pinned head
  `b7c8bb9eb6447ec4e0cde6471de27c573e1bd787` — complete public tree,
  README, package metadata, release lineage.
  <https://github.com/LinkupPlatform/linkup-mcp-server/tree/b7c8bb9eb6447ec4e0cde6471de27c573e1bd787>
- **[S3]** Linkup MCP `linkup-search` implementation at pinned commit — exact
  Zod fields/defaults and forced `searchResults` output.
  <https://github.com/LinkupPlatform/linkup-mcp-server/blob/b7c8bb9eb6447ec4e0cde6471de27c573e1bd787/src/tools/search.ts>
- **[S4]** Linkup MCP `linkup-fetch` implementation at pinned commit — exact
  local-package fields/defaults and Fetch forwarding.
  <https://github.com/LinkupPlatform/linkup-mcp-server/blob/b7c8bb9eb6447ec4e0cde6471de27c573e1bd787/src/tools/fetch.ts>
- **[S5]** Linkup MCP Research implementations at pinned commit — start/get
  schemas, forced sourced answer, task serialization, and polling instructions.
  <https://github.com/LinkupPlatform/linkup-mcp-server/blob/b7c8bb9eb6447ec4e0cde6471de27c573e1bd787/src/tools/research.ts>
- **[S6]** Linkup MCP client/server implementation at pinned commit — error
  flattening, server metadata/instructions, registered tools, SDK construction.
  <https://github.com/LinkupPlatform/linkup-mcp-server/blob/b7c8bb9eb6447ec4e0cde6471de27c573e1bd787/src/client.ts>,
  <https://github.com/LinkupPlatform/linkup-mcp-server/blob/b7c8bb9eb6447ec4e0cde6471de27c573e1bd787/src/server.ts>
- **[S7]** Linkup MCP Streamable HTTP implementation at pinned commit — POST,
  auth precedence/parsing, stateless transport, 401/405/500 behavior.
  <https://github.com/LinkupPlatform/linkup-mcp-server/blob/b7c8bb9eb6447ec4e0cde6471de27c573e1bd787/src/index.ts>
- **[S8]** Linkup MCP stdio and MCPB manifests at pinned commit — argument/env
  key resolution, local transport, sensitive config substitution, manifest tools.
  <https://github.com/LinkupPlatform/linkup-mcp-server/blob/b7c8bb9eb6447ec4e0cde6471de27c573e1bd787/src/stdio.ts>,
  <https://github.com/LinkupPlatform/linkup-mcp-server/blob/b7c8bb9eb6447ec4e0cde6471de27c573e1bd787/mcpb/manifest.json>
- **[S9]** npm latest metadata and GitHub v3.3.0 release — package version,
  integrity/signature/attestation pointer, git head, MCPB digest, release date.
  <https://registry.npmjs.org/linkup-mcp-server/latest>,
  <https://github.com/LinkupPlatform/linkup-mcp-server/releases/tag/v3.3.0>
- **[S10]** Linkup MCP MIT license at pinned commit.
  <https://github.com/LinkupPlatform/linkup-mcp-server/blob/b7c8bb9eb6447ec4e0cde6471de27c573e1bd787/LICENSE>
- **[S11]** Linkup current Search, Fetch, and Research endpoint documentation and
  OpenAPI — native modes/outputs, job state, output fields, and endpoint bounds.
  <https://docs.linkup.so/pages/documentation/endpoints/search/reference>,
  <https://docs.linkup.so/pages/documentation/endpoints/fetch/overview>,
  <https://docs.linkup.so/pages/documentation/endpoints/fetch/reference>,
  <https://docs.linkup.so/pages/documentation/endpoints/research/overview>,
  <https://docs.linkup.so/pages/documentation/endpoints/research/post>
- **[S12]** Linkup, “Pricing” — current Search/Fetch/Research/Extract prices,
  success/error billing, and credit exhaustion.
  <https://docs.linkup.so/pages/documentation/platform/pricing>
- **[S13]** Linkup, “Errors” and “Rate Limits” — native error envelope/classes,
  429 ambiguity, Search/Fetch organization QPS.
  <https://docs.linkup.so/pages/documentation/platform/errors>,
  <https://docs.linkup.so/pages/documentation/platform/rate-limits>
- **[S14]** Linkup security/privacy pages — regions, ZDR non-default, encryption,
  certifications, content filtering, quality, crawling, and enterprise controls.
  <https://docs.linkup.so/pages/security-and-privacy/data-processing-privacy>,
  <https://docs.linkup.so/pages/security-and-privacy/security-compliance>,
  <https://docs.linkup.so/pages/security-and-privacy/content-safety-index-controls>
- **[S15]** Model Context Protocol, “Tools,” 2025-06-18 specification —
  model-controlled invocation, human-in-loop guidance, schemas, structured
  content, errors, output validation, timeouts, and audit guidance.
  <https://modelcontextprotocol.io/specification/2025-06-18/server/tools>
- **[S16]** Model Context Protocol, “Transports,” 2025-06-18 specification —
  stdio, Streamable HTTP, Origin/auth/local-bind requirements, GET 405,
  sessions, disconnection, and cancellation.
  <https://modelcontextprotocol.io/specification/2025-06-18/basic/transports>
- **[S17]** Model Context Protocol, “Security Best Practices” — local-server
  execution, consent, sandboxing, token/scope minimization, and SSRF guidance.
  <https://modelcontextprotocol.io/specification/2025-06-18/basic/security_best_practices>
- **[S18]** Linkup documentation index, Tasks, and Extract overviews — product
  inventory used to distinguish absent MCP capabilities.
  <https://docs.linkup.so/llms.txt>,
  <https://docs.linkup.so/pages/documentation/endpoints/tasks/overview>,
  <https://docs.linkup.so/pages/documentation/endpoints/extract/overview>

## 18. Confidence summary

- **High:** public v3.3.0 source tool names, inputs, defaults, forced output
  choices, text serialization, error flattening, local stdio/HTTP source behavior,
  release/package identity, documented prices, and absence of Tasks/Extract from
  the repository.
- **High:** documentation/source contradiction on Fetch `mode` and internal
  version-identity mismatch.
- **Medium-high:** thin-adapter architecture, authority amplification, and the
  conclusion that Curiosity must own budgets/audit/trust boundaries.
- **Medium:** applicability of general Linkup content-safety and privacy claims to
  every hosted MCP/Fetch/Research path.
- **Low/unknown:** actual current hosted `tools/list`, deployed commit/gateway,
  MCP-specific retention/logging/ZDR, effective limits/timeouts, Fetch network
  controls, measured behavior, and billing correctness without authorized tests.
