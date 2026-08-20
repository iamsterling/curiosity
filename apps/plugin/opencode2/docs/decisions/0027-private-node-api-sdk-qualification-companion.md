# ADR 0027: Private Node-API SDK qualification companion

**Status:** Accepted 2026-08-19 for a test-only Bun/OpenCode qualification seam
and one ephemeral verifier-owned test-plugin load; plugin authority, normal
composition, persistence, migration, release, and production remain unchanged
and NO-GO

## Context

Numbering was checked against `docs/decisions/`: ADR 0026 is the highest
numbered plugin decision, so 0027 is the next available number. Runtime ADR 0056
and plugin ADR 0026 authorize legacy-memory parity through an independent
JavaScript oracle and private process adapter. They do not qualify Node-API or
permit plugin composition.

[Runtime ADR 0057](../../../../runtime/docs/decisions/0057-private-node-api-sdk-qualification.md)
now authorizes only the removable transport qualification defined by the
[Node-API SDK v1 specification](../../../../runtime/docs/specifications/legacy-memory-node-api-sdk-v1.md).

## Decision

Permit a thin TypeScript shim under plugin tests to load the hash-verified
test-only native artifact from a unique directory beneath the approved test temp
root. The shim may expose only test lifecycle operations around the addon's
exact `qualificationInfo(): Uint8Array` and
`execute(request: Uint8Array): Promise<Uint8Array>` exports. It must not decode,
repair, normalize, bless, persist, or route protocol results into plugin state.

The qualifying addon is now only the schema-v2 raw `napi-sys 3.3.0`/N-API-4
bridge with direct `ryu-js 1.0.3` inherited solely for shared ADR 0056 dispatcher
semantics. The former `napi`/`napi-derive`/`napi-build` candidate, receipts,
imports, artifacts, and digests are `superseded-invalid` and cannot reach the
root-user approval gate. Regeneration must prove `-Wl,-dead_strip_dylibs`, only
`/usr/lib/libSystem.B.dylib`, and the root-user-approved frozen import list.

The shim must observe the corrected closed behavior: oversized input resolves
the bounded parity response without worker dispatch; allocation- and
queue-failure probes return rejected Promises, never synchronous throws; and
panic/FFI conversion, entry, worker, and completion failures map only to stable
closed transport outcomes. The addon retains only per-request host async-work
state and no JavaScript callback/reference, TSFN, cleanup hook, global lookup,
dynamic lookup, or global/per-environment mutable state.

The qualifying host is exactly Darwin arm64, Bun `1.3.14`, and the OpenCode CLI
resolved by this repository's lock at `0.0.0-beta-17595`. Tests invoke the
repository-resolved binary, verify its identity, and reject an ambient
`0.0.0-beta-17639` installation rather than treating it as compatible. Node is
not an approved runtime; when inherited scripts invoke it, its version is only
secondary recorded harness evidence.

Exactly one ephemeral test-plugin composition is permitted at the specification's
fixed path beneath the per-run verifier root. The beta-17595 host loads it once;
it loads the verified addon, checks qualification information, executes the one
fixed composition request once, and returns no hooks, tools, transforms, or
response content. It has no authority and no access to normal plugin `src`,
`dist`, configuration, state, or live roots. No other composition path is
authorized.

Ledger v1 remains the sole lifecycle authority. EventCapture remains the
observation owner only. Evidence metadata becomes authoritative only through
Ledger, and the development evidence slice remains uncomposed and
non-authoritative. M2 and M6 behavior and authority are unchanged.

## Required plugin gates

Acceptance is binary:

1. runtime ADR 0057 and the specification's complete gates pass;
2. plugin tests prove parity response-byte equality, malformed transport,
   concurrency, close semantics, panic containment, worker teardown, network
   denial, and write denial;
3. the shim and artifact are absent from package exports, `files`, assets,
   `dist`, build provenance, bundles, install candidates, release candidates,
   and all normal Promise/Effect feature composition; the sole ephemeral test
   plugin is present only beneath the verifier root and returns an empty
   registration;
4. no artifact remains in the repository after qualification, and temporary
   copies exist only beneath the approved root for the duration of the test;
5. `bun run verify` passes against the pinned repository-resolved OpenCode host;
   and
6. authority/persistence capability reports and M2/M6 regressions remain
   byte-equivalent to their approved baselines.

Candidate generation may compile only to produce static review material. It may
not load/execute the addon or invoke OpenCode. Candidate digests must be presented
to and explicitly approved by the root user. Approval is valid only through the
distinct single-path approval-only commit whose parent already contains the
candidate receipts; the clean acceptance build must reproduce every pinned
digest before load. Squash/rebase, parent change, or later approval modification
invalidates qualification and requires root-user reapproval. Git author metadata
is not a cryptographic signer claim. Until all of those gates pass, plugin-side
status is `candidate/not-qualified`.

## Prohibitions and future order

This companion grants test authority only. Except for the one fixed ephemeral
test plugin, it prohibits authoritative persistence, shadow influence, plugin
composition, migration, dual-write, cutover, M2/M6 changes, public SDK/package
surface, production/release claims, and same-process unload claims.

If this qualification succeeds, the next authority-bearing proposal must be a
plugin decision first. Runtime ownership, persistence, migration, or cutover may
not be inferred from qualification and may not precede that explicit plugin
decision. Canonical plugin ADR 0024 and all of its gates remain unchanged.

## References

[Runtime ADR 0057](../../../../runtime/docs/decisions/0057-private-node-api-sdk-qualification.md),
[runtime ADR 0056](../../../../runtime/docs/decisions/0056-rust-native-legacy-memory-parity.md),
[plugin ADR 0026](0026-rust-native-legacy-memory-parity-companion.md), and
[plugin ADR 0024](0024-durable-ledger-v2-and-capture-authority.md).
