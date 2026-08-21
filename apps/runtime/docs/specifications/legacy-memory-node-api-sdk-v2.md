# Legacy memory Node-API SDK v2

**Status:** normative private candidate and qualification contract under runtime
ADRs 0058/0059 and plugin ADRs 0028/0029; no candidate or approval is created by
this file

## 1. Incorporation and narrow supersession

Except where this specification says otherwise, every requirement, exact value,
gate, diagnostic, path class, dependency pin, license obligation, platform/host
pin, protocol byte, export, ABI/import restriction, build setting, confinement
rule, regression, authority boundary, and prohibition in
[Node-API SDK v1](legacy-memory-node-api-sdk-v1.md) is incorporated unchanged.

V2 supersedes v1 only as follows:

- the artifact set has five members rather than four;
- the fifth member has a distinct qualification-information schema and execute
  envelope; the original four retain their v1 schema and behavior;
- all five profiles use the settlement gate in §3;
- candidate, per-profile, and Phase C acceptance receipts use schema version 3
  and bind the additional evidence in §6; and
- actual-addon concurrency isolation and controlled shared-core interleaving are
  independent verdicts as specified in §§4–6; and
- Phase A candidate generation and Phase C clean acceptance are separated by
  the Phase B root-user approval handoff.

The exact pins remain Darwin arm64, Bun `1.3.14`, repository-lock-resolved
OpenCode `0.0.0-beta-17595`, Node-API minimum 4, `napi-sys = 3.3.0` with only
`napi4`, and `ryu-js = 1.0.3` only through the shared dispatcher. The exact
five-package third-party closure, license policy, `panic=unwind`,
`MACOSX_DEPLOYMENT_TARGET=15.0`, `-Wl,-dead_strip_dylibs`, sole
`/usr/lib/libSystem.B.dylib`, frozen undefined imports, two JavaScript exports,
1,048,576-byte ceiling, and all v1 ownership/prohibition rules remain unchanged.

## 2. Five closed artifact profiles

The complete set is:

| Profile                  | Exclusive cfg                          | Execute surface                      |
| ------------------------ | -------------------------------------- | ------------------------------------ |
| normal                   | none                                   | exact v1 parity bytes                |
| panic                    | `sdk_probe="panic"`                    | exact v1 panic-probe behavior        |
| allocation failure       | `sdk_probe="allocation_failure"`       | exact v1 allocation-failure behavior |
| queue failure            | `sdk_probe="queue_failure"`            | exact v1 queue-failure behavior      |
| control-flow observation | `sdk_probe="control_flow_observation"` | §4 envelope                          |

Exactly zero cfgs select normal and exactly one mutually exclusive cfg selects a
probe. All five Mach-O files are pairwise SHA-256 unequal. Every profile has
only:

```ts
qualificationInfo(): Uint8Array
execute(request: Uint8Array): Promise<Uint8Array>
```

The first four profiles retain the exact v1 `qualificationInfo` bytes. The fifth
returns one compact UTF-8 JSON line in this exact key order, followed by one LF:

```text
{"schemaVersion":2,"protocol":"legacy-memory-parity-v1","protocolVersion":1,"transport":"node-api-bytes-v1","artifactProfile":"control_flow_observation","executeEnvelope":"header-json LF exact-parity-bytes","counterSchema":"legacy-memory-node-api-control-flow-counters-v1","target":"aarch64-apple-darwin","napiMinimum":4,"napiHostMaximum":<host-maximum>,"napiSys":"3.3.0","ryuJs":"1.0.3"}\n
```

`<host-maximum>` has the exact v1 meaning. No profile may add an export, import,
dependency, dylib, callback role, retained JavaScript value, or global/per-env
mutable state.

## 3. Single-attempt deferred settlement

One private `DeferredSettlement` is created immediately after successful
`napi_create_promise`. Its state is exactly `Unattempted | Attempted`. Its only
claim operation atomically performs `Unattempted -> Attempted`; a claim from
`Attempted` returns `AlreadyAttempted` without calling Node-API. The claim occurs
before either raw settlement call.

All profiles and all paths—including wrong input, over-limit resolution,
allocation failure, queue failure, worker completion, panic mapping, and
completion failure—must call a private settlement adapter. Only that adapter may
call `napi_resolve_deferred` or `napi_reject_deferred`; direct calls elsewhere,
aliases, function-pointer escape, or a second deferred owner fail source and
import-site inspection. There is no fallback raw call.

If the adapter returns failure or panics, the gate remains `Attempted`, state is
reclaimed once, the child records the existing stable closed transport failure,
and no resolve, reject, opposite-kind settlement, or cleanup path retries.
Settlement kind is selected before claim and cannot change after claim.

The private fake-adapter source and vectors define exact modes `succeed`, `fail`,
and `panic`. Phase A binds their source and vector digests but does not execute
them. Phase A static inspection proves there is exactly one raw settlement
invocation site, inside the private adapter, and none elsewhere.

Only Phase C executes the fake-adapter vectors. For all five profiles, each
reachable resolve and reject path is exercised. Every test asserts adapter
admission count `1`, raw-call invocation count at most `1`, gate state
`Attempted`, and no second raw call after simulated failure or contained panic.
A separate deliberate duplicate caller asserts first admission `1`, second
result `AlreadyAttempted`, and raw-call count at most `1`. Promise
resolution/rejection observed by the isolated Bun child is the only evidence of
the host result. Adapter admission is not proof that a raw call ran or that the
host accepted settlement.

## 4. Observation schema and exact counters

The observation artifact is loaded only by a dedicated fresh Bun qualification
child. For every execution that resolves with parity bytes, it returns exactly:

```text
<header-json>\n<exact-parity-response-bytes>
```

The first LF is the sole delimiter. `<exact-parity-response-bytes>` is byte for
byte the result the corresponding normal-artifact request would return,
including its final LF. The header is compact UTF-8 JSON with this exact key
order and no extra keys:

```text
{"schemaVersion":1,"kind":"control_flow_observation","counters":{"inputCopyOperations":1,"inputBytesCopied":<accepted-byte-length>,"asyncWorkCreateAttempts":1,"asyncWorkCreateSuccesses":1,"asyncWorkQueueAttempts":1,"asyncWorkQueueSuccesses":1,"workerCallbackEntries":1,"dispatcherInvocations":1,"completionCallbackEntries":1,"settlementAttempts":1}}
```

Names and order are normative. `inputBytesCopied` is a request-owned integer in
`0..1,048,576`; every other counter is a request-owned integer in `0..1`. All
start at zero and increment at exactly these sites:

| Counter                     | Exact increment semantics                                                                                                                                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `inputCopyOperations`       | add one immediately after the sole complete visible-range copy into Rust-owned memory succeeds                                                                                                                     |
| `inputBytesCopied`          | at that same post-copy point, add exactly the validated visible `byteLength`; zero-length accepted input therefore has one copy operation and zero copied bytes                                                    |
| `asyncWorkCreateAttempts`   | add one immediately before the sole `napi_create_async_work` call                                                                                                                                                  |
| `asyncWorkCreateSuccesses`  | add one only immediately after that call returns success                                                                                                                                                           |
| `asyncWorkQueueAttempts`    | add one immediately before the sole `napi_queue_async_work` call                                                                                                                                                   |
| `asyncWorkQueueSuccesses`   | add one only immediately after that call returns success                                                                                                                                                           |
| `workerCallbackEntries`     | add one as the first instruction inside the async worker callback's panic boundary                                                                                                                                 |
| `dispatcherInvocations`     | add one immediately before the sole shared-dispatcher invocation                                                                                                                                                   |
| `completionCallbackEntries` | add one as the first instruction inside the async completion callback's panic boundary                                                                                                                             |
| `settlementAttempts`        | add one only when the private settlement adapter admits the request by atomically claiming `DeferredSettlement` from `Unattempted` to `Attempted`, before envelope construction and before any raw settlement call |

Incrementing at another site, exceeding a bound, changing a counter after header
serialization, or allowing `successes > attempts` fails. A success counter may
be one only when its matching attempt counter is one. A claim made while already
`Attempted` returns `AlreadyAttempted` and does not increment.
`settlementAttempts` is adapter admission only: it is not a raw resolve/reject
counter and proves neither raw-call invocation nor host settlement. No
resolve-kind, reject-kind, raw-call outcome, or host-outcome counter is public.
The adapter accepts a private payload-builder closure so the observation
envelope is constructed after the state-machine claim and `settlementAttempts`
increment but before the possible raw call. The closure cannot escape the
adapter.

The transition and no-retry behavior live in
`src/settlement_core.rs`. Production settlement and the standalone fake-adapter
fixture both compile that exact file; duplicating or reimplementing its gate in
the fixture fails. The Phase C matrix is exactly five profiles by resolve/reject
by raw-adapter success/failure/panic, followed by duplicate admission: 30 first
attempts and 30 duplicates. Phase A may compile the fixture but never executes
it.

For an accepted request of validated visible byte length `N`, where
`0 <= N <= 1,048,576`, the exact vector in header order is:

```text
1,N,1,1,1,1,1,1,1,1
```

For an over-limit request it is:

```text
0,0,0,0,0,0,0,0,0,1
```

The over-limit path reads metadata only, returns the exact v1
`PARITY_INPUT_TOO_LARGE` bytes after the header, and performs no payload read or
copy, async-work creation/queue/worker/dispatcher/completion/delete. At exactly
the limit, normal accepted-flow invariants apply.

Wrong argument type/count and injected transport failures reject and therefore
have no execute envelope. Their counters are asserted through the private test
observer only. Wrong input and the allocation-failure trigger are
`0,0,0,0,0,0,0,0,0,1`. For accepted length `N`, async-work-creation failure is
`1,N,1,0,0,0,0,0,0,1`; queue failure is `1,N,1,1,1,0,0,0,0,1`; and the panic
profile is `1,N,1,1,1,1,1,0,1,1`. The inherited panic trigger is not active in
the observation profile because cfgs are mutually exclusive; panic/failure
profile counters are available only to private native tests and retain exact v1
public behavior.

Each execute owns one counter block from entry through reclamation. It is never
static, global, thread-local, per-environment, shared, pooled, or reused.
Actual observation-addon tests issue 1, 2, 8, and 32 mixed requests with unique
expected paths and require each result to equal its own vector and parity suffix.
Aggregate, inherited, reset, cross-client, and cross-request values fail. A fresh
request always begins with all zeroes. These executions establish request-local
counter and parity-result isolation under host-visible concurrency. They do not
establish a barrier schedule, a prescribed entry/worker/completion order, or
Bun's natural scheduling behavior.

At each width every request has a distinct request ID and byte length. The
observation child checks all ten counters independently for every response,
including that `inputBytesCopied` equals that request's own byte length.
`concurrencyIsolated` is true only from the named width results; it may not be
inferred from profile, child, Promise, output, or lifecycle counts.

Because the envelope differs from normal execute bytes, observation output must
never be compared or cited as direct normal binary parity. Tests separately
strip exactly one validated header line only to check that the remaining bytes
equal the independent oracle; that derived assertion is observation integrity,
not normal-artifact equivalence.

### 4.1 Standalone controlled phase-core fixture

A separate native executable fixture compiles the exact shared phase/counter
core used at the real entry, async-worker, and completion callback call sites.
It is not a Node-API addon, has no JavaScript export, is not an SDK profile, and
is not one of the five artifacts. A copied core, duplicated phase transition, or
test-only counter implementation fails.

The three shared phase functions require an explicit controller parameter. Real
addon callbacks call those exact functions with a zero-sized, zero-state no-op
controller; the fixture calls the same functions with one harness-owned
synchronization controller. No fixture-only `controlled_*` facade or duplicate
transition is permitted. The explicit fixture controller is the sole
shared-state exception in this specification and owns only barrier/order state
and transcript events. It owns and receives no counter block, parity bytes,
request result, settlement state, or result collection. The core and fixture may
use no static, thread-local, per-environment, filesystem, network,
environment-variable, or JavaScript coordination. Command arguments select the
closed test case; standard output carries the final transcript and no other
coordination channel exists.

For each width 1, 2, 8, and 32, Phase C runs these three named schedules, where
`F` is ascending request-ID order, `R` is descending order, and `L1` is `F`
rotated left by one (identical to `F` at width 1):

| Permutation              | entry order | worker order | completion order |
| ------------------------ | ----------- | ------------ | ---------------- |
| `forward-forward`        | `F`         | `F`          | `F`              |
| `forward-reverse`        | `F`         | `R`          | `F`              |
| `reverse-rotate-reverse` | `R`         | `L1`         | `R`              |

The controller uses barriers and one-at-a-time grants to make the selected
phase order deterministic while preserving each request's
entry-before-worker-before-completion causality. Every named schedule is a
separate fixture process. Width-1 schedules remain three distinct cases even
though their request orders coincide.

Only after all request threads have joined and all request-owned snapshots are
immutable may the controller close. It emits exactly one compact JSON line plus
LF with closed top-level key order:

```text
schemaVersion, kind, width, permutation, events, requests, closed
```

`schemaVersion` is `1`, `kind` is `controlled-phase-core-interleaving`, `closed`
is `true`, and `events` contains exactly `3 * width` objects with key order
`sequence, requestId, phase`; `sequence` is contiguous from zero and `phase` is
exactly `entry`, `worker`, or `completion`. `requests` is in ascending request-ID
order and contains exactly `width` objects with key order `requestId,
byteLength, phaseTrace, counterVector, completed`. `phaseTrace` is exactly
`["entry","worker","completion"]`, `counterVector` is that request's exact
ten-value vector, and `completed` is `true`. The controller may serialize these
immutable records passed to `close`, but may not retain or own them. An early,
open, partial, duplicate, additional, malformed, or stderr transcript fails.

The separate `controlledPhaseCoreInterleaving` verdict is true only when all 12
fixture processes match the approval-bound transcript schema, schedule, and
request-local vectors. It proves the exact shared core under the prescribed
fixture schedules; it does not prove Bun used those schedules. It is never
derived from `concurrencyIsolated` or from profile, lifecycle, Promise, or count
summaries. Phase A compiles and inspects this fixture but never executes it;
Phase C alone executes it.

## 5. Isolation and absence

Phase A also compiles, but does not load, the Darwin guard-page Node-API fixture
at `tests/fixtures/guard-page-node-api.c` using the canonical
`guard-page-build-recipe.json`. The fixture has one JavaScript export,
`createGuardedOverLimitView`, and creates 1,048,577-byte `Uint8Array` views at
one- and two-page nonzero offsets over `PROT_NONE` anonymous mappings. Phase C
alone loads it in the ordinary isolated Bun children. Any payload read crashes
the child; metadata-only over-limit handling returns the exact constant response.
Its source, recipe, compiler, artifact, import-list, and export-list digests are
approval-bound.

The verifier copies the observation artifact to a unique approved-temp path and
loads it only in dedicated Bun children after approval/reproduction gates. It is
never supplied to OpenCode, the generated qualification plugin, the test shim's
normal loader path, package/runtime code, or another runtime. The existing
OpenCode probe continues to load the normal artifact only.

Normal-artifact binary/string scanning must find none of these UTF-8 strings:

```text
control_flow_observation
header-json LF exact-parity-bytes
legacy-memory-node-api-control-flow-counters-v1
inputCopyOperations
inputBytesCopied
asyncWorkCreateAttempts
asyncWorkCreateSuccesses
asyncWorkQueueAttempts
asyncWorkQueueSuccesses
workerCallbackEntries
dispatcherInvocations
completionCallbackEntries
settlementAttempts
```

The observation artifact, cfg, receipts, copied path, and markers are absent
from normal plugin/package/release files and are deleted with the qualification
run root. Receipt strings in committed documentation do not violate binary or
package-artifact absence; implementation source may contain them only in the
isolated qualification crate and qualification tests.

The standalone phase fixture, its source/build recipe/executable/transcripts,
synchronization-controller markers, and their digests are likewise absent from
package exports, `files`, assets, `dist`, bundles, provenance, generated OpenCode
plugins, install/release candidates, and every normal runtime path. It may exist
only in the private qualification source and Phase-A/Phase-C temporary roots.

## 6. Schema-v3 receipts

Phase A creates five immutable, approval-bound per-profile receipt files and one
immutable candidate aggregate. Their canonical repository paths are exactly:

| Profile                  | Receipt                                                                                                | Sidecar                                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| normal                   | `apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v2-normal-receipt.json`                   | `apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v2-normal-receipt.sha256`                   |
| panic                    | `apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v2-panic-receipt.json`                    | `apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v2-panic-receipt.sha256`                    |
| allocation failure       | `apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v2-allocation-failure-receipt.json`       | `apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v2-allocation-failure-receipt.sha256`       |
| queue failure            | `apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v2-queue-failure-receipt.json`            | `apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v2-queue-failure-receipt.sha256`            |
| control-flow observation | `apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v2-control-flow-observation-receipt.json` | `apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v2-control-flow-observation-receipt.sha256` |

Each per-profile receipt is closed JSON. Top-level keys occur in exactly this
order, with no additional keys:

```text
schemaVersion, qualification, receiptKind, profile, exclusiveCfg, triggerSha256, artifactSha256, source, schemas, controlFlow, verificationTools, toolPolicy, compiler, environment, imports, loaderClass, staticVerdicts
```

Their values are constrained as follows:

- `schemaVersion` is `3`, `qualification` is
  `legacy-memory-node-api-sdk-v2`, and `receiptKind` is `candidate-profile`;
- `profile` is exactly one of `normal`, `panic`, `allocationFailure`,
  `queueFailure`, or `controlFlowObservation`, in the table's order;
- `exclusiveCfg` is respectively `null`, `sdk_probe="panic"`,
  `sdk_probe="allocation_failure"`, `sdk_probe="queue_failure"`, or
  `sdk_probe="control_flow_observation"`; `triggerSha256` is the inherited exact
  trigger digest or `null` for normal and observation;
- `source` key order is `sourceCommit`, `sourceTreeSha256`, `manifestSha256`,
  `lockfileSha256`, `sharedDispatcherSha256`, `counterSourceSha256`,
  `phaseCounterCoreSha256`,
  `settlementGateSourceSha256`, `settlementAdapterSourceSha256`,
  `settlementCoreSourceSha256`, `fakeAdapterSourceSha256`;
- `schemas` key order is `qualificationInfoSchemaSha256`,
  `executeSchemaSha256`, `paritySchemaSha256`, `observationHeaderSchemaSha256`,
  `envelopeGrammarSha256`; non-applicable observation fields are still present
  and bind the shared reviewed schema bytes rather than using omission;
- `controlFlow` key order is `counterSchema`, `orderedCounterNames`,
  `counterMutationSitesSha256`, `recorderCallSitesSha256`,
  `phaseCoreCallSitesSha256`, `rawSettlementCallSiteSha256`,
  `fakeAdapterVectorsSha256`; `orderedCounterNames` is exactly the ten-name §4
  order;
- `verificationTools` key order is `astScannerVersion`,
  `astScannerSourceSha256`, `astScannerManifestSha256`,
  `astScannerLockfileSha256`, `astScannerDependencyReceiptSha256`,
  `astNormalizationSha256`, `astOutputSha256`,
  `archiveInventoryComparatorSourceSha256`,
  `archiveInventoryComparatorRuleSha256`, `guardSourceSha256`,
  `guardBuildRecipeSha256`, `guardCompilerSha256`, `guardArtifactSha256`,
  `guardImportsSha256`, `guardExportsSha256`,
  `fakeAdapterBuildRecipeSha256`, `fakeAdapterArtifactSha256`,
  `phaseFixtureSourceSha256`, `phaseFixtureBuildRecipeSha256`,
  `phaseFixtureArtifactSha256`, `phaseFixtureTranscriptSchemaSha256`;
- `compiler` key order is `rustcVersion`, `cargoVersion`, `target`, `profile`,
  `panicStrategy`, `rustflags`, `linkerArguments`, `macosDeploymentTarget`;
- `toolPolicy` binds schema version, the closed ordered absolute tool receipts,
  the environment policy, and its canonical policy digest; OpenCode additionally
  binds package path/hash and exact beta-17595 version;
- `environment` is byte-identical to `toolPolicy.environment`; its key order is
  `schemaVersion`, `allowlistedNames`, `normalizedValues`,
  `normalizedNamesSha256`, `normalizedNameValueSha256`, `policySha256`;
- `imports` key order is `abiReceiptSha256`, `undefinedImportsSha256`,
  `symbolClassificationsSha256`, `loadCommandsSha256`, `loadDylibs`, `rpaths`,
  `definedGlobals`, `napiMinimum`, `napiHostMaximum`;
- `loaderClass` is `normal-and-opencode` only for normal,
  `isolated-bun-fault-child` for the three fault profiles, and
  `isolated-bun-observation-child` only for observation; and
- `staticVerdicts` key order is `machOClosure`, `twoExportsOnly`,
  `importsClosed`, `soleRawSettlementCallSiteInAdapter`,
  `counterMutationSitesClosed`, `recorderCallSitesClosed`,
  `phaseCoreCallSitesClosed`, `phaseFixtureStandalone`,
  `phaseFixtureCoordinationClosed`, and `normalObservationStringsAbsent`.
  Values are booleans; the last is required `true` for normal and records `true`
  as a cross-artifact assertion in every other profile receipt.

The separately pinned `syn = 2.0.119` scanner produces three distinct canonical
LF-terminated inventories. The counter-mutation material has exactly ten rows in
the ten-counter order:

```text
<counter-name>\t<repository-relative-source-path>\t<enclosing-symbol>\t<AST-node-digest>
```

Each row identifies the actual field-mutation AST node, not its recorder call
site. Its digest is 64 lowercase hex over exactly
`<scanner-version> LF <normalization-rules> LF <normalized-mutation-node> LF
<normalized-immediate-control-flow-parent> LF`. These ten mutation nodes and
parents are the counter mutation receipt evidence.

The recorder-call-site material is separately bound and has exactly nine rows,
because the single `record_input_copy` call records two counters. Its row grammar
is `<recorder-name>\t<repository-relative-source-path>\t<enclosing-symbol>\t<AST-node-digest>`
in first-use counter order with `record_input_copy` represented once. The digest
uses the same exact grammar but substitutes the normalized recorder method-call
node and its immediate control-flow parent. The scanner independently rejects a
missing, duplicate, extra, aliased, or wrongly enclosing recorder call.

The phase-core call-site material has exactly three rows in `entry`, `worker`,
`completion` order using
`<phase>\t<repository-relative-source-path>\t<enclosing-symbol>\t<AST-node-digest>`.
Its AST digest uses the same grammar over the real callback's normalized call
into the shared phase/counter core and its immediate control-flow parent. It
must not point at fixture call sites.

The raw-settlement inventory retains exactly one canonical row for the adapter's
sole raw invocation site; resolve-versus-reject selection does not create a
second invocation site. Prefix fields used only to route raw scanner output—such
as `mutation`, `recorder`, `phase`, `counter`, or `raw`—are excluded from every
canonical inventory row and digest grammar. Scanner version and normalization
occur inside each AST-node digest exactly once; no redundant scanner prefix or
header is prepended to canonical material. The complete prefixed raw scanner
output remains separately bound by `astOutputSha256`.

Generator, parser, and scanner versions and normalization rules are included in
the source material whose digests are bound. Substring/regular-expression site
acceptance is forbidden. Scanner tests distinguish mutation nodes from recorder
calls and reject missing, duplicate, extra, or aliased mutation, recorder,
phase-core, and raw-settlement sites. Its separate exact closure is `syn
2.0.119`, `quote 1.0.47`, `proc-macro2 1.0.107`, and `unicode-ident 1.0.24`;
those tools never enter the five artifacts or standalone fixture dependency
graphs.

The immutable candidate aggregate paths are exactly:

```text
apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v2-candidate-receipt.json
apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v2-candidate-receipt.sha256
```

Its closed top-level key order is exactly:

```text
schemaVersion, qualification, receiptKind, dependencyReceiptSha256, humanLicenseReceiptSha256, abiReceiptSha256, undefinedImportsSha256, schemas, controlFlow, verificationTools, toolPolicy, profiles, candidateStaticVerdicts
```

`schemaVersion` is `3`; `receiptKind` is `candidate`; `schemas`, `controlFlow`, and `verificationTools`
use the closed key orders above. `profiles` is an array of exactly five objects
in normal, panic, allocation failure, queue failure, observation order. Every
object has exact key order `profile`, `receiptPath`, `receiptSha256`,
`sidecarPath`, `artifactSha256`, and binds the corresponding canonical receipt.
`candidateStaticVerdicts` has exact key order
`allProfileReceiptsClosed`, `allTenArtifactHashPairsUnequal`,
`normalObservationStringsAbsent`, `soleRawSettlementCallSiteInAdapter`,
`counterMutationSitesClosed`, `recorderCallSitesClosed`,
`phaseCoreCallSitesClosed`, `phaseFixtureStandalone`,
`phaseFixtureCoordinationClosed`, `dependencyClosureApproved`,
`abiAndImportsClosed`.
Candidate receipts contain no load, execute, Promise, parity-execution,
concurrency, teardown, or other executable verdict.

Every `.sha256` sidecar inherits v1's exact one-line lowercase digest, two-space,
basename, and LF format. The approval record binds the candidate aggregate path
and digest first, then the five profile receipt path/digest/artifact-digest
triples in the same canonical order. It additionally binds the dependency,
license, ABI, import, schema, control-flow source/site, phase-core/call-site AST,
fixture source/build/artifact/transcript-schema, cfg, compiler, and environment
digests reached by those receipts. Reordering, omission, aliasing a
v1 path, or binding only the aggregate fails approval validation.

All ten unordered artifact-hash pairs must be unequal. The normal artifact's
string-absence verdict binds the exact §5 list and scanner command/version/
digest. These are candidate/static verdicts only.

Only a completely successful Phase C atomically publishes a separate,
non-approval-bearing acceptance receipt at:

```text
$RUN_ROOT/acceptance/legacy-memory-node-api-sdk-v2-acceptance-receipt.json
```

Its closed top-level key order is exactly:

```text
schemaVersion, qualification, receiptKind, candidate, approval, toolPolicy, ambientOpenCode, reproduction, executableVerdicts
```

`receiptKind` is `acceptance`. `candidate` key order is `path`, `sha256` and
references the committed candidate aggregate. `approval` key order is `path`,
`sha256`, `introductionCommit`, `approvalCommitParent` and references the valid
v2 approval. `reproduction` is an array in canonical profile order; each object
has exact key order `profile`, `approvedArtifactSha256`,
`rebuiltArtifactSha256`, `approvedProfileReceiptSha256`,
`rebuiltProfileReceiptSha256`, `artifactMatches`, `profileReceiptMatches`.
`executableVerdicts` key order is `promiseOutcomesObserved`,
`parityBytesMatched`, `counterVectorsMatched`, `concurrencyIsolated`,
`controlledPhaseCoreInterleaving`, `settlementAtMostOnce`,
`adapterFailureNotRetried`, `adapterPanicNotRetried`, `observationBunOnly`,
`openCodeNormalOnly`, `lifecyclePassed`, `confinementPassed`, `packagingAbsent`,
`regressionsPassed`.

The executable verdict values are copied from named recorded gate results, not
literal success constants. Lifecycle records separately name `close-no-work`,
`close-saturation`, `concurrency-limit`, `abrupt-exit`, and
`subsequent-clean-child`; omission or a false result blocks receipt creation.
Neither `concurrencyIsolated` nor `controlledPhaseCoreInterleaving` may be set
from those lifecycle records or from profile/child/result counts. The former is
copied only from the four actual-addon width checks; the latter only from the 12
schema-valid closed fixture transcripts.

The candidate aggregate and acceptance receipt have different schemas and must
not be byte-equal. Phase C must reproduce each artifact and each per-profile
receipt byte for byte against the approval-bound values. The acceptance receipt
records those comparisons and executable results; it never replaces or mutates
candidate evidence and is not itself approval input.

Phase C runs every executable gate and determines every verdict before creating
the successful receipt bytes. After every verdict is known and true, it writes a
mode-`0600` sibling temporary file beneath `$RUN_ROOT/acceptance`, flushes and
closes it, then atomically renames it to the exact acceptance-receipt path. The
destination must previously be absent; replacement is forbidden. Any failed,
missing, indeterminate, timed-out, or panicked gate removes the temporary file
and leaves the successful acceptance-receipt path absent. A failed run may write
a diagnostic beneath `$RUN_ROOT/diagnostics/`, but that file must use a different
basename and `receiptKind: "diagnostic-failure"`; it is temporary run output,
never committed evidence, approval input, or a successful acceptance receipt.

## 7. Two executable phases and approval handoff

### 7.1 Phase A — candidate generation

Phase A starts from clean, absent Cargo home/target/run paths. It may acquire the
already authorized checksum-pinned closure, compile five artifacts and the
standalone phase fixture, and perform static receipt, Mach-O, symbol, import,
string, AST source-site, fixture-boundary, coordination-absence, and license
inspection. It must not run the fixture, load an addon, call an export, invoke
OpenCode, create or modify any approval path, or claim PASS/qualified. Output is
`candidate/not-qualified`.

The complete v2 candidate, schema-v3 receipts, ABI/import/license sidecars, and
all five exact artifact/receipt digests are presented to the root user and then
committed before approval is requested. V1 candidate files may be evidence but
cannot satisfy or be copied as v2 approval.

The proposed committed v2 review material has exactly these paths; Phase A
writes mirrors beneath its proposed-checkin temp root and never writes the
repository paths directly:

```text
apps/runtime/docs/licenses/legacy-memory-node-api-sdk-v2.json
apps/runtime/docs/licenses/legacy-memory-node-api-sdk-v2.md
apps/runtime/docs/licenses/legacy-memory-node-api-sdk-v2.sha256
apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v2-abi.json
apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v2-abi.sha256
apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v2-undefined-imports.txt
apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v2-undefined-imports.sha256
apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v2-normal-receipt.json
apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v2-normal-receipt.sha256
apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v2-panic-receipt.json
apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v2-panic-receipt.sha256
apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v2-allocation-failure-receipt.json
apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v2-allocation-failure-receipt.sha256
apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v2-queue-failure-receipt.json
apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v2-queue-failure-receipt.sha256
apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v2-control-flow-observation-receipt.json
apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v2-control-flow-observation-receipt.sha256
apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v2-candidate-receipt.json
apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v2-candidate-receipt.sha256
```

No v1 receipt, sidecar, or approval path is changed by v2 candidate generation.
The implementation source additionally includes the private
`apps/runtime/native-node-api-qualification-tools/` scanner crate,
the shared phase/counter and settlement cores, the standalone phase fixture and
its build recipe, and the two guard-page fixture files. They are bound through
the receipts above but are not package, release, or runtime artifacts.

### 7.2 Phase B — approval handoff

Only a new explicit root-user statement approving the presented v2 digests may
create:

```text
apps/runtime/docs/approvals/legacy-memory-node-api-sdk-v2-r3.json
```

The existing `apps/runtime/docs/approvals/legacy-memory-node-api-sdk-v2-r2.json`
path is immutable superseded evidence for the locale-sensitive archive-ordering
candidate only. A new approval may create only the r3 path above, and only that
r3 path is current Phase C authority.

The closed r3 approval record has top-level keys in exact order `schemaVersion`,
`qualification`, `decision`, `approvalPath`, `candidate`, `profiles`,
`approvedReviewSet`, `dependencyPolicy`,
`schemas`, `controlFlow`, `verificationTools`, `toolPolicy`, `compilerPolicy`,
`environmentPolicy`, `importPolicy`, `supersededApproval`, `approval`. `schemaVersion` is `3`, qualification is
`legacy-memory-node-api-sdk-v2`, and decision is
`approve-candidate-for-clean-acceptance`. `candidate` binds path then SHA-256 of
the aggregate. `profiles` binds the five profile receipt path, receipt SHA-256,
and artifact SHA-256 triples in canonical order. `approvedReviewSet` contains
exactly the 19 paths in §7.1 order as closed `path`, `sha256` objects. The policy objects bind the
exact §6 dependency, license, schema, counter source/site, settlement source,
phase-core/call-site AST, phase-fixture source/build/artifact/transcript schema,
cfg, compiler, environment, ABI, and import digests. `approval` retains v1's
exact key order and meanings for parent, UTC timestamp, session reference, and
exact-statement SHA-256. `approvalPath` is the exact r3 repository path.
`supersededApproval` has exact key order `path`, `sha256`, `status`; it binds the
historical v2 approval file bytes with status `superseded-historical-evidence`.
No executable or Phase C verdict is present.

The r3 approval commit has exactly one parent and adds exactly that one regular
file. Its parent already contains all 19 approved-review files byte-identically
at their approved digests and the exact
historical approval bytes. Candidate or
verifier code cannot generate, stage, approve, or commit it. The existing
`legacy-memory-node-api-sdk-v2.json` remains unchanged and is not current
authority. The v1 approval is neither modified nor consulted. Squash, rebase,
parent change, or any later modification of the r3 approval path requires a new
Phase A candidate, statement, and approval-only commit.

Phase C uses only this same ordered 19-file set for topology and pre-load byte
verification. Every file must be regular, match its approved digest, be
byte-identical in the r3 parent and `HEAD`, and have no modifying commit from the
r3 parent through `HEAD`. This includes all five profile records and sidecars,
the dependency and human-license records and sidecar, ABI and undefined-import
records and sidecars, and the candidate aggregate and sidecar. Self-tests omit
and mutate each member individually and require all 38 adversaries to fail.

### 7.3 Phase C — clean acceptance

Phase C verifies approval topology and every committed byte before creating a
fresh offline target. It reproduces all five artifacts and all schema-v3
per-profile receipts exactly against approval-bound values before loading any
addon. It does not reproduce the candidate aggregate as an acceptance receipt;
it verifies that aggregate's committed digest. It then loads normal and fault
profiles only in their inherited fresh Bun children, loads observation only in
its §5 children, and runs all fake-adapter, settlement, counter, concurrency,
isolation, parity, lifecycle, OpenCode-normal-only, confinement, absence, and
full regression gates. Separately, it executes the 12 standalone phase-fixture
cases and validates each single post-completion transcript. No retry, receipt
regeneration in place, or fallback approval is allowed. Only after every
executable verdict is known and true does it atomically publish the §6 acceptance
receipt as its final action and report `qualified`; failure leaves that receipt
absent.

Per ADR 0060, candidate and acceptance bind a closed absolute tool map and a
closed child-environment policy. Inherited `PATH` bytes are excluded from every
reproducibility digest. Child `PATH` is fixed to
`/usr/bin:/bin:/usr/sbin:/sbin`; rustc and linker paths are explicit. The local
OpenCode beta-17595 executable and package are path/hash/version bound and only
that absolute executable may run in Phase C. A separate negative probe reads the
original inherited `PATH`, records the first ambient OpenCode path, executable
and package hashes, and version (or records absence), and never executes it.
The approval introduced by commit `76677a35f56a7e65c5828bdde9b8436fd848eb67`
is immutable historical evidence but insufficient for this replacement
candidate. The r2 approval is likewise immutable but insufficient because its
candidate used divergent locale-sensitive and default ordering. Phase C selects
only the r3 path and verifies its unique add commit,
bound parent, one-path diff, ancestry, parent receipt bytes, and absence of later
modification.

## 8. V2 acceptance matrix

Every row is mandatory and fail-closed:

| Gate            | Phase A candidate requirement                                                                                                                       | Phase C acceptance requirement                                                                                                                                                   |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| profiles        | five canonical profile receipts; exact cfg and pairwise artifact inequality                                                                         | rebuild all five artifact and profile-receipt bytes to approval-bound digests                                                                                                    |
| schemas         | bind v1 info, observation info/header, envelope grammar, and exact parity schemas                                                                   | verify bound schemas before load; exact header plus unchanged parity suffix                                                                                                      |
| counters        | bind ten actual mutation AST nodes/parents and nine separately cardinality-checked recorder call sites                                              | verify exact vectors, input byte counts, zero/one invariants, and actual-addon 1/2/8/32 request isolation; make no barrier claim                                                 |
| phase core      | bind exact shared core, three real callback-call-site AST rows, and standalone fixture source/build/artifact/transcript schema; compile/static only | execute all three prescribed schedules at widths 1/2/8/32; accept one closed transcript per process; record `controlledPhaseCoreInterleaving` independently                      |
| settlement      | bind fake-adapter source/vector digests; statically prove the sole raw invocation site is inside the adapter; execute no fake vectors               | execute fake success/failure/panic vectors for all profiles; Promise-observe host result; prove at most one raw invocation and no retry; `settlementAttempts` remains claim-only |
| receipts        | immutable candidate profile receipts and aggregate contain static verdicts only                                                                     | after all gates pass, atomically publish distinct receipt referencing candidate/approval; any failure leaves it absent                                                           |
| isolation       | observation loader class is isolated Bun child; normal is sole OpenCode-capable class                                                               | observation never reaches OpenCode/plugin/package/release; OpenCode loads normal only                                                                                            |
| absence         | normal artifact contains none of the closed observation strings; fixture is standalone and absent from all packaging inventories                    | repeat string/package/composition/fixture inventories after execution and cleanup                                                                                                |
| inherited gates | dependency/license/compiler/environment/ABI/import/Mach-O closure                                                                                   | v1 parity, lifecycle, confinement, packaging, authority, M2/M6, and full regressions unchanged                                                                                   |

Candidate aggregate and Phase C acceptance receipt equality is neither required
nor permitted. Qualification succeeds only when every rebuilt artifact and
per-profile receipt matches approval and every executable verdict is true.

Required static tests inject and reject: an eleventh/missing/aliased mutation;
a tenth/missing/aliased recorder call; a callback call redirected away from the
shared core; a copied fixture core; controller ownership of a counter or result;
static/thread-local/per-env/filesystem/network/environment/JavaScript
coordination; Node-API symbols or addon file type; fixture membership in the
five-profile set; prefixed canonical digest rows; and any package, bundle,
provenance, generated-plugin, install, or release inclusion. Positive scanner
tests must independently bind ten mutation rows, nine recorder rows, three real
callback rows, one raw-settlement row, and the complete raw scanner output.

Required Phase-C tests independently run the actual addon width matrix and all
12 controlled fixture cases. Transcript tests reject output before join, more or
less than one line, `closed` other than `true`, wrong key order/schema/event
count/schedule/request order/vector, duplicate or missing request IDs, stderr,
timeout, or panic. A test must demonstrate that true profile and lifecycle
counts cannot set either concurrency verdict and that one verdict cannot set the
other. Packaging absence is rechecked after fixture cleanup.

## 9. Authority and non-goals

The sole verifier-temp, empty-registration OpenCode beta-17595 plugin remains the
only composition exception and loads normal only. Ledger v1 remains sole
lifecycle authority; EventCapture remains observation-only; evidence metadata
is authoritative only through Ledger; the development evidence slice remains
uncomposed and non-authoritative; M2 and M6 are unchanged.

There is no normal plugin composition, persistence, shadow influence, migration,
dual-write, cutover, package/public SDK, install/release asset, broad Node or
other-platform support, deployment, production use, or same-process unload
claim. Passing observation gates answers only whether this private qualification
build preserved request-local results under observed host concurrency. Passing
the standalone fixture gate answers only whether the exact shared core behaved
under its prescribed controlled schedules; it makes no claim about Bun's
natural schedule.

## References

[Runtime ADR 0059](../decisions/0059-controlled-phase-core-concurrency-evidence.md),
[plugin ADR 0029](../../../plugin/opencode2/docs/decisions/0029-controlled-phase-core-concurrency-companion.md),
[Runtime ADR 0058](../decisions/0058-fifth-node-api-control-flow-observation-artifact.md),
[plugin ADR 0028](../../../plugin/opencode2/docs/decisions/0028-fifth-node-api-control-flow-observation-companion.md),
[runtime ADR 0057](../decisions/0057-private-node-api-sdk-qualification.md), and
[Node-API SDK v1](legacy-memory-node-api-sdk-v1.md).
