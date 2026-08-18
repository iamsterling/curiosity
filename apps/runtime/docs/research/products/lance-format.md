# Lance columnar format and dataset architecture: clean-room reverse engineering

**Research and source-access date:** 2026-08-17  
**Reference point:** official Lance repository release **v10.0.0** (published
2026-08-07) and the official live specification as accessed on the date above.
[S1][S17]  
**Decision:** whether Lance's open file/table/index architecture should influence
or back Curiosity's owned evidence storage, independently of LanceDB.  
**Status:** research and recommendations only; no implementation, benchmark,
malformed-file test, legal opinion, or production approval.

## 1. Frame, boundary, and method

### 1.1 Bounded questions

1. What are the durable file, page, dataset, fragment, manifest, and reference
   boundaries?
2. How do format versions, schemas, rows, updates, deletes, compaction, and
   cleanup evolve without silently changing snapshot meaning?
3. Which object-store primitives make commits safe, and what does Lance leave
   to catalogs, applications, and operators?
4. Where do secondary indexes begin and end, especially during mutation?
5. What interoperability, security, and license properties are established by
   the open Lance project—not inferred from LanceDB?
6. Which clean-room lessons should Curiosity adopt, adapt, reject, or defer?

### 1.2 Lance is not LanceDB

**FACT (high):** Lance is an Apache-2.0 open lakehouse project defining a file
format, table format, index formats, catalog/namespace contracts, and Rust core
with Python and Java bindings. LanceDB is a separate database product built on
Lance. This report does not treat LanceDB APIs, servers, cloud services, or
Enterprise behavior as properties of the Lance format [S1][S2][S18].

**INFERENCE (high):** “uses Lance bytes” establishes neither a database service
nor a security/control plane. Four contracts remain separate:

| Contract | Lance establishes | Lance does not itself establish |
|---|---|---|
| File | Page container, offsets, encodings, footer/version | Table snapshots, users, query service |
| Table | Schema, fragments, manifests, transactions, history | Multi-table atomicity by default, scheduler, tenancy |
| Index | Segment discovery, coverage, invalidation/fallback rules | Relevance quality, complete freshness without fallback |
| Catalog/namespace | Discovery and commit-coordination interfaces | A universal authorization or governance policy |

### 1.3 Evidence and clean-room controls

Official specifications and guides, the v10.0.0 release record, repository
README/license/security page, and version-pinned protobuf definitions were read.
Source definitions were inspected only to resolve durable metadata and a spec
contradiction; no implementation algorithms or code are reproduced. No package
was installed, dataset created, endpoint called, credential used, traffic
intercepted, or private artifact accessed. All sources are primary and were
accessed 2026-08-17. Vendor benchmarks are retained only as unevaluated claims.

Labels used below:

- **FACT** — directly documented by a cited primary source.
- **INFERENCE** — bounded synthesis consistent with cited facts.
- **RECOMMENDATION** — Curiosity design/adoption judgment.
- Confidence is **high**, **medium**, or **low**.

## 2. Executive verdict

**RECOMMENDATION — ADOPT the architectural patterns; DEFER Lance as Curiosity's
canonical store pending bounded validation (high confidence).**

The central Lance composition is:

```text
independent column pages in immutable files
  -> horizontal fragments containing independent column files
  -> one complete immutable manifest per snapshot
  -> optimistic MVCC commit via conditional object creation
  -> separately versioned, immutable, partial-coverage index segments
  -> exact filtering/scanning for uncovered or invalidated rows
  -> compaction and retention cleanup as separate operations
```

This fits Curiosity's split between immutable fetched evidence and replaceable
derived artifacts (normalized text, passages, embeddings, ACL projections, and
rank features). Lance's strongest clean-room lesson is **two-dimensional data
evolution**: partition rows into fragments but allow each fragment's columns to
reside in independently replaceable files [S4][S8].

The dependency decision remains deferred because open bytes do not supply
Curiosity's canonical resource/capture/passage identity, source-rights model,
authorization, erasure policy, rank semantics, hostile-content boundary, or
distributed operating plane. Its default row identifier is a physical address;
stable IDs are optional and table-local, while secondary-index support for them
is still described as experimental [S9][S10].

## 3. File format: physical container and read economics

### 3.1 Layout

**FACT (high):** a Lance data file is an Arrow-oriented columnar container. It
has no Parquet-style row groups. Each column has one or more disk pages, and
different columns may have different page counts. Data buffers come first;
per-column protobuf descriptors and offset tables are near the tail; a fixed
footer records metadata/table offsets, counts, major/minor version, and `LANC`
magic. Column and global buffers are referenced by absolute file offsets [S3].

**FACT (high):** pages are intended to justify object-store range requests;
roughly 8 MiB is recommended, not required. Buffers are commonly 64-byte
aligned. Metadata can usually be resolved in one or two tail reads, after which
the reader fetches only pages and byte ranges intersecting selected columns and
row ranges. A known file size in fragment metadata can reduce footer discovery
work [S3][S16].

**INFERENCE (high):** row-group removal decouples page size, scanner partition
boundaries, and writer memory. This favors selective reads and wide multimodal
schemas, but object-request count, cache warmness, and page amplification become
first-class cost dimensions. It is not valid to infer Curiosity performance from
format shape alone.

### 3.2 Encodings and large values

**FACT (high):** the encoding layer separates logical Arrow-like data types from
physical layouts. Current documented layouts include mini-blocks for smaller
values, full-zip for larger values such as vectors, constant pages, and external
blob storage for values large enough to justify one request per value. Random
access uses cached page/chunk lookup metadata; scans may avoid that search cache.
The experimental 2.3 format adds sparse structural pages [S5][S6].

**FACT (high):** nested validity/list structure is encoded separately from value
compression. Mini-blocks cap point-read amplification; full-zip trades less
chunk metadata for potentially another lookup read on variable-width data;
external blob descriptors point to out-of-line bytes inside the file [S5].

**RECOMMENDATION (high):** benchmark Curiosity using its actual mixture of tiny
IDs, long text, nested provenance, fixed vectors, and large captures. Report cold
and warm range requests, bytes read, memory, and decode CPU—not only scan rate.
Keep oversized raw captures in an independently hash-addressed evidence plane
unless Lance blob behavior wins an explicit lifecycle test.

### 3.3 File-format version contract

**FACT (high):** a file has one major/minor version covering container and
encoding strategy. The official matrix lists legacy 0.1, stable 2.0 and 2.1,
2.2-era capabilities, and **2.3 as unstable**. `stable` and `next` aliases resolve
per SDK release; `next` and any unstable version have no compatibility guarantee.
The repository promises future Lance releases will read stable
`data_storage_version` values, but older releases may not read newer formats
[S1][S6].

**FACT (high):** table reader and writer feature bitmaps are a second
compatibility gate. Unknown required flags must cause an unsupported error, not
silent interpretation. Current flags cover deletion files, stable row IDs,
table config, base paths, transaction-file mode, unstable overlays, and MemWAL
index catch-up [S7].

**RECOMMENDATION (high):** pin an explicit stable storage version and a tested
reader/writer matrix. Reject unknown flags and mixed writer versions by policy.
Never let SDK semantic-version claims substitute for on-disk compatibility.

## 4. Dataset, fragments, manifests, and references

### 4.1 Dataset root

**FACT (high):** the standard root separates `data/`, `_versions/`,
`_transactions/`, `_deletions/`, `_indices/`, `_refs/`, and branch datasets
under `tree/`. Data files are immutable `.lance` objects; every committed table
version has a manifest; deletion vectors and index contents are separate
artifacts [S11].

**FACT (high):** an optional `latest_version_hint.json` speeds opening but is
non-authoritative and safe to delete. V1 manifests use increasing numeric names;
V2 names encode `u64::MAX - version`, making newest-first discovery possible by
lexicographic listing [S11][S12].

### 4.2 Manifest as snapshot root

**FACT (high):** a manifest describes a complete snapshot: full schema and
metadata, monotonically increasing table version, fragment list, writer and data
format identity, timestamp, feature flags, configuration, optional index
section, transaction reference/content, maximum fragment ID, stable-row-ID
counter, base paths, and branch identity. It is immutable after publication
[S4][S16].

**INFERENCE (high):** the manifest is the snapshot's reachability root, not the
data directory listing. Orphan objects may exist without affecting a snapshot;
conversely, every referenced object across all base paths must remain available
for the snapshot to be readable.

### 4.3 Fragments and two-dimensional storage

**FACT (high):** a fragment is a horizontal row partition with one or more data
files, optional deletion file, physical row count, and optional lineage/overlay
metadata. Files within a fragment can contain disjoint column subsets. Missing
field data reads as null. Replaced file-field mappings use a tombstone sentinel,
so a new column file can supersede old column data without rewriting unrelated
columns [S4][S16].

**FACT (high):** fragment IDs are monotonically allocated from manifest state;
physical row addresses pack fragment ID and local offset into 64 bits. The prose
spec calls the fragment identifier `uint32`, while the v10.0.0 table protobuf
stores `DataFragment.id` as `uint64`; row-address construction and the manifest's
maximum-fragment field remain 32-bit [S4][S9][S16].

**CONTRADICTION RETAINED (medium-high):** the durable protobuf width and prose
description do not agree. Existing address semantics imply deployers must not
assume usable fragment IDs beyond 32 bits. Curiosity does not need to resolve
the implementation detail now, but a format-compatibility test must cover
overflow and reject ambiguous metadata before adoption.

### 4.4 Time travel, restore, tags, and branches

**FACT (high):** every write creates a new version while unchanged files remain
shared. Restore creates a new current version from an older snapshot rather than
mutating history. Tags are auxiliary named references and do not create table
versions; tagged versions are exempt from cleanup. Each branch has its own
linear version history under `tree/{branch}`, implemented as a shallow-clone-like
dataset referencing its parent data [S13][S14].

**INFERENCE (high):** tags and branches expand the retention graph. They are
useful for reproducible evaluations but can defeat storage reclamation and
erasure unless inventory, ownership, and expiry are explicit.

## 5. Object-store semantics and portability

### 5.1 Multi-base reachability

**FACT (high):** a manifest can register multiple absolute base paths. Data,
deletion, and index metadata may select a base by ID; absent a base ID they are
relative to the root. This supports hot/cold tiers, multiple accounts/regions,
imports, and shallow clones. A simple single-root dataset can be relocated by
copying its directory; a multi-base dataset still depends on every referenced
location or requires manifest rebasing [S11].

**INFERENCE (high):** “portable open format” is conditional. A root copy is not
self-contained when manifests reference other buckets, credentials, regions, or
source datasets. A shallow clone also creates an external lifetime dependency:
source cleanup must not remove bytes required by the clone.

### 5.2 Backend capability, not URI compatibility

**FACT (high):** Lance documents local storage plus S3/S3-compatible, GCS,
Azure, AliCloud OSS, Volcengine TOS, Tencent COS, and GooseFS paths. It exposes
timeouts, retries, proxy and TLS options, per-base credentials, workload
identity/provider selection, and S3 server-side encryption/KMS options [S15].

**FACT (high):** safe commits require atomic rename-if-absent or
put-if-absent. “S3-compatible” alone is insufficient. Official docs warn that
Tencent COS buckets that ever enabled versioning do not reliably enforce
put-if-absent and require one shared custom commit lock. Mixed old/new GooseFS
writers are unsafe because an older unconditional writer can overwrite the
winner's manifest [S12][S15].

**RECOMMENDATION (high):** qualify the exact provider, bucket mode, gateway,
writer release, and conditional-create behavior. All writers must share one
commit protocol. Test packet loss, retries, stale listings, duplicate finalizers,
and interrupted copies; do not certify a backend from its URL scheme.

## 6. Schema and data evolution

### 6.1 Stable field identity

**FACT (high):** table schemas map closely to Arrow types but serialize logical
types and metadata in the manifest. Every top-level and nested field receives a
unique integer ID: depth-first at creation, then incrementally for added fields.
Field IDs remain stable across rename and reorder and can become sparse. Internal
references use IDs rather than names or positions [S8].

**FACT (high):** add-without-backfill and drop can be metadata-only; absent
column files read as null. Backfilled columns are attached as new files per
fragment. Rename preserves field ID. Type changes may rewrite only affected
column files and drop an incompatible index. Dropped bytes persist until
compaction rewrites files and old-version cleanup removes references [S4][S19].

**FACT (high):** Lance supports an **unenforced** primary key in field metadata.
Ordinary writes need not validate uniqueness; merge-insert or an external
authority must enforce logical identity [S4][S8].

**RECOMMENDATION (high):** preserve Curiosity-owned immutable IDs and explicit
schema versions in columns. Never infer uniqueness from Lance primary-key
metadata. Treat parser, chunker, embedding model, and ACL projection versions as
domain provenance, not merely field names.

### 6.2 Experimental overlays

**FACT (high):** data overlay files can supply changed cells by fragment offset
without rewriting base files. They are guarded by an unstable feature flag;
the table-format page still labels them experimental/not broadly supported,
while the v10.0.0 release announces exposed overlay operations and index masking
[S4][S7][S17].

**CONTRADICTION / VERSION TRANSITION (medium):** source/release behavior is
advancing faster than conservative spec maturity labels. The safe conclusion is
not that overlays are production-stable, but that their wire semantics are under
active change and must remain deferred.

## 7. Updates, deletes, compaction, and cleanup

### 7.1 Updates

**FACT (high):** transactional updates have two principal modes. `REWRITE_ROWS`
marks old rows deleted and writes replacements into new fragments; it suits few
rows or many modified columns. `REWRITE_COLUMNS` writes replacement column files
inside affected fragments and tombstones old field mappings; it suits many rows
and few columns. Merge-insert performs keyed update/insert behavior at a higher
API layer [S12][S16][S20].

**FACT (high):** default row IDs equal physical row addresses and therefore move
after row rewrites or compaction. Stable row IDs must be enabled at table
creation; they use a monotonically allocated table-local counter and survive row
moves/updates. Distributed custom writers must explicitly carry stable IDs for
rewritten rows or silently create new logical identities [S9][S20].

**RECOMMENDATION (high):** stable row IDs may be an engine optimization, never a
citation identity. Curiosity needs immutable `resource_id`, `capture_id`, and
`passage_id` plus hashes and offsets independent of storage layout.

### 7.2 Deletes are logical first

**FACT (high):** each fragment has at most one deletion file in a snapshot.
Sparse deletions use an Arrow IPC Int32 array; dense deletions use a Roaring
bitmap. Readers and indexes must exclude deleted offsets, but source bytes remain
in immutable data files and older snapshots [S4][S16][S21].

**INFERENCE (high):** a successful delete is live-view removal, not physical
erasure. Complete erasure spans current views, index filtering, compaction,
manifests, tags, branches/clones, every base path, backups, and object-store
versions.

### 7.3 Compaction and retention

**FACT (high):** compaction merges small fragments and can materialize deletion
vectors by rewriting only live rows. It creates a new table version and leaves
old files in place while retained versions reference them. Row addresses change,
which can invalidate index coverage [S10][S21].

**FACT (high):** cleanup removes expired manifests and files no retained version
references; the documented default retention is seven days and tags/branches
protect referenced data. Conservative cleanup deletes only verified obsolete
files. Aggressive deletion of aged unverified objects can corrupt a still-running
write if its age threshold is shorter than operation duration [S14][S21].

**RECOMMENDATION (high):** maintain separate watermarks for logical delete,
index exclusion, compacted-byte removal, snapshot expiry, backup expiry, and
verified physical erasure. Never combine aggressive orphan cleanup with
unbounded jobs.

## 8. Index boundary and correctness

### 8.1 Indexes are redundant and optional

**FACT (high):** the base file format contains no mandatory query-side search
structure. Scalar, vector, full-text, and system indexes are separate immutable
artifacts, loaded on demand and often themselves stored as Lance files. A table
remains readable without loading indexes [S3][S10].

**FACT (high):** one logical named index consists of one or more physical
segments. Each segment has a UUID, indexed field IDs, index type/version details,
build dataset version, and a Roaring fragment-coverage bitmap. Segment coverage
must be disjoint within a logical index but need not cover every fragment [S10]
[S16].

**FACT (high):** unsupported index types/versions must be skipped, with affected
fragments scanned. Correct plans merge indexed results with exact scans of the
uncovered tail. Deleted addresses are filtered. Updating an indexed column
removes affected fragment coverage; overlay values newer than an index build are
masked and re-evaluated on the exact path [S10].

**INFERENCE (high):** index freshness is explicitly a coverage state, not a
binary “index exists” property. Completeness can remain correct while latency
degrades as uncovered fragments grow.

### 8.2 Compaction and row-address repair

**FACT (high):** after compaction, implementations may (1) leave rewritten
fragments uncovered, (2) rewrite index addresses, or (3) publish a fragment
reuse index that remaps old to new addresses. Stable-ID-backed indexes avoid
address remapping but require ID-to-address lookup and remain experimental
[S9][S10].

**FACT (high):** distributed index APIs build uncommitted segments and publish
them through one manifest transaction. Lance owns artifact/segment mechanics;
the caller owns worker scheduling, retries, grouping/merging, and orphan cleanup
[S22].

**RECOMMENDATION (high):** Curiosity should expose index name/type/version,
covered fragments/rows, unindexed tail, exact-fallback use, and snapshot in each
retrieval trace. Reject any indexed-only mode as the undeclared default for
evidence-complete or deletion-sensitive retrieval.

## 9. Transactions and concurrency

### 9.1 MVCC and optimistic commit

**FACT (high):** each transaction records the version it read, a unique ID, and
an operation. A commit publishes a new immutable manifest via conditional object
creation. If another writer wins the same version, transaction records support
operation-specific conflict detection and rebase/retry/failure [S12][S16].

**FACT (high):** concurrent appends are intentionally broad-compatible. Deletes
and updates can merge non-overlapping deletion masks but retry when the same
rows/fragments conflict. Rewrites/compaction conflict with overlapping mutation
because physical addresses move. Index creation tolerates appends and deletions,
but may conflict with rewrites or replacement of the indexed column. Restore and
overwrite have deliberately strong conflict effects [S12].

**INFERENCE (high):** Lance serializes table history, but application invariants
remain the caller's responsibility. A retryable conflict requires re-evaluating
the operation against new data; blindly replaying stale row addresses or
predicates can change intent.

### 9.2 External manifest store

**FACT (high):** backends lacking safe conditional creation can use an external
manifest store. It reserves a version against an immutable staged manifest;
canonical manifest bytes are then copied to a deterministic object-store path.
The external store supplements rather than replaces canonical Lance bytes. A
reader unaware of it may lag by one commit during finalization [S12].

**RECOMMENDATION (high):** define an explicit latest-read freshness contract.
Research/evaluation runs should pin `(branch, version)`; interactive reads should
report the observed version and refresh policy. Multi-table atomicity must not be
assumed from per-table manifests.

### 9.3 Open distributed boundary

**FACT (high):** custom distributed writes are two-phase at the workflow level:
workers write independent fragments, then a coordinator collects metadata and
commits one Lance transaction. Lance does not provide the scheduler [S20].

**INFERENCE (high):** open Lance is a distributed-storage component, not a
complete distributed database. Curiosity would still own queues, worker fencing,
admission control, retries, job identity, observability, garbage collection,
tenant isolation, and disaster recovery.

## 10. Interoperability, security, and license

### 10.1 Interoperability

**FACT (high, project claim):** Arrow is the logical interchange model. Official
integration documentation lists built-in DataFusion and PyTorch paths plus
separate Spark, DuckDB, Trino, Ray, TensorFlow, Hugging Face, PostgreSQL, Flink,
catalog, and namespace projects. The namespace spec abstracts directory and REST
catalogs and integrations for Hive, Iceberg REST, Polaris, Gravitino, Unity,
Glue, BigLake, and others [S18][S23][S24].

**INFERENCE (medium-high):** an integration listing proves project intent and an
adapter surface, not complete semantic parity. Type coverage, predicate pushdown,
mutation support, branch/tag behavior, index support, and release compatibility
can differ by engine.

**RECOMMENDATION (high):** require a versioned capability matrix and an
independent round-trip corpus across at least two readers before claiming
portability. Preserve a provider-neutral Arrow/domain export independent of
Lance-specific indexes.

### 10.2 Security and trust boundary

**FACT (high):** the format does not define users, row-level authorization,
tenant isolation, encryption keys, or an authenticated query service. Security
therefore depends on application controls, catalog policy, object-store IAM,
transport, and KMS configuration. The object-store guide exposes plaintext HTTP
and invalid-certificate bypasses for testing, both defaulting off [S15][S23].

**FACT (high):** GitHub reported no repository `SECURITY.md` and no published
advisories on the accessed security page. The v10.0.0 release nevertheless
includes two “critical fixes” that bounds-check a decoder length prefix and
reject corrupt variable-width offsets before constructing Arrow arrays [S17]
[S25].

**INFERENCE (high):** Lance files, manifests, deletion vectors, and indexes are
untrusted binary input. The recent decoder fixes are positive hardening evidence
and simultaneous evidence that malformed metadata can reach memory-safety/
availability-sensitive paths. “No advisories” is not proof of safety.

**RECOMMENDATION (high):** isolate parsing, pin patched releases, enforce object
and decoded-size budgets, fuzz malformed fixtures, deny network/plaintext bypass
in production, use least-privilege identities and KMS, and never treat retrieved
text or metadata as agent instructions. Authorization must be injected and
rechecked outside storage-index hints.

### 10.3 License and provenance

**FACT (high):** the official Lance repository is Apache License 2.0. The license
also retains MIT notices for adapted Polars and Quickwit bitpacking material.
Apache-2.0 redistribution conditions include supplying the license, marking
modified files, retaining applicable notices, and respecting the patent-license
termination clause; it grants no general trademark permission [S1][S26].

**RECOMMENDATION (high):** architectural learning may be independently
re-expressed. If Curiosity later embeds, modifies, or redistributes Lance, record
the exact artifact/version in `provenance/`, retain license/notices, inventory
transitive and integration-specific licenses, and obtain legal review. Do not
copy source, tests, protobufs, docs prose, trademarks, or benchmark claims into
Curiosity-owned implementation.

## 11. Curiosity storage implications

### 11.1 Adopted patterns

1. **ADOPT — immutable snapshot roots (high).** Pin every retrieval/evaluation
   to a complete corpus manifest and preserve its ingest watermark.
2. **ADOPT — two-dimensional evolution (high).** Raw evidence and independently
   replaceable extraction, passage, embedding, ACL, and rank columns should not
   require whole-row rewrites.
3. **ADOPT — explicit index coverage (high).** Correctness combines index results
   with bounded exact evaluation of uncovered/invalidated data.
4. **ADOPT — immutable publication (high).** Write new artifacts, publish one
   conditional manifest, then reclaim unreachable objects after a grace period.
5. **ADOPT — separate compaction and erasure (high).** Layout improvement,
   version expiry, and physical deletion are different observable events.

### 11.2 Adapted patterns

1. **ADAPT — Lance version into domain provenance (high).** Add immutable capture,
   parser, chunker, embedding, policy, and rank versions; a table snapshot alone
   does not identify source bytes.
2. **ADAPT — row identity (high).** Use Curiosity IDs as durable truth; stable
   Lance row IDs remain internal accelerators.
3. **ADAPT — multi-base portability (high).** Export a closed reachability
   manifest covering roots, clones, branches, tags, deletion vectors, and index
   artifacts, then restore without original credentials.
4. **ADAPT — branches/tags (medium-high).** Allow bounded evaluation snapshots
   with owner, purpose, quota, expiry, and deletion-hold review.
5. **ADAPT — optimistic retries (high).** Re-evaluate domain intent from stable
   IDs after conflicts; never retry stale physical addresses blindly.

### 11.3 Rejected patterns

1. **REJECT — Lance as Curiosity's public/domain contract (high).** Keep file,
   fragment, row, index, and catalog details behind provider-neutral adapters.
2. **REJECT — `_rowid` as evidence identity (high).** Default IDs move; stable
   IDs are table-local and index integration is evolving.
3. **REJECT — soft delete as erasure (high).** Bytes survive in data files,
   snapshots, references, clones, backups, and provider object versions.
4. **REJECT — index existence as completeness (high).** Coverage and exact-tail
   behavior must be explicit.
5. **REJECT — storage/index filtering as sole authorization (high).** ACL checks
   must fail closed and be rechecked before output.

### 11.4 Deferred choices

1. **DEFER — Lance as canonical Curiosity storage (high).** Requires the checks
   below and a concise ADR before a consequential dependency choice.
2. **DEFER — unstable 2.3 encodings, overlays, MemWAL, and stable-ID indexes
   (high).** Active development and feature flags make them unsuitable as current
   storage assumptions.
3. **DEFER — cross-engine interoperability claim (medium-high).** Adapter listings
   need tested semantic round trips.
4. **DEFER — branches/shallow clones in production retention (medium).** Their
   cross-root lifetime and erasure behavior must be proven first.

### 11.5 Suggested evidence model

| Curiosity concept | Storage requirement |
|---|---|
| immutable fetch | `capture_id`, canonical resource ID, content hash, fetch time, rights/policy |
| normalized/chunked output | derivation version, parent capture ID, byte/character offsets, output hash |
| embedding | model/version, dimension, metric, source passage hash |
| lexical representation | analyzer/tokenizer/version and source text hash |
| ACL/policy | versioned projection, mandatory prefilter, independent release-time recheck |
| retrieval | pinned corpus version, index segments/coverage, exact-tail and partial-failure trace |
| deletion | logical deny, index exclusion, compaction, snapshot/reference/backup expiry receipts |

## 12. Validation checks required before adoption

No checks below were executed.

1. **Byte compatibility:** write every pinned stable format, read with current and
   future clients, and reject unsupported flags/unstable aliases.
2. **Cross-engine round trip:** nested nulls/lists/maps, UTF-8 edge cases,
   decimals/timestamps, vectors, blobs, renames, drops, and type changes across
   Python/Rust plus a second engine.
3. **Snapshot replay:** append, update, delete, index, compact, restore, tag, and
   branch; reproduce every retained citation hash.
4. **Commit fault matrix:** crash before/after data upload, transaction write,
   conditional manifest creation, external-store reservation/copy, hint update,
   and cleanup.
5. **Concurrent operations:** append/append, delete/delete, update/compaction,
   schema/append, index/rewrite, and restore/write on the exact object backend.
6. **Index completeness:** compare indexed plus exact-tail results before/after
   every mutation; validate deletion/overlay masking and unsupported-index
   fallback.
7. **Identity:** prove Curiosity IDs survive rewrites; show physical `_rowid`
   changes and stable-ID behavior cannot leak into citations.
8. **Erasure:** inventory and remove live rows, index entries, compacted source
   bytes, manifests, tags, branches, shallow clones, every base path, backups,
   and object versions.
9. **Portability:** restore a closed export in an account with no original
   credentials; rebuild optional indexes and compare snapshots/results.
10. **Malformed input/security:** fuzz footer offsets, protobuf lengths, page
    descriptors, decompression ratios, nested depth, deletion/index bitmaps, and
    truncated range responses under strict resource bounds.
11. **Operations/cost:** continuous ingest, small-fragment debt, deletion density,
    cold/warm caches, index lag, compaction headroom, orphan age, throttling, and
    object request/egress cost.

**Pass condition:** Lance must outperform a simpler owned baseline at matched
correctness while preserving snapshot replay, domain identity, ACL safety,
erasure SLOs, independent export, bounded parsing, and acceptable lifecycle cost.

## 13. Unknowns and negative results retained

- **UNKNOWN:** Curiosity-specific latency, recall, range-request cost, and
  compaction amplification; no benchmark was authorized.
- **UNKNOWN:** exact production maturity/performance of 2.2 versus the unstable
  2.3 path across all SDKs and integrations.
- **UNKNOWN:** usable fragment-ID limit given the `uint32` prose/address contract
  and `uint64` protobuf field.
- **UNKNOWN:** formal multi-base/shallow-clone garbage-collection safety across
  independently operated source and clone roots.
- **UNKNOWN:** complete interoperability matrix for schemas, mutations,
  references, and indexes across DataFusion, Spark, DuckDB, Trino, Ray, and Java.
- **UNKNOWN:** a formal security response policy; none was present at the
  repository security location on the access date.
- **NEGATIVE RESULT:** no peer-reviewed or formal Lance format paper was found in
  the bounded official-source review; format claims are grounded in spec/source,
  not a paper or independent proof.
- **NEGATIVE RESULT:** no native Curiosity resource/capture/passage provenance,
  source-rights, robots, crawl, canonicalization, or citation contract was found.
- **NEGATIVE RESULT:** no file/table-level user authentication, row ACL engine,
  audit policy, key management, or tenant isolation is defined by the format.
- **NEGATIVE RESULT:** no guarantee that ordinary unenforced-primary-key writes
  prevent duplicates was found; the specification explicitly says otherwise.
- **NEGATIVE RESULT:** no evidence that logical deletion immediately erases
  bytes; official docs explicitly retain them until rewrite and cleanup.
- **NEGATIVE RESULT:** no built-in distributed scheduler or complete operating
  plane was found; official distributed guides assign orchestration to callers.
- **NEGATIVE RESULT:** no runtime, malformed-file, object-store, recovery, or
  concurrency test was performed.

## 14. Bounded curiosity pass

After synthesis, in-frame gaps were scored 1–5 for relevance (R), decision value
(V), novelty (N), and cost (C); priority = `R + V + N - C`. Caller authority
covered public-source follow-up only.

| Thread | R/V/N/C | Priority | Outcome |
|---|---|---:|---|
| Exact commit primitive and backend exceptions | 5/5/4/2 | 12 | **Pursued.** Conditional-create requirements plus COS/GooseFS exceptions bound “object-store native” [S12][S15]. |
| Mutation/index correctness | 5/5/5/2 | 13 | **Pursued.** Coverage bitmaps, deletion filtering, invalidation, exact fallback, and remapping were traced through spec and pinned metadata [S10][S16]. |
| Fragment-ID width contradiction | 4/4/5/2 | 11 | **Pursued.** Contradiction retained rather than guessed away [S4][S9][S16]. |
| Overlay maturity drift | 4/4/4/2 | 10 | **Pursued.** Feature flag, conservative spec label, and v10 release show active transition; deferred [S4][S7][S17]. |
| Decoder/security posture | 5/5/4/2 | 12 | **Pursued.** v10 critical decoder fixes and absent security policy establish a concrete validation need [S17][S25]. |
| Formal Lance paper | 3/3/3/3 | 6 | **CURIOSITY_NO_GO.** Bounded official and title searches yielded no format paper; additional broad search was rate-limited and would not change the primary-source architecture verdict. |
| Empirical malformed-file campaign | 5/5/4/5 | 9 | **CURIOSITY_NO_GO.** Research-only authority; execution requires a separately reviewed security test plan. |
| Reconstruct every encoding/protobuf | 2/2/3/5 | 2 | **CURIOSITY_NO_GO.** Low decision value and contrary to the clean-room architectural boundary. |
| MemWAL/overlay implementation internals | 2/3/4/5 | 4 | **CURIOSITY_NO_GO.** Unstable and not required for the storage decision. |
| Independent integration matrix | 5/4/3/5 | 7 | **CURIOSITY_NO_GO.** Requires installing multiple engines and running fixtures; retained as validation work. |

**Stop condition:** coverage and saturation. Every requested architecture category
has primary-source support; highest-value contradictions were resolved or
retained. Remaining material questions require empirical tests or implementation
authority. No live autonomous follow-up was initiated.

## 15. Primary-source ledger

All sources were accessed **2026-08-17**.

- **[S1]** Lance repository, [README / project scope and storage-version
  contract](https://github.com/lance-format/lance).
- **[S2]** Lance, [Format specification overview](https://lance.org/format/).
- **[S3]** Lance specification, [File format](https://lance.org/format/file/).
- **[S4]** Lance specification, [Table format](https://lance.org/format/table/).
- **[S5]** Lance specification, [Encoding strategy](https://lance.org/format/file/encoding/).
- **[S6]** Lance specification, [File versioning](https://lance.org/format/file/versioning/).
- **[S7]** Lance specification, [Table feature flags](https://lance.org/format/table/versioning/).
- **[S8]** Lance specification, [Schema format](https://lance.org/format/table/schema/).
- **[S9]** Lance specification, [Row ID and lineage](https://lance.org/format/table/row_id_lineage/).
- **[S10]** Lance specification, [Indices in Lance](https://lance.org/format/index/).
- **[S11]** Lance specification, [Storage layout](https://lance.org/format/table/layout/).
- **[S12]** Lance specification, [Transactions](https://lance.org/format/table/transaction/).
- **[S13]** Lance specification, [Branch and tag](https://lance.org/format/table/branch_tag/).
- **[S14]** Lance guide, [Tags and branches](https://lance.org/guide/tags_and_branches/).
- **[S15]** Lance guide, [Object-store configuration](https://lance.org/guide/object_store/).
- **[S16]** Lance v10.0.0 source definition, [`table.proto`](https://raw.githubusercontent.com/lance-format/lance/v10.0.0/protos/table.proto) and
  [`transaction.proto`](https://raw.githubusercontent.com/lance-format/lance/v10.0.0/protos/transaction.proto).
- **[S17]** GitHub release API, [Lance v10.0.0 release record](https://api.github.com/repos/lance-format/lance/releases/latest).
- **[S18]** Lance, [Integrations](https://lance.org/integrations/).
- **[S19]** Lance guide, [Data evolution](https://lance.org/guide/data_evolution/).
- **[S20]** Lance guide, [Distributed write](https://lance.org/guide/distributed_write/).
- **[S21]** Lance guide, [Read, write, maintenance, and cleanup](https://lance.org/guide/read_and_write/).
- **[S22]** Lance guide, [Distributed indexing](https://lance.org/guide/distributed_indexing/).
- **[S23]** Lance specification, [Catalog specs](https://lance.org/format/catalog/).
- **[S24]** Lance specification, [Namespace client](https://lance.org/format/namespace/).
- **[S25]** GitHub, [Lance repository security page](https://github.com/lance-format/lance/security).
- **[S26]** Lance repository, [Apache-2.0 license and retained third-party
  notices](https://raw.githubusercontent.com/lance-format/lance/main/LICENSE).

## 16. Confidence and final disposition

**High confidence:** file/page/container shape; manifest, fragment, schema,
deletion, index-coverage, transaction, object-store, and cleanup semantics;
Apache-2.0 identity.  
**Medium confidence:** performance implications, cross-engine parity, shallow-
clone lifecycle safety, stable-ID index trade-offs, and transition-state features.  
**Unknown without tests:** Curiosity performance/relevance, malformed-input
resilience, provider failure behavior, operational cost, and erasure completion.

**Final disposition:** **ADOPT** immutable manifests, two-dimensional column
evolution, partial index coverage, and separate compaction/cleanup as patterns;
**ADAPT** identity, branches, portability, and optimistic transactions into
Curiosity-owned contracts; **REJECT** physical row IDs, soft delete, or index
presence as domain guarantees; **DEFER** Lance dependency selection and unstable
features until the validation gates pass.
