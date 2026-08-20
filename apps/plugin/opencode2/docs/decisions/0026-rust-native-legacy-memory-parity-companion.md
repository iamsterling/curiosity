# ADR 0026: Rust-native legacy memory parity companion

**Status:** Accepted 2026-08-19 for private conformance-oracle and test-adapter
work only; plugin authority and production persistence remain unchanged and
disabled as already specified

## Context

Numbering was checked against `docs/decisions/`: 0025 is the highest numbered
plugin ADR and 0023 is unused, so 0026 is the next monotonically available
number. The baseline is commit
`12ac2c4ca06d0f6ccfc479249a53aad977b70322`. At that commit Ledger v1 is the sole
lifecycle authority, EventCapture owns host observations only, and evidence
metadata is authoritative only through Ledger. The development evidence slice is
uncomposed and non-authoritative. Material publication that cannot bind the
active fence rejects with `PERSISTENCE_AUTOMATION_UNSUPPORTED`. These are
controlling semantics, not bugs to route around.

[ADR 0024](0024-durable-ledger-v2-and-capture-authority.md) reserves exclusive
Ledger v2 authority, migration, cutover, persistence, cryptography, custody, and
anchor qualification. [Runtime ADR 0056](../../../../runtime/docs/decisions/0056-rust-native-legacy-memory-parity.md)
authorizes only a removable parity implementation and therefore does not
conflict with or partially activate ADR 0024.

## Decision

Permit the exact plugin-side oracle, fixtures, differential verifier, mutation
checks, and private native test-adapter seam named by the
[parity v1 specification](../../../../runtime/docs/specifications/legacy-memory-parity-v1.md).
The JavaScript baseline is the black-box oracle and must not import, call, share
decoder/reducer logic with, or derive expected values from Rust. Fixed goldens
are provenance-bound review artifacts, not Rust-generated snapshots.

Ledger v1 remains the sole lifecycle authority throughout. EventCapture remains
only the observation owner, and its records confer no lifecycle or evidence
authority. Evidence metadata is authoritative only when recorded through
Ledger; the uncomposed development evidence slice is non-authoritative. Rust may
return canonical bytes, decoded summaries, replay views, inventories, and
diagnostics to the verifier only. No result is accepted by plugin composition or
written to plugin state.

Byte-for-byte reproduction of current JavaScript canonicalization is selected
only for legacy parity. This ADR does not approve that algorithm for Ledger v2
or any new digest profile.

## Prohibitions

No authoritative persistence, plugin composition, Node-API, package export,
shadow authority, dual-write, migration mode, v2 activation, freeze/genesis,
cryptographic or anchor production decision, M2/M6 authority change, TypeScript
deletion, live-root inspection, deployment, release, or production claim is
permitted. Existing source behavior and stable diagnostics remain unchanged.

The proposed future shape—Rust authority behind a thin Node-API TypeScript
SDK—has no present authority. It remains blocked by every ADR 0024 gate plus a
new canonical/digest decision, exact migration mappings and ceremony, Node-API
ABI/package qualification, M2/M6 owner decisions, and a separate cutover ADR.

## Binary acceptance

Acceptance requires all runtime ADR 0056 gates plus: (1) the oracle runs against
the built baseline JavaScript; (2) the adapter and verifier are absent from
package exports, assets, plugin composition, and install manifests; (3) a
write-denied and before/after proof shows no inspected-root side effect; (4)
semantic mutation checks fail when each required behavior is perturbed; and (5)
`bun run verify` passes with authority/persistence capability reports unchanged.

This companion authorizes tests, not behavior or authority.

Plugin ADR 0027 and runtime ADR 0057 are the sole narrow exception to this
decision's Node-API prohibition. They permit only a separate test-only transport
qualification using the unchanged parity protocol and one verifier-temp,
non-authoritative OpenCode test plugin that loads and executes it once; they do
not permit normal plugin composition, package surface, persistence, migration,
or authority transfer.

## Owner decisions left open

Ledger/security/runtime owners retain all Ledger v2, canonicalization,
persistence, cryptography, anchor, migration, Node-API, M2/M6, cutover, and
TypeScript-retirement decisions.
