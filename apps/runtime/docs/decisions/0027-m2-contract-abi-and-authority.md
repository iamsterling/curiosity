# ADR 0027: M2 contract, ABI, and implementation authority

**Status:** Accepted 2026-08-18 for M2 only

## Decision and authority

The requester, acting as project owner for M2 legal/privacy-security, custody,
operations, and release gates, accepts ADRs 0025 and 0026 and authorizes the
bounded implementation in `apps/runtime`. Later milestones require their own
work and review and are not authorized by the stated full-plan intent.

M1 `curiosity.runtime/v0` and `web_search` validation/status behavior remain
unchanged when no corpus is configured. M2 opts in with an absolute state root
outside source and separate opaque operator-provisioned query/admin secrets.
Trusted bootstrap writes only their SHA-256 verifiers under `authority/`; the
public package exposes no unrestricted mint operation. Native query and mutation
calls carry and verify the applicable secret. Arbitrary same-process code with
memory manipulation, filesystem-race, or direct dynamic-library control is
outside this in-process capability threat boundary.
Admin operations are initialize, exact-fixture import, activate, rebuild,
withdraw, and delete. Query returns at most ten deterministic lexical passages,
each at most 512 Unicode scalar values, with document/snapshot versions.

The C ABI uses borrowed UTF-8 inputs only for call duration. Query output is
written into an explicit caller-owned 32 KiB buffer; Rust allocates no pointer
that crosses the boundary and retains no pointer. Native status integers are
mapped to stable redacted envelopes. There is no network, provider, adapter,
telemetry, background work, event stream, or runtime dependency.

## Acceptance and exclusions

Accept only if exact fixture/digests, capability separation, atomic visibility,
bounded deterministic query, corruption/symlink/traversal rejection, rebuild,
tombstone non-resurrection, M1 compatibility, Rust/Bun/root checks, and source
digest all pass. No latency/RSS, backup/restore, power-loss durability,
production, publication, packaging, or deployment claim is authorized.
