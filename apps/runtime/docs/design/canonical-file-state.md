# Canonical-file state design candidate

**Status:** Accepted for bounded M2 by ADRs 0026 and 0027

## Boundary and proposed layout

For a future explicitly authorized M2, one configured state root would contain
only canonical authoritative files and disposable projections:

```text
<state-root>/
  format.json
  objects/sha256/<first-two-hex>/<remaining-hex>
  records/<record-kind>/<record-id>/<record-version>.json
  commits/<monotonic-commit-id>.json
  refs/visible.json
  tombstones/<record-kind>/<record-id>.json
  projections/<projection-kind>/<build-id>/...
```

This is a logical design, not a directory to create now. All names are validated
safe relative paths under a preconfigured root. Absolute paths, empty or dot
segments, `..`, backslashes, alternate encodings, and platform escape forms are
rejected before access. Every path component is opened without following
symlinks; any symlink, unexpected file type, ownership/mode violation, or
root-identity change fails closed and quarantines affected authority. No state
root may be placed in the source tree by implication of this document.

## Authority, immutability, and visibility

- `objects` holds immutable content addressed by lowercase SHA-256. Reads verify
  both size and digest; a conflicting existing object is corruption, never an
  overwrite opportunity.
- `records` holds immutable, versioned canonical JSON facts referencing object
  digests. IDs and versions are never reused or edited in place.
- A commit manifest names the complete new record/object set and predecessor.
  The single `refs/visible.json` publication point makes a fully verified commit
  visible. Unreferenced staged material is never query-visible and may be
  recovered or discarded under a future accepted policy.
- Exactly one authenticated administrative writer may import or transition
  authority. Query readers have no write, commit, activation, rebuild, restore,
  withdrawal, or deletion capability. Administrative and query APIs,
  credentials, processes, and diagnostics remain separate.
- Search indexes, analyzed passages, caches, statistics, and other material
  under `projections` are non-authoritative and disposable. Each build records
  its visible commit and tool/schema versions; mismatch or corruption causes
  discard and rebuild, never repair of authority from a projection.

## Canonical JSON and integrity

Canonical records and manifests would use UTF-8 JSON with no BOM, duplicate
keys, non-finite numbers, insignificant whitespace, or implementation-dependent
number/date rendering. Object keys are lexicographically ordered by Unicode code
point; strings and escapes use one future accepted canonicalization profile.
Digests cover the exact canonical bytes, not an in-memory object. The exact
profile, test vectors, and compatibility/versioning rules remain unresolved and
must be accepted before bytes are written.

Malformed JSON, unknown schema/version, duplicate identity, broken reference,
digest mismatch, unexpected mutable file, traversal attempt, symlink, or partial
commit fails closed. Authority is not silently repaired, overwritten, skipped,
or served. Stable redacted diagnostics distinguish absence, incompatibility,
corrupt authority, corrupt projection, and incomplete publication.

## Withdrawal, deletion, and tombstones

Withdrawal first durably writes its tombstone and commit, after which it removes
query visibility. Queries honor a tombstone even if a crash leaves the old
visible ref in place. A later deletion commit may remove content only under the accepted retention and backup policy,
while preserving the approved minimal non-content tombstone and audit fact.
Tombstones identify the withdrawn immutable IDs/versions and prevent a rebuild
or restore from resurrecting them. Projections and caches are then discarded or
rebuilt. No object garbage collection is permitted until reachability,
retention, withdrawal, backup, and restore rules prove deletion is safe.

## Backup and restore considerations

A backup must capture one complete visible commit, all reachable authoritative
records, objects, refs, and tombstones, with an integrity manifest. Projections
need not be backed up. Restore targets a clean root, verifies every canonical
byte and reference before publication, reapplies later applicable tombstones,
and rebuilds projections. Backups are read-only custody copies, not alternate
writable authorities. Encryption, access, retention, deletion propagation,
media handling, restore rehearsal, and cross-version compatibility must follow
future accepted classification and operations policy.

## Bounded M2 resolution

D5's M2-only disposition and limitations are recorded in ADR 0026. The
following remain unresolved beyond bounded M2:

1. exact atomic-rename, directory/file `fsync`, crash-boundary, and filesystem
   assumptions, including behavior on each supported operating system;
2. single-writer locking, stale-lock recovery, process identity, fencing, and
   reader/backup consistency rules;
3. RPO, RTO, backup cadence, restore rehearsal, media custody, and deletion
   propagation targets;
4. admin/query authentication, authorization, revocation, break-glass, and
   least-privilege deployment boundaries;
5. minimum tamper-evident audit format, sequencing, retention, redaction,
   review, and corruption response without creating a domain-event stream; and
6. canonicalization, schema migration, upgrade/downgrade, rollback, garbage
   collection, and format retirement policies with conformance/crash tests.

SQLite remains outside this candidate. Selecting it requires a future ADR and
D8 approval. Nothing here creates persistence, a dependency, runtime state,
durability or production guarantees, corpus custody, or M2 implementation
authority.
