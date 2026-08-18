# YaCy crawler: clean-room reverse-engineering dossier

**Research date / source access:** 2026-08-17  
**Decision:** what Curiosity should learn from YaCy's crawler, separately from
YaCy's P2P index distribution and distributed search.  
**Status:** research only; no YaCy code, index, data, service, or deployment was
imported.  
**Primary snapshot:** official `yacy/yacy_search_server` commit
[`7bc99cdceb09a60e1d5b201f172c172c14273922`](https://github.com/yacy/yacy_search_server/commit/7bc99cdceb09a60e1d5b201f172c172c14273922),
authored 2026-08-17. All line links below are pinned to that commit.

## Executive verdict

**ADAPT concepts, REJECT implementation reuse (high confidence).** YaCy is a
useful, unusually inspectable example of a crawler integrated with parsing,
indexing, and optional peer work sharing. Its strongest transferable ideas are:

- persisted host-partitioned frontier queues, depth ordering, and host-aware
  selection;
- explicit crawl profiles carried by handle with depth, URL/IP/content filters,
  recrawl age, per-domain caps, cache policy, and index policy;
- bounded loader concurrency and staged parse -> condense -> graph -> store
  queues; and
- resource-pressure pause/resume plus visible error and queue states.

Those are behavioral lessons, not a design to clone. Material parts should not
be carried into Curiosity unchanged:

1. YaCy's robots matcher does not implement RFC 9309 semantics: it records
   `Allow` rules but does not consult them during authorization, does not
   implement general `*` or `$` matching, can retain a cached policy without a
   freshness limit, and turns fetch failure into an artificial allow-all entry
   [S8-S10].
2. “Remote indexing” is a leaf-URL work handoff between peers, not a durable,
   provenance-preserving distributed frontier. A URL is popped from the
   origin's global queue into an in-memory delegated map; the worker later sends
   only a metadata receipt. No lease, visibility timeout, durable attempt ID, or
   lost-task recovery was found [S11-S15].
3. The P2P protocol defaults to `uncontrolled`, may fall back from HTTPS to
   HTTP, and the receipt handler does not verify that the returned URL hash is
   present in the delegated map before writing metadata [S13-S16]. This is not
   an acceptable Curiosity trust boundary.
4. Frontier deduplication is URL-hash based; content exact/fuzzy signatures are
   calculated only later for index uniqueness flags. It is not an immutable
   capture/version or canonical-cluster model [S6, S19].
5. YaCy is GPL-2.0-or-later overall, with some elements under LGPL and
   file-specific notices. Copying, translating, or structurally cloning its
   source into a strictly project-owned core is rejected absent a separately
   approved licensing decision [S2, S24].

**Curiosity recommendation:** retain a local, trusted, provider-neutral crawl
plane. Adopt host-keyed scheduling and staged bounded queues from public
behavioral lessons; implement robots directly from RFC 9309; make every fetch
produce an immutable capture and policy decision; and defer any distributed
crawl execution until a leased, mutually authenticated, provenance-complete
protocol has been designed and threat-modeled.

## 1. Frame, method, and boundaries

### 1.1 Bounded questions

1. What constitutes a YaCy crawl job and frontier, and how are jobs scheduled?
2. What, exactly, is distributed to peers when remote indexing is enabled?
3. Where are robots, politeness, filtering, parsing, deduplication, and index
   handoff enforced?
4. What are the trust boundaries, failure semantics, and operational controls?
5. Which ideas are adoptable, adaptable, rejected, or deferred for Curiosity
   under a clean-room constraint?

**Out of frame:** YaCy query federation, DHT term-index placement, ranking and
search UI except where needed to distinguish them from crawler behavior. No
live peer was joined, no crawl was launched, no binaries were run, and no
quality/performance benchmark was attempted.

### 1.2 Method and claim labels

The official repository was shallow-cloned outside the workspace, pinned to the
commit above, and inspected by symbol/path. Official YaCy README and wiki pages
were used as first-party descriptions, but current pinned source controls when
the older wiki and implementation differ. RFC 9309 is the normative comparison
for robots behavior. Search snippets were leads only.

- **FACT** — directly visible in a cited official source.
- **INFERENCE** — bounded interpretation of those facts, not runtime-measured.
- **RECOMMENDATION** — a Curiosity design choice.
- Confidence is **high**, **medium**, or **low**.

Clean-room controls: no source text is reproduced; names are used only as
locators; behavior is summarized; implementation is outside this report and
must not use this checkout as a code source.

## 2. Crawler boundary: not the P2P search/index

**FACT (high):** YaCy packages a crawler, local search index, web application,
and optional P2P index exchange in one server. The project itself says peers
exchange search indexes and that users can opt out and search only the local
index [S2]. Therefore “YaCy crawler,” “remote crawl,” “DHT index distribution,”
and “distributed query” are distinct mechanisms even though `Switchboard`
wires them into one process.

The crawler path reconstructed here is:

```text
crawl/API start
  -> persisted CrawlProfile + seed Request
  -> CrawlStacker admission queue
     (scheme/domain/IP/blacklist/filter/URL-hash/recrawl checks)
  -> host-partitioned persisted frontier
     LOCAL core | GLOBAL leaf handoff | REMOTE received work | NOLOAD metadata
  -> host/depth/politeness selection
  -> bounded loader workers + final robots decision
  -> protocol loader / cache
  -> indexingDocumentProcessor: parse + discover links back to CrawlStacker
  -> indexingCondensementProcessor: text/signatures/index policy
  -> web-structure analysis
  -> single-concurrency storage processor -> local index
  -> optional remote receipt or later, separate P2P index distribution
```

This flow is supported by the queue definitions [S5], stack routing [S6], load
workers [S7], and workflow wiring [S18].

## 3. Crawl jobs and frontier scheduling

### 3.1 Job identity and policy

**FACT (high):** a `CrawlProfile` is the job-policy record. Its fields include
depth, per-domain page maximum, query-URL handling, frame following, HTML robots
`noindex`/`nofollow` switches, URL/IP/country crawl filters, independent
URL/content/media-type index filters, canonical handling, recrawl cutoff,
cache strategy, agent identity, text/media indexing, and remote indexing [S3].
The handle is a short digest over selected profile attributes, not an opaque
random job/attempt ID [S3].

**FACT (high):** active and passive profiles are persisted in heap files and
restored on startup. Frontier entries carry a profile handle; a passive profile
needed by queued work is moved active again [S4].

**INFERENCE (high):** YaCy has durable job policy and durable queued requests,
but not a first-class execution ledger. A profile handle identifies policy; it
does not by itself provide immutable job version, enqueue event, attempt,
policy-decision, lease, or capture lineage.

### 3.2 Admission and frontier classes

**FACT (high):** `CrawlStacker` is a bounded asynchronous pre-frontier queue.
It rejects unsupported protocols, disallowed network domains, crawler-blacklist
entries, URL/IP/country filter misses, session-like/query and POST URLs when the
profile disallows them, duplicate URL hashes, per-domain quota excess, and
indexed URLs newer than the recrawl cutoff [S6]. Rejections other than duplicate
occurrences enter the error store.

**FACT (high):** accepted work is routed to four logical stacks [S5-S6]:

| Stack | Meaning in source | Important boundary |
| --- | --- | --- |
| `LOCAL` | normal local/core fetch work | includes local intermediate crawl depths |
| `GLOBAL` | remotely offerable leaf work | only when remote indexing is enabled, the request is exactly at target depth, and the origin is senior/principal |
| `REMOTE` | URLs accepted from another peer | initialized on demand and fetched by this peer |
| `NOLOAD` | index URL metadata without fetching | for unsupported extensions when profile permits metadata-only indexing |

The stack enum names are potentially misleading: `GLOBAL` is not a global
frontier and `REMOTE` is not a remote database. Both are local persisted host
queues with special producers/consumers.

### 3.3 Host and depth scheduling

**FACT (high):** each logical stack is a `HostBalancer` backed by per-host
`HostQueue` storage. Queues are reopened from disk after restart. Within a host,
the lowest crawl depth is popped first. Across hosts, the balancer estimates
remaining delay, favors low-delay hosts, and among similarly ready hosts favors
larger queues; it rotates/removes selected host hashes from a working set [S5,
S7].

**FACT (high):** a process-wide static URL-hash/depth cache is shared by
`HostBalancer` instances. Push rejects a hash already seen in any balancer,
which suppresses duplicate queued URLs across the logical stacks [S7]. The
separate `CrawlQueues.exists()` check for queued frontier entries is commented
out because it reportedly broke SMB crawling, but active workers and delegated
URLs are checked; actual queue-level dedup therefore resides primarily in the
balancer [S7].

**INFERENCE (medium):** scheduling approximates host fairness and breadth while
preserving click-depth order per host, but it is not a strict due-time priority
queue. Randomized selection, fuzzy delay buckets, queue-size preference, and
shared static state make exact replay and scheduling explanations difficult.

### 3.4 Backpressure and recrawl

**FACT (high):** loader concurrency and its blocking worker queue have the same
configured maximum (default ten in this constructor). Dequeue pauses when there
is no worker capacity or `onlineCaution()` reports pressure [S7]. Remote work is
not pulled while local crawl work exists, when the received-work stack exceeds
200, or when the peer/resource checks fail [S7].

**FACT (high):** recrawl admission compares the profile cutoff with the index's
URL load time. A separate autocrawl job queries the local Solr index for old
documents grouped by host and creates shallow/deep seed requests [S6-S7].

**INFERENCE (high):** freshness is index-date driven, not an observed-change
model. No per-URL change probability, ETag-driven scheduler, immutable version
graph, or exploration/exploitation budget was found in this path.

## 4. Peer distribution: the exact remote-crawl protocol

### 4.1 What is delegated

**FACT (high):** remote indexing is restricted in `CrawlStacker` to URLs at the
profile's target depth. Intermediate depths continue locally; qualifying leaf
requests go to `GLOBAL` [S6]. This agrees broadly with YaCy's official wiki,
which says peers act as “remote indexers,” only senior/principal peers can
initiate or receive, and results needed locally should not use the option [S25].

**FACT (high):** a receiving peer advertises willingness and available URL
count in its peer seed. A worker peer asks one provider for up to 60 URLs/10 s,
parses the returned RSS, applies its network-domain acceptance check, and queues
each URL under its fixed default remote profile at depth zero [S11-S13]. It does
not receive the origin's full crawl profile or an executable continuation.

**INFERENCE (high):** this is distributed leaf fetching/indexing, not
distributed traversal. The origin determines crawl scope before handoff; the
worker applies its own default remote policy. Policy equivalence between origin
and worker is not established.

### 4.2 Handoff and receipt lifecycle

1. The provider's authenticated `/yacy/urls` handler **pops** a URL from the
   `GLOBAL` queue, adds URL hash -> URL to `delegatedURL`, and returns URL,
   referrer, description, date, and hash in an RSS-shaped response [S12].
2. The worker fetches, parses, and stores the document in its own index through
   the ordinary local pipeline [S7, S18-S20].
3. After storage, if the event is a global crawl, the worker asynchronously
   posts a receipt containing a serialized URL metadata node [S14].
4. On `fill`, the origin writes that metadata into local full text metadata,
   records a result event, and removes the delegated hash [S15]. The handler
   does not transfer raw response bytes, extracted full text as a capture,
   parser version, robots decision, or content hash.

**FACT (high):** `delegatedURL` is only a `ConcurrentHashMap`; it is cleared on
close, network relocation, explicit clear, or wholesale when over 1,000 entries.
No age, attempt, lease expiry, or requeue operation appears among its references
[S11, S17].

**INFERENCE (high):** delivery is effectively destructive handoff with a
best-effort receipt, not at-least-once leased work. Provider crash after pop,
worker loss, receipt loss, or map cleanup can orphan a URL. A late receipt can
still be accepted, because receipt acceptance tests only whether the map object
is enabled—not whether it contains that URL [S15].

### 4.3 Separation from P2P index distribution

**FACT (high):** the crawl receipt inserts only metadata at the initiator. The
worker's complete local index record remains on the worker. YaCy's separate DHT
transfer/search mechanisms can later expose or distribute index information,
but those are outside this crawler handoff [S2, S14-S15].

**RECOMMENDATION (high):** do not describe YaCy remote crawling as a shared
global frontier or a way to build one authoritative corpus. For Curiosity,
distributed workers must return immutable capture references and derivation
manifests to an authoritative document plane before indexing can succeed.

## 5. Robots and politeness

### 5.1 What YaCy does

**FACT (high):** first insertion of a host queue asynchronously ensures a
robots record exists. The loader repeats the robots decision immediately before
fetch and records a final robots-rule failure when disallowed [S7-S9]. This
double placement reduces—but does not eliminate—the chance of fetching before a
policy decision is available.

**FACT (high):** politeness combines:

- the selected agent's configured minimum delta;
- a “flux” increment as a host is visited repeatedly;
- a fraction of observed average response latency;
- an extra delay when too many same-host loads are active; and
- parsed `Crawl-delay`, capped at 10 seconds [S9-S10].

The host balancer tries to choose a ready host first; `HostQueue.pop()` sleeps as
a final safety net and updates host selection time [S7, S10]. `Crawl-delay` is
not part of RFC 9309, so supporting it is an extension, but silently truncating
a publisher's larger value should not be copied.

### 5.2 Normative gap analysis

RFC 9309 requires most-specific allow/disallow matching, `Allow` preference on
equivalent rules, `*` and `$`, complete disallow while robots is unreachable,
and says cached robots generally should not be used for more than 24 hours
[S1]. Current YaCy source differs materially:

| Finding | Evidence | Classification |
| --- | --- | --- |
| `Allow` paths are parsed and stored, but `isDisallowed()` loops only over deny prefixes. | [S8-S9] | **FACT (high):** RFC semantics not implemented. |
| Only a trailing `*` is stripped; the matcher is plain `startsWith`; `$` and interior `*` have no specified handling. | [S8-S9] | **FACT (high):** RFC special matching absent. |
| Robots freshness tests are commented out; an existing record is returned without age enforcement. | [S9] | **FACT (high):** potentially indefinite cache; RFC “SHOULD NOT” gap. |
| A null/failed response creates an empty allow-all record. HTTP 401/403 instead creates deny `/`. | [S9] | **FACT (high):** conservative for those two statuses, but network/5xx failure is contrary to RFC complete-disallow behavior. |
| Parser reads the full returned byte array without an explicit RFC 9309 parser-size guard visible in this path. | [S8-S9] | **INFERENCE (medium):** the generic HTTP loader may impose a broader response limit, but RFC's robots-specific >=500 KiB bounded parser behavior was not established. |

**RECOMMENDATION (high):** reject YaCy robots behavior as a compatibility
oracle. Curiosity should implement and test RFC 9309 from the normative text,
store raw robots capture + parsed policy + decision ID, cache no longer than the
standard permits except its unreachable exception, and treat nonstandard
`Crawl-delay` under an explicit conservative extension policy.

## 6. Fetch, parse, URL dedup, and index handoff

### 6.1 Fetch

**FACT (high):** the HTTP loader sets a configured socket timeout (default 30 s),
manually handles redirects, checks the crawler blacklist again, uses a selected
user agent, applies a maximum body size (default constant 10 MiB in this loader),
and accepts ordinary crawl bodies only for status 200 or 203 [S21]. Manual
redirect handling is intended to avoid duplicate indexing. Custom crawl-profile
redirects are put back through `CrawlStacker`; other loader contexts recurse
with a bounded redirect counter [S21].

**FACT (high):** accepted-domain checks distinguish local/global addresses and
can enforce a configured domain list. The startup comments explicitly identify
remote-page links to localhost as an attack scenario; intranet/all-IP modes can
intentionally relax that boundary [S18, S23].

**INFERENCE (medium):** these are useful SSRF mitigations, but they are not a
complete modern egress gate. No independently recorded DNS answer/pin and no
uniform redirect-hop policy decision were found in the examined crawl path.
Network-mode configuration can also deliberately authorize local targets.

### 6.2 Parsing and link expansion

**FACT (high):** fetched bytes enter a staged workflow. `TextParser` chooses a
MIME/parser implementation (or a generic URL-only parser when allowed), returns
one or more `Document` objects, and parsing failures enter the error index.
Parsed document source URLs are rechecked against crawl acceptance [S18-S19].

**FACT (high):** links are extracted from surviving documents. HTML
`nofollow` is obeyed only when that profile switch is enabled; media links may
also be enqueued. Each accepted hyperlink returns asynchronously to
`CrawlStacker` at depth +1, while a canonical marker stays at the same depth
[S19]. The crawl path is static fetch plus parsers; no browser/JavaScript render
lane was found in the inspected scheduler/loader/index workflow.

**FACT (high):** parsers run in the YaCy server process and the parse stage uses
CPU-scaled worker threads [S18-S19].

**INFERENCE (high):** a malformed document/parser exploit shares the search
server's process and resources. A 10 MiB compressed or container body can also
expand during parser-specific processing; this report did not establish a
universal decompressed-byte/ratio limit. Curiosity should isolate parsers and
enforce input, expansion, link, time, and memory budgets independently.

### 6.3 Three distinct “dedup” layers

1. **URL frontier dedup — FACT (high):** normalized URL hashes are suppressed
   across host balancers, active work, recent index load time, and delegated
   work [S6-S7]. This is identity-by-URL, not content identity.
2. **Canonical policy — FACT (high):** canonical links are crawled at the same
   depth; a profile may refuse to index a document whose declared canonical URL
   differs from source [S3, S19]. The publisher hint is therefore either a
   traversal/index policy, not a durable system canonical cluster.
3. **Content uniqueness — FACT (high):** condensation calculates exact and
   fuzzy 64-bit text signatures. Index fields initially mark them unique;
   postprocessing later updates uniqueness/copy counts [S19, S22]. Both copies
   can still be indexed; these fields support search-time duplicate handling.

**INFERENCE (high):** YaCy does not provide Curiosity's required chain of
custody: raw-byte hash -> normalized-content hash -> near-duplicate cluster ->
publisher canonical evidence -> immutable document/version IDs. URL-hash
suppression can also hide meaningful changed versions unless recrawl policy
admits them.

### 6.4 Index handoff

**FACT (high):** `toIndexer()` checks crawl/proxy index policy, parser support,
an `X-YACY-Index-Control` response header, and network-domain acceptance before
enqueue [S20]. The staged pipeline then:

1. parses and emits discovered links;
2. applies URL/content/MIME/canonical/meta-robots indexing policy and computes
   text structure/signatures;
3. updates the web-structure graph; and
4. serially stores the local index document [S18-S20].

**INFERENCE (high):** crawler and index are coupled through in-process mutable
objects and queues. The handoff is not an append-only capture event with schema,
extractor version, content hash, replay manifest, and independently retryable
consumer. That coupling is convenient for one-node YaCy but unsuitable as
Curiosity's provider-neutral crawl/document contract.

## 7. Trust and security assessment

### 7.1 Web input

**FACT (high):** URL/domain filters, local-address mode checks, crawler and DHT
blacklists, body limits, redirect limits, robots, media/parser support checks,
HTML robots switches, and an error store provide several defensive layers
[S3, S6-S10, S19-S21, S23].

**INFERENCE (high):** fetched HTML, metadata, links, titles, and receipts remain
untrusted external data, but the crawler/index contract does not carry an
explicit trust label. Curiosity must never expose active HTML or permit crawled
text to expand agent authority; parser output should be typed evidence with
source/capture lineage and sanitization status.

### 7.2 Peer protocol

**FACT (high):** `Protocol.authentifyRequest()` first matches a network name,
then defaults `network.unit.protocol.control` to `uncontrolled`, which accepts
the request. The optional controlled method is a shared-secret
`MD5(salt + peerHash + magic)` comparison [S16]. Remote URL and receipt clients
prefer HTTPS when configured but retry over HTTP if HTTPS fails [S13-S14].

**FACT (high):** the receipt endpoint verifies network protocol authentication,
target peer hash, optional Robinson-cluster membership, URL parse/domain, and
DHT blacklist. On `fill`, however, it writes received metadata whenever
`delegatedURL` is enabled; it does not first assert
`delegatedURL.containsKey(receivedHash)` or bind the receipt to an issued
attempt [S15]. `lurlEntry` uses reversible salt-based encoding, not an integrity
signature, in the examined call [S14-S16].

**INFERENCE (high):** in default uncontrolled mode, a network-name-knowing
caller can reach protocol handlers; even in controlled mode, identity,
authorization, replay resistance, payload integrity, and transport downgrade
properties are below the bar for an authoritative corpus. A forged or stale
metadata receipt is an index-poisoning risk.

**RECOMMENDATION (high):** reject this P2P trust model. If Curiosity later uses
remote workers, require mutually authenticated workers, no plaintext fallback,
signed/versioned task envelopes, exact corpus-policy version, URL/capture
binding, nonce/expiry, attempt lease, idempotent completion, content-addressed
artifacts, independent validation, and revocation/audit.

### 7.3 Administrative surface

**FACT (high):** the official README says administration is on the same web
server, some pages can be available without password from localhost, and the
documented default credentials are `admin` / `yacy`, with an instruction to
change them [S2].

**RECOMMENDATION (high):** never carry that deployment posture into Curiosity.
Crawler control, data plane, query plane, and agent adapter need separate
authentication/authorization and network boundaries; no default credentials or
ambient localhost trust.

## 8. Failure semantics and operations

### 8.1 What is bounded or recoverable

- **Persisted frontier/profile — FACT (high):** host queues and crawl profiles
  reopen from disk [S4-S5, S7].
- **Bounded concurrency — FACT (high):** pre-frontier, loader, parse,
  condensation, analysis, and storage stages have explicit queue/concurrency
  settings [S6-S7, S18].
- **Pause and monitoring — FACT (high):** status exposes crawler traffic,
  loader activity/max, local/global/remote/no-load queue sizes, states, and
  profile counts [S27]. Operators can pause/resume local and remote-triggered
  crawl jobs.
- **Resource circuit breaker — FACT (high):** low disk or memory pauses local
  and remote crawls and can disable index receive; recovery resumes them. Under
  exhausted disk, cleanup can clear HTTP cache, robots DB, and—when large—the
  crawl queues [S26].
- **Errors — FACT (high):** robots, load, parse, filter, redirect, status, and
  index-policy failures are categorized in an error index [S6-S7, S19-S21].

### 8.2 Material failure gaps

| Failure | Observed behavior | Curiosity implication |
| --- | --- | --- |
| HTTP 4xx/5xx/network failure | recorded as an error; the crawl-worker path does not requeue it. `TEMPORARY_NETWORK_FAILURE` is a category, not an observed retry scheduler. Redirect recursion is the main bounded retry in this loader [S7, S21]. | Add explicit retry policy by status/error, `Retry-After`, exponential backoff, ceilings, and terminal reason. |
| Provider pops remote task then loses state | delegated map is volatile and no reclaim path was found [S12, S17]. | Use durable leased queue with visibility timeout and attempt reconciliation. |
| Disk exhaustion | may delete robots DB and entire large crawl queues [S26]. | Never silently trade policy/provenance or frontier durability for space; stop admission and preserve auditable tombstones. |
| Profile disappears/corrupts | queue entries can be skipped/rejected for missing profile; source logs some queue-init corruption and deletes an unusable host queue [S4, S6-S7]. | Version and retain policy with every task; quarantine rather than delete corrupt state. |
| Parse stage exception | broad exception can collapse an entry to null; details are not always preserved at the outer stage [S19]. | Typed stage failures, artifact quarantine, reproducible parser/version trace. |
| Shutdown | host frontier closes cleanly, loader workers receive poison items; the stacker waits up to roughly ten seconds then clears remaining pre-frontier work [S6-S7]. | Make every accepted discovery durable before acknowledgment. |
| Index lag/backpressure | staged queues bound work, but crawler completion and index visibility are coupled to in-process queues [S18]. | Measure capture-to-document and document-to-index lag separately; retry from immutable events. |

**INFERENCE (high):** YaCy favors continued single-node operation and
self-cleanup over strict losslessness. That is reasonable for a personal P2P
search peer, but Curiosity's cited evidence requires deterministic lineage,
replay, and deletion propagation.

## 9. Curiosity implications and verdict ledger

| YaCy lesson / candidate | Verdict | Confidence | Rationale and required adaptation |
| --- | --- | --- | --- |
| Host-keyed persisted frontier with depth ordering | **ADOPTED concept** | High | Strong politeness and restart boundary. Use authority/policy key, explicit due time, priority, and deterministic tie-break instead of cloning implementation. |
| Crawl profile as explicit job policy | **ADOPTED concept** | High | Version an immutable policy ID; separate discovery, fetch, extraction, indexing, and retention policies. |
| Bounded staged queues and serial storage choke point | **ADAPTED** | High | Preserve backpressure, but connect stages with durable typed events and idempotent consumers. |
| Latency-aware host politeness | **ADAPTED** | High | Combine RFC decision, per-authority concurrency, minimum delay, measured latency, 429/5xx backoff, and complaint kill switch. Do not cap publisher preference silently. |
| YaCy robots parser/matcher/cache | **REJECTED** | High | Material RFC 9309 gaps; implement from standard and conformance fixtures. |
| URL-hash frontier dedup | **ADAPTED** | High | Retain queued/in-flight URL uniqueness, but add capture/version and exact/near-content identity layers. |
| Exact/fuzzy index signatures | **ADAPTED as evaluation lesson** | Medium | Useful duplicate signals, not authoritative deletion or canonicalization. Choose algorithms independently from papers/standards and retain collision evidence. |
| Static fetch first | **ADOPTED** | High | No render lane in pilot. Add isolated browser lane only after measured incremental value. |
| In-process broad parser suite | **REJECTED boundary** | High | Use sandboxed, quota-bound extraction workers and immutable input captures. |
| `NOLOAD` URL-metadata indexing | **REJECTED for normal evidence** | High | A URL alone is not fetched evidence. May exist only as clearly labeled discovery candidate, never a citable document. |
| Peer leaf work handoff | **DEFERRED / redesigned** | High | Pilot does not need it. Later use leases, mTLS, content-addressed capture return, policy binding, and reconciliation. |
| P2P default-uncontrolled/shared-MD5 auth and HTTP fallback | **REJECTED** | High | Fails authoritative-corpus trust requirements. |
| Remote receipt as local metadata | **REJECTED** | High | Missing task binding, capture, parser/policy provenance, and durable retry. |
| Automatic destructive cleanup under disk pressure | **REJECTED** | High | Stop safely; never erase robots/frontier lineage to remain available. |
| YaCy source as Curiosity dependency or copied design | **REJECTED under strict ownership** | High | GPL-2.0-or-later and mixed/file-specific obligations; separate review could choose GPL deployment, but it would no longer be a wholly owned core. |
| YaCy as an external black-box benchmark on authorized fixtures | **DEFERRED** | Medium | Potentially useful for crawl coverage and extraction comparison after fixture/license and execution isolation review. |

### Recommended provider-neutral crawl handoff

YaCy demonstrates why Curiosity should not pass mutable `Response`/`Document`
objects across its long-term boundary. The minimum conceptual event is:

```text
FetchCompleted
  task_id / attempt_id / policy_version / robots_decision_id
  requested_url / resolved_url / redirect_chain / authority_key
  fetched_at / status / headers_digest / body_digest / capture_id
  byte_count / media_type / transport_security / failure-or-success
  producer_identity / schema_version / trust=untrusted-external
```

Extraction then emits a separate versioned record with extractor ID, canonical
evidence, links, text/passages, language, exact/near-duplicate signals, safety
signals, and the immutable capture ID. Indexing consumes only accepted document
versions and returns a snapshot/manifest ID. This is a recommendation, not code.

## 10. Fact / inference / recommendation ledger

| ID | Type | Claim | Confidence | Sources |
| --- | --- | --- | --- | --- |
| F1 | FACT | Profiles and host frontiers persist across restart. | High | [S4-S5, S7] |
| F2 | FACT | Frontier stacks are local/core, globally offerable leaf, received remote, and no-load metadata. | High | [S5-S6] |
| F3 | FACT | Host selection combines depth, host readiness, latency/publisher delay, and queue size. | High | [S7, S10] |
| F4 | FACT | Remote indexing delegates target-depth URLs, not the origin's full profile or traversal. | High | [S6, S11-S13] |
| F5 | FACT | Completion sends metadata, not an immutable raw capture/derivation manifest. | High | [S14-S15] |
| F6 | FACT | YaCy robots authorization ignores stored `Allow` paths and lacks RFC wildcard/end-anchor behavior. | High | [S8-S9, S1] |
| F7 | FACT | Existing robots records have no active age refresh check in this snapshot. | High | [S9] |
| F8 | FACT | Content duplicate signatures are index/postprocess signals, separate from URL frontier dedup. | High | [S6-S7, S19, S22] |
| F9 | FACT | P2P protocol authentication defaults uncontrolled and supports optional shared-secret salted MD5. | High | [S16] |
| F10 | FACT | Resource pressure can pause crawls and exhausted disk cleanup can clear robots/frontier data. | High | [S26] |
| I1 | INFERENCE | Remote crawl delivery can lose or orphan work and is not lease-based at-least-once processing. | High | [S11-S12, S15, S17] |
| I2 | INFERENCE | Receipt handling permits stale/unsolicited metadata acceptance whenever remote queues are enabled. | High | [S15-S16] |
| I3 | INFERENCE | Crawl-to-index coupling lacks sufficient immutable provenance for stable Curiosity citations. | High | [S18-S20] |
| I4 | INFERENCE | In-process parsing creates a shared-fate parser/resource security boundary. | High | [S18-S19] |
| R1 | RECOMMENDATION | Implement robots from RFC 9309, not from YaCy behavior. | High | [S1, S8-S10] |
| R2 | RECOMMENDATION | Adopt host-partitioned due-time scheduling with durable task/policy/attempt identity. | High | [S3-S7] |
| R3 | RECOMMENDATION | Defer remote execution; later require leases, mTLS, signed envelopes, immutable capture return, and reconciliation. | High | [S11-S17] |
| R4 | RECOMMENDATION | Keep static fetching first and parsers isolated from agent/query services. | High | [S18-S21] |

## 11. Unknowns, negative results, and checks

### Unknowns

- **UNKNOWN:** which network/authentication, crawler-agent, robots, and cleanup
  settings are used by public YaCy peers in practice. Source defaults are not a
  deployment census.
- **UNKNOWN:** loss/duplication rates under crash, restart, network partition,
  large frontier, or receipt delay. No live fault injection was authorized.
- **UNKNOWN:** universal decompression/recursive-container limits across every
  parser. A bounded HTTP body does not establish bounded expanded work.
- **UNKNOWN:** exact conformance of URL normalization/hash equivalence for all
  schemes and internationalized URLs; it was not exhaustively characterized.
- **UNKNOWN:** whether an out-of-tree operator layer reconciles delegated URLs.
  None exists in the official source references inspected.
- **UNKNOWN:** legal effect of combining or communicating with YaCy in a future
  Curiosity deployment. This report is not legal advice; exact files,
  dependencies, linkage, modification, distribution, and service model require
  counsel/reviewer analysis.

### Negative results retained

- No durable lease/visibility timeout/attempt ID/requeue path was found for
  remotely delegated crawl URLs; searches of all `delegatedURL` references found
  only create, inspect, remove, clear, and receipt operations [S11, S12, S15,
  S17].
- No robots-specific conformance tests were found under the official repository
  test tree at this snapshot. Host queue/balancer tests exist, but this is not
  evidence of robots correctness.
- No browser/JavaScript rendering stage was found in the crawler scheduler,
  HTTP loader, parser, or indexing workflow inspected.
- No immutable WARC/capture-object handoff was found in the live crawl path.
  YaCy can import WARC files elsewhere; import support is not crawler capture.
- No evidence was found that a remote crawl receipt returns the fetched body,
  parser version, robots decision, or full derivation trace.
- No evidence was found that the receipt endpoint binds `fill` to a currently
  outstanding delegated hash before metadata insertion.
- No claim is made that YaCy's crawler is generally insecure or unsuitable for
  its own personal/P2P purpose; findings are scoped to Curiosity's stricter
  authoritative evidence requirements.

### Reproducibility and checks performed

1. Read repository `AGENTS.md`; changed only this report.
2. Cloned the official repository into an approved temporary directory and
   recorded `git rev-parse HEAD` = `7bc99cd...` plus commit time/message.
3. Traced constructors and references from `Switchboard` to `CrawlStacker`,
   `CrawlQueues`, `NoticedURL`, `HostBalancer`, `HostQueue`, robots, loaders,
   parsers, index processors, peer URL handoff, and receipt endpoint.
4. Searched all official-source references to `delegatedURL`, remote-crawl
   endpoints, retry/error categories, robots parser/matcher, and content
   signature fields; negative findings above are bounded to that search.
5. Compared robots behavior line-by-line with RFC 9309 sections 2.2-2.5.
6. Read the official README license statement and repository license/notice
   files. No third-party source was copied to this workspace.
7. Did not build or run YaCy; therefore compilation, runtime, scale, and
   deployment claims are intentionally absent.

## 12. Bounded curiosity pass and stop decision

Scores are 1 (low) to 5 (high); cost is 1 (cheap) to 5 (expensive).

| Thread | Relevance | Value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Compare robots matcher/cache with RFC 9309, not project comments | 5 | 5 | 5 | 2 | **Pursued:** found material allow/wildcard/failure/cache gaps [S1, S8-S10]. |
| Trace every delegated-URL reference for recovery and receipt binding | 5 | 5 | 5 | 2 | **Pursued:** no lease/reclaim/binding path found [S11-S17]. |
| Distinguish frontier dedup from content dedup | 5 | 4 | 4 | 2 | **Pursued:** URL hash gates crawl; exact/fuzzy signatures are later index flags [S6-S7, S19, S22]. |
| Run a public YaCy peer crawl and inject failures | 4 | 4 | 3 | 5 | `CURIOSITY_NO_GO`: outside authorization; would contact websites/peers and create runtime data. |
| Audit every bundled parser and dependency CVE | 3 | 5 | 4 | 5 | `CURIOSITY_NO_GO`: separate security audit; does not change isolate-parser recommendation. |
| Determine GPL obligations for every possible deployment topology | 5 | 5 | 3 | 5 | `CURIOSITY_NO_GO`: legal conclusion requires counsel and a concrete integration design. |
| Reverse-engineer DHT ranking/search distribution | 1 | 2 | 3 | 5 | `CURIOSITY_NO_GO`: explicitly out of crawler frame. |
| Benchmark YaCy crawl throughput | 2 | 3 | 2 | 5 | `CURIOSITY_NO_GO`: no authorized corpus/hardware baseline; architecture decision does not depend on vendor throughput. |

**Coverage:** crawl job/frontier, peer distribution, robots/politeness,
fetch/parse/dedup, index handoff, trust/security, failure/operations,
license/clean-room, and Curiosity verdicts are covered.  
**Saturation:** additional source searches repeated the same queue, profile,
loader, receipt, and index paths without revealing a second durable remote-work
mechanism.  
**Stop:** coverage and code-reference saturation reached. Runtime behavior,
parser-wide security, and legal conclusions remain deliberately deferred.

## 13. Primary sources

All sources accessed 2026-08-17.

1. **[S1] IETF, RFC 9309 — Robots Exclusion Protocol.**
   https://www.rfc-editor.org/rfc/rfc9309 — normative group/rule matching,
   special characters, access-result behavior, caching, and limits.
2. **[S2] YaCy official repository README, pinned.**
   https://github.com/yacy/yacy_search_server/blob/7bc99cdceb09a60e1d5b201f172c172c14273922/README.md#L20-L46 and
   https://github.com/yacy/yacy_search_server/blob/7bc99cdceb09a60e1d5b201f172c172c14273922/README.md#L73-L83 and
   https://github.com/yacy/yacy_search_server/blob/7bc99cdceb09a60e1d5b201f172c172c14273922/README.md#L148-L151
   — component/P2P boundary, administration posture, and project license statement.
3. **[S3] `CrawlProfile.java`.**
   https://github.com/yacy/yacy_search_server/blob/7bc99cdceb09a60e1d5b201f172c172c14273922/source/net/yacy/crawler/data/CrawlProfile.java#L91-L130 and
   https://github.com/yacy/yacy_search_server/blob/7bc99cdceb09a60e1d5b201f172c172c14273922/source/net/yacy/crawler/data/CrawlProfile.java#L179-L288
   — job policy fields and handle construction.
4. **[S4] `CrawlSwitchboard.java`.**
   https://github.com/yacy/yacy_search_server/blob/7bc99cdceb09a60e1d5b201f172c172c14273922/source/net/yacy/crawler/CrawlSwitchboard.java#L63-L119 and
   https://github.com/yacy/yacy_search_server/blob/7bc99cdceb09a60e1d5b201f172c172c14273922/source/net/yacy/crawler/CrawlSwitchboard.java#L123-L194
   — default profiles and active/passive profile persistence.
5. **[S5] `NoticedURL.java`.**
   https://github.com/yacy/yacy_search_server/blob/7bc99cdceb09a60e1d5b201f172c172c14273922/source/net/yacy/crawler/data/NoticedURL.java#L53-L99 and
   https://github.com/yacy/yacy_search_server/blob/7bc99cdceb09a60e1d5b201f172c172c14273922/source/net/yacy/crawler/data/NoticedURL.java#L168-L200
   — logical stack definitions and host-balancer backing.
6. **[S6] `CrawlStacker.java`.**
   https://github.com/yacy/yacy_search_server/blob/7bc99cdceb09a60e1d5b201f172c172c14273922/source/net/yacy/crawler/CrawlStacker.java#L84-L164 and
   https://github.com/yacy/yacy_search_server/blob/7bc99cdceb09a60e1d5b201f172c172c14273922/source/net/yacy/crawler/CrawlStacker.java#L347-L469 and
   https://github.com/yacy/yacy_search_server/blob/7bc99cdceb09a60e1d5b201f172c172c14273922/source/net/yacy/crawler/CrawlStacker.java#L479-L564
   — pre-frontier, routing, dedup/recrawl, and admission filters.
7. **[S7] `CrawlQueues.java`, `HostBalancer.java`, and `HostQueue.java`.**
   https://github.com/yacy/yacy_search_server/blob/7bc99cdceb09a60e1d5b201f172c172c14273922/source/net/yacy/crawler/data/CrawlQueues.java#L74-L193
   https://github.com/yacy/yacy_search_server/blob/7bc99cdceb09a60e1d5b201f172c172c14273922/source/net/yacy/crawler/data/CrawlQueues.java#L270-L447
   https://github.com/yacy/yacy_search_server/blob/7bc99cdceb09a60e1d5b201f172c172c14273922/source/net/yacy/crawler/data/CrawlQueues.java#L717-L817
   https://github.com/yacy/yacy_search_server/blob/7bc99cdceb09a60e1d5b201f172c172c14273922/source/net/yacy/crawler/HostBalancer.java#L60-L110
   https://github.com/yacy/yacy_search_server/blob/7bc99cdceb09a60e1d5b201f172c172c14273922/source/net/yacy/crawler/HostBalancer.java#L236-L305
   https://github.com/yacy/yacy_search_server/blob/7bc99cdceb09a60e1d5b201f172c172c14273922/source/net/yacy/crawler/HostBalancer.java#L319-L516
   https://github.com/yacy/yacy_search_server/blob/7bc99cdceb09a60e1d5b201f172c172c14273922/source/net/yacy/crawler/HostQueue.java#L458-L523
   — bounded workers, persistence, dedup, host/depth selection, robots check.
8. **[S8] `RobotsTxtParser.java`.**
   https://github.com/yacy/yacy_search_server/blob/7bc99cdceb09a60e1d5b201f172c172c14273922/source/net/yacy/crawler/robots/RobotsTxtParser.java#L63-L97 and
   https://github.com/yacy/yacy_search_server/blob/7bc99cdceb09a60e1d5b201f172c172c14273922/source/net/yacy/crawler/robots/RobotsTxtParser.java#L99-L253
   — parsed records, agent grouping, wildcard handling, delay cap.
9. **[S9] `RobotsTxt.java` and `RobotsTxtEntry.java`.**
   https://github.com/yacy/yacy_search_server/blob/7bc99cdceb09a60e1d5b201f172c172c14273922/source/net/yacy/crawler/robots/RobotsTxt.java#L140-L207
   https://github.com/yacy/yacy_search_server/blob/7bc99cdceb09a60e1d5b201f172c172c14273922/source/net/yacy/crawler/robots/RobotsTxt.java#L227-L360
   https://github.com/yacy/yacy_search_server/blob/7bc99cdceb09a60e1d5b201f172c172c14273922/source/net/yacy/crawler/robots/RobotsTxtEntry.java#L215-L251
   — cache/fetch/failure behavior and deny-only prefix authorization.
10. **[S10] `Latency.java`.**
    https://github.com/yacy/yacy_search_server/blob/7bc99cdceb09a60e1d5b201f172c172c14273922/source/net/yacy/crawler/data/Latency.java#L115-L182 and
    https://github.com/yacy/yacy_search_server/blob/7bc99cdceb09a60e1d5b201f172c172c14273922/source/net/yacy/crawler/data/Latency.java#L185-L223
    — minimum, flux, observed latency, active-host, and robots delays.
11. **[S11] `CrawlQueues.remoteCrawlLoaderJob()`.**
    https://github.com/yacy/yacy_search_server/blob/7bc99cdceb09a60e1d5b201f172c172c14273922/source/net/yacy/crawler/data/CrawlQueues.java#L449-L579 and
    https://github.com/yacy/yacy_search_server/blob/7bc99cdceb09a60e1d5b201f172c172c14273922/source/net/yacy/crawler/data/CrawlQueues.java#L668-L715
    — peer provider selection, RSS ingestion, and received-work dequeue.
12. **[S12] `yacy/urls.java`.**
    https://github.com/yacy/yacy_search_server/blob/7bc99cdceb09a60e1d5b201f172c172c14273922/source/net/yacy/htroot/yacy/urls.java#L43-L103
    — destructive global-stack pop and delegated-map insertion.
13. **[S13] `Protocol.queryRemoteCrawlURLs()`.**
    https://github.com/yacy/yacy_search_server/blob/7bc99cdceb09a60e1d5b201f172c172c14273922/source/net/yacy/peers/Protocol.java#L406-L487
    — request shape, limits, peer counts, HTTPS-to-HTTP fallback.
14. **[S14] remote completion sender.**
    https://github.com/yacy/yacy_search_server/blob/7bc99cdceb09a60e1d5b201f172c172c14273922/source/net/yacy/search/Switchboard.java#L3421-L3433
    https://github.com/yacy/yacy_search_server/blob/7bc99cdceb09a60e1d5b201f172c172c14273922/source/net/yacy/search/Switchboard.java#L3846-L3880
    https://github.com/yacy/yacy_search_server/blob/7bc99cdceb09a60e1d5b201f172c172c14273922/source/net/yacy/peers/Protocol.java#L1584-L1673
    — asynchronous metadata receipt construction and transport.
15. **[S15] `yacy/crawlReceipt.java`.**
    https://github.com/yacy/yacy_search_server/blob/7bc99cdceb09a60e1d5b201f172c172c14273922/source/net/yacy/htroot/yacy/crawlReceipt.java#L55-L170
    — receipt validation, metadata insertion, and delegated-map removal.
16. **[S16] `Protocol.authentifyRequest()` / `basicRequestParts()`.**
    https://github.com/yacy/yacy_search_server/blob/7bc99cdceb09a60e1d5b201f172c172c14273922/source/net/yacy/peers/Protocol.java#L2214-L2246 and
    https://github.com/yacy/yacy_search_server/blob/7bc99cdceb09a60e1d5b201f172c172c14273922/source/net/yacy/peers/Protocol.java#L2255-L2294
    — default uncontrolled and optional salted-MD5 protocol authentication.
17. **[S17] delegated-map cleanup.**
    https://github.com/yacy/yacy_search_server/blob/7bc99cdceb09a60e1d5b201f172c172c14273922/source/net/yacy/search/Switchboard.java#L2450-L2463 and
    https://github.com/yacy/yacy_search_server/blob/7bc99cdceb09a60e1d5b201f172c172c14273922/source/net/yacy/search/Switchboard.java#L2550-L2573
    — wholesale cleanup without task recovery.
18. **[S18] `Switchboard` crawler/index workflow initialization.**
    https://github.com/yacy/yacy_search_server/blob/7bc99cdceb09a60e1d5b201f172c172c14273922/source/net/yacy/search/Switchboard.java#L976-L1003 and
    https://github.com/yacy/yacy_search_server/blob/7bc99cdceb09a60e1d5b201f172c172c14273922/source/net/yacy/search/Switchboard.java#L1012-L1059
    — SSRF-oriented mode comment and staged processors.
19. **[S19] parse, links, canonical/meta-robots, and condensation.**
    https://github.com/yacy/yacy_search_server/blob/7bc99cdceb09a60e1d5b201f172c172c14273922/source/net/yacy/search/Switchboard.java#L2869-L3103 and
    https://github.com/yacy/yacy_search_server/blob/7bc99cdceb09a60e1d5b201f172c172c14273922/source/net/yacy/search/Switchboard.java#L3111-L3253
    — parser dispatch, link enqueue, index policy, and condenser creation.
20. **[S20] index admission and storage.**
    https://github.com/yacy/yacy_search_server/blob/7bc99cdceb09a60e1d5b201f172c172c14273922/source/net/yacy/search/Switchboard.java#L1971-L2040 and
    https://github.com/yacy/yacy_search_server/blob/7bc99cdceb09a60e1d5b201f172c172c14273922/source/net/yacy/search/Switchboard.java#L3320-L3434
    — index gate and local document store/receipt trigger.
21. **[S21] `HTTPLoader.java`.**
    https://github.com/yacy/yacy_search_server/blob/7bc99cdceb09a60e1d5b201f172c172c14273922/source/net/yacy/crawler/retrieval/HTTPLoader.java#L64-L109
    https://github.com/yacy/yacy_search_server/blob/7bc99cdceb09a60e1d5b201f172c172c14273922/source/net/yacy/crawler/retrieval/HTTPLoader.java#L123-L261
    https://github.com/yacy/yacy_search_server/blob/7bc99cdceb09a60e1d5b201f172c172c14273922/source/net/yacy/crawler/retrieval/HTTPLoader.java#L328-L453
    — time/body/redirect/status/blacklist behavior.
22. **[S22] duplicate signature schema and postprocessing.**
    https://github.com/yacy/yacy_search_server/blob/7bc99cdceb09a60e1d5b201f172c172c14273922/source/net/yacy/search/schema/CollectionSchema.java#L69-L99
    https://github.com/yacy/yacy_search_server/blob/7bc99cdceb09a60e1d5b201f172c172c14273922/source/net/yacy/search/schema/CollectionConfiguration.java#L563-L576
    https://github.com/yacy/yacy_search_server/blob/7bc99cdceb09a60e1d5b201f172c172c14273922/source/net/yacy/search/schema/CollectionConfiguration.java#L1778-L1884
    — exact/fuzzy uniqueness fields and delayed correction.
23. **[S23] accepted network-domain check.**
    https://github.com/yacy/yacy_search_server/blob/7bc99cdceb09a60e1d5b201f172c172c14273922/source/net/yacy/crawler/CrawlStacker.java#L567-L617
    — domain-list and local/global address acceptance.
24. **[S24] official license and notice files.**
    https://github.com/yacy/yacy_search_server/blob/7bc99cdceb09a60e1d5b201f172c172c14273922/LICENSES/GPL-2.0-or-later.txt and
    https://github.com/yacy/yacy_search_server/blob/7bc99cdceb09a60e1d5b201f172c172c14273922/NOTICE
    — GPL terms and bundled attributions; exact-file review still required.
25. **[S25] YaCy official wiki, crawl start / API crawler.**
    https://wiki.yacy.net/index.php/En:CrawlStart_p and
    https://wiki.yacy.net/index.php/Dev:APICrawler
    — first-party remote-indexing UI/API description; corroborative, not pinned.
26. **[S26] `ResourceObserver.java`.**
    https://github.com/yacy/yacy_search_server/blob/7bc99cdceb09a60e1d5b201f172c172c14273922/source/net/yacy/search/ResourceObserver.java#L70-L149 and
    https://github.com/yacy/yacy_search_server/blob/7bc99cdceb09a60e1d5b201f172c172c14273922/source/net/yacy/search/ResourceObserver.java#L211-L228
    — pause/resume and destructive low-resource cleanup.
27. **[S27] crawler status API.**
    https://github.com/yacy/yacy_search_server/blob/7bc99cdceb09a60e1d5b201f172c172c14273922/source/net/yacy/htroot/api/status_p.java#L80-L139
    — traffic, worker, stack, state, and profile observability.
