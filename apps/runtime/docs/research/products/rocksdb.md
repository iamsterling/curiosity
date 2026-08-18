# RocksDB for crawl-frontier and document-metadata state

**Research and source-access date:** 2026-08-17  
**Scope:** clean-room study of published RocksDB documentation, an open-access
paper, public headers, and repository license files. No RocksDB code was copied,
executed, modified, benchmarked, or incorporated into Curiosity.

## Decision frame

**Decision:** Should Curiosity use RocksDB as the embedded ordered state engine
inside a crawl-frontier shard and/or for document metadata, and under what
durability, key-order, compaction, transaction, and operational constraints?

Bounded sub-questions:

1. What does the memtable/WAL/SST/MANIFEST path actually guarantee after a
   process crash, machine/power failure, and partial write?
2. How do compaction, tombstones, snapshots, iterators, prefixes, and range
   scans interact with frontier churn and metadata history?
3. Can a due-time/priority queue, per-host politeness state, URL state, and
   document metadata be updated and claimed safely?
4. Which transaction guarantees are local, which conflicts are detected, and
   what remains the application's distributed-systems responsibility?
5. What tuning, observability, recovery, backup, security, compatibility, and
   license work would adoption create?

Labels used below: **FACT** is directly supported by cited primary material;
**INFERENCE** is a bounded conclusion from those facts; **RECOMMENDATION** is a
Curiosity-specific proposal; **UNKNOWN** was not established. Confidence is
**high**, **medium**, or **low** for the claim as written.

## Executive verdict

**ADAPT, do not yet select as the system-wide authority.** RocksDB is a strong
candidate for **single-writer, locally sharded, ordered crawl state**: it offers
high-write-rate ordered key/value storage, atomic `WriteBatch` updates across
column families, snapshots, bounded iterators, point/prefix filters, WAL
recovery, checksums, backups, and mature compaction observability. It is an
embedded storage engine, not a replicated queue or database service. Only one
primary may open a database; replication, shard ownership, fencing, failover,
authorization, encryption deployment, and global scheduling are outside its
core contract.[S1][S16][S24]

The workload fit is conditional. Frontier records are small and frequently
rewritten, scans are naturally ordered by due time/host, and metadata has many
point reads—all favorable. But reprioritization creates delete-plus-insert
churn; consumed queues accumulate tombstones; long snapshots retain old
versions; large metadata values are repeatedly rewritten by compaction; and a
single lagging column family can retain shared WALs or stall the whole DB.
RocksDB therefore should hold compact control records and references, not raw
documents or large extracted payloads.[S2][S3][S9][S11][S12]

**Provisional Curiosity disposition:**

- **ADOPT** ordered byte-key semantics, atomic local batches, checksummed
  immutable files, explicit write durability classes, and observable
  backpressure as design requirements.
- **ADAPT** RocksDB behind a provider-neutral shard-state contract, with
  independently specified key schemas and recovery invariants.
- **REJECT** unsynced acknowledgement for irreplaceable crawl transitions,
  unbounded/long-lived iterators, automatic TTL as an exact scheduler, and
  `SingleDelete` for mutable URL state.
- **DEFER** production selection until replay/crash, contention, compaction,
  disk-headroom, and failover tests use a representative frontier trace.
- **REJECT** treating one RocksDB directory, its WAL tail, or a secondary
  instance as a distributed consensus or cross-host lease mechanism.

**Overall confidence:** high on documented storage and API behavior; medium on
the proposed Curiosity mapping; low on capacity, latency, and cost until a
representative trace and deployment topology exist.

## 1. Storage and recovery model

### 1.1 Write path: memtables, WAL, SSTables, and MANIFEST

- **FACT (high):** RocksDB is a C++ embedded ordered key/value engine. Keys and
  values are arbitrary byte strings; primary operations include point lookup,
  put/delete, and forward/reverse range iteration. It is designed around an
  LSM architecture and fast storage.[S1][S24]
- **FACT (high):** A normal update enters an in-memory memtable and, unless the
  caller disables it, the write-ahead log. A full memtable becomes immutable
  while another accepts writes, then flushes as a sorted immutable SST file in
  L0. A WAL can be removed only after every column family whose live data it
  contains has flushed beyond it.[S1][S2][S11]
- **FACT (high):** The default memtable is a sorted skip list. Memtables can be
  pipelined. Flush can discard overwritten versions that no snapshot needs,
  reducing later work. The current public options header documents a 64 MiB
  default `write_buffer_size`, enforced per column family, and warns that a
  larger buffer increases recovery time.[S1][S25]
- **FACT (high):** The default block-based SST consists of sorted data blocks,
  an index, optional filter and compression metadata, properties, a distinct
  range-deletion block, a meta-index, and footer. SST blocks are checksummed;
  SST files are immutable after creation.[S1][S6]
- **FACT (high):** The MANIFEST is a transactional log of database structural
  state—file additions/deletions, sequence state, comparator, column families,
  and related edits. `CURRENT` points to the active MANIFEST. Atomic edit groups
  are buffered during recovery and never partially applied.[S7]
- **INFERENCE (high):** “In the database” has several physical meanings:
  acknowledged logical state may reside only in WAL+memtable, then in one or
  more overlapping SST versions, while MANIFEST—not directory enumeration—says
  which files constitute the current DB. Curiosity must never manipulate SST,
  WAL, `CURRENT`, or MANIFEST files as an application-level queue.

### 1.2 Durability and crash recovery

- **FACT (high):** `WriteOptions.sync=false` is the default. In that mode WAL
  data is not synchronized to stable storage; `manual_wal_flush=true` can keep
  it even out of the filesystem page cache until `FlushWAL`. `sync=true`
  synchronizes the WAL before returning. Concurrent eligible writes may group
  commit under one WAL write and sync.[S3]
- **FACT (high):** A `WriteBatch` applies multiple updates atomically, including
  across column families. With WAL enabled, the shared WAL preserves a
  consistent cross-column-family recovery view. Atomic flush can preserve an
  all-or-none multi-column-family flush boundary when WAL is disabled; writes
  acknowledged before the corresponding flush remain vulnerable.[S1][S10][S11]
- **FACT (high):** WAL recovery supports four policies. Current source names
  point-in-time recovery as default: replay stops before an inconsistency. The
  strict mode fails on any WAL inconsistency; tail-tolerant mode tolerates an
  incomplete final record; salvage mode skips corruption and can lose logical
  continuity.[S4][S25]
- **FACT (high):** Current public API comments say `DB::Close()` does not itself
  sync WAL files; callers requiring that boundary must sync first. The options
  also expose stronger WAL-presence/size and predecessor verification, but the
  current header marks some of that tracking off by default or experimental.
  Per-record/block checksums detect corruption; checksums do not create a
  replica or recover missing durable bytes.[S25][S26][S32]
- **INFERENCE (high):** A successful default write is not a power-loss durable
  queue acknowledgement. OS page-cache persistence may survive a process crash,
  but it is not the stable-storage contract Curiosity needs for an irreversible
  transition such as “URL claimed and prior schedule removed.”
- **RECOMMENDATION (high):** Specify three application durability classes:
  (1) **durable control transition**—WAL enabled and synced before acknowledge;
  (2) **replayable derived metadata**—WAL enabled but potentially group-synced
  by an explicit bounded policy; (3) **discardable cache**—loss is declared and
  reconstructable. Never permit call-site defaults to select the class.
- **RECOMMENDATION (high):** On recovery, reconcile `claimed` items by lease
  epoch/deadline and idempotency token; do not equate WAL replay with remote
  fetch completion. A fetch can have happened while the local completion write
  was lost, or vice versa.

## 2. Compaction and amplification

### 2.1 Why compaction is correctness-adjacent

- **FACT (high):** L0 files may overlap. Lower levels normally contain one
  non-overlapping sorted run per level. Compaction merges selected sorted runs,
  discards overwritten/deleted versions when safe, and controls read and space
  amplification. Sustained write throughput depends on compaction keeping up.
  RocksDB deliberately exposes trade-offs among write, read, and space
  amplification.[S1][S5]
- **FACT (high):** Default level compaction favors lower space/read
  amplification but can rewrite overlapping data repeatedly. Universal/tiered
  compaction generally reduces write amplification while increasing read and
  transient space amplification. FIFO drops oldest files and is intended for
  cache-like data, not semantic expiration of individually scheduled URLs.[S1][S5]
- **FACT (high):** Synchronous WAL can itself have high device write
  amplification for tiny writes because filesystem data/metadata blocks are
  larger than logical records. Compaction statistics separately report bytes
  read/written, write amplification, files, key drops, throughput, and stalls.
  The FAST '21 paper reports that RocksDB's development priorities evolved from
  write amplification to space amplification and then CPU utilization.[S3][S19][S37]
- **INFERENCE (high):** Frontier WAF has at least four contributors: WAL,
  memtable flush, repeated level compaction, and application-level secondary
  index maintenance. A “small 100-byte state change” can consume much more
  storage bandwidth, particularly when reprioritization rewrites both canonical
  URL state and due-order entries.

### 2.2 Frontier-specific pressure

- **INFERENCE (high):** A due-time key index makes dequeue scans efficient, but
  changing priority/due time cannot mutate a key in place; it logically deletes
  the old ordered entry and inserts a new one. Frequent discovery duplicates,
  backoff, robots changes, and retries therefore create tombstones and stale
  versions concentrated in hot key ranges.
- **FACT (high):** RocksDB's own queue guide warns that deleting oldest items
  leaves many tombstones at the beginning of each queue, making scans from zero
  and stepping past the queue end exceptionally slow. It recommends remembering
  queue bounds and always setting an iterator upper bound; a deletion-aware
  table-properties collector can prioritize cleanup.[S9]
- **INFERENCE (high):** A global chronological frontier also concentrates
  writes and compaction around “now.” Encoding host directly before due time
  improves host-local scans but loses a globally ordered due queue. One physical
  order cannot optimize global due selection, host politeness, canonical-URL
  lookup, and document lookup simultaneously; secondary indexes or separate
  shards are unavoidable.
- **RECOMMENDATION (high):** Keep canonical state in one compact record and
  treat ordered frontier entries as generation-stamped derived indexes. Claim
  must atomically validate the generation/state and update canonical state,
  host budget, and index entries. Stale ordered entries should be safely
  ignorable, bounded, and later deleted.
- **RECOMMENDATION (high):** Store content bodies, WARC records, and large
  extracted text in object storage. RocksDB metadata should contain bounded
  identifiers, timestamps, status, digests, policy/provenance references, and
  object locations. This limits compaction rewrites and keeps block/cache
  behavior predictable.

### 2.3 Stalls and disk headroom

- **FACT (high):** Writes slow or stop when too many immutable memtables await
  flush, L0 file counts cross thresholds, or pending compaction bytes exceed
  soft/hard limits. A trigger is per column family, but its stall applies to the
  whole DB. `WriteOptions.no_slowdown` can return `Incomplete` rather than block.
  Background I/O errors can put a DB into degraded or read-only state.[S12][S18]
- **FACT (high):** Compaction needs temporary output space while inputs still
  exist. `SstFileManager` can track/cap SST space, but its total excludes WAL;
  hitting the cap can make the DB read-only, and conservative headroom checks
  can defer compaction.[S14]
- **RECOMMENDATION (high):** Backpressure must propagate from RocksDB to
  discovery and fetch admission. Do not turn off stall limits to hide debt.
  Reserve disk for live SSTs, compaction overlap, WALs, logs, checkpoints, and
  emergency recovery—not merely logical live-value size.

## 3. Snapshots, iterators, and deletion

### 3.1 Point-in-time reads and resource retention

- **FACT (high):** An iterator without an explicit snapshot creates an implicit
  point-in-time view at iterator creation. An explicit snapshot identifies a
  sequence-number view and can be used by `Get`/iterator. Snapshots do not
  survive DB restart.[S1][S8][S13]
- **FACT (high):** Iterators pin memtables/SST files and current data blocks;
  stale iterators can prevent obsolete resources from being released.
  Snapshots instead cause compaction to preserve versions visible to them.
  Large numbers of snapshots can slow flush/compaction enough to cause stalls.
  Iterator invalidity means either end-of-range or error, so status must be
  checked.[S8][S13]
- **INFERENCE (high):** Snapshot-consistent scans are valuable for audit/export,
  but a scheduler should not hold one while waiting for network capacity. It
  would both ignore newly due work and preserve obsolete queue versions.
- **RECOMMENDATION (high):** Scheduler scans must be short, upper-bounded by
  key and item/time budget, and destroy iterators promptly. Resume with a fresh
  iterator plus an application cursor, then transactionally revalidate each
  candidate. Use checkpoints—not live snapshots—for durable point-in-time
  inspection.[S20]

### 3.2 Point and range tombstones

- **FACT (high):** `Delete` inserts a logical deletion that hides older values;
  reclamation occurs later when compaction proves the hidden versions are no
  longer needed. `DeleteRange([begin,end))` writes one range tombstone and is
  atomic, but many range tombstones can degrade reads and memory use. Range
  tombstones are stored separately in SSTs and are dropped only when safe at
  bottommost compaction.[S6][S21][S26]
- **FACT (high):** `SingleDelete` has a strict precondition: exactly one `Put`
  since the preceding `SingleDelete`, without incompatible `Delete`/`Merge`
  history. Overwrite misuse has undefined behavior and can let older versions
  reappear.[S22][S26]
- **FACT (high):** Compaction filters can remove/modify records in the
  background, but since RocksDB 6.0 filtering can make an existing snapshot
  non-repeatable. A skip-until filter can expose older versions if its
  application invariant is wrong. `DBWithTTL` expires only during compaction,
  so reads may return expired records indefinitely until compaction reaches
  them.[S15][S23]
- **RECOMMENDATION (high):** Use ordinary deletion for mutable URL/document
  state. Consider `DeleteRange` only for demonstrably isolated epochs/tenants
  with tested bounds and read effects. **Reject `SingleDelete`** for frontier
  entries because retries/reprioritization violate its history precondition.
- **RECOMMENDATION (high):** TTL/compaction filters may reclaim already
  logically expired leases or histories, but must never decide claim validity,
  robots expiry, legal deletion completion, or recrawl due state. Those checks
  belong in reads/transactions; compaction is nondeterministically later.

## 4. Key order, prefixes, and range behavior

- **FACT (high):** Default ordering is bytewise lexicographic. Custom
  comparators become an on-disk compatibility commitment: reopening must use a
  comparator with the same identity and exact order. Big-endian sortable
  encodings are therefore conventional for numeric queue sequence/time fields.
  RocksDB's queue guide explicitly recommends big-endian sequence IDs.[S9][S25]
- **FACT (high):** Iterator lower/upper bounds can avoid unnecessary work.
  Prefix Bloom filters can rule out sorted runs that lack a prefix, but only
  when the prefix extractor and comparator make equal prefixes contiguous.
  Bloom filters return “definitely absent” or “may exist,” never presence.[S8][S17][S25]
- **FACT (high):** Manual prefix mode is dangerous: misuse can silently return
  missing, unordered, deleted, or otherwise wrong results. Total-order mode is
  safe but may forgo the optimization; adaptive prefix mode preserves
  total-order results only under documented extractor/comparator/bound
  constraints. Reverse and edge seeks have additional limitations.[S17]
- **INFERENCE (high):** Prefix filtering is a performance feature, not a
  namespace or authorization boundary. An omitted upper bound or malformed
  tenant/host prefix can scan adjacent records, leak data to application code,
  or consume unbounded I/O even if the database itself remains correct.
- **RECOMMENDATION (high):** Specify a versioned, length-delimited key grammar
  and byte-order tests independent of RocksDB. Every logical prefix scan must
  carry a computed exclusive upper bound and application-level prefix check.
  Begin with total-order correctness; enable adaptive prefix optimization only
  after differential tests prove equality with total-order scans.
- **RECOMMENDATION (medium):** Candidate orderings to benchmark, not prescribe:
  global due/priority/sequence for ready work; host+due for host-local work;
  canonical URL digest for state; document/capture ID for metadata. Maintain
  each required ordering as an explicit atomic secondary index rather than
  encoding unrelated access paths into one overloaded key.

## 5. Local atomicity, transactions, and concurrency

### 5.1 What is guaranteed

- **FACT (high):** A `WriteBatch` is atomic across keys and column families.
  Column families share WAL but have separate memtables/SSTs and independently
  configurable compaction. `MultiGet` and multi-column-family iterators can
  expose consistent views.[S1][S11][S26]
- **FACT (high):** `TransactionDB` provides pessimistic point-key locking;
  `OptimisticTransactionDB` validates tracked point-key conflicts at commit.
  A plain `Get` does not establish a read-write conflict; `GetForUpdate` does.
  Setting a transaction snapshot changes the conflict-validation origin, while
  repeatable-read data visibility still requires an appropriate read snapshot.
  Commit can fail if conflict history is no longer available.[S16][S27]
- **FACT (high):** Current transaction interface exposes a range-lock method,
  but its base implementation returns `NotSupported`; the ordinary documented
  transaction flow is point-key conflict tracking. This report assumes no
  predicate/range-lock guarantee unless a selected implementation documents
  and tests one. Prepared/2PC transactions persist prepare/commit state in WAL,
  but a non-OK commit after prepare can still require explicit resolution.[S27]
- **INFERENCE (high):** Scanning the “first due” key then deleting it is not by
  itself a serializable dequeue. Another worker can race, a newly inserted
  earlier key is a phantom, and a transaction does not automatically lock the
  scanned predicate. A queue claim must lock/validate the exact candidate and
  relevant host/ownership records, tolerate retry, and not promise strict
  global FIFO.

### 5.2 Curiosity claim model

- **RECOMMENDATION (high):** Within one shard, atomically transition a candidate
  from scheduled generation to a claim carrying shard epoch, worker token,
  deadline, and attempt ID; update the host politeness clock/counters in the
  same local transaction or batch; remove/obsolete the selected due-index
  entry. On commit conflict, discard and rescan within a bounded budget.
- **RECOMMENDATION (high):** Completion writes must be idempotent by attempt ID
  and reject stale ownership epochs. A local RocksDB lock is neither a network
  lease nor a fencing token after process failover.
- **RECOMMENDATION (high):** Make a single orchestrator own each primary DB
  shard. Use an external, separately designed ownership/consensus plane to
  assign epochs. On takeover, open/recover the shard, reconcile claims, and
  start work only after fencing the prior owner.
- **RECOMMENDATION (medium):** Prefer plain atomic batches where all
  preconditions are guaranteed by one serialized shard executor. Use
  `TransactionDB` only if multiple local threads truly contend and test its
  lock memory/timeouts/deadlocks. Defer optimistic and prepared write policies;
  they add failure modes without solving cross-host consensus.

## 6. Column-family and data-placement implications

- **FACT (high):** Column families permit atomic cross-family batches and
  different memtable/compaction settings, but a single WAL spans them. An
  infrequently flushed family can retain old WALs. Any family's compaction
  backlog can stall writes for the whole DB.[S2][S11][S12]
- **INFERENCE (high):** Column families are performance/failure domains only in
  part. Separating frontier, host, URL, and document metadata into many families
  can improve tuning but does not isolate write stalls, disk exhaustion, WAL
  retention, process failure, or shard ownership.
- **RECOMMENDATION (medium):** Start with few families grouped by similar
  lifecycle/value size, not one family per tenant/host or conceptual table.
  Split high-churn frontier control from colder/larger metadata into separate
  DB instances if profiling shows compaction interference; preserve atomicity
  requirements before making that split.

## 7. Tuning and operations

### 7.1 Tune from a trace, not folklore

- **FACT (high):** Official guidance says most defaults are acceptable starting
  points and warns that over-tuning one workload can push performance “off a
  cliff” after workload change. Important resources include write buffers,
  block cache, indexes/filters, file descriptors, background jobs, compaction
  I/O, and OS page cache.[S28][S29]
- **FACT (high):** Bloom filters help point misses and qualifying prefix seeks,
  not general range scans. Filters and indexes can consume substantial memory;
  iterators pin roughly one data block per L0 file plus each lower level at
  their position. Sharing cache and write-buffer budgets across DBs/families is
  supported.[S8][S28][S29]
- **RECOMMENDATION (high):** Benchmark at least: discovery-heavy inserts;
  duplicate/reprioritization churn; ready-range scans; host contention;
  random URL state lookup; metadata update; mass deletion; restart/replay;
  backup; and a compaction-debt burst. Measure p50/p95/p99/p99.9 claim/read/write
  latency, not only throughput.
- **RECOMMENDATION (high):** Tune `write_buffer_size`, L0 thresholds, level
  sizing, background jobs/subcompactions, compaction style, compression, block
  size/cache, filters, and rate limiter jointly. Record all non-default options
  and their rationale; compatibility depends on some options and formats.[S25][S30]

### 7.2 Required signals and runbooks

- **FACT (high):** RocksDB exposes cumulative tickers/histograms, current DB
  properties, per-operation perf/I/O context, periodic info logs, event
  listeners, and compaction stats. Full statistics commonly cost roughly
  5–10% according to official documentation, depending on level/platform.[S19][S31]
- **RECOMMENDATION (high):** Alert on L0 files, pending compaction bytes,
  immutable memtables, stall duration/count, WAL bytes/age, live/total SST size,
  block-cache hit and pinned usage, Bloom usefulness/false positives, background
  errors, open/recovery duration, disk free/headroom, snapshot/iterator age,
  transaction conflicts/timeouts, and logical frontier age by host class.
- **FACT (high):** Background write/flush/compaction errors can freeze writes;
  RocksDB classifies severity and supports event notification, manual resume,
  and limited automatic recovery. Overriding an error can violate consistency.
  Online checks include LSM consistency, block/full-file/per-KV checksums, and
  optional expensive post-SST verification.[S18][S32]
- **RECOMMENDATION (high):** A runbook must distinguish backpressure,
  out-of-space, transient I/O, checksum corruption, WAL recovery truncation,
  and logical frontier invariant failure. “Resume” is not a universal repair;
  quarantine and restore/rebuild on corruption.

### 7.3 Backup, restore, and failover

- **FACT (high):** Checkpoints create a consistent directory view, hard-linking
  SSTs on the same filesystem and copying other state/WAL coverage as needed.
  `BackupEngine` supports incremental shared immutable files, checksums,
  verification, restore, and remote `FileSystem` abstractions. RocksDB itself is
  not replicated.[S1][S20][S33]
- **FACT (high):** One primary is supported; multiple static read-only or
  catch-up secondary instances may coexist. Secondary catch-up is explicit,
  has documented filesystem/file-descriptor restrictions, does not support
  snapshot reads, and may miss primary memtable state when WAL is disabled.[S24]
- **INFERENCE (high):** A secondary is useful for inspection/read offload, not
  automatic failover or a read-after-write authority. Checkpoints/backups are
  recovery artifacts, not lease transfer.
- **RECOMMENDATION (high):** Test restore into a new directory and rebuild all
  logical counts/index invariants before promotion. Keep independent backups
  outside the primary failure domain; verify checksums and recovery-point age.
  Define whether frontier state is restored, replayed from an event log, or
  regenerated—each choice has duplicate-fetch and freshness consequences.

## 8. Security, privacy, and license

### 8.1 Security boundary

- **FACT (high):** RocksDB is an embedded library/file store, not a network
  service. The reviewed primary interfaces document filesystem access and
  read-only credentials but no built-in tenant authentication or request
  authorization layer.[S1][S24][S26]
- **UNKNOWN:** No authoritative project `SECURITY.md` or current official
  statement promising native transparent encryption at rest was found in the
  reviewed repository/docs. Filesystem abstractions are extensible, but this
  report does not treat that as a supported encryption guarantee.
- **INFERENCE (high):** URL strings, query parameters, robots decisions,
  redirect locations, headers, fetch errors, and document metadata may be
  sensitive. Copies can exist in WAL, live and obsolete SSTs, snapshots,
  checkpoints, backups, and info/diagnostic logs until each lifecycle expires.
- **RECOMMENDATION (high):** Run under a dedicated least-privilege OS identity;
  deny network exposure to admin tools; use approved volume/filesystem and
  backup encryption; manage keys outside RocksDB; restrict/rotate/sanitize info
  logs; inventory all DB/WAL/log/checkpoint/backup paths; and securely retire
  media. Treat values read from the database as persisted untrusted web-derived
  data, not trusted instructions.
- **RECOMMENDATION (high):** Enforce retention/deletion logically immediately,
  then bound physical purge through compaction and backup expiry. Do not claim
  byte erasure from `Delete`; immutable SST/version retention makes that false.
  Cryptographic erasure requires a separately reviewed encryption/key design.

### 8.2 License and clean-room boundary

- **FACT (high):** The current project README says RocksDB is dual-licensed,
  at the user's option, under GPLv2 or Apache License 2.0. Repository headers
  repeat that notice. The tree also contains LevelDB-derived code under its
  three-clause BSD-style license notice.[S34][S35][S36]
- **RECOMMENDATION (high):** If adopted, select and record the Apache-2.0 path,
  preserve required notices/LICENSE and LevelDB attribution, inventory linked
  compression/binding dependencies separately, and obtain normal legal review
  before distribution. Do not relabel RocksDB source as Curiosity code.
- **Clean-room rule:** This report transfers only externally observable and
  documented ideas. Curiosity's provider-neutral interfaces, key grammar,
  invariants, tests, and operational policy must be authored from Curiosity
  requirements. Public headers were read to verify behavior; no source body or
  sample implementation is reproduced.

## 9. Curiosity architecture implications

### 9.1 Proposed boundary

```text
ownership/fencing plane (not RocksDB)
             |
      shard epoch + assignment
             v
single primary shard process
  -> bounded discovery admission
  -> ordered due index ------+
  -> canonical URL state     | atomic local claim/complete
  -> host politeness state --+
  -> compact document metadata -> immutable object/WARC references
             |
      WAL + memtables -> SST levels / compaction
             |
      checkpoint/verified backup; metrics and invariant audit
```

- **RECOMMENDATION (high):** The storage adapter must expose semantic
  operations (`schedule generation`, `claim`, `complete`, `release expired`,
  `read metadata`, bounded scan), not raw RocksDB handles/options. This keeps
  the provider-neutral contract independent from compaction and bindings.
- **RECOMMENDATION (high):** Every operation has explicit maximum keys, bytes,
  iterator duration, transaction duration, retries, and deadline. Return typed
  partial/backpressure/conflict/corruption states; never silently loop on
  `Incomplete`, `Busy`, or `TryAgain`.
- **RECOMMENDATION (high):** Persist provenance and policy evidence: normalized
  URL version, original discovery edge, robots-policy version, host epoch,
  fetch attempt ID, content/object digest, parser version, timestamps by clock,
  deletion/retention status, and mutation schema version.
- **RECOMMENDATION (high):** Keep a deterministic rebuild/audit path. At
  minimum, canonical records should be sufficient to detect/rebuild derived
  due indexes, and object references should be verifiable against immutable
  capture manifests.

### 9.2 Verdict ledger

| Capability / lesson | Verdict | Curiosity treatment | Confidence |
| --- | --- | --- | --- |
| Ordered embedded KV per owned shard | **ADAPTED** | Candidate local engine behind neutral contract; not global authority | High |
| Memtable + WAL + immutable SST architecture | **ADOPTED as dependency behavior** | Design recovery, disk, and monitoring around it | High |
| Atomic `WriteBatch` across column families | **ADOPTED** | Maintain canonical state and local secondary indexes together | High |
| Default unsynced writes | **REJECTED** for durable control | Explicit durability class; sync irreversible transitions | High |
| Shared WAL across column families | **ADAPTED** | Useful atomic recovery; monitor retention and cross-family coupling | High |
| Level compaction default | **DEFERRED** | Benchmark against universal under representative churn | High |
| FIFO compaction for frontier expiry | **REJECTED** | File age is not URL due/retention semantics | High |
| Prefix Bloom optimization | **DEFERRED** | Total-order baseline, then differential validation | High |
| Short bounded iterators | **ADOPTED** | Upper bounds, status checks, item/time limits, prompt destruction | High |
| Long snapshots for scheduler | **REJECTED** | They hide new work and retain old versions | High |
| Checkpoints for inspection/backup | **ADOPTED** | Durable audit/restore artifact with expiry and verification | High |
| `DeleteRange` | **ADAPTED narrowly** | Epoch/tenant bulk purge only after invariant/load tests | High |
| `SingleDelete` | **REJECTED** | Mutable frontier histories violate preconditions | High |
| TTL/compaction filter as logical expiry | **REJECTED** | Logical expiry at read/claim; filter only physical GC | High |
| `TransactionDB` | **DEFERRED / conditional** | Only for measured local contention; exact-key validation | Medium |
| Prepared/alternative write policies | **DEFERRED** | Added recovery complexity; no present distributed-transaction need | Medium |
| Secondary instance as failover | **REJECTED** | External ownership/fencing and tested restore/promotion required | High |
| Large document bodies in RocksDB | **REJECTED** | Object/WARC storage; RocksDB stores bounded metadata/references | High |
| RocksDB-native auth/encryption assumption | **REJECTED** | OS/service authorization and approved encrypted storage layer | High |
| Apache-2.0 license option | **ADOPTED if selected** | Preserve notices and separately review dependency graph | High |

## 10. Unknowns, negative results, and required checks

### Unknowns

- **UNKNOWN:** Curiosity's shard count, URLs/shard, steady and burst write rate,
  update/delete ratio, average key/value size, due-scan width, cache budget,
  retention period, disk medium, recovery objective, and acceptable duplicate
  fetch rate. No defensible capacity/tuning conclusion exists without these.
- **UNKNOWN:** Whether Curiosity needs strict FIFO, approximate priority,
  per-host fairness, or only “not before” scheduling. These produce different
  key/index and concurrency requirements.
- **UNKNOWN:** Which language binding and exact release would be used. Binding
  lifecycle, native memory ownership, build artifacts, CVE intake, release
  compatibility, and dependency licenses need separate review.
- **UNKNOWN:** Exact security support and threat model for the intended
  filesystem/cloud runtime, including encryption and snapshot/backup key
  handling.
- **UNKNOWN:** Whether point-key transactions can meet host-contention tails or
  a single-threaded shard executor is simpler/faster.

### Negative results

- **NEGATIVE RESULT:** No evidence was found that RocksDB itself supplies
  distributed consensus, automatic replication/failover, cross-host fencing,
  network authentication, or globally serializable queue claims.[S1][S24]
- **NEGATIVE RESULT:** No guarantee was found that ordinary `Delete`, TTL, or a
  compaction filter immediately removes bytes from SSTs, snapshots, backups,
  or media.[S6][S13][S15][S23]
- **NEGATIVE RESULT:** Prefix mode is not a universally safe acceleration;
  official documentation explicitly warns of silently wrong results under
  misuse.[S17]
- **NEGATIVE RESULT:** A live snapshot/iterator is not a persistent cursor after
  restart, and a secondary does not provide snapshot reads.[S13][S24]
- **NEGATIVE RESULT:** The attempted project security-policy path returned 404;
  no security-policy claim is made. No active probing or vulnerability search
  was performed.

### Mandatory pre-adoption checks

1. **Model test:** prove key encoding order, exclusive upper bounds, generation
   handling, idempotent completion, lease expiry, and index rebuild under a
   reference state machine.
2. **Crash matrix:** terminate before/after WAL append, sync, memtable insert,
   flush, MANIFEST install, claim, remote fetch, completion, and checkpoint;
   repeat with each intended recovery mode and injected tail/middle corruption.
3. **Concurrency:** race same URL, same host, reprioritization, expiry, and shard
   takeover; verify no stale epoch commits and characterize retries/deadlocks.
4. **Compaction trace:** replay realistic discovery/duplicate/retry/delete
   bursts through enough logical data and time to reach steady lower levels;
   report total WAF/RAF/SAF and tail latency with disk headroom.
5. **Snapshot/tombstone:** hold bounded and pathological iterators/snapshots;
   mass-delete/requeue; verify resource, latency, and physical purge behavior.
6. **Operations:** induce ENOSPC and transient/permanent I/O errors; validate
   backpressure, alerts, read-only transition, quarantine, and recovery.
7. **Restore/failover:** restore verified backup/checkpoint to a fresh host,
   rebuild derived indexes, fence old owner, and measure RPO/RTO and duplicates.
8. **Security/license:** threat-model every persisted copy; confirm encryption,
   permissions, log hygiene, CVE/update process, Apache-2.0 notices, LevelDB
   attribution, binding/compression licenses, and distribution obligations.

## 11. Bounded curiosity pass

After synthesis, remaining in-frame threads were scored 1–5 (higher means
more) for relevance, decision value, novelty, and research cost. Only the best
low-cost contradictions were pursued.

| Thread | R | V | N | Cost | Outcome |
| --- | ---: | ---: | ---: | ---: | --- |
| Clarify default WAL write versus stable sync | 5 | 5 | 4 | 1 | **Pursued:** WAL performance docs and current options/API comments distinguish default unsynced writes, explicit sync, and non-syncing close.[S3][S25][S26] |
| Test whether transactions protect a scanned due range | 5 | 5 | 4 | 2 | **Pursued:** docs/source show point-key tracking and base range lock unsupported; recommendation requires candidate revalidation, not serializable dequeue claims.[S16][S27] |
| Check deletion versus snapshots/compaction filters | 5 | 5 | 3 | 1 | **Pursued:** compaction-filter docs confirm filtering can break snapshot repeatability; exact logical expiry is separated from GC.[S15] |
| Benchmark concrete hardware and bindings | 5 | 5 | 3 | 5 | **CURIOSITY_NO_GO:** no authorized workload, hardware, binding, or implementation scope; numbers would be non-transferable. |
| Select exact key bytes/options | 5 | 4 | 2 | 4 | **CURIOSITY_NO_GO:** consequential design/implementation requires requirements and measured trace; report preserves abstract invariants only. |
| Audit every source file/experimental feature | 2 | 2 | 3 | 5 | **CURIOSITY_NO_GO:** public contract and selected headers saturated the decision; copying/reconstructing internals is unnecessary. |
| Active corruption/security probing | 4 | 3 | 4 | 5 | **CURIOSITY_NO_GO:** no deployed target or authorization; clean-room documentary frame only. |
| Compare every embedded KV alternative | 3 | 3 | 2 | 5 | **CURIOSITY_NO_GO:** caller requested RocksDB; comparative selection belongs in a separately framed storage ADR. |

**Stop reason:** coverage and saturation. Primary documentation, current public
headers, repository licenses, and the FAST paper triangulate the material
storage, durability, range, transaction, operations, and license claims.
Remaining high-value questions require an authorized workload experiment or a
separate architecture/legal decision, not more documentary inference.

## 12. Primary sources

All sources below were accessed **2026-08-17**. RocksDB wiki pages are
maintainer-authored but mutable; current `main` headers are also mutable, so a
future adoption record must pin the reviewed release/commit.

- **[S1]** RocksDB project, [RocksDB Overview](https://github.com/facebook/rocksdb/wiki/RocksDB-Overview) — architecture, operations, snapshots, compaction, checksums, backup/replication boundary.
- **[S2]** RocksDB project, [Write Ahead Log](https://github.com/facebook/rocksdb/wiki/Write-Ahead-Log-%28WAL%29) — WAL lifecycle, shared WAL, flushing and retention.
- **[S3]** RocksDB project, [WAL Performance](https://github.com/facebook/rocksdb/wiki/WAL-Performance) — default non-sync mode, sync, group commit, WAL amplification.
- **[S4]** RocksDB project, [WAL Recovery Modes](https://github.com/facebook/rocksdb/wiki/WAL-Recovery-Modes) — corruption/recovery policies.
- **[S5]** RocksDB project, [Compaction](https://github.com/facebook/rocksdb/wiki/Compaction) — leveled, universal/tiered, FIFO and amplification trade-offs.
- **[S6]** RocksDB project, [Block-based table format](https://github.com/facebook/rocksdb/wiki/Rocksdb-BlockBasedTable-Format) — SST layout, index/filter/properties/range tombstone blocks.
- **[S7]** RocksDB project, [MANIFEST](https://github.com/facebook/rocksdb/wiki/MANIFEST) — structural transaction log and atomic edit groups.
- **[S8]** RocksDB project, [Iterator](https://github.com/facebook/rocksdb/wiki/Iterator) — implicit snapshots, bounds, status, pinning and readahead.
- **[S9]** RocksDB project, [Implement Queue Service Using RocksDB](https://github.com/facebook/rocksdb/wiki/Implement-Queue-Service-Using-RocksDB) — ordered encoding, queue tombstones, upper bounds.
- **[S10]** RocksDB project, [Atomic flush](https://github.com/facebook/rocksdb/wiki/Atomic-flush) — cross-family flush and WAL relationship.
- **[S11]** RocksDB project, [Column Families](https://github.com/facebook/rocksdb/wiki/Column-Families) — atomic writes, separate memtables/SSTs, shared WAL.
- **[S12]** RocksDB project, [Write Stalls](https://github.com/facebook/rocksdb/wiki/Write-Stalls) — memtable/L0/compaction debt and DB-wide stalls.
- **[S13]** RocksDB project, [Snapshot](https://github.com/facebook/rocksdb/wiki/Snapshot) — sequence visibility, non-persistence and compaction interaction.
- **[S14]** RocksDB project, [Managing Disk Space Utilization](https://github.com/facebook/rocksdb/wiki/Managing-Disk-Space-Utilization) — SST accounting, space caps and compaction headroom.
- **[S15]** RocksDB project, [Compaction Filter](https://github.com/facebook/rocksdb/wiki/Compaction-Filter) — asynchronous GC, older-version reappearance and snapshot caveat.
- **[S16]** RocksDB project, [Transactions](https://github.com/facebook/rocksdb/wiki/Transactions) — optimistic/pessimistic point conflicts, snapshots and prepared transactions.
- **[S17]** RocksDB project, [Prefix Seek](https://github.com/facebook/rocksdb/wiki/Prefix-Seek) — extractor constraints, total/adaptive/manual modes and misuse warning.
- **[S18]** RocksDB project, [Background Error Handling](https://github.com/facebook/rocksdb/wiki/Background-Error-Handling) — read-only transitions, severity and recovery.
- **[S19]** RocksDB project, [Compaction Stats and DB Status](https://github.com/facebook/rocksdb/wiki/Compaction-Stats-and-DB-Status) — WAF, bytes, key drops and stalls.
- **[S20]** RocksDB project, [Checkpoints](https://github.com/facebook/rocksdb/wiki/Checkpoints) — consistent directory snapshots.
- **[S21]** RocksDB project, [DeleteRange](https://github.com/facebook/rocksdb/wiki/DeleteRange) — atomic range tombstones.
- **[S22]** RocksDB project, [SingleDelete](https://github.com/facebook/rocksdb/wiki/Single-Delete) — strict history preconditions and undefined misuse.
- **[S23]** RocksDB project, [Time to Live](https://github.com/facebook/rocksdb/wiki/Time-to-Live) — compaction-time, non-strict expiry.
- **[S24]** RocksDB project, [Read-only and Secondary Instances](https://github.com/facebook/rocksdb/wiki/Read-only-and-Secondary-instances) — one primary, catch-up and limitations.
- **[S25]** RocksDB project, current public [`options.h`](https://github.com/facebook/rocksdb/blob/main/include/rocksdb/options.h) — comparator/prefix contracts, current defaults, WAL recovery/verification and resource options.
- **[S26]** RocksDB project, current public [`db.h`](https://github.com/facebook/rocksdb/blob/main/include/rocksdb/db.h) — ordered-map API, write/delete/range caveats, close and primary-open contract.
- **[S27]** RocksDB project, current public [`transaction.h`](https://github.com/facebook/rocksdb/blob/main/include/rocksdb/utilities/transaction.h) — conflict semantics, prepared resolution and range-lock support status.
- **[S28]** RocksDB project, [Setup Options and Basic Tuning](https://github.com/facebook/rocksdb/wiki/Setup-Options-and-Basic-Tuning) — memory, compression, filters, I/O and tuning caution.
- **[S29]** RocksDB project, [Memory usage in RocksDB](https://github.com/facebook/rocksdb/wiki/Memory-usage-in-RocksDB) — cache/index/filter/memtable/iterator memory.
- **[S30]** RocksDB project, [Compatibility Between Different Releases](https://github.com/facebook/rocksdb/wiki/RocksDB-Compatibility-Between-Different-Releases) — format and option compatibility goals/caveats.
- **[S31]** RocksDB project, [Statistics](https://github.com/facebook/rocksdb/wiki/Statistics) — statistics levels, cumulative semantics and overhead.
- **[S32]** RocksDB project, [Online Verification](https://github.com/facebook/rocksdb/wiki/Online-Verification) — consistency and checksum verification.
- **[S33]** RocksDB project, [How to back up RocksDB](https://github.com/facebook/rocksdb/wiki/How-to-backup-RocksDB) — backup consistency, sharing, checksums and restore.
- **[S34]** RocksDB repository, [README license statement](https://github.com/facebook/rocksdb/blob/main/README.md) — GPLv2/Apache-2.0 dual-license option.
- **[S35]** RocksDB repository, [Apache License 2.0](https://github.com/facebook/rocksdb/blob/main/LICENSE.Apache) and [GPLv2 `COPYING`](https://github.com/facebook/rocksdb/blob/main/COPYING).
- **[S36]** RocksDB repository, [LevelDB-derived code license](https://github.com/facebook/rocksdb/blob/main/LICENSE.leveldb) — BSD-style attribution/redistribution terms.
- **[S37]** Siying Dong, Andrew Kryczka, Yanqin Jin, and Michael Stumm, [“Evolution of Development Priorities in Key-value Stores Serving Large-scale Applications: The RocksDB Experience”](https://www.usenix.org/conference/fast21/presentation/dong), FAST '21, pp. 33–49 — open-access primary experience paper.
