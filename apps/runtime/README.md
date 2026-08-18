# curiosity-retrieval

Private, independent home for Curiosity web-search and retrieval architecture,
provider evaluation, deployment research, benchmarking records, and the
authorized M1 runtime, bounded M2 local corpus projection, M3 query package,
repository-only M5 gateway capability, the M4 `build_owned_crawl_snapshot`
operation, the exact local M6 synthetic cell, and the exact private M7 Darwin
arm64 release profile.

The dependency-free Rust core and in-process Bun shim live here under ADRs 0023
and 0027. ADR 0024 records M1 `GO`; ADRs 0025–0027 accept only the repository
fixture, canonical-file state, M2 contract/ABI, and implementation authority.
ADRs 0029 and 0030 accept only the M3 query boundary and first-adapter GO. ADRs 0031–0032 accept only the M5
repository implementation; production remains NO-GO.
The repository was split from
[`iamsterling/opencode2-config`](https://github.com/iamsterling/opencode2-config)
so retrieval decisions can evolve without coupling them to the OpenCode plugin,
Ledger, or Loop implementation.

## Contents

- [`docs/decisions/`](docs/decisions/) — architecture decisions; each ADR's own
  status distinguishes accepted decisions from proposals
- [`docs/research/`](docs/research/) — research index
- [`docs/research/products/`](docs/research/products/) — canonical live product
  research records
- [`docs/research/benchmarks/`](docs/research/benchmarks/) — canonical live
  benchmark records
- [`docs/research/cross-product-web-search-synthesis-2026-08-17.md`](docs/research/cross-product-web-search-synthesis-2026-08-17.md)
  — dated synthesis of the current product and benchmark inventory
- [`provenance/origin.md`](provenance/origin.md) — transfer and attribution record
- [`native/`](native/) and [`src/`](src/) — M1/M2 Rust core and TypeScript shim
- [`fixtures/m2-synthetic/v1.0.0/`](fixtures/m2-synthetic/v1.0.0/) — exact
  approved fictional M2 fixture, manifest, provenance limitations, and CC0 reference

Any `products.zip` archive is excluded from the canonical inventory; the live
`docs/research/products/` directory is authoritative.

ADR status is per document. ADRs 0020 and 0023–0032 are **Accepted** for their
stated bounds. ADRs 0021 and 0022 remain **Proposed**. M5 authorizes one fixed
repository adapter in source; production provider use remains NO-GO. Nothing
  authorizes generic/public crawling, generic fetch, publication, or production
  deployment. ADRs 0034–0038 authorize only the fixed local project-CA M6 cell;
  ADR 0039 authorizes only a private, single-machine Darwin arm64 archive profile;
  ADR 0040 records GO for the archive from source commit `0dfc71d` with SHA-256
  `3aa8e5ba6660cafefb3d3121ba1e652346f4019a78922a0ec689b04b32e06642`.
  ADR 0040 is a later documentation commit and is not the artifact source.

M4/M6 administration is isolated at `@curiosity/runtime/admin`; the query
package exports no admin operation. Callers must invoke foreground `runNext`.
The only network-capable crawl transport is fixed to `docs.m6-owned.test` and
loopback for the disclosed characterization test. Production/public crawl is
NO-GO.

## Boundaries

Search/retrieval documentation and the accepted M1/M2 query implementation belong here.
Curiosity execution records, Ledger/Loop design, generic research, harness
adapters, credentials, runtime state, and deployment state do not. This package
is private and is not authorized for publication or deployment.

## Private M7 release profile

`bun run m7:test` runs the source-level release utility, integrity, confinement,
archive, generated-script, and lifecycle tests. `bun run m7:build` is intentionally
usable only after the reviewed changes are committed and the worktree is clean;
it produces a deterministic `m7-<commit>.tar.gz`. Extract with
`bun tools/m7-release.mjs extract ARCHIVE DESTINATION`, then invoke the staged
scripts directly. ADR 0040 records full artifact and lifecycle acceptance for
that immutable source/archive pair. This completes M1–M7
repository/private-profile work only: production/public, M5-live, M6-crawl,
publication, signing, notarization, and other-platform gates remain NO-GO.

## M2 use

M1 callers remain corpus-absent unless they explicitly configure an absolute
state root outside this source tree and present an operator-supplied query
secret. Before use, the trusted project-owner/operator bootstrap creates the
state root and `authority/`, then writes `admin.sha256` and `query.sha256` as the
lowercase SHA-256 of two distinct opaque byte strings followed by LF. The
package exports no capability minting function. Callers pass the corresponding
bytes as `adminCapability` or `queryCapability`; native code verifies them for
every call. Admin authority is required for initialize, import, activate,
rebuild, withdraw, and delete. Secrets must not be request/session-derived or
committed. The FFI writes query JSON only to a caller-owned 32 KiB buffer and
retains no pointers.

M2 state is single-writer and local. Authoritative objects/records/commits/refs
and tombstones are distinct from `projections/`. Backups and restore are not an
M2 API. A stale `writer.lock` after process death fails closed and requires
operator verification that no writer exists before removal. Runtime state must
remain outside source and untracked.

M3 harnesses import only `@curiosity/runtime/query`, provide a canonical
workspace scope and operator query capability, and pass a researcher principal
envelope. The query entrypoint exports no administration. Its synchronous FFI
local FFI call is deadline-bounded but cannot be preempted after it starts. Query
entrypoints are asynchronous. Omitted source remains local/no-network; explicit
`searxng-gateway` requires trusted bootstrap repository configuration and uses
only the fixed endpoint. `M5_LIVE_SMOKE=1 M5_GATEWAY_TOKEN=... bun run
search:smoke` is optional, excluded from verification, and prints no result text
or credential.

This is an in-process separation against ordinary package consumers, not a
sandbox against arbitrary same-process code. Code able to inspect memory,
replace files between checks, or invoke/manipulate the dynamic library directly
is outside the capability boundary. Stdlib path checks reject every observed
symlink component and re-check before authoritative operations, but without
descriptor-relative `openat`/`O_NOFOLLOW` they cannot eliminate same-process
TOCTOU races. Temp-write, file sync, same-directory rename, and best-effort
directory sync are bounded filesystem measures, not a power-loss or
cross-platform durability guarantee.
