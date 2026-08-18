# Microsoft Grounding with Bing Search: clean-room product dossier

**Date:** 2026-08-17  
**Decision:** what Microsoft Grounding with Bing Search teaches an owned,
provider-neutral Curiosity agent-search design, and whether any part should be
adopted, adapted, rejected, or deferred.  
**Status:** research record only; no service was provisioned or called.  
**Overall confidence:** high for the documented product boundary and terms;
medium for architecture inferences; low for undocumented ranking, freshness,
safety, and citation-generation internals.

## Executive verdict

**REJECTED as Curiosity's search foundation (high confidence).** Grounding with
Bing Search is a hosted, Bing-index-dependent, model-mediated answer tool. It
does not expose raw retrieved content to developers, cannot be used separately
from named Microsoft integrations, imposes exact display and material
copy/cache/training/evaluation restrictions, sends data outside the Azure
compliance and geographic boundary, and leaves crawl, index, ranking, passage
selection, and most evidence lineage opaque [S1][S3][S4]. Those properties are
incompatible with an owned search plane and reproducible evidence contract.

**ADAPTED as a contract and governance precedent (high confidence):** explicit
tool type and connection reference; model-controlled versus required tool use;
bounded result count; discovery-time freshness filters; market/language
controls; citations anchored to answer spans; visible generated queries; usage
counted per tool call; tenant-wide disable controls; and a hard distinction
between general-web and domain-restricted search [S1][S2][S6]. Curiosity should
implement neutral equivalents without copying Microsoft names, documentation,
output, or proprietary behavior.

**REJECTED as a benchmark corpus or evaluation oracle (high confidence).** The
terms prohibit using output to train, evaluate, or improve an AI model and
generally prohibit building a database, indexing links, crawling from output,
or creating a competing service [S3]. No paid call was made.

## 1. Frame, bounded questions, and method

### Questions

1. What is the current product, lifecycle state, and supported integration?
2. What request, retrieval, answer, query, and citation contracts are visible?
3. Where is the Bing/index boundary, and what remains inaccessible?
4. Which tenant, agent, freshness, safety, privacy, limit, and pricing controls
   exist?
5. Which dependencies and deprecations create lifecycle risk?
6. Which design lessons transfer clean-room to owned Curiosity search?

### Method and boundaries

Microsoft documentation, product terms, pricing, Marketplace, and privacy
pages were preferred as primary sources. All web sources were accessed
2026-08-17. Documentation examples were inspected, but no SDK or service code
was copied. No Azure/Bing resource, credential, paid call, stress test,
scraping, control bypass, or proprietary-ranking reverse engineering was used.

Vendor documentation establishes offered behavior, not comparative quality.
Search-result snippets were discovery leads only. Labels below mean:

- **FACT** — directly stated in a cited primary source.
- **INFERENCE** — architecture conclusion consistent with facts but not
  confirmed internally.
- **RECOMMENDATION** — proposed Curiosity choice.
- Confidence is **high**, **medium**, or **low**.

Coverage stops when every requested category has sourced facts, explicit
unknowns, and a Curiosity verdict. Undocumented ranking internals and live
quality tests are outside authority.

## 2. Product identity, status, and lifecycle

**FACT (high):** as of access, **Grounding with Bing Search** is GA on the new
Microsoft Foundry Agent Service agents API. It requires a separately created
Grounding with Bing Search resource and a Foundry project connection. The
explicit tool type is `bing_grounding`. SDK and REST support are documented for
Python, C#, JavaScript/TypeScript, and Java, in both basic and standard agent
setups [S1][S2].

**FACT (high):** Microsoft now recommends the separate, simpler **Web Search**
tool for new users. Web Search is also GA, uses Grounding with Bing underneath,
requires no customer-managed Bing resource for general search, and offers
`user_location` and `search_context_size`. The explicit Bing grounding tool
retains `count`, `freshness`, `market`, and `set_lang`, and supports qualifying
non-OpenAI Foundry models as well as Azure OpenAI models [S2][S6]. These are
distinct public surfaces over related Bing grounding services, not synonyms.

**FACT (high):** **Grounding with Bing Custom Search** is a separate preview
capability (`bing_custom_search_preview`) for public, Bing-indexed configured
domains/paths/pages. It requires a Custom Search resource, instance, and
connection [S1][S2]. General Grounding with Bing Search does not expose a domain
restriction parameter; Microsoft directs that need to Custom Search [S1].

**FACT (high):** classic Foundry agents are deprecated and scheduled to retire
2027-03-31. Grounding with Bing Search remains GA in the new service, but the
integration migrates from classic threads/runs to conversations/responses and
from older agent creation to versioned agent definitions [S7][S8].

**FACT (high):** the standalone Bing Web Search API documentation is archived
and marked retired [S9]. Grounding is therefore not evidence that Microsoft
restored a general raw Bing results API; its product page says output is not
directly accessible for use in other applications and the plan is limited to
select Microsoft integrations [S4].

**INFERENCE (high):** the durable abstraction is “Microsoft-managed web
grounding inside an approved agent/search integration,” not a stable Bing raw
search API. A customer coupling to resource provider, Foundry connection,
Responses/agent schemas, model support, terms, and display rules inherits
several independent lifecycle surfaces.

## 3. Observable contract and execution path

### 3.1 Request surface

The current REST example posts to the Foundry Responses endpoint with:

```text
model + input + tool_choice
  + tools[type=bing_grounding]
      .bing_grounding.search_configurations[]
          .project_connection_id
          .count?
          .freshness?
          .market?
          .set_lang?
```

**FACT (high):** `tool_choice="required"` can force use; otherwise the agent/model
can decide whether to call the tool. Within one run, the model may call the tool
again after evaluating prior tool output. Transactions are counted by tool call
per run, not by user turn or answer [S1].

**FACT (high):** the four Bing search controls are [S1]:

| Field | Documented semantics | Important boundary |
| --- | --- | --- |
| `count` | Default 5, maximum 50 web-page results | Actual count may be lower, overlap may occur, and the model may use fewer. |
| `freshness` | `Day`, `Week`, `Month`, one date, or `YYYY-MM-DD..YYYY-MM-DD` | Age means when **Bing discovered** the page, not publication or page-update time. |
| `market` | Market such as `en-US`; best-fit mapping for unsupported values | Mapping may change; it influences routing/result selection. |
| `set_lang` | Two- or four-letter UI-string language; four-letter preferred | Invalid/unsupported values can fall back to English; this is not documented as a content-language hard filter. |

**FACT (high):** agent creation references a project connection ID rather than
putting the Bing resource key in the agent request. Provisioning requires a
Grounding with Bing resource and project connection; the key is conveyed by the
managed service to Bing for billing and rate limiting [S1].

### 3.2 Retrieval and synthesis boundary

```text
end-user input + developer instructions
  -> customer's deployed model identifies a gap and formulates query/queries
  -> Foundry Grounding tool + project connection
  -> Bing query + tool parameters + resource key cross Azure boundary
  -> Bing public-web indexed results/chunks
  -> customer's deployed model selects/uses tool output and synthesizes answer
  -> answer text + source citations + Bing-query reference
```

**FACT (high):** Microsoft describes model-led query formulation, Bing search,
model synthesis, and source attribution. Only the generated Bing query, tool
parameters, and resource key—not a designated end-user identity field—are sent
to Bing. Developers and end users cannot access raw content returned by the
tool [S1].

**FACT (high):** Grounding with Bing Search targets the broad public web
available through Bing. Custom Search narrows this to configured public content
that Bing has indexed. Microsoft warns that recently added or changed content
may take several days to crawl and that stale answers depend on Bing indexing
schedule [S1][S6].

**INFERENCE (high):** the developer-facing product is an **answer contract**,
not a retrieval contract. `count` controls candidates made available to the
model, but neither guarantees candidates consumed nor exposes their ranked list,
snippets/passages, scores, dropped results, deduplication, safety decisions, or
index version.

**INFERENCE (medium):** at least three selection stages can affect evidence:
Bing retrieval/ranking, grounding-side chunk/result processing, and model-side
selection/synthesis. Public documentation does not allocate citation omissions
or relevance errors among those stages.

### 3.3 Response, query, and citation metadata

**FACT (high):** the Responses example returns assistant `output_text` with
`url_citation` annotations. Across language samples, documented annotation
fields include `url`, and in some samples `title`, `start_index`, and
`end_index`. The span indices anchor a citation to generated answer text, not to
an immutable source passage [S1].

**FACT (high):** Grounding with Bing Search also supplies a reference to the Bing
query/search-results page. Current documentation says website and Bing-query
URLs are available in response `arguments`; classic documentation located the
website URLs in message annotations and query URL in run-step details [S1][S7].
Both references must be retained and displayed in the exact form Microsoft
provides, near the output [S3].

**FACT (high):** unlike raw citations, the generated search query is visible to
developers. Web Search's MCP surface illustrates richer action metadata:
`action.type=search`, `query`, `queries[]`, a response ID, and URL-citation
annotations with title and answer offsets. That is evidence for a useful
contract pattern, but it is a different tool surface and must not be asserted as
the exact `bing_grounding` response schema [S6].

**INFERENCE (high):** answer-span anchors help presentation and claim-to-link
association, but do not prove that the cited page entails the claim. Missing are
source-passage text/offset/hash, fetch/discovery timestamp per hit, canonical
URL, document/capture ID, retrieval rank, citation-generation method, and index
snapshot. Reproducibility after page or index change is therefore weak.

**UNKNOWN:** the current docs are internally thin on the exact Bing-query
`arguments` JSON schema, whether all SDKs expose title and offsets uniformly,
how multiple generated queries map to individual citations, and whether query
metadata is persisted in new conversations exactly as classic run steps were.
These require schema-level contract tests under separately authorized access.

## 4. Tenant, resource, agent, and corpus controls

| Layer | Documented control | Assessment |
| --- | --- | --- |
| Subscription/resource group | Register/unregister `Microsoft.Bing`; create/delete Bing resources; Azure Policy can deny their creation | Strong provisioning kill switch, but disable procedure is destructive and governance-oriented [S1][S5]. |
| Foundry project | Project connection references the Bing resource | Separates secret/resource plumbing from agent definition [S1]. |
| RBAC | JIT Contributor for resource provider/resource/key operations; Foundry Project Manager for connection; Foundry User for routine agent execution | Good separation of provisioning and runtime roles [S1]. |
| Agent | Include or omit `bing_grounding`; choose compatible model; set instructions and search configuration | Configuration is agent-version scoped; model can decide use unless required [S1]. |
| Request | `tool_choice="required"` forces tool invocation | It does not appear to cap repeat calls within the run [S1]. |
| Corpus | General Bing web, or separate Custom Search configured domains/paths/pages | No neutral per-request allow/block domains on explicit general Bing tool [S1][S2]. |
| Locale/time | `market`, `set_lang`, `freshness`, `count` | Useful but limited; no exposed source type, rights, owner, safety, exact language, or geography filters [S1]. |
| Network | Works from network-secured Foundry, but Bing uses public egress and ignores VPN/private endpoint routing | Private networking does not contain the Bing data path [S1][S2]. |

**FACT (high):** general Web Search has a separate subscription-wide block
feature; explicit Bing resources can be disabled by deleting resources,
unregistering `Microsoft.Bing`, and applying Azure Policy to prevent recreation
[S1][S5][S6].

**RECOMMENDATION (high):** Curiosity should preserve control-plane separation
but add non-destructive runtime policy: caller allow/deny, per-tenant budgets,
per-agent tool grants, branch/tool-call ceilings, corpus/source policies, and an
emergency kill switch independent of deleting an index or adapter.

## 5. Freshness and evidence temporality

**FACT (high):** Microsoft markets “real-time” and “up-to-date” grounding, but
the concrete freshness contract is Bing-index-relative: Day/Week/Month mean
pages Bing **discovered** in those intervals. A specific date/range is also
accepted [S1][S4]. Troubleshooting explicitly says stale results depend on
Bing's indexing schedule, and recently changed Custom Search content may take
days to appear [S1][S6].

**INFERENCE (high):** “real-time” means query-time access to Bing's then-current
index, not live fetch, bounded recrawl latency, publication-date correctness, or
an immutable temporal snapshot.

**RECOMMENDATION (high):** Curiosity must distinguish `fetched_at`,
`first_seen_at`, `last_seen_at`, claimed `published_at`, substantive
`changed_at`, and index snapshot. A user freshness constraint must state which
clock it filters. Never label “discovered in last day” as “published today.”

## 6. Safety, privacy, legal, and trust boundary

### 6.1 Search content and model safety

**FACT (high):** the Bing tool page says not to summarize an entire page, not to
ask the model to fabricate citation links, and that the tool does not return raw
output. The broader Web Search documentation says to treat search results as
untrusted, sanitize downstream use, and avoid secrets or sensitive personal data
in prompts [S1][S6]. Foundry model outputs are filtered according to the content
filter on the deployed model [S10].

**FACT (high):** Foundry Prompt Shields can inspect user input and tool-response
intervention points for user and document attacks when configured. The cited
page presents this as configurable guardrail functionality; it does not state
that Grounding with Bing automatically enables it or expose Bing-specific
filter decisions [S11].

**UNKNOWN (material):** public Bing grounding docs do not specify SafeSearch
mode, malware filtering, per-result safety labels, prompt-injection detection
coverage, blocked-result counts, source reputation, or whether tool-returned
web content always passes a configured document shield before synthesis.

**INFERENCE (high):** hiding raw result content reduces direct application
exposure but does not eliminate indirect prompt injection: untrusted web text is
still processed by a model that may possess other tools. Output filtering is not
equivalent to evidence isolation or least privilege.

### 6.2 Data processing and privacy

**FACT (high):** Bing queries, parameters, and the resource key leave the Azure
compliance and geographic boundary. The Microsoft Products and Services DPA does
not apply. Grounding is a Microsoft-as-controller service; under the terms,
customer and Microsoft are independent GDPR controllers [S1][S3][S10].

**FACT (high):** the terms allow Microsoft to collect information including end
user IP address, requests, submission time, and returned results. They require a
prominent link labeled **Microsoft Privacy Statement** in the customer
solution's end-user terms. Bing Search Services Data and Output are not
“Customer Data” under the customer agreement [S3]. The Marketplace listing
also says Microsoft will use data sent to Grounding to improve Microsoft
products and services and assigns the customer responsibility for sufficient
consent when personal data is sent [S12].

**FACT (high):** Microsoft's product documentation says “no end user-specific
information” is included in the payload sent to Bing, but the generated query
can be based on the user's message and conversation context [S1].

**INFERENCE (high):** “no end user-specific information” describes an intended
payload field boundary, not a guarantee that query text is anonymous. A model
can encode a person's name, location, secret, or conversation fact into the
query. Query minimization and DLP remain customer responsibilities.

### 6.3 Output-use restrictions

**FACT (high):** enterprise terms grant a limited, revocable right to use the
service only through documented enterprise integrations and to display output
in an internet-search experience. They require exact references and prohibit,
among other things [S3]:

- use outside or separately from the integration;
- high-consequence use where failure could cause death, serious injury, or
  severe physical/environmental damage;
- reverse engineering and working around technical limitations;
- competing databases/services, redistribution/resale, or bypassing fees;
- using output to train, **evaluate**, or improve an AI model;
- general copying, caching, or storage beyond a narrow integrated-work-product
  allowance, including indexing links or using them for crawling/scraping;
- modification or omission of references and attribution.

**RECOMMENDATION (high):** do not ingest Grounding output, URLs, citations, or
queries into Curiosity's corpus, ranking labels, model evaluation, or crawler
frontier. Public functional documentation may inform an independently authored
neutral specification; the service output may not.

## 7. Limits, availability, and pricing

**FACT (high):** current list pricing is **US$14 per 1,000 transactions** for
both standard and Custom Grounding, with published maxima of **150 transactions
per second** and **1,000,000 transactions per day** [S4]. A transaction occurs
when model reasoning invokes the tool; multiple calls in one run are separately
counted [S1][S4]. Model inference and broader Foundry costs are additional [S2].

**FACT (high):** `count` is at most 50 per call, but it is not a cost multiplier
in the published transaction definition. The model may call again, so one user
request has no documented one-transaction guarantee [S1][S4].

**FACT (high):** availability depends jointly on Foundry region, network setup,
and model/tool compatibility; Microsoft publishes changing matrices and advises
checking the portal and current table [S13]. Foundry's general maximum of 128
registered tools per agent and model deployment rate limits also apply, but are
not Bing-specific [S13].

**UNKNOWN:** no Bing-specific timeout SLO, availability SLA, maximum generated
query length, retry/idempotency semantics, deterministic call ceiling per run,
per-tenant quota allocation, overage behavior, or latency percentile was found
in the reviewed current primary pages. List price and quotas may change.

**RECOMMENDATION (high):** an owned tool contract needs `max_tool_calls`, hard
deadline, maximum query/result/response bytes, retry budget, explicit partial
failure, cost-unit accounting, and cancellation. Never let model discretion be
the sole bound on repeat retrieval.

## 8. Architecture inferences and clean-room lessons

### 8.1 What can be inferred, not claimed as implementation fact

| Inference | Confidence | Basis |
| --- | --- | --- |
| Foundry is an orchestration/control boundary and Bing is a distinct retrieval/data-processing boundary. | High | Project connection and managed authorization; query/parameters/key cross boundary [S1]. |
| Retrieval output is injected into model context through a private service-to-model channel. | High | Model consumes results while developer cannot access raw output [S1]. |
| Answer citations are produced after model synthesis and attached to answer spans. | Medium | Output annotations and offsets are documented; exact attribution algorithm is not [S1]. |
| The resource key is a service credential/accounting handle, not an end-user credential. | High | Explicit billing/rate-limit statement [S1]. |
| Query formulation and evidence selection are probabilistic and model-dependent. | High | Model decides queries, repeat calls, and which output pieces to use [S1]. |
| Bing index/crawl state, not Foundry region, determines corpus freshness. | High | Index-relative freshness and public egress [S1][S6]. |

No inference is made about Bing ranking algorithms, crawler internals, index
size/coverage, embedding models, safety classifiers, or proprietary prompts.

### 8.2 Transferable lessons

**ADOPTED concepts:**

1. Separate provisioning identity from runtime caller identity and never expose
   provider credentials to the agent.
2. Treat tool invocation as an auditable, billable unit; expose query branches
   and every call, including repeats.
3. Return answer-span citations and visible query metadata, but strengthen them
   with immutable passage/capture provenance.
4. Make general-web and governed-corpus search explicit modes, not an ambiguous
   domain hint.
5. Provide tenant-level disable, project connection policy, agent grants, and
   request-level forcing—while adding stronger non-destructive runtime controls.
6. State freshness semantics precisely and expose locale controls separately
   from content-language filters.

**REJECTED patterns:**

1. Model-only answer output with no raw structured evidence available to the
   authorized research pipeline.
2. Opaque repeat tool calls without a caller-supplied aggregate ceiling.
3. Citation URLs without source passage/version identity.
4. A “private-network” deployment whose search path silently uses public egress.
5. A compliance model in which search queries leave the principal service's
   DPA/geo boundary.
6. Contract terms that prevent independent evaluation, durable evidence
   retention, crawling, or search-system replacement.

## 9. Curiosity implications and proposed neutral contract

**RECOMMENDATION (high):** retain Curiosity's existing bounded `web_search`
authority and use Microsoft only as a behavior study. The owned search response
must expose evidence rather than only a provider-generated answer.

Minimum provider-neutral additions learned or reinforced here:

- request: original query, explicit generated query branches, parent/branch ID,
  max results, **max calls**, deadline, byte/cost budget, locale, content
  language, market/geography, freshness clock/range, corpus policy, and caller
  policy reference;
- hit: document/capture/passage IDs, fetched and canonical URLs, title, anchored
  snippet/passage hash, first/fetched/published/changed times, source/owner
  cluster, retrieval channel, rank reason class, and untrusted marker;
- response: request and index-snapshot IDs, executed queries, per-call usage,
  policy filters, coverage/freshness warnings, partial failures, and schema
  version;
- answer adapter: answer text separated from evidence, answer-span citations
  mapped to passage IDs, supporting/contradicting/uncertain stance, and no
  authority to trigger actions;
- governance: researcher-only grant, tenant kill switch, per-agent/corpus
  policies, query minimization/DLP before search, result injection defenses,
  and complete call/stop audit without secret or raw-sensitive logging.

**Curiosity loop:** caller declares frame and budget; researcher creates a small
branch set; retrieval records each query and marginal evidence; synthesis occurs
over typed untrusted evidence; one post-synthesis curiosity pass scores remaining
in-frame gaps by relevance, value, novelty, and cost; stop on coverage,
saturation, policy block, or budget exhaustion. The search service never grants
itself follow-up authority.

## 10. Fact / inference / recommendation ledger

| ID | Type | Claim or decision | Confidence | Sources | Verdict |
| --- | --- | --- | --- | --- | --- |
| L1 | FACT | Grounding with Bing Search is GA on new Foundry Agents; explicit type is `bing_grounding`. | High | [S1][S2] | Context |
| L2 | FACT | General tool takes count/freshness/market/language; count defaults 5 and maxes 50. | High | [S1] | **ADAPTED** |
| L3 | FACT | Raw tool content is unavailable; output is a model answer with website and Bing-query references. | High | [S1][S3] | **REJECTED** retrieval contract |
| L4 | FACT | References must be retained/displayed exactly; output use, storage, evaluation, crawling, and competition are restricted. | High | [S3] | **REJECTED** foundation/benchmark |
| L5 | FACT | Bing data crosses Azure compliance/geo boundary and is outside the DPA. | High | [S1][S3][S10] | **REJECTED** for sensitive scopes |
| L6 | FACT | Pricing is $14/1K transactions; listed limits are 150 TPS and 1M/day. | High | [S4] | Planning evidence only |
| L7 | FACT | Tool calls, including repeats within a run, are the billing unit. | High | [S1][S4] | **ADAPTED** usage ledger |
| L8 | FACT | Classic agents retire 2027-03-31; new path uses conversations/responses. | High | [S7][S8] | **DEFERRED** migration concern only |
| L9 | FACT | Standalone Bing Web Search docs are retired; Grounding is integration-bound. | High | [S4][S9] | Lifecycle warning |
| L10 | INFERENCE | Product exposes answer synthesis, not reproducible search evidence. | High | L2-L4 | **REJECTED** pattern |
| L11 | INFERENCE | Query text can leak user/context facts despite no end-user identity field. | High | [S1][S3] | Mitigate with DLP/minimization |
| L12 | INFERENCE | Citation span-to-URL is insufficient for entailment and temporal reproducibility. | High | [S1] | **ADAPTED** with passage provenance |
| L13 | RECOMMENDATION | Build owned evidence retrieval; retain provider-neutral bounded agent ABI. | High | L3-L12 | **ADOPTED** |
| L14 | RECOMMENDATION | Do not call or ingest Grounding output for Curiosity evaluation/corpus. | High | [S3] | **ADOPTED** boundary |

## 11. Unknowns, validation checks, and negative results

### Material unknowns

1. Exact current JSON schema for Bing-query references in `arguments` and
   uniformity of `title`/span fields across SDKs.
2. Whether citation assignment is extractive, model-generated, or checked for
   entailment; no public precision/recall measurement was found.
3. Crawl/index coverage, update latency distributions, index snapshot/version,
   canonicalization, deduplication, and ranking feature classes.
4. Default or configurable SafeSearch, malware, spam, injection, and source
   trust controls specific to this tool.
5. Hard per-run repeat-call ceiling, query-length limit, timeout, SLA, retry,
   cancellation, and partial-failure contract.
6. Retention periods and human-review conditions specifically for Grounding
   query/output under the general Microsoft Privacy Statement.

### Checks required before any future product use

- legal/privacy review of the then-current TOU, display requirements,
  controller status, DPA exclusion, consent, and permitted use;
- current region/model/tool matrix and price/quotas;
- contract-only test using synthetic, non-sensitive prompts to capture schemas,
  repeated-call accounting, citation/query mapping, and errors;
- security review that proves web output is untrusted, action tools are isolated,
  prompt shields/filters are actually applied, and public egress is approved;
- stop immediately if proposed use includes corpus seeding, ranking/model
  evaluation, output caching outside the narrow allowance, or bypassing limits.

### Negative results retained

- No public primary source reviewed exposes raw ranked hits/chunks to developers.
- No public quality benchmark supports “more accurate,” complete, or fresher
  than alternatives; marketing language was not treated as comparative proof.
- No per-result fetch time, source passage, content hash, canonical/document ID,
  rank score/reason, index snapshot, or citation-entailment signal was found.
- No documented Grounding-specific safe-search parameter or result safety labels
  were found in the current explicit Bing tool contract.
- No guarantee that one user request equals one tool call was found; docs state
  repeat invocation can occur.
- No permission to use output for Curiosity benchmark/evaluation was found; the
  current terms expressly prohibit AI-model evaluation and competing databases.
- No evidence was found that standalone retired Bing Web Search API semantics or
  payloads are a supported compatibility contract for Grounding.

## 12. Bounded curiosity pass and stop decision

Scores are 1 (low) to 5 (high); cost is 1 (cheap) to 5 (expensive).

| Thread | Relevance | Value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Verify exact output-use/evaluation restrictions | 5 | 5 | 5 | 1 | **Pursued:** enterprise TOU materially changed the verdict [S3]. |
| Distinguish new Web Search, explicit Bing tool, Custom Search, and classic | 5 | 5 | 4 | 1 | **Pursued:** current overview/migration pages resolved naming and status [S2][S7][S8]. |
| Check “real-time” against concrete freshness semantics | 5 | 5 | 4 | 1 | **Pursued:** it is Bing discovery-time/index-relative [S1][S6]. |
| Live-call citation schema and repeat-call behavior | 4 | 4 | 4 | 5 | `CURIOSITY_NO_GO`: requires paid resource/credentials and terms review; caller prohibited calls. |
| Reverse engineer ranking/chunking from outputs | 2 | 2 | 4 | 5 | `CURIOSITY_NO_GO`: raw output is hidden, terms bar reverse engineering/evaluation, and it is unnecessary. |
| Resolve every region/model cell | 3 | 2 | 1 | 3 | `CURIOSITY_NO_GO`: volatile matrix; cite current source and require deployment-time check. |
| Infer exact retention from general privacy statement | 4 | 3 | 2 | 4 | `CURIOSITY_NO_GO`: product-specific period is undocumented; retain as unknown and require Microsoft/legal confirmation. |
| Assess production relevance/latency with synthetic suite | 3 | 4 | 3 | 5 | `CURIOSITY_NO_GO`: paid benchmark forbidden here and output-evaluation terms are restrictive. |

**Coverage:** current status, contract, Bing boundary, query/citation metadata,
tenant/agent controls, freshness, safety/privacy, limits/pricing, deprecations,
architecture inferences, clean-room lessons, and Curiosity implications are all
represented.  
**Saturation:** additional current Microsoft pages repeated the same integration,
data-boundary, and answer-only model without changing the decision.  
**Stop:** coverage and saturation reached; paid/live and prohibited threads were
not pursued.

## 13. Primary sources

All accessed 2026-08-17.

1. **[S1] Microsoft Learn, “Use Grounding with Bing Search tools with the
   agents API.”** https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/tools/bing-tools
   — canonical current setup, flow, request parameters, response/citation
   examples, controls, known issues, data path, and billing unit.
2. **[S2] Microsoft Learn, “Overview of web grounding capabilities in
   Foundry.”** https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/tools/web-overview
   — authoritative distinction among Web Search, Grounding with Bing Search,
   and Custom Search; GA/preview and model/resource boundaries.
3. **[S3] Microsoft Bing, enterprise Grounding TOU and Use and Display
   Requirements (last updated November 2025).**
   https://www.microsoft.com/en-us/bing/apis/grounding-legal-enterprise — use,
   display, privacy/controller, DPA, storage, training/evaluation, competition,
   reverse-engineering, and attribution restrictions.
4. **[S4] Microsoft Bing, Grounding with Bing product and pricing.**
   https://www.microsoft.com/en-us/bing/apis — current list price, TPS/day
   limits, integration-only output boundary, and transaction definition.
5. **[S5] Microsoft Learn, “Manage Grounding with Bing in Microsoft Foundry
   and Azure.”** https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/manage-grounding-with-bing
   — subscription/resource-group disable routes across Agent Service and Azure
   AI Search.
6. **[S6] Microsoft Learn, “Use web search tool in Foundry Agent Service.”**
   https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/tools/web-search
   — recommended newer surface, MCP query/citation metadata, security guidance,
   freshness limitations, and subscription block control.
7. **[S7] Microsoft Learn, “Grounding with Bing Search in Foundry Agent Service
   (classic).”** https://learn.microsoft.com/en-us/azure/foundry-classic/agents/how-to/tools-classic/bing-grounding
   — classic metadata location, eligibility, migration notice, and
   2027-03-31 retirement dependency.
8. **[S8] Microsoft Learn, “Migrate to the new Foundry Agent Service.”**
   https://learn.microsoft.com/en-us/azure/foundry/agents/how-to/migrate — new
   conversations/responses and tool-availability lifecycle.
9. **[S9] Microsoft Learn archive, “What is the Bing Web Search API?”**
   https://learn.microsoft.com/en-us/previous-versions/bing/search-apis/bing-web-search/overview
   — primary archived/retired standalone API record; used only to distinguish
   lifecycle, not to infer current Grounding payloads.
10. **[S10] Microsoft Learn, “Data, privacy, and security for Foundry Agent
    Service.”** https://learn.microsoft.com/en-us/azure/foundry/responsible-ai/agents/data-privacy-security
    — external-tool terms, Microsoft-as-controller status, external-data
    processing, and model-output filtering boundary.
11. **[S11] Microsoft Learn, “Prompt Shields in Microsoft Foundry.”**
    https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/content-filter-prompt-shields
    — configurable user/document attack controls at user-input and tool-response
    intervention points; not evidence of automatic Bing enablement.
12. **[S12] Microsoft Marketplace, Grounding with Bing Search.**
    https://marketplace.microsoft.com/en-us/product/Microsoft.BingGroundingSearch?tab=Overview
    — integration restriction and product-improvement/consent notice.
13. **[S13] Microsoft Learn, “Quotas and limits for Microsoft Foundry Agent
    Service.”** https://learn.microsoft.com/en-us/azure/foundry/agents/concepts/limits-quotas-regions
    — volatile region/model/tool compatibility, public-network regions, and
    general agent limits.
