# Legacy memory Node-API SDK v1

**Status:** normative private implementation and qualification contract under
runtime ADR 0057 and plugin ADR 0027; test-only transport qualification

## 1. Boundary and pinned profile

This specification qualifies one removable Node-API bridge to the Rust
legacy-memory parity implementation authorized by ADR 0056. It does not change
the [legacy memory parity v1](legacy-memory-parity-v1.md) operations, framing,
limits, envelopes, diagnostic codes/paths, precedence, canonical bytes, or
authority. The process adapter remains a required independent transport oracle.

The only approved profile is:

| Dimension              | Required value                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| OS and architecture    | Darwin arm64 / `aarch64-apple-darwin`                                                      |
| Bun                    | exactly `1.3.14`                                                                           |
| OpenCode package/CLI   | repository-lock resolved `0.0.0-beta-17595`                                                |
| Protocol               | legacy-memory parity v1, protocol version `1`                                              |
| Approved artifact root | canonical path beneath `/private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode` |

The verifier records Darwin build/product versions, CPU architecture, Bun
version, the selected OpenCode executable canonical path and SHA-256, package
version, and lock-entry integrity. It invokes only the repository-resolved CLI.
An ambient executable is never selected; if ambient discovery reports
`0.0.0-beta-17639`, preflight fails with `SDK_AMBIENT_HOST_FORBIDDEN`. Any other
profile mismatch fails closed. A Node version may be recorded when inherited
regression tooling invokes Node, but is secondary evidence and creates no Node
support claim.

## 2. Isolated crate and dependency receipt

Implementation uses a new, separate, unpublished test-only crate. It must not be
a runtime-native feature, workspace package, plugin dependency, or member of any
release/build/default command. The only direct third-party crates are exactly:

```toml
[dependencies]
napi-sys = { version = "=3.3.0", default-features = false, features = ["napi4"] }
ryu-js = "=1.0.3"
```

`napi`, `napi-derive`, and `napi-build` are prohibited direct, transitive, build,
development, and target dependencies. No build dependency is authorized.
`napi-sys` provides raw declarations only: disabling its default `dyn-symbols`
feature is mandatory, `napi4` is the highest enabled feature, and
`napi_sys::setup`, `libloading` use, `dlopen`, `dlsym`, and equivalent dynamic
lookup are forbidden. `ryu-js` is inherited directly solely because the shared
ADR 0056 dispatcher requires its exact ECMAScript finite-f64 semantics; bridge,
loader, registration, Promise, and async-work code may not call it.

The exact current registry/lock pins are:

| Package              | Role/features                                                                    | crates.io SHA-256                                                  | Declared/selected license              |
| -------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------- |
| `napi-sys 3.3.0`     | direct; `default-features = false`; `napi4`                                      | `85fbf1fa9f1babfe396d74bbbf52b3643770243e8f5b0b46715d4caf7f0dfc9a` | `MIT` / `MIT`                          |
| `ryu-js 1.0.3`       | direct; shared dispatcher only                                                   | `04d056b875a9d2e6cb9a61d127afee9ac5999b9f87bcb32079d1318e505be714` | `Apache-2.0 OR BSL-1.0` / `Apache-2.0` |
| `libloading 0.9.0`   | transitive lock edge of `napi-sys`; code unreachable with `dyn-symbols` disabled | `754ca22de805bb5744484a5b151a9e1a8e837d5dc232c2d7d8c2e3492edc8b60` | `ISC` / `ISC`                          |
| `cfg-if 1.0.4`       | transitive through `libloading`                                                  | `9330f8b2ff13f34540b44e946ef35111825727b38d33286ef986142615121801` | `MIT OR Apache-2.0` / `MIT`            |
| `windows-link 0.2.1` | Windows-target lock edge only; not compiled on Darwin                            | `f0805222e57f7521d6a62e36fa9163bc891acd422f971defe97d64e70d0a4fe5` | `MIT OR Apache-2.0` / `MIT`            |

Besides the first-party root, that five-package set is the complete expected
lock/metadata closure. Any other package or edge fails candidate generation.
The `napi-sys` crate archive contains no standalone license file; the receipt
must record its normalized registry `Cargo.toml` `license = "MIT"` evidence,
archive checksum, and the retained canonical MIT text in the human receipt.
That text is pinned to `https://github.com/napi-rs/napi-rs`, tag
`napi-sys-v3.3.0` (annotated tag object
`bbad39cc6f1ce60af941933acaf6577b10b52a9a`), source commit
`679eb79f5cf3c7c6b2850f4ab46092126f23dc5c`, and the commit-addressed root
`LICENSE` content SHA-256
`3f1ce66533302df3a32edbfdfc0b78f0dd34659e4c1f5817162e5ea3c2297215`.
Project-local license text is not acceptable substitute evidence.

The regenerated dependency receipt uses `schemaVersion: 2` and
`design: "raw-napi-sys-v1"`. Its root dependency edges are exactly the two
direct rows above; its package array is exactly those five third-party rows plus
the first-party root; and it contains
`"forbiddenPackagesAbsent":["napi","napi-derive","napi-build"]`. The
regenerated ABI receipt also uses `schemaVersion: 2` and records
`bridge: "raw-napi-sys"`, N-API minimum 4, the four permitted native callback
roles, the exact imported-symbol categories/list, linker argument, dylib closure,
export set, and no-dynamic-lookup verdict. Schema-v1 receipts from the former
candidate are invalid inputs even if individual crate hashes coincide.

The process adapter's byte dispatcher is extracted without behavior change into
one shared source module under the existing `legacy_memory` tree. Both the
process binary and qualification crate compile that same source; the
qualification crate may use a Rust `#[path]` module edge to it but may not copy,
fork, wrap a subprocess, or reinterpret the protocol. It has no local-path crate
dependency and no other direct dependency is authorized. The qualification
crate has its own committed lockfile and exact enabled-feature declaration.
Default features not needed by the two-export bridge are disabled; any
feature-set change requires ADR review.

The committed machine-readable receipt must prove every direct and transitive
package in that lock closure. For each package it records name, exact version,
registry or immutable source, crates.io checksum, declared SPDX expression,
selected license branch, license-file SHA-256/text evidence,
direct/transitive/build role, parent edges, enabled features, target disposition,
and whether build/proc-macro code executes. It also records the manifest,
lockfile, and normalized dependency-graph SHA-256.

The closed approved SPDX set for this design is exactly `MIT`, `ISC`, and
`Apache-2.0`. `OR` expressions must select and record at least one approved
branch; every branch of an `AND` expression must be approved. Unknown,
custom/`LicenseRef`, missing, any other SPDX identifier, copyleft,
source-availability, field-of-use, or commercial terms are not approved. MIT/ISC
obligations are met by retaining exact copyright and license texts in the human receipt;
Apache-2.0 additionally retains the license, all applicable `NOTICE` content,
and a modification notice. The private test-only status does not waive an
obligation.

The receipt protocol has two qualification phases separated by a mandatory
root-user approval-commit gate. Its ordered states are:

### 2.1 A — non-qualifying candidate generation

Candidate generation may resolve the isolated lock, acquire checksum-verified
crates into its isolated temp `CARGO_HOME`, and compile normal and probe addons
in a clean temp target. It may run only static receipt tools (`cargo metadata`,
archive/license hashing, `file`, `lipo`, `otool`, and `nm`). It must not invoke a
JavaScript addon loader, call either native export, start OpenCode, execute the
addon, or report PASS/qualified.

All candidate material generated under the former `napi 3.12.1` /
`napi-derive 3.6.3` / `napi-build 2.4.1` design is invalid and cannot be
presented, approved, grandfathered, or reused. Its manifests, lock graph,
dependency/license receipts, ABI/import receipts, artifact hashes, and test
results have status `superseded-invalid`. A must regenerate every candidate
input and digest from a clean target using only the raw dependency design above.

It writes generated receipts and artifact digests under `$RUN_ROOT/candidate/`
and mirrors the proposed checked-in dependency, license, ABI, undefined-import,
and sidecar files under `$RUN_ROOT/proposed-checkin/` using their exact §7
repository-relative paths. Candidate tooling never writes those repository
paths. Candidate output is labeled `candidate/not-qualified`; compilation
success has no qualification meaning.

Candidate generation reports missing, ambiguous, yanked, git/path-substituted
third-party, checksum-mismatched, unknown-license, or policy-incompatible entries
but is allowed to finish compiling so the root user can review complete static
closure. Such a finding cannot be approved without an amended decision. A
top-level-only license list is insufficient. No build script may fetch or
perform network I/O; after the explicit acquisition step, compilation is offline
and locked.

At the end of A, the verifier emits
`$RUN_ROOT/candidate/root-user-review.json` containing exactly the proposed
approval record's `candidate`, `dependencyPolicy`, and `linkerPolicy` objects,
plus the canonical repository paths and SHA-256 values of every proposed
receipt/sidecar. It prints those exact receipt, graph, policy, linker,
normal-artifact, panic-artifact, allocation-failure-artifact, and
queue-failure-artifact digests for presentation to the root user. The root user
must receive that exact report before the approval question. A summary, omitted
digest, mutable link, or “tests passed” claim is not approval input.

### 2.2 B — explicit root-user approval-only commit

After candidate generation, the root user independently reviews source diffs, the
complete graph, archives/checksums, selected SPDX branches and obligations,
build/proc-macro code, Mach-O/ABI/export/import closure, and all four artifact
digests presented from A. Reviewed proposed receipt files must be copied and
committed at the §7 paths **before** approval is requested. The commit containing
those candidate receipts becomes the required parent of a later approval-only
commit.

Only an explicit approval statement from the root user after that presentation
opens the gate. The repository approval-handoff process then creates the record
at:

```text
apps/runtime/docs/approvals/legacy-memory-node-api-sdk-v1.json
```

Candidate generation, implementation code, build scripts, and verifier code may
never create or modify the approval record. The repository approval-handoff
process may create it only after the explicit root-user gate and only for the
single-path commit below. Before that gate, implementation must not create,
stage, or propose approval-record bytes. Its absence means
`candidate/not-qualified`. Candidate receipt sidecars, CI success, agent
self-approval, inferred consent, or verifier output cannot substitute for the
root-user statement.

The record is closed JSON with exactly this key structure and order; every
`Sha256` value is 64 lowercase hex, `sourceCommit` is 40 lowercase hex,
`approvalCommitParent` is 40 lowercase hex, `approvedAt` is RFC 3339 UTC, and
`sessionReference` is the exact non-empty root-session/message reference supplied
by the approval channel:

```json
{
  "schemaVersion": 2,
  "qualification": "legacy-memory-node-api-sdk-v1",
  "decision": "approve-candidate-for-clean-acceptance",
  "candidate": {
    "sourceCommit": "<40-lowercase-hex>",
    "sourceTreeSha256": "<sha256>",
    "manifestSha256": "<sha256>",
    "lockfileSha256": "<sha256>",
    "dependencyReceiptSha256": "<sha256>",
    "humanLicenseReceiptSha256": "<sha256>",
    "abiReceiptSha256": "<sha256>",
    "undefinedImportsSha256": "<sha256>",
    "normalArtifactSha256": "<sha256>",
    "panicArtifactSha256": "<sha256>",
    "allocationFailureArtifactSha256": "<sha256>",
    "queueFailureArtifactSha256": "<sha256>",
    "normalArtifactReceiptSha256": "<sha256>",
    "panicArtifactReceiptSha256": "<sha256>",
    "allocationFailureArtifactReceiptSha256": "<sha256>",
    "queueFailureArtifactReceiptSha256": "<sha256>"
  },
  "dependencyPolicy": {
    "normalizedGraphSha256": "<sha256>",
    "directDependencies": [
      {
        "name": "napi-sys",
        "version": "3.3.0",
        "checksum": "85fbf1fa9f1babfe396d74bbbf52b3643770243e8f5b0b46715d4caf7f0dfc9a",
        "selectedLicense": "MIT",
        "defaultFeatures": false,
        "features": ["napi4"],
        "authorizedUse": "raw-node-api-declarations"
      },
      {
        "name": "ryu-js",
        "version": "1.0.3",
        "checksum": "04d056b875a9d2e6cb9a61d127afee9ac5999b9f87bcb32079d1318e505be714",
        "selectedLicense": "Apache-2.0",
        "defaultFeatures": true,
        "features": [],
        "authorizedUse": "shared-adr-0056-dispatcher-only"
      }
    ],
    "forbiddenPackages": ["napi", "napi-derive", "napi-build"],
    "approvedSpdx": ["MIT", "ISC", "Apache-2.0"]
  },
  "linkerPolicy": {
    "rustflags": ["-C", "link-arg=-Wl,-dead_strip_dylibs"],
    "panicStrategy": "unwind",
    "loadDylibs": ["/usr/lib/libSystem.B.dylib"],
    "rpaths": [],
    "definedGlobals": ["napi_register_module_v1"]
  },
  "approval": {
    "approvalCommitParent": "<40-lowercase-hex>",
    "approvedAt": "<rfc3339-utc>",
    "sessionReference": "<exact-root-session-and-message-reference>",
    "rootUserApprovalStatementSha256": "<sha256>"
  }
}
```

`approvedAt` and `sessionReference` are copied exactly from the root-user approval
event. `rootUserApprovalStatementSha256` is lowercase SHA-256 over the exact UTF-8
bytes of the root user's approval statement as retained by that session/message,
with no trimming, newline insertion, Unicode normalization, or prefix. The
repository process recognizes that explicit root-user statement as approval
authority. Git author/committer identity is transport metadata only; this
mechanism makes no cryptographic signer, signature, key-custody, or identity-proof
claim.

The approval record pins primary receipt bytes, graph/policy, source inputs, and
candidate artifacts directly; receipt sidecars are consistency aids, not trust
roots. The approval-handoff commit has exactly one parent and its complete diff
contains exactly one added path:

```text
apps/runtime/docs/approvals/legacy-memory-node-api-sdk-v1.json
```

Its parent must already contain every pinned candidate receipt byte-for-byte.
The record's `approvalCommitParent` must equal that actual parent commit. The
verifier trusts only this committed root-user approval record plus its Git
topology. It rejects an absent, untracked, dirty, extra-key, reordered,
placeholder, malformed, pre-gate, multi-path, merge-commit, or later-modified
record.

### 2.3 C — clean acceptance build

Only after B may a separate acceptance run begin. Before build setup, the
verifier proves from Git objects that:

1. exactly one commit introduced the approval path and that commit is an
   ancestor of acceptance `HEAD`;
2. the introduction commit has exactly one parent and its complete diff has
   exactly the approval path, added as a regular file;
3. `approval.approvalCommitParent` equals the introduction commit's actual
   parent;
4. every candidate receipt named by the record existed in that parent and its
   `git show <parent>:<path>` bytes hash to the pinned digest;
5. the source/manifest/lock/graph/policy and four candidate artifact digests in
   the record equal the A report approved by the root user; and
6. no commit after the approval commit through acceptance `HEAD` modifies,
   deletes, renames, or re-adds the approval path.

The verifier obtains the introduction commit from path history, not from a
recorded self-claim. A squash that combines receipts and approval, a rebase that
changes the approval parent, history filtering, parent replacement, or any later
approval-path modification invalidates qualification with
`SDK_REAPPROVAL_REQUIRED`. New A receipts and a new explicit root-user approval/
approval-only commit are then required; digest equivalence does not preserve the
old approval.

After those history checks, C's `CARGO_HOME` and
`CARGO_TARGET_DIR` paths must initially be absent. The verifier creates them,
populates `CARGO_HOME` only with archive bytes already matched to the approval
record, leaves the target empty, and invokes `cargo --locked --offline`. Before
compilation it verifies the committed approval record, source/manifest/lock
digests, receipt bytes, graph/license policy, and crate archives against that
record. Any mismatch fails before compilation.

The clean build then regenerates all static receipts and all four artifacts. It
requires receipt bytes and artifact SHA-256 values to be byte-for-byte identical
to the approval record and approved checked-in receipts. Only after all those
comparisons pass may the verifier load an addon, call an export, start the §5.1
OpenCode probe, or run any execution test. Acceptance trusts no candidate temp
receipt, sidecar alone, generated approval, or current implementation assertion.
Failure leaves status `candidate/not-qualified`; only the complete C gates may
report `qualified`.

The human license receipt names the dependency JSON digest and every
selected-license obligation; the JSON names the human-receipt digest. To avoid a
digest cycle, the human file's embedded JSON digest is normalized to 64 zeroes
only while computing the `humanReceiptSha256` stored in JSON. The sidecar hashes
the final JSON bytes. Ephemeral receipts are supporting run evidence only and can
never satisfy dependency/license acceptance.

The runtime `Cargo.toml`/`Cargo.lock`, all JavaScript manifests, and `bun.lock`
remain unchanged by this tranche.

## 3. Native API and byte ownership

The loaded module has exactly two own enumerable string exports and no default,
alias, symbol, getter, mutable data, class, or nested namespace export:

```ts
qualificationInfo(): Uint8Array
execute(request: Uint8Array): Promise<Uint8Array>
```

The bridge is handwritten raw Node-API. Exactly these native C function-pointer
roles are permitted:

1. the externally defined `napi_register_module_v1` module-registration entry;
2. two hidden `napi_callback` export entries, one for `qualificationInfo` and one
   for `execute`;
3. one hidden `napi_async_execute_callback` for worker execution; and
4. one hidden `napi_async_complete_callback` for main-thread completion.

No other callback/finalizer/hook pointer is permitted. In particular, the bridge
must not accept, retain, create, reference, or invoke a JavaScript callback
value. `napi_ref`/reference APIs, thread-safe functions, cleanup hooks, instance
data, finalizers, global-object/property lookup, `napi_call_function`,
`napi_make_callback`, dynamic symbol lookup, and mutable global or per-`napi_env`
state are prohibited. It must not import `napi_get_global`,
`napi_get_named_property`, `napi_create_reference`, `napi_get_reference_value`,
`napi_delete_reference`, any `napi_*threadsafe_function*`, any
`napi_*cleanup_hook*`, `napi_set_instance_data`, `napi_get_instance_data`,
`napi_call_function`, or `napi_make_callback`.

The only permitted Node-API undefined-import categories and members are closed:

| Category                    | Exact permitted imported symbols                                                                                                                |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| registration and exports    | `napi_create_function`, `napi_set_named_property`, `napi_define_properties`, `napi_get_version`                                                 |
| request and byte conversion | `napi_get_cb_info`, `napi_is_typedarray`, `napi_get_typedarray_info`, `napi_create_arraybuffer`, `napi_create_typedarray`, `napi_create_uint32` |
| Promise/error values        | `napi_create_promise`, `napi_create_string_utf8`, `napi_create_error`, `napi_resolve_deferred`, `napi_reject_deferred`                          |
| async work                  | `napi_create_async_work`, `napi_queue_async_work`, `napi_delete_async_work`                                                                     |

An implementation may use a strict subset but may not add a member. Category
names grant no wildcard authority. Every undefined import must be classified in
the ABI receipt as exactly one of `node-api-v4` (members in the table),
`rust-runtime-allocator-unwind` (compiler/runtime support), or
`shared-dispatcher-read-only-filesystem` (ADR 0056 inspector reads). Network,
process-spawn, dynamic-loader, writable-filesystem, callback/reference/TSFN, and
cleanup categories are forbidden. Classification alone never admits a symbol:
all non-Node-API imports must also match the separately generated frozen
undefined-import list byte-for-byte. Candidate generation regenerates and
freezes the complete union; root-user approval pins its digest and per-symbol
classification. Any symbol outside the table or frozen list, or any symbol with
an unapproved/multiple category, fails candidate generation and acceptance.

There is one `RequestState` allocation per worker-admitted `execute`. It contains only
copied request bytes, closed result/error state, `napi_deferred`, and
`napi_async_work`. Ownership transfers to the host async-work `data` pointer
after successful creation and returns exactly once to the completion callback,
which deletes the work and drops the state. Before transfer, entry cleanup drops
it locally. No Rust queue, registry, map, singleton, environment cache, or other
global/per-env owner exists. Thus all retained request state is host-work-owned
and request-scoped; `napi_env` and `napi_value` are never stored in worker state.

Every `extern "C"` registration/export/execute/completion entry is enclosed by
`catch_unwind`. Every FFI conversion helper is total over raw status/type/length
inputs, is separately panic-contained, and maps failure to a closed
`TransportFailure` enum; no panic, Rust error text, pointer, or partial value
crosses an FFI boundary. The worker callback touches only `RequestState`. The
completion callback is the sole post-worker Node-API caller and maps success to
exact bytes or failure to one stable rejected Promise before reclaiming state.
If a Node-API status prevents that final settlement, the child harness records
`SDK_TRANSPORT_COMPLETION_FAILED`, closes the qualification process, and fails;
it never retries, throws a JavaScript exception, or leaves state reusable.

`qualificationInfo` returns a newly owned byte array on every call containing
one compact UTF-8 JSON line with trailing LF and this exact closed key order.
`<host-maximum>` is the base-10 integer returned by `napi_get_version` for the
loaded Bun process:

```text
{"schemaVersion":1,"protocol":"legacy-memory-parity-v1","protocolVersion":1,"transport":"node-api-bytes-v1","target":"aarch64-apple-darwin","napiMinimum":4,"napiHostMaximum":<host-maximum>,"napiSys":"3.3.0","ryuJs":"1.0.3"}\n
```

The addon is compiled with minimum Node-API level 4. The host maximum must be an
integer greater than or equal to 4; equality is not required. Every imported
`napi_*` symbol must be introduced by Node-API 4 or earlier according to the
committed symbol/version mapping in the ABI receipt. A host report below 4, a
missing report, an imported symbol newer than 4, or disagreement among the
compile feature, info bytes, imported-symbol receipt, and host report fails
before `execute`.

`execute` accepts only a `Uint8Array` and first reads only its JavaScript type,
offset, and `byteLength`, after first creating the Promise/deferred returned to
JavaScript. The hard transport ceiling is exactly 1,048,576 bytes.
If `byteLength` exceeds that ceiling, the implementation must not allocate or
copy the complete visible range, inspect its contents, or touch bytes outside
metadata access. It resolves with exactly these constant parity response bytes,
derived from length metadata alone:

```text
{"protocolVersion":1,"requestId":null,"status":"error","diagnostic":{"code":"PARITY_INPUT_TOO_LARGE","path":null}}\n
```

At or below the ceiling, the normal artifact copies the complete visible byte
range exactly once into Rust-owned memory before returning and neither retains
nor later reads the JavaScript backing store. It schedules those copied bytes on
the Node-API/libuv async worker mechanism, invokes the same bounded protocol
dispatcher as the process adapter, and resolves on the JavaScript thread with a
newly allocated `Uint8Array`. Returned arrays share no storage with inputs,
other outputs, Rust scratch buffers, or qualification-info bytes. Instrumented
copy-count tests and a guard-page/oversized-backing-store probe prove zero
payload reads/copies above the ceiling and exactly one input copy when accepted.
The over-limit constant response resolves the already-created Promise directly
on the entry thread and performs no `napi_create_async_work`, queue submission,
worker dispatch, or `RequestState` transfer. The sole below-ceiling copy
exception is the allocation-failure artifact's exact trigger in the fault table
below; it intentionally fails before allocation. Panic and queue probes copy
their exact accepted trigger once.

No worker retains `Env`, JavaScript values, references, callbacks, promises,
thread-safe functions, plugin objects, roots, or credentials. There is no
mutable process-global/native singleton, cache, queue outside the host worker
mechanism, runtime-owned thread, timer, watcher, signal handler, `atexit` hook,
or background task. Immutable compiled constants are permitted. Rust locks may
protect only per-request owned state and may not span JavaScript completion.

Wrong JavaScript argument count/type is a test-transport rejection with stable
code `SDK_INPUT_TYPE_INVALID`; it does not enter the parity dispatcher. Every
valid byte array at or below the ceiling, including malformed UTF-8/NDJSON, is
passed unchanged to the ADR 0056 dispatcher and returns its exact response
bytes. An over-limit array takes only the metadata-only constant-response path
above. Output remains bounded by parity v1. Allocation/scheduling/completion
failures reject with `SDK_TRANSPORT_FAILED` and no partial bytes, absolute path,
stack, or native exception text.

`execute` never calls `napi_throw`, `napi_throw_error`, or any JavaScript
function. Wrong input, injected allocation failure, injected queue failure, and
all closed transport failures after Promise creation settle by
`napi_reject_deferred`; they are never synchronous throws. The allocation probe
creates its Promise and stable rejection value before injecting the owned-input
allocation failure. The queue probe creates its Promise, copies once, creates
host async work, injects `napi_queue_async_work` failure, deletes that work,
reclaims the request state exactly once, and rejects the Promise without worker
execution.

The FFI boundary wraps all Rust entry paths in panic containment. Four
hash-distinct artifacts are built: normal, panic probe, allocation-failure probe,
and queue-failure probe. Each has exactly the same two exports and qualification
schema. Probe behavior is selected only by one mutually exclusive compile-time
cfg recorded in the source/build/artifact receipt:

| Artifact           | Exclusive cfg                    | Exact trigger request bytes                                                                                                              | Required result                                                                                        |
| ------------------ | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| panic              | `sdk_probe="panic"`              | `{"protocolVersion":1,"requestId":"sdk-panic","operation":"canonicalize","input":{"value":{"kind":"json","value":null}}}\n`              | exact parity `PARITY_INTERNAL_FAILURE` response; process survives                                      |
| allocation failure | `sdk_probe="allocation_failure"` | `{"protocolVersion":1,"requestId":"sdk-allocation-failure","operation":"canonicalize","input":{"value":{"kind":"json","value":null}}}\n` | Promise rejects with `SDK_TRANSPORT_FAILED` before the owned input allocation                          |
| queue failure      | `sdk_probe="queue_failure"`      | `{"protocolVersion":1,"requestId":"sdk-queue-failure","operation":"canonicalize","input":{"value":{"kind":"json","value":null}}}\n`      | input is copied once, queue submission is refused, and the Promise rejects with `SDK_TRANSPORT_FAILED` |

Each probe activates only on byte-for-byte equality with its trigger; every
other request behaves normally. Each per-run receipt binds artifact SHA-256,
source/lock/graph digests, cfg, trigger SHA-256, export/ABI/Mach-O receipts, and
expected result. The normal build command passes no `sdk_probe`, its receipt says
`normal`, binary scanning and behavior tests prove it contains none of the three
trigger byte strings or probe cfg markers, and its hash differs from every probe
artifact. Probe artifacts and receipts exist only beneath the approved temp root
and are removed after their fresh child process exits.

The panic probe panics after owning its designated request bytes but before
dispatch; containment returns exactly
`{"protocolVersion":1,"requestId":"sdk-panic","status":"error","diagnostic":{"code":"PARITY_INTERNAL_FAILURE","path":null}}\n`
without aborting the process or poisoning subsequent normal calls. The process
adapter's nonzero-exit rule remains unchanged; the in-process bridge has no
process exit to report. Probe behavior is transport fault injection, not a new
protocol operation or shippable variant.

## 4. Loader and artifact confinement

This section is executable only during C after the root-user approval-only
commit and after all pre-load digest comparisons in §2.3 pass. A-phase candidate generation may
perform the static inspections but stops before copying to a load path or using
any loader.

Build output is never loaded from the repository, Cargo target directory,
current directory, package tree, `dist`, or an ambient search path. The verifier:

1. verifies the source/manifest/lock/receipt hashes and builds the isolated crate
   under network denial;
2. computes the artifact SHA-256 and records it in a per-run receipt;
3. creates a mode-`0700`, non-symlink, unique directory whose canonical parent is
   the approved artifact root, then copies one mode-`0500` `.node` file there;
4. reopens without following symlinks, verifies regular-file kind, owner, mode,
   size, inode/path stability, and SHA-256 after copy;
5. loads only the canonical absolute copied path; and
6. removes the copy and run directory after the child qualification process
   exits, proving no repository or temp artifact remains.

Both A and C set `MACOSX_DEPLOYMENT_TARGET=15.0` and exactly
`RUSTFLAGS="-C link-arg=-Wl,-dead_strip_dylibs"`. The linker invocation receipt
must contain that exact link argument once and must not contain an overriding
`-no_dead_strip_inits_and_terms`, `-all_load`, `-force_load`, or second dead-strip
policy. The Rust profile and rustc receipt must also prove `panic=unwind`; abort
or an unknown panic strategy fails because it cannot satisfy the `catch_unwind`
boundary. Before candidate output is considered generated—and again before any
C load—`file`, `lipo -archs`, `otool -hv`, `otool -l`, `otool -L`, and `nm`
receipts must prove all of the following exact closure:

- one Mach-O 64-bit arm64 `MH_BUNDLE` slice, with no x86 or second architecture;
- `LC_BUILD_VERSION` platform `MACOS`, minimum OS `15.0`; the SDK version is
  recorded but need not equal the minimum;
- exactly one `LC_LOAD_DYLIB` install name: `/usr/lib/libSystem.B.dylib`;
- no `LC_LOAD_WEAK_DYLIB`, `LC_REEXPORT_DYLIB`, `LC_LOAD_UPWARD_DYLIB`,
  `LC_LAZY_LOAD_DYLIB`, `LC_ID_DYLIB`, or `LC_RPATH` command;
- no absolute non-system, `@rpath`, `@loader_path`, or `@executable_path` load;
  and
- after stripping the conventional leading Mach-O underscore, exactly one
  externally defined global symbol: `napi_register_module_v1`.

Candidate generation fails closed and emits no presentable review report if the
linker receipt lacks `-Wl,-dead_strip_dylibs`, if `otool -L` contains anything
other than `/usr/lib/libSystem.B.dylib`, or if any other closure rule above
fails. In particular, `/usr/lib/libiconv.2.dylib`—observed in the superseded
high-level candidate—is forbidden rather than grandfathered.

Undefined imports are not accepted by a broad category. The regenerated raw
candidate generates the normalized list with
`/usr/bin/nm -u -j "$artifact" | /usr/bin/sed 's/^_//' | LC_ALL=C /usr/bin/sort`,
commits that exact LF-terminated list and lowercase SHA-256 sidecar at the §7
paths, and obtains root-user review before PASS. Sorting retains duplicate rows. The
ABI receipt annotates every `napi_*` row with its introduction level and proves
it is at most 4; all non-`napi_*` rows must match the exact root-user-reviewed
Darwin list. At every later run the verifier regenerates the list and requires byte
equality and digest equality. Added, removed, renamed, duplicate, or differently
ordered imports fail; there is no “system,” “safe,” or other arbitrary-category
fallback.

After loading, property-descriptor inspection proves exactly the two native
exports, function arities (`qualificationInfo.length === 0` and
`execute.length === 1`), no prototype-added API, and exact
`qualificationInfo` bytes. Artifact path/hash, Mach-O receipt, exported native
symbol set, compiled minimum Node-API 4, host maximum Node-API greater than or
equal to 4, dependency lock hash, expected undefined-import digest, and
qualification schema must all agree before `execute` runs. Loader diagnostics
are stable `SDK_*` codes and never expose the approved-root absolute path.

## 5. Test-only TypeScript shim and lifecycle

The shim exists only beneath `apps/plugin/opencode2/tests/` and is imported only
by qualification tests. It takes the verifier-supplied canonical path and
expected hash; it performs no discovery, build, copy, fallback, download, or
package resolution. It validates the module and presents a per-client state
machine: `open`, `closing`, `closed`.

- `execute` in `open` tracks one accepted promise and enforces a verifier-set
  maximum of 32 in-flight requests; excess work rejects with
  `SDK_CONCURRENCY_LIMIT` before native dispatch.
- `close` atomically enters `closing`, rejects new calls with
  `SDK_QUALIFICATION_CLOSED`, waits for every accepted promise to settle, drops
  shim references, and becomes `closed`.
- repeated `close` returns the same completion; a post-close `execute` always
  rejects; one client's close does not alter another client's state.
- process exit after all clients close proves worker teardown with no hang,
  callback, timer, thread, or work completing after the close receipt.

Close does not call or claim `dlclose`, unload the addon, revoke already-copied
bytes, or cancel accepted native work. Same-process unload/reload is explicitly
out of scope; load-lifecycle probes use fresh child processes.

The shim, declarations, loader, and artifact are absent from plugin source,
exports, `files`, assets/manifest, `dist`, build provenance, generic bundles,
install candidates, release candidates, and Promise/Effect plugin composition.
No package script used by build/install/release may build or copy the addon.

### 5.1 Sole ephemeral OpenCode composition probe

Exactly one test-plugin composition path is authorized:

```text
$RUN_ROOT/opencode-test-plugin/qualification-plugin.ts
```

`$RUN_ROOT` is the canonical mode-`0700` per-run directory beneath the approved
artifact root. The verifier also creates only the companion
`$RUN_ROOT/opencode-test-plugin/opencode.json` needed to point the lock-resolved
OpenCode beta-17595 host at that file. `HOME`, `XDG_CONFIG_HOME`,
`XDG_CACHE_HOME`, and all OpenCode state/data/cache variables point to dedicated
siblings beneath `$RUN_ROOT`; ambient config and plugins are disabled. The host
executable is the canonical repository-lock-resolved beta-17595 binary already
hashed by preflight. Any ambient beta-17639 discovery fails before launch.

During plugin initialization, the generated self-contained test plugin invokes
the module loader exactly once for the already verified normal addon at its
canonical temp path, calls
`qualificationInfo` once, and calls `execute` once with exactly:

```text
{"protocolVersion":1,"requestId":"sdk-opencode-compose","operation":"canonicalize","input":{"value":{"kind":"json","value":null}}}\n
```

It requires exactly:

```text
{"protocolVersion":1,"requestId":"sdk-opencode-compose","status":"ok","result":{"bytesBase64":"bnVsbA==","byteLength":4}}\n
```

On mismatch it throws the stable test-only `SDK_COMPOSITION_PROBE_FAILED`; on
success it returns `{}` and registers no hook, tool, command, transform, event
handler, permission, response middleware, or state owner. The host performs no
model/provider request, and the test plugin cannot inspect or alter a user or
host response. Filesystem and network policy denies the test plugin read or
write access to normal plugin `src`, `dist`, package/config/state, `.opencode`,
live roots, credentials, and the repository except the already selected host
executable. It cannot load a probe artifact. The child exits immediately after
setup evidence is observed; the verifier removes the generated plugin/config and
proves no residue.

This one generated path is a non-authoritative loadability probe, not an
exception for normal Promise/Effect composition, package composition, ambient
configuration, persistence, shadow influence, or response influence.

## 6. Qualification matrix

All checks are required and fail closed:

### 6.1 Protocol and parity

- For every fixed and differential vector in parity v1, compare exact request
  bytes and exact response bytes among the JavaScript oracle normalization,
  process adapter, and Node-API bridge; decoded-object equality alone fails.
- Repeat in fresh processes, permuted order, sequentially, and concurrently.
- Cover empty, one-byte, missing-LF, extra-line, NUL, CR, invalid UTF-8, invalid
  JSON, wrong schema/version/request ID/operation/input, exact input limit,
  one-byte-over input, exact output boundary, and output-overflow behavior.
- For the one-byte-over case, prove by copy/read instrumentation and protected
  backing pages that only type/offset/`byteLength` metadata was observed and the
  exact constant `PARITY_INPUT_TOO_LARGE` bytes were returned. For the exact
  limit and every smaller input accepted by the normal artifact, prove exactly
  one pre-dispatch copy. Apply the one explicit allocation-probe exception and
  the pinned panic/queue copy counts from §3 only to their hash-bound artifacts.
- Prove input mutation/detachment after call cannot alter work and output
  mutation cannot alter any prior/later result.

### 6.2 Lifecycle, concurrency, and failure

- Run 1, 2, 8, and 32 simultaneous mixed requests, repeated worker-pool
  saturation, independent clients, close with no work, close during full
  saturation, repeated close, and post-close rejection.
- Run the compile-time panic probe, transport allocation/scheduling failure
  probes, promise rejection handling, abrupt child exit with work in flight, and
  a subsequent clean child run. Panic text and stack traces must not cross the
  boundary.

Lifecycle measurement is pinned and reproducible for this Darwin arm64/Bun
1.3.14 qualification only; these conservative ceilings are not production SLOs
or cross-host support claims. The verifier runs with `LC_ALL=C`, no other user
workload in its child process, and records `sysctl -n hw.memsize`, `sysctl -n
hw.logicalcpu`, and the full command/environment receipt. For child PID `$pid`,
each sampling point performs five samples 100 ms apart and uses the maximum:

```sh
/bin/ps -o rss= -p "$pid"
/bin/ps -M -p "$pid" | /usr/bin/awk 'NR > 1 { count += 1 } END { print count + 0 }'
```

RSS is interpreted as KiB. Sampling points are exactly: **S0**, child ready
before addon load; **S1**, immediately after load plus 10 sequential fixed
canonicalize-null warmup calls; **S2**, immediately after dispatching 32
maximum-size accepted requests and before awaiting them; **S3**, after all 32
settle; and **S4**, after `close` resolves and one second of an otherwise empty
event loop. The saturation fixture is exactly 1,048,576 bytes, validly framed,
and semantically rejected only after transport admission; its SHA-256 is pinned
in the run receipt. The child has a 15-second deadline from S0 through S4.

Every lifecycle child must satisfy all limits: RSS at every point at most
786,432 KiB; `max(S1..S4) - S0` at most 131,072 KiB; `S4 - S1` at most 65,536
KiB; threads at every point at most 64; `max(S1..S4) - S0` threads at most 16;
and S4 threads at most S1 threads plus 2. Negative deltas are retained as
observed, not clamped. Missing/zero/ambiguous `ps` output, timeout, late
completion, stderr leak, or a single ceiling exceedance fails.

Fresh-process teardown uses exactly 100 sequential child invocations, numbered
1 through 100, each performing load, the same 10-call warmup, one execute,
close, one-second idle, and clean exit under:

```sh
/usr/bin/time -l bun apps/plugin/opencode2/tests/qualification/legacy-memory-node-api-sdk.test.ts --fresh-process "$run"
```

The parser records Darwin `maximum resident set size` in bytes, elapsed time,
exit status, and the same S0/S1/S4 thread/RSS samples for every run. Each run
must finish within 15 seconds, use at most 805,306,368 bytes maximum RSS, and
stay at or below 64 threads. Across the ordered 100-run maximum-RSS series, the
ordinary least-squares slope—`sum((i-50.5)*(rss_i-mean_rss)) /
sum((i-50.5)^2)` for `i=1..100`—must be at most 262,144 bytes per run, and the
median of runs 81–100 minus the median of runs 1–20 must be at most 16,777,216
bytes. The long-lived parent verifier is sampled by the same commands before run
1 and after run 100; its RSS must stay at or below 524,288 KiB, its increase at
or below 65,536 KiB, its threads at or below 64, and its thread increase at or
below 4. There is no retry, discarded outlier, adaptive warmup, or widened local
tolerance.

### 6.3 Confinement and packaging absence

- Run build and execution with network denied. Give ordinary native execution
  children read-only access only to request fixtures and the selected copied
  addon. The §5.1 OpenCode child may additionally read its generated plugin/config
  and read/write only its dedicated temp state siblings. Deny every child reads
  from normal plugin/config/live roots and writes to repository, fixture,
  package, normal config/state, and authoritative roots.
- Record before/after path, kind, mode, size, and SHA-256 inventories for the
  repository, fixtures, approved per-run directory, package `dist`/assets, and
  install/release staging. Only the build/probe artifacts, receipts, and §5.1
  generated plugin/config/state explicitly declared by this specification may
  exist during the run; all are removed afterward.
- Search source maps, declarations, manifests, package archives, bundles,
  provenance, exports, assets, `dist`, install/release candidates, and composed
  feature graphs for the crate, shim, `.node` name/hash, loader, and exports;
  every production/package occurrence fails.
- Create and run exactly the §5.1 ephemeral beta-17595 test plugin, then prove it
  registered nothing, executed exactly once, influenced no response, touched no
  normal plugin/config/state/live root, and was removed. Any second generated or
  normal composition path fails.

### 6.4 Dependency and regressions

- Verify the committed complete dependency receipt and digest, human-receipt
  binding, approved SPDX branch and obligations, checksums, license texts, lock
  hash, feature graph, build-script disposition, offline locked rebuild, and
  absence of changes to runtime/plugin/root dependency closures.
- Require schema-v2 `raw-napi-sys-v1`, exactly the five-package third-party
  closure and pins in §2, no `napi`/`napi-derive`/`napi-build`, no build
  dependency, disabled `dyn-symbols`, no dynamic lookup, the exact linker flag,
  one `libSystem` dylib, and the root-user-approved frozen import-list digest.
- Run ADR 0056's complete parity suite unchanged, runtime full verification,
  plugin `bun run verify`, root type/lint/build checks required by the repository,
  pinned real-host ABI checks, and M2/M6 regression/capability reports.
- Diff package exports/files/assets/dist/release/composition and authority/
  persistence reports against baseline. Any difference fails even when tests
  otherwise pass.

Candidate generation and acceptance are different commands and cannot be
combined. From repository root, A is exactly:

```sh
APPROVED_ROOT=/private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode
RUN_ROOT=$(/usr/bin/mktemp -d "$APPROVED_ROOT/legacy-memory-node-api-sdk.candidate.XXXXXX")
CARGO_HOME="$RUN_ROOT/cargo-home" \
CARGO_TARGET_DIR="$RUN_ROOT/cargo-target" \
MACOSX_DEPLOYMENT_TARGET=15.0 \
RUSTFLAGS="-C link-arg=-Wl,-dead_strip_dylibs" \
bun apps/plugin/opencode2/tests/qualification/verify-legacy-memory-node-api-sdk.mjs \
  --phase candidate-generate \
  --run-root "$RUN_ROOT" \
  --proposed-checkin-root "$RUN_ROOT/proposed-checkin" \
  --root-user-review-report "$RUN_ROOT/candidate/root-user-review.json"
```

That command must print `candidate/not-qualified`, must not offer an acceptance
flag, and is successful only as receipt generation. It may not create or modify
the approval-record path. The exact review report and artifact/receipt digests
are presented to the root user. Candidate code and reviewed receipt files are
committed first; that commit is the proposed approval parent.

Only after the root user explicitly approves those presented digests does the
approval-handoff process materialize the JSON using the exact approval event
timestamp, session/message reference, statement digest, and current `HEAD` as
`approvalCommitParent`. It then runs exactly:

```sh
APPROVAL=apps/runtime/docs/approvals/legacy-memory-node-api-sdk-v1.json
PARENT=$(git rev-parse HEAD)
test "$(git status --short --untracked-files=all -- "$APPROVAL")" = "?? $APPROVAL"
for path in \
  apps/runtime/docs/licenses/legacy-memory-node-api-sdk-v1.md \
  apps/runtime/docs/licenses/legacy-memory-node-api-sdk-v1.json \
  apps/runtime/docs/licenses/legacy-memory-node-api-sdk-v1.sha256 \
  apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v1-abi.json \
  apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v1-abi.sha256 \
  apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v1-undefined-imports.txt \
  apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v1-undefined-imports.sha256
do
  git cat-file -e "$PARENT:$path"
done
git add -- "$APPROVAL"
test "$(git diff --cached --name-only)" = "$APPROVAL"
test "$(git diff --cached --diff-filter=A --name-only)" = "$APPROVAL"
git diff --cached --check
git commit --only "$APPROVAL" -m "docs(runtime): approve Node-API SDK candidate"
APPROVAL_COMMIT=$(git rev-parse HEAD)
test "$(git rev-parse "$APPROVAL_COMMIT^")" = "$PARENT"
test "$(git diff-tree --no-commit-id --name-only -r "$APPROVAL_COMMIT")" = "$APPROVAL"
```

No implementation or verifier command may run the materialization/commit block,
and the approval-handoff process may not run it before the root-user gate. Other
working-tree changes may exist but may not be staged into the approval commit;
the exact cached-path assertions make it approval-only.

After B, C is exactly:

```sh
APPROVED_ROOT=/private/var/folders/wr/8bsbkjgd46v11_cpt9rfqm2r0000gn/T/opencode
APPROVAL=apps/runtime/docs/approvals/legacy-memory-node-api-sdk-v1.json
APPROVED_ARCHIVES="$APPROVED_ROOT/legacy-memory-node-api-sdk-v1-approved-archives"
git diff --exit-code -- "$APPROVAL" \
  apps/runtime/docs/licenses/legacy-memory-node-api-sdk-v1.md \
  apps/runtime/docs/licenses/legacy-memory-node-api-sdk-v1.json \
  apps/runtime/docs/licenses/legacy-memory-node-api-sdk-v1.sha256 \
  apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v1-abi.json \
  apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v1-abi.sha256 \
  apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v1-undefined-imports.txt \
  apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v1-undefined-imports.sha256
RUN_ROOT=$(/usr/bin/mktemp -d "$APPROVED_ROOT/legacy-memory-node-api-sdk.acceptance.XXXXXX")
CARGO_HOME="$RUN_ROOT/cargo-home" \
CARGO_TARGET_DIR="$RUN_ROOT/cargo-target" \
CARGO_NET_OFFLINE=true \
MACOSX_DEPLOYMENT_TARGET=15.0 \
RUSTFLAGS="-C link-arg=-Wl,-dead_strip_dylibs" \
bun apps/plugin/opencode2/tests/qualification/verify-legacy-memory-node-api-sdk.mjs \
  --phase acceptance \
  --run-root "$RUN_ROOT" \
  --approved-archive-root "$APPROVED_ARCHIVES" \
  --approval-record "$APPROVAL"
```

The acceptance verifier first requires each named path to be a committed regular
file whose bytes equal `HEAD`, validates the root-user approval schema and Git
history, and copies only archive bytes pinned by it from `APPROVED_ARCHIVES` into
the fresh `CARGO_HOME`. It performs all pre-load comparisons in §2.3 before any
dynamic load or execution. `--phase acceptance` without the exact approval
record, with a candidate/proposed/temp record, or after invalidating history
fails `SDK_APPROVAL_REQUIRED` or `SDK_REAPPROVAL_REQUIRED` before compilation.

The implementation must expose one private verifier command and run, from the
repository root, at least this unchanged regression floor in addition to its
focused qualification probes:

```sh
git diff --check
bunx prettier --check \
  apps/runtime/docs/decisions/0056-rust-native-legacy-memory-parity.md \
  apps/runtime/docs/decisions/0057-private-node-api-sdk-qualification.md \
  apps/runtime/docs/specifications/legacy-memory-parity-v1.md \
  apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v1.md \
  apps/plugin/opencode2/docs/decisions/0026-rust-native-legacy-memory-parity-companion.md \
  apps/plugin/opencode2/docs/decisions/0027-private-node-api-sdk-qualification-companion.md
bun --version
bun run verify:legacy-memory-parity
bun run --cwd apps/runtime verify
bun run --cwd apps/plugin/opencode2 abi:check
bun run --cwd apps/plugin/opencode2 verify
bun run check-types
bun run lint
bun run build
git diff -- \
  apps/runtime/native/Cargo.toml apps/runtime/native/Cargo.lock \
  apps/runtime/package.json apps/plugin/opencode2/package.json \
  package.json bun.lock
git status --short
```

The focused verifier additionally runs its isolated crate build/test with
`cargo ... --locked`, the pinned Bun qualification specs, OpenCode beta-17595
real-host probe, dependency/license receipt, Mach-O/symbol/ABI inspection,
network/write-denied probes, package-absence search, and post-cleanup inventory.
The A and C invocations above are the exact private verifier modes; none of the
commands or phase separation may be removed, combined, or weakened.

## 7. Exact anticipated documentation and implementation paths

This documentation tranche changes only ADRs, specifications, indexes, and
constitutions. A later implementation under this accepted authority is closed to
these paths:

```text
apps/runtime/native/src/legacy_memory/mod.rs
apps/runtime/native/src/legacy_memory/protocol.rs
apps/runtime/native/src/bin/legacy_memory_parity_adapter.rs
apps/runtime/native-node-api-qualification/Cargo.toml
apps/runtime/native-node-api-qualification/Cargo.lock
apps/runtime/native-node-api-qualification/src/lib.rs
apps/runtime/native-node-api-qualification/tests/boundary.rs
apps/runtime/docs/licenses/legacy-memory-node-api-sdk-v1.md
apps/runtime/docs/licenses/legacy-memory-node-api-sdk-v1.json
apps/runtime/docs/licenses/legacy-memory-node-api-sdk-v1.sha256
apps/runtime/docs/approvals/legacy-memory-node-api-sdk-v1.json
apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v1-abi.json
apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v1-abi.sha256
apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v1-undefined-imports.txt
apps/runtime/docs/specifications/legacy-memory-node-api-sdk-v1-undefined-imports.sha256
apps/plugin/opencode2/tests/qualification/legacy-memory-node-api-sdk.ts
apps/plugin/opencode2/tests/qualification/legacy-memory-node-api-sdk.test.ts
apps/plugin/opencode2/tests/qualification/verify-legacy-memory-node-api-sdk.mjs
package.json
```

The approval JSON in its single-path root-user approval commit is the sole trust
root and is distinct from all generated receipts. The Markdown license document
is the human-readable companion to the committed
normalized JSON receipt and digest. The ABI JSON binds minimum N-API 4, the
host-maximum check, the exact exports, Mach-O closure, and each imported
`napi_*` symbol's introduction level; its sidecar binds its exact final bytes.
The normalized undefined-import list and digest are regenerated from the raw
schema-v2 candidate and root-user-reviewed before PASS. These committed review
artifacts are normative; per-run copies beneath the approved temp root are
supporting evidence only. The superseded schema-v1 files currently visible in a
candidate working tree are evidence of invalidation, not approvable receipts;
Phase A must replace their contents and sidecars together.

Every committed `.sha256` sidecar is exactly one LF-terminated line in the form
`<64 lowercase hex><two spaces><basename>`, generated with
`/usr/bin/shasum -a 256 <file>` from the final bytes. The verifier rejects an
absolute path, alternate basename, extra line, uppercase digest, or digest
mismatch.

`package.json` may add exactly one private verification script and no dependency,
export, `files`, binary, install, build, release, or publication change. Every
generated artifact, per-run receipt, source mutant, build directory, generated
test plugin/config, and copied `.node` remains untracked beneath the approved
test temp root and is removed after the run; none may appear beneath a listed
repository path. Candidate generation may compile before receipt approval but
cannot load, execute, or qualify. The full dependency/ABI receipts and artifact
digests must be independently reviewed and pinned by the root-user approval-only
commit before the clean acceptance build. No path under plugin `src`, `assets`,
or `dist`, runtime public source/exports, package `files`, release/install
tooling, or normal production composition is allowed.

The three existing native paths may change only to extract the process
adapter's byte dispatcher into the single shared protocol module and to compile
that module from both transports. The unchanged ADR 0056 process-adapter tests
and exact byte parity are the refactor gate. No legacy-memory semantic module,
runtime public export, C ABI, or existing Cargo manifest/lockfile change is
authorized.

## 8. Non-goals and future authority

There is no authoritative persistence, shadow influence, normal plugin
composition, migration, dual-write, cutover, M2/M6 change, public SDK,
production SDK, package surface, broad Node support, deployment, release, or
same-process unload claim. The sole composition exception is the §5.1 generated,
temp-root, empty-registration beta-17595 loadability probe.

Success answers only whether the exact private Bun/OpenCode/Darwin profile can
transport parity bytes safely. Any next composition proposal requires a new
plugin authority ADR first. Runtime authority, persistence, migration, and
cutover remain governed by later owner decisions and plugin ADR 0024.

## References

[Runtime ADR 0057](../decisions/0057-private-node-api-sdk-qualification.md),
[plugin ADR 0027](../../../plugin/opencode2/docs/decisions/0027-private-node-api-sdk-qualification-companion.md),
[runtime ADR 0056](../decisions/0056-rust-native-legacy-memory-parity.md),
[plugin ADR 0026](../../../plugin/opencode2/docs/decisions/0026-rust-native-legacy-memory-parity-companion.md), and
[plugin ADR 0024](../../../plugin/opencode2/docs/decisions/0024-durable-ledger-v2-and-capture-authority.md).
