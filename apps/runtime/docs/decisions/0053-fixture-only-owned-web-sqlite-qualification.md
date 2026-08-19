# ADR 0053: fixture-only owned-web SQLite qualification

**Status:** Conditionally accepted 2026-08-19 only for this removable
development/qualification feature under the stable operator-root precondition;
advisory cleanliness is unresolved, and every production and release authority
remains NO-GO

## Context

ADR 0052 specifies an owned-web acquisition boundary but grants no implementation
or dependency authority. The owner separately approved a narrow qualification of
SQLite control/capture and static extraction using project-authored fixtures.

## Decision

Accept only the optional Rust feature `owned-web-qualification`. It contains a
closed event journal and transactional materialized views, hardened migrations,
frontier leases and fencing, immutable CAS objects and WARC-compatible records,
networkless UTF-8 `text/plain` and bounded static `text/html` extraction,
reconciliation, and the feature-only
`curiosity_runtime_owned_web_qualification_v1` ABI. Its trusted operator supplies
an absolute, pre-existing qualification root outside the source tree. The root
must be a real directory owned by the invoking UID with mode `0700`; it is never
created or permission-adjusted by the qualification process. Traversal and any
symlink component fail closed. The ABI admits only committed files under
`fixtures/owned-web-qualification/v1`.
Database files use SQLite `NOFOLLOW`; CAS and WARC children use directory-handle-
relative `openat` with `O_NOFOLLOW`, exclusive creation, and pre/post-open device
and inode checks. Root, database sidecar, object, and record inventories are
closed and revalidated during replay/reconciliation.
The operator root is distinct from the process-created mode-0700
`.owned-web-qualification-v1` subtree beneath it. Qualification is valid only
while that namespace is stable and controlled by the trusted operator: no
same-UID process, privileged process, or concurrent actor may rename, replace,
link, unlink, or otherwise mutate the operator root or qualification subtree
during an invocation. Such concurrent namespace mutation is explicitly outside
this tranche's threat model.

Retained descriptors, `openat`/`O_NOFOLLOW`, exclusive creation, fixed
inventories, and device/inode checks are defense-in-depth detection under that
precondition; they are not an OS isolation boundary or a guarantee against a
same-UID namespace adversary. Detected mutation rejects the invocation, but this
ADR does not claim race-free identity-conditioned unlink, recovery of renamed
state, universal cleanup outside the stable namespace, or rollback after every
post-commit mutation. Within an unchanged namespace, ordinary failure cleanup
removes only entries exclusively created and identity-recorded by the invocation
and preserves pre-existing entries.

The fixture-only proof adapter validates an explicit, manifest-pinned simulation
of an authenticated plugin ADR 0024 `LOCAL_COMMITTED` observation, bound to the
capture digest, receipt, anchor, authority, nonce, and proof digest. It is not a
Ledger implementation or real canonical proof. `LOCAL_PREPARED`, `EXTERNAL_APPENDED`, fetch
success, acquisition state, object presence, and WARC/CAS equality never grant
evidence eligibility. Events and materialized updates share one transaction;
idempotent replay requires an equal canonical digest, unequal reuse is collision,
stale fences cannot settle, reconciliation never invents success, selectors are
exact UTF-8 representation byte ranges, and tombstones suppress claim and read.
Live schema definitions are compared against a separately instantiated,
build-pinned canonical DDL map; the stored migration digest is additional only.
Reconciliation is bidirectional with exact event/view/lease/capture/
representation/passage/proof/artifact cardinality. Claims use `BEGIN IMMEDIATE`
and one conditional READY/prior-fence update. Tombstones append immutable
`TOMBSTONE_PUBLISHED` before materialization and cannot be changed or deleted.

The exact direct dependencies are `rusqlite 0.40.2` with `default-features=false`
and `bundled`, and `scraper 0.27.0` with `default-features=false`. The resolved
lock receipt is `native/Cargo.lock` SHA-256
`7f4d94576c860811baa0b9873db8015a23df5a4fd9d83d8283f618a8ad7caf4a`.
The bundled runtime must report SQLite `3.53.2` and source ID
`2026-06-03 19:12:13 d6e03d8c777cfa2d35e3b60d8ec3e0187f3e9f99d8e2ee9cac695fd6fcdf1a24`;
otherwise startup stops. System SQLite is not accepted. The exact transitive
license inventory and crate checksums are recorded in
[`owned-web-qualification-dependencies.md`](../licenses/owned-web-qualification-dependencies.md)
and `Cargo.lock`.

## Exclusions and reversibility

No live fetch, DNS, socket, redirect, browser, script/resource execution, PDF,
XML, charset guessing, unsafe body logging, production persistence, public/stable
ABI, package export, Ledger implementation or repair, index engine, Tantivy,
SearXNG change, deployment, or production readiness is authorized. The internal
TypeScript wrapper is unexported. The normal default build does not use this
feature, and the `--no-default-features` release must contain neither its symbol
nor SQLite/parser linkage. Removing the feature, modules, wrapper, fixtures,
tests, receipt, and this ADR restores the prior dependency-free native profile.

## Binary acceptance

1. The operator root pre-exists outside the source tree, is owned by the invoking
   UID with mode `0700`, and remains stable for the invocation; absent,
   permissive, wrong-owner, traversal, symlink, or wrong-type roots fail closed.
2. Exact bundled SQLite identity, hardening settings, migration ledger/schema
   fingerprint, and fixture-only path constraints pass or startup fails closed.
3. A test-only fault immediately after immutable capture-event insertion proves
   transaction rollback leaves no journal event, capture, representation,
   passage, receipt state, CAS object, or WARC record; a subsequent clean
   invocation succeeds. Replay, collision, sequence, fencing, divergence,
   selector, and tombstone tests pass.
4. Network-denied Rust and TypeScript qualification tests pass using only the two
   authored fixtures.
5. All-feature tests/build/clippy pass; no-default tests/build preserve the prior
   exported-symbol and linked-library inventory and contain no owned-web,
   SQLite, or scraper dependency.
6. An approved advisory scanner has no unapproved advisory; dependency/license
   receipts match the lock and Tantivy is absent.

The authoritative CI/developer entrypoint is
`bun run verify:owned-web-qualification`. It performs locked all-feature and
no-default Rust checks, release symbol/link verification, network-denied Rust and
TypeScript qualification, dependency trees, type checking, boundaries, and the
generated receipt check. It does not prove the excluded concurrent-mutation
scenario. No approved advisory scanner is currently installed; item 6 remains a
blocking residual, all gates are not claimed to have passed, and acceptance stays
conditional.

## Consequences

This tranche can qualify architecture mechanics without obtaining or serving Web
content. It provides no crawl or evidence authority. Any wider input, dependency,
ABI, persistence, fetch, index, or production use requires a later ADR and named
owner approvals.

## References

[ADR 0052](0052-next-retrieval-source-and-owned-web-specification-program.md),
[control/capture/extraction v1](../specifications/owned-web-control-capture-extraction-v1.md),
and [plugin ADR 0024](../../../plugin/opencode2/docs/decisions/0024-durable-ledger-v2-and-capture-authority.md).
