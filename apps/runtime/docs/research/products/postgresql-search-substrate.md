# PostgreSQL as an owned-crawler queue, state, and audit substrate

**Research and primary-source access date:** 2026-08-17<br>
**Version basis:** PostgreSQL 18.6, the current supported release resolved by
the official `current` documentation on the access date.<br>
**Decision:** whether, and within what boundaries, Curiosity should use
PostgreSQL as the transactional control plane for an owned crawler.<br>
**Status:** clean-room research record and architecture recommendation, not an
implementation, benchmark, deployment plan, legal opinion, or authorization to
operate a crawler.<br>
**Access boundary:** public PostgreSQL project documentation and license only.
No private materials, source-code copying, service probing, workload generation,
or production access was used.

## Executive verdict

**ADOPT PostgreSQL as the initial transactional system of record and bounded
at-least-once work queue; ADAPT it with short leases, immutable evidence rows,
and external object storage; REJECT it as a promise of exactly-once crawling,
tamper-proof audit, or an indefinitely scalable web index (high confidence).**

PostgreSQL is a strong fit for the crawler's *control plane*: crawl runs and
their policy snapshots, normalized URL identities, deduplication constraints,
frontier eligibility, worker leases, fetch attempts, extraction versions,
discovery edges, an outbox, and an application audit ledger can commit together.
MVCC lets readers inspect state without blocking ordinary writers, while row
locks plus `SKIP LOCKED` let multiple consumers claim disjoint ready rows. The
PostgreSQL manual explicitly identifies queue-like tables as the intended case
where `SKIP LOCKED`'s inconsistent view can be useful [S1-S4].

The fit has sharp boundaries:

- `SKIP LOCKED` skips contention; it does not provide fairness, stable global
  priority, delivery acknowledgements, retries, leases, or exactly-once effects.
- A database transaction must end **before** DNS, HTTP, rendering, or extraction.
  Holding row locks across network work defeats concurrency and obstructs vacuum.
- Queue state is update-heavy. MVCC creates new row versions; indexed state and
  scheduling changes frequently prevent HOT optimization and increase index/WAL/
  vacuum work [S5, S6].
- PostgreSQL logging, tables, WAL, and replicas support accountability and
  recovery, but a sufficiently privileged operator can alter them. A PostgreSQL
  table is therefore not independently tamper-proof evidence.
- JSONB and full-text search are useful secondary facilities. They should not
  replace typed invariant-bearing columns, byte-exact captures, or a dedicated
  retrieval index once corpus/query scale warrants one [S11-S15].
- Physical replication improves availability; it also faithfully replicates bad
  deletes. Tested base backups plus archived WAL provide point-in-time recovery;
  replicas are not backups [S16-S22].

**Curiosity implication:** start with one PostgreSQL primary as the authoritative
metadata/queue/audit database, external immutable object storage for response
bodies and derived artifacts, and a replaceable downstream search index. Define
scale exit criteria before load forces an emergency migration.

## 1. Decision frame, bounded questions, and method

### 1.1 Bounded questions

1. Which PostgreSQL MVCC, isolation, and locking semantics matter for a crawler
   frontier and evidence ledger?
2. What does `FOR UPDATE SKIP LOCKED` guarantee, and what queue properties must
   Curiosity add?
3. Which logical entities, constraints, indexes, and partition boundaries fit a
   high-churn frontier plus append-mostly attempts and audit events?
4. Where do JSONB and built-in full-text search help without becoming an
   unbounded document store or accidental web-search architecture?
5. What do WAL, physical/logical replication, backups, and PITR protect—and not
   protect?
6. Where will contention, vacuum, WAL, connection, storage, and single-writer
   limits appear first?
7. Which security, operational, and license obligations transfer to Curiosity?
8. Which lessons can be adopted clean-room without copying PostgreSQL internals?

### 1.2 Method and evidence labels

Primary PostgreSQL 18 documentation and the PostgreSQL project license were
preferred throughout. The investigation covered every caller-specified category
and one bounded curiosity pass. No throughput number is asserted: PostgreSQL's
hard limits explicitly warn that practical performance and disk limits arrive
before theoretical maxima, and no public universal queue benchmark can predict
Curiosity's row width, eligibility distribution, worker count, storage, or
durability settings [S28].

- **FACT** — directly stated by a cited first-party PostgreSQL source.
- **INFERENCE** — the narrowest crawler-specific consequence of cited facts.
- **RECOMMENDATION** — a proposed Curiosity choice, not a PostgreSQL guarantee.
- **UNKNOWN** — material behavior or capacity not established by the inspected
  evidence.
- Confidence is **high**, **medium**, or **low**.

## 2. Role in the owned-search architecture

### 2.1 Recommended responsibility boundary

| Concern | PostgreSQL role | Verdict |
| --- | --- | --- |
| Crawl-run policy and budgets | Authoritative typed records and constraints | **ADOPT** |
| URL/frontier deduplication | Transactional unique keys after application normalization | **ADOPT**, but normalization remains application policy |
| Ready-work scheduling | Bounded indexed eligibility plus `SKIP LOCKED` lease claims | **ADAPT** to at-least-once |
| Host politeness | Durable origin state and eligibility timestamps | **ADAPT**; do not hold locks during HTTP |
| Attempts, redirects, edges, decisions | Append-mostly relational evidence | **ADOPT** |
| Raw HTTP/render captures | IDs, hashes, lengths, media metadata, object references only | **REJECT** database-as-blob-default |
| Extracted text and ad hoc investigation | Bounded text/JSONB/FTS for recent or operational data | **ADAPT** |
| Primary web retrieval index | Feed a separate replaceable lexical/vector index | **REJECT** PostgreSQL-only assumption |
| Audit | Transactional application ledger plus external immutable export | **ADAPT** |
| HA | Physical standby, optionally synchronous for selected commits | **DEFER** until RPO/RTO justify complexity |
| Disaster recovery | Base backups, WAL archive, PITR, restore drills | **ADOPT before production** |

**INFERENCE (high):** PostgreSQL is most valuable at the boundary where a single
transaction must preserve crawler invariants: “this work was claimed under this
policy,” “this attempt produced this capture,” and “these edges and audit events
belong to that attempt.” Large immutable payloads and high-fanout query serving
have different storage and scaling requirements.

### 2.2 Transaction boundary is the architecture boundary

**RECOMMENDATION (high):** use three short transaction classes:

1. **Claim:** select a small deterministic batch of eligible jobs, lock them with
   `SKIP LOCKED`, assign an unguessable lease token/owner/expiry and increment an
   attempt counter, write a claim event, then commit.
2. **Work outside PostgreSQL:** perform DNS, robots evaluation, fetch, redirects,
   rendering, hashing, object upload, and extraction under independent hard
   budgets. No database transaction remains open.
3. **Finalize:** condition the state transition on the same job ID and live lease
   token; append attempt/capture/edge/policy/audit/outbox rows; update the mutable
   job and origin state; commit atomically.

This split makes a worker crash recoverable through lease expiry. It also means
delivery is **at least once**: a fetch can succeed but its finalization can be
lost or its commit acknowledgement can be ambiguous. Idempotency keys, attempt
identity, capture hashes, and lease fencing must make replay safe. An external
HTTP request cannot participate atomically in a PostgreSQL transaction.

## 3. MVCC, isolation, and locking

### 3.1 MVCC properties that help

**FACT (high):** PostgreSQL statements read snapshots. Ordinary reads do not
conflict with ordinary writes, and writes do not block reads; row/table/advisory
locks remain available where MVCC alone is insufficient [S2].

**FACT (high):** the default `READ COMMITTED` isolation level takes a new snapshot
for each statement. Two successive selects in one transaction can see different
committed states. Updating and row-locking statements may wait for a concurrent
updater and then re-evaluate their predicate against the updated row [S3].

**INFERENCE (high):** this is appropriate for simple queue claims when selection,
locking, and transition are one atomic database operation or one short
transaction. It is unsafe to perform an unlocked “find ready jobs” query and
later update those IDs as if the first snapshot reserved them.

**FACT (high):** PostgreSQL's `REPEATABLE READ` provides snapshot isolation and
can abort a transaction that tries to modify a row changed since its snapshot.
`SERIALIZABLE` adds Serializable Snapshot Isolation checks and returns SQLSTATE
`40001` when a retry is required [S3].

**RECOMMENDATION (high):** keep ordinary claims and completions at `READ
COMMITTED`, with constraints and explicit row locks for their narrow invariants.
Reserve `SERIALIZABLE` for rare multi-row rules that cannot be expressed as
unique/check/exclusion constraints, and implement whole-transaction retry with a
strict attempt limit and jitter. Higher isolation is not a substitute for short
transactions or idempotency.

### 3.2 Row, table, advisory, and deadlock behavior

**FACT (high):** `FOR UPDATE` prevents other transactions from modifying,
deleting, or taking conflicting locks on selected rows until transaction end.
Row locks do not block plain reads, but locking a row can cause a disk write.
`SELECT ... FOR UPDATE` also takes a `ROW SHARE` table lock [S4].

**FACT (high):** deadlocks are automatically detected and one transaction is
aborted; the victim is not predictable. PostgreSQL recommends consistent lock
ordering. Without a deadlock, a lock wait can otherwise continue indefinitely
unless the application configures a timeout [S4, S31].

**RECOMMENDATION (high):** always lock crawler objects in a declared order, for
example run → origin → job, and set role-specific `lock_timeout`,
`statement_timeout`, `transaction_timeout`, and
`idle_in_transaction_session_timeout`. Treat deadlock and serialization errors
as bounded retryable transaction failures, not as job failures.

**FACT (high):** advisory locks have application-defined meaning and are not
enforced by the data model. Session-level locks survive transaction rollback and
require release/session end; transaction-level locks release at transaction end.
Advisory and regular locks consume a shared lock-memory pool [S4].

**RECOMMENDATION (high):** do not use session advisory locks as the authoritative
frontier or lease. They leave no durable owner/expiry/history row and can interact
badly with pooling. Transaction-level advisory locks are acceptable only for
short, coarse coordination such as serializing rare maintenance for one origin;
the durable state must still be relational.

### 3.3 Long transactions are crawler poison

**FACT (high):** updates/deletes leave old row versions until vacuum can reclaim
them. Open transactions can prevent cleanup, and idle-in-transaction sessions
can hold locks and contribute to bloat. Vacuum is also required for planner
statistics, visibility maps, and XID/MXID wraparound safety [S5, S31].

**RECOMMENDATION (high):** prohibit network calls, user/model waits, object
uploads, and batch extraction inside transactions. Alert on transaction age, not
only query duration. Prepared transactions should remain disabled unless a
separately justified two-phase-commit design exists; PostgreSQL defaults
`max_prepared_transactions` to zero and recommends zero when they are unused
[S31].

### 3.4 IDs and ordering

**FACT (high):** sequence changes are visible immediately and are not rolled back
if the transaction aborts [S3].

**INFERENCE (high):** a sequence-generated event ID is a useful unique cursor but
is neither gapless nor proof of commit order. Curiosity must not describe it as a
complete temporal order. Preserve causal links (`run_id`, `job_id`, `attempt_id`,
parent event), database timestamps, and source-observation timestamps. If an
external CDC cursor/LSN is recorded, label it as replication position rather than
event time.

## 4. `SKIP LOCKED` queue semantics

### 4.1 Exact guarantee

**FACT (high):** with `SKIP LOCKED`, selected rows that cannot be locked
immediately are skipped. PostgreSQL explicitly warns that this creates an
inconsistent view unsuitable for general-purpose work, but says it can avoid
lock contention among multiple consumers of a queue-like table. It skips only
row locks; the normal table-level lock is still acquired [S1].

**FACT (high):** when `LIMIT` is used, locking stops after enough rows have been
returned. Without a uniquely constraining `ORDER BY`, `LIMIT` returns an
unpredictable subset. For locking queries generally, PostgreSQL also cautions
that at `READ COMMITTED` an `ORDER BY` result can appear out of order if lock
waiting occurs and ordering values change [S1].

### 4.2 What it does not guarantee

The official contract does **not** establish:

- strict FIFO, weighted fairness, or starvation freedom;
- a stable global ordering across consumers;
- work acknowledgement or redelivery;
- lease expiry, heartbeat, cancellation, or fencing;
- exactly-once claim, fetch, or completion;
- bounded scan work when many early index entries are locked or ineligible;
- cross-partition global ordering or distributed-primary behavior.

**INFERENCE (high):** workers can make progress around a slow locker, but a hot or
repeatedly relocked row can be deferred. This is a throughput mechanism, not a
fair queue protocol.

### 4.3 Required application protocol

Each frontier job should expose typed fields for at least:

- stable job ID, run ID, normalized URL ID, origin ID, discovery depth;
- state (`queued`, `leased`, terminal classes), priority class, deterministic
  tie-break ID, and `available_at`;
- lease token, worker identity, leased/expiry timestamps;
- bounded attempts, last error class, and terminal reason;
- policy/budget version and enqueue cause;
- creation and state-change timestamps.

**RECOMMENDATION (high):** selection order should end in a unique immutable key,
and a claim should update/return the chosen rows before commit. Completion must
compare the lease token so a late worker cannot overwrite a re-leased job. Lease
expiry should use database time; worker clocks are evidence, not authority.

**RECOMMENDATION (high):** retry policy belongs in data: classify transport,
HTTP, robots/policy, parsing, budget, and internal failures; calculate a bounded
next-attempt time; cap attempts and elapsed age; move exhausted work to an
inspectable terminal state rather than an unbounded “dead-letter retry loop.”

### 4.4 Wakeups

**FACT (high):** `NOTIFY` is delivered only after the notifying transaction
commits and only between transactions for the listener. Duplicate channel/payload
pairs in one transaction may be folded. Payloads are under 8000 bytes by default,
and a long-running listening transaction can prevent notification-queue cleanup
[S27].

**RECOMMENDATION (high):** use `LISTEN/NOTIFY` only as a latency hint (“the table
may have work”), carrying at most an opaque key. Workers must always re-query the
durable frontier and use periodic polling, because the table—not notification
delivery—is authoritative.

## 5. Crawler-specific logical schema

This is a logical decomposition, not DDL. Names are illustrative and contracts
remain provider-neutral.

| Entity | Purpose and invariant | Mutation profile |
| --- | --- | --- |
| `crawl_run` | Seed set, normalized policy snapshot, hard budgets, status, owner, start/end reason | Low-update control row; avoid using it as a global counter hotspot |
| `origin` | Normalized scheme/host/port identity and durable policy reference | Stable identity |
| `origin_schedule` | `next_allowed_at`, active lease count/generation, robots refresh eligibility | Hot and contention-prone; shard/serialize narrowly |
| `url_resource` | Submitted and normalized fetch identity; unique normalization-version/key | Mostly insert; never treat publisher canonical as identity authority |
| `frontier_job` | Ready/leased/terminal state, eligibility, priority, lease fence, retry budget | High churn; narrow row |
| `discovery_edge` | Parent capture/URL, child submitted URL, relation, DOM/source context, observed time | Immutable append |
| `robots_observation` | Fetched robots bytes reference/hash, status, parser/version, observed/expiry time | Versioned append |
| `policy_decision` | Input identity, decision, reason, policy/version, evidence references | Immutable append |
| `fetch_attempt` | Lease/job, request timing, DNS/connection/redirect/status/error and byte budgets | Immutable append |
| `capture` | Requested/final URL, redirect chain reference, headers/body object IDs, hashes, MIME and truncation | Immutable metadata; bytes external |
| `extraction` | Capture ID, extractor/version, output object/hash, language and quality flags | Versioned append |
| `passage` | Bounded searchable/citable spans with offsets/hashes | Derived, rebuildable |
| `audit_event` | Actor, action, causal IDs, policy version, old/new state digest, timestamp | Append-only by application privilege |
| `outbox_event` | Transactional message for index/object/audit exporters; idempotency key | Insert then delivery-state update, or append plus consumer checkpoint |

### 5.1 Relational invariants first

**RECOMMENDATION (high):** use typed columns and constraints for every field that
drives authority, scope, budget, scheduling, retention, uniqueness, or joins.
Examples include state, run/origin/job IDs, normalized URL hash/version,
available/lease times, byte counts, policy versions, and content hashes. Use
JSONB only for bounded sparse metadata whose absence or shape cannot violate a
security or scheduling invariant.

The database can enforce uniqueness of the *application-supplied* normalized key;
it cannot decide correct URL normalization, DNS scope, redirect authority,
robots semantics, or content canonicalization. Store normalization/policy
versions so a future rule change does not silently reinterpret old identities.

### 5.2 Separate mutable state from immutable history and wide payloads

**INFERENCE (high):** a narrow `frontier_job` lowers heap/index/WAL churn and lock
duration. Append-only attempts, captures, and audit events avoid repeatedly
rewriting a growing JSON “job history.” Wide headers, body bytes, screenshots,
render traces, and extracted documents should be content-addressed objects with
length/hash/media metadata in PostgreSQL.

**RECOMMENDATION (high):** commit object references only after upload integrity is
known; use an outbox/reconciliation state for orphan detection. Database/object
storage cannot be made one atomic resource without another protocol, so both
“object uploaded but DB commit failed” and “DB reference committed but object
unavailable” need bounded repair paths.

## 6. Index design and partitioning

### 6.1 Hot frontier indexes

**FACT (high):** partial indexes contain only rows satisfying a predicate, can be
smaller and cheaper to maintain, and can enforce uniqueness over a subset. A
query can use one only when the planner can prove its condition implies the
index predicate; parameterized clauses often cannot establish such implication
[S7].

**RECOMMENDATION (high):** begin with a small number of purpose-built B-tree
indexes:

- a partial ready-work index whose predicate is the stable queued state and whose
  keys follow actual eligibility/order filters (`run/shard`, `available_at`,
  priority, unique job ID);
- a lease-expiry/reaper index over leased rows;
- unique normalized identity/deduplication indexes;
- narrow foreign-key and operational lookup indexes proven by query plans.

Do not put `now()` into a partial-index predicate. Keep time eligibility in the
index key and use a stable state predicate. Keep mutable indexed fields minimal:
every changed indexed key creates index maintenance and makes HOT optimization
less likely.

**FACT (high):** HOT can avoid new index entries only when an update changes no
indexed columns (BRIN excepted) and the old page has enough free space. Lowering
table `fillfactor` can increase the chance of HOT updates [S6].

**RECOMMENDATION (medium):** benchmark per-table fillfactor and autovacuum
settings for the hot frontier. Do not assert that HOT will save lease transitions:
state, availability, and lease-expiry fields are commonly indexed and therefore
often disqualify those updates.

### 6.2 Covering and wide indexes

**FACT (high):** B-tree supports index-only scans, but MVCC visibility may still
require heap access for recently changed pages. Included payload columns enlarge
indexes, and PostgreSQL advises conservatism, especially for wide values [S8].

**RECOMMENDATION (high):** do not build a wide covering index around the queue.
Its pages change continuously, so all-visible coverage will be poor and payload
duplication expensive. Fetch the small claimed batch from the heap. Covering
indexes are better candidates for older immutable audit/attempt lookups.

### 6.3 Partition only for a measured lifecycle boundary

**FACT (high):** declarative range/list/hash partitioning can prune work and make
bulk retention efficient through partition detach/drop without row-by-row delete
and vacuum. It also adds planning/memory/DDL overhead; too many partitions harm
planning, and unique/primary constraints on a partitioned table must include all
partition key columns [S9].

**RECOMMENDATION (high):** do **not** partition the first frontier merely because
it is a queue, and do not partition it by mutable state: moving queued → leased →
done would move rows across partitions and complicate uniqueness. First choices
for later partitioning are append-mostly `fetch_attempt`, `audit_event`, and
derived artifacts by coarse retention time, or entire run cohorts when deletion
and query patterns align.

**RECOMMENDATION (medium):** consider a fixed hash shard in the hot frontier only
after evidence of shared-index/page contention or a need to allocate worker
pools. It sacrifices a simple global priority order and does not create multiple
writable primaries. Keep partition count bounded and test pruning with prepared
queries.

Partition maintenance is not lock-free: dropping a partition takes an `ACCESS
EXCLUSIVE` lock on the parent, while concurrent detach can use a weaker lock with
restrictions; parent-level concurrent index creation also requires a staged
per-partition technique [S9]. Treat retention DDL as reviewed operations.

## 7. JSON and full-text search

### 7.1 JSONB is metadata, not byte evidence

**FACT (high):** `json` stores the exact input text while `jsonb` stores a parsed
binary form, supports indexing, and does not preserve whitespace, object-key
order, or duplicate object keys (only the last duplicate remains). Updating a
JSON document locks the whole row; PostgreSQL recommends manageable atomic JSON
documents to reduce contention [S11].

**Crawler implication (high):** never use JSONB as the sole representation of raw
headers, source JSON, or any capture whose byte-level fidelity and duplicate-key
behavior matter. Preserve raw bytes externally with a cryptographic hash. JSONB
is appropriate for a bounded parsed convenience projection.

**FACT (high):** GIN can index JSONB containment/existence/jsonpath operations.
The default and `jsonb_path_ops` operator classes have different flexibility and
size/selectivity trade-offs; targeted expression indexes can be smaller than an
index of every key/value [S11, S12].

**RECOMMENDATION (high):** promote frequently filtered keys into typed columns.
Create targeted JSON expression/GIN indexes only from observed queries. A generic
GIN index over heterogeneous response metadata multiplies write work and can
become an ingestion tax.

### 7.2 Built-in full-text search is a useful secondary lane

**FACT (high):** PostgreSQL text search parses text into normalized lexemes,
stores `tsvector`, queries with `tsquery`, supports language configurations and
ranking, and can accelerate matches with GIN [S13-S15]. An explicit configuration
must be used consistently for an expression index; a stored generated `tsvector`
is another documented pattern [S14].

**FACT (high):** GIN updates can be slow because one document generates many
index keys. The fast-update pending list improves foreground insertion but adds
search work and can cause latency spikes when cleanup occurs; autovacuum and the
pending-list limit materially affect behavior [S12].

**RECOMMENDATION (medium):** use FTS for bounded operator search, recent-capture
inspection, audit exploration, or an MVP lexical lane. Version the extraction and
text configuration. Keep snippets tied to capture IDs and offsets. Defer using
PostgreSQL as the sole public-web lexical index until benchmarks cover corpus
size, update rate, ranking needs, pagination, deletion, and recovery. PostgreSQL
FTS does not by itself supply crawl freshness, authority, duplicate clustering,
hybrid vector retrieval, distributed serving, or retrieval explanations.

## 8. Audit and provenance

### 8.1 Transactional audit value

**RECOMMENDATION (high):** every authoritative transition should append an
`audit_event` in the same transaction, including actor/service identity,
operation, causal entity IDs, policy/version, bounded reason, prior/new state
digests, and trace/request ID. Fetch evidence belongs in typed attempt/capture/
decision tables; audit should reference it rather than duplicate untrusted page
content.

An outbox row committed with the same transition can drive external indexing,
metrics, or immutable audit export. Consumers must be idempotent and checkpointed;
logical replication slots can retain WAL indefinitely unless bounded and
monitored [S20, S22].

### 8.2 What PostgreSQL audit is not

**NEGATIVE RESULT (high confidence):** inspected core documentation establishes
structured server logging and transactional tables, but no core guarantee that a
table or local log is cryptographically tamper-evident against the database
owner, superuser, host administrator, or compromised backup operator [S24-S26].
RLS is bypassed by superusers and `BYPASSRLS` roles, and table owners normally
bypass it [S24].

**RECOMMENDATION (high):** make application roles insert-only on audit data and
deny update/delete, but label this as accidental/malicious application protection,
not privileged-operator immutability. Stream hashes/events to a separately
administered append-only/WORM destination, periodically anchor a hash chain or
Merkle root, protect clocks and keys, and test reconciliation. Keep raw crawler
content out of SQL/server logs.

**FACT (high):** PostgreSQL can emit stderr, CSV, JSON, syslog, and other logs;
statement logging can expose sensitive data and plaintext passwords, and the
logging collector can block backends rather than lose messages if overwhelmed
[S26].

**RECOMMENDATION (high):** prefer structured operational logs with actor,
application, transaction/session, error class, and query ID; redact or suppress
bind values and content. Database logs complement, but do not replace, the
domain audit ledger.

## 9. WAL, replication, and backups

### 9.1 Local durability and WAL cost

**FACT (high):** WAL requires change records to reach durable storage before
corresponding data pages. Crash recovery replays WAL, and group commit can make
one WAL sync cover multiple small transactions [S16]. Reliability still depends
on storage honoring flush requests; WAL records have CRC-32C, and PostgreSQL 18
documents data-page checksums as enabled by default [S17].

**INFERENCE (high):** every queue transition, retry, audit append, and index
change consumes WAL. A crawler's database cost is driven not only by rows stored
but by state-transition frequency, indexed-column churn, full-page images,
checkpoints, replicas, and archive retention.

**RECOMMENDATION (high):** retain durable commits for authoritative state and
audit. Do not turn off `fsync`, full-page writes, or synchronous commit merely to
win ingestion throughput without a separately approved loss model. Batch claims
modestly to benefit from group commit while preserving bounded lock time and
failure scope.

### 9.2 Physical replication

**FACT (high):** streaming physical replication sends WAL as it is generated and
is asynchronous by default. Synchronous replication can wait for WAL to be
written/flushed/applied on selected standbys, increasing durability and latency;
locks remain held while commit waits [S20]. Physical log shipping normally
requires the same major PostgreSQL version and compatible architecture [S20].

**RECOMMENDATION (medium):** add a physical standby when measured RTO requires
fast failover. Choose asynchronous versus synchronous acknowledgement from an
explicit RPO/latency/failure-domain analysis. Synchronous replication reduces an
acknowledged-loss window under its modeled failures; it does not solve operator
error, correlated compromise, split-brain orchestration, or backups.

Queue consumers must connect only to the current writable primary. Read replicas
may serve stale operational/reporting reads; they must not decide that no work
exists or issue leases. `remote_apply` can provide stronger read-after-write
behavior at extra latency, but that is a deliberate per-workload choice [S20].

### 9.3 Logical replication and slots

**FACT (high):** logical replication publishes changes by replication identity,
can select subsets, and applies a single subscription's changes in publisher
order with transactional consistency [S21].

**RECOMMENDATION (medium):** logical replication/decoding is a candidate for
feeding a downstream retrieval index or external ledger, not the authoritative
queue-claim mechanism. Preserve a transactional outbox as the provider-neutral
contract so a replication technology can change.

**FACT (high):** replication slots prevent required WAL removal, but an inactive
slot can fill `pg_wal`; PostgreSQL provides size/idle controls, with trade-offs
that can invalidate a lagging consumer [S20, S22]. `hot_standby_feedback` can
avoid standby query cancellation but can cause bloat on the primary [S22].

**RECOMMENDATION (high):** alert on slot activity, retained WAL bytes, restart
LSN age, sender/replay lag, archive failures, and disk headroom. Every slot needs
an owner, purpose, maximum outage budget, and removal/rebuild runbook.

### 9.4 Backup and PITR

**FACT (high):** PostgreSQL defines SQL dumps, filesystem backups, and continuous
archiving as distinct backup approaches. A base backup plus a continuous WAL
sequence supports whole-cluster point-in-time recovery; logical `pg_dump` output
cannot substitute for the physical base backup required by WAL replay [S18, S19].
PostgreSQL 18 also supports incremental base backups, but restoration requires
the dependency chain and `pg_combinebackup`, which operators must track [S19].

**RECOMMENDATION (high):** before production, define and test:

- encrypted, access-separated base backups and WAL archives;
- retention that satisfies deletion policy and forensic needs;
- restore to a chosen point on an isolated host;
- checksum/manifest/object-reference reconciliation;
- RPO/RTO measurement, not configuration inference;
- recovery of PostgreSQL **and** referenced object-store versions/index rebuilds.

A standby is not a backup: it reproduces committed corruption and deletion. WAL
archive failure can fill `pg_wal` and force a PANIC shutdown, so archival health
and disk capacity are availability signals [S19]. Backup credentials, manifests,
WAL, and configuration are sensitive; WAL effectively contains database changes.

## 10. Contention and scale limits

### 10.1 Likely bottlenecks

| Pressure | Mechanism | Crawler mitigation |
| --- | --- | --- |
| One hot origin | Workers update/lock the same politeness row | Assign origin ownership/shards; make origin transaction tiny; never lock during fetch |
| Ready-index head contention | Many workers scan the same earliest range | Bounded batch, deterministic tie break, modest workers, optional fixed shards after measurement |
| Queue bloat | MVCC versions plus indexed state changes | Narrow hot table, aggressive per-table autovacuum, terminal-state archival, no long transactions |
| Index write amplification | Every scheduling/state index changes | Minimal indexes, typed query paths, separate payload/history |
| WAL/checkpoint I/O | Frequent commits, indexes, full-page images | Modest batching, storage sizing, checkpoint/WAL monitoring; do not trade away durability silently |
| Connection/process overhead | Many crawler tasks each hold a DB session | Bounded connection pool; workers may greatly exceed DB connections |
| Lock/deadlock storms | Multi-row completion or origin updates in mixed order | Consistent lock order, short transactions, timeouts, bounded retries |
| GIN latency spikes | Pending-list cleanup and many keys/document | Isolate derived search, tune/benchmark, rebuildable downstream index |
| Replica/CDC lag | WAL rate exceeds network/replay/consumer | Lag budgets, slot bounds, backpressure or rebuild plan |
| Retention DDL | Partition/index operations take relation locks | Coarse partitions, reviewed maintenance, lock timeout |

### 10.2 Vacuum is part of queue correctness operations

**FACT (high):** standard vacuum can run alongside ordinary reads/writes but
generates substantial I/O; `VACUUM FULL` rewrites the table and takes `ACCESS
EXCLUSIVE`. Autovacuum dynamically reacts to dead/inserted tuples and is also
forced for wraparound prevention [S5].

**RECOMMENDATION (high):** give the frontier and outbox explicit per-table
autovacuum attention based on measured churn. Monitor live/dead tuples, last
vacuum/analyze, vacuum progress, HOT ratio, index size/use, transaction age, and
oldest XID/MXID. Never disable autovacuum globally. Prefer maintaining steady
state to routine `VACUUM FULL` outages.

### 10.3 Absolute limits are not capacity claims

**FACT (high):** PostgreSQL documents a 32-TB relation limit with default 8-KB
blocks and a 1-GB field limit, while explicitly warning that practical
performance or disk limits arrive sooner [S28].

**RECOMMENDATION (high):** a single 1-GB field is not a safe crawler budget.
Enforce far smaller request, response, decompressed, header, JSON, extraction,
and SQL-parameter limits before PostgreSQL. Keep untrusted external data from
driving unbounded row width, nesting, index keys, regex/text queries, or logs.

**UNKNOWN:** sustainable claim/finalize transactions per second, maximum useful
worker count, queue depth, retry churn, FTS corpus, WAL/day, and failover/restore
times on Curiosity hardware. These require the checks in Section 13.

## 11. Security, operations, and license

### 11.1 Least privilege and network boundary

**FACT (high):** PostgreSQL access is role-based; roles own objects, receive
object privileges, and can inherit membership [S23]. `pg_hba.conf` selects the
first matching connection rule with no fall-through and can restrict database,
role, address, TLS, and authentication method [S25]. SCRAM-SHA-256 is the most
secure built-in password method documented; MD5 password support is deprecated
[S25]. PostgreSQL supports TLS and optional client-certificate verification
[S25].

**RECOMMENDATION (high):** separate non-owner login roles for scheduler, fetch
finalizer, extractor, index exporter, auditor, and read-only operations. Application
roles get only required table/column/function privileges—no DDL, superuser,
`BYPASSRLS`, replication, arbitrary extension install, or audit mutation. Restrict
network ingress, require verified TLS and SCRAM or managed certificate identity,
and use short-lived secret distribution outside crawler data.

Do not let application roles create objects in schemas on their `search_path`.
The PostgreSQL manual warns the default path is suitable only for mutually
trusting users [S31]. Schema-qualify privileged routines and harden any
security-definer function.

### 11.2 RLS is defense in depth, not the root boundary

**FACT (high):** RLS can filter rows by role and defaults to deny when enabled
without policies. Superusers and `BYPASSRLS` always bypass it; owners normally do,
and policy subqueries can create concurrency/race concerns [S24].

**RECOMMENDATION (medium):** use separate databases/schemas/roles and ordinary
privileges as the primary service boundary. Add RLS only if run/tenant isolation
requires it, test concurrent policy behavior, force it for owners when intended,
and never claim it protects against database administrators.

### 11.3 Operational controls

PostgreSQL exposes activity, waits, table/index I/O, vacuum, WAL, archiver,
replication, slots, and progress views; cumulative statistics can lag and are
reset after unclean shutdown/PITR [S29]. Curiosity should monitor both domain and
database signals:

- queue depth and oldest age by state/shard/origin; claim rate; lease expiry;
  retries and terminal reasons; origin-delay compliance;
- transaction age, idle-in-transaction sessions, lock/deadlock/timeout counts,
  wait events and pool saturation;
- dead/live tuples, HOT ratio, vacuum/analyze age and progress, table/index bytes,
  index scan/use ratios;
- WAL bytes/rate/sync latency, checkpoints, archive success/age, `pg_wal` free
  space, replication/slot/replay lag;
- backup age, restore-drill result, object-reference reconciliation, and outbox
  consumer lag.

Statistics are telemetry, not evidence. Preserve durable domain events for crawl
decisions and attempts.

### 11.4 License

**FACT (high):** PostgreSQL is distributed under the permissive PostgreSQL
License, which permits use, copying, modification, and distribution with the
specified copyright/license notices and warranty disclaimer [S30].

**RECOMMENDATION (high):** preserve the license/notice for any redistributed
PostgreSQL software or documentation. Inventory each extension, driver, image,
backup tool, and managed-service component separately; PostgreSQL's license does
not determine their licenses. This study does not adopt any extension, including
an audit extension.

## 12. Clean-room lessons and Curiosity verdicts

| Lesson | Verdict | Rationale |
| --- | --- | --- |
| One atomic control-plane transaction | **ADOPT** | State, attempt, provenance, audit, and outbox can share commit/rollback |
| `SKIP LOCKED` claim batches | **ADAPT** | Good contention avoidance, but add lease fencing, expiry, retry and deterministic bounded order |
| Transaction across fetch/render | **REJECT** | Locks and snapshots would span unpredictable hostile network work |
| Exactly-once crawl claim | **REJECT** | DB commit and external HTTP/object effects cannot be one atomic effect |
| Relational core plus sparse JSONB | **ADOPT/ADAPT** | Constraints for authority; JSONB for bounded non-critical metadata |
| Raw bodies/screenshots in PostgreSQL | **REJECT by default** | Row/WAL/backup/index amplification and byte-fidelity concerns |
| Append-mostly attempts/edges/policy evidence | **ADOPT** | Preserves version and causality instead of overwriting history |
| PostgreSQL-local “immutable” audit | **REJECT as a security claim** | Privileged operators and host compromise remain inside trust boundary |
| External immutable audit anchoring | **ADAPT** | Adds an independent administrative/failure boundary |
| Early partition explosion | **REJECT** | Planning, uniqueness, DDL, and operational complexity before evidence |
| Coarse time partitioning of old append data | **DEFER** | Valuable when retention and measured size justify it |
| Built-in FTS for operations/MVP | **ADAPT** | Useful bounded lane; GIN and ranking limits require measurement |
| PostgreSQL as permanent global web index | **REJECT as an assumption** | Different serving, ranking, and horizontal-scale problem |
| Physical standby as backup | **REJECT** | Replicates logical mistakes; PITR needs independent base backup/WAL |
| Tested PITR and object reconciliation | **ADOPT** | Required to validate recoverability of the whole evidence chain |
| Logical outbox/CDC to replaceable indexes | **ADAPT** | Preserves provider-neutral contract; slots need hard operational bounds |

No PostgreSQL implementation detail needs to be copied to use these lessons.
They derive from public behavioral contracts: snapshots, locks, queue-oriented
skip semantics, constraints, WAL recovery, and replication boundaries.

## 13. Unknowns and required checks before commitment

### 13.1 Correctness tests

1. Concurrent claim test with many workers, deterministic ties, locked head rows,
   rollback, disconnect before/after commit, and worker death.
2. Lease-fencing test: expired worker finalizes after another worker has re-leased
   and completed the same job.
3. Retry/idempotency test across DNS/HTTP/object upload/finalize failure points.
4. Origin-politeness invariant under concurrency, redirects, clock skew, worker
   pause, and primary failover.
5. Deadlock/serialization/lock-timeout retry test with a declared lock order.
6. Audit/outbox atomicity and duplicate/reordered consumer test.
7. URL-normalization version migration and dedupe collision test.

### 13.2 Capacity and failure tests

1. Representative queue row width, eligibility distribution, ready/leased ratio,
   batch size, worker count, and retry storm—not a synthetic all-ready queue only.
2. Measure claim/finalize p50/p95/p99, rows examined per claim, lock waits, CPU,
   cache misses, WAL bytes/job, fsync/checkpoint latency, bloat, and vacuum lag.
3. Compare minimal index sets, fillfactor/autovacuum settings, and optional fixed
   hash shards; retain plans from `EXPLAIN (ANALYZE, BUFFERS, WAL)` in a test
   environment, never on unauthorized production.
4. GIN/FTS and JSON indexes under simultaneous ingestion, pending-list cleanup,
   vacuum, backup, and replica replay.
5. Kill -9/power-loss-equivalent crash recovery on disposable infrastructure;
   ambiguous client commit acknowledgement; storage-full and WAL-archive outage.
6. Standby lag/failover with in-flight leases, old-primary fencing, and connection
   rerouting. Verify no dual primary can claim work.
7. Full and incremental backup restore, PITR before an accidental delete, timeline
   handling, and referenced-object/index reconstruction. Record measured RPO/RTO.

### 13.3 Exit criteria for a specialized queue or sharded control plane

Define thresholds before launch for sustained/p99 claim latency, maximum primary
CPU/I/O/WAL utilization, vacuum debt, queue age, failover RTO, writable-region
requirements, and operator load. Crossing a threshold triggers a reviewed ADR,
not automatic technology churn. Keep the frontier contract and outbox
provider-neutral so PostgreSQL can be retained as system of record even if work
distribution moves.

## 14. Bounded curiosity pass

After synthesis, remaining in-frame gaps were scored 1–5 for relevance, value,
novelty, and cost (lower cost is better). Only the highest-value low-cost
contradiction was pursued.

| Thread | R | V | N | Cost | Result |
| --- | ---: | ---: | ---: | ---: | --- |
| Exact `SKIP LOCKED` warning and queue exception | 5 | 5 | 3 | 1 | **Pursued:** PostgreSQL explicitly says inconsistent view, unsuitable generally, useful for queue-like consumers [S1] |
| Whether `LIMIT`/ordering implies fairness | 5 | 4 | 3 | 1 | **Pursued with same source:** unique order is needed for predictable subset; no fairness guarantee found [S1] |
| Universal worker/throughput ceiling | 5 | 4 | 2 | 5 | **CURIOSITY_NO_GO:** workload/hardware-specific; only benchmark can answer |
| Internal lock-manager/B-tree algorithm replication | 2 | 2 | 3 | 5 | **CURIOSITY_NO_GO:** unnecessary to the behavioral decision and clean-room boundary |
| Third-party queue extensions | 3 | 3 | 3 | 4 | **CURIOSITY_NO_GO:** caller asked PostgreSQL substrate; extension license/ops would widen frame |
| Third-party audit extensions | 3 | 3 | 2 | 4 | **CURIOSITY_NO_GO:** core audit boundary is sufficient; no extension is being adopted |
| Managed PostgreSQL vendor differences | 3 | 4 | 2 | 5 | **CURIOSITY_NO_GO:** no provider selected; would violate provider-neutral framing |
| Transparent data encryption products | 2 | 3 | 2 | 4 | **CURIOSITY_NO_GO:** deployment/storage choice not needed for substrate decision |

Stop condition: caller-frame coverage, primary-source saturation on material
behavior, and exhaustion of low-cost contradictions. Live follow-up curiosity is
not authorized; benchmark execution requires a declared workload and caller
approval.

## 15. Primary source ledger

All sources were accessed 2026-08-17. `current` resolved to PostgreSQL 18.6;
versioned links are used below for reproducibility.

- **[S1] PostgreSQL 18, `SELECT`, “The Locking Clause.”** `SKIP LOCKED`
  semantics, inconsistent view, queue-like use, table lock, ordering and `LIMIT`.
  <https://www.postgresql.org/docs/18/sql-select.html#SQL-FOR-UPDATE-SHARE>
- **[S2] PostgreSQL 18, “Introduction” to Concurrency Control.** MVCC snapshots
  and read/write non-conflict. <https://www.postgresql.org/docs/18/mvcc-intro.html>
- **[S3] PostgreSQL 18, “Transaction Isolation.”** `READ COMMITTED`, snapshot
  isolation, SSI, retries, sequence caveat.
  <https://www.postgresql.org/docs/18/transaction-iso.html>
- **[S4] PostgreSQL 18, “Explicit Locking.”** Table/row/advisory locks, disk
  writes, deadlocks and lock lifetime.
  <https://www.postgresql.org/docs/18/explicit-locking.html>
- **[S5] PostgreSQL 18, “Routine Vacuuming.”** Dead tuples, visibility,
  statistics, autovacuum, wraparound and lock/I/O effects.
  <https://www.postgresql.org/docs/18/routine-vacuuming.html>
- **[S6] PostgreSQL 18, “Heap-Only Tuples (HOT).”** Conditions, benefits,
  fillfactor and monitoring. <https://www.postgresql.org/docs/18/storage-hot.html>
- **[S7] PostgreSQL 18, “Partial Indexes.”** Predicates, planner implication,
  parameter limitation, partial uniqueness.
  <https://www.postgresql.org/docs/18/indexes-partial.html>
- **[S8] PostgreSQL 18, “Index-Only Scans and Covering Indexes.”** Visibility-map
  requirement and payload/index-width cautions.
  <https://www.postgresql.org/docs/18/indexes-index-only-scans.html>
- **[S9] PostgreSQL 18, “Table Partitioning.”** Benefits, locks, uniqueness,
  pruning, planning/memory overhead and best practices.
  <https://www.postgresql.org/docs/18/ddl-partitioning.html>
- **[S10] PostgreSQL 18, “Populating a Database.”** `COPY`, index/WAL/checkpoint
  and bulk-load trade-offs. <https://www.postgresql.org/docs/18/populate.html>
- **[S11] PostgreSQL 18, “JSON Types.”** `json`/`jsonb` fidelity, row locking,
  document design and JSONB indexing.
  <https://www.postgresql.org/docs/18/datatype-json.html>
- **[S12] PostgreSQL 18, “GIN Indexes.”** Inverted index, update/pending-list
  costs and cleanup. <https://www.postgresql.org/docs/18/gin.html>
- **[S13] PostgreSQL 18, “Full Text Search: Introduction.”** Lexemes,
  configurations, `tsvector`, `tsquery` and ranking.
  <https://www.postgresql.org/docs/18/textsearch-intro.html>
- **[S14] PostgreSQL 18, “Full Text Search: Tables and Indexes.”** Expression and
  generated-column GIN patterns and configuration consistency.
  <https://www.postgresql.org/docs/18/textsearch-tables.html>
- **[S15] PostgreSQL 18, “Preferred Index Types for Text Search.”**
  <https://www.postgresql.org/docs/18/textsearch-indexes.html>
- **[S16] PostgreSQL 18, “Write-Ahead Logging.”** WAL durability, crash recovery,
  group sync and PITR. <https://www.postgresql.org/docs/18/wal-intro.html>
- **[S17] PostgreSQL 18, “Reliability.”** Storage flush assumptions, full-page
  images, CRCs and checksums. <https://www.postgresql.org/docs/18/wal-reliability.html>
- **[S18] PostgreSQL 18, “Backup and Restore.”** Backup strategy classes.
  <https://www.postgresql.org/docs/18/backup.html>
- **[S19] PostgreSQL 18, “Continuous Archiving and Point-in-Time Recovery.”**
  Base/incremental backups, WAL archive, PITR, archive failure and timelines.
  <https://www.postgresql.org/docs/18/continuous-archiving.html>
- **[S20] PostgreSQL 18, “Log-Shipping Standby Servers.”** Physical streaming,
  asynchronous/synchronous behavior, lag, slots and version constraints.
  <https://www.postgresql.org/docs/18/warm-standby.html>
- **[S21] PostgreSQL 18, “Logical Replication.”** Publication/subscription,
  replication identity and transactional apply ordering.
  <https://www.postgresql.org/docs/18/logical-replication.html>
- **[S22] PostgreSQL 18, “Replication” configuration.** Slot/WAL bounds,
  synchronous standbys, lag and hot-standby feedback.
  <https://www.postgresql.org/docs/18/runtime-config-replication.html>
- **[S23] PostgreSQL 18, “Database Roles.”** Role, ownership, privilege and
  membership model. <https://www.postgresql.org/docs/18/user-manag.html>
- **[S24] PostgreSQL 18, “Row Security Policies.”** Default deny, owner/superuser
  bypass and policy race caveats. <https://www.postgresql.org/docs/18/ddl-rowsecurity.html>
- **[S25] PostgreSQL 18, client authentication, password authentication, and
  TLS.** <https://www.postgresql.org/docs/18/auth-pg-hba-conf.html>,
  <https://www.postgresql.org/docs/18/auth-password.html>,
  <https://www.postgresql.org/docs/18/ssl-tcp.html>
- **[S26] PostgreSQL 18, “Error Reporting and Logging.”** Structured destinations,
  blocking/drop behavior, statement sensitivity and wait logging.
  <https://www.postgresql.org/docs/18/runtime-config-logging.html>
- **[S27] PostgreSQL 18, `NOTIFY`.** Commit timing, folding, payload and queue
  behavior. <https://www.postgresql.org/docs/18/sql-notify.html>
- **[S28] PostgreSQL 18, “PostgreSQL Limits.”** Hard versus practical limits.
  <https://www.postgresql.org/docs/18/limits.html>
- **[S29] PostgreSQL 18, “The Cumulative Statistics System.”** Activity, wait,
  table/index, WAL, archiver, replication and progress views; lag/reset caveats.
  <https://www.postgresql.org/docs/18/monitoring-stats.html>
- **[S30] PostgreSQL project, “License.”** PostgreSQL License text and project
  characterization. <https://www.postgresql.org/about/licence/>
- **[S31] PostgreSQL 18, “Client Connection Defaults.”** `search_path`, statement/
  transaction/lock/idle timeouts, prepared transactions and GIN pending limit.
  <https://www.postgresql.org/docs/18/runtime-config-client.html>,
  <https://www.postgresql.org/docs/18/runtime-config-resource.html>

## 16. Confidence summary

- **High confidence:** core MVCC/locking/`SKIP LOCKED` semantics; vacuum/HOT
  consequences; JSONB fidelity; GIN/FTS mechanics; WAL/PITR/replication behavior;
  role/RLS/license boundaries. These are direct PostgreSQL 18 documentation.
- **Medium confidence:** recommended logical decomposition, first likely
  contention points, usefulness of fixed hash shards, and when FTS should exit.
  These are architecture inferences requiring Curiosity measurements.
- **Low/unknown:** exact capacity, fair scheduling under Curiosity's distribution,
  hardware RPO/RTO, managed-service behavior, and cost. No benchmark or provider
  was authorized or selected.
