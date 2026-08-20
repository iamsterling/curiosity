# Legacy memory parity v1

**Status:** normative implementation and qualification contract under runtime
ADR 0056 and plugin ADR 0026; private legacy parity only

## 1. Boundary and baseline

This specification permits a removable Rust conformance implementation. It does
not describe a new memory system. The authoritative baseline is commit
`12ac2c4ca06d0f6ccfc479249a53aad977b70322`, inspected on 2026-08-19 with Node
`v24.18.0`, ICU `78.3`, Bun `1.3.14`, Darwin arm64. The commit, not those local
tool observations alone, fixes the source oracle.

The following baseline facts are unchanged requirements:

- `src/core/canonical/index.ts` owns legacy canonical JSON and SHA-256 text;
- `src/features/ledger/{domain,index}.ts` own v1 decoding and replay semantics;
- Ledger state is `.opencode/opencode2-config/ledger/v1/`, EventCapture state is
  adjacent at `capture/v1/`, and lexically sorted `*.json` names determine reads;
- plugin Ledger v1 is the sole lifecycle authority;
- EventCapture is the observation owner only; its envelopes and payload digests
  confer no lifecycle or evidence authority;
- Ledger evidence metadata is authoritative only through Ledger, while the
  separate development evidence slice is uncomposed and non-authoritative;
- EventCapture persists observation envelopes without payload bytes;
- `PERSISTENCE_AUTOMATION_UNSUPPORTED` is the intended fail-closed material
  publication semantic where commit-bound fencing is unproven; and
- no Rust, M2, M6, projection, fixture, report, or adapter is authority.

The baseline source and governing evidence blobs are pinned independently of
working-tree state:

| Baseline source/evidence                                                               | Git blob at `12ac2c4`                      |
| -------------------------------------------------------------------------------------- | ------------------------------------------ |
| `apps/plugin/opencode2/src/core/canonical/index.ts`                                    | `63b865dbd1e7f895e043796c2da5fe6f4e69d53c` |
| `apps/plugin/opencode2/src/core/diagnostics/diagnostic.ts`                             | `7dc504d16776c03b54b1bed5a1b577982f5deadc` |
| `apps/plugin/opencode2/src/features/ledger/archive.ts`                                 | `909d5e7e239dc9c9a0cc105b3ca2fc327b931590` |
| `apps/plugin/opencode2/src/features/ledger/domain.ts`                                  | `e0ef2cc1bb5cd4915059deb1565fa0853d8f3254` |
| `apps/plugin/opencode2/src/features/ledger/index.ts`                                   | `60cca2576179e4661e21cf52dc9e95e2f13f50c5` |
| `apps/plugin/opencode2/src/features/hooks/event-capture.ts`                            | `76929b42950fbb5d66dd361cffc8a157ccd81506` |
| `apps/plugin/opencode2/src/features/hooks/open-code-hooks.ts`                          | `e2f3f477894cc4e2bf186d27778f40f4d10f6f8f` |
| `apps/plugin/opencode2/src/platform/persistence/atomic-store.ts`                       | `9e49b5a9932fcd9a41846bec6321eb83576683ea` |
| `apps/plugin/opencode2/src/platform/real-host/index.ts`                                | `50a2db3693b63fa0edbf3f4325d92590ec766fa5` |
| `apps/plugin/opencode2/src/plugin/plugin.ts`                                           | `774d2701e2ea58fec8c58f210cf37ab571ae0e58` |
| `apps/plugin/opencode2/src/features/evidence/anchor.ts`                                | `3c6d5e3fc49749da2b3b2b66e661fb4e123579ec` |
| `apps/plugin/opencode2/src/features/evidence/configuration.ts`                         | `2b1ca16d035ee1de1848191f69bb48ab0c5746f1` |
| `apps/plugin/opencode2/src/features/evidence/custody.ts`                               | `4d375a758756f0114297c736bb7c94662b6c2109` |
| `apps/plugin/opencode2/src/features/evidence/development-harness.ts`                   | `05aad90d1d21e739b31ff4baab6e5834fe481e45` |
| `apps/plugin/opencode2/src/features/evidence/diagnostics.ts`                           | `b0d8b3b2093f3adbefb7b0fd528861889d838c7e` |
| `apps/plugin/opencode2/src/features/evidence/domain.ts`                                | `9678f82c8607fc6b4390e35a964b1016361aa4a5` |
| `apps/plugin/opencode2/src/features/evidence/identity.ts`                              | `0ba70899970e831001a92490412814316a228fbf` |
| `apps/plugin/opencode2/src/features/evidence/index.ts`                                 | `c28a18a6486dd77b2b8927b9b82abef771af49ef` |
| `apps/plugin/opencode2/src/features/evidence/ingest.ts`                                | `7629885530aa63bfd100f516b0ccc9f00b33fd30` |
| `apps/plugin/opencode2/src/features/evidence/query.ts`                                 | `e3e8a6404b3877b78f88be18a1f8d95100c89ba3` |
| `apps/plugin/opencode2/src/features/evidence/reconciliation.ts`                        | `134c440bcbb9e184686a4edb11c8d178e9d6d5d8` |
| `apps/plugin/opencode2/docs/architecture/current-state.md`                             | `b42222b7fbe644a939a73a197ba2cff9adb7c751` |
| `apps/plugin/opencode2/docs/decisions/0012-ledger-native-product.md`                   | `b465ab164366db9332b2683095e23f3f654b3d79` |
| `apps/plugin/opencode2/docs/decisions/0014-release-candidate-authority-and-fencing.md` | `4029379ca177f52ac60d749f0090dce319743fdb` |
| `apps/plugin/opencode2/docs/decisions/0024-durable-ledger-v2-and-capture-authority.md` | `58d521126dd808259b138649db0635876a2e916a` |
| `apps/runtime/docs/decisions/0041-unified-retrieval-memory-evidence-substrate.md`      | `5cf0b43438af397bea79814dd1aeb1c6bb4e2bb6` |
| `apps/runtime/docs/decisions/0048-retrieval-migration-topology-and-qualification.md`   | `dae6cf7f8bf56d7311b8f2e6ce61b2f53f125f89` |

If any named source changes before implementation, owners must either prove its
observable facts unchanged and record the new commit in fixture provenance, or
rebaseline under a later ADR. “Close enough” is failure.

### 1.1 Exhaustive baseline symbol/export disposition

Disposition codes are **R** (reimplemented in Rust), **O** (JavaScript
black-box oracle or type/shape input only), and **X** (explicitly excluded).
Every defining export at the pinned blobs is listed below. Reexports from a
feature `index.ts` inherit the defining symbol's disposition. For **R**, vectors
must compare exact success or diagnostic envelopes. For **O**, vectors must be
consumed only by the JavaScript oracle or as fixture shapes and no native
operation may expose the symbol. For **X**, one closed-operation vector per row
must return `PARITY_OPERATION_UNSUPPORTED` at `/operation`; no silent no-op is
allowed.

| Ledger source                    | Export/symbols                                                                                                                                                                                                                                                                                                                                              | Disposition | Required vectors/diagnostics                                                                                                                                                               |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `core/canonical/index.ts`        | internal `canonicalize`; `canonicalJSON`; `digestCanonical`                                                                                                                                                                                                                                                                                                 | **R**       | Every §2.1 vector; exact canonical success/undefined and digest success/failure envelopes                                                                                                  |
| `core/diagnostics/diagnostic.ts` | `Diagnostic`; `DiagnosticError`                                                                                                                                                                                                                                                                                                                             | **O**       | Exact `code`/optional `path` normalization from baseline errors; never a Rust public class                                                                                                 |
| `ledger/domain.ts`               | `LEDGER_ENTITY_TYPES`; `LedgerEntityType`; `LedgerEntity`; `decodeLedgerEntity`                                                                                                                                                                                                                                                                             | **R**       | All 14 valid entities, every missing/extra/type edge, and §2.2 precedence                                                                                                                  |
| `ledger/domain.ts`               | `replayLedgerEvents`                                                                                                                                                                                                                                                                                                                                        | **R**       | Empty/single/multiple chains, overwrite, each replay failure, entity-data decode                                                                                                           |
| `ledger/domain.ts`               | `CapabilityDelta`; `applyCapabilityDelta`; `explainDependencies`; `validateProposal`; `explainReadiness`                                                                                                                                                                                                                                                    | **X**       | One rejected operation per callable family; no delta, proposal, dependency, or readiness implementation                                                                                    |
| `ledger/archive.ts`              | `ArchiveBundleInput`; `ArchiveFaultBoundary`; `createArchiveTransaction`                                                                                                                                                                                                                                                                                    | **X**       | Archive operation rejected with `PARITY_OPERATION_UNSUPPORTED`; no files touched                                                                                                           |
| `ledger/index.ts`                | `ActorKind`; `Actor`; `Rigor`; `IntentInput`; `Criterion`; `WorkItem`; `EvidenceKind`; `EvidenceInput`; `LedgerEvent`                                                                                                                                                                                                                                       | **O**       | Valid/invalid decoder and reducer fixtures only; no native type/API export                                                                                                                 |
| `ledger/index.ts`                | `decodeLedgerEvent`                                                                                                                                                                                                                                                                                                                                         | **R**       | Exact-key/scalar/actor vectors and §2.3 precedence                                                                                                                                         |
| `ledger/index.ts`                | internal `emptyView`; internal `reduce`                                                                                                                                                                                                                                                                                                                     | **R**       | Every transition and reducer mutation in §5 through normalized inspector/replay output                                                                                                     |
| `ledger/index.ts`                | `Ledger.snapshot` and internal read-only `view` semantics                                                                                                                                                                                                                                                                                                   | **O/R**     | Baseline oracle only; Rust reimplements only §2.5 inspection, never the class/open behavior                                                                                                |
| `ledger/index.ts`                | `Ledger`; `Ledger.open`; internal `append`/`appendClaimCAS`; `contextProjection`; `captureIntent`; `frameIntent`; `activateIntent`; `proposeWork`; `claimReady`; `requireClaim`; `releaseClaim`; `submitEvidence`; `recordFact`; `recordCaptureGap`; `resolveCaptureGap`; `proposeResolution`; `requestApproval`; `confirmApproval`; `reconcile`; `archive` | **X**       | Each public method name is absent from protocol; representative read, lifecycle, claim, evidence, approval, reconcile, and archive requests reject at `/operation` before input/path reads |
| `ledger/index.ts`                | `ledgerFeature`                                                                                                                                                                                                                                                                                                                                             | **X**       | Composition request rejects; package/plugin manifests remain byte-unchanged                                                                                                                |
| `ledger/index.ts` reexports      | `LEDGER_ENTITY_TYPES`; `applyCapabilityDelta`; `decodeLedgerEntity`; `explainDependencies`; `explainReadiness`; `replayLedgerEvents`; `validateProposal`; `CapabilityDelta`; `LedgerEntity`; `LedgerEntityType`; `createArchiveTransaction`; `ArchiveBundleInput`; `ArchiveFaultBoundary`; `digestCanonical`; `DiagnosticError`                             | inherited   | No second implementation; defining rows control                                                                                                                                            |

| EventCapture source      | Export/symbols                                                                | Disposition | Required vectors/diagnostics                                                                                                       |
| ------------------------ | ----------------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `hooks/event-capture.ts` | `CaptureInput`; `CaptureGap`; `TrustedCaptureDisposition`; private `Envelope` | **O**       | Snapshot/ingest fixture shapes only; lineage, taint, digest, watermark, and gaps remain observations                               |
| `hooks/event-capture.ts` | `EventCapture.snapshot`; lexical `*.json` listing and `gaps.json` fallback    | **O/R**     | JavaScript snapshot oracle; Rust implements only §2.5 read-only snapshot inspection, parse propagation, ordering, and gap fallback |
| `hooks/event-capture.ts` | `EventCapture`; `open`; `ingest`; private `ingestSerial`; `intake`            | **X**       | Open/ingest/drop/redact requests reject at `/operation`; no lease, directory, envelope, or gap write                               |

| Composition/governance source | Export/symbols                                                                                                                                       | Disposition | Required vectors/diagnostics                                                                                                                                                                                                                                        |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `hooks/open-code-hooks.ts`    | `eventEnvelope`                                                                                                                                      | **O**       | JavaScript-only characterization covers absent/malformed fields, durable/event/data precedence, cancelled-tool defaults, optional lineage, fixed host source/taint, and original payload identity; no native operation exposes it                                   |
| `hooks/open-code-hooks.ts`    | `registerOpenCodeHooks`                                                                                                                              | **X**       | Registration/composition request rejects at `/operation` before context, root, Ledger, EventCapture, loop, subscription, or filesystem access; plugin composition remains byte-unchanged                                                                            |
| `platform/real-host/index.ts` | `PINNED_REAL_HOST_VERSION`; `RealHostCapabilityName`; `RealHostCapabilityCode`; `RealHostCapability`; `RealHostCapabilityReport`; `capabilityReport` | **O**       | JavaScript-only vectors require the exact pinned version, all six pinned-host capabilities disabled with their baseline codes, and all six version-mismatch capabilities disabled with `REAL_HOST_VERSION_PIN_MISMATCH`; no native operation or capability widening |
| `plugin/plugin.ts`            | `default plugin export`                                                                                                                              | **X**       | Default-export/setup/composition request rejects at `/operation`; adapter is absent from Promise/Effect plugin definitions, feature composition, registrations, package exports, assets, and install manifests                                                      |

The development evidence feature is intentionally absent from the package root
and `evidenceFeature.register` is a no-op. Every evidence export is excluded from
Rust; listing the exports prevents “evidence parity” from being misread as
permission to compose this slice.

| Evidence source                   | Complete defining exports                                                                                                                                                                                                   | Disposition      | Required vectors/diagnostics                                                                  |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------- |
| `evidence/anchor.ts`              | `AnchorKind`; `AnchorIntent`; `AnchorHead`; `AnchorRecord`; `ContinuityAnchorPort`; `InMemoryAnchorEmulator`; `readVerifiedAnchor`                                                                                          | **X**            | Anchor/read/append requests reject at `/operation`; no local or external continuity claim     |
| `evidence/configuration.ts`       | `EnvironmentAdapter`; `DevelopmentClaims`; `createDevelopmentBootstrap`                                                                                                                                                     | **X**            | Bootstrap/profile request rejects; environment and secrets are unread                         |
| `evidence/custody.ts`             | `ObjectAad`; `EncryptedEnvelope`; `ObjectReceipt`; `CustodyFaultStage`; `DevelopmentFilesystemCustody`                                                                                                                      | **X**            | Custody/encrypt/read/publish request rejects before path/input; no cryptographic decision     |
| `evidence/development-harness.ts` | `developmentFixture`; `createDevelopmentHarness`                                                                                                                                                                            | **X**            | Harness request rejects; fixture is not imported or promoted                                  |
| `evidence/diagnostics.ts`         | `EvidenceDiagnostic`; `fail`                                                                                                                                                                                                | **X**            | No evidence diagnostic namespace is exposed by Rust                                           |
| `evidence/domain.ts`              | `ASSERTION_STATES`; `RELATIONSHIP_TYPES`; `AssertionState`; `RelationshipType`; `Lifecycle`; `Relationship`; `LayeredIdentities`; `decodeLifecycle`; `decodeLayeredIdentities`; `decodeRelationship`; `assertionTransition` | **X**            | Every decoder/transition family rejects at `/operation`; no v2/domain activation              |
| `evidence/identity.ts`            | `bytesDigest`; `createIdentity`; `createSpanIdentity`; `ExtractedSpan`; `deterministicExtract`; `lexicalTokens`                                                                                                             | **X**            | Identity/extract/token requests reject; legacy canonical digest is not a new identity profile |
| `evidence/ingest.ts`              | `IngestState`; `IngestFault`; `EligibilityOperation`; `FixtureIngest`; `IngestRecord`; `TransactionalAuthorityPort`; `InMemoryTransactionalAuthority`; `verifyIngestAnchor`; `SynchronousIngest`; `isEligibleRecord`        | **X**            | Prepare/commit/eligibility/verify requests reject; no transactional or eligibility authority  |
| `evidence/query.ts`               | `InMemoryLexicalProjection`; `QueryRequest`; `QueryResponse`; `createQuery`; `createExactQuery`                                                                                                                             | **X**            | Query/projection requests reject; no retrieval or serving surface                             |
| `evidence/reconciliation.ts`      | `ReconciliationFinding`; `BlockingReconciler`                                                                                                                                                                               | **X**            | Reconcile request rejects; no repair or promotion                                             |
| `evidence/index.ts`               | `evidenceFeature` and all reexports of the preceding evidence symbols                                                                                                                                                       | **X**, inherited | Composition request rejects; feature remains uncomposed and absent from package exports       |

`platform/persistence/atomic-store.ts` exports `LeaseToken`, `JSONDecoder`,
`acquireLease`, `assertLease`, `releaseLease`, `atomicWrite`, `writeObservation`,
`writeLeasedRecord`, `withLease`, `readJSON`, and `listJSON`. All are **X**: Rust
must not wrap or reproduce them. Inspector ordering is independently read-only;
every persistence/lease/write/read-repair operation request rejects at
`/operation`, and side-effect gates prove no call path reaches these exports.

## 2. Complete semantic inventory

### 2.1 Canonical bytes and digest

For the existing JavaScript value domain, recursively preserve array order;
enumerate own enumerable string-keyed object entries; omit object properties
whose value is `undefined`; order retained keys by JavaScript `localeCompare`;
and recurse into retained values. Then apply `JSON.stringify` with no replacer or
spacing. `digestCanonical` is lowercase SHA-256 over those UTF-8 bytes prefixed
by `sha256:`.

Required canonical vectors and exact baseline outcomes are:

| Input class                 | Required cases                                                                                                                                                                   | Exact baseline outcome                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| primitives                  | `null`, both booleans, empty/ASCII/control strings                                                                                                                               | Ordinary `JSON.stringify` bytes                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| top-level non-JSON values   | `undefined`, function, symbol                                                                                                                                                    | `canonicalJSON` returns JavaScript `undefined`; `digestCanonical` fails because `Hash.update` receives `undefined`; adapter envelopes use `PARITY_CANONICAL_RESULT_UNDEFINED` and `PARITY_CANONICAL_DIGEST_FAILED` as specified in §3                                                                                                                                                                                                                                                                 |
| object non-JSON members     | undefined, function, symbol values in first/middle/last insertion positions, plus an own symbol-keyed property                                                                   | Undefined is removed by `canonicalize`; function/symbol values survive that pass but are omitted by `JSON.stringify`; `Object.entries` ignores the symbol-keyed property; enclosing object remains valid                                                                                                                                                                                                                                                                                              |
| arrays                      | explicit undefined, function, symbol, and sparse holes at first/middle/last positions, including consecutive/trailing holes                                                      | Length and positions are preserved and each becomes JSON `null`; `[,,]` is `[null,null]`                                                                                                                                                                                                                                                                                                                                                                                                              |
| exceptional values          | BigInt and direct/indirect cycles                                                                                                                                                | Closed tagged input is accepted by framing, then canonicalization returns `PARITY_CANONICALIZATION_FAILED`; no bytes or digest                                                                                                                                                                                                                                                                                                                                                                        |
| zero/finite boundaries      | `0`, `-0`, `Number.MIN_VALUE` (`5e-324`), smallest normal (`2.2250738585072014e-308`), `Number.MAX_VALUE` (`1.7976931348623157e+308`)                                            | `-0` serializes exactly as `0`; all others match baseline bytes                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| decimal/exponent boundaries | `1e-7`, `1e-6`, `1e20`, `1e21`, their negatives                                                                                                                                  | Exactly `1e-7`, `0.000001`, `100000000000000000000`, `1e+21` and sign-prefixed counterparts                                                                                                                                                                                                                                                                                                                                                                                                           |
| rounding doubles            | bit patterns for `0.1`, `0.2`, the result of `0.1 + 0.2`, `9007199254740991`, and `9007199254740992`                                                                             | Exact baseline renderings, including `0.30000000000000004`; no decimal parser round-trip may choose another value                                                                                                                                                                                                                                                                                                                                                                                     |
| non-finite numbers          | NaN, positive infinity, negative infinity at top level, object value, and array element                                                                                          | Each serializes as JSON `null`                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Unicode values              | U+0000/control escapes, U+00E9, `e` + U+0301, astral U+1F600, lone high U+D800 and low U+DC00 surrogates                                                                         | No normalization; combining/precomposed forms remain distinct; lone surrogates use baseline JSON escaping                                                                                                                                                                                                                                                                                                                                                                                             |
| key ordering                | ASCII case/punctuation/digits; precomposed vs combining; `ä`/`z`, `å`/`ä`, `ß`/`ss`, Turkish `I`/`i`/`İ`/`ı`, and astral/BMP/lone-surrogate pairs, each in every insertion order | Pinned observed output orders include `0,_,-,a,A` because `Object.fromEntries`/`JSON.stringify` re-enumerates array-index keys before the locale-sorted non-index keys; `ä,z`; `å,ä`; `ss,ß`; `i,I,İ,ı`; `😀,z,U+E000`; and `a` before either lone surrogate. Under the pinned environment `é`.localeCompare(`é`) is `0`, so stable sort preserves their insertion order rather than minting one normalized order. Exact envelopes are fixed; unsupported host collation blocks rather than reblesses |
| nesting                     | empty/deep mixed objects and arrays, duplicate semantic values, all key permutations                                                                                             | Recursive exact bytes with array order retained and object keys collated                                                                                                                                                                                                                                                                                                                                                                                                                              |

Every canonical case has two exact response envelopes: `canonicalize` and
`digest`. Success includes canonical UTF-8 bytes as base64 plus their byte length;
digest success additionally includes the exact `sha256:` text. Undefined and
failure envelopes contain neither bytes nor digest. Goldens preserve JavaScript
escaping and number rendering. No Unicode normalization, key pre-sort, numeric
reinterpretation, or error-message matching is allowed.

Persisted legacy JSON is the portable input subset. JavaScript-only values are
oracle characterization vectors; Rust represents them only through the private
adapter's tagged test protocol. For this v1 tranche, Rust collation acceptance is
closed to the enumerated key-ordering vectors in the table above and their
insertion-order permutations; it must not claim general `localeCompare`
compatibility. Objects with two or more retained keys reject with
`PARITY_COLLATION_UNSUPPORTED` at `/input/value` unless every key is an array
index, an enumerated collation key, or a pinned Ledger/EventCapture/evidence key;
single-key objects require no comparison. Host-sensitive key collation is never guessed:
the fixed golden records baseline bytes, while a live differential run records
the oracle environment and requires exact agreement. A future host disagreement
is a blocked unsupported-baseline result, not permission to mint new bytes.

### 2.2 Closed Ledger entity decoder

`schemaVersion` must be exactly `1`; `entityType` must be one of `intent`,
`capability`, `criterion`, `scenario`, `work`, `dependency`, `claim`, `evidence`,
`fact`, `resolution`, `approval`, `capture-gap`, `audit`, or `archive`. For each
type, the exact field list and optional `evidence.expiresAt` behavior come from
the baseline `keys` table. Unknown keys and missing required keys reject.

Parity preserves the current validation depth: non-empty `id`; nonnegative
integer `revision`, `intentRevision`, claim `fenceEpoch`, and capture-gap bounds;
string arrays for the eight baseline array fields; fact authority exactly
`none`; and closed evidence-producer/audit-actor keys with non-empty `kind` and
`sessionID`. Fields not further type-checked by the baseline are not silently
strengthened in this profile. Returned records are shallowly immutable only.

Failure precedence is: non-object/array input; unsupported version; invalid
entity type; first unknown top-level key in JavaScript enumeration order; first
missing key in the type's declared order; `id`; numeric checks; capture-gap
ordering; array checks in declared loop order; fact authority; nested actor
shape; first nested unknown key; actor `kind`; actor `sessionID`. Diagnostic
code and path must match exactly, including the baseline's bare
`schemaVersion` path for unsupported entity versions.

### 2.3 Closed Ledger event decoder

The exact top-level keys are `schemaVersion`, `id`, `sequence`, `aggregate`,
`type`, `at`, `actor`, `data`, `previousDigest`, and `digest`; actor keys are
`kind`, `sessionID`, and optional `correlationID`. Preserve baseline validation,
including its limited scalar checks and lack of diagnostic path. Do not add
format, actor-kind, integer, non-empty, data-shape, digest-shape, or date checks.

Failure precedence is: non-record; unsupported version; first unknown top-level
key; actor non-record; first unknown actor key; then the combined scalar-type
check. Codes are exactly `LEDGER_VERSION_UNSUPPORTED` or
`LEDGER_SCHEMA_INVALID` with no path.

### 2.4 Pure replay and reducer views

Replay starts at sequence `0` and digest `GENESIS`. For each input at zero-based
index `i`, precedence is unsupported schema version, sequence not `i + 1`, wrong
`previousDigest`, canonical digest computation, supplied digest mismatch, then
entity decoding when both `data.entityType` and `data.id` are truthy. It returns
the final digest, frozen event sequence, and a map keyed
`<entityType>:<id>` where later events replace earlier entities.

The Ledger view reducer starts with empty intent/work/claim/approval/resolution/
fact/capture-gap maps, empty evidence, sequence `0`, and `GENESIS`. Preserve
these recognized transitions and ignore all other event types while still
advancing sequence/digest:

- `intent.captured`, `.framed`, `.activated`, `.reconciled`, and `.archived`;
- `work.proposed`; `claim.acquired` and `.released`;
- `evidence.submitted`; `fact.recorded`;
- `capture-gap.recorded` and `.resolved`;
- `approval.requested` and `.confirmed`; and `resolution.proposed`.

Missing referenced state causes the same no-op as JavaScript. Maps overwrite by
their current keys, evidence appends, claim release defaults `releasedAt` to the
event time, fact output contains the same observable shallow-copied top-level
data, and resolution stores the event actor. Output comparison uses a specified
sorted JSON projection because JavaScript Map and Rust map iteration are not an
authority-bearing serialization contract. JavaScript object identity/freeze is
qualified separately in §5 and is not part of cross-language envelope equality.

### 2.5 Read-only legacy inspector

The inspector accepts only an explicit copied qualification root and never calls
`Ledger.open`. For Ledger it must validate the root `schema-version` before
listing or reading `events`:

1. absent `schema-version` returns `LEDGER_SCHEMA_VERSION_MISSING` at
   `schema-version`;
2. a symlink is rejected by `PARITY_SYMLINK_FORBIDDEN`; any other non-regular
   kind is `PARITY_FILESYSTEM_KIND_INVALID`, both at `schema-version`;
3. unreadable bytes return `PARITY_FILESYSTEM_READ_FAILED` at `schema-version`;
4. invalid UTF-8, empty trimmed text, or trimmed text outside ASCII decimal
   `[0-9]+` returns `LEDGER_SCHEMA_VERSION_INVALID` at `schema-version`;
5. well-formed trimmed decimal text other than exactly `1` returns
   `LEDGER_VERSION_UNSUPPORTED` at `schema-version`; and
6. only trimmed `1` permits event-directory inspection.

Thus missing, malformed, and non-1 versions are distinct and version failure
always precedes missing/malformed `events`, event JSON, decode, chain, or digest
failure. A missing `events` directory preserves baseline `listJSON` behavior as
an empty event list; a present symlink or non-directory rejects with the matching
path/filesystem diagnostic. For each lexically sorted regular `*.json`, parse and
decode exceptions map to `LEDGER_CORRUPT` with `events/<filename>`. Sequence,
previous digest, then canonical digest are checked in that order; a mismatch is
`LEDGER_REPLAY_INVALID` at that same relative path. Non-JSON entries are ignored;
a symlink or non-regular `*.json` rejects before reading it. The inspector reports
the normalized reducer view and inventory; it does not repair, checkpoint,
quarantine, lock, create a version file, or follow discovery paths.

For EventCapture, it reproduces `snapshot`: sorted `events/*.json` are parsed as
opaque envelopes in order; `gaps.json` is parsed when possible and otherwise
normalizes to `[]`. It does not infer payload bytes, validate content captures,
resolve gaps, or ingest. Event identity, aggregate/sequence, lineage fields,
taint, payload digest, plugin/host version, and watermark remain observation
metadata only. EventCapture v1 has no baseline `schema-version` file; the adapter
must not invent or write one. Its v1 selection comes only from the closed
`inspectEventCapture` operation and the pinned `capture/v1` fixture profile.
Malformed event JSON is normalized to `CAPTURE_CORRUPT` at
`events/<filename>`; malformed/missing `gaps.json` remains the baseline `[]`
fallback. Symlink/non-regular checks still precede content parsing.

Symlinks, special files, roots outside the verifier-created fixture copy, live
`.opencode` roots, and any requested write operation reject before content read.
Diagnostics expose only normalized fixture-relative slash-separated paths.

### 2.6 Authority surfaces inventoried but not reimplemented

Completeness does not mean permission to copy mutators. Current Ledger append,
checkpoint, lease/fence, claim, approval, reconcile, archive, context-injection,
and lifecycle command behavior remains TypeScript-only. In particular, current
authority checks that precede `PERSISTENCE_AUTOMATION_UNSUPPORTED` remain in
their present order; Rust does not offer corresponding commands.

EventCapture ingestion remains TypeScript-only: `drop` returns without storage;
`redact` hashes a null payload; intake is process-serialized and then leased;
empty IDs/aggregates and unsafe sequences reject; duplicate means equal payload
digest/type/aggregate/sequence for an existing ID; changed reuse or duplicate
aggregate sequence collides; forward jumps add gaps; late arrivals split gaps
and report reordered; envelopes omit payload bytes and default taint to
`untrusted-source`. This inventory constrains fixture interpretation only. Rust
must not ingest, close a gap, or publish an observation.

Ledger evidence metadata remains authoritative only through Ledger entities and
views. The parity reducer may reproduce existing evidence records and references
but does not validate evidence truth, read custody objects, change eligibility,
or implement the uncomposed, non-authoritative development evidence slice. Facts
whose authority is `none`, EventCapture payload digests, development-slice
records, and replay success never become validated memory through parity.

## 3. Private adapter protocol

The adapter is a single-request, single-response NDJSON process. It reads at
most 1,048,576 bytes from stdin, requires exactly one UTF-8 JSON line terminated
by `\n`, then requires EOF. NUL, CR framing, a missing newline, a blank line, a
second line, or trailing bytes is invalid. It emits exactly one compact UTF-8
JSON line plus `\n` on stdout and nothing on stderr for a handled request. It
performs no writes and has no network calls.

The request has exactly these keys in this order:

```json
{
  "protocolVersion": 1,
  "requestId": "case-id",
  "operation": "canonicalize",
  "input": {}
}
```

`protocolVersion` is integer `1`. `requestId` is 1–64 ASCII bytes matching
`[A-Za-z0-9._:-]+`. `operation` is exactly one of `canonicalize`, `digest`,
`decodeLedgerEntity`, `decodeLedgerEvent`, `replayLedgerEvents`,
`inspectLedger`, or `inspectEventCapture`. Unknown or extra request/input/tagged
keys reject.

`canonicalize` and `digest` input is exactly `{ "value": TaggedValue }`.
`TaggedValue` is closed to: `{"kind":"json","value":<JSON>}`;
`{"kind":"undefined"}`; `{"kind":"function"}`;
`{"kind":"symbol"}`; `{"kind":"bigint","decimal":"<signed decimal>"}`;
`{"kind":"f64","bits":"<16 lowercase hex>"}`;
`{"kind":"array","items":[TaggedValue|{"kind":"hole"},...]}`;
`{"kind":"object","entries":[{"key":"...","value":TaggedValue},...]}`;
`{"kind":"objectWithSymbolKey","entries":[{"key":"...","value":TaggedValue}],"symbolValue":TaggedValue}`;
and `{"kind":"cycle","shape":"direct"|"indirect"}`. Duplicate object keys,
invalid f64 bits/BigInt decimal, a hole outside an array, depth over 64, more than
65,536 nodes, a string/key over 65,536 UTF-8 bytes, or an array/object over 8,192
members returns `PARITY_LIMIT_EXCEEDED` or `PARITY_INPUT_SCHEMA_INVALID` at the
first offending JSON Pointer.

Decoder input is exactly `{ "value": <JSON> }`; replay input is exactly
`{ "events": [<JSON>...] }`, bounded to 4,096 events. Inspector input is exactly
`{ "root": "<relative path>" }`. The verifier sets one absolute
`CURIOSITY_PARITY_FIXTURE_ROOT`; `root` must be a normalized, non-empty relative
slash path beneath it, with no `.`, `..`, empty, backslash, or NUL component. Any
`.opencode` component returns `PARITY_LIVE_ROOT_FORBIDDEN`. A missing,
non-absolute, inaccessible, or `.opencode`-contained configured fixture root
returns `PARITY_FIXTURE_ROOT_UNAVAILABLE` without exposing its value. Each
component is checked without following symlinks. Each inspected file is bounded
to 262,144 bytes and the complete inventory to 4,096 entries/16,777,216 bytes.
Limit failure reads no later entry.

Success and failure envelopes have exactly these shapes and key order:

```json
{"protocolVersion":1,"requestId":"case-id","status":"ok","result":{}}
{"protocolVersion":1,"requestId":"case-id","status":"error","diagnostic":{"code":"CODE","path":null}}
```

Before a valid request ID is available, failure uses `"requestId":null`.
`path` is always present: JSON Pointer for protocol/input failures, baseline
dotted/index path for decoder/replay failures, fixture-relative slash path for
inspection, or `null` where the baseline diagnostic has no path. Canonical
success result is exactly
`{"bytesBase64":"...","byteLength":0}`; digest success is exactly
`{"bytesBase64":"...","byteLength":0,"digest":"sha256:..."}`. Decoder,
replay, and inspector results are exactly:

```json
{"value":{}}
{"digest":"sha256:...","events":[],"entities":[{"key":"type:id","value":{}}]}
{"kind":"ledger-v1","schemaVersion":1,"inventory":[{"path":"events/name.json","size":0,"sha256":"sha256:..."}],"sequence":0,"digest":"GENESIS","view":{"intents":[],"work":[],"claims":[],"evidence":[],"approvals":[],"resolutions":[],"facts":[],"captureGaps":[]}}
{"kind":"event-capture-v1","inventory":[{"path":"events/name.json","size":0,"sha256":"sha256:..."}],"events":[],"gaps":[]}
```

The decoder `value` is the baseline shallow result. Replay entity entries and
each map-derived view array are sorted by string key; evidence and captured
events retain input/file order. Map entries use
`{"key":"...","value":<JSON>}`. Inventory is sorted by relative path, includes
regular files actually read (including `schema-version`/`gaps.json` where
applicable), and excludes host-dependent modes/times/inodes. These schemas and
all nested result keys are closed; no host path, timestamp not already in source
data, generated UUID, stack, exception text, secret, or Rust/Node implementation
detail is emitted.

Total failure precedence is:

1. `PARITY_INPUT_TOO_LARGE` (`path:null`);
2. `PARITY_FRAME_INVALID` (`path:null`);
3. `PARITY_UTF8_INVALID` (`path:null`);
4. `PARITY_JSON_INVALID` (`path:null`);
5. `PARITY_PROTOCOL_SCHEMA_INVALID` at the first missing/extra/wrong-type request
   field in declared key order;
6. `PARITY_PROTOCOL_VERSION_UNSUPPORTED` at `/protocolVersion`;
7. `PARITY_REQUEST_ID_INVALID` at `/requestId`;
8. `PARITY_OPERATION_UNSUPPORTED` at `/operation`;
9. `PARITY_INPUT_SCHEMA_INVALID` or `PARITY_LIMIT_EXCEEDED` at the first
   operation-input violation;
10. for inspectors, `PARITY_FIXTURE_ROOT_UNAVAILABLE`, then
    `PARITY_PATH_INVALID`, `PARITY_LIVE_ROOT_FORBIDDEN`, `PARITY_ROOT_MISSING`,
    root/component `PARITY_SYMLINK_FORBIDDEN`, root
    `PARITY_FILESYSTEM_KIND_INVALID`, and `PARITY_FILESYSTEM_READ_FAILED`;
11. for Ledger inspection, the six schema-version outcomes in §2.5, then events
    directory kind, sorted event-entry kind, `LEDGER_CORRUPT`, and
    `LEDGER_REPLAY_INVALID` in sequence/previous/digest order;
12. for EventCapture inspection, events directory/entry kind, then
    `CAPTURE_CORRUPT`; `gaps.json` absence/parse failure is successful `[]`;
13. for non-inspector operations, canonical tagged-value realization, baseline
    decode/replay precedence, then `PARITY_OUTPUT_TOO_LARGE` (`path:null`) if the
    one response would exceed 4,194,304 bytes.

Inspector diagnostic paths are closed: fixture-root configuration failure is
`null`; request path syntax/live-root rejection is `/input/root`; a missing or
invalid requested root uses that normalized requested relative root; and every
descendant filesystem/schema/event failure uses its slash-separated path
relative to that requested root (`schema-version`, `events`,
`events/<filename>`, or `gaps.json`). Standalone entity/replay diagnostics retain
the baseline dotted/index paths; standalone event-decoder diagnostics retain
`null`. No operating-system error text or absolute path may replace these paths.

Top-level undefined/function/symbol canonicalization returns the error
`PARITY_CANONICAL_RESULT_UNDEFINED` at `/input/value`; digest of any such value
returns `PARITY_CANONICAL_DIGEST_FAILED` there. BigInt/cycle canonicalization or
digest returns `PARITY_CANONICALIZATION_FAILED` there. These stable adapter
diagnostics normalize baseline exception classes only; they do not change
legacy bytes. Panic, output overflow, or otherwise unclassified internal failure
returns `PARITY_INTERNAL_FAILURE` with `path:null`, no partial result, and a
nonzero process exit after the one response. Every other handled envelope exits
zero.

## 4. Determinism, provenance, and independent oracle

Each fixture manifest records schema version, fixture ID, purpose, rights/source
(`project-authored`), source commit, exact source file blob IDs, generator
command when applicable, Node/Bun/ICU/platform observations, input digest,
expected output digest, and whether it is hand-authored or oracle-captured.
Hand-authored invalid vectors are never regenerated. Updating a golden requires
human diff review and an explicit baseline change; Rust cannot bless it.

The JavaScript oracle imports only the built baseline JavaScript modules and
serializes observations. It neither imports Rust nor shares generated decoder,
canonicalizer, reducer, diagnostic, or fixture-expectation code. The verifier
feeds identical inputs separately to that oracle and to the private native
adapter, then compares exact bytes or normalized result envelopes.

Time, UUID, and temp roots are injected fixture values. Directory creation order
is permuted while lexical file names remain fixed. Absolute paths, process IDs,
temp prefixes, and platform separators are normalized before comparison.
Canonical bytes and digests are never normalized. Differential cases run in at
least two input orders and twice in fresh processes.

## 5. Mutation and no-side-effect proof

With only the pinned optional `ryu-js = 1.0.3` formatting dependency authorized
for the non-default parity feature, the verifier must run isolated source mutants or
equivalent compile-time test variants. Canonical/decoder/inspector mutants must
individually perturb key sorting, undefined omission, array holes, numeric and
Unicode boundaries, version rejection, unknown-key rejection,
sequence-before-previous-before-digest precedence, digest verification,
entity-data decoding, Ledger schema-version-before-events, EventCapture sorting,
gap fallback, path/symlink policy, and write prohibition.

Reducer mutation is exhaustive rather than family-sampled. One independently
reported mutant and killing vector is required for each transition:

1. `intent.captured` insertion/overwrite and forced `captured` lifecycle;
2. `intent.framed` criteria replacement plus `framed` lifecycle;
3. `intent.activated` lifecycle;
4. `intent.reconciled` lifecycle;
5. `intent.archived` lifecycle;
6. `work.proposed` insertion/overwrite;
7. `claim.acquired` insertion/overwrite and forced `released:false`;
8. `claim.released` released flag and `releasedAt = data.releasedAt ?? event.at`;
9. `evidence.submitted` append, preserving duplicates and order;
10. `fact.recorded` insertion/overwrite and all observable shallow-copied
    top-level data;
11. `capture-gap.recorded` insertion/overwrite;
12. `capture-gap.resolved` status change;
13. `approval.requested` insertion/overwrite and forced `confirmed:false`;
14. `approval.confirmed` confirmed flag; and
15. `resolution.proposed` insertion/overwrite plus actor copied from the event.

Separate mutants must cover every referenced-state no-op: absent intent for
`framed`, `activated`, `reconciled`, and `archived`; absent claim for
`claim.released`; absent gap for `capture-gap.resolved`; and absent approval for
`approval.confirmed`. Additional required mutants cover empty-view constants;
map last-write-wins independently for intent, work, claim, fact, gap, approval,
and resolution; evidence append versus overwrite; explicit versus default claim
release time; unknown event type as state no-op; and unconditional sequence and
digest advancement for both recognized no-op and ignored event types.

Every required mutant listed above, including the freeze-removal JavaScript
mutant below, must make at least one unchanged test fail; the report names the
mutant and exact killing vector. For every envelope-observable mutant, the report
also names the mismatched envelope field. `fact.recorded` shallow freeze is the
sole cross-language exception: JavaScript oracle-only characterization must prove
a distinct shallow copy, `Object.isFrozen(value) === true`, rejected or
ineffective top-level add/change/delete attempts, and unchanged nested
identity/non-deep-freeze behavior. The freeze-removal JavaScript mutant is killed
by that immutability characterization, not by envelope comparison.

Rust separately requires an immutability/API-construction test proving a reduced
fact cannot be mutated through any returned replay/inspector API and that later
mutation of construction input cannot change its owned top-level result. This is
a Rust compile/API and ownership check, not JavaScript object-freeze emulation,
not a mutant, not a cross-language result-envelope obligation, and not evidence
of deep immutability. All JSON-observable fact fields, overwrite behavior,
ordering, and digests remain subject to ordinary differential envelopes. Every
required mutant and this separate Rust check must pass their stated oracle;
merely reporting line or branch coverage fails.

Mutation scoring is two-phase. The verifier first copies the unmutated crate into
the exact mutation build environment and runs every designated unchanged killing
test there; no source mutation is attempted unless all baseline runs pass. Each
mutant must then compile successfully before its one designated test runs. A kill
requires that test—not merely another failing test—to emit the pinned
`vector|field` assertion identifier. Compile failures, panics before the pinned
assertion, environment failures, and other assertions are non-kills. Distinct
obligations require distinct source-diff hashes. The verifier writes a
machine-readable receipt under the approved test temp root with the source hash,
diff location, baseline and compile outcomes, designated and observed test,
vector, field, observed assertion, and verdict for every mutant. Scorer
self-tests reject a baseline failure, compile failure, unrelated test failure,
duplicate diff, wrong vector, and wrong field. JavaScript freeze removal and Rust
ownership remain separately scored under their rules above.

Before inspection, the verifier records every fixture-copy relative path, file
kind, mode, size, and SHA-256. It runs the adapter with network denied and write
access denied to the inspected subtree, then records the inventory again. Any
created, removed, renamed, type-changed, mode-changed, size-changed, or
content-changed entry fails. Access-time changes are excluded because reads may
update them; modification/change times are supporting observations, not the
cross-filesystem oracle. The adapter receives no credential or authoritative
root.

## 6. Exact anticipated implementation paths

Only these paths are anticipated for the first implementation tranche:

```text
apps/runtime/native/Cargo.toml
apps/runtime/native/src/legacy_memory/mod.rs
apps/runtime/native/src/legacy_memory/canonical.rs
apps/runtime/native/src/legacy_memory/diagnostic.rs
apps/runtime/native/src/legacy_memory/entity.rs
apps/runtime/native/src/legacy_memory/event.rs
apps/runtime/native/src/legacy_memory/replay.rs
apps/runtime/native/src/legacy_memory/inspector.rs
apps/runtime/native/src/legacy_memory/json.rs
apps/runtime/native/src/legacy_memory/tests.rs
apps/runtime/native/src/bin/legacy_memory_parity_adapter.rs
apps/runtime/fixtures/legacy-memory-parity/v1/README.md
apps/runtime/fixtures/legacy-memory-parity/v1/manifest.json
apps/runtime/fixtures/legacy-memory-parity/v1/canonical-vectors.json
apps/runtime/fixtures/legacy-memory-parity/v1/entity-vectors.json
apps/runtime/fixtures/legacy-memory-parity/v1/event-vectors.json
apps/runtime/fixtures/legacy-memory-parity/v1/replay-vectors.json
apps/runtime/fixtures/legacy-memory-parity/v1/adapter-vectors.json
apps/runtime/fixtures/legacy-memory-parity/v1/inspector-vectors.json
apps/runtime/fixtures/legacy-memory-parity/v1/reducer-mutation-vectors.json
apps/runtime/fixtures/legacy-memory-parity/v1/roots/ledger-valid/schema-version
apps/runtime/fixtures/legacy-memory-parity/v1/roots/ledger-valid/events/000000000001-e1.json
apps/runtime/fixtures/legacy-memory-parity/v1/roots/ledger-invalid/schema-version
apps/runtime/fixtures/legacy-memory-parity/v1/roots/ledger-invalid/events/000000000001-invalid.json
apps/runtime/fixtures/legacy-memory-parity/v1/roots/capture-valid/events/event-e1.json
apps/runtime/fixtures/legacy-memory-parity/v1/roots/capture-valid/gaps.json
apps/plugin/opencode2/tests/fixtures/legacy-memory-js-oracle.mjs
apps/plugin/opencode2/tests/unit/legacy-memory-native-parity.test.mjs
apps/plugin/opencode2/tests/unit/legacy-memory-mutant-scorer.test.mjs
apps/plugin/opencode2/tests/unit/legacy-memory-dependency-receipt.test.mjs
apps/plugin/opencode2/tools/legacy-memory-dependency-receipt.mjs
apps/plugin/opencode2/tools/legacy-memory-mutant-scorer.mjs
apps/plugin/opencode2/tools/verify-legacy-memory-native-parity.mjs
apps/runtime/tests/boundaries.test.ts
apps/runtime/package.json
package.json
```

`Cargo.toml` may add only a non-default `legacy-memory-parity` feature, a private
binary requiring that feature, and this exact dependency receipt:

```toml
legacy-memory-parity = ["dep:ryu-js"]
ryu-js = { version = "=1.0.3", optional = true }
```

The dependency is feature-only: neither `default` nor any existing feature may
include `dep:ryu-js`. Its sole permitted use is ECMAScript-compatible finite-f64
rendering inside the private parity implementation. The crates.io package
receipt is:

```text
name: ryu-js
version: 1.0.3
source: registry+https://github.com/rust-lang/crates.io-index
sha256/checksum: 04d056b875a9d2e6cb9a61d127afee9ac5999b9f87bcb32079d1318e505be714
SPDX license: Apache-2.0 OR BSL-1.0
transitive dependencies: none
```

`Cargo.lock` may add exactly `"ryu-js"` to the
`curiosity-runtime-native` package dependency list and exactly one package entry
matching that receipt. Lockfile format and every other package, version, source,
checksum, dependency edge, and ordering remain baseline-identical. No other
direct, transitive, build, development, or target dependency delta is allowed.

Profile isolation is binary. Compared with commit `12ac2c4`, normalized current
default, `--no-default-features`, and release `--no-default-features` dependency
trees must be byte-identical and must not contain `ryu-js`. The explicit
`--no-default-features --features legacy-memory-parity` tree must differ only by
the one `ryu-js v1.0.3` leaf and its root edge; it may contain no other new or
changed package. A successful default/no-default/release build does not replace
the tree comparison. “Release” here means dependency resolution for the existing
Cargo release profile only; it grants no artifact, distribution, deployment, or
production release authority.

The binary uses a closed, versioned, bounded stdin/stdout test protocol, has no
network or write command, is absent from crate exports and release commands, and
must not be installed. The root and runtime JavaScript package manifests may add
only the private `verify:legacy-memory-parity` script; their dependency, export,
files, binary-install, and publication fields and `bun.lock` must not change.
`boundaries.test.ts` may change only its exact source/feature/effect allowlists
for the paths above. Any additional path or capability requires ADR review.

## 7. Binary gates and exact commands

From repository root, the implementing tranche must pass:

```sh
git diff --check
bunx prettier --check \
  apps/runtime/docs/decisions/0056-rust-native-legacy-memory-parity.md \
  apps/runtime/docs/specifications/legacy-memory-parity-v1.md \
  apps/plugin/opencode2/docs/decisions/0026-rust-native-legacy-memory-parity-companion.md
cargo fmt --manifest-path apps/runtime/native/Cargo.toml --check
cargo clippy --manifest-path apps/runtime/native/Cargo.toml --locked \
  --all-targets --features legacy-memory-parity -- -D warnings
cargo test --manifest-path apps/runtime/native/Cargo.toml --locked \
  --features legacy-memory-parity legacy_memory
node apps/plugin/opencode2/tools/verify-legacy-memory-native-parity.mjs \
  --verify-dependency-receipt
bun run --cwd apps/plugin/opencode2 build
node apps/plugin/opencode2/tools/verify-legacy-memory-native-parity.mjs \
  --verify-baseline-blobs
node apps/plugin/opencode2/tools/verify-legacy-memory-native-parity.mjs
bun run --cwd apps/plugin/opencode2 verify
git diff -- apps/runtime/native/Cargo.toml apps/runtime/native/Cargo.lock \
  apps/runtime/package.json package.json \
  apps/plugin/opencode2/package.json bun.lock
git status --short
```

The verifier command is successful only if goldens, live black-box differential
comparison, precedence cases, fresh-process/permutation runs, all required
mutants, write-denied inspection, before/after inventory, bounded malformed
input, and adapter privacy checks all pass. The dependency-receipt check
independently verifies the exact Cargo declaration, feature edge, lock entry,
archive checksum, SPDX license expression, absence of transitive dependencies,
baseline-identical default/no-default/release trees, the one-leaf explicit parity
tree, unchanged JavaScript dependency sections and `bun.lock`, and absence of
every other dependency delta. The displayed lock/manifest diff is reviewed
against that exact allowlist: the authorized Cargo receipt delta must be present
exactly, while every non-allowlisted manifest/lock delta must be empty.

## 8. Non-goals and future proposal

No authoritative persistence, v2 schema, migration, dual-write, shadow read,
cutover, new canonical profile, production digest, Node-API, SDK/package export,
plugin composition, M2/M6 authority change, cryptographic/anchor choice, serving,
TS deletion, deployment, or release is in v1.

Runtime ADR 0057 and plugin ADR 0027 create the sole narrow exception to the
Node-API and composition wording above: a separate test-only transport plus one
generated, verifier-temp, empty-registration OpenCode beta-17595 test plugin may
load and execute one fixed v1 request. It does not change this protocol or permit
normal plugin composition, package surface, authority, persistence, migration,
M2/M6 change, release, or production use.

Rust authority with a thin Node-API TypeScript SDK is a proposed destination,
not an accepted design. It requires all blockers listed in ADRs 0056, 0026, and
canonical plugin ADR 0024 to close under later decisions.

## References

[Runtime ADR 0056](../decisions/0056-rust-native-legacy-memory-parity.md),
[plugin ADR 0026](../../../plugin/opencode2/docs/decisions/0026-rust-native-legacy-memory-parity-companion.md),
[plugin ADR 0024](../../../plugin/opencode2/docs/decisions/0024-durable-ledger-v2-and-capture-authority.md),
[runtime ADR 0041](../decisions/0041-unified-retrieval-memory-evidence-substrate.md), and
[runtime ADR 0048](../decisions/0048-retrieval-migration-topology-and-qualification.md).
