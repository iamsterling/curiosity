# ADR 0056: Rust-native legacy memory parity tranche

**Status:** Accepted 2026-08-19 for exactly the removable private parity
implementation described here; all authority, integration, migration, release,
and production changes remain NO-GO

## Context

Numbering was checked against `docs/decisions/`: 0055 is the highest numbered
runtime ADR, so 0056 is the next available number. The source baseline is commit
`12ac2c4ca06d0f6ccfc479249a53aad977b70322` (`12ac2c4`). At that commit the
plugin's TypeScript Ledger v1 remains the sole lifecycle authority, EventCapture
remains only the observation owner, and evidence metadata is authoritative only
when recorded by Ledger. The separate development evidence slice is uncomposed
and non-authoritative. Authoritative persistence deliberately fails closed with
`PERSISTENCE_AUTOMATION_UNSUPPORTED`; that disabled behavior is a safety
semantic, not a defect for this tranche.

Runtime ADR 0041 requires one future evidence substrate but grants no
implementation authority. Proposed ADR 0048 recommends a read-only analyzer but
grants no implementation authority and reserves migration and cutover to
[plugin ADR 0024](../../../plugin/opencode2/docs/decisions/0024-durable-ledger-v2-and-capture-authority.md).
This decision resolves the apparent conflict by authorizing conformance work
only: it neither implements those designs nor moves their authority.

## Decision

Adopt the [legacy memory parity v1 specification](../specifications/legacy-memory-parity-v1.md)
as the complete contract for one private, removable Rust qualification tranche.
Implementation is **GO** only for:

- byte-for-byte reproduction of the existing JavaScript canonicalization for
  legacy parity, including its supported values and documented edge behavior;
- closed v1 Ledger entity and event decoders with the existing acceptance,
  diagnostic code/path, and failure-precedence behavior;
- the pure Ledger v1 replay reducer and its current last-event-wins views;
- a read-only inspector for explicitly supplied legacy Ledger v1 and
  EventCapture v1 roots;
- versioned, provenance-bound goldens and a black-box differential harness whose
  JavaScript oracle does not call Rust;
- deterministic injection or normalization of time, UUIDs, paths, directory
  order, and host-sensitive collation evidence; and
- a private native test adapter reachable only by qualification commands, with
  no package or plugin surface.

Plugin Ledger v1 remains the sole lifecycle authority before, during, and after
this tranche. EventCapture remains only the observation owner; its envelopes and
digests grant no lifecycle or evidence authority. Evidence metadata is
authoritative only through Ledger, while the development evidence slice remains
uncomposed and non-authoritative. Rust output is a conformance result only. It
cannot authorize, persist, acknowledge, repair, reconcile, promote, serve, or
migrate anything.

Legacy canonical bytes are intentionally reproduced, not endorsed as a new
canonical standard. Any new canonical profile, digest, normalization rule, or
digest migration requires a later owner-approved authority decision.

## Explicit exclusions and stop conditions

This ADR prohibits authoritative persistence; Node-API or package export; plugin
composition; shadow authority; dual-write; migration mode; v2 activation; writer
freeze or genesis; cryptographic, key-custody, or continuity-anchor production
decisions; M2 or M6 authority changes; TypeScript deletion; live roots; serving;
deployment; release; and production claims. The only dependency exception is
the exact optional, feature-only `ryu-js = 1.0.3` package, crates.io checksum
`04d056b875a9d2e6cb9a61d127afee9ac5999b9f87bcb32079d1318e505be714`, SPDX
license `Apache-2.0 OR BSL-1.0`, used solely by the non-default
`legacy-memory-parity` feature for ECMAScript finite-f64 rendering. This permits
only the corresponding `Cargo.toml` declaration/feature edge and `Cargo.lock`
root edge/package receipt. No other direct, transitive, build, development, or
target dependency delta is authorized.

Stop and seek a new ADR if parity requires changing TypeScript behavior or
diagnostics, blessing a Rust result without the independent JavaScript oracle,
writing to an inspected root, accepting unknown v1 fields or versions beyond the
baseline, exposing the adapter, changing any authority, or deciding an ADR 0024
production/cutover gate.

The target direction—Rust as the eventual memory/evidence authority with a thin
Node-API TypeScript SDK—is proposed future architecture only. Cutover remains
blocked by an accepted Ledger v2 schema and mapping; canonical/digest migration;
qualified fencing and persistence; custody, cryptography, keys, and external
anchor choices; authorization, retention, hold, erasure, backup/restore, and
reconciliation policy; Node-API ABI/package/security qualification; migration
ceremony and rollback evidence; M2/M6 owner approval; production tests; and a
separate irreversible authority decision.

## Binary acceptance

The implementation is accepted only when all are true:

1. Every semantic inventory row, valid/invalid golden, diagnostic code/path,
   and precedence vector in parity v1 passes unchanged in JavaScript and Rust.
2. Differential tests use the built JavaScript baseline as a black-box oracle
   independent from Rust conformance code; fixed goldens record provenance and
   cannot be silently regenerated or blessed.
3. Repeated and permuted runs, injected nondeterminism vectors, and supported
   baseline environments produce identical bytes, inventories, reducer views,
   and normalized diagnostics.
4. Required semantic mutants—key ordering, undefined omission, version/unknown
   key checks, sequence/previous/digest order, entity validation, and reducer
   transitions—are each killed by an unchanged test.
5. A write-denied probe and before/after inventory prove zero created, removed,
   renamed, content-changed, or mode-changed entries in every inspected root.
6. The adapter is test-only, private, unexported, uncomposed, network-free, and
   has no authority or persistence operation. The exact `ryu-js` Cargo receipt
   is the sole dependency-manifest/lock exception. Baseline default,
   no-default-feature, and release dependency trees remain unchanged; only the
   explicit parity-feature tree contains `ryu-js`. Package exports, plugin
   composition, JavaScript package dependencies/lockfile, and current TypeScript
   source remain unchanged except for the enumerated test harness paths.
7. All exact commands in parity v1 pass, and independent diff review finds no
   forbidden capability or authority change.

This ADR grants implementation authority; it does not claim these gates have
already passed.

ADR 0057 is the sole narrow exception to this ADR's Node-API prohibition. It
permits only a separate, removable test-only transport qualification that reuses
this ADR's protocol bytes unchanged, plus one verifier-temp, non-authoritative
OpenCode test plugin that loads and executes it once. It does not widen this
implementation, move authority, permit normal plugin composition, or approve an
SDK/package/release surface.

The implementation-path amendment recorded in parity v1 §6 authorizes only the
root/runtime private verification-script entries and exact runtime boundary
allowlist updates needed to invoke and police this tranche. It does not authorize
any dependency beyond the exact optional `ryu-js` receipt, or any export,
package-files, installation, composition, or publication change.

## Consequences and unresolved owners

The first implementation can establish whether Rust exactly understands legacy
memory/evidence semantics without creating a second system of record. The cost
is preserving observable legacy quirks inside the parity profile.

Owners must later decide the new canonical profile and digest migration, Ledger
v2 schema/mappings and cutover ceremony, production persistence/security policy,
Node-API ABI and SDK distribution, M2/M6 convergence, and TypeScript retirement.

## References

[Plugin ADR 0026](../../../plugin/opencode2/docs/decisions/0026-rust-native-legacy-memory-parity-companion.md),
[runtime ADR 0057](0057-private-node-api-sdk-qualification.md),
[runtime ADR 0041](0041-unified-retrieval-memory-evidence-substrate.md), and
[runtime ADR 0048](0048-retrieval-migration-topology-and-qualification.md).
