# ADR 0060: Closed SDK v2 tool and environment policy

**Status:** Accepted 2026-08-20 as documentation authority for a replacement
schema-v3 SDK-v2 candidate only; it does not approve or qualify a candidate

## Context

The candidate approved by commit `76677a35f56a7e65c5828bdde9b8436fd848eb67`
bound the inherited `PATH` in its environment digest while Phase C also needed
that same `PATH` to select the lock-resolved OpenCode executable and reject an
ambient executable. Changing `PATH` broke receipt reproduction; retaining it
selected the ambient host. That approval remains immutable historical evidence
but is insufficient for Phase C and grants no qualification authority.

## Decision

A replacement candidate binds a closed tool map. Each tool has one canonical
absolute path and executable SHA-256; rustc, cargo, clang, ld, Bun, and Node also
bind version output. Lock-resolved OpenCode binds its local executable path and
SHA-256 plus package path, package SHA-256, and exact beta-17595 version without
executing OpenCode in Phase A. Qualification code invokes tools only through
those absolute paths.

Child processes receive only a closed environment allowlist. `PATH` is the fixed
system-runtime value `/usr/bin:/bin:/usr/sbin:/sbin`; it is never copied,
prepended, or derived from the inherited host `PATH`. Cargo receives explicit
rustc and linker paths. Normalized allowlist names, normalized values, and the
environment/tool policy digests are identical in candidate and acceptance
receipts.

Ambient OpenCode discovery is separate evidence. It scans the original inherited
`PATH`, resolves and hashes the first command and package, records its version as
forbidden, and never executes it. Ambient absence is also closed evidence.
Phase C executes only the bound local beta-17595 absolute path.

Static self-tests vary inherited `PATH`, relocate and mutate bound tools, cover
ambient absent/present/wrong-version cases, and prove explicit-path invocation.

The replacement uses the new immutable approval path
`apps/runtime/docs/approvals/legacy-memory-node-api-sdk-v2-r2.json`. Its
approval-only commit adds that path once and no other path. The record binds the
historical `legacy-memory-node-api-sdk-v2.json` path and file SHA-256 as
superseded evidence; the historical file is never current authority and remains
unchanged. Phase C requires the r2 add commit's sole parent to equal the bound
approval parent, requires every approved receipt and historical-approval byte to
already exist in that parent, requires the add commit to be an ancestor of
`HEAD`, and rejects any later r2 modification, squash, rebase, or parent change.
Static self-tests cover old-only, missing and uncommitted r2, wrong parent,
later modification, squashed history, and the valid replacement topology.

One canonical ordered 19-file approved-review set is shared by candidate
proposal generation and Phase C. The r2 record binds each exact path and SHA-256.
Topology and pre-load checks require every member to exist byte-identically in
the r2 parent and `HEAD`, match its approved digest, and have no intervening
modification. The set closes the dependency/human-license, ABI/import,
five-profile, aggregate, and every corresponding sidecar surface. Self-tests
individually omit and mutate all 19 members.

The r2 candidate exposed one remaining reproducibility defect: candidate archive
inventory rows used `localeCompare` while acceptance used default string sort.
A replacement r3 candidate imports one shared comparator/renderer in both
verifiers. Its rule is ascending unsigned UTF-8 bytes of normalized relative
paths, which is also Unicode code-point order for valid UTF-8 paths. Comparator
source and rule digests are receipt-bound. Mixed ASCII, case, punctuation,
combining, and non-ASCII vectors must produce byte-identical candidate and
acceptance inventories under inherited `C`, `en_US.UTF-8`, `sv_SE.UTF-8`, and
`tr_TR.UTF-8` locale values. The immutable r2 approval is superseded evidence;
new approval authority can exist only at
`apps/runtime/docs/approvals/legacy-memory-node-api-sdk-v2-r3.json`.

## Non-goals

This decision does not load an addon or OpenCode, approve, qualify, commit,
publish, or transfer authority. Any tool-map, executable-byte, package-byte,
allowlist, or policy-digest change requires a fresh candidate and approval.
