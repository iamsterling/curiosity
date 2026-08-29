# ADR-017: iPadOS native journal ABI

**Status:** Accepted; implementation spike exists — 2026-08-29  
**Decision history:** The user accepted ADR-017 through ADR-021 as implementation
authority on 2026-08-29.  
**Authority:** Authorizes implementation of this design. It does not establish
mobile durability, migration, backup, release, or production qualification.

## Context

ADR-016 makes the portable TypeScript authority the sole application authority
for `ipados-local`, but intentionally does not qualify native persistence. The
desktop journal depends on `bun:sqlite`, while arbitrary SQL exposed to Hermes
would let presentation or adapter code bypass command admission. Reusing
`apps/runtime/native` would also cross that runtime's separately governed iOS
release boundary.

## Decision

Use a mobile-owned Rust static library behind an Expo Swift host and one coarse,
versioned C ABI.

1. The authority sees only `AuthorityJournal.events()` and
   `AuthorityJournal.admit(...)`. Hermes receives no SQL, database handle, path,
   transaction, or migration primitive.
2. ABI v1 accepts bounded JSON requests for `open`, paged `readEvents`, and
   atomic `admit`. Rust never retains caller memory. Stable negative FFI results
   map to stable journal error codes at the Swift boundary.
3. The mobile SQL schema is an exact checked copy of desktop schema v15. Unknown
   schema versions, missing required tables, quick-check failure, foreign-key
   violations, and event hash-chain corruption fail startup.
4. Admission uses one SQLite `IMMEDIATE` transaction for command deduplication
   and event append. A changed digest under the same actor/command identity is a
   conflict; an exact duplicate returns its original acknowledgement without
   appending events.
5. Every connection requires WAL and `synchronous=FULL`; ready connections
   enable foreign keys. This setting check is necessary but not sufficient for a
   durability claim under ADR-002.
6. The database lives under Application Support, is excluded from backup, and
   uses `completeUntilFirstUserAuthentication` Data Protection. Failure to set
   the selected protection policy prevents readiness.
7. Startup opens and verifies the journal before constructing the authority.
   There is no fallback to the in-memory journal in the production mobile path.
8. The journal archive links normally beside the existing force-loaded Crafty
   Rust archive, avoiding duplicate Rust standard-library objects.

## Invariants

- **ADR-017-I01:** Only admitted authority commands append canonical events.
- **ADR-017-I02:** Hermes and React receive no arbitrary SQL capability.
- **ADR-017-I03:** An unknown schema, corrupt chain, or unavailable protected
  store prevents local-runtime readiness; it never resets to an empty journal.
- **ADR-017-I04:** A returned accepted acknowledgement names exactly the event
  range committed by that admission.
- **ADR-017-I05:** Projections remain disposable folds over stored events.

## Consequences

Process relaunch can reconstruct the portable authority from native SQLite
without a Mac or server. The app now owns another Rust build unit and a committed
schema copy whose parity must be tested. Schema evolution requires explicit
migrations and cannot be inferred from the desktop database implementation.

WAL plus `synchronous=FULL` does not by itself prove acknowledged durability.
SQLite VFS behavior, WAL sidecar protection, device lock, hard reset, storage
pressure, backup policy, and migration failure remain qualification work.

## Binary acceptance checks

- [x] **ADR-017-AC01:** Automated parity compares the mobile SQL byte-for-byte
      with the desktop schema-v15 source.
- [x] **ADR-017-AC02:** Rust tests prove deterministic event hash/ID parity,
      exact duplicate handling, changed-digest rejection, and body-corruption
      detection.
- [x] **ADR-017-AC03:** A signed physical-iPad fixture creates five events,
      terminates the process, relaunches, and recovers the same projection and
      digest.
- [x] **ADR-017-AC04:** The signed Release app compiles and links the mobile Rust
      archive with the existing renderer archive.
- [ ] **ADR-017-AC05:** Crash injection covers every admission allocation and
      completion boundary without fabricating success.
- [ ] **ADR-017-AC06:** Device-lock, WAL-sidecar Data Protection, hard-reset,
      VFS synchronization, and storage-pressure tests qualify the exact physical
      storage profile.
- [ ] **ADR-017-AC07:** Forward migration, rollback/failure, backup, restore, and
      unknown-version fixtures fail closed or preserve canonical history as
      specified.

## Non-goals

No arbitrary SQL bridge, cloud sync, multi-writer database, desktop-runtime
reuse, release durability claim, File Provider integration, or backup claim.

## Evidence

- [N1–N3 physical acceptance, 2026-08-29](../evidence/ipados-native-n1-n3-2026-08-29.md)
- `apps/mobile/modules/curiosity-runtime/native/`
- `apps/mobile/src/native-journal.ts`
