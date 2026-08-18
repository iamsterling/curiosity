# LMDB for frontier and metadata state: clean-room architecture study

**Research date / source access date:** 2026-08-17  
**Version boundary:** LMDB 1.0.1 (released 2026-08-06) is the current tagged
release examined. Established core behavior is triangulated with the LMDB
paper and current documentation. LMDB 0.9 and 1.0 have mutually incompatible
on-disk formats, so “LMDB” without a pinned major version is not an adequate
deployment decision [S1][S8][S9].  
**Decision:** whether and where LMDB belongs in Curiosity's crawler frontier and
metadata state.  
**Status:** research and recommendations only—not an implementation,
benchmark, legal opinion, dependency approval, or production change.

## 1. Decision frame and method

### Bounded sub-questions

1. What durability and concurrency model follows from LMDB's memory-mapped
   B+tree, copy-on-write MVCC, reader table, and single writer?
2. How do map sizing, long readers, backup, crashes, and filesystem behavior
   affect continuous frontier operations?
3. Which frontier/metadata workloads fit a local LMDB environment, and which
   require distributed coordination, replication, or immutable object storage
   that LMDB does not supply?
4. What security, licensing, version, and clean-room boundaries must Curiosity
   preserve?

### Method and access boundary

The review used public primary material: the author's 2011 paper; current LMDB
Doxygen/API/man pages; the OpenLDAP-hosted source repository and its read-only
GitHub mirror at the exact `LMDB_1.0.1` tag (commit
`6f0a32496a5aadee15a5e5103c479bd3355ae273`); release notes; and the OpenLDAP
Public License. Source review was limited to public documentation, declarations,
and comments needed to confirm behavior. No implementation expression, test,
default policy, or source code was copied into Curiosity. No database was
created, fuzzed, benchmarked, or crash-tested. All web sources were accessed
2026-08-17 [S1–S12].

Labels:

- **FACT** — directly stated in a cited primary source.
- **INFERENCE** — a bounded conclusion from facts, not directly tested here.
- **RECOMMENDATION** — a proposed Curiosity choice.
- **UNKNOWN** — not established by the reviewed evidence.
- Confidence is **high**, **medium**, or **low**.

## 2. Executive verdict

**RECOMMENDATION — ADAPT the design lessons; DEFER the dependency; REJECT LMDB
as a distributed system of record (high confidence).**

LMDB is a strong conceptual and potentially practical fit for a **single-node,
single-owner frontier shard**: ordered keys and cursors support due-work scans;
one transaction can atomically update a URL record, time/priority index, host
budget, lease, and outbox; readers get stable snapshots without blocking the
writer; and there is no separate cache or recovery log to tune. Its single
writer is an advantage when Curiosity deliberately assigns one scheduler owner
per politeness key, because the application already needs one serialization
point [S1–S5].

It is not a distributed queue, replicated metadata service, immutable evidence
store, or high-availability protocol. All writes to one environment serialize;
long readers delay page reuse; capacity is bounded by an explicitly managed map;
the lock protocol requires a local filesystem; and host loss is not solved by
transactional crash consistency. A global frontier would need independent
sharding/ownership, fencing, failover, backup/replication, and cross-shard
reconciliation around LMDB [S2–S7].

The dependency decision should be deferred because LMDB 1.0.1 was only eleven
days old at review time, changed the on-disk format from 0.9, and adds material
facilities such as checksums, encryption hooks, incremental backup, raw-device
operation, and two-phase commit. Exact language-binding support, packaging,
upgrade behavior, operational maturity, and license acceptance have not been
verified for Curiosity [S8–S12]. Under the repository's strict wholly-owned-core
constraint, directly incorporating LMDB would also be third-party OpenLDAP
Public License code, not project-owned or MIT code.

## 3. Reconstructed storage model

```text
process address space
  -> read-only mmap of the environment data file (default mode)
  -> OS virtual-memory/page cache supplies referenced pages

environment data file
  -> alternating meta pages identify committed snapshots
  -> application B+tree(s): branch + leaf + overflow pages
  -> free-page B+tree tracks reclaimable pages by transaction history

separate lock file / shared lock region
  -> one cross-process writer mutex
  -> reader slots: process ID + thread ID + snapshot transaction ID

write transaction
  -> copy modified paths/pages
  -> reuse pages older than every active reader where possible
  -> write dirty data pages
  -> publish commit by updating the alternate meta page
```

### 3.1 Memory mapping and the B+tree

- **FACT (high):** LMDB maps the entire database into virtual address space and
  normally returns values directly from mapped memory. It does not maintain a
  separate database page cache; the operating system handles residency and page
  faults. Returned value pointers commonly reference the database and remain
  valid only within their transaction/update lifetime [S2–S4].
- **FACT (high):** the paper identifies B+trees and describes two principal
  trees in an environment: application data and free pages. Current statistics
  distinguish branch, leaf, and overflow pages, and named subdatabases allow
  multiple ordered databases in one environment [S1][S4][S9].
- **FACT (high):** the normal map is read-only even for a read-write environment;
  writes use separate dirty pages and file writes. `MDB_WRITEMAP` instead uses a
  writable mapping, but the API warns that wild application pointers can then
  corrupt the database, that it is incompatible with nested transactions, and
  that processes must not mix write-map and normal modes [S2][S4][S9].
- **INFERENCE (high):** “memory mapped” does not mean “the whole database consumes
  RAM.” Map size reserves address space and sets a database ceiling; physical
  memory is consumed as pages become resident. Working-set locality, storage
  latency, page-fault behavior, and OS cache pressure still determine tail
  latency.
- **INFERENCE (medium):** compact, ordered frontier keys and small values should
  fit this design better than large captures. WARC bytes, rendered pages, and
  extracted bodies would amplify page churn and backups and belong in object
  storage; LMDB should contain IDs, hashes, policy state, scheduling state, and
  bounded metadata only.

### 3.2 MVCC, snapshots, and page reclamation

- **FACT (high):** updates do not overwrite pages visible to an active snapshot.
  A writer copies modified pages, while each read transaction sees the
  consistent snapshot current when it began. Writers do not block readers and
  readers do not lock data access [S1][S2][S5].
- **FACT (high):** a reader records its snapshot transaction ID in a reader-table
  slot. The writer scans the table to find the oldest reader and can reclaim a
  freed page only when no active snapshot can still reference it. A stale scan
  can conservatively retain pages longer without violating correctness [S1][S5].
- **FACT (high):** LMDB reuses eligible free pages rather than operating as an
  indefinitely append-only store. Normal operation therefore does not require a
  WAL checkpoint or periodic compaction merely to cap growth [S1][S2].
- **FACT (high):** long-lived read transactions prevent reuse of pages freed by
  newer writes and can make the data file grow quickly. Long write transactions
  block every other writer [S2][S3].
- **INFERENCE (high):** a “nonblocking reader” can still be an operationally
  expensive reader. Snapshot age—not just query latency—must be bounded and
  observable. An export, scan, stalled worker, or backup holds old versions alive
  even while ordinary writes continue.

### 3.3 Alternating meta pages and atomic visibility

- **FACT (high):** the original design uses two meta pages alternately. Each
  points to the roots of the committed data/free trees. New pages are written
  first; commit updates the older meta page last. On open, LMDB selects the newer
  valid snapshot [S1][S9].
- **FACT (high):** the current documentation says copy-on-write means active data
  pages are not overwritten and no special recovery procedure is normally
  required after a system crash. It describes LMDB as transactional and ACID
  under its normal durability settings [S2][S4].
- **INFERENCE (high):** the metapage is the atomic visibility switch. A process
  crash before that switch leaves the preceding committed root usable; after a
  successful normally synchronized commit, the new root is intended to be
  durable. There is no WAL to replay.
- **CAVEAT (high):** this is not protection from media loss, arbitrary file
  truncation, filesystem/firmware violations, operator copying of inconsistent
  files, or unsafe durability flags. Commit can report `ENOSPC` or I/O errors,
  and the API has explicit corruption, panic, invalid-file, and checksum errors
  [S4][S9]. “No recovery log” must not be translated to “no backups or restore
  testing.”

## 4. Transactions and concurrency

### 4.1 Transaction contract

- **FACT (high):** every operation, including reads, occurs in a transaction.
  A transaction gives a consistent view; commit makes all write operations
  visible together and abort discards them. Read-write transactions may be
  nested, subject to documented restrictions [S3][S4].
- **FACT (high):** one transaction can operate across multiple named databases
  in the same environment. The transaction and its cursors are generally tied
  to one thread; `MDB_NOTLS` changes slot ownership for read-only transactions
  but requires application synchronization [S3][S4].
- **FACT (high):** mapped values and cursors cannot escape their documented
  transaction lifetime. Holding a pointer after transaction end is invalid
  even if the bytes happen to remain mapped [S3][S4].
- **INFERENCE (high):** all indexes for one logical frontier mutation should be
  in the same environment and transaction. Updating the primary URL state but
  not its due-time, lease, host, or outbox index would create application-level
  inconsistency that MVCC cannot repair.

### 4.2 Single writer, many readers

- **FACT (high):** only one read-write transaction may be active per
  environment across threads and processes. Later writers block on the writer
  mutex. Many read-only transactions may run concurrently and can begin while a
  writer is active [S1–S5].
- **FACT (high):** the default reader table has 126 slots; applications can set
  a different maximum before opening the environment. Exhaustion produces
  `MDB_READERS_FULL`. Slots are normally associated with threads and reused;
  the table records process, thread, and transaction IDs [S4][S5].
- **FACT (high):** stale reader entries can survive abnormal process exit and
  delay reclamation. `mdb_reader_check()` and `mdb_stat -rr` detect and clear
  stale entries. Stale-writer cleanup depends on platform locking support [S2]
  [S5][S7].
- **INFERENCE (high):** “single writer” is a hard throughput/latency topology,
  not merely an internal optimization. Batch size trades amortized commit cost
  against writer hold time, crash replay work outside the transaction, and
  scheduling latency. It must be measured on the intended storage and mutation
  mix.

### 4.3 Process and filesystem constraints

- **FACT (high):** processes and threads can share an environment, but each
  process should open it once and share that handle among its threads. Closing a
  second open can break POSIX advisory-lock assumptions. An environment handle
  must not simply be reused after `fork()` [S2][S3].
- **FACT (high):** LMDB explicitly says not to place environments on remote
  filesystems; file locking, mmap synchronization, and cross-host coordination
  are not reliable there. “Read-only” access normally still needs write access
  to the lock file [S2].
- **RECOMMENDATION (high):** one local environment should have one explicit
  scheduler-owner service and local SSD/filesystem. Other services should use a
  bounded service contract or event stream rather than mount the same database
  over NFS/SMB or bypass the owner.

## 5. Map sizing and continuous operation

### 5.1 Semantics

- **FACT (high):** `mdb_env_set_mapsize()` sets both the virtual map size and the
  maximum database size. In 1.0.1 its documented default is 10 MiB and the size
  should be an OS-page multiple chosen with future growth in mind [S4][S9].
- **FACT (high):** resizing after open is permitted only when the current process
  has no active transactions; the library does not fully enforce that condition
  for the caller. An increase takes effect locally immediately but is persisted
  to other processes after the resizing process commits. Another process that
  sees growth beyond its mapping receives `MDB_MAP_RESIZED` and can adopt the
  recorded size by setting size zero [S4][S9].
- **FACT (high):** reaching the ceiling produces `MDB_MAP_FULL`; growth by
  another process can produce `MDB_MAP_RESIZED`. These are distinct from
  filesystem `ENOSPC` [S4][S9].
- **FACT (high):** a large configured map may reserve substantial unused address
  space and perhaps apparent file size without consuming equivalent RAM or disk
  blocks [S2].

### 5.2 Curiosity operating policy

**RECOMMENDATION (high):** set a deliberately generous 64-bit map ceiling, but
do not treat it as autoscaling. Define a coordinated resize path before launch:

1. alert on used pages/map size, growth slope, disk free space, free pages,
   oldest reader age, and writer queue/hold time;
2. stop or backpressure new frontier ingestion before the safety margin is gone;
3. drain transactions in the resizing process, increase the map under one
   control path, perform the required commit, and make peers adopt the size;
4. abort and retry the whole logical mutation after `MDB_MAP_FULL` or
   `MDB_MAP_RESIZED`; never treat either as a dropped-but-successful URL;
5. separately test filesystem-full and quota-full behavior.

**INFERENCE (high):** map growth can be a symptom rather than capacity demand.
An old reader or stale slot can prevent reuse, so automatically increasing the
map without inspecting reader age can hide a leak until disk exhaustion.

**UNKNOWN (medium):** safe practical map ceilings for Curiosity's target OS,
container limits, address-space layout, filesystem, and binding. These require a
deployment-specific test; a generic “terabytes are free on 64-bit” claim is not
an operating limit.

## 6. Crash semantics and durability modes

| Mode | Documented consequence | Curiosity verdict |
| --- | --- | --- |
| Default synchronized commit | data and metadata are written and OS buffers are flushed on commit | **ADOPT if LMDB is approved** for authoritative frontier transitions |
| `MDB_NOMETASYNC` | omit/defer metadata flush; integrity retained, but a crash can undo the latest committed transaction | **REJECT by default**; only after explicit loss-window testing |
| `MDB_NOSYNC` | omit commit flushes; crash may lose transactions and can corrupt unless stated write-order assumptions hold without `WRITEMAP` | **REJECT** for authoritative state |
| `MDB_WRITEMAP` | writable map; exposes database to wild-pointer corruption and changes durability interactions | **REJECT initially** |
| `MDB_MAPASYNC` + `WRITEMAP` | asynchronous mapped writes; crash can lose or corrupt until explicit sync | **REJECT** |
| explicit `mdb_env_sync(force)` | force pending buffers to storage, subject to underlying I/O behavior | Operational tool, not a substitute for a defined commit policy |

Source: the LMDB 1.0.1 API and current environment-flag documentation [S4][S9].

**RECOMMENDATION (high):** use the default durability path unless destructive
tests establish an acceptable bounded-loss profile. Record the effective flags
at startup and reject configuration drift; mixed `WRITEMAP` modes across
processes can defeat durability [S4].

**INFERENCE (high):** LMDB makes a frontier transition atomic, not a network
fetch exactly-once. A worker can fetch successfully and crash before committing
completion, or commit a lease and crash before fetching. Curiosity therefore
needs leases with expiry/fencing, idempotent capture identity, bounded retries,
and reconciliation. External WARC/object writes should be finalized first and
referenced by immutable ID/hash in a frontier transaction; orphan objects and
missing references need repair scans.

**Historical caution (medium):** maintainer discussions document filesystem and
write-order subtleties, especially older Linux `fdatasync` behavior and unsafe
`NOSYNC` assumptions [S13]. Current source contains platform handling for old
Linux behavior, but this review did not independently validate power-loss
semantics on Curiosity's storage stack. Treat the guarantee as an end-to-end
property requiring crash/power-cut tests, not as a library slogan.

## 7. Backup, restore, and disaster recovery

- **FACT (high):** `mdb_env_copy`/`mdb_copy` make a consistent backup while the
  environment is in use. The lock file is not copied because it is recreated.
  A copying read transaction can delay page reuse and cause significant file
  growth during concurrent writes [S4][S6].
- **FACT (high):** compact copy omits free/unused pages and renumbers current
  pages, using more CPU and time; the 1.0.1 man page says it currently fails if
  the environment has suffered a page leak [S6].
- **FACT (high):** LMDB 1.0 adds incremental backup by recording transaction IDs
  in page headers and copying pages newer than a supplied transaction ID. It
  also retains full copy/dump/load tools [S8][S9].
- **FACT (high):** 1.0 cannot open 0.9 files. Migration requires a 0.9 dump and
  1.0 load, not an in-place binary upgrade [S8].
- **RECOMMENDATION (high):** use LMDB's snapshot-aware tools, never an ad hoc live
  copy of only the data file. Keep exact LMDB version, application schema,
  comparator/key encoding version, durability flags, and backup transaction ID
  in an external manifest. Encrypt and access-control backup destinations.
- **RECOMMENDATION (high):** require automated restore drills that rebuild the
  lock file, validate all named databases and cross-index invariants, reopen
  with the pinned binary/binding, replay later durable events if applicable, and
  measure RPO/RTO. A backup that has not passed a restore and logical integrity
  scan is not evidence of recoverability.
- **INFERENCE (high):** online backup is another long reader. Schedule it with a
  snapshot-age/file-growth budget and abort/escalate if it threatens map or disk
  headroom.
- **UNKNOWN (high):** LMDB supplies no reviewed built-in cross-host replication
  or managed failover protocol. Host-loss durability must come from a separately
  designed event/replication layer, filesystem/block replication with tested
  consistency, or backup/restore.

## 8. Frontier and metadata fit

### 8.1 Strong fit: one locally owned scheduling shard

**RECOMMENDATION (medium-high, benchmark required):** if the dependency passes
review, use one environment per independently recoverable local shard, with one
writer-owner. Conceptually separate named databases can represent:

- canonical URL/state records and reversible normalization evidence;
- due-time/priority ordering with deterministic tie-breakers;
- leases, attempts, retry ceilings, and terminal reasons;
- per-politeness-key next-allowed time, concurrency, robots version/decision,
  and adaptive backoff;
- redirect/duplicate edges and immutable capture references;
- a transactional outbox/change sequence for downstream capture, document, and
  operations planes.

This is a functional shape, not a copied schema. Ordered byte keys and range
cursors make time-prefix scans natural; same-environment transactions make
claiming work and updating every secondary index atomic [S3][S4].

### 8.2 Required invariants

1. A URL appears in exactly one mutually exclusive active state; every secondary
   due/lease index agrees with its primary record.
2. Work claim updates URL, host budget, lease token, attempt count, and outbox in
   one transaction.
3. A stale worker cannot complete work after a lease generation has advanced.
4. Robots/policy decisions retain the exact policy/version ID required by the
   owned-search architecture; external text never changes policy authority.
5. Capture bytes remain immutable objects; LMDB stores their stable IDs, hashes,
   and state, not the evidence payload.
6. Every terminal failure, retry, tombstone, takedown, and requeue is explicit
   and replay/audit-visible.
7. Reads used for API responses are short snapshots; analytics/export operate
   from replicas, backups, or bounded scans rather than pinning the live shard.

These recommendations align with Curiosity's requirement for one scheduler
owner per politeness key, immutable WARC captures, versioned policy evidence,
bounded behavior, and separate provider-neutral contracts [P1][P2].

### 8.3 Poor fit / rejection boundary

- **REJECT (high):** one LMDB environment shared across hosts or mounted on a
  remote filesystem.
- **REJECT (high):** LMDB alone as the global frontier authority. It has no
  membership, consensus, leader election, fencing, rebalance, replication, or
  cross-shard atomicity contract in the reviewed API.
- **REJECT (high):** large WARC, HTML, render, or extracted-content blobs in the
  frontier environment.
- **REJECT (high):** a write-heavy fan-in design that assumes writers scale with
  worker count. They serialize at the environment.
- **DEFER (medium-high):** use as the canonical document/provenance ledger until
  host-loss recovery, deletion propagation, audit export, and cross-plane event
  semantics are designed.
- **ADAPT (high):** copy-on-write snapshots, explicit single ownership, atomic
  multi-index state changes, bounded read lifetime, and observable reclamation
  pressure—regardless of the eventual storage engine.

## 9. Operations and observability

### Minimum telemetry

| Signal | Why it matters |
| --- | --- |
| map size, last used page, used/map ratio | capacity and resize margin |
| data-file bytes/allocated blocks + disk free | true storage pressure versus virtual reservation |
| free-page count/age | reclaimability and churn |
| oldest active reader transaction and age | page-reuse blocker |
| reader slots used/max; stale slots cleared | `MDB_READERS_FULL` and abnormal exits |
| writer wait, transaction hold time, batch size, commit latency | single-writer saturation |
| commits/aborts and errors by code | map full, resized, I/O, panic, corruption |
| backup duration/snapshot age/growth; last verified restore | recoverability impact |
| frontier invariant scan and outbox lag | application correctness |

`mdb_env_info`, database statistics, reader-list/check APIs, and `mdb_stat`
expose several underlying values, but application-level transaction timing and
frontier invariants require Curiosity instrumentation [S4][S7].

### Runbook requirements

1. Pin library, binding, file-format major, page size, comparator/key encoding,
   and flags; fail startup on incompatible state.
2. On `MDB_MAP_FULL`, stop claims/ingress, preserve the failed logical request,
   diagnose readers versus real growth, resize through the single owner, retry.
3. On `MDB_MAP_RESIZED`, end local transactions, adopt the persisted map size,
   and retry from the application boundary.
4. On reader exhaustion, reject/degrade boundedly, list slots, clear only proven
   stale entries, and find the transaction-lifetime leak.
5. On panic, checksum, corruption, or I/O error, fence the environment; do not
   continue optimistic writes. Preserve forensic copies and restore/verify.
6. Never delete/reset a lock file while another process may use the environment.
7. Exercise kill-during-claim, kill-during-completion, disk full, map full,
   power loss, corrupt latest metapage, stale reader, backup under writes, and
   restore to a clean host before production approval.

## 10. Security and privacy boundary

- **FACT (high):** normal mapping is read-only and protects the database from
  accidental writes through returned pointers; `WRITEMAP` removes that
  protection [S2][S4].
- **FACT (high):** Unix file/semaphore permissions are supplied when opening the
  environment. LMDB is embedded; the reviewed API does not provide a network
  identity, tenant authorization, row ACL, or secrets-management plane [S4].
- **FACT (high):** readers normally need a writable lock file even when the data
  is opened read-only. On some semaphore configurations, multiple user IDs can
  create ownership/startup problems [S2].
- **FACT (high):** `MDB_NOMEMINIT` can persist unrelated previously freed heap
  contents into unused file space; official docs warn against it for sensitive
  data. Reserved write buffers likewise require the caller to overwrite all
  bytes [S2][S4].
- **FACT (high):** LMDB 1.0 adds optional page checksums, keyed checksums, and
  encryption callbacks/dynamic modules. The docs distinguish plain corruption
  detection from keyed tamper detection and authenticated encryption [S8][S9].
- **INFERENCE (high):** optional crypto hooks are not a complete security
  program. Key derivation, rotation, memory exposure, backup encryption,
  algorithm/module selection, authentication mode, incident recovery, and
  binding/tool compatibility remain deployment responsibilities. Curiosity
  should prefer reviewed platform volume/backup encryption unless LMDB-level
  crypto receives a separate cryptographic design review.
- **INFERENCE (high):** deleting a key does not prove physical erasure: old
  snapshots, free pages, compact/noncompact backups, replicas, and filesystem
  remnants may retain bytes. Sensitive frontier metadata needs retention,
  tombstone, backup-expiry, and encryption-key policies separate from logical
  deletion.
- **RECOMMENDATION (high):** run the owner under a dedicated least-privilege OS
  identity; restrict data and lock paths; prohibit user-supplied environment
  paths, flags, comparators, modules, and raw database files; never place
  credentials, page content, cookies, or fetched secrets in frontier records.
- **UNKNOWN (high):** no primary source reviewed promises that opening a
  maliciously crafted LMDB file is a hardened untrusted-input boundary. Treat
  database and backup files as privileged internal state; validate restores in
  isolation before promotion.
- **NEGATIVE RESULT:** no official LMDB-specific current CVE/advisory index was
  found in the bounded primary-source search. This is absence of located
  evidence, not evidence of no vulnerabilities; dependency scanning and
  OpenLDAP ITS/security-channel review remain required.

## 11. License and clean-room boundary

- **FACT (high):** LMDB 1.0.1 is distributed under the OpenLDAP Public License
  2.8. Source redistributions must retain copyright statements/notices; binary
  redistributions must reproduce applicable notices, the conditions, and
  disclaimer; redistributions must contain a verbatim license copy. Author and
  copyright-holder names may not be used for promotion without permission
  [S10][S11].
- **FACT (high):** the repository identifies additional derived material and
  warns that individual files or packages can carry other copyrights or
  restrictions [S11].
- **INFERENCE (high):** this is permissive redistribution, but it is not MIT and
  does not make LMDB project-owned code. Exact source/binary packaging and all
  bundled files must be reviewed; this report is not legal approval.
- **RECOMMENDATION (high):** if LMDB is proposed as a dependency, create a
  separately reviewed dependency ADR recording exact tag/commit, source origin,
  license and notices, supplied files/modules, binding license, SBOM, upgrade
  owner, vulnerability process, and whether the “wholly owned core” constraint
  grants an infrastructure exception.
- **RECOMMENDATION (high):** implementation teams may use this independently
  authored behavioral specification and public LMDB APIs only after that
  decision. Do not translate source structure, tests, comments, key layouts, or
  crypto example code. Preserve this report's attribution and source ledger.

## 12. Decision ledger

| Pattern/component | Verdict | Confidence | Reason |
| --- | --- | --- | --- |
| COW B+tree snapshots and short read transactions | **ADAPTED** | High | strong consistency/read-concurrency lesson independent of engine |
| Explicit one-writer owner per local frontier shard | **ADAPTED** | High | aligns storage serialization with politeness ownership |
| Atomic primary + due/lease/host/outbox indexes | **ADAPTED** | High | required application invariant; same-env transactions can support it |
| LMDB 1.0.1 as an immediate dependency | **DEFERRED** | High | new major/file format; binding, license, and operations unverified |
| LMDB 0.9 for compatibility | **DEFERRED/likely rejected** | Medium-high | older ecosystem may be broader, but creates migration and feature divergence |
| Default synchronized durability | **ADOPTED if dependency approved** | High | authoritative transitions should not silently accept a loss window |
| `NOSYNC`, `WRITEMAP`, `MAPASYNC` optimization | **REJECTED initially** | High | expands corruption/loss and application-pointer risk |
| Live snapshot-aware copy + restore drills | **ADAPTED** | High | backup must respect MVCC and prove restore |
| LMDB as multi-host/global queue | **REJECTED** | High | no distributed coordination/replication; remote FS prohibited |
| LMDB as WARC/content/blob store | **REJECTED** | High | wrong lifecycle, churn, backup, and evidence/deletion boundary |
| LMDB as sole provenance/metadata authority | **DEFERRED** | High | host-loss, replication, audit, and deletion semantics unresolved |
| LMDB 1.0 page crypto | **DEFERRED** | High | new optional mechanism requires separate cryptographic review |

## 13. Verification checks before a go decision

1. **Version/binding:** prove the selected binding supports exact LMDB 1.0.1
   semantics, errors, flags, backup, reader checks, and file-format rejection;
   inventory transitive licenses.
2. **Workload:** replay representative URL discovery, dedup, claims,
   completions, robots/host updates, deletes, retries, and outbox writes; report
   p50/p95/p99 writer wait/commit and read latency at required concurrency.
3. **Contention:** vary commit batch size and slow readers; identify writer
   saturation and acceptable maximum transaction lifetime.
4. **Capacity:** force genuine growth and page-reuse blockage separately; test
   warning thresholds, `MDB_MAP_FULL`, cross-process `MDB_MAP_RESIZED`, disk
   full, quotas, and recovery without lost work.
5. **Crash matrix:** kill at every claim/fetch/object-finalize/completion boundary
   and power-cut the storage stack under default and prohibited flags; verify old
   or new committed state and all frontier invariants.
6. **Lease correctness:** prove stale-generation completion is rejected and
   expired work becomes eligible without duplicate evidence identity.
7. **Backup:** full, compact, and—if selected—incremental backup while writes
   continue; measure growth; restore to a clean host; validate logical hashes
   and outbox continuity.
8. **Corruption/security:** corrupt data/meta/checksum pages in expendable
   fixtures, verify fail-closed behavior, and test permissions, lock ownership,
   backup access, key loss, and secret/PII exclusion.
9. **Failover:** lose the owning host and demonstrate the approved RPO/RTO,
   fencing, shard reassignment, and reconciliation mechanism outside LMDB.
10. **Portability:** export provider-neutral frontier events/records and rebuild
    an alternative store so LMDB's file format is not the domain contract.

## 14. Unknowns and negative results

- **UNKNOWN:** Curiosity's required frontier mutation rate, burst fan-in,
  transaction mix, state size, retention, RPO/RTO, and acceptable claim latency.
- **UNKNOWN:** production OS/filesystem/container and whether its mmap, sync,
  sparse allocation, disk-full, and power-loss behavior meets the intended
  guarantee.
- **UNKNOWN:** exact language binding, its LMDB major-version support, thread
  semantics, error mapping, release cadence, license, and maintainer posture.
- **UNKNOWN:** operational maturity of LMDB 1.0 incremental backup, checksums,
  encryption modules, raw devices, and 2PC in Curiosity's environment. Their
  presence in a release is not evidence that Curiosity should use them.
- **UNKNOWN:** a supported replication/failover product or protocol appropriate
  to LMDB 1.0. None appears in the core API/docs reviewed.
- **NEGATIVE RESULT:** no current independent benchmark was treated as evidence
  for Curiosity. The 2011 paper's LDAP measurements concern old hardware,
  software, and a read-oriented workload.
- **NEGATIVE RESULT:** no remote-filesystem-safe multi-host mode was found; the
  official documentation explicitly warns against remote filesystems.
- **NEGATIVE RESULT:** no built-in tenant ACL, network authentication,
  scheduler lease, consensus, sharding, or exactly-once fetch contract was found.
- **NEGATIVE RESULT:** no evidence supports treating a successful logical delete
  as secure physical erasure from pages and backups.
- **NEGATIVE RESULT:** no authenticated experiment, crash test, fault injection,
  map-resize test, or restore was performed.

## 15. Bounded curiosity pass

After synthesis, remaining in-frame gaps were scored 1–5 for relevance, value,
novelty, and inverse cost (higher means cheaper).

| Thread | R | V | N | C | Outcome |
| --- | ---: | ---: | ---: | ---: | --- |
| Confirm whether 1.0 is released and materially differs from 0.9 | 5 | 5 | 5 | 5 | **Pursued:** exact 1.0.1 tag/change log, incompatible format, and new feature boundary established [S8][S12]. |
| Resolve durability contradiction around old Linux `fdatasync` | 5 | 4 | 4 | 3 | **Pursued boundedly:** historical maintainer discussion and current source comments located; deployment behavior remains test-dependent [S9][S13]. |
| Benchmark language bindings | 5 | 5 | 3 | 1 | **CURIOSITY_NO_GO:** no binding or workload was authorized/selected; results would be non-transferable. |
| Audit every OpenLDAP ITS/CVE and downstream package patch | 4 | 4 | 3 | 1 | **CURIOSITY_NO_GO:** exceeds product-architecture frame; required at dependency review. |
| Reverse-engineer page binary layout or copy crypto examples | 2 | 2 | 2 | 1 | **CURIOSITY_NO_GO:** unnecessary for the decision and contrary to the clean-room boundary. |
| Compare RocksDB/SQLite/PostgreSQL quantitatively | 4 | 5 | 2 | 1 | **CURIOSITY_NO_GO:** separate comparative decision; no common benchmark frame supplied. |

Stop condition: coverage was reached for the requested architecture,
transactions, sizing, crash/durability, backup, concurrency, operations,
security, license, and Curiosity implications. Remaining high-value questions
require caller-selected bindings, infrastructure, workloads, or a separate
dependency/comparative authority.

## Source ledger

All sources accessed 2026-08-17. Primary sources are preferred; source-tree
links point to the exact release tag where possible.

- **[S1]** Howard Chu, **“MDB: A Memory-Mapped Database and Backend for
  OpenLDAP”** (2011), especially §§3–4 on mmap, MVCC, free pages, alternating
  metapages, and reader/writer locking.  
  https://www.openldap.org/pub/hyc/mdb-paper.pdf
- **[S2]** LMDB, **Main documentation / Introduction and Caveats** (current 1.0
  docs): architecture, COW/MVCC, single writer, lock-file, long-transaction,
  remote-filesystem, and `NOMEMINIT` warnings.  
  http://www.lmdb.tech/doc/
- **[S3]** LMDB, **Getting Started**: environment/transaction/database/cursor
  lifetimes, snapshots, threads/processes, single writer, and read transaction
  reset/renew.  
  http://www.lmdb.tech/doc/starting.html
- **[S4]** LMDB, **LMDB API**: environment flags, mapsize, transactions, copy,
  sync, errors, stats, readers, and value lifetimes.  
  http://www.lmdb.tech/doc/group__mdb.html
- **[S5]** LMDB, **Reader Lock Table**: reader slots, oldest-reader scanning,
  reclamation, alignment, and default reader count.  
  http://www.lmdb.tech/doc/group__readers.html
- **[S6]** LMDB 1.0.1, **mdb_copy(1)**: online and compact copies, no copied
  lock file, and long-copy growth caveat.  
  https://github.com/LMDB/lmdb/blob/LMDB_1.0.1/libraries/liblmdb/mdb_copy.1  
  http://www.lmdb.tech/doc/man1/mdb_copy_1.html
- **[S7]** LMDB 1.0.1, **mdb_stat(1)**: environment/free-list/reader-table
  reporting and stale-reader cleanup.  
  https://github.com/LMDB/lmdb/blob/LMDB_1.0.1/libraries/liblmdb/mdb_stat.1  
  http://www.lmdb.tech/doc/man1/mdb_stat_1.html
- **[S8]** LMDB 1.0.1, **Upgrading From Release 0.9**: incompatible on-disk
  formats; incremental backup; checksums/encryption; raw devices; 2PC; page
  sizes. Exact tagged source document.  
  https://github.com/LMDB/lmdb/blob/LMDB_1.0.1/libraries/liblmdb/upgrading.doc
- **[S9]** LMDB 1.0.1, **public API declarations/documentation (`lmdb.h`)**:
  exact release version/date, map and durability semantics, errors, transaction
  constraints, backup, checksums, and encryption callbacks.  
  https://github.com/LMDB/lmdb/blob/LMDB_1.0.1/libraries/liblmdb/lmdb.h
- **[S10]** OpenLDAP Foundation, **OpenLDAP Public License 2.8**.  
  https://www.openldap.org/software/release/license.html
- **[S11]** LMDB 1.0.1, **LICENSE and COPYRIGHT** at the exact tag.  
  https://github.com/LMDB/lmdb/blob/LMDB_1.0.1/libraries/liblmdb/LICENSE  
  https://github.com/LMDB/lmdb/blob/LMDB_1.0.1/libraries/liblmdb/COPYRIGHT
- **[S12]** LMDB, **1.0 change log**: 1.0.1 release date and fixes.  
  https://github.com/LMDB/lmdb/blob/LMDB_1.0.1/libraries/liblmdb/CHANGES
- **[S13]** Howard Chu / OpenLDAP lists, **LMDB crash consistency and power-loss
  discussions** (historical context, not the current release contract).  
  https://lists.openldap.org/hyperkitty/list/openldap-devel@openldap.org/message/NBJR236BWFNIGNRQNKLK7M47WIVRKV4V/  
  https://www.openldap.org/lists/openldap-technical/201903/msg00045.html

### Internal Curiosity context

- **[P1]** `docs/decisions/0021-owned-public-web-search.md`, especially the
  staged owned frontier, immutable WARC capture, provider-neutral separation,
  hard bounds, and no implementation authorization.
- **[P2]** `docs/research/owned-public-web-search-architecture-2026-08-17.md`,
  especially §§3.1, 4, and 5: one scheduler owner per politeness key, immutable
  capture events, provider-neutral planes, bounded behavior, and clean-room
  controls.
