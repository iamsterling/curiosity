# BUbiNG crawler: clean-room architecture study

**Research date:** 2026-08-17  
**Decision frame:** What proven BUbiNG mechanisms should Curiosity adopt, adapt, reject, or defer for a bounded, restartable, polite public-web retrieval crawler?  
**Scope:** high-throughput architecture; host/IP politeness; DNS; frontier queues; URL storage and deduplication; parsing; restart; distribution; measured scale; licensing. This is a behavioral study, not a port.  
**Evidence boundary:** public papers, project documentation, and read-only inspection of public source at commit [`50769f8`](https://github.com/LAW-Unimi/BUbiNG/tree/50769f87a1ce13bc2f7335866eb9b8b79cd668c2). No BUbiNG code was copied.  
**Overall confidence:** **High** for the single-agent data path and orderly restart; **medium** for distributed failure behavior because the external JAI4J implementation and a live multi-agent run were not examined.

## Executive verdict

BUbiNG's enduring contribution is not “thousands of threads.” It is the separation of (1) permanent discovery deduplication, (2) a bounded in-memory scheduling window, (3) disk-backed per-origin FIFO tails, and (4) a two-level host/IP delay scheduler. This lets a crawler expose enough independent origins to fill network capacity while keeping URL memory bounded and protecting shared IPs. The paper reports impressive results—3,700 resources/s at 154 MB/s on one real-web agent and 10,150 resources/s per agent in a four-agent synthetic experiment—but these are 2010s-era, author-run measurements, not a current independent benchmark [S1, §5 and Table 1].

For Curiosity, **adopt the invariants**, not the implementation: origin leases, IP-aware eligibility, bounded queues, durable dedup, parser isolation, and explicit backpressure. **Adapt** the frontier to async/capped concurrency and transactional recovery. **Reject** BUbiNG's current robots implementation and distributed-IP assumptions: as inspected, it ignores `Allow`, general `*`, and `$`, treats HTTP 5xx robots responses as allow-all, and cannot guarantee an IP delay across agents. RFC 9309 now requires longest-match `Allow`/`Disallow`, wildcard/end-anchor support, and complete disallow when robots is unreachable [S10, §§2.2.2–2.3.1.4].

| Topic | Verdict | Curiosity decision |
|---|---|---|
| Two-level origin/IP delay scheduler | **ADOPT** | Preserve eligibility as `max(origin_next, ip_next)` and exclusive leases; use explicit monotonic time. |
| Bounded active frontier + disk tails | **ADAPT** | Preserve per-origin FIFO and bounded hot set; use a durable, transactional queue rather than BUbiNG file/object snapshots. |
| Permanent URL sieve plus hot LRU fingerprints | **ADAPT** | Keep a cheap hot duplicate filter before authoritative durable dedup; use at least 128-bit keys or exact normalized URLs where omissions are unacceptable. |
| Fetch/parse decoupling and bounded bodies | **ADOPT** | Separate I/O and CPU budgets; bounded handoff queues and spill limits are contract requirements. |
| Thousands of blocking Java threads | **REJECT** as prescription | It was a successful 2010s choice, not a portable invariant. Benchmark async and bounded worker models on Curiosity's runtime. |
| Peer-to-peer URL assignment | **DEFER** | Start with one ownership service/partition contract; add distributed agents only with durable handoff and cluster-wide IP leases. |
| BUbiNG robots parser/error policy | **REJECT** | Implement and conformance-test RFC 9309; fail closed for unreachable robots and cap/cache untrusted files. |
| BUbiNG restart format | **REJECT** for direct use | It is orderly-stop serialization, not crash-consistent checkpointing. Adopt staged snapshots/WAL semantics instead. |
| BUbiNG source reuse | **DEFER / legal review** | Repository evidence says Apache-2.0, but the LAW product page says GPL. Keep clean-room concepts-only posture until provenance is resolved. |

## 1. Architecture and data flow

### 1.1 Agent pipeline

**FACT — High confidence.** An agent is autonomous and owns the full pipeline. Fetch threads perform blocking network I/O; parsing threads perform CPU-heavy response analysis. A lock-free results queue sits between them. Parsing discovers normalized URLs, checks a fast approximate cache, and routes the URL either to another agent or the local persistent sieve. The frontier then moves never-before-seen URLs through a distributor into an active workbench or disk-backed virtual queue. A todo thread takes eligible visit states from the workbench; a fetcher consumes one (or several under keep-alive); a done thread returns the state [S1, §§4–4.4; S3].

```text
response -> parser -> normalize/filter -> hot URL cache
                                      -> remote owner, or local sieve
local sieve -> ready disk queue -> distributor -> visit-state FIFO (hot)
                                      \-> per-visit-state FIFO tail (disk)
DNS -> host visit state -> IP workbench entry -> delay workbench
workbench -> todo -> fetch -> results -> parse -> done -> workbench
parsed/storable response -> compressed WARC store
```

**FACT — High confidence.** The throughput strategy is deliberate contention isolation. Thousands of low-priority fetchers do not touch the priority queues directly. One todo thread and one done thread “sandwich” the workbench with lock-free queues. Each fetcher reuses its response buffer; overflow beyond the in-memory prefix spills to disk, up to a configured body cap. The usual parser count is near core count [S1, §§4, 4.2–4.4; S2, “How BUbiNG uses memory/disks”].

**INFERENCE — High confidence.** BUbiNG is a staged queueing network whose principal invariant is “fetchers should not wait.” The distributor expands the number of active origins when fetchers report waits. Its adaptive *front* is more important than its Java thread model.

### 1.2 Boundedness and backpressure

**FACT — High confidence.** BUbiNG assumes memory is constant in discovered URLs but may grow linearly in discovered hosts. Full URLs are byte arrays; a visit state stores only path+query because scheme+authority is shared. The workbench has a byte limit. The distributor pauses disk/sieve intake when the workbench is full or when the active front is already large enough [S1, §§4, 4.2, 4.7; S4, lines 31–58 and 96–189].

**FACT — High confidence.** The active-front estimate grows when fetchers wait, but source bounds it to half the estimated path-query capacity. The distributor prioritizes refilling already-started origin queues before reading new URLs from the sieve; that choice improves per-origin breadth-first behavior but competes with finding additional origins [S1, §4.7; S3, lines 824–834; S4, lines 108–188].

**RECOMMENDATION.** Curiosity should model each stage with a separately visible bound: discovered-but-uncommitted, durable-ready, DNS-pending, eligible origins, fetch-in-flight, parse-in-flight, and response spill bytes. “Constant memory” is not enough if host metadata remains unbounded; eviction and durable host-state reload need an explicit policy.

## 2. Politeness, robots, and failure handling

### 2.1 Host and IP scheduling

**FACT — High confidence.** A `VisitState` represents a scheme+authority (called “host” loosely in the paper), holds a FIFO of path+queries and `nextFetch`, and caches robots/cookies/error state. DNS groups visit states resolving to the same IP into a `WorkbenchEntry`, itself with an IP `nextFetch`. The workbench is therefore a priority queue of IP entries, each containing a priority queue of origin states, each containing a FIFO of URLs. The top eligible time is effectively `max(ip_next_fetch, earliest_origin_next_fetch)` [S1, §4.2; S5].

**FACT — High confidence.** Acquiring a visit state also acquires its IP entry, so no second local fetch can use another hostname at that IP concurrently. On completion the parser sets both clocks from fetch end time plus configured delays. This gives constant-time inspection of whether *some* origin is ready, although queue removal/insertion remains logarithmic [S1, §4.2; S5; S6, lines 265–318].

**FACT — High confidence.** Errors are stateful. The code assigns exception-specific initial waits and retry caps, doubles delays on repeated same-class failures, then either drops the URL or purges the origin for “host-killer” classes. DNS failures similarly enter a delay queue and are retried before purge [S5, “Broken visit states”; S6, lines 90–116 and 276–310; S7].

**LIMIT — High confidence.** Multi-agent assignment is by host, not IP. The official configuration guide explicitly says multiple agents do **not** guarantee the configured IP delay because different hosts on one IP can be assigned to different agents. `ipDelayFactor` only inflates local delays using a heuristic based on agent count and the number of local hostnames on that IP [S2, “Starting a crawl”; S8, lines 213–226; S6, lines 269–274]. Thus “strict host- and IP-based politeness” is valid within one agent, but not a cluster-wide guarantee.

### 2.2 Robots behavior: historical claim versus 2026 requirement

**FACT — High confidence.** BUbiNG schedules `/robots.txt` ahead of ordinary paths on a new origin, caches the resulting prefix filter in the visit state, refreshes it after `robotsExpiration`, follows at most five robots redirects, and stores robots responses separately. Same-origin links are filtered while parsing and URLs are checked again before fetch [S3, lines 452–470; S5; S6, lines 197–206 and 323–334].

**FACT — High confidence, negative result.** Public source at the inspected commit recognizes `User-agent` and `Disallow` only. It converts disallows to prefix strings, strips only a trailing `*`, and has no `Allow` or `$` handling. It treats both 4xx **and 5xx** as an empty filter (allow all) [S9, lines 71–190]. RFC 9309, published after BUbiNG's design, requires combining matching groups, longest-match `Allow`/`Disallow`, `*` and `$`, and complete disallow for server/network failure; only 4xx-style “unavailable” may allow crawling [S10, §§2.2.1–2.3.1.4].

**VERDICT — REJECT.** Do not reuse or behaviorally emulate this parser. “Fully respects robots” in the paper [S1, introduction] is a historical claim, not 2026 conformance evidence. Curiosity must treat robots as untrusted bounded input, test RFC vectors, retain last-good policy when permitted, and fail closed on unreachable state.

## 3. DNS

**FACT — High confidence.** New origins enter a DNS queue. Configurable DNS worker threads resolve them, pick the first returned address, reject blacklisted IPv4 addresses, and atomically attach the origin state to an IP workbench entry. The resolver is pluggable; default code uses dnsjava and asks for all addresses, but the worker consumes element zero [S1, §4.5; S7; S11].

**FACT — High confidence.** The authors consider a local recursive resolver essential at scale. The docs recommend coordinating dnsjava and resolver cache limits/TTLs and show a local BIND setup; the agent also sets dnsjava positive/negative cache and timeout values [S2, “Configuring your hardware”; S3, lines 503–507].

**LIMIT / UNKNOWN.** The inspected path binds an origin to the first address at resolution and does not show TTL-driven re-resolution of healthy origins. IPv6 addresses can form workbench keys, but the operations guide recommends IPv4-only BIND/runtime settings. Behavior under address rotation, anycast, rebinding, and mixed A/AAAA answers is not established.

**RECOMMENDATION.** Curiosity should make the DNS answer-set and expiry part of the lease record, define address selection and re-resolution, and apply SSRF/private-network policy after every resolution and redirect—not only a static IPv4 blacklist.

## 4. Frontier, URL storage, and deduplication

### 4.1 Three storage temperatures

1. **Permanent discovery memory — sieve.** The default `MercatorSieve` stores each known normalized URL as a 64-bit hash in a sorted disk file. New hashes accumulate in memory while full URLs append to an auxiliary file. At flush, hashes are sorted and sequentially merged against the known set; unseen URLs emerge in first-seen order [S1, §4.1; S12].
2. **Durable ready stream.** Sieve output is appended to a byte-array disk queue. The distributor drains it in batches and maps scheme+authority to a visit state [S3, lines 488–495 and 799–819; S4].
3. **Hot workbench plus cold tails.** A bounded in-memory FIFO per active origin holds near-term paths. Overflow goes to an origin FIFO in memory-mapped append-only log files. Each item points to the next item for its origin; in-memory head/tail/count metadata permits FIFO access. Compaction scans live queues when fill ratio drops [S1, §4.6; S13; S14].

**CONTRADICTION RESOLVED — High confidence.** The generated `WorkbenchVirtualizer` class description calls itself “based on a Berkeley DB database” and retains Berkeley imports, while its implementation delegates to custom `ByteArrayDiskQueues`; that class implements the paper's memory-mapped append-only logs. The paper says Berkeley DB was tried and rejected as an object-allocation bottleneck [S1, §4.6; S13; S14]. Treat the class-level phrase as stale documentation, not implementation truth.

### 4.2 URL and content dedup are different

**FACT — High confidence.** Before routing, a striped approximate LRU cache stores 128-bit URL fingerprints. The paper reports that this removes more than 90% of discovered URL occurrences and, in distributed runs, avoids repeatedly transmitting popular remote-owned links. It is only a hot filter; the sieve is the permanent discovery memory [S1, architecture overview; S15].

**FACT — High confidence.** The permanent sieve's 64-bit fingerprint can collide. The authors explicitly warn that collision probability becomes significant above a few hundred million discovered URLs per agent and suggest wider fingerprints [S1, §4.1]. Such a collision is a false “seen” and silently omits a URL.

**FACT — High confidence.** Content duplicate detection happens after fetch. Parsers compute a configurable digest into a Bloom filter. HTML digesting removes attributes, normalizes tags/whitespace, and replaces digits, with optional host seeding so default near-duplicate suppression is intra-site. Duplicate responses are distinguished from first-seen “archetypes” for storage/statistics [S1, §4.4; S16].

**RECOMMENDATION.** Curiosity should keep four identifiers separate: raw URL, canonical URL, fetch key, and content digest. The durable URL-seen index must have an explicit collision/false-positive budget. Never let a capacity guess silently increase omission rates. Content dedup should not suppress provenance, fetch events, or policy evidence.

### 4.3 Breadth-first semantics

**FACT — High confidence.** The sieve preserves first-appearance order and each origin queue is exact FIFO, so BUbiNG guarantees hostwise breadth-first traversal. Global traversal is only best effort: politeness, host responsiveness, adaptive front expansion, todo buffering, distribution, and virtualization perturb order [S1, introduction and §§4.1, 4.2, 4.6–4.7].

**INFERENCE.** Per-origin FIFO is a useful reproducibility invariant. “Global BFS” is not a defensible service-level contract for a distributed polite crawler unless depths are explicitly persisted and globally coordinated.

## 5. Fetching, parsing, and storage

**FACT — High confidence.** Fetching uses synchronous Apache HTTP client calls. A fetcher may consume multiple resources from the same origin for a configured keep-alive time, but it waits for a parser to consume/release its reusable `FetchData` before continuing. Redirect following is disabled for ordinary fetches; `Location` is extracted by parsing and scheduled as a link. Bodies retain a fixed prefix in memory, spill the remainder to disk, and stop at `responseBodyMaxByteSize` [S1, §4.3; S2; S3, lines 452–470; S6, lines 337–365].

**FACT — High confidence.** Parsing is pluggable and filter-controlled at separate stages: fetch, schedule, parse, follow, and store. The HTML parser uses Jericho, resolves links, tracks header/meta redirects, can omit `nofollow` links, and computes a normalized content digest. Each parsing thread gets copies of configured parsers [S1, §§4.4, 4.8–4.9; S6, lines 239–245 and 337 onward; S16].

**FACT — High confidence.** Default storage is compressed WARC. Parsing threads compress independently and pass data to a writer/flusher, separating CPU compression from serial output. The docs recommend separating frontier random I/O, response spill, WARC output, and logs across disks [S1, architecture overview; S2, “How BUbiNG uses disks”].

**RECOMMENDATION.** Curiosity should preserve a raw bounded response artifact before parser-specific extraction, attach parser/version and normalization version, and make store acceptance independent from link-follow decisions. Parser failure must release the origin lease and emit a terminal/retryable outcome.

## 6. Stop, snapshot, and restart

**FACT — High confidence.** `pause()` only blocks activity. `stop()` starts a coordinated shutdown: stop intake/message handling, join distributor and DNS workers, wait/abort fetchers, drain parse results where possible, return todo/done states to the workbench, refill empty states with disk tails, close WARC/store/sieve, then write a snapshot [S2, “Pausing, suspending or stopping”; S17, lines 129–154; S3, lines 691–797].

**FACT — High confidence.** The snapshot writes scalar counters/configuration-derived state, content-digest Bloom filter, per-origin counts, serialized visit states and their IP association; freezes ready/received disk queues; and closes the virtualizer after writing queue metadata. Robots sentinel entries are removed before snapshot and reinserted on restore when necessary. Restore reopens the sieve, deserializes workbench state, reloads virtualizer metadata, reopens queues at recorded lengths, and renames the consumed `snap` directory with its epoch [S3, lines 851–1047; S13, lines 145–204].

**FACT — High confidence, negative result.** Source search found `snap()` invoked after orderly `Agent.stop()` only, not a periodic checkpoint path [S17, lines 129–154]. Snapshot files are written directly into a newly created `snap` directory, not staged behind an atomic manifest/commit marker. Restore even tolerates an early EOF in serialized workbench state and logs missing states [S3, lines 865–945 and 1010–1035].

**INFERENCE — High confidence.** This is restart after graceful shutdown, not demonstrated crash consistency. A process/power failure during crawl or snapshot can lose post-snapshot/in-flight state or expose a partial snapshot. Network handoffs in flight are not shown as part of an atomic distributed checkpoint.

**VERDICT — REJECT direct pattern.** Curiosity needs a recoverable state machine: durable enqueue before acknowledgement, leased/in-flight records with expiry, idempotent fetch/store identity, generation-stamped snapshot manifest, checksummed components, atomic publish, and recovery tests for kill-at-every-boundary. At-least-once refetch is preferable to silent loss.

## 7. Distribution

**FACT — High confidence.** All agents are peers and hold the same component types; no leader or central frontier is required. Default assignment hashes by host using consistent hashing, so an origin has one owner and most same-site links stay local. Remote URLs travel through JGroups, by default UDP; management and statistics use TCP-based JMX. Membership changes drive the assignment abstraction [S1, §4.10; S2, “Starting a crawl”; S18].

**FACT — High confidence.** The local URL cache is checked before owner routing. Therefore it reduces both sieve load and duplicate inter-agent traffic. Each owner still has an independent sieve, workbench, DNS mapping, store, and snapshot [S1, architecture overview and §4.10; S3, lines 593–640].

**UNKNOWN / risk.** The reviewed BUbiNG source depends on JAI4J using an unpinned `latest.release`, and JGroups is transitively supplied; we did not inspect that dependency's version or delivery guarantees [S18]. The evidence does not establish durable acknowledgement, replay after agent loss, split-brain behavior, or snapshot coordination. “Fault-tolerant” consistent assignment means limited remapping on membership change; it does not by itself preserve URLs queued only on a failed node.

**RECOMMENDATION.** If Curiosity distributes crawling, separate deterministic partition ownership from durable delivery. Require epochs/fencing, per-origin single-owner leases, an IP-level coordinator or conservatively shared token bucket, durable outbox/inbox IDs, replay, and chaos tests. Consistent hashing alone is not a failure protocol.

## 8. Measured scale and what it proves

| Experiment reported by authors | Result | What it supports | Caveat |
|---|---:|---|---|
| One real-web iStella agent, 48 cores, 512 GB, 2 Gb/s link | steady 1.2 Gb/s; ~85% CPU; table reports 3,700 resources/s and 154 MB/s over 500M resources | A single agent could saturate a large WAN link while parsing/storing | Workload was `.it`; hardware large; no independent reproduction [S1, §§5.3–5.4, Table 1]. |
| Four 64-core/64 GB agents, synthetic proxy | 1B resources; 40,600/s overall, 10,150/s/agent; 640 MB/s overall | Near-linear per-agent throughput under controlled simulation | Short synthetic pages and proxy behavior; not Internet latency/content mix [S1, §§5.1, 5.4, Table 1]. |
| No-I/O internal generation, 40 cores | average 16,000 pages/s, peak 22,500 through 6,000 threads; 15,300 average at 8,000 | Workbench sandwich reduced internal contention; reported ~30% gain vs direct workbench access | Removes network and storage; author comparison, not a release benchmark [S1, §5.1]. |
| Three production datasets | 1.27B–1.48B fetched responses each; ~0.79B–1.07B archetypes | Sustained billion-scale collection and content dedup | Dataset quality/completeness is not established by count alone [S1, §6, Table 2]. |

**FACT — High confidence.** The paper's formal publication is ACM TWEB 12(2), 2018, article 12, DOI [`10.1145/3160017`](https://doi.org/10.1145/3160017). The author-hosted PDF has stale placeholder metadata (“2010”, volume 9/article 39, dummy DOI); Crossref and ACM resolve the final record [S19].

**INFERENCE.** The experiments validate the architecture's ability to expose concurrency and control contention on the tested stack. They do not validate current HTTP/2/3 behavior, cloud NAT limits, contemporary Java, RFC 9309 compliance, crash recovery, adversarial traps, or cluster-wide politeness.

## 9. Project status, license, and clean-room boundary

**FACT — High confidence.** The repository's latest observed commit is `50769f8` dated 2021-11-04; `build.properties` identifies version 0.9.15, and GitHub exposes only tags 0.9.13 and 0.9.15 [S20]. No claim of active maintenance is made here; a quiet repository is not necessarily abandoned.

**FACT — High confidence, contradiction retained.** Repository `LICENSE.txt`, source headers, the paper, and POM model all say **Apache License 2.0** [S1; S21; S22]. The LAW product page currently says BUbiNG is under the **GNU GPL** while linking that same repository [S23]. No repository `NOTICE` file was observed in the inspected tree.

**VERDICT — DEFER code reuse.** The repository-level license evidence is stronger for that exact source tree, but the first-party contradiction requires legal/provenance resolution before copying, linking, or redistributing. Apache-2.0 still requires retaining notices, providing the license, marking modified files, and handling any NOTICE file if one exists. Dependencies have separate obligations, and the build's `latest.release` declarations make a historical binary's dependency bill of materials non-reproducible [S18, S21].

**Clean-room rule for Curiosity:**

- Allowed now: independently implement public architectural ideas and behavioral invariants documented here.
- Not allowed under this study: copy source, tests, serialized formats, constants, parser logic, or distinctive code structure; import BUbiNG artifacts; represent BUbiNG as Curiosity project code.
- Before any reuse: identify exact commit/artifact, resolve Apache/GPL discrepancy with counsel or maintainer, inventory transitive licenses, record attribution and transfer history in `provenance/`, and review modern robots/security behavior.

## 10. Curiosity requirements derived from BUbiNG

1. **Origin model:** scheduling key is normalized `(scheme, host, effective port)`; IP grouping is a second, expiring DNS-derived key.
2. **Eligibility:** no fetch without both an origin lease and IP budget. In a cluster these constraints are global, not local heuristics.
3. **Frontier:** per-origin FIFO ordering; bounded hot URLs; durable cold tails; fairness and starvation metrics; explicit crawl-depth if global BFS is claimed.
4. **Dedup:** hot approximate cache is advisory; authoritative durable URL-seen state has versioned canonicalization and stated collision/error bounds.
5. **Backpressure:** every stage has count and byte caps; parser lag throttles fetch; body bytes are capped before untrusted parsing.
6. **Robots:** RFC 9309 conformance suite, fail-closed unreachable policy, 24-hour normal cache ceiling, at least 500 KiB parse support, last-good policy retention, and bounded redirects.
7. **DNS/security:** TTL-aware re-resolution, answer-set policy, private/link-local/metadata denial after every resolution, rebinding defense, IPv4/IPv6 parity.
8. **Recovery:** durable enqueue/ack, lease expiry, idempotent artifacts, committed snapshot generations, corruption detection, and forced-crash tests.
9. **Distribution:** partition epochs and fencing; durable handoff; no claim that consistent hashing alone provides fault tolerance.
10. **Observability:** front size, eligible IPs/origins, queue residence, dedup outcomes, DNS/robots states, politeness delay, retries, parse saturation, spill bytes, and recovery replay are first-class metrics.

## 11. Unknowns and validation checks

### Material unknowns

- **Distributed delivery semantics (medium impact):** JAI4J/JGroups source and exact resolved versions were not inspected; URL loss/duplication under membership churn remains unknown.
- **Crash behavior (high impact):** no kill/recover experiment was run. The source supports only an inference that arbitrary crash consistency is weak.
- **DNS freshness (medium impact):** healthy-origin re-resolution behavior and multi-address rotation were not found.
- **Measured crawl configuration (medium impact):** complete configs, raw logs, and independent replications for the headline results were not found.
- **License conflict (high impact for reuse):** no maintainer clarification explains the GPL product-page statement versus Apache repository artifacts.
- **Modern protocol support (medium impact):** no evidence of HTTP/2, HTTP/3, current TLS posture, or post-2021 maintenance was found.

### Checks before using any lesson in design

- Reproduce a frontier simulation with skewed origins, many hostnames per IP, DNS changes, long tails, and strict IP delays.
- Property-test no-overlap origin/IP leases and exact per-origin FIFO after spill/refill/restart.
- Run RFC 9309 fixtures plus malformed, oversized, timeout, 4xx, 5xx, and redirect-chain cases.
- Crash after every durable transition; verify no silent URL loss and bounded duplicate refetch.
- Benchmark end-to-end with real content-size/latency distributions; report pages/s **and** bytes/s, CPU, queue delay, omissions, and politeness violations.
- Obtain a legal decision on the exact BUbiNG commit before any implementation team views source-derived details beyond this behavioral report.

## 12. Bounded curiosity pass

Budget: one follow-up pass after synthesis; only gaps scoring high on relevance/value and low-to-moderate cost were pursued. Scores are 1–5 (higher cost is worse).

| Thread | Relevance | Value | Novelty | Cost | Action/result |
|---|---:|---:|---:|---:|---|
| Does “fully respects robots” hold under the current standard? | 5 | 5 | 5 | 2 | **Pursued.** Found material incompatibilities: no `Allow`/general wildcard/end-anchor and 5xx allow-all versus RFC 9309 fail-closed [S9, S10]. |
| Is the virtualizer Berkeley DB or custom logs? | 4 | 4 | 4 | 1 | **Pursued.** Resolved stale Javadoc: implementation is custom memory-mapped queues, consistent with the paper [S1, S13, S14]. |
| Is restart a checkpoint or graceful snapshot? | 5 | 5 | 4 | 2 | **Pursued.** Call-site/source review found orderly-stop snapshot only; no periodic crash-consistent checkpoint [S3, S17]. |
| Exact JAI4J retransmission/membership protocol | 4 | 4 | 3 | 5 | **CURIOSITY_NO_GO.** External unpinned dependency; would require separate version archaeology and source audit beyond budget. |
| Re-run billion-page benchmark | 3 | 5 | 2 | 5 | **CURIOSITY_NO_GO.** Disproportionate cost, external bandwidth/ethics, and not needed to extract architectural lessons. |
| Resolve license contradiction with maintainers | 5 | 5 | 3 | 4 | **CURIOSITY_NO_GO.** Requires external correspondence/legal authority; retained as blocking unknown. |
| Reverse serialized snapshot compatibility | 2 | 2 | 2 | 4 | **CURIOSITY_NO_GO.** Out of clean-room scope and no Curiosity value; format reuse is rejected. |

**Stop condition:** coverage achieved for every requested subsystem; the best low-cost contradictions were resolved; remaining high-value gaps require external authority, live experiments, or a separate dependency/license investigation.

## Sources

All links accessed 2026-08-17. Primary sources are preferred; source links are pinned where possible.

- **[S1]** Boldi, Marino, Santini, Vigna, [“BUbiNG: Massive Crawling for the Masses”](https://vigna.di.unimi.it/ftp/papers/BUbiNG.pdf), author-hosted full paper; final bibliographic record at [ACM DOI 10.1145/3160017](https://doi.org/10.1145/3160017). **Primary paper.**
- **[S2]** BUbiNG 0.9.15, [official overview/configuration documentation](https://law.di.unimi.it/software/bubing-docs/overview-summary.html). **Primary docs.**
- **[S3]** BUbiNG, [`Frontier.java`](https://github.com/LAW-Unimi/BUbiNG/blob/50769f87a1ce13bc2f7335866eb9b8b79cd668c2/src/it/unimi/di/law/bubing/frontier/Frontier.java). **Primary source.**
- **[S4]** BUbiNG, [`Distributor.java`](https://github.com/LAW-Unimi/BUbiNG/blob/50769f87a1ce13bc2f7335866eb9b8b79cd668c2/src/it/unimi/di/law/bubing/frontier/Distributor.java). **Primary source.**
- **[S5]** BUbiNG 0.9.15, [`VisitState` API](https://law.di.unimi.it/software/bubing-docs/it/unimi/di/law/bubing/frontier/VisitState.html) and [frontier package model](https://law.di.unimi.it/software/bubing-docs/it/unimi/di/law/bubing/frontier/package-summary.html). **Primary docs.**
- **[S6]** BUbiNG, [`ParsingThread.java`](https://github.com/LAW-Unimi/BUbiNG/blob/50769f87a1ce13bc2f7335866eb9b8b79cd668c2/src/it/unimi/di/law/bubing/frontier/ParsingThread.java). **Primary source.**
- **[S7]** BUbiNG, [`DNSThread.java`](https://github.com/LAW-Unimi/BUbiNG/blob/50769f87a1ce13bc2f7335866eb9b8b79cd668c2/src/it/unimi/di/law/bubing/frontier/DNSThread.java). **Primary source.**
- **[S8]** BUbiNG, [`StartupConfiguration.java`](https://github.com/LAW-Unimi/BUbiNG/blob/50769f87a1ce13bc2f7335866eb9b8b79cd668c2/src/it/unimi/di/law/bubing/StartupConfiguration.java). **Primary source.**
- **[S9]** BUbiNG, [`URLRespectsRobots.java`](https://github.com/LAW-Unimi/BUbiNG/blob/50769f87a1ce13bc2f7335866eb9b8b79cd668c2/src/it/unimi/di/law/bubing/util/URLRespectsRobots.java). **Primary source.**
- **[S10]** IETF, [RFC 9309: Robots Exclusion Protocol](https://www.rfc-editor.org/rfc/rfc9309.html), September 2022. **Primary standard.**
- **[S11]** BUbiNG, [`DnsJavaResolver.java`](https://github.com/LAW-Unimi/BUbiNG/blob/50769f87a1ce13bc2f7335866eb9b8b79cd668c2/src/it/unimi/di/law/bubing/frontier/dns/DnsJavaResolver.java). **Primary source.**
- **[S12]** BUbiNG 0.9.15, [`MercatorSieve` API](https://law.di.unimi.it/software/bubing-docs/it/unimi/di/law/bubing/sieve/MercatorSieve.html). **Primary docs.**
- **[S13]** BUbiNG, [`WorkbenchVirtualizer.java`](https://github.com/LAW-Unimi/BUbiNG/blob/50769f87a1ce13bc2f7335866eb9b8b79cd668c2/src/it/unimi/di/law/bubing/frontier/WorkbenchVirtualizer.java). **Primary source.**
- **[S14]** BUbiNG, [`ByteArrayDiskQueues.java`](https://github.com/LAW-Unimi/BUbiNG/blob/50769f87a1ce13bc2f7335866eb9b8b79cd668c2/src/it/unimi/di/law/bubing/util/ByteArrayDiskQueues.java). **Primary source.**
- **[S15]** BUbiNG, [`FastApproximateByteArrayCache.java`](https://github.com/LAW-Unimi/BUbiNG/blob/50769f87a1ce13bc2f7335866eb9b8b79cd668c2/src/it/unimi/di/law/bubing/util/FastApproximateByteArrayCache.java). **Primary source.**
- **[S16]** BUbiNG, [`HTMLParser.java`](https://github.com/LAW-Unimi/BUbiNG/blob/50769f87a1ce13bc2f7335866eb9b8b79cd668c2/src/it/unimi/di/law/bubing/parser/HTMLParser.java). **Primary source.**
- **[S17]** BUbiNG, [`Agent.java`](https://github.com/LAW-Unimi/BUbiNG/blob/50769f87a1ce13bc2f7335866eb9b8b79cd668c2/src/it/unimi/di/law/bubing/Agent.java). **Primary source.**
- **[S18]** BUbiNG, [`ivy.xml`](https://github.com/LAW-Unimi/BUbiNG/blob/50769f87a1ce13bc2f7335866eb9b8b79cd668c2/ivy.xml) and [`Agent` API](https://law.di.unimi.it/software/bubing-docs/it/unimi/di/law/bubing/Agent.html). **Primary build/source docs.**
- **[S19]** Crossref, [metadata for DOI 10.1145/3160017](https://api.crossref.org/works/10.1145/3160017); ACM, [article record](https://dl.acm.org/doi/10.1145/3160017). **Publisher/registry metadata.**
- **[S20]** GitHub API, [latest inspected commit](https://api.github.com/repos/LAW-Unimi/BUbiNG/commits/master), [tags](https://api.github.com/repos/LAW-Unimi/BUbiNG/tags); repository [`build.properties`](https://github.com/LAW-Unimi/BUbiNG/blob/50769f87a1ce13bc2f7335866eb9b8b79cd668c2/build.properties). **Primary repository metadata.**
- **[S21]** BUbiNG, repository [`LICENSE.txt`](https://github.com/LAW-Unimi/BUbiNG/blob/50769f87a1ce13bc2f7335866eb9b8b79cd668c2/LICENSE.txt). **Primary legal artifact.**
- **[S22]** BUbiNG, repository [`pom-model.xml`](https://github.com/LAW-Unimi/BUbiNG/blob/50769f87a1ce13bc2f7335866eb9b8b79cd668c2/pom-model.xml). **Primary package metadata.**
- **[S23]** Laboratory for Web Algorithmics, [software page, BUbiNG section](https://law.di.unimi.it/software.php#bubing). **First-party product page; contradictory license statement retained.**
