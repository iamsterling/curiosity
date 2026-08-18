# ADR 0024: durable Ledger v2 and capture authority

**Status:** Accepted — 2026-08-18; design approval only, not implementation
authority; production authority and persistence remain disabled until every gate
below passes

## Context and repository evidence

[ADR 0041](../../../../runtime/docs/decisions/0041-unified-retrieval-memory-evidence-substrate.md)
accepts one Ledger/capture evidence substrate but blocks implementation until
durability, fencing, encryption, retention, authorization, reconciliation, and
migration are decided. Ledger and its publication boundary are owned by this
plugin repository, so this is the canonical follow-up decision. It does not
adopt OpenSpec, authorize code, enable production authority or persistence, or
establish that a supported host exists.

The current implementation cannot be treated as this substrate:

- [Ledger v1's decoder](../../src/features/ledger/domain.ts) accepts only
  `schemaVersion: 1` and has a deliberately closed model without ADR 0023's
  capture, authorization, deletion, or validation states.
- [ADR 0012](0012-ledger-native-product.md) makes Ledger v1 the only lifecycle
  authority. Its tamper claim is explicitly bounded against same-UID workspace
  writers.
- [ADR 0014](0014-release-candidate-authority-and-fencing.md) requires the
  current epoch/token at material commit and requires unprovable state to fail
  closed.
- The [atomic store](../../src/platform/persistence/atomic-store.ts) rejects a
  leased material update with `PERSISTENCE_AUTOMATION_UNSUPPORTED`; its
  [fencing test](../../tests/unit/persistence-fencing.test.mjs) verifies that no
  target is published through that unsupported path.
- The [current-state record](../architecture/current-state.md) and
  [real-host capability](../../src/platform/real-host/index.ts) keep
  authoritative persistence disabled because the present host/filesystem
  boundary cannot bind publication to the fence.

Those are safety properties to preserve, not gaps to bypass.

## Resolved policy choices

This decision records these owner-selected policies:

1. **Object custody is filesystem-only.** Encrypted immutable objects live in a
   qualified adjacent filesystem area. SQLite BLOB custody is not a profile and
   there is no automatic SQLite BLOB fallback on filesystem, capacity, or
   configuration failure.
2. **Production recovery has a no-resurrection requirement.** A restored root
   may not serve any content until every anchored restriction after its backup
   cursor has been verified and applied. Total-loss recovery without sufficient
   continuity remains quarantined; accepting an RPO gap cannot authorize
   restored content to serve.
3. **Production same-UID coherent rewrite detection requires a provider-neutral
   external authenticated continuity anchor.** Local hashes, signatures, keys,
   and checkpoints are insufficient when that writer can coherently replace
   them.
4. **`.env` key material is allowed only right now in an explicitly activated
   development-bootstrap profile.** That profile is test-only: it uses
   AES-256-GCM with a fresh random per-object DEK and nonce, plus a local
   HMAC-SHA-256 anchor emulator whose secret is loaded from an ignored `.env`.
   This is never production key custody, production cryptography, or an external
   continuity anchor, and is never selected by inference or fallback.
5. **Persisted derived bytes use the same qualified encrypted filesystem-object
   custody protocol as raw captures.** Each derived representation has its own
   representation identity, DEK, immutable object, and receipt; it cannot reuse
   the raw capture's identity, key, or receipt.
6. **Production anchor unavailability fails closed immediately.** Serving and
   restore promotion have no cached, offline, grace-period, or operator-issued
   lease that permits them to continue after unavailability is observed or
   availability cannot be proven by the required final check.
7. **Production time periods have no defaults.** Retention, legal-hold, backup,
   and erasure periods remain blocking until named policy owners approve
   explicit values and scope. Development fixtures are disposable and confer no
   production retention, recovery, legal-hold, or erasure claim.

These accepted design choices do not enable production authority or persistence.
No provider, production cryptographic algorithm, SQLite binding, production key
custodian, production time period, or positive serving lease is selected here.

## Decision

Only after every gate below closes, Curiosity will introduce
**Ledger v2 as the exclusive post-cutover lifecycle authority**, backed by a
fixed-location local SQLite database in a qualified rollback-journal profile,
qualified filesystem object custody, and—outside development bootstrap—a
qualified external continuity anchor. Ledger v1 becomes digest-verified,
read-only migration input. It is never a concurrent, fallback, or dual-write
authority.

SQLite owns identities, local lifecycle events/current views, receipts,
authorization snapshots, generations, tombstones, holds, erasure progress,
backup manifests, reconciliation findings, migration mode, anchor progress, and
audit history. Filesystem custody holds encrypted immutable bytes only. The
external anchor holds authenticated continuity records and signed monotonic
heads/checkpoints sufficient to detect rollback and recover restrictions; it
does not hold object plaintext or become a query index. Projections remain
disposable and non-authoritative.

The topology is one local root, one database, one filesystem object area, one
serialized SQLite writer, and one configured continuity-anchor implementation.
Network filesystems, replicated local writers, server/cluster mode, and
cross-host live failover are out of scope. Multiple readers are permitted only
if the selected binding, final-check protocol, and freshness policy prove the
invariants below.

The Node release, SQLite build/binding, pragmas, filesystem,
exclusive-publication primitive, cryptographic suites, key custody, anchor
provider, policies, owners, and stable diagnostics remain blocking.
Authoritative persistence stays disabled until they are pinned and probed.

## Invariants

1. Exactly one Ledger decides local lifecycle and query truth. Files, indexes,
   caches, Ledger v1 after cutover, and reconciliation reports cannot do so. The
   continuity anchor constrains valid Ledger history but is not object custody
   or an independently queryable lifecycle database.
2. Every material mutation is committed by the current SQLite generation and a
   compare-and-set over every authority revision it read. Stale or unknown
   authority commits nothing.
3. Filesystem publication and erasure are serialized while the SQLite write
   transaction and affected identity's write barrier are held. Once ownership
   is lost or uncertain, that command performs no further filesystem mutation.
4. Only a locally `COMMITTED` receipt whose required anchor record is confirmed
   and whose object exists, authenticates, and matches integrity metadata can
   feed validation or projection. Prepared or anchor-pending work is not
   evidence.
5. Capture bytes and derived representations are immutable. Correction creates
   a new object/receipt and event. A derived representation has an identity,
   key, object, and receipt distinct from its raw capture and sibling
   representations, while using the same custody protocol.
6. Authorization, validation, eligibility, retention, hold, tombstone, custody
   erasure, backup expiry, and media-sanitization claims are orthogonal.
7. Tombstoned, pending-restriction, unauthorized, stale-authorization,
   missing-object, integrity-failed, anchor-stale, or quarantined material is
   never served.
8. Unknown schema/policy/key/anchor versions, ambiguous migration, corruption,
   unprovable durability, and unprovable continuity fail closed. Recovery does
   not substitute empty state.
9. Local audit history is append-only and current tables are transactionally
   checked projections of it. Production must compare it with an authenticated
   external continuity anchor to detect coherent same-UID local replacement.
10. A restored root serves nothing until it proves its backup cursor against the
    anchor and applies every later anchored restriction. Missing continuity is a
    quarantine condition, not an RPO-based serving mode.
11. Production anchor unavailability immediately disables serving and restore
    promotion. No offline lease or previously observed head overrides this.
12. Production retention, legal-hold, backup, and erasure periods are explicit,
    owner-approved policy inputs; absence never selects a default.

## Authority and threat boundaries

Ledger v2 is authoritative for local lifecycle and repair decisions, subject to
the anchor's continuity constraints. The object area has custody of encrypted
bytes only; a path, directory entry, header, or digest cannot establish
lifecycle state. Object discovery never imports authority. Indexes, graphs,
snippets, and caches are rebuildable projections. Backup media are retained
copies, not live authority.

The design addresses crashes within qualified durability limits, stale local
processes, publication/erasure races, malformed state, object substitution,
projection leakage, incomplete erasure, accidental repair, local rollback, and
coherent replacement that conflicts with an independently retained anchor head.
Local hashes, SQLite checks, and signatures alone do not detect a same-UID
writer able to replace the database, objects, `.env`, local keys, manifests, and
local trust roots consistently. Production therefore requires actor/key
isolation and the external anchor.

The interface cannot by itself prevent a malicious or compromised anchor from
equivocating and presenting different valid histories to different clients. Nor
can it prevent an operator who controls both local and external credentials from
rewriting both sides, suppressing availability, or intentionally authorizing a
new genesis. Provider selection must document consistency, append durability,
credential separation, head witnessing/audit, outage, compromise, and recovery
properties. Diagnostics must describe observed evidence without claiming
global non-equivocation. No provider is selected here.

Root/kernel/firmware compromise, memory scraping, denial of service, traffic
analysis, endpoint compromise while plaintext is authorized, and loss or
collusion across every approved independent trust domain remain outside the
guarantee. Encryption at rest does not protect plaintext from an authorized
process. Retrieval, graph, crawler, and serving vendors are not selected.
OpenSpec assets are not introduced.

## Explicit profiles and prohibition matrix

Profiles are named configuration values, not environment inference. Startup
must require exactly one explicit profile and emit a stable, non-secret
diagnostic naming the profile, custody mode, key-custody class, anchor mode, and
serving capability. Missing, unknown, contradictory, or partially configured
profiles fail closed. Production cannot silently downgrade to development,
offline, local-only, BLOB, or newly generated keys.

| Capability                                      | `development-bootstrap`                                                         | Production profile                                                              |
| ----------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Activation                                      | Explicit name only                                                              | Explicit qualified name only                                                    |
| Object custody                                  | Qualified filesystem protocol                                                   | Qualified filesystem protocol                                                   |
| SQLite BLOB object custody/fallback             | Prohibited                                                                      | Prohibited                                                                      |
| Key material from `.env`                        | Temporarily allowed, with loud bootstrap diagnostic                             | Prohibited                                                                      |
| `.env` as external continuity anchor/trust root | Prohibited                                                                      | Prohibited                                                                      |
| Local anchor emulator                           | HMAC-SHA-256 test emulator; secret from ignored `.env`                          | Prohibited                                                                      |
| External authenticated anchor                   | Not supplied; emulator provides no external continuity claim                    | Required                                                                        |
| Persisted raw/derived object protocol           | Same qualified encrypted filesystem protocol; distinct identities/keys/receipts | Same qualified encrypted filesystem protocol; distinct identities/keys/receipts |
| Crypto suite                                    | Test-only AES-256-GCM rules below                                               | Unresolved and blocking                                                         |
| Retention/hold/backup/erasure periods           | Fixtures disposable                                                             | No defaults; owner approval required                                            |
| Serve while required anchor is unavailable      | Prohibited                                                                      | Prohibited; immediate                                                           |
| Serve after restore before full anchor catch-up | Prohibited                                                                      | Prohibited                                                                      |
| Serve after total-loss continuity gap           | Prohibited                                                                      | Prohibited                                                                      |
| Production claims or data                       | Prohibited                                                                      | Subject to every gate                                                           |

The development-bootstrap profile must additionally reject a production marker,
production data classification, non-loopback exposure, or production serving
request. It must identify test-only `.env` secret loading without printing names
or values and must never persist those values, DEKs, or HMAC secrets into
diagnostics, Ledger records, receipts, backups, or emulator payloads. Its local
emulator exercises protocol shape and failure paths only: it shares the local
failure domain and supplies no rewrite-detection, secure-custody, external-
continuity, or production-crypto claim. “Right now” is a temporary test
exception, not a migration promise.

For each development fixture object, encryption uses AES-256-GCM, a fresh
cryptographically random 256-bit DEK, and a fresh random 96-bit nonce. A nonce
must never repeat with the same DEK; retries that might reuse either value must
reuse the exact immutable ciphertext envelope or allocate a new DEK and nonce,
never re-encrypt different plaintext under the pair. Canonical authenticated
data binds at least the custody-protocol version, crypto-envelope version,
profile, tenant, object identity, representation identity/type, receipt identity,
algorithm/key-generation identifiers, and declared plaintext size and digest.
For derived objects it also binds the source receipt, producer/version, and
transformation-policy version. Envelope and authenticated-data encodings are
explicitly versioned; unknown versions, missing fields, identity substitution,
or authentication failure reject the object before eligibility. These concrete
choices qualify only disposable development fixtures; production suites, key
custody, entropy qualification, and envelope approval remain unresolved.

## Provider-neutral continuity-anchor contract

The domain depends only on a provider-neutral authenticated interface with these
semantics (notation is illustrative, not an implementation API):

```text
readHead(stream) -> authenticated monotonic head/checkpoint
readAfter(stream, cursor, boundedLimit) -> ordered authenticated records + head
appendCAS(stream, expectedHead, record) -> appended head | CAS conflict
```

`readHead` returns the latest authenticated stream identity, sequence, record
commitment, previous-head commitment, and signing/key generation. `readAfter`
returns a gap-detectable ordered suffix bounded by caller limits. `appendCAS`
atomically appends exactly one canonical record only when `expectedHead` is
current; retrying the same idempotency ID and content returns the same result,
while changed content conflicts. All methods authenticate stream/tenant,
protocol version, request/response, and freshness evidence and return stable
unavailable, stale, conflict, malformed, authentication, and equivocation
diagnostics.

Heads/checkpoints are monotonically sequenced, hash-linked, and signed outside
the local same-UID trust boundary. Periodic checkpoints commit the complete
prefix and the current Ledger generation, policy generation, key generations,
and recoverable-restriction accumulator. The signature/envelope algorithms,
canonical encoding, key custodians, rotation rules, checkpoint cadence,
witnessing, retention, and provider are deliberately unresolved.

Anchor records disclose no content plaintext and only policy-approved metadata.
They must preserve enough authenticated information to reapply restrictions
after restore: identity-scoped tombstones, holds, authorization/revocation
generations, erasure state, authority/migration generations, and key lifecycle
commitments. A tombstone may be compacted from the replay suffix only after a
retained signed checkpoint commits its continuing suppression and policy proves
that every restorable backup/object/key generation it governs has expired or is
irreversibly inaccessible. Recoverable restrictions cannot be deleted merely
because local custody was erased.

Every encrypted object binds a committed key-generation identifier. Anchor
records commit key creation, activation, retirement, revocation/destruction,
and the maximum object/backup generation each key can decrypt. Restore may not
reactivate, regenerate under the same identifier, or use a key generation whose
anchored lifecycle disallows it. These are commitments and constraints, not a
selection of key hierarchy, key store, signature scheme, or AEAD.

## SQLite and filesystem custody capability gates

Acceptance pins and verifies, rather than infers:

- the production Node/SQLite binding, SQLite version, transaction modes, busy
  behavior, backup/integrity APIs, limits, and error semantics;
- effective rollback `journal_mode` (initial proposal: `DELETE`), approved
  `synchronous`, foreign keys, and absence of WAL on every connection;
- database, journal, temporary object, final object, and parent-directory
  durability under kill and power-loss fault injection on each supported local
  filesystem;
- approved root/device, path, symlink, ownership, permission, and filesystem
  policy without claiming support from API availability alone;
- exclusion across real processes from SQLite's write transaction, never an
  in-memory mutex, PID file, or deletable lock directory; and
- approved encryption/key APIs that fail closed without exposing keys or
  plaintext in paths, diagnostics, logs, anchor records, or unencrypted backups.

Final publication requires a capability-proven same-filesystem hard-link
protocol: create the temporary file exclusively, fully write/sync/verify it,
then create the final directory entry with `link(temp, final)`. `EEXIST` is a
conflict or verified idempotent result; the final path is never replaced. Parent
directories are synced according to the qualified protocol. Hard-link
semantics, directory sync, link count/cleanup behavior, crash outcomes, and Node
error mapping must pass real-host probes before this profile is enabled.

If filesystem custody cannot qualify or becomes unavailable, authoritative
capture and serving fail closed with a stable profile/capability diagnostic.
There is no automatic or operator-selected SQLite BLOB fallback under this ADR.

## Local and external commit state machine

Every anchored mutation has one canonical idempotency ID and follows:

```text
LOCAL_PREPARED -> EXTERNAL_APPENDED -> LOCAL_COMMITTED
```

1. **Local prepare.** A fenced SQLite transaction validates current authority,
   records canonical intent plus expected local and anchor heads, and commits
   `LOCAL_PREPARED`. Preparation publishes no object and acknowledges nothing.
2. **External append.** Outside that transaction, the worker calls `appendCAS`
   for the canonical intent. CAS conflict, malformed evidence, or uncertainty
   does not advance local authority. A read may prove an idempotent append; only
   authenticated proof records `EXTERNAL_APPENDED`.
3. **Local commit.** A new fenced SQLite transaction revalidates generation,
   identity barrier, policy, local preparation, and exact anchored record, then
   performs the authorized local state transition and commits
   `LOCAL_COMMITTED`. Only this state may be acknowledged or become evidence.

A crash at any boundary is resolved by read-only local and anchor inspection
before retry. An externally appended record cannot be rolled back; recovery must
apply it or quarantine on conflict. A local preparation cannot be promoted by
object discovery. Concurrent external records are consumed with `readAfter` and
applied in order before another append CAS. Unknown gaps, forks, stale heads, or
unbounded catch-up block mutation and serving according to the unresolved
freshness policy.

Filesystem publication still occurs while the final local SQLite transaction
and identity barrier are held. This is intentional serialization, not
cross-system ACID. It can block writers during encryption verification, file
sync, hard-link, directory sync, unlink, and slow-device latency. Time/size
limits, disk reserve, busy policy, cancellation, and operator expectations are
blocking criteria.

## Capture publication protocol

Each authorized ingest has a deterministic `ingest_id`:

1. Local prepare binds canonical input, source/capture metadata,
   policy/authorization snapshots, object/key/algorithm versions, expected
   plaintext digest/size, and expected anchor head. Different canonical input
   under the same ID is a stable conflict.
2. Non-authoritative ciphertext may be staged to an exclusive temporary file.
   The canonical receipt intent is appended with `appendCAS` and authenticated.
3. In a new SQLite write transaction, acquire the identity barrier and recheck
   receipt, generation, policy, authorization, hold/tombstone state, anchored
   intent, metadata, and staged-file integrity. While the transaction remains
   owned, hard-link to the absent final path, run the qualified sync sequence,
   append local `COMMITTED`, and commit SQL.
4. After transaction loss or uncertainty, perform no unlink, relink, sync,
   rename, or other filesystem mutation in that command. Resolve by inspection
   and a newly fenced attempt.

A crash can leave no record, local preparation, temporary bytes, anchored
intent, an orphan final link, or a committed receipt. Only the last is evidence.
Reconciliation may complete only the exact current anchored preparation after
reacquiring authority; otherwise it blocks or performs policy-approved cleanup.
Temporary and orphan objects are never query eligible. Persisted derived
representations use this same encryption, staging, hard-link publication, sync,
commit, reconciliation, backup, and erasure protocol. Each binds a distinct
representation identity, object identity, DEK, receipt, producer/version, input
receipt, transformation policy, and digest. A raw receipt cannot stand in for a
derived receipt, and neither key nor receipt identity is shared between them.

## Authorization final check and serving freshness

Authorization precedes every existence-revealing object, projection, or cache
access. Candidate work binds principal/tenant, purpose, corpus, policy version,
decision ID, anchor head, and freshness deadline. Immediately before response
materialization, one SQLite transaction checks current authorization revision,
tombstone/pending restriction, eligibility, receipt/integrity state, projection
cursor, and required anchor freshness. The bounded response is fixed before the
transaction ends. Raw streaming needs a separate revocable-capability design and
is out of scope.

Production's outage behavior is resolved: immediately before any response begins
delivery, a response-delivery gate must obtain fresh successful authenticated
anchor availability/freshness evidence for that attempt. Failure, timeout,
uncertainty, or observed unavailability returns no evidence; a cached head,
offline lease, grace period, or operator override cannot authorize serving. Once
anchor unavailability is observed, the qualified host must cancel or block every
delivery not yet completed and deliver no further bytes for those responses.
Bytes delivered before that observation cannot be retracted and are outside this
guarantee. If the host cannot prove this gate and cancellation boundary,
production serving remains disabled. The available-head freshness bound and
bounded catch-up remain blocking and must not weaken that no-offline-lease rule.
Principal identity, tenant/purpose semantics, revocation SLA, denial disclosure,
and maximum response size also remain gates.

## Tombstone, publication, erasure, and reconciliation

Tombstones use a stricter interpretation of the state machine:

1. Local prepare crosses the identity barrier and durably enters
   `TOMBSTONE_PENDING_ANCHOR`; this immediately suppresses local queries,
   projections, publication, retry adoption, and derived work.
2. The exact tombstone is appended by anchor CAS. Failure or outage leaves local
   suppression in place and returns pending/unacknowledged, never success.
3. A new fenced transaction verifies the anchored record and commits
   `TOMBSTONED`. The API acknowledges the tombstone only after both the external
   append and this local commit succeed.

No cancellation can make pending material eligible again unless a distinct,
policy-authorized, anchored reversal event exists; whether reversals are ever
legal is a policy gate. A legal hold can prohibit destruction but cannot restore
eligibility. Physical erasure is separately prepared and anchored, then uses a
new write transaction and the same barrier to recheck hold/tombstone/custody
state, perform authorized unlinks while the transaction is held, and record the
observed result. Erasure acknowledgment requires the corresponding anchored and
local commits; media and backup claims remain separate.

Unlink removes a directory reference; it does not prove overwritten media.
Crypto-shredding is valid only for a proven key scope with every key copy
covered. `ERASURE_VERIFIED` means every policy-defined in-scope primary,
derived, cache/projection, export, quarantine/temp, snapshot, key, and backup
copy is verified inaccessible by its approved mechanism. It never means
physical bit erasure without separately proven sanitization.

Production has no implied retention, legal-hold, backup-expiry, erasure-delay,
or erasure-completion period. Missing or unapproved values block capture,
serving, backup promotion, retention expiry, hold release, and erasure claims as
applicable; implementations may not substitute constants or environment-based
defaults. Named legal, privacy, security, product, and operations owners must
approve each policy's values, scope, jurisdiction, clock semantics, and change
process. Development fixtures are disposable test inputs and are not evidence
of a production period or compliant deletion.

After the erasure barrier, reconciliation traverses receipts, final/temp objects,
projections, exports, keys, backup manifests, and anchor suffix/checkpoints. A
stale publisher, missing restriction, or unexplained reappearance is a blocking
integrity finding, never silently deleted or recommitted. A held or accessible
retained copy keeps erasure pending.

Automatic repair is limited to applying exact authenticated anchored records,
idempotently completing their exact current preparation, policy-approved temp
cleanup, rebuilding disposable views, and retrying already authorized erasure
after reacquiring the barrier. It cannot invent bytes, activate validation,
release holds, rewrite history, bypass anchor CAS, or promote an object by
discovery. Human repair is also a fenced and anchored Ledger mutation.

## No-resurrection backup and restore

Each encrypted backup has a Ledger-authored manifest binding its committed local
and anchor cursors/heads, time, integrity result, object inventory and digests,
key versions, policy snapshot, and expiry. The selected SQLite backup procedure
and object copy order must be proven. A backup is complete only after isolated
restore reproduces its manifest.

Every restore creates an isolated `RESTORE_QUARANTINED` candidate and serves
nothing—not even content believed unaffected—until it:

1. verifies database, objects, manifest, keys, signatures, stream identity, and
   the backup's anchor checkpoint;
2. obtains and verifies an unbroken authenticated suffix from that checkpoint
   to an acceptably fresh head;
3. applies all post-backup tombstones, holds, revocations, erasures, authority
   generations, migrations, and key-generation restrictions in order;
4. proves reconciliation and no-restorable-copy conditions required by those
   restrictions; and
5. records a fresh anchored generation and receives operator-approved fenced
   promotion after a successful authenticated anchor availability/freshness
   check in that same promotion attempt.

Promotion cannot lower a generation, omit an anchored restriction, or replace a
known stream with a new genesis. If the anchor or required witness is lost,
unavailable, forked, too stale, or cannot prove the complete suffix, the restore
remains quarantined indefinitely. In production there is no restricted-serving,
operator-RPO-acceptance, local-head-trust, offline lease, grace period, or
backup-only escape hatch. Destructive disposal or separately approved forensic
export may be possible, but not normal serving. This is the selected safe
meaning of no resurrection after total loss.

## Exclusive migration and cutover

The runtime is configured with one fixed Ledger v2 database location; no
filesystem authority locator, marker, symlink, or discovery scan selects v1/v2.
That database contains the monotonic authority mode:

```text
V1_LIVE -> MIGRATING -> V2_LIVE
```

No reverse transition exists. Every startup reads this row before opening a
writer. Unknown/missing state fails closed; it never falls back to v1.

1. In `V1_LIVE`, verify and freeze all v1 writers and record the final v1
   cursor/root digest. The operator-approved transition to `MIGRATING` is the
   irreversible authority barrier; failure thereafter does not resume v1.
2. In `MIGRATING`, verify the complete closed-schema v1 history and inventory,
   then deterministically build v2 records and filesystem objects. Unknown,
   corrupt, orphaned, or changed input blocks.
3. Re-run into a clean candidate, require matching canonical digests/inventories,
   exercise restore/crash tests, and append the v2 genesis binding the final v1
   digest by anchor CAS.
4. One fenced SQLite transaction verifies that anchored genesis and moves
   `MIGRATING` to `V2_LIVE`. Only then may v2 serve/write. V1 remains immutable
   migration evidence under retention policy.

Crash recovery uses the SQLite mode and anchor state together. Conflict or
uncertainty fails closed; `V2_LIVE` never consults v1 as current truth.

## Binary acceptance checks

Acceptance is binary for every supported runtime/profile combination:

1. Configuration tests reject implicit profiles, BLOB custody/fallback,
   production `.env` keys, `.env` anchors, development profile plus production
   markers/data/exposure, and every attempted production downgrade. Diagnostics
   identify the safe cause and expose no key material. Development accepts only
   the explicit test profile with AES-256-GCM and the local HMAC-SHA-256 emulator
   secret loaded from an ignored `.env`; either mechanism is rejected in every
   production profile.
2. Real processes race SQLite generations/barriers and anchor CAS. Exactly one
   canonical mutation commits; stale commands perform no later lifecycle or
   filesystem mutation, and different content under one ID is a stable conflict.
3. Contract tests exercise `readHead`, paginated/bounded `readAfter`, and
   idempotent `appendCAS`: gaps, rollback, stale heads, wrong streams, invalid
   authentication/signatures, replay, equivocation evidence, and uncertain
   responses fail closed with stable diagnostics.
4. Kill/power-loss at every local-prepare, external-append, SQL, stage/write/
   sync/hard-link/directory-sync, local-commit, unlink, and erasure boundary
   converges to an enumerable blocked, prepared, externally appended, orphaned,
   committed, or erased state without false acknowledgment.
5. Tombstone races prove suppression begins before remote append; outage leaves
   it suppressed and unacknowledged; acknowledgment occurs only after verified
   external append and local commit. A stale publisher cannot create or
   recommit bytes after the barrier.
6. Substituted, truncated, bit-flipped, wrong-key/data, missing, path-swapped,
   and reappearing post-erasure objects are blocked with stable findings. No
   test path switches custody to a BLOB. Raw and persisted derived fixtures
   traverse the same qualified filesystem protocol, while tests prove that
   their representation identities, object identities, DEKs, and receipts are
   distinct and not interchangeable.
7. Revocation/tombstone races at candidate and final-check boundaries return an
   allowed bounded response or no evidence. Outage injection after final
   authorization but before and during delivery proves that no first byte is
   delivered without fresh final anchor verification and that, once the
   qualified host observes anchor unavailability, it delivers no further bytes
   for any not-yet-completed delivery. Bytes delivered before observation are
   recorded as outside the possible guarantee. A host unable to prove this gate
   remains disabled for production serving. Unauthorized requests perform zero
   projection/object reads.
8. Signed monotonic head/checkpoint fixtures detect local rollback and coherent
   same-UID local rewrite against the external head. Adversarial split-view tests
   document the provider/witness guarantee and do not overclaim detection where
   all independent trust domains collude.
9. Backup restore remains `RESTORE_QUARANTINED` and serves zero objects until all
   post-backup anchored restrictions and key generations are verified/applied.
   Missing, stale, incomplete, or forked continuity after total loss never gains
   serving approval, including with operator RPO acceptance. Anchor failure,
   timeout, or uncertainty during a production serving final check or restore
   promotion attempt immediately denies that action; cached heads, offline
   leases, grace periods, and operator overrides do not change the result.
10. Tombstone/checkpoint compaction cannot remove recoverable suppression while
    any governed backup, object, or key generation can be restored. Retired or
    destroyed key generations cannot be reactivated under the same identity.
11. Fixed v1 fixtures migrate deterministically. Live/changing/corrupt v1 blocks.
    Crashes around both mode transitions and anchored genesis never fall back,
    reverse, or select authority through filesystem discovery.
12. Unsupported binding/pragma/filesystem/link/sync/anchor/key custody,
    disk-full, permission change, uncertain commit, anchor outage, and corruption
    preserve existing authority and stable fail-closed diagnostics.
13. Long filesystem and anchor operations prove configured size/time/busy/disk/
    pagination limits and documented impact on competing writers/readers.
14. Publication/erasure traversal finds orphan/temp/final objects, dangling
    receipts, missing committed bytes, stale projections, omitted anchor
    restrictions, post-barrier reappearance, held erasure, and expired copies.
15. `EXTERNAL_APPENDED` capture intents, anchor-only non-restrictive entries,
    discovered orphan temporary/final objects, and every state short of
    `LOCAL_COMMITTED` remain independently ineligible for each of the following:
    extraction; validation; serving projection; candidate generation; direct or
    exact retrieval; hydration; response serialization; and promotion by
    discovery or reconciliation.
16. Development fixture tests prove a fresh random 256-bit DEK and 96-bit nonce
    for every newly encrypted object. Retry tests either reuse the exact
    immutable envelope or allocate both anew; forced nonce/DEK-pair reuse for
    different plaintext fails closed before publication.
17. Authenticated-data substitution tests alter each bound identity, receipt,
    tenant, profile, algorithm/key generation, size/digest, producer/input, or
    policy field and are rejected. Unknown or missing custody, envelope, or
    authenticated-data versions are rejected before eligibility.
18. Secret-sentinel tests put recognizable values in the ignored development
    `.env`, DEKs, and emulator secret, then prove those values are absent from
    startup/failure diagnostics, logs, Ledger rows, receipts, object metadata,
    backups, emulator records/payloads, reconciliation output, and support
    evidence. Tests may report non-secret profile/algorithm/version identifiers.
19. Production configuration with any absent or unapproved retention,
    legal-hold, backup, or erasure period remains blocked and never supplies a
    default. Approval fixtures identify the named owner and exact policy version;
    disposable development fixtures are never promoted as production policy or
    compliance evidence.

No implementation may enable authoritative persistence until these scenarios,
focused and full verification, retained raw evidence, and independent review
pass.

## Operational recovery

Recovery stops writers and preserves the failed root. Operators work on an
isolated copy, capture non-plaintext manifests, verify SQLite/Ledger/anchor
integrity, verify keys and committed custody, classify anchor freshness, and run
read-only reconciliation. Any mutation follows local prepare, external append,
and a new fenced local commit. There is no automatic reset, database recreation,
direct SQL edit, object substitution, v1 fallback, BLOB fallback, local trust
reset, continuity-genesis replacement, or best-effort authority.

Runbooks must define stable diagnostics, restart tokens, transaction and anchor
limits, disk reserve, key loss, backup drills, RPO/RTO (without an RPO serving
escape), anchor outage/compromise/split-view handling, quarantine disposal, and
safe support evidence before acceptance.

## Rejected alternatives

- **Extend Ledger v1 in place:** its closed contract and current publication
  boundary do not supply these semantics.
- **Dual-write, v1 fallback, or filesystem authority locator:** multiple or
  discoverable lifecycle truths make fencing and crash cutover ambiguous.
- **SQLite BLOB custody or automatic BLOB fallback:** filesystem object custody
  is selected; changing custody on failure creates an unqualified second
  publication/backup/erasure model and masks the failed capability.
- **Inline or differently governed derived-byte custody:** it creates a second
  leakage, publication, backup, and erasure path. Sharing a raw identity, DEK,
  or receipt also destroys representation-level audit and revocation boundaries.
- **`.env` for production keys or any continuity anchor:** it shares the local
  same-UID failure domain and cannot provide external authenticated continuity.
- **Treat the development AES/HMAC fixtures as production security:** their
  local `.env` secrets and same-host emulator deliberately provide neither
  production custody nor external continuity.
- **Local signatures/checkpoints as coherent-rewrite protection:** a same-UID
  writer that can replace local keys and roots can rewrite them consistently.
- **Backup RPO acceptance or restricted serving after an unverified total-loss
  restore:** this can resurrect post-backup tombstoned or revoked content.
- **Production offline anchor lease or grace period:** it serves or promotes
  while current restrictions cannot be proven and contradicts immediate
  fail-closed behavior.
- **Anchor append without local prepare, or acknowledgment before local commit:**
  crash recovery would lack durable intent or report a restriction before local
  suppression is durable.
- **Publish outside the final SQLite write transaction:** a stale publisher can
  cross a tombstone/erasure barrier after losing authority.
- **No-replace rename as publication gate:** no such capability is assumed; the
  filesystem profile gates on proven exclusive hard-link publication.
- **Objects or projections as authority:** discovery cannot prove intent,
  authorization, continuity, or lifecycle state.
- **Pretend unlink proves media erasure:** it does not prove sanitization of all
  copies.
- **SQLite WAL:** rejected for this proposal to limit live durable-file states;
  rollback mode still requires qualification.
- **Choose a provider, production cryptographic algorithm, production key
  custodian, policy period, or available-head freshness bound by architecture
  fiat:** accountable evidence and separate named-owner approval are required.

## Consequences

The proposal gives local lifecycle, filesystem publication, and erasure one
SQLite exclusion boundary while independently anchoring continuity. It selects
one custody model, makes pending restrictions locally suppressive, prevents
successful production restore without complete anchored catch-up, and makes
profile downgrades explicit and testable. Persisted derived bytes receive the
same custody controls without sharing representation identity, key, or receipt.
Production serving and restore promotion now depend immediately on anchor
availability, and missing production policy periods block rather than default.
Development can exercise envelope and anchor-contract behavior with explicit,
disposable AES/HMAC fixtures without representing secure production custody.

Costs include three-stage mutation latency, an external availability dependency,
CAS contention, anchor retention and metadata exposure, long serialized local
transactions, hard-link/filesystem qualification, cross-store reconciliation,
explicit key operations, permanent quarantine after unrecoverable continuity
loss, one-way migration, and operator complexity. The anchor interface does not
magically solve provider equivocation or operator collusion. Strong final checks
bound response size and exclude raw streaming. Immediate failure on anchor
unavailability deliberately trades production availability for safety. Separate
derived keys and receipts increase key, metadata, backup, and erasure inventory.
Named-owner policy periods can delay production enablement. The test-only suite
creates no positive evidence for production algorithms, custody, continuity, or
compliance.

Acceptance approves this design only. This ADR neither authorizes implementation
nor supersedes ADRs 0012, 0014, or 0023, and it does not change the current
disabled host capability. Production authority and persistence remain disabled
until every gate passes.

## Unresolved choices and remaining acceptance gates

Production authority, persistence, and implementation remain blocked on:

1. supported Node/OS/filesystem matrix, exact SQLite binding/build,
   rollback/synchronous/busy settings, and stable diagnostic catalog;
2. v2 schema, canonical encodings, digest/signature envelopes, barrier/revision
   set, state-machine schema, generation ceremony, and transaction-loss rules;
3. filesystem object limits, hard-link/sync protocol, transaction budgets, disk
   reserve, cleanup, and resource policy;
4. production AEAD/signature/hash selections, nonce/key hierarchy, production
   and eventual non-bootstrap development key custody, escrow, rotation,
   revocation/destruction, crypto-shredding, entropy qualification, envelope
   approval, and threat-model approval;
5. continuity provider and trust-domain separation, stream tenancy, consistency,
   CAS/idempotency contract, witnesses/audit, checkpoint cadence, retention,
   privacy, pagination, outage, compromise, and disaster recovery;
6. production available-head freshness/catch-up bound and response-delivery gate
   qualification, principal authentication, tenant/purpose policy, authorization
   snapshots, revocation SLA, denial disclosure, and response bound;
7. named-owner approval of explicit retention and legal-hold periods and scope,
   recoverable tombstone/reversal/compaction rules, erasure periods/SLA,
   sanitization claim, audit residue, sensitive-content treatment, jurisdiction,
   clock semantics, and policy change process;
8. named-owner approval of explicit backup periods plus media/count/location,
   keys, manifests, RPO/RTO, full-suffix proof, permanent-quarantine/disposal
   process, and disaster roles;
9. reconciliation bounds/schedule, startup/catch-up budget, restart tokens,
   repair authority, split-view response, and quarantine authority;
10. v1 freeze/digests/mappings, anchored genesis and irreversible transition
    ceremony, legacy retention, and cutover approvals; and
11. named runtime, SQLite, filesystem, cryptography, key-custody, anchor,
    security, privacy, legal, operations, and product owners.

## Primary references

- SQLite, [Transactions](https://www.sqlite.org/lang_transaction.html) and
  [Locking and concurrency in rollback mode](https://www.sqlite.org/lockingv3.html).
- SQLite, [Atomic commit](https://www.sqlite.org/atomiccommit.html),
  [Backup API](https://www.sqlite.org/backup.html), and
  [limits](https://www.sqlite.org/limits.html).
- Node.js, [`node:sqlite`](https://nodejs.org/api/sqlite.html) and
  [`node:fs`](https://nodejs.org/api/fs.html) (`open`, `link`, `fsync`). API
  documentation is not evidence that a target host/filesystem is qualified.
- POSIX, [`link()`](https://pubs.opengroup.org/onlinepubs/9799919799/functions/link.html),
  [`open()`](https://pubs.opengroup.org/onlinepubs/9799919799/functions/open.html),
  and [`fsync()`](https://pubs.opengroup.org/onlinepubs/9799919799/functions/fsync.html).
