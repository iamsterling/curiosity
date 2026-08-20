# ADR 0057: Private Node-API SDK qualification

**Status:** Accepted 2026-08-19 for the exact removable, test-only
qualification described here, including one ephemeral verifier-owned OpenCode
test-plugin path; normal plugin composition, authority transfer, package
publication, release, and production remain NO-GO

## Context

Numbering was checked against `docs/decisions/`: ADR 0056 is the highest
numbered runtime decision, so 0057 is the next available number. ADR 0056 proved
a private Rust implementation against the unchanged JavaScript legacy-memory
oracle but deliberately prohibited Node-API. The next uncertainty is narrower:
whether Bun can safely load a Rust Node-API bridge and preserve the exact ADR
0056 request and response bytes under the repository's pinned private host.

This is transport qualification, not a memory architecture or authority
decision. Plugin Ledger v1 remains the sole lifecycle authority. EventCapture
remains observation-only, evidence metadata is authoritative only through
Ledger, and the development evidence slice remains uncomposed and
non-authoritative. M2 and M6 are unchanged.

## Decision

Adopt [legacy memory Node-API SDK v1](../specifications/legacy-memory-node-api-sdk-v1.md)
as the complete contract for one removable qualification. It permits:

- a separate test-only Rust crate with exact direct `napi-sys = 3.3.0`
  (crates.io checksum
  `85fbf1fa9f1babfe396d74bbbf52b3643770243e8f5b0b46715d4caf7f0dfc9a`,
  SPDX `MIT`, default features disabled, only `napi4`) and inherited direct
  `ryu-js = 1.0.3` (checksum
  `04d056b875a9d2e6cb9a61d127afee9ac5999b9f87bcb32079d1318e505be714`,
  selected SPDX `Apache-2.0`) solely for the shared ADR 0056 dispatcher,
  provided the complete five-package third-party graph receipt passes;
- exactly two JavaScript-visible native exports: synchronous
  `qualificationInfo` bytes and asynchronous `execute` bytes;
- byte-for-byte reuse of the closed legacy-memory parity v1 protocol, without a
  new operation, envelope, diagnostic, or semantic interpretation;
- a thin TypeScript shim beneath plugin tests only; and
- copying the qualification artifact only into a verifier-created directory
  beneath the approved test temp root for hash-bound loading.

One additional composition probe is authorized: exactly one non-authoritative
test plugin created beneath that verifier temp directory may be loaded by the
lock-resolved OpenCode beta-17595 host, load the verified addon, execute one
fixed request, return an empty registration, and exit. It cannot influence a
host response or read/write normal plugin source, `dist`, configuration, state,
or live roots. This is not normal plugin composition authority.

The bridge owns copied input bytes before worker dispatch and returns newly
owned output bytes. Work occurs off the JavaScript thread; JavaScript values,
callbacks, `Env`, process-global mutable state, and authoritative roots are not
retained. Panics are contained at the native boundary. Inputs, outputs,
concurrency, and teardown are bounded. Closing the shim rejects new work and
awaits accepted work; it makes no same-process unload claim.

The bridge is handwritten raw N-API. Only native C pointers for module
registration, the two export entries, async execution, and async completion are
allowed. JavaScript callback values, references, TSFNs, cleanup hooks, global
lookup, `napi_call_function`, dynamic symbol lookup, and mutable global/per-env
state are prohibited. Candidate and acceptance builds require
`-Wl,-dead_strip_dylibs` and exactly `/usr/lib/libSystem.B.dylib`.
Oversized input returns the fixed bounded parity response without worker
dispatch. Allocation- and queue-failure probes reject their already-created
Promises and never throw synchronously. Every registration, export, conversion,
worker, and completion boundary is panic-contained with closed transport
mapping, and retained state is host-work-owned per request only.

The former high-level `napi`/`napi-derive`/`napi-build` candidate and every
receipt/artifact/digest derived from it are `superseded-invalid`; they cannot be
approved. Phase A must regenerate a schema-v2 raw-bridge candidate from a clean
target before any root-user approval request.

Qualification is pinned to Darwin arm64, Bun `1.3.14`, and the repository-lock
resolved OpenCode `0.0.0-beta-17595`. Ambient OpenCode, including
`0.0.0-beta-17639`, is not a substitute and causes preflight rejection. A Node
version may be recorded only as secondary harness evidence; this decision does
not approve Node support.

Any later plugin use requires a separate plugin authority decision **before**
composition, SDK distribution, shadow influence, persistence, migration, or
cutover is considered. Passing this qualification does not create that
authority.

## Binary acceptance

Acceptance requires every gate in the specification to pass, including:

1. exact loader path, artifact SHA-256, Mach-O arm64, dynamic dependency,
   Node-API symbol/ABI, two-export, qualification-info, and protocol-schema
   checks before execution;
2. exact byte equality with the ADR 0056 process adapter and independent
   JavaScript oracle for every parity vector, including malformed transport and
   bounded input/output cases;
3. lifecycle, concurrent execution, worker-pool saturation, close-during-work,
   repeated create/close, panic-containment, and process-exit teardown probes;
4. network denial, repository/fixture write denial, and before/after inventory;
5. absence from package exports, `files`, assets, `dist`, install/release
   manifests, normal plugin composition, and repository artifacts after the run;
6. a complete immutable receipt for every direct and transitive crate with
   version, source, checksum, license expression/text evidence, dependency edge,
   target/feature disposition, and lock hash, committed with its policy decision
   and digest; an explicit root-user approval statement followed by a distinct
   single-path approval-only commit whose parent already contains that candidate;
   and clean-build byte-for-byte reproduction before any load/execute; and
7. all legacy parity and full repository/plugin regression gates passing with
   authority, M2, and M6 reports unchanged.

This ADR grants implementation authority for those test-only paths and
dependency receipts. Candidate generation may compile but cannot load or execute
the addon. Until the candidate digests are presented to the root user, explicitly
approved, recorded in the single-path approval-only commit, and reproduced by a
clean acceptance build, status is `candidate/not-qualified`. The approval commit
records its parent, exact approval timestamp/session reference, and digest of the
root-user statement. Squash/rebase, parent change, or later approval-path
modification invalidates qualification and requires reapproval. Git author data
is not a cryptographic signer claim. This ADR does not assert that those gates
have passed.

## Prohibitions and stop conditions

No authoritative persistence, shadow influence, normal plugin composition,
migration, M2/M6 change, public SDK, package export, asset, `dist` copy,
installation, deployment, release, production use, TypeScript retirement, broad
Node support, or same-process unload claim is authorized. The sole composition
exception is the one temp-root test plugin above. No dependency may enter the
runtime crate, plugin package, workspace JavaScript manifests, or root
`bun.lock`.

Stop for a new decision if qualification needs a third export, protocol change,
retained JavaScript state, global mutable state, callback, authoritative/live
root, write/network capability, ambient host binary, non-pinned platform or
version, package surface, plugin registration, or behavior/diagnostic change.
The sole registration exception is the exact §5.1 verifier-temp OpenCode
beta-17595 test plugin: it may return only `{}` after its one fixed load/execute
probe. Any other plugin registration, non-empty registration, hook/tool/command/
transform exposure, or composition path still triggers this stop condition.

## References

ADR 0058 narrowly supersedes this decision's four-artifact and
same-qualification-schema requirements. This decision is otherwise preserved;
its v1 approval remains immutable historical evidence and is insufficient for a
v2 candidate.

[Runtime ADR 0056](0056-rust-native-legacy-memory-parity.md),
[runtime ADR 0058](0058-fifth-node-api-control-flow-observation-artifact.md),
[plugin ADR 0027](../../../plugin/opencode2/docs/decisions/0027-private-node-api-sdk-qualification-companion.md),
[legacy memory parity v1](../specifications/legacy-memory-parity-v1.md), and
[plugin ADR 0024](../../../plugin/opencode2/docs/decisions/0024-durable-ledger-v2-and-capture-authority.md).
