# Curiosity-owned lexical builder and publication specification v1

**Status:** normative implementation contract under ADR 0055 for exactly the
removable, private, project-authored qualification tranche. Implementation is
GO; dependencies, integration, serving, release, live/production inputs, and
production authority remain excluded.

## 1. Conformance, authority, and non-goals

A conforming implementation deterministically builds exactly the unchanged `COLR/1`
inventory specified by [reader v1](owned-lexical-reader-format-v1.md), validates
it with that reader, and publishes one immutable generation through the atomic
selector protocol below. Requirements are `MUST` unless explicitly marked
otherwise. Missing, extra, malformed, stale, changing, or unauthorised state
fails closed.

Only private typed `BuildAuthorityV1`, `BuildPassageV1`, and
`TombstoneInventoryV1` semantic values authored and reviewed in this repository
are admissible. Their canonical JSON records are persistence encodings, not
public or untyped input surfaces. There is no wire parser, public ABI, TypeScript
wrapper, package export, database adapter, or network input. In particular,
current owned-web acquisition SQLite rows,
materialized views, events, receipts, proof simulations, CAS/WARC presence, and
extracted passages are neither authoritative nor sufficient and cannot mint or
substitute for either input type. No acquisition or canonical Ledger authority
is delegated by this specification.

The closed non-goals are: dependencies; live/production input; acquisition or
Ledger integration; `OwnedSnapshotPort` or retrieval serving; network access;
mmap, compression, positions, phrase/proximity, merges, or sharding; SearXNG
change; automatic activation, rollback, or fallback; and production, deployment,
release, arbitrary-filesystem, or power-loss authority.

## 2. Fixed identifiers and typed inputs

The exact builder bindings are:

| Binding               | Exact value                              |
| --------------------- | ---------------------------------------- |
| source schema         | `owned-lexical-source-v1`                |
| authority schema      | `owned-lexical-build-authority-v1`       |
| output schema version | `1`                                      |
| output format/version | `curiosity-owned-lexical-reader` / `1.0` |
| analyzer              | `curiosity_scalar_v1`                    |
| ranking policy        | `bm25-colr-v1`                           |
| builder               | `curiosity_owned_lexical_builder_v1`     |
| digest                | SHA-256 per NIST FIPS 180-4              |

`Identifier` is 1–128 UTF-8 bytes matching `[A-Za-z0-9._:-]+`. `Digest32` is
exactly 32 bytes and is rendered as lowercase hex-64 only in canonical JSON.

`BuildAuthorityV1` is exactly this private typed value:

```text
{
  version:1,
  inputClass:ProjectAuthoredQualification,
  authorityId:Identifier,
  authorizationDecisionId:Identifier,
  authorizationScopeDigest:Digest32,
  cellId:Identifier,
  passageInventoryDigest:Digest32,
  tombstoneInventoryDigest:Digest32,
  tombstoneWatermark:u64,
  schema:OwnedLexicalBuildAuthorityV1,
  schemaVersion:1,
  formatMajor:1,
  formatMinor:0,
  analyzerId:CuriosityScalarV1,
  rankingPolicyId:Bm25ColrV1,
  builderId:CuriosityOwnedLexicalBuilderV1,
  limits:BuildLimitsV1
}
```

`BuildPassageV1` has exactly the fields and value semantics of the
`passages.colr` payload in reader v1 section 3.2 except `ordinal`,
`titleTokenCount`, and `textTokenCount`, which are not inputs and MUST be derived.
The input sequence has no ordering meaning. All strings, IDs, times, digests,
and field bounds use reader v1 section 3.1. `cellId` MUST equal authority
`cellId`. Duplicate `passageId` is invalid.

`TombstoneInventoryV1` is exactly:

```text
{
  format:OwnedLexicalTombstoneInventoryV1,
  version:1,
  watermark:u64,
  entries:[{
    passageId:Identifier,
    authorityScopeDigest:Digest32,
    effectiveSequence:u64,
    reasonDigest:Digest32
  }]
}
```

Entries are unique and strictly increasing by `passageId` UTF-8 bytes.
`effectiveSequence` is nonzero and no greater than `watermark`; `reasonDigest`
binds the project-authored reason record without placing reason text in the
projection. The inventory may include IDs absent from this build because it may
cover a broader authority inventory. Inventories are cumulative: at a greater
watermark every entry from the prior active inventory MUST remain byte-identical,
and only new passage IDs may be added. Entries are never removed, resequenced,
rescoped, or assigned a different reason.

`BuildLimitsV1` is exactly:

```text
{maxPassages:u32,maxTerms:u32,maxPostings:u64,maxArtifactBytes:u64,
 maxTotalArtifactBytes:u64,maxSourceBytes:u64,maxTokenEmissions:u64,
 maxRetainedLogicalBytes:u64}
```

Every limit MUST be positive and no greater than the reader-v1 default for the
corresponding quantity; `maxSourceBytes` and `maxTokenEmissions` are additionally
capped at 32 MiB and 2,000,000. `maxRetainedLogicalBytes` is capped at 16 MiB.
The implementation may lower but never raise these ceilings. Counts, additions,
multiplications, offsets, lengths, allocation charges, and integer conversions
use checked arithmetic. A limit is charged before the operation it guards.

The fixed managed-root limits are not caller-configurable:

```text
RootLimitsV1 {
  maxGenerations:64,
  maxBuildAuthorityRecords:64,
  maxSourceManifestRecords:64,
  maxTombstoneInventoryRecords:64,
  maxReceipts:64,
  maxStagingAttempts:8,
  maxManagedEntries:768,
  maxAggregateRetainedBytes:2415919104,
  maxValidationEntriesPerInvocation:768,
  maxValidationBytesPerInvocation:2415919104
}
```

Directory entries, file lengths, aggregate retained bytes, and validation work
are counted with checked arithmetic from retained descriptors before mutation.
Crossing a cap fails before creating, deleting, renaming, or rewriting anything.
These limits do not authorize v1 garbage collection.

## 3. Canonical input records and cycle-free digests

Canonical JSON in this specification uses the reader-v1 canonical JSON rules:
UTF-8, no BOM or insignificant whitespace, exact key order shown, no duplicate
or unknown keys, shortest escapes, lowercase `\u` hex, decimal integers, and
lowercase 64-hex SHA-256 strings. Arrays preserve the explicitly specified
order. The combined byte length of `PassageInventoryV1`, canonical
`BuildAuthorityV1`, canonical `SourceManifestV1`, and canonical
`TombstoneInventoryV1` MUST NOT exceed `maxSourceBytes`.

Encode canonical `TombstoneInventoryV1` with this exact key order:

```text
{"entries":[{"authorityScopeDigest":hex64,"effectiveSequence":u64,
"passageId":string,"reasonDigest":hex64},...],
"format":"owned-lexical-tombstone-inventory-v1","version":1,
"watermark":u64}
```

`tombstoneInventoryDigest = SHA256(canonical TombstoneInventoryV1 bytes)`. The
digest and watermark in `BuildAuthorityV1` MUST equal that record. Before passage
sorting or analysis, match tombstones by exact `passageId`. A matched passage
MUST have equal `authorityScopeDigest` and `tombstoneSequence` equal to the
tombstone's `effectiveSequence`, then MUST be excluded from the build. An
unmatched passage MUST have `tombstoneSequence=0`. Scope mismatch, unequal or
out-of-range sequence, duplicate ID, unsorted inventory, digest/watermark
mismatch, or any surviving tombstoned passage is `BUILD_INPUT_INVALID`.

After tombstone exclusion, sort passages by `passageId` UTF-8 bytes. Encode each passage as an object
whose keys occur in this exact order:

```text
{"admissionId":string,"authorityScopeDigest":hex64,"captureId":string,
"cellId":string,"language":string,"locatorDisplay":string,"mediaType":string,
"observedAt":i64,"passageId":string,"publishedAt":i64-or-null,
"representationId":string,"revisionId":string,"revisionPolicyDigest":hex64,
"revisionScopeDigest":hex64,"sourceClass":string,"sourceObjectId":string,
"text":string,"title":string,"tombstoneSequence":u64}
```

`PassageInventoryV1` is the exact concatenation of `u64le(byteLength)` and the
canonical object bytes for each sorted passage, with no prefix, suffix, or
separator. `passageInventoryDigest = SHA256(PassageInventoryV1)`. The digest in
`BuildAuthorityV1` MUST equal that value. `tombstoneInventoryDigest` is a
derived project-authored authority binding; this tranche does not acquire it.
`passageCount` and the passage inventory always describe survivors only.

Encode `BuildAuthorityV1` with this exact key order and enum spellings:

```text
{"analyzerId":"curiosity_scalar_v1","authorityId":string,
"authorizationDecisionId":string,"authorizationScopeDigest":hex64,
"builderId":"curiosity_owned_lexical_builder_v1","cellId":string,
"formatMajor":1,"formatMinor":0,"inputClass":"project-authored-qualification",
"limits":{"maxArtifactBytes":u64,"maxPassages":u32,"maxPostings":u64,
"maxRetainedLogicalBytes":u64,"maxSourceBytes":u64,"maxTerms":u32,
"maxTokenEmissions":u64,"maxTotalArtifactBytes":u64},
"passageInventoryDigest":hex64,"rankingPolicyId":"bm25-colr-v1",
"schema":"owned-lexical-build-authority-v1","schemaVersion":1,
"tombstoneInventoryDigest":hex64,
"tombstoneWatermark":u64,"version":1}
```

`buildAuthorityDigest = SHA256(canonical BuildAuthorityV1 bytes)`.
`SourceManifestV1` is then exactly:

```text
{"analyzerId":"curiosity_scalar_v1","buildAuthorityDigest":hex64,
"builderId":"curiosity_owned_lexical_builder_v1","cellId":string,
"format":"curiosity-owned-lexical-reader","formatVersion":1,
"passageCount":u32,"passageInventoryDigest":hex64,
"rankingPolicyId":"bm25-colr-v1","schema":"owned-lexical-source-v1",
"schemaVersion":1,"tombstoneInventoryDigest":hex64,
"tombstoneWatermark":u64}
```

`sourceManifestDigest = SHA256(canonical SourceManifestV1 bytes)`. This closes
the digest cycle: `SourceManifestV1` contains no `sourceManifestDigest`, output
manifest, `generationId`, generation address, artifact digest, receipt, path,
time, attempt, or selector state. The output manifest binds
`sourceManifestDigest`; only after its complete canonical bytes exist is
`manifestDigest = SHA256(manifest.json)` computed.

The deterministic logical `generationId` in `manifest.json` is
`colr1-` followed by the 64 lowercase hex characters of
`sourceManifestDigest`. It is not the physical generation address. The physical
address is `manifestDigest`, avoiding a manifest-self-hash cycle.

Canonical `BuildAuthorityV1`, `SourceManifestV1`, and `TombstoneInventoryV1`
bytes are immutable persisted authority records. Their addresses are respectively
`buildAuthorityDigest`, `sourceManifestDigest`, and
`tombstoneInventoryDigest`. No record contains its own digest, output artifact
digest, receipt digest, selector, generation address, or mutable lifecycle state.

## 4. Deterministic construction

Construction performs these steps in order:

1. Validate the complete typed authority, tombstone inventory, and passage input,
   fixed bindings, project-authored qualification class, limits, authority
   digests, cell, watermark, uniqueness, and field bounds without emitting output.
2. Exclude exact tombstone matches under section 3, sort only survivors by
   `passageId` UTF-8 bytes, and assign dense ordinals `0..N-1`.
3. Run exactly reader v1 `curiosity_scalar_v1` over title and text. Derive token
   counts. Any other normalization, locale, stemmer, stopword, tokenizer, or
   Unicode operation is forbidden.
4. For each emitted token, checked-increment the frequency keyed by
   `(fieldTag,termBytes,ordinal)`. Sort terms by `(fieldTag,termBytes)` and each
   posting list by ordinal. Compute document and total term frequencies from
   those maps. No input iteration, map/hash seed, thread schedule, host locale,
   clock, path, or process value may affect output.
5. Encode `passages.colr`, `terms.colr`, and `postings.colr` exactly as reader v1
   sections 3.2–3.4. Posting deltas, offsets, lengths, counts, and headers are
   derived with checked arithmetic. No padding or extra entry is emitted.
6. Digest complete artifacts and encode canonical `manifest.json` with exactly
   reader v1 section 2, the logical generation ID above, and authority cell and
   watermark. Compute its manifest digest.
7. Open the staged four-name map with the independently authorized reader using
   the implementation's fixed default limits. Full validation MUST succeed. Validation
   uses the completed on-disk bytes, not retained encoder values.

Zero passages deterministically produces header-only artifacts and an empty term
inventory. Every output and retained logical allocation is bounded. Parallel
construction is forbidden in v1. Equal typed inputs and limits MUST produce
byte-identical tombstone/source/authority records, all four generation files,
manifest digest, and receipt on every conforming supported host.

The hand-authored `golden-three-v1` reader fixture is an independent oracle. A
builder test MAY prove semantic agreement by building separately supplied typed
values, but MUST NOT overwrite, regenerate, copy into, normalize, or update that
fixture or its reviewed recipe. Builder output cannot bless reader conformance.

## 5. Deterministic receipt

The receipt is separate from and outside the reader's closed generation map. It
is canonical JSON at most 8,192 bytes with exactly:

```text
{"artifactDigests":{"manifest.json":{"length":u64,"sha256":hex64},
"passages.colr":{"length":u64,"sha256":hex64},
"postings.colr":{"length":u64,"sha256":hex64},
"terms.colr":{"length":u64,"sha256":hex64}},
"buildAuthorityDigest":hex64,"builderId":"curiosity_owned_lexical_builder_v1",
"format":"curiosity-owned-lexical-build-receipt","manifestDigest":hex64,
"sourceManifestDigest":hex64,"tombstoneInventoryDigest":hex64,"version":1}
```

The `manifest.json` SHA-256 equals `manifestDigest`. The receipt contains no
operator name, path, timestamp, PID, host, attempt ID, mutable state, or claim of
authorization. It binds the three persisted authority-record addresses but is
deterministic process evidence, not generation content, reader input, activation
authority, or eligibility evidence. Unequal bytes for an existing receipt
address are corruption.

## 6. Root and immutable layout

The trusted operator supplies an absolute, pre-existing directory outside the
source tree, owned by the invoking UID with mode `0700`. Before any publisher
invocation, the operator MUST also preinitialize the exact publication subtree,
lock file, and child directories below with the stated ownership and modes. The
publisher never creates, repairs, removes, or permission-adjusts bootstrap state.
Every bootstrap entry is owned by the invoking UID and is on the retained root's
filesystem; `publication.lock` is exactly zero bytes and is never data-bearing.
The namespace MUST remain stable and operator-controlled for each invocation.
Traversal, symlink component, wrong owner/type/mode/device, or identity change
fails closed. ADR 0053's stable operator-root threat model and limitations apply:
retained descriptors, handle-relative operations, `O_NOFOLLOW`, exclusive
creation, and identity checks are defense in depth, not protection from a
same-UID or privileged namespace adversary.

The exact closed layout is:

```text
.owned-lexical-publication-v1/
  publication.lock                 regular file, mode 0600
  ACTIVE.json                      absent initially; regular file, mode 0600
  authorities/                     directory, mode 0700
    build/                         directory, mode 0700
      <buildAuthorityDigest>.json  regular file, mode 0600
    source/                        directory, mode 0700
      <sourceManifestDigest>.json  regular file, mode 0600
    tombstones/                    directory, mode 0700
      <tombstoneInventoryDigest>.json regular file, mode 0600
  generations/                     directory, mode 0700
    <manifestDigest>/              directory, mode 0700
      manifest.json                regular file, mode 0600
      passages.colr                regular file, mode 0600
      postings.colr                regular file, mode 0600
      terms.colr                   regular file, mode 0600
  receipts/                        directory, mode 0700
    <manifestDigest>.json          regular file, mode 0600
  staging/                         directory, mode 0700
    <attemptId>/                   closed temporary tree, mode 0700
```

`manifestDigest` is exactly lowercase hex-64. `attemptId` is 1–64 characters
matching `[A-Za-z0-9._-]+`, supplied only for collision-free temporary naming,
and has no semantic or deterministic-output role. A staging tree may contain
only `generation/` with the four generation files, `build-authority.json`,
`source-manifest.json`, `tombstone-inventory.json`, `receipt.json`, one
identity-bound canonical `STATE.json`, and one `ACTIVE.next` during selection.
`STATE.json` is staging-only recovery metadata; it records the attempt ID and
the retained attempt-directory device/inode, is limited to 256 bytes, and is
never published. No symlink, hard link, special file, extra root,
directory, authority record, generation, receipt, or staging entry is accepted.
Files are opened relative to retained directory handles with no-follow behavior;
regular-file type, link count one, owner, mode, device, inode, and unchanged
length are checked before and after use. Generations, authority records, and
receipts are immutable after publication.

On empty first use, `ACTIVE.json` is absent and `authorities/build`,
`authorities/source`, `authorities/tombstones`, `generations`, `receipts`, and
`staging` are empty; only the preinitialized lock and directories exist. A
partial bootstrap, missing child, wrong mode/owner, or unknown entry is
`ROOT_INVALID` or `INVENTORY_INVALID` and is never repaired. Before acquiring
the lock, the invocation validates enough bootstrap identity to open the exact
lock without traversal; after locking it revalidates the complete bootstrap and
closed inventory from retained handles.

The advisory exclusive lock on `publication.lock` MUST be acquired before root
inventory/recovery and held through the final result, including post-commit
failure classification. It
serializes conforming publishers only. Lock failure or contention fails; there
is no wait, lock stealing, stale-lock deletion, or claim that it excludes a
nonconforming actor.

Every invocation counts the complete managed tree before mutation. Immediate
publication-root inventory is exactly the lock, `authorities`, `generations`,
`receipts`, `staging`, and optional `ACTIVE.json`; `authorities` has exactly its
three named children. Counts and aggregate regular-file lengths MUST fit
`RootLimitsV1`. Validation opens or digests no more than its per-invocation entry
and byte caps. Limit excess is `ROOT_RESOURCE_LIMIT`; an unknown or structurally
invalid entry is `INVENTORY_INVALID`. Neither condition triggers cleanup or GC.

## 7. Build staging and immutable publication

After locking and validating/recovering the closed inventory, a build uses this
exact order:

1. Perform a mutation-free deterministic sizing/digest pass. Include the
   prospective staging entries, three authority records, generation, receipt,
   and retained bytes in all root/work caps; reject any excess before creation.
2. Exclusively create `staging/<attemptId>/generation`, its output files, and the
   three staged canonical authority-record files.
3. Write each complete artifact, then `manifest.json`, and write the exact
   canonical tombstone, build-authority, and source-manifest records with checked
   full writes.
4. Synchronize each regular file after its final write. On Darwin qualification,
   successful `F_FULLFSYNC` is additionally required for every file; unsupported
   or failed full sync fails closed.
5. Synchronize `generation/` and the attempt directory, then validate completed
   generation bytes through reader
   v1 and verify the manifest digest/address.
6. Write, synchronize, and on Darwin full-sync `receipt.json`; synchronize the
   attempt directory.
7. Publish each authority record without replacement to its digest address in
   tombstone, build, then source order, synchronizing the source attempt directory
   and destination directory after each rename. An existing record is valid only
   when its canonical bytes hash to its name and are byte-equal.
8. If `generations/<manifestDigest>` is absent, atomically rename the staged
   generation directory to that exact name without replacement, then synchronize
   the source attempt directory and `generations/`. If already present, validate
   its closed inventory, reader bytes, address, and byte equality; preserve it
   and remove only the invocation's identity-recorded staged generation.
9. Publish the receipt analogously without replacement to
   `receipts/<manifestDigest>.json`, then synchronize the source attempt
   directory and `receipts/`. An equal existing receipt is idempotent; any
   inequality is corruption.
10. Remove the now-empty identity-recorded attempt directory and synchronize
    `staging/`. At this point the generation is retained but inactive.

No selector write occurs automatically. Build success returns the manifest
digest and deterministic receipt only. It confers no activation or serving
authority. A failure preserves every pre-existing generation and active selector
and removes only temporary entries exclusively created and identity-recorded by
this invocation when the stable namespace still permits safe removal.

## 8. Canonical `ACTIVE.json` and compare-and-swap

`ACTIVE.json` is absent or canonical JSON at most 1,024 bytes with exactly:

```text
{"authorizationDecisionId":string,"authorizationScopeDigest":hex64,
"buildAuthorityDigest":hex64,"format":"curiosity-owned-lexical-active",
"manifestDigest":hex64,
"previousManifestDigest":hex64-or-null,"tombstoneInventoryDigest":hex64,
"tombstoneWatermark":u64,"sourceManifestDigest":hex64,"version":1}
```

IDs and digests use section 2 bounds. It is a regular file, never a symlink. Its
manifest digest addresses an existing, fully validated generation and equal
receipt. Its three authority-record digests MUST equal that receipt and address
canonical persisted records whose cross-bindings recompute exactly. Its
authorization and tombstone values MUST exactly equal the selected generation's
persisted `BuildAuthorityV1` and `TombstoneInventoryV1`. The selector does not
make those records authoritative.

`ValidateGenerationAuthorityV1(manifestDigest)` is exact: validate the addressed
four-file generation and recompute its manifest digest; load the same-address
receipt and verify every artifact length/digest; load each receipt-addressed
authority record, require its canonical byte digest to equal its filename, and
require source → build-authority → tombstone digest bindings; require source
cell, passage count, survivor passage-inventory digest, schema/format/analyzer/
ranking/builder, and watermark to equal the decoded generation and manifest; and
require build-authority cell, passage digest, tombstone digest/watermark, and
fixed bindings to equal source and tombstone records. Reconstruct the canonical
survivor passage inventory from decoded passage records after removing derived
ordinal/token-count fields and verify its digest. Any selector being validated
MUST then equal that chain's receipt and authorization/tombstone fields. Current,
previous, and candidate validation all invoke this same procedure; only the
current project-authored authority digest is an operation input.

An explicit `ActivateV1` operation takes typed `expectedCurrent` (absent or one
manifest digest), `candidateManifestDigest`, the digest of the exact current
project-authored `BuildAuthorityV1`, and `mode` equal to `Forward` or `Rollback`.
The caller supplies no historical authority contents. Under the lock it:

1. validates root inventory, recovery state, and prospective entry/byte/work caps
   without mutation;
2. requires observed current digest to equal `expectedCurrent` exactly;
3. loads—not caller-supplied—candidate receipt and its digest-addressed source,
   build-authority, and tombstone records; recomputes every canonical digest and
   cross-binding; validates candidate generation/manifest and reader open; and
   requires the supplied current authority digest to equal the candidate's
   persisted build-authority digest;
4. when `ACTIVE.json` exists, independently performs the same closed validation
   for its selected generation and persisted records. When
   `previousManifestDigest` is non-null, it also validates that retained previous
   generation, receipt, and all three persisted records. Missing, caller-replaced,
   or inconsistent historical authority is never inferred or accepted;
5. requires the current persisted authority decision and scope to authorize the
   candidate now, not merely at build time, and requires its tombstone record to
   equal the candidate source/authority/receipt/selector bindings;
6. replays tombstone exclusion against the candidate passage IDs and rejects any
   listed survivor, scope/sequence contradiction, or candidate passage inventory
   inconsistent with the persisted source record;
7. if a selector exists, requires candidate watermark to be greater than or
   equal to its watermark; equal watermark is valid only with equal tombstone
   inventory digest, and a greater watermark requires the candidate inventory to
   be a byte-identical superset of every active entry. Authorization may never be
   older, weaker, stale, revoked, or mismatched;
8. requires `Forward` when the candidate differs from the selector's
   `previousManifestDigest`; `Rollback` requires an existing selector and a
   candidate exactly equal to that selector's `previousManifestDigest`;
9. for rollback, revalidates the candidate against the current persisted
   tombstone inventory. Any candidate passage now tombstoned, lower watermark,
   or unequal equal-watermark inventory is rejected, preventing resurrection;
10. encodes `previousManifestDigest` as the observed current digest, or null only
    for first activation;
11. exclusively creates an otherwise empty `staging/<attemptId>`, writes
    `ACTIVE.next`, synchronizes it, performs Darwin full sync, reparses its bytes,
    synchronizes the attempt directory, and atomically renames it over
    `ACTIVE.json`. That rename is the visibility commit. It then full-syncs the
    renamed selector on Darwin, synchronizes the now-empty attempt directory and
    publication root, removes the attempt directory, and synchronizes `staging/`
    before returning success.

Before the visibility rename, every failure is pre-commit: `ACTIVE.json` remains
the validated old selector and staged state is recoverable. After a successful
rename, no failure may report pre-commit. If renamed-file full sync or any
required directory mutation/sync fails, return
`SELECTOR_COMMIT_INDETERMINATE` carrying
only `observedSelectorDigest`, equal to the candidate manifest digest observed at
rename; do not claim durability, rollback the selector, or expose other state.
The next invocation MUST recover under the lock and validate whether durable
state is old or new. No retry may assume old state or reuse the old
`expectedCurrent` without that observation.

A candidate equal to the observed current generation is an idempotent no-op only
when every persisted authority, tombstone, receipt, and selector binding
validates and no selector byte changes. Expected-current CAS is a semantic check
protected by the advisory lock and stable-namespace precondition, not a
cross-host transaction primitive. A same-generation request succeeds under only
those conditions; otherwise it fails.

Rollback is explicit only. It does not rebuild, mutate, copy, infer, choose the
previous field automatically, or bypass current authority. A retained generation
with a lower watermark or unequal equal-watermark inventory cannot be selected;
an updated immutable generation must be built instead. There is no automatic
activation, startup repair activation, fallback, or selection of “latest.”

## 9. Recovery, inventory, and retention

Every invocation locks first and validates the entire closed root inventory.
Unknown entries, symlinks, special files, malformed names, selector/generation/
receipt/authority disagreement, changing identities, and partial published
generations fail closed; they are never ignored or guessed. Root and validation
caps are checked before recovery mutation.

Recovery examines only `staging/` entries. An identity-stable staging attempt
with no committed destination may be removed. If an authority record, generation,
or receipt was already renamed, the published destination is fully validated and
preserved; an equal leftover is removed. An unequal or ambiguous destination is
corruption. `ACTIVE.next` is never promoted during recovery.

After any `SELECTOR_COMMIT_INDETERMINATE`, recovery reparses `ACTIVE.json` under
the lock and performs complete selector, generation, receipt, source, authority,
tombstone, and reader validation. It reports the one observed selected manifest
digest, which may be the old or new value after restart; it never assumes the
pre-commit value. If `ACTIVE.json` names valid old or new state, that state
remains selected. If it is absent on first use, no generation is selected. If it
is malformed or names invalid state, recovery fails closed and no generation is
autoactivated, rolled back, or substituted.

Old generations, authority records, tombstone inventories, source manifests, and
receipts are preserved. Garbage collection, retirement, deletion, erasure, and
history compaction are outside v1; the hard caps require operator intervention or
a later GC ADR once reached. Recovery never deletes published state, rolls back,
advances a watermark, or rewrites a selector.

## 10. Stable failures and diagnostics

The closed operation failure codes are:

- `BUILD_INPUT_INVALID` — typed value, project-authored class, field, inventory,
  binding, authorization, or source digest is invalid;
- `BUILD_RESOURCE_LIMIT` — a checked construction/source/resource limit would
  be exceeded;
- `BUILD_ENCODING_FAILED` — deterministic encoding invariant fails;
- `ROOT_INVALID` — root ownership/mode/type/location/identity is invalid;
- `ROOT_RESOURCE_LIMIT` — retained count/bytes or per-invocation validation work
  exceeds or a prospective mutation would exceed a fixed managed-root cap;
- `LOCK_UNAVAILABLE` — advisory lock cannot be acquired immediately;
- `INVENTORY_INVALID` — unknown, malformed, linked, special, missing, or extra
  root/staging/authority/generation/receipt entry;
- `IO_WRITE_FAILED` — create, full write, rename, or ordinary file operation
  fails before its required durability point;
- `SYNC_FAILED` — a required file sync, Darwin full sync, or directory sync fails
  before selector visibility commit, or during non-selector publication;
- `READER_VALIDATION_FAILED` — reader v1 rejects staged or retained bytes;
- `DIGEST_MISMATCH` — source, authority, artifact, manifest address, receipt, or
  existing immutable bytes disagree;
- `SELECTOR_INVALID` — `ACTIVE.json` is malformed, noncanonical, over-limit, or
  does not bind valid retained state;
- `SELECTOR_COMMIT_INDETERMINATE` — selector rename committed visibility but a
  required post-rename full sync, staging removal, or directory sync failed;
  diagnostic payload is exactly `{observedSelectorDigest:hex64}` and makes no
  durability claim;
- `CAS_MISMATCH` — observed current selector differs from expected current;
- `AUTHORIZATION_INVALID` — current project authority is absent, stale, revoked,
  weaker, or mismatched;
- `TOMBSTONE_REGRESSION` — watermark decreases or an equal watermark has an
  unequal inventory digest, a greater inventory drops or changes an earlier
  entry, or a selected passage would be resurrected;
- `ROLLBACK_INVALID` — rollback was implicit, never-active, or otherwise violates
  rollback gates; and
- `RECOVERY_AMBIGUOUS` — safe identity-conditioned cleanup or destination
  equality cannot be established.

Validation order is typed input and resource bounds; bootstrap identity; lock;
closed inventory and root/work caps; recovery; existing selector and its current
and previous authority chains; staged/published file structure; canonical record
digests and cross-bindings; reader validation; authorization/tombstones;
CAS/mode; then mutation. Within a file, byte order wins. The first detected
pre-commit failure is stable. After selector rename, only success or
`SELECTOR_COMMIT_INDETERMINATE` is valid. Diagnostics normally expose only code,
operation phase, file kind, bounded numeric offset/count, and digest kind; the
post-commit code instead exposes only its observed selector digest. Diagnostics
never expose host paths, passage/query text, source bodies, or unrestricted JSON.

## 11. Crash and fault matrix

Fault injection MUST cover every write boundary and every step before/after
file sync, Darwin full sync, reader validation, rename, and directory sync:

| Fault/crash point                                                                                   | Required result or restart observation                                                                                     |
| --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| partial/missing bootstrap or root/work cap excess                                                   | reject before mutation; publisher neither repairs bootstrap nor performs GC                                                |
| before an authority-record rename                                                                   | old selector unchanged; staged record is removable; prior records remain                                                   |
| after an authority-record rename, before both directory syncs                                       | old selector unchanged; destination is absent or exact after restart; unequal bytes fail                                   |
| before generation rename                                                                            | old selector unchanged; no published partial generation; removable stage only                                              |
| after generation rename, before both directory syncs                                                | selector unchanged; destination is absent or complete and validated; never activated                                       |
| after generation sync, before receipt rename                                                        | complete inactive generation and authority records preserved; explicit equal retry only                                    |
| after receipt rename, before both directory syncs                                                   | selector unchanged; receipt is absent or exact after restart; inequality fails                                             |
| any fault before selector rename, including next-file sync/full-sync                                | stable pre-commit failure; old selector preserved; `ACTIVE.next` is never promoted                                         |
| selector rename fails                                                                               | stable pre-commit `IO_WRITE_FAILED`; old selector preserved                                                                |
| selector rename succeeds, then renamed-file full sync or any required directory mutation/sync fails | return `SELECTOR_COMMIT_INDETERMINATE` with only candidate `observedSelectorDigest`; never report old or retry as old      |
| crash after selector rename but before all post-commit syncs                                        | recovery under lock accepts and reports only fully validated old or new selector; never torn bytes, inference, or fallback |
| after all post-commit syncs, before acknowledgement                                                 | complete new selector is observed; exact observed-current retry is idempotent                                              |
| malformed/unknown recovery entry or identity change                                                 | recovery fails closed and deletes no published state                                                                       |

The “old or new” allowance before the final directory sync bounds crash
consistency; it is not a claim of power-loss durability. Tests run only on the
explicitly qualified local filesystem/platform profile, with network denied.

## 12. Binary acceptance tests for the authorized implementation

Tests MUST be added before behavior and remain unchanged while implementing the
smallest conforming tranche. Acceptance is all-or-nothing:

1. **Canonical inputs:** key/order/escape/integer vectors, shuffled typed passage
   order, digest vectors, and mutation tests prove tombstone/authority/source
   digest equality, receipt/selector bindings, and the absence of every circular
   output field.
2. **Deterministic build:** repeated and perturbed-map-order runs produce equal
   source bytes, three artifacts, manifest, generation address, and receipt;
   independent analysis validates ordinals, terms, postings, frequencies, and
   reader open, including empty and maximum-boundary inventories.
3. **Limits:** every build and root count/byte/entry/work cap is tested at
   `limit-1`, `limit`, and `limit+1`; prospective generation, authority, receipt,
   staging, aggregate-retained, and validation-work excess performs no mutation
   or GC and returns the exact closed code.
4. **Oracle independence:** the committed hand-authored reader fixture and recipe
   are byte-identical before and after all tests; no fixture-generation path or
   builder-derived expected bytes are accepted as reader oracle.
5. **Root/inventory:** empty operator-preinitialized bootstrap passes; publisher
   creation/repair is absent; partial bootstrap, owner, mode, traversal,
   symlink/hard-link, special file, extra entry, device/inode/length change, lock
   contention, and same-address unequal bytes fail closed under ADR 0053's stated
   threat boundary.
6. **Ordering/durability:** instrumentation proves write → file sync → Darwin
   full sync → staging-directory sync → reader validation → generation rename →
   both source/destination-directory syncs, and next-file sync/full-sync →
   selector visibility rename → renamed-file full sync → source/root syncs →
   attempt removal → staging sync. Pre-rename faults preserve old; every required
   post-rename mutation/sync fault returns only
   `SELECTOR_COMMIT_INDETERMINATE` and the observed selector digest.
7. **Selector/CAS:** canonical bounds, absent first activation, exact
   expected-current success/failure, previous binding, concurrent conforming
   publishers, no symlink, no autoactivation, post-commit recovery, and stable
   first failures pass; retry never assumes the pre-commit selector.
8. **Authority/tombstones/rollback:** persisted current, previous, and candidate
   chains validate without caller-supplied historical contents. Unsorted,
   duplicate, scope/sequence/digest-contradictory tombstones; surviving listed
   passages; stale or mismatched authority; decreasing watermark; unequal
   equal-watermark inventory; implicit/never-active rollback; resurrection; and
   revoked authority fail. Only explicit currently authorized nonregressing
   rollback succeeds and preserves all generations and authority records.
9. **Crash/recovery:** every row and boundary in section 11 is killed and
   restarted; inventory remains closed, old generations survive, cleanup touches
   only identity-recorded staging, and no recovery path activates or falls back.
10. **Boundary:** network-denied tests pass; dependency/lock manifests, package
    exports, public `.d.ts`, native symbols, `OwnedSnapshotPort`, reader fixture,
    and default/release behavior remain byte-identical or surface-identical as
    applicable. No production or power-loss claim appears in acceptance output.

## 13. Traceability

[ADR 0053](../decisions/0053-fixture-only-owned-web-sqlite-qualification.md),
[ADR 0054](../decisions/0054-clean-room-owned-lexical-reader-qualification.md),
[ADR 0055](../decisions/0055-owned-lexical-builder-and-atomic-publication.md),
[reader v1](owned-lexical-reader-format-v1.md), and
[owned-web lexical target v1](owned-web-lexical-query-v1.md).
