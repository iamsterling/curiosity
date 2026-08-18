# Model Context Protocol tools as an agent-search boundary

**Research and source access date:** 2026-08-17  
**Protocol revision:** stable/current `2026-07-28`  
**Decision:** whether MCP's tool contract should be used as Curiosity's
agent-facing search boundary, and what must remain outside that boundary.  
**Status:** clean-room public-specification research; not an implementation,
deployment, compatibility certification, security audit, or legal opinion.

## Executive verdict

**ADAPTED as an optional agent adapter; REJECTED as the provider foundation,
search domain model, evidence model, or authority/budget system (high
confidence).**

MCP 2026-07-28 provides a strong generic tool envelope: capability and version
discovery, paginated/cached tool listing, JSON Schema input and output
contracts, typed structured results plus multimodal content, two-level errors,
progress, cancellation, OAuth-based HTTP authorization, and explicit client
validation duties [S1-S10]. Those properties make it a useful wire boundary
between an MCP-capable host and Curiosity's provider-neutral `web_search` tool.

It intentionally does **not** define search semantics. It has no standard
query, result, rank, citation, provenance, freshness, coverage, curiosity
branch, call-count, byte, cost, or total-research-budget fields. Tool
descriptions and behavior annotations are server claims; tool output remains
server-produced data. OAuth establishes a principal's access to an MCP server,
not the factual trustworthiness of a search hit or permission for retrieved
text to widen an agent's authority [S1][S4][S8]. Cancellation is cooperative,
progress is optional, and generic timeouts/rate limits do not supply a complete
research budget [S5][S6].

For Curiosity, keep this order of ownership:

```text
caller frame + researcher-only authority + aggregate budget
  -> provider-neutral SearchRequest / SearchResponse domain contract
  -> owned search service and immutable evidence
  -> MCP adapter: server/discover, tools/list, tools/call
  -> host validates, bounds, labels untrusted, and renders to researcher
```

MCP must not import model-provider types into the search plane, and MCP tool
discovery must not become permission discovery. The host should expose only
pre-authorized search tools, validate both arguments and results, enforce hard
limits independently of the server, and permit only the already-authorized,
single, in-frame Curiosity pass [L1][L2].

## 1. Decision frame, bounded questions, and method

### 1.1 Bounded sub-questions

1. What is the exact 2026-07-28 discovery, schema, invocation, result, and
   change-notification contract for tools?
2. Which guarantees apply to structured content, annotations, validation,
   errors, progress, cancellation, authorization, and version negotiation?
3. What does MCP enforce versus merely describe or recommend?
4. Which generic limits are absent and therefore must live in Curiosity's
   domain and host-policy layers?
5. How can Curiosity use the protocol without treating MCP, an MCP server, or a
   provider SDK as its search foundation?
6. What public-standard and license boundary permits clean-room adaptation?

### 1.2 Evidence and access boundary

- Primary evidence is the official stable 2026-07-28 specification, its tagged
  TypeScript schema, changelogs, release record, official security guidance,
  governance, and repository license. Earlier official revisions were read
  only to reconstruct public contract history.
- Local mapping uses repository constitution, ADR 0020, ADR 0021, and the owned
  search dossier [L1-L4].
- No MCP server was installed, executed, scanned, fuzzed, or queried. No SDK or
  third-party implementation source was inspected. No credentials, private
  endpoints, packet capture, decompilation, or restricted material were used.
- Normative `MUST`/`SHOULD` statements are reported as specification duties,
  not proof that implementations comply. The TypeScript schema is identified
  by the specification as the message-structure source of truth [S2][S3].
- All web sources were accessed 2026-08-17. Mutable “Current” pages can receive
  backward-compatible edits without a new protocol date [S11].

### 1.3 Labels

- **FACT** — directly supported by cited primary evidence.
- **INFERENCE** — bounded conclusion from those facts; not a disclosed runtime
  implementation.
- **RECOMMENDATION** — proposed Curiosity choice.
- Confidence is **high**, **medium**, or **low**.

## 2. Status, lineage, and public-standard boundary

### 2.1 Current status

**FACT (high):** GitHub release `2026-07-28`, commit
`5f5440bb26a62e2cf3440b92da5a667efa03b267`, is marked the stable release; the
official versioning guide calls `2026-07-28` the Current revision [S11][S12].
MCP describes itself as an **open protocol** using JSON-RPC 2.0 between hosts,
clients, and servers [S2]. It is governed as “Model Context Protocol a Series
of LF Projects, LLC” through a maintainer/SEP process [S18].

**INFERENCE (high):** MCP is a publicly governed, published protocol
specification, but the inspected sources do not establish it as an IETF, ISO,
IEC, W3C, or other accredited standards-body standard. “Open protocol” is the
accurate status; “IETF standard” or “ISO standard” is not.

### 2.2 Tool-contract evolution

| Revision | Officially recorded tool-boundary change | Architectural meaning |
| --- | --- | --- |
| `2024-11-05` | Baseline `tools/list` and `tools/call`, JSON Schema inputs, text/image/embedded-resource results, two error layers, progress/cancellation utilities [S17]. | Small model-callable RPC surface already existed; no structured result schema. |
| `2025-03-26` | Added behavioral tool annotations; OAuth 2.1 authorization and Streamable HTTP; audio content; human-readable progress message [S16]. | Safety hints and remote transport grew, but annotations remained claims rather than enforcement. |
| `2025-06-18` | Added `structuredContent`/`outputSchema`, resource links, OAuth resource-server discovery and resource indicators; removed JSON-RPC batching [S15]. | Machine validation became practical; token audience binding became explicit. |
| `2025-11-25` | Added tool-name guidance, icons, incremental scope consent, and clarified invalid semantic inputs as tool execution errors; JSON Schema 2020-12 became default [S14]. | Better UX/interoperability and model self-correction. |
| `2026-07-28` | Removed protocol sessions and initialization; added per-request version/capabilities, mandatory `server/discover`, result types, MRTR, list TTL/cache scope, stricter HTTP headers, richer JSON Schema, extension negotiation, and deprecation policy [S10]. | A materially new stateless era; adapters cannot assume legacy handshake/session behavior. |

**FACT (high):** 2026-07-28 calls versions from 2025-11-25 and earlier
“legacy” and the new per-request metadata design “modern.” Modern clients and
servers do not initialize a session; dual-era implementations need explicit
fallback behavior [S9][S10].

### 2.3 License boundary and retained inconsistency

The tagged repository `LICENSE` says the project is transitioning from MIT to
Apache-2.0: new code/specification contributions are Apache-2.0, unrelicensed
older contributions remain MIT, and non-specification documentation is
CC-BY-4.0 [S19]. Governance says new and outbound specifications use
Apache-2.0 and documentation excluding specifications uses CC-BY-4.0 [S18].

The same tagged repository's README still says, without qualification, “This
project is licensed under the MIT License” [S20]. **This contradiction is
retained.** The specific `LICENSE` and governance texts are more detailed and
newer in policy substance, but this study cannot assign a contribution-level
license to every historical specification line.

**RECOMMENDATION (high):** concepts and wire behavior may be adapted from the
published standard with attribution. Do not copy tagged schema, examples, or
prose into an owned implementation until exact-file provenance and applicable
MIT/Apache/CC obligations are recorded. An independently authored adapter and
tests should target externally observable normative behavior. MCP compatibility
does not make MCP code part of the owned search core.

## 3. Protocol and discovery contract

### 3.1 Modern request envelope

**FACT (high):** every MCP message follows JSON-RPC 2.0. A request ID is a
non-null string or integer unique among active requests. Every modern request
must include `_meta.io.modelcontextprotocol/protocolVersion` and
`_meta.io.modelcontextprotocol/clientCapabilities`; `clientInfo` is recommended
but self-reported and must not drive security decisions [S3]. Every successful
result has `resultType`; core values are `complete` and `input_required` [S3].

There is no ambient protocol session. Each request is self-contained, and
cross-call state uses an explicit identifier/handle passed as ordinary data.
Connections and stdio processes are not conversation boundaries [S3].

**INFERENCE (high):** `research_frame_id`, `branch_id`, or an index snapshot
cannot safely be inferred from one connection. If Curiosity needs them, the
domain request or an integrity-protected server handle must carry them
explicitly on every relevant call.

### 3.2 Server and tool discovery

1. Servers **must** implement `server/discover`, returning supported protocol
   versions, capabilities, optional instructions, identity metadata, `ttlMs`,
   and `cacheScope`; calling it is optional for clients [S7].
2. A tool server declares `capabilities.tools`; `listChanged` says whether it
   supports tool-list change notifications [S1].
3. `tools/list` is cursor-paginated and cacheable. Its complete result carries
   `tools`, optional `nextCursor`, mandatory non-negative `ttlMs`, and
   `cacheScope: public|private` [S1][S13].
4. A tool set may be empty or change over time. It must not vary per connection
   or due to other requests on that connection, but may vary with the
   authorization presented on the request [S1].
5. Servers should return a deterministic tool order. List-change events require
   an opted-in `subscriptions/listen` stream; notification invalidates a cached
   list [S1][S10][S13].

**Bounds:** clients do not choose page size; cursors are opaque, and an empty
string is still a valid cursor. There is no cross-page snapshot guarantee;
changes can cause gaps or duplicates, so a client requiring a coherent catalog
must restart listing [S21][S13].

**RECOMMENDATION (high):** Curiosity should normally expose a tiny, policy-
filtered static catalog (`web_search` and only separately approved read tools),
not pass every discovered server tool to the model. Treat `serverInfo`, server
instructions, names, descriptions, schemas, icons, and list ordering as
untrusted metadata until the server/configuration is approved. Pin the approved
server identity/configuration outside self-reported `serverInfo`.

### 3.3 Name identity and aggregation

Tool names should be 1-128 characters, case-sensitive, restricted to ASCII
letters, digits, underscore, hyphen, and dot, and unique only within one server
[S1]. The self-reported server name is not globally unique. Aggregating clients
therefore need their own collision-resistant server identity and disambiguation
strategy [S1].

**Implication:** the neutral public tool name can remain `web_search`, but an
MCP host must route it using an approved adapter/server identity rather than
trusting the first discovered tool with that name.

## 4. Tool schema and invocation

### 4.1 Tool definition

The wire-level definition is:

| Field | Requirement and trust boundary |
| --- | --- |
| `name` | Required programmatic identifier; server-scoped uniqueness only. |
| `title` | Optional display name. |
| `description` | Optional human-readable functionality hint for clients/models. It is not a behavioral proof. |
| `icons` | Optional untrusted image metadata; safe fetch/render rules apply [S3]. |
| `inputSchema` | Required valid JSON Schema object with root `type: object`; defaults to draft 2020-12. |
| `outputSchema` | Optional valid JSON Schema for `structuredContent`; defaults to draft 2020-12. |
| `annotations` | Optional untrusted behavior hints. |
| `_meta` | Open extension metadata subject to reserved-name rules. |

Sources: [S1][S4].

Implementations must support JSON Schema 2020-12. They validate schemas in a
supported declared/default dialect and must reject unsupported dialects
gracefully. They must not automatically fetch network `$ref`s; unresolved
external references should cause rejection, not permissive fallback. Validators
should bound depth, subschema count, and validation time because composition
and `$defs` can be denial-of-service inputs [S3].

For a zero-argument tool, `{ "type": "object", "additionalProperties":
false }` is the recommended schema. Merely using `{ "type": "object" }`
accepts arbitrary properties [S1].

**RECOMMENDATION (high):** Curiosity's input schema should retain explicit
length/range limits and `additionalProperties:false`. Protocol-level JSON
Schema capability is not itself a bound; each string, array, result count,
nesting level, and optional filter needs a domain maximum.

### 4.2 `tools/call`

A call contains `name`, optional object-valued `arguments`, required modern
request metadata, and optionally MRTR `inputResponses`/`requestState` [S1][S4].
For Streamable HTTP, each message is a new POST; the request must mirror version,
method, and tool name into required headers. The server validates header/body
agreement [S22].

2026-07-28 also lets primitive, statically reachable input properties carry
`x-mcp-header`, causing values to be copied to `Mcp-Param-*` headers. HTTP
clients must reject malformed definitions, and server authors should not mark
passwords, tokens, or PII because intermediaries see headers [S1][S22].

**RECOMMENDATION (high):** do not use `x-mcp-header` for search query, private
frame, hypotheses, credentials, location, or tenant-private metadata. If a
routing field must be mirrored, define a non-sensitive opaque class and still
validate body/header equality. Query content belongs in the bounded body.

### 4.3 Multi-round-trip input

A tool may return `resultType:"input_required"` with client requests and/or
opaque `requestState`; the retry is a new independent request ID. The client
must not inspect or modify state. Servers must treat echoed state as hostile,
protect its integrity when it affects authorization or logic, and should bind
it to principal, expiry, and original request; strict single use requires
server state [S23].

**INFERENCE (high):** MRTR is inappropriate as an implicit permission escalator
for ordinary read-only web search. A search server asking for elicitation or
sampling has expanded the interaction graph. Curiosity should reject or route
it through a separately authorized UI/policy path rather than auto-fulfill it.

## 5. Results, structured content, and annotations

### 5.1 Result channels

A complete `CallToolResult` has required `content: ContentBlock[]`, optional
`structuredContent` containing any JSON value, and optional `isError` (default
false) [S1][S4]. Content blocks include text, image, audio, resource links, and
embedded resources. Resource links may refer to objects absent from
`resources/list`; embedded/resource content introduces a second URI/fetch
boundary [S1].

If `outputSchema` exists:

- the server **must** make `structuredContent` conform;
- the client **should** validate it;
- for backward compatibility the server should also serialize structured JSON
  into a text block [S1].

**FACT (high):** schema-valid structured content remains **server-produced
data**. The specification explicitly distinguishes it from model “structured
outputs” [S1]. Schema conformance proves shape, not truth, provenance, safe
semantics, or authorization.

**RECOMMENDATION (high):** make `structuredContent` the canonical Curiosity
adapter path and treat text JSON as compatibility-only. Validate first; reject
duplicate-key/parser ambiguities at the transport parser; cap bytes/items/text;
then normalize into the internal `SearchResponse`. Never merge the text and
structured representations as independent evidence.

### 5.2 Search-specific output deficits

MCP can carry any Curiosity search record, but defines none of its meaning. It
does not standardize:

- `request_id`, `branch_id`, `index_snapshot_id`, or schema/domain version;
- title, URL, snippet, rank, score, source type, owner cluster, or duplicate
  cluster;
- document/capture/passage identity, offsets, hashes, extractor version, or
  redirect/canonical chain;
- fetched/observed/published time or freshness mode;
- citation support/contradiction relation;
- partial provider/shard failures, policy filtering, corpus coverage, or
  freshness warnings;
- result count, response bytes, continuation semantics for a tool result, or
  an immutable evidence reference.

**INFERENCE (high):** adopting MCP alone would preserve the current
provider-neutral tool name but not create a provider-neutral **evidence**
contract. Those fields must be specified and versioned by Curiosity beneath the
adapter [L3][L4].

### 5.3 Two different annotation families

**Tool behavior annotations** are `title`, `readOnlyHint`, `destructiveHint`,
`idempotentHint`, and `openWorldHint`. Defaults are conservative:
`readOnly=false`, `destructive=true`, `idempotent=false`, `openWorld=true`.
Every property is a hint and may misdescribe behavior; clients must not make
tool-use decisions from annotations received from untrusted servers [S4].

**Content/resource annotations** are optional `audience` (`user` and/or
`assistant`), `priority` (0-1), and `lastModified` timestamp. They help display
or context selection but are server metadata, not evidence confidence [S24].

For an approved Curiosity adapter, `web_search` can truthfully advertise
`readOnlyHint:true` and `openWorldHint:true`; `idempotentHint` is defined as
meaningful only for mutating tools and should not be repurposed to claim stable
search results. `lastModified` cannot substitute for capture/fetch/publication
provenance.

**RECOMMENDATION (high):** use annotations only for presentation after trust is
established by configuration. Enforce read-only operation through permissions,
server design, egress, and tests—not through `readOnlyHint`. Do not map
`priority` to result rank or factual confidence.

## 6. Errors, progress, cancellation, and long-running work

### 6.1 Error layers

| Layer | Examples | Wire form | Model treatment |
| --- | --- | --- | --- |
| Protocol/request failure | unknown tool, malformed `CallToolRequest`, unsupported method/version, exceptional server condition | JSON-RPC `error` | Client may expose a redacted form; retry is usually host/protocol logic. |
| Tool execution failure | upstream API failure, semantic input constraint, business logic failure | successful JSON-RPC result with `isError:true` and content | Client should provide actionable, bounded text to the model for correction. |

Sources: [S1][S4].

**Retained ambiguity:** tools prose says input validation such as wrong date or
out-of-range value is a tool execution error so the model can correct it [S1],
and the 2025-11-25 changelog records that clarification [S14]. The current
source-of-truth schema's `InvalidParamsError` commentary nevertheless lists
“invalid tool arguments” under JSON-RPC `-32602` [S4]. A structural failure to
satisfy `CallToolRequest` clearly belongs at protocol level; a validly
structured but domain-invalid argument belongs in `isError:true` according to
the dedicated tools prose. Robust clients should handle either from imperfect
servers and never infer retry safety solely from the layer.

**RECOMMENDATION (high):** preserve stable, redacted error classes in the
domain adapter. Do not return credentials, internal hosts, raw upstream bodies,
private query context, stack traces, or policy internals in model-visible error
text. Record partial search failures as typed warnings in a successful bounded
search response when valid evidence remains; reserve `isError` for a failed
tool execution.

### 6.2 Progress

Clients opt in with a unique active `progressToken`. Servers may emit no
updates, choose their frequency, omit total, and provide a human-readable
message. Progress values must increase and notifications stop after completion;
both sides should rate-limit them [S5].

**INFERENCE (high):** progress is observational, not a budget or heartbeat
guarantee. A malicious server can report progress without useful work. Curiosity
may show coarse phases/counts, but the host's hard deadline and resource budget
must remain independent.

### 6.3 Cancellation and timeout

On stdio, the client sends `notifications/cancelled`; on Streamable HTTP,
closing the per-request SSE response stream is the cancellation signal.
Servers should stop and free resources but may ignore cancellation when unknown,
complete, or uncancellable. Clients should ignore a late result. Implementations
should configure per-request timeouts and always retain a maximum timeout even
if progress resets an idle clock [S6][S22].

**RECOMMENDATION (high):** cancellation should propagate to search work, but
server-side wall time, result/byte ceilings, upstream fetch ceilings, and an
operator kill switch remain mandatory because cancellation is cooperative.
Reissuing a broken 2026-07-28 HTTP stream is a new request and may duplicate
side effects; search is read-only but duplicate cost still counts [S10][S22].

### 6.4 No durable task in core

The 2026 revision moved tasks out of core into an opt-in extension [S10]. A
plain tool call is request/response, optionally streaming progress. Curiosity's
ordinary search should remain a bounded core call. Long research jobs, if ever
authorized, need a separately reviewed asynchronous domain contract/extension;
they must not be inferred from progress support.

## 7. Authorization, trust, and untrusted outputs

### 7.1 What HTTP authorization does establish

MCP HTTP authorization is optional; when implemented it profiles OAuth 2.1.
The MCP server is a resource server, the MCP client is an OAuth client, and an
authorization server issues tokens [S8]. Material requirements include:

- protected-resource and authorization-server metadata discovery;
- PKCE and issuer validation in the user authorization flow;
- an RFC 8707 `resource` in authorization and token requests;
- bearer token in the `Authorization` header on every HTTP request, never URI;
- token audience validation by the MCP server;
- no acceptance or passthrough of tokens issued for other resources;
- 401 for invalid/expired token, 403 plus scope challenge for insufficient
  permission;
- client retry limits for step-up authorization [S8].

Tool lists may vary by the authorization on each request, so least privilege can
hide non-granted tools [S1]. Official security guidance recommends a small
baseline scope and incremental, precise step-up scopes rather than broad
wildcards [S25].

### 7.2 What it does not establish

**INFERENCE (high):** a valid token proves only an authorization relationship
for the MCP resource. It does not prove:

- that `serverInfo`, tool descriptions, annotations, schemas, or output are
  honest;
- that an authorized server implementation is uncompromised;
- that a web result is accurate, current, licensed, or safe;
- that a model may disclose every available query argument;
- that retrieved text may trigger another tool, scope upgrade, network fetch,
  or write action;
- that possession of a state handle is authorization.

Official guidance explicitly says state handles are not authentication and
must be rebound to the verified caller [S25]. It also covers confused-deputy,
token-passthrough, OAuth-discovery SSRF, malicious local server installation,
unsafe authorization URLs, and local proxy/stdio escalation [S25].

### 7.3 Client and server validation duties

Tool servers must validate inputs, enforce access control, rate-limit calls,
and sanitize outputs. Clients should show inputs before calls, obtain
confirmation for sensitive operations, validate results before giving them to
the LLM, enforce timeouts, and audit usage [S1]. The top-level specification
says hosts must obtain explicit user consent before invoking any tool, while
the tools chapter says there should always be a human able to deny and
confirmation prompts should be provided [S1][S2].

**Retained normative tension:** “explicit consent before invoking any tool” in
the top-level principles is stricter than the tools chapter's SHOULD-level
human-loop language. For Curiosity, repository policy already supplies a
narrow prior grant—researcher-only, read-only bounded search—but any widening
of tools, data disclosure, scope, or side effect needs explicit reviewed
authority [L1][L2].

### 7.4 Search output is hostile data

MCP requires/suggests shape validation and output sanitization, but it does not
define a provenance envelope or a normative “data, never instructions” bit for
tool results. Text blocks are expressly sent onward for model use [S1].

**RECOMMENDATION (high):** apply two distinct trust labels:

1. `mcp_server_trust` — whether this exact adapter/server configuration is
   approved to offer this tool; and
2. `evidence_trust = untrusted-external-evidence` — applies to every search
   title, URL, snippet, passage, metadata field, resource link, embedded
   resource, and error string, even from an approved server.

Validate schema, URI schemes, redirect/egress policy, MIME/magic bytes, sizes,
counts, Unicode, and provenance references before model exposure. Strip active
content. Retrieved text cannot change system instructions, call limits,
allowed tools, scopes, destinations, or approval state. Resource links should
not be fetched automatically; if a separate fetch is authorized, it receives
its own SSRF, credential, byte, and content checks.

## 8. Authority and budget limits: protocol versus policy

| Control | MCP 2026-07-28 supplies | What Curiosity still must enforce |
| --- | --- | --- |
| Principal/server access | Optional OAuth profile; resource audience; scopes; per-request auth [S8] | Researcher-only host permission and approved server/config identity. |
| Tool visibility | Auth-filterable `tools/list` [S1] | Static allowlist; discovery is not permission. |
| Side-effect hint | Untrusted annotations [S4] | Read-only service architecture and denied action tools. |
| Input shape | JSON Schema | Lengths, counts, locales, domain/time filters, frame/branch IDs, no extras. |
| Output shape | Optional output schema; client validation | Response bytes/items, evidence provenance, URI policy, normalization. |
| Invocation rate | Server must rate-limit [S1] | Per-user/frame/branch aggregate call count and concurrency. |
| Time | Client timeout/cancellation guidance [S6] | Hard end-to-end deadline and bounded upstream work despite progress. |
| Progress | Optional monotonic updates [S5] | No authority extension; phase/count only; notification flood cap. |
| Cost/tokens | No core generic field or guarantee found | Hard cost class/token/context/source limits and accounting. |
| Research continuation | No search-loop semantics | Caller-declared frame; one scored Curiosity pass; explicit stop reasons. |
| Long jobs | Optional external Tasks extension | Separate approval and durable-job budget if ever needed. |

**FACT (high):** no inspected core tool request field defines `max_calls`,
`max_cost`, `deadline`, `max_response_bytes`, `max_results`, or agent authority
[S1][S4]. A server may define these inside its own tool `inputSchema`; the host
can additionally impose out-of-band policy.

**RECOMMENDATION (high):** bounds must be duplicated where failure matters:
validated domain request, host policy, server execution, transport parser, and
response normalizer. Model instructions alone are not enforcement.

## 9. Curiosity mapping

### 9.1 Boundary placement

```text
MCP host/client                         Curiosity-owned system
------------------                     ----------------------
approved server config
  server/discover
  tools/list
  select web_search
  validate inputSchema
  policy + user/researcher grant
  tools/call -------------------------> MCP adapter
                                         validate/translate
                                         provider-neutral SearchRequest
                                         owned search plane
                                         SearchResponse + evidence
               <---------------------- validate/translate
  validate outputSchema
  enforce byte/item/deadline limits
  label all result data untrusted
  provide bounded evidence to researcher
```

The provider-neutral request/response is canonical. MCP is one adapter beside
OpenCode and ordinary HTTP, consistent with ADR 0021 [L2].

### 9.2 Minimum conceptual `web_search` mapping

**Input schema should carry:** bounded `query`, `max_results`, requested locale
and safe-search policy, optional time/domain/source/freshness filters, requested
evidence detail, `research_frame_id`, `branch_id`, optional parent branch,
deadline/cost class, and no unknown properties [L3]. Credentials and raw
authorization policy do not belong in tool arguments.

**Structured output should carry:** response and schema versions, request and
index snapshot IDs, bounded hits with document/capture/passage IDs and hashes,
fetched/canonical URLs, title/snippet, observed/published times, source/owner
clusters, bounded retrieval reason classes, immutable citation target,
`trust:"untrusted-external-evidence"`, coverage/freshness/policy/partial-failure
warnings, and continuation only if the domain contract can preserve its stated
consistency [L3].

MCP-specific translation:

- `Tool.inputSchema` describes the domain request without provider fields.
- `Tool.outputSchema` describes the versioned domain response.
- `structuredContent` contains that response; one serialized text block exists
  only for older clients.
- `readOnlyHint:true` and `openWorldHint:true` are descriptive only.
- `isError:true` reports a failed search execution; partial failures remain
  typed warnings when valid bounded hits are returned.
- progress may expose only safe aggregate phases (`retrieve`, `rank`,
  `assemble`) and counts, never raw private queries or internal object keys.
- cancellation aborts work best-effort; server deadlines remain authoritative.

### 9.3 Curiosity pass

MCP has no concept of Curiosity. The researcher/caller protocol remains:

1. caller declares frame, bounded questions, authority, and aggregate budget;
2. initial searches produce cited evidence and explicit unknowns;
3. after synthesis, score remaining in-frame gaps/contradictions by relevance,
   value, novelty, and cost;
4. execute only the best authorized follow-up within remaining budget;
5. stop on coverage, saturation, exhaustion, policy block, or duplication;
6. record rejected branches as `CURIOSITY_NO_GO` [L1][L3].

No discovered tool, annotation, result text, resource, progress message,
`InputRequiredResult`, or scope challenge may initiate a new curiosity branch.

## 10. Versioning and interoperability verdict

### 10.1 What is versioned

- Protocol dates represent the last backward-incompatible change. Current
  revisions may receive backward-compatible changes without a new date [S11].
- Every modern request declares a version. Unsupported versions return
  `-32022` plus the server's supported list; clients can retry [S9].
- Optional extensions are advertised in capabilities and must fall back to
  core or reject when the peer lacks support [S9].
- Tool/domain schema evolution has no separate MCP-native compatibility
  negotiation beyond changed tool definitions/list invalidation. `_meta` can
  carry vendor extensions but does not replace a domain schema version.

**Retained documentation inconsistency:** the current top-level specification
still says extensions are negotiated “during initialization” [S2], while the
same revision removed `initialize` and its versioning chapter defines
per-request capability-based extension negotiation [S9][S10]. Treat the
versioning chapter and tagged schema as controlling for 2026-07-28 modern
behavior; do not implement a new initialization dependency from the stale
phrase.

**RECOMMENDATION (high):** pin a tested MCP revision range and version the
Curiosity `SearchRequest`/`SearchResponse` independently. A tool-list TTL or
`list_changed` invalidation says the definition may have changed; it does not
prove backward compatibility. Hash/record the approved tool definition and
require review on authority-relevant drift.

### 10.2 Modern/legacy interoperability

2026-07-28 removed initialization, protocol session IDs, HTTP GET stream,
server-initiated request messages, and SSE resumption. It added
`server/discover`, per-request metadata, MRTR, and `resultType` [S10][S22]. A
modern-only client does not work with a legacy-only server. A dual-era client
must probe/fallback according to transport-specific rules; it must not treat a
recognized modern error as evidence of a legacy server [S9].

**RECOMMENDATION (medium-high):** initial Curiosity support should target only
stable 2026-07-28 semantics unless a concrete approved host requires a legacy
adapter. Supporting both eras materially enlarges parser, transport, auth,
state, cancellation, and test surfaces. Legacy support should be isolated and
explicit, never silent semantic downgrade.

### 10.3 Caching caution

`ttlMs` is a hint, not an immutability guarantee; `cacheScope:"private"`
permits reuse only in the same authorization context, while `public` may cross
authorization contexts [S13]. Search invocation results are not among MCP's
generic cacheable result operations. Do not apply tool-list TTL semantics to
search evidence. Curiosity's index snapshot and capture IDs—not MCP cache
hints—define replayability.

## 11. Adopt/adapt/reject/defer ledger

| Capability/idea | Verdict | Reason and confidence |
| --- | --- | --- |
| MCP as optional host adapter | **ADOPT** | Broad, typed public protocol boundary; high. |
| MCP as search/index/provider foundation | **REJECT** | No crawl, corpus, retrieval, ranking, evidence, or freshness semantics; high. |
| `tools/list` + deterministic order + invalidation | **ADAPT** | Useful approved-catalog transport; never dynamic permission; high. |
| JSON Schema 2020-12 input/output | **ADOPT with bounds** | Strong machine contract; validators and every field still need resource limits; high. |
| `structuredContent` as canonical adapter result | **ADOPT** | Avoid prose parsing; still untrusted and validated; high. |
| Text JSON compatibility copy | **ADAPT** | Needed for older clients, but not a second evidence source; high. |
| Tool annotations | **ADAPT for UI only** | Explicitly untrusted hints; never policy; high. |
| Content `priority` as rank/confidence | **REJECT** | Display/context hint, not retrieval score or truth; high. |
| Progress and cancellation | **ADOPT as advisory controls** | Better UX/resource release; neither is a budget guarantee; high. |
| MRTR for ordinary search | **REJECT by default** | Expands input/authority graph; separately gate if ever needed; medium-high. |
| OAuth resource/audience/scope model | **ADOPT for remote HTTP** | Sound principal/server boundary; does not confer evidence trust; high. |
| Dynamic Client Registration | **REJECT for new work** | Deprecated in favor of Client ID Metadata Documents [S26]; high. |
| Tasks extension for normal search | **DEFER** | Core bounded search does not require durable jobs; high. |
| `x-mcp-header` for sensitive context | **REJECT** | Intermediary exposure; high. |
| Dual-era compatibility | **DEFER** | Add only for an identified client/server need; medium-high. |
| MCP schema as internal domain model | **REJECT** | Adapter concerns must not leak into provider-neutral contracts; high. |

## 12. Unknowns, negative results, and checks

### 12.1 Material unknowns / negative findings

The official sources inspected did **not** establish:

- ecosystem-wide conformance rates or that any named SDK fully implements
  2026-07-28;
- a core conformance profile specifically for safe agent-search tools;
- cryptographic identity/integrity for tool definitions or a globally unique
  server identifier;
- a standard provenance/citation/evidence schema;
- a standard prompt-injection label or data-versus-instruction channel;
- generic maximum tool count, schema size, arguments bytes, result bytes,
  content blocks, call count, concurrency, deadline, token count, or monetary
  cost;
- delivery/acceptance guarantees for cancellation or progress;
- snapshot-consistent pagination of tool definitions;
- stable search-result caching or replay semantics;
- a tool-schema compatibility/version field independent of the MCP protocol;
- that an OAuth-authorized or registry-listed server is safe, honest, or
  suitable for Curiosity;
- formal accreditation by an external standards body;
- one unambiguous license statement across every file in the tagged repository.

These are retained negative results, not claims that extensions or individual
implementations cannot add them.

### 12.2 Pre-adoption verification checks

1. Validate the chosen host and server against exact `2026-07-28` request
   metadata, result types, discovery, headers, cancellation, and no-session
   behavior.
2. Test schema rejection: external `$ref`, pathological composition depth,
   unexpected properties, oversized strings/arrays, malformed
   `x-mcp-header`, and output-schema mismatch.
3. Test transport bounds: content length, streaming bytes/events, MIME,
   timeout despite progress, disconnect cancellation, late response, and
   redacted diagnostics.
4. Test trust: annotation lies, changed tool definition, name collision,
   malicious icon/resource URI, instruction-like result text, duplicate text
   versus structured result, and poisoned partial failure.
5. Test auth: audience mismatch, token passthrough rejection, scope denial and
   bounded step-up, private cache separation, state-handle cross-user replay,
   Origin/DNS-rebinding and OAuth-discovery SSRF.
6. Verify every returned Curiosity citation resolves to the claimed immutable
   capture/passage and that MCP adaptation loses no warning or provenance field.
7. Record exact schema/spec files and license notices used by implementers;
   resolve the tagged README/LICENSE inconsistency before copying any material.

## 13. Bounded curiosity pass

After the main synthesis, remaining in-frame gaps were scored 1-5 (higher is
more) for relevance (**R**), decision value (**V**), novelty (**N**), and
research cost (**C**, where lower is cheaper). Only the best bounded threads
were pursued.

| Thread | R | V | N | C | Decision/result |
| --- | ---: | ---: | ---: | ---: | --- |
| Verify exact 2026 tool annotations/defaults and structured result type | 5 | 5 | 4 | 1 | **Pursued:** tagged schema confirms hints/defaults and any-JSON structured content [S4]. |
| Reconstruct breaking 2026 session/version changes | 5 | 5 | 4 | 2 | **Pursued:** current changelog, versioning, and transport triangulated [S9][S10][S22]. |
| Check public-standard governance/license status | 4 | 5 | 4 | 2 | **Pursued:** found LF governance and retained README/LICENSE contradiction [S18-S20]. |
| Find protocol-native cost/call/byte budgets | 5 | 5 | 3 | 1 | **Pursued negative:** no generic fields in core tool/schema/utility sources; domain/host must supply them. |
| Benchmark SDK interoperability | 3 | 3 | 3 | 5 | **CURIOSITY_NO_GO:** requires installing/running implementations and exceeds public-contract frame. |
| Inspect third-party server poisoning incidents | 3 | 3 | 4 | 4 | **CURIOSITY_NO_GO:** useful threat research but not needed to establish normative boundary; official security duties suffice here. |
| Design a full MCP adapter schema/code | 4 | 3 | 2 | 4 | **CURIOSITY_NO_GO:** implementation prohibited and consequential schema belongs in a reviewed design/ADR. |
| Compare every official SDK release cadence | 2 | 2 | 3 | 4 | **CURIOSITY_NO_GO:** does not change protocol-versus-domain verdict. |

**Stop reason:** requested categories are covered; additional threads require
implementation testing or repeat the established boundary. Coverage and
saturation reached within the declared frame.

## 14. Sources

All web sources accessed 2026-08-17. MCP pages are official project sources;
vendor/community claims were not used.

### Current normative specification and schema

- **[S1]** Model Context Protocol, **Tools — 2026-07-28**.  
  https://modelcontextprotocol.io/specification/2026-07-28/server/tools
- **[S2]** Model Context Protocol, **Specification — 2026-07-28**.  
  https://modelcontextprotocol.io/specification/2026-07-28
- **[S3]** Model Context Protocol, **Base protocol overview — 2026-07-28**.  
  https://modelcontextprotocol.io/specification/2026-07-28/basic
- **[S4]** Model Context Protocol, **tagged TypeScript protocol schema —
  2026-07-28**.  
  https://github.com/modelcontextprotocol/modelcontextprotocol/blob/2026-07-28/schema/2026-07-28/schema.ts
- **[S5]** Model Context Protocol, **Progress — 2026-07-28**.  
  https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/progress
- **[S6]** Model Context Protocol, **Cancellation — 2026-07-28**.  
  https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/cancellation
- **[S7]** Model Context Protocol, **Discovery — 2026-07-28**.  
  https://modelcontextprotocol.io/specification/2026-07-28/server/discover
- **[S8]** Model Context Protocol, **Authorization — 2026-07-28**.  
  https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization
- **[S9]** Model Context Protocol, **Versioning and Compatibility —
  2026-07-28**.  
  https://modelcontextprotocol.io/specification/2026-07-28/basic/versioning
- **[S10]** Model Context Protocol, **2026-07-28 Key Changes**.  
  https://modelcontextprotocol.io/specification/2026-07-28/changelog
- **[S13]** Model Context Protocol, **Caching — 2026-07-28**.  
  https://modelcontextprotocol.io/specification/2026-07-28/server/utilities/caching
- **[S21]** Model Context Protocol, **Pagination — 2026-07-28**.  
  https://modelcontextprotocol.io/specification/2026-07-28/server/utilities/pagination
- **[S22]** Model Context Protocol, **Streamable HTTP — 2026-07-28**.  
  https://modelcontextprotocol.io/specification/2026-07-28/basic/transports/streamable-http
- **[S23]** Model Context Protocol, **Multi Round-Trip Requests —
  2026-07-28**.  
  https://modelcontextprotocol.io/specification/2026-07-28/basic/patterns/mrtr
- **[S24]** Model Context Protocol, **Resources and annotations —
  2026-07-28**.  
  https://modelcontextprotocol.io/specification/2026-07-28/server/resources
- **[S26]** Model Context Protocol, **Deprecated Features — 2026-07-28**.  
  https://modelcontextprotocol.io/specification/2026-07-28/deprecated

### Status, history, security, governance, and license

- **[S11]** Model Context Protocol, **Versioning guide — 2026-07-28**.  
  https://modelcontextprotocol.io/docs/2026-07-28/learn/versioning
- **[S12]** Model Context Protocol GitHub release, **2026-07-28 stable**.  
  https://github.com/modelcontextprotocol/modelcontextprotocol/releases/tag/2026-07-28
- **[S14]** Model Context Protocol, **2025-11-25 Key Changes**.  
  https://modelcontextprotocol.io/specification/2025-11-25/changelog
- **[S15]** Model Context Protocol, **2025-06-18 Key Changes**.  
  https://modelcontextprotocol.io/specification/2025-06-18/changelog
- **[S16]** Model Context Protocol, **2025-03-26 Key Changes**.  
  https://modelcontextprotocol.io/specification/2025-03-26/changelog
- **[S17]** Model Context Protocol, **Tools — 2024-11-05**.  
  https://modelcontextprotocol.io/specification/2024-11-05/server/tools
- **[S18]** Model Context Protocol, **Governance and Stewardship**.  
  https://modelcontextprotocol.io/community/governance
- **[S19]** Model Context Protocol, **tagged repository LICENSE —
  2026-07-28**.  
  https://github.com/modelcontextprotocol/modelcontextprotocol/blob/2026-07-28/LICENSE
- **[S20]** Model Context Protocol, **tagged repository README —
  2026-07-28**.  
  https://github.com/modelcontextprotocol/modelcontextprotocol/blob/2026-07-28/README.md
- **[S25]** Model Context Protocol, **Security Best Practices —
  2026-07-28**.  
  https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices

### Local decision and architecture sources

- **[L1]** `docs/decisions/0020-provider-neutral-web-search.md` — neutral
  `web_search`, researcher-only permission, untrusted results, bounded
  Curiosity.
- **[L2]** `docs/decisions/0021-owned-public-web-search.md` — owned search
  plane and separation of domain contracts from OpenCode/MCP adapters.
- **[L3]**
  `docs/research/owned-public-web-search-architecture-2026-08-17.md` — target
  evidence contract, planes, limits, and Curiosity-aware retrieval loop.
- **[L4]** `AGENTS.md` — repository constitution: provider neutrality,
  untrusted external data, explicit licensing, and no production mutation.
