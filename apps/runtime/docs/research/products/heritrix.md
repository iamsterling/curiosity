# Heritrix clean-room architecture study

**Access date:** 2026-08-17  
**Subject:** Internet Archive Heritrix 3, with historical comparison to Heritrix
1.0  
**Current evidence baseline:** latest released version 3.16.0 (2026-07-03);
official `master` source at commit
[`dea9227de4ef0d88f503de81969faf8b162e89f0`](https://github.com/internetarchive/heritrix3/tree/dea9227de4ef0d88f503de81969faf8b162e89f0),
committed 2026-08-05 [S1, S2]  
**Status:** research only. No Heritrix code, configuration, data, or dependency
was copied into Curiosity, and no implementation or deployment was performed.

## 1. Decision frame and bounded questions

**Decision:** which Heritrix architectural ideas should Curiosity adopt, adapt,
reject, or defer when designing a bounded, provider-neutral, owned public-web
crawl and evidence plane?

Bounded sub-questions:

1. How do scope rules, SURT representations, queue assignment, precedence, and
   per-origin politeness interact?
2. How does Heritrix bound crawler traps, robots decisions, retries, and resource
   use, and where are the boundaries incomplete?
3. What state is checkpointed, what is merely journal-replayed, and what recovery
   guarantees are not established?
4. How are recrawls and WARC revisit records represented, and what provenance
   does WARC preserve?
5. What operator surfaces exist, and what authority and security hazards follow?
6. What do official source and documentation establish about failure and scale?
7. What can Curiosity learn clean-room without importing implementation or
   license obligations?

**Depth budget:** official documentation, current source, standards, release
history, and the original architecture paper; source inspection limited to the
requested mechanisms and adjacent controls. No crawler execution, benchmark,
dependency installation, private service access, exploit testing, or legal
opinion.

**Labels:**

- **FACT** — directly supported by cited primary evidence.
- **INFERENCE** — architectural conclusion, not directly measured here.
- **RECOMMENDATION** — proposed Curiosity choice.
- Confidence is **high**, **medium**, or **low**.

## 2. Executive verdict

**ADAPT concepts, do not adopt the product as Curiosity's owned crawler (high
confidence).** Heritrix's enduring contribution is the separation of (a) ordered
scope decisions, (b) canonicalized URI uniqueness, (c) per-authority work queues,
(d) queue eligibility/politeness, (e) ordered processing chains, and (f) append-oriented
archival output. Its queue is simultaneously a scheduling unit, politeness lock,
budget/accounting unit, and operational fault-containment cell. That is the most
valuable clean-room lesson [S3, S7].

Curiosity should **adopt** WARC 1.1 as an interoperability/capture format and the
general notions of per-origin scheduling cells, explicit prerequisite work,
separate candidate/fetch/disposition stages, valid-stamped checkpoints, and
revisit lineage. It should **adapt** SURT-like authority prefixes only where they
make policy visibly hierarchical; use a standards-conformant robots state machine;
make every scope/policy decision explainable; and make checkpoint manifests,
capture commits, and queue leases explicit.

Curiosity should **reject** Heritrix's trusted arbitrary-code operator plane,
in-process mutable bean graph, ambiguous recovery semantics, and direct copying of
code or configuration. Heritrix's own security policy says authenticated UI users
can execute arbitrary code and edit local files, operators must be fully trusted,
and older versions do not receive backports [S10]. Its current robots failure
policy also materially conflicts with RFC 9309: Heritrix treats 5xx and unsuccessful
robots retrieval as full allow after retries, while RFC 9309 requires complete
disallow for unreachable robots [S8, S9].

## 3. Architecture reconstructed

### 3.1 Control and data flow

**FACT (high):** the original authors identify Scope, Frontier, and Processor
Chains as the three prominent components. The CrawlController holds the configured
assembly; worker `ToeThread`s repeatedly ask the Frontier for a URI, apply ordered
processors, and report completion. A `CrawlURI` carries state between loosely
coupled processors, while a server cache retains cross-URI host/server state [S3,
pp. 5–8]. Current default configuration preserves the staged shape but names three
chains: Candidate, Fetch, and Disposition. The Candidate chain scopes and prepares;
the Fetch chain applies preselection/preconditions, fetches, and extracts; the
Disposition chain writes WARC, schedules accepted outlinks, and updates shared
state/politeness [S7].

```text
seed / discovered outlink
  -> ordered DecideRule scope
  -> FrontierPreparer
       canonical key + class/queue key + cost + URI precedence
  -> already-seen filter
  -> per-classKey persistent work queue
  -> eligible queue selected by queue precedence
  -> one CrawlURI leased to a ToeThread
  -> preselector + DNS/robots/auth prerequisites
  -> fetch + extract
  -> WARC record builder chain
  -> accepted candidates scheduled
  -> server stats + politeness delay + retry/final disposition
  -> queue snoozed, reactivated, retired, or exhausted
```

**INFERENCE (high):** Heritrix is best understood as a durable event loop around
an enriched URI envelope, not as a set of independent URL fetch tasks. Processors
communicate by mutating the envelope and shared caches; therefore ordering and
implicit state contracts are part of the architecture even when the Java type
surface is modular.

### 3.2 Scope and SURT are distinct concerns

**FACT (high):** a scope `DecideRuleSequence` starts undecided and applies ordered
three-valued rules (`ACCEPT`, `REJECT`, `PASS`); the last non-pass result governs.
The recommended profile starts reject-all, accepts configured/seed-derived SURT
prefixes, then applies hop, transclusion, negative SURT/regex, repeating-path,
path-depth, prerequisite, and scheme rules. Ordering is explicitly material [S4,
“Crawl Scope”; S7 lines 131–196].

**FACT (high):** `SurtPrefixedDecideRule` compares the SURT form of a URI to a
prefix set and can derive prefixes from seeds. Independently, the default
`FrontierPreparer` uses `SurtAuthorityQueueAssignmentPolicy`: it extracts the
reversed authority portion of the URI's SURT form as a `classKey`. A queue policy
is simply a mapping from `CrawlURI` to queue-name string; alternative policies can
group by hostname, IP, assignment-level domain, or fixed bucket [S4; S7
`FrontierPreparer.java` lines 100–176,
`QueueAssignmentPolicy.java` lines 28–73,
`SurtAuthorityQueueAssignmentPolicy.java` lines 24–45].

**INFERENCE (high):** SURT is used twice for different reasons:

- **policy locality:** a reversed authority prefix makes “site and descendants” a
  prefix-addressable scope/overlay region;
- **scheduling locality:** a stable authority-derived class key groups requests
  that should share politeness and operational fate.

Conflating these would be a mistake. A URI may be in scope but assigned to a
different scheduling cell; likewise, changing canonicalization or a queue key can
alter deduplication or politeness without changing scope.

### 3.3 Frontier queues and eligibility

**FACT (high):** current `BdbFrontier` stores known queues and pending URIs in
Berkeley DB Java Edition. One BDB database acts as multiple independent queues by
key ranges. `WorkQueueFrontier` also tracks ready queue keys, in-process queues,
short/long snoozed queues, future-scheduled URIs, inactive queues by precedence,
retired queues, and exhausted queues [S7 `BdbFrontier.java` lines 58–167;
`BdbMultipleWorkQueues.java` lines 49–90; `WorkQueueFrontier.java` lines 182–226].

**FACT (high):** canonicalized URIs first pass an `UriUniqFilter`, called the
already-included/already-seen structure. A force-fetch path bypasses ordinary
uniqueness. Accepted URIs enter the queue named by `classKey`. Queue precedence
uses lower integers as higher priority; URI precedence orders items inside a queue.
Inactive queues are activated from the best eligible precedence. A queue can be
deactivated after consuming its duty-cycle budget, retired after total budget or
an explicit directive, snoozed after a fetch/retry delay, or exhausted when empty
[S7 `WorkQueueFrontier.java` lines 318–460, 570–838, 940–1060].

**FACT (high):** only one URI from a host is processed at a time under normal
settings. Authority policies can intentionally split one authority into multiple
parallel queues; default `parallelQueues=1`, while a sheet example shows five
queues only for sites that explicitly permitted aggressive crawling [S4,
“Politeness” and “Sheets”; S7 `URIAuthorityBasedQueueAssignmentPolicy.java`
lines 58–145].

**INFERENCE (high):** queue activation is a two-level scheduler:

1. choose an eligible queue using queue state and precedence;
2. emit the next URI in that queue using its ordered key/URI precedence.

This avoids a global URL priority heap becoming the politeness mechanism. It also
makes “host is slow,” “host is failing,” “host exhausted budget,” and “host must
wait” local state transitions instead of global scan predicates.

Here “authority/host cell” is intentionally not the strict RFC definition of an
origin. The default SURT queue key is derived from authority and may group schemes;
other policies group differently, and parallel queues deliberately split one
authority. Curiosity must define its own policy basis explicitly rather than infer
that every Heritrix `classKey` equals one origin.

**RECOMMENDATION (high):** Curiosity should adopt an explicit scheduling-cell
contract with `cell_id`, policy basis, queue lease, next-eligible time, concurrency
limit, retry state, budgets, and suppression reason. Do not make SURT text itself
the public identity; retain the canonical URI and explain how the cell was derived.

## 4. Politeness and robots

### 4.1 Adaptive delay

**FACT (high):** after a completed fetch, Heritrix calculates the same-server wait
as `delayFactor × last fetch duration`, clamps it between `minDelayMs` and
`maxDelayMs`, can raise it to a robots `Crawl-delay` capped by
`respectCrawlDelayUpToSeconds`, and can raise it for a per-host bandwidth limit.
Defaults in source are factor 5, minimum 3 seconds, maximum 30 seconds, and respect
`Crawl-delay` up to 300 seconds [S4 “Politeness”; S7
`DispositionProcessor.java` lines 71–132, 228–293]. The finished URI then causes
its queue to be snoozed for that delay before another item can issue [S7
`WorkQueueFrontier.java` lines 1012–1060].

**INFERENCE (high):** response-proportional delay is closed-loop backpressure:
slower servers receive less frequent crawler traffic without requiring an explicit
server load signal. Min/max clamps bound both accidental hammering and indefinite
stall. It is a heuristic, not proof that origin load is acceptable.

**RECOMMENDATION (high):** Curiosity should adapt this as one signal in a policy
with hard per-origin concurrency, configured minimum interval, response latency,
429/503 and `Retry-After`, error rate, operator complaints, and emergency deny.
All overrides must be permissioned, expiring, and auditable.

### 4.2 Robots prerequisite and cache

**FACT (high):** Heritrix treats `/robots.txt` as a prerequisite. If cached robots
state is absent/expired, the target URI is deferred and robots is force-refetched;
the current default validity is 24 hours, with zero meaning never expire. A valid
robots state is then evaluated against the configured User-Agent and policy. The
standard policies are `obey`/`classic`, `robotsTxtOnly`, and `ignore`; `obey` also
honors meta `nofollow`, while per-link `rel=nofollow` is separately configurable.
As of 3.10, `*` and `$` matching from RFC 9309 is supported [S2, S4, S7
`PreconditionEnforcer.java` lines 74–101 and 196–268].

**FACT (high):** robots exclusion is recorded as a distinct disregarded outcome,
not a network failure, and host reports count robot denials [S5; S7
`WorkQueueFrontier.java` lines 973–1009].

### 4.3 Material standards contradiction

**FACT (high):** RFC 9309 says a 4xx “unavailable” robots response permits access,
but an “unreachable” result from server/network errors, including 5xx, requires
complete disallow; cached robots generally should not be used for more than 24
hours unless unreachable. Robots rules are not authorization [S9 §§2.3.1.3–2.4,
§1].

**FACT (high):** current Heritrix source documents and implements a different
policy: after a minimum retry threshold, every non-2xx response—including 3xx,
4xx, 5xx, unsuccessful, or incomplete retrieval—becomes `NO_ROBOTS` and valid,
therefore full allow [S8 `CrawlServer.java` lines 133–193].

**INFERENCE (high):** the new wildcard parser does not make the total robots
behavior RFC 9309-conformant. Copying Heritrix's failure-state semantics would
create an avoidable policy and publisher-trust risk.

**RECOMMENDATION (high):** Curiosity must model robots outcomes as typed states
(`fetched`, `unavailable_4xx`, `redirect_exhausted`, `unreachable`, `parse_error`,
`stale_cached`) and implement the RFC independently. Store fetched bytes, decision
time, product token, matched group/rule, cache age, and standards/version marker.
Robots remains a minimum crawl policy, not permission to retain, index, train on,
or display content.

## 5. Trap resistance and bounded behavior

**FACT (high):** the default scope rejects suspicious consecutive repeated path
segments (default more than two repetitions), paths deeper than 20 segments, and
links beyond configured hop limits; negative SURT and regex rules provide
operator suppressions. URI canonicalization and the already-seen filter reduce
repeat scheduling. `TrapSuppressExtractor` stops further link extraction when a
page's content digest equals that of its referring page, carrying the digest down
the discovery path [S4; S7 `PathologicalPathDecideRule.java` lines 27–76,
`TooManyPathSegmentsDecideRule.java` lines 25–86,
`TrapSuppressExtractor.java` lines 23–71].

**FACT (high):** the frontier supports queue total budgets, duty-cycle budgets,
error penalties, precedence floors, max retries/retry delay, max outlinks, and
forced queue retirement. Crawl-wide byte, document, and time limits trigger
graceful termination rather than strict instantaneous caps; in-flight work can
overshoot [S4; S7 `WorkQueueFrontier.java` lines 119–170].

**INFERENCE (high):** Heritrix uses layered trap defense rather than one detector:
syntactic URI limits, scope depth, canonical uniqueness, extraction suppression,
per-queue budgets/retirement, retries, and operator negative lists. Each detector
has false-positive/false-negative trade-offs; content-equal-to-parent catches a
particular recursive trap but not calendars, faceted search, infinite query
combinations, generated near-duplicates, or browser-state explosions.

**RECOMMENDATION (high):** Curiosity should preserve this defense-in-depth shape
but make all limits hard and composable: per-response bytes/time/decompression,
per-page outlinks, per-cell new-URI rate and total novelty budget, path/query
entropy, near-duplicate expansion, redirect depth, MIME-specific parser budgets,
and crawl-wide cost. Trap classification should suppress expansion while retaining
the already captured evidence and reason.

## 6. Checkpoints, journals, and recovery

### 6.1 Proper checkpoints

**FACT (high):** a checkpoint coordinates every Spring bean implementing
`Checkpointable` through start/lock, flush/write, and finish/unlock phases. The BDB
frontier synchronizes deferred writes, stores counters and inactive precedence
levels, records active/ready/snoozed queue keys, and rotates the recovery log. The
checkpoint is considered available only if success produced a `valid` stamp;
unstamped directories are warned about and ignored by discovery [S5; S7
`CheckpointService.java` lines 276–426, `BdbFrontier.java` lines 225–280;
`Checkpoint.java` lines 39–175].

**FACT (high):** checkpoints can be manual, periodic, or on graceful JVM
shutdown. Shutdown mode pauses first, but cannot run after a kill, crash, or power
loss. Official docs state a checkpoint includes serialized job objects, required
BDB log files, and other state; logs are rotated but remain outside the checkpoint.
Hardlinks may reduce space and time. A 2024 compatibility note says checkpoints
from older versions cannot be loaded after a major Kryo update [S2, S5].

### 6.2 Approximate journal recovery

**FACT (high):** the frontier recovery journal records URI discovery and
completion events. Replaying it first marks completed URIs included, then schedules
discovered URIs. Official docs call the reconstructed state **approximate** and say
it carries less state than a checkpoint. Recovery may alter results when scope is
path/hop-dependent; checkpoints taken during one-file replay are invalid until
replay completes. A 100-million-URI recovery may take days [S5 “Action Directory”
and “Crawl Recovery”].

**INFERENCE (high):** the journal is an operational rebuild aid, not an exact
event-sourced state model. The checkpoint is closer to a coordinated process image
than to a portable logical snapshot, which explains version coupling.

**RECOMMENDATION (high):** Curiosity should separate:

- immutable capture commit records;
- a replayable logical frontier event log with schema/version and idempotency key;
- portable checkpoint manifests listing exact component snapshots and watermarks;
- derived caches that may be rebuilt;
- recovery verification comparing queue counts, lease reconciliation, policy
  version, and capture/WARC commit boundaries.

Claim recovery only to a documented consistency point. Never infer that a valid
frontier snapshot also means the last open WARC is valid; Heritrix explicitly warns
that `.open` WARC files after a crash may contain a corrupt/truncated final record
and need validation [S5].

## 7. Recrawl history and WARC output

### 7.1 Revisit detection

**FACT (high):** `FetchHistoryProcessor` keeps status, fetch-start time, payload
digest, ETag, Last-Modified, and reference length in per-URI history (default two
entries). A 304 carries the previous content digest forward and creates a
server-not-modified revisit profile. Equal adjacent payload digests create an
identical-payload-digest profile referring to the prior URI/date [S7
`FetchHistoryProcessor.java` lines 50–146].

**FACT (high):** Heritrix also supports content-digest history that is independent
of URI. After writing original content, it stores original URL, WARC record ID,
filename, offset, date, and digest count; later identical-digest revisits increment
the count [S7 `BaseWARCWriterProcessor.java` lines 225–249].

**INFERENCE (high):** URI-local history answers “did this URL change since its
last fetch?” while digest history answers “where is the already archived payload?”
They should remain separate because redirects, aliases, mirrors, and syndication can
share content across URLs.

### 7.2 WARC record construction

**FACT (high):** the default WARC writer chain can emit DNS response, HTTP
response, WHOIS response, FTP control/response, revisit, HTTP request, and metadata
records. Records generated from one capture are connected with
`WARC-Concurrent-To`; files roll at a size boundary and begin with `warcinfo`.
Write failure invalidates the current file. The crawl's warcinfo includes operator,
publisher, job, description, robots policy, User-Agent, and From metadata when
configured [S7 `WARCWriterChainProcessor.java` lines 35–180;
`BaseWARCWriterProcessor.java` lines 105–139].

**FACT (high):** for an identical-payload revisit, Heritrix retains protocol
response headers while truncating duplicate payload; for a 304 revisit it can omit
the body. The record carries `WARC-Profile`, truncation, and profile-specific
reference/digest headers [S7 `RevisitRecordBuilder.java` lines 22–75]. WARC 1.1
defines eight record types and makes revisit an optional space-saving record that
still records the visit and links it to prior content. It recommends preserving
response headers for identical-digest revisits and using record/date/target
references [S11].

**FACT (high):** Heritrix HTTP/2/3 capture is not always wire-faithful. Official
docs say WARC 1.1 does not specify those messages and `FetchHTTP2` stores a
simplified HTTP/1.1 representation without transfer encoding; operators needing
exact network bytes are advised to use the HTTP/1 fetcher [S4 “HTTP/2”].

**RECOMMENDATION (high):** Curiosity should adopt WARC 1.1 for raw capture and
capture-event relationships, plus an external immutable manifest/index. Record
request/response IDs, target URI, observed IP, timing, protocol, truncation,
payload/block digests, policy decision ID, extractor version, and write commit.
Label normalized HTTP/2/3 representations as transformations; never imply wire
fidelity. Revisit references must remain resolvable under retention/deletion and
WARC relocation.

## 8. Operator controls and observability

**FACT (high):** operators can create/build/launch jobs, launch paused, pause,
unpause, terminate, teardown, copy/profile, delete, checkpoint, edit job
configuration, inspect/edit live beans, submit new seeds or recovery actions via an
action directory, and execute BeanShell/ECMAScript/Groovy/AppleScript through the
REST/UI scripting endpoint. Job status exposes URI/size/rate/load/elapsed/frontier,
heap, log tails, reports, alerts, and checkpoints [S5, S6].

**FACT (high):** logs and reports expose every attempted URI, fetch/discovery
metadata, periodic throughput and memory, congestion, queue depths, crawl summary,
seeds, hosts/robots/novel/duplicate counts, MIME/status distributions, per-processor
activity, frontier queues, and worker thread states. Action-directory files support
schedule/include/force/recover semantics; composing files outside the watched
directory and atomically moving them in is recommended [S5].

**INFERENCE (high):** Heritrix optimizes for a trusted expert operator who can
intervene deeply in a long crawl. That is valuable operationally but collapses
configuration, code execution, file access, and crawl authority into one role.

**RECOMMENDATION (high):** Curiosity should adapt the visibility, not the authority
model. Provide typed, narrowly authorized commands: pause/resume, emergency origin
suppress, add seeds under existing scope, request checkpoint, inspect queue/policy
trace, and generate report. Configuration changes should be immutable revisions
requiring validation and audit; no arbitrary scripts or local path submission in
the service API.

## 9. Failure, scale, and security analysis

### 9.1 Failure semantics

**FACT (high):** transient URI errors can retry with configured count and delay;
the queue sleeps during the retry delay. Completed outcomes distinguish success,
disregard (for example robots or changed scope), and failure; failures incur queue
error penalties. A queue may be force-woken, unretired, or force-retired by an
operator/policy [S4, S7].

**FACT (high):** official security docs describe prior runaway memory in
third-party rich-media libraries and runaway CPU in link-extraction regexes;
malicious or worst-case content can disrupt or corrupt a crawl. The current
changelog still contains parser/pathology and BDB consistency fixes, including a
2026 cap against pathological HTML regex input and 2025 null/type checks for
partially persisted `CrawlURI`s [S2, S5].

**INFERENCE (high):** persistence, retries, and checkpoints improve survivability
but do not constitute exactly-once capture. Crash windows span network fetch,
WARC append, URI disposition, journal, and BDB sync. The reviewed sources do not
state a transaction atomically covering all of them.

### 9.2 Scale claim versus evidence

**FACT (high):** the project calls itself “web-scale.” The 2004 paper reports
then-current focused crawls of millions to tens of millions of resources over a
week or more, but explicitly described Heritrix 1.0 as single-instance, requiring
expert tuning, with limited recovery and incomplete broad/continuous crawl support
[S3, pp. 9–14]. Current source has disk-backed queues and a `CrawlMapper` that
hashes/partitions class keys into diversion logs for import by other crawlers; this
is work partitioning, not evidence here of a coordinated distributed consensus
frontier [S7 `CrawlMapper.java` lines 45–66;
`HashCrawlMapper.java` lines 31–135].

**UNKNOWN:** no current official reproducible benchmark was found for sustained
3.16 throughput, maximum frontier size, crash loss window, checkpoint pause/time,
or multi-node coordination. The 2004 performance plots are historical and cannot
support a 2026 capacity claim.

**RECOMMENDATION (high):** treat Heritrix scale as architecture evidence, not a
Curiosity sizing result. Benchmark the owned design with a controlled corpus and
fault injection: frontier cardinality, active origins, enqueue/dequeue throughput,
p50/p99 checkpoint duration, recovery point/loss, WARC validation, slow/erroring
origins, parser bombs, trap expansion, and long-duration resource stability.

### 9.3 Security boundary

**FACT (high):** by default the UI binds only to loopback and uses HTTPS; docs
recommend keeping it local, tunneling through SSH, strong credentials, firewalling,
and running with least privilege. The security policy nevertheless states the UI
and configuration deliberately allow arbitrary code and local file operations,
authenticated operators are fully trusted, there is no role separation/sandbox,
only the current version receives fixes, and there is no bug bounty [S5, S10].

**INFERENCE (high):** placing Heritrix directly on a multi-tenant control network
would create a high-impact remote-code/file authority plane. Fetched content also
crosses multiple complex parsers and, optionally, a browser, increasing exploit,
resource exhaustion, SSRF, and content-to-control-plane risk.

**RECOMMENDATION (high):** Curiosity should isolate fetch workers from operator
and index planes; restrict egress by resolved/public-address policy with DNS
rebinding defenses; sandbox parsers/renderers; enforce MIME-independent byte,
time, decompression, CPU, process, and file limits; treat all fetched bytes and
extracted links as untrusted; use least-privilege append-only capture credentials;
and keep arbitrary scripting entirely out of production control APIs.

## 10. License and clean-room boundary

**FACT (high):** current Heritrix is primarily Apache License 2.0, but the project
README and distribution license explicitly say some source files have other
licenses and bundled libraries retain their respective licenses. The root POM lists
Apache-2.0 and LGPL, with LGPL applying to a few remaining files; the distribution
license enumerates known exceptional files and says individual headers are
authoritative [S1, S12]. The 2004 paper's statement that Heritrix was LGPL describes
version 1.0, not the current project license [S3, p. 4].

**FACT (high):** WARC is ISO 28500:2017 and the IIPC publishes the standard text;
RFC 9309 has IETF Trust terms, including special terms for extracted code
components [S9, S11]. Standards availability does not license captured website
content.

**RECOMMENDATION (high):** clean-room architectural learning may cite behaviors,
public interfaces, standards, and independently restated concepts. Do not copy
Heritrix source, comments, default configuration, tests, or nontrivial structure
into Curiosity. If Heritrix or any library is ever proposed as a dependency,
perform a separately authorized exact-version SBOM, file-level license/notice,
source-offer, patent, trademark, and distribution review. Keep that decision
separate from WARC adoption and from rights in crawled content.

## 11. Curiosity implications and verdict ledger

| Item | Verdict | Basis and adaptation | Confidence |
| --- | --- | --- | --- |
| Candidate → fetch → disposition stages | **ADOPTED** | Makes policy, network work, capture commit, expansion, and scheduling separately testable. | High |
| Per-origin scheduling/politeness cells | **ADOPTED** | Queue is the right locality for concurrency, delay, errors, budget, and emergency suppression. | High |
| SURT as internal policy prefix | **ADAPTED** | Useful hierarchy, but expose typed policy basis and canonical URI rather than opaque SURT keys. | High |
| Ordered three-valued scope rules | **ADAPTED** | Preserve composability but emit a decision trace and reject ambiguous/no-decision defaults. | High |
| Canonical URI already-seen filter | **ADAPTED** | Separate fetch identity, canonical cluster, capture version, and content digest; do not silently erase aliases. | High |
| Response-proportional politeness | **ADAPTED** | One bounded signal alongside Retry-After, errors, complaints, and explicit policy. | High |
| Heritrix robots failure semantics | **REJECTED** | 5xx/unreachable full-allow conflicts with RFC 9309 complete-disallow. | High |
| Layered trap controls | **ADOPTED/expanded** | Add hard query/entropy/novelty/decompression/parser/browser limits and reasoned suppression. | High |
| WARC 1.1 capture | **ADOPTED** | Open standard preserves capture records and relationships; add immutable manifests and validation. | High |
| Revisit records | **ADOPTED** | Preserve current observation plus reference to prior payload; verify reference retention/resolution. | High |
| Checkpoint validity stamp | **ADOPTED/expanded** | Require component manifest, watermarks, hashes, policy/schema versions, and restore verification. | High |
| Approximate journal recovery | **REJECTED as guarantee** | Useful fallback only; cannot substitute for exact portable logical recovery. | High |
| UI/REST arbitrary scripting | **REJECTED** | Violates least authority, multi-role controls, and bounded operations. | High |
| Live mutable configuration graph | **REJECTED** | Replace with immutable validated revisions and audited typed overrides. | High |
| Heritrix as Curiosity owned core | **REJECTED** | Third-party product/code and obligations; architecture learning does not require adoption. | High |
| Heritrix as evaluation oracle | **DEFERRED** | Could compare scope/fetch/WARC behavior on a licensed fixture under separate authority. | Medium |
| BrowserProcessor lessons | **DEFERRED** | Current release calls browser support suitable for small crawls but still needing robustness; isolate as later lane [S2]. | High |

## 12. Fact / inference / recommendation ledger

| ID | Type | Claim | Origin | Confidence |
| --- | --- | --- | --- | --- |
| L1 | FACT | Current release is 3.16.0; inspected master is post-release commit `dea9227…`. | [S1], [S2] | High |
| L2 | FACT | Scope, Frontier, and ordered processors are the core decomposition. | [S3], [S7] | High |
| L3 | FACT | Default queue key is SURT authority; scope SURTs and queue SURTs are separate mechanisms. | [S4], [S7] | High |
| L4 | FACT | Frontier state has persistent per-key queues plus ready/in-process/snoozed/inactive/retired/exhausted categories. | [S6], [S7] | High |
| L5 | FACT | Default politeness is single-queue concurrency plus clamped response-time-derived delay. | [S4], [S7] | High |
| L6 | FACT | Current robots wildcard support coexists with non-RFC unreachable/5xx handling. | [S2], [S8], [S9] | High |
| L7 | FACT | Trap resistance is layered but heuristic. | [S4], [S7] | High |
| L8 | FACT | Proper checkpoints coordinate checkpointable beans and use a success stamp; journal replay is approximate. | [S5], [S7] | High |
| L9 | FACT | WARC writer supports capture-linked request/response/revisit/metadata records and invalidates files on write I/O failure. | [S7], [S11] | High |
| L10 | FACT | Current operator surface permits arbitrary code and file access and assumes fully trusted operators. | [S6], [S10] | High |
| L11 | INFERENCE | A per-origin queue is a fault/policy cell, not merely FIFO storage. | L4–L5 | High |
| L12 | INFERENCE | Heritrix does not establish exactly-once atomicity across fetch, WARC, journal, and frontier state. | Absence across [S5], [S7] | Medium |
| L13 | INFERENCE | Current official evidence is insufficient for a Curiosity capacity or distributed-scale claim. | [S2], [S3], [S7] | High |
| L14 | RECOMMENDATION | Build typed, auditable scheduling cells and standards-conformant robots independently. | L3–L7 | High |
| L15 | RECOMMENDATION | Use WARC plus logical event logs and portable verified checkpoint manifests. | L8–L9 | High |
| L16 | RECOMMENDATION | Reject arbitrary scripting and mutable live bean control in production. | L10 | High |

## 13. Unknowns, negative results, and required checks

### Unknowns

1. **Current capacity:** no authoritative 3.16 sustained throughput/frontier-size
   benchmark or hardware-normalized operating envelope found.
2. **Atomicity window:** no official claim found that WARC append, journal event,
   and BDB disposition commit atomically.
3. **Distributed deployment:** mapper/diversion facilities exist, but no reviewed
   primary source establishes a current coordinated, failure-tolerant multi-node
   global frontier.
4. **Full RFC 9309 conformance:** wildcard support is documented, but robots
   failure semantics conflict; all parser edge cases were not conformance-tested.
5. **WARC 1.1 emitted version:** current writer metadata source still includes
   historical WARC 1.0 text; emitted files were not generated and inspected here.
6. **Exact dependency obligations:** repository metadata is not an exact release
   SBOM/legal review; transitive/bundled licenses were not enumerated.
7. **Browser lane:** no scale/security benchmark was run for 3.16 BrowserProcessor.

### Negative results retained

- Official ReadTheDocs has strong operating/configuration coverage but no current
  architecture or performance benchmark.
- The original paper is authoritative for intent and 1.0 behavior only; its LGPL,
  scale limitations, chain names, and ARC output are historical, not current facts.
- GitHub's top-level license classifier reports `NOASSERTION`; the repository's own
  license files/POM provide the more useful evidence, but still require file-level
  review for reuse.
- No exact-recovery or exactly-once guarantee was found in checkpoint/recovery
  documentation.
- No evidence found that robots exclusion grants content-use rights; RFC 9309 says
  it is not access authorization.

### Checks before any design adoption

- Conformance tests against RFC 9309 matching, redirects, 4xx, 5xx/network errors,
  parse limits, cache expiry, and stale-cache behavior.
- Fault-injection matrix at every fetch/capture/frontier boundary; validate open
  WARC handling and duplicate capture semantics.
- Restore tests across schema revisions; refuse invalid/incomplete manifests.
- Property tests for canonicalization, SURT/policy prefixes, public suffix changes,
  queue-key stability, redirect loops, and Unicode/percent encoding.
- Adversarial fixtures for calendars, faceting, session/query explosions,
  near-duplicate pages, decompression bombs, huge attributes, regex worst cases,
  malformed protocol messages, parser/browser crashes, and DNS rebinding.
- License/SBOM review only if a third-party binary or source dependency is proposed.

## 14. Bounded curiosity pass

Scoring: 1 low to 5 high; cost 1 cheap to 5 expensive.

| Thread | Relevance | Value | Novelty | Cost | Decision |
| --- | ---: | ---: | ---: | ---: | --- |
| Compare current robots error policy with RFC 9309 | 5 | 5 | 5 | 1 | **Pursued.** Found material 5xx/unreachable contradiction; changed verdict to reject semantics. |
| Verify current release/source freshness | 4 | 4 | 3 | 1 | **Pursued.** 3.16.0 released 2026-07-03; master advanced 2026-08-05. |
| Distinguish current license from 2004 LGPL claim | 5 | 5 | 4 | 1 | **Pursued.** Current primary license is Apache-2.0 with file/dependency exceptions and residual LGPL metadata. |
| Prove exact WARC/frontier transaction atomicity | 5 | 5 | 4 | 4 | `CURIOSITY_NO_GO`: no such claim found; proving absence requires runtime fault injection outside research authority. |
| Benchmark 3.16 at web scale | 4 | 5 | 4 | 5 | `CURIOSITY_NO_GO`: no authorized infrastructure, corpus, or reproducible benchmark frame. |
| Enumerate every transitive dependency license | 3 | 4 | 2 | 4 | `CURIOSITY_NO_GO`: only necessary if exact-version reuse is proposed; architecture decision unaffected. |
| Execute adversarial robots/trap/browser tests | 5 | 5 | 4 | 5 | `CURIOSITY_NO_GO`: execution and implementation testing exceed caller's source/docs/papers frame. |
| Reverse engineer Internet Archive production topology | 2 | 3 | 4 | 5 | `CURIOSITY_NO_GO`: not required, under-documented, and risks crossing clean-room/access boundaries. |

**Coverage stop:** every requested category—scope/SURT queues, politeness, traps,
robots, checkpoint/recovery, revisits, WARC, operator controls, failure, scale,
security, license, and Curiosity implications—has primary evidence and a verdict.

**Saturation stop:** additional source references repeated the same queue states,
processor-chain model, and operator surfaces. The highest-value contradiction
(robots failure semantics) and license/time-version ambiguity were resolved.
Remaining gaps require execution, legal review, or an implementation decision and
are therefore outside authority.

## 15. Primary sources and selection rationale

All accessed 2026-08-17.

1. **[S1] Internet Archive, Heritrix repository README, LICENSE, and current
   commit.**  
   https://github.com/internetarchive/heritrix3/tree/dea9227de4ef0d88f503de81969faf8b162e89f0  
   Project identity, repository license statement, source pin, operator warning.

2. **[S2] Internet Archive, Heritrix changelog/releases.**  
   https://github.com/internetarchive/heritrix3/blob/dea9227de4ef0d88f503de81969faf8b162e89f0/CHANGELOG.md  
   Current 3.16 release, recent fixes/features, compatibility and browser caveats.

3. **[S3] Mohr, Stack, Ranitovic, Avery, and Kimpton, “An Introduction to
   Heritrix: An Open Source Archival Quality Web Crawler,” IWAW 2004.**  
   http://crawler.archive.org/Mohr-et-al-2004.pdf  
   Original architecture and historically bounded scale/limitation claims. The
   paper is CC BY-ND 2.0; only facts were summarized here.

4. **[S4] Internet Archive, “Configuring Crawl Jobs.”**  
   https://heritrix.readthedocs.io/en/latest/configuring-jobs.html  
   Scope semantics, rules, frontier politeness/retries/bandwidth, sheets, robots,
   and HTTP/2/3 recording caveat.

5. **[S5] Internet Archive, “Operating Heritrix.”**  
   https://heritrix.readthedocs.io/en/latest/operating.html  
   Security, logs/reports, action directory, checkpoints, and exact caveats for
   approximate recovery and open WARCs.

6. **[S6] Internet Archive, Heritrix REST API.**  
   https://heritrix.readthedocs.io/en/latest/api.html  
   Job lifecycle, status model, checkpoints, configuration upload, and scripting.

7. **[S7] Internet Archive, current Heritrix source at pinned commit.**  
   https://github.com/internetarchive/heritrix3/tree/dea9227de4ef0d88f503de81969faf8b162e89f0  
   Primary implementation evidence. Principal files cited inline: default profile,
   `FrontierPreparer`, queue policies, `WorkQueueFrontier`, `BdbFrontier`,
   `DispositionProcessor`, trap rules/extractor, `CheckpointService`,
   `FetchHistoryProcessor`, and WARC writer/builders.

8. **[S8] Internet Archive, current `CrawlServer` robots response policy.**  
   https://github.com/internetarchive/heritrix3/blob/dea9227de4ef0d88f503de81969faf8b162e89f0/modules/src/main/java/org/archive/modules/net/CrawlServer.java#L129-L193  
   Direct evidence for the consequential robots error-handling contradiction.

9. **[S9] IETF, RFC 9309, Robots Exclusion Protocol.**  
   https://www.rfc-editor.org/rfc/rfc9309.html  
   Normative user-agent/rule matching, access results, cache, limits, security,
   and statement that robots is not authorization.

10. **[S10] Internet Archive, Heritrix Security Policy.**  
    https://github.com/internetarchive/heritrix3/blob/dea9227de4ef0d88f503de81969faf8b162e89f0/SECURITY.md  
    Fully trusted operator/arbitrary-code boundary, support and reporting policy.

11. **[S11] IIPC/ISO, WARC Format 1.1 (ISO 28500:2017 text).**  
    https://iipc.github.io/warc-specifications/specifications/warc-format/warc-1.1/  
    Normative capture model, record types/fields, revisit profiles, truncation,
    digests, and record relationships.

12. **[S12] Internet Archive, Heritrix distribution license and root POM.**  
    https://github.com/internetarchive/heritrix3/blob/dea9227de4ef0d88f503de81969faf8b162e89f0/dist/LICENSE.txt  
    https://github.com/internetarchive/heritrix3/blob/dea9227de4ef0d88f503de81969faf8b162e89f0/pom.xml#L38-L52  
    File-level exceptions, bundled dependency boundary, and residual LGPL marker.
